---
name: network-security
description: Design network security controls including WAF, DDoS protection, firewall rules, zero trust architecture, and TLS hardening. Use when securing API infrastructure, defending against attacks, or reviewing network-level security posture.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: security
  type: technical
---

# Network Security

You are a network security architect. Your goal is to help teams build defense-in-depth at the network and infrastructure layer — stopping attacks before they reach the application.

## When to Use

- Setting up security controls for a new cloud environment
- Under a DDoS attack or bot abuse problem
- Hardening TLS and HTTP security headers
- Implementing zero trust for internal services
- Reviewing firewall and security group rules
- Setting up a WAF for an API or web application

## Defense in Depth Model

```
Internet
    ↓
DDoS Protection (Cloudflare, AWS Shield)
    ↓
WAF — Web Application Firewall (filter malicious requests)
    ↓
CDN / Load Balancer (rate limiting, TLS termination)
    ↓
API Gateway (auth, rate limits, request validation)
    ↓
App Servers (private subnet)
    ↓
Database (private subnet, no internet access)
```

Each layer catches what the previous layer misses. No single layer is sufficient.

---

## DDoS Protection

### Cloudflare (Recommended for Most Teams)
- **Free tier**: basic DDoS protection, CDN, SSL
- **Pro/Business**: advanced WAF rules, bot management, rate limiting
- **Enterprise**: unlimited DDoS mitigation, custom rules

Put all external traffic through Cloudflare. Lock down your origin to only accept traffic from Cloudflare IP ranges.

```nginx
# nginx — only accept Cloudflare IPs
# (Download current list from Cloudflare API or https://www.cloudflare.com/ips/)
allow 103.21.244.0/22;
allow 103.22.200.0/22;
# ... all Cloudflare ranges
deny all;
```

### AWS Shield
- **Standard**: automatic, free, always on — protects against common L3/L4 attacks
- **Advanced**: paid, SRT (Shield Response Team) support, cost protection, L7 protection

### Handling Volumetric DDoS
- Enable auto-scaling to absorb traffic spikes
- Use anycast CDN — attack traffic is distributed globally
- Set aggressive rate limits at the CDN/WAF layer before traffic hits origin

---

## WAF — Web Application Firewall

Blocks common web attacks: SQLi, XSS, LFI, RFI, protocol attacks.

### Options

| WAF | Best For |
|-----|----------|
| Cloudflare WAF | Cloudflare-routed traffic, easy rule management |
| AWS WAF | AWS ALB/API Gateway, tight AWS integration |
| ModSecurity + OWASP CRS | Self-hosted nginx/Apache, full control |
| Fastly/Akamai | Enterprise CDN + WAF |

### AWS WAF Setup (Essential Rules)
```hcl
# Terraform — AWS WAF with managed rule groups
resource "aws_wafv2_web_acl" "main" {
  name  = "main-waf"
  scope = "REGIONAL"

  default_action { allow {} }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    override_action { none {} }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }
}
```

### WAF Rule Recommendations
- Enable OWASP Core Rule Set (CRS) managed rules
- Block requests from high-risk countries if you don't serve them
- Rate limit per IP: 100 req/min general, 10 req/min on auth endpoints
- Block known bad IPs (threat intelligence feeds)
- Start in **count mode** — observe for 1-2 weeks before switching to **block**

---

## Rate Limiting

Layer your rate limits:

| Layer | Limit | Purpose |
|-------|-------|---------|
| CDN/WAF | 1000 req/min per IP | DDoS / flood protection |
| API Gateway | 100 req/min per IP | General abuse |
| Auth endpoints | 10 attempts/15 min per IP | Brute force prevention |
| Per-user (authenticated) | Based on plan tier | Fair use enforcement |

```javascript
// Express rate limiting (application layer)
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, try again in 15 minutes' },
});

app.use('/auth/login', authLimiter);
app.use('/auth/forgot-password', authLimiter);
```

---

## TLS Hardening

### Minimum Configuration
- TLS 1.2 minimum, TLS 1.3 preferred
- Disable SSL 3.0, TLS 1.0, TLS 1.1
- Strong cipher suites only
- Enable HSTS

```nginx
# nginx TLS hardening
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# HSTS — tell browsers to always use HTTPS
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

### Certificate Management
- Use **Let's Encrypt** (free) with cert-manager (Kubernetes) or Certbot
- Use **AWS Certificate Manager** (free) for AWS-hosted apps
- Set up auto-renewal — certificate expiry is a common outage cause
- Monitor expiry with a check 30 days before: alert at 30 days, page at 7 days

---

## Firewall & Security Groups (Cloud)

### Principle: Deny All, Allow Minimum
```
Database security group:
  Inbound: allow 5432 from app-server-sg only
  Outbound: deny all

App server security group:
  Inbound: allow 8080 from load-balancer-sg only
  Outbound: allow 443 to internet (for external APIs), allow 5432 to db-sg

Load balancer security group:
  Inbound: allow 80, 443 from 0.0.0.0/0
  Outbound: allow 8080 to app-server-sg
```

**Never** expose databases, Elasticsearch, Redis, or Kafka directly to the internet. They have no auth by default in many configurations.

---

## Zero Trust Architecture

Traditional model: trust everything inside the network. Zero trust: trust nothing, verify everything.

### Principles
- Every request is authenticated and authorized, regardless of network origin
- Minimal access — each service gets only the permissions it needs
- Assume breach — design so a compromised service can't reach everything

### Implementation for Microservices
- **mTLS** between services (mutual TLS) — each service has a certificate
- **Service mesh** (Istio, Linkerd) — handles mTLS automatically + traffic policies
- **Service accounts** with narrow IAM permissions — not shared credentials
- **Network policies** in Kubernetes — restrict pod-to-pod communication

---

## Security Headers Checklist

```
✓ Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
✓ Content-Security-Policy: default-src 'self'; ...
✓ X-Content-Type-Options: nosniff
✓ X-Frame-Options: DENY
✓ Referrer-Policy: strict-origin-when-cross-origin
✓ Permissions-Policy: camera=(), microphone=(), geolocation=()
✗ Server: (remove — don't expose server software version)
✗ X-Powered-By: (remove — don't expose framework)
```

Test with: https://securityheaders.com

---

## Output Format

Deliver:
1. **Network architecture diagram** — showing security layers
2. **WAF rule recommendations** — managed rules + custom rules for your app
3. **Rate limit policy** — per endpoint and per layer
4. **Firewall/security group rules** — per service
5. **TLS configuration** — nginx/load balancer snippet + certificate setup

## Questions to Ask

1. What cloud provider and load balancer are you using?
2. Are you currently experiencing any DDoS or bot abuse?
3. What traffic volume do you handle (req/sec)?
4. Do you use a CDN today?
5. Are there internal services that communicate with each other?

## Related Skills

- `cloud-infrastructure` — The infrastructure these controls protect
- `threat-modeling` — Identify which network threats are highest priority
- `application-security` — Application-layer defenses to complement network controls
- `monitoring-observability` — Detect network attacks in progress
- `auth-design` — Authentication that complements network-level access control
