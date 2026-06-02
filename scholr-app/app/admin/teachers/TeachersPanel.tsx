"use client"
import { useState } from "react"
import { Plus, Search, X, Loader2, Users, CheckCircle2 } from "lucide-react"
import { getInitials, avatarColor, formatDate } from "@/lib/utils"
import EmptyState from "@/components/shared/EmptyState"

interface Teacher {
  id: string
  full_name: string
  email: string
  is_active: boolean
  created_at: string
  classes: Array<{ name: string; grade_level: string }>
}

interface Props {
  teachers: Teacher[]
  schoolId: string
}

export default function TeachersPanel({ teachers: initial, schoolId }: Props) {
  const [teachers, setTeachers] = useState<Teacher[]>(initial)
  const [query, setQuery]       = useState("")
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [emailSkipped, setEmailSkipped] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [form, setForm]         = useState({ full_name: "", email: "" })

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
        setForm({ full_name: "", email: "" })
        setTimeout(() => { setSaved(false); setEmailSkipped(false) }, 6000)
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
        {saved && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} style={{ color: emailSkipped ? "var(--c-gold)" : "var(--c-emerald)" }} />
            <span className="text-sm font-semibold" style={{ color: emailSkipped ? "var(--c-gold)" : "var(--c-emerald)" }}>
              {emailSkipped
                ? "Teacher added — invite email skipped (rate limit)"
                : "Teacher added & invite sent"}
            </span>
          </div>
        )}
      </div>

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
            className="hidden sm:grid grid-cols-[2fr_2fr_1fr_80px] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--c-text-muted)", borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)" }}
          >
            <span>Teacher</span>
            <span>Classes</span>
            <span>Joined</span>
            <span>Status</span>
          </div>
          <div className="divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
            {filtered.map(t => (
              <div key={t.id} className="flex sm:grid sm:grid-cols-[2fr_2fr_1fr_80px] gap-4 items-center px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: avatarColor(t.full_name) }}
                  >
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
                <p className="text-sm hidden sm:block" style={{ color: "var(--c-text-muted)" }}>
                  {formatDate(t.created_at)}
                </p>
                <div className="ml-auto sm:ml-0">
                  <span
                    className="badge"
                    style={{
                      background: t.is_active ? "var(--c-emerald-bg)" : "var(--c-red-bg)",
                      color: t.is_active ? "var(--c-emerald)" : "var(--c-red)",
                    }}
                  >
                    {t.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
