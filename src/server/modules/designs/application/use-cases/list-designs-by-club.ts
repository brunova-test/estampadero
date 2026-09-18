import "server-only";

import type { DesignSummaryDto } from "../dto/design";
import type { DesignsRepository } from "../ports/designs-repository";

export function listDesignsByClub(repository: DesignsRepository) {
  return (clubId: string): Promise<DesignSummaryDto[]> =>
    repository.listByClub(clubId);
}
