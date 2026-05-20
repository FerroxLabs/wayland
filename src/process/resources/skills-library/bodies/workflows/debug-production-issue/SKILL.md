---
name: debug-production-issue
description: >-
  Orchestrates systematic production debugging from alert through root cause
  identification and resolution, chaining four engineering skills into a
  structured diagnostic pipeline. Covers incident triage, log analysis,
  performance investigation, and monitoring verification.
  Use when the user is investigating a production issue that requires
  structured diagnosis beyond simple log reading.
  Do NOT use for development environment bugs, planned performance optimization,
  or incidents that require the full incident-response workflow with postmortem.
license: Apache-2.0
type: workflow
skills: incident-response logging-patterns performance-profiling monitoring-alerting
trigger_phrases: debug production issue investigate production bug fix production error diagnose production problem
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: devops troubleshooting optimization step-by-step
  category: software-project
  depends: incident-response logging-patterns performance-profiling monitoring-alerting
  disclaimer: none
  difficulty: advanced
---

# Debug Production Issue

**Estimated time:** 30 minutes to 8 hours (depending on issue complexity and observability quality)

This workflow chains four atomic skills into a structured diagnostic process for production issues. It covers the path from initial alert or report through systematic investigation to confirmed root cause and verified resolution. Unlike the full incident-response workflow (which includes postmortem and organizational coordination), this workflow focuses purely on the technical debugging process for a single engineer or small team.

**Critical note:** If the issue is a P1 outage affecting all users, use the handle-production-incident workflow instead. This workflow is for targeted debugging of specific issues that do not require full incident management coordination.

## When to Use

- User is investigating a production bug, error spike, or performance degradation
- User has received an alert or user report about unexpected production behavior
- User needs a systematic approach to narrow down root cause from symptoms
- User wants to move beyond ad-hoc debugging to structured diagnostic process
- Do NOT use when: the issue is a full-scale outage requiring incident management (use handle-production-incident), the issue is in a development environment, or the user is doing planned performance optimization (use performance-profiling directly)
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

1. **Issue is confirmed in production:** The bug, error, or degradation is happening in the production environment, not just in staging or development
2. **Observability tools are accessible:** You have access to log aggregation, monitoring dashboards, and application performance monitoring for the affected service
3. **Reproduction information exists:** You have at least one of: an alert with timestamps, a user report with steps to reproduce, or a monitoring anomaly with a time range
4. **Deployment history is available:** You can check what was deployed recently (last 24-72 hours) to the affected service

## Steps

**Step 1: Triage and Classify the Issue** (uses: incident-response)

Assess the issue scope, severity, and blast radius to determine the investigation approach. This step uses incident triage techniques to quickly classify the problem and decide whether to investigate or escalate.

- Input: Alert details, user reports, initial symptoms (error messages, degraded metrics, unexpected behavior), affected service identification
- Output: Issue classification with severity assessment, affected user count estimate, blast radius (which services and endpoints), initial hypothesis for root cause, and investigation plan (which logs and metrics to examine first)
- Key focus: Spend no more than 10 minutes on triage. Classify by user impact: how many users affected, what functionality is broken, is there a workaround. Check deployment history immediately since over 70 percent of production issues are caused by recent changes.

**Step 2: Investigate Logs and Traces** (uses: logging-patterns)

Dive into structured logs and distributed traces to identify the root cause or narrow the investigation. This step uses log correlation techniques to trace the issue from symptom to source component.

- Input: Issue classification from Step 1 (affected services, time window, initial hypothesis), access to log aggregation platform, request IDs or trace IDs from affected requests
- Output: Investigation findings with identified error patterns, affected code paths, timeline reconstruction (when the issue started, was there a triggering event), and root cause hypothesis (confirmed or narrowed to 2-3 candidates)
- Key focus: Start with the most recent deployment or configuration change. Filter logs by the issue time window and look for the first ERROR-level entry, as the earliest error is usually closest to the root cause. Use request IDs to trace a single failing request through all services. Distinguish symptoms from causes: a spike in 500 errors is a symptom, database connection pool exhaustion causing them is the cause.

**Step 3: Profile Performance and Resource Usage** (uses: performance-profiling)

