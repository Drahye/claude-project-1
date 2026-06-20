import { NextRequest, NextResponse } from "next/server"
import { limitOr429 } from "@/lib/rate-limit"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { sendEmail, hasVerifiedSender } from "@/lib/email"
import { confirmSignupEmail } from "@/lib/email-templates"

// Code-driven signup: we create the user + generate a confirmation link via the
// admin API and send it through Resend (with our branded template), instead of
// relying on Supabase's built-in (rate-limited) email.
export async function POST(req: NextRequest) {
  const limited = limitOr429(req, "signup", 6, 60_000); if (limited) return limited
  const body = await req.json().catch(() => ({})) as { email?: string; password?: string; fullName?: string }
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ""
  const fullName = body.fullName?.trim() ?? ""

  if (!email || !/.+@.+\..+/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })

  // No verified Resend domain yet → let the client use Supabase's built-in
  // confirmation email (delivers to anyone, just rate-limited). Auto-upgrades to
  // Resend the moment EMAIL_FROM points at a verified domain.
  if (!hasVerifiedSender()) return NextResponse.json({ ok: true, fallback: true })

  const origin = new URL(req.url).origin
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (error) {
    const already = /registered|already|exists/i.test(error.message)
    return NextResponse.json(
      { error: already ? "That email is already registered. Try signing in instead." : error.message },
      { status: 400 },
    )
  }

  const tokenHash = (data?.properties as { hashed_token?: string } | undefined)?.hashed_token
  if (!tokenHash) return NextResponse.json({ error: "Could not start signup. Please try again." }, { status: 500 })

  const confirmUrl = `${origin}/api/auth/confirm?token_hash=${tokenHash}&type=signup&next=${encodeURIComponent("/onboarding")}`

  const { subject, html } = confirmSignupEmail({ name: fullName, confirmUrl })
  const sent = await sendEmail({ to: email, subject, html })
  if (!sent.ok) return NextResponse.json({ error: "Couldn't send the confirmation email. Please try again shortly." }, { status: 502 })

  return NextResponse.json({ ok: true })
}
