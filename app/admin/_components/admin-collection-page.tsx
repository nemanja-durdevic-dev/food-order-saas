import { redirect } from "next/navigation";

import type { AdminResource } from "@/lib/admin/resources";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { AdminShell } from "./admin-shell";
import { CollectionList } from "./collection-list";

type AdminRecord = Record<string, unknown>;

type AdminCollectionPageProps = {
  resource: AdminResource;
  searchParams?: Promise<{ page?: string; q?: string }>;
};

const PAGE_SIZE = 25;

function escapeSearchQuery(query: string) {
  return query.replaceAll("%", "\\%").replaceAll("_", "\\_").replaceAll(",", "");
}

export async function AdminCollectionPage({ resource, searchParams }: AdminCollectionPageProps) {
  const [resolvedSearchParams, supabase] = await Promise.all([
    searchParams ?? Promise.resolve<{ page?: string; q?: string }>({}),
    createClient(),
  ]);

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

  const page = Math.max(1, Number(resolvedSearchParams.page ?? "1") || 1);
  const query = String(resolvedSearchParams.q ?? "").trim();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let recordsQuery = supabaseAdmin
    .from(resource.table)
    .select(resource.select, { count: "exact" })
    .range(from, to);

  if (resource.restaurantScoped) {
    recordsQuery = recordsQuery.eq("restaurant_id", membership.restaurant_id);
  }

  if (query && resource.searchColumns?.length) {
    const escapedQuery = escapeSearchQuery(query);
    recordsQuery = recordsQuery.or(
      resource.searchColumns.map((column) => `${column}.ilike.%${escapedQuery}%`).join(","),
    );
  }

  if (resource.sort) {
    recordsQuery = recordsQuery.order(resource.sort.column, { ascending: resource.sort.ascending });
  }

  const [{ data: records, count, error }, { data: restaurant }] = await Promise.all([
    recordsQuery,
    supabaseAdmin
      .from("restaurants")
      .select("name")
      .eq("id", membership.restaurant_id)
      .maybeSingle(),
  ]);

  if (error) {
    return (
      <AdminShell activeSlug={resource.slug} restaurantName={restaurant?.name}>
        <section className="max-w-2xl rounded-lg border border-red-200 bg-red-50 p-5 text-red-900">
          <h2 className="text-lg font-semibold">Could not load {resource.pluralLabel}</h2>
          <p className="mt-2 text-sm">{error.message}</p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell activeSlug={resource.slug} restaurantName={restaurant?.name}>
      <CollectionList
        count={count ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        query={query}
        records={(records ?? []) as unknown as AdminRecord[]}
        resource={resource}
      />
    </AdminShell>
  );
}
