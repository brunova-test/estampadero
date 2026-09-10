import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getClubStoreBranding } from "elestampadero/shared/config/club-store-branding";
import { routes } from "elestampadero/shared/config/routes";
import { Container } from "elestampadero/shared/ui";
import { StoreFooter } from "elestampadero/widgets/store-footer";
import { StoreHeader } from "elestampadero/widgets/store-header";
import { api } from "elestampadero/trpc/server";
import { CatalogExplorer } from "elestampadero/views/catalog/ui/CatalogExplorer";

interface ClubStoreViewProps {
  slug: string;
  searchParams: {
    categoria?: string;
    linea?: string;
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

export async function ClubStoreView({
  slug,
  searchParams,
}: ClubStoreViewProps) {
  const line = toValidLine(searchParams.linea);
  const [club, products, categories] = await Promise.all([
    api.clubs.publicBySlug({ slug }),
    api.catalog.list({
      clubSlug: slug,
      categorySlug: searchParams.categoria,
      line,
      search: searchParams.q,
    }),
    api.catalog.categories(),
  ]);

  if (!club) notFound();

  const branding = getClubStoreBranding(club.slug);

  return (
    <div className="bg-paper flex min-h-screen flex-col">
      <StoreHeader />
      <main className="flex-1">
        <section
          className={`club-store-hero overflow-hidden bg-[#281a33] text-white ${branding.bannerUrl ? "club-store-hero--branded" : ""}`}
        >
          {branding.bannerUrl ? (
            <>
              <Image
                src={branding.bannerUrl}
                alt=""
                fill
                sizes="100vw"
                className="club-store-hero__banner"
                priority
              />
              <div className="club-store-hero__banner-shade" aria-hidden="true" />
            </>
          ) : (
            <div className="club-store-hero__pattern" aria-hidden="true" />
          )}
          <Container className="relative z-10 py-7 sm:py-10 lg:py-12">
            <nav className="mb-5 flex items-center gap-2 text-sm text-white/70">
              <Link href={routes.home} className="hover:text-mint">
                Inicio
              </Link>
              <span aria-hidden="true">/</span>
              <span>Tienda oficial</span>
            </nav>

            <div className="club-store-identity">
              <div className="club-store-logo">
                <Image
                  src={
                    branding.logoUrl ??
                    club.logoUrl ??
                    "/images/linea-club.png"
                  }
                  alt={`Logo de ${club.name}`}
                  fill
                  sizes="(max-width: 640px) 88px, 132px"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-mint font-mono text-xs font-medium tracking-[.1em] uppercase sm:text-sm">
                  Tienda oficial verificada
                </span>
                <h1 className="font-display mt-2 text-3xl leading-none font-black sm:text-5xl lg:text-6xl">
                  {club.name}
                </h1>
                <p className="mt-3 text-sm text-white/75 sm:text-base">
                  {club.sport ?? "Institución asociada"} · {club.productCount}{" "}
                  producto{club.productCount === 1 ? "" : "s"} publicados
                </p>
              </div>
              <Link
                href={routes.clubProfile(club.slug)}
                className="border-mint text-mint hover:bg-mint hover:text-deep inline-flex min-h-11 shrink-0 items-center justify-center border px-5 text-sm font-bold transition-colors"
              >
                Ver perfil institucional
              </Link>
            </div>
          </Container>
        </section>

        <div className="border-deep/10 bg-white shadow-sm">
          <Container className="flex min-h-14 items-center gap-6 overflow-x-auto text-sm font-bold whitespace-nowrap">
            <Link
              className="text-deep border-deep border-b-2 py-4"
              href={routes.clubStore(slug)}
            >
              Inicio de la tienda
            </Link>
            <a className="text-muted hover:text-deep py-4" href="#productos">
              Todos los productos
            </a>
            <Link
              className="text-muted hover:text-deep py-4"
              href={routes.clubProfile(slug)}
            >
              Sobre el club
            </Link>
          </Container>
        </div>

        <Container id="productos" className="scroll-mt-6 py-8 md:py-11">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-blue font-mono text-xs font-bold tracking-[.1em] uppercase">
                Catálogo del club
              </span>
              <h2 className="font-display text-ink mt-2 text-2xl font-black sm:text-3xl">
                Productos oficiales
              </h2>
            </div>
            <p className="text-muted max-w-lg text-sm sm:text-right">
              Comprá directamente desde la tienda de {club.name}. Los productos
              de esta página pertenecen exclusivamente a la institución.
            </p>
          </div>
          <CatalogExplorer
            products={products}
            categories={categories}
            activeCategory={searchParams.categoria}
            activeLine={line}
            activeClub={slug}
            activeSearch={searchParams.q}
            basePath={routes.clubStore(slug)}
          />
        </Container>
      </main>
      <StoreFooter />
    </div>
  );
}
