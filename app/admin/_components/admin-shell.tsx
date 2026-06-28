import type { AdminBreadcrumbItem } from "./admin-breadcrumb";
import { AdminBreadcrumb } from "./admin-breadcrumb";
import { AdminSidebar } from "./admin-sidebar";
import { MenuChanges } from "@/components/admin/menu-changes";

type AdminShellProps = {
  activeSlug?: string;
  breadcrumbItems?: AdminBreadcrumbItem[];
  children: React.ReactNode;
  menuDirty?: boolean;
  menuPublishedAt?: string | null;
  restaurantName?: string;
};

export function AdminShell({
  activeSlug,
  breadcrumbItems,
  children,
  menuDirty = false,
  menuPublishedAt,
  restaurantName,
}: AdminShellProps) {
  const resolvedBreadcrumbItems = breadcrumbItems?.map((item, index) =>
    index === 0 && restaurantName ? { ...item, label: restaurantName } : item,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminSidebar activeSlug={activeSlug} breadcrumbItems={resolvedBreadcrumbItems} />
      <main className="min-w-0 px-4 pb-6 pt-20 sm:px-6 lg:ml-16 lg:px-8 lg:py-8">
        <AdminBreadcrumb
          className="mb-6 hidden text-sm text-muted-foreground lg:block"
          items={resolvedBreadcrumbItems}
        />
        {menuDirty ? (
          <section className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <div>
              <p className="text-sm font-semibold">Unpublished menu changes</p>
              <p className="mt-1 text-sm text-amber-800">
                Customers see the last published menu until you publish these admin changes.
              </p>
            </div>
            <MenuChanges />
          </section>
        ) : menuPublishedAt ? (
          <p className="mb-6 text-xs text-muted-foreground">
            Menu published{" "}
            {new Intl.DateTimeFormat("en", { dateStyle: "short", timeStyle: "short" }).format(
              new Date(menuPublishedAt),
            )}
          </p>
        ) : null}
        {children}
      </main>
    </div>
  );
}
