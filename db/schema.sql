-- Supabase/Postgres base schema for Bangalore Pubs Directory
-- Generated during Phase 0 to support data ingestion and enrichment.

-- Enable useful extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Utility function to maintain updated_at columns
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- 1. Localities
create table if not exists public.localities (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text not null unique,
    city text not null default 'Bengaluru',
    state text not null default 'Karnataka',
    latitude numeric(9,6),
    longitude numeric(9,6),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

do $$
begin
    if not exists (
        select 1 from pg_trigger where tgname = 'trg_localities_updated_at'
    ) then
        create trigger trg_localities_updated_at
        before update on public.localities
        for each row
        execute procedure public.set_updated_at();
    end if;
end $$;

-- 2. Pubs
create table if not exists public.pubs (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text not null unique,
    description text,
    google_maps_url text not null,
    website_url text,
    phone text,
    status text not null default 'operational',
    average_rating numeric(2,1),
    review_count integer,
    cost_for_two_min integer,
    cost_for_two_max integer,
    cover_charge_min integer,
    cover_charge_max integer,
    cover_charge_redeemable boolean,
    stag_entry_policy text,
    couples_entry_policy text,
    wheelchair_accessible boolean,
    wifi_available boolean,
    valet_available boolean,
    happy_hours_note text,
    operating_hours_raw jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists idx_pubs_name_slug on public.pubs (lower(name), slug);
create index if not exists idx_pubs_status on public.pubs (status);
create index if not exists idx_pubs_rating on public.pubs (average_rating desc, review_count desc);
create index if not exists idx_pubs_textsearch on public.pubs using gin (to_tsvector('english', coalesce(name, '') || " " || coalesce(description, '')));

do $$
begin
    if not exists (
        select 1 from pg_trigger where tgname = 'trg_pubs_updated_at'
    ) then
        create trigger trg_pubs_updated_at
        before update on public.pubs
        for each row
        execute procedure public.set_updated_at();
    end if;
end $$;

-- 3. Pivot table associating pubs to localities
create table if not exists public.pub_localities (
    pub_id uuid not null references public.pubs(id) on delete cascade,
    locality_id uuid not null references public.localities(id) on delete cascade,
    is_primary boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (pub_id, locality_id)
);

do $$
begin
    if not exists (
        select 1 from pg_trigger where tgname = 'trg_pub_localities_updated_at'
    ) then
        create trigger trg_pub_localities_updated_at
        before update on public.pub_localities
        for each row
        execute procedure public.set_updated_at();
    end if;
end $$;

-- 4. Attribute dictionary
create table if not exists public.attributes (
    id uuid primary key default uuid_generate_v4(),
    code text not null unique,
    label text not null,
    description text,
    tier text not null check (tier in ('tier1', 'tier2', 'tier3')),
    data_type text not null check (data_type in ('boolean', 'rating', 'integer', 'integer_range', 'text', 'tag_set', 'schedule', 'json')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

do $$
begin
    if not exists (
        select 1 from pg_trigger where tgname = 'trg_attributes_updated_at'
    ) then
        create trigger trg_attributes_updated_at
        before update on public.attributes
        for each row
        execute procedure public.set_updated_at();
    end if;
end $$;

-- 5. Attribute values per pub
create table if not exists public.pub_attribute_values (
    pub_id uuid not null references public.pubs(id) on delete cascade,
    attribute_id uuid not null references public.attributes(id) on delete cascade,
    boolean_value boolean,
    int_value integer,
    numeric_min integer,
    numeric_max integer,
    text_value text,
    tags_value text[],
    schedule_value jsonb,
    rating_value numeric(2,1),
    source text default 'manual' check (source in ('scraped', 'ai_generated', 'manual')),
    last_verified_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (pub_id, attribute_id)
);

do $$
begin
    if not exists (
        select 1 from pg_trigger where tgname = 'trg_pub_attribute_values_updated_at'
    ) then
        create trigger trg_pub_attribute_values_updated_at
        before update on public.pub_attribute_values
        for each row
        execute procedure public.set_updated_at();
    end if;
end $$;

create index if not exists idx_pub_attribute_values_pub on public.pub_attribute_values (pub_id);
create index if not exists idx_pub_attribute_values_attribute on public.pub_attribute_values (attribute_id);

-- 5a. Profiles (auth-linked)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    role text not null default 'editor' check (role in ('admin', 'editor', 'owner', 'viewer')),
    full_name text,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

do $$
begin
    if not exists (
        select 1 from pg_trigger where tgname = 'trg_profiles_updated_at'
    ) then
        create trigger trg_profiles_updated_at
        before update on public.profiles
        for each row
        execute procedure public.set_updated_at();
    end if;
end $$;

alter table public.profiles enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'profiles_self_access'
    ) then
        create policy profiles_self_access on public.profiles
        for select using (auth.uid() = id)
        with check (auth.uid() = id);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'profiles_admin_manage'
    ) then
        create policy profiles_admin_manage on public.profiles
        for all using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role');
    end if;
end $$;

-- 6. AI content jobs (forward-looking)
create table if not exists public.ai_content_jobs (
    id uuid primary key default uuid_generate_v4(),
    pub_id uuid not null references public.pubs(id) on delete cascade,
    job_type text not null check (job_type in ('description', 'attributes', 'full_enrichment', 'faq', 'schema', 'insight')),
    status text not null default 'pending' check (status in ('pending', 'processing', 'awaiting_review', 'approved', 'rejected', 'failed', 'completed')),
    payload jsonb,
    output jsonb,
    error jsonb,
    approved_by uuid references public.profiles(id),
    approved_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz
);

do $$
begin
    if not exists (
        select 1 from pg_trigger where tgname = 'trg_ai_content_jobs_updated_at'
    ) then
        create trigger trg_ai_content_jobs_updated_at
        before update on public.ai_content_jobs
        for each row
        execute procedure public.set_updated_at();
    end if;
end $$;

create index if not exists idx_ai_content_jobs_status on public.ai_content_jobs (status);
create index if not exists idx_ai_content_jobs_pub on public.ai_content_jobs (pub_id);

-- 7. Ownership claims
create table if not exists public.pub_claims (
    id uuid primary key default uuid_generate_v4(),
    pub_id uuid not null references public.pubs(id) on delete cascade,
    email text not null,
    status text not null default 'pending' check (status in ('pending', 'pending_verification', 'approved', 'rejected')),
    verification_token text not null unique,
    requested_at timestamptz not null default now(),
    verified_at timestamptz,
    approved_at timestamptz,
    rejected_at timestamptz,
    rejection_reason text,
    metadata jsonb
);

create index if not exists idx_pub_claims_pub on public.pub_claims (pub_id);
create index if not exists idx_pub_claims_status on public.pub_claims (status);

-- 8. Pub change history
create table if not exists public.pub_change_history (
    id uuid primary key default uuid_generate_v4(),
    pub_id uuid not null references public.pubs(id) on delete cascade,
    actor_id uuid references public.profiles(id),
    actor_email text,
    action text not null,
    before jsonb,
    after jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_pub_change_history_pub on public.pub_change_history (pub_id);

-- 9. Community reports
create table if not exists public.community_reports (
    id uuid primary key default uuid_generate_v4(),
    pub_id uuid not null references public.pubs(id) on delete cascade,
    email text,
    message text,
    evidence_url text,
    status text not null default 'pending' check (status in ('pending', 'approved', 'dismissed')),
    created_at timestamptz not null default now(),
    resolved_at timestamptz,
    resolver_id uuid references public.profiles(id)
);

create index if not exists idx_community_reports_pub on public.community_reports (pub_id);
create index if not exists idx_community_reports_status on public.community_reports (status);

-- RLS Policies
alter table public.localities enable row level security;
alter table public.pubs enable row level security;
alter table public.pub_localities enable row level security;
alter table public.attributes enable row level security;
alter table public.pub_attribute_values enable row level security;
alter table public.ai_content_jobs enable row level security;
alter table public.pub_claims enable row level security;
alter table public.pub_change_history enable row level security;
alter table public.community_reports enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'localities_public_read'
    ) then
        create policy localities_public_read on public.localities
        for select using (true);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'pubs_public_read'
    ) then
        create policy pubs_public_read on public.pubs
        for select using (true);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'pubs_service_role_write'
    ) then
        create policy pubs_service_role_write on public.pubs
        for all using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role');
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'attributes_public_read'
    ) then
        create policy attributes_public_read on public.attributes
        for select using (true);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'attributes_service_role_write'
    ) then
        create policy attributes_service_role_write on public.attributes
        for all using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role');
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'pub_localities_public_read'
    ) then
        create policy pub_localities_public_read on public.pub_localities
        for select using (true);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'pub_localities_service_role_write'
    ) then
        create policy pub_localities_service_role_write on public.pub_localities
        for all using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role');
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'pub_attribute_values_public_read'
    ) then
        create policy pub_attribute_values_public_read on public.pub_attribute_values
        for select using (true);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'pub_attribute_values_service_role_write'
    ) then
        create policy pub_attribute_values_service_role_write on public.pub_attribute_values
        for all using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role');
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'ai_content_jobs_service_role_only'
    ) then
        create policy ai_content_jobs_service_role_only on public.ai_content_jobs
        for all using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role');
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'pub_claims_service_role_manage'
    ) then
        create policy pub_claims_service_role_manage on public.pub_claims
        for all using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role');
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'pub_change_history_service_role'
    ) then
        create policy pub_change_history_service_role on public.pub_change_history
        for all using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role');
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where polname = 'community_reports_service_role_manage'
    ) then
        create policy community_reports_service_role_manage on public.community_reports
        for all using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role');
    end if;
end $$;

