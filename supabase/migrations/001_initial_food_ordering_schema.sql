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
    where carts.id = new.cart_id
      and menu_items.is_available = true
  ) then
    raise exception 'Cart item must be an available menu item.';
  end if;

  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text not null,
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  image_url text,
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  image_url text,
  price numeric(10, 2) not null check (price >= 0),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id)
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, menu_item_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  location_id uuid references public.locations(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready_for_pickup', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'failed', 'refunded')),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  total numeric(10, 2) not null check (total >= 0),
  customer_notes text,
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
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, order_id)
);

create unique index profiles_email_idx on public.profiles (email) where email is not null;
create unique index profiles_phone_idx on public.profiles (phone);
create unique index locations_name_idx on public.locations (name);
create index menu_items_category_id_idx on public.menu_items (category_id);
create unique index menu_items_name_idx on public.menu_items (name);
create index menu_items_available_idx on public.menu_items (is_available);
create index carts_profile_id_idx on public.carts (profile_id);
create index carts_location_id_idx on public.carts (location_id);
create index cart_items_cart_id_idx on public.cart_items (cart_id);
create index cart_items_menu_item_id_idx on public.cart_items (menu_item_id);
create index orders_profile_id_idx on public.orders (profile_id);
create index orders_location_id_idx on public.orders (location_id);
create index orders_created_at_idx on public.orders (created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_menu_item_id_idx on public.order_items (menu_item_id);
create index reviews_profile_id_idx on public.reviews (profile_id);
create index reviews_order_id_idx on public.reviews (order_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger locations_set_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger menu_items_set_updated_at
before update on public.menu_items
for each row execute function public.set_updated_at();

create trigger carts_set_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

create trigger cart_items_validate_menu_item
before insert or update on public.cart_items
for each row execute function public.validate_cart_item_menu_item();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

create policy "Profiles are readable by owner"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "Profiles are insertable by owner"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Profiles are updatable by owner"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Locations are publicly readable"
on public.locations for select
to anon, authenticated
using (true);

create policy "Categories are publicly readable"
on public.categories for select
to anon, authenticated
using (true);

create policy "Menu items are publicly readable"
on public.menu_items for select
to anon, authenticated
using (is_available = true);

create policy "Carts are readable by owner"
on public.carts for select
to authenticated
using ((select auth.uid()) = profile_id);

create policy "Carts are insertable by owner"
on public.carts for insert
to authenticated
with check ((select auth.uid()) = profile_id);

create policy "Carts are updatable by owner"
on public.carts for update
to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

create policy "Carts are deletable by owner"
on public.carts for delete
to authenticated
using ((select auth.uid()) = profile_id);

create policy "Cart items are readable by cart owner"
on public.cart_items for select
to authenticated
using (
  exists (
    select 1
    from public.carts
    where carts.id = cart_items.cart_id
      and carts.profile_id = (select auth.uid())
  )
);

create policy "Cart items are insertable by cart owner"
on public.cart_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.carts
    where carts.id = cart_items.cart_id
      and carts.profile_id = (select auth.uid())
  )
);

create policy "Cart items are updatable by cart owner"
on public.cart_items for update
to authenticated
using (
  exists (
    select 1
    from public.carts
    where carts.id = cart_items.cart_id
      and carts.profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.carts
    where carts.id = cart_items.cart_id
      and carts.profile_id = (select auth.uid())
  )
);

create policy "Cart items are deletable by cart owner"
on public.cart_items for delete
to authenticated
using (
  exists (
    select 1
    from public.carts
    where carts.id = cart_items.cart_id
      and carts.profile_id = (select auth.uid())
  )
);

create policy "Orders are readable by owner"
on public.orders for select
to authenticated
using ((select auth.uid()) = profile_id);

create policy "Order items are readable by order owner"
on public.order_items for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.profile_id = (select auth.uid())
  )
);

create policy "Reviews are publicly readable"
on public.reviews for select
to anon, authenticated
using (true);

create policy "Reviews are insertable by owner"
on public.reviews for insert
to authenticated
with check (
  (select auth.uid()) = profile_id
  and exists (
    select 1
    from public.orders
    where orders.id = reviews.order_id
      and orders.profile_id = (select auth.uid())
      and orders.status = 'completed'
  )
);

create policy "Reviews are updatable by owner"
on public.reviews for update
to authenticated
using ((select auth.uid()) = profile_id)
with check (
  (select auth.uid()) = profile_id
  and exists (
    select 1
    from public.orders
    where orders.id = reviews.order_id
      and orders.profile_id = (select auth.uid())
      and orders.status = 'completed'
  )
);

create policy "Reviews are deletable by owner"
on public.reviews for delete
to authenticated
using ((select auth.uid()) = profile_id);
