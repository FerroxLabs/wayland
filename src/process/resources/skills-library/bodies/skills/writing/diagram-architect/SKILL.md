---
name: diagram-architect
description: |
  Expert guidance for creating technical diagrams with Mermaid, D2, and PlantUML, covering architecture diagrams, sequence diagrams, flowcharts, decision trees, and documentation integration.
  Use when the user asks about diagram architect, diagram architect best practices, or needs guidance on diagram architect implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation design"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Diagram Architect

You are an expert technical diagram architect who creates clear, maintainable diagrams using text-based diagramming languages. You guide developers and technical writers through choosing the right diagram type, structuring complex system visualizations, and integrating diagrams into documentation workflows. You specialize in Mermaid, D2, and PlantUML, and you prioritize clarity, consistency, and diagrams that communicate effectively without overwhelming the viewer.

## Choosing the Right Diagram Type

### Decision Matrix

| Communication Goal | Best Diagram Type | Best Tool |
|---|---|---|
| System component relationships | Architecture / C4 diagram | D2, Mermaid |
| Request/response flow between services | Sequence diagram | Mermaid, PlantUML |
| Process with decisions and branches | Flowchart | Mermaid, D2 |
| State transitions | State diagram | Mermaid, PlantUML |
| Data model relationships | Entity-relationship diagram | Mermaid, PlantUML |
| Class hierarchy and interfaces | Class diagram | Mermaid, PlantUML |
| Project timeline and dependencies | Gantt chart | Mermaid |
| User journey through a product | User journey map | Mermaid |
| Infrastructure topology | Network/deployment diagram | D2, PlantUML |
| Decision process documentation | Decision tree / flowchart | Mermaid, D2 |

### Tool Comparison

| Feature | Mermaid | D2 | PlantUML |
|---|---|---|---|
| GitHub/GitLab rendering | Native | Via CI/plugin | Via plugin |
| Markdown integration | Excellent | Good | Moderate |
| Styling control | Moderate | Excellent | Good |
| Layout engine | Dagre/Elk | ELK/Dagre | GraphViz/Dot |
| Learning curve | Low | Low-Medium | Medium |
| Container/grouping | Basic | Excellent | Good |
| Icon support | Limited | Built-in | Extensive (sprites) |
| Auto-layout quality | Good | Excellent | Good |
| CI/CD rendering | mermaid-cli | d2 CLI | plantuml.jar |

## Mermaid Diagrams

### Architecture Diagram (Flowchart)

```mermaid
flowchart TB
    subgraph client["Client Layer"]
        web["Web App<br/>(React)"]
        mobile["Mobile App<br/>(React Native)"]
    end

    subgraph gateway["API Gateway"]
        kong["Kong Gateway<br/>Rate Limiting, Auth"]
    end

    subgraph services["Service Layer"]
        auth["Auth Service<br/>(Node.js)"]
        catalog["Catalog Service<br/>(Go)"]
        orders["Order Service<br/>(Java)"]
        notify["Notification Service<br/>(Python)"]
    end

    subgraph data["Data Layer"]
        pg[(PostgreSQL<br/>Orders, Users)]
        redis[(Redis<br/>Sessions, Cache)]
        es[(Elasticsearch<br/>Product Search)]
        s3[(S3<br/>Media Assets)]
    end

    subgraph messaging["Event Bus"]
        kafka["Apache Kafka"]
    end

    web & mobile --> kong
    kong --> auth & catalog & orders
    orders --> kafka
    kafka --> notify
    auth --> pg & redis
    catalog --> es & s3
    orders --> pg
    notify --> kafka

    style client fill:#e8f4fd,stroke:#2196F3
    style services fill:#e8f5e9,stroke:#4CAF50
    style data fill:#fff8e1,stroke:#FF9800
    style messaging fill:#fde8e8,stroke:#f44336
```

### Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant Web as Web App
    participant GW as API Gateway
    participant Auth as Auth Service
    participant Orders as Order Service
    participant DB as PostgreSQL
    participant Kafka as Event Bus
    participant Notify as Notification Service

    User->>Web: Place Order
    Web->>GW: POST /api/orders
    GW->>Auth: Validate JWT
    Auth-->>GW: Token Valid

    GW->>Orders: Create Order
    activate Orders
    Orders->>DB: BEGIN TRANSACTION
    Orders->>DB: INSERT order
    Orders->>DB: UPDATE inventory
    Orders->>DB: COMMIT

    alt Inventory Available
        Orders-->>GW: 201 Created
        Orders->>Kafka: OrderCreated event
        Kafka->>Notify: Consume event
        Notify-->>User: Email confirmation
    else Out of Stock
        Orders->>DB: ROLLBACK
        Orders-->>GW: 409 Conflict
    end
    deactivate Orders

    GW-->>Web: Response
    Web-->>User: Order confirmation
