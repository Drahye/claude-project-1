import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { sendEmail, isEmailConfigured } from "@/lib/email"
import { newMessageEmail } from "@/lib/email-templates"

const PATH_BY_ROLE: Record<string, string> = {
  parent:      "/parent/messages",
  teacher:     "/teacher/messages",
  admin:       "/admin/messages",
  super_admin: "/admin/messages",
}

/** POST { threadId } — email the other participants about a new message */
export async function POST(req: NextRequest) {
  if (!isEmailConfigured()) return NextResponse.json({ ok: true, notified: 0 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { threadId } = await req.json()
  if (!threadId) return NextResponse.json({ error: "Missing threadId" }, { status: 400 })

  const s = await createServiceClient()

  // Thread + participants (verify caller is a participant)
  const { data: thread } = await (s as any)
    .from("message_threads").select("id, participant_ids, school_id").eq("id", threadId).maybeSingle()
  if (!thread || !thread.participant_ids?.includes(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const recipientIds = (thread.participant_ids as string[]).filter(id => id !== user.id)
  if (recipientIds.length === 0) return NextResponse.json({ ok: true, notified: 0 })

  // Sender name + latest message preview
  const { data: sender } = await (s as any).from("profiles").select("full_name").eq("id", user.id).maybeSingle()
  const senderName = sender?.full_name ?? "Someone"

  const { data: latest } = await (s as any)
    .from("messages").select("body").eq("thread_id", threadId).order("sent_at", { ascending: false }).limit(1)
  const preview = latest?.[0]?.body ?? "You have a new message."

  // Recipients
  const { data: recips } = await (s as any)
    .from("profiles").select("id, full_name, email, role").in("id", recipientIds)

  let notified = 0
  for (const r of recips ?? []) {
    if (!r.email) continue
    const mail = newMessageEmail({
      recipientName: r.full_name,
      senderName,
      preview,
      dashboardPath: PATH_BY_ROLE[r.role] ?? "/parent/messages",
    })
    await sendEmail({ to: r.email, subject: mail.subject, html: mail.html })
    notified++
  }

  return NextResponse.json({ ok: true, notified })
}
