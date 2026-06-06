---
name: vector-database-patterns
description: |
  Guides expert-level vector database patterns implementation: ai-ml and database decision frameworks, production-ready patterns, and concrete templates for vector database patterns workflows.
  Use when the user asks about vector database patterns, vector database patterns configuration, or ai-ml best practices for vector projects.
  Do NOT use when the user needs a different ai ml engineering capability -- check sibling skills in the ai ml engineering subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml database optimization"
  category: "ai-machine-learning"
  subcategory: "ai-ml-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Vector Database Patterns

## When to Use

**Use this skill when:**
- User is designing or implementing a vector similarity search system (semantic search, recommendation engine, RAG pipeline, duplicate detection, anomaly detection)
- User asks about choosing between vector database options -- pgvector, Pinecone, Weaviate, Qdrant, Milvus, Chroma, Redis with vector module, or FAISS
- User needs to optimize query latency or recall in an existing vector store deployment (e.g., recall dropping below 90%, p99 latency exceeding 200ms)
- User is building a Retrieval-Augmented Generation (RAG) system and needs to design chunking strategy, embedding pipeline, and index configuration
- User asks about ANN (Approximate Nearest Neighbor) algorithm selection -- HNSW vs IVF vs ScaNN vs flat index
- User needs multi-tenant vector isolation patterns, namespace design, or metadata filtering at scale
- User is troubleshooting poor retrieval quality -- irrelevant results, low precision, wrong semantic matches
- User needs to handle hybrid search combining dense vectors with sparse BM25 keyword scores
- User is migrating from one vector store to another and needs a safe cutover strategy

**Do NOT use this skill when:**
- User needs help with embedding model selection, fine-tuning, or training -- use the embedding-model-selection skill instead
- User needs general RAG system design beyond the vector store layer -- use the rag-architecture-design skill
- User is asking about traditional full-text search (Elasticsearch, Solr) with no vector component -- use the search-architecture skill
- User needs LLM prompt engineering or output quality improvement -- use the prompt-engineering skill
- User is asking about graph databases or knowledge graphs -- use the graph-database-patterns skill
- User needs relational database design -- use the relational-schema-design skill
- User is asking about streaming/real-time ML feature stores -- use the feature-store-patterns skill

---

## Process

### 1. Characterize the Workload and Requirements

Before recommending any vector database or index configuration, gather concrete requirements:

- **Corpus size:** Number of vectors and their dimensionality. Sub-1M vectors allow different choices than 100M+ vectors. Dimensionality directly affects memory: a 1536-dim float32 vector is 6KB; 1 million of them is ~6GB in RAM.
- **Query patterns:** Point queries (find similar to this item), batch queries (offline recommendation generation), filtered queries (semantic search within a category). Filtered queries fundamentally change index strategy.
- **Recall vs latency tradeoff:** Define the operating point. Production semantic search typically requires recall@10 >= 0.95 at p95 latency <= 100ms. Recommendation engines often tolerate recall@50 >= 0.85 at higher throughput.
- **Update frequency:** Append-only (document ingestion), bulk updates (model retraining), or real-time updates (user profile embeddings). Real-time updates disqualify some index types or require specific configuration.
- **Metadata filtering needs:** Identify what filters will be applied -- tenant ID, timestamp ranges, categorical attributes, numeric ranges. Heavy filtering (returning <5% of the index) requires specific optimization strategies.
- **Deployment constraints:** Managed cloud service vs self-hosted, existing infrastructure (Postgres already running?), team operational expertise, data residency requirements.

### 2. Select the Vector Database Engine

Apply this decision framework based on requirements gathered in Step 1:

- **If you have Postgres already deployed and corpus is under 5M vectors at 1536 dims:** Use pgvector with HNSW index. It eliminates operational complexity and supports transactional consistency. Set `hnsw.ef_construction = 128`, `hnsw.m = 16` as baseline. Enable `pgvector.hnsw_ef_search = 64` at query time.
- **If you need fully managed, no operational overhead, and corpus is under 100M vectors:** Pinecone or Qdrant Cloud. Pinecone has a proven managed offering. Qdrant Cloud offers richer filtering without performance penalty via its payload index system.
- **If self-hosted is required and corpus exceeds 10M vectors:** Milvus with HNSW or IVF_HNSW index. It supports distributed sharding, separate storage and compute scaling, and has mature Kubernetes operators.
- **If running a Python prototype or local RAG with under 1M vectors:** Chroma (in-process) or FAISS (library). Do not use these for production multi-tenant workloads -- they lack durability guarantees and concurrent write handling.
- **If latency is critical (under 5ms p99) and corpus fits in RAM:** FAISS with a flat index (exact search) or HNSW. Exact search is only feasible when corpus size * dimensionality * 4 bytes fits in ~80% of available RAM.
- **If hybrid dense+sparse search is a core requirement:** Weaviate (BM25 + vector native hybrid) or Qdrant (sparse vector support). Do not bolt hybrid search onto a system not designed for it.

