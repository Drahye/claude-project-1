import { NextResponse, type NextRequest } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email"
import { newSchoolWelcomeEmail } from "@/lib/email-templates"

/**
 * Self-serve onboarding provisions a SCHOOL and its first admin.
 *
 * Teachers and parents never reach here: they are invited (their profile is
 * pre-created by the invite flow) and only set a password on /{slug}/join. So
 * this endpoint only ever creates an admin. Accepting a teacher/parent role here
 * would let any freshly-signed-up account self-join an arbitrary school by slug,
 * bypassing invites and gaining access to that tenant's data — so we reject it.
 */
export async function POST(request: NextRequest) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({})) as {
    role?: string
    schoolName?: string
    schoolCountry?: string
    fullName?: string
    phone?: string
  }
  const { role, schoolName, schoolCountry, fullName, phone } = body

  if (role !== "admin") {
    return NextResponse.json(
      { error: "Only school administrators can self-register. Teachers and parents join via an invite." },
      { status: 403 },
    )
  }
  if (!schoolName?.trim()) return NextResponse.json({ error: "School name is required." }, { status: 400 })
  if (!fullName?.trim())   return NextResponse.json({ error: "Your name is required." }, { status: 400 })

  // Service-role client — bypasses RLS for the onboarding writes below.
  const supabase = await createServiceClient()

  // Derive a unique slug from the school name.
  const baseSlug = schoolName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const { data: existing } = await supabase.from("schools").select("id").eq("slug", slug).maybeSingle()
    if (!existing) break
    attempt++
    slug = `${baseSlug}-${attempt}`
    if (attempt > 20) return NextResponse.json({ error: "Could not generate a unique school slug." }, { status: 500 })
  }

  const { data: school, error: schoolErr } = await (supabase as any)
    .from("schools")
    .insert({ name: schoolName.trim(), slug, country: schoolCountry ?? "US" })
    .select("id, name, slug")
    .single()

  if (schoolErr || !school) {
    return NextResponse.json({ error: schoolErr?.message ?? "Failed to create school." }, { status: 500 })
  }

  const { error: profileErr } = await (supabase as any)
    .from("profiles")
    .insert({
      id:        user.id,
      school_id: school.id,
      role:      "admin",
      full_name: fullName.trim(),
      email:     user.email!,
      phone:     phone?.trim() || null,
    })

  if (profileErr) {
    // Roll back the school we just created so a retry can start clean.
    await (supabase as any).from("schools").delete().eq("id", school.id)
    if (profileErr.code === "23505") {
      return NextResponse.json({ error: "Profile already exists." }, { status: 409 })
    }
    return NextResponse.json({ error: profileErr.message }, { status: 500 })
  }

  // Welcome email (best-effort — never blocks onboarding).
  try {
    if (user.email) {
      const mail = newSchoolWelcomeEmail({ adminName: fullName.trim(), schoolName: school.name, inviteCode: school.slug })
      await sendEmail({ to: user.email, subject: mail.subject, html: mail.html })
    }
  } catch (e) {
    console.error("[onboarding] welcome email failed", e)
  }

  return NextResponse.json({ success: true, role: "admin" })
}
