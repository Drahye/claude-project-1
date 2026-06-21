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

  // Teachers contact ONLY the parents of students in classes they teach.
  // Chain: classes (teacher_id = me) → enrollments → students → parent_students
  // → parent profiles. A teacher with no assigned students sees no contacts.
  const { data: myClasses } = await supabase
    .from("classes")
    .select("id")
    .eq("teacher_id", user.id) as unknown as { data: Array<{ id: string }> | null }

  const classIds = (myClasses ?? []).map(c => c.id)

  // contactMeta maps parentId → "Parent of <child names>"
  const contactMeta: Record<string, string> = {}
  let parents: Array<Pick<Profile, "id" | "full_name" | "role">> = []

  if (classIds.length > 0) {
    const { data: enr } = await supabase
      .from("student_class_enrollments")
      .select("student:students(id, full_name)")
      .in("class_id", classIds) as unknown as {
        data: Array<{ student: { id: string; full_name: string } | null }> | null
      }
    const students = (enr ?? []).map(e => e.student).filter(Boolean) as Array<{ id: string; full_name: string }>
    const studentNameById = new Map(students.map(s => [s.id, s.full_name]))
    const studentIds = [...studentNameById.keys()]

    if (studentIds.length > 0) {
      const { data: links } = await supabase
        .from("parent_students")
        .select("parent_id, student_id")
        .in("student_id", studentIds) as unknown as {
          data: Array<{ parent_id: string; student_id: string }> | null
        }

      // parentId → set of child names
      const childrenByParent = new Map<string, Set<string>>()
      for (const l of links ?? []) {
        const name = studentNameById.get(l.student_id)
        if (!name) continue
        if (!childrenByParent.has(l.parent_id)) childrenByParent.set(l.parent_id, new Set())
        childrenByParent.get(l.parent_id)!.add(name)
      }

      const parentIds = [...childrenByParent.keys()]
      if (parentIds.length > 0) {
        const { data: parentProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .in("id", parentIds)
          .eq("is_active", true)
          .order("full_name") as unknown as {
            data: Array<Pick<Profile, "id" | "full_name" | "role">> | null
          }
        parents = parentProfiles ?? []
        for (const p of parents) {
          const names = [...(childrenByParent.get(p.id) ?? [])]
          if (names.length > 0) contactMeta[p.id] = `Parent of ${names.join(", ")}`
        }
      }
    }
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
        contacts={parents}
        contactMeta={contactMeta}
        currentUser={profile}
        schoolId={profile.school_id}
      />
    </div>
  )
}
