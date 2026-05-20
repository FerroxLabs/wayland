---
name: incident-response
description: |
  Guides expert-level incident response implementation: debugging and automation decision frameworks, production-ready patterns, and concrete templates for incident response workflows.
  Use when the user asks about incident response, incident response configuration, or devops best practices for incident projects.
  Do NOT use when the user needs a different devops cloud capability -- check sibling skills in the devops cloud subcategory.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops debugging automation"
  category: "devops-cloud"
  subcategory: "devops-cloud"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Incident Response

## When to Use

**Use this skill when:**
- A user asks how to structure or improve their incident response process, runbooks, or on-call rotation
- A user's production system is actively degraded and they need a structured triage and remediation framework
- A user wants to build an incident command system (ICS) for an engineering organization from scratch
- A user needs to design alerting thresholds, severity classification tiers, or escalation policies
- A user is conducting a post-incident review (post-mortem) and wants a blameless, structured format
- A user wants to automate parts of the incident lifecycle -- detection, notification, war-room creation, or status pages
- A user asks about mean time to detect (MTTD), mean time to resolve (MTTR), or related SLO/SLA metrics
- A user wants to implement chaos engineering or game-day exercises to stress-test their incident response posture
- A user is designing on-call schedules, escalation chains, or pager policies in tools like PagerDuty or OpsGenie

**Do NOT use this skill when:**
- The user needs infrastructure provisioning or IaC guidance -- use the infrastructure-as-code skill
- The user wants to design observability pipelines or instrumentation from scratch -- use the observability skill
- The user needs deployment pipeline (CI/CD) design -- use the deployment pipelines skill
- The user is asking about SLO/SLA definition methodology without an incident context -- use the SRE practices skill
- The user wants general monitoring dashboard design without an incident workflow component
- The user is asking about security incident response specifically (CSIRT, SIEM, threat hunting) -- that is a security domain skill
- The user wants log aggregation architecture without the incident response workflow overlay

---

## Process

### 1. Classify the Request Type and Urgency

Before generating any guidance, determine what phase of incident response the user is in or designing for.

- **Active incident (live fire):** The user's system is degraded RIGHT NOW. Skip process design -- go directly to the structured triage checklist. Ask: what are the symptoms, what changed in the last 2 hours, what is the blast radius?
- **Pre-incident design:** The user wants to build or improve their incident response system. Gather context: team size, on-call rotation count, pager tool (PagerDuty, OpsGenie, VictorOps/Splunk On-Call), observability stack (Datadog, Grafana, Prometheus, Honeycomb), cloud platform, and current MTTR baseline.
- **Post-incident review:** The user is conducting a retrospective. Use the blameless post-mortem framework with a 5-why causal chain and action item tracking.
- **Capability building:** The user wants to run chaos/game-day exercises or train their team. Design scenarios around realistic failure modes specific to their stack.

Identify the severity tier immediately if an active incident is involved:

| Severity | Label | Definition | Response SLA |
|---|---|---|---|
| SEV-1 | Critical | Complete service outage or data loss in progress | 5-minute acknowledge, 15-minute bridge |
| SEV-2 | Major | Significant user-facing degradation, >20% error rate or >2x p99 latency | 15-minute acknowledge, 30-minute bridge |
| SEV-3 | Minor | Partial degradation, no data loss, workaround exists | 30-minute acknowledge, 2-hour resolution target |
| SEV-4 | Low | Non-user-facing, caught by monitoring before users notice | Next business day |

### 2. Establish Roles and Incident Command Structure

Every incident needs clear role assignment. Without explicit roles, multiple engineers step on each other or nobody owns the resolution.

- **Incident Commander (IC):** Owns the incident end-to-end. Does NOT do hands-on debugging -- their job is coordination, communication, and decision-making. Runs the timeline. Declares severity. Calls the all-clear.
- **Technical Lead (TL):** The most senior engineer on the affected system. Drives the diagnosis and fix. Reports status to the IC every 10-15 minutes.
- **Communications Lead (CL):** Owns all external and internal communication -- status page updates, customer-facing messaging, stakeholder pings. Frees the IC and TL from Slack/email noise.
- **Scribe:** Maintains the real-time incident timeline in the incident document. Records every hypothesis, action taken, and timestamp. This is the canonical record for the post-mortem.

