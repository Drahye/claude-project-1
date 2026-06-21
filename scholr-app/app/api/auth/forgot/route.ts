import { NextRequest, NextResponse } from "next/server"
import { limitOr429 } from "@/lib/rate-limit"
import { createServiceClient } from "@/lib/supabase/server"
import { sendEmail, hasVerifiedSender } from "@/lib/email"
import { resetPasswordEmail } from "@/lib/email-templates"

// Code-driven password reset via Resend (branded template). Always returns ok so
// it never reveals whether an email is registered.
export async function POST(req: NextRequest) {
  const limited = limitOr429(req, "forgot", 5, 60_000); if (limited) return limited
  const body = await req.json().catch(() => ({})) as { email?: string }
  const email = body.email?.trim().toLowerCase()
  if (!email || !/.+@.+\..+/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })

  // No verified Resend domain → client falls back to Supabase's built-in reset email.
  if (!hasVerifiedSender()) return NextResponse.json({ ok: true, fallback: true })

  const origin = new URL(req.url).origin
  const admin = await createServiceClient()

  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email })

  // No such user (or other) — respond ok anyway (no account enumeration).
  if (error || !data?.properties) return NextResponse.json({ ok: true })

  const tokenHash = (data.properties as { hashed_token?: string }).hashed_token
  if (tokenHash) {
    const confirmUrl = `${origin}/api/auth/confirm?token_hash=${tokenHash}&type=recovery&next=${encodeURIComponent("/reset-password")}`
    const { subject, html } = resetPasswordEmail({ resetUrl: confirmUrl })
    await sendEmail({ to: email, subject, html })
  }
  return NextResponse.json({ ok: true })
}
