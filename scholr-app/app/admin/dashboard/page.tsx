import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils"
import type { Profile, School } from "@/types/database"
import DashboardShell from "@/components/admin/DashboardShell"

export const metadata: Metadata = { title: "Admin Dashboard" }

type AdminProfile = Profile & {
  school: Pick<School, "id" | "name" | "slug" | "subscription_plan" | "subscription_status" | "student_count" | "max_students"> | null
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, school:schools(id, name, slug, subscription_plan, subscription_status, student_count, max_students)")
    .eq("id", user.id)
    .single() as unknown as { data: AdminProfile | null }

  if (!profile?.school) redirect("/login")

  const schoolId = profile.school.id

  const [
    { count: studentCount },
    { count: teacherCount },
    { count: classCount },
    { count: parentCount },
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("is_active", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("role", "teacher"),
    supabase.from("classes").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("school_id", schoolId).eq("role", "parent"),
  ])

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: attendanceRaw } = await supabase
    .from("attendance")
    .select("status")
    .eq("school_id", schoolId)
    .gte("date", sevenDaysAgo.toISOString().split("T")[0]) as unknown as {
      data: Array<{ status: string }> | null
    }

  const totalRecords  = (attendanceRaw ?? []).length
  const presentCount  = (attendanceRaw ?? []).filter(a => a.status === "present" || a.status === "late").length
  const attendancePct = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : null

  const { count: hwAssigned } = await supabase
    .from("homework")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .gte("due_date", sevenDaysAgo.toISOString().split("T")[0])

  const { count: hwSubmitted } = await supabase
    .from("homework_submissions")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .gte("submitted_at", sevenDaysAgo.toISOString())

  const hwRate = hwAssigned && hwAssigned > 0
    ? Math.round(((hwSubmitted ?? 0) / hwAssigned) * 100)
    : null

  const { data: recentProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at, is_active")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(5) as unknown as {
      data: Array<Pick<Profile, "id" | "full_name" | "role" | "created_at" | "is_active">> | null
    }

  const { data: notificationsRaw } = await supabase
    .from("notifications")
    .select("id, title, body, type, created_at, is_read")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(4) as unknown as {
      data: Array<{ id: string; title: string; body: string; type: string; created_at: string; is_read: boolean }> | null
    }

  const notifications = notificationsRaw ?? []
  const unreadCount   = notifications.filter(n => !n.is_read).length

  const teacherRatioScore = teacherCount && studentCount
    ? Math.min(100, Math.round(((teacherCount ?? 0) / (studentCount ?? 1)) * 500))
    : 50

  const healthScore = attendancePct !== null || hwRate !== null
    ? Math.round(
        ((attendancePct ?? 80) * 0.5) +
        ((hwRate ?? 70) * 0.3) +
        (teacherRatioScore * 0.2)
      )
    : null

  const healthColor = healthScore === null ? "var(--c-text-muted)"
    : healthScore >= 80 ? "var(--c-emerald)"
    : healthScore >= 60 ? "var(--c-gold)"
    : "var(--c-red)"

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const today    = formatDate(new Date(), "long")

  return (
    <DashboardShell
      profile={profile as any}
      userId={user.id}
      studentCount={studentCount ?? 0}
      teacherCount={teacherCount ?? 0}
      classCount={classCount ?? 0}
      parentCount={parentCount ?? 0}
      attendancePct={attendancePct}
      presentCount={presentCount}
      totalRecords={totalRecords}
      hwRate={hwRate}
      hwSubmitted={hwSubmitted ?? 0}
      hwAssigned={hwAssigned ?? 0}
      healthScore={healthScore}
      healthColor={healthColor}
      recentProfiles={(recentProfiles ?? []) as any}
      notifications={notifications}
      unreadCount={unreadCount}
      greeting={greeting}
      today={today}
    />
  )
}
