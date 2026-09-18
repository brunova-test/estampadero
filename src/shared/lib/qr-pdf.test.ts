import { describe, expect, it } from "vitest";

import { createClubQrPdf } from "./qr-pdf";

describe("createClubQrPdf", () => {
  it("creates a printable PDF containing the store URL", async () => {
    const url = "https://tienda.example.com/tiendas/club-atletico";
    const blob = createClubQrPdf(url, "Club Atlético");
    const content = await blob.text();

    expect(blob.type).toBe("application/pdf");
    expect(content.startsWith("%PDF-1.4")).toBe(true);
    expect(content).toContain("Club Atletico");
    expect(content).toContain(url);
    expect(content).toContain("startxref");
    expect(blob.size).toBeGreaterThan(5_000);
  });
});
