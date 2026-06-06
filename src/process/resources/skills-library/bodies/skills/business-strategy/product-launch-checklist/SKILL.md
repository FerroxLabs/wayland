---
name: product-launch-checklist
description: |
  Creates a pre-launch checklist covering engineering readiness, marketing preparation, customer support, legal review, and communications for product or feature launches. Use when the user asks about product launch checklists, go-live preparation, launch readiness, pre-launch planning, or feature release preparation.
  Do NOT use for go-to-market strategy (use go-to-market-strategy), product roadmaps (use product-roadmap), or PR pitches (use pr-pitch).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "checklist planning project-management template strategy"
  category: "business-strategy"
  subcategory: "product-management"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Product Launch Checklist

## When to Use

**Use this skill when:**
- A user is preparing to launch a new product, major feature, or significant update and needs a structured pre-launch checklist covering all cross-functional workstreams
- A user asks for a "go-live checklist," "launch readiness review," "release preparation document," or "pre-launch audit" for a product or feature
- A user needs to coordinate engineering, marketing, customer support, legal, and communications teams ahead of a specific launch date
- A user wants to build a go/no-go decision framework with specific criteria and decision-makers before a release
- A user is running a phased rollout, beta release, or feature flag deployment and needs a structured checklist to manage it
- A user has a fixed launch date (tied to a conference, seasonal event, or contractual deadline) and needs to work backward to ensure all dependencies are resolved
- A user is launching into a regulated industry (healthcare, fintech, edtech) and needs to ensure compliance checkpoints are embedded in the pre-launch process

**Do NOT use this skill when:**
- The user needs a full go-to-market strategy with segmentation, positioning, pricing, and channel strategy -- use `go-to-market-strategy`
- The user wants a product roadmap showing what will be built and when -- use `product-roadmap`
- The user needs a PR pitch, press release, or journalist outreach strategy -- use `pr-pitch`
- The user wants a feature specification or product requirements document -- use `feature-spec`
- The user needs a post-launch retrospective or incident post-mortem -- use `incident-postmortem` or `retrospective`
- The user is asking about agile sprint planning or release management within a development cycle -- use a sprint planning skill
- The user wants competitive positioning or launch messaging strategy -- the checklist assumes messaging is already decided; use `go-to-market-strategy` first

---

## Process

### Step 1: Gather Launch Context Before Building the Checklist

Do not generate a generic checklist before understanding the launch. Ask the user for the following inputs, and use their answers to customize every section:

- **What is being launched:** New standalone product, major feature (changes core user flows), minor feature (additive, low-risk), API or integration, mobile app update, infrastructure change, or pricing/packaging change
- **Launch date and flexibility:** Fixed (conference keynote, contractual deadline, seasonal) or flexible (internal target with wiggle room)
- **Target audience:** All existing users, a specific segment (enterprise accounts, free tier, geographic market), a beta group, or net-new prospects only
- **Rollout strategy:** Big-bang (all users simultaneously), phased by percentage (10% / 25% / 50% / 100%), feature-flagged by segment, or canary (small percentage of production traffic)
- **Scale:** Daily active users, expected traffic increase, geographic distribution, third-party dependencies that could be stressed
- **Cross-functional teams involved:** At minimum, ask which of these are in scope: Engineering, QA, Design, Product, Marketing, Sales, Customer Success, Support, Legal/Compliance, Finance, Security, DevOps
- **Known risks:** Anything already flagged as a concern -- performance unknowns, unresolved bugs, compliance questions, marketing dependencies on external vendors

Use these answers to mark sections as Required, Optional, or Not Applicable in the final checklist. A minor feature update for internal users does not need a PR section. A launch involving PII data collection requires the full legal and security section.

---

### Step 2: Build the Engineering Readiness Checklist

Engineering readiness is the gating dependency for everything else. Build this section with the following specifics:

- **Code completeness and review:**
  - All planned features merged and code-reviewed by at least one senior engineer
  - No open pull requests that are required for the launch scope
  - Feature branch merged to main/release branch; no pending cherry-picks
  - Deployment artifacts built, versioned, and stored in the artifact registry (not built at deploy time)

- **Test coverage:**
  - Unit tests passing with coverage at or above the team's agreed threshold (typically 70-80% for new code)
  - Integration tests covering all new API endpoints and service-to-service calls
  - End-to-end tests passing in staging environment (not just local)
  - Regression suite passing -- confirm no existing functionality is broken
  - If the feature involves real-time or WebSocket behavior: concurrent connection tests completed
  - If the feature involves file uploads, data imports, or batch processing: volume tests with representative data size

- **Performance and load testing:**
  - Load test results documented: transactions per second, P50 / P95 / P99 latency, error rate at expected peak load
  - Expected peak load defined in concrete terms (e.g., 2x current DAU, spike to 500 concurrent users within first 30 minutes of launch)
  - Database query performance reviewed: no queries with full table scans at projected data volume, index plan verified
  - Third-party API rate limits reviewed: confirm the launch will not hit rate limits on payment processors, email providers, notification services, or other external dependencies

- **Security review:**
  - OWASP Top 10 review completed for any new user-facing input fields, file uploads, or authentication flows
  - New data collection reviewed: confirm what PII is stored, where, and for how long
  - Authentication and authorization tested: confirm new features respect existing access control rules
  - Dependency audit run: no known critical or high CVEs in newly added packages (use a tool like Snyk, Dependabot, or similar)
  - Penetration test or security review required if the feature handles payments, health data, or sensitive documents

