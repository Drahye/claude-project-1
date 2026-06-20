import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/api-auth"

/* ── GET — list images for the school ──────────────────────────────────── */
export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const svc = await createServiceClient()
  const { data, error } = await (svc as any)
    .from("gallery_images")
    .select("id, url, name, storage_path, uploaded_at")
    .eq("school_id", auth.schoolId)
    .order("uploaded_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ images: data ?? [] })
}

/* ── DELETE — remove an image ───────────────────────────────────────────── */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id, storage_path } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const svc = await createServiceClient()

  // Delete the DB row (also verifies ownership via school_id)
  const { error: dbErr } = await (svc as any)
    .from("gallery_images")
    .delete()
    .eq("id", id)
    .eq("school_id", auth.schoolId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // Best-effort storage deletion (don't fail if already gone)
  if (storage_path) {
    await svc.storage.from("school-assets").remove([storage_path])
  }

  return NextResponse.json({ ok: true })
}
