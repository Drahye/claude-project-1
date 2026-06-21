import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import { getInitials } from "@/lib/utils"
import LoginForm from "@/app/(auth)/login/LoginForm"
import type { School } from "@/types/database"

export const dynamic = "force-dynamic"

async function getSchool(slug: string): Promise<School | null> {
  const svc = await createServiceClient()
  const { data } = await svc.from("schools").select("*").eq("slug", slug).maybeSingle()
  return (data as unknown as School) ?? null
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const school = await getSchool(params.slug)
  return { title: school ? `Log in · ${school.name}` : "Log in · Scholr" }
}

export default async function SchoolLoginPage({ params }: { params: { slug: string } }) {
  const school = await getSchool(params.slug)
  if (!school) notFound()

  const accent = school.public_color || school.primary_color || "#4F46E5"

  return (
    <main className="min-h-[100dvh] flex flex-col" style={{ background: "var(--c-bg)" }}>
      {/* Branded top accent */}
      <div style={{ height: 4, background: accent }} aria-hidden />

      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full" style={{ maxWidth: 420 }}>
          {/* School identity */}
          <Link href={`/${school.slug}`} className="flex items-center justify-center gap-2.5 mb-7" style={{ textDecoration: "none" }}>
            {school.logo_url ? (
              <span className="relative rounded-xl overflow-hidden" style={{ width: 38, height: 38, border: "1px solid var(--c-border)" }}>
                <Image src={school.logo_url} alt={school.name} fill sizes="38px" style={{ objectFit: "cover" }} />
              </span>
            ) : (
              <span className="rounded-xl flex items-center justify-center text-white font-bold" style={{ width: 38, height: 38, background: accent, fontSize: 15 }}>
                {getInitials(school.name)}
              </span>
            )}
            <span className="font-extrabold" style={{ fontSize: "1.125rem", color: "var(--c-text)", letterSpacing: "-0.01em" }}>{school.name}</span>
          </Link>

          <div className="text-center mb-6">
            <h1 className="font-extrabold" style={{ fontSize: "1.5rem", color: "var(--c-text)", letterSpacing: "-0.02em" }}>
              Log in to your portal
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--c-text-muted)", marginTop: 4 }}>
              Welcome back to {school.name}.
            </p>
          </div>

          <LoginForm redirectTo="/" />

          <p className="text-center mt-6" style={{ fontSize: "0.75rem", color: "var(--c-text-muted)" }}>
            Powered by <Link href="/" style={{ color: "var(--c-indigo)", fontWeight: 600, textDecoration: "none" }}>Scholr</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
