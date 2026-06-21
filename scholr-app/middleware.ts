import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { UserRole } from "@/types/database"

// Routes that require no auth (incl. public SEO/asset routes: OG image, apple icon)
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/onboarding", "/pricing", "/privacy", "/terms", "/og", "/apple-touch-icon", "/find-school"]

// First-path segments owned by the app (everything else is a school slug)
const RESERVED_PREFIXES = new Set([
  "login", "signup", "forgot-password", "reset-password", "onboarding",
  "pricing", "privacy", "terms", "admin", "teacher", "parent", "api",
  "og", "apple-touch-icon", "favicon.ico", "_next", "find-school",
])

// Role → allowed path prefixes
const ROLE_ROUTES: Record<UserRole, string> = {
  parent:      "/parent",
  teacher:     "/teacher",
  admin:       "/admin",
  super_admin: "/admin",
}

export async function middleware(request: NextRequest) {
  // ── Tenant subdomains: {slug}.getscholr.app → serve that school's public page ──
  // Gated on NEXT_PUBLIC_ROOT_DOMAIN — a complete no-op until you add a wildcard
  // domain (e.g. *.getscholr.app) to the project and set that env var. The
  // subdomain only renders the public page; all auth happens on the canonical app
  // domain (the page's "Log in" CTA is an absolute URL there, via NEXT_PUBLIC_APP_URL).
  const ROOT = process.env.NEXT_PUBLIC_ROOT_DOMAIN
  if (ROOT) {
    const host = (request.headers.get("host") || "").split(":")[0].toLowerCase()
    if (host.endsWith("." + ROOT) && host !== "www." + ROOT) {
      const sub = host.slice(0, -(ROOT.length + 1))
      if (sub && sub !== "www" && !sub.includes(".") && !RESERVED_PREFIXES.has(sub)) {
        const p = request.nextUrl.pathname
        // Assets, Next internals and API resolve on the same deployment — leave them.
        if (!p.startsWith("/_next") && !p.startsWith("/api") && !p.includes(".")) {
          const url = request.nextUrl.clone()
          url.pathname = `/${sub}`
          return NextResponse.rewrite(url)
        }
      }
    }
  }

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

  // Public per-school pages: any first segment that isn't a reserved app prefix
  // is treated as a school slug → /{slug}, /{slug}/login, /{slug}/join (public).
  const seg1 = pathname.split("/")[1] ?? ""
  const isSchoolRoute = seg1 !== "" && !RESERVED_PREFIXES.has(seg1)

  if (isPublic || isApi || isStatic || isSchoolRoute) {
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
