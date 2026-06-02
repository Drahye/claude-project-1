import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ProfileSettingsForm from "@/components/shared/ProfileSettingsForm"
import type { Profile } from "@/types/database"

export const metadata: Metadata = { title: "Settings" }

export default async function TeacherSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, avatar_url")
    .eq("id", user.id)
    .single() as unknown as { data: Pick<Profile, "id" | "full_name" | "email" | "phone" | "avatar_url"> | null }

  if (!profile) redirect("/login")

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <div className="mb-8 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>Manage your profile and account security</p>
      </div>
      <ProfileSettingsForm profile={profile} />
    </div>
  )
}
