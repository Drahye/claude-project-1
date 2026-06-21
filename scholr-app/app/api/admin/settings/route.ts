import { NextRequest, NextResponse }        from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireSuperAdmin }                from "@/lib/api-auth"
import { isPaidPlan }                       from "@/lib/plans"
import type { School }                      from "@/types/database"

export async function POST(req: NextRequest) {
  // 1 — school branding/settings is owner-only. A limited admin gets 403 here.
  //     (This route uses the service client below, which bypasses RLS, so the
  //     code guard — not the DB policy — is the real enforcement.)
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth
  const profile = { school_id: auth.schoolId, role: auth.role }
  const supabase = await createClient()

  // Plan gate: paid public-page perks can only be saved on a paid plan.
  const { data: schoolRow } = await supabase
    .from("schools")
    .select("subscription_plan")
    .eq("id", profile.school_id)
    .single() as unknown as { data: { subscription_plan: string } | null }
  const paid = isPaidPlan(schoolRow?.subscription_plan)

  // 2 — parse body
  const body = await req.json()
  const {
    name, country, timezone, primary_color, logo_url, public_color, theme,
    welcome_headline, welcome_subtext, hero_image_url, contact_email, contact_phone,
    hide_branding, content_blocks,
  } = body
  // Partial update — only change fields that were actually sent, so different
  // surfaces (Brand tab vs Public-page tab) never clobber each other's fields.
  const svc = await createServiceClient()
  const updateData: Partial<School> = {}
  if (name !== undefined) {
    if (!name.trim()) return NextResponse.json({ error: "School name is required" }, { status: 400 })
    updateData.name = name.trim()
  }
  if (country !== undefined)          updateData.country = country ?? null
  if (timezone !== undefined)         updateData.timezone = timezone ?? null
  if (primary_color !== undefined)    updateData.primary_color = primary_color ?? null
  if (public_color !== undefined)     updateData.public_color = public_color ?? null
  if (theme !== undefined && paid)    updateData.theme = theme || "aurora"
  if (logo_url !== undefined)         updateData.logo_url = logo_url
  // Public /{slug} branding fields (added in migration 010)
  if (welcome_headline !== undefined) updateData.welcome_headline = welcome_headline?.trim() || null
  if (welcome_subtext  !== undefined) updateData.welcome_subtext  = welcome_subtext?.trim()  || null
  if (hero_image_url   !== undefined) updateData.hero_image_url   = hero_image_url || null
  if (contact_email    !== undefined) updateData.contact_email    = contact_email?.trim()    || null
  if (contact_phone    !== undefined) updateData.contact_phone    = contact_phone?.trim()    || null
  if (hide_branding    !== undefined && paid) updateData.hide_branding = !!hide_branding
  if (content_blocks   !== undefined && paid) {
    // Sanitise: array of { id, title, body } with non-empty titles, capped.
    const clean = Array.isArray(content_blocks)
      ? content_blocks
          .filter((b: unknown): b is { id?: string; title?: string; body?: string } =>
            !!b && typeof b === "object")
          .map((b) => ({
            id: String(b.id ?? crypto.randomUUID()),
            title: String(b.title ?? "").trim().slice(0, 120),
            body: String(b.body ?? "").trim().slice(0, 2000),
          }))
          .filter((b) => b.title || b.body)
          .slice(0, 12)
      : []
    updateData.content_blocks = clean
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ ok: true })
  }

  const { error: updateErr, count } = await svc
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
