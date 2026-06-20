"use client"
import { useState, useRef, useCallback } from "react"
import { ImageIcon, Check, ExternalLink, Loader2, X, Upload, Plus, Trash2, Sparkles, Lock, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import type { School, ContentBlock } from "@/types/database"
import { isPaidPlan } from "@/lib/plans"
import type { PageInsights } from "./page"

const PRESET_COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#0f172a"]

const THEMES = [
  { id: "aurora",    name: "Aurora",    desc: "Dark & glassy" },
  { id: "editorial", name: "Editorial", desc: "Bold light split" },
  { id: "campus",    name: "Campus",    desc: "Structured site" },
]

function themeSwatch(id: string, color: string): React.CSSProperties {
  if (id === "editorial") return { background: `linear-gradient(90deg, #FBF9F4 58%, ${color} 58%)` }
  if (id === "campus")    return { background: `linear-gradient(180deg, ${color} 0 26%, #f3f4f7 26%)` }
  return { background: `linear-gradient(150deg, ${color}, #0b0a1a)` } // aurora
}

export default function SchoolBuilderForm({ school, insights }: { school: School; insights?: PageInsights }) {
  const [name, setName]         = useState(school.name)
  const [pubColor, setPubColor] = useState(school.public_color || school.primary_color || "#4f46e5")
  const [logo, setLogo]         = useState<string | null>(school.logo_url ?? null)
  const [theme, setTheme]       = useState((school.theme as string) || "aurora")
  const [headline, setHeadline] = useState(school.welcome_headline ?? "")
  const [subtext, setSubtext]   = useState(school.welcome_subtext ?? "")
  const [hero, setHero]         = useState<string | null>(school.hero_image_url ?? null)
  const [email, setEmail]       = useState(school.contact_email ?? "")
  const [phone, setPhone]       = useState(school.contact_phone ?? "")
  const [hideBranding, setHideBranding] = useState(!!school.hide_branding)
  const [blocks, setBlocks]     = useState<ContentBlock[]>(
    Array.isArray(school.content_blocks) ? school.content_blocks : []
  )

  const paid = isPaidPlan(school.subscription_plan)
  const addBlock    = () => setBlocks(b => [...b, { id: crypto.randomUUID(), title: "", body: "" }])
  const removeBlock = (id: string) => setBlocks(b => b.filter(x => x.id !== id))
  const editBlock   = (id: string, field: "title" | "body", val: string) =>
    setBlocks(b => b.map(x => (x.id === id ? { ...x, [field]: val } : x)))

  const [saving, setSaving]   = useState(false)
  const [uploading, setUp]    = useState(false)
  const [logoUp, setLogoUp]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  const onUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUp(true); setError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("type", "gallery")
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Upload failed")
      setHero(body.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUp(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }, [])

  const onLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUp(true); setError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("type", "logo")
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Upload failed")
      setLogo(body.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setLogoUp(false)
      if (logoRef.current) logoRef.current.value = ""
    }
  }, [])

  async function handleSave() {
    if (!name.trim()) { setError("School name is required."); return }
    setSaving(true); setSaved(false); setError(null)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), public_color: pubColor, logo_url: logo, theme,
          welcome_headline: headline, welcome_subtext: subtext,
          hero_image_url: hero, contact_email: email, contact_phone: phone,
          hide_branding: hideBranding, content_blocks: blocks,
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Save failed")
      setSaved(true)
      setPreviewKey(k => k + 1) // reload preview
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const labelCls = "block text-sm font-semibold mb-1.5"
  const labelStyle = { color: "var(--c-text)" } as const

  return (
    <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 items-start">
      {/* ── Form ── */}
      <div className="space-y-5">
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>Your page address</p>
          <a href={`/${school.slug}`} target="_blank" rel="noreferrer"
            className="flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5"
            style={{ border: "1px solid var(--c-border)", background: "var(--c-bg)", textDecoration: "none" }}>
            <span className="font-semibold truncate" style={{ fontSize: "0.875rem", color: "var(--c-text)" }}>
              getscholr.vercel.app/{school.slug}
            </span>
            <ExternalLink size={15} style={{ color: "var(--c-text-muted)", flexShrink: 0 }} />
          </a>
          <p className="mt-2.5 flex items-center gap-1.5" style={{ fontSize: "0.75rem", color: "var(--c-text-muted)" }}>
            <span className="rounded px-1.5 py-0.5 font-bold" style={{ fontSize: "0.625rem", background: `${pubColor}1a`, color: pubColor, letterSpacing: "0.04em" }}>PREMIUM</span>
            A branded subdomain <strong style={{ color: "var(--c-text)" }}>{school.slug}.getscholr.app</strong> is available on a paid plan.
          </p>
        </div>

        {insights && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>Page insights</p>
              <span style={{ fontSize: "0.6875rem", color: "var(--c-text-muted)" }}>Last 30 days</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Views", value: insights.views },
                { label: "Log-in clicks", value: insights.clicks },
                { label: "Conversion", value: insights.views > 0 ? `${Math.round((insights.clicks / insights.views) * 100)}%` : "—" },
              ].map(s => (
                <div key={s.label}>
                  <p className="font-extrabold tabular-nums" style={{ fontSize: "1.5rem", color: "var(--c-text)", letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</p>
                  <p className="mt-1" style={{ fontSize: "0.6875rem", color: "var(--c-text-muted)" }}>{s.label}</p>
                </div>
              ))}
            </div>
            {insights.views > 0 ? (
              <div className="flex items-end gap-1" style={{ height: 40 }} aria-hidden>
                {insights.daily.map((n, i) => {
                  const max = Math.max(1, ...insights.daily)
                  return <div key={i} className="flex-1 rounded-sm" style={{ height: `${Math.max(6, (n / max) * 100)}%`, background: n > 0 ? pubColor : "var(--c-border)", opacity: n > 0 ? 0.85 : 0.5 }} title={`${n} views`} />
                })}
              </div>
            ) : (
              <p style={{ fontSize: "0.75rem", color: "var(--c-text-muted)" }}>No views yet — share your page link to start seeing traffic.</p>
            )}
          </div>
        )}

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>Theme</p>
            {!paid && <ProPill />}
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {THEMES.map(t => {
              const active = theme === t.id
              const locked = !paid && t.id !== "aurora"
              return (
                <button key={t.id} type="button" disabled={locked}
                  onClick={() => !locked && setTheme(t.id)}
                  className="relative rounded-xl overflow-hidden text-left transition-transform active:scale-[0.98]"
                  style={{ border: active ? `2px solid ${pubColor}` : "1px solid var(--c-border)", background: "var(--c-bg)", padding: 3, cursor: locked ? "not-allowed" : "pointer" }}>
                  <div className="rounded-lg relative" style={{ aspectRatio: "4 / 3", ...themeSwatch(t.id, pubColor) }}>
                    {locked && (
                      <span className="absolute inset-0 rounded-lg flex items-center justify-center" style={{ background: "rgba(15,17,28,0.45)" }}>
                        <Lock size={14} className="text-white" />
                      </span>
                    )}
                  </div>
                  <div className="px-1.5 pt-1.5 pb-1">
                    <p className="font-bold" style={{ fontSize: "0.8125rem", color: active ? pubColor : "var(--c-text)" }}>{t.name}</p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--c-text-muted)", lineHeight: 1.3 }}>{t.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
          {!paid && <p className="mt-3" style={{ fontSize: "0.75rem", color: "var(--c-text-muted)" }}>Free schools use the Aurora theme. <Link href="/admin/billing" style={{ color: "var(--c-indigo)", fontWeight: 600, textDecoration: "none" }}>Upgrade to unlock all themes →</Link></p>}
        </div>

        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--c-text-muted)" }}>Brand</p>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: "var(--c-surface)", border: "1.5px solid var(--c-border)" }}>
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <ImageIcon size={22} style={{ color: "var(--c-text-muted)" }} />
                )}
              </div>
              <button type="button" onClick={() => logoRef.current?.click()} disabled={logoUp}
                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: pubColor, color: "#fff", border: "2px solid var(--c-bg)" }} aria-label="Upload logo">
                {logoUp ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
              </button>
              <input ref={logoRef} type="file" accept="image/*" onChange={onLogoUpload} className="hidden" />
            </div>
            <div className="flex-1 min-w-0">
              <label className={labelCls} style={labelStyle}>School name</label>
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="School name" maxLength={80} />
            </div>
          </div>
          <label className={labelCls} style={labelStyle}>Public page color</label>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setPubColor(c)}
                className="w-8 h-8 rounded-xl transition-transform hover:scale-110 active:scale-95"
                style={{ background: c, boxShadow: pubColor.toLowerCase() === c ? `0 0 0 2px var(--c-bg), 0 0 0 4px ${c}` : "none" }}
                aria-label={`Color ${c}`} />
            ))}
            <label className="w-8 h-8 rounded-xl cursor-pointer overflow-hidden relative" style={{ border: "1.5px solid var(--c-border)" }}>
              <input type="color" value={pubColor} onChange={e => setPubColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
              <span style={{ position: "absolute", inset: 0, background: pubColor }} />
            </label>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--c-text-muted)" }}>
            Used on your public page only. Your dashboard theme is separate (in Settings).
          </p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--c-text-muted)" }}>Welcome message</p>

          <div className="mb-4">
            <label className={labelCls} style={labelStyle}>Headline</label>
            <input className="input" value={headline} onChange={e => setHeadline(e.target.value)}
              placeholder={`Welcome to ${school.name}`} maxLength={80} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Subtext</label>
            <textarea className="input" style={{ height: 84, paddingTop: 10, resize: "none" }} value={subtext}
              onChange={e => setSubtext(e.target.value)} maxLength={200}
              placeholder="A short line about your school for parents and teachers." />
          </div>
        </div>

        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--c-text-muted)" }}>Hero image</p>
          {hero ? (
            <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "16 / 7", border: "1px solid var(--c-border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero} alt="Hero" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button onClick={() => setHero(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }} aria-label="Remove image">
                <X size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full rounded-xl flex flex-col items-center justify-center gap-2"
              style={{ aspectRatio: "16 / 7", border: "1.5px dashed var(--c-border-mid)", background: "var(--c-surface)", color: "var(--c-text-muted)" }}>
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
              <span className="text-sm font-medium">{uploading ? "Uploading…" : "Upload a hero image"}</span>
              <span className="text-xs">JPG or PNG, up to 5 MB</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
          <p className="text-xs mt-2" style={{ color: "var(--c-text-muted)" }}>Optional. Falls back to your school colour if empty.</p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--c-text-muted)" }}>Contact</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={labelStyle}>Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="office@school.edu" />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Phone</label>
              <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
            </div>
          </div>
        </div>

        {/* ── Premium: custom sections + remove branding ── */}
        <div className="card p-5" style={{ border: `1px solid ${pubColor}33` }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Sparkles size={15} style={{ color: pubColor }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>Premium</p>
            </div>
            {!paid && <ProPill />}
          </div>
          <p className="mb-4" style={{ fontSize: "0.8125rem", color: "var(--c-text-muted)" }}>Make the page your own.</p>

          {!paid ? (
            <div className="rounded-xl p-5 text-center" style={{ border: `1px dashed ${pubColor}55`, background: `${pubColor}0d` }}>
              <p className="font-bold mb-1" style={{ fontSize: "0.9375rem", color: "var(--c-text)" }}>Unlock premium customization</p>
              <p className="mb-4" style={{ fontSize: "0.8125rem", color: "var(--c-text-muted)", lineHeight: 1.55 }}>Remove “Powered by Scholr”, add custom sections, and use any theme — all on Pro.</p>
              <Link href="/admin/billing" className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold" style={{ background: pubColor, color: "#fff", textDecoration: "none" }}>
                Upgrade to Pro <ArrowUpRight size={14} />
              </Link>
            </div>
          ) : (<>
          {/* Remove branding */}
          <button type="button" onClick={() => setHideBranding(v => !v)}
            className="w-full flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 mb-4 text-left"
            style={{ border: "1px solid var(--c-border)", background: "var(--c-bg)" }}>
            <span>
              <span className="block font-semibold" style={{ fontSize: "0.875rem", color: "var(--c-text)" }}>Remove “Powered by Scholr”</span>
              <span className="block" style={{ fontSize: "0.75rem", color: "var(--c-text-muted)" }}>Hide the Scholr footer on your public page.</span>
            </span>
            <span className="relative rounded-full shrink-0 transition-colors" style={{ width: 40, height: 24, background: hideBranding ? pubColor : "var(--c-border)" }}>
              <span className="absolute top-0.5 rounded-full bg-white transition-all" style={{ width: 20, height: 20, left: hideBranding ? 18 : 2, boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </span>
          </button>

          {/* Custom sections */}
          <label className={labelCls} style={labelStyle}>Custom sections</label>
          <p className="mb-3" style={{ fontSize: "0.75rem", color: "var(--c-text-muted)" }}>Add blocks (e.g. “Our mission”, “Admissions”, “Term dates”) shown below your hero.</p>
          <div className="space-y-3">
            {blocks.map((b, i) => (
              <div key={b.id} className="rounded-xl p-3.5" style={{ border: "1px solid var(--c-border)", background: "var(--c-bg)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--c-text-muted)" }}>Section {i + 1}</span>
                  <button type="button" onClick={() => removeBlock(b.id)} aria-label="Remove section"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-80" style={{ color: "var(--c-red)" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <input className="input mb-2" value={b.title} maxLength={120} onChange={e => editBlock(b.id, "title", e.target.value)} placeholder="Section heading" />
                <textarea className="input" rows={3} value={b.body} maxLength={2000} onChange={e => editBlock(b.id, "body", e.target.value)} placeholder="Write something about your school…" style={{ resize: "vertical" }} />
              </div>
            ))}
          </div>
          {blocks.length < 12 && (
            <button type="button" onClick={addBlock}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
              style={{ border: `1px dashed ${pubColor}66`, color: pubColor, background: `${pubColor}0d` }}>
              <Plus size={15} /> Add section
            </button>
          )}
          </>)}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}>
            {error}
            {error.toLowerCase().includes("column") && <div className="mt-1 text-xs">Run database migration <strong>010_school_branding.sql</strong> in Supabase, then try again.</div>}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="btn-primary h-11 px-6 gap-2">
            {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
            {saving ? "Saving…" : saved ? "Saved" : "Save changes"}
          </button>
          <a href={`/${school.slug}`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--c-indigo)", textDecoration: "none" }}>
            View live page <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* ── Live preview ── */}
      <div className="lg:sticky" style={{ top: 24 }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-text-muted)" }}>Live preview</p>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--c-border)", boxShadow: "var(--shadow-lg)", background: "var(--c-bg)" }}>
          <div className="flex items-center gap-1.5 px-3" style={{ height: 30, borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)" }}>
            <span className="rounded-full" style={{ width: 8, height: 8, background: "var(--c-red)" }} />
            <span className="rounded-full" style={{ width: 8, height: 8, background: "var(--c-gold)" }} />
            <span className="rounded-full" style={{ width: 8, height: 8, background: "var(--c-emerald)" }} />
            <span className="flex-1 text-center" style={{ fontSize: 11, color: "var(--c-text-muted)" }}>getscholr.vercel.app/{school.slug}</span>
          </div>
          <iframe key={previewKey} src={`/${school.slug}`} title="School page preview" style={{ width: "100%", height: 520, border: "none", display: "block" }} />
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--c-text-muted)" }}>Preview reloads after you save.</p>
      </div>
    </div>
  )
}

function ProPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
      style={{ background: "var(--c-gold-bg)", color: "var(--c-gold)", fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.06em" }}>
      <Lock size={9} /> PRO
    </span>
  )
}
