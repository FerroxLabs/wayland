---
name: elasticsearch-engineer
description: |
  Elasticsearch design and operations expertise covering index design, mapping types, custom analyzer configuration, search query construction (bool, multi-match, function_score), aggregations, index lifecycle management, cluster sizing and architecture, performance tuning, and Kibana dashboard creation.
  Use when the user asks about elasticsearch engineer, elasticsearch engineer best practices, or needs guidance on elasticsearch engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "database sql guide"
  category: "backend-systems"
  subcategory: "database"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Elasticsearch Engineer

## Core Philosophy

Elasticsearch is a distributed search and analytics engine built on Apache Lucene. It excels at full-text search, log analytics, and real-time aggregations. Success requires understanding how data flows from ingestion through analysis to inverted indexes, and how to design mappings and queries that leverage this architecture.

## Index Design

### Mapping Definition

```json
PUT /products
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "index.codec": "best_compression",
    "analysis": {
      "analyzer": {
        "product_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding", "product_synonyms", "english_stemmer"]
        },
        "autocomplete_analyzer": {
          # ... (condensed) ...
        "type": "boolean"
      }
    }
  }
}
```

### Mapping Type Selection

| Data Type | ES Field Type | Use Case |
|-----------|---------------|----------|
| Full-text | `text` | Search/match queries, analyzed |
| Exact match | `keyword` | Filtering, sorting, aggregations |
| Both | `text` + `keyword` subfield | Search + filter/sort |
| Numbers | `integer`, `long`, `double`, `scaled_float` | Range queries, sorting |
| Dates | `date` | Time-based queries, date math |
| Boolean | `boolean` | Filtering |
| Geo | `geo_point`, `geo_shape` | Location queries |
| Objects | `object` (default), `nested`, `flattened` | Structured data |
| IP | `ip` | CIDR range queries |
| Dense vector | `dense_vector` | kNN / vector similarity search |

### When to Use Nested vs Object

```json
// PROBLEM with object type: cross-object matching
// If you store: [{"color": "red", "size": "L"}, {"color": "blue", "size": "S"}]
// A query for color=red AND size=S would INCORRECTLY match (cross-object)

// SOLUTION: Use nested type
"attributes": {
  "type": "nested",
  "properties": {
    "color": { "type": "keyword" },
    "size": { "type": "keyword" }
  }
}

// Query with nested query
# ... (condensed) ...
        }
      }
    }
  }
}
```

## Analyzer Configuration

### Anatomy of an Analyzer

An analyzer consists of: **Character Filters -> Tokenizer -> Token Filters**

```json
// Custom analyzer for product search
{
  "analysis": {
    "char_filter": {
      "html_strip": { "type": "html_strip" },
      "ampersand_replace": {
        "type": "pattern_replace",
        "pattern": "&",
        "replacement": "and"
      }
    },
    "tokenizer": {
      "product_tokenizer": {
        "type": "pattern",
        # ... (condensed) ...
        "filter": ["lowercase", "english_possessive", "english_stop", "english_stemmer"]
      }
    }
  }
}
```

### Testing Analyzers

```json
// Test how text is analyzed
POST /_analyze
{
  "analyzer": "english_product",
  "text": "The quick brown fox's running & jumping"
}
// Result tokens: ["quick", "brown", "fox", "run", "and", "jump"]

// Test with specific index analyzer
POST /products/_analyze
{
  "field": "name",
  "text": "Wireless Bluetooth Mouse"
}
```

## Search Queries

### Bool Query (The Foundation)

```json
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "multi_match": {
          "query": "wireless mouse",
          "fields": ["name^3", "description", "tags^2"],
          "type": "best_fields",
          "fuzziness": "AUTO"
        }}
      ],
      "filter": [
        { "term": { "category": "electronics" } },
        # ... (condensed) ...
  },
  "from": 0,
  "size": 20,
  "_source": ["name", "price", "category", "in_stock"]
}
```

### Multi-Match Strategies

```json
// best_fields: Score from best matching field (default)
{ "multi_match": { "query": "q", "fields": ["title^3", "body"], "type": "best_fields" } }

// most_fields: Sum scores from all matching fields
{ "multi_match": { "query": "q", "fields": ["title", "title.stemmed", "title.ngram"], "type": "most_fields" } }

// cross_fields: Treats all fields as one big field (good for name = first + last)
{ "multi_match": { "query": "John Smith", "fields": ["first_name", "last_name"], "type": "cross_fields" } }

// phrase_prefix: Autocomplete / search-as-you-type
{ "multi_match": { "query": "wire mou", "fields": ["name"], "type": "phrase_prefix" } }
```

### Function Score (Custom Relevance)

```json
GET /products/_search
{
  "query": {
    "function_score": {
      "query": { "multi_match": { "query": "laptop", "fields": ["name", "description"] } },
      "functions": [
        {
          "field_value_factor": {
            "field": "popularity",
            "factor": 1.2,
            "modifier": "log1p",
            "missing": 1
          },
          "weight": 2
        # ... (condensed) ...
      "boost_mode": "multiply",
      "max_boost": 10
    }
  }
}
```

### Vector Search (kNN)

```json
// Define dense vector field
PUT /embeddings
{
  "mappings": {
    "properties": {
      "content_vector": {
        "type": "dense_vector",
        "dims": 768,
        "index": true,
        "similarity": "cosine"
      }
    }
  }
}
# ... (condensed) ...
    "k": 10,
    "num_candidates": 100
  },
  "fields": ["title", "content"]
}
```

