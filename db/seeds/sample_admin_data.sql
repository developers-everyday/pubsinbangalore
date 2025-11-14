-- Seed sample admin data for testing admin dashboard
-- Includes pub claims and community reports with various statuses

-- Sample pub claims (ownership verification requests)
insert into public.pub_claims (pub_id, email, status, verification_token, requested_at, verified_at, approved_at, rejected_at)
select 
    p.id,
    'owner@thepumphouse.in',
    'approved',
    'token_' || gen_random_uuid()::text,
    now() - interval '5 days',
    now() - interval '4 days',
    now() - interval '3 days',
    null
from public.pubs p
where p.slug = 'the-pump-house'
on conflict (verification_token) do nothing;

insert into public.pub_claims (pub_id, email, status, verification_token, requested_at, verified_at, approved_at, rejected_at)
select 
    p.id,
    'manager@fatowl.in',
    'pending_verification',
    'token_' || gen_random_uuid()::text,
    now() - interval '2 days',
    null,
    null,
    null
from public.pubs p
where p.slug = 'fat-owl---gastropub'
on conflict (verification_token) do nothing;

insert into public.pub_claims (pub_id, email, status, verification_token, requested_at, verified_at, approved_at, rejected_at, rejection_reason)
select 
    p.id,
    'random@email.com',
    'rejected',
    'token_' || gen_random_uuid()::text,
    now() - interval '7 days',
    now() - interval '6 days',
    null,
    now() - interval '5 days',
    'Unable to verify ownership documents'
from public.pubs p
where p.slug = 'tipsy-bull---the-bar-exchange---jp-nagar'
on conflict (verification_token) do nothing;

-- Sample community reports (data correction requests)
insert into public.community_reports (pub_id, email, message, evidence_url, status, created_at, resolved_at)
select 
    p.id,
    'visitor@example.com',
    'The operating hours listed are incorrect. The pub closes at 1:30 AM on weekends, not 1:00 AM.',
    'https://www.google.com/maps/place/1522+The+Pub+JP+Nagar',
    'pending',
    now() - interval '1 day',
    null
from public.pubs p
where p.slug = '1522-the-pub-jp-nagar';

insert into public.community_reports (pub_id, email, message, evidence_url, status, created_at, resolved_at)
select 
    p.id,
    'customer@example.com',
    'The pub now offers valet parking service. Please update the listing.',
    'https://www.swiggy.com/restaurants/1522-the-pub-jp-nagar-bangalore',
    'approved',
    now() - interval '3 days',
    now() - interval '2 days'
from public.pubs p
where p.slug = '1522-the-pub-jp-nagar';

insert into public.community_reports (pub_id, email, message, evidence_url, status, created_at, resolved_at)
select 
    p.id,
    null,
    'This pub has permanently closed. Please mark as closed.',
    null,
    'dismissed',
    now() - interval '10 days',
    now() - interval '9 days'
from public.pubs p
where p.slug = 'pub-1992';

insert into public.community_reports (pub_id, email, message, evidence_url, status, created_at, resolved_at)
select 
    p.id,
    'local@bangalore.com',
    'The phone number is outdated. New number: +91 98765 43210',
    null,
    'pending',
    now() - interval '5 hours',
    null
from public.pubs p
where p.slug = 'the-palms-brew-and-kitchen';

