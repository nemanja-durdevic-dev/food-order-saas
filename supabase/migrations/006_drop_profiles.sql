-- Drop profiles table, rename profile_id to user_id across all tables

-- Drop dependent foreign keys before renaming columns
alter table public.carts
  drop constraint carts_profile_id_fkey;

alter table public.orders
  drop constraint orders_profile_id_fkey;

alter table public.reviews
  drop constraint reviews_profile_id_fkey;

-- Drop RLS policies that reference profile_id before renaming
drop policy if exists "Carts are readable by owner" on public.carts;
drop policy if exists "Carts are insertable by owner" on public.carts;
drop policy if exists "Carts are updatable by owner" on public.carts;
drop policy if exists "Carts are deletable by owner" on public.carts;
drop policy if exists "Cart items are readable by cart owner" on public.cart_items;
drop policy if exists "Cart items are insertable by cart owner" on public.cart_items;
drop policy if exists "Cart items are updatable by cart owner" on public.cart_items;
drop policy if exists "Cart items are deletable by cart owner" on public.cart_items;
drop policy if exists "Orders are readable by owner" on public.orders;
drop policy if exists "Order items are readable by order owner" on public.order_items;
drop policy if exists "Reviews are insertable by owner" on public.reviews;
drop policy if exists "Reviews are updatable by owner" on public.reviews;
drop policy if exists "Reviews are deletable by owner" on public.reviews;

-- Rename columns
alter table public.carts
  rename column profile_id to user_id;

alter table public.orders
  rename column profile_id to user_id;

alter table public.reviews
  rename column profile_id to user_id;

-- Rebuild indexes under new names
drop index if exists carts_profile_id_idx;
drop index if exists orders_profile_id_idx;
drop index if exists reviews_profile_id_idx;

create index carts_user_id_idx on public.carts (user_id);
create index orders_user_id_idx on public.orders (user_id);
create index reviews_user_id_idx on public.reviews (user_id);

-- Recreate foreign keys referencing auth.users directly
alter table public.carts
  add constraint carts_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.orders
  add constraint orders_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete restrict;

alter table public.reviews
  add constraint reviews_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- Recreate RLS policies with updated column references
create policy "Carts are readable by owner"
on public.carts for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Carts are insertable by owner"
on public.carts for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Carts are updatable by owner"
on public.carts for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Carts are deletable by owner"
on public.carts for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Cart items are readable by cart owner"
on public.cart_items for select
to authenticated
using (
  exists (
    select 1
    from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
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
      and carts.user_id = (select auth.uid())
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
      and carts.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.carts
    where carts.id = cart_items.cart_id
      and carts.user_id = (select auth.uid())
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
      and carts.user_id = (select auth.uid())
  )
);

create policy "Orders are readable by owner"
on public.orders for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Order items are readable by order owner"
on public.order_items for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = (select auth.uid())
  )
);

create policy "Reviews are insertable by owner"
on public.reviews for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.orders
    where orders.id = reviews.order_id
      and orders.user_id = (select auth.uid())
      and orders.status = 'completed'
  )
);

create policy "Reviews are updatable by owner"
on public.reviews for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.orders
    where orders.id = reviews.order_id
      and orders.user_id = (select auth.uid())
      and orders.status = 'completed'
  )
);

create policy "Reviews are deletable by owner"
on public.reviews for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Drop profiles table and its associated objects
do $$ begin
  if exists (select from information_schema.tables where table_schema = 'public' and table_name = 'profiles') then
    drop trigger if exists profiles_set_updated_at on public.profiles;
    drop policy if exists "Profiles are readable by owner" on public.profiles;
    drop policy if exists "Profiles are insertable by owner" on public.profiles;
    drop policy if exists "Profiles are updatable by owner" on public.profiles;
    drop index if exists profiles_email_idx;
    drop index if exists profiles_phone_idx;
    drop table if exists public.profiles;
  end if;
end $$;
