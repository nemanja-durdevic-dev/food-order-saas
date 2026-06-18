"use client";

import { useState } from "react";
import { Check, ChevronDown, Minus, Plus } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

import type { CartItem, MenuItem, ModifierOption } from "./types";
import { formatPrice } from "./utils";
import { useTranslations } from "./locale-context";

type ItemDetailsDialogProps = {
  decrementCartItem: (itemId: string) => void;
  drinkOptions: MenuItem[];
  editingCartKey: string | null;
  incrementCartItem: (itemId: string) => void;
  isClosing: boolean;
  modalQuantity: number;
  onAddToCart: () => void;
  onClose: () => void;
  onUpdateCartItem: () => void;
  selectedActionPrice: number;
  selectedCartItem: CartItem | undefined;
  selectedCustomizationKey: string;
  selectedDrinkIds: string[];
  selectedExtraIds: string[];
  selectedItem: MenuItem;
  selectedRemovedIngredientIds: string[];
  setModalQuantity: (updater: (currentQuantity: number) => number) => void;
  toggleSelection: (
    value: string,
    setValues: (updater: (currentValues: string[]) => string[]) => void,
  ) => void;
  setSelectedDrinkIds: (updater: (currentValues: string[]) => string[]) => void;
  setSelectedExtraIds: (updater: (currentValues: string[]) => string[]) => void;
  setSelectedRemovedIngredientIds: (updater: (currentValues: string[]) => string[]) => void;
};

