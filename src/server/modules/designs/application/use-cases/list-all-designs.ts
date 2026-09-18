import "server-only";

import type { DesignSummaryDto } from "../dto/design";
import type { DesignsRepository } from "../ports/designs-repository";

export function listAllDesigns(repository: DesignsRepository) {
  return (): Promise<DesignSummaryDto[]> => repository.listAll();
}
