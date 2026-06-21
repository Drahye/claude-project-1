"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, EyeOff, Loader2, LayoutDashboard, LogIn, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import GoogleButton, { OrDivider } from "@/components/auth/GoogleButton"

type SessionState = "loading" | "authenticated" | "guest"

// Remembered-device hint — lets returning teachers/parents sign back in with one
// tap (prefilled email + magic link) instead of typing a password every time.
const HINT_KEY = "scholr_last_login"
interface LoginHint { email: string; name?: string }
function readHint(): LoginHint | null {
  try { const v = localStorage.getItem(HINT_KEY); return v ? JSON.parse(v) as LoginHint : null } catch { return null }
}
function writeHint(hint: LoginHint) { try { localStorage.setItem(HINT_KEY, JSON.stringify(hint)) } catch { /* ignore */ } }
function clearHint() { try { localStorage.removeItem(HINT_KEY) } catch { /* ignore */ } }

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
  const [remember, setRemember]     = useState(true)
  const [returningName, setReturningName] = useState<string | null>(null)
  const [magicLoading, setMagicLoading]   = useState(false)
  const [magicSent, setMagicSent]   = useState(false)

  // Prefill from a remembered device (one-tap return for teachers/parents)
  useEffect(() => {
    const hint = readHint()
    if (hint?.email) {
      setEmail(hint.email)
      setReturningName(hint.name ?? null)
    }
  }, [])

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

    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    // Remember this device for a streamlined return (name for the greeting).
    if (remember) {
      const { data: { user } } = await supabase.auth.getUser()
      let name: string | undefined
      if (user) {
        const { data: profile } = await supabase
          .from("profiles").select("full_name").eq("id", user.id).maybeSingle() as { data: { full_name: string } | null }
        name = profile?.full_name
      }
      writeHint({ email, name })
    } else {
      clearHint()
    }

    // Hard redirect so session cookies are committed before middleware reads them
    window.location.href = redirectTo ?? "/"
  }

  // Passwordless: email a one-tap sign-in link (no password needed).
  async function sendMagicLink() {
    setError("")
    if (!email.trim()) { setError("Enter your email first, then request a link."); return }
    setMagicLoading(true)
    const supabase = createClient()
    const nextParam = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,   // existing accounts only — invites create users
        emailRedirectTo: `${window.location.origin}/api/auth/callback${nextParam}`,
      },
    })
    setMagicLoading(false)
    if (err) { setError(err.message); return }
    if (remember) writeHint({ email: email.trim(), name: returningName ?? undefined })
    setMagicSent(true)
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

  // ── Magic link sent confirmation ─────────────────────────────────────────────
  if (magicSent) {
    return (
      <div>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: "var(--c-indigo-bg)" }}>
          <Mail size={24} style={{ color: "var(--c-indigo)" }} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Check your inbox
        </h1>
        <p className="mb-8" style={{ color: "var(--c-text-mid)", fontSize: "0.9375rem" }}>
          We emailed a one-tap sign-in link to <strong style={{ color: "var(--c-text)" }}>{email}</strong>. Open it on this device to sign in — no password needed.
        </p>
        <button
          onClick={() => { setMagicSent(false) }}
          className="w-full h-11 rounded-xl text-sm font-medium transition-colors"
          style={{ color: "var(--c-text-muted)", background: "var(--c-surface)", border: "1px solid var(--c-border)" }}
        >
          Back to sign in
        </button>
      </div>
    )
  }

  // ── Guest login form ─────────────────────────────────────────────────────────
  const firstName = returningName?.split(" ")[0]
  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-3xl font-extrabold tracking-tight mb-2"
          style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}
        >
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p style={{ color: "var(--c-text-mid)", fontSize: "0.9375rem" }}>
          {firstName ? "Sign in with your password, or get a one-tap link by email." : "Sign in to your school account"}
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

        <label className="flex items-center gap-2 text-sm select-none cursor-pointer" style={{ color: "var(--c-text-mid)" }}>
          <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="h-4 w-4 rounded" style={{ accentColor: "var(--c-indigo)" }} />
          Keep me signed in on this device
        </label>

        <button type="submit" disabled={loading} className="btn-primary w-full h-12 mt-2">
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Signing in…</>
            : <><LogIn size={16} /> Sign in</>
          }
        </button>
      </form>

      {/* Passwordless option — easiest repeat sign-in for teachers & parents */}
      <button
        type="button"
        onClick={sendMagicLink}
        disabled={magicLoading}
        className="w-full h-11 mt-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        style={{ color: "var(--c-indigo)", background: "var(--c-indigo-bg)" }}
      >
        {magicLoading
          ? <><Loader2 size={15} className="animate-spin" /> Sending link…</>
          : <><Mail size={15} /> Email me a sign-in link</>
        }
      </button>

      <p className="mt-6 text-center text-sm" style={{ color: "var(--c-text-muted)" }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold" style={{ color: "var(--c-indigo)" }}>
          Register your school
        </Link>
      </p>
    </div>
  )
}
