# Scholr auth emails via Brevo (no domain needed)

This makes real signup-confirmation and password-reset emails deliver to **any**
recipient — for free, without owning a domain — by routing Supabase Auth email
through Brevo's SMTP, styled with the branded Scholr templates in this folder.

The app already falls back to Supabase's built-in email when no verified Resend
domain is set, so **no code change is needed** — you only configure Supabase +
Brevo, then paste the templates below.

---

## 1. Create a Brevo account + verify your sender

1. Sign up at <https://www.brevo.com> (free plan = 300 emails/day).
2. **Senders & IP → Senders → Add a sender.** Use any email you control
   (e.g. your Gmail). Brevo emails a confirmation link — click it.
   *No domain required — this is single-sender verification.*
3. **SMTP & API → SMTP.** Note:
   - **Server:** `smtp-relay.brevo.com`
   - **Port:** `587`
   - **Login:** the email shown there (your Brevo account login)
   - **Password / SMTP key:** click **Generate a new SMTP key** and copy it.

## 2. Point Supabase Auth at Brevo

In the Supabase dashboard → **Project Settings → Authentication → SMTP Settings**:

- **Enable Custom SMTP:** on
- **Sender email:** the sender you verified in step 1
- **Sender name:** `Scholr`
- **Host:** `smtp-relay.brevo.com`
- **Port:** `587`
- **Username:** your Brevo SMTP login
- **Password:** the Brevo SMTP key from step 1
- Save.

Then **Authentication → Rate Limits** — raise "emails per hour" (the default of a
few/hour is the old bottleneck; Brevo can handle far more).

## 3. Paste the branded templates

Supabase dashboard → **Authentication → Email Templates**:

| Supabase template | Paste this file | Subject |
|---|---|---|
| **Confirm signup** | `confirm-signup.html` | `Confirm your email · Scholr` |
| **Reset password** | `reset-password.html` | `Reset your password · Scholr` |

Both already contain Supabase's `{{ .ConfirmationURL }}` variable, so the button
links work as-is. Set the Subject fields to the values above.

## 4. Test

Sign up with any email address (not just your own) — you should get the branded
Scholr confirmation email via Brevo within a few seconds.

---

### Later: moving to your own domain

When you buy a domain, you have two upgrade paths (either works):
- **Keep Brevo**, but authenticate the domain in Brevo for better deliverability, **or**
- **Switch to Resend** — set `EMAIL_FROM=Scholr <noreply@yourdomain.com>` in Vercel
  and the app auto-switches to the in-code Resend templates (these Supabase
  templates then become unused). No code change either way.
