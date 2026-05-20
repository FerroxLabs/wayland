---
name: incident-response
description: |
  Orchestrates the full incident lifecycle from initial triage through postmortem documentation, chaining five software-development skills into a structured incident management workflow. This workflow chains the incident-response skill with logging, monitoring, deployment, and documentation skills.
  Use when the user is handling an active production incident and needs a structured process from detection through resolution and postmortem.
  Do NOT use for non-production issues, planned maintenance, or post-incident analysis only (use technical-documentation directly for standalone postmortems).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "devops troubleshooting security step-by-step"
  category: "software-development"
  depends: "incident-response logging-patterns monitoring-alerting deployment-strategies technical-documentation"
  disclaimer: "none"
  difficulty: "advanced"
---

# Incident Response Workflow

**Estimated time:** Active incident (minutes to hours for resolution, plus 1-3 days for postmortem)

This workflow chains five atomic skills into the full lifecycle of handling a production incident. It is distinct from the incident-response atomic skill: the atomic skill covers triage and initial response techniques, while this workflow orchestrates the entire lifecycle from detection through resolution, recovery verification, and postmortem documentation. Each step addresses a different phase of the incident and uses a different skill, ensuring that logging, monitoring, deployment, and documentation are coordinated throughout the response.

**Critical note:** During an active incident, speed matters more than perfection. Steps 1-3 are executed under time pressure. Steps 4-5 are executed after the incident is resolved and users are no longer affected.

## When to Use

- User is responding to an active production incident (service degradation, outage, data issue)
- User needs a structured process for incident triage, diagnosis, resolution, and postmortem
- User wants to improve their incident response practice from ad-hoc firefighting to systematic response
- User needs to coordinate multiple people during an incident (incident commander, investigators, communicators)
- Do NOT use when: the issue is in a development or staging environment only, the user needs planned maintenance procedures (use deploy-to-production), or the user wants to write a postmortem for a past incident without active response (use technical-documentation directly)

## Prerequisites

Before starting this workflow, ensure:

1. **Incident is confirmed:** The issue affects production users or production systems -- not a false alarm or test environment issue
2. **Access is available:** You have access to production logs, monitoring dashboards, and deployment tools (or know who does)
3. **Communication channel exists:** You have a way to communicate with stakeholders in real time (Slack channel, Teams chat, phone bridge, or equivalent)
4. **On-call rotation is defined:** You know who is responsible for the affected service (or you are that person)
5. **Previous incident history is accessible:** You can review past incidents for similar symptoms (incident database, wiki, or postmortem archive)

## Steps

**Step 1: Triage and Classify the Incident** (uses: incident-response)

Assess the incident scope, severity, and impact to determine the response urgency and resource allocation. This step uses the incident-response skill's triage framework to quickly classify the incident and activate the response structure.

- Input: Alert or report that triggered the incident, initial symptoms (error messages, user reports, monitoring alerts), affected service or component
- Output: Incident classification with: severity level (P1 critical, P2 high, P3 medium), affected user count estimate, affected service components, incident commander assignment, communication plan (who to notify, at what intervals), initial hypothesis for root cause
- Key focus: Classify severity based on user impact, not technical complexity:
  - **P1 (critical):** Complete service outage, data loss, or security breach affecting all users. Response: all hands, 15-minute status updates, customer communication within 30 minutes.
  - **P2 (high):** Partial degradation affecting a significant portion of users (over 10%) or a critical feature is broken. Response: on-call team plus escalation, 30-minute status updates.
  - **P3 (medium):** Minor degradation, workaround exists, or issue affects fewer than 10% of users. Response: on-call engineer investigates, hourly status updates.
  Do not spend more than 10 minutes on initial triage. A wrong severity can be corrected; a slow triage delays the entire response.

**Step 2: Investigate Using Logs and Traces** (uses: logging-patterns)

Dive into logs and distributed traces to identify the root cause or narrow the investigation to a specific component. This step uses structured logging patterns to filter, correlate, and trace the incident from symptom to source.