### 3. Choose and Configure the Index Algorithm

ANN algorithm selection is the highest-leverage configuration decision:

- **HNSW (Hierarchical Navigable Small World):** Best general-purpose choice for query latency under 50ms with recall > 0.95. Builds a layered proximity graph. Key parameters:
  - `M` (number of bidirectional links per node): 16 is standard; increase to 32--64 for higher recall at cost of memory (+50% RAM per doubling). Never set below 8.
  - `ef_construction`: Controls index build quality. Use 128--200 for production. Lower values build faster but reduce recall. Set once at build time; cannot change without rebuilding.
  - `ef_search` (or `ef` at query time): Controls query recall-speed tradeoff. Start at 64, increase until recall target is met. Each doubling roughly doubles query latency and improves recall by 1--3%.
  - Memory: HNSW stores the graph in RAM. For 1M vectors at 1536 dims with M=16: ~7GB base + ~1GB graph overhead.
- **IVF_FLAT (Inverted File Index):** Clusters vectors into `nlist` Voronoi cells. Good for 10M+ vectors when memory is constrained and batch throughput matters over single-query latency.
  - `nlist`: Set to `sqrt(n_vectors)` as baseline. For 10M vectors, start with `nlist = 4096`.
  - `nprobe` (cells searched per query): Start at `nlist / 10`. Increase until recall target is met. Going from `nprobe=64` to `nprobe=256` on a 4096-cell index roughly quadruples latency but improves recall significantly.
  - Requires training on a representative sample of the corpus (at least 30x `nlist` vectors).
- **IVF_PQ (with Product Quantization):** Compresses vectors by 16--64x. Use when corpus exceeds available RAM. Recall penalty is ~5--10% vs IVF_FLAT. `m` (PQ segments) must divide evenly into dimensionality. For 1536-dim, use `m=96` (16 bytes per vector vs 6144 bytes -- 384x compression).
- **ScaNN:** Google's algorithm, optimized for high-dimensional vectors and TPU/SIMD hardware. Best-in-class latency when deployed on hardware it's optimized for. Not available in most managed vector databases.
- **Flat index (exact search):** Only use for up to ~500K vectors or when recall must be exactly 1.0 (compliance requirements). Scales linearly with corpus size.

### 4. Design the Data Model and Schema

Poor schema design causes correctness bugs and performance cliffs that are expensive to fix post-deployment:

- **Embedding storage:** Store the embedding alongside metadata, not in a separate system, unless you have specific reasons (e.g., compliance separation). Joining at query time kills performance.
- **Metadata payload design:** Only store filterable fields as indexed metadata. Store display-only fields in a separate relational table with the vector ID as foreign key. Over-indexing metadata increases RAM and degrades write throughput.
- **ID strategy:** Use stable, externally meaningful IDs (e.g., document UUID) rather than auto-incrementing integers. This enables idempotent upserts and cross-system joins without a separate ID mapping table.
- **Versioning embeddings:** When the embedding model changes, you must re-embed the entire corpus. Design for this: use a `model_version` field in metadata, support multiple embedding versions in the index, and implement a shadow index strategy for zero-downtime migration.
- **Chunking strategy (for RAG):**
  - Fixed-size chunking: 512 tokens with 50--100 token overlap is a common baseline. Overlap prevents context loss at boundaries.
  - Semantic chunking: Split at natural boundaries (paragraphs, sections) rather than fixed token counts. Improves retrieval relevance by 10--20% over fixed-size in most benchmarks.
  - Hierarchical chunking: Store both sentence-level and paragraph-level embeddings. Retrieve at sentence level, return paragraph-level context to the LLM.
  - Chunk size guidance by use case: QA over technical docs: 256--512 tokens. Summarization: 1024--2048 tokens. Code search: function-level (variable size).
- **Multi-tenancy isolation:** Use namespace-per-tenant (Pinecone) or collection-per-tenant (Qdrant/Weaviate) for strong isolation. Use metadata filtering (`tenant_id = X`) only when tenant count is below 1000 and cross-tenant queries are needed. Metadata filtering with high-cardinality tenant IDs degrades recall on HNSW.

### 5. Build the Ingestion Pipeline

Ingestion errors silently corrupt the vector space and are hard to detect later:

