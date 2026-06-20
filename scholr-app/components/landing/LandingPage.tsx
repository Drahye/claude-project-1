"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  ArrowRight, Bell, BookOpen, BarChart3,
  Calendar, Check, ChevronDown, FileText,
  GraduationCap, Sparkles, Star, TrendingUp,
  X, CheckCircle2, Users, LayoutDashboard,
  CreditCard, MessageSquare, Settings, Heart,
  Image as ImageIcon, Quote, Building2,
} from "lucide-react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import ThemeToggle from "@/components/ThemeToggle"
import SmoothScroll from "./SmoothScroll"

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

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

// ─── Photo slot ───────────────────────────────────────────────────────────────
// Renders a warm gradient placeholder until a real photo exists at `src`.
// Drop a file at /public/landing/<name>.webp and it loads automatically, no
// code change needed. Until then, the placeholder keeps the layout intact.

function Photo({
  src, alt, tag = "Photo", className = "", style, radius, priority = false,
}: {
  src?: string; alt: string; tag?: string; className?: string
  style?: React.CSSProperties; radius?: number | string; priority?: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  // Cached images can finish loading before onLoad attaches, catch that on mount.
  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true)
  }, [src])
  // Priority images (above-the-fold hero) load eagerly and show immediately —
  // no JS opacity gate and no dev label, so there's no placeholder flash.
  return (
    <div className={`w-photo ${className}`} style={{ borderRadius: radius, ...style }}>
      {src && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          // eslint-disable-next-line @next/next/no-img-element
          fetchPriority={priority ? "high" : "auto"}
          className={(loaded || priority) ? "loaded" : ""}
          style={{ borderRadius: radius }}
          onLoad={() => setLoaded(true)}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
        />
      )}
      {!loaded && !priority && (
        <span className="w-photo-tag">
          <ImageIcon size={24} strokeWidth={1.8} aria-hidden />
          <span style={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>{tag}</span>
        </span>
      )}
    </div>
  )
}

// ─── Motion helpers ───────────────────────────────────────────────────────────

// Staggered scroll reveal. `variant` picks the direction: up (default), left, right, scale.
function Rise({
  children, delay = 0, className = "", style, as: Tag = "div", variant = "up",
}: {
  children: React.ReactNode; delay?: number; className?: string
  style?: React.CSSProperties; as?: "div" | "li" | "span"
  variant?: "up" | "left" | "right" | "scale"
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); obs.disconnect() } },
      { threshold: 0.12, rootMargin: "-40px 0px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <Tag ref={ref as never} className={`w-rise w-rise-${variant} ${seen ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms`, ...style }}>
      {children}
    </Tag>
  )
}

// Gentle pointer-driven tilt/parallax for the hero collage (desktop only).
function useTilt<T extends HTMLElement>(strength = 8) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (window.matchMedia("(hover: none)").matches) return
    let raf = 0
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width - 0.5
        const y = (e.clientY - r.top) / r.height - 0.5
        el.style.transform = `perspective(1100px) rotateY(${x * strength}deg) rotateX(${-y * strength * 0.6}deg)`
      })
    }
    const reset = () => { cancelAnimationFrame(raf); el.style.transform = "perspective(1100px) rotateY(0) rotateX(0)" }
    const parent = el.parentElement ?? el
    parent.addEventListener("mousemove", onMove)
    parent.addEventListener("mouseleave", reset)
    return () => { parent.removeEventListener("mousemove", onMove); parent.removeEventListener("mouseleave", reset); cancelAnimationFrame(raf) }
  }, [strength])
  return ref
}

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV = [
  { label: "Features", href: "#features" },
  { label: "For families", href: "#roles" },
  { label: "Pricing", href: "/pricing" },
]

const ROLE_TABS = [
  {
    id: "admin",
    label: "I run a school",
    icon: Building2,
    headline: "See how your whole school is doing, at a glance.",
    sub: "One warm dashboard shows attendance, engagement and homework across every class. Lead with confidence, from anywhere.",
    features: [
      "A live School Health Score, in plain language",
      "Fee invoicing with friendly automatic reminders",
      "Engagement you can actually see, open rates and trends",
      "Every campus, one calm login",
    ],
    cta: "Bring Scholr to your school",
    ctaHref: "/signup",
    accent: "oklch(56% 0.15 42)",
  },
  {
    id: "parent",
    label: "I'm a parent",
    icon: Heart,
    headline: "Be there for the small moments, even from work.",
    sub: "A gold star in art. A missed homework. A note from the teacher. You'll know the moment it happens, gently, in one calm feed.",
    features: [
      "A kind heads-up if your child is marked absent, within minutes",
      "Homework, sorted by what's due next, never buried",
      "Your child's Friday story, written with care",
      "A warm, direct line to the class teacher",
    ],
    cta: "Find your child's school",
    ctaHref: "/find-school",
    accent: "var(--w-coral)",
  },
  {
    id: "teacher",
    label: "I'm a teacher",
    icon: GraduationCap,
    headline: "More time for teaching. Less time on admin.",
    sub: "Take the register in under a minute. Keep parents close without sharing your number. Let AI draft the reports, you keep the heart.",
    features: [
      "A whole class marked present in under 60 seconds",
      "Report drafts that sound like you, hours saved each term",
      "A calm, professional inbox, your phone stays yours",
      "Homework, files and grades, all in one place",
    ],
    cta: "Find your school",
    ctaHref: "/find-school",
    accent: "var(--w-amber)",
  },
]

const TESTIMONIALS = [
  {
    id: "t-1",
    quote: "I manage two campuses, one in Abuja, one in London. Scholr told me more in ten seconds than my old system told me in a month. The teachers feel it too.",
    name: "Dr. Adaeze Okonkwo",
    role: "Proprietor",
    school: "Heritage International School",
    location: "Abuja, Nigeria",
    init: "AO",
    photo: "/landing/avatar-1.jpg",
    accent: "var(--w-amber-ink)",
  },
  {
    id: "t-2",
    quote: "The Report Writer made one of my teachers cry happy tears. She used to lose three whole days a term to reports. That's over now, and her words still sound like her.",
    name: "Mrs. Patricia Coleman",
    role: "Head of Year 4",
    school: "Brightwood Academy",
    location: "Houston, TX",
    init: "PC",
    photo: "/landing/avatar-2.jpg",
    accent: "var(--w-amber)",
  },
  {
    id: "t-3",
    quote: "Friday at 5pm used to be when I'd anxiously check my phone. Now it's the moment I look forward to. My daughter's whole week, told with such warmth.",
    name: "James Osei-Mensah",
    role: "Parent of a Year 6 child",
    school: "Thornbury Prep School",
    location: "London, UK",
    init: "JO",
    photo: "/landing/avatar-3.jpg",
    accent: "var(--w-coral)",
  },
  {
    id: "t-4",
    quote: "Setup took eleven minutes. Our parents went from barely reading anything to replying within the hour. The whole school feels closer.",
    name: "Mr. Samuel Adekunle",
    role: "Head Teacher",
    school: "Greenfield College",
    location: "Lagos, Nigeria",
    init: "SA",
    photo: "/landing/avatar-4.jpg",
    accent: "var(--c-emerald)",
  },
  {
    id: "t-5",
    quote: "For the first time in twelve years, I'm not anxious about parent communication. It's all in one calm place, kind, clear, and parents actually respond.",
    name: "Ms. Chloe Fitzgerald",
    role: "Year 3 Teacher",
    school: "St. Raphael's Primary",
    location: "Dublin, Ireland",
    init: "CF",
    photo: "/landing/avatar-5.jpg",
    accent: "var(--w-lilac)",
  },
]

const FAQ_ITEMS = [
  { q: "Do parents need to download an app?", a: "No. Scholr is a Progressive Web App. Parents open a link from their invitation and tap 'Add to Home Screen' in Safari or Chrome. It looks and feels like a native app without any App Store visit." },
  { q: "Is Scholr FERPA and GDPR compliant?", a: "Yes. Student data is stored in isolated school accounts. No data is shared with third parties. Scholr supports full data deletion on school offboarding and is compliant with FERPA for US schools and GDPR for UK and EU schools." },
  { q: "How does the AI work?", a: "Scholr uses Anthropic's Claude API to power the Report Writer, your child's Friday story, the Lesson Summariser, and gentle attendance alerts. Every AI output is stored with your school ID and is fully auditable and deletable." },
  { q: "Can we import existing student data?", a: "Yes. Scholr accepts CSV imports for students, classes, and parent contact details. A guided setup wizard walks through the import in under 10 minutes." },
  { q: "What happens when we reach the free tier limit?", a: "You see a clear prompt showing exactly where the limit was reached, with one click to start a 14-day Pro trial. No features are removed mid-month." },
  { q: "Is there a setup fee?", a: "None. You pay only the monthly or annual subscription. Pro schools also receive a complimentary onboarding call at no extra cost." },
  { q: "What does the 14-day trial include?", a: "Every Pro feature, the AI Report Writer, your child's Friday story, the Fee Manager, the Analytics Dashboard, at no cost. No credit card required to start." },
  { q: "Does Scholr work in Nigeria, Ghana, and across Africa?", a: "Yes. Scholr was designed with African schools as a primary use case. It's optimised for mid-range Android devices and 3G connections, and supports Naira, Cedis, Pounds, and Dollars." },
  { q: "Can we cancel anytime?", a: "Yes. Cancel from your billing settings with two clicks. Your school keeps access until the end of the paid period, and your data is fully exportable before deletion." },
  { q: "Can we white-label Scholr for our school?", a: "White-labeling is available on the Enterprise plan: your school's branding, a custom subdomain, and optionally your own domain (portal.yourschool.com)." },
]

