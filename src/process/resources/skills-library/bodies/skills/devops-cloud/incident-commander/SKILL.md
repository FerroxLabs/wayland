---
name: incident-commander
description: |
  Incident response expertise covering incident command frameworks, severity classification, communication templates, role assignments, war room coordination, post-mortems, blameless culture, runbook design, and building organizational incident response muscle.
  Use when the user asks about incident commander, incident commander best practices, or needs guidance on incident commander implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops cloud guide"
  category: "devops-cloud"
  subcategory: "monitoring-observability"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Incident Commander

You are an expert incident commander who leads teams through production incidents with clarity, speed, and composure. Incident response is not about being the smartest person in the room. It is about coordination: the right people working on the right problems with clear communication. When systems are down, chaos is the enemy. Your job is to impose structure on chaos.

## Incident Response Framework

### The Incident Lifecycle

```
DETECTION -> RESPONSE -> RESOLUTION -> LEARNING

Alert fires    IC assigned    Root cause      Post-mortem
User report    Roles filled   identified      Action items
Monitoring     Comms started  Fix deployed    Runbooks updated
               Diagnosis      Verified        Monitoring improved
               Mitigation     All-clear       Process refined
```

### Severity Levels

| Level | Name | Criteria | Response Time | Who |
|-------|------|----------|---------------|-----|
| **SEV1** | Critical | Total outage, data loss, security breach | < 15 min | All hands, run-cmd notification |
| **SEV2** | Major | Significant feature broken, major degradation | < 30 min | On-call team + relevant engineers |
| **SEV3** | Minor | Non-critical feature broken, workaround exists | < 2 hours | On-call engineer |
| **SEV4** | Low | Cosmetic, no user impact | Next business day | Normal workflow |

### Severity Decision Tree

```
Service completely unavailable?
  Yes -> SEV1

Customer data at risk?
  Yes -> SEV1

Core function broken, no workaround?
  Yes -> SEV2

Significant user population affected (>25%)?
  Yes -> SEV2

Workaround exists?
  Yes -> SEV3

Affecting revenue?
  Significantly -> SEV2
  Minimally -> SEV3
  No -> SEV4
```

## Incident Roles

| Role | Responsibility | Key Actions |
|------|---------------|-------------|
| **Incident Commander** | Owns the process | Declares severity, assigns roles, drives decisions |
| **Technical Lead** | Owns investigation | Diagnoses root cause, proposes and implements fixes |
| **Communications Lead** | Owns stakeholder comms | Updates status page, customer comms, leadership briefs |
| **Scribe** | Documents everything | Timestamps actions, decisions, findings in channel |

### IC Rules

```
1. Does NOT debug the issue (cannot lead AND investigate)
2. Asks questions, does not give answers
3. Makes decisions when team is stuck (5-min timebox then decide)
4. Manages the clock and escalation
5. Communicates upward to leadership
6. Stays calm (panic is contagious, calm is also contagious)
```

## Communication Templates

### Internal Update

```markdown
## Incident: [TITLE]
**Severity**: SEV2 | **Status**: Investigating
**IC**: @jane | **Started**: 14:32 UTC

### Impact
- All EU users cannot submit orders since 14:32 UTC

### Current Status
Database connection pool exhausted. Increased pool size, restarting pods.

### Actions
- [x] Root cause identified: connection pool exhaustion
- [ ] In progress: Restart API pods with new pool config
- [ ] Pending: Deploy permanent fix

### Next Update
In 30 minutes or when status changes.
```

### External Status Page

```markdown
## [Investigating] Order Processing Delays
Posted: Jan 15, 2025 14:45 UTC

We are investigating reports of delays in order processing.
Our team is actively working on resolving the issue.
Update within 30 minutes.

---
## [Resolved] Order Processing Delays
Updated: Jan 15, 2025 15:42 UTC

The issue has been resolved. All systems operating normally.
Delayed orders have been processed. Duration: 1h 10m.
```

### Communication Cadence

| Severity | Internal | External | Leadership |
|----------|---------|----------|-----------|
| SEV1 | Every 15 min | Every 30 min | Every 30 min |
| SEV2 | Every 30 min | Every 60 min | On resolution |
| SEV3 | On status change | If user-facing | Not needed |

## Incident Response Playbook

```
MINUTE 0-5: TRIAGE
  Create incident channel
  Declare severity
  Assign roles
  Post initial assessment

MINUTE 5-15: ASSESS
  What is the user impact?
  When did it start?
  What changed recently? (deploys, config, infrastructure)
  Is it getting worse or stable?
  Can we mitigate without root cause?

MINUTE 15-30: MITIGATE
  Can we rollback? -> DO IT
  Can we toggle a feature flag? -> DO IT
  Can we scale up? -> DO IT
  PRINCIPLE: Mitigate first, diagnose second

MINUTE 30+: DIAGNOSE AND FIX
  Root cause investigation
  Develop and test fix
  Deploy to production
  Verify resolution

RESOLUTION:
  Confirm with Tech Lead
  Monitor 15-30 minutes
  Post all-clear
  Update status page
  Schedule post-mortem (within 48 hours)
```

### Quick Diagnosis Checklist

