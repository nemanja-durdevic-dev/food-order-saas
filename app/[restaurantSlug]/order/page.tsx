import { notFound } from "next/navigation";

import { getLocale } from "@/lib/dictionaries";
import type { Location, MenuCategory } from "@/components/order-menu/types";
import { OrderMenu } from "@/components/order-menu";
import { supabase } from "@/lib/supabase";
import { BRAND_NAME } from "@/lib/brand";

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

type OptionGroupRelation = Record<string, unknown>;

type OptionGroupChoiceRelation = Record<string, unknown>;

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
    .select("id, name, logo_url, instagram_url, facebook_url, tiktok_url")
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
    ...(loc as Omit<Location, "opening_hours">),
    opening_hours:
      location_hours?.map((h) => ({
        day: h.day,
        open: h.open_time?.slice(0, 5),
        close: h.close_time?.slice(0, 5),
        closed: h.is_closed || undefined,
      })) ?? [],
  })) as unknown as Location[];
  const locationIds = (locationsResult.data ?? []).map((l) => l.id);

  const [
    categoriesResult,
    subcategoriesResult,
    categoryAvailabilityResult,
    availabilityResult,
    menuItemsResult,
    optionGroupsResult,
    optionGroupChoicesResult,
    allergensResult,
    allAllergensResult,
    overridesResult,
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
      .from("menu_item_option_groups")
      .select(
        "id, menu_item_id, option_group_id, sort_order, is_required, is_multi_select, option_groups!inner(id, name, name_no, name_sv, name_da, description, description_no, description_sv, description_da, is_required, is_multi_select, min_select, max_select)",
      )
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_item_option_group_choices")
      .select(
        "menu_item_option_group_id, option_group_choice_id, sort_order, option_group_choices!inner(id, name, name_no, name_sv, name_da, price_modifier_type, price_modifier, sort_order)",
      )
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_item_allergens")
      .select("menu_item_id, allergen_id, allergens(name, name_no, name_sv, name_da)")
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
  interface OptionGroupRow {
    id: string;
    menu_item_id: string;
    option_group_id: string;
    sort_order: number;
    is_required: boolean | null;
    is_multi_select: boolean | null;
    option_groups: OptionGroupRelation;
  }

  interface OptionGroupChoiceRow {
    menu_item_option_group_id: string;
    option_group_choice_id: string;
    sort_order: number;
    option_group_choices: OptionGroupChoiceRelation;
  }

  const rawOptionGroupData = (optionGroupsResult.data ?? []) as unknown as OptionGroupRow[];
  const rawOptionGroupChoiceData = (optionGroupChoicesResult.data ??
    []) as unknown as OptionGroupChoiceRow[];

  const groupsByItemAssignmentId = new Map(
    rawOptionGroupData.map((row) => {
      const group = row.option_groups as Record<string, unknown>;
      const localizedName = (group[`name_${locale}`] as string | null) ?? (group.name as string);
      const localizedDescription =
        (group[`description_${locale}`] as string | null) ?? (group.description as string | null);
      return [
        row.id,
        {
          menuItemId: row.menu_item_id,
          groupId: row.option_group_id,
          group: {
            id: group.id as string,
            name: localizedName,
            description: localizedDescription ?? undefined,
            isRequired: row.is_required ?? (group.is_required as boolean),
            isMultiSelect: row.is_multi_select ?? (group.is_multi_select as boolean),
            minSelect: (group.min_select as number | null) ?? 0,
            maxSelect: (group.max_select as number | null) ?? null,
            sortOrder: row.sort_order,
          },
        },
      ];
    }),
  );
  const choicesByAssignmentId = rawOptionGroupChoiceData.reduce((choices, row) => {
    const c = row.option_group_choices as Record<string, unknown>;
    const localizedName = (c[`name_${locale}`] as string | null) ?? (c.name as string);

    const assignmentChoices = choices.get(row.menu_item_option_group_id) ?? [];
    assignmentChoices.push({
      id: row.option_group_choice_id,
      name: localizedName,
      priceModifierType: c.price_modifier_type as string as "increase" | "decrease" | "neutral",
      priceModifier: Number(c.price_modifier),
    });
    choices.set(row.menu_item_option_group_id, assignmentChoices);

    return choices;
  }, new Map<string, Array<{ id: string; name: string; priceModifierType: "increase" | "decrease" | "neutral"; priceModifier: number }>>());
  const optionGroupsByItemId = new Map<
    string,
    Array<{
      id: string;
      name: string;
      description?: string;
      isRequired: boolean;
      isMultiSelect: boolean;
      minSelect: number;
      maxSelect: number | null;
      choices: Array<{
        id: string;
        name: string;
        priceModifierType: "increase" | "decrease" | "neutral";
        priceModifier: number;
      }>;
    }>
  >();

  for (const [assignmentId, assignment] of groupsByItemAssignmentId) {
    const itemGroups = optionGroupsByItemId.get(assignment.menuItemId) ?? [];
    const existing = itemGroups.find((g) => g.id === assignment.groupId);

    if (!existing) {
      const groupChoices = (choicesByAssignmentId.get(assignmentId) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      itemGroups.push({
        id: assignment.group.id,
        name: assignment.group.name,
        description: assignment.group.description ?? undefined,
        isRequired: assignment.group.isRequired,
        isMultiSelect: assignment.group.isMultiSelect,
        minSelect: assignment.group.minSelect,
        maxSelect: assignment.group.maxSelect,
        choices: groupChoices,
      });
      optionGroupsByItemId.set(assignment.menuItemId, itemGroups);
    } else {
      const groupChoices = (choicesByAssignmentId.get(assignmentId) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      existing.choices.push(...groupChoices);
    }
  }

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
          optionGroups: optionGroupsByItemId.get(item.id) ?? [],
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
    optionGroupsResult?.error?.message ??
    optionGroupChoicesResult?.error?.message ??
    allergensResult?.error?.message;

  return (
    <main className="min-h-screen">
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
    </main>
  );
}
