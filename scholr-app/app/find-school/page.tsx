"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { GraduationCap, ArrowRight, Search } from "lucide-react"

function toSlug(input: string): string {
  let v = input.trim()
  if (v.includes("/")) v = v.split("/").filter(Boolean).pop() ?? "" // accept a pasted URL
  return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export default function FindSchoolPage() {
  const router = useRouter()
  const [val, setVal] = useState("")

  function go(e: React.FormEvent) {
    e.preventDefault()
    const slug = toSlug(val)
    if (slug) router.push(`/${slug}`)
  }

  return (
    <main
      className="min-h-[100dvh] flex flex-col items-center justify-center px-5 text-center"
      style={{ background: "var(--c-navy)", color: "oklch(97% 0.005 264)", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <Link href="/" className="flex items-center gap-2.5 mb-10" style={{ textDecoration: "none", color: "inherit" }}>
        <span className="rounded-lg flex items-center justify-center" style={{ width: 30, height: 30, background: "var(--c-indigo)" }}>
          <GraduationCap size={15} className="text-white" />
        </span>
        <span className="font-extrabold" style={{ fontSize: "1.0625rem", letterSpacing: "-0.02em" }}>Scholr</span>
      </Link>

      <h1 className="font-extrabold" style={{ fontSize: "clamp(1.875rem, 5vw, 2.75rem)", letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: "0.75rem" }}>
        Find your school
      </h1>
      <p style={{ fontSize: "1rem", color: "oklch(64% 0.012 264)", lineHeight: 1.6, maxWidth: "42ch", marginBottom: "2rem" }}>
        Enter your school&apos;s name or the link your school shared to go to your portal.
      </p>

      <form onSubmit={go} className="w-full flex flex-col sm:flex-row gap-2.5" style={{ maxWidth: 480 }}>
        <div className="relative flex-1">
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "oklch(60% 0.01 264)" }} />
          <input
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder="e.g. Rehoboth Academy"
            autoFocus
            className="w-full h-12 rounded-xl text-sm outline-none"
            style={{ paddingLeft: 40, paddingRight: 14, background: "oklch(100% 0 0 / 0.06)", border: "1px solid oklch(100% 0 0 / 0.14)", color: "#fff" }}
          />
        </div>
        <button type="submit" className="h-12 px-6 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 text-white"
          style={{ background: "var(--c-indigo)" }}>
          Continue <ArrowRight size={15} />
        </button>
      </form>

      <p style={{ fontSize: "0.8125rem", color: "oklch(52% 0.01 264)", marginTop: "1.5rem", maxWidth: "40ch" }}>
        Don&apos;t have a link? Ask your school admin to send you an invite.
      </p>
    </main>
  )
}
