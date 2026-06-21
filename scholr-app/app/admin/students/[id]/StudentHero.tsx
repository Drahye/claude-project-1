"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal, Pencil, Trash2, Upload, Loader2, Check,
  Hash, Calendar, User, GraduationCap, AlertTriangle,
} from "lucide-react"
import { avatarColor, getInitials, formatDate } from "@/lib/utils"

interface Props {
  student: {
    id: string
    full_name: string
    admission_number: string
    date_of_birth: string | null
    gender: string
    photo_url: string | null   // signed display URL
    is_active: boolean
  }
  className: string | null
  grade: string | null
  teacherName: string | null
}

const EASE = "cubic-bezier(0.32,0.72,0,1)"

export default function StudentHero({ student, className, grade, teacherName }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing]   = useState(false)
  const [confirm, setConfirm]   = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [name, setName]   = useState(student.full_name)
  const [adm, setAdm]     = useState(student.admission_number)
  const [dob, setDob]     = useState(student.date_of_birth ?? "")
  const [gender, setGen]  = useState(student.gender || "male")
  const [active, setActive] = useState(student.is_active)
  const [saving, setSaving] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUp] = useState(false)
  const [removing, setRem] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    const onDoc = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false) }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [menuOpen])

  async function patch(payload: Record<string, unknown>) {
    const res = await fetch("/api/admin/student", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: student.id, ...payload }) })
    const j = await res.json(); if (!res.ok) throw new Error(j.error ?? "Save failed")
  }
  async function saveCore() {
    if (!name.trim()) { setErr("Name is required."); return }
    setSaving(true); setErr(null)
    try { await patch({ full_name: name, admission_number: adm, date_of_birth: dob, gender, is_active: active }); setEditing(false); router.refresh() }
    catch (e) { setErr(e instanceof Error ? e.message : "Save failed") } finally { setSaving(false) }
  }
  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUp(true); setErr(null)
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("type", "student"); fd.append("studentId", student.id)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const j = await res.json(); if (!res.ok) throw new Error(j.error ?? "Upload failed")
      await patch({ photo_url: j.path ?? j.url }); router.refresh()
    } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed") }
    finally { setUp(false); if (fileRef.current) fileRef.current.value = "" }
  }
  async function remove() {
    setRem(true); setErr(null)
    try {
      const res = await fetch("/api/admin/student", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: student.id }) })
      const j = await res.json(); if (!res.ok) throw new Error(j.error ?? "Remove failed")
      router.push("/admin/students"); router.refresh()
    } catch (e) { setErr(e instanceof Error ? e.message : "Remove failed"); setRem(false) }
  }

  const lbl = "block text-xs font-semibold mb-1.5"
  const meta = [
    { icon: Hash, label: "Admission", value: student.admission_number },
    { icon: Calendar, label: "Date of birth", value: student.date_of_birth ? formatDate(student.date_of_birth) : "—" },
    { icon: User, label: "Gender", value: student.gender ? student.gender[0].toUpperCase() + student.gender.slice(1) : "—" },
    { icon: GraduationCap, label: "Class teacher", value: teacherName ?? "—" },
  ]

  return (
    <div className="card-float p-1.5 mb-5" style={{ borderRadius: 26 }}>
      <div className="relative rounded-[20px] overflow-hidden p-6 sm:p-7"
        style={{ background: "linear-gradient(150deg, color-mix(in oklch, var(--c-indigo) 9%, var(--c-bg)), var(--c-bg) 60%)" }}>
        {/* soft glow */}
        <div aria-hidden className="absolute pointer-events-none" style={{ top: -80, right: -60, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in oklch, var(--c-indigo) 22%, transparent), transparent 70%)", filter: "blur(8px)" }} />

        <div className="relative flex items-start gap-5">
          {/* Photo */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center text-white text-3xl font-extrabold"
              style={{ background: avatarColor(student.full_name), boxShadow: "var(--shadow-card)" }}>
              {student.photo_url
                ? <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                : getInitials(student.full_name)}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Change photo"
              className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform active:scale-90"
              style={{ background: "var(--c-indigo)", boxShadow: "0 6px 16px color-mix(in oklch, var(--c-indigo) 45%, transparent)", border: "2px solid var(--c-bg)" }}>
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={14} />}
            </button>
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: student.is_active ? "var(--c-emerald-bg)" : "var(--c-red-bg)", color: student.is_active ? "var(--c-emerald)" : "var(--c-red)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                <span className="rounded-full" style={{ width: 5, height: 5, background: "currentColor" }} /> {student.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <h1 className="text-[1.7rem] font-extrabold tracking-tight leading-none truncate" style={{ color: "var(--c-text)", letterSpacing: "-0.03em" }}>{student.full_name}</h1>
            <p className="text-sm mt-2" style={{ color: "var(--c-text-mid)" }}>{className ? `${className}${grade ? ` · ${grade}` : ""}` : "Not enrolled in a class"}</p>
          </div>

          {/* Overflow menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button onClick={() => setMenuOpen(o => !o)} aria-label="Student actions"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: menuOpen ? "var(--c-surface)" : "transparent", color: "var(--c-text-muted)", border: "1px solid var(--c-border)" }}>
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden z-20"
                style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", boxShadow: "var(--shadow-card)", transformOrigin: "top right", animation: `menuIn 180ms ${EASE}` }}>
                <button onClick={() => { setEditing(true); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left transition-colors hover:bg-[var(--c-surface)]" style={{ color: "var(--c-text)" }}>
                  <Pencil size={15} style={{ color: "var(--c-text-muted)" }} /> Edit details
                </button>
                <div style={{ height: 1, background: "var(--c-border)" }} />
                <button onClick={() => { setConfirm(true); setMenuOpen(false) }} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left transition-colors hover:bg-[var(--c-red-bg)]" style={{ color: "var(--c-red)" }}>
                  <Trash2 size={15} /> Remove student
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Meta row */}
        {!editing && (
          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6" style={{ borderTop: "1px solid var(--c-border)" }}>
            {meta.map(m => (
              <div key={m.label}>
                <div className="flex items-center gap-1.5 mb-1"><m.icon size={12} style={{ color: "var(--c-text-muted)" }} /><p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{m.label}</p></div>
                <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{m.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Inline edit */}
        {editing && (
          <div className="relative mt-6 pt-6" style={{ borderTop: "1px solid var(--c-border)" }}>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><label className={lbl} style={{ color: "var(--c-text)" }}>Full name</label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
              <div><label className={lbl} style={{ color: "var(--c-text)" }}>Admission number</label><input className="input" value={adm} onChange={e => setAdm(e.target.value)} /></div>
              <div><label className={lbl} style={{ color: "var(--c-text)" }}>Date of birth</label><input className="input" type="date" value={dob} onChange={e => setDob(e.target.value)} /></div>
              <div><label className={lbl} style={{ color: "var(--c-text)" }}>Gender</label>
                <select className="input w-full" value={gender} onChange={e => setGen(e.target.value)} style={{ fontFamily: "inherit" }}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select>
              </div>
              <div><label className={lbl} style={{ color: "var(--c-text)" }}>Status</label>
                <button type="button" onClick={() => setActive(v => !v)} className="input w-full text-left flex items-center justify-between" style={{ cursor: "pointer" }}>
                  <span style={{ color: active ? "var(--c-emerald)" : "var(--c-red)", fontWeight: 600 }}>{active ? "Active" : "Inactive"}</span>
                  <span className="relative rounded-full" style={{ width: 36, height: 20, background: active ? "var(--c-emerald)" : "var(--c-border)", transition: `background 200ms ${EASE}` }}><span className="absolute top-0.5 rounded-full bg-white" style={{ width: 16, height: 16, left: active ? 18 : 2, transition: `left 200ms ${EASE}` }} /></span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <button onClick={saveCore} disabled={saving} className="btn-primary h-10 px-5 gap-1.5">{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />} Save changes</button>
              <button onClick={() => { setEditing(false); setName(student.full_name); setAdm(student.admission_number); setDob(student.date_of_birth ?? ""); setGen(student.gender); setActive(student.is_active) }} className="h-10 px-4 rounded-xl text-sm font-semibold" style={{ background: "var(--c-surface)", color: "var(--c-text-muted)" }}>Cancel</button>
            </div>
          </div>
        )}

        {err && <p className="relative mt-3 text-sm" style={{ color: "var(--c-red)" }}>{err}</p>}
      </div>

      {/* Remove confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "color-mix(in oklch, var(--c-text) 30%, transparent)", animation: `fadeIn 160ms ease-out` }} onClick={() => !removing && setConfirm(false)}>
          <div className="w-full max-w-sm rounded-3xl p-6 text-center" style={{ background: "var(--c-bg)", boxShadow: "var(--shadow-card)", transformOrigin: "center", animation: `modalIn 220ms ${EASE}` }} onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--c-red-bg)" }}><AlertTriangle size={24} style={{ color: "var(--c-red)" }} /></div>
            <h3 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.02em" }}>Remove {student.full_name.split(" ")[0]}?</h3>
            <p className="text-sm mt-1.5 mb-6" style={{ color: "var(--c-text-muted)", lineHeight: 1.6 }}>This removes the student and clears their class &amp; parent links. This can&apos;t be undone.</p>
            <div className="flex gap-2.5">
              <button onClick={() => setConfirm(false)} disabled={removing} className="flex-1 h-11 rounded-xl text-sm font-semibold" style={{ background: "var(--c-surface)", color: "var(--c-text)" }}>Cancel</button>
              <button onClick={remove} disabled={removing} className="flex-1 h-11 rounded-xl text-sm font-bold text-white inline-flex items-center justify-center gap-1.5" style={{ background: "var(--c-red)" }}>{removing ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Remove</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes menuIn { from { opacity:0; transform: scale(0.96) translateY(-4px) } to { opacity:1; transform: scale(1) translateY(0) } }
        @keyframes modalIn { from { opacity:0; transform: scale(0.95) } to { opacity:1; transform: scale(1) } }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
      `}</style>
    </div>
  )
}
