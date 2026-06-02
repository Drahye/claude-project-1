"use client"
import { useState } from "react"
import { Plus, BookOpen, X, Loader2, CheckCircle2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { Homework } from "@/types/database"
import EmptyState from "@/components/shared/EmptyState"

interface Props {
  classes: Array<{ id: string; name: string; grade_level: string }>
  homeworkList: Homework[]
  classMap: Record<string, string>
  teacherId: string
}

const SUBJECTS = [
  "Mathematics", "English", "Science", "History", "Geography",
  "Art", "Music", "Physical Education", "Religious Studies", "French", "Other",
]

export default function HomeworkPanel({ classes, homeworkList: initial, classMap, teacherId }: Props) {
  const [list, setList]           = useState<Homework[]>(initial)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [saved, setSaved]         = useState(false)

  const [form, setForm] = useState({
    class_id:    classes[0]?.id ?? "",
    title:       "",
    subject:     "Mathematics",
    description: "",
    due_date:    "",
  })

  function updateForm(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaved(false)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.due_date || !form.class_id) {
      setError("Please fill in all required fields.")
      return
    }

    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", teacherId)
      .single() as unknown as { data: { school_id: string } | null }

    if (!profile) {
      setError("Could not determine school. Please refresh.")
      setSaving(false)
      return
    }

    const { data: newHw, error: err } = await (supabase
      .from("homework") as any)
      .insert({
        school_id:   profile.school_id,
        class_id:    form.class_id,
        teacher_id:  teacherId,
        title:       form.title.trim(),
        subject:     form.subject,
        description: form.description.trim() || null,
        due_date:    form.due_date,
        status:      "assigned",
      })
      .select()
      .single() as { data: Homework | null; error: { message: string } | null }

    setSaving(false)

    if (err) {
      setError(err.message)
    } else if (newHw) {
      setList(prev => [newHw, ...prev])
      setShowForm(false)
      setSaved(true)
      setForm({ class_id: classes[0]?.id ?? "", title: "", subject: "Mathematics", description: "", due_date: "" })
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const today = new Date().toISOString().split("T")[0]
  const upcoming = list.filter(h => h.due_date >= today)
  const past     = list.filter(h => h.due_date < today)

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} style={{ color: "var(--c-emerald)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--c-emerald)" }}>Homework assigned</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="btn-primary h-10 px-4 gap-2 text-sm"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Assign homework"}
        </button>
      </div>

      {/* Assign form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>New assignment</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                Class <span style={{ color: "var(--c-red)" }}>*</span>
              </label>
              <select
                className="input h-10 text-sm w-full"
                value={form.class_id}
                onChange={e => updateForm("class_id", e.target.value)}
                style={{ fontFamily: "inherit" }}
                required
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.grade_level}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                Subject <span style={{ color: "var(--c-red)" }}>*</span>
              </label>
              <select
                className="input h-10 text-sm w-full"
                value={form.subject}
                onChange={e => updateForm("subject", e.target.value)}
                style={{ fontFamily: "inherit" }}
                required
              >
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
              Title <span style={{ color: "var(--c-red)" }}>*</span>
            </label>
            <input
              type="text"
              className="input h-11 text-sm w-full"
              placeholder="e.g. Pages 40–45, Questions 1–10"
              value={form.title}
              onChange={e => updateForm("title", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
              Description / instructions (optional)
            </label>
            <textarea
              className="input text-sm w-full py-3 resize-none"
              rows={3}
              placeholder="Additional context for students and parents…"
              value={form.description}
              onChange={e => updateForm("description", e.target.value)}
            />
          </div>

          <div className="max-w-[200px]">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
              Due date <span style={{ color: "var(--c-red)" }}>*</span>
            </label>
            <input
              type="date"
              className="input h-10 text-sm w-full"
              min={today}
              value={form.due_date}
              onChange={e => updateForm("due_date", e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm" style={{ color: "var(--c-red)" }}>{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary h-10 px-6 gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <BookOpen size={15} />}
            {saving ? "Assigning…" : "Assign homework"}
          </button>
        </form>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>Upcoming</h2>
          <HomeworkList items={upcoming} classMap={classMap} today={today} />
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>Past</h2>
          <HomeworkList items={past} classMap={classMap} today={today} />
        </section>
      )}

      {list.length === 0 && !showForm && (
        <EmptyState
          icon={BookOpen}
          title="No homework assigned yet"
          description="Assign your first piece of homework — students and parents will see it right away."
          action={{ label: "Assign homework", onClick: () => setShowForm(true) }}
        />
      )}
    </div>
  )
}

function HomeworkList({ items, classMap, today }: { items: Homework[]; classMap: Record<string, string>; today: string }) {
  return (
    <div className="card divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
      {items.map(hw => {
        const dueDate  = new Date(hw.due_date)
        const todayD   = new Date(today)
        const daysLeft = Math.ceil((dueDate.getTime() - todayD.getTime()) / (1000 * 60 * 60 * 24))
        const overdue  = daysLeft < 0
        const urgent   = daysLeft <= 1 && !overdue

        return (
          <div key={hw.id} className="flex items-start gap-4 px-5 py-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: overdue ? "var(--c-red-bg)" : urgent ? "var(--c-gold-bg)" : "var(--c-indigo-bg)" }}
            >
              <BookOpen size={14} style={{ color: overdue ? "var(--c-red)" : urgent ? "var(--c-gold)" : "var(--c-indigo)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{hw.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                {hw.subject} · {classMap[hw.class_id] ?? "—"}
              </p>
              {hw.description && (
                <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--c-text-mid)" }}>{hw.description}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold" style={{ color: overdue ? "var(--c-red)" : urgent ? "var(--c-gold)" : "var(--c-text-mid)" }}>
                {overdue ? "Overdue" : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>{formatDate(hw.due_date)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
