import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatDate, avatarColor, getInitials } from "@/lib/utils"
import {
  CheckCircle2, XCircle, BookOpen, Sparkles,
  Users, TrendingUp, ClipboardCheck, ArrowRight,
} from "lucide-react"
import type { Attendance, Homework, Notification, WeeklyReport } from "@/types/database"
import TeacherWelcomeGuide from "@/components/teacher/WelcomeGuide"
import { Spotlight, StatTile, Donut, Reveal, AlertsPill } from "@/components/shared/DashboardKit"

export const metadata: Metadata = { title: "Teacher Dashboard" }

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch teacher profile + assigned classes
  const { data: teacherProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single() as unknown as { data: { full_name: string } | null }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, school_id")
    .eq("id", user.id)
    .single() as unknown as { data: { id: string; school_id: string } | null }

  if (!teacher) redirect("/login")

  // Fetch classes this teacher owns
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name, grade_level")
    .eq("teacher_id", user.id)
    .eq("school_id", teacher.school_id) as unknown as {
      data: Array<{ id: string; name: string; grade_level: string }> | null
    }

  const classIds = (classes ?? []).map(c => c.id)

  // Student count per class
  const studentCounts: Record<string, number> = {}
  if (classIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("student_class_enrollments")
      .select("class_id")
      .in("class_id", classIds) as unknown as { data: Array<{ class_id: string }> | null }

    for (const e of enrollments ?? []) {
      studentCounts[e.class_id] = (studentCounts[e.class_id] ?? 0) + 1
    }
  }

  // Today's attendance summary (across all classes)
  const today = new Date().toISOString().split("T")[0]
  let todayAttendance: Pick<Attendance, "student_id" | "status" | "date">[] = []
  if (classIds.length > 0) {
    // get all students in these classes
    const { data: enrolledStudents } = await supabase
      .from("student_class_enrollments")
      .select("student_id")
      .in("class_id", classIds) as unknown as { data: Array<{ student_id: string }> | null }

    const studentIds = (enrolledStudents ?? []).map(e => e.student_id)

    if (studentIds.length > 0) {
      const { data } = await supabase
        .from("attendance")
        .select("student_id, status, date")
        .in("student_id", studentIds)
        .eq("date", today)
      todayAttendance = (data ?? []) as typeof todayAttendance
    }
  }

  // Homework due this week
  let upcomingHomework: Pick<Homework, "id" | "title" | "subject" | "due_date" | "class_id">[] = []
  if (classIds.length > 0) {
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() + 7)
    const { data } = await supabase
      .from("homework")
      .select("id, title, subject, due_date, class_id")
      .in("class_id", classIds)
      .gte("due_date", today)
      .lte("due_date", weekEnd.toISOString().split("T")[0])
      .order("due_date", { ascending: true })
      .limit(5)
    upcomingHomework = (data ?? []) as typeof upcomingHomework
  }

  // Recent AI reports (this teacher's students)
  let recentReports: WeeklyReport[] = []
  if (classIds.length > 0) {
    const { data: enrl } = await supabase
      .from("student_class_enrollments")
      .select("student_id")
      .in("class_id", classIds) as unknown as { data: Array<{ student_id: string }> | null }

    const allStudentIds = (enrl ?? []).map(e => e.student_id)
    if (allStudentIds.length > 0) {
      const { data } = await supabase
        .from("weekly_reports")
        .select("*")
        .in("student_id", allStudentIds)
        .order("week_start", { ascending: false })
        .limit(3)
      recentReports = (data ?? []) as WeeklyReport[]
    }
  }

  // Notifications for this teacher
  const { data: notificationsData } = await supabase
    .from("notifications")
    .select("id, type, title, body, created_at, is_read")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(4)
  const notifications = (notificationsData ?? []) as Pick<Notification, "id" | "type" | "title" | "body" | "created_at" | "is_read">[]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const dateLabel = formatDate(new Date(), "long")

  const totalStudents = Object.values(studentCounts).reduce((a, b) => a + b, 0)
  const presentToday = todayAttendance.filter(a => a.status === "present").length
  const absentToday  = todayAttendance.filter(a => a.status === "absent").length
  const lateToday    = todayAttendance.filter(a => a.status === "late").length
  const excusedToday = todayAttendance.filter(a => a.status === "excused").length
  const attendancePct = todayAttendance.length > 0
    ? Math.round((presentToday / todayAttendance.length) * 100)
    : null
  const attendanceTaken = todayAttendance.length > 0
  const hasAssignedHomework = upcomingHomework.length > 0
  const unreadCount = notifications.filter(n => !n.is_read).length
  const firstName = (teacherProfile?.full_name ?? "there").split(" ")[0]

  const todayDonut = [
    { label: "Present", value: presentToday, color: "var(--c-emerald)" },
    { label: "Late",    value: lateToday,    color: "var(--c-gold)" },
    { label: "Absent",  value: absentToday,  color: "var(--c-red)" },
    { label: "Excused", value: excusedToday, color: "var(--c-info)" },
  ].filter(s => s.value > 0)

  return (
    <div className="p-5 sm:p-7 pb-24 md:pb-8 max-w-[1180px] mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-7 pt-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--c-text-muted)" }}>{dateLabel}</p>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight leading-none" style={{ color: "var(--c-text)", letterSpacing: "-0.03em" }}>
            {greeting}, {firstName}
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--c-text-mid)" }}>
            You have {classIds.length} class{classIds.length !== 1 ? "es" : ""} · {totalStudents} students
          </p>
        </div>
        <AlertsPill count={unreadCount} href="/teacher/alerts" />
      </div>

      {/* First-run guide */}
      <Reveal delay={60} className="mb-6">
        <TeacherWelcomeGuide
          userName={teacherProfile?.full_name ?? "Teacher"}
          userId={user.id}
          hasClasses={classIds.length > 0}
          hasTakenAttendance={attendanceTaken}
          hasAssignedHomework={hasAssignedHomework}
        />
      </Reveal>

      {/* Spotlight + stats */}
      <div className="grid lg:grid-cols-[1.05fr_1.25fr] gap-5 mb-5">
        <Reveal delay={90}>
          <Spotlight
            eyebrow="Today's attendance"
            ring={attendanceTaken ? attendancePct : null}
            value={attendanceTaken ? undefined : "—"}
            headline={attendanceTaken
              ? `${presentToday} present · ${absentToday} absent`
              : classIds.length > 0 ? "Not marked yet today" : "No classes assigned yet"}
            chips={attendanceTaken ? [`${todayAttendance.length} students marked`] : undefined}
            ctaHref="/teacher/attendance"
            ctaLabel={attendanceTaken ? "Review attendance" : "Take attendance"}
          />
        </Reveal>
        <div className="grid grid-cols-2 gap-4">
          <StatTile label="Classes"  value={classIds.length} icon={<BookOpen size={15} />} color="var(--c-indigo)" delay={0} />
          <StatTile label="Students" value={totalStudents}   icon={<Users size={15} />}    color="var(--c-info)"   delay={60} />
          <StatTile label="Present today" value={attendancePct !== null ? `${attendancePct}%` : "—"} icon={<ClipboardCheck size={15} />} color="var(--c-emerald)" delay={120} />
          <StatTile label="Absent today"  value={absentToday} icon={<XCircle size={15} />} color={absentToday > 0 ? "var(--c-red)" : "var(--c-text-muted)"} delay={180} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_330px] gap-5">
        {/* Left column */}
        <div className="space-y-5">

          {/* Classes */}
          {(classes ?? []).length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>Your classes</h2>
              <div className="space-y-2">
                {(classes ?? []).map(cls => {
                  const count = studentCounts[cls.id] ?? 0
                  const clsAttendance = todayAttendance.length
                  const pct = clsAttendance > 0 ? Math.round((presentToday / clsAttendance) * 100) : null
                  return (
                    <div key={cls.id} className="card-float p-4 flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ background: avatarColor(cls.name) }}
                      >
                        {getInitials(cls.name)}
                      </div>
                      <Link href={`/teacher/classes/${cls.id}`} className="flex-1 min-w-0" style={{ textDecoration: "none" }}>
                        <p className="font-semibold text-sm hover:underline" style={{ color: "var(--c-text)" }}>{cls.name}</p>
                        <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{cls.grade_level} · {count} students</p>
                      </Link>
                      {pct !== null && (
                        <span className={`badge ${pct >= 80 ? "badge-green" : "badge-red"}`}>
                          {pct}% today
                        </span>
                      )}
                      <Link
                        href={`/teacher/attendance?class=${cls.id}`}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--c-indigo)", background: "var(--c-indigo-bg)" }}
                      >
                        Attendance <ArrowRight size={12} />
                      </Link>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Upcoming homework */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>Homework due this week</h2>
              <Link href="/teacher/homework" className="text-xs font-semibold" style={{ color: "var(--c-indigo)" }}>
                View all
              </Link>
            </div>
            {upcomingHomework.length > 0 ? (
              <div className="card-float divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
                {upcomingHomework.map(hw => {
                  const dueDate  = new Date(hw.due_date)
                  const todayD   = new Date()
                  const daysLeft = Math.ceil((dueDate.getTime() - todayD.getTime()) / (1000 * 60 * 60 * 24))
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
                <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>No homework due this week</p>
                <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>Assign homework to your classes.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Today's breakdown donut */}
          {attendanceTaken && todayDonut.length > 0 && (
            <Reveal>
              <div className="card-float p-5">
                <h2 className="text-sm font-bold mb-4" style={{ color: "var(--c-text)" }}>Today at a glance</h2>
                <Donut segments={todayDonut} centerLabel="marked" />
              </div>
            </Reveal>
          )}

          {/* AI Reports shortcut */}
          <div
            className="card-float card-float-hover p-5"
            style={{ background: "linear-gradient(135deg, var(--c-indigo-bg), var(--c-bg))" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} style={{ color: "var(--c-indigo)" }} />
              <span className="badge badge-indigo">✦ AI · Powered by Claude</span>
            </div>
            <p className="text-sm font-bold mb-1" style={{ color: "var(--c-text)" }}>Weekly reports ready to generate</p>
            <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--c-text-muted)" }}>
              Claude analyses attendance, homework, and your notes to write personalised parent reports in seconds.
            </p>
            <Link href="/teacher/ai" className="btn-primary text-sm h-9 px-4 w-full justify-center flex">
              Generate reports
            </Link>
          </div>

          {/* Recent AI reports */}
          {recentReports.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>Recent reports</h2>
              <div className="space-y-2">
                {recentReports.map(r => (
                  <div key={r.id} className="card-float p-3.5 flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "var(--c-indigo-bg)" }}
                    >
                      <TrendingUp size={14} style={{ color: "var(--c-indigo)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>
                        Week of {formatDate(r.week_start)}
                      </p>
                      <p className="text-xs line-clamp-1" style={{ color: "var(--c-text-muted)" }}>
                        {r.ai_summary || "Report generated"}
                      </p>
                    </div>
                    <span className={`badge ${r.sent_at ? "badge-green" : "badge-gold"}`}>
                      {r.sent_at ? "Sent" : "Draft"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Notifications */}
          {notifications.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>Recent alerts</h2>
              <div className="space-y-2">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className="card-float px-4 py-3"
                    style={{ opacity: n.is_read ? 0.65 : 1 }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{n.title}</p>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--c-text-muted)" }}>{n.body}</p>
                    <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>{formatDate(n.created_at, "time")}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
