import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Eye } from "lucide-react";

import { getLocale } from "@/lib/dictionaries";
import { buildMenuPublicationSnapshot } from "@/lib/admin/menu-publications";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { OrderMenu } from "@/components/order-menu";
import type { Location, HoursOverride } from "@/components/order-menu/types";

export const dynamic = "force-dynamic";

export default async function MenuPreviewPage() {
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

  const restaurantId = membership.restaurant_id;

  const [{ data: restaurant }, snapshot, locationsResult, locationIdsResult] = await Promise.all([
    supabaseAdmin
      .from("restaurants")
      .select("name, logo_url, instagram_url, facebook_url, tiktok_url")
      .eq("id", restaurantId)
      .maybeSingle(),
    buildMenuPublicationSnapshot(supabaseAdmin, restaurantId),
    supabaseAdmin
      .from("locations")
      .select(
        `id, name, address, phone, image_url, currency, is_open,
         location_hours (day, open_time, close_time, is_closed)`,
      )
      .eq("restaurant_id", restaurantId)
      .order("name", { ascending: true }),
    supabaseAdmin.from("locations").select("id").eq("restaurant_id", restaurantId),
  ]);

  if (!restaurant) {
    notFound();
  }

  const locationIds = (locationIdsResult.data ?? []).map((l: { id: string }) => l.id);
  const todayStr = new Date().toISOString().slice(0, 10);
  const endStr = new Date(new Date().getTime() + 10 * 86400000).toISOString().slice(0, 10);

  const { data: overridesData } = await supabaseAdmin
    .from("location_hours_overrides")
    .select("location_id, date, is_closed, open_time, close_time")
    .in("location_id", locationIds.length > 0 ? locationIds : [""])
    .gte("date", todayStr)
    .lte("date", endStr);

  const locale = await getLocale();
  const categories = snapshot.categoriesByLocale[locale] ?? snapshot.categoriesByLocale.en;
  const allAllergens = snapshot.allAllergensByLocale[locale] ?? snapshot.allAllergensByLocale.en;

  const rawLocations = (locationsResult.data ?? []) as Array<
    Record<string, unknown> & {
      location_hours?: Array<{
        day: number;
        open_time: string | null;
        close_time: string | null;
        is_closed: boolean;
      }>;
    }
  >;
  const locations = rawLocations.map(({ location_hours, ...loc }) => ({
    ...loc,
    opening_hours:
      location_hours?.map((h) => ({
        day: h.day,
        open: h.open_time?.slice(0, 5),
        close: h.close_time?.slice(0, 5),
        closed: h.is_closed || undefined,
      })) ?? [],
  })) as Location[];
  const overridesByLocationId = (overridesData ?? []).reduce((acc, row) => {
    const overrides = acc.get(row.location_id) ?? [];
    overrides.push({
      date: row.date,
      is_closed: row.is_closed,
      open_time: row.open_time,
      close_time: row.close_time,
    });
    acc.set(row.location_id, overrides);
    return acc;
  }, new Map<string, HoursOverride[]>());

  const error =
    locationsResult.error?.message ?? (locations.length === 0 ? "No locations found." : undefined);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 border-b border-amber-200">
        <Eye className="size-4" />
        Preview — unpublished menu changes. Customers see the last published version.
        <Link className="ml-2 underline underline-offset-4 hover:text-amber-700" href="/admin">
          Back to admin
        </Link>
      </div>
      <OrderMenu
        allAllergens={allAllergens}
        categories={categories}
        error={error}
        locations={locations}
        overridesByLocationId={overridesByLocationId}
        restaurantInfo={{
          name: restaurant.name,
          logo_url: restaurant.logo_url,
        }}
        socialLinks={{
          facebook_url: restaurant.facebook_url,
          instagram_url: restaurant.instagram_url,
          tiktok_url: restaurant.tiktok_url,
        }}
      />
    </div>
  );
}
