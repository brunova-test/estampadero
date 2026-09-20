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




const PAYMENT_SCRIPT =
  "https://sdk.mercadopago.com https://*.mercadopago.com https://*.mlstatic.com https://ventasonline.payway.com.ar https://api-homo.payway.com.ar https://api.mobbex.com https://*.mobbex.com";
const PAYMENT_CONNECT =
  "https://api.mercadopago.com https://sdk.mercadopago.com https://events.mercadopago.com https://*.mercadopago.com https://*.mercadolibre.com https://*.mlstatic.com https://developers.decidir.com https://developers-ventasonline.payway.com.ar https://ventasonline.payway.com.ar https://api-homo.payway.com.ar https://api.mobbex.com https://*.mobbex.com";
const PAYMENT_FRAME =
  "https://www.mercadopago.com.ar https://www.mercadopago.com https://*.mercadopago.com.ar https://*.mercadopago.com https://*.mercadolibre.com https://mobbex.com https://*.mobbex.com";
const MAP_FRAME = "https://www.google.com https://maps.google.com";
const PAYMENT_IMG =
  "https://*.mercadopago.com https://*.mercadolibre.com https://*.mlstatic.com https://*.mobbex.com";








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




const { auth } = NextAuth(edgeAuthConfig);












export default auth((req) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);


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
