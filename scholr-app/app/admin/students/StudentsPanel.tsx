"use client"
import { useState } from "react"
import Link from "next/link"
import { Plus, Search, X, Loader2, GraduationCap, CheckCircle2, Upload, FileText } from "lucide-react"
import { getInitials, avatarColor, formatDate } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { parseCsv, rowsToStudents, type ParsedRow } from "@/lib/csv-students"
import EmptyState from "@/components/shared/EmptyState"

interface Student {
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

interface Props {
  students: Student[]
  classes: Array<{ id: string; name: string; grade_level: string }>
  schoolId: string
}

export default function StudentsPanel({ students: initial, classes, schoolId }: Props) {
  const [students, setStudents] = useState<Student[]>(initial)
  const [query, setQuery]       = useState("")
  const [showForm, setShowForm] = useState(false)
  const [showCsv, setShowCsv]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // CSV import
  const [csvClassId, setCsvClassId] = useState("")
  const [parsed, setParsed]         = useState<ParsedRow[]>([])
  const [fileName, setFileName]     = useState("")
  const [importing, setImporting]   = useState(false)
  const [notice, setNotice]         = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name:        "",
    admission_number: "",
    date_of_birth:    "",
    gender:           "male" as "male" | "female" | "other",
    class_id:         classes[0]?.id ?? "",
  })

  function update(key: keyof typeof form, value: string) {
    setForm(p => ({ ...p, [key]: value }))
    setError(null)
    setSaved(false)
  }

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(query.toLowerCase()) ||
    s.admission_number.toLowerCase().includes(query.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim() || !form.admission_number.trim() || !form.date_of_birth) {
      setError("Please fill in all required fields.")
      return
    }

    setSaving(true)
    setError(null)

    const supabase = createClient()

    // Insert student
    const { data: newStudent, error: err } = await (supabase.from("students") as any)
      .insert({
        school_id:        schoolId,
        full_name:        form.full_name.trim(),
        admission_number: form.admission_number.trim(),
        date_of_birth:    form.date_of_birth,
        gender:           form.gender,
        is_active:        true,
      })
      .select()
      .single() as { data: Student | null; error: { message: string } | null }

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    // Enroll in class if selected
    if (newStudent && form.class_id) {
      await (supabase.from("student_class_enrollments") as any)
        .insert({ student_id: newStudent.id, class_id: form.class_id })
    }

    setSaving(false)
    setSaved(true)

    // Patch the new student with empty relations for display
    if (newStudent) {
      setStudents(prev => [{
        ...newStudent,
        enrollments: form.class_id
          ? [{ class: classes.find(c => c.id === form.class_id) ?? null }]
          : [],
        parents: [],
      }, ...prev])
    }

    setShowForm(false)
    setForm({ full_name: "", admission_number: "", date_of_birth: "", gender: "male", class_id: classes[0]?.id ?? "" })
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name); setError(null)
    const text = await file.text()
    const rows = rowsToStudents(parseCsv(text))
    if (rows.length === 0) { setError("No rows found in that file."); setParsed([]); return }
    setParsed(rows)
  }

  async function importCsv() {
    if (parsed.length === 0) { setError("Choose a CSV file first."); return }
    setImporting(true); setError(null); setNotice(null)
    try {
      const res = await fetch("/api/admin/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: parsed, classId: csvClassId || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Import failed."); return }
      const added = (data.students ?? []) as Student[]
      const cls = classes.find(c => c.id === csvClassId) ?? null
      setStudents(prev => [
        ...added.map(s => ({
          ...s,
          enrollments: csvClassId && cls ? [{ class: cls }] : [],
          parents: [] as Student["parents"],
        })),
        ...prev,
      ])
      const parts = [`${data.created} added`]
      if (data.skipped) parts.push(`${data.skipped} already existed`)
      if (data.invalid) parts.push(`${data.invalid} skipped (missing name/adm. no.)`)
      setNotice(parts.join(" · "))
      setParsed([]); setFileName(""); setShowCsv(false)
      setTimeout(() => setNotice(null), 5000)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
          <input
            type="text"
            placeholder="Search students…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input h-10 pl-9 text-sm w-full"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }}>
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => { setShowForm(v => !v); setShowCsv(false) }}
          className="btn-primary h-10 px-4 gap-2 text-sm"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Add student"}
        </button>

        <button
          onClick={() => { setShowCsv(v => !v); setShowForm(false); setError(null) }}
          className="h-10 px-4 gap-2 text-sm inline-flex items-center rounded-xl font-semibold"
          style={{ background: "var(--c-surface)", color: "var(--c-text)" }}
        >
          {showCsv ? <X size={15} /> : <Upload size={15} />}
          {showCsv ? "Cancel" : "Import CSV"}
        </button>

        {saved && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} style={{ color: "var(--c-emerald)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--c-emerald)" }}>Student added</span>
          </div>
        )}
        {notice && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} style={{ color: "var(--c-emerald)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--c-emerald)" }}>{notice}</span>
          </div>
        )}
      </div>

      {/* CSV import */}
      {showCsv && (
        <div className="card p-6 space-y-4">
          <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Import students from CSV</h2>
          <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
            Columns: <strong>full_name, admission_number, gender, date_of_birth</strong> (YYYY-MM-DD). A header row is optional. Students with an admission number that already exists are skipped.
          </p>
          {classes.length > 0 && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Enrol all in class (optional)</label>
              <select className="input h-10 text-sm w-full sm:w-72" value={csvClassId} onChange={e => setCsvClassId(e.target.value)} style={{ fontFamily: "inherit" }}>
                <option value="">No class yet</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.grade_level}</option>)}
              </select>
            </div>
          )}
          <label className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold cursor-pointer w-fit"
            style={{ background: "var(--c-surface)", color: "var(--c-text)" }}>
            <FileText size={15} /> {fileName || "Choose CSV file"}
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvFile} />
          </label>
          {parsed.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
              <div className="px-4 py-2 text-xs font-semibold" style={{ background: "var(--c-surface)", color: "var(--c-text-mid)" }}>
                {parsed.length} student{parsed.length === 1 ? "" : "s"} ready to import
              </div>
              <div className="max-h-56 overflow-y-auto divide-y" style={{ borderColor: "var(--c-border)" }}>
                {parsed.slice(0, 50).map((r, i) => (
                  <div key={i} className="px-4 py-2 text-sm flex justify-between gap-3" style={{ color: "var(--c-text)" }}>
                    <span className="truncate">{r.full_name || <em style={{ color: "var(--c-red)" }}>missing name</em>}</span>
                    <span className="shrink-0" style={{ color: "var(--c-text-muted)" }}>{r.admission_number || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-sm" style={{ color: "var(--c-red)" }}>{error}</p>}
          <button onClick={importCsv} disabled={importing || parsed.length === 0} className="btn-primary h-10 px-5 gap-2 disabled:opacity-50">
            {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {importing ? "Importing…" : `Import ${parsed.length || ""} student${parsed.length === 1 ? "" : "s"}`}
          </button>
        </div>
      )}

      {/* Add student form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>New student</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                Full name <span style={{ color: "var(--c-red)" }}>*</span>
              </label>
              <input
                type="text"
                className="input h-10 text-sm w-full"
                placeholder="Student's full name"
                value={form.full_name}
                onChange={e => update("full_name", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                Admission number <span style={{ color: "var(--c-red)" }}>*</span>
              </label>
              <input
                type="text"
                className="input h-10 text-sm w-full"
                placeholder="e.g. STU-2024-001"
                value={form.admission_number}
                onChange={e => update("admission_number", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                Date of birth <span style={{ color: "var(--c-red)" }}>*</span>
              </label>
              <input
                type="date"
                className="input h-10 text-sm w-full"
                value={form.date_of_birth}
                onChange={e => update("date_of_birth", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Gender</label>
              <select
                className="input h-10 text-sm w-full"
                value={form.gender}
                onChange={e => update("gender", e.target.value)}
                style={{ fontFamily: "inherit" }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            {classes.length > 0 && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Enrol in class</label>
                <select
                  className="input h-10 text-sm w-full"
                  value={form.class_id}
                  onChange={e => update("class_id", e.target.value)}
                  style={{ fontFamily: "inherit" }}
                >
                  <option value="">No class yet</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.grade_level}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && <p className="text-sm" style={{ color: "var(--c-red)" }}>{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary h-10 px-5 gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <GraduationCap size={15} />}
            {saving ? "Adding…" : "Add student"}
          </button>
        </form>
      )}

      {/* Students table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={query ? Search : GraduationCap}
          title={query ? "No students match your search" : "No students yet"}
          description={query
            ? "Try a different name or admission number."
            : "Add your first student to start tracking attendance, homework, and reports."}
          accent="var(--c-indigo)"
          action={query ? undefined : { label: "Add student", onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="card overflow-hidden">
          {/* Table header */}
          <div
            className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--c-text-muted)", borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)" }}
          >
            <span>Student</span>
            <span>Admission #</span>
            <span>Class</span>
            <span>Parent</span>
            <span>Status</span>
          </div>

          <div className="divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
            {filtered.map(student => {
              const className  = student.enrollments[0]?.class?.name ?? "—"
              const parentName = student.parents[0]?.parent?.full_name ?? "—"
              return (
                <Link
                  key={student.id}
                  href={`/admin/students/${student.id}`}
                  className="flex sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_80px] gap-4 items-center px-5 py-4 transition-colors hover:bg-[var(--c-surface)]"
                  style={{ textDecoration: "none" }}
                >
                  {/* Name + avatar */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: avatarColor(student.full_name) }}
                    >
                      {getInitials(student.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{student.full_name}</p>
                      <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Added {formatDate(student.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-sm hidden sm:block" style={{ color: "var(--c-text-mid)" }}>{student.admission_number}</p>
                  <p className="text-sm hidden sm:block" style={{ color: "var(--c-text-mid)" }}>{className}</p>
                  <p className="text-sm hidden sm:block truncate" style={{ color: "var(--c-text-mid)" }}>{parentName}</p>
                  <div className="ml-auto sm:ml-0">
                    <span
                      className="badge"
                      style={{
                        background: student.is_active ? "var(--c-emerald-bg)" : "var(--c-red-bg)",
                        color: student.is_active ? "var(--c-emerald)" : "var(--c-red)",
                      }}
                    >
                      {student.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
