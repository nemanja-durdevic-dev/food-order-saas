create table public.location_hours (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  day int not null check (day >= 0 and day <= 6),
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, day),
  check (
    (is_closed = true and open_time is null and close_time is null) or
    (is_closed = false and open_time is not null and close_time is not null)
  )
);

alter table public.location_hours enable row level security;

insert into public.location_hours (location_id, day, open_time, close_time, is_closed)
select
  l.id,
  (hours->>'day')::int,
  (hours->>'open')::time,
  (hours->>'close')::time,
  coalesce((hours->>'closed')::boolean, false)
from public.locations l
cross join jsonb_array_elements(l.opening_hours) as hours
where l.opening_hours is not null
on conflict (location_id, day) do nothing;

alter table public.locations drop column opening_hours;

create index idx_location_hours_location_day
  on public.location_hours(location_id, day);

create trigger location_hours_set_updated_at
  before update on public.location_hours
  for each row execute function public.set_updated_at();

create policy "Location hours are publicly readable"
  on public.location_hours for select
  to anon, authenticated
  using (true);

grant select on public.location_hours to anon, authenticated;
