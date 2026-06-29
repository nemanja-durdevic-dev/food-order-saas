import type { CartItem, MenuItem, SelectedOption } from "./types";

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

export function getCustomizationKey(itemId: string, selectedOptionIds: string[]) {
  return [itemId, selectedOptionIds.toSorted().join(",")].join(":");
}

export function getCustomizedPrice(item: MenuItem, selectedOptions: SelectedOption[]) {
  return selectedOptions.reduce((total, option) => {
    if (option.priceModifierType === "increase") return total + option.priceModifier;
    if (option.priceModifierType === "decrease") return total - option.priceModifier;
    return total;
  }, getPriceValue(item.price));
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
  return item.selectedOptions.map((opt) => {
    if (opt.priceModifierType === "increase") {
      return `+ ${opt.choiceName} (${formatPrice(opt.priceModifier, currency)})`;
    }
    if (opt.priceModifierType === "decrease") {
      return `${opt.choiceName} (-${formatPrice(opt.priceModifier, currency)})`;
    }
    return opt.choiceName;
  });
}