- Input: Incident classification from Step 1 (affected services, initial hypothesis), access to log aggregation platform, time window of incident start
- Output: Investigation findings with: identified error patterns (specific error messages, stack traces, frequency), affected code paths (which endpoints, which functions), timeline reconstruction (when did the issue start, was there a triggering event), root cause hypothesis (confirmed or narrowed to 2-3 candidates)
- Key focus: Start with the most recent deployment or configuration change. Over 70% of production incidents are caused by a recent change. Check: was there a deployment in the last 24 hours? A configuration change? A database migration? A third-party service outage? Filter logs by the incident time window and look for the first ERROR-level entry -- the earliest error is usually closest to the root cause. Use request IDs to trace a single failing request through all services. Avoid the trap of investigating symptoms instead of causes -- a spike in 500 errors is a symptom, the database connection pool exhaustion causing them is the cause.

**Step 3: Verify Impact Using Monitoring Data** (uses: monitoring-alerting)

Use monitoring dashboards and metrics to quantify the incident's impact, verify whether the root cause hypothesis from Step 2 is correct, and establish the baseline for confirming resolution. This step provides the data-driven evidence that guides the resolution approach.

- Input: Investigation findings from Step 2, monitoring dashboards, pre-incident baseline metrics
- Output: Impact assessment with: quantified user impact (error count, affected request percentage, degradation duration), metric correlation confirming or refuting the root cause hypothesis, blast radius definition (which services, which regions, which user segments), resolution success criteria (specific metric thresholds that indicate the incident is resolved)
- Key focus: Compare current metrics against the pre-incident baseline to quantify impact precisely. "The API is slow" becomes "p95 response time increased from 200ms to 4,500ms affecting the /v1/orders endpoint, starting at 14:32 UTC, impacting approximately 3,200 active users." This precision guides the urgency of the resolution and provides the data for the postmortem. Define resolution criteria in measurable terms: "Incident is resolved when p95 response time on /v1/orders returns below 500ms for 10 consecutive minutes."

**Step 4: Deploy the Fix** (uses: deployment-strategies)

Deploy the fix (hotfix, rollback, configuration change, or infrastructure scaling) to resolve the incident. This step uses deployment strategy patterns but with incident-specific modifications: faster deployment cycles, reduced testing (the production environment IS the test), and a bias toward rollback over forward-fix when the root cause is uncertain.

- Input: Root cause from Steps 2-3, fix (code change, configuration update, rollback to previous version, or infrastructure change), deployment tooling
- Output: Deployed fix with: deployment log, traffic migration to fixed version, verification that the fix resolves the symptoms, monitoring confirmation that metrics are returning to baseline
- Key focus: Choose the fastest resolution path:
  - **Rollback:** If the incident was caused by a recent deployment, roll back to the last known-working version. This is the fastest resolution (under 5 minutes for most deployment platforms). Roll back first, investigate the root cause after users are restored.
  - **Configuration change:** If the issue is a misconfiguration (wrong environment variable, expired credential, feature flag), fix the configuration without deploying new code. Configuration changes propagate faster than code deployments.
  - **Hotfix:** If the issue requires a code change and rollback is not possible (the previous version has a different critical bug, or a database migration prevents rollback), deploy a minimal code fix through an expedited pipeline. Skip non-critical CI stages (skip linting, keep unit and integration tests) to reduce deployment time.
  - **Scaling:** If the issue is load-related (traffic spike, resource exhaustion), scale the affected service immediately and investigate the capacity planning gap after resolution.

**Step 5: Write the Postmortem** (uses: technical-documentation)

Document the incident from detection through resolution with analysis of root cause, contributing factors, and prevention measures. This step is executed after the incident is resolved and users are no longer affected. The postmortem is the primary artifact that prevents the same incident from recurring.

- Input: Incident timeline from Steps 1-4, monitoring data and screenshots, log excerpts, communication records, resolution details
- Output: Postmortem document with: incident summary (one-paragraph description), timeline (minute-by-minute for P1, hour-by-hour for P2/P3), root cause analysis (what failed, why it failed, why existing safeguards did not prevent it), impact summary (duration, affected users, financial impact if applicable), action items (prevention measures with owners and deadlines), lessons learned
- Key focus: Postmortems are blameless. Focus on system failures, not individual mistakes. The question is not "who made the error" but "why did the system allow the error to reach production." Every postmortem must produce at least 3 concrete action items with assigned owners and deadlines:
  - **Detection improvement:** How can this be caught faster? (better monitoring, better alerts, better health checks)
  - **Prevention:** How can this be prevented? (better testing, better code review, automated safeguards)
  - **Response improvement:** How can the response be faster? (better runbooks, better tooling, better on-call training)

