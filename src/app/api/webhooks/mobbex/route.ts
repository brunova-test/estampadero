import { type NextRequest, NextResponse } from "next/server";

import { processMobbexWebhookEvent } from "elestampadero/server/modules/payments";
import { checkRateLimit } from "elestampadero/server/security/rate-limit";

export async function POST(request: NextRequest): Promise<Response> {
  const burstGuard = await checkRateLimit("mobbex-webhook", 600, 60_000);
  if (!burstGuard.allowed) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const result = await processMobbexWebhookEvent({
    rawBody: await request.text(),
    headers: {},
    searchParams: request.nextUrl.searchParams,
  });

  switch (result.outcome) {
    case "invalid_signature":
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    case "payment_not_found":
    case "amount_mismatch":
      console.error(`[mobbex webhook] ${result.outcome}`);
      return NextResponse.json({ received: true });
    case "duplicate":
    case "processed":
      return NextResponse.json({ received: true });
  }
}

export async function GET(): Promise<Response> {
  return NextResponse.json({ ok: true });
}
