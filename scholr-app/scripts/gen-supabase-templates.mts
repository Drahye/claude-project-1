import { confirmSignupEmail, resetPasswordEmail } from "../lib/email-templates"
import { writeFileSync } from "fs"
const out = "supabase-email-templates"
const c = confirmSignupEmail({ confirmUrl: "{{ .ConfirmationURL }}" })
const r = resetPasswordEmail({ resetUrl: "{{ .ConfirmationURL }}" })
writeFileSync(`${out}/confirm-signup.html`, c.html)
writeFileSync(`${out}/reset-password.html`, r.html)
console.log("CONFIRM_SUBJECT::" + c.subject)
console.log("RESET_SUBJECT::" + r.subject)
