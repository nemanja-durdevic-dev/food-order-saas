create table public.add_on_options (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table public.allergens (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table public.menu_item_add_on_options (
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  add_on_option_id uuid not null references public.add_on_options(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (menu_item_id, add_on_option_id)
);

create table public.menu_item_ingredients (
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  is_removable boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (menu_item_id, ingredient_id)
);

create table public.menu_item_allergens (
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  allergen_id uuid not null references public.allergens(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (menu_item_id, allergen_id)
);

create index add_on_options_available_idx on public.add_on_options (is_available);
create index menu_item_add_on_options_add_on_option_id_idx on public.menu_item_add_on_options (add_on_option_id);
create index menu_item_ingredients_ingredient_id_idx on public.menu_item_ingredients (ingredient_id);
create index menu_item_ingredients_removable_idx on public.menu_item_ingredients (menu_item_id, is_removable);
create index menu_item_allergens_allergen_id_idx on public.menu_item_allergens (allergen_id);

create trigger add_on_options_set_updated_at
before update on public.add_on_options
for each row execute function public.set_updated_at();

create trigger ingredients_set_updated_at
before update on public.ingredients
for each row execute function public.set_updated_at();

create trigger allergens_set_updated_at
before update on public.allergens
for each row execute function public.set_updated_at();

alter table public.add_on_options enable row level security;
alter table public.ingredients enable row level security;
alter table public.allergens enable row level security;
alter table public.menu_item_add_on_options enable row level security;
alter table public.menu_item_ingredients enable row level security;
alter table public.menu_item_allergens enable row level security;

create policy "Add-on options are publicly readable"
on public.add_on_options for select
to anon, authenticated
using (is_available = true);

create policy "Ingredients are publicly readable"
on public.ingredients for select
to anon, authenticated
using (true);

create policy "Allergens are publicly readable"
on public.allergens for select
to anon, authenticated
using (true);

create policy "Menu item add-ons are publicly readable"
on public.menu_item_add_on_options for select
to anon, authenticated
using (
  exists (
    select 1
    from public.add_on_options
    where add_on_options.id = menu_item_add_on_options.add_on_option_id
      and add_on_options.is_available = true
  )
);

create policy "Menu item ingredients are publicly readable"
on public.menu_item_ingredients for select
to anon, authenticated
using (is_removable = true);

create policy "Menu item allergens are publicly readable"
on public.menu_item_allergens for select
to anon, authenticated
using (true);

grant select on public.add_on_options to anon, authenticated;
grant select on public.ingredients to anon, authenticated;
grant select on public.allergens to anon, authenticated;
grant select on public.menu_item_add_on_options to anon, authenticated;
grant select on public.menu_item_ingredients to anon, authenticated;
grant select on public.menu_item_allergens to anon, authenticated;
