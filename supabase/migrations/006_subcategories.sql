create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  name_no text,
  name_sv text,
  name_da text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.menu_items
add column subcategory_id uuid references public.subcategories(id) on delete set null;

create unique index subcategories_category_name_idx on public.subcategories (category_id, name);
create index subcategories_restaurant_category_idx on public.subcategories (restaurant_id, category_id, sort_order);
create index menu_items_restaurant_subcategory_idx on public.menu_items (restaurant_id, subcategory_id);

create trigger subcategories_set_updated_at before update on public.subcategories for each row execute function public.set_updated_at();

alter table public.subcategories enable row level security;

create policy "Subcategories are publicly readable" on public.subcategories for select to anon, authenticated using (true);

grant select on public.subcategories to anon, authenticated;
grant all on public.subcategories to service_role;
