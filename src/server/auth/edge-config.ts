import { type DefaultSession, type NextAuthConfig } from "next-auth";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

/**
 * Edge-safe subset of the NextAuth config: no providers, no Prisma adapter,
 * no argon2. Used by `middleware.ts`, which runs on the Edge runtime and
 * cannot bundle Node-only native modules. The full config in `config.ts`
 * spreads this and adds the Credentials provider + adapter for use in
 * Route Handlers and Server Components, which run on Node.js.
 */
export const edgeAuthConfig = {
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  providers: [],
  // The session is an encrypted, signed JWT, but it must never be readable
  // from browser JavaScript. `__Host-` additionally prevents a subdomain
  // from setting a competing cookie for this host in production.
  cookies: {
    sessionToken: {
      name: isProduction
        ? "__Host-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/ingresar",
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
      }
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
        role: token.role as string,
      },
    }),
  },
} satisfies NextAuthConfig;
