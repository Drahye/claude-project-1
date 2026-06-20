import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-auth"
import type { Student, StudentMedical } from "@/types/database"

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
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const studentId = typeof body.studentId === "string" ? body.studentId : ""
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 })

  const update: Partial<Student> = {}
  if (body.full_name !== undefined) {
    const n = String(body.full_name).trim()
    if (!n) return NextResponse.json({ error: "Name is required" }, { status: 400 })
    update.full_name = n
  }
  if (body.admission_number !== undefined) update.admission_number = String(body.admission_number).trim()
  if (body.date_of_birth !== undefined)    update.date_of_birth = body.date_of_birth ? String(body.date_of_birth) : null
  if (body.gender !== undefined && ["male", "female", "other"].includes(String(body.gender))) update.gender = body.gender as Student["gender"]
  if (body.photo_url !== undefined)        update.photo_url = body.photo_url ? String(body.photo_url) : null
  if (body.is_active !== undefined)        update.is_active = !!body.is_active
  if (body.medical !== undefined)          update.medical = cleanMedical(body.medical)

  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true })

  const s = await createServiceClient()
  const { error, count } = await s
    .from("students").update(update, { count: "exact" })
    .eq("id", studentId).eq("school_id", auth.schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (count === 0) return NextResponse.json({ error: "Student not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}

/* Remove a student from the school. */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({})) as { studentId?: string }
  if (!body.studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 })

  const s = await createServiceClient()

  // Verify the student belongs to THIS admin's school before touching anything.
  // Without this, a crafted studentId from another school would let its
  // enrollments + parent links be wiped below (cross-tenant tampering) — the
  // dependent deletes aren't school-scoped, only the final students delete is.
  const { data: owned } = await s
    .from("students").select("id").eq("id", body.studentId).eq("school_id", auth.schoolId).maybeSingle()
  if (!owned) return NextResponse.json({ error: "Student not found" }, { status: 404 })

  // Clear dependent links first (in case FKs aren't ON DELETE CASCADE), then delete.
  await s.from("student_class_enrollments").delete().eq("student_id", body.studentId)
  await s.from("parent_students").delete().eq("student_id", body.studentId)
  const { error } = await s
    .from("students").delete().eq("id", body.studentId).eq("school_id", auth.schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
