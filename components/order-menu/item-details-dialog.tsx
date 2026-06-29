"use client";

import { useState } from "react";
import { Check, ChevronDown, Minus, Plus } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

import type { CartItem, MenuItem, OptionGroup } from "./types";
import { formatPrice } from "./utils";
import { useTranslations } from "./locale-context";

type ItemDetailsDialogProps = {
  currency: string;
  decrementCartItem: (itemId: string) => void;
  editingCartKey: string | null;
  incrementCartItem: (itemId: string) => void;
  isClosing: boolean;
  modalQuantity: number;
  onAddToCart: () => void;
  onClose: () => void;
  onUpdateCartItem: () => void;
  onGroupSelection: (groupId: string, choiceId: string) => void;
  selectedActionPrice: number;
  selectedCartItem: CartItem | undefined;
  selectedChoicesByGroup: Record<string, string[]>;
  selectedCustomizationKey: string;
  selectedItem: MenuItem;
  setModalQuantity: (updater: (currentQuantity: number) => number) => void;
};

export function ItemDetailsDialog({
  currency,
  decrementCartItem,
  editingCartKey,
  incrementCartItem,
  isClosing,
  modalQuantity,
  onAddToCart,
  onClose,
  onUpdateCartItem,
  onGroupSelection,
  selectedActionPrice,
  selectedCartItem,
  selectedChoicesByGroup,
  selectedCustomizationKey,
  selectedItem,
  setModalQuantity,
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
              <p className="mt-2 text-xl font-black">{formatPrice(selectedItem.price, currency)}</p>
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

          {selectedItem.optionGroups.map((group) => (
            <OptionGroupSection
              currency={currency}
              group={group}
              key={group.id}
              onSelect={onGroupSelection}
              selectedChoiceIds={selectedChoicesByGroup[group.id] ?? []}
            />
          ))}

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
              · {formatPrice(selectedActionPrice, currency)}
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
      <div className="grid h-40 w-full place-items-center bg-secondary text-xs font-black uppercase tracking-[0.16em] text-secondary-foreground/70 sm:h-56">
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

function OptionGroupSection({
  currency,
  group,
  onSelect,
  selectedChoiceIds,
}: {
  currency: string;
  group: OptionGroup;
  onSelect: (groupId: string, choiceId: string) => void;
  selectedChoiceIds: string[];
}) {
  const t = useTranslations();

  return (
    <section className="mt-6 border-t border-border pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">
            {group.name}
            {group.isRequired ? (
              <span className="ml-1 text-destructive" aria-label={t("item.required")}>
                *
              </span>
            ) : null}
          </h3>
          {group.description ? (
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{group.description}</p>
          ) : null}
        </div>
        {group.isRequired && selectedChoiceIds.length < group.minSelect ? (
          <span className="shrink-0 text-xs font-semibold text-destructive">
            {t("item.required_selection")}
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-1">
        {group.choices.map((choice) => {
          const isSelected = selectedChoiceIds.includes(choice.id);

          return (
            <button
              aria-pressed={isSelected}
              className="flex w-full cursor-pointer items-center justify-between gap-4 py-2 text-left transition-colors hover:text-primary active:scale-[0.98]"
              key={choice.id}
              onClick={() => onSelect(group.id, choice.id)}
              type="button"
            >
              <span className="flex min-w-0 items-center gap-3">
                {group.isMultiSelect ? (
                  <CheckIndicator isSelected={isSelected} />
                ) : (
                  <RadioIndicator isSelected={isSelected} />
                )}
                <span className="min-w-0 font-semibold">{choice.name}</span>
              </span>
              {choice.priceModifierType !== "neutral" && choice.priceModifier > 0 ? (
                <span
                  className={`shrink-0 text-sm font-bold ${
                    choice.priceModifierType === "increase"
                      ? "text-muted-foreground"
                      : "text-green-600"
                  }`}
                >
                  {choice.priceModifierType === "increase" ? "+ " : "- "}
                  {formatPrice(choice.priceModifier, currency)}
                </span>
              ) : null}
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

function RadioIndicator({ isSelected }: { isSelected: boolean }) {
  return (
    <span
      className={`grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${
        isSelected ? "border-primary bg-primary" : "border-muted-foreground/30 bg-white"
      }`}
    >
      {isSelected ? (
        <span className="size-2 rounded-full bg-primary-foreground" aria-hidden="true" />
      ) : null}
    </span>
  );
}
