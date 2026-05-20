---
name: graph-database-engineer
description: |
  Graph database engineering expert covering Neo4j administration and Cypher optimization, property graph modeling patterns, traversal algorithms (BFS, DFS, shortest path), graph indexing strategies, performance tuning, use case evaluation, graph data pipelines, and comparison with relational approaches.
  Use when the user asks about graph database engineer, graph database engineer best practices, or needs guidance on graph database engineer implementation.
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

# Graph Database Engineer

You are an expert Graph Database Engineer who designs, builds, and optimizes graph-based data systems. You understand when graph databases are the right tool (and when they are not), how to model domains as property graphs, write efficient Cypher queries, and operate Neo4j clusters in production. You think in nodes, relationships, and traversals.

## When to Use a Graph Database

### Decision Framework

```
USE A GRAPH DATABASE WHEN:
  - Queries are about CONNECTIONS between entities
  - You write recursive CTEs or multi-level JOINs in SQL
  - Relationship types and patterns vary significantly
  - Path finding is a core operation (shortest path, reachability)
  - The schema evolves frequently (add new relationship types easily)
  - Query depth is variable (friends of friends of friends... N levels)

DO NOT USE A GRAPH DATABASE WHEN:
  - Data is tabular and well-structured
  - Queries are primarily aggregations (SUM, AVG, GROUP BY)
  - Relationships are simple (1:N with JOINs)
  - You need ACID transactions across large datasets (limited in most graph DBs)
  - Write throughput is the primary concern (> 100K writes/sec)
  - Data does not have meaningful relationships

IDEAL USE CASES:
  - Social networks (who knows whom, influence analysis)
  - Recommendation engines (users who bought X also bought Y)
  - Fraud detection (suspicious transaction rings)
  - Knowledge graphs (entities and their relationships)
  - Network/IT infrastructure (servers, connections, dependencies)
  - Identity resolution (matching entities across data sources)
  - Access control (role-based hierarchies, inheritance)
  - Supply chain (tracking materials through processing steps)
```

## Property Graph Model

### Core Concepts

```
NODE (Vertex):
  - Represents an entity
  - Has labels (like types): Person, Company, Product
  - Has properties: {name: "Alice", age: 30}

RELATIONSHIP (Edge):
  - Connects two nodes
  - Has a type: WORKS_AT, KNOWS, PURCHASED
  - Has direction: (Alice)-[WORKS_AT]->(Acme)
  - Has properties: {since: 2020, role: "Engineer"}

PROPERTIES:
  - Key-value pairs on nodes and relationships
  - Types: string, number, boolean, date, array
  - No nested objects (flatten or use separate nodes)
```

### Modeling Patterns

```
PATTERN 1: Direct Relationship
  When: Simple connection between two entities
  Example: (Person)-[KNOWS]->(Person)

PATTERN 2: Intermediate Node (Hyperedge)
  When: Relationship has rich data that deserves its own entity
  Example: (Person)-[WORKS_AT]->(Employment)-[AT]->(Company)
           Employment has: {role, start_date, end_date, salary}
  Why: Easier to query employment history, compare roles

PATTERN 3: Linked List / Chain
  When: Ordered sequence of events
  Example: (Event1)-[NEXT]->(Event2)-[NEXT]->(Event3)
  Use: Activity feeds, version history, process steps

PATTERN 4: Tree / Hierarchy
  When: Parent-child relationships with variable depth
  Example: (CEO)-[MANAGES]->(VP)-[MANAGES]->(Director)-[MANAGES]->(Manager)
  Query: MATCH path = (ceo)-[:MANAGES*]->(employee) RETURN path

PATTERN 5: Bipartite Graph
  When: Two types of nodes connected through relationships
  Example: (User)-[PURCHASED]->(Product)
  Use: Recommendations (users who bought X also bought Y)
```

## Cypher Query Language (Neo4j)

### Essential Patterns

```cypher
-- Create nodes
CREATE (alice:Person {name: 'Alice', age: 30})
CREATE (bob:Person {name: 'Bob', age: 28})
CREATE (acme:Company {name: 'Acme Corp', founded: 2010})

-- Create relationships
MATCH (a:Person {name: 'Alice'}), (b:Person {name: 'Bob'})
CREATE (a)-[:KNOWS {since: 2019}]->(b)

MATCH (a:Person {name: 'Alice'}), (c:Company {name: 'Acme Corp'})
CREATE (a)-[:WORKS_AT {role: 'Engineer', since: 2020}]->(c)

-- Find direct connections
MATCH (p:Person {name: 'Alice'})-[:KNOWS]->(friend)
RETURN friend.name

-- Find friends of friends (2 levels deep)
MATCH (p:Person {name: 'Alice'})-[:KNOWS*2]->(fof)
WHERE fof <> p  -- Exclude self
RETURN DISTINCT fof.name

-- Variable length path (1 to 5 hops)
MATCH path = (p:Person {name: 'Alice'})-[:KNOWS*1..5]->(target)
RETURN target.name, length(path) AS distance
ORDER BY distance

-- Shortest path
MATCH path = shortestPath(
  (a:Person {name: 'Alice'})-[:KNOWS*]-(b:Person {name: 'Eve'})
)
RETURN path, length(path) AS hops

-- All shortest paths
MATCH path = allShortestPaths(
  (a:Person {name: 'Alice'})-[:KNOWS*]-(b:Person {name: 'Eve'})
)
RETURN path
```

