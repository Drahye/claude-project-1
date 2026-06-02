import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, GraduationCap } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms of Service — Scholr",
  description: "The terms and conditions governing your use of Scholr.",
}

const SECTIONS = [
  {
    title: "1. Acceptance of terms",
    body: `By accessing or using Scholr ("the Service"), you agree to be bound by these Terms of Service. If you are accepting on behalf of a school or organisation, you represent that you have authority to bind that entity. If you do not agree, do not use the Service.`,
  },
  {
    title: "2. The Service",
    body: `Scholr provides a cloud-based school management platform including student records, attendance tracking, homework management, messaging, AI report generation, and related features. We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.`,
  },
  {
    title: "3. Account registration",
    body: `You must provide accurate, current, and complete information when registering. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us immediately at hello@scholr.app if you suspect unauthorised access.

Each school account may have one admin. The admin is responsible for managing teacher and parent access within their school.`,
  },
  {
    title: "4. Acceptable use",
    body: `You agree not to:
• Use the Service for any unlawful purpose or in violation of any regulations
• Upload or transmit harmful, offensive, or inappropriate content
• Attempt to gain unauthorised access to any part of the Service or its infrastructure
• Scrape, crawl, or systematically extract data from the Service
• Resell or sublicense access to the Service
• Use the Service to store or process data unrelated to school management

We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: "5. Subscription and payment",
    body: `Scholr offers Free and paid plans. Paid plans are billed monthly or annually via Stripe. All prices are in USD unless otherwise stated.

You may cancel at any time from Settings → Billing. Cancellation takes effect at the end of the current billing period — you retain access until then. We do not offer refunds for partial periods except where required by law.

We may change pricing with 30 days' notice. Continued use after the effective date constitutes acceptance of the new pricing.`,
  },
  {
    title: "6. Free trial",
    body: `New accounts receive a 14-day free trial of the Pro plan. No credit card is required to start the trial. At the end of the trial, the account automatically reverts to the Free plan unless you upgrade.`,
  },
  {
    title: "7. Data ownership",
    body: `You retain full ownership of all data you input into the Service, including student records, attendance data, and uploaded files. You grant Scholr a limited licence to process this data solely to provide the Service.

We do not claim ownership of your data. On cancellation, you may export all data from Settings → Data. Data is permanently deleted 30 days after account closure.`,
  },
  {
    title: "8. AI features",
    body: `Scholr uses Anthropic's Claude AI to generate report summaries and analytics. AI-generated content is provided for informational purposes only. Teachers and administrators should review AI outputs before sharing with parents or students. Scholr is not responsible for inaccuracies in AI-generated content.

Student data passed to the AI is anonymised where possible. We do not use your data to train AI models.`,
  },
  {
    title: "9. Intellectual property",
    body: `Scholr and its licensors own all rights to the Service, including software, design, trademarks, and documentation. These Terms do not grant you any ownership rights. You may not copy, modify, distribute, or create derivative works from any part of the Service without our written permission.`,
  },
  {
    title: "10. Limitation of liability",
    body: `To the maximum extent permitted by law, Scholr's total liability for any claim arising from your use of the Service is limited to the amount you paid us in the 12 months preceding the claim.

We are not liable for indirect, incidental, special, or consequential damages, including loss of data, loss of profits, or business interruption, even if advised of the possibility of such damages.`,
  },
  {
    title: "11. Warranty disclaimer",
    body: `The Service is provided "as is" and "as available" without warranties of any kind. We do not warrant that the Service will be uninterrupted, error-free, or meet your specific requirements.`,
  },
  {
    title: "12. Governing law",
    body: `These Terms are governed by the laws of Nigeria. Any disputes shall be resolved in the courts of Lagos State, Nigeria, except where local mandatory consumer protection laws apply.`,
  },
  {
    title: "13. Changes to terms",
    body: `We may update these Terms at any time. We will provide at least 14 days' notice of material changes via email and in-app notification. Continued use after the effective date constitutes acceptance.`,
  },
  {
    title: "14. Contact",
    body: `Questions about these Terms? Contact us at:

hello@scholr.app
Scholr Inc., Lagos, Nigeria`,
  },
]

export default function TermsPage() {
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
        <Link href="/" className="flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity"
          style={{ color: "var(--c-text-muted)", textDecoration: "none" }}>
          <ArrowLeft size={14} /> Back to home
        </Link>
      </header>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "60px 24px 80px" }}>
        {/* Hero */}
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--c-indigo)" }}>
            Legal
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4"
            style={{ color: "var(--c-text)", letterSpacing: "-0.03em" }}>
            Terms of Service
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--c-text-muted)" }}>
            Last updated: June 2025
          </p>
          <p className="text-base leading-relaxed mt-3" style={{ color: "var(--c-text-muted)" }}>
            Please read these terms carefully before using Scholr. They govern your access to and use of the platform.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--c-text)", letterSpacing: "-0.01em" }}>
                {section.title}
              </h2>
              <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--c-text-muted)" }}>
                {section.body}
              </div>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 flex flex-wrap gap-4 text-sm" style={{ borderTop: "1px solid var(--c-border)" }}>
          <Link href="/privacy" style={{ color: "var(--c-indigo)", textDecoration: "none", fontWeight: 600 }}>
            Privacy Policy →
          </Link>
          <a href="mailto:hello@scholr.app" style={{ color: "var(--c-text-muted)", textDecoration: "none" }}>
            hello@scholr.app
          </a>
        </div>
      </div>
    </div>
  )
}
