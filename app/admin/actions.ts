"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminResource } from "@/lib/admin/resources";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

type AdminMembership = {
  restaurant_id: string;
};

async function requireAdminMembership(): Promise<AdminMembership> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: membership } = await supabaseAdmin
    .from("restaurant_members")
    .select("restaurant_id")
    .eq("user_id", user.id)
    .in("role", ["admin", "owner"])
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/");
  }

  return membership;
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

async function validateRelation(
  table: string,
  id: string,
  restaurantId: string,
  restaurantScoped = true,
) {
  let query = supabaseAdmin.from(table).select("id").eq("id", id);

  if (restaurantScoped) {
    query = query.eq("restaurant_id", restaurantId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    throw new Error("Selected related record is not available.");
  }
}

async function buildAdminPayload(collection: string, formData: FormData, mode: "create" | "edit") {
  const membership = await requireAdminMembership();
  const resource = getAdminResource(collection);

  if (!resource) {
    throw new Error("Unknown collection.");
  }

  const fields = mode === "create" ? resource.createFields : resource.editFields;

  if (!fields?.length) {
    throw new Error(`${resource.label} cannot be ${mode === "create" ? "created" : "edited"}.`);
  }

  const payload: Record<string, boolean | number | string | null> = {};
  const relationshipValues: Record<string, string[]> = {};

  for (const field of fields) {
    if (field.type === "boolean") {
      payload[field.key] = formData.get(field.key) === "on";
      continue;
    }

    if (field.type === "multiselect") {
      const values = formData
        .getAll(field.key)
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0);

      if (field.required && values.length === 0) {
        throw new Error(`${field.label} is required.`);
      }

      if (field.relation) {
        for (const value of values) {
          await validateRelation(
            field.relation.table,
            value,
            membership.restaurant_id,
            field.relation.restaurantScoped !== false,
          );
        }
      }

      relationshipValues[field.key] = values;
      continue;
    }

    const value = getStringValue(formData, field.key);

    if (!value) {
      if (field.required) {
        throw new Error(`${field.label} is required.`);
      }

      payload[field.key] = null;
      continue;
    }

    if (field.type === "number") {
      const numberValue = Number(value);

      if (!Number.isFinite(numberValue)) {
        throw new Error(`${field.label} must be a valid number.`);
      }

      payload[field.key] = numberValue;
      continue;
    }

    if (field.type === "select") {
      if (field.options && !field.options.some((option) => option.value === value)) {
        throw new Error(`${field.label} is invalid.`);
      }

      if (field.relation) {
        await validateRelation(
          field.relation.table,
          value,
          membership.restaurant_id,
          field.relation.restaurantScoped !== false,
        );
      }
    }

    payload[field.key] = value;
  }

  if (mode === "create" && resource.restaurantScoped) {
    payload.restaurant_id = membership.restaurant_id;
  }

  return { membership, payload, relationshipValues, resource };
}

