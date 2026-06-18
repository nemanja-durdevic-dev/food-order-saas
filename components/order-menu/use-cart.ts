"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { CartItem, Location, MenuCategory, MenuItem, ModifierOption } from "./types";
import { getCustomizationKey, getCustomizedPrice, getPriceValue } from "./utils";
import { readStoredCart, writeStoredCart } from "./storage";

function getCartItemsFromStorage(categories: MenuCategory[]): Record<string, CartItem> {
  const storedItems = readStoredCart();

  if (storedItems.length === 0) {
    return {};
  }

  const menuItemsById = new Map(
    categories.flatMap((category) => category.menu_items.map((item) => [item.id, item] as const)),
  );
  const drinkItemsById = new Map(
    categories
      .filter((category) => /drink|drikke|brus|soda/i.test(category.name))
      .flatMap((category) => category.menu_items.map((item) => [item.id, item] as const)),
  );
  const extraItemsById = new Map(
    categories.flatMap((category) =>
      category.menu_items.flatMap((item) =>
        item.addOnOptions.map((extra) => [extra.id, extra] as const),
      ),
    ),
  );

  return storedItems.reduce<Record<string, CartItem>>((cartItems, storedItem) => {
    const item = menuItemsById.get(storedItem.itemId);

    if (!item) {
      return cartItems;
    }

    const drinkItems = storedItem.drinkIds.flatMap((drinkId) => {
      const drink = drinkItemsById.get(drinkId);

      return drink ? [drink] : [];
    });
    const extraItems = storedItem.extraIds.flatMap((extraId) => {
      const extra = extraItemsById.get(extraId);

      return extra ? [extra] : [];
    });
    const cartKey = getCustomizationKey(
      item.id,
      storedItem.removedIngredientNames,
      extraItems.map((extra) => extra.id),
      drinkItems.map((drink) => drink.id),
    );

    cartItems[cartKey] = {
      ...item,
      basePrice: item.price,
      cartKey,
      drinkItems,
      extraItems,
      price: getCustomizedPrice(item, extraItems, drinkItems),
      quantity: (cartItems[cartKey]?.quantity ?? 0) + storedItem.quantity,
      removedIngredients: storedItem.removedIngredientNames,
    };

    return cartItems;
  }, {});
}

export type CartState = {
  cartItemsById: Record<string, CartItem>;
  cartItems: CartItem[];
  cartQuantity: number;
  cartSubtotal: number;
  editingCartKey: string | null;
  selectedItem: MenuItem | null;
  selectedDrinkIds: string[];
  selectedExtraIds: string[];
  selectedRemovedIngredientIds: string[];
  modalQuantity: number;
  drinkOptions: MenuItem[];
  selectedRemovedIngredientNames: string[];
  selectedExtraOptions: ModifierOption[];
  selectedDrinkOptions: MenuItem[];
  selectedCustomizationKey: string;
  selectedCartItem: CartItem | undefined;
  selectedUnitPrice: number;
  selectedActionPrice: number;
  hasHydratedCartRef: React.RefObject<boolean>;
  setCartItemsById: React.Dispatch<React.SetStateAction<Record<string, CartItem>>>;
  setEditingCartKey: (key: string | null) => void;
  setModalQuantity: React.Dispatch<React.SetStateAction<number>>;
  setSelectedDrinkIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedExtraIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedRemovedIngredientIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedItem: (item: MenuItem | null) => void;
  addToCart: (
    item: MenuItem,
    options?: {
      drinkItems?: MenuItem[];
      extraItems?: ModifierOption[];
      quantity?: number;
      removedIngredientNames?: string[];
    },
  ) => void;
  updateCartItem: (
    item: MenuItem,
    options: {
      drinkItems: MenuItem[];
      extraItems: ModifierOption[];
      removedIngredientNames: string[];
    },
  ) => void;
  decrementCartItem: (itemId: string) => void;
  incrementCartItem: (itemId: string) => void;
  removeCartItem: (itemId: string) => void;
  getItemCartQuantity: (itemId: string) => number;
  toggleSelection: (
    value: string,
    setValues: (updater: (currentValues: string[]) => string[]) => void,
  ) => void;
  clearCart: () => void;
  openItemDetails: (item: MenuItem) => void;
  openCartItemDetails: (item: CartItem) => void;
};

