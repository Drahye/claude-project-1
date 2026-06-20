import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export interface AdminAuth {
  /** The authenticated admin/super_admin user. */
  user: User
  /** The school the admin belongs to. All writes must be scoped to this id. */
  schoolId: string
}

/**
 * Guard for admin-only API routes.
 *
 * Returns the authenticated admin's user + school_id, OR a ready-to-return
 * error Response (401 if not signed in, 403 if not an admin). Callers branch on
 * `instanceof NextResponse` so there's exactly one return shape across every
 * route:
 *
 *   const auth = await requireAdmin()
 *   if (auth instanceof NextResponse) return auth
 *   // ...use auth.user / auth.schoolId
 *
 * school_id always comes from the session here — never from the request body —
 * so an admin can only ever act on their own school.
 */
export async function requireAdmin(): Promise<AdminAuth | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", user.id)
    .single() as unknown as { data: { school_id: string; role: string } | null }

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return { user, schoolId: profile.school_id }
}
