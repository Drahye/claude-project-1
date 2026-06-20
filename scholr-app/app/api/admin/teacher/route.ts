import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-auth"
import type { Profile, Teacher } from "@/types/database"

/* Edit a teacher's profile + teaching details. */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const teacherId = typeof body.teacherId === "string" ? body.teacherId : ""
  if (!teacherId) return NextResponse.json({ error: "Missing teacherId" }, { status: 400 })

  const s = await createServiceClient()

  // Profile fields (scoped to this school's teachers only)
  const profileUpdate: Partial<Profile> = {}
  if (body.full_name !== undefined) {
    const n = String(body.full_name).trim()
    if (!n) return NextResponse.json({ error: "Name is required" }, { status: 400 })
    profileUpdate.full_name = n
  }
  if (body.phone !== undefined) profileUpdate.phone = String(body.phone).trim() || null

  if (Object.keys(profileUpdate).length > 0) {
    const { error, count } = await s
      .from("profiles").update(profileUpdate, { count: "exact" })
      .eq("id", teacherId).eq("school_id", auth.schoolId).eq("role", "teacher")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (count === 0) return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
  }

  // Teaching details
  const teacherUpdate: Partial<Teacher> = {}
  if (body.subjects !== undefined) {
    const subs = Array.isArray(body.subjects)
      ? body.subjects
      : String(body.subjects).split(",").map(x => x.trim()).filter(Boolean)
    teacherUpdate.subjects = subs
  }
  if (body.employee_number !== undefined) teacherUpdate.employee_number = String(body.employee_number).trim() || null

  if (Object.keys(teacherUpdate).length > 0) {
    const { error } = await s
      .from("teachers").update(teacherUpdate).eq("id", teacherId).eq("school_id", auth.schoolId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/* Remove a teacher: deactivate (reversible) + unassign from any classes. */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({})) as { teacherId?: string }
  if (!body.teacherId) return NextResponse.json({ error: "Missing teacherId" }, { status: 400 })

  const s = await createServiceClient()
  // Unassign from classes so nothing is left pointing at an inactive teacher.
  await s.from("classes").update({ teacher_id: null })
    .eq("teacher_id", body.teacherId).eq("school_id", auth.schoolId)
  const { error, count } = await s
    .from("profiles").update({ is_active: false }, { count: "exact" })
    .eq("id", body.teacherId).eq("school_id", auth.schoolId).eq("role", "teacher")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (count === 0) return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
