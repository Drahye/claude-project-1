"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, X, BookOpen, UserPlus } from "lucide-react"
import { getInitials, avatarColor } from "@/lib/utils"
import EmptyState from "@/components/shared/EmptyState"

interface ClassOpt { id: string; name: string; grade_level: string }
interface ParentRow { id: string; full_name: string; email: string; is_primary: boolean }
interface ParentOpt { id: string; full_name: string; email: string }

interface Props {
  studentId:        string
  currentClassIds:  string[]
  classes:          ClassOpt[]
  linkedParents:    ParentRow[]
  availableParents: ParentOpt[]
}

export default function StudentManage({
  studentId, currentClassIds, classes, linkedParents, availableParents,
}: Props) {
  const router = useRouter()

  // ── Classes (a student can be in many) ──────────────────────────────────────
  const [enrolledIds, setEnrolledIds] = useState<string[]>(currentClassIds)
  const [classPicker, setClassPicker] = useState("")
  const [classBusy, setClassBusy]     = useState<string | null>(null)  // classId being added/removed
  const [classErr, setClassErr]       = useState<string | null>(null)

  const classById = new Map(classes.map(c => [c.id, c]))
  const enrolledClasses = enrolledIds.map(id => classById.get(id)).filter(Boolean) as ClassOpt[]
  const addableClasses  = classes.filter(c => !enrolledIds.includes(c.id))

  async function addClass(next: string) {
    if (!next) return
    setClassBusy(next); setClassErr(null)
    try {
      const res = await fetch("/api/admin/student-class", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, classId: next }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed")
      setEnrolledIds(prev => prev.includes(next) ? prev : [...prev, next])
      setClassPicker("")
      router.refresh()
    } catch (e: unknown) {
      setClassErr(e instanceof Error ? e.message : "Failed to add class")
    } finally {
      setClassBusy(null)
    }
  }

  async function removeClass(classId: string) {
    setClassBusy(classId); setClassErr(null)
    try {
      const res = await fetch("/api/admin/student-class", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, classId }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed")
      setEnrolledIds(prev => prev.filter(id => id !== classId))
      router.refresh()
    } catch (e: unknown) {
      setClassErr(e instanceof Error ? e.message : "Failed to remove class")
    } finally {
      setClassBusy(null)
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
      {/* ── Class enrolment (a student can be in many classes) ──────────── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>
          Classes
        </h2>
        <div className="card p-5 space-y-3">
          {classes.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
              No classes exist yet. Create a class first, then enrol this student.
            </p>
          ) : (
            <>
              {/* Enrolled chips */}
              {enrolledClasses.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>Not enrolled in any class yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {enrolledClasses.map(c => (
                    <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full pl-3 pr-2 py-1.5 text-sm font-semibold" style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}>
                      <BookOpen size={13} /> {c.name}
                      <button onClick={() => removeClass(c.id)} disabled={classBusy === c.id} aria-label={`Remove from ${c.name}`} className="ml-0.5 opacity-70 hover:opacity-100 disabled:opacity-40">
                        {classBusy === c.id ? <Loader2 size={13} className="animate-spin" /> : <X size={14} />}
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add to another class */}
              {addableClasses.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    className="input h-10 text-sm flex-1"
                    value={classPicker}
                    onChange={e => setClassPicker(e.target.value)}
                    style={{ fontFamily: "inherit" }}
                  >
                    <option value="">Add to a class…</option>
                    {addableClasses.map(c => (
                      <option key={c.id} value={c.id}>{c.name} — {c.grade_level}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => addClass(classPicker)}
                    disabled={!classPicker || classBusy === classPicker}
                    className="btn-primary h-10 px-4 gap-1.5 text-sm shrink-0 disabled:opacity-50"
                  >
                    {classBusy === classPicker ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Add
                  </button>
                </div>
              )}
            </>
          )}
          {classErr && <p className="text-xs" style={{ color: "var(--c-red)" }}>{classErr}</p>}
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
