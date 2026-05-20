---
name: knowledge-base-writer
description: |
  Expert knowledge base articles covering article taxonomy, search optimization, troubleshooting article format, how-to article format, conceptual article format, FAQ design, article templates, feedback integration, and content lifecycle.
  Use when the user asks about knowledge base writer, knowledge base writer best practices, or needs guidance on knowledge base writer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation guide"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Knowledge Base Writer

## Overview

This skill provides comprehensive expertise in creating and maintaining knowledge base systems that enable users to find answers independently. A well-structured knowledge base reduces support ticket volume, improves customer satisfaction, and scales support capacity without scaling headcount. This skill covers taxonomy design, article formats for different content types, search optimization, feedback loops, and content lifecycle management.

## Article Taxonomy

### Information Architecture

```
Knowledge Base Taxonomy:

Level 1: Product Areas
├── Getting Started
│   ├── Account setup
│   ├── Quick start guide
│   └── First project walkthrough
├── Core Features
│   ├── Projects
│   ├── Pipelines
│   ├── Deployments
│   └── Monitoring
├── Integrations
│   ├── GitHub
# ... (condensed) ...
├── Conceptual: "What is X?" (explains a concept)
├── How-to: "How to do X" (step-by-step instructions)
├── Troubleshooting: "Fix X" (diagnose and resolve problems)
├── Reference: "X options" (comprehensive parameter/option lists)
└── FAQ: Quick answers to common questions
```

### Taxonomy Design Principles

```
Taxonomy Rules:
├── Maximum 3 levels of nesting
│   └── Deeper hierarchies indicate need for restructuring
├── 5-9 items per level (cognitive load limit)
├── Mutually exclusive categories (article fits in ONE place)
├── Use user language, not internal jargon
│   ├── GOOD: "Team management"
│   ├── BAD: "RBAC configuration"
├── Name categories with nouns (not verbs or questions)
│   ├── GOOD: "Deployments"
│   ├── BAD: "How to deploy"
├── Order categories by user journey
│   ├── Getting Started → Core Features → Advanced → Troubleshooting
│   └── Most-accessed categories first
└── Review taxonomy quarterly based on search analytics
```

## Search Optimization

### Writing for Search

```
Search Optimization for Knowledge Base Articles:

1. Title optimization
   ├── Include the primary keyword in the title
   ├── Match how users phrase the problem
   │   ├── GOOD: "Fix 'connection refused' error"
   │   ├── BAD: "Troubleshooting network connectivity issues"
   ├── Keep under 70 characters
   └── Front-load the important words

2. Description / excerpt
   ├── First 150 characters appear in search results
   ├── Summarize the answer, do not tease it
   │   ├── GOOD: "The 'connection refused' error occurs when the
   # ... (condensed) ...
5. URL structure
   ├── Include keywords in the URL slug
   ├── GOOD: /kb/fix-connection-refused-error
   ├── BAD: /kb/article-12345
   └── Keep URLs stable (redirects for changed slugs)
```

### Search Analytics Usage

| Metric | Action |
|--------|--------|
| Top searches with no results | Create new articles for these queries |
| Top searches with low click-through | Improve title/description of matching articles |
| High-bounce articles | Article does not answer the question; rewrite |
| Most-viewed articles | Prioritize keeping these updated |
| Search terms in support tickets | Cross-reference with KB; fill gaps |

## Troubleshooting Article Format

### Template

```markdown
# Fix: "Connection refused" error when connecting to database

**Applies to:** Version 2.x and later
**Last verified:** 2025-01-15
**Difficulty:** Beginner

## Problem

When running the application, you see this error:

\```
Error: connect ECONNREFUSED 127.0.0.1:5432
\```

# ... (condensed) ...
## Related Articles

- [Configure database connection settings](/kb/database-connection-settings)
- [PostgreSQL performance tuning](/kb/postgresql-performance)
- [Common database errors reference](/kb/database-errors)
```

### Troubleshooting Article Structure Rules

```
Troubleshooting Article Structure:
1. Title: "Fix: [exact error message or symptom]"
2. Problem: Describe exactly what the user sees
   ├── Include the exact error message in a code block
   ├── Describe the context (when does this happen?)
   └── Include screenshots if the error is visual
3. Cause: Explain why this happens (briefly)
   ├── List all possible causes
   └── Order from most common to least common
4. Solution: Step-by-step fix
   ├── One cause per solution section
   ├── Most common cause first
   ├── Each step has verification
   └── Conditional branching for different causes
5. Escalation: What to do if the solution does not work
   ├── Link to related articles
   ├── Link to support with required information
   └── List what info to include in a support ticket
```

