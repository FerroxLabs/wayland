---
name: documentation-as-code
description: |
  Treating documentation as a first-class engineering artifact with docs-in-repo workflows, automated generation, living documentation, testing, and continuous publishing pipelines.
  Use when the user asks about documentation as code, documentation as code best practices, or needs guidance on documentation as code implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices clean-code documentation"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Documentation as Code

You are an expert in documentation-as-code practices. Build documentation systems where docs live alongside code, are version-controlled, reviewed in pull requests, tested in CI, and published automatically. Documentation that is separated from code rots. Documentation that is part of the development workflow stays alive.

## Questions to Ask First

Before establishing a documentation-as-code practice, understand the landscape:

1. **What documentation exists today and where does it live?** (Wiki, Confluence, Google Docs, README files, nothing)
2. **Who writes documentation?** (Developers only, technical writers, product managers)
3. **Who reads documentation?** (Internal developers, external API consumers, end users, ops teams)
4. **What types of docs are needed?** (API reference, guides, tutorials, architecture decisions, runbooks)
5. **What is the current pain point?** (Outdated docs, scattered docs, no docs, hard to find)
6. **What is the tech stack?** (Determines which auto-generation tools are available)
7. **What is the publishing target?** (Static site, internal portal, PDF, embedded in product)
8. **What CI/CD system is in place?** (GitHub Actions, GitLab CI, Jenkins)

## Documentation Types and Where They Live

### Decision Matrix: What Goes Where

```
DOCUMENT TYPE          | LOCATION               | FORMAT     | AUDIENCE
-----------------------|------------------------|------------|----------
API reference          | Generated from code    | OpenAPI/   | Developers
                       | annotations            | JSDoc/etc  | (consumers)
                       |                        |            |
Architecture decisions | docs/adr/              | Markdown   | Engineering
                       |                        |            | team
                       |                        |            |
Onboarding guide       | docs/guides/           | Markdown   | New team
                       |                        |            | members
                       |                        |            |
Runbooks               | docs/runbooks/         | Markdown   | On-call
                       |                        |            | engineers
                       |                        |            |
Component README       | Next to the code       | Markdown   | Contributors
                       | (src/auth/README.md)   |            |
                       |                        |            |
Changelog              | CHANGELOG.md (root)    | Markdown   | All consumers
                       |                        |            |
Configuration guide    | docs/config/           | Markdown   | Ops/DevOps
                       |                        |            |
Tutorials              | docs/tutorials/        | Markdown   | New users
                       |                        |            |
Inline code docs       | In source files        | Comments/  | Contributors
                       |                        | Docstrings |
```

### Repository Documentation Structure

```
project/
  docs/
    index.md                    # Documentation home page
    getting-started.md          # Quick start for new users
    architecture/
      overview.md               # System architecture overview
      diagrams/                 # Architecture diagrams (as code)
        system-context.puml
        container.puml
    adr/                        # Architecture Decision Records
      0001-use-postgresql.md
      0002-adopt-event-sourcing.md
      template.md
    guides/
      onboarding.md             # New developer setup
      deployment.md             # How to deploy
      troubleshooting.md        # Common issues and fixes
    runbooks/
      incident-response.md
      database-failover.md
    api/
      generated/                # Auto-generated API docs
    config/
      environment-variables.md
      feature-flags.md
  src/
    auth/
      README.md                 # Module-level documentation
    payments/
      README.md
  CHANGELOG.md
  CONTRIBUTING.md
  README.md                     # Project root README
```

## Architecture Decision Records (ADRs)

### ADR Template

```markdown
# ADR-NNNN: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-NNNN]

## Date
YYYY-MM-DD

## Context
[What is the issue that we are seeing that is motivating this decision?
What technical, business, or team constraints exist?]

## Decision
[What is the change that we are proposing and/or doing?
State the decision clearly and concisely.]

## Consequences

### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Trade-off 1]
- [Trade-off 2]

### Neutral
- [Side effect that is neither clearly positive nor negative]

## Alternatives Considered

### [Alternative 1 Name]
[Brief description and why it was rejected]

### [Alternative 2 Name]
[Brief description and why it was rejected]
```

### ADR Workflow

```
WHEN TO WRITE AN ADR:
- Choosing a database, framework, or major library
- Deciding on an architectural pattern (microservices, event sourcing)
- Making a significant trade-off (consistency vs availability)
- Adopting or dropping a tool/practice
- Any decision that a new team member would ask "why?"

ADR LIFECYCLE:
1. Author writes ADR as part of the PR that implements the decision
2. Team reviews the ADR alongside the code
3. ADR is merged when the decision is accepted
4. If superseded, update status and link to the new ADR
5. Never delete ADRs - they are a historical record
```

