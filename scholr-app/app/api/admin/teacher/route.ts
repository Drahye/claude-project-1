import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function svc() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized", status: 401 as const }
  const { data: profile } = await supabase
    .from("profiles").select("school_id, role").eq("id", user.id).single() as unknown as
    { data: { school_id: string; role: string } | null }
  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return { error: "Forbidden", status: 403 as const }
  }
  return { schoolId: profile.school_id }
}

/* Edit a teacher's profile + teaching details. */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const teacherId = typeof body.teacherId === "string" ? body.teacherId : ""
  if (!teacherId) return NextResponse.json({ error: "Missing teacherId" }, { status: 400 })

  const s = svc()

  // Profile fields (scoped to this school's teachers only)
  const profileUpdate: Record<string, unknown> = {}
  if (body.full_name !== undefined) {
    const n = String(body.full_name).trim()
    if (!n) return NextResponse.json({ error: "Name is required" }, { status: 400 })
    profileUpdate.full_name = n
  }
  if (body.phone !== undefined) profileUpdate.phone = String(body.phone).trim() || null

  if (Object.keys(profileUpdate).length > 0) {
    const { error, count } = await (s as any)
      .from("profiles").update(profileUpdate, { count: "exact" })
      .eq("id", teacherId).eq("school_id", auth.schoolId).eq("role", "teacher")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (count === 0) return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
  }

  // Teaching details
  const teacherUpdate: Record<string, unknown> = {}
  if (body.subjects !== undefined) {
    const subs = Array.isArray(body.subjects)
      ? body.subjects
      : String(body.subjects).split(",").map(x => x.trim()).filter(Boolean)
    teacherUpdate.subjects = subs
  }
  if (body.employee_number !== undefined) teacherUpdate.employee_number = String(body.employee_number).trim() || null

  if (Object.keys(teacherUpdate).length > 0) {
    const { error } = await (s as any)
      .from("teachers").update(teacherUpdate).eq("id", teacherId).eq("school_id", auth.schoolId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/* Remove a teacher: deactivate (reversible) + unassign from any classes. */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json().catch(() => ({})) as { teacherId?: string }
  if (!body.teacherId) return NextResponse.json({ error: "Missing teacherId" }, { status: 400 })

  const s = svc()
  // Unassign from classes so nothing is left pointing at an inactive teacher.
  await (s as any).from("classes").update({ teacher_id: null })
    .eq("teacher_id", body.teacherId).eq("school_id", auth.schoolId)
  const { error, count } = await (s as any)
    .from("profiles").update({ is_active: false }, { count: "exact" })
    .eq("id", body.teacherId).eq("school_id", auth.schoolId).eq("role", "teacher")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (count === 0) return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
