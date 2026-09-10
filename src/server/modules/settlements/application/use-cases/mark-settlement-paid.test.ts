import { describe, expect, it, vi } from "vitest";

import type { SettlementsRepository } from "../ports/settlements-repository";
import { markSettlementPaid } from "./mark-settlement-paid";

const input = {
  settlementId: "settlement-1",
  receiptUrl: "/api/documents/document-1",
  confirmedByUserId: "user-1",
};

function repository(
  overrides: Partial<SettlementsRepository> = {},
): SettlementsRepository {
  return {
    listSettlements: vi.fn(),
    getById: vi.fn(async () => ({
      id: "settlement-1",
      clubId: "club-1",
      clubName: "Club Uno",
      periodLabel: "julio de 2026",
      periodStart: "2026-07-01T03:00:00.000Z",
      periodEnd: "2026-08-01T02:59:59.999Z",
      status: "PENDING_PAYMENT",
      totalInCents: 100_000,
      createdAt: "2026-08-01T12:00:00.000Z",
      paidAt: null,
      receiptUrl: null,
      payoutCbu: "0000003100010000000001",
      items: [],
      events: [],
    })),
    listSettlementConfigurations: vi.fn(async () => []),
    generateSettlement: vi.fn(),
    markPaid: vi.fn(async () => true),
    ...overrides,
  };
}

describe("markSettlementPaid", () => {
  it("marks the settlement paid via the repository", async () => {
    const target = repository();
    await expect(markSettlementPaid(target)(input)).resolves.toBeUndefined();
    expect(target.markPaid).toHaveBeenCalledWith(input);
  });

  it("requires a receipt", async () => {
    const target = repository();
    await expect(
      markSettlementPaid(target)({ ...input, receiptUrl: "" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(target.markPaid).not.toHaveBeenCalled();
  });

  it("requires a payout account", async () => {
    const target = repository({
      getById: vi.fn(async () => ({
        ...(await repository().getById("settlement-1"))!,
        payoutCbu: null,
      })),
    });
    await expect(markSettlementPaid(target)(input)).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
  });

  it("throws CONFLICT instead of re-processing an already-paid settlement", async () => {
    const target = repository({ markPaid: vi.fn(async () => false) });
    await expect(markSettlementPaid(target)(input)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
