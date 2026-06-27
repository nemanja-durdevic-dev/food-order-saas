import { AdminSidebar } from "./admin-sidebar";

type AdminShellProps = {
  activeSlug?: string;
  children: React.ReactNode;
  restaurantName?: string;
};

export function AdminShell({ activeSlug, children, restaurantName }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminSidebar activeSlug={activeSlug} restaurantName={restaurantName} />
      <main className="min-w-0 px-4 pb-6 pt-20 sm:px-6 lg:ml-20 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
