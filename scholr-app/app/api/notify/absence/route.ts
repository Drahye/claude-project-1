import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { sendEmail, isEmailConfigured } from "@/lib/email"
import { absenceAlertEmail } from "@/lib/email-templates"
import { formatDate } from "@/lib/utils"

/** POST { studentIds: string[], date: string } — alert parents of absent students */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: caller } = await supabase
    .from("profiles").select("school_id, role").eq("id", user.id).single() as unknown as {
      data: { school_id: string; role: string } | null
    }
  if (!caller || !["teacher", "admin", "super_admin"].includes(caller.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { studentIds, date } = await req.json()
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return NextResponse.json({ ok: true, notified: 0 })
  }

  const s = await createServiceClient()
  const schoolId = caller.school_id
  const dateLabel = date ? formatDate(date, "long") : formatDate(new Date(), "long")

  // School name
  const { data: school } = await s.from("schools").select("name").eq("id", schoolId).single()
  const schoolName = school?.name ?? "the school"

  // Students (scoped to school) → names
  const { data: students } = await s
    .from("students").select("id, full_name").in("id", studentIds).eq("school_id", schoolId)
  const studentName = new Map<string, string>((students ?? []).map((x: any) => [x.id, x.full_name]))
  const validIds = (students ?? []).map((x: any) => x.id)
  if (validIds.length === 0) return NextResponse.json({ ok: true, notified: 0 })

  // Parent links for these students
  const { data: links } = await s
    .from("parent_students").select("student_id, parent_id").in("student_id", validIds)
  const parentIds = [...new Set((links ?? []).map((l: any) => l.parent_id))] as string[]
  if (parentIds.length === 0) return NextResponse.json({ ok: true, notified: 0 })

  // Parent profiles
  const { data: parents } = await s
    .from("profiles").select("id, full_name, email").in("id", parentIds)
  const parentById = new Map<string, any>((parents ?? []).map((p: any) => [p.id, p]))

  const emailOn = isEmailConfigured()
  let notified = 0

  for (const link of links ?? []) {
    const parent = parentById.get(link.parent_id)
    const sName  = studentName.get(link.student_id)
    if (!parent || !sName) continue

    // In-app notification (powers the Alerts badge)
    await s.from("notifications").insert({
      school_id:    schoolId,
      recipient_id: parent.id,
      type:         "absence",
      title:        `${sName} was marked absent`,
      body:         `${sName} was marked absent on ${dateLabel}.`,
      action_url:   "/parent/children",
      is_read:      false,
    })

    // Email (best-effort)
    if (emailOn && parent.email) {
      const mail = absenceAlertEmail({ parentName: parent.full_name, studentName: sName, date: dateLabel, schoolName })
      await sendEmail({ to: parent.email, subject: mail.subject, html: mail.html })
    }
    notified++
  }

  return NextResponse.json({ ok: true, notified })
}
