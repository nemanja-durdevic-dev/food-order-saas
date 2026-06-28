import { describe, expect, it } from "vitest";
import {
  formatPrice,
  formatPhoneNumber,
  getCustomizationKey,
  getCustomizedPrice,
  getPriceValue,
} from "./utils";

describe("formatPrice", () => {
  it("formats a number with default currency", () => {
    expect(formatPrice(99)).toContain("99");
  });

  it("formats a string number", () => {
    expect(formatPrice("99")).toContain("99");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toContain("0");
  });

  it("formats with SEK currency", () => {
    const formatted = formatPrice(99, "SEK");
    expect(formatted).toContain("99");
  });

  it("formats with EUR currency", () => {
    const formatted = formatPrice(99, "EUR");
    expect(formatted).toContain("99");
  });

  it("guards against NaN", () => {
    expect(formatPrice(NaN)).toContain("0");
  });

  it("guards against invalid string", () => {
    expect(formatPrice("not-a-number")).toContain("0");
  });
});

describe("getPriceValue", () => {
  it("returns number as-is", () => {
    expect(getPriceValue(99)).toBe(99);
  });

  it("parses string number", () => {
    expect(getPriceValue("99")).toBe(99);
  });

  it("guards against NaN", () => {
    expect(getPriceValue(NaN)).toBe(0);
  });

  it("guards against invalid string", () => {
    expect(getPriceValue("not-a-number")).toBe(0);
  });
});

describe("getCustomizationKey", () => {
  it("creates a key with all parts", () => {
    const key = getCustomizationKey("item-1", ["cheese"], ["extra-1"], ["drink-1"]);
    expect(key).toBe("item-1:cheese:extra-1:drink-1");
  });

  it("sorts arrays for deterministic keys", () => {
    const a = getCustomizationKey("item-1", ["z", "a"], ["9", "1"], ["x", "m"]);
    const b = getCustomizationKey("item-1", ["a", "z"], ["1", "9"], ["m", "x"]);
    expect(a).toBe(b);
  });

  it("handles empty arrays", () => {
    const key = getCustomizationKey("item-1", [], [], []);
    expect(key).toBe("item-1:::");
  });
});

describe("getCustomizedPrice", () => {
  const baseItem = {
    id: "item-1",
    name: "Burger",
    description: null,
    image_url: null,
    price: 100,
    availableLocationIds: [],
    addOnOptions: [],
    allergens: [],
    ingredients: [],
    is_available: true,
  };

  it("returns base price with no extras", () => {
    expect(getCustomizedPrice(baseItem, [], [])).toBe(100);
  });

  it("adds extra option prices", () => {
    const extras = [{ id: "e1", name: "Bacon", price: 15 }];
    expect(getCustomizedPrice(baseItem, extras, [])).toBe(115);
  });

  it("adds drink prices", () => {
    const drinks = [{ ...baseItem, id: "d1", name: "Cola", price: 25 }];
    expect(getCustomizedPrice(baseItem, [], drinks)).toBe(125);
  });

  it("sums extras and drinks together", () => {
    const extras = [{ id: "e1", name: "Bacon", price: 15 }];
    const drinks = [{ ...baseItem, id: "d1", name: "Cola", price: 25 }];
    expect(getCustomizedPrice(baseItem, extras, drinks)).toBe(140);
  });
});

describe("formatPhoneNumber", () => {
  it("formats a Norwegian number with +", () => {
    expect(formatPhoneNumber("+4741234567")).toBe("+47 41234567");
  });

  it("formats a Norwegian number without +", () => {
    expect(formatPhoneNumber("4741234567")).toBe("+47 41234567");
  });

  it("formats a Swedish number", () => {
    expect(formatPhoneNumber("+46701234567")).toBe("+46 701234567");
  });

  it("passes through unknown country codes", () => {
    expect(formatPhoneNumber("+999123456")).toBe("+999123456");
  });
});
