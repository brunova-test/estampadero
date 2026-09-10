import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { edgeAuthConfig } from "elestampadero/server/auth/edge-config";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);
const CLUB_ROLES = new Set([
  "CLUB_ADMIN",
  "CLUB_VIEWER",
  "ADMIN",
  "SUPER_ADMIN",
]);

const isDev = process.env.NODE_ENV !== "production";

// Payment SDKs and hosted checkouts use these origins for scripts, API
// requests and PCI-scoped frames. The older providers remain allowed so
// historical payment operations can still be managed.
const PAYMENT_SCRIPT =
  "https://sdk.mercadopago.com https://*.mercadopago.com https://*.mlstatic.com https://ventasonline.payway.com.ar https://api-homo.payway.com.ar https://api.mobbex.com https://*.mobbex.com";
const PAYMENT_CONNECT =
  "https://api.mercadopago.com https://sdk.mercadopago.com https://events.mercadopago.com https://*.mercadopago.com https://*.mercadolibre.com https://*.mlstatic.com https://developers.decidir.com https://developers-ventasonline.payway.com.ar https://ventasonline.payway.com.ar https://api-homo.payway.com.ar https://api.mobbex.com https://*.mobbex.com";
const PAYMENT_FRAME =
  "https://www.mercadopago.com.ar https://www.mercadopago.com https://*.mercadopago.com.ar https://*.mercadopago.com https://*.mercadolibre.com https://mobbex.com https://*.mobbex.com";
const MAP_FRAME = "https://www.google.com https://maps.google.com";
const PAYMENT_IMG =
  "https://*.mercadopago.com https://*.mercadolibre.com https://*.mlstatic.com https://*.mobbex.com";

/**
 * script-src uses a per-request nonce instead of 'unsafe-inline'. This has
 * to live here rather than next.config.js's static headers() because the
 * nonce must be fresh on every request. Host allowlists (PAYMENT_SCRIPT) still
 * work alongside the nonce — only 'unsafe-inline' gets ignored when a
 * nonce is present, not host sources.
 */
function buildCsp(nonce: string) {
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' ${isDev ? "'unsafe-eval'" : ""} ${PAYMENT_SCRIPT}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: ${PAYMENT_IMG}`,
    `font-src 'self' data:`,
    `connect-src 'self' ${PAYMENT_CONNECT}`,
    `frame-src ${PAYMENT_FRAME} ${MAP_FRAME}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join("; ");
}

// Edge-safe NextAuth instance: reads/verifies the JWT session only, no
// providers or Prisma. Keeps argon2 and other Node-only deps out of the
// Edge middleware bundle. See src/server/auth/edge-config.ts.
const { auth } = NextAuth(edgeAuthConfig);

/**
 * Also the CSP nonce boundary: every request gets a fresh nonce, forwarded
 * to the app via the `x-nonce` request header (Next.js applies it to its
 * own injected bootstrap/hydration scripts) and echoed in the
 * Content-Security-Policy response header.
 *
 * The auth check below is UX-only: it redirects unauthenticated/
 * unauthorized visitors away from /admin and /club. It is not the
 * authorization boundary — every protected tRPC procedure re-checks
 * role/membership server-side.
 */
export default auth((req) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js reads the CSP from the forwarded request while rendering and
  // copies this nonce onto its bootstrap and hydration scripts.
  requestHeaders.set("Content-Security-Policy", csp);

  const { pathname } = req.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isClubRoute = pathname.startsWith("/club");
  const isAccountRoute = pathname.startsWith("/cuenta");

  if (isAdminRoute || isClubRoute || isAccountRoute) {
    const role = req.auth?.user?.role;
    const allowedRoles = isAdminRoute
      ? ADMIN_ROLES
      : isClubRoute
        ? CLUB_ROLES
        : new Set(["CUSTOMER"]);

    if (!role) {
      const signInUrl = new URL("/ingresar", req.nextUrl.origin);
      signInUrl.searchParams.set(
        "callbackUrl",
        `${pathname}${req.nextUrl.search}`,
      );
      const redirect = NextResponse.redirect(signInUrl);
      redirect.headers.set("Content-Security-Policy", csp);
      return redirect;
    }

    if (!allowedRoles.has(role)) {
      const signInUrl = new URL("/ingresar", req.nextUrl.origin);
      signInUrl.searchParams.set(
        "callbackUrl",
        `${pathname}${req.nextUrl.search}`,
      );
      const redirect = NextResponse.redirect(signInUrl);
      redirect.headers.set("Content-Security-Policy", csp);
      return redirect;
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
