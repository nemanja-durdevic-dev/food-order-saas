create table public.location_hours_overrides (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  date date not null,
  is_closed boolean not null default false,
  open_time time,
  close_time time,
  reason text,
  created_at timestamptz not null default now(),
  unique (location_id, date)
);

alter table public.location_hours_overrides enable row level security;

create index idx_location_hours_overrides_location_date
  on public.location_hours_overrides(location_id, date);
