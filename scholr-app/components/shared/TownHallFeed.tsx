import { Megaphone } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Broadcast } from "@/types/database"

/** Read-only Town Hall feed shown to parents and teachers. */
export default function TownHallFeed({ broadcasts }: { broadcasts: Broadcast[] }) {
  if (broadcasts.length === 0) {
    return (
      <div className="card-float px-5 py-12 text-center">
        <Megaphone size={30} className="mx-auto mb-3" style={{ color: "var(--c-text-muted)", opacity: 0.4 }} />
        <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>No announcements yet</p>
        <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>School-wide announcements will appear here.</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {broadcasts.map(b => (
        <div key={b.id} className="card p-5">
          <div className="flex items-start gap-3 mb-2">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--c-indigo-bg)" }}>
              <Megaphone size={16} style={{ color: "var(--c-indigo)" }} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{b.title}</p>
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{formatDate(b.created_at, "short")}</p>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--c-text-mid)" }}>{b.body}</p>
        </div>
      ))}
    </div>
  )
}
