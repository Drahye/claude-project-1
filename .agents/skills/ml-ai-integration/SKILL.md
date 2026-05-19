---
name: ml-ai-integration
description: Integrate ML and AI capabilities into products using vector databases, embeddings, RAG pipelines, and AI APIs. Use when adding semantic search, recommendations, classification, or LLM-powered features to an application.
phase: develop
version: "1.0.0"
updated: 2026-05-19
metadata:
  category: engineering
  type: technical
---

# ML & AI Integration

You are an expert in integrating machine learning and AI into production applications. Your goal is to help teams ship AI-powered features using APIs, embeddings, vector databases, and fine-tuning — without building models from scratch.

## When to Use

- Adding semantic search or similarity matching to an app
- Building a RAG (Retrieval-Augmented Generation) system
- Integrating an LLM for chat, summarization, classification, or generation
- Adding recommendations (content, product, user-to-user)
- Fine-tuning a model on domain-specific data
- Deciding whether to use a pre-trained API vs. host your own model

## Build vs. Buy Decision

| Approach | When to Choose |
|----------|---------------|
| Use AI API (OpenAI, Anthropic) | Fast, no infra, best for most products |
| Fine-tune a model | Domain-specific language, cost at scale, privacy |
| Self-host open-source model | Data privacy, full control, high volume |
| Traditional ML (sklearn, XGBoost) | Tabular data, classification, regression |

**Default**: Use a hosted API first. Fine-tune or self-host only when you have clear evidence you need it.

## Embeddings & Semantic Search

### What Embeddings Are
Vectors that represent meaning — similar concepts have similar vectors.

### Use Cases
- Semantic search (find docs by meaning, not keywords)
- Duplicate detection
- Recommendation (similar items)
- Clustering and classification

### Implementation Pattern
```python
import openai
import numpy as np

# 1. Embed your content at index time
def embed_document(text: str) -> list[float]:
    response = openai.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

# 2. Store in vector DB (pgvector, Pinecone, Qdrant)
# 3. At query time: embed the query, find nearest neighbors
def semantic_search(query: str, top_k: int = 5):
    query_embedding = embed_document(query)
    # vector DB returns top_k most similar documents
    return vector_db.search(query_embedding, top_k=top_k)
```

## Vector Database Selection

| Database | Best For |
|----------|----------|
| pgvector | Already using PostgreSQL, simple, no new infra |
| Pinecone | Managed, scales easily, production-ready fast |
| Qdrant | Open-source, self-hostable, rich filtering |
| Weaviate | Open-source, hybrid search (vector + keyword) |
| Chroma | Local dev and prototyping |

**Default**: pgvector if you're on PostgreSQL. Pinecone for managed scale.

## RAG (Retrieval-Augmented Generation)

RAG = retrieve relevant context → inject into LLM prompt → generate grounded response.

```
User Query
    ↓
Embed Query
    ↓
Vector Search → Top K Documents
    ↓
Build Prompt: [System] + [Context from docs] + [User Query]
    ↓
LLM generates response grounded in your data
```

### RAG Quality Checklist
- [ ] Chunk documents at semantic boundaries (not fixed characters)
- [ ] Store metadata with chunks (source, date) for filtering
- [ ] Use hybrid search (vector + keyword BM25) for better recall
- [ ] Evaluate retrieval quality separately from generation quality
- [ ] Add re-ranking step for higher precision

## LLM Integration Patterns

### Prompt Engineering
- System prompt: role, tone, constraints, output format
- Few-shot examples for consistent output
- Chain of thought for complex reasoning
- Structured output (JSON mode / tool use) for machine-readable responses

### Tool Use / Function Calling
```python
tools = [{
    "type": "function",
    "function": {
        "name": "get_order_status",
        "description": "Get the status of a customer order",
        "parameters": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string"}
            },
            "required": ["order_id"]
        }
    }
}]

response = openai.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Where is order #12345?"}],
    tools=tools
)
```

### Guardrails
- Input validation: detect prompt injection, inappropriate content
- Output validation: check format, length, hallucination risk
- Tools: Guardrails AI, NeMo Guardrails, Llama Guard

## Recommendations

### Collaborative Filtering (User-to-User, Item-to-Item)
- "Users who liked X also liked Y"
- Needs interaction data (clicks, purchases, ratings)
- Libraries: Surprise, LightFM, implicit

### Content-Based (Embedding Similarity)
- "Items similar to what you just viewed"
- Works with cold start (no interaction data needed)
- Use product/content embeddings → cosine similarity

## Evaluation

- **Embeddings**: evaluate retrieval recall@k, MRR
- **RAG**: faithfulness (is the answer in the context?), relevance, answer correctness
- **LLM outputs**: human eval (vibe check), LLM-as-judge, task-specific metrics
- Tools: RAGAS, promptfoo, LangSmith

## Output Format

Deliver:
1. **Architecture diagram** — data flow from input to AI output
2. **Model/API selection** — with rationale
3. **Implementation code** — embedding, retrieval, and generation
4. **Evaluation plan** — how to measure quality
5. **Cost estimate** — per 1K queries at expected volume

## Questions to Ask

1. What AI capability are you adding (search, chat, classify, recommend)?
2. What data does the system need to reason over?
3. What are the latency requirements (real-time vs. async)?
4. Do you have data privacy constraints (can't send data to OpenAI)?
5. What's the expected query volume?

## Related Skills

- `api-design` — Expose AI features through a clean API
- `data-pipeline` — Pipeline that prepares data for AI features
- `database-design` — Store embeddings and AI outputs
- `monitoring-observability` — Monitor AI feature quality and costs
- `claude-api` — Build specifically with the Anthropic/Claude API
