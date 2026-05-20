---
name: runbook-writer
description: |
  Expert operational runbook creation covering runbook structure, alert-to-runbook mapping, step-by-step procedures, escalation paths, rollback procedures, verification steps, communication templates, post-incident updates, and automation opportunities.
  Use when the user asks about runbook writer, runbook writer best practices, or needs guidance on runbook writer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "technical-writing documentation devops"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Runbook Writer

## Overview

This skill provides comprehensive expertise in creating operational runbooks that enable on-call engineers to respond to incidents effectively, consistently, and quickly. Well-written runbooks reduce Mean Time to Resolution (MTTR), prevent knowledge loss, minimize human error during high-stress situations, and serve as the operational backbone for reliable systems.

## Runbook Structure

### Standard Runbook Template

```markdown
# [RB-042] Database Connection Pool Exhaustion

**Last Updated:** 2025-01-15
**Owner:** Platform Team (@platform-oncall)
**Review Cadence:** Quarterly

## Alert Details

| Field | Value |
|-------|-------|
| Alert Name | `db-pool-exhaustion-warning` |
| Severity | P2 (High) |
| Monitoring | Datadog Monitor #12345 |
| Dashboard | [Database Overview]([reference URL]) |
# ... (condensed) ...
  FROM pg_stat_activity
  WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
  AND state != 'idle'
  ORDER BY duration DESC;
"
```

## Resolution Steps

### Step 1: Kill long-running queries (if present)

If the diagnosis shows long-running queries (>5 minutes):

\```shell
# Kill a specific query by PID
psql -h $DB_HOST -U $DB_USER -c "SELECT pg_terminate_backend(<PID>);"

# Kill all queries running longer than 10 minutes
psql -h $DB_HOST -U $DB_USER -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity

**Verification:** Connection count should start dropping within 30 seconds.

### Step 2: Increase pool size temporarily (if needed)

If connections are legitimately high (traffic spike, not runaway queries):

\```shell
# Scale up PgBouncer pool
kubectl edit configmap pgbouncer-config -n production
# Change: default_pool_size = 50  →  default_pool_size = 100

# Restart PgBouncer to apply
kubectl rollout restart deployment/pgbouncer -n production
\```

**Verification:**
\```shell
# Confirm new pool size
kubectl run-cmd -it pgbouncer-xxx -n production -- \
  psql -p 6432 pgbouncer -c "SHOW POOLS;"
\```

### Step 3: Restart affected services (last resort)

If connections are stuck and cannot be terminated:

\```shell
# Rolling restart of the API service
kubectl rollout restart deployment/api-service -n production

# Watch for pods to come back healthy
kubectl rollout status deployment/api-service -n production
\```

**Verification:** API health endpoint returns 200:
\```shell
HTTP client request -s [reference URL] | jq .
\```

## Verification Checklist

After resolution, confirm ALL of these:

- [ ] Database connection count below 50% of pool maximum
- [ ] API P95 latency below 500ms
- [ ] Error rate below 0.1%
- [ ] Health check endpoint returning `healthy`
- [ ] No long-running queries (> 5 minutes)
- [ ] Monitoring alert has cleared

## Rollback

If the resolution made things worse:

1. **Revert PgBouncer config:** `kubectl rollout undo deployment/pgbouncer -n production`
2. **Revert API deployment:** `kubectl rollout undo deployment/api-service -n production`
3. **Escalate** to the database team (see Escalation Path below)

## Escalation Path

| Condition | Escalate To | Contact |
|-----------|------------|---------|
| Cannot resolve within 15 min | Platform Team Lead | @platform-lead (Slack) |
| Database server itself unresponsive | DBA On-Call | PagerDuty: DBA rotation |
| Revenue impact > $10K/hour | Engineering Director | @eng-director (Slack) + phone |
| Data integrity concern | DBA + Security | PagerDuty: DBA + Security rotation |

## Communication Templates

### Internal Status Update (Slack)
\```
:rotating_light: *Incident: Database Connection Pool Exhaustion*
*Status:* Investigating / Mitigating / Resolved
*Impact:* API errors affecting ~X% of requests
*Cause:* [Brief description]
*ETA:* [Estimated time to resolution]
*Responders:* @name1, @name2
\```

### Status Page Update
\```
Title: Elevated API Error Rates
Status: Investigating

## Root Cause Analysis Triggers

File an RCA if any of the following apply:
- Incident lasted longer than 30 minutes
- User-facing impact affected >5% of requests
- Revenue impact exceeded $1,000
- Same alert fired 3+ times in 30 days
- Resolution required escalation beyond on-call

## Automation Opportunities

| Step | Can Automate? | How |
|------|--------------|-----|
| Kill queries > 10 min | Yes | Cron job + pg_terminate_backend |
| Pool size scaling | Yes | HPA based on connection metrics |
| Service restart | Partial | Automated if health check fails 3x |
| Communication | Yes | PagerDuty → Slack integration |
| Diagnosis commands | Yes | Bot command: `/diagnose db-connections` |
\```
```