const FOOTER_NAV = [
  { title: "Product", links: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "/pricing" },
  ] },
  { title: "Get started", links: [
    { label: "Find your school", href: "/find-school" },
    { label: "Create an account", href: "/signup" },
    { label: "Sign in", href: "/login" },
  ] },
  { title: "Company", links: [
    { label: "Contact", href: "mailto:abrahamayoola35@gmail.com" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ] },
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

// ─── Curved divider ────────────────────────────────────────────────────────────
// A soft wave between bands. `from` is the colour above, `to` the colour below;
// the SVG paints `to` so the curve "belongs" to the band beneath it. `flip`
// mirrors the wave for variety.

// Standalone wave between two bands. `from` = colour of the band ABOVE (fills the
// strip background), `to` = colour of the band BELOW (the wave shape). Placed
// directly between sections in the page flow so there are never seams or gaps.
function CurveDivider({ from, to, flip = false, flipY = false }: { from: string; to: string; flip?: boolean; flipY?: boolean }) {
  const sx = flip ? -1 : 1
  const sy = flipY ? -1 : 1
  return (
    <div className="w-divider" style={{ background: from }} aria-hidden>
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ transform: (flip || flipY) ? `scale(${sx}, ${sy})` : undefined }}>
        {/* one gentle wave, fully inside the viewBox (no clipping) */}
        <path d="M0,58 C 360,6 720,6 1080,42 C 1260,60 1360,62 1440,54 L1440,101 L0,101 Z" fill={to} />
      </svg>
    </div>
  )
}

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
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: "var(--w-amber)", boxShadow: "0 2px 8px -2px var(--w-amber)" }}
          >
            <GraduationCap size={14} aria-hidden style={{ color: "oklch(26% 0.06 58)" }} />
          </div>
          <span className="w-display" style={{ fontSize: "1.05rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--w-ink)" }}>
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
          <a href="/login" className="nav-pill-link" style={{ color: "var(--w-ink-soft)" }}>
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
  return (
    <section
      id="top"
      style={{
        background: "var(--w-cream)",
        position: "relative",
        overflow: "hidden",
        paddingTop: "clamp(116px, 16vw, 152px)",
        paddingBottom: "clamp(56px, 8vw, 96px)",
      }}
    >
      {/* Playful pastel blobs */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div className="w-blob w-float-a" style={{ width: 360, height: 360, background: "var(--w-peach)", top: "-6%", right: "6%", opacity: 0.7 }} />
        <div className="w-blob w-float-b" style={{ width: 280, height: 280, background: "var(--w-mint)", bottom: "2%", left: "-4%", opacity: 0.6 }} />
        <div className="w-blob w-float-a" style={{ width: 200, height: 200, background: "var(--w-sky)", top: "44%", left: "46%", opacity: 0.45 }} />
      </div>

      <div className="max-w-7xl mx-auto px-5 w-full relative grid lg:grid-cols-[1.05fr_1fr] gap-x-12 gap-y-14 items-center">

        {/* Left, copy */}
        <div className="text-center lg:text-left">
          <div className="w-eyebrow hero-in-1" style={{ marginBottom: "1.6rem" }}>
            <span style={{ fontSize: "0.95rem", lineHeight: 1 }} aria-hidden>💛</span>
            For parents, teachers &amp; schools
          </div>

          <h1
            className="w-display hero-in-2"
            style={{
              fontSize: "clamp(2.6rem, 5.2vw, 4.4rem)",
              lineHeight: 1.02,
              marginBottom: "1.5rem",
            }}
          >
            Where your child&apos;s<br />
            school day{" "}
            <span style={{ position: "relative", whiteSpace: "nowrap", color: "var(--w-coral)" }}>
              comes home
              <svg aria-hidden viewBox="0 0 220 14" style={{ position: "absolute", left: 0, bottom: "-0.34em", width: "100%", height: "0.4em" }} preserveAspectRatio="none">
                <path d="M3,9 C60,2 160,2 217,8" fill="none" stroke="var(--w-amber)" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </span>.
          </h1>

          <p
            className="hero-in-3 mx-auto lg:mx-0"
            style={{
              fontSize: "clamp(1.06rem, 1.4vw, 1.22rem)",
              color: "var(--w-ink-soft)",
              lineHeight: 1.65,
              maxWidth: "46ch",
              marginBottom: "2.25rem",
            }}
          >
            Attendance, homework, messages and a warm Friday report, all in one calm place,
            so families and school stay close every day.{" "}
            <strong style={{ color: "var(--w-ink)", fontWeight: 700 }}>Free under 100 students.</strong>
          </p>

          <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-6 hero-in-4">
            <a href="/signup" className="w-btn group">
              Get your school on Scholr
              <span className="w-btn-icon"><ArrowRight size={15} aria-hidden /></span>
            </a>
            <a href="mailto:abrahamayoola35@gmail.com" className="w-btn-ghost">Contact us</a>
          </div>

          <a
            href="/find-school"
            className="hero-in-4 inline-flex items-center gap-1.5 mb-9"
            style={{ fontSize: "0.9rem", color: "var(--w-ink-faint)", textDecoration: "none" }}
          >
            Teacher or parent?
            <span style={{ color: "var(--w-amber-ink)", fontWeight: 700 }}>Find your school →</span>
          </a>

          {/* Social proof */}
          <div
            className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 hero-in-5"
            style={{ color: "var(--w-ink-faint)", fontSize: "0.9rem" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex" aria-hidden>
                {["/landing/avatar-1.jpg","/landing/avatar-2.jpg","/landing/avatar-3.jpg","/landing/avatar-4.jpg"].map((src, i) => (
                  <div key={i} style={{ marginLeft: i > 0 ? -10 : 0, borderRadius: "50%", border: "2.5px solid var(--w-cream)" }}>
                    <Photo src={src} alt="" tag="" radius="50%" style={{ width: 32, height: 32, boxShadow: "none" }} />
                  </div>
                ))}
              </div>
              <span><strong style={{ color: "var(--w-ink)", fontWeight: 700 }}>800+</strong> schools</span>
            </div>
            <div className="flex items-center gap-1" aria-label="Rated 4.9 out of 5 stars">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} style={{ fill: "var(--w-amber)", color: "var(--w-amber)" }} aria-hidden />
              ))}
              <span className="ml-1"><strong style={{ color: "var(--w-ink)", fontWeight: 700 }}>4.9</strong> from 340 families</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} style={{ color: "var(--c-emerald)" }} aria-hidden />
              No credit card
            </div>
          </div>
        </div>

        {/* Right, warm photo collage */}
        <div className="hero-in-6 w-full">
          <HeroCollage />
        </div>
      </div>
    </section>
  )
}

