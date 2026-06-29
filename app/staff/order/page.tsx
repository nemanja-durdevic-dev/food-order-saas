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

type OptionGroupRelation = Record<string, unknown>;

type OptionGroupChoiceRelation = Record<string, unknown>;

type OptionGroupRow = {
  id: string;
  menu_item_id: string;
  option_group_id: string;
  sort_order: number;
  is_required: boolean | null;
  is_multi_select: boolean | null;
  option_groups: OptionGroupRelation;
};

type OptionGroupChoiceRow = {
  menu_item_option_group_id: string;
  option_group_choice_id: string;
  sort_order: number;
  option_group_choices: OptionGroupChoiceRelation;
};

type CategoryAvailabilityRow = {
  category_id: string;
  location_id: string;
};

type MenuItemAvailabilityRow = {
  location_id: string;
  menu_item_id: string;
};

function firstRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? relation[0] : relation;
}

function isCategoryAvailableAtLocation(category: MenuCategory, locationId: string) {
  return (
    category.availableLocationIds ??
    category.menu_items.flatMap((item) => item.availableLocationIds)
  ).includes(locationId);
}

function getCategoriesForLocation(categories: MenuCategory[], locationId: string) {
  return categories
    .filter((category) => isCategoryAvailableAtLocation(category, locationId))
    .map((category) => ({
      ...category,
      menu_items: category.menu_items.filter((item) =>
        item.availableLocationIds.includes(locationId),
      ),
      subcategories: category.subcategories
        .filter((subcategory) =>
          subcategory.menu_items.some((item) => item.availableLocationIds.includes(locationId)),
        )
        .map((subcategory) => ({
          ...subcategory,
          menu_items: subcategory.menu_items.filter((item) =>
            item.availableLocationIds.includes(locationId),
          ),
        }))
        .filter((subcategory) => subcategory.menu_items.length > 0),
    }))
    .filter((category) => category.menu_items.length > 0);
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
    .select("name, restaurant_id")
    .eq("id", staff.location_id)
    .single();

  const locale = "en";

  const [
    categoriesResult,
    subcategoriesResult,
    categoryAvailabilityResult,
    itemAvailabilityResult,
    menuItemsResult,
    optionGroupsResult,
    optionGroupChoicesResult,
    allergensResult,
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
      .from("category_locations")
      .select("category_id, location_id")
      .eq("restaurant_id", location?.restaurant_id ?? ""),
    supabase
      .from("menu_item_locations")
      .select("menu_item_id, location_id")
      .eq("restaurant_id", location?.restaurant_id ?? "")
      .eq("is_available", true),
    supabase
      .from("menu_items")
      .select(
        "id, category_id, subcategory_id, is_available, name, name_no, name_sv, name_da, description, description_no, description_sv, description_da, image_url, price",
      )
      .order("name", { ascending: true }),
    supabase
      .from("menu_item_option_groups")
      .select(
        "id, menu_item_id, option_group_id, sort_order, is_required, is_multi_select, option_groups!inner(id, name, name_no, name_sv, name_da, description, description_no, description_sv, description_da, is_required, is_multi_select, min_select, max_select)",
      )
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
      .order("sort_order", { ascending: true }),
  ]);

  const menuItems = ((menuItemsResult?.data ?? []) as MenuItemRow[]).map((item) => ({
    ...item,
    name: item[`name_${locale}` as keyof MenuItemRow] ?? item.name,
    description: item[`description_${locale}` as keyof MenuItemRow] ?? item.description,
  }));

  const availableLocationIdsByCategoryId = (
    (categoryAvailabilityResult.data ?? []) as CategoryAvailabilityRow[]
  ).reduce((availableLocationIds, item) => {
    const locationIds = availableLocationIds.get(item.category_id) ?? [];
    locationIds.push(item.location_id);
    availableLocationIds.set(item.category_id, locationIds);

    return availableLocationIds;
  }, new Map<string, string[]>());
  const availableLocationIdsByItemId = (
    (itemAvailabilityResult.data ?? []) as MenuItemAvailabilityRow[]
  ).reduce((availableLocationIds, item) => {
    const locationIds = availableLocationIds.get(item.menu_item_id) ?? [];
    locationIds.push(item.location_id);
    availableLocationIds.set(item.menu_item_id, locationIds);

    return availableLocationIds;
  }, new Map<string, string[]>());

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
  categories = getCategoriesForLocation(categories, staff.location_id);

  return (
    <StaffOrder
      categories={categories}
      locationId={staff.location_id}
      locationName={location?.name ?? ""}
    />
  );
}
