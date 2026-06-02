import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import MessagesView from "@/components/shared/MessagesView"
import type { Profile } from "@/types/database"

export const metadata: Metadata = { title: "Messages" }

interface ThreadRow {
  id: string; subject: string; type: string
  participant_ids: string[]; school_id: string
  created_at: string; last_message_at: string
}
interface MessageRow {
  id: string; thread_id: string; sender_id: string
  body: string; sent_at: string; is_read_by: string[]
}

export default async function TeacherMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, school_id, full_name, role")
    .eq("id", user.id)
    .single() as unknown as { data: Pick<Profile, "id" | "school_id" | "full_name" | "role"> | null }

  if (!profile) redirect("/login")

  const { data: threads } = await supabase
    .from("message_threads")
    .select("id, subject, type, participant_ids, school_id, created_at, last_message_at")
    .contains("participant_ids", [user.id])
    .order("last_message_at", { ascending: false })
    .limit(20) as unknown as { data: ThreadRow[] | null }

  // Teachers contact parents
  const { data: parents } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("school_id", profile.school_id)
    .eq("role", "parent")
    .order("full_name") as unknown as {
      data: Array<Pick<Profile, "id" | "full_name" | "role">> | null
    }

  const threadIds = (threads ?? []).map(t => t.id)
  const latestMessages: MessageRow[] = []
  if (threadIds.length > 0) {
    const { data } = await supabase
      .from("messages")
      .select("id, thread_id, sender_id, body, sent_at, is_read_by")
      .in("thread_id", threadIds)
      .order("sent_at", { ascending: false }) as unknown as { data: MessageRow[] | null }
    const seen = new Set<string>()
    for (const msg of data ?? []) {
      if (!seen.has(msg.thread_id)) { latestMessages.push(msg); seen.add(msg.thread_id) }
    }
  }

  const allIds = [...new Set((threads ?? []).flatMap(t => t.participant_ids))]
  let participantProfiles: Array<Pick<Profile, "id" | "full_name" | "role">> = []
  if (allIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("id", allIds) as unknown as { data: Array<Pick<Profile, "id" | "full_name" | "role">> | null }
    participantProfiles = data ?? []
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>Messages</h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>Direct messages with parents</p>
      </div>
      <MessagesView
        threads={threads ?? []}
        latestMessages={latestMessages}
        participantProfiles={participantProfiles}
        contacts={parents ?? []}
        currentUser={profile}
        schoolId={profile.school_id}
      />
    </div>
  )
}
