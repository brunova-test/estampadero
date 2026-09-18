import { AdminClubParticipationView } from "elestampadero/views/admin-clubs";

export default async function AdminClubParticipationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <AdminClubParticipationView slug={slug} />;
}
