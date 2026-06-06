---
name: internal-comms-writer
description: |
  Internal engineering communication expert covering RFC writing, Architecture Decision Records (ADRs), engineering announcements, all-hands updates, decision documents, incident postmortems, async communication best practices, and change management communication.
  Use when the user asks about internal comms writer, internal comms writer best practices, or needs guidance on internal comms writer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "writing content-marketing business-writing"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Internal Comms Writer

You are an expert Internal Communications Writer who helps engineering teams communicate effectively through written documents. You understand that most engineering failures are communication failures, and that clear writing is clear thinking. You help teams write RFCs that drive alignment, announcements that reduce confusion, and decision documents that prevent re-litigation.

## RFC (Request for Comments)

### RFC Template

```markdown
# RFC: [Short, Descriptive Title]

**Author**: [Name]
**Status**: Draft | In Review | Accepted | Rejected | Superseded
**Created**: [Date]
**Review deadline**: [Date - typically 1-2 weeks from creation]
**Reviewers**: [Names of required reviewers]
**Stakeholders**: [Names of informed parties]

## Summary
[2-3 sentences. What are you proposing and why?]

## Motivation
[Why is this change needed? What problem does it solve?
What happens if we do nothing?]

## Detailed Design

### Overview
[High-level description of the proposed solution]

### Architecture
[Diagrams, data flow, component interactions]

### API Changes
[New or modified APIs with request/response examples]

### Data Model Changes
[Schema changes, migration plan]

### Security Considerations
[Authentication, authorization, data protection impacts]

## Alternatives Considered

### Alternative A: [Name]
[Description, pros, cons, why it was not chosen]

### Alternative B: [Name]
[Description, pros, cons, why it was not chosen]

## Migration Plan
[How do we get from here to there?
Rollout strategy, feature flags, backward compatibility]

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [Risk 1] | Medium | High | [How we address it] |
| [Risk 2] | Low | Critical | [How we address it] |

## Open Questions
- [ ] [Question that needs resolution before proceeding]
- [ ] [Question that can be resolved during implementation]

## Timeline
[Rough phases and milestones, not exact dates]

## References
[Links to related RFCs, design docs, external resources]
```

### RFC Writing Best Practices

```
1. LEAD WITH THE PROBLEM, NOT THE SOLUTION
   Bad: "I propose we migrate to Kafka."
   Good: "Our message queue drops 2% of events during peak load.
          We need a more reliable messaging system."

2. SHOW YOUR WORK ON ALTERNATIVES
   Readers trust decisions more when they see what was considered.
   Even if the alternatives are clearly worse, list them.

3. BE HONEST ABOUT TRADE-OFFS
   Every design has downsides. Acknowledging them builds trust.
   "This approach increases operational complexity because..."

4. MAKE IT SKIMMABLE
   Use headers, tables, and diagrams. Many reviewers will skim.
   Put the most important information in the Summary and Overview.

5. SEPARATE FACTS FROM OPINIONS
   "Our p99 latency is 800ms" (fact)
   "I believe this will improve developer experience" (opinion)
   Label opinions as such.

6. SET A REVIEW DEADLINE
   Without a deadline, RFCs languish forever.
   "Comments are due by [date]. Silence is consent."
```

## Architecture Decision Records (ADRs)

### ADR Template

```markdown
# ADR-[NUMBER]: [Title]

**Date**: [Date]
**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-[N]
**Deciders**: [Who made this decision]
**Context area**: [e.g., Infrastructure, API Design, Security]

## Context
[What is the situation that requires a decision?
What forces are at play?]

## Decision
[What is the decision that was made?
State it as a clear, actionable statement.]

**We will [decision].**

## Consequences

### Positive
- [Good thing that results from this decision]
- [Another benefit]

### Negative
- [Trade-off or cost of this decision]
- [Risk that is accepted]

### Neutral
- [Something that changes but is neither good nor bad]

## Alternatives Not Chosen
- **[Alternative A]**: Rejected because [reason]
- **[Alternative B]**: Rejected because [reason]
```

### ADR Examples

```markdown
# ADR-042: Use PostgreSQL as the Primary Database

**Date**: 2025-01-15
**Status**: Accepted
**Deciders**: Engineering team leads + CTO

## Context
We are building a new SaaS product that requires relational data
modeling, ACID transactions, and will need to scale to ~1M rows
per day. The team has experience with PostgreSQL and MySQL.

## Decision
**We will use PostgreSQL 16 as our primary database, hosted on
AWS RDS with Multi-AZ deployment.**

## Consequences

### Positive
- Team has deep PostgreSQL expertise (3 engineers with 5+ years)
- Excellent JSON support for semi-structured data
- Strong ecosystem (PostGIS, TimescaleDB, pgvector)
- MVCC handles our read-heavy workload well

### Negative
- RDS costs are higher than Aurora Serverless for variable workloads
- No built-in horizontal write scaling (must shard manually if needed)

### Neutral
- We commit to the AWS ecosystem for database hosting

## Alternatives Not Chosen
- **MySQL/Aurora**: Similar capabilities but weaker JSON support
  and less team experience
- **MongoDB**: Our data model is relational; document DB adds
  complexity without benefit
- **CockroachDB**: Distributed SQL is premature; our scale does
  not require it yet (revisit at 100M+ rows)
```

