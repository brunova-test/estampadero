import "server-only";

import { db } from "elestampadero/server/db";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Fixed-window limiter backed by one atomic Postgres UPSERT. This keeps the
 * limit shared across replicas without writing one row and issuing a COUNT
 * for every request. The increment is serialized by Postgres, so concurrent
 * requests cannot all observe the same stale count.
 */
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

  // Old buckets are independent from the active one, so cleanup can run in
  // the background without affecting the result of this request.
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

/**
 * Best-effort client identity from request headers. Trusts
 * `x-forwarded-for` because this app is deployed behind a reverse proxy
 * network, which sets/overwrites that header itself — it is not
 * client-controllable in that deployment. If self-hosting behind a
 * different proxy, verify the trusted-proxy chain before relying on this.
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return headers.get("x-real-ip") ?? "unknown";
}
