"use client"
import { useState } from "react"
import Link from "next/link"
import { Loader2, CheckCircle2, ArrowLeft, Inbox } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordForm() {
  const [email, setEmail]     = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const json = await res.json() as { ok?: boolean; error?: string; fallback?: boolean }

      if (json.fallback) {
        const { error: err } = await createClient().auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        setLoading(false)
        if (err) setError(err.message)
        else setSent(true)
        return
      }

      setLoading(false)
      if (!res.ok || !json.ok) setError(json.error ?? "Could not send the reset email. Please try again.")
      else setSent(true)
    } catch {
      setLoading(false)
      setError("Network error. Please check your connection and try again.")
    }
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--c-emerald-bg)" }}
        >
          <CheckCircle2 size={28} style={{ color: "var(--c-emerald)" }} />
        </div>
        <h2 className="text-2xl font-extrabold mb-2 tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Check your email
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
          We sent a password reset link to{" "}
          <strong style={{ color: "var(--c-text)" }}>{email}</strong>.
          <br />
          The link expires in 1 hour.
        </p>

        <div
          className="mt-5 mx-auto max-w-sm flex items-start gap-2.5 text-left px-4 py-3 rounded-xl"
          style={{ background: "var(--c-gold-bg)", border: "1px solid color-mix(in oklch, var(--c-gold) 25%, transparent)" }}
        >
          <Inbox size={16} style={{ color: "var(--c-gold)", flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs leading-relaxed" style={{ color: "var(--c-text-mid)" }}>
            <strong style={{ color: "var(--c-text)" }}>Don&apos;t see it?</strong> Check your{" "}
            <strong style={{ color: "var(--c-text)" }}>spam</strong> or{" "}
            <strong style={{ color: "var(--c-text)" }}>promotions</strong> folder. It can take a minute to arrive.
          </p>
        </div>

        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold mt-6" style={{ color: "var(--c-indigo)" }}>
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Forgot password?
        </h1>
        <p style={{ color: "var(--c-text-mid)", fontSize: "0.9375rem" }}>
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

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
        <button type="submit" disabled={loading} className="btn-primary w-full h-12 mt-2 gap-2 disabled:opacity-60">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm font-semibold mt-6" style={{ color: "var(--c-text-muted)" }}>
        <ArrowLeft size={14} /> Back to sign in
      </Link>
    </div>
  )
}
