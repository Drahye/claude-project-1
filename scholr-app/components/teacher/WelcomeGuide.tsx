"use client"
import { useState, useEffect } from "react"
import { X, Users, ClipboardCheck, BookOpen, Sparkles, Bot, ChevronRight } from "lucide-react"
import Link from "next/link"

interface Props {
  userName: string
  userId: string
  hasClasses: boolean
  hasTakenAttendance: boolean
  hasAssignedHomework: boolean
}

const STEPS = [
  {
    key: "classes",
    icon: Users,
    title: "Get assigned to a class",
    description: "Ask your admin to assign you to one or more classes so students appear in your roster.",
    href: "/teacher/attendance",
    cta: "View attendance",
    color: "var(--c-indigo)",
    bg: "var(--c-indigo-bg)",
    doneWhen: (p: Props) => p.hasClasses,
  },
  {
    key: "attendance",
    icon: ClipboardCheck,
    title: "Take your first attendance",
    description: "Mark students present or absent in under a minute. Parents are notified automatically.",
    href: "/teacher/attendance",
    cta: "Take attendance",
    color: "var(--c-emerald)",
    bg: "var(--c-emerald-bg)",
    doneWhen: (p: Props) => p.hasTakenAttendance,
  },
  {
    key: "homework",
    icon: BookOpen,
    title: "Assign your first homework",
    description: "Set a homework task with a due date. Track which students have submitted.",
    href: "/teacher/homework",
    cta: "Assign homework",
    color: "var(--c-gold)",
    bg: "var(--c-gold-bg)",
    doneWhen: (p: Props) => p.hasAssignedHomework,
  },
  {
    key: "ai",
    icon: Bot,
    title: "Generate an AI weekly report",
    description: "Our AI analyses attendance and homework data to write a personalised weekly report for each student.",
    href: "/teacher/ai",
    cta: "Try AI reports",
    color: "var(--c-indigo)",
    bg: "var(--c-indigo-bg)",
    doneWhen: () => false,
  },
]

export default function TeacherWelcomeGuide({ userName, userId, hasClasses, hasTakenAttendance, hasAssignedHomework }: Props) {
  const [dismissed, setDismissed] = useState(true)
  const storageKey = `scholr_guide_dismissed_teacher_${userId}`

  useEffect(() => {
    const isDismissed = localStorage.getItem(storageKey) === "true"
    setDismissed(isDismissed)
  }, [storageKey])

  function dismiss() {
    localStorage.setItem(storageKey, "true")
    setDismissed(true)
  }

  if (dismissed) return null

  const props = { userName, userId, hasClasses, hasTakenAttendance, hasAssignedHomework }
  const completedCount = STEPS.filter(s => s.doneWhen(props)).length
  const progress = Math.round((completedCount / STEPS.length) * 100)

  return (
    <div
      className="card-float p-5 relative overflow-hidden"
      style={{ background: "var(--c-bg)", border: "1px solid var(--c-hairline)", boxShadow: "var(--shadow-card)" }}
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
            Welcome, {userName.split(" ")[0]}! Let&apos;s set up your classroom.
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
            {completedCount} of {STEPS.length} steps done
          </p>
        </div>
      </div>

      <div className="w-full h-1.5 rounded-full mb-4" style={{ background: "var(--c-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: "var(--c-indigo)" }}
        />
      </div>

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
                background: "var(--c-surface)",
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
