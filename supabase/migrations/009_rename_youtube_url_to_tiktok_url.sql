do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'restaurants'
      and column_name = 'youtube_url'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'restaurants'
      and column_name = 'tiktok_url'
  ) then
    alter table public.restaurants
    rename column youtube_url to tiktok_url;
  elsif not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'restaurants'
      and column_name = 'tiktok_url'
  ) then
    alter table public.restaurants
    add column tiktok_url text;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'restaurants'
      and column_name = 'youtube_url'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'restaurants'
      and column_name = 'tiktok_url'
  ) then
    update public.restaurants
    set tiktok_url = coalesce(tiktok_url, youtube_url);

    alter table public.restaurants
    drop column youtube_url;
  end if;

  alter table public.restaurants
  drop constraint if exists restaurants_youtube_url_http_check;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'restaurants_tiktok_url_http_check'
      and conrelid = 'public.restaurants'::regclass
  ) then
    alter table public.restaurants
    add constraint restaurants_tiktok_url_http_check
    check (tiktok_url is null or tiktok_url ~* '^https?://');
  end if;
end $$;
