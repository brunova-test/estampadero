import { auth } from "elestampadero/server/auth";
import { CustomerAccountView } from "elestampadero/views/customer-account";

export default async function AccountPage() {
  const session = await auth();

  return (
    <CustomerAccountView
      name={session?.user?.name ?? null}
      email={session?.user?.email ?? null}
    />
  );
}
