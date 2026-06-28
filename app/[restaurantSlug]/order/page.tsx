import { notFound } from "next/navigation";

import { getLocale } from "@/lib/dictionaries";
import type { MenuCategory } from "@/components/order-menu/types";
import { OrderMenu } from "@/components/order-menu";
import { supabase } from "@/lib/supabase";
import { BRAND_NAME } from "@/lib/brand";
import type { MenuPublicationSnapshot } from "@/lib/admin/menu-publications";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Order — ${BRAND_NAME}`,
  description: "Browse the menu, customize your meal, and place a pickup order.",
};

type Props = {
  params: Promise<{ restaurantSlug: string }>;
};

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

type IngredientRelation = {
  name: string;
  name_no: string | null;
  name_sv: string | null;
  name_da: string | null;
};

type MenuItemIngredientRow = {
  ingredient_id: string;
  ingredients: IngredientRelation | IngredientRelation[] | null;
  menu_item_id: string;
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

type AddOnRelation = {
  name: string;
  name_no: string | null;
  name_sv: string | null;
  name_da: string | null;
  price: number | string;
};

type MenuItemAddOnRow = {
  add_on_options: AddOnRelation | AddOnRelation[] | null;
  add_on_option_id: string;
  menu_item_id: string;
};

type CategoryAvailabilityRow = {
  category_id: string;
  location_id: string;
};

function firstRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? relation[0] : relation;
}

export default async function RestaurantOrderPage({ params }: Props) {
  const { restaurantSlug } = await params;
  const locale = await getLocale();

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, instagram_url, facebook_url, tiktok_url")
    .eq("slug", restaurantSlug)
    .eq("status", "active")
    .single();

  if (restaurantError || !restaurant) {
    notFound();
  }

  const restaurantId = restaurant.id;
  const todayStr = new Date().toISOString().slice(0, 10);
  const endStr = new Date(new Date().getTime() + 10 * 86400000).toISOString().slice(0, 10);

  const locationsResult = await supabase
    .from("locations")
    .select(
      `id, name, address, phone, image_url, currency, is_open,
       location_hours (day, open_time, close_time, is_closed)`,
    )
    .eq("restaurant_id", restaurantId)
    .order("name", { ascending: true });

  const rawLocations = (locationsResult.data ?? []) as unknown as Array<
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
  }));
  const locationIds = (locationsResult.data ?? []).map((l) => l.id);

  const [
    categoriesResult,
    subcategoriesResult,
    categoryAvailabilityResult,
    availabilityResult,
    menuItemsResult,
    ingredientsResult,
    allergensResult,
    addOnsResult,
    allAllergensResult,
    overridesResult,
    publicationResult,
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, name_no, name_sv, name_da, sort_order")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("subcategories")
      .select("id, category_id, name, name_no, name_sv, name_da, sort_order")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("category_locations")
      .select("category_id, location_id")
      .eq("restaurant_id", restaurantId),
    supabase
      .from("menu_item_locations")
      .select("menu_item_id, location_id")
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true),
    supabase
      .from("menu_items")
      .select(
        "id, category_id, subcategory_id, is_available, name, name_no, name_sv, name_da, description, description_no, description_sv, description_da, image_url, price",
      )
      .eq("restaurant_id", restaurantId)
      .eq("is_available", true)
      .order("name", { ascending: true }),
    supabase
      .from("menu_item_ingredients")
      .select("menu_item_id, ingredient_id, ingredients(name, name_no, name_sv, name_da)")
      .eq("restaurant_id", restaurantId)
      .eq("is_removable", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_item_allergens")
      .select("menu_item_id, allergen_id, allergens(name, name_no, name_sv, name_da)")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_item_add_on_options")
      .select(
        "menu_item_id, add_on_option_id, add_on_options(name, price, name_no, name_sv, name_da)",
      )
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("allergens")
      .select("id, name, name_no, name_sv, name_da")
      .order("name", { ascending: true }),
    supabase
      .from("location_hours_overrides")
      .select("location_id, date, is_closed, open_time, close_time")
      .in("location_id", locationIds.length > 0 ? locationIds : [""])
      .gte("date", todayStr)
      .lte("date", endStr),
    supabase
      .from("menu_publications")
      .select("snapshot")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const availableLocationIdsByItemId = (availabilityResult.data ?? []).reduce(
    (availableLocationIds, item) => {
      const locationIds = availableLocationIds.get(item.menu_item_id) ?? [];
      locationIds.push(item.location_id);
      availableLocationIds.set(item.menu_item_id, locationIds);

      return availableLocationIds;
    },
    new Map<string, string[]>(),
  );
  const availableLocationIdsByCategoryId = (
    (categoryAvailabilityResult.data ?? []) as CategoryAvailabilityRow[]
  ).reduce((availableLocationIds, item) => {
    const locationIds = availableLocationIds.get(item.category_id) ?? [];
    locationIds.push(item.location_id);
    availableLocationIds.set(item.category_id, locationIds);

    return availableLocationIds;
  }, new Map<string, string[]>());
  const menuItems = ((menuItemsResult?.data ?? []) as MenuItemRow[]).map((item) => ({
    ...item,
    name: item[`name_${locale}` as keyof MenuItemRow] ?? item.name,
    description: item[`description_${locale}` as keyof MenuItemRow] ?? item.description,
  }));
  const ingredientsByItemId = ((ingredientsResult.data ?? []) as MenuItemIngredientRow[]).reduce(
    (ingredients, row) => {
      const ingredient = firstRelation(row.ingredients) as IngredientRelation | null;

      if (!ingredient) {
        return ingredients;
      }

      const itemIngredients = ingredients.get(row.menu_item_id) ?? [];
      itemIngredients.push({
        id: row.ingredient_id,
        name: ingredient[`name_${locale}` as keyof IngredientRelation] ?? ingredient.name,
      });
      ingredients.set(row.menu_item_id, itemIngredients);

      return ingredients;
    },
    new Map<string, Array<{ id: string; name: string }>>(),
  );
  const allergensByItemId = ((allergensResult.data ?? []) as MenuItemAllergenRow[]).reduce(
    (allergens, row) => {
      const allergen = firstRelation(row.allergens);

      if (!allergen) {
        return allergens;
      }

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
  const addOnsByItemId = ((addOnsResult.data ?? []) as MenuItemAddOnRow[]).reduce((addOns, row) => {
    const addOnOption = firstRelation(row.add_on_options) as AddOnRelation | null;

    if (!addOnOption) {
      return addOns;
    }

    const itemAddOns = addOns.get(row.menu_item_id) ?? [];
    itemAddOns.push({
      id: row.add_on_option_id,
      name:
        (addOnOption[`name_${locale}` as keyof AddOnRelation] as string | null) ?? addOnOption.name,
      price: Number(addOnOption.price),
    });
    addOns.set(row.menu_item_id, itemAddOns);

    return addOns;
  }, new Map<string, Array<{ id: string; name: string; price: number }>>());
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
  let categories = ((categoriesResult?.data ?? []) as CategoryRow[])
    .map((cat) => ({
      ...cat,
      name: cat[`name_${locale}` as keyof CategoryRow] ?? cat.name,
    }))
    .map((category) => {
      const categoryMenuItems = menuItems
        .filter((item) => item.category_id === category.id)
        .map((item) => ({
          ...item,
          addOnOptions: addOnsByItemId.get(item.id) ?? [],
          allergens: allergensByItemId.get(item.id) ?? [],
          availableLocationIds: availableLocationIdsByItemId.get(item.id) ?? [],
          ingredients: ingredientsByItemId.get(item.id) ?? [],
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
  let allAllergens = ((allAllergensResult.data ?? []) as AllergenRow[]).map((allergen) => ({
    id: allergen.id,
    name: allergen[`name_${locale}` as keyof AllergenRow] ?? allergen.name,
  }));
  const publicationSnapshot = publicationResult.data?.snapshot as
    | MenuPublicationSnapshot
    | undefined;

  if (publicationSnapshot) {
    categories =
      publicationSnapshot.categoriesByLocale[locale] ?? publicationSnapshot.categoriesByLocale.en;
    allAllergens =
      publicationSnapshot.allAllergensByLocale[locale] ??
      publicationSnapshot.allAllergensByLocale.en;
  }
  const overridesByLocationId = (overridesResult.data ?? []).reduce((acc, row) => {
    const locationOverrides = acc.get(row.location_id) ?? [];
    locationOverrides.push({
      date: row.date,
      is_closed: row.is_closed,
      open_time: row.open_time,
      close_time: row.close_time,
    });
    acc.set(row.location_id, locationOverrides);
    return acc;
  }, new Map<string, Array<{ date: string; is_closed: boolean; open_time: string | null; close_time: string | null }>>());

  const error =
    locationsResult.error?.message ??
    categoriesResult?.error?.message ??
    subcategoriesResult?.error?.message ??
    availabilityResult?.error?.message ??
    menuItemsResult?.error?.message ??
    ingredientsResult?.error?.message ??
    allergensResult?.error?.message ??
    addOnsResult?.error?.message;

  return (
    <main className="min-h-screen">
      <OrderMenu
        allAllergens={allAllergens}
        categories={categories}
        error={error}
        locations={locations}
        overridesByLocationId={overridesByLocationId}
        socialLinks={{
          facebook_url: restaurant.facebook_url,
          instagram_url: restaurant.instagram_url,
          tiktok_url: restaurant.tiktok_url,
        }}
      />
    </main>
  );
}
