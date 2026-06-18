alter table public.allergens
  add column name_no text,
  add column name_sv text,
  add column name_da text;

update public.allergens set
  name_no = case name
    when 'Celery' then 'Selleri'
    when 'Eggs' then 'Egg'
    when 'Fish' then 'Fisk'
    when 'Gluten' then 'Gluten'
    when 'Milk' then 'Melk'
    when 'Mustard' then 'Sennep'
    when 'Sesame' then 'Sesam'
    when 'Soy' then 'Soya'
    when 'Sulphites' then 'Sulfitt'
  end,
  name_sv = case name
    when 'Celery' then 'Selleri'
    when 'Eggs' then 'Ägg'
    when 'Fish' then 'Fisk'
    when 'Gluten' then 'Gluten'
    when 'Milk' then 'Mjölk'
    when 'Mustard' then 'Senap'
    when 'Sesame' then 'Sesam'
    when 'Soy' then 'Soja'
    when 'Sulphites' then 'Sulfit'
  end,
  name_da = case name
    when 'Celery' then 'Selleri'
    when 'Eggs' then 'Æg'
    when 'Fish' then 'Fisk'
    when 'Gluten' then 'Gluten'
    when 'Milk' then 'Mælk'
    when 'Mustard' then 'Sennep'
    when 'Sesame' then 'Sesam'
    when 'Soy' then 'Soja'
    when 'Sulphites' then 'Sulfitter'
  end;
