import "server-only";

import type { ClubSummaryDto } from "../dto/club";
import type { ClubsRepository } from "../ports/clubs-repository";

export function listClubs(repository: ClubsRepository) {
  return (): Promise<ClubSummaryDto[]> => repository.listClubs();
}
