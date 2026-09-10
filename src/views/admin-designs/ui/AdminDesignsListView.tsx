"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  AdminAddButton,
  AdminPage,
  AdminPanel,
  ImageUploadField,
} from "elestampadero/shared/ui/admin";
import { ModernSpinner } from "elestampadero/shared/ui/motion";
import { api } from "elestampadero/trpc/react";
import { useAdminNavigation } from "elestampadero/shared/ui/admin/AdminNavigationContext";

export function AdminDesignsListView() {
  const { navigate } = useAdminNavigation();
  const utils = api.useUtils();
  const clubs = api.clubs.list.useQuery();
  const designs = api.designs.listAll.useQuery();
  const [clubId, setClubId] = useState("");
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [page, setPage] = useState(1);
  const [navigatingDesignId, setNavigatingDesignId] = useState<string | null>(
    null,
  );
  const create = api.designs.create.useMutation({
    onSuccess: async () => {
      setShowCreateModal(false);
      setClubId("");
      setTitle("");
      setImageUrl("");
      setImageUrls([]);
      setCustomerName("");
      await utils.designs.listAll.invalidate();
    },
  });
  const canCreate =
    (isPersonalized ? customerName.trim() : clubId) && title.trim() && imageUrl;
  const designsByClub = (designs.data ?? []).reduce((groups, design) => {
    if (!design.clubId) return groups;
    const current = groups.get(design.clubId) ?? {
      designCount: 0,
      versionCount: 0,
    };
    current.designCount += 1;
    current.versionCount += design.latestVersionNumber;
    groups.set(design.clubId, current);
    return groups;
  }, new Map<string, { designCount: number; versionCount: number }>());
  const clubDestinations = (clubs.data ?? []).map((club) => {
    const totals = designsByClub.get(club.id);
    return {
      key: club.id,
      name: club.name,
      logoUrl: club.logoUrl,
      kind: "Club",
      href: `/admin/disenos/club/${club.id}`,
      designCount: totals?.designCount ?? 0,
      versionCount: totals?.versionCount ?? 0,
    };
  });
  const personalizedDestinations = (designs.data ?? [])
    .filter((design) => !design.clubId)
    .map((design) => ({
      key: `personal-${design.id}`,
      name: design.clubName,
      logoUrl: null,
      kind: "Cliente personalizado",
      href: `/admin/disenos/${design.id}`,
      designCount: 1,
      versionCount: design.latestVersionNumber,
    }));
  const destinations = [...clubDestinations, ...personalizedDestinations];
  const destinationsPerPage = 10;
  const totalPages = Math.max(
    1,
    Math.ceil(destinations.length / destinationsPerPage),
  );
  const visibleDestinations = destinations.slice(
    (page - 1) * destinationsPerPage,
    page * destinationsPerPage,
  );
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  return (
    <AdminPage
      module="Módulo de Diseños"
      title="Clubes, clientes y diseños"
      className="admin-designs-page"
    >
      <AdminPanel className="admin-panel-pad">
        <div className="admin-toolbar" style={{ marginBottom: 16 }}>
          <h2 className="admin-panel-title">Destinos de los diseños</h2>
          <AdminAddButton
            type="button"
            onClick={() => setShowCreateModal(true)}
          >
            Nuevo diseño
          </AdminAddButton>
        </div>
        <div
          className="admin-table-wrap admin-design-list-wrap"
          style={{ marginTop: 20 }}
        >
          <table className="admin-table admin-design-list-table">
            <thead>
              <tr>
                <th>Socio</th>
                <th>Tipo</th>
                <th>Diseños</th>
                <th>Versiones</th>
              </tr>
            </thead>
            <tbody>
              {visibleDestinations.map((destination) => (
                <tr
                  key={destination.key}
                  tabIndex={0}
                  className="admin-design-list-row"
                  onClick={(event) => {
                    event.preventDefault();
                    setNavigatingDesignId(destination.key);
                    navigate(destination.href, "Diseños");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setNavigatingDesignId(destination.key);
                      navigate(destination.href, "Diseños");
                    }
                  }}
                >
                  <td>
                    <div className="admin-design-partner-cell">
                      <span className="admin-design-partner-avatar">
                        {destination.logoUrl ? (
                          <Image
                            src={destination.logoUrl}
                            alt={`Logo de ${destination.name}`}
                            width={42}
                            height={42}
                          />
                        ) : (
                          destination.name.slice(0, 1).toUpperCase()
                        )}
                      </span>
                      <Link className="admin-link" href={destination.href}>
                        {destination.name}
                      </Link>
                    </div>
                  </td>
                  <td>{destination.kind}</td>
                  <td>{destination.designCount}</td>
                  <td>
                    {navigatingDesignId === destination.key ? (
                      <span className="admin-design-row-loading">
                        <ModernSpinner label="Cargando..." />
                      </span>
                    ) : (
                      destination.versionCount
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <nav
          className="admin-designs-pagination admin-clubs-pagination"
          aria-label="Páginas de diseños"
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
      </AdminPanel>
      {showCreateModal
        ? createPortal(
            <div className="admin-agreement-modal-backdrop">
              <section
                className="admin-agreement-modal admin-design-create-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-design-create-title"
              >
                <header>
                  <div>
                    <span>Módulo de Diseños</span>
                    <h2 id="admin-design-create-title">Crear diseño</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    aria-label="Cerrar"
                  >
                    ×
                  </button>
                </header>
                <form
                  className="admin-design-create-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!canCreate || create.isPending) return;
                    create.mutate({
                      ...(isPersonalized
                        ? { customerName: customerName.trim() }
                        : { clubId }),
                      title,
                      imageUrl,
                      imageUrls,
                    });
                  }}
                >
                  <div
                    className="admin-design-target-type"
                    role="group"
                    aria-label="Tipo de diseño"
                  >
                    <button
                      type="button"
                      className={!isPersonalized ? "is-active" : undefined}
                      onClick={() => setIsPersonalized(false)}
                    >
                      <DesignFormIcon name="club" />
                      Para un club
                    </button>
                    <button
                      type="button"
                      className={isPersonalized ? "is-active" : undefined}
                      onClick={() => setIsPersonalized(true)}
                    >
                      <DesignFormIcon name="person" />
                      Para una persona
                    </button>
                  </div>
                  {isPersonalized ? (
                    <label className="admin-design-create-field">
                      <span>
                        <DesignFormIcon name="person" /> Nombre del cliente
                      </span>
                      <input
                        className="admin-input admin-design-club-select"
                        aria-label="Nombre del cliente"
                        placeholder="Nombre del cliente"
                        value={customerName}
                        onChange={(event) =>
                          setCustomerName(event.target.value)
                        }
                      />
                    </label>
                  ) : (
                    <label className="admin-design-create-field">
                      <span>
                        <DesignFormIcon name="club" /> Elegí el club
                      </span>
                      <select
                        className="admin-select admin-design-club-select"
                        aria-label="Club de la propuesta"
                        value={clubId}
                        onChange={(event) => setClubId(event.target.value)}
                      >
                        <option value="">Seleccioná un club</option>
                        {clubs.data?.map((club) => (
                          <option key={club.id} value={club.id}>
                            {club.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="admin-design-create-field">
                    <span>
                      <DesignFormIcon name="title" /> Título del diseño
                    </span>
                    <input
                      className="admin-input admin-design-title-input"
                      aria-label="Título del diseño"
                      placeholder="Ej. Camiseta alternativa 2024"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </label>
                  <ImageUploadField
                    label="Imagen del diseño"
                    labelIcon={<DesignFormIcon name="image" />}
                    placeholder="https://..."
                    uploadLabel="Seleccioná o arrastrá una o varias imágenes"
                    value={imageUrl}
                    multiple
                    onChange={(url) => {
                      setImageUrl(url);
                      setImageUrls(url ? [url] : []);
                    }}
                    onMultipleChange={(urls) => {
                      setImageUrls(urls);
                      setImageUrl(urls[0] ?? "");
                    }}
                  />
                  <footer>
                    <button
                      type="button"
                      className="admin-btn"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="admin-btn admin-btn--primary"
                      disabled={!canCreate || create.isPending}
                    >
                      {create.isPending ? "Creando..." : "Crear diseño"}
                    </button>
                  </footer>
                </form>
              </section>
            </div>,
            document.body,
          )
        : null}
    </AdminPage>
  );
}

function DesignFormIcon({
  name,
}: {
  name: "club" | "person" | "title" | "image";
}) {
  const paths = {
    club: (
      <path d="M4 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M15 15c3.2 0 5 1.7 5.5 5M12 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    ),
    person: (
      <path d="M19 20a7 7 0 0 0-14 0m10-11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    ),
    title: <path d="M5 5h14M5 12h10M5 19h14" />,
    image: <path d="M4 5h16v14H4V5Zm2 11 3-3 2 2 3-4 4 5M9 9h.01" />,
  };

  return (
    <svg
      className="admin-design-form-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
