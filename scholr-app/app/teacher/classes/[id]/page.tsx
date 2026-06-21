import type { Metadata } from "next"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { signStudentPhoto } from "@/lib/student-photo"
import ClassDetail from "@/components/shared/ClassDetail"
import type { StudentActivity } from "@/types/database"

export const metadata: Metadata = { title: "Class" }

export default async function TeacherClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // The teacher must own this class.
  const { data: cls } = await supabase
    .from("classes").select("id, name, grade_level, academic_year, teacher_id, school_id")
    .eq("id", id).eq("teacher_id", user.id).maybeSingle() as unknown as
    { data: { id: string; name: string; grade_level: string; academic_year: string; teacher_id: string; school_id: string } | null }
  if (!cls) notFound()

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle() as unknown as { data: { full_name: string } | null }

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

  // School students not already in this class — for the "enrol existing" picker.
  const enrolledIds = new Set(students.map(s => s.id))
  const { data: allStudents } = await supabase
    .from("students").select("id, full_name, admission_number")
    .eq("school_id", cls.school_id).eq("is_active", true)
    .order("full_name") as unknown as { data: Array<{ id: string; full_name: string; admission_number: string }> | null }
  const availableStudents = (allStudents ?? []).filter(s => !enrolledIds.has(s.id))

  return (
    <div className="p-5 sm:p-7 pb-24 max-w-3xl mx-auto">
      <Link href="/teacher/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium mb-5 transition-opacity hover:opacity-70" style={{ color: "var(--c-text-muted)", textDecoration: "none" }}>
        <ArrowLeft size={15} /> Dashboard
      </Link>
      <ClassDetail
        classId={cls.id} name={cls.name} grade={cls.grade_level} academicYear={cls.academic_year}
        teacherName={profile?.full_name ?? null} students={students} canManage
        availableStudents={availableStudents}
      />
    </div>
  )
}
