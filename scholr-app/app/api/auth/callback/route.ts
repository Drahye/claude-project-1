import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get("code")
  // Only allow same-site relative redirects (no "//host" or absolute URLs).
  const rawNext = searchParams.get("next") ?? "/"
  const next  = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // For OAuth sign-ins, check if this is a brand-new user with no profile yet.
      // New Google users need onboarding; existing ones follow the `next` param.
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle()

        if (!profile) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Exchange failed — return to login with an error
  return NextResponse.redirect(`${origin}/login?error=Could+not+sign+in`)
}
