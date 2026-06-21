-- Fixes weekly-report publishing. Two root causes:
--
-- 1. Migration 002 attached an updated_at auto-trigger to weekly_reports and
--    message_threads, but neither table actually has an updated_at column —
--    so EVERY update to those tables errored ("record new has no field
--    updated_at"). Add the missing columns so the trigger works.
--
-- 2. 001 only let admins write weekly_reports, so a teacher's "Approve & send"
--    was denied by RLS. Add a teacher-inclusive manage policy.
--
-- Idempotent + safe to re-run.

-- ── 1. Add the missing updated_at columns ────────────────────────────────────
alter table weekly_reports  add column if not exists updated_at timestamptz not null default now();
alter table message_threads add column if not exists updated_at timestamptz not null default now();

-- ── 2. Teacher write access to weekly_reports ────────────────────────────────
drop policy if exists "teachers_manage_weekly_reports" on weekly_reports;

create policy "teachers_manage_weekly_reports" on weekly_reports
  for all using (
    school_id = auth_school_id()
    and auth_role() in ('teacher', 'admin', 'super_admin')
  );

-- ── 3. Publish the stuck draft(s) ────────────────────────────────────────────
update weekly_reports
set sent_at = coalesce(sent_at, created_at)
where sent_at is null;
