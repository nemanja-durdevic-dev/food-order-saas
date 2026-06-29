-- Migration 019: Admin RLS policies
-- Give admin/owner role users read-write access to their restaurant's data.
-- Public policies remain unchanged (public sees active/available items only).

-- ── 1. Relax SELECT policies where public filters are too restrictive for admin ──

drop policy if exists "Available menu items are publicly readable" on public.menu_items;

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

drop policy if exists "Available menu item locations are publicly readable" on public.menu_item_locations;

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

drop policy if exists "Active restaurants are publicly readable" on public.restaurants;

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

-- ── 2. Admin write policies ──

create policy "Admins can update their restaurant"
  on public.restaurants
  for update
  using (
    id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  )
  with check (
    id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

create policy "Admins can manage their categories"
  on public.categories
  for all
  using (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  )
  with check (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

create policy "Admins can manage their subcategories"
  on public.subcategories
  for all
  using (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  )
  with check (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

create policy "Admins can manage their menu items"
  on public.menu_items
  for all
  using (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  )
  with check (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

create policy "Admins can manage their menu item locations"
  on public.menu_item_locations
  for all
  using (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  )
  with check (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

create policy "Admins can manage their menu item add-on options"
  on public.menu_item_add_on_options
  for all
  using (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  )
  with check (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

create policy "Admins can manage their menu item ingredients"
  on public.menu_item_ingredients
  for all
  using (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  )
  with check (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

create policy "Admins can manage their menu item allergens"
  on public.menu_item_allergens
  for all
  using (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  )
  with check (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

create policy "Admins can manage their category locations"
  on public.category_locations
  for all
  using (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  )
  with check (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

create policy "Admins can manage their locations"
  on public.locations
  for all
  using (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  )
  with check (
    restaurant_id in (
      select restaurant_id
      from public.restaurant_members
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

create policy "Admins can manage their location hours"
  on public.location_hours
  for all
  using (
    location_id in (
      select id
      from public.locations
      where restaurant_id in (
        select restaurant_id
        from public.restaurant_members
        where user_id = auth.uid() and role in ('admin', 'owner')
      )
    )
  )
  with check (
    location_id in (
      select id
      from public.locations
      where restaurant_id in (
        select restaurant_id
        from public.restaurant_members
        where user_id = auth.uid() and role in ('admin', 'owner')
      )
    )
  );

