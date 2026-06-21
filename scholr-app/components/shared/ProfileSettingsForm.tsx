"use client"
import { useState, useRef } from "react"
import Image from "next/image"
import { Save, Loader2, CheckCircle2, Eye, EyeOff, Camera } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getInitials, avatarColor } from "@/lib/utils"

interface Props {
  profile: {
    id:         string
    full_name:  string
    email:      string
    phone:      string | null
    avatar_url: string | null
  }
}

export default function ProfileSettingsForm({ profile }: Props) {
  const [form, setForm] = useState({
    full_name: profile.full_name,
    phone:     profile.phone ?? "",
  })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved]   = useState(false)
  const [profileError, setProfileError]   = useState<string | null>(null)

  // Avatar
  const [avatarUrl, setAvatarUrl]       = useState<string | null>(profile.avatar_url)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError]   = useState<string | null>(null)
  const avatarInputRef                  = useRef<HTMLInputElement>(null)

  // Password
  const [pwForm, setPwForm] = useState({ next: "", confirm: "" })
  const [showPw, setShowPw]     = useState(false)
  const [savingPw, setSavingPw]   = useState(false)
  const [pwSaved, setPwSaved]     = useState(false)
  const [pwError, setPwError]     = useState<string | null>(null)

  /* ── Avatar upload ─────────────────────────────────────────────────── */
  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarLoading(true)
    setAvatarError(null)

    const fd = new FormData()
    fd.append("file", file)
    fd.append("type", "avatar")

    try {
      const res  = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Upload failed")
      setAvatarUrl(body.url)
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setAvatarLoading(false)
      // Reset input so same file can be re-selected
      if (avatarInputRef.current) avatarInputRef.current.value = ""
    }
  }

  /* ── Profile save ──────────────────────────────────────────────────── */
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { setProfileError("Name is required."); return }
    setSavingProfile(true)
    setProfileError(null)

    const supabase = createClient()
    const { error } = await (supabase.from("profiles") as any)
      .update({ full_name: form.full_name.trim(), phone: form.phone.trim() || null })
      .eq("id", profile.id) as { error: { message: string } | null }

    setSavingProfile(false)
    if (error) setProfileError(error.message)
    else setProfileSaved(true)
  }

  /* ── Password save ─────────────────────────────────────────────────── */
  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.next.length < 8) { setPwError("New password must be at least 8 characters."); return }
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords do not match."); return }

    setSavingPw(true)
    setPwError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: pwForm.next })

    setSavingPw(false)
    if (error) setPwError(error.message)
    else {
      setPwSaved(true)
      setPwForm({ next: "", confirm: "" })
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Avatar ───────────────────────────────────────────────────── */}
      <section className="card p-6">
        <h2 className="text-sm font-bold mb-5" style={{ color: "var(--c-text)" }}>Profile picture</h2>
        <div className="flex items-center gap-6">
          {/* Avatar circle */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden"
              style={{ border: "2px solid var(--c-border)" }}>
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={profile.full_name}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ background: avatarColor(profile.full_name) }}>
                  {getInitials(profile.full_name)}
                </div>
              )}
            </div>

            {/* Camera button */}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
              style={{ background: "var(--c-indigo)", border: "2px solid var(--c-bg)" }}
              title="Change photo"
            >
              {avatarLoading
                ? <Loader2 size={12} className="text-white animate-spin" />
                : <Camera size={12} className="text-white" />
              }
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarFile}
            />
          </div>

          {/* Instructions */}
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--c-text)" }}>
              {profile.full_name}
            </p>
            <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--c-text-muted)" }}>
              Click the camera icon to upload a new photo.<br />
              PNG, JPG or WebP · Max 5 MB
            </p>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarLoading}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 active:scale-95 disabled:opacity-50"
              style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}
            >
              {avatarLoading ? "Uploading…" : "Upload photo"}
            </button>
          </div>
        </div>

        {avatarError && (
          <p className="mt-3 text-xs" style={{ color: "var(--c-red)" }}>{avatarError}</p>
        )}
        {!avatarLoading && avatarUrl && avatarUrl !== profile.avatar_url && (
          <div className="flex items-center gap-1.5 mt-3">
            <CheckCircle2 size={13} style={{ color: "var(--c-emerald)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--c-emerald)" }}>
              Photo updated — refresh the page to see it in the sidebar
            </span>
          </div>
        )}
      </section>

      {/* ── Profile info ─────────────────────────────────────────────── */}
      <section className="card p-6">
        <h2 className="text-sm font-bold mb-5" style={{ color: "var(--c-text)" }}>Profile information</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
                Full name <span style={{ color: "var(--c-red)" }}>*</span>
              </label>
              <input
                type="text"
                className="input h-11 text-sm w-full"
                value={form.full_name}
                onChange={e => { setForm(p => ({ ...p, full_name: e.target.value })); setProfileSaved(false) }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Phone number</label>
              <input
                type="tel"
                className="input h-11 text-sm w-full"
                placeholder="+234 800 000 0000"
                value={form.phone}
                onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setProfileSaved(false) }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>Email address</label>
            <input
              type="email"
              className="input h-11 text-sm w-full"
              value={profile.email}
              disabled
              style={{ background: "var(--c-surface)", cursor: "not-allowed" }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>Contact support to change your email.</p>
          </div>
          {profileError && <p className="text-sm" style={{ color: "var(--c-red)" }}>{profileError}</p>}
          <div className="flex items-center gap-4">
            <button type="submit" disabled={savingProfile} className="btn-primary h-10 px-5 gap-2 disabled:opacity-50">
              {savingProfile ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {savingProfile ? "Saving…" : "Save changes"}
            </button>
            {profileSaved && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} style={{ color: "var(--c-emerald)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--c-emerald)" }}>Saved</span>
              </div>
            )}
          </div>
        </form>
      </section>

      {/* ── Change password ───────────────────────────────────────────── */}
      <section className="card p-6">
        <h2 className="text-sm font-bold mb-1" style={{ color: "var(--c-text)" }}>Change password</h2>
        <p className="text-xs mb-5" style={{ color: "var(--c-text-muted)" }}>
          Leave blank if you signed in with Google and don&apos;t have a password yet.
        </p>
        <form onSubmit={savePassword} className="space-y-4 max-w-sm">
          {[
            { key: "next"    as const, label: "New password",          placeholder: "Min. 8 characters" },
            { key: "confirm" as const, label: "Confirm new password",  placeholder: "Repeat password" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>{label}</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="input h-11 text-sm w-full pr-10"
                  placeholder={placeholder}
                  value={pwForm[key]}
                  onChange={e => { setPwForm(p => ({ ...p, [key]: e.target.value })); setPwSaved(false); setPwError(null) }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--c-text-muted)" }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
          {pwError && <p className="text-sm" style={{ color: "var(--c-red)" }}>{pwError}</p>}
          <div className="flex items-center gap-4">
            <button type="submit" disabled={savingPw} className="btn-primary h-10 px-5 gap-2 disabled:opacity-50">
              {savingPw ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {savingPw ? "Saving…" : "Update password"}
            </button>
            {pwSaved && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={14} style={{ color: "var(--c-emerald)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--c-emerald)" }}>Password updated</span>
              </div>
            )}
          </div>
        </form>
      </section>
    </div>
  )
}