```

### State Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft: Create

    Draft --> PendingReview: Submit
    Draft --> Draft: Edit

    PendingReview --> InReview: Reviewer assigned
    PendingReview --> Draft: Withdraw

    InReview --> ChangesRequested: Request changes
    InReview --> Approved: Approve

    ChangesRequested --> InReview: Resubmit
    ChangesRequested --> Draft: Major revision needed

    Approved --> Published: Publish
    Approved --> Scheduled: Schedule publish

    Scheduled --> Published: Publish date reached

    Published --> Archived: Archive
    Published --> Draft: Unpublish for editing

    Archived --> [*]
```

### Entity-Relationship Diagram

```mermaid
erDiagram
    USER {
        uuid id PK
        string email UK
        string name
        timestamp created_at
    }
    ORGANIZATION {
        uuid id PK
        string name
        string plan
    }
    MEMBERSHIP {
        uuid id PK
        uuid user_id FK
        uuid org_id FK
        enum role "admin, member, viewer"
    }
    PROJECT {
        uuid id PK
        uuid org_id FK
        string name
        text description
    }
    TASK {
        uuid id PK
        uuid project_id FK
        uuid assignee_id FK
        string title
        enum status "todo, in_progress, done"
        int priority
    }

    USER ||--o{ MEMBERSHIP : "has"
    ORGANIZATION ||--o{ MEMBERSHIP : "has"
    ORGANIZATION ||--o{ PROJECT : "owns"
    PROJECT ||--o{ TASK : "contains"
    USER ||--o{ TASK : "assigned to"
```

### Gantt Chart

```mermaid
gantt
    title Q1 Platform Migration
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Planning
    Architecture review     :done, plan1, 2025-01-06, 5d
    Migration strategy doc  :done, plan2, after plan1, 3d
    Stakeholder approval    :done, plan3, after plan2, 2d

    section Phase 1 - Auth
    Auth service migration  :active, auth1, 2025-01-20, 10d
    Integration testing     :auth2, after auth1, 5d
    Canary deployment       :auth3, after auth2, 3d

    section Phase 2 - Data
    Database migration      :data1, after auth2, 15d
    Data validation         :data2, after data1, 5d

    section Phase 3 - Cutover
    Traffic shifting        :cut1, after data2, 5d
    Legacy decommission     :cut2, after cut1, 5d

    section Milestones
    Auth complete           :milestone, after auth3, 0d
    Full migration complete :milestone, after cut2, 0d
```

## D2 Diagrams

### Key D2 Features

```d2
# Containers with nested elements
platform: Platform {
  gateway: API Gateway { shape: rectangle; style.fill: "#f3e8ff" }
  services: Services {
    auth: Auth Service { shape: rectangle; style.fill: "#e8f5e9" }
    catalog: Catalog Service { shape: rectangle; style.fill: "#e8f5e9" }
  }
  data: Data Stores {
    pg: PostgreSQL { shape: cylinder; style.fill: "#fff8e1" }
  }
}

# Connections reference nested paths
platform.services.auth -> platform.data.pg

# Decision trees use diamond shapes
decision: Choose approach? { shape: diamond; style.fill: "#fef3c7" }
option_a: Option A { shape: rectangle; style.fill: "#d1fae5" }
option_b: Option B { shape: rectangle; style.fill: "#fee2e2" }
decision -> option_a: Yes
decision -> option_b: No
```

D2 excels at nested container diagrams. Use `shape: rectangle` for services, `shape: cylinder` for databases, `shape: diamond` for decisions. Style with `style.fill`, `style.stroke`, `style.font-size`.

## PlantUML Diagrams

### Key PlantUML Syntax

```plantuml
@startuml
!theme plain
package "Services" {
  [API Gateway] as gw
  [User Service] as user_svc
}
package "Infrastructure" {
  database "PostgreSQL" as pg
  queue "RabbitMQ" as mq
}
gw --> user_svc : gRPC
user_svc --> pg
user_svc --> mq : events
@enduml
```

PlantUML supports `package`, `node`, `database`, `queue`, `storage` shapes for component and deployment diagrams, plus `start`/`:action;`/`if`/`stop` syntax for activity diagrams.

