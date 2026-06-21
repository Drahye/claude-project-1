/**
 * Branded email templates for Scholr.
 * Each returns { subject, html } and uses the shared emailLayout shell.
 * Server-only (rendered before sendEmail).
 */
import { emailLayout } from "./email"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL
  || (process.env.NODE_ENV === "production" ? "https://getscholr.vercel.app" : "http://localhost:52999")

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/* ── 0a. Confirm email (signup verification) ───────────────────────────────── */
export function confirmSignupEmail(opts: { name?: string; confirmUrl: string }) {
  const first = esc((opts.name ?? "there").split(" ")[0] || "there")
  return {
    subject: "Confirm your email · Scholr",
    html: emailLayout({
      eyebrow: "Verify your email",
      heading: `Welcome to Scholr, ${first}!`,
      body: `
        <p style="margin:0 0 14px">You're one click away from setting up your school. Confirm your email address to activate your account.</p>
        <p style="margin:0">This link expires in 24 hours. If you didn't create a Scholr account, you can safely ignore this email.</p>`,
      ctaLabel: "Confirm my email",
      ctaUrl:   opts.confirmUrl,
      footnote: `If the button doesn't work, copy and paste this link:<br><span style="color:#4f46e5;word-break:break-all">${esc(opts.confirmUrl)}</span>`,
    }),
  }
}

/* ── 0b. Password reset ────────────────────────────────────────────────────── */
export function resetPasswordEmail(opts: { name?: string; resetUrl: string }) {
  const first = esc((opts.name ?? "there").split(" ")[0] || "there")
  return {
    subject: "Reset your password · Scholr",
    html: emailLayout({
      eyebrow: "Password reset",
      heading: `Hi ${first}, let's reset your password`,
      body: `
        <p style="margin:0 0 14px">We received a request to reset your Scholr password. Click below to choose a new one.</p>
        <p style="margin:0">This link expires in 1 hour. If you didn't request this, you can ignore this email — your password won't change.</p>`,
      ctaLabel: "Reset my password",
      ctaUrl:   opts.resetUrl,
      footnote: `If the button doesn't work, copy and paste this link:<br><span style="color:#4f46e5;word-break:break-all">${esc(opts.resetUrl)}</span>`,
    }),
  }
}

/* ── 1. New school welcome (admin signs up + creates a school) ──────────────── */
export function newSchoolWelcomeEmail(opts: { adminName: string; schoolName: string; inviteCode: string }) {
  const first  = esc(opts.adminName.split(" ")[0] || "there")
  const school = esc(opts.schoolName)
  const code   = esc(opts.inviteCode)
  const host   = APP_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")
  const pageUrl = `${host}/${code}`

  const step = (n: number, title: string, desc: string) => `
    <tr>
      <td width="34" valign="top" style="padding:0 0 18px">
        <span style="display:inline-block;width:26px;height:26px;border-radius:50%;background:#4f46e5;color:#ffffff;text-align:center;line-height:26px;font-weight:800;font-size:13px">${n}</span>
      </td>
      <td valign="top" style="padding:1px 0 18px 4px">
        <div style="font-size:14.5px;font-weight:700;color:#11131c;margin-bottom:3px">${title}</div>
        <div style="font-size:13.5px;color:#6b7280;line-height:1.55">${desc}</div>
      </td>
    </tr>`

  return {
    subject: `${opts.schoolName} is live on Scholr 🎉`,
    html: emailLayout({
      eyebrow: "Your school is live",
      heading: `Welcome to Scholr, ${first}!`,
      body: `
        <p style="margin:0 0 20px;font-size:15px;line-height:1.66;color:#454854">
          <strong style="color:#11131c">${school}</strong> is set up and ready. Here's everything you need to get going.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px">
          <tr><td style="background:#f6f7fc;border:1px solid #e9ebf6;border-radius:14px;padding:15px 18px">
            <div style="font-size:10.5px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:#8a8f9c;margin-bottom:5px">Your school page</div>
            <div style="font-size:15px;font-weight:700;color:#4f46e5;font-family:'SFMono-Regular',Consolas,monospace;word-break:break-all">${esc(pageUrl)}</div>
            <div style="font-size:12.5px;color:#8a8f9c;margin-top:6px;line-height:1.5">Where teachers &amp; parents log in. Style it your way under Customization.</div>
          </td></tr>
        </table>

        <div style="font-size:12px;font-weight:800;letter-spacing:0.07em;text-transform:uppercase;color:#11131c;margin:0 0 16px">Get started in 3 steps</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${step(1, "Invite your teachers", "Send invite links from the Teachers tab — they set their own password, no extra accounts to manage.")}
          ${step(2, "Create classes &amp; add students", "Set up your classes, enrol students, and link their parents in a couple of clicks.")}
          ${step(3, "Make your page yours", "Pick a theme, add your logo &amp; colours, and write a welcome message under Customization.")}
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 0">
          <tr><td style="border-top:1px solid #eceef5;padding-top:18px">
            <div style="font-size:13.5px;color:#6b7280;margin-bottom:9px">Your invite code — share it with teachers &amp; parents:</div>
            <span style="display:inline-block;background:#eef0fb;color:#4f46e5;font-weight:700;font-family:'SFMono-Regular',Consolas,monospace;font-size:15px;padding:9px 15px;border-radius:9px;letter-spacing:0.02em">${code}</span>
          </td></tr>
        </table>`,
      ctaLabel: "Open your dashboard",
      ctaUrl:   `${APP_URL}/admin/dashboard`,
      footnote: `Stuck on anything? Just reply to this email — a real person reads it.`,
    }),
  }
}

