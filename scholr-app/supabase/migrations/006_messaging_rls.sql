-- ─────────────────────────────────────────────────────────────────────────────
-- Scholr — Messaging RLS fix
--
-- The original policies (001) only allowed SELECT on message_threads and
-- messages. With RLS enabled and no INSERT/UPDATE policy, Postgres denies all
-- writes by default — so creating a thread, sending a message, and marking
-- messages read all silently failed from the browser client.
--
-- This migration adds the missing INSERT/UPDATE policies (scoped to thread
-- participants) and enables realtime on the messages table.
-- Idempotent — safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── message_threads ──────────────────────────────────────────────────────────
drop policy if exists "thread_participants_read"   on message_threads;
drop policy if exists "thread_participants_insert" on message_threads;
drop policy if exists "thread_participants_update" on message_threads;

create policy "thread_participants_read" on message_threads
  for select using (
    school_id = auth_school_id()
    and auth.uid() = any(participant_ids)
  );

create policy "thread_participants_insert" on message_threads
  for insert with check (
    school_id = auth_school_id()
    and auth.uid() = any(participant_ids)
  );

create policy "thread_participants_update" on message_threads
  for update using (
    school_id = auth_school_id()
    and auth.uid() = any(participant_ids)
  );

-- ── messages ─────────────────────────────────────────────────────────────────
drop policy if exists "messages_in_thread" on messages;
drop policy if exists "messages_read"      on messages;
drop policy if exists "messages_insert"    on messages;
drop policy if exists "messages_update"    on messages;

create policy "messages_read" on messages
  for select using (
    school_id = auth_school_id()
    and exists (
      select 1 from message_threads t
      where t.id = thread_id and auth.uid() = any(t.participant_ids)
    )
  );

create policy "messages_insert" on messages
  for insert with check (
    school_id = auth_school_id()
    and sender_id = auth.uid()
    and exists (
      select 1 from message_threads t
      where t.id = thread_id and auth.uid() = any(t.participant_ids)
    )
  );

-- Allow updating is_read_by (and the RPC, which is security definer anyway)
create policy "messages_update" on messages
  for update using (
    school_id = auth_school_id()
    and exists (
      select 1 from message_threads t
      where t.id = thread_id and auth.uid() = any(t.participant_ids)
    )
  );

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Enable live message delivery. Guard against "already added".
do $$
begin
  begin
    alter publication supabase_realtime add table messages;
  exception
    when duplicate_object then null;
    when undefined_object then null;  -- publication not present (local dev)
  end;
end $$;
