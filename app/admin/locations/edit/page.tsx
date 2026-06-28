import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getAdminResource } from "@/lib/admin/resources";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { getAdminClient } from "@/lib/admin/admin-client";
import { AdminRecordForm } from "../../_components/admin-record-form";
import { AdminShell } from "../../_components/admin-shell";
import { LocationHoursSection } from "@/components/admin/location-hours-section";

type Props = {
  searchParams?: Promise<{ id?: string }>;
};

async function updateLocation(
  locationId: string,
  state: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  "use server";

  void state;

  const { supabase, restaurantId } = await getAdminClient();

  const { data: location } = await supabase
    .from("locations")
    .select("id")
    .eq("id", locationId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (!location) {
    return { error: "Location not found." };
  }

  const name = String(formData.get("name") ?? "");
  const address = String(formData.get("address") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const currency = String(formData.get("currency") ?? "NOK");
  const isOpen = formData.get("is_open") === "on";

  if (!name) {
    return { error: "Name is required." };
  }

  const payload: Record<string, string | boolean | null> = {
    name,
    address: address || null,
    phone: phone || null,
    currency,
    is_open: isOpen,
  };

  const file = formData.get("image_url_file");
  const existingUrl = String(formData.get("image_url") ?? "");

  if (file instanceof File && file.size > 0) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${restaurantId}/menu-items/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("menu-item-images")
      .upload(path, file, { upsert: false });

    if (uploadError) {
      return { error: uploadError.message };
    }

    payload.image_url = supabaseAdmin.storage
      .from("menu-item-images")
      .getPublicUrl(path).data.publicUrl;
  } else {
    payload.image_url = existingUrl || null;
  }

  const { error: updateError } = await supabase
    .from("locations")
    .update(payload)
    .eq("id", locationId)
    .eq("restaurant_id", restaurantId);

  if (updateError) {
    return { error: updateError.message };
  }

  for (const day of [0, 1, 2, 3, 4, 5, 6]) {
    const isClosed = formData.get(`day_${day}_closed`) === "on";
    const openTime = String(formData.get(`day_${day}_open`) ?? "");
    const closeTime = String(formData.get(`day_${day}_close`) ?? "");

    const { error: hoursError } = await supabase.from("location_hours").upsert(
      {
        location_id: locationId,
        day,
        is_closed: isClosed,
        open_time: isClosed || !openTime || !closeTime ? null : openTime,
        close_time: isClosed || !openTime || !closeTime ? null : closeTime,
      },
      { onConflict: "location_id, day" },
    );

    if (hoursError) {
      return { error: hoursError.message };
    }
  }

  revalidatePath("/admin/locations");
  return { success: true };
}

export default async function LocationEditPage({ searchParams }: Props) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve<{ id?: string }>({}));
  const id = String(resolvedSearchParams.id ?? "").trim();

  if (!id) {
    notFound();
  }

  const resource = getAdminResource("locations");

  if (!resource) {
    notFound();
  }

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

  const { data: record } = await supabaseAdmin
    .from("locations")
    .select(
      "id, restaurant_id, name, address, phone, image_url, currency, is_open, created_at, updated_at",
    )
    .eq("id", id)
    .eq("restaurant_id", membership.restaurant_id)
    .maybeSingle();

  if (!record) {
    notFound();
  }

  const { data: hours } = await supabaseAdmin
    .from("location_hours")
    .select("day, open_time, close_time, is_closed")
    .eq("location_id", id)
    .order("day", { ascending: true });

  const action = updateLocation.bind(null, id);

  const imageValues: Record<string, string> = {};

  if (typeof record.image_url === "string" && record.image_url.length > 0) {
    imageValues.image_url = record.image_url;
  }

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
        action={action}
        fields={resource.editFields ?? []}
        imageValues={imageValues}
        mode="edit"
        record={record as unknown as Record<string, unknown>}
        resource={{
          description: resource.description,
          label: resource.label,
          pluralLabel: resource.pluralLabel,
          slug: resource.slug,
          toggleField: resource.toggleField,
        }}
      >
        <div className="border-t border-border pt-8">
          <LocationHoursSection
            hours={
              (hours ?? []) as Array<{
                day: number;
                open_time: string | null;
                close_time: string | null;
                is_closed: boolean;
              }>
            }
          />
        </div>
      </AdminRecordForm>
    </AdminShell>
  );
}
