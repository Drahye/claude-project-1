import { NextRequest, NextResponse } from "next/server"
import { limitOr429 } from "@/lib/rate-limit"
import { createClient as createAdminClient } from "@supabase/supabase-js"

const ALLOWED = new Set(["view", "login_click"])

function svc() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Public endpoint — records a single public-page event. Fails silently/soft so
// it never blocks page interaction. Validates the event type and resolves the
// slug server-side (never trusts a school_id from the client).
export async function POST(req: NextRequest) {
  const limited = limitOr429(req, "track", 120, 60_000); if (limited) return limited
  let body: { slug?: string; event?: string }
  try { body = await req.json() } catch { return NextResponse.json({ ok: false }, { status: 400 }) }

  const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : ""
  const event = body.event
  if (!slug || !event || !ALLOWED.has(event)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    const s = svc()
    const { data: school } = await s.from("schools").select("id").eq("slug", slug).maybeSingle()
    if (school) {
      await (s as any).from("school_page_events").insert({ school_id: (school as any).id, event })
    }
  } catch {
    // swallow — analytics must never break the public page
  }
  return NextResponse.json({ ok: true })
}
