import { NextResponse, type NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { sendEmail } from "@/lib/email"
import { newSchoolWelcomeEmail, roleWelcomeEmail } from "@/lib/email-templates"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()

  // Auth client — reads session from cookies
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Service-role client — bypasses RLS for onboarding writes
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.json() as {
    role: "parent" | "teacher" | "admin"
    schoolSlug?: string
    schoolName?: string
    schoolCountry?: string
    fullName: string
    phone?: string
    relationship?: string
  }

  const { role, schoolSlug, schoolName, schoolCountry, fullName, phone, relationship } = body

  // ── Resolve school ──────────────────────────────────────────────────────────

  let schoolId: string

  if (role === "admin") {
    if (!schoolName?.trim()) {
      return NextResponse.json({ error: "School name is required." }, { status: 400 })
    }

    // Generate a unique slug from the school name
    const baseSlug = schoolName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    let slug = baseSlug
    let attempt = 0

    // Ensure slug uniqueness
    while (true) {
      const { data: existing } = await supabase
        .from("schools").select("id").eq("slug", slug).maybeSingle()
      if (!existing) break
      attempt++
      slug = `${baseSlug}-${attempt}`
      if (attempt > 20) return NextResponse.json({ error: "Could not generate a unique school slug." }, { status: 500 })
    }

    const { data: school, error: schoolErr } = await supabase
      .from("schools")
      .insert({ name: schoolName.trim(), slug, country: schoolCountry ?? "US" })
      .select("id")
      .single()

    if (schoolErr || !school) {
      return NextResponse.json({ error: schoolErr?.message ?? "Failed to create school." }, { status: 500 })
    }

    schoolId = school.id
  } else {
    if (!schoolSlug?.trim()) {
      return NextResponse.json({ error: "Invite code is required." }, { status: 400 })
    }

    const { data: school } = await supabase
      .from("schools")
      .select("id")
      .eq("slug", schoolSlug.toLowerCase().trim())
      .maybeSingle()

    if (!school) {
      return NextResponse.json({ error: "School not found. Please check your invite code." }, { status: 404 })
    }

    schoolId = school.id
  }

  // ── Create profile ──────────────────────────────────────────────────────────

  const { error: profileErr } = await supabase
    .from("profiles")
    .insert({
      id:        user.id,
      school_id: schoolId,
      role,
      full_name: fullName.trim(),
      email:     user.email!,
      phone:     phone?.trim() || null,
    })

  if (profileErr) {
    if (profileErr.code === "23505") {
      return NextResponse.json({ error: "Profile already exists." }, { status: 409 })
    }
    return NextResponse.json({ error: profileErr.message }, { status: 500 })
  }

  // ── Create role-specific record ─────────────────────────────────────────────

  if (role === "teacher") {
    const { error: teacherErr } = await supabase
      .from("teachers")
      .insert({ id: user.id, school_id: schoolId })

    if (teacherErr) {
      // Roll back profile if teacher record fails
      await supabase.from("profiles").delete().eq("id", user.id)
      return NextResponse.json({ error: teacherErr.message }, { status: 500 })
    }
  }

  if (role === "parent") {
    const { error: parentErr } = await supabase
      .from("parents")
      .insert({
        id:                   user.id,
        school_id:            schoolId,
        relationship_to_child: relationship?.trim() || "Parent",
      })

    if (parentErr) {
      await supabase.from("profiles").delete().eq("id", user.id)
      return NextResponse.json({ error: parentErr.message }, { status: 500 })
    }
  }

  // ── Welcome email (best-effort — never blocks onboarding) ────────────────────
  try {
    const { data: school } = await supabase
      .from("schools").select("name, slug").eq("id", schoolId).single() as unknown as {
        data: { name: string; slug: string } | null
      }
    const schoolNameResolved = school?.name ?? "your school"

    if (user.email) {
      const mail = role === "admin"
        ? newSchoolWelcomeEmail({ adminName: fullName, schoolName: schoolNameResolved, inviteCode: school?.slug ?? "" })
        : roleWelcomeEmail({ name: fullName, schoolName: schoolNameResolved, role: role as "teacher" | "parent" })
      await sendEmail({ to: user.email, subject: mail.subject, html: mail.html })
    }
  } catch (e) {
    console.error("[onboarding] welcome email failed", e)
  }

  return NextResponse.json({ success: true, role })
}
