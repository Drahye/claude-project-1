"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import {
  Users, GraduationCap, BookOpen,
  CheckCircle2, ArrowRight, Sparkles,
  CreditCard, BarChart3, Bell, TrendingUp, TrendingDown,
} from "lucide-react"
import { formatDate, avatarColor, getInitials } from "@/lib/utils"
import AdminWelcomeGuide from "./WelcomeGuide"
import DashboardTour from "./DashboardTour"

/* ══════════════════════════════════════════════════════════════
   MICRO-INTERACTION PRIMITIVES
══════════════════════════════════════════════════════════════ */

/** Spring physics count-up — overshoots then settles naturally */
function useSpringCount(target: number, delay = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const timeout = setTimeout(() => {
      const stiffness = 160, damping = 20
      let pos = 0, vel = 0, last = performance.now()
      let raf: number
      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.032)
        last = now
        const force = -stiffness * (pos - target) - damping * vel
        vel += force * dt
        pos += vel * dt
        setValue(Math.max(0, Math.round(pos)))
        if (Math.abs(pos - target) > 0.5 || Math.abs(vel) > 0.5) {
          raf = requestAnimationFrame(tick)
        } else {
          setValue(target)
        }
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, delay])
  return target === 0 ? 0 : value
}

/** Classic ease-out count-up for percentages */
function useCountUp(target: number, duration = 900, delay = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const timeout = setTimeout(() => {
      const start = performance.now()
      let raf: number
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - t, 3)
        setValue(Math.round(ease * target))
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, duration, delay])
  return target === 0 ? 0 : value
}

/** IntersectionObserver — fires once when element enters viewport */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/** 3-D tilt card on mouse move */
function useTiltCard(strength = 6) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const dx = ((e.clientX - r.left) / r.width  - 0.5) * 2
    const dy = ((e.clientY - r.top)  / r.height - 0.5) * 2
    setTilt({ x: -dy * strength, y: dx * strength })
  }, [strength])

  const onMouseEnter = useCallback(() => setHovered(true),  [])
  const onMouseLeave = useCallback(() => { setHovered(false); setTilt({ x: 0, y: 0 }) }, [])

  const style: React.CSSProperties = {
    transform: hovered
      ? `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
      : "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)",
    transition: hovered
      ? "transform 80ms linear"
      : "transform 500ms cubic-bezier(0.23,1,0.32,1)",
    willChange: "transform",
  }

  return { ref, style, handlers: { onMouseMove, onMouseEnter, onMouseLeave }, hovered }
}

/** Typewriter that reveals text character by character */
function TypewriterText({ text, delay = 0, speed = 38 }: { text: string; delay?: number; speed?: number }) {
  const [displayed, setDisplayed] = useState("")
  useEffect(() => {
    let i = 0
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, ++i))
        if (i >= text.length) clearInterval(interval)
      }, speed)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timer)
  }, [text, delay, speed])
  return <>{displayed || " "}</>
}

/** Ripple click effect */
function useRipple() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])

  const addRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()
    setRipples(r => [...r, { x, y, id }])
    setTimeout(() => setRipples(r => r.filter(rip => rip.id !== id)), 700)
  }, [])

  const RippleContainer = ({ color = "rgba(255,255,255,0.35)" }: { color?: string }) => (
    <>
      {ripples.map(rip => (
        <span
          key={rip.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: rip.x - 40,
            top: rip.y - 40,
            width: 80,
            height: 80,
            background: color,
            animation: "rippleOut 700ms cubic-bezier(0.23,1,0.32,1) forwards",
          }}
        />
      ))}
    </>
  )

  return { addRipple, RippleContainer }
}

/* ══════════════════════════════════════════════════════════════
   UI COMPONENTS
══════════════════════════════════════════════════════════════ */

/** Animated section fade-up reveal on scroll */
function Reveal({
  children,
  delay = 0,
  className = "",
}: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: inView ? "translateY(0)" : "translateY(20px)",
        opacity: inView ? 1 : 0,
        transition: `transform 650ms cubic-bezier(0.23,1,0.32,1) ${delay}ms, opacity 550ms ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

/** Animated health ring */
function HealthRing({ score, color }: { score: number; color: string }) {
  const [progress, setProgress] = useState(0)
  const R = 28, circ = 2 * Math.PI * R

  useEffect(() => {
    const t = setTimeout(() => {
      let start: number, raf: number
      const tick = (now: number) => {
        if (!start) start = now
        const p = Math.min((now - start) / 1100, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setProgress(ease * score)
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }, 300)
    return () => clearTimeout(t)
  }, [score])

  const displayScore = useCountUp(score, 1100, 300)
  const dash = (progress / 100) * circ

  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={R} fill="none" strokeWidth="5" stroke="var(--c-border)" />
        <circle cx="32" cy="32" r={R} fill="none" strokeWidth="5"
          stroke={color} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold tabular-nums"
        style={{ color }}>
        {displayScore}
      </span>
    </div>
  )
}

/** Animated progress bar with shimmer on complete */
function AnimatedProgressBar({ pct, color }: { pct: number; color: string }) {
  const [width, setWidth] = useState(0)
  const [showShimmer, setShowShimmer] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => {
      setWidth(pct)
      const t2 = setTimeout(() => { setShowShimmer(true); setTimeout(() => setShowShimmer(false), 1200) }, 1000)
      return () => clearTimeout(t2)
    }, 400)
    return () => clearTimeout(t1)
  }, [pct])

  return (
    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: "var(--c-surface)" }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${width}%`, background: color, transition: "width 1s cubic-bezier(0.23,1,0.32,1)" }}
      />
      {showShimmer && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${color}60 50%, transparent 100%)`,
            animation: "shimmerSweep 1.2s ease-out",
          }}
        />
      )}
    </div>
  )
}

