import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Eye } from "lucide-react";

import { getLocale } from "@/lib/dictionaries";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { OrderMenu } from "@/components/order-menu";
import type { MenuCategory, Location, HoursOverride } from "@/components/order-menu/types";

export const dynamic = "force-dynamic";

type CategoryRow = {
  id: string;
  name: string;
  name_no: string | null;
  name_sv: string | null;
  name_da: string | null;
  sort_order: number;
};

type SubcategoryRow = {
  id: string;
  category_id: string;
  name: string;
  name_no: string | null;
  name_sv: string | null;
  name_da: string | null;
  sort_order: number;
};

type MenuItemRow = {
  id: string;
  category_id: string | null;
  subcategory_id: string | null;
  is_available: boolean;
  name: string;
  name_no: string | null;
  name_sv: string | null;
  name_da: string | null;
  description: string | null;
  description_no: string | null;
  description_sv: string | null;
  description_da: string | null;
  image_url: string | null;
  price: number | string;
};

type AllergenFields = {
  name: string;
  name_no: string | null;
  name_sv: string | null;
  name_da: string | null;
};

type MenuItemAllergenRow = {
  allergen_id: string;
  allergens: AllergenFields | AllergenFields[] | null;
  menu_item_id: string;
};

type AllergenRow = {
  id: string;
  name: string;
  name_no: string | null;
  name_sv: string | null;
  name_da: string | null;
};

type CategoryAvailabilityRow = {
  category_id: string;
  location_id: string;
};

function firstRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? relation[0] : relation;
}

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

  const [{ data: restaurant }, locationsResult, locationIdsResult] = await Promise.all([
    supabaseAdmin
      .from("restaurants")
      .select("name, logo_url, instagram_url, facebook_url, tiktok_url")
      .eq("id", restaurantId)
      .maybeSingle(),
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

  const locationIds = (locationIdsResult.data ?? []).map((l) => l.id);
  const todayStr = new Date().toISOString().slice(0, 10);
  const endStr = new Date(new Date().getTime() + 10 * 86400000).toISOString().slice(0, 10);

  const locale = await getLocale();

  const [
    categoriesResult,
    subcategoriesResult,
    categoryAvailabilityResult,
    availabilityResult,
    menuItemsResult,
    allergensResult,
    allAllergensResult,
    overridesResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("categories")
      .select("id, name, name_no, name_sv, name_da, sort_order")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("subcategories")
      .select("id, category_id, name, name_no, name_sv, name_da, sort_order")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("category_locations")
      .select("category_id, location_id")
      .eq("restaurant_id", restaurantId),
    supabaseAdmin
      .from("menu_item_locations")
      .select("menu_item_id, location_id")
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true),
    supabaseAdmin
      .from("menu_items")
      .select(
        "id, category_id, subcategory_id, is_available, name, name_no, name_sv, name_da, description, description_no, description_sv, description_da, image_url, price",
      )
      .eq("restaurant_id", restaurantId)
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("menu_item_allergens")
      .select("menu_item_id, allergen_id, allergens(name, name_no, name_sv, name_da)")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true }),
    supabaseAdmin.from("allergens").select("id, name, name_no, name_sv, name_da").order("name", {
      ascending: true,
    }),
    supabaseAdmin
      .from("location_hours_overrides")
      .select("location_id, date, is_closed, open_time, close_time")
      .in("location_id", locationIds.length > 0 ? locationIds : [""])
      .gte("date", todayStr)
      .lte("date", endStr),
  ]);

  const availableLocationIdsByItemId = (
    (availabilityResult.data ?? []) as { menu_item_id: string; location_id: string }[]
  ).reduce((availableLocationIds, item) => {
    const locIds = availableLocationIds.get(item.menu_item_id) ?? [];
    locIds.push(item.location_id);
    availableLocationIds.set(item.menu_item_id, locIds);
    return availableLocationIds;
  }, new Map<string, string[]>());
  const availableLocationIdsByCategoryId = (
    (categoryAvailabilityResult.data ?? []) as CategoryAvailabilityRow[]
  ).reduce((availableLocationIds, item) => {
    const locIds = availableLocationIds.get(item.category_id) ?? [];
    locIds.push(item.location_id);
    availableLocationIds.set(item.category_id, locIds);
    return availableLocationIds;
  }, new Map<string, string[]>());
  const menuItems = ((menuItemsResult?.data ?? []) as MenuItemRow[]).map((item) => ({
    ...item,
    name: item[`name_${locale}` as keyof MenuItemRow] ?? item.name,
    description: item[`description_${locale}` as keyof MenuItemRow] ?? item.description,
  }));
  const allergensByItemId = ((allergensResult.data ?? []) as MenuItemAllergenRow[]).reduce(
    (allergens, row) => {
      const allergen = firstRelation(row.allergens);
      if (!allergen) return allergens;
      const itemAllergens = allergens.get(row.menu_item_id) ?? [];
      itemAllergens.push({
        id: row.allergen_id,
        name:
          (allergen as AllergenFields)[
            `name_${locale as "no" | "sv" | "da" | "en"}` as keyof AllergenFields
          ] ?? (allergen as AllergenFields).name,
      });
      allergens.set(row.menu_item_id, itemAllergens);
      return allergens;
    },
    new Map<string, Array<{ id: string; name: string }>>(),
  );
  const subcategoriesByCategoryId = ((subcategoriesResult?.data ?? []) as SubcategoryRow[]).reduce(
    (subcategories, subcategory) => {
      const categorySubcategories = subcategories.get(subcategory.category_id) ?? [];
      categorySubcategories.push({
        ...subcategory,
        name:
          (subcategory[`name_${locale}` as keyof SubcategoryRow] as string | null) ??
          subcategory.name,
      });
      subcategories.set(subcategory.category_id, categorySubcategories);
      return subcategories;
    },
    new Map<string, SubcategoryRow[]>(),
  );
  const categories = ((categoriesResult?.data ?? []) as CategoryRow[])
    .map((cat) => ({
      ...cat,
      name: cat[`name_${locale}` as keyof CategoryRow] ?? cat.name,
    }))
    .map((category) => {
      const categoryMenuItems = menuItems
        .filter((item) => item.category_id === category.id)
        .map((item) => ({
          ...item,
          optionGroups: [],
          allergens: allergensByItemId.get(item.id) ?? [],
          availableLocationIds: availableLocationIdsByItemId.get(item.id) ?? [],
        }));

      return {
        ...category,
        availableLocationIds: availableLocationIdsByCategoryId.get(category.id) ?? [],
        menu_items: categoryMenuItems,
        subcategories: (subcategoriesByCategoryId.get(category.id) ?? [])
          .map((subcategory) => ({
            ...subcategory,
            menu_items: categoryMenuItems.filter((item) => item.subcategory_id === subcategory.id),
          }))
          .filter((subcategory) => subcategory.menu_items.length > 0),
      };
    })
    .filter((category) => category.menu_items.length > 0) as MenuCategory[];
  const allAllergens = ((allAllergensResult.data ?? []) as AllergenRow[]).map((allergen) => ({
    id: allergen.id,
    name: allergen[`name_${locale}` as keyof AllergenRow] ?? allergen.name,
  }));
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
  const overridesByLocationId = (overridesResult.data ?? []).reduce((acc, row) => {
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
        Menu preview
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
