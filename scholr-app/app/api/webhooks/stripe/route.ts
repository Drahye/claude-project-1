import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createServiceClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

// Plan limits
const PLAN_LIMITS: Record<string, { max_students: number }> = {
  free:       { max_students: 50 },
  starter:    { max_students: 200 },
  pro:        { max_students: 1000 },
  enterprise: { max_students: 99999 },
}

// Map Stripe Price IDs → plan names
function getPlanFromPriceId(priceId: string): string {
  const map: Record<string, string> = {
    [process.env.STRIPE_STARTER_PRICE_ID ?? ""]:    "starter",
    [process.env.STRIPE_PRO_PRICE_ID ?? ""]:        "pro",
    [process.env.STRIPE_ENTERPRISE_PRICE_ID ?? ""]: "enterprise",
  }
  return map[priceId] ?? "free"
}

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed"
    console.error("[stripe webhook] signature verification failed:", message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = await createServiceClient()

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== "subscription") break

        const schoolId      = session.metadata?.school_id
        const subscriptionId = session.subscription as string

        if (!schoolId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId       = subscription.items.data[0]?.price.id
        const plan          = getPlanFromPriceId(priceId)
        const limits        = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free

        await (supabase.from("schools") as any).update({
          stripe_customer_id:      session.customer as string,
          stripe_subscription_id:  subscriptionId,
          subscription_plan:       plan,
          subscription_status:     subscription.status,
          max_students:            limits.max_students,
        }).eq("id", schoolId)

        await (supabase.from("subscriptions") as any).upsert({
          school_id:               schoolId,
          stripe_subscription_id:  subscriptionId,
          stripe_customer_id:      session.customer as string,
          plan,
          status:                  subscription.status,
          current_period_start:    new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end:      new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end:    subscription.cancel_at_period_end,
          trial_end:               subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
        }, { onConflict: "stripe_subscription_id" })

        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const priceId       = subscription.items.data[0]?.price.id
        const plan          = getPlanFromPriceId(priceId)
        const limits        = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free

        // Find school by stripe subscription id
        const { data: school } = await (supabase.from("schools") as any)
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single() as { data: { id: string } | null }

        if (school) {
          await (supabase.from("schools") as any).update({
            subscription_plan:    plan,
            subscription_status:  subscription.status,
            max_students:         limits.max_students,
          }).eq("id", school.id)

          await (supabase.from("subscriptions") as any).update({
            plan,
            status:                  subscription.status,
            current_period_start:    new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end:      new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end:    subscription.cancel_at_period_end,
            trial_end:               subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          }).eq("stripe_subscription_id", subscription.id)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription

        const { data: school } = await (supabase.from("schools") as any)
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single() as { data: { id: string } | null }

        if (school) {
          await (supabase.from("schools") as any).update({
            subscription_plan:   "free",
            subscription_status: "canceled",
            max_students:        PLAN_LIMITS.free.max_students,
          }).eq("id", school.id)

          await (supabase.from("subscriptions") as any)
            .update({ status: "canceled" })
            .eq("stripe_subscription_id", subscription.id)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subId   = invoice.subscription as string

        const { data: school } = await (supabase.from("schools") as any)
          .select("id")
          .eq("stripe_subscription_id", subId)
          .single() as { data: { id: string } | null }

        if (school) {
          await (supabase.from("schools") as any)
            .update({ subscription_status: "past_due" })
            .eq("id", school.id)

          // Notify school admin
          const { data: admins } = await (supabase.from("profiles") as any)
            .select("id")
            .eq("school_id", school.id)
            .in("role", ["admin", "super_admin"]) as { data: Array<{ id: string }> | null }

          if ((admins ?? []).length > 0) {
            const notifs = (admins ?? []).map((a: { id: string }) => ({
              school_id:    school.id,
              recipient_id: a.id,
              type:         "fee",
              title:        "Payment failed",
              body:         "Your subscription payment failed. Please update your billing details to keep your school active.",
              is_read:      false,
              metadata:     {},
            }))
            await (supabase.from("notifications") as any).insert(notifs)
          }
        }
        break
      }

      default:
        // Unhandled event — return 200 so Stripe doesn't retry
        break
    }
  } catch (err) {
    console.error(`[stripe webhook] error handling ${event.type}:`, err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