- **Infrastructure and deployment:**
  - Database migrations tested in staging with production-like data volume (not just an empty schema)
  - Migration runtime measured: if migration takes more than 60 seconds, plan for maintenance window or zero-downtime migration pattern
  - Environment variables and configuration changes documented and deployed to staging; not relying on manual steps at launch time
  - Feature flags created in the flag management system (LaunchDarkly, Flipt, Unleash, or equivalent), with initial states confirmed for each environment
  - CDN cache invalidation plan in place for any updated static assets, landing pages, or documentation

- **Observability:**
  - Application performance monitoring configured (error rate, latency, throughput) with dashboards bookmarked for launch day
  - Custom metrics added for the new feature's key behaviors (e.g., collaboration sessions started, mentions sent, files uploaded)
  - Alerting rules configured with specific thresholds -- not just "alert if things look weird"
  - Log aggregation confirmed: new service logs are flowing to the central log platform with structured fields, not raw strings
  - On-call rotation updated: the engineers who built the feature should be reachable and on primary or secondary on-call during the launch window

- **Rollback:**
  - Rollback procedure documented step-by-step, not just "turn off the feature flag"
  - If database migrations are involved: confirm whether the migration is reversible; if not, document data preservation strategy
  - Rollback tested in staging: confirm it actually works and does not leave the system in a broken state
  - Rollback decision authority defined: who can make the call to roll back, and what is their contact information

---

### Step 3: Build the Marketing and Communications Checklist

Marketing readiness depends entirely on the launch type. A major external launch needs all items. An internal beta needs almost none. Apply judgment based on Step 1 answers.

- **Messaging and positioning:**
  - Core value proposition statement finalized and approved by Product and Marketing leadership
  - Key messages defined: what the feature does, who it is for, what problem it solves, and one key differentiator
  - Elevator pitch (2-3 sentences) agreed upon -- this becomes the source of truth for all written copy
  - Screenshots, product demo video, or interactive walkthrough created and approved

- **Owned channel content:**
  - Blog post or changelog entry written, reviewed, and scheduled (for major features: full blog post; for minor features: changelog entry is sufficient)
  - Email to existing users drafted, segmented appropriately (do not email users who cannot access the feature yet), reviewed for deliverability (subject line, preview text, plain-text version)
  - In-app announcement or tooltip flow configured and QA'd -- the in-product experience is often the highest-reach channel
  - Website product page or feature page updated to reflect the new capability
  - Help center articles written and indexed (not drafted -- fully published and searchable before launch)

- **Paid and social channels:**
  - Social media posts written for each active platform (do not copy-paste -- adapt for platform tone and format)
  - Paid campaigns paused or updated to reflect the new capability if relevant
  - Social media monitoring set up to catch user reactions, complaints, or questions on the day of launch

- **Sales and partner enablement:**
  - Sales team briefed with talk track, FAQ, and objection handling (minimum 48 hours before launch, not on launch day)
  - Competitive positioning memo updated if the new feature changes the competitive landscape
  - Partner or integration marketplace listings updated if applicable

- **Internal communications:**
  - Company-wide announcement prepared (Slack, email, or all-hands -- match the launch scale to the communication scope)
  - Customer Success team briefed separately from Support: they need to know how to proactively discuss the feature with key accounts
  - Executive team briefed with launch metrics they will be watching

---

### Step 4: Build the Customer Support Checklist

Support is the most common under-resourced workstream in a launch. Deficiencies here directly cause public negative reviews, social media complaints, and churn.

- **Training:**
  - Support team training completed at least 48 hours before launch (not the morning of)
  - Training must include: what the feature does, how to demo it, known issues and workarounds, and what to do when they do not know the answer
  - Recorded training session available for asynchronous viewing by distributed team members in other time zones
  - QA completed: at least 2-3 support agents have personally used the feature in staging, not just watched a demo

- **Documentation:**
  - FAQ document created with the top 10-15 questions predicted from the feature (derived from beta feedback, similar past launches, or support pattern analysis)
  - Troubleshooting guide created for the top 3-5 error states users will encounter
  - Response templates created for expected contact types (e.g., "I cannot find the new feature," "The real-time editing is not working for me")
  - Known issues register published internally, updated in real time during launch, with workaround for each item

- **Escalation and staffing:**
  - L1 / L2 / L3 escalation path defined for launch-specific issues (L1: support agent; L2: senior support or CS; L3: engineering on-call)
  - Engineering escalation contact (specific person, not just "the engineering team") designated for launch day
  - Staffing plan for launch window: if you have 8,000 DAU and typically receive 0.5% daily support contacts, plan for 2-3x that volume in the first 24 hours
  - Support queue monitoring assigned: a specific person watches the queue volume and type of contacts during launch, not just a passive wait

- **Feedback collection:**
  - In-app feedback mechanism configured (NPS survey, thumbs up/down, or "Was this helpful?" prompt) with appropriate timing delay (do not prompt after 5 seconds of use -- wait for a meaningful interaction)
  - Support tagging convention defined: new contacts related to the launch should be tagged with a specific label so volume can be tracked
  - First-week feedback review scheduled: who reads the feedback, when, and how it feeds back to the product team

---

### Step 5: Build the Legal and Compliance Checklist

Legal review timelines are often the longest lead-time item in a launch. Identify legal dependencies in Step 1 and initiate legal review at least 2-3 weeks before the launch date.

- **Terms of service and privacy policy:**
  - Confirm whether the launch adds new data collection, changes data retention, or introduces new user permissions -- if any are true, legal review is required
  - Terms of service update required if: new features create new user obligations, introduce new payment terms, change liability exposure, or affect enterprise customer contracts
  - Privacy policy update required if: new PII is collected, new third-party processors are added, or data sharing scope changes
  - Cookie consent or consent management platform (CMP) updated if new tracking pixels, analytics tools, or advertising tags are added