## Decision Points

- **At Step 1:** Severity determines response scope:
  - **P1:** Incident commander takes charge, all relevant engineers join the response channel, status page updated within 15 minutes, executive notification within 30 minutes. If root cause is not identified within 30 minutes, escalate to the next tier of engineering expertise.
  - **P2:** On-call engineer leads response, one additional engineer as backup. Status page updated within 30 minutes. If root cause is not identified within 60 minutes, escalate to P1 response procedures.
  - **P3:** On-call engineer investigates solo. No immediate status page update. If not resolved within 4 hours, escalate to P2.

- **At Step 2:** If the investigation reveals the incident involves **data loss or a security breach**, stop the standard workflow and activate the data breach or security incident procedure. These incidents have additional requirements: legal notification, customer communication, regulatory reporting. Return to this workflow for the resolution and postmortem steps after the security-specific procedures are complete.

- **At Step 4:** If the incident was caused by a **customer-facing issue** (incorrect data displayed, wrong calculation, broken user workflow), communicate the resolution to affected users proactively. Do not wait for users to discover the fix. If the incident caused **data corruption**, the fix deployment must include a data repair step (script to correct affected records) in addition to the code or configuration fix.

- **After Step 5:** If the postmortem reveals the incident was caused by a **systemic issue** (e.g., no integration tests for the affected code path, no monitoring for the affected metric, no runbook for the affected service), the action items should address the systemic gap, not just the specific incident. A postmortem that only prevents the exact same incident is insufficient -- it should prevent the category of incident.

## Failure Handling

- **Step 1 triage cannot determine severity (unclear impact):** If the impact is ambiguous (intermittent errors, unclear user count), default to a higher severity level. It is safer to over-classify (P1 that turns out to be P3) than under-classify (P3 that turns out to be P1). Downgrade the severity after investigation if the impact is lower than initially assessed.

- **Step 2 logs are insufficient to identify root cause:** If structured logging was not in place for the affected service, or logs were not retained for the incident time window, use monitoring metrics (Step 3) to narrow the investigation. Cross-reference deployment history (was there a recent change?), infrastructure events (did any service restart, did any dependency go down?), and external dependencies (is a third-party API experiencing issues?). Add improved logging as a postmortem action item.

- **Step 3 monitoring does not cover the affected area:** If monitoring does not have metrics for the affected service or endpoint, you cannot quantify the impact precisely. Estimate impact from available data: error logs (count distinct affected users), support tickets (user reports), and revenue data (transaction drops). Add monitoring coverage as a postmortem action item.

- **Step 4 fix does not resolve the incident:** If the deployed fix does not restore metrics to baseline, the root cause hypothesis from Step 2 was incorrect or incomplete. Roll back the fix to avoid compounding the issue with an untested change. Return to Step 2 with new information: the original hypothesis was wrong, what other hypotheses explain the symptoms? Common trap: fixing a symptom instead of the cause (restarting a service without fixing the memory leak that caused the crash).

- **Step 4 rollback is not possible:** If the previous version cannot be restored (database migration prevents rollback, the previous version had a security vulnerability, the previous version is incompatible with current infrastructure), the only path is a forward-fix. Identify the minimum viable fix (smallest code change that resolves the user-facing impact), deploy it through the fastest available pipeline, and plan a comprehensive fix for after the incident is resolved.

- **User wants to skip the postmortem (Step 5):** Every incident that reaches P1 or P2 severity must have a postmortem. No exceptions. The postmortem is what prevents recurring incidents. For P3 incidents, a brief postmortem (summary, root cause, one action item) is sufficient. Schedule the postmortem within 48 hours of incident resolution while details are fresh.

## Edge Cases

