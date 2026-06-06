---
name: technical-blog-writer
description: |
  Engineering blog post creation covering article structure and narrative arc, technical explanation techniques, code example design, diagram creation, SEO optimization for developer content, editorial process, audience calibration, measuring post impact, and building a consistent publishing cadence.
  Use when the user asks about technical blog writer, technical blog writer best practices, or needs guidance on technical blog writer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation blog-post"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Technical Blog Writer

## Overview

Technical blog writing communicates engineering ideas, decisions, and learnings to a developer audience. The best engineering blogs build trust, attract talent, share knowledge, and establish thought leadership. This skill covers crafting compelling technical articles: from choosing topics and structuring narratives, through writing clear explanations with effective code examples, to optimizing for discovery and measuring impact.

## Article Archetypes

### Common Technical Blog Post Types

```
Type                  Structure                    Example Title
------------------------------------------------------------------------
How-We-Built-It      Problem -> Solution ->        "How We Migrated 2TB
                     Results -> Lessons            to PostgreSQL with
                                                   Zero Downtime"

Deep Dive            Concept -> Internals ->       "How JavaScript
                     Implementation ->             Garbage Collection
                     Implications                  Really Works"

Comparison           Criteria -> Analysis ->       "Kafka vs Pulsar:
                     Benchmarks -> Verdict         A Practical Comparison
                                                   for Event Streaming"

Postmortem           Timeline -> Root Cause ->     "The 4-Hour Outage
                     Fix -> Prevention             That Changed How We
                                                   Deploy"

Tutorial/Guide       Problem -> Steps ->           "Building a Real-Time
                     Working Code ->               Dashboard with
                     Extensions                    WebSockets"

Opinion/Approach     Thesis -> Evidence ->         "Why We Stopped Using
                     Counter-arguments ->          Microservices for
                     Conclusion                    Everything"

Announcement         What -> Why -> How ->         "Introducing Our New
                     Get Started                   GraphQL API"
```

## Article Structure

### The Technical Blog Post Template

```markdown
# [Title: Specific, Benefit-Oriented, Under 70 Characters]

**Subtitle or summary line**: One sentence expanding on the title.

## Introduction (3-4 paragraphs)

Paragraph 1: The hook. Start with the problem, a surprising fact,
or a relatable scenario. Make the reader think "I've had that problem"
or "I didn't know that."

Paragraph 2: Context. What system/project/team is this about?
What scale or constraints are relevant?

Paragraph 3: Preview. What will the reader learn? What approach
did you take? Give them a reason to keep reading.

Paragraph 4 (optional): Scope. What this post covers and doesn't cover.

## Background / Problem Statement

Describe the problem in enough detail that the reader understands
the constraints. Include:
- What the system looked like before
- What wasn't working (performance? reliability? developer velocity?)
- What you tried that didn't work (optional but engaging)

## The Approach / Solution

The technical meat. Organize by:
- Chronological steps (for how-we-built-it)
- Conceptual layers (for deep dives)
- Criteria (for comparisons)

Include code examples, architecture diagrams, and data.

### Subheading for Each Major Section

Each section should:
1. Explain what and why (not just how)
2. Include a code example or diagram
3. Call out gotchas or non-obvious decisions
4. Be readable independently (someone skimming can learn from just this section)

## Results

Show the impact with data:
- Before/after metrics
- Performance benchmarks
- Graphs or tables

## Lessons Learned / Key Takeaways

3-5 bullet points. What would you tell someone starting this
same project today?

## Conclusion

2-3 sentences. Reinforce the main point. Optionally invite
discussion or point to related work.

---
*Author bio. Links to Twitter/GitHub. "We're hiring" if applicable.*
```

## Writing Clear Technical Explanations

### Explanation Techniques

```
1. ANALOGY-FIRST
   "A load balancer works like a restaurant host -- it greets
   every incoming customer (request) and seats them at the
   table (server) with the shortest wait time."

2. CONCRETE-BEFORE-ABSTRACT
   BAD:  "A closure is a function that captures its lexical scope."
   GOOD: "When you write a counter function that remembers its count
          between calls, that's a closure. The inner function
          'captures' the count variable from its parent."

3. PROGRESSIVE DISCLOSURE
   Start with the simple version, then add complexity:
   "At its simplest, a database index is like a book index --
    it tells you which page (disk location) has the data you want.

    But unlike a book index, a database index is a B-tree
    data structure that..."

4. SHOW-THEN-EXPLAIN
   Show the code or diagram first, then explain it.
   Readers pattern-match faster than they parse prose.

5. CONSTRAINT-DRIVEN
   "We needed sub-100ms response times, 99.99% availability,
   and the ability to handle 50K requests/second. These
   constraints led us to..."
```

