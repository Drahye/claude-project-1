"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  Users, GraduationCap, BookOpen, CheckCircle2, ArrowRight, ArrowUpRight,
  Sparkles, CreditCard, BarChart3, Bell, TrendingUp, TrendingDown, Activity,
} from "lucide-react"
import { formatDate, avatarColor, getInitials } from "@/lib/utils"
import AdminWelcomeGuide from "./WelcomeGuide"
import DashboardTour from "./DashboardTour"

/* ══════════════════════════════════════════════════════════════
   MOTION PRIMITIVES (restrained — purposeful only)
══════════════════════════════════════════════════════════════ */

/** Spring count-up — overshoots then settles */
function useSpringCount(target: number, delay = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const timeout = setTimeout(() => {
      const stiffness = 150, damping = 19
      let pos = 0, vel = 0, last = performance.now(), raf = 0
      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.032); last = now
        vel += (-stiffness * (pos - target) - damping * vel) * dt
        pos += vel * dt
        setValue(Math.max(0, Math.round(pos)))
        if (Math.abs(pos - target) > 0.5 || Math.abs(vel) > 0.5) raf = requestAnimationFrame(tick)
        else setValue(target)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, delay])
  return target === 0 ? 0 : value
}

/** Ease-out count-up for percentages */
function useCountUp(target: number, duration = 1000, delay = 0) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const timeout = setTimeout(() => {
      const start = performance.now(); let raf = 0
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1)
        setValue(Math.round((1 - Math.pow(1 - t, 3)) * target))
        if (t < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, duration, delay])
  return target === 0 ? 0 : value
}

