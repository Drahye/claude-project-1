import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils"
import { ArrowLeft, CheckCircle2, XCircle, Clock, Calendar } from "lucide-react"
import type { Profile } from "@/types/database"
import EmptyState from "@/components/shared/EmptyState"
import StudentManage from "./StudentManage"
import StudentEditor from "./StudentEditor"
import StudentHero from "./StudentHero"
import { signStudentPhoto } from "@/lib/student-photo"

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
    .select("id, full_name, admission_number, date_of_birth, gender, photo_url, is_active, medical, created_at, school_id")
    .eq("id", id)
    .eq("school_id", profile.school_id)
    .maybeSingle() as unknown as { data: any | null }

  if (!student) notFound()

  // Student photos live in a PRIVATE bucket — mint a short-lived signed URL.
  const photoDisplay = await signStudentPhoto(student.photo_url)

  // Class enrolment
  const { data: enr } = await supabase
    .from("student_class_enrollments")
    .select("class:classes(id, name, grade_level, academic_year, teacher_id)")
    .eq("student_id", id) as unknown as {
      data: Array<{ class: { id: string; name: string; grade_level: string; academic_year: string; teacher_id: string | null } | null }> | null
    }
  const cls = enr?.[0]?.class ?? null
  // A student can be in many classes — pass them all to the manage panel.
  const currentClassIds = (enr ?? []).map(e => e.class?.id).filter(Boolean) as string[]

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

  const statusMeta: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
    present: { label: "Present", color: "var(--c-emerald)", bg: "var(--c-emerald-bg)", icon: CheckCircle2 },
    late:    { label: "Late",    color: "var(--c-gold)",    bg: "var(--c-gold-bg)",    icon: Clock },
    absent:  { label: "Absent",  color: "var(--c-red)",     bg: "var(--c-red-bg)",     icon: XCircle },
  }

  return (
    <div className="p-5 sm:p-7 pb-24 max-w-5xl mx-auto">
      <Link href="/admin/students"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-opacity hover:opacity-70"
        style={{ color: "var(--c-text-muted)", textDecoration: "none" }}>
        <ArrowLeft size={15} /> All students
      </Link>

      {/* Premium hero — identity, photo, inline edit + overflow menu (edit / remove) */}
      <StudentHero
        student={{
          id: student.id,
          full_name: student.full_name,
          admission_number: student.admission_number,
          date_of_birth: student.date_of_birth ?? null,
          gender: student.gender ?? "male",
          photo_url: photoDisplay,
          is_active: student.is_active,
        }}
        className={cls?.name ?? null}
        grade={cls?.grade_level ?? null}
        teacherName={teacherName}
      />

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5 items-start">
        {/* Left — attendance */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3 px-1" style={{ color: "var(--c-text-muted)" }}>
            Attendance — last 30 days
          </h2>

          {/* Summary strip */}
          <div className="card-float p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
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
            <div className="card-float divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
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

        {/* Right — medical + class & parents */}
        <div className="space-y-5">
          <StudentEditor studentId={student.id} medical={student.medical ?? null} />
          <StudentManage
            studentId={student.id}
            currentClassIds={currentClassIds}
            classes={allClasses ?? []}
            linkedParents={parents}
            availableParents={availableParents ?? []}
          />
        </div>
      </div>
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
