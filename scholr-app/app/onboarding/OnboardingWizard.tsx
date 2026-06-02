"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  Users, GraduationCap, Building2,
  ArrowRight, ArrowLeft, CheckCircle2,
  Search, Loader2, School, Globe, User, Phone,
  Heart, Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Role = "parent" | "teacher" | "admin"
type Step = "role" | "school" | "profile" | "done"

interface VerifiedSchool { id: string; name: string; logo_url: string | null }

const ROLES: { key: Role; icon: typeof Users; label: string; description: string; color: string; bg: string }[] = [
  {
    key: "parent",
    icon: Heart,
    label: "Parent / Guardian",
    description: "Track your child's attendance, homework, and receive school updates.",
    color: "var(--c-emerald)",
    bg: "var(--c-emerald-bg)",
  },
  {
    key: "teacher",
    icon: GraduationCap,
    label: "Teacher",
    description: "Manage your class, mark attendance, assign homework, and write AI reports.",
    color: "var(--c-indigo)",
    bg: "var(--c-indigo-bg)",
  },
  {
    key: "admin",
    icon: Building2,
    label: "School Admin",
    description: "Set up and manage your school, enrol students, and track school health.",
    color: "var(--c-gold)",
    bg: "var(--c-gold-bg)",
  },
]

const RELATIONSHIPS = ["Parent", "Guardian", "Step-parent", "Grandparent", "Foster carer", "Other"]
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

const STEPS: Step[] = ["role", "school", "profile", "done"]
const STEP_LABELS = ["Your role", "Your school", "Your profile", "All done!"]

interface Props {
  userEmail: string
  userId: string
}

