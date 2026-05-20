---
name: set-up-monitoring
description: >-
  Complete workflow for building a production monitoring stack from scratch,
  covering metrics collection, alerting strategy, dashboard design, runbook
  creation, and on-call practices. Establishes the observability foundation that
  enables confident deployments and fast incident resolution.

  Use when the user wants to set up monitoring or needs a structured multi-step
  process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  monitoring-engineer logging-architect runbook-writer incident-responder
  resilience-engineer chaos-engineer cicd-architect shell-scripter
trigger_phrases: >-
  I want to set up monitoring I need to build an observability stack How do I
  create alerts and dashboards I want to implement SLOs
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: step-by-step planning
  category: software-project
  depends: >-
    monitoring-engineer logging-architect runbook-writer incident-responder
    resilience-engineer chaos-engineer cicd-architect shell-scripter
  disclaimer: none
  difficulty: intermediate
---
# Set Up Monitoring

**Estimated time:** 2-4 weeks

You cannot manage what you cannot measure. Production monitoring is the difference between proactively resolving issues and finding out from angry users on Twitter. This workflow builds a complete observability stack: metrics collection, structured logging, distributed tracing, dashboards that tell a story, alerts that wake the right person, runbooks that help them fix it, and on-call practices that prevent burnout.

The workflow follows a layered approach: first instrument your services (metrics, logs, traces), then build dashboards for understanding, then create alerts for detection, then write runbooks for resolution, and finally establish on-call practices for response. Each layer depends on the previous one -- there is no point alerting on metrics you do not collect, or going on-call without runbooks.

## When to Use

- User wants to set up monitoring
- User needs a structured, step-by-step process for set up monitoring
- User wants to set up monitoring
- I need to build an observability stack
- How do I create alerts and dashboards
- Do NOT use when: the request is outside the scope of set up monitoring or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- One or more services running in production (or staging)
- Access to infrastructure for deploying monitoring tools
- Basic understanding of HTTP, latency, and error rates
- Team agreement on SLIs (Service Level Indicators) or willingness to define them
- Budget for monitoring infrastructure (self-hosted is possible but requires compute)

## Steps

**Step 1: Define SLIs and SLOs** (uses: monitoring-engineer)

define Service Level Indicators (SLIs) and Service Level Objectives (SLOs) for each service. SLIs are the metrics that matter most to users: availability (successful requests / total requests), latency (p50, p95, p99 response times), and correctness (valid responses / total responses). SLOs are the targets: "99.9% of requests succeed" or "p99 latency < 500ms." Start with 3-5 SLIs per service. SLOs should be aspirational but achievable -- set them based on current performance plus a small improvement margin.

- Input: Services to monitor and their user-facing functionality, Current uptime and performance expectations, Business impact of downtime or degraded performance
- Output: SLI definitions for each service (what to measure, how to measure it), SLO targets for each SLI (with rationale), Error budget calculations (how much downtime is acceptable)
- Key focus: Use the Monitoring Engineer skill to define Service Level Indicators (SLIs) and Service Level Objectives (SLOs) for each service

**Step 2: Instrument Services** (uses: monitoring-engineer)

instrument services with the three pillars of observability. **Metrics**: Expose the four golden signals per service (latency, traffic, errors, saturation) using Prometheus client libraries or OpenTelemetry. **Logs**: Use the Logging Architect skill to implement structured JSON logging with correlation IDs, consistent log levels, and request context. **Traces**: Implement distributed tracing with OpenTelemetry to follow requests across service boundaries. Ensure every request gets a unique trace ID that appears in metrics, logs, and traces.

- Input: SLIs from Step 1, Service technology stacks, Existing instrumentation (if any)
- Output: Metrics instrumentation (four golden signals per service), Structured logging implementation (JSON format, correlation IDs), Distributed tracing configuration (OpenTelemetry SDK)
- Key focus: Use the Monitoring Engineer skill to instrument services with the three pillars of observability

**Step 3: Build Dashboards** (uses: monitoring-engineer)

