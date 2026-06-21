"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Check, Loader2, HeartPulse, Sparkles, Upload, Trophy } from "lucide-react"
import type { StudentMedical, StudentPersonal, StudentActivity } from "@/types/database"

interface Props {
  childId: string
  firstName: string
  personal: StudentPersonal | null
  medical: StudentMedical | null
  activities: StudentActivity[] | null
}

const PERSONAL_FIELDS: { key: keyof StudentPersonal; label: string; long?: boolean; placeholder: string }[] = [
  { key: "hobbies", label: "Hobbies", placeholder: "e.g. Drawing, football, reading" },
  { key: "interests", label: "Interests", placeholder: "What they love" },
  { key: "languages", label: "Languages at home", placeholder: "e.g. English, Yoruba" },
  { key: "dietary", label: "Dietary needs", placeholder: "Allergies, restrictions, preferences" },
  { key: "about", label: "About", long: true, placeholder: `Anything the school should know about ${"your child"}` },
]
const MED_FIELDS: { key: keyof StudentMedical; label: string; long?: boolean; placeholder?: string }[] = [
  { key: "blood_group", label: "Blood group", placeholder: "e.g. O+" },
  { key: "allergies", label: "Allergies", placeholder: "e.g. Peanuts" },
  { key: "conditions", label: "Conditions", placeholder: "e.g. Asthma" },
  { key: "medications", label: "Medications", placeholder: "Current medications" },
  { key: "emergency_contact_name", label: "Emergency contact", placeholder: "Full name" },
  { key: "emergency_contact_phone", label: "Emergency phone", placeholder: "+1 555 000 0000" },
  { key: "doctor", label: "Doctor / clinic", placeholder: "Name & number" },
  { key: "notes", label: "Other notes", long: true, placeholder: "Anything staff should know" },
]

const ACTIVITY_TINT: Record<string, string> = {
  sport: "var(--c-emerald)", swimming: "var(--c-info)", club: "var(--c-indigo)",
  creative: "var(--c-gold)", music: "var(--c-red)", other: "var(--c-text-muted)",
}

