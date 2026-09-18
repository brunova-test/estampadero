import { describe, expect, it, vi } from "vitest";

import type { SettlementDetailDto } from "../dto/settlement";
import type { SettlementsRepository } from "../ports/settlements-repository";
import { generateDueSettlements } from "./generate-settlement";

const generatedSettlement: SettlementDetailDto = {
  id: "settlement-1",
  clubId: "club-1",
  clubName: "Club Uno",
  periodLabel: "1–15 de agosto de 2026",
  periodStart: "2026-08-01T03:00:00.000Z",
  periodEnd: "2026-08-16T02:59:59.999Z",
  status: "PENDING_PAYMENT",
  totalInCents: 100_000,
  createdAt: "2026-08-21T12:00:00.000Z",
  paidAt: null,
  receiptUrl: null,
  payoutCbu: "0000003100010000000001",
  items: [],
  events: [],
};

function repository(
  configurations: Awaited<
    ReturnType<SettlementsRepository["listSettlementConfigurations"]>
  >,
): SettlementsRepository {
  return {
    listSettlements: vi.fn(),
    getById: vi.fn(),
    listSettlementConfigurations: vi.fn(async () => configurations),
    generateSettlement: vi.fn(async () => generatedSettlement),
    markPaid: vi.fn(),
  };
}

describe("generateDueSettlements", () => {
  it("generates the last completed period using the agreement frequency", async () => {
    const target = repository([
      {
        clubId: "club-1",
        clubName: "Club Uno",
        payoutCbu: "0000003100010000000001",
        frequency: "BIWEEKLY",
      },
    ]);
    const result = await generateDueSettlements(target)(
      "admin-1",
      new Date("2026-08-21T15:00:00.000Z"),
    );
    expect(result.created).toHaveLength(1);
    expect(target.generateSettlement).toHaveBeenCalledWith(
      "club-1",
      "1–15 de agosto de 2026",
      expect.any(Date),
      expect.any(Date),
      expect.any(Date),
      "admin-1",
    );
  });

  it("skips clubs without a payout account", async () => {
    const target = repository([
      {
        clubId: "club-1",
        clubName: "Club Uno",
        payoutCbu: null,
        frequency: "MONTHLY",
      },
    ]);
    const result = await generateDueSettlements(target)("admin-1");
    expect(result.created).toHaveLength(0);
    expect(result.skipped[0]?.reason).toContain("CBU/CVU");
    expect(target.generateSettlement).not.toHaveBeenCalled();
  });
});
