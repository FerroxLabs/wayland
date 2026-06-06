---
name: rag-architect
description: |
  RAG system design covering document chunking strategies, embedding model selection, vector database selection (Pinecone, Weaviate, Chroma, pgvector), retrieval strategies (hybrid search, re-ranking), context window packing, and assessment of faithfulness and relevance.
  Use when the user asks about rag architect, rag architect best practices, or needs guidance on rag architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml deep-learning guide"
  category: "ai-machine-learning"
  subcategory: "llm-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# RAG Architect

## Overview

Retrieval-Augmented Generation (RAG) enhances LLM outputs by grounding them in external knowledge. A well-architected RAG system requires careful decisions across ingestion, indexing, retrieval, and generation stages. This skill covers production-grade RAG design from document processing through quality assessment.

## RAG Architecture Layers

```
+-----------------+     +------------------+     +----------------+
|   Ingestion     | --> |   Indexing       | --> |   Retrieval    |
| - Parse docs    |     | - Embed chunks   |     | - Query embed  |
| - Chunk text    |     | - Store vectors  |     | - Vector search|
| - Extract meta  |     | - Build indices  |     | - Re-rank      |
+-----------------+     +------------------+     +----------------+
                                                        |
                                                        v
                                                 +----------------+
                                                 |   Generation   |
                                                 | - Pack context |
                                                 | - Prompt LLM   |
                                                 | - Cite sources |
                                                 +----------------+
```

## Document Chunking Strategies

### Strategy Comparison

| Strategy | Chunk Size | Overlap | Best For | Drawback |
|----------|-----------|---------|----------|----------|
| Fixed-size | 256-1024 tokens | 10-20% | General purpose | Breaks mid-sentence |
| Sentence-based | Variable | 1-2 sentences | Factual content | Uneven chunk sizes |
| Paragraph-based | Variable | 0-1 paragraph | Well-structured docs | Large chunks |
| Recursive character | 500-1000 chars | 100-200 chars | Mixed content | Heuristic boundaries |
| Semantic | Variable | None | Technical docs | Computationally expensive |
| Document-specific | Varies | Varies | PDFs, HTML, code | Requires per-format logic |

### Recursive Character Splitting (Most Common)

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " ", ""],
    length_function=len,
)

chunks = splitter.split_text(document_text)
```

### Semantic Chunking

```python
import numpy as np
from sentence_transformers import SentenceTransformer

def semantic_chunk(text: str, threshold: float = 0.5) -> list[str]:
    """Split text where semantic similarity between consecutive
    sentences drops below threshold."""
    model = SentenceTransformer("all-MiniLM-L6-v2")
    sentences = split_into_sentences(text)
    embeddings = model.encode(sentences)

    chunks = []
    current_chunk = [sentences[0]]

    for i in range(1, len(sentences)):
        # ... (condensed) ...

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks
```

### Optimal Chunk Size Decision Tree

```
Is your content highly structured (tables, code, lists)?
  YES -> Use document-structure-aware splitting
  NO  -> Continue

Are individual facts important (FAQ, knowledge base)?
  YES -> Smaller chunks (200-400 tokens), sentence-based
  NO  -> Continue

Do you need broad context understanding?
  YES -> Larger chunks (800-1500 tokens), paragraph-based
  NO  -> Medium chunks (400-800 tokens), recursive splitting
```

### Metadata Enrichment

## Embedding Model Selection

### Model Comparison

| Model | Dimensions | Max Tokens | Speed | Quality | Cost |
|-------|-----------|------------|-------|---------|------|
| text-embedding-3-small (OpenAI) | 1536 | 8191 | Fast | Good | $0.02/1M |
| text-embedding-3-large (OpenAI) | 3072 | 8191 | Medium | Excellent | $0.13/1M |
| voyage-3 (Voyage AI) | 1024 | 32000 | Fast | Excellent | $0.06/1M |
| all-MiniLM-L6-v2 (OSS) | 384 | 256 | Very Fast | Good | Free |
| bge-large-en-v1.5 (OSS) | 1024 | 512 | Medium | Very Good | Free |
| Cohere embed-v3 | 1024 | 512 | Fast | Excellent | $0.10/1M |

### Selection Criteria

```
Priority: Cost-sensitive?
  YES -> all-MiniLM-L6-v2 or bge-large (self-hosted)
  NO  -> Continue

Priority: Maximum quality?
  YES -> text-embedding-3-large or voyage-3
  NO  -> text-embedding-3-small (best balance)

Need long-context embeddings (>8K tokens)?
  YES -> voyage-3 (32K) or jina-embeddings-v2 (8K)
  NO  -> Any model above works

