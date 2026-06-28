"use client";

import { useEffect, useMemo, useState } from "react";

import type { Location, MenuCategory, OrderMenuProps } from "./types";
import { locationStorageKey, readStoredLocationId, writeStoredLocationId } from "./storage";

function isCategoryAvailableAtLocation(category: MenuCategory, locationId: string) {
  return (
    category.availableLocationIds ??
    category.menu_items.flatMap((item) => item.availableLocationIds)
  ).includes(locationId);
}

function isSubcategoryAvailableAtLocation(
  subcategory: MenuCategory["subcategories"][number],
  locationId: string,
) {
  return (
    subcategory.availableLocationIds ??
    subcategory.menu_items.flatMap((item) => item.availableLocationIds)
  ).includes(locationId);
}

function getCategoriesForLocation(
  categories: OrderMenuProps["categories"],
  location: Location | undefined,
) {
  if (!location) {
    return [];
  }

  return categories
    .filter((category) => isCategoryAvailableAtLocation(category, location.id))
    .map((category) => ({
      ...category,
      menu_items: category.menu_items.filter((item) =>
        item.availableLocationIds.includes(location.id),
      ),
      subcategories: category.subcategories
        .filter((subcategory) => isSubcategoryAvailableAtLocation(subcategory, location.id))
        .map((subcategory) => ({
          ...subcategory,
          menu_items: subcategory.menu_items.filter((item) =>
            item.availableLocationIds.includes(location.id),
          ),
        }))
        .filter((subcategory) => subcategory.menu_items.length > 0),
    }))
    .filter((category) => category.menu_items.length > 0);
}

export type LocationState = {
  selectedLocation: Location | undefined;
  selectedLocationId: string | null;
  hasHydratedLocation: boolean;
  selectedCategories: MenuCategory[];
  selectLocation: (locationId: string) => void;
};

export function useLocation(locations: Location[], categories: MenuCategory[]): LocationState {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [hasHydratedLocation, setHasHydratedLocation] = useState(false);

  const selectedLocation = locations.find((location) => location.id === selectedLocationId);

  const selectedCategories = useMemo(
    () => getCategoriesForLocation(categories, selectedLocation),
    [categories, selectedLocation],
  );

  useEffect(() => {
    const storedLocationId = readStoredLocationId();
    const storedLocation = locations.find((location) => location.id === storedLocationId);

    if (storedLocation) {
      const selectTimeoutId = window.setTimeout(() => {
        setSelectedLocationId(storedLocation.id);
        setHasHydratedLocation(true);
      }, 0);

      return () => {
        window.clearTimeout(selectTimeoutId);
      };
    }

    if (storedLocationId) {
      try {
        window.localStorage.removeItem(locationStorageKey);
      } catch {
        // Ignore storage failures so users can still choose a location.
      }
    }

    const openTimeoutId = window.setTimeout(() => {
      setHasHydratedLocation(true);
    }, 0);

    return () => {
      window.clearTimeout(openTimeoutId);
    };
  }, [locations]);

  useEffect(() => {
    if (!selectedLocation) {
      return;
    }

    writeStoredLocationId(selectedLocation.id);
  }, [selectedLocation]);

  function selectLocation(locationId: string) {
    const nextLocation = locations.find((location) => location.id === locationId);

    if (!nextLocation) {
      return;
    }

    writeStoredLocationId(locationId);
    setSelectedLocationId(locationId);
  }

  return {
    selectedLocation,
    selectedLocationId,
    hasHydratedLocation,
    selectedCategories,
    selectLocation,
  };
}
