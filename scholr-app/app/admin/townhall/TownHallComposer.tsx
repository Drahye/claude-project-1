"use client"
import { useState } from "react"
import { Loader2, Megaphone, Send, CheckCircle2 } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Broadcast } from "@/types/database"

export default function TownHallComposer({ initialBroadcasts }: { initialBroadcasts: Broadcast[] }) {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(initialBroadcasts)
  const [title, setTitle] = useState("")
  const [body, setBody]   = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) { setError("Add a title and a message."); return }
    setSending(true); setError(null); setNotice(null)
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Couldn't send broadcast."); return }
      setBroadcasts(prev => [data.broadcast, ...prev])
      setTitle(""); setBody("")
      setNotice(`Sent to ${data.notified} ${data.notified === 1 ? "person" : "people"}${data.emailed ? ` · ${data.emailed} emailed` : ""}.`)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={send} className="card p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
            Title <span style={{ color: "var(--c-red)" }}>*</span>
          </label>
          <input className="input h-10 text-sm w-full" placeholder="e.g. Mid-term break dates" value={title}
            onChange={e => { setTitle(e.target.value); setError(null) }} maxLength={160} required />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--c-text-muted)" }}>
            Message <span style={{ color: "var(--c-red)" }}>*</span>
          </label>
          <textarea className="input text-sm w-full py-2.5 resize-none" rows={6} placeholder="Write your announcement…"
            value={body} onChange={e => { setBody(e.target.value); setError(null) }} maxLength={5000} required />
        </div>
        {error && <p className="text-sm" style={{ color: "var(--c-red)" }}>{error}</p>}
        {notice && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={15} style={{ color: "var(--c-emerald)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--c-emerald)" }}>{notice}</span>
          </div>
        )}
        <button type="submit" disabled={sending} className="btn-primary h-10 px-5 gap-2 disabled:opacity-50">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {sending ? "Sending…" : "Send to everyone"}
        </button>
      </form>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3 px-1" style={{ color: "var(--c-text-muted)" }}>Sent broadcasts</h2>
        {broadcasts.length === 0 ? (
          <div className="card-float px-5 py-10 text-center">
            <Megaphone size={28} className="mx-auto mb-2" style={{ color: "var(--c-text-muted)", opacity: 0.4 }} />
            <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>No broadcasts yet. Your first announcement will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {broadcasts.map(b => (
              <div key={b.id} className="card p-5">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{b.title}</p>
                  <span className="text-xs shrink-0" style={{ color: "var(--c-text-muted)" }}>{formatDate(b.created_at, "short")}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--c-text-mid)" }}>{b.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