/* ── 2. Role welcome (teacher / parent completes signup) ────────────────────── */
export function roleWelcomeEmail(opts: { name: string; schoolName: string; role: "teacher" | "parent" }) {
  const first = esc(opts.name.split(" ")[0] || "there")
  const dashboard = opts.role === "teacher" ? `${APP_URL}/teacher/dashboard` : `${APP_URL}/parent/dashboard`
  const line = opts.role === "teacher"
    ? "You can now mark attendance, set homework, message parents, and generate weekly reports."
    : "You can now follow your child's attendance, homework, and weekly reports — and message their teachers."
  return {
    subject: `Welcome to ${opts.schoolName} on Scholr`,
    html: emailLayout({
      heading: `Hi ${first}, you're in!`,
      body: `
        <p style="margin:0 0 14px">Your account at <strong>${esc(opts.schoolName)}</strong> is ready.</p>
        <p style="margin:0">${line}</p>`,
      ctaLabel: "Go to your dashboard",
      ctaUrl:   dashboard,
    }),
  }
}

/* ── 3. Teacher invite ──────────────────────────────────────────────────────── */
export function teacherInviteEmail(opts: {
  teacherName: string; schoolName: string; inviteLink: string
  accent?: string; logoUrl?: string | null
}) {
  const first = esc(opts.teacherName.split(" ")[0] || "there")
  const school = esc(opts.schoolName)
  return {
    subject: `You're invited to join ${opts.schoolName} on Scholr`,
    html: emailLayout({
      accent:       opts.accent,
      brandName:    opts.schoolName,
      brandLogoUrl: opts.logoUrl ?? undefined,
      eyebrow:      "Teacher invitation",
      heading:      `${first}, welcome to ${school}`,
      body: `
        <p style="margin:0 0 14px">An administrator at <strong>${school}</strong> has invited you to join as a <strong>teacher</strong>.</p>
        <p style="margin:0 0 16px">Once you're in, you'll be able to:</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 4px">
          ${["Mark attendance in seconds", "Set & track homework", "Message parents in one inbox", "Generate AI weekly reports"]
            .map(t => `<tr><td style="padding:3px 0;color:#454854;font-size:14.5px"><span style="color:#10b981;font-weight:800;margin-right:8px">✓</span>${t}</td></tr>`).join("")}
        </table>`,
      ctaLabel: "Set up your account",
      ctaUrl:   opts.inviteLink,
      footnote: `This invite is just for you. If you weren't expecting it, you can ignore this email.`,
    }),
  }
}

