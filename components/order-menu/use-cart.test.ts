import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCart } from "./use-cart";
import type { Location, MenuCategory, MenuItem, ModifierOption } from "./types";

// --- Test Data ---

const cheese: ModifierOption = { id: "extra-cheese", name: "Extra Cheese", price: 15 };
const bacon: ModifierOption = { id: "extra-bacon", name: "Bacon", price: 20 };

const burger: MenuItem = {
  id: "burger-1",
  name: "Classic Burger",
  description: "Juicy beef patty",
  image_url: null,
  price: 100,
  availableLocationIds: ["loc-1"],
  addOnOptions: [cheese, bacon],
  allergens: [{ id: "a1", name: "Gluten" }],
  ingredients: [
    { id: "i1", name: "Onion" },
    { id: "i2", name: "Lettuce" },
  ],
  is_available: true,
};

const cola: MenuItem = {
  id: "cola-1",
  name: "Cola",
  description: null,
  image_url: null,
  price: 25,
  availableLocationIds: ["loc-1"],
  addOnOptions: [],
  allergens: [],
  ingredients: [],
  is_available: true,
};

const fries: MenuItem = {
  id: "fries-1",
  name: "Fries",
  description: "Crispy golden fries",
  image_url: null,
  price: 50,
  availableLocationIds: ["loc-1"],
  addOnOptions: [],
  allergens: [],
  ingredients: [],
  is_available: true,
};

const foodCategory: MenuCategory = {
  availableLocationIds: ["loc-1"],
  id: "cat-burgers",
  name: "Burgers",
  menu_items: [burger, fries],
  subcategories: [],
};

const drinkCategory: MenuCategory = {
  availableLocationIds: ["loc-1"],
  id: "cat-drinks",
  name: "Drinks",
  menu_items: [cola],
  subcategories: [],
};

const categories: MenuCategory[] = [foodCategory, drinkCategory];

const location: Location = {
  id: "loc-1",
  name: "Oslo",
  address: "Main St 1",
  image_url: null,
  is_open: true,
  opening_hours: null,
  phone: "+47 12345678",
};

// --- Mock localStorage ---

let store: Record<string, string> = {};

