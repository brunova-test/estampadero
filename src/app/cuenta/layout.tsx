import { redirect } from "next/navigation";

import { getCurrentSession } from "elestampadero/server/auth/current-session";
import { routes } from "elestampadero/shared/config/routes";

export default async function AccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let session;

  try {
    session = await getCurrentSession();
  } catch {
    // See admin/layout.tsx: don't let a transient auth() failure crash the
    // page with no error boundary — fall back to the login flow.
    redirect(routes.signIn);
  }

  if (!session?.user || session?.user?.role !== "CUSTOMER") {
    redirect(session?.user ? routes.access : routes.signIn);
  }

  return children;
}
