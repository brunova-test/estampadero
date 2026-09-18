import "server-only";

import type { SettlementSummaryDto } from "../dto/settlement";
import type {
  SettlementsRepository,
  SettlementStatusValue,
} from "../ports/settlements-repository";

export function listSettlements(repository: SettlementsRepository) {
  return (filters: {
    clubId?: string;
    status?: SettlementStatusValue;
  }): Promise<SettlementSummaryDto[]> => repository.listSettlements(filters);
}
