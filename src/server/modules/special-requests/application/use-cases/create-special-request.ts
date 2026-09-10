import "server-only";

export interface CreateSpecialRequestInput {
  contactName: string;
  whatsapp: string;
  garmentType: string;
  estimatedQty: string;
  sizesAndColors: string;
  neededBy: string | null;
  comments: string | null;
  attachmentName: string | null;
}

export interface SpecialRequestDto {
  id: string;
  createdAt: Date;
}

interface CreateSpecialRequestDeps {
  create: (input: CreateSpecialRequestInput) => Promise<SpecialRequestDto>;
}

export function createSpecialRequest(deps: CreateSpecialRequestDeps) {
  return (input: CreateSpecialRequestInput): Promise<SpecialRequestDto> =>
    deps.create(input);
}
