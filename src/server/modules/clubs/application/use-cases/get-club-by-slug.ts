import "server-only";

import type { ClubDetailDto } from "../dto/club";
import type { ClubsRepository } from "../ports/clubs-repository";

export function getClubBySlug(repository: ClubsRepository) {
  return (slug: string): Promise<ClubDetailDto | null> =>
    repository.getClubBySlug(slug);
}
