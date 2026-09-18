import { redirect } from "next/navigation";

import { routes } from "elestampadero/shared/config/routes";
import { getCurrentSession } from "elestampadero/server/auth/current-session";
import { SessionExpiredView } from "elestampadero/shared/ui/session-expired/SessionExpiredView";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);
const CLUB_ROLES = new Set(["CLUB_ADMIN", "CLUB_VIEWER"]);

export default async function AccessPage() {
  let session;

  try {
    session = await getCurrentSession();
  } catch {
    return <SessionExpiredView />;
  }

  const role = session?.user?.role;

  if (!role) return <SessionExpiredView />;
  if (ADMIN_ROLES.has(role)) redirect(routes.admin);
  if (CLUB_ROLES.has(role)) redirect(routes.club);

  redirect(routes.account);
}
