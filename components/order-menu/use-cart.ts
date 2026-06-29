"use client";

import { useEffect, useRef, useState } from "react";

import type { CartItem, Location, MenuCategory, MenuItem, SelectedOption } from "./types";
import { getChoiceById } from "./storage";
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
  const choicesByItemId = new Map<string, ReturnType<typeof getChoiceById>>();
  for (const item of menuItemsById.values()) {
    choicesByItemId.set(item.id, getChoiceById(item.optionGroups));
  }

  return storedItems.reduce<Record<string, CartItem>>((cartItems, storedItem) => {
    const item = menuItemsById.get(storedItem.itemId);

    if (!item) {
      return cartItems;
    }

    const choiceMap = choicesByItemId.get(item.id) ?? new Map();
    const selectedOptions: SelectedOption[] = [];

    for (const choiceId of storedItem.selectedOptionIds) {
      const found = choiceMap.get(choiceId);
      if (found) {
        selectedOptions.push({
          groupId: found.group.id,
          groupName: found.group.name,
          choiceId: found.choice.id,
          choiceName: found.choice.name,
          priceModifierType: found.choice.priceModifierType,
          priceModifier: found.choice.priceModifier,
        });
      }
    }

    const cartKey = getCustomizationKey(
      item.id,
      selectedOptions.map((opt) => opt.choiceId),
    );

    cartItems[cartKey] = {
      ...item,
      basePrice: item.price,
      cartKey,
      price: getCustomizedPrice(item, selectedOptions),
      quantity: (cartItems[cartKey]?.quantity ?? 0) + storedItem.quantity,
      selectedOptions,
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
  selectedChoicesByGroup: Record<string, string[]>;
  modalQuantity: number;
  selectedOptions: SelectedOption[];
  selectedCustomizationKey: string;
  selectedCartItem: CartItem | undefined;
  selectedUnitPrice: number;
  selectedActionPrice: number;
  hasHydratedCartRef: React.RefObject<boolean>;
  setCartItemsById: React.Dispatch<React.SetStateAction<Record<string, CartItem>>>;
  setEditingCartKey: (key: string | null) => void;
  setModalQuantity: React.Dispatch<React.SetStateAction<number>>;
  setSelectedChoicesByGroup: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setSelectedItem: (item: MenuItem | null) => void;
  addToCart: (
    item: MenuItem,
    options?: {
      selectedOptions?: SelectedOption[];
      quantity?: number;
    },
  ) => void;
  updateCartItem: (
    item: MenuItem,
    options: {
      selectedOptions: SelectedOption[];
    },
  ) => void;
  decrementCartItem: (itemId: string) => void;
  incrementCartItem: (itemId: string) => void;
  removeCartItem: (itemId: string) => void;
  getItemCartQuantity: (itemId: string) => number;
  handleGroupSelection: (groupId: string, choiceId: string) => void;
  clearCart: () => void;
  openItemDetails: (item: MenuItem) => void;
  openCartItemDetails: (item: CartItem) => void;
};

function buildSelectedOptions(
  item: MenuItem,
  selectedChoicesByGroup: Record<string, string[]>,
): SelectedOption[] {
  const options: SelectedOption[] = [];
  for (const group of item.optionGroups) {
    const selectedIds = selectedChoicesByGroup[group.id] ?? [];
    for (const choiceId of selectedIds) {
      const choice = group.choices.find((c) => c.id === choiceId);
      if (choice) {
        options.push({
          groupId: group.id,
          groupName: group.name,
          choiceId: choice.id,
          choiceName: choice.name,
          priceModifierType: choice.priceModifierType,
          priceModifier: choice.priceModifier,
        });
      }
    }
  }
  return options;
}

export function useCart(
  selectedCategories: MenuCategory[],
  selectedLocation: Location | undefined,
): CartState {
  const [cartItemsById, setCartItemsById] = useState<Record<string, CartItem>>({});
  const [editingCartKey, setEditingCartKey] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedChoicesByGroup, setSelectedChoicesByGroup] = useState<Record<string, string[]>>(
    {},
  );
  const [modalQuantity, setModalQuantity] = useState(1);
  const hasHydratedCartRef = useRef(false);
  const hasSkippedInitialCartPersistRef = useRef(false);

  const cartItems = Object.values(cartItemsById);
  const cartQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (total, item) => total + getPriceValue(item.price) * item.quantity,
    0,
  );

  const selectedOptions = selectedItem
    ? buildSelectedOptions(selectedItem, selectedChoicesByGroup)
    : [];
  const selectedCustomizationKey = selectedItem
    ? getCustomizationKey(
        selectedItem.id,
        selectedOptions.map((opt) => opt.choiceId),
      )
    : "";
  const selectedCartItem = selectedCustomizationKey
    ? cartItemsById[selectedCustomizationKey]
    : undefined;
  const selectedUnitPrice = selectedItem ? getCustomizedPrice(selectedItem, selectedOptions) : 0;
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
      selectedOptions?: SelectedOption[];
      quantity?: number;
    } = {},
  ) {
    const opts = options.selectedOptions ?? [];
    const quantity = options.quantity ?? 1;
    const cartKey = getCustomizationKey(
      item.id,
      opts.map((opt) => opt.choiceId),
    );

    setCartItemsById((currentItems) => ({
      ...currentItems,
      [cartKey]: {
        ...item,
        basePrice: item.price,
        cartKey,
        price: getCustomizedPrice(item, opts),
        quantity: (currentItems[cartKey]?.quantity ?? 0) + quantity,
        selectedOptions: opts,
      },
    }));
  }

  function updateCartItem(
    item: MenuItem,
    options: {
      selectedOptions: SelectedOption[];
    },
  ) {
    const cartKey = getCustomizationKey(
      item.id,
      options.selectedOptions.map((opt) => opt.choiceId),
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
          price: getCustomizedPrice(item, options.selectedOptions),
          quantity: currentItem.quantity + (remainingItems[cartKey]?.quantity ?? 0),
          selectedOptions: options.selectedOptions,
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

  function handleGroupSelection(groupId: string, choiceId: string) {
    setSelectedChoicesByGroup((current) => {
      const currentSelection = current[groupId] ?? [];
      const group = selectedItem?.optionGroups.find((g) => g.id === groupId);

      if (!group) return current;

      if (group.isMultiSelect) {
        const isSelected = currentSelection.includes(choiceId);
        return {
          ...current,
          [groupId]: isSelected
            ? currentSelection.filter((id) => id !== choiceId)
            : [...currentSelection, choiceId],
        };
      }

      // Single select: replace selection
      const isSelected = currentSelection.includes(choiceId);
      return {
        ...current,
        [groupId]: isSelected ? [] : [choiceId],
      };
    });
  }

  function clearCart() {
    setCartItemsById({});
  }

  function openItemDetails(item: MenuItem) {
    setEditingCartKey(null);
    setModalQuantity(1);
    setSelectedChoicesByGroup({});
    setSelectedItem(item);
  }

  function openCartItemDetails(item: CartItem) {
    setEditingCartKey(item.cartKey);
    setModalQuantity(item.quantity);

    // Restore selection state from cart item
    const restored: Record<string, string[]> = {};
    for (const opt of item.selectedOptions) {
      const groupIds = restored[opt.groupId] ?? [];
      groupIds.push(opt.choiceId);
      restored[opt.groupId] = groupIds;
    }
    setSelectedChoicesByGroup(restored);

    setSelectedItem({
      ...item,
      price: item.basePrice,
      optionGroups: item.optionGroups,
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
    selectedChoicesByGroup,
    setSelectedChoicesByGroup,
    modalQuantity,
    setModalQuantity,
    selectedOptions,
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
    handleGroupSelection,
    clearCart,
    openItemDetails,
    openCartItemDetails,
  };
}
