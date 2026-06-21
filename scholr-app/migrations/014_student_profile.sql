-- 014_student_profile.sql
-- Rich student profile: role-contributed sections. Safe to run multiple times.
--   medical    — admin + parent (blood group, allergies, conditions, emergency contact…)
--   personal   — parent (hobbies, interests, languages, dietary, about)
--   activities — teacher (extracurriculars: sports, swimming, clubs, creative…)

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS medical    jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS personal   jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS activities jsonb NOT NULL DEFAULT '[]'::jsonb;