/** Pulse dot */
function PulseDot({ color = "var(--c-indigo)" }: { color?: string }) {
  return (
    <span className="relative flex w-2.5 h-2.5 shrink-0">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ background: color, animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite" }} />
      <span className="relative inline-flex w-2.5 h-2.5 rounded-full" style={{ background: color }} />
    </span>
  )
}

/** Animated empty state with spring bounce */
function EmptyState({ icon: Icon, label, href, cta }: {
  icon: React.ElementType; label: string; href: string; cta: string
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t) }, [])

  return (
    <div
      className="rounded-2xl px-5 py-10 flex flex-col items-center gap-3 text-center"
      style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}
    >
      <div style={{
        transform: visible ? "scale(1)" : "scale(0.5)",
        opacity: visible ? 1 : 0,
        transition: "transform 550ms cubic-bezier(0.34,1.56,0.64,1), opacity 400ms ease-out",
      }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--c-indigo-bg)" }}>
          <Icon size={20} style={{ color: "var(--c-indigo)" }} />
        </div>
      </div>
      <div style={{
        transform: visible ? "translateY(0)" : "translateY(10px)",
        opacity: visible ? 1 : 0,
        transition: "transform 400ms ease-out 160ms, opacity 400ms ease-out 160ms",
      }}>
        <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>No {label} yet</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
          Get started by adding your first {label.toLowerCase().replace(/s$/, "")}.
        </p>
      </div>
      <Link href={href}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-all hover:opacity-80 active:scale-95"
        style={{
          background: "var(--c-indigo-bg)", color: "var(--c-indigo)",
          transform: visible ? "translateY(0)" : "translateY(10px)",
          opacity: visible ? 1 : 0,
          transition: "transform 400ms ease-out 260ms, opacity 400ms ease-out 260ms, background 200ms",
        }}>
        {cta} <ArrowRight size={11} />
      </Link>
    </div>
  )
}

