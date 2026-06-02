import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { school_id } = await req.json()

  const { data: school } = await supabase
    .from("schools")
    .select("stripe_customer_id")
    .eq("id", school_id)
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
