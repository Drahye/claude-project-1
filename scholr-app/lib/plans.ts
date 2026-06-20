import type { ElementType } from "react"
import { GraduationCap, Sparkles, Building2, Globe, Shield } from "lucide-react"

export const PLANS = [
  {
    id:           "free",
    name:         "Free",
    badge:        null as string | null,
    description:  "For small schools just getting started.",
    monthlyPrice: 0,
    annualPrice:  0,
    period:       "forever",
    students:     "Up to 100",
    teachers:     "Up to 10",
    storage:      "500 MB",
    cta:          "Get started free",
    href:         "/signup",
    highlight:    false,
    icon:         GraduationCap,
    features: [
      "100 students · 10 teachers",
      "Real-time messaging",
      "Attendance tracking",
      "Homework (5 per class)",
      "Basic report cards",
      "Parent portal",
      "500 MB file storage",
      "Email support",
    ],
  },
  {
    id:           "pro",
    name:         "Pro",
    badge:        "Most Popular" as string | null,
    description:  "For growing schools that want AI-powered insights.",
    monthlyPrice: 89,
    annualPrice:  74,
    period:       "/month",
    students:     "Up to 500",
    teachers:     "Unlimited",
    storage:      "10 GB",
    cta:          "Start 14-day free trial",
    href:         "/signup?plan=pro",
    highlight:    true,
    icon:         Sparkles,
    features: [
      "Up to 500 students",
      "Unlimited teachers",
      "AI Report Writer (Claude)",
      "Weekly Intelligence Report",
      "Analytics dashboard",
      "Fee & invoice manager",
      "Priority support + onboarding call",
      "10 GB file storage",
    ],
  },
  {
    id:           "enterprise",
    name:         "Enterprise",
    badge:        null as string | null,
    description:  "For multi-campus institutions with custom needs.",
    monthlyPrice: null as number | null,
    annualPrice:  null as number | null,
    period:       "",
    students:     "Unlimited",
    teachers:     "Unlimited",
    storage:      "Unlimited",
    cta:          "Contact us",
    href:         "mailto:hello@scholr.app?subject=Enterprise%20enquiry",
    highlight:    false,
    icon:         Building2,
    features: [
      "Unlimited students & teachers",
      "Everything in Pro",
      "Multi-campus dashboard",
      "White-label branding",
      "Custom domain",
      "API access",
      "SLA agreement",
      "Dedicated customer success manager",
    ],
  },
]

/** A school is "paid" on any plan above Free (starter/pro/enterprise). */
export function isPaidPlan(plan?: string | null): boolean {
  return !!plan && plan !== "free"
}

export type FeatureValue = boolean | string

export interface FeatureRow {
  label:      string
  free:       FeatureValue
  pro:        FeatureValue
  enterprise: FeatureValue
  note?:      string
}

export interface FeatureGroup {
  title: string
  icon:  ElementType
  rows:  FeatureRow[]
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: "Core platform",
    icon:  GraduationCap,
    rows: [
      { label: "Students",                free: "Up to 100",   pro: "Up to 500",   enterprise: "Unlimited" },
      { label: "Teachers",                free: "Up to 10",    pro: "Unlimited",   enterprise: "Unlimited" },
      { label: "File storage",            free: "500 MB",      pro: "10 GB",       enterprise: "Unlimited" },
      { label: "Real-time messaging",     free: true,          pro: true,          enterprise: true },
      { label: "Attendance tracking",     free: true,          pro: true,          enterprise: true },
      { label: "Homework management",     free: "5 / class",   pro: "Unlimited",   enterprise: "Unlimited" },
      { label: "Basic report cards",      free: true,          pro: true,          enterprise: true },
      { label: "Parent portal",           free: true,          pro: true,          enterprise: true },
      { label: "Public school page",      free: true,          pro: true,          enterprise: true },
    ],
  },
  {
    title: "Communication",
    icon:  Globe,
    rows: [
      { label: "Push notifications",      free: true,          pro: true,          enterprise: true },
      { label: "In-app announcements",    free: "10 / month",  pro: "Unlimited",   enterprise: "Unlimited" },
      { label: "SMS fallback",            free: false,         pro: true,          enterprise: true },
      { label: "Smart Event Calendar",    free: false,         pro: true,          enterprise: true },
      { label: "RSVP tracking",           free: false,         pro: true,          enterprise: true },
      { label: "Email support",           free: true,          pro: true,          enterprise: true },
      { label: "Priority support",        free: false,         pro: true,          enterprise: true },
      { label: "Onboarding call",         free: false,         pro: true,          enterprise: true },
    ],
  },
  {
    title: "AI & analytics",
    icon:  Sparkles,
    rows: [
      { label: "AI Report Writer",        free: false,         pro: true,          enterprise: true,        note: "Powered by Claude" },
      { label: "Weekly Intelligence",     free: false,         pro: true,          enterprise: true },
      { label: "AI Lesson Summariser",    free: false,         pro: true,          enterprise: true },
      { label: "Predictive Attendance",   free: false,         pro: true,          enterprise: true },
      { label: "Analytics dashboard",     free: false,         pro: true,          enterprise: true },
      { label: "Fee & invoice manager",   free: false,         pro: true,          enterprise: true },
      { label: "Custom AI tone training", free: false,         pro: false,         enterprise: true },
    ],
  },
  {
    title: "Enterprise",
    icon:  Shield,
    rows: [
      { label: "Multi-campus dashboard",    free: false,         pro: false,         enterprise: true },
      { label: "White-label branding",      free: false,         pro: false,         enterprise: true },
      { label: "Custom domain",             free: false,         pro: false,         enterprise: true },
      { label: "API access",                free: false,         pro: false,         enterprise: true },
      { label: "SLA agreement",             free: false,         pro: false,         enterprise: true },
      { label: "Dedicated CSM",             free: false,         pro: false,         enterprise: true },
      { label: "Quarterly business review", free: false,         pro: false,         enterprise: true },
    ],
  },
]

export const FAQ = [
  { q: "Do parents need to download an app?", a: "No. Scholr is a Progressive Web App. Parents open a link from their invitation email and tap 'Add to Home Screen' in Safari or Chrome — it looks and feels like a native app, no App Store visit required." },
  { q: "What does the 14-day Pro trial include?", a: "Every Pro feature — AI Report Writer, Weekly Intelligence Report, Fee Manager, full Analytics, SMS fallback — at zero cost. No credit card required to start." },
  { q: "Is Scholr FERPA and GDPR compliant?", a: "Yes. Student data is stored in isolated school accounts, never shared with third parties. Scholr supports full data deletion on offboarding and is compliant with FERPA (US) and GDPR (UK/EU)." },
  { q: "Can we import existing student data?", a: "Yes. Scholr accepts CSV imports for students, classes, and parent contacts. A guided setup wizard completes the import in under 10 minutes." },
  { q: "Can we cancel anytime?", a: "Anytime — two clicks from your billing settings. You retain access until the end of your paid period and your data is fully exportable before deletion." },
  { q: "Does Scholr work in Nigeria, Ghana, and Africa?", a: "Yes. Scholr was designed with African schools as a primary use case. Optimised for mid-range Android devices and 3G connections, supporting Naira, Cedis, Pounds, and Dollars." },
  { q: "Is there a setup fee?", a: "None. You pay only the monthly or annual subscription. Pro schools also receive a complimentary onboarding call at no extra cost." },
]
