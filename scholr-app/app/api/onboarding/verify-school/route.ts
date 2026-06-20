import { NextResponse } from "next/server"
import { limitOr429 } from "@/lib/rate-limit"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const limited = limitOr429(request, "verify-school", 30, 60_000); if (limited) return limited
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get("slug")?.toLowerCase().trim()

  if (!slug || slug.length < 2) {
    return NextResponse.json({ found: false })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from("schools")
    .select("id, name, logo_url")
    .eq("slug", slug)
    .maybeSingle()

  if (!data) return NextResponse.json({ found: false })
  return NextResponse.json({ found: true, school: { id: data.id, name: data.name, logo_url: data.logo_url } })
}
