"use client"
import { useState } from "react"
import Link from "next/link"
import {
  CreditCard, Loader2, ArrowRight, Check, Minus,
  Sparkles, AlertTriangle, ExternalLink,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { PLANS, FEATURE_GROUPS, type FeatureValue } from "@/lib/plans"

/* ── Types ───────────────────────────────────────────────────────────────── */
interface School {
  id:                    string
  name:                  string
  subscription_plan:     string
  subscription_status:   string
  student_count:         number
  max_students:          number
  stripe_customer_id:    string | null
  stripe_subscription_id: string | null
}

interface Subscription {
  plan:                  string
  status:                string
  current_period_start:  string
  current_period_end:    string
  cancel_at_period_end:  boolean
  trial_end:             string | null
}

interface Props {
  school:       School
  subscription: Subscription | null
  userId:       string
}

/* ── Status config ───────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "Active",   color: "var(--c-emerald)", bg: "var(--c-emerald-bg)" },
  trialing: { label: "Trial",    color: "var(--c-gold)",    bg: "var(--c-gold-bg)" },
  past_due: { label: "Past due", color: "var(--c-red)",     bg: "var(--c-red-bg)" },
  canceled: { label: "Canceled", color: "var(--c-text-muted)", bg: "var(--c-surface)" },
}

/* ── Cell renderer ───────────────────────────────────────────────────────── */
function Cell({ value, highlight = false }: { value: FeatureValue; highlight?: boolean }) {
  if (value === true)  return <Check size={14} strokeWidth={2.5} style={{ color: highlight ? "rgba(255,255,255,0.9)" : "var(--c-emerald)" }} />
  if (value === false) return <Minus size={13} style={{ color: "var(--c-border-mid, #d1d5db)" }} />
  return (
    <span className="text-xs font-semibold" style={{ color: highlight ? "rgba(255,255,255,0.85)" : "var(--c-text-mid)" }}>
      {value}
    </span>
  )
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function BillingPanel({ school, subscription, userId: _userId }: Props) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [annual, setAnnual]           = useState(false)

  async function handleUpgrade(planId: string) {
    if (planId === "enterprise") {
      window.location.href = "mailto:hello@scholr.app?subject=Enterprise%20enquiry"
      return
    }
    if (planId === school.subscription_plan) return

    setLoadingPlan(planId)
    try {
      const res = await fetch("/api/billing/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan: planId, school_id: school.id }),
      })
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setLoadingPlan(null)
    }
  }

  async function openCustomerPortal() {
    setLoadingPlan("portal")
    try {
      const res = await fetch("/api/billing/portal", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ school_id: school.id }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setLoadingPlan(null)
    }
  }

  const usagePct   = Math.min(100, Math.round((school.student_count / school.max_students) * 100))
  const statusCfg  = STATUS_CONFIG[school.subscription_status] ?? STATUS_CONFIG.canceled
  const currentPlan = PLANS.find(p => p.id === school.subscription_plan) ?? PLANS[0]

  const isTrialing = school.subscription_status === "trialing"
  const trialActive = isTrialing && subscription?.trial_end && new Date(subscription.trial_end) > new Date()

  return (
    <div className="space-y-8 pb-12">

      {/* ── Current plan status ─────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>

        {/* Header bar */}
        <div className="px-6 py-4 flex items-center justify-between"
          style={{ background: "var(--c-surface)", borderBottom: "1px solid var(--c-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--c-indigo-bg)" }}>
              <currentPlan.icon size={16} style={{ color: "var(--c-indigo)" }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--c-text-muted)" }}>
                Current plan
              </p>
              <p className="text-lg font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.02em" }}>
                {currentPlan.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status badge */}
            <span className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: statusCfg.bg, color: statusCfg.color }}>
              {statusCfg.label}
            </span>

            {/* Manage billing button */}
            {school.stripe_subscription_id && (
              <button
                onClick={openCustomerPortal}
                disabled={loadingPlan === "portal"}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:opacity-80 active:scale-95"
                style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}>
                {loadingPlan === "portal"
                  ? <Loader2 size={12} className="animate-spin" />
                  : <><CreditCard size={12} /> Manage billing</>
                }
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6" style={{ background: "var(--c-bg)" }}>

          {/* Trial / renewal info */}
          {subscription && (
            <>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>Period started</p>
                <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>
                  {formatDate(subscription.current_period_start)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>
                  {subscription.cancel_at_period_end ? "Access until" : "Renews on"}
                </p>
                <p className="text-sm font-semibold" style={{ color: subscription.cancel_at_period_end ? "var(--c-red)" : "var(--c-text)" }}>
                  {formatDate(subscription.current_period_end)}
                  {subscription.cancel_at_period_end && (
                    <span className="ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}>
                      Cancels
                    </span>
                  )}
                </p>
              </div>
              {trialActive && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: "var(--c-text-muted)" }}>Free trial ends</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--c-gold)" }}>
                    {formatDate(subscription.trial_end!)}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Student usage */}
          <div className={subscription ? "sm:col-span-2 lg:col-span-3" : "col-span-full"}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold" style={{ color: "var(--c-text-muted)" }}>Student seats used</p>
              <p className="text-xs font-bold" style={{ color: usagePct >= 90 ? "var(--c-red)" : "var(--c-text)" }}>
                {school.student_count.toLocaleString()}
                <span style={{ color: "var(--c-text-muted)" }}>
                  {" "}/ {school.max_students === 99999 ? "∞" : school.max_students.toLocaleString()}
                </span>
              </p>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--c-surface)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${usagePct}%`,
                  background: usagePct >= 90 ? "var(--c-red)"
                    : usagePct >= 70 ? "var(--c-gold)"
                    : "var(--c-indigo)",
                }}
              />
            </div>
            {usagePct >= 90 && (
              <div className="flex items-center gap-1.5 mt-2">
                <AlertTriangle size={12} style={{ color: "var(--c-red)" }} />
                <p className="text-xs" style={{ color: "var(--c-red)" }}>
                  Approaching seat limit — upgrade to add more students.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trial banner */}
      {trialActive && (
        <div className="rounded-2xl p-5 flex items-center justify-between gap-4"
          style={{ background: "var(--c-indigo-bg)", border: "1px solid color-mix(in srgb, var(--c-indigo) 35%, transparent)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--c-indigo)" }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>
                You&apos;re on a free Pro trial
              </p>
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
                Explore all Pro features until {formatDate(subscription!.trial_end!)}. No charge until trial ends.
              </p>
            </div>
          </div>
          <button onClick={() => handleUpgrade("pro")} disabled={!!loadingPlan}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
            style={{ background: "var(--c-indigo)", color: "white" }}>
            {loadingPlan === "pro" ? <Loader2 size={13} className="animate-spin" /> : <>Upgrade now <ArrowRight size={12} /></>}
          </button>
        </div>
      )}

      {/* ── Plan cards ──────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.02em" }}>
              Choose your plan
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
              Switch anytime — changes take effect at next billing cycle.
            </p>
          </div>

          {/* Annual/monthly toggle */}
          <div className="inline-flex items-center rounded-xl p-1 gap-0.5 flex-shrink-0"
            style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
            {[{ label: "Monthly", value: false }, { label: "Annual", value: true }].map(opt => (
              <button key={String(opt.value)} type="button" onClick={() => setAnnual(opt.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: annual === opt.value ? "var(--c-bg)" : "transparent",
                  color:      annual === opt.value ? "var(--c-text)" : "var(--c-text-muted)",
                  boxShadow:  annual === opt.value ? "0 1px 4px rgba(0,0,0,0.07)" : "none",
                }}>
                {opt.label}
                {opt.value && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--c-emerald-bg)", color: "var(--c-emerald)" }}>
                    −17%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const price     = plan.monthlyPrice === null ? null
              : annual ? plan.annualPrice : plan.monthlyPrice
            const isCurrent = plan.id === school.subscription_plan
            const isLoading = loadingPlan === plan.id
            const Icon      = plan.icon

            if (plan.highlight) {
              return (
                <div key={plan.id} className="relative rounded-2xl flex flex-col overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, var(--c-indigo) 0%, oklch(42% 0.20 280) 100%)",
                    boxShadow: "0 16px 48px rgba(79,70,229,0.25)",
                    padding: 2,
                  }}>
                  {plan.badge && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: "white", color: "var(--c-indigo)", whiteSpace: "nowrap" }}>
                      ✦ {plan.badge}
                    </div>
                  )}
                  <div className="flex-1 rounded-[calc(1rem-2px)] p-6 flex flex-col"
                    style={{ background: "linear-gradient(145deg, oklch(44% 0.24 264) 0%, oklch(40% 0.20 280) 100%)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.15)" }}>
                        <Icon size={15} style={{ color: "white" }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: "white" }}>{plan.name}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{plan.description}</p>
                      </div>
                    </div>

                    <div className="mb-5">
                      {price !== null ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-extrabold" style={{ color: "white", letterSpacing: "-0.035em" }}>
                            ${price}
                          </span>
                          <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                            {plan.period}{annual && price ? " · annually" : ""}
                          </span>
                        </div>
                      ) : (
                        <span className="text-3xl font-extrabold" style={{ color: "white" }}>Custom</span>
                      )}
                    </div>

                    <div className="space-y-2 flex-1 mb-5">
                      {plan.features.map(f => (
                        <div key={f} className="flex items-center gap-2">
                          <Check size={12} style={{ color: "rgba(180,180,255,1)", flexShrink: 0 }} strokeWidth={2.5} />
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>{f}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isCurrent || !!loadingPlan}
                      className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-70"
                      style={{ background: "white", color: "var(--c-indigo)", cursor: isCurrent ? "default" : "pointer" }}>
                      {isLoading ? <Loader2 size={14} className="animate-spin" />
                        : isCurrent ? "✓ Current plan"
                        : <>{plan.cta} <ArrowRight size={13} /></>
                      }
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={plan.id} className="rounded-2xl p-6 flex flex-col transition-all"
                style={{
                  background: isCurrent ? "var(--c-indigo-bg)" : "var(--c-bg)",
                  border: `1.5px solid ${isCurrent ? "var(--c-indigo)" : "var(--c-border)"}`,
                }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: isCurrent ? "var(--c-indigo)" : "var(--c-surface)" }}>
                    <Icon size={15} style={{ color: isCurrent ? "white" : "var(--c-indigo)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{plan.name}</p>
                    <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{plan.description}</p>
                  </div>
                </div>

                <div className="mb-5">
                  {price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold" style={{ color: "var(--c-text)", letterSpacing: "-0.035em" }}>
                        {price === 0 ? "Free" : `$${price}`}
                      </span>
                      {price !== 0 && <span className="text-sm" style={{ color: "var(--c-text-muted)" }}>{plan.period}</span>}
                    </div>
                  ) : (
                    <span className="text-3xl font-extrabold" style={{ color: "var(--c-text)" }}>Custom</span>
                  )}
                </div>

                <div className="space-y-2 flex-1 mb-5">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <Check size={12} style={{ color: "var(--c-emerald)", flexShrink: 0 }} strokeWidth={2.5} />
                      <span className="text-xs" style={{ color: "var(--c-text-mid)" }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || !!loadingPlan}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-80 active:scale-[0.97] disabled:opacity-70"
                  style={{
                    background: isCurrent ? "var(--c-indigo)" : "var(--c-surface)",
                    color:      isCurrent ? "white" : "var(--c-text)",
                    border:     isCurrent ? "none" : "1.5px solid var(--c-border)",
                    cursor:     isCurrent ? "default" : "pointer",
                  }}>
                  {isLoading ? <Loader2 size={14} className="animate-spin" />
                    : isCurrent ? "✓ Current plan"
                    : plan.id === "enterprise" ? <>Contact us <ExternalLink size={12} /></>
                    : <>Upgrade <ArrowRight size={13} /></>
                  }
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center mt-4 text-xs" style={{ color: "var(--c-text-muted)" }}>
          All plans include a 14-day Pro trial.{" "}
          <Link href="/pricing" className="font-semibold underline underline-offset-2" style={{ color: "var(--c-indigo)" }}>
            See full pricing details
          </Link>
        </p>
      </div>

      {/* ── Feature comparison table ─────────────────────────────────────────── */}
      <div>
        <div className="mb-6">
          <h2 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.02em" }}>
            Compare every feature
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--c-text-muted)" }}>
            Everything included in each plan, side by side.
          </p>
        </div>

        {/* Mobile horizontal scroll wrapper */}
        <div className="-mx-6 px-6 sm:mx-0 sm:px-0 overflow-x-auto pb-2 sm:overflow-visible sm:pb-0">
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--c-border)", minWidth: 480 }}>

          {/* Static plan header — lives outside the scroll body so it never moves */}
          <div className="grid grid-cols-4"
            style={{
              background:   "var(--c-surface)",
              borderBottom: "1px solid var(--c-border)",
              boxShadow:    "0 4px 12px rgba(0,0,0,0.06)",
            }}>
            <div className="p-4" />
            {PLANS.map(plan => {
              const price     = plan.monthlyPrice === null ? null
                : annual ? plan.annualPrice : plan.monthlyPrice
              const isCurrent = plan.id === school.subscription_plan
              const proBg     = "oklch(44% 0.24 264)"
              return (
                <div key={plan.id} className="p-4 text-center flex flex-col items-center justify-center gap-0.5"
                  style={{ background: plan.highlight ? proBg : "transparent" }}>
                  <p className="text-xs font-bold leading-tight"
                    style={{ color: plan.highlight ? "white" : "var(--c-text)" }}>
                    {plan.name}
                  </p>
                  <p className="text-[11px] leading-tight"
                    style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : "var(--c-text-muted)" }}>
                    {price === null ? "Custom" : price === 0 ? "Free" : `$${price}/mo`}
                  </p>
                  {isCurrent && (
                    <span className="mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: plan.highlight ? "rgba(255,255,255,0.18)" : "var(--c-indigo-bg)",
                        color:      plan.highlight ? "white" : "var(--c-indigo)",
                      }}>
                      Current
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Scrollable body — feature rows + footer scroll independently under the static header */}
          <div style={{ maxHeight: 520, overflowY: "auto" }}>

          {/* Feature groups */}
          {FEATURE_GROUPS.map((group, gi) => (
            <div key={group.title}>
              <div className="grid grid-cols-4 px-4 py-2.5"
                style={{ background: "var(--c-surface)", borderTop: gi > 0 ? "1px solid var(--c-border)" : undefined }}>
                <div className="flex items-center gap-2 col-span-4">
                  <group.icon size={12} style={{ color: "var(--c-indigo)" }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--c-text-muted)" }}>
                    {group.title}
                  </span>
                </div>
              </div>

              {group.rows.map((row, ri) => (
                <div key={row.label}
                  className="grid grid-cols-4 items-center"
                  style={{
                    borderTop: "1px solid var(--c-border)",
                    background: ri % 2 === 0 ? "var(--c-bg)" : "var(--c-surface)",
                  }}>
                  <div className="px-4 py-3">
                    <span className="text-xs" style={{ color: "var(--c-text-mid)" }}>{row.label}</span>
                    {row.note && (
                      <span className="ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded-full"
                        style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}>
                        {row.note}
                      </span>
                    )}
                  </div>
                  <div className="px-4 py-3 flex justify-center">
                    <Cell value={row.free} />
                  </div>
                  <div className="px-4 py-3 flex justify-center"
                    style={{ background: "var(--c-indigo-bg)" }}>
                    <Cell value={row.pro} />
                  </div>
                  <div className="px-4 py-3 flex justify-center">
                    <Cell value={row.enterprise} />
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Table footer */}
          <div className="grid grid-cols-4" style={{ borderTop: "1px solid var(--c-border)", background: "var(--c-surface)" }}>
            <div className="p-4" />
            {PLANS.map(plan => {
              const isCurrent = plan.id === school.subscription_plan
              return (
                <div key={plan.id} className="p-4 flex justify-center">
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent || !!loadingPlan}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                    style={{
                      background:  isCurrent ? "var(--c-surface)" : plan.highlight ? "var(--c-indigo)" : "var(--c-bg)",
                      color:       isCurrent ? "var(--c-text-muted)" : plan.highlight ? "white" : "var(--c-indigo)",
                      border:      plan.highlight || isCurrent ? "none" : "1.5px solid var(--c-border)",
                      cursor:      isCurrent ? "default" : "pointer",
                    }}>
                    {loadingPlan === plan.id
                      ? <Loader2 size={11} className="animate-spin" />
                      : isCurrent ? "Current"
                      : <>{plan.cta} <ArrowRight size={10} /></>
                    }
                  </button>
                </div>
              )
            })}
          </div>

          </div>{/* end scrollable body */}
        </div>
        </div>{/* end mobile scroll wrapper */}
      </div>

    </div>
  )
}
