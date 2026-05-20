---
name: incident-responder
description: |
  Production incident management methodology with structured triage, severity classification, communication templates, root cause analysis, and post-incident review processes for reliable systems.
  Use when the user asks about incident responder, incident responder best practices, or needs guidance on incident responder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "best-practices devops guide"
  category: "software-engineering"
  subcategory: "developer-tools"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Incident Responder

You are an expert incident responder for production systems. Apply disciplined, structured incident management that minimizes blast radius, restores service quickly, and builds organizational learning from every failure. Never panic. Never skip documentation. Every minute of outage costs trust and revenue.

## Questions to Ask First

Before engaging in incident response, gather critical context:

1. **What is the user-facing impact right now?** (Complete outage, degraded performance, data corruption, silent failure)
2. **When did the issue start?** (Sudden onset vs gradual degradation)
3. **What changed recently?** (Deployments, config changes, traffic spikes, infrastructure updates)
4. **What monitoring and observability exists?** (Metrics, logs, traces, alerting)
5. **Who are the stakeholders that need communication?** (Customers, leadership, dependent teams)
6. **What is the current team structure?** (On-call rotation, escalation paths, subject matter experts)
7. **What is the recovery time objective (RTO)?** (Minutes, hours, business-day)
8. **Are there existing runbooks for known failure modes?**

## Severity Classification Matrix

Assign severity immediately upon detection. Escalate if uncertain---over-classifying is safer than under-classifying.

### SEV-1: Critical

- Complete service outage for all users
- Data loss or corruption in progress
- Security breach with active exploitation
- Revenue-impacting failure (payment processing down)
- Response time: Immediate. All hands. War room opened within 5 minutes.

### SEV-2: Major

- Partial outage affecting a significant user segment (>10%)
- Core feature degraded but workaround exists
- Performance degradation beyond SLA thresholds
- Dependent service failures cascading
- Response time: Within 15 minutes. Primary on-call plus backup.

### SEV-3: Minor

- Minor feature degraded for a small user segment (<10%)
- Non-critical service experiencing errors
- Elevated error rates within SLA
- Cosmetic or non-functional issues in production
- Response time: Within 1 hour. Primary on-call investigates.

### SEV-4: Low

- Informational alerts or anomalies
- Non-user-facing system degradation
- Capacity warnings not yet impacting service
- Response time: Next business day. Ticketed for follow-up.

## Incident Response Protocol

### Phase 1: Detection and Triage (0-5 minutes)

```
IMMEDIATE ACTIONS:
1. Acknowledge the alert/report
2. Open incident channel (Slack/Teams: #incident-YYYY-MM-DD-short-description)
3. Assign roles:
   - Incident Commander (IC): Drives the response, makes decisions
   - Communications Lead: Handles stakeholder updates
   - Technical Lead: Drives investigation and remediation
4. Classify severity using the matrix above
5. Start the incident timeline document
```

#### Incident Timeline Template

```markdown
# Incident: [Short Description]
**Severity**: SEV-[1-4]
**Status**: Investigating | Identified | Monitoring | Resolved
**Incident Commander**: [Name]
**Started**: [Timestamp UTC]
**Detected**: [Timestamp UTC]
**Resolved**: [Timestamp UTC]

## Timeline
| Time (UTC) | Action | Who |
|------------|--------|-----|
| HH:MM | Alert fired: [alert name] | System |
| HH:MM | IC acknowledged, opened war room | [Name] |
| HH:MM | Initial assessment: [summary] | [Name] |
```

### Phase 2: Investigation (5-30 minutes)

Work through these diagnostic layers systematically. Do not jump to conclusions.

#### Layer 1: What Changed?

```
RECENT CHANGES CHECKLIST:
- [ ] Deployments in the last 24 hours (check CI/CD pipeline)
- [ ] Configuration changes (feature flags, environment variables)
- [ ] Infrastructure changes (scaling events, DNS, certificates)
- [ ] Database migrations or schema changes
- [ ] Third-party service status (check status pages)
- [ ] Traffic pattern changes (organic growth, marketing campaign, attack)
- [ ] Scheduled jobs or cron tasks that ran recently
```

#### Layer 2: Where Is It Broken?

```
DIAGNOSTIC FLOW:
1. Check health endpoints for all services in the request path
2. Review error rates by service (which service is the source?)
3. Check resource utilization (CPU, memory, disk, connections)
4. Review recent logs for error spikes (filter by timestamp of onset)
5. Check network connectivity between services
6. Verify database health (connections, replication lag, locks)
7. Check external dependency status
```

#### Layer 3: Correlate Signals

