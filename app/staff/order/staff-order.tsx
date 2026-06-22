"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Minus, PackageOpen, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-browser";
import { ItemDetailsDialog } from "@/components/order-menu/item-details-dialog";
import type { MenuCategory, MenuItem, ModifierOption } from "@/components/order-menu/types";
import {
  formatPrice,
  getCartCustomizationLabels,
  getCustomizationKey,
  getCustomizedPrice,
} from "@/components/order-menu/utils";
import { Button } from "@/components/ui/button";

type StaffOrderProps = {
  categories: MenuCategory[];
  locationId: string;
  locationName: string;
};

type CartEntry = {
  item: MenuItem;
  quantity: number;
  removedIngredientNames: string[];
  extraItems: ModifierOption[];
  drinkItems: MenuItem[];
  cartKey: string;
  unitPrice: number;
};

const noopTranslator = (_key: string, _params?: Record<string, string | number>) => "";

export function StaffOrder({ categories, locationId, locationName }: StaffOrderProps) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [isPlacing, setIsPlacing] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const supabase = createClient();
  const cartRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const programmaticScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dialog state
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedDrinkIds, setSelectedDrinkIds] = useState<string[]>([]);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [selectedRemovedIngredientIds, setSelectedRemovedIngredientIds] = useState<string[]>([]);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [isDialogClosing, setIsDialogClosing] = useState(false);
  const [editingCartKey, setEditingCartKey] = useState<string | null>(null);

  const drinkOptions = categories
    .filter((cat) => /drink|drikke|brus|soda/i.test(cat.name))
    .flatMap((cat) => cat.menu_items);

  const cartQuantity = cart.reduce((sum, entry) => sum + entry.quantity, 0);
  const cartSubtotal = cart.reduce((sum, entry) => sum + entry.unitPrice * entry.quantity, 0);

  const selectedRemovedIngredientNames = (selectedItem?.ingredients ?? [])
    .filter((ingredient) => selectedRemovedIngredientIds.includes(ingredient.id))
    .map((ingredient) => ingredient.name);

  const selectedExtraOptions =
    selectedItem?.addOnOptions.filter((option) => selectedExtraIds.includes(option.id)) ?? [];

  const selectedDrinkOptions = drinkOptions.filter((drink) => selectedDrinkIds.includes(drink.id));

  const selectedCustomizationKey = selectedItem
    ? getCustomizationKey(
        selectedItem.id,
        selectedRemovedIngredientNames,
        selectedExtraIds,
        selectedDrinkIds,
      )
    : "";

  const selectedCartItem = selectedCustomizationKey
    ? cart.find((entry) => entry.cartKey === selectedCustomizationKey)
    : undefined;

  const selectedUnitPrice = selectedItem
    ? getCustomizedPrice(selectedItem, selectedExtraOptions, selectedDrinkOptions)
    : 0;

  const selectedActionPrice =
    editingCartKey || selectedCartItem ? selectedUnitPrice : selectedUnitPrice * modalQuantity;

  const toggleSelection = useCallback(
    (value: string, setValues: (updater: (currentValues: string[]) => string[]) => void) => {
      setValues((prev) =>
        prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
      );
    },
    [],
  );

  // Scroll spy — auto-highlight category based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScrollTimeoutRef.current) return;

        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .toSorted((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        const categoryId = visibleEntry?.target.getAttribute("data-category-id");
        if (categoryId) setActiveCategoryId(categoryId);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );

    for (const cat of categories) {
      const el = categoryRefs.current[cat.id];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [categories]);

  // Auto-scroll category pill nav
  useEffect(() => {
    categoryButtonRefs.current[activeCategoryId]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeCategoryId]);

  function scrollToCategory(categoryId: string) {
    if (programmaticScrollTimeoutRef.current) {
      clearTimeout(programmaticScrollTimeoutRef.current);
    }

    programmaticScrollTimeoutRef.current = setTimeout(() => {
      programmaticScrollTimeoutRef.current = null;
      setActiveCategoryId(categoryId);
    }, 800);

    setActiveCategoryId(categoryId);
    categoryRefs.current[categoryId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function openItemDialog(item: MenuItem) {
    setSelectedItem(item);
    setSelectedDrinkIds([]);
    setSelectedExtraIds([]);
    setSelectedRemovedIngredientIds([]);
    setModalQuantity(1);
    setEditingCartKey(null);
    setIsDialogClosing(false);
  }

  function closeItemDialog() {
    setIsDialogClosing(true);
    setTimeout(() => {
      setSelectedItem(null);
      setIsDialogClosing(false);
    }, 200);
  }

  function addToCart(
    item: MenuItem,
    options: {
      drinkItems?: MenuItem[];
      extraItems?: ModifierOption[];
      removedIngredientNames?: string[];
      quantity?: number;
    } = {},
  ) {
    const quantity = options.quantity ?? 1;
    const removedIngredientNames = options.removedIngredientNames ?? [];
    const extraItems = options.extraItems ?? [];
    const drinkItems = options.drinkItems ?? [];
    const cartKey = getCustomizationKey(
      item.id,
      removedIngredientNames,
      extraItems.map((e) => e.id),
      drinkItems.map((d) => d.id),
    );
    const unitPrice = getCustomizedPrice(item, extraItems, drinkItems);

    setCart((prev) => {
      // If we're editing an existing cart entry, replace it
      if (editingCartKey) {
        return prev
          .map((entry) =>
            entry.cartKey === editingCartKey
              ? {
                  ...entry,
                  item,
                  quantity,
                  removedIngredientNames,
                  extraItems,
                  drinkItems,
                  cartKey,
                  unitPrice,
                }
              : entry,
          )
          .filter((entry) => entry.quantity > 0);
      }

      const existing = prev.find((entry) => entry.cartKey === cartKey);
      if (existing) {
        return prev.map((entry) =>
          entry.cartKey === cartKey ? { ...entry, quantity: entry.quantity + quantity } : entry,
        );
      }
      return [
        ...prev,
        { item, quantity, removedIngredientNames, extraItems, drinkItems, cartKey, unitPrice },
      ];
    });

    if (selectedItem) closeItemDialog();
  }

  function quickAdd(item: MenuItem) {
    addToCart(item);
  }

  function defaultCartKey(item: MenuItem) {
    return getCustomizationKey(item.id, [], [], []);
  }

  function quickDecrement(item: MenuItem) {
    const key = defaultCartKey(item);
    decrement(key);
  }

  function quickIncrement(item: MenuItem) {
    const key = defaultCartKey(item);
    const existing = cart.find((e) => e.cartKey === key);
    if (existing) {
      increment(key);
    } else {
      quickAdd(item);
    }
  }

  function decrement(cartKey: string) {
    setCart((prev) => {
      const existing = prev.find((e) => e.cartKey === cartKey);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((e) => e.cartKey !== cartKey);
      }
      return prev.map((e) => (e.cartKey === cartKey ? { ...e, quantity: e.quantity - 1 } : e));
    });
  }

  function increment(cartKey: string) {
    setCart((prev) =>
      prev.map((e) => (e.cartKey === cartKey ? { ...e, quantity: e.quantity + 1 } : e)),
    );
  }

  function clearCart() {
    setCart([]);
  }

  function handleAddToCart() {
    if (!selectedItem) return;
    addToCart(selectedItem, {
      drinkItems: selectedDrinkOptions,
      extraItems: selectedExtraOptions,
      removedIngredientNames: selectedRemovedIngredientNames,
      quantity: modalQuantity,
    });
  }

  function handleUpdateCartItem() {
    if (!selectedItem) return;
    addToCart(selectedItem, {
      drinkItems: selectedDrinkOptions,
      extraItems: selectedExtraOptions,
      removedIngredientNames: selectedRemovedIngredientNames,
      quantity: selectedCartItem?.quantity,
    });
  }

  async function placeOrder() {
    if (cart.length === 0) return;
    setIsPlacing(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast.error("Not authenticated");
        return;
      }

      const body = {
        cartItems: cart.map((entry) => ({
          id: entry.item.id,
          name: entry.item.name,
          quantity: entry.quantity,
          unitPrice: entry.unitPrice,
          total: entry.unitPrice * entry.quantity,
          removedIngredients: entry.removedIngredientNames,
          addOns: entry.extraItems.map((e) => ({ id: e.id, name: e.name, price: e.price })),
          drinks: entry.drinkItems.map((d) => ({ id: d.id, name: d.name, price: Number(d.price) })),
        })),
        locationId,
        subtotal: cartSubtotal,
      };

      const res = await fetch("/api/staff/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to place order");
      }

      toast.success(`Order #${data.order_code} placed`);
      setCart([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setIsPlacing(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 gap-6">
      {/* Menu items area */}
      <div className="flex min-w-0 flex-1 flex-col min-h-0">
        {/* Category pills */}
        <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-background pb-4 [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <button
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                cat.id === activeCategoryId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              type="button"
              ref={(el) => {
                categoryButtonRefs.current[cat.id] = el;
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Item grid — all categories, scroll spy highlights pills */}
        <div className="flex-1 overflow-y-auto min-h-0 pb-24 [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <section
              className="mb-6"
              data-category-id={cat.id}
              key={cat.id}
              ref={(el) => {
                categoryRefs.current[cat.id] = el;
              }}
            >
              <h2 className="mb-3 text-lg font-bold tracking-tight">{cat.name}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {cat.menu_items.map((item) => {
                  const totalInCart = cart
                    .filter((e) => e.item.id === item.id)
                    .reduce((sum, e) => sum + e.quantity, 0);
                  return (
                    <ItemCard
                      inCartQuantity={totalInCart}
                      item={item}
                      key={item.id}
                      onCustomize={() => openItemDialog(item)}
                      onDecrement={() => quickDecrement(item)}
                      onIncrement={() => quickIncrement(item)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
          {categories.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">No items.</p>
          )}
        </div>
      </div>

      {/* Mobile cart toggle */}
      <button
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg lg:hidden"
        onClick={() => setShowCart(true)}
        type="button"
      >
        <ShoppingBasket className="size-4" />
        {cartQuantity > 0 && <span>{cartQuantity}</span>}
      </button>

      {/* Cart sidebar */}
      <div
        className={`fixed inset-0 z-50 flex flex-col bg-white lg:sticky lg:top-6 lg:z-auto lg:w-80 lg:shrink-0 lg:border-l lg:border-border lg:bg-transparent lg:h-[calc(100dvh-3rem)] ${
          showCart ? "flex" : "hidden lg:flex"
        }`}
        ref={cartRef}
      >
        {/* Mobile cart header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
          <h3 className="font-bold">Cart</h3>
          <button
            className="text-sm text-muted-foreground"
            onClick={() => setShowCart(false)}
            type="button"
          >
            Close
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center gap-3 pt-12 text-center text-muted-foreground">
              <PackageOpen className="size-10" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">Tap items to add them</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((entry) => {
                const labels = getCartCustomizationLabels(
                  {
                    ...entry.item,
                    basePrice: entry.item.price,
                    cartKey: entry.cartKey,
                    drinkItems: entry.drinkItems,
                    extraItems: entry.extraItems,
                    quantity: entry.quantity,
                    removedIngredients: entry.removedIngredientNames,
                    price: entry.unitPrice,
                  } as never,
                  noopTranslator,
                );

                return (
                  <div
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                    key={entry.cartKey}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.item.name}</p>
                      {labels.length > 0 && (
                        <p className="truncate text-xs text-muted-foreground">
                          {labels.join(", ")}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(entry.unitPrice)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                        onClick={() => decrement(entry.cartKey)}
                        type="button"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-semibold">
                        {entry.quantity}
                      </span>
                      <button
                        className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
                        onClick={() => increment(entry.cartKey)}
                        type="button"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <p className="w-16 text-right text-sm font-semibold">
                      {formatPrice(entry.unitPrice * entry.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart footer */}
        {cart.length > 0 && (
          <div className="border-t border-border p-4">
            <div className="mb-4 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{formatPrice(cartSubtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{locationName}</p>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={isPlacing}
                onClick={placeOrder}
                size="lg"
                type="button"
              >
                {isPlacing ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ShoppingBasket className="mr-2 size-4" />
                )}
                Place Order
              </Button>
              <Button
                className="shrink-0"
                disabled={isPlacing}
                onClick={clearCart}
                size="lg"
                type="button"
                variant="outline"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Customization dialog */}
      {selectedItem ? (
        <ItemDetailsDialog
          decrementCartItem={(key) => decrement(key)}
          drinkOptions={drinkOptions}
          editingCartKey={editingCartKey}
          incrementCartItem={(key) => increment(key)}
          isClosing={isDialogClosing}
          modalQuantity={modalQuantity}
          onAddToCart={handleAddToCart}
          onClose={closeItemDialog}
          onUpdateCartItem={handleUpdateCartItem}
          selectedActionPrice={selectedActionPrice}
          selectedCartItem={
            selectedCartItem
              ? ({
                  ...selectedCartItem.item,
                  basePrice: selectedCartItem.item.price,
                  cartKey: selectedCartItem.cartKey,
                  drinkItems: selectedCartItem.drinkItems,
                  extraItems: selectedCartItem.extraItems,
                  quantity: selectedCartItem.quantity,
                  removedIngredients: selectedCartItem.removedIngredientNames,
                  price: selectedCartItem.unitPrice,
                } as never)
              : undefined
          }
          selectedCustomizationKey={selectedCustomizationKey}
          selectedDrinkIds={selectedDrinkIds}
          selectedExtraIds={selectedExtraIds}
          selectedItem={selectedItem}
          selectedRemovedIngredientIds={selectedRemovedIngredientIds}
          setModalQuantity={setModalQuantity}
          setSelectedDrinkIds={setSelectedDrinkIds}
          setSelectedExtraIds={setSelectedExtraIds}
          setSelectedRemovedIngredientIds={setSelectedRemovedIngredientIds}
          toggleSelection={toggleSelection}
        />
      ) : null}
    </div>
  );
}

function ItemCard({
  item,
  onCustomize,
  onDecrement,
  onIncrement,
  inCartQuantity,
}: {
  item: MenuItem;
  onCustomize: () => void;
  onDecrement: () => void;
  onIncrement: () => void;
  inCartQuantity: number;
}) {
  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm ${item.is_available ? "" : "opacity-50"}`}
    >
      <button
        className="cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        disabled={!item.is_available}
        onClick={item.is_available ? onCustomize : undefined}
        type="button"
      >
        <div className="relative">
          {item.image_url ? (
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                src={item.image_url}
              />
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-muted text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
              {item.name.charAt(0)}
            </div>
          )}
          {item.is_available ? null : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-destructive px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Sold out
              </span>
            </div>
          )}
        </div>
        <div className="p-3 pb-0">
          <h3 className="text-sm font-semibold leading-tight">{item.name}</h3>
          {item.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
          )}
        </div>
      </button>
      <div className="flex items-center justify-between p-3 pt-2">
        <span className="text-sm font-bold">{formatPrice(item.price)}</span>
        {inCartQuantity > 0 ? (
          <div className="flex items-center gap-1">
            <button
              className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs"
              onClick={onDecrement}
              type="button"
            >
              <Minus className="size-3" />
            </button>
            <span className="min-w-[1.5rem] text-center text-sm font-semibold">
              {inCartQuantity}
            </span>
            <button
              className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs"
              disabled={!item.is_available}
              onClick={onIncrement}
              type="button"
            >
              <Plus className="size-3" />
            </button>
          </div>
        ) : (
          <button
            className="flex h-7 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            disabled={!item.is_available}
            onClick={onIncrement}
            type="button"
          >
            <Plus className="size-3" />
            Add
          </button>
        )}
      </div>
    </div>
  );
}
