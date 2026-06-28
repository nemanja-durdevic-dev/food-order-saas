create table public.category_locations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.category_locations enable row level security;

create unique index category_locations_category_location_idx
  on public.category_locations (category_id, location_id);

create index category_locations_restaurant_location_idx
  on public.category_locations (restaurant_id, location_id);

insert into public.category_locations (restaurant_id, category_id, location_id)
select categories.restaurant_id, categories.id, locations.id
from public.categories
join public.locations on locations.restaurant_id = categories.restaurant_id
on conflict (category_id, location_id) do nothing;

create trigger category_locations_set_updated_at
  before update on public.category_locations
  for each row execute function public.set_updated_at();

create policy "Category locations are publicly readable"
  on public.category_locations for select
  to anon, authenticated
  using (true);

grant select on public.category_locations to anon, authenticated;
