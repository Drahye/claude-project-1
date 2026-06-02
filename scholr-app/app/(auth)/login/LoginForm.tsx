"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, EyeOff, Loader2, LayoutDashboard, LogIn } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import GoogleButton, { OrDivider } from "@/components/auth/GoogleButton"

type SessionState = "loading" | "authenticated" | "guest"

export default function LoginForm({
  redirectTo,
  serverError,
}: {
  redirectTo?: string
  serverError?: string
}) {
  const [email, setEmail]           = useState("")
  const [password, setPassword]     = useState("")
  const [showPw, setShowPw]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(serverError ?? "")
  const [sessionState, setSession]  = useState<SessionState>("loading")
  const [dashboardHref, setDash]    = useState<string>("/")

  // Check for an active session on mount
  useEffect(() => {
    const supabase = createClient()

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setSession("guest")
        return
      }

      // Session exists — resolve their destination
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
        setDash(redirectTo ?? destinations[profile.role] ?? "/onboarding")
      }

      setSession("authenticated")
    }

    checkSession()
  }, [redirectTo])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const { error: err } = await createClient().auth.signInWithPassword({ email, password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    // Hard redirect so session cookies are committed before middleware reads them
    window.location.href = redirectTo ?? "/"
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (sessionState === "loading") {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-9 w-48 rounded-xl skeleton" />
        <div className="h-4 w-64 rounded skeleton" />
        <div className="h-12 rounded-xl skeleton mt-6" />
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
          You&apos;re signed in
        </h1>
        <p className="mb-8" style={{ color: "var(--c-text-mid)", fontSize: "0.9375rem" }}>
          You already have an active session.
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
            setEmail("")
            setPassword("")
          }}
          className="w-full h-11 rounded-xl text-sm font-medium transition-colors"
          style={{ color: "var(--c-text-muted)", background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
        >
          Sign in as a different account
        </button>

        <p className="mt-4 text-center text-xs" style={{ color: "var(--c-text-muted)" }}>
          Not your account?{" "}
          <Link href="/" style={{ color: "var(--c-indigo)" }} className="font-semibold">
            Back to home
          </Link>
        </p>
      </div>
    )
  }

  // ── Guest login form ─────────────────────────────────────────────────────────
  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold tracking-tight mb-2"
          style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}
        >
          Welcome back
        </h1>
        <p style={{ color: "var(--c-text-mid)", fontSize: "0.9375rem" }}>
          Sign in to your school account
        </p>
      </div>

      <GoogleButton redirectTo={redirectTo} label="Continue with Google" />
      <OrDivider />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
              Password
            </label>
            <Link href="/forgot-password" className="text-sm font-semibold" style={{ color: "var(--c-indigo)" }}>
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--c-text-muted)" }}
              aria-label={showPw ? "Hide" : "Show"}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full h-12 mt-2">
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
            : <><LogIn size={16} /> Sign in</>
          }
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: "var(--c-text-muted)" }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold" style={{ color: "var(--c-indigo)" }}>
          Register your school
        </Link>
      </p>
    </div>
  )
}
