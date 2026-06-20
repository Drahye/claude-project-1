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
const BREVO_URL  = "https://api.brevo.com/v3/smtp/email"

/** Parse "Name <email@x.com>" or a bare "email@x.com" into Brevo's sender shape. */
function parseSender(raw?: string): { email: string; name: string } | null {
  if (!raw) return null
  const m = raw.match(/^\s*(.*?)\s*<\s*(.+?)\s*>\s*$/)
  if (m && /.+@.+/.test(m[2])) return { name: m[1] || "Scholr", email: m[2] }
  if (/.+@.+/.test(raw)) return { email: raw.trim(), name: "Scholr" }
  return null
}

function resendConfigured() {
  const key = process.env.RESEND_API_KEY
  return !!key && key.startsWith("re_") && !key.includes("...")
}

function brevoConfigured() {
  return !!process.env.BREVO_API_KEY && !!parseSender(process.env.BREVO_SENDER)
}

export function isEmailConfigured() {
  return brevoConfigured() || resendConfigured()
}

/**
 * True only when Resend can actually deliver to ARBITRARY recipients — i.e. a
 * real verified sending domain is configured via EMAIL_FROM (not the shared
 * `resend.dev` sandbox, which only delivers to the account owner).
 * When false, auth flows fall back to Supabase's built-in email so signups
 * still work for everyone (just rate-limited) until a domain is added.
 */
export function hasVerifiedSender() {
  // Specifically: can RESEND deliver to arbitrary recipients (a real domain)?
  // This only gates the in-code Resend auth path; Brevo auth goes via Supabase SMTP.
  const from = process.env.EMAIL_FROM
  return resendConfigured() && !!from && !/resend\.dev/i.test(from)
}

interface SendArgs {
  to:       string | string[]
  subject:  string
  html:     string
  text?:    string
  replyTo?: string
}

export async function sendEmail(args: SendArgs): Promise<{ ok: boolean; error?: string }> {
  // Prefer Brevo (transactional API) when configured — it reuses the same
  // verified sender the user already set up for auth, so all Scholr email goes
  // through one provider. Falls back to Resend.
  const brevoSender = parseSender(process.env.BREVO_SENDER)
  if (process.env.BREVO_API_KEY && brevoSender) {
    try {
      const res = await fetch(BREVO_URL, {
        method: "POST",
        headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json", "accept": "application/json" },
        body: JSON.stringify({
          sender: brevoSender,
          to: (Array.isArray(args.to) ? args.to : [args.to]).map(email => ({ email })),
          subject: args.subject,
          htmlContent: args.html,
          ...(args.text    ? { textContent: args.text } : {}),
          ...(args.replyTo ? { replyTo: { email: args.replyTo } } : {}),
        }),
      })
      if (!res.ok) {
        const detail = await res.text().catch(() => "")
        console.error("[email] Brevo error", res.status, detail)
        return { ok: false, error: `Brevo ${res.status}` }
      }
      return { ok: true }
    } catch (err) {
      console.error("[email] Brevo send failed", err)
      return { ok: false, error: err instanceof Error ? err.message : "send failed" }
    }
  }

  if (!resendConfigured()) {
    return { ok: false, error: "Email not configured (set BREVO_API_KEY + BREVO_SENDER, or RESEND_API_KEY)" }
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
function escEmail(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export function emailLayout(opts: {
  heading: string
  body:    string         // HTML (caller-escaped)
  ctaLabel?: string
  ctaUrl?:   string
  accent?:   string       // brand accent (hex). Default Scholr indigo.
  eyebrow?:  string       // small uppercase label above the heading
  brandName?: string      // header brand (default "Scholr")
  brandLogoUrl?: string   // optional logo (e.g. the school's)
  footnote?: string       // small note under the CTA (HTML)
}): string {
  const accent = opts.accent || "#4f46e5"
  const brand  = opts.brandName || "Scholr"

  const logo = opts.brandLogoUrl
    ? `<img src="${escEmail(opts.brandLogoUrl)}" width="40" height="40" alt="${escEmail(brand)}" style="display:block;border-radius:11px;object-fit:cover;border:1px solid #e6e7ef" />`
    : `<span style="display:inline-block;width:40px;height:40px;border-radius:11px;background:${accent};color:#ffffff;text-align:center;line-height:40px;font-weight:800;font-size:18px">${escEmail((brand[0] || "S").toUpperCase())}</span>`

  const eyebrow = opts.eyebrow
    ? `<tr><td style="padding-bottom:14px"><span style="display:inline-block;background:#f1f2f8;color:${accent};font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:6px 12px;border-radius:100px">${escEmail(opts.eyebrow)}</span></td></tr>`
    : ""

  const cta = opts.ctaLabel && opts.ctaUrl
    ? `<tr><td style="padding:4px 0 2px">
         <a href="${opts.ctaUrl}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;line-height:1;padding:15px 28px;border-radius:12px;box-shadow:0 8px 20px ${accent}40">
           ${escEmail(opts.ctaLabel)}&nbsp;&nbsp;&rarr;
         </a>
       </td></tr>`
    : ""

  const footnote = opts.footnote
    ? `<tr><td style="font-size:12.5px;line-height:1.6;color:#8a8f9c;padding-top:16px">${opts.footnote}</td></tr>`
    : ""

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#eceef5;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eceef5;padding:40px 16px">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:520px;max-width:520px;background:#ffffff;border-radius:20px;border:1px solid #e6e7ef;overflow:hidden">
        <tr><td style="height:6px;background:${accent};line-height:6px;font-size:0">&nbsp;</td></tr>
        <tr><td style="padding:34px 38px 38px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:26px">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr>
                <td style="padding-right:12px;vertical-align:middle">${logo}</td>
                <td style="vertical-align:middle;font-size:16.5px;font-weight:800;letter-spacing:-0.01em;color:#11131c">${escEmail(brand)}</td>
              </tr></table>
            </td></tr>
            ${eyebrow}
            <tr><td style="font-size:23px;font-weight:800;letter-spacing:-0.022em;color:#11131c;line-height:1.22;padding-bottom:14px">${opts.heading}</td></tr>
            <tr><td style="font-size:15px;line-height:1.66;color:#454854;padding-bottom:24px">${opts.body}</td></tr>
            ${cta}
            ${footnote}
          </table>
        </td></tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:520px;max-width:520px"><tr>
        <td style="padding:18px 8px;text-align:center;font-size:12px;color:#9aa0ad;line-height:1.6">
          Sent via <strong style="color:#6b7280">Scholr</strong> &mdash; the platform schools run on.
        </td>
      </tr></table>
    </td></tr>
  </table>
</body></html>`
}
