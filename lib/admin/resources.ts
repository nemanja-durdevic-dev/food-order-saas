import type { LucideIcon } from "lucide-react";
import { CirclePlus, ClipboardList, Leaf, ListTree, Tags, UtensilsCrossed } from "lucide-react";

export type AdminColumn = {
  key: string;
  label: string;
  type?: "boolean" | "currency" | "datetime" | "status" | "text";
};

export type AdminFieldOption = {
  label: string;
  value: string;
};

export type AdminField = {
  key: string;
  label: string;
  type: "boolean" | "multiselect" | "number" | "select" | "text" | "textarea";
  helpText?: string;
  join?: {
    table: string;
    sourceColumn: string;
    targetColumn: string;
  };
  options?: AdminFieldOption[];
  relation?: {
    labelColumn: string;
    restaurantScoped?: boolean;
    table: string;
  };
  required?: boolean;
};

export type AdminResource = {
  slug: string;
  label: string;
  pluralLabel: string;
  group?: string;
  icon: LucideIcon;
  table: string;
  description: string;
  select: string;
  columns: AdminColumn[];
  searchColumns?: string[];
  restaurantScoped?: boolean;
  sort?: { column: string; ascending: boolean };
  createFields?: AdminField[];
  editFields?: AdminField[];
  formSelect?: string;
};

const localizedNameFields: AdminField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "name_no", label: "Norwegian name", type: "text" },
  { key: "name_sv", label: "Swedish name", type: "text" },
  { key: "name_da", label: "Danish name", type: "text" },
  { key: "sort_order", label: "Sort order", type: "number", required: true },
];

const categoryRelationField: AdminField = {
  key: "category_id",
  label: "Category",
  relation: { table: "categories", labelColumn: "name" },
  required: true,
  type: "select",
};

const subcategoryRelationField: AdminField = {
  key: "subcategory_id",
  label: "Subcategory",
  relation: { table: "subcategories", labelColumn: "name" },
  type: "select",
};

const menuItemFields: AdminField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "name_no", label: "Norwegian name", type: "text" },
  { key: "name_sv", label: "Swedish name", type: "text" },
  { key: "name_da", label: "Danish name", type: "text" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "description_no", label: "Norwegian description", type: "textarea" },
  { key: "description_sv", label: "Swedish description", type: "textarea" },
  { key: "description_da", label: "Danish description", type: "textarea" },
  { key: "image_url", label: "Image URL", type: "text" },
  { key: "price", label: "Price", type: "number", required: true },
  categoryRelationField,
  subcategoryRelationField,
  {
    key: "add_on_option_ids",
    label: "Add Ons",
    helpText: "Options customers can add to this item.",
    join: {
      table: "menu_item_add_on_options",
      sourceColumn: "menu_item_id",
      targetColumn: "add_on_option_id",
    },
    relation: { table: "add_on_options", labelColumn: "name" },
    type: "multiselect",
  },
  {
    key: "ingredient_ids",
    label: "Ingredients",
    helpText: "Ingredients shown for this item.",
    join: {
      table: "menu_item_ingredients",
      sourceColumn: "menu_item_id",
      targetColumn: "ingredient_id",
    },
    relation: { table: "ingredients", labelColumn: "name", restaurantScoped: false },
    type: "multiselect",
  },
  {
    key: "allergen_ids",
    label: "Allergens",
    helpText: "Allergens shown for this item.",
    join: {
      table: "menu_item_allergens",
      sourceColumn: "menu_item_id",
      targetColumn: "allergen_id",
    },
    relation: { table: "allergens", labelColumn: "name", restaurantScoped: false },
    type: "multiselect",
  },
  { key: "is_available", label: "Available", type: "boolean" },
];

