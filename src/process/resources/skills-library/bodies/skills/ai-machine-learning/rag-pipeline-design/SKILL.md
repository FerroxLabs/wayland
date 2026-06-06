---
name: rag-pipeline-design
description: |
  Guides expert-level rag pipeline design implementation: ai-ml and database decision frameworks, production-ready patterns, and concrete templates for rag pipeline design workflows.
  Use when the user asks about rag pipeline design, rag pipeline design configuration, or ai-ml best practices for rag projects.
  Do NOT use when the user needs a different ai ml engineering capability -- check sibling skills in the ai ml engineering subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml database backend"
  category: "ai-machine-learning"
  subcategory: "ai-ml-engineering"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# RAG Pipeline Design

## When to Use

**Use this skill when:**
- The user is designing or refactoring a Retrieval-Augmented Generation (RAG) pipeline and needs architectural guidance -- including chunking strategy, embedding model selection, vector store configuration, retrieval method, and generation layer design.
- The user asks how to improve RAG quality metrics such as faithfulness, answer relevance, context precision, or context recall -- and needs concrete techniques rather than general advice.
- The user is choosing between naive RAG, advanced RAG, or modular RAG patterns and needs a decision framework based on their specific use case, data volume, and latency constraints.
- The user is moving from a prototype RAG system to a production deployment and needs guidance on observability, evaluation frameworks, cost management, and reliability patterns.
- The user is debugging RAG failure modes -- hallucination, retrieval misses, context window overflow, answer drift, or latency spikes -- and needs root-cause analysis patterns.
- The user needs to design a RAG pipeline for a specialized domain (legal, medical, financial, code) with unique chunking, metadata, and retrieval requirements.
- The user is selecting between retrieval strategies: dense retrieval, sparse retrieval (BM25), hybrid retrieval, or graph-based retrieval -- and needs trade-off analysis grounded in their query patterns and data characteristics.

**Do NOT use this skill when:**
- The user needs to fine-tune a language model on domain data -- this is a separate skill covering supervised fine-tuning, LoRA, and RLHF workflows.
- The user is asking about prompt engineering in isolation without a retrieval component -- use the prompt engineering skill.
- The user needs an agent design with tool use, planning loops, or multi-agent orchestration -- use the AI agent architecture skill even if retrieval is one tool in the agent.
- The user is asking about vector database operations in isolation (schema design, indexing, scaling) without a RAG context -- use the vector database skill.
- The user needs a recommendation system or semantic search product without a generative output layer -- use the semantic search design skill.
- The user is asking about embedding model training or fine-tuning -- use the embedding model fine-tuning skill.
- The user needs general LLM API integration without a retrieval component -- use the LLM API integration skill.

---

## Process

### Step 1: Define the RAG Problem Precisely

Before touching any code or infrastructure, establish the precise problem definition. Ambiguity at this stage causes expensive rework.

- **Identify the query type distribution:** Single-hop factual questions (e.g., "What is the refund policy?") require simple similarity retrieval. Multi-hop reasoning questions (e.g., "How does policy X interact with clause Y in contract Z?") require multi-document retrieval or knowledge graph augmentation. Mixed query distributions require hybrid architecture.
- **Define the document corpus characteristics:** Measure total corpus size in tokens (not just documents). A corpus below 1M tokens fits in a long-context LLM window and may not need retrieval at all. Between 1M and 100M tokens, dense vector retrieval is appropriate. Above 100M tokens, hierarchical or tiered retrieval is required.
- **Establish quality requirements using four RAGAS metrics as anchors:** Faithfulness (answer grounded in retrieved context, target ≥ 0.85), Answer Relevance (answer addresses the question, target ≥ 0.80), Context Precision (retrieved chunks are relevant, target ≥ 0.75), Context Recall (all relevant information was retrieved, target ≥ 0.70). Document these targets before building.
- **Assess latency and throughput requirements:** Conversational interfaces typically require end-to-end latency ≤ 3 seconds at the 95th percentile. Batch processing pipelines tolerate 10--60 seconds. Specify peak QPS requirements because vector retrieval, LLM generation, and reranking each contribute latency that must be summed.
- **Identify data sensitivity and compliance constraints:** Determine whether documents contain PII, PHI, or classified information. This affects whether embeddings can be computed via external API or must use on-premise models. It also affects logging strategy -- you may need to hash or truncate logged inputs.

---

### Step 2: Select the RAG Architecture Pattern

Choose among the three major RAG patterns based on the outputs of Step 1.

- **Naive RAG:** Fixed-size chunking → single embedding model → top-k cosine similarity retrieval → stuff-into-prompt → generate. Use this only for prototypes, internal tools with forgiving quality requirements, or corpora under 10K chunks. Its retrieval precision degrades rapidly with noisy corpora and complex queries.
- **Advanced RAG:** Extends naive RAG with pre-retrieval query transformation (HyDE, step-back prompting, query decomposition), retrieval-time reranking (cross-encoder or LLM-based), and post-retrieval context compression. Use this for production systems requiring faithfulness ≥ 0.85 and context precision ≥ 0.75. This pattern handles 80% of production RAG use cases effectively.
- **Modular RAG:** Treats each pipeline stage as a swappable module with defined interfaces. Supports routing (different retrieval strategies for different query types), fusion (combining multiple retrieval sources), and adaptive retrieval (deciding whether retrieval is needed at all). Use this when query distributions are heterogeneous, when multiple knowledge sources must be combined, or when the pipeline must evolve rapidly without global rewrites.
- **Graph RAG:** Augments vector retrieval with a knowledge graph to answer multi-hop and relational questions. Requires significant upfront entity extraction and graph construction cost. Use only when the domain has rich relational structure (e.g., regulatory documents, codebases, biomedical literature) and multi-hop queries constitute more than 20% of traffic.
- **Apply this decision rule:** Start with Advanced RAG unless your Step 1 analysis reveals explicit requirements that only Modular or Graph RAG can satisfy. Avoid over-engineering the architecture before you have production query data to justify the complexity.

