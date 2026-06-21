import type { Metadata } from "next"
import PricingPage from "./PricingPage"

export const metadata: Metadata = {
  title: "Pricing — Scholr",
  description: "One flat monthly fee. Every parent, teacher, and admin gets full access. Start free, upgrade when you're ready.",
}

export default function Page() {
  return <PricingPage />
}
