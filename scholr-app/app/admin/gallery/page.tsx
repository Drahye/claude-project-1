import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/database"
import GalleryClient from "./GalleryClient"

export const metadata: Metadata = { title: "Gallery — Scholr" }

export default async function GalleryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role, full_name")
    .eq("id", user.id)
    .single() as unknown as { data: Pick<Profile, "school_id" | "role" | "full_name"> | null }

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/login")
  }

  // Fetch existing gallery images from the school's metadata or a gallery table
  // For now we read from the school-assets bucket path
  const { data: schoolData } = await supabase
    .from("schools")
    .select("id, name, slug")
    .eq("id", profile.school_id)
    .single() as unknown as { data: { id: string; name: string; slug: string } | null }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-5xl mx-auto">
      <div className="mb-8 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          School gallery
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          Photos shown on your public school page at{" "}
          <span className="font-semibold" style={{ color: "var(--c-indigo)" }}>
            scholr.app/{schoolData?.slug}
          </span>
        </p>
      </div>
      <GalleryClient schoolId={profile.school_id} schoolName={schoolData?.name ?? ""} />
    </div>
  )
}
