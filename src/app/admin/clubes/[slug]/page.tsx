import { AdminClubDetailView } from "elestampadero/views/admin-clubs";

interface AdminClubDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminClubDetailPage({
  params,
}: AdminClubDetailPageProps) {
  const { slug } = await params;
  return <AdminClubDetailView slug={slug} />;
}