function HeroCollage() {
  const tilt = useTilt<HTMLDivElement>(7)
  return (
    <div className="relative mx-auto" style={{ maxWidth: 560 }}>
     <div ref={tilt} style={{ position: "relative", transition: "transform 420ms var(--ease-out)", transformStyle: "preserve-3d" }}>
      {/* Main portrait */}
      <Photo
        src="/landing/hero-parent-child.jpg"
        alt="A parent and child smiling together over a phone after school"
        tag="Parent & child"
        radius={36}
        priority
        className="w-card-hover"
        style={{ aspectRatio: "4 / 5", width: "100%" }}
      />

      {/* Secondary classroom photo, overlapping, gentle scroll parallax */}
      <div data-parallax="-14" className="hidden sm:block" style={{ position: "absolute", bottom: "-9%", left: "-12%", width: "46%" }}>
        <Photo
          src="/landing/hero-classroom.jpg"
          alt="A bright, warm classroom with a teacher and pupils"
          tag="In class"
          radius={28}
          priority
          style={{ width: "100%", aspectRatio: "1 / 1", border: "5px solid var(--w-cream)" }}
        />
      </div>

      {/* Floating "Friday story" card */}
      <div
        className="phone-float"
        style={{
          position: "absolute", top: "8%", right: "-7%", width: 208,
          background: "var(--w-paper)", border: "1px solid var(--w-line)",
          borderRadius: 22, padding: "14px 16px", boxShadow: "var(--w-shadow-lg)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 26, height: 26, background: "var(--w-coral-bg)" }}>
            <Heart size={13} style={{ color: "var(--w-coral)" }} aria-hidden />
          </div>
          <div className="min-w-0">
            <p style={{ fontSize: 11, fontWeight: 800, color: "var(--w-ink)", lineHeight: 1.1 }}>Amara&apos;s Friday story</p>
            <p style={{ fontSize: 9, color: "var(--w-ink-faint)" }}>Just now · Week 3</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 mb-1.5">
          {[...Array(5)].map((_, i) => <Star key={i} size={10} style={{ fill: "var(--w-amber)", color: "var(--w-amber)" }} aria-hidden />)}
          <span style={{ fontSize: 9.5, fontWeight: 700, marginLeft: 4, color: "var(--w-ink-soft)" }}>A lovely week</span>
        </div>
        <p style={{ fontSize: 10, color: "var(--w-ink-soft)", lineHeight: 1.5 }}>
          &ldquo;Her curiosity lit up the science lesson, every homework in on time too.&rdquo;
        </p>
      </div>

      {/* Floating "marked present" pill */}
      <div
        className="phone-float hidden sm:flex items-center gap-2"
        style={{
          position: "absolute", bottom: "14%", right: "-9%",
          background: "var(--w-paper)", border: "1px solid var(--w-line)",
          borderRadius: 100, padding: "8px 14px 8px 9px", boxShadow: "var(--w-shadow)",
          animationDelay: "1.4s",
        }}
      >
        <span className="rounded-full flex items-center justify-center shrink-0" style={{ width: 24, height: 24, background: "var(--c-emerald)" }}>
          <Check size={13} className="text-white" strokeWidth={3} aria-hidden />
        </span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--w-ink)" }}>28 parents notified · 43s</span>
      </div>
     </div>
    </div>
  )
}

/* ── Live product demo: a scripted cursor walks through the real app ──────────── */

const DEMO_NAV: { icon: React.ElementType; view: "dashboard" | "students" | "attendance" | "analytics" | null }[] = [
  { icon: LayoutDashboard, view: "dashboard" },
  { icon: GraduationCap,   view: "students" },
  { icon: Users,           view: null },
  { icon: BookOpen,        view: "attendance" },
  { icon: BarChart3,       view: "analytics" },
  { icon: CreditCard,      view: null },
  { icon: MessageSquare,   view: null },
  { icon: Settings,        view: null },
]
const DEMO_STEPS = [0, 1, 3, 4] // nav indices the cursor visits, looping

function ProductDemoScreen() {
  const screenRef = useRef<HTMLDivElement>(null)
  const navRefs = useRef<Array<HTMLDivElement | null>>([])
  const [stepIdx, setStepIdx] = useState(0)
  const [activeNav, setActiveNav] = useState(DEMO_STEPS[0]) // what's actually shown (commits on click)
  const [cursor, setCursor] = useState({ x: 16, y: 80, visible: false })
  const [clicking, setClicking] = useState(false)
  const [rippleKey, setRippleKey] = useState(0)

  const targetNav = DEMO_STEPS[stepIdx]                      // where the cursor is heading
  const view = DEMO_NAV[activeNav].view ?? "dashboard"       // view follows the committed nav

  // Advance through the script (paused for reduced motion)
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const t = setTimeout(() => setStepIdx(s => (s + 1) % DEMO_STEPS.length), 3000)
    return () => clearTimeout(t)
  }, [stepIdx])

  // Move the cursor to the target nav, and only AFTER it lands + "clicks" do we
  // swap the view + active highlight, so the screen never changes before the click.
  // Offset coords are immune to the laptop's 3D transform.
  useEffect(() => {
    const el = navRefs.current[targetNav]
    if (!el) return
    setCursor({ x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2, visible: true })
    const t = setTimeout(() => {            // cursor travel ≈ 640ms, then it clicks
      setClicking(true)
      setRippleKey(k => k + 1)
      setActiveNav(targetNav)               // ← view + highlight commit on the click
      const t2 = setTimeout(() => setClicking(false), 260)
      return () => clearTimeout(t2)
    }, 680)
    return () => clearTimeout(t)
  }, [stepIdx, targetNav])

  return (
    <div ref={screenRef} className="relative flex h-full w-full" style={{ background: "var(--c-surface)", color: "var(--c-text)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Sidebar */}
      <div className="flex flex-col items-center gap-1.5 py-2.5 shrink-0" style={{ width: 40, background: "var(--c-bg)", borderRight: "1px solid var(--c-border)" }}>
        <div className="rounded-md flex items-center justify-center mb-1" style={{ width: 20, height: 20, background: "var(--c-indigo)" }}>
          <GraduationCap size={11} className="text-white" />
        </div>
        {DEMO_NAV.map(({ icon: Icon }, i) => {
          const active = i === activeNav
          return (
            <div
              key={i}
              ref={el => { navRefs.current[i] = el }}
              className="rounded-md flex items-center justify-center transition-all duration-300"
              style={{ width: 22, height: 22, background: active ? "var(--c-indigo-bg)" : "transparent" }}
            >
              <Icon size={11} style={{ color: active ? "var(--c-indigo)" : "var(--c-text-muted)" }} strokeWidth={active ? 2.5 : 2} />
            </div>
          )
        })}
      </div>

      {/* Main view (swaps as the cursor navigates) */}
      <div className="flex-1 min-w-0 relative" style={{ overflow: "hidden" }}>
        <div key={view} className="demo-view absolute inset-0 px-3 py-2.5" style={{ overflow: "hidden" }}>
          {view === "dashboard"  && <DemoDashboard />}
          {view === "students"   && <DemoStudents />}
          {view === "attendance" && <DemoAttendance />}
          {view === "analytics"  && <DemoAnalytics />}
        </div>
      </div>

      {/* Demo cursor */}
      <div
        className="absolute pointer-events-none"
        aria-hidden
        style={{
          left: 0, top: 0,
          transform: `translate(${cursor.x}px, ${cursor.y}px)`,
          transition: "transform 640ms cubic-bezier(0.45, 0, 0.15, 1)",
          opacity: cursor.visible ? 1 : 0,
          zIndex: 40,
          willChange: "transform",
        }}
      >
        <span key={rippleKey} className="demo-ripple" />
        <svg width="17" height="17" viewBox="0 0 24 24" style={{ display: "block", transform: clicking ? "scale(0.82)" : "scale(1)", transition: "transform 130ms ease", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.45))" }}>
          <path d="M5 2.5 L5 18.5 L9.2 14.6 L11.8 20 L14.1 18.9 L11.5 13.6 L17 13.4 Z" fill="#fff" stroke="#15162b" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

/* Demo views (each fills the main content area) */
function DemoViewHeader({ kicker, title, action }: { kicker?: string; title: string; action?: string }) {
  return (
    <div className="flex items-end justify-between mb-2">
      <div>
        {kicker && <p style={{ fontSize: 7, color: "var(--c-text-muted)", fontWeight: 600, letterSpacing: "0.04em" }}>{kicker}</p>}
        <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{title}</p>
      </div>
      {action && (
        <span className="rounded-md text-white" style={{ fontSize: 7.5, fontWeight: 700, background: "var(--c-indigo)", padding: "3px 7px" }}>{action}</span>
      )}
    </div>
  )
}

function DemoDashboard() {
  const stats = [
    { label: "Students", value: "248", icon: GraduationCap, color: "var(--c-indigo)" },
    { label: "Teachers", value: "18",  icon: Users,         color: "var(--c-emerald)" },
    { label: "Classes",  value: "12",  icon: BookOpen,      color: "var(--c-gold)" },
    { label: "Parents",  value: "312", icon: Users,         color: "var(--c-indigo)" },
  ]
  const R = 15, C = 2 * Math.PI * R
  return (
    <>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p style={{ fontSize: 7, color: "var(--c-text-muted)", fontWeight: 600, letterSpacing: "0.02em" }}>WEDNESDAY, 3 JUNE</p>
          <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>Good morning 👋</p>
          <p style={{ fontSize: 7.5, color: "var(--c-text-muted)" }}>Rehoboth Academy</p>
        </div>
        <div className="flex items-center gap-1 rounded-full px-1.5 py-1" style={{ background: "var(--c-indigo-bg)" }}>
          <span className="rounded-full" style={{ width: 4, height: 4, background: "var(--c-indigo)" }} />
          <span style={{ fontSize: 7.5, fontWeight: 700, color: "var(--c-indigo)" }}>12 new</span>
          <Bell size={8} style={{ color: "var(--c-indigo)" }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-1.5">
        <div className="rounded-lg p-2 flex items-center gap-2" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
          <svg width="34" height="34" viewBox="0 0 38 38" className="shrink-0 -rotate-90">
            <circle cx="19" cy="19" r={R} fill="none" strokeWidth="4" stroke="var(--c-border)" />
            <circle cx="19" cy="19" r={R} fill="none" strokeWidth="4" strokeLinecap="round" stroke="var(--c-emerald)" strokeDasharray={`${0.88 * C} ${C}`} />
          </svg>
          <div className="min-w-0">
            <p style={{ fontSize: 8.5, fontWeight: 700, lineHeight: 1.1 }}>School health</p>
            <p style={{ fontSize: 7, color: "var(--c-text-muted)" }}>94% attendance</p>
            <p style={{ fontSize: 7, color: "var(--c-text-muted)" }}>87% homework</p>
          </div>
        </div>
        <div className="rounded-lg p-2" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <p style={{ fontSize: 8.5, fontWeight: 700 }}>Subscription</p>
            <span className="rounded-full px-1.5" style={{ fontSize: 6.5, fontWeight: 800, background: "var(--c-emerald-bg)", color: "var(--c-emerald)", paddingTop: 1, paddingBottom: 1 }}>PRO</span>
          </div>
          <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
            <span style={{ fontSize: 7, color: "var(--c-text-muted)" }}>Students</span>
            <span style={{ fontSize: 7, fontWeight: 700 }}>248 / 300</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 3, background: "var(--c-surface)" }}>
            <div className="h-full rounded-full" style={{ width: "82%", background: "var(--c-indigo)" }} />
          </div>
          <p style={{ fontSize: 7, color: "var(--c-indigo)", fontWeight: 700, marginTop: 4 }}>Manage plan →</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-1.5">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg p-1.5" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
            <div className="rounded flex items-center justify-center mb-1" style={{ width: 12, height: 12, background: `color-mix(in srgb, ${color} 16%, transparent)` }}>
              <Icon size={7} style={{ color }} />
            </div>
            <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 6.5, color: "var(--c-text-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--c-border)", background: "var(--c-bg)" }}>
        <div className="flex items-center justify-between px-2 py-1" style={{ borderBottom: "1px solid var(--c-border)" }}>
          <p style={{ fontSize: 7.5, fontWeight: 700, color: "var(--c-text-muted)", letterSpacing: "0.06em" }}>RECENT MEMBERS</p>
          <p style={{ fontSize: 7, fontWeight: 700, color: "var(--c-indigo)" }}>View all</p>
        </div>
        {[
          { n: "Olumide Bello", r: "Teacher", c: "var(--c-emerald)" },
          { n: "Daniel Okpara", r: "Parent",  c: "var(--c-indigo)" },
        ].map(({ n, r, c }) => (
          <div key={n} className="flex items-center gap-1.5 px-2 py-1.5" style={{ borderBottom: "1px solid var(--c-border)" }}>
            <div className="rounded-full flex items-center justify-center text-white shrink-0" style={{ width: 14, height: 14, background: c, fontSize: 6.5, fontWeight: 700 }}>{n[0]}</div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 8, fontWeight: 700, lineHeight: 1.1 }}>{n}</p>
              <p style={{ fontSize: 6.5, color: "var(--c-text-muted)" }}>{r}</p>
            </div>
            <span className="rounded-full px-1.5" style={{ fontSize: 6, fontWeight: 700, background: "var(--c-emerald-bg)", color: "var(--c-emerald)", paddingTop: 1, paddingBottom: 1 }}>Active</span>
          </div>
        ))}
      </div>
    </>
  )
}

