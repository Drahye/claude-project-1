-- ─────────────────────────────────────────────────────────────────────────────
-- Scholr — Initial Schema v1
-- Run against your Supabase project: supabase db push
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ─── Enums ───────────────────────────────────────────────────────────────────

create type user_role          as enum ('parent','teacher','admin','super_admin');
create type attendance_status  as enum ('present','absent','late','excused');
create type homework_status    as enum ('assigned','submitted','graded','overdue');
create type message_type       as enum ('direct','announcement','system');
create type subscription_plan  as enum ('free','starter','pro','enterprise');
create type subscription_status as enum ('active','trialing','past_due','canceled');
create type notification_type  as enum ('absence','homework','message','report','fee','announcement');

-- ─── schools ─────────────────────────────────────────────────────────────────

create table schools (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  slug                   text not null unique,
  country                char(2) not null default 'US',
  timezone               text not null default 'UTC',
  logo_url               text,
  primary_color          text,
  subscription_plan      subscription_plan not null default 'free',
  subscription_status    subscription_status not null default 'active',
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  student_count          int not null default 0,
  max_students           int not null default 100,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ─── profiles ────────────────────────────────────────────────────────────────
-- Extends auth.users with app-level role and school membership

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  school_id    uuid not null references schools(id) on delete cascade,
  role         user_role not null,
  full_name    text not null,
  email        text not null,
  phone        text,
  avatar_url   text,
  is_active    boolean not null default true,
  last_seen_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index profiles_school_id_idx on profiles(school_id);
create index profiles_role_idx      on profiles(role);

-- ─── students ────────────────────────────────────────────────────────────────

create table students (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id) on delete cascade,
  admission_number text not null,
  full_name        text not null,
  date_of_birth    date,
  gender           text check (gender in ('male','female','other')),
  photo_url        text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique(school_id, admission_number)
);

create index students_school_id_idx on students(school_id);

-- ─── parents ─────────────────────────────────────────────────────────────────

create table parents (
  id                    uuid primary key references profiles(id) on delete cascade,
  school_id             uuid not null references schools(id) on delete cascade,
  relationship_to_child text
);

