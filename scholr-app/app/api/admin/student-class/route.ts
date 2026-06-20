import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-auth"

/** POST { studentId, classId } — set the student's class (classId "" = unenrol) */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { studentId, classId } = await req.json()
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 })

  const svc = await createServiceClient()

  // Verify the student belongs to the admin's school
  const { data: student } = await svc
    .from("students").select("id").eq("id", studentId).eq("school_id", auth.schoolId).maybeSingle()
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

  // If a class is provided, verify it's in the same school
  if (classId) {
    const { data: cls } = await svc
      .from("classes").select("id").eq("id", classId).eq("school_id", auth.schoolId).maybeSingle()
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 })
  }

  // Replace any existing enrolment with the new one (single class per student here)
  await svc.from("student_class_enrollments").delete().eq("student_id", studentId)

  if (classId) {
    const { error } = await svc
      .from("student_class_enrollments")
      .insert({ student_id: studentId, class_id: classId })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