export const adminResources: AdminResource[] = [
  {
    slug: "categories",
    label: "Category",
    pluralLabel: "Categories",
    group: "Menu",
    icon: Tags,
    table: "categories",
    description: "Menu sections and localized category names.",
    select: "id, name, name_no, sort_order, updated_at",
    columns: [
      { key: "name", label: "Name" },
      { key: "name_no", label: "Norwegian" },
      { key: "sort_order", label: "Sort" },
      { key: "updated_at", label: "Updated", type: "datetime" },
    ],
    searchColumns: ["name", "name_no", "name_sv", "name_da"],
    restaurantScoped: true,
    sort: { column: "sort_order", ascending: true },
    createFields: localizedNameFields,
    editFields: localizedNameFields,
    formSelect: "id, name, name_no, name_sv, name_da, sort_order",
  },
  {
    slug: "subcategories",
    label: "Subcategory",
    pluralLabel: "Subcategories",
    group: "Menu",
    icon: ListTree,
    table: "subcategories",
    description: "Nested menu sections within categories and their localized names.",
    select: "id, name, name_no, sort_order, updated_at, categories(name)",
    columns: [
      { key: "name", label: "Name" },
      { key: "categories.name", label: "Category" },
      { key: "name_no", label: "Norwegian" },
      { key: "sort_order", label: "Sort" },
      { key: "updated_at", label: "Updated", type: "datetime" },
    ],
    searchColumns: ["name", "name_no", "name_sv", "name_da"],
    restaurantScoped: true,
    sort: { column: "sort_order", ascending: true },
    createFields: [categoryRelationField, ...localizedNameFields],
    editFields: [categoryRelationField, ...localizedNameFields],
    formSelect: "id, category_id, name, name_no, name_sv, name_da, sort_order",
  },
  {
    slug: "menu-items",
    label: "Item",
    pluralLabel: "Items",
    group: "Menu",
    icon: UtensilsCrossed,
    table: "menu_items",
    description: "Dishes, prices, images, availability, and localized copy.",
    select: "id, name, price, is_available, updated_at",
    columns: [
      { key: "name", label: "Name" },
      { key: "price", label: "Price", type: "currency" },
      { key: "is_available", label: "Available", type: "boolean" },
      { key: "updated_at", label: "Updated", type: "datetime" },
    ],
    searchColumns: ["name", "name_no", "description", "description_no"],
    restaurantScoped: true,
    sort: { column: "name", ascending: true },
    createFields: menuItemFields,
    editFields: menuItemFields,
    formSelect:
      "id, category_id, subcategory_id, is_available, name, name_no, name_sv, name_da, description, description_no, description_sv, description_da, image_url, price",
  },
  {
    slug: "ingredients",
    label: "Ingredient",
    pluralLabel: "Ingredients",
    group: "Menu",
    icon: Leaf,
    table: "ingredients",
    description: "Reusable ingredients that can be assigned to menu items.",
    select: "id, name, name_no, updated_at",
    columns: [
      { key: "name", label: "Name" },
      { key: "name_no", label: "Norwegian" },
      { key: "updated_at", label: "Updated", type: "datetime" },
    ],
    searchColumns: ["name", "name_no", "name_sv", "name_da"],
    sort: { column: "name", ascending: true },
    createFields: localizedNameFields.slice(0, 4),
    editFields: localizedNameFields.slice(0, 4),
    formSelect: "id, name, name_no, name_sv, name_da",
  },
  {
    slug: "add-ons",
    label: "Add On",
    pluralLabel: "Add Ons",
    group: "Menu",
    icon: CirclePlus,
    table: "add_on_options",
    description: "Optional extras customers can add to menu items.",
    select: "id, name, name_no, price, is_available, sort_order, updated_at",
    columns: [
      { key: "name", label: "Name" },
      { key: "price", label: "Price", type: "currency" },
      { key: "is_available", label: "Available", type: "boolean" },
      { key: "sort_order", label: "Sort" },
      { key: "updated_at", label: "Updated", type: "datetime" },
    ],
    searchColumns: ["name", "name_no", "name_sv", "name_da"],
    restaurantScoped: true,
    sort: { column: "sort_order", ascending: true },
    createFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "name_no", label: "Norwegian name", type: "text" },
      { key: "name_sv", label: "Swedish name", type: "text" },
      { key: "name_da", label: "Danish name", type: "text" },
      { key: "price", label: "Price", type: "number", required: true },
      { key: "is_available", label: "Available", type: "boolean" },
      { key: "sort_order", label: "Sort order", type: "number", required: true },
    ],
    editFields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "name_no", label: "Norwegian name", type: "text" },
      { key: "name_sv", label: "Swedish name", type: "text" },
      { key: "name_da", label: "Danish name", type: "text" },
      { key: "price", label: "Price", type: "number", required: true },
      { key: "is_available", label: "Available", type: "boolean" },
      { key: "sort_order", label: "Sort order", type: "number", required: true },
    ],
    formSelect: "id, name, name_no, name_sv, name_da, price, is_available, sort_order",
  },
  {
    slug: "orders",
    label: "Order",
    pluralLabel: "Orders",
    icon: ClipboardList,
    table: "orders",
    description: "Customer orders, payment state, timing, totals, and fulfillment status.",
    select: "id, order_code, status, payment_status, total, created_at",
    columns: [
      { key: "order_code", label: "Code" },
      { key: "status", label: "Status", type: "status" },
      { key: "payment_status", label: "Payment", type: "status" },
      { key: "total", label: "Total", type: "currency" },
      { key: "created_at", label: "Created", type: "datetime" },
    ],
    searchColumns: ["order_code"],
    restaurantScoped: true,
    sort: { column: "created_at", ascending: false },
    editFields: [
      {
        key: "status",
        label: "Status",
        options: [
          { label: "Pending", value: "pending" },
          { label: "Confirmed", value: "confirmed" },
          { label: "Preparing", value: "preparing" },
          { label: "Ready for pickup", value: "ready_for_pickup" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
        ],
        required: true,
        type: "select",
      },
      {
        key: "payment_status",
        label: "Payment status",
        options: [
          { label: "Unpaid", value: "unpaid" },
          { label: "Paid", value: "paid" },
          { label: "Failed", value: "failed" },
          { label: "Refunded", value: "refunded" },
        ],
        required: true,
        type: "select",
      },
    ],
    formSelect: "id, status, payment_status, order_code",
  },
];

export function getAdminResource(slug: string) {
  return adminResources.find((resource) => resource.slug === slug) ?? null;
}
