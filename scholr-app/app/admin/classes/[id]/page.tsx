import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { signStudentPhoto } from "@/lib/student-photo"
import ClassDetail from "@/components/shared/ClassDetail"
import type { Profile, StudentActivity } from "@/types/database"

export const metadata: Metadata = { title: "Class" }

export default async function AdminClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("school_id, role").eq("id", user.id).single() as unknown as { data: Pick<Profile, "school_id" | "role"> | null }
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) redirect("/login")

  const { data: cls } = await supabase
    .from("classes").select("id, name, grade_level, academic_year, teacher_id")
    .eq("id", id).eq("school_id", profile.school_id).maybeSingle() as unknown as
    { data: { id: string; name: string; grade_level: string; academic_year: string; teacher_id: string | null } | null }
  if (!cls) notFound()

  let teacherName: string | null = null
  if (cls.teacher_id) {
    const { data: t } = await supabase.from("profiles").select("full_name").eq("id", cls.teacher_id).maybeSingle() as unknown as { data: { full_name: string } | null }
    teacherName = t?.full_name ?? null
  }

  const { data: enr } = await supabase
    .from("student_class_enrollments")
    .select("student:students(id, full_name, photo_url, activities)")
    .eq("class_id", id) as unknown as { data: Array<{ student: { id: string; full_name: string; photo_url: string | null; activities: StudentActivity[] | null } | null }> | null }

  const raw = (enr ?? []).map(e => e.student).filter(Boolean) as Array<{ id: string; full_name: string; photo_url: string | null; activities: StudentActivity[] | null }>
  raw.sort((a, b) => a.full_name.localeCompare(b.full_name))
  const students = await Promise.all(raw.map(async s => ({
    id: s.id, full_name: s.full_name,
    photo_url: await signStudentPhoto(s.photo_url),
    activities: Array.isArray(s.activities) ? s.activities : [],
  })))

  return (
    <div className="p-5 sm:p-7 pb-24 max-w-3xl mx-auto">
      <Link href="/admin/classes" className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-opacity hover:opacity-70" style={{ color: "var(--c-text-muted)", textDecoration: "none" }}>
        <ArrowLeft size={15} /> All classes
      </Link>
      <ClassDetail
        classId={cls.id} name={cls.name} grade={cls.grade_level} academicYear={cls.academic_year}
        teacherName={teacherName} students={students} canManage={false}
      />
      <p className="text-xs mt-5 px-1" style={{ color: "var(--c-text-muted)" }}>
        Class details &amp; activities are managed by the class teacher{teacherName ? ` (${teacherName})` : ""}.
      </p>
    </div>
  )
}