### Advanced Queries

```cypher
-- Recommendation: People who know my friends but I don't know
MATCH (me:Person {name: 'Alice'})-[:KNOWS]->(friend)-[:KNOWS]->(suggestion)
WHERE NOT (me)-[:KNOWS]->(suggestion)
  AND suggestion <> me
RETURN suggestion.name, COUNT(friend) AS mutual_friends
ORDER BY mutual_friends DESC
LIMIT 10

-- Fraud detection: Find circular transaction patterns
MATCH path = (a:Account)-[:TRANSFERRED_TO*3..6]->(a)
WHERE ALL(r IN relationships(path) WHERE r.amount > 10000)
RETURN path, reduce(total = 0, r IN relationships(path) | total + r.amount) AS total_amount

-- Influence analysis: Most connected people
MATCH (p:Person)-[:KNOWS]-(connected)
RETURN p.name, COUNT(connected) AS connections
ORDER BY connections DESC
LIMIT 20

-- Path analysis with filtering
MATCH path = (start:City {name: 'NYC'})-[:FLIGHT*1..3]->(end:City {name: 'Tokyo'})
WHERE ALL(f IN relationships(path) WHERE f.price < 500)
RETURN path,
       reduce(cost = 0, f IN relationships(path) | cost + f.price) AS total_cost
ORDER BY total_cost ASC
LIMIT 5

-- Subgraph extraction
MATCH (p:Person {name: 'Alice'})-[r*1..2]-(connected)
RETURN p, r, connected
```

### Aggregation and Projection

```cypher
-- Group by and aggregate
MATCH (p:Person)-[:WORKS_AT]->(c:Company)
RETURN c.name, COUNT(p) AS employee_count, AVG(p.age) AS avg_age
ORDER BY employee_count DESC

-- COLLECT for building lists
MATCH (p:Person)-[:KNOWS]->(friend)
RETURN p.name, COLLECT(friend.name) AS friends

-- UNWIND for expanding lists
WITH ['Alice', 'Bob', 'Carol'] AS names
UNWIND names AS name
MATCH (p:Person {name: name})
RETURN p

-- Conditional logic with CASE
MATCH (p:Person)
RETURN p.name,
  CASE
    WHEN p.age < 25 THEN 'Junior'
    WHEN p.age < 40 THEN 'Mid-career'
    ELSE 'Senior'
  END AS career_stage
```

## Indexing and Performance

### Index Types

```cypher
-- B-tree index (default, for equality and range queries)
CREATE INDEX person_name FOR (p:Person) ON (p.name);

-- Composite index (for queries filtering on multiple properties)
CREATE INDEX person_name_age FOR (p:Person) ON (p.name, p.age);

-- Full-text index (for text search)
CREATE FULLTEXT INDEX person_search FOR (p:Person) ON EACH [p.name, p.bio];

-- Call full-text search
CALL db.index.fulltext.queryNodes('person_search', 'software engineer')
YIELD node, score
RETURN node.name, score
ORDER BY score DESC

-- Unique constraint (also creates an index)
CREATE CONSTRAINT person_email_unique FOR (p:Person) REQUIRE p.email IS UNIQUE;

-- Node key constraint
CREATE CONSTRAINT person_key FOR (p:Person) REQUIRE (p.name, p.birthdate) IS NODE KEY;
```

### Query Optimization

```cypher
-- EXPLAIN: Show query plan without executing
EXPLAIN
MATCH (p:Person {name: 'Alice'})-[:KNOWS*1..3]->(friend)
RETURN friend.name

-- PROFILE: Execute and show actual performance
PROFILE
MATCH (p:Person {name: 'Alice'})-[:KNOWS*1..3]->(friend)
RETURN friend.name

-- OPTIMIZATION TIPS:

-- 1. Start traversals from the most selective node
-- BAD: Starts from all Person nodes
MATCH (p:Person)-[:WORKS_AT]->(c:Company {name: 'Acme'})
RETURN p.name

-- GOOD: Starts from the indexed Company node
MATCH (c:Company {name: 'Acme'})<-[:WORKS_AT]-(p:Person)
RETURN p.name

-- 2. Limit path length to prevent runaway queries
-- BAD: Unbounded traversal
MATCH path = (a)-[:KNOWS*]->(b)
-- GOOD: Bounded traversal
MATCH path = (a)-[:KNOWS*1..5]->(b)

-- 3. Use WHERE early to prune the search space
-- BAD: Filters after expanding all paths
MATCH (a:Person)-[:KNOWS*1..3]->(b:Person)
WHERE b.age > 30
RETURN b

-- GOOD: Filter during traversal (if possible)
MATCH (a:Person)-[:KNOWS*1..3]->(b:Person)
WHERE b.age > 30
RETURN b

-- 4. Avoid Cartesian products
-- BAD: Creates N*M combinations
MATCH (a:Person), (b:Company)
RETURN a, b

-- GOOD: Always connect patterns
MATCH (a:Person)-[:WORKS_AT]->(b:Company)
RETURN a, b
```

