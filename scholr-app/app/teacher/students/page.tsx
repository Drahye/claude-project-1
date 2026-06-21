import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/database"
import TeacherStudentRoster from "./TeacherStudentRoster"

export const metadata: Metadata = { title: "Students" }

interface ClassOpt { id: string; name: string; grade_level: string }
export interface RosterStudent {
  id: string
  full_name: string
  admission_number: string
  class_names: string[]
}

export default async function TeacherStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("id, role").eq("id", user.id).single() as unknown as
    { data: Pick<Profile, "id" | "role"> | null }
  if (!profile || profile.role !== "teacher") redirect("/login")

  const { data: classesRaw } = await supabase
    .from("classes")
    .select("id, name, grade_level")
    .eq("teacher_id", user.id)
    .order("name") as unknown as { data: ClassOpt[] | null }
  const classes = classesRaw ?? []
  const classNameById = new Map(classes.map(c => [c.id, c.name]))

  // Students enrolled in the teacher's classes.
  const roster: RosterStudent[] = []
  if (classes.length > 0) {
    const { data: enr } = await supabase
      .from("student_class_enrollments")
      .select("class_id, student:students(id, full_name, admission_number)")
      .in("class_id", classes.map(c => c.id)) as unknown as {
        data: Array<{ class_id: string; student: { id: string; full_name: string; admission_number: string } | null }> | null
      }
    const byStudent = new Map<string, RosterStudent>()
    for (const row of enr ?? []) {
      if (!row.student) continue
      const existing = byStudent.get(row.student.id)
      const className = classNameById.get(row.class_id)
      if (existing) {
        if (className) existing.class_names.push(className)
      } else {
        byStudent.set(row.student.id, {
          id: row.student.id,
          full_name: row.student.full_name,
          admission_number: row.student.admission_number,
          class_names: className ? [className] : [],
        })
      }
    }
    roster.push(...[...byStudent.values()].sort((a, b) => a.full_name.localeCompare(b.full_name)))
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>Students</h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          Add students to your classes — one at a time or in bulk from a CSV.
        </p>
      </div>
      <TeacherStudentRoster classes={classes} students={roster} />
    </div>
  )
}
