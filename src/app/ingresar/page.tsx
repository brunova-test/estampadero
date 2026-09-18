import { redirect } from "next/navigation";

import { routes } from "elestampadero/shared/config/routes";
import { getCurrentSession } from "elestampadero/server/auth/current-session";
import { SignInView } from "elestampadero/views/sign-in";

export default async function SignInPage() {
  let session;

  try {
    // Validate the account against the database so an expired, revoked, or
    // deactivated session does not bounce back to /acceso instead of showing
    // the login form.
    session = await getCurrentSession();
  } catch {
    session = null;
  }

  if (session?.user) redirect(routes.access);

  return <SignInView />;
}
