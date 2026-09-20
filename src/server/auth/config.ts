import { PrismaAdapter } from "@auth/prisma-adapter";
import { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";

import { env } from "elestampadero/env";
import { db } from "elestampadero/server/db";
import { verifyCredentials } from "elestampadero/server/modules/identity-access";
import {
  checkRateLimit,
  getClientIp,
} from "elestampadero/server/security/rate-limit";

import { edgeAuthConfig } from "./edge-config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.enum(["true", "false"]).optional(),
});

const LOGIN_WINDOW_MS = 15 * 60_000;







export const authConfig = {
  ...edgeAuthConfig,
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
        rememberMe: { label: "Recordarme", type: "checkbox" },
      },
      authorize: async (rawCredentials, request) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const normalizedEmail = parsed.data.email.trim().toLowerCase();
        const ip = getClientIp(request.headers);






        const [accountLimit, ipLimit] = await Promise.all([
          checkRateLimit(
            `login:account:${normalizedEmail}:${ip}`,
            5,
            LOGIN_WINDOW_MS,
          ),
          checkRateLimit(`login:ip:${ip}`, 20, LOGIN_WINDOW_MS),
        ]);
        if (!accountLimit.allowed || !ipLimit.allowed) return null;

        const identity = await verifyCredentials(
          normalizedEmail,
          parsed.data.password,
        );
        if (!identity) return null;

        return {
          id: identity.id,
          name: identity.name,
          email: identity.email,
          role: identity.role,
        };
      },
    }),
    ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  adapter: PrismaAdapter(db),
} satisfies NextAuthConfig;