---

### Step 3: Design the Ingestion Pipeline

The ingestion pipeline determines the maximum quality ceiling of retrieval. Poor ingestion cannot be compensated by better retrieval or generation.

- **Parse documents with format awareness:** PDFs require layout-aware parsing to handle tables, headers, and multi-column text. Use libraries that preserve document structure rather than naive text extraction, which loses formatting semantics. HTML documents should have boilerplate stripped (navigation, footers, ads) before chunking. Code files should be parsed at the AST level, splitting on function and class boundaries rather than character count.
- **Apply chunking strategy based on document type:**
  - **Fixed-size with overlap:** Chunk size 512 tokens, overlap 64 tokens. Use for prose documents with uniform information density. Simple, fast, and surprisingly effective for single-hop queries.
  - **Semantic chunking:** Split on sentence or paragraph boundaries detected by sentence embedding similarity drops. More expensive to compute but produces more coherent chunks. Effective for heterogeneous documents.
  - **Hierarchical chunking (parent-child):** Store large parent chunks (1024--2048 tokens) linked to small child chunks (128--256 tokens). Embed the child chunks for precise retrieval but return the parent chunk as context to the LLM. This solves the precision-context completeness trade-off.
  - **Proposition chunking:** Extract atomic factual propositions from each document segment and embed each proposition independently. Highest retrieval precision but 5--10x ingestion compute cost. Justified for high-stakes applications like medical or legal QA.
- **Enrich chunks with metadata at ingestion time:** Document source, section title, page number, creation date, document type, author, and custom domain tags (e.g., product SKU, regulatory jurisdiction). Metadata enables filtered retrieval that dramatically improves precision without retrieval complexity.
- **Choose embedding model with benchmarks, not marketing:** On the MTEB leaderboard, compare models on the specific task categories that match your use case (retrieval, clustering, classification). Multilingual corpora require a multilingual embedding model -- English-only models produce near-random embeddings for other languages. Embedding dimension affects vector store cost: 1536-dimension embeddings cost roughly 3x more storage than 512-dimension embeddings at the same corpus size. Use the smallest model that meets your quality threshold.
- **Implement idempotent ingestion with content hashing:** Compute a SHA-256 hash of each document's content before ingestion. Store the hash as metadata. On re-ingestion, skip documents whose hash has not changed. This prevents duplicate embeddings and makes incremental ingestion reliable.

---

### Step 4: Configure the Vector Store and Indexing

Vector store configuration directly determines retrieval latency and recall at scale.

- **Select the indexing algorithm based on corpus size and latency requirements:**
  - **Flat (exact) index:** Exhaustive cosine similarity over all vectors. Only viable below 100K vectors because latency scales linearly. Use for development and small corpora where recall must be 100%.
  - **HNSW (Hierarchical Navigable Small World):** Graph-based approximate nearest neighbor with excellent recall (typically 95--99%) and sub-millisecond retrieval at millions of vectors. Configure `M` (connections per node, default 16, increase to 32--64 for higher recall at memory cost) and `ef_construction` (build-time quality, default 200, increase to 400 for higher recall). At query time, `ef` controls the recall-latency trade-off: start at 100 and tune with benchmarks.
  - **IVF (Inverted File Index):** Clusters vectors into `nlist` Voronoi cells. Query searches only `nprobe` cells. Faster than HNSW at very large scale (100M+ vectors) but lower recall. Tune `nlist` to `sqrt(corpus_size)` and `nprobe` to 10--20% of `nlist` as a starting point.
- **Implement hybrid retrieval when query vocabulary is unpredictable:** Combine dense retrieval (vector similarity) with sparse retrieval (BM25 keyword matching) using Reciprocal Rank Fusion (RRF). The RRF formula weights results from each retrieval method: `score = sum(1 / (k + rank))` where k=60 is the standard constant. Hybrid retrieval consistently outperforms pure dense retrieval by 5--15% on context recall in benchmarks, especially for queries containing rare proper nouns, product codes, or technical identifiers.
- **Design metadata filtering to reduce retrieval search space:** Apply pre-filters (reducing the candidate set before vector search) for high-cardinality filters like date ranges and document type. Apply post-filters only when pre-filtering is not supported by your vector store. Pre-filtering is dramatically faster because it reduces the ANN search space.
- **Set retrieval top-k based on expected document redundancy:** For a focused corpus with low redundancy, top-k=5 is usually sufficient. For noisy or broad corpora, top-k=10--20 with subsequent reranking is better. Never pass all top-k results directly to the LLM without context window accounting: 10 chunks at 512 tokens each consumes 5120 tokens, leaving limited room for the prompt and response.

---

### Step 5: Design the Query Processing Layer

The query processing layer transforms raw user input into retrieval-optimized queries and is the highest-leverage improvement available after the indexing strategy is set.

