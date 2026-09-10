import "server-only";

import { db } from "elestampadero/server/db";

import type {
  DesignDetailDto,
  DesignSummaryDto,
} from "../../application/dto/design";
import type {
  DesignsRepository,
  DesignStatusValue,
} from "../../application/ports/designs-repository";

const detailInclude = {
  club: { select: { name: true, slug: true } },
  versions: {
    orderBy: { versionNumber: "asc" as const },
    include: { images: { orderBy: { position: "asc" as const } } },
  },
  comments: { orderBy: { createdAt: "asc" as const } },
  productLinks: { include: { product: { select: { name: true } } } },
} as const;

function toSummary(design: {
  id: string;
  clubId: string | null;
  club: { name: string; slug: string } | null;
  customerName: string | null;
  title: string;
  status: string;
  createdAt: Date;
  versions: { versionNumber: number }[];
}): DesignSummaryDto {
  return {
    id: design.id,
    clubId: design.clubId,
    clubName: design.club?.name ?? design.customerName ?? "Personalizado",
    clubSlug: design.club?.slug ?? null,
    customerName: design.customerName,
    title: design.title,
    status: design.status,
    latestVersionNumber: Math.max(
      0,
      ...design.versions.map((version) => version.versionNumber),
    ),
    createdAt: design.createdAt.toISOString(),
  };
}

async function getDesignById(id: string): Promise<DesignDetailDto | null> {
  const design = await db.design.findUnique({
    where: { id },
    include: detailInclude,
  });
  if (!design) return null;

  const commentAuthors = await db.user.findMany({
    where: {
      id: { in: design.comments.map((comment) => comment.authorUserId) },
    },
    select: { id: true, role: true },
  });
  const authorRoles = new Map(
    commentAuthors.map((author) => [author.id, author.role]),
  );
  const latestVersionNumber = Math.max(
    0,
    ...design.versions.map((version) => version.versionNumber),
  );

  return {
    ...toSummary(design),
    versions: design.versions.map((version) => ({
      id: version.id,
      versionNumber: version.versionNumber,
      title: version.title ?? null,
      description: version.description ?? null,
      imageUrl: version.imageUrl,
      imageUrls: version.images.length
        ? version.images.map((image) => image.url)
        : [version.imageUrl],
      status:
        version.status ??
        (version.versionNumber === latestVersionNumber
          ? design.status
          : "SENT_TO_CLUB"),
      changeNote: version.changeNote ?? null,
      createdAt: version.createdAt.toISOString(),
      updatedAt: (version.updatedAt ?? version.createdAt).toISOString(),
    })),
    comments: design.comments.map((comment) => ({
      id: comment.id,
      versionId: comment.versionId,
      authorName: comment.authorName,
      authorRole: authorRoles.get(comment.authorUserId) ?? "UNKNOWN",
      message: comment.message,
      createdAt: comment.createdAt.toISOString(),
    })),
    linkedProducts: design.productLinks.map((link) => ({
      productId: link.productId,
      productName: link.product.name,
    })),
  };
}

export const prismaDesignsRepository: DesignsRepository = {
  async listAll(): Promise<DesignSummaryDto[]> {
    const designs = await db.design.findMany({
      include: {
        club: { select: { name: true, slug: true } },
        versions: { select: { versionNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return designs.map(toSummary);
  },

  async listByClub(clubId: string): Promise<DesignSummaryDto[]> {
    const designs = await db.design.findMany({
      where: { clubId },
      include: {
        club: { select: { name: true, slug: true } },
        versions: { select: { versionNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return designs.map(toSummary);
  },

  getById: getDesignById,

  async createDesign(input): Promise<DesignDetailDto> {
    const design = await db.design.create({
      data: {
        clubId: input.clubId ?? null,
        customerName: input.customerName ?? null,
        title: input.title,
        versions: {
          create: {
            versionNumber: 1,
            imageUrl: input.imageUrl,
            status: "PENDING_SEND",
            images: {
              create: (input.imageUrls?.length ? input.imageUrls : [input.imageUrl]).map(
                (url, position) => ({ url, position }),
              ),
            },
          },
        },
      },
    });
    return (await getDesignById(design.id))!;
  },

  async addVersion(designId, input): Promise<DesignDetailDto> {
    const lastVersion = await db.designVersion.findFirst({
      where: { designId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    await db.$transaction([
      db.designVersion.create({
        data: {
          designId,
          versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
          title: input.title,
          description: input.description,
          imageUrl: input.imageUrl,
          status: "PENDING_SEND",
        },
      }),
      db.design.update({
        where: { id: designId },
        data: { status: "SENT_TO_CLUB" },
      }),
    ]);

    return (await getDesignById(designId))!;
  },

  async updateVersion(input): Promise<DesignDetailDto> {
    const version = await db.designVersion.findFirstOrThrow({
      where: { id: input.versionId, designId: input.designId },
      select: { versionNumber: true },
    });
    await db.$transaction([
      db.designVersion.update({
        where: { id: input.versionId },
        data: {
          imageUrl: input.imageUrl,
          changeNote: input.changeNote,
        },
      }),
      db.designComment.create({
        data: {
          designId: input.designId,
          versionId: input.versionId,
          authorUserId: input.authorUserId,
          authorName: input.authorName,
          message: `Correcciones realizadas sobre v${version.versionNumber}: ${input.changeNote}`,
        },
      }),
    ]);
    return (await getDesignById(input.designId))!;
  },

  async setStatus(designId, status: DesignStatusValue, versionId?: string): Promise<void> {
    const targetVersion = versionId
      ? await db.designVersion.findFirst({
          where: { id: versionId, designId },
          select: { id: true },
        })
      : await db.designVersion.findFirst({
          where: { designId },
          orderBy: { versionNumber: "desc" },
          select: { id: true },
        });
    if (versionId && !targetVersion) {
      throw new Error("Versión no pertenece al diseño.");
    }
    await db.$transaction([
      db.design.update({ where: { id: designId }, data: { status } }),
      ...(targetVersion
        ? [
            db.designVersion.update({
              where: { id: targetVersion.id },
              data: { status },
            }),
          ]
        : []),
    ]);
  },

  async addComment(input): Promise<void> {
    await db.designComment.create({
      data: {
        designId: input.designId,
        versionId: input.versionId ?? null,
        authorUserId: input.authorUserId,
        authorName: input.authorName,
        message: input.message,
      },
    });
  },

  async linkProduct(designId, productId): Promise<void> {
    await db.productDesign.upsert({
      where: { designId_productId: { designId, productId } },
      update: {},
      create: { designId, productId },
    });
  },

  async unlinkProduct(designId, productId): Promise<void> {
    await db.productDesign.deleteMany({ where: { designId, productId } });
  },
};
