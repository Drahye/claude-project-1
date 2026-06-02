import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function serviceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized", status: 401 as const, schoolId: "" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", user.id)
    .single() as unknown as { data: { school_id: string; role: string } | null }

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return { error: "Forbidden", status: 403 as const, schoolId: "" }
  }
  return { error: null, status: 200 as const, schoolId: profile.school_id }
}

/** POST { studentId, classId } — set the student's class (classId "" = unenrol) */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { studentId, classId } = await req.json()
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 })

  const svc = serviceClient()

  // Verify the student belongs to the admin's school
  const { data: student } = await (svc as any)
    .from("students").select("id").eq("id", studentId).eq("school_id", auth.schoolId).maybeSingle()
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

  // If a class is provided, verify it's in the same school
  if (classId) {
    const { data: cls } = await (svc as any)
      .from("classes").select("id").eq("id", classId).eq("school_id", auth.schoolId).maybeSingle()
    if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 })
  }

  // Replace any existing enrolment with the new one (single class per student here)
  await (svc as any).from("student_class_enrollments").delete().eq("student_id", studentId)

  if (classId) {
    const { error } = await (svc as any)
      .from("student_class_enrollments")
      .insert({ student_id: studentId, class_id: classId })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