- **Implement query classification to route queries appropriately:** A lightweight classifier (even a single LLM call with few-shot examples) can distinguish between factual lookup, comparison, procedural, and analytical queries. Different query types benefit from different retrieval strategies. Factual queries benefit from BM25 + dense hybrid. Comparison queries need multi-document retrieval with explicit entity linking. Procedural queries need ordered retrieval with step-continuity awareness.
- **Apply HyDE (Hypothetical Document Embeddings) for recall improvement:** Instead of embedding the raw query (which may be short and ambiguous), prompt an LLM to generate a hypothetical document that would answer the query. Embed the hypothetical document and use it for retrieval. This technique improves context recall by 10--20% on average because hypothetical documents occupy the same vector space as real documents. Cost: one additional LLM call per query.
- **Apply query decomposition for multi-hop questions:** Detect complex multi-part questions and decompose them into sub-questions using an LLM. Retrieve independently for each sub-question, then synthesize. The decomposition prompt must explicitly instruct the LLM to generate self-contained sub-questions -- each sub-question must be answerable without reference to the others.
- **Apply step-back prompting for abstract or ambiguous queries:** When a query is too specific to retrieve useful context (e.g., "What was the LIBOR rate on 2019-03-14?"), prompt the LLM to generate a more general question (e.g., "How is LIBOR determined and where is it published?") and retrieve for the generalized version. This recovers context that answers the specific question through general knowledge.
- **Implement query expansion with synonyms and acronyms for technical domains:** For corpora with dense jargon (medical, legal, engineering), build a domain-specific synonym map and expand queries at retrieval time. "MI" should expand to "myocardial infarction" and vice versa. This simple technique prevents precision failures from terminology variation.

---

### Step 6: Design the Reranking and Context Assembly Layer

Reranking converts high-recall retrieval results into high-precision context for the generation layer.

- **Apply a cross-encoder reranker as the primary quality lever:** Cross-encoders jointly encode the query and each candidate chunk, producing a relevance score that is dramatically more accurate than bi-encoder cosine similarity. Retrieve top-20 with the vector store, then rerank to top-5 with a cross-encoder. This two-stage approach is faster than direct cross-encoder search over the full corpus and produces better precision than pure vector retrieval.
- **Use LLM-based reranking (RankGPT) when cross-encoder models are unavailable or insufficient:** Prompt an LLM with a listwise ranking instruction, providing the query and a list of candidate passages. Instruct it to output a ranked permutation. More expensive than cross-encoder reranking (adds 500--1500 tokens per reranking call) but can leverage domain knowledge not encoded in a general cross-encoder model.
- **Apply context compression to reduce noise before generation:** After reranking, use an extractive compression step to remove sentences from each chunk that are irrelevant to the query. This reduces the total context tokens by 30--60% while preserving answer-relevant content, allowing more chunks to fit in the context window.
- **Implement lost-in-the-middle mitigation in context assembly:** Research demonstrates that LLMs disproportionately attend to the beginning and end of long contexts, with performance degrading for information placed in the middle. Assemble context by placing the highest-relevance chunk first, then lowest-relevance chunks, then second-highest-relevance -- this maximizes the probability that the LLM attends to the most relevant information.
- **Deduplicate retrieved chunks before assembly:** When using hybrid retrieval or query decomposition, the same chunk may be retrieved multiple times. Deduplicate by chunk ID before assembly to prevent redundant context consumption.

---

### Step 7: Design the Generation Layer

The generation layer transforms retrieved context into a final answer with appropriate quality controls.

- **Write the RAG system prompt with explicit grounding instructions:** The system prompt must instruct the LLM to answer only from provided context, to state when context is insufficient rather than speculating, and to cite specific source chunks. Grounding instructions reduce hallucination rates by 30--50% compared to a generic assistant prompt.
- **Implement structured output for downstream reliability:** When the RAG pipeline feeds downstream systems, use JSON output with explicit fields for answer, confidence, sources cited, and a flag for "answer not in context." This makes hallucination detection and filtering programmatic rather than requiring LLM judgment on each response.
- **Apply self-consistency sampling for high-stakes generation:** Sample 3--5 generations at temperature 0.3--0.5, then select the most consistent answer using majority voting or embedding similarity clustering. This reduces variance in factual accuracy by 15--25% at the cost of 3--5x generation tokens.
- **Implement citation verification as a post-generation step:** After generation, verify that each cited sentence can be found in (or paraphrased from) a retrieved chunk using substring matching or high-cosine-similarity sentence embedding comparison. Flag responses where citations cannot be verified. This automated faithfulness check catches hallucinations before they reach users.
- **Design the fallback strategy explicitly:** Define the response when retrieval returns zero relevant chunks (score below threshold), when the LLM returns a refusal, and when generation latency exceeds the SLA. Common patterns: return a "no relevant information found" response with escalation path, fall back to a cached answer for common queries, or route to a human agent.

---

### Step 8: Build the Evaluation and Observability Layer

A RAG pipeline without systematic evaluation is unmaintainable. Build evaluation infrastructure before going to production.

- **Implement RAGAS automated evaluation pipeline:** Set up RAGAS (or equivalent) to evaluate a representative sample of production queries weekly. Track the four core metrics over time: Faithfulness, Answer Relevance, Context Precision, Context Recall. Set threshold alerts at 10% degradation from baseline. Degradation in Context Recall indicates chunking or indexing drift. Degradation in Faithfulness indicates generation layer regression.
- **Create a golden dataset of 100--500 curated QA pairs:** Cover the full distribution of query types, difficulty levels, and edge cases. Use this dataset for regression testing on every pipeline change. Golden dataset maintenance is a continuous responsibility -- add examples from production failures at least monthly.
- **Log all pipeline stages with structured spans:** Log query, retrieved chunks (with scores), reranked chunks, generated answer, total latency, per-stage latency, total tokens consumed, and estimated cost per request. Store logs in a queryable system. These logs are the primary debugging tool for production failures and the primary data source for pipeline improvement.
- **Implement retrieval quality monitoring:** Track retrieval score distributions over time. A shift in the distribution of top-1 retrieval scores indicates corpus drift, index corruption, or query distribution shift. Alert when the median top-1 retrieval score drops below 0.70 (for cosine similarity on normalized embeddings).
- **Build a human evaluation workflow for 1--2% of production traffic:** Manual review of a random sample catches failure modes that automated metrics miss. Use a structured rubric: groundedness (1--5), relevance (1--5), completeness (1--5), and citation accuracy (pass/fail). Aggregate scores weekly.

