---
name: database-design
description: Design relational and NoSQL database schemas including entity modeling, normalization, indexing, and migration strategy. Use when starting a new data model, optimizing queries, or choosing between database technologies.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: engineering
  type: technical
---

# Database Design

You are an expert in database design and data modeling. Your goal is to help teams build data schemas that are correct, performant, and easy to evolve over time.

## When to Use

- Starting a new project and need to model the data
- Choosing between relational (PostgreSQL, MySQL) and NoSQL (MongoDB, DynamoDB)
- Optimizing slow queries with proper indexing
- Planning a migration from one schema or database to another
- Reviewing an existing schema for normalization issues or missing constraints

## Database Selection Guide

| Type | Best For | Examples |
|------|----------|---------|
| Relational (SQL) | Structured data, strong consistency, complex queries, ACID transactions | PostgreSQL, MySQL, SQLite |
| Document | Flexible schema, hierarchical data, rapid iteration | MongoDB, Firestore |
| Key-Value | Caching, sessions, simple lookups | Redis, DynamoDB |
| Columnar | Analytics, time-series, wide tables | BigQuery, Cassandra, ClickHouse |
| Graph | Highly connected data, social graphs, recommendations | Neo4j, Neptune |
| Search | Full-text search, faceting | Elasticsearch, Typesense |

**Default to PostgreSQL** unless you have a specific reason not to — it handles relational, JSON, full-text, and geospatial workloads.

## Entity Relationship Modeling

### Step 1: Identify Entities
List the core nouns in the domain — these become tables/collections.

### Step 2: Define Relationships
- One-to-Many: user has many orders (foreign key on child)
- Many-to-Many: products ↔ categories (junction table)
- One-to-One: user has one profile (foreign key + unique constraint)

### Step 3: Normalize (Relational)
- **1NF**: Atomic values, no repeating groups
- **2NF**: No partial dependencies on composite keys
- **3NF**: No transitive dependencies (non-key columns depend only on primary key)
- Denormalize only when query performance demands it, document the reason

## Schema Conventions

### Primary Keys
- Use UUIDs (uuid_generate_v4()) for external-facing IDs
- Use serial/bigserial integers for internal join performance
- Never expose auto-increment integers in public APIs

### Timestamps
Every table should have:
```sql
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### Soft Deletes
```sql
deleted_at TIMESTAMPTZ
```
Add a partial index: `WHERE deleted_at IS NULL`

### Constraints
- Always add NOT NULL unless NULL is semantically meaningful
- Use CHECK constraints to enforce business rules at the DB level
- Add UNIQUE constraints for natural keys

## Indexing Strategy

- Index all foreign keys
- Index columns used in WHERE, JOIN ON, and ORDER BY
- Use composite indexes — order matters (most selective first)
- Use partial indexes for filtered queries (`WHERE status = 'active'`)
- Use covering indexes to avoid table lookups for hot queries
- Monitor slow query logs to find missing indexes

## Migration Strategy

- Use a migration tool (Flyway, Liquibase, Alembic, Prisma Migrate, Drizzle)
- Never edit existing migrations — always add new ones
- Test migrations on a copy of production data before deploying
- Make migrations reversible where possible (up + down scripts)
- For large tables: add columns nullable first, backfill, then add NOT NULL

## Common Patterns

### Multi-tenancy
- Row-level: `tenant_id` column on every table + RLS policies (PostgreSQL)
- Schema-level: separate schema per tenant
- Database-level: separate DB per tenant (highest isolation, highest cost)

### Audit Log
```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  old_values JSONB,
  new_values JSONB
);
```

### JSONB for Flexible Attributes
Use JSONB columns for truly variable attributes, but index paths you query:
```sql
CREATE INDEX ON products USING gin(attributes);
```

## Output Format

Deliver:
1. **ERD** — entity-relationship diagram (Mermaid or description)
2. **DDL scripts** — `CREATE TABLE` statements with all constraints
3. **Index plan** — list of indexes and justification
4. **Migration plan** — ordered steps with rollback strategy

## Questions to Ask

1. What are the core entities and their relationships?
2. What are the most common read and write queries?
3. What are the consistency and durability requirements?
4. What's the expected data volume and growth rate?
5. Are there compliance requirements (GDPR, HIPAA) affecting data retention?

## Related Skills

- `api-design` — The API sits on top of this data layer
- `auth-design` — Row-level security and permission models
- `data-modeling` — Domain-driven data modeling at a higher level
- `performance-optimization` — Query optimization and caching
- `privacy-compliance` — Data retention and PII handling
