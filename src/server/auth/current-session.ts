import "server-only";

import { auth } from "./index";
import { db } from "../db";

/**
 * Returns a session only when its user still exists and is active. The role
 * always comes from the database, never from data controlled by the browser
 * or from an older JWT claim.
 */
export async function getCurrentSession() {
  const jwtSession = await auth();
  if (!jwtSession?.user?.id) return null;

  const currentUser = await db.user.findUnique({
    where: { id: jwtSession.user.id },
    select: { role: true, isActive: true },
  });

  if (!currentUser?.isActive) return null;

  return {
    ...jwtSession,
    user: {
      ...jwtSession.user,
      role: currentUser.role,
    },
  };
}
