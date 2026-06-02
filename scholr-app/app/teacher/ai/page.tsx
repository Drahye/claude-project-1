import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AIReportWriter from "./AIReportWriter"

export const metadata: Metadata = { title: "AI Reports" }

export default async function AIReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Teacher's classes
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
        <h1 className="text-2xl font-extrabold mb-6" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          AI Report Writer
        </h1>
        <div className="card px-6 py-10 text-center">
          <p className="font-semibold" style={{ color: "var(--c-text)" }}>No classes assigned yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>Ask your admin to assign you to a class.</p>
        </div>
      </div>
    )
  }

  const classIds = classes.map(c => c.id)

  // Get students for the first class (client will switch)
  const { data: enrollments } = await supabase
    .from("student_class_enrollments")
    .select("student:students(id, full_name, admission_number)")
    .eq("class_id", classIds[0]) as unknown as {
      data: Array<{ student: { id: string; full_name: string; admission_number: string } }> | null
    }

  const students = (enrollments ?? []).map(e => e.student).filter(Boolean)

  // Fetch existing reports for this week
  const weekStart = (() => {
    const d = new Date()
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    return d.toISOString().split("T")[0]
  })()

  // Pre-load any existing reports for THIS week across ALL the teacher's classes
  // (auto-generated drafts have sent_at = null; published ones have a timestamp).
  const { data: allEnr } = await supabase
    .from("student_class_enrollments")
    .select("student_id")
    .in("class_id", classIds) as unknown as { data: Array<{ student_id: string }> | null }
  const allStudentIds = [...new Set((allEnr ?? []).map(e => e.student_id))]

  interface DraftData {
    summary:          string
    encouragement:    string
    attendance_days:  number
    attendance_total: number
    homework_submitted: number
    homework_total:   number
    sent:             boolean
  }
  const existingDrafts: Record<string, DraftData> = {}

  if (allStudentIds.length > 0) {
    const { data: reports } = await supabase
      .from("weekly_reports")
      .select("student_id, ai_summary, ai_encouragement, attendance_days, attendance_total, homework_submitted, homework_total, sent_at")
      .in("student_id", allStudentIds)
      .eq("week_start", weekStart) as unknown as {
        data: Array<{
          student_id: string; ai_summary: string | null; ai_encouragement: string | null
          attendance_days: number; attendance_total: number
          homework_submitted: number; homework_total: number; sent_at: string | null
        }> | null
      }

    for (const r of reports ?? []) {
      existingDrafts[r.student_id] = {
        summary:            r.ai_summary ?? "",
        encouragement:      r.ai_encouragement ?? "",
        attendance_days:    r.attendance_days,
        attendance_total:   r.attendance_total,
        homework_submitted: r.homework_submitted,
        homework_total:     r.homework_total,
        sent:               !!r.sent_at,
      }
    }
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          AI Report Writer
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          Claude generates personalised weekly reports for each student
        </p>
      </div>

      <AIReportWriter
        classes={classes}
        initialStudents={students}
        existingDrafts={existingDrafts}
        weekStart={weekStart}
        teacherId={user.id}
        aiEnabled={
          !!process.env.GROQ_API_KEY &&
          process.env.GROQ_API_KEY.length > 10 &&
          !process.env.GROQ_API_KEY.includes("...")
        }
      />
    </div>
  )
}
