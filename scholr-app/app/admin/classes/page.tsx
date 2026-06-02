import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/database"
import ClassesPanel from "./ClassesPanel"

export const metadata: Metadata = { title: "Classes" }

interface ClassRow {
  id: string
  name: string
  grade_level: string
  academic_year: string
  teacher_id: string | null
  created_at: string
  teacher: { full_name: string } | null
  _count?: { enrollments: number }
  enrollment_count: number
}

export default async function ClassesPage() {
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

  // Raw classes (no teacher join — classes.teacher_id → teachers.id, resolved manually below)
  const { data: rawClasses } = await supabase
    .from("classes")
    .select("id, name, grade_level, academic_year, teacher_id, created_at")
    .eq("school_id", profile.school_id)
    .order("grade_level")
    .order("name") as unknown as {
      data: Array<Omit<ClassRow, "enrollment_count" | "teacher">> | null
    }

  // Teachers list (profiles role=teacher) — used for both the dropdown and name resolution
  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("school_id", profile.school_id)
    .eq("role", "teacher")
    .order("full_name") as unknown as { data: Array<{ id: string; full_name: string }> | null }

  const teacherNameById: Record<string, string> = {}
  for (const t of teachers ?? []) teacherNameById[t.id] = t.full_name

  // Get student counts per class
  const classIds = (rawClasses ?? []).map(c => c.id)
  const enrollmentCounts: Record<string, number> = {}

  if (classIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("student_class_enrollments")
      .select("class_id")
      .in("class_id", classIds) as unknown as { data: Array<{ class_id: string }> | null }

    for (const e of enrollments ?? []) {
      enrollmentCounts[e.class_id] = (enrollmentCounts[e.class_id] ?? 0) + 1
    }
  }

  const classesWithCounts: ClassRow[] = (rawClasses ?? []).map(c => ({
    ...c,
    teacher: c.teacher_id ? { full_name: teacherNameById[c.teacher_id] ?? "—" } : null,
    enrollment_count: enrollmentCounts[c.id] ?? 0,
  }))

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-5xl mx-auto">
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Classes
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          {classesWithCounts.length} class{classesWithCounts.length !== 1 ? "es" : ""}
        </p>
      </div>
      <ClassesPanel
        classes={classesWithCounts}
        teachers={teachers ?? []}
        schoolId={profile.school_id}
      />
    </div>
  )
}
