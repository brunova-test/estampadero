import "server-only";

import type { ClubBalanceDto } from "../dto/commission";
import type { CommissionsRepository } from "../ports/commissions-repository";

export function getClubBalance(repository: CommissionsRepository) {
  return (clubId: string): Promise<ClubBalanceDto> =>
    repository.getClubBalance(clubId);
}
