-- 011_school_theme.sql
-- Public-page theme selection. Safe to run multiple times.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'aurora';
