import "server-only";

import type { DesignDetailDto } from "../dto/design";
import type { DesignsRepository } from "../ports/designs-repository";

export function getDesignById(repository: DesignsRepository) {
  return (id: string): Promise<DesignDetailDto | null> => repository.getById(id);
}
