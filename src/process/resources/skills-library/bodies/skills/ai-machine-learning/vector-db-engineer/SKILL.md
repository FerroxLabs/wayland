---
name: vector-db-engineer
description: |
  Vector database engineering covering Pinecone, Weaviate, Qdrant, pgvector, Milvus, and Chroma selection and configuration, indexing strategies (HNSW, IVF, PQ), similarity search optimization, hybrid search, filtering, multi-tenancy, scaling patterns, and production operations.
  Use when the user asks about vector db engineer, vector db engineer best practices, or needs guidance on vector db engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml data-science guide"
  category: "ai-machine-learning"
  subcategory: "llm-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Vector DB Engineer

## Overview

Vector databases are purpose-built systems for storing, indexing, and querying high-dimensional embedding vectors at scale. They underpin semantic search, RAG systems, recommendation engines, and similarity-based applications. This skill covers database selection, index configuration, query optimization, hybrid search, scaling, and production operations across major platforms.

## Database Comparison

| Feature | Pinecone | Weaviate | Qdrant | pgvector | Milvus | Chroma |
|---------|----------|----------|--------|----------|--------|--------|
| Type | Managed | Both | Both | Extension | Both | OSS |
| Language | Proprietary | Go | Rust | C (PG) | Go/C++ | Python |
| Max Vectors | 100B+ | Billions | Billions | ~10M | Billions | Millions |
| Hybrid Search | Yes | Yes (BM25) | Yes (sparse) | With tsvector | Yes | No |
| Multi-tenancy | Namespaces | Native | Collections | Schemas/RLS | Partitions | Collections |
| Quantization | Auto | PQ, BQ | Scalar, PQ | Half-prec | PQ, SQ | No |
| GPU Accel | Server-side | No | No | No | Yes | No |

### Pricing (approximate)

| Database | Free Tier | 10M vectors (1536d) |
|----------|-----------|---------------------|
| Pinecone | 100K vectors | ~$70/mo |
| Weaviate Cloud | 50K vectors | ~$150/mo |
| Qdrant Cloud | 1M vectors | ~$100/mo |
| pgvector | Self-hosted | DB hosting cost |
| Zilliz (Milvus) | 200K vectors | ~$200/mo |
| Chroma | Unlimited local | Server cost |

### Selection Decision Tree

```
Already using PostgreSQL?
  YES -> pgvector (zero new infra)
  Over 5-10M vectors? -> Add dedicated vector DB

Prototyping?
  YES -> Chroma (install the package via pip, zero config)

Need fully managed, minimal ops?
  YES -> Pinecone serverless or Qdrant Cloud

Need hybrid search (vector + keyword)?
  YES -> Weaviate (BM25) or Qdrant (sparse vectors)

Need GPU-accelerated search?
  YES -> Milvus / Zilliz

Performance critical, low-level control?
  YES -> Qdrant (Rust) or Milvus

Cost sensitive at scale?
  YES -> Self-hosted Qdrant or Milvus

Default -> Pinecone serverless (simplest operations)
```

## Indexing Strategies

| Index | Query Speed | Memory | Recall@10 | Best For |
|-------|-------------|--------|-----------|----------|
| Flat (Brute Force) | Slow O(n) | Low | 100% | <100K, ground truth |
| HNSW | Very Fast | High | 95-99% | General purpose, <50M |
| IVF-Flat | Fast | Medium | 90-98% | Large datasets, GPU |
| IVF-PQ | Very Fast | Low | 85-95% | Billions of vectors |
| DiskANN | Fast | Very Low | 95-99% | SSD-based, cost-sensitive |

### HNSW Tuning

```python
HNSW_PROFILES = {
    "speed":   {"M": 8,  "ef_construction": 64,  "ef_search": 32},   # ~95% recall
    "balanced":{"M": 16, "ef_construction": 128, "ef_search": 64},   # ~97% recall
    "quality": {"M": 32, "ef_construction": 256, "ef_search": 128},  # ~99% recall
}

def estimate_hnsw_memory(n_vectors: int, dimensions: int, M: int = 16) -> dict:
    """Estimate HNSW index memory requirements."""
    vector_bytes = n_vectors * dimensions * 4
    graph_bytes = n_vectors * M * 2 * 8
    overhead = n_vectors * 64
    total = vector_bytes + graph_bytes + overhead
    return {
        "vectors_gb": round(vector_bytes / 1e9, 2),
        "graph_gb": round(graph_bytes / 1e9, 2),
        "total_gb": round(total / 1e9, 2),
        "recommended_ram_gb": round(total / 1e9 * 1.3, 2),
    }

# Example: 10M vectors, 1536 dims, M=16 -> ~62 GB total
```

## Platform Setup

### Pinecone

```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="YOUR_KEY")
pc.create_index(
    name="production-search", dimension=1536, metric="cosine",
    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
)
index = pc.Index("production-search")

# Upsert with metadata
index.upsert(vectors=[{
    "id": "doc_001", "values": embedding,
    "metadata": {"source": "manual.pdf", "department": "engineering"},
}], namespace="production")

# Query with filter
results = index.query(
    vector=query_embedding, top_k=10,
    filter={"department": {"$eq": "engineering"}},
    include_metadata=True, namespace="production",
)
```

### Weaviate

```python
import weaviate
from weaviate.classes.config import Configure, Property, DataType

client = weaviate.connect_to_local()
collection = client.collections.create(
    name="Document",
    vectorizer_config=Configure.Vectorizer.text2vec_openai(model="text-embedding-3-small"),
    properties=[
        Property(name="content", data_type=DataType.TEXT),
        Property(name="source", data_type=DataType.TEXT),
    ],
)

# Hybrid search (vector + BM25)
results = collection.query.hybrid(
    query="How do vector databases work?",
    alpha=0.7,  # 0=pure BM25, 1=pure vector
    limit=10,
)
```

