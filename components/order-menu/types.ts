export type MenuItem = {
  addOnOptions: ModifierOption[];
  allergens: ItemAllergen[];
  availableLocationIds: string[];
  id: string;
  ingredients: ItemIngredient[];
  is_available: boolean;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number | string;
};

export type MenuCategory = {
  id: string;
  name: string;
  menu_items: MenuItem[];
};

export type ModifierOption = {
  id: string;
  name: string;
  price: number;
};

export type ItemIngredient = {
  id: string;
  name: string;
};

export type ItemAllergen = {
  id: string;
  name: string;
};

export type CartItem = MenuItem & {
  basePrice: number | string;
  cartKey: string;
  drinkItems: MenuItem[];
  extraItems: ModifierOption[];
  quantity: number;
  removedIngredients: string[];
};

export type Location = {
  address: string | null;
  id: string;
  image_url: string | null;
  is_open: boolean | null;
  name: string;
  opening_hours: OpeningHour[] | null;
  phone: string | null;
};

export type OpeningHour = {
  day: number;
  closed?: true;
  open?: string;
  close?: string;
};

export type OrderMenuProps = {
  allAllergens: ItemAllergen[];
  categories: MenuCategory[];
  error?: string;
  locations: Location[];
};