export function useCart(
  selectedCategories: MenuCategory[],
  selectedLocation: Location | undefined,
): CartState {
  const [cartItemsById, setCartItemsById] = useState<Record<string, CartItem>>({});
  const [editingCartKey, setEditingCartKey] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedDrinkIds, setSelectedDrinkIds] = useState<string[]>([]);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [selectedRemovedIngredientIds, setSelectedRemovedIngredientIds] = useState<string[]>([]);
  const [modalQuantity, setModalQuantity] = useState(1);
  const hasHydratedCartRef = useRef(false);
  const hasSkippedInitialCartPersistRef = useRef(false);

  const drinkOptions = useMemo(
    () =>
      selectedCategories.flatMap((category) =>
        /drink|drikke|brus|soda/i.test(category.name) ? category.menu_items : [],
      ),
    [selectedCategories],
  );

  const cartItems = Object.values(cartItemsById);
  const cartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (total, item) => total + getPriceValue(item.price) * item.quantity,
    0,
  );

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
    ? cartItemsById[selectedCustomizationKey]
    : undefined;
  const selectedUnitPrice = selectedItem
    ? getCustomizedPrice(selectedItem, selectedExtraOptions, selectedDrinkOptions)
    : 0;
  const selectedActionPrice =
    selectedCartItem || editingCartKey ? selectedUnitPrice : selectedUnitPrice * modalQuantity;

  // Hydrate cart from localStorage when location is selected
  useEffect(() => {
    if (!selectedLocation || hasHydratedCartRef.current) {
      return;
    }

    const hydrationTimeoutId = window.setTimeout(() => {
      hasHydratedCartRef.current = true;
      setCartItemsById(getCartItemsFromStorage(selectedCategories));
    }, 0);

    return () => {
      window.clearTimeout(hydrationTimeoutId);
    };
  }, [selectedCategories, selectedLocation]);

  // Persist cart to localStorage
  useEffect(() => {
    if (!hasHydratedCartRef.current) {
      return;
    }

    if (!hasSkippedInitialCartPersistRef.current) {
      hasSkippedInitialCartPersistRef.current = true;
      return;
    }

    writeStoredCart(Object.values(cartItemsById));
  }, [cartItemsById]);

  function addToCart(
    item: MenuItem,
    options: {
      drinkItems?: MenuItem[];
      extraItems?: ModifierOption[];
      quantity?: number;
      removedIngredientNames?: string[];
    } = {},
  ) {
    const drinkItems = options.drinkItems ?? [];
    const extraItems = options.extraItems ?? [];
    const quantity = options.quantity ?? 1;
    const removedIngredientNames = options.removedIngredientNames ?? [];
    const cartKey = getCustomizationKey(
      item.id,
      removedIngredientNames,
      extraItems.map((extra) => extra.id),
      drinkItems.map((drink) => drink.id),
    );

    setCartItemsById((currentItems) => ({
      ...currentItems,
      [cartKey]: {
        ...item,
        basePrice: item.price,
        cartKey,
        drinkItems,
        extraItems,
        price: getCustomizedPrice(item, extraItems, drinkItems),
        quantity: (currentItems[cartKey]?.quantity ?? 0) + quantity,
        removedIngredients: removedIngredientNames,
      },
    }));
  }

  function updateCartItem(
    item: MenuItem,
    options: {
      drinkItems: MenuItem[];
      extraItems: ModifierOption[];
      removedIngredientNames: string[];
    },
  ) {
    const cartKey = getCustomizationKey(
      item.id,
      options.removedIngredientNames,
      options.extraItems.map((extra) => extra.id),
      options.drinkItems.map((drink) => drink.id),
    );

    setCartItemsById((currentItems) => {
      const currentItem = editingCartKey ? currentItems[editingCartKey] : undefined;

      if (!currentItem) {
        return currentItems;
      }

      const remainingItems = { ...currentItems };
      delete remainingItems[editingCartKey!];

      return {
        ...remainingItems,
        [cartKey]: {
          ...item,
          basePrice: item.price,
          cartKey,
          drinkItems: options.drinkItems,
          extraItems: options.extraItems,
          price: getCustomizedPrice(item, options.extraItems, options.drinkItems),
          quantity: currentItem.quantity + (remainingItems[cartKey]?.quantity ?? 0),
          removedIngredients: options.removedIngredientNames,
        },
      };
    });
  }

  function decrementCartItem(itemId: string) {
    setCartItemsById((currentItems) => {
      const currentItem = currentItems[itemId];

      if (!currentItem) {
        return currentItems;
      }

      if (currentItem.quantity === 1) {
        const remainingItems = { ...currentItems };
        delete remainingItems[itemId];

        return remainingItems;
      }

      return {
        ...currentItems,
        [itemId]: {
          ...currentItem,
          quantity: currentItem.quantity - 1,
        },
      };
    });
  }

  function incrementCartItem(itemId: string) {
    setCartItemsById((currentItems) => {
      const currentItem = currentItems[itemId];

      if (!currentItem) {
        return currentItems;
      }

      return {
        ...currentItems,
        [itemId]: {
          ...currentItem,
          quantity: currentItem.quantity + 1,
        },
      };
    });
  }

  function removeCartItem(itemId: string) {
    setCartItemsById((currentItems) => {
      if (!currentItems[itemId]) {
        return currentItems;
      }

      const remainingItems = { ...currentItems };
      delete remainingItems[itemId];

      return remainingItems;
    });
  }

  function getItemCartQuantity(itemId: string) {
    return cartItems.reduce((total, item) => total + (item.id === itemId ? item.quantity : 0), 0);
  }

  function toggleSelection(
    value: string,
    setValues: (updater: (currentValues: string[]) => string[]) => void,
  ) {
    setValues((currentValues) =>
      currentValues.includes(value)
        ? currentValues.filter((currentValue) => currentValue !== value)
        : [...currentValues, value],
    );
  }

  function clearCart() {
    setCartItemsById({});
  }

  function openItemDetails(item: MenuItem) {
    setEditingCartKey(null);
    setModalQuantity(1);
    setSelectedDrinkIds([]);
    setSelectedExtraIds([]);
    setSelectedRemovedIngredientIds([]);
    setSelectedItem(item);
  }

  function openCartItemDetails(item: CartItem) {
    setEditingCartKey(item.cartKey);
    setModalQuantity(item.quantity);
    setSelectedDrinkIds(item.drinkItems.map((drink) => drink.id));
    setSelectedExtraIds(item.extraItems.map((extra) => extra.id));
    setSelectedRemovedIngredientIds(
      item.ingredients
        .filter((ingredient) => item.removedIngredients.includes(ingredient.name))
        .map((ingredient) => ingredient.id),
    );
    setSelectedItem({
      availableLocationIds: item.availableLocationIds,
      addOnOptions: item.addOnOptions,
      allergens: item.allergens,
      description: item.description,
      id: item.id,
      ingredients: item.ingredients,
      is_available: item.is_available,
      image_url: item.image_url,
      name: item.name,
      price: item.basePrice,
    });
  }

  return {
    cartItemsById,
    setCartItemsById,
    cartItems,
    cartQuantity,
    cartSubtotal,
    editingCartKey,
    setEditingCartKey,
    selectedItem,
    setSelectedItem,
    selectedDrinkIds,
    setSelectedDrinkIds,
    selectedExtraIds,
    setSelectedExtraIds,
    selectedRemovedIngredientIds,
    setSelectedRemovedIngredientIds,
    modalQuantity,
    setModalQuantity,
    drinkOptions,
    selectedRemovedIngredientNames,
    selectedExtraOptions,
    selectedDrinkOptions,
    selectedCustomizationKey,
    selectedCartItem,
    selectedUnitPrice,
    selectedActionPrice,
    hasHydratedCartRef,
    addToCart,
    updateCartItem,
    decrementCartItem,
    incrementCartItem,
    removeCartItem,
    getItemCartQuantity,
    toggleSelection,
    clearCart,
    openItemDetails,
    openCartItemDetails,
  };
}