Need multilingual support?
  YES -> multilingual-e5-large or Cohere embed-v3
  NO  -> English-optimized models preferred
```

### Embedding Pipeline

```python
from openai import OpenAI

class EmbeddingPipeline:
    def __init__(self, model: str = "text-embedding-3-small"):
        self.client = OpenAI()
        self.model = model
        self.batch_size = 100

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """Embed a batch of texts with automatic batching."""
        all_embeddings = []

        for i in range(0, len(texts), self.batch_size):
            batch = texts[i:i + self.batch_size]
            # ... (condensed) ...
        response = self.client.embeddings.create(
            model=self.model,
            input=query,
        )
        return response.data[0].embedding
```

## Vector Database Selection

### Comparison Matrix

| Feature | Pinecone | Weaviate | Chroma | pgvector | Qdrant | Milvus |
|---------|----------|----------|--------|----------|--------|--------|
| Hosting | Managed | Both | Self/Cloud | Self | Both | Both |
| Scaling | Automatic | Manual | Limited | Manual | Manual | Manual |
| Filtering | Excellent | Excellent | Good | Excellent | Excellent | Good |
| Hybrid Search | Yes | Yes (BM25) | No | No (need ext) | Yes | Yes |
| Max Vectors | Billions | Billions | Millions | Millions | Billions | Billions |
| Latency (p99) | <50ms | <100ms | <50ms | <100ms | <50ms | <100ms |
| Setup Effort | Low | Medium | Low | Low | Medium | High |

### Decision Guide

```
Prototype / Development?
  YES -> Chroma (in-memory, zero config)
  NO  -> Continue

Already using PostgreSQL?
  YES -> pgvector (add extension, no new infra)
  NO  -> Continue

Need fully managed + auto-scaling?
  YES -> Pinecone (serverless)
  NO  -> Continue

Need hybrid search (vector + keyword)?
  YES -> Weaviate or Qdrant
  NO  -> Any of the above
```

### pgvector Setup

```sql
-- Enable extension
CREATE EXTENSION vector;

-- Create table with vector column
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    metadata JSONB,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create HNSW index for fast similarity search
CREATE INDEX ON documents
# ... (condensed) ...
       1 - (embedding <=> $1::vector) AS similarity
FROM documents
WHERE metadata->>'doc_type' = 'policy'
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

### Pinecone Setup

```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="YOUR_KEY")

# Create index
pc.create_index(
    name="knowledge-base",
    dimension=1536,
    metric="cosine",
    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
)

index = pc.Index("knowledge-base")

# ... (condensed) ...
    top_k=10,
    filter={"source": {"$eq": "manual.pdf"}},
    include_metadata=True,
    namespace="production",
)
```

## Retrieval Strategies

### Basic Vector Search

```python
def basic_retrieval(query: str, top_k: int = 5) -> list[dict]:
    query_embedding = embed_query(query)
    results = vector_store.similarity_search(query_embedding, top_k=top_k)
    return results
```

### Hybrid Search (Vector + Keyword)

```python
def hybrid_search(
    query: str,
    top_k: int = 10,
    alpha: float = 0.7
) -> list[dict]:
    """Combine vector and BM25 search with weighted fusion."""
    # Vector search
    query_embedding = embed_query(query)
    vector_results = vector_store.search(query_embedding, top_k=top_k * 2)

    # BM25 keyword search
    bm25_results = bm25_index.search(query, top_k=top_k * 2)

    # Reciprocal Rank Fusion
    # ... (condensed) ...
                scores[doc_id] = {"doc": doc, "score": 0}
            scores[doc_id]["score"] += weight / (k + rank + 1)

    ranked = sorted(scores.values(), key=lambda x: x["score"], reverse=True)
    return [item["doc"] for item in ranked]
```

### Re-Ranking

```python
from sentence_transformers import CrossEncoder

def retrieve_and_rerank(
    query: str,
    initial_k: int = 20,
    final_k: int = 5
) -> list[dict]:
    """Two-stage retrieval: fast vector search then precise re-ranking."""
    # Stage 1: Fast retrieval (bi-encoder)
    candidates = vector_store.search(embed_query(query), top_k=initial_k)

    # Stage 2: Re-rank with cross-encoder
    reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-12-v2")
    pairs = [(query, doc["text"]) for doc in candidates]
    scores = reranker.predict(pairs)

    # Sort by re-ranker score
    for doc, score in zip(candidates, scores):
        doc["rerank_score"] = float(score)

    candidates.sort(key=lambda x: x["rerank_score"], reverse=True)
    return candidates[:final_k]
```

### Multi-Query Retrieval

## Context Window Packing

### Strategies

