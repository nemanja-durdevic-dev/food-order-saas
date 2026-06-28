import type { SupabaseClient } from "@supabase/supabase-js";

import type { MenuCategory } from "@/components/order-menu/types";

type Locale = "da" | "en" | "no" | "sv";

type LocalizedRecord = {
  name: string;
  name_da: string | null;
  name_no: string | null;
  name_sv: string | null;
};

type CategoryRow = LocalizedRecord & {
  id: string;
  sort_order: number;
};

type SubcategoryRow = LocalizedRecord & {
  category_id: string;
  id: string;
  sort_order: number;
};

type MenuItemRow = LocalizedRecord & {
  category_id: string | null;
  description: string | null;
  description_da: string | null;
  description_no: string | null;
  description_sv: string | null;
  id: string;
  image_url: string | null;
  is_available: boolean;
  price: number | string;
  subcategory_id: string | null;
};

type IngredientRelation = LocalizedRecord;

type MenuItemIngredientRow = {
  ingredient_id: string;
  ingredients: IngredientRelation | IngredientRelation[] | null;
  menu_item_id: string;
};

type AllergenRelation = LocalizedRecord;

type MenuItemAllergenRow = {
  allergen_id: string;
  allergens: AllergenRelation | AllergenRelation[] | null;
  menu_item_id: string;
};

type AllergenRow = LocalizedRecord & { id: string };

type AddOnRelation = LocalizedRecord & { price: number | string };

type MenuItemAddOnRow = {
  add_on_option_id: string;
  add_on_options: AddOnRelation | AddOnRelation[] | null;
  menu_item_id: string;
};

type AvailabilityRow = {
  location_id: string;
  menu_item_id: string;
};

type CategoryAvailabilityRow = {
  category_id: string;
  location_id: string;
};

export type MenuPublicationSnapshot = {
  allAllergensByLocale: Record<Locale, Array<{ id: string; name: string }>>;
  categoriesByLocale: Record<Locale, MenuCategory[]>;
  publishedAt: string;
};

const locales: Locale[] = ["en", "no", "sv", "da"];

function firstRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? relation[0] : relation;
}

function localizeName(record: LocalizedRecord, locale: Locale) {
  if (locale === "en") {
    return record.name;
  }

  return record[`name_${locale}`] ?? record.name;
}

function localizeDescription(record: MenuItemRow, locale: Locale) {
  if (locale === "en") {
    return record.description;
  }

  return record[`description_${locale}`] ?? record.description;
}

