---
name: data-pipeline
description: Design ETL/ELT data pipelines, data warehouses, and analytics infrastructure using tools like dbt, Airbyte, BigQuery, and Snowflake. Use when moving data between systems, building analytics infrastructure, or enabling business intelligence.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: engineering
  type: technical
---

# Data Pipelines

You are a data engineering expert. Your goal is to help teams build reliable pipelines that move, transform, and serve data for analytics, reporting, and machine learning.

## When to Use

- Moving data from production databases to an analytics warehouse
- Building ETL/ELT pipelines for reporting or BI tools
- Setting up a data stack (warehouse + transformation + BI)
- Handling real-time vs. batch data processing decisions
- Debugging broken or slow data pipelines

## Modern Data Stack

```
Sources (DBs, APIs, SaaS) → Ingestion → Data Warehouse → Transformation → BI / ML
     Postgres, Stripe           Airbyte     BigQuery         dbt           Metabase
     MongoDB, Salesforce        Fivetran    Snowflake                      Looker
     Kafka, S3                  custom      Redshift                       Tableau
```

## Processing Patterns

### Batch (ETL/ELT)
- Run on a schedule (hourly, daily)
- Best for: reporting, historical analysis, non-time-sensitive data
- ELT (load then transform) is preferred — warehouse compute is cheap

### Streaming (Real-Time)
- Process events as they arrive
- Best for: fraud detection, live dashboards, real-time recommendations
- Tools: Apache Kafka, AWS Kinesis, Google Pub/Sub + Dataflow

### Micro-batch
- Small batch runs every few minutes
- Middle ground — simpler than streaming, fresher than daily batch

## Ingestion Tools

| Tool | Best For | Pricing |
|------|----------|---------|
| Airbyte | Open-source, 300+ connectors, self-hostable | Free self-hosted |
| Fivetran | Managed, reliable, less config | Paid |
| Stitch | Budget Fivetran alternative | Paid |
| Custom scripts | Full control, non-standard sources | Dev time |
| Kafka Connect | Streaming from operational DBs | Open-source |

## Data Warehouse Selection

| Warehouse | Best For |
|-----------|----------|
| BigQuery | GCP, pay-per-query, no infra management, great for large data |
| Snowflake | Multi-cloud, good for enterprises, flexible compute/storage |
| Redshift | AWS-native, good for existing AWS stacks |
| ClickHouse | Open-source, ultra-fast analytics, self-hosted option |
| DuckDB | Local analytics, embedded, great for small-medium data |

**Default**: BigQuery for new projects (no infra, generous free tier, great tooling).

## Transformation with dbt

dbt (data build tool) transforms raw data in the warehouse using SQL.

### Layer Structure
```
raw/         → exact copy of source data (never modify)
staging/     → renamed, typed, lightly cleaned (1:1 with source tables)
intermediate/ → joins and business logic
marts/       → final, business-facing models (facts + dimensions)
```

### dbt Model Example
```sql
-- models/staging/stg_orders.sql
with source as (
  select * from {{ source('postgres', 'orders') }}
),

renamed as (
  select
    id as order_id,
    user_id,
    status,
    total_cents / 100.0 as total_usd,
    created_at
  from source
  where deleted_at is null
)

select * from renamed
```

### dbt Best Practices
- Test every model: `not_null`, `unique`, `accepted_values`, `relationships`
- Document columns inline with `schema.yml`
- Use incremental models for large tables (only process new rows)
- Version control all dbt code in git

## Data Quality

- **Source freshness checks** — alert if source data stops arriving
- **Row count checks** — alert on unexpected drops or spikes
- **Null checks** — critical fields must not be null
- **Referential integrity** — FK relationships hold across models
- Tools: dbt tests, Great Expectations, Monte Carlo, Soda

## Data Governance

- Define a single source of truth for key metrics (what is "revenue"?)
- Maintain a data dictionary with column definitions
- Tag PII columns and apply access controls
- Track data lineage — know what feeds what
- Set retention policies for raw data

## Output Format

Deliver:
1. **Pipeline architecture diagram** — sources, ingestion, warehouse, consumers
2. **Data model** — key tables, their purpose, and relationships
3. **dbt project structure** — layers and model organization
4. **Data quality test plan** — tests per model
5. **Orchestration setup** — how pipelines are scheduled (Airflow, Dagster, dbt Cloud)

## Questions to Ask

1. What are the data sources (databases, SaaS tools, APIs)?
2. What questions does the business need to answer?
3. What's the acceptable latency (real-time vs. hourly vs. daily)?
4. What's the expected data volume?
5. What BI tool will analysts use?

## Related Skills

- `database-design` — The operational databases that feed these pipelines
- `ml-ai-integration` — Pipelines that feed ML models
- `monitoring-observability` — Monitor pipeline health and data freshness
- `privacy-compliance` — Handle PII in data pipelines correctly