## Alert-to-Runbook Mapping

### Mapping Strategy

```
Alert-to-Runbook Mapping System:

1. Every alert MUST link to a runbook
   ├── Include runbook URL in alert description/annotations
   ├── Alert with no runbook = incomplete alert
   └── "What to do when this fires" is mandatory documentation

2. Alert naming convention
   ├── {service}-{resource}-{condition}
   ├── Example: api-service-high-latency

3. Mapping table (maintain in a central location)

| Alert Name | Runbook | Owner | Last Tested |
|-----------|---------|-------|-------------|
| api-high-latency | RB-001 | API Team | 2025-01-01 |
| db-pool-exhaustion | RB-042 | Platform | 2025-01-10 |
| cert-expiry-warning | RB-015 | Security | 2024-12-15 |
| disk-space-critical | RB-008 | Platform | 2025-01-05 |
| payment-timeout | RB-023 | Payments | 2024-12-20 |
```

### Prometheus Alert with Runbook Link

```yaml
# prometheus-rules.yaml
groups:
  - name: database
    rules:
      - alert: DatabaseConnectionPoolExhaustion
        expr: |
          pg_stat_activity_count / pg_settings_max_connections * 100 > 80
        for: 5m
```

## Step-by-Step Procedure Guidelines

### Writing Effective Procedures

```
Step Writing Rules:
├── One action per step (never combine multiple commands)
├── Every command must be copy-pasteable
```

### Conditional Branching in Runbooks

```markdown
### Step 2: Determine the cause

Check the query profile:

\```shell
psql -h $DB_HOST -c "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"
\```

**If `active` count is high (> 50):**
→ Long-running queries are the likely cause. Go to [Step 3A: Kill long-running queries](#step-3a).

**If `idle` count is high (> 80):**
→ Connection leak in the application. Go to [Step 3B: Restart application services](#step-3b).

**If `idle in transaction` count is high (> 20):**
→ Transaction not being committed/rolled back. Go to [Step 3C: Fix idle transactions](#step-3c).
```

## Escalation Paths

### Escalation Matrix Template

```markdown
## Escalation Matrix

### Severity Definitions

| Severity | Criteria | Response Time | Escalation Timer |
|----------|----------|--------------|-----------------|
| P1 Critical | Service completely down, data loss risk | 5 min | 15 min to team lead |
| P2 High | Major feature degraded, >10% users affected | 15 min | 30 min to team lead |
| P3 Medium | Minor feature degraded, <10% affected | 1 hour | 4 hours to team lead |
| P4 Low | Non-impacting anomaly, monitoring alert | Next business day | N/A |

### Escalation Chain

\```
Level 0: On-call engineer (automatic PagerDuty)
  └── Cannot resolve in 15 min (P1) or 30 min (P2)?

### Contact Information

| Role | Name | Slack | Phone | PagerDuty |
|------|------|-------|-------|-----------|
| Platform On-Call | (rotation) | @platform-oncall | PagerDuty | Platform schedule |
| DBA On-Call | (rotation) | @dba-oncall | PagerDuty | DBA schedule |
| Platform Lead | Jane Smith | @jsmith | 555-0101 | Direct |
| Eng Director | Bob Jones | @bjones | 555-0102 | Direct |
```

## Rollback Procedures

### Rollback Decision Framework

```
Rollback Decision Tree:

Is the issue caused by a recent deployment?
├── YES
│   ├── Can you identify and fix the bug quickly (< 15 min)?
```

### Rollback Command Templates

```markdown
### Kubernetes Deployment Rollback

\```shell
# View recent deployment history
kubectl rollout history deployment/api-service -n production

# Rollback to previous version
kubectl rollout undo deployment/api-service -n production

# Rollback to a specific revision
kubectl rollout undo deployment/api-service -n production --to-revision=42

# Verify rollback
kubectl rollout status deployment/api-service -n production
kubectl get pods -n production -l app=api-service
\```

### Database Migration Rollback

\```shell
# View current migration version
flyway info -url=$DB_URL

# Rollback last migration
flyway undo -url=$DB_URL

# Verify schema state
psql -h $DB_HOST -c "SELECT * FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;"
\```
```

