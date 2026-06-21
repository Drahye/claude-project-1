"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { MoreHorizontal, LogOut, ChevronRight, Sun, Moon } from "lucide-react"
import { getInitials, avatarColor } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "@/components/ThemeProvider"

export interface NavItem {
  label: string
  href:  string
  icon:  React.ElementType
}

interface Props {
  nav:           NavItem[]
  badges?:       Record<string, number>
  dashboardHref: string
  settingsHref:  string
  roleLabel:     string
  profile:       { full_name: string; avatar_url: string | null }
  /** How many tabs to show before collapsing into "More". Default 4. */
  primaryCount?: number
}

/**
 * Mobile bottom navigation: a fixed bar of up to `primaryCount` primary tabs
 * plus a "More" button that opens a slide-up sheet with the remaining items,
 * the profile, theme toggle, and sign out.
 *
 * Mobile best practices applied:
 * - Max 5 evenly-spaced targets (no horizontal scroll, nothing hidden offscreen)
 * - 44px+ touch targets, safe-area inset for iOS home indicator
 * - Sheet for overflow instead of cramming every route into the bar
 * - GPU-only motion, prefers-reduced-motion honoured, scroll lock while open
 */
export default function MobileBottomNav({
  nav, badges = {}, dashboardHref, settingsHref, roleLabel, profile,
  primaryCount = 4,
}: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const { theme, toggle } = useTheme()
  const isDark = theme === "dark"
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    pathname === href || (href !== dashboardHref && pathname.startsWith(href))

  const primary  = nav.slice(0, primaryCount)
  const overflow = nav.slice(primaryCount)

  const overflowActive  = overflow.some(i => isActive(i.href))
  const overflowBadges  = overflow.reduce((sum, i) => sum + (badges[i.href] ?? 0), 0)

  // Close the sheet whenever the route changes.
  useEffect(() => { setOpen(false) }, [pathname])

  // Lock body scroll + close on Escape while the sheet is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  async function signOut() {
    await createClient().auth.signOut()
    router.push("/login")
  }

  /** Machined icon-tile styles — concentric, beveled depth for sheet rows. */
  function tileStyle(variant: "default" | "active" | "danger"): React.CSSProperties {
    if (variant === "active") return {
      background: "linear-gradient(145deg, var(--c-indigo), var(--c-indigo-hover))",
      border:     "1px solid color-mix(in srgb, var(--c-indigo) 55%, transparent)",
      boxShadow:  "inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 16px color-mix(in srgb, var(--c-indigo) 32%, transparent)",
    }
    if (variant === "danger") return {
      background: "linear-gradient(145deg, color-mix(in srgb, var(--c-red) 15%, var(--c-bg)), color-mix(in srgb, var(--c-red) 6%, var(--c-bg)))",
      border:     "1px solid color-mix(in srgb, var(--c-red) 26%, transparent)",
      boxShadow:  "inset 0 1px 0 color-mix(in srgb, white 26%, transparent)",
    }
    return {
      background: "linear-gradient(145deg, var(--c-bg), var(--c-surface))",
      border:     "1px solid var(--c-border)",
      boxShadow:  "inset 0 1px 0 color-mix(in srgb, white 30%, transparent)",
    }
  }

  return (
    <>
      {/* ── Bottom bar ─────────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50"
        style={{
          background:    "color-mix(in srgb, var(--c-bg) 88%, transparent)",
          backdropFilter:"saturate(180%) blur(12px)",
          borderTop:     "1px solid var(--c-border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-stretch h-16">
          {primary.map(({ label, href, icon: Icon }) => {
            const active = isActive(href)
            const count  = badges[href] ?? 0
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-transform duration-150 active:scale-90"
              >
                <div
                  className="relative flex items-center justify-center transition-colors duration-200"
                  style={{
                    width: 40, height: 28, borderRadius: 9,
                    background: active ? "var(--c-indigo-bg)" : "transparent",
                  }}
                >
                  <Icon size={19}
                    style={{ color: active ? "var(--c-indigo)" : "var(--c-text-muted)" }}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {count > 0 && <Dot count={count} />}
                </div>
                <span className="text-[10px] font-semibold leading-none"
                  style={{ color: active ? "var(--c-indigo)" : "var(--c-text-muted)" }}>
                  {label}
                </span>
              </Link>
            )
          })}

          {overflow.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="More"
              aria-expanded={open}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-transform duration-150 active:scale-90"
            >
              <div
                className="relative flex items-center justify-center transition-colors duration-200"
                style={{
                  width: 40, height: 28, borderRadius: 9,
                  background: overflowActive || open ? "var(--c-indigo-bg)" : "transparent",
                }}
              >
                <MoreHorizontal size={19}
                  style={{ color: overflowActive || open ? "var(--c-indigo)" : "var(--c-text-muted)" }}
                  strokeWidth={overflowActive || open ? 2.5 : 2}
                />
                {overflowBadges > 0 && <Dot count={overflowBadges} />}
              </div>
              <span className="text-[10px] font-semibold leading-none"
                style={{ color: overflowActive || open ? "var(--c-indigo)" : "var(--c-text-muted)" }}>
                More
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* ── Overflow sheet ─────────────────────────────────────────── */}
      {open && (
        <div className="md:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="mbn-backdrop absolute inset-0"
            style={{ background: "color-mix(in srgb, var(--c-text) 48%, transparent)" }}
          />

          {/* Panel */}
          <div
            className="mbn-sheet absolute inset-x-0 bottom-0 overflow-hidden"
            style={{
              borderRadius:  "28px 28px 0 0",
              background:    "var(--c-bg)",
              borderTop:     "1px solid color-mix(in srgb, var(--c-border) 70%, transparent)",
              boxShadow:     "0 -24px 64px color-mix(in srgb, var(--c-text) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)",
              paddingBottom: "calc(env(safe-area-inset-bottom) + 14px)",
            }}
          >
            {/* Decorative accent glow */}
            <div aria-hidden className="pointer-events-none absolute"
              style={{
                top: -120, left: "50%", transform: "translateX(-50%)",
                width: 340, height: 240,
                background: "radial-gradient(circle at center, color-mix(in srgb, var(--c-indigo) 16%, transparent), transparent 70%)",
              }} />

            {/* Grab handle */}
            <div className="relative flex justify-center pt-3 pb-1">
              <span className="rounded-full" style={{ width: 40, height: 4, background: "var(--c-border-mid)" }} />
            </div>

            {/* Header: profile card → settings */}
            <div className="relative px-4 pt-2 pb-3">
              <Link
                href={settingsHref}
                className="mbn-item group flex items-center gap-3 rounded-[20px] p-2.5 pr-3 transition-transform active:scale-[0.985]"
                style={{
                  background: "var(--c-surface)",
                  border:     "1px solid var(--c-border)",
                  boxShadow:  "inset 0 1px 0 color-mix(in srgb, white 26%, transparent)",
                  ["--i" as string]: "0ms",
                }}
              >
                <div className="relative w-11 h-11 shrink-0">
                  {profile.avatar_url ? (
                    <Image src={profile.avatar_url} alt={profile.full_name} fill sizes="44px"
                      className="rounded-full object-cover"
                      style={{ boxShadow: "0 0 0 2px var(--c-bg), 0 0 0 3px color-mix(in srgb, var(--c-indigo) 40%, transparent)" }} />
                  ) : (
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-base font-bold"
                      style={{ background: avatarColor(profile.full_name), boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)" }}>
                      {getInitials(profile.full_name)}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                    style={{ background: "var(--c-emerald)", borderColor: "var(--c-surface)" }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.95rem] font-bold truncate" style={{ color: "var(--c-text)", letterSpacing: "-0.01em" }}>{profile.full_name}</p>
                  <p className="text-xs font-medium" style={{ color: "var(--c-text-muted)" }}>{roleLabel} · View profile</p>
                </div>
                <ChevronRight size={17} className="shrink-0 transition-transform group-active:translate-x-0.5"
                  style={{ color: "var(--c-text-muted)" }} />
              </Link>
            </div>

            {/* Eyebrow */}
            <p className="relative px-5 pt-1 pb-2 text-[10px] font-bold uppercase"
              style={{ color: "var(--c-text-muted)", letterSpacing: "0.18em" }}>
              Menu
            </p>

            {/* Overflow items — machined tray */}
            <div className="relative mx-4 rounded-[20px] overflow-hidden"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "inset 0 1px 0 color-mix(in srgb, white 22%, transparent)" }}>
              {overflow.map(({ label, href, icon: Icon }, i) => {
                const active = isActive(href)
                const count  = badges[href] ?? 0
                return (
                  <Link
                    key={href}
                    href={href}
                    className="mbn-item group flex items-center gap-3.5 px-3 py-3 transition-colors active:scale-[0.99]"
                    style={{
                      background: active ? "var(--c-indigo-bg)" : "transparent",
                      borderTop:  i > 0 ? "1px solid var(--c-border)" : undefined,
                      ["--i" as string]: `${60 + i * 45}ms`,
                    }}
                  >
                    <span className="relative w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 transition-transform duration-200 group-active:scale-95"
                      style={tileStyle(active ? "active" : "default")}>
                      <Icon size={16}
                        style={{ color: active ? "white" : "var(--c-text-mid)" }}
                        strokeWidth={active ? 2.5 : 2} />
                      {count > 0 && <Dot count={count} />}
                    </span>
                    <span className="flex-1 text-[0.9rem] font-semibold truncate"
                      style={{ color: active ? "var(--c-indigo)" : "var(--c-text)" }}>
                      {label}
                    </span>
                    <ChevronRight size={16} className="shrink-0 transition-transform group-active:translate-x-0.5"
                      style={{ color: active ? "var(--c-indigo)" : "var(--c-text-muted)", opacity: active ? 1 : 0.6 }} />
                  </Link>
                )
              })}
            </div>

            {/* Footer tray — theme + sign out */}
            <div className="relative mx-4 mt-2.5 rounded-[20px] overflow-hidden"
              style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "inset 0 1px 0 color-mix(in srgb, white 22%, transparent)" }}>
              {/* Theme toggle row with real switch affordance */}
              <button
                onClick={toggle}
                className="mbn-item group w-full flex items-center gap-3.5 px-3 py-3 transition-transform active:scale-[0.99]"
                style={{ ["--i" as string]: `${60 + overflow.length * 45}ms` }}
              >
                <span className="relative w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0"
                  style={tileStyle("default")}>
                  <Sun size={16} className="absolute transition-all duration-300"
                    style={{ color: "var(--c-gold)", opacity: isDark ? 0 : 1, transform: isDark ? "rotate(-90deg) scale(0.5)" : "none" }} />
                  <Moon size={15} className="absolute transition-all duration-300"
                    style={{ color: "var(--c-indigo)", opacity: isDark ? 1 : 0, transform: isDark ? "none" : "rotate(90deg) scale(0.5)" }} />
                </span>
                <span className="flex-1 text-left text-[0.9rem] font-semibold" style={{ color: "var(--c-text)" }}>
                  {isDark ? "Dark mode" : "Light mode"}
                </span>
                {/* Track */}
                <span className="relative shrink-0 transition-colors duration-300"
                  style={{ width: 42, height: 24, borderRadius: 999, background: isDark ? "var(--c-indigo)" : "var(--c-border-mid)" }}>
                  <span className="absolute top-0.5 transition-transform duration-300"
                    style={{
                      left: 2, width: 20, height: 20, borderRadius: 999, background: "white",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
                      transform: isDark ? "translateX(18px)" : "translateX(0)",
                    }} />
                </span>
              </button>

              {/* Sign out row */}
              <button
                onClick={signOut}
                className="mbn-item group w-full flex items-center gap-3.5 px-3 py-3 transition-transform active:scale-[0.99]"
                style={{ borderTop: "1px solid var(--c-border)", ["--i" as string]: `${60 + (overflow.length + 1) * 45}ms` }}
              >
                <span className="relative w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0 transition-transform duration-200 group-active:scale-95"
                  style={tileStyle("danger")}>
                  <LogOut size={15} style={{ color: "var(--c-red)" }} strokeWidth={2.25} />
                </span>
                <span className="flex-1 text-left text-[0.9rem] font-semibold" style={{ color: "var(--c-red)" }}>
                  Sign out
                </span>
                <ChevronRight size={16} className="shrink-0 transition-transform group-active:translate-x-0.5"
                  style={{ color: "var(--c-red)", opacity: 0.6 }} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .mbn-backdrop { animation: mbn-fade 240ms ease-out both; }
        .mbn-sheet    { animation: mbn-up 420ms cubic-bezier(0.32,0.72,0,1) both; }
        .mbn-item     { animation: mbn-item 460ms cubic-bezier(0.23,1,0.32,1) var(--i, 0ms) both; }

        @keyframes mbn-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mbn-up   { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes mbn-item { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        @media (prefers-reduced-motion: reduce) {
          .mbn-backdrop, .mbn-sheet, .mbn-item { animation: mbn-fade 160ms ease both; transform: none; }
        }
      `}</style>
    </>
  )
}

/** Small notification dot for the bar / sheet icons. */
function Dot({ count }: { count: number }) {
  return (
    <span
      className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center text-[8px] font-bold rounded-full px-1"
      style={{ minWidth: 15, height: 15, background: "var(--c-indigo)", color: "white", border: "1.5px solid var(--c-bg)" }}
    >
      {count > 9 ? "9+" : count}
    </span>
  )
}