async function syncJoinFields(
  collection: string,
  sourceId: string,
  restaurantId: string,
  relationshipValues: Record<string, string[]>,
) {
  const resource = getAdminResource(collection);
  const fields = resource?.editFields ?? resource?.createFields ?? [];

  for (const field of fields) {
    if (!field.join || !(field.key in relationshipValues)) {
      continue;
    }

    const values = relationshipValues[field.key];

    const { error: deleteError } = await supabaseAdmin
      .from(field.join.table)
      .delete()
      .eq(field.join.sourceColumn, sourceId)
      .eq("restaurant_id", restaurantId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    if (values.length === 0) {
      continue;
    }

    const rows = values.map((value, index) => ({
      restaurant_id: restaurantId,
      [field.join!.sourceColumn]: sourceId,
      [field.join!.targetColumn]: value,
      sort_order: index,
    }));

    const { error: insertError } = await supabaseAdmin.from(field.join.table).insert(rows);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}

async function getAdminRecordForAction(collection: string, id: string) {
  const membership = await requireAdminMembership();
  const resource = getAdminResource(collection);

  if (!resource) {
    throw new Error("Unknown collection.");
  }

  let query = supabaseAdmin.from(resource.table).select("id").eq("id", id);

  if (resource.restaurantScoped) {
    query = query.eq("restaurant_id", membership.restaurant_id);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    throw new Error(`${resource.label} was not found.`);
  }

  return { membership, resource };
}

export async function createAdminRecord(collection: string, formData: FormData) {
  const { membership, payload, relationshipValues, resource } = await buildAdminPayload(
    collection,
    formData,
    "create",
  );

  const { data, error } = await supabaseAdmin
    .from(resource.table)
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await syncJoinFields(collection, String(data.id), membership.restaurant_id, relationshipValues);

  revalidatePath("/admin");
  revalidatePath(`/admin/${resource.slug}`);
  redirect(`/admin/${resource.slug}`);
}

export async function updateAdminRecord(collection: string, id: string, formData: FormData) {
  const { membership, payload, relationshipValues, resource } = await buildAdminPayload(
    collection,
    formData,
    "edit",
  );

  let query = supabaseAdmin.from(resource.table).update(payload).eq("id", id);

  if (resource.restaurantScoped) {
    query = query.eq("restaurant_id", membership.restaurant_id);
  }

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  await syncJoinFields(collection, id, membership.restaurant_id, relationshipValues);

  revalidatePath("/admin");
  revalidatePath(`/admin/${resource.slug}`);
  redirect(`/admin/${resource.slug}`);
}

export async function duplicateAdminRecord(collection: string, id: string, _formData?: FormData) {
  void _formData;

  const { membership, resource } = await getAdminRecordForAction(collection, id);
  const fields = resource.createFields;

  if (!fields?.length || !resource.formSelect) {
    throw new Error(`${resource.label} cannot be duplicated.`);
  }

  let recordQuery = supabaseAdmin.from(resource.table).select(resource.formSelect).eq("id", id);

  if (resource.restaurantScoped) {
    recordQuery = recordQuery.eq("restaurant_id", membership.restaurant_id);
  }

  const { data: record, error: recordError } = await recordQuery.maybeSingle();

  if (recordError || !record) {
    throw new Error(`${resource.label} was not found.`);
  }

  const payload: Record<string, boolean | number | string | null> = {};
  const relationshipValues: Record<string, string[]> = {};
  const sourceRecord = record as Record<string, unknown>;

  for (const field of fields) {
    if (field.type === "multiselect") {
      if (!field.join) {
        continue;
      }

      const { data, error } = await supabaseAdmin
        .from(field.join.table)
        .select(field.join.targetColumn)
        .eq(field.join.sourceColumn, id)
        .eq("restaurant_id", membership.restaurant_id);

      if (error) {
        throw new Error(error.message);
      }

      relationshipValues[field.key] = ((data ?? []) as Array<Record<string, unknown>>).map((row) =>
        String(row[field.join!.targetColumn]),
      );
      continue;
    }

    const value = sourceRecord[field.key];

    if (field.key === "name" && typeof value === "string") {
      payload[field.key] = `${value} Copy`;
      continue;
    }

    if (value === undefined) {
      continue;
    }

    payload[field.key] = value as boolean | number | string | null;
  }

  if (resource.restaurantScoped) {
    payload.restaurant_id = membership.restaurant_id;
  }

  const { data: duplicatedRecord, error } = await supabaseAdmin
    .from(resource.table)
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await syncJoinFields(
    collection,
    String(duplicatedRecord.id),
    membership.restaurant_id,
    relationshipValues,
  );

  revalidatePath("/admin");
  revalidatePath(`/admin/${resource.slug}`);
  redirect(`/admin/${resource.slug}/edit?id=${encodeURIComponent(String(duplicatedRecord.id))}`);
}

export async function deleteAdminRecord(collection: string, id: string, _formData?: FormData) {
  void _formData;

  const { resource } = await getAdminRecordForAction(collection, id);
  const { error } = await supabaseAdmin.from(resource.table).delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/${resource.slug}`);
  redirect(`/admin/${resource.slug}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin");
}

export async function updateStripeSettings(formData: FormData) {
  const restaurantId = String(formData.get("restaurantId") ?? "");
  const stripeAccountId = String(formData.get("stripeAccountId") ?? "").trim() || null;
  const paymentsEnabled = formData.get("paymentsEnabled") === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin");
  }

  const { data: membership } = await supabaseAdmin
    .from("restaurant_members")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", user.id)
    .in("role", ["admin", "owner"])
    .maybeSingle();

  if (!membership) {
    throw new Error("You do not have access to update this restaurant.");
  }

  const { error } = await supabaseAdmin
    .from("restaurants")
    .update({
      payments_enabled: paymentsEnabled,
      stripe_account_id: stripeAccountId,
    })
    .eq("id", restaurantId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  redirect("/admin?updated=1");
}

export async function toggleLocationStatus(formData: FormData) {
  const locationId = String(formData.get("locationId") ?? "");
  const newStatus = formData.get("is_open") === "true";
  const restaurantId = String(formData.get("restaurantId") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin");
  }

  const { data: membership } = await supabaseAdmin
    .from("restaurant_members")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", user.id)
    .in("role", ["admin", "owner"])
    .maybeSingle();

  if (!membership) {
    throw new Error("You do not have access to update this location.");
  }

  const { error } = await supabaseAdmin
    .from("locations")
    .update({ is_open: newStatus })
    .eq("id", locationId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}
