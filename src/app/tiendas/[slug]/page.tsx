import type { Metadata } from "next";

import { ClubStoreView } from "elestampadero/views/club-store";
import { api } from "elestampadero/trpc/server";

interface ClubStorePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    categoria?: string;
    linea?: string;
    q?: string;
  }>;
}

export async function generateMetadata({
  params,
}: ClubStorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const club = await api.clubs.publicBySlug({ slug });
  return {
    title: club ? `Tienda de ${club.name} | El Estampadero` : "Tienda de club",
    description:
      club?.description ??
      `Productos oficiales de ${club?.name ?? "la institución"}.`,
  };
}

export default async function ClubStorePage({
  params,
  searchParams,
}: ClubStorePageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  return <ClubStoreView slug={slug} searchParams={resolvedSearchParams} />;
}
