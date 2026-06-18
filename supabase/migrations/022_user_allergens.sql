create table public.user_allergens (
  user_id uuid not null references auth.users(id) on delete cascade,
  allergen_id uuid not null references public.allergens(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, allergen_id)
);

alter table public.user_allergens enable row level security;

grant select, insert, delete on public.user_allergens to authenticated;

create policy "Users can read their own allergen preferences"
  on public.user_allergens for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own allergen preferences"
  on public.user_allergens for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete their own allergen preferences"
  on public.user_allergens for delete
  to authenticated
  using (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
