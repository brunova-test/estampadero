import { describe, expect, it } from "vitest";

import { createSpecialRequestInputSchema } from "./schemas";

const validInput = {
  contactName: "Ana Pérez",
  whatsapp: "1122334455",
  garmentType: "Remera",
  estimatedQty: "20",
  sizesAndColors: "S a XL, negras",
};

describe("createSpecialRequestInputSchema", () => {
  it("rejects scripts in text fields", () => {
    const result = createSpecialRequestInputSchema.safeParse({
      ...validInput,
      comments: "<script>alert(1)</script>",
    });

    expect(result.success).toBe(false);
  });

  it("rejects attachment data even when sent directly to the API", () => {
    const result = createSpecialRequestInputSchema.safeParse({
      ...validInput,
      attachmentName: "payload.js",
    });

    expect(result.success).toBe(false);
  });
});
