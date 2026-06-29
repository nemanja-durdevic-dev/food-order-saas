-- Migration 023: Option groups — replaces add_ons, ingredients with a unified field/option system

-- 1. Option groups (global reusable templates)
create table public.option_groups (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  name_no text,
  name_sv text,
  name_da text,
  description text,
  description_no text,
  description_sv text,
  description_da text,
  is_required boolean not null default false,
  is_multi_select boolean not null default false,
  min_select integer not null default 0,
  max_select integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Choices within a group
create table public.option_group_choices (
  id uuid primary key default gen_random_uuid(),
  option_group_id uuid not null references public.option_groups(id) on delete cascade,
  name text not null,
  name_no text,
  name_sv text,
  name_da text,
  price_modifier_type text not null default 'neutral' check (price_modifier_type in ('increase', 'decrease', 'neutral')),
  price_modifier numeric(10,2) not null default 0 check (price_modifier >= 0),
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Assign groups to items (with per-item overrides)
create table public.menu_item_option_groups (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  option_group_id uuid not null references public.option_groups(id) on delete cascade,
  sort_order integer not null default 0,
  is_required boolean,
  is_multi_select boolean,
  min_select integer,
  max_select integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (menu_item_id, option_group_id)
);

-- 4. Per-item choice selection (which choices from the global pool this item offers)
create table public.menu_item_option_group_choices (
  id uuid primary key default gen_random_uuid(),
  menu_item_option_group_id uuid not null references public.menu_item_option_groups(id) on delete cascade,
  option_group_choice_id uuid not null references public.option_group_choices(id) on delete cascade,
  price_modifier_type text check (price_modifier_type in ('increase', 'decrease', 'neutral')),
  price_modifier numeric(10,2) check (price_modifier >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (menu_item_option_group_id, option_group_choice_id)
);

-- Indexes
create index option_groups_restaurant_id_idx on public.option_groups (restaurant_id);
create index option_group_choices_group_id_idx on public.option_group_choices (option_group_id);
create unique index option_groups_restaurant_name_idx on public.option_groups (restaurant_id, name);
create index menu_item_option_groups_item_idx on public.menu_item_option_groups (menu_item_id);
create index menu_item_option_groups_group_idx on public.menu_item_option_groups (option_group_id);
create index menu_item_option_group_choices_assignment_idx on public.menu_item_option_group_choices (menu_item_option_group_id);

-- Triggers
create trigger option_groups_set_updated_at before update on public.option_groups for each row execute function public.set_updated_at();
create trigger option_group_choices_set_updated_at before update on public.option_group_choices for each row execute function public.set_updated_at();
create trigger menu_item_option_groups_set_updated_at before update on public.menu_item_option_groups for each row execute function public.set_updated_at();
create trigger menu_item_option_group_choices_set_updated_at before update on public.menu_item_option_group_choices for each row execute function public.set_updated_at();

-- Enable RLS
alter table public.option_groups enable row level security;
alter table public.option_group_choices enable row level security;
alter table public.menu_item_option_groups enable row level security;
alter table public.menu_item_option_group_choices enable row level security;

-- RLS policies (public read)
create policy "Option groups are publicly readable" on public.option_groups for select to anon, authenticated using (true);
create policy "Option group choices are publicly readable" on public.option_group_choices for select to anon, authenticated using (true);
create policy "Menu item option groups are publicly readable" on public.menu_item_option_groups for select to anon, authenticated using (true);
create policy "Menu item option group choices are publicly readable" on public.menu_item_option_group_choices for select to anon, authenticated using (true);

-- Admin RLS policies
create policy "Admins can manage option groups"
  on public.option_groups
  for all
  using (
    restaurant_id in (
      select restaurant_id from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  )
  with check (
    restaurant_id in (
      select restaurant_id from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

create policy "Admins can manage menu item option groups"
  on public.menu_item_option_groups
  for all
  using (
    restaurant_id in (
      select restaurant_id from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  )
  with check (
    restaurant_id in (
      select restaurant_id from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

-- Drop old tables
drop table if exists public.menu_item_ingredients cascade;
drop table if exists public.ingredients cascade;
drop table if exists public.menu_item_add_on_options cascade;
drop table if exists public.add_on_options cascade;

-- Grants for new tables
grant select on public.option_groups to anon, authenticated;
grant select, insert, update, delete on public.option_groups to authenticated;
grant select on public.option_group_choices to anon, authenticated;
grant select, insert, update, delete on public.option_group_choices to authenticated;
grant select on public.menu_item_option_groups to anon, authenticated;
grant select, insert, update, delete on public.menu_item_option_groups to authenticated;
grant select on public.menu_item_option_group_choices to anon, authenticated;
grant select, insert, update, delete on public.menu_item_option_group_choices to authenticated;
