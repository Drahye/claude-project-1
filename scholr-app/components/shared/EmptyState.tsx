import Link from "next/link"
import { ArrowRight } from "lucide-react"

/**
 * Shared, premium empty state (Resend-inspired): an icon in a machined squircle
 * "tile" over a soft, slowly-breathing radial glow, with a staggered entrance.
 *
 * No "use client" and no hooks — works in both Server and Client Components.
 * All motion is pure CSS (GPU transform/opacity), theme-aware via color-mix,
 * and disabled under prefers-reduced-motion.
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
  /** Accent colour (CSS var or literal). Drives the icon, tile, and glow. */
  accent?:      string
  action?:      Action
  secondary?:   Action
  /** Tighter padding for inline cards / side panels. */
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
  const tile = compact ? 56 : 68

  return (
    <div
      className={`es-root flex flex-col items-center text-center ${className}`}
      style={{
        padding:      compact ? "36px 24px" : "clamp(48px, 9vw, 84px) 24px",
        background:   bordered ? "var(--c-bg)" : "transparent",
        border:       bordered ? "1px solid var(--c-border)" : "none",
        borderRadius: bordered ? 20 : 0,
        position:     "relative",
        overflow:     "hidden",
      }}
    >
      {/* Soft breathing radial glow */}
      <div
        aria-hidden
        className="es-glow pointer-events-none absolute"
        style={{
          top:        compact ? -70 : -90,
          left:       "50%",
          width:      compact ? 300 : 380,
          height:     compact ? 300 : 380,
          background: `radial-gradient(circle at center, color-mix(in srgb, ${accent} 24%, transparent) 0%, color-mix(in srgb, ${accent} 8%, transparent) 38%, transparent 68%)`,
        }}
      />

      {/* Machined icon tile */}
      <div className="es-tile-wrap relative">
        <div
          className="es-tile flex items-center justify-center"
          style={{
            width:        tile,
            height:       tile,
            borderRadius: compact ? 17 : 21,
            background:   `linear-gradient(150deg, color-mix(in srgb, ${accent} 17%, var(--c-bg)) 0%, color-mix(in srgb, ${accent} 7%, var(--c-bg)) 100%)`,
            border:       `1px solid color-mix(in srgb, ${accent} 24%, transparent)`,
            boxShadow:    `inset 0 1px 0 color-mix(in srgb, white 22%, transparent), 0 10px 28px color-mix(in srgb, ${accent} 20%, transparent)`,
          }}
        >
          <Icon size={compact ? 23 : 27} style={{ color: accent }} strokeWidth={1.75} />
        </div>
      </div>

      {/* Title */}
      <p
        className="es-anim font-bold mt-5"
        style={{ "--d": "120ms", color: "var(--c-text)", fontSize: compact ? "0.9375rem" : "1.0625rem", letterSpacing: "-0.015em" } as React.CSSProperties}
      >
        {title}
      </p>

      {/* Description */}
      {description && (
        <p
          className="es-anim mt-1.5 leading-relaxed"
          style={{ "--d": "200ms", color: "var(--c-text-muted)", fontSize: compact ? "0.8125rem" : "0.875rem", maxWidth: 360 } as React.CSSProperties}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondary) && (
        <div className="es-anim flex flex-wrap items-center justify-center gap-2.5 mt-6" style={{ "--d": "290ms" } as React.CSSProperties}>
          {action && <ActionButton action={action} primary accent={accent} />}
          {secondary && <ActionButton action={secondary} primary={false} accent={accent} />}
        </div>
      )}

      <style>{`
        /* Entrance — staggered, scale-from-0.92 (never 0), strong ease-out */
        .es-tile-wrap { animation: es-pop 560ms cubic-bezier(0.23,1,0.32,1) both; }
        .es-anim {
          opacity: 0;
          animation: es-in 560ms cubic-bezier(0.23,1,0.32,1) var(--d, 0ms) both;
        }
        .es-glow { animation: es-glow-in 800ms ease-out both, es-breathe 5.5s ease-in-out 800ms infinite; }
        /* Tile floats gently inside its entrance wrapper (separate element to avoid transform conflict) */
        .es-tile { animation: es-float 5s ease-in-out infinite; }

        @keyframes es-pop     { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes es-in      { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes es-float   { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes es-glow-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes es-breathe {
          0%,100% { transform: translateX(-50%) scale(1);    opacity: 0.7; }
          50%     { transform: translateX(-50%) scale(1.09); opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .es-tile, .es-glow { animation: none; }
          .es-glow { opacity: 0.85; transform: translateX(-50%); }
          .es-tile-wrap, .es-anim { animation: es-fade 280ms ease both; opacity: 1; transform: none; }
          @keyframes es-fade { from { opacity: 0; } to { opacity: 1; } }
        }
      `}</style>
    </div>
  )
}

function ActionButton({ action, primary, accent }: { action: Action; primary: boolean; accent: string }) {
  const cls = "inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
  const style: React.CSSProperties = primary
    ? { background: accent, color: "white" }
    : { background: "var(--c-surface)", color: "var(--c-text-mid)", border: "1px solid var(--c-border)" }

  const inner = <>{action.label}{primary && <ArrowRight size={14} />}</>

  if (action.href) {
    return <Link href={action.href} className={cls} style={{ ...style, textDecoration: "none" }}>{inner}</Link>
  }
  return <button type="button" onClick={action.onClick} className={cls} style={style}>{inner}</button>
}
