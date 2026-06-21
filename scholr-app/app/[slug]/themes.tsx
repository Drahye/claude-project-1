import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Mail, Phone } from "lucide-react"
import { getInitials } from "@/lib/utils"
import type { ContentBlock } from "@/types/database"

export interface ThemeProps {
  slug: string
  schoolName: string
  accent: string
  logoUrl: string | null
  heroImageUrl: string | null
  headline: string
  subtext: string
  contactEmail: string | null
  contactPhone: string | null
  /** Absolute when served on a tenant subdomain so auth runs on the canonical app. */
  loginUrl: string
  contentBlocks: ContentBlock[]
  hideBranding: boolean
}

export const THEME_IDS = ["aurora", "editorial", "campus"] as const
export type ThemeId = (typeof THEME_IDS)[number]

export function SchoolPageTheme({ theme, ...props }: ThemeProps & { theme: string }) {
  if (theme === "editorial") return <EditorialTheme {...props} />
  if (theme === "campus") return <CampusTheme {...props} />
  return <AuroraTheme {...props} />
}

/* Shared bits */
function Logo({ logoUrl, schoolName, size = 38, ring }: { logoUrl: string | null; schoolName: string; size?: number; ring?: string }) {
  if (logoUrl) {
    return (
      <span className="relative rounded-xl overflow-hidden shrink-0" style={{ width: size, height: size, border: ring ? `1px solid ${ring}` : undefined }}>
        <Image src={logoUrl} alt={schoolName} fill sizes={`${size}px`} style={{ objectFit: "cover" }} />
      </span>
    )
  }
  return (
    <span className="rounded-xl flex items-center justify-center text-white font-bold shrink-0" style={{ width: size, height: size, background: ring ?? "var(--c-indigo)", fontSize: size * 0.4 }}>
      {getInitials(schoolName)}
    </span>
  )
}

function Contact({ email, phone, color }: { email: string | null; phone: string | null; color: string }) {
  if (!email && !phone) return null
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2" style={{ fontSize: "0.8125rem", color }}>
      {email && <a href={`mailto:${email}`} className="flex items-center gap-2" style={{ color: "inherit", textDecoration: "none" }}><Mail size={14} /> {email}</a>}
      {phone && <a href={`tel:${phone}`} className="flex items-center gap-2" style={{ color: "inherit", textDecoration: "none" }}><Phone size={14} /> {phone}</a>}
    </div>
  )
}

