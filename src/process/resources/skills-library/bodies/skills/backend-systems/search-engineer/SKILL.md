---
name: search-engineer
description: |
  Search implementation expertise covering full-text search, indexing strategies, relevance scoring, faceted search, autocomplete, fuzzy matching, search analytics, and Elasticsearch/Typesense/Meilisearch patterns.
  Use when the user asks about search engineer, search engineer best practices, or needs guidance on search engineer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "backend api-design optimization"
  category: "backend-systems"
  subcategory: "server-infrastructure"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Search Engineer

## Purpose

Design and implement search systems that deliver fast, relevant results. This skill covers search engine selection, indexing strategies, relevance tuning, autocomplete, faceted search, and operational monitoring.

## Search Engine Selection

### Decision Matrix

```
ENGINE          BEST FOR                  COMPLEXITY   COST
------------------------------------------------------------
PostgreSQL FTS  Simple search, < 1M docs  Low          Free
Meilisearch     Typo-tolerant, instant    Low          Free/Hosted
Typesense       Fast, easy setup          Low          Free/Hosted
Elasticsearch   Complex queries, logs     High         Resource-heavy
OpenSearch      AWS ecosystem             High         Resource-heavy
Algolia         Hosted, instant UX        Low          Pay per search

DECISION TREE:
  Do you need search beyond simple LIKE queries?
    NO  -> PostgreSQL LIKE with trigram index
    YES -> How many documents?
      < 100K -> Meilisearch or Typesense
      100K - 10M -> Any engine (based on feature needs)
      > 10M -> Elasticsearch / OpenSearch

  Do you need:
    Log aggregation + search? -> Elasticsearch
    Instant autocomplete?     -> Meilisearch or Typesense
    Complex aggregations?     -> Elasticsearch
    Simple full-text?         -> PostgreSQL FTS
    Hosted with zero ops?     -> Algolia
```

## PostgreSQL Full-Text Search

### Basic Setup

```sql
-- Add tsvector column for search
ALTER TABLE products ADD COLUMN search_vector tsvector;

-- Populate search vector with weighted fields
UPDATE products SET search_vector =
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(category, '')), 'C');

-- Create GIN index for fast search
CREATE INDEX idx_products_search ON products USING gin(search_vector);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION products_search_trigger() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    # ... (condensed) ...
  ts_headline('english', description, query,
    'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15'
  ) AS highlighted_description
FROM products, plainto_tsquery('english', 'wireless bluetooth headphones') AS query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;
```

### Trigram Search (Fuzzy Matching)

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram index
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- Fuzzy search with similarity score
SELECT name, similarity(name, 'blutooth hedphones') AS sim
FROM products
WHERE name % 'blutooth hedphones'
ORDER BY sim DESC
LIMIT 10;

-- Combine FTS with trigram for best results
SELECT id, name,
  ts_rank(search_vector, tsquery) * 2 + similarity(name, :query) AS combined_score
