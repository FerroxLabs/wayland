---
name: handle-production-incident
description: >-
  Orchestrates end-to-end production incident management from detection
  through resolution and retrospective, chaining five skills into a
  complete incident lifecycle pipeline. Covers triage, log investigation,
  monitoring verification, documentation, and team retrospective.
  Use when handling a production incident that affects users and requires
  coordinated response, investigation, resolution, and follow-up.
  Do NOT use for non-production issues, minor bugs that do not affect
  users, or planned maintenance activities.
license: Apache-2.0
type: workflow
skills: incident-response logging-patterns monitoring-alerting technical-documentation retrospective-facilitator
trigger_phrases: handle production incident manage outage respond to production issue production incident management
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: devops troubleshooting security planning step-by-step
  category: software-project
  depends: incident-response logging-patterns monitoring-alerting technical-documentation retrospective-facilitator
  disclaimer: none
  difficulty: advanced
  interactivity: "auto"
---

# Handle Production Incident

**Estimated time:** Active incident: minutes to hours. Postmortem and retrospective: 1-3 days after resolution.

This workflow chains five atomic skills into the complete lifecycle of handling a production incident from initial detection through resolution, documentation, and team retrospective. Unlike the debug-production-issue workflow (which focuses on technical diagnosis for a single engineer), this workflow covers the full organizational response including coordination, communication, documentation, and process improvement.

**Critical note:** During an active incident, speed matters more than perfection. Steps 1-3 are executed under time pressure with the goal of restoring service as quickly as possible. Steps 4-5 are executed after the incident is resolved and are focused on learning and prevention.

## When to Use

- Production service is degraded or down, affecting users
- An alert has fired indicating a significant production issue requiring coordinated response
- A security breach or data integrity issue has been detected in production
- User needs a structured incident management process from detection through prevention
- Do NOT use when: the issue is in a development or staging environment only, the issue is a minor bug with a known workaround and no urgency, or the user needs planned maintenance procedures rather than incident response

## Prerequisites

Before starting this workflow, ensure:

1. **Incident is confirmed:** The issue affects production users or production systems and is not a false alarm
2. **Communication channel is active:** A real-time communication channel is available for incident coordination (team chat channel, video call, or equivalent)
3. **Production access is available:** Responders have access to production logs, monitoring dashboards, deployment tools, and configuration management
4. **On-call responsibility is clear:** You know who is responsible for the affected service and who can authorize production changes

## Steps

**Step 1: Triage and Coordinate Response** (uses: incident-response)

Classify the incident severity, assign roles, and establish the communication cadence. This step activates the response structure and determines how many resources to allocate based on user impact.

- Input: Alert or report that triggered the incident, initial symptoms, affected service identification, team availability
- Output: Incident classification with: severity level (P1 critical, P2 high, P3 medium), incident commander assignment, investigation lead assignment, communication coordinator assignment (for P1), affected user count estimate, initial communication sent to stakeholders, and status update cadence established
- Key focus: Classify by user impact within 5 minutes. P1: complete outage or data loss affecting all users (all hands, 15-minute updates). P2: partial degradation affecting significant users (on-call plus backup, 30-minute updates). P3: minor degradation with workaround (on-call engineer, hourly updates). Speed of classification matters more than precision; severity can be adjusted as investigation proceeds.

**Step 2: Investigate Root Cause** (uses: logging-patterns)

Dive into logs, traces, and system state to identify the root cause. This step is the core investigation that determines what broke and why.

- Input: Incident classification from Step 1, production log access, deployment history, configuration change history, time window of incident onset
- Output: Investigation findings with: root cause identified (or narrowed to 2-3 hypotheses), evidence collected (specific log entries, error patterns, correlation with recent changes), timeline reconstructed (when the issue started, what triggered it, how it progressed), and recommended resolution approach (rollback, configuration change, hotfix, or scaling)
- Key focus: Check the most recent changes first. Over 70 percent of production incidents are caused by a recent deployment, configuration change, or infrastructure modification. Use structured queries: filter by time window, error level, and affected service. Trace individual failing requests end-to-end using correlation IDs. Document everything you find during investigation; these notes become the postmortem timeline.

