import { describe, expect, it } from "vitest";

import { validateDocumentUpload } from "./document-upload";

describe("document upload security", () => {
  it("accepts a PDF with a valid signature", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n");
    expect(
      validateDocumentUpload({
        name: "comprobante.pdf",
        declaredMime: "application/pdf",
        size: pdf.length,
        bytes: pdf,
      }),
    ).toEqual({ ok: true, mimeType: "application/pdf" });
  });

  it("rejects scripts renamed as PDF documents", () => {
    const script = new TextEncoder().encode("<script>alert(1)</script>");
    expect(
      validateDocumentUpload({
        name: "comprobante.pdf",
        declaredMime: "application/pdf",
        size: script.length,
        bytes: script,
      }).ok,
    ).toBe(false);
  });

  it("rejects executable extensions even with a valid signature", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7\n");
    expect(
      validateDocumentUpload({
        name: "comprobante.exe",
        declaredMime: "application/pdf",
        size: pdf.length,
        bytes: pdf,
      }).ok,
    ).toBe(false);
  });
});
