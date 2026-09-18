import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("elestampadero/env", () => ({
  env: {
    PAYWAY_ENVIRONMENT: "sandbox",
    PAYWAY_PRIVATE_API_KEY: "private-test-key",
  },
}));

import { paywayGateway } from "./payway-gateway";

describe("paywayGateway.findByExternalReference", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("queries the payment using the documented siteOperationId filter", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      paywayGateway.findByExternalReference("payment-timeout-1"),
    ).resolves.toBeNull();

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.pathname).toBe("/api/v2/payments");
    expect(requestUrl.searchParams.get("siteOperationId")).toBe(
      "payment-timeout-1",
    );
    expect(requestUrl.searchParams.has("merchantId")).toBe(false);
  });

  it("falls back to the paginated list when homologation rejects the filter", async () => {
    const matchingPayment = {
      id: 15403397,
      status: "approved",
      amount: 1000,
      currency: "ars",
      payment_method_id: 31,
      installments: 1,
      site_transaction_id: "payment-timeout-1",
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error_type: "invalid_request_error",
            validation_errors: [
              {
                code: "invalid_param",
                param: "query_params_siteOperationId",
              },
            ],
          }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            limit: 50,
            offset: 0,
            hasMore: false,
            results: [matchingPayment],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result =
      await paywayGateway.findByExternalReference("payment-timeout-1");

    expect(result?.providerPaymentId).toBe("15403397");
    expect(result?.normalizedStatus).toBe("APPROVED");
    const fallbackUrl = new URL(String(fetchMock.mock.calls[1]?.[0]));
    expect(fallbackUrl.searchParams.get("offset")).toBe("0");
    expect(fallbackUrl.searchParams.get("pageSize")).toBe("50");
    expect(fallbackUrl.searchParams.has("siteOperationId")).toBe(false);
  });

  it("does not perform extra listing requests for authentication errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ message: "Invalid authentication credentials" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      paywayGateway.findByExternalReference("payment-timeout-1"),
    ).rejects.toThrow("Payway rechazó la operación (401)");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
