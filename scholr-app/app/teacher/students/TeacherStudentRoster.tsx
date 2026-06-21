"use client"
import { useState } from "react"
import { Plus, Loader2, Users, CheckCircle2, Upload, FileText } from "lucide-react"
import { getInitials, avatarColor } from "@/lib/utils"
import EmptyState from "@/components/shared/EmptyState"

interface ClassOpt { id: string; name: string; grade_level: string }
interface RosterStudent { id: string; full_name: string; admission_number: string; class_names: string[] }

interface Props {
  classes: ClassOpt[]
  students: RosterStudent[]
}

interface ParsedRow { full_name: string; admission_number: string; gender: string; date_of_birth: string }

/** Minimal CSV parser: handles quoted fields and commas inside quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let field = ""
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ",") { row.push(field); field = "" }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(field); field = ""
      if (row.some(c => c.trim() !== "")) rows.push(row)
      row = []
    } else field += ch
  }
  if (field !== "" || row.length > 0) { row.push(field); if (row.some(c => c.trim() !== "")) rows.push(row) }
  return rows
}

/** Map CSV rows → student objects, detecting columns from the header row. */
function rowsToStudents(rows: string[][]): ParsedRow[] {
  if (rows.length === 0) return []
  const header = rows[0].map(h => h.trim().toLowerCase())
  const looksLikeHeader = header.some(h => /name|admission|adm|gender|birth|dob/.test(h))
  const idx = (...keys: string[]) => header.findIndex(h => keys.some(k => h.includes(k)))
  const nameI = looksLikeHeader ? idx("full name", "name", "student") : 0
  const admI  = looksLikeHeader ? idx("admission", "adm", "roll", "id") : 1
  const genI  = looksLikeHeader ? idx("gender", "sex") : 2
  const dobI  = looksLikeHeader ? idx("birth", "dob") : 3
  const body = looksLikeHeader ? rows.slice(1) : rows
  return body.map(r => ({
    full_name:        (nameI >= 0 ? r[nameI] : r[0] ?? "").trim(),
    admission_number: (admI  >= 0 ? r[admI]  : r[1] ?? "").trim(),
    gender:           (genI  >= 0 ? r[genI]  : "").trim(),
    date_of_birth:    (dobI  >= 0 ? r[dobI]  : "").trim(),
  })).filter(s => s.full_name || s.admission_number)
}

