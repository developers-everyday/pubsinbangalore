-- Migration: Add pub_plan_visit_content table for Plan Your Visit content
-- Date: 2025-11-15

create table if not exists public.pub_plan_visit_content (
    pub_id uuid primary key references public.pubs(id) on delete cascade,
    status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
    data_source text not null default 'manual' check (data_source in ('manual', 'ai_generated', 'editorial', 'hybrid')),
    visit_summary text,
    highlights jsonb,
    itinerary jsonb,
    faqs jsonb,
    tips jsonb,
    provenance jsonb,
    last_enriched_at timestamptz,
    reviewed_by uuid references public.profiles(id),
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

do $$
begin
    if not exists (
        select 1 from pg_trigger where tgname = 'trg_pub_plan_visit_content_updated_at'
    ) then
        create trigger trg_pub_plan_visit_content_updated_at
        before update on public.pub_plan_visit_content
        for each row
        execute procedure public.set_updated_at();
    end if;
end $$;

alter table public.pub_plan_visit_content enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies where policyname = 'pub_plan_visit_content_public_read'
    ) then
        create policy pub_plan_visit_content_public_read on public.pub_plan_visit_content
        for select using (true);
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies where policyname = 'pub_plan_visit_content_service_role_write'
    ) then
        create policy pub_plan_visit_content_service_role_write on public.pub_plan_visit_content
        for all using (auth.role() = 'service_role')
        with check (auth.role() = 'service_role');
    end if;
end $$;

NOTIFY pgrst, 'reload schema';


