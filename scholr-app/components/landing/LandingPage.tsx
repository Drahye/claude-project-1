"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  ArrowRight, Bell, BookOpen, Brain, BarChart3,
  Calendar, Check, ChevronDown, FileText,
  GraduationCap, Sparkles, Star, TrendingUp,
  X, CheckCircle2,
} from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"

// ─── Hooks ──────────────────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.06, rootMargin: "-32px 0px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function useCounter(target: number, duration = 1600) {
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setStarted(true) },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    let startTime: number | null = null
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, target, duration])

  return { ref, value }
}

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV = [
  { label: "Features", href: "#features" },
  { label: "For Schools", href: "#roles" },
  { label: "Pricing", href: "/pricing" },
]

const ROLE_TABS = [
  {
    id: "parent",
    label: "I'm a parent",
    headline: "Know your child's school day the moment it happens.",
    sub: "Absence alerts in under 2 minutes. Every homework deadline. Every report card. One feed, nothing buried.",
    features: [
      "Absence notification before you finish your morning meeting",
      "Homework board sorted by urgency, not post date",
      "Weekly Intelligence Report every Friday at 5pm",
      "Direct, professional channel to the class teacher",
    ],
    mockupColor: "oklch(46% 0.22 264)",
    accent: "oklch(96% 0.015 264)",
  },
  {
    id: "teacher",
    label: "I'm a teacher",
    headline: "Mark a full class present in under 60 seconds.",
    sub: "Stop managing 14 parent groups on your personal phone. One professional inbox. AI handles the report writing.",
    features: [
      "Full class attendance with one tap per student",
      "AI Report Writer saves 4+ hours every single term",
      "Private inbox — no personal number shared with parents",
      "Assignment board with file attachments and grade tracking",
    ],
    mockupColor: "oklch(52% 0.17 162)",
    accent: "oklch(97% 0.008 162)",
  },
  {
    id: "admin",
    label: "I run a school",
    headline: "Your whole school in one number.",
    sub: "The School Health Score tells you exactly how your school is performing — from any device, any timezone.",
    features: [
      "School Health Score updated in real-time",
      "Fee invoicing with automatic overdue reminders",
      "Engagement analytics: open rates, response times, trends",
      "Multi-campus management from one login",
    ],
    mockupColor: "oklch(62% 0.15 65)",
    accent: "oklch(97% 0.015 65)",
  },
]

const AI_FEATURES = [
  {
    id: "ai-1",
    icon: FileText,
    tag: "Teachers",
    title: "AI Report Writer",
    body: "Describe a student in two sentences. Scholr generates a full, nuanced, subject-specific comment in your school's preferred tone. Saves 4+ hours per teacher, per term.",
    featured: true,
    lines: [
      "Input: 'Kofi tries hard but struggles with fractions...'",
      "",
      "Generating report comment...",
      "",
      "\"Kofi demonstrates a commendable work ethic this term.",
      "His enthusiasm for Mathematics is clear, and with",
      "focused practice on fractions and decimal operations,",
      "he is well-positioned for a strong second term.\"",
    ],
  },
  {
    id: "ai-2",
    icon: Brain,
    tag: "Parents",
    title: "Weekly Intelligence Report",
    body: "Every Friday at 5pm, parents receive a personalised card: attendance, homework submitted vs missed, teacher comments, and an AI-generated encouragement note.",
    featured: false,
    lines: [
      "Amara's Week — Friday, 30 May",
      "Attendance   5/5 days ✓",
      "Homework     4/4 submitted ✓",
      "\"Amara showed exceptional focus this week...\"",
    ],
  },
  {
    id: "ai-3",
    icon: TrendingUp,
    tag: "Admin",
    title: "Predictive Attendance Alerts",
    body: "Scholr detects patterns automatically — absent every Monday, four lates in a week — and flags with a suggested action. Zero-effort safeguarding.",
    featured: false,
    lines: [
      "⚠  Pattern detected: Joshua Osei",
      "Absent 3 Mondays in 4 weeks",
      "→ Schedule parent conversation",
      "Confidence: 94%",
    ],
  },
]

const PLANS = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    period: "forever",
    sub: "Up to 100 students",
    features: [
      "Real-time messaging",
      "Live attendance tracking",
      "5 active assignments per class",
      "10 announcements per month",
      "Basic report cards",
      "Push notifications",
      "500MB file vault",
      "Email support",
    ],
    cta: "Get started free",
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 89,
    annualPrice: 74,
    period: "/month",
    sub: "Up to 500 students",
    badge: "Most Popular",
    features: [
      "Everything in Free",
      "Unlimited messaging",
      "AI Report Writer",
      "Weekly Intelligence Report",
      "AI Lesson Summariser",
      "Predictive Attendance Alerts",
      "Fee Payment & Invoice Manager",
      "Engagement Analytics Dashboard",
      "SMS fallback notifications",
      "Smart Event Calendar + RSVP",
      "10GB file vault",
      "Priority support + onboarding call",
    ],
    cta: "Start 14-day free trial",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    period: "",
    sub: "Multi-campus, 500+ students",
    features: [
      "Everything in Pro",
      "Multi-campus dashboard",
      "White-label branding",
      "Custom domain",
      "API access for integrations",
      "Custom AI tone training",
      "SLA support agreement",
      "Dedicated customer success manager",
      "Quarterly business review",
      "Unlimited file storage",
    ],
    cta: "Contact us",
    highlight: false,
  },
]

const TESTIMONIALS = [
  {
    id: "t-1",
    quote: "I manage two campuses — one in Abuja, one in London. The School Health Score told me more in 10 seconds than my previous system told me in a month. We upgraded the same afternoon.",
    name: "Dr. Adaeze Okonkwo",
    role: "Proprietor",
    school: "Heritage International School",
    location: "Abuja, Nigeria",
    init: "AO",
    color: "oklch(46% 0.22 264)",
  },
  {
    id: "t-2",
    quote: "The AI Report Writer is the first feature I've ever seen make a teacher cry happy tears. She was spending three full days every term on reports. That is over now.",
    name: "Mrs. Patricia Coleman",
    role: "Head of Year 4",
    school: "Brightwood Academy",
    location: "Houston, TX",
    init: "PC",
    color: "oklch(52% 0.17 162)",
  },
  {
    id: "t-3",
    quote: "The Weekly Intelligence Report changed my Friday evenings. I used to dread checking my phone after school. Now I actually look forward to 5pm on Fridays.",
    name: "James Osei-Mensah",
    role: "Parent of Year 6 student",
    school: "Thornbury Prep School",
    location: "London, UK",
    init: "JO",
    color: "oklch(62% 0.15 65)",
  },
  {
    id: "t-4",
    quote: "Setup took 11 minutes. Our parent open rate went from 23% to 81% in the first week. The teachers haven't looked back since we dropped the WhatsApp groups.",
    name: "Mr. Samuel Adekunle",
    role: "Head Teacher",
    school: "Greenfield College",
    location: "Lagos, Nigeria",
    init: "SA",
    color: "oklch(47% 0.22 27)",
  },
  {
    id: "t-5",
    quote: "For the first time in 12 years, I'm not anxious about parent communication. Everything is in one place, professional, and parents actually respond within minutes.",
    name: "Ms. Chloe Fitzgerald",
    role: "Year 3 Teacher",
    school: "St. Raphael's Primary",
    location: "Dublin, Ireland",
    init: "CF",
    color: "oklch(56% 0.18 308)",
  },
]

