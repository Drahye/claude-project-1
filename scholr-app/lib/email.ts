/**
 * Resend email helper — server-only.
 *
 * Uses Resend's REST API directly (no SDK, to avoid touching the dependency
 * tree). Configure with:
 *   RESEND_API_KEY   — your Resend key (starts with "re_")
 *   EMAIL_FROM       — verified sender, e.g. "Scholr <noreply@yourdomain.com>"
 *
 * sendEmail() never throws — it returns { ok, error } so callers can degrade
 * gracefully (an email failing should not break the action that triggered it).
 */

const RESEND_URL = "https://api.resend.com/emails"

export function isEmailConfigured() {
  const key = process.env.RESEND_API_KEY
  return !!key && key.startsWith("re_") && !key.includes("...")
}

interface SendArgs {
  to:       string | string[]
  subject:  string
  html:     string
  text?:    string
  replyTo?: string
}

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "Email not configured (missing RESEND_API_KEY)" }
  }

  const from = process.env.EMAIL_FROM || "Scholr <onboarding@resend.dev>"

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to:       Array.isArray(args.to) ? args.to : [args.to],
        subject:  args.subject,
        html:     args.html,
        ...(args.text    ? { text: args.text } : {}),
        ...(args.replyTo ? { reply_to: args.replyTo } : {}),
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      console.error("[email] Resend error", res.status, detail)
      return { ok: false, error: `Resend ${res.status}` }
    }
    return { ok: true }
  } catch (err) {
    console.error("[email] send failed", err)
    return { ok: false, error: err instanceof Error ? err.message : "send failed" }
  }
}

/* ── Branded wrapper ─────────────────────────────────────────────────────────
   Minimal, email-client-safe HTML shell with the Scholr mark. Pass a body
   (already-escaped HTML) and an optional CTA. */
export function emailLayout(opts: {
  heading: string
  body:    string        // HTML
  ctaLabel?: string
  ctaUrl?:   string
}): string {
  const cta = opts.ctaLabel && opts.ctaUrl
    ? `<tr><td style="padding:8px 0 4px">
         <a href="${opts.ctaUrl}"
            style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;
                   font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px">
           ${opts.ctaLabel}
         </a>
       </td></tr>`
    : ""

  return `<!doctype html>
<html><body style="margin:0;background:#f4f4f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 0">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;padding:32px;max-width:480px">
        <tr><td style="padding-bottom:20px">
          <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;color:#0b0d14">Scholr</span>
        </td></tr>
        <tr><td style="font-size:18px;font-weight:700;color:#0b0d14;padding-bottom:10px">${opts.heading}</td></tr>
        <tr><td style="font-size:14px;line-height:1.6;color:#3f4046;padding-bottom:18px">${opts.body}</td></tr>
        ${cta}
        <tr><td style="padding-top:24px;border-top:1px solid #ececed;font-size:12px;color:#9094a0">
          You're receiving this because your school uses Scholr.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}
