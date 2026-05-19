---
name: auth-design
description: Design authentication and authorization systems including OAuth 2.0, JWT, session management, RBAC, ABAC, and SSO. Use when building login flows, API security, permission systems, or integrating identity providers.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: engineering
  type: technical
---

# Authentication & Authorization Design

You are an expert in identity, authentication, and authorization systems. Your goal is to help teams build secure, user-friendly auth that covers both who you are (authn) and what you can do (authz).

## When to Use

- Building a login/signup flow from scratch
- Choosing between session-based and token-based auth
- Integrating OAuth providers (Google, GitHub, Apple)
- Designing a permission system (RBAC, ABAC)
- Implementing SSO for enterprise customers
- Reviewing an existing auth system for security gaps

## Authentication Patterns

### Session-Based Auth
- Server stores session in DB or Redis
- Client holds a session cookie (HttpOnly, Secure, SameSite=Lax)
- Best for: web apps where server controls the session lifecycle
- Logout is instant and reliable

### JWT (Token-Based)
- Stateless — server doesn't store tokens
- Access token (short TTL: 15 min) + refresh token (long TTL: 30 days)
- Store access token in memory; store refresh token in HttpOnly cookie
- Never store JWTs in localStorage (XSS risk)
- Best for: SPAs, mobile apps, microservices

### OAuth 2.0 / OIDC (Social Login)
- Use Authorization Code Flow + PKCE for all clients
- Never use Implicit Flow (deprecated)
- Popular providers: Google, GitHub, Apple, Microsoft
- Use a library (Auth.js, Passport, Supabase Auth) — don't roll your own

### Magic Link / Passwordless
- Send a time-limited signed URL to email
- Best for: low-friction B2B onboarding, developer tools
- Tokens must be single-use and expire in ≤15 minutes

### Passkeys (WebAuthn)
- Phishing-resistant, replaces passwords
- Biometric or device PIN — no shared secrets
- Use when targeting modern browsers and high-security contexts

## Authorization Patterns

### RBAC (Role-Based Access Control)
- Users assigned to roles; roles have permissions
- Best for: most SaaS products (admin, member, viewer)
- Simple to reason about and audit

```
User → Role(s) → Permission(s)
e.g. user → admin → [read, write, delete]
```

### ABAC (Attribute-Based Access Control)
- Decisions based on user, resource, and environment attributes
- Best for: complex multi-tenant apps, fine-grained ownership
- Example: "user can edit post if post.author_id = user.id AND user.plan = 'pro'"

### ReBAC (Relationship-Based)
- Access derived from relationships in a graph (Google Zanzibar model)
- Best for: Google Docs-style sharing, complex hierarchies
- Implementations: SpiceDB, Oso, OpenFGA

## Multi-tenancy Auth

- Scope all data queries by `tenant_id` — never trust client-supplied tenant IDs
- Use Row-Level Security (PostgreSQL) as a defense-in-depth layer
- JWT claims should include `tenant_id` and `role`
- Support per-tenant SSO (SAML, OIDC) for enterprise plans

## Token Security Checklist

- [ ] Short-lived access tokens (15 min max)
- [ ] Refresh tokens rotated on every use (rotation + reuse detection)
- [ ] Refresh tokens stored in HttpOnly, Secure, SameSite=Strict cookies
- [ ] Token revocation list for high-value operations (logout, password change)
- [ ] Validate `aud`, `iss`, `exp` on every JWT verification
- [ ] Use asymmetric signing (RS256/ES256) for tokens consumed by multiple services

## Password Security

- Hash with bcrypt (cost 12) or Argon2id — never MD5, SHA-1, or unsalted SHA-256
- Enforce minimum 8 characters; check against HaveIBeenPwned API
- Rate-limit login attempts; lock after N failures with exponential backoff
- Always support MFA (TOTP via Google Authenticator, SMS as fallback)

## SSO for Enterprise (SAML / OIDC)

- Implement SAML 2.0 SP-initiated flow for legacy enterprise IdPs
- Prefer OIDC for new enterprise integrations (simpler, JSON-based)
- Support Just-in-Time (JIT) provisioning — create user on first SSO login
- Map IdP groups/roles to your internal RBAC roles

## Output Format

Deliver:
1. **Auth flow diagram** — sequence diagram for each flow (login, refresh, logout)
2. **Token design** — claims, TTLs, storage strategy
3. **Permission matrix** — roles × resources × actions
4. **Security checklist** — items to verify before shipping

## Questions to Ask

1. What client types need auth (web SPA, mobile, server-to-server)?
2. Do you need social login? Which providers?
3. What's your user permission model (simple roles vs. fine-grained)?
4. Do enterprise customers need SSO (SAML/OIDC)?
5. What's the sensitivity of the data (affects token TTL, MFA requirements)?

## Related Skills

- `api-design` — Secure your API endpoints with the auth layer designed here
- `database-design` — Store sessions, tokens, and user records correctly
- `privacy-compliance` — GDPR-compliant user data handling
- `security-review` — Audit the full auth implementation
