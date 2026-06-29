import { z } from "zod";

import type { CartItem, OptionChoice, OptionGroup } from "./types";

const cartStorageKey = "food-app:cart:v1";
export const cartStorageVersion = 1 as const;
export const locationStorageKey = "food-app:selected-location:v1";
export const locationStorageVersion = 1 as const;

const storedCartItemSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().positive(),
  selectedOptionIds: z.array(z.string()),
});

const cartEnvelopeSchema = z.object({
  items: z.array(z.unknown()),
  version: z.literal(cartStorageVersion),
});

const storedLocationSchema = z.object({
  id: z.string(),
  version: z.literal(locationStorageVersion),
});

export function readStoredCart() {
  try {
    const storedCart = window.localStorage.getItem(cartStorageKey);

    if (!storedCart) {
      return [];
    }

    const parsedCart = cartEnvelopeSchema.parse(JSON.parse(storedCart));

    return parsedCart.items.filter((item): item is z.infer<typeof storedCartItemSchema> => {
      return storedCartItemSchema.safeParse(item).success;
    });
  } catch {
    return [];
  }
}

export function writeStoredCart(cartItems: CartItem[]) {
  try {
    if (cartItems.length === 0) {
      window.localStorage.removeItem(cartStorageKey);
      return;
    }

    const storedCart = {
      items: cartItems.map((item) => ({
        itemId: item.id,
        quantity: item.quantity,
        selectedOptionIds: item.selectedOptions.map((opt) => opt.choiceId),
      })),
      version: cartStorageVersion,
    };

    window.localStorage.setItem(cartStorageKey, JSON.stringify(storedCart));
  } catch {
    // Ignore storage failures so cart interactions still work in private mode.
  }
}

export function readStoredLocationId() {
  try {
    const storedLocation = window.localStorage.getItem(locationStorageKey);

    if (!storedLocation) {
      return null;
    }

    const parsedLocation = storedLocationSchema.parse(JSON.parse(storedLocation));

    return parsedLocation.id;
  } catch {
    return null;
  }
}

export function writeStoredLocationId(locationId: string) {
  try {
    const storedLocation = {
      id: locationId,
      version: locationStorageVersion,
    };

    window.localStorage.setItem(locationStorageKey, JSON.stringify(storedLocation));
  } catch {
    // Ignore storage failures so users can still choose a location for this session.
  }
}

export const allergenStorageKey = "food-app:allergens:v1";
export const allergenStorageVersion = 1 as const;

const allergenEnvelopeSchema = z.object({
  allergenIds: z.array(z.string()),
  version: z.literal(allergenStorageVersion),
});

export function readStoredAllergens() {
  try {
    const stored = window.localStorage.getItem(allergenStorageKey);

    if (!stored) {
      return null;
    }

    const parsed = allergenEnvelopeSchema.parse(JSON.parse(stored));

    return parsed.allergenIds;
  } catch {
    return null;
  }
}

export function writeStoredAllergens(allergenIds: string[]) {
  try {
    if (allergenIds.length === 0) {
      window.localStorage.removeItem(allergenStorageKey);
      return;
    }

    window.localStorage.setItem(
      allergenStorageKey,
      JSON.stringify({ allergenIds, version: allergenStorageVersion }),
    );
  } catch {
    // Ignore storage failures.
  }
}

export function getChoiceById(
  groups: OptionGroup[],
): Map<string, { choice: OptionChoice; group: OptionGroup }> {
  const map = new Map<string, { choice: OptionChoice; group: OptionGroup }>();
  for (const group of groups) {
    for (const choice of group.choices) {
      map.set(choice.id, { choice, group });
    }
  }
  return map;
}
