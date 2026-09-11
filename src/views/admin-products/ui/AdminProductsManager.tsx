"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { colorToHex } from "elestampadero/shared/lib/color-swatch";
import { formatCents } from "elestampadero/shared/lib/money";
import { ImageUploadField } from "elestampadero/shared/ui/admin";
import { ConfirmDialog } from "elestampadero/shared/ui/confirm-dialog";
import { ModernSpinner } from "elestampadero/shared/ui/motion";
import { api, type RouterOutputs } from "elestampadero/trpc/react";

type Product = RouterOutputs["catalog"]["adminList"][number];
type CatalogLine = RouterOutputs["catalog"]["lines"][number];
type ApprovedConventionProduct =
  RouterOutputs["catalog"]["approvedConventionProducts"][number];
type Club = RouterOutputs["clubs"]["list"][number];
type ProductLine = "CLUB" | "URBANA" | "TRAINING" | "TRABAJO" | "ESCOLAR";
type ProductStatus = "DRAFT" | "PUBLISHED" | "OUT_OF_STOCK";
type ProductEditorTab = "information" | "images" | "variants";

type ImageDraft = { id?: string; url: string; alt: string; color: string };
type VariantDraft = {
  id?: string;
  size: string;
  color: string;
  stock: string;
  sku: string;
};
type ProductDraft = {
  id: string | null;
  name: string;
  code: string;
  description: string;
  price: string;
  compareAtPrice: string;
  line: ProductLine | "";
  lineId: string;
  status: ProductStatus;
  clubId: string;
  allowsCustomPrint: boolean;
  isFeatured: boolean;
  showStock: boolean;
  images: ImageDraft[];
  variants: VariantDraft[];
};

const PAGE_SIZE = 5;
const LINE_LABELS: Record<ProductLine, string> = {
  CLUB: "Club",
  URBANA: "Urbana",
  TRAINING: "Training",
  TRABAJO: "Trabajo",
  ESCOLAR: "Escolar",
};
const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  OUT_OF_STOCK: "Sin stock",
};
const PRODUCT_COLOR_PALETTE = [
  "Negro",
  "Blanco",
  "Gris",
  "Azul",
  "Azul marino",
  "Violeta",
  "Verde",
  "Rojo",
  "Naranja",
  "Amarillo",
  "Beige",
  "Bordo",
];
const UNDEFINED_COLOR = "Sin definir";
const UNDEFINED_SIZE = "Sin definir";

function emptyDraft(clubId = ""): ProductDraft {
  return {
    id: null,
    name: "",
    code: "",
    description: "",
    price: "",
    compareAtPrice: "",
    line: clubId ? "CLUB" : "",
    lineId: "",
    status: clubId ? "PUBLISHED" : "DRAFT",
    clubId,
    allowsCustomPrint: false,
    isFeatured: false,
    showStock: false,
    images: [],
    variants: [],
  };
}

function productDraft(product: Product): ProductDraft {
  return {
    id: product.id,
    name: product.name,
    code: product.code,
    description: product.description ?? "",
    price: String(product.priceInCents / 100),
    compareAtPrice:
      product.compareAtCents === null
        ? ""
        : String(product.compareAtCents / 100),
    line: product.line ?? "",
    lineId: product.lineId ?? "",
    status: product.status === "OUT_OF_STOCK" ? "DRAFT" : product.status,
    clubId: product.club?.id ?? "",
    allowsCustomPrint: product.allowsCustomPrint,
    isFeatured: product.isFeatured,
    showStock: product.showStock,
    images: product.images.map((image) => ({
      id: image.id,
      url: image.url,
      alt: image.alt ?? "",
      color: image.color ?? UNDEFINED_COLOR,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      stock: variant.stock === null ? "" : String(variant.stock),
      sku: variant.sku,
    })),
  };
}

function statusClass(status: ProductStatus) {
  if (status === "PUBLISHED") return "admin-chip--success";
  if (status === "OUT_OF_STOCK") return "admin-chip--danger";
  return "admin-chip--warning";
}

export function AdminProductsManager({
  initialProducts,
  clubs,
  initialLines,
  initialClubId,
  initialCreateMode = false,
}: {
  initialProducts: Product[];
  clubs: Club[];
  initialLines: CatalogLine[];
  initialClubId?: string;
  initialCreateMode?: boolean;
}) {
  const productsQuery = api.catalog.adminList.useQuery(undefined, {
    initialData: initialProducts,
  });
  const linesQuery = api.catalog.lines.useQuery(undefined, {
    initialData: initialLines,
  });
  const [search, setSearch] = useState("");
  const [line, setLine] = useState("");
  const [status, setStatus] = useState("");
  const [clubId, setClubId] = useState("");
  const [page, setPage] = useState(1);
  const preselectedClubId = clubs.some(
    (club) =>
      club.id === initialClubId && club.isActive && club.hasActiveAgreement,
  )
    ? (initialClubId ?? "")
    : "";
  const [draft, setDraft] = useState<ProductDraft | null>(() =>
    initialCreateMode ? emptyDraft(preselectedClubId) : null,
  );
  const [section, setSection] = useState<
    "catalog" | "approved" | "lines" | "new"
  >(initialCreateMode ? "new" : "catalog");

  const products = productsQuery.data ?? initialProducts;
  const lines = linesQuery.data ?? initialLines;
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("es");
    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLocaleLowerCase("es").includes(normalizedSearch) ||
        product.code.toLocaleLowerCase("es").includes(normalizedSearch);
      return (
        matchesSearch &&
        (!line || product.line === line || product.lineId === line) &&
        (!status || product.status === status) &&
        (!clubId || product.club?.id === clubId)
      );
    });
  }, [clubId, line, products, search, status]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE),
  );
  const visibleProducts = filteredProducts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => setPage(1), [clubId, line, search, status]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const sectionTabs = (
    <nav
      className="admin-product-section-tabs"
      aria-label="Secciones de productos"
    >
      <button
        type="button"
        className={section === "catalog" ? "is-active" : undefined}
        onClick={() => {
          setDraft(null);
          setSection("catalog");
        }}
      >
        <ProductSectionIcon kind="catalog" />
        Catálogo de productos
      </button>
      <button
        type="button"
        className={section === "approved" ? "is-active" : undefined}
        onClick={() => {
          setDraft(null);
          setSection("approved");
        }}
      >
        <ProductSectionIcon kind="approved" />
        Productos aprobados · socios y convenios
      </button>
      <button
        type="button"
        className={section === "lines" ? "is-active" : undefined}
        onClick={() => {
          setDraft(null);
          setSection("lines");
        }}
      >
        <ProductSectionIcon kind="lines" />
        Líneas
      </button>
      <button
        type="button"
        className={`admin-product-section-tabs__action${
          section === "new" ? "is-active" : ""
        }`}
        onClick={() => {
          setSection("new");
          setDraft(emptyDraft(preselectedClubId));
        }}
      >
        <ProductSectionIcon kind="new" />
        Nuevo producto
      </button>
    </nav>
  );

  if (section === "approved") {
    return (
      <>
        {sectionTabs}
        <ApprovedConventionProductsPanel clubs={clubs} />
      </>
    );
  }

  if (section === "lines") {
    return (
      <>
        {sectionTabs}
        <CatalogLinesPanel initialLines={lines} products={products} />
      </>
    );
  }

  if (section === "new" && draft) {
    return (
      <>
        {sectionTabs}
        <ProductEditorModal
          draft={draft}
          clubs={clubs}
          lines={lines}
          lockedClubId={preselectedClubId || undefined}
          embedded
          onClose={() => {
            setDraft(null);
            setSection("catalog");
          }}
        />
      </>
    );
  }

  return (
    <>
      {sectionTabs}
      <div className="admin-toolbar admin-products-toolbar">
        <div>
          <p className="admin-products-count">
            {filteredProducts.length} productos encontrados
          </p>
        </div>
      </div>

      <div className="admin-product-filters">
        <input
          className="admin-input"
          placeholder="Buscar por nombre o código"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <ProductFilterSelect
          label="Línea"
          value={line}
          onChange={setLine}
          options={[
            ["", "Todas"],
            ...Object.entries(LINE_LABELS),
            ...lines.map(
              (customLine) =>
                [customLine.id, customLine.name] as [string, string],
            ),
          ]}
        />
        <ProductFilterSelect
          label="Estado"
          value={status}
          onChange={setStatus}
          options={[["", "Todos"], ...Object.entries(STATUS_LABELS)]}
        />
        <ProductFilterSelect
          label="Club"
          value={clubId}
          onChange={setClubId}
          options={[
            ["", "Todos"],
            ...clubs.map((club) => [club.id, club.name] as [string, string]),
          ]}
        />
      </div>

      <div className="admin-table-wrap admin-products-table-wrap">
        <table className="admin-table admin-products-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Producto</th>
              <th>Línea</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Club</th>
              <th>Estado</th>
              <th aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((product) => (
              <tr
                key={product.id}
                className="admin-product-row"
                tabIndex={0}
                onClick={() => setDraft(productDraft(product))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setDraft(productDraft(product));
                  }
                }}
              >
                <td>
                  <span className="admin-product-thumb">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].alt ?? product.name}
                        fill
                        sizes="76px"
                      />
                    ) : (
                      <span aria-hidden="true">Sin foto</span>
                    )}
                  </span>
                </td>
                <td>
                  <strong>{product.name}</strong>
                  <small>
                    {product.code} ·{" "}
                    {
                      new Set(product.variants.map((variant) => variant.color))
                        .size
                    }{" "}
                    colores ·{" "}
                    {
                      new Set(product.variants.map((variant) => variant.size))
                        .size
                    }{" "}
                    talles
                  </small>
                </td>
                <td>
                  {product.lineDefinition?.name ??
                    (product.line ? LINE_LABELS[product.line] : "Sin línea")}
                </td>
                <td>
                  <strong>{formatCents(product.priceInCents)}</strong>
                </td>
                <td>
                  <strong
                    className={
                      product.showStock && product.totalStock <= 5
                        ? "admin-danger-text"
                        : ""
                    }
                  >
                    {product.showStock ? product.totalStock : "No definido"}
                  </strong>
                </td>
                <td>{product.club?.name ?? "—"}</td>
                <td>
                  <span className={`admin-chip ${statusClass(product.status)}`}>
                    {STATUS_LABELS[product.status]}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-product-edit"
                    onClick={() => setDraft(productDraft(product))}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {visibleProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="admin-products-empty">
                  No hay productos que coincidan con los filtros.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <nav
        className="admin-products-pagination"
        aria-label="Páginas de productos"
      >
        <button
          type="button"
          disabled={page === 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() =>
            setPage((current) => Math.min(totalPages, current + 1))
          }
        >
          Siguiente
        </button>
      </nav>

      {draft ? (
        <ProductEditorModal
          draft={draft}
          clubs={clubs}
          lines={lines}
          onClose={() => setDraft(null)}
        />
      ) : null}
    </>
  );
}

