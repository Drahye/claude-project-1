"use client"
import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Save, Loader2, CheckCircle2, X, Palette, Upload,
  Camera, School, Globe, Zap, MessageSquare,
  BookOpen, BarChart3, CreditCard, Brain, Calendar,
} from "lucide-react"

interface School {
  id: string
  name: string
  slug: string
  country: string
  timezone: string
  primary_color: string | null
  logo_url: string | null
}

interface Props {
  school: School
  userId: string
  userAvatarUrl: string | null
  userName: string
}

const TIMEZONES = [
  "Africa/Lagos", "Africa/Accra", "Africa/Nairobi", "Africa/Johannesburg",
  "Africa/Cairo", "Africa/Casablanca",
  "Europe/London", "Europe/Paris", "Europe/Berlin",
  "America/New_York", "America/Chicago", "America/Los_Angeles",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney",
]

const COUNTRIES = [
  { code: "NG", name: "Nigeria" },   { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },     { code: "ZA", name: "South Africa" },
  { code: "GB", name: "United Kingdom" }, { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },    { code: "AE", name: "UAE" },
  { code: "IN", name: "India" },
]

const PRESET_COLORS = [
  "#4f46e5", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
]

const SCHOOL_FEATURES = [
  { key: "attendance",   icon: Calendar,      label: "Attendance tracking",    desc: "Daily check-ins, absence alerts to parents" },
  { key: "homework",     icon: BookOpen,       label: "Homework management",    desc: "Assignments, due dates, submission tracking" },
  { key: "messaging",    icon: MessageSquare,  label: "Parent messaging",       desc: "Direct messages between teachers and parents" },
  { key: "analytics",    icon: BarChart3,      label: "Analytics dashboard",    desc: "Attendance rates, homework completion, health score" },
  { key: "ai_reports",   icon: Brain,          label: "AI report writer",       desc: "Claude-powered personalised weekly reports" },
  { key: "fee_manager",  icon: CreditCard,     label: "Fee & invoice manager",  desc: "Payment tracking, invoices, receipts" },
  { key: "public_page",  icon: Globe,          label: "Public school page",     desc: "Your school's public landing page on scholr.app" },
  { key: "quick_links",  icon: Zap,            label: "Quick links & resources",desc: "Pinned documents and links for parents" },
]

