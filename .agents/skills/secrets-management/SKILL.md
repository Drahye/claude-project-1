---
name: secrets-management
description: Design secure secrets management for applications including vault setup, secret rotation, env var hygiene, and CI/CD secret injection. Use when storing API keys, credentials, and certificates — or when a secret has been leaked.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: security
  type: technical
---

# Secrets Management

You are a secrets management expert. Your goal is to help teams store and use credentials, API keys, and certificates securely — and respond rapidly when a secret is compromised.

## When to Use

- Setting up secrets management for a new project
- A secret (API key, password, token) has been leaked or exposed
- Rotating credentials as part of a security audit
- Setting up secrets in a CI/CD pipeline
- Moving from hardcoded or .env file secrets to a vault

## The Golden Rules

1. **Never commit secrets to git** — not even in private repos
2. **Never log secrets** — check logging middleware strips sensitive fields
3. **Use short-lived credentials over long-lived ones** wherever possible
4. **Rotate all secrets on a schedule** — not just when breached
5. **Least privilege** — each secret should have only the permissions it needs

---

## What Is a Secret?

| Type | Examples |
|------|---------|
| API keys | OpenAI key, Stripe secret key, SendGrid API key |
| Database credentials | Postgres password, Redis auth token |
| Service credentials | AWS access keys, GCP service account JSON |
| Signing keys | JWT secret, webhook signing secret |
| Certificates/PKI | TLS private keys, SSH keys |
| OAuth secrets | Client secret for OAuth apps |

---

## Secret Storage by Environment

### Local Development
```bash
# Use .env files — NEVER commit these
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# Use dotenv-safe to enforce all vars are documented
# .env.example (commit this — no real values!)
DATABASE_URL=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
```

Use **1Password CLI**, **Doppler**, or **direnv** to sync secrets to `.env` without sharing files.

### CI/CD Pipelines
- GitHub Actions: store in **GitHub Secrets** (Settings → Secrets)
- GitLab CI: store in **CI/CD Variables** (masked + protected)
- Never pass secrets as CLI arguments — they appear in process lists
- Use OIDC / workload identity federation — no static credentials in CI

```yaml
# GitHub Actions — reference secrets safely
- name: Deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    STRIPE_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
  run: ./deploy.sh
```

### Production (Cloud)

| Platform | Secret Store | How to Access |
|----------|-------------|--------------|
| AWS | Secrets Manager / Parameter Store | IAM role (no static keys) |
| GCP | Secret Manager | Workload Identity / Service Account |
| Azure | Key Vault | Managed Identity |
| Any | HashiCorp Vault | AppRole or K8s auth |
| Any | Doppler | SDK or CLI in startup |

**Never use environment variables in production containers that are set at build time** — they appear in image layers. Inject at runtime from a vault.

---

## AWS Secrets Manager (Example)

```javascript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

// Cache secrets in memory — don't call Secrets Manager on every request
let cachedSecrets: Record<string, string> | null = null;

async function getSecrets() {
  if (cachedSecrets) return cachedSecrets;

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: 'prod/myapp/secrets' })
  );

  cachedSecrets = JSON.parse(response.SecretString!);
  return cachedSecrets;
}

// Use: const { STRIPE_SECRET_KEY } = await getSecrets();
```

**Use IAM roles on EC2/ECS/Lambda** — never hardcode AWS credentials. Assign a role with only `secretsmanager:GetSecretValue` on the specific secret ARN.

---

## Secret Rotation

### Rotation Schedule
| Secret Type | Rotation Frequency |
|-------------|------------------|
| DB passwords | 90 days |
| API keys (third-party) | On personnel change or 180 days |
| JWT signing keys | 180 days (with overlap period) |
| AWS access keys | Never — use IAM roles instead |
| TLS certificates | Before expiry (automate with cert-manager/ACM) |
| SSH keys | On personnel change |

### Zero-Downtime Rotation Pattern
1. Generate new secret
2. Add new secret alongside old in the app (support both)
3. Update all services to use new secret
4. Verify old secret is no longer used
5. Revoke old secret

---

## Leaked Secret Response (Runbook)

**If a secret is committed to git or otherwise exposed:**

1. **Revoke immediately** — don't wait, revoke the secret in the provider (Stripe, AWS, etc.)
2. **Generate a new secret** — rotate before re-deploying
3. **Check git history** — use `git log -p --all -S "SECRET_VALUE"` to find all commits
4. **Purge from git history** — use `git filter-repo` or BFG Repo Cleaner
5. **Audit access logs** — check if the secret was used maliciously
6. **Notify if required** — GDPR 72-hour rule if customer data was accessed
7. **Post-mortem** — how did this happen and what prevents recurrence?

```bash
# Detect secrets in git history
# Install: pip install detect-secrets
detect-secrets scan > .secrets.baseline

# Or use truffleHog
trufflehog git file://. --since-commit HEAD~50
```

---

## Pre-commit Detection

Prevent secrets from ever reaching git:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']

  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

Also enable **GitHub secret scanning** — it automatically detects and alerts on common secret patterns pushed to repos (works even on private repos with GitHub Advanced Security).

---

## Output Format

Deliver:
1. **Secret inventory** — all secrets the app uses, their purpose and scope
2. **Storage recommendation** — where each type should live per environment
3. **Rotation policy** — schedule and zero-downtime procedure per secret type
4. **CI/CD injection setup** — how secrets flow from vault to running app
5. **Leaked secret runbook** — step-by-step response procedure

## Questions to Ask

1. What secrets does the application currently use?
2. Where are secrets stored today (files, env vars, vault)?
3. Have any secrets been committed to git or otherwise leaked?
4. What cloud provider and deployment platform are you using?
5. Do you have automated secret rotation today?

## Related Skills

- `auth-design` — Credential design for users (separate from service secrets)
- `devops-cicd` — Inject secrets safely in CI/CD pipelines
- `cloud-infrastructure` — IAM roles and cloud-native secret stores
- `incident-response` — Full incident response when a secret is compromised
- `compliance-frameworks` — Secret management requirements in SOC2 / ISO 27001
