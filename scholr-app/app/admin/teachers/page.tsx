import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/database"
import TeachersPanel from "./TeachersPanel"

export const metadata: Metadata = { title: "Teachers" }

interface TeacherRow {
  id: string
  full_name: string
  email: string
  is_active: boolean
  created_at: string
  classes: Array<{ name: string; grade_level: string }>
}

export default async function TeachersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", user.id)
    .single() as unknown as { data: Pick<Profile, "school_id" | "role"> | null }

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/login")
  }

  // Teachers = profiles with role=teacher (the single source of truth)
  const { data: teacherProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_active, created_at")
    .eq("school_id", profile.school_id)
    .eq("role", "teacher")
    .order("full_name") as unknown as {
      data: Array<Omit<TeacherRow, "classes">> | null
    }

  // Fetch each teacher's classes separately (classes.teacher_id → teachers.id,
  // which shares the same UUID as profiles.id) — avoids a brittle PostgREST join.
  const teacherIds = (teacherProfiles ?? []).map(t => t.id)
  const classesByTeacher: Record<string, Array<{ name: string; grade_level: string }>> = {}

  if (teacherIds.length > 0) {
    const { data: cls } = await supabase
      .from("classes")
      .select("name, grade_level, teacher_id")
      .in("teacher_id", teacherIds) as unknown as {
        data: Array<{ name: string; grade_level: string; teacher_id: string }> | null
      }

    for (const c of cls ?? []) {
      (classesByTeacher[c.teacher_id] ??= []).push({ name: c.name, grade_level: c.grade_level })
    }
  }

  const teachers: TeacherRow[] = (teacherProfiles ?? []).map(t => ({
    ...t,
    classes: classesByTeacher[t.id] ?? [],
  }))

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-5xl mx-auto">
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Teachers
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          {(teachers ?? []).length} teacher{(teachers ?? []).length !== 1 ? "s" : ""}
        </p>
      </div>
      <TeachersPanel teachers={teachers ?? []} schoolId={profile.school_id} />
    </div>
  )
}
