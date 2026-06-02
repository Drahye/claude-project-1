import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { UserRole } from "@/types/database"

// Routes that require no auth
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/onboarding", "/pricing", "/privacy", "/terms"]

// Role → allowed path prefixes
const ROLE_ROUTES: Record<UserRole, string> = {
  parent:      "/parent",
  teacher:     "/teacher",
  admin:       "/admin",
  super_admin: "/admin",
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Allow public routes + API routes + static assets
  const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + "?"))
  const isApi    = pathname.startsWith("/api/")
  const isStatic = pathname.startsWith("/_next/") || pathname.includes(".")

  if (isPublic || isApi || isStatic) {
    return supabaseResponse
  }

  // No session — redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Fetch role from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = profile?.role as UserRole | undefined

  if (!role) {
    // Profile not set up yet — send to onboarding
    return NextResponse.redirect(new URL("/onboarding", request.url))
  }

  const allowedPrefix = ROLE_ROUTES[role]

  // Wrong portal — redirect to correct one
  if (!pathname.startsWith(allowedPrefix)) {
    return NextResponse.redirect(new URL(`${allowedPrefix}/dashboard`, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