function DemoStudents() {
  const rows = [
    { n: "Amara Osei",     cls: "6B", att: "97%", ok: true },
    { n: "Kofi Mensah",    cls: "5A", att: "92%", ok: true },
    { n: "Lucy Bannister", cls: "6B", att: "88%", ok: true },
    { n: "Marcus Chen",    cls: "4C", att: "74%", ok: false },
    { n: "Fatou Diallo",   cls: "6B", att: "99%", ok: true },
  ]
  return (
    <>
      <DemoViewHeader kicker="248 ENROLLED" title="Students" action="+ Add student" />
      <div className="rounded-lg flex items-center gap-1.5 px-2 mb-1.5" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", height: 18 }}>
        <span className="rounded-full" style={{ width: 6, height: 6, border: "1.5px solid var(--c-text-muted)" }} />
        <span style={{ fontSize: 7.5, color: "var(--c-text-muted)" }}>Search students…</span>
      </div>
      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--c-border)", background: "var(--c-bg)" }}>
        <div className="grid items-center px-2 py-1" style={{ gridTemplateColumns: "1fr 28px 34px 36px", borderBottom: "1px solid var(--c-border)", background: "var(--c-surface)" }}>
          {["Name", "Class", "Att.", "Status"].map(h => (
            <span key={h} style={{ fontSize: 6.5, fontWeight: 700, color: "var(--c-text-muted)", letterSpacing: "0.04em" }}>{h}</span>
          ))}
        </div>
        {rows.map(({ n, cls, att, ok }) => (
          <div key={n} className="grid items-center px-2 py-1.5" style={{ gridTemplateColumns: "1fr 28px 34px 36px", borderBottom: "1px solid var(--c-border)" }}>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="rounded-full flex items-center justify-center text-white shrink-0" style={{ width: 13, height: 13, background: "var(--c-indigo)", fontSize: 6, fontWeight: 700 }}>{n[0]}</div>
              <span className="truncate" style={{ fontSize: 8, fontWeight: 600 }}>{n}</span>
            </div>
            <span style={{ fontSize: 7.5, color: "var(--c-text-mid)" }}>{cls}</span>
            <span style={{ fontSize: 7.5, fontWeight: 700, color: ok ? "var(--c-emerald)" : "var(--c-gold)" }}>{att}</span>
            <span className="rounded-full px-1" style={{ fontSize: 6, fontWeight: 700, background: "var(--c-emerald-bg)", color: "var(--c-emerald)", justifySelf: "start", paddingTop: 1, paddingBottom: 1 }}>Active</span>
          </div>
        ))}
      </div>
    </>
  )
}

function DemoAttendance() {
  const roster = [
    { n: "Adeyemi, Kofi",   s: "present" },
    { n: "Bannister, Lucy", s: "present" },
    { n: "Chen, Marcus",    s: "late" },
    { n: "Diallo, Fatou",   s: "absent" },
    { n: "Eze, Chisom",     s: "present" },
    { n: "Osei, Amara",     s: "present" },
  ]
  const col = (s: string) => s === "absent" ? "var(--c-red)" : s === "late" ? "var(--c-gold)" : "var(--c-emerald)"
  const bg  = (s: string) => s === "absent" ? "var(--c-red-bg)" : s === "late" ? "var(--c-gold-bg)" : "var(--c-bg)"
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p style={{ fontSize: 7, color: "var(--c-text-muted)", fontWeight: 600 }}>CLASS 6B · MONDAY, 2 JUNE</p>
          <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>Attendance</p>
        </div>
        <span className="rounded-full px-1.5 py-0.5" style={{ fontSize: 7.5, fontWeight: 800, background: "var(--c-emerald-bg)", color: "var(--c-emerald)" }}>28 / 30</span>
      </div>
      <div className="space-y-1 mb-1.5">
        {roster.map(({ n, s }) => (
          <div key={n} className="flex items-center justify-between rounded-md px-2 py-1" style={{ background: bg(s), border: "1px solid var(--c-border)" }}>
            <span style={{ fontSize: 8, fontWeight: 600 }}>{n}</span>
            <span className="capitalize" style={{ fontSize: 7.5, fontWeight: 700, color: col(s) }}>{s}</span>
          </div>
        ))}
      </div>
      <button type="button" className="w-full rounded-lg text-white" style={{ background: "var(--c-emerald)", fontSize: 8.5, fontWeight: 800, padding: "5px 0" }}>
        Save, parents notified
      </button>
    </>
  )
}

function DemoAnalytics() {
  const bars = [62, 78, 70, 88, 84, 94, 90]
  return (
    <>
      <DemoViewHeader kicker="LAST 30 DAYS" title="Analytics" />
      <div className="grid grid-cols-2 gap-1.5 mb-1.5">
        {[
          { l: "Attendance rate", v: "94%", up: true,  c: "var(--c-emerald)" },
          { l: "Homework rate",   v: "87%", up: true,  c: "var(--c-indigo)" },
        ].map(({ l, v, up, c }) => (
          <div key={l} className="rounded-lg p-2" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
            <p style={{ fontSize: 7, color: "var(--c-text-muted)", marginBottom: 2 }}>{l}</p>
            <div className="flex items-center gap-1">
              <p style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: c }}>{v}</p>
              {up && <TrendingUp size={9} style={{ color: c }} />}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg p-2" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
        <p style={{ fontSize: 7.5, fontWeight: 700, color: "var(--c-text-muted)", letterSpacing: "0.04em", marginBottom: 6 }}>WEEKLY ATTENDANCE</p>
        <div className="flex items-end justify-between gap-1" style={{ height: 56 }}>
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === bars.length - 1 ? "var(--c-indigo)" : "color-mix(in srgb, var(--c-indigo) 28%, transparent)" }} />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {["M", "T", "W", "T", "F", "M", "T"].map((d, i) => (
            <span key={i} style={{ fontSize: 6, color: "var(--c-text-muted)" }}>{d}</span>
          ))}
        </div>
      </div>
    </>
  )
}


// ─── Trust strip (marquee) ──────────────────────────────────────────────────

