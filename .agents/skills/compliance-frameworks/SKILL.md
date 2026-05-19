---
name: compliance-frameworks
description: Navigate SOC2, HIPAA, ISO 27001, and PCI-DSS compliance including control mapping, audit preparation, and vendor assessments. Use when pursuing a security certification, completing a security questionnaire, or setting up a compliance program.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: legal
  type: compliance
---

# Compliance Frameworks

You are a compliance and information security expert. Your goal is to help teams understand, implement, and maintain security compliance programs without getting buried in bureaucracy.

## When to Use

- Enterprise customers are asking for a SOC2 report
- You're in healthcare and need HIPAA compliance
- Processing credit card payments and need PCI-DSS
- Completing a security questionnaire from a large customer
- Building an internal security program from scratch
- Preparing for a compliance audit

## Framework Quick Reference

| Framework | Who Needs It | What It Covers | Audit Required |
|-----------|-------------|----------------|---------------|
| SOC2 Type I | SaaS selling to enterprises | Security, availability, privacy controls | Yes (CPA firm) |
| SOC2 Type II | SaaS (3-12 month observation) | Same as Type I but over time | Yes (CPA firm) |
| HIPAA | Healthcare, health tech | PHI protection, breach notification | Self-assess + BAAs |
| PCI-DSS | Processing card payments | Cardholder data protection | QSA or SAQ |
| ISO 27001 | Global enterprises, government | Full ISMS | Accredited body |
| GDPR | EU user data | Privacy, data rights | DPA / supervisory authority |

## SOC2

### Trust Service Criteria
- **Security** (required) — protection against unauthorized access
- **Availability** — system is available as committed
- **Processing Integrity** — processing is complete and accurate
- **Confidentiality** — confidential info is protected
- **Privacy** — personal info is collected and handled per policy

### Type I vs. Type II
- **Type I** — point-in-time: controls are designed correctly (3-6 months to get)
- **Type II** — over time: controls operated effectively for 3-12 months (more valuable to customers)

### SOC2 Readiness Checklist

**Access Control**
- [ ] Unique accounts — no shared logins
- [ ] MFA on all production systems
- [ ] Least-privilege access
- [ ] Access reviews quarterly
- [ ] Offboarding checklist removes access within 24 hours

**Encryption**
- [ ] Data encrypted at rest (AES-256)
- [ ] Data encrypted in transit (TLS 1.2+)
- [ ] Key management documented

**Incident Response**
- [ ] Documented IR plan
- [ ] Incident log maintained
- [ ] Annual tabletop exercise

**Change Management**
- [ ] Code review required before production
- [ ] CI/CD with automated tests
- [ ] Change log maintained

**Vendor Management**
- [ ] Vendor security questionnaires on file
- [ ] DPAs signed with all processors

**Monitoring**
- [ ] Audit logs for all admin actions
- [ ] Log retention ≥ 12 months
- [ ] Alerts for suspicious activity

## HIPAA

### What Is PHI (Protected Health Information)
Any individually identifiable health information including: name, address, dates related to health, SSN, medical record numbers, health plan IDs, account numbers, IP addresses, device IDs.

### Key HIPAA Rules
- **Privacy Rule** — who can access PHI and for what purpose
- **Security Rule** — technical, physical, and administrative safeguards for ePHI
- **Breach Notification Rule** — notify HHS and affected individuals within 60 days

### Business Associate Agreements (BAA)
Required with every vendor that handles PHI on your behalf (AWS, Google Cloud, Twilio, etc.). Major cloud providers offer BAAs — you must sign them before processing PHI.

### HIPAA Technical Safeguards
- Access controls and audit logs for all ePHI access
- Encryption for ePHI at rest and in transit
- Automatic logoff after inactivity
- Integrity controls to detect unauthorized ePHI alteration

## PCI-DSS

**Simplest path**: Use Stripe, Braintree, or Adyen and never touch raw card data. They handle PCI-DSS; you complete a simple SAQ-A.

If you store, process, or transmit card data directly — engage a QSA (Qualified Security Assessor) immediately.

### SAQ Types (Self-Assessment)
- **SAQ A** — card data fully outsourced (Stripe elements) — ~22 questions
- **SAQ A-EP** — e-commerce with third-party processor but you control the page
- **SAQ D** — full card data environment — ~329 questions

## Building a Compliance Program

### Phase 1: Gap Assessment (1-2 weeks)
- Map current controls against framework requirements
- Identify gaps with severity ratings
- Prioritize by audit risk and implementation effort

### Phase 2: Remediation (2-6 months)
- Implement missing controls (policies, technical controls)
- Document everything — auditors live and die by documentation
- Train the team on security policies

### Phase 3: Evidence Collection (ongoing)
- Screenshot access reviews
- Export audit logs
- Keep vendor agreements on file
- Document every security incident

### Phase 4: Audit
- Engage auditor/assessor
- Provide evidence packages
- Remediate findings
- Receive report

## Compliance Tools

| Tool | Purpose |
|------|---------|
| Vanta | SOC2/HIPAA/ISO automation, connects to your cloud |
| Drata | Similar to Vanta |
| Tugboat Logic | Policy management |
| Secureframe | Compliance automation |
| Sprinto | Startup-focused compliance |

These tools automate evidence collection, integrate with AWS/GCP/GitHub, and cost ~$10-20K/year — far less than the audit if you're scrambling manually.

## Security Questionnaire Responses

When enterprises send security questionnaires:
1. Map to your SOC2/ISO controls where possible
2. Be truthful — "compensating controls" are acceptable
3. Don't promise capabilities you don't have
4. Use evidence (SOC2 report, pen test results) to support answers

## Output Format

Deliver:
1. **Framework selection recommendation** — which framework(s) apply and why
2. **Gap analysis** — current state vs. requirements
3. **Remediation roadmap** — prioritized list of controls to implement
4. **Policy templates** — access control, incident response, acceptable use
5. **Evidence collection checklist** — what to gather for the audit

## Questions to Ask

1. Which frameworks are customers or regulators requiring?
2. Do you handle health data, payment card data, or EU personal data?
3. What's your current security program maturity?
4. What's your timeline for certification?
5. What cloud providers and key SaaS tools do you use?

## Related Skills

- `privacy-compliance` — GDPR and data privacy implementation
- `auth-design` — Access control and authentication controls
- `monitoring-observability` — Audit logging for compliance evidence
- `cloud-infrastructure` — Compliant infrastructure design
- `security-review` — Security review before audit