- **Regulatory compliance:**
  - GDPR: confirm data residency requirements are met for EU users, data processing agreements are in place for new processors, and right-to-deletion applies to new data
  - CCPA: confirm opt-out mechanisms work for new data collection
  - HIPAA: required if any health-related data is collected or processed -- this requires BAAs with new vendors and security review sign-off
  - SOC 2 / ISO 27001: if the feature is in scope for an existing audit, confirm security controls are documented and the compliance team is notified
  - Industry-specific: fintech features may require FINRA, PCI-DSS, or state money transmission review; edtech features involving children require COPPA review

- **Accessibility:**
  - WCAG 2.1 AA conformance verified for new UI components (automated scan plus manual keyboard navigation and screen reader testing)
  - Color contrast ratios verified for new UI elements (minimum 4.5:1 for normal text, 3:1 for large text)
  - If the product is sold to enterprise or government customers: accessibility statement may need updating

- **Contractual obligations:**
  - Review enterprise customer contracts for any "feature parity" commitments, SLA changes, or advance notification requirements
  - Confirm whether any customer has been promised this feature by a specific date -- if so, verify they are in the first rollout cohort
  - Review partnership agreements for any feature launch notification requirements

---

### Step 6: Build the Go/No-Go Decision Framework

The go/no-go meeting is not a status update -- it is a decision gate. Structure it properly.

- **Decision criteria:** Define which items are hard blockers (launch cannot proceed) versus soft blockers (launch proceeds with a documented risk and mitigation plan)
  - Typical hard blockers: unsolved critical security vulnerability, rollback procedure not documented, support team not trained, critical regulatory item unresolved
  - Typical soft blockers: non-critical bugs with workarounds, some marketing assets not ready, minor performance issues within acceptable thresholds

- **Decision meeting logistics:**
  - Schedule 24-48 hours before launch time -- this gives time to execute a contingency plan if the decision is "no-go"
  - Attendees: PM (facilitator), Engineering Lead, Head of Support, Marketing Lead, and legal representative if compliance items are in scope
  - Duration: 30 minutes maximum -- this is a decision meeting, not a working session
  - Pre-read: send the completed checklist with current status for each item at least 2 hours before the meeting

- **Decision outcomes:**
  - **Go:** All hard blockers resolved, soft blockers documented with owners and timelines
  - **Conditional go:** Launch proceeds with specific conditions (e.g., launch only to internal users first, reduce initial rollout to 5%)
  - **No-go with date:** Launch delayed to a specific new date (not "TBD") with the specific items that must be resolved
  - **Scope reduction:** Launch on the planned date with reduced scope (remove the riskiest sub-feature, launch to a smaller segment)

- **Contingency communication:**
  - If the decision is no-go: who communicates the delay, to whom, and when (within 1 hour of decision, not next-day)
  - For external launches with scheduled communications: have a "launch postponed" holding statement ready to publish

---

### Step 7: Create the Launch Day Run Sheet

The run sheet converts the checklist into a time-ordered sequence of actions with named owners.

- **Pre-launch window (T-24 hours to T-2 hours):**
  - Final staging verification: engineering team confirms staging environment is in the expected state
  - Go/no-go meeting (if scheduled here, see Step 6)
  - Communications assets final review: blog post, email, social posts all queued and reviewed one final time
  - On-call engineers confirmed available and briefed on their specific watch areas
  - Monitoring dashboards and alert channels confirmed functional (not just set up -- actively verified)

- **Launch window (T-2 hours to T+2 hours):**
  - Internal notification to stakeholders that launch is beginning
  - Deployment or feature flag activation executed by the named engineer, not a general instruction to "the engineering team"
  - Initial smoke test by PM or QA within 5-10 minutes of deployment: manually verify the feature works as expected for a real user
  - First metrics check at T+15 minutes: error rate, latency, feature adoption signal (first 15 minutes of data should look normal or positive)
  - External communications sent at T+30 minutes (not before the smoke test passes)
  - First internal update sent to stakeholders at T+1 hour with brief status ("launch proceeding normally, X users have accessed the feature, no critical issues")

- **Post-launch monitoring (T+2 hours to T+24 hours):**
  - Metrics review at T+4 hours: error rate trend, P95 latency, feature adoption curve (is it matching projections?)
  - Support queue review at T+4 hours: volume and type of contacts; escalate any unexpected patterns
  - Social media sentiment check at T+4 hours
  - T+24 hour metrics snapshot: DAU impact, feature activation rate, error rate, support contact volume -- document these as the baseline for post-launch review

- **Rollback triggers (must be specific numbers, not qualitative descriptions):**
  - Error rate exceeds 2% of requests (baseline: document the pre-launch error rate so you have a real comparison)
  - P95 latency exceeds the pre-launch baseline by more than 50% sustained for 10+ minutes
  - A P0 bug is confirmed by engineering (data loss, security vulnerability, authentication bypass)
  - Support contact volume exceeds 5x the normal daily rate within the first 4 hours
  - Payment or billing-related errors exceed 0% (any payment error is a P0)

---

## Output Format