function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <section
      style={{ background: "var(--w-cream)", padding: "10px 0 28px", overflow: "hidden" }}
      aria-label="Trusted by schools worldwide"
    >
      <Rise variant="scale">
        <p className="text-center" style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--w-ink-faint)", marginBottom: 18 }}>
          Loved by 800+ schools across five countries
        </p>
      </Rise>
      <div className="marquee-outer">
        <div className="marquee-track" aria-hidden>
          {doubled.map((item, i) => (
            <span key={i} className="marquee-item" style={{ color: "var(--w-ink-soft)" }}>
              <span style={{ fontSize: "1rem" }}>{item.flag}</span>
              {item.text}
              <span className="marquee-dot" style={{ background: "var(--w-line)" }} />
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works / Value Props ─────────────────────────────────────────────

function WarmIcon({ icon: Icon, bg, fg }: { icon: React.ElementType; bg: string; fg: string }) {
  return (
    <div className="w-itile mb-4" style={{ background: bg }} aria-hidden>
      <Icon style={{ color: fg }} strokeWidth={2} />
    </div>
  )
}

const FEATURE_CARDS = [
  { icon: Bell,          bg: "var(--w-coral-bg)", fg: "var(--w-coral)",      title: "Gentle absence alerts", body: "If your child is marked absent, you'll know within minutes, kind and clear, never alarming." },
  { icon: BookOpen,      bg: "var(--w-amber-bg)", fg: "var(--w-amber-ink)",  title: "Homework, all in one place", body: "Every deadline, file and grade sorted by what's due next, never buried in a group chat." },
  { icon: MessageSquare, bg: "var(--w-mint)",     fg: "var(--c-emerald)",    title: "Calm, private messaging", body: "One warm inbox per teacher. No personal numbers, no 11pm group-chat chaos." },
  { icon: FileText,      bg: "var(--w-lilac)",    fg: "oklch(48% 0.16 300)", title: "AI Report Writer", body: "Describe a child in a sentence; Scholr drafts a warm, specific report in your school's voice, hours back each term." },
  { icon: TrendingUp,    bg: "var(--w-amber-bg)", fg: "var(--w-amber-ink)",  title: "Gentle early alerts", body: "Scholr quietly spots patterns, a few Monday absences, and flags them kindly, with a suggested next step." },
  { icon: BarChart3,     bg: "var(--w-sky)",      fg: "oklch(48% 0.15 240)", title: "A school you can see", body: "A live School Health Score and engagement trends, in plain language, lead with confidence from anywhere." },
]

function FeaturesSection() {
  return (
    <section id="features" style={{ background: "var(--w-sand)", padding: "clamp(72px, 10vw, 120px) 20px" }}>
      <div className="max-w-6xl mx-auto">
        <Rise className="text-center" style={{ maxWidth: "48rem", margin: "0 auto clamp(2.5rem, 5vw, 3.5rem)" }}>
          <p className="w-label">Everything in one warm place</p>
          <h2 className="w-display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.08 }}>
            One home for every part of the school day.
          </h2>
          <p style={{ fontSize: "clamp(1rem, 1.4vw, 1.125rem)", color: "var(--w-ink-soft)", lineHeight: 1.7, marginTop: "1rem" }}>
            Attendance, homework, messages and a warm weekly story, together at last, so nothing about your child slips through the cracks.
          </p>
        </Rise>

        {/* Signature feature spotlight, the Friday story */}
        <Rise variant="scale" className="w-card mockup-warm" style={{ background: "var(--w-cocoa)", border: "none", borderRadius: 32, overflow: "hidden", marginBottom: "clamp(1.5rem, 3vw, 2.25rem)" }}>
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center" style={{ padding: "clamp(28px, 4vw, 52px)" }}>
            <div>
              <div className="w-eyebrow mb-5" style={{ background: "oklch(100% 0 0 / 0.08)", border: "1px solid oklch(100% 0 0 / 0.14)", color: "var(--w-amber)" }}>
                <Sparkles size={13} aria-hidden /> The signature feature
              </div>
              <h3 className="w-display" style={{ fontSize: "clamp(1.7rem, 3.2vw, 2.5rem)", lineHeight: 1.06, color: "oklch(98% 0.01 80)", marginBottom: "1.1rem" }}>
                Every Friday, your child&apos;s week, told with warmth.
              </h3>
              <p style={{ fontSize: "1.0625rem", color: "oklch(83% 0.02 75)", lineHeight: 1.75, maxWidth: "42ch", marginBottom: "1.75rem" }}>
                Days present. Homework done. A kind word from the teacher, and a note written just for your child, landing gently at 5pm, every Friday.
              </p>
              <div className="inline-flex items-start gap-3 p-4 rounded-2xl" style={{ background: "oklch(72% 0.155 64 / 0.1)", border: "1px solid oklch(72% 0.155 64 / 0.22)", maxWidth: "42ch" }}>
                <Heart size={18} style={{ color: "var(--w-amber)", flexShrink: 0, marginTop: 2 }} aria-hidden />
                <p style={{ fontSize: "0.875rem", color: "oklch(84% 0.015 75)", lineHeight: 1.65 }}>
                  Schools sending the Friday story see parent happiness climb by an average of <strong style={{ color: "oklch(96% 0.01 80)" }}>22 points</strong> in a single term.
                </p>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <WeeklyReportPhone />
            </div>
          </div>
        </Rise>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURE_CARDS.map((c, i) => (
            <Rise key={c.title} delay={(i % 3) * 90} className="w-card w-card-hover" style={{ padding: 26 }}>
              <WarmIcon icon={c.icon} bg={c.bg} fg={c.fg} />
              <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, color: "var(--w-ink)", letterSpacing: "-0.01em", marginBottom: 6 }}>{c.title}</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--w-ink-soft)", lineHeight: 1.6 }}>{c.body}</p>
            </Rise>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Empathy / "we get it" section (replaces cold Problem) ───────────────────

function ProblemSection() {
  const { ref, visible } = useReveal()
  const problems = [
    {
      icon: FileText,
      accent: "var(--w-coral)", bg: "var(--w-coral-bg)",
      title: "The email no one opened",
      body: "An inbox at 847 unread. The note about the trip, buried under newsletters. Read three days late, if at all.",
    },
    {
      icon: MessageSquare,
      accent: "var(--w-amber-ink)", bg: "var(--w-amber-bg)",
      title: "The 11pm group chat",
      body: "Fee reminders lost under memes. A teacher's personal number shared with 150 parents. No off switch.",
    },
    {
      icon: Heart,
      accent: "var(--c-emerald)", bg: "var(--w-mint)",
      title: "The moment you missed",
      body: "Your child was upset at school on Tuesday. You only heard about it on Friday. It shouldn't be this hard to stay close.",
    },
    {
      icon: Calendar,
      accent: "oklch(48% 0.15 240)", bg: "var(--w-sky)",
      title: "The form lost in a backpack",
      body: "Permission slips signed the morning of, if they ever surface at all. Always one more thing to chase down.",
    },
  ]

  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ background: "var(--w-cream)", padding: "clamp(72px, 11vw, 120px) 20px" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-20 items-center">
          {/* Left: editorial heading + photo */}
          <div className={`reveal ${visible ? "visible" : ""}`}>
            <p className="w-label" style={{ color: "var(--w-coral)" }}>Sound familiar?</p>
            <h2 className="w-display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.08, marginBottom: "1.25rem" }}>
              Staying close to your child&apos;s day shouldn&apos;t be this hard.
            </h2>
            <p style={{ fontSize: "1.0625rem", color: "var(--w-ink-soft)", lineHeight: 1.8, marginBottom: "1.75rem" }}>
              Today, news travels through four or five disconnected channels. Teachers lose hours each week to messages that have nothing to do with teaching. Families feel a step behind.
            </p>
            <Photo
              src="/landing/empathy.jpg"
              alt="A parent checking their phone with a warm, relieved smile"
              tag="A calmer morning"
              radius={28}
              className="hidden lg:block"
              style={{ aspectRatio: "16 / 11", width: "100%" }}
            />
            <div className="flex items-center gap-2.5" style={{ marginTop: "1.5rem" }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--w-amber)" }} aria-hidden>
                <Check size={12} strokeWidth={3} style={{ color: "oklch(26% 0.06 58)" }} />
              </div>
              <p style={{ fontSize: "0.975rem", fontWeight: 700, color: "var(--w-ink)" }}>Scholr gently fixes all of this.</p>
            </div>
          </div>

          {/* Right: warm problem cards */}
          <div className="space-y-4">
            {problems.map((p, i) => (
              <Rise key={p.title} variant="right" delay={i * 100} className="w-card" style={{ padding: 26 }}>
                <div className="flex items-start gap-4">
                  <div className="w-itile" style={{ background: p.bg }} aria-hidden>
                    <p.icon style={{ color: p.accent }} strokeWidth={2} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.0625rem", fontWeight: 800, color: "var(--w-ink)", lineHeight: 1.3, letterSpacing: "-0.01em", marginBottom: 6 }}>{p.title}</h3>
                    <p style={{ fontSize: "0.9375rem", color: "var(--w-ink-soft)", lineHeight: 1.7 }}>{p.body}</p>
                  </div>
                </div>
              </Rise>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Cinematic video band ───────────────────────────────────────────────────

function VideoBand() {
  const quick = [
    { v: "2 min", l: "to reach a parent" },
    { v: "86%", l: "open every update" },
    { v: "4+ hrs", l: "saved per teacher / term" },
  ]
  const videoRef = useRef<HTMLVideoElement>(null)
  // Play only while the section is on screen; pause when it scrolls away.
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const play = () => { v.play().catch(() => {}) }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && e.intersectionRatio > 0.35) play(); else v.pause() },
      { threshold: [0, 0.35, 0.6] }
    )
    obs.observe(v)
    return () => obs.disconnect()
  }, [])
  return (
    <section
      className="w-video-band"
      style={{ minHeight: "min(88vh, 780px)", display: "flex", alignItems: "center" }}
      aria-label="Why Scholr"
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
    >
      <video ref={videoRef} autoPlay muted loop playsInline preload="metadata" poster="/landing/empathy.jpg" aria-hidden>
        <source src="/landing/classroom-loop.mp4" type="video/mp4" />
      </video>
      <div className="w-video-scrim" aria-hidden />
      {/* Cream wave edges overlaid ON the video, top flows from the section above,
          bottom into the section below. No solid colour band, no seam. */}
      <div style={{ position: "absolute", top: -1, left: 0, right: 0, zIndex: 3 }} aria-hidden>
        <CurveDivider from="transparent" to="var(--w-cream)" flipY />
      </div>
      <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, zIndex: 3 }} aria-hidden>
        <CurveDivider from="transparent" to="var(--w-cream)" />
      </div>
      <div className="w-video-inner max-w-4xl mx-auto px-5 text-center" style={{ width: "100%", paddingTop: "clamp(96px, 14vw, 160px)", paddingBottom: "clamp(96px, 14vw, 160px)" }}>
        <Rise>
          <p className="w-label" style={{ color: "var(--w-amber)" }}>What calm feels like</p>
          <h2 className="w-display" style={{ fontSize: "clamp(2.2rem, 5.4vw, 4.25rem)", lineHeight: 1.03, color: "oklch(99% 0.01 80)" }}>
            When school feels close,<br />children flourish.
          </h2>
        </Rise>
        <Rise delay={120}>
          <p style={{ fontSize: "clamp(1.05rem, 1.5vw, 1.25rem)", color: "oklch(91% 0.02 78)", lineHeight: 1.7, maxWidth: "46ch", margin: "1.4rem auto 0" }}>
            Scholr turns scattered school updates into one warm thread, so every child feels seen, at school and at home.
          </p>
        </Rise>
        <Rise delay={240}>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-5 mt-11">
            {quick.map((q) => (
              <div key={q.l} className="text-center">
                <p className="w-display" style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.6rem)", color: "var(--w-amber)", lineHeight: 1 }}>{q.v}</p>
                <p style={{ fontSize: "0.8125rem", color: "oklch(84% 0.02 78)", fontWeight: 600, marginTop: 6, letterSpacing: "0.01em" }}>{q.l}</p>
              </div>
            ))}
          </div>
        </Rise>
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
      style={{ padding: "clamp(72px, 11vw, 120px) 20px", background: "var(--w-sand)" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <p className="w-label">A warm welcome for everyone</p>
          <h2 className={`w-display reveal ${visible ? "visible" : ""}`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.08 }}>
            Three people. One happy school.
          </h2>
        </div>

        <div className="flex justify-center mb-10" role="tablist" aria-label="User role">
          <div style={{ display: "inline-flex", background: "var(--w-paper)", border: "1px solid var(--w-line)", borderRadius: 100, padding: 5, gap: 3, boxShadow: "var(--w-shadow)" }}>
            {ROLE_TABS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active === i}
                aria-controls={`panel-${t.id}`}
                id={`tab-${t.id}`}
                className="w-role-tab"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7, height: 42, padding: "0 18px",
                  borderRadius: 100, fontSize: "0.9rem", border: "none", cursor: "pointer",
                  background: active === i ? "var(--w-amber)" : "transparent",
                  color: active === i ? "oklch(26% 0.06 58)" : "var(--w-ink-soft)",
                  fontWeight: active === i ? 800 : 600,
                  boxShadow: active === i ? "0 6px 16px -6px var(--w-amber)" : "none",
                  transition: "background 220ms var(--ease-out), color 200ms var(--ease-out), box-shadow 220ms var(--ease-out)",
                }}
                onClick={() => setActive(i)}
              >
                <t.icon size={15} strokeWidth={active === i ? 2.4 : 2} aria-hidden />
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
            <h3 className="w-display mb-4" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", lineHeight: 1.1 }}>
              {tab.headline}
            </h3>
            <p style={{ fontSize: "1.0625rem", color: "var(--w-ink-soft)", lineHeight: 1.75, maxWidth: "44ch", marginBottom: "2rem" }}>
              {tab.sub}
            </p>
            <ul className="space-y-3.5 mb-8">
              {tab.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: tab.accent }}>
                    <Check size={11} className="text-white" aria-hidden strokeWidth={2.5} />
                  </div>
                  <span style={{ fontSize: "0.9375rem", color: "var(--w-ink)", lineHeight: 1.6 }}>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href={tab.ctaHref}
              className="w-btn group inline-flex"
              style={{ background: tab.accent, color: tab.id === "admin" ? "#fff" : "oklch(26% 0.06 58)" }}
            >
              {tab.cta}
              <span className="w-btn-icon" style={{ background: tab.id === "admin" ? "rgba(255,255,255,0.22)" : "oklch(26% 0.06 58)", color: tab.id === "admin" ? "#fff" : tab.accent }}>
                <ArrowRight size={15} aria-hidden />
              </span>
            </a>
            {tab.id !== "admin" && (
              <p style={{ fontSize: "0.8125rem", color: "var(--w-ink-faint)", marginTop: "0.875rem" }}>
                Your school sets up Scholr and invites you, no separate sign-up needed.
              </p>
            )}
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
  // Parent → phone (mobile-first); Teacher → static attendance; Admin → live scripted demo
  if (tab.id === "parent") {
    return (
      <div className="mockup-warm flex justify-center w-full">
        <RolePhone />
      </div>
    )
  }
  return (
    <div className="mockup-warm w-full" style={{ maxWidth: 520 }}>
      <div className="laptop laptop-float">
        <div className="laptop-lid">
          <div className="laptop-cam" aria-hidden />
          <div className="laptop-screen" style={{ aspectRatio: "16 / 10" }}>
            {tab.id === "admin"
              ? <ProductDemoScreen />
              : <RoleScreen view="attendance" title="scholr.app / teacher" />}
          </div>
        </div>
        <div className="laptop-base" aria-hidden><div className="laptop-notch" /></div>
      </div>
    </div>
  )
}

