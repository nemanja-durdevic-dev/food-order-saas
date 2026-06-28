"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getAdminResource, type AdminField } from "@/lib/admin/resources";
import {
  buildMenuPublicationSnapshot,
  type MenuPublicationSnapshot,
} from "@/lib/admin/menu-publications";
import { computeMenuDiff, type MenuChange } from "@/lib/admin/menu-diff";
import { getAdminClient } from "@/lib/admin/admin-client";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MENU_ITEM_IMAGES_BUCKET = "menu-item-images";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);

function getStoragePathFromPublicUrl(publicUrl: string | null | undefined) {
  if (!publicUrl) {
    return null;
  }

  try {
    const url = new URL(publicUrl);
    const prefix = `/storage/v1/object/public/${MENU_ITEM_IMAGES_BUCKET}/`;

    if (!url.pathname.startsWith(prefix)) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

async function removeAdminImage(publicUrl: string | null | undefined) {
  const path = getStoragePathFromPublicUrl(publicUrl);

  if (!path) {
    return;
  }

  await supabaseAdmin.storage.from(MENU_ITEM_IMAGES_BUCKET).remove([path]);
}

function getPublicImageUrl(path: string) {
  return supabaseAdmin.storage.from(MENU_ITEM_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

function getImageExtension(file: File) {
  const extensionFromName = file.name.split(".").pop()?.toLowerCase();

  if (extensionFromName && /^[a-z0-9]+$/.test(extensionFromName)) {
    return extensionFromName;
  }

  if (file.type === "image/jpeg") {
    return "jpg";
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "image";
}

async function uploadAdminImage(file: File, restaurantId: string) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Image must be a JPG, PNG, WebP, or GIF file.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image must be 5MB or smaller.");
  }

  const path = `${restaurantId}/menu-items/${crypto.randomUUID()}.${getImageExtension(file)}`;
  const { error } = await supabaseAdmin.storage.from(MENU_ITEM_IMAGES_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return getPublicImageUrl(path);
}

async function copyAdminImage(publicUrl: string | null | undefined, restaurantId: string) {
  const sourcePath = getStoragePathFromPublicUrl(publicUrl);

  if (!sourcePath) {
    return publicUrl ?? null;
  }

  const extension = sourcePath.split(".").pop() ?? "image";
  const destinationPath = `${restaurantId}/menu-items/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabaseAdmin.storage
    .from(MENU_ITEM_IMAGES_BUCKET)
    .copy(sourcePath, destinationPath);

  if (error) {
    throw new Error(error.message);
  }

  return getPublicImageUrl(destinationPath);
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

async function validateRelation(
  supabase: SupabaseClient,
  table: string,
  id: string,
  restaurantId: string,
  restaurantScoped = true,
) {
  let query = supabase.from(table).select("id").eq("id", id);

  if (restaurantScoped) {
    query = query.eq("restaurant_id", restaurantId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    throw new Error("Selected related record is not available.");
  }
}

async function buildAdminPayload(
  supabase: SupabaseClient,
  collection: string,
  formData: FormData,
  mode: "create" | "edit",
  restaurantId: string,
) {
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
  const uploadedImageUrls: string[] = [];

  try {
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
              supabase,
              field.relation.table,
              value,
              restaurantId,
              field.relation.restaurantScoped !== false,
            );
          }
        }

        relationshipValues[field.key] = values;
        continue;
      }

      if (field.type === "image") {
        const file = formData.get(`${field.key}_file`);

        if (file instanceof File && file.size > 0) {
          const imageUrl = await uploadAdminImage(file, restaurantId);
          uploadedImageUrls.push(imageUrl);
          payload[field.key] = imageUrl;
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

        payload[field.key] = value;
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
            supabase,
            field.relation.table,
            value,
            restaurantId,
            field.relation.restaurantScoped !== false,
          );
        }
      }

      payload[field.key] = value;
    }
  } catch (error) {
    await removeAdminImages(uploadedImageUrls);
    throw error;
  }

  if (mode === "create" && resource.restaurantScoped) {
    const scopeColumn = resource.scopeColumn ?? "restaurant_id";
    payload[scopeColumn] = restaurantId;
  }

  return { restaurantId, payload, relationshipValues, resource, uploadedImageUrls };
}

function getImageFieldKeys(fields: AdminField[] | undefined) {
  return (fields ?? []).filter((field) => field.type === "image").map((field) => field.key);
}

async function removeAdminImages(publicUrls: Array<string | null | undefined>) {
  await Promise.all(publicUrls.map((publicUrl) => removeAdminImage(publicUrl)));
}

async function markMenuDirty(supabase: SupabaseClient, restaurantId: string) {
  await supabase.from("restaurants").update({ menu_dirty: true }).eq("id", restaurantId);
}

async function markMenuDirtyForResource(
  supabase: SupabaseClient,
  restaurantId: string,
  resourceSlug: string,
) {
  if (!["categories", "menu-items", "subcategories"].includes(resourceSlug)) {
    return;
  }

  await markMenuDirty(supabase, restaurantId);
}

async function syncJoinFields(
  supabase: SupabaseClient,
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

    const { error: deleteError } = await supabase
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
      ...(field.join!.defaults ?? {}),
      [field.join!.sourceColumn]: sourceId,
      [field.join!.targetColumn]: value,
      ...(field.join!.sortColumn ? { [field.join!.sortColumn]: index } : {}),
    }));

    const { error: insertError } = await supabase.from(field.join.table).insert(rows);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }
}

async function getAdminRecordForAction(collection: string, id: string) {
  const { supabase, restaurantId } = await getAdminClient();
  const resource = getAdminResource(collection);

  if (!resource) {
    throw new Error("Unknown collection.");
  }

  let query = supabase.from(resource.table).select("id").eq("id", id);

  if (resource.restaurantScoped) {
    const column = resource.scopeColumn ?? "restaurant_id";
    query = query.eq(column, restaurantId);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    throw new Error(`${resource.label} was not found.`);
  }

  return { supabase, restaurantId, resource };
}

export async function createAdminRecord(
  collection: string,
  state: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  void state;

  const { supabase, restaurantId } = await getAdminClient();
  const buildResult = await buildAdminPayload(
    supabase,
    collection,
    formData,
    "create",
    restaurantId,
  );

  const { data, error } = await supabase
    .from(buildResult.resource.table)
    .insert(buildResult.payload)
    .select("id")
    .single();

  if (error) {
    await removeAdminImages(buildResult.uploadedImageUrls);
    return { error: error.message };
  }

  try {
    await syncJoinFields(
      supabase,
      collection,
      String(data.id),
      restaurantId,
      buildResult.relationshipValues,
    );
  } catch (error) {
    await removeAdminImages(buildResult.uploadedImageUrls);
    return { error: error instanceof Error ? error.message : "Failed to sync join fields." };
  }

  await markMenuDirtyForResource(supabase, restaurantId, buildResult.resource.slug);
  revalidatePath("/admin");
  revalidatePath(`/admin/${buildResult.resource.slug}`);
  return { success: true };
}

export async function updateAdminRecord(
  collection: string,
  id: string,
  state: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  void state;

  const { supabase, restaurantId } = await getAdminClient();
  const buildResult = await buildAdminPayload(supabase, collection, formData, "edit", restaurantId);

  const imageFieldKeys = getImageFieldKeys(buildResult.resource.editFields).filter(
    (key) => key in buildResult.payload,
  );
  let existingImages: Record<string, unknown> = {};

  if (imageFieldKeys.length > 0) {
    let existingImageQuery = supabase
      .from(buildResult.resource.table)
      .select(imageFieldKeys.join(", "))
      .eq("id", id);

    if (buildResult.resource.restaurantScoped) {
      const column = buildResult.resource.scopeColumn ?? "restaurant_id";
      existingImageQuery = existingImageQuery.eq(column, restaurantId);
    }

    const { data, error } = await existingImageQuery.maybeSingle();

    if (error) {
      await removeAdminImages(buildResult.uploadedImageUrls);
      return { error: error.message };
    }

    existingImages = (data ?? {}) as Record<string, unknown>;
  }

  let query = supabase.from(buildResult.resource.table).update(buildResult.payload).eq("id", id);

  if (buildResult.resource.restaurantScoped) {
    const column = buildResult.resource.scopeColumn ?? "restaurant_id";
    query = query.eq(column, restaurantId);
  }

  const { error } = await query;

  if (error) {
    await removeAdminImages(buildResult.uploadedImageUrls);
    return { error: error.message };
  }

  try {
    await syncJoinFields(supabase, collection, id, restaurantId, buildResult.relationshipValues);
  } catch (error) {
    await removeAdminImages(buildResult.uploadedImageUrls);
    return { error: error instanceof Error ? error.message : "Failed to sync join fields." };
  }

  await removeAdminImages(
    imageFieldKeys
      .filter((key) => buildResult.payload[key] !== existingImages[key])
      .map((key) => (typeof existingImages[key] === "string" ? existingImages[key] : null)),
  );

  await markMenuDirtyForResource(supabase, restaurantId, buildResult.resource.slug);
  revalidatePath("/admin");
  revalidatePath(`/admin/${buildResult.resource.slug}`);
  return { success: true };
}

export async function duplicateAdminRecord(collection: string, id: string, _formData?: FormData) {
  void _formData;

  const { supabase, restaurantId, resource } = await getAdminRecordForAction(collection, id);
  const fields = resource.createFields;

  if (!fields?.length || !resource.formSelect) {
    throw new Error(`${resource.label} cannot be duplicated.`);
  }

  let recordQuery = supabase.from(resource.table).select(resource.formSelect).eq("id", id);

  if (resource.restaurantScoped) {
    const column = resource.scopeColumn ?? "restaurant_id";
    recordQuery = recordQuery.eq(column, restaurantId);
  }

  const { data: record, error: recordError } = await recordQuery.maybeSingle();

  if (recordError || !record) {
    throw new Error(`${resource.label} was not found.`);
  }

  const payload: Record<string, boolean | number | string | null> = {};
  const relationshipValues: Record<string, string[]> = {};
  const copiedImageUrls: string[] = [];
  const sourceRecord = record as unknown as Record<string, unknown>;

  for (const field of fields) {
    if (field.type === "multiselect") {
      if (!field.join) {
        continue;
      }

      let joinQuery = supabase
        .from(field.join.table)
        .select(field.join.targetColumn)
        .eq(field.join.sourceColumn, id)
        .eq("restaurant_id", restaurantId);

      for (const [column, value] of Object.entries(field.join.selectEquals ?? {})) {
        joinQuery = value === null ? joinQuery.is(column, null) : joinQuery.eq(column, value);
      }

      const { data, error } = await joinQuery;

      if (error) {
        throw new Error(error.message);
      }

      relationshipValues[field.key] = (
        (data ?? []) as unknown as Array<Record<string, unknown>>
      ).map((row) => String(row[field.join!.targetColumn]));
      continue;
    }

    const value = sourceRecord[field.key];

    if (field.type === "image") {
      const imageUrl = typeof value === "string" ? value : null;
      const copiedImageUrl = await copyAdminImage(imageUrl, restaurantId);

      if (copiedImageUrl && copiedImageUrl !== imageUrl) {
        copiedImageUrls.push(copiedImageUrl);
      }

      payload[field.key] = copiedImageUrl;
      continue;
    }

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
    const scopeColumn = resource.scopeColumn ?? "restaurant_id";
    payload[scopeColumn] = restaurantId;
  }

  const { data: duplicatedRecord, error } = await supabase
    .from(resource.table)
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    await removeAdminImages(copiedImageUrls);
    throw new Error(error.message);
  }

  try {
    await syncJoinFields(
      supabase,
      collection,
      String(duplicatedRecord.id),
      restaurantId,
      relationshipValues,
    );
  } catch (error) {
    await removeAdminImages(copiedImageUrls);
    throw error;
  }

  await markMenuDirtyForResource(supabase, restaurantId, resource.slug);
  revalidatePath("/admin");
  revalidatePath(`/admin/${resource.slug}`);
  redirect(`/admin/${resource.slug}/edit?id=${encodeURIComponent(String(duplicatedRecord.id))}`);
}

export async function deleteAdminRecord(collection: string, id: string, _formData?: FormData) {
  void _formData;

  const { supabase, restaurantId, resource } = await getAdminRecordForAction(collection, id);
  const imageFieldKeys = getImageFieldKeys(resource.editFields ?? resource.createFields);
  let imageUrls: Array<string | null> = [];

  if (imageFieldKeys.length > 0) {
    let imageQuery = supabase.from(resource.table).select(imageFieldKeys.join(", ")).eq("id", id);

    if (resource.restaurantScoped) {
      const column = resource.scopeColumn ?? "restaurant_id";
      imageQuery = imageQuery.eq(column, restaurantId);
    }

    const { data, error } = await imageQuery.maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    const record = (data ?? {}) as Record<string, unknown>;
    imageUrls = imageFieldKeys.map((key) => (typeof record[key] === "string" ? record[key] : null));
  }

  let deleteQuery = supabase.from(resource.table).delete().eq("id", id);

  if (resource.restaurantScoped) {
    const column = resource.scopeColumn ?? "restaurant_id";
    deleteQuery = deleteQuery.eq(column, restaurantId);
  }

  const { error } = await deleteQuery;

  if (error) {
    throw new Error(error.message);
  }

  await removeAdminImages(imageUrls);

  await markMenuDirtyForResource(supabase, restaurantId, resource.slug);
  revalidatePath("/admin");
  revalidatePath(`/admin/${resource.slug}`);
  redirect(`/admin/${resource.slug}`);
}

export async function publishMenuChanges() {
  const { supabase, restaurantId, userId } = await getAdminClient();
  const snapshot = await buildMenuPublicationSnapshot(supabase, restaurantId);
  const { error: insertError } = await supabase.from("menu_publications").insert({
    published_by: userId,
    restaurant_id: restaurantId,
    snapshot,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  const { error: updateError } = await supabase
    .from("restaurants")
    .update({ menu_dirty: false, menu_published_at: snapshot.publishedAt })
    .eq("id", restaurantId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/admin");
  revalidatePath("/[restaurantSlug]/order", "page");
  revalidatePath("/staff/order");
}

export async function signOut() {
  const { supabase } = await getAdminClient();
  await supabase.auth.signOut();
  redirect("/admin");
}

export async function updateStripeSettings(formData: FormData) {
  const { supabase, restaurantId } = await getAdminClient();

  const stripeAccountId = String(formData.get("stripeAccountId") ?? "").trim() || null;
  const paymentsEnabled = formData.get("paymentsEnabled") === "true";

  const { error } = await supabase
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
  const { supabase, restaurantId } = await getAdminClient();
  const locationId = String(formData.get("locationId") ?? "");
  const newStatus = formData.get("is_open") === "true";

  const { error } = await supabase
    .from("locations")
    .update({ is_open: newStatus })
    .eq("id", locationId)
    .eq("restaurant_id", restaurantId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function addLocationHoursOverride(formData: FormData) {
  const { supabase, restaurantId } = await getAdminClient();
  const locationId = String(formData.get("locationId") ?? "");
  const date = String(formData.get("date") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const isClosed = formData.get("is_closed") === "on";
  const openTime = String(formData.get("open_time") ?? "").trim() || null;
  const closeTime = String(formData.get("close_time") ?? "").trim() || null;

  if (!locationId || !date) {
    return { error: "Location and date are required." };
  }

  const { data: locationData, error: locationError } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (locationError || !locationData) return { error: "Location not found." };

  const { error } = await supabase.from("location_hours_overrides").upsert(
    {
      location_id: locationId,
      date,
      is_closed: isClosed,
      open_time: isClosed ? null : openTime,
      close_time: isClosed ? null : closeTime,
      reason,
    },
    { onConflict: "location_id, date" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/locations/edit?id=${encodeURIComponent(locationId)}`);
  return { success: true };
}

export async function deleteLocationHoursOverride(formData: FormData) {
  const { supabase, restaurantId } = await getAdminClient();
  const overrideId = String(formData.get("overrideId") ?? "");
  const locationId = String(formData.get("locationId") ?? "");

  if (!overrideId || !locationId) {
    return { error: "Override ID and location ID are required." };
  }

  const { data: locationData, error: locationError } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (locationError || !locationData) return { error: "Location not found." };

  const { error } = await supabase
    .from("location_hours_overrides")
    .delete()
    .eq("id", overrideId)
    .eq("location_id", locationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/admin/locations/edit?id=${encodeURIComponent(locationId)}`);
  return { success: true };
}

export async function getMenuChanges(): Promise<MenuChange[]> {
  const { supabase, restaurantId } = await getAdminClient();

  const { data: lastPublication } = await supabase
    .from("menu_publications")
    .select("snapshot")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastPublication) {
    return [];
  }

  const snapshot = lastPublication.snapshot as unknown as MenuPublicationSnapshot;

  const locales = ["da", "en", "no", "sv"] as const;
  const currentSnapshot = await buildMenuPublicationSnapshot(supabase, restaurantId);
  const seen = new Set<string>();
  const allChanges: MenuChange[] = [];

  for (const locale of locales) {
    const published = snapshot.categoriesByLocale[locale] ?? [];
    const current = currentSnapshot.categoriesByLocale[locale] ?? [];
    const localeChanges = computeMenuDiff(published, current);

    for (const change of localeChanges) {
      const key = `${change.type}:${change.summary}`;
      if (seen.has(key)) continue;
      seen.add(key);
      allChanges.push(change);
    }
  }

  return allChanges;
}
