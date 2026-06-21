"use client"
import { useState, useEffect } from "react"
import { X, UserPlus, BookOpen, MessageSquare, Bell, ChevronRight, Sparkles } from "lucide-react"
import Link from "next/link"

interface Props {
  userName: string
  userId: string
  hasChildren: boolean
  hasMessages: boolean
}

const STEPS = [
  {
    key: "children",
    icon: UserPlus,
    title: "Link your child's account",
    description: "Ask your school admin to connect your child's profile to your account.",
    href: "/parent/messages",
    cta: "Message admin",
    color: "var(--c-emerald)",
    bg: "var(--c-emerald-bg)",
    doneWhen: (p: Props) => p.hasChildren,
  },
  {
    key: "messages",
    icon: MessageSquare,
    title: "Introduce yourself to a teacher",
    description: "Send a quick message to stay in the loop with your child's progress.",
    href: "/parent/messages",
    cta: "Open messages",
    color: "var(--c-indigo)",
    bg: "var(--c-indigo-bg)",
    doneWhen: (p: Props) => p.hasMessages,
  },
  {
    key: "alerts",
    icon: Bell,
    title: "Check your notifications",
    description: "We'll send alerts here for absences, homework, and school announcements.",
    href: "/parent/alerts",
    cta: "View alerts",
    color: "var(--c-gold)",
    bg: "var(--c-gold-bg)",
    doneWhen: () => false,
  },
  {
    key: "reports",
    icon: BookOpen,
    title: "Read your first AI report",
    description: "Once your teacher generates a report, it will appear in your Reports tab.",
    href: "/parent/reports",
    cta: "Open reports",
    color: "var(--c-indigo)",
    bg: "var(--c-indigo-bg)",
    doneWhen: () => false,
  },
]

export default function ParentWelcomeGuide({ userName, userId, hasChildren, hasMessages }: Props) {
  const [dismissed, setDismissed] = useState(true) // default true = hidden until hydrated
  const storageKey = `scholr_guide_dismissed_parent_${userId}`

  useEffect(() => {
    const isDismissed = localStorage.getItem(storageKey) === "true"
    setDismissed(isDismissed)
  }, [storageKey])

  function dismiss() {
    localStorage.setItem(storageKey, "true")
    setDismissed(true)
  }

  if (dismissed) return null

  const props = { userName, userId, hasChildren, hasMessages }
  const completedCount = STEPS.filter(s => s.doneWhen(props)).length
  const progress = Math.round((completedCount / STEPS.length) * 100)

  return (
    <div
      className="card-float p-5 relative overflow-hidden"
      style={{ background: "var(--c-bg)", border: "1px solid var(--c-hairline)", boxShadow: "var(--shadow-card)" }}
    >
      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
        style={{ background: "var(--c-bg)", color: "var(--c-text-muted)" }}
        title="Dismiss guide"
      >
        <X size={13} />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-4 pr-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}
        >
          <Sparkles size={16} />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight" style={{ color: "var(--c-text)" }}>
            Welcome, {userName.split(" ")[0]}! Here&apos;s how to get started.
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
            {completedCount} of {STEPS.length} steps done
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full mb-4" style={{ background: "var(--c-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: "var(--c-indigo)" }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map(step => {
          const done = step.doneWhen(props)
          const Icon = step.icon
          return (
            <Link
              key={step.key}
              href={step.href}
              className="flex items-center gap-3 p-3 rounded-xl transition-all duration-150 hover:scale-[1.01]"
              style={{
                background: done ? "var(--c-bg)" : "var(--c-bg)",
                opacity: done ? 0.5 : 1,
                border: "1px solid var(--c-border)",
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
