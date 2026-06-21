-- ─────────────────────────────────────────────────────────────────────────────
-- Scholr — Schema Patches v2
-- Fixes three code↔schema mismatches found during development
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. message_threads: rename participants → participant_ids ────────────────
-- The application code uses participant_ids throughout (MessagesView.tsx)

alter table message_threads
  rename column participants to participant_ids;

-- ─── 2. homework_submissions: add school_id ───────────────────────────────────
-- The admin dashboard queries .eq("school_id", schoolId) on this table.
-- Back-fill: join through students → classes → schools to derive school_id for
-- any rows that exist from seeding/testing, then add the NOT NULL constraint.

alter table homework_submissions
  add column school_id uuid references schools(id) on delete cascade;

-- Back-fill existing rows (safe for fresh DBs with no rows; no-op otherwise)
update homework_submissions hs
set school_id = s.school_id
from students s
where s.id = hs.student_id
  and hs.school_id is null;

-- Now enforce NOT NULL
alter table homework_submissions
  alter column school_id set not null;

-- Index for the admin query pattern
create index if not exists idx_homework_submissions_school_id
  on homework_submissions (school_id);

-- ─── 3. attendance: fix unique constraint + add school_id index ───────────────
-- The original constraint is (student_id, class_id, date).
-- AttendanceForm.tsx was using onConflict: "student_id,date" which fails because
-- the named constraint requires class_id.  No schema change needed here —
-- the fix is in the application code (see AttendanceForm.tsx below).
-- We do add an index to speed up the admin homework_submissions school_id query.

create index if not exists idx_attendance_school_class_date
  on attendance (school_id, class_id, date);

-- ─── 4. mark_messages_read RPC ───────────────────────────────────────────────
-- MessagesView.tsx calls this via supabase.rpc("mark_messages_read", {...}).
-- Appends p_user_id into the is_read_by uuid[] array for messages in the
-- thread that were not already marked read by that user.

create or replace function mark_messages_read(
  p_thread_id uuid,
  p_user_id   uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update messages
  set    is_read_by = array_append(is_read_by, p_user_id)
  where  thread_id  = p_thread_id
    and  sender_id <> p_user_id
    and  not (p_user_id = any(is_read_by));
end;
$$;

-- ─── 5. student_count auto-increment trigger on schools ──────────────────────
-- StudentsPanel.tsx inserts into students directly; the admin dashboard reads
-- schools.student_count.  Keep it in sync automatically.

create or replace function fn_sync_school_student_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    update schools set student_count = student_count + 1 where id = NEW.school_id;
  elsif TG_OP = 'DELETE' then
    update schools set student_count = greatest(0, student_count - 1) where id = OLD.school_id;
  end if;
  return null; -- AFTER trigger, return value ignored
end;
$$;

drop trigger if exists trg_student_count on students;

create trigger trg_student_count
after insert or delete on students
for each row
execute function fn_sync_school_student_count();

-- ─── 6. updated_at trigger (applied to any table that has the column) ─────────

create or replace function fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

-- Apply to tables that have updated_at but may be missing the trigger
do $$
declare
  tbl text;
begin
  foreach tbl in array array['schools','profiles','students','classes','homework','weekly_reports','message_threads'] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on %1$s;
       create trigger trg_%1$s_updated_at
       before update on %1$s
       for each row execute function fn_set_updated_at();',
      tbl
    );
  end loop;
end;
$$;