export function AdminProductCreationModal({
  clubId,
  onClose,
}: {
  clubId: string;
  onClose: () => void;
}) {
  const clubsQuery = api.clubs.list.useQuery();
  const linesQuery = api.catalog.lines.useQuery();
  const clubs = clubsQuery.data ?? [];
  const lines = linesQuery.data ?? [];
  const selectedClub = clubs.find((club) => club.id === clubId);

  if (!selectedClub || !clubsQuery.data || !linesQuery.data) return null;

  return (
    <ProductEditorModal
      draft={emptyDraft(clubId)}
      clubs={clubs}
      lines={lines}
      lockedClubId={clubId}
      onClose={onClose}
    />
  );
}

function ProductFilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  const selectedLabel =
    options.find(([optionValue]) => optionValue === value)?.[1] ??
    options[0]?.[1] ??
    "";
  return (
    <details className="admin-product-filter-dropdown">
      <summary>
        <span className="admin-product-filter-dropdown__text">
          <small>{label}</small>
          <strong>{selectedLabel}</strong>
        </span>
        <svg
          className="admin-product-filter-dropdown__chevron"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m7 9 5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className="admin-product-filter-dropdown__menu">
        {options.map(([optionValue, optionLabel]) => (
          <button
            type="button"
            key={optionValue || "all"}
            className={optionValue === value ? "is-selected" : undefined}
            onClick={(event) => {
              onChange(optionValue);
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
          >
            <span>{optionLabel}</span>
            {optionValue === value ? <span aria-hidden="true">✓</span> : null}
          </button>
        ))}
      </div>
    </details>
  );
}

function ProductSectionIcon({
  kind,
}: {
  kind: "catalog" | "approved" | "lines" | "new";
}) {
  return (
    <svg
      className="admin-product-section-tab-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
    >
      {kind === "catalog" ? (
        <>
          <path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
          <path d="M4 7.5V16l8 5 8-5V7.5M12 12v9" />
        </>
      ) : kind === "approved" ? (
        <>
          <path d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
          <path d="M4 7.5V16l8 5 8-5V7.5M8.5 15l2 2 5-5" />
        </>
      ) : kind === "lines" ? (
        <>
          <path d="M4 5h16M4 12h16M4 19h16" />
          <path d="M7 3v4M12 10v4M17 17v4" />
        </>
      ) : (
        <path d="M12 5v14M5 12h14" />
      )}
    </svg>
  );
}

function CatalogLinesPanel({
  initialLines,
  products,
}: {
  initialLines: CatalogLine[];
  products: Product[];
}) {
  const utils = api.useUtils();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const linesQuery = api.catalog.lines.useQuery(undefined, {
    initialData: initialLines,
  });
  const createLine = api.catalog.createLine.useMutation({
    onSuccess: async () => {
      await utils.catalog.lines.invalidate();
      setName("");
      setDescription("");
      setError(null);
      setIsFormOpen(false);
    },
    onError: (mutationError) => setError(mutationError.message),
  });
  const customLines = linesQuery.data ?? initialLines;
  const lines = [
    ...Object.entries(LINE_LABELS).map(([id, name]) => ({
      id: `builtin-${id}`,
      filterId: id,
      name,
      slug: id.toLocaleLowerCase("es"),
      description: "Línea predeterminada",
      isActive: true,
      productCount: products.filter((product) => product.line === id).length,
    })),
    ...customLines.map((line) => ({ ...line, filterId: line.id })),
  ];

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Ingresá el nombre de la línea.");
      return;
    }
    createLine.mutate({
      name: name.trim(),
      description: description.trim() || null,
    });
  }

  return (
    <section className="admin-catalog-lines-section">
      <header className="admin-catalog-lines-header">
        <div>
          <p className="admin-products-count">
            {lines.length} líneas disponibles
          </p>
          <h2>Líneas de productos</h2>
          <p>Organizá el catálogo por colecciones o tipos de producto.</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--primary admin-new-product-button"
          onClick={() => {
            setError(null);
            setIsFormOpen(true);
          }}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
          Nueva línea
        </button>
      </header>

      <div className="admin-catalog-lines-list">
        {lines.map((line) => (
          <article
            key={line.id}
            className="admin-catalog-line-card"
            role="button"
            tabIndex={0}
            aria-label={`Ver productos de la línea ${line.name}`}
            onClick={() => setSelectedLineId(line.filterId)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedLineId(line.filterId);
              }
            }}
          >
            <span className="admin-catalog-line-card__icon" aria-hidden="true">
              <ProductLineIcon line="" />
            </span>
            <div>
              <h3>{line.name}</h3>
              <p>{line.description ?? "Sin descripción"}</p>
            </div>
            <small>
              {line.productCount}{" "}
              {line.productCount === 1 ? "producto" : "productos"}
            </small>
          </article>
        ))}
        {lines.length === 0 ? (
          <p className="admin-products-empty">
            Todavía no hay líneas personalizadas.
          </p>
        ) : null}
      </div>

      {selectedLineId ? (
        <div
          className="admin-catalog-line-products-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedLineId(null);
          }}
        >
          <section
            className="admin-catalog-line-products-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-catalog-line-products-title"
          >
            {(() => {
              const selectedLine = lines.find(
                (line) => line.filterId === selectedLineId,
              );
              const lineProducts = products.filter(
                (product) =>
                  product.line === selectedLineId ||
                  product.lineId === selectedLineId,
              );
              return (
                <>
                  <header className="admin-catalog-line-products-modal__header">
                    <div>
                      <span>Productos de la línea</span>
                      <h3 id="admin-catalog-line-products-title">
                        {selectedLine?.name ?? "Línea"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      aria-label="Cerrar productos de la línea"
                      onClick={() => setSelectedLineId(null)}
                    >
                      ×
                    </button>
                  </header>
                  <p className="admin-catalog-line-products-modal__count">
                    {lineProducts.length}{" "}
                    {lineProducts.length === 1
                      ? "producto encontrado"
                      : "productos encontrados"}
                  </p>
                  <div className="admin-catalog-line-products-list">
                    {lineProducts.map((product) => (
                      <article key={product.id}>
                        <span className="admin-catalog-line-product-thumb">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.images[0].alt ?? product.name}
                              fill
                              sizes="56px"
                            />
                          ) : (
                            <span aria-hidden="true">—</span>
                          )}
                        </span>
                        <div>
                          <strong>{product.name}</strong>
                          <small>{product.code}</small>
                        </div>
                        <span className="admin-chip">
                          {STATUS_LABELS[product.status]}
                        </span>
                      </article>
                    ))}
                    {lineProducts.length === 0 ? (
                      <p className="admin-products-empty">
                        No hay productos asociados a esta línea.
                      </p>
                    ) : null}
                  </div>
                </>
              );
            })()}
          </section>
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="admin-catalog-line-form-backdrop">
          <form className="admin-catalog-line-form" onSubmit={submit}>
            <div className="admin-catalog-line-form__header">
              <div>
                <span>Nueva línea</span>
                <h3>Crear línea de productos</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <label>
              <span>Nombre de la línea</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoFocus
              />
            </label>
            <label>
              <span>Descripción (opcional)</span>
              <textarea
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            {error ? (
              <p className="admin-product-modal__error">{error}</p>
            ) : null}
            <footer>
              <button
                type="button"
                className="admin-btn"
                onClick={() => setIsFormOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn--primary"
                disabled={createLine.isPending}
              >
                {createLine.isPending ? "Creando…" : "Crear línea"}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function ApprovedConventionProductsPanel({ clubs }: { clubs: Club[] }) {
  const approvedQuery = api.catalog.approvedConventionProducts.useQuery();
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<ApprovedConventionProduct | null>(
    null,
  );
  const approvedProducts = approvedQuery.data ?? [];

  if (!selectedClubId) {
    return (
      <section className="admin-approved-products-section">
        <div className="admin-approved-products-heading">
          <div>
            <span>CONVENIOS</span>
            <h2>Socios con productos aprobados</h2>
            <p>
              Elegí una organización para consultar sus diseños aprobados y
              publicarlos en el catálogo.
            </p>
          </div>
        </div>
        <div className="admin-approved-club-list">
          {clubs.map((club) => {
            const approvedCount = approvedProducts.filter(
              (item) => item.club.id === club.id,
            ).length;
            const pendingCount = approvedProducts.filter(
              (item) => item.club.id === club.id && !item.publishedProduct,
            ).length;
            return (
              <button
                type="button"
                key={club.id}
                onClick={() => setSelectedClubId(club.id)}
              >
                <span className="admin-approved-club-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M4 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M15 15c3.2 0 5 1.7 5.5 5M12 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </span>
                <span>
                  <strong>{club.name}</strong>
                  <small>
                    {approvedCount} aprobados · {pendingCount} para publicar
                  </small>
                </span>
                <b aria-hidden="true">›</b>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  const selectedClub = clubs.find((club) => club.id === selectedClubId);
  const clubProducts = approvedProducts.filter(
    (item) => item.club.id === selectedClubId,
  );

  return (
    <section className="admin-approved-products-section">
      <button
        type="button"
        className="admin-approved-products-back"
        onClick={() => setSelectedClubId(null)}
      >
        Volver a socios y convenios
      </button>
      <div className="admin-approved-products-heading">
        <div>
          <span>PRODUCTOS APROBADOS</span>
          <h2>{selectedClub?.name ?? "Club"}</h2>
          <p>
            El nombre, el club y la imagen provienen de la propuesta aprobada.
          </p>
        </div>
        <strong>{clubProducts.length} productos</strong>
      </div>
      <div className="admin-approved-product-list">
        {approvedQuery.isLoading ? (
          <div className="admin-approved-products-loading">
            <ModernSpinner label="Cargando..." />
          </div>
        ) : clubProducts.length ? (
          clubProducts.map((item) => (
            <article key={item.designId}>
              <div className="admin-approved-product-image">
                <Image
                  src={item.imageUrl}
                  alt={item.designName}
                  fill
                  sizes="120px"
                />
              </div>
              <div>
                <span>VERSIÓN {item.versionNumber} · APROBADA</span>
                <h3>{item.designName}</h3>
                <small>{item.club.name}</small>
              </div>
              {item.publishedProduct ? (
                <span className="admin-chip admin-chip--success">
                  Publicado
                </span>
              ) : (
                <button type="button" onClick={() => setCandidate(item)}>
                  Publicar
                </button>
              )}
            </article>
          ))
        ) : (
          <div className="admin-empty">
            Este club todavía no tiene productos aprobados.
          </div>
        )}
      </div>
      {candidate ? (
        <PublishApprovedProductModal
          candidate={candidate}
          onClose={() => setCandidate(null)}
        />
      ) : null}
    </section>
  );
}

function PublishApprovedProductModal({
  candidate,
  onClose,
}: {
  candidate: ApprovedConventionProduct;
  onClose: () => void;
}) {
  const utils = api.useUtils();
  const [name, setName] = useState(candidate.designName);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [error, setError] = useState<string | null>(null);
  const publish = api.catalog.publishApprovedDesign.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.catalog.approvedConventionProducts.invalidate(),
        utils.catalog.adminList.invalidate(),
      ]);
      onClose();
    },
    onError: (mutationError) => setError(mutationError.message),
  });
  const priceNumber = Number(price);
  const stockNumber = stock.trim() ? Number(stock) : null;
  const isValid =
    name.trim().length >= 2 &&
    price.trim() !== "" &&
    Number.isFinite(priceNumber) &&
    priceNumber >= 0 &&
    (stockNumber === null ||
      (Number.isInteger(stockNumber) && stockNumber >= 0));

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="admin-product-modal-backdrop">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-approved-product-title"
        className="admin-approved-product-modal"
      >
        <header>
          <div>
            <span>PRODUCTO APROBADO · {candidate.club.name}</span>
            <h2 id="publish-approved-product-title">Publicar producto</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </header>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            if (!isValid || publish.isPending) return;
            publish.mutate({
              designId: candidate.designId,
              name: name.trim(),
              priceInCents: Math.round(priceNumber * 100),
              stock: stockNumber,
            });
          }}
        >
          <div className="admin-approved-product-preview">
            <Image
              src={candidate.imageUrl}
              alt={candidate.designName}
              width={110}
              height={86}
            />
            <div>
              <strong>{candidate.designName}</strong>
              <span>{candidate.club.name}</span>
              <small>Versión {candidate.versionNumber} aprobada</small>
            </div>
          </div>
          <label>
            <span>Nombre de publicación</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            <span>Precio ($)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </label>
          <label>
            <span>Stock inicial (opcional)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              placeholder="Sin definir — por encargo"
            />
            {!stock.trim() ? (
              <small className="admin-product-stock-hint">
                Sin definir · producto por encargo
              </small>
            ) : null}
          </label>
          {error ? <p className="admin-product-error">{error}</p> : null}
          <footer>
            <button
              type="button"
              onClick={onClose}
              disabled={publish.isPending}
            >
              Cancelar
            </button>
            <button type="submit" disabled={!isValid || publish.isPending}>
              {publish.isPending ? "Publicando…" : "Publicar producto"}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}

