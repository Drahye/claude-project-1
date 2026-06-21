import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile, School } from "@/types/database"
import AnalyticsView from "./AnalyticsView"

export const metadata: Metadata = { title: "Analytics" }

type AdminProfile = Profile & {
  school: Pick<School, "id" | "name"> | null
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, school:schools(id, name)")
    .eq("id", user.id)
    .single() as unknown as { data: AdminProfile | null }

  if (!profile?.school) redirect("/login")

  const schoolId = profile.school.id

  // ── Date ranges ───────────────────────────────────────────────────────────
  const today         = new Date()
  const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(today.getDate() - 30)
  const sevenDaysAgo  = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7)
  const todayStr      = today.toISOString().split("T")[0]
  const thirtyStr     = thirtyDaysAgo.toISOString().split("T")[0]
  const sevenStr      = sevenDaysAgo.toISOString().split("T")[0]

  // ── Parallel queries ───────────────────────────────────────────────────────
  const [
    // Core counts
    { count: studentCount },
    { count: teacherCount },
    { count: classCount },
    { count: parentCount },

    // Attendance last 30 days (all records)
    { data: attendanceRaw },

    // Homework stats last 30 days
    { count: hwAssigned },
    { count: hwSubmitted },
    { count: hwOverdue },

    // AI reports generated
    { count: reportCount },

    // Per-class data
    { data: classes },
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("is_active", true),
    supabase.from("teachers").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
    supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("role", "parent"),

    supabase
      .from("attendance")
      .select("date, status, class_id")
      .eq("school_id", schoolId)
      .gte("date", thirtyStr)
      .order("date", { ascending: true }) as unknown as { data: Array<{ date: string; status: string; class_id: string }> | null },

    supabase.from("homework").select("id", { count: "exact", head: true }).eq("school_id", schoolId).gte("created_at", thirtyDaysAgo.toISOString()),
    supabase.from("homework_submissions").select("id", { count: "exact", head: true }).eq("school_id", schoolId).gte("submitted_at", thirtyDaysAgo.toISOString()),
    supabase.from("homework_submissions").select("id", { count: "exact", head: true }).eq("school_id", schoolId).gte("submitted_at", thirtyDaysAgo.toISOString()),

    supabase.from("weekly_reports").select("id", { count: "exact", head: true }).eq("school_id", schoolId),

    supabase.from("classes").select("id, name, grade_level").eq("school_id", schoolId).order("name") as unknown as {
      data: Array<{ id: string; name: string; grade_level: string }> | null
    },
  ])

  // ── Build 14-day attendance trend ─────────────────────────────────────────
  const trendDays: { label: string; date: string; present: number; absent: number; total: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = d.toISOString().split("T")[0]
    const recs    = (attendanceRaw ?? []).filter(a => a.date === dateStr)
    trendDays.push({
      label:   d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1) + d.getDate(),
      date:    dateStr,
      present: recs.filter(a => a.status === "present" || a.status === "late").length,
      absent:  recs.filter(a => a.status === "absent").length,
      total:   recs.length,
    })
  }

  // ── Per-class attendance rates (last 30 days) ──────────────────────────────
  const classStats: Array<{
    id: string; name: string; grade_level: string
    present: number; absent: number; total: number; rate: number
  }> = (classes ?? []).map(cls => {
    const recs    = (attendanceRaw ?? []).filter(a => a.class_id === cls.id)
    const present = recs.filter(a => a.status === "present" || a.status === "late").length
    const absent  = recs.filter(a => a.status === "absent").length
    const total   = recs.length
    return { ...cls, present, absent, total, rate: total > 0 ? Math.round((present / total) * 100) : 0 }
  }).sort((a, b) => b.total - a.total)

  // ── Overall 30-day attendance summary ─────────────────────────────────────
  const totalPresent  = (attendanceRaw ?? []).filter(a => a.status === "present").length
  const totalLate     = (attendanceRaw ?? []).filter(a => a.status === "late").length
  const totalAbsent   = (attendanceRaw ?? []).filter(a => a.status === "absent").length
  const totalExcused  = (attendanceRaw ?? []).filter(a => a.status === "excused").length
  const totalRecords  = (attendanceRaw ?? []).length
  const overallRate   = totalRecords > 0 ? Math.round(((totalPresent + totalLate) / totalRecords) * 100) : 0

  // ── Homework stats ─────────────────────────────────────────────────────────
  const hwRate = (hwAssigned ?? 0) > 0
    ? Math.round(((hwSubmitted ?? 0) / (hwAssigned ?? 1)) * 100)
    : 0

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-6xl mx-auto">
      <div className="mb-8 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          {profile.school.name} · Last 30 days
        </p>
      </div>

      <AnalyticsView
        schoolName={profile.school.name}
        overview={{
          students:  studentCount  ?? 0,
          teachers:  teacherCount  ?? 0,
          classes:   classCount    ?? 0,
          parents:   parentCount   ?? 0,
          reports:   reportCount   ?? 0,
        }}
        attendance={{
          total:        totalRecords,
          present:      totalPresent,
          late:         totalLate,
          absent:       totalAbsent,
          excused:      totalExcused,
          overallRate,
        }}
        homework={{
          assigned:   hwAssigned   ?? 0,
          submitted:  hwSubmitted  ?? 0,
          overdue:    hwOverdue    ?? 0,
          rate:       hwRate,
        }}
        trendDays={trendDays}
        classStats={classStats}
        todayStr={todayStr}
        sevenStr={sevenStr}
      />
    </div>
  )
}
