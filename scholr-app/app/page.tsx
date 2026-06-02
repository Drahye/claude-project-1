import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@/types/database"
import LandingPage from "@/components/landing/LandingPage"

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in — show landing page
  if (!user) return <LandingPage />

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as unknown as { data: { role: UserRole } | null }

  if (!profile) redirect("/onboarding")

  const destinations: Record<UserRole, string> = {
    parent:      "/parent/dashboard",
    teacher:     "/teacher/dashboard",
    admin:       "/admin/dashboard",
    super_admin: "/admin/dashboard",
  }

  redirect(destinations[profile.role] ?? "/onboarding")
}
