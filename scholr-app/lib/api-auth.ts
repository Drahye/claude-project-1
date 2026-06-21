import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@/types/database"

export interface AdminAuth {
  /** The authenticated admin/super_admin user. */
  user: User
  /** The school the admin belongs to. All writes must be scoped to this id. */
  schoolId: string
  /** The caller's role — lets routes branch admin vs super_admin when needed. */
  role: UserRole
}

/**
 * Shared guard. Returns the caller's user + school + role, or a ready-to-return
 * error Response. `allowed` lists the roles permitted on the route.
 *
 *   const auth = await requireAdmin()
 *   if (auth instanceof NextResponse) return auth
 *   // ...use auth.user / auth.schoolId / auth.role
 *
 * school_id always comes from the session here — never from the request body —
 * so a caller can only ever act on their own school.
 */
async function requireRole(allowed: UserRole[]): Promise<AdminAuth | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", user.id)
    .single() as unknown as { data: { school_id: string; role: UserRole } | null }

  if (!profile || !allowed.includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return { user, schoolId: profile.school_id, role: profile.role }
}

/** Admin-only routes — either a limited `admin` or the owner `super_admin`. */
export function requireAdmin(): Promise<AdminAuth | NextResponse> {
  return requireRole(["admin", "super_admin"])
}

/**
 * Owner-only routes (billing, school settings/branding, danger zone, managing
 * other admins). A limited `admin` gets a 403 here.
 */
export function requireSuperAdmin(): Promise<AdminAuth | NextResponse> {
  return requireRole(["super_admin"])
}

/** Teacher-only routes. */
export function requireTeacher(): Promise<AdminAuth | NextResponse> {
  return requireRole(["teacher"])
}
