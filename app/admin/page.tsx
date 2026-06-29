import Link from "next/link";
import { redirect } from "next/navigation";

import { adminResources } from "@/lib/admin/resources";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { AdminShell } from "./_components/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: membership } = await supabase
    .from("restaurant_members")
    .select("restaurant_id, role")
    .eq("user_id", user.id)
    .in("role", ["admin", "owner"])
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/");
  }

  const [{ data: restaurant }, resourceCounts] = await Promise.all([
    supabaseAdmin
      .from("restaurants")
      .select("name")
      .eq("id", membership.restaurant_id)
      .maybeSingle(),
    Promise.all(
      adminResources.map(async (resource) => {
        let query = supabaseAdmin.from(resource.table).select("id", { count: "exact", head: true });

        if (resource.restaurantScoped) {
          const column = resource.scopeColumn ?? "restaurant_id";
          query = query.eq(column, membership.restaurant_id);
        }

        const { count } = await query;

        return [resource.slug, count ?? 0] as const;
      }),
    ),
  ]);

  const countsBySlug = new Map(resourceCounts);

  return (
    <AdminShell breadcrumbItems={[{ label: "Admin" }]} restaurantName={restaurant?.name}>
      <section className="mb-8 border-b border-border pb-6">
        <p className="text-sm font-medium text-muted-foreground">Overview</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-tight">
          {restaurant?.name ?? "Control Panel"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Manage menu structure, menu items, and customer orders from one place.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminResources.map((resource) => {
          const Icon = resource.icon;

          return (
            <Link
              className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/30 hover:bg-muted/30"
              href={`/admin/${resource.slug}`}
              key={resource.slug}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {resource.pluralLabel}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {countsBySlug.get(resource.slug) ?? 0}
                  </p>
                </div>
                <div className="grid size-10 place-items-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                  <Icon className="size-5" />
                </div>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
                {resource.description}
              </p>
            </Link>
          );
        })}
      </section>
    </AdminShell>
  );
}
