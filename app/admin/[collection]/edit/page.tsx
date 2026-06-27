import { notFound, redirect } from "next/navigation";

import type { AdminField } from "@/lib/admin/resources";
import { getAdminResource } from "@/lib/admin/resources";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { updateAdminRecord } from "../../actions";
import { AdminRecordForm } from "../../_components/admin-record-form";
import { AdminShell } from "../../_components/admin-shell";

type Props = {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ id?: string }>;
};

async function getAdminContext() {
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

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("name")
    .eq("id", membership.restaurant_id)
    .maybeSingle();

  return { membership, restaurant };
}

async function withRelationOptions(fields: AdminField[], restaurantId: string) {
  return Promise.all(
    fields.map(async (field) => {
      if (!field.relation) {
        return field;
      }

      const { data } = await supabaseAdmin
        .from(field.relation.table)
        .select(`id, ${field.relation.labelColumn}`)
        .eq("restaurant_id", restaurantId)
        .order(field.relation.labelColumn, { ascending: true });

      const relationRecords = (data ?? []) as unknown as Array<Record<string, unknown>>;

      return {
        ...field,
        options: relationRecords.map((record) => ({
          label: String(record[field.relation!.labelColumn] ?? "Untitled"),
          value: String(record.id),
        })),
      };
    }),
  );
}

export default async function AdminEditPage({ params, searchParams }: Props) {
  const [{ collection }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve<{ id?: string }>({}),
  ]);
  const resource = getAdminResource(collection);
  const id = String(resolvedSearchParams.id ?? "").trim();

  if (!resource || !id) {
    notFound();
  }

  const { membership, restaurant } = await getAdminContext();

  if (!resource.editFields?.length || !resource.formSelect) {
    notFound();
  }

  let recordQuery = supabaseAdmin.from(resource.table).select(resource.formSelect).eq("id", id);

  if (resource.restaurantScoped) {
    recordQuery = recordQuery.eq("restaurant_id", membership.restaurant_id);
  }

  const { data: record } = await recordQuery.maybeSingle();

  if (!record) {
    notFound();
  }

  const fields = await withRelationOptions(resource.editFields, membership.restaurant_id);
  const action = updateAdminRecord.bind(null, resource.slug, id);

  return (
    <AdminShell activeSlug={resource.slug} restaurantName={restaurant?.name}>
      <AdminRecordForm
        action={action}
        fields={fields}
        mode="edit"
        record={record as unknown as Record<string, unknown>}
        resource={resource}
      />
    </AdminShell>
  );
}
