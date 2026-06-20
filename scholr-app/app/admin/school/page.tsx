import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import type { Profile, School } from "@/types/database"
import SchoolHub from "./SchoolHub"

export interface PageInsights { views: number; clicks: number; daily: number[] }

export const metadata: Metadata = { title: "School page — Scholr" }

export default async function SchoolBuilderPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role, full_name, avatar_url")
    .eq("id", user.id)
    .single() as unknown as { data: (Pick<Profile, "school_id" | "role" | "full_name"> & { avatar_url?: string | null }) | null }

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/login")
  }

  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("id", profile.school_id)
    .single() as unknown as { data: School | null }

  if (!school) redirect("/login")

  // Public-page insights — last 30 days (events table is service-role only)
  const svc = await createServiceClient()
  const since = new Date(); since.setDate(since.getDate() - 30)
  const { data: events } = await svc
    .from("school_page_events")
    .select("event, created_at")
    .eq("school_id", profile.school_id)
    .gte("created_at", since.toISOString()) as unknown as {
      data: Array<{ event: string; created_at: string }> | null
    }
  const evs = events ?? []
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0); dayStart.setDate(dayStart.getDate() - 13)
  const daily = Array(14).fill(0) as number[]
  for (const e of evs) {
    if (e.event !== "view") continue
    const idx = Math.floor((new Date(e.created_at).getTime() - dayStart.getTime()) / 86400000)
    if (idx >= 0 && idx < 14) daily[idx]++
  }
  const insights: PageInsights = {
    views:  evs.filter(e => e.event === "view").length,
    clicks: evs.filter(e => e.event === "login_click").length,
    daily,
  }

  const initialTab = searchParams.tab === "gallery" ? "gallery" : "page"

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-6xl mx-auto">
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Customization
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          Everything about how your school looks — public page, branding, and photos. Live at{" "}
          <span style={{ color: "var(--c-indigo)", fontWeight: 600 }}>getscholr.vercel.app/{school.slug}</span>
        </p>
      </div>
      <SchoolHub
        school={school}
        initialTab={initialTab as "page" | "gallery"}
        insights={insights}
      />
    </div>
  )
}
