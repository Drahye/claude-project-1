import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function serviceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getAuthProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", user.id)
    .single() as unknown as { data: { school_id: string; role: string } | null }

  return { user, profile }
}

/* ── GET — list images for the school ──────────────────────────────────── */
export async function GET() {
  const { user, profile } = await getAuthProfile()
  if (!user || !profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isAdmin = profile.role === "admin" || profile.role === "super_admin"
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const svc = serviceClient()
  const { data, error } = await (svc as any)
    .from("gallery_images")
    .select("id, url, name, storage_path, uploaded_at")
    .eq("school_id", profile.school_id)
    .order("uploaded_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ images: data ?? [] })
}

/* ── DELETE — remove an image ───────────────────────────────────────────── */
export async function DELETE(req: NextRequest) {
  const { user, profile } = await getAuthProfile()
  if (!user || !profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const isAdmin = profile.role === "admin" || profile.role === "super_admin"
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id, storage_path } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const svc = serviceClient()

  // Delete the DB row (also verifies ownership via school_id)
  const { error: dbErr } = await (svc as any)
    .from("gallery_images")
    .delete()
    .eq("id", id)
    .eq("school_id", profile.school_id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // Best-effort storage deletion (don't fail if already gone)
  if (storage_path) {
    await svc.storage.from("school-assets").remove([storage_path])
  }

  return NextResponse.json({ ok: true })
}
