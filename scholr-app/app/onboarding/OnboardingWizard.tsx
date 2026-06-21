"use client"
import { useState } from "react"
import {
  ArrowRight, ArrowLeft, CheckCircle2,
  Loader2, School, Globe, User, Phone, Sparkles, Building2,
} from "lucide-react"

type Step = "school" | "profile" | "done"

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "OTHER", name: "Other" },
]

const STEPS: Step[] = ["school", "profile", "done"]
const STEP_LABELS = ["Your school", "Your profile", "All done!"]

interface Props {
  userEmail: string
  userId: string
}

export default function OnboardingWizard({ userEmail }: Props) {
  const [step, setStep]       = useState<Step>("school")
  const [visible, setVisible] = useState(true)

  const [schoolName, setSchoolName]       = useState("")
  const [schoolCountry, setSchoolCountry] = useState("US")
  const [fullName, setFullName]           = useState("")
  const [phone, setPhone]                 = useState("")

  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState("")

  function transition(to: Step) {
    setVisible(false)
    setTimeout(() => { setStep(to); setVisible(true) }, 240)
  }

  const slugPreview = schoolName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  async function submit() {
    if (!fullName.trim() || !schoolName.trim()) return
    setSubmitting(true)
    setSubmitError("")
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "admin",
          schoolName: schoolName.trim(),
          schoolCountry,
          fullName: fullName.trim(),
          phone: phone.trim() || undefined,
        }),
      })
      const json = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !json.success) {
        setSubmitError(json.error ?? "Something went wrong. Please try again.")
        setSubmitting(false)
        return
      }
      transition("done")
      setTimeout(() => { window.location.href = "/" }, 2200)
    } catch {
      setSubmitError("Network error. Please check your connection.")
      setSubmitting(false)
    }
  }

  const stepIndex = STEPS.indexOf(step)

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-12" style={{ background: "var(--c-bg)" }}>
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--c-indigo)" }}>
          <School size={18} className="text-white" />
        </div>
        <span className="text-lg font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.03em" }}>Scholr</span>
      </div>

      {/* Progress */}
      {step !== "done" && (
        <div className="w-full max-w-md mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.slice(0, 2).map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                  style={{ background: i <= stepIndex ? "var(--c-indigo)" : "var(--c-border)", color: i <= stepIndex ? "#fff" : "var(--c-text-muted)", opacity: i < stepIndex ? 0.6 : 1 }}>
                  {i < stepIndex ? <CheckCircle2 size={13} /> : i + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block" style={{ color: i === stepIndex ? "var(--c-text)" : "var(--c-text-muted)" }}>{STEP_LABELS[i]}</span>
                {i < 1 && <div className="w-8 sm:w-12 h-px mx-1 transition-all duration-300" style={{ background: i < stepIndex ? "var(--c-indigo)" : "var(--c-border)" }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-md" style={{
        transition: "opacity 240ms cubic-bezier(0.32,0.72,0,1), transform 240ms cubic-bezier(0.32,0.72,0,1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.985)",
      }}>
        {/* Step 1: School */}
        {step === "school" && (
          <div>
            <div className="mb-7">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--c-indigo-bg)", color: "var(--c-indigo)" }}>
                <Building2 size={20} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--c-indigo)" }}>Step 1 of 2</p>
              <h1 className="text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>Set up your school</h1>
              <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
                Signed in as <span style={{ color: "var(--c-text)" }}>{userEmail}</span>. You can invite your teachers and parents once you&apos;re in.
              </p>
            </div>

            <div className="space-y-4 mb-7">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>School name</label>
                <input type="text" value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="e.g. Riverside Primary School" className="input" autoFocus />
                {slugPreview && (
                  <p className="mt-1.5 text-xs" style={{ color: "var(--c-text-muted)" }}>
                    Your page: <span className="font-mono font-semibold" style={{ color: "var(--c-indigo)" }}>getscholr.vercel.app/{slugPreview}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>Country</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
                  <select value={schoolCountry} onChange={e => setSchoolCountry(e.target.value)} className="input pl-9 w-full" style={{ fontFamily: "inherit" }}>
                    {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <button onClick={() => schoolName.trim() && transition("profile")} disabled={!schoolName.trim()}
              className="btn-primary w-full h-12 gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Profile */}
        {step === "profile" && (
          <div>
            <button onClick={() => transition("school")} className="flex items-center gap-1.5 text-xs font-semibold mb-6" style={{ color: "var(--c-text-muted)" }}>
              <ArrowLeft size={13} /> Back
            </button>
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--c-indigo)" }}>Step 2 of 2</p>
              <h1 className="text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>Tell us about yourself</h1>
              <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>You&apos;ll be the school administrator.</p>
            </div>

            <div className="space-y-4 mb-7">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>Full name <span style={{ color: "var(--c-red)" }}>*</span></label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className="input pl-9" autoFocus />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>Phone number <span className="font-normal" style={{ color: "var(--c-text-muted)" }}>(optional)</span></label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" className="input pl-9" />
                </div>
              </div>
            </div>

            {submitError && <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}>{submitError}</div>}

            <button onClick={submit} disabled={!fullName.trim() || submitting} className="btn-primary w-full h-12 gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {submitting ? "Creating your school…" : "Create my school"}
            </button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === "done" && (
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "var(--c-emerald-bg)" }}>
              <CheckCircle2 size={36} style={{ color: "var(--c-emerald)" }} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-2" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>You&apos;re all set, {fullName.split(" ")[0]}!</h1>
            <p className="text-sm mb-6" style={{ color: "var(--c-text-muted)" }}>Your school is ready. Taking you to the admin dashboard…</p>
            <div className="flex items-center justify-center gap-1.5">
              {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full" style={{ background: "var(--c-indigo)", animation: `bounce-dot 1s ease-in-out ${i * 0.15}s infinite` }} />)}
            </div>
          </div>
        )}
      </div>

      {step !== "done" && (
        <p className="mt-8 text-xs text-center max-w-xs" style={{ color: "var(--c-text-muted)" }}>
          By continuing you agree to Scholr&apos;s <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      )}

      <style>{`@keyframes bounce-dot { 0%,80%,100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-8px); opacity: 1; } }`}</style>
    </div>
  )
}
