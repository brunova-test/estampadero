import { after, type NextRequest, NextResponse } from "next/server";

import { processModoWebhookEvent } from "elestampadero/server/modules/payments";
import { checkRateLimit } from "elestampadero/server/security/rate-limit";

/**
 * Thin HTTP adapter mirroring src/app/api/webhooks/mercado-pago/route.ts.
 * modoGateway.verifyWebhook checks the JWS signature against MODO's JWKS
 * endpoint (see modo-gateway.ts); register this URL with MODO to receive
 * callbacks.
 */
export async function POST(request: NextRequest): Promise<Response> {
  const burstGuard = await checkRateLimit("modo-webhook", 600, 60_000);
  if (!burstGuard.allowed) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const rawBody = await request.text();
  const headers: Record<string, string | undefined> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const searchParams = new URLSearchParams(request.nextUrl.searchParams);
  after(async () => {
    try {
      const result = await processModoWebhookEvent({
        rawBody,
        headers,
        searchParams,
      });
      if (
        result.outcome === "invalid_signature" ||
        result.outcome === "payment_not_found" ||
        result.outcome === "amount_mismatch"
      ) {
        console.error(`[modo webhook] ${result.outcome}`);
      }
    } catch {
      console.error("[modo webhook] processing failed");
    }
  });

  return NextResponse.json({ received: true });
}

export async function GET(): Promise<Response> {
  return NextResponse.json({ ok: true });
}