/* ── 3b. Parent invite ──────────────────────────────────────────────────────── */
export function parentInviteEmail(opts: {
  parentName: string; schoolName: string; inviteLink: string
  childName?: string; accent?: string; logoUrl?: string | null
}) {
  const first  = esc(opts.parentName.split(" ")[0] || "there")
  const school = esc(opts.schoolName)
  const child  = opts.childName ? esc(opts.childName) : null
  return {
    subject: `Follow ${child ?? "your child"}'s progress at ${opts.schoolName}`,
    html: emailLayout({
      accent:       opts.accent,
      brandName:    opts.schoolName,
      brandLogoUrl: opts.logoUrl ?? undefined,
      eyebrow:      "Parent invitation",
      heading:      child ? `${first}, stay close to ${child}'s week` : `${first}, you're invited to ${school}`,
      body: `
        <p style="margin:0 0 14px"><strong>${school}</strong> has invited you to your parent portal${child ? ` for <strong>${child}</strong>` : ""} on Scholr.</p>
        <p style="margin:0 0 16px">In one place you'll see:</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 4px">
          ${["Attendance, the moment it's marked", "Homework due & submitted", "A friendly AI weekly report each Friday", "Direct messages with teachers"]
            .map(t => `<tr><td style="padding:3px 0;color:#454854;font-size:14.5px"><span style="color:#10b981;font-weight:800;margin-right:8px">✓</span>${t}</td></tr>`).join("")}
        </table>`,
      ctaLabel: "Set up your portal",
      ctaUrl:   opts.inviteLink,
      footnote: `This invite is just for you. If you weren't expecting it, you can ignore this email.`,
    }),
  }
}

/* ── 4. Parent absence alert ────────────────────────────────────────────────── */
export function absenceAlertEmail(opts: { parentName: string; studentName: string; date: string; schoolName: string }) {
  const first = esc(opts.parentName.split(" ")[0] || "there")
  return {
    subject: `${opts.studentName} was marked absent today`,
    html: emailLayout({
      heading: `Absence notice for ${esc(opts.studentName)}`,
      body: `
        <p style="margin:0 0 14px">Hi ${first},</p>
        <p style="margin:0 0 14px"><strong>${esc(opts.studentName)}</strong> was marked <strong style="color:#c0392b">absent</strong> at ${esc(opts.schoolName)} on <strong>${esc(opts.date)}</strong>.</p>
        <p style="margin:0">If this is unexpected, please contact the school. You can also message the teacher directly from your dashboard.</p>`,
      ctaLabel: "View attendance",
      ctaUrl:   `${APP_URL}/parent/children`,
    }),
  }
}

/* ── 5. Weekly report ready ─────────────────────────────────────────────────── */
export function reportReadyEmail(opts: { parentName: string; studentName: string; weekLabel: string }) {
  const first = esc(opts.parentName.split(" ")[0] || "there")
  return {
    subject: `${opts.studentName}'s weekly report is ready`,
    html: emailLayout({
      heading: `This week's report for ${esc(opts.studentName)}`,
      body: `
        <p style="margin:0 0 14px">Hi ${first},</p>
        <p style="margin:0 0 14px">A new weekly report for <strong>${esc(opts.studentName)}</strong> (${esc(opts.weekLabel)}) is now available — covering attendance, homework, and a note from the teacher.</p>
        <p style="margin:0">Open your dashboard to read it.</p>`,
      ctaLabel: "Read the report",
      ctaUrl:   `${APP_URL}/parent/reports`,
    }),
  }
}

/* ── 6. New message notification ────────────────────────────────────────────── */
export function newMessageEmail(opts: { recipientName: string; senderName: string; preview: string; dashboardPath: string }) {
  const first = esc(opts.recipientName.split(" ")[0] || "there")
  const preview = esc(opts.preview.slice(0, 140)) + (opts.preview.length > 140 ? "…" : "")
  return {
    subject: `New message from ${opts.senderName}`,
    html: emailLayout({
      heading: `${esc(opts.senderName)} sent you a message`,
      body: `
        <p style="margin:0 0 14px">Hi ${first},</p>
        <div style="margin:0 0 14px;padding:12px 14px;background:#f4f4f7;border-radius:10px;color:#3f4046;font-style:italic">
          "${preview}"
        </div>
        <p style="margin:0">Reply from your Scholr inbox.</p>`,
      ctaLabel: "Open messages",
      ctaUrl:   `${APP_URL}${opts.dashboardPath}`,
    }),
  }
}

