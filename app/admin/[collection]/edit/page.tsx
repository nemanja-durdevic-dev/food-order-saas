import { notFound, redirect } from "next/navigation";

import type { AdminField } from "@/lib/admin/resources";
import { getAdminResource } from "@/lib/admin/resources";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { deleteAdminRecord, duplicateAdminRecord, updateAdminRecord } from "../../actions";
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
    .select("name, menu_dirty, menu_published_at")
    .eq("id", membership.restaurant_id)
    .maybeSingle();

  return { membership, restaurant };
}

async function withRelationOptions(
  fields: AdminField[],
  restaurantId: string,
  record?: Record<string, unknown>,
) {
  return Promise.all(
    fields.map(async (field) => {
      if (!field.relation) {
        return field;
      }

      if (field.searchable) {
        const selectedValue = record?.[field.key];
        const selectedIds = Array.isArray(selectedValue) ? selectedValue.map(String) : [];

        if (selectedIds.length === 0) {
          return { ...field, options: [] };
        }

        let selectedQuery = supabaseAdmin
          .from(field.relation.table)
          .select(`id, ${field.relation.labelColumn}`)
          .in("id", selectedIds);

        if (field.relation.restaurantScoped !== false) {
          selectedQuery = selectedQuery.eq("restaurant_id", restaurantId);
        }

        const { data } = await selectedQuery.order(field.relation.labelColumn, { ascending: true });
        const relationRecords = (data ?? []) as unknown as Array<Record<string, unknown>>;

        return {
          ...field,
          options: relationRecords.map((selectedRecord) => ({
            label: String(selectedRecord[field.relation!.labelColumn] ?? "Untitled"),
            value: String(selectedRecord.id),
          })),
        };
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

async function withJoinValues(
  record: Record<string, unknown>,
  fields: AdminField[],
  sourceId: string,
  restaurantId: string,
) {
  const joinEntries = await Promise.all(
    fields.map(async (field) => {
      if (!field.join) {
        return null;
      }

      let joinQuery = supabaseAdmin
        .from(field.join.table)
        .select(field.join.targetColumn)
        .eq(field.join.sourceColumn, sourceId)
        .eq("restaurant_id", restaurantId);

      for (const [column, value] of Object.entries(field.join.selectEquals ?? {})) {
        joinQuery = value === null ? joinQuery.is(column, null) : joinQuery.eq(column, value);
      }

      const { data } = await joinQuery;

      return [
        field.key,
        ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) =>
          String(row[field.join!.targetColumn]),
        ),
      ] as const;
    }),
  );

  return joinEntries.reduce<Record<string, unknown>>(
    (recordWithJoins, entry) => {
      if (entry) {
        recordWithJoins[entry[0]] = entry[1];
      }

      return recordWithJoins;
    },
    { ...record },
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
    const column = resource.scopeColumn ?? "restaurant_id";
    recordQuery = recordQuery.eq(column, membership.restaurant_id);
  }

  const { data: record } = await recordQuery.maybeSingle();

  if (!record) {
    notFound();
  }

  const recordWithJoins = await withJoinValues(
    record as unknown as Record<string, unknown>,
    resource.editFields,
    id,
    membership.restaurant_id,
  );
  const fields = await withRelationOptions(
    resource.editFields,
    membership.restaurant_id,
    recordWithJoins,
  );
  const imageValues = resource.editFields.reduce<Record<string, string>>((values, field) => {
    if (field.type !== "image") {
      return values;
    }

    const value = recordWithJoins[field.key];

    if (typeof value === "string" && value.length > 0) {
      values[field.key] = value;
    }

    return values;
  }, {});
  const action = updateAdminRecord.bind(null, resource.slug, id);
  const duplicateAction = resource.createFields?.length
    ? duplicateAdminRecord.bind(null, resource.slug, id)
    : undefined;
  const deleteAction =
    resource.allowDelete !== false ? deleteAdminRecord.bind(null, resource.slug, id) : undefined;

  return (
    <AdminShell
      activeSlug={resource.slug}
      breadcrumbItems={[
        { href: "/admin", label: "Admin" },
        { href: `/admin/${resource.slug}`, label: resource.pluralLabel },
        { label: "Edit" },
      ]}
      menuDirty={Boolean(restaurant?.menu_dirty)}
      menuPublishedAt={restaurant?.menu_published_at ?? null}
      restaurantName={restaurant?.name}
    >
      <AdminRecordForm
        key={restaurant?.menu_published_at ?? "new"}
        action={action}
        canCreate={Boolean(resource.createFields?.length)}
        deleteAction={deleteAction}
        duplicateAction={duplicateAction}
        fields={fields}
        imageValues={imageValues}
        mode="edit"
        record={recordWithJoins}
        resource={{
          description: resource.description,
          label: resource.label,
          pluralLabel: resource.pluralLabel,
          slug: resource.slug,
          toggleField: resource.toggleField,
        }}
      />
    </AdminShell>
  );
}
