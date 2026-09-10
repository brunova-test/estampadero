import "server-only";

import { TRPCError } from "@trpc/server";

import { hashPassword } from "./verify-credentials";

interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

interface RegisteredUser {
  id: string;
  name: string | null;
  email: string | null;
}

interface RegisterUserDeps {
  findUserByEmail: (email: string) => Promise<{ id: string } | null>;
  createUser: (input: {
    name: string;
    email: string;
    passwordHash: string;
  }) => Promise<RegisteredUser>;
}

export function registerUser(deps: RegisterUserDeps) {
  return async (input: RegisterUserInput): Promise<RegisteredUser> => {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existing = await deps.findUserByEmail(normalizedEmail);
    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Ya existe una cuenta con ese correo.",
      });
    }

    const passwordHash = await hashPassword(input.password);

    return deps.createUser({
      name: input.name.trim(),
      email: normalizedEmail,
      passwordHash,
    });
  };
}