- **Batching:** Never insert vectors one at a time in production. Batch size of 100--1000 vectors per upsert call is typical. For Milvus/Qdrant, target batches of 1000 vectors at 1536 dims per call.
- **Normalization:** If using cosine similarity, normalize vectors to unit length before insertion and query. Many engines perform this automatically if configured (`distance: cosine`), but verify. Un-normalized vectors with cosine distance produce incorrect results.
- **Deduplication:** Hash the source content (SHA-256 of the text chunk) and store it as metadata. On re-ingestion, skip vectors whose content hash already exists. This prevents duplicate embeddings that pollute recall.
- **Idempotency:** Use upsert semantics, not insert. All production pipelines must be safe to re-run. Inserts on duplicate IDs should overwrite.
- **Retry and error handling:** Embedding API calls fail transiently. Implement exponential backoff with jitter: initial delay 1s, max delay 60s, max retries 5. Log failed IDs to a dead-letter queue for manual review.
- **Throughput estimation:** OpenAI's text-embedding-3-small processes ~1M tokens/minute at Tier 2 rate limits. For 100K documents at ~500 tokens each: ~50M tokens, ~50 minutes at full rate. Plan ingestion jobs accordingly and implement resumable pipelines with checkpointing.
- **Embedding consistency:** Use a single embedding model version for all vectors in an index. Never mix embeddings from different models or different normalization settings in the same collection -- cosine similarity between them is meaningless.

### 6. Implement Query Patterns

Query implementation determines whether theoretical recall translates to actual retrieval quality:

