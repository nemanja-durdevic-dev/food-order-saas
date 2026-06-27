import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import type { AdminField } from "@/lib/admin/resources";
import { getAdminResource } from "@/lib/admin/resources";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { createAdminRecord } from "../../actions";
import { AdminRecordForm } from "../../_components/admin-record-form";
import { AdminShell } from "../../_components/admin-shell";

type Props = {
  params: Promise<{ collection: string }>;
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

      let query = supabaseAdmin
        .from(field.relation.table)
        .select(`id, ${field.relation.labelColumn}`);

      if (field.relation.restaurantScoped !== false) {
        query = query.eq("restaurant_id", restaurantId);
      }

      const { data } = await query.order(field.relation.labelColumn, { ascending: true });

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

export default async function AdminCreatePage({ params }: Props) {
  const { collection } = await params;
  const resource = getAdminResource(collection);

  if (!resource) {
    notFound();
  }

  const { membership, restaurant } = await getAdminContext();

  if (!resource.createFields?.length) {
    return (
      <AdminShell activeSlug={resource.slug} restaurantName={restaurant?.name}>
        <section className="max-w-2xl rounded-lg border border-border bg-card p-6">
          <p className="text-sm font-medium text-muted-foreground">{resource.pluralLabel}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Manual creation is not available
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {resource.label} records are created through the order flow and can only be edited here.
          </p>
          <Link
            className="mt-5 inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium"
            href={`/admin/${resource.slug}`}
          >
            Back to {resource.pluralLabel}
          </Link>
        </section>
      </AdminShell>
    );
  }

  const fields = await withRelationOptions(resource.createFields, membership.restaurant_id);
  const action = createAdminRecord.bind(null, resource.slug);

  return (
    <AdminShell activeSlug={resource.slug} restaurantName={restaurant?.name}>
      <AdminRecordForm action={action} fields={fields} mode="create" resource={resource} />
    </AdminShell>
  );
}
