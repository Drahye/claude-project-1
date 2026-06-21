"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "@/components/ThemeProvider"
import {
  GraduationCap, Sparkles, CheckCircle2, Bell,
  BarChart3, Users, BookOpen, ChevronLeft, ChevronRight,
} from "lucide-react"

/* ── Slides data ─────────────────────────────────────────────────────────── */
const SLIDES = [
  {
    id: "ai",
    tag: "AI-Powered",
    tagColor: "#fca98f",
    headline: "Reports that write\nthemselves",
    body: "Claude generates a personalised weekly report for every parent — attendance, homework, and teacher notes — in one click every Friday.",
    author: "Mrs. Patricia Coleman",
    role: "Head of Year 4 · Brightwood Academy",
    quote: "The Weekly Report alone saved my sanity. I actually look forward to Fridays now.",
    accent: "#f4795b",
    visual: <AIReportVisual />,
  },
  {
    id: "attendance",
    tag: "Attendance",
    tagColor: "#34d399",
    headline: "Absences caught\nbefore parents notice",
    body: "Mark attendance in seconds. Parents receive an automatic WhatsApp-style alert when their child is absent — no admin chasing required.",
    author: "Mr. Seun Adeyemi",
    role: "School Director · Greenfield Schools, Lagos",
    quote: "We cut late-arrival incidents by 40% in the first half-term alone.",
    accent: "#059669",
    visual: <AttendanceVisual />,
  },
  {
    id: "parents",
    tag: "Parent Portal",
    tagColor: "#60a5fa",
    headline: "Parents always\nin the loop",
    body: "Homework, reports, and events — all visible to parents in a single tap. No app download needed. Works on any phone.",
    author: "Mrs. Amara Okafor",
    role: "PTA Chair · Sunrise Academy, Abuja",
    quote: "I know exactly how my child is doing before I even ask them.",
    accent: "#2563eb",
    visual: <ParentVisual />,
  },
  {
    id: "analytics",
    tag: "Analytics",
    tagColor: "#fbbf24",
    headline: "Your school's pulse,\nat a glance",
    body: "Track attendance trends, homework completion, and fee collection. Real data, clear decisions — no spreadsheets.",
    author: "Dr. Kwame Mensah",
    role: "Principal · Accra International School",
    quote: "Finally a dashboard I can actually read in a morning briefing.",
    accent: "#d97706",
    visual: <AnalyticsVisual />,
  },
]

const INTERVAL = 5000

/* ── Slide visuals ───────────────────────────────────────────────────────── */
function AIReportVisual() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ background: "rgba(244,121,91,0.22)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-[#fca98f]" />
          <span className="text-xs font-bold text-[#fca98f]">Friday story</span>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f4795b]/30 text-[#fdc3b0]">AI · Claude</span>
      </div>
      <div className="p-4 space-y-3">
        {/* Student */}
        <div>
          <p className="text-sm font-bold text-white">Amara Osei-Mensah</p>
          <p className="text-xs text-white/50">Week 3 · Term 2 · Year 6A</p>
        </div>
        {/* Attendance dots */}
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5">Attendance</p>
          <div className="flex gap-1.5">
            {["M","T","W","T","F"].map((d, i) => (
              <div key={d} className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: i === 2 ? "rgba(239,68,68,0.3)" : "rgba(52,211,153,0.25)" }}>
                  {i === 2
                    ? <span className="text-[9px] font-bold text-red-400">A</span>
                    : <CheckCircle2 size={11} className="text-emerald-400" />}
                </div>
                <span className="text-[9px] text-white/40">{d}</span>
              </div>
            ))}
          </div>
        </div>
        {/* AI summary */}
        <div className="rounded-xl p-3" style={{ background: "rgba(244,121,91,0.15)", border: "1px solid rgba(244,121,91,0.3)" }}>
          <p className="text-[11px] leading-relaxed text-white/70 italic">
            "Amara showed exceptional focus this week. Her science presentation impressed the class and demonstrated strong analytical thinking…"
          </p>
        </div>
        {/* Homework bar */}
        <div>
          <div className="flex justify-between mb-1">
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Homework</p>
            <p className="text-[10px] font-bold text-emerald-400">4/4</p>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: "100%" }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function AttendanceVisual() {
  const students = [
    { name: "Chidi O.", status: "present" },
    { name: "Fatima A.", status: "present" },
    { name: "Daniel K.", status: "absent" },
    { name: "Grace M.", status: "late" },
    { name: "Ibrahim S.", status: "present" },
    { name: "Adaeze N.", status: "present" },
  ]
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background: "rgba(5,150,105,0.2)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300">Year 6A · Monday 2 June</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-400">5/6</span>
      </div>
      <div className="p-3 space-y-1.5">
        {students.map(s => (
          <div key={s.name} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: "rgba(255,255,255,0.12)" }}>
                {s.name.split(" ")[0][0]}{s.name.split(" ")[1]?.[0]}
              </div>
              <p className="text-xs font-medium text-white/80">{s.name}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
              background: s.status === "present" ? "rgba(52,211,153,0.2)" : s.status === "absent" ? "rgba(239,68,68,0.2)" : "rgba(251,191,36,0.2)",
              color: s.status === "present" ? "#34d399" : s.status === "absent" ? "#f87171" : "#fbbf24",
            }}>
              {s.status === "present" ? "✓ Present" : s.status === "absent" ? "✗ Absent" : "~ Late"}
            </span>
          </div>
        ))}
      </div>
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <Bell size={11} className="text-red-400 shrink-0" />
          <p className="text-[10px] text-red-300">Absence alert sent to Daniel K.'s parent</p>
        </div>
      </div>
    </div>
  )
}

