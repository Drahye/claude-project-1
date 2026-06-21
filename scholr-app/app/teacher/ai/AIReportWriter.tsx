"use client"
import { useState } from "react"
import {
  Sparkles, ChevronDown, ChevronUp, Loader2,
  CheckCircle2, Send, RefreshCw, Users, Lock,
} from "lucide-react"
import { cn, getInitials, avatarColor } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import EmptyState from "@/components/shared/EmptyState"

interface Student {
  id: string
  full_name: string
  admission_number: string
}

interface DraftData {
  summary:            string
  encouragement:      string
  attendance_days:    number
  attendance_total:   number
  homework_submitted: number
  homework_total:     number
  sent:               boolean
}

interface Props {
  classes: Array<{ id: string; name: string; grade_level: string }>
  initialStudents: Student[]
  existingDrafts: Record<string, DraftData>
  weekStart: string
  teacherId: string
  aiEnabled: boolean
}

type GenerationState = "idle" | "generating" | "done" | "error"

interface ReportDraft {
  studentId:       string
  studentName:     string
  summary:         string
  encouragement:   string
  state:           GenerationState
  error?:          string
  saved:           boolean
  attendanceDays:  number
  attendanceTotal: number
  hwSubmitted:     number
  hwTotal:         number
}

export default function AIReportWriter({
  classes,
  initialStudents,
  existingDrafts,
  weekStart,
  teacherId,
  aiEnabled,
}: Props) {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? "")
  const [students, setStudents]               = useState<Student[]>(initialStudents)
  const [notes, setNotes]                     = useState<Record<string, string>>({})
  // Pre-fill drafts from any auto-generated / already-saved reports for this week
  const [drafts, setDrafts]                   = useState<Record<string, ReportDraft>>(() => {
    const init: Record<string, ReportDraft> = {}
    for (const [studentId, d] of Object.entries(existingDrafts)) {
      init[studentId] = {
        studentId, studentName: "",
        summary: d.summary, encouragement: d.encouragement,
        state: "done", saved: d.sent,
        attendanceDays: d.attendance_days, attendanceTotal: d.attendance_total,
        hwSubmitted: d.homework_submitted, hwTotal: d.homework_total,
      }
    }
    return init
  })
  const [expanded, setExpanded]               = useState<Record<string, boolean>>({})
  const [generatingAll, setGeneratingAll]     = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)

  async function switchClass(classId: string) {
    setSelectedClassId(classId)
    setLoadingStudents(true)
    setStudents([])

    const supabase = createClient()
    const { data } = await supabase
      .from("student_class_enrollments")
      .select("student:students(id, full_name, admission_number)")
      .eq("class_id", classId) as unknown as {
        data: Array<{ student: Student }> | null
      }

    setStudents((data ?? []).map(e => e.student).filter(Boolean))
    setLoadingStudents(false)
  }

  async function generateForStudent(student: Student) {
    setDrafts(prev => ({
      ...prev,
      [student.id]: {
        studentId: student.id, studentName: student.full_name,
        summary: "", encouragement: "", state: "generating",
        saved: false, attendanceDays: 0, attendanceTotal: 0, hwSubmitted: 0, hwTotal: 0,
      },
    }))
    setExpanded(prev => ({ ...prev, [student.id]: true }))

    const teacherNotes = notes[student.id] ?? ""

    try {
      const res = await fetch("/api/ai/weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId:    student.id,
          studentName:  student.full_name,
          weekStart,
          teacherNotes,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Failed to generate report")
      }

      const data = await res.json()

      setDrafts(prev => ({
        ...prev,
        [student.id]: {
          ...prev[student.id],
          summary:         data.summary,
          encouragement:   data.encouragement,
          attendanceDays:  data.attendance_days,
          attendanceTotal: data.attendance_total,
          hwSubmitted:     data.homework_submitted,
          hwTotal:         data.homework_total,
          state:           "done",
        },
      }))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setDrafts(prev => ({
        ...prev,
        [student.id]: { ...prev[student.id], state: "error", error: message },
      }))
    }
  }

  async function generateAll() {
    setGeneratingAll(true)
    for (const s of students) {
      if (!drafts[s.id] || drafts[s.id].state === "error") {
        await generateForStudent(s)
      }
    }
    setGeneratingAll(false)
  }

  async function saveReport(draft: ReportDraft) {
    const supabase = createClient()

    // Fetch school_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", teacherId)
      .single() as unknown as { data: { school_id: string } | null }

    if (!profile) return

    const weekEnd = (() => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + 4)
      return d.toISOString().split("T")[0]
    })()

    await (supabase.from("weekly_reports") as any)
      .upsert({
        school_id:          profile.school_id,
        student_id:         draft.studentId,
        week_start:         weekStart,
        week_end:           weekEnd,
        attendance_days:    draft.attendanceDays,
        attendance_total:   draft.attendanceTotal,
        homework_submitted: draft.hwSubmitted,
        homework_total:     draft.hwTotal,
        ai_summary:         draft.summary,
        ai_encouragement:   draft.encouragement,
        teacher_notes:      notes[draft.studentId] ? [notes[draft.studentId]] : [],
        sent_at:            new Date().toISOString(), // publish — parent can now see it
      }, { onConflict: "student_id,week_start" })

    setDrafts(prev => ({ ...prev, [draft.studentId]: { ...draft, saved: true } }))

    // Notify the student's parents that a report is ready (best-effort)
    void fetch("/api/notify/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: draft.studentId, weekStart }),
    }).catch(() => {})
  }

  const doneCount = Object.values(drafts).filter(d => d.state === "done").length
  const savedCount = Object.values(drafts).filter(d => d.saved).length

  return (
    <div className="space-y-6">
      {/* AI not enabled — friendly "coming soon" state */}
      {!aiEnabled && (
        <div className="rounded-2xl p-6 flex items-start gap-4"
          style={{ background: "var(--c-indigo-bg)", border: "1px solid var(--c-border)" }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "var(--c-indigo)" }}>
            <Lock size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>
              AI reports are coming soon
            </p>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--c-text-mid)" }}>
              Once your school enables the AI add-on, Claude will read each student&apos;s attendance and homework
              record and write a warm, personalised weekly report for every parent — in one click.
              You can still review your classes and students below.
            </p>
          </div>
        </div>
      )}

      {/* Class selector + generate all */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="input h-10 w-auto min-w-[200px] text-sm"
          value={selectedClassId}
          onChange={e => switchClass(e.target.value)}
          style={{ fontFamily: "inherit" }}
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} — {c.grade_level}</option>
          ))}
        </select>

        <button
          onClick={generateAll}
          disabled={!aiEnabled || generatingAll || loadingStudents || students.length === 0}
          className="btn-primary h-10 px-5 gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generatingAll
            ? <Loader2 size={15} className="animate-spin" />
            : <Sparkles size={15} />
          }
          {generatingAll ? "Generating…" : "Generate all reports"}
        </button>

        {doneCount > 0 && (
          <span className="text-sm" style={{ color: "var(--c-text-muted)" }}>
            {doneCount}/{students.length} generated · {savedCount} saved
          </span>
        )}
      </div>

      {/* Info card — only when AI is on */}
      {aiEnabled && (
        <div className="card p-4 flex gap-3" style={{ borderLeft: "3px solid var(--c-indigo)" }}>
          <Sparkles size={16} className="shrink-0 mt-0.5" style={{ color: "var(--c-indigo)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>How it works</p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
              Claude reads each student&apos;s attendance record, homework submission rate, and your personal notes to write a
              warm, accurate weekly report for parents. Add teacher notes per student for more personalised output.
            </p>
          </div>
        </div>
      )}

      {/* Student list */}
      {loadingStudents ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--c-text-muted)" }} />
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students enrolled"
          description="Once students are enrolled in this class, you can generate weekly reports for each of them here."
        />
      ) : (
        <div className="space-y-3">
          {students.map(student => {
            const draft   = drafts[student.id]
            const isOpen  = expanded[student.id]
            const state   = draft?.state ?? "idle"

            return (
              <div key={student.id} className="card overflow-hidden">
                {/* Student row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => setExpanded(prev => ({ ...prev, [student.id]: !prev[student.id] }))}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: avatarColor(student.full_name) }}
                  >
                    {getInitials(student.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{student.full_name}</p>
                    <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{student.admission_number}</p>
                  </div>

                  {/* Status badge */}
                  {state === "generating" && (
                    <span className="badge badge-indigo gap-1.5">
                      <Loader2 size={10} className="animate-spin" /> Generating
                    </span>
                  )}
                  {state === "done" && !draft?.saved && (
                    <span className="badge badge-gold">Pending review</span>
                  )}
                  {state === "done" && draft?.saved && (
                    <span className="badge badge-green">Sent to parents</span>
                  )}
                  {state === "error" && (
                    <span className="badge badge-red">Error</span>
                  )}

                  <button
                    onClick={e => { e.stopPropagation(); generateForStudent(student) }}
                    disabled={!aiEnabled || state === "generating"}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}
                    title={aiEnabled ? "Generate / regenerate report" : "AI not enabled yet"}
                  >
                    {state === "generating"
                      ? <Loader2 size={12} className="animate-spin" />
                      : state === "done" ? <RefreshCw size={12} /> : <Sparkles size={12} />
                    }
                    {state === "done" ? "Redo" : "Generate"}
                  </button>

                  {isOpen ? <ChevronUp size={16} style={{ color: "var(--c-text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--c-text-muted)" }} />}
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid var(--c-border)" }}>
                    {/* Teacher notes input */}
                    <div className="pt-4">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                        Your notes for Claude (optional)
                      </label>
                      <textarea
                        className="input text-sm w-full py-2.5 resize-none"
                        rows={2}
                        placeholder="e.g. Great improvement in maths this week, struggled with the science project…"
                        value={notes[student.id] ?? ""}
                        onChange={e => setNotes(prev => ({ ...prev, [student.id]: e.target.value }))}
                      />
                    </div>

                    {/* Draft output */}
                    {state === "generating" && (
                      <div className="flex items-center gap-2 py-4" style={{ color: "var(--c-text-muted)" }}>
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Claude is writing the report…</span>
                      </div>
                    )}
                    {state === "error" && (
                      <p className="text-sm py-2" style={{ color: "var(--c-red)" }}>{draft.error}</p>
                    )}
                    {state === "done" && draft && (
                      <div className="space-y-4">
                        {/* Stats row */}
                        <div className="flex gap-4 p-3 rounded-xl" style={{ background: "var(--c-surface)" }}>
                          <div className="text-xs">
                            <span className="font-bold" style={{ color: "var(--c-text)" }}>
                              {draft.attendanceDays}/{draft.attendanceTotal}
                            </span>
                            <span style={{ color: "var(--c-text-muted)" }}> days present</span>
                          </div>
                          <div className="text-xs">
                            <span className="font-bold" style={{ color: "var(--c-text)" }}>
                              {draft.hwSubmitted}/{draft.hwTotal}
                            </span>
                            <span style={{ color: "var(--c-text-muted)" }}> homework done</span>
                          </div>
                        </div>

                        {/* Summary */}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--c-text-muted)" }}>Summary</p>
                          <p className="text-sm leading-relaxed" style={{ color: "var(--c-text-mid)" }}>{draft.summary}</p>
                        </div>

                        {/* Encouragement */}
                        {draft.encouragement && (
                          <div className="p-4 rounded-xl" style={{ background: "var(--c-indigo-bg)" }}>
                            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--c-indigo)" }}>Note to child</p>
                            <p className="text-sm italic" style={{ color: "var(--c-text-mid)" }}>&ldquo;{draft.encouragement}&rdquo;</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={() => saveReport(draft)}
                            disabled={draft.saved}
                            className={cn(
                              "btn-primary h-9 px-4 gap-2 text-sm disabled:opacity-60",
                              draft.saved && "cursor-default"
                            )}
                          >
                            {draft.saved
                              ? <><CheckCircle2 size={14} /> Sent to parents</>
                              : <><Send size={14} /> Approve &amp; send</>
                            }
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
