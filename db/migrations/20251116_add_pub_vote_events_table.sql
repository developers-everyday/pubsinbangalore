create table if not exists public.pub_vote_events (
    id uuid primary key default uuid_generate_v4(),
    pub_id uuid not null references public.pubs(id) on delete cascade,
    topic text not null,
    option_id text not null,
    voter_token text not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_pub_vote_events_pub_topic_created
    on public.pub_vote_events (pub_id, topic, created_at desc);

create index if not exists idx_pub_vote_events_voter_topic_created
    on public.pub_vote_events (voter_token, topic, created_at desc);

