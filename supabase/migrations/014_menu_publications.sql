alter table public.restaurants
  add column if not exists menu_dirty boolean not null default true,
  add column if not exists menu_published_at timestamptz;

create table if not exists public.menu_publications (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  published_by uuid references auth.users(id) on delete set null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists menu_publications_restaurant_created_at_idx
  on public.menu_publications (restaurant_id, created_at desc);

alter table public.menu_publications enable row level security;

create policy "Menu publications are publicly readable"
  on public.menu_publications for select to anon, authenticated using (true);

grant select on public.menu_publications to anon, authenticated;
grant all on public.menu_publications to service_role;
