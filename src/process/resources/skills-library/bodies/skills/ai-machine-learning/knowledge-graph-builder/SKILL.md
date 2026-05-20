---
name: knowledge-graph-builder
description: |
  Knowledge graph engineering covering ontology design, graph database selection (Neo4j, Amazon Neptune, ArangoDB), entity and relation extraction from text, graph-based RAG (GraphRAG), knowledge graph embeddings, graph query optimization, and integration patterns with LLM systems.
  Use when the user asks about knowledge graph builder, knowledge graph builder best practices, or needs guidance on knowledge graph builder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "ai-ml guide best-practices"
  category: "ai-machine-learning"
  subcategory: "applied-ai"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Knowledge Graph Builder

## Overview

Knowledge graphs represent structured relationships between entities, enabling powerful reasoning, contextual retrieval, and explainable AI. Building production knowledge graphs requires ontology design, entity extraction, graph database selection, query optimization, and integration with LLM systems via GraphRAG patterns.

## Knowledge Graph Architecture

```
+------------------+     +-------------------+     +------------------+
| Data Sources     | --> | Extraction        | --> | Graph Database   |
| - Documents      |     | - NER             |     | (Person)-[:WORKS_AT]->(Company)
| - APIs           |     | - Relation extract|     | (Paper)-[:CITES]->(Paper)
| - Databases      |     | - Entity linking  |     | (Product)-[:HAS]->(Feature)
+------------------+     +-------------------+     +------------------+
                                                          |
+------------------+     +-------------------+     +------v-----------+
| Applications     | <-- | Query & Reasoning | <-- | Indexing &       |
| - GraphRAG       |     | - Cypher / SPARQL |     | Enrichment       |
| - Recommendations|     | - Path finding    |     | - Embeddings     |
| - Analytics      |     | - Subgraph match  |     | - Community det. |
+------------------+     +-------------------+     +------------------+
```

## Graph Database Selection

| Feature | Neo4j | Amazon Neptune | ArangoDB | TigerGraph | Dgraph |
|---------|-------|---------------|----------|------------|--------|
| Query Lang | Cypher | Gremlin/SPARQL | AQL | GSQL | GraphQL+- |
| Hosting | Both | Managed (AWS) | Both | Both | Both |
| Vector Support | Since 5.13 | No | No | No | No |
| RDF Support | Limited | Native | No | No | No |
| Community | Very Large | AWS ecosystem | Medium | Medium | Medium |
| Learning Curve | Low | Medium | Medium | High | Medium |

```
Selection guide:
  AWS native? -> Amazon Neptune
  Need RDF/SPARQL? -> Neptune or Apache Jena
  Graph + document hybrid? -> ArangoDB (multi-model)
  SQL-like preferred? -> Neo4j (Cypher is most approachable)
  GraphQL preferred? -> Dgraph
  Enterprise trillions of edges? -> TigerGraph
  Default -> Neo4j (largest community, vector search, mature)
```

## Ontology Design

### Design Process

```
1. Start with competency questions
   "Who authored papers about topic X?"
   "What products share features?"

2. Identify entity types (nouns in questions)

3. Define relationship types (verbs connecting nouns)
   Always directional: (Subject)-[:VERB]->(Object)

4. Add properties (attributes of nodes and edges)
   Include temporal properties (created_at, valid_from)

5. Define constraints (uniqueness, required props, cardinality)
```

### Schema in Neo4j

```cypher
CREATE CONSTRAINT person_id IF NOT EXISTS
FOR (p:Person) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT company_id IF NOT EXISTS
FOR (c:Company) REQUIRE c.id IS UNIQUE;

CREATE FULLTEXT INDEX entity_search IF NOT EXISTS
FOR (n:Person|Company|Paper) ON EACH [n.name, n.title, n.description];

CREATE VECTOR INDEX entity_embeddings IF NOT EXISTS
FOR (n:Entity) ON (n.embedding)
OPTIONS {indexConfig: {
  `vector.dimensions`: 1536,
  `vector.similarity_function`: 'cosine'
}};
```

### Common Ontology Patterns

```
Temporal:     (Person)-[:WORKS_AT {from: date, to: date}]->(Company)
Hierarchical: (Category)-[:SUBCATEGORY_OF]->(Category)
Provenance:   (Fact)-[:EXTRACTED_FROM {confidence: 0.95}]->(Document)
Events:       (Person)-[:PARTICIPATED_IN]->(Event)-[:OCCURRED_AT]->(Location)
Multi-hop:    (Drug)-[:TREATS]->(Disease)-[:HAS_SYMPTOM]->(Symptom)
```

## Entity and Relation Extraction

### LLM-Based Extraction

```python
from openai import OpenAI
import json

class KnowledgeExtractor:
    def __init__(self, model: str = "gpt-4o-mini"):
        self.client = OpenAI()
        self.model = model

    def extract(self, text: str, schema: dict = None) -> dict:
        schema_inst = ""
        if schema:
            schema_inst = (f"\nEntity types: {schema.get('entity_types', [])}\n"
                          f"Relation types: {schema.get('relation_types', [])}\n")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Extract precise entities and relationships. "
                 "Only extract what is explicitly stated or strongly implied."},
                {"role": "user", "content": f"Extract entities and relationships:{schema_inst}\n"
                 f"Return JSON: {{\"entities\": [{{\"id\", \"type\", \"name\", \"properties\"}}], "
                 f"\"relationships\": [{{\"source\", \"target\", \"type\", \"properties\"}}]}}\n\n"
                 f"Text: {text}"},
            ],
            response_format={"type": "json_object"}, temperature=0,
        )
        return json.loads(response.choices[0].message.content)

    def extract_batch(self, documents: list[str], schema: dict = None) -> dict:
        all_entities = {}
        all_rels = []
        for doc in documents:
            result = self.extract(doc, schema)
            for e in result.get("entities", []):
                key = (e["type"], e["name"].lower())
                if key not in all_entities:
                    all_entities[key] = e
                else:
                    all_entities[key]["properties"].update(e.get("properties", {}))
            all_rels.extend(result.get("relationships", []))
        return {"entities": list(all_entities.values()), "relationships": all_rels}
```

