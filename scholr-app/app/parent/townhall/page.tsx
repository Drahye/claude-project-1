import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TownHallFeed from "@/components/shared/TownHallFeed"
import type { Profile, Broadcast } from "@/types/database"

export const metadata: Metadata = { title: "Town Hall" }

export default async function ParentTownHallPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles").select("school_id, role").eq("id", user.id).single() as unknown as
    { data: Pick<Profile, "school_id" | "role"> | null }
  if (!profile || profile.role !== "parent") redirect("/login")

  const { data: broadcasts } = await supabase
    .from("broadcasts")
    .select("id, title, body, created_at, author_id, school_id")
    .eq("school_id", profile.school_id)
    .order("created_at", { ascending: false })
    .limit(50) as unknown as { data: Broadcast[] | null }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-3xl mx-auto">
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>Town Hall</h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>Announcements from your child&apos;s school.</p>
      </div>
      <TownHallFeed broadcasts={broadcasts ?? []} />
    </div>
  )
}
