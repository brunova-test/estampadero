import "server-only";

import type {
  AgreementsRepository,
  ResolvedRate,
} from "../ports/agreements-repository";

export function resolveRateForProduct(repository: AgreementsRepository) {
  return (clubId: string, productId: string): Promise<ResolvedRate | null> =>
    repository.resolveRateForProduct(clubId, productId);
}
