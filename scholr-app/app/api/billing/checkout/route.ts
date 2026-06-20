import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

const PRICE_IDS: Record<string, string | undefined> = {
  starter:    process.env.STRIPE_STARTER_PRICE_ID,
  pro:        process.env.STRIPE_PRO_PRICE_ID,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { plan } = await req.json()

  const priceId = PRICE_IDS[plan]
  if (!priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })

  // Authorize: only an admin may start checkout, and only for THEIR OWN school.
  // school_id is derived from the session — never trust a client-supplied id, or
  // any authenticated user could start billing against an arbitrary school.
  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", user.id)
    .single() as unknown as { data: { school_id: string; role: string } | null }

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const school_id = profile.school_id

  const { data: school } = await supabase
    .from("schools")
    .select("name, stripe_customer_id")
    .eq("id", school_id)
    .single() as unknown as { data: { name: string; stripe_customer_id: string | null } | null }

  if (!school) return NextResponse.json({ error: "School not found" }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode:                "subscription",
    payment_method_types: ["card"],
    line_items:          [{ price: priceId, quantity: 1 }],
    success_url:         `${appUrl}/admin/billing?success=1`,
    cancel_url:          `${appUrl}/admin/billing?canceled=1`,
    metadata:            { school_id },
    subscription_data:   { trial_period_days: 14 },
  }

  // Reuse existing Stripe customer if we have one
  if (school.stripe_customer_id) {
    sessionParams.customer = school.stripe_customer_id
  } else {
    sessionParams.customer_email = user.email
    sessionParams.customer_creation = "always"
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return NextResponse.json({ url: session.url })
}