/** Stat card with tilt, count-up, accent bar and hover shine */
function StatCard({ label, value, raw, icon: Icon, href, color, delay }: {
  label: string; value: number; raw: number
  icon: React.ElementType; href: string; color: string; delay: number
}) {
  const { ref, style: tiltStyle, handlers, hovered } = useTiltCard(4)
  const { addRipple, RippleContainer } = useRipple()
  const { ref: inRef, inView } = useInView()

  return (
    <div ref={inRef} style={{
      transform: inView ? "translateY(0)" : "translateY(20px)",
      opacity: inView ? 1 : 0,
      transition: `transform 650ms cubic-bezier(0.23,1,0.32,1) ${delay}ms, opacity 550ms ease-out ${delay}ms`,
    }}>
      <div ref={ref} {...handlers} style={tiltStyle}>
        <Link
          href={href}
          onClick={addRipple}
          className="relative overflow-hidden block rounded-2xl p-4 group"
          style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", textDecoration: "none" }}
        >
          <RippleContainer color={`${color}22`} />

          {/* Hover glow */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at 50% 0%, ${color}12 0%, transparent 70%)`,
              opacity: hovered ? 1 : 0,
            }} />

          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
              style={{ background: `${color}18` }}>
              <Icon size={13} style={{ color }} />
            </div>
            <p className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>{label}</p>
          </div>

          {raw === 0 ? (
            <div className="flex items-end gap-2">
              <p className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--c-text-muted)", letterSpacing: "-0.02em" }}>0</p>
              <span className="text-xs pb-0.5 font-medium" style={{ color: "var(--c-text-muted)" }}>Add first →</span>
            </div>
          ) : (
            <p className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--c-text)", letterSpacing: "-0.02em" }}>
              {value}
            </p>
          )}

          {/* Accent bar */}
          <div className="mt-2.5 h-0.5 rounded-full overflow-hidden" style={{ background: "var(--c-border)" }}>
            <div
              className="h-full rounded-full"
              style={{
                background: color,
                width: "0%",
                opacity: 0.4,
                transition: "width 900ms cubic-bezier(0.23,1,0.32,1)",
              }}
              ref={el => {
                if (el) setTimeout(() => { el.style.width = raw > 0 ? "100%" : "20%" }, 400 + delay)
              }}
            />
          </div>
        </Link>
      </div>
    </div>
  )
}

/** Quick action card with magnetic pull + icon animation */
function ActionCard({ label, href, icon: Icon, color, delay }: {
  label: string; href: string; icon: React.ElementType; color: string; delay: number
}) {
  const { ref, style: tiltStyle, handlers, hovered } = useTiltCard(3)
  const { addRipple, RippleContainer } = useRipple()
  const { ref: inRef, inView } = useInView()

  return (
    <div ref={inRef} style={{
      transform: inView ? "translateY(0)" : "translateY(16px)",
      opacity: inView ? 1 : 0,
      transition: `transform 600ms cubic-bezier(0.23,1,0.32,1) ${delay}ms, opacity 500ms ease-out ${delay}ms`,
    }}>
      <div ref={ref} {...handlers} style={tiltStyle}>
        <Link
          href={href}
          onClick={addRipple}
          className="relative overflow-hidden flex items-center gap-3 p-4 rounded-2xl group"
          style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", textDecoration: "none" }}
        >
          <RippleContainer color={`${color}22`} />
          <div className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at 0% 50%, ${color}10 0%, transparent 60%)`,
              opacity: hovered ? 1 : 0,
            }} />
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
            style={{ background: `${color}18` }}
          >
            <Icon
              size={16}
              style={{
                color,
                transition: "transform 300ms cubic-bezier(0.34,1.56,0.64,1)",
                transform: hovered ? "rotate(-8deg) scale(1.1)" : "rotate(0) scale(1)",
              }}
            />
          </div>
          <p className="text-sm font-semibold flex-1" style={{ color: "var(--c-text)" }}>{label}</p>
          <ArrowRight
            size={14}
            style={{
              color: "var(--c-text-muted)",
              transform: hovered ? "translateX(3px)" : "translateX(0)",
              opacity: hovered ? 1 : 0,
              transition: "transform 300ms cubic-bezier(0.23,1,0.32,1), opacity 200ms ease-out",
            }}
          />
        </Link>
      </div>
    </div>
  )
}

