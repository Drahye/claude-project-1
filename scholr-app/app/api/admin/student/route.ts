import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { StudentMedical } from "@/types/database"

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

const MED_KEYS: (keyof StudentMedical)[] = [
  "blood_group", "allergies", "conditions", "medications",
  "emergency_contact_name", "emergency_contact_phone", "doctor", "notes",
]
function cleanMedical(input: unknown): StudentMedical {
  const out: StudentMedical = {}
  if (input && typeof input === "object") {
    for (const k of MED_KEYS) {
      const v = (input as Record<string, unknown>)[k]
      if (typeof v === "string") out[k] = v.trim().slice(0, 1000)
    }
  }
  return out
}

/* Edit a student's core fields, photo, active state, and/or medical record. */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const studentId = typeof body.studentId === "string" ? body.studentId : ""
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (body.full_name !== undefined) {
    const n = String(body.full_name).trim()
    if (!n) return NextResponse.json({ error: "Name is required" }, { status: 400 })
    update.full_name = n
  }
  if (body.admission_number !== undefined) update.admission_number = String(body.admission_number).trim()
  if (body.date_of_birth !== undefined)    update.date_of_birth = body.date_of_birth || null
  if (body.gender !== undefined && ["male", "female", "other"].includes(String(body.gender))) update.gender = body.gender
  if (body.photo_url !== undefined)        update.photo_url = body.photo_url || null
  if (body.is_active !== undefined)        update.is_active = !!body.is_active
  if (body.medical !== undefined)          update.medical = cleanMedical(body.medical)

  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true })

  const { error, count } = await (svc() as any)
    .from("students").update(update, { count: "exact" })
    .eq("id", studentId).eq("school_id", auth.schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (count === 0) return NextResponse.json({ error: "Student not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}

/* Remove a student from the school. */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json().catch(() => ({})) as { studentId?: string }
  if (!body.studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 })

  const s = svc()
  // Clear dependent links first (in case FKs aren't ON DELETE CASCADE), then delete.
  await (s as any).from("student_class_enrollments").delete().eq("student_id", body.studentId)
  await (s as any).from("parent_students").delete().eq("student_id", body.studentId)
  const { error } = await (s as any)
    .from("students").delete().eq("id", body.studentId).eq("school_id", auth.schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
