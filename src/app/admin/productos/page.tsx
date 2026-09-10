import { AdminPage, AdminPanel } from "elestampadero/shared/ui/admin";
import { api } from "elestampadero/trpc/server";
import { AdminProductsManager } from "elestampadero/views/admin-products";

export default async function AdminProductsPage() {
  const [products, clubs, lines] = await Promise.all([
    api.catalog.adminList(),
    api.clubs.list(),
    api.catalog.lines(),
  ]);

  return (
    <AdminPage
      module="Módulo de Productos"
      title="Gestión de productos"
      className="admin-products-page"
    >
      <AdminPanel className="admin-panel-pad admin-products-panel">
        <AdminProductsManager
          initialProducts={products}
          clubs={clubs}
          initialLines={lines}
        />
      </AdminPanel>
    </AdminPage>
  );
}