**Step 3: Resolve and Verify with Monitoring** (uses: monitoring-alerting)

Apply the fix and use monitoring to verify the resolution. This step restores service and confirms that the incident is truly resolved rather than temporarily masked.

- Input: Root cause and resolution approach from Step 2, deployment or configuration tools, monitoring dashboards, pre-incident baseline metrics
- Output: Resolution confirmation with: fix applied (rollback, config change, hotfix, or scaling), monitoring showing metrics returning to baseline, resolution criteria met (specific thresholds sustained for minimum time period), incident timeline updated with resolution timestamp, and status page updated to "Resolved"
- Key focus: Choose the fastest resolution path. Rollback (under 5 minutes) for deployment-caused issues. Configuration change (under 2 minutes) for misconfigurations. Scaling (under 10 minutes) for load-related issues. Hotfix (30+ minutes) only when rollback is not possible. After applying the fix, define specific resolution criteria: "Error rate below 0.1 percent for 10 consecutive minutes." Do not declare resolved until monitoring confirms sustained recovery.

**Step 4: Write the Postmortem** (uses: technical-documentation)

Document the incident comprehensively for organizational learning. The postmortem is the primary artifact that prevents recurrence and improves future response.

- Input: Investigation notes and timeline from Steps 1-3, monitoring data and screenshots, communication records, resolution details
- Output: Postmortem document with: incident summary (one paragraph), detailed timeline (minute-by-minute for P1, event-by-event for P2/P3), root cause analysis (what failed and why), contributing factors (what made this possible), impact summary (duration, affected users, revenue impact), action items (prevention, detection improvement, response improvement, each with owner and deadline), and lessons learned
- Key focus: Postmortems are blameless. The question is never "who made the mistake" but "why did the system allow this to happen." Every postmortem must produce at least 3 action items: one for prevention (stop it from happening), one for detection (catch it faster), and one for response (resolve it faster). Each action item has an owner and a deadline.

**Step 5: Facilitate Team Retrospective** (uses: retrospective-facilitator)

Conduct a team retrospective focused on the incident response process. This step goes beyond the technical postmortem to examine how the team coordinated, communicated, and made decisions during the incident.

- Input: Postmortem document from Step 4, team feedback on the incident response process, incident timeline with decision points
- Output: Retrospective outcomes with: what went well during the response (practices to continue), what could be improved (process gaps), action items for process improvement (updated runbooks, improved tooling, training needs), team alignment on incident response expectations, and scheduled follow-up to verify action items are completed
- Key focus: Separate technical improvements (postmortem action items from Step 4) from process improvements (retrospective action items from this step). Technical: "Add database connection pool monitoring." Process: "Establish a clearer escalation path so the on-call engineer is not the bottleneck for all decisions." The retrospective should make the team better at handling the next incident, not just preventing this specific one.

## Decision Points

- **At Step 1:** If the incident involves a security breach or data loss, activate additional procedures: legal notification, customer communication, regulatory reporting. These run parallel to the technical response in Steps 2-3.

- **At Step 2:** If the root cause is not identified within 30 minutes (P1) or 60 minutes (P2), escalate. Bring in additional engineering expertise, contact vendor support for third-party dependencies, or broaden the investigation scope.

- **At Step 3:** If the first resolution attempt does not work, roll back the fix immediately. The original issue is known and bounded; a failed fix is unknown and potentially worse. Return to Step 2 with new information.

- **At Step 5:** If the retrospective reveals systemic issues (no monitoring for the affected metric, no runbook for the affected service, no escalation path defined), escalate these findings to engineering leadership as infrastructure investments, not just action items.

## Failure Handling

