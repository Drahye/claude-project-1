import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
// utils imported in panel
import type { Profile } from "@/types/database"
import StudentsPanel from "./StudentsPanel"

export const metadata: Metadata = { title: "Students" }

interface StudentRow {
  id: string
  full_name: string
  admission_number: string
  date_of_birth: string
  gender: string
  photo_url: string | null
  is_active: boolean
  created_at: string
  enrollments: Array<{ class: { name: string; grade_level: string } | null }>
  parents: Array<{ parent: { full_name: string } | null }>
}

export default async function StudentsPage() {
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

  // Plain student rows — no nested joins (parent_students → profiles has no
  // direct FK, which silently nulls the whole query if joined inline).
  const { data: rawStudents } = await supabase
    .from("students")
    .select("id, full_name, admission_number, date_of_birth, gender, photo_url, is_active, created_at")
    .eq("school_id", profile.school_id)
    .order("full_name") as unknown as {
      data: Array<Omit<StudentRow, "enrollments" | "parents">> | null
    }

  const studentList = rawStudents ?? []
  const studentIds  = studentList.map(s => s.id)

  // Enrollments → class (resolved separately, then mapped)
  const enrollmentsByStudent: Record<string, Array<{ class: { name: string; grade_level: string } | null }>> = {}
  const parentsByStudent:     Record<string, Array<{ parent: { full_name: string } | null }>> = {}

  if (studentIds.length > 0) {
    const { data: enr } = await supabase
      .from("student_class_enrollments")
      .select("student_id, class:classes(name, grade_level)")
      .in("student_id", studentIds) as unknown as {
        data: Array<{ student_id: string; class: { name: string; grade_level: string } | null }> | null
      }
    for (const e of enr ?? []) {
      (enrollmentsByStudent[e.student_id] ??= []).push({ class: e.class })
    }

    // parent_students → parents (id == profiles.id) → profiles.full_name
    const { data: ps } = await supabase
      .from("parent_students")
      .select("student_id, parent_id")
      .in("student_id", studentIds) as unknown as {
        data: Array<{ student_id: string; parent_id: string }> | null
      }

    const parentIds = [...new Set((ps ?? []).map(p => p.parent_id))]
    const nameById: Record<string, string> = {}
    if (parentIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", parentIds) as unknown as { data: Array<{ id: string; full_name: string }> | null }
      for (const p of profs ?? []) nameById[p.id] = p.full_name
    }
    for (const link of ps ?? []) {
      (parentsByStudent[link.student_id] ??= []).push({
        parent: nameById[link.parent_id] ? { full_name: nameById[link.parent_id] } : null,
      })
    }
  }

  const students: StudentRow[] = studentList.map(s => ({
    ...s,
    enrollments: enrollmentsByStudent[s.id] ?? [],
    parents:     parentsByStudent[s.id] ?? [],
  }))

  // Get classes for the add-student form
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, grade_level")
    .eq("school_id", profile.school_id)
    .order("name") as unknown as {
      data: Array<{ id: string; name: string; grade_level: string }> | null
    }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-6xl mx-auto">
      <div className="mb-6 pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
            Students
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
            {(students ?? []).length} enrolled student{(students ?? []).length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <StudentsPanel
        students={students ?? []}
        classes={classes ?? []}
        schoolId={profile.school_id}
      />
    </div>
  )
}
