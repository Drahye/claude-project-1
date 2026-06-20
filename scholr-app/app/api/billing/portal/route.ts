import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

// No request body — school_id is derived from the authenticated session.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Authorize: only an admin may open the billing portal, and only for THEIR OWN
  // school. school_id is derived from the session — never trust a client-supplied
  // id, or any authenticated user could manage/cancel another school's billing.
  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", user.id)
    .single() as unknown as { data: { school_id: string; role: string } | null }

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: school } = await supabase
    .from("schools")
    .select("stripe_customer_id")
    .eq("id", profile.school_id)
    .single() as unknown as { data: { stripe_customer_id: string | null } | null }

  if (!school?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account found" }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const session = await stripe.billingPortal.sessions.create({
    customer:   school.stripe_customer_id,
    return_url: `${appUrl}/admin/billing`,
  })

  return NextResponse.json({ url: session.url })
}
