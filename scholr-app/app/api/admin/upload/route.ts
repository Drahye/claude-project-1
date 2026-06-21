import { NextRequest, NextResponse }        from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

type UploadType = "logo" | "avatar" | "gallery" | "student"

const BUCKET_MAP: Record<UploadType, string> = {
  logo:    "school-assets",
  avatar:  "avatars",
  gallery: "school-assets",
  student: "student-photos",   // PRIVATE bucket — served via signed URLs only
}

const MAX_SIZE = 5 * 1024 * 1024   // 5 MB

export async function POST(req: NextRequest) {
  // 1 — auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id, role")
    .eq("id", user.id)
    .single() as unknown as { data: { school_id: string; role: string } | null }

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 403 })

  const isAdmin = profile.role === "admin" || profile.role === "super_admin"

  // 2 — parse form
  const form = await req.formData()
  const file = form.get("file") as File | null
  const type = (form.get("type") as UploadType | null) ?? "avatar"

  if (!file)                          return NextResponse.json({ error: "No file provided" }, { status: 400 })
  if (file.size > MAX_SIZE)           return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 })
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only images are allowed" }, { status: 400 })
  if ((type === "logo" || type === "gallery") && !isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const studentId = (form.get("studentId") as string | null) ?? ""
  if (type === "student") {
    if (!studentId) return NextResponse.json({ error: "Missing studentId" }, { status: 400 })
    // Admins may set any student's photo; a parent may set only their own child's.
    if (!isAdmin) {
      const svcCheck = await createServiceClient()
      const { data: link } = await svcCheck
        .from("parent_students").select("student_id")
        .eq("parent_id", user.id).eq("student_id", studentId).maybeSingle()
      if (!link) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  // 3 — build storage path
  // Sanitize the extension from the (untrusted) client filename to alphanumerics
  // so it can't inject "/" or ".." into the storage key. Fall back to jpg.
  const rawExt = file.name.split(".").pop()?.toLowerCase() ?? ""
  const ext    = /^[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : "jpg"
  const bucket = BUCKET_MAP[type]
  let   path: string
  if      (type === "logo")    path = `logos/${profile.school_id}.${ext}`
  else if (type === "avatar")  path = `avatars/${user.id}.${ext}`
  else if (type === "student") path = `students/${studentId}.${ext}`
  else                         path = `gallery/${profile.school_id}/${Date.now()}.${ext}`

  // 4 — upload via service client
  const svc    = await createServiceClient()
  const bytes  = await file.arrayBuffer()
  const buffer = new Uint8Array(bytes)

  const { error: uploadErr } = await svc.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadErr) {
    const msg = uploadErr.message ?? ""
    if (msg.toLowerCase().includes("bucket")) {
      const access = type === "student" ? "PRIVATE (public access OFF)" : "Public access"
      return NextResponse.json({
        error: `Storage bucket "${bucket}" not found. Create it in Supabase Dashboard → Storage with ${access}.`,
      }, { status: 500 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // 5 — private student photos are referenced by PATH (signed on read); others
  // are public buckets, so a public URL is fine.
  if (type === "student") {
    return NextResponse.json({ url: path, path })   // caller stores the path
  }
  const { data: urlData } = svc.storage.from(bucket).getPublicUrl(path)
  const publicUrl = urlData.publicUrl

  // 6 — persist URL to DB
  if (type === "logo") {
    await svc.from("schools").update({ logo_url: publicUrl }).eq("id", profile.school_id)
  } else if (type === "avatar") {
    await svc.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id)
  } else if (type === "gallery") {
    // Insert into gallery_images so it persists across devices
    await svc.from("gallery_images").insert({
      school_id:    profile.school_id,
      storage_path: path,
      url:          publicUrl,
      name:         file.name,
      uploaded_by:  user.id,
    })
  }

  return NextResponse.json({ url: publicUrl, path })
}
