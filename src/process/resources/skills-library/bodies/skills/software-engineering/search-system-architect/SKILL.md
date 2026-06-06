---
name: search-system-architect
description: |
  Search infrastructure design expert covering full-text search architecture, Elasticsearch/OpenSearch cluster design, relevance tuning (BM25, TF-IDF, custom scoring), faceted search, autocomplete, query understanding, search analytics, and search quality measurement.
  Use when the user asks about search system architect, search system architect best practices, or needs guidance on search system architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "architecture design-patterns backend"
  category: "software-engineering"
  subcategory: "architecture-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Search System Architect

You are an expert Search System Architect who designs and optimizes search experiences at scale. You understand the full stack from text analysis and indexing through query processing and relevance ranking to user-facing features like autocomplete and faceted navigation. You know that great search is not about the engine -- it is about understanding user intent and measuring search quality.

## Search Architecture Overview

```
USER QUERY → Query Understanding → Query Execution → Ranking → Results
                  │                       │              │
                  ▼                       ▼              ▼
          Spell check            Index lookup       BM25 + custom
          Synonym expansion      Filtering          boosting
          Intent detection       Aggregations       Personalization
          Tokenization           Geo queries        Re-ranking
```

### Technology Selection

```
DECISION TREE:

Do you need full-text search?
  NO  → Use your database (PostgreSQL full-text, MongoDB text index)
  YES → How much data?
    < 1M documents → PostgreSQL full-text search (simpler stack)
    1M - 100M documents → Elasticsearch / OpenSearch (single cluster)
    > 100M documents → Elasticsearch with cross-cluster search

Do you need real-time indexing?
  YES → Elasticsearch (near-real-time by default)
  NO  → Solr or even batch-indexed solutions work fine

Do you need vector/semantic search?
  YES → Elasticsearch 8.x+ (kNN), OpenSearch, Pinecone, Weaviate
  NO  → Traditional BM25 is sufficient

Do you need multi-tenancy?
  YES → Index-per-tenant (small tenants) or filtered aliases (large scale)
  NO  → Simpler index design
```

## Index Design

### Mapping Strategy

```json
PUT /products
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "product_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "stop",
            "synonym_filter",
            "stemmer"
          ]
        },
        "autocomplete_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": [
            "lowercase",
            "edge_ngram_filter"
          ]
        }
      },
      "filter": {
        "synonym_filter": {
          "type": "synonym",
          "synonyms_path": "synonyms.txt"
        },
        "edge_ngram_filter": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 15
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "product_analyzer",
        "fields": {
          "autocomplete": {
            "type": "text",
            "analyzer": "autocomplete_analyzer",
            "search_analyzer": "standard"
          },
          "exact": {
            "type": "keyword"
          }
        }
      },
      "description": {
        "type": "text",
        "analyzer": "product_analyzer"
      },
      "category": {
        "type": "keyword"
      },
      "price": {
        "type": "float"
      },
      "rating": {
        "type": "float"
      },
      "created_at": {
        "type": "date"
      },
      "tags": {
        "type": "keyword"
      },
      "in_stock": {
        "type": "boolean"
      }
    }
  }
}
```

### Sharding Strategy

```
SHARD SIZING RULES OF THUMB:
  - Target 10-50 GB per shard (sweet spot for performance)
  - Maximum ~200M documents per shard
  - More shards = better write throughput but more overhead
  - Fewer shards = better search performance but larger individual shards

EXAMPLE CALCULATION:
  Total data: 500 GB
  Target shard size: 25 GB
  Primary shards: 500 / 25 = 20 shards
  With 1 replica: 40 total shards
  Cluster: 5 nodes → 8 shards per node (reasonable)

TIME-BASED INDICES (Logs):
  Index per day: logs-2025-01-15
  Use index lifecycle management (ILM) for rollover
  Hot-warm-cold architecture for cost optimization
```

## Relevance Tuning

### BM25 Scoring (Default in Elasticsearch)

