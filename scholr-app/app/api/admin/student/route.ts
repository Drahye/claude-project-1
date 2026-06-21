import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-auth"
import type { Student, StudentMedical } from "@/types/database"

interface StudentInput {
  full_name?: unknown
  admission_number?: unknown
  gender?: unknown
  date_of_birth?: unknown
}
interface CleanStudent {
  full_name: string
  admission_number: string
  gender: "male" | "female" | "other" | null
  date_of_birth: string | null
}
function cleanRow(row: StudentInput): CleanStudent | null {
  const full_name = String(row.full_name ?? "").trim()
  const admission_number = String(row.admission_number ?? "").trim()
  if (!full_name || !admission_number) return null
  const g = String(row.gender ?? "").trim().toLowerCase()
  const gender = (g === "male" || g === "female" || g === "other") ? g : null
  const dobRaw = String(row.date_of_birth ?? "").trim()
  const date_of_birth = /^\d{4}-\d{2}-\d{2}$/.test(dobRaw) ? dobRaw : null
  return { full_name: full_name.slice(0, 120), admission_number: admission_number.slice(0, 40), gender, date_of_birth }
}

/**
 * Admin adds students (manual single OR CSV batch). Body:
 *   { students: StudentInput[], classId?: string }
 * Dedupes admission numbers within the batch, skips any that already exist in
 * the school, and (optionally) enrols the new students in classId. school_id
 * comes from the session — never the body — so writes stay tenant-scoped.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({})) as { students?: StudentInput[]; classId?: string }
  const classId = typeof body.classId === "string" && body.classId ? body.classId : null

  const rawRows = Array.isArray(body.students) ? body.students : []
  if (rawRows.length === 0) return NextResponse.json({ error: "No students provided" }, { status: 400 })
  if (rawRows.length > 500) return NextResponse.json({ error: "Too many rows (max 500 per import)" }, { status: 400 })

  const svc = await createServiceClient()

  // If a class was given, it must belong to this admin's school.
  if (classId) {
    const { data: cls } = await svc
      .from("classes").select("id").eq("id", classId).eq("school_id", auth.schoolId).maybeSingle()
    if (!cls) return NextResponse.json({ error: "That class doesn't belong to your school." }, { status: 403 })
  }

  // Validate + de-dupe within the submitted batch (last write wins on adm. no.).
  const byAdm = new Map<string, CleanStudent>()
  let invalid = 0
  for (const r of rawRows) {
    const c = cleanRow(r)
    if (!c) { invalid++; continue }
    byAdm.set(c.admission_number.toLowerCase(), c)
  }
  const candidates = [...byAdm.values()]
  if (candidates.length === 0) {
    return NextResponse.json({ error: "No valid rows. Each student needs a name and admission number." }, { status: 400 })
  }

  // Skip admission numbers that already exist in this school.
  const { data: existingRows } = await svc
    .from("students").select("admission_number")
    .eq("school_id", auth.schoolId)
    .in("admission_number", candidates.map(c => c.admission_number)) as unknown as
    { data: Array<{ admission_number: string }> | null }
  const existing = new Set((existingRows ?? []).map(r => r.admission_number.toLowerCase()))
  const toInsert = candidates.filter(c => !existing.has(c.admission_number.toLowerCase()))
  const skipped = candidates.length - toInsert.length

  if (toInsert.length === 0) {
    return NextResponse.json({ created: 0, skipped, invalid, enrolled: 0, students: [], message: "All those students already exist." })
  }

  const { data: inserted, error } = await svc
    .from("students")
    .insert(toInsert.map(c => ({
      school_id:        auth.schoolId,
      full_name:        c.full_name,
      admission_number: c.admission_number,
      is_active:        true,
      ...(c.gender ? { gender: c.gender } : {}),
      ...(c.date_of_birth ? { date_of_birth: c.date_of_birth } : {}),
    })))
    .select("id, full_name, admission_number, gender, date_of_birth, photo_url, is_active, created_at") as unknown as
    { data: Array<Record<string, unknown>> | null; error: { message: string } | null }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const newRows = inserted ?? []
  if (classId && newRows.length > 0) {
    await svc.from("student_class_enrollments")
      .insert(newRows.map(s => ({ student_id: s.id as string, class_id: classId })))
  }

  return NextResponse.json({
    created:  newRows.length,
    skipped,
    invalid,
    enrolled: classId ? newRows.length : 0,
    students: newRows,
  }, { status: 201 })
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
