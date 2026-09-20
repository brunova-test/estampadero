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


    redirect(routes.signIn);
  }

  if (!session?.user || session?.user?.role !== "CUSTOMER") {
    redirect(session?.user ? routes.access : routes.signIn);
  }

  return children;
}
