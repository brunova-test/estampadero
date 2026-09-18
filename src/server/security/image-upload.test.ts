import { describe, expect, it } from "vitest";

import { detectImageMime, validateImageUpload } from "./image-upload";

const png = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe("image upload security", () => {
  it("detects and accepts a valid PNG signature", () => {
    expect(detectImageMime(png)).toBe("image/png");
    expect(
      validateImageUpload({
        name: "producto.png",
        declaredMime: "image/png",
        size: png.length,
        bytes: png,
      }),
    ).toEqual({ ok: true, mimeType: "image/png" });
  });

  it("rejects scripts renamed as images", () => {
    const script = new TextEncoder().encode("<script>alert(1)</script>");
    expect(
      validateImageUpload({
        name: "ataque.png",
        declaredMime: "image/png",
        size: script.length,
        bytes: script,
      }).ok,
    ).toBe(false);
  });

  it("rejects mismatched extensions and MIME types", () => {
    expect(
      validateImageUpload({
        name: "producto.js",
        declaredMime: "image/png",
        size: png.length,
        bytes: png,
      }).ok,
    ).toBe(false);
  });
});