## Auto-Generated API Documentation

### From Code Annotations (JSDoc/TypeScript)

```typescript
/**
 * Retrieves a user by their unique identifier.
 *
 * @param id - The UUID of the user to get
 * @returns The user object if found
 * @throws {NotFoundError} When no user exists with the given ID
 * @throws {ForbiddenError} When the caller lacks permission to view this user
 *
 * @example
 * const user = await userService.getById("550e8400-e29b-41d4-a716-446655440000");
 * console.log(user.email);
 */
async getById(id: string): Promise<User> {
  // implementation
}
```

### Auto-Generation Approaches

```
LANGUAGE-SPECIFIC TOOLS:
- TypeScript/JavaScript: TypeDoc, JSDoc -> generates HTML/Markdown from annotations
- Python: Sphinx with autodoc, pdoc -> generates from docstrings
- Java/Kotlin: Javadoc, Dokka -> standard ecosystem tooling
- Go: godoc -> generates from standard comment conventions
- Rust: rustdoc -> built into the toolchain

FRAMEWORK-SPECIFIC:
- FastAPI/Pydantic: Auto-generates OpenAPI spec from type annotations
- Spring Boot: Springdoc generates OpenAPI from annotations
- GraphQL: Schema introspection generates reference docs automatically

KEY PRINCIPLE: Write documentation in the code (annotations, docstrings,
type hints), then generate the reference docs. One source of truth.
```

## Diagrams as Code

### Diagram Tools

```
TOOLS FOR DIAGRAMS AS CODE:
- PlantUML: Rich UML and C4 model support, text-based
- Mermaid: GitHub-native rendering, simpler syntax
- D2: Modern declarative diagramming language
- Structurizr: C4 model focused, workspace-as-code

STORE DIAGRAM SOURCE IN REPO:
  docs/diagrams/system-context.puml
  docs/diagrams/container.mermaid

Generate images in CI, or use tools that render from source
(GitHub renders Mermaid natively in markdown).
```

### Mermaid Diagrams (GitHub-Native)

```markdown
## Order State Machine

    ```mermaid
    stateDiagram-v2
        [*] --> Pending: Order Created
        Pending --> Confirmed: Payment Received
        Pending --> Cancelled: Timeout (30 min)
        Pending --> Cancelled: User Cancels
        Confirmed --> Processing: Inventory Reserved
        Processing --> Shipped: Tracking Number Assigned
        Shipped --> Delivered: Delivery Confirmed
        Shipped --> Returned: Return Initiated
        Delivered --> [*]
        Returned --> Refunded: Return Received
        Refunded --> [*]
        Cancelled --> [*]
    ```
```

## Documentation Testing

### Documentation CI Pipeline

```
CI CHECKS FOR DOCUMENTATION:
1. Markdown linting (markdownlint) - consistent formatting
2. Link checking (markdown-link-check) - no broken internal/external links
3. Code example validation - extract and compile/lint code blocks
4. API doc freshness - regenerate and diff against committed docs
5. Spell checking (cspell) - catch typos
6. Build verification - docs site builds without errors

TRIGGER ON:
- Changes to docs/** or *.md files
- Changes to source code (may affect generated API docs)
```

## Documentation Review Checklist

### For Pull Requests That Change Code

```
DOCUMENTATION REVIEW:
- [ ] New public functions/methods have docstrings or JSDoc
- [ ] Changed behavior is reflected in relevant docs
- [ ] New configuration options are documented
- [ ] New environment variables are added to config guide
- [ ] API changes are reflected in OpenAPI spec
- [ ] Breaking changes are noted in CHANGELOG
- [ ] Error messages are clear enough to serve as documentation
- [ ] README is updated if setup process changed
```

### For Pull Requests That Change Documentation

```
DOCUMENTATION QUALITY:
- [ ] Content is accurate (technically correct)
- [ ] Audience is clear (who is this for?)
- [ ] Examples are working and tested
- [ ] Links are valid and point to correct targets
- [ ] No placeholder text or TODO items remaining
- [ ] Formatting is consistent with other docs
- [ ] Diagrams are updated if architecture changed
- [ ] Spelling and grammar are correct
```

## Continuous Documentation Publishing

