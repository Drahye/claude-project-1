import Link from "next/link"
import { ArrowRight } from "lucide-react"

/**
 * Shared, framework-agnostic empty state.
 *
 * Intentionally has NO "use client" and uses no hooks — so it can be rendered
 * from both Server Components (which may pass an icon component) and Client
 * Components (which may pass onClick actions). All animation is pure CSS, so
 * there's no server→client function-prop boundary to cross.
 */

interface Action {
  label:   string
  href?:   string
  onClick?: () => void
}

interface Props {
  icon:         React.ElementType
  title:        string
  description?: string
  /** Accent colour (CSS var or literal). Drives icon, glow, and ring. */
  accent?:      string
  action?:      Action
  secondary?:   Action
  /** Tighter padding for inline cards/side panels. */
  compact?:     boolean
  /** Render inside a bordered surface card. Default true. */
  bordered?:    boolean
  className?:   string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  accent = "var(--c-indigo)",
  action,
  secondary,
  compact = false,
  bordered = true,
  className = "",
}: Props) {
  return (
    <div
      className={`es-root flex flex-col items-center text-center ${className}`}
      style={{
        padding:      compact ? "32px 24px" : "clamp(40px, 8vw, 72px) 24px",
        background:   bordered ? "var(--c-bg)" : "transparent",
        border:       bordered ? "1px solid var(--c-border)" : "none",
        borderRadius: bordered ? 20 : 0,
        position:     "relative",
        overflow:     "hidden",
      }}
    >
      {/* Soft ambient glow */}
      <div
        aria-hidden
        className="es-glow pointer-events-none absolute"
        style={{
          top:        compact ? -40 : -60,
          left:       "50%",
          width:      260,
          height:     260,
          transform:  "translateX(-50%)",
          background: `radial-gradient(circle, ${accent}22 0%, transparent 68%)`,
        }}
      />

      {/* Animated icon with pulse rings */}
      <div className="es-item relative" style={{ animationDelay: "0ms" }}>
        <span
          aria-hidden
          className="absolute rounded-2xl"
          style={{
            inset: 0,
            border: `1px solid ${accent}`,
            animation: "es-ring 4.5s cubic-bezier(0.23,1,0.32,1) infinite",
          }}
        />
        <div
          className="relative flex items-center justify-center"
          style={{
            width:        compact ? 52 : 64,
            height:       compact ? 52 : 64,
            borderRadius: compact ? 16 : 20,
            background:   `color-mix(in srgb, ${accent} 12%, var(--c-bg))`,
            animation:    "es-float 4s ease-in-out infinite",
          }}
        >
          <Icon size={compact ? 22 : 26} style={{ color: accent }} strokeWidth={1.75} />
        </div>
      </div>

      {/* Title */}
      <p
        className="es-item font-bold mt-5"
        style={{ animationDelay: "90ms", color: "var(--c-text)", fontSize: compact ? "0.9375rem" : "1.0625rem", letterSpacing: "-0.01em" }}
      >
        {title}
      </p>

      {/* Description */}
      {description && (
        <p
          className="es-item mt-1.5 leading-relaxed"
          style={{ animationDelay: "170ms", color: "var(--c-text-muted)", fontSize: compact ? "0.8125rem" : "0.875rem", maxWidth: 340 }}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondary) && (
        <div className="es-item flex flex-wrap items-center justify-center gap-2.5 mt-6" style={{ animationDelay: "250ms" }}>
          {action && <ActionButton action={action} primary accent={accent} />}
          {secondary && <ActionButton action={secondary} primary={false} accent={accent} />}
        </div>
      )}

      <style>{`
        .es-item {
          opacity: 0;
          animation-name: es-in;
          animation-duration: 520ms;
          animation-timing-function: cubic-bezier(0.23,1,0.32,1);
          animation-fill-mode: both;
        }
        .es-glow { opacity: 0; animation: es-fade 800ms ease-out 60ms both; }
        @keyframes es-in   { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes es-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes es-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes es-ring  { 0% { transform: scale(1); opacity: 0.18; } 65% { transform: scale(1.28); opacity: 0; } 100% { transform: scale(1.28); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .es-item, .es-glow { animation: none; opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function ActionButton({ action, primary, accent }: { action: Action; primary: boolean; accent: string }) {
  const cls = "inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-95"
  const style: React.CSSProperties = primary
    ? { background: accent, color: "white" }
    : { background: "var(--c-surface)", color: "var(--c-text-mid)", border: "1px solid var(--c-border)" }

  const inner = <>{action.label}{primary && <ArrowRight size={14} />}</>

  if (action.href) {
    return <Link href={action.href} className={cls} style={{ ...style, textDecoration: "none" }}>{inner}</Link>
  }
  return <button type="button" onClick={action.onClick} className={cls} style={style}>{inner}</button>
}
