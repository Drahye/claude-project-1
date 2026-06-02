"use client"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "./ThemeProvider"

interface Props {
  className?: string
  size?:      "sm" | "md"
  /** Show "Dark mode" / "Light mode" label — use for sidebar footer buttons */
  labeled?:   boolean
}

export default function ThemeToggle({ className = "", size = "md", labeled = false }: Props) {
  const { theme, toggle } = useTheme()
  const isDark = theme === "dark"
  const dim    = size === "sm" ? 14 : 16

  /* ── Labeled (full-width sidebar button) ─────────────────────────── */
  if (labeled) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={`group flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${className}`}
        style={{
          background: "var(--c-surface)",
          border:     "1px solid var(--c-border)",
          color:      "var(--c-text-mid)",
        }}
      >
        <span className="relative w-4 h-4 flex items-center justify-center shrink-0">
          <Moon size={14} className="absolute transition-all duration-300"
            style={{
              opacity:   isDark ? 0 : 1,
              transform: isDark ? "rotate(90deg) scale(0.5)" : "rotate(0) scale(1)",
            }}
          />
          <Sun size={14} className="absolute transition-all duration-300"
            style={{
              opacity:   isDark ? 1 : 0,
              transform: isDark ? "rotate(0) scale(1)" : "rotate(-90deg) scale(0.5)",
            }}
          />
        </span>
        {isDark ? "Light mode" : "Dark mode"}
      </button>
    )
  }

  /* ── Icon-only button ────────────────────────────────────────────── */
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative flex items-center justify-center rounded-xl transition-all duration-200 hover:opacity-80 active:scale-95 ${className}`}
      style={{
        width:      size === "sm" ? 32 : 36,
        height:     size === "sm" ? 32 : 36,
        background: "var(--c-surface)",
        border:     "1px solid var(--c-border)",
        color:      "var(--c-text-muted)",
        flexShrink: 0,
      }}
    >
      <span className="absolute transition-all duration-300"
        style={{
          opacity:   isDark ? 0 : 1,
          transform: isDark ? "scale(0.5) rotate(90deg)" : "scale(1) rotate(0deg)",
        }}>
        <Moon size={dim} />
      </span>
      <span className="absolute transition-all duration-300"
        style={{
          opacity:   isDark ? 1 : 0,
          transform: isDark ? "scale(1) rotate(0deg)" : "scale(0.5) rotate(-90deg)",
        }}>
        <Sun size={dim} />
      </span>
    </button>
  )
}