## Aggregations

### Metric Aggregations

```json
GET /orders/_search
{
  "size": 0,
  "aggs": {
    "total_revenue": { "sum": { "field": "total" } },
    "avg_order_value": { "avg": { "field": "total" } },
    "order_stats": {
      "stats": { "field": "total" }
    },
    "percentile_values": {
      "percentiles": { "field": "response_time_ms", "percents": [50, 90, 95, 99] }
    },
    "unique_customers": {
      "cardinality": { "field": "customer_id", "precision_threshold": 3000 }
    }
  }
}
```

### Bucket Aggregations

```json
GET /orders/_search
{
  "size": 0,
  "aggs": {
    "by_status": {
      "terms": { "field": "status", "size": 20 },
      "aggs": {
        "revenue": { "sum": { "field": "total" } },
        "avg_total": { "avg": { "field": "total" } }
      }
    },
    "orders_over_time": {
      "date_histogram": {
        "field": "created_at",
        # ... (condensed) ...
        ]
      }
    }
  }
}
```

## Index Lifecycle Management (ILM)

```json
PUT _ilm/policy/logs_policy
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_primary_shard_size": "50gb",
            "max_age": "1d"
          },
          "set_priority": { "priority": 100 }
        }
      },
      # ... (condensed) ...
      "number_of_shards": 3,
      "number_of_replicas": 1
    }
  }
}
```

## Cluster Sizing

### Shard Sizing Guidelines

- **Target shard size**: 10-50 GB per shard
- **Max shards per node**: ~600-1000 (depends on heap)
- **Heap per shard**: ~1-2 MB overhead per shard
- **JVM heap**: 50% of RAM, max 31 GB (compressed oops threshold)
- **Rule of thumb**: number_of_shards = ceil(expected_data_size / 30GB)

### Node Roles

```yaml
# Master-eligible nodes (3 minimum, small instances)
node.roles: [master]
# Heap: 1-4 GB, no storage needed

# Hot data nodes (high CPU, fast SSD storage)
node.roles: [data_hot, data_content]
# Heap: 16-31 GB, fast NVMe storage

# Warm data nodes (moderate CPU, larger cheaper storage)
node.roles: [data_warm]
# Heap: 16-31 GB, standard SSD storage

# Cold data nodes (minimal CPU, large HDD storage)
node.roles: [data_cold]
# Heap: 8-16 GB, HDD storage

# Coordinating-only nodes (query routing / aggregation)
node.roles: []
# Heap: 16-31 GB, no storage needed

# ML nodes
node.roles: [ml, remote_cluster_client]
```

## Performance Tuning

### Indexing Performance

```json
// Bulk indexing settings (revert after bulk load)
PUT /my_index/_settings
{
  "index": {
    "refresh_interval": "30s",
    "number_of_replicas": 0,
    "translog.durability": "async",
    "translog.sync_interval": "30s"
  }
}

// Use bulk API (optimal batch: 5-15 MB per request)
POST /_bulk
{"index":{"_index":"products","_id":"1"}}
{"name":"Widget","price":9.99}
{"index":{"_index":"products","_id":"2"}}
{"name":"Gadget","price":19.99}
```

### Search Performance

```json
// Use filter context for non-scoring clauses (cacheable)
// Use routing to target specific shards
GET /orders/_search?routing=customer_123
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "customer_id": "customer_123" } },
        { "range": { "created_at": { "gte": "2025-01-01" } } }
      ]
    }
  }
}

// Profile slow queries
GET /products/_search
{
  "profile": true,
  "query": { "match": { "name": "wireless mouse" } }
}
```

### Monitoring Queries

```json
// Cluster health
GET _cluster/health?level=indices

// Hot threads
GET _nodes/hot_threads

// Pending tasks
GET _cluster/pending_tasks

// Shard allocation explanation
GET _cluster/allocation/explain

// Index stats
GET /my_index/_stats

// Node stats
GET _nodes/stats/jvm,os,process
```

## Kibana Dashboard Design

### Effective Dashboard Layout

1. **Top row**: Key KPIs (metric visualizations) -- total count, error rate, p95 latency
2. **Second row**: Time-series line charts showing trends
3. **Third row**: Breakdown charts -- bar charts by category, pie charts for distribution
4. **Bottom row**: Data table with top items, and a saved search for drill-down

### Index Patterns and Runtime Fields

```json
// Runtime field for computed values without re-indexing
PUT /orders/_mapping
{
  "runtime": {
    "profit_margin": {
      "type": "double",
      "script": "(doc['revenue'].value - doc['cost'].value) / doc['revenue'].value * 100"
    },
    "day_of_week": {
      "type": "keyword",
      "script": "emit(doc['created_at'].value.dayOfWeekEnum.getDisplayName(TextStyle.FULL, Locale.ROOT))"
    }
  }
}
```

## When to Use

**Use this skill when:**
- Designing or implementing elasticsearch engineer solutions
- Reviewing or improving existing elasticsearch engineer approaches
- Making architectural or implementation decisions about elasticsearch engineer
- Learning elasticsearch engineer patterns and best practices
- Troubleshooting elasticsearch engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Elasticsearch Engineer Analysis

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

**Input:** "Help me implement elasticsearch engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended elasticsearch engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When elasticsearch engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
