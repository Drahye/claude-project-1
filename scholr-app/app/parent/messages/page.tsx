import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import MessagesView from "@/components/shared/MessagesView"
import type { Profile } from "@/types/database"

export const metadata: Metadata = { title: "Messages" }

interface ThreadRow {
  id: string
  subject: string
  type: string
  participant_ids: string[]
  school_id: string
  created_at: string
  last_message_at: string
}

interface MessageRow {
  id: string
  thread_id: string
  sender_id: string
  body: string
  sent_at: string
  is_read_by: string[]
}

export default async function ParentMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get profile (for school_id)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, school_id, full_name, role")
    .eq("id", user.id)
    .single() as unknown as { data: Pick<Profile, "id" | "school_id" | "full_name" | "role"> | null }

  if (!profile) redirect("/login")

  // Get threads where this user is a participant
  const { data: threads } = await supabase
    .from("message_threads")
    .select("id, subject, type, participant_ids, school_id, created_at, last_message_at")
    .contains("participant_ids", [user.id])
    .order("last_message_at", { ascending: false })
    .limit(20) as unknown as { data: ThreadRow[] | null }

  // Contacts = the teachers assigned to THIS parent's children's classes,
  // PLUS the school admin(s) — so a parent can always reach the school even
  // before a child is enrolled in a class.
  type Contact = Pick<Profile, "id" | "full_name" | "role">
  const contactsById = new Map<string, Contact>()

  const { data: childLinks } = await supabase
    .from("parent_students")
    .select("student_id")
    .eq("parent_id", user.id) as unknown as { data: Array<{ student_id: string }> | null }

  const childIds = [...new Set((childLinks ?? []).map(l => l.student_id))]

  if (childIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("student_class_enrollments")
      .select("class_id")
      .in("student_id", childIds) as unknown as { data: Array<{ class_id: string }> | null }

    const classIds = [...new Set((enrollments ?? []).map(e => e.class_id))]

    if (classIds.length > 0) {
      const { data: classRows } = await supabase
        .from("classes")
        .select("teacher_id")
        .in("id", classIds) as unknown as { data: Array<{ teacher_id: string | null }> | null }

      const teacherIds = [...new Set((classRows ?? []).map(c => c.teacher_id).filter(Boolean) as string[])]

      if (teacherIds.length > 0) {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .in("id", teacherIds)
          .eq("role", "teacher")
          .order("full_name") as unknown as { data: Contact[] | null }
        for (const t of data ?? []) contactsById.set(t.id, t)
      }
    }
  }

  // Always include the school admin(s)
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("school_id", profile.school_id)
    .in("role", ["admin", "super_admin"])
    .order("full_name") as unknown as { data: Contact[] | null }
  for (const a of admins ?? []) {
    if (a.id !== user.id) contactsById.set(a.id, a)
  }

  // Teachers first, then admins
  const teachers = [...contactsById.values()].sort((a, b) => {
    const rank = (r: string) => (r === "teacher" ? 0 : 1)
    return rank(a.role) - rank(b.role) || a.full_name.localeCompare(b.full_name)
  })

  // Fetch most recent message per thread
  const threadIds = (threads ?? []).map(t => t.id)
  const latestMessages: MessageRow[] = []

  if (threadIds.length > 0) {
    const { data } = await supabase
      .from("messages")
      .select("id, thread_id, sender_id, body, sent_at, is_read_by")
      .in("thread_id", threadIds)
      .order("sent_at", { ascending: false }) as unknown as { data: MessageRow[] | null }

    // Keep only the latest per thread
    const seen = new Set<string>()
    for (const msg of data ?? []) {
      if (!seen.has(msg.thread_id)) {
        latestMessages.push(msg)
        seen.add(msg.thread_id)
      }
    }
  }

  // Collect all participant IDs for display names
  const allParticipantIds = [...new Set((threads ?? []).flatMap(t => t.participant_ids))]
  let participantProfiles: Array<Pick<Profile, "id" | "full_name" | "role">> = []

  if (allParticipantIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("id", allParticipantIds) as unknown as {
        data: Array<Pick<Profile, "id" | "full_name" | "role">> | null
      }
    participantProfiles = data ?? []
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Messages
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          Message your child&apos;s teachers or the school office
        </p>
      </div>

      <MessagesView
        threads={threads ?? []}
        latestMessages={latestMessages}
        participantProfiles={participantProfiles}
        contacts={teachers ?? []}
        currentUser={profile}
        schoolId={profile.school_id}
      />
    </div>
  )
}
