import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-auth"

/** Confirm both the student and the parent profile live in the admin's school */
async function verify(svc: any, schoolId: string, studentId: string, parentId: string) {
  const { data: student } = await svc
    .from("students").select("id").eq("id", studentId).eq("school_id", schoolId).maybeSingle()
  if (!student) return "Student not found"

  const { data: parent } = await svc
    .from("profiles").select("id, role").eq("id", parentId).eq("school_id", schoolId).maybeSingle()
  if (!parent || parent.role !== "parent") return "Parent account not found in this school"

  return null
}

/** POST { studentId, parentId, isPrimary } — link a parent to a student */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { studentId, parentId, isPrimary = true } = await req.json()
  if (!studentId || !parentId) return NextResponse.json({ error: "Missing studentId or parentId" }, { status: 400 })

  const svc = await createServiceClient()
  const problem = await verify(svc, auth.schoolId, studentId, parentId)
  if (problem) return NextResponse.json({ error: problem }, { status: 404 })

  // Ensure the parent extension row exists (parent_students.parent_id → parents.id).
  // Idempotent — covers parents who somehow lack the extension row.
  await svc
    .from("parents")
    .upsert({ id: parentId, school_id: auth.schoolId }, { onConflict: "id" })

  const { error } = await svc
    .from("parent_students")
    .upsert(
      { parent_id: parentId, student_id: studentId, is_primary: isPrimary },
      { onConflict: "parent_id,student_id" },
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** DELETE { studentId, parentId } — unlink a parent from a student */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { studentId, parentId } = await req.json()
  if (!studentId || !parentId) return NextResponse.json({ error: "Missing studentId or parentId" }, { status: 400 })

  const svc = await createServiceClient()
  const problem = await verify(svc, auth.schoolId, studentId, parentId)
  if (problem) return NextResponse.json({ error: problem }, { status: 404 })

  const { error } = await svc
    .from("parent_students")
    .delete()
    .eq("student_id", studentId)
    .eq("parent_id", parentId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
