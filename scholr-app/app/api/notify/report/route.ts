import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { sendEmail, isEmailConfigured } from "@/lib/email"
import { reportReadyEmail } from "@/lib/email-templates"
import { formatDate } from "@/lib/utils"

/** POST { studentId, weekStart } — tell parents a weekly report is ready */
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

  const { studentId, weekStart } = await req.json()
  if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 })

  const s = await createServiceClient()
  const schoolId = caller.school_id
  const weekLabel = weekStart ? `week of ${formatDate(weekStart)}` : "this week"

  const { data: student } = await (s as any)
    .from("students").select("full_name").eq("id", studentId).eq("school_id", schoolId).maybeSingle()
  if (!student) return NextResponse.json({ ok: true, notified: 0 })

  const { data: links } = await (s as any)
    .from("parent_students").select("parent_id").eq("student_id", studentId)
  const parentIds = [...new Set((links ?? []).map((l: any) => l.parent_id))] as string[]
  if (parentIds.length === 0) return NextResponse.json({ ok: true, notified: 0 })

  const { data: parents } = await (s as any)
    .from("profiles").select("id, full_name, email").in("id", parentIds)

  const emailOn = isEmailConfigured()
  let notified = 0

  for (const parent of parents ?? []) {
    await (s as any).from("notifications").insert({
      school_id:    schoolId,
      recipient_id: parent.id,
      type:         "report",
      title:        `${student.full_name}'s weekly report is ready`,
      body:         `A new weekly report for ${student.full_name} (${weekLabel}) is available.`,
      action_url:   "/parent/reports",
      is_read:      false,
    })

    if (emailOn && parent.email) {
      const mail = reportReadyEmail({ parentName: parent.full_name, studentName: student.full_name, weekLabel })
      await sendEmail({ to: parent.email, subject: mail.subject, html: mail.html })
    }
    notified++
  }

  return NextResponse.json({ ok: true, notified })
}
