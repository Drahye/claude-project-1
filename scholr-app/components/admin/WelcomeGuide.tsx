"use client"
import { useState, useEffect } from "react"
import {
  X, GraduationCap, UserPlus, BookCopy,
  CreditCard, Sparkles, ChevronRight, Copy, CheckCheck,
} from "lucide-react"
import Link from "next/link"

interface Props {
  userName: string
  userId: string
  schoolSlug: string
  hasTeachers: boolean
  hasStudents: boolean
  hasClasses: boolean
  plan: string
}

const STEPS = [
  {
    key: "teachers",
    icon: GraduationCap,
    title: "Invite your first teacher",
    description: "Share your invite code with teachers so they can create their accounts and join your school.",
    href: "/admin/teachers",
    color: "var(--c-indigo)",
    bg: "var(--c-indigo-bg)",
    doneWhen: (p: Props) => p.hasTeachers,
  },
  {
    key: "classes",
    icon: BookCopy,
    title: "Create your first class",
    description: "Set up a class (e.g. Year 4A), assign a teacher, and students will be enrolled from there.",
    href: "/admin/classes",
    color: "var(--c-gold)",
    bg: "var(--c-gold-bg)",
    doneWhen: (p: Props) => p.hasClasses,
  },
  {
    key: "students",
    icon: UserPlus,
    title: "Add your students",
    description: "Enrol students manually or in bulk. Each student gets a unique admission number.",
    href: "/admin/students",
    color: "var(--c-emerald)",
    bg: "var(--c-emerald-bg)",
    doneWhen: (p: Props) => p.hasStudents,
  },
  {
    key: "billing",
    icon: CreditCard,
    title: "Upgrade your plan",
    description: "You're on the Free plan. Upgrade for more students, AI reports, and priority support.",
    href: "/admin/billing",
    color: "var(--c-gold)",
    bg: "var(--c-gold-bg)",
    doneWhen: (p: Props) => p.plan !== "free",
  },
]

export default function AdminWelcomeGuide({ userName, userId, schoolSlug, hasTeachers, hasStudents, hasClasses, plan }: Props) {
  const [dismissed, setDismissed] = useState(true)
  const [copied, setCopied] = useState(false)
  const storageKey = `scholr_guide_dismissed_admin_${userId}`

  useEffect(() => {
    const isDismissed = localStorage.getItem(storageKey) === "true"
    setDismissed(isDismissed)
  }, [storageKey])

  function dismiss() {
    localStorage.setItem(storageKey, "true")
    setDismissed(true)
  }

  function copySlug() {
    navigator.clipboard.writeText(schoolSlug).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (dismissed) return null

  const props = { userName, userId, schoolSlug, hasTeachers, hasStudents, hasClasses, plan }
  const completedCount = STEPS.filter(s => s.doneWhen(props)).length
  const progress = Math.round((completedCount / STEPS.length) * 100)

  return (
    <div
      className="card-float p-5 relative"
      data-tour="welcome-guide"
      style={{
        background: "var(--c-bg)",
        border: "1px solid var(--c-hairline)",
        boxShadow: "var(--shadow-card)",
        animation: "fadeSlideIn 500ms cubic-bezier(0.23,1,0.32,1) both",
      }}
    >
      <button
        onClick={dismiss}
        className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
        style={{ background: "var(--c-bg)", color: "var(--c-text-muted)" }}
        title="Dismiss guide"
      >
        <X size={13} />
      </button>

      <div className="flex items-start gap-3 mb-4 pr-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}
        >
          <Sparkles size={16} />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight" style={{ color: "var(--c-text)" }}>
            Welcome, {userName.split(" ")[0]}! Your school is ready to configure.
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
            {completedCount} of {STEPS.length} steps done
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full h-1.5 rounded-full mb-4" style={{ background: "var(--c-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: "var(--c-indigo)" }}
        />
      </div>

      {/* Invite code callout */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl mb-4"
        style={{ background: "var(--c-indigo-bg)", border: "1px dashed var(--c-indigo)" }}
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold" style={{ color: "var(--c-indigo)" }}>Your school invite code</p>
          <p className="font-mono text-sm font-bold mt-0.5 truncate" style={{ color: "var(--c-text)" }}>{schoolSlug}</p>
        </div>
        <button
          onClick={copySlug}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-all duration-150"
          style={{
            background: copied ? "var(--c-emerald-bg)" : "var(--c-indigo)",
            color: copied ? "var(--c-emerald)" : "#fff",
          }}
        >
          {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {STEPS.map((step, i) => {
          const done = step.doneWhen(props)
          const Icon = step.icon
          return (
            <Link
              key={step.key}
              href={step.href}
              className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
              style={{
                background: "var(--c-surface)",
                opacity: done ? 0.5 : 1,
                border: "1px solid var(--c-border)",
                animation: `fadeSlideIn 400ms cubic-bezier(0.23,1,0.32,1) ${80 + i * 60}ms both`,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: done ? "var(--c-border)" : step.bg, color: done ? "var(--c-text-muted)" : step.color }}
              >
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>
                  {step.title}
                  {done && <span className="ml-2 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--c-emerald)" }}>Done</span>}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>{step.description}</p>
              </div>
              {!done && <ChevronRight size={13} style={{ color: "var(--c-text-muted)", flexShrink: 0 }} />}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
