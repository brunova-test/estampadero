import { redirect } from "next/navigation";

import { getCurrentSession } from "elestampadero/server/auth/current-session";
import { AdminShell } from "elestampadero/widgets/admin-shell";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;

  try {
    session = await getCurrentSession();
  } catch {




    redirect("/ingresar?callbackUrl=/admin");
  }

  if (!session?.user || !ADMIN_ROLES.has(session.user.role)) {
    redirect("/ingresar?callbackUrl=/admin");
  }

  return <AdminShell>{children}</AdminShell>;
}
