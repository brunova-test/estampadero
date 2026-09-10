import { AdminClubDesignsView } from "elestampadero/views/admin-designs";

interface AdminClubDesignsPageProps {
  params: Promise<{ clubId: string }>;
}

export default async function AdminClubDesignsPage({
  params,
}: AdminClubDesignsPageProps) {
  const { clubId } = await params;
  return <AdminClubDesignsView clubId={clubId} />;
}
