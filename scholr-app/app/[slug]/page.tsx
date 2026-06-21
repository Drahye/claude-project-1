import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import type { School } from "@/types/database"
import { isPaidPlan } from "@/lib/plans"
import { SchoolPageTheme } from "./themes"
import PublicPageBeacon from "@/components/PublicPageBeacon"

export const dynamic = "force-dynamic"

async function getSchool(slug: string): Promise<School | null> {
  const svc = await createServiceClient()
  const { data } = await svc.from("schools").select("*").eq("slug", slug).maybeSingle()
  return (data as unknown as School) ?? null
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const school = await getSchool(params.slug)
  if (!school) return { title: "School not found · Scholr" }
  return {
    title: `${school.name} · Scholr`,
    description: school.welcome_subtext ?? `${school.name} on Scholr — log in to your portal.`,
  }
}

export default async function SchoolPage({ params }: { params: { slug: string } }) {
  const school = await getSchool(params.slug)
  if (!school) notFound()

  // Absolute so the CTA works when the page is served on a tenant subdomain
  // ({slug}.getscholr.app) — auth always happens on the canonical app domain.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || ""
  const loginUrl = `${appUrl}/${school.slug}/login`

  // Paid public-page perks (themes, custom sections, remove-branding) only apply
  // on a paid plan — free schools always get the default look. This is the real
  // enforcement; the admin UI just mirrors it with locks.
  const paid = isPaidPlan(school.subscription_plan)

  return (
    <>
    <PublicPageBeacon slug={school.slug} />
    <SchoolPageTheme
      theme={paid ? (school.theme || "aurora") : "aurora"}
      slug={school.slug}
      loginUrl={loginUrl}
      schoolName={school.name}
      accent={school.public_color || school.primary_color || "#4F46E5"}
      logoUrl={school.logo_url}
      heroImageUrl={school.hero_image_url ?? null}
      headline={school.welcome_headline || `Welcome to ${school.name}`}
      subtext={school.welcome_subtext || "Your school's home for attendance, homework, messaging, and weekly reports — all in one place."}
      contactEmail={school.contact_email ?? null}
      contactPhone={school.contact_phone ?? null}
      contentBlocks={paid && Array.isArray(school.content_blocks) ? school.content_blocks : []}
      hideBranding={paid ? !!school.hide_branding : false}
    />
    </>
  )
}