---

## Output Format

Produce the following artifacts when designing a RAG pipeline:

### RAG Pipeline Architecture Summary

```
Pipeline Name:        [Name]
Pattern:              [Naive | Advanced | Modular | Graph]
Corpus Size:          [estimated tokens and document count]
Query Types:          [factual | multi-hop | comparison | procedural -- with % distribution]
Latency SLA:          [p95 end-to-end latency target in seconds]
Quality Targets:      Faithfulness ≥ [X], Answer Relevance ≥ [X],
                      Context Precision ≥ [X], Context Recall ≥ [X]
```

### Component Configuration Table

| Stage | Component | Configuration | Rationale |
|---|---|---|---|
| Parsing | [Parser] | [format-aware settings] | [why this parser for this data] |
| Chunking | [Strategy] | size=[tokens], overlap=[tokens] | [why this strategy] |
| Embedding | [Model] | dim=[N], batch=[N] | [benchmark justification] |
| Vector Store | [Store] | index=[HNSW/IVF], M=[N], ef=[N] | [scale and latency justification] |
| Retrieval | [Dense/Sparse/Hybrid] | top-k=[N], alpha=[N for hybrid] | [query type justification] |
| Query Transform | [HyDE/Decomp/None] | [config] | [query pattern justification] |
| Reranking | [Cross-encoder/LLM/None] | top-n=[N] | [precision requirement] |
| Generation | [LLM] | temp=[N], max_tokens=[N] | [task justification] |

### System Architecture Diagram

```
User Query
    |
    v
[Query Classifier] --(route)--> [Query Transformer]
                                    |
                        +-----------+-----------+
                        |                       |
                [Dense Retriever]       [Sparse Retriever]
                  (vector store)           (BM25 index)
                        |                       |
                        +------[RRF Fusion]-----+
                                    |
                            [Cross-Encoder Reranker]
                                    |
                          [Context Compressor]
                                    |
                         [Context Assembler]
                          (lost-in-middle fix)
                                    |
                         [Generation LLM]
                          + system prompt
                          + grounding instructions
                                    |
                        [Citation Verifier]
                                    |
                            Final Answer
                                    |
                     [Evaluation Logger] --> RAGAS pipeline
```

### Ingestion Pipeline Diagram

```
Raw Documents (PDF/HTML/DOCX/Code)
    |
[Format-Aware Parser]
    |
[Boilerplate Stripper / Structure Extractor]
    |
[Chunker] --> [Metadata Enricher]
    |                |
    +----------------+
    |
[Content Hash Deduplicator]
    |
[Embedding Model] (batched, async)
    |
[Vector Store Upsert] + [BM25 Index Update]
    |
[Ingestion Audit Log]
```

### Python Component Template