function ProductEditorModal({
  draft: initialDraft,
  clubs,
  lines,
  lockedClubId,
  embedded = false,
  onClose,
}: {
  draft: ProductDraft;
  clubs: Club[];
  lines: CatalogLine[];
  lockedClubId?: string;
  embedded?: boolean;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(() => ({
    ...initialDraft,
    clubId: clubs.some(
      (club) =>
        club.id === (lockedClubId ?? initialDraft.clubId) &&
        club.isActive &&
        club.hasActiveAgreement,
    )
      ? (lockedClubId ?? initialDraft.clubId)
      : "",
  }));
  const [newSize, setNewSize] = useState("");
  const [withoutVariantColor, setWithoutVariantColor] = useState(
    () =>
      initialDraft.variants.length === 0 ||
      initialDraft.variants.every(
        (variant) => !variant.color.trim() || variant.color === UNDEFINED_COLOR,
      ),
  );
  const [withoutVariantStock, setWithoutVariantStock] = useState(
    () => !initialDraft.showStock,
  );
  const [error, setError] = useState<string | null>(null);
  const [isCommissionConfirmOpen, setIsCommissionConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductEditorTab>("information");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const utils = api.useUtils();

  const finishMutation = async () => {
    await utils.catalog.adminList.invalidate();
    onClose();
  };
  const createProduct = api.catalog.adminCreate.useMutation({
    onSuccess: finishMutation,
    onError: (mutationError) => {
      setIsCommissionConfirmOpen(false);
      setError(mutationError.message);
    },
  });
  const updateProduct = api.catalog.adminUpdate.useMutation({
    onSuccess: finishMutation,
    onError: (mutationError) => {
      setIsCommissionConfirmOpen(false);
      setError(mutationError.message);
    },
  });
  const deleteProduct = api.catalog.adminDelete.useMutation({
    onSuccess: finishMutation,
    onError: (mutationError) => setError(mutationError.message),
  });
  const isSaving = createProduct.isPending || updateProduct.isPending;
  const agreementClubs = clubs.filter(
    (club) => club.isActive && club.hasActiveAgreement,
  );
  const selectedClub = agreementClubs.find((club) => club.id === draft.clubId);
  const selectedCustomLine = lines.find((line) => line.id === draft.lineId);

  useEffect(() => {
    if (embedded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [embedded]);

  function updateField<K extends keyof ProductDraft>(
    field: K,
    value: ProductDraft[K],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  const availableSizes = Array.from(
    new Set(
      draft.variants
        .map((variant) => variant.size.trim())
        .filter((size) => size && size !== UNDEFINED_SIZE),
    ),
  );

  function addSize() {
    const size = newSize.trim();
    if (
      !size ||
      availableSizes.some(
        (availableSize) => availableSize.toLowerCase() === size.toLowerCase(),
      )
    ) {
      return;
    }

    const colors = withoutVariantColor
      ? [UNDEFINED_COLOR]
      : Array.from(
          new Set(
            draft.variants
              .map((variant) => variant.color.trim())
              .filter((color) => color && color !== UNDEFINED_COLOR),
          ),
        );
    const variantsForSize = (colors.length ? colors : [UNDEFINED_COLOR]).map(
      (color) => ({
        size,
        color,
        stock: "",
        sku: "",
      }),
    );
    updateField("variants", [...draft.variants, ...variantsForSize]);
    setNewSize("");
  }

  function removeSize(size: string) {
    updateField(
      "variants",
      draft.variants.filter(
        (variant) => variant.size.trim().toLowerCase() !== size.toLowerCase(),
      ),
    );
  }

  function toggleWithoutVariantColor() {
    const nextValue = !withoutVariantColor;
    setWithoutVariantColor(nextValue);
    if (nextValue) {
      const variantsBySize = new Map<string, VariantDraft>();
      for (const variant of draft.variants) {
        const normalizedSize = variant.size.trim() || UNDEFINED_SIZE;
        const key = normalizedSize.toLocaleLowerCase("es");
        const existing = variantsBySize.get(key);
        if (!existing) {
          variantsBySize.set(key, {
            ...variant,
            size: normalizedSize,
            color: UNDEFINED_COLOR,
          });
          continue;
        }

        const existingStock = existing.stock.trim()
          ? Number(existing.stock)
          : null;
        const variantStock = variant.stock.trim()
          ? Number(variant.stock)
          : null;
        variantsBySize.set(key, {
          ...existing,
          stock:
            existingStock !== null || variantStock !== null
              ? String((existingStock ?? 0) + (variantStock ?? 0))
              : "",
        });
      }
      updateField("variants", Array.from(variantsBySize.values()));
    }
  }

  function setWithoutStockMode(withoutStock: boolean) {
    setWithoutVariantStock(withoutStock);
    updateField("showStock", !withoutStock);
    if (withoutStock) {
      updateField(
        "variants",
        draft.variants.map((variant) => ({ ...variant, stock: "" })),
      );
    }
  }

  function toggleWithoutVariantStock() {
    setWithoutStockMode(!withoutVariantStock);
  }

  function payload() {
    return {
      name: draft.name,
      code: draft.code,
      description: draft.description || null,
      priceInCents: Math.round(Number(draft.price) * 100),
      compareAtCents: draft.compareAtPrice
        ? Math.round(Number(draft.compareAtPrice) * 100)
        : null,
      line: draft.line || null,
      lineId: draft.lineId || null,
      status: draft.status,
      clubId: draft.clubId || null,
      allowsCustomPrint: draft.allowsCustomPrint,
      isFeatured: draft.isFeatured,
      showStock: draft.showStock,
      images: draft.images.map((image) => ({
        ...(image.id ? { id: image.id } : {}),
        url: image.url,
        alt: image.alt || null,
        color:
          !image.color || image.color === UNDEFINED_COLOR ? null : image.color,
      })),
      variants: draft.variants.map((variant) => ({
        ...(variant.id ? { id: variant.id } : {}),
        size: variant.size.trim() || UNDEFINED_SIZE,
        color: variant.color.trim() || UNDEFINED_COLOR,
        stock:
          draft.showStock && variant.stock.trim()
            ? Number(variant.stock)
            : null,
        sku: variant.sku || null,
      })),
    };
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!draft.name.trim() || !draft.code.trim()) {
      setActiveTab("information");
      setError("Completá el nombre y el código del producto.");
      return;
    }
    if (!Number.isFinite(Number(draft.price)) || Number(draft.price) < 0) {
      setActiveTab("information");
      setError("Ingresá un precio válido.");
      return;
    }
    if (draft.images.some((image) => !image.url.trim())) {
      setActiveTab("images");
      setError("Completá o quitá las imágenes que no tengan archivo o URL.");
      return;
    }
    if (
      draft.variants.some(
        (variant) =>
          variant.stock.trim() &&
          (!Number.isInteger(Number(variant.stock)) ||
            Number(variant.stock) < 0),
      )
    ) {
      setActiveTab("variants");
      setError("El stock debe ser un número entero igual o mayor que cero.");
      return;
    }
    if (draft.clubId) {
      setIsCommissionConfirmOpen(true);
      return;
    }
    saveProduct();
  }

  function saveProduct() {
    const input = payload();
    if (draft.id) updateProduct.mutate({ ...input, id: draft.id });
    else createProduct.mutate(input);
  }

  if (typeof document === "undefined") return null;

  const editorContent = (
    <div
      className={
        embedded
          ? "admin-product-editor-inline"
          : "admin-product-modal-backdrop"
      }
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-product-editor-title"
        className={
          embedded
            ? "admin-product-modal admin-product-editor-inline__panel"
            : "admin-product-modal"
        }
      >
        <header className="admin-product-modal__header">
          <div>
            <span>{draft.id ? "Editar producto" : "Nuevo producto"}</span>
            <h2 id="admin-product-editor-title">
              {draft.name || "Producto sin nombre"}
            </h2>
          </div>
          {!embedded ? (
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              disabled={isSaving}
              aria-label="Cerrar editor"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
        </header>

        <form onSubmit={handleSubmit} className="admin-product-modal__body">
          <nav
            className="admin-product-tabs"
            role="tablist"
            aria-label="Secciones del producto"
          >
            {[
              { id: "information", label: "Información" },
              { id: "images", label: "Imágenes", count: draft.images.length },
              {
                id: "variants",
                label: "Variantes",
                count:
                  withoutVariantColor && withoutVariantStock
                    ? draft.variants.length
                      ? 1
                      : 0
                    : draft.variants.length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`admin-product-tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`admin-product-panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                className={activeTab === tab.id ? "is-active" : undefined}
                onClick={() => {
                  setActiveTab(tab.id as ProductEditorTab);
                  setError(null);
                }}
              >
                <ProductEditorTabIcon tab={tab.id as ProductEditorTab} />
                {tab.label}
                {tab.count !== undefined ? <span>{tab.count}</span> : null}
              </button>
            ))}
          </nav>

          {activeTab === "information" ? (
            <section
              role="tabpanel"
              id="admin-product-panel-information"
              aria-labelledby="admin-product-tab-information"
              className="admin-product-tab-panel admin-product-information-card"
            >
              <header className="admin-product-information-card__header">
                <span aria-hidden="true">
                  <ProductInformationIcon />
                </span>
                <div>
                  <h3>Información del producto</h3>
                  <p>
                    Completá los datos generales y de comercialización del
                    producto.
                  </p>
                </div>
              </header>

              <div className="admin-product-section-divider">
                <strong>Datos básicos</strong>
                <span />
              </div>
              <div className="admin-product-form-grid">
                <Field label="Nombre">
                  <input
                    required
                    value={draft.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                  />
                </Field>
                <Field label="Código">
                  <input
                    required
                    value={draft.code}
                    onChange={(event) =>
                      updateField("code", event.target.value)
                    }
                  />
                </Field>
                <Field label="Precio ($)">
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.price}
                    onChange={(event) =>
                      updateField("price", event.target.value)
                    }
                  />
                </Field>
                <Field label="Precio anterior ($)">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.compareAtPrice}
                    onChange={(event) =>
                      updateField("compareAtPrice", event.target.value)
                    }
                  />
                </Field>
                <fieldset className="admin-product-partner-select admin-product-line-select">
                  <legend>Línea</legend>
                  <details>
                    <summary>
                      <span aria-hidden="true">
                        <ProductLineIcon line={draft.line} />
                      </span>
                      <strong>
                        {selectedCustomLine?.name ??
                          (draft.line ? LINE_LABELS[draft.line] : "Sin línea")}
                      </strong>
                      <svg
                        className="admin-product-partner-select__chevron"
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="m5 8 5 5 5-5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </summary>
                    <div className="admin-product-partner-select__menu">
                      <button
                        type="button"
                        className={
                          !draft.line && !draft.lineId
                            ? "is-selected"
                            : undefined
                        }
                        onClick={(event) => {
                          updateField("line", "");
                          updateField("lineId", "");
                          event.currentTarget
                            .closest("details")
                            ?.removeAttribute("open");
                        }}
                      >
                        <span aria-hidden="true">
                          <ProductLineIcon line="" />
                        </span>
                        <span>
                          <strong>Sin línea</strong>
                          <small>Producto sin categoría de línea</small>
                        </span>
                      </button>
                      {Object.entries(LINE_LABELS).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          className={
                            draft.line === value && !draft.lineId
                              ? "is-selected"
                              : undefined
                          }
                          onClick={(event) => {
                            updateField("line", value as ProductLine);
                            updateField("lineId", "");
                            event.currentTarget
                              .closest("details")
                              ?.removeAttribute("open");
                          }}
                        >
                          <span aria-hidden="true">
                            <ProductLineIcon line={value as ProductLine} />
                          </span>
                          <span>
                            <strong>{label}</strong>
                            <small>Línea de producto</small>
                          </span>
                        </button>
                      ))}
                      {lines.map((customLine) => (
                        <button
                          key={customLine.id}
                          type="button"
                          className={
                            draft.lineId === customLine.id
                              ? "is-selected"
                              : undefined
                          }
                          onClick={(event) => {
                            updateField("line", "");
                            updateField("lineId", customLine.id);
                            event.currentTarget
                              .closest("details")
                              ?.removeAttribute("open");
                          }}
                        >
                          <span aria-hidden="true">
                            <ProductLineIcon line="" />
                          </span>
                          <span>
                            <strong>{customLine.name}</strong>
                            <small>
                              {customLine.description ?? "Línea personalizada"}
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>
                  </details>
                </fieldset>
                <fieldset className="admin-product-partner-select admin-product-visibility-select">
                  <legend>Visibilidad del producto</legend>
                  <details>
                    <summary>
                      <span aria-hidden="true">
                        <ProductVisibilityIcon
                          published={draft.status === "PUBLISHED"}
                        />
                      </span>
                      <span className="admin-product-visibility-select__copy">
                        <strong>
                          {draft.status === "PUBLISHED"
                            ? "Publicado"
                            : "No publicado"}
                        </strong>
                        <small>
                          {draft.status === "PUBLISHED"
                            ? "Visible y disponible para comprar."
                            : "Solo se verá en administración."}
                        </small>
                      </span>
                      <svg
                        className="admin-product-partner-select__chevron"
                        aria-hidden="true"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="m5 8 5 5 5-5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </summary>
                    <div className="admin-product-partner-select__menu">
                      <button
                        type="button"
                        className={
                          draft.status === "DRAFT" ? "is-selected" : undefined
                        }
                        onClick={(event) => {
                          updateField("status", "DRAFT");
                          event.currentTarget
                            .closest("details")
                            ?.removeAttribute("open");
                        }}
                      >
                        <span aria-hidden="true">
                          <ProductVisibilityIcon published={false} />
                        </span>
                        <span>
                          <strong>No publicado</strong>
                          <small>Solo se verá en administración.</small>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={
                          draft.status === "PUBLISHED"
                            ? "is-selected"
                            : undefined
                        }
                        onClick={(event) => {
                          updateField("status", "PUBLISHED");
                          event.currentTarget
                            .closest("details")
                            ?.removeAttribute("open");
                        }}
                      >
                        <span aria-hidden="true">
                          <ProductVisibilityIcon published />
                        </span>
                        <span>
                          <strong>Publicado</strong>
                          <small>Visible y disponible para comprar.</small>
                        </span>
                      </button>
                    </div>
                  </details>
                </fieldset>
              </div>

              <div className="admin-product-section-divider">
                <strong>Comercialización</strong>
                <span />
              </div>
              <div className="admin-product-form-grid">
                <fieldset
                  className={`admin-product-partner-select${
                    lockedClubId ? "admin-product-partner-select--locked" : ""
                  }`}
                >
                  <legend>Socio o convenio asociado</legend>
                  {lockedClubId ? (
                    <div className="admin-product-partner-select__locked-value">
                      <span aria-hidden="true">
                        {selectedClub?.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selectedClub.logoUrl} alt="" />
                        ) : (
                          <ProductPartnerIcon linked={Boolean(selectedClub)} />
                        )}
                      </span>
                      <strong>{selectedClub?.name ?? "Sin asociación"}</strong>
                      <small>Asociación automática</small>
                    </div>
                  ) : (
                    <details
                      onBlur={(event) => {
                        if (
                          !event.currentTarget.contains(event.relatedTarget)
                        ) {
                          event.currentTarget.removeAttribute("open");
                        }
                      }}
                    >
                      <summary>
                        <span aria-hidden="true">
                          {selectedClub?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={selectedClub.logoUrl} alt="" />
                          ) : (
                            <ProductPartnerIcon
                              linked={Boolean(selectedClub)}
                            />
                          )}
                        </span>
                        <strong>
                          {selectedClub?.name ?? "Sin asociación"}
                        </strong>
                        <svg
                          className="admin-product-partner-select__chevron"
                          aria-hidden="true"
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="m5 8 5 5 5-5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </summary>
                      <div className="admin-product-partner-select__menu">
                        <button
                          type="button"
                          className={!draft.clubId ? "is-selected" : undefined}
                          onClick={(event) => {
                            updateField("clubId", "");
                            event.currentTarget
                              .closest("details")
                              ?.removeAttribute("open");
                          }}
                        >
                          <span aria-hidden="true">
                            <ProductPartnerIcon linked={false} />
                          </span>
                          <span>
                            <strong>Sin asociación</strong>
                            <small>Producto independiente</small>
                          </span>
                        </button>
                        {agreementClubs.map((club) => (
                          <button
                            key={club.id}
                            type="button"
                            className={
                              draft.clubId === club.id
                                ? "is-selected"
                                : undefined
                            }
                            onClick={(event) => {
                              updateField("clubId", club.id);
                              event.currentTarget
                                .closest("details")
                                ?.removeAttribute("open");
                            }}
                          >
                            <span aria-hidden="true">
                              {club.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={club.logoUrl} alt="" />
                              ) : (
                                <ProductPartnerIcon linked />
                              )}
                            </span>
                            <span>
                              <strong>{club.name}</strong>
                              <small>Convenio activo</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    </details>
                  )}
                </fieldset>
                {lockedClubId && selectedClub ? (
                  <div
                    className="admin-product-club-association-notice"
                    role="note"
                  >
                    <strong>Producto asociado automáticamente</strong>
                    <span>
                      Quedará publicado en la tienda de {selectedClub.name} y
                      las ventas aplicarán las comisiones del convenio activo.
                    </span>
                  </div>
                ) : null}
                <Field label="Descripción" wide>
                  <textarea
                    rows={3}
                    value={draft.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                  />
                </Field>
              </div>

              <div className="admin-product-options">
                <label>
                  <input
                    type="checkbox"
                    checked={draft.allowsCustomPrint}
                    onChange={(event) =>
                      updateField("allowsCustomPrint", event.target.checked)
                    }
                  />
                  Permite estampa personalizada
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={draft.isFeatured}
                    onChange={(event) =>
                      updateField("isFeatured", event.target.checked)
                    }
                  />
                  Producto destacado
                </label>
              </div>

              <fieldset className="admin-product-sale-mode">
                <legend>
                  <span>Modalidad de venta</span>
                </legend>
                <p>
                  En ambas modalidades, cada compra ingresa al mismo flujo de
                  producción. Solo cambia el control de inventario.
                </p>
                <div>
                  <label
                    className={!draft.showStock ? "is-selected" : undefined}
                  >
                    <input
                      type="radio"
                      name="product-sale-mode"
                      checked={!draft.showStock}
                      onChange={() => setWithoutStockMode(true)}
                    />
                    <span aria-hidden="true">
                      <ProductSaleModeIcon mode="on-demand" />
                    </span>
                    <strong>Por encargo</strong>
                    <small>
                      El pedido va a producción y no descuenta stock.
                      Recomendado para prendas fabricadas a pedido.
                    </small>
                  </label>
                  <label
                    className={draft.showStock ? "is-selected" : undefined}
                  >
                    <input
                      type="radio"
                      name="product-sale-mode"
                      checked={draft.showStock}
                      onChange={() => setWithoutStockMode(false)}
                    />
                    <span aria-hidden="true">
                      <ProductSaleModeIcon mode="stock" />
                    </span>
                    <strong>Con stock limitado</strong>
                    <small>
                      El pedido va a producción, descuenta unidades y bloquea
                      nuevas compras cuando se agota el stock.
                    </small>
                  </label>
                </div>
              </fieldset>
            </section>
          ) : null}

          {activeTab === "images" ? (
            <section
              role="tabpanel"
              id="admin-product-panel-images"
              aria-labelledby="admin-product-tab-images"
              className="admin-product-tab-panel"
            >
              <EditorSection
                title="Imágenes asociadas"
                description="Seleccioná varias imágenes desde tu PC o agregalas por URL. Luego podés asociar cada una a un color."
                actionLabel="Agregar imagen"
                onAdd={() =>
                  updateField("images", [
                    ...draft.images,
                    { url: "", alt: "", color: UNDEFINED_COLOR },
                  ])
                }
              >
                <ImageUploadField
                  value=""
                  multiple
                  label="Subir varias imágenes"
                  placeholder="Seleccioná una o varias imágenes desde tu PC"
                  onChange={() => undefined}
                  onMultipleChange={(urls) =>
                    updateField("images", [
                      ...draft.images,
                      ...urls.map((url) => ({
                        url,
                        alt: "",
                        color: UNDEFINED_COLOR,
                      })),
                    ])
                  }
                />
                <div className="admin-product-images-editor">
                  {draft.images.map((image, index) => (
                    <div
                      key={image.id ?? index}
                      className="admin-product-image-row"
                    >
                      <div className="admin-product-image-preview">
                        <button
                          type="button"
                          className="admin-product-image-remove"
                          aria-label={`Eliminar imagen ${index + 1}`}
                          title="Eliminar imagen"
                          onClick={() =>
                            updateField(
                              "images",
                              draft.images.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
                        >
                          ×
                        </button>
                        {image.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image.url} alt="" />
                        ) : (
                          <span>Vista previa</span>
                        )}
                      </div>
                      <div className="admin-product-image-content">
                        <ImageUploadField
                          required
                          value={image.url}
                          label="Archivo o URL"
                          placeholder="/images/producto.png"
                          onChange={(url) => {
                            const images = [...draft.images];
                            images[index] = { ...image, url };
                            updateField("images", images);
                          }}
                        />
                        <div className="admin-product-image-details">
                          <ProductColorPicker
                            label="Color asociado (opcional)"
                            value={image.color}
                            allowUndefined
                            suggestedColors={draft.variants.map(
                              (variant) => variant.color,
                            )}
                            onChange={(color) => {
                              const images = [...draft.images];
                              images[index] = { ...image, color };
                              updateField("images", images);
                            }}
                          />
                          <Field label="Texto alternativo">
                            <input
                              value={image.alt}
                              onChange={(event) => {
                                const images = [...draft.images];
                                images[index] = {
                                  ...image,
                                  alt: event.target.value,
                                };
                                updateField("images", images);
                              }}
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </EditorSection>
            </section>
          ) : null}

          {activeTab === "variants" ? (
            <section
              role="tabpanel"
              id="admin-product-panel-variants"
              aria-labelledby="admin-product-tab-variants"
              className="admin-product-tab-panel"
            >
              <EditorSection
                title="Colores, talles y stock"
                description="Definí si el producto usa color o stock y agregá todos sus talles sin crear productos separados."
                actionLabel={
                  withoutVariantColor && withoutVariantStock
                    ? undefined
                    : "Agregar variante"
                }
                onAdd={
                  withoutVariantColor && withoutVariantStock
                    ? undefined
                    : () =>
                        updateField("variants", [
                          ...draft.variants,
                          {
                            size: UNDEFINED_SIZE,
                            color: UNDEFINED_COLOR,
                            stock: "",
                            sku: "",
                          },
                        ])
                }
              >
                <div className="admin-product-variant-modes">
                  <button
                    type="button"
                    className={withoutVariantColor ? "is-active" : undefined}
                    aria-pressed={withoutVariantColor}
                    onClick={toggleWithoutVariantColor}
                  >
                    <span aria-hidden="true">
                      <ProductVariantModeIcon mode="color" />
                    </span>
                    <span>
                      <strong>Sin color</strong>
                      <small>Una única prenda sin color asociado.</small>
                    </span>
                    <span className="admin-product-variant-mode-check" />
                  </button>
                  <button
                    type="button"
                    className={withoutVariantStock ? "is-active" : undefined}
                    aria-pressed={withoutVariantStock}
                    onClick={toggleWithoutVariantStock}
                  >
                    <span aria-hidden="true">
                      <ProductVariantModeIcon mode="stock" />
                    </span>
                    <span>
                      <strong>Sin stock</strong>
                      <small>No limita compras; se fabrica por encargo.</small>
                    </span>
                    <span className="admin-product-variant-mode-check" />
                  </button>
                </div>
                <div className="admin-product-sizes-manager">
                  <div>
                    <strong>Talles del producto</strong>
                    <small>
                      {withoutVariantColor && withoutVariantStock
                        ? "Todos los talles pertenecen a este mismo producto."
                        : "Cargalos una vez y luego completá los datos de cada variante."}
                    </small>
                  </div>
                  <div className="admin-product-size-add">
                    <input
                      aria-label="Nuevo talle"
                      placeholder="Ej.: S, XL, 42"
                      value={newSize}
                      onChange={(event) => setNewSize(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addSize();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addSize}
                      disabled={!newSize.trim()}
                    >
                      <span aria-hidden="true">+</span> Agregar talle
                    </button>
                  </div>
                  <div
                    className="admin-product-size-list"
                    aria-label="Talles cargados"
                  >
                    {availableSizes.length ? (
                      availableSizes.map((size) => (
                        <span key={size}>
                          {size}
                          <button
                            type="button"
                            aria-label={`Quitar talle ${size}`}
                            onClick={() => removeSize(size)}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <small>Todavía no hay talles cargados.</small>
                    )}
                  </div>
                </div>
                {withoutVariantColor && withoutVariantStock ? (
                  <div className="admin-product-variant-grouped-summary">
                    <span aria-hidden="true">
                      <ProductVariantModeIcon mode="grouped" />
                    </span>
                    <div>
                      <strong>Producto único, sin color y sin stock</strong>
                      <p>
                        Los talles se agregan a este mismo producto y las
                        compras ingresan por encargo.
                      </p>
                    </div>
                    <b>{availableSizes.length} talles</b>
                  </div>
                ) : (
                  <div className="admin-product-variants-editor">
                    {draft.variants.map((variant, index) => (
                      <div
                        key={variant.id ?? index}
                        className="admin-product-variant-row"
                      >
                        {withoutVariantColor ? (
                          <Field label="Color">
                            <div className="admin-product-variant-static-value">
                              <ProductVariantModeIcon mode="color" />
                              Sin color
                            </div>
                          </Field>
                        ) : (
                          <ProductColorPicker
                            label="Color"
                            value={variant.color}
                            allowUndefined
                            onChange={(color) => {
                              const variants = [...draft.variants];
                              variants[index] = {
                                ...variant,
                                color,
                              };
                              updateField("variants", variants);
                            }}
                          />
                        )}
                        <Field label="Talle">
                          <select
                            value={variant.size}
                            onChange={(event) => {
                              const variants = [...draft.variants];
                              variants[index] = {
                                ...variant,
                                size: event.target.value,
                              };
                              updateField("variants", variants);
                            }}
                          >
                            <option value={UNDEFINED_SIZE}>
                              Talle sin definir
                            </option>
                            {variant.size &&
                            variant.size !== UNDEFINED_SIZE &&
                            !availableSizes.includes(variant.size) ? (
                              <option value={variant.size}>
                                {variant.size}
                              </option>
                            ) : null}
                            {availableSizes
                              .filter((size) => size !== UNDEFINED_SIZE)
                              .map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                          </select>
                        </Field>
                        {withoutVariantStock ? (
                          <Field label="Stock">
                            <div className="admin-product-variant-static-value">
                              <ProductVariantModeIcon mode="stock" />
                              Sin stock · por encargo
                            </div>
                          </Field>
                        ) : (
                          <Field label="Stock (opcional)">
                            <input
                              type="number"
                              min="0"
                              value={variant.stock}
                              placeholder="Sin definir — por encargo"
                              onChange={(event) => {
                                const variants = [...draft.variants];
                                variants[index] = {
                                  ...variant,
                                  stock: event.target.value,
                                };
                                updateField("variants", variants);
                              }}
                            />
                            {!variant.stock.trim() ? (
                              <small className="admin-product-stock-hint">
                                Sin definir · producto por encargo
                              </small>
                            ) : null}
                          </Field>
                        )}
                        <Field label="Código de variante">
                          <input
                            placeholder="Automático"
                            value={variant.sku}
                            onChange={(event) => {
                              const variants = [...draft.variants];
                              variants[index] = {
                                ...variant,
                                sku: event.target.value,
                              };
                              updateField("variants", variants);
                            }}
                          />
                        </Field>
                        <button
                          type="button"
                          className="admin-product-remove"
                          onClick={() =>
                            updateField(
                              "variants",
                              draft.variants.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            )
                          }
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </EditorSection>
            </section>
          ) : null}

          {error ? <p className="admin-product-modal__error">{error}</p> : null}

          <footer className="admin-product-modal__footer">
            {draft.id ? (
              <button
                type="button"
                className="admin-product-delete"
                disabled={isSaving || deleteProduct.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      `¿Eliminar definitivamente “${draft.name}”? Esta acción no se puede deshacer.`,
                    )
                  ) {
                    deleteProduct.mutate({ id: draft.id! });
                  }
                }}
              >
                Eliminar producto
              </button>
            ) : (
              <span className="admin-product-save-note">
                Los cambios se aplican al guardar el producto.
              </span>
            )}
            <div>
              <button
                type="button"
                className="admin-btn admin-product-home-button"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn--primary admin-product-home-button"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <ModernSpinner label="Cargando..." /> Cargando...
                  </>
                ) : draft.id ? (
                  "Guardar cambios"
                ) : (
                  "Guardar producto"
                )}
              </button>
            </div>
          </footer>
        </form>
      </section>
      <ConfirmDialog
        open={isCommissionConfirmOpen}
        className="admin-confirm-dialog--commission"
        title="Confirmar asociación al convenio"
        message={`Al guardar este producto, ${selectedClub?.name ?? "la organización seleccionada"} comenzará a cobrar comisiones por las próximas ventas de esta prenda, según las condiciones de su convenio activo.`}
        confirmLabel="Confirmar y guardar"
        cancelLabel="Revisar"
        icon={<ProductPartnerIcon linked />}
        cancelIcon={<DialogReviewIcon />}
        confirmIcon={<DialogConfirmIcon />}
        danger={false}
        isConfirming={isSaving}
        confirmingLabel="Guardando…"
        onCancel={() => setIsCommissionConfirmOpen(false)}
        onConfirm={saveProduct}
      />
    </div>
  );

  return embedded ? editorContent : createPortal(editorContent, document.body);
}

function Field({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? "admin-product-form-grid__wide" : undefined}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function EditorSection({
  title,
  description,
  actionLabel,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-product-editor-section" data-motion-ignore>
      <header>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        {actionLabel && onAdd ? (
          <button
            type="button"
            className={
              actionLabel === "Agregar variante"
                ? "admin-btn admin-product-action-large admin-product-home-button"
                : "admin-btn admin-product-section-action"
            }
            onClick={onAdd}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
            {actionLabel}
          </button>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function ProductColorPicker({
  label,
  value,
  suggestedColors = [],
  allowUndefined = false,
  onChange,
}: {
  label: string;
  value: string;
  suggestedColors?: string[];
  allowUndefined?: boolean;
  onChange: (color: string) => void;
}) {
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const colors = [...suggestedColors, ...PRODUCT_COLOR_PALETTE].filter(
    (color, index, all) =>
      color.trim() &&
      color !== UNDEFINED_COLOR &&
      all.findIndex(
        (candidate) =>
          candidate.trim().toLocaleLowerCase("es") ===
          color.trim().toLocaleLowerCase("es"),
      ) === index,
  );

  return (
    <div className="admin-product-color-picker">
      <span>{label}</span>
      <details
        ref={dropdownRef}
        className="admin-product-color-dropdown"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            event.currentTarget.removeAttribute("open");
          }
        }}
      >
        <summary>
          <span
            className={`admin-product-color-dropdown__swatch${
              value === UNDEFINED_COLOR ? "is-undefined" : ""
            }`}
            style={
              value === UNDEFINED_COLOR
                ? undefined
                : { backgroundColor: colorToHex(value || "Violeta") }
            }
          />
          <strong>
            {value === UNDEFINED_COLOR
              ? "Color sin definir"
              : value || "Elegí un color"}
          </strong>
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
            <path
              d="m5 8 5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <div
          className="admin-product-color-palette"
          role="group"
          aria-label={label}
        >
          {allowUndefined ? (
            <button
              type="button"
              className={value === UNDEFINED_COLOR ? "is-selected" : undefined}
              aria-label="Seleccionar color sin definir"
              aria-pressed={value === UNDEFINED_COLOR}
              onClick={() => {
                onChange(UNDEFINED_COLOR);
                dropdownRef.current?.removeAttribute("open");
              }}
            >
              <span className="is-undefined" aria-hidden="true" />
              <small>Color sin definir</small>
            </button>
          ) : null}
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className={
                value.toLocaleLowerCase("es") === color.toLocaleLowerCase("es")
                  ? "is-selected"
                  : undefined
              }
              aria-label={`Seleccionar ${color}`}
              aria-pressed={
                value.toLocaleLowerCase("es") === color.toLocaleLowerCase("es")
              }
              onClick={() => {
                onChange(color);
                dropdownRef.current?.removeAttribute("open");
              }}
            >
              <span style={{ backgroundColor: colorToHex(color) }} />
              <small>{color}</small>
            </button>
          ))}
          <label
            className={
              /^#[0-9a-f]{6}$/i.test(value)
                ? "admin-product-custom-color is-selected"
                : "admin-product-custom-color"
            }
            title="Elegir un color personalizado"
          >
            <input
              type="color"
              value={colorToHex(value || "Violeta")}
              aria-label="Elegir un color personalizado"
              onChange={(event) => {
                onChange(event.target.value);
                dropdownRef.current?.removeAttribute("open");
              }}
            />
            <span>Color personalizado</span>
          </label>
        </div>
      </details>
    </div>
  );
}

function ProductEditorTabIcon({ tab }: { tab: ProductEditorTab }) {
  const path =
    tab === "information"
      ? "M7 3h7l5 5v13H7V3Zm7 0v5h5M10 13h6M10 17h6"
      : tab === "images"
        ? "M4 5h16v14H4V5Zm0 10 4-4 3 3 2-2 7 7M15.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 3"
        : "M12 3v18M3 8h18M3 16h18M7 5v6M17 13v6";

  return (
    <svg
      className="admin-product-tab-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProductVisibilityIcon({ published }: { published: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      {published ? (
        <>
          <path
            d="M2.8 12s3.4-6 9.2-6 9.2 6 9.2 6-3.4 6-9.2 6-9.2-6-9.2-6Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="12"
            r="2.7"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </>
      ) : (
        <>
          <path
            d="M9.7 6.3A9 9 0 0 1 12 6c5.8 0 9.2 6 9.2 6a14 14 0 0 1-2.3 3M6.2 7.6A15 15 0 0 0 2.8 12s3.4 6 9.2 6a9 9 0 0 0 3.1-.5M3.5 3.5l17 17"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

function ProductInformationIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="m4 7 8-4 8 4v10l-8 4-8-4V7Zm0 0 8 4m8-4-8 4m0 10V11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProductSaleModeIcon({ mode }: { mode: "on-demand" | "stock" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      {mode === "on-demand" ? (
        <path
          d="M12 3c.5 4.6 3.4 7.5 8 8-4.6.5-7.5 3.4-8 8-.5-4.6-3.4-7.5-8-8 4.6-.5 7.5-3.4 8-8Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <path
            d="M5 5h14v14H5V5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9 5v14M15 5v14M5 9h14M5 15h14"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </>
      )}
    </svg>
  );
}

function ProductVariantModeIcon({
  mode,
}: {
  mode: "color" | "stock" | "grouped";
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      {mode === "color" ? (
        <>
          <path
            d="M12 3a9 9 0 1 0 0 18h1.4a1.8 1.8 0 0 0 0-3.6H12a2 2 0 0 1 0-4h3.2A5.8 5.8 0 0 0 21 7.6C19.3 4.8 16 3 12 3Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 4 20 20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      ) : mode === "stock" ? (
        <>
          <path
            d="M4 7.5 12 3l8 4.5V17l-8 4-8-4V7.5Zm0 0 8 4 8-4M12 21v-9.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.5 3.5 20.5 20.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <path
            d="M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M8 9h8M8 13h5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

function ProductPartnerIcon({ linked }: { linked: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      {linked ? (
        <>
          <path
            d="M7.5 11.5 10 14a2 2 0 0 0 2.8 0l3.7-3.7M3 12l4-4 3 3-4 4-3-3Zm18 0-4-4-2 2 4 4 2-2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="m7 15 2 2a2 2 0 0 0 2.8 0l5.2-5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </>
      ) : (
        <path
          d="M5 12h14M7 7l10 10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function DialogReviewIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="m4 20 4.2-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5.2 16 4 20Zm10.2-13 3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DialogConfirmIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="m5 12.5 4.2 4.2L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProductLineIcon({ line }: { line: ProductLine | "" }) {
  const path =
    line === "CLUB"
      ? "M12 3 14 8l5 .4-3.8 3.2 1.2 5-4.4-2.7-4.4 2.7 1.2-5L5 8.4 10 8l2-5Z"
      : line === "URBANA"
        ? "M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 9h.01M15 9h.01M9 13h.01M15 13h.01"
        : line === "TRAINING"
          ? "M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"
          : line === "TRABAJO"
            ? "M4 8h16v12H4V8Zm4 0V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M4 12h16"
            : line === "ESCOLAR"
              ? "M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 0-4 0V4Zm0 0v16m4 0V8h6"
              : "M5 5h14v14H5V5Zm4 4h6m-6 4h6m-6 4h4";

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
