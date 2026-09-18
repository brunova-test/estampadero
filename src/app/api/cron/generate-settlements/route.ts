import { NextResponse, type NextRequest } from "next/server";

import { env } from "elestampadero/env";
import { generateDueSettlementsUseCase } from "elestampadero/server/modules/settlements";

/**
 * Daily idempotent job. It creates only the last fully completed period for
 * each club and skips periods that were already generated or have no balance.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const authHeader = request.headers.get("authorization");
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await generateDueSettlementsUseCase("system:cron");
  return NextResponse.json(result);
}
