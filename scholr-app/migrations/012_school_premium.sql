-- 012_school_premium.sql
-- Paid-tier public-page controls. Safe to run multiple times.

-- "Remove Powered by Scholr" toggle
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS hide_branding boolean NOT NULL DEFAULT false;

-- Custom content sections live in content_blocks (jsonb), added in 010.
-- Shape: [{ "id": "...", "title": "...", "body": "..." }]
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb;
