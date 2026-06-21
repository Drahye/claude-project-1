import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-auth"
import { sendEmail, isEmailConfigured } from "@/lib/email"
import { townHallEmail } from "@/lib/email-templates"

/** Split an array into chunks of `size`. */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/** GET — recent broadcasts for the admin's school. */
export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const svc = await createServiceClient()
  const { data } = await svc
    .from("broadcasts")
    .select("id, title, body, created_at, author_id")
    .eq("school_id", auth.schoolId)
    .order("created_at", { ascending: false })
    .limit(50)

  return NextResponse.json({ broadcasts: data ?? [] })
}

/**
 * POST { title, body } — post a Town Hall broadcast.
 * Stores the broadcast, fans out an in-app notification to every active parent
 * and teacher in the school, and emails them (best-effort, chunked).
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({})) as { title?: unknown; body?: unknown }
  const title = String(body.title ?? "").trim()
  const message = String(body.body ?? "").trim()
  if (!title || !message) return NextResponse.json({ error: "Title and message are required." }, { status: 400 })
  if (title.length > 160) return NextResponse.json({ error: "Title is too long (max 160)." }, { status: 400 })

  const svc = await createServiceClient()

  // 1 — store the broadcast
  const { data: broadcast, error: bErr } = await svc
    .from("broadcasts")
    .insert({ school_id: auth.schoolId, author_id: auth.user.id, title: title.slice(0, 160), body: message.slice(0, 5000) })
    .select("id, title, body, created_at, author_id")
    .single() as unknown as { data: { id: string; title: string; body: string; created_at: string; author_id: string } | null; error: { message: string } | null }
  if (bErr || !broadcast) return NextResponse.json({ error: bErr?.message ?? "Failed to post" }, { status: 500 })

  // 2 — recipients: all active parents + teachers in the school
  const { data: recipients } = await svc
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("school_id", auth.schoolId)
    .in("role", ["parent", "teacher"])
    .eq("is_active", true) as unknown as
    { data: Array<{ id: string; full_name: string; email: string; role: "parent" | "teacher" }> | null }
  const list = recipients ?? []

  // 3 — in-app notifications (chunked insert)
  for (const part of chunk(list, 500)) {
    await svc.from("notifications").insert(part.map(r => ({
      school_id:    auth.schoolId,
      recipient_id: r.id,
      type:         "announcement" as const,
      title,
      body:         message.slice(0, 280),
      action_url:   r.role === "teacher" ? "/teacher/townhall" : "/parent/townhall",
      metadata:     { broadcast_id: broadcast.id },
    })))
  }

  // 4 — emails (best-effort, chunked, never blocks the response shape)
  let emailed = 0
  if (isEmailConfigured()) {
    const { data: school } = await svc
      .from("schools").select("name, public_color, primary_color, logo_url").eq("id", auth.schoolId).maybeSingle() as unknown as
      { data: { name: string; public_color: string | null; primary_color: string | null; logo_url: string | null } | null }
    const accent = school?.public_color || school?.primary_color || undefined
    for (const r of list) {
      if (!r.email) continue
      const mail = townHallEmail({
        recipientName: r.full_name, schoolName: school?.name ?? "your school",
        title, body: message, role: r.role, accent, logoUrl: school?.logo_url ?? null,
      })
      const sent = await sendEmail({ to: r.email, subject: mail.subject, html: mail.html })
      if (sent.ok) emailed++
    }
  }

  return NextResponse.json({ broadcast, notified: list.length, emailed }, { status: 201 })
}
