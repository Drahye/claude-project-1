import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { avatarColor, getInitials, formatDate } from "@/lib/utils"
import {
  ArrowLeft, CheckCircle2, XCircle, Clock,
  Calendar, User, Hash, GraduationCap,
} from "lucide-react"
import type { Profile } from "@/types/database"
import EmptyState from "@/components/shared/EmptyState"
import StudentManage from "./StudentManage"

export const metadata: Metadata = { title: "Student" }

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", user.id)
    .single() as unknown as { data: Pick<Profile, "school_id" | "role"> | null }

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) redirect("/login")

  // Student (scoped to the admin's school)
  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, admission_number, date_of_birth, gender, photo_url, is_active, created_at, school_id")
    .eq("id", id)
    .eq("school_id", profile.school_id)
    .maybeSingle() as unknown as { data: any | null }

  if (!student) notFound()

  // Class enrolment
  const { data: enr } = await supabase
    .from("student_class_enrollments")
    .select("class:classes(id, name, grade_level, academic_year, teacher_id)")
    .eq("student_id", id) as unknown as {
      data: Array<{ class: { id: string; name: string; grade_level: string; academic_year: string; teacher_id: string | null } | null }> | null
    }
  const cls = enr?.[0]?.class ?? null

  // Class teacher name
  let teacherName: string | null = null
  if (cls?.teacher_id) {
    const { data: t } = await supabase
      .from("profiles").select("full_name").eq("id", cls.teacher_id).maybeSingle() as unknown as { data: { full_name: string } | null }
    teacherName = t?.full_name ?? null
  }

  // Linked parents
  const { data: ps } = await supabase
    .from("parent_students")
    .select("parent_id, is_primary")
    .eq("student_id", id) as unknown as { data: Array<{ parent_id: string; is_primary: boolean }> | null }

  let parents: Array<{ id: string; full_name: string; email: string; is_primary: boolean }> = []
  const parentIds = (ps ?? []).map(p => p.parent_id)
  if (parentIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles").select("id, full_name, email").in("id", parentIds) as unknown as {
        data: Array<{ id: string; full_name: string; email: string }> | null
      }
    const byId = new Map((profs ?? []).map(p => [p.id, p]))
    parents = (ps ?? []).map(link => {
      const p = byId.get(link.parent_id)
      return { id: link.parent_id, full_name: p?.full_name ?? "Unknown", email: p?.email ?? "", is_primary: link.is_primary }
    })
  }

  // All classes in the school (for the class assignment dropdown)
  const { data: allClasses } = await supabase
    .from("classes")
    .select("id, name, grade_level")
    .eq("school_id", profile.school_id)
    .order("name") as unknown as { data: Array<{ id: string; name: string; grade_level: string }> | null }

  // All parent accounts in the school (for the link-parent picker)
  const { data: availableParents } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("school_id", profile.school_id)
    .eq("role", "parent")
    .order("full_name") as unknown as { data: Array<{ id: string; full_name: string; email: string }> | null }

  // Attendance (last 30 days)
  const thirty = new Date(); thirty.setDate(thirty.getDate() - 30)
  const { data: attendance } = await supabase
    .from("attendance")
    .select("date, status")
    .eq("student_id", id)
    .gte("date", thirty.toISOString().split("T")[0])
    .order("date", { ascending: false }) as unknown as {
      data: Array<{ date: string; status: string }> | null
    }
  const att = attendance ?? []
  const present = att.filter(a => a.status === "present").length
  const late    = att.filter(a => a.status === "late").length
  const absent  = att.filter(a => a.status === "absent").length
  const attPct  = att.length > 0 ? Math.round(((present + late) / att.length) * 100) : null

  const genderLabel = student.gender
    ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1)
    : "—"

  const statusMeta: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
    present: { label: "Present", color: "var(--c-emerald)", bg: "var(--c-emerald-bg)", icon: CheckCircle2 },
    late:    { label: "Late",    color: "var(--c-gold)",    bg: "var(--c-gold-bg)",    icon: Clock },
    absent:  { label: "Absent",  color: "var(--c-red)",     bg: "var(--c-red-bg)",     icon: XCircle },
  }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <Link href="/admin/students"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-opacity hover:opacity-70"
        style={{ color: "var(--c-text-muted)", textDecoration: "none" }}>
        <ArrowLeft size={15} /> All students
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
            style={{ background: avatarColor(student.full_name) }}>
            {getInitials(student.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
                {student.full_name}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: student.is_active ? "var(--c-emerald-bg)" : "var(--c-red-bg)",
                  color:      student.is_active ? "var(--c-emerald)" : "var(--c-red)",
                }}>
                {student.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
              {cls ? `${cls.name} · ${cls.grade_level}` : "Not enrolled in a class"}
            </p>
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6" style={{ borderTop: "1px solid var(--c-border)" }}>
          <Detail icon={Hash}     label="Admission #" value={student.admission_number} />
          <Detail icon={Calendar} label="Date of birth" value={student.date_of_birth ? formatDate(student.date_of_birth) : "—"} />
          <Detail icon={User}     label="Gender" value={genderLabel} />
          <Detail icon={GraduationCap} label="Teacher" value={teacherName ?? "—"} />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Attendance */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>
            Attendance — last 30 days
          </h2>

          {/* Summary strip */}
          <div className="card p-4 grid grid-cols-4 gap-3 mb-4">
            <Stat label="Rate"    value={attPct !== null ? `${attPct}%` : "—"}
              color={attPct !== null && attPct >= 80 ? "var(--c-emerald)" : attPct !== null ? "var(--c-red)" : "var(--c-text-muted)"} />
            <Stat label="Present" value={String(present)} color="var(--c-emerald)" />
            <Stat label="Late"    value={String(late)}    color="var(--c-gold)" />
            <Stat label="Absent"  value={String(absent)}  color={absent > 0 ? "var(--c-red)" : "var(--c-text)"} />
          </div>

          {att.length === 0 ? (
            <EmptyState icon={Calendar} title="No attendance records yet" compact
              description="Attendance will appear here once the teacher starts marking it." />
          ) : (
            <div className="card divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
              {att.slice(0, 14).map((a, i) => {
                const meta = statusMeta[a.status] ?? statusMeta.present
                const Icon = meta.icon
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                      <Icon size={14} style={{ color: meta.color }} />
                    </div>
                    <p className="text-sm flex-1" style={{ color: "var(--c-text-mid)" }}>{formatDate(a.date, "long")}</p>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Class + parents management (interactive) */}
        <StudentManage
          studentId={student.id}
          currentClassId={cls?.id ?? null}
          classes={allClasses ?? []}
          linkedParents={parents}
          availableParents={availableParents ?? []}
        />
      </div>
    </div>
  )
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} style={{ color: "var(--c-text-muted)" }} />
        <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{label}</p>
      </div>
      <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{value}</p>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-extrabold tabular-nums" style={{ color, letterSpacing: "-0.02em" }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>{label}</p>
    </div>
  )
}