```
PUBLISHING PIPELINE (on merge to main):
1. Generate API docs from source code annotations
2. Build static site (MkDocs, Docusaurus, Hugo, Sphinx)
3. Deploy to hosting (GitHub Pages, Netlify, S3, Vercel)

POPULAR DOCUMENTATION SITE GENERATORS:
- MkDocs (Material theme): Python ecosystem, excellent search
- Docusaurus: React-based, versioning built in
- Hugo: Fast builds, Go-based
- Sphinx: Python standard, rich cross-referencing
- VitePress: Vue-based, lightweight
```

## Writing Guidelines for Engineering Documentation

### The Four-Document Model

Attribution: This categorization is informed by the Diataxis framework developed by Daniele Procida, which organizes documentation into four distinct types based on user needs.

```
1. TUTORIALS (Learning-oriented)
   - Guide the reader through a complete task
   - Step-by-step, hands-on
   - "Follow along and build a working example"
   - Example: "Build your first API endpoint in 15 minutes"

2. HOW-TO GUIDES (Task-oriented)
   - Solve a specific problem
   - Assume the reader already knows the basics
   - "Here is how to accomplish X"
   - Example: "How to add authentication to an endpoint"

3. REFERENCE (Information-oriented)
   - Describe the system accurately and completely
   - No narrative, just facts
   - "What are all the configuration options?"
   - Example: API reference, configuration reference

4. EXPLANATION (Understanding-oriented)
   - Provide background and context
   - Discuss alternatives and trade-offs
   - "Why does the system work this way?"
   - Example: Architecture decisions, design rationale
```

### Writing Style Rules

```
1. USE ACTIVE VOICE:
   Bad:  "The configuration file is read by the application on startup."
   Good: "The application reads the configuration file on startup."

2. USE PRESENT TENSE:
   Bad:  "The server will return a 404 error."
   Good: "The server returns a 404 error."

3. BE SPECIFIC:
   Bad:  "Set the timeout to a reasonable value."
   Good: "Set the timeout to 30 seconds for API calls and 5 seconds for health checks."

4. SHOW, DO NOT JUST TELL:
   Bad:  "You can configure logging levels."
   Good: "Set the LOG_LEVEL environment variable to debug, info, warn, or error:
          LOG_LEVEL=debug npm start"

5. USE CONSISTENT TERMINOLOGY:
   Pick one term and use it everywhere. Do not alternate between
   "user", "customer", "account holder", and "client" for the same concept.
   Create a glossary if terms are ambiguous.

6. FRONTLOAD IMPORTANT INFORMATION:
   Bad:  "After configuring the database connection string, setting up
          the cache layer, and enabling logging, you can start the server."
   Good: "To start the server: npm start.
          Prerequisites: database connection, cache, and logging must be configured."
```

## Measuring Documentation Health

```
METRICS:
- Documentation coverage: % of public APIs with docs
- Freshness: Average age of last update per document
- Broken link count: Total broken internal and external links
- Search success rate: % of searches that lead to a click
- Feedback score: Reader ratings or thumbs up/down
- Build pass rate: % of docs CI builds that pass
- Time to first contribution: How quickly new hires update docs

HEALTH INDICATORS:
  HEALTHY:  Docs updated in same PR as code, CI passes, < 5 broken links
  WARNING:  Docs lag code by > 1 sprint, occasional CI failures
  CRITICAL: Docs are months stale, no CI, developers say "ignore the docs"
```

## Common Anti-Patterns

```
1. DOCUMENTATION ISLAND: Docs in a separate wiki with no code connection.
   FIX: Move docs into the repository. Review alongside code.

2. WALL OF TEXT: Single massive README with no structure.
   FIX: Break into files by topic. Use headings and table of contents.

3. DOCUMENTING IMPLEMENTATION: Describing SQL queries instead of behavior.
   FIX: Document what a function does and when it fails, not how.

4. NO MAINTENANCE PROCESS: Written once, never updated, no ownership.
   FIX: Assign team ownership. Include docs in definition of done.
   Run freshness checks in CI. Schedule quarterly doc reviews.
```

## When to Use

**Use this skill when:**
- Designing or implementing documentation as code solutions
- Reviewing or improving existing documentation as code approaches
- Making architectural or implementation decisions about documentation as code
- Learning documentation as code patterns and best practices
- Troubleshooting documentation as code-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Documentation As Code Analysis

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

**Input:** "Help me implement documentation as code for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended documentation as code approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When documentation as code must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
