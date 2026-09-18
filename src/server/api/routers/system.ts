import {
  createTRPCRouter,
  publicProcedure,
} from "elestampadero/server/api/trpc";

export const systemRouter = createTRPCRouter({
  ping: publicProcedure.query(() => ({ status: "ok" as const })),
});
