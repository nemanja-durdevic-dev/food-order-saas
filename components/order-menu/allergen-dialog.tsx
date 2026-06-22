"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

import { getAllergenEmoji } from "./allergen-icons";
import { useTranslations } from "./locale-context";
import type { ItemAllergen } from "./types";

type AllergenDialogProps = {
  allergens: ItemAllergen[];
  initialSelectedIds: string[];
  isClosing: boolean;
  isSaving: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
  onSave: (selectedIds: string[]) => void;
  userEmail: string | null;
};

export function AllergenDialog({
  allergens,
  initialSelectedIds,
  isClosing,
  isSaving,
  onClose,
  onOpenAuth,
  onSave,
  userEmail,
}: AllergenDialogProps) {
  const t = useTranslations();
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAllergens = allergens.filter((allergen) =>
    allergen.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  const selectedAllergens = allergens.filter((allergen) => selectedIds.includes(allergen.id));

  function toggle(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((i) => i !== id) : [...current, id],
    );
  }

  function remove(id: string) {
    setSelectedIds((current) => current.filter((i) => i !== id));
  }

  return (
    <Modal closeLabel={t("common.close")} isClosing={isClosing} onClose={onClose}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="px-5 pt-12 sm:px-6 sm:pt-14">
          <h2 className="text-center text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {t("item.allergens")}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-5 text-muted-foreground">
            {t("item.review_allergen")}
          </p>
          <label className="mt-5 flex h-11 items-center gap-2.5 rounded-md border border-border bg-white px-3.5 text-muted-foreground">
            <Search className="size-4" aria-hidden="true" />
            <span className="sr-only">{t("common.search")}</span>
            <input
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("common.search")}
              type="search"
              value={searchQuery}
            />
          </label>
          {selectedAllergens.length > 0 ? (
            <div className="mt-3 flex items-center gap-2 overflow-hidden">
              <div className="no-scrollbar flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
                {selectedAllergens.map((allergen) => (
                  <span
                    className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground"
                    key={allergen.id}
                  >
                    <span aria-hidden="true">{getAllergenEmoji(allergen.name)}</span>
                    <span>{allergen.name}</span>
                    <button
                      aria-label={`${t("cart.remove_item")} ${allergen.name}`}
                      className="rounded-full text-base leading-none transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => remove(allergen.id)}
                      type="button"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <button
                className="shrink-0 text-xs font-semibold text-foreground transition-colors hover:text-muted-foreground"
                onClick={() => setSelectedIds([])}
                type="button"
              >
                {t("item.clear_all_allergens")}
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-5 pb-4 sm:px-6">
          {allergens.length > 0 ? (
            filteredAllergens.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {filteredAllergens.map((allergen) => {
                  const isSelected = selectedIds.includes(allergen.id);

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={cn(
                        "flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border px-1.5 py-2.5 text-center text-[11px] font-bold leading-tight transition-colors sm:min-h-24 sm:px-2.5 sm:py-3 sm:text-sm",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                      )}
                      key={allergen.id}
                      onClick={() => toggle(allergen.id)}
                      type="button"
                    >
                      <span aria-hidden="true" className="text-lg leading-none sm:text-2xl">
                        {getAllergenEmoji(allergen.name)}
                      </span>
                      <span>{allergen.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-sm leading-6 text-muted-foreground">
                {t("item.no_matching_allergens")}
              </p>
            )
          ) : (
            <p className="text-center text-sm leading-6 text-muted-foreground">
              {t("item.no_allergens")}
            </p>
          )}
        </div>

        <div className="space-y-3 bg-white p-5 pt-3 shadow-[0_-16px_30px_rgba(255,255,255,0.95)] sm:p-6 sm:pt-4">
          {!userEmail ? (
            <div className="flex items-center justify-between gap-3 rounded-md bg-muted p-3">
              <p className="text-xs font-medium leading-5 text-foreground sm:text-sm">
                {t("item.log_in_to_save_allergens")}
              </p>
              <Button
                className="h-9 rounded-md px-4"
                onClick={onOpenAuth}
                type="button"
                variant="outline"
              >
                {t("auth.login_button")}
              </Button>
            </div>
          ) : null}
          <Button
            className="h-12 w-full rounded-md text-base font-semibold"
            disabled={isSaving}
            onClick={() => onSave(selectedIds)}
            type="button"
          >
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
