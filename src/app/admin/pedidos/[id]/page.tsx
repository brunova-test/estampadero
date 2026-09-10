import { AdminOrdersListView } from "elestampadero/views/admin-orders";

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id } = await params;
  return <AdminOrdersListView initialOrderId={id} />;
}