build a dashboard hierarchy. **Level 1 - Service Overview**: One dashboard per service showing SLI status (green/yellow/red), error budget remaining, and the four golden signals. **Level 2 - Deep Dive**: Detailed dashboards per service showing per-endpoint metrics, database query performance, cache hit rates, and external dependency health. **Level 3 - Infrastructure**: Host/container dashboards showing CPU, memory, disk, and network. Design dashboards to tell a story: when an alert fires, the engineer should be able to navigate from alert to overview to deep-dive to root cause in under 2 minutes.

- Input: Metrics from Step 2, SLIs and SLOs from Step 1, Dashboard audience (engineers, managers, executives)
- Output: Service overview dashboards (one per service), Deep-dive dashboards (per-endpoint, per-dependency), Infrastructure dashboards (host/container resources)
- Key focus: Use the Monitoring Engineer skill to build a dashboard hierarchy

**Step 4: Design Alert Strategy** (uses: monitoring-engineer)

design an alerting strategy that avoids alert fatigue. Alert on SLO violations (error budget burn rate), not on individual metric thresholds. Use multi-window, multi-burn-rate alerting: fast burn (5% of monthly budget in 1 hour) triggers a page, slow burn (10% in 6 hours) triggers a ticket. Use the Resilience Engineer skill to identify failure modes and create alerts for each. Every alert must have: a clear description, severity level, link to dashboard, and link to runbook. If an alert does not require human action, it should not exist.

- Input: SLOs from Step 1, Dashboards from Step 3, Team on-call availability
- Output: Alert definitions with severity levels (page, ticket, informational), Multi-burn-rate SLO alert configuration, Alert routing rules (who gets paged for what)
- Key focus: Use the Monitoring Engineer skill to design an alerting strategy that avoids alert fatigue

**Step 5: Write Runbooks** (uses: runbook-writer)

write a runbook for every alert. Each runbook should include: alert description and severity, likely causes (ranked by probability), diagnostic steps (specific commands and dashboard links), resolution steps (specific actions to take), escalation path (who to call if resolution fails), and verification steps (how to confirm the issue is resolved). Keep runbooks concise -- an on-call engineer at 3 AM should be able to follow them without context. Store runbooks where they are discoverable: link them from alert annotations.

- Input: Alert definitions from Step 4, Known failure modes and their resolutions, Escalation paths and team contacts
- Output: Runbook for every alert (linked from alert annotations), Diagnostic command library (common investigation commands), Escalation path documentation
- Key focus: Use the Runbook Writer skill to write a runbook for every alert

**Step 6: Establish On-Call Practices** (uses: incident-responder)

establish sustainable on-call practices. Define: rotation schedule (weekly or daily rotations), primary and secondary on-call, escalation timeouts (page secondary if primary does not acknowledge in 10 minutes), handoff procedures (outgoing on-call briefs incoming on current issues), and post-incident review process. Set up an incident management workflow: detect (alert fires), triage (severity assessment), respond (follow runbook), communicate (stakeholder updates), resolve (fix the issue), and review (blameless post-mortem).

- Input: Alert and runbook infrastructure from Steps 4-5, Team size and availability, On-call compensation expectations
- Output: On-call rotation schedule, Escalation policy with timeouts, On-call handoff procedure and checklist
- Key focus: Use the Incident Responder skill to establish sustainable on-call practices

**Step 7: Validate with Chaos Testing** (uses: chaos-engineer)

validate that the monitoring stack works. Simulate failures: kill a service instance, saturate CPU, introduce network latency, return errors from a dependency. Verify that alerts fire within the expected timeframe, dashboards reflect the degradation, and the on-call engineer can follow the runbook to diagnose and resolve the issue. Fix any gaps: missing alerts, unclear runbooks, or dashboards that do not show the problem.

- Input: Complete monitoring stack from Steps 1-6, Staging or production environment, Known failure modes to simulate
- Output: Chaos test plan (failure scenarios to simulate), Chaos test results (alert timing, dashboard accuracy, runbook effectiveness), Monitoring gaps identified and fixed
- Key focus: Use the Chaos Engineer skill to validate that the monitoring stack works

