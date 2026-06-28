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
  subcategory_id?: string | null;
};

export type MenuSubcategory = {
  id: string;
  name: string;
  menu_items: MenuItem[];
};

export type MenuCategory = {
  availableLocationIds?: string[];
  id: string;
  name: string;
  menu_items: MenuItem[];
  subcategories: MenuSubcategory[];
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
  currency: string;
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

export type HoursOverride = {
  date: string;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
};

export type RestaurantSocialLinks = {
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
};

export type RestaurantInfo = {
  name: string;
  logo_url: string | null;
};

export type OrderMenuProps = {
  allAllergens: ItemAllergen[];
  categories: MenuCategory[];
  error?: string;
  locations: Location[];
  overridesByLocationId?: Map<string, HoursOverride[]>;
  socialLinks: RestaurantSocialLinks;
  restaurantInfo: RestaurantInfo;
};
