---
name: graph-db-architect
description: |
  Graph database design expertise covering Neo4j and Cypher query language, property graph model, graph schema design, traversal patterns, path algorithms (shortest path, all paths), graph indexing, community detection, recommendation engines, knowledge graphs, and graph data modeling best practices.
  Use when the user asks about graph db architect, graph db architect best practices, or needs guidance on graph db architect implementation.
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
  difficulty: "intermediate"
---

# Graph Database Architect

## Core Philosophy

Graph databases model relationships as first-class citizens. Use them when your queries are about connections, paths, patterns, and network effects. If you find yourself writing recursive CTEs or multiple self-JOINs in a relational database, a graph database is likely a better fit. The key insight: in graph databases, relationship traversal is O(1) per hop, regardless of total dataset size.

## When to Use a Graph Database

**Ideal use cases:**
- Social networks and influence analysis
- Recommendation engines (collaborative filtering)
- Fraud detection (transaction rings, identity networks)
- Knowledge graphs and semantic search
- Network infrastructure mapping
- Access control and authorization hierarchies
- Supply chain and logistics
- Master data management (entity resolution)

**Not ideal for:**
- Simple CRUD with tabular data
- Heavy aggregations over all data
- Time-series or append-only workloads
- Unconnected data without meaningful relationships

## Property Graph Model

### Nodes, Relationships, and Properties

```cypher
// Nodes have labels and properties
CREATE (alice:Person {name: 'Alice', age: 30, email: 'alice@example.com'})
CREATE (bob:Person {name: 'Bob', age: 28})
CREATE (neo4j:Technology {name: 'Neo4j', category: 'Database'})

// Relationships have types, direction, and properties
CREATE (alice)-[:KNOWS {since: 2020, strength: 0.8}]->(bob)
CREATE (alice)-[:USES {proficiency: 'expert', since: 2019}]->(neo4j)
CREATE (bob)-[:USES {proficiency: 'intermediate', since: 2022}]->(neo4j)
```

### Data Modeling Principles

1. **Nodes represent entities** (nouns): Person, Product, Order, Location
2. **Relationships represent connections** (verbs): KNOWS, PURCHASED, LOCATED_IN
3. **Properties store attributes** on both nodes and relationships
4. **Labels categorize nodes** and enable indexing: `:Person`, `:Product`
5. **Relationship types are specific**: `:PURCHASED` not `:HAS_RELATIONSHIP_WITH`

### Modeling Decision: Property vs Relationship

```cypher
// BAD: Storing a category as a property (can't traverse efficiently)
CREATE (p:Product {name: 'Widget', category: 'Electronics'})

// GOOD: Model category as a node for traversal and grouping
CREATE (p:Product {name: 'Widget'})-[:IN_CATEGORY]->(c:Category {name: 'Electronics'})
// Now you can: "Find all products in the same category as Widget"
MATCH (p:Product {name: 'Widget'})-[:IN_CATEGORY]->(c)<-[:IN_CATEGORY]-(similar)
RETURN similar

// RULE: If you need to traverse through it, make it a node.
// If you only filter/display it, a property is fine.
```

## Cypher Query Language

### Basic CRUD

```cypher
// CREATE nodes and relationships
CREATE (u:User {id: 'u1', name: 'Alice', joined: date('2025-01-15')})

// MATCH and RETURN (read)
MATCH (u:User {name: 'Alice'})
RETURN u

// MATCH with relationship pattern
MATCH (u:User)-[:FOLLOWS]->(friend:User)
WHERE u.name = 'Alice'
RETURN friend.name, friend.joined

// UPDATE properties
MATCH (u:User {name: 'Alice'})
SET u.email = 'alice@new-email.com', u.updated = datetime()
RETURN u

// DELETE (must delete relationships first, or use DETACH)
MATCH (u:User {name: 'Alice'})
DETACH DELETE u

// MERGE (create if not exists, match if exists)
MERGE (u:User {id: 'u1'})
ON CREATE SET u.name = 'Alice', u.created = datetime()
ON MATCH SET u.lastSeen = datetime()
RETURN u
```

