"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Pencil, Check, Loader2, Plus, X, ClipboardCheck, BookOpen,
  GraduationCap, Search, UserPlus,
} from "lucide-react"
import { avatarColor, getInitials } from "@/lib/utils"
import type { StudentActivity } from "@/types/database"

interface StudentRow {
  id: string
  full_name: string
  photo_url: string | null   // signed
  activities: StudentActivity[]
}
interface AvailableStudent { id: string; full_name: string; admission_number: string }
interface Props {
  classId: string
  name: string
  grade: string
  academicYear: string
  teacherName: string | null
  students: StudentRow[]
  canManage: boolean
  /** Manage enrolment (add/remove students). Defaults to canManage; admins get
      this true even when canManage is false (activities stay teacher-only). */
  canEnroll?: boolean
  /** School students not already in this class — for the "enroll existing" picker. */
  availableStudents?: AvailableStudent[]
}

const CATEGORIES = [
  { id: "sport", label: "Sport", tint: "var(--c-emerald)" },
  { id: "swimming", label: "Swimming", tint: "var(--c-info)" },
  { id: "club", label: "Club", tint: "var(--c-indigo)" },
  { id: "creative", label: "Creative", tint: "var(--c-gold)" },
  { id: "music", label: "Music", tint: "var(--c-red)" },
  { id: "other", label: "Other", tint: "var(--c-text-muted)" },
]
const tintFor = (c: string) => CATEGORIES.find(x => x.id === c)?.tint ?? "var(--c-indigo)"

