import { redirect } from "next/navigation";

import { routes } from "elestampadero/shared/config/routes";
import { getCurrentSession } from "elestampadero/server/auth/current-session";
import { SignInView } from "elestampadero/views/sign-in";

export default async function SignInPage() {
  let session;

  try {



    session = await getCurrentSession();
  } catch {
    session = null;
  }

  if (session?.user) redirect(routes.access);

  return <SignInView />;
}
