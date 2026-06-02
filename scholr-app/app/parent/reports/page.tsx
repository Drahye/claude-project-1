import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatDate, avatarColor, getInitials } from "@/lib/utils"
import { CheckCircle2, BookOpen, TrendingUp, Sparkles } from "lucide-react"
import type { WeeklyReport } from "@/types/database"
import EmptyState from "@/components/shared/EmptyState"

export const metadata: Metadata = { title: "Reports" }

interface ReportWithStudent extends WeeklyReport {
  student: { full_name: string; photo_url: string | null } | null
}

export default async function ParentReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get parent's children
  const { data: parentStudents } = await supabase
    .from("parent_students")
    .select("student:students(id, full_name, photo_url)")
    .eq("parent_id", user.id) as unknown as {
      data: Array<{ student: { id: string; full_name: string; photo_url: string | null } }> | null
    }

  const students = (parentStudents ?? []).map(ps => ps.student).filter(Boolean)
  const studentIds = students.map(s => s.id)

  let reports: ReportWithStudent[] = []

  if (studentIds.length > 0) {
    const { data } = await supabase
      .from("weekly_reports")
      .select("*, student:students(full_name, photo_url)")
      .in("student_id", studentIds)
      .not("sent_at", "is", null)
      .order("week_start", { ascending: false })
      .limit(20) as unknown as { data: ReportWithStudent[] | null }

    reports = data ?? []
  }

  // Group by student for display
  const byStudent: Record<string, { student: { full_name: string; photo_url: string | null }; reports: ReportWithStudent[] }> = {}

  for (const r of reports) {
    if (!byStudent[r.student_id]) {
      byStudent[r.student_id] = {
        student: r.student ?? { full_name: "Unknown", photo_url: null },
        reports: [],
      }
    }
    byStudent[r.student_id].reports.push(r)
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-3xl mx-auto">
      <div className="mb-8 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Weekly Reports
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          AI-generated weekly summaries for your children
        </p>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No reports yet"
          description="Weekly reports will appear here once your child's teacher generates them each week."
        />
      ) : (
        <div className="space-y-10">
          {Object.entries(byStudent).map(([studentId, { student, reports: studentReports }]) => (
            <section key={studentId}>
              {/* Student header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: avatarColor(student.full_name) }}
                >
                  {getInitials(student.full_name)}
                </div>
                <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{student.full_name}</h2>
                <span className="badge badge-indigo">{studentReports.length} report{studentReports.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Reports list */}
              <div className="space-y-4">
                {studentReports.map(report => {
                  const attendancePct = report.attendance_total > 0
                    ? Math.round((report.attendance_days / report.attendance_total) * 100)
                    : null
                  const hwPct = report.homework_total > 0
                    ? Math.round((report.homework_submitted / report.homework_total) * 100)
                    : null

                  return (
                    <div key={report.id} className="card p-5" style={{ borderLeft: "3px solid var(--c-indigo)" }}>
                      {/* Week + AI badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>
                            Week of {formatDate(report.week_start)}
                          </p>
                          {report.sent_at && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                              Sent {formatDate(report.sent_at, "time")}
                            </p>
                          )}
                        </div>
                        <span className="badge badge-indigo">
                          <Sparkles size={10} /> AI
                        </span>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="rounded-xl p-3" style={{ background: "var(--c-surface)" }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <CheckCircle2 size={12} style={{ color: attendancePct !== null && attendancePct >= 80 ? "var(--c-emerald)" : "var(--c-red)" }} />
                            <p className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>Attendance</p>
                          </div>
                          <p className="text-lg font-extrabold tracking-tight" style={{
                            color: attendancePct !== null
                              ? (attendancePct >= 80 ? "var(--c-emerald)" : "var(--c-red)")
                              : "var(--c-text-muted)",
                            letterSpacing: "-0.02em",
                          }}>
                            {attendancePct !== null ? `${attendancePct}%` : "—"}
                          </p>
                          <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                            {report.attendance_days}/{report.attendance_total} days
                          </p>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: "var(--c-surface)" }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <BookOpen size={12} style={{ color: "var(--c-indigo)" }} />
                            <p className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>Homework</p>
                          </div>
                          <p className="text-lg font-extrabold tracking-tight" style={{
                            color: hwPct !== null
                              ? (hwPct >= 70 ? "var(--c-indigo)" : "var(--c-gold)")
                              : "var(--c-text-muted)",
                            letterSpacing: "-0.02em",
                          }}>
                            {hwPct !== null ? `${hwPct}%` : "—"}
                          </p>
                          <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                            {report.homework_submitted}/{report.homework_total} done
                          </p>
                        </div>
                      </div>

                      {/* AI summary */}
                      {report.ai_summary && (
                        <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--c-text-mid)" }}>
                          {report.ai_summary}
                        </p>
                      )}

                      {/* Encouragement note */}
                      {report.ai_encouragement && (
                        <div className="rounded-xl p-4" style={{ background: "var(--c-indigo-bg)" }}>
                          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--c-indigo)" }}>
                            Note to {student.full_name.split(" ")[0]}
                          </p>
                          <p className="text-sm italic" style={{ color: "var(--c-text-mid)" }}>
                            &ldquo;{report.ai_encouragement}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* Teacher notes */}
                      {report.teacher_notes && report.teacher_notes.length > 0 && (
                        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--c-border)" }}>
                          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--c-text-muted)" }}>
                            Teacher notes
                          </p>
                          {report.teacher_notes.map((note, i) => (
                            <p key={i} className="text-xs" style={{ color: "var(--c-text-mid)" }}>{note}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
