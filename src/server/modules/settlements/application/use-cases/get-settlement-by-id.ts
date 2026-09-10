import "server-only";

import type { SettlementDetailDto } from "../dto/settlement";
import type { SettlementsRepository } from "../ports/settlements-repository";

export function getSettlementById(repository: SettlementsRepository) {
  return (id: string): Promise<SettlementDetailDto | null> =>
    repository.getById(id);
}