const FAQ_ITEMS = [
  { q: "Do parents need to download an app?", a: "No. Scholr is a Progressive Web App. Parents open a link from their invitation and tap 'Add to Home Screen' in Safari or Chrome. It looks and feels like a native app without any App Store visit." },
  { q: "Is Scholr FERPA and GDPR compliant?", a: "Yes. Student data is stored in isolated school accounts. No data is shared with third parties. Scholr supports full data deletion on school offboarding and is compliant with FERPA for US schools and GDPR for UK and EU schools." },
  { q: "How does the AI work?", a: "Scholr uses Anthropic's Claude API to power the Report Writer, Weekly Intelligence Report, Lesson Summariser, and Predictive Attendance features. All AI outputs are stored with your school ID and are fully auditable and deletable." },
  { q: "Can we import existing student data?", a: "Yes. Scholr accepts CSV imports for students, classes, and parent contact details. A guided setup wizard walks through the import in under 10 minutes." },
  { q: "What happens when we reach the free tier limit?", a: "You see a clear prompt showing exactly where the limit was reached, with one click to start a 14-day Pro trial. No features are removed mid-month." },
  { q: "Is there a setup fee?", a: "None. You pay only the monthly or annual subscription. Pro schools also receive a complimentary onboarding call at no extra cost." },
  { q: "What does the 14-day trial include?", a: "Every Pro feature — AI Report Writer, Weekly Intelligence Report, Fee Manager, Analytics Dashboard — at no cost. No credit card required to start." },
  { q: "Does Scholr work in Nigeria, Ghana, and Africa?", a: "Yes. Scholr was designed with African schools as a primary use case. Optimised for mid-range Android devices, 3G connections, and supports Naira, Cedis, Pounds, and Dollars." },
  { q: "Can we cancel anytime?", a: "Yes. Cancel from your billing settings with two clicks. Your school retains access until the end of the paid period, and your data is fully exportable before deletion." },
  { q: "Can we white-label Scholr for our school?", a: "White-labeling is available on the Enterprise plan: your school's branding, a custom subdomain, and optionally your own domain (portal.yourschool.com)." },
]

const FOOTER_NAV = [
  { title: "Product", links: ["Features", "Pricing", "Security", "Changelog", "Status"] },
  { title: "Company", links: ["About", "Blog", "Careers", "Press", "Contact"] },
  { title: "Support", links: ["Help Centre", "Getting Started", "Teacher Guide", "Parent Guide", "API Docs"] },
]