- **Step 1 severity is unclear:** Default to higher severity. Over-classification (treating P3 as P1) wastes some time but keeps users informed. Under-classification (treating P1 as P3) causes user frustration and reputational damage.

- **Step 2 logs are insufficient:** If structured logging was not in place, use monitoring metrics, deployment history, and infrastructure events to triangulate the root cause. Add improved logging as a postmortem action item.

- **Step 3 fix does not resolve the incident:** The root cause hypothesis was incorrect. Roll back the fix, return to Step 2, and investigate alternative hypotheses. Common trap: fixing a symptom instead of the cause.

- **Step 4 postmortem is delayed beyond 48 hours:** Schedule it immediately. Details fade quickly, and delayed postmortems produce weaker action items. If key participants are unavailable, write the technical timeline first and schedule the full postmortem for when participants are available.

- **Step 5 team is reluctant to participate in retrospective:** Frame it as process improvement, not blame. Start with what went well. Use structured formats (Start/Stop/Continue) to keep the discussion productive. Limit the retrospective to 60 minutes to respect time.

## Expected Outcome

When this workflow is complete, the user will have:

1. A classified incident with severity, blast radius, and communication plan established within 5-10 minutes
2. Root cause identified through structured investigation with evidence and timeline
3. Incident resolved with monitoring confirming sustained recovery and metrics returning to baseline
4. A blameless postmortem with timeline, root cause analysis, impact summary, and at least 3 action items with owners and deadlines
5. Team retrospective outcomes with process improvements for future incident response
6. Action items tracked and scheduled for completion to prevent recurrence

## Output Format

```
INCIDENT MANAGEMENT REPORT
============================

Incident: [INC-YYYY-NNNN]
Severity: [P1/P2/P3]
Service: [affected service]
Duration: [start] to [resolution]
Impact: [users affected, revenue impact]

[ ] Step 1: Triage
    Severity: [P1/P2/P3]
    Incident Commander: [name]
    Communication cadence: [interval]

[ ] Step 2: Investigation
    Root cause: [description]
    Evidence: [key findings]
    Timeline: [reconstructed]

[ ] Step 3: Resolution
    Fix applied: [description]
    Resolution time: [duration]
    Verification: [metrics confirmed]

[ ] Step 4: Postmortem
    Document: [link]
    Action items: [count]
    Owners assigned: [yes/no]

[ ] Step 5: Retrospective
    Conducted: [date]
    Process improvements: [count]
    Follow-up scheduled: [date]

Overall Status: [ACTIVE / RESOLVED / POSTMORTEM COMPLETE]
```

**Adaptation notes:**
- For P3 incidents, abbreviate Steps 4-5 (brief postmortem, skip formal retrospective)
- For recurring incidents, emphasize systemic action items in Steps 4-5
- For incidents involving multiple teams, assign a dedicated incident commander in Step 1

## Edge Cases

- **Incident during another incident:** Assess whether the incidents are related (common root cause) or independent. Related incidents are treated as one with broader scope. Independent incidents each get a separate commander and communication channel.
- **Incident caused by a third-party dependency:** Resolution options are limited to circuit breakers, fallback behavior, or caching. The postmortem should evaluate redundancy options for the external dependency.
- **Incident discovered during off-hours:** On-call engineer handles Steps 1-3. If severity is P3 with tolerable impact, apply temporary mitigation and defer full investigation to business hours. P1 and P2 require immediate full response regardless of time.
- **No clear root cause after extended investigation:** Apply broad mitigations (restart services, scale up, clear caches), add targeted monitoring, and document the unknown root cause. Schedule a follow-up investigation window if the incident recurs.
- **Incident with customer data exposure:** Activate data breach procedures parallel to technical response. Legal, compliance, and customer communication teams must be notified immediately. The postmortem must include a data audit confirming the exposure scope and remediation actions.

## Example

