-- ─────────────────────────────────────────────────────────────────────────────
-- Scholr — RLS hardening (security audit, 2026-06-20)
--
-- 001 enabled RLS but two classes of policy were too loose:
--   1. profiles UPDATE had no column guard, so a user could change their OWN
--      role / school_id — i.e. self-escalate to admin or jump tenants.
--   2. student-data reads (students, attendance, weekly_reports,
--      homework_submissions) were scoped to the SCHOOL, not the FAMILY, so a
--      parent could read every other child's medical record, attendance,
--      homework scores, and even unsent draft reports.
--
-- This migration fixes both. The parent app already filters its queries to the
-- caller's own children (.in("student_id", <own children>)), so tightening the
-- policies to family scope does not change any legitimate parent screen — it
-- just makes the database enforce what the app already assumes.
--
-- Staff (teacher / admin / super_admin) keep school-wide read access.
-- Idempotent — safe to re-run. Apply with `supabase db push` or the SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. CRITICAL: stop profile self-privilege-escalation ──────────────────────
-- own_profile_update (001) lets a user update their own row. Without a column
-- guard they can flip role -> 'admin'/'super_admin' or change school_id. We keep
-- the row-scoped UPDATE policy but freeze the privileged columns for real users.
-- Server code uses the service-role key (no end-user JWT, so auth.uid() is null)
-- and is trusted to change role / school_id / is_active during onboarding and
-- invites.

create or replace function fn_protect_profile_columns()
returns trigger language plpgsql as $$
begin
  -- No end-user JWT => service-role / trusted server context => allow anything.
  if auth.uid() is null then
    return new;
  end if;
  -- A signed-in user editing their own row may change name / phone / avatar,
  -- but never these privileged columns.
  new.role      := old.role;
  new.school_id := old.school_id;
  new.is_active := old.is_active;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_columns on profiles;
create trigger trg_protect_profile_columns
  before update on profiles
  for each row execute function fn_protect_profile_columns();

-- ── 2. Helper: is this student one of the calling parent's children? ─────────
-- SECURITY DEFINER so it can read parent_students regardless of that table's RLS
-- (no recursion — it never queries the table the calling policy protects).

create or replace function auth_is_my_child(p_student uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from parent_students ps
    where ps.student_id = p_student
      and ps.parent_id  = auth.uid()
  );
$$;

-- ── 3. students: staff see the whole school; parents only their children ─────
drop policy if exists "same_school_students" on students;
create policy "students_read" on students
  for select using (
    school_id = auth_school_id()
    and (
      auth_role() in ('teacher','admin','super_admin')
      or auth_is_my_child(id)
    )
  );
-- (write policy "teachers_admins_manage_students" from 001 is unchanged)

-- ── 4. attendance: parents only their children's rows ────────────────────────
drop policy if exists "same_school_attendance_read" on attendance;
create policy "attendance_read" on attendance
  for select using (
    school_id = auth_school_id()
    and (
      auth_role() in ('teacher','admin','super_admin')
      or auth_is_my_child(student_id)
    )
  );

-- ── 5. weekly_reports: parents only their children's SENT reports ────────────
-- Drafts (sent_at is null) created by the cron stay hidden until a teacher
-- approves/sends them. Staff still see everything (incl. drafts) to review.
drop policy if exists "same_school_weekly_reports" on weekly_reports;
create policy "weekly_reports_read" on weekly_reports
  for select using (
    school_id = auth_school_id()
    and (
      auth_role() in ('teacher','admin','super_admin')
      or (auth_is_my_child(student_id) and sent_at is not null)
    )
  );

-- ── 6. homework_submissions: parents only their children's submissions ───────
drop policy if exists "same_school_hw_submissions" on homework_submissions;
create policy "hw_submissions_read" on homework_submissions
  for select using (
    school_id = auth_school_id()
    and (
      auth_role() in ('teacher','admin','super_admin')
      or auth_is_my_child(student_id)
    )
  );

-- NOTE (intentionally NOT changed):
--   * homework (assignment definitions) stays school-wide readable — it is not
--     per-student sensitive and the parent dashboard reads it un-filtered.
--   * profiles SELECT stays school-wide — messaging resolves participant names
--     from it. Contact-info exposure is a lower-severity item; tighten later if
--     the messaging UI is moved fully server-side.
