import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function svc() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

/** A teacher edits the details of a class they own (homeroom teacher). */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const classId = typeof body.classId === "string" ? body.classId : ""
  if (!classId) return NextResponse.json({ error: "Missing classId" }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (body.name !== undefined) {
    const n = String(body.name).trim()
    if (!n) return NextResponse.json({ error: "Class name is required" }, { status: 400 })
    update.name = n.slice(0, 80)
  }
  if (body.grade_level !== undefined)   update.grade_level = String(body.grade_level).trim().slice(0, 40)
  if (body.academic_year !== undefined) update.academic_year = String(body.academic_year).trim().slice(0, 20)
  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true })

  const { error, count } = await (svc() as any)
    .from("classes").update(update, { count: "exact" })
    .eq("id", classId).eq("teacher_id", user.id)   // ownership: must be the homeroom teacher
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (count === 0) return NextResponse.json({ error: "You can only edit a class you teach." }, { status: 403 })
  return NextResponse.json({ ok: true })
}
