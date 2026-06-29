import Link from "next/link";
import { Home } from "lucide-react";
import type { AdminBreadcrumbItem } from "./admin-breadcrumb";
import { AdminBreadcrumb } from "./admin-breadcrumb";
import { AdminSidebar } from "./admin-sidebar";

type AdminShellProps = {
  activeSlug?: string;
  breadcrumbItems?: AdminBreadcrumbItem[];
  children: React.ReactNode;
  restaurantName?: string;
};

export async function AdminShell({
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
      <header className="fixed inset-x-0 top-0 z-40 hidden h-14 items-center gap-4 border-b border-border bg-background px-4 sm:px-6 lg:flex">
        <Link
          className="flex items-center rounded-md p-1.5 text-foreground transition-colors hover:bg-muted"
          href="/admin"
        >
          <Home className="size-5" />
        </Link>
        <span className="text-sm font-semibold">{restaurantName ?? "Admin"}</span>
      </header>
      <AdminSidebar activeSlug={activeSlug} breadcrumbItems={resolvedBreadcrumbItems} />
      <main className="min-w-0 px-4 pb-6 pt-[5.5rem] sm:px-6 lg:ml-16 lg:px-8 lg:pt-24">
        <AdminBreadcrumb
          className="mb-6 hidden text-sm text-muted-foreground lg:block"
          items={resolvedBreadcrumbItems}
        />
        {children}
      </main>
    </div>
  );
}
