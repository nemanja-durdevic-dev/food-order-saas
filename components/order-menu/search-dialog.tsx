"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "./locale-context";

import { accents } from "./constants";
import { MenuItemCard } from "./menu-category-list";
import type { MenuCategory, MenuItem } from "./types";

type SearchResult = {
  category: MenuCategory;
  item: MenuItem;
};

type SearchDialogProps = {
  getItemCartQuantity: (itemId: string) => number;
  onClose: () => void;
  onSelectResult: (item: MenuItem) => void;
  searchQuery: string;
  searchResults: SearchResult[];
  selectedAllergenIds: string[];
  setSearchQuery: (query: string) => void;
  trimmedSearchQuery: string;
};

export function SearchDialog({
  getItemCartQuantity,
  onClose,
  onSelectResult,
  searchQuery,
  searchResults,
  selectedAllergenIds,
  setSearchQuery,
  trimmedSearchQuery,
}: SearchDialogProps) {
  const t = useTranslations();

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 bg-background sm:hidden" role="dialog">
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-white">
        <div className="border-b border-border px-4 py-3">
          <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-card px-4 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Search className="size-5 text-muted-foreground" aria-hidden="true" />
            <input
              aria-label={t("search.aria_label")}
              autoFocus
              className="min-w-0 flex-1 appearance-none bg-transparent text-base font-semibold text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
              id="menu-search"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("search.placeholder")}
              type="search"
              value={searchQuery}
            />
            <Button
              aria-label={t("common.close")}
              className="-mr-2 size-9 shrink-0"
              onClick={onClose}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {searchResults.length > 0 ? (
            searchResults.map(({ item }, index) => (
              <MenuItemCard
                item={item}
                itemCartQuantity={getItemCartQuantity(item.id)}
                key={item.id}
                onOpenItemDetails={onSelectResult}
                placeholderAccent={accents[index % accents.length]}
                selectedAllergenIds={selectedAllergenIds}
              />
            ))
          ) : (
            <div className="rounded-2xl bg-card p-5 text-sm font-semibold text-muted-foreground">
              {trimmedSearchQuery ? t("search.no_results") : t("search.search_prompt")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