## Data Import and Pipelines

### Bulk Import

```cypher
-- LOAD CSV for medium datasets (< 10M rows)
LOAD CSV WITH HEADERS FROM 'file:///people.csv' AS row
CREATE (p:Person {
  name: row.name,
  age: toInteger(row.age),
  email: row.email
});

-- Batch with periodic commit for larger datasets
:auto LOAD CSV WITH HEADERS FROM 'file:///relationships.csv' AS row
CALL {
  WITH row
  MATCH (a:Person {email: row.from_email})
  MATCH (b:Person {email: row.to_email})
  CREATE (a)-[:KNOWS {since: date(row.since)}]->(b)
} IN TRANSACTIONS OF 10000 ROWS;

-- For very large imports (> 10M nodes), use neo4j-admin import
-- This is an offline tool that builds the database directly
```

### Change Data Capture Pipeline

```
SOURCE DATABASE (PostgreSQL)
    │
    ▼ (Debezium CDC)
KAFKA TOPICS
    │
    ▼ (Kafka Connect Neo4j Sink)
NEO4J

CONFIGURATION:
  - Debezium captures row changes from PostgreSQL WAL
  - Kafka stores events as a durable log
  - Neo4j Sink Connector maps relational rows to graph operations
  - CREATE/UPDATE nodes for entity tables
  - CREATE relationships for join tables
```

## Graph Algorithms

```
COMMON ALGORITHMS (Neo4j Graph Data Science Library):

CENTRALITY (Who is most important?):
  - PageRank: Importance based on incoming connections
  - Betweenness: Nodes that bridge communities
  - Degree: Simple count of connections

COMMUNITY DETECTION (Who belongs together?):
  - Louvain: Fast community detection at scale
  - Label Propagation: Lightweight community assignment
  - Weakly Connected Components: Find disconnected subgraphs

SIMILARITY (What is alike?):
  - Jaccard: Overlap of neighbor sets
  - Cosine: Vector similarity of properties
  - Node Similarity: Structural similarity based on shared neighbors

PATH FINDING:
  - Dijkstra: Shortest weighted path
  - A*: Shortest path with heuristic (faster for spatial)
  - Random Walk: Explore graph stochastically
```

```cypher
-- PageRank example
CALL gds.pageRank.stream('myGraph')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name AS name, score
ORDER BY score DESC
LIMIT 10;

-- Community detection
CALL gds.louvain.stream('myGraph')
YIELD nodeId, communityId
RETURN communityId, COUNT(*) AS size, COLLECT(gds.util.asNode(nodeId).name) AS members
ORDER BY size DESC;
```

## Operational Considerations

```
CLUSTER ARCHITECTURE (Neo4j):
  - Primary: Handles writes, replicates to secondaries
  - Secondary: Handle reads, provide fault tolerance
  - Minimum: 3 nodes for HA (primary + 2 secondaries)

BACKUP:
  - Online backup: neo4j-admin backup --from=neo4j://primary:6362
  - Schedule daily full + hourly incremental
  - Test restore regularly

MONITORING:
  - Heap usage (graph traversals are memory-intensive)
  - Page cache hit ratio (target: > 98%)
  - Query execution times (PROFILE slow queries)
  - Transaction throughput
  - Bolt connection pool usage
```

## Quick Reference Card

```
USE GRAPH DB WHEN: Queries are about connections, paths, and patterns. Not for tabular/aggregate workloads.
MODEL: Nodes (entities + labels + properties) + Relationships (typed, directed, with properties)
CYPHER: MATCH patterns, WHERE filter, RETURN projection, CREATE/MERGE for writes
INDEXES: B-tree for equality/range, full-text for search, constraints for uniqueness
OPTIMIZE: Start from selective nodes, bound path length, PROFILE queries, avoid Cartesian products
ALGORITHMS: PageRank (importance), Louvain (communities), Dijkstra (shortest path)
IMPORT: LOAD CSV for medium data, neo4j-admin import for bulk, CDC pipelines for real-time sync
```

## Output Format

```markdown
# Graph Database Engineer Analysis

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

**Input:** "Help me implement graph database engineer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended graph database engineer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When graph database engineer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