/** Fires once when element enters viewport */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/** Scroll fade-up reveal */
function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className={className} style={{
      transform: inView ? "translateY(0)" : "translateY(16px)",
      opacity: inView ? 1 : 0,
      transition: `transform 640ms var(--ease-out) ${delay}ms, opacity 520ms ease-out ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

function PulseDot({ color = "var(--c-indigo)" }: { color?: string }) {
  return (
    <span className="relative flex w-2.5 h-2.5 shrink-0">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ background: color, animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
      <span className="relative inline-flex w-2.5 h-2.5 rounded-full" style={{ background: color }} />
    </span>
  )
}

/* ══════════════════════════════════════════════════════════════
   CHARTS (lightweight inline SVG — no deps)
══════════════════════════════════════════════════════════════ */

/** Catmull-Rom → cubic bezier smoothing */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return ""
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1], p1 = pts[i], p2 = pts[i + 1]
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1]
    const cp1x = p1.x + (p2.x - p0.x) / 6, cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6, cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return d
}

interface SeriesPoint { label: string; pct: number | null; present: number; total: number }

/** 7-day attendance area chart with draw-in reveal */
function AttendanceChart({ series }: { series: SeriesPoint[] }) {
  const { ref, inView } = useInView()
  const [hover, setHover] = useState<number | null>(null)
  const id = useRef(`g${Math.random().toString(36).slice(2, 8)}`).current
  const W = 520, H = 170, padX = 14, padTop = 16, padBot = 30
  const plotW = W - padX * 2, plotH = H - padTop - padBot

  const valid = series.map((s, i) => ({ ...s, i })).filter(s => s.pct !== null) as Array<SeriesPoint & { i: number }>
  const x = (i: number) => padX + (series.length === 1 ? plotW / 2 : (i / (series.length - 1)) * plotW)
  const y = (pct: number) => padTop + plotH - (pct / 100) * plotH

  if (valid.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 rounded-2xl"
        style={{ background: "var(--c-surface)", minHeight: 160 }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style={{ background: "var(--c-indigo-bg)" }}>
          <Activity size={18} style={{ color: "var(--c-indigo)" }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Trend builds as you go</p>
        <p className="text-xs mt-1 max-w-[34ch]" style={{ color: "var(--c-text-muted)" }}>
          Record attendance for a few days and the weekly curve appears here.
        </p>
      </div>
    )
  }

  const pts = valid.map(s => ({ x: x(s.i), y: y(s.pct as number) }))
  const line = smoothPath(pts)
  const area = `${line} L ${pts[pts.length - 1].x} ${padTop + plotH} L ${pts[0].x} ${padTop + plotH} Z`

  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c-indigo)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--c-indigo)" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${id}-clip`}>
            <rect x="0" y="0" width={inView ? W : 0} height={H}
              style={{ transition: "width 1100ms var(--ease-out)" }} />
          </clipPath>
        </defs>

        {/* gridlines */}
        {[0, 50, 100].map(g => (
          <g key={g}>
            <line x1={padX} x2={W - padX} y1={y(g)} y2={y(g)} stroke="var(--c-border)" strokeWidth="1" strokeDasharray="2 4" />
            <text x={W - padX} y={y(g) - 4} textAnchor="end" fontSize="9" fill="var(--c-text-muted)">{g}%</text>
          </g>
        ))}

        <g clipPath={`url(#${id}-clip)`}>
          <path d={area} fill={`url(#${id}-fill)`} />
          <path d={line} fill="none" stroke="var(--c-indigo)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="var(--c-bg)" stroke="var(--c-indigo)" strokeWidth="2"
            style={{ opacity: inView ? 1 : 0, transition: `opacity 300ms ease-out ${600 + i * 70}ms` }} />
        ))}

        {/* x labels */}
        {series.map((s, i) => (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9.5" fontWeight="600"
            fill="var(--c-text-muted)">{s.label}</text>
        ))}

        {/* hover hit-areas */}
        {pts.map((p, k) => (
          <rect key={`hit${k}`} x={p.x - 18} y={0} width={36} height={H} fill="transparent"
            onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }} />
        ))}

        {/* tooltip */}
        {hover !== null && pts[hover] && (() => {
          const p = pts[hover], s = valid[hover], tw = 98, th = 40
          const tx = Math.min(Math.max(p.x - tw / 2, padX), W - padX - tw)
          const ty = Math.max(p.y - th - 12, 2)
          return (
            <g pointerEvents="none">
              <line x1={p.x} x2={p.x} y1={padTop} y2={padTop + plotH} stroke="var(--c-indigo)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              <circle cx={p.x} cy={p.y} r="5" fill="var(--c-indigo)" stroke="var(--c-bg)" strokeWidth="2" />
              <g transform={`translate(${tx},${ty})`}>
                <rect width={tw} height={th} rx="8" fill="var(--c-text)" />
                <text x={tw / 2} y={16} textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--c-bg)">{s.label} · {s.pct}%</text>
                <text x={tw / 2} y={30} textAnchor="middle" fontSize="9" fill="var(--c-bg)" opacity="0.7">{s.present}/{s.total} present</text>
              </g>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

interface Segment { label: string; value: number; color: string }

/** Role-distribution donut with animated arcs */
function Donut({ segments }: { segments: Segment[] }) {
  const { ref, inView } = useInView()
  const total = segments.reduce((s, x) => s + x.value, 0)
  const R = 46, SW = 16, C = 2 * Math.PI * R, size = 128
  const display = useCountUp(total, 1100, 200)

  let offset = 0
  return (
    <div ref={ref} className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="var(--c-surface)" strokeWidth={SW} />
          {total > 0 && segments.map((seg, i) => {
            const frac = seg.value / total
            const dash = frac * C
            const el = (
              <circle key={i} cx={size / 2} cy={size / 2} r={R} fill="none" stroke={seg.color}
                strokeWidth={SW} strokeLinecap="round"
                strokeDasharray={`${inView ? dash : 0} ${C}`}
                strokeDashoffset={-offset}
                style={{ transition: `stroke-dasharray 900ms var(--ease-out) ${i * 120}ms` }} />
            )
            offset += dash
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--c-text)", letterSpacing: "-0.03em" }}>{display}</span>
          <span className="text-[10px] font-medium" style={{ color: "var(--c-text-muted)" }}>people</span>
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
            <span className="text-xs font-medium flex-1 truncate" style={{ color: "var(--c-text-mid)" }}>{seg.label}</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: "var(--c-text)" }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   UI BLOCKS
══════════════════════════════════════════════════════════════ */

/** Gradient-mesh health spotlight — the signature moment */
function HealthSpotlight({ score, attendancePct, hwPct }: {
  score: number | null; attendancePct: number | null; hwPct: number | null
}) {
  const display = useCountUp(score ?? 0, 1200, 300)
  const [ringProgress, setRingProgress] = useState(0)
  const R = 34, circ = 2 * Math.PI * R

  useEffect(() => {
    if (score === null) return
    const t = setTimeout(() => {
      const start = performance.now(); let raf = 0
      const tick = (now: number) => {
        const p = Math.min((now - start) / 1200, 1)
        setRingProgress((1 - Math.pow(1 - p, 3)) * score)
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }, 300)
    return () => clearTimeout(t)
  }, [score])

  const verdict = score === null ? "Not enough data yet"
    : score >= 80 ? "Excellent — running smoothly"
    : score >= 60 ? "Good — a few areas to watch"
    : "Needs attention this week"

  return (
    <div className="relative overflow-hidden rounded-[22px] p-6 h-full" style={{
      background: "linear-gradient(140deg, var(--c-indigo) 0%, color-mix(in oklch, var(--c-indigo) 62%, #7c3aed) 56%, color-mix(in oklch, var(--c-indigo) 50%, #5b21b6) 100%)",
      boxShadow: "var(--shadow-card)",
    }}>
      {/* mesh highlights */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 50% at 80% 0%, rgba(255,255,255,0.28), transparent 60%), radial-gradient(ellipse 50% 60% at 0% 100%, rgba(255,255,255,0.12), transparent 60%)",
      }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: "rgba(255,255,255,0.18)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff" }}>
            <Sparkles size={11} /> School health
          </span>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative w-[88px] h-[88px] shrink-0">
            <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
              <circle cx="44" cy="44" r={R} fill="none" strokeWidth="7" stroke="rgba(255,255,255,0.22)" />
              <circle cx="44" cy="44" r={R} fill="none" strokeWidth="7" stroke="#fff" strokeLinecap="round"
                strokeDasharray={`${(ringProgress / 100) * circ} ${circ}`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold tabular-nums text-white">
              {score === null ? "—" : display}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold leading-snug" style={{ fontSize: "1.0625rem" }}>{verdict}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {attendancePct !== null && (
                <span className="text-xs font-semibold tabular-nums" style={{ color: "rgba(255,255,255,0.8)" }}>{attendancePct}% attendance</span>
              )}
              {hwPct !== null && (
                <span className="text-xs font-semibold tabular-nums" style={{ color: "rgba(255,255,255,0.8)" }}>{hwPct}% homework</span>
              )}
            </div>
          </div>
        </div>

        <Link href="/admin/analytics"
          className="inline-flex items-center gap-1.5 mt-5 rounded-full px-3.5 py-2 text-xs font-bold transition-transform active:scale-95"
          style={{ background: "#fff", color: "var(--c-indigo)", textDecoration: "none" }}>
          View analytics <ArrowUpRight size={13} />
        </Link>
      </div>
    </div>
  )
}

/** KPI card — soft float, count-up, real weekly delta */
function KPICard({ label, value, raw, delta, icon: Icon, href, color, delay }: {
  label: string; value: number; raw: number; delta: number
  icon: React.ElementType; href: string; color: string; delay: number
}) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} style={{
      transform: inView ? "translateY(0)" : "translateY(16px)",
      opacity: inView ? 1 : 0,
      transition: `transform 600ms var(--ease-out) ${delay}ms, opacity 480ms ease-out ${delay}ms`,
    }}>
      <Link href={href} className="card-float card-float-hover block p-4 group" style={{ textDecoration: "none" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
            style={{ background: `color-mix(in oklch, ${color} 14%, transparent)` }}>
            <Icon size={15} style={{ color }} />
          </div>
          {delta > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
              style={{ background: "var(--c-emerald-bg)", color: "var(--c-emerald)" }}>
              <TrendingUp size={10} /> {delta}
            </span>
          )}
        </div>
        <p className="text-[1.75rem] font-extrabold tabular-nums leading-none" style={{ color: raw === 0 ? "var(--c-text-muted)" : "var(--c-text)", letterSpacing: "-0.03em" }}>{value}</p>
        <p className="text-xs font-medium mt-1.5" style={{ color: "var(--c-text-muted)" }}>
          {label}{delta > 0 ? <span className="opacity-80"> · {delta} new this week</span> : raw === 0 ? <span> · add your first</span> : null}
        </p>
      </Link>
    </div>
  )
}

/** Compact metric stat (attendance / homework rate) */
function RateStat({ icon: Icon, label, value, displayValue, good, color, subtext }: {
  icon: React.ElementType; label: string; value: number | null; displayValue: string
  good: boolean; color: string; subtext: string
}) {
  const c = value === null ? "var(--c-text-muted)" : color
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={13} style={{ color: c }} />
        <span className="text-xs font-semibold" style={{ color: "var(--c-text-muted)" }}>{label}</span>
        {value !== null && (good
          ? <TrendingUp size={11} style={{ color: "var(--c-emerald)" }} />
          : <TrendingDown size={11} style={{ color: "var(--c-gold)" }} />)}
      </div>
      <p className="text-2xl font-extrabold tabular-nums" style={{ color: c, letterSpacing: "-0.03em" }}>{displayValue}</p>
      <p className="text-[11px] mt-0.5" style={{ color: "var(--c-text-muted)" }}>{subtext}</p>
    </div>
  )
}