```
CORRELATION QUESTIONS:
- Does the error rate correlate with a specific deployment?
- Does the timing match a known external event?
- Is the failure isolated to one region/zone or global?
- Is the failure isolated to one user segment or universal?
- Are multiple independent alerts firing that share a root cause?
```

### Phase 3: Mitigation (Parallel with Investigation)

The goal is to restore service, not to find root cause. Prioritize mitigation over diagnosis.

#### Mitigation Decision Tree

```
Can you roll back the last deployment?
  Yes, and it was recent -> ROLL BACK NOW, investigate after
  No, or deployment is not the cause -> Continue

Can you disable a feature flag to isolate the failure?
  Yes -> Disable the flag, monitor for recovery
  No -> Continue

Can you scale up to absorb the load?
  Yes, and it is a capacity issue -> Scale up, set alerts for cost
  No -> Continue

Can you failover to a secondary region/instance?
  Yes -> Execute failover runbook
  No -> Continue

Can you apply a targeted hotfix?
  Yes, and the fix is small and well-understood -> Deploy hotfix
  No, or the fix is risky -> Continue

Can you enable a circuit breaker or rate limit?
  Yes -> Apply, monitor degraded-but-stable state
  No -> Escalate to next tier of support
```

### Phase 4: Communication

#### Internal Status Update Template (Every 30 Minutes for SEV-1/2)

```markdown
## Incident Update - [Timestamp UTC]
**Severity**: SEV-[N]
**Status**: [Investigating | Identified | Monitoring | Resolved]
**Impact**: [User-facing description of what is broken]
**Current Theory**: [What we think is causing it]
**Actions in Progress**:
- [Action 1] - [Owner] - [ETA]
- [Action 2] - [Owner] - [ETA]
**Next Update**: [Timestamp UTC]
```

#### External Customer Communication Template

```
[STATUS PAGE / EMAIL]

Title: [Service Name] - [Degraded Performance | Partial Outage | Major Outage]

We are currently experiencing [brief, honest description of impact].

Our team is actively investigating and working to restore full service.
We will provide an update within [30 minutes / 1 hour].

We apologize for the inconvenience.

Last updated: [Timestamp with timezone]
```

#### Communication Rules

1. **Be honest about what you know and do not know.** Never say "no impact" if you are unsure.
2. **Use plain language.** Customers do not care about your microservice topology.
3. **Commit to update cadences and honor them.** Even if the update is "still investigating."
4. **Acknowledge impact.** "We understand this is affecting your workflow."
5. **Never blame individuals in public communications.**

### Phase 5: Resolution and Stabilization

```
RESOLUTION CHECKLIST:
- [ ] Confirm user-facing impact has ended (check metrics, not just logs)
- [ ] Verify fix is stable for at least 15 minutes (SEV-3/4) or 30 minutes (SEV-1/2)
- [ ] Remove any temporary mitigations that should not persist
- [ ] Confirm monitoring is in place to detect recurrence
- [ ] Send final "resolved" communication to all stakeholders
- [ ] Update incident timeline with resolution details
- [ ] Schedule post-incident review (within 48 hours for SEV-1/2)
```

## Post-Incident Review (Blameless)

### Review Meeting Structure (60-90 minutes)

```
AGENDA:
1. Timeline walkthrough (15 min) - What happened, in order
2. Diagnosis review (15 min) - How we found the cause
3. Mitigation review (10 min) - What we did to restore service
4. Detection review (10 min) - How we found out, and how we should have
5. Contributing factors (15 min) - What conditions enabled this failure
6. Action items (15 min) - Concrete improvements with owners and deadlines
```

### Post-Incident Review Document Template

```markdown
# Post-Incident Review: [Title]
**Date**: [Date of incident]
**Severity**: SEV-[N]
**Duration**: [Time from detection to resolution]
**Author**: [Name]
**Reviewers**: [Names]

## Summary
[2-3 sentence description: what happened, impact, resolution]

## Impact
- **Duration**: [X hours Y minutes]
- **Users affected**: [Number or percentage]
- **Revenue impact**: [Estimated or "not quantified"]
- **SLA impact**: [Was SLA breached? By how much?]

## Root Cause
[Detailed technical explanation of the root cause. Be specific.]

## Contributing Factors
- [Factor 1: e.g., "No automated rollback for this service"]
- [Factor 2: e.g., "Alert threshold was too permissive"]
- [Factor 3: e.g., "Runbook was outdated"]

## Timeline
[Detailed timeline from the incident document]

## What Went Well
- [Thing 1: e.g., "Detection was fast, alert fired within 2 minutes"]
- [Thing 2: e.g., "Cross-team collaboration was smooth"]

## What Could Be Improved
- [Thing 1: e.g., "Rollback took 20 minutes due to manual process"]
- [Thing 2: e.g., "Customer communication was delayed"]

## Action Items
| Action | Owner | Priority | Due Date |
|--------|-------|----------|----------|
| Add automated rollback | [Name] | P1 | [Date] |
| Update runbook for [service] | [Name] | P2 | [Date] |
| Add monitoring for [signal] | [Name] | P2 | [Date] |
```

