import { type NextRequest, NextResponse } from "next/server";

import { processMercadoPagoWebhookEvent } from "elestampadero/server/modules/payments";
import { checkRateLimit } from "elestampadero/server/security/rate-limit";

/**
 * Thin HTTP adapter: verifies nothing itself, just gathers the raw request
 * and delegates to the payments module's webhook use case. Mercado Pago
 * requires a 2xx response quickly, so we avoid unrelated work here.
 */
export async function POST(request: NextRequest): Promise<Response> {
  // Guardrail against abuse, not the primary defense — signature
  // verification inside processMercadoPagoWebhookEvent is what actually
  // authenticates the sender. Generous limit per baseline recommendation.
  const burstGuard = await checkRateLimit("mp-webhook", 600, 60_000);
  if (!burstGuard.allowed) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const rawBody = await request.text();
  const headers: Record<string, string | undefined> = {
    "x-signature": request.headers.get("x-signature") ?? undefined,
    "x-request-id": request.headers.get("x-request-id") ?? undefined,
  };

  const result = await processMercadoPagoWebhookEvent({
    rawBody,
    headers,
    searchParams: request.nextUrl.searchParams,
  });

  switch (result.outcome) {
    case "invalid_signature":
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    case "payment_not_found":
    case "amount_mismatch":
      // Acknowledge with 200 so the provider does not retry indefinitely,
      // but do not apply any effect. Logged server-side for investigation.
      console.error(`[mercado-pago webhook] ${result.outcome}`);
      return NextResponse.json({ received: true });
    case "duplicate":
    case "processed":
      return NextResponse.json({ received: true });
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.json({ ok: true });
}
