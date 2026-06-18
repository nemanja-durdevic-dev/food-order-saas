create table public.menu_item_locations (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (menu_item_id, location_id)
);

insert into public.menu_item_locations (menu_item_id, location_id, is_available)
select menu_items.id, locations.id, true
from public.menu_items
cross join public.locations
on conflict (menu_item_id, location_id) do nothing;

create index menu_item_locations_menu_item_id_idx on public.menu_item_locations (menu_item_id);
create index menu_item_locations_location_id_idx on public.menu_item_locations (location_id);
create index menu_item_locations_available_idx on public.menu_item_locations (location_id, is_available);

create trigger menu_item_locations_set_updated_at
before update on public.menu_item_locations
for each row execute function public.set_updated_at();

alter table public.menu_item_locations enable row level security;

create policy "Location menu availability is publicly readable"
on public.menu_item_locations for select
to anon, authenticated
using (is_available = true);

grant select on public.menu_item_locations to anon, authenticated;

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
      and menu_item_locations.location_id = carts.location_id
    where carts.id = new.cart_id
      and menu_items.is_available = true
      and menu_item_locations.is_available = true
  ) then
    raise exception 'Cart item must be available at the cart location.';
  end if;

  return new;
end;
$$;