/* ── Image upload hook ─────────────────────────────────────────────────────── */
function useImageUpload(type: "logo" | "avatar") {
  const [url, setUrl]         = useState<string | null>(null)
  const [uploading, setUpl]   = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const inputRef              = useRef<HTMLInputElement>(null)

  const pick = useCallback(() => inputRef.current?.click(), [])

  const onFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUpl(true); setError(null)
    const fd = new FormData()
    fd.append("file", file)
    fd.append("type", type)
    try {
      const res  = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Upload failed")
      setUrl(body.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUpl(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }, [type])

  return { url, uploading, error, pick, onFile, inputRef }
}

/* ── Main form ─────────────────────────────────────────────────────────────── */
export default function SettingsForm({ school, userId: _userId, userAvatarUrl, userName }: Props) {
  const router = useRouter()

  const [form, setForm] = useState({
    name:          school.name,
    country:       school.country ?? "NG",
    timezone:      school.timezone ?? "Africa/Lagos",
    primary_color: school.primary_color ?? "#4f46e5",
  })
  const [features, setFeatures] = useState<Record<string, boolean>>({
    attendance: true, homework: true, messaging: true, analytics: true,
    ai_reports: false, fee_manager: false, public_page: true, quick_links: true,
  })
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const colorInputRef         = useRef<HTMLInputElement>(null)

  const logo   = useImageUpload("logo")
  const avatar = useImageUpload("avatar")

  function update(key: keyof typeof form, value: string) {
    setForm(p => ({ ...p, [key]: value }))
    setSaved(false); setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError("School name is required."); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name: form.name.trim() }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Failed to save")
      setSaved(true)
      setTimeout(() => router.refresh(), 800)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const logoPreview   = logo.url   ?? school.logo_url
  const avatarPreview = avatar.url ?? userAvatarUrl
  const initials      = userName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── School identity ─────────────────────────────── */}
      <Card title="School identity" icon={School}>
        {/* Logo upload */}
        <div className="flex items-center gap-5 mb-5 pb-5" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: "var(--c-surface)", border: "1.5px solid var(--c-border)" }}
            >
              {logoPreview ? (
                <Image src={logoPreview} alt="School logo" width={80} height={80} className="object-cover w-full h-full" />
              ) : (
                <School size={28} style={{ color: "var(--c-text-muted)" }} />
              )}
            </div>
            <button
              type="button"
              onClick={logo.pick}
              disabled={logo.uploading}
              className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{ background: "var(--c-indigo)", color: "white", border: "2px solid var(--c-bg)" }}
              title="Upload logo"
            >
              {logo.uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
            </button>
            <input ref={logo.inputRef} type="file" accept="image/*" className="sr-only" onChange={logo.onFile} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--c-text)" }}>School logo</p>
            <p className="text-xs mb-2" style={{ color: "var(--c-text-muted)" }}>PNG, JPG or WebP · Max 5 MB · Shown on reports and the public school page</p>
            <div className="flex gap-2">
              <button type="button" onClick={logo.pick} disabled={logo.uploading}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 active:scale-95 flex items-center gap-1.5"
                style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}>
                <Upload size={11} /> {logo.uploading ? "Uploading…" : "Upload logo"}
              </button>
              {logoPreview && (
                <button type="button"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                  style={{ color: "var(--c-text-muted)", background: "var(--c-surface)" }}>
                  Remove
                </button>
              )}
            </div>
            {logo.error && <p className="text-xs mt-1.5" style={{ color: "var(--c-red)" }}>{logo.error}</p>}
            {logo.url && <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "var(--c-emerald)" }}><CheckCircle2 size={11} /> Logo updated</p>}
          </div>
        </div>

        {/* Name + slug */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
              School name <span style={{ color: "var(--c-red)" }}>*</span>
            </label>
            <input type="text" className="input h-11 text-sm w-full" value={form.name}
              onChange={e => update("name", e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
              School URL slug
            </label>
            <div className="flex items-center h-11 rounded-xl px-3 gap-1"
              style={{ background: "var(--c-surface)", border: "1.5px solid var(--c-border)" }}>
              <span className="text-sm shrink-0" style={{ color: "var(--c-text-muted)" }}>scholr.app/</span>
              <span className="text-sm font-medium" style={{ color: "var(--c-text)" }}>{school.slug}</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>Contact support to change.</p>
          </div>
        </div>
      </Card>

      {/* ── Your profile ────────────────────────────────── */}
      <Card title="Your profile" icon={Camera}>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-white text-lg font-bold"
              style={{ background: avatarPreview ? "transparent" : "var(--c-indigo)" }}>
              {avatarPreview
                ? <Image src={avatarPreview} alt={userName} width={64} height={64} className="object-cover w-full h-full" />
                : initials
              }
            </div>
            <button type="button" onClick={avatar.pick} disabled={avatar.uploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{ background: "var(--c-indigo)", color: "white", border: "2px solid var(--c-bg)" }}>
              {avatar.uploading ? <Loader2 size={10} className="animate-spin" /> : <Camera size={10} />}
            </button>
            <input ref={avatar.inputRef} type="file" accept="image/*" className="sr-only" onChange={avatar.onFile} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--c-text)" }}>{userName}</p>
            <p className="text-xs mb-2" style={{ color: "var(--c-text-muted)" }}>Shown in the sidebar and on reports you generate</p>
            <button type="button" onClick={avatar.pick} disabled={avatar.uploading}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all hover:opacity-80 active:scale-95"
              style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}>
              <Camera size={11} /> {avatar.uploading ? "Uploading…" : "Change photo"}
            </button>
            {avatar.error && <p className="text-xs mt-1.5" style={{ color: "var(--c-red)" }}>{avatar.error}</p>}
            {avatar.url && <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "var(--c-emerald)" }}><CheckCircle2 size={11} /> Photo updated</p>}
          </div>
        </div>
      </Card>

      {/* ── Regional ────────────────────────────────────── */}
      <Card title="Regional settings" icon={Globe}>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Country</label>
            <select className="input h-11 text-sm w-full" value={form.country}
              onChange={e => update("country", e.target.value)}>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Timezone</label>
            <select className="input h-11 text-sm w-full" value={form.timezone}
              onChange={e => update("timezone", e.target.value)}>
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* ── Branding ────────────────────────────────────── */}
      <Card title="Branding" icon={Palette}>
        {/* Live preview */}
        <div className="rounded-xl p-4 flex items-center justify-between mb-5"
          style={{
            background: `${form.primary_color}12`,
            border: `1px solid ${form.primary_color}30`,
            transition: "background 300ms, border-color 300ms",
          }}>
          <div>
            <p className="text-xs font-bold mb-0.5" style={{ color: form.primary_color, transition: "color 300ms" }}>Live preview</p>
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Buttons, links and badges across your admin portal</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl shadow-sm transition-all duration-300" style={{ background: form.primary_color }} />
            <button type="button" className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-300"
              style={{ background: form.primary_color, color: "#fff" }}>Button</button>
          </div>
        </div>

        {/* Presets */}
        <div className="mb-5">
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--c-text-muted)" }}>Presets</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => update("primary_color", c)}
                className="w-8 h-8 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                  background: c,
                  boxShadow: form.primary_color === c ? `0 0 0 2px var(--c-bg), 0 0 0 4px ${c}` : "none",
                }} />
            ))}
          </div>
        </div>

        {/* Custom picker */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--c-text-muted)" }}>Custom</p>
          <div className="flex items-center gap-3">
            <input ref={colorInputRef} type="color" value={form.primary_color}
              onChange={e => update("primary_color", e.target.value)} className="sr-only" />
            <button type="button" onClick={() => colorInputRef.current?.click()}
              className="w-11 h-11 rounded-xl hover:scale-105 active:scale-95 transition-all overflow-hidden shadow-sm"
              style={{ background: form.primary_color, border: "2px solid var(--c-border)" }}>
              <Palette size={14} style={{ margin: "auto", color: "rgba(255,255,255,0.9)" }} />
            </button>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono font-bold"
                style={{ color: "var(--c-text-muted)" }}>#</span>
              <input type="text" className="input h-11 text-sm font-mono w-32 pl-7"
                value={form.primary_color.replace("#", "")}
                onChange={e => {
                  const v = "#" + e.target.value.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6)
                  if (v.length === 7) update("primary_color", v)
                }} maxLength={6} placeholder="4f46e5" />
            </div>
            {form.primary_color !== "#4f46e5" && (
              <button type="button" onClick={() => update("primary_color", "#4f46e5")}
                className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg transition-opacity hover:opacity-70"
                style={{ color: "var(--c-text-muted)", background: "var(--c-surface)" }}>
                <X size={10} /> Reset
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* ── School features ──────────────────────────────── */}
      <Card title="School features" icon={Zap}>
        <p className="text-xs mb-4" style={{ color: "var(--c-text-muted)" }}>
          Choose which modules are active for your school. Disabled modules are hidden from teachers and parents.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {SCHOOL_FEATURES.map(({ key, icon: Icon, label, desc }) => {
            const on = features[key] ?? false
            return (
              <label
                key={key}
                className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  border: `1.5px solid ${on ? "var(--c-indigo)" : "var(--c-border)"}`,
                  background: on ? "var(--c-indigo-bg)" : "var(--c-bg)",
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: on ? "var(--c-indigo)" : "var(--c-surface)" }}>
                  <Icon size={14} style={{ color: on ? "white" : "var(--c-text-muted)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>{desc}</p>
                </div>
                {/* Toggle */}
                <div className="relative shrink-0 mt-1">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() => setFeatures(f => ({ ...f, [key]: !f[key] }))}
                  />
                  <div
                    className="w-9 h-5 rounded-full transition-all duration-300"
                    style={{ background: on ? "var(--c-indigo)" : "var(--c-border)" }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-sm"
                      style={{ background: "white", left: on ? "calc(100% - 1.25rem)" : "0.125rem" }}
                    />
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </Card>

      {/* ── Save ────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving}
          className="btn-primary h-11 px-6 gap-2 disabled:opacity-50 flex items-center">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving…" : "Save settings"}
        </button>
        {saved && (
          <div className="flex items-center gap-1.5" style={{ animation: "fadeSlideIn 300ms ease-out" }}>
            <CheckCircle2 size={15} style={{ color: "var(--c-emerald)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--c-emerald)" }}>Saved</span>
          </div>
        )}
        {error && <p className="text-sm" style={{ color: "var(--c-red)" }}>{error}</p>}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </form>
  )
}

/* ── Card section wrapper ──────────────────────────────────────────────────── */
function Card({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl p-6"
      style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
      <div className="flex items-center gap-2 mb-5">
        <Icon size={14} style={{ color: "var(--c-indigo)" }} />
        <h2 className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{title}</h2>
      </div>
      {children}
    </section>
  )
}
