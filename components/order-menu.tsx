"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, TriangleAlert, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { CartPanel } from "@/components/order-menu/cart-panel";
import { CategoryNav } from "@/components/order-menu/category-nav";
import { ItemDetailsDialog } from "@/components/order-menu/item-details-dialog";
import { LocationHero } from "@/components/order-menu/location-hero";
import { MenuCategoryList } from "@/components/order-menu/menu-category-list";
import { RestaurantInfoContent } from "@/components/order-menu/restaurant-info-content";
import { AllergenDialog } from "@/components/order-menu/allergen-dialog";
import { getAllergenEmoji } from "@/components/order-menu/allergen-icons";
import { AuthDialog } from "@/components/order-menu/auth-dialog";
import { UserDialog } from "@/components/order-menu/user-dialog";
import { LanguageDialog } from "@/components/order-menu/language-dialog";
import { SearchDialog } from "@/components/order-menu/search-dialog";
import { useTranslations } from "@/components/order-menu/locale-context";
import { toast } from "sonner";
import { useLocation } from "@/components/order-menu/use-location";
import { useAuth } from "@/components/order-menu/use-auth";
import { useAllergens } from "@/components/order-menu/use-allergens";
import { useCart } from "@/components/order-menu/use-cart";
import { getTodayClosingTime, isCurrentlyOpen } from "@/components/order-menu/opening-hours";
import type {
  Location,
  CartItem,
  ItemAllergen,
  MenuItem,
  OpeningHour,
  OrderMenuProps,
  RestaurantSocialLinks,
} from "@/components/order-menu/types";
import { formatPrice } from "@/components/order-menu/utils";

const modalAnimationDuration = 300;