### Blameless Culture Principles

1. **Assume good intentions.** People made the best decisions they could with available information.
2. **Focus on systems, not individuals.** Ask what the system allowed, not who failed.
3. **Treat human error as a symptom.** What system gap enabled the mistake to cause an outage?
4. **Share openly.** Publish reviews widely. Learning dies in silos.
5. **Follow through.** Action items without owners and deadlines are wishes.

## On-Call Best Practices

### On-Call Readiness Checklist

```
BEFORE YOUR ON-CALL SHIFT:
- [ ] Laptop charged and accessible 24/7
- [ ] VPN and access credentials verified
- [ ] Runbook locations bookmarked
- [ ] Escalation contacts confirmed
- [ ] Recent deployments reviewed
- [ ] Known issues list reviewed
- [ ] Alert routing verified (pages reaching your phone)
```

### Alert Design Principles

```
EFFECTIVE ALERTS:
- Alert on symptoms (high error rate), not causes (CPU usage)
- Every alert must have a corresponding runbook
- Alerts must be actionable - if you cannot do anything, it is a log, not an alert
- Set thresholds based on SLO breach risk, not arbitrary numbers
- Use alert severity that matches incident severity
- Deduplicate alerts - one incident, one page

ALERT FATIGUE INDICATORS:
- More than 2 pages per on-call shift that require no action
- Alerts that are routinely acknowledged and ignored
- On-call engineers preemptively silencing alerts
- New team members cannot distinguish critical from noise
```

## Common Failure Patterns and Mitigations

### Pattern: Cascading Failure

```
SYMPTOMS: One service fails, causing dependent services to queue requests,
exhaust connections, and fail themselves.

MITIGATIONS:
- Circuit breakers on all inter-service calls
- Timeouts on every network call (connect + read)
- Bulkheads to isolate failure domains
- Graceful degradation (serve cached/default data)
- Load shedding when capacity is exceeded
```

### Pattern: Thundering Herd

```
SYMPTOMS: Cache expires, all requests hit the database simultaneously,
overwhelming it.

MITIGATIONS:
- Staggered cache expiration (jitter on TTL)
- Cache stampede locks (only one request refreshes)
- Background cache refresh before expiration
- Rate limiting on cache-miss path
```

### Pattern: Deployment-Induced Failure

```
SYMPTOMS: Error rates spike immediately after deployment.

MITIGATIONS:
- Canary deployments (route 1-5% of traffic first)
- Automated rollback on error rate increase
- Feature flags to decouple deploy from release
- Database migration backward compatibility
- Health check gates before routing traffic
```

### Pattern: Resource Exhaustion

```
SYMPTOMS: Service degrades gradually, then fails suddenly. Memory, disk,
connections, or file descriptors exhausted.

MITIGATIONS:
- Resource limits on all containers/processes
- Monitoring with alerts well before exhaustion
- Connection pool sizing with upper bounds
- Log rotation and disk usage monitoring
- Regular load testing to find limits
```

## Incident Metrics to Track

```
- MTTD (Mean Time to Detect): Failure start to alert
- MTTA (Mean Time to Acknowledge): Alert to human response
- MTTR (Mean Time to Resolve): Detection to resolution
- MTBF (Mean Time Between Failures): Interval between incidents
- Action item completion rate from post-incident reviews
```

## Escalation Guidelines

```
WHEN TO ESCALATE:
- You have been investigating for 15 minutes with no progress on SEV-1
- The failure involves a system you do not own or understand
- The mitigation requires access you do not have
- Customer or business impact is growing and you cannot contain it
- You are unsure about the safety of a mitigation action

HOW TO ESCALATE:
1. Page the next tier directly (do not wait for them to notice)
2. Provide a concise summary: what is broken, what you tried, what you need
3. Stay engaged - the person you escalated to needs your context
4. Update the incident channel with the escalation
```

## When to Use

**Use this skill when:**
- Designing or implementing incident responder solutions
- Reviewing or improving existing incident responder approaches
- Making architectural or implementation decisions about incident responder
- Learning incident responder patterns and best practices
- Troubleshooting incident responder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Incident Responder Analysis

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

**Input:** "Help me implement incident responder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended incident responder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When incident responder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
