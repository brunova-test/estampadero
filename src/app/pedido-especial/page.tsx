import { auth } from "elestampadero/server/auth";
import {
  SpecialRequestAuthRequired,
  SpecialRequestView,
} from "elestampadero/views/special-request";

export default async function SpecialRequestPage() {
  const session = await auth();

  return session?.user ? (
    <SpecialRequestView />
  ) : (
    <SpecialRequestAuthRequired />
  );
}
