"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Check, Loader2, HeartPulse } from "lucide-react"
import type { StudentMedical } from "@/types/database"

interface Props {
  studentId: string
  medical: StudentMedical | null
}

const MED_FIELDS: { key: keyof StudentMedical; label: string; long?: boolean; placeholder?: string }[] = [
  { key: "blood_group", label: "Blood group", placeholder: "e.g. O+" },
  { key: "allergies", label: "Allergies", placeholder: "e.g. Peanuts, penicillin" },
  { key: "conditions", label: "Medical conditions", placeholder: "e.g. Asthma" },
  { key: "medications", label: "Medications", placeholder: "Current medications" },
  { key: "emergency_contact_name", label: "Emergency contact", placeholder: "Full name" },
  { key: "emergency_contact_phone", label: "Emergency phone", placeholder: "+1 555 000 0000" },
  { key: "doctor", label: "Doctor / clinic", placeholder: "Name & number" },
  { key: "notes", label: "Other notes", long: true, placeholder: "Anything staff should know" },
]

export default function StudentEditor({ studentId, medical }: Props) {
  const router = useRouter()
  const [med, setMed] = useState<StudentMedical>(medical ?? {})
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function save() {
    setSaving(true); setErr(null)
    try {
      const res = await fetch("/api/admin/student", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, medical: med }) })
      const j = await res.json(); if (!res.ok) throw new Error(j.error ?? "Save failed")
      setEditing(false); router.refresh()
    } catch (e) { setErr(e instanceof Error ? e.message : "Save failed") } finally { setSaving(false) }
  }

  const filled = MED_FIELDS.filter(f => (med[f.key] ?? "").toString().trim())
  const lbl = "block text-xs font-semibold mb-1.5"

  return (
    <div className="card-float p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--c-red-bg)" }}><HeartPulse size={15} style={{ color: "var(--c-red)" }} /></span>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Medical &amp; emergency</p>
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Visible to staff &amp; parents</p>
          </div>
        </div>
        {!editing
          ? <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors" style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}><Pencil size={13} /> Edit</button>
          : <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "var(--c-emerald)" }}>{saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />} Save</button>}
      </div>

      {err && <p className="text-sm mb-3" style={{ color: "var(--c-red)" }}>{err}</p>}

      {editing ? (
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
      ) : filled.length === 0 ? (
        <div className="rounded-xl px-4 py-6 text-center" style={{ background: "var(--c-surface)" }}>
          <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>No medical info yet. Add allergies, conditions &amp; an emergency contact.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3.5">
          {filled.map(f => (
            <div key={f.key} className={f.long ? "sm:col-span-2" : ""}>
              <p className="text-xs mb-0.5" style={{ color: "var(--c-text-muted)" }}>{f.label}</p>
              <p className="text-sm font-medium" style={{ color: "var(--c-text)", whiteSpace: "pre-wrap" }}>{med[f.key]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
