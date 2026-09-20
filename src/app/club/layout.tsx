import { redirect } from "next/navigation";

import { getCurrentSession } from "elestampadero/server/auth/current-session";

const CLUB_ROLES = new Set([
  "CLUB_ADMIN",
  "CLUB_VIEWER",
  "ADMIN",
  "SUPER_ADMIN",
]);

export default async function ClubPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;

  try {
    session = await getCurrentSession();
  } catch {


    redirect("/ingresar?callbackUrl=/club");
  }

  if (!session?.user || !CLUB_ROLES.has(session.user.role)) {
    redirect("/ingresar?callbackUrl=/club");
  }

  return <div className="min-h-screen bg-paper">{children}</div>;
}
