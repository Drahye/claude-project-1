-- 013_page_events.sql
-- Public-page analytics: lightweight event log for the /[slug] page.
-- Written via the service role only (RLS on, no public policies).

create table if not exists public.school_page_events (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools(id) on delete cascade,
  event       text not null,          -- 'view' | 'login_click'
  created_at  timestamptz not null default now()
);

create index if not exists idx_spe_school_created
  on public.school_page_events (school_id, created_at desc);

alter table public.school_page_events enable row level security;
-- No policies: only the service role (server) can read/write.
