import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import type { MenuCategory } from "@/components/order-menu/types";
import { StaffOrder } from "./staff-order";

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

type MenuItemAllergenRow = {
  allergen_id: string;
  allergens:
    | { name: string; name_no: string | null; name_sv: string | null; name_da: string | null }
    | { name: string; name_no: string | null; name_sv: string | null; name_da: string | null }[]
    | null;
  menu_item_id: string;
};

type AllergenFields = {
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

function firstRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? relation[0] : relation;
}

export default async function StaffOrderPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/staff/login");

  const { data: staff } = await supabase
    .from("staff")
    .select("location_id, role")
    .eq("user_id", user.id)
    .single();

  if (!staff || staff.role !== "staff" || !staff.location_id) {
    return (
      <p className="text-muted-foreground">
        No location assigned. Ask an admin to add you to the staff table.
      </p>
    );
  }

  const { data: location } = await supabase
    .from("locations")
    .select("name")
    .eq("id", staff.location_id)
    .single();

  const locale = "en";

  const [
    categoriesResult,
    subcategoriesResult,
    menuItemsResult,
    ingredientsResult,
    allergensResult,
    addOnsResult,
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, name_no, name_sv, name_da, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("subcategories")
      .select("id, category_id, name, name_no, name_sv, name_da, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("menu_items")
      .select(
        "id, category_id, subcategory_id, is_available, name, name_no, name_sv, name_da, description, description_no, description_sv, description_da, image_url, price",
      )
      .order("name", { ascending: true }),
    supabase
      .from("menu_item_ingredients")
      .select("menu_item_id, ingredient_id, ingredients(name, name_no, name_sv, name_da)")
      .eq("is_removable", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_item_allergens")
      .select("menu_item_id, allergen_id, allergens(name, name_no, name_sv, name_da)")
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_item_add_on_options")
      .select(
        "menu_item_id, add_on_option_id, add_on_options(name, price, name_no, name_sv, name_da)",
      )
      .order("sort_order", { ascending: true }),
  ]);

  const menuItems = ((menuItemsResult?.data ?? []) as MenuItemRow[]).map((item) => ({
    ...item,
    name: item[`name_${locale}` as keyof MenuItemRow] ?? item.name,
    description: item[`description_${locale}` as keyof MenuItemRow] ?? item.description,
  }));

  const ingredientsByItemId = ((ingredientsResult.data ?? []) as MenuItemIngredientRow[]).reduce(
    (ingredients, row) => {
      const ingredient = firstRelation(row.ingredients) as IngredientRelation | null;
      if (!ingredient) return ingredients;
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

  const addOnsByItemId = ((addOnsResult.data ?? []) as MenuItemAddOnRow[]).reduce((addOns, row) => {
    const addOnOption = firstRelation(row.add_on_options) as AddOnRelation | null;
    if (!addOnOption) return addOns;
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
          addOnOptions: addOnsByItemId.get(item.id) ?? [],
          allergens: allergensByItemId.get(item.id) ?? [],
          availableLocationIds: [],
          ingredients: ingredientsByItemId.get(item.id) ?? [],
        }));

      return {
        ...category,
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

  return (
    <StaffOrder
      categories={categories}
      locationId={staff.location_id}
      locationName={location?.name ?? ""}
    />
  );
}