```
## Launch Checklist: [Product/Feature Name]
**Version:** [1.0] | **Created:** [Date] | **Owner:** [PM Name]

---

### Launch Overview

| Field | Detail |
|---|---|
| **Launch name** | [Descriptive name, not just a ticket number] |
| **Launch date and time** | [Date, time, timezone] |
| **Launch type** | [New product / Major feature / Minor feature / Beta / Internal] |
| **Target audience** | [All users / Segment description / Beta group / Internal only] |
| **Rollout strategy** | [Big-bang / Phased: 10%→25%→50%→100% / Feature-flag by segment / Canary] |
| **Go/no-go decision** | [Date, time, timezone -- Decision maker: Name] |
| **Post-launch review** | [Date, time -- Owner: Name] |
| **Estimated reach on day 1** | [Number of users or percentage of DAU] |

---

### Engineering Readiness

#### Code and Testing
- [ ] All features merged to release branch; no pending required PRs
- [ ] Unit tests passing (coverage: [X]% -- threshold: [Y]%)
- [ ] Integration tests passing in staging
- [ ] End-to-end tests passing in staging
- [ ] Regression suite passing -- no existing features broken
- [ ] [Feature-specific test]: [description and result]

#### Performance
- [ ] Load test completed at [X] concurrent users (representing [Y]% peak load)
  - P50 latency: [X]ms (target: <[Y]ms)
  - P95 latency: [X]ms (target: <[Y]ms)
  - P99 latency: [X]ms (target: <[Y]ms)
  - Error rate: [X]% (target: <[Y]%)
- [ ] Database query plan reviewed; no full table scans at projected volume
- [ ] Third-party API rate limits reviewed: [service name, limit, expected usage]

#### Security
- [ ] OWASP review completed for new input surfaces
- [ ] New data collection reviewed and documented: [what PII, where stored, retention period]
- [ ] Authorization rules tested: new feature respects existing access controls
- [ ] Dependency audit: no critical/high CVEs in new packages

#### Infrastructure and Deployment
- [ ] Database migration tested in staging with production-like data volume
  - Migration runtime: [X] seconds (reversible: Yes / No)
- [ ] Environment variables deployed to production (not manual steps at launch time)
- [ ] Feature flags configured:
  - Flag name: [flag_name] | Initial state: [OFF / ON for X% / ON for group Y]
- [ ] CDN cache invalidation plan: [assets affected, invalidation trigger]
- [ ] Artifact built and stored in registry (not built at deploy time): [version tag]

#### Observability
- [ ] Monitoring dashboard live: [link]
  - Watches: error rate, latency P50/P95/P99, throughput, [feature-specific metric]
- [ ] Custom metrics configured: [list feature-specific metrics]
- [ ] Alert rules configured:
  - Alert: error rate > [X]% → [channel and on-call]
  - Alert: P95 latency > [X]ms sustained [Y] min → [channel and on-call]
- [ ] Structured logs flowing to log aggregation platform
- [ ] On-call roster updated: Primary: [Name], Secondary: [Name], Escalation: [Name]

#### Rollback
- [ ] Rollback procedure documented: [link]
- [ ] Rollback tested in staging: confirmed working on [date]
- [ ] Rollback decision authority: [Name and contact]
- [ ] Data rollback strategy (if migration not reversible): [describe]

**Engineering readiness sign-off:** [Engineering Lead] -- [Date]

---

### Marketing and Communications

#### Messaging
- [ ] Core value proposition statement approved by: [Name, Date]
- [ ] Elevator pitch (2-3 sentences) finalized
- [ ] Product screenshots / demo video created and approved

#### Content Assets
- [ ] Blog post / changelog: [Status] | Publish date: [Date] | Author: [Name]
- [ ] User email: [Status] | Send date: [Date] | Segment: [Description] | List size: [N]
- [ ] In-app announcement / tooltip: [Status] | Trigger condition: [Description]
- [ ] Website product page update: [Status] | URL: [URL]
- [ ] Help center articles: [X] articles published | Links: [list]

#### Social and Paid
- [ ] Social posts prepared: [Platforms] | Scheduled for: [Date/Time]
- [ ] Social monitoring configured for launch day: [Tool / Keyword list]
- [ ] Paid campaigns updated / paused as needed: [Status]

#### Enablement
- [ ] Sales team briefed: [Date] | Talk track link: [link] | Objection handler: [link]
- [ ] Customer Success team briefed: [Date] | Account priority list for proactive outreach: [link]
- [ ] Partner / integration marketplace listings updated: [Status or N/A]

#### Internal
- [ ] Company-wide announcement: [Channel] | [Date/Time]
- [ ] Executive briefing sent: [Date] | Key metrics they are watching: [list]

**Marketing readiness sign-off:** [Marketing Lead] -- [Date]

---

### Customer Support Readiness

- [ ] Support team training completed: [Date] (≥48 hours before launch)
  - Training format: [Live session / Recording / Both]
  - Attendance confirmed: [X of Y agents trained]
- [ ] Agents have personally used the feature in staging: [Confirmed by: Name, Date]
- [ ] FAQ document published: [Link] | [X] questions covered
- [ ] Troubleshooting guide published: [Link] | Top errors covered: [list]
- [ ] Response templates created for:
  - [ ] "I cannot find the new feature"
  - [ ] "The feature is not working for me"
  - [ ] [Feature-specific expected question 1]
  - [ ] [Feature-specific expected question 2]
- [ ] Known issues register created: [Link] | Updated in real time by: [Name]
- [ ] Escalation path defined:
  - L1 → L2: [condition and contact]
  - L2 → Engineering on-call: [condition and contact: Name, channel]
- [ ] Launch window staffing plan: [number of agents], [hours of coverage], [queue owner]
- [ ] Support tagging convention: [tag name for launch-related contacts]
- [ ] Feedback collection configured: [mechanism, trigger timing, review owner]

**Support readiness sign-off:** [Support Lead] -- [Date]

---

### Legal and Compliance

| Item | Status | Required | Owner | Completed Date |
|---|---|---|---|---|
| Terms of service review | [ ] | [Yes / No / N/A] | [Name] | |
| Privacy policy review | [ ] | [Yes / No / N/A] | [Name] | |
| Cookie consent / CMP update | [ ] | [Yes / No / N/A] | [Name] | |
| GDPR compliance review | [ ] | [Yes / No / N/A] | [Name] | |
| CCPA compliance review | [ ] | [Yes / No / N/A] | [Name] | |
| [Regulation specific to industry] | [ ] | [Yes / No / N/A] | [Name] | |
| WCAG 2.1 AA accessibility audit | [ ] | [Yes / No / N/A] | [Name] | |
| Enterprise contract review | [ ] | [Yes / No / N/A] | [Name] | |
| Security review sign-off | [ ] | [Yes / No / N/A] | [Name] | |

**Legal readiness sign-off:** [Legal / Compliance Lead] -- [Date]

---

### Go/No-Go Decision

**Meeting:** [Date] at [Time] [Timezone]
**Facilitator:** [PM Name]
**Attendees:** [List]
**Pre-read sent by:** [Date/Time, at least 2 hours before]

#### Hard Blockers (Launch cannot proceed if any are unresolved)

| Criterion | Status | Owner |
|---|---|---|
| No unresolved critical or high security vulnerabilities | [ ] | Engineering Lead |
| Rollback procedure documented and tested | [ ] | Engineering Lead |
| Support team trained (≥48 hours prior) | [ ] | Support Lead |
| All required legal/compliance items resolved | [ ] | Legal Lead |
| Load test passed at projected peak load | [ ] | Engineering Lead |
| [Feature-specific hard blocker] | [ ] | [Owner] |

#### Soft Blockers (Documented risk; launch may proceed with mitigation)

| Criterion | Status | Mitigation Plan | Owner |
|---|---|---|---|
| All marketing assets complete | [ ] | [Mitigation if incomplete] | Marketing Lead |
| No P2 or lower open bugs | [ ] | [Workaround documented] | Engineering Lead |
| [Other soft blocker] | [ ] | | |

**Decision:** [ ] Go | [ ] Conditional Go -- Condition: [describe] | [ ] No-Go -- Reschedule to: [Date]
**Decision maker:** [Name]
**If no-go, notify:** [Names and channels, within 1 hour of decision]

---

### Launch Day Run Sheet

| Time | Action | Owner | Dependencies | Status |
|---|---|---|---|---|
| T-24h | Final staging verification and smoke test | Engineering | Staging env stable | [ ] |
| T-24h | Communications assets final review | Marketing | All assets queued | [ ] |
| T-24h | Go/no-go meeting (if not held earlier) | PM | Checklist complete | [ ] |
| T-2h | On-call engineers confirmed available | PM | On-call roster | [ ] |
| T-2h | Monitoring dashboards verified active | Engineering | Alerts configured | [ ] |
| T-1h | Internal notification: launch beginning | PM | Go decision confirmed | [ ] |
| T-0 | Deploy / activate feature flag | [Engineer Name] | All pre-checks done | [ ] |
| T+10m | Manual smoke test (PM or QA) | [Name] | Deployment complete | [ ] |
| T+15m | First metrics check: error rate, latency | [Engineer Name] | Monitoring live | [ ] |
| T+30m | External communications sent | Marketing | Smoke test passed | [ ] |
| T+1h | Internal launch status update to stakeholders | PM | First metrics reviewed | [ ] |
| T+4h | Metrics + support queue review | PM + Engineering + Support | | [ ] |
| T+4h | Social sentiment check | Marketing | | [ ] |
| T+24h | Metrics snapshot documented | PM | | [ ] |
| T+48h | Post-launch review meeting | All teams | Metrics snapshot ready | [ ] |

---

### Rollback Triggers

| Trigger Condition | Threshold | Action | Decision Authority |
|---|---|---|---|
| Error rate elevated | >[X]% sustained for >5 min (baseline: [Y]%) | Disable feature flag; investigate | Engineering Lead |
| P95 latency elevated | >[X]ms sustained for >10 min (baseline: [Y]ms) | Investigate; disable flag if not resolved in 15 min | Engineering Lead |
| P0 bug confirmed | Any data loss, auth bypass, or payment error | Immediate rollback; PM and Exec notified | Engineering Lead (no need to wait for PM) |
| Support contact spike | >5x normal daily rate within first 4 hours | Assess pattern; escalate to PM for rollback decision | PM |
| [Feature-specific trigger] | [Threshold] | [Action] | [Name] |

**Rollback notification chain:** Engineering Lead → PM → [VP/Head of Product] → Support Lead → Marketing Lead (in that order)

---

### Post-Launch Success Metrics

| Metric | Baseline | Day 1 Target | Day 7 Target | Owner |
|---|---|---|---|---|
| Feature activation rate | N/A | [X]% of reached users | [Y]% of reached users | PM |
| Error rate | [pre-launch %] | <[X]% | <[X]% | Engineering |
| P95 latency | [pre-launch ms] | <[X]ms | <[X]ms | Engineering |
| Support contact volume | [daily baseline] | <[X]x baseline | Back to baseline | Support |
| [Feature-specific metric] | [baseline] | [target] | [target] | [owner] |
```

