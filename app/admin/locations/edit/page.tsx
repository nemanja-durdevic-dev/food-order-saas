import { notFound, redirect } from "next/navigation";

import { getAdminResource } from "@/lib/admin/resources";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { updateAdminRecord } from "../../actions";
import { AdminRecordForm } from "../../_components/admin-record-form";
import { AdminShell } from "../../_components/admin-shell";
import { LocationHoursEditor } from "@/components/admin/location-hours-editor";

type Props = {
  searchParams?: Promise<{ id?: string }>;
};

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
    .select("id, restaurant_id, name, address, phone, image_url, is_open, created_at, updated_at")
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

  const action = updateAdminRecord.bind(null, resource.slug, id);

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
        }}
      />

      <div className="mt-10 border-t border-border pt-8">
        <LocationHoursEditor
          hours={
            (hours ?? []) as Array<{
              day: number;
              open_time: string | null;
              close_time: string | null;
              is_closed: boolean;
            }>
          }
          locationId={id}
        />
      </div>
    </AdminShell>
  );
}
