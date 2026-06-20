import { redirect } from "next/navigation"

// Gallery now lives inside the School page hub (Admin → School page → Gallery).
export default function GalleryPage() {
  redirect("/admin/school?tab=gallery")
}
