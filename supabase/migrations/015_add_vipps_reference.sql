alter table public.orders
  add column if not exists vipps_payment_reference text;

create index if not exists orders_vipps_payment_reference_idx on public.orders (vipps_payment_reference);
