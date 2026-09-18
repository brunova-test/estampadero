import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("elestampadero/env", () => ({
  env: {
    APP_URL: "https://tienda.example.com",
    MOBBEX_API_KEY: "api-key",
    MOBBEX_ACCESS_TOKEN: "access-token",
    MOBBEX_TEST_MODE: true,
  },
}));

import { mobbexGateway } from "./mobbex-gateway";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("mobbexGateway", () => {
  it("creates an embedded checkout with the complete split", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Response.json({
          result: true,
          data: {
            id: "CHK-123",
            url: "https://mobbex.com/checkout/CHK-123",
          },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await mobbexGateway.createCheckoutSession({
      paymentId: "payment-1",
      orderId: "order-1",
      orderNumber: 12,
      amountInCents: 10_000,
      currency: "ARS",
      payerEmail: "cliente@example.com",
      payerName: "Cliente Demo",
      payerIdentification: "30111222",
      payerPhone: "1122334455",
      description: "Pedido #12",
      items: [
        {
          description: "Remera",
          quantity: 2,
          totalInCents: 10_000,
          imageUrl: "https://tienda.example.com/remera.jpg",
        },
      ],
      split: [
        {
          entity: "club-entity",
          totalInCents: 10_000,
          feeInCents: 4_000,
          reference: "order-12-club-1",
          description: "Participación Club Demo",
        },
      ],
    });

    expect(result).toEqual({
      providerPreferenceId: "CHK-123",
      checkoutUrl: "https://mobbex.com/checkout/CHK-123",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.mobbex.com/p/checkout");
    if (typeof request?.body !== "string") {
      throw new Error("Se esperaba un body JSON serializado.");
    }
    const payload = JSON.parse(request.body) as Record<string, unknown>;
    expect(payload).toMatchObject({
      total: 100,
      currency: "ars",
      reference: "payment-1",
      test: true,
      webhook: "https://tienda.example.com/api/webhooks/mobbex",
      webhookstype: "intermediateandfinal",
      options: {
        embed: true,
        domain: "tienda.example.com",
        embedversion: "1.2.0",
      },
      split: [
        {
          entity: "club-entity",
          total: 100,
          fee: 40,
          hold: false,
          refundFee: true,
        },
      ],
    });
  });

  it("reads the nested payment included in checkout webhooks", () => {
    const verified = mobbexGateway.verifyWebhook({
      rawBody: JSON.stringify({
        type: "checkout:transaction",
        data: {
          data: {
            payment: {
              id: "PAY-1",
              reference: "payment-1",
              updated: "2026-09-08T12:00:00.000Z",
              status: { code: "200" },
            },
          },
        },
      }),
      headers: {},
      searchParams: new URLSearchParams(),
    });

    expect(verified).toEqual({
      providerEventId: "PAY-1:200:2026-09-08T12:00:00.000Z",
      eventType: "200",
      providerPaymentId: "PAY-1",
      externalReference: "payment-1",
    });
  });

  it("treats a successful pre-settlement void as a full refund", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          result: true,
          data: {
            transaction: {
              payment: {
                id: "PAY-VOID",
                reference: "payment-void",
                requestedtotal: 200,
                requestedcurrency: { code: "TEST" },
                status: {
                  code: "601",
                  text: "Cancelado",
                  message: "Anulación Exitosa",
                },
                source: { type: "card" },
              },
            },
          },
        }),
      ),
    );

    const payment = await mobbexGateway.getPayment("PAY-VOID");

    expect(payment).toMatchObject({
      normalizedStatus: "REFUNDED",
      amountInCents: 20_000,
      amountRefundedInCents: 20_000,
      currency: "ARS",
    });
  });
});
