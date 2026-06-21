import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-auth"
import { sendEmail, isEmailConfigured } from "@/lib/email"
import { classAssignmentEmail } from "@/lib/email-templates"
import type { Class } from "@/types/database"

/**
 * Notify a teacher (email + in-app) that they've been assigned to a class.
 * Best-effort — never throws so it can't break the create/update response.
 */
async function notifyAssignment(
  svc: Awaited<ReturnType<typeof createServiceClient>>,
  schoolId: string,
  teacherId: string,
  cls: { name: string; grade_level: string },
) {
  try {
    const { data: teacher } = await svc
      .from("profiles").select("full_name, email")
      .eq("id", teacherId).eq("school_id", schoolId).eq("role", "teacher").maybeSingle() as unknown as
      { data: { full_name: string; email: string } | null }
    if (!teacher) return

    // In-app notification (always)
    await svc.from("notifications").insert({
      school_id:    schoolId,
      recipient_id: teacherId,
      type:         "announcement",
      title:        `You've been assigned to ${cls.name}`,
      body:         `You're now the teacher for ${cls.name} (${cls.grade_level}). Open your dashboard to manage it.`,
      action_url:   "/teacher/dashboard",
    })

    // Branded email (best-effort)
    if (teacher.email && isEmailConfigured()) {
      const { data: school } = await svc
        .from("schools").select("name, public_color, primary_color, logo_url").eq("id", schoolId).maybeSingle() as unknown as
        { data: { name: string; public_color: string | null; primary_color: string | null; logo_url: string | null } | null }
      const mail = classAssignmentEmail({
        teacherName: teacher.full_name,
        schoolName:  school?.name ?? "your school",
        className:   cls.name,
        gradeLevel:  cls.grade_level,
        accent:      school?.public_color || school?.primary_color || undefined,
        logoUrl:     school?.logo_url ?? null,
      })
      await sendEmail({ to: teacher.email, subject: mail.subject, html: mail.html })
    }
  } catch (err) {
    console.error("[class] assignment notify failed", err)
  }
}

/** Create a class. If a teacher is assigned, email + notify them. */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const name = String(body.name ?? "").trim()
  if (!name) return NextResponse.json({ error: "Class name is required" }, { status: 400 })
  const grade_level = String(body.grade_level ?? "").trim()
  const academic_year = String(body.academic_year ?? "").trim()
  const teacher_id = typeof body.teacher_id === "string" && body.teacher_id ? body.teacher_id : null

  const svc = await createServiceClient()

  // If a teacher is supplied, verify they belong to this school.
  if (teacher_id) {
    const { data: t } = await svc.from("teachers").select("id").eq("id", teacher_id).eq("school_id", auth.schoolId).maybeSingle()
    if (!t) return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
  }

  const { data: cls, error } = await svc
    .from("classes")
    .insert({ school_id: auth.schoolId, name: name.slice(0, 80), grade_level, academic_year, teacher_id })
    .select()
    .single() as unknown as { data: Class | null; error: { message: string } | null }

  if (error || !cls) return NextResponse.json({ error: error?.message ?? "Failed to create class" }, { status: 500 })

  if (teacher_id) await notifyAssignment(svc, auth.schoolId, teacher_id, { name: cls.name, grade_level: cls.grade_level })

  return NextResponse.json({ class: cls }, { status: 201 })
}

/** Update a class. If the teacher changes to a new teacher, email + notify them. */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const classId = typeof body.classId === "string" ? body.classId : ""
  if (!classId) return NextResponse.json({ error: "Missing classId" }, { status: 400 })

  const svc = await createServiceClient()
  const { data: existing } = await svc
    .from("classes").select("id, name, grade_level, teacher_id")
    .eq("id", classId).eq("school_id", auth.schoolId).maybeSingle() as unknown as
    { data: { id: string; name: string; grade_level: string; teacher_id: string | null } | null }
  if (!existing) return NextResponse.json({ error: "Class not found" }, { status: 404 })

  const update: Partial<Class> = {}
  if (body.name !== undefined) {
    const n = String(body.name).trim()
    if (!n) return NextResponse.json({ error: "Class name is required" }, { status: 400 })
    update.name = n.slice(0, 80)
  }
  if (body.grade_level !== undefined)   update.grade_level = String(body.grade_level).trim().slice(0, 40)
  if (body.academic_year !== undefined) update.academic_year = String(body.academic_year).trim().slice(0, 20)

  let assignedTeacher: string | null = null
  if (body.teacher_id !== undefined) {
    const teacher_id = typeof body.teacher_id === "string" && body.teacher_id ? body.teacher_id : null
    if (teacher_id) {
      const { data: t } = await svc.from("teachers").select("id").eq("id", teacher_id).eq("school_id", auth.schoolId).maybeSingle()
      if (!t) return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }
    update.teacher_id = teacher_id
    // Only notify when it changed to a real (different) teacher.
    if (teacher_id && teacher_id !== existing.teacher_id) assignedTeacher = teacher_id
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true })

  const { error } = await svc.from("classes").update(update).eq("id", classId).eq("school_id", auth.schoolId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (assignedTeacher) {
    await notifyAssignment(svc, auth.schoolId, assignedTeacher, {
      name: update.name ?? existing.name,
      grade_level: update.grade_level ?? existing.grade_level,
    })
  }

  return NextResponse.json({ ok: true })
}
