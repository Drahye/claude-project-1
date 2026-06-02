"use client"
import {
  Users, GraduationCap, BookOpen, Heart,
  TrendingUp, TrendingDown, CheckCircle2,
  XCircle, Clock, AlertCircle, Sparkles,
} from "lucide-react"

interface Props {
  schoolName: string
  overview: {
    students: number
    teachers: number
    classes: number
    parents: number
    reports: number
  }
  attendance: {
    total: number
    present: number
    late: number
    absent: number
    excused: number
    overallRate: number
  }
  homework: {
    assigned: number
    submitted: number
    overdue: number
    rate: number
  }
  trendDays: Array<{
    label: string
    date: string
    present: number
    absent: number
    total: number
  }>
  classStats: Array<{
    id: string
    name: string
    grade_level: string
    present: number
    absent: number
    total: number
    rate: number
  }>
  todayStr: string
  sevenStr: string
}

// ── Mini sparkline SVG ────────────────────────────────────────────────────────
function Sparkline({ data, color = "var(--c-indigo)" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data, 1)
  const w = 80
  const h = 28
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * h
    return `${x},${y}`
  }).join(" ")

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Attendance bar chart (14 days) ─────────────────────────────────────────────
function AttendanceTrendChart({ days }: { days: Props["trendDays"] }) {
  const maxTotal = Math.max(...days.map(d => d.total), 1)

  return (
    <div>
      <div className="flex items-end gap-1 h-28">
        {days.map((day) => {
          const totalH  = maxTotal > 0 ? (day.total  / maxTotal) * 100 : 0
          const presentH = day.total > 0 ? (day.present / day.total) * totalH : 0
          const absentH  = day.total > 0 ? (day.absent  / day.total) * totalH : 0
          const otherH   = totalH - presentH - absentH

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5 group">
              {/* Tooltip */}
              <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"
                style={{ background: "var(--c-text)", color: "var(--c-bg)" }}
              >
                {day.total > 0
                  ? `${Math.round((day.present / day.total) * 100)}% present`
                  : "No data"}
              </div>

              <div className="relative w-full flex flex-col-reverse rounded-sm overflow-hidden" style={{ height: "100px" }}>
                {/* Present */}
                <div
                  className="w-full transition-all duration-500"
                  style={{
                    height: `${presentH}%`,
                    background: "var(--c-emerald)",
                    opacity: day.total === 0 ? 0.15 : 0.8,
                  }}
                />
                {/* Other (late/excused) */}
                <div
                  className="w-full transition-all duration-500"
                  style={{ height: `${otherH}%`, background: "var(--c-gold)", opacity: 0.7 }}
                />
                {/* Absent */}
                <div
                  className="w-full transition-all duration-500"
                  style={{ height: `${absentH}%`, background: "var(--c-red)", opacity: 0.7 }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-1 mt-2">
        {days.map((day, i) => (
          <div key={day.date} className="flex-1 text-center">
            {(i % 2 === 0) && (
              <span className="text-[9px]" style={{ color: "var(--c-text-muted)" }}>{day.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        {[
          { label: "Present", color: "var(--c-emerald)" },
          { label: "Absent",  color: "var(--c-red)"     },
          { label: "Late / Excused", color: "var(--c-gold)" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
            <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Donut ring chart ───────────────────────────────────────────────────────────
function DonutChart({ rate, size = 80, color = "var(--c-emerald)" }: { rate: number; size?: number; color?: string }) {
  const r  = (size / 2) - 8
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const dash = (rate / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--c-border)" strokeWidth="7" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 700ms cubic-bezier(0.32,0.72,0,1)" }}
      />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="700" fill="var(--c-text)">
        {rate}%
      </text>
    </svg>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AnalyticsView({
  overview,
  attendance,
  homework,
  trendDays,
  classStats,
}: Props) {
  const sparklineData = trendDays.map(d => d.total > 0 ? Math.round((d.present / d.total) * 100) : 0)

  const OVERVIEW_CARDS = [
    { icon: Users,          label: "Active students", value: overview.students, color: "var(--c-indigo)",  bg: "var(--c-indigo-bg)"  },
    { icon: GraduationCap,  label: "Teachers",        value: overview.teachers, color: "var(--c-emerald)", bg: "var(--c-emerald-bg)" },
    { icon: BookOpen,       label: "Classes",         value: overview.classes,  color: "var(--c-gold)",   bg: "var(--c-gold-bg)"    },
    { icon: Heart,          label: "Parents",         value: overview.parents,  color: "var(--c-indigo)",  bg: "var(--c-indigo-bg)"  },
    { icon: Sparkles,       label: "AI reports",      value: overview.reports,  color: "var(--c-emerald)", bg: "var(--c-emerald-bg)" },
  ]

  const statusItems = [
    { icon: CheckCircle2, label: "Present",  value: attendance.present,  color: "var(--c-emerald)" },
    { icon: Clock,        label: "Late",     value: attendance.late,     color: "var(--c-gold)"   },
    { icon: XCircle,      label: "Absent",   value: attendance.absent,   color: "var(--c-red)"    },
    { icon: AlertCircle,  label: "Excused",  value: attendance.excused,  color: "var(--c-indigo)" },
  ]

  const rateColor = attendance.overallRate >= 90 ? "var(--c-emerald)"
    : attendance.overallRate >= 75 ? "var(--c-gold)"
    : "var(--c-red)"

  return (
    <div className="space-y-6">

      {/* ── Overview stat row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {OVERVIEW_CARDS.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: card.bg, color: card.color }}
                >
                  <Icon size={13} />
                </div>
                <p className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>{card.label}</p>
              </div>
              <p className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.03em" }}>
                {card.value.toLocaleString()}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── Attendance + homework summary row ─────────────────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Attendance donut */}
        <div className="card px-5 py-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--c-text-muted)" }}>
                Attendance rate
              </p>
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Last 30 days · {attendance.total.toLocaleString()} records</p>
            </div>
            <DonutChart rate={attendance.overallRate} size={72} color={rateColor} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {statusItems.map(item => {
              const Icon = item.icon
              const pct  = attendance.total > 0 ? Math.round((item.value / attendance.total) * 100) : 0
              return (
                <div key={item.label} className="flex items-center gap-2">
                  <Icon size={12} style={{ color: item.color, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>{item.label}</span>
                      <span className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>{pct}%</span>
                    </div>
                    <div className="w-full h-1 rounded-full" style={{ background: "var(--c-border)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: item.color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Homework */}
        <div className="card px-5 py-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--c-text-muted)" }}>
                Homework completion
              </p>
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Last 30 days</p>
            </div>
            <DonutChart
              rate={homework.rate}
              size={72}
              color={homework.rate >= 75 ? "var(--c-emerald)" : homework.rate >= 50 ? "var(--c-gold)" : "var(--c-red)"}
            />
          </div>

          <div className="space-y-3">
            {[
              { label: "Assignments set",   value: homework.assigned,  color: "var(--c-indigo)" },
              { label: "Submissions in",    value: homework.submitted, color: "var(--c-emerald)" },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>{item.label}</span>
                  <span className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{item.value}</span>
                </div>
                <div className="w-full h-1.5 rounded-full" style={{ background: "var(--c-border)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${homework.assigned > 0 ? Math.round((item.value / homework.assigned) * 100) : 0}%`,
                      background: item.color,
                    }}
                  />
                </div>
              </div>
            ))}

            {homework.assigned === 0 && (
              <p className="text-xs text-center py-3" style={{ color: "var(--c-text-muted)" }}>
                No homework assigned in the last 30 days.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── 14-day attendance trend ─────────────────────────────────────────── */}
      <div className="card px-5 py-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--c-text-muted)" }}>
              14-day attendance trend
            </p>
            <div className="flex items-center gap-1.5">
              <Sparkline data={sparklineData} color={rateColor} />
              <span className="text-xs font-semibold" style={{ color: rateColor }}>
                {attendance.overallRate >= 90
                  ? <><TrendingUp size={11} className="inline mr-0.5" />Strong</>
                  : attendance.overallRate >= 75
                  ? "Moderate"
                  : <><TrendingDown size={11} className="inline mr-0.5" />Needs attention</>
                }
              </span>
            </div>
          </div>
        </div>
        <AttendanceTrendChart days={trendDays} />
      </div>

      {/* ── Per-class attendance breakdown ──────────────────────────────────── */}
      {classStats.length > 0 && (
        <div className="card px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--c-text-muted)" }}>
            Attendance by class · Last 30 days
          </p>

          <div className="space-y-3">
            {classStats.map(cls => {
              const clsColor = cls.rate >= 90 ? "var(--c-emerald)"
                : cls.rate >= 75 ? "var(--c-gold)"
                : cls.total === 0 ? "var(--c-border)"
                : "var(--c-red)"

              return (
                <div key={cls.id} className="flex items-center gap-3">
                  {/* Class name */}
                  <div className="w-28 shrink-0">
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--c-text)" }}>{cls.name}</p>
                    <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>{cls.grade_level}</p>
                  </div>

                  {/* Bar */}
                  <div className="flex-1 h-2 rounded-full" style={{ background: "var(--c-border)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${cls.rate}%`, background: clsColor }}
                    />
                  </div>

                  {/* Rate */}
                  <div className="w-12 text-right shrink-0">
                    <span
                      className="text-xs font-bold"
                      style={{ color: cls.total === 0 ? "var(--c-text-muted)" : clsColor }}
                    >
                      {cls.total === 0 ? "—" : `${cls.rate}%`}
                    </span>
                  </div>

                  {/* Record count */}
                  <div className="w-14 text-right shrink-0 hidden sm:block">
                    <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                      {cls.total > 0 ? `${cls.total} records` : "No data"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────────── */}
      {classStats.length === 0 && attendance.total === 0 && (
        <div className="card px-6 py-12 text-center">
          <TrendingUp size={28} className="mx-auto mb-3" style={{ color: "var(--c-text-muted)", opacity: 0.3 }} />
          <p className="font-semibold" style={{ color: "var(--c-text)" }}>No data yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
            Analytics will populate once teachers start taking attendance and assigning homework.
          </p>
        </div>
      )}
    </div>
  )
}
