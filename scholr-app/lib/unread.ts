import type { SupabaseClient } from "@supabase/supabase-js"

export interface UnreadCounts {
  alerts:   number
  messages: number
}

/**
 * Compute unread badge counts for a user:
 *  - alerts:   notifications addressed to them that are unread
 *  - messages: messages in their threads that someone else sent and they
 *              haven't read yet
 *
 * Uses the caller's authenticated SSR client (RLS-scoped).
 */
export async function getUnreadCounts(
  supabase: SupabaseClient,
  userId: string,
): Promise<UnreadCounts> {
  // ── Alerts ──────────────────────────────────────────────────────────────
  const alertsPromise = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("is_read", false)

  // ── Messages ────────────────────────────────────────────────────────────
  // 1. Find the threads this user participates in
  const threadsPromise = supabase
    .from("message_threads")
    .select("id")
    .contains("participant_ids", [userId])
    .limit(200)

  const [{ count: alertCount }, { data: threads }] = await Promise.all([
    alertsPromise,
    threadsPromise as unknown as Promise<{ data: Array<{ id: string }> | null }>,
  ])

  let messages = 0
  const threadIds = (threads ?? []).map(t => t.id)

  if (threadIds.length > 0) {
    // 2. Find unread messages (not sent by this user, not yet read by them),
    //    then count the DISTINCT conversations they came from — i.e. the
    //    number of people who have unread messages waiting, not the raw
    //    message total.
    const { data: unread } = await supabase
      .from("messages")
      .select("thread_id")
      .in("thread_id", threadIds)
      .neq("sender_id", userId)
      .not("is_read_by", "cs", `{${userId}}`) as unknown as {
        data: Array<{ thread_id: string }> | null
      }

    messages = new Set((unread ?? []).map(m => m.thread_id)).size
  }

  return { alerts: alertCount ?? 0, messages }
}
