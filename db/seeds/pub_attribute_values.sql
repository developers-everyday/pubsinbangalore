-- Seed sample pub attribute values for UI testing
-- Adds diverse attributes to popular pubs to demonstrate filtering/search functionality

-- 1522 The Pub JP Nagar - Popular pub with rooftop and live music
insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'rooftop_seating' limit 1
) a
where p.slug = '1522-the-pub-jp-nagar'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'live_music' limit 1
) a
where p.slug = '1522-the-pub-jp-nagar'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'craft_beer' limit 1
) a
where p.slug = '1522-the-pub-jp-nagar'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'parking_available' limit 1
) a
where p.slug = '1522-the-pub-jp-nagar'
on conflict (pub_id, attribute_id) do nothing;

-- The Pump House - Craft brewery with multiple floors
insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'craft_beer' limit 1
) a
where p.slug = 'the-pump-house'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, int_value, source)
select 
    p.id,
    a.id,
    2,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'floor_count' limit 1
) a
where p.slug = 'the-pump-house'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'parking_available' limit 1
) a
where p.slug = 'the-pump-house'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, tags_value, source)
select 
    p.id,
    a.id,
    ARRAY['IPA', 'Lager', 'Wheat Beer', 'Stout'],
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'beer_variety' limit 1
) a
where p.slug = 'the-pump-house'
on conflict (pub_id, attribute_id) do nothing;

-- Tipsy Bull - Happy hour deals and sports screening
insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'sports_screening' limit 1
) a
where p.slug = 'tipsy-bull---the-bar-exchange---jp-nagar'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, tags_value, source)
select 
    p.id,
    a.id,
    ARRAY['1+1 on Beer', '2+1 on Cocktails', 'Happy Hour Discounts'],
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'happy_hour_deals' limit 1
) a
where p.slug = 'tipsy-bull---the-bar-exchange---jp-nagar'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, schedule_value, source)
select 
    p.id,
    a.id,
    '{"days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "timings": "4pm-7pm"}'::jsonb,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'happy_hour_schedule' limit 1
) a
where p.slug = 'tipsy-bull---the-bar-exchange---jp-nagar'
on conflict (pub_id, attribute_id) do nothing;

-- The Palms Brew and Kitchen - High-rated craft brewery
insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'craft_beer' limit 1
) a
where p.slug = 'the-palms-brew-and-kitchen'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, tags_value, source)
select 
    p.id,
    a.id,
    ARRAY['Pale Ale', 'IPA', 'Wheat Beer', 'Pilsner'],
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'beer_variety' limit 1
) a
where p.slug = 'the-palms-brew-and-kitchen'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, rating_value, source)
select 
    p.id,
    a.id,
    4.5,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'food_quality_rating' limit 1
) a
where p.slug = 'the-palms-brew-and-kitchen'
on conflict (pub_id, attribute_id) do nothing;

-- Fat Owl - Gastropub with live music
insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'live_music' limit 1
) a
where p.slug = 'fat-owl---gastropub'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'wifi' limit 1
) a
where p.slug = 'fat-owl---gastropub'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, tags_value, source)
select 
    p.id,
    a.id,
    ARRAY['Rock', 'Bollywood', 'Indie'],
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'music_genres' limit 1
) a
where p.slug = 'fat-owl---gastropub'
on conflict (pub_id, attribute_id) do nothing;

-- LIT Gastropub - Sports screening and WiFi
insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'sports_screening' limit 1
) a
where p.slug = 'lit-gastropub-bangalore'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'wifi' limit 1
) a
where p.slug = 'lit-gastropub-bangalore'
on conflict (pub_id, attribute_id) do nothing;

-- Toast on Terrace - Rooftop and outdoor seating
insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'rooftop_seating' limit 1
) a
where p.slug = 'toast-on-terrace'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'outdoor_seating' limit 1
) a
where p.slug = 'toast-on-terrace'
on conflict (pub_id, attribute_id) do nothing;

-- The Mermaid - Parking available
insert into public.pub_attribute_values (pub_id, attribute_id, boolean_value, source)
select 
    p.id,
    a.id,
    true,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'parking_available' limit 1
) a
where p.slug = 'the-mermaid'
on conflict (pub_id, attribute_id) do nothing;

-- Add cost_for_two_range for a few pubs
insert into public.pub_attribute_values (pub_id, attribute_id, numeric_min, numeric_max, source)
select 
    p.id,
    a.id,
    1200,
    1800,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'cost_for_two_range' limit 1
) a
where p.slug = '1522-the-pub-jp-nagar'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, numeric_min, numeric_max, source)
select 
    p.id,
    a.id,
    1500,
    2500,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'cost_for_two_range' limit 1
) a
where p.slug = 'the-pump-house'
on conflict (pub_id, attribute_id) do nothing;

insert into public.pub_attribute_values (pub_id, attribute_id, numeric_min, numeric_max, source)
select 
    p.id,
    a.id,
    1000,
    1500,
    'manual'
from public.pubs p
cross join lateral (
    select id from public.attributes where code = 'cost_for_two_range' limit 1
) a
where p.slug = 'tipsy-bull---the-bar-exchange---jp-nagar'
on conflict (pub_id, attribute_id) do nothing;




