import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireTeacher } from "@/lib/api-auth"

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

function clean(row: StudentInput): CleanStudent | null {
  const full_name = String(row.full_name ?? "").trim()
  const admission_number = String(row.admission_number ?? "").trim()
  if (!full_name || !admission_number) return null
  const g = String(row.gender ?? "").trim().toLowerCase()
  const gender = (g === "male" || g === "female" || g === "other") ? g : null
  const dobRaw = String(row.date_of_birth ?? "").trim()
  // Accept YYYY-MM-DD only; ignore anything else rather than error the batch.
  const date_of_birth = /^\d{4}-\d{2}-\d{2}$/.test(dobRaw) ? dobRaw : null
  return { full_name: full_name.slice(0, 120), admission_number: admission_number.slice(0, 40), gender, date_of_birth }
}

/**
 * Teacher adds students (manual single OR CSV batch) into a class they teach.
 * Body: { classId, students: StudentInput[] }  (a single student is just a
 * one-element array). Dedupes admission numbers within the school and skips any
 * that already exist. New students are enrolled into classId.
 */
export async function POST(req: NextRequest) {
  const auth = await requireTeacher()
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({})) as { classId?: string; students?: StudentInput[] }
  const classId = typeof body.classId === "string" ? body.classId : ""
  if (!classId) return NextResponse.json({ error: "Missing classId" }, { status: 400 })

  const rawRows = Array.isArray(body.students) ? body.students : []
  if (rawRows.length === 0) return NextResponse.json({ error: "No students provided" }, { status: 400 })
  if (rawRows.length > 500) return NextResponse.json({ error: "Too many rows (max 500 per import)" }, { status: 400 })

  const svc = await createServiceClient()

  // The teacher must own this class.
  const { data: cls } = await svc
    .from("classes").select("id").eq("id", classId).eq("teacher_id", auth.user.id).eq("school_id", auth.schoolId).maybeSingle()
  if (!cls) return NextResponse.json({ error: "You can only add students to a class you teach." }, { status: 403 })

  // Validate + de-dupe within the submitted batch (last write wins on adm. no.).
  const byAdm = new Map<string, CleanStudent>()
  let invalid = 0
  for (const r of rawRows) {
    const c = clean(r)
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
    return NextResponse.json({ created: 0, skipped, invalid, enrolled: 0, message: "All those students already exist." })
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

  // Enroll all new students into the class.
  const newRows = inserted ?? []
  if (newRows.length > 0) {
    await svc.from("student_class_enrollments")
      .insert(newRows.map(s => ({ student_id: s.id as string, class_id: classId })))
  }

  return NextResponse.json({
    created:  newRows.length,
    skipped,
    invalid,
    enrolled: newRows.length,
    students: newRows,
  }, { status: 201 })
}
