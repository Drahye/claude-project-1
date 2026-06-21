"use client"
import { useState } from "react"
import { Plus, X, Loader2, ShieldCheck, Crown, UserMinus, CheckCircle2, Mail } from "lucide-react"
import { avatarColor, getInitials } from "@/lib/utils"

interface AdminRow {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

interface Props {
  admins: AdminRow[]
  currentUserId: string
}

export default function TeamPanel({ admins: initial, currentUserId }: Props) {
  const [admins, setAdmins] = useState<AdminRow[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: "", email: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim() || !form.email.trim()) { setError("Name and email are required."); return }
    setSaving(true); setError(null); setNotice(null)
    try {
      const res = await fetch("/api/admin/invite-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to invite admin."); return }
      const newAdmin = data.admin as AdminRow
      setAdmins(prev => [...prev.filter(a => a.id !== newAdmin.id), newAdmin])
      setForm({ full_name: "", email: "" })
      setShowForm(false)
      setNotice(
        data.promoted ? "Existing member promoted to admin."
        : data.reactivated ? "Admin reactivated."
        : data.email_sent ? "Invite sent." + (data.email_sent ? "" : "")
        : "Admin added — share the invite link if no email arrived."
      )
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function manage(adminId: string, mode: "demote" | "remove") {
    const verb = mode === "demote" ? "Demote this admin to a teacher" : "Remove this admin"
    if (!confirm(`${verb}? They'll lose admin access immediately.`)) return
    setBusyId(adminId); setError(null); setNotice(null)
    try {
      const res = await fetch("/api/admin/invite-admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, mode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed."); return }
      setAdmins(prev => prev.filter(a => a.id !== adminId))
      setNotice(mode === "demote" ? "Admin demoted to teacher." : "Admin removed.")
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={() => setShowForm(v => !v)} className="btn-primary h-10 px-4 gap-2 text-sm">
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "Cancel" : "Invite admin"}
        </button>
        {notice && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} style={{ color: "var(--c-emerald)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--c-emerald)" }}>{notice}</span>
          </div>
        )}
      </div>

      {showForm && (
        <form onSubmit={invite} className="card p-6 space-y-4">
          <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Invite a co-admin</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                Full name <span style={{ color: "var(--c-red)" }}>*</span>
              </label>
              <input type="text" className="input h-10 text-sm w-full" placeholder="e.g. Jane Doe"
                value={form.full_name} onChange={e => { setForm(p => ({ ...p, full_name: e.target.value })); setError(null) }} required />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                Email <span style={{ color: "var(--c-red)" }}>*</span>
              </label>
              <input type="email" className="input h-10 text-sm w-full" placeholder="name@school.com"
                value={form.email} onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setError(null) }} required />
            </div>
          </div>
          {error && <p className="text-sm" style={{ color: "var(--c-red)" }}>{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary h-10 px-5 gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
            {saving ? "Sending…" : "Send invite"}
          </button>
        </form>
      )}

      {error && !showForm && <p className="text-sm" style={{ color: "var(--c-red)" }}>{error}</p>}

      <div className="space-y-2.5">
        {admins.map(a => {
          const isOwner = a.role === "super_admin"
          const isSelf = a.id === currentUserId
          return (
            <div key={a.id} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ background: avatarColor(a.full_name) }}>
                {getInitials(a.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{a.full_name}</p>
                  <span className="badge inline-flex items-center gap-1"
                    style={{ background: isOwner ? "var(--c-gold-bg, var(--c-surface))" : "var(--c-indigo-bg)", color: isOwner ? "var(--c-gold, var(--c-indigo))" : "var(--c-indigo)" }}>
                    {isOwner ? <Crown size={11} /> : <ShieldCheck size={11} />}
                    {isOwner ? "Owner" : "Admin"}
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: "var(--c-text-muted)" }}>{a.email}</p>
              </div>
              {!isOwner && !isSelf && (
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => manage(a.id, "demote")} disabled={busyId === a.id}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                    style={{ background: "var(--c-surface)", color: "var(--c-text-mid)" }}>
                    Demote
                  </button>
                  <button onClick={() => manage(a.id, "remove")} disabled={busyId === a.id}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                    style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}>
                    {busyId === a.id ? <Loader2 size={13} className="animate-spin" /> : <UserMinus size={13} />}
                    Remove
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