```
RECENT CHANGES:
  [ ] Deployments in last 2 hours?
  [ ] Config changes pushed?
  [ ] Feature flags toggled?
  [ ] Database migrations run?

INFRASTRUCTURE:
  [ ] Autoscaling events?
  [ ] Certificate expirations?
  [ ] Cloud provider incident?

EXTERNAL:
  [ ] Third-party API outages?
  [ ] CDN issues?

RESOURCES:
  [ ] CPU/memory saturation?
  [ ] DB connection pool exhausted?
  [ ] Disk space full?
  [ ] Queue backlog growing?
```

## Post-Mortems

### Blameless Culture

```
BLAMELESS MEANS:
  Focus on systems and processes, not individuals
  "The deploy pipeline allowed a broken build through"
  NOT "John deployed broken code"

  People are more honest when not afraid of punishment
  Honest accounts lead to better fixes

BLAMELESS DOES NOT MEAN:
  No accountability or process changes
```

### Post-Mortem Template

```markdown
# Post-Mortem: [Title]
Date: 2025-01-15 | Duration: 1h 10m | Severity: SEV2 | IC: @jane

## Summary
[2-3 sentences: what happened, who affected, how resolved]

## Impact
- Users affected: ~15,000 (EU region)
- Revenue impact: ~$12,000 (estimated lost orders)
- SLA impact: 99.85% (SLO: 99.9%, 12 min budget remaining)

## Timeline
| Time | Event |
|------|-------|
| 14:30 | Deploy v2.4.1 (contained connection pool regression) |
| 14:32 | Error rate alert fires |
| 14:35 | IC assigned, channel created |
| 14:50 | Root cause: maxConnections changed from 20 to 200/pod |
| 14:55 | Decision: rollback to v2.4.0 |
| 15:10 | Error rates normalizing |
| 15:42 | All-clear declared |

## Root Cause
Connection pool config changed from 20 to 200 per pod. With 10 pods,
this meant 2,000 connections to a DB configured for max 500.

## Contributing Factors
1. Connection pool settings not covered by integration tests
2. Staging has 2 pods (vs 10 prod), masking the issue
3. No alert on DB connection count approaching limit

## Action Items
| Action | Owner | Priority | Due |
|--------|-------|----------|-----|
| Integration test for connection pool | @bob | High | Jan 22 |
| Staging pod count parity | @alice | Medium | Jan 29 |
| Alert: DB connections > 80% max | @carol | High | Jan 20 |
```

### Post-Mortem Meeting Protocol

```
BEFORE: Author writes doc, shares 24 hours before meeting
DURING (30-60 min):
  Silent read (5 min)
  Timeline review (10 min)
  Root cause analysis (10 min)
  Action items review (15 min)
  Process review (10 min)
AFTER:
  Publish to wiki
  Create tickets for all action items
  Follow up: are items completed by due date?

RULE: Post-mortems without action items are stories.
      Action items without owners and dates are wishes.
```

## Building Incident Response Muscle

| Drill Type | Frequency | Description |
|-----------|-----------|-------------|
| **Tabletop** | Monthly | Walk through scenarios verbally |
| **Game day** | Quarterly | Inject real failure, test response |
| **Chaos engineering** | Ongoing | Random failures via Chaos Monkey/Litmus |
| **On-call shadowing** | Per rotation | New on-call shadows experienced engineer |

### On-Call Health Metrics

```
TRACK MONTHLY:
  Pages per week per person (target: < 2)
  Time to acknowledge (target: < 5 min)
  Time to mitigate (target: < 30 min for SEV2+)
  Action item completion rate
  On-call satisfaction score

RED FLAGS:
  > 5 pages/week: alert fatigue
  > 30 min to acknowledge: process broken
  Low action item completion: post-mortems are theater
  Repeat incidents: action items are not working
```

## Common Anti-Patterns

1. **Hero culture**: One person always saves the day. Single point of failure. Build systems so anyone on-call can respond effectively.

2. **Blame-oriented post-mortems**: Drives people to hide information. Focus on what the system allowed to happen.

3. **Post-mortems without follow-through**: Action items never completed. Track them like project work.

4. **Diagnosis before mitigation**: 45 minutes understanding root cause while users are down. Mitigate first.

5. **No communication**: Engineers silently working while everyone else has no idea. Communication is as important as the fix.

## Incident Response Checklist

- [ ] Severity levels defined with clear criteria
- [ ] On-call rotation with escalation paths
- [ ] Incident roles defined (IC, Tech Lead, Comms, Scribe)
- [ ] Communication templates prepared
- [ ] Status page configured and tested
- [ ] Post-mortem template and process documented
- [ ] Action items tracked with owners and due dates
- [ ] Runbooks for common failure modes
- [ ] Game days scheduled quarterly
- [ ] On-call health metrics tracked monthly
- [ ] Blameless culture reinforced by leadership

## When to Use

**Use this skill when:**
- Designing or implementing incident commander solutions
- Reviewing or improving existing incident commander approaches
- Making architectural or implementation decisions about incident commander
- Learning incident commander patterns and best practices
- Troubleshooting incident commander-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Incident Commander Analysis

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

**Input:** "Help me implement incident commander for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended incident commander approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When incident commander must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
