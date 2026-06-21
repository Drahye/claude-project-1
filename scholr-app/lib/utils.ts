import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, format: "short" | "long" | "time" = "short") {
  const d = typeof date === "string" ? new Date(date) : date
  if (format === "time") return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  if (format === "long")  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
}

export function pluralise(count: number, singular: string, plural = singular + "s") {
  return `${count} ${count === 1 ? singular : plural}`
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount / 100)
}

export const ATTENDANCE_COLORS: Record<string, string> = {
  present: "oklch(52% 0.17 162)",
  absent:  "oklch(47% 0.22 27)",
  late:    "oklch(62% 0.15 65)",
  excused: "oklch(52% 0.18 235)",
}

export const AVATAR_COLORS = [
  "oklch(46% 0.22 264)",
  "oklch(52% 0.17 162)",
  "oklch(47% 0.22 27)",
  "oklch(62% 0.15 65)",
  "oklch(52% 0.18 235)",
]

export function avatarColor(name: string) {
  let hash = 0
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}