For teams under 8 engineers: IC and CL roles can be combined. The scribe role can be automated partially with bots that log Slack thread messages to a Google Doc or Confluence page with timestamps.

For teams over 20 engineers: add a **Deputy IC** role for SEV-1/SEV-2 to handle parallel workstreams.

Role assignment must happen within the first 5 minutes of declaring an incident. Use a Slack bot or runbook trigger to auto-assign based on on-call schedule.

### 3. Define the Severity and Alerting Thresholds

Poorly calibrated alerts are the single largest source of on-call engineer burnout. Design alerting with these principles:

- **Signal-to-noise ratio:** Target a false positive rate below 5%. Every alert that fires and requires no action is eroding trust in the paging system.
- **Symptom-based alerting over cause-based alerting:** Alert on "error rate > 5% for 5 minutes" not "CPU > 80%". Users experience symptoms, not resource utilization.
- **Four Golden Signals as the baseline (Google SRE model):** Latency (p50, p95, p99), Traffic (requests per second), Errors (5xx rate, client error rate), and Saturation (CPU, memory, disk, connection pool utilization).
- **Alert on burn rate, not raw thresholds:** For SLO-based alerting, a 5% error budget burn in 1 hour (14.4x burn rate on a 30-day window) should page immediately. A 2% burn in 6 hours (1x burn rate) generates a ticket, not a page.

Specific threshold guidance by signal type:
- HTTP error rate: page at >1% for 5 minutes sustained for SEV-2; >5% for 1 minute for SEV-1
- Latency p99: page at >2x baseline for 10 minutes; >5x baseline for 2 minutes
- Database connection pool: page at >80% utilization for 5 minutes
- Disk I/O saturation: page at >90% for 10 minutes
- Pod restart loops (Kubernetes): page after 3 CrashLoopBackOff events within 15 minutes

### 4. Design the Detection-to-Declaration Pipeline

The path from "something is wrong" to "incident is declared" must be automated to the maximum extent possible. Manual detection adds minutes of MTTD per incident.