---

## Rules

1. **Never build the checklist before gathering launch context.** A generic checklist is worse than no checklist because it creates false confidence. A privacy policy update is irrelevant for an internal tool. A load test threshold is meaningless without knowing current DAU. Always run Step 1 first.

2. **Every rollback trigger must be a specific, measurable number.** "If things look bad" is not a trigger. "If error rate exceeds 2% of requests sustained for more than 5 minutes, and the pre-launch baseline is 0.3%" is a trigger. The comparison to baseline is required -- a 2% error rate is critical for one product and normal for another.

3. **The go/no-go meeting must happen 24-48 hours before launch, not on launch day.** Scheduling it on launch morning eliminates the ability to execute a contingency plan. If the decision is "no-go" at T-1 hour, it is too late to halt scheduled email sends, coordinated announcements, or social posts.

4. **Support team training must complete at least 48 hours before launch.** Training the support team the morning of launch means they will be handling real user issues before they have processed the information. The 48-hour buffer is not a suggestion -- it is the minimum time required for agents to absorb training, ask clarifying questions, and practice responses.

5. **External communications may not be sent until the smoke test passes.** Sending an email to 50,000 users announcing a feature that is broken in production is a worse outcome than a 30-minute delay. The run sheet must always sequence smoke test before external communications.

