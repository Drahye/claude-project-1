/**
 * Lightweight in-memory rate limiter (fixed window, keyed by IP).
 *
 * NOTE: this is best-effort. On serverless (Vercel) each instance has its own
 * memory, so a determined attacker hitting many cold instances can exceed the
 * limit. It DOES stop naive floods and accidental loops, and adds a real layer
 * on warm instances. For production-grade, distributed limiting, back this with
 * Upstash Redis (@upstash/ratelimit) — the call sites stay the same.
 */

type Bucket = { count: number; reset: number }
const store = new Map<string, Bucket>()
let lastSweep = 0

function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [k, v] of store) if (now > v.reset) store.delete(k)
}

export interface RateResult { ok: boolean; remaining: number; retryAfter: number }

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now()
  sweep(now)
  const b = store.get(key)
  if (!b || now > b.reset) {
    store.set(key, { count: 1, reset: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfter: 0 }
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((b.reset - now) / 1000)) }
  }
  b.count++
  return { ok: true, remaining: limit - b.count, retryAfter: 0 }
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return req.headers.get("x-real-ip") || "unknown"
}

import { NextResponse } from "next/server"
/**
 * Guard a route. Returns a 429 NextResponse if over the limit, else null.
 *   const limited = limitOr429(req, "signup", 5, 60_000); if (limited) return limited
 */
export function limitOr429(req: Request, bucket: string, limit: number, windowMs: number) {
  const r = rateLimit(`${bucket}:${clientIp(req)}`, limit, windowMs)
  if (r.ok) return null
  return NextResponse.json(
    { error: "Too many requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(r.retryAfter) } },
  )
}