## Communication Templates

### Incident Communication Framework

```markdown
### Initial Notification (within 5 minutes of detection)

**Slack (#incidents channel):**
\```
:rotating_light: **[P2] Incident Declared: Elevated API Error Rates**

**Detected:** 2025-01-15 14:32 UTC
**Impact:** ~15% of API requests returning 500 errors
**Affected:** Product search, order creation
**Responders:** @oncall-engineer
**Status page:** Will be updated shortly
**Runbook:** [reference URL]
\```

### Status Update (every 15-30 minutes during P1/P2)

**Slack:**
\```
:yellow_circle: **Update: Elevated API Error Rates**

**Time:** 2025-01-15 14:50 UTC (18 min into incident)
**Status:** Mitigating
**Progress:** Identified root cause as database connection pool exhaustion.
Killing long-running queries and scaling pool size.
**ETA:** Expect resolution within 15 minutes.
**Error rate:** Dropped from 15% to 5% after initial mitigation.
\```

### Resolution Notification

**Slack:**
\```
:large_green_circle: **Resolved: Elevated API Error Rates**

**Duration:** 14:32 - 15:05 UTC (33 minutes)
**Root Cause:** Runaway analytics query caused connection pool exhaustion
**Resolution:** Terminated long-running query, added query timeout safeguard
**Action Items:** RCA scheduled for 2025-01-16 10:00 UTC
**Incident Doc:** [reference URL]
\```

### Customer-Facing Status Page Updates

**Investigating:**
> We are investigating reports of intermittent errors affecting our API.
> Some users may experience failures when searching for products or
> placing orders. We are actively investigating and will provide
> an update within 30 minutes.

**Identified:**
> We have identified the cause of the API errors and are implementing
> a fix. We expect the issue to be resolved within 15 minutes.

**Resolved:**
> The issue causing API errors has been resolved. All services are
> operating normally. We apologize for the inconvenience. A full
> incident report will be published within 48 hours.
```

## Post-Incident Updates

### Runbook Improvement Process

```
After every incident, update the runbook:

1. What was the actual resolution?
   ├── Did the runbook steps work as written?
   ├── Were steps missing or incorrect?
   └── Update the steps to match what actually worked

2. What diagnosis was needed?
   ├── Were the diagnostic commands sufficient?
   ├── Were additional checks needed?
   └── Add any new diagnostic commands

3. What communication happened?
   ├── Were stakeholders notified promptly?
   ├── Were the templates useful?
   └── Update templates based on actual communications

4. What could be automated?
   ├── Which manual steps were repetitive?
   ├── Which steps could a bot/script handle?
   └── File tickets for automation work

5. Update metadata
   ├── Last tested date
   ├── Resolution time (actual vs. estimated)
   └── Link to incident report
```

## Runbook Maintenance

### Lifecycle Management

```
Runbook Maintenance Schedule:
├── On every incident: Update with lessons learned
├── Monthly: Review top-triggered runbooks for accuracy
```

### Runbook Testing

```markdown
## Testing Protocol

Runbooks should be tested regularly in a non-production environment:

1. **Tabletop exercise (monthly):** Walk through the runbook verbally
   with the on-call rotation. Identify unclear steps.

2. **Simulation (quarterly):** Inject the failure in staging and follow
   the runbook exactly as written. Time the resolution.

3. **Game day (bi-annually):** Controlled failure injection in production
   during business hours with all hands on deck.

4. **New hire onboarding:** Have new on-call engineers follow runbooks
   in staging. Their questions reveal unclear steps.
```

## Production Checklist

- [ ] Every production alert has a linked runbook
- [ ] Runbook has clear symptom description and impact assessment
- [ ] Diagnostic commands are copy-pasteable and tested
- [ ] Resolution steps are numbered with one action per step
- [ ] Each step has a verification checkpoint
- [ ] Rollback procedures are documented for each resolution step
- [ ] Escalation path includes names, contacts, and conditions
- [ ] Communication templates are pre-written and ready to customize
- [ ] Runbook was tested by someone other than the author
- [ ] Automation opportunities are identified and tracked
- [ ] Metadata (owner, last updated, last tested) is current
- [ ] Post-incident update process is followed after every incident

## When to Use

**Use this skill when:**
- Designing or implementing runbook writer solutions
- Reviewing or improving existing runbook writer approaches
- Making architectural or implementation decisions about runbook writer
- Learning runbook writer patterns and best practices
- Troubleshooting runbook writer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Runbook Writer Analysis

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

**Input:** "Help me implement runbook writer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended runbook writer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When runbook writer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
