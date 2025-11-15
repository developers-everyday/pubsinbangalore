-- Seed pub-localities relationships
-- Links imported pubs to localities based on address analysis
-- Uses subquery to get locality IDs by slug

-- JP Nagar pubs
insert into public.pub_localities (pub_id, locality_id, is_primary)
select 
    p.id,
    l.id,
    true
from public.pubs p
cross join lateral (
    select id from public.localities where slug = 'jp-nagar' limit 1
) l
where p.slug in (
    '1522-the-pub-jp-nagar',
    'the-pump-house',
    'tipsy-bull---the-bar-exchange---jp-nagar',
    'the-palms-brew-and-kitchen',
    'rajarajeshwari-bar&-restaurant',
    'banashankari-bar-and-restaurent',
    'alankar-bar-and-restaurant',
    'fat-owl---gastropub'
)
on conflict (pub_id, locality_id) do nothing;

-- Jayanagar pubs
insert into public.pub_localities (pub_id, locality_id, is_primary)
select 
    p.id,
    l.id,
    true
from public.pubs p
cross join lateral (
    select id from public.localities where slug = 'jayanagar' limit 1
) l
where p.slug = 'lit-gastropub-bangalore'
on conflict (pub_id, locality_id) do nothing;

-- Padmanabhanagar pubs (mapped to nearest existing locality - JP Nagar for now)
-- Note: Padmanabhanagar should be added to localities table in future
insert into public.pub_localities (pub_id, locality_id, is_primary)
select 
    p.id,
    l.id,
    true
from public.pubs p
cross join lateral (
    select id from public.localities where slug = 'jp-nagar' limit 1
) l
where p.slug in (
    'second-house-(padmanabhanagar)',
    'blue-moon-bar-and-restaurant',
    'neela-bar-&-restaurant',
    'shankari-bar-&-restaurant'
)
on conflict (pub_id, locality_id) do nothing;

-- Kumaraswamy Layout pubs (mapped to JP Nagar as nearest)
insert into public.pub_localities (pub_id, locality_id, is_primary)
select 
    p.id,
    l.id,
    true
from public.pubs p
cross join lateral (
    select id from public.localities where slug = 'jp-nagar' limit 1
) l
where p.slug in (
    'toast-on-terrace',
    'the-mermaid',
    'manjunatha-bar-&-restaurant',
    'santosh-bar-&-restaurant',
    'nischith-bar-and-restaurant',
    'garden-court-bar-and-restaurant'
)
on conflict (pub_id, locality_id) do nothing;

-- Banashankari pubs (mapped to JP Nagar as nearest)
insert into public.pub_localities (pub_id, locality_id, is_primary)
select 
    p.id,
    l.id,
    true
from public.pubs p
cross join lateral (
    select id from public.localities where slug = 'jp-nagar' limit 1
) l
where p.slug = 'k27-the-pub'
on conflict (pub_id, locality_id) do nothing;

-- Ganapathipura pubs (mapped to JP Nagar as nearest)
insert into public.pub_localities (pub_id, locality_id, is_primary)
select 
    p.id,
    l.id,
    true
from public.pubs p
cross join lateral (
    select id from public.localities where slug = 'jp-nagar' limit 1
) l
where p.slug in (
    'pub-1992',
    'laxmi-bar-&-restaurant'
)
on conflict (pub_id, locality_id) do nothing;




