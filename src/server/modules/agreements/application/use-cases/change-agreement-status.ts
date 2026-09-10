import "server-only";

import type { AgreementDetailDto } from "../dto/agreement";
import type {
  AgreementsRepository,
  ChangeAgreementStatusInput,
} from "../ports/agreements-repository";

export function changeAgreementStatus(repository: AgreementsRepository) {
  return (input: ChangeAgreementStatusInput): Promise<AgreementDetailDto> =>
    repository.changeStatus(input);
}
