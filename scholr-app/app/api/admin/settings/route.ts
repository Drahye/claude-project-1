import { NextRequest, NextResponse }        from "next/server"
import { createClient }                    from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function serviceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  // 1 — verify caller is an authenticated admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", user.id)
    .single() as unknown as { data: { school_id: string; role: string } | null; error: unknown }

  if (profileErr || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 })
  }

  if (profile.role !== "admin" && profile.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // 2 — parse body
  const body = await req.json()
  const { name, country, timezone, primary_color, logo_url } = body
  if (!name?.trim()) return NextResponse.json({ error: "School name is required" }, { status: 400 })

  // 3 — update via plain service-role client (fully bypasses RLS)
  const svc = serviceClient()
  const updateData: Record<string, unknown> = {
    name:          name.trim(),
    country:       country  ?? null,
    timezone:      timezone ?? null,
    primary_color: primary_color ?? null,
  }
  if (logo_url !== undefined) updateData.logo_url = logo_url

  const { error: updateErr, count } = await (svc as any)
    .from("schools")
    .update(updateData, { count: "exact" })
    .eq("id", profile.school_id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  if (count === 0) {
    return NextResponse.json({ error: "School not found — no rows were updated." }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
