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
insert into public.locations (restaurant_id, name, address, phone, image_url, currency, is_open)
select restaurant.id, location.name, location.address, location.phone, location.image_url, location.currency, location.is_open
from restaurant
cross join (
  values
    ('Main Pickup Counter', '123 Main Street', '+47 22 10 10 10', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', 'NOK', true),
    ('Harbor Pickup Window', '8 Dockside Lane', '+47 22 10 10 11', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80', 'NOK', true),
    ('West Side Kitchen', '44 Market Road', '+47 22 10 10 12', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80', 'NOK', false)
) as location(name, address, phone, image_url, currency, is_open)
on conflict (restaurant_id, name) do update set
  address = excluded.address,
  phone = excluded.phone,
  image_url = excluded.image_url,
  is_open = excluded.is_open;

with restaurant as (
  select id from public.restaurants where slug = 'burger-house'
)
insert into public.location_hours (location_id, day, open_time, close_time, is_closed)
select locations.id, hours.day, hours.open_time, hours.close_time, hours.is_closed
from restaurant
inner join public.locations on locations.restaurant_id = restaurant.id
cross join (
  values
    ('Main Pickup Counter', 0, '10:00'::time, '21:00'::time, false),
    ('Main Pickup Counter', 1, '10:00'::time, '21:00'::time, false),
    ('Main Pickup Counter', 2, '10:00'::time, '21:00'::time, false),
    ('Main Pickup Counter', 3, '10:00'::time, '21:00'::time, false),
    ('Main Pickup Counter', 4, '10:00'::time, '22:00'::time, false),
    ('Main Pickup Counter', 5, '10:00'::time, '22:00'::time, false),
    ('Main Pickup Counter', 6, '12:00'::time, '20:00'::time, false),
    ('Harbor Pickup Window', 0, '11:00'::time, '19:00'::time, false),
    ('Harbor Pickup Window', 1, '11:00'::time, '19:00'::time, false),
    ('Harbor Pickup Window', 2, '11:00'::time, '19:00'::time, false),
    ('Harbor Pickup Window', 3, '11:00'::time, '19:00'::time, false),
    ('Harbor Pickup Window', 4, '11:00'::time, '19:00'::time, false),
    ('Harbor Pickup Window', 5, '10:00'::time, '20:00'::time, false),
    ('Harbor Pickup Window', 6, '12:00'::time, '18:00'::time, false),
    ('West Side Kitchen', 0, '11:00'::time, '20:00'::time, false),
    ('West Side Kitchen', 1, '11:00'::time, '20:00'::time, false),
    ('West Side Kitchen', 2, '11:00'::time, '20:00'::time, false),
    ('West Side Kitchen', 3, '11:00'::time, '20:00'::time, false),
    ('West Side Kitchen', 4, '11:00'::time, '20:00'::time, false),
    ('West Side Kitchen', 5, '12:00'::time, '18:00'::time, false),
    ('West Side Kitchen', 6, '12:00'::time, '18:00'::time, false)
) as hours(location_name, day, open_time, close_time, is_closed)
where locations.name = hours.location_name
on conflict (location_id, day) do update set
  open_time = excluded.open_time,
  close_time = excluded.close_time,
  is_closed = excluded.is_closed;

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

with restaurant as (
  insert into public.restaurants (name, slug, description, brand_color, status)
  values ('Burger House', 'burger-house', 'Fresh burgers, bowls, sides, and pickup favorites.', '#f97316', 'active')
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    brand_color = excluded.brand_color,
    status = excluded.status
  returning id
), group_seed(name, is_required, is_multi_select, sort_order) as (
  values
    ('Extras', false, true, 10),
    ('Remove Ingredients', false, true, 20),
    ('Add a Drink', false, false, 30)
)
insert into public.option_groups (restaurant_id, name, is_required, is_multi_select, sort_order)
select restaurant.id, group_seed.name, group_seed.is_required, group_seed.is_multi_select, group_seed.sort_order
from restaurant
cross join group_seed
on conflict (restaurant_id, name) do update set
  is_required = excluded.is_required,
  is_multi_select = excluded.is_multi_select,
  sort_order = excluded.sort_order;

with group_ids as (
  select og.id, og.name
  from public.restaurants r
  join public.option_groups og on og.restaurant_id = r.id
  where r.slug = 'burger-house'
)
insert into public.option_group_choices (option_group_id, name, price_modifier_type, price_modifier, sort_order)
select group_ids.id, choice.name, choice.price_modifier_type, choice.price_modifier, choice.sort_order
from group_ids
cross join (
  values
    ('Extras', 'Extra cheese', 'increase', 15.00, 10),
    ('Extras', 'Bacon', 'increase', 25.00, 20),
    ('Extras', 'Extra beef patty', 'increase', 45.00, 30),
    ('Extras', 'Extra crispy chicken', 'increase', 45.00, 40),
    ('Extras', 'Fries', 'increase', 39.00, 50),
    ('Extras', 'Garlic dip', 'increase', 15.00, 60),
    ('Extras', 'Chipotle mayo', 'increase', 15.00, 70),
    ('Remove Ingredients', 'No Beef patty', 'neutral', 0, 10),
    ('Remove Ingredients', 'No Cheddar', 'neutral', 0, 20),
    ('Remove Ingredients', 'No Lettuce', 'neutral', 0, 30),
    ('Remove Ingredients', 'No Tomato', 'neutral', 0, 40),
    ('Remove Ingredients', 'No Pickles', 'neutral', 0, 50),
    ('Remove Ingredients', 'No Fried chicken', 'neutral', 0, 60),
    ('Remove Ingredients', 'No Fries', 'neutral', 0, 70),
    ('Remove Ingredients', 'No Rice', 'neutral', 0, 80),
    ('Remove Ingredients', 'No Falafel', 'neutral', 0, 90),
    ('Remove Ingredients', 'No Garlic dip', 'neutral', 0, 100),
    ('Add a Drink', 'Cola', 'increase', 35.00, 10),
    ('Add a Drink', 'Cola Zero', 'increase', 35.00, 20),
    ('Add a Drink', 'House Lemonade', 'increase', 45.00, 30),
    ('Add a Drink', 'Sparkling Water', 'increase', 32.00, 40)
) as choice(group_name, name, price_modifier_type, price_modifier, sort_order)
where group_ids.name = choice.group_name;

with restaurant as (
  select id from public.restaurants where slug = 'burger-house'
), item_groups(item_name, group_name, sort_order) as (
  values
    ('Classic Burger', 'Extras', 10),
    ('Classic Burger', 'Remove Ingredients', 20),
    ('Classic Burger', 'Add a Drink', 30),
    ('Smash Double', 'Extras', 10),
    ('Smash Double', 'Add a Drink', 20),
    ('BBQ Bacon Burger', 'Add a Drink', 10),
    ('Veggie Halloumi Burger', 'Add a Drink', 10),
    ('Crispy Chicken Burger', 'Extras', 10),
    ('Crispy Chicken Burger', 'Remove Ingredients', 20),
    ('Crispy Chicken Burger', 'Add a Drink', 30),
    ('Hot Honey Chicken', 'Add a Drink', 10),
    ('Chicken Tenders', 'Extras', 10),
    ('Chicken Tenders', 'Remove Ingredients', 20),
    ('Chicken Tenders', 'Add a Drink', 30),
    ('Loaded Beef Bowl', 'Extras', 10),
    ('Loaded Beef Bowl', 'Remove Ingredients', 20),
    ('Loaded Beef Bowl', 'Add a Drink', 30),
    ('Crispy Chicken Bowl', 'Extras', 10),
    ('Crispy Chicken Bowl', 'Remove Ingredients', 20),
    ('Crispy Chicken Bowl', 'Add a Drink', 30),
    ('Green Falafel Bowl', 'Remove Ingredients', 10),
    ('Green Falafel Bowl', 'Add a Drink', 20),
    ('Kids Burger Meal', 'Extras', 10),
    ('Kids Burger Meal', 'Add a Drink', 20),
    ('Kids Tenders Meal', 'Add a Drink', 10),
    ('Kids Fries', 'Extras', 10),
    ('Kids Fries', 'Remove Ingredients', 20)
)
insert into public.menu_item_option_groups (restaurant_id, menu_item_id, option_group_id, sort_order)
select restaurant.id, menu_items.id, option_groups.id, item_groups.sort_order
from restaurant
join item_groups on true
join public.menu_items on menu_items.restaurant_id = restaurant.id and menu_items.name = item_groups.item_name
join public.option_groups on option_groups.restaurant_id = restaurant.id and option_groups.name = item_groups.group_name
on conflict (menu_item_id, option_group_id) do update set
  restaurant_id = excluded.restaurant_id,
  sort_order = excluded.sort_order;

with restaurant as (
  select id from public.restaurants where slug = 'burger-house'
), item_group_choices(item_name, group_name, choice_name, sort_order) as (
  values
    ('Classic Burger', 'Extras', 'Extra cheese', 10),
    ('Classic Burger', 'Extras', 'Bacon', 20),
    ('Classic Burger', 'Extras', 'Extra beef patty', 30),
    ('Classic Burger', 'Remove Ingredients', 'No Beef patty', 10),
    ('Classic Burger', 'Remove Ingredients', 'No Cheddar', 20),
    ('Classic Burger', 'Remove Ingredients', 'No Lettuce', 30),
    ('Classic Burger', 'Remove Ingredients', 'No Tomato', 40),
    ('Classic Burger', 'Remove Ingredients', 'No Pickles', 50),
    ('Smash Double', 'Extras', 'Extra cheese', 10),
    ('Smash Double', 'Extras', 'Bacon', 20),
    ('Smash Double', 'Extras', 'Extra beef patty', 30),
    ('Crispy Chicken Burger', 'Extras', 'Extra crispy chicken', 10),
    ('Crispy Chicken Burger', 'Remove Ingredients', 'No Fried chicken', 10),
    ('Chicken Tenders', 'Extras', 'Garlic dip', 10),
    ('Chicken Tenders', 'Remove Ingredients', 'No Fried chicken', 10),
    ('Loaded Beef Bowl', 'Extras', 'Bacon', 10),
    ('Loaded Beef Bowl', 'Remove Ingredients', 'No Beef patty', 10),
    ('Loaded Beef Bowl', 'Remove Ingredients', 'No Fries', 20),
    ('Crispy Chicken Bowl', 'Extras', 'Chipotle mayo', 10),
    ('Crispy Chicken Bowl', 'Remove Ingredients', 'No Fried chicken', 10),
    ('Crispy Chicken Bowl', 'Remove Ingredients', 'No Rice', 20),
    ('Green Falafel Bowl', 'Remove Ingredients', 'No Falafel', 10),
    ('Green Falafel Bowl', 'Remove Ingredients', 'No Rice', 20),
    ('Kids Burger Meal', 'Extras', 'Extra cheese', 10),
    ('Kids Fries', 'Extras', 'Garlic dip', 10),
    ('Kids Fries', 'Remove Ingredients', 'No Fries', 10),
    ('Kids Fries', 'Remove Ingredients', 'No Garlic dip', 20)
)
insert into public.menu_item_option_group_choices (menu_item_option_group_id, option_group_choice_id, sort_order)
select miog.id, ogc.id, igc.sort_order
from restaurant
join item_group_choices igc on true
join public.menu_items on menu_items.restaurant_id = restaurant.id and menu_items.name = igc.item_name
join public.option_groups on option_groups.restaurant_id = restaurant.id and option_groups.name = igc.group_name
join public.menu_item_option_groups miog on miog.menu_item_id = menu_items.id and miog.option_group_id = option_groups.id
join public.option_group_choices ogc on ogc.option_group_id = option_groups.id and ogc.name = igc.choice_name
on conflict (menu_item_option_group_id, option_group_choice_id) do update set
  sort_order = excluded.sort_order;

with restaurant as (
  select id from public.restaurants where slug = 'burger-house'
), add_drink_choices(item_name) as (
  values
    ('Classic Burger'), ('Smash Double'), ('BBQ Bacon Burger'), ('Veggie Halloumi Burger'),
    ('Crispy Chicken Burger'), ('Hot Honey Chicken'), ('Chicken Tenders'),
    ('Loaded Beef Bowl'), ('Crispy Chicken Bowl'), ('Green Falafel Bowl'),
    ('Kids Burger Meal'), ('Kids Tenders Meal')
)
insert into public.menu_item_option_group_choices (menu_item_option_group_id, option_group_choice_id, sort_order)
select miog.id, ogc.id, drink.seq
from restaurant
join add_drink_choices adc on true
join public.menu_items on menu_items.restaurant_id = restaurant.id and menu_items.name = adc.item_name
join public.option_groups on option_groups.restaurant_id = restaurant.id and option_groups.name = 'Add a Drink'
join public.menu_item_option_groups miog on miog.menu_item_id = menu_items.id and miog.option_group_id = option_groups.id
join public.option_group_choices ogc on ogc.option_group_id = option_groups.id
join (values ('Cola', 10), ('Cola Zero', 20), ('House Lemonade', 30), ('Sparkling Water', 40)) as drink(name, seq) on drink.name = ogc.name
on conflict (menu_item_option_group_id, option_group_choice_id) do update set
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