If the issue involves latency, timeouts, or resource exhaustion, profile the affected service to identify the bottleneck. This step uses performance profiling techniques to pinpoint whether the issue is CPU-bound, memory-bound, I/O-bound, or caused by external dependency latency.

- Input: Investigation findings from Step 2 (suspected component, affected code paths), profiling tools for the technology stack, baseline performance metrics for comparison
- Output: Performance profile identifying the bottleneck: slow database queries (with query plans), memory leaks (allocation patterns), CPU hotspots (flame graph analysis), or external dependency latency (timeout patterns and retry storms)
- Key focus: Compare current performance against the pre-issue baseline. Quantify the degradation: "Query X takes 4.2 seconds now versus 120ms before the issue started." Look for resource exhaustion patterns: connection pool depletion, thread pool saturation, memory growth over time, or file descriptor limits.

**Step 4: Verify Resolution with Monitoring** (uses: monitoring-alerting)

After applying the fix (code change, configuration update, rollback, or scaling), use monitoring to verify the resolution. This step confirms that the fix actually resolves the issue and does not introduce new problems.

- Input: Applied fix (the change made to resolve the issue), monitoring dashboards, pre-issue baseline metrics, resolution success criteria defined during investigation
- Output: Verification report confirming metrics have returned to baseline, affected error rates have dropped to normal levels, and no new anomalies appeared as a side effect of the fix
- Key focus: Define specific resolution criteria before applying the fix: "Error rate on endpoint X drops below 0.1 percent for 10 consecutive minutes." Monitor for at least 15-30 minutes after the fix to catch delayed effects. Check adjacent services for unexpected impact from the fix.

## Decision Points

- **At Step 1:** If the triage reveals the issue is a security breach or data loss, stop this workflow and escalate to the security-audit-codebase or handle-production-incident workflow. Security incidents require additional coordination beyond technical debugging.

- **At Step 2:** If logs are insufficient to identify the root cause (poor logging coverage, logs rotated, or no structured logging), skip to Step 3 (performance profiling) to gather data from a different angle. Add improved logging as a follow-up task.

- **At Step 3:** If the issue is not performance-related (functional bug, incorrect business logic, data corruption), skip this step and proceed directly to fix implementation and Step 4 verification.

- **After Step 4:** If the fix does not resolve the issue (metrics do not return to baseline), the root cause hypothesis was incorrect. Return to Step 2 with new information and investigate alternative hypotheses.

## Failure Handling

- **Step 1 cannot determine severity:** If the impact is unclear (intermittent errors, unclear user count), assume higher severity and investigate urgently. Downgrade after Step 2 provides more data.

- **Step 2 logs show no errors:** If logs appear clean despite the reported issue, check for silent failures: swallowed exceptions, incorrect error handling that returns success, or client-side errors not reaching the server. Also verify you are looking at the correct service and time window.

- **Step 3 profiling impacts production performance:** If attaching a profiler causes additional latency, use sampling-based profiling (low overhead) rather than instrumentation-based profiling. Alternatively, reproduce the issue in a staging environment with production-like data and profile there.

- **Step 4 fix introduces new issues:** Roll back the fix immediately. The original issue is known and bounded; a new issue from the fix is unknown and potentially worse. Return to Step 2 to find a different fix approach.

- **Issue is intermittent and cannot be reproduced:** Add targeted logging and monitoring for the specific failure condition identified in Step 2. Set alerts to trigger immediately on recurrence. Prepare the investigation context so the next occurrence can be debugged quickly.

## Expected Outcome

When this workflow is complete, the user will have:

1. A classified issue with severity, blast radius, and affected user count quantified
2. Root cause identified through structured log analysis and trace correlation
3. Performance bottleneck profiled and quantified (if applicable) with specific metrics
4. Issue resolved and verified through monitoring with confirmed return to baseline metrics
5. Investigation notes documenting the root cause, fix applied, and any follow-up tasks for preventing recurrence

## Output Format

