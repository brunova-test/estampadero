import { systemRouter } from "elestampadero/server/api/routers/system";
import {
  createCallerFactory,
  createTRPCRouter,
} from "elestampadero/server/api/trpc";
import { agreementsRouter } from "elestampadero/server/modules/agreements";
import { catalogRouter } from "elestampadero/server/modules/catalog";
import { checkoutRouter } from "elestampadero/server/modules/checkout";
import { clubsRouter } from "elestampadero/server/modules/clubs";
import { commissionsRouter } from "elestampadero/server/modules/commissions";
import { contentRouter } from "elestampadero/server/modules/content";
import { designsRouter } from "elestampadero/server/modules/designs";
import { identityRouter } from "elestampadero/server/modules/identity-access/presentation/router";
import { ordersRouter } from "elestampadero/server/modules/orders";
import { paymentsRouter } from "elestampadero/server/modules/payments";
import { productionRouter } from "elestampadero/server/modules/production";
import { settlementsRouter } from "elestampadero/server/modules/settlements";
import { specialRequestsRouter } from "elestampadero/server/modules/special-requests";
import { customerRequestsRouter } from "elestampadero/server/modules/customer-requests";

/**
 * This is the primary router for your server.
 *
 * All domain routers (catalog, cart, checkout, orders, payments, clubs, ...)
 * should be composed here as they are implemented.
 */
export const appRouter = createTRPCRouter({
  system: systemRouter,
  identity: identityRouter,
  catalog: catalogRouter,
  checkout: checkoutRouter,
  orders: ordersRouter,
  payments: paymentsRouter,
  clubs: clubsRouter,
  agreements: agreementsRouter,
  commissions: commissionsRouter,
  content: contentRouter,
  settlements: settlementsRouter,
  designs: designsRouter,
  production: productionRouter,
  specialRequests: specialRequestsRouter,
  customerRequests: customerRequestsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 */
export const createCaller = createCallerFactory(appRouter);
