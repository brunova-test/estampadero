import { AdminDesignVersionsView } from "elestampadero/views/admin-designs";

interface AdminDesignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminDesignDetailPage({
  params,
}: AdminDesignDetailPageProps) {
  const { id } = await params;
  return <AdminDesignVersionsView designId={id} />;
}
