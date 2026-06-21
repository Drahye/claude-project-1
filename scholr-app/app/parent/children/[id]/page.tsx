import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { avatarColor, getInitials, formatDate } from "@/lib/utils"
import { signStudentPhoto } from "@/lib/student-photo"
import ChildEditor from "./ChildEditor"
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, BookOpen,
  MessageSquare, Sparkles, Calendar,
} from "lucide-react"

export const metadata: Metadata = { title: "Child" }

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // ── Security: confirm this child is linked to the signed-in parent ──────────
  const { data: link } = await supabase
    .from("parent_students")
    .select("is_primary, student_id")
    .eq("parent_id", user.id)
    .eq("student_id", id)
    .maybeSingle() as unknown as { data: { is_primary: boolean; student_id: string } | null }

  if (!link) notFound()

  // ── Child + class ───────────────────────────────────────────────────────────
  const { data: student } = await supabase
    .from("students")
    .select(`
      id, full_name, photo_url, admission_number, date_of_birth, gender,
      personal, medical, activities,
      enrollments:student_class_enrollments(
        class:classes(id, name, grade_level, teacher_id)
      )
    `)
    .eq("id", id)
    .single() as unknown as { data: any | null }

  if (!student) notFound()

  const photoDisplay = await signStudentPhoto(student.photo_url)

  const cls       = student.enrollments?.[0]?.class
  const classId   = cls?.id ?? null

  // ── Teacher (for "message teacher" CTA) ──────────────────────────────────────
  let teacher: { id: string; full_name: string } | null = null
  if (cls?.teacher_id) {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", cls.teacher_id)
      .maybeSingle() as unknown as { data: { id: string; full_name: string } | null }
    teacher = data
  }

  // ── Attendance (last 30 days) ────────────────────────────────────────────────
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: attendance } = await supabase
    .from("attendance")
    .select("date, status, note")
    .eq("student_id", id)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: false }) as unknown as {
      data: Array<{ date: string; status: string; note: string | null }> | null
    }

  const att        = attendance ?? []
  const present    = att.filter(a => a.status === "present").length
  const late       = att.filter(a => a.status === "late").length
  const absent     = att.filter(a => a.status === "absent").length
  const attPct     = att.length > 0 ? Math.round(((present + late) / att.length) * 100) : null

  // ── Homework (upcoming for the child's class) ────────────────────────────────
  let homework: Array<{ id: string; title: string; subject: string; due_date: string }> = []
  if (classId) {
    const { data } = await supabase
      .from("homework")
      .select("id, title, subject, due_date")
      .eq("class_id", classId)
      .gte("due_date", new Date().toISOString().split("T")[0])
      .order("due_date", { ascending: true })
      .limit(6) as unknown as {
        data: Array<{ id: string; title: string; subject: string; due_date: string }> | null
      }
    homework = data ?? []
  }

  // ── Latest weekly report ─────────────────────────────────────────────────────
  const { data: report } = await supabase
    .from("weekly_reports")
    .select("week_start, ai_summary, ai_encouragement, attendance_days, attendance_total, homework_submitted, homework_total")
    .eq("student_id", id)
    .not("sent_at", "is", null)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle() as unknown as { data: any | null }

  const statusMeta: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
    present: { label: "Present", color: "var(--c-emerald)", bg: "var(--c-emerald-bg)", icon: CheckCircle2 },
    late:    { label: "Late",    color: "var(--c-gold)",    bg: "var(--c-gold-bg)",    icon: Clock },
    absent:  { label: "Absent",  color: "var(--c-red)",     bg: "var(--c-red-bg)",     icon: XCircle },
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">

      {/* Back link */}
      <Link href="/parent/children"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-opacity hover:opacity-70"
        style={{ color: "var(--c-text-muted)", textDecoration: "none" }}>
        <ArrowLeft size={15} /> All children
      </Link>

      {/* Header card */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center text-white text-2xl font-bold shrink-0"
            style={{ background: avatarColor(student.full_name) }}
          >
            {photoDisplay
              ? <img src={photoDisplay} alt={student.full_name} className="w-full h-full object-cover" />
              : getInitials(student.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
                {student.full_name}
              </h1>
              {link.is_primary && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}>
                  Primary contact
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
              {cls ? `${cls.name} · ${cls.grade_level}` : "Not enrolled in a class"}
              {student.admission_number ? ` · #${student.admission_number}` : ""}
            </p>
          </div>

          {/* Message teacher CTA */}
          {teacher && (
            <Link
              href="/parent/messages"
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95 shrink-0"
              style={{ background: "var(--c-indigo)", color: "white", textDecoration: "none" }}
            >
              <MessageSquare size={15} />
              Message {teacher.full_name.split(" ")[0]}
            </Link>
          )}
        </div>

        {/* Attendance summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6" style={{ borderTop: "1px solid var(--c-border)" }}>
          <Stat label="Attendance" value={attPct !== null ? `${attPct}%` : "—"}
            color={attPct !== null && attPct >= 80 ? "var(--c-emerald)" : attPct !== null ? "var(--c-red)" : "var(--c-text-muted)"} />
          <Stat label="Present" value={String(present)} color="var(--c-emerald)" />
          <Stat label="Late" value={String(late)} color="var(--c-gold)" />
          <Stat label="Absent" value={String(absent)} color={absent > 0 ? "var(--c-red)" : "var(--c-text)"} />
        </div>
      </div>

      {/* Parent-contributed profile: about, medical, photo (+ teacher activities) */}
      <div className="mb-6">
        <ChildEditor
          childId={student.id}
          firstName={student.full_name.split(" ")[0]}
          personal={student.personal ?? null}
          medical={student.medical ?? null}
          activities={Array.isArray(student.activities) ? student.activities : null}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* Left: attendance history + homework */}
        <div className="space-y-6">

          {/* Weekly report */}
          {report && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>
                Latest weekly report
              </h2>
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge-indigo"><Sparkles size={10} /> AI · Claude</span>
                  <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                    Week of {formatDate(report.week_start)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--c-text-mid)" }}>
                  {report.ai_summary || "No summary available for this week."}
                </p>
                {report.ai_encouragement && (
                  <div className="rounded-xl p-4 mb-4" style={{ background: "var(--c-indigo-bg)" }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--c-indigo)" }}>
                      Note for {student.full_name.split(" ")[0]}
                    </p>
                    <p className="text-sm italic" style={{ color: "var(--c-text-mid)" }}>&ldquo;{report.ai_encouragement}&rdquo;</p>
                  </div>
                )}
                <div className="flex gap-4 pt-3" style={{ borderTop: "1px solid var(--c-border)" }}>
                  <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--c-text)" }}>
                    <CheckCircle2 size={13} style={{ color: "var(--c-emerald)" }} />
                    {report.attendance_days}/{report.attendance_total} present
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--c-text)" }}>
                    <BookOpen size={13} style={{ color: "var(--c-indigo)" }} />
                    {report.homework_submitted}/{report.homework_total} homework
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Attendance history */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>
              Attendance — last 30 days
            </h2>
            {att.length === 0 ? (
              <div className="card px-5 py-8 text-center">
                <Calendar size={22} className="mx-auto mb-2" style={{ color: "var(--c-text-muted)", opacity: 0.5 }} />
                <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>No attendance records yet.</p>
              </div>
            ) : (
              <div className="card divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
                {att.slice(0, 12).map((a, i) => {
                  const meta = statusMeta[a.status] ?? statusMeta.present
                  const Icon = meta.icon
                  return (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                        <Icon size={14} style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{formatDate(a.date, "long")}</p>
                        {a.note && <p className="text-xs truncate" style={{ color: "var(--c-text-muted)" }}>{a.note}</p>}
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right: upcoming homework */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>
            Upcoming homework
          </h2>
          {homework.length === 0 ? (
            <div className="card px-5 py-8 text-center">
              <CheckCircle2 size={22} className="mx-auto mb-2" style={{ color: "var(--c-emerald)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>All caught up</p>
              <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>No homework due.</p>
            </div>
          ) : (
            <div className="card divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
              {homework.map(hw => {
                const daysLeft = Math.ceil((new Date(hw.due_date).getTime() - Date.now()) / 86400000)
                const urgent = daysLeft <= 1
                return (
                  <div key={hw.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: urgent ? "var(--c-gold-bg)" : "var(--c-indigo-bg)" }}>
                      <BookOpen size={14} style={{ color: urgent ? "var(--c-gold)" : "var(--c-indigo)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{hw.title}</p>
                      <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{hw.subject}</p>
                    </div>
                    <p className="text-xs font-bold shrink-0" style={{ color: urgent ? "var(--c-gold)" : "var(--c-text-mid)" }}>
                      {daysLeft === 0 ? "Today" : `${daysLeft}d`}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-extrabold tabular-nums" style={{ color, letterSpacing: "-0.02em" }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>{label}</p>
    </div>
  )
}
