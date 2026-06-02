import Link from "next/link"
import { GraduationCap, ArrowLeft } from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"
import AuthSlider from "@/components/auth/AuthSlider"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex h-screen overflow-hidden" style={{ background: "var(--c-surface)" }}>
      {/* Left panel — feature slider */}
      <AuthSlider />

      {/* Right panel — 60% on desktop, full-width on mobile */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto" style={{ flex: "1 1 60%" }}>
        {/* Top bar with back link */}
        <div className="flex items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "var(--c-text-muted)", textDecoration: "none" }}
          >
            <ArrowLeft size={15} />
            Back to home
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 lg:hidden" style={{ textDecoration: "none" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--c-indigo)" }}>
              <GraduationCap size={13} className="text-white" />
            </div>
            <span className="font-extrabold tracking-tight text-sm" style={{ color: "var(--c-text)" }}>Scholr</span>
          </Link>
          </div>
        </div>

        {/* Form centred in the remaining space */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  )
}
