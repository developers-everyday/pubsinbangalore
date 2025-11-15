-- Migration: Remove deprecated pub_badges table
-- Date: 2024

-- Drop RLS policies if they exist
drop policy if exists pub_badges_public_read on public.pub_badges;
drop policy if exists pub_badges_service_role_manage on public.pub_badges;

-- Disable RLS prior to dropping the table
alter table if exists public.pub_badges disable row level security;

-- Drop the table
drop table if exists public.pub_badges cascade;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

