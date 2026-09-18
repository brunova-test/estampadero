import "server-only";

import type { AgreementSummaryDto } from "../dto/agreement";
import type { AgreementsRepository } from "../ports/agreements-repository";

export function listAgreementsByClub(repository: AgreementsRepository) {
  return (clubId: string): Promise<AgreementSummaryDto[]> =>
    repository.listByClub(clubId);
}