6. **Legal review has the longest lead time and must be initiated first.** Legal review for a new data collection feature typically takes 1-3 weeks. Initiating legal review in the final week before launch is not legal review -- it is a checkbox. Identify legal dependencies in Step 1 and flag them immediately so review can start with adequate lead time.

7. **Database migrations that are not reversible require a data preservation strategy documented before the go/no-go meeting.** A non-reversible migration means that rolling back the code does not return the system to its prior state. This is not a reason to block a launch, but it must be explicitly acknowledged and documented -- not discovered during a production rollback attempt.

8. **Known bugs must be documented with severity, workaround status, and customer impact -- not hidden or minimized.** The go/no-go decision requires complete information. A known P2 bug with no workaround affects enterprise customers differently than a P3 cosmetic issue. The people making the go/no-go decision must see the real list.

9. **Post-launch review must be calendared before the launch occurs.** A post-launch review scheduled after the launch is frequently cancelled or forgotten. It should appear on everyone's calendar as part of the launch checklist, scheduled for T+48 hours, before the launch date arrives.

10. **Phased rollout is the default strategy for any launch that affects more than 1,000 users.** Big-bang launches forfeit the ability to limit blast radius on unexpected issues. The cost of a phased rollout (slightly delayed full availability) is almost always lower than the cost of a full-scale incident caused by an issue that would have appeared in a 5% cohort. The burden of proof is on the case for big-bang, not on the case for phased rollout.

11. **Never mark legal items as N/A without a documented reason.** "Not applicable" must be accompanied by the specific rationale (e.g., "No new PII is collected -- confirmed by engineering review on [date]"). An unchecked N/A is an assumption; a documented N/A is a decision.

12. **Internal communication must include updates during the rollout, not just a single "we launched" announcement.** Stakeholders watching metrics, preparing for sales calls, or managing customer accounts need to know the launch is proceeding normally. The run sheet must include at minimum a T+1 hour internal status update.

---

## Edge Cases

### Soft Launch or Limited Beta Release

Reduce the marketing section significantly -- no public blog post, no email to all users, no social media posts. Replace the marketing section with a beta-specific section: direct outreach to beta participants, a clear communication of what is and is not yet finished, and an explicit set of feedback channels (user interviews, in-app survey, dedicated Slack channel, or direct email). The engineering and support sections remain fully intact. The go/no-go section still applies. Beta releases often skip the go/no-go meeting; do not allow this -- a beta to 200 users still needs a rollback procedure and support escalation path.

### Emergency Hotfix or Critical Security Patch

Compress the checklist to a minimal emergency version. Required items: engineering verification that the fix addresses the root cause (not just the symptom), staging test passing, rollback procedure documented, monitoring confirmed active, and the on-call engineer confirmed available. Skip all marketing items -- no user-facing announcement is needed for a security patch in most cases, though some regulatory regimes (GDPR breach notification) require customer communication within 72 hours if the vulnerability exposed user data. Support should be notified via a brief 5-minute briefing or written alert, but a full training session is not required. The standard 48-hour support training rule does not apply. Legal should be looped in immediately if the fix involves a potential data exposure.

### International or Multi-Region Launch

Create a region-specific extension of the run sheet. Each region has its own: T-0 time in local timezone, external communications schedule (send the email at 9am local time, not 2am), and support coverage confirmation. Regulatory compliance items multiply by region -- GDPR applies to EU, PIPL applies to mainland China, LGPD applies to Brazil; confirm each is in scope and has been reviewed. Consider a "follow the sun" rollout pattern: launch in APAC first during their business day, let it stabilize for 8 hours, then launch in EMEA, then Americas. This pattern gives each region a fresh on-call rotation and limits simultaneous blast radius. Localized content (translated blog posts, localized help articles, in-product copy) must be reviewed by a native speaker, not just machine-translated.

### Platform Launch (iOS, Android, and Web Simultaneously)

Mobile app store review timelines make simultaneous launches difficult. Apple App Store review typically takes 1-3 days but can take up to 7 days for new apps or features that require additional review (health data, payments, age ratings). Google Play review is typically 1-2 days. Build the mobile app store submission lead time into the launch plan, targeting app store submission 7-10 days before the planned launch date. If app store approval is delayed, the web launch can proceed on schedule but external communications must explicitly set expectations ("available on web now; iOS and Android coming within X days"). Never submit app store binaries on the day you need them approved. Feature flags allow the mobile experience to be gated even after the app is approved, enabling true simultaneous activation across platforms.

