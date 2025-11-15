-- Migration: Add pub_badges table for backlink generator system
-- Date: 2024

-- Create pub_badges table
create table if not exists public.pub_badges (
    id uuid primary key default uuid_generate_v4(),
    pub_id uuid not null references public.pubs(id) on delete cascade,
    email text not null,
    verification_token text not null unique,
    status text not null default 'pending' check (status in ('pending', 'verified', 'revoked')),
    badge_html text not null,
    badge_type text not null default 'standard' check (badge_type in ('standard', 'compact', 'minimal')),
    created_at timestamptz not null default now(),
    verified_at timestamptz,
    last_seen_at timestamptz,
    revoked_at timestamptz,
    revocation_reason text
);

-- Create indexes
create index if not exists idx_pub_badges_pub on public.pub_badges (pub_id);
create index if not exists idx_pub_badges_status on public.pub_badges (status);
create index if not exists idx_pub_badges_token on public.pub_badges (verification_token);

-- Enable RLS
alter table public.pub_badges enable row level security;

-- Create RLS policies
do $$
begin
    if not exists (
        select 1 from pg_policies where policyname = 'pub_badges_public_read'
    ) then
        create policy pub_badges_public_read on public.pub_badges
        for select using (status = 'verified');
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where policyname = 'pub_badges_service_role_manage'
    ) then
        create policy pub_badges_service_role_manage on public.pub_badges
        for all using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role');
    end if;
end $$;

-- Reload PostgREST schema cache after creating the table
NOTIFY pgrst, 'reload schema';

