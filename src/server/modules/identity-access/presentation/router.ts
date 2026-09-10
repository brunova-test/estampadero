import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  getClientIp,
  protectedProcedure,
  publicProcedure,
  rateLimit,
} from "elestampadero/server/api/trpc";
import { db } from "elestampadero/server/db";

import { registerUser } from "../application/register-user";
import {
  hashPassword,
  verifyPasswordHash,
} from "../application/verify-credentials";
import { changePasswordInputSchema, registerInputSchema } from "./schemas";

const registerUserUseCase = registerUser({
  findUserByEmail: (email) =>
    db.user.findUnique({ where: { email }, select: { id: true } }),
  createUser: (input) =>
    db.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: "CUSTOMER",
      },
      select: { id: true, name: true, email: true },
    }),
});

export const identityRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerInputSchema)
    .use(
      rateLimit({
        limit: 5,
        windowMs: 15 * 60_000,
        key: ({ ctx }) => `register:ip:${getClientIp(ctx.headers)}`,
      }),
    )
    .mutation(({ input }) => registerUserUseCase(input)),

  changePassword: protectedProcedure
    .input(changePasswordInputSchema)
    .use(
      rateLimit({
        limit: 5,
        windowMs: 15 * 60_000,
        key: ({ ctx }) => `change-password:${getClientIp(ctx.headers)}`,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { passwordHash: true, isActive: true },
      });

      if (
        !user?.isActive ||
        !user.passwordHash ||
        !(await verifyPasswordHash(user.passwordHash, input.currentPassword))
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La contraseña actual no es correcta.",
        });
      }

      const passwordHash = await hashPassword(input.newPassword);
      await db.user.update({
        where: { id: ctx.session.user.id },
        data: { passwordHash },
      });

      return { success: true };
    }),
});
