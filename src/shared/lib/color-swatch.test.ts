import { describe, expect, it } from "vitest";

import { colorToHex } from "./color-swatch";

describe("colorToHex", () => {
  it("keeps custom hexadecimal colors selected by an administrator", () => {
    expect(colorToHex("#7b2cbf")).toBe("#7b2cbf");
  });

  it("continues resolving named product colors", () => {
    expect(colorToHex("Negro")).toBe("#0e0a1a");
  });
});
