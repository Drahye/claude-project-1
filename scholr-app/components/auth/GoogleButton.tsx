"use client"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Props {
  /** Pass the post-auth destination so Google → callback → here */
  redirectTo?: string
  label?: string
}

export default function GoogleButton({ redirectTo, label = "Continue with Google" }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  async function handleClick() {
    setLoading(true)
    setError("")

    const callbackUrl = new URL("/api/auth/callback", window.location.origin)
    // After the OAuth code exchange, go to redirectTo (or "/" which middleware re-routes)
    if (redirectTo) callbackUrl.searchParams.set("next", redirectTo)

    const { error: err } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options:  { redirectTo: callbackUrl.toString() },
    })

    if (err) {
      setError(err.message)
      setLoading(false)
    }
    // On success the browser navigates to Google — no further state needed
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full h-12 flex items-center justify-center gap-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        style={{
          background:  "var(--c-bg)",
          border:      "1.5px solid var(--c-border)",
          color:       "var(--c-text)",
          boxShadow:   "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" style={{ color: "var(--c-indigo)" }} />
        ) : (
          /* Official Google "G" mark */
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
              fill="#EA4335"
            />
          </svg>
        )}
        {label}
      </button>

      {error && (
        <p className="mt-2 text-xs text-center px-2" style={{ color: "var(--c-red)" }}>{error}</p>
      )}
    </div>
  )
}

/* ── Divider ──────────────────────────────────────────────────────────────── */
export function OrDivider() {
  return (
    <div className="relative flex items-center gap-3 my-5">
      <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
      <span className="text-xs font-medium flex-shrink-0" style={{ color: "var(--c-text-muted)" }}>
        or continue with email
      </span>
      <div className="flex-1 h-px" style={{ background: "var(--c-border)" }} />
    </div>
  )
}
