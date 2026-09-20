import type { ClubDetailDto, ClubSummaryDto } from "../dto/club";

export interface ClubsRepository {
  listClubs(): Promise<ClubSummaryDto[]>;
  getClubBySlug(slug: string): Promise<ClubDetailDto | null>;
  getClubById(id: string): Promise<ClubDetailDto | null>;

  listClubIdsForUser(userId: string): Promise<string[]>;
}
