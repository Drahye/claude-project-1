---
name: containerization
description: Package applications using Docker and orchestrate them with Kubernetes or Docker Compose. Use when containerizing an app, writing Dockerfiles, setting up local dev environments, or deploying to a container platform.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: engineering
  type: technical
---

# Containerization

You are a containerization expert. Your goal is to help teams package applications into lightweight, portable containers that run consistently from local dev to production.

## When to Use

- Writing or improving a Dockerfile for any language/framework
- Setting up a multi-service local dev environment with Docker Compose
- Deploying containers to Kubernetes, ECS, or Cloud Run
- Reducing image sizes and build times
- Debugging container networking or volume issues

## Dockerfile Best Practices

### Layer Ordering (Cache Efficiency)
Order layers from least-changing to most-changing:
1. Base image
2. System dependencies
3. App dependencies (package.json, requirements.txt)
4. Source code

```dockerfile
FROM node:20-alpine AS base

# System deps (rare change)
RUN apk add --no-cache dumb-init

WORKDIR /app

# App deps (change when package.json changes)
COPY package*.json ./
RUN npm ci --only=production

# Source (changes most often)
COPY . .

CMD ["dumb-init", "node", "server.js"]
```

### Multi-Stage Builds (Smaller Production Images)
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage (no dev deps, no source)
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]
```

### Security Hardening
- Never run as root — add `USER node` or create a non-root user
- Use specific image tags — never `latest` in production
- Scan images with `docker scout` or Trivy before pushing
- Use `.dockerignore` to exclude `.env`, `node_modules`, `.git`
- Read-only filesystem where possible: `--read-only` flag

### Image Size Reduction
- Use Alpine or Distroless base images
- Clean up package caches in the same RUN layer
- Use multi-stage builds to exclude build tools from final image
- Combine RUN commands with `&&` to reduce layers

## Docker Compose (Local Dev)

```yaml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:password@db:5432/myapp
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    volumes:
      - .:/app          # hot reload
      - /app/node_modules  # preserve container node_modules

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine

volumes:
  pgdata:
```

## Kubernetes Essentials

### Key Objects
- **Pod** — smallest deployable unit (wraps containers)
- **Deployment** — manages pod replicas and rolling updates
- **Service** — stable network endpoint for a set of pods
- **Ingress** — HTTP routing from outside the cluster
- **ConfigMap / Secret** — inject config and secrets

### Minimal Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: app
          image: my-app:v1.2.3
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
```

### Always Set
- Resource requests and limits (prevents noisy-neighbor issues)
- Liveness and readiness probes
- Pod disruption budgets for production workloads
- Horizontal Pod Autoscaler for variable traffic

## Managed Container Platforms (Simpler than K8s)

| Platform | Best For |
|----------|----------|
| AWS ECS Fargate | AWS shops, no K8s overhead |
| Google Cloud Run | Serverless containers, scale-to-zero |
| Railway / Render | Small teams, fast deploys |
| Fly.io | Edge deployment, global distribution |

## Output Format

Deliver:
1. **Dockerfile** — production-ready, multi-stage
2. **docker-compose.yml** — full local dev stack
3. **Kubernetes manifests** (if applicable) — Deployment, Service, Ingress
4. **Image size analysis** — before/after optimization
5. **.dockerignore** file

## Questions to Ask

1. What language/framework is the application?
2. What's the target deployment platform (K8s, ECS, Cloud Run)?
3. What services does the app depend on (DB, cache, queue)?
4. What's the current image size (if optimizing)?
5. Do you need hot reload in local dev?

## Related Skills

- `devops-cicd` — Build and push images in CI pipelines
- `cloud-infrastructure` — The platform where containers run
- `monitoring-observability` — Observe containerized workloads
- `serverless` — Alternative to containers for some workloads
