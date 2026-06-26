alter table public.restaurants
add column if not exists instagram_url text,
add column if not exists facebook_url text,
add column if not exists youtube_url text,
add column if not exists contact_email text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'restaurants_instagram_url_http_check'
      and conrelid = 'public.restaurants'::regclass
  ) then
    alter table public.restaurants
    add constraint restaurants_instagram_url_http_check
    check (instagram_url is null or instagram_url ~* '^https?://');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'restaurants_facebook_url_http_check'
      and conrelid = 'public.restaurants'::regclass
  ) then
    alter table public.restaurants
    add constraint restaurants_facebook_url_http_check
    check (facebook_url is null or facebook_url ~* '^https?://');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'restaurants_youtube_url_http_check'
      and conrelid = 'public.restaurants'::regclass
  ) then
    alter table public.restaurants
    add constraint restaurants_youtube_url_http_check
    check (youtube_url is null or youtube_url ~* '^https?://');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'restaurants_contact_email_format_check'
      and conrelid = 'public.restaurants'::regclass
  ) then
    alter table public.restaurants
    add constraint restaurants_contact_email_format_check
    check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
  end if;
end $$;
