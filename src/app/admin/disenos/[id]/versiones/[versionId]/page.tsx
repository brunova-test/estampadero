import { AdminDesignDetailView } from "elestampadero/views/admin-designs";

interface AdminDesignVersionDetailPageProps {
  params: Promise<{ id: string; versionId: string }>;
}

export default async function AdminDesignVersionDetailPage({
  params,
}: AdminDesignVersionDetailPageProps) {
  const { id, versionId } = await params;
  return <AdminDesignDetailView designId={id} versionId={versionId} />;
}
