import { type NextRequest } from "next/server";

import { handlers } from "elestampadero/server/auth";
import { SESSION_PERSISTENCE_COOKIE } from "elestampadero/shared/config/auth";
import { applySessionPersistence } from "elestampadero/server/auth/session-persistence";

function readPersistenceCookie(request: NextRequest): boolean {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_PERSISTENCE_COOKIE}=`));

  return cookie?.slice(cookie.indexOf("=") + 1) === "true";
}

export async function GET(request: NextRequest) {
  const response = await handlers.GET(request);
  return applySessionPersistence(response, readPersistenceCookie(request));
}

export async function POST(request: NextRequest) {
  let persistent = readPersistenceCookie(request);

  // Credentials are authoritative for the request that creates the session;
  // the preference cookie mainly carries the choice through the Google flow.
  if (request.url.includes("/callback/credentials")) {
    const body = await request.clone().formData();
    persistent = body.get("rememberMe") === "true";
  }

  const response = await handlers.POST(request);
  return applySessionPersistence(response, persistent);
}
