"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  Bell, Settings, LogOut, Shield, BarChart3, CreditCard, MessageSquare, Globe, Megaphone, UserCog,
} from "lucide-react"
import { cn, getInitials, avatarColor } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import ThemeToggle from "@/components/ThemeToggle"
import MobileBottomNav from "@/components/shared/MobileBottomNav"

// `superOnly` items show only to the school owner (super_admin). Limited admins
// can't reach billing or school branding/customization.
const NAV = [
  { label: "Dashboard",   href: "/admin/dashboard",  icon: LayoutDashboard },
  { label: "Students",    href: "/admin/students",    icon: GraduationCap },
  { label: "Teachers",    href: "/admin/teachers",    icon: Users },
  { label: "Classes",     href: "/admin/classes",     icon: BookOpen },
  { label: "Town Hall",   href: "/admin/townhall",    icon: Megaphone, tour: "town-hall" },
  { label: "Analytics",   href: "/admin/analytics",   icon: BarChart3 },
  { label: "Billing",     href: "/admin/billing",     icon: CreditCard, superOnly: true },
  { label: "Customization", href: "/admin/school",    icon: Globe, superOnly: true },
  { label: "Messages",    href: "/admin/messages",    icon: MessageSquare },
  { label: "Alerts",      href: "/admin/alerts",      icon: Bell },
  { label: "Team",        href: "/admin/team",        icon: UserCog, superOnly: true, tour: "team" },
  { label: "Settings",    href: "/admin/settings",    icon: Settings },
]

interface Props {
  profile: {
    full_name:  string
    avatar_url: string | null
    role:       string
    school?:    { name: string; logo_url?: string | null } | null
  }
  badges?: Record<string, number>
}

/** Small unread-count pill */
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

export default function AdminSidebar({ profile, badges = {} }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  // Hide owner-only items (billing, customization) from limited admins.
  const visibleNav = NAV.filter(item => !item.superOnly || profile.role === "super_admin")

  async function signOut() {
    await createClient().auth.signOut()
    router.push("/login")
  }

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col w-[240px] fixed inset-y-0 left-0 h-screen overflow-hidden z-40"
        style={{ background: "var(--c-bg)", boxShadow: "1px 0 0 var(--c-hairline), var(--shadow-card)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 shrink-0"
          style={{ borderBottom: "1px solid var(--c-border)" }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-300 hover:scale-110 hover:rotate-3"
            style={{ background: "var(--c-indigo)" }}
          >
            <Shield size={13} className="text-white" />
          </div>
          <div>
            <span className="font-extrabold tracking-tight"
              style={{ fontSize: "0.9375rem", color: "var(--c-text)", letterSpacing: "-0.02em" }}>
              Scholr
            </span>
            <span className="ml-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "var(--c-indigo)" }}>
              Admin
            </span>
          </div>
        </div>

        {/* School identity — logo + name */}
        {profile.school && (
          <div className="flex items-center gap-2.5 px-5 pt-3 pb-1 shrink-0">
            {profile.school.logo_url ? (
              <div className="relative w-7 h-7 shrink-0 rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--c-border)" }}>
                <Image
                  src={profile.school.logo_url}
                  alt={profile.school.name}
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                style={{ background: avatarColor(profile.school.name) }}>
                {getInitials(profile.school.name)}
              </div>
            )}
            <p className="text-xs font-semibold uppercase tracking-widest truncate"
              style={{ color: "var(--c-text-muted)" }}>
              {profile.school.name}
            </p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto min-h-0">
          {visibleNav.map(({ label, href, icon: Icon, tour }) => {
            const active = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                data-tour={tour}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                  "transition-all duration-200 hover:translate-x-0.5",
                )}
                style={{
                  color:      active ? "var(--c-indigo)" : "var(--c-text-mid)",
                  background: active ? "var(--c-indigo-bg)" : "transparent",
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "var(--c-surface)"
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"
                }}
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

          {/* Avatar + name */}
          <Link
            href="/admin/settings"
            className="group flex items-center gap-3 mb-2 px-1 py-1.5 rounded-xl transition-all duration-200 hover:bg-[var(--c-surface)]"
          >
            {/* Avatar: real image if available, else initials */}
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
              <p className="text-sm font-semibold truncate" style={{ color: "var(--c-text)" }}>
                {profile.full_name}
              </p>
              <p className="text-xs capitalize" style={{ color: "var(--c-text-muted)" }}>
                {profile.role.replace("_", " ")}
              </p>
            </div>
          </Link>

          {/* Theme toggle — icon + label */}
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

      {/* ── Mobile bottom nav — 4 tabs + More sheet ───────────────────────── */}
      <MobileBottomNav
        nav={visibleNav}
        badges={badges}
        dashboardHref="/admin/dashboard"
        settingsHref="/admin/settings"
        roleLabel="Admin"
        profile={profile}
      />
    </>
  )
}
