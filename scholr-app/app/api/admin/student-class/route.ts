import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-auth"

/** Verify the student + (optional) class belong to the admin's school. */
async function check(
  svc: Awaited<ReturnType<typeof createServiceClient>>,
  schoolId: string, studentId: string, classId?: string,
): Promise<NextResponse | null> {
  const { data: student } = await svc
    .from("students").select("id").eq("id", studentId).eq("school_id", schoolId).maybeSingle()
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })
  if (classId) {
    const { data: cls } = await svc
      .from("classes").select("id").eq("id", classId).eq("school_id", schoolId).maybeSingle()
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 })
  }
  return null
}

/**
 * POST { studentId, classId } — enrol a student into a class.
 * Students can belong to MANY classes, so this adds one enrolment (idempotent)
 * rather than replacing existing ones.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { studentId, classId } = await req.json()
  if (!studentId || !classId) return NextResponse.json({ error: "Missing studentId or classId" }, { status: 400 })

  const svc = await createServiceClient()
  const bad = await check(svc, auth.schoolId, studentId, classId)
  if (bad) return bad

  const { error } = await svc
    .from("student_class_enrollments")
    .upsert({ student_id: studentId, class_id: classId }, { onConflict: "student_id,class_id" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** DELETE { studentId, classId } — remove a single class enrolment. */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { studentId, classId } = await req.json()
  if (!studentId || !classId) return NextResponse.json({ error: "Missing studentId or classId" }, { status: 400 })

  const svc = await createServiceClient()
  const bad = await check(svc, auth.schoolId, studentId, classId)
  if (bad) return bad

  const { error } = await svc
    .from("student_class_enrollments")
    .delete().eq("student_id", studentId).eq("class_id", classId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