### Qdrant

```python
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance, PointStruct, Filter, FieldCondition, MatchValue

client = QdrantClient(url="[reference URL]")
client.create_collection(
    collection_name="documents",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
    hnsw_config={"m": 16, "ef_construct": 128},
)
client.create_payload_index(collection_name="documents", field_name="dept", field_schema="keyword")

# Search with filter
results = client.query_points(
    collection_name="documents", query=query_embedding, limit=10,
    query_filter=Filter(must=[FieldCondition(key="dept", match=MatchValue(value="eng"))]),
)
```

### pgvector

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536)
);

CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 128);

-- Similarity search with filter
SET hnsw.ef_search = 100;
SELECT id, content, 1 - (embedding <=> $1::vector) AS similarity
FROM documents
WHERE metadata->>'source' = 'manual.pdf'
ORDER BY embedding <=> $1::vector LIMIT 10;

-- Hybrid: vector + full-text
SELECT id, content,
    0.7 * (1 - (embedding <=> $1::vector)) +
    0.3 * ts_rank(to_tsvector('english', content), plainto_tsquery($2)) AS score
FROM documents
WHERE to_tsvector('english', content) @@ plainto_tsquery($2)
ORDER BY score DESC LIMIT 10;
```

## Hybrid Search

### Reciprocal Rank Fusion

```python
def reciprocal_rank_fusion(result_lists: list[list[dict]], k: int = 60, weights: list[float] = None) -> list[dict]:
    """Combine ranked lists (vector + keyword) using RRF."""
    weights = weights or [1.0] * len(result_lists)
    scores = {}
    for weight, results in zip(weights, result_lists):
        for rank, doc in enumerate(results, 1):
            if doc["id"] not in scores:
                scores[doc["id"]] = {"doc": doc, "score": 0.0}
            scores[doc["id"]]["score"] += weight / (k + rank)
    return [s["doc"] | {"rrf_score": s["score"]}
            for s in sorted(scores.values(), key=lambda x: x["score"], reverse=True)]
```

### Filtering Strategy

```
Pre-filtering (filter before vector search):
  Selective filter (<10% matches) -> Pre-filter
  Efficient but may miss semantically relevant results

Post-filtering (filter after vector search):
  Broad filter (>50% matches) -> Post-filter or skip filter
  Full semantic quality but may return <top_k results

In between -> Pre-filter with over-get (search top_k*3, then filter)
```

## Multi-Tenancy

| Pattern | Isolation | Cost | Best For |
|---------|-----------|------|----------|
| Metadata filtering | None | Lowest | Many small tenants |
| Namespace per tenant | Logical | Low | Small-medium tenants |
| Collection per tenant | Strong | High | Strict isolation |
| Cluster per tenant | Physical | Highest | Enterprise compliance |

```python
class MultiTenantVectorStore:
    def __init__(self, client, collection: str):
        self.client = client
        self.collection = collection

    def upsert(self, tenant_id: str, vectors: list[dict]):
        for v in vectors:
            v.setdefault("metadata", {})["tenant_id"] = tenant_id
        self.client.upsert(collection=self.collection, points=vectors)

    def search(self, tenant_id: str, query_vector: list[float], top_k: int = 10):
        return self.client.search(
            collection=self.collection, query_vector=query_vector,
            limit=top_k, filter={"tenant_id": {"$eq": tenant_id}},
        )
```

## Production Operations

### Monitoring

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Query latency p99 | >200ms | >500ms | Scale up, tune ef_search |
| Memory usage | >80% | >90% | Scale or enable disk index |
| Recall@10 | <95% | <90% | Increase M or ef_search |
| Error rate | >0.1% | >1% | Check connectivity |

### Performance Tuning Workflow

```
1. Measure baseline (p50/p95/p99 latency, recall, memory)

2. Identify bottleneck:
   Latency high -> Increase ef_search, enable quantization, index filters
   Recall low -> Increase M and ef_construction, increase ef_search
   Memory high -> Enable quantization, use disk index, reduce dimensions

3. Validate changes (re-measure all metrics, load test)
```

### Scaling Patterns

```
Vertical: More RAM (larger index in memory), faster SSD, more CPU cores
  Limit: Single machine capacity

Horizontal: Hash/range sharding, read replicas
  Native support: Milvus, Qdrant distributed, Pinecone

Tiered Storage:
  Hot: In-memory HNSW (frequent access)
  Warm: Disk-based index (recent data)
  Cold: Object storage (archive)
```

## Checklist

- [ ] Select vector database based on scale, hosting, and feature needs
- [ ] Choose index type (HNSW for most, IVF-PQ for billions)
- [ ] Tune HNSW parameters (M, ef_construction, ef_search)
- [ ] Implement hybrid search if keyword matching adds value
- [ ] Set up payload/metadata indexes for filtered search
- [ ] Design multi-tenancy strategy
- [ ] Enable quantization if memory constrained
- [ ] Implement backup and recovery procedures
- [ ] Set up monitoring for latency, memory, recall, errors
- [ ] Load test at expected QPS with realistic patterns
- [ ] Plan scaling strategy (vertical first, horizontal when needed)
- [ ] Document index parameters, schemas, and runbooks

## When to Use

**Use this skill when:**
- Designing or implementing vector db engineer solutions
- Reviewing or improving existing vector db engineer approaches
- Making architectural or implementation decisions about vector db engineer
- Learning vector db engineer patterns and best practices
- Troubleshooting vector db engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Vector Db Engineer Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement vector db engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended vector db engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When vector db engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
