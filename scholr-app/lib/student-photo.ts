import { createClient as createAdminClient } from "@supabase/supabase-js"

export const STUDENT_PHOTO_BUCKET = "student-photos"

/**
 * Resolve a stored student photo reference to a displayable URL.
 * New uploads store a storage PATH in a PRIVATE bucket → we mint a short-lived
 * signed URL (1h). Legacy values that are already full URLs pass through.
 * Server-only (uses the service role).
 */
export async function signStudentPhoto(ref: string | null | undefined): Promise<string | null> {
  if (!ref) return null
  if (/^https?:\/\//.test(ref)) return ref // legacy public URL
  try {
    const svc = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data } = await svc.storage.from(STUDENT_PHOTO_BUCKET).createSignedUrl(ref, 3600)
    return data?.signedUrl ?? null
  } catch {
    return null
  }
}
