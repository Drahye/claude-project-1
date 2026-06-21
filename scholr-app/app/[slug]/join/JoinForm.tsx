"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { getInitials } from "@/lib/utils"

function dashboardFor(role: string | null): string {
  if (role === "teacher") return "/teacher/dashboard"
  if (role === "parent") return "/parent/dashboard"
  if (role === "admin" || role === "super_admin") return "/admin/dashboard"
  return "/"
}

export default function JoinForm({
  slug, schoolName, accent, logoUrl, welcomeHeadline, authed, tokenHash, tokenType, initialName, role,
}: {
  slug: string
  schoolName: string
  accent: string
  logoUrl: string | null
  welcomeHeadline: string | null
  authed: boolean
  tokenHash: string | null
  tokenType: string | null
  initialName: string
  role: string | null
}) {
  const canSetup = authed || !!tokenHash
  const [name, setName]       = useState(initialName)
  const [password, setPw]     = useState("")
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError("Password must be at least 8 characters."); return }
    setLoading(true); setError(null)
    try {
      const supabase = createClient()

      // Verify the invite token NOW (on submit) — this is what consumes the
      // one-time token, so link-prefetch bots can't burn it first.
      if (!authed && tokenHash && tokenType) {
        const { error: vErr } = await supabase.auth.verifyOtp({ type: tokenType as EmailOtpType, token_hash: tokenHash })
        if (vErr) throw new Error("This invite link is invalid or has expired. Ask your school to resend it.")
      }

      const { error: err } = await supabase.auth.updateUser({
        password,
        data: { full_name: name.trim() },
      })
      if (err) throw new Error(err.message)

      const { data: { user } } = await supabase.auth.getUser()
      if (user && name.trim()) {
        await (supabase.from("profiles") as any).update({ full_name: name.trim() }).eq("id", user.id)
      }
      // Resolve the dashboard — fetch the role if the server didn't have it (token flow).
      let dest = role
      if (!dest && user) {
        const { data: prof } = await (supabase.from("profiles") as any).select("role").eq("id", user.id).maybeSingle()
        dest = prof?.role ?? null
      }
      window.location.href = dashboardFor(dest)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[100dvh] flex flex-col" style={{ background: "var(--c-bg)", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Personalized school hero */}
      <div className="relative overflow-hidden px-5 pt-12 pb-12 text-center" style={{ background: `linear-gradient(150deg, ${accent} 0%, color-mix(in srgb, ${accent} 58%, #0b0a1a) 100%)` }}>
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(255,255,255,0.22), transparent 65%)" }} />
        <div className="relative">
          <Link href={`/${slug}`} aria-label={schoolName} className="inline-flex">
            {logoUrl ? (
              <span className="relative rounded-2xl overflow-hidden mx-auto" style={{ width: 60, height: 60, border: "2px solid rgba(255,255,255,0.35)", boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
                <Image src={logoUrl} alt={schoolName} fill sizes="60px" style={{ objectFit: "cover" }} />
              </span>
            ) : (
              <span className="rounded-2xl flex items-center justify-center text-white font-extrabold mx-auto" style={{ width: 60, height: 60, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)", fontSize: 22 }}>
                {getInitials(schoolName)}
              </span>
            )}
          </Link>
          <p className="mt-5 mb-2 inline-block rounded-full px-3 py-1" style={{ background: "rgba(255,255,255,0.16)", color: "#fff", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>You&apos;re invited</p>
          <h1 className="font-extrabold text-white" style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", letterSpacing: "-0.03em", lineHeight: 1.1, maxWidth: "16ch", margin: "0 auto" }}>
            {welcomeHeadline || `Welcome to ${schoolName}`}
          </h1>
          <p className="mt-2.5" style={{ color: "rgba(255,255,255,0.82)", fontSize: "0.9375rem", maxWidth: "34ch", margin: "10px auto 0" }}>
            Set up your account to join <strong style={{ color: "#fff" }}>{schoolName}</strong> on Scholr.
          </p>
        </div>
      </div>

      {/* Setup card */}
      <div className="flex-1 flex justify-center px-5 pb-10">
        <div className="w-full -mt-7" style={{ maxWidth: 440 }}>
          {!canSetup ? (
            <div className="card-float p-6 text-center">
              <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "var(--c-red-bg)" }}>
                <AlertCircle size={20} style={{ color: "var(--c-red)" }} />
              </div>
              <h2 className="font-extrabold mb-1" style={{ fontSize: "1.125rem", color: "var(--c-text)" }}>This invite link has expired</h2>
              <p style={{ fontSize: "0.875rem", color: "var(--c-text-muted)", lineHeight: 1.6 }}>
                Ask your school admin to resend your invite, or log in if you&apos;ve already set up your account.
              </p>
              <Link href={`/${slug}/login`} className="btn-primary h-11 px-6 mt-5 inline-flex" style={{ textDecoration: "none" }}>Go to login</Link>
            </div>
          ) : (
            <div className="card-float p-6">
              <h2 className="font-extrabold mb-1" style={{ fontSize: "1.1875rem", color: "var(--c-text)", letterSpacing: "-0.02em" }}>Set up your account</h2>
              <p className="mb-5" style={{ fontSize: "0.875rem", color: "var(--c-text-muted)" }}>Choose a name and password to finish — then you&apos;re in.</p>

              {error && <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}>{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>Your name</label>
                  <input id="name" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required />
                </div>
                <div>
                  <label htmlFor="pw" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>Create a password</label>
                  <div className="relative">
                    <input id="pw" type={show ? "text" : "password"} className="input pr-10" value={password}
                      onChange={e => setPw(e.target.value)} placeholder="Min. 8 characters" required minLength={8} />
                    <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--c-text-muted)" }} aria-label={show ? "Hide password" : "Show password"}>
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full h-11 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-transform active:scale-[0.99]"
                  style={{ background: accent, boxShadow: `0 8px 20px color-mix(in srgb, ${accent} 35%, transparent)` }}>
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {loading ? "Setting up…" : "Finish & enter portal"}
                </button>
              </form>
            </div>
          )}

          <p className="text-center mt-6" style={{ fontSize: "0.75rem", color: "var(--c-text-muted)" }}>
            Powered by <Link href="/" style={{ color: "var(--c-indigo)", fontWeight: 600, textDecoration: "none" }}>Scholr</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