## Decision Points

- **After Step ?:** 
  - If **After Step 1**: Align stakeholders on what matters before instrumenting
  - If **After Step 2**: Fix instrumentation gaps before building dashboards
  - If **After Step 4**: Ensure alerts work before writing runbooks for them
  - If **After Step 6**: Fill on-call gaps before running chaos tests

## Failure Handling

- **Monitoring everything, alerting on nothing useful:** -- Collecting metrics is easy; deciding what to alert on is hard. Alert on user-impacting conditions, not internal metrics.
- **Alert fatigue:** -- Too many alerts, especially false positives, train the team to ignore all alerts. Ruthlessly prune noisy alerts.
- **Dashboard sprawl:** -- Twenty dashboards that nobody uses are worse than three dashboards that everyone uses. Design for the investigation workflow.
- **No runbooks:** -- Alerts without runbooks are just noise at 3 AM. Every alert must link to a runbook with specific resolution steps.
- **Vanity SLOs:** -- Setting SLOs at 99.99% when you have never measured your actual availability is setting yourself up for failure. Start realistic.

## Expected Outcome

When this workflow is complete, the user will have:

1. SLOs are met for all services (error budget not exhausted)
2. Mean time to detection (MTTD) is under 5 minutes for SLO violations
3. Mean time to resolution (MTTR) is under 1 hour for P1 incidents
4. Alert signal-to-noise ratio is high (< 10% false positive rate)
5. On-call engineers can diagnose issues using dashboards and runbooks without escalation for 80%+ of incidents
6. Post-incident reviews produce actionable improvements
7. Chaos tests validate monitoring effectiveness quarterly

## Output Format

```
SET UP MONITORING TRACKER
=========================

[ ] Step 1: Define SLIs and SLOs
    Status: [pending/in-progress/complete]
[ ] Step 2: Instrument Services
    Status: [pending/in-progress/complete]
[ ] Step 3: Build Dashboards
    Status: [pending/in-progress/complete]
[ ] Step 4: Design Alert Strategy
    Status: [pending/in-progress/complete]
[ ] Step 5: Write Runbooks
    Status: [pending/in-progress/complete]
[ ] Step 6: Establish On-Call Practices
    Status: [pending/in-progress/complete]
[ ] Step 7: Validate with Chaos Testing
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Monitoring everything, alerting on nothing useful:** -- Collecting metrics is easy; deciding what to alert on is hard. Alert on user-impacting conditions, not internal metrics.
- **Alert fatigue:** -- Too many alerts, especially false positives, train the team to ignore all alerts. Ruthlessly prune noisy alerts.
- **Dashboard sprawl:** -- Twenty dashboards that nobody uses are worse than three dashboards that everyone uses. Design for the investigation workflow.
- **No runbooks:** -- Alerts without runbooks are just noise at 3 AM. Every alert must link to a runbook with specific resolution steps.

## Example

**Input:** "I want to set up monitoring and need a structured plan to follow step by step."

**Output:**

**Step 1 (monitoring-engineer):** Define SLIs and SLOs -- produces concrete deliverables for this phase.

**Step 2 (monitoring-engineer-logging-architect):** Instrument Services -- produces concrete deliverables for this phase.

**Step 3 (monitoring-engineer):** Build Dashboards -- produces concrete deliverables for this phase.

**Step 4 (monitoring-engineer-resilience-engineer):** Design Alert Strategy -- produces concrete deliverables for this phase.

**Step 5 (runbook-writer):** Write Runbooks -- produces concrete deliverables for this phase.

**Step 6 (incident-responder):** Establish On-Call Practices -- produces concrete deliverables for this phase.

**Step 7 (chaos-engineer):** Validate with Chaos Testing -- produces concrete deliverables for this phase.

**Result:** User has a complete set up monitoring plan with all deliverables produced, validated, and ready for implementation.
