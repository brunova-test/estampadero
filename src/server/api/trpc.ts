/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { getCurrentSession } from "elestampadero/server/auth/current-session";
import { db } from "elestampadero/server/db";
import { checkRateLimit, getClientIp } from "elestampadero/server/security/rate-limit";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  // `getCurrentSession` re-reads the role and active flag from the database.
  // A forged client value, or an older yet valid JWT after an admin revokes a
  // role, can therefore never authorize a tRPC procedure.
  const session = await getCurrentSession();

  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an artificial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);
const STAFF_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "PRODUCTION_OPERATOR"]);

/**
 * Requires an authenticated user with ADMIN or SUPER_ADMIN role. Scope is
 * re-checked here on every request rather than trusted from a stale client
 * claim.
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ADMIN_ROLES.has(ctx.session.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

/**
 * Requires an authenticated user with staff-level access (admin roles plus
 * production operators, who need to move orders through production states).
 */
export const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!STAFF_ROLES.has(ctx.session.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});

/**
 * Rate-limits a procedure. Must be chained after `.input(schema)` so
 * `input` is already parsed when the key function runs. Backed by Postgres
 * (see server/security/rate-limit.ts) — safe across serverless instances,
 * unlike a process-local counter.
 *
 * @example
 * publicProcedure
 *   .input(schema)
 *   .use(rateLimit({ limit: 10, windowMs: 10 * 60_000, key: ({ ctx }) => `checkout:${getClientIp(ctx.headers)}` }))
 *   .mutation(...)
 */
export function rateLimit<TInput>(options: {
  limit: number;
  windowMs: number;
  key: (opts: { ctx: { headers: Headers }; input: TInput }) => string;
}) {
  return t.middleware(async ({ ctx, next, input }) => {
    const key = options.key({ ctx, input: input as TInput });
    const result = await checkRateLimit(key, options.limit, options.windowMs);
    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Demasiados intentos. Probá de nuevo en ${result.retryAfterSeconds} segundos.`,
      });
    }
    return next();
  });
}

/**
 * Rate limit preset for admin/staff mutations, keyed per user id instead of
 * IP. These procedures are already role-gated (adminProcedure/
 * staffProcedure), so this isn't abuse prevention — it's a backstop against
 * a compromised session, a runaway script, or a buggy client retry loop.
 * Chain after `.input(...)`.
 */
export function adminMutationRateLimit(
  action: string,
  { limit = 30, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {},
) {
  return t.middleware(async ({ ctx, next }) => {
    const userId = (ctx as { session?: { user?: { id?: string } } }).session
      ?.user?.id;
    const key = `admin:${action}:${userId ?? "unknown"}`;
    const result = await checkRateLimit(key, limit, windowMs);
    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Demasiadas acciones. Probá de nuevo en ${result.retryAfterSeconds} segundos.`,
      });
    }
    return next();
  });
}

export { getClientIp };
