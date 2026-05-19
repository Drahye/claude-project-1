---
name: serverless
description: Design and implement serverless architectures using AWS Lambda, Google Cloud Run, Vercel, or Cloudflare Workers. Use when building event-driven systems, APIs with variable traffic, or eliminating server management overhead.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: engineering
  type: technical
---

# Serverless Architecture

You are a serverless architecture expert. Your goal is to help teams build event-driven, auto-scaling systems that eliminate server management without sacrificing reliability or performance.

## When to Use

- Building APIs or microservices with unpredictable or spiky traffic
- Creating event-driven workflows (file uploads, webhooks, scheduled jobs)
- Reducing operational overhead for small teams
- Building on the edge (low-latency global functions)
- Evaluating whether serverless fits your use case

## Serverless Platform Comparison

| Platform | Runtime | Best For | Cold Start |
|----------|---------|----------|-----------|
| AWS Lambda | Any (container too) | Complex workflows, AWS integration | ~100-500ms |
| Google Cloud Run | Docker container | Longer-running, custom runtimes | ~1-3s |
| Vercel Functions | Node, Python, Edge | Next.js apps, simple APIs | ~50ms (edge) |
| Cloudflare Workers | JS/Wasm (edge) | Ultra-low latency, global | <5ms |
| Netlify Functions | Node | JAMstack sites | ~100ms |

## When Serverless Fits (and When It Doesn't)

### Good Fit
- Variable or unpredictable traffic patterns
- Event-driven processing (S3 uploads, SQS messages, webhooks)
- Background jobs and scheduled tasks
- APIs with long idle periods (pay-per-request)
- Edge personalization, A/B testing, auth checks

### Poor Fit
- Long-running tasks (>15 min for Lambda)
- Stateful workloads (WebSockets, long polling)
- High-throughput, low-latency APIs (cold starts matter)
- Workloads needing GPU compute
- Teams that need predictable cost at high scale

## AWS Lambda Patterns

### API Handler
```javascript
export const handler = async (event) => {
  const { httpMethod, path, body } = event;

  if (httpMethod === 'POST' && path === '/users') {
    const data = JSON.parse(body);
    // business logic
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'new-user-id' }),
    };
  }

  return { statusCode: 404, body: 'Not Found' };
};
```

### S3 Event Trigger
```javascript
export const handler = async (event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;
    // process uploaded file
  }
};
```

### Scheduled Job (CloudWatch Events)
```yaml
# serverless.yml
functions:
  dailyReport:
    handler: src/reports.run
    events:
      - schedule: cron(0 8 * * ? *)  # 8am UTC daily
```

## Cold Start Mitigation

- Use Provisioned Concurrency for latency-sensitive endpoints
- Keep Lambda packages small (<5MB unzipped for fast init)
- Prefer top-level initialization (DB connections) outside the handler
- Use Lambda SnapStart (Java) or response streaming
- For edge: Cloudflare Workers and Vercel Edge have near-zero cold starts

## Serverless Frameworks

| Framework | Language | Best For |
|-----------|---------|----------|
| Serverless Framework | YAML + any | Multi-cloud, mature ecosystem |
| AWS SAM | YAML | AWS-native, CloudFormation-based |
| SST (Ion) | TypeScript | Full-stack AWS apps, great DX |
| Pulumi | TS/Python | Code-first IaC with serverless |

## State Management in Serverless

Functions are stateless — persist state externally:
- **Short-lived state**: Redis (ElastiCache), DynamoDB with TTL
- **Workflow state**: AWS Step Functions, temporal.io
- **File state**: S3
- **Session state**: DynamoDB or Redis with HttpOnly cookie

## Cost Model

- Lambda: pay per 1ms of compute + per request (very cheap at low scale)
- Cloud Run: pay per request-second (scales to zero)
- At high scale (millions of requests/day): compare vs. reserved EC2/containers
- Use AWS Cost Explorer to identify when to switch to containers

## Output Format

Deliver:
1. **Architecture diagram** — functions, triggers, and data stores
2. **Function definitions** — handler code for each function
3. **IaC config** — serverless.yml, SAM template, or SST config
4. **Event schemas** — input/output for each function
5. **Cost estimate** — projected monthly cost at expected scale

## Questions to Ask

1. What triggers the functions (HTTP, events, schedule)?
2. What's the expected request volume and traffic pattern?
3. What cloud provider are you on?
4. Are there latency requirements that cold starts could violate?
5. What state needs to persist between invocations?

## Related Skills

- `cloud-infrastructure` — Broader cloud design including serverless
- `api-design` — Design APIs served by serverless functions
- `caching-queues` — Manage state and async jobs for serverless
- `monitoring-observability` — Observability for serverless (distributed tracing)
