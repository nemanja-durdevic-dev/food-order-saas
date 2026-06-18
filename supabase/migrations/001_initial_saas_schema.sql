create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  logo_url text,
  cover_image_url text,
  brand_color text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug),
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  address text,
  phone text,
  image_url text,
  is_open boolean not null default true,
  opening_hours jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  name_no text,
  name_sv text,
  name_da text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  name_no text,
  name_sv text,
  name_da text,
  description text,
  description_no text,
  description_sv text,
  description_da text,
  image_url text,
  price numeric(10, 2) not null check (price >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_item_locations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.add_on_options (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  name_no text,
  name_sv text,
  name_da text,
  price numeric(10, 2) not null default 0 check (price >= 0),
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  name_no text,
  name_sv text,
  name_da text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.allergens (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  name_no text,
  name_sv text,
  name_da text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_item_add_on_options (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  add_on_option_id uuid not null references public.add_on_options(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_item_ingredients (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  is_removable boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menu_item_allergens (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  allergen_id uuid not null references public.allergens(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  customizations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, menu_item_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  location_id uuid references public.locations(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'failed', 'refunded')),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  total numeric(10, 2) not null check (total >= 0),
  customer_notes text,
  order_code text,
  order_timing text not null default 'asap' check (order_timing in ('asap', 'preorder')),
  preorder_date date,
  preorder_time time,
  stripe_session_id text,
  vipps_payment_reference text,
  expected_ready_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  total numeric(10, 2) not null check (total >= 0),
  customizations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, order_id)
);

create sequence public.order_number_seq;

create or replace function public.increment_order_number()
returns bigint
language sql
as $$
  select nextval('public.order_number_seq');
$$;

create or replace function public.validate_cart_item_menu_item()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.carts
    join public.menu_items on menu_items.id = new.menu_item_id
    join public.menu_item_locations on menu_item_locations.menu_item_id = menu_items.id
    where carts.id = new.cart_id
      and menu_items.restaurant_id = carts.restaurant_id
      and menu_item_locations.restaurant_id = carts.restaurant_id
      and menu_item_locations.location_id = carts.location_id
      and menu_items.is_available = true
      and menu_item_locations.is_available = true
  ) then
    raise exception 'Cart item must belong to the cart restaurant and be available at the cart location.';
  end if;

  return new;
end;
$$;

create unique index locations_restaurant_name_idx on public.locations (restaurant_id, name);
create unique index categories_restaurant_name_idx on public.categories (restaurant_id, name);
create unique index menu_items_restaurant_name_idx on public.menu_items (restaurant_id, name);
create unique index menu_item_locations_item_location_idx on public.menu_item_locations (menu_item_id, location_id);
create unique index add_on_options_restaurant_name_idx on public.add_on_options (restaurant_id, name);
create unique index menu_item_add_on_options_item_option_idx on public.menu_item_add_on_options (menu_item_id, add_on_option_id);
create unique index menu_item_ingredients_item_ingredient_idx on public.menu_item_ingredients (menu_item_id, ingredient_id);
create unique index menu_item_allergens_item_allergen_idx on public.menu_item_allergens (menu_item_id, allergen_id);
create unique index carts_restaurant_user_id_idx on public.carts (restaurant_id, user_id);
create index menu_items_restaurant_category_idx on public.menu_items (restaurant_id, category_id);
create index orders_user_id_idx on public.orders (user_id);
create index orders_restaurant_created_at_idx on public.orders (restaurant_id, created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);
create index reviews_restaurant_id_idx on public.reviews (restaurant_id);

create trigger restaurants_set_updated_at before update on public.restaurants for each row execute function public.set_updated_at();
create trigger locations_set_updated_at before update on public.locations for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger menu_items_set_updated_at before update on public.menu_items for each row execute function public.set_updated_at();
create trigger menu_item_locations_set_updated_at before update on public.menu_item_locations for each row execute function public.set_updated_at();
create trigger add_on_options_set_updated_at before update on public.add_on_options for each row execute function public.set_updated_at();
create trigger ingredients_set_updated_at before update on public.ingredients for each row execute function public.set_updated_at();
create trigger allergens_set_updated_at before update on public.allergens for each row execute function public.set_updated_at();
create trigger menu_item_add_on_options_set_updated_at before update on public.menu_item_add_on_options for each row execute function public.set_updated_at();
create trigger menu_item_ingredients_set_updated_at before update on public.menu_item_ingredients for each row execute function public.set_updated_at();
create trigger menu_item_allergens_set_updated_at before update on public.menu_item_allergens for each row execute function public.set_updated_at();
create trigger carts_set_updated_at before update on public.carts for each row execute function public.set_updated_at();
create trigger cart_items_set_updated_at before update on public.cart_items for each row execute function public.set_updated_at();
create trigger cart_items_validate_menu_item before insert or update on public.cart_items for each row execute function public.validate_cart_item_menu_item();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews for each row execute function public.set_updated_at();

alter table public.restaurants enable row level security;
alter table public.locations enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_item_locations enable row level security;
alter table public.add_on_options enable row level security;
alter table public.ingredients enable row level security;
alter table public.allergens enable row level security;
alter table public.menu_item_add_on_options enable row level security;
alter table public.menu_item_ingredients enable row level security;
alter table public.menu_item_allergens enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

create policy "Active restaurants are publicly readable" on public.restaurants for select to anon, authenticated using (status = 'active');
create policy "Locations are publicly readable" on public.locations for select to anon, authenticated using (true);
create policy "Categories are publicly readable" on public.categories for select to anon, authenticated using (true);
create policy "Available menu items are publicly readable" on public.menu_items for select to anon, authenticated using (is_available = true);
create policy "Available menu item locations are publicly readable" on public.menu_item_locations for select to anon, authenticated using (is_available = true);
create policy "Available add ons are publicly readable" on public.add_on_options for select to anon, authenticated using (is_available = true);
create policy "Ingredients are publicly readable" on public.ingredients for select to anon, authenticated using (true);
create policy "Allergens are publicly readable" on public.allergens for select to anon, authenticated using (true);
create policy "Available menu item add ons are publicly readable" on public.menu_item_add_on_options for select to anon, authenticated using (
  exists (
    select 1 from public.add_on_options
    where add_on_options.id = menu_item_add_on_options.add_on_option_id
      and add_on_options.is_available = true
  )
);
create policy "Removable menu item ingredients are publicly readable" on public.menu_item_ingredients for select to anon, authenticated using (is_removable = true);
create policy "Menu item allergens are publicly readable" on public.menu_item_allergens for select to anon, authenticated using (true);
create policy "Reviews are publicly readable" on public.reviews for select to anon, authenticated using (true);

create policy "Carts are readable by owner" on public.carts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Carts are insertable by owner" on public.carts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Carts are updatable by owner" on public.carts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Carts are deletable by owner" on public.carts for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Cart items are readable by cart owner" on public.cart_items for select to authenticated using (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid())));
create policy "Cart items are insertable by cart owner" on public.cart_items for insert to authenticated with check (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid())));
create policy "Cart items are updatable by cart owner" on public.cart_items for update to authenticated using (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid()))) with check (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid())));
create policy "Cart items are deletable by cart owner" on public.cart_items for delete to authenticated using (exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = (select auth.uid())));

