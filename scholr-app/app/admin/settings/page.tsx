import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile, School } from "@/types/database"
import SettingsForm from "./SettingsForm"

export const metadata: Metadata = { title: "Settings — Scholr" }

type SchoolSettings = Pick<School, "id" | "name" | "slug" | "country" | "timezone" | "primary_color" | "logo_url">

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role, full_name, avatar_url")
    .eq("id", user.id)
    .single() as unknown as { data: Pick<Profile, "school_id" | "role" | "full_name"> & { avatar_url?: string | null } | null }

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/login")
  }

  const { data: school } = await supabase
    .from("schools")
    .select("id, name, slug, country, timezone, primary_color, logo_url")
    .eq("id", profile.school_id)
    .single() as unknown as { data: SchoolSettings | null }

  if (!school) redirect("/login")

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-3xl mx-auto">
      <div className="mb-8 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          Your profile, region, dashboard theme, and active features. Your public page lives in{" "}
          <a href="/admin/school" style={{ color: "var(--c-indigo)", fontWeight: 600, textDecoration: "none" }}>Customization</a>.
        </p>
      </div>
      <SettingsForm
        school={school}
        userId={user.id}
        userAvatarUrl={(profile as any).avatar_url ?? null}
        userName={profile.full_name}
        variant="account"
      />
    </div>
  )
}
