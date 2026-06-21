"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, ArrowRight, TrendingUp } from "lucide-react"

/* ── motion ── */
export function useCountUp(target: number, duration = 1000, delay = 0) {
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

export function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className={className} style={{
      transform: inView ? "translateY(0)" : "translateY(16px)",
      opacity: inView ? 1 : 0,
      transition: `transform 640ms var(--ease-out) ${delay}ms, opacity 520ms ease-out ${delay}ms`,
    }}>{children}</div>
  )
}

export function PulseDot({ color = "var(--c-indigo)" }: { color?: string }) {
  return (
    <span className="relative flex w-2.5 h-2.5 shrink-0">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: color, animation: "kitPing 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
      <span className="relative inline-flex w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <style>{`@keyframes kitPing{75%,100%{transform:scale(2);opacity:0}}`}</style>
    </span>
  )
}

/* ── KPI stat tile (count-up, soft float, optional delta) ── */
export function StatTile({ label, value, icon, color, sub, delta, href, delay = 0 }: {
  label: string; value: number | string; icon: React.ReactNode; color: string
  sub?: string; delta?: number; href?: string; delay?: number
}) {
  const { ref, inView } = useInView()
  const numeric = typeof value === "number"
  const counted = useCountUp(numeric ? (value as number) : 0, 1000, delay)
  const display = numeric ? counted : value
  const zero = numeric && value === 0

  const inner = (
    <>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
          style={{ background: `color-mix(in oklch, ${color} 14%, transparent)`, color }}>
          {icon}
        </div>
        {delta && delta > 0 ? (
          <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
            style={{ background: "var(--c-emerald-bg)", color: "var(--c-emerald)" }}>
            <TrendingUp size={10} /> {delta}
          </span>
        ) : null}
      </div>
      <p className="text-[1.75rem] font-extrabold tabular-nums leading-none"
        style={{ color: zero ? "var(--c-text-muted)" : "var(--c-text)", letterSpacing: "-0.03em" }}>{display}</p>
      <p className="text-xs font-medium mt-1.5" style={{ color: "var(--c-text-muted)" }}>{label}{sub ? <span className="opacity-80"> · {sub}</span> : null}</p>
    </>
  )

  const cls = "card-float card-float-hover block p-4 group"
  return (
    <div ref={ref} style={{
      transform: inView ? "translateY(0)" : "translateY(16px)", opacity: inView ? 1 : 0,
      transition: `transform 600ms var(--ease-out) ${delay}ms, opacity 480ms ease-out ${delay}ms`,
    }}>
      {href ? <Link href={href} className={cls} style={{ textDecoration: "none" }}>{inner}</Link> : <div className={cls}>{inner}</div>}
    </div>
  )
}

/* ── Gradient-mesh spotlight hero ── */
export function Spotlight({ eyebrow, ring, value, headline, chips, ctaHref, ctaLabel }: {
  eyebrow: string
  ring?: number | null              // 0-100 → render a progress ring with the number inside
  value?: string                    // big text shown when no ring
  headline: string
  chips?: string[]
  ctaHref: string; ctaLabel: string
}) {
  const display = useCountUp(ring ?? 0, 1200, 300)
  const [prog, setProg] = useState(0)
  const R = 34, circ = 2 * Math.PI * R
  useEffect(() => {
    if (ring == null) return
    const t = setTimeout(() => {
      const start = performance.now(); let raf = 0
      const tick = (now: number) => { const p = Math.min((now - start) / 1200, 1); setProg((1 - Math.pow(1 - p, 3)) * ring); if (p < 1) raf = requestAnimationFrame(tick) }
      raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf)
    }, 300)
    return () => clearTimeout(t)
  }, [ring])

  return (
    <div className="relative overflow-hidden rounded-[22px] p-6 h-full" style={{
      background: "linear-gradient(140deg, var(--c-indigo) 0%, color-mix(in oklch, var(--c-indigo) 62%, #7c3aed) 56%, color-mix(in oklch, var(--c-indigo) 50%, #5b21b6) 100%)",
      boxShadow: "var(--shadow-card)",
    }}>
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 60% 50% at 80% 0%, rgba(255,255,255,0.28), transparent 60%), radial-gradient(ellipse 50% 60% at 0% 100%, rgba(255,255,255,0.12), transparent 60%)",
      }} />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 mb-5"
          style={{ background: "rgba(255,255,255,0.18)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff" }}>{eyebrow}</span>

        <div className="flex items-center gap-5">
          {ring != null ? (
            <div className="relative w-[88px] h-[88px] shrink-0">
              <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                <circle cx="44" cy="44" r={R} fill="none" strokeWidth="7" stroke="rgba(255,255,255,0.22)" />
                <circle cx="44" cy="44" r={R} fill="none" strokeWidth="7" stroke="#fff" strokeLinecap="round" strokeDasharray={`${(prog / 100) * circ} ${circ}`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-extrabold tabular-nums text-white">{display}%</span>
            </div>
          ) : value ? (
            <span className="text-5xl font-extrabold tabular-nums text-white shrink-0" style={{ letterSpacing: "-0.03em" }}>{value}</span>
          ) : null}
          <div className="min-w-0">
            <p className="text-white font-bold leading-snug" style={{ fontSize: "1.0625rem" }}>{headline}</p>
            {chips && chips.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {chips.map((c, i) => <span key={i} className="text-xs font-semibold tabular-nums" style={{ color: "rgba(255,255,255,0.8)" }}>{c}</span>)}
              </div>
            )}
          </div>
        </div>

        <Link href={ctaHref} className="inline-flex items-center gap-1.5 mt-5 rounded-full px-3.5 py-2 text-xs font-bold transition-transform active:scale-95"
          style={{ background: "#fff", color: "var(--c-indigo)", textDecoration: "none" }}>{ctaLabel} <ArrowUpRight size={13} /></Link>
      </div>
    </div>
  )
}

/* ── Donut ── */
export interface DonutSegment { label: string; value: number; color: string }
export function Donut({ segments, centerLabel = "total" }: { segments: DonutSegment[]; centerLabel?: string }) {
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
            const dash = (seg.value / total) * C
            const el = (
              <circle key={i} cx={size / 2} cy={size / 2} r={R} fill="none" stroke={seg.color} strokeWidth={SW} strokeLinecap="round"
                strokeDasharray={`${inView ? dash : 0} ${C}`} strokeDashoffset={-offset}
                style={{ transition: `stroke-dasharray 900ms var(--ease-out) ${i * 120}ms` }} />
            )
            offset += dash
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--c-text)", letterSpacing: "-0.03em" }}>{display}</span>
          <span className="text-[10px] font-medium" style={{ color: "var(--c-text-muted)" }}>{centerLabel}</span>
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

/* ── Alerts pill ── */
export function AlertsPill({ count, href }: { count: number; href: string }) {
  if (count <= 0) return null
  return (
    <Link href={href} className="card-float card-float-hover flex items-center gap-2 px-3.5 py-2.5 shrink-0" style={{ textDecoration: "none" }}>
      <PulseDot />
      <span className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{count}</span>
      <ArrowRight size={13} style={{ color: "var(--c-text-muted)" }} />
    </Link>
  )
}
