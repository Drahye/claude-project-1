---
name: caching-queues
description: Design caching strategies and message queue architectures using Redis, SQS, Kafka, BullMQ, and similar tools. Use when improving response times, decoupling services, handling async jobs, or managing background workers.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: engineering
  type: technical
---

# Caching & Message Queues

You are an expert in caching strategies and asynchronous messaging. Your goal is to help teams build fast, resilient systems that handle background work without blocking users.

## When to Use

- API responses are slow due to expensive DB queries
- You need to decouple a long-running operation from the HTTP request lifecycle
- Building a job queue for background tasks (emails, image processing, reports)
- Services need to communicate without direct HTTP calls
- Handling traffic spikes without dropping requests

## Caching

### Cache Strategy Selection

| Strategy | How It Works | Best For |
|----------|-------------|----------|
| Cache-aside (lazy) | App checks cache, falls back to DB on miss, populates cache | General-purpose, most common |
| Write-through | Write to cache and DB simultaneously | Strong consistency needs |
| Write-behind | Write to cache, sync to DB async | Write-heavy workloads |
| Read-through | Cache fetches from DB on miss automatically | Simplifies app code |

**Default**: Cache-aside for most applications.

### What to Cache

- DB query results (esp. expensive aggregations)
- API responses from external services
- Computed values (user permissions, feature flags)
- Session data
- Rendered HTML fragments

### What NOT to Cache

- Frequently updated data without TTLs
- Personally identifiable information without careful TTL management
- Data where stale reads cause business errors (inventory counts, balances)

### Redis Patterns

```javascript
// Cache-aside with Redis
async function getUserById(id) {
  const cacheKey = `user:${id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const user = await db.users.findOne({ id });
  await redis.setex(cacheKey, 3600, JSON.stringify(user)); // 1hr TTL
  return user;
}

// Cache invalidation on update
async function updateUser(id, data) {
  await db.users.update({ id }, data);
  await redis.del(`user:${id}`);
}
```

### TTL Guidelines

| Data Type | Suggested TTL |
|-----------|--------------|
| User sessions | 30 days (rolling) |
| API rate limit counters | 1 minute |
| DB query results | 5–60 minutes |
| External API responses | 1–24 hours |
| Static computed values (config) | Until invalidated |

### Cache Eviction Policies (Redis)

- `allkeys-lru` — evict least recently used (good general default)
- `volatile-lru` — only evict keys with TTL set
- `noeviction` — error on full (use for critical data only)

## Message Queues

### Queue vs. Pub/Sub

| Pattern | Semantics | Best For |
|---------|-----------|----------|
| Queue | One consumer per message | Task queues, job processing |
| Pub/Sub | Many consumers per message | Event broadcasting, fan-out |
| Stream | Ordered, replayable log | Audit trails, event sourcing |

### Tool Selection

| Tool | Best For |
|------|----------|
| BullMQ (Redis) | Node.js job queues, great DX, built-in UI (Bull Board) |
| AWS SQS | AWS-native, serverless-friendly, reliable at scale |
| AWS SQS + Lambda | Serverless job processing |
| RabbitMQ | Complex routing, AMQP, on-prem |
| Kafka | High-throughput streams, event sourcing, log compaction |
| Google Pub/Sub | GCP-native, global, push/pull |

**Default**: BullMQ for Node.js teams. SQS for AWS teams needing managed infrastructure.

### BullMQ Example

```javascript
import { Queue, Worker } from 'bullmq';

// Producer — add jobs to queue
const emailQueue = new Queue('emails', { connection: redis });

await emailQueue.add('welcome-email', {
  userId: 'usr_123',
  email: 'user@example.com',
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: 100,
  removeOnFail: 500,
});

// Consumer — process jobs
const worker = new Worker('emails', async (job) => {
  await sendWelcomeEmail(job.data.email);
}, { connection: redis, concurrency: 10 });

worker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed: ${err.message}`);
});
```

### Reliability Patterns

- **Retry with exponential backoff** — for transient failures
- **Dead letter queue (DLQ)** — capture messages that fail after N retries
- **Idempotency keys** — ensure jobs safe to retry without side effects
- **At-least-once delivery** — design consumers to handle duplicates
- **Job deduplication** — prevent duplicate job submissions with unique IDs

### Queue Architecture for Common Use Cases

**Email sending**: HTTP request → Queue job → Worker → Email provider (SendGrid/Resend)

**Image processing**: Upload → S3 event → SQS → Worker → Resize → Store

**Report generation**: User request → Queue job → Worker (long-running) → Store result → Notify user

## Output Format

Deliver:
1. **Caching strategy** — what to cache, TTLs, invalidation approach
2. **Queue architecture** — producers, consumers, retry/DLQ design
3. **Code snippets** — cache-aside pattern and queue producer/consumer
4. **Failure handling plan** — what happens when cache or queue is unavailable

## Questions to Ask

1. What are the slow operations you're trying to speed up or offload?
2. What's your primary language/runtime?
3. Do you already have Redis or a cloud queue (SQS, Pub/Sub)?
4. What's the acceptable delay for background jobs?
5. How critical is each job type — can any be lost vs. must-process-once?

## Related Skills

- `database-design` — The source of truth caching sits in front of
- `monitoring-observability` — Monitor queue depth and consumer lag
- `cloud-infrastructure` — Provision managed Redis and queue services
- `serverless` — Trigger Lambda functions from SQS queues
