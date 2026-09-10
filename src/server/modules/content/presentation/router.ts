import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  adminMutationRateLimit,
  adminProcedure,
  createTRPCRouter,
  publicProcedure,
} from "elestampadero/server/api/trpc";
import { db } from "elestampadero/server/db";
import { safeTextSchema } from "elestampadero/server/security/safe-text";

const relativeOrHttpsUrl = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    (value) =>
      (value.startsWith("/") && !value.startsWith("//")) ||
      value.startsWith("https://"),
    "Usá una ruta interna o una URL https.",
  );

const pieceInput = z.object({
  id: z.string().min(1).max(60),
  title: safeTextSchema({ min: 2, max: 120 }),
  eyebrow: safeTextSchema({ min: 2, max: 80 }),
  description: safeTextSchema({ min: 2, max: 350 }),
  desktopImageUrl: relativeOrHttpsUrl,
  mobileImageUrl: relativeOrHttpsUrl,
  ctaLabel: safeTextSchema({ min: 2, max: 50 }),
  ctaHref: relativeOrHttpsUrl,
  secondaryCtaLabel: safeTextSchema({ min: 0, max: 50 }).optional(),
  secondaryCtaHref: relativeOrHttpsUrl.optional(),
  tags: z.array(safeTextSchema({ min: 1, max: 50 })).max(10),
  status: z.enum(["VISIBLE", "SCHEDULED", "HIDDEN"]),
  startsAt: z.string().datetime().nullable(),
  endsAt: z.string().datetime().nullable(),
});

export const contentRouter = createTRPCRouter({
  publicHome: publicProcedure.query(async () => {
    const now = new Date();
    const [pieces, settings] = await Promise.all([
      db.homeContentPiece.findMany({
        where: {
          status: { in: ["VISIBLE", "SCHEDULED"] },
          AND: [
            { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
            { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          ],
        },
        orderBy: { sortOrder: "asc" },
      }),
      db.siteContentSetting.findUnique({ where: { id: "home" } }),
    ]);
    return {
      pieces,
      settings: settings ?? { carouselEnabled: true, carouselIntervalMs: 4000 },
    };
  }),

  adminList: adminProcedure
    .input(
      z.object({
        section: z.enum(["HERO", "CAMPAIGN", "ACCESS", "PROMOTION"]),
      }),
    )
    .query(async ({ input }) => {
      const [pieces, settings] = await Promise.all([
        db.homeContentPiece.findMany({
          where: { section: input.section },
          orderBy: { sortOrder: "asc" },
        }),
        db.siteContentSetting.findUnique({ where: { id: "home" } }),
      ]);
      return {
        pieces,
        settings: settings ?? {
          carouselEnabled: true,
          carouselIntervalMs: 4000,
        },
      };
    }),

  create: adminProcedure
    .input(
      z.object({
        section: z.enum(["HERO", "CAMPAIGN", "ACCESS", "PROMOTION"]),
      }),
    )
    .use(adminMutationRateLimit("content.create"))
    .mutation(async ({ input }) => {
      const count = await db.homeContentPiece.count({
        where: { section: input.section },
      });
      const defaults = {
        HERO: {
          eyebrow: "Nuevo banner",
          description: "Completá la información del banner principal.",
          desktopImageUrl: "/images/hero-1.png",
          mobileImageUrl: "/images/hero-1.png",
          ctaLabel: "Ver más",
          ctaHref: "/catalogo",
        },
        CAMPAIGN: {
          eyebrow: "Nueva campaña",
          description: "Completá la información de la campaña.",
          desktopImageUrl: "/images/promo-1-clean.png",
          mobileImageUrl: "/images/promo-1-clean.png",
          ctaLabel: "Conocer más",
          ctaHref: "/pedido-especial",
        },
        ACCESS: {
          eyebrow: "Acceso directo",
          description: "Completá la información de este acceso.",
          desktopImageUrl: "/images/on-1.png",
          mobileImageUrl: "/images/on-1.png",
          ctaLabel: "Ingresar",
          ctaHref: "/catalogo",
        },
        PROMOTION: {
          eyebrow: "Promoción vigente",
          description: "Completá la información de la promoción.",
          desktopImageUrl: "/images/promo-buzos.png",
          mobileImageUrl: "/images/promo-buzos.png",
          ctaLabel: "Ver promoción",
          ctaHref: "/catalogo",
        },
      }[input.section];

      return db.homeContentPiece.create({
        data: {
          code: `${input.section}-${Date.now()}`,
          section: input.section,
          title: "Nueva pieza",
          ...defaults,
          tags: [],
          status: "HIDDEN",
          sortOrder: count,
        },
      });
    }),

  update: adminProcedure
    .input(pieceInput)
    .use(adminMutationRateLimit("content.update"))
    .mutation(({ input }) => {
      const {
        id,
        startsAt,
        endsAt,
        secondaryCtaLabel,
        secondaryCtaHref,
        ...data
      } = input;
      return db.homeContentPiece.update({
        where: { id },
        data: {
          ...data,
          secondaryCtaLabel: secondaryCtaLabel?.trim()
            ? secondaryCtaLabel
            : null,
          secondaryCtaHref: secondaryCtaHref?.trim() ? secondaryCtaHref : null,
          startsAt: startsAt ? new Date(startsAt) : null,
          endsAt: endsAt ? new Date(endsAt) : null,
        },
      });
    }),

  move: adminProcedure
    .input(
      z.object({
        id: z.string().min(1).max(60),
        direction: z.enum(["UP", "DOWN"]),
      }),
    )
    .use(adminMutationRateLimit("content.move"))
    .mutation(async ({ input }) => {
      const current = await db.homeContentPiece.findUnique({
        where: { id: input.id },
      });
      if (!current)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pieza no encontrada.",
        });
      const adjacent = await db.homeContentPiece.findFirst({
        where: {
          section: current.section,
          sortOrder:
            input.direction === "UP"
              ? { lt: current.sortOrder }
              : { gt: current.sortOrder },
        },
        orderBy: { sortOrder: input.direction === "UP" ? "desc" : "asc" },
      });
      if (!adjacent) return current;
      await db.$transaction([
        db.homeContentPiece.update({
          where: { id: current.id },
          data: { sortOrder: adjacent.sortOrder },
        }),
        db.homeContentPiece.update({
          where: { id: adjacent.id },
          data: { sortOrder: current.sortOrder },
        }),
      ]);
      return current;
    }),

  updateSettings: adminProcedure
    .input(
      z.object({
        carouselEnabled: z.boolean(),
        carouselIntervalMs: z.number().int().min(2000).max(30000),
      }),
    )
    .use(adminMutationRateLimit("content.updateSettings"))
    .mutation(({ input }) =>
      db.siteContentSetting.upsert({
        where: { id: "home" },
        update: input,
        create: { id: "home", ...input },
      }),
    ),
});
