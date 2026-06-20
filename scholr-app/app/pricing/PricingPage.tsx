"use client"
import { useState } from "react"
import Link from "next/link"
import {
  Check, Minus, ArrowLeft, GraduationCap, ArrowRight, ArrowUpRight, ChevronDown, Heart, Sparkles,
} from "lucide-react"
import { PLANS, FEATURE_GROUPS, FAQ, type FeatureValue } from "@/lib/plans"
import ThemeToggle from "@/components/ThemeToggle"
import SmoothScroll from "@/components/landing/SmoothScroll"

/* ── Premium plan card (double-bezel, Editorial-Luxury) ──────────────────── */
function PlanCard({ plan, annual }: { plan: typeof PLANS[number]; annual: boolean }) {
  const price = plan.monthlyPrice === null ? null : annual ? plan.annualPrice : plan.monthlyPrice
  const Icon = plan.icon
  const pro = plan.highlight
  const ink      = pro ? "oklch(26% 0.06 56)" : "var(--w-ink)"
  const inkSoft  = pro ? "oklch(33% 0.06 56)" : "var(--w-ink-soft)"
  const inkFaint = pro ? "oklch(40% 0.06 56)" : "var(--w-ink-faint)"

  return (
    <div className={`group relative h-full ${pro ? "lg:-translate-y-4" : ""}`}>
      {/* Outer shell */}
      <div
        className="h-full p-1.5 transition-transform duration-700 group-hover:-translate-y-2"
        style={{
          borderRadius: 34,
          background: pro
            ? "linear-gradient(165deg, oklch(83% 0.09 72 / 0.65), oklch(70% 0.16 48 / 0.4))"
            : "linear-gradient(165deg, var(--w-sand), color-mix(in srgb, var(--w-sand) 55%, var(--w-paper)))",
          boxShadow: pro
            ? "0 1px 0 oklch(100% 0 0 / 0.5) inset, 0 36px 80px -28px oklch(62% 0.15 60 / 0.6)"
            : "var(--w-shadow)",
          transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* Inner core */}
        <div
          className="h-full flex flex-col relative overflow-hidden"
          style={{
            borderRadius: 28,
            padding: "30px 26px 26px",
            background: pro ? "linear-gradient(158deg, var(--w-amber) 0%, oklch(67% 0.16 46) 100%)" : "var(--w-paper)",
            boxShadow: pro ? "inset 0 1px 1px oklch(100% 0 0 / 0.3)" : "inset 0 1px 1px oklch(100% 0 0 / 0.6)",
          }}
        >
          {pro && <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 82% -12%, oklch(100% 0 0 / 0.38), transparent 58%)", pointerEvents: "none" }} />}

          {/* Eyebrow row */}
          <div className="relative flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 15, background: pro ? "oklch(100% 0 0 / 0.22)" : "var(--w-amber-bg)", boxShadow: "inset 0 1px 0 oklch(100% 0 0 / 0.45)" }}>
                <Icon size={19} strokeWidth={1.5} style={{ color: pro ? "oklch(28% 0.06 56)" : "var(--w-amber-ink)" }} />
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: inkSoft }}>{plan.name}</span>
            </div>
            {pro && (
              <span className="inline-flex items-center gap-1" style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 100, background: "oklch(26% 0.06 58)", color: "var(--w-amber)" }}>
                <Sparkles size={9} strokeWidth={2} /> Most loved
              </span>
            )}
          </div>

          {/* Price */}
          <div className="relative">
            {price !== null ? (
              <div className="flex items-baseline gap-1.5">
                <span className="w-display" style={{ fontSize: "3.4rem", color: ink, lineHeight: 0.95, letterSpacing: "-0.04em" }}>{price === 0 ? "Free" : `$${price}`}</span>
                {price !== 0 && <span style={{ color: inkFaint, fontSize: "0.9rem" }}>{plan.period}</span>}
              </div>
            ) : (
              <span className="w-display" style={{ fontSize: "2.8rem", color: ink, letterSpacing: "-0.03em" }}>Custom</span>
            )}
          </div>
          <p className="relative" style={{ fontSize: "0.8rem", color: inkFaint, marginTop: 8 }}>
            {plan.students} students{annual && price ? " · billed annually" : ""}
          </p>
          <p className="relative" style={{ fontSize: "0.875rem", color: inkSoft, lineHeight: 1.5, marginTop: 10 }}>{plan.description}</p>

          <div aria-hidden style={{ height: 1, background: pro ? "oklch(100% 0 0 / 0.22)" : "var(--w-line)", margin: "22px 0 20px" }} />

          {/* Features */}
          <ul className="relative space-y-3 flex-1 mb-8">
            {plan.features.map(f => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="flex items-center justify-center shrink-0" style={{ width: 18, height: 18, marginTop: 1, borderRadius: "50%", background: pro ? "oklch(100% 0 0 / 0.28)" : "var(--w-mint)" }}>
                  <Check size={11} strokeWidth={2.4} style={{ color: pro ? "oklch(28% 0.06 56)" : "var(--c-emerald)" }} />
                </span>
                <span style={{ fontSize: "0.875rem", color: inkSoft, lineHeight: 1.5 }}>{f}</span>
              </li>
            ))}
          </ul>

          {/* CTA, button-in-button */}
          <Link href={plan.href}
            className="group/btn relative inline-flex items-center justify-between w-full active:scale-[0.98]"
            style={{
              paddingLeft: 22, paddingRight: 8, height: 54, borderRadius: 100, textDecoration: "none",
              background: pro ? "oklch(26% 0.06 58)" : "var(--w-ink)",
              color: pro ? "var(--w-amber)" : "var(--w-paper)",
              fontWeight: 700, fontSize: "0.9375rem",
              transition: "transform 300ms cubic-bezier(0.32,0.72,0,1)",
            }}
          >
            <span>{plan.cta}</span>
            <span className="flex items-center justify-center transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
              style={{ width: 38, height: 38, borderRadius: "50%", background: "oklch(100% 0 0 / 0.16)", color: "inherit" }}>
              <ArrowUpRight size={17} strokeWidth={1.8} />
            </span>
          </Link>
          {pro && <p className="relative text-center" style={{ fontSize: "0.72rem", color: inkFaint, marginTop: 12 }}>No credit card required</p>}
        </div>
      </div>
    </div>
  )
}