function RolePhone() {
  const width = 232
  const bezel = Math.round(width * 0.045)
  const screenW = width - bezel * 2
  const screenH = Math.round(screenW * 2.05)
  const deviceH = screenH + bezel * 2
  const deviceR = Math.round(width * 0.21)
  return (
    <div className="phone-float" style={{ position: "relative", width }}>
      <div
        style={{
          width, height: deviceH, borderRadius: deviceR, padding: bezel, position: "relative",
          background: "linear-gradient(150deg, oklch(40% 0.012 264) 0%, oklch(22% 0.012 264) 55%, oklch(15% 0.01 264) 100%)",
          boxShadow: "inset 0 1px 1px oklch(70% 0.02 264 / 0.5), 0 0 0 1px oklch(46% 0.02 264 / 0.4), 0 30px 70px rgba(0,0,0,0.45), 0 0 80px oklch(46% 0.22 264 / 0.16)",
        }}
      >
        <div style={{ position: "relative", width: screenW, height: screenH, borderRadius: deviceR - bezel, overflow: "hidden", background: "var(--c-bg)" }}>
          <ParentPortalVertical />
          <div style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", width: screenW * 0.34, height: Math.round(width * 0.085), borderRadius: 999, background: "#000", zIndex: 10 }} aria-hidden />
          <div style={{ position: "absolute", bottom: 5, left: "50%", transform: "translateX(-50%)", width: screenW * 0.32, height: 3.5, borderRadius: 999, background: "oklch(40% 0.01 264 / 0.35)", zIndex: 10 }} aria-hidden />
        </div>
      </div>
    </div>
  )
}

