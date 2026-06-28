import type { AdminBreadcrumbItem } from "./admin-breadcrumb";
import { AdminBreadcrumb } from "./admin-breadcrumb";
import { AdminSidebar } from "./admin-sidebar";

type AdminShellProps = {
  activeSlug?: string;
  breadcrumbItems?: AdminBreadcrumbItem[];
  children: React.ReactNode;
  restaurantName?: string;
};

export function AdminShell({
  activeSlug,
  breadcrumbItems,
  children,
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
        {children}
      </main>
    </div>
  );
}