function ActionCard({ label, href, icon: Icon, color }: {
  label: string; href: string; icon: React.ElementType; color: string
}) {
  return (
    <Link href={href} className="card-float card-float-hover flex items-center gap-3 p-3.5 group" style={{ textDecoration: "none" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{ background: `color-mix(in oklch, ${color} 14%, transparent)` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <p className="text-sm font-semibold flex-1" style={{ color: "var(--c-text)" }}>{label}</p>
      <ArrowRight size={14} className="transition-all group-hover:translate-x-0.5" style={{ color: "var(--c-text-muted)" }} />
    </Link>
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
  studentCount: number; teacherCount: number; classCount: number; parentCount: number
  attendancePct: number | null; presentCount: number; totalRecords: number
  hwRate: number | null; hwSubmitted: number; hwAssigned: number
  healthScore: number | null; healthColor: string
  attendanceSeries: SeriesPoint[]
  deltas: { students: number; teachers: number; parents: number; classes: number }
  recentProfiles: Array<{ id: string; full_name: string; role: string; created_at: string; is_active: boolean }>
  notifications: Array<{ id: string; title: string; body: string; type: string; created_at: string; is_read: boolean }>
  unreadCount: number
  greeting: string; today: string
}

/* ══════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════ */
export default function DashboardShell({
  profile, userId,
  studentCount, teacherCount, classCount, parentCount,
  attendancePct, presentCount, totalRecords,
  hwRate, hwSubmitted, hwAssigned,
  healthScore, attendanceSeries, deltas,
  recentProfiles, notifications, unreadCount,
  greeting, today,
}: DashboardShellProps) {

  const students = useSpringCount(studentCount, 60)
  const teachers = useSpringCount(teacherCount, 130)
  const classes  = useSpringCount(classCount, 200)
  const parents  = useSpringCount(parentCount, 270)
  const attPct   = useCountUp(attendancePct ?? 0, 1100, 400)
  const hwPct    = useCountUp(hwRate ?? 0, 1100, 500)

  const [headerVisible, setHeaderVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setHeaderVisible(true), 40); return () => clearTimeout(t) }, [])

  const planColors: Record<string, string> = {
    free: "var(--c-text-muted)", starter: "var(--c-indigo)", pro: "var(--c-emerald)", enterprise: "var(--c-gold)",
  }
  const usagePct = Math.min(100, Math.round((profile.school.student_count / profile.school.max_students) * 100))

  const kpis = [
    { label: "Students", value: students, raw: studentCount, delta: deltas.students, icon: GraduationCap, href: "/admin/students", color: "var(--c-indigo)" },
    { label: "Teachers", value: teachers, raw: teacherCount, delta: deltas.teachers, icon: Users,          href: "/admin/teachers", color: "var(--c-emerald)" },
    { label: "Classes",  value: classes,  raw: classCount,   delta: deltas.classes,  icon: BookOpen,       href: "/admin/classes",  color: "var(--c-gold)" },
    { label: "Parents",  value: parents,  raw: parentCount,  delta: deltas.parents,  icon: Users,          href: "/admin/students", color: "var(--c-info)" },
  ]

  const donutSegments: Segment[] = [
    { label: "Students", value: studentCount, color: "var(--c-indigo)" },
    { label: "Teachers", value: teacherCount, color: "var(--c-emerald)" },
    { label: "Parents",  value: parentCount,  color: "var(--c-info)" },
  ]

  return (
    <div className="p-5 sm:p-7 pb-24 md:pb-8 max-w-[1180px] mx-auto">
      <DashboardTour userId={userId} userName={profile.full_name} />

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 mb-7 pt-1" style={{
        transform: headerVisible ? "translateY(0)" : "translateY(-10px)",
        opacity: headerVisible ? 1 : 0,
        transition: "transform 600ms var(--ease-out), opacity 500ms ease-out",
      }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--c-text-muted)" }}>{today}</p>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight leading-none" style={{ color: "var(--c-text)", letterSpacing: "-0.03em" }}>
            {greeting}, {profile.full_name.split(" ")[0]}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--c-text-mid)" }}>{profile.school.name}</p>
        </div>
        {unreadCount > 0 && (
          <Link href="/admin/alerts" className="card-float card-float-hover flex items-center gap-2 px-3.5 py-2.5 shrink-0" style={{ textDecoration: "none" }}>
            <PulseDot />
            <span className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{unreadCount}</span>
            <Bell size={14} style={{ color: "var(--c-text-muted)" }} />
          </Link>
        )}
      </div>

      <Reveal delay={60} className="mb-6">
        <AdminWelcomeGuide
          userName={profile.full_name} userId={userId} schoolSlug={profile.school.slug}
          hasTeachers={teacherCount > 0} hasStudents={studentCount > 0} hasClasses={classCount > 0}
          plan={profile.school.subscription_plan}
        />
      </Reveal>

      {/* ── Spotlight + KPIs ── */}
      <div className="grid lg:grid-cols-[1.05fr_1.25fr] gap-5 mb-5">
        <div data-tour="health-card">
          <Reveal delay={90}>
            <HealthSpotlight score={healthScore} attendancePct={attendancePct} hwPct={hwRate} />
          </Reveal>
        </div>
        <div className="grid grid-cols-2 gap-4" data-tour="stat-cards">
          {kpis.map((k, i) => (
            <KPICard key={k.label} {...k} delay={i * 60} />
          ))}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-[1fr_330px] gap-5">

        {/* Left */}
        <div className="space-y-5">
          {/* Attendance trend */}
          <Reveal>
            <div className="card-float p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Attendance this week</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
                    {totalRecords > 0 ? `${presentCount} of ${totalRecords} records present` : "No attendance recorded yet"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold tabular-nums leading-none"
                    style={{ color: attendancePct === null ? "var(--c-text-muted)" : attendancePct >= 80 ? "var(--c-emerald)" : "var(--c-gold)", letterSpacing: "-0.03em" }}>
                    {attendancePct !== null ? `${attPct}%` : "—"}
                  </p>
                  <p className="text-[11px] mt-1 font-medium" style={{ color: "var(--c-text-muted)" }}>7-day rate</p>
                </div>
              </div>
              <AttendanceChart series={attendanceSeries} />
            </div>
          </Reveal>

          {/* Homework + Donut */}
          <div className="grid sm:grid-cols-2 gap-5">
            <Reveal delay={60}>
              <div className="card-float p-5 h-full">
                <h2 className="text-sm font-bold mb-4" style={{ color: "var(--c-text)" }}>This week</h2>
                <div className="flex gap-5">
                  <RateStat icon={CheckCircle2} label="Attendance" value={attendancePct}
                    displayValue={attendancePct !== null ? `${attPct}%` : "—"} good={(attendancePct ?? 0) >= 80}
                    color="var(--c-emerald)" subtext={`${presentCount}/${totalRecords || 0} present`} />
                  <div className="w-px self-stretch" style={{ background: "var(--c-border)" }} />
                  <RateStat icon={BookOpen} label="Homework" value={hwRate}
                    displayValue={hwRate !== null ? `${hwPct}%` : "—"} good={(hwRate ?? 0) >= 70}
                    color="var(--c-indigo)" subtext={`${hwSubmitted}/${hwAssigned || 0} submitted`} />
                </div>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="card-float p-5 h-full">
                <h2 className="text-sm font-bold mb-4" style={{ color: "var(--c-text)" }}>Community</h2>
                <Donut segments={donutSegments} />
              </div>
            </Reveal>
          </div>

          {/* Quick actions */}
          <section data-tour="quick-actions">
            <Reveal><h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>Quick actions</h2></Reveal>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Add student",  href: "/admin/students?add=1", icon: GraduationCap, color: "var(--c-indigo)" },
                { label: "Add teacher",  href: "/admin/teachers?add=1", icon: Users,         color: "var(--c-emerald)" },
                { label: "Create class", href: "/admin/classes?add=1",  icon: BookOpen,      color: "var(--c-gold)" },
                { label: "View reports", href: "/admin/analytics",      icon: BarChart3,     color: "var(--c-info)" },
              ].map(a => <Reveal key={a.label} delay={40}><ActionCard {...a} /></Reveal>)}
            </div>
          </section>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {/* Subscription */}
          <Reveal delay={60}>
            <div className="card-float p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Subscription</p>
                <span className="badge" style={{
                  background: `color-mix(in oklch, ${planColors[profile.school.subscription_plan] ?? "var(--c-text-muted)"} 16%, transparent)`,
                  color: planColors[profile.school.subscription_plan] ?? "var(--c-text-muted)",
                }}>
                  {profile.school.subscription_plan.charAt(0).toUpperCase() + profile.school.subscription_plan.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>Students</span>
                <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--c-text)" }}>
                  {profile.school.student_count} / {profile.school.max_students}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: "var(--c-surface)" }}>
                <div className="h-full rounded-full" style={{
                  width: `${usagePct}%`, background: usagePct > 90 ? "var(--c-red)" : "var(--c-indigo)",
                  transition: "width 1s var(--ease-out)",
                }} />
              </div>
              <Link href="/admin/billing" className="inline-flex items-center gap-1.5 text-xs font-semibold group" style={{ color: "var(--c-indigo)", textDecoration: "none" }}>
                <CreditCard size={12} /> Manage plan
                <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>

          {/* Recent members */}
          <section data-tour="recent-members">
            <Reveal>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>Recent members</h2>
                <Link href="/admin/students" className="text-xs font-semibold" style={{ color: "var(--c-indigo)", textDecoration: "none" }}>View all</Link>
              </div>
            </Reveal>
            {recentProfiles.length > 0 ? (
              <div className="card-float overflow-hidden">
                {recentProfiles.map((p, i) => <MemberRow key={p.id} member={p} last={i === recentProfiles.length - 1} delay={70 + i * 50} />)}
              </div>
            ) : (
              <EmptyState icon={Users} label="Members" href="/admin/teachers" cta="Invite teachers" />
            )}
          </section>

          <Reveal><AICallout /></Reveal>

          {notifications.length > 0 && (
            <section>
              <Reveal><h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>Alerts</h2></Reveal>
              <div className="space-y-2.5">
                {notifications.map((n, i) => <AlertCard key={n.id} notification={n} delay={i * 50} />)}
              </div>
            </section>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
      `}</style>
    </div>
  )
}

/* ── Empty state ── */
function EmptyState({ icon: Icon, label, href, cta }: { icon: React.ElementType; label: string; href: string; cta: string }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className="card-float px-5 py-9 flex flex-col items-center gap-3 text-center" style={{
      opacity: inView ? 1 : 0, transform: inView ? "scale(1)" : "scale(0.97)",
      transition: "opacity 400ms ease-out, transform 500ms var(--ease-spring)",
    }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--c-indigo-bg)" }}>
        <Icon size={20} style={{ color: "var(--c-indigo)" }} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>No {label.toLowerCase()} yet</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>Get started by adding your first {label.toLowerCase().replace(/s$/, "")}.</p>
      </div>
      <Link href={href} className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-transform active:scale-95"
        style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)", textDecoration: "none" }}>
        {cta} <ArrowRight size={11} />
      </Link>
    </div>
  )
}

/* ── Member row ── */
function MemberRow({ member, last, delay }: {
  member: { id: string; full_name: string; role: string; created_at: string; is_active: boolean }; last: boolean; delay: number
}) {
  const [hovered, setHovered] = useState(false)
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className="flex items-center gap-3 px-4 py-3"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--c-surface)" : "transparent",
        borderBottom: last ? "none" : "1px solid var(--c-border)",
        opacity: inView ? 1 : 0, transform: inView ? "translateX(0)" : "translateX(-8px)",
        transition: `opacity 380ms ease-out ${delay}ms, transform 380ms var(--ease-out) ${delay}ms, background 180ms ease`,
      }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ background: avatarColor(member.full_name) }}>{getInitials(member.full_name)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{member.full_name}</p>
        <p className="text-xs capitalize" style={{ color: "var(--c-text-muted)" }}>{member.role.replace("_", " ")}</p>
      </div>
      <span className="badge" style={{
        background: member.is_active ? "var(--c-emerald-bg)" : "var(--c-red-bg)",
        color: member.is_active ? "var(--c-emerald)" : "var(--c-red)",
      }}>{member.is_active ? "Active" : "Pending"}</span>
    </div>
  )
}

/* ── AI callout ── */
function AICallout() {
  return (
    <div className="card-float card-float-hover p-5" data-tour="ai-reports" style={{
      background: "linear-gradient(135deg, var(--c-indigo-bg), var(--c-bg))",
    }}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} style={{ color: "var(--c-indigo)" }} />
        <span className="badge badge-indigo text-[10px]">✦ AI · Claude-powered</span>
      </div>
      <p className="text-sm font-bold mb-1" style={{ color: "var(--c-text)" }}>Weekly reports, written for you</p>
      <p className="text-xs leading-relaxed" style={{ color: "var(--c-text-mid)" }}>
        Teachers use Claude to generate personalised weekly reports for every parent. Enable AI in Settings to configure.
      </p>
      <Link href="/admin/settings" className="inline-flex items-center gap-1 text-xs font-semibold mt-3 group" style={{ color: "var(--c-indigo)", textDecoration: "none" }}>
        Configure AI <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  )
}

/* ── Alert card ── */
function AlertCard({ notification: n, delay }: {
  notification: { id: string; title: string; body: string; type: string; created_at: string; is_read: boolean }; delay: number
}) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className="card-float card-float-hover px-4 py-3" style={{
      opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(8px)",
      transition: `opacity 350ms ease-out ${delay}ms, transform 350ms var(--ease-out) ${delay}ms`,
    }}>
      <div className="flex items-start gap-2.5">
        {!n.is_read && <span className="mt-1.5"><PulseDot /></span>}
        <div className="flex-1 min-w-0" style={{ opacity: n.is_read ? 0.6 : 1 }}>
          <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{n.title}</p>
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--c-text-muted)" }}>{n.body}</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--c-text-muted)" }}>{formatDate(n.created_at, "time")}</p>
        </div>
      </div>
    </div>
  )
}