### Editing for Clarity

```
BEFORE (verbose, passive):
  "It was determined by the team that the implementation of a
  caching layer would be beneficial for the purpose of reducing
  the latency that was being experienced by our users when they
  were accessing the dashboard."

AFTER (concise, active):
  "We added a Redis cache in front of the dashboard API.
  Response times dropped from 800ms to 45ms."

Rules:
  - Active voice: "We chose" not "It was decided"
  - Remove hedge words: "basically", "actually", "simply"
  - Specific numbers: "45ms" not "much faster"
  - Short sentences for complex ideas
  - One idea per paragraph
  - Delete any sentence that doesn't teach or advance the narrative
```

## Code Examples in Blog Posts

### Code Example Design

```
Guidelines:

1. MINIMAL BUT COMPLETE
   Show enough to understand, not the entire codebase.
   Strip boilerplate but keep enough context.

2. ANNOTATED
   Add comments explaining the non-obvious parts:
     // Use SET NX to ensure only one worker acquires the lock
     await redis.set(lockKey, workerId, 'NX', 'EX', 30);

3. RUNNABLE (when possible)
   Link to a GitHub repo or CodeSandbox where readers
   can run the complete example.

4. HIGHLIGHT THE KEY LINES
   In a 20-line code block, the reader's eye should be
   drawn to the 3-4 lines that matter most.

5. SHOW INPUT AND OUTPUT
   Don't just show the code. Show what happens when you run it.

6. LANGUAGE-APPROPRIATE
   Use the language your audience uses.
   A Kubernetes article should use YAML, not JSON.
```

### Before/After Code Pattern

```markdown
### The Problem: N+1 Queries

Our dashboard was making one database query per user to get
their recent orders:

    # Slow: N+1 queries (1 + N separate queries)
    users = User.objects.all()[:50]
    for user in users:
        orders = Order.objects.filter(user=user).order_by('-created')[:5]
        # This executes a new query for each user!

With 50 users on the page, this made 51 database queries and
took 1200ms.

### The Fix: Prefetch Related

Django's `prefetch_related` batches these into 2 queries:

    # Fast: 2 queries total (1 for users, 1 for all their orders)
    users = User.objects.prefetch_related(
        Prefetch(
            'orders',
            queryset=Order.objects.order_by('-created')[:5]
        )
    )[:50]

**Result:** 51 queries -> 2 queries. 1200ms -> 45ms.
```

## Technical Diagrams

### Diagram Best Practices

```
When to use each type:

Architecture Diagram:
  - Show system components and their relationships
  - Keep to 5-8 boxes max (simplify for the reader)
  - Use consistent shapes: rectangles for services,
    cylinders for databases, clouds for external services

Sequence Diagram:
  - Show request flow across services
  - Great for explaining auth flows, API interactions
  - Keep to 5-7 participants max

Flowchart:
  - Decision trees, error handling logic
  - Good for "when to use X vs Y" decisions

Timeline:
  - Incident postmortems
  - Migration stories
  - Performance optimization journeys

Data Visualization:
  - Before/after performance charts
  - Growth metrics
  - Benchmark comparisons
  - Always label axes and include units

Tools:
  - Mermaid (embeds in Markdown, version-controllable)
  - Excalidraw (hand-drawn style, approachable)
  - D2 (text-to-diagram, good for architecture)
  - Chart.js / Observable (data visualizations)
```

## SEO for Technical Content

### Developer Content SEO

```yaml
on_page_seo:
  title:
    - "Include the primary keyword naturally"
    - "Keep under 60 characters"
    - "Front-load the important words"
    - "Include the technology name (React, Kubernetes, etc.)"
    - "Bad: 'Our Journey with Caching'"
    - "Good: 'Redis Caching Patterns for High-Traffic APIs'"

  meta_description:
    - "150-160 characters summarizing the value"
    - "Include the problem and the solution"
    - "Example: Learn how to reduce API latency from 800ms to 45ms
       using Redis caching patterns. Includes code examples and
       production configuration."

  headings:
    - "H2s should be scannable and keyword-rich"
    - "Developers skim headings before deciding to read"
    - "Use question format for FAQ-style sections"

  url_structure:
    - "Use descriptive slugs: /blog/redis-caching-patterns"
    - "Avoid dates in URLs (content stays relevant)"
    - "Keep short: 3-5 words in the slug"

content_optimization:
  - "Answer the search query in the first 2 paragraphs"
  - "Include code blocks (Google indexes code samples)"
  - "Use schema markup for HowTo and FAQ content"
  - "Internal link to related posts"
  - "External link to official docs (signals authority)"

  keyword_strategy:
    - "Target long-tail developer queries"
    - "'how to implement rate limiting in express' over 'rate limiting'"
    - "Include error messages as keywords (developers search for errors)"
    - "'ECONNREFUSED postgresql docker' is a real search query"
```

