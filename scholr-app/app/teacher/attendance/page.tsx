import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AttendanceForm from "./AttendanceForm"

export const metadata: Metadata = { title: "Attendance" }

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string; date?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch teacher profile (need school_id for attendance records)
  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single() as unknown as { data: { school_id: string } | null }

  if (!profile) redirect("/login")

  // Fetch teacher's classes
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, grade_level")
    .eq("teacher_id", user.id)
    .order("name") as unknown as {
      data: Array<{ id: string; name: string; grade_level: string }> | null
    }

  if (!classes || classes.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-6" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>Attendance</h1>
        <div className="card px-6 py-10 text-center">
          <p className="font-semibold" style={{ color: "var(--c-text)" }}>No classes assigned yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>Ask your admin to assign you to a class.</p>
        </div>
      </div>
    )
  }

  const selectedClassId = params.class ?? classes[0].id
  const selectedDate    = params.date ?? new Date().toISOString().split("T")[0]

  // Fetch students enrolled in the selected class
  const { data: enrollments } = await supabase
    .from("student_class_enrollments")
    .select("student:students(id, full_name, photo_url, admission_number)")
    .eq("class_id", selectedClassId) as unknown as {
      data: Array<{ student: { id: string; full_name: string; photo_url: string | null; admission_number: string } }> | null
    }

  const students = (enrollments ?? []).map(e => e.student).filter(Boolean)

  // Fetch existing attendance records for this class + date
  const studentIds = students.map(s => s.id)
  const existingRecords: Record<string, string> = {}
  if (studentIds.length > 0) {
    const { data: records } = await supabase
      .from("attendance")
      .select("student_id, status")
      .in("student_id", studentIds)
      .eq("date", selectedDate) as unknown as {
        data: Array<{ student_id: string; status: string }> | null
      }

    for (const r of records ?? []) {
      existingRecords[r.student_id] = r.status
    }
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-3xl mx-auto">
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Attendance
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          {students.length} student{students.length !== 1 ? "s" : ""} enrolled
        </p>
      </div>

      <AttendanceForm
        classes={classes}
        selectedClassId={selectedClassId}
        selectedDate={selectedDate}
        students={students}
        existingRecords={existingRecords}
        teacherId={user.id}
        schoolId={profile.school_id}
      />
    </div>
  )
}