```python
# rag_pipeline.py
# Production RAG Pipeline -- Advanced Pattern

import hashlib
from dataclasses import dataclass
from typing import Optional

@dataclass
class RAGConfig:
    # Chunking
    chunk_size_tokens: int = 512
    chunk_overlap_tokens: int = 64
    chunking_strategy: str = "semantic"  # fixed | semantic | hierarchical | proposition

    # Retrieval
    dense_top_k: int = 20
    sparse_top_k: int = 20
    rerank_top_n: int = 5
    retrieval_mode: str = "hybrid"  # dense | sparse | hybrid
    hybrid_alpha: float = 0.7  # weight for dense vs sparse (0=pure sparse, 1=pure dense)
    min_retrieval_score: float = 0.60  # below this, treat as no relevant results

    # Generation
    llm_temperature: float = 0.1
    max_context_tokens: int = 4096
    max_generation_tokens: int = 1024
    enable_citation_verification: bool = True
    enable_self_consistency: bool = False
    self_consistency_samples: int = 3

    # Evaluation
    enable_ragas_logging: bool = True
    sample_rate_for_human_eval: float = 0.02


@dataclass
class RetrievedChunk:
    chunk_id: str
    content: str
    source_document: str
    section_title: Optional[str]
    page_number: Optional[int]
    dense_score: Optional[float]
    sparse_score: Optional[float]
    rerank_score: Optional[float]
    metadata: dict


@dataclass
class RAGResponse:
    answer: str
    sources: list[RetrievedChunk]
    answer_in_context: bool  # False triggers fallback UX
    citation_verified: bool
    latency_ms: dict  # stage-by-stage breakdown
    token_usage: dict
    ragas_log_id: Optional[str]


class RAGPipeline:
    """
    Advanced RAG pipeline with hybrid retrieval, cross-encoder reranking,
    context compression, and citation verification.

    Configuration is fully injectable for A/B testing and gradual rollout.
    All stages emit structured logs for RAGAS evaluation and cost tracking.
    """

    def __init__(self, config: RAGConfig) -> None:
        self.config = config
        self._init_components()

    def _init_components(self) -> None:
        # Initialize each stage independently for testability
        self.query_classifier = self._build_query_classifier()
        self.query_transformer = self._build_query_transformer()
        self.dense_retriever = self._build_dense_retriever()
        self.sparse_retriever = self._build_sparse_retriever()
        self.reranker = self._build_reranker()
        self.context_compressor = self._build_context_compressor()
        self.generator = self._build_generator()
        self.citation_verifier = self._build_citation_verifier()

    async def query(self, user_query: str, filters: Optional[dict] = None) -> RAGResponse:
        """
        End-to-end RAG query with full stage telemetry.
        filters: optional metadata pre-filter dict, e.g. {"doc_type": "policy", "year": 2023}
        """
        # Stage 1: Query classification and transformation
        query_type = await self.query_classifier.classify(user_query)
        transformed_queries = await self.query_transformer.transform(user_query, query_type)

        # Stage 2: Hybrid retrieval across all transformed queries
        dense_results = await self.dense_retriever.retrieve(
            transformed_queries, top_k=self.config.dense_top_k, filters=filters
        )
        sparse_results = await self.sparse_retriever.retrieve(
            transformed_queries, top_k=self.config.sparse_top_k, filters=filters
        )
        fused_results = self._reciprocal_rank_fusion(
            dense_results, sparse_results, alpha=self.config.hybrid_alpha
        )

        # Stage 3: Reranking and context assembly
        reranked = await self.reranker.rerank(
            user_query, fused_results, top_n=self.config.rerank_top_n
        )
        compressed = await self.context_compressor.compress(user_query, reranked)
        context = self._assemble_context_lost_in_middle(compressed)

        # Stage 4: Generation with grounding
        if not reranked or reranked[0].rerank_score < self.config.min_retrieval_score:
            return self._no_context_fallback(user_query)

        response = await self.generator.generate(user_query, context)

        # Stage 5: Citation verification
        if self.config.enable_citation_verification:
            verified = await self.citation_verifier.verify(response, reranked)
        else:
            verified = True

        return RAGResponse(
            answer=response.text,
            sources=reranked,
            answer_in_context=True,
            citation_verified=verified,
            latency_ms=self._collect_latencies(),
            token_usage=self._collect_token_usage(),
            ragas_log_id=self._emit_ragas_log(user_query, context, response),
        )

    def _reciprocal_rank_fusion(self, dense, sparse, alpha: float, k: int = 60) -> list:
        """
        Combine dense and sparse results using weighted RRF.
        alpha=1.0 is pure dense, alpha=0.0 is pure sparse.
        k=60 is the standard RRF constant that prevents top-rank domination.
        """
        scores = {}
        for rank, chunk in enumerate(dense):
            scores[chunk.chunk_id] = scores.get(chunk.chunk_id, 0) + alpha * (1 / (k + rank + 1))
        for rank, chunk in enumerate(sparse):
            scores[chunk.chunk_id] = scores.get(chunk.chunk_id, 0) + (1 - alpha) * (1 / (k + rank + 1))
        sorted_ids = sorted(scores, key=lambda x: scores[x], reverse=True)
        chunk_map = {c.chunk_id: c for c in dense + sparse}
        return [chunk_map[cid] for cid in sorted_ids if cid in chunk_map]

    def _assemble_context_lost_in_middle(self, chunks: list) -> str:
        """
        Assemble context with lost-in-the-middle mitigation.
        Place highest-relevance chunk first, then lowest-relevance chunks in the middle,
        then second-highest at the end.
        """
        if not chunks:
            return ""
        if len(chunks) == 1:
            return chunks[0].content
        reordered = [chunks[0]] + chunks[2:] + [chunks[1]]
        return "\n\n---\n\n".join(
            f"[Source: {c.source_document}, Section: {c.section_title}]\n{c.content}"
            for c in reordered
        )
```

### Evaluation Dashboard Schema

```
Weekly RAGAS Report
====================
Date Range:        [YYYY-MM-DD to YYYY-MM-DD]
Total Queries:     [N]
Sampled:           [N] ([X]%)

Core Metrics (automated):
  Faithfulness:         [X.XX]  (target ≥ 0.85)  [PASS/WARN/FAIL]
  Answer Relevance:     [X.XX]  (target ≥ 0.80)  [PASS/WARN/FAIL]
  Context Precision:    [X.XX]  (target ≥ 0.75)  [PASS/WARN/FAIL]
  Context Recall:       [X.XX]  (target ≥ 0.70)  [PASS/WARN/FAIL]

Latency (p50 / p95 / p99):
  Total:                [Xs] / [Xs] / [Xs]
  Retrieval:            [Xs] / [Xs] / [Xs]
  Reranking:            [Xs] / [Xs] / [Xs]
  Generation:           [Xs] / [Xs] / [Xs]

Cost:
  Avg tokens/query:     [N] (prompt: [N], completion: [N])
  Avg cost/query:       $[X.XXXX]
  Projected monthly:    $[X]

Top Failure Modes:
  No-context fallback rate:    [X]%
  Citation verification fail:  [X]%
  Rerank score below threshold: [X]%
```

---

## Rules

1. **NEVER chunk before cleaning.** Boilerplate, headers, footers, navigation elements, and watermarks in document text corrupt chunk quality. Parser output must be cleaned before chunking. A single uncleaned document can produce dozens of low-quality chunks that degrade retrieval precision across all queries.

2. **NEVER choose an embedding model without checking its max sequence length against your chunk size.** If chunks exceed the embedding model's max token limit (commonly 512 tokens for older models), content is silently truncated. Use models with max sequence length ≥ 1.5x your target chunk size to provide headroom.

