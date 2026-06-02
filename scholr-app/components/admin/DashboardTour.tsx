"use client"
import { useState, useEffect, useCallback } from "react"
import {
  X, ArrowRight, Sparkles, ChevronLeft, GraduationCap,
  BarChart3, Users, Zap, BookOpen, Heart,
} from "lucide-react"

/* ── Tour steps ──────────────────────────────────────────────── */
interface TourStep {
  target: string
  title: string
  body: string
  icon: React.ElementType
  placement?: "bottom" | "top" | "left" | "right"
}

const STEPS: TourStep[] = [
  {
    target: "health-card",
    icon: Heart,
    title: "School health score",
    body: "A single number (0–100) blending attendance, homework completion, and teacher–student ratio. Green means your school is thriving.",
    placement: "bottom",
  },
  {
    target: "stat-cards",
    icon: BarChart3,
    title: "Live overview",
    body: "Students, teachers, classes, and parents — updated in real time. Click any card to manage that group directly.",
    placement: "bottom",
  },
  {
    target: "quick-actions",
    icon: Zap,
    title: "Quick actions",
    body: "The most common admin tasks are one click away. Add a student, invite a teacher, or create a class without hunting through menus.",
    placement: "top",
  },
  {
    target: "recent-members",
    icon: Users,
    title: "Recent activity",
    body: "The latest people to join your school appear here. Spot pending accounts or recently added staff at a glance.",
    placement: "top",
  },
  {
    target: "ai-reports",
    icon: Sparkles,
    title: "AI-powered reports",
    body: "Every Friday, teachers can use Claude AI to generate warm, personalised weekly reports for every parent. Zero writing time.",
    placement: "top",
  },
]

/* ── Welcome modal steps ────────────────────────────────────── */
const WELCOME_FEATURES = [
  { icon: GraduationCap, label: "Manage students & classes",  color: "var(--c-indigo)"  },
  { icon: BookOpen,       label: "Track homework & attendance", color: "var(--c-emerald)" },
  { icon: Sparkles,       label: "AI-generated parent reports", color: "var(--c-gold)"   },
]

interface Rect { top: number; left: number; width: number; height: number }