### Pattern Matching

```cypher
// Friends of friends (2 hops)
MATCH (me:User {name: 'Alice'})-[:FOLLOWS]->()-[:FOLLOWS]->(fof:User)
WHERE NOT (me)-[:FOLLOWS]->(fof) AND me <> fof
RETURN DISTINCT fof.name

// Variable-length paths (1 to 3 hops)
MATCH (start:User {name: 'Alice'})-[:FOLLOWS*1..3]->(reachable:User)
RETURN DISTINCT reachable.name, length(shortestPath((start)-[:FOLLOWS*]->(reachable))) AS distance

// Filtering on relationship properties
MATCH (u:User)-[r:RATED]->(m:Movie)
WHERE r.rating >= 4 AND r.date > date('2025-01-01')
RETURN m.title, avg(r.rating) AS avg_rating, count(r) AS num_ratings
ORDER BY avg_rating DESC

// Negative patterns (users who have NOT watched a movie)
MATCH (u:User)
WHERE NOT (u)-[:WATCHED]->(:Movie {title: 'Inception'})
RETURN u.name

// Optional match (LEFT JOIN equivalent)
MATCH (u:User)
OPTIONAL MATCH (u)-[:FOLLOWS]->(friend:User)
RETURN u.name, count(friend) AS friend_count
```

### Aggregation

```cypher
// Group by with aggregation
MATCH (u:User)-[:PURCHASED]->(p:Product)-[:IN_CATEGORY]->(c:Category)
RETURN c.name AS category,
       count(DISTINCT u) AS unique_buyers,
       count(p) AS total_purchases,
       avg(p.price) AS avg_price
ORDER BY total_purchases DESC

// Collect into lists
MATCH (u:User {name: 'Alice'})-[:PURCHASED]->(p:Product)
RETURN u.name, collect(p.name) AS purchased_products, sum(p.price) AS total_spent

// UNWIND (expand a list into rows)
WITH ['Neo4j', 'Redis', 'PostgreSQL'] AS technologies
UNWIND technologies AS tech
MERGE (t:Technology {name: tech})
RETURN t
```

## Path Algorithms

### Shortest Path

```cypher
// Built-in shortest path
MATCH p = shortestPath(
  (alice:User {name: 'Alice'})-[:KNOWS*..10]-(bob:User {name: 'Bob'})
)
RETURN p, length(p) AS hops

// All shortest paths (may be multiple with same length)
MATCH p = allShortestPaths(
  (alice:User {name: 'Alice'})-[:KNOWS*..10]-(bob:User {name: 'Bob'})
)
RETURN p, length(p)

// Weighted shortest path (Dijkstra) using GDS
CALL gds.shortestPath.dijkstra.stream('myGraph', {
  sourceNode: id(alice),
  targetNode: id(bob),
  relationshipWeightProperty: 'distance'
})
YIELD nodeIds, costs, totalCost
RETURN [nodeId IN nodeIds | gds.util.asNode(nodeId).name] AS path,
       totalCost
```

### Path Filtering

```cypher
// Paths with specific intermediate nodes
MATCH p = (start:City {name: 'New York'})-[:CONNECTED_TO*1..5]-(end:City {name: 'Los Angeles'})
WHERE all(node IN nodes(p) WHERE node.country = 'US')
  AND none(rel IN relationships(p) WHERE rel.cost > 1000)
RETURN p, reduce(total = 0, r IN relationships(p) | total + r.cost) AS total_cost
ORDER BY total_cost ASC
LIMIT 5
```

## Graph Indexing

### Schema Indexes