- **Cascading failure across multiple services:** If the incident affects multiple services (Service A's failure causes Service B to degrade, which causes Service C to fail), prioritize the root service (Service A) during investigation. Do not attempt to fix downstream services until the root cause service is restored. The downstream failures will resolve automatically once the root cause is fixed.

- **Incident during another incident:** If a second incident occurs while the first is still active, assess whether they are related (common cause, cascading effect) or independent. If related, treat them as a single incident with a broader scope. If independent, assign a separate incident commander and response team for the second incident.

- **Incident caused by a third-party dependency:** If the root cause is a third-party service outage (payment provider, email service, CDN), the fix options are limited: enable circuit breakers to gracefully degrade, switch to a backup provider if available, or communicate the third-party dependency to users. The postmortem should evaluate whether the dependency can be made redundant or whether the degradation behavior can be improved.

- **Incident discovered during off-hours:** If the incident is detected by automated alerting outside business hours, the on-call engineer handles Steps 1-4. If the severity is P3 and the impact is tolerable, it may be acceptable to acknowledge the incident, apply a temporary mitigation (increase timeouts, scale up), and defer full investigation to business hours. P1 and P2 incidents require immediate full response regardless of time.

- **Incident with no clear root cause:** If after 2 hours of investigation (Step 2) no root cause is identified, the options are: (1) escalate to specialized engineering (database team, infrastructure team, vendor support), (2) apply broad mitigations (restart affected services, scale up, clear caches) and monitor for recurrence, (3) add instrumentation (more logging, more metrics) to capture data if the incident recurs. Document the unknown root cause in the postmortem with a plan for improving observability.

- **Incident affecting data integrity:** If the incident caused incorrect data to be written (wrong calculations, duplicate records, corrupted references), the resolution in Step 4 must include a data repair plan in addition to the code fix. Identify the affected data scope (which records, which time window), write a repair script that corrects the data, test the script on a staging copy of the production database, and execute it as a tracked migration. Notify affected users if the data corruption was visible to them. The postmortem must include a data audit confirming all affected records were corrected.

- **Recurring incident (same failure mode, different trigger):** If the postmortem in Step 5 reveals this incident is similar to a previous one (same service, same failure pattern, different root cause), the action items must address the systemic vulnerability, not just the latest trigger. For example, if the payments service has had three incidents from three different query bugs, the systemic fix is automated query performance testing in CI, not patching each individual query.

- **Incident requiring customer data access for diagnosis:** If debugging requires querying production databases containing customer data, follow data access protocols: use read-only replicas when possible, log all queries executed during investigation, limit result sets to the minimum needed for diagnosis, and redact personally identifiable information in any screenshots or log excerpts shared in the incident channel. The postmortem should note what customer data was accessed and why it was necessary.

- **Incident with customer-visible data corruption:** If users received incorrect data (wrong prices, wrong account balances, misattributed content), the resolution must include both a technical fix and a customer remediation plan. After deploying the fix in Step 4, generate a list of affected users and the specific data they saw. Work with customer support to send proactive notifications explaining the error, what was corrected, and any compensation offered. The postmortem in Step 5 must include the customer impact timeline and the remediation actions taken.

## Expected Outcome

When this workflow is complete, the user will have:

1. A classified incident with severity level, affected user count, blast radius, and communication plan activated within 10 minutes of detection
2. Root cause identified (or narrowed to 2-3 candidates) through structured log analysis, trace correlation, and deployment history review
3. Quantified impact assessment with specific metrics (error count, affected users, revenue impact, duration) replacing vague descriptions of "the system is slow"
4. The incident resolved via the fastest available path (rollback, configuration change, hotfix, or scaling) with monitoring confirmation that metrics returned to baseline
5. A blameless postmortem document with minute-by-minute timeline, root cause analysis, contributing factors, and at least 3 concrete action items with assigned owners and deadlines
6. Systemic improvements planned that prevent the category of incident, not just the specific recurrence
7. An incident response pattern that the team can repeat for future incidents, reducing mean time to resolution with each iteration

## Output Format

The workflow produces incident artifacts throughout the response, culminating in a postmortem document:

```
incidents/YYYY-MM-DD-incident-title/
  timeline.md            # Steps 1-4: Minute-by-minute incident timeline
  investigation-notes.md # Step 2: Log analysis findings and hypotheses
  impact-assessment.md   # Step 3: Quantified user and business impact
  resolution-log.md      # Step 4: Fix deployment details and verification
  postmortem.md          # Step 5: Complete postmortem document
    ## Summary
    ## Timeline
    ## Root Cause Analysis
    ## Impact
    ## Resolution
    ## Action Items (with owners and deadlines)
    ## Lessons Learned
  screenshots/           # Monitoring dashboard screenshots during incident
  logs/                  # Relevant log excerpts
```

## Example

**Scenario:** "Production API returning 500 errors on all payment-related endpoints after a deployment 2 hours ago."

**Input:** PagerDuty alert: "payments-api error rate above 5% for 10 minutes." Affected service: payments-api v2.3.1, deployed 2 hours ago. Impact: users cannot complete purchases. Infrastructure: Node.js on ECS, PostgreSQL on RDS, Stripe for payment processing. Team: 3 backend engineers, 1 SRE on call.

**Output:** Resolved incident with restored payment processing and postmortem with 4 action items.

**Step 1 (incident-response):**
Triage: P1 (complete failure of payment functionality). Incident commander: SRE on call. Investigation team: 2 backend engineers. Communication: ops-incidents Slack channel created, status page updated to "Investigating payment processing issues" within 8 minutes of alert. Initial hypothesis: related to v2.3.1 deployment (2 hours ago). Customer support notified to expect payment-related tickets. 15-minute status update cadence established.

**Step 2 (logging-patterns):**
Filter logs: payments-api version v2.3.1, level ERROR, time window last 2 hours. Finding: 847 occurrences of "TypeError: Cannot read property 'customer_id' of undefined" in POST /v1/payments/charge handler. Stack trace points to line 142 of charge-controller.ts where the code reads stripe_customer from a database query result that returns null. Cross-reference: the v2.3.1 migration renamed the column from stripe_customer_id to payment_provider_id but the query in charge-controller.ts still references the old column name. Root cause confirmed: column rename in migration not reflected in application query.

**Step 3 (monitoring-alerting):**
Impact quantification: 1,247 failed payment attempts over 2 hours (100% failure rate on payment endpoints). 312 unique affected users. Estimated revenue impact: $47,000 in failed transactions (based on average transaction value). No data corruption -- failed payments were not partially processed. Non-payment endpoints unaffected (stable error rate, normal response times). Resolution criteria: payment endpoint error rate below 0.1% for 10 consecutive minutes, and at least 10 successful payment transactions confirmed in logs.

**Step 4 (deployment-strategies):**
Resolution path: rollback to v2.3.0. Rationale: the database migration added the new column but did not drop the old one (backward-compatible migration), so the old application version can still query stripe_customer_id. Rollback executed: ECS service updated to v2.3.0 task definition, ALB health check confirms new tasks healthy, traffic drained from v2.3.1 tasks. Total rollback time: 3 minutes 22 seconds. Verification: first successful payment transaction logged at 16:47 UTC, error rate dropped to 0% within 2 minutes. Resolution criteria met at 16:57 UTC. Status page updated to "Resolved." Customer support given talking points for affected users. Forward fix for v2.3.2: update query to use payment_provider_id column, add integration test that verifies payment flow against migrated schema.

**Step 5 (technical-documentation):**
Postmortem document completed within 36 hours. Root cause: application code referenced a database column that was renamed in a migration, but no integration test verified the payment flow against the migrated schema. Contributing factors: (1) code review did not cross-reference migration changes with application queries, (2) staging environment had a stale database that was not migrated before deployment verification. Action items: (1) Add integration test that executes a complete payment flow against a migrated test database -- owner: backend lead, deadline: 5 business days. (2) Add CI step that runs migrations on a fresh database and executes all integration tests against the migrated schema -- owner: SRE, deadline: 10 business days. (3) Add pre-deployment checklist item: verify staging database is migrated before smoke testing -- owner: team process update, deadline: 2 business days. (4) Add monitoring alert for column-not-found database errors to catch migration mismatches within minutes -- owner: SRE, deadline: 5 business days.

**Result:** Payment processing restored in 3 minutes via rollback. 312 affected users received proactive communication with instructions to retry their purchases. Postmortem produced 4 action items that prevent migration-related incidents from reaching production. v2.3.2 deployed successfully 3 days later with the column reference fix and new integration tests.
