import { AdminDashboardView } from "elestampadero/views/admin-dashboard";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period =
    rawPeriod === "day" || rawPeriod === "week" || rawPeriod === "year"
      ? rawPeriod
      : "month";
  return <AdminDashboardView period={period} />;
}