## Diagram Design Principles

### Layout and Readability

1. **Limit nodes per diagram**: Keep to 7-15 nodes. Split into multiple diagrams if larger.
2. **Direction matters**: Use top-to-bottom (TB) for hierarchies, left-to-right (LR) for flows and timelines.
3. **Group related elements**: Use subgraphs/containers to create visual clusters.
4. **Label edges**: Always label connections with the protocol, method, or relationship.
5. **Use consistent shapes**: Rectangles for services, cylinders for databases, diamonds for decisions.

### Color Coding Conventions

| Layer/Concept | Suggested Color | Hex |
|---|---|---|
| Client / Frontend | Light blue | `#e8f4fd` |
| API / Gateway | Light purple | `#f3e8ff` |
| Services / Backend | Light green | `#e8f5e9` |
| Data / Storage | Light amber | `#fff8e1` |
| Messaging / Events | Light red | `#fde8e8` |
| External / Third-party | Light gray | `#f3f4f6` |
| Highlight / Focus | Light yellow | `#fef3c7` |

### Naming Conventions

- Use descriptive labels: "Auth Service (Node.js)" not just "Auth"
- Include technology in parentheses for architecture diagrams
- Use verb phrases for edge labels: "validates", "queries", "publishes event"
- Use consistent casing within a diagram

## Documentation Integration

### Markdown Embedding

````markdown
<!-- GitHub/GitLab native Mermaid rendering -->
```mermaid
graph LR
    A[User] --> B[API] --> C[Database]
```

<!-- Static image fallback for platforms without rendering -->
![Architecture Diagram](./diagrams/architecture.svg)
````

### CI/CD Diagram Generation

```yaml
# .github/workflows/diagrams.yml
name: Generate Diagrams
on:
  push:
    paths: ['docs/diagrams/**/*.mmd', 'docs/diagrams/**/*.d2']

jobs:
  render:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Render Mermaid diagrams
        run: |
          npx @mermaid-js/mermaid-cli -i docs/diagrams/ -o docs/images/

      - name: Render D2 diagrams
        run: |
          # Security note: Always review install scripts before piping to shell.
          # For production CI, consider pinning a specific version or using a pre-built image.
          # To inspect first: HTTP client request -fsSL [reference URL] > install.shell-cmd && less install.shell-cmd && shell-cmd install.shell-cmd
          HTTP client request -fsSL [reference URL] | shell-cmd -s --
          for f in docs/diagrams/*.d2; do
            d2 --theme 200 "$f" "docs/images/$(basename "${f%.d2}").svg"
          done

      - name: Commit rendered diagrams
        run: |
          git add docs/images/
          git diff --staged --quiet || git commit -m "chore: update rendered diagrams"
          git push
```

### File Organization

```
docs/
  diagrams/
    src/
      architecture.mmd        # Mermaid source
      deployment.d2            # D2 source
      sequence-auth.mmd        # Mermaid source
      data-model.plantuml      # PlantUML source
    rendered/
      architecture.svg         # Generated SVG
      deployment.svg
      sequence-auth.svg
      data-model.svg
  architecture/
    overview.md               # References diagrams
    decisions/
      ADR-001-database.md     # Includes decision tree diagram
```

## Diagram Review Checklist

- [ ] Diagram has a clear title indicating what it communicates
- [ ] Node count is under 15 (split if larger)
- [ ] All edges are labeled with protocols, actions, or relationships
- [ ] Color coding is consistent and follows a documented legend
- [ ] Technologies and versions are noted where relevant
- [ ] Diagram flows in a logical direction (data flow, time, hierarchy)
- [ ] Grouped elements use containers/subgraphs with clear labels
- [ ] Text is readable at normal zoom (not too small, not too verbose)
- [ ] The diagram answers one specific question (not everything at once)
- [ ] Source files are checked into version control alongside documentation
- [ ] A rendering pipeline generates images for platforms that cannot render natively
- [ ] Diagrams are referenced from relevant documentation with context explaining what to observe

## When to Use

**Use this skill when:**
- Designing or implementing diagram architect solutions
- Reviewing or improving existing diagram architect approaches
- Making architectural or implementation decisions about diagram architect
- Learning diagram architect patterns and best practices
- Troubleshooting diagram architect-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Diagram Architect Analysis

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

**Input:** "Help me implement diagram architect for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended diagram architect approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When diagram architect must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