```cypher
// Unique constraint (also creates an index)
CREATE CONSTRAINT user_email_unique FOR (u:User) REQUIRE u.email IS UNIQUE;

// Node property index (B-tree, for equality and range)
CREATE INDEX user_name_index FOR (u:User) ON (u.name);

// Composite index
CREATE INDEX order_status_date FOR (o:Order) ON (o.status, o.created_at);

// Relationship property index (Neo4j 5.7+)
CREATE INDEX rated_score FOR ()-[r:RATED]-() ON (r.rating);

// Text index (for CONTAINS and regex)
CREATE TEXT INDEX user_bio_text FOR (u:User) ON (u.bio);

// Full-text index (Lucene-based)
CREATE FULLTEXT INDEX productSearch FOR (p:Product) ON EACH [p.name, p.description];
CALL db.index.fulltext.queryNodes('productSearch', 'wireless mouse') YIELD node, score
RETURN node.name, score ORDER BY score DESC LIMIT 10;

// Point index (spatial)
CREATE POINT INDEX location_index FOR (s:Store) ON (s.location);
```

### Index Usage Analysis

```cypher
// View all indexes
SHOW INDEXES;

// Explain query plan (check index usage)
EXPLAIN MATCH (u:User {email: 'alice@example.com'}) RETURN u;

// Profile query (actual execution stats)
PROFILE MATCH (u:User)-[:FOLLOWS*2]->(fof:User)
WHERE u.name = 'Alice'
RETURN DISTINCT fof.name;
// Look for: NodeByLabelScan (bad) vs NodeIndexSeek (good)
```

## Graph Data Science (GDS)

### Community Detection

```cypher
// Project a graph into GDS memory
CALL gds.graph.project('socialGraph',
  'User',
  { FOLLOWS: { orientation: 'UNDIRECTED' } }
);

// Louvain community detection
CALL gds.louvain.write('socialGraph', {
  writeProperty: 'community'
})
YIELD communityCount, modularity;

// Find communities and their members
MATCH (u:User)
RETURN u.community AS community,
       count(u) AS members,
       collect(u.name)[..10] AS sample_members
ORDER BY members DESC;

// Label Propagation (faster, less accurate)
CALL gds.labelPropagation.stream('socialGraph')
YIELD nodeId, communityId
RETURN gds.util.asNode(nodeId).name AS user, communityId
ORDER BY communityId;
```

### Centrality (Influence Analysis)

```cypher
// PageRank (most influential nodes)
CALL gds.pageRank.stream('socialGraph')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name AS user, score
ORDER BY score DESC
LIMIT 20;

// Betweenness Centrality (bridge nodes between communities)
CALL gds.betweenness.stream('socialGraph')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name AS user, score
ORDER BY score DESC
LIMIT 20;

// Degree Centrality
CALL gds.degree.stream('socialGraph')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name AS user, score AS connections
ORDER BY connections DESC
LIMIT 20;
```

## Recommendation Engine

### Collaborative Filtering

```cypher
// "Users who bought X also bought Y"
MATCH (target:User {id: 'u1'})-[:PURCHASED]->(p:Product)<-[:PURCHASED]-(other:User)
MATCH (other)-[:PURCHASED]->(rec:Product)
WHERE NOT (target)-[:PURCHASED]->(rec)
WITH rec, count(DISTINCT other) AS co_purchasers, collect(DISTINCT other.name) AS buyers
RETURN rec.name, co_purchasers, buyers[..5]
ORDER BY co_purchasers DESC
LIMIT 10;

// Content-based with similarity scoring
MATCH (target:User {id: 'u1'})-[r1:RATED]->(m:Movie)<-[r2:RATED]-(other:User)
WHERE r1.rating >= 4 AND r2.rating >= 4
WITH target, other, count(m) AS shared_likes
WHERE shared_likes >= 3
MATCH (other)-[r:RATED]->(rec:Movie)
WHERE r.rating >= 4 AND NOT (target)-[:RATED]->(rec)
RETURN rec.title, count(other) AS recommenders,
       avg(r.rating) AS avg_rating
ORDER BY recommenders DESC, avg_rating DESC
LIMIT 20;

// Hybrid: combine content similarity + collaborative filtering
MATCH (target:User {id: 'u1'})-[:PURCHASED]->(p:Product)-[:IN_CATEGORY]->(cat:Category)
WITH target, collect(DISTINCT cat) AS liked_categories
UNWIND liked_categories AS cat
MATCH (cat)<-[:IN_CATEGORY]-(rec:Product)<-[:PURCHASED]-(others:User)
WHERE NOT (target)-[:PURCHASED]->(rec)
RETURN rec.name, rec.price,
       count(DISTINCT others) AS popularity,
       size([c IN liked_categories WHERE (rec)-[:IN_CATEGORY]->(c)]) AS category_match
ORDER BY category_match DESC, popularity DESC
LIMIT 20;
```

