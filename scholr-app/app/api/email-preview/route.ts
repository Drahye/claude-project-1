import { NextResponse } from "next/server"
import { teacherInviteEmail, parentInviteEmail, newSchoolWelcomeEmail, confirmSignupEmail, resetPasswordEmail } from "@/lib/email-templates"

// Dev-only: preview invite emails in the browser.
//   /api/_email-preview?type=teacher
//   /api/_email-preview?type=parent&accent=%2310b981
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 })
  }
  const url    = new URL(req.url)
  const type   = url.searchParams.get("type") ?? "teacher"
  const accent = url.searchParams.get("accent") ?? "#4f46e5"
  const logo   = url.searchParams.get("logo") ?? null

  const mail =
    type === "welcome" ? newSchoolWelcomeEmail({ adminName: "Amara Okafor", schoolName: "Rehoboth Academy", inviteCode: "rehoboth-academy" })
    : type === "confirm" ? confirmSignupEmail({ name: "Amara Okafor", confirmUrl: "#" })
    : type === "reset"   ? resetPasswordEmail({ name: "Amara Okafor", resetUrl: "#" })
    : type === "parent"  ? parentInviteEmail({ parentName: "Maria Okafor", schoolName: "Rehoboth Academy", childName: "Amara", inviteLink: "#", accent, logoUrl: logo })
    : teacherInviteEmail({ teacherName: "Olumide Bello", schoolName: "Rehoboth Academy", inviteLink: "#", accent, logoUrl: logo })

  return new Response(mail.html, { headers: { "Content-Type": "text/html; charset=utf-8" } })
}