- **Synthetic monitoring:** Run probes every 30-60 seconds from at least 3 geographic regions against critical user journeys (login, checkout, core API). Synthetic checks catch outages before real user traffic degrades significantly.
- **Alertmanager / PagerDuty routing rules:** Route alerts to the correct team based on label selectors (e.g., `team=payments`, `env=production`). Avoid "alerts go to everyone" routing -- this diffuses ownership.
- **Auto-declaration webhook:** When a SEV-1 alert fires, a webhook should automatically: create the incident channel (#incident-YYYY-MM-DD-short-description), page the primary on-call, post the alert context into the channel, and create the incident document from a template.
- **Alert grouping and deduplication:** Configure grouping windows (30-60 seconds) to prevent alert storms. A single database failure can generate hundreds of downstream alerts -- group by `alertname` and `cluster` before routing.
- **Runbook links in every alert:** Every alert rule must include a `runbook_url` annotation pointing to the specific remediation steps for that alert. Engineers should never have to hunt for the runbook during an incident.

### 5. Build the Triage and Diagnosis Framework

During an active incident, cognitive load is high. Use structured triage checklists, not free-form debugging.

**The ETTO (Efficiency-Thoroughness Trade-Off) triage sequence:**

1. **Confirm the blast radius first** -- How many users are affected? What percentage of traffic? What geographic regions? This determines whether to escalate severity or downgrade.
2. **Check for a recent change** -- Deployments, config changes, certificate expirations, cron jobs, and traffic spikes in the last 2 hours account for the majority of production incidents. Check deployment history in your CD system before any deep debugging.
3. **Isolate the failing component** -- Use your service map / distributed tracing to pinpoint whether the failure originates at the load balancer, application tier, cache, database, or external dependency. Do not guess.
4. **Validate hypotheses explicitly** -- State the hypothesis ("I think the connection pool is exhausted"), the test ("I will check `pg_stat_activity` for idle connections"), and the result. Log every test in the incident timeline.
5. **Mitigate before root-cause** -- The priority is restoring service. An immediate mitigation (rollback, traffic reroute, cache flush, rate limit) takes precedence over understanding root cause. Root cause analysis belongs in the post-mortem.

Common mitigation actions and their appropriate conditions:
- **Rollback deployment:** When a recent deploy correlates with symptom onset. Use your CD system's rollback capability -- do not manually revert code.
- **Traffic reroute/failover:** When a single AZ or region is degraded. Requires pre-built runbook and tested failover procedure.
- **Feature flag disable:** When a specific feature is causing the incident. Requires feature flag infrastructure (LaunchDarkly, Unleash, etc.) to be in place.
- **Rate limiting / circuit breaking:** When an upstream service is overwhelming a downstream. Configure at the load balancer or service mesh level.
- **Manual horizontal scaling:** When CPU or memory saturation is the root cause. Increase replica count in Kubernetes or auto-scaling group floor temporarily.

### 6. Define the Communication and Status Update Cadence

Communication is the most consistently underperforming aspect of incident response in engineering organizations.

- **Internal update cadence:**
  - SEV-1: Update the incident channel every 10 minutes. No exceptions. "No update -- still investigating" is a valid update.
  - SEV-2: Every 20-30 minutes.
  - SEV-3: Every hour.
- **Status page updates:** Post an initial "Investigating" status page entry within 5 minutes of declaring a SEV-1 or SEV-2. Do not wait until you have the root cause. Update as mitigation actions are taken.
- **Stakeholder communication:** Define who receives direct notification (VP Engineering, Customer Success, Sales) for SEV-1 and any incident affecting enterprise customers. This mapping must be documented in the escalation runbook.
- **Customer-facing language:** Never use technical jargon in public status page updates. "Database query performance degradation" becomes "Some users may experience slower load times." Write for a non-technical reader.
- **Bridge call hygiene:** Mute everyone except IC and TL. Use structured check-ins ("TL, what's the current status?") rather than free-form discussion. Time-box discussions to 3 minutes before taking action.

### 7. Conduct the Blameless Post-Mortem

Post-mortems are the most valuable learning mechanism in SRE practice. They must be completed within 48-72 hours while memory is fresh.

- **Blameless principle:** The post-mortem identifies system and process failures, not individual failures. Phrases like "engineer X should have caught this" are prohibited. The question is always "what about the system made this failure possible?"
- **Timeline reconstruction:** Build a complete chronological timeline with minute-level precision. Use the scribe's notes, deployment logs, alert history, and Slack messages. Include the MTTD (time from first symptom to alert) and MTTR (time from declaration to resolution).
- **Five-Why analysis:** For each contributing factor, ask "why" five times to reach the systemic root cause. Example: Error rate spiked → Why? New deployment → Why did deployment cause errors? No canary deployment → Why no canary? No automated canary policy → Why? Never set one up → Root cause: deployment process lacks canary guardrails.
- **Action items:** Every action item must have: an owner (a specific person, not a team), a due date (within 30 days for SEV-1 action items, 60 days for SEV-2), and a severity label (P1 must fix before next deploy, P2 fix within sprint).
- **Distribution:** Post-mortem documents should be readable by the entire engineering org. Index them in a searchable database. New engineers should read past post-mortems as onboarding material.

### 8. Instrument and Measure Continuous Improvement

Incident response is a system that must be optimized over time. Without metrics, improvement is invisible.

- **Track per-incident:** MTTD, MTTR, severity, affected services, number of action items generated, number of action items completed on time
- **Track aggregate monthly:** Total incidents by severity tier, MTTR trend by tier (target: 20% year-over-year improvement), alert volume (total pages per engineer per week -- target under 5 pages/week to prevent burnout), false positive rate (target <5%)
- **On-call health metrics:** Time spent in incident response vs. project work per week (target: incident response <25% of on-call engineer time for a healthy system)
- **Action item completion rate:** Track the percentage of post-mortem action items completed within their due dates. Below 70% completion indicates a systemic prioritization problem -- action items need to enter the sprint backlog, not a separate tracking system.
- **Chaos engineering cadence:** Run quarterly game-day exercises that simulate realistic failure scenarios. Measure how quickly the team detects the injected failure and executes mitigation. Use tools like Chaos Monkey (Netflix OSS), LitmusChaos (Kubernetes-native), or Gremlin for scenario injection.

---

## Output Format

### Active Incident Triage Checklist

```
INCIDENT: #[NUMBER] | SEV-[LEVEL] | Declared: [TIMESTAMP UTC]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INCIDENT COMMANDER: [name]
TECHNICAL LEAD:     [name]
COMMUNICATIONS:     [name]
SCRIBE:             [name / bot]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SYMPTOMS
- User-facing impact: [describe what users are experiencing]
- Affected services: [list service names]
- Blast radius: [X% of users / X requests/sec affected / specific regions]
- First symptom timestamp: [TIMESTAMP]
- Alerted at: [TIMESTAMP] | MTTD so far: [minutes]

RECENT CHANGES (check last 2 hours)
[ ] Deployments: [yes/no -- list if yes]
[ ] Config changes: [yes/no -- list if yes]
[ ] Infra changes: [yes/no -- list if yes]
[ ] Certificate / secret rotations: [yes/no]
[ ] Upstream dependency changes: [yes/no]

TRIAGE LOG (append entries in real time)
[HH:MM UTC] [IC/TL/name] [action or observation]
[HH:MM UTC] [IC/TL/name] [hypothesis: X | test: Y | result: Z]
[HH:MM UTC] [IC/TL/name] [mitigation applied: description]

MITIGATION STATUS
[ ] Mitigation identified: [description]
[ ] Mitigation applied at: [TIMESTAMP]
[ ] Service restored at: [TIMESTAMP] | MTTR: [minutes]

COMMUNICATION LOG
[HH:MM UTC] Status page updated: [Investigating / Identified / Monitoring / Resolved]
[HH:MM UTC] Stakeholders notified: [list]
[HH:MM UTC] Bridge call opened
```

---

### Post-Mortem Document Template

```markdown
# Post-Mortem: [Incident Title]

**Incident Number:** #[ID]
**Severity:** SEV-[LEVEL]
**Date/Time:** [START] -- [END] UTC
**MTTD:** [minutes] | **MTTR:** [minutes]
**Services Affected:** [list]
**Author:** [name] | **Reviewers:** [names]
**Status:** Draft / In Review / Approved

---

## Executive Summary
[2-3 sentences: what broke, what the user impact was, how it was resolved]

---

## Timeline

| Time (UTC) | Event |
|---|---|
| HH:MM | First symptom observed (describe) |
| HH:MM | Alert fired (alert name, channel) |
| HH:MM | Incident declared, roles assigned |
| HH:MM | [Each diagnostic action and result] |
| HH:MM | Root cause identified |
| HH:MM | Mitigation applied (describe) |
| HH:MM | Service restored |
| HH:MM | All-clear declared |

---

## Root Cause Analysis

### Immediate Cause
[The proximate technical trigger -- e.g., "Connection pool exhausted due to long-running queries"]

### Five-Why Chain
1. Why did the service go down? [answer]
2. Why did [answer 1] happen? [answer]
3. Why did [answer 2] happen? [answer]
4. Why did [answer 3] happen? [answer]
5. Why did [answer 4] happen? [systemic root cause]

### Contributing Factors
- [Factor 1: e.g., "No canary deployment policy meant 100% of traffic hit the bad code"]
- [Factor 2: e.g., "Alert threshold was too conservative -- 10-minute window delayed detection by 8 minutes"]

---

## Impact Assessment

| Metric | Value |
|---|---|
| Duration | X minutes |
| Users affected | X% / X absolute |
| Transactions lost/degraded | X |
| Revenue impact (if known) | $X |
| SLO burn | X% of monthly budget |

---

## What Went Well
- [Detection was fast because synthetic monitoring caught it before users reported it]
- [Rollback procedure was documented and executed in under 3 minutes]

## What Went Poorly
- [Alert did not fire for 8 minutes after first symptom due to aggressive smoothing]
- [No runbook existed for the specific failure mode]

---

## Action Items

| # | Action | Owner | Due Date | Priority |
|---|---|---|---|---|
| 1 | [Specific action] | [Name] | [Date] | P1 |
| 2 | [Specific action] | [Name] | [Date] | P2 |

---

## Lessons Learned
[1-3 sentences summarizing what the organization should take away from this incident]
```

---

### Alerting Rule Template (Prometheus/AlertManager style)

```yaml
groups:
  - name: service-slo-alerts
    interval: 30s
    rules:

      # SEV-1: High error rate -- immediate page
      - alert: HighErrorRateCritical
        expr: |
          sum(rate(http_requests_total{status=~"5..",env="production"}[1m]))
          /
          sum(rate(http_requests_total{env="production"}[1m])) > 0.05
        for: 1m
        labels:
          severity: critical
          team: platform
        annotations:
          summary: "Error rate above 5% for 1 minute"
          description: "Current error rate: {{ $value | humanizePercentage }}"
          runbook_url: "https://runbooks.internal/high-error-rate"

      # SEV-2: Elevated error rate -- warn
      - alert: HighErrorRateMajor
        expr: |
          sum(rate(http_requests_total{status=~"5..",env="production"}[5m]))
          /
          sum(rate(http_requests_total{env="production"}[5m])) > 0.01
        for: 5m
        labels:
          severity: warning
          team: platform
        annotations:
          summary: "Error rate above 1% for 5 minutes"
          runbook_url: "https://runbooks.internal/high-error-rate"

      # Latency p99 degradation
      - alert: LatencyP99Degraded
        expr: |
          histogram_quantile(0.99,
            sum(rate(http_request_duration_seconds_bucket{env="production"}[5m]))
            by (le, service)
          ) > 2.0
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "p99 latency above 2s for service {{ $labels.service }}"
          runbook_url: "https://runbooks.internal/latency-degraded"

      # SLO burn rate alert (fast burn)
      - alert: SLOBudgetFastBurn
        expr: |
          (
            sum(rate(http_requests_total{status=~"5..",env="production"}[1h]))
            /
            sum(rate(http_requests_total{env="production"}[1h]))
          ) > (14.4 * 0.001)
        labels:
          severity: critical
        annotations:
          summary: "SLO error budget burning at 14.4x rate"
          description: "At this rate, the monthly error budget will be exhausted in 2 hours"
          runbook_url: "https://runbooks.internal/slo-burn-rate"
```

---

## Rules

1. **Never let an active incident wait for a process discussion.** If a user is in an active incident, provide the triage checklist and diagnosis framework immediately. Process design questions can be answered after service is restored.

2. **Severity classification must happen within 5 minutes of detection.** Ambiguity about severity directly delays the correct response. When in doubt, declare higher severity and downgrade -- the cost of over-responding is lower than under-responding.

3. **Never design alerts that fire on causes rather than symptoms.** "CPU above 80%" is not a user-impacting event on its own. "Error rate above 1%" is. Cause-based alerts generate noise; symptom-based alerts generate signal. All new alerts must have a documented user impact.

4. **The Incident Commander must never do hands-on technical work during a SEV-1.** The moment the IC starts debugging, coordination breaks down and the incident duration extends. The IC's job is directing, not implementing.

5. **Post-mortems must be blameless and distributed.** Any post-mortem that identifies a person rather than a system as the root cause is invalid. Reframe every individual failure as a system design question: "What made it possible for a person to make this mistake without detection?"

6. **Every alert must have a runbook link.** Engineers should not have to search for remediation steps during an incident. If an alert fires and no runbook exists, the action item is to create the runbook before the alert is considered production-ready.

7. **MTTR target must be defined before the system goes to production, not after the first incident.** MTTR without a target is unactionable. Define SLO-level MTTR expectations (e.g., SEV-1 < 30 minutes, SEV-2 < 2 hours) and instrument tracking from day one.

8. **Never send a vague status page update.** "We are aware of an issue and are investigating" with no context erodes customer trust. Minimum viable status update includes: what users are experiencing, what the team is doing, and when the next update will be posted.

9. **Action items from post-mortems must enter the engineering backlog, not a separate system.** Action items that live only in post-mortem documents have a completion rate below 30%. They must be created as tracked tickets (Jira, Linear, GitHub Issues) and assigned to a sprint within 48 hours of the post-mortem being approved.

10. **Alert volume above 5 pages per engineer per week is a system health emergency.** On-call engineers receiving more than 5 actionable pages per week become desensitized to alerts, make poor decisions under fatigue, and leave the organization. If alert volume exceeds this threshold, freeze all new alert creation and run an alert audit to eliminate noise before adding signal.

---

## Edge Cases

### The Alert Storm (Fan-Out Failure)

When a single infrastructure failure (database down, network partition, DNS failure) causes hundreds of downstream alerts to fire simultaneously, the paging system itself becomes the incident. Engineers receive 50+ pages in 2 minutes and cannot parse the signal.

**Handling:** Implement alert grouping at the AlertManager/PagerDuty level with a 30-60 second grouping window. Group by `cluster`, `environment`, and `alertname`. Route infrastructure-level alerts first -- if a database alert is firing, suppress downstream application alerts that are obviously caused by database unavailability. Configure inhibition rules in AlertManager: a `DatabaseDown` critical alert should inhibit `HighErrorRate` warnings from services that depend on that database. Train the IC to look for the "lowest in the stack" alert as the likely root cause.

### Cascading Failure Across Service Boundaries

A SEV-3 in Service A triggers a latency spike in Service B (which calls A), which triggers a timeout cascade in Service C (which calls B), resulting in an apparent SEV-1 in Service C while Service A's original issue was minor.

**Handling:** The IC must immediately draw the dependency graph. Use distributed tracing (Jaeger, Zipkin, or vendor-equivalent) to find the originating service. Instruct the Technical Lead to check services in dependency order -- if Service C is failing, check what Service C calls before debugging Service C's internals. Implement circuit breakers (Hystrix pattern, Resilience4j, or service mesh policies) between services to prevent cascading. The circuit breaker should open after 5 consecutive failures or a 50% error rate over 10 seconds, with a half-open probe after 30 seconds.

### The "Works in Staging, Broken in Production" Incident

A deployment passes all staging gates but causes a SEV-2 within minutes of production deployment. Classic causes: production traffic volume stress-testing code paths not exercised by staging load, production-specific configuration values (connection pool sizes, feature flags, secrets), or a dependency version mismatch between environments.

**Handling:** The first mitigation action is always a rollback, not a hotfix. Rollback in a working CD system should take under 5 minutes. Only if rollback is impossible (data migration already ran, schema change is not backwards-compatible) should a forward-fix be attempted. For root cause: diff the production and staging environment variables, connection pool configurations, and dependency versions systematically. After resolution, the post-mortem action item should include environment parity tooling -- a script or CI check that validates production-vs-staging configuration drift before each deployment.

### On-Call Engineer Unavailable at Alert Time

The primary on-call does not acknowledge within the escalation window (typically 5 minutes for SEV-1). This can be caused by phone being silenced, engineer being ill, or a misconfigured pager policy.

**Handling:** Every on-call schedule must have an explicit secondary on-call and a defined escalation policy that auto-escalates to the secondary after the acknowledgment timeout. The IC role for a SEV-1 should never be a single point of failure. In PagerDuty/OpsGenie terms: set escalation to auto-escalate after 5 minutes to secondary, then to engineering manager after 10 minutes. Conduct monthly pager policy audits to verify that all engineers have correctly configured their contact methods and notification rules. Run quarterly drill exercises that intentionally test the escalation chain by silencing the primary on-call's test notifications.

### Incident During a Major Deployment Window (Change Freeze Conflict)

An incident occurs during or immediately after a planned major deployment (e.g., a database schema migration, a platform upgrade). Multiple changes landed simultaneously, making it impossible to immediately identify the causal change.

**Handling:** If a deployment window is in progress, halt all further deployments immediately -- do not ship any additional changes while the investigation is active. Roll back the most recent change first (the last deployed item), then verify service health before investigating the previous change. If rollback is impossible, use feature flags to disable recently deployed features one at a time. Post-incident, the action item is to implement a change rate limiter: no more than one significant change per deployment window, with a mandatory 10-minute health check bake period between each change before deploying the next.

### Incident Affects Only a Subset of Users (Percentage-Based Degradation)

The alert fires but only 2-3% of users report errors, and the error pattern seems related to a specific geography, user segment, or request path. Declaring SEV-1 seems like overreach, but the affected users may be high-value enterprise customers.

**Handling:** Severity classification must consider business impact, not just percentage of traffic affected. One enterprise customer on a 500k/year contract counts differently than 2% of free tier users. The runbook should include a business impact query: cross-reference affected user IDs against customer tier in your data warehouse (or ask Customer Success). If high-value customers are affected, declare SEV-1 regardless of traffic percentage. Segment your alerting by customer tier where architecturally feasible -- route traffic from enterprise customers through identifiable request paths that can be monitored separately.

### Legacy System With No Observability

An incident occurs in a legacy monolith or third-party system that has no structured logs, no distributed traces, no metrics beyond basic server CPU/memory, and no deployment history (changes were made manually).

**Handling:** Triage using available signals: server resource metrics, raw application log grep patterns, and user report patterns (are errors geographically localized? browser-specific? time-of-day-correlated?). Check external dependency uptime pages (cloud provider status pages, third-party API status). For the post-mortem, the primary action item is instrumentation -- the legacy system must have at minimum structured error logging, an error rate metric derived from log parsing, and a deployment record process before the next sprint ends. Define a minimum viable observability checklist: structured JSON logs, HTTP error rate metric (derived from nginx/load balancer access logs if application instrumentation is impossible), and a change log (even a manual Confluence page updated before each change).

---

## Example

**Input:** "We had a SEV-2 incident last week. Our payments service returned 500 errors for about 45 minutes affecting roughly 15% of checkout attempts. We identified it eventually but it took us forever and the communication was chaotic. We're a team of 12 engineers, using Kubernetes on AWS, Prometheus/Grafana for metrics, and currently no formal incident process. How do we build a proper incident response system?"

---

**Output:**

This is a textbook scenario for implementing structured incident response. Based on your description -- 45-minute MTTR, 15% of checkouts affected, chaotic communication -- you have three distinct problems to fix: detection speed, diagnosis structure, and communication discipline. Here is the complete implementation plan.

---

### Immediate Priority: Define Severity Tiers and Ownership

For a 12-person team, use four severity tiers with these specific thresholds for a payments service:

| Severity | Trigger | Response |
|---|---|---|
| SEV-1 | Payment error rate >5% for 1 min OR complete checkout unavailability | Page on-call immediately, 15-min bridge |
| SEV-2 | Payment error rate >1% for 5 min OR latency p99 >5s for 10 min | Page on-call, 30-min bridge |
| SEV-3 | Payment error rate >0.1% for 15 min OR anomaly in reconciliation | Ticket, next business day |
| SEV-4 | Monitoring anomaly, no user impact | Backlog |

The incident you described was a SEV-2 by this classification. Had you had this framework, the bridge would have been called within 5 minutes instead of whatever ad-hoc process triggered last week.

---

### Fix 1: Alerting Rules (Root Cause of Slow Detection)

Your current Prometheus setup should add these alert rules immediately:

```yaml
groups:
  - name: payments-slo
    rules:
      - alert: PaymentsHighErrorRate
        expr: |
          sum(rate(http_requests_total{
            service="payments",
            status=~"5..",
            env="production"
          }[1m]))
          /
          sum(rate(http_requests_total{
            service="payments",
            env="production"
          }[1m])) > 0.05
        for: 1m
        labels:
          severity: critical
          team: payments
          runbook: "payments-high-error-rate"
        annotations:
          summary: "Payments error rate critical: {{ $value | humanizePercentage }}"
          runbook_url: "https://runbooks.internal/payments-high-error-rate"

      - alert: PaymentsElevatedErrorRate
        expr: |
          sum(rate(http_requests_total{
            service="payments",
            status=~"5..",
            env="production"
          }[5m]))
          /
          sum(rate(http_requests_total{
            service="payments",
            env="production"
          }[5m])) > 0.01
        for: 5m
        labels:
          severity: warning
          team: payments
        annotations:
          summary: "Payments error rate elevated: {{ $value | humanizePercentage }}"
          runbook_url: "https://runbooks.internal/payments-high-error-rate"

      - alert: PaymentsLatencyDegraded
        expr: |
          histogram_quantile(0.99,
            sum(rate(http_request_duration_seconds_bucket{
              service="payments",
              env="production"
            }[5m])) by (le)
          ) > 5.0
        for: 10m
        labels:
          severity: warning
          team: payments
        annotations:
          summary: "Payments p99 latency above 5s"
          runbook_url: "https://runbooks.internal/payments-latency"
```

Add synthetic monitoring immediately: a heartbeat check that simulates a payment initiation request (not a real charge -- use a dedicated test payment method with Stripe/Adyen/your gateway's test mode) from at least two AWS regions every 60 seconds. This would have caught last week's incident 5-10 minutes earlier than your current alerting.

---

### Fix 2: Role Assignment and Incident Channel Automation

Set up a Slack bot (or use PagerDuty's Slack integration) that triggers when a SEV-1 or SEV-2 alert fires:

1. Creates `#incident-YYYYMMDD-payments-error-rate`
2. Invites the primary on-call (payments team) and the engineering manager
3. Posts the alert context with the Grafana dashboard link and the runbook link
4. Pins a role assignment message:

```
🚨 SEV-2 INCIDENT DECLARED -- 14:32 UTC

INCIDENT COMMANDER: @primary-oncall (you're IC until you assign someone else)
TECHNICAL LEAD: @primary-oncall
COMMUNICATIONS: unassigned -- assign within 5 minutes
SCRIBE: IncidentBot is logging this thread

First action: Confirm roles in thread. Second action: Post current blast radius.
```

With 12 engineers, your IC and TL can be the same person for SEV-2, but Communications must be explicitly assigned to free the TL from Slack noise.

---

### Fix 3: The Payments Service Runbook

Create this runbook at `runbooks.internal/payments-high-error-rate`:

```markdown
# Runbook: Payments High Error Rate

## Immediate Actions (first 5 minutes)

1. Open the Payments dashboard: [Grafana link]
2. Check blast radius: What % of payment attempts are failing?
   - Run: `sum(rate(http_requests_total{service="payments",status=~"5.."}[5m]))`
3. Check for recent deployments:
   - ArgoCD: [link] -- filter to payments namespace, last 2 hours
4. Check downstream dependencies:
   - Database: `kubectl exec -n payments deploy/payments-api -- pg_isready -h $DB_HOST`
   - Payment gateway: Check [status.stripe.com or your gateway's status page]
   - Redis cache: `kubectl exec -n payments deploy/payments-api -- redis-cli -h $REDIS_HOST ping`

## Mitigation Options

### Option 1: Rollback deployment
- ArgoCD: Select payments-api → History → Select previous version → Rollback
- Expected recovery time: 3-5 minutes

### Option 2: Disable payment retry feature flag
- LaunchDarkly: disable `enable-payment-retry` flag in production
- Use when: retry logic appears to be causing cascade failures

### Option 3: Scale up payments-api pods
- `kubectl scale deployment payments-api -n payments --replicas=10`
- Use when: CPU/memory saturation is confirmed root cause

## Escalation
- If not resolved in 30 minutes: page @payments-lead and @vp-engineering
- If database is confirmed cause: page @database-oncall
```

---

### Fix 4: Post-Mortem for Last Week's Incident

Conduct the post-mortem for last week's incident this week -- it is not too late and will be foundational for your new process. Based on your description, the five-why chain likely looks like:

1. Why did checkouts fail? -- Payments service returned 500s
2. Why did payments service return 500s? -- [You need to determine this -- was it a connection pool issue? Deployment? External gateway?]
3. Why did that happen? -- [Investigate]
4. Why wasn't it caught sooner? -- Alerting threshold was either missing or too conservative
5. Why did recovery take 45 minutes? -- No structured triage process and no runbook

Your action items from this post-mortem should be:
- P1, Owner: Platform team lead, Due: this sprint -- Implement the alerting rules above
- P1, Owner: Payments team lead, Due: this sprint -- Create the payments runbook above
- P2, Owner: Engineering manager, Due: next sprint -- Set up Slack incident bot with role prompting
- P2, Owner: Any engineer, Due: next sprint -- Configure synthetic monitoring for checkout flow
- P2, Owner: Engineering manager, Due: 30 days -- Define on-call schedule and escalation policy in PagerDuty/OpsGenie

---

### 30-Day Implementation Roadmap

| Week | Action | Owner |
|---|---|---|
| Week 1 | Deploy alerting rules, create payments runbook, set severity definitions | Platform + Payments lead |
| Week 1 | Conduct last week's post-mortem, file action items as Jira tickets | Engineering Manager |
| Week 2 | Configure Slack incident bot, set up PagerDuty escalation policy | Platform team |
| Week 2 | Implement synthetic checkout monitoring from 2 AWS regions | Payments team |
| Week 3 | Create runbooks for the 5 most common alert types in your system | On-call rotation |
| Week 4 | Run a 1-hour game-day exercise: inject a fake error rate spike, measure MTTD and MTTR | All engineers |
| Week 4 | Set MTTR targets: SEV-1 <30 min, SEV-2 <90 min, measure against them monthly | Engineering Manager |

After 30 days, your target state: MTTD under 5 minutes (currently estimated 15+ minutes based on your description), MTTR under 30 minutes for SEV-2 (currently 45 minutes), and zero incidents where roles were unclear or communication was chaotic.
