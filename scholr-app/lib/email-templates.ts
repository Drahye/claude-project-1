/**
 * Branded email templates for Scholr.
 * Each returns { subject, html } and uses the shared emailLayout shell.
 * Server-only (rendered before sendEmail).
 */
import { emailLayout } from "./email"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:52999"

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/* ── 1. New school welcome (admin signs up + creates a school) ──────────────── */
export function newSchoolWelcomeEmail(opts: { adminName: string; schoolName: string; inviteCode: string }) {
  const first = esc(opts.adminName.split(" ")[0] || "there")
  return {
    subject: `${opts.schoolName} is live on Scholr 🎉`,
    html: emailLayout({
      heading: `Welcome to Scholr, ${first}!`,
      body: `
        <p style="margin:0 0 14px">Your school <strong>${esc(opts.schoolName)}</strong> is set up and ready to go.</p>
        <p style="margin:0 0 14px">Here's how to get started:</p>
        <ul style="margin:0 0 14px;padding-left:18px;color:#3f4046">
          <li style="margin-bottom:6px">Invite your teachers</li>
          <li style="margin-bottom:6px">Create your classes</li>
          <li style="margin-bottom:6px">Add students and link their parents</li>
        </ul>
        <p style="margin:0 0 6px">Your school invite code (share it with teachers &amp; parents):</p>
        <p style="margin:0 0 4px">
          <span style="display:inline-block;background:#eef0fb;color:#4f46e5;font-weight:700;
                       font-family:monospace;font-size:15px;padding:8px 14px;border-radius:8px;letter-spacing:0.02em">
            ${esc(opts.inviteCode)}
          </span>
        </p>`,
      ctaLabel: "Open your dashboard",
      ctaUrl:   `${APP_URL}/admin/dashboard`,
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
export function teacherInviteEmail(opts: { teacherName: string; schoolName: string; inviteLink: string }) {
  const first = esc(opts.teacherName.split(" ")[0] || "there")
  return {
    subject: `You've been invited to join ${opts.schoolName} on Scholr`,
    html: emailLayout({
      heading: `${first}, you've been invited to ${esc(opts.schoolName)}`,
      body: `
        <p style="margin:0 0 14px">An administrator at <strong>${esc(opts.schoolName)}</strong> has invited you to join their school on Scholr as a teacher.</p>
        <p style="margin:0">Click below to set up your account — it only takes a minute.</p>`,
      ctaLabel: "Accept invitation",
      ctaUrl:   opts.inviteLink,
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
