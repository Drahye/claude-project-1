-- 010_school_branding.sql
-- Per-school public page branding fields (Phase 1: school-first / multi-tenant)
-- Safe to run multiple times.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS welcome_headline text,
  ADD COLUMN IF NOT EXISTS welcome_subtext  text,
  ADD COLUMN IF NOT EXISTS hero_image_url   text,
  ADD COLUMN IF NOT EXISTS contact_email    text,
  ADD COLUMN IF NOT EXISTS contact_phone    text,
  ADD COLUMN IF NOT EXISTS public_color     text,   -- public /{slug} page accent (separate from dashboard theme = primary_color)
  ADD COLUMN IF NOT EXISTS content_blocks   jsonb NOT NULL DEFAULT '[]'::jsonb;

-- The public /{slug} page is rendered server-side with the service-role key
-- (server-only), so no public anon RLS policy is required. Branding fields are
-- considered public-by-design (name, logo, colour, welcome copy, hero image).
