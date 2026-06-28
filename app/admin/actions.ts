"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAdminResource, type AdminField } from "@/lib/admin/resources";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

type AdminMembership = {
  restaurant_id: string;
};

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

      if (field.type === "image") {
        const file = formData.get(`${field.key}_file`);

        if (file instanceof File && file.size > 0) {
          const imageUrl = await uploadAdminImage(file, membership.restaurant_id);
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
            field.relation.table,
            value,
            membership.restaurant_id,
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
    payload.restaurant_id = membership.restaurant_id;
  }

  return { membership, payload, relationshipValues, resource, uploadedImageUrls };
}

function getImageFieldKeys(fields: AdminField[] | undefined) {
  return (fields ?? []).filter((field) => field.type === "image").map((field) => field.key);
}

async function removeAdminImages(publicUrls: Array<string | null | undefined>) {
  await Promise.all(publicUrls.map((publicUrl) => removeAdminImage(publicUrl)));
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
  const { membership, payload, relationshipValues, resource, uploadedImageUrls } =
    await buildAdminPayload(collection, formData, "create");

  const { data, error } = await supabaseAdmin
    .from(resource.table)
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    await removeAdminImages(uploadedImageUrls);
    throw new Error(error.message);
  }

  try {
    await syncJoinFields(collection, String(data.id), membership.restaurant_id, relationshipValues);
  } catch (error) {
    await removeAdminImages(uploadedImageUrls);
    throw error;
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/${resource.slug}`);
  redirect(`/admin/${resource.slug}`);
}

export async function updateAdminRecord(collection: string, id: string, formData: FormData) {
  const { membership, payload, relationshipValues, resource, uploadedImageUrls } =
    await buildAdminPayload(collection, formData, "edit");
  const imageFieldKeys = getImageFieldKeys(resource.editFields).filter((key) => key in payload);
  let existingImages: Record<string, unknown> = {};

  if (imageFieldKeys.length > 0) {
    let existingImageQuery = supabaseAdmin
      .from(resource.table)
      .select(imageFieldKeys.join(", "))
      .eq("id", id);

    if (resource.restaurantScoped) {
      existingImageQuery = existingImageQuery.eq("restaurant_id", membership.restaurant_id);
    }

    const { data, error } = await existingImageQuery.maybeSingle();

    if (error) {
      await removeAdminImages(uploadedImageUrls);
      throw new Error(error.message);
    }

    existingImages = (data ?? {}) as Record<string, unknown>;
  }

  let query = supabaseAdmin.from(resource.table).update(payload).eq("id", id);

  if (resource.restaurantScoped) {
    query = query.eq("restaurant_id", membership.restaurant_id);
  }

  const { error } = await query;

  if (error) {
    await removeAdminImages(uploadedImageUrls);
    throw new Error(error.message);
  }

  try {
    await syncJoinFields(collection, id, membership.restaurant_id, relationshipValues);
  } catch (error) {
    await removeAdminImages(uploadedImageUrls);
    throw error;
  }

  await removeAdminImages(
    imageFieldKeys
      .filter((key) => payload[key] !== existingImages[key])
      .map((key) => (typeof existingImages[key] === "string" ? existingImages[key] : null)),
  );

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
  const copiedImageUrls: string[] = [];
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

    if (field.type === "image") {
      const imageUrl = typeof value === "string" ? value : null;
      const copiedImageUrl = await copyAdminImage(imageUrl, membership.restaurant_id);

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
    payload.restaurant_id = membership.restaurant_id;
  }

  const { data: duplicatedRecord, error } = await supabaseAdmin
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
      collection,
      String(duplicatedRecord.id),
      membership.restaurant_id,
      relationshipValues,
    );
  } catch (error) {
    await removeAdminImages(copiedImageUrls);
    throw error;
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/${resource.slug}`);
  redirect(`/admin/${resource.slug}/edit?id=${encodeURIComponent(String(duplicatedRecord.id))}`);
}

export async function deleteAdminRecord(collection: string, id: string, _formData?: FormData) {
  void _formData;

  const { membership, resource } = await getAdminRecordForAction(collection, id);
  const imageFieldKeys = getImageFieldKeys(resource.editFields ?? resource.createFields);
  let imageUrls: Array<string | null> = [];

  if (imageFieldKeys.length > 0) {
    let imageQuery = supabaseAdmin
      .from(resource.table)
      .select(imageFieldKeys.join(", "))
      .eq("id", id);

    if (resource.restaurantScoped) {
      imageQuery = imageQuery.eq("restaurant_id", membership.restaurant_id);
    }

    const { data, error } = await imageQuery.maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    const record = (data ?? {}) as Record<string, unknown>;
    imageUrls = imageFieldKeys.map((key) => (typeof record[key] === "string" ? record[key] : null));
  }

  let deleteQuery = supabaseAdmin.from(resource.table).delete().eq("id", id);

  if (resource.restaurantScoped) {
    deleteQuery = deleteQuery.eq("restaurant_id", membership.restaurant_id);
  }

  const { error } = await deleteQuery;

  if (error) {
    throw new Error(error.message);
  }

  await removeAdminImages(imageUrls);

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