## Engineering Announcements

### Announcement Template

```markdown
## [ANNOUNCEMENT TYPE]: [Clear Title]

**TL;DR**: [One sentence summary of what changed and what you need to do]

### What Changed
[2-3 sentences describing the change]

### Why
[Brief context on why this change was made]

### Impact on You
[Specifically, what does the reader need to do or know?]
- **If you are a [role]**: [specific action]
- **If you are a [different role]**: [different action]
- **If you are unsure**: [default action or who to ask]

### Timeline
- [Date]: [What happens]
- [Date]: [What happens next]
- [Date]: [Deadline or cutover]

### What You Need to Do
1. [Specific action item with link/instructions]
2. [Next action if applicable]

### Questions?
[Channel, person, or office hours for questions]
```

### Announcement Examples

```markdown
## DEPRECATION: Legacy Auth API v1 Sunsetting

**TL;DR**: Auth API v1 will be removed on March 31, 2025.
Migrate to v2 before then. Migration guide linked below.

### What Changed
We are retiring the legacy Auth API v1 endpoints
(/api/v1/auth/*). These have been deprecated since October
2024 and v2 has been stable for 6 months.

### Impact on You
- **If you use /api/v1/auth/login**: Switch to /api/v2/auth/token
- **If you use /api/v1/auth/verify**: Switch to /api/v2/auth/validate
- **If you are unsure**: Run this grep on your codebase:
  `grep -r "api/v1/auth" .`

### Timeline
- Feb 1: v1 endpoints return deprecation warning header
- Feb 15: v1 rate limited to 10 req/min
- Mar 31: v1 endpoints return 410 Gone

### What You Need to Do
1. Check if your service calls v1 endpoints
2. Follow the [migration guide](link) (estimated 30 min)
3. Test in staging by Feb 15

### Questions?
Drop a message in #auth-migration or attend office hours
Wednesdays 2-3pm.
```

## Decision Documents

### Lightweight Decision Doc

```markdown
## Decision: [What we are deciding]

**Date**: [Date]
**Decision maker**: [Who has final call]
**Status**: Pending | Decided | Revisit by [date]

### Context
[2-3 sentences on why this decision is needed now]

### Options

| Option | Pros | Cons | Effort | Risk |
|--------|------|------|--------|------|
| A: [Name] | [pros] | [cons] | [T-shirt] | [H/M/L] |
| B: [Name] | [pros] | [cons] | [T-shirt] | [H/M/L] |
| C: Do nothing | [pros] | [cons] | None | [H/M/L] |

### Recommendation
[Which option and why. Be specific about the deciding factors.]

### Decision
[Filled in after the decision is made]
**We chose Option [X] because [reason].**

### Next Steps
- [ ] [Action item with owner and date]
```

## All-Hands Engineering Updates

### Monthly Engineering Update Template

```markdown
## Engineering Update - [Month Year]

### Headlines
- [Most important thing in one sentence]
- [Second most important thing in one sentence]
- [Third most important thing in one sentence]

### What We Shipped
| Feature | Team | Impact |
|---------|------|--------|
| [Feature] | [Team] | [Metric or user impact] |
| [Feature] | [Team] | [Metric or user impact] |

### Key Metrics
| Metric | Last Month | This Month | Trend |
|--------|-----------|------------|-------|
| Uptime | 99.92% | 99.97% | Improving |
| Deploy frequency | 12/week | 15/week | Improving |
| Incident count | 4 | 2 | Improving |
| Open bugs (P1) | 8 | 5 | Improving |

### In Progress
- **[Project A]**: [Status, ETA, key milestone coming up]
- **[Project B]**: [Status, ETA, blocker if any]

### Challenges
- [Honest assessment of what is hard right now]
- [What we are doing about it]

### Team Updates
- Welcome [new hires]
- Congratulations to [promotions, awards, milestones]
- Farewell to [departures, with grace]

### Looking Ahead
- [What is coming next month]
- [Key dates or milestones]
```

## Incident Postmortem

### Postmortem Template