### Re-Launch of a Previously Failed Feature

Add a dedicated section to the checklist: "Previous Launch Failure Review." This section must document: what the root cause of the previous failure was (not just symptoms), what specifically has changed to address each root cause, and what additional monitoring or safeguards have been added. The engineering team should write a brief incident summary of the previous failure and share it with all go/no-go decision-makers before the meeting. Rollback triggers should be set more conservatively than standard -- consider a 1% error rate threshold instead of 2%, and a shorter sustained-duration requirement (3 minutes instead of 5). The support team briefing must address the history: agents will encounter users who are skeptical or frustrated from the previous failure and need explicit guidance on how to respond ("We identified and fixed the issue that caused [X]; here is what changed").

### Launch with Hard External Deadline (Conference, Press Embargo, Contractual)

A fixed external deadline fundamentally changes the risk calculus. Scope reduction becomes the primary risk mitigation tool when the date cannot move. Build the checklist with explicit scope tiers: Tier 1 (must ship on this date), Tier 2 (ship if ready), and Tier 3 (defer to next release). The go/no-go meeting must have a scope reduction decision ready -- not just "go or no-go" but "go with Tier 1 only, defer Tier 2, or full go." Legal and compliance items with external deadlines (press embargoes break if you are late; contractual penalties may apply) must be escalated to executive sponsors immediately if they are at risk. Never let a hard external deadline eliminate the rollback plan -- the feature can have an emergency disable mechanism even if the code is "live" for a keynote demo.

### Launch Involving a Pricing or Packaging Change

Pricing changes require additional workstreams that a standard feature launch does not. Finance must review all pricing copy for accuracy before publication. Billing system changes must be tested end-to-end in staging, including upgrade flows, downgrade flows, proration calculations, and invoice generation. Customer Success must proactively communicate changes to existing paid customers before the public announcement -- surprising a paying customer with a price change via a general blog post is a significant churn risk. Legal must review pricing page copy for compliance with automatic renewal laws, refund policy obligations, and geographic pricing regulations. The go/no-go criteria must include billing system testing completion as a hard blocker.

---

## Example

**Input:** "We're launching a new team collaboration feature in our project management SaaS tool next Tuesday. It includes real-time document editing, @mentions with notifications, and a comment threading system. We have about 12,000 daily active users across free and paid tiers. We want to phase the rollout and we're planning to blog about it."

**Output:**

## Launch Checklist: Team Collaboration (Real-Time Editing, Mentions, and Commenting)
**Version:** 1.0 | **Created:** [Current Date] | **Owner:** PM

---

### Launch Overview

| Field | Detail |
|---|---|
| **Launch name** | Team Collaboration -- Real-Time Editing, @Mentions, and Comment Threading |
| **Launch date and time** | Tuesday at 10:00 AM PT |
| **Launch type** | Major feature |
| **Target audience** | All existing users (free and paid tiers) |
| **Rollout strategy** | Phased via feature flag: 5% day 1 (Monday), 25% day 2 (Tuesday at launch), 100% by Thursday if no issues |
| **Go/no-go decision** | Monday at 2:00 PM PT -- Decision maker: VP of Product, with PM, Engineering Lead, Support Lead |
| **Post-launch review** | Thursday at 2:00 PM PT -- Owner: PM |
| **Estimated reach on day 1** | ~600 users (5% of 12,000 DAU) |

---

### Engineering Readiness

#### Code and Testing
- [ ] All three sub-features merged to release branch (real-time editing, mentions, comment threading)
- [ ] No open required PRs -- confirmed by Engineering Lead
- [ ] Unit tests passing (coverage: target 75% for new code)
- [ ] Integration tests covering: WebSocket session management, mention notification delivery via email and in-app, comment CRUD operations and threading logic
- [ ] End-to-end tests passing in staging: full flow from document open → concurrent edit → @mention → notification received → comment reply
- [ ] Regression suite passing -- confirm document saving (existing feature) not broken by real-time edit layer

#### Performance
- [ ] Load test completed at 600 concurrent WebSocket connections (representing 5% of DAU, day 1 target)
  - P50 latency (edit propagation): target <200ms
  - P95 latency (edit propagation): target <500ms
  - WebSocket connection success rate: target >99.5%
  - Error rate: target <0.5%
- [ ] Load test at 3,000 concurrent WebSockets completed for 100% rollout validation (target same thresholds)
- [ ] Mention notification delivery tested at 500 mentions/minute (estimated peak for 12,000 DAU): confirm no queue backlog
- [ ] Database query plan reviewed for comment threading queries -- threaded queries using recursive CTEs verified with EXPLAIN ANALYZE at 10,000 comments per document
- [ ] Email notification provider rate limits reviewed -- confirm current daily send volume + launch spike stays within limit

#### Security
- [ ] XSS review completed for comment input field and @mention autocomplete (both accept free-text user input)
- [ ] Real-time edit payloads validated server-side -- confirm clients cannot inject arbitrary document content bypassing validation
- [ ] Authorization confirmed: users can only edit documents in projects they have access to; mentions only resolve for users within the same workspace
- [ ] Notification unsubscribe mechanism implemented and tested -- users can opt out of mention notifications
- [ ] No new PII collected beyond what is already stored -- confirmed by Engineering Lead on [date]

#### Infrastructure and Deployment
- [ ] Database migration (adds `comments` table and `mentions` table): tested in staging with 500,000 existing document rows
  - Migration runtime: measured at 8 seconds -- non-blocking, zero downtime
  - Migration is reversible: Yes (DROP TABLE if rolled back within 72 hours while no user data written; after that, data preservation required)