export function ItemDetailsDialog({
  decrementCartItem,
  drinkOptions,
  editingCartKey,
  incrementCartItem,
  isClosing,
  modalQuantity,
  onAddToCart,
  onClose,
  onUpdateCartItem,
  selectedActionPrice,
  selectedCartItem,
  selectedCustomizationKey,
  selectedDrinkIds,
  selectedExtraIds,
  selectedItem,
  selectedRemovedIngredientIds,
  setModalQuantity,
  setSelectedDrinkIds,
  setSelectedExtraIds,
  setSelectedRemovedIngredientIds,
  toggleSelection,
}: ItemDetailsDialogProps) {
  const t = useTranslations();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAllergensOpen, setIsAllergensOpen] = useState(false);
  const description = selectedItem.description ?? t("item.description_default");
  const hasLongDescription = description.length > 140;

  return (
    <Modal
      closeLabel={t("common.close")}
      isClosing={isClosing}
      onClose={onClose}
      className="sm:max-h-[90dvh]"
    >
      <div className="no-scrollbar flex-1 overflow-y-auto pb-28">
        <ItemImage item={selectedItem} />
        <div className="p-5 sm:p-6">
          <div>
            {!selectedItem.is_available && (
              <p className="mb-3 rounded-full bg-destructive/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-destructive w-fit">
                {t("item.sold_out")}
              </p>
            )}
            <div>
              <h2 className="text-2xl font-black tracking-tight" id="item-dialog-title">
                {selectedItem.name}
              </h2>
              <p className="mt-2 text-xl font-black">{formatPrice(selectedItem.price)}</p>
            </div>
          </div>
          <div className="mt-4">
            <p
              className={`text-sm leading-6 text-muted-foreground ${
                hasLongDescription && !isDescriptionExpanded ? "line-clamp-3" : ""
              }`}
            >
              {description}
            </p>
            {hasLongDescription ? (
              <button
                className="mt-2 cursor-pointer text-sm font-black text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setIsDescriptionExpanded((isExpanded) => !isExpanded)}
                type="button"
              >
                {isDescriptionExpanded ? t("item.show_less") : t("item.show_more")}
              </button>
            ) : null}
          </div>

          <RemoveIngredientsSection
            ingredients={selectedItem.ingredients}
            selectedRemovedIngredientIds={selectedRemovedIngredientIds}
            setSelectedRemovedIngredientIds={setSelectedRemovedIngredientIds}
            toggleSelection={toggleSelection}
          />

          {selectedItem.addOnOptions.length > 0 ? (
            <OptionList
              description={t("item.add_extras_desc")}
              options={selectedItem.addOnOptions}
              selectedIds={selectedExtraIds}
              setSelectedIds={setSelectedExtraIds}
              title={t("item.add_extras")}
              toggleSelection={toggleSelection}
            />
          ) : null}

          {drinkOptions.length > 0 ? (
            <OptionList
              description={t("item.add_drinks_desc")}
              options={drinkOptions}
              selectedIds={selectedDrinkIds}
              setSelectedIds={setSelectedDrinkIds}
              title={t("item.add_drinks")}
              toggleSelection={toggleSelection}
            />
          ) : null}

          <section className="mt-6 border-t border-border pt-6">
            <button
              aria-expanded={isAllergensOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setIsAllergensOpen((isOpen) => !isOpen)}
              type="button"
            >
              <span>
                <span className="block text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">
                  {t("item.allergens")}
                </span>
                <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                  {t("item.review_allergen")}
                </span>
              </span>
              <ChevronDown
                className={`size-5 shrink-0 text-muted-foreground transition-transform ${
                  isAllergensOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {isAllergensOpen ? (
              selectedItem.allergens.length > 0 ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {selectedItem.allergens.map((allergen) => (
                    <li
                      className="rounded-full border border-border px-3 py-1 text-sm font-semibold text-muted-foreground"
                      key={allergen.id}
                    >
                      {allergen.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {t("item.no_allergens")}
                </p>
              )
            ) : null}
          </section>
        </div>
      </div>
      <div className="absolute inset-x-4 bottom-4 flex justify-center sm:bottom-6 sm:inset-x-6">
        <div className="mx-auto flex w-full items-center justify-center gap-3 sm:gap-4">
          <div className="flex h-14 items-center rounded-md border border-border bg-card/80 backdrop-blur-2xl">
            <Button
              aria-label={`Decrease ${selectedItem.name} quantity`}
              className="size-14 rounded-md"
              onClick={() => {
                if (selectedCartItem) {
                  decrementCartItem(selectedCustomizationKey);
                  if (selectedCartItem.quantity === 1) {
                    onClose();
                  }
                  return;
                }

                setModalQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
              }}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Minus className="size-4" aria-hidden="true" />
            </Button>
            <span className="min-w-10 text-center text-base font-black">
              {selectedCartItem?.quantity ?? modalQuantity}
            </span>
            <Button
              aria-label={`Increase ${selectedItem.name} quantity`}
              className="size-14 rounded-md"
              onClick={() => {
                if (selectedCartItem) {
                  incrementCartItem(selectedCustomizationKey);
                  return;
                }

                setModalQuantity((currentQuantity) => currentQuantity + 1);
              }}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Plus className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <Button
            className="h-14 min-w-0 flex-1 shrink overflow-hidden rounded-md px-6 text-base font-semibold backdrop-blur-2xl"
            disabled={!selectedItem.is_available}
            onClick={editingCartKey ? onUpdateCartItem : onAddToCart}
            type="button"
          >
            <span className="min-w-0 truncate text-center">
              {selectedItem.is_available
                ? editingCartKey
                  ? t("common.update")
                  : t("common.add")
                : t("item.sold_out")}{" "}
              · {formatPrice(selectedActionPrice)}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function ItemImage({ item }: { item: MenuItem }) {
  const t = useTranslations();

  if (!item.image_url) {
    return (
      <div className="grid h-40 w-full place-items-center bg-orange-200 text-xs font-black uppercase tracking-[0.16em] text-secondary-foreground/70 sm:h-56">
        {t("item.image_placeholder")}
      </div>
    );
  }

  return (
    <div className="h-56 w-full overflow-hidden bg-muted sm:h-64">
      <Image
        alt=""
        className="h-full w-full object-cover"
        height={224}
        sizes="(min-width: 640px) 448px, 100vw"
        src={item.image_url}
        width={448}
      />
    </div>
  );
}

function RemoveIngredientsSection({
  ingredients,
  selectedRemovedIngredientIds,
  setSelectedRemovedIngredientIds,
  toggleSelection,
}: Pick<
  ItemDetailsDialogProps,
  "selectedRemovedIngredientIds" | "setSelectedRemovedIngredientIds" | "toggleSelection"
> & {
  ingredients: MenuItem["ingredients"];
}) {
  const t = useTranslations();

  if (ingredients.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">
          {t("item.remove_ingredients")}
        </h3>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{t("item.select_anything")}</p>
      </div>
      <div className="mt-3 space-y-1">
        {ingredients.map((ingredient) => {
          const isSelected = selectedRemovedIngredientIds.includes(ingredient.id);

          return (
            <button
              aria-pressed={isSelected}
              className="flex w-full cursor-pointer items-center justify-between gap-4 py-2 text-left transition-colors hover:text-primary active:scale-[0.98]"
              key={ingredient.id}
              onClick={() => toggleSelection(ingredient.id, setSelectedRemovedIngredientIds)}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-3">
                <CheckIndicator isSelected={isSelected} />
                <span className="min-w-0 font-semibold">
                  {t("item.no_prefix")} {ingredient.name}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function OptionList({
  description,
  options,
  selectedIds,
  setSelectedIds,
  title,
  toggleSelection,
}: {
  description: string;
  options: Array<MenuItem | ModifierOption>;
  selectedIds: string[];
  setSelectedIds: (updater: (currentValues: string[]) => string[]) => void;
  title: string;
  toggleSelection: ItemDetailsDialogProps["toggleSelection"];
}) {
  return (
    <section className="mt-6 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-3 space-y-1">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id);

          return (
            <button
              aria-pressed={isSelected}
              className="flex w-full cursor-pointer items-center justify-between gap-4 py-2 text-left transition-colors hover:text-primary active:scale-[0.98]"
              key={option.id}
              onClick={() => toggleSelection(option.id, setSelectedIds)}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-3">
                <CheckIndicator isSelected={isSelected} />
                <span className="min-w-0 font-semibold">{option.name}</span>
              </span>
              <span className="shrink-0 text-sm font-bold text-muted-foreground">
                + {formatPrice(option.price)}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CheckIndicator({ isSelected }: { isSelected: boolean }) {
  return (
    <span
      className={`grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${
        isSelected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-muted-foreground/30 bg-white text-transparent"
      }`}
    >
      <Check className="size-3.5" aria-hidden="true" />
    </span>
  );
}
