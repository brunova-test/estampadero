import { CatalogView } from "elestampadero/views/catalog";

interface CatalogPageProps {
  searchParams: Promise<{
    categoria?: string;
    linea?: string;
    club?: string;
    q?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolvedSearchParams = await searchParams;
  return <CatalogView searchParams={resolvedSearchParams} />;
}
