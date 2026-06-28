"use client";

import type { RefObject } from "react";
import Image from "next/image";

import { Card } from "@/components/ui/card";

import { accents, menuItemMediaClass } from "./constants";
import type { MenuCategory, MenuItem } from "./types";
import { formatPrice } from "./utils";
import { useTranslations } from "./locale-context";

type MenuCategoryListProps = {
  categories: MenuCategory[];
  categoryRefs: RefObject<Record<string, HTMLElement | null>>;
  currency: string;
  getItemCartQuantity: (itemId: string) => number;
  hasBottomCartSpace: boolean;
  onOpenAllergens: () => void;
  onOpenItemDetails: (item: MenuItem) => void;
  selectedAllergenIds: string[];
  subcategoryRefs: RefObject<Record<string, HTMLElement | null>>;
};

export function MenuCategoryList({
  categories,
  categoryRefs,
  currency,
  getItemCartQuantity,
  hasBottomCartSpace,
  onOpenAllergens,
  onOpenItemDetails,
  selectedAllergenIds,
  subcategoryRefs,
}: MenuCategoryListProps) {
  const t = useTranslations();

  return (
    <div className={`space-y-10 ${hasBottomCartSpace ? "pb-24" : ""}`}>
      {categories.map((category, index) => {
        const hasSubcategories = category.subcategories.length > 0;
        const subcategoryIds = new Set(category.subcategories.map((subcategory) => subcategory.id));
        const uncategorizedItems = category.menu_items.filter(
          (item) => !item.subcategory_id || !subcategoryIds.has(item.subcategory_id),
        );

        return (
          <section
            className="min-w-0 scroll-mt-40"
            data-category-id={category.id}
            key={category.id}
            ref={(element) => {
              categoryRefs.current[category.id] = element;
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {category.name}
              </h2>
              {index === 0 ? (
                <button
                  className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={onOpenAllergens}
                  type="button"
                >
                  <span className="text-foreground" aria-hidden="true">
                    ⚠️
                  </span>
                  {t("item.allergens")}
                </button>
              ) : null}
            </div>
            {hasSubcategories ? (
              <div className="space-y-8">
                {category.subcategories.map((subcategory) => (
                  <section
                    className="scroll-mt-40"
                    data-category-id={category.id}
                    data-subcategory-id={subcategory.id}
                    key={subcategory.id}
                    ref={(element) => {
                      subcategoryRefs.current[subcategory.id] = element;
                    }}
                  >
                    <h3 className="mb-3 text-lg font-semibold tracking-tight text-foreground">
                      {subcategory.name}
                    </h3>
                    <div className="grid min-w-0 gap-4">
                      {subcategory.menu_items.map((item, itemIndex) => (
                        <MenuItemCard
                          currency={currency}
                          item={item}
                          itemCartQuantity={getItemCartQuantity(item.id)}
                          key={item.id}
                          onOpenItemDetails={onOpenItemDetails}
                          placeholderAccent={accents[itemIndex % accents.length]}
                          selectedAllergenIds={selectedAllergenIds}
                        />
                      ))}
                    </div>
                  </section>
                ))}
                {uncategorizedItems.length > 0 ? (
                  <div className="grid min-w-0 gap-4">
                    {uncategorizedItems.map((item, itemIndex) => (
                      <MenuItemCard
                        currency={currency}
                        item={item}
                        itemCartQuantity={getItemCartQuantity(item.id)}
                        key={item.id}
                        onOpenItemDetails={onOpenItemDetails}
                        placeholderAccent={accents[itemIndex % accents.length]}
                        selectedAllergenIds={selectedAllergenIds}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid min-w-0 gap-4">
                {category.menu_items.map((item, itemIndex) => (
                  <MenuItemCard
                    currency={currency}
                    item={item}
                    itemCartQuantity={getItemCartQuantity(item.id)}
                    key={item.id}
                    onOpenItemDetails={onOpenItemDetails}
                    placeholderAccent={accents[itemIndex % accents.length]}
                    selectedAllergenIds={selectedAllergenIds}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function MenuItemCard({
  item,
  itemCartQuantity,
  onOpenItemDetails,
  placeholderAccent,
  selectedAllergenIds,
  currency,
}: {
  item: MenuItem;
  itemCartQuantity: number;
  onOpenItemDetails: (item: MenuItem) => void;
  placeholderAccent: string;
  selectedAllergenIds: string[];
  currency: string;
}) {
  const t = useTranslations();
  const cartIndicatorClassName = itemCartQuantity ? "border-l-4 border-l-primary" : "border-l-0";
  const hasSelectedAllergen = item.allergens.some((a) => selectedAllergenIds.includes(a.id));

  return (
    <Card
      className={`relative min-w-0 w-full rounded-xl border-0 bg-card/90 shadow-sm ${cartIndicatorClassName} ${item.is_available ? "" : "opacity-60 ring-1 ring-destructive/20"}`}
    >
      {hasSelectedAllergen ? (
        <span
          className="absolute -right-1 -top-1.5 z-10 text-sm text-foreground"
          aria-hidden="true"
        >
          ⚠️
        </span>
      ) : null}
      <button
        className="flex min-w-0 w-full cursor-pointer gap-3 overflow-hidden rounded-xl text-left transition-all hover:bg-accent active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        disabled={!item.is_available}
        onClick={() => {
          if (item.is_available) onOpenItemDetails(item);
        }}
        type="button"
      >
        <div className="flex min-w-0 flex-1 flex-col px-4 py-3">
          <div className="pb-1">
            <h3 className="flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight">
              {itemCartQuantity ? (
                <span className="shrink-0 text-xs font-bold text-primary">
                  {itemCartQuantity} x
                </span>
              ) : null}
              <span className="min-w-0 max-w-[11rem] truncate sm:max-w-[18rem] lg:max-w-[24rem]">
                {item.name}
              </span>
              {item.is_available ? null : (
                <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                  {t("item.sold_out")}
                </span>
              )}
            </h3>
          </div>
          <div className="flex flex-1 flex-col justify-between">
            <p className="line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">
              {item.description ?? t("item.description_default")}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-base font-semibold">{formatPrice(item.price, currency)}</p>
            </div>
          </div>
        </div>
        {item.image_url ? (
          <div className={menuItemMediaClass}>
            <Image
              alt={item.name}
              className="h-full w-full object-cover"
              decoding="async"
              height={128}
              loading="lazy"
              sizes="(min-width: 640px) 128px, 112px"
              src={item.image_url}
              width={128}
            />
          </div>
        ) : (
          <div
            className={`${menuItemMediaClass} px-3 text-center text-[10px] font-black uppercase leading-4 tracking-[0.12em] text-secondary-foreground/70 ${placeholderAccent}`}
          >
            {t("item.image_placeholder")}
          </div>
        )}
      </button>
    </Card>
  );
}