create policy "Orders are readable by owner" on public.orders for select to authenticated using ((select auth.uid()) = user_id);
create policy "Orders are insertable by owner" on public.orders for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Orders are updatable by owner" on public.orders for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Orders are deletable by owner" on public.orders for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Order items are readable by order owner" on public.order_items for select to authenticated using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = (select auth.uid())));
create policy "Order items are insertable by order owner" on public.order_items for insert to authenticated with check (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = (select auth.uid())));
create policy "Order items are updatable by order owner" on public.order_items for update to authenticated using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = (select auth.uid()))) with check (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = (select auth.uid())));
create policy "Order items are deletable by order owner" on public.order_items for delete to authenticated using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = (select auth.uid())));

create policy "Reviews are insertable by owner" on public.reviews for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Reviews are updatable by owner" on public.reviews for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Reviews are deletable by owner" on public.reviews for delete to authenticated using ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select on public.restaurants to anon, authenticated;
grant select on public.locations to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.menu_items to anon, authenticated;
grant select on public.menu_item_locations to anon, authenticated;
grant select on public.add_on_options to anon, authenticated;
grant select on public.ingredients to anon, authenticated;
grant select on public.allergens to anon, authenticated;
grant select on public.menu_item_add_on_options to anon, authenticated;
grant select on public.menu_item_ingredients to anon, authenticated;
grant select on public.menu_item_allergens to anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant select, insert, update, delete on public.carts to authenticated;
grant select, insert, update, delete on public.cart_items to authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant usage on sequence public.order_number_seq to authenticated;
