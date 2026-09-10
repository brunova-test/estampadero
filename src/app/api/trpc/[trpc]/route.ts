import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { appRouter } from "elestampadero/server/api/root";
import { createTRPCContext } from "elestampadero/server/api/trpc";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    headers: req.headers,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    // Always log server-side tRPC failures, not only in development. This
    // was previously gated on NODE_ENV === "development", which meant
    // production errors (e.g. a payment provider rejecting a request)
    // left no trace in the deploy logs. The message here comes from our
    // own Error objects (see safeProviderError in payway-gateway.ts),
    // which are already scrubbed of card data / secrets by design.
    onError: ({ path, error }) => {
      console.error(
        `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
      );
    },
  });

export { handler as GET, handler as POST };
