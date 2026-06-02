import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { Profile, School, Subscription } from "@/types/database"
import BillingPanel from "./BillingPanel"

export const metadata: Metadata = { title: "Billing" }

type BillingSchool = Pick<School,
  "id" | "name" | "subscription_plan" | "subscription_status" | "student_count" | "max_students" |
  "stripe_customer_id" | "stripe_subscription_id"
>

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", user.id)
    .single() as unknown as { data: Pick<Profile, "school_id" | "role"> | null }

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/login")
  }

  const { data: school } = await supabase
    .from("schools")
    .select("id, name, subscription_plan, subscription_status, student_count, max_students, stripe_customer_id, stripe_subscription_id")
    .eq("id", profile.school_id)
    .single() as unknown as { data: BillingSchool | null }

  if (!school) redirect("/login")

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("school_id", profile.school_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single() as unknown as { data: Subscription | null }

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-4xl mx-auto">
      <div className="mb-8 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Billing &amp; plan
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          Manage your subscription and student limit
        </p>
      </div>
      <BillingPanel school={school} subscription={subscription} userId={user.id} />
    </div>
  )
}
