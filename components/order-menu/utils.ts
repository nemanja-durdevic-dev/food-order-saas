import type { CartItem, MenuItem, ModifierOption } from "./types";

const CURRENCY_LOCALE: Record<string, string> = {
  DKK: "da-DK",
  EUR: "en-IE",
  ISK: "is-IS",
  NOK: "nb-NO",
  SEK: "sv-SE",
};

export function formatPrice(price: number | string, currency = "NOK") {
  const value = typeof price === "number" ? price : Number(price);
  if (Number.isNaN(value)) {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "nb-NO", {
      currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
      style: "currency",
    }).format(0);
  }
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "nb-NO", {
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function getPriceValue(price: number | string) {
  const value = typeof price === "number" ? price : Number(price);
  return Number.isNaN(value) ? 0 : value;
}

export function getCustomizationKey(
  itemId: string,
  removedIngredientIds: string[],
  extraIds: string[],
  drinkIds: string[],
) {
  return [
    itemId,
    removedIngredientIds.toSorted().join(","),
    extraIds.toSorted().join(","),
    drinkIds.toSorted().join(","),
  ].join(":");
}

export function getCustomizedPrice(item: MenuItem, extras: ModifierOption[], drinks: MenuItem[]) {
  return [...extras, ...drinks].reduce(
    (total, option) => total + getPriceValue(option.price),
    getPriceValue(item.price),
  );
}

import { countryCodes } from "./constants";

export function formatPhoneNumber(phone: string) {
  const normalized = phone.startsWith("+") ? phone : `+${phone}`;
  const matched = countryCodes.find((cc) => normalized.startsWith(cc.value));
  if (matched) {
    return `${matched.value} ${normalized.slice(matched.value.length)}`;
  }
  return normalized;
}

export function getCartCustomizationLabels(
  item: CartItem,
  t: (key: string, params?: Record<string, string | number>) => string,
  currency = "NOK",
) {
  return [
    ...item.removedIngredients.map((ingredient) => `${t("item.no_prefix")} ${ingredient}`),
    ...item.extraItems.map((extra) => `+ ${extra.name} (${formatPrice(extra.price, currency)})`),
    ...item.drinkItems.map((drink) => `+ ${drink.name} (${formatPrice(drink.price, currency)})`),
  ];
}