```
PRODUCTION DEBUG REPORT
========================

Issue: [brief description]
Severity: [P1/P2/P3]
Affected Service: [service name and version]
Time Window: [start] to [resolution]

Triage:
  Blast radius: [affected endpoints/users]
  Initial hypothesis: [what we suspected]

Investigation:
  Root cause: [confirmed root cause]
  Evidence: [key log entries, metrics, traces]
  Contributing factors: [what made this possible]

Resolution:
  Fix applied: [description of fix]
  Deployment: [how the fix was deployed]
  Verification: [metrics confirming resolution]

Follow-up:
  [ ] [prevention task 1]
  [ ] [prevention task 2]

Timeline: [total investigation and resolution time]
Overall Status: [RESOLVED / MITIGATED / INVESTIGATING]
```

**Adaptation notes:**
- For intermittent issues, Steps 2-3 may need multiple iterations as the issue recurs
- Skip Step 3 entirely for functional bugs that have no performance component
- For multi-service issues, run Steps 2-3 in parallel across affected services

## Edge Cases

- **Issue only affects a subset of users:** Check for user-specific factors: geographic region (CDN or DNS issues), account age (data migration gaps), feature flags (partial rollout gone wrong), or device type (client-side rendering differences).
- **Issue started weeks ago but was just reported:** The recent deployment history may not be relevant. Expand the investigation window and check for gradual degradation patterns (slow memory leak, growing database table without index, certificate approaching expiration).
- **Multiple issues occurring simultaneously:** Determine whether the issues share a root cause (cascading failure from a single component) or are independent. Investigate the oldest or most severe issue first unless one issue is clearly causing the others.
- **Issue is in a third-party dependency:** If the root cause is an external service outage or API change, the fix options are limited to circuit breakers, fallback behavior, or caching. Document the external dependency risk for future mitigation.
- **No monitoring or logging infrastructure:** If the affected service has minimal observability, the debugging process will rely on manual reproduction and code inspection. Add observability as the highest-priority follow-up task after resolving the immediate issue.

## Example

**Scenario:** "Users report that the search feature returns no results intermittently. The issue started yesterday and affects approximately 15 percent of search requests."

**Input:** User support tickets reporting empty search results, Datadog alerts showing search API error rate at 15 percent (normally under 1 percent), affected service: search-api v3.2.1, deployed 2 days ago. Tech stack: Python FastAPI, Elasticsearch, Redis cache.

**Output:** Resolved search issue with verified fix and monitoring confirmation.

**Step 1 (incident-response):** Triage: P2 severity (partial degradation, 15 percent of users affected, core feature broken). Blast radius: search-api only, other services unaffected. Initial hypothesis: related to v3.2.1 deployment 2 days ago since the error rate increase aligns with the deployment timestamp. Investigation plan: examine search-api logs for the error pattern, check Elasticsearch cluster health, review v3.2.1 changes.

**Step 2 (logging-patterns):** Filtered search-api logs for ERROR level entries in the past 48 hours. Found 2,847 occurrences of "ConnectionError: Elasticsearch connection pool exhausted" in the search handler. Cross-referenced with v3.2.1 changelog: the update added a new aggregation query for search analytics that runs alongside every search request. The aggregation query holds a connection for 3-5 seconds (versus 50ms for the search query), gradually depleting the connection pool under normal traffic. Root cause confirmed: v3.2.1 analytics aggregation query exhausts the Elasticsearch connection pool.

**Step 3 (performance-profiling):** Profiled connection pool usage: baseline pool size is 20 connections, search queries use 1 connection for 50ms, analytics aggregation uses 1 connection for 3-5 seconds. At 100 concurrent search requests, the analytics queries consume all 20 connections within 10 seconds, causing subsequent searches to fail with connection timeout. The issue is intermittent because it depends on concurrent traffic volume.

**Step 4 (monitoring-alerting):** Fix applied: moved analytics aggregation to an asynchronous background task that runs on a separate connection pool with a pool size of 5. Deployed v3.2.2. Monitoring verification: search API error rate dropped from 15 percent to 0.02 percent within 5 minutes. Elasticsearch connection pool utilization dropped from 95 percent to 40 percent. Search response time p95 returned to 120ms (from 4.2 seconds during pool exhaustion). Resolution criteria met after 20 minutes of stable metrics.

**Result:** Search functionality fully restored. Root cause was an analytics query consuming shared database connections. Fix isolated analytics to a separate connection pool. Follow-up tasks: add connection pool utilization alert at 80 percent threshold, review other services for similar connection pool sharing patterns.
