-- ─────────────────────────────────────────────────────────────────────────────
-- Scholr — Missing RLS policies
--
-- 001 enabled RLS on these tables but never created policies for them. With RLS
-- enabled and no policy, Postgres denies ALL access to authenticated users —
-- which is why parents couldn't load their children, classes/enrollments came
-- back empty, and the data felt disconnected. Server routes using the
-- service-role key bypassed RLS, masking the problem.
--
-- This adds sensible, school-scoped policies. Idempotent — safe to re-run.
-- Relies on helper functions auth_school_id() and auth_role() from 001.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── parents ──────────────────────────────────────────────────────────────────
drop policy if exists "same_school_parents" on parents;
drop policy if exists "own_parent_row"      on parents;

create policy "same_school_parents" on parents
  for select using (school_id = auth_school_id());

create policy "own_parent_row" on parents
  for all using (id = auth.uid());

-- ── teachers ─────────────────────────────────────────────────────────────────
drop policy if exists "same_school_teachers"          on teachers;
drop policy if exists "admins_manage_teachers"        on teachers;

create policy "same_school_teachers" on teachers
  for select using (school_id = auth_school_id());

create policy "admins_manage_teachers" on teachers
  for all using (school_id = auth_school_id() and auth_role() in ('admin','super_admin'));

-- ── classes ──────────────────────────────────────────────────────────────────
drop policy if exists "same_school_classes"        on classes;
drop policy if exists "staff_manage_classes"       on classes;

create policy "same_school_classes" on classes
  for select using (school_id = auth_school_id());

create policy "staff_manage_classes" on classes
  for all using (school_id = auth_school_id() and auth_role() in ('teacher','admin','super_admin'));

-- ── parent_students (no school_id column → scope via the student) ────────────
drop policy if exists "parent_students_read"   on parent_students;
drop policy if exists "parent_students_manage" on parent_students;

create policy "parent_students_read" on parent_students
  for select using (
    parent_id = auth.uid()
    or exists (
      select 1 from students s
      where s.id = student_id and s.school_id = auth_school_id()
    )
  );

create policy "parent_students_manage" on parent_students
  for all using (
    exists (
      select 1 from students s
      where s.id = student_id and s.school_id = auth_school_id()
    )
    and auth_role() in ('teacher','admin','super_admin')
  );

-- ── student_class_enrollments (no school_id column → scope via the student) ──
drop policy if exists "enrollments_read"   on student_class_enrollments;
drop policy if exists "enrollments_manage" on student_class_enrollments;

create policy "enrollments_read" on student_class_enrollments
  for select using (
    exists (
      select 1 from students s
      where s.id = student_id and s.school_id = auth_school_id()
    )
  );

create policy "enrollments_manage" on student_class_enrollments
  for all using (
    exists (
      select 1 from students s
      where s.id = student_id and s.school_id = auth_school_id()
    )
    and auth_role() in ('teacher','admin','super_admin')
  );

-- ── homework_submissions (has school_id from migration 002) ──────────────────
drop policy if exists "same_school_hw_submissions" on homework_submissions;
drop policy if exists "staff_manage_hw_submissions" on homework_submissions;

create policy "same_school_hw_submissions" on homework_submissions
  for select using (school_id = auth_school_id());

create policy "staff_manage_hw_submissions" on homework_submissions
  for all using (school_id = auth_school_id() and auth_role() in ('teacher','admin','super_admin'));

-- ── subscriptions (admins only) ──────────────────────────────────────────────
drop policy if exists "admins_read_subscriptions" on subscriptions;

create policy "admins_read_subscriptions" on subscriptions
  for select using (school_id = auth_school_id() and auth_role() in ('admin','super_admin'));
