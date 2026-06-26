import type { LucideIcon } from "lucide-react";
import { ClipboardList, MapPin, Tags, UtensilsCrossed } from "lucide-react";

export type AdminColumn = {
  key: string;
  label: string;
  type?: "boolean" | "currency" | "datetime" | "status" | "text";
};

export type AdminResource = {
  slug: string;
  label: string;
  pluralLabel: string;
  icon: LucideIcon;
  table: string;
  description: string;
  select: string;
  columns: AdminColumn[];
  searchColumns?: string[];
  restaurantScoped?: boolean;
  sort?: { column: string; ascending: boolean };
};

export const adminResources: AdminResource[] = [
  {
    slug: "locations",
    label: "Location",
    pluralLabel: "Locations",
    icon: MapPin,
    table: "locations",
    description: "Pickup locations, opening state, contact details, and hours.",
    select: "id, name, address, phone, is_open, updated_at",
    columns: [
      { key: "name", label: "Name" },
      { key: "address", label: "Address" },
      { key: "phone", label: "Phone" },
      { key: "is_open", label: "Open", type: "boolean" },
      { key: "updated_at", label: "Updated", type: "datetime" },
    ],
    searchColumns: ["name", "address", "phone"],
    restaurantScoped: true,
    sort: { column: "name", ascending: true },
  },
  {
    slug: "categories",
    label: "Category",
    pluralLabel: "Categories",
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
  },
  {
    slug: "menu-items",
    label: "Menu Item",
    pluralLabel: "Menu Items",
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
  },
];

export function getAdminResource(slug: string) {
  return adminResources.find((resource) => resource.slug === slug) ?? null;
}
