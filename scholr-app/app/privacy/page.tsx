import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, GraduationCap } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy, Scholr",
  description: "How Scholr collects, uses, and protects your data.",
}

const SECTIONS = [
  {
    title: "1. Information we collect",
    body: `We collect information you provide directly, such as your name, email address, school name, and payment details when you register or upgrade. We also collect usage data (pages visited, features used, login times) to improve the product, and technical data (IP address, browser type, device identifiers) for security and diagnostics.

For schools using Scholr, we store student, teacher, and parent records that administrators enter into the platform. This data belongs to the school and is processed on their behalf.`,
  },
  {
    title: "2. How we use your information",
    body: `We use your information to:
• Provide, maintain, and improve the Scholr platform
• Process payments and manage subscriptions
• Send transactional emails (account confirmation, password reset, invoices)
• Generate AI-powered reports and insights within the platform
• Detect and prevent fraud or abuse
• Comply with legal obligations

We do not sell your personal data to third parties. We do not use student data for advertising purposes.`,
  },
  {
    title: "3. Data storage and security",
    body: `All data is stored on Supabase infrastructure hosted in the EU (Frankfurt) by default. Data is encrypted in transit (TLS 1.2+) and at rest (AES-256). We implement role-based access controls so that each school's data is isolated from other schools.

We perform regular backups and maintain audit logs of administrative actions. Payment data is processed by Stripe and never stored on our servers.`,
  },
  {
    title: "4. Data sharing",
    body: `We share data with the following sub-processors:
• Supabase (database and authentication infrastructure)
• Stripe (payment processing)
• Anthropic (AI report generation, only de-identified academic summaries)
• Resend (transactional email delivery)

We require all sub-processors to maintain appropriate security standards and only process data as instructed.`,
  },
  {
    title: "5. Student data (FERPA & GDPR)",
    body: `Scholr is designed to comply with FERPA (US) and GDPR (UK/EU). Student records are owned by the school. We act as a data processor under the school's instructions.

Schools can request full data export at any time from Settings → Data. On account closure, all data is permanently deleted within 30 days unless legally required to be retained.

We do not use student data for any purpose other than providing the service to the school.`,
  },
  {
    title: "6. Cookies",
    body: `We use essential cookies only, for session authentication and CSRF protection. We do not use tracking or advertising cookies. You can disable cookies in your browser settings, but this will prevent you from signing in.`,
  },
  {
    title: "7. Your rights",
    body: `Depending on your jurisdiction, you may have the right to:
• Access the personal data we hold about you
• Correct inaccurate data
• Request deletion of your data
• Object to or restrict processing
• Data portability (receive your data in a machine-readable format)

To exercise any of these rights, email abrahamayoola35@gmail.com with the subject "Data Request". We will respond within 30 days.`,
  },
  {
    title: "8. Children's privacy",
    body: `Scholr is a school management platform. Student records are managed by school administrators, students and parents do not create Scholr accounts directly unless the school enables parent portal access. We do not knowingly collect data from children under 13 outside of this school-administered context.`,
  },
  {
    title: "9. Changes to this policy",
    body: `We may update this Privacy Policy from time to time. We will notify account holders by email and display a notice in the platform at least 14 days before material changes take effect. Continued use of Scholr after the effective date constitutes acceptance of the revised policy.`,
  },
  {
    title: "10. Contact",
    body: `For privacy-related questions, contact our Data Protection Officer at:

abrahamayoola35@gmail.com
Scholr Inc., Lagos, Nigeria`,
  },
]

export default function PrivacyPage() {
  return (
    <div style={{ background: "var(--w-cream)", minHeight: "100vh" }}>
      {/* Nav */}
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6"
        style={{ background: "var(--w-cream)", borderBottom: "1px solid var(--w-line)", backdropFilter: "blur(12px)" }}>
        <Link href="/" className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--w-ink)", textDecoration: "none" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--w-amber-ink)" }}>
            <GraduationCap size={14} className="text-white" />
          </div>
          Scholr
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity"
          style={{ color: "var(--w-ink-soft)", textDecoration: "none" }}>
          <ArrowLeft size={14} /> Back to home
        </Link>
      </header>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "60px 24px 80px" }}>
        {/* Hero */}
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--w-amber-ink)" }}>
            Legal
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--w-ink)", letterSpacing: "-0.03em" }}>
            Privacy Policy
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--w-ink-soft)" }}>
            Last updated: June 2025
          </p>
          <p className="text-base leading-relaxed mt-3" style={{ color: "var(--w-ink-soft)" }}>
            Scholr is committed to protecting the privacy of schools, teachers, parents, and students.
            This policy explains how we collect, use, and safeguard your information.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--w-ink)", letterSpacing: "-0.01em" }}>
                {section.title}
              </h2>
              <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--w-ink-soft)" }}>
                {section.body}
              </div>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 flex flex-wrap gap-4 text-sm" style={{ borderTop: "1px solid var(--w-line)" }}>
          <Link href="/terms" style={{ color: "var(--w-amber-ink)", textDecoration: "none", fontWeight: 600 }}>
            Terms of Service →
          </Link>
          <a href="mailto:abrahamayoola35@gmail.com" style={{ color: "var(--w-ink-soft)", textDecoration: "none" }}>
            abrahamayoola35@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}
