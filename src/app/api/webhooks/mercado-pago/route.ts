import { type NextRequest, NextResponse } from "next/server";

import { processMercadoPagoWebhookEvent } from "elestampadero/server/modules/payments";
import { checkRateLimit } from "elestampadero/server/security/rate-limit";






export async function POST(request: NextRequest): Promise<Response> {



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
