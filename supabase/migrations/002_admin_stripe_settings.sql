alter table public.restaurants
add column if not exists stripe_account_id text,
add column if not exists payments_enabled boolean not null default false;

create table if not exists public.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create index if not exists restaurant_members_user_id_idx
on public.restaurant_members (user_id);

alter table public.restaurant_members enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'restaurant_members'
      and policyname = 'Restaurant members are readable by member'
  ) then
    create policy "Restaurant members are readable by member"
    on public.restaurant_members
    for select
    to authenticated
    using ((select auth.uid()) = user_id);
  end if;
end $$;

drop trigger if exists restaurant_members_set_updated_at on public.restaurant_members;

create trigger restaurant_members_set_updated_at
before update on public.restaurant_members
for each row execute function public.set_updated_at();

grant select on public.restaurant_members to authenticated;
grant usage on schema public to service_role;
grant all on public.restaurants to service_role;
grant all on public.restaurant_members to service_role;
