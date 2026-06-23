alter table public.orders
  add column if not exists nets_payment_id text;
