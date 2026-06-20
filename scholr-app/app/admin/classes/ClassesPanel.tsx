"use client"
import { useState } from "react"
import Link from "next/link"
import { Plus, X, Loader2, BookOpen, CheckCircle2, Users } from "lucide-react"
import { avatarColor, getInitials } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import EmptyState from "@/components/shared/EmptyState"

interface ClassRow {
  id: string
  name: string
  grade_level: string
  academic_year: string
  teacher_id: string | null
  teacher: { full_name: string } | null
  enrollment_count: number
}

interface Props {
  classes: ClassRow[]
  teachers: Array<{ id: string; full_name: string }>
  schoolId: string
}

const GRADE_LEVELS = [
  "Nursery 1", "Nursery 2",
  "Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6",
  "JSS 1", "JSS 2", "JSS 3",
  "SSS 1", "SSS 2", "SSS 3",
  "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "KG 1", "KG 2",
]

const currentYear = new Date().getFullYear()
const ACADEMIC_YEARS = [`${currentYear - 1}/${currentYear}`, `${currentYear}/${currentYear + 1}`]

export default function ClassesPanel({ classes: initial, teachers, schoolId }: Props) {
  const [classes, setClasses] = useState<ClassRow[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const [form, setForm] = useState({
    name:          "",
    grade_level:   GRADE_LEVELS[0],
    academic_year: ACADEMIC_YEARS[1],
    teacher_id:    teachers[0]?.id ?? "",
  })

  function update(key: keyof typeof form, value: string) {
    setForm(p => ({ ...p, [key]: value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError("Class name is required."); return }

    setSaving(true)
    const supabase = createClient()

    const { data: newClass, error: err } = await (supabase.from("classes") as any)
      .insert({
        school_id:     schoolId,
        name:          form.name.trim(),
        grade_level:   form.grade_level,
        academic_year: form.academic_year,
        teacher_id:    form.teacher_id || null,
      })
      .select()
      .single() as { data: ClassRow | null; error: { message: string } | null }

    setSaving(false)

    if (err) {
      setError(err.message)
    } else if (newClass) {
      const teacher = teachers.find(t => t.id === form.teacher_id) ?? null
      setClasses(prev => [{ ...newClass, teacher: teacher ? { full_name: teacher.full_name } : null, enrollment_count: 0 }, ...prev])
      setShowForm(false)
      setSaved(true)
      setForm({ name: "", grade_level: GRADE_LEVELS[0], academic_year: ACADEMIC_YEARS[1], teacher_id: teachers[0]?.id ?? "" })
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={() => setShowForm(v => !v)} className="btn-primary h-10 px-4 gap-2 text-sm">
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "New class"}
        </button>
        {saved && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} style={{ color: "var(--c-emerald)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--c-emerald)" }}>Class created</span>
          </div>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>New class</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                Class name <span style={{ color: "var(--c-red)" }}>*</span>
              </label>
              <input
                type="text"
                className="input h-10 text-sm w-full"
                placeholder="e.g. Basic 3A"
                value={form.name}
                onChange={e => update("name", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Grade level</label>
              <select className="input h-10 text-sm w-full" value={form.grade_level} onChange={e => update("grade_level", e.target.value)} style={{ fontFamily: "inherit" }}>
                {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Academic year</label>
              <select className="input h-10 text-sm w-full" value={form.academic_year} onChange={e => update("academic_year", e.target.value)} style={{ fontFamily: "inherit" }}>
                {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {teachers.length > 0 && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Assign teacher</label>
                <select className="input h-10 text-sm w-full" value={form.teacher_id} onChange={e => update("teacher_id", e.target.value)} style={{ fontFamily: "inherit" }}>
                  <option value="">No teacher yet</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
            )}
          </div>
          {error && <p className="text-sm" style={{ color: "var(--c-red)" }}>{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary h-10 px-5 gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <BookOpen size={15} />}
            {saving ? "Creating…" : "Create class"}
          </button>
        </form>
      )}

      {classes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No classes yet"
          description="Create your first class, assign a teacher, and start enrolling students."
          accent="var(--c-gold)"
          action={{ label: "Create class", onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <Link key={cls.id} href={`/admin/classes/${cls.id}`} className="card p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]" style={{ textDecoration: "none" }}>
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: avatarColor(cls.name) }}
                >
                  {getInitials(cls.name)}
                </div>
                <span className="badge" style={{ background: "var(--c-surface)", color: "var(--c-text-muted)" }}>
                  {cls.academic_year}
                </span>
              </div>
              <p className="font-bold text-sm mb-0.5" style={{ color: "var(--c-text)" }}>{cls.name}</p>
              <p className="text-xs mb-3" style={{ color: "var(--c-text-muted)" }}>{cls.grade_level}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users size={12} style={{ color: "var(--c-text-muted)" }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--c-text-muted)" }}>
                    {cls.enrollment_count} student{cls.enrollment_count !== 1 ? "s" : ""}
                  </span>
                </div>
                {cls.teacher && (
                  <p className="text-xs truncate max-w-[120px]" style={{ color: "var(--c-text-muted)" }}>
                    {cls.teacher.full_name}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
