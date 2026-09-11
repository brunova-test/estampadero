import Image from "next/image";
import { notFound } from "next/navigation";

import { AddToCartPanel } from "elestampadero/features/add-to-cart";
import { getClubStoreBranding } from "elestampadero/shared/config/club-store-branding";
import { BackLink, Container } from "elestampadero/shared/ui";
import { formatCents } from "elestampadero/shared/lib/money";
import { StoreHeader } from "elestampadero/widgets/store-header";
import { api } from "elestampadero/trpc/server";

interface ProductDetailViewProps {
  slug: string;
}

export async function ProductDetailView({ slug }: ProductDetailViewProps) {
  const product = await api.catalog.bySlug({ slug });
  if (!product) notFound();

  const totalStock = product.variants.reduce(
    (sum, variant) => sum + (variant.stock ?? 0),
    0,
  );
  const clubBranding = product.club
    ? getClubStoreBranding(product.club.slug)
    : null;
  const ownerName = product.club?.name ?? "El Estampadero";

  return (
    <div className="bg-paper flex min-h-screen flex-col">
      <StoreHeader />
      <main className="flex-1">
        <Container className="grid gap-6 py-6 md:gap-10 md:py-10 lg:grid-cols-2">
          <BackLink
            fallback="/catalogo"
            className="product-detail-back-link lg:col-span-2"
          />
          <div className="flex flex-col gap-3">
            <div
              className={`product-detail-club ${!product.club ? "is-platform" : ""}`}
              title={`Producto de ${ownerName}`}
            >
              <span className="product-detail-club__logo">
                <Image
                  src={
                    clubBranding?.logoUrl ??
                    product.club?.logoUrl ??
                    "/images/icono.jpg"
                  }
                  alt=""
                  fill
                  sizes="42px"
                  className="object-contain"
                />
              </span>
              <span>{ownerName}</span>
            </div>
            <div className="relative aspect-square overflow-hidden bg-white md:rounded-lg">
              {product.images[0] ? (
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt ?? product.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1024px) 45vw, 100vw"
                />
              ) : null}
            </div>
            {product.images.length > 1 ? (
              <div className="flex gap-2">
                {product.images.map((image) => (
                  <div
                    key={image.url}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white md:h-16 md:w-16"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt ?? product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-muted font-mono text-xs uppercase">
              COD. {product.code} · Línea {product.line}
            </span>
            <h1 className="font-display text-ink text-3xl font-black">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3">
              <span className="font-display text-deep text-3xl font-bold">
                {formatCents(product.priceInCents)}
              </span>
              {product.compareAtCents &&
              product.compareAtCents > product.priceInCents ? (
                <span className="text-muted text-lg line-through">
                  {formatCents(product.compareAtCents)}
                </span>
              ) : null}
            </div>

            {product.description ? (
              <p className="text-muted text-sm">{product.description}</p>
            ) : null}

            <AddToCartPanel product={product} />

            <dl className="grid grid-cols-2 gap-3 border-t border-black/10 pt-4 text-sm">
              <div>
                <dt className="text-muted">Categoría</dt>
                <dd className="font-semibold">
                  {product.category?.name ?? "—"}
                </dd>
              </div>
              {product.showStock ? (
                <div>
                  <dt className="text-muted">Stock total</dt>
                  <dd className="font-semibold">{totalStock} unidades</dd>
                </div>
              ) : null}
              {product.club ? (
                <div>
                  <dt className="text-muted">Producto de</dt>
                  <dd className="font-semibold">{product.club.name}</dd>
                </div>
              ) : null}
              {product.allowsCustomPrint ? (
                <div>
                  <dt className="text-muted">Personalización</dt>
                  <dd className="font-semibold">Admite estampado propio</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </Container>
      </main>
    </div>
  );
}
