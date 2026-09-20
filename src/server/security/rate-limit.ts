import "server-only";

import { db } from "elestampadero/server/db";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}







export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs);
  const expiresAt = new Date(windowStartMs + windowMs);
  const bucket = await db.rateLimitBucket.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, expiresAt },
    update: { count: { increment: 1 } },
    select: { count: true },
  });



  if (Math.random() < 0.01) {
    void db.rateLimitBucket.deleteMany({
      where: { expiresAt: { lt: new Date(now - windowMs) } },
    });
  }

  const allowed = bucket.count <= limit;
  return {
    allowed,
    retryAfterSeconds: allowed
      ? 0
      : Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000)),
  };
}








export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return headers.get("x-real-ip") ?? "unknown";
}
