import "server-only";

import type { AgreementDetailDto } from "../dto/agreement";
import type { AgreementsRepository } from "../ports/agreements-repository";

export function getAgreementById(repository: AgreementsRepository) {
  return (id: string): Promise<AgreementDetailDto | null> =>
    repository.getById(id);
}