const MARQUEE_ITEMS = [
  { text: "Heritage International School", flag: "🇳🇬" },
  { text: "Brightwood Academy", flag: "🇺🇸" },
  { text: "Thornbury Prep", flag: "🇬🇧" },
  { text: "Greenfield College", flag: "🇳🇬" },
  { text: "St. Raphael's Primary", flag: "🇮🇪" },
  { text: "Cedar Brook School", flag: "🇨🇦" },
  { text: "Accra International", flag: "🇬🇭" },
  { text: "Kingsway College", flag: "🇬🇧" },
  { text: "Riverside Academy", flag: "🇺🇸" },
  { text: "Lagos Grammar School", flag: "🇳🇬" },
  { text: "Maple Leaf Prep", flag: "🇨🇦" },
  { text: "The Whitmore School", flag: "🇬🇧" },
]

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      <nav
        className={`nav-island ${scrolled ? "scrolled" : ""}`}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <a href="/" aria-label="Scholr home" className="flex items-center gap-2 mr-2" style={{ textDecoration: "none" }}>
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--c-indigo)" }}
          >
            <GraduationCap size={14} className="text-white" aria-hidden />
          </div>
          <span className="font-display" style={{ fontSize: "1rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--c-text)" }}>
            Scholr
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center">
          {NAV.map(({ label, href }) => (
            <a key={href} href={href} className="nav-pill-link">{label}</a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-1 ml-1">
          <ThemeToggle size="sm" />
          <a href="/login" className="nav-pill-link" style={{ color: "var(--c-text-muted)" }}>
            Sign in
          </a>
          <a href="/signup" className="nav-pill-cta group">
            Get started
            <span className="nav-pill-cta-icon">
              <ArrowRight size={13} aria-hidden />
            </span>
          </a>
        </div>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-1 md:hidden ml-auto">
          <ThemeToggle size="sm" />
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="hamburger-btn"
          onClick={() => setOpen(!open)}
        >
          <span className={`hamburger-icon ${open ? "open" : ""}`}>
            <span />
            <span />
            <span />
          </span>
        </button>
        </div>{/* end mobile controls */}
      </nav>

      {/* Full-screen overlay */}
      <div
        className={`nav-overlay ${open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
      >
        <button
          type="button"
          className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "oklch(100% 0 0 / 0.08)", color: "oklch(70% 0.01 264)" }}
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} aria-hidden />
        </button>
        <nav className="flex flex-col items-center gap-7">
          {NAV.map(({ label, href }, i) => (
            <a
              key={href}
              href={href}
              className="nav-overlay-link"
              style={{ transitionDelay: open ? `${70 + i * 55}ms` : "0ms" }}
              onClick={() => setOpen(false)}
            >
              {label}
            </a>
          ))}
          <a
            href="/signup"
            className="nav-overlay-cta"
            style={{ transitionDelay: open ? "310ms" : "0ms" }}
            onClick={() => setOpen(false)}
          >
            Get started free
            <ArrowRight size={16} aria-hidden />
          </a>
        </nav>
      </div>
    </>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const phoneGroupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const phoneGroup = phoneGroupRef.current
    if (!section || !phoneGroup) return

    let rafId: number
    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        phoneGroup.style.transform = `perspective(1200px) rotateY(${x * 10}deg) rotateX(${-y * 6}deg) translateZ(30px)`
      })
    }
    const handleLeave = () => {
      cancelAnimationFrame(rafId)
      phoneGroup.style.transform = "perspective(1200px) rotateY(0deg) rotateX(0deg) translateZ(0px)"
    }

    section.addEventListener("mousemove", handleMove)
    section.addEventListener("mouseleave", handleLeave)
    return () => {
      section.removeEventListener("mousemove", handleMove)
      section.removeEventListener("mouseleave", handleLeave)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        background: "var(--c-navy)",
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        paddingTop: "100px",
        paddingBottom: "80px",
      }}
    >
      {/* Glow orbs */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute",
          width: "70vw",
          height: "70vw",
          maxWidth: "720px",
          maxHeight: "720px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, oklch(46% 0.22 264 / 0.28) 0%, transparent 65%)",
          top: "-15%",
          right: "-10%",
          animation: "orb-drift 9s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          width: "50vw",
          height: "50vw",
          maxWidth: "560px",
          maxHeight: "560px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, oklch(54% 0.20 290 / 0.18) 0%, transparent 65%)",
          bottom: "-10%",
          left: "-8%",
          animation: "orb-drift-b 11s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          width: "30vw",
          height: "30vw",
          maxWidth: "320px",
          maxHeight: "320px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, oklch(62% 0.15 65 / 0.12) 0%, transparent 65%)",
          top: "45%",
          left: "35%",
          animation: "orb-drift 14s ease-in-out infinite 3s",
        }} />
        {/* Subtle grid */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(oklch(100% 0 0 / 0.025) 1px, transparent 1px), linear-gradient(90deg, oklch(100% 0 0 / 0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }} />
      </div>

      <div className="max-w-6xl mx-auto px-5 w-full relative">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-12 xl:gap-20 items-center">

          {/* Left — copy */}
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full hero-in-1"
              style={{
                background: "oklch(46% 0.22 264 / 0.14)",
                border: "1px solid oklch(46% 0.22 264 / 0.28)",
                color: "oklch(74% 0.14 264)",
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                padding: "5px 14px",
                marginBottom: "2rem",
              }}
            >
              <span className="pulse-dot w-1.5 h-1.5 rounded-full" style={{ background: "var(--c-emerald)" }} aria-hidden />
              Now live — US · UK · Nigeria · Ghana · Canada
            </div>

            <h1
              className="font-display hero-in-2"
              style={{
                fontSize: "clamp(2.75rem, 6.5vw, 5.5rem)",
                lineHeight: 1.0,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "oklch(97% 0.005 264)",
                marginBottom: "1.5rem",
                whiteSpace: "nowrap",
              }}
            >
              Every parent.<br />
              Every teacher.<br />
              <span style={{ color: "oklch(68% 0.16 264)" }}>One place.</span>
            </h1>

            <p
              className="hero-in-3"
              style={{
                fontSize: "clamp(1rem, 1.5vw, 1.2rem)",
                color: "oklch(62% 0.012 264)",
                lineHeight: 1.8,
                maxWidth: "46ch",
                marginBottom: "2.5rem",
              }}
            >
              Scholr replaces the email chaos and WhatsApp groups with one premium school platform. Free for schools under 100 students, forever.
            </p>

            <div className="flex flex-wrap gap-3 mb-10 hero-in-4">
              <a href="/signup" className="hero-cta-primary group">
                Get your school on Scholr — it's free
                <span className="hero-cta-icon">
                  <ArrowRight size={15} aria-hidden />
                </span>
              </a>
              <button type="button" className="hero-cta-ghost">
                See a 60-second demo
              </button>
            </div>

            {/* Social proof */}
            <div
              className="flex flex-wrap items-center gap-5 hero-in-5"
              style={{ color: "oklch(52% 0.01 264)", fontSize: "0.875rem" }}
            >
              <div className="flex items-center gap-2">
                <div className="flex" aria-hidden>
                  {[
                    "oklch(46% 0.22 264)", "oklch(52% 0.17 162)",
                    "oklch(62% 0.15 65)", "oklch(47% 0.22 27)", "oklch(56% 0.18 308)",
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-white font-bold"
                      style={{ background: c, borderColor: "var(--c-navy)", fontSize: "0.6rem", marginLeft: i > 0 ? -8 : 0 }}
                    >
                      {["A","T","M","K","P"][i]}
                    </div>
                  ))}
                </div>
                <span>
                  <strong style={{ color: "oklch(90% 0.008 264)", fontWeight: 600 }}>800+</strong> schools
                </span>
              </div>
              <div className="flex items-center gap-1" aria-label="Rated 4.9 out of 5 stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} style={{ fill: "var(--c-gold)", color: "var(--c-gold)" }} aria-hidden />
                ))}
                <span className="ml-1">
                  <strong style={{ color: "oklch(90% 0.008 264)", fontWeight: 600 }}>4.9</strong> from 340 reviews
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} style={{ color: "var(--c-emerald)" }} aria-hidden />
                No credit card
              </div>
            </div>
          </div>

          {/* Right — phone mockups with parallax */}
          <div className="hidden lg:block hero-in-6">
            <div
              ref={phoneGroupRef}
              style={{ transition: "transform 350ms cubic-bezier(0.23, 1, 0.32, 1)" }}
            >
              <HeroMockup />
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification pill */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "32px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          borderRadius: "100px",
          background: "oklch(100% 0 0 / 0.06)",
          border: "1px solid oklch(100% 0 0 / 0.12)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          whiteSpace: "nowrap",
          animation: "notification-pop 700ms var(--ease-out) 1.2s both",
          color: "oklch(80% 0.01 264)",
          fontSize: "0.8125rem",
          fontWeight: 500,
        }}
      >
        <span className="pulse-dot w-2 h-2 rounded-full" style={{ background: "var(--c-emerald)" }} />
        28 parents notified in 43 seconds — Class 6B, Heritage School
      </div>
    </section>
  )
}

function HeroMockup() {
  return (
    <div className="relative" style={{ height: "560px" }}>
      {/* Parent phone — left front */}
      <div
        className="phone-frame phone-float absolute"
        style={{ width: 248, left: 0, top: 16, zIndex: 2 }}
      >
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: "var(--c-indigo)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-white/50" aria-hidden />
          <span className="text-xs font-semibold text-white/90 flex-1">Parent Portal</span>
          <Bell size={12} className="text-white/60" aria-hidden />
        </div>
        <div className="p-3 space-y-2.5" style={{ background: "var(--c-surface)" }}>
          <div className="rounded-xl p-3" style={{ background: "oklch(100% 0 0)", border: "1px solid var(--c-border)" }}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: "var(--c-indigo)" }} aria-hidden>A</div>
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>Amara Osei</p>
                <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Class 6B · St. Peter's</p>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full" style={{ background: "var(--c-emerald)" }} aria-label="Active" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { l: "Attendance", v: "97%", ok: true },
                { l: "Homework", v: "4 due", ok: false },
                { l: "Reports", v: "Published", ok: true },
                { l: "Messages", v: "2 new", ok: false },
              ].map(({ l, v, ok }) => (
                <div key={l} className="rounded-lg p-2" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
                  <p className="text-xs mb-0.5" style={{ color: "var(--c-text-muted)" }}>{l}</p>
                  <p className="text-xs font-bold" style={{ color: ok ? "var(--c-emerald)" : "var(--c-indigo)" }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-2.5 flex items-start gap-2" style={{ background: "oklch(97% 0.01 27)", border: "1px solid oklch(88% 0.04 27)" }}>
            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "var(--c-red)" }}>
              <Bell size={10} className="text-white" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>Absence alert</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--c-text-mid)" }}>Amara was marked absent today at 8:47am</p>
            </div>
          </div>
          <div className="rounded-xl p-2.5" style={{ background: "oklch(100% 0 0)", border: "1px solid var(--c-border)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>Weekly Report</p>
              <span className="badge badge-pro">✦ Pro</span>
            </div>
            <div className="rounded-lg p-2 text-center" style={{ background: "oklch(96% 0.015 264)", filter: "blur(2px)", userSelect: "none" }} aria-hidden>
              <p className="text-xs font-bold" style={{ color: "var(--c-indigo)" }}>Week 3 · Term 2</p>
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>★★★★★ Great week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher phone — right, slightly behind */}
      <div
        className="phone-frame absolute"
        style={{
          width: 240,
          right: 0,
          top: 64,
          zIndex: 1,
          opacity: 0.88,
          animationDelay: "2.5s",
          animation: "phone-float 5s ease-in-out infinite 2.5s",
        }}
      >
        <div className="px-4 py-3 flex items-center gap-2" style={{ background: "var(--c-emerald)" }}>
          <div className="w-1.5 h-1.5 rounded-full bg-white/50" aria-hidden />
          <span className="text-xs font-semibold text-white/90 flex-1">Attendance · Class 6B</span>
        </div>
        <div className="p-3" style={{ background: "var(--c-surface)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>Monday, 2 June</p>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "oklch(95% 0.015 162)", color: "var(--c-emerald)" }}>28/30</span>
          </div>
          <div className="space-y-1.5">
            {[
              { n: "Adeyemi, Kofi", s: "present" },
              { n: "Bannister, Lucy", s: "present" },
              { n: "Chen, Marcus", s: "late" },
              { n: "Diallo, Fatou", s: "absent" },
              { n: "Eze, Chisom", s: "present" },
            ].map(({ n, s }) => (
              <div key={n} className="flex items-center justify-between rounded-lg px-2.5 py-1.5"
                style={{
                  background: s === "absent" ? "oklch(97% 0.01 27)" : s === "late" ? "oklch(97% 0.015 65)" : "oklch(100% 0 0)",
                  border: "1px solid var(--c-border)",
                }}
              >
                <span className="text-xs font-medium" style={{ color: "var(--c-text)" }}>{n}</span>
                <span className="text-xs font-semibold capitalize" style={{
                  color: s === "absent" ? "var(--c-red)" : s === "late" ? "var(--c-gold)" : "var(--c-emerald)",
                }}>{s}</span>
              </div>
            ))}
          </div>
          <button type="button" className="w-full mt-3 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "var(--c-emerald)" }}>
            Save — parents notified
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Marquee ─────────────────────────────────────────────────────────────────

function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <section
      style={{
        borderTop: "1px solid var(--c-border)",
        borderBottom: "1px solid var(--c-border)",
        background: "var(--c-surface)",
        padding: "16px 0",
        overflow: "hidden",
      }}
      aria-label="Trusted by schools worldwide"
    >
      <div className="marquee-outer">
        <div className="marquee-track" aria-hidden>
          {doubled.map((item, i) => (
            <span key={i} className="marquee-item">
              <span style={{ fontSize: "1rem" }}>{item.flag}</span>
              {item.text}
              <span className="marquee-dot" />
            </span>
          ))}
        </div>
      </div>
      <p className="sr-only">Trusted by 800+ schools including Heritage International School, Brightwood Academy, Thornbury Prep, and many more.</p>
    </section>
  )
}

// ─── Value Props ──────────────────────────────────────────────────────────────

function ValuePropsSection() {
  const { ref, visible } = useReveal()
  const PROPS = [
    {
      icon: Bell,
      title: "Instant parent alerts",
      body: "Absence notifications in under 2 minutes. Every parent, every time, before they've left their morning meeting.",
    },
    {
      icon: BookOpen,
      title: "Homework that sticks",
      body: "Assignments with deadlines, file attachments, and grade tracking. No more lost paper slips.",
    },
    {
      icon: Brain,
      title: "AI that saves hours",
      body: "Report writing, lesson summaries, and predictive attendance alerts — all powered by Anthropic's Claude.",
    },
    {
      icon: BarChart3,
      title: "School health at a glance",
      body: "One score. Every metric. Updated in real-time from any device, any timezone.",
    },
  ]

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ background: "var(--c-bg)", padding: "clamp(72px, 10vw, 112px) 20px" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-14 lg:gap-20 items-start">
          {/* Left: heading */}
          <div className={`reveal ${visible ? "visible" : ""}`}>
            <p className="section-label">What you get</p>
            <h2
              className="font-display"
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                fontWeight: 800,
                color: "var(--c-text)",
                lineHeight: 1.12,
                letterSpacing: "-0.025em",
              }}
            >
              Everything your school needs to communicate better.
            </h2>
          </div>

          {/* Right: 2×2 feature grid */}
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-10">
            {PROPS.map((p, i) => {
              const Icon = p.icon
              return (
                <div
                  key={p.title}
                  className={`reveal reveal-delay-${i + 1} ${visible ? "visible" : ""}`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "var(--c-indigo-bg)" }}
                    aria-hidden
                  >
                    <Icon size={18} style={{ color: "var(--c-indigo)" }} />
                  </div>
                  <h3
                    className="font-semibold mb-2"
                    style={{ fontSize: "1.0625rem", color: "var(--c-text)", lineHeight: 1.3, letterSpacing: "-0.01em" }}
                  >
                    {p.title}
                  </h3>
                  <p style={{ fontSize: "0.9375rem", color: "var(--c-text-mid)", lineHeight: 1.75 }}>
                    {p.body}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Problem section ──────────────────────────────────────────────────────────

function ProblemSection() {
  const { ref, visible } = useReveal()
  const problems = [
    {
      num: "01",
      title: "The email no one opens",
      body: "An inbox at 847 unread. Urgent notices buried under newsletters and promotions. Parents read it three days late — if at all.",
    },
    {
      num: "02",
      title: "The WhatsApp group at 11pm",
      body: "Fee reminders disappear under memes. Teachers can't separate personal life from school. Their personal number exposed to 150 parents.",
    },
    {
      num: "03",
      title: "The parent who finds out too late",
      body: "Your child was absent three days ago. The school sent a note. You never saw it.",
    },
  ]

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ background: "var(--c-surface)", padding: "clamp(80px, 12vw, 130px) 20px" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-14 lg:gap-20 items-start">
          {/* Left: editorial heading */}
          <div className={`reveal ${visible ? "visible" : ""}`}>
            <p className="section-label" style={{ color: "var(--c-gold)" }}>Sound familiar?</p>
            <h2
              className="font-display"
              style={{
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 800,
                color: "var(--c-text)",
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                marginBottom: "1.5rem",
              }}
            >
              Schools deserve better than email chaos.
            </h2>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "var(--c-text-mid)",
                lineHeight: 1.8,
                marginBottom: "2.5rem",
              }}
            >
              Parents receive information through 4 to 6 disconnected channels simultaneously. Teachers spend 3 to 5 hours a week on communication that has nothing to do with teaching.
            </p>
            <div className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--c-indigo)" }}
                aria-hidden
              >
                <Check size={10} className="text-white" strokeWidth={3} />
              </div>
              <p className="font-semibold" style={{ fontSize: "0.9375rem", color: "var(--c-text)" }}>
                Scholr fixes all three.
              </p>
            </div>
          </div>

          {/* Right: clean problem cards */}
          <div className="space-y-3">
            {problems.map((p, i) => (
              <div
                key={p.num}
                className={`card card-hover reveal reveal-delay-${i + 1} ${visible ? "visible" : ""}`}
                style={{ padding: "28px 32px", display: "flex", gap: "24px", alignItems: "flex-start" }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--c-text-muted)",
                    letterSpacing: "0.08em",
                    flexShrink: 0,
                    paddingTop: "3px",
                  }}
                  aria-hidden
                >
                  {p.num}
                </span>
                <div>
                  <h3
                    className="font-semibold mb-2"
                    style={{ fontSize: "1.0625rem", color: "var(--c-text)", lineHeight: 1.3, letterSpacing: "-0.01em" }}
                  >
                    {p.title}
                  </h3>
                  <p style={{ fontSize: "0.9375rem", color: "var(--c-text-mid)", lineHeight: 1.75 }}>
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Role showcase ────────────────────────────────────────────────────────────

function RoleShowcase() {
  const [active, setActive] = useState(0)
  const { ref, visible } = useReveal()
  const tab = ROLE_TABS[active]

  return (
    <section
      id="roles"
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ padding: "clamp(80px, 12vw, 130px) 20px", background: "var(--c-bg)" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <p className="section-label">Built for every role</p>
          <h2
            className={`font-display reveal ${visible ? "visible" : ""}`}
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "var(--c-text)", lineHeight: 1.08, letterSpacing: "-0.025em" }}
          >
            Three portals. One platform.
          </h2>
        </div>

        <div className="flex justify-center mb-10" role="tablist" aria-label="User role">
          <div style={{
            display: "inline-flex",
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: 14,
            padding: 4,
            gap: 2,
          }}>
            {ROLE_TABS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active === i}
                aria-controls={`panel-${t.id}`}
                id={`tab-${t.id}`}
                className={`role-tab${active === i ? " role-tab-active" : ""}`}
                style={{
                  background: active === i ? "var(--c-bg)" : "transparent",
                  color: active === i ? "var(--c-indigo)" : "var(--c-text-muted)",
                  boxShadow: active === i ? "var(--shadow-sm)" : "none",
                  fontWeight: active === i ? 600 : 500,
                  transition: "background 200ms var(--ease-out), color 200ms var(--ease-out), box-shadow 200ms var(--ease-out)",
                }}
                onClick={() => setActive(i)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          className="grid lg:grid-cols-2 gap-10 items-center"
          key={tab.id}
          style={{ animation: "slide-up-fade 400ms var(--ease-out) both" }}
        >
          <div>
            <h3
              className="font-display mb-4"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 800, color: "var(--c-text)", lineHeight: 1.08, letterSpacing: "-0.025em" }}
            >
              {tab.headline}
            </h3>
            <p style={{ fontSize: "1.0625rem", color: "var(--c-text-mid)", lineHeight: 1.75, maxWidth: "44ch", marginBottom: "2rem" }}>
              {tab.sub}
            </p>
            <ul className="space-y-3.5 mb-8">
              {tab.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: tab.mockupColor }}
                  >
                    <Check size={11} className="text-white" aria-hidden strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: "0.9375rem", color: "var(--c-text)", lineHeight: 1.6 }}>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="/signup"
              className="hero-cta-primary group inline-flex"
              style={{
                background: tab.mockupColor,
                color: "white",
                boxShadow: "none",
              }}
            >
              Get started free
              <span
                className="hero-cta-icon"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <ArrowRight size={14} aria-hidden />
              </span>
            </a>
          </div>
          <div className="flex justify-center lg:justify-end">
            <RoleMockup tab={tab} />
          </div>
        </div>
      </div>
    </section>
  )
}

function RoleMockup({ tab }: { tab: typeof ROLE_TABS[0] }) {
  if (tab.id === "parent") return <ParentMockup color={tab.mockupColor} />
  if (tab.id === "teacher") return <TeacherMockup color={tab.mockupColor} />
  return <AdminMockup color={tab.mockupColor} />
}

function ParentMockup({ color }: { color: string }) {
  return (
    <div className="phone-frame phone-float" style={{ width: 280 }}>
      <div className="px-4 py-3" style={{ background: color }}>
        <p className="text-xs font-semibold text-white/90">Parent Portal</p>
        <p className="text-xs text-white/60">Good morning, Maria</p>
      </div>
      <div className="p-3 space-y-2.5" style={{ background: "var(--c-surface)" }}>
        <div className="rounded-xl p-3" style={{ background: "oklch(100% 0 0)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: color }} aria-hidden>A</div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>Amara Osei-Mensah</p>
              <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>Class 6B · Term 2, Week 3</p>
            </div>
            <div className="ml-auto w-2.5 h-2.5 rounded-full" style={{ background: "var(--c-emerald)" }} aria-label="Active today" />
          </div>
          <div className="h-px mb-3" style={{ background: "var(--c-border)" }} />
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Attendance", value: "97%", color: "var(--c-emerald)" },
              { label: "Assignments", value: "2 pending", color: "var(--c-gold)" },
              { label: "Last grade", value: "A (92%)", color },
              { label: "New messages", value: "1", color: "var(--c-indigo)" },
            ].map(({ label, value, color: c }) => (
              <div key={label} className="rounded-lg p-2.5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--c-text-muted)" }}>{label}</p>
                <p className="text-sm font-bold" style={{ color: c }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl p-2.5" style={{ background: "oklch(100% 0 0)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>Weekly Report</p>
            <span className="badge badge-pro">✦ Pro</span>
          </div>
          <div className="rounded-lg p-2.5" style={{ background: "var(--c-indigo-bg)" }}>
            <p className="text-xs font-bold mb-1" style={{ color: "var(--c-indigo)" }}>Excellent week, Amara</p>
            <p className="text-xs" style={{ color: "var(--c-text-mid)" }}>5/5 days · 4/4 assignments · 2 teacher notes</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TeacherMockup({ color }: { color: string }) {
  return (
    <div className="phone-frame phone-float" style={{ width: 280 }}>
      <div className="px-4 py-3" style={{ background: color }}>
        <p className="text-xs font-semibold text-white/90">Attendance · Class 6B</p>
        <p className="text-xs text-white/60">Monday 2 June · 28 of 30 marked</p>
      </div>
      <div className="p-3" style={{ background: "var(--c-surface)" }}>
        <div className="flex gap-2 mb-3">
          {["All present", "Mark exceptions"].map((label, i) => (
            <button key={label} type="button" className="flex-1 py-1.5 rounded-lg text-xs font-semibold" style={{
              background: i === 0 ? color : "oklch(100% 0 0)",
              color: i === 0 ? "oklch(100% 0 0)" : "var(--c-text-mid)",
              border: i === 0 ? "none" : "1px solid var(--c-border)",
            }}>{label}</button>
          ))}
        </div>
        <div className="space-y-1.5">
          {[
            { n: "Adeyemi, Kofi", s: "present" },
            { n: "Bannister, Lucy", s: "present" },
            { n: "Chen, Marcus", s: "late" },
            { n: "Diallo, Fatou", s: "absent" },
            { n: "Eze, Chisom", s: "present" },
            { n: "Foster, Mia", s: "present" },
          ].map(({ n, s }) => (
            <div key={n} className="flex items-center justify-between rounded-lg px-2.5 py-2" style={{
              background: s === "absent" ? "oklch(97% 0.01 27)" : s === "late" ? "oklch(97% 0.015 65)" : "oklch(100% 0 0)",
              border: "1px solid var(--c-border)",
            }}>
              <span className="text-xs font-medium" style={{ color: "var(--c-text)" }}>{n}</span>
              <span className="text-xs font-semibold capitalize" style={{
                color: s === "absent" ? "var(--c-red)" : s === "late" ? "var(--c-gold)" : "var(--c-emerald)",
              }}>{s}</span>
            </div>
          ))}
        </div>
        <button type="button" className="w-full mt-3 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: color }}>
          Confirm — parents notified instantly
        </button>
      </div>
    </div>
  )
}

function AdminMockup({ color }: { color: string }) {
  return (
    <div className="phone-frame phone-float" style={{ width: 280 }}>
      <div className="px-4 py-3" style={{ background: "var(--c-navy)" }}>
        <p className="text-xs font-semibold text-white/90">School Dashboard</p>
        <p className="text-xs text-white/60">Heritage International · Abuja</p>
      </div>
      <div className="p-3 space-y-2.5" style={{ background: "var(--c-surface)" }}>
        <div className="rounded-xl p-4 text-center" style={{ background: "var(--c-navy)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "oklch(55% 0.012 264)" }}>School Health Score</p>
          <p className="font-display font-bold mb-1" style={{ fontSize: "3rem", color, lineHeight: 1.1 }}>84</p>
          <p className="text-xs" style={{ color: "oklch(55% 0.012 264)" }}>+3 pts from last week</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { l: "Parent open rate", v: "86%", up: true },
            { l: "Avg response time", v: "4.2h", up: true },
            { l: "Fee collection", v: "78%", up: false },
            { l: "AI usage", v: "61%", up: true },
          ].map(({ l, v, up }) => (
            <div key={l} className="rounded-lg p-2.5" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--c-text-muted)" }}>{l}</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold" style={{ color: "var(--c-text)" }}>{v}</p>
                <span style={{ fontSize: "0.625rem", color: up ? "var(--c-emerald)" : "var(--c-red)" }}>{up ? "↑" : "↓"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Weekly Report ────────────────────────────────────────────────────────────

function WeeklyReportSection() {
  const { ref, visible } = useReveal()
  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ background: "var(--c-navy)", padding: "clamp(80px, 12vw, 130px) 20px" }}
    >
      <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <div className="badge badge-pro mb-6" style={{ fontSize: "0.6875rem", letterSpacing: "0.08em" }}>
            <Sparkles size={12} aria-hidden />
            Signature Feature
          </div>
          <h2
            className={`font-display mb-6 reveal ${visible ? "visible" : ""}`}
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "oklch(97% 0.005 264)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
          >
            Every Friday, your child's week — in seconds.
          </h2>
          <p
            className={`mb-8 reveal reveal-delay-1 ${visible ? "visible" : ""}`}
            style={{ fontSize: "1.0625rem", color: "oklch(62% 0.01 264)", lineHeight: 1.8, maxWidth: "44ch" }}
          >
            Attendance. Homework submitted vs missed. Every teacher comment posted that week. An AI-generated encouragement note, personal to your child. Automatically, every Friday at 5pm.
          </p>
          <ul className={`space-y-3 mb-10 reveal reveal-delay-2 ${visible ? "visible" : ""}`}>
            {[
              "Days present visualised as a simple bar",
              "Homework: submitted vs assigned with green/amber/red",
              "AI note: warm, specific, never generic",
              "'This Week in Class' — from the teacher's lesson notes",
              "Next week preview: events, assignments already posted",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "oklch(62% 0.15 65 / 0.2)", border: "1px solid oklch(62% 0.15 65 / 0.4)" }}>
                  <Check size={10} style={{ color: "var(--c-gold)" }} aria-hidden strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: "0.9375rem", color: "oklch(72% 0.01 264)", lineHeight: 1.6 }}>{item}</span>
              </li>
            ))}
          </ul>
          <div
            className={`inline-flex items-start gap-3 p-4 rounded-2xl reveal reveal-delay-3 ${visible ? "visible" : ""}`}
            style={{ background: "oklch(62% 0.15 65 / 0.08)", border: "1px solid oklch(62% 0.15 65 / 0.2)", maxWidth: "44ch" }}
          >
            <TrendingUp size={18} style={{ color: "var(--c-gold)", flexShrink: 0, marginTop: 2 }} aria-hidden />
            <p style={{ fontSize: "0.875rem", color: "oklch(70% 0.012 264)", lineHeight: 1.65 }}>
              Schools sending the Weekly Report see parent NPS climb by an average of <strong style={{ color: "oklch(90% 0.01 264)" }}>22 points</strong> within one term.
            </p>
          </div>
        </div>

        <div className={`flex justify-center lg:justify-end reveal reveal-delay-2 ${visible ? "visible" : ""}`}>
          <div style={{ width: 300 }}>
            <div className="phone-frame phone-float">
              <div className="px-5 py-4"
                style={{ background: "linear-gradient(135deg, oklch(46% 0.22 264) 0%, oklch(38% 0.2 280) 100%)" }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-white/70">Weekly Intelligence Report</p>
                  <span className="badge badge-pro">✦ Pro</span>
                </div>
                <p className="text-base font-bold text-white">Amara Osei-Mensah</p>
                <p className="text-xs text-white/60">Week 3 · Term 2 · Friday, 30 May 2025</p>
              </div>
              <div className="p-4 space-y-3.5" style={{ background: "var(--c-surface)" }}>
                <div className="rounded-xl p-3.5" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>Attendance this week</p>
                    <span className="text-xs font-bold" style={{ color: "var(--c-emerald)" }}>5/5</span>
                  </div>
                  <div className="flex gap-1.5">
                    {["M","T","W","T","F"].map((d) => (
                      <div key={d} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full h-10 rounded-md" style={{ background: "var(--c-emerald)" }} />
                        <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{d}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-3.5" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>Homework</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "oklch(95% 0.015 162)", color: "var(--c-emerald)" }}>4 of 4</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--c-border)" }}>
                    <div className="h-full rounded-full" style={{ width: "100%", background: "var(--c-emerald)" }} />
                  </div>
                </div>
                <div className="rounded-xl p-3.5" style={{ background: "var(--c-indigo-bg)", border: "1px solid var(--c-border)" }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={12} style={{ color: "var(--c-indigo)" }} aria-hidden />
                    <p className="text-xs font-semibold" style={{ color: "var(--c-indigo)" }}>This week's note</p>
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--c-text-mid)", lineHeight: 1.6 }}>
                    "Amara showed exceptional focus this week, particularly during the science practical. Her question impressed the whole class."
                  </p>
                </div>
                <div className="rounded-xl p-3.5" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--c-text)" }}>Next week</p>
                  <div className="space-y-1.5">
                    {[{ icon: Calendar, text: "Sports Day — Tuesday 6 June" }, { icon: BookOpen, text: "Maths test — Thursday 8 June" }].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2">
                        <Icon size={11} style={{ color: "var(--c-text-muted)", flexShrink: 0 }} aria-hidden />
                        <p style={{ fontSize: "0.8125rem", color: "var(--c-text-mid)" }}>{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── AI Features ──────────────────────────────────────────────────────────────

function AIFeaturesSection() {
  const { ref, visible } = useReveal()
  const featured = AI_FEATURES[0]
  const rest = AI_FEATURES.slice(1)

  return (
    <section
      id="features"
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ padding: "clamp(80px, 12vw, 130px) 20px", background: "var(--c-bg)" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className={`reveal ${visible ? "visible" : ""}`}>
            <p className="section-label">AI-powered</p>
            <h2
              className="font-display"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "var(--c-text)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
            >
              Intelligent features that<br />save hours, not minutes.
            </h2>
          </div>
          <p
            className={`reveal reveal-delay-1 ${visible ? "visible" : ""}`}
            style={{ fontSize: "0.9375rem", color: "var(--c-text-mid)", maxWidth: "36ch", lineHeight: 1.75, flexShrink: 0 }}
          >
            Every AI feature is powered by Anthropic's Claude API. Fully auditable, fully deletable.
          </p>
        </div>

        {/* Bento: large featured + 2 stacked */}
        <div
          className="grid gap-4 mb-5"
          style={{ gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto auto" }}
        >
          {/* Featured card — spans 2 rows */}
          <AICard feature={featured} delay={0} visible={visible} featured />

          {/* Small cards */}
          {rest.map((f, i) => (
            <AICard key={f.id} feature={f} delay={i + 1} visible={visible} featured={false} />
          ))}
        </div>

        <div
          className={`p-5 rounded-2xl text-center reveal reveal-delay-3 ${visible ? "visible" : ""}`}
          style={{ background: "var(--c-indigo-bg)", border: "1px solid oklch(80% 0.06 264)" }}
        >
          <p style={{ fontSize: "0.9375rem", color: "var(--c-text-mid)", lineHeight: 1.65, maxWidth: "none", margin: "0 auto" }}>
            All AI features are powered by <strong style={{ color: "var(--c-text)" }}>Anthropic's Claude API</strong>. Every output is tied to your school, fully auditable, and deletable on request.
          </p>
        </div>
      </div>
    </section>
  )
}

function AICard({
  feature, delay, visible, featured,
}: {
  feature: typeof AI_FEATURES[0]
  delay: number
  visible: boolean
  featured: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const Icon = feature.icon
  const delayClass = `reveal-delay-${delay + 1}` as const

  return (
    <div
      className={`bezel-outer reveal ${delayClass} ${visible ? "visible" : ""}`}
      style={{ gridRow: featured ? "1 / 3" : undefined }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="bezel-inner h-full" style={{ padding: featured ? "32px" : "28px" }}>
        <div className="flex items-center justify-between mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--c-indigo-bg)" }}>
            <Icon size={18} style={{ color: "var(--c-indigo)" }} aria-hidden />
          </div>
          <span className="badge badge-ai">{feature.tag}</span>
        </div>
        <h3 className="font-semibold mb-2" style={{ fontSize: featured ? "1.25rem" : "1rem", color: "var(--c-text)", lineHeight: 1.3 }}>
          {feature.title}
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--c-text-mid)", lineHeight: 1.7, marginBottom: 16 }}>
          {feature.body}
        </p>
        <div
          className="ai-card-preview-panel"
          aria-hidden
          style={{
            height: hovered ? (featured ? 180 : 120) : 0,
            opacity: hovered ? 1 : 0,
            transition: "height 320ms var(--ease-out), opacity 260ms var(--ease-out)",
          }}
        >
          <div style={{
            background: "var(--c-navy)",
            borderRadius: 12,
            padding: "14px 16px",
            fontFamily: "monospace",
            fontSize: "0.75rem",
            lineHeight: 1.75,
            color: "oklch(68% 0.01 264)",
            height: "100%",
            overflow: "hidden",
          }}>
            {feature.lines.map((line, i) => (
              <div key={i} style={{
                color: line.startsWith("\"") ? "oklch(82% 0.01 264)"
                  : line.startsWith("⚠") || line.startsWith("→") ? "var(--c-gold)"
                  : line.startsWith("Input") ? "oklch(75% 0.12 264)"
                  : undefined,
              }}>
                {line || " "}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function PricingSection() {
  const [annual, setAnnual] = useState(false)
  const { ref, visible } = useReveal()

  return (
    <section
      id="pricing"
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ padding: "clamp(80px, 12vw, 130px) 20px", background: "var(--c-surface)" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div>
            <p className="section-label">Pricing</p>
            <h2
              className={`font-display reveal ${visible ? "visible" : ""}`}
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "var(--c-text)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
            >
              Per school. Not per<br />teacher, not per parent.
            </h2>
          </div>
          <div className="flex flex-col items-start md:items-end gap-4 flex-shrink-0">
            <p
              className={`reveal reveal-delay-1 ${visible ? "visible" : ""}`}
              style={{ fontSize: "1.0rem", color: "var(--c-text-mid)", maxWidth: "38ch", lineHeight: 1.7, textAlign: "right" }}
            >
              One flat monthly fee. Every parent, teacher, and admin gets access.
            </p>
            <div className="billing-toggle">
              <button type="button" className={`billing-option ${!annual ? "active" : ""}`} onClick={() => setAnnual(false)}>
                Monthly
              </button>
              <button type="button" className={`billing-option ${annual ? "active" : ""}`} onClick={() => setAnnual(true)}>
                Annual
                <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(95% 0.015 162)", color: "var(--c-emerald)" }}>
                  2 months free
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} annual={annual} delay={i} visible={visible} />
          ))}
        </div>

        <p className="text-center mt-8 text-sm" style={{ color: "var(--c-text-muted)" }}>
          All plans include a 14-day free Pro trial. No credit card required.
        </p>
      </div>
    </section>
  )
}

function PlanCard({
  plan, annual, delay, visible,
}: {
  plan: typeof PLANS[0]
  annual: boolean
  delay: number
  visible: boolean
}) {
  const price = plan.monthlyPrice === null
    ? "Custom"
    : annual && plan.annualPrice !== undefined && plan.annualPrice !== null
    ? `$${plan.annualPrice}`
    : plan.monthlyPrice === 0
    ? "$0"
    : `$${plan.monthlyPrice}`

  const delayClass = `reveal-delay-${delay + 1}` as const

  if (plan.highlight) {
    return (
      <div className={`glass-pro-card reveal ${delayClass} ${visible ? "visible" : ""} relative`}
        style={{ padding: 32, display: "flex", flexDirection: "column" }}>
        {plan.badge && (
          <div style={{
            position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
            background: "oklch(100% 0 0)", color: "var(--c-indigo)",
            fontSize: "0.75rem", fontWeight: 700, padding: "5px 14px",
            borderRadius: 20, whiteSpace: "nowrap",
          }}>
            {plan.badge}
          </div>
        )}
        <div className="mb-6">
          <p className="font-semibold mb-1" style={{ fontSize: "1rem", color: "oklch(100% 0 0 / 0.7)" }}>{plan.name}</p>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="font-display font-bold" style={{ fontSize: "2.5rem", color: "white", lineHeight: 1.1 }}>
              {price}
            </span>
            {plan.period && (
              <span style={{ fontSize: "0.875rem", color: "oklch(100% 0 0 / 0.55)" }}>
                {plan.period}{annual && plan.monthlyPrice ? " · billed annually" : ""}
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.875rem", color: "oklch(100% 0 0 / 0.55)" }}>{plan.sub}</p>
        </div>
        <ul className="flex-1 space-y-2.5 mb-8">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5">
              <Check size={14} style={{ color: "oklch(80% 0.15 264)", flexShrink: 0, marginTop: 3 }} aria-hidden strokeWidth={2.5} />
              <span style={{ fontSize: "0.9rem", color: "oklch(100% 0 0 / 0.75)", lineHeight: 1.55 }}>{f}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          style={{
            width: "100%", padding: "13px 20px", borderRadius: "var(--r-btn)", fontWeight: 700,
            fontSize: "0.9375rem", cursor: "pointer",
            background: "oklch(100% 0 0)", color: "var(--c-indigo)", border: "none",
            transition: "background 180ms var(--ease-out), transform 160ms var(--ease-out)",
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)" }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)" }}
        >
          {plan.cta}
        </button>
      </div>
    )
  }

  return (
    <div
      className={`card card-hover reveal ${delayClass} ${visible ? "visible" : ""}`}
      style={{ padding: 28, display: "flex", flexDirection: "column" }}
    >
      <div className="mb-6">
        <p className="font-semibold mb-1" style={{ fontSize: "1rem", color: "var(--c-text)" }}>{plan.name}</p>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="font-display font-bold" style={{ fontSize: "2.5rem", color: "var(--c-text)", lineHeight: 1.1 }}>
            {price}
          </span>
          {plan.period && (
            <span style={{ fontSize: "0.875rem", color: "var(--c-text-muted)" }}>
              {plan.period}
            </span>
          )}
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--c-text-muted)" }}>{plan.sub}</p>
      </div>
      <ul className="flex-1 space-y-2.5 mb-8">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check size={14} style={{ color: "var(--c-emerald)", flexShrink: 0, marginTop: 3 }} aria-hidden strokeWidth={2.5} />
            <span style={{ fontSize: "0.9rem", color: "var(--c-text-mid)", lineHeight: 1.55 }}>{f}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        style={{
          width: "100%", padding: "12px 20px", borderRadius: "var(--r-btn)",
          fontWeight: 600, fontSize: "0.9375rem", cursor: "pointer",
          background: "transparent", color: "var(--c-text)",
          border: "1.5px solid var(--c-border-mid)",
          transition: "border-color 180ms var(--ease-out), background 180ms var(--ease-out), transform 160ms var(--ease-out)",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--c-indigo)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--c-border-mid)" }}
        onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)" }}
        onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)" }}
      >
        {plan.cta}
      </button>
    </div>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function TestimonialsSection() {
  const { ref, visible } = useReveal()
  return (
    <section
      id="testimonials"
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ padding: "clamp(80px, 12vw, 130px) 20px", background: "var(--c-bg)", overflow: "hidden" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <p className="section-label">What schools say</p>
          <h2
            className={`font-display reveal ${visible ? "visible" : ""}`}
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, color: "var(--c-text)", lineHeight: 1.05, letterSpacing: "-0.025em" }}
          >
            Schools that made the switch.
          </h2>
        </div>

        <div
          className={`testimonial-scroll reveal ${visible ? "visible" : ""}`}
          style={{ padding: "4px 0 16px" }}
        >
          {TESTIMONIALS.map((t) => (
            <figure key={t.id} className="testimonial-card">
              <div
                className="bezel-outer h-full"
                style={{ borderRadius: "22px", height: "100%" }}
              >
                <div className="bezel-inner h-full" style={{ padding: "28px", borderRadius: "calc(22px - 4px)" }}>
                  <div className="flex gap-0.5 mb-4" aria-label="5 out of 5 stars">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={13} style={{ fill: "var(--c-gold)", color: "var(--c-gold)" }} aria-hidden />
                    ))}
                  </div>
                  <blockquote
                    style={{ fontSize: "0.9375rem", color: "var(--c-text-mid)", lineHeight: 1.8, marginBottom: 24 }}
                  >
                    "{t.quote}"
                  </blockquote>
                  <figcaption className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: t.color }}
                      aria-hidden
                    >
                      {t.init}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>{t.name}</p>
                      <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{t.role} · {t.school}</p>
                      <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>{t.location}</p>
                    </div>
                  </figcaption>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatsSection() {
  const STATS = [
    { target: 800, suffix: "+", label: "Schools onboarded" },
    { target: 86, suffix: "%", label: "Parent open rate" },
    { target: 4, suffix: ".9★", label: "Average rating" },
    { target: 43, suffix: "s", label: "Average notification time" },
  ]

  return (
    <section
      style={{ background: "var(--c-surface)", padding: "clamp(64px, 8vw, 96px) 20px", borderTop: "1px solid var(--c-border)", borderBottom: "1px solid var(--c-border)" }}
      aria-label="Platform statistics"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((stat) => (
          <StatItem key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  )
}

function StatItem({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const { ref, value } = useCounter(target, 1800)
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="text-center">
      <p
        className="font-display counter-value"
        style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 800, color: "var(--c-text)", lineHeight: 1.1, letterSpacing: "-0.03em" }}
      >
        {value}{suffix}
      </p>
      <p style={{ fontSize: "0.8125rem", color: "var(--c-text-muted)", marginTop: 6, fontWeight: 500 }}>{label}</p>
    </div>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  const { ref, visible } = useReveal()
  const toggle = useCallback((i: number) => setOpen((cur) => cur === i ? null : i), [])

  return (
    <section
      style={{ padding: "clamp(80px, 12vw, 130px) 20px", background: "var(--c-surface)" }}
      ref={ref as React.RefObject<HTMLDivElement>}
    >
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.6fr] gap-14 lg:gap-20 items-start">
        <div className={`reveal ${visible ? "visible" : ""}`}>
          <p className="section-label">FAQ</p>
          <h2
            className="font-display"
            style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", fontWeight: 800, color: "var(--c-text)", lineHeight: 1.05, letterSpacing: "-0.025em", marginBottom: "1rem" }}
          >
            Common questions
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--c-text-mid)", lineHeight: 1.75 }}>
            Everything you need to know before getting started. Can't find what you're looking for? Chat with us.
          </p>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} style={{ borderBottom: i < FAQ_ITEMS.length - 1 ? "1px solid var(--c-border)" : "none" }}>
              <button
                type="button"
                aria-expanded={open === i}
                aria-controls={`faq-${i}`}
                id={`faq-btn-${i}`}
                className="faq-item-btn"
                onClick={() => toggle(i)}
              >
                <span style={{
                  fontSize: "0.9375rem",
                  fontWeight: open === i ? 600 : 500,
                  color: open === i ? "var(--c-indigo)" : "var(--c-text)",
                  lineHeight: 1.5,
                  transition: "color 150ms var(--ease-out)",
                }}>
                  {item.q}
                </span>
                <ChevronDown size={18} className="faq-chevron" aria-hidden />
              </button>
              <div
                id={`faq-${i}`}
                role="region"
                aria-labelledby={`faq-btn-${i}`}
                className={`faq-answer ${open === i ? "open" : ""}`}
              >
                <p style={{ padding: "0 24px 22px", fontSize: "0.9375rem", color: "var(--c-text-mid)", lineHeight: 1.75 }}>
                  {item.a}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  const { ref, visible } = useReveal()
  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{
        padding: "clamp(80px, 14vw, 140px) 20px",
        background: "var(--c-navy)",
        position: "relative",
        overflow: "hidden",
      }}
      aria-label="Get started with Scholr"
    >
      {/* Glow */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 60% at 50% 50%, oklch(46% 0.22 264 / 0.2) 0%, transparent 70%)",
      }} />
      <div className="max-w-3xl mx-auto text-center relative">
        <h2
          className={`font-display mb-6 reveal ${visible ? "visible" : ""}`}
          style={{ fontSize: "clamp(2.25rem, 5vw, 3.75rem)", fontWeight: 800, color: "oklch(97% 0.005 264)", lineHeight: 1.0, letterSpacing: "-0.03em" }}
        >
          Your school deserves better than WhatsApp.
        </h2>
        <p
          className={`mb-10 reveal reveal-delay-1 ${visible ? "visible" : ""}`}
          style={{
            fontSize: "1.125rem",
            color: "oklch(60% 0.012 264)",
            maxWidth: "44ch",
            margin: "0 auto 40px",
            lineHeight: 1.8,
          }}
        >
          Join 800+ schools across the US, UK, Nigeria, Ghana, and Canada. Setup takes 15 minutes. Free for schools under 100 students, forever.
        </p>
        <div className={`flex flex-col sm:flex-row gap-4 justify-center reveal reveal-delay-2 ${visible ? "visible" : ""}`}>
          <a
            href="/signup"
            className="hero-cta-primary group"
            style={{
              background: "oklch(100% 0 0)",
              color: "var(--c-indigo)",
              justifyContent: "center",
            }}
          >
            Get your school on Scholr — it's free
            <span className="hero-cta-icon">
              <ArrowRight size={15} aria-hidden />
            </span>
          </a>
          <button
            type="button"
            className="hero-cta-ghost"
            style={{ justifyContent: "center" }}
          >
            Talk to us first
          </button>
        </div>
        <p
          className={`mt-8 text-sm reveal reveal-delay-3 ${visible ? "visible" : ""}`}
          style={{ color: "oklch(45% 0.008 264)" }}
        >
          No credit card required · Cancel anytime · FERPA and GDPR compliant
        </p>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer aria-label="Site footer" style={{ background: "oklch(8% 0.02 264)", padding: "64px 20px 32px" }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <a href="/" aria-label="Scholr home" className="flex items-center gap-2.5 mb-4" style={{ textDecoration: "none" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--c-indigo)" }}>
                <GraduationCap size={16} className="text-white" aria-hidden />
              </div>
              <span className="font-display text-xl" style={{ fontWeight: 800, letterSpacing: "-0.03em", color: "oklch(97% 0.005 264)" }}>Scholr</span>
            </a>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "oklch(50% 0.01 264)", maxWidth: "28ch" }}>
              Premium school communication for modern schools. Where parents, teachers, and families connect.
            </p>
            <div className="flex gap-3 flex-wrap">
              {["🇺🇸", "🇬🇧", "🇳🇬", "🇬🇭", "🇨🇦"].map((flag) => (
                <span key={flag} className="text-lg" aria-hidden>{flag}</span>
              ))}
            </div>
          </div>
          {FOOTER_NAV.map((col) => (
            <nav key={col.title} aria-label={`${col.title} links`}>
              <p className="font-semibold text-sm mb-4" style={{ color: "oklch(97% 0.005 264)" }}>{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="/"
                      style={{ fontSize: "0.875rem", color: "oklch(48% 0.008 264)", textDecoration: "none", transition: "color 150ms var(--ease-out)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "oklch(78% 0.01 264)" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "oklch(48% 0.008 264)" }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid oklch(22% 0.02 264)" }}
        >
          <p style={{ fontSize: "0.8125rem", color: "oklch(38% 0.007 264)" }}>© 2026 Scholr. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
              <a key={l} href="/"
                style={{ fontSize: "0.8125rem", color: "oklch(38% 0.007 264)", textDecoration: "none", transition: "color 150ms var(--ease-out)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "oklch(65% 0.01 264)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "oklch(38% 0.007 264)" }}
              >
                {l}
              </a>
            ))}
          </div>
          <p style={{ fontSize: "0.8125rem", color: "oklch(38% 0.007 264)" }}>FERPA · GDPR · COPPA compliant</p>
        </div>
      </div>
    </footer>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)" }}>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <ValuePropsSection />
        <ProblemSection />
        <RoleShowcase />
        <WeeklyReportSection />
        <AIFeaturesSection />
        <PricingSection />
        <TestimonialsSection />
        <StatsSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