```python
def pack_context(
    query: str,
    retrieved_docs: list[dict],
    max_tokens: int = 4000,
    strategy: str = "relevance_first",
) -> str:
    """Pack retrieved documents into context within token budget."""

    if strategy == "relevance_first":
        packed = []
        current_tokens = 0
        for doc in retrieved_docs:
            doc_tokens = count_tokens(doc["text"])
            if current_tokens + doc_tokens > max_tokens:
                # ... (condensed) ...
        summaries = []
        for doc in retrieved_docs:
            summary = call_llm(f"Summarize in 2-3 sentences:\n{doc['text']}")
            summaries.append(summary)
        return "\n\n".join(summaries)
```

### Generation Prompt Template

```python
RAG_PROMPT = """Answer the question based on the provided context.
If the context does not contain enough information, say so explicitly.
Cite your sources using [Source N] notation.

## Context

{context}

## Question
{question}

## Instructions
- Only use information from the context above
- Cite specific sources for each claim
- If information conflicts between sources, note the discrepancy
- If the context is insufficient, state what additional information would help
"""
```

## Quality Assessment Framework

### RAG Quality Metrics

| Metric | Measures | How to Compute |
|--------|----------|----------------|
| Faithfulness | Is answer grounded in context? | LLM judge: check each claim |
| Answer Relevance | Does answer address the question? | LLM judge or embedding similarity |
| Context Relevance | Are retrieved docs relevant? | LLM judge or human annotation |
| Context Recall | Were all needed docs retrieved? | Compare to reference answers |
| Answer Correctness | Is the answer factually correct? | Compare to ground truth |

### Faithfulness Checking

```python
def check_faithfulness(question: str, answer: str, context: str) -> float:
    """Check if all claims in the answer are supported by context."""
    # Extract claims
    claims = call_llm(
        f"Extract all factual claims from this answer as a JSON array:\n{answer}"
    )

    # Verify each claim against context
    supported = 0
    total = 0
    for claim in json.loads(claims):
        verdict = call_llm(
            f"Is the following claim supported by the context?\n\n"
            f"Claim: {claim}\n\n"
            # ... (condensed) ...

    return {
        "context_precision": context_precision,
        "context_recall": float(recall),
    }
```

### End-to-End Assessment Pipeline

```python
def run_rag_assessment(
    rag_pipeline,
    test_dataset: list[dict],
) -> dict:
    """Run full quality suite on a RAG pipeline."""
    results = []

    for sample in test_dataset:
        question = sample["question"]
        reference = sample["reference"]

        retrieved_docs = rag_pipeline.get(question)
        answer = rag_pipeline.generate(question, retrieved_docs)
        context = "\n".join([d["text"] for d in retrieved_docs])
# ... (condensed) ...

    return {
        metric: np.mean([r[metric] for r in results])
        for metric in ["faithfulness", "context_precision", "context_recall"]
    }
```

## Production Considerations

### Caching Layer

```python
import hashlib
import redis

class RAGCache:
    def __init__(self, redis_url: str, ttl: int = 3600):
        self.redis = redis.from_url(redis_url)
        self.ttl = ttl

    def get_or_compute(self, query: str, compute_fn):
        cache_key = f"rag:{hashlib.sha256(query.encode()).hexdigest()}"
        cached = self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        result = compute_fn(query)
        self.redis.setex(cache_key, self.ttl, json.dumps(result))
        return result
```

### Index Update Strategy

```
Real-time updates needed?
  YES -> Use write-ahead log + background indexing
  NO  -> Batch re-index on schedule

Document corpus changing frequently?
  YES -> Incremental updates with versioned embeddings
  NO  -> Full re-index weekly/monthly

Need consistency guarantees?
  YES -> Synchronous indexing with confirmation
  NO  -> Async indexing acceptable
```

## Checklist

- [ ] Choose chunking strategy based on document type and query patterns
- [ ] Select embedding model (balance quality, cost, latency)
- [ ] Set up vector database with appropriate indexing (HNSW parameters)
- [ ] Implement hybrid search if keyword matching matters
- [ ] Add re-ranking stage for precision-critical applications
- [ ] Design context packing to maximize useful information per token
- [ ] Build quality assessment pipeline with faithfulness and relevance metrics
- [ ] Add caching for repeated or similar queries
- [ ] Monitor retrieval quality in production
- [ ] Plan index update strategy for evolving document corpus

## When to Use

**Use this skill when:**
- Designing or implementing rag architect solutions
- Reviewing or improving existing rag architect approaches
- Making architectural or implementation decisions about rag architect
- Learning rag architect patterns and best practices
- Troubleshooting rag architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Rag Architect Analysis

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

**Input:** "Help me implement rag architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended rag architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When rag architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
