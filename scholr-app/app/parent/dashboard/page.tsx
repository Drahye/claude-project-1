import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatDate, avatarColor, getInitials } from "@/lib/utils"
import Link from "next/link"
import { CheckCircle2, XCircle, AlertTriangle, BookOpen, MessageSquare, TrendingUp, Calendar, Bell, ChevronRight, Users, ClipboardCheck } from "lucide-react"
import EmptyState from "@/components/shared/EmptyState"
import type { WeeklyReport, Attendance, Homework, Notification } from "@/types/database"
import ParentWelcomeGuide from "@/components/parent/WelcomeGuide"
import { Spotlight, StatTile, Reveal, AlertsPill } from "@/components/shared/DashboardKit"

export const metadata: Metadata = { title: "Dashboard" }

export default async function ParentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch parent profile
  const { data: parentProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single() as unknown as { data: { full_name: string } | null }

  // Fetch parent's children + their recent data
  const { data: parentStudents } = await supabase
    .from("parent_students")
    .select(`
      is_primary,
      student:students(
        id, full_name, photo_url,
        enrollments:student_class_enrollments(
          class:classes(name, grade_level)
        )
      )
    `)
    .eq("parent_id", user.id) as unknown as {
      data: Array<{ is_primary: boolean; student: any }> | null
    }

  const students = (parentStudents ?? []).map(ps => ps.student).filter(Boolean)
  const studentIds: string[] = students.map((s: any) => s?.id).filter(Boolean)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Fetch recent attendance for all children (last 7 days)
  let recentAttendance: Pick<Attendance, "student_id" | "status" | "date">[] = []
  if (studentIds.length > 0) {
    const { data } = await supabase
      .from("attendance")
      .select("student_id, status, date")
      .in("student_id", studentIds)
      .gte("date", sevenDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: false })
    recentAttendance = (data ?? []) as typeof recentAttendance
  }

  // Fetch unread notifications
  const { data: notificationsData } = await supabase
    .from("notifications")
    .select("id, type, title, body, created_at, is_read")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)
  const notifications = (notificationsData ?? []) as Pick<Notification, "id" | "type" | "title" | "body" | "created_at" | "is_read">[]

  // Fetch pending homework
  let homework: Pick<Homework, "id" | "title" | "subject" | "due_date" | "class_id">[] = []
  if (studentIds.length > 0) {
    const { data } = await supabase
      .from("homework")
      .select("id, title, subject, due_date, class_id")
      .gte("due_date", new Date().toISOString().split("T")[0])
      .order("due_date", { ascending: true })
      .limit(4)
    homework = (data ?? []) as typeof homework
  }

  // Fetch latest weekly report
  let weeklyReport: WeeklyReport | null = null
  if (studentIds.length > 0) {
    const { data } = await supabase
      .from("weekly_reports")
      .select("*")
      .in("student_id", studentIds)
      .not("sent_at", "is", null)
      .order("week_start", { ascending: false })
      .limit(1)
      .single()
    weeklyReport = (data ?? null) as WeeklyReport | null
  }

  const today = formatDate(new Date(), "long")
  const hour  = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  const unreadCount = notifications.filter(n => !n.is_read).length
  const firstName = (parentProfile?.full_name ?? "there").split(" ")[0]

  // Weekly attendance across all children (feeds the spotlight + stats)
  const weekPresent = recentAttendance.filter(a => a.status === "present" || a.status === "late").length
  const weekRecords = recentAttendance.length
  const weekPct = weekRecords > 0 ? Math.round((weekPresent / weekRecords) * 100) : null
  const weekAbsent = recentAttendance.filter(a => a.status === "absent").length

  // Quick check: does this parent have any message threads?
  const { count: threadCount } = await supabase
    .from("message_threads")
    .select("id", { count: "exact", head: true })
    .contains("participant_ids", [user.id])
  const hasMessages = (threadCount ?? 0) > 0

  return (
    <div className="p-5 sm:p-7 pb-24 md:pb-8 max-w-[1180px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7 pt-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--c-text-muted)" }}>{today}</p>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight leading-none" style={{ color: "var(--c-text)", letterSpacing: "-0.03em" }}>
            {greeting}, {firstName}
          </h1>
          {students.length > 0 && (
            <p className="text-sm mt-2" style={{ color: "var(--c-text-mid)" }}>
              {students.length} child{students.length !== 1 ? "ren" : ""} at school
            </p>
          )}
        </div>
        <AlertsPill count={unreadCount} href="/parent/alerts" />
      </div>

      {/* First-run guide */}
      <Reveal delay={60} className="mb-6">
        <ParentWelcomeGuide
          userName={parentProfile?.full_name ?? "there"}
          userId={user.id}
          hasChildren={students.length > 0}
          hasMessages={hasMessages}
        />
      </Reveal>

      {/* Spotlight + stats */}
      {students.length > 0 && (
        <div className="grid lg:grid-cols-[1.05fr_1.25fr] gap-5 mb-5">
          <Reveal delay={90}>
            <Spotlight
              eyebrow="This week"
              ring={weekPct}
              value={weekPct === null ? "—" : undefined}
              headline={weekPct === null
                ? "Attendance appears once records are in"
                : weekAbsent === 0 ? "Perfect attendance this week" : `${weekAbsent} absence${weekAbsent !== 1 ? "s" : ""} this week`}
              chips={weekRecords > 0 ? [`${weekPresent}/${weekRecords} days present`] : undefined}
              ctaHref="/parent/children"
              ctaLabel="View children"
            />
          </Reveal>
          <div className="grid grid-cols-2 gap-4">
            <StatTile label="Children"   value={students.length} icon={<Users size={15} />}         color="var(--c-indigo)"  delay={0} />
            <StatTile label="Attendance" value={weekPct !== null ? `${weekPct}%` : "—"} icon={<ClipboardCheck size={15} />} color="var(--c-emerald)" delay={60} />
            <StatTile label="Absences"   value={weekAbsent} icon={<XCircle size={15} />} color={weekAbsent > 0 ? "var(--c-red)" : "var(--c-text-muted)"} delay={120} />
            <StatTile label="Homework due" value={homework.length} icon={<BookOpen size={15} />} color="var(--c-gold)" delay={180} />
          </div>
        </div>
      )}

      {/* Children cards */}
      {students.length > 0 ? (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>Your children</h2>
            <Link href="/parent/children" className="text-xs font-semibold" style={{ color: "var(--c-indigo)", textDecoration: "none" }}>
              View all
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student: any) => {
              if (!student) return null
              const className = student.enrollments?.[0]?.class?.name ?? "—"
              const studentAttendance = (recentAttendance ?? []).filter((a: any) => a.student_id === student.id)
              const presentDays  = studentAttendance.filter((a: any) => a.status === "present").length
              const absentDays   = studentAttendance.filter((a: any) => a.status === "absent").length
              const attendancePct = studentAttendance.length > 0
                ? Math.round((presentDays / studentAttendance.length) * 100)
                : null

              return (
                <Link key={student.id} href={`/parent/children/${student.id}`}
                  className="group card-float card-float-hover p-5"
                  style={{ textDecoration: "none" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: avatarColor(student.full_name) }}
                    >
                      {getInitials(student.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: "var(--c-text)", letterSpacing: "-0.01em" }}>{student.full_name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--c-text-muted)" }}>{className}</p>
                    </div>
                    <ChevronRight size={15} className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                      style={{ color: "var(--c-text-muted)" }} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl p-3" style={{ background: "var(--c-surface)" }}>
                      <p className="text-xs font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>This week</p>
                      <p className="text-xl font-extrabold tracking-tight" style={{ color: attendancePct && attendancePct >= 80 ? "var(--c-emerald)" : "var(--c-red)", letterSpacing: "-0.02em" }}>
                        {attendancePct !== null ? `${attendancePct}%` : "—"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Attendance</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "var(--c-surface)" }}>
                      <p className="text-xs font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>Absent days</p>
                      <p className="text-xl font-extrabold tracking-tight" style={{ color: absentDays > 0 ? "var(--c-red)" : "var(--c-text)", letterSpacing: "-0.02em" }}>
                        {absentDays}
                      </p>
                      <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>This week</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ) : (
        <div className="mb-8">
          <EmptyState
            icon={Users}
            title="No children linked yet"
            description="Contact your school admin to link your account to your child, then their progress will appear here."
          />
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Left column */}
        <div className="space-y-5">

          {/* Weekly report card */}
          {weeklyReport ? (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>Friday story</h2>
              <div className="card-float p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge-indigo">✦ PRO · AI Generated</span>
                  <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                    Week of {formatDate(weeklyReport.week_start)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--c-text-mid)" }}>
                  {weeklyReport.ai_summary || "No summary yet for this week."}
                </p>
                {weeklyReport.ai_encouragement && (
                  <div className="rounded-xl p-4" style={{ background: "var(--c-indigo-bg)" }}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--c-indigo)" }}>Note to your child</p>
                    <p className="text-sm italic" style={{ color: "var(--c-text-mid)" }}>&ldquo;{weeklyReport.ai_encouragement}&rdquo;</p>
                  </div>
                )}
                <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: "1px solid var(--c-border)" }}>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} style={{ color: "var(--c-emerald)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>
                      {weeklyReport.attendance_days}/{weeklyReport.attendance_total} days present
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={14} style={{ color: "var(--c-indigo)" }} />
                    <span className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>
                      {weeklyReport.homework_submitted}/{weeklyReport.homework_total} homework done
                    </span>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* Upcoming homework */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>Upcoming homework</h2>
            </div>
            {homework.length > 0 ? (
              <div className="card-float divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
                {homework.map((hw: any) => {
                  const dueDate  = new Date(hw.due_date)
                  const today    = new Date()
                  const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  const overdue  = daysLeft < 0
                  const urgent   = daysLeft <= 1 && !overdue

                  return (
                    <div key={hw.id} className="flex items-center gap-4 px-5 py-4">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: overdue ? "var(--c-red-bg)" : urgent ? "var(--c-gold-bg)" : "var(--c-indigo-bg)" }}
                      >
                        <BookOpen size={14} style={{ color: overdue ? "var(--c-red)" : urgent ? "var(--c-gold)" : "var(--c-indigo)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{hw.title}</p>
                        <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{hw.subject}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold" style={{ color: overdue ? "var(--c-red)" : urgent ? "var(--c-gold)" : "var(--c-text-mid)" }}>
                          {overdue ? "Overdue" : daysLeft === 0 ? "Due today" : `${daysLeft}d left`}
                        </p>
                        <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{formatDate(hw.due_date)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="card-float px-5 py-8 text-center">
                <CheckCircle2 size={24} className="mx-auto mb-2" style={{ color: "var(--c-emerald)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>All caught up!</p>
                <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>No pending homework due.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right column — notifications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>Recent alerts</h2>
            {unreadCount > 0 && <span className="badge badge-indigo">{unreadCount} new</span>}
          </div>
          <div className="space-y-2">
            {notifications.length > 0 ? (
              notifications.map(n => {
                const iconMap: Record<string, React.ReactNode> = {
                  absence:      <XCircle size={14} style={{ color: "var(--c-red)" }} />,
                  homework:     <BookOpen size={14} style={{ color: "var(--c-indigo)" }} />,
                  message:      <MessageSquare size={14} style={{ color: "var(--c-indigo)" }} />,
                  report:       <TrendingUp size={14} style={{ color: "var(--c-emerald)" }} />,
                  fee:          <AlertTriangle size={14} style={{ color: "var(--c-gold)" }} />,
                  announcement: <Calendar size={14} style={{ color: "var(--c-text-muted)" }} />,
                }
                return (
                  <div
                    key={n.id}
                    className="card-float px-4 py-3 flex gap-3"
                    style={{ opacity: n.is_read ? 0.65 : 1 }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "var(--c-surface)" }}
                    >
                      {iconMap[n.type] ?? <Bell size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight" style={{ color: "var(--c-text)" }}>{n.title}</p>
                      <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--c-text-muted)" }}>{n.body}</p>
                      <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>{formatDate(n.created_at, "time")}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: "var(--c-indigo)" }} />
                    )}
                  </div>
                )
              })
            ) : (
              <div className="card-float px-5 py-8 text-center">
                <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>No alerts yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
