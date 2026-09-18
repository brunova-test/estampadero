import type { Metadata } from "next";

import { api } from "elestampadero/trpc/server";
import { ClubProfileView } from "elestampadero/views/club-profile";

interface ClubProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ClubProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const club = await api.clubs.publicBySlug({ slug });
  return {
    title: club ? `${club.name} | El Estampadero` : "Club",
    description: club?.description ?? "Perfil institucional y tienda oficial.",
  };
}

export default async function ClubProfilePage({
  params,
}: ClubProfilePageProps) {
  const { slug } = await params;
  return <ClubProfileView slug={slug} />;
}
