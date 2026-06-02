-- classes was also given an updated_at auto-trigger in migration 002 but never
-- had the column — so editing/reassigning a class errored
-- ("record new has no field updated_at"). Add the missing column.
-- Idempotent.

alter table classes add column if not exists updated_at timestamptz not null default now();
