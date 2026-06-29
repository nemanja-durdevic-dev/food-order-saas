"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ClipboardList,
  History,
  LogOut,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeft,
  PlusCircle,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((prev) => !prev);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/staff/login");
  }

  const navItems = [
    { href: "/staff", label: "Dashboard", icon: LayoutDashboard },
    { href: "/staff/orders", label: "Orders", icon: ClipboardList },
    { href: "/staff/menu-items", label: "Menu Items", icon: UtensilsCrossed },
    { href: "/staff/order", label: "New Order", icon: PlusCircle },
    { href: "/staff/completed", label: "Completed", icon: History },
  ];

  const sidebarContent = (
    <>
      {/* Header */}
      <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} mb-6`}>
        {!collapsed && <h2 className="font-bold text-lg text-foreground">Kitchen</h2>}
        <button
          onClick={toggleCollapsed}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors hidden lg:block"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button"
        >
          {collapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors lg:hidden"
          title="Close menu"
          type="button"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 text-sm">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <a
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                collapsed ? "justify-center px-2" : ""
              } ${
                isActive
                  ? "bg-black/10 text-primary font-semibold"
                  : "text-foreground hover:bg-muted"
              }`}
              href={item.href}
              key={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="size-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </a>
          );
        })}
      </nav>

      {/* Sign out at bottom */}
      <div className="mt-auto">
        <button
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted hover:text-destructive ${
            collapsed ? "justify-center px-2" : ""
          }`}
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
          type="button"
        >
          <LogOut className="size-5 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </>
  );

  if (pathname === "/staff/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-background p-3 transition-transform duration-200 lg:static lg:z-auto lg:shrink-0 lg:overflow-hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${collapsed ? "lg:w-16" : "lg:w-56"}`}
      >
        {sidebarContent}
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col min-w-0 overflow-y-auto p-4 lg:p-6">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 mb-4 lg:hidden shrink-0">
          <button
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(true)}
            type="button"
            title="Open menu"
          >
            <Menu className="size-5" />
          </button>
        </div>

        {children}
      </main>
    </div>
  );
}
