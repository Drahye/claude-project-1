-- ─────────────────────────────────────────────────────────────────────────────
-- Scholr — Feature migration 016 (2026-06-21)
--
-- Supports the 10-feature build:
--   1. Limited co-admin role: distinguish super_admin (owner) from admin.
--      School branding/settings updates restricted to super_admin at the DB.
--   2. Town Hall broadcasts: new `broadcasts` table + RLS.
--   3. Multi-class enrollment already works (student_class_enrollments PK is
--      (student_id, class_id) and 007 grants teacher/admin manage) — no change.
--
-- Idempotent — safe to re-run. Apply with `supabase db push` or the SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. super_admin helper ────────────────────────────────────────────────────
create or replace function auth_is_super_admin()
returns boolean language sql security definer stable as $$
  select coalesce((select role = 'super_admin' from profiles where id = auth.uid()), false);
$$;

-- ── 2. Backfill: ensure every school has exactly one owner ───────────────────
-- Existing schools were created with a single 'admin'. Promote the oldest admin
-- of any school that has NO super_admin so owners keep full access after the
-- nav/route gating below. Runs before the policy tightening.
with owners as (
  select distinct on (school_id) id, school_id
  from profiles
  where role in ('admin','super_admin')
  order by school_id, created_at asc
)
update profiles p
set role = 'super_admin'
from owners o
where p.id = o.id
  and not exists (
    select 1 from profiles s
    where s.school_id = o.school_id and s.role = 'super_admin'
  );

-- ── 3. School updates: super_admin only (branding/settings/danger zone) ───────
-- 001 allowed any admin to update the school row. Limited admins must not change
-- name, slug, logo, colors, plan, etc. Server settings/billing routes also
-- enforce this, but the DB is the backstop.
drop policy if exists "admins_can_update_school" on schools;
create policy "super_admin_can_update_school" on schools
  for update using (id = auth_school_id() and auth_is_super_admin());

-- ── 4. broadcasts (Town Hall) ────────────────────────────────────────────────
create table if not exists broadcasts (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references schools(id) on delete cascade,
  author_id  uuid references profiles(id) on delete set null,
  title      text not null,
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists broadcasts_school_created_idx
  on broadcasts(school_id, created_at desc);

alter table broadcasts enable row level security;

-- Any signed-in member of the school can read its broadcasts.
drop policy if exists "broadcasts_read" on broadcasts;
create policy "broadcasts_read" on broadcasts
  for select using (school_id = auth_school_id());

-- Only admins / super_admins of the school may post or remove broadcasts.
drop policy if exists "broadcasts_manage" on broadcasts;
create policy "broadcasts_manage" on broadcasts
  for all using (
    school_id = auth_school_id() and auth_role() in ('admin','super_admin')
  );