function ParentPortalVertical() {
  return (
    <div className="flex flex-col h-full" style={{ background: "var(--c-surface)", color: "var(--c-text)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Status + header */}
      <div style={{ background: "var(--c-indigo)", flexShrink: 0 }}>
        <div className="flex items-center justify-between" style={{ padding: "6px 16px 2px" }}>
          <span style={{ fontSize: 7.5, fontWeight: 800, color: "rgba(255,255,255,0.95)" }}>9:41</span>
          <span style={{ width: 13, height: 6.5, borderRadius: 2, border: "1px solid rgba(255,255,255,0.65)", position: "relative", display: "inline-block" }}>
            <span style={{ position: "absolute", top: 1, left: 1, bottom: 1, width: "75%", borderRadius: 1, background: "rgba(255,255,255,0.9)" }} />
          </span>
        </div>
        <div className="flex items-center gap-1.5" style={{ padding: "1px 12px 8px" }}>
          <span className="font-bold flex-1" style={{ fontSize: 10.5, color: "#fff", letterSpacing: "-0.01em" }}>Parent Portal</span>
          <Bell size={10} style={{ color: "rgba(255,255,255,0.7)" }} aria-hidden />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-2 space-y-1.5" style={{ overflow: "hidden" }}>
        <div className="rounded-xl p-2" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="rounded-full flex items-center justify-center text-white font-bold" style={{ width: 20, height: 20, background: "var(--c-indigo)", fontSize: 9 }}>A</div>
            <div className="min-w-0">
              <p className="font-bold" style={{ fontSize: 9, lineHeight: 1.1 }}>Amara Osei</p>
              <p style={{ fontSize: 7, color: "var(--c-text-muted)" }}>Class 6B · St. Peter&apos;s</p>
            </div>
            <div className="ml-auto rounded-full shrink-0" style={{ width: 6, height: 6, background: "var(--c-emerald)" }} />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { l: "Attendance", v: "97%", ok: true },
              { l: "Homework", v: "2 due", ok: false },
              { l: "Reports", v: "Published", ok: true },
              { l: "Messages", v: "1 new", ok: false },
            ].map(({ l, v, ok }) => (
              <div key={l} className="rounded-lg p-1.5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
                <p style={{ fontSize: 7, color: "var(--c-text-muted)", marginBottom: 1 }}>{l}</p>
                <p className="font-bold" style={{ fontSize: 8.5, color: ok ? "var(--c-emerald)" : "var(--c-indigo)" }}>{v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-2" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-bold" style={{ fontSize: 8.5 }}>Friday story</p>
            <span className="rounded-full px-1.5" style={{ fontSize: 6.5, fontWeight: 800, background: "var(--c-indigo-bg)", color: "var(--c-indigo)", paddingTop: 1, paddingBottom: 1 }}>✦ AI</span>
          </div>
          <div className="flex items-center gap-0.5 mb-1">
            {[...Array(5)].map((_, i) => <Star key={i} size={8} style={{ fill: "var(--c-gold)", color: "var(--c-gold)" }} aria-hidden />)}
            <span style={{ fontSize: 7, fontWeight: 700, marginLeft: 3 }}>Great week</span>
          </div>
          <p style={{ fontSize: 7, color: "var(--c-text-mid)", lineHeight: 1.4 }}>Strong participation and every homework in on time. Keep it up!</p>
        </div>

        <div className="rounded-xl p-1.5 flex items-start gap-1.5" style={{ background: "var(--c-red-bg)", border: "1px solid color-mix(in srgb, var(--c-red) 22%, transparent)" }}>
          <div className="rounded flex items-center justify-center shrink-0" style={{ width: 13, height: 13, background: "var(--c-red)", marginTop: 1 }}>
            <Bell size={7} className="text-white" aria-hidden />
          </div>
          <div>
            <p className="font-bold" style={{ fontSize: 7.5 }}>Absence alert</p>
            <p style={{ fontSize: 7, color: "var(--c-text-mid)", lineHeight: 1.3 }}>Marked absent today at 8:47am</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RoleScreen({ view, title }: { view: "dashboard" | "attendance" | "parent"; title: string }) {
  return (
    <div className="flex flex-col h-full" style={{ background: "var(--c-surface)", color: "var(--c-text)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Browser-style top bar */}
      <div className="flex items-center gap-1.5 px-2.5 shrink-0" style={{ height: 19, background: "var(--c-bg)", borderBottom: "1px solid var(--c-border)" }}>
        <span className="rounded-full" style={{ width: 5, height: 5, background: "var(--c-red)" }} />
        <span className="rounded-full" style={{ width: 5, height: 5, background: "var(--c-gold)" }} />
        <span className="rounded-full" style={{ width: 5, height: 5, background: "var(--c-emerald)" }} />
        <span className="flex-1 text-center truncate" style={{ fontSize: 7, color: "var(--c-text-muted)", fontWeight: 600 }}>{title}</span>
        <span style={{ width: 14 }} />
      </div>
      <div className="flex-1 px-3 py-2.5" style={{ overflow: "hidden" }}>
        {view === "dashboard"  && <DemoDashboard />}
        {view === "attendance" && <DemoAttendance />}
        {view === "parent"     && <DemoParent />}
      </div>
    </div>
  )
}

function DemoParent() {
  return (
    <div className="grid grid-cols-2 gap-2 h-full">
      {/* Left: child overview */}
      <div className="space-y-2">
        <div className="rounded-lg p-2" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ width: 22, height: 22, background: "var(--c-indigo)", fontSize: 10 }}>A</div>
            <div className="min-w-0">
              <p className="font-bold" style={{ fontSize: 9.5, lineHeight: 1.1 }}>Amara Osei</p>
              <p style={{ fontSize: 7, color: "var(--c-text-muted)" }}>Class 6B · Week 3</p>
            </div>
            <div className="ml-auto rounded-full shrink-0" style={{ width: 6, height: 6, background: "var(--c-emerald)" }} />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { l: "Attendance", v: "97%", c: "var(--c-emerald)" },
              { l: "Homework", v: "2 due", c: "var(--c-gold)" },
              { l: "Reports", v: "Published", c: "var(--c-emerald)" },
              { l: "Messages", v: "1 new", c: "var(--c-indigo)" },
            ].map(({ l, v, c }) => (
              <div key={l} className="rounded-md p-1.5" style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
                <p style={{ fontSize: 7, color: "var(--c-text-muted)", marginBottom: 1 }}>{l}</p>
                <p className="font-bold" style={{ fontSize: 8.5, color: c }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: report + alert */}
      <div className="space-y-2">
        <div className="rounded-lg p-2" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-bold" style={{ fontSize: 9 }}>Friday story</p>
            <span className="rounded-full px-1.5" style={{ fontSize: 6.5, fontWeight: 800, background: "var(--c-indigo-bg)", color: "var(--c-indigo)", paddingTop: 1, paddingBottom: 1 }}>✦ AI</span>
          </div>
          <div className="flex items-center gap-0.5 mb-1.5">
            {[...Array(5)].map((_, i) => <Star key={i} size={8} style={{ fill: "var(--c-gold)", color: "var(--c-gold)" }} aria-hidden />)}
            <span style={{ fontSize: 7, fontWeight: 700, marginLeft: 3 }}>Great week</span>
          </div>
          <p style={{ fontSize: 7, color: "var(--c-text-mid)", lineHeight: 1.4 }}>Strong participation and every homework in on time. Keep it up, Amara!</p>
        </div>
        <div className="rounded-lg p-1.5 flex items-start gap-1.5" style={{ background: "var(--c-red-bg)", border: "1px solid color-mix(in srgb, var(--c-red) 22%, transparent)" }}>
          <div className="rounded flex items-center justify-center shrink-0" style={{ width: 13, height: 13, background: "var(--c-red)", marginTop: 1 }}>
            <Bell size={7} className="text-white" aria-hidden />
          </div>
          <div>
            <p className="font-bold" style={{ fontSize: 7.5 }}>Absence alert</p>
            <p style={{ fontSize: 7, color: "var(--c-text-mid)", lineHeight: 1.3 }}>Marked absent today at 8:47am</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Friday story phone (used in the Features spotlight) ─────────────────────

function WeeklyReportPhone() {
  const width = 340
  const bezel = Math.round(width * 0.043)
  const screenW = width - bezel * 2
  const screenH = Math.round(screenW * 1.92)
  const deviceH = screenH + bezel * 2
  const deviceR = Math.round(width * 0.2)
  return (
    <div className="phone-float" style={{ position: "relative", width }}>
      <div
        style={{
          width, height: deviceH, borderRadius: deviceR, padding: bezel, position: "relative",
          background: "linear-gradient(150deg, oklch(40% 0.012 264) 0%, oklch(22% 0.012 264) 55%, oklch(15% 0.01 264) 100%)",
          boxShadow: "inset 0 1px 1px oklch(70% 0.02 264 / 0.5), 0 0 0 1px oklch(46% 0.02 264 / 0.4), 0 34px 80px rgba(0,0,0,0.5), 0 0 100px oklch(72% 0.15 64 / 0.22)",
        }}
      >
        <div style={{ position: "relative", width: screenW, height: screenH, borderRadius: deviceR - bezel, overflow: "hidden", background: "var(--c-bg)" }}>
          <div className="flex flex-col h-full" style={{ background: "var(--c-surface)", color: "var(--c-text)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* Gradient header, warm */}
            <div style={{ background: "linear-gradient(135deg, var(--c-indigo) 0%, oklch(54% 0.16 30) 100%)", flexShrink: 0 }}>
              <div className="flex items-center justify-between" style={{ padding: "8px 18px 2px" }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.95)" }}>9:41</span>
                <span style={{ width: 16, height: 8, borderRadius: 2.5, border: "1px solid rgba(255,255,255,0.65)", position: "relative", display: "inline-block" }}>
                  <span style={{ position: "absolute", top: 1, left: 1, bottom: 1, width: "75%", borderRadius: 1.5, background: "rgba(255,255,255,0.9)" }} />
                </span>
              </div>
              <div style={{ padding: "4px 16px 13px" }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 600, color: "rgba(255,255,255,0.78)" }}>Amara&apos;s Friday story</span>
                  <span className="rounded-full" style={{ fontSize: 8, fontWeight: 800, background: "rgba(255,255,255,0.18)", color: "#fff", padding: "2px 7px" }}>✦ Pro</span>
                </div>
                <p className="font-bold" style={{ fontSize: 15, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.01em" }}>Amara Osei-Mensah</p>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.68)", marginTop: 1 }}>Week 3 · Term 2 · Fri 30 May</p>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 p-3 space-y-2.5" style={{ overflow: "hidden" }}>
              <div className="rounded-xl p-3" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold" style={{ fontSize: 10.5 }}>Attendance this week</p>
                  <span className="font-bold" style={{ fontSize: 10.5, color: "var(--c-emerald)" }}>5/5</span>
                </div>
                <div className="flex gap-1.5">
                  {["M", "T", "W", "T", "F"].map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-md" style={{ height: 34, background: "var(--c-emerald)" }} />
                      <p style={{ fontSize: 8.5, color: "var(--c-text-muted)" }}>{d}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-3" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold" style={{ fontSize: 10.5 }}>Homework</p>
                  <span className="rounded-full" style={{ fontSize: 8.5, fontWeight: 700, background: "var(--c-emerald-bg)", color: "var(--c-emerald)", padding: "2px 8px" }}>4 of 4</span>
                </div>
                <div className="rounded-full overflow-hidden" style={{ height: 6, background: "var(--c-surface)" }}>
                  <div className="h-full rounded-full" style={{ width: "100%", background: "var(--c-emerald)" }} />
                </div>
              </div>

              <div className="rounded-xl p-3" style={{ background: "var(--c-gold-bg)", border: "1px solid color-mix(in srgb, var(--c-gold) 22%, transparent)" }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Heart size={12} style={{ color: "var(--c-gold)" }} aria-hidden />
                  <p className="font-bold" style={{ fontSize: 10, color: "var(--c-gold)" }}>This week&apos;s note</p>
                </div>
                <p style={{ fontSize: 9.5, color: "var(--c-text-mid)", lineHeight: 1.5 }}>
                  &ldquo;Amara&apos;s curiosity lit up the science practical this week, her question had the whole class thinking.&rdquo;
                </p>
              </div>

              <div className="rounded-xl p-3" style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)" }}>
                <p className="font-bold" style={{ fontSize: 10, marginBottom: 6 }}>Next week</p>
                {[{ icon: Calendar, t: "Sports Day · Tuesday 6 June" }, { icon: BookOpen, t: "Maths test · Thursday 8 June" }].map(({ icon: Icon, t }) => (
                  <div key={t} className="flex items-center gap-2" style={{ marginBottom: 3 }}>
                    <Icon size={11} style={{ color: "var(--c-text-muted)" }} aria-hidden />
                    <span style={{ fontSize: 9, color: "var(--c-text-mid)" }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Island + home indicator */}
          <div style={{ position: "absolute", top: 7, left: "50%", transform: "translateX(-50%)", width: screenW * 0.32, height: Math.round(width * 0.08), borderRadius: 999, background: "#000", zIndex: 10 }} aria-hidden />
          <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", width: screenW * 0.3, height: 4, borderRadius: 999, background: "oklch(40% 0.01 264 / 0.35)", zIndex: 10 }} aria-hidden />
        </div>
      </div>
    </div>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

// Teaser, editorial split + typographic price ladder. Full grid lives on /pricing.
function PricingSection() {
  const tiers = [
    { name: "Free",       students: "Up to 100 students", price: "$0",     period: "forever" },
    { name: "Pro",        students: "Up to 500 students", price: "$74",    period: "/mo", featured: true },
    { name: "Enterprise", students: "Multi-campus",       price: "Custom", period: "" },
  ]
  return (
    <section id="pricing" style={{ padding: "clamp(72px, 11vw, 120px) 20px", background: "var(--w-sand)", position: "relative", overflow: "hidden" }}>
      {/* soft warm depth behind the ladder */}
      <div aria-hidden className="w-breathe" style={{ position: "absolute", width: 460, height: 460, borderRadius: "50%", right: "-6%", top: "12%", background: "radial-gradient(circle, var(--w-amber-bg), transparent 68%)", opacity: 0.7, pointerEvents: "none" }} />

      <div className="max-w-6xl mx-auto relative grid lg:grid-cols-[1.04fr_0.96fr] gap-12 lg:gap-20 items-center">
        {/* Left, editorial statement */}
        <Rise variant="left">
          <p className="w-label">Pricing</p>
          <h2 className="w-display" style={{ fontSize: "clamp(2rem, 4.2vw, 3.1rem)", lineHeight: 1.04 }}>
            Free for your first 100 students.{" "}
            <span style={{ color: "var(--w-amber-ink)" }}>Then one flat fee, per school.</span>
          </h2>
          <p style={{ fontSize: "clamp(1rem, 1.4vw, 1.15rem)", color: "var(--w-ink-soft)", lineHeight: 1.75, maxWidth: "46ch", marginTop: "1.25rem" }}>
            Every parent, teacher and admin is included. No per-seat maths, no surprises.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-9">
            <a href="/pricing" className="w-btn group" style={{ justifyContent: "center" }}>
              See full pricing <span className="w-btn-icon"><ArrowRight size={15} aria-hidden /></span>
            </a>
            <a href="/signup" className="w-btn-ghost" style={{ justifyContent: "center" }}>Start free</a>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--w-ink-faint)", marginTop: "1.1rem" }}>
            14-day Pro trial. No card required.
          </p>
        </Rise>

        {/* Right, typographic price ladder */}
        <Rise variant="right" delay={140} className="relative">
          {tiers.map((t, i) => (
            <div key={t.name}
              className="flex items-end justify-between"
              style={{
                padding: t.featured ? "20px 22px" : "20px 4px",
                marginTop: t.featured ? 8 : 0,
                marginBottom: t.featured ? 8 : 0,
                borderTop: (i > 0 && !t.featured && !tiers[i - 1].featured) ? "1px solid var(--w-line)" : "none",
                borderRadius: t.featured ? 22 : 0,
                background: t.featured ? "var(--w-amber)" : "transparent",
                boxShadow: t.featured ? "0 1px 0 oklch(100% 0 0 / 0.4) inset, 0 20px 44px -18px oklch(62% 0.15 60 / 0.5)" : "none",
              }}>
              <div>
                <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: t.featured ? "oklch(30% 0.06 56)" : "var(--w-ink-soft)" }}>{t.name}</span>
                  {t.featured && (
                    <span className="inline-flex items-center gap-1" style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 100, background: "oklch(26% 0.06 58)", color: "var(--w-amber)" }}>
                      <Sparkles size={9} strokeWidth={2} /> Most loved
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "0.85rem", color: t.featured ? "oklch(34% 0.06 56)" : "var(--w-ink-faint)" }}>{t.students}</span>
              </div>
              <div className="flex items-baseline gap-1 shrink-0">
                <span className="w-display" style={{ fontSize: "clamp(2rem, 3.4vw, 2.75rem)", lineHeight: 0.9, letterSpacing: "-0.03em", color: t.featured ? "oklch(22% 0.06 56)" : "var(--w-ink)" }}>{t.price}</span>
                {t.period && <span style={{ fontSize: "0.8rem", color: t.featured ? "oklch(34% 0.06 56)" : "var(--w-ink-faint)" }}>{t.period}</span>}
              </div>
            </div>
          ))}
        </Rise>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function TestimonialsSection() {
  const { ref, visible } = useReveal()
  return (
    <section
      id="testimonials"
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ padding: "clamp(72px, 11vw, 120px) 0", background: "var(--w-cream)", overflow: "hidden" }}
    >
      <div className="max-w-6xl mx-auto px-5">
        <div className="mb-12 text-center">
          <p className="w-label">Loved by real schools</p>
          <h2 className={`w-display reveal ${visible ? "visible" : ""}`} style={{ fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05 }}>
            Warm words from our schools.
          </h2>
        </div>
      </div>

      <div className={`w-tmarquee reveal ${visible ? "visible" : ""}`}>
          <div className="w-tmarquee-track">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <figure key={`${t.id}-${i}`} className="w-tcard" aria-hidden={i >= TESTIMONIALS.length ? true : undefined}>
                <div className="w-card w-card-hover h-full" style={{ padding: 28 }}>
                  <Quote size={26} style={{ color: t.accent, opacity: 0.5, marginBottom: 12 }} aria-hidden />
                  <blockquote style={{ fontSize: "0.9375rem", color: "var(--w-ink-soft)", lineHeight: 1.8, marginBottom: 24 }}>
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="flex items-center gap-3">
                    <Photo src={t.photo} alt={t.name} tag="" radius="50%" style={{ width: 44, height: 44, flexShrink: 0, boxShadow: "none" }} />
                    <div>
                      <p style={{ fontWeight: 800, fontSize: "0.875rem", color: "var(--w-ink)" }}>{t.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--w-ink-faint)" }}>{t.role} · {t.school}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--w-ink-faint)" }}>{t.location}</p>
                    </div>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
      </div>
    </section>
  )
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  const { ref, visible } = useReveal()
  const toggle = useCallback((i: number) => setOpen((cur) => cur === i ? null : i), [])

  return (
    <section
      style={{ padding: "clamp(72px, 11vw, 120px) 20px", background: "var(--w-cream)" }}
      ref={ref as React.RefObject<HTMLDivElement>}
    >
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.6fr] gap-12 lg:gap-20 items-start">
        <div className={`reveal ${visible ? "visible" : ""}`}>
          <p className="w-label">Good to know</p>
          <h2 className="w-display" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", lineHeight: 1.05, marginBottom: "1rem" }}>
            Common questions
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--w-ink-soft)", lineHeight: 1.75 }}>
            Everything you need to know before getting started. Can&apos;t find what you&apos;re looking for? We&apos;re happy to chat.
          </p>
        </div>
        <div className="w-card overflow-hidden" style={{ borderRadius: 28, padding: 0 }}>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} style={{ borderBottom: i < FAQ_ITEMS.length - 1 ? "1px solid var(--w-line)" : "none" }}>
              <button
                type="button"
                aria-expanded={open === i}
                aria-controls={`faq-${i}`}
                id={`faq-btn-${i}`}
                className="w-faq-btn"
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 16, padding: "22px 24px", cursor: "pointer", border: "none", textAlign: "left",
                  background: open === i ? "var(--w-amber-bg)" : "transparent",
                  transition: "background 150ms var(--ease-out)",
                }}
                onClick={() => toggle(i)}
              >
                <span style={{ fontSize: "0.9375rem", fontWeight: open === i ? 800 : 600, color: open === i ? "var(--w-amber-ink)" : "var(--w-ink)", lineHeight: 1.5, transition: "color 150ms var(--ease-out)" }}>
                  {item.q}
                </span>
                <ChevronDown size={18} aria-hidden style={{ flexShrink: 0, color: open === i ? "var(--w-amber-ink)" : "var(--w-ink-faint)", transform: open === i ? "rotate(180deg)" : "none", transition: "transform 280ms var(--ease-out), color 150ms var(--ease-out)" }} />
              </button>
              <div
                id={`faq-${i}`}
                role="region"
                aria-labelledby={`faq-btn-${i}`}
                className="faq-answer"
                style={{ overflow: "hidden", maxHeight: open === i ? 360 : 0, opacity: open === i ? 1 : 0, transition: "max-height 320ms var(--ease-out), opacity 260ms var(--ease-out)" }}
              >
                <p style={{ padding: "0 24px 22px", fontSize: "0.9375rem", color: "var(--w-ink-soft)", lineHeight: 1.75 }}>
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

// ─── Final CTA, warm cocoa with curved top ──────────────────────────────────

function FinalCTA() {
  const { ref, visible } = useReveal()
  return (
    <section
      ref={ref as React.RefObject<HTMLDivElement>}
      style={{ background: "var(--w-cocoa)", position: "relative" }}
      aria-label="Get started with Scholr"
    >
      <div style={{ background: "var(--w-cocoa)", padding: "clamp(56px, 10vw, 110px) 20px clamp(80px, 14vw, 130px)", position: "relative", overflow: "hidden" }}>
        {/* Warm glow */}
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 60% at 50% 40%, oklch(72% 0.155 64 / 0.2) 0%, transparent 70%)" }} />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2
            className={`w-display mb-6 reveal ${visible ? "visible" : ""}`}
            style={{ fontSize: "clamp(2.25rem, 5vw, 3.75rem)", lineHeight: 1.02, color: "oklch(98% 0.01 80)" }}
          >
            Let&apos;s bring your school closer together.
          </h2>
          <p
            className={`mb-10 reveal reveal-delay-1 ${visible ? "visible" : ""}`}
            style={{ fontSize: "1.125rem", color: "oklch(82% 0.02 75)", maxWidth: "46ch", margin: "0 auto 40px", lineHeight: 1.8 }}
          >
            Join 800+ schools across the US, UK, Nigeria, Ghana and Canada. Setup takes 15 minutes. Free for schools under 100 students.
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center reveal reveal-delay-2 ${visible ? "visible" : ""}`}>
            <a href="/signup" className="w-btn group" style={{ justifyContent: "center" }}>
              Get your school on Scholr
              <span className="w-btn-icon"><ArrowRight size={15} aria-hidden /></span>
            </a>
            <a href="mailto:abrahamayoola35@gmail.com" className="w-btn-ghost" style={{ justifyContent: "center", background: "oklch(100% 0 0 / 0.08)", border: "1.5px solid oklch(100% 0 0 / 0.2)", color: "oklch(94% 0.01 80)" }}>
              Talk to us first
            </a>
          </div>
          <p className={`mt-7 reveal reveal-delay-3 ${visible ? "visible" : ""}`} style={{ fontSize: "0.875rem" }}>
            <a href="/find-school" style={{ color: "var(--w-amber)", fontWeight: 700, textDecoration: "none" }}>
              Teacher or parent? Find your school →
            </a>
          </p>
          <p className={`mt-4 text-sm reveal reveal-delay-3 ${visible ? "visible" : ""}`} style={{ color: "oklch(64% 0.015 70)" }}>
            No credit card required · Cancel anytime · FERPA and GDPR compliant
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer aria-label="Site footer" style={{ background: "var(--w-cocoa-2)", padding: "64px 20px 32px" }}>
      <div className="max-w-6xl mx-auto">
        <Rise className="grid md:grid-cols-4 gap-10 mb-12">
          <div>
            <a href="/" aria-label="Scholr home" className="flex items-center gap-2.5 mb-4" style={{ textDecoration: "none" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "var(--w-amber)" }}>
                <GraduationCap size={16} aria-hidden style={{ color: "oklch(26% 0.06 58)" }} />
              </div>
              <span className="w-display text-xl" style={{ color: "oklch(97% 0.01 80)" }}>Scholr</span>
            </a>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "oklch(70% 0.015 70)", maxWidth: "28ch" }}>
              Warm school communication for modern schools, where parents, teachers and families stay close.
            </p>
            <div className="flex gap-3 flex-wrap">
              {["🇺🇸", "🇬🇧", "🇳🇬", "🇬🇭", "🇨🇦"].map((flag) => (
                <span key={flag} className="text-lg" aria-hidden>{flag}</span>
              ))}
            </div>
          </div>
          {FOOTER_NAV.map((col) => (
            <nav key={col.title} aria-label={`${col.title} links`}>
              <p className="font-bold text-sm mb-4" style={{ color: "oklch(95% 0.01 80)" }}>{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      style={{ fontSize: "0.875rem", color: "oklch(66% 0.015 70)", textDecoration: "none", transition: "color 150ms var(--ease-out)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--w-amber)" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "oklch(66% 0.015 70)" }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </Rise>
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid oklch(34% 0.02 58)" }}>
          <p style={{ fontSize: "0.8125rem", color: "oklch(58% 0.015 68)" }}>© 2026 Scholr. Made with care.</p>
          <div className="flex gap-6">
            {[{ l: "Privacy Policy", h: "/privacy" }, { l: "Terms of Service", h: "/terms" }].map(({ l, h }) => (
              <a key={l} href={h}
                style={{ fontSize: "0.8125rem", color: "oklch(58% 0.015 68)", textDecoration: "none", transition: "color 150ms var(--ease-out)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "oklch(80% 0.015 72)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "oklch(58% 0.015 68)" }}
              >
                {l}
              </a>
            ))}
          </div>
          <p style={{ fontSize: "0.8125rem", color: "oklch(58% 0.015 68)" }}>FERPA · GDPR · COPPA compliant</p>
        </div>
      </div>
    </footer>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  // Scroll-linked motion (parallax + cinematic video scrub). Reduced-motion safe.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const speed = parseFloat(el.dataset.parallax || "0")
        gsap.to(el, {
          yPercent: speed,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
        })
      })
      const video = document.querySelector(".w-video-band video")
      if (video) {
        gsap.fromTo(video, { scale: 1.16 }, {
          scale: 1, ease: "none",
          scrollTrigger: { trigger: ".w-video-band", start: "top bottom", end: "bottom top", scrub: true },
        })
      }
    })
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener("load", refresh)
    const t = setTimeout(refresh, 600)
    return () => { window.removeEventListener("load", refresh); clearTimeout(t); ctx.revert() }
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: "var(--w-cream)", overflowX: "clip" }}>
      <SmoothScroll />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <VideoBand />
        <ProblemSection />
        <FeaturesSection />
        <RoleShowcase />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CurveDivider from="var(--w-cream)" to="var(--w-cocoa)" />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
