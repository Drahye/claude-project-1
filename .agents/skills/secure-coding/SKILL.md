---
name: secure-coding
description: Apply secure coding practices to prevent OWASP Top 10 vulnerabilities including injection, XSS, CSRF, broken access control, and insecure deserialization. Use when writing backend code, reviewing PRs for security, or hardening an existing codebase.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: security
  type: technical
---

# Secure Coding

You are a security engineer. Your goal is to help developers write code that is secure by default — preventing the most common and impactful vulnerabilities before they ship.

## When to Use

- Writing backend API code handling user input
- Reviewing a PR for security issues
- Hardening an existing codebase before a security audit
- After a vulnerability disclosure or pen test finding
- Building features that handle auth, file uploads, payments, or PII

## OWASP Top 10 — Quick Reference

| # | Vulnerability | One-Line Prevention |
|---|--------------|-------------------|
| A01 | Broken Access Control | Check authorization on every request, deny by default |
| A02 | Cryptographic Failures | Encrypt PII at rest, TLS everywhere, no weak algorithms |
| A03 | Injection | Parameterized queries, never concatenate user input into SQL/commands |
| A04 | Insecure Design | Threat model before you build |
| A05 | Security Misconfiguration | Disable defaults, remove unused features, harden headers |
| A06 | Vulnerable Components | Keep dependencies updated, use Snyk/Dependabot |
| A07 | Auth Failures | See `auth-design` skill |
| A08 | Data Integrity Failures | Verify signatures on webhooks, use lockfiles |
| A09 | Logging Failures | Log all security events, never log secrets/PII |
| A10 | SSRF | Validate/whitelist URLs, block internal ranges |

---

## A03: Injection

### SQL Injection
```javascript
// VULNERABLE — never do this
const user = await db.query(`SELECT * FROM users WHERE email = '${email}'`);

// SAFE — always parameterize
const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);

// ORM (also safe when used correctly)
const user = await User.findOne({ where: { email } }); // Sequelize
const user = await db.user.findFirst({ where: { email } }); // Prisma
```

### Command Injection
```javascript
// VULNERABLE
exec(`convert ${filename} output.png`);

// SAFE — use arrays, never shell strings with user input
execFile('convert', [filename, 'output.png']);

// Better — use native libraries instead of shell commands
import sharp from 'sharp';
await sharp(filename).toFile('output.png');
```

### NoSQL Injection (MongoDB)
```javascript
// VULNERABLE — user can pass { $gt: '' } as password
User.findOne({ email, password: req.body.password });

// SAFE — always cast/validate input types
const password = String(req.body.password);
User.findOne({ email, password });
```

---

## A01: Broken Access Control

### Always Check Authorization Server-Side
```javascript
// VULNERABLE — trusting client-supplied ID
app.get('/api/documents/:id', async (req, res) => {
  const doc = await Document.findById(req.params.id); // anyone can get any doc!
  res.json(doc);
});

// SAFE — ownership check
app.get('/api/documents/:id', authenticate, async (req, res) => {
  const doc = await Document.findOne({
    _id: req.params.id,
    ownerId: req.user.id,   // enforce ownership
  });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  res.json(doc);
});
```

### Deny by Default
```javascript
// Middleware: deny unless explicitly allowed
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user?.roles?.includes(role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

app.delete('/api/users/:id', authenticate, requireRole('admin'), deleteUser);
```

---

## A07: XSS (Cross-Site Scripting)

### Reflected / Stored XSS
```javascript
// VULNERABLE — rendering user content as raw HTML
res.send(`<p>Welcome, ${username}!</p>`);

// SAFE — escape output
import he from 'he';
res.send(`<p>Welcome, ${he.encode(username)}!</p>`);

// React (safe by default — JSX escapes automatically)
return <p>Welcome, {username}!</p>; // safe

// React (dangerous — only for sanitized HTML)
import DOMPurify from 'dompurify';
return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
```

### Content Security Policy (CSP)
```javascript
// Express — set strict CSP header
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  );
  next();
});
```

---

## A08: CSRF (Cross-Site Request Forgery)

```javascript
// For session-based apps — use CSRF tokens
import csrf from 'csurf';
app.use(csrf({ cookie: { sameSite: 'strict', httpOnly: true } }));

// For SPA + JWT — use SameSite cookies (already prevents CSRF)
res.cookie('token', jwt, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',  // blocks cross-site requests
});
```

---

## A10: SSRF (Server-Side Request Forgery)

```javascript
// VULNERABLE — fetching a user-supplied URL without validation
app.post('/preview', async (req, res) => {
  const html = await fetch(req.body.url).then(r => r.text()); // attacker can hit internal services!
});

// SAFE — validate URL against allowlist
import { URL } from 'url';
const ALLOWED_HOSTS = ['example.com', 'api.example.com'];

function isSafeUrl(urlString) {
  try {
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (!ALLOWED_HOSTS.includes(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}
```

---

## Secure HTTP Headers

```javascript
// Use Helmet.js in Express
import helmet from 'helmet';
app.use(helmet());

// Key headers Helmet sets:
// Strict-Transport-Security: max-age=31536000
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// Referrer-Policy: no-referrer
// Permissions-Policy: camera=(), microphone=()
```

---

## File Upload Security

```javascript
// Validate file type — check magic bytes, not just extension
import fileType from 'file-type';

app.post('/upload', upload.single('file'), async (req, res) => {
  const type = await fileType.fromBuffer(req.file.buffer);

  // Reject if not in allowlist
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!type || !ALLOWED.includes(type.mime)) {
    return res.status(400).json({ error: 'File type not allowed' });
  }

  // Never serve uploaded files with original name — generate UUID filename
  const filename = `${randomUUID()}.${type.ext}`;

  // Store in S3, not in the webroot
  await s3.upload({ Bucket: 'uploads', Key: filename, Body: req.file.buffer }).promise();
});
```

---

## Dependency Security

- Enable **Dependabot** or **Renovate** for automated PR on vulnerable packages
- Run `npm audit` / `pip-audit` in CI — fail on high/critical
- Pin exact versions in production lockfiles
- Regularly run `npm outdated` and update

---

## Secure Code Review Checklist

- [ ] All SQL queries use parameterized statements
- [ ] All user input is validated before use
- [ ] Authorization checked on every endpoint (not just authentication)
- [ ] No secrets or PII in logs
- [ ] File uploads validate type and size
- [ ] External URLs validated if fetched server-side
- [ ] Secure HTTP headers set
- [ ] CSRF protection on state-changing endpoints
- [ ] Dependencies have no high/critical CVEs

---

## Output Format

Deliver:
1. **Vulnerability analysis** — what's vulnerable and why
2. **Fixed code** — complete corrected snippet
3. **Explanation** — why the fix prevents the attack
4. **Additional checks** — related issues to look for nearby

## Related Skills

- `threat-modeling` — Find security problems at design time
- `auth-design` — Secure authentication and authorization
- `application-security` — Automated scanning to catch what code review misses
- `network-security` — Infrastructure-level defenses (WAF, rate limiting)