- **Pre-filter vs post-filter:** Pre-filtering (filtering before ANN search) reduces the candidate set and can dramatically reduce recall if the filtered subset is small. Post-filtering (filter after ANN search) maintains recall but may return fewer than k results. Use pre-filtering only when the filtered set is > 20% of the corpus. For smaller subsets, oversample (request 10k results) then post-filter, or use an engine that supports payload-indexed pre-filtering without recall penalty (Qdrant's payload index does this correctly).
- **Query-time ef tuning:** Expose `ef_search` as a runtime parameter, not a compile-time constant. Different query types have different latency/recall tradeoffs. A real-time search bar needs lower latency; an offline batch job can use higher ef for better recall.
- **Hybrid search implementation:** Combine dense vector scores with sparse BM25 scores using Reciprocal Rank Fusion (RRF): `score = 1/(k + rank_dense) + 1/(k + rank_bm25)` where `k = 60` is standard. Do not linearly combine raw scores from different score spaces -- the scales are incomparable. RRF is robust and requires no tuning.
- **Maximal Marginal Relevance (MMR):** Use MMR when result diversity matters (e.g., search result pages). Retrieves top-2k results, then iteratively selects results that are both relevant and diverse. The `lambda` parameter (typically 0.5--0.7) controls the relevance-diversity tradeoff. MMR is O(k²) so limit to k <= 20.
- **Query expansion:** For sparse queries (unusual terminology), expand with synonyms or paraphrases before embedding. Simple approach: generate 2--3 paraphrases using a small LLM, embed each, average the embeddings. Averages of paraphrase embeddings outperform single query embeddings by 5--15% on recall in sparse domains.
- **Negative examples:** Some vector databases support negative vector constraints (penalize results close to a given vector). Use this for "more like this but not like that" recommendations. Weaviate and Qdrant support this natively.

### 7. Instrument, Monitor, and Evaluate

Vector database performance degrades silently as data distribution shifts -- monitoring is not optional:

- **Recall measurement:** Implement offline recall measurement against a golden dataset. Compute recall@10 and recall@50 weekly. Alert if recall@10 drops below 0.90. Recall degradation usually means distribution shift (new content not well-covered by the embedding model) or index fragmentation.
- **Latency percentiles:** Track p50, p95, p99 query latency. p99 > 500ms indicates an HNSW fragmentation issue (too many deletes), an undersized instance, or blocking on write operations. HNSW graphs degrade with frequent deletes -- plan for periodic index rebuilds (every 10--20% churn).
- **Index health metrics:** Monitor: vector count growth, delete ratio, segment count (Milvus), memory usage. Qdrant provides `/metrics` endpoint with Prometheus-compatible output. Milvus has a Grafana dashboard template.
- **Embedding drift detection:** When you update the embedding model, compute the cosine similarity between old and new embeddings for 1000 random samples. If mean similarity < 0.9, the models are significantly different and full re-ingestion is required. Never partial-update an index with a new embedding model.
- **Query logging:** Log the query text (or a hash for PII), retrieved document IDs, and user feedback signals (click, thumbs up/down). This creates the evaluation dataset for recall measurement and future fine-tuning.

### 8. Plan for Production Operations

Operational patterns prevent the most common production failures:

- **Zero-downtime index migrations:** Build new index in shadow, compare recall on a 5% traffic sample, promote when recall parity is confirmed, deprecate old index after 24 hours of clean operation. Never do in-place schema changes.
- **Backup strategy:** Export vector data (IDs, vectors, metadata) to object storage (S3/GCS) on a schedule matching your recovery point objective. Managed services have point-in-time restore; self-hosted Milvus and Qdrant require explicit snapshot configuration.
- **Capacity planning:** HNSW index memory = `(4 * dimensions + 8 * M * 2) * n_vectors` bytes approximately. For 10M vectors at 1536 dims, M=16: ~65GB RAM minimum. Add 20% headroom for OS and working memory. Plan for 2--3x data growth.
- **Connection pooling:** Vector database clients are not inherently thread-safe in all SDKs. Use a connection pool with max connections = 2x CPU cores for synchronous workloads, higher for async. Pinecone's gRPC client handles pooling internally; FAISS requires explicit thread safety.

---

## Output Format

For each vector database design engagement, produce the following structured output:

```
## Vector Database Design Document

### Requirements Summary
| Dimension          | Value                          | Source         |
|--------------------|-------------------------------|----------------|
| Corpus size        | e.g., 2.5M vectors            | Stated         |
| Dimensionality     | e.g., 1536 (text-embedding-3) | Stated         |
| Query latency SLA  | e.g., p95 < 75ms              | Stated         |
| Recall target      | e.g., recall@10 >= 0.95       | Stated/Default |
| Update pattern     | e.g., append-only, ~10K/day   | Stated         |
| Filter patterns    | e.g., tenant_id, date range   | Stated         |
| Scale horizon      | e.g., 3x in 18 months         | Estimated      |
| Deployment model   | e.g., self-hosted on K8s      | Stated         |

### Engine Selection
**Recommended:** [Engine name]
**Rationale:** [2--4 sentences explaining why this engine was selected over alternatives]
**Alternatives considered:**
- [Engine A]: Rejected because [specific reason]
- [Engine B]: Rejected because [specific reason]

### Index Configuration
```python
# Production index configuration
index_config = {
    "index_type": "HNSW",           # or IVF_HNSW, IVF_PQ, etc.
    "metric_type": "COSINE",        # or L2, IP
    "params": {
        "M": 16,                    # bidirectional link count
        "ef_construction": 128,     # build-time quality (set once)
    }
}

search_params = {
    "ef": 64,                       # query-time recall-speed tradeoff
                                    # increase to 128 if recall < 0.95
}
```

### Schema Design
```python
# Collection/index schema
schema = {
    "collection_name": "documents_v2",
    "fields": [
        {"name": "doc_id",         "type": "VARCHAR(64)",  "is_primary": True},
        {"name": "embedding",      "type": "FLOAT_VECTOR", "dim": 1536},
        {"name": "tenant_id",      "type": "VARCHAR(32)",  "indexed": True},
        {"name": "content_hash",   "type": "VARCHAR(64)",  "indexed": False},
        {"name": "created_at",     "type": "INT64",        "indexed": True},
        {"name": "chunk_index",    "type": "INT16",        "indexed": False},
    ]
}
```

### Ingestion Pipeline
```python
async def ingest_documents(
    documents: list[Document],
    collection: VectorCollection,
    embedding_client: EmbeddingClient,
    batch_size: int = 500,
) -> IngestionResult:
    """
    Idempotent ingestion with deduplication and retry.
    
    Batches at batch_size to balance throughput and memory.
    Skips documents whose content_hash already exists.
    Retries embedding API calls with exponential backoff.
    """
    results = IngestionResult()
    
    for batch in chunk_list(documents, batch_size):
        # Deduplication check
        existing_hashes = await collection.get_existing_hashes(
            [doc.content_hash for doc in batch]
        )
        new_docs = [d for d in batch if d.content_hash not in existing_hashes]
        
        if not new_docs:
            results.skipped += len(batch)
            continue
        
        # Embed with retry
        embeddings = await embed_with_retry(
            texts=[doc.text for doc in new_docs],
            client=embedding_client,
            max_retries=5,
            initial_delay=1.0,
        )
        
        # Normalize for cosine similarity
        embeddings = normalize_l2(embeddings)
        
        # Upsert (overwrite on duplicate ID)
        await collection.upsert(
            ids=[doc.doc_id for doc in new_docs],
            vectors=embeddings,
            payloads=[doc.metadata for doc in new_docs],
        )
        results.inserted += len(new_docs)
    
    return results
```

### Query Implementation
```python
async def semantic_search(
    query: str,
    collection: VectorCollection,
    embedding_client: EmbeddingClient,
    top_k: int = 10,
    filters: dict | None = None,
    ef_search: int = 64,
) -> list[SearchResult]:
    """
    Semantic search with optional pre-filtering.
    
    Increases ef_search to 128 when filters reduce candidate
    pool to < 20% of corpus to maintain recall target.
    """
    query_embedding = await embed_with_retry(
        texts=[query],
        client=embedding_client,
    )
    query_embedding = normalize_l2(query_embedding)[0]
    
    # Adaptive ef_search for filtered queries
    effective_ef = ef_search
    if filters:
        estimated_filtered_fraction = estimate_filter_selectivity(filters)
        if estimated_filtered_fraction < 0.20:
            effective_ef = min(ef_search * 4, 512)
    
    results = await collection.search(
        query_vector=query_embedding,
        top_k=top_k,
        filter=filters,
        search_params={"ef": effective_ef},
    )
    
    return results
```

### Monitoring Plan
| Metric                  | Alert Threshold         | Measurement Method         |
|-------------------------|------------------------|----------------------------|
| recall@10               | < 0.90                 | Weekly offline eval         |
| p95 query latency       | > 150ms                | APM traces                 |
| p99 query latency       | > 500ms                | APM traces                 |
| Index memory usage      | > 80% of allocation    | Prometheus metric           |
| Ingestion error rate    | > 1%                   | Dead-letter queue depth     |
| Delete ratio            | > 20% of total vectors | Index health check         |

### Capacity Estimate
| Component              | Current     | 18-Month Projection  | Instance Type          |
|------------------------|-------------|----------------------|------------------------|
| HNSW index memory      | ~16 GB      | ~48 GB               | 64 GB RAM node         |
| Storage (raw vectors)  | ~15 GB      | ~45 GB               | 100 GB SSD             |
| Query throughput       | 500 QPS     | 1500 QPS             | 3 replicas             |
```

---

## Rules

1. **Never mix embedding models in a single collection.** Cosine similarity between embeddings from different models is mathematically meaningless. If you upgrade models, rebuild the entire index. Use `model_version` in metadata and enforce that all vectors in a collection share a version.

2. **Always normalize vectors before insertion when using cosine similarity.** Many clients do not auto-normalize. Un-normalized vectors with cosine distance silently produce wrong rankings. Verify normalization by checking that `||embedding|| ≈ 1.0` for 10 random samples after insertion.

3. **Never use HNSW with a delete ratio above 20% without rebuilding.** Deleted nodes become "tombstones" that remain in the graph, degrading recall. Monitor the ratio of deleted to total vectors. Rebuild the index when this ratio crosses 15--20%.

4. **Never tune `ef_construction` after building the index.** It is a build-time parameter. Changing it requires dropping and rebuilding the entire index, which may take hours for large corpora. Set it correctly from the start: 128 for most production cases, 200 for very high recall requirements.

5. **Always benchmark recall on your actual data, not synthetic benchmarks.** ANN-Benchmarks results are on specific datasets (SIFT, GloVe) that may not reflect your data distribution. Maintain a golden retrieval dataset of 500--1000 queries with human-annotated relevant documents for your domain.

6. **Never store display-only fields as indexed metadata in the vector database.** Fields like article body text, author bio, or image URLs should live in your primary database, referenced by vector ID. Storing them inflates memory and write amplification with zero query benefit.

7. **Avoid using metadata filtering as the primary access control mechanism.** Metadata filters are soft filters -- bugs or injection vulnerabilities can expose cross-tenant data. For strict multi-tenancy, use separate collections or namespaces per tenant. Use metadata filtering only for performance optimization within a collection.

8. **Never configure `nlist` below `sqrt(n_vectors)` for IVF indexes.** Too few clusters means each cluster contains too many vectors, making nprobe expensive and recall poor. Recalculate `nlist` as the corpus grows. An index built with `nlist = 100` on 100K vectors will perform poorly once the corpus reaches 5M vectors.

9. **Always implement ingestion as idempotent upserts with content-addressed deduplication.** Re-running a failed ingestion job should produce the same result as running it once. Non-idempotent ingestion pipelines create duplicate embeddings that inflate index size and reduce recall precision.

10. **Never expose raw vector scores to users as relevance percentages.** Cosine similarity scores between 0.7 and 1.0 are not linearly interpretable. A score of 0.85 is not "85% relevant." Use score thresholds calibrated on your dataset, or convert to ranking positions. For user-facing relevance, use click-through rate or explicit feedback to calibrate score interpretation.

---

## Edge Cases

### Extremely High Filter Selectivity (< 1% of corpus)
When a query applies a filter that matches fewer than 1% of vectors (e.g., search within a tiny tenant, or a very narrow date range), standard HNSW pre-filtering will return almost no results because the graph traversal rarely lands in the tiny filtered subset. Solutions in order of preference:
- Switch to a payload-indexed pre-filter engine (Qdrant's payload index maintains a separate index per filterable field, allowing HNSW traversal to be restricted to matching vectors without recall degradation).
- Use a "filtered flat search" fallback: detect when filter selectivity < 5%, fetch all matching vector IDs, load their vectors, and perform brute-force kNN on that subset.
- For static filter categories (e.g., per-language indexes), create a separate collection per category. This is effective when categories are known at design time and have asymmetric sizes.

### Corpus Size Exceeds Available RAM
When the HNSW index no longer fits in RAM (typically when corpus exceeds memory budget), queries begin page-faulting and latency spikes to seconds. Do not simply add RAM indefinitely:
- Switch to IVF_PQ for high memory compression (32--64x) at a 5--10% recall penalty.
- Use Milvus with disk-based HNSW (DiskANN algorithm): stores the graph on NVMe SSDs, serves queries with 10--30ms latency using sequential IO patterns.
- Implement a tiered architecture: keep "hot" vectors (recent, frequently accessed) in HNSW-in-RAM, and "cold" vectors in IVF_PQ or disk-based index. Route queries to both tiers and merge results.

### Embedding Model Version Migration
When upgrading from one embedding model to another (e.g., text-embedding-ada-002 to text-embedding-3-large), you cannot incrementally replace vectors in a mixed index:
- Build a shadow index with the new model on the entire corpus. Run in parallel.
- For 2--4 weeks, dual-write new ingestions to both old and new indexes.
- Run A/B recall comparison on 5% of query traffic. Compute recall@10 on both indexes using the golden dataset.
- When recall parity or improvement is confirmed, shift 100% of query traffic to the new index.
- Deprecate the old index after 72 hours with no rollback signals.
- Timeline estimate: for 5M documents at 500 tokens each (~2.5B tokens), re-embedding takes approximately 40 hours at Tier 2 OpenAI rate limits.

### Real-Time Vector Updates (User Profile Embeddings)
When vectors must be updated in near-real-time (e.g., user interest embeddings updated on every interaction), HNSW's update behavior becomes a bottleneck:
- HNSW does not support true in-place updates -- an "update" is a delete + insert, which contributes to tombstone accumulation.
- For update rates above 1000 vectors/second, consider using a hybrid approach: a small in-memory exact-search index for "hot" recently updated vectors, combined with a larger HNSW for "cold" stable vectors. Query both and merge.
- Qdrant's on-disk HNSW supports higher update throughput than pure in-memory HNSW because it uses LSM-tree-style segment merging.
- Set a maximum update frequency per vector (e.g., no more than 1 update per 5 minutes per user). Debounce updates in the application layer before writing to the vector store.

### Catastrophic Recall Degradation After Ingestion Spike
After a large bulk ingestion (e.g., 10M new documents), recall can drop significantly and queries that previously worked return irrelevant results:
- This usually indicates that the index parameters were calibrated for the original corpus size and are now suboptimal for the expanded corpus.
- For IVF indexes: `nlist` should be approximately `sqrt(n_vectors)`. After a 10x corpus growth, the original `nlist` is too small. Drop and rebuild with correct `nlist`.
- For HNSW: large bulk inserts cause graph imbalance. Trigger a forced index compaction or rebalance if the engine supports it (Milvus: `compact()`, Qdrant: optimizer settings).
- Always run a recall measurement on the golden dataset immediately after a bulk ingestion that increases corpus size by > 50%.

### Multi-Language Corpora
When the corpus contains documents in many languages, single-language embedding models (including most English-trained models) produce a fragmented semantic space where similar concepts in different languages occupy different regions:
- Use multilingual models: multilingual-e5-large, mUSE, or paraphrase-multilingual-mpnet-base-v2. These explicitly align cross-lingual semantics.
- Verify cross-lingual alignment by checking that the cosine similarity between a sentence and its human translation is > 0.85. If it is below 0.7, the model is not adequately multilingual for your languages.
- Do not mix a multilingual embedding model with a monolingual embedding model in the same collection.
- Store the detected language as metadata. Allow users to filter by language if they want same-language results only.

### Query Latency Regression After Schema Changes
Adding a new metadata field with an index, or changing a filter from unindexed to indexed, can cause query latency to spike 3--5x in engines that rebuild indexes synchronously:
- In Qdrant, adding a payload index triggers a background re-indexing job. Monitor the optimizer status endpoint before serving production traffic after schema changes.
- In Milvus, adding a scalar field index requires an explicit `index.create()` call and building completes asynchronously. Queries served during index build fall back to brute-force scalar scan, increasing latency.
- Schedule schema changes during low-traffic windows. Use a read replica to absorb production traffic during the index build. Only promote the primary after index build completes.

---

## Example

**Input:** "We're building a customer support knowledge base search for a SaaS product. We have 800K support articles, each ~400--600 words. We need users to search in natural language and get relevant articles back in real time. We're using Postgres already and running on AWS. Expected query load is 200 QPS peak. Articles are updated about 500 per day, no deletes. We want to keep operational complexity low."

**Output:**

### Requirements Summary
| Dimension          | Value                               | Source         |
|--------------------|-------------------------------------|----------------|
| Corpus size        | 800K vectors, growing ~500/day      | Stated         |
| Dimensionality     | 1536 (text-embedding-3-small rec.)  | Derived        |
| Query latency SLA  | p95 < 100ms (real-time UX)          | Derived        |
| Recall target      | recall@10 >= 0.95                   | Default prod   |
| Update pattern     | Append/update, 500/day, no deletes  | Stated         |
| Filter patterns    | None stated (single tenant implied) | Stated         |
| Scale horizon      | ~1M vectors in 14 months            | Estimated      |
| Deployment model   | AWS, low operational complexity     | Stated         |

### Engine Selection

**Recommended:** pgvector on RDS PostgreSQL 16 (or Aurora PostgreSQL 16.2+)

**Rationale:** With Postgres already deployed on AWS, pgvector eliminates a second operational dependency. 800K vectors at 1536 dims is approximately 5GB for the HNSW index -- well within the memory budget of an RDS db.r7g.2xlarge (64 GB RAM). At 200 QPS with HNSW ef_search=64, expected query latency is 15--40ms p95, well within the 100ms SLA. The 500 daily appends (no deletes) are ideal for HNSW -- no tombstone accumulation.

**Alternatives considered:**
- Pinecone: Rejected -- operational cost premium not justified given Postgres is already running and the corpus is well within pgvector's operating range.
- Qdrant (self-hosted): Rejected -- would require a new operational dependency (Kubernetes deployment) with no capability advantage at this scale.
- Weaviate: Rejected -- hybrid search (BM25 + vector) is not stated as a requirement; operational complexity exceeds benefit.

### Index Configuration

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the knowledge base articles table
CREATE TABLE kb_articles (
    article_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id     VARCHAR(64) UNIQUE NOT NULL,  -- CMS article ID
    title           TEXT NOT NULL,
    content_hash    VARCHAR(64) NOT NULL,           -- SHA-256 of chunk text
    chunk_index     SMALLINT NOT NULL DEFAULT 0,
    embedding       vector(1536) NOT NULL,
    updated_at      BIGINT NOT NULL,                -- Unix timestamp
    category        VARCHAR(64),
    INDEX           (category),
    INDEX           (external_id)
);

-- HNSW index -- set parameters before data load for efficiency
-- M=16 is standard; ef_construction=128 balances build time and recall
CREATE INDEX kb_articles_embedding_idx ON kb_articles
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 128);

-- Set query-time ef_search for the session or connection pool
SET hnsw.ef_search = 64;
-- Increase to 100 if recall@10 falls below 0.93 in evaluation
```

**Memory estimate:**
- 800K vectors × 1536 dims × 4 bytes = ~4.9 GB for raw vectors
- HNSW graph overhead with M=16: ~800K × 16 × 2 × 8 bytes ≈ 0.2 GB
- Total: ~5.1 GB -- fits in db.r7g.xlarge (32 GB RAM) with headroom
- At 1M vectors (14-month projection): ~6.4 GB -- same instance

### Ingestion Pipeline

```python
import hashlib
import asyncio
import asyncpg
import numpy as np
from openai import AsyncOpenAI
from typing import NamedTuple

class ArticleChunk(NamedTuple):
    external_id: str
    chunk_index: int
    text: str
    title: str
    category: str
    updated_at: int

async def ingest_articles(
    chunks: list[ArticleChunk],
    pool: asyncpg.Pool,
    openai_client: AsyncOpenAI,
    batch_size: int = 500,
) -> dict:
    """
    Idempotent ingestion pipeline for KB articles.
    
    Uses SHA-256 content hashing to skip unchanged articles.
    Normalizes embeddings for cosine similarity correctness.
    Batches at 500 to stay within OpenAI token limits per request.
    """
    stats = {"inserted": 0, "skipped": 0, "errors": 0}

    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]

        # Compute content hashes
        hashes = {
            chunk.external_id: hashlib.sha256(chunk.text.encode()).hexdigest()
            for chunk in batch
        }

        # Check which articles have changed
        async with pool.acquire() as conn:
            existing = await conn.fetch(
                """
                SELECT external_id, content_hash
                FROM kb_articles
                WHERE external_id = ANY($1)
                """,
                list(hashes.keys()),
            )
        existing_map = {row["external_id"]: row["content_hash"] for row in existing}
        
        changed = [
            chunk for chunk in batch
            if hashes[chunk.external_id] != existing_map.get(chunk.external_id)
        ]
        stats["skipped"] += len(batch) - len(changed)

        if not changed:
            continue

        # Embed changed articles with retry
        embeddings = await embed_with_backoff(
            texts=[chunk.text for chunk in changed],
            client=openai_client,
            model="text-embedding-3-small",
        )

        # Normalize to unit vectors (required for cosine correctness)
        embeddings_np = np.array(embeddings, dtype=np.float32)
        norms = np.linalg.norm(embeddings_np, axis=1, keepdims=True)
        embeddings_normalized = (embeddings_np / norms).tolist()

        # Upsert (insert or update on external_id conflict)
        async with pool.acquire() as conn:
            await conn.executemany(
                """
                INSERT INTO kb_articles
                    (external_id, chunk_index, title, embedding,
                     content_hash, category, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (external_id) DO UPDATE SET
                    embedding    = EXCLUDED.embedding,
                    content_hash = EXCLUDED.content_hash,
                    updated_at   = EXCLUDED.updated_at,
                    title        = EXCLUDED.title
                """,
                [
                    (
                        chunk.external_id,
                        chunk.chunk_index,
                        chunk.title,
                        embeddings_normalized[j],
                        hashes[chunk.external_id],
                        chunk.category,
                        chunk.updated_at,
                    )
                    for j, chunk in enumerate(changed)
                ],
            )
        stats["inserted"] += len(changed)

    return stats