```
BM25(q, d) = Σ IDF(qi) × (tf(qi, d) × (k1 + 1)) / (tf(qi, d) + k1 × (1 - b + b × |d| / avgdl))

WHERE:
  IDF = Inverse document frequency (rare terms score higher)
  tf  = Term frequency in document
  k1  = Term saturation parameter (default 1.2)
  b   = Length normalization (default 0.75, 0 = no normalization)
  |d| = Document length
  avgdl = Average document length

TUNING:
  - Increase k1: Reward documents with more term occurrences
  - Decrease k1: Reduce impact of term frequency
  - Increase b: Penalize longer documents more
  - Decrease b: Reduce length normalization
```

### Multi-Field Boosting

```json
{
  "query": {
    "multi_match": {
      "query": "wireless headphones",
      "fields": [
        "title^3",
        "brand^2",
        "description^1",
        "tags^1.5"
      ],
      "type": "best_fields",
      "tie_breaker": 0.3
    }
  }
}
```

### Custom Scoring with function_score

```json
{
  "query": {
    "function_score": {
      "query": {
        "multi_match": {
          "query": "wireless headphones",
          "fields": ["title^3", "description"]
        }
      },
      "functions": [
        {
          "filter": { "term": { "in_stock": true } },
          "weight": 2
        },
        {
          "field_value_factor": {
            "field": "rating",
            "modifier": "log1p",
            "factor": 0.5
          }
        },
        {
          "gauss": {
            "created_at": {
              "origin": "now",
              "scale": "30d",
              "decay": 0.5
            }
          }
        }
      ],
      "score_mode": "multiply",
      "boost_mode": "multiply"
    }
  }
}
```

### Relevance Tuning Checklist

```
1. BASELINE: Measure current search quality (see metrics below)
2. SYNONYMS: Add domain-specific synonyms ("laptop" = "notebook")
3. BOOSTING: Boost title matches over description matches
4. FRESHNESS: Decay score for older content (if recency matters)
5. POPULARITY: Boost by sales count, view count, or rating
6. STOCK: Penalize or filter out-of-stock items
7. PERSONALIZATION: Boost based on user's past behavior
8. MEASURE: A/B test every change against the baseline
```

## Faceted Search

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "title": "headphones" } }
      ],
      "filter": [
        { "term": { "category": "electronics" } },
        { "range": { "price": { "gte": 50, "lte": 200 } } }
      ]
    }
  },
  "aggs": {
    "categories": {
      "terms": { "field": "category", "size": 20 }
    },
    "brands": {
      "terms": { "field": "brand", "size": 20 }
    },
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 50, "key": "Under $50" },
          { "from": 50, "to": 100, "key": "$50-$100" },
          { "from": 100, "to": 200, "key": "$100-$200" },
          { "from": 200, "key": "Over $200" }
        ]
      }
    },
    "avg_rating": {
      "avg": { "field": "rating" }
    }
  }
}
```

### Facet Design Principles

```
1. Show facet counts AFTER applying other filters (post-filter pattern)
2. Selected facets should show count for the selected value
3. Order facets by count (most results first) or alphabetically
4. Collapse long facet lists with "Show more" (top 5 + expand)
5. Use hierarchical facets for categories (Electronics > Audio > Headphones)
6. Price facets: Use meaningful ranges, not equal intervals
```

## Autocomplete

### Implementation Strategies

```
STRATEGY 1: Edge N-Grams (Index Time)
  Index "headphones" as: "he", "hea", "head", "headp", ...
  Fast search, higher index size
  Best for: Product title completion

STRATEGY 2: Completion Suggester (Elasticsearch Native)
  Uses FST (Finite State Transducer) data structure
  Extremely fast, purpose-built for prefix matching
  Best for: High-volume autocomplete with weight-based ranking

STRATEGY 3: Search-as-you-type Field Type
  Built-in field type that combines edge ngrams + shingles
  Best for: Simple setup, good enough for most cases
```

```json
{
  "mappings": {
    "properties": {
      "suggest": {
        "type": "completion",
        "contexts": [
          {
            "name": "category",
            "type": "category"
          }
        ]
      }
    }
  }
}
```

```json
{
  "suggest": {
    "product-suggest": {
      "prefix": "head",
      "completion": {
        "field": "suggest",
        "size": 5,
        "contexts": {
          "category": ["electronics"]
        },
        "fuzzy": {
          "fuzziness": 1
        }
      }
    }
  }
}
```

### Autocomplete UX Guidelines

```
PERFORMANCE:
  - Response time < 100ms (users expect instant feedback)
  - Debounce input: 150-300ms (do not fire on every keystroke)
  - Minimum 2-3 characters before triggering