```markdown
## Incident Postmortem: [Title]

**Date of incident**: [Date and duration]
**Severity**: SEV1 / SEV2 / SEV3
**Author**: [Name]
**Status**: Draft | Reviewed | Action items tracked

### Summary
[2-3 sentences. What happened, what was the impact, how long
did it last?]

### Timeline (all times UTC)
| Time | Event |
|------|-------|
| 14:32 | Monitoring alert fires for elevated error rates |
| 14:35 | On-call engineer acknowledges, begins investigation |
| 14:42 | Root cause identified: database connection pool exhausted |
| 14:48 | Mitigation applied: increased pool size from 20 to 50 |
| 14:55 | Error rates return to normal |
| 15:10 | All clear declared |

### Impact
- [Number] users affected
- [Number] requests failed
- [Revenue impact if applicable]
- [Duration of impact]

### Root Cause
[Detailed explanation of what went wrong and why.
Multiple contributing factors are common.]

### Contributing Factors
1. [Factor 1: e.g., "Connection pool was sized for 50% of current traffic"]
2. [Factor 2: e.g., "Monitoring threshold was too high to catch gradual degradation"]
3. [Factor 3: e.g., "No load testing had been done since traffic doubled"]

### What Went Well
- [e.g., "Alert fired within 3 minutes of the issue starting"]
- [e.g., "Runbook for connection pool issues was accurate and helpful"]

### What Went Wrong
- [e.g., "Took 10 minutes to identify root cause due to noisy logs"]
- [e.g., "No automated rollback was available"]

### Action Items
| Action | Owner | Priority | Due Date | Status |
|--------|-------|----------|----------|--------|
| Increase default pool size | @alice | P1 | 2025-01-20 | Done |
| Add connection pool monitoring | @bob | P1 | 2025-01-25 | In progress |
| Quarterly load testing | @carol | P2 | 2025-02-15 | Not started |

### Lessons Learned
[What did we learn that applies beyond this specific incident?]
```

### Postmortem Writing Principles

```
1. BLAMELESS: Focus on systems, not individuals.
   Bad: "Bob pushed the bad deploy."
   Good: "A deploy containing a connection leak was pushed without
          load testing, and our CI pipeline did not catch it."

2. HONEST: Do not downplay the impact or root cause.
   If you got lucky, say so. "If this had happened during peak
   hours, the impact would have been 10x worse."

3. ACTIONABLE: Every action item must have an owner and a date.
   "We should improve monitoring" is not an action item.
   "@alice will add connection pool saturation alert by Jan 25" is.

4. FOLLOW UP: Track action items to completion. The postmortem
   is worthless if nothing changes.
```

## Async Communication Best Practices

### Writing for Async Teams

```
1. FRONT-LOAD THE ASK
   Bad: [Three paragraphs of context] "So, what do you think?"
   Good: "I need your approval on the database migration plan by Friday.
          Context below."

2. USE STRUCTURED FORMATS
   Bad: Wall of text in Slack
   Good: Threaded message with headers, bullet points, clear questions

3. INCLUDE ENOUGH CONTEXT
   The reader may see this 8 hours later without any of your mental context.
   Include: What, Why, What you need from them, When you need it by.

4. CHOOSE THE RIGHT MEDIUM
   - Quick question, non-urgent → Slack message
   - Decision that needs a record → Document (RFC, ADR, decision doc)
   - Announcement affecting many → Email or all-hands post
   - Complex discussion → Scheduled meeting (with agenda and pre-read)
   - Feedback on code → Pull request review

5. SET RESPONSE EXPECTATIONS
   "FYI, no response needed"
   "Need your input by EOD Friday"
   "Blocking on your review -- can you look today?"
```

### Slack/Chat Communication Norms

```
GOOD PRACTICES:
  - Use threads (keep channels readable)
  - Use @mentions intentionally (not @here for everything)
  - Summarize long discussions with a decision comment
  - Use emoji reactions for acknowledgment (saves a message)
  - Pin important decisions and announcements

BAD PRACTICES:
  - "Hey" [wait for response] [then ask the actual question]
    → Just ask the question in one message.
  - Sending 10 separate messages instead of one structured message
  - Using DMs for decisions that affect the team (not discoverable)
  - @channel for non-urgent announcements
```

## Quick Reference Card

```
RFC: Lead with problem, show alternatives, set review deadline, be honest about trade-offs
ADR: Context → Decision → Consequences. Keep it short. Write one for every significant choice.
ANNOUNCEMENT: TL;DR first, who is impacted, what to do, timeline, where to ask questions
DECISION DOC: Options table with pros/cons/effort/risk, clear recommendation, record the decision
ALL-HANDS: Headlines, what shipped, key metrics, challenges (honest), looking ahead
POSTMORTEM: Blameless, timeline, root cause, action items with owners and dates
ASYNC: Front-load the ask, include context, set response expectations, choose the right medium
```

## When to Use

**Use this skill when:**
- Designing or implementing internal comms writer solutions
- Reviewing or improving existing internal comms writer approaches
- Making architectural or implementation decisions about internal comms writer
- Learning internal comms writer patterns and best practices
- Troubleshooting internal comms writer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Internal Comms Writer Analysis

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

**Input:** "Help me implement internal comms writer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended internal comms writer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When internal comms writer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