## Editorial Process

### Blog Post Workflow

```
1. PITCH (Author, 15 min)
   - Working title
   - Target audience (who and what they know)
   - Key takeaway (one sentence)
   - Rough outline (section headings)
   - Estimated length and timeline

2. DRAFT (Author, 2-8 hours)
   - Write complete first draft
   - Include code examples (tested)
   - Add placeholder notes for diagrams

3. TECHNICAL REVIEW (Peer, 1 hour)
   - Is the technical content accurate?
   - Are the code examples correct and idiomatic?
   - Are there security implications not addressed?
   - Would you share this with your team?

4. EDITORIAL REVIEW (Editor, 30 min)
   - Is the structure logical?
   - Is the writing clear and concise?
   - Are there jargon or assumptions to unpack?
   - Does the title and intro hook the reader?

5. POLISH (Author, 1-2 hours)
   - Address review feedback
   - Add diagrams and visuals
   - Write meta description and social copy
   - Final code testing

6. PUBLISH
   - Schedule for optimal day/time
   - Share on social channels
   - Submit to aggregators (Hacker News, Reddit, dev.to)
   - Monitor comments and respond

7. MEASURE (1 week post-publish)
   - Page views and time on page
   - Social shares and backlinks
   - Comments and discussion quality
   - Conversion metrics (signups, hires)
```

### Review Checklist for Reviewers

```
Technical accuracy:
  [ ] Code examples compile/run correctly
  [ ] Technical claims are supported (benchmarks, docs)
  [ ] No security anti-patterns in code examples
  [ ] Version numbers and APIs are current

Writing quality:
  [ ] Clear thesis stated in introduction
  [ ] Each section advances the narrative
  [ ] No unnecessary jargon (or jargon is defined)
  [ ] Consistent voice and tense throughout
  [ ] Conclusion summarizes key points

Developer experience:
  [ ] Code is copy-paste ready
  [ ] Diagrams add understanding (not just decoration)
  [ ] Post is scannable (good headings, short paragraphs)
  [ ] Estimated reading time is accurate
```

## Measuring Blog Post Impact

```yaml
metrics:
  reach:
    - page_views: "Total and unique"
    - referral_sources: "Where readers come from"
    - social_shares: "Twitter, LinkedIn, HN, Reddit"
    - backlinks: "Other sites linking to this post"

  engagement:
    - average_time_on_page: "Target: > 4 minutes"
    - scroll_depth: "% reaching end of article"
    - bounce_rate: "Target: < 60%"
    - comments: "Quality and quantity"

  business_impact:
    - developer_signups: "API key registrations from blog"
    - documentation_visits: "Blog -> docs conversion"
    - job_applications: "Mentions blog in application"
    - brand_mentions: "Social mentions citing the post"

  content_health:
    - evergreen_traffic: "Still getting views after 6 months?"
    - search_rankings: "Position for target keywords"
    - update_needed: "Are code examples still current?"
```

## Writing Checklist

```
Before Writing:
  [ ] Topic fills a gap (not already well-covered elsewhere)
  [ ] Target audience clearly defined
  [ ] One clear takeaway identified
  [ ] Outline reviewed with teammate

During Writing:
  [ ] Introduction hooks reader in first paragraph
  [ ] Technical explanation uses concrete examples
  [ ] Code examples are tested and minimal
  [ ] Diagrams used where text alone is insufficient
  [ ] Key terms defined on first use
  [ ] Active voice throughout

Before Publishing:
  [ ] Technical review by subject matter expert
  [ ] Editorial review for clarity and flow
  [ ] All code examples retested
  [ ] Links verified (no 404s)
  [ ] Images have alt text
  [ ] Meta title and description optimized
  [ ] Social sharing image/card configured
  [ ] Reading time estimate added
```

## When to Use

**Use this skill when:**
- Designing or implementing technical blog writer solutions
- Reviewing or improving existing technical blog writer approaches
- Making architectural or implementation decisions about technical blog writer
- Learning technical blog writer patterns and best practices
- Troubleshooting technical blog writer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Technical Blog Writer Analysis

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

**Input:** "Help me implement technical blog writer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended technical blog writer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When technical blog writer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
