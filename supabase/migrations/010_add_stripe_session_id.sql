alter table public.orders
  add column if not exists stripe_session_id text;

create index if not exists orders_stripe_session_id_idx on public.orders (stripe_session_id);

grant all on public.orders to service_role;
grant all on public.order_items to service_role;
grant usage on all sequences in schema public to service_role;

grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;
