import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  readStoredCart,
  readStoredLocationId,
  writeStoredCart,
  writeStoredLocationId,
} from "./storage";
import type { CartItem } from "./types";

const baseCartItem: CartItem = {
  id: "item-1",
  name: "Burger",
  description: null,
  image_url: null,
  price: 100,
  basePrice: 100,
  cartKey: "item-1:::",
  quantity: 2,
  removedIngredients: [],
  drinkItems: [],
  extraItems: [],
  availableLocationIds: [],
  addOnOptions: [],
  allergens: [],
  ingredients: [],
  is_available: true,
};

let store: Record<string, string> = {};

beforeAll(() => {
  const mockStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
  vi.stubGlobal("localStorage", mockStorage);
});

afterEach(() => {
  store = {};
});

describe("readStoredCart / writeStoredCart", () => {
  it("returns empty array when nothing is stored", () => {
    expect(readStoredCart()).toEqual([]);
  });

  it("round-trips cart items", () => {
    writeStoredCart([baseCartItem]);
    const result = readStoredCart();
    expect(result).toEqual([
      {
        itemId: "item-1",
        quantity: 2,
        drinkIds: [],
        extraIds: [],
        removedIngredientNames: [],
      },
    ]);
  });

  it("handles items with customizations", () => {
    const customized: CartItem = {
      ...baseCartItem,
      quantity: 1,
      removedIngredients: ["Onion"],
      extraItems: [{ id: "e1", name: "Bacon", price: 15 }],
      drinkItems: [
        {
          ...baseCartItem,
          id: "d1",
          name: "Cola",
          price: 25,
        },
      ],
    };

    writeStoredCart([customized]);
    const result = readStoredCart();

    expect(result).toEqual([
      {
        itemId: "item-1",
        quantity: 1,
        drinkIds: ["d1"],
        extraIds: ["e1"],
        removedIngredientNames: ["Onion"],
      },
    ]);
  });

  it("removes storage key when cart is empty", () => {
    writeStoredCart([baseCartItem]);
    expect(readStoredCart()).not.toEqual([]);

    writeStoredCart([]);
    expect(readStoredCart()).toEqual([]);
  });

  it("does not crash on corrupted data", () => {
    store["food-app:cart:v1"] = "not-json";
    expect(readStoredCart()).toEqual([]);
  });

  it("rejects items with wrong version", () => {
    store["food-app:cart:v1"] = JSON.stringify({ items: [], version: 999 });
    expect(readStoredCart()).toEqual([]);
  });

  it("filters out invalid items", () => {
    const data = {
      version: 1,
      items: [
        { itemId: "valid", quantity: 1, drinkIds: [], extraIds: [], removedIngredientNames: [] },
        { itemId: 123, quantity: 1, drinkIds: [], extraIds: [], removedIngredientNames: [] },
      ],
    };
    store["food-app:cart:v1"] = JSON.stringify(data);
    expect(readStoredCart()).toEqual([data.items[0]]);
  });
});

describe("readStoredLocationId / writeStoredLocationId", () => {
  it("returns null when nothing is stored", () => {
    expect(readStoredLocationId()).toBeNull();
  });

  it("round-trips a location ID", () => {
    writeStoredLocationId("loc-1");
    expect(readStoredLocationId()).toBe("loc-1");
  });

  it("overwrites previous location", () => {
    writeStoredLocationId("loc-1");
    writeStoredLocationId("loc-2");
    expect(readStoredLocationId()).toBe("loc-2");
  });

  it("rejects data with wrong version", () => {
    store["food-app:selected-location:v1"] = JSON.stringify({ id: "loc-1", version: 999 });
    expect(readStoredLocationId()).toBeNull();
  });

  it("does not crash on corrupted data", () => {
    store["food-app:selected-location:v1"] = "garbage";
    expect(readStoredLocationId()).toBeNull();
  });
});
