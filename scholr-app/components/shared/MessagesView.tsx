"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Send, Plus, Loader2, MessageSquare, ArrowLeft } from "lucide-react"
import { formatDate, getInitials, avatarColor } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import EmptyState from "@/components/shared/EmptyState"

interface Thread {
  id: string
  subject: string
  type: string
  participant_ids: string[]
  school_id: string
  created_at: string
  last_message_at: string
}

interface Message {
  id: string
  thread_id: string
  sender_id: string
  body: string
  sent_at: string
  is_read_by: string[]
}

interface Profile {
  id: string
  full_name: string
  role: string
}

interface Props {
  threads: Thread[]
  latestMessages: Message[]
  participantProfiles: Profile[]
  contacts: Profile[]          // people this user can message
  contactMeta?: Record<string, string>  // contact id → tag (e.g. "Parent of Ada")
  currentUser: Profile & { school_id: string }
  schoolId: string
}

export default function MessagesView({
  threads: initialThreads,
  latestMessages: initialLatest,
  participantProfiles: initialProfiles,
  contacts,
  contactMeta = {},
  currentUser,
  schoolId,
}: Props) {
  const [threads, setThreads]           = useState<Thread[]>(initialThreads)
  const [latestMsgs, setLatestMsgs]     = useState<Message[]>(initialLatest)
  const [profiles, setProfiles]         = useState<Map<string, Profile>>(() => {
    const m = new Map<string, Profile>()
    for (const p of initialProfiles) m.set(p.id, p)
    m.set(currentUser.id, currentUser)
    return m
  })

  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [messages, setMessages]         = useState<Message[]>([])
  const [loadingThread, setLoadingThread] = useState(false)
  const [body, setBody]                 = useState("")
  const [sending, setSending]           = useState(false)

  const [showCompose, setShowCompose]   = useState(false)
  const [composeTo, setComposeTo]       = useState(contacts[0]?.id ?? "")
  const [composeSubject, setComposeSubject] = useState("")
  const [composeBody, setComposeBody]   = useState("")
  const [composing, setComposing]       = useState(false)

  const [sendError, setSendError]       = useState<string | null>(null)
  const [composeError, setComposeError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase  = createClient()
  const router    = useRouter()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Real-time subscription for active thread
  useEffect(() => {
    if (!activeThread) return

    const channel = supabase
      .channel(`thread:${activeThread.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `thread_id=eq.${activeThread.id}`,
      }, (payload) => {
        const msg = payload.new as Message
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        // Update latest message list
        setLatestMsgs(prev => {
          const filtered = prev.filter(m => m.thread_id !== msg.thread_id)
          return [msg, ...filtered]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeThread?.id])

  async function openThread(thread: Thread) {
    setActiveThread(thread)
    setLoadingThread(true)
    setMessages([])

    const { data } = await supabase
      .from("messages")
      .select("id, thread_id, sender_id, body, sent_at, is_read_by")
      .eq("thread_id", thread.id)
      .order("sent_at", { ascending: true }) as unknown as { data: Message[] | null }

    setMessages(data ?? [])
    setLoadingThread(false)

    // Mark messages as read
    const unreadIds = (data ?? [])
      .filter(m => !m.is_read_by.includes(currentUser.id))
      .map(m => m.id)

    // Mark all unread messages in the thread as read for the current user
    if (unreadIds.length > 0) {
      // Optimistic local update
      setMessages(prev => prev.map(m =>
        unreadIds.includes(m.id)
          ? { ...m, is_read_by: [...m.is_read_by, currentUser.id] }
          : m
      ))
      // Mark read in the DB, then refresh so the sidebar unread badge updates
      await (supabase as any).rpc("mark_messages_read", {
        p_thread_id: thread.id,
        p_user_id:   currentUser.id,
      })
      router.refresh()
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || !activeThread || sending) return

    setSending(true)
    setSendError(null)
    const text = body.trim()
    setBody("")

    const { data: msg, error } = await (supabase.from("messages") as any)
      .insert({
        thread_id:  activeThread.id,
        school_id:  schoolId,
        sender_id:  currentUser.id,
        body:       text,
        is_read_by: [currentUser.id],
        file_urls:  [],
      })
      .select()
      .single() as { data: Message | null; error: { message: string } | null }

    setSending(false)

    if (error || !msg) {
      // Restore the text so the user doesn't lose it, surface the reason
      setBody(text)
      setSendError(error?.message ?? "Couldn't send. Please try again.")
      return
    }

    setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg])
    setLatestMsgs(prev => [msg, ...prev.filter(m => m.thread_id !== msg.thread_id)])
    // Update thread's last_message_at (best-effort)
    await (supabase.from("message_threads") as any)
      .update({ last_message_at: msg.sent_at })
      .eq("id", activeThread.id)
    notifyMessage(activeThread.id)
  }

  async function createThread(e: React.FormEvent) {
    e.preventDefault()
    if (!composeTo || !composeSubject.trim() || !composeBody.trim()) return

    setComposing(true)
    setComposeError(null)

    const participantIds = [currentUser.id, composeTo]

    // Reuse an existing 1:1 thread with the same participants if one exists
    const existing = threads.find(t =>
      t.participant_ids.length === 2 &&
      participantIds.every(id => t.participant_ids.includes(id))
    )

    let thread = existing

    if (!thread) {
      const { data: newThread, error: threadErr } = await (supabase.from("message_threads") as any)
        .insert({
          school_id:       schoolId,
          subject:         composeSubject.trim(),
          type:            "direct",
          participant_ids: participantIds,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single() as { data: Thread | null; error: { message: string } | null }

      if (threadErr || !newThread) {
        setComposing(false)
        setComposeError(threadErr?.message ?? "Couldn't start the conversation.")
        return
      }

      thread = newThread
      setThreads(prev => [newThread, ...prev])
      const recipient = contacts.find(c => c.id === composeTo)
      if (recipient) setProfiles(prev => new Map(prev).set(recipient.id, recipient))
    }

    const { data: msg, error: msgErr } = await (supabase.from("messages") as any)
      .insert({
        thread_id:  thread.id,
        school_id:  schoolId,
        sender_id:  currentUser.id,
        body:       composeBody.trim(),
        is_read_by: [currentUser.id],
        file_urls:  [],
      })
      .select()
      .single() as { data: Message | null; error: { message: string } | null }

    setComposing(false)

    if (msgErr || !msg) {
      setComposeError(msgErr?.message ?? "Couldn't send the message.")
      return
    }

    setLatestMsgs(prev => [msg, ...prev.filter(m => m.thread_id !== thread!.id)])
    setShowCompose(false)
    setComposeSubject("")
    setComposeBody("")
    setComposeError(null)
    notifyMessage(thread.id)
    openThread(thread)
  }

  /** Fire-and-forget email notification to the other participant(s). */
  function notifyMessage(threadId: string) {
    void fetch("/api/notify/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ threadId }),
    }).catch(() => {})
  }

  function getOtherParticipant(thread: Thread) {
    const otherId = thread.participant_ids.find(id => id !== currentUser.id)
    return otherId ? profiles.get(otherId) : undefined
  }

  function getUnreadCount(thread: Thread) {
    const latest = latestMsgs.find(m => m.thread_id === thread.id)
    if (!latest) return 0
    return latest.sender_id !== currentUser.id && !latest.is_read_by.includes(currentUser.id) ? 1 : 0
  }

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--c-border)", minHeight: 560, background: "var(--c-bg)" }}>

      {/* Thread list */}
      <div className={`flex flex-col ${activeThread ? "hidden md:flex" : "flex"}`} style={{ borderRight: "1px solid var(--c-border)" }}>
        {/* List header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>Conversations</p>
          <button
            onClick={() => setShowCompose(v => !v)}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}
            title="New message"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Compose form */}
        {showCompose && (
          <form onSubmit={createThread} className="p-4 space-y-3" style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)" }}>
            <p className="text-xs font-bold" style={{ color: "var(--c-text)" }}>New message</p>
            {contacts.length === 0 ? (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "var(--c-gold-bg)", color: "var(--c-gold)" }}>
                No one to message yet. Teachers will appear here once they&apos;ve joined the school.
              </p>
            ) : (
              <select
                className="input h-9 text-xs w-full"
                value={composeTo}
                onChange={e => setComposeTo(e.target.value)}
                style={{ fontFamily: "inherit" }}
                required
              >
                <option value="">Select recipient…</option>
                {contacts.map(c => {
                  // A parent tag (e.g. "Parent of Ada") takes priority over the
                  // generic role label so teachers know which child each parent has.
                  const tag = contactMeta[c.id]
                    ?? (c.role === "teacher" ? "Teacher"
                      : (c.role === "admin" || c.role === "super_admin") ? "School admin"
                      : c.role === "parent" ? "Parent"
                      : null)
                  return (
                    <option key={c.id} value={c.id}>
                      {c.full_name}{tag ? ` · ${tag}` : ""}
                    </option>
                  )
                })}
              </select>
            )}
            <input
              type="text"
              className="input h-9 text-xs w-full"
              placeholder="Subject"
              value={composeSubject}
              onChange={e => setComposeSubject(e.target.value)}
              required
            />
            <textarea
              className="input text-xs w-full py-2 resize-none"
              rows={3}
              placeholder="Your message…"
              value={composeBody}
              onChange={e => setComposeBody(e.target.value)}
              required
            />
            {composeError && (
              <p className="text-xs" style={{ color: "var(--c-red)" }}>{composeError}</p>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={composing || contacts.length === 0} className="btn-primary h-8 px-4 text-xs gap-1.5 disabled:opacity-50">
                {composing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                Send
              </button>
              <button type="button" onClick={() => { setShowCompose(false); setComposeError(null) }} className="h-8 px-3 text-xs rounded-lg" style={{ color: "var(--c-text-muted)", background: "var(--c-surface)" }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Thread items */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No conversations yet"
              description="Start a new conversation with the + button above."
              compact
              bordered={false}
              action={{ label: "New message", onClick: () => setShowCompose(true) }}
            />
          ) : (
            threads.map(thread => {
              const other   = getOtherParticipant(thread)
              const latest  = latestMsgs.find(m => m.thread_id === thread.id)
              const unread  = getUnreadCount(thread)
              const isActive = activeThread?.id === thread.id

              return (
                <button
                  key={thread.id}
                  onClick={() => openThread(thread)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    background: isActive ? "var(--c-indigo-bg)" : "transparent",
                    borderBottom: "1px solid var(--c-border)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: avatarColor(other?.full_name ?? "?") }}
                  >
                    {getInitials(other?.full_name ?? "?")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold truncate" style={{ color: isActive ? "var(--c-indigo)" : "var(--c-text)" }}>
                        {other?.full_name ?? "Unknown"}
                      </p>
                      {latest && (
                        <p className="text-xs shrink-0 ml-1" style={{ color: "var(--c-text-muted)" }}>
                          {formatDate(latest.sent_at, "time")}
                        </p>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: "var(--c-text-muted)" }}>{thread.subject}</p>
                    {latest && (
                      <p className="text-xs truncate mt-0.5" style={{
                        color: unread > 0 ? "var(--c-text)" : "var(--c-text-muted)",
                        fontWeight: unread > 0 ? 600 : 400,
                      }}>
                        {latest.sender_id === currentUser.id ? "You: " : ""}{latest.body}
                      </p>
                    )}
                  </div>
                  {unread > 0 && (
                    <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: "var(--c-indigo)" }} />
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Message pane */}
      {activeThread ? (
        <div className="flex flex-col">
          {/* Pane header */}
          <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
            <button
              onClick={() => setActiveThread(null)}
              className="md:hidden"
              style={{ color: "var(--c-text-muted)" }}
            >
              <ArrowLeft size={18} />
            </button>
            {(() => {
              const other = getOtherParticipant(activeThread)
              return (
                <>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: avatarColor(other?.full_name ?? "?") }}
                  >
                    {getInitials(other?.full_name ?? "?")}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{other?.full_name ?? "Unknown"}</p>
                    <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{activeThread.subject}</p>
                  </div>
                </>
              )
            })()}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ minHeight: 0, maxHeight: 420 }}>
            {loadingThread ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin" style={{ color: "var(--c-text-muted)" }} />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--c-text-muted)" }}>No messages yet. Say hello!</p>
            ) : (
              messages.map(msg => {
                const isMe     = msg.sender_id === currentUser.id
                const sender   = profiles.get(msg.sender_id)
                return (
                  <div key={msg.id} className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
                    {!isMe && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-auto"
                        style={{ background: avatarColor(sender?.full_name ?? "?") }}
                      >
                        {getInitials(sender?.full_name ?? "?")}
                      </div>
                    )}
                    <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                      <div
                        className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                        style={{
                          background: isMe ? "var(--c-indigo)" : "var(--c-surface)",
                          color: isMe ? "#fff" : "var(--c-text)",
                          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        }}
                      >
                        {msg.body}
                      </div>
                      <p className="text-[10px] px-1" style={{ color: "var(--c-text-muted)" }}>
                        {formatDate(msg.sent_at, "time")}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          {sendError && (
            <p className="px-4 py-2 text-xs" style={{ color: "var(--c-red)", background: "var(--c-red-bg)" }}>
              {sendError}
            </p>
          )}

          {/* Compose bar */}
          <form onSubmit={sendMessage} className="flex gap-2 px-4 py-3" style={{ borderTop: "1px solid var(--c-border)" }}>
            <input
              type="text"
              className="input h-10 text-sm flex-1"
              placeholder="Type a message…"
              value={body}
              onChange={e => { setBody(e.target.value); setSendError(null) }}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!body.trim() || sending}
              className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-opacity"
              style={{ background: "var(--c-indigo)" }}
            >
              {sending
                ? <Loader2 size={15} className="animate-spin text-white" />
                : <Send size={15} className="text-white" />
              }
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-col items-center justify-center" style={{ color: "var(--c-text-muted)" }}>
          <MessageSquare size={36} className="mb-3" style={{ opacity: 0.25 }} />
          <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Select a conversation</p>
          <p className="text-xs mt-1">or start a new one with the + button</p>
        </div>
      )}
    </div>
  )
}
