"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { adminResources } from "@/lib/admin/resources";
import { createClient } from "@/lib/supabase-browser";

type AdminSidebarProps = {
  activeSlug?: string;
  restaurantName?: string;
};

export function AdminSidebar({ activeSlug, restaurantName }: AdminSidebarProps) {
  const supabase = createClient();
  const [expanded, setExpanded] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  const collapsed = !expanded;

  return (
    <aside
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setExpanded(false);
        }
      }}
      className={`fixed inset-y-0 left-0 z-30 hidden h-screen flex-col border-r border-border bg-card px-3 py-5 shadow-sm transition-[width] duration-200 lg:flex ${
        collapsed ? "w-20" : "w-64"
      }`}
      onFocus={() => setExpanded(true)}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div
        className={`mb-6 flex min-h-12 items-start ${collapsed ? "justify-center" : "justify-start"}`}
      >
        {collapsed ? (
          <div className="grid size-10 place-items-center rounded-md bg-foreground text-sm font-semibold text-background">
            A
          </div>
        ) : (
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Admin
            </p>
            <h1 className="mt-2 truncate text-xl font-semibold tracking-tight">
              {restaurantName ?? "Control Panel"}
            </h1>
          </div>
        )}
      </div>

      <nav className="flex flex-col gap-1 text-sm">
        {adminResources.map((resource) => {
          const isActive = resource.slug === activeSlug;
          const Icon = resource.icon;

          return (
            <Link
              className={`flex items-center gap-3 rounded-md px-3 py-2 font-medium transition-colors ${collapsed ? "justify-center" : ""} ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              href={`/admin/${resource.slug}`}
              key={resource.slug}
              title={collapsed ? resource.pluralLabel : undefined}
            >
              <Icon className="size-5 shrink-0" />
              {!collapsed ? <span>{resource.pluralLabel}</span> : null}
            </Link>
          );
        })}
      </nav>

      <button
        className={`mt-auto flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive ${
          collapsed ? "justify-center" : ""
        }`}
        onClick={handleSignOut}
        title={collapsed ? "Sign out" : undefined}
        type="button"
      >
        <LogOut className="size-5 shrink-0" />
        {!collapsed ? <span>Sign out</span> : null}
      </button>
    </aside>
  );
}