export default function ChildEditor({ childId, firstName, personal, medical, activities }: Props) {
  const router = useRouter()
  const [err, setErr] = useState<string | null>(null)

  const [per, setPer] = useState<StudentPersonal>(personal ?? {})
  const [editPer, setEditPer] = useState(false)
  const [savingPer, setSP] = useState(false)

  const [med, setMed] = useState<StudentMedical>(medical ?? {})
  const [editMed, setEditMed] = useState(false)
  const [savingMed, setSM] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUp] = useState(false)

  async function patch(payload: Record<string, unknown>) {
    const res = await fetch("/api/parent/child", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ childId, ...payload }) })
    const j = await res.json(); if (!res.ok) throw new Error(j.error ?? "Save failed")
  }
  async function savePer() { setSP(true); setErr(null); try { await patch({ personal: per }); setEditPer(false); router.refresh() } catch (e) { setErr(e instanceof Error ? e.message : "Save failed") } finally { setSP(false) } }
  async function saveMed() { setSM(true); setErr(null); try { await patch({ medical: med }); setEditMed(false); router.refresh() } catch (e) { setErr(e instanceof Error ? e.message : "Save failed") } finally { setSM(false) } }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setUp(true); setErr(null)
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("type", "student"); fd.append("studentId", childId)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const j = await res.json(); if (!res.ok) throw new Error(j.error ?? "Upload failed")
      await patch({ photo_url: j.path ?? j.url }); router.refresh()
    } catch (e) { setErr(e instanceof Error ? e.message : "Upload failed") }
    finally { setUp(false); if (fileRef.current) fileRef.current.value = "" }
  }

  const lbl = "block text-xs font-semibold mb-1.5"
  const perFilled = PERSONAL_FIELDS.filter(f => (per[f.key] ?? "").toString().trim())
  const medFilled = MED_FIELDS.filter(f => (med[f.key] ?? "").toString().trim())
  const acts = activities ?? []

  function EditBtn({ on, onClick, saving }: { on: boolean; onClick: () => void; saving?: boolean }) {
    return on
      ? <button onClick={onClick} disabled={saving} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "var(--c-emerald)" }}>{saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />} Save</button>
      : <button onClick={onClick} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg" style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}><Pencil size={13} /> Edit</button>
  }

  return (
    <div className="space-y-5">
      {err && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}>{err}</div>}

      {/* About */}
      <div className="card-float p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--c-indigo-bg)" }}><Sparkles size={15} style={{ color: "var(--c-indigo)" }} /></span>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>About {firstName}</p>
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Help teachers know your child</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg" style={{ background: "var(--c-surface)", color: "var(--c-text-mid)" }}>{uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />} Photo</button>
            <EditBtn on={editPer} saving={savingPer} onClick={() => editPer ? savePer() : setEditPer(true)} />
          </div>
        </div>

        {editPer ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {PERSONAL_FIELDS.map(f => (
              <div key={f.key} className={f.long ? "sm:col-span-2" : ""}>
                <label className={lbl} style={{ color: "var(--c-text)" }}>{f.label}</label>
                {f.long
                  ? <textarea className="input" rows={2} value={per[f.key] ?? ""} placeholder={f.placeholder.replace("your child", firstName)} onChange={e => setPer(p => ({ ...p, [f.key]: e.target.value }))} style={{ resize: "vertical" }} />
                  : <input className="input" value={per[f.key] ?? ""} placeholder={f.placeholder} onChange={e => setPer(p => ({ ...p, [f.key]: e.target.value }))} />}
              </div>
            ))}
          </div>
        ) : perFilled.length === 0 ? (
          <div className="rounded-xl px-4 py-6 text-center" style={{ background: "var(--c-surface)" }}>
            <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>Add {firstName}&apos;s hobbies, interests &amp; dietary needs so teachers can support them better.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3.5">
            {perFilled.map(f => (
              <div key={f.key} className={f.long ? "sm:col-span-2" : ""}>
                <p className="text-xs mb-0.5" style={{ color: "var(--c-text-muted)" }}>{f.label}</p>
                <p className="text-sm font-medium" style={{ color: "var(--c-text)", whiteSpace: "pre-wrap" }}>{per[f.key]}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medical */}
      <div className="card-float p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--c-red-bg)" }}><HeartPulse size={15} style={{ color: "var(--c-red)" }} /></span>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Medical &amp; emergency</p>
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Shared with the school for safety</p>
            </div>
          </div>
          <EditBtn on={editMed} saving={savingMed} onClick={() => editMed ? saveMed() : setEditMed(true)} />
        </div>
        {editMed ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {MED_FIELDS.map(f => (
              <div key={f.key} className={f.long ? "sm:col-span-2" : ""}>
                <label className={lbl} style={{ color: "var(--c-text)" }}>{f.label}</label>
                {f.long
                  ? <textarea className="input" rows={2} value={med[f.key] ?? ""} placeholder={f.placeholder} onChange={e => setMed(m => ({ ...m, [f.key]: e.target.value }))} style={{ resize: "vertical" }} />
                  : <input className="input" value={med[f.key] ?? ""} placeholder={f.placeholder} onChange={e => setMed(m => ({ ...m, [f.key]: e.target.value }))} />}
              </div>
            ))}
          </div>
        ) : medFilled.length === 0 ? (
          <div className="rounded-xl px-4 py-6 text-center" style={{ background: "var(--c-surface)" }}>
            <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>Add allergies, conditions &amp; an emergency contact so the school can keep {firstName} safe.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3.5">
            {medFilled.map(f => (
              <div key={f.key} className={f.long ? "sm:col-span-2" : ""}>
                <p className="text-xs mb-0.5" style={{ color: "var(--c-text-muted)" }}>{f.label}</p>
                <p className="text-sm font-medium" style={{ color: "var(--c-text)", whiteSpace: "pre-wrap" }}>{med[f.key]}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activities (teacher-contributed, read-only for parent) */}
      <div className="card-float p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--c-gold-bg)" }}><Trophy size={15} style={{ color: "var(--c-gold)" }} /></span>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Activities &amp; clubs</p>
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Added by {firstName}&apos;s teachers</p>
          </div>
        </div>
        {acts.length === 0 ? (
          <div className="rounded-xl px-4 py-6 text-center" style={{ background: "var(--c-surface)" }}>
            <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>No activities recorded yet. Teachers will add clubs, sports &amp; achievements here.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {acts.map(a => {
              const tint = ACTIVITY_TINT[a.category] ?? "var(--c-indigo)"
              return (
                <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5" style={{ background: `color-mix(in oklch, ${tint} 12%, transparent)`, color: tint, fontSize: "0.8125rem", fontWeight: 600 }}>
                  <span className="rounded-full" style={{ width: 6, height: 6, background: tint }} /> {a.name}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
