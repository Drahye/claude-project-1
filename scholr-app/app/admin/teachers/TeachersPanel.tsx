"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, X, Loader2, Users, CheckCircle2, Pencil, Trash2, Check, Link as LinkIcon } from "lucide-react"
import { getInitials, avatarColor, formatDate } from "@/lib/utils"
import EmptyState from "@/components/shared/EmptyState"

interface Teacher {
  id: string
  full_name: string
  email: string
  phone: string | null
  is_active: boolean
  created_at: string
  classes: Array<{ name: string; grade_level: string }>
}

interface Props {
  teachers: Teacher[]
  schoolId: string
}

export default function TeachersPanel({ teachers: initial, schoolId }: Props) {
  const router = useRouter()
  const [teachers, setTeachers] = useState<Teacher[]>(initial)
  const [query, setQuery]       = useState("")

  // edit / remove
  const [editId, setEditId]   = useState<string | null>(null)
  const [editName, setEN]     = useState("")
  const [editPhone, setEP]    = useState("")
  const [rowBusy, setRowBusy] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [rowErr, setRowErr]   = useState<string | null>(null)

  function startEdit(t: Teacher) { setEditId(t.id); setEN(t.full_name); setEP(t.phone ?? ""); setConfirmId(null); setRowErr(null) }

  async function saveEdit(id: string) {
    setRowBusy(id); setRowErr(null)
    try {
      const res = await fetch("/api/admin/teacher", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacherId: id, full_name: editName, phone: editPhone }) })
      const j = await res.json(); if (!res.ok) throw new Error(j.error ?? "Save failed")
      setTeachers(ts => ts.map(t => t.id === id ? { ...t, full_name: editName.trim(), phone: editPhone.trim() || null } : t))
      setEditId(null); router.refresh()
    } catch (e) { setRowErr(e instanceof Error ? e.message : "Save failed") } finally { setRowBusy(null) }
  }

  async function removeTeacher(id: string) {
    setRowBusy(id); setRowErr(null)
    try {
      const res = await fetch("/api/admin/teacher", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacherId: id }) })
      const j = await res.json(); if (!res.ok) throw new Error(j.error ?? "Remove failed")
      setTeachers(ts => ts.filter(t => t.id !== id))   // drop from the roster
      setConfirmId(null); router.refresh()
    } catch (e) { setRowErr(e instanceof Error ? e.message : "Remove failed") } finally { setRowBusy(null) }
  }
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [emailSkipped, setEmailSkipped] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [form, setForm]         = useState({ full_name: "", email: "" })

  function copyInvite() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
  }

  const filtered = teachers.filter(t =>
    t.full_name.toLowerCase().includes(query.toLowerCase()) ||
    t.email.toLowerCase().includes(query.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim() || !form.email.trim()) {
      setError("Please fill in all required fields.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/invite-teacher", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          full_name: form.full_name.trim(),
          email:     form.email.trim(),
          school_id: schoolId,
        }),
      })

      const body = await res.json()

      if (!res.ok) {
        setError(body.error ?? "Failed to invite teacher.")
      } else {
        setTeachers(prev => [body.teacher, ...prev])
        setShowForm(false)
        setSaved(true)
        setEmailSkipped(!body.email_sent)
        setInviteLink(body.invite_link ?? null)
        setForm({ full_name: "", email: "" })
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSaving(false)
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
            placeholder="Search teachers…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input h-10 pl-9 text-sm w-full"
          />
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary h-10 px-4 gap-2 text-sm">
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Invite teacher"}
        </button>
      </div>

      {/* Result banner */}
      {saved && (
        <div className="card-float p-4 flex flex-wrap items-center gap-3" style={{ background: emailSkipped ? "var(--c-gold-bg)" : "var(--c-emerald-bg)" }}>
          <CheckCircle2 size={18} style={{ color: emailSkipped ? "var(--c-gold)" : "var(--c-emerald)", flexShrink: 0 }} />
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>
              {emailSkipped ? "Teacher added — but the invite email didn't send" : "Teacher added & invite email sent"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text-mid)" }}>
              {emailSkipped
                ? "Email delivery failed (often Brevo's IP authorization). Copy the invite link below and send it to them yourself — it takes them to set up their account."
                : "They'll get an email to set their password and log in."}
            </p>
          </div>
          {inviteLink && (
            <button onClick={copyInvite} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg shrink-0" style={{ background: copied ? "var(--c-emerald)" : "var(--c-bg)", color: copied ? "#fff" : "var(--c-indigo)", border: "1px solid var(--c-border)" }}>
              {copied ? <Check size={14} /> : <LinkIcon size={14} />} {copied ? "Copied!" : "Copy invite link"}
            </button>
          )}
          <button onClick={() => { setSaved(false); setEmailSkipped(false); setInviteLink(null) }} aria-label="Dismiss" className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ color: "var(--c-text-muted)" }}><X size={14} /></button>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Invite teacher</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                Full name <span style={{ color: "var(--c-red)" }}>*</span>
              </label>
              <input
                type="text"
                className="input h-10 text-sm w-full"
                placeholder="Teacher's full name"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                Email address <span style={{ color: "var(--c-red)" }}>*</span>
              </label>
              <input
                type="email"
                className="input h-10 text-sm w-full"
                placeholder="teacher@school.edu"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
          </div>
          {error && <p className="text-sm" style={{ color: "var(--c-red)" }}>{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary h-10 px-5 gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
            {saving ? "Adding…" : "Add teacher"}
          </button>
        </form>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={query ? Search : Users}
          title={query ? "No teachers match your search" : "No teachers yet"}
          description={query
            ? "Try a different name or email."
            : "Invite your first teacher — they'll get an email to set up their account and join your school."}
          accent="var(--c-emerald)"
          action={query ? undefined : { label: "Invite teacher", onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div
            className="hidden sm:grid grid-cols-[2fr_2fr_1fr_80px_72px] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--c-text-muted)", borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)" }}
          >
            <span>Teacher</span>
            <span>Classes</span>
            <span>Joined</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
            {filtered.map(t => (
              <div key={t.id}>
                <div className="flex sm:grid sm:grid-cols-[2fr_2fr_1fr_80px_72px] gap-4 items-center px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: avatarColor(t.full_name) }}>
                      {getInitials(t.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{t.full_name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--c-text-muted)" }}>{t.email}</p>
                    </div>
                  </div>
                  <p className="text-sm hidden sm:block" style={{ color: "var(--c-text-mid)" }}>
                    {t.classes.length > 0 ? t.classes.map(c => c.name).join(", ") : "—"}
                  </p>
                  <p className="text-sm hidden sm:block" style={{ color: "var(--c-text-muted)" }}>{formatDate(t.created_at)}</p>
                  <div>
                    <span className="badge" style={{ background: t.is_active ? "var(--c-emerald-bg)" : "var(--c-red-bg)", color: t.is_active ? "var(--c-emerald)" : "var(--c-red)" }}>
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => editId === t.id ? setEditId(null) : startEdit(t)} aria-label="Edit teacher"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80" style={{ color: "var(--c-text-muted)" }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => { setConfirmId(t.id); setEditId(null) }} aria-label="Remove teacher"
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-80" style={{ color: "var(--c-red)" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Inline edit */}
                {editId === t.id && (
                  <div className="px-5 pb-4 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end" style={{ background: "var(--c-surface)" }}>
                    <div><label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>Full name</label><input className="input" value={editName} onChange={e => setEN(e.target.value)} /></div>
                    <div><label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>Phone</label><input className="input" value={editPhone} onChange={e => setEP(e.target.value)} placeholder="+1 555 000 0000" /></div>
                    <button onClick={() => saveEdit(t.id)} disabled={rowBusy === t.id} className="btn-primary h-10 px-4 gap-1.5">{rowBusy === t.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />} Save</button>
                  </div>
                )}

                {/* Inline remove confirm */}
                {confirmId === t.id && (
                  <div className="px-5 pb-4 flex items-center justify-between gap-3" style={{ background: "var(--c-red-bg)" }}>
                    <p className="text-sm font-semibold py-2" style={{ color: "var(--c-text)" }}>Remove {t.full_name}? They&apos;ll be deactivated &amp; unassigned from classes.</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setConfirmId(null)} className="text-sm font-semibold px-3 py-2 rounded-lg" style={{ background: "var(--c-bg)", color: "var(--c-text-muted)" }}>Cancel</button>
                      <button onClick={() => removeTeacher(t.id)} disabled={rowBusy === t.id} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg text-white" style={{ background: "var(--c-red)" }}>{rowBusy === t.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Remove</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {rowErr && <p className="px-5 py-3 text-sm" style={{ color: "var(--c-red)" }}>{rowErr}</p>}
        </div>
      )}
    </div>
  )
}