FROM products, plainto_tsquery('english', :query) AS tsquery
WHERE search_vector @@ tsquery OR name % :query
ORDER BY combined_score DESC
LIMIT 20;
```

## Elasticsearch Patterns

### Index Mapping

```json
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "english",
        "fields": {
          "keyword": { "type": "keyword" },
          "autocomplete": {
            "type": "text",
            "analyzer": "autocomplete_analyzer",
            "search_analyzer": "standard"
          }
        }
      },
      "description": {
        "type": "text",
        "analyzer": "english"
      # ... (condensed) ...
        }
      }
    },
    "number_of_shards": 2,
    "number_of_replicas": 1
  }
}
```

### Search Query DSL

```ts
// Multi-match search with boosting
const searchQuery = {
  query: {
    bool: {
      must: [
        {
          multi_match: {
            query: userQuery,
            fields: ['name^3', 'description^1', 'tags^2'],
            type: 'best_fields',
            fuzziness: 'AUTO',
            prefix_length: 2,
          },
        },
      ],
      filter: [
        ...(category ? [{ term: { category } }] : []),
        ...(priceMin || priceMax ? [{
          # ... (condensed) ...
  from: (page - 1) * pageSize,
  size: pageSize,
  sort: [
    { _score: 'desc' },
    { created_at: 'desc' },
  ],
};
```

### Faceted Search (Aggregations)

```ts
const searchWithFacets = {
  query: { /* ... search query ... */ },
  aggs: {
    categories: {
      terms: { field: 'category', size: 20 },
    },
    price_ranges: {
      range: {
        field: 'price',
        ranges: [
          { to: 25, key: 'under_25' },
          { from: 25, to: 50, key: '25_to_50' },
          { from: 50, to: 100, key: '50_to_100' },
          { from: 100, key: 'over_100' },
        ],
      },
    },
    avg_price: { avg: { field: 'price' } },
    # ... (condensed) ...
  aggregations: {
    categories: { buckets: Array<{ key: string; doc_count: number }> };
    price_ranges: { buckets: Array<{ key: string; doc_count: number }> };
    avg_price: { value: number };
    tags: { buckets: Array<{ key: string; doc_count: number }> };
  };
}
```

## Meilisearch / Typesense Patterns

### Meilisearch Setup

```ts
import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: '[reference URL]',
  apiKey: 'masterKey',
});

// Create index with settings
const index = client.index('products');

await index.updateSettings({
  searchableAttributes: ['name', 'description', 'category', 'tags'],
  filterableAttributes: ['category', 'price', 'tags', 'inStock'],
  sortableAttributes: ['price', 'createdAt', 'popularity'],
  rankingRules: [
    'words',
    'typo',
    'proximity',
    # ... (condensed) ...
  sort: ['price:asc'],
  limit: 20,
  offset: 0,
  attributesToHighlight: ['name', 'description'],
  highlightPreTag: '<mark>',
  highlightPostTag: '</mark>',
});
```

## Autocomplete Implementation

### Search-as-You-Type

```ts
// Backend: dedicated autocomplete endpoint
app.get('/api/search/suggest', async (req, res) => {
  const query = req.query.q as string;
  if (!query || query.length < 2) return res.json({ suggestions: [] });

  const suggestions = await index.search(query, {
    limit: 7,
    attributesToRetrieve: ['id', 'name', 'category'],
    attributesToHighlight: ['name'],
  });

  res.json({
    suggestions: suggestions.hits.map(hit => ({
      id: hit.id,
      text: hit.name,
      highlighted: hit._formatted?.name,
      category: hit.category,
    })),
  # ... (condensed) ...
      .catch(() => {});

    return () => controller.abort();
  }, [debouncedQuery]);

  return { query, setQuery, suggestions };
}
```

### Query Suggestions (Popular and Recent)

```ts
// Track search queries for popularity
async function trackSearch(query: string, userId?: string) {
  const normalized = query.toLowerCase().trim();
  await redis.zincrby('search:popular', 1, normalized);
  if (userId) {
    await redis.lpush(`search:recent:${userId}`, normalized);
    await redis.ltrim(`search:recent:${userId}`, 0, 19);
  }
}

// Get query suggestions
async function getQuerySuggestions(prefix: string, userId?: string) {
  const suggestions: QuerySuggestion[] = [];

  // Recent searches (user-specific)
  if (userId) {
    const recent = await redis.lrange(`search:recent:${userId}`, 0, 4);
    const matching = recent.filter(q => q.startsWith(prefix.toLowerCase()));
    # ... (condensed) ...
  const matching = popular
    .filter(q => q.startsWith(prefix.toLowerCase()))
    .slice(0, 5);
  suggestions.push(...matching.map(q => ({ type: 'popular' as const, text: q })));

  return suggestions;
}
```

## Relevance Scoring

### Boosting Strategy

```
FIELD BOOSTING:
  Title/Name:      3x boost (most relevant)
  Tags/Keywords:   2x boost
  Description:     1x boost (default)
  Comments/Notes:  0.5x boost

FRESHNESS BOOST:
  Items < 7 days:   1.5x boost
  Items < 30 days:  1.2x boost
  Older items:      1x (no boost)

POPULARITY BOOST:
  Based on view count, sales, ratings
  Logarithmic scale to prevent runaway popular items

PERSONALIZATION:
  Boost items in user's preferred categories
  Boost items from followed brands/authors
  Demote previously viewed items (freshness)
```

### Search Quality Metrics

```
KEY METRICS TO MONITOR:

Click-Through Rate (CTR):
  Percentage of searches resulting in at least one click.
  Target: > 60%

Mean Reciprocal Rank (MRR):
  1 / position_of_first_clicked_result, averaged.
  Target: > 0.5 (users typically click top 2 results)

Zero Result Rate:
  Percentage of searches returning no results.
  Target: < 5%

Refinement Rate:
  Percentage of searches followed by another search (indicates poor results).
  Target: < 30%

Time to First Click:
  How quickly users find and click a relevant result.
  Target: < 5 seconds
```

## Indexing Strategy

### Keeping Index in Sync

```
STRATEGY 1: Real-time sync (event-driven)
  Database change -> Event -> Update search index
  Latency: < 1 second
  Best for: User-facing search requiring freshness

STRATEGY 2: Batch sync (scheduled)
  Cron job -> Query changed records -> Update search index
  Latency: Minutes to hours
  Best for: Catalog search, analytics

STRATEGY 3: Change Data Capture (CDC)
  Database WAL -> Debezium -> Search index
  Latency: < 5 seconds
  Best for: High-volume, reliable sync without application changes
```

```ts
// Event-driven sync example
class ProductSearchSync {
  @OnEvent('product.created')
  async onCreated(product: Product) {
    await this.searchClient.index('products').addDocuments([
      this.mapToDocument(product),
    ]);
  }

  @OnEvent('product.updated')
  async onUpdated(product: Product) {
    await this.searchClient.index('products').updateDocuments([
      this.mapToDocument(product),
    ]);
  }

  @OnEvent('product.deleted')
  async onDeleted(productId: string) {
    # ... (condensed) ...
      tags: product.tags.map(t => t.name),
      inStock: product.stockCount > 0,
      popularity: product.viewCount + product.salesCount * 10,
      createdAt: product.createdAt.getTime(),
    };
  }
}
```

### Index Rebuilding

```ts
// Full reindex strategy (zero-downtime)
async function reindexProducts() {
  const newIndex = `products_${Date.now()}`;

  // 1. Create new index with updated settings
  await searchClient.createIndex(newIndex, { primaryKey: 'id' });
  await searchClient.index(newIndex).updateSettings(indexSettings);

  // 2. Index all documents in batches
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const products = await db.products.findMany({
      skip: offset,
      take: batchSize,
      include: { category: true, tags: true },
    });
# ... (condensed) ...
  await searchClient.swapIndexes([
    { indexes: ['products', newIndex] },
  ]);

  // 4. Delete old index
  // (old index is now at the new name after swap)
}
```

## Search Architecture Checklist

- [ ] Search engine selected based on scale and feature requirements
- [ ] Index mapping configured with proper field types and analyzers
- [ ] Searchable, filterable, and sortable attributes defined
- [ ] Autocomplete implemented with edge ngrams or search engine feature
- [ ] Faceted search configured for filter UI
- [ ] Relevance tuning applied (field boosting, freshness, popularity)
- [ ] Fuzzy matching enabled for typo tolerance
- [ ] Query suggestions from popular and recent searches
- [ ] Index sync strategy defined (real-time, batch, or CDC)
- [ ] Highlighting configured for search result previews
- [ ] Pagination implemented (offset or search-after)
- [ ] Search analytics tracking (CTR, zero results, refinements)
- [ ] Rate limiting on search endpoints
- [ ] Zero-downtime reindex strategy documented
- [ ] Monitoring covers query latency, index size, sync lag

## When to Use

**Use this skill when:**
- Designing or implementing search engineer solutions
- Reviewing or improving existing search engineer approaches
- Making architectural or implementation decisions about search engineer
- Learning search engineer patterns and best practices
- Troubleshooting search engineer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Search Engineer Analysis

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

**Input:** "Help me implement search engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended search engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When search engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