### Extraction Method Comparison

| Method | Speed | Quality | Cost | Best For |
|--------|-------|---------|------|----------|
| SpaCy NER | Very Fast | Good | Free | Standard entities, high volume |
| LLM extraction | Slow | Excellent | API cost | Complex relations, custom schema |
| Fine-tuned BERT | Fast | Very Good | Free (GPU) | Domain-specific entities |
| Hybrid (SpaCy + LLM) | Medium | Excellent | Moderate | Best quality/cost balance |

## GraphRAG

### GraphRAG vs. Vector RAG

| Dimension | Vector RAG | GraphRAG | Hybrid |
|-----------|-----------|----------|--------|
| Retrieval | Semantic similarity | Structural traversal | Both |
| Reasoning | Limited | Multi-hop relationships | Strong |
| Explainability | Low | High (explicit paths) | High |
| Setup complexity | Low | High | High |
| Best for | Unstructured Q&A | Relational questions | Complex domains |

### Implementation

```python
from neo4j import GraphDatabase

class GraphRAGPipeline:
    def __init__(self, neo4j_uri: str, neo4j_auth: tuple, llm_model: str = "gpt-4o"):
        self.driver = GraphDatabase.driver(neo4j_uri, auth=neo4j_auth)
        self.client = OpenAI()
        self.llm_model = llm_model

    def query(self, question: str) -> dict:
        entities = self._extract_query_entities(question)
        subgraph = self._retrieve_subgraph(entities)
        answer = self._generate_answer(question, subgraph)
        return {"answer": answer, "entities_found": entities,
                "subgraph_nodes": len(subgraph["nodes"])}

    def _extract_query_entities(self, question: str) -> list[str]:
        resp = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content":
                f"Extract entity names. JSON: {{\"entities\": [...]}}\nQuestion: {question}"}],
            response_format={"type": "json_object"}, temperature=0,
        )
        return json.loads(resp.choices[0].message.content).get("entities", [])

    def _retrieve_subgraph(self, entities: list[str], hops: int = 2) -> dict:
        nodes, edges = [], []
        with self.driver.session() as session:
            for entity in entities:
                result = session.run("""
                    CALL db.index.fulltext.queryNodes('entity_search', $name)
                    YIELD node, score WHERE score > 0.5
                    WITH node LIMIT 5
                    CALL apoc.path.subgraphAll(node, {maxLevel: $hops, limit: 50})
                    YIELD nodes, relationships
                    RETURN nodes, relationships
                """, name=entity, hops=hops)
                for record in result:
                    nodes.extend([{"labels": list(n.labels), "props": dict(n)} for n in record["nodes"]])
                    edges.extend([{"type": r.type} for r in record["relationships"]])
        return {"nodes": nodes, "edges": edges}

    def _generate_answer(self, question: str, subgraph: dict) -> str:
        context = "\n".join(
            f"[{'/'.join(n['labels'])}] {n['props']}" for n in subgraph["nodes"][:30]
        )
        resp = self.client.chat.completions.create(
            model=self.llm_model,
            messages=[
                {"role": "system", "content": "Answer using the knowledge graph context. Cite entities."},
                {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
            ], temperature=0,
        )
        return resp.choices[0].message.content
```

## Knowledge Graph Embeddings

| Model | Approach | Best For |
|-------|----------|----------|
| TransE | Translational (h + r = t) | Hierarchical relations |
| DistMult | Bilinear diagonal | Symmetric relations |
| ComplEx | Complex-valued bilinear | Asymmetric relations |
| RotatE | Rotational | Inferring new relations |

## Query Optimization

```cypher
-- Bound traversal depth (never use unbounded [*])
MATCH (a:Person {name: "Alice"})-[*1..3]->(b:Company)
RETURN b.name;

-- Use full-text index instead of CONTAINS
CALL db.index.fulltext.queryNodes('entity_search', 'Alice') YIELD node;

-- Profile to find bottlenecks
PROFILE MATCH (a:Person)-[:WORKS_AT]->(c:Company)-[:LOCATED_IN]->(city:City)
WHERE city.name = "San Francisco"
RETURN a.name, c.name;

-- Use parameters (enables query plan caching)
MATCH (p:Person {name: $name}) RETURN p;
```

## Checklist

- [ ] Define competency questions the graph must answer
- [ ] Design ontology with entity types, relationships, and constraints
- [ ] Select graph database based on deployment, scale, and team expertise
- [ ] Build entity extraction pipeline (SpaCy for speed, LLM for quality)
- [ ] Implement relation extraction with confidence scoring
- [ ] Set up entity linking and deduplication across documents
- [ ] Create graph indexes (full-text, vector, composite)
- [ ] Implement GraphRAG pipeline for LLM-powered Q&A
- [ ] Optimize queries with bounded traversals and index usage
- [ ] Plan incremental update strategy for evolving knowledge bases
- [ ] Monitor graph quality (completeness, consistency, freshness)

## When to Use

**Use this skill when:**
- Designing or implementing knowledge graph builder solutions
- Reviewing or improving existing knowledge graph builder approaches
- Making architectural or implementation decisions about knowledge graph builder
- Learning knowledge graph builder patterns and best practices
- Troubleshooting knowledge graph builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Knowledge Graph Builder Analysis

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

**Input:** "Help me implement knowledge graph builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended knowledge graph builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When knowledge graph builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
