drop table if exists public.menu_publications;

alter table public.restaurants
  drop column if exists menu_dirty,
  drop column if exists menu_published_at;
