import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import type { Student, StudentMedical, StudentPersonal } from "@/types/database"

const MED_KEYS: (keyof StudentMedical)[] = [
  "blood_group", "allergies", "conditions", "medications",
  "emergency_contact_name", "emergency_contact_phone", "doctor", "notes",
]
const PERSONAL_KEYS: (keyof StudentPersonal)[] = ["hobbies", "interests", "languages", "dietary", "about"]

function pick<T extends string>(keys: T[], input: unknown, cap: number): Record<T, string> {
  const out = {} as Record<T, string>
  if (input && typeof input === "object") {
    for (const k of keys) {
      const v = (input as Record<string, unknown>)[k]
      if (typeof v === "string") out[k] = v.trim().slice(0, cap)
    }
  }
  return out
}

/* Parent updates their OWN child's personal info, medical record, and/or photo. */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const childId = typeof body.childId === "string" ? body.childId : ""
  if (!childId) return NextResponse.json({ error: "Missing childId" }, { status: 400 })

  const s = await createServiceClient()

  // Ownership: this child must be linked to the signed-in parent.
  const { data: link } = await s
    .from("parent_students").select("student_id")
    .eq("parent_id", user.id).eq("student_id", childId).maybeSingle()
  if (!link) return NextResponse.json({ error: "Not your child" }, { status: 403 })

  const update: Partial<Student> = {}
  if (body.personal !== undefined) update.personal = pick(PERSONAL_KEYS, body.personal, 1500)
  if (body.medical !== undefined)  update.medical  = pick(MED_KEYS, body.medical, 1000)
  if (body.photo_url !== undefined) update.photo_url = typeof body.photo_url === "string" ? body.photo_url : null

  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true })

  const { error } = await s.from("students").update(update).eq("id", childId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