beforeEach(() => {
  vi.useFakeTimers();
  store = {};
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function setupHook() {
  const rendered = renderHook(() => useCart(categories, location));
  // Flush the hydration setTimeout(0)
  act(() => {
    vi.advanceTimersByTime(0);
  });
  return rendered;
}

describe("useCart", () => {
  describe("addToCart", () => {
    it("adds an item to an empty cart", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger);
      });

      expect(result.current.cartQuantity).toBe(1);
      expect(result.current.cartSubtotal).toBe(100);
      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0].name).toBe("Classic Burger");
    });

    it("merges items with the same customization", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger, { quantity: 2 });
        result.current.addToCart(burger, { quantity: 1 });
      });

      expect(result.current.cartQuantity).toBe(3);
      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0].quantity).toBe(3);
    });

    it("creates separate entries for different customizations", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger);
        result.current.addToCart(burger, { extraItems: [cheese] });
      });

      expect(result.current.cartItems).toHaveLength(2);
      expect(result.current.cartQuantity).toBe(2);
    });

    it("adds items with extras and drinks", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger, {
          extraItems: [cheese, bacon],
          drinkItems: [cola],
        });
      });

      expect(result.current.cartItems).toHaveLength(1);
      // 100 + 15 + 20 + 25 = 160
      expect(result.current.cartSubtotal).toBe(160);
    });

    it("adds items with removed ingredients", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger, {
          removedIngredientNames: ["Onion"],
        });
      });

      expect(result.current.cartItems[0].removedIngredients).toEqual(["Onion"]);
    });
  });

  describe("updateCartItem", () => {
    it("updates item and creates new cart key", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger);
      });

      const cartKey = result.current.cartItems[0].cartKey;

      act(() => {
        result.current.setEditingCartKey(cartKey);
        result.current.setSelectedItem(burger);
      });

      act(() => {
        result.current.updateCartItem(burger, {
          drinkItems: [],
          extraItems: [cheese],
          removedIngredientNames: [],
        });
      });

      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0].price).toBe(115);
      expect(result.current.cartItems[0].extraItems).toEqual([cheese]);
    });

    it("merges with existing item of the same customization", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger, { quantity: 1 });
        result.current.addToCart(burger, { extraItems: [cheese], quantity: 2 });
      });

      expect(result.current.cartItems).toHaveLength(2);
      const plainKey = result.current.cartItems[0].cartKey;

      act(() => {
        result.current.setEditingCartKey(plainKey);
        result.current.setSelectedItem(burger);
      });

      act(() => {
        result.current.updateCartItem(burger, {
          drinkItems: [],
          extraItems: [cheese],
          removedIngredientNames: [],
        });
      });

      expect(result.current.cartItems).toHaveLength(1);
      expect(result.current.cartItems[0].quantity).toBe(3);
    });
  });

  describe("decrementCartItem", () => {
    it("decrements quantity", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger, { quantity: 3 });
      });

      act(() => {
        result.current.decrementCartItem(result.current.cartItems[0].cartKey);
      });

      expect(result.current.cartItems[0].quantity).toBe(2);
    });

    it("removes item when quantity reaches 0", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger);
      });

      expect(result.current.cartItems).toHaveLength(1);

      act(() => {
        result.current.decrementCartItem(result.current.cartItems[0].cartKey);
      });

      expect(result.current.cartItems).toHaveLength(0);
      expect(result.current.cartQuantity).toBe(0);
    });

    it("does nothing for an unknown cart key", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger);
      });

      act(() => {
        result.current.decrementCartItem("non-existent-key");
      });

      expect(result.current.cartItems).toHaveLength(1);
    });
  });

  describe("incrementCartItem", () => {
    it("increments quantity", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger);
      });

      act(() => {
        result.current.incrementCartItem(result.current.cartItems[0].cartKey);
      });

      expect(result.current.cartItems[0].quantity).toBe(2);
    });

    it("does nothing for an unknown cart key", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger);
      });

      act(() => {
        result.current.incrementCartItem("non-existent-key");
      });

      expect(result.current.cartItems[0].quantity).toBe(1);
    });
  });

  describe("clearCart", () => {
    it("removes all items", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger);
        result.current.addToCart(fries);
      });

      expect(result.current.cartQuantity).toBe(2);

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.cartItems).toHaveLength(0);
      expect(result.current.cartQuantity).toBe(0);
    });
  });

  describe("computed values", () => {
    it("computes cartQuantity", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger, { quantity: 2 });
        result.current.addToCart(fries);
      });

      expect(result.current.cartQuantity).toBe(3);
    });

    it("computes cartSubtotal", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger, { quantity: 2 });
        result.current.addToCart(fries);
      });

      // 2 × 100 + 1 × 50 = 250
      expect(result.current.cartSubtotal).toBe(250);
    });

    it("derives drinkOptions from drink categories", () => {
      const { result } = setupHook();

      expect(result.current.drinkOptions).toHaveLength(1);
      expect(result.current.drinkOptions[0].name).toBe("Cola");
    });
  });

  describe("getItemCartQuantity", () => {
    it("sums quantities for the same item across customizations", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(fries);
        result.current.addToCart(fries, { extraItems: [cheese] });
      });

      expect(result.current.getItemCartQuantity("fries-1")).toBe(2);
    });

    it("returns 0 for an item not in the cart", () => {
      const { result } = setupHook();

      expect(result.current.getItemCartQuantity("non-existent")).toBe(0);
    });
  });

  describe("toggleSelection", () => {
    it("adds a value not already in the array", () => {
      const { result } = setupHook();
      let current: string[] = [];

      act(() => {
        result.current.toggleSelection("a", (updater) => {
          current = updater(current);
        });
      });

      expect(current).toEqual(["a"]);
    });

    it("removes a value already in the array", () => {
      const { result } = setupHook();
      let current = ["a", "b"];

      act(() => {
        result.current.toggleSelection("a", (updater) => {
          current = updater(current);
        });
      });

      expect(current).toEqual(["b"]);
    });
  });

  describe("openItemDetails", () => {
    it("resets modal state for a new item", () => {
      const { result } = setupHook();

      act(() => {
        result.current.openItemDetails(burger);
      });

      expect(result.current.selectedItem?.id).toBe("burger-1");
      expect(result.current.editingCartKey).toBeNull();
      expect(result.current.modalQuantity).toBe(1);
      expect(result.current.selectedDrinkIds).toEqual([]);
      expect(result.current.selectedExtraIds).toEqual([]);
      expect(result.current.selectedRemovedIngredientIds).toEqual([]);
    });
  });

  describe("openCartItemDetails", () => {
    it("sets up edit state from an existing cart item", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger, {
          extraItems: [cheese],
          removedIngredientNames: ["Onion"],
        });
      });

      const item = result.current.cartItems[0];

      act(() => {
        result.current.openCartItemDetails(item);
      });

      expect(result.current.editingCartKey).toBe(item.cartKey);
      expect(result.current.modalQuantity).toBe(1);
      expect(result.current.selectedExtraIds).toContain("extra-cheese");
      expect(result.current.selectedRemovedIngredientIds).toContain("i1");
    });
  });

  describe("localStorage persistence", () => {
    it("persists cart after adding an item", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger);
      });

      const stored = JSON.parse(store["food-app:cart:v1"]);
      expect(stored.items).toHaveLength(1);
      expect(stored.items[0].itemId).toBe("burger-1");
      expect(stored.version).toBe(1);
    });

    it("removes the storage key after cart is cleared", () => {
      const { result } = setupHook();

      act(() => {
        result.current.addToCart(burger);
      });

      expect(store["food-app:cart:v1"]).toBeDefined();

      act(() => {
        result.current.clearCart();
      });

      expect(store["food-app:cart:v1"]).toBeUndefined();
    });
  });

  describe("localStorage hydration", () => {
    it("hydrates cart from localStorage on mount", () => {
      const cartData = {
        version: 1,
        items: [
          {
            itemId: "fries-1",
            quantity: 3,
            drinkIds: [],
            extraIds: [],
            removedIngredientNames: [],
          },
        ],
      };
      store["food-app:cart:v1"] = JSON.stringify(cartData);

      const { result } = setupHook();

      expect(result.current.cartQuantity).toBe(3);
      expect(result.current.cartItems[0].name).toBe("Fries");
    });

    it("skips items that no longer exist in the menu", () => {
      const cartData = {
        version: 1,
        items: [
          {
            itemId: "deleted-item",
            quantity: 1,
            drinkIds: [],
            extraIds: [],
            removedIngredientNames: [],
          },
        ],
      };
      store["food-app:cart:v1"] = JSON.stringify(cartData);

      const { result } = setupHook();

      expect(result.current.cartQuantity).toBe(0);
    });

    it("does not hydrate when no location is selected", () => {
      const cartData = {
        version: 1,
        items: [
          {
            itemId: "burger-1",
            quantity: 2,
            drinkIds: [],
            extraIds: [],
            removedIngredientNames: [],
          },
        ],
      };
      store["food-app:cart:v1"] = JSON.stringify(cartData);

      const { rerender } = renderHook(({ loc }) => useCart(categories, loc), {
        initialProps: { loc: undefined as Location | undefined },
      });

      // No location, so hydration should not have fired
      expect(store["food-app:cart:v1"]).toBeDefined();

      // Now provide a location to trigger hydration
      act(() => {
        rerender({ loc: location });
      });

      // Flush the hydration timeout
      act(() => {
        vi.advanceTimersByTime(0);
      });
    });
  });
});
