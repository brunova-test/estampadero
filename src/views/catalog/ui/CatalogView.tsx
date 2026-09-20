import { Container } from "elestampadero/shared/ui";
import { CatalogClubStores } from "elestampadero/widgets/catalog-club-stores";
import { StoreHeader } from "elestampadero/widgets/store-header";
import { api } from "elestampadero/trpc/server";

import { CatalogExplorer } from "./CatalogExplorer";

interface CatalogViewProps {
  searchParams: {
    categoria?: string;
    linea?: string;
    club?: string;
    q?: string;
  };
}

const VALID_LINES = new Set([
  "CLUB",
  "URBANA",
  "TRAINING",
  "TRABAJO",
  "ESCOLAR",
]);

function toValidLine(value: string | undefined) {
  const upper = value?.toUpperCase();
  return upper && VALID_LINES.has(upper)
    ? (upper as "CLUB" | "URBANA" | "TRAINING" | "TRABAJO" | "ESCOLAR")
    : undefined;
}

export async function CatalogView({ searchParams }: CatalogViewProps) {
  const line = toValidLine(searchParams.linea);

  const [products, categories, clubs] = await Promise.all([
    api.catalog.list({
      categorySlug: searchParams.categoria,
      clubSlug: searchParams.club,
      line,
      search: searchParams.q,
    }),
    api.catalog.categories(),
    api.clubs.publicList(),
  ]);
  return (
    <div className="catalog-page flex min-h-screen flex-col bg-white">
      <StoreHeader />
      <main className="flex-1">
        <CatalogClubStores clubs={clubs} activeClub={searchParams.club} />
        <Container className="catalog-container pt-4 pb-6 md:pb-10">
          <CatalogExplorer
            products={products}
            categories={categories}
            clubs={clubs}
            activeCategory={searchParams.categoria}
            activeLine={line}
            activeClub={searchParams.club}
            activeSearch={searchParams.q}
            showProductCount={false}
            showInstitutionFilter
          />
        </Container>
      </main>
    </div>
  );
}
