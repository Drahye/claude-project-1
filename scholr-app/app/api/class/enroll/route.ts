import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

/**
 * Resolve the caller and confirm they may manage enrollment for `classId`:
 *   • admin / super_admin of the class's school, OR
 *   • the teacher who owns the class (classes.teacher_id = them).
 * Returns { schoolId } on success, or a NextResponse error to return as-is.
 */
async function authorizeClass(classId: string): Promise<{ schoolId: string } | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles").select("school_id, role").eq("id", user.id).single() as unknown as
    { data: { school_id: string; role: string } | null }
  if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const svc = await createServiceClient()
  const { data: cls } = await svc
    .from("classes").select("id, school_id, teacher_id").eq("id", classId).maybeSingle() as unknown as
    { data: { id: string; school_id: string; teacher_id: string | null } | null }
  if (!cls || cls.school_id !== profile.school_id) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 })
  }

  const isAdmin   = profile.role === "admin" || profile.role === "super_admin"
  const isOwner   = profile.role === "teacher" && cls.teacher_id === user.id
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "You can only manage classes you teach." }, { status: 403 })
  }
  return { schoolId: profile.school_id }
}

interface NewStudent { full_name?: unknown; admission_number?: unknown; gender?: unknown; date_of_birth?: unknown }

/**
 * Enroll a student into a class. Either:
 *   { classId, studentId }            — enroll an existing student, OR
 *   { classId, newStudent: {...} }     — create a new student, then enroll.
 * Works for both an admin and the class's own teacher.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { classId?: string; studentId?: string; newStudent?: NewStudent }
  if (!body.classId) return NextResponse.json({ error: "Missing classId" }, { status: 400 })

  const auth = await authorizeClass(body.classId)
  if (auth instanceof NextResponse) return auth
  const svc = await createServiceClient()

  let studentId = body.studentId

  // Create a brand-new student in this school if requested.
  if (!studentId && body.newStudent) {
    const full_name = String(body.newStudent.full_name ?? "").trim()
    const admission_number = String(body.newStudent.admission_number ?? "").trim()
    if (!full_name || !admission_number) {
      return NextResponse.json({ error: "Name and admission number are required." }, { status: 400 })
    }
    const { data: dupe } = await svc
      .from("students").select("id").eq("school_id", auth.schoolId).eq("admission_number", admission_number).maybeSingle()
    if (dupe) return NextResponse.json({ error: "A student with that admission number already exists." }, { status: 409 })

    const g = String(body.newStudent.gender ?? "").trim().toLowerCase()
    const dob = String(body.newStudent.date_of_birth ?? "").trim()
    const { data: created, error: createErr } = await svc
      .from("students")
      .insert({
        school_id: auth.schoolId,
        full_name: full_name.slice(0, 120),
        admission_number: admission_number.slice(0, 40),
        is_active: true,
        ...(g === "male" || g === "female" || g === "other" ? { gender: g } : {}),
        ...(/^\d{4}-\d{2}-\d{2}$/.test(dob) ? { date_of_birth: dob } : {}),
      })
      .select("id, full_name").single() as unknown as { data: { id: string; full_name: string } | null; error: { message: string } | null }
    if (createErr || !created) return NextResponse.json({ error: createErr?.message ?? "Failed to create student" }, { status: 500 })
    studentId = created.id
  }

  if (!studentId) return NextResponse.json({ error: "Missing studentId or newStudent" }, { status: 400 })

  // Student must be in the same school.
  const { data: student } = await svc
    .from("students").select("id, full_name, photo_url").eq("id", studentId).eq("school_id", auth.schoolId).maybeSingle() as unknown as
    { data: { id: string; full_name: string; photo_url: string | null } | null }
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

  // Idempotent — a student can be in many classes; ignore duplicate PK.
  const { error } = await svc
    .from("student_class_enrollments")
    .upsert({ student_id: studentId, class_id: body.classId }, { onConflict: "student_id,class_id" })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, student })
}

/** Remove a student from a class. */
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { classId?: string; studentId?: string }
  if (!body.classId || !body.studentId) return NextResponse.json({ error: "Missing classId or studentId" }, { status: 400 })

  const auth = await authorizeClass(body.classId)
  if (auth instanceof NextResponse) return auth

  const svc = await createServiceClient()
  const { error } = await svc
    .from("student_class_enrollments")
    .delete().eq("class_id", body.classId).eq("student_id", body.studentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
