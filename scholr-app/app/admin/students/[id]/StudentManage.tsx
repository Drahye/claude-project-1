"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, X, CheckCircle2, BookOpen, UserPlus } from "lucide-react"
import { getInitials, avatarColor } from "@/lib/utils"
import EmptyState from "@/components/shared/EmptyState"

interface ClassOpt { id: string; name: string; grade_level: string }
interface ParentRow { id: string; full_name: string; email: string; is_primary: boolean }
interface ParentOpt { id: string; full_name: string; email: string }

interface Props {
  studentId:        string
  currentClassId:   string | null
  classes:          ClassOpt[]
  linkedParents:    ParentRow[]
  availableParents: ParentOpt[]
}

export default function StudentManage({
  studentId, currentClassId, classes, linkedParents, availableParents,
}: Props) {
  const router = useRouter()

  // ── Class ──────────────────────────────────────────────────────────────────
  const [classId, setClassId]       = useState(currentClassId ?? "")
  const [savingClass, setSavingClass] = useState(false)
  const [classSaved, setClassSaved]   = useState(false)
  const [classErr, setClassErr]       = useState<string | null>(null)

  async function changeClass(next: string) {
    setClassId(next)
    setSavingClass(true); setClassErr(null); setClassSaved(false)
    try {
      const res = await fetch("/api/admin/student-class", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, classId: next || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed")
      setClassSaved(true)
      router.refresh()
      setTimeout(() => setClassSaved(false), 2500)
    } catch (e: unknown) {
      setClassErr(e instanceof Error ? e.message : "Failed to update class")
    } finally {
      setSavingClass(false)
    }
  }

  // ── Parents ──────────────────────────────────────────────────────────────────
  const [parents, setParents]   = useState<ParentRow[]>(linkedParents)
  const [picker, setPicker]     = useState("")
  const [linking, setLinking]   = useState(false)
  const [unlinking, setUnlinking] = useState<string | null>(null)
  const [parentErr, setParentErr] = useState<string | null>(null)

  const linkedIds = new Set(parents.map(p => p.id))
  const selectable = availableParents.filter(p => !linkedIds.has(p.id))

  async function linkParent() {
    if (!picker) return
    setLinking(true); setParentErr(null)
    try {
      const res = await fetch("/api/admin/student-parents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, parentId: picker, isPrimary: parents.length === 0 }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed")
      const added = availableParents.find(p => p.id === picker)!
      setParents(prev => [...prev, { ...added, is_primary: prev.length === 0 }])
      setPicker("")
      router.refresh()
    } catch (e: unknown) {
      setParentErr(e instanceof Error ? e.message : "Failed to link parent")
    } finally {
      setLinking(false)
    }
  }

  async function unlinkParent(parentId: string) {
    setUnlinking(parentId); setParentErr(null)
    try {
      const res = await fetch("/api/admin/student-parents", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, parentId }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed")
      setParents(prev => prev.filter(p => p.id !== parentId))
      router.refresh()
    } catch (e: unknown) {
      setParentErr(e instanceof Error ? e.message : "Failed to unlink parent")
    } finally {
      setUnlinking(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Class assignment ──────────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>
          Class
        </h2>
        <div className="card p-5">
          {classes.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
              No classes exist yet. Create a class first, then assign this student.
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--c-indigo-bg)" }}>
                <BookOpen size={16} style={{ color: "var(--c-indigo)" }} />
              </div>
              <select
                className="input h-10 text-sm flex-1"
                value={classId}
                disabled={savingClass}
                onChange={e => changeClass(e.target.value)}
                style={{ fontFamily: "inherit" }}
              >
                <option value="">Not enrolled</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.grade_level}</option>
                ))}
              </select>
              {savingClass && <Loader2 size={16} className="animate-spin shrink-0" style={{ color: "var(--c-indigo)" }} />}
              {classSaved && !savingClass && <CheckCircle2 size={16} className="shrink-0" style={{ color: "var(--c-emerald)" }} />}
            </div>
          )}
          {classErr && <p className="text-xs mt-2" style={{ color: "var(--c-red)" }}>{classErr}</p>}
        </div>
      </section>

      {/* ── Parents / guardians ───────────────────────────────────────── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>
          Parents &amp; guardians
        </h2>

        {/* Add picker */}
        <div className="card p-4 mb-3">
          {availableParents.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
              No parent accounts yet. Parents join with your school invite code and choose the &ldquo;Parent&rdquo; role.
            </p>
          ) : selectable.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
              All available parent accounts are already linked to this student.
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <select
                className="input h-10 text-sm flex-1"
                value={picker}
                onChange={e => setPicker(e.target.value)}
                style={{ fontFamily: "inherit" }}
              >
                <option value="">Select a parent to link…</option>
                {selectable.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name} · {p.email}</option>
                ))}
              </select>
              <button
                onClick={linkParent}
                disabled={!picker || linking}
                className="btn-primary h-10 px-4 gap-1.5 text-sm shrink-0 disabled:opacity-50"
              >
                {linking ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Link
              </button>
            </div>
          )}
          {parentErr && <p className="text-xs mt-2" style={{ color: "var(--c-red)" }}>{parentErr}</p>}
        </div>

        {/* Linked list */}
        {parents.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No parents linked"
            description="Link a parent account above so they can see this child and their class, attendance, and reports on their dashboard."
            compact
          />
        ) : (
          <div className="card divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
            {parents.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: avatarColor(p.full_name) }}>
                  {getInitials(p.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{p.full_name}</p>
                    {p.is_primary && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}>Primary</span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: "var(--c-text-muted)" }}>{p.email}</p>
                </div>
                <button
                  onClick={() => unlinkParent(p.id)}
                  disabled={unlinking === p.id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-[var(--c-red-bg)] disabled:opacity-50 shrink-0"
                  style={{ color: "var(--c-text-muted)" }}
                  title="Unlink parent"
                >
                  {unlinking === p.id ? <Loader2 size={14} className="animate-spin" /> : <X size={15} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
