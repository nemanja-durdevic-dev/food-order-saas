import type { MenuCategory } from "@/components/order-menu/types";

export type MenuChange = {
  summary: string;
  type:
    | "category_added"
    | "category_removed"
    | "category_renamed"
    | "item_added"
    | "item_removed"
    | "item_price_changed"
    | "item_made_available"
    | "item_made_unavailable";
};

function formatPrice(price: number | string) {
  const value = Number(price);
  if (Number.isNaN(value)) return "–";
  return String(value);
}

export function computeMenuDiff(
  publishedCategories: MenuCategory[],
  currentCategories: MenuCategory[],
): MenuChange[] {
  const changes: MenuChange[] = [];

  const publishedCatMap = new Map(publishedCategories.map((c) => [c.id, c]));
  const currentCatMap = new Map(currentCategories.map((c) => [c.id, c]));

  for (const cat of currentCategories) {
    const publishedCat = publishedCatMap.get(cat.id);

    if (!publishedCat) {
      changes.push({ summary: `Added "${cat.name}" category`, type: "category_added" });
    } else if (publishedCat.name !== cat.name) {
      changes.push({
        summary: `Renamed "${publishedCat.name}" to "${cat.name}"`,
        type: "category_renamed",
      });
    }
  }

  for (const cat of publishedCategories) {
    if (!currentCatMap.has(cat.id)) {
      changes.push({ summary: `Removed "${cat.name}" category`, type: "category_removed" });
    }
  }

  const publishedItemMap = new Map<
    string,
    { name: string; price: number | string; is_available: boolean }
  >();
  for (const cat of publishedCategories) {
    for (const item of cat.menu_items) {
      publishedItemMap.set(item.id, {
        name: item.name,
        price: item.price,
        is_available: item.is_available,
      });
    }
  }

  const currentItemMap = new Map<
    string,
    { name: string; price: number | string; is_available: boolean; category_name: string }
  >();
  for (const cat of currentCategories) {
    for (const item of cat.menu_items) {
      currentItemMap.set(item.id, {
        name: item.name,
        price: item.price,
        is_available: item.is_available,
        category_name: cat.name,
      });
    }
  }

  for (const [id, item] of currentItemMap) {
    const publishedItem = publishedItemMap.get(id);

    if (!publishedItem) {
      changes.push({ summary: `Added "${item.name}"`, type: "item_added" });
    } else {
      if (Number(publishedItem.price) !== Number(item.price)) {
        changes.push({
          summary: `Changed "${item.name}" price from ${formatPrice(publishedItem.price)} to ${formatPrice(item.price)}`,
          type: "item_price_changed",
        });
      }

      if (Boolean(publishedItem.is_available) !== Boolean(item.is_available)) {
        changes.push({
          summary: item.is_available
            ? `Made "${item.name}" available`
            : `Made "${item.name}" unavailable`,
          type: item.is_available ? "item_made_available" : "item_made_unavailable",
        });
      }
    }
  }

  for (const [id, item] of publishedItemMap) {
    if (!currentItemMap.has(id)) {
      changes.push({ summary: `Removed "${item.name}"`, type: "item_removed" });
    }
  }

  return changes;
}
