import {
  defaultShouldDehydrateQuery,
  MutationCache,
  QueryClient,
  QueryCache,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

function redirectExpiredSession(error: unknown) {
  if (typeof window === "undefined") return;

  const code = (error as { data?: { code?: string } })?.data?.code;
  if (code !== "UNAUTHORIZED" || window.location.pathname === "/ingresar") {
    return;
  }

  const callbackUrl = `${window.location.pathname}${window.location.search}`;
  window.location.replace(
    `/ingresar?callbackUrl=${encodeURIComponent(callbackUrl)}`,
  );
}

export const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({ onError: redirectExpiredSession }),
    mutationCache: new MutationCache({ onError: redirectExpiredSession }),
    defaultOptions: {
      queries: {


        staleTime: 30 * 1000,
      },
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
