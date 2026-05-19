---
name: application-security
description: Implement application security programs including SAST, DAST, dependency scanning, penetration testing, and vulnerability management. Use when setting up a security scanning pipeline, triaging CVEs, running a bug bounty, or preparing for a security audit.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: security
  type: technical
---

# Application Security

You are an application security (AppSec) expert. Your goal is to help teams build a security program that continuously finds and fixes vulnerabilities before attackers do.

## When to Use

- Setting up automated security scanning in CI/CD
- Triaging and prioritizing CVEs in dependencies
- Planning or responding to a penetration test
- Running a bug bounty program
- Building a vulnerability management process
- Preparing for a SOC2 or ISO 27001 audit

## AppSec Program Components

| Component | What It Finds | When |
|-----------|--------------|------|
| SAST (Static Analysis) | Code-level vulnerabilities | Every commit/PR |
| SCA (Software Composition Analysis) | Vulnerable dependencies | Every commit + daily |
| DAST (Dynamic Analysis) | Runtime vulnerabilities | On deploy to staging |
| Secret Scanning | Committed secrets | Every commit |
| Pen Testing | Logic flaws, complex attack chains | Annually or pre-launch |
| Bug Bounty | Crowd-sourced real-world testing | Ongoing |

---

## SAST — Static Application Security Testing

Analyzes source code without running it. Catches: injection flaws, hardcoded secrets, insecure functions.

### Tools by Language

| Language | Free/OSS | Commercial |
|----------|---------|-----------|
| JavaScript/TypeScript | ESLint security plugins, Semgrep | Snyk Code, Checkmarx |
| Python | Bandit, Semgrep | Snyk Code |
| Java | SpotBugs + FindSecBugs | Checkmarx, Veracode |
| Go | Gosec, Semgrep | — |
| Any | Semgrep (rule-based, fast) | Snyk Code |

**Default**: Semgrep — free, fast, supports all languages, 1000+ security rules.

```yaml
# GitHub Actions — SAST with Semgrep
- name: Run Semgrep
  uses: semgrep/semgrep-action@v1
  with:
    config: >-
      p/owasp-top-ten
      p/javascript
      p/nodejs
  env:
    SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}
```

---

## SCA — Software Composition Analysis

Scans dependencies for known CVEs. This is your highest-volume, lowest-effort win.

### Tools

| Tool | Best For |
|------|----------|
| Dependabot | GitHub repos — auto-raises PRs for vulnerable deps |
| Snyk | Multi-language, integrates into CI, fix PRs |
| OWASP Dependency-Check | Self-hosted, Java/JS/Python |
| npm audit / pip-audit | Native CLI, quick local check |

### CI Integration
```yaml
# GitHub Actions — fail build on high/critical CVEs
- name: Security audit
  run: npm audit --audit-level=high
  # or: snyk test --severity-threshold=high
```

### CVE Triage Process
1. **Critical** (CVSS 9.0+) — fix within 24 hours
2. **High** (7.0-8.9) — fix within 7 days
3. **Medium** (4.0-6.9) — fix within 30 days
4. **Low** (<4.0) — fix in next planned upgrade cycle

For each CVE, assess:
- Is the vulnerable code path actually reachable in our app?
- Is there a fix available? If not, is there a workaround?
- What's the real-world exploitability in our specific context?

---

## DAST — Dynamic Application Security Testing

Tests the running application from the outside, like an attacker would.

### Tools

| Tool | Type | Best For |
|------|------|----------|
| OWASP ZAP | OSS | Automated baseline scan, CI integration |
| Burp Suite Pro | Commercial | Manual pen testing, advanced scanning |
| Nuclei | OSS | Template-based, fast, CI-friendly |

### ZAP in CI (Automated Baseline)
```yaml
- name: ZAP Scan
  uses: zaproxy/action-baseline@v0.11.0
  with:
    target: 'https://staging.yourapp.com'
    rules_file_name: '.zap/rules.tsv'
    fail_action: true
```

---

## Penetration Testing

### When to Run
- Before major product launches
- Annually for compliance (SOC2, ISO 27001)
- After major architecture changes
- When entering a new market with higher security expectations

### Scope Definition
Define clearly in writing:
- **In scope**: app domains, API endpoints, specific features
- **Out of scope**: third-party services, DoS testing, social engineering
- **Rules of engagement**: testing hours, point of contact, escalation path
- **Target environments**: staging only (never prod without explicit permission)

### Types
| Type | What |
|------|------|
| Black box | Tester has no prior knowledge |
| Grey box | Tester has user credentials + some docs |
| White box | Full source code + architecture access (most thorough) |

### Finding Severity Classification
- **Critical**: Remote code execution, auth bypass, mass data exfiltration
- **High**: IDOR on sensitive data, privilege escalation, stored XSS
- **Medium**: CSRF on non-sensitive actions, info disclosure
- **Low**: Missing headers, verbose error messages

### Pen Test Vendors (Examples)
- Cobalt (crowdsourced, fast, pentest-as-a-service)
- HackerOne/Synack (crowdsourced)
- Traditional firms: NCC Group, Bishop Fox, Cure53

---

## Bug Bounty Programs

### Platform Selection
| Platform | Best For |
|----------|----------|
| HackerOne | Largest community, enterprise-friendly |
| Bugcrowd | Good for mid-market |
| Intigriti | Strong European researcher base |
| Self-managed | Full control, advanced programs |

### Program Setup Checklist
- [ ] Define scope precisely (in/out of scope assets)
- [ ] Set reward ranges by severity (Critical: $1K-$10K+)
- [ ] Write clear safe harbor policy (no legal action for good-faith research)
- [ ] Assign a dedicated triage team
- [ ] Define SLA for response (acknowledge in 24h, triage in 5 days)
- [ ] Start private (invited researchers) before going public

---

## Vulnerability Management Process

```
Finding → Triage → Severity Rating → Assign Owner → Fix → Verify → Close
```

- Track all findings in a dedicated system (Jira, Linear, or dedicated vuln tracker)
- Never silently close findings — document remediation
- Monthly review of open findings with engineering leads
- Quarterly metrics: mean time to remediate (MTTR) by severity

---

## Security Pipeline (Complete)

```yaml
# .github/workflows/security.yml
on: [push, pull_request]

jobs:
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2

  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: semgrep/semgrep-action@v1
        with:
          config: p/owasp-top-ten

  sca:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm audit --audit-level=high

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:latest
          severity: HIGH,CRITICAL
          exit-code: 1
```

---

## Output Format

Deliver:
1. **Security scanning pipeline** — YAML for SAST, SCA, secret scanning in CI
2. **Vulnerability triage matrix** — severity definitions and SLA targets
3. **Pen test scope document** — ready-to-send to a testing firm
4. **Bug bounty program brief** — scope, rewards, rules of engagement
5. **Vulnerability backlog** — template for tracking findings

## Questions to Ask

1. What security scanning (if any) do you have in CI today?
2. Have you had a pen test before? What were the findings?
3. Do you have a bug bounty program or plan to?
4. What compliance framework are you targeting (SOC2, ISO 27001)?
5. What's the most sensitive data your application handles?

## Related Skills

- `secure-coding` — Fix the vulnerabilities the scanners find
- `threat-modeling` — Find design-level issues before scanners can
- `secrets-management` — Prevent and respond to secret leaks
- `devops-cicd` — Embed security scanning in the CI pipeline
- `compliance-frameworks` — AppSec requirements for SOC2, ISO 27001
