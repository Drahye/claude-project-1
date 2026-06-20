"use client"
import { useEffect } from "react"

/** Fires a page-view (once per browser session) + login-click events for the
 *  public /[slug] page. Best-effort; never blocks interaction. */
export default function PublicPageBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const send = (event: string) => {
      const payload = JSON.stringify({ slug, event })
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }))
          return
        }
      } catch { /* fall through */ }
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {})
    }

    const key = `scholr_viewed_${slug}`
    try {
      if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, "1"); send("view") }
    } catch { send("view") }

    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest?.("[data-scholr-cta='login']")
      if (el) send("login_click")
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [slug])

  return null
}
