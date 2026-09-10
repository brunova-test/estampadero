import "server-only";

import argon2 from "argon2";

import { db } from "elestampadero/server/db";

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, ARGON2_OPTIONS);
}

export async function verifyPasswordHash(
  passwordHash: string,
  plainPassword: string,
): Promise<boolean> {
  return argon2.verify(passwordHash, plainPassword).catch(() => false);
}

interface VerifiedIdentity {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

/**
 * Compares against a dummy hash for nonexistent/inactive accounts and returns
 * the same generic failure so login does not leak account existence via timing.
 */
export async function verifyCredentials(
  email: string,
  plainPassword: string,
): Promise<VerifiedIdentity | null> {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true,
      isActive: true,
    },
  });

  const hashToCompare =
    user?.passwordHash ??
    // Dummy Argon2id hash so a nonexistent account still pays the hashing cost.
    "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$1f1i6dK4gj+g8m3G8sV0dQ";

  const passwordMatches = await verifyPasswordHash(
    hashToCompare,
    plainPassword,
  );

  if (!user || !user.isActive || !user.passwordHash || !passwordMatches) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