RESULTS:
  - Show 5-8 suggestions maximum
  - Mix types: products, categories, brands, recent searches
  - Highlight matching portion of suggestion
  - Show product thumbnails for product suggestions

BEHAVIOR:
  - Keyboard navigation (arrow keys + enter)
  - Click or tap to select
  - Show "No results" only after search execution, not during autocomplete
  - Preserve partial input when user dismisses suggestions
```

## Query Understanding

```
PIPELINE:
  Raw Query → Tokenize → Spell Check → Expand Synonyms →
  Detect Intent → Route Query

SPELL CHECK:
  "wireles hedphones" → "wireless headphones"
  Use: Elasticsearch "phrase suggester" or custom dictionary

SYNONYM EXPANSION:
  "laptop" → ["laptop", "notebook", "portable computer"]
  "tv" → ["tv", "television"]
  Store in synonyms.txt, reload without reindex

INTENT DETECTION:
  "headphones under $50" → filter: price < 50, query: "headphones"
  "red nike shoes size 10" → filters: color=red, brand=nike, size=10
  Use regex patterns or NLP for extraction

ZERO RESULTS HANDLING:
  1. Suggest alternative queries ("Did you mean...?")
  2. Relax filters automatically ("Showing results without size filter")
  3. Show popular items in the category
  4. NEVER show an empty page
```

## Search Quality Metrics

```
PRECISION@K: Of the top K results, how many are relevant?
  Precision@5 = (relevant results in top 5) / 5
  Target: > 0.7 for e-commerce, > 0.8 for enterprise search

RECALL@K: Of all relevant documents, how many appear in top K?
  Harder to measure (requires knowing all relevant docs)
  Use sampling or human judgment sets

NDCG (Normalized Discounted Cumulative Gain):
  Measures ranking quality -- are the best results at the top?
  Score 0-1, higher is better
  Target: > 0.6 is good, > 0.8 is excellent

CLICK-THROUGH RATE (CTR):
  % of searches that result in a click
  Target varies by domain (e-commerce: 30-60%)

ZERO RESULTS RATE:
  % of searches returning no results
  Target: < 5% (invest in synonyms, spell check)

MEAN RECIPROCAL RANK (MRR):
  Average of 1/rank of the first relevant result
  MRR of 0.5 means the first relevant result is typically at position 2

TRACK OVER TIME:
  - Dashboard: Daily search quality metrics
  - Alerts: Zero results rate spike, CTR drop
  - A/B test: Every relevance change against baseline
```

## Infrastructure Patterns

### Production Cluster

```
  3 dedicated master nodes: Cluster state, no data/queries, odd count
  N data nodes: Store indices, handle queries, SSD for hot data
  2 coordinating nodes: Route queries, aggregate results, load balancing
  Cross-AZ deployment, dedicated inter-node network
```

### Indexing Pipeline

```
Data Source → CDC → Kafka → Index Workers → Elasticsearch

REINDEXING (zero-downtime):
  1. Create new index with updated mapping
  2. Alias points to old index
  3. Reindex all documents to new index
  4. Switch alias to new index
  5. Delete old index
```

## Quick Reference Card

```
TECHNOLOGY: PostgreSQL < 1M docs, Elasticsearch 1M+, add vector search for semantic
INDEX DESIGN: 10-50GB per shard, multi-field mappings, custom analyzers
RELEVANCE: BM25 baseline → field boosting → function_score → A/B test
AUTOCOMPLETE: Edge ngrams or completion suggester, <100ms response
FACETS: Post-filter pattern, meaningful ranges, hierarchical categories
QUALITY: Precision@5 > 0.7, zero results < 5%, track NDCG over time
INFRA: 3 master + N data + 2 coordinating nodes, Kafka-based indexing pipeline
```

## When to Use

**Use this skill when:**
- Designing or implementing search system architect solutions
- Reviewing or improving existing search system architect approaches
- Making architectural or implementation decisions about search system architect
- Learning search system architect patterns and best practices
- Troubleshooting search system architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Search System Architect Analysis

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

**Input:** "Help me implement search system architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended search system architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When search system architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
