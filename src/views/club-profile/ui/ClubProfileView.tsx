import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { routes } from "elestampadero/shared/config/routes";
import { BackLink, Container } from "elestampadero/shared/ui";
import { StoreFooter } from "elestampadero/widgets/store-footer";
import { StoreHeader } from "elestampadero/widgets/store-header";
import { api } from "elestampadero/trpc/server";

export async function ClubProfileView({ slug }: { slug: string }) {
  const club = await api.clubs.publicBySlug({ slug });
  if (!club) notFound();

  return (
    <div className="bg-paper flex min-h-screen flex-col">
      <StoreHeader />
      <main className="flex-1">
        <section className="bg-ink text-white">
          <Container className="grid gap-8 py-12 md:grid-cols-[180px_minmax(0,1fr)] md:items-center md:py-16">
            <BackLink fallback={routes.catalog} className="club-profile-back-link" />
            <div className="relative size-32 overflow-hidden rounded-2xl border border-white/15 bg-white p-3 shadow-xl md:size-44">
              <Image
                src={club.logoUrl ?? "/images/linea-club.png"}
                alt={`Logo de ${club.name}`}
                fill
                sizes="176px"
                className="object-contain p-3"
                priority
              />
            </div>
            <div>
              <span className="text-mint font-mono text-xs tracking-[.1em] uppercase sm:text-sm">
                Perfil institucional
              </span>
              <h1 className="font-display mt-3 text-4xl leading-none font-black sm:text-6xl">
                {club.name}
              </h1>
              <p className="mt-4 text-lg text-white/70">
                {club.sport ?? "Institución asociada a El Estampadero"}
              </p>
              <Link
                href={routes.clubStore(club.slug)}
                className="bg-mint text-deep mt-7 inline-flex min-h-13 items-center justify-center px-7 text-base font-black transition-transform hover:-translate-y-0.5"
              >
                Ir a la tienda
              </Link>
            </div>
          </Container>
        </section>

        <Container className="py-10 md:py-14">
          <section className="border-deep/10 grid gap-8 border bg-white p-6 shadow-sm sm:p-8 md:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <span className="text-blue font-mono text-xs font-bold tracking-[.1em] uppercase">
                La institución
              </span>
              <h2 className="font-display text-ink mt-2 text-2xl font-black">
                Sobre {club.name}
              </h2>
              <p className="text-muted mt-4 max-w-3xl text-base leading-7">
                {club.description ??
                  `${club.name} forma parte de las instituciones asociadas a El Estampadero y cuenta con su propia tienda de productos oficiales.`}
              </p>
            </div>
            <aside className="bg-paper border-deep/10 border p-5">
              <span className="text-muted text-xs font-bold tracking-[.08em] uppercase">
                Tienda oficial
              </span>
              <strong className="text-deep mt-2 block text-3xl">
                {club.productCount}
              </strong>
              <p className="text-muted mt-1 text-sm">
                producto{club.productCount === 1 ? "" : "s"} publicados
              </p>
              <Link
                href={routes.clubStore(club.slug)}
                className="border-deep text-deep hover:bg-deep mt-5 inline-flex min-h-11 w-full items-center justify-center border text-sm font-bold hover:text-white"
              >
                Ver catálogo
              </Link>
            </aside>
          </section>
        </Container>
      </main>
      <StoreFooter />
    </div>
  );
}