## Knowledge Graphs

### Schema Design for Knowledge Graphs

```cypher
// Entity types as labels
CREATE (e:Entity:Person {name: 'Albert Einstein', born: 1879, died: 1955})
CREATE (e2:Entity:Theory {name: 'General Relativity', year: 1915})
CREATE (e3:Entity:Institution {name: 'Princeton University'})
CREATE (e4:Entity:Award {name: 'Nobel Prize in Physics', year: 1921})

// Rich relationship types
CREATE (e)-[:DEVELOPED {year: 1915}]->(e2)
CREATE (e)-[:AFFILIATED_WITH {from: 1933, to: 1955, role: 'Professor'}]->(e3)
CREATE (e)-[:RECEIVED {year: 1921, field: 'Physics'}]->(e4)

// Querying the knowledge graph
// "What theories were developed by Nobel laureates at Princeton?"
MATCH (p:Person)-[:RECEIVED]->(:Award {name: 'Nobel Prize in Physics'})
MATCH (p)-[:AFFILIATED_WITH]->(i:Institution {name: 'Princeton University'})
MATCH (p)-[:DEVELOPED]->(t:Theory)
RETURN p.name, t.name, t.year
```

### Entity Resolution

```cypher
// Find potential duplicate entities
MATCH (a:Person), (b:Person)
WHERE a.name =~ ('(?i)' + b.name)
  AND id(a) < id(b)
  AND (a.email = b.email OR a.phone = b.phone)
RETURN a, b, a.name, b.name

// Merge duplicates
MATCH (keep:Person {id: 'canonical'}), (dup:Person {id: 'duplicate'})
// Transfer all relationships from duplicate to canonical
CALL apoc.refactor.mergeNodes([keep, dup], {
  properties: 'combine',
  mergeRels: true
}) YIELD node
RETURN node
```

## Performance Best Practices

1. **Always use parameterized queries**: Allows query plan caching
2. **Create indexes on properties used in MATCH/WHERE**: Check with EXPLAIN
3. **Limit variable-length path depth**: `[:KNOWS*1..5]` not `[:KNOWS*]`
4. **Use PROFILE to find performance bottlenecks**: Look for high db hits
5. **Prefer specific relationship types over ANY**: `[:FOLLOWS]` not `[r]`
6. **Use WHERE on properties close to anchored nodes**: Filter early in traversal
7. **Batch writes with UNWIND**: Process arrays of data in single transactions
8. **Monitor with**: `CALL dbms.listQueries()` and `CALL dbms.listTransactions()`

```cypher
// Batch import example
UNWIND $batch AS row
MERGE (u:User {id: row.id})
ON CREATE SET u.name = row.name, u.created = datetime()
WITH u, row
UNWIND row.follows AS followId
MERGE (f:User {id: followId})
MERGE (u)-[:FOLLOWS]->(f)
```

## Output Format

```markdown
# Graph Db Architect Analysis

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

**Input:** "Help me implement graph db architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended graph db architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When graph db architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
