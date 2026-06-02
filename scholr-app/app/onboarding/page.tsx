import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import OnboardingWizard from "./OnboardingWizard"

export const metadata: Metadata = { title: "Welcome to Scholr" }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Must be authenticated to onboard
  if (!user) redirect("/login")

  // If already onboarded, send to root (which redirects to correct portal)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle() as unknown as { data: { role: string } | null }

  if (profile?.role) redirect("/")

  return (
    <OnboardingWizard
      userEmail={user.email ?? ""}
      userId={user.id}
    />
  )
}