export default function ClassDetail({ classId, name, grade, academicYear, teacherName, students, canManage, canEnroll = canManage, availableStudents = [] }: Props) {
  const router = useRouter()
  const [err, setErr] = useState<string | null>(null)

  // add-students panel
  const [addPanel, setAddPanel] = useState<null | "existing" | "new">(null)
  const [query, setQuery] = useState("")
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [newStu, setNewStu] = useState({ full_name: "", admission_number: "", gender: "male", date_of_birth: "" })
  const [savingNew, setSavingNew] = useState(false)

  const matches = query.trim()
    ? availableStudents.filter(s =>
        s.full_name.toLowerCase().includes(query.toLowerCase()) ||
        s.admission_number.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8)
    : availableStudents.slice(0, 8)

  async function enrollExisting(studentId: string) {
    setEnrolling(studentId); setErr(null)
    try {
      const res = await fetch("/api/class/enroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId, studentId }) })
      const j = await res.json(); if (!res.ok) throw new Error(j.error ?? "Failed")
      setQuery(""); router.refresh()
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed to enroll") } finally { setEnrolling(null) }
  }

  async function createAndEnroll(e: React.FormEvent) {
    e.preventDefault()
    if (!newStu.full_name.trim() || !newStu.admission_number.trim()) { setErr("Name and admission number are required."); return }
    setSavingNew(true); setErr(null)
    try {
      const res = await fetch("/api/class/enroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId, newStudent: newStu }) })
      const j = await res.json(); if (!res.ok) throw new Error(j.error ?? "Failed")
      setNewStu({ full_name: "", admission_number: "", gender: "male", date_of_birth: "" }); setAddPanel(null); router.refresh()
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed to add student") } finally { setSavingNew(false) }
  }

  // header edit
  const [editing, setEditing] = useState(false)
  const [nm, setNm] = useState(name)
  const [gr, setGr] = useState(grade)
  const [yr, setYr] = useState(academicYear)
  const [savingHdr, setSH] = useState(false)

  // per-student activities (local)
  const [acts, setActs] = useState<Record<string, StudentActivity[]>>(
    Object.fromEntries(students.map(s => [s.id, s.activities ?? []]))
  )
  const [addOpen, setAddOpen] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const [newCat, setNewCat] = useState("club")
  const [busy, setBusy] = useState<string | null>(null)

  async function saveHeader() {
    if (!nm.trim()) { setErr("Class name is required."); return }
    setSH(true); setErr(null)
    try {
      const res = await fetch("/api/teacher/class", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId, name: nm, grade_level: gr, academic_year: yr }) })
      const j = await res.json(); if (!res.ok) throw new Error(j.error ?? "Save failed")
      setEditing(false); router.refresh()
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed") } finally { setSH(false) }
  }

  async function addActivity(studentId: string) {
    if (!newName.trim()) return
    setBusy(studentId); setErr(null)
    try {
      const res = await fetch("/api/teacher/activity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId, studentId, name: newName, category: newCat }) })
      const j = await res.json(); if (!res.ok) throw new Error(j.error ?? "Failed")
      setActs(a => ({ ...a, [studentId]: j.activities }))
      setNewName(""); setAddOpen(null)
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed to add") } finally { setBusy(null) }
  }
  async function removeActivity(studentId: string, activityId: string) {
    setBusy(studentId); setErr(null)
    try {
      const res = await fetch("/api/teacher/activity", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId, studentId, activityId }) })
      const j = await res.json(); if (!res.ok) throw new Error(j.error ?? "Failed")
      setActs(a => ({ ...a, [studentId]: j.activities }))
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed to remove") } finally { setBusy(null) }
  }

  return (
    <>
      {err && <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}>{err}</div>}

      {/* Header */}
      <div className="card-float p-1.5 mb-5" style={{ borderRadius: 26 }}>
        <div className="relative rounded-[20px] p-6 sm:p-7" style={{ background: "linear-gradient(150deg, color-mix(in oklch, var(--c-indigo) 9%, var(--c-bg)), var(--c-bg) 60%)" }}>
          <div className="flex items-start gap-5">
            <span className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: "var(--c-indigo)", boxShadow: "var(--shadow-card)" }}><GraduationCap size={26} /></span>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="grid sm:grid-cols-[1.4fr_1fr_1fr] gap-2.5 max-w-xl">
                  <input className="input" value={nm} onChange={e => setNm(e.target.value)} placeholder="Class name" />
                  <input className="input" value={gr} onChange={e => setGr(e.target.value)} placeholder="Grade" />
                  <input className="input" value={yr} onChange={e => setYr(e.target.value)} placeholder="2025-2026" />
                </div>
              ) : (
                <>
                  <h1 className="text-[1.7rem] font-extrabold tracking-tight leading-none" style={{ color: "var(--c-text)", letterSpacing: "-0.03em" }}>{name}</h1>
                  <p className="text-sm mt-2" style={{ color: "var(--c-text-mid)" }}>
                    {[grade && `Grade ${grade}`, academicYear, `${students.length} student${students.length !== 1 ? "s" : ""}`].filter(Boolean).join(" · ")}
                  </p>
                  {teacherName && <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>Class teacher: {teacherName}</p>}
                </>
              )}
            </div>
            {canManage && (editing
              ? <div className="flex gap-2 shrink-0">
                  <button onClick={saveHeader} disabled={savingHdr} className="btn-primary h-10 px-4 gap-1.5">{savingHdr ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />} Save</button>
                  <button onClick={() => { setEditing(false); setNm(name); setGr(grade); setYr(academicYear) }} className="h-10 px-3 rounded-xl text-sm font-semibold" style={{ background: "var(--c-surface)", color: "var(--c-text-muted)" }}>Cancel</button>
                </div>
              : <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl shrink-0" style={{ background: "var(--c-surface)", color: "var(--c-indigo)" }}><Pencil size={14} /> Edit</button>)}
          </div>

          {canManage && !editing && (
            <div className="flex flex-wrap gap-2.5 mt-6 pt-6" style={{ borderTop: "1px solid var(--c-border)" }}>
              <Link href={`/teacher/attendance?class=${classId}`} className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white" style={{ background: "var(--c-indigo)", textDecoration: "none" }}><ClipboardCheck size={15} /> Take attendance</Link>
              <Link href="/teacher/homework" className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl" style={{ background: "var(--c-surface)", color: "var(--c-text)", textDecoration: "none" }}><BookOpen size={15} /> Set homework</Link>
            </div>
          )}
        </div>
      </div>

      {/* Roster */}
      <div className="flex items-center justify-between mb-3 px-1 gap-3">
        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>
          Students {canManage && <span className="normal-case font-medium" style={{ letterSpacing: 0 }}>· tap a student to add clubs, sports &amp; activities</span>}
        </h2>
        {canEnroll && (
          <button onClick={() => setAddPanel(p => p ? null : "existing")} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0" style={{ background: "var(--c-indigo)", color: "#fff" }}>
            <UserPlus size={13} /> Add students
          </button>
        )}
      </div>

      {/* Add-students panel */}
      {canEnroll && addPanel && (
        <div className="card-float p-4 mb-4">
          <div className="flex gap-2 mb-3">
            <button onClick={() => setAddPanel("existing")} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: addPanel === "existing" ? "var(--c-indigo-bg)" : "var(--c-surface)", color: addPanel === "existing" ? "var(--c-indigo)" : "var(--c-text-muted)" }}>Enrol existing</button>
            <button onClick={() => setAddPanel("new")} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background: addPanel === "new" ? "var(--c-indigo-bg)" : "var(--c-surface)", color: addPanel === "new" ? "var(--c-indigo)" : "var(--c-text-muted)" }}>New student</button>
            <button onClick={() => setAddPanel(null)} className="ml-auto opacity-60 hover:opacity-100" aria-label="Close"><X size={16} /></button>
          </div>

          {addPanel === "existing" && (
            availableStudents.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>Every student is already in this class. Use “New student” to add someone new.</p>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
                  <input className="input h-10 text-sm w-full pl-9" placeholder="Search students to add…" value={query} onChange={e => setQuery(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  {matches.length === 0 && <p className="text-xs px-1" style={{ color: "var(--c-text-muted)" }}>No matches.</p>}
                  {matches.map(s => (
                    <div key={s.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg" style={{ background: "var(--c-surface)" }}>
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: avatarColor(s.full_name) }}>{getInitials(s.full_name)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{s.full_name}</p>
                        <p className="text-xs truncate" style={{ color: "var(--c-text-muted)" }}>{s.admission_number}</p>
                      </div>
                      <button onClick={() => enrollExisting(s.id)} disabled={enrolling === s.id} className="btn-primary h-8 px-3 gap-1 text-xs disabled:opacity-50">
                        {enrolling === s.id ? <Loader2 size={12} className="animate-spin" /> : <Plus size={13} />} Enrol
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )
          )}

          {addPanel === "new" && (
            <form onSubmit={createAndEnroll} className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <input className="input h-10 text-sm w-full" placeholder="Full name *" value={newStu.full_name} onChange={e => setNewStu(p => ({ ...p, full_name: e.target.value }))} required />
                <input className="input h-10 text-sm w-full" placeholder="Admission no. *" value={newStu.admission_number} onChange={e => setNewStu(p => ({ ...p, admission_number: e.target.value }))} required />
                <select className="input h-10 text-sm w-full" value={newStu.gender} onChange={e => setNewStu(p => ({ ...p, gender: e.target.value }))} style={{ fontFamily: "inherit" }}>
                  <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                </select>
                <input type="date" className="input h-10 text-sm w-full" value={newStu.date_of_birth} onChange={e => setNewStu(p => ({ ...p, date_of_birth: e.target.value }))} />
              </div>
              <button type="submit" disabled={savingNew} className="btn-primary h-10 px-5 gap-2 disabled:opacity-50">
                {savingNew ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}{savingNew ? "Adding…" : "Add & enrol"}
              </button>
            </form>
          )}
        </div>
      )}

      {students.length === 0 ? (
        <div className="card-float px-5 py-10 text-center"><p className="text-sm" style={{ color: "var(--c-text-muted)" }}>No students enrolled in this class yet.</p></div>
      ) : (
        <div className="space-y-3">
          {students.map(stu => {
            const list = acts[stu.id] ?? []
            const isAdmin = !canManage
            const studentHref = isAdmin ? `/admin/students/${stu.id}` : undefined
            return (
              <div key={stu.id} className="card-float p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center text-white font-bold shrink-0" style={{ background: avatarColor(stu.full_name) }}>
                    {stu.photo_url ? <img src={stu.photo_url} alt={stu.full_name} className="w-full h-full object-cover" /> : getInitials(stu.full_name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    {studentHref
                      ? <Link href={studentHref} className="text-sm font-bold truncate hover:underline" style={{ color: "var(--c-text)", textDecoration: "none" }}>{stu.full_name}</Link>
                      : <p className="text-sm font-bold truncate" style={{ color: "var(--c-text)" }}>{stu.full_name}</p>}
                    <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{list.length} activit{list.length === 1 ? "y" : "ies"}</p>
                  </div>
                  {canManage && (
                    <button onClick={() => { setAddOpen(addOpen === stu.id ? null : stu.id); setNewName(""); setNewCat("club") }} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg shrink-0" style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}><Plus size={13} /> Add</button>
                  )}
                </div>

                {/* chips */}
                {(list.length > 0 || canManage) && (
                  <div className="flex flex-wrap gap-2 pl-14">
                    {list.length === 0 && <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>No activities yet.</span>}
                    {list.map(a => {
                      const tint = tintFor(a.category)
                      return (
                        <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full pl-3 pr-2 py-1.5" style={{ background: `color-mix(in oklch, ${tint} 12%, transparent)`, color: tint, fontSize: "0.8125rem", fontWeight: 600 }}>
                          <span className="rounded-full" style={{ width: 6, height: 6, background: tint }} /> {a.name}
                          {canManage && <button onClick={() => removeActivity(stu.id, a.id)} disabled={busy === stu.id} aria-label="Remove" className="ml-0.5 opacity-60 hover:opacity-100"><X size={13} /></button>}
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* add form */}
                {canManage && addOpen === stu.id && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 pl-14">
                    <input autoFocus className="input h-9 flex-1 min-w-[160px]" value={newName} placeholder="e.g. Science Club, Swimming" onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addActivity(stu.id)} />
                    <select className="input h-9" value={newCat} onChange={e => setNewCat(e.target.value)} style={{ fontFamily: "inherit" }}>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
                    <button onClick={() => addActivity(stu.id)} disabled={busy === stu.id || !newName.trim()} className="btn-primary h-9 px-3.5 gap-1">{busy === stu.id ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />} Add</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
