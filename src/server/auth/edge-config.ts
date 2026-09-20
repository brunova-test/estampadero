import { type DefaultSession, type NextAuthConfig } from "next-auth";

const isProduction = process.env.NODE_ENV === "production";







declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}








export const edgeAuthConfig = {
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  providers: [],



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
