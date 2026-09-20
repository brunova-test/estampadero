








import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { getCurrentSession } from "elestampadero/server/auth/current-session";
import { db } from "elestampadero/server/db";
import { checkRateLimit, getClientIp } from "elestampadero/server/security/rate-limit";













export const createTRPCContext = async (opts: { headers: Headers }) => {



  const session = await getCurrentSession();

  return {
    db,
    session,
    ...opts,
  };
};








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






export const createCallerFactory = t.createCallerFactory;













export const createTRPCRouter = t.router;







const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {

    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const end = Date.now();
  console.log(`[TRPC] ${path} took ${end - start}ms to execute`);

  return result;
});








export const publicProcedure = t.procedure.use(timingMiddleware);









export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {

        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);
const STAFF_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "PRODUCTION_OPERATOR"]);






export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ADMIN_ROLES.has(ctx.session.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});





export const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!STAFF_ROLES.has(ctx.session.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});













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
