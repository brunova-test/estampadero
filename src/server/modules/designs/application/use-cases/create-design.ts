import "server-only";

import type { DesignDetailDto } from "../dto/design";
import type { DesignsRepository } from "../ports/designs-repository";

export function createDesign(repository: DesignsRepository) {
  return (input: {
    clubId?: string;
    customerName?: string;
    title: string;
    imageUrl: string;
    imageUrls?: string[];
  }): Promise<DesignDetailDto> => repository.createDesign(input);
}
