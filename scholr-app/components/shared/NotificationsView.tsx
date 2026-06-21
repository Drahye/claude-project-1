"use client"
import { useState } from "react"
import {
  XCircle, BookOpen, MessageSquare, TrendingUp,
  AlertTriangle, Calendar, Bell, CheckCheck,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import EmptyState from "@/components/shared/EmptyState"

interface Notification {
  id: string
  type: string
  title: string
  body: string
  created_at: string
  is_read: boolean
  action_url: string | null
}

interface Props {
  notifications: Notification[]
  userId: string
}

const ICON_MAP: Record<string, React.ReactNode> = {
  absence:      <XCircle size={14} />,
  homework:     <BookOpen size={14} />,
  message:      <MessageSquare size={14} />,
  report:       <TrendingUp size={14} />,
  fee:          <AlertTriangle size={14} />,
  announcement: <Calendar size={14} />,
}

const COLOR_MAP: Record<string, string> = {
  absence:      "var(--c-red)",
  homework:     "var(--c-indigo)",
  message:      "var(--c-indigo)",
  report:       "var(--c-emerald)",
  fee:          "var(--c-gold)",
  announcement: "var(--c-text-muted)",
}

const BG_MAP: Record<string, string> = {
  absence:      "var(--c-red-bg)",
  homework:     "var(--c-indigo-bg)",
  message:      "var(--c-indigo-bg)",
  report:       "var(--c-emerald-bg)",
  fee:          "var(--c-gold-bg)",
  announcement: "var(--c-surface)",
}

export default function NotificationsView({ notifications: initial, userId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(initial)
  const [markingAll, setMarkingAll]       = useState(false)

  const unread = notifications.filter(n => !n.is_read)

  async function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await (createClient().from("notifications") as any).update({ is_read: true }).eq("id", id)
  }

  async function markAllRead() {
    setMarkingAll(true)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await (createClient().from("notifications") as any)
      .update({ is_read: true })
      .eq("recipient_id", userId)
      .eq("is_read", false)
    setMarkingAll(false)
  }

  return (
    <div className="space-y-4">
      {/* Header actions */}
      {unread.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="badge badge-indigo">{unread.length} unread</span>
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: "var(--c-indigo)" }}
          >
            <CheckCheck size={13} />
            Mark all as read
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All clear"
          description="No alerts right now. We'll notify you here when something needs your attention."
          accent="var(--c-emerald)"
        />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const color = COLOR_MAP[n.type] ?? "var(--c-text-muted)"
            const bg    = BG_MAP[n.type] ?? "var(--c-surface)"
            const icon  = ICON_MAP[n.type] ?? <Bell size={14} />

            return (
              <div
                key={n.id}
                className="card px-4 py-4 flex gap-3 cursor-pointer transition-opacity"
                style={{ opacity: n.is_read ? 0.6 : 1 }}
                onClick={() => !n.is_read && markRead(n.id)}
              >
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: bg, color }}
                >
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-tight" style={{ color: "var(--c-text)" }}>{n.title}</p>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: "var(--c-indigo)" }} />
                    )}
                  </div>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--c-text-muted)" }}>{n.body}</p>
                  <p className="text-xs mt-1.5 font-medium" style={{ color: "var(--c-text-muted)" }}>
                    {formatDate(n.created_at, "time")}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
