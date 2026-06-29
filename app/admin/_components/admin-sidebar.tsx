"use client";

import Link from "next/link";
import { Eye, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { adminResources } from "@/lib/admin/resources";
import { createClient } from "@/lib/supabase-browser";
import type { AdminBreadcrumbItem } from "./admin-breadcrumb";
import { AdminBreadcrumb } from "./admin-breadcrumb";

type AdminSidebarProps = {
  activeSlug?: string;
  breadcrumbItems?: AdminBreadcrumbItem[];
};

export function AdminSidebar({ activeSlug, breadcrumbItems }: AdminSidebarProps) {
  const supabase = createClient();
  const [expanded, setExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/admin";
  }

  const collapsed = !expanded;
  const groupedResources = adminResources.reduce(
    (groups, resource) => {
      const groupName = resource.group ?? "";
      const group = groups.find((entry) => entry.name === groupName);

      if (group) {
        group.resources.push(resource);
      } else {
        groups.push({ name: groupName, resources: [resource] });
      }

      return groups;
    },
    [] as { name: string; resources: typeof adminResources }[],
  );

  function renderSidebarContent(isCollapsed: boolean, onNavigate?: () => void) {
    return (
      <>
        <div className="mb-6 flex min-h-12 items-start justify-between">
          {!isCollapsed ? (
            <button
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
              onClick={() => setMobileOpen(false)}
              title="Close menu"
              type="button"
            >
              <X className="size-5" />
            </button>
          ) : null}
        </div>

        <nav className="flex flex-col gap-1 text-sm">
          {groupedResources.map((group) => (
            <div className="mt-4 flex flex-col gap-1 first:mt-0" key={group.name || "ungrouped"}>
              {group.name ? (
                <p
                  aria-hidden={isCollapsed}
                  className={`mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-foreground ${
                    isCollapsed ? "invisible" : ""
                  }`}
                >
                  {group.name}
                </p>
              ) : null}

              {group.resources.map((resource) => {
                const isActive = resource.slug === activeSlug;
                const Icon = resource.icon;

                return (
                  <Link
                    className={`flex items-center gap-3 rounded-md py-2 font-medium transition-colors ${
                      isCollapsed ? "justify-center px-2" : "px-3"
                    } ${
                      isActive ? "bg-black/10 text-foreground" : "text-foreground hover:bg-muted"
                    }`}
                    href={`/admin/${resource.slug}`}
                    key={resource.slug}
                    onClick={onNavigate}
                    title={isCollapsed ? resource.pluralLabel : undefined}
                  >
                    <Icon className="size-5 shrink-0" />
                    {!isCollapsed ? <span>{resource.pluralLabel}</span> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <a
          className={`mt-4 flex items-center gap-3 rounded-md py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted ${
            isCollapsed ? "justify-center px-2" : "px-3"
          }`}
          href="/admin/menu-preview"
          onClick={onNavigate}
          target="_blank"
          title={isCollapsed ? "Preview" : undefined}
        >
          <Eye className="size-5 shrink-0" />
          {!isCollapsed ? <span>Preview</span> : null}
        </a>

        <button
          className={`mt-auto flex items-center gap-3 rounded-md py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-destructive ${
            isCollapsed ? "justify-center px-2" : "px-3"
          }`}
          onClick={handleSignOut}
          title={isCollapsed ? "Sign out" : undefined}
          type="button"
        >
          <LogOut className="size-5 shrink-0" />
          {!isCollapsed ? <span>Sign out</span> : null}
        </button>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
        <button
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => setMobileOpen(true)}
          title="Open menu"
          type="button"
        >
          <Menu className="size-5" />
        </button>
        <div className="ml-3 min-w-0 flex-1">
          <AdminBreadcrumb
            className="min-w-0 text-sm text-muted-foreground"
            compact
            items={breadcrumbItems}
          />
        </div>
      </div>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-background px-3 py-5 shadow-sm transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderSidebarContent(false, () => setMobileOpen(false))}
      </aside>

      <aside
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setExpanded(false);
          }
        }}
        className={`fixed left-0 z-30 hidden h-[calc(100vh-3.5rem)] flex-col border-r border-border bg-background px-3 py-5 shadow-sm transition-[width] duration-200 lg:flex top-14 ${
          collapsed ? "w-16" : "w-64"
        }`}
        onFocus={() => setExpanded(true)}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {renderSidebarContent(collapsed)}
      </aside>
    </>
  );
}