export default function DashboardTour({
  userId,
  userName,
}: { userId: string; userName: string }) {
  const storageKey = `scholr_tour_done_${userId}`

  const [showWelcome, setShowWelcome] = useState(false)
  const [active, setActive]           = useState(false)
  const [step, setStep]               = useState(0)
  const [rect, setRect]               = useState<Rect | null>(null)
  const [showBeacon, setBeacon]       = useState(false)

  /* Show welcome modal on first visit */
  useEffect(() => {
    const done = localStorage.getItem(storageKey)
    if (!done) {
      const t = setTimeout(() => setShowWelcome(true), 900)
      return () => clearTimeout(t)
    }
  }, [storageKey])

  const measureTarget = useCallback((stepIndex: number) => {
    const target = STEPS[stepIndex]?.target
    if (!target) return
    const el = document.querySelector(`[data-tour="${target}"]`)
    if (!el) return
    const r = el.getBoundingClientRect()
    setRect({ top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height })
    el.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [])

  const startTour = useCallback(() => {
    setShowWelcome(false)
    setBeacon(false)
    setStep(0)
    setActive(true)
    setTimeout(() => measureTarget(0), 150)
  }, [measureTarget])

  const skipAll = useCallback(() => {
    setShowWelcome(false)
    setBeacon(false)
    localStorage.setItem(storageKey, "true")
  }, [storageKey])

  const next = useCallback(() => {
    const nextStep = step + 1
    if (nextStep >= STEPS.length) {
      setActive(false)
      setBeacon(false)
      localStorage.setItem(storageKey, "true")
      return
    }
    setStep(nextStep)
    setTimeout(() => measureTarget(nextStep), 80)
  }, [step, storageKey, measureTarget])

  const prev = useCallback(() => {
    const prevStep = step - 1
    if (prevStep < 0) return
    setStep(prevStep)
    setTimeout(() => measureTarget(prevStep), 80)
  }, [step, measureTarget])

  const dismiss = useCallback(() => {
    setActive(false)
    setBeacon(false)
    localStorage.setItem(storageKey, "true")
  }, [storageKey])

  /* Recalc on resize */
  useEffect(() => {
    if (!active) return
    const handler = () => measureTarget(step)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [active, step, measureTarget])

  /* Beacon for re-start */
  useEffect(() => {
    const done = localStorage.getItem(storageKey)
    if (!done && !showWelcome && !active) {
      const t = setTimeout(() => setBeacon(true), 4000)
      return () => clearTimeout(t)
    }
  }, [storageKey, showWelcome, active])

  const current = STEPS[step]

  /* ── Spotlight position ────────────────────────────────────── */
  function spotlightStyle(): React.CSSProperties {
    if (!rect) return { display: "none" }
    return {
      position: "absolute",
      top: rect.top - 8,
      left: rect.left - 8,
      width: rect.width + 16,
      height: rect.height + 16,
      borderRadius: 22,
      border: "2px solid var(--c-indigo)",
      boxShadow: "0 0 0 4000px rgba(9,11,18,0.60)",
      zIndex: 999,
      pointerEvents: "none",
      transition: "top 320ms cubic-bezier(0.23,1,0.32,1), left 320ms cubic-bezier(0.23,1,0.32,1), width 320ms cubic-bezier(0.23,1,0.32,1), height 320ms cubic-bezier(0.23,1,0.32,1)",
    }
  }

  /* ── Tooltip position ──────────────────────────────────────── */
  function tooltipStyle(): React.CSSProperties {
    if (!rect) return { display: "none" }
    const TW = 340, MARGIN = 14
    const placement = current?.placement ?? "bottom"
    const base: React.CSSProperties = { position: "absolute", width: TW, zIndex: 1000 }

    const leftPos = Math.max(12, Math.min(rect.left, window.innerWidth - TW - 12))

    if (placement === "bottom") return { ...base, top: rect.top + rect.height + MARGIN, left: leftPos }
    if (placement === "top")    return { ...base, top: rect.top - 190 - MARGIN, left: leftPos }
    if (placement === "right")  return { ...base, top: rect.top, left: rect.left + rect.width + MARGIN }
    return { ...base, top: rect.top, left: rect.left - TW - MARGIN }
  }

  const firstName = userName.split(" ")[0]

  return (
    <>
      {/* ══════════════════════════════════════════════════════════
          WELCOME MODAL
      ══════════════════════════════════════════════════════════ */}
      {showWelcome && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ animation: "fadeIn 400ms ease-out" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(9,11,18,0.65)", backdropFilter: "blur(14px)" }}
            onClick={skipAll}
          />

          {/* Card */}
          <div
            className="relative max-w-sm w-full rounded-3xl p-8 text-center"
            style={{
              background: "var(--c-bg)",
              border: "1px solid var(--c-border)",
              boxShadow: "0 32px 80px rgba(9,11,18,0.30)",
              animation: "modalIn 500ms cubic-bezier(0.34,1.3,0.64,1) both",
            }}
          >
            {/* Dismiss */}
            <button
              onClick={skipAll}
              className="absolute top-4 right-4 w-7 h-7 rounded-xl flex items-center justify-center transition-opacity hover:opacity-60"
              style={{ background: "var(--c-surface)", color: "var(--c-text-muted)" }}
            >
              <X size={12} />
            </button>

            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{
                background: "var(--c-indigo-bg)",
                animation: "softBounce 800ms cubic-bezier(0.34,1.56,0.64,1) 300ms both",
              }}
            >
              <GraduationCap size={28} style={{ color: "var(--c-indigo)" }} />
            </div>

            <h2
              className="text-xl font-extrabold tracking-tight mb-1"
              style={{ color: "var(--c-text)", letterSpacing: "-0.02em" }}
            >
              Welcome, {firstName}!
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--c-text-muted)" }}>
              Your school is set up and ready. Here&apos;s a quick tour of what you can do.
            </p>

            {/* Feature pills */}
            <div className="space-y-2.5 mb-6 text-left">
              {WELCOME_FEATURES.map(({ icon: Icon, label, color }, i) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{
                    background: "var(--c-surface)",
                    animation: `fadeSlideInUp 400ms cubic-bezier(0.23,1,0.32,1) ${300 + i * 80}ms both`,
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${color}18` }}
                  >
                    <Icon size={14} style={{ color }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--c-text)" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2">
              <button
                onClick={startTour}
                className="relative overflow-hidden w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ background: "var(--c-indigo)" }}
              >
                <Sparkles size={14} />
                Take the tour
                <ArrowRight size={14} />
              </button>
              <button
                onClick={skipAll}
                className="w-full h-10 rounded-xl text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--c-text-muted)", background: "transparent" }}
              >
                I&apos;ll explore myself
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          BEACON
      ══════════════════════════════════════════════════════════ */}
      {showBeacon && !active && (
        <div className="fixed z-50" style={{ bottom: 96, right: 24 }}>
          <button
            onClick={startTour}
            className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-95"
            style={{
              background: "var(--c-indigo)",
              boxShadow: "0 8px 32px rgba(79,70,229,0.45)",
              animation: "beaconFloat 3s ease-in-out infinite",
            }}
          >
            <Sparkles size={13} />
            Take a tour
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SPOTLIGHT + TOOLTIP
      ══════════════════════════════════════════════════════════ */}
      {active && rect && (
        <>
          {/* Spotlight ring */}
          <div style={spotlightStyle()} />

          {/* Tooltip */}
          <div
            style={{
              ...tooltipStyle(),
              animation: "tooltipIn 260ms cubic-bezier(0.23,1,0.32,1) both",
            }}
          >
            <div
              className="rounded-2xl p-5"
              style={{
                background: "var(--c-bg)",
                border: "1px solid var(--c-border)",
                boxShadow: "0 24px 56px rgba(9,11,18,0.22), 0 4px 16px rgba(9,11,18,0.08)",
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  {current?.icon && (
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "var(--c-indigo-bg)" }}
                    >
                      <current.icon size={15} style={{ color: "var(--c-indigo)" }} />
                    </div>
                  )}
                  <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>
                    {current?.title}
                  </p>
                </div>
                <button
                  onClick={dismiss}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-opacity hover:opacity-60 shrink-0"
                  style={{ color: "var(--c-text-muted)", background: "var(--c-surface)" }}
                >
                  <X size={11} />
                </button>
              </div>

              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--c-text-muted)" }}>
                {current?.body}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                {/* Step dots */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-400"
                      style={{
                        width: i === step ? 18 : 6,
                        height: 6,
                        background: i < step
                          ? "var(--c-emerald)"
                          : i === step
                          ? "var(--c-indigo)"
                          : "var(--c-border)",
                        transition: "all 300ms cubic-bezier(0.23,1,0.32,1)",
                      }}
                    />
                  ))}
                  <span className="ml-1 text-xs" style={{ color: "var(--c-text-muted)" }}>
                    {step + 1}/{STEPS.length}
                  </span>
                </div>

                {/* Nav */}
                <div className="flex items-center gap-2">
                  {step > 0 && (
                    <button
                      onClick={prev}
                      className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl transition-all hover:opacity-80 active:scale-95"
                      style={{ color: "var(--c-text-muted)", background: "var(--c-surface)" }}
                    >
                      <ChevronLeft size={12} /> Back
                    </button>
                  )}
                  <button
                    onClick={next}
                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95"
                    style={{ background: "var(--c-indigo)" }}
                  >
                    {step === STEPS.length - 1 ? (
                      <>Done ✓</>
                    ) : (
                      <>Next <ArrowRight size={11} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeSlideInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes softBounce {
          0%   { transform: scale(0.6) translateY(8px); opacity: 0; }
          60%  { transform: scale(1.08) translateY(-4px); opacity: 1; }
          80%  { transform: scale(0.96); }
          100% { transform: scale(1); }
        }
        @keyframes beaconFloat {
          0%, 100% { transform: translateY(0); box-shadow: 0 8px 32px rgba(79,70,229,0.45); }
          50%       { transform: translateY(-4px); box-shadow: 0 14px 40px rgba(79,70,229,0.6); }
        }
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
