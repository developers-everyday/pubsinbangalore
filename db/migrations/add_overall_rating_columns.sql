-- Migration: Add overall rating columns to pubs table
-- These columns are defined in schema.sql but may not exist in existing databases
-- Date: 2024

-- Add overall_rating_average column
alter table public.pubs
    add column if not exists overall_rating_average numeric(2,1);

-- Add overall_rating_min column
alter table public.pubs
    add column if not exists overall_rating_min numeric(2,1);

-- Add overall_rating_max column
alter table public.pubs
    add column if not exists overall_rating_max numeric(2,1);

-- Add overall_rating_details column
alter table public.pubs
    add column if not exists overall_rating_details text;

-- Add ratings_last_synced_at column
alter table public.pubs
    add column if not exists ratings_last_synced_at timestamptz;

