-- Drop carts and cart_items tables — unused, cart is localStorage-only.

drop trigger if exists cart_items_validate_menu_item on public.cart_items;
drop function if exists public.validate_cart_item_menu_item();

drop trigger if exists carts_set_updated_at on public.carts;
drop trigger if exists cart_items_set_updated_at on public.cart_items;

drop policy if exists "Carts are readable by owner" on public.carts;
drop policy if exists "Carts are insertable by owner" on public.carts;
drop policy if exists "Carts are updatable by owner" on public.carts;
drop policy if exists "Carts are deletable by owner" on public.carts;

drop policy if exists "Cart items are readable by cart owner" on public.cart_items;
drop policy if exists "Cart items are insertable by cart owner" on public.cart_items;
drop policy if exists "Cart items are updatable by cart owner" on public.cart_items;
drop policy if exists "Cart items are deletable by cart owner" on public.cart_items;

drop index if exists cart_items_cart_id_idx;
drop index if exists cart_items_menu_item_id_idx;
drop index if exists carts_user_id_idx;
drop index if exists carts_location_id_idx;

alter table public.cart_items
  drop constraint cart_items_cart_id_fkey;

alter table public.carts
  drop constraint carts_user_id_fkey;

drop table public.cart_items;
drop table public.carts;