export default function TeacherStudentRoster({ classes, students: initial }: Props) {
  const [students, setStudents] = useState<RosterStudent[]>(initial)
  const [mode, setMode] = useState<null | "manual" | "csv">(null)
  const [classId, setClassId] = useState(classes[0]?.id ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // manual form
  const [form, setForm] = useState({ full_name: "", admission_number: "", gender: "male", date_of_birth: "" })
  // csv
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState("")

  const className = (id: string) => classes.find(c => c.id === id)?.name ?? ""

  function reset() {
    setMode(null); setForm({ full_name: "", admission_number: "", gender: "male", date_of_birth: "" })
    setParsed([]); setFileName(""); setError(null)
  }

  async function submit(rows: ParsedRow[]) {
    if (!classId) { setError("Pick a class first."); return }
    if (rows.length === 0) { setError("Nothing to add."); return }
    setSaving(true); setError(null); setNotice(null)
    try {
      const res = await fetch("/api/teacher/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, students: rows }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Couldn't add students."); return }
      const added = (data.students ?? []) as Array<{ id: string; full_name: string; admission_number: string }>
      setStudents(prev => [
        ...added.map(s => ({ id: s.id, full_name: s.full_name, admission_number: s.admission_number, class_names: [className(classId)] })),
        ...prev,
      ].sort((a, b) => a.full_name.localeCompare(b.full_name)))
      const parts = [`${data.created} added`]
      if (data.skipped) parts.push(`${data.skipped} already existed`)
      if (data.invalid) parts.push(`${data.invalid} skipped (missing name/adm. no.)`)
      setNotice(parts.join(" · "))
      reset()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  function handleManual(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim() || !form.admission_number.trim()) { setError("Name and admission number are required."); return }
    submit([{ ...form }])
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name); setError(null)
    const text = await file.text()
    const rows = rowsToStudents(parseCsv(text))
    if (rows.length === 0) { setError("No rows found in that file."); setParsed([]); return }
    setParsed(rows)
  }

  if (classes.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No classes assigned yet"
        description="Once an admin assigns you to a class, you'll be able to add students to it here."
        accent="var(--c-indigo)"
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={() => setMode(mode === "manual" ? null : "manual")} className="btn-primary h-10 px-4 gap-2 text-sm">
          <Plus size={15} /> Add student
        </button>
        <button onClick={() => setMode(mode === "csv" ? null : "csv")} className="h-10 px-4 gap-2 text-sm inline-flex items-center rounded-xl font-semibold"
          style={{ background: "var(--c-surface)", color: "var(--c-text)" }}>
          <Upload size={15} /> Import CSV
        </button>
        {notice && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} style={{ color: "var(--c-emerald)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--c-emerald)" }}>{notice}</span>
          </div>
        )}
      </div>

      {/* Shared class picker */}
      {mode && (
        <div className="card p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Add to class</label>
            <select className="input h-10 text-sm w-full sm:w-72" value={classId} onChange={e => setClassId(e.target.value)} style={{ fontFamily: "inherit" }}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} · {c.grade_level}</option>)}
            </select>
          </div>

          {mode === "manual" && (
            <form onSubmit={handleManual} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Full name <span style={{ color: "var(--c-red)" }}>*</span></label>
                  <input className="input h-10 text-sm w-full" placeholder="e.g. Ada Obi" value={form.full_name}
                    onChange={e => { setForm(p => ({ ...p, full_name: e.target.value })); setError(null) }} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Admission no. <span style={{ color: "var(--c-red)" }}>*</span></label>
                  <input className="input h-10 text-sm w-full" placeholder="e.g. ADM-014" value={form.admission_number}
                    onChange={e => { setForm(p => ({ ...p, admission_number: e.target.value })); setError(null) }} required />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Gender</label>
                  <select className="input h-10 text-sm w-full" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} style={{ fontFamily: "inherit" }}>
                    <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Date of birth</label>
                  <input type="date" className="input h-10 text-sm w-full" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} />
                </div>
              </div>
              {error && <p className="text-sm" style={{ color: "var(--c-red)" }}>{error}</p>}
              <button type="submit" disabled={saving} className="btn-primary h-10 px-5 gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}{saving ? "Adding…" : "Add student"}
              </button>
            </form>
          )}

          {mode === "csv" && (
            <div className="space-y-4">
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                CSV columns: <strong>full_name, admission_number, gender, date_of_birth</strong> (YYYY-MM-DD). A header row is optional.
              </p>
              <label className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold cursor-pointer w-fit"
                style={{ background: "var(--c-surface)", color: "var(--c-text)" }}>
                <FileText size={15} /> {fileName || "Choose CSV file"}
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
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
              <button onClick={() => submit(parsed)} disabled={saving || parsed.length === 0} className="btn-primary h-10 px-5 gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}{saving ? "Importing…" : `Import ${parsed.length || ""} student${parsed.length === 1 ? "" : "s"}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Roster */}
      {students.length === 0 ? (
        <EmptyState icon={Users} title="No students yet" description="Add your first student above." accent="var(--c-indigo)" />
      ) : (
        <div className="space-y-2">
          {students.map(s => (
            <div key={s.id} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: avatarColor(s.full_name) }}>
                {getInitials(s.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{s.full_name}</p>
                <p className="text-xs truncate" style={{ color: "var(--c-text-muted)" }}>
                  {s.admission_number}{s.class_names.length > 0 ? ` · ${s.class_names.join(", ")}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
