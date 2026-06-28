-- Migration 022: RLS policies and table grants for location_hours_overrides
-- Follows the same pattern as location_hours in migration 019/020.

create policy "Admins can manage location hours overrides"
  on public.location_hours_overrides
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

grant select, insert, update, delete on public.location_hours_overrides to authenticated;
