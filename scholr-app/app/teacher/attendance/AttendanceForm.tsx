"use client"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Clock, AlertCircle, Save, Loader2, Users } from "lucide-react"
import { cn, getInitials, avatarColor } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import EmptyState from "@/components/shared/EmptyState"

type AttendanceStatus = "present" | "absent" | "late" | "excused"

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: typeof CheckCircle2; activeColor: string; activeBg: string }> = {
  present: { label: "Present",  icon: CheckCircle2, activeColor: "var(--c-emerald)", activeBg: "var(--c-emerald-bg)" },
  absent:  { label: "Absent",   icon: XCircle,      activeColor: "var(--c-red)",     activeBg: "var(--c-red-bg)" },
  late:    { label: "Late",     icon: Clock,        activeColor: "var(--c-gold)",    activeBg: "var(--c-gold-bg)" },
  excused: { label: "Excused",  icon: AlertCircle,  activeColor: "var(--c-indigo)",  activeBg: "var(--c-indigo-bg)" },
}

interface Student {
  id: string
  full_name: string
  photo_url: string | null
  admission_number: string
}

interface Props {
  classes: Array<{ id: string; name: string; grade_level: string }>
  selectedClassId: string
  selectedDate: string
  students: Student[]
  existingRecords: Record<string, string>
  teacherId: string
  schoolId: string
}

export default function AttendanceForm({
  classes,
  selectedClassId,
  selectedDate,
  students,
  existingRecords,
  teacherId,
  schoolId,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [classId, setClassId] = useState(selectedClassId)
  const [date, setDate]       = useState(selectedDate)
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(() => {
    const init: Record<string, AttendanceStatus> = {}
    for (const s of students) {
      init[s.id] = (existingRecords[s.id] ?? "present") as AttendanceStatus
    }
    return init
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  function markAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = {}
    for (const s of students) next[s.id] = status
    setAttendance(next)
    setSaved(false)
  }

  function handleClassChange(newClassId: string) {
    setClassId(newClassId)
    const params = new URLSearchParams({ class: newClassId, date })
    startTransition(() => router.push(`/teacher/attendance?${params.toString()}`))
  }

  function handleDateChange(newDate: string) {
    setDate(newDate)
    const params = new URLSearchParams({ class: classId, date: newDate })
    startTransition(() => router.push(`/teacher/attendance?${params.toString()}`))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)

    const supabase = createClient()

    const records = students.map(s => ({
      school_id:  schoolId,
      class_id:   classId,
      student_id: s.id,
      teacher_id: teacherId,
      date,
      status: attendance[s.id] ?? "present",
    }))

    const { error: err } = await (supabase
      .from("attendance") as any)
      .upsert(records, { onConflict: "student_id,class_id,date" }) as { error: { message: string } | null }

    setSaving(false)
    if (err) {
      setError(err.message)
    } else {
      setSaved(true)
      // Alert parents of any students marked absent (best-effort, fire-and-forget)
      const absentIds = students.filter(s => attendance[s.id] === "absent").map(s => s.id)
      if (absentIds.length > 0) {
        void fetch("/api/notify/absence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: absentIds, date }),
        }).catch(() => {})
      }
    }
  }

  const presentCount = Object.values(attendance).filter(s => s === "present").length
  const absentCount  = Object.values(attendance).filter(s => s === "absent").length
  const lateCount    = Object.values(attendance).filter(s => s === "late").length

  return (
    <div className="space-y-5">
      {/* Controls row */}
      <div className="flex flex-wrap gap-3">
        <select
          value={classId}
          onChange={e => handleClassChange(e.target.value)}
          className="input h-10 w-auto min-w-[160px] text-sm"
          style={{ fontFamily: "inherit" }}
          disabled={isPending}
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name} — {c.grade_level}</option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          max={new Date().toISOString().split("T")[0]}
          onChange={e => handleDateChange(e.target.value)}
          className="input h-10 w-auto text-sm"
          style={{ fontFamily: "inherit" }}
          disabled={isPending}
        />
      </div>

      {/* Summary + mark-all */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} style={{ color: "var(--c-emerald)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{presentCount} present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle size={14} style={{ color: "var(--c-red)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{absentCount} absent</span>
          </div>
          {lateCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock size={14} style={{ color: "var(--c-gold)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{lateCount} late</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => markAll("present")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "var(--c-emerald-bg)", color: "var(--c-emerald)" }}
          >
            All present
          </button>
          <button
            onClick={() => markAll("absent")}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}
          >
            All absent
          </button>
        </div>
      </div>

      {/* Student list */}
      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students in this class"
          description="Once students are enrolled, you'll be able to mark daily attendance here."
        />
      ) : (
        <div className="card divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
          {students.map(student => {
            const status = attendance[student.id] ?? "present"
            return (
              <div key={student.id} className="flex items-center gap-4 px-5 py-4">
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: avatarColor(student.full_name) }}
                >
                  {getInitials(student.full_name)}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{student.full_name}</p>
                  <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{student.admission_number}</p>
                </div>

                {/* Status toggles */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {(Object.entries(STATUS_CONFIG) as [AttendanceStatus, typeof STATUS_CONFIG[AttendanceStatus]][]).map(([s, cfg]) => {
                    const active = status === s
                    const Icon = cfg.icon
                    return (
                      <button
                        key={s}
                        onClick={() => {
                          setAttendance(prev => ({ ...prev, [student.id]: s }))
                          setSaved(false)
                        }}
                        title={cfg.label}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150",
                          active ? "scale-110 shadow-sm" : "opacity-40 hover:opacity-70"
                        )}
                        style={{
                          background: active ? cfg.activeBg : "var(--c-surface)",
                        }}
                      >
                        <Icon size={15} style={{ color: active ? cfg.activeColor : "var(--c-text-muted)" }} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Save row */}
      <div className="flex items-center gap-4 py-2">
        <button
          onClick={handleSave}
          disabled={saving || students.length === 0}
          className="btn-primary h-10 px-6 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving…" : "Save attendance"}
        </button>
        {saved && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} style={{ color: "var(--c-emerald)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--c-emerald)" }}>Saved</span>
          </div>
        )}
        {error && (
          <p className="text-sm" style={{ color: "var(--c-red)" }}>{error}</p>
        )}
      </div>
    </div>
  )
}
