import { notFound } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import JoinForm from "./JoinForm"
import type { School } from "@/types/database"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const svc = await createServiceClient()
  const { data } = await svc.from("schools").select("name").eq("slug", params.slug).maybeSingle()
  const name = (data as { name?: string } | null)?.name
  return { title: name ? `Join ${name} · Scholr` : "Join · Scholr" }
}

export default async function JoinPage({ params, searchParams }: {
  params: { slug: string }
  searchParams: { token_hash?: string; type?: string }
}) {
  const svc = await createServiceClient()
  const { data } = await svc.from("schools").select("*").eq("slug", params.slug).maybeSingle()
  if (!data) notFound()
  const school = data as unknown as School

  // Two ways in: already-authenticated (cookie session), or carrying an invite
  // token in the URL (verified only on submit — prefetch-safe).
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const tokenHash = searchParams?.token_hash ?? null
  const tokenType = searchParams?.type ?? null

  let initialName = ""
  let role: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles").select("full_name, role").eq("id", user.id).maybeSingle() as unknown as
      { data: { full_name: string | null; role: string | null } | null }
    initialName = profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? ""
    role = profile?.role ?? null
  }

  return (
    <JoinForm
      slug={school.slug}
      schoolName={school.name}
      accent={school.public_color || school.primary_color || "#4F46E5"}
      logoUrl={school.logo_url}
      welcomeHeadline={school.welcome_headline ?? null}
      authed={!!user}
      tokenHash={tokenHash}
      tokenType={tokenType}
      initialName={initialName}
      role={role}
    />
  )
}
