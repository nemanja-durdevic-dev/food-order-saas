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
  getItemCartQuantity: (itemId: string) => number;
  hasBottomCartSpace: boolean;
  onOpenAllergens: () => void;
  onOpenItemDetails: (item: MenuItem) => void;
  selectedAllergenIds: string[];
};

export function MenuCategoryList({
  categories,
  categoryRefs,
  getItemCartQuantity,
  hasBottomCartSpace,
  onOpenAllergens,
  onOpenItemDetails,
  selectedAllergenIds,
}: MenuCategoryListProps) {
  const t = useTranslations();

  return (
    <div className={`space-y-10 ${hasBottomCartSpace ? "pb-24" : ""}`}>
      {categories.map((category, index) => {
        const items = category.menu_items;

        return (
          <section
            className="min-w-0 scroll-mt-24"
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
                  <span className="text-amber-300" aria-hidden="true">
                    ⚠️
                  </span>
                  {t("item.allergens")}
                </button>
              ) : null}
            </div>
            <div className="grid min-w-0 gap-4">
              {items.map((item, itemIndex) => (
                <MenuItemCard
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
}: {
  item: MenuItem;
  itemCartQuantity: number;
  onOpenItemDetails: (item: MenuItem) => void;
  placeholderAccent: string;
  selectedAllergenIds: string[];
}) {
  const t = useTranslations();
  const cartIndicatorClassName = itemCartQuantity ? "border-l-4 border-l-primary" : "border-l-0";
  const hasSelectedAllergen = item.allergens.some((a) => selectedAllergenIds.includes(a.id));

  return (
    <Card
      className={`relative min-w-0 w-full rounded-xl border-0 bg-card/90 shadow-sm ${cartIndicatorClassName} ${item.is_available ? "" : "opacity-60 ring-1 ring-destructive/20"}`}
    >
      {hasSelectedAllergen ? (
        <span className="absolute -right-1 -top-1.5 z-10 text-sm text-amber-300" aria-hidden="true">
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
              <p className="text-base font-semibold">{formatPrice(item.price)}</p>
            </div>
          </div>
        </div>
        {item.image_url ? (
          <div className={menuItemMediaClass}>
            <Image
              alt=""
              className="h-full w-full object-cover"
              height={128}
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
