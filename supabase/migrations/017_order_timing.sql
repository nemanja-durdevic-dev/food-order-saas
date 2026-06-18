-- Add order timing columns for preorder support

alter table public.orders
  add column order_timing text not null default 'asap'
    check (order_timing in ('asap', 'preorder')),
  add column preorder_date date,
  add column preorder_time time;

comment on column public.orders.order_timing is 'asap | preorder';
comment on column public.orders.preorder_date is 'Scheduled date for preorder';
comment on column public.orders.preorder_time is 'Scheduled time for preorder';
