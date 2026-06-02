"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, EyeOff, Loader2, CheckCircle2, LayoutDashboard, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import GoogleButton, { OrDivider } from "@/components/auth/GoogleButton"

type SessionState = "loading" | "authenticated" | "guest"

export default function SignupForm() {
  const [fullName, setFullName]   = useState("")
  const [email, setEmail]         = useState("")
  const [password, setPassword]   = useState("")
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [success, setSuccess]     = useState(false)
  const [sessionState, setSession] = useState<SessionState>("loading")
  const [dashboardHref, setDash]   = useState<string>("/")

  // Check for an active session on mount
  useEffect(() => {
    const supabase = createClient()

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setSession("guest")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single() as { data: { role: string } | null }

      if (!profile) {
        setDash("/onboarding")
      } else {
        const destinations: Record<string, string> = {
          parent:      "/parent/dashboard",
          teacher:     "/teacher/dashboard",
          admin:       "/admin/dashboard",
          super_admin: "/admin/dashboard",
        }
        setDash(destinations[profile.role] ?? "/onboarding")
      }

      setSession("authenticated")
    }

    checkSession()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      setLoading(false)
      return
    }

    const { error: err } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    setLoading(false)

    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
    }
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (sessionState === "loading") {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-9 w-56 rounded-xl skeleton" />
        <div className="h-4 w-48 rounded skeleton" />
        <div className="h-12 rounded-xl skeleton mt-6" />
        <div className="h-12 rounded-xl skeleton" />
        <div className="h-12 rounded-xl skeleton" />
        <div className="h-12 rounded-full skeleton" />
      </div>
    )
  }

  // ── Already signed in ────────────────────────────────────────────────────────
  if (sessionState === "authenticated") {
    return (
      <div>
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: "var(--c-indigo-bg)" }}
        >
          <LayoutDashboard size={24} style={{ color: "var(--c-indigo)" }} />
        </div>

        <h1
          className="text-3xl font-extrabold tracking-tight mb-2"
          style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}
        >
          You&apos;re already in
        </h1>
        <p className="mb-8" style={{ color: "var(--c-text-mid)", fontSize: "0.9375rem" }}>
          Your account is active. Head back to your dashboard.
        </p>

        <a
          href={dashboardHref}
          className="btn-primary w-full h-12 flex items-center justify-center gap-2 mb-4"
        >
          <LayoutDashboard size={16} />
          Enter Dashboard
        </a>

        <button
          onClick={async () => {
            await createClient().auth.signOut()
            setSession("guest")
          }}
          className="w-full h-11 rounded-xl text-sm font-medium transition-colors"
          style={{ color: "var(--c-text-muted)", background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
        >
          Sign out &amp; create a new account
        </button>

        <p className="mt-4 text-center text-xs" style={{ color: "var(--c-text-muted)" }}>
          <Link href="/" style={{ color: "var(--c-indigo)" }} className="font-semibold">
            ← Back to home
          </Link>
        </p>
      </div>
    )
  }

  // ── Email-sent confirmation ───────────────────────────────────────────────────
  if (success) {
    return (
      <div className="text-center py-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--c-emerald-bg)" }}
        >
          <CheckCircle2 size={28} style={{ color: "var(--c-emerald)" }} />
        </div>
        <h2
          className="text-2xl font-extrabold mb-2 tracking-tight"
          style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}
        >
          Check your email
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
          We sent a confirmation link to{" "}
          <strong style={{ color: "var(--c-text)" }}>{email}</strong>.
          <br />Click the link to activate your account.
        </p>
        <p className="mt-6 text-sm" style={{ color: "var(--c-text-muted)" }}>
          Already confirmed?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "var(--c-indigo)" }}>
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-sm" style={{ color: "var(--c-text-muted)" }}>
          <Link href="/" className="font-semibold" style={{ color: "var(--c-text-muted)" }}>
            ← Back to home
          </Link>
        </p>
      </div>
    )
  }

  // ── Guest signup form ────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold tracking-tight mb-2"
          style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}
        >
          Create your account
        </h1>
        <p style={{ color: "var(--c-text-mid)", fontSize: "0.9375rem" }}>
          Start your school&apos;s free trial today
        </p>
      </div>

      <GoogleButton label="Sign up with Google" />
      <OrDivider />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="input"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input"
            placeholder="you@school.edu"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input pr-11"
              placeholder="Min. 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--c-text-muted)" }}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {password.length > 0 && (
            <p
              className="text-xs mt-1.5"
              style={{ color: password.length >= 8 ? "var(--c-emerald)" : "var(--c-text-muted)" }}
            >
              {password.length >= 8
                ? "✓ Strong enough"
                : `${8 - password.length} more character${8 - password.length === 1 ? "" : "s"} needed`}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full h-12 mt-2 gap-2 disabled:opacity-60"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
            : <><UserPlus size={16} /> Create account</>
          }
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: "var(--c-text-muted)" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-semibold" style={{ color: "var(--c-indigo)" }}>
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-center text-xs leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
        By signing up you agree to our{" "}
        <Link href="/terms" className="underline">Terms</Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </div>
  )
}
