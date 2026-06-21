import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { avatarColor, getInitials } from "@/lib/utils"
import { ChevronRight, CheckCircle2, BookOpen, Users } from "lucide-react"
import EmptyState from "@/components/shared/EmptyState"

export const metadata: Metadata = { title: "My Children" }

interface ChildCard {
  id:            string
  full_name:     string
  photo_url:     string | null
  admission_number: string | null
  className:     string
  gradeLevel:    string
  isPrimary:     boolean
  attendancePct: number | null
  absentDays:    number
  pendingHw:     number
}

export default async function ParentChildrenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Children linked to this parent
  const { data: links } = await supabase
    .from("parent_students")
    .select(`
      is_primary,
      student:students(
        id, full_name, photo_url, admission_number,
        enrollments:student_class_enrollments(
          class:classes(id, name, grade_level)
        )
      )
    `)
    .eq("parent_id", user.id) as unknown as {
      data: Array<{ is_primary: boolean; student: any }> | null
    }

  const rows = (links ?? []).filter(l => l.student)
  const studentIds: string[] = rows.map(l => l.student.id)

  // Attendance (last 7 days) for all children
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  let attendance: Array<{ student_id: string; status: string }> = []
  if (studentIds.length > 0) {
    const { data } = await supabase
      .from("attendance")
      .select("student_id, status")
      .in("student_id", studentIds)
      .gte("date", sevenDaysAgo.toISOString().split("T")[0]) as unknown as {
        data: Array<{ student_id: string; status: string }> | null
      }
    attendance = data ?? []
  }

  // Pending homework per class
  const classIds: string[] = rows
    .map(l => l.student.enrollments?.[0]?.class?.id)
    .filter(Boolean)

  const pendingHwByClass: Record<string, number> = {}
  if (classIds.length > 0) {
    const { data } = await supabase
      .from("homework")
      .select("id, class_id")
      .in("class_id", classIds)
      .gte("due_date", new Date().toISOString().split("T")[0]) as unknown as {
        data: Array<{ id: string; class_id: string }> | null
      }
    for (const hw of data ?? []) {
      pendingHwByClass[hw.class_id] = (pendingHwByClass[hw.class_id] ?? 0) + 1
    }
  }

  const children: ChildCard[] = rows.map(l => {
    const s = l.student
    const cls = s.enrollments?.[0]?.class
    const att = attendance.filter(a => a.student_id === s.id)
    const present = att.filter(a => a.status === "present" || a.status === "late").length
    const absent  = att.filter(a => a.status === "absent").length
    return {
      id:            s.id,
      full_name:     s.full_name,
      photo_url:     s.photo_url,
      admission_number: s.admission_number,
      className:     cls?.name ?? "Not enrolled",
      gradeLevel:    cls?.grade_level ?? "",
      isPrimary:     l.is_primary,
      attendancePct: att.length > 0 ? Math.round((present / att.length) * 100) : null,
      absentDays:    absent,
      pendingHw:     cls?.id ? (pendingHwByClass[cls.id] ?? 0) : 0,
    }
  })

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          My Children
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          {children.length === 0
            ? "No children linked to your account yet"
            : `${children.length} child${children.length !== 1 ? "ren" : ""} linked`}
        </p>
      </div>

      {children.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No children linked yet"
          description="Your school administrator links students to parent accounts. Contact your school if your child isn't showing here."
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {children.map(child => (
            <Link
              key={child.id}
              href={`/parent/children/${child.id}`}
              className="group card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ textDecoration: "none" }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                  style={{ background: avatarColor(child.full_name) }}
                >
                  {getInitials(child.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate" style={{ color: "var(--c-text)" }}>{child.full_name}</p>
                    {child.isPrimary && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}>
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: "var(--c-text-muted)" }}>
                    {child.className}{child.gradeLevel ? ` · ${child.gradeLevel}` : ""}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                  style={{ color: "var(--c-text-muted)" }} />
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl p-2.5 text-center" style={{ background: "var(--c-surface)" }}>
                  <CheckCircle2 size={13} className="mx-auto mb-1" style={{ color: "var(--c-emerald)" }} />
                  <p className="text-sm font-extrabold tabular-nums"
                    style={{ color: child.attendancePct !== null && child.attendancePct >= 80 ? "var(--c-emerald)" : child.attendancePct !== null ? "var(--c-red)" : "var(--c-text-muted)" }}>
                    {child.attendancePct !== null ? `${child.attendancePct}%` : "—"}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>Attendance</p>
                </div>
                <div className="rounded-xl p-2.5 text-center" style={{ background: "var(--c-surface)" }}>
                  <p className="text-sm font-extrabold tabular-nums mt-[18px]"
                    style={{ color: child.absentDays > 0 ? "var(--c-red)" : "var(--c-text)" }}>
                    {child.absentDays}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>Absent (7d)</p>
                </div>
                <div className="rounded-xl p-2.5 text-center" style={{ background: "var(--c-surface)" }}>
                  <BookOpen size={13} className="mx-auto mb-1" style={{ color: "var(--c-indigo)" }} />
                  <p className="text-sm font-extrabold tabular-nums"
                    style={{ color: child.pendingHw > 0 ? "var(--c-gold)" : "var(--c-text)" }}>
                    {child.pendingHw}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>Homework</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