**Scenario:** "The checkout API is returning 500 errors for all purchase attempts. Revenue is directly affected. The issue started 20 minutes ago."

**Input:** PagerDuty alert: "checkout-api error rate above 10 percent for 15 minutes." Current error rate: 100 percent on POST /v1/checkout. Impact: all purchases blocked. Infrastructure: Node.js on Kubernetes, PostgreSQL, Redis, Stripe integration. Team: 8 engineers, 2 SREs. Last deployment: 3 hours ago (v4.7.2).

**Output:** Incident resolved, postmortem completed, retrospective conducted with 5 action items.

**Step 1 (incident-response):** Triage at T+0 minutes: P1 (complete checkout failure, all revenue blocked). Incident commander: senior SRE. Investigation lead: backend engineer familiar with checkout service. Communication coordinator: engineering manager. Status page updated at T+5 minutes: "Investigating: customers may be unable to complete purchases." Internal stakeholders notified via Slack. Customer support briefed with talking points. 15-minute update cadence established.

**Step 2 (logging-patterns):** Investigation at T+5 to T+25 minutes. Filtered checkout-api logs: 100 percent of POST /v1/checkout requests failing with "Redis connection refused" since T-20 minutes. Redis cluster status: primary node unreachable, replica promotion in progress but not completing. Cross-reference: the v4.7.2 deployment (3 hours ago) updated Redis client library from v3 to v4, which changed the default connection timeout from 30 seconds to 5 seconds. Redis had a brief network blip at T-20 minutes; the old client would have reconnected after the 30-second timeout, but the new client times out after 5 seconds and does not retry. Root cause: Redis client library update reduced connection resilience.

**Step 3 (monitoring-alerting):** Resolution at T+25 to T+35 minutes. Fix applied: increased Redis connection timeout to 30 seconds and enabled automatic reconnection in the client configuration. Configuration change deployed via Kubernetes ConfigMap update (no code deployment needed). Monitoring verification: checkout error rate dropped from 100 percent to 0.2 percent within 3 minutes. Revenue metrics resumed normal levels at T+30 minutes. Resolution criteria met at T+35 minutes (error rate below 0.1 percent for 10 consecutive minutes). Status page updated to "Resolved" at T+37 minutes. Total incident duration: 37 minutes.

**Step 4 (technical-documentation):** Postmortem completed within 24 hours. Root cause: Redis client library upgrade (v3 to v4) changed default timeout from 30 seconds to 5 seconds without documentation review. Contributing factors: no integration test for Redis connection resilience, library upgrade was tested for functional correctness but not resilience behavior, no alerting on Redis connection failure rate (only on checkout error rate). Impact: 37 minutes of complete checkout outage, estimated 450 failed purchase attempts, estimated revenue impact of $23,000. Action items: (1) Add Redis connection resilience integration test, owner: backend lead, 5 days. (2) Add Redis connection failure rate alert, owner: SRE, 3 days. (3) Add library upgrade checklist including timeout and retry behavior review, owner: tech lead, 7 days.

**Step 5 (retrospective-facilitator):** Retrospective conducted 2 days post-incident with full team. What went well: fast triage (P1 classified in 5 minutes), clear communication (status page updated within 5 minutes, customer support briefed within 10 minutes), configuration fix avoided the risk of a code deployment during the incident. What to improve: the library upgrade should have been tested against connection failure scenarios, the 3-hour gap between deployment and incident made the connection less obvious initially. Process action items: (4) Add "resilience testing" to the deployment verification checklist, owner: SRE team, 10 days. (5) Create a runbook for Redis connection failures, owner: platform team, 7 days. Follow-up scheduled for 2 weeks to verify all 5 action items are complete.

**Result:** Checkout outage resolved in 37 minutes. Postmortem produced 3 technical action items and retrospective produced 2 process action items, all with owners and deadlines. Redis resilience testing added to CI pipeline within 1 week, preventing a similar incident when the payment service's Redis configuration was updated the following month.