async def embed_with_backoff(
    texts: list[str],
    client: AsyncOpenAI,
    model: str,
    max_retries: int = 5,
) -> list[list[float]]:
    delay = 1.0
    for attempt in range(max_retries):
        try:
            response = await client.embeddings.create(
                model=model, input=texts
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(delay + (delay * 0.1 * asyncio.get_event_loop().time() % 1))
            delay = min(delay * 2, 60.0)
```

### Query Implementation

```python
async def search_kb(
    query: str,
    pool: asyncpg.Pool,
    openai_client: AsyncOpenAI,
    top_k: int = 10,
    category_filter: str | None = None,
    ef_search: int = 64,
) -> list[dict]:
    """
    Semantic search over KB articles.
    
    Returns top_k articles ranked by cosine similarity.
    Optional category filter uses Postgres WHERE clause (pre-filter).
    Category filter is safe here because categories are broad --
    each category contains > 20% of corpus, maintaining recall.
    """
    # Embed the query
    query_embeddings = await embed_with_backoff(
        texts=[query],
        client=openai_client,
        model="text-embedding-3-small",
    )
    query_vec = query_embeddings[0]
    
    # Normalize query vector
    query_np = np.array(query_vec, dtype=np.float32)
    query_normalized = (query_np / np.linalg.norm(query_np)).tolist()

    async with pool.acquire() as conn:
        # Set ef_search for this query
        await conn.execute(f"SET hnsw.ef_search = {ef_search}")
        
        if category_filter:
            results = await conn.fetch(
                """
                SELECT external_id, title, category,
                       1 - (embedding <=> $1) AS similarity
                FROM kb_articles
                WHERE category = $2
                ORDER BY embedding <=> $1
                LIMIT $3
                """,
                query_normalized,
                category_filter,
                top_k,
            )
        else:
            results = await conn.fetch(
                """
                SELECT external_id, title, category,
                       1 - (embedding <=> $1) AS similarity
                FROM kb_articles
                ORDER BY embedding <=> $1
                LIMIT $2
                """,
                query_normalized,
                top_k,
            )

    return [dict(row) for row in results]
```

### Monitoring Plan

| Metric                  | Alert Threshold     | Measurement Method                        |
|-------------------------|---------------------|-------------------------------------------|
| recall@10               | < 0.92              | Weekly eval on 500-query golden set       |
| p95 query latency       | > 100ms             | RDS Performance Insights / APM            |
| p99 query latency       | > 300ms             | RDS Performance Insights / APM            |
| Index memory usage      | > 80% shared_buffers| RDS CloudWatch FreeableMemory             |
| Ingestion error rate    | > 0.5%             | Dead-letter queue (SQS) depth             |
| Articles without vector | > 100              | Daily COUNT query vs CMS article count    |

**Recall measurement setup:**

```python
# Build golden dataset once: 500 queries with human-labeled relevant article IDs
# Run weekly as a cron job
async def measure_recall_at_k(
    golden_queries: list[GoldenQuery],
    search_fn,
    k: int = 10,
) -> float:
    hits = 0
    for gq in golden_queries:
        results = await search_fn(query=gq.query, top_k=k)
        retrieved_ids = {r["external_id"] for r in results}
        if gq.relevant_article_id in retrieved_ids:
            hits += 1
    return hits / len(golden_queries)
# Alert if result < 0.92
```

### Capacity Estimate

| Component              | Now (800K vectors) | 14 Months (1M vectors) | RDS Instance           |
|------------------------|--------------------|------------------------|------------------------|
| HNSW index + vectors   | ~5.1 GB RAM        | ~6.4 GB RAM            | db.r7g.xlarge (32 GB)  |
| Raw vector storage     | ~4.9 GB disk       | ~6.1 GB disk           | 100 GB gp3 volume      |
| Query throughput       | 200 QPS            | 300 QPS (estimated)    | Single instance + RO replica |
| Ingestion throughput   | 500/day            | 500/day                | Within API rate limits |

**Cost estimate (AWS us-east-1):**
- db.r7g.xlarge: ~$280/month reserved (1yr)
- Embedding calls: 500 articles/day × 500 tokens × $0.02/1M tokens = $0.005/day (~$0.15/month)
- Total incremental cost for vector search capability: ~$280/month

This design delivers production-grade semantic search at low operational cost by leveraging existing Postgres infrastructure. The HNSW index fits comfortably in RAM, delivers sub-40ms p95 query latency at 200 QPS, and requires no additional services to operate.
