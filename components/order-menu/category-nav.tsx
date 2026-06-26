"use client";

import { Search, X } from "lucide-react";
import type { RefObject } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "./locale-context";

import type { MenuCategory, MenuSubcategory } from "./types";

type CategoryNavProps = {
  categoryButtonRefs: RefObject<Record<string, HTMLButtonElement | null>>;
  categories: MenuCategory[];
  navRef: RefObject<HTMLElement | null>;
  onOpenSearch: () => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectSubcategory: (subcategoryId: string) => void;
  visibleActiveCategoryId: string;
  visibleActiveSubcategoryId: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  subcategories: MenuSubcategory[];
  subcategoryButtonRefs: RefObject<Record<string, HTMLButtonElement | null>>;
};

export function CategoryNav({
  categoryButtonRefs,
  categories,
  navRef,
  onOpenSearch,
  onSelectCategory,
  onSelectSubcategory,
  visibleActiveCategoryId,
  visibleActiveSubcategoryId,
  searchQuery,
  setSearchQuery,
  subcategories,
  subcategoryButtonRefs,
}: CategoryNavProps) {
  const t = useTranslations();

  return (
    <nav
      aria-label={t("general.menu_categories")}
      className="sticky top-0 z-20 -mx-4 mb-6 overflow-hidden border-b border-border bg-white py-3 sm:-mx-6 lg:-mx-8"
      ref={navRef}
    >
      <div className="flex items-center gap-2 px-4 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-1 sm:hidden">
          <Button
            aria-label={t("common.search")}
            className="size-9 px-0 text-black/70"
            onClick={onOpenSearch}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Search className="size-6" aria-hidden="true" />
          </Button>
          <div aria-hidden="true" className="h-6 w-px bg-black/70" />
        </div>
        <div className="hidden sm:block sm:shrink-0">
          <div className="flex h-9 w-48 items-center gap-2 rounded-md border border-border bg-card px-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              aria-label={t("search.aria_label")}
              className="min-w-0 flex-1 appearance-none bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("search.placeholder")}
              type="search"
              value={searchQuery}
            />
            {searchQuery ? (
              <button
                aria-label={t("common.close")}
                className="-mr-1 flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
                type="button"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
        <div aria-hidden="true" className="hidden h-6 w-px bg-black/70 sm:block" />
        <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto">
          <div className="flex w-max items-center gap-2">
            {categories.map((category) => (
              <Button
                className="px-5 font-semibold"
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                ref={(element) => {
                  categoryButtonRefs.current[category.id] = element;
                }}
                type="button"
                variant={category.id === visibleActiveCategoryId ? "default" : "ghost"}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
      {subcategories.length > 0 ? (
        <div className="mt-3 border-t border-border px-4 pt-3 sm:px-6 lg:px-8">
          <div className="no-scrollbar overflow-x-auto">
            <div className="flex w-max items-center gap-2">
              {subcategories.map((subcategory) => (
                <Button
                  className="px-5 font-semibold"
                  key={subcategory.id}
                  onClick={() => onSelectSubcategory(subcategory.id)}
                  ref={(element) => {
                    subcategoryButtonRefs.current[subcategory.id] = element;
                  }}
                  type="button"
                  variant={subcategory.id === visibleActiveSubcategoryId ? "default" : "ghost"}
                >
                  {subcategory.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