## How-To Article Format

### Template

```markdown
# How to set up two-factor authentication

**Applies to:** All plans
**Last verified:** 2025-01-15
**Difficulty:** Beginner
**Time:** 5 minutes

## Overview

Two-factor authentication (2FA) adds a second layer of security to your
account. After enabling 2FA, you will need both your password and a code
from an authenticator app to sign in.

## Prerequisites
# ... (condensed) ...
## Next steps

- [Manage trusted devices](/kb/manage-trusted-devices)
- [Use backup codes](/kb/use-2fa-backup-codes)
- [Disable two-factor authentication](/kb/disable-2fa)
```

### How-To Article Structure Rules

```
How-To Article Structure:
1. Title: "How to [action]" - clear, action-oriented
2. Overview: 1-2 sentences explaining what this achieves and why
3. Prerequisites: What the user needs before starting
4. Steps: Numbered, sequential instructions
   ├── Each step: one action
   ├── Sub-steps for complex actions (1a, 1b)
   ├── Include what the user should see after each step
   └── Screenshots for GUI interactions
5. Verification: How to confirm it worked
6. Next steps: Related actions the user might want to take
```

## Conceptual Article Format

### Template

```markdown
# Understanding rate limiting

**Applies to:** All API plans
**Last verified:** 2025-01-15

## What is rate limiting?

Rate limiting controls how many API requests a client can make within a
specific time window. It protects the API from being overwhelmed by too
many requests and ensures fair access for all users.

## How it works

When you send an API request, the system tracks how many requests your
# ... (condensed) ...
## Related articles

- [Handle rate limit errors](/kb/handle-rate-limit-errors)
- [Upgrade your plan](/kb/upgrade-plan)
- [API rate limit reference](/docs/api/rate-limits)
```

### Conceptual Article Structure Rules

```
Conceptual Article Structure:
1. Title: "[Concept name]" or "Understanding [concept]"
2. Definition: What is this? (1-2 paragraphs, plain language)
3. How it works: Technical explanation with diagrams/examples
   ├── Use analogies for complex concepts
   ├── Include diagrams or tables where helpful
   └── Build from simple to complex
4. Why it matters: Why the user should care
5. Best practices: Practical guidance for the concept
6. Related articles: Links to how-tos and reference docs

Do NOT include step-by-step instructions in conceptual articles.
Link to how-to articles for specific tasks.
```

## FAQ Design

### FAQ Best Practices

```
FAQ Article Design:
├── Source questions from real user data
│   ├── Support ticket analysis (top 20 questions)
│   ├── Search queries with no results
│   ├── Community forum frequently asked topics
│   └── Sales team commonly heard questions
├── Write questions in the user's voice
│   ├── GOOD: "Why was I charged twice?"
│   ├── BAD: "Duplicate billing inquiry resolution"
├── Answer directly in the first sentence
│   ├── GOOD: "Duplicate charges occur when... To get a refund..."
│   ├── BAD: "This is a common question. There are several reasons..."
├── Keep answers under 100 words
│   └── Link to full articles for complex topics
├── Group FAQs by topic (5-7 questions per group)
├── Order by frequency (most asked first)
├── Include an anchor link for each question
│   └── Enables direct linking: /kb/faq#why-was-i-charged-twice
└── Review and update monthly
```

### FAQ Template

```markdown
# Frequently Asked Questions

## Account & Billing

### Why was I charged twice?
Duplicate charges typically occur when a payment times out and is retried.
The duplicate will be automatically refunded within 3-5 business days. If
you do not see the refund, [contact billing support](/support/billing).

### Can I switch plans mid-cycle?
Yes. When you upgrade, you will be charged the prorated difference for the
remainder of the billing cycle. When you downgrade, the credit will be
applied to your next invoice. See [Change your plan](/kb/change-plan).

# ... (condensed) ...
Enterprise plans. See [Upload limits](/kb/upload-limits) for details.

### Does the API support GraphQL?
Not currently. The API uses REST with JSON. GraphQL support is on our
roadmap. Follow [our changelog](/changelog) for updates.
```

## Article Templates System

### Template Metadata

```yaml
# Article template metadata (for CMS or static site generator)
---
title: "How to [action]"
description: "Learn how to [action] in [product]."
category: "core-features/projects"
article_type: "how-to"  # conceptual | how-to | troubleshooting | reference | faq
difficulty: "beginner"   # beginner | intermediate | advanced
applies_to: "All plans"  # "Pro and Enterprise" | "Version 2.x+"
last_verified: "2025-01-15"
author: "docs-team"
tags: ["projects", "setup", "configuration"]
related:
  - "/kb/project-settings"
  - "/kb/team-permissions"
---
```