export default function OnboardingWizard({ userEmail }: Props) {
  // ── State ───────────────────────────────────────────────────────────────────
  const [step, setStep]           = useState<Step>("role")
  const [visible, setVisible]     = useState(true)

  // Role step
  const [role, setRole]           = useState<Role | null>(null)

  // School step — parent / teacher
  const [inviteCode, setInviteCode] = useState("")
  const [verifying, setVerifying]   = useState(false)
  const [verifiedSchool, setVerifiedSchool] = useState<VerifiedSchool | null>(null)
  const [codeError, setCodeError]   = useState("")

  // School step — admin
  const [schoolName, setSchoolName]       = useState("")
  const [schoolCountry, setSchoolCountry] = useState("US")

  // Profile step
  const [fullName, setFullName]         = useState("")
  const [phone, setPhone]               = useState("")
  const [relationship, setRelationship] = useState("Parent")

  // Submission
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState("")

  const verifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Transition helper ───────────────────────────────────────────────────────
  function transition(to: Step) {
    setVisible(false)
    setTimeout(() => { setStep(to); setVisible(true) }, 240)
  }

  // ── School invite-code live verification ────────────────────────────────────
  const verifyCode = useCallback(async (code: string) => {
    if (!code.trim() || code.length < 2) {
      setVerifiedSchool(null)
      setCodeError("")
      return
    }
    setVerifying(true)
    setCodeError("")
    setVerifiedSchool(null)
    try {
      const res = await fetch(`/api/onboarding/verify-school?slug=${encodeURIComponent(code.trim())}`)
      const json = await res.json() as { found: boolean; school?: VerifiedSchool }
      if (json.found && json.school) {
        setVerifiedSchool(json.school)
      } else {
        setCodeError("No school found with that invite code.")
      }
    } catch {
      setCodeError("Could not verify invite code. Please try again.")
    } finally {
      setVerifying(false)
    }
  }, [])

  useEffect(() => {
    if (verifyTimer.current) clearTimeout(verifyTimer.current)
    if (inviteCode.trim().length >= 2) {
      verifyTimer.current = setTimeout(() => verifyCode(inviteCode), 600)
    } else {
      setVerifiedSchool(null)
      setCodeError("")
    }
    return () => { if (verifyTimer.current) clearTimeout(verifyTimer.current) }
  }, [inviteCode, verifyCode])

  // ── Slug preview for admin ──────────────────────────────────────────────────
  const slugPreview = schoolName.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  // ── Step navigation ─────────────────────────────────────────────────────────
  function nextFromRole() {
    if (!role) return
    transition("school")
  }

  function nextFromSchool() {
    if (role === "admin") {
      if (!schoolName.trim()) return
    } else {
      if (!verifiedSchool) return
    }
    transition("profile")
  }

  async function submit() {
    if (!fullName.trim() || !role) return
    setSubmitting(true)
    setSubmitError("")

    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          schoolSlug:    role !== "admin" ? inviteCode.trim() : undefined,
          schoolName:    role === "admin"  ? schoolName.trim()    : undefined,
          schoolCountry: role === "admin"  ? schoolCountry        : undefined,
          fullName:      fullName.trim(),
          phone:         phone.trim() || undefined,
          relationship:  role === "parent" ? relationship : undefined,
        }),
      })

      const json = await res.json() as { success?: boolean; error?: string }

      if (!res.ok || !json.success) {
        setSubmitError(json.error ?? "Something went wrong. Please try again.")
        setSubmitting(false)
        return
      }

      // Go to done step, then redirect
      transition("done")
      setTimeout(() => {
        // Force a hard navigation so middleware re-reads the new profile
        window.location.href = "/"
      }, 2400)
    } catch {
      setSubmitError("Network error. Please check your connection.")
      setSubmitting(false)
    }
  }

  // ── Step index for progress bar ─────────────────────────────────────────────
  const stepIndex = STEPS.indexOf(step)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--c-bg)" }}
    >
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--c-indigo)" }}
        >
          <School size={18} className="text-white" />
        </div>
        <span className="text-lg font-extrabold tracking-tight" style={{ color: "var(--c-text)", letterSpacing: "-0.03em" }}>
          Scholr
        </span>
      </div>

      {/* Progress bar */}
      {step !== "done" && (
        <div className="w-full max-w-md mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                  style={{
                    background: i < stepIndex ? "var(--c-indigo)" : i === stepIndex ? "var(--c-indigo)" : "var(--c-border)",
                    color: i <= stepIndex ? "#fff" : "var(--c-text-muted)",
                    opacity: i < stepIndex ? 0.6 : 1,
                  }}
                >
                  {i < stepIndex ? <CheckCircle2 size={13} /> : i + 1}
                </div>
                <span
                  className="text-xs font-medium hidden sm:block"
                  style={{ color: i === stepIndex ? "var(--c-text)" : "var(--c-text-muted)" }}
                >
                  {STEP_LABELS[i]}
                </span>
                {i < 2 && (
                  <div
                    className="w-8 sm:w-12 h-px mx-1 transition-all duration-300"
                    style={{ background: i < stepIndex ? "var(--c-indigo)" : "var(--c-border)" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card */}
      <div
        className="w-full max-w-md"
        style={{
          transition: "opacity 240ms cubic-bezier(0.32,0.72,0,1), transform 240ms cubic-bezier(0.32,0.72,0,1)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.985)",
        }}
      >
        {/* ─── Step 1: Role ─────────────────────────────────────────────────── */}
        {step === "role" && (
          <div>
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--c-indigo)" }}>
                Step 1 of 3
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
                Welcome — who are you?
              </h1>
              <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
                Signed in as <span style={{ color: "var(--c-text)" }}>{userEmail}</span>. Choose the role that best describes you.
              </p>
            </div>

            <div className="space-y-3 mb-7">
              {ROLES.map(r => {
                const Icon = r.icon
                const selected = role === r.key
                return (
                  <button
                    key={r.key}
                    onClick={() => setRole(r.key)}
                    className="w-full text-left rounded-2xl p-4 flex items-start gap-4 transition-all duration-200"
                    style={{
                      background: selected ? r.bg : "var(--c-surface)",
                      border: `1.5px solid ${selected ? r.color : "var(--c-border)"}`,
                      transform: selected ? "scale(1.01)" : "scale(1)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: r.bg, color: r.color }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{r.label}</p>
                        {selected && (
                          <CheckCircle2 size={14} style={{ color: r.color }} />
                        )}
                      </div>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
                        {r.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              onClick={nextFromRole}
              disabled={!role}
              className="btn-primary w-full h-12 gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ─── Step 2: School ───────────────────────────────────────────────── */}
        {step === "school" && (
          <div>
            <button
              onClick={() => transition("role")}
              className="flex items-center gap-1.5 text-xs font-semibold mb-6"
              style={{ color: "var(--c-text-muted)" }}
            >
              <ArrowLeft size={13} />
              Back
            </button>

            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--c-indigo)" }}>
                Step 2 of 3
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
                {role === "admin" ? "Set up your school" : "Join your school"}
              </h1>
              <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
                {role === "admin"
                  ? "Your school's invite code will be its unique name slug — share it with teachers and parents."
                  : "Your school admin will have given you an invite code. Enter it below to connect your account."}
              </p>
            </div>

            {/* Parent / Teacher: invite code */}
            {(role === "parent" || role === "teacher") && (
              <div className="mb-7 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>
                    School invite code
                  </label>
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--c-text-muted)" }}
                    />
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={e => { setInviteCode(e.target.value.toLowerCase().replace(/\s/g, "-")); setVerifiedSchool(null) }}
                      placeholder="e.g. riverside-primary"
                      className={cn(
                        "input pl-9 pr-10 lowercase",
                        verifiedSchool && "border-[var(--c-emerald)]",
                        codeError && "border-[var(--c-red)]"
                      )}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {verifying && <Loader2 size={14} className="animate-spin" style={{ color: "var(--c-text-muted)" }} />}
                      {verifiedSchool && <CheckCircle2 size={14} style={{ color: "var(--c-emerald)" }} />}
                    </div>
                  </div>

                  {/* Feedback */}
                  {verifiedSchool && (
                    <div
                      className="mt-2 px-3 py-2 rounded-xl flex items-center gap-2"
                      style={{ background: "var(--c-emerald-bg)" }}
                    >
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "var(--c-emerald)", color: "#fff" }}
                      >
                        <School size={12} />
                      </div>
                      <p className="text-xs font-semibold" style={{ color: "var(--c-emerald)" }}>
                        {verifiedSchool.name}
                      </p>
                    </div>
                  )}
                  {codeError && (
                    <p className="mt-1.5 text-xs" style={{ color: "var(--c-red)" }}>{codeError}</p>
                  )}
                </div>

                {role === "parent" && (
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>
                      Your relationship to the child
                    </label>
                    <select
                      value={relationship}
                      onChange={e => setRelationship(e.target.value)}
                      className="input w-full"
                      style={{ fontFamily: "inherit" }}
                    >
                      {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Admin: create school */}
            {role === "admin" && (
              <div className="mb-7 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>
                    School name
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    placeholder="e.g. Riverside Primary School"
                    className="input"
                  />
                  {slugPreview && (
                    <p className="mt-1.5 text-xs" style={{ color: "var(--c-text-muted)" }}>
                      Invite code: <span className="font-mono font-semibold" style={{ color: "var(--c-indigo)" }}>{slugPreview}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>
                    Country
                  </label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
                    <select
                      value={schoolCountry}
                      onChange={e => setSchoolCountry(e.target.value)}
                      className="input pl-9 w-full"
                      style={{ fontFamily: "inherit" }}
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={nextFromSchool}
              disabled={role === "admin" ? !schoolName.trim() : !verifiedSchool}
              className="btn-primary w-full h-12 gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* ─── Step 3: Profile ──────────────────────────────────────────────── */}
        {step === "profile" && (
          <div>
            <button
              onClick={() => transition("school")}
              className="flex items-center gap-1.5 text-xs font-semibold mb-6"
              style={{ color: "var(--c-text-muted)" }}
            >
              <ArrowLeft size={13} />
              Back
            </button>

            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--c-indigo)" }}>
                Step 3 of 3
              </p>
              <h1 className="text-2xl font-extrabold tracking-tight mb-1.5" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
                Tell us about yourself
              </h1>
              <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
                Your name is visible to {role === "parent" ? "teachers" : role === "teacher" ? "parents and your admin" : "everyone in your school"}.
              </p>
            </div>

            <div className="space-y-4 mb-7">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>
                  Full name <span style={{ color: "var(--c-red)" }}>*</span>
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="input pl-9"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--c-text)" }}>
                  Phone number <span className="font-normal" style={{ color: "var(--c-text-muted)" }}>(optional)</span>
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--c-text-muted)" }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="input pl-9"
                  />
                </div>
              </div>
            </div>

            {submitError && (
              <div
                className="mb-4 px-4 py-3 rounded-xl text-sm"
                style={{ background: "var(--c-red-bg)", color: "var(--c-red)" }}
              >
                {submitError}
              </div>
            )}

            <button
              onClick={submit}
              disabled={!fullName.trim() || submitting}
              className="btn-primary w-full h-12 gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {submitting ? "Setting up your account…" : "Create my account"}
            </button>
          </div>
        )}

        {/* ─── Step 4: Done ─────────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="text-center py-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "var(--c-emerald-bg)" }}
            >
              <CheckCircle2 size={36} style={{ color: "var(--c-emerald)" }} />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-2" style={{ color: "var(--c-text)", letterSpacing: "-0.025em" }}>
              You&apos;re all set, {fullName.split(" ")[0]}!
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--c-text-muted)" }}>
              {role === "admin"
                ? "Your school is ready. Taking you to the admin dashboard…"
                : role === "teacher"
                ? "Welcome to the team. Taking you to your dashboard…"
                : "Welcome aboard. Taking you to your dashboard…"}
            </p>

            {/* Animated dots */}
            <div className="flex items-center justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "var(--c-indigo)",
                    animation: `bounce-dot 1s ease-in-out ${i * 0.15}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legal note */}
      {step !== "done" && (
        <p className="mt-8 text-xs text-center max-w-xs" style={{ color: "var(--c-text-muted)" }}>
          By continuing you agree to Scholr&apos;s{" "}
          <span className="underline cursor-pointer">Terms of Service</span> and{" "}
          <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      )}

      <style>{`
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
