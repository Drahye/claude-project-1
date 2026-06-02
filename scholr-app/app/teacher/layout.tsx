import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TeacherSidebar from "@/components/teacher/TeacherSidebar"
import { getUnreadCounts } from "@/lib/unread"
import type { Profile, School } from "@/types/database"

type ProfileWithSchool = Profile & { school: Pick<School, "name" | "logo_url"> | null }

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, school:schools(name, logo_url)")
    .eq("id", user.id)
    .single() as unknown as { data: ProfileWithSchool | null }

  if (!profile || profile.role !== "teacher") redirect("/login")

  const unread = await getUnreadCounts(supabase as any, user.id)
  const badges = {
    "/teacher/messages": unread.messages,
    "/teacher/alerts":   unread.alerts,
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--c-surface)" }}>
      <TeacherSidebar profile={profile} badges={badges} />
      <main className="flex-1 min-w-0 md:ml-[240px] min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