### Content Reuse Patterns

```
Content Reuse Strategy:
├── Shared snippets for repeated content
│   ├── Prerequisites blocks (e.g., "Sign in to dashboard")
│   ├── Warning blocks (e.g., "This action cannot be undone")
│   ├── Contact support blocks
│   └── Version compatibility notes
├── Include syntax (varies by platform)
│   ├── Docusaurus: import from '@site/docs/shared/...'
│   ├── MkDocs: {%- include 'snippets/prerequisite.md' -%}
│   └── Confluence: Excerpt include macro
├── Single-source content
│   ├── Write the fact once, reference everywhere
│   ├── Example: File size limits defined in one place
│   └── Update once, reflected everywhere
└── Conditional content
    ├── Platform-specific tabs (macOS / Linux / Windows)
    ├── Plan-specific sections (Free / Pro / Enterprise)
    └── Version-specific content (v1 / v2)
```

## Feedback Integration

### Feedback Collection

```markdown
## Feedback Mechanisms

### Article-level feedback
Place at the bottom of every article:

---

**Was this article helpful?**
[ Yes ] [ No ]

If No → Show: "How can we improve this article?"
[ Text input field ] [ Submit ]

### Feedback analysis workflow
# ... (condensed) ...
3. Monthly: Report on feedback trends
   ├── Helpfulness score by category
   ├── Most-improved articles
   └── Categories needing attention
4. Quarterly: Correlate with support ticket trends
```

### Feedback-Driven Improvement Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Article helpfulness rate | >80% "Yes" | Feedback widget clicks |
| Support ticket deflection | 30%+ tickets avoided | Tickets vs. KB views correlation |
| Time to resolution (self-service) | <5 minutes | Average time on article |
| Search success rate | >70% find relevant article | Search → click-through rate |
| Content freshness | 100% verified within 6 months | Last-verified date audit |
| Coverage | <10% of tickets have no KB article | Gap analysis: tickets vs. KB topics |

## Content Lifecycle

### Article Lifecycle States

```
Article Lifecycle:

1. Draft
   ├── Author writes initial content
   ├── Uses appropriate template
   └── Follows style guide

2. Review
   ├── Peer review for technical accuracy
   ├── Editorial review for style and clarity
   ├── SME review for complex topics
   └── Minimum 1 reviewer; 2 for high-traffic articles

3. Published
   # ... (condensed) ...
├── Product release: Review all articles for affected features
├── Support ticket spike: Review and update related articles
├── Quarterly audit: Review articles not updated in 6+ months
├── Feedback threshold: Articles with >20% "Not helpful" responses
└── Author departure: Reassign content ownership
```

### Content Audit Process

```markdown
## Quarterly Content Audit

### Step 1: Generate audit report

Pull the following data for all published articles:
- Last modified date
- Last verified date
- Page views (last 90 days)
- Helpfulness score
- Associated support tickets

### Step 2: Categorize each article

| Category | Criteria | Action |
# ... (condensed) ...

- Create tickets for all required actions
- Set deadlines based on traffic and impact
- Track completion in content management dashboard
- Report results at next quarterly review
```

## Production Checklist

- [ ] Taxonomy designed with maximum 3 levels of depth
- [ ] Article templates created for all 5 article types
- [ ] Search optimization guidelines applied to all articles
- [ ] Troubleshooting articles include exact error messages
- [ ] How-to articles have prerequisites, steps, and verification
- [ ] Conceptual articles explain "what" and "why" without step-by-step
- [ ] FAQ sourced from real user questions (not assumed questions)
- [ ] Feedback widget added to every article
- [ ] Content reuse system configured (shared snippets)
- [ ] Metadata schema defined (tags, version, difficulty, type)
- [ ] Quarterly content audit process established
- [ ] Article ownership assigned for all content
- [ ] Analytics tracking configured (views, search, feedback)
- [ ] Support ticket deflection measurement in place
- [ ] Style guide compliance verified across all articles

## When to Use

**Use this skill when:**
- Designing or implementing knowledge base writer solutions
- Reviewing or improving existing knowledge base writer approaches
- Making architectural or implementation decisions about knowledge base writer
- Learning knowledge base writer patterns and best practices
- Troubleshooting knowledge base writer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Knowledge Base Writer Analysis

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

**Input:** "Help me implement knowledge base writer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended knowledge base writer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When knowledge base writer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
