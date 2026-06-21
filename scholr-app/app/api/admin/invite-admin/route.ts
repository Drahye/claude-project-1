import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { requireSuperAdmin } from "@/lib/api-auth"
import { sendEmail, isEmailConfigured } from "@/lib/email"
import { adminInviteEmail } from "@/lib/email-templates"

/**
 * Invite a limited co-admin. Only the school owner (super_admin) may do this.
 * Mirrors invite-teacher, but creates a profile with role 'admin' and no
 * teachers extension row. The new admin can manage students/teachers/classes/
 * messages/town-hall but not billing, school settings, danger zone, or other
 * admins (enforced by requireSuperAdmin on those routes + nav gating).
 */
export async function POST(req: Request) {
  try {
    // Owner-only. school_id comes from the session, never the body.
    const auth = await requireSuperAdmin()
    if (auth instanceof NextResponse) return auth
    const school_id = auth.schoolId

    const { full_name, email } = await req.json()
    if (!full_name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 })
    }
    const cleanEmail = email.trim().toLowerCase()

    const service = await createServiceClient()

    // Already a member of this school?
    const { data: existing } = await service
      .from("profiles")
      .select("id, is_active, role")
      .eq("email", cleanEmail)
      .eq("school_id", school_id)
      .maybeSingle() as unknown as { data: { id: string; is_active: boolean; role: string } | null }

    if (existing) {
      if (existing.is_active) {
        // Promote an existing active teacher/parent to admin in place.
        if (existing.role === "admin" || existing.role === "super_admin") {
          return NextResponse.json({ error: "This person is already an admin." }, { status: 409 })
        }
        const { data: promoted } = await service.from("profiles")
          .update({ role: "admin", full_name: full_name.trim() })
          .eq("id", existing.id).select().single()
        return NextResponse.json({ admin: promoted, email_sent: false, promoted: true }, { status: 200 })
      }
      const { data: revived } = await service.from("profiles")
        .update({ is_active: true, role: "admin", full_name: full_name.trim() })
        .eq("id", existing.id).select().single()
      return NextResponse.json({ admin: revived, email_sent: false, reactivated: true }, { status: 200 })
    }

    const { data: schoolRow } = await service.from("schools")
      .select("slug, name, public_color, primary_color, logo_url").eq("id", school_id).single()
    const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const joinPath = schoolRow?.slug ? `/${schoolRow.slug}/join` : "/admin/dashboard"

    const joinUrl = (hash: string, type: "invite" | "recovery") =>
      schoolRow?.slug
        ? `${appUrl}/${schoolRow.slug}/join?token_hash=${hash}&type=${type}`
        : `${appUrl}/api/auth/confirm?token_hash=${hash}&type=${type}&next=${encodeURIComponent(joinPath)}`

    const { data: linkData, error: inviteError } = await service.auth.admin.generateLink({
      type:  "invite",
      email: cleanEmail,
      options: {
        data: { full_name: full_name.trim(), role: "admin", school_id },
        redirectTo: `${appUrl}/api/auth/callback?next=${encodeURIComponent(joinPath)}`,
      },
    })

    let authUserId: string
    let inviteLink: string | null = linkData?.properties?.hashed_token
      ? joinUrl(linkData.properties.hashed_token, "invite") : null
    let emailSent = false

    if (inviteError) {
      const msg = (inviteError.message ?? "").toLowerCase()
      if (msg.includes("rate limit") || msg.includes("already been registered") || msg.includes("already registered")) {
        const { data: existingUser } = await service.auth.admin.listUsers()
        const found = existingUser?.users?.find(u => u.email?.toLowerCase() === cleanEmail)
        authUserId = found?.id ?? crypto.randomUUID()
        const { data: recov } = await service.auth.admin.generateLink({ type: "recovery", email: cleanEmail })
        inviteLink = recov?.properties?.hashed_token ? joinUrl(recov.properties.hashed_token, "recovery") : null
      } else {
        return NextResponse.json({ error: inviteError.message }, { status: 500 })
      }
    } else {
      authUserId = linkData?.user?.id ?? crypto.randomUUID()
    }

    const { data: profile, error: profileError } = await service.from("profiles")
      .upsert(
        { id: authUserId, school_id, role: "admin", full_name: full_name.trim(), email: cleanEmail, is_active: true },
        { onConflict: "id" }
      )
      .select()
      .single()

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    if (inviteLink && isEmailConfigured()) {
      const mail = adminInviteEmail({
        adminName:  full_name.trim(),
        schoolName: schoolRow?.name ?? "your school",
        inviteLink,
        accent:     schoolRow?.public_color || schoolRow?.primary_color || undefined,
        logoUrl:    schoolRow?.logo_url ?? null,
      })
      const sent = await sendEmail({ to: cleanEmail, subject: mail.subject, html: mail.html })
      emailSent = sent.ok
    }

    return NextResponse.json({ admin: profile, email_sent: emailSent, invite_link: inviteLink }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Demote or remove a co-admin. Owner-only. Cannot touch a super_admin. */
export async function DELETE(req: Request) {
  const auth = await requireSuperAdmin()
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({})) as { adminId?: string; mode?: "demote" | "remove" }
  if (!body.adminId) return NextResponse.json({ error: "Missing adminId" }, { status: 400 })
  if (body.adminId === auth.user.id) return NextResponse.json({ error: "You can't remove yourself." }, { status: 400 })

  const service = await createServiceClient()
  // Only act on a limited admin in this school — never a super_admin.
  const update = body.mode === "demote"
    ? { role: "teacher" as const }   // demote to teacher (keeps them in the school)
    : { is_active: false }
  const { error, count } = await service.from("profiles")
    .update(update, { count: "exact" })
    .eq("id", body.adminId).eq("school_id", auth.schoolId).eq("role", "admin")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (count === 0) return NextResponse.json({ error: "Admin not found." }, { status: 404 })

  // A demote-to-teacher needs a teachers extension row for FKs.
  if (body.mode === "demote") {
    await service.from("teachers").upsert({ id: body.adminId, school_id: auth.schoolId }, { onConflict: "id" })
  }
  return NextResponse.json({ ok: true })
}
