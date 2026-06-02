import { NextRequest, NextResponse }        from "next/server"
import { createClient }                    from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

type UploadType = "logo" | "avatar" | "gallery"

const BUCKET_MAP: Record<UploadType, string> = {
  logo:    "school-assets",
  avatar:  "avatars",
  gallery: "school-assets",
}

const MAX_SIZE = 5 * 1024 * 1024   // 5 MB

function serviceClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

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

  // 3 — build storage path
  const ext    = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const bucket = BUCKET_MAP[type]
  let   path: string
  if      (type === "logo")    path = `logos/${profile.school_id}.${ext}`
  else if (type === "avatar")  path = `avatars/${user.id}.${ext}`
  else                         path = `gallery/${profile.school_id}/${Date.now()}.${ext}`

  // 4 — upload via service client
  const svc    = serviceClient()
  const bytes  = await file.arrayBuffer()
  const buffer = new Uint8Array(bytes)

  const { error: uploadErr } = await svc.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadErr) {
    const msg = uploadErr.message ?? ""
    if (msg.toLowerCase().includes("bucket")) {
      return NextResponse.json({
        error: `Storage bucket "${bucket}" not found. Create it in Supabase Dashboard → Storage with Public access.`,
      }, { status: 500 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // 5 — get public URL
  const { data: urlData } = svc.storage.from(bucket).getPublicUrl(path)
  const publicUrl = urlData.publicUrl

  // 6 — persist URL to DB
  if (type === "logo") {
    await (svc as any).from("schools").update({ logo_url: publicUrl }).eq("id", profile.school_id)
  } else if (type === "avatar") {
    await (svc as any).from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id)
  } else if (type === "gallery") {
    // Insert into gallery_images so it persists across devices
    await (svc as any).from("gallery_images").insert({
      school_id:    profile.school_id,
      storage_path: path,
      url:          publicUrl,
      name:         file.name,
      uploaded_by:  user.id,
    })
  }

  return NextResponse.json({ url: publicUrl, path })
}
