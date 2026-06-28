-- Migration 021: Guard admin subqueries with auth.role() check
-- The unguarded `OR id IN (subquery...)` forced PostgREST to evaluate
-- the subquery even for anon users where auth.uid() is null, causing
-- "Thread killed by timeout manager" errors on public pages.
-- Adding `auth.role() = 'authenticated'` short-circuits the subquery
-- for unauthenticated requests. Admins still get full visibility.
--
-- Also grant SELECT on restaurant_members to anon so the RLS policy
-- subquery can be parsed (PostgreSQL checks permissions at parse time).
-- RLS on restaurant_members already restricts to user_id = auth.uid(),
-- so anon sees 0 rows.

grant select on public.restaurant_members to anon;

drop policy if exists "Menu items are readable by public (available) and admins (all)" on public.menu_items;

create policy "Menu items are readable by public (available) and admins (all)"
  on public.menu_items
  for select
  using (
    is_available = true
    or (auth.role() = 'authenticated' and restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    ))
  );

drop policy if exists "Menu item locations are readable by public (available) and admins (all)" on public.menu_item_locations;

create policy "Menu item locations are readable by public (available) and admins (all)"
  on public.menu_item_locations
  for select
  using (
    is_available = true
    or (auth.role() = 'authenticated' and restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    ))
  );

drop policy if exists "Restaurants are readable by public (active) and admins (all)" on public.restaurants;

create policy "Restaurants are readable by public (active) and admins (all)"
  on public.restaurants
  for select
  using (
    status = 'active'
    or (auth.role() = 'authenticated' and id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    ))
  );
