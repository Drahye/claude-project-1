import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { sendEmail, isEmailConfigured } from "@/lib/email"
import { teacherInviteEmail } from "@/lib/email-templates"

export async function POST(req: Request) {
  try {
    const { full_name, email, school_id } = await req.json()

    if (!full_name?.trim() || !email?.trim() || !school_id) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
    }

    // Auth check — only admins of this school can invite teachers
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 })

    const { data: callerProfile } = await authClient
      .from("profiles")
      .select("role, school_id")
      .eq("id", user.id)
      .single() as unknown as { data: { role: string; school_id: string } | null }

    if (
      !callerProfile ||
      (callerProfile.role !== "admin" && callerProfile.role !== "super_admin") ||
      callerProfile.school_id !== school_id
    ) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    // Service-role client — bypasses RLS
    const service = await createServiceClient()

    // Check if a profile with this email already exists in this school
    const { data: existing } = await service
      .from("profiles")
      .select("id, is_active")
      .eq("email", email.trim().toLowerCase())
      .eq("school_id", school_id)
      .maybeSingle() as unknown as { data: { id: string; is_active: boolean } | null }

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { error: "A teacher with this email already exists in this school." },
          { status: 409 }
        )
      }
      // Previously removed (deactivated) → reactivate and return them to the roster.
      const { data: revived } = await (service.from("profiles") as any)
        .update({ is_active: true, full_name: full_name.trim() })
        .eq("id", existing.id).select().single()
      await (service.from("teachers") as any).upsert({ id: existing.id, school_id }, { onConflict: "id" })
      return NextResponse.json({ teacher: { ...revived, classes: [] }, email_sent: false, reactivated: true }, { status: 200 })
    }

    // `service` is a plain service-role client, so auth.admin methods are available.
    // Branded school slug → the invite lands on /{slug}/join (set password)
    const { data: schoolRow } = await (service.from("schools") as any)
      .select("slug, name, public_color, primary_color, logo_url").eq("id", school_id).single()
    const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const joinPath = schoolRow?.slug ? `/${schoolRow.slug}/join` : "/onboarding"

    // Point straight at the school join page with the token as a query param.
    // The token is verified ONLY when the teacher submits the form (a real user
    // action), so Gmail/Brevo link-prefetch bots that GET the link can't consume
    // the one-time token first. Falls back to the server confirm route if there's
    // no school slug.
    const joinUrl = (hash: string, type: "invite" | "recovery") =>
      schoolRow?.slug
        ? `${appUrl}/${schoolRow.slug}/join?token_hash=${hash}&type=${type}`
        : `${appUrl}/api/auth/confirm?token_hash=${hash}&type=${type}&next=${encodeURIComponent(joinPath)}`

    // Generate an invite link WITHOUT sending Supabase's own email — we send a
    // branded email via Resend instead.
    const { data: linkData, error: inviteError } = await service.auth.admin.generateLink({
      type:  "invite",
      email: email.trim().toLowerCase(),
      options: {
        data: { full_name: full_name.trim(), role: "teacher", school_id },
        redirectTo: `${appUrl}/api/auth/callback?next=${encodeURIComponent(joinPath)}`,
      },
    })

    let authUserId: string
    let inviteLink: string | null = linkData?.properties?.hashed_token
      ? joinUrl(linkData.properties.hashed_token, "invite") : null
    let emailSent = false

    if (inviteError) {
      const msg = inviteError.message ?? ""
      if (
        msg.toLowerCase().includes("rate limit") ||
        msg.toLowerCase().includes("already been registered") ||
        msg.toLowerCase().includes("already registered")
      ) {
        // The auth user already exists (e.g. re-invited). Generate a RECOVERY
        // link instead of an invite so there's still a usable link: it lets them
        // set a password and land on the school join page.
        const { data: existingUser } = await service.auth.admin.listUsers()
        const found = existingUser?.users?.find(
          u => u.email?.toLowerCase() === email.trim().toLowerCase()
        )
        authUserId = found?.id ?? crypto.randomUUID()
        const { data: recov } = await service.auth.admin.generateLink({
          type: "recovery",
          email: email.trim().toLowerCase(),
        })
        inviteLink = recov?.properties?.hashed_token
          ? joinUrl(recov.properties.hashed_token, "recovery") : null
      } else {
        return NextResponse.json({ error: inviteError.message }, { status: 500 })
      }
    } else {
      authUserId = linkData?.user?.id ?? crypto.randomUUID()
    }

    const { data: profile, error: profileError } = await (service.from("profiles") as any)
      .upsert(
        {
          id:        authUserId,
          school_id,
          role:      "teacher",
          full_name: full_name.trim(),
          email:     email.trim().toLowerCase(),
          is_active: true,
        },
        { onConflict: "id" }
      )
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Create the teachers extension row so class assignment, attendance,
    // and homework foreign keys resolve. Idempotent — safe to re-run.
    const { error: teacherErr } = await (service.from("teachers") as any)
      .upsert({ id: authUserId, school_id }, { onConflict: "id" })

    if (teacherErr) {
      return NextResponse.json({ error: teacherErr.message }, { status: 500 })
    }

    // Send the branded invite email via Resend (best-effort)
    if (inviteLink && isEmailConfigured()) {
      const mail = teacherInviteEmail({
        teacherName: full_name.trim(),
        schoolName:  schoolRow?.name ?? "your school",
        inviteLink,
        accent:      schoolRow?.public_color || schoolRow?.primary_color || undefined,
        logoUrl:     schoolRow?.logo_url ?? null,
      })
      const sent = await sendEmail({ to: email.trim().toLowerCase(), subject: mail.subject, html: mail.html })
      emailSent = sent.ok
    }

    return NextResponse.json({
      teacher:     { ...profile, classes: [] },
      email_sent:  emailSent,
      invite_link: inviteLink,   // for the admin to share manually if email fails
    }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
