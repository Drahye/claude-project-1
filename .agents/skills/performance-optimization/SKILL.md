---
name: performance-optimization
description: Diagnose and fix performance bottlenecks in web apps, APIs, and databases including load time, query optimization, caching, and Core Web Vitals. Use when pages are slow, APIs are timing out, or databases are under load.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: engineering
  type: technical
---

# Performance Optimization

You are a performance engineering expert. Your goal is to help teams find and fix the bottlenecks that make products feel slow — measuring first, fixing second, never guessing.

## When to Use

- Pages load slowly (LCP > 2.5s, poor Core Web Vitals)
- API endpoints are timing out or returning slowly
- Database queries are taking too long under load
- Scaling problems as traffic increases
- Preparing for a traffic spike or load test
- Reducing server costs by improving efficiency

## Golden Rule: Measure First

Never optimize without data. Tools:
- **Browser**: Chrome DevTools (Performance, Network, Lighthouse), WebPageTest
- **API**: Datadog APM, New Relic, distributed traces
- **Database**: `EXPLAIN ANALYZE` (PostgreSQL), slow query log (MySQL), Query Insights (GCP)
- **Load testing**: k6, Locust, Artillery

## Frontend Performance

### Core Web Vitals (Google's Metrics)

| Metric | What It Measures | Good | Poor |
|--------|-----------------|------|------|
| LCP (Largest Contentful Paint) | Loading | < 2.5s | > 4s |
| INP (Interaction to Next Paint) | Responsiveness | < 200ms | > 500ms |
| CLS (Cumulative Layout Shift) | Visual stability | < 0.1 | > 0.25 |

### Critical Rendering Path

1. **Eliminate render-blocking resources** — defer non-critical JS, preload fonts
2. **Optimize images** — use WebP/AVIF, correct dimensions, lazy load below fold
3. **Reduce bundle size** — code split, tree shake, lazy-load routes
4. **Use a CDN** — serve static assets from edge, not origin
5. **Cache aggressively** — immutable assets with content-hash filenames

### Image Optimization
```html
<!-- Correct: responsive, modern format, lazy below fold -->
<img
  src="hero.webp"
  srcset="hero-400.webp 400w, hero-800.webp 800w"
  sizes="(max-width: 600px) 400px, 800px"
  alt="Hero image"
  fetchpriority="high"  <!-- for LCP image -->
/>

<!-- Below fold -->
<img src="card.webp" alt="Card" loading="lazy" />
```

### JavaScript Bundle Optimization
```javascript
// Route-based code splitting (Next.js / React Router)
const Dashboard = React.lazy(() => import('./Dashboard'));
const Settings = React.lazy(() => import('./Settings'));

// Only import what you use
import { debounce } from 'lodash-es';  // not: import _ from 'lodash'
```

### Font Loading
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
```

## API Performance

### Common Bottlenecks

1. **N+1 queries** — fetching parent, then querying child for each (use JOINs or DataLoader)
2. **Missing indexes** — table scans on large tables
3. **No pagination** — returning all records
4. **Synchronous I/O** — blocking on DB/external API without parallelism
5. **No caching** — re-computing expensive results every request

### Parallel I/O
```javascript
// Bad — sequential (200ms + 300ms = 500ms)
const user = await db.users.findOne(id);
const orders = await db.orders.find({ userId: id });

// Good — parallel (max(200ms, 300ms) = 300ms)
const [user, orders] = await Promise.all([
  db.users.findOne(id),
  db.orders.find({ userId: id }),
]);
```

### Response Optimization
- Compress with gzip/brotli
- Return only fields the client needs (sparse fieldsets)
- Use HTTP/2 or HTTP/3
- Stream large responses instead of buffering

## Database Performance

### Query Analysis (PostgreSQL)
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.*, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id;
```

Look for: Seq Scan on large tables, high cost nodes, nested loops with many rows.

### Index Strategy
```sql
-- Missing index on WHERE clause
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);

-- Composite index for common query pattern
CREATE INDEX CONCURRENTLY idx_orders_user_status
ON orders(user_id, status)
WHERE deleted_at IS NULL;  -- partial index

-- Index for LIKE prefix search
CREATE INDEX CONCURRENTLY idx_users_email_prefix ON users(email text_pattern_ops);
```

### Common Fixes
- Add indexes on FK columns and commonly filtered/sorted columns
- Replace ORM-generated N+1 with JOINs or batched queries
- Use `SELECT` only needed columns (never `SELECT *` in production)
- Paginate large result sets (cursor-based for consistency)
- Use connection pooling (PgBouncer for PostgreSQL)
- Archive old data to keep working tables small

## Caching Strategy

See `caching-queues` skill for full detail. Performance-specific:
- Cache expensive DB query results (5-60 min TTL)
- Cache external API responses (rate limit avoidance)
- Use HTTP cache headers (`Cache-Control`, `ETag`) for API responses
- CDN caching for public pages and assets

## Load Testing

Run before every major traffic event:
```javascript
// k6 load test
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,           // virtual users
  duration: '5m',
  thresholds: {
    http_req_duration: ['p95<500'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],  // <1% errors
  },
};

export default function () {
  const res = http.get('https://api.yourapp.com/health');
  check(res, { 'status 200': (r) => r.status === 200 });
}
```

## Output Format

Deliver:
1. **Bottleneck diagnosis** — what's slow and proof (measurements)
2. **Root cause analysis** — why it's slow
3. **Fix plan** — ordered by impact/effort (quick wins first)
4. **Implementation** — code changes for each fix
5. **Verification plan** — how to confirm the fix worked

## Questions to Ask

1. Where is the slowness: frontend, API, or database?
2. What do current performance metrics show (LCP, p99 latency, query time)?
3. At what scale does it break (N users, M RPS)?
4. What profiling data do you have already?
5. Is this a regression or has it always been slow?

## Related Skills

- `database-design` — Prevent performance issues at design time
- `caching-queues` — Add caching to reduce load on databases and APIs
- `monitoring-observability` — Measure performance continuously
- `cloud-infrastructure` — Right-size infrastructure for the load
