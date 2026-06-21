-- Backfill: ensure every profile with role='teacher' has a matching teachers
-- extension row. Teachers invited via the admin panel before the fix only had
-- a profiles row, which broke class assignment (classes.teacher_id → teachers.id).
--
-- Safe + idempotent: only inserts rows that are missing.

insert into teachers (id, school_id)
select p.id, p.school_id
from profiles p
where p.role = 'teacher'
  and not exists (
    select 1 from teachers t where t.id = p.id
  );
