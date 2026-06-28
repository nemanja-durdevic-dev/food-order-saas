-- Migration 020: Grant INSERT/UPDATE/DELETE on admin tables to authenticated
-- Server actions now use the user-authenticated client (not service_role),
-- so the authenticated role needs table-level write privileges.
-- RLS policies (from migration 019) enforce row-level access.

grant insert, update, delete on public.restaurants to authenticated;
grant insert, update, delete on public.locations to authenticated;
grant insert, update, delete on public.location_hours to authenticated;
grant insert, update, delete on public.categories to authenticated;
grant insert, update, delete on public.subcategories to authenticated;
grant insert, update, delete on public.menu_items to authenticated;
grant insert, update, delete on public.menu_item_locations to authenticated;
grant insert, update, delete on public.category_locations to authenticated;
grant insert, update, delete on public.menu_item_add_on_options to authenticated;
grant insert, update, delete on public.menu_item_ingredients to authenticated;
grant insert, update, delete on public.menu_item_allergens to authenticated;
grant insert, update, delete on public.menu_publications to authenticated;
grant insert, update, delete on public.add_on_options to authenticated;
grant insert, update, delete on public.ingredients to authenticated;
grant insert, update, delete on public.allergens to authenticated;