3. **ALWAYS compute retrieval quality metrics separately from generation quality metrics.** Debugging a RAG pipeline requires knowing whether failures originate in retrieval or generation. Combine RAGAS Context Precision and Recall for retrieval evaluation and Faithfulness for generation. A Faithfulness failure with high Context Precision indicates a generation problem. A Context Recall failure indicates a retrieval or chunking problem.

4. **NEVER pass more tokens to the generation LLM than the context window allows minus prompt overhead minus expected output tokens.** Calculate: `usable_context = context_window - system_prompt_tokens - query_tokens - max_output_tokens - safety_buffer(200)`. Exceeding this silently truncates context or throws errors depending on the API.

5. **ALWAYS store the original document alongside chunks and embeddings.** Retrieval pipelines require frequent re-ingestion as chunking strategies, embedding models, or metadata schemas evolve. Without the original documents, re-ingestion requires re-crawling the source system, which is often unavailable or slow. Store raw source documents in object storage (S3-compatible) with the same document ID used in the vector store.

6. **NEVER use the same embedding model for queries and documents without verifying the model was trained for asymmetric retrieval.** Some embedding models are trained symmetrically (query and document are the same type). For asymmetric retrieval (short query, long document), use models explicitly trained for that setting or use a query prefix instruction to signal the query role.

7. **ALWAYS set a minimum retrieval score threshold and define explicit behavior when no chunks exceed it.** A RAG pipeline without a fallback for zero-recall queries will hallucinate when forced to answer from empty context. Define the fallback: "I don't have relevant information about this topic" with an optional escalation path.

8. **NEVER deploy a RAG pipeline to production without a golden dataset of at least 100 QA pairs for regression testing.** Without a golden dataset, pipeline changes (new embedding model, different chunk size, updated prompts) cannot be validated. Every architecture change must be evaluated against the golden dataset before deployment.

9. **NEVER hard-code retrieval top-k without accounting for downstream context window constraints.** `top_k=10` with 512-token chunks consumes 5,120 tokens of context before the prompt and query. Calculate the maximum feasible top-k for your chunk size and context window, then tune down from there based on quality measurements.

10. **ALWAYS version your embedding model and vector store index together.** Embeddings from different model versions are geometrically incompatible -- mixing them in the same index produces silently degraded retrieval. When upgrading the embedding model, create a new index namespace, re-embed all documents, validate quality on the golden dataset, then swap traffic atomically. Never incrementally update a single index with embeddings from two different model versions.

---

## Edge Cases

### Legacy Document Corpus with Mixed Quality

Enterprise corpora frequently contain scanned PDFs (requiring OCR), HTML with heavy boilerplate, Word documents with revision history, and PowerPoint slides with minimal text. Each format requires a different parsing strategy.

- Detect document type programmatically by MIME type and file extension before dispatching to the appropriate parser.
- For OCR'd PDFs, apply confidence score filtering -- discard text regions with OCR confidence below 80% because they introduce character-level noise that corrupts embedding quality.
- Apply a quality scoring heuristic after parsing: chunks with token density below 0.3 (mostly whitespace and special characters), fewer than 20 tokens, or more than 30% numeric content (tables, code fragments mistakenly included in prose chunks) should be flagged for human review or discarded.
- Maintain a parsing failure log with document ID, format, and failure reason. Parse failures are silent quality killers in RAG pipelines.

### Corpus Updates and Stale Retrieval

When the source corpus is updated frequently (e.g., a knowledge base with daily edits, a documentation site with frequent releases), stale chunks produce confidently wrong answers that are worse than no-answer fallbacks.

- Implement a document-level freshness timestamp in metadata. Apply a recency decay factor in retrieval scoring for time-sensitive domains: `adjusted_score = retrieval_score * (1 - decay_rate * days_since_update)`.
- Build webhook or polling-based triggers to re-ingest updated documents within a defined SLA (e.g., within 1 hour for customer-facing knowledge bases, within 24 hours for internal documentation).
- Use content hashing (SHA-256) to detect changed documents without requiring the source system to provide change notifications. Maintain a content hash registry and compare on each ingestion cycle.
- For deleted documents, implement soft deletion in the vector store: mark chunks as inactive rather than deleting them immediately, allowing rollback if the deletion was erroneous. Permanently delete after a 7-day grace period.

### Multi-Language Corpus

RAG pipelines built with English-only embedding models fail silently on non-English queries and documents -- they produce embeddings in the same space but with dramatically reduced semantic accuracy.

- Detect the language of documents at ingestion time and queries at runtime. Log language distribution to understand multilingual query patterns.
- For corpora with 2+ languages each representing more than 10% of documents, use a multilingual embedding model throughout. Do not mix English and multilingual embeddings in the same index.
- For corpora with a dominant language and occasional minority-language documents, consider a translate-then-embed approach for minority-language content. This reduces retrieval quality loss at the cost of translation compute.
- For queries in a minority language, implement query translation to the dominant corpus language before retrieval if the embedding model does not support the query language. Always return the answer in the original query language.

### Very Long Documents (Books, Legal Agreements, Research Reports)

Documents exceeding 100 pages produce hundreds of chunks that may all have moderate similarity to a given query, exhausting the context window and diluting the truly relevant content.

