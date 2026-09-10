import { AdminDesignProductsView } from "elestampadero/views/admin-designs";

export default async function AdminDesignProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminDesignProductsView designId={id} />;
}