/* ── 7. Admin (co-admin) invite ─────────────────────────────────────────────── */
export function adminInviteEmail(opts: {
  adminName: string; schoolName: string; inviteLink: string
  accent?: string; logoUrl?: string | null
}) {
  const first  = esc(opts.adminName.split(" ")[0] || "there")
  const school = esc(opts.schoolName)
  return {
    subject: `You're invited to help run ${opts.schoolName} on Scholr`,
    html: emailLayout({
      accent:       opts.accent,
      brandName:    opts.schoolName,
      brandLogoUrl: opts.logoUrl ?? undefined,
      eyebrow:      "Administrator invitation",
      heading:      `${first}, welcome to ${school}`,
      body: `
        <p style="margin:0 0 14px">The owner of <strong>${school}</strong> has invited you to join as an <strong>administrator</strong>.</p>
        <p style="margin:0 0 16px">You'll be able to manage students, teachers, classes, messages, and send school-wide announcements. (Billing and school settings stay with the school owner.)</p>`,
      ctaLabel: "Set up your account",
      ctaUrl:   opts.inviteLink,
      footnote: `This invite is just for you. If you weren't expecting it, you can ignore this email.`,
    }),
  }
}

/* ── 8. Class assignment (teacher assigned to a class) ──────────────────────── */
export function classAssignmentEmail(opts: {
  teacherName: string; schoolName: string; className: string; gradeLevel?: string
  accent?: string; logoUrl?: string | null
}) {
  const first = esc(opts.teacherName.split(" ")[0] || "there")
  const cls   = esc(opts.className)
  const grade = opts.gradeLevel ? ` (${esc(opts.gradeLevel)})` : ""
  return {
    subject: `You've been assigned to ${opts.className}`,
    html: emailLayout({
      accent:       opts.accent,
      brandName:    opts.schoolName,
      brandLogoUrl: opts.logoUrl ?? undefined,
      eyebrow:      "Class assignment",
      heading:      `${first}, you're now the teacher for ${cls}`,
      body: `
        <p style="margin:0 0 14px">An administrator at <strong>${esc(opts.schoolName)}</strong> has assigned you to <strong>${cls}${grade}</strong>.</p>
        <p style="margin:0">You can now mark attendance, set homework, add students, and message that class's parents from your dashboard.</p>`,
      ctaLabel: "Open your classes",
      ctaUrl:   `${APP_URL}/teacher/dashboard`,
    }),
  }
}

/* ── 9. Town Hall broadcast ─────────────────────────────────────────────────── */
export function townHallEmail(opts: {
  recipientName: string; schoolName: string; title: string; body: string
  role: "teacher" | "parent"; accent?: string; logoUrl?: string | null
}) {
  const first = esc(opts.recipientName.split(" ")[0] || "there")
  const dash  = opts.role === "teacher" ? "/teacher/townhall" : "/parent/townhall"
  // Preserve author line breaks as paragraphs.
  const bodyHtml = esc(opts.body)
    .split(/\n{2,}/).map(p => `<p style="margin:0 0 12px">${p.replace(/\n/g, "<br>")}</p>`).join("")
  return {
    subject: `${opts.schoolName}: ${opts.title}`,
    html: emailLayout({
      accent:       opts.accent,
      brandName:    opts.schoolName,
      brandLogoUrl: opts.logoUrl ?? undefined,
      eyebrow:      "Town Hall",
      heading:      esc(opts.title),
      body: `
        <p style="margin:0 0 14px">Hi ${first},</p>
        ${bodyHtml}`,
      ctaLabel: "View in Scholr",
      ctaUrl:   `${APP_URL}${dash}`,
    }),
  }
}