/** Custom school-authored sections (paid feature). Themed dark/light. */
function Sections({ blocks, dark, accent }: { blocks: ContentBlock[]; dark: boolean; accent: string }) {
  if (!blocks?.length) return null
  return (
    <section className="relative px-6 py-14" style={{ zIndex: 2, background: dark ? "transparent" : "#f7f8fa" }}>
      <div className={`mx-auto grid gap-4 ${blocks.length > 1 ? "sm:grid-cols-2" : ""}`} style={{ maxWidth: blocks.length > 1 ? "48rem" : "40rem" }}>
        {blocks.map(b => (
          <div key={b.id} className="rounded-2xl p-6" style={{
            background: dark ? "rgba(255,255,255,0.06)" : "#fff",
            border: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #ebedf1",
            boxShadow: dark ? "none" : "0 8px 24px rgba(20,23,40,0.05)",
            backdropFilter: dark ? "blur(8px)" : undefined,
          }}>
            <span className="block rounded-full mb-3" style={{ width: 28, height: 3, background: accent }} />
            {b.title && <p className="font-bold mb-1.5" style={{ fontSize: "1.0625rem", color: dark ? "#fff" : "#1b1d24", letterSpacing: "-0.01em" }}>{b.title}</p>}
            {b.body && <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: dark ? "rgba(255,255,255,0.72)" : "#5a5f6e", whiteSpace: "pre-wrap" }}>{b.body}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── Theme 1: Aurora (dark, glassy, centered) ───────────────────────────────── */
function AuroraTheme({ loginUrl, schoolName, accent, logoUrl, heroImageUrl, headline, subtext, contactEmail, contactPhone, contentBlocks, hideBranding }: ThemeProps) {
  return (
    <main style={{
      minHeight: "100dvh", position: "relative", display: "flex", flexDirection: "column",
      color: "#fff", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", overflow: "hidden",
      background: heroImageUrl ? "#0b0a1a" : `linear-gradient(150deg, ${accent} 0%, color-mix(in srgb, ${accent} 55%, #0b0a1a) 60%, #0b0a1a 100%)`,
    }}>
      {heroImageUrl && (<>
        <Image src={heroImageUrl} alt="" fill priority sizes="100vw" style={{ objectFit: "cover", zIndex: 0 }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 1, background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 78%, transparent), rgba(10,9,22,0.85) 70%)` }} />
      </>)}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 1, background: "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />

      <header className="relative flex items-center justify-between px-6 py-5" style={{ zIndex: 2 }}>
        <div className="flex items-center gap-2.5">
          <Logo logoUrl={logoUrl} schoolName={schoolName} ring="rgba(255,255,255,0.22)" />
          <span className="font-bold" style={{ fontSize: "1.0625rem" }}>{schoolName}</span>
        </div>
        <Link href={loginUrl} data-scholr-cta="login" className="text-sm font-semibold rounded-full px-4 py-2" style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.22)", color: "#fff", textDecoration: "none" }}>Log in</Link>
      </header>

      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-16" style={{ zIndex: 2 }}>
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-7" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
          <span className="rounded-full" style={{ width: 6, height: 6, background: "#34D399" }} /> {schoolName} on Scholr
        </div>
        <h1 className="font-extrabold" style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)", lineHeight: 1.02, letterSpacing: "-0.035em", maxWidth: "16ch", marginBottom: "1.25rem" }}>{headline}</h1>
        <p style={{ fontSize: "clamp(1rem, 1.6vw, 1.1875rem)", color: "rgba(255,255,255,0.78)", lineHeight: 1.65, maxWidth: "52ch", marginBottom: "2.5rem" }}>{subtext}</p>
        <Link href={loginUrl} data-scholr-cta="login" className="inline-flex items-center gap-2 rounded-full font-bold" style={{ background: "#fff", color: accent, padding: "14px 26px", fontSize: "0.9375rem", textDecoration: "none", boxShadow: "0 14px 40px rgba(0,0,0,0.3)" }}>
          Log in to your portal <span className="inline-flex items-center justify-center rounded-full" style={{ width: 24, height: 24, background: `color-mix(in srgb, ${accent} 14%, transparent)` }}><ArrowRight size={14} /></span>
        </Link>
        <p style={{ marginTop: "1.5rem", fontSize: "0.8125rem", color: "rgba(255,255,255,0.6)", maxWidth: "44ch" }}>Teacher or parent? Use the invite link your school emailed you to set up your account.</p>
        <div className="mt-10"><Contact email={contactEmail} phone={contactPhone} color="rgba(255,255,255,0.7)" /></div>
      </section>

      <Sections blocks={contentBlocks} dark accent={accent} />

      {!hideBranding && (
        <footer className="relative text-center px-6 py-5" style={{ zIndex: 2, fontSize: "0.75rem", color: "rgba(255,255,255,0.55)" }}>
          Powered by <Link href="/" style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, textDecoration: "none" }}>Scholr</Link>
        </footer>
      )}
    </main>
  )
}

/* ── Theme 2: Editorial (light, type-forward, asymmetric split) ─────────────── */
function EditorialTheme({ loginUrl, schoolName, accent, logoUrl, heroImageUrl, headline, subtext, contactEmail, contactPhone, contentBlocks, hideBranding }: ThemeProps) {
  return (
   <div style={{ background: "#FBF9F4", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
    <main className="min-h-[100dvh] grid lg:grid-cols-[1.05fr_0.95fr]" style={{ background: "#FBF9F4", color: "#1a1a17", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Left — type */}
      <div className="flex flex-col px-7 sm:px-12 lg:px-16 py-9">
        <div className="flex items-center justify-between mb-auto">
          <div className="flex items-center gap-2.5">
            <Logo logoUrl={logoUrl} schoolName={schoolName} ring="#e6e1d6" />
            <span className="font-bold" style={{ fontSize: "1.0625rem", letterSpacing: "-0.01em" }}>{schoolName}</span>
          </div>
          <Link href={loginUrl} data-scholr-cta="login" className="text-sm font-semibold rounded-full px-4 py-2" style={{ border: "1.5px solid #d9d3c6", color: "#1a1a17", textDecoration: "none" }}>Log in</Link>
        </div>

        <div className="py-12 lg:py-0">
          <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: accent, marginBottom: "1.25rem" }}>Welcome</p>
          <h1 className="font-extrabold" style={{ fontSize: "clamp(2.5rem, 6.5vw, 5rem)", lineHeight: 0.98, letterSpacing: "-0.04em", marginBottom: "1.5rem", maxWidth: "14ch" }}>{headline}</h1>
          <p style={{ fontSize: "clamp(1rem, 1.5vw, 1.1875rem)", color: "#5c574c", lineHeight: 1.6, maxWidth: "46ch", marginBottom: "2.5rem" }}>{subtext}</p>
          <Link href={loginUrl} data-scholr-cta="login" className="inline-flex items-center gap-2 rounded-full font-bold text-white" style={{ background: accent, padding: "15px 28px", fontSize: "0.9375rem", textDecoration: "none" }}>
            Log in to your portal <ArrowRight size={16} />
          </Link>
          <p style={{ marginTop: "1.25rem", fontSize: "0.8125rem", color: "#8a8473", maxWidth: "44ch" }}>Teacher or parent? Use the invite link your school emailed you.</p>
        </div>

        <div className="mt-auto pt-8 flex flex-wrap items-center justify-between gap-4">
          <Contact email={contactEmail} phone={contactPhone} color="#7a7466" />
          {!hideBranding && <span style={{ fontSize: "0.75rem", color: "#a39d8d" }}>Powered by <Link href="/" style={{ color: "#5c574c", fontWeight: 600, textDecoration: "none" }}>Scholr</Link></span>}
        </div>
      </div>

      {/* Right — image / accent block */}
      <div className="relative hidden lg:block" style={{ background: heroImageUrl ? "#1a1a17" : accent }}>
        {heroImageUrl ? (
          <Image src={heroImageUrl} alt="" fill sizes="50vw" style={{ objectFit: "cover" }} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div aria-hidden style={{ position: "absolute", inset: 0, background: `linear-gradient(150deg, ${accent}, color-mix(in srgb, ${accent} 60%, #000))` }} />
            <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.22), transparent 55%)" }} />
            <span className="relative font-extrabold text-white" style={{ fontSize: "8rem", opacity: 0.92, letterSpacing: "-0.04em" }}>{getInitials(schoolName)}</span>
          </div>
        )}
      </div>
    </main>
    <Sections blocks={contentBlocks} dark={false} accent={accent} />
   </div>
  )
}

/* ── Theme 3: Campus (structured, top nav + banner + cards) ─────────────────── */
function CampusTheme({ loginUrl, schoolName, accent, logoUrl, heroImageUrl, headline, subtext, contactEmail, contactPhone, contentBlocks, hideBranding }: ThemeProps) {
  return (
    <main className="min-h-[100dvh] flex flex-col" style={{ background: "#f7f8fa", color: "#1b1d24", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Top nav */}
      <header className="flex items-center justify-between px-6 sm:px-10 py-4" style={{ background: "#fff", borderBottom: "1px solid #ebedf1" }}>
        <div className="flex items-center gap-2.5">
          <Logo logoUrl={logoUrl} schoolName={schoolName} ring="#e6e8ee" />
          <span className="font-extrabold" style={{ fontSize: "1.0625rem", letterSpacing: "-0.01em" }}>{schoolName}</span>
        </div>
        <Link href={loginUrl} data-scholr-cta="login" className="text-sm font-semibold rounded-lg px-4 py-2 text-white" style={{ background: accent, textDecoration: "none" }}>Log in</Link>
      </header>

      {/* Hero banner */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 text-white" style={{ minHeight: "46vh", background: heroImageUrl ? "#10131c" : `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 55%, #10131c))`, overflow: "hidden" }}>
        {heroImageUrl && (<>
          <Image src={heroImageUrl} alt="" fill sizes="100vw" style={{ objectFit: "cover", zIndex: 0 }} />
          <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 1, background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 72%, transparent), rgba(16,19,28,0.8))` }} />
        </>)}
        <div className="relative py-16" style={{ zIndex: 2 }}>
          <h1 className="font-extrabold" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "1rem", maxWidth: "18ch" }}>{headline}</h1>
          <p style={{ fontSize: "clamp(1rem, 1.5vw, 1.1875rem)", color: "rgba(255,255,255,0.82)", lineHeight: 1.6, maxWidth: "52ch", margin: "0 auto 2rem" }}>{subtext}</p>
          <Link href={loginUrl} data-scholr-cta="login" className="inline-flex items-center gap-2 rounded-lg font-bold" style={{ background: "#fff", color: accent, padding: "13px 24px", fontSize: "0.9375rem", textDecoration: "none" }}>
            Log in to your portal <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Info cards */}
      <section className="px-6 sm:px-10 py-12 -mt-10 relative" style={{ zIndex: 3 }}>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4">
          {[
            { t: "For parents", d: "Track attendance, homework, and weekly reports for your child — all in one place." },
            { t: "For teachers", d: "Mark attendance, set homework, message parents, and let AI write your reports." },
            { t: "Get in touch", d: contactEmail || contactPhone ? "" : "Reach the school office for help getting started.", contact: true },
          ].map(({ t, d, contact }) => (
            <div key={t} className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #ebedf1", boxShadow: "0 8px 24px rgba(20,23,40,0.05)" }}>
              <div className="rounded-xl flex items-center justify-center mb-3" style={{ width: 34, height: 34, background: `color-mix(in srgb, ${accent} 14%, #fff)` }}>
                <span className="rounded" style={{ width: 12, height: 12, background: accent }} />
              </div>
              <p className="font-bold mb-1" style={{ fontSize: "0.9375rem" }}>{t}</p>
              {contact ? (
                <div className="mt-1"><Contact email={contactEmail} phone={contactPhone} color="#5a5f6e" /></div>
              ) : (
                <p style={{ fontSize: "0.8125rem", color: "#5a5f6e", lineHeight: 1.6 }}>{d}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <Sections blocks={contentBlocks} dark={false} accent={accent} />

      {!hideBranding && (
        <footer className="mt-auto text-center px-6 py-6" style={{ fontSize: "0.75rem", color: "#9aa0ad", borderTop: "1px solid #ebedf1", background: "#fff" }}>
          Powered by <Link href="/" style={{ color: "var(--c-indigo)", fontWeight: 600, textDecoration: "none" }}>Scholr</Link>
        </footer>
      )}
    </main>
  )
}