- Apply hierarchical summarization at ingestion: generate a document-level summary and section-level summaries using an LLM. Embed these summaries as high-level chunks alongside the fine-grained content chunks.
- At retrieval time, first retrieve at the summary level to identify relevant sections, then retrieve fine-grained chunks only from the identified sections. This two-stage retrieval reduces noise dramatically.
- For legal documents, split at structural boundaries (clauses, sections, articles, schedules) rather than by character count. Legal meaning is structurally scoped -- cross-clause chunking severs the interpretive context.
- For research papers, apply domain-specific section awareness: abstract, introduction, methods, results, and discussion have distinct retrieval profiles. Tag each chunk with its section type and use section-type metadata filtering to prefer results sections for quantitative queries and methods sections for procedural queries.

### Adversarial and Off-Topic Queries

Production RAG systems receive queries that are unrelated to the corpus, attempts to extract sensitive information from source documents, or prompt injection attempts embedded in user input.

- Implement query intent classification as the first pipeline stage. Route queries below a relevance threshold (using the query's embedding similarity to a corpus centroid) directly to the no-context fallback without consuming retrieval and generation compute.
- Sanitize user queries before injecting them into prompts. Strip markdown formatting, code blocks, and instruction-like patterns that could override the system prompt.
- If the corpus contains sensitive documents (personnel files, financial records, unreleased product information), implement document-level access control by storing user permission scopes in metadata and applying them as mandatory pre-filters. Retrieval must enforce access control -- never rely solely on the generation layer to redact sensitive information.
- Log all queries that trigger the no-context fallback or low-retrieval-score condition. High rates of these events indicate either an off-topic user population or a corpus gap that should be addressed by content addition.

### Context Window Exhaustion at High top-k

When retrieval returns many large chunks and the context window is limited (e.g., using a 4K-context model for cost reasons), context assembly must be precise.

- Calculate maximum context budget before retrieval: `max_context_tokens = model_context_window - system_prompt_tokens - query_tokens - max_output_tokens - 200_token_buffer`.
- Implement a greedy context packer: sort reranked chunks by rerank score descending, then add chunks to the context in order, stopping when adding the next chunk would exceed the budget. This guarantees the highest-relevance content is always included.
- Apply sentence-level context compression before packing: extract only the sentences from each chunk that are most relevant to the query using extractive summarization. This increases effective chunk density by 40--60%, allowing more distinct chunks to fit in the context window.
- Never split a chunk mid-sentence during context assembly. If a chunk does not fit entirely, skip it rather than truncating. Truncated chunks often omit the most relevant sentence, which tends to be a concluding statement.

### Evaluation Metric Paradoxes

RAGAS metrics can produce misleading signals if interpreted without domain context.

- High Context Precision with low Context Recall indicates over-conservative retrieval (you retrieved relevant chunks but missed many others). Solution: increase top-k and tune retrieval thresholds.
- High Context Recall with low Context Precision indicates over-broad retrieval (you retrieved everything relevant plus a lot of noise). Solution: add reranking or tighten metadata filters.
- High Faithfulness with low Answer Relevance indicates the LLM is accurately paraphrasing context that does not actually answer the user's question -- a retrieval failure presenting as a generation success. This is the most deceptive failure mode in RAG evaluation.
- Do not rely solely on LLM-as-judge evaluators for Faithfulness. LLM judges have known failure modes including position bias (favoring longer answers) and verbosity bias (favoring confident-sounding language). Cross-validate LLM-judge scores with NLI-based faithfulness models for a sample of responses.

---

## Example

**Input:** "We're building a RAG pipeline for a legal tech startup. Our corpus is 50,000 legal contracts (PDFs, average 30 pages each), primarily US commercial contracts in English. Users are lawyers asking detailed contract review questions like 'Does this agreement contain a limitation of liability clause? What are the caps?' We need sub-3-second p95 latency, high faithfulness, and the pipeline must go to production in 8 weeks. What architecture should we use?"

---

**Output:**

### Problem Analysis

This is a well-defined Advanced RAG use case with several domain-specific requirements that drive concrete decisions:

- **Corpus size:** 50,000 contracts × 30 pages × ~500 tokens/page ≈ 750M tokens. This far exceeds any context window and requires vector retrieval. At expected average chunk size (512 tokens with semantic boundaries), the corpus produces approximately 1.5M chunks.
- **Query type:** Primarily factual lookup and clause identification -- single-hop in most cases ("Does clause X exist and what does it say?") with occasional comparative queries ("How does the limitation of liability compare to standard market terms?"). Standard advanced RAG handles this well without graph augmentation.
- **Domain:** Legal contracts have extremely consistent structure (recitals, definitions, operative clauses, boilerplate schedules) but highly variable clause language. Chunking at structural boundaries (clause level) is essential. Character-boundary chunking would sever clauses and destroy interpretive context.
- **Latency:** Sub-3-second p95 requires careful stage budgeting. Target: parsing/caching 0ms (pre-ingested), query transform 200ms, retrieval 300ms, reranking 400ms, generation 1800ms, overhead 300ms. Total: 3000ms. This is tight and requires reranker optimization.

---

### Recommended Architecture: Advanced RAG with Clause-Aware Chunking

**Pattern:** Advanced RAG  
**Query Type Distribution:** ~70% clause lookup, ~20% clause interpretation, ~10% comparison  
**Latency Budget:** 3000ms p95 end-to-end  
**Quality Targets:** Faithfulness ≥ 0.88, Answer Relevance ≥ 0.82, Context Precision ≥ 0.80, Context Recall ≥ 0.75

---

### Component Configuration

| Stage | Component | Configuration | Rationale |
|---|---|---|---|
| Parsing | Layout-aware PDF parser | Structure extraction enabled, TOC extraction, clause boundary detection | Legal PDFs have dense two-column layouts and section hierarchies that naive parsers flatten, destroying clause structure |
| Chunking | Hierarchical clause-aware | Parent: contract section (1024 tokens), Child: individual clause (256--512 tokens), overlap: 0 (clause boundaries are hard) | Legal meaning is clause-scoped. Overlapping clause text creates ambiguous attributions. Parent-child allows precise retrieval with full-context generation |
| Embedding | Legal-domain embedding model | 768-dimension, max 512 tokens, asymmetric retrieval trained | Legal language has a distinct vocabulary distribution. A general-purpose embedding model underperforms on legal terminology and clause-type classification |
| Vector Store | HNSW index | M=32, ef_construction=400, ef_query=150 | 1.5M vectors requires ANN. M=32 provides higher recall than default M=16. At 1.5M vectors, HNSW retrieval latency is ~15--40ms, within latency budget |
| Retrieval | Hybrid (dense + BM25) | dense top-k=20, sparse top-k=20, hybrid_alpha=0.6 (slightly dense-weighted), RRF k=60 | Contract queries frequently contain specific legal phrases ("limitation of liability," "indemnification," "force majeure") that are high-precision BM25 targets. Hybrid captures both semantic and keyword signals |
| Query Transform | None for clause lookup; HyDE for interpretation queries | Query classifier routes interpretation queries through HyDE | Clause lookup queries are precise -- transformation degrades them. Interpretation queries are abstract -- HyDE improves recall significantly |
| Reranking | Cross-encoder | top-n=5, legal domain cross-encoder preferred | Cross-encoder reranking is the highest single-stage quality improvement available. Latency budget: 400ms for reranking 40 candidate chunks. Use a distilled model for speed |
| Context Assembly | Lost-in-middle mitigation + deduplication | Assemble up to 3500 context tokens using greedy packer | Clause answers are typically short. 3500 context tokens accommodates 5--7 full clauses with attribution headers |
| Generation | LLM with legal grounding prompt | temperature=0.0, max_tokens=800, structured JSON output | Legal answers require high determinism. JSON output with `clause_found` boolean, `clause_text` extraction, `interpretation`, and `source_section` fields enables downstream citation display |
| Citation Verification | NLI-based verifier | Verify each claim in the answer against retrieved chunks | Legal accuracy is non-negotiable. NLI verification catches generation-level hallucination. Flag unverified answers for human review |

---

### Ingestion Pipeline -- Legal Contract Specific

**Clause boundary detection strategy:**

Legal contracts have a consistent heading pattern: numbered clauses (`1.`, `2.`, `1.1`, `1.2`) and titled clauses (`WHEREAS`, `NOW, THEREFORE`, `Section 1. Definitions`). Extract these boundaries using regex and layout cues from the PDF parser's heading detection.

**Metadata schema per chunk:**

```json
{
  "chunk_id": "sha256(contract_id + clause_number)",
  "contract_id": "contract_20240115_acme_vendor",
  "clause_number": "12.3",
  "clause_title": "Limitation of Liability",
  "clause_type": "limitation_of_liability",
  "governing_law": "Delaware",
  "contract_type": "Master Service Agreement",
  "effective_date": "2024-01-15",
  "party_a": "ACME Corp",
  "party_b": "Vendor Inc",
  "page_range": [28, 29],
  "parent_chunk_id": "sha256(contract_id + section_12)"
}
```

**Clause type taxonomy:** Pre-tag each chunk with its clause type using a clause classifier (a fine-tuned classifier or few-shot LLM call at ingestion). The taxonomy should cover the 30--40 most common clause types in commercial contracts: limitation of liability, indemnification, governing law, dispute resolution, termination, confidentiality, IP assignment, warranty disclaimer, force majeure, payment terms, etc. This metadata enables highly precise filtered retrieval.

**Estimated ingestion time:** 50,000 contracts × 30 pages = 1.5M pages. At 10 pages/second parsing and 200 chunks/second embedding (batched), total ingestion time ≈ 55 hours. Plan for a 72-hour initial ingestion window with incremental updates thereafter.

---

### Query Processing -- Clause Lookup Example

**User query:** "Does this agreement contain a limitation of liability clause? What are the caps?"

**Query classification:** Clause lookup (single-hop, high precision required)

**Metadata filter applied:** `{"contract_id": "contract_20240115_acme_vendor"}` -- single-contract query, pre-filter eliminates 99.998% of the corpus immediately

**Dense query:** `"limitation of liability clause caps maximum liability"` -- no HyDE needed for this precise query type

**BM25 query:** `"limitation of liability" AND "cap" AND ("shall not exceed" OR "maximum" OR "aggregate")`

**After hybrid retrieval and reranking (top 5 chunks):**

1. Clause 12.3 "Limitation of Liability" (rerank score: 0.94) -- primary clause text
2. Clause 12.4 "Exceptions to Limitation" (rerank score: 0.89) -- carve-outs from the cap
3. Clause 1.1 Definition of "Liability" (rerank score: 0.71) -- definitional scope
4. Clause 14.2 "Indemnification Cap" (rerank score: 0.67) -- related financial cap
5. Clause 12.1 "Mutual Indemnification" (rerank score: 0.61) -- adjacent clause for context

---

**Generation prompt structure:**

```
System: You are a legal contract analysis assistant. Answer questions strictly 
based on the contract clauses provided. If a clause is present, quote the 
relevant text exactly. If a clause is absent, state that clearly. Do not 
infer or assume terms not explicitly stated in the provided text.
Output your answer as JSON with fields: clause_found (boolean), clause_
