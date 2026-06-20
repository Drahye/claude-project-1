import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import type { StudentActivity } from "@/types/database"

function svc() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const CATEGORIES = new Set(["sport", "swimming", "club", "creative", "music", "other"])

/** Verify the signed-in teacher owns `classId` AND `studentId` is enrolled in it. */
async function canManage(s: ReturnType<typeof svc>, teacherId: string, classId: string, studentId: string) {
  const { data: cls } = await (s as any).from("classes").select("id").eq("id", classId).eq("teacher_id", teacherId).maybeSingle()
  if (!cls) return false
  const { data: enr } = await (s as any).from("student_class_enrollments").select("student_id").eq("class_id", classId).eq("student_id", studentId).maybeSingle()
  return !!enr
}

async function getActivities(s: ReturnType<typeof svc>, studentId: string): Promise<StudentActivity[]> {
  const { data } = await (s as any).from("students").select("activities").eq("id", studentId).maybeSingle()
  return Array.isArray(data?.activities) ? data.activities : []
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { classId?: string; studentId?: string; name?: string; category?: string }
  const { classId, studentId } = body
  const name = (body.name ?? "").trim().slice(0, 60)
  const category = CATEGORIES.has(body.category ?? "") ? body.category! : "club"
  if (!classId || !studentId || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const s = svc()
  if (!(await canManage(s, user.id, classId, studentId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const activities = await getActivities(s, studentId)
  if (activities.length >= 30) return NextResponse.json({ error: "Too many activities" }, { status: 400 })
  const next = [...activities, { id: crypto.randomUUID(), name, category, added_by_role: "teacher" }]
  const { error } = await (s as any).from("students").update({ activities: next }).eq("id", studentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, activities: next })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { classId?: string; studentId?: string; activityId?: string }
  const { classId, studentId, activityId } = body
  if (!classId || !studentId || !activityId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const s = svc()
  if (!(await canManage(s, user.id, classId, studentId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const activities = await getActivities(s, studentId)
  const next = activities.filter(a => a.id !== activityId)
  const { error } = await (s as any).from("students").update({ activities: next }).eq("id", studentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, activities: next })
}
