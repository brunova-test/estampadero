import "server-only";

import { db } from "elestampadero/server/db";

import type { ClubDetailDto, ClubSummaryDto } from "../../application/dto/club";
import type { ClubsRepository } from "../../application/ports/clubs-repository";

const summarySelect = {
  id: true,
  slug: true,
  name: true,
  sport: true,
  logoUrl: true,
  isActive: true,
  payoutCbu: true,
  mobbexEntityId: true,
  mobbexSubmittedEntityId: true,
  mobbexOnboardingStatus: true,
  mobbexTaxId: true,
  mobbexLegalName: true,
  mobbexContactName: true,
  mobbexContactEmail: true,
  mobbexContactPhone: true,
  mobbexSubmittedAt: true,
  mobbexAccessRequestedAt: true,
  mobbexAuthorizationConfirmedAt: true,
  mobbexActivatedAt: true,
  _count: {
    select: {
      products: true,
      agreements: { where: { status: "ACTIVE" as const } },
    },
  },
} as const;

function toSummary(club: {
  id: string;
  slug: string;
  name: string;
  sport: string | null;
  logoUrl: string | null;
  isActive: boolean;
  payoutCbu: string | null;
  mobbexEntityId: string | null;
  mobbexSubmittedEntityId: string | null;
  mobbexOnboardingStatus: ClubSummaryDto["mobbexOnboardingStatus"];
  mobbexTaxId: string | null;
  mobbexLegalName: string | null;
  mobbexContactName: string | null;
  mobbexContactEmail: string | null;
  mobbexContactPhone: string | null;
  mobbexSubmittedAt: Date | null;
  mobbexAccessRequestedAt: Date | null;
  mobbexAuthorizationConfirmedAt: Date | null;
  mobbexActivatedAt: Date | null;
  _count: { products: number; agreements: number };
}): ClubSummaryDto {
  return {
    id: club.id,
    slug: club.slug,
    name: club.name,
    sport: club.sport,
    logoUrl: club.logoUrl,
    isActive: club.isActive,
    payoutCbu: club.payoutCbu,
    mobbexEntityId: club.mobbexEntityId,
    mobbexSubmittedEntityId: club.mobbexSubmittedEntityId,
    mobbexOnboardingStatus: club.mobbexOnboardingStatus,
    mobbexTaxId: club.mobbexTaxId,
    mobbexLegalName: club.mobbexLegalName,
    mobbexContactName: club.mobbexContactName,
    mobbexContactEmail: club.mobbexContactEmail,
    mobbexContactPhone: club.mobbexContactPhone,
    mobbexSubmittedAt: club.mobbexSubmittedAt?.toISOString() ?? null,
    mobbexAccessRequestedAt:
      club.mobbexAccessRequestedAt?.toISOString() ?? null,
    mobbexAuthorizationConfirmedAt:
      club.mobbexAuthorizationConfirmedAt?.toISOString() ?? null,
    mobbexActivatedAt: club.mobbexActivatedAt?.toISOString() ?? null,
    productCount: club._count.products,
    hasActiveAgreement: club._count.agreements > 0,
  };
}

export const prismaClubsRepository: ClubsRepository = {
  async listClubs(): Promise<ClubSummaryDto[]> {
    const clubs = await db.club.findMany({
      select: summarySelect,
      orderBy: { name: "asc" },
    });
    return clubs.map(toSummary);
  },

  async getClubBySlug(slug: string): Promise<ClubDetailDto | null> {
    const club = await db.club.findUnique({
      where: { slug },
      select: { ...summarySelect, description: true, createdAt: true },
    });
    if (!club) return null;
    return {
      ...toSummary(club),
      description: club.description,
      createdAt: club.createdAt.toISOString(),
    };
  },

  async getClubById(id: string): Promise<ClubDetailDto | null> {
    const club = await db.club.findUnique({
      where: { id },
      select: { ...summarySelect, description: true, createdAt: true },
    });
    if (!club) return null;
    return {
      ...toSummary(club),
      description: club.description,
      createdAt: club.createdAt.toISOString(),
    };
  },

  async listClubIdsForUser(userId: string): Promise<string[]> {
    const memberships = await db.clubUser.findMany({
      where: { userId },
      select: { clubId: true },
    });
    return memberships.map((membership) => membership.clubId);
  },
};
