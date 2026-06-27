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

async function validateRelation(table: string, id: string, restaurantId: string) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select("id")
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

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

  for (const field of fields) {
    if (field.type === "boolean") {
      payload[field.key] = formData.get(field.key) === "on";
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
        await validateRelation(field.relation.table, value, membership.restaurant_id);
      }
    }

    payload[field.key] = value;
  }

  if (mode === "create" && resource.restaurantScoped) {
    payload.restaurant_id = membership.restaurant_id;
  }

  return { membership, payload, resource };
}

export async function createAdminRecord(collection: string, formData: FormData) {
  const { payload, resource } = await buildAdminPayload(collection, formData, "create");

  const { error } = await supabaseAdmin.from(resource.table).insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/${resource.slug}`);
  redirect(`/admin/${resource.slug}`);
}

export async function updateAdminRecord(collection: string, id: string, formData: FormData) {
  const { membership, payload, resource } = await buildAdminPayload(collection, formData, "edit");

  let query = supabaseAdmin.from(resource.table).update(payload).eq("id", id);

  if (resource.restaurantScoped) {
    query = query.eq("restaurant_id", membership.restaurant_id);
  }

  const { error } = await query;

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
