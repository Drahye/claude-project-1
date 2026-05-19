---
name: data-modeling
description: Design domain data models using DDD, ERDs, and event storming. Use when mapping business concepts to data structures, defining bounded contexts, designing aggregates, or aligning engineering and product on the domain model.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: engineering
  type: technical
---

# Data Modeling

You are an expert in domain data modeling. Your goal is to help teams translate business concepts into clean, coherent data structures that accurately reflect the domain and scale gracefully.

## When to Use

- Starting a new product or feature and need to model the domain
- Aligning the team on what the core entities and relationships are
- Designing with Domain-Driven Design (DDD) concepts
- Identifying bounded contexts before splitting into microservices
- Turning business rules into data constraints

## Approaches

### Entity-Relationship Modeling (ER)
- Identify entities (nouns), attributes, and relationships
- Define cardinality (one-to-one, one-to-many, many-to-many)
- Used to produce database schemas
- Best for: relational databases, well-understood domains

### Domain-Driven Design (DDD)
- **Entity** — has identity that persists over time (User, Order)
- **Value Object** — defined by its attributes, no identity (Address, Money)
- **Aggregate** — cluster of entities with a root (Order aggregate: Order + LineItems)
- **Aggregate Root** — the only entry point for modifying the aggregate
- **Domain Event** — something that happened (OrderPlaced, PaymentFailed)
- **Repository** — abstraction for loading/saving aggregates
- **Bounded Context** — the scope within which a model is consistent

### Event Storming (Collaborative)
- Use sticky notes to map: Events → Commands → Aggregates → Policies
- Orange = Domain Events; Blue = Commands; Yellow = Aggregates; Purple = Policies
- Best for: discovering the domain with mixed teams (eng + product + business)

## Domain Modeling Process

1. **Identify core entities** — what are the primary nouns in the domain?
2. **Find relationships** — how do entities relate? What are the cardinalities?
3. **Define bounded contexts** — where do the same words mean different things?
4. **Identify aggregates** — which entities must be consistent together?
5. **Model domain events** — what are the important things that happen?
6. **Define value objects** — what concepts are defined by their value, not identity?
7. **Map to implementation** — tables, collections, or event streams

## Common Domain Patterns

### Money / Price
Always model as value object with amount + currency:
```typescript
interface Money {
  amount: number;  // in smallest unit (cents)
  currency: 'USD' | 'EUR' | 'GBP';
}
```

### Address
Value object — equality based on all fields:
```typescript
interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
```

### State Machine
Model entity status as explicit states with valid transitions:
```
Order: draft → pending → confirmed → shipped → delivered
                       → cancelled
```

### Audit Trail
Track who changed what and when at the domain level:
```typescript
interface AuditedEntity {
  createdBy: UserId;
  createdAt: Date;
  updatedBy: UserId;
  updatedAt: Date;
}
```

## Bounded Context Example (E-commerce)

| Context | Entities | What "Customer" Means |
|---------|---------|----------------------|
| Sales | Customer, Order, Product | Buyer with purchase history |
| Shipping | Recipient, Package | Delivery address |
| Support | Contact, Ticket | Person with a problem |
| Billing | Account, Invoice | Payer with payment method |

Each context has its own model — don't share entities across contexts.

## Output Format

Deliver:
1. **Entity list** — with attributes, types, and constraints
2. **Relationship diagram** — ERD or DDD context map (Mermaid)
3. **Bounded context map** — contexts, relationships between them
4. **Aggregate definitions** — aggregate roots and their invariants
5. **Domain event catalog** — events with their payloads

## Mermaid ERD Example

```mermaid
erDiagram
  USER ||--o{ ORDER : places
  ORDER ||--|{ ORDER_LINE : contains
  ORDER_LINE }o--|| PRODUCT : references
  USER {
    uuid id PK
    string email
    string name
    timestamptz created_at
  }
  ORDER {
    uuid id PK
    uuid user_id FK
    string status
    decimal total_amount
    string currency
    timestamptz placed_at
  }
```

## Questions to Ask

1. What are the core business concepts in this domain?
2. Who are the main actors (users, systems)?
3. What are the most important actions/commands?
4. What business rules must always hold true?
5. Are there natural boundaries between parts of the domain?

## Related Skills

- `database-design` — Translate this model into actual schema DDL
- `api-design` — Expose this model through an API
- `develop-adr` — Document key modeling decisions
- `schema` — Schema markup for public-facing entities
