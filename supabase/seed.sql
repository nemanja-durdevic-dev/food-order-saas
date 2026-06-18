create unique index if not exists locations_name_idx on public.locations (name);
create unique index if not exists categories_name_idx on public.categories (name);
create unique index if not exists menu_items_name_idx on public.menu_items (name);
create unique index if not exists menu_item_locations_item_location_idx on public.menu_item_locations (menu_item_id, location_id);

insert into public.locations (name, address, phone, image_url, is_open, opening_hours)
values
  ('Main Pickup Counter', '123 Main Street', '+47 22 10 10 10', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', true, '[{"day":0,"open":"10:00","close":"21:00"},{"day":1,"open":"10:00","close":"21:00"},{"day":2,"open":"10:00","close":"21:00"},{"day":3,"open":"10:00","close":"21:00"},{"day":4,"open":"10:00","close":"22:00"},{"day":5,"open":"10:00","close":"22:00"},{"day":6,"open":"12:00","close":"20:00"}]'::jsonb),
  ('Harbor Pickup Window', '8 Dockside Lane', '+47 22 10 10 11', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80', true, '[{"day":0,"open":"11:00","close":"19:00"},{"day":1,"open":"11:00","close":"19:00"},{"day":2,"open":"11:00","close":"19:00"},{"day":3,"open":"11:00","close":"19:00"},{"day":4,"open":"11:00","close":"19:00"},{"day":5,"open":"10:00","close":"20:00"},{"day":6,"open":"12:00","close":"18:00"}]'::jsonb),
  ('West Side Kitchen', '44 Market Road', '+47 22 10 10 12', 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80', false, '[{"day":0,"open":"11:00","close":"20:00"},{"day":1,"open":"11:00","close":"20:00"},{"day":2,"open":"11:00","close":"20:00"},{"day":3,"open":"11:00","close":"20:00"},{"day":4,"open":"11:00","close":"20:00"},{"day":5,"open":"12:00","close":"18:00"},{"day":6,"open":"12:00","close":"18:00"}]'::jsonb)
on conflict (name) do update set
  address = excluded.address,
  phone = excluded.phone,
  image_url = excluded.image_url,
  is_open = excluded.is_open,
  opening_hours = excluded.opening_hours;

insert into public.categories (name, name_no, name_sv, name_da, sort_order)
values
  ('Burgers', 'Burgere', 'Burgare', 'Burgere', 10),
  ('Chicken', 'Kylling', 'Kyckling', 'Kylling', 20),
  ('Bowls', 'Bowler', 'Bowlar', 'Bowls', 30),
  ('Sides', 'Tilbehør', 'Tillbehör', 'Tilbehør', 40),
  ('Drinks', 'Drikke', 'Drycker', 'Drikke', 50),
  ('Desserts', 'Desserter', 'Efterrätter', 'Desserter', 60),
  ('Kids', 'Barn', 'Barn', 'Børn', 70)
on conflict (name) do update set
  sort_order = excluded.sort_order,
  name_no = excluded.name_no,
  name_sv = excluded.name_sv,
  name_da = excluded.name_da;

with category_ids as (
  select id, name
  from public.categories
  where name in (
    'Burgers',
    'Chicken',
    'Bowls',
    'Sides',
    'Drinks',
    'Desserts',
    'Kids'
  )
)
insert into public.menu_items (category_id, name, name_no, name_sv, name_da, description, description_no, description_sv, description_da, image_url, price, is_available)
values
  (
    (select id from category_ids where name = 'Burgers'),
    'Classic Burger', 'Klassisk Burger', 'Klassisk Burgare', 'Klassisk Burger',
    'Beef patty, cheddar, lettuce, tomato, pickles, and house sauce.',
    'Biffpatty, cheddar, salat, tomat, sylteagurk og husets saus.',
    'Nötköttsbiff, cheddar, sallad, tomat, pickles och husets sås.',
    'Bøfpatty, cheddar, salat, tomat, sylteagurk og husets sauce.',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=600&fit=crop', 129.00, true
  ),
  (
    (select id from category_ids where name = 'Burgers'),
    'Smash Double', 'Smash Double', 'Smash Double', 'Smash Double',
    'Two crispy beef patties, American cheese, onion, pickles, and burger sauce.',
    'To sprø biffpattyer, amerikansk ost, løk, sylteagurk og burgerdressing.',
    'Två krispiga nötköttsbiffar, amerikansk ost, lök, pickles och burgarsås.',
    'To sprøde bøfpattyer, amerikansk ost, løg, sylteagurk og burgursauce.',
    'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=600&h=600&fit=crop', 159.00, true
  ),
  (
    (select id from category_ids where name = 'Burgers'),
    'BBQ Bacon Burger', 'BBQ Bacon Burger', 'BBQ Bacon Burgare', 'BBQ Bacon Burger',
    'Beef patty, bacon, cheddar, fried onions, and smoky barbecue sauce.',
    'Biffpatty, bacon, cheddar, stekt løk og røykt barbecuesaus.',
    'Nötköttsbiff, bacon, cheddar, stekt lök och rökig barbecuesås.',
    'Bøfpatty, bacon, cheddar, stegt løg og røget barbecuesauce.',
    'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&h=600&fit=crop', 169.00, true
  ),
  (
    (select id from category_ids where name = 'Burgers'),
    'Veggie Halloumi Burger', 'Vegetar Halloumi Burger', 'Vegetarisk Halloumi Burgare', 'Vegetar Halloumi Burger',
    'Grilled halloumi, roasted peppers, lettuce, tomato, and herb mayo.',
    'Grillet halloumi, grillede paprika, salat, tomat og urtemayo.',
    'Grillad halloumi, rostade paprikor, sallad, tomat och örtmajo.',
    'Grillet halloumi, grillede peberfrugter, salat, tomat og urtemayo.',
    'https://images.unsplash.com/photo-1586816001966-79b736744398?w=600&h=600&fit=crop', 145.00, true
  ),
  (
    (select id from category_ids where name = 'Chicken'),
    'Crispy Chicken Burger', 'Crispy Chicken Burger', 'Krispig Kycklingburgare', 'Crispy Chicken Burger',
    'Crispy chicken, slaw, pickles, and spicy mayo.',
    'Sprø kylling, kålsalat, sylteagurk og spicy mayo.',
    'Krispig kyckling, kålsallad, pickles och stark majonnäs.',
    'Sprød kylling, kålsalat, sylteagurk og spicy mayo.',
    'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=600&h=600&fit=crop', 149.00, true
  ),
  (
    (select id from category_ids where name = 'Chicken'),
    'Hot Honey Chicken', 'Hot Honey Chicken', 'Hot Honey Kyckling', 'Hot Honey Chicken',
    'Fried chicken tossed with hot honey, pickles, and creamy ranch.',
    'Fritert kylling med hot honey, sylteagurk og creamy ranch.',
    'Friterad kyckling med hot honey, pickles och krämig ranch.',
    'Friteret kylling med hot honey, sylteagurk og cremet ranch.',
    'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&h=600&fit=crop', 155.00, true
  ),
  (
    (select id from category_ids where name = 'Chicken'),
    'Chicken Tenders', 'Chicken Tenders', 'Kycklingtenders', 'Chicken Tenders',
    'Five crispy chicken tenders served with garlic dip.',
    'Fem sprø kyllingtenders med hvitløksdip.',
    'Fem krispiga kycklingtenders med vitlöksdipp.',
    'Fem sprøde kyllingtenders med hvidløgsdip.',
    'https://images.unsplash.com/photo-1562967916-eb82221dfb92?w=600&h=600&fit=crop', 119.00, true
  ),
  (
    (select id from category_ids where name = 'Bowls'),
    'Loaded Beef Bowl', 'Loaded Beef Bowl', 'Mustig Nötköttsbowl', 'Loaded Beef Bowl',
    'Seasoned beef, fries, cheddar, jalapenos, tomato salsa, and sour cream.',
    'Krydret biff, fries, cheddar, jalapenos, tomatsalsa og rømme.',
    'Kryddat nötkött, pommes, cheddar, jalapeños, tomatsalsa och gräddfil.',
    'Krydret bøf, pommes frites, cheddar, jalapeños, tomatsalsa og creme fraiche.',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop', 149.00, true
  ),
  (
    (select id from category_ids where name = 'Bowls'),
    'Crispy Chicken Bowl', 'Crispy Chicken Bowl', 'Krispig Kycklingbowl', 'Crispy Chicken Bowl',
    'Crispy chicken, rice, slaw, cucumber, pickled onion, and spicy mayo.',
    'Sprø kylling, ris, kålsalat, agurk, syltet løk og spicy mayo.',
    'Krispig kyckling, ris, kålsallad, gurka, inlagd lök och stark majonnäs.',
    'Sprød kylling, ris, kålsalat, agurk, syltet løg og spicy mayo.',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=600&fit=crop', 139.00, true
  ),
  (
    (select id from category_ids where name = 'Bowls'),
    'Green Falafel Bowl', 'Green Falafel Bowl', 'Grön Falafelbowl', 'Green Falafel Bowl',
    'Falafel, rice, greens, hummus, cucumber, tomato, and lemon dressing.',
    'Falafel, ris, grønt, hummus, agurk, tomat og sitrondressing.',
    'Falafel, ris, grönsaker, hummus, gurka, tomat och citrondressing.',
    'Falafel, ris, grønt, hummus, agurk, tomat og citrondressing.',
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=600&fit=crop', 129.00, true
  ),
  (
    (select id from category_ids where name = 'Sides'),
    'Fries', 'Pommes Frites', 'Pommes Frites', 'Pommes Frites',
    'Golden crispy fries finished with sea salt.',
    'Gylne sprø pommes frites med havsalt.',
    'Gyllene krispiga pommes frites med havssalt.',
    'Gyldne sprøde pommes frites med havsalt.',
    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=600&fit=crop', 49.00, true
  ),
  (
    (select id from category_ids where name = 'Sides'),
    'Sweet Potato Fries', 'Søtpotetfrites', 'Sötpotatispommes', 'Sød Kartoffel Frites',
    'Crispy sweet potato fries with chipotle mayo.',
    'Sprø søtpotetfrites med chipotlemayo.',
    'Krispiga sötpotatispommes med chipotlemajo.',
    'Sprøde sød kartoffel pommes frites med chipotlemayo.',
    'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=600&h=600&fit=crop', 65.00, true
  ),
  (
    (select id from category_ids where name = 'Sides'),
    'Onion Rings', 'Løkringer', 'Lökringar', 'Løgringe',
    'Crispy battered onion rings with ranch dip.',
    'Sprø panerte løkringer med ranchdip.',
    'Krispiga panerade lökringar med ranchdipp.',
    'Sprøde panerede løgringe med ranchdip.',
    'https://images.unsplash.com/photo-1639024471283-03518883512d?w=600&h=600&fit=crop', 59.00, true
  ),
  (
    (select id from category_ids where name = 'Sides'),
    'Mozzarella Sticks', 'Mozzarella Sticks', 'Mozzarellastavar', 'Mozzarella Sticks',
    'Six mozzarella sticks served with tomato dip.',
    'Seks mozzarellastikker med tomatsaus.',
    'Sex mozzarellastavar med tomatsås.',
    'Seks mozzarellastænger med tomatsauce.',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop', 79.00, true
  ),
  (
    (select id from category_ids where name = 'Drinks'),
    'Cola', 'Cola', 'Cola', 'Cola',
    'Cold canned cola.',
    'Kald cola på boks.',
    'Kall cola på burk.',
    'Kold cola på dåse.',
    'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&h=600&fit=crop', 35.00, true
  ),
  (
    (select id from category_ids where name = 'Drinks'),
    'Cola Zero', 'Cola Zero', 'Cola Zero', 'Cola Zero',
    'Cold canned cola without sugar.',
    'Kald cola uten sukker på boks.',
    'Kall cola utan socker på burk.',
    'Kold cola uden sukker på dåse.',
    'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&h=600&fit=crop', 35.00, true
  ),
  (
    (select id from category_ids where name = 'Drinks'),
    'House Lemonade', 'Husets Limonade', 'Husets Lemonad', 'Husets Limonade',
    'Fresh lemonade with bright citrus and mint.',
    'Frisk limonade med sitrus og mynte.',
    'Frisk lemonad med citrus och mynta.',
    'Frisk limonade med citrus og mynte.',
    'https://images.unsplash.com/photo-1513558003720-343f3a99d97b?w=600&h=600&fit=crop', 45.00, true
  ),
  (
    (select id from category_ids where name = 'Drinks'),
    'Sparkling Water', 'Farris', 'Kolsyrat Vatten', 'Danskvand',
    'Cold sparkling mineral water.',
    'Kaldt kullsyreholdig mineralvann.',
    'Kallt kolsyrat mineralvatten.',
    'Kold kulsyreholdig mineralvand.',
    'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&h=600&fit=crop', 32.00, true
  ),
  (
    (select id from category_ids where name = 'Desserts'),
    'Chocolate Brownie', 'Sjokolade Brownie', 'Choklad Brownie', 'Chokolade Brownie',
    'Warm chocolate brownie with a soft center.',
    'Varm sjokoladebrownie med myk kjerne.',
    'Varm chokladbrownie med mjukt centrum.',
    'Varm chokoladebrownie med blød kerne.',
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=600&fit=crop', 69.00, true
  ),
  (
    (select id from category_ids where name = 'Desserts'),
    'Cinnamon Churros', 'Kanel Churros', 'Kanel Churros', 'Kanel Churros',
    'Crispy churros tossed in cinnamon sugar with chocolate dip.',
    'Sprø churros med kanelsukker og sjokoladesaus.',
    'Krispiga churros med kanelsocker och chokladdopp.',
    'Sprøde churros med kanelsukker og chokoladesauce.',
    'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=600&h=600&fit=crop', 75.00, true
  ),
  (
    (select id from category_ids where name = 'Desserts'),
    'Vanilla Milkshake', 'Vaniljeshake', 'Vaniljeshake', 'Vaniljeshake',
    'Creamy vanilla milkshake topped with whipped cream.',
    'Kremet vaniljeshake med kremtopp.',
    'Krämig vaniljeshake med grädde.',
    'Cremet vaniljeshake med flødeskum.',
    'https://images.unsplash.com/photo-1653122025451-ec76a73f8a08?w=600&h=600&fit=crop', 79.00, true
  ),
  (
    (select id from category_ids where name = 'Kids'),
    'Kids Burger Meal', 'Barn Burger Måltid', 'Barn Burgarmåltid', 'Børn Burger Måltid',
    'Small cheeseburger, fries, and a juice box.',
    'Liten cheeseburger, pommes frites og en juiceboks.',
    'Liten ostburgare, pommes frites och en juiceburk.',
    'Lille cheeseburger, pommes frites og en juiceboks.',
    'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&h=600&fit=crop', 99.00, true
  ),
  (
    (select id from category_ids where name = 'Kids'),
    'Kids Tenders Meal', 'Barn Tenders Måltid', 'Barn Tendersmåltid', 'Børn Tenders Måltid',
    'Three chicken tenders, fries, and a juice box.',
    'Tre kyllingtenders, pommes frites og en juiceboks.',
    'Tre kycklingtenders, pommes frites och en juiceburk.',
    'Tre kyllingtenders, pommes frites og en juiceboks.',
    'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=600&h=600&fit=crop', 99.00, true
  ),
  (
    (select id from category_ids where name = 'Kids'),
    'Kids Fries', 'Barn Frites', 'Barn Pommes', 'Børn Frites',
    'Small portion of crispy fries with ketchup.',
    'Liten porsjon pommes frites med ketchup.',
    'Liten portion pommes frites med ketchup.',
    'Lille portion pommes frites med ketchup.',
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&h=600&fit=crop', 39.00, true
  )
on conflict (name) do update set
  category_id = excluded.category_id,
  name_no = excluded.name_no,
  name_sv = excluded.name_sv,
  name_da = excluded.name_da,
  description = excluded.description,
  description_no = excluded.description_no,
  description_sv = excluded.description_sv,
  description_da = excluded.description_da,
  image_url = excluded.image_url,
  price = excluded.price,
  is_available = excluded.is_available;

insert into public.menu_item_locations (menu_item_id, location_id, is_available)
select menu_items.id, locations.id, true
from public.menu_items
cross join public.locations
on conflict (menu_item_id, location_id) do update set
  is_available = excluded.is_available;

with unavailable_items as (
  select menu_items.id as menu_item_id, locations.id as location_id
  from public.menu_items
  cross join public.locations
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
values
  ('Extra cheese', 'Ekstra ost', 'Extra ost', 'Ekstra ost', 15.00, true, 10),
  ('Bacon', 'Bacon', 'Bacon', 'Bacon', 25.00, true, 20),
  ('Extra beef patty', 'Ekstra biffpatty', 'Extra nötköttsbiff', 'Ekstra bøfpatty', 45.00, true, 30),
  ('Extra crispy chicken', 'Ekstra sprø kylling', 'Extra krispig kyckling', 'Ekstra sprød kylling', 45.00, true, 40),
  ('Extra halloumi', 'Ekstra halloumi', 'Extra halloumi', 'Ekstra halloumi', 35.00, true, 50),
  ('Extra falafel', 'Ekstra falafel', 'Extra falafel', 'Ekstra falafel', 30.00, true, 60),
  ('Fries', 'Pommes frites', 'Pommes frites', 'Pommes frites', 39.00, true, 70),
  ('Garlic dip', 'Hvitløksdip', 'Vitlöksdipp', 'Hvidløgsdip', 15.00, true, 80),
  ('Chipotle mayo', 'Chipotlemayo', 'Chipotlemajo', 'Chipotlemayo', 15.00, true, 90)
on conflict (name) do update set
  name_no = excluded.name_no,
  name_sv = excluded.name_sv,
  name_da = excluded.name_da,
  price = excluded.price,
  is_available = excluded.is_available,
  sort_order = excluded.sort_order;

with item_add_ons(item_name, add_on_name, sort_order) as (
  values
    ('Classic Burger', 'Extra cheese', 10),
    ('Classic Burger', 'Bacon', 20),
    ('Classic Burger', 'Extra beef patty', 30),
    ('Classic Burger', 'Fries', 40),
    ('Smash Double', 'Extra cheese', 10),
    ('Smash Double', 'Bacon', 20),
    ('Smash Double', 'Extra beef patty', 30),
    ('Smash Double', 'Fries', 40),
    ('BBQ Bacon Burger', 'Extra cheese', 10),
    ('BBQ Bacon Burger', 'Bacon', 20),
    ('BBQ Bacon Burger', 'Extra beef patty', 30),
    ('BBQ Bacon Burger', 'Fries', 40),
    ('Veggie Halloumi Burger', 'Extra cheese', 10),
    ('Veggie Halloumi Burger', 'Extra halloumi', 20),
    ('Veggie Halloumi Burger', 'Fries', 30),
    ('Crispy Chicken Burger', 'Extra cheese', 10),
    ('Crispy Chicken Burger', 'Extra crispy chicken', 20),
    ('Crispy Chicken Burger', 'Fries', 30),
    ('Hot Honey Chicken', 'Extra crispy chicken', 10),
    ('Hot Honey Chicken', 'Fries', 20),
    ('Chicken Tenders', 'Fries', 10),
    ('Chicken Tenders', 'Garlic dip', 20),
    ('Loaded Beef Bowl', 'Extra cheese', 10),
    ('Loaded Beef Bowl', 'Bacon', 20),
    ('Loaded Beef Bowl', 'Extra beef patty', 30),
    ('Crispy Chicken Bowl', 'Extra crispy chicken', 10),
    ('Crispy Chicken Bowl', 'Chipotle mayo', 20),
    ('Green Falafel Bowl', 'Extra falafel', 10),
    ('Green Falafel Bowl', 'Extra halloumi', 20),
    ('Kids Burger Meal', 'Extra cheese', 10),
    ('Kids Burger Meal', 'Fries', 20),
    ('Kids Tenders Meal', 'Fries', 10),
    ('Kids Tenders Meal', 'Garlic dip', 20),
    ('Kids Fries', 'Garlic dip', 10)
)
insert into public.menu_item_add_on_options (menu_item_id, add_on_option_id, sort_order)
select menu_items.id, add_on_options.id, item_add_ons.sort_order
from item_add_ons
join public.menu_items on menu_items.name = item_add_ons.item_name
join public.add_on_options on add_on_options.name = item_add_ons.add_on_name
on conflict (menu_item_id, add_on_option_id) do update set
  sort_order = excluded.sort_order;

insert into public.ingredients (name, name_no, name_sv, name_da)
values
  ('American cheese', 'Amerikansk ost', 'Amerikansk ost', 'Amerikansk ost'),
  ('Bacon', 'Bacon', 'Bacon', 'Bacon'),
  ('Barbecue sauce', 'Barbecuesaus', 'Barbecuesås', 'Barbecuesauce'),
  ('Beef patty', 'Biffpatty', 'Nötköttsbiff', 'Bøfpatty'),
  ('Burger sauce', 'Burgerdressing', 'Burgarsås', 'Burgursauce'),
  ('Cheddar', 'Cheddar', 'Cheddar', 'Cheddar'),
  ('Chipotle mayo', 'Chipotlemayo', 'Chipotlemajo', 'Chipotlemayo'),
  ('Chocolate dip', 'Sjokoladesaus', 'Chokladsås', 'Chokoladesauce'),
  ('Creamy ranch', 'Kremet ranch', 'Krämig ranch', 'Cremet ranch'),
  ('Cucumber', 'Agurk', 'Gurka', 'Agurk'),
  ('Falafel', 'Falafel', 'Falafel', 'Falafel'),
  ('Fries', 'Pommes frites', 'Pommes frites', 'Pommes frites'),
  ('Fried chicken', 'Fritert kylling', 'Friterad kyckling', 'Friteret kylling'),
  ('Fried onions', 'Stekt løk', 'Stekt lök', 'Stegt løg'),
  ('Garlic dip', 'Hvitløksdip', 'Vitlöksdipp', 'Hvidløgsdip'),
  ('Grilled halloumi', 'Grillet halloumi', 'Grillad halloumi', 'Grillet halloumi'),
  ('Herb mayo', 'Urtemayo', 'Örtmajo', 'Urtemayo'),
  ('Honey glaze', 'Honningglasur', 'Honungsglasyr', 'Honningsglasur'),
  ('House sauce', 'Husets saus', 'Husets sås', 'Husets sauce'),
  ('Hummus', 'Hummus', 'Hummus', 'Hummus'),
  ('Jalapenos', 'Jalapeños', 'Jalapeños', 'Jalapeños'),
  ('Ketchup', 'Ketchup', 'Ketchup', 'Ketchup'),
  ('Lemon dressing', 'Sitrondressing', 'Citrondressing', 'Citrondressing'),
  ('Lettuce', 'Salat', 'Sallad', 'Salat'),
  ('Mozzarella', 'Mozzarella', 'Mozzarella', 'Mozzarella'),
  ('Onion', 'Løk', 'Lök', 'Løg'),
  ('Pickled onion', 'Syltet løk', 'Inlagd lök', 'Syltet løg'),
  ('Pickles', 'Sylteagurk', 'Pickles', 'Sylteagurk'),
  ('Rice', 'Ris', 'Ris', 'Ris'),
  ('Roasted peppers', 'Grillede paprika', 'Rostade paprikor', 'Grillede peberfrugter'),
  ('Sea salt', 'Havsalt', 'Havssalt', 'Havsalt'),
  ('Slaw', 'Kålsalat', 'Kålsallad', 'Kålsalat'),
  ('Sour cream', 'Rømme', 'Gräddfil', 'Creme fraiche'),
  ('Spicy mayo', 'Spicy mayo', 'Spicy mayo', 'Spicy mayo'),
  ('Tomato', 'Tomat', 'Tomat', 'Tomat'),
  ('Tomato dip', 'Tomatsaus', 'Tomatsås', 'Tomatsauce'),
  ('Tomato salsa', 'Tomatsalsa', 'Tomatsalsa', 'Tomatsalsa')
on conflict (name) do update set
  name_no = excluded.name_no,
  name_sv = excluded.name_sv,
  name_da = excluded.name_da;

with item_ingredients(item_name, ingredient_name, sort_order) as (
  values
    ('Classic Burger', 'Beef patty', 10),
    ('Classic Burger', 'Cheddar', 20),
    ('Classic Burger', 'Lettuce', 30),
    ('Classic Burger', 'Tomato', 40),
    ('Classic Burger', 'Pickles', 50),
    ('Classic Burger', 'House sauce', 60),
    ('Smash Double', 'Beef patty', 10),
    ('Smash Double', 'American cheese', 20),
    ('Smash Double', 'Onion', 30),
    ('Smash Double', 'Pickles', 40),
    ('Smash Double', 'Burger sauce', 50),
    ('BBQ Bacon Burger', 'Beef patty', 10),
    ('BBQ Bacon Burger', 'Bacon', 20),
    ('BBQ Bacon Burger', 'Cheddar', 30),
    ('BBQ Bacon Burger', 'Fried onions', 40),
    ('BBQ Bacon Burger', 'Barbecue sauce', 50),
    ('Veggie Halloumi Burger', 'Grilled halloumi', 10),
    ('Veggie Halloumi Burger', 'Roasted peppers', 20),
    ('Veggie Halloumi Burger', 'Lettuce', 30),
    ('Veggie Halloumi Burger', 'Tomato', 40),
    ('Veggie Halloumi Burger', 'Herb mayo', 50),
    ('Crispy Chicken Burger', 'Fried chicken', 10),
    ('Crispy Chicken Burger', 'Slaw', 20),
    ('Crispy Chicken Burger', 'Pickles', 30),
    ('Crispy Chicken Burger', 'Spicy mayo', 40),
    ('Hot Honey Chicken', 'Fried chicken', 10),
    ('Hot Honey Chicken', 'Honey glaze', 20),
    ('Hot Honey Chicken', 'Pickles', 30),
    ('Hot Honey Chicken', 'Creamy ranch', 40),
    ('Chicken Tenders', 'Fried chicken', 10),
    ('Chicken Tenders', 'Garlic dip', 20),
    ('Loaded Beef Bowl', 'Beef patty', 10),
    ('Loaded Beef Bowl', 'Fries', 20),
    ('Loaded Beef Bowl', 'Cheddar', 30),
    ('Loaded Beef Bowl', 'Jalapenos', 40),
    ('Loaded Beef Bowl', 'Tomato salsa', 50),
    ('Loaded Beef Bowl', 'Sour cream', 60),
    ('Crispy Chicken Bowl', 'Fried chicken', 10),
    ('Crispy Chicken Bowl', 'Rice', 20),
    ('Crispy Chicken Bowl', 'Slaw', 30),
    ('Crispy Chicken Bowl', 'Cucumber', 40),
    ('Crispy Chicken Bowl', 'Pickled onion', 50),
    ('Crispy Chicken Bowl', 'Spicy mayo', 60),
    ('Green Falafel Bowl', 'Falafel', 10),
    ('Green Falafel Bowl', 'Rice', 20),
    ('Green Falafel Bowl', 'Hummus', 30),
    ('Green Falafel Bowl', 'Cucumber', 40),
    ('Green Falafel Bowl', 'Tomato', 50),
    ('Green Falafel Bowl', 'Lemon dressing', 60),
    ('Fries', 'Fries', 10),
    ('Fries', 'Sea salt', 20),
    ('Sweet Potato Fries', 'Chipotle mayo', 10),
    ('Onion Rings', 'Onion', 10),
    ('Onion Rings', 'Creamy ranch', 20),
    ('Mozzarella Sticks', 'Mozzarella', 10),
    ('Mozzarella Sticks', 'Tomato dip', 20),
    ('Chocolate Brownie', 'Chocolate dip', 10),
    ('Cinnamon Churros', 'Chocolate dip', 10),
    ('Kids Burger Meal', 'Beef patty', 10),
    ('Kids Burger Meal', 'American cheese', 20),
    ('Kids Burger Meal', 'Fries', 30),
    ('Kids Tenders Meal', 'Fried chicken', 10),
    ('Kids Tenders Meal', 'Fries', 20),
    ('Kids Fries', 'Fries', 10),
    ('Kids Fries', 'Ketchup', 20)
)
insert into public.menu_item_ingredients (menu_item_id, ingredient_id, is_removable, sort_order)
select menu_items.id, ingredients.id, true, item_ingredients.sort_order
from item_ingredients
join public.menu_items on menu_items.name = item_ingredients.item_name
join public.ingredients on ingredients.name = item_ingredients.ingredient_name
on conflict (menu_item_id, ingredient_id) do update set
  is_removable = excluded.is_removable,
  sort_order = excluded.sort_order;

insert into public.allergens (name, name_no, name_sv, name_da)
values
  ('Celery', 'Selleri', 'Selleri', 'Selleri'),
  ('Eggs', 'Egg', 'Ägg', 'Æg'),
  ('Fish', 'Fisk', 'Fisk', 'Fisk'),
  ('Gluten', 'Gluten', 'Gluten', 'Gluten'),
  ('Milk', 'Melk', 'Mjölk', 'Mælk'),
  ('Mustard', 'Sennep', 'Senap', 'Sennep'),
  ('Sesame', 'Sesam', 'Sesam', 'Sesam'),
  ('Soy', 'Soya', 'Soja', 'Soja'),
  ('Sulphites', 'Sulfitt', 'Sulfit', 'Sulfitter')
on conflict (name) do nothing;

with item_allergens(item_name, allergen_name, sort_order) as (
  values
    ('Classic Burger', 'Gluten', 10),
    ('Classic Burger', 'Milk', 20),
    ('Classic Burger', 'Eggs', 30),
    ('Classic Burger', 'Mustard', 40),
    ('Smash Double', 'Gluten', 10),
    ('Smash Double', 'Milk', 20),
    ('Smash Double', 'Eggs', 30),
    ('Smash Double', 'Mustard', 40),
    ('BBQ Bacon Burger', 'Gluten', 10),
    ('BBQ Bacon Burger', 'Milk', 20),
    ('BBQ Bacon Burger', 'Eggs', 30),
    ('BBQ Bacon Burger', 'Mustard', 40),
    ('Veggie Halloumi Burger', 'Gluten', 10),
    ('Veggie Halloumi Burger', 'Milk', 20),
    ('Veggie Halloumi Burger', 'Eggs', 30),
    ('Crispy Chicken Burger', 'Gluten', 10),
    ('Crispy Chicken Burger', 'Eggs', 20),
    ('Crispy Chicken Burger', 'Mustard', 30),
    ('Hot Honey Chicken', 'Gluten', 10),
    ('Hot Honey Chicken', 'Eggs', 20),
    ('Hot Honey Chicken', 'Milk', 30),
    ('Chicken Tenders', 'Gluten', 10),
    ('Chicken Tenders', 'Eggs', 20),
    ('Loaded Beef Bowl', 'Milk', 10),
    ('Loaded Beef Bowl', 'Sulphites', 20),
    ('Crispy Chicken Bowl', 'Gluten', 10),
    ('Crispy Chicken Bowl', 'Eggs', 20),
    ('Crispy Chicken Bowl', 'Mustard', 30),
    ('Green Falafel Bowl', 'Gluten', 10),
    ('Green Falafel Bowl', 'Sesame', 20),
    ('Fries', 'Gluten', 10),
    ('Sweet Potato Fries', 'Eggs', 10),
    ('Sweet Potato Fries', 'Mustard', 20),
    ('Onion Rings', 'Gluten', 10),
    ('Onion Rings', 'Eggs', 20),
    ('Mozzarella Sticks', 'Gluten', 10),
    ('Mozzarella Sticks', 'Milk', 20),
    ('Cola', 'Sulphites', 10),
    ('Cola Zero', 'Sulphites', 10),
    ('House Lemonade', 'Sulphites', 10),
    ('Chocolate Brownie', 'Gluten', 10),
    ('Chocolate Brownie', 'Milk', 20),
    ('Chocolate Brownie', 'Eggs', 30),
    ('Cinnamon Churros', 'Gluten', 10),
    ('Cinnamon Churros', 'Milk', 20),
    ('Vanilla Milkshake', 'Milk', 10),
    ('Kids Burger Meal', 'Gluten', 10),
    ('Kids Burger Meal', 'Milk', 20),
    ('Kids Tenders Meal', 'Gluten', 10),
    ('Kids Tenders Meal', 'Eggs', 20),
    ('Kids Fries', 'Gluten', 10)
)
insert into public.menu_item_allergens (menu_item_id, allergen_id, sort_order)
select menu_items.id, allergens.id, item_allergens.sort_order
from item_allergens
join public.menu_items on menu_items.name = item_allergens.item_name
join public.allergens on allergens.name = item_allergens.allergen_name
on conflict (menu_item_id, allergen_id) do update set
  sort_order = excluded.sort_order;
