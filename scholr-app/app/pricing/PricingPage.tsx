"use client"
import { useState } from "react"
import Link from "next/link"
import {
  Check, Minus, ArrowLeft, GraduationCap, ArrowRight, Zap,
} from "lucide-react"
import { PLANS, FEATURE_GROUPS, FAQ, type FeatureValue } from "@/lib/plans"
import ThemeToggle from "@/components/ThemeToggle"

/* ── Cell renderer ───────────────────────────────────────────────────────── */
function Cell({ value, highlight = false }: { value: FeatureValue; highlight?: boolean }) {
  if (value === true)  return <Check size={15} style={{ color: highlight ? "rgba(255,255,255,0.9)" : "var(--c-emerald)" }} strokeWidth={2.5} />
  if (value === false) return <Minus size={14} style={{ color: "var(--c-border-mid)" }} />
  return (
    <span className="text-xs font-semibold" style={{ color: highlight ? "rgba(255,255,255,0.85)" : "var(--c-text-mid)" }}>
      {value}
    </span>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div style={{ background: "var(--c-bg)", minHeight: "100vh" }}>

      {/* Nav */}
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6"
        style={{ background: "var(--c-bg)", borderBottom: "1px solid var(--c-border)", backdropFilter: "blur(12px)" }}>
        <Link href="/" className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--c-text)", textDecoration: "none" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--c-indigo)" }}>
            <GraduationCap size={14} className="text-white" />
          </div>
          Scholr
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle size="sm" />
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: "var(--c-text-muted)", textDecoration: "none" }}>
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="text-center px-6 pt-20 pb-14" style={{ maxWidth: 680, margin: "0 auto" }}>
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6"
          style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}>
          <Zap size={11} /> Transparent pricing
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-4"
          style={{ color: "var(--c-text)", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          Per school. Not per<br className="hidden sm:block" /> teacher, not per parent.
        </h1>
        <p className="text-lg mb-10 leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
          One flat monthly fee. Every parent, teacher, and admin gets full access.
          Start free — upgrade when you&apos;re ready.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center rounded-xl p-1 gap-0.5"
          style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
          {[{ label: "Monthly", value: false }, { label: "Annual", value: true }].map(opt => (
            <button key={String(opt.value)} type="button" onClick={() => setAnnual(opt.value)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: annual === opt.value ? "var(--c-bg)" : "transparent",
                color:      annual === opt.value ? "var(--c-text)" : "var(--c-text-muted)",
                boxShadow:  annual === opt.value ? "0 1px 4px rgba(0,0,0,0.07)" : "none",
              }}>
              {opt.label}
              {opt.value && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "var(--c-emerald-bg)", color: "var(--c-emerald)" }}>
                  Save 17%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="px-6 pb-20" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map(plan => {
            const price = plan.monthlyPrice === null ? null
              : annual ? plan.annualPrice : plan.monthlyPrice
            const Icon = plan.icon

            if (plan.highlight) {
              return (
                <div key={plan.id} className="relative rounded-3xl flex flex-col overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, var(--c-indigo) 0%, oklch(42% 0.20 280) 100%)",
                    boxShadow: "0 24px 60px rgba(79,70,229,0.30)",
                    padding: 2,
                  }}>
                  {plan.badge && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                      style={{ background: "white", color: "var(--c-indigo)", whiteSpace: "nowrap" }}>
                      ✦ {plan.badge}
                    </div>
                  )}
                  <div className="flex-1 rounded-[22px] p-7 flex flex-col"
                    style={{ background: "linear-gradient(145deg, oklch(44% 0.24 264) 0%, oklch(40% 0.20 280) 100%)" }}>
                    <div className="flex items-center gap-2 mb-5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.15)" }}>
                        <Icon size={16} style={{ color: "white" }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "white" }}>{plan.name}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{plan.description}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      {price !== null ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-5xl font-extrabold" style={{ color: "white", letterSpacing: "-0.035em" }}>
                            ${price}
                          </span>
                          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem" }}>
                            {plan.period}{annual && price ? " · billed annually" : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-4xl font-extrabold" style={{ color: "white", letterSpacing: "-0.03em" }}>Custom</span>
                      )}
                      <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{plan.students} students</p>
                    </div>

                    <div className="space-y-2.5 flex-1 mb-8">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-center gap-2.5">
                          <Check size={13} style={{ color: "rgba(180,180,255,1)", flexShrink: 0 }} strokeWidth={2.5} />
                          <span className="text-sm" style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.5 }}>{f}</span>
                        </div>
                      ))}
                    </div>

                    <Link href={plan.href}
                      className="block w-full py-3.5 rounded-xl text-sm font-bold text-center transition-all hover:opacity-90 active:scale-[0.97]"
                      style={{ background: "white", color: "var(--c-indigo)", textDecoration: "none" }}>
                      {plan.cta}
                    </Link>
                    <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                      No credit card required
                    </p>
                  </div>
                </div>
              )
            }

            return (
              <div key={plan.id} className="rounded-3xl p-7 flex flex-col"
                style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "var(--c-surface)" }}>
                    <Icon size={16} style={{ color: "var(--c-indigo)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{plan.name}</p>
                    <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  {price !== null ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-5xl font-extrabold" style={{ color: "var(--c-text)", letterSpacing: "-0.035em" }}>
                        {price === 0 ? "Free" : `$${price}`}
                      </span>
                      {price !== 0 && (
                        <span style={{ color: "var(--c-text-muted)", fontSize: "0.9rem" }}>{plan.period}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-4xl font-extrabold" style={{ color: "var(--c-text)", letterSpacing: "-0.03em" }}>Custom</span>
                  )}
                  <p className="text-sm mt-1" style={{ color: "var(--c-text-muted)" }}>{plan.students} students</p>
                </div>

                <div className="space-y-2.5 flex-1 mb-8">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <Check size={13} style={{ color: "var(--c-emerald)", flexShrink: 0 }} strokeWidth={2.5} />
                      <span className="text-sm" style={{ color: "var(--c-text-mid)", lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <Link href={plan.href}
                  className="block w-full py-3.5 rounded-xl text-sm font-semibold text-center transition-all hover:opacity-80 active:scale-[0.97]"
                  style={{
                    background: "var(--c-surface)",
                    color: "var(--c-text)",
                    border: "1.5px solid var(--c-border)",
                    textDecoration: "none",
                  }}>
                  {plan.cta}
                </Link>
              </div>
            )
          })}
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: "var(--c-text-muted)" }}>
          All plans include a 14-day free Pro trial. No credit card required.
        </p>
      </div>

      {/* Feature comparison table */}
      <div className="px-6 pb-24" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight mb-3"
            style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
            Compare every feature
          </h2>
          <p className="text-base" style={{ color: "var(--c-text-muted)" }}>
            Everything included in each plan, side by side.
          </p>
        </div>

        {/* Horizontal scroll wrapper for mobile */}
        <div className="-mx-6 px-6 overflow-x-auto pb-2 md:mx-0 md:px-0 md:overflow-visible md:pb-0">
        <div className="rounded-3xl overflow-clip" style={{ border: "1px solid var(--c-border)", minWidth: 540 }}>
          {/* Table header */}
          <div className="grid grid-cols-4 sticky top-16 z-30"
            style={{
              background: "var(--c-bg)",
              borderBottom: "1px solid var(--c-border)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}>
            <div className="p-5" />
            {PLANS.map(plan => (
              <div key={plan.id} className="p-5 text-center"
                style={{ background: plan.highlight ? "oklch(44% 0.24 264)" : "transparent" }}>
                <p className="text-sm font-bold" style={{ color: plan.highlight ? "white" : "var(--c-text)" }}>
                  {plan.name}
                </p>
                <p className="text-xs mt-0.5"
                  style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : "var(--c-text-muted)" }}>
                  {plan.monthlyPrice === null ? "Custom" : plan.monthlyPrice === 0 ? "Free" : `$${annual ? plan.annualPrice : plan.monthlyPrice}/mo`}
                </p>
              </div>
            ))}
          </div>

          {/* Feature groups */}
          {FEATURE_GROUPS.map((group, gi) => (
            <div key={group.title}>
              {/* Group header */}
              <div className="grid grid-cols-4 px-5 py-3"
                style={{ background: "var(--c-surface)", borderTop: gi > 0 ? "1px solid var(--c-border)" : undefined }}>
                <div className="flex items-center gap-2 col-span-4">
                  <group.icon size={13} style={{ color: "var(--c-indigo)" }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>
                    {group.title}
                  </span>
                </div>
              </div>

              {/* Rows */}
              {group.rows.map((row, ri) => (
                <div key={row.label}
                  className="grid grid-cols-4 items-center"
                  style={{
                    borderTop: "1px solid var(--c-border)",
                    background: ri % 2 === 0 ? "var(--c-bg)" : "var(--c-surface)",
                  }}>
                  <div className="px-5 py-3.5">
                    <span className="text-sm" style={{ color: "var(--c-text-mid)" }}>{row.label}</span>
                    {row.note && (
                      <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}>
                        {row.note}
                      </span>
                    )}
                  </div>
                  <div className="px-5 py-3.5 flex justify-center">
                    <Cell value={row.free} />
                  </div>
                  <div className="px-5 py-3.5 flex justify-center"
                    style={{ background: "var(--c-indigo-bg)" }}>
                    <Cell value={row.pro} />
                  </div>
                  <div className="px-5 py-3.5 flex justify-center">
                    <Cell value={row.enterprise} />
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Table footer CTA row */}
          <div className="grid grid-cols-4" style={{ borderTop: "1px solid var(--c-border)", background: "var(--c-surface)" }}>
            <div className="p-5" />
            {PLANS.map(plan => (
              <div key={plan.id} className="p-5 flex justify-center">
                <Link href={plan.href}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background:      plan.highlight ? "var(--c-indigo)" : "var(--c-bg)",
                    color:           plan.highlight ? "white" : "var(--c-indigo)",
                    border:          plan.highlight ? "none" : "1.5px solid var(--c-border)",
                    textDecoration:  "none",
                  }}>
                  {plan.cta} <ArrowRight size={11} />
                </Link>
              </div>
            ))}
          </div>
        </div>
        </div>{/* end scroll wrapper */}
      </div>

      {/* FAQ */}
      <div className="px-6 pb-24" style={{ maxWidth: 740, margin: "0 auto" }}>
        <h2 className="text-3xl font-extrabold text-center mb-10 tracking-tight"
          style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
          Frequently asked questions
        </h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--c-border)", background: "var(--c-bg)" }}>
              <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-start justify-between gap-4 px-6 py-4 text-left">
                <span className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{item.q}</span>
                <ArrowRight size={14} style={{
                  color: "var(--c-text-muted)", flexShrink: 0, marginTop: 2,
                  transform: openFaq === i ? "rotate(90deg)" : "rotate(0)",
                  transition: "transform 280ms cubic-bezier(0.23,1,0.32,1)",
                }} />
              </button>
              <div style={{
                maxHeight: openFaq === i ? 300 : 0, overflow: "hidden",
                transition: "max-height 320ms cubic-bezier(0.23,1,0.32,1)",
              }}>
                <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "var(--c-text-muted)" }}>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA strip */}
      <div className="mx-6 mb-16 rounded-3xl p-14 text-center overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, var(--c-indigo) 0%, oklch(42% 0.20 280) 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative">
          <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Get started today</p>
          <h2 className="text-4xl font-extrabold mb-4 tracking-tight" style={{ color: "white", letterSpacing: "-0.03em" }}>
            Your school deserves better tools.
          </h2>
          <p className="text-base mb-8 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
            Set up in under 15 minutes. No credit card required. 14-day Pro trial included.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ background: "white", color: "var(--c-indigo)", textDecoration: "none" }}>
              Start for free <ArrowRight size={14} />
            </Link>
            <Link href="mailto:hello@scholr.app"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none" }}>
              Talk to sales
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center pb-12 text-sm" style={{ color: "var(--c-text-muted)" }}>
        © {new Date().getFullYear()} Scholr · All rights reserved
        <span className="mx-2 opacity-30">|</span>
        <Link href="/privacy" style={{ color: "var(--c-text-muted)", textDecoration: "none" }}>Privacy</Link>
        <span className="mx-2 opacity-30">|</span>
        <Link href="/terms" style={{ color: "var(--c-text-muted)", textDecoration: "none" }}>Terms</Link>
      </footer>
    </div>
  )
}