- [ ] WebSocket server scaled: confirm autoscaling policy handles 3,000 concurrent connections before hitting max instance count
- [ ] Feature flags configured in flag management system:
  - `team_collab_realtime_editing` -- initial state: OFF for all users
  - `team_collab_mentions` -- initial state: OFF for all users
  - `team_collab_comments` -- initial state: OFF for all users
  - Day 1 plan: enable all three flags for 5% of user IDs (consistent hash, not random per-session)
- [ ] CDN cache invalidation: product page and help center articles will update on publish; no manual invalidation required
- [ ] Build artifact version tagged: v2.14.0 -- stored in artifact registry

#### Observability
- [ ] Monitoring dashboard live: "Team Collab Launch -- Nov 2024" bookmarked for launch team
  - Panels: WebSocket connection count, edit event throughput, mention notification delivery rate, comment creation rate, error rate by endpoint, P50/P95/P99 latency per endpoint
- [ ] Custom metrics configured:
  - `collab.websocket.connections.active` (gauge)
  - `collab.edit.events.per_second` (counter)
  - `collab.mention.notification.delivery_time_ms` (histogram)
  - `collab.comment.creation.count` (counter)
- [ ] Alert rules configured:
  - WebSocket error rate > 2% sustained 5 min → PagerDuty: Engineering on-call
  - Edit event P95 latency > 800ms sustained 10 min → PagerDuty: Engineering on-call
  - Mention notification delivery time P95 > 30 seconds → Slack #launch-alerts: Engineering on-call
- [ ] On-call roster: Primary: [Backend Engineer who built WebSocket layer], Secondary: [Staff Engineer], Escalation: [VP Engineering]

#### Rollback
- [ ] Rollback procedure documented: [Link to runbook]
  - Step 1: Set all three feature flags to 0% in flag management system (takes effect within 30 seconds)
  - Step 2: Verify WebSocket connections drop to zero on monitoring dashboard
  - Step 3: Confirm users on affected documents see the save-and-refresh fallback working
  - Step 4: Notify PM and Support Lead via Slack #launch-incidents within 5 minutes
- [ ] Rollback tested in staging: confirmed on [date] -- feature flags disabled successfully, no data loss, existing document save behavior restored
- [ ] Data consideration: comment and mention data written during the 5% cohort rollout will remain in the database after rollback; users will not see it until re-launch (acceptable, documented)
- [ ] Rollback decision authority: Engineering Lead can execute rollback without PM approval if a P0 trigger is hit

**Engineering readiness sign-off:** [Engineering Lead] -- [Date]

---

### Marketing and Communications

#### Messaging
- [ ] Core value proposition approved: "Real-time collaboration built into your project workflow -- edit documents together, mention teammates, and keep all feedback in context with threaded comments"
- [ ] Elevator pitch finalized: "Teams can now co-edit project documents in real time, @mention collaborators to loop them in instantly, and organize feedback with threaded comments -- all without leaving the project."
- [ ] Product screenshots created: real-time editing with two cursors visible, mention dropdown, comment thread -- approved by Design and Marketing

#### Content Assets
- [ ] Blog post: Status: In review | Publish time: Tuesday 10:30 AM PT (30 minutes after smoke test window) | Author: [Marketing Writer] | Reviewer: [PM + Head of Marketing]
- [ ] In-app announcement: A modal on first visit after flag enabled: "New: Collaborate in real time." with a 45-second walkthrough GIF -- configured in feature flag system tied to `team_collab_realtime_editing`; QA'd in staging
- [ ] Email to existing users: Segment: All users with at least one document created (9,200 of 12,000 DAU qualify) | Send time: Tuesday 11:00 AM PT (after blog post live) | Subject line: "Edit together, in real time -- now live" | List size: 9,200 | Status: Drafted, in legal review for no-reply compliance
- [ ] Website features page: Updated to include collaboration section | Status: Staged, pending publish on launch morning | URL: [product features URL]
- [ ] Help center articles: 4 articles published:
  - "Getting started with real-time editing"
  - "Using @mentions to notify teammates"
  - "How threaded comments work"
  - "Troubleshooting real-time collaboration"

#### Social and Paid
- [ ] Social posts prepared for LinkedIn and Twitter/X: short-form copy + product GIF | Scheduled for Tuesday 10:30 AM PT
- [ ] Social monitoring: Brand mentions + "real-time editing" + "[product name] mentions" keyword alerts configured in [monitoring tool] for launch week
- [ ] Paid campaigns: No paid campaigns planned for launch; existing campaigns do not need updating

#### Enablement
- [ ] Sales team briefed: Monday 11:00 AM PT | Talk track: "This closes the 'no real-time collaboration' objection we hear from teams comparing us to [competitor]" | Objection handler covers: "How does it work with offline users?" and "Is there a limit on concurrent editors?"
- [ ] Customer Success team briefed: Monday 10:00 AM PT | Priority account outreach list: 12 enterprise accounts who have requested this feature by name -- CS to email them directly on Tuesday morning before the public announcement
- [ ] Partner listings: N/A for this launch

#### Internal
- [ ] Company-wide Slack announcement: #general | Tuesday at 10:00 AM PT simultaneous with feature activation
- [ ] Executive briefing sent: Monday end of day | Key metrics: feature activation rate (target 15% of reached users on day 1), support contact volume, WebSocket error rate

**Marketing readiness sign-off:** [Marketing Lead] -- [Date]

---

### Customer Support Readiness

- [ ] Support team training completed: Friday (4 business days before launch, well above 48-hour minimum)
  - Format: 
