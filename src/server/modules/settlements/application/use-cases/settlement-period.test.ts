import { describe, expect, it } from "vitest";

import { resolveCompletedSettlementPeriod } from "./settlement-period";

describe("resolveCompletedSettlementPeriod", () => {
  it("returns the previous calendar month for monthly agreements", () => {
    const period = resolveCompletedSettlementPeriod(
      "MONTHLY",
      new Date("2026-08-21T15:00:00.000Z"),
    );
    expect(period.periodLabel).toBe("julio de 2026");
    expect(period.periodStart.toISOString()).toBe("2026-07-01T03:00:00.000Z");
    expect(period.cutoffExclusive.toISOString()).toBe(
      "2026-08-01T03:00:00.000Z",
    );
  });

  it("returns days 1 to 15 after the second half starts", () => {
    const period = resolveCompletedSettlementPeriod(
      "BIWEEKLY",
      new Date("2026-08-21T15:00:00.000Z"),
    );
    expect(period.periodLabel).toBe("1–15 de agosto de 2026");
    expect(period.cutoffExclusive.toISOString()).toBe(
      "2026-08-16T03:00:00.000Z",
    );
  });

  it("returns the second half of the previous month before day 16", () => {
    const period = resolveCompletedSettlementPeriod(
      "BIWEEKLY",
      new Date("2026-08-10T15:00:00.000Z"),
    );
    expect(period.periodLabel).toBe("16–31 de julio de 2026");
    expect(period.cutoffExclusive.toISOString()).toBe(
      "2026-08-01T03:00:00.000Z",
    );
  });
});
