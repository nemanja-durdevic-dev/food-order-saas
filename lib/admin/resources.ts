import type { LucideIcon } from "lucide-react";
import { ClipboardList, ListTree, Tags, UtensilsCrossed } from "lucide-react";

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
  type: "boolean" | "image" | "multiselect" | "number" | "select" | "text" | "textarea";
  helpText?: string;
  join?: {
    defaults?: Record<string, boolean | number | string | null>;
    selectEquals?: Record<string, boolean | number | string | null>;
    sortColumn?: string;
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
  searchable?: boolean;
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

const categoryLocationField: AdminField = {
  key: "location_ids",
  label: "Locations",
  helpText: "Locations where this category is shown.",
  join: {
    table: "category_locations",
    sourceColumn: "category_id",
    targetColumn: "location_id",
  },
  relation: { table: "locations", labelColumn: "name" },
  required: true,
  type: "multiselect",
};

const subcategoryLocationField: AdminField = {
  key: "location_ids",
  label: "Locations",
  helpText: "Locations where this subcategory is shown.",
  join: {
    table: "subcategory_locations",
    sourceColumn: "subcategory_id",
    targetColumn: "location_id",
  },
  relation: { table: "locations", labelColumn: "name" },
  required: true,
  type: "multiselect",
};

const menuItemLocationField: AdminField = {
  key: "location_ids",
  label: "Locations",
  helpText: "Locations where this item is available.",
  join: {
    defaults: { is_available: true },
    selectEquals: { is_available: true },
    table: "menu_item_locations",
    sourceColumn: "menu_item_id",
    targetColumn: "location_id",
  },
  relation: { table: "locations", labelColumn: "name" },
  required: true,
  type: "multiselect",
};

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
  { key: "image_url", label: "Image", type: "image" },
  { key: "price", label: "Price", type: "number", required: true },
  categoryRelationField,
  subcategoryRelationField,
  menuItemLocationField,
  {
    key: "add_on_option_ids",
    label: "Add Ons",
    helpText: "Options customers can add to this item.",
    join: {
      table: "menu_item_add_on_options",
      sourceColumn: "menu_item_id",
      targetColumn: "add_on_option_id",
      sortColumn: "sort_order",
    },
    relation: { table: "add_on_options", labelColumn: "name", restaurantScoped: false },
    searchable: true,
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
      sortColumn: "sort_order",
    },
    relation: { table: "ingredients", labelColumn: "name", restaurantScoped: false },
    searchable: true,
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
      sortColumn: "sort_order",
    },
    relation: { table: "allergens", labelColumn: "name", restaurantScoped: false },
    searchable: true,
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
    createFields: [...localizedNameFields, categoryLocationField],
    editFields: [...localizedNameFields, categoryLocationField],
    formSelect: "id, name, name_no, name_sv, name_da, sort_order, created_at, updated_at",
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
    createFields: [categoryRelationField, ...localizedNameFields, subcategoryLocationField],
    editFields: [categoryRelationField, ...localizedNameFields, subcategoryLocationField],
    formSelect:
      "id, category_id, name, name_no, name_sv, name_da, sort_order, created_at, updated_at",
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
      "id, category_id, subcategory_id, is_available, name, name_no, name_sv, name_da, description, description_no, description_sv, description_da, image_url, price, created_at, updated_at",
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
    formSelect: "id, status, payment_status, order_code, created_at, updated_at",
  },
];

export function getAdminResource(slug: string) {
  return adminResources.find((resource) => resource.slug === slug) ?? null;
}
