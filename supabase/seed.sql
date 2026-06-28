insert into public.restaurants (name, slug, description, brand_color, status)
values (
  'Burger House',
  'burger-house',
  'Fresh burgers, bowls, sides, and pickup favorites.',
  '#f97316',
  'active'
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  brand_color = excluded.brand_color,
  status = excluded.status;

with restaurant as (
  insert into public.restaurants (name, slug, description, brand_color, status)
  values ('Burger House', 'burger-house', 'Fresh burgers, bowls, sides, and pickup favorites.', '#f97316', 'active')
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    brand_color = excluded.brand_color,
    status = excluded.status
  returning id
)
insert into public.locations (restaurant_id, name, address, phone, image_url, is_open, opening_hours)
select restaurant.id, location.name, location.address, location.phone, location.image_url, location.is_open, location.opening_hours::jsonb
from restaurant
cross join (
  values
    ('Main Pickup Counter', '123 Main Street', '+47 22 10 10 10', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', true, '[{"day":0,"open":"10:00","close":"21:00"},{"day":1,"open":"10:00","close":"21:00"},{"day":2,"open":"10:00","close":"21:00"},{"day":3,"open":"10:00","close":"21:00"},{"day":4,"open":"10:00","close":"22:00"},{"day":5,"open":"10:00","close":"22:00"},{"day":6,"open":"12:00","close":"20:00"}]'),
    ('Harbor Pickup Window', '8 Dockside Lane', '+47 22 10 10 11', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80', true, '[{"day":0,"open":"11:00","close":"19:00"},{"day":1,"open":"11:00","close":"19:00"},{"day":2,"open":"11:00","close":"19:00"},{"day":3,"open":"11:00","close":"19:00"},{"day":4,"open":"11:00","close":"19:00"},{"day":5,"open":"10:00","close":"20:00"},{"day":6,"open":"12:00","close":"18:00"}]'),
    ('West Side Kitchen', '44 Market Road', '+47 22 10 10 12', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80', false, '[{"day":0,"open":"11:00","close":"20:00"},{"day":1,"open":"11:00","close":"20:00"},{"day":2,"open":"11:00","close":"20:00"},{"day":3,"open":"11:00","close":"20:00"},{"day":4,"open":"11:00","close":"20:00"},{"day":5,"open":"12:00","close":"18:00"},{"day":6,"open":"12:00","close":"18:00"}]')
) as location(name, address, phone, image_url, is_open, opening_hours)
on conflict (restaurant_id, name) do update set
  address = excluded.address,
  phone = excluded.phone,
  image_url = excluded.image_url,
  is_open = excluded.is_open,
  opening_hours = excluded.opening_hours;

with restaurant as (
  insert into public.restaurants (name, slug, description, brand_color, status)
  values ('Burger House', 'burger-house', 'Fresh burgers, bowls, sides, and pickup favorites.', '#f97316', 'active')
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    brand_color = excluded.brand_color,
    status = excluded.status
  returning id
)
insert into public.categories (restaurant_id, name, name_no, name_sv, name_da, sort_order)
select restaurant.id, category.name, category.name_no, category.name_sv, category.name_da, category.sort_order
from restaurant
cross join (
  values
    ('Burgers', 'Burgere', 'Burgare', 'Burgere', 10),
    ('Chicken', 'Kylling', 'Kyckling', 'Kylling', 20),
    ('Bowls', 'Bowler', 'Bowlar', 'Bowls', 30),
    ('Sides', 'Tilbehør', 'Tillbehör', 'Tilbehør', 40),
    ('Drinks', 'Drikke', 'Drycker', 'Drikke', 50),
    ('Desserts', 'Desserter', 'Efterrätter', 'Desserter', 60),
    ('Kids', 'Barn', 'Barn', 'Børn', 70)
) as category(name, name_no, name_sv, name_da, sort_order)
on conflict (restaurant_id, name) do update set
  name_no = excluded.name_no,
  name_sv = excluded.name_sv,
  name_da = excluded.name_da,
  sort_order = excluded.sort_order;

with restaurant as (
  insert into public.restaurants (name, slug, description, brand_color, status)
  values ('Burger House', 'burger-house', 'Fresh burgers, bowls, sides, and pickup favorites.', '#f97316', 'active')
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    brand_color = excluded.brand_color,
    status = excluded.status
  returning id
), subcategory_seed(category_name, name, name_no, name_sv, name_da, sort_order) as (
  values
    ('Burgers', 'Beef Burgers', 'Biffburgere', 'Nötköttsburgare', 'Bøfburgere', 10),
    ('Burgers', 'Vegetarian Burgers', 'Vegetarburgere', 'Vegetariska burgare', 'Vegetarburgere', 20),
    ('Chicken', 'Burgers', 'Burgere', 'Burgare', 'Burgere', 10),
    ('Chicken', 'Chicken Pieces', 'Kyllingbiter', 'Kycklingbitar', 'Kyllingestykker', 20),
    ('Bowls', 'Meat Bowls', 'Kjøttbowler', 'Köttbowlar', 'Kødbowls', 10),
    ('Bowls', 'Vegetarian Bowls', 'Vegetarbowler', 'Vegetariska bowlar', 'Vegetarbowls', 20),
    ('Sides', 'Fries', 'Pommes frites', 'Pommes frites', 'Pommes frites', 10),
    ('Sides', 'Snacks', 'Snacks', 'Snacks', 'Snacks', 20)
)
insert into public.subcategories (restaurant_id, category_id, name, name_no, name_sv, name_da, sort_order)
select restaurant.id, categories.id, subcategory_seed.name, subcategory_seed.name_no, subcategory_seed.name_sv, subcategory_seed.name_da, subcategory_seed.sort_order
from restaurant
join subcategory_seed on true
join public.categories on categories.restaurant_id = restaurant.id and categories.name = subcategory_seed.category_name
on conflict (category_id, name) do update set
  restaurant_id = excluded.restaurant_id,
  name_no = excluded.name_no,
  name_sv = excluded.name_sv,
  name_da = excluded.name_da,
  sort_order = excluded.sort_order;

with restaurant as (
  select id from public.restaurants where slug = 'burger-house'
), kept_subcategories(category_name, name) as (
  values
    ('Burgers', 'Beef Burgers'),
    ('Burgers', 'Vegetarian Burgers'),
    ('Chicken', 'Burgers'),
    ('Chicken', 'Chicken Pieces'),
    ('Bowls', 'Meat Bowls'),
    ('Bowls', 'Vegetarian Bowls'),
    ('Sides', 'Fries'),
    ('Sides', 'Snacks')
)
delete from public.subcategories
using restaurant, public.categories
where subcategories.restaurant_id = restaurant.id
  and categories.id = subcategories.category_id
  and not exists (
    select 1
    from kept_subcategories
    where kept_subcategories.category_name = categories.name
      and kept_subcategories.name = subcategories.name
  );

with restaurant as (
  select id from public.restaurants where slug = 'burger-house'
)
insert into public.category_locations (restaurant_id, category_id, location_id)
select restaurant.id, categories.id, locations.id
from restaurant
join public.categories on categories.restaurant_id = restaurant.id
join public.locations on locations.restaurant_id = restaurant.id
on conflict (category_id, location_id) do update set
  restaurant_id = excluded.restaurant_id;

with restaurant as (
  select id from public.restaurants where slug = 'burger-house'
)
insert into public.subcategory_locations (restaurant_id, subcategory_id, location_id)
select restaurant.id, subcategories.id, locations.id
from restaurant
join public.subcategories on subcategories.restaurant_id = restaurant.id
join public.locations on locations.restaurant_id = restaurant.id
on conflict (subcategory_id, location_id) do update set
  restaurant_id = excluded.restaurant_id;

with restaurant as (
  insert into public.restaurants (name, slug, description, brand_color, status)
  values ('Burger House', 'burger-house', 'Fresh burgers, bowls, sides, and pickup favorites.', '#f97316', 'active')
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    brand_color = excluded.brand_color,
    status = excluded.status
  returning id
), menu_seed(category_name, subcategory_name, name, description, image_url, price) as (
  values
    ('Burgers', 'Beef Burgers', 'Classic Burger', 'Beef patty, cheddar, lettuce, tomato, pickles, and house sauce.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=600&fit=crop', 129.00),
    ('Burgers', 'Beef Burgers', 'Smash Double', 'Two crispy beef patties, American cheese, onion, pickles, and burger sauce.', 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&h=600&fit=crop', 159.00),
    ('Burgers', 'Beef Burgers', 'BBQ Bacon Burger', 'Beef patty, bacon, cheddar, fried onions, and smoky barbecue sauce.', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&h=600&fit=crop', 169.00),
    ('Burgers', 'Vegetarian Burgers', 'Veggie Halloumi Burger', 'Grilled halloumi, roasted peppers, lettuce, tomato, and herb mayo.', 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=600&h=600&fit=crop', 145.00),
    ('Chicken', 'Burgers', 'Crispy Chicken Burger', 'Crispy chicken, slaw, pickles, and spicy mayo.', 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=600&h=600&fit=crop', 149.00),
    ('Chicken', 'Chicken Pieces', 'Hot Honey Chicken', 'Fried chicken tossed with hot honey, pickles, and creamy ranch.', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=600&fit=crop', 155.00),
    ('Chicken', 'Chicken Pieces', 'Chicken Tenders', 'Five crispy chicken tenders served with garlic dip.', 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=600&h=600&fit=crop', 119.00),
    ('Bowls', 'Meat Bowls', 'Loaded Beef Bowl', 'Seasoned beef, fries, cheddar, jalapenos, tomato salsa, and sour cream.', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop', 149.00),
    ('Bowls', 'Meat Bowls', 'Crispy Chicken Bowl', 'Crispy chicken, rice, slaw, cucumber, pickled onion, and spicy mayo.', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=600&fit=crop', 139.00),
    ('Bowls', 'Vegetarian Bowls', 'Green Falafel Bowl', 'Falafel, rice, greens, hummus, cucumber, tomato, and lemon dressing.', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=600&fit=crop', 129.00),
    ('Sides', 'Fries', 'Fries', 'Golden crispy fries finished with sea salt.', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=600&fit=crop', 49.00),
    ('Sides', 'Fries', 'Sweet Potato Fries', 'Crispy sweet potato fries with chipotle mayo.', 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=600&h=600&fit=crop', 65.00),
    ('Sides', 'Snacks', 'Onion Rings', 'Crispy battered onion rings with ranch dip.', 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&h=600&fit=crop', 59.00),
    ('Sides', 'Snacks', 'Mozzarella Sticks', 'Six mozzarella sticks served with tomato dip.', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop', 79.00),
    ('Drinks', null, 'Cola', 'Cold canned cola.', 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&h=600&fit=crop', 35.00),
    ('Drinks', null, 'Cola Zero', 'Cold canned cola without sugar.', 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&h=600&fit=crop', 35.00),
    ('Drinks', null, 'House Lemonade', 'Fresh lemonade with bright citrus and mint.', 'https://images.unsplash.com/photo-1513558003720-343f3a99d97b?w=600&h=600&fit=crop', 45.00),
    ('Drinks', null, 'Sparkling Water', 'Cold sparkling mineral water.', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&h=600&fit=crop', 32.00),
    ('Desserts', null, 'Chocolate Brownie', 'Warm chocolate brownie with a soft center.', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=600&fit=crop', 69.00),
    ('Desserts', null, 'Cinnamon Churros', 'Crispy churros tossed in cinnamon sugar with chocolate dip.', 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=600&h=600&fit=crop', 75.00),
    ('Desserts', null, 'Vanilla Milkshake', 'Creamy vanilla milkshake topped with whipped cream.', 'https://images.unsplash.com/photo-1653122025451-ec76a73f8a08?w=600&h=600&fit=crop', 79.00),
    ('Kids', null, 'Kids Burger Meal', 'Small cheeseburger, fries, and a juice box.', 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&h=600&fit=crop', 99.00),
    ('Kids', null, 'Kids Tenders Meal', 'Three chicken tenders, fries, and a juice box.', 'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=600&h=600&fit=crop', 99.00),
    ('Kids', null, 'Kids Fries', 'Small portion of crispy fries with ketchup.', 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&h=600&fit=crop', 39.00)
)
insert into public.menu_items (restaurant_id, category_id, subcategory_id, name, description, image_url, price, is_available)
select restaurant.id, categories.id, subcategories.id, menu_seed.name, menu_seed.description, menu_seed.image_url, menu_seed.price, true
from restaurant
join menu_seed on true
join public.categories on categories.restaurant_id = restaurant.id and categories.name = menu_seed.category_name
left join public.subcategories on subcategories.restaurant_id = restaurant.id and subcategories.category_id = categories.id and subcategories.name = menu_seed.subcategory_name
on conflict (restaurant_id, name) do update set
  category_id = excluded.category_id,
  subcategory_id = excluded.subcategory_id,
  description = excluded.description,
  image_url = excluded.image_url,
  price = excluded.price,
  is_available = excluded.is_available;

with restaurant as (
  insert into public.restaurants (name, slug, description, brand_color, status)
  values ('Burger House', 'burger-house', 'Fresh burgers, bowls, sides, and pickup favorites.', '#f97316', 'active')
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    brand_color = excluded.brand_color,
    status = excluded.status
  returning id
)
insert into public.menu_item_locations (restaurant_id, menu_item_id, location_id, is_available)
select restaurant.id, menu_items.id, locations.id, true
from restaurant
join public.menu_items on menu_items.restaurant_id = restaurant.id
join public.locations on locations.restaurant_id = restaurant.id
on conflict (menu_item_id, location_id) do update set
  restaurant_id = excluded.restaurant_id,
  is_available = excluded.is_available;

with restaurant as (
  insert into public.restaurants (name, slug, description, brand_color, status)
  values ('Burger House', 'burger-house', 'Fresh burgers, bowls, sides, and pickup favorites.', '#f97316', 'active')
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    brand_color = excluded.brand_color,
    status = excluded.status
  returning id
), unavailable_items as (
  select menu_items.id as menu_item_id, locations.id as location_id
  from restaurant
  join public.menu_items on menu_items.restaurant_id = restaurant.id
  join public.locations on locations.restaurant_id = restaurant.id
  where
    (locations.name = 'Harbor Pickup Window' and menu_items.name in ('Vanilla Milkshake', 'Kids Burger Meal', 'Kids Tenders Meal'))
    or (locations.name = 'West Side Kitchen' and menu_items.name in ('BBQ Bacon Burger', 'Hot Honey Chicken', 'Cinnamon Churros'))
)
update public.menu_item_locations
set is_available = false
from unavailable_items
where menu_item_locations.menu_item_id = unavailable_items.menu_item_id
  and menu_item_locations.location_id = unavailable_items.location_id;

insert into public.add_on_options (name, name_no, name_sv, name_da, price, is_available, sort_order)
select option.name, option.name_no, option.name_sv, option.name_da, option.price, true, option.sort_order
from (
  values
    ('Extra cheese', 'Ekstra ost', 'Extra ost', 'Ekstra ost', 15.00, 10),
    ('Bacon', 'Bacon', 'Bacon', 'Bacon', 25.00, 20),
    ('Extra beef patty', 'Ekstra biffpatty', 'Extra nötköttsbiff', 'Ekstra bøfpatty', 45.00, 30),
    ('Extra crispy chicken', 'Ekstra sprø kylling', 'Extra krispig kyckling', 'Ekstra sprød kylling', 45.00, 40),
    ('Fries', 'Pommes frites', 'Pommes frites', 'Pommes frites', 39.00, 50),
    ('Garlic dip', 'Hvitløksdip', 'Vitlöksdipp', 'Hvidløgsdip', 15.00, 60),
    ('Chipotle mayo', 'Chipotlemayo', 'Chipotlemajo', 'Chipotlemayo', 15.00, 70)
) as option(name, name_no, name_sv, name_da, price, sort_order)
on conflict (name) do update set
  name_no = excluded.name_no,
  name_sv = excluded.name_sv,
  name_da = excluded.name_da,
  price = excluded.price,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

with restaurant as (
  insert into public.restaurants (name, slug, description, brand_color, status)
  values ('Burger House', 'burger-house', 'Fresh burgers, bowls, sides, and pickup favorites.', '#f97316', 'active')
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    brand_color = excluded.brand_color,
    status = excluded.status
  returning id
), item_add_ons(item_name, add_on_name, sort_order) as (
  values
    ('Classic Burger', 'Extra cheese', 10),
    ('Classic Burger', 'Bacon', 20),
    ('Classic Burger', 'Extra beef patty', 30),
    ('Smash Double', 'Extra cheese', 10),
    ('Smash Double', 'Bacon', 20),
    ('Smash Double', 'Extra beef patty', 30),
    ('Crispy Chicken Burger', 'Extra crispy chicken', 10),
    ('Chicken Tenders', 'Garlic dip', 10),
    ('Loaded Beef Bowl', 'Bacon', 10),
    ('Crispy Chicken Bowl', 'Chipotle mayo', 10),
    ('Kids Burger Meal', 'Extra cheese', 10),
    ('Kids Fries', 'Garlic dip', 10)
)
insert into public.menu_item_add_on_options (restaurant_id, menu_item_id, add_on_option_id, sort_order)
select restaurant.id, menu_items.id, add_on_options.id, item_add_ons.sort_order
from restaurant
join item_add_ons on true
join public.menu_items on menu_items.restaurant_id = restaurant.id and menu_items.name = item_add_ons.item_name
join public.add_on_options on add_on_options.name = item_add_ons.add_on_name
on conflict (menu_item_id, add_on_option_id) do update set
  restaurant_id = excluded.restaurant_id,
  sort_order = excluded.sort_order;

insert into public.ingredients (name, name_no, name_sv, name_da)
values
  ('Beef patty', 'Biffpatty', 'Nötköttsbiff', 'Bøfpatty'),
  ('Cheddar', 'Cheddar', 'Cheddar', 'Cheddar'),
  ('Lettuce', 'Salat', 'Sallad', 'Salat'),
  ('Tomato', 'Tomat', 'Tomat', 'Tomat'),
  ('Pickles', 'Sylteagurk', 'Pickles', 'Sylteagurk'),
  ('Fried chicken', 'Fritert kylling', 'Friterad kyckling', 'Friteret kylling'),
  ('Fries', 'Pommes frites', 'Pommes frites', 'Pommes frites'),
  ('Rice', 'Ris', 'Ris', 'Ris'),
  ('Falafel', 'Falafel', 'Falafel', 'Falafel'),
  ('Garlic dip', 'Hvitløksdip', 'Vitlöksdipp', 'Hvidløgsdip')
on conflict (name) do update set
  name_no = excluded.name_no,
  name_sv = excluded.name_sv,
  name_da = excluded.name_da;

with restaurant as (
  insert into public.restaurants (name, slug, description, brand_color, status)
  values ('Burger House', 'burger-house', 'Fresh burgers, bowls, sides, and pickup favorites.', '#f97316', 'active')
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    brand_color = excluded.brand_color,
    status = excluded.status
  returning id
), item_ingredients(item_name, ingredient_name, sort_order) as (
  values
    ('Classic Burger', 'Beef patty', 10),
    ('Classic Burger', 'Cheddar', 20),
    ('Classic Burger', 'Lettuce', 30),
    ('Classic Burger', 'Tomato', 40),
    ('Classic Burger', 'Pickles', 50),
    ('Crispy Chicken Burger', 'Fried chicken', 10),
    ('Chicken Tenders', 'Fried chicken', 10),
    ('Loaded Beef Bowl', 'Beef patty', 10),
    ('Loaded Beef Bowl', 'Fries', 20),
    ('Crispy Chicken Bowl', 'Fried chicken', 10),
    ('Crispy Chicken Bowl', 'Rice', 20),
    ('Green Falafel Bowl', 'Falafel', 10),
    ('Green Falafel Bowl', 'Rice', 20),
    ('Kids Fries', 'Fries', 10),
    ('Kids Fries', 'Garlic dip', 20)
)
insert into public.menu_item_ingredients (restaurant_id, menu_item_id, ingredient_id, is_removable, sort_order)
select restaurant.id, menu_items.id, ingredients.id, true, item_ingredients.sort_order
from restaurant
join item_ingredients on true
join public.menu_items on menu_items.restaurant_id = restaurant.id and menu_items.name = item_ingredients.item_name
join public.ingredients on ingredients.name = item_ingredients.ingredient_name
on conflict (menu_item_id, ingredient_id) do update set
  restaurant_id = excluded.restaurant_id,
  is_removable = excluded.is_removable,
  sort_order = excluded.sort_order;

insert into public.allergens (name, name_no, name_sv, name_da)
values
  ('Eggs', 'Egg', 'Ägg', 'Æg'),
  ('Gluten', 'Gluten', 'Gluten', 'Gluten'),
  ('Milk', 'Melk', 'Mjölk', 'Mælk'),
  ('Mustard', 'Sennep', 'Senap', 'Sennep'),
  ('Sesame', 'Sesam', 'Sesam', 'Sesam'),
  ('Sulphites', 'Sulfitt', 'Sulfit', 'Sulfitter')
on conflict (name) do update set
  name_no = excluded.name_no,
  name_sv = excluded.name_sv,
  name_da = excluded.name_da;

with restaurant as (
  insert into public.restaurants (name, slug, description, brand_color, status)
  values ('Burger House', 'burger-house', 'Fresh burgers, bowls, sides, and pickup favorites.', '#f97316', 'active')
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    brand_color = excluded.brand_color,
    status = excluded.status
  returning id
), item_allergens(item_name, allergen_name, sort_order) as (
  values
    ('Classic Burger', 'Gluten', 10),
    ('Classic Burger', 'Milk', 20),
    ('Classic Burger', 'Eggs', 30),
    ('Smash Double', 'Gluten', 10),
    ('BBQ Bacon Burger', 'Gluten', 10),
    ('Veggie Halloumi Burger', 'Milk', 10),
    ('Crispy Chicken Burger', 'Gluten', 10),
    ('Hot Honey Chicken', 'Eggs', 10),
    ('Chicken Tenders', 'Gluten', 10),
    ('Green Falafel Bowl', 'Sesame', 10),
    ('Fries', 'Gluten', 10),
    ('Sweet Potato Fries', 'Mustard', 10),
    ('Cola', 'Sulphites', 10),
    ('Cola Zero', 'Sulphites', 10),
    ('House Lemonade', 'Sulphites', 10),
    ('Chocolate Brownie', 'Gluten', 10),
    ('Chocolate Brownie', 'Milk', 20),
    ('Vanilla Milkshake', 'Milk', 10),
    ('Kids Burger Meal', 'Gluten', 10),
    ('Kids Tenders Meal', 'Gluten', 10),
    ('Kids Fries', 'Gluten', 10)
)
insert into public.menu_item_allergens (restaurant_id, menu_item_id, allergen_id, sort_order)
select restaurant.id, menu_items.id, allergens.id, item_allergens.sort_order
from restaurant
join item_allergens on true
join public.menu_items on menu_items.restaurant_id = restaurant.id and menu_items.name = item_allergens.item_name
join public.allergens on allergens.name = item_allergens.allergen_name
on conflict (menu_item_id, allergen_id) do update set
  restaurant_id = excluded.restaurant_id,
  sort_order = excluded.sort_order;
