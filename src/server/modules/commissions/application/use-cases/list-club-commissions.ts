import "server-only";

import type { CommissionEntryDto } from "../dto/commission";
import type { CommissionsRepository } from "../ports/commissions-repository";

export function listClubCommissions(repository: CommissionsRepository) {
  return (clubId: string): Promise<CommissionEntryDto[]> =>
    repository.listByClub(clubId);
}
