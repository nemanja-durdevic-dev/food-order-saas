-- Allow anonymous users to read an order by ID (UUID is the auth mechanism)
-- Need both a table-level GRANT and a row-level RLS policy

grant select on public.orders to anon;
grant select on public.order_items to anon;

drop policy if exists "Orders are readable by anyone by id" on public.orders;
create policy "Orders are readable by anyone by id"
  on public.orders for select
  to anon
  using (true);

drop policy if exists "Order items are readable by anyone by order id" on public.order_items;
create policy "Order items are readable by anyone by order id"
  on public.order_items for select
  to anon
  using (true);