create table parent_students (
  parent_id  uuid not null references parents(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (parent_id, student_id)
);

-- ─── teachers ────────────────────────────────────────────────────────────────

create table teachers (
  id              uuid primary key references profiles(id) on delete cascade,
  school_id       uuid not null references schools(id) on delete cascade,
  subjects        text[] not null default '{}',
  employee_number text
);

-- ─── classes ─────────────────────────────────────────────────────────────────

create table classes (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  name          text not null,
  grade_level   text not null,
  academic_year text not null,
  teacher_id    uuid references teachers(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique(school_id, name, academic_year)
);

create table student_class_enrollments (
  student_id  uuid not null references students(id) on delete cascade,
  class_id    uuid not null references classes(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  is_active   boolean not null default true,
  primary key (student_id, class_id)
);

-- ─── attendance ──────────────────────────────────────────────────────────────

create table attendance (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  student_id  uuid not null references students(id) on delete cascade,
  class_id    uuid not null references classes(id) on delete cascade,
  teacher_id  uuid not null references teachers(id) on delete restrict,
  date        date not null,
  status      attendance_status not null,
  note        text,
  notified_at timestamptz,
  created_at  timestamptz not null default now(),
  unique(student_id, class_id, date)
);

create index attendance_student_date_idx on attendance(student_id, date desc);
create index attendance_class_date_idx   on attendance(class_id, date desc);

-- ─── homework ────────────────────────────────────────────────────────────────

create table homework (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  class_id    uuid not null references classes(id) on delete cascade,
  teacher_id  uuid not null references teachers(id) on delete restrict,
  title       text not null,
  description text not null default '',
  subject     text not null,
  due_date    date not null,
  file_urls   text[] not null default '{}',
  max_score   int,
  status      homework_status not null default 'assigned',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table homework_submissions (
  id           uuid primary key default gen_random_uuid(),
  homework_id  uuid not null references homework(id) on delete cascade,
  student_id   uuid not null references students(id) on delete cascade,
  submitted_at timestamptz,
  file_urls    text[] not null default '{}',
  score        numeric(5,2),
  feedback     text,
  graded_at    timestamptz,
  graded_by    uuid references teachers(id) on delete set null,
  unique(homework_id, student_id)
);

-- ─── messaging ───────────────────────────────────────────────────────────────

create table message_threads (
  id              uuid primary key default gen_random_uuid(),
  school_id       uuid not null references schools(id) on delete cascade,
  subject         text,
  type            message_type not null default 'direct',
  participants    uuid[] not null,
  last_message_at timestamptz,
  created_at      timestamptz not null default now()
);

create table messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references message_threads(id) on delete cascade,
  school_id  uuid not null references schools(id) on delete cascade,
  sender_id  uuid not null references profiles(id) on delete restrict,
  body       text not null,
  file_urls  text[] not null default '{}',
  is_read_by uuid[] not null default '{}',
  sent_at    timestamptz not null default now()
);

create index messages_thread_sent_idx on messages(thread_id, sent_at desc);

-- ─── notifications ───────────────────────────────────────────────────────────

create table notifications (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  type         notification_type not null,
  title        text not null,
  body         text not null,
  action_url   text,
  is_read      boolean not null default false,
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);

create index notifications_recipient_idx on notifications(recipient_id, created_at desc);
create index notifications_unread_idx    on notifications(recipient_id) where not is_read;

-- ─── weekly_reports ──────────────────────────────────────────────────────────

create table weekly_reports (
  id                  uuid primary key default gen_random_uuid(),
  school_id           uuid not null references schools(id) on delete cascade,
  student_id          uuid not null references students(id) on delete cascade,
  week_start          date not null,
  week_end            date not null,
  attendance_days     int not null default 0,
  attendance_total    int not null default 5,
  homework_submitted  int not null default 0,
  homework_total      int not null default 0,
  ai_summary         text not null default '',
  ai_encouragement   text not null default '',
  teacher_notes      text[] not null default '{}',
  sent_at            timestamptz,
  created_at         timestamptz not null default now(),
  unique(student_id, week_start)
);

-- ─── subscriptions ───────────────────────────────────────────────────────────

create table subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  school_id               uuid not null references schools(id) on delete cascade,
  stripe_subscription_id  text not null unique,
  stripe_customer_id      text not null,
  plan                    subscription_plan not null,
  status                  subscription_status not null,
  current_period_start    timestamptz not null,
  current_period_end      timestamptz not null,
  cancel_at_period_end    boolean not null default false,
  trial_end               timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ─── updated_at triggers ─────────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger schools_updated_at    before update on schools    for each row execute function update_updated_at();
create trigger profiles_updated_at   before update on profiles   for each row execute function update_updated_at();
create trigger students_updated_at   before update on students   for each row execute function update_updated_at();
create trigger homework_updated_at   before update on homework   for each row execute function update_updated_at();
create trigger subscriptions_updated_at before update on subscriptions for each row execute function update_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table schools          enable row level security;
alter table profiles         enable row level security;
alter table students         enable row level security;
alter table parents          enable row level security;
alter table parent_students  enable row level security;
alter table teachers         enable row level security;
alter table classes          enable row level security;
alter table student_class_enrollments enable row level security;
alter table attendance       enable row level security;
alter table homework         enable row level security;
alter table homework_submissions enable row level security;
alter table message_threads  enable row level security;
alter table messages         enable row level security;
alter table notifications    enable row level security;
alter table weekly_reports   enable row level security;
alter table subscriptions    enable row level security;

-- Helper: get calling user's school_id
create or replace function auth_school_id()
returns uuid language sql security definer stable as $$
  select school_id from profiles where id = auth.uid();
$$;

-- Helper: get calling user's role
create or replace function auth_role()
returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid();
$$;

-- Schools: only admins of that school can read/write
create policy "school_members_can_read" on schools
  for select using (id = auth_school_id());

create policy "admins_can_update_school" on schools
  for update using (id = auth_school_id() and auth_role() in ('admin','super_admin'));

-- Profiles: members of same school
create policy "same_school_profiles" on profiles
  for select using (school_id = auth_school_id());

create policy "own_profile_update" on profiles
  for update using (id = auth.uid());

-- Students: same school
create policy "same_school_students" on students
  for select using (school_id = auth_school_id());

create policy "teachers_admins_manage_students" on students
  for all using (school_id = auth_school_id() and auth_role() in ('teacher','admin','super_admin'));

-- Attendance: teachers can insert/update their class; parents can read their child's
create policy "same_school_attendance_read" on attendance
  for select using (school_id = auth_school_id());

create policy "teachers_manage_attendance" on attendance
  for all using (school_id = auth_school_id() and auth_role() in ('teacher','admin','super_admin'));

-- Homework: same school read; teachers manage
create policy "same_school_homework_read" on homework
  for select using (school_id = auth_school_id());

create policy "teachers_manage_homework" on homework
  for all using (school_id = auth_school_id() and auth_role() in ('teacher','admin','super_admin'));

-- Notifications: own notifications only
create policy "own_notifications" on notifications
  for all using (recipient_id = auth.uid());

-- Weekly reports: same school
create policy "same_school_weekly_reports" on weekly_reports
  for select using (school_id = auth_school_id());

create policy "admins_manage_weekly_reports" on weekly_reports
  for all using (school_id = auth_school_id() and auth_role() in ('admin','super_admin'));

-- Messages: participants only
create policy "thread_participants_read" on message_threads
  for select using (school_id = auth_school_id() and auth.uid() = any(participants));

create policy "messages_in_thread" on messages
  for select using (
    school_id = auth_school_id()
    and exists (
      select 1 from message_threads t
      where t.id = thread_id and auth.uid() = any(t.participants)
    )
  );