/** Metric card */
function MetricCard({
  icon: Icon, iconColor, label, value, displayValue,
  goodColor, badColor, threshold, subtext, href,
}: {
  icon: React.ElementType; iconColor: string; label: string
  value: number | null; displayValue: string
  goodColor: string; badColor: string; threshold: number
  subtext: string; href: string
}) {
  const color = value === null ? "var(--c-text-muted)"
    : value >= threshold ? goodColor : badColor
  const { ref, inView } = useInView()
  const [hovered, setHovered] = useState(false)

  const Trend = value !== null
    ? value >= threshold
      ? <TrendingUp size={12} style={{ color: goodColor }} />
      : <TrendingDown size={12} style={{ color: badColor }} />
    : null

  return (
    <div ref={ref} style={{
      transform: inView ? "translateY(0)" : "translateY(16px)",
      opacity: inView ? 1 : 0,
      transition: "transform 600ms cubic-bezier(0.23,1,0.32,1), opacity 500ms ease-out",
    }}>
      <div
        className="rounded-2xl p-5"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "var(--c-bg)",
          border: "1px solid var(--c-border)",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
          boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.06)" : "none",
          transition: "transform 300ms cubic-bezier(0.23,1,0.32,1), box-shadow 300ms ease",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon size={14} style={{ color: iconColor }} />
            <p className="text-xs font-semibold" style={{ color: "var(--c-text-muted)" }}>{label}</p>
          </div>
          {Trend}
        </div>
        <p className="text-3xl font-extrabold tabular-nums mb-1"
          style={{ color, letterSpacing: "-0.03em" }}>
          {displayValue}
        </p>
        <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{subtext}</p>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-semibold mt-3 group/link"
          style={{ color: "var(--c-indigo)", textDecoration: "none" }}
        >
          View analytics
          <ArrowRight size={11}
            style={{ transition: "transform 300ms cubic-bezier(0.23,1,0.32,1)" }}
            className="group-hover/link:translate-x-0.5"
          />
        </Link>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   PROPS
══════════════════════════════════════════════════════════════ */
export interface DashboardShellProps {
  profile: {
    full_name: string
    school: {
      id: string; name: string; slug: string
      subscription_plan: string; subscription_status: string
      student_count: number; max_students: number
    }
  }
  userId: string
  studentCount: number
  teacherCount: number
  classCount: number
  parentCount: number
  attendancePct: number | null
  presentCount: number
  totalRecords: number
  hwRate: number | null
  hwSubmitted: number
  hwAssigned: number
  healthScore: number | null
  healthColor: string
  recentProfiles: Array<{
    id: string; full_name: string; role: string; created_at: string; is_active: boolean
  }>
  notifications: Array<{
    id: string; title: string; body: string; type: string; created_at: string; is_read: boolean
  }>
  unreadCount: number
  greeting: string
  today: string
}

/* ══════════════════════════════════════════════════════════════
   MAIN SHELL
══════════════════════════════════════════════════════════════ */
export default function DashboardShell({
  profile, userId,
  studentCount, teacherCount, classCount, parentCount,
  attendancePct, presentCount, totalRecords,
  hwRate, hwSubmitted, hwAssigned,
  healthScore, healthColor,
  recentProfiles, notifications, unreadCount,
  greeting, today,
}: DashboardShellProps) {

  const students = useSpringCount(studentCount, 80)
  const teachers = useSpringCount(teacherCount, 160)
  const classes  = useSpringCount(classCount,   240)
  const parents  = useSpringCount(parentCount,  320)
  const attPct   = useCountUp(attendancePct ?? 0, 1100, 400)
  const hwPct    = useCountUp(hwRate ?? 0,         1100, 500)

  const [headerVisible, setHeaderVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setHeaderVisible(true), 60); return () => clearTimeout(t) }, [])

  const planColors: Record<string, string> = {
    free: "var(--c-text-muted)", starter: "var(--c-indigo)",
    pro: "var(--c-emerald)", enterprise: "var(--c-gold)",
  }

  const statCards = [
    { label: "Students", value: students, raw: studentCount, icon: GraduationCap, href: "/admin/students", color: "var(--c-indigo)"  },
    { label: "Teachers", value: teachers, raw: teacherCount, icon: Users,          href: "/admin/teachers", color: "var(--c-emerald)" },
    { label: "Classes",  value: classes,  raw: classCount,   icon: BookOpen,       href: "/admin/classes",  color: "var(--c-gold)"    },
    { label: "Parents",  value: parents,  raw: parentCount,  icon: Users,          href: "/admin/students", color: "var(--c-indigo)"  },
  ]

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-6xl mx-auto">

      {/* Tour + guided onboarding */}
      <DashboardTour userId={userId} userName={profile.full_name} />

      {/* ── Header ──────────────────────────────────────── */}
      <div
        className="flex items-start justify-between mb-8 pt-2"
        style={{
          transform: headerVisible ? "translateY(0)" : "translateY(-12px)",
          opacity: headerVisible ? 1 : 0,
          transition: "transform 600ms cubic-bezier(0.23,1,0.32,1), opacity 500ms ease-out",
        }}
      >
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>{today}</p>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
            <TypewriterText text={`${greeting} 👋`} delay={200} speed={32} />
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>{profile.school.name}</p>
        </div>
        {unreadCount > 0 && (
          <Link
            href="/admin/alerts"
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95"
            style={{ background: "var(--c-indigo-bg)", textDecoration: "none" }}
          >
            <PulseDot />
            <span className="text-sm font-semibold" style={{ color: "var(--c-indigo)" }}>{unreadCount} new</span>
            <Bell size={13} style={{ color: "var(--c-indigo)" }} />
          </Link>
        )}
      </div>

      {/* ── Welcome guide ───────────────────────────────── */}
      <Reveal delay={80}>
        <AdminWelcomeGuide
          userName={profile.full_name}
          userId={userId}
          schoolSlug={profile.school.slug}
          hasTeachers={teacherCount > 0}
          hasStudents={studentCount > 0}
          hasClasses={classCount > 0}
          plan={profile.school.subscription_plan}
        />
      </Reveal>

      {/* ── Health + plan ───────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Reveal delay={100} className="h-full">
          <div
            className="rounded-2xl p-5 flex items-center gap-5 h-full transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}
            data-tour="health-card"
          >
            {healthScore !== null ? (
              <HealthRing score={healthScore} color={healthColor} />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "var(--c-surface)" }}>
                <span className="text-2xl font-extrabold" style={{ color: "var(--c-text-muted)" }}>—</span>
              </div>
            )}
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>School health score</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
                {healthScore === null ? "Not enough data yet"
                  : healthScore >= 80 ? "Excellent — school is performing well"
                  : healthScore >= 60 ? "Good — a few areas need attention"
                  : "Needs attention — review attendance & homework"}
              </p>
              <div className="flex gap-3 mt-2">
                {attendancePct !== null && (
                  <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--c-text-muted)" }}>
                    {attPct}% attendance
                  </span>
                )}
                {hwRate !== null && (
                  <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--c-text-muted)" }}>
                    {hwPct}% homework
                  </span>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={140} className="h-full">
          <div
            className="rounded-2xl p-5 h-full transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Subscription</p>
              <span
                className="badge"
                style={{
                  background: `${planColors[profile.school.subscription_plan] ?? "var(--c-text-muted)"}20`,
                  color: planColors[profile.school.subscription_plan] ?? "var(--c-text-muted)",
                }}
              >
                {profile.school.subscription_plan.charAt(0).toUpperCase() + profile.school.subscription_plan.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>Students</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--c-text)" }}>
                    {profile.school.student_count} / {profile.school.max_students}
                  </span>
                </div>
                <AnimatedProgressBar
                  pct={Math.min(100, Math.round((profile.school.student_count / profile.school.max_students) * 100))}
                  color={profile.school.student_count / profile.school.max_students > 0.9 ? "var(--c-red)" : "var(--c-indigo)"}
                />
              </div>
            </div>
            <Link
              href="/admin/billing"
              className="inline-flex items-center gap-1.5 text-xs font-semibold mt-3 group transition-all"
              style={{ color: "var(--c-indigo)", textDecoration: "none" }}
            >
              <CreditCard size={12} />
              Manage plan
              <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6" data-tour="stat-cards">
        {statCards.map(({ label, value, raw, icon, href, color }, i) => (
          <StatCard key={label} label={label} value={value} raw={raw}
            icon={icon} href={href} color={color} delay={i * 60} />
        ))}
      </div>

      {/* ── Main grid ───────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">

        {/* Left */}
        <div className="space-y-6">
          {/* Metrics */}
          <section>
            <Reveal delay={0}>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>
                Last 7 days
              </h2>
            </Reveal>
            <div className="grid sm:grid-cols-2 gap-4">
              <MetricCard
                icon={CheckCircle2}  iconColor="var(--c-emerald)"  label="Attendance rate"
                value={attendancePct} displayValue={attendancePct !== null ? `${attPct}%` : "—"}
                goodColor="var(--c-emerald)" badColor="var(--c-red)" threshold={80}
                subtext={`${presentCount} of ${totalRecords} records present`}
                href="/admin/analytics"
              />
              <MetricCard
                icon={BookOpen} iconColor="var(--c-indigo)" label="Homework rate"
                value={hwRate} displayValue={hwRate !== null ? `${hwPct}%` : "—"}
                goodColor="var(--c-indigo)" badColor="var(--c-gold)" threshold={70}
                subtext={`${hwSubmitted} of ${hwAssigned} assignments submitted`}
                href="/admin/analytics"
              />
            </div>
          </section>

          {/* Quick actions */}
          <section data-tour="quick-actions">
            <Reveal delay={0}>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>
                Quick actions
              </h2>
            </Reveal>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Add student",  href: "/admin/students?add=1", icon: GraduationCap, color: "var(--c-indigo)" },
                { label: "Add teacher",  href: "/admin/teachers?add=1", icon: Users,         color: "var(--c-emerald)" },
                { label: "Create class", href: "/admin/classes?add=1",  icon: BookOpen,      color: "var(--c-gold)" },
                { label: "View reports", href: "/admin/analytics",       icon: BarChart3,     color: "var(--c-indigo)" },
              ].map(({ label, href, icon, color }, i) => (
                <ActionCard key={label} label={label} href={href}
                  icon={icon} color={color} delay={i * 50} />
              ))}
            </div>
          </section>
        </div>

        {/* Right */}
        <div className="space-y-6">
          {/* Recent members */}
          <section data-tour="recent-members">
            <Reveal delay={0}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>
                  Recent members
                </h2>
                <Link href="/admin/students" className="text-xs font-semibold"
                  style={{ color: "var(--c-indigo)", textDecoration: "none" }}>
                  View all
                </Link>
              </div>
            </Reveal>
            {recentProfiles.length > 0 ? (
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
                {recentProfiles.map((p, i) => (
                  <MemberRow key={p.id} member={p} delay={80 + i * 55} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} label="Members" href="/admin/teachers" cta="Invite teachers" />
            )}
          </section>

          {/* AI callout */}
          <Reveal delay={0}>
            <AICallout />
          </Reveal>

          {/* Alerts */}
          {notifications.length > 0 && (
            <section>
              <Reveal delay={0}>
                <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>
                  Alerts
                </h2>
              </Reveal>
              <div className="space-y-2">
                {notifications.map((n, i) => (
                  <AlertCard key={n.id} notification={n} delay={i * 55} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes rippleOut {
          from { transform: scale(0); opacity: 1; }
          to   { transform: scale(4); opacity: 0; }
        }
        @keyframes shimmerSweep {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }
        @keyframes softBounce {
          0%   { transform: translateY(0); }
          40%  { transform: translateY(-4px); }
          70%  { transform: translateY(-1px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ── Member row ─────────────────────────────────────────────── */
function MemberRow({ member, delay }: {
  member: { id: string; full_name: string; role: string; created_at: string; is_active: boolean }
  delay: number
}) {
  const [hovered, setHovered] = useState(false)
  const { ref, inView } = useInView()

  return (
    <div
      ref={ref}
      className="flex items-center gap-3 px-4 py-3 transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--c-surface)" : "var(--c-bg)",
        borderBottom: "1px solid var(--c-border)",
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(-10px)",
        transition: `opacity 400ms ease-out ${delay}ms, transform 400ms cubic-bezier(0.23,1,0.32,1) ${delay}ms, background 200ms ease`,
      }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 transition-transform duration-300"
        style={{
          background: avatarColor(member.full_name),
          transform: hovered ? "scale(1.08) rotate(3deg)" : "scale(1) rotate(0)",
        }}
      >
        {getInitials(member.full_name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{member.full_name}</p>
        <p className="text-xs capitalize" style={{ color: "var(--c-text-muted)" }}>{member.role.replace("_", " ")}</p>
      </div>
      <span
        className="badge"
        style={{
          background: member.is_active ? "var(--c-emerald-bg)" : "var(--c-red-bg)",
          color: member.is_active ? "var(--c-emerald)" : "var(--c-red)",
        }}
      >
        {member.is_active ? "Active" : "Pending"}
      </span>
    </div>
  )
}

/* ── AI callout ─────────────────────────────────────────────── */
function AICallout() {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="rounded-2xl p-5 cursor-default transition-all duration-300"
      data-tour="ai-reports"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: "1px solid var(--c-border)",
        background: `linear-gradient(135deg, var(--c-indigo-bg), var(--c-bg))`,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 8px 24px rgba(79,70,229,0.10)" : "none",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles
          size={14}
          style={{
            color: "var(--c-indigo)",
            transition: "transform 400ms cubic-bezier(0.34,1.56,0.64,1)",
            transform: hovered ? "rotate(20deg) scale(1.2)" : "rotate(0) scale(1)",
          }}
        />
        <span className="badge badge-indigo text-[10px]">✦ AI · Claude-powered</span>
      </div>
      <p className="text-sm font-bold mb-1" style={{ color: "var(--c-text)" }}>Weekly reports running</p>
      <p className="text-xs leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
        Teachers use Claude to generate personalised weekly reports for every parent. Enable AI in Settings to configure.
      </p>
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-1 text-xs font-semibold mt-3 group/link"
        style={{ color: "var(--c-indigo)", textDecoration: "none" }}
      >
        Configure AI
        <ArrowRight size={11} className="transition-transform group-hover/link:translate-x-0.5" />
      </Link>
    </div>
  )
}

/* ── Alert card ─────────────────────────────────────────────── */
function AlertCard({ notification: n, delay }: {
  notification: { id: string; title: string; body: string; type: string; created_at: string; is_read: boolean }
  delay: number
}) {
  const [hovered, setHovered] = useState(false)
  const { ref, inView } = useInView()

  return (
    <div
      ref={ref}
      className="rounded-2xl px-4 py-3 transition-all duration-200"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--c-bg)",
        border: "1px solid var(--c-border)",
        opacity: inView ? 1 : 0,
        transform: inView
          ? hovered ? "translateY(-1px)" : "translateY(0)"
          : "translateY(8px)",
        boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.05)" : "none",
        transition: `opacity 350ms ease-out ${delay}ms, transform 350ms cubic-bezier(0.23,1,0.32,1) ${delay}ms, box-shadow 300ms ease`,
      }}
    >
      <div className="flex items-start gap-2">
        {!n.is_read && <PulseDot />}
        <div className="flex-1 min-w-0" style={{ opacity: n.is_read ? 0.6 : 1 }}>
          <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{n.title}</p>
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--c-text-muted)" }}>{n.body}</p>
          <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>{formatDate(n.created_at, "time")}</p>
        </div>
      </div>
    </div>
  )
}
