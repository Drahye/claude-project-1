import { NextResponse } from "next/server"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"
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
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .eq("school_id", school_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: "A teacher with this email already exists in this school." },
        { status: 409 }
      )
    }

    // Use plain supabase-js admin client — auth.admin methods aren't on the SSR wrapper
    const adminClient = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // Generate an invite link WITHOUT sending Supabase's own email — we send a
    // branded email via Resend instead.
    const { data: linkData, error: inviteError } = await adminClient.auth.admin.generateLink({
      type:  "invite",
      email: email.trim().toLowerCase(),
      options: {
        data: { full_name: full_name.trim(), role: "teacher", school_id },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/onboarding`,
      },
    })

    let authUserId: string
    let inviteLink: string | null = linkData?.properties?.action_link ?? null
    let emailSent = false

    if (inviteError) {
      const msg = inviteError.message ?? ""
      if (
        msg.toLowerCase().includes("rate limit") ||
        msg.toLowerCase().includes("already been registered") ||
        msg.toLowerCase().includes("already registered")
      ) {
        // User already exists — keep the teacher record; no fresh link to send
        const { data: existingUser } = await adminClient.auth.admin.listUsers()
        const found = existingUser?.users?.find(
          u => u.email?.toLowerCase() === email.trim().toLowerCase()
        )
        authUserId = found?.id ?? crypto.randomUUID()
        inviteLink = null
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
      const { data: school } = await (service.from("schools") as any)
        .select("name").eq("id", school_id).single()
      const mail = teacherInviteEmail({
        teacherName: full_name.trim(),
        schoolName:  school?.name ?? "your school",
        inviteLink,
      })
      const sent = await sendEmail({ to: email.trim().toLowerCase(), subject: mail.subject, html: mail.html })
      emailSent = sent.ok
    }

    return NextResponse.json({
      teacher:    { ...profile, classes: [] },
      email_sent: emailSent,
    }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
