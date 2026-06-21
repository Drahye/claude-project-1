import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/database"
import TeamPanel from "./TeamPanel"

export const metadata: Metadata = { title: "Team — Scholr" }

type AdminRow = Pick<Profile, "id" | "full_name" | "email" | "role" | "is_active" | "created_at">

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", user.id)
    .single() as unknown as { data: Pick<Profile, "school_id" | "role"> | null }

  if (!profile) redirect("/login")
  // Managing admins is owner-only.
  if (profile.role !== "super_admin") redirect("/admin/dashboard")

  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active, created_at")
    .eq("school_id", profile.school_id)
    .in("role", ["admin", "super_admin"])
    .eq("is_active", true)
    .order("created_at") as unknown as { data: AdminRow[] | null }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-3xl mx-auto">
      <div className="mb-8 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Team &amp; admins
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          Invite co-admins to help run your school. Admins manage students, teachers, classes,
          messages, and Town Hall — but only you (the owner) control billing and school settings.
        </p>
      </div>
      <TeamPanel admins={admins ?? []} currentUserId={user.id} />
    </div>
  )
}
