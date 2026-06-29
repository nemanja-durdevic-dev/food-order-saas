-- Drop payment provider columns from restaurants
alter table if exists public.restaurants
  drop column if exists stripe_account_id,
  drop column if exists payments_enabled;

-- Drop payment provider columns from orders
alter table if exists public.orders
  drop column if exists stripe_session_id,
  drop column if exists vipps_payment_reference,
  drop column if exists nets_payment_id;