export async function buildMenuPublicationSnapshot(
  supabase: SupabaseClient,
  restaurantId: string,
): Promise<MenuPublicationSnapshot> {
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
    supabase.from("allergens").select("id, name, name_no, name_sv, name_da").order("name", {
      ascending: true,
    }),
  ]);

  const error =
    categoriesResult.error?.message ??
    subcategoriesResult.error?.message ??
    categoryAvailabilityResult.error?.message ??
    availabilityResult.error?.message ??
    menuItemsResult.error?.message ??
    ingredientsResult.error?.message ??
    allergensResult.error?.message ??
    addOnsResult.error?.message ??
    allAllergensResult.error?.message;

  if (error) {
    throw new Error(error);
  }

  const availableLocationIdsByItemId = (
    (availabilityResult.data ?? []) as AvailabilityRow[]
  ).reduce((availableLocationIds, item) => {
    const locationIds = availableLocationIds.get(item.menu_item_id) ?? [];
    locationIds.push(item.location_id);
    availableLocationIds.set(item.menu_item_id, locationIds);

    return availableLocationIds;
  }, new Map<string, string[]>());
  const availableLocationIdsByCategoryId = (
    (categoryAvailabilityResult.data ?? []) as CategoryAvailabilityRow[]
  ).reduce((availableLocationIds, item) => {
    const locationIds = availableLocationIds.get(item.category_id) ?? [];
    locationIds.push(item.location_id);
    availableLocationIds.set(item.category_id, locationIds);

    return availableLocationIds;
  }, new Map<string, string[]>());
  const categoriesByLocale = locales.reduce(
    (categoriesByLocale, locale) => {
      const menuItems = ((menuItemsResult.data ?? []) as MenuItemRow[]).map((item) => ({
        ...item,
        description: localizeDescription(item, locale),
        name: localizeName(item, locale),
      }));
      const ingredientsByItemId = (
        (ingredientsResult.data ?? []) as MenuItemIngredientRow[]
      ).reduce((ingredients, row) => {
        const ingredient = firstRelation(row.ingredients);

        if (!ingredient) {
          return ingredients;
        }

        const itemIngredients = ingredients.get(row.menu_item_id) ?? [];
        itemIngredients.push({ id: row.ingredient_id, name: localizeName(ingredient, locale) });
        ingredients.set(row.menu_item_id, itemIngredients);

        return ingredients;
      }, new Map<string, Array<{ id: string; name: string }>>());
      const allergensByItemId = ((allergensResult.data ?? []) as MenuItemAllergenRow[]).reduce(
        (allergens, row) => {
          const allergen = firstRelation(row.allergens);

          if (!allergen) {
            return allergens;
          }

          const itemAllergens = allergens.get(row.menu_item_id) ?? [];
          itemAllergens.push({ id: row.allergen_id, name: localizeName(allergen, locale) });
          allergens.set(row.menu_item_id, itemAllergens);

          return allergens;
        },
        new Map<string, Array<{ id: string; name: string }>>(),
      );
      const addOnsByItemId = ((addOnsResult.data ?? []) as MenuItemAddOnRow[]).reduce(
        (addOns, row) => {
          const addOnOption = firstRelation(row.add_on_options);

          if (!addOnOption) {
            return addOns;
          }

          const itemAddOns = addOns.get(row.menu_item_id) ?? [];
          itemAddOns.push({
            id: row.add_on_option_id,
            name: localizeName(addOnOption, locale),
            price: Number(addOnOption.price),
          });
          addOns.set(row.menu_item_id, itemAddOns);

          return addOns;
        },
        new Map<string, Array<{ id: string; name: string; price: number }>>(),
      );
      const subcategoriesByCategoryId = (
        (subcategoriesResult.data ?? []) as SubcategoryRow[]
      ).reduce((subcategories, subcategory) => {
        const categorySubcategories = subcategories.get(subcategory.category_id) ?? [];
        categorySubcategories.push({ ...subcategory, name: localizeName(subcategory, locale) });
        subcategories.set(subcategory.category_id, categorySubcategories);

        return subcategories;
      }, new Map<string, SubcategoryRow[]>());

      categoriesByLocale[locale] = ((categoriesResult.data ?? []) as CategoryRow[])
        .map((category) => ({ ...category, name: localizeName(category, locale) }))
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
            availableLocationIds: availableLocationIdsByCategoryId.get(category.id) ?? [],
            id: category.id,
            menu_items: categoryMenuItems,
            name: category.name,
            subcategories: (subcategoriesByCategoryId.get(category.id) ?? [])
              .map((subcategory) => ({
                id: subcategory.id,
                menu_items: categoryMenuItems.filter(
                  (item) => item.subcategory_id === subcategory.id,
                ),
                name: subcategory.name,
              }))
              .filter((subcategory) => subcategory.menu_items.length > 0),
          };
        })
        .filter((category) => category.menu_items.length > 0) as MenuCategory[];

      return categoriesByLocale;
    },
    {} as Record<Locale, MenuCategory[]>,
  );
  const allAllergensByLocale = locales.reduce(
    (allAllergensByLocale, locale) => {
      allAllergensByLocale[locale] = ((allAllergensResult.data ?? []) as AllergenRow[]).map(
        (allergen) => ({ id: allergen.id, name: localizeName(allergen, locale) }),
      );

      return allAllergensByLocale;
    },
    {} as Record<Locale, Array<{ id: string; name: string }>>,
  );

  return {
    allAllergensByLocale,
    categoriesByLocale,
    publishedAt: new Date().toISOString(),
  };
}
