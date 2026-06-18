-- Grant update permission for staff to change order status
grant update on public.orders to authenticated;

-- Helper function to check if current user is staff at a location
create or replace function public.is_staff_at(loc_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from auth.users
    where id = auth.uid()
      and raw_app_meta_data->>'role' = 'staff'
      and (raw_app_meta_data->>'location_id')::uuid = loc_id
  );
$$;

-- Enable real-time
alter publication supabase_realtime add table if not exists public.orders;

-- Drop old policies (in case they exist from previous attempts)
drop policy if exists "Staff can read orders at their location" on public.orders;
drop policy if exists "Staff can update orders at their location" on public.orders;
drop policy if exists "Admin can read all orders" on public.orders;
drop policy if exists "Staff can read order items at their location" on public.order_items;
drop policy if exists "Admin can read all order items" on public.order_items;

-- Staff can read orders at their assigned location
create policy "Staff can read orders at their location"
  on public.orders for select
  to authenticated
  using (public.is_staff_at(location_id));

-- Staff can update orders at their assigned location
create policy "Staff can update orders at their location"
  on public.orders for update
  to authenticated
  using (public.is_staff_at(location_id));

-- Admin can read all orders
create policy "Admin can read all orders"
  on public.orders for select
  to authenticated
  using (
    exists (
      select 1
      from auth.users
      where id = auth.uid()
        and raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Staff can read order items for their location's orders
create policy "Staff can read order items at their location"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and public.is_staff_at(orders.location_id)
    )
  );

-- Admin can read all order items
create policy "Admin can read all order items"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1
      from auth.users
      where id = auth.uid()
        and raw_app_meta_data->>'role' = 'admin'
    )
  );
