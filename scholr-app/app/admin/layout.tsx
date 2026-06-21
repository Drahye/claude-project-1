import { redirect }      from "next/navigation"
import { createClient }  from "@/lib/supabase/server"
import AdminSidebar      from "@/components/admin/AdminSidebar"
import { getUnreadCounts } from "@/lib/unread"
import type { Profile, School } from "@/types/database"

type AdminProfile = Profile & {
  school: Pick<School, "name" | "logo_url" | "primary_color"> | null
}

/** Convert a 6-digit hex string to R, G, B (0–255) */
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "")
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null
  const n = parseInt(clean, 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

/**
 * Generate a CSS snippet that overrides --c-indigo, --c-indigo-hover,
 * and --c-indigo-bg using the school's primary colour.
 * Produces both light-mode and dark-mode values so dark theme still works.
 */
function brandCss(color: string | null | undefined): string {
  if (!color) return ""
  const rgb = hexToRgb(color)
  if (!rgb) return ""

  const [r, g, b] = rgb

  // Hover: darken ~10%
  const dr = Math.max(0, r - 26)
  const dg = Math.max(0, g - 26)
  const db = Math.max(0, b - 26)

  // Light-mode tint: ~92% white + 8% brand (near-white tinted)
  const lr = Math.round(r * 0.08 + 255 * 0.92)
  const lg = Math.round(g * 0.08 + 255 * 0.92)
  const lb = Math.round(b * 0.08 + 255 * 0.92)

  // Dark-mode tint: ~20% brand (very dark tinted) — keeps the hue, kills the lightness
  const xr = Math.round(r * 0.20)
  const xg = Math.round(g * 0.20)
  const xb = Math.round(b * 0.20)

  return `
    :root {
      --c-indigo:       rgb(${r},${g},${b});
      --c-indigo-hover: rgb(${dr},${dg},${db});
      --c-indigo-bg:    rgb(${lr},${lg},${lb});
    }
    [data-theme="dark"] {
      --c-indigo:       rgb(${r},${g},${b});
      --c-indigo-hover: rgb(${dr},${dg},${db});
      --c-indigo-bg:    rgb(${xr},${xg},${xb});
    }
  `
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, school:schools(name, logo_url, primary_color)")
    .eq("id", user.id)
    .single() as unknown as { data: AdminProfile | null }

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/login")
  }

  const css = brandCss(profile.school?.primary_color)

  const unread = await getUnreadCounts(supabase as any, user.id)
  const badges = {
    "/admin/alerts":   unread.alerts,
    "/admin/messages": unread.messages,
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--c-canvas)" }}>
      {/* Inject school brand colour overrides */}
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}

      <AdminSidebar profile={profile} badges={badges} />
      <main className="flex-1 min-w-0 md:ml-[240px] min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
