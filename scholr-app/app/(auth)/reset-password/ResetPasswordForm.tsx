"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword]   = useState("")
  const [confirm, setConfirm]     = useState("")
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)
  const [error, setError]         = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) { setError("Password must be at least 8 characters."); return }
    if (password !== confirm) { setError("Passwords do not match."); return }

    setLoading(true)
    const { error: err } = await createClient().auth.updateUser({ password })
    setLoading(false)

    if (err) setError(err.message)
    else {
      setDone(true)
      setTimeout(() => router.push("/"), 2000)
    }
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--c-emerald-bg)" }}
        >
          <CheckCircle2 size={28} style={{ color: "var(--c-emerald)" }} />
        </div>
        <h2 className="text-2xl font-extrabold mb-2 tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Password updated
        </h2>
        <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>Redirecting you to your dashboard…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Set new password
        </h1>
        <p style={{ color: "var(--c-text-mid)", fontSize: "0.9375rem" }}>
          Choose a strong password for your account.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { id: "password", label: "New password",      value: password,   setter: setPassword,   placeholder: "Min. 8 characters" },
          { id: "confirm",  label: "Confirm password",  value: confirm,    setter: setConfirm,    placeholder: "Repeat password" },
        ].map(({ id, label, value, setter, placeholder }) => (
          <div key={id}>
            <label htmlFor={id} className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>
              {label}
            </label>
            <div className="relative">
              <input
                id={id}
                type={showPw ? "text" : "password"}
                required
                minLength={8}
                value={value}
                onChange={e => setter(e.target.value)}
                className="input pr-11"
                placeholder={placeholder}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--c-text-muted)" }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        ))}

        <button type="submit" disabled={loading} className="btn-primary w-full h-12 mt-2 gap-2 disabled:opacity-60">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  )
}
