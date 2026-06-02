"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  Home, Users, MessageSquare, FileText, Bell, Settings,
  LogOut, GraduationCap,
} from "lucide-react"
import { cn, getInitials, avatarColor } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import ThemeToggle from "@/components/ThemeToggle"

const NAV = [
  { label: "Home",     href: "/parent/dashboard", icon: Home },
  { label: "Children", href: "/parent/children",  icon: Users },
  { label: "Messages", href: "/parent/messages",  icon: MessageSquare },
  { label: "Reports",  href: "/parent/reports",   icon: FileText },
  { label: "Alerts",   href: "/parent/alerts",    icon: Bell },
  { label: "Settings", href: "/parent/settings",  icon: Settings },
]

interface Props {
  profile: { full_name: string; avatar_url: string | null; school?: { name: string } | null }
  badges?: Record<string, number>
}

function NavBadge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span
      className="ml-auto shrink-0 inline-flex items-center justify-center text-[10px] font-bold rounded-full px-1.5"
      style={{ minWidth: 18, height: 18, background: "var(--c-indigo)", color: "white" }}
    >
      {count > 9 ? "9+" : count}
    </span>
  )
}

export default function ParentSidebar({ profile, badges = {} }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  async function signOut() {
    await createClient().auth.signOut()
    router.push("/login")
  }

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-[240px] fixed inset-y-0 left-0 h-screen overflow-hidden z-40"
        style={{ background: "var(--c-bg)", borderRight: "1px solid var(--c-border)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 shrink-0"
          style={{ borderBottom: "1px solid var(--c-border)" }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-3"
            style={{ background: "var(--c-indigo)" }}
          >
            <GraduationCap size={13} className="text-white" />
          </div>
          <div>
            <span className="font-extrabold tracking-tight"
              style={{ fontSize: "0.9375rem", color: "var(--c-text)", letterSpacing: "-0.02em" }}>
              Scholr
            </span>
            <span className="ml-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--c-indigo)" }}>
              Parent
            </span>
          </div>
        </div>

        {/* School name */}
        {profile.school && (
          <div className="px-5 pt-3 pb-1 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-widest truncate"
              style={{ color: "var(--c-text-muted)" }}>
              {profile.school.name}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto min-h-0">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/parent/dashboard" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn("group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:translate-x-0.5")}
                style={{
                  color:      active ? "var(--c-indigo)" : "var(--c-text-mid)",
                  background: active ? "var(--c-indigo-bg)" : "transparent",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "var(--c-surface)" }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent" }}
              >
                {/* Active left accent bar */}
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
                  style={{
                    width:      active ? 3 : 0,
                    height:     active ? 18 : 0,
                    background: "var(--c-indigo)",
                    opacity:    active ? 1 : 0,
                  }}
                />
                <Icon
                  size={16}
                  strokeWidth={active ? 2.5 : 2}
                  className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ color: active ? "var(--c-indigo)" : undefined }}
                />
                {label}
                <NavBadge count={badges[href] ?? 0} />
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 shrink-0" style={{ borderTop: "1px solid var(--c-border)" }}>
          {/* Avatar + name — links to settings */}
          <Link
            href="/parent/settings"
            className="group flex items-center gap-3 mb-2 px-1 py-1.5 rounded-xl transition-all duration-200 hover:bg-[var(--c-surface)]"
          >
            <div className="relative w-8 h-8 shrink-0 transition-transform duration-200 group-hover:scale-105">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  fill
                  sizes="32px"
                  className="rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: avatarColor(profile.full_name) }}
                >
                  {getInitials(profile.full_name)}
                </div>
              )}
              {/* Online dot */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                style={{ background: "var(--c-emerald)", borderColor: "var(--c-bg)" }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>{profile.full_name}</p>
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Parent</p>
            </div>
          </Link>

          {/* Theme toggle */}
          <ThemeToggle labeled className="mb-1" />

          {/* Sign out */}
          <button
            onClick={signOut}
            className="group flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-[var(--c-red-bg)]"
            style={{ color: "var(--c-text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--c-red)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--c-text-muted)")}
          >
            <LogOut size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:scale-110" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav — horizontally scrollable ───────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 overflow-x-auto"
        style={{
          height: 64,
          background: "var(--c-bg)",
          borderTop: "1px solid var(--c-border)",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="flex items-center h-full px-1 gap-1 min-w-max">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/parent/dashboard" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-0.5 px-3 h-full min-w-[56px] transition-transform duration-150 active:scale-90"
              >
                <div
                  className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{ background: active ? "var(--c-indigo-bg)" : "transparent" }}
                >
                  <Icon size={18}
                    style={{ color: active ? "var(--c-indigo)" : "var(--c-text-muted)" }}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {(badges[href] ?? 0) > 0 && (
                    <span
                      className="absolute -top-1 -right-1 inline-flex items-center justify-center text-[8px] font-bold rounded-full px-1"
                      style={{ minWidth: 14, height: 14, background: "var(--c-indigo)", color: "white", border: "1.5px solid var(--c-bg)" }}
                    >
                      {badges[href] > 9 ? "9+" : badges[href]}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-medium"
                  style={{ color: active ? "var(--c-indigo)" : "var(--c-text-muted)" }}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