export function OrderMenu({
  allAllergens: allAllergensProp,
  categories,
  error,
  locations,
  overridesByLocationId,
  socialLinks,
}: OrderMenuProps) {
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const categoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const categoryNavRef = useRef<HTMLElement | null>(null);
  const subcategoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const subcategoryButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const subcategoryNavRef = useRef<HTMLDivElement | null>(null);
  const programmaticScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const infoCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const languageCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allergensCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allergenWarningCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allergenActivatedCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartAllergenWarningCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = useTranslations();

  // Dialog visibility state — declared early because callbacks reference setters
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Dialog closing animation state
  const [isAuthClosing, setIsAuthClosing] = useState(false);
  const [isUserClosing, setIsUserClosing] = useState(false);
  const [isInfoClosing, setIsInfoClosing] = useState(false);
  const [isLanguageClosing, setIsLanguageClosing] = useState(false);
  const [isCartClosing, setIsCartClosing] = useState(false);
  const [isItemClosing, setIsItemClosing] = useState(false);
  const [isLocationClosing, setIsLocationClosing] = useState(false);
  const [isAllergensOpen, setIsAllergensOpen] = useState(false);
  const [isAllergensClosing, setIsAllergensClosing] = useState(false);
  const [allergenWarningItem, setAllergenWarningItem] = useState<MenuItem | null>(null);
  const [isAllergenWarningClosing, setIsAllergenWarningClosing] = useState(false);
  const [isAllergenActivatedOpen, setIsAllergenActivatedOpen] = useState(false);
  const [isAllergenActivatedClosing, setIsAllergenActivatedClosing] = useState(false);
  const [isCartAllergenWarningOpen, setIsCartAllergenWarningOpen] = useState(false);
  const [isCartAllergenWarningClosing, setIsCartAllergenWarningClosing] = useState(false);

  const { userId, userEmail, isAuthLoading } = useAuth();
  const {
    selectedLocation,
    selectedLocationId,
    hasHydratedLocation,
    selectedCategories,
    selectLocation,
  } = useLocation(locations, categories);

  const closingTime = getTodayClosingTime(selectedLocation?.opening_hours);
  const isOpenNow = isCurrentlyOpen(selectedLocation?.opening_hours);
  const isLocationEffectivelyClosed = selectedLocation
    ? selectedLocation.is_open === false || isOpenNow === false
    : false;
  const isLocationEffectivelyOpen = selectedLocation
    ? selectedLocation.is_open !== false && isOpenNow !== false
    : null;

  const cart = useCart(selectedCategories, selectedLocation);
  const currency = selectedLocation?.currency ?? "NOK";
  const {
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
    selectedActionPrice,
    addToCart,
    updateCartItem,
    decrementCartItem,
    incrementCartItem,
    removeCartItem,
    getItemCartQuantity,
    toggleSelection,
    clearCart,
    openItemDetails: cartOpenItemDetails,
    openCartItemDetails,
  } = cart;

  const [searchQuery, setSearchQuery] = useState("");
  const trimmedSearchQuery = searchQuery.trim().toLowerCase();

  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");
  const [activeSubcategoryId, setActiveSubcategoryId] = useState("");

  const shouldShowOrderContent = hasHydratedLocation && selectedLocation;
  const isCartButtonVisible = Boolean(shouldShowOrderContent) && cartQuantity > 0;

  const visibleActiveCategoryId = selectedCategories.some(
    (category) => category.id === activeCategoryId,
  )
    ? activeCategoryId
    : (selectedCategories[0]?.id ?? "");
  const activeSubcategories =
    selectedCategories.find((category) => category.id === visibleActiveCategoryId)?.subcategories ??
    [];
  const visibleActiveSubcategoryId = activeSubcategories.some(
    (subcategory) => subcategory.id === activeSubcategoryId,
  )
    ? activeSubcategoryId
    : (activeSubcategories[0]?.id ?? "");

  const hasAutoOpenedLocationRef = useRef(false);

  const searchResults = useMemo(
    () =>
      selectedCategories.flatMap((category) =>
        category.menu_items
          .filter((item) => {
            if (!trimmedSearchQuery) {
              return false;
            }

            return `${item.name} ${item.description ?? ""} ${category.name}`
              .toLowerCase()
              .includes(trimmedSearchQuery);
          })
          .map((item) => ({
            category,
            item,
          })),
      ),
    [selectedCategories, trimmedSearchQuery],
  );

  const filteredCategories = useMemo(() => {
    if (!trimmedSearchQuery) {
      return selectedCategories;
    }

    return selectedCategories
      .map((category) => ({
        ...category,
        menu_items: category.menu_items.filter((item) =>
          `${item.name} ${item.description ?? ""} ${category.name}`
            .toLowerCase()
            .includes(trimmedSearchQuery),
        ),
        subcategories: category.subcategories
          .map((subcategory) => ({
            ...subcategory,
            menu_items: subcategory.menu_items.filter((item) =>
              `${item.name} ${item.description ?? ""} ${category.name} ${subcategory.name}`
                .toLowerCase()
                .includes(trimmedSearchQuery),
            ),
          }))
          .filter((subcategory) => subcategory.menu_items.length > 0),
      }))
      .filter((category) => category.menu_items.length > 0);
  }, [selectedCategories, trimmedSearchQuery]);

  const allAllergens = allAllergensProp;

  const [isSavingAllergens, setIsSavingAllergens] = useState(false);
  const { selectedAllergenIds, save: saveAllergens } = useAllergens(allAllergens, userId);

  // Scroll spy
  useEffect(() => {
    const navHeight = categoryNavRef.current?.getBoundingClientRect().height ?? 96;
    const observer = new IntersectionObserver(
      (entries) => {
        if (programmaticScrollTimeoutRef.current) {
          return;
        }

        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .toSorted(
            (firstEntry, secondEntry) =>
              firstEntry.boundingClientRect.top - secondEntry.boundingClientRect.top,
          )[0];

        const categoryId = visibleEntry?.target.getAttribute("data-category-id");
        const subcategoryId = visibleEntry?.target.getAttribute("data-subcategory-id");

        if (categoryId) {
          setActiveCategoryId(categoryId);
        }

        if (subcategoryId) {
          setActiveSubcategoryId(subcategoryId);
        }
      },
      {
        rootMargin: `-${navHeight}px 0px -60% 0px`,
        threshold: 0,
      },
    );

    for (const category of filteredCategories) {
      const element = category.subcategories.length > 0 ? null : categoryRefs.current[category.id];

      if (element) {
        observer.observe(element);
      }

      for (const subcategory of category.subcategories) {
        const subcategoryElement = subcategoryRefs.current[subcategory.id];

        if (subcategoryElement) {
          observer.observe(subcategoryElement);
        }
      }
    }

    return () => {
      observer.disconnect();
    };
  }, [filteredCategories]);

  // Auto-open location picker on first visit when no saved location
  useEffect(() => {
    if (hasHydratedLocation && !selectedLocationId && !hasAutoOpenedLocationRef.current) {
      hasAutoOpenedLocationRef.current = true;
      setIsLocationOpen(true);
    }
  }, [hasHydratedLocation, selectedLocationId]);

  // Auto-scroll category nav buttons
  useEffect(() => {
    categoryButtonRefs.current[visibleActiveCategoryId]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [visibleActiveCategoryId]);

  // Auto-scroll subcategory nav buttons
  useEffect(() => {
    if (!visibleActiveSubcategoryId) {
      return;
    }

    subcategoryButtonRefs.current[visibleActiveSubcategoryId]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [visibleActiveSubcategoryId]);

  // Auto-open cart when returning from repeat-order redirect
  useEffect(() => {
    if (!shouldShowOrderContent) return;

    const shouldOpenCart = window.localStorage.getItem("food-app:open-cart");
    if (!shouldOpenCart || cartQuantity === 0) return;

    window.localStorage.removeItem("food-app:open-cart");

    const openTimeoutId = setTimeout(() => setIsCartOpen(true), 0);

    return () => clearTimeout(openTimeoutId);
  }, [shouldShowOrderContent, cartQuantity]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      for (const ref of [
        programmaticScrollTimeoutRef,
        authCloseTimeoutRef,
        infoCloseTimeoutRef,
        cartCloseTimeoutRef,
        itemCloseTimeoutRef,
        languageCloseTimeoutRef,
        locationCloseTimeoutRef,
        allergensCloseTimeoutRef,
        allergenWarningCloseTimeoutRef,
        allergenActivatedCloseTimeoutRef,
        cartAllergenWarningCloseTimeoutRef,
      ]) {
        if (ref.current) {
          clearTimeout(ref.current);
        }
      }
    };
  }, []);

  // Scroll lock when any dialog is open
  useEffect(() => {
    const shouldLockScroll =
      isAuthOpen ||
      isUserOpen ||
      isInfoOpen ||
      isLanguageOpen ||
      isCartOpen ||
      isLocationOpen ||
      isSearchOpen ||
      isAllergensOpen ||
      isAllergenActivatedOpen ||
      isCartAllergenWarningOpen ||
      selectedItem !== null ||
      allergenWarningItem !== null;

    if (!shouldLockScroll) {
      return;
    }

    const scrollY = window.scrollY;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyWidth = document.body.style.width;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [
    isAuthOpen,
    isUserOpen,
    isCartOpen,
    isInfoOpen,
    isLanguageOpen,
    isLocationOpen,
    isSearchOpen,
    isAllergensOpen,
    isAllergenActivatedOpen,
    isCartAllergenWarningOpen,
    selectedItem,
    allergenWarningItem,
  ]);

  function scrollToCategory(categoryId: string) {
    if (programmaticScrollTimeoutRef.current) {
      clearTimeout(programmaticScrollTimeoutRef.current);
    }

    programmaticScrollTimeoutRef.current = setTimeout(() => {
      programmaticScrollTimeoutRef.current = null;
      setActiveCategoryId(categoryId);
    }, 800);

    setActiveCategoryId(categoryId);
    setActiveSubcategoryId("");
    scrollToMenuSection(categoryRefs.current[categoryId]);
  }

  function scrollToSubcategory(subcategoryId: string) {
    if (programmaticScrollTimeoutRef.current) {
      clearTimeout(programmaticScrollTimeoutRef.current);
    }

    const categoryId = selectedCategories.find((category) =>
      category.subcategories.some((subcategory) => subcategory.id === subcategoryId),
    )?.id;

    programmaticScrollTimeoutRef.current = setTimeout(() => {
      programmaticScrollTimeoutRef.current = null;
      if (categoryId) {
        setActiveCategoryId(categoryId);
      }
      setActiveSubcategoryId(subcategoryId);
    }, 800);

    if (categoryId) {
      setActiveCategoryId(categoryId);
    }
    setActiveSubcategoryId(subcategoryId);
    scrollToMenuSection(subcategoryRefs.current[subcategoryId]);
  }

  function scrollToMenuSection(element: HTMLElement | null | undefined) {
    if (!element) {
      return;
    }

    requestAnimationFrame(() => {
      const navHeight = categoryNavRef.current?.getBoundingClientRect().height ?? 0;
      const targetTop = element.getBoundingClientRect().top + window.scrollY - navHeight - 24;

      window.scrollTo({
        behavior: "smooth",
        top: Math.max(targetTop, 0),
      });
    });
  }

  function closeSearch() {
    setIsSearchOpen(false);
    setSearchQuery("");
  }

  function proceedToItemDetails(item: MenuItem) {
    if (itemCloseTimeoutRef.current) {
      clearTimeout(itemCloseTimeoutRef.current);
      itemCloseTimeoutRef.current = null;
    }

    setIsItemClosing(false);
    cartOpenItemDetails(item);
  }

  function selectSearchResult(item: MenuItem) {
    closeSearch();

    if (
      selectedAllergenIds.length > 0 &&
      item.allergens.some((a) => selectedAllergenIds.includes(a.id))
    ) {
      setAllergenWarningItem(item);
      return;
    }

    proceedToItemDetails(item);
  }

  function openItemDetails(item: MenuItem) {
    if (isLocationEffectivelyClosed) {
      toast.error(`${t("location.closed")}, ${t("location.cannot_order")}`);
      return;
    }

    if (
      selectedAllergenIds.length > 0 &&
      item.allergens.some((a) => selectedAllergenIds.includes(a.id))
    ) {
      setAllergenWarningItem(item);
      return;
    }

    proceedToItemDetails(item);
  }

  function closeItemDetails() {
    setIsItemClosing(true);
    itemCloseTimeoutRef.current = setTimeout(() => {
      setEditingCartKey(null);
      setIsItemClosing(false);
      setSelectedItem(null);
      itemCloseTimeoutRef.current = null;
    }, modalAnimationDuration);
  }

  function handleAddToCart() {
    if (!selectedItem) return;
    addToCart(selectedItem, {
      drinkItems: selectedDrinkOptions,
      extraItems: selectedExtraOptions,
      quantity: modalQuantity,
      removedIngredientNames: selectedRemovedIngredientNames,
    });
    closeItemDetails();
  }

  function handleUpdateCartItem() {
    if (!selectedItem || !editingCartKey) return;
    updateCartItem(selectedItem, {
      drinkItems: selectedDrinkOptions,
      extraItems: selectedExtraOptions,
      removedIngredientNames: selectedRemovedIngredientNames,
    });
    closeItemDetails();
  }

  function openAuth() {
    if (authCloseTimeoutRef.current) {
      clearTimeout(authCloseTimeoutRef.current);
      authCloseTimeoutRef.current = null;
    }

    if (userEmail) {
      setIsUserClosing(false);
      setIsUserOpen(true);
    } else {
      setIsAuthClosing(false);
      setIsAuthOpen(true);
    }
  }

  function closeAuth() {
    setIsAuthClosing(true);
    authCloseTimeoutRef.current = setTimeout(() => {
      setIsAuthOpen(false);
      setIsAuthClosing(false);
      authCloseTimeoutRef.current = null;
    }, modalAnimationDuration);
  }

  function closeUser() {
    setIsUserClosing(true);
    setTimeout(() => {
      setIsUserOpen(false);
      setIsUserClosing(false);
    }, modalAnimationDuration);
  }

  function openInfo() {
    if (infoCloseTimeoutRef.current) {
      clearTimeout(infoCloseTimeoutRef.current);
      infoCloseTimeoutRef.current = null;
    }

    setIsInfoClosing(false);
    setIsInfoOpen(true);
  }

  function closeInfo() {
    setIsInfoClosing(true);
    infoCloseTimeoutRef.current = setTimeout(() => {
      setIsInfoOpen(false);
      setIsInfoClosing(false);
      infoCloseTimeoutRef.current = null;
    }, modalAnimationDuration);
  }

  function openLanguage() {
    if (languageCloseTimeoutRef.current) {
      clearTimeout(languageCloseTimeoutRef.current);
      languageCloseTimeoutRef.current = null;
    }

    setIsLanguageClosing(false);
    setIsLanguageOpen(true);
  }

  function closeLanguage() {
    setIsLanguageClosing(true);
    languageCloseTimeoutRef.current = setTimeout(() => {
      setIsLanguageOpen(false);
      setIsLanguageClosing(false);
      languageCloseTimeoutRef.current = null;
    }, modalAnimationDuration);
  }

  function openLocation() {
    if (locationCloseTimeoutRef.current) {
      clearTimeout(locationCloseTimeoutRef.current);
      locationCloseTimeoutRef.current = null;
    }

    setIsLocationClosing(false);
    setIsLocationOpen(true);
  }

  function closeLocation() {
    setIsLocationClosing(true);
    locationCloseTimeoutRef.current = setTimeout(() => {
      setIsLocationOpen(false);
      setIsLocationClosing(false);
      locationCloseTimeoutRef.current = null;
    }, modalAnimationDuration);
  }

  function openCart() {
    if (cartCloseTimeoutRef.current) {
      clearTimeout(cartCloseTimeoutRef.current);
      cartCloseTimeoutRef.current = null;
    }

    setIsCartClosing(false);
    setIsCartOpen(true);
  }

  function closeCart() {
    setIsCartClosing(true);
    cartCloseTimeoutRef.current = setTimeout(() => {
      setIsCartOpen(false);
      setIsCartClosing(false);
      cartCloseTimeoutRef.current = null;
    }, modalAnimationDuration);
  }

  function openAllergens() {
    if (allergensCloseTimeoutRef.current) {
      clearTimeout(allergensCloseTimeoutRef.current);
      allergensCloseTimeoutRef.current = null;
    }

    setIsAllergensClosing(false);
    setIsAllergensOpen(true);
  }

  async function handleSaveAllergens(ids: string[]) {
    setIsSavingAllergens(true);
    await saveAllergens(ids);
    setIsSavingAllergens(false);
    closeAllergens();

    const hasMatchingCartItem = cartItems.some((cartItem) =>
      cartItem.allergens.some((a) => ids.includes(a.id)),
    );

    if (ids.length > 0 && hasMatchingCartItem) {
      setIsCartAllergenWarningOpen(true);
    } else if (ids.length > 0 && cartItems.length === 0) {
      setIsAllergenActivatedClosing(false);
      setIsAllergenActivatedOpen(true);
    }
  }

  function closeCartAllergenWarning() {
    setIsCartAllergenWarningClosing(true);
    cartAllergenWarningCloseTimeoutRef.current = setTimeout(() => {
      setIsCartAllergenWarningOpen(false);
      setIsCartAllergenWarningClosing(false);
      cartAllergenWarningCloseTimeoutRef.current = null;
    }, modalAnimationDuration);
  }

  function closeAllergens() {
    setIsAllergensClosing(true);
    allergensCloseTimeoutRef.current = setTimeout(() => {
      setIsAllergensOpen(false);
      setIsAllergensClosing(false);
      allergensCloseTimeoutRef.current = null;
    }, modalAnimationDuration);
  }

  function openAuthFromAllergens() {
    openAuth();
  }

  function closeAllergenWarning() {
    setIsAllergenWarningClosing(true);
    allergenWarningCloseTimeoutRef.current = setTimeout(() => {
      setAllergenWarningItem(null);
      setIsAllergenWarningClosing(false);
      allergenWarningCloseTimeoutRef.current = null;
    }, modalAnimationDuration);
  }

  function closeAllergenActivated() {
    setIsAllergenActivatedClosing(true);
    allergenActivatedCloseTimeoutRef.current = setTimeout(() => {
      setIsAllergenActivatedOpen(false);
      setIsAllergenActivatedClosing(false);
      allergenActivatedCloseTimeoutRef.current = null;
    }, modalAnimationDuration);
  }

  function handleContinueFromAllergenWarning() {
    const item = allergenWarningItem;

    if (!item) return;

    closeAllergenWarning();
    proceedToItemDetails(item);
  }

  function handleSelectLocation(locationId: string) {
    selectLocation(locationId);
    clearCart();
    closeLocation();
    setIsCartOpen(false);
    setIsSearchOpen(false);
  }

  return (
    <>
      <LocationHero
        closingTime={closingTime}
        isLoading={!hasHydratedLocation}
        isAuthLoading={isAuthLoading}
        isOpenNow={isLocationEffectivelyOpen}
        onOpenAuth={openAuth}
        onOpenLocation={openLocation}
        onOpenInfo={openInfo}
        onOpenLanguage={openLanguage}
        selectedLocationImageUrl={selectedLocation?.image_url ?? null}
        selectedLocationName={selectedLocation?.name ?? null}
        userEmail={userEmail}
      />
      <section className="relative bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          {isInfoOpen ? (
            <RestaurantInfoDialog
              isClosing={isInfoClosing}
              onClose={closeInfo}
              address={selectedLocation?.address ?? null}
              isManuallyClosed={selectedLocation?.is_open === false}
              isOpenNow={isOpenNow ?? true}
              openingHours={selectedLocation?.opening_hours ?? null}
              phone={selectedLocation?.phone ?? null}
              socialLinks={socialLinks}
              title={selectedLocation?.name ?? null}
            />
          ) : null}

          {isLanguageOpen ? (
            <LanguageDialog isClosing={isLanguageClosing} onClose={closeLanguage} />
          ) : null}

          {isLocationOpen ? (
            <LocationDialog
              isClosing={isLocationClosing}
              locations={locations}
              onClose={closeLocation}
              onSelectLocation={handleSelectLocation}
              selectedLocationId={selectedLocationId}
            />
          ) : null}

          {isUserOpen ? <UserDialog isClosing={isUserClosing} onClose={closeUser} /> : null}

          {isCartOpen && shouldShowOrderContent ? (
            <div
              aria-labelledby="cart-title"
              aria-modal="true"
              className={`fixed inset-0 z-50 flex items-end bg-foreground/40 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6 ${
                isCartClosing
                  ? "animate-out fade-out-0 duration-300"
                  : "animate-in fade-in-0 duration-300"
              }`}
              role="dialog"
            >
              <div
                className={`flex h-[86dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl duration-300 sm:max-h-[90dvh] sm:max-w-md sm:rounded-3xl ${
                  isCartClosing
                    ? "animate-out slide-out-to-bottom-8"
                    : "animate-in slide-in-from-bottom-8"
                }`}
              >
                <CartPanel
                  cartItems={cartItems}
                  cartSubtotal={cartSubtotal}
                  currency={currency}
                  decrementCartItem={decrementCartItem}
                  incrementCartItem={incrementCartItem}
                  isLocationClosed={isLocationEffectivelyClosed}
                  key={selectedLocation.id}
                  locationId={selectedLocation.id}
                  locationName={selectedLocation.name}
                  onClose={closeCart}
                  onEditCartItem={openCartItemDetails}
                  onOpenAuth={openAuth}
                  openingHours={selectedLocation.opening_hours}
                  overrides={overridesByLocationId?.get(selectedLocation.id) ?? null}
                  titleId="cart-title"
                  userEmail={userEmail}
                />
              </div>
            </div>
          ) : null}

          {selectedItem && shouldShowOrderContent ? (
            <ItemDetailsDialog
              currency={currency}
              decrementCartItem={decrementCartItem}
              drinkOptions={drinkOptions}
              editingCartKey={editingCartKey}
              incrementCartItem={incrementCartItem}
              isClosing={isItemClosing}
              modalQuantity={modalQuantity}
              onAddToCart={handleAddToCart}
              onClose={closeItemDetails}
              onUpdateCartItem={handleUpdateCartItem}
              selectedActionPrice={selectedActionPrice}
              selectedCartItem={selectedCartItem}
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

          {shouldShowOrderContent ? (
            <CategoryNav
              categoryButtonRefs={categoryButtonRefs}
              categories={selectedCategories}
              navRef={categoryNavRef}
              onOpenSearch={() => setIsSearchOpen(true)}
              onSelectCategory={scrollToCategory}
              onSelectSubcategory={scrollToSubcategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              subcategories={activeSubcategories}
              subcategoryButtonRefs={subcategoryButtonRefs}
              subcategoryNavRef={subcategoryNavRef}
              visibleActiveCategoryId={visibleActiveCategoryId}
              visibleActiveSubcategoryId={visibleActiveSubcategoryId}
            />
          ) : null}

          {isAllergensOpen && shouldShowOrderContent ? (
            <AllergenDialog
              allergens={allAllergens}
              initialSelectedIds={selectedAllergenIds}
              isClosing={isAllergensClosing}
              isSaving={isSavingAllergens}
              onClose={closeAllergens}
              onOpenAuth={openAuthFromAllergens}
              onSave={handleSaveAllergens}
              userEmail={userEmail}
            />
          ) : null}

          {allergenWarningItem ? (
            <AllergenWarningModal
              isClosing={isAllergenWarningClosing}
              item={allergenWarningItem}
              onClose={closeAllergenWarning}
              onContinue={handleContinueFromAllergenWarning}
              selectedAllergenIds={selectedAllergenIds}
            />
          ) : null}

          {isCartAllergenWarningOpen ? (
            <CartAllergenWarningModal
              affectedItems={cartItems.filter((cartItem) =>
                cartItem.allergens.some((allergen) => selectedAllergenIds.includes(allergen.id)),
              )}
              isClosing={isCartAllergenWarningClosing}
              onClose={closeCartAllergenWarning}
              onRemoveItem={(cartKey) => {
                const affectedItems = cartItems.filter((cartItem) =>
                  cartItem.allergens.some((allergen) => selectedAllergenIds.includes(allergen.id)),
                );

                removeCartItem(cartKey);

                if (affectedItems.length === 1) {
                  closeCartAllergenWarning();
                }
              }}
              selectedAllergenIds={selectedAllergenIds}
            />
          ) : null}

          {isAllergenActivatedOpen ? (
            <AllergenActivatedModal
              allergens={allAllergens.filter((allergen) =>
                selectedAllergenIds.includes(allergen.id),
              )}
              isClosing={isAllergenActivatedClosing}
              onClose={closeAllergenActivated}
            />
          ) : null}

          {isSearchOpen && shouldShowOrderContent ? (
            <SearchDialog
              getItemCartQuantity={getItemCartQuantity}
              onClose={closeSearch}
              onSelectResult={selectSearchResult}
              searchQuery={searchQuery}
              searchResults={searchResults}
              selectedAllergenIds={selectedAllergenIds}
              setSearchQuery={setSearchQuery}
              trimmedSearchQuery={trimmedSearchQuery}
            />
          ) : null}

          {isAuthOpen ? (
            <AuthDialog
              isClosing={isAuthClosing}
              onClose={closeAuth}
              onLogin={() => {
                closeAuth();
              }}
            />
          ) : null}

          {!hasHydratedLocation || !selectedLocation ? (
            <>
              <div className="mb-6 text-center">
                <p className="text-sm text-foreground">{t("error.no_menu_for_location")}</p>
              </div>
              <OrderContentSkeleton />
            </>
          ) : null}

          {error ? (
            <Card className="mb-6 bg-card/90 p-6 text-sm font-semibold text-muted-foreground">
              {t("error.load_menu")}
            </Card>
          ) : null}

          {!error && shouldShowOrderContent && selectedCategories.length === 0 ? (
            <Card className="bg-card/90 p-6 text-sm font-semibold text-muted-foreground">
              {t("error.no_items")}
            </Card>
          ) : null}

          {shouldShowOrderContent ? (
            <MenuCategoryList
              categories={filteredCategories}
              categoryRefs={categoryRefs}
              currency={currency}
              getItemCartQuantity={getItemCartQuantity}
              hasBottomCartSpace={isCartButtonVisible}
              onOpenAllergens={openAllergens}
              onOpenItemDetails={openItemDetails}
              selectedAllergenIds={selectedAllergenIds}
              subcategoryRefs={subcategoryRefs}
            />
          ) : null}
          {shouldShowOrderContent ? (
            <footer className="mt-12" id="restaurant-info">
              <RestaurantInfoContent
                contentLayout="responsive"
                address={selectedLocation.address}
                isManuallyClosed={selectedLocation.is_open === false}
                isOpenNow={isOpenNow ?? true}
                openingHours={selectedLocation.opening_hours}
                phone={selectedLocation.phone}
                socialLinks={socialLinks}
                title={selectedLocation.name}
              />
            </footer>
          ) : null}
          {isCartButtonVisible ? <div aria-hidden="true" className="h-32" /> : null}
        </div>
      </section>
      {isCartButtonVisible ? (
        <div className="fixed bottom-4 left-1/2 z-40 w-full max-w-7xl -translate-x-1/2 px-4 sm:bottom-6 sm:px-6 lg:px-8">
          <Button
            aria-label={t("general.cart_aria", {
              quantity: cartQuantity,
              items: t(cartQuantity === 1 ? "common.item" : "common.items"),
            })}
            className="h-14 w-full rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-primary-hover"
            onClick={openCart}
            type="button"
          >
            <span className="grid min-w-6 place-items-center rounded-full px-2 leading-6 text-primary bg-primary-foreground">
              {cartQuantity}
            </span>
            {t("common.checkout")}
            <div aria-hidden="true" className="h-5 w-px bg-white relative right-0.5" />
            <span>{formatPrice(cartSubtotal)}</span>
          </Button>
        </div>
      ) : null}
    </>
  );
}

function OrderContentSkeleton() {
  const t = useTranslations();

  return (
    <div className="animate-pulse" aria-label={t("general.loading")} role="status">
      <div className="-mx-4 mb-6 overflow-hidden border-b border-border bg-white py-3 sm:-mx-6 lg:-mx-8">
        <div className="flex items-center gap-2 px-4 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-1 sm:hidden">
            <div className="size-9 rounded-md bg-gray-200" />
            <div className="h-6 w-px bg-gray-200" />
          </div>
          <div className="hidden h-9 w-48 shrink-0 rounded-md border border-border bg-card sm:block" />
          <div className="hidden h-6 w-px bg-gray-200 sm:block" />
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex w-max items-center gap-2">
              {[0, 1, 2, 3, 4].map((item) => (
                <div className="h-9 w-24 shrink-0 rounded-md bg-gray-200" key={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-10">
        {[0, 1].map((section) => (
          <section className="min-w-0 scroll-mt-24" key={section}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="h-8 w-36 rounded-md bg-gray-200" />
              {section === 0 ? (
                <div className="h-8 w-28 rounded-md border border-gray-200 bg-gray-100" />
              ) : null}
            </div>
            <div className="grid gap-4">
              {[0, 1, 2].map((item) => (
                <Card className="rounded-xl border-0 bg-card/90 p-0 shadow-sm" key={item}>
                  <div className="flex gap-3 overflow-hidden rounded-xl">
                    <div className="flex min-w-0 flex-1 flex-col px-4 py-3">
                      <div className="h-5 w-40 rounded-md bg-gray-200" />
                      <div className="mt-3 h-3.5 w-full rounded-md bg-gray-200" />
                      <div className="mt-2 h-3.5 w-4/5 rounded-md bg-gray-200" />
                      <div className="mt-5 h-5 w-16 rounded-md bg-gray-200" />
                    </div>
                    <div className="min-h-28 w-28 shrink-0 rounded-r-xl bg-gray-200 sm:min-h-32 sm:w-32" />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
      <span className="sr-only">{t("general.loading")}</span>
    </div>
  );
}

function LocationDialog({
  locations,
  onClose,
  onSelectLocation,
  selectedLocationId,
  isClosing,
}: {
  locations: Location[];
  onClose: () => void;
  onSelectLocation: (locationId: string) => void;
  selectedLocationId: string | null;
  isClosing: boolean;
}) {
  const t = useTranslations();

  return (
    <Modal isClosing={isClosing} onClose={onClose} className="sm:max-h-[90dvh]">
      <div className="px-5 pb-4 pt-14">
        <h2
          className="text-2xl font-black tracking-[-0.04em] text-foreground"
          id="location-select-title"
        >
          {t("location.choose_title")}
        </h2>
      </div>
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-5">
        {locations.length === 0 ? (
          <div className="rounded-2xl bg-card p-5 text-sm font-semibold text-muted-foreground">
            {t("location.no_locations")}
          </div>
        ) : null}

        {locations.map((location) => {
          const isSelected = location.id === selectedLocationId;
          const isManuallyClosed = location.is_open === false;
          const isClosedNow = isCurrentlyOpen(location.opening_hours) === false;

          return (
            <button
              aria-current={isSelected ? "true" : undefined}
              className={`flex w-full cursor-pointer items-start gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:bg-secondary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-current:border-primary aria-current:bg-primary/10 ${
                isClosedNow ? "opacity-60" : ""
              }`}
              key={location.id}
              onClick={() => onSelectLocation(location.id)}
              type="button"
            >
              <LocationThumbnail
                location={location}
                variant={isManuallyClosed ? "closed" : "open"}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-black tracking-tight">{location.name}</span>
                {location.address ? (
                  <span className="mt-1 block text-sm font-medium leading-5 text-muted-foreground">
                    {location.address}
                    <span className="mx-1.5 text-muted-foreground/40">|</span>
                    <span
                      className={
                        isManuallyClosed || isClosedNow ? "text-destructive" : "text-green-400"
                      }
                    >
                      {isManuallyClosed || isClosedNow ? t("location.closed") : t("location.open")}
                    </span>
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

function LocationThumbnail({
  location,
  variant,
}: {
  location: Location;
  variant: "closed" | "open";
}) {
  if (location.image_url) {
    return (
      <span
        className={`relative size-14 shrink-0 overflow-hidden rounded bg-secondary ${
          variant === "closed" ? "grayscale" : ""
        }`}
      >
        <Image alt="" className="object-cover" fill sizes="56px" src={location.image_url} />
      </span>
    );
  }

  return (
    <span
      className={`mt-1 grid size-10 shrink-0 place-items-center rounded-md ${
        variant === "closed"
          ? "bg-muted text-muted-foreground"
          : "bg-primary text-primary-foreground"
      }`}
    >
      <MapPin className="size-5" aria-hidden="true" />
    </span>
  );
}

function AllergenWarningModal({
  isClosing,
  item,
  onClose,
  onContinue,
  selectedAllergenIds,
}: {
  isClosing: boolean;
  item: MenuItem;
  onClose: () => void;
  onContinue: () => void;
  selectedAllergenIds: string[];
}) {
  const t = useTranslations();
  const matchedAllergens = item.allergens
    .filter((a) => selectedAllergenIds.includes(a.id))
    .map((a) => a.name)
    .join(", ");

  return (
    <Modal isClosing={isClosing} onClose={onClose}>
      <div className="flex flex-1 flex-col overflow-hidden p-5 pt-16 sm:p-6 sm:pt-16">
        <h2 className="text-xl font-black tracking-tight text-foreground">
          ⚠️ {t("item.allergens")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t("item.allergen_warning_text", { allergens: matchedAllergens })}
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            className="h-12 flex-1 rounded-md border-border bg-transparent text-base font-semibold shadow-none hover:bg-transparent"
            onClick={onClose}
            type="button"
            variant="outline"
          >
            {t("common.close")}
          </Button>
          <Button
            className="h-12 flex-1 rounded-md text-base font-semibold"
            onClick={onContinue}
            type="button"
          >
            {t("common.add")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CartAllergenWarningModal({
  affectedItems,
  isClosing,
  onClose,
  onRemoveItem,
  selectedAllergenIds,
}: {
  affectedItems: CartItem[];
  isClosing: boolean;
  onClose: () => void;
  onRemoveItem: (cartKey: string) => void;
  selectedAllergenIds: string[];
}) {
  const t = useTranslations();

  return (
    <Modal closeLabel={t("common.close")} isClosing={isClosing} onClose={onClose}>
      <div className="flex flex-1 flex-col overflow-hidden p-5 pt-16 sm:p-6 sm:pt-16">
        <h2 className="text-xl font-black tracking-tight text-foreground">
          ⚠️ {t("item.allergens")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t("cart.allergen_warning_text")}
        </p>
        <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {affectedItems.map((item) => {
            const matchedAllergens = item.allergens
              .filter((allergen) => selectedAllergenIds.includes(allergen.id))
              .map((allergen) => allergen.name)
              .join(", ");

            return (
              <div className="rounded-2xl border border-border bg-muted/40 p-4" key={item.cartKey}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-foreground">{item.name}</p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {t("cart.item_contains_allergens", { allergens: matchedAllergens })}
                    </p>
                    {item.quantity > 1 ? (
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">
                        {item.quantity} {t("common.items")}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    className="shrink-0 rounded-md"
                    onClick={() => onRemoveItem(item.cartKey)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {t("cart.remove_item")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex gap-3">
          <Button
            className="h-12 flex-1 rounded-md text-base font-semibold"
            onClick={onClose}
            type="button"
            variant="outline"
          >
            {t("common.close")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AllergenActivatedModal({
  allergens,
  isClosing,
  onClose,
}: {
  allergens: ItemAllergen[];
  isClosing: boolean;
  onClose: () => void;
}) {
  const t = useTranslations();

  return (
    <Modal closeLabel={t("common.close")} isClosing={isClosing} onClose={onClose}>
      <div className="flex flex-1 flex-col justify-between p-5 pt-16 text-center sm:p-6 sm:pt-16">
        <div>
          <div className="mx-auto flex size-16 items-center justify-center">
            <TriangleAlert
              className="size-14 fill-secondary text-foreground"
              aria-hidden="true"
              strokeWidth={2.6}
            />
          </div>
          <h2 className="mt-8 text-2xl font-black tracking-tight text-foreground">
            {t("item.allergen_alert_activated_title")}
          </h2>
          <p className="mt-4 text-base leading-6 text-muted-foreground">
            {t("item.allergen_alert_activated_text")}
          </p>
          {allergens.length > 0 ? (
            <div className="mx-auto mt-5 flex max-w-sm flex-wrap justify-center gap-3">
              {allergens.map((allergen) => (
                <span
                  className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"
                  key={allergen.id}
                >
                  <span aria-hidden="true">{getAllergenEmoji(allergen.name)}</span>
                  <span>{allergen.name}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <Button className="mt-10 h-12 w-full rounded-md text-base font-semibold" onClick={onClose}>
          {t("common.close")}
        </Button>
      </div>
    </Modal>
  );
}

function RestaurantInfoDialog({
  address,
  isClosing,
  isManuallyClosed,
  isOpenNow,
  onClose,
  openingHours,
  phone,
  socialLinks,
  title,
}: {
  address: string | null;
  isClosing: boolean;
  isManuallyClosed?: boolean;
  isOpenNow?: boolean;
  onClose: () => void;
  openingHours: OpeningHour[] | null;
  phone: string | null;
  socialLinks: RestaurantSocialLinks;
  title: string | null;
}) {
  const t = useTranslations();

  return (
    <div
      aria-labelledby="restaurant-info-title"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-end bg-foreground/40 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6 ${
        isClosing ? "animate-out fade-out-0 duration-300" : "animate-in fade-in-0 duration-300"
      }`}
      role="dialog"
    >
      <div
        className={`relative flex max-h-[86dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-[#f7f7f8] shadow-2xl duration-300 sm:max-h-[90dvh] sm:max-w-md sm:rounded-3xl ${
          isClosing ? "animate-out slide-out-to-bottom-8" : "animate-in slide-in-from-bottom-8"
        }`}
      >
        <Button
          aria-label={t("common.close")}
          className="absolute right-4 top-4 z-10 size-10 rounded-full bg-[#f7f7f8]/85 backdrop-blur hover:bg-[#f7f7f8]"
          onClick={onClose}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X className="size-5" aria-hidden="true" />
        </Button>
        <div className="no-scrollbar flex-1 overflow-y-auto">
          <RestaurantInfoContent
            address={address}
            isManuallyClosed={isManuallyClosed}
            isOpenNow={isOpenNow}
            openingHours={openingHours}
            phone={phone}
            socialLinks={socialLinks}
            title={title}
            titleId="restaurant-info-title"
          />
        </div>
      </div>
    </div>
  );
}