function ParentVisual() {
  return (
    <div className="space-y-2.5">
      {/* Phone notification cards */}
      {[
        { icon: BookOpen, color: "#60a5fa", title: "New homework assigned", body: "Maths — due Friday 7 June", time: "2m ago", unread: true },
        { icon: CheckCircle2, color: "#34d399", title: "Report ready", body: "Amara's Week 3 report is available", time: "1h ago", unread: true },
        { icon: Bell, color: "#fbbf24", title: "Events this week", body: "Sports Day — Tue · Maths test — Thu", time: "3h ago", unread: false },
      ].map((n, i) => (
        <div key={i}
          className="flex items-start gap-3 px-4 py-3.5 rounded-2xl transition-all"
          style={{ background: n.unread ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center" style={{ background: `${n.color}22` }}>
            <n.icon size={15} style={{ color: n.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-xs font-bold text-white truncate">{n.title}</p>
              <span className="text-[9px] text-white/40 shrink-0">{n.time}</span>
            </div>
            <p className="text-[11px] text-white/55 truncate">{n.body}</p>
          </div>
          {n.unread && <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1" />}
        </div>
      ))}
      <div className="text-center pt-1">
        <p className="text-[10px] text-white/30">Works on any phone · No app download needed</p>
      </div>
    </div>
  )
}

function AnalyticsVisual() {
  const metrics = [
    { label: "Attendance", value: 91, color: "#34d399", change: "+4%" },
    { label: "Homework", value: 78, color: "#60a5fa", change: "+11%" },
    { label: "Fee collection", value: 84, color: "#f4795b", change: "+7%" },
  ]
  const bars = [72, 85, 78, 91, 88, 84, 91]
  const days = ["M","T","W","T","F","S","S"]
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <BarChart3 size={13} className="text-yellow-400" />
        <span className="text-xs font-bold text-yellow-300">School health — this week</span>
      </div>
      <div className="p-4 space-y-3">
        {/* Bar chart */}
        <div className="flex items-end gap-1.5 h-16">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-sm" style={{ height: `${h}%`, background: i === 6 ? "#fbbf24" : "rgba(251,191,36,0.35)", transition: "height 600ms ease-out" }} />
              <p className="text-[8px] text-white/30">{days[i]}</p>
            </div>
          ))}
        </div>
        {/* Metric bars */}
        <div className="space-y-2.5">
          {metrics.map(m => (
            <div key={m.label}>
              <div className="flex justify-between mb-1">
                <p className="text-[10px] text-white/50">{m.label}</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] font-bold text-white">{m.value}%</p>
                  <span className="text-[9px] font-semibold text-emerald-400">{m.change}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${m.value}%`, background: m.color }} />
              </div>
            </div>
          ))}
        </div>
        {/* Footer stat */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <Users size={11} className="text-white/40" />
            <p className="text-[10px] text-white/40">800+ schools trust Scholr</p>
          </div>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(s => <span key={s} className="text-yellow-400 text-[10px]">★</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main slider ─────────────────────────────────────────────────────────── */
export default function AuthSlider() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<"next" | "prev">("next")
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Slider stays dark in both themes — it's an intentional contrast panel.
  // Light mode: deep indigo-slate.  Dark mode: near-black navy.
  const panelBg    = isDark ? "oklch(9% 0.02 264)"  : "oklch(20% 0.09 264)"
  const textHigh   = "oklch(97% 0.004 264)"
  const textMid    = isDark ? "oklch(58% 0.01 264)" : "oklch(70% 0.01 264)"
  const textLow    = isDark ? "oklch(44% 0.008 264)": "oklch(55% 0.01 264)"
  const glassCard  = isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.07)"
  const glassBorder= isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.14)"
  const btnBg      = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.10)"
  const dotInactive= isDark ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.28)"

  function goTo(idx: number, dir: "next" | "prev" = "next") {
    if (animating || idx === current) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setCurrent(idx)
      setAnimating(false)
    }, 320)
  }

  function next() { goTo((current + 1) % SLIDES.length, "next") }
  function prev() { goTo((current - 1 + SLIDES.length) % SLIDES.length, "prev") }

  // Auto-advance
  useEffect(() => {
    const t = setInterval(next, INTERVAL)
    return () => clearInterval(t)
  }, [current]) // eslint-disable-line react-hooks/exhaustive-deps

  const slide = SLIDES[current]

  return (
    <div
      className="hidden lg:flex flex-col relative overflow-y-auto overflow-x-hidden transition-colors duration-500"
      style={{ flex: "0 0 40%", background: panelBg }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 30% 60%, ${slide.accent}${isDark ? "18" : "30"} 0%, transparent 65%)`,
        }}
      />

      {/* Logo */}
      <div className="relative px-10 pt-10 shrink-0">
        <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="font-extrabold text-lg tracking-tight"
            style={{ color: textHigh, letterSpacing: "-0.02em" }}>
            Scholr
          </span>
        </Link>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col justify-center px-10 py-8 min-h-0">
        <div
          style={{
            opacity:   animating ? 0 : 1,
            transform: animating
              ? direction === "next" ? "translateX(-20px)" : "translateX(20px)"
              : "translateX(0)",
            transition: "opacity 320ms cubic-bezier(0.23,1,0.32,1), transform 320ms cubic-bezier(0.23,1,0.32,1)",
          }}
        >
          {/* Tag */}
          <div className="flex items-center gap-2 mb-5">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: `${slide.accent}25`, color: slide.tagColor, border: `1px solid ${slide.accent}50` }}
            >
              {slide.tag}
            </span>
          </div>

          {/* Headline */}
          <h2
            className="font-extrabold leading-tight mb-4 whitespace-pre-line"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              color: textHigh,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            {slide.headline}
          </h2>

          {/* Body */}
          <p className="text-sm leading-relaxed mb-6" style={{ color: textMid }}>
            {slide.body}
          </p>

          {/* Visual */}
          <div className="mb-6">{slide.visual}</div>

          {/* Quote */}
          <div
            className="rounded-2xl px-4 py-3.5"
            style={{ background: glassCard, border: `1px solid ${glassBorder}` }}
          >
            <p className="text-xs italic leading-relaxed mb-2" style={{ color: textMid }}>
              &ldquo;{slide.quote}&rdquo;
            </p>
            <div>
              <p className="text-xs font-semibold" style={{ color: textHigh }}>{slide.author}</p>
              <p className="text-[10px]" style={{ color: textLow }}>{slide.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: dots + arrows + flags */}
      <div className="relative px-10 pb-10 shrink-0">
        <div className="flex items-center justify-between mb-5">
          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i, i > current ? "next" : "prev")}
                className="rounded-full transition-all duration-300"
                style={{
                  width:      i === current ? 20 : 6,
                  height:     6,
                  background: i === current ? slide.tagColor : dotInactive,
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Arrow controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={prev}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80 active:scale-90"
              style={{ background: btnBg, color: textMid }}
              aria-label="Previous slide"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={next}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80 active:scale-90"
              style={{ background: btnBg, color: textMid }}
              aria-label="Next slide"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Country flags */}
        <div className="flex gap-3 items-center">
          {["🇺🇸", "🇬🇧", "🇳🇬", "🇬🇭", "🇨🇦"].map(f => (
            <span key={f} className="text-xl opacity-70 hover:opacity-100 transition-opacity cursor-default">{f}</span>
          ))}
          <span className="text-[10px] ml-1" style={{ color: "oklch(42% 0.008 264)" }}>800+ schools</span>
        </div>
      </div>
    </div>
  )
}
