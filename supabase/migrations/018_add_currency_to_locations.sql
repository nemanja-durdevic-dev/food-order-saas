alter table public.locations
  add column currency text not null default 'NOK';

alter table public.locations
  add constraint locations_currency_check
    check (currency in ('DKK', 'EUR', 'ISK', 'NOK', 'SEK'));
