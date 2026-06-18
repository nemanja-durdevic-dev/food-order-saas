-- Drop the old policy that filtered out unavailable items for public/anonymous users.
-- The UI now visually marks items as unavailable instead of hiding them.
drop policy if exists "Menu items are publicly readable" on public.menu_items;

-- Allow all users to see all menu items (unavailable items are greyed out in the UI)
create policy "Menu items are publicly readable"
  on public.menu_items for select
  to anon, authenticated
  using (true);

-- Staff and admin can view all menu items (including unavailable)
drop policy if exists "Staff can view all menu items" on public.menu_items;
create policy "Staff can view all menu items"
  on public.menu_items for select
  to authenticated
  using (
    exists (
      select 1 from public.staff
      where staff.user_id = auth.uid()
      and staff.role in ('staff', 'admin')
    )
  );

grant update on public.menu_items to authenticated;

-- Staff and admin can update menu items
drop policy if exists "Staff can update menu items" on public.menu_items;
create policy "Staff can update menu items"
  on public.menu_items for update
  to authenticated
  using (
    exists (
      select 1 from public.staff
      where staff.user_id = auth.uid()
      and staff.role in ('staff', 'admin')
    )
  );