/* ── Cell renderer ───────────────────────────────────────────────────────── */
function Cell({ value, highlight = false }: { value: FeatureValue; highlight?: boolean }) {
  if (value === true)
    return <Check size={15} style={{ color: highlight ? "oklch(34% 0.07 56)" : "var(--c-emerald)" }} strokeWidth={2.5} />
  if (value === false)
    return <Minus size={14} style={{ color: "var(--w-line)" }} />
  return (
    <span className="text-xs font-bold" style={{ color: highlight ? "oklch(34% 0.07 56)" : "var(--w-ink-soft)" }}>
      {value}
    </span>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div style={{ background: "var(--w-cream)", minHeight: "100vh" }}>
      <SmoothScroll />

      {/* Nav */}
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-5 sm:px-8"
        style={{ background: "color-mix(in srgb, var(--w-cream) 88%, transparent)", borderBottom: "1px solid var(--w-line)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "var(--w-amber)", boxShadow: "0 2px 8px -2px var(--w-amber)" }}>
            <GraduationCap size={14} aria-hidden style={{ color: "oklch(26% 0.06 58)" }} />
          </div>
          <span className="w-display" style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--w-ink)" }}>Scholr</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle size="sm" />
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: "var(--w-ink-soft)", textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* soft pastel blobs */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div className="w-blob w-float-a" style={{ width: 320, height: 320, background: "var(--w-peach)", top: "-12%", right: "4%", opacity: 0.6 }} />
          <div className="w-blob w-float-b" style={{ width: 240, height: 240, background: "var(--w-mint)", top: "10%", left: "-6%", opacity: 0.5 }} />
        </div>
        <div className="relative text-center px-6 pt-16 pb-12 sm:pt-20 sm:pb-14" style={{ maxWidth: 720, margin: "0 auto" }}>
          <div className="w-eyebrow mb-6" style={{ margin: "0 auto 1.5rem" }}>
            <Heart size={13} style={{ color: "var(--w-coral)" }} aria-hidden /> Simple, kind pricing
          </div>
          <h1 className="w-display" style={{ fontSize: "clamp(2.1rem, 5vw, 3.5rem)", lineHeight: 1.05, marginBottom: "1rem" }}>
            Per school. Never per<br className="hidden sm:block" /> teacher or parent.
          </h1>
          <p className="mx-auto" style={{ fontSize: "clamp(1rem, 1.4vw, 1.15rem)", color: "var(--w-ink-soft)", lineHeight: 1.7, maxWidth: "44ch", marginBottom: "2.25rem" }}>
            One flat fee. Every parent, teacher and admin is welcome, with full access. Start free, upgrade when you&apos;re ready.
          </p>

          {/* Toggle */}
          <div style={{ display: "inline-flex", background: "var(--w-paper)", border: "1px solid var(--w-line)", borderRadius: 100, padding: 4, gap: 3, boxShadow: "var(--w-shadow)" }}>
            {[{ label: "Monthly", value: false }, { label: "Annual", value: true }].map(opt => (
              <button key={String(opt.value)} type="button" onClick={() => setAnnual(opt.value)}
                className="flex items-center gap-2"
                style={{
                  height: 40, padding: "0 18px", borderRadius: 100, border: "none", cursor: "pointer",
                  fontSize: "0.875rem", fontWeight: annual === opt.value ? 800 : 600,
                  background: annual === opt.value ? "var(--w-amber)" : "transparent",
                  color: annual === opt.value ? "oklch(26% 0.06 58)" : "var(--w-ink-soft)",
                  transition: "background 200ms var(--ease-out), color 200ms var(--ease-out)",
                }}>
                {opt.label}
                {opt.value && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--w-mint)", color: "var(--c-emerald)" }}>
                    Save 17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="px-5 sm:px-6 pb-20" style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map(plan => <PlanCard key={plan.id} plan={plan} annual={annual} />)}
        </div>

        <p className="text-center mt-8 text-sm" style={{ color: "var(--w-ink-faint)" }}>
          All plans include a 14-day free Pro trial. No credit card required.
        </p>
      </div>

      {/* Feature comparison table */}
      <div className="px-5 sm:px-6 pb-24" style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div className="text-center mb-12">
          <p className="w-label" style={{ textAlign: "center" }}>Compare plans</p>
          <h2 className="w-display" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", lineHeight: 1.08 }}>
            Every feature, side by side.
          </h2>
        </div>

        {/* Horizontal scroll wrapper for mobile */}
        <div className="-mx-5 px-5 sm:-mx-6 sm:px-6 overflow-x-auto pb-2 md:mx-0 md:px-0 md:overflow-visible md:pb-0">
          <div className="rounded-[28px] overflow-clip" style={{ border: "1px solid var(--w-line)", minWidth: 560, background: "var(--w-paper)" }}>
            {/* Table header */}
            <div className="grid grid-cols-4 sticky top-16 z-30"
              style={{ background: "var(--w-paper)", borderBottom: "1px solid var(--w-line)", boxShadow: "0 4px 14px -8px oklch(35% 0.05 55 / 0.25)" }}>
              <div className="p-5" />
              {PLANS.map(plan => (
                <div key={plan.id} className="p-5 text-center"
                  style={{ background: plan.highlight ? "var(--w-amber)" : "transparent" }}>
                  <p className="text-sm font-extrabold" style={{ color: plan.highlight ? "oklch(26% 0.06 56)" : "var(--w-ink)" }}>{plan.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: plan.highlight ? "oklch(34% 0.06 56)" : "var(--w-ink-faint)" }}>
                    {plan.monthlyPrice === null ? "Custom" : plan.monthlyPrice === 0 ? "Free" : `$${annual ? plan.annualPrice : plan.monthlyPrice}/mo`}
                  </p>
                </div>
              ))}
            </div>

            {/* Feature groups */}
            {FEATURE_GROUPS.map((group, gi) => (
              <div key={group.title}>
                <div className="grid grid-cols-4 px-5 py-3"
                  style={{ background: "var(--w-sand)", borderTop: gi > 0 ? "1px solid var(--w-line)" : undefined }}>
                  <div className="flex items-center gap-2 col-span-4">
                    <group.icon size={13} style={{ color: "var(--w-amber-ink)" }} />
                    <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "var(--w-ink-soft)" }}>{group.title}</span>
                  </div>
                </div>
                {group.rows.map((row, ri) => (
                  <div key={row.label} className="grid grid-cols-4 items-center"
                    style={{ borderTop: "1px solid var(--w-line)", background: ri % 2 === 0 ? "var(--w-paper)" : "color-mix(in srgb, var(--w-sand) 50%, var(--w-paper))" }}>
                    <div className="px-5 py-3.5">
                      <span className="text-sm" style={{ color: "var(--w-ink-soft)" }}>{row.label}</span>
                      {row.note && (
                        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--w-amber-bg)", color: "var(--w-amber-ink)" }}>
                          {row.note}
                        </span>
                      )}
                    </div>
                    <div className="px-5 py-3.5 flex justify-center"><Cell value={row.free} /></div>
                    <div className="px-5 py-3.5 flex justify-center" style={{ background: "var(--w-amber-bg)" }}><Cell value={row.pro} /></div>
                    <div className="px-5 py-3.5 flex justify-center"><Cell value={row.enterprise} /></div>
                  </div>
                ))}
              </div>
            ))}

            {/* Table footer CTA row */}
            <div className="grid grid-cols-4" style={{ borderTop: "1px solid var(--w-line)", background: "var(--w-sand)" }}>
              <div className="p-5" />
              {PLANS.map(plan => (
                <div key={plan.id} className="p-5 flex justify-center">
                  <Link href={plan.href}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full"
                    style={{
                      background: plan.highlight ? "oklch(26% 0.06 58)" : "var(--w-paper)",
                      color: plan.highlight ? "var(--w-amber)" : "var(--w-amber-ink)",
                      border: plan.highlight ? "none" : "1.5px solid var(--w-line)",
                      textDecoration: "none",
                    }}>
                    {plan.cta} <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="px-5 sm:px-6 pb-24" style={{ maxWidth: 760, margin: "0 auto" }}>
        <h2 className="w-display text-center" style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", lineHeight: 1.08, marginBottom: "2.5rem" }}>
          Common questions
        </h2>
        <div className="w-card overflow-hidden" style={{ borderRadius: 24, padding: 0 }}>
          {FAQ.map((item, i) => (
            <div key={i} style={{ borderBottom: i < FAQ.length - 1 ? "1px solid var(--w-line)" : "none" }}>
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 text-left"
                style={{ padding: "20px 24px", background: openFaq === i ? "var(--w-amber-bg)" : "transparent", border: "none", cursor: "pointer", transition: "background 150ms var(--ease-out)" }}>
                <span className="text-sm" style={{ fontWeight: openFaq === i ? 800 : 600, color: openFaq === i ? "var(--w-amber-ink)" : "var(--w-ink)" }}>{item.q}</span>
                <ChevronDown size={18} style={{ color: openFaq === i ? "var(--w-amber-ink)" : "var(--w-ink-faint)", flexShrink: 0, transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform 280ms var(--ease-out)" }} />
              </button>
              <div style={{ maxHeight: openFaq === i ? 320 : 0, opacity: openFaq === i ? 1 : 0, overflow: "hidden", transition: "max-height 320ms var(--ease-out), opacity 260ms var(--ease-out)" }}>
                <p className="text-sm" style={{ padding: "0 24px 20px", color: "var(--w-ink-soft)", lineHeight: 1.75 }}>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA strip, warm cocoa */}
      <div className="mx-4 sm:mx-6 mb-16 rounded-[28px] px-6 py-12 sm:px-14 sm:py-16 text-center overflow-hidden relative"
        style={{ background: "var(--w-cocoa)" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 70% at 50% 35%, oklch(72% 0.155 64 / 0.22) 0%, transparent 70%)" }} />
        <div className="relative">
          <p className="w-label" style={{ color: "var(--w-amber)", textAlign: "center" }}>Get started today</p>
          <h2 className="w-display" style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.06, color: "oklch(98% 0.01 80)", marginBottom: "1rem" }}>
            Let&apos;s bring your school closer.
          </h2>
          <p className="mx-auto" style={{ fontSize: "1.0625rem", color: "oklch(83% 0.02 75)", lineHeight: 1.7, maxWidth: "40ch", marginBottom: "2.25rem" }}>
            Set up in under 15 minutes. No credit card required. A 14-day Pro trial is included.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="w-btn group" style={{ justifyContent: "center" }}>
              Start for free <span className="w-btn-icon"><ArrowRight size={15} aria-hidden /></span>
            </Link>
            <Link href="mailto:abrahamayoola35@gmail.com" className="w-btn-ghost" style={{ justifyContent: "center", background: "oklch(100% 0 0 / 0.08)", border: "1.5px solid oklch(100% 0 0 / 0.2)", color: "oklch(94% 0.01 80)" }}>
              Talk to us
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center pb-12 text-sm" style={{ color: "var(--w-ink-faint)" }}>
        © {new Date().getFullYear()} Scholr · Made with care
        <span className="mx-2 opacity-40">|</span>
        <Link href="/privacy" style={{ color: "var(--w-ink-faint)", textDecoration: "none" }}>Privacy</Link>
        <span className="mx-2 opacity-40">|</span>
        <Link href="/terms" style={{ color: "var(--w-ink-faint)", textDecoration: "none" }}>Terms</Link>
      </footer>
    </div>
  )
}
