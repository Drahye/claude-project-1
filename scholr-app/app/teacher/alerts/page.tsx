import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import NotificationsView from "@/components/shared/NotificationsView"

export const metadata: Metadata = { title: "Alerts" }

export default async function TeacherAlertsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, created_at, is_read, action_url")
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50) as unknown as {
      data: Array<{ id: string; type: string; title: string; body: string; created_at: string; is_read: boolean; action_url: string | null }> | null
    }

  const notifications = data ?? []
  const unreadCount   = notifications.filter(n => !n.is_read).length

  return (
    <div className="p-6 pb-24 md:pb-6 max-w-2xl mx-auto">
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Alerts
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </p>
      </div>
      <NotificationsView notifications={notifications} userId={user.id} />
    </div>
  )
}
