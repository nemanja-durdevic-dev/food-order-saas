-- Staff table for role/location mapping (works with Realtime RLS)
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('staff', 'admin')),
  location_id uuid references public.locations(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.staff enable row level security;

grant select, update on public.staff to authenticated;
grant insert on public.staff to service_role;

-- Staff can read their own record
create policy "Staff can read own record"
  on public.staff for select
  to authenticated
  using (user_id = auth.uid());

-- Drop old policies that use auth.jwt()
drop policy if exists "Staff can read orders at their location" on public.orders;
drop policy if exists "Staff can update orders at their location" on public.orders;
drop policy if exists "Admin can read all orders" on public.orders;
drop policy if exists "Staff can read order items at their location" on public.order_items;
drop policy if exists "Admin can read all order items" on public.order_items;
drop function if exists public.is_staff_at;

-- Staff can read orders at their location
create policy "Staff can read orders at their location"
  on public.orders for select
  to authenticated
  using (
    exists (
      select 1 from public.staff
      where staff.user_id = auth.uid()
        and staff.role = 'staff'
        and staff.location_id = orders.location_id
    )
  );

-- Staff can update orders at their location
create policy "Staff can update orders at their location"
  on public.orders for update
  to authenticated
  using (
    exists (
      select 1 from public.staff
      where staff.user_id = auth.uid()
        and staff.role = 'staff'
        and staff.location_id = orders.location_id
    )
  );

-- Admin can read all orders
create policy "Admin can read all orders"
  on public.orders for select
  to authenticated
  using (
    exists (
      select 1 from public.staff
      where staff.user_id = auth.uid()
        and staff.role = 'admin'
    )
  );

-- Staff can read order items for their location
create policy "Staff can read order items at their location"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      join public.staff on staff.user_id = auth.uid()
      where orders.id = order_items.order_id
        and staff.role = 'staff'
        and staff.location_id = orders.location_id
    )
  );

-- Admin can read all order items
create policy "Admin can read all order items"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.staff
      where staff.user_id = auth.uid()
        and staff.role = 'admin'
    )
  );

NOTIFY pgrst, 'reload schema';
