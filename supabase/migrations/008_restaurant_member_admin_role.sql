alter table public.restaurant_members
drop constraint if exists restaurant_members_role_check;

alter table public.restaurant_members
add constraint restaurant_members_role_check
check (role in ('owner', 'admin'));
