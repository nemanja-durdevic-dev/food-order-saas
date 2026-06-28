-- Ingredients, allergens, and add-ons are shared platform catalogs.
-- Menu-item join tables keep restaurant_id for fast restaurant-scoped queries.

with ranked_add_ons as (
  select
    id,
    first_value(id) over (partition by name order by created_at, id) as canonical_id
  from public.add_on_options
), duplicate_add_ons as (
  select id, canonical_id
  from ranked_add_ons
  where id <> canonical_id
), conflicting_links as (
  select menu_item_add_on_options.id
  from public.menu_item_add_on_options
  join duplicate_add_ons on duplicate_add_ons.id = menu_item_add_on_options.add_on_option_id
  where exists (
    select 1
    from public.menu_item_add_on_options existing_link
    where existing_link.menu_item_id = menu_item_add_on_options.menu_item_id
      and existing_link.add_on_option_id = duplicate_add_ons.canonical_id
      and existing_link.id <> menu_item_add_on_options.id
  )
)
delete from public.menu_item_add_on_options
using conflicting_links
where menu_item_add_on_options.id = conflicting_links.id;

with ranked_add_ons as (
  select
    id,
    first_value(id) over (partition by name order by created_at, id) as canonical_id
  from public.add_on_options
), duplicate_add_ons as (
  select id, canonical_id
  from ranked_add_ons
  where id <> canonical_id
)
update public.menu_item_add_on_options
set add_on_option_id = duplicate_add_ons.canonical_id
from duplicate_add_ons
where menu_item_add_on_options.add_on_option_id = duplicate_add_ons.id;

with ranked_add_ons as (
  select
    id,
    first_value(id) over (partition by name order by created_at, id) as canonical_id
  from public.add_on_options
), duplicate_add_ons as (
  select id
  from ranked_add_ons
  where id <> canonical_id
)
delete from public.add_on_options
using duplicate_add_ons
where add_on_options.id = duplicate_add_ons.id;

drop index if exists public.add_on_options_restaurant_name_idx;

alter table public.add_on_options
  alter column restaurant_id drop not null;

update public.add_on_options
set restaurant_id = null
where restaurant_id is not null;

create unique index if not exists add_on_options_name_idx on public.add_on_options (name);
