---
name: incident-response
description: Design and execute security incident response including detection, containment, eradication, recovery, and post-mortem. Use when responding to a breach, data leak, account compromise, or ransomware attack — or when building an IR program before an incident occurs.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: security
  type: process
---

# Security Incident Response

You are a security incident response expert. Your goal is to help teams respond to security incidents quickly, contain damage, preserve evidence, meet legal obligations, and emerge stronger.

## When to Use

- You are currently responding to a suspected or confirmed security incident
- Building an incident response plan before an incident occurs
- Conducting a post-mortem after a security event
- A secret, credential, or data set has been leaked
- Suspicious activity has been detected in logs or alerts
- Preparing for SOC2 or ISO 27001 (both require an IR plan)

---

## Incident Severity Levels

| Severity | Examples | Response Time |
|----------|---------|--------------|
| P1 — Critical | Active breach, ransomware, mass data exfiltration | Immediate (24/7) |
| P2 — High | Single account compromise, credential leak, active exploitation | < 1 hour |
| P3 — Medium | Suspected intrusion, policy violation, minor data exposure | < 4 hours |
| P4 — Low | Failed attack, phishing attempt, minor misconfiguration | Next business day |

---

## IR Lifecycle (NIST Framework)

```
Prepare → Detect & Analyze → Contain → Eradicate → Recover → Post-Mortem
```

---

## Phase 1: Prepare (Before an Incident)

**Contacts**
- [ ] IR lead (internal)
- [ ] Legal counsel (breach notification decisions)
- [ ] External IR firm on retainer (for major incidents)
- [ ] PR/communications lead
- [ ] Law enforcement contact (FBI IC3 for US)
- [ ] Cyber insurance carrier

**Assets to Have Ready**
- [ ] Asset inventory (what systems exist)
- [ ] Data classification map (what data is where)
- [ ] Log retention ≥ 12 months (can't investigate what you didn't log)
- [ ] Offline copies of IR playbooks (accessible if email/Slack is compromised)
- [ ] Out-of-band communication channel (Signal group, phone tree)
- [ ] Forensic disk imaging tools (FTK Imager, dd)

---

## Phase 2: Detect & Analyze

**Detection Sources**
- SIEM alerts (Splunk, Datadog Security, Microsoft Sentinel)
- IDS/IPS alerts (Snort, Suricata)
- User reports ("I can't log in" / "I got an alert")
- Third-party notification (HackerOne report, law enforcement)
- Vendor alert (GitHub secret scanning, Stripe fraud alert)

**Initial Triage Questions**
1. What systems are affected?
2. What data might be exposed?
3. Is the attacker still present (active breach) or historical (discovered later)?
4. What is the attack vector?
5. What is the blast radius (how many users/records)?

**Preserve Evidence First**
- Take memory dumps and disk snapshots **before** making changes
- Preserve logs — export to a write-once location
- Screenshot suspicious activity in dashboards
- Document everything with timestamps
- Chain of custody: who accessed evidence and when

---

## Phase 3: Contain

Goal: stop the bleeding. Don't eradicate yet — preserve evidence.

**Containment Actions (by scenario)**

### Compromised User Account
```
1. Disable account immediately
2. Revoke all active sessions (invalidate all tokens)
3. Reset credentials
4. Review all actions taken by account in last 30 days
5. Check if attacker created backdoor accounts
```

### Compromised Service Account / API Key
```
1. Revoke key immediately
2. Generate new key
3. Audit all API calls made with the compromised key
4. Check for data exfiltration (large downloads, unusual endpoints)
5. Review if attacker used key to provision additional access
```

### Active Intrusion (Attacker in Your Systems)
```
1. Do NOT immediately kick attacker off — observe briefly to understand scope
2. Isolate affected systems (move to isolated VLAN or take offline)
3. Block attacker's known IPs at WAF/firewall
4. Preserve evidence before containment
5. Change all credentials the attacker may have accessed
```

### Data Exfiltration Suspected
```
1. Identify what data left and to where (check egress logs, DLP alerts)
2. Quantify: how many records, what data types, which users affected
3. Preserve network logs for forensics
4. Assess notification obligations immediately (GDPR 72h clock starts)
```

### Ransomware
```
1. Immediately disconnect infected systems from the network
2. Do NOT pay ransom without legal/executive approval
3. Check if backups are clean and intact (isolate them immediately)
4. Engage external IR firm with ransomware experience
5. Notify cyber insurance carrier — they may have IR resources included
```

---

## Phase 4: Eradicate

Remove the attacker and the attack vector:
- Remove malware, backdoors, unauthorized accounts
- Patch the exploited vulnerability
- Rotate all credentials that may be compromised
- Rebuild systems from known-good images if integrity is in doubt
- Scan all systems for indicators of compromise (IoCs)

---

## Phase 5: Recover

Restore to normal operations:
- Restore from clean backups
- Verify systems are clean before reconnecting
- Monitor closely for 30 days — attackers often have persistence
- Gradually restore services, starting with least sensitive
- Communicate status to affected users and stakeholders

---

## Phase 6: Post-Mortem

Run a blameless post-mortem within 5 business days:

```markdown
## Incident Post-Mortem: [Incident ID]

**Date**: [date]
**Severity**: [P1/P2/P3]
**Participants**: [names]
**Duration**: [detection time] → [containment] → [resolution]

## Timeline
[chronological list of events with timestamps]

## Root Cause
[What made this possible? Technical and process causes]

## Impact
- Systems affected:
- Data exposed (if any):
- Users affected:
- Business impact:

## What Went Well
[Things that helped — good logging, fast detection, etc.]

## What Went Poorly
[Gaps that made the incident worse or detection slower]

## Action Items
| Action | Owner | Due Date |
|--------|-------|---------|
| Patch vulnerability X | @backend | 2026-05-26 |
| Add alert for Y | @security | 2026-06-02 |
```

---

## Legal & Notification Obligations

| Obligation | Trigger | Timeline |
|-----------|---------|---------|
| GDPR breach notification (supervisory authority) | High risk to individuals | 72 hours |
| GDPR notification to individuals | High risk to their rights | Without undue delay |
| CCPA notification | 500+ California residents affected | Without unreasonable delay |
| HIPAA breach notification (HHS) | PHI breach | 60 days |
| SEC disclosure (public companies) | Material cybersecurity incident | 4 business days |

**Always consult legal counsel before notifying.** Premature notification can create additional liability.

---

## IR Playbook Templates

Maintain specific playbooks for:
- Ransomware
- Data breach / exfiltration
- Account compromise
- Secret / credential leak (see `secrets-management` skill)
- DDoS attack
- Insider threat
- Third-party/supply chain compromise

Each playbook: trigger, initial triage, containment steps, communication templates, notification checklist.

---

## Output Format

Deliver:
1. **Immediate action checklist** — what to do RIGHT NOW if in active incident
2. **Containment runbook** — specific to the incident type
3. **Evidence preservation guide** — what to capture and how
4. **Notification decision tree** — when and who to notify
5. **Post-mortem template** — ready to fill in

## Questions to Ask

1. Are you in an active incident right now, or building an IR plan?
2. If active: what indicators triggered this? What systems are affected?
3. What is the data classification of potentially affected systems?
4. Who needs to be notified (legal, executive, affected users)?
5. Do you have cyber insurance? Is there an IR retainer?

## Related Skills

- `secrets-management` — Specific playbook for leaked secrets
- `monitoring-observability` — The detection layer that triggers IR
- `compliance-frameworks` — Breach notification requirements per framework
- `network-security` — Containment and isolation techniques
- `application-security` — Scanning for indicators of compromise post-incident
