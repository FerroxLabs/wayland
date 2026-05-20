---
name: feature-spec
description: |
  Creates feature specification documents with requirements, design notes, edge cases, technical considerations, and launch criteria using standard feature spec format. Use when the user asks about feature specs, feature specifications, feature design documents, or detailed feature requirements.
  Do NOT use for high-level PRDs (use prd-writing), technical architecture specs (use technical-specification), or user stories only (use user-story-writing).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "planning template strategy agile project-management"
  category: "business-strategy"
  subcategory: "product-management"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Feature Spec

## When to Use

**Use this skill when:**
- User asks to write a feature spec, feature specification, feature design document (FDD), or feature brief for a discrete, shippable unit of product functionality
- User needs a document that bridges a PRD's "what and why" with engineering's "how" -- capturing functional requirements, UX flows, edge cases, and technical constraints in one place
- User wants to align cross-functional stakeholders (PM, design, engineering, QA, data) before development begins, reducing back-and-forth during implementation
- User needs to specify behavior for every system state -- including empty states, error states, loading states, permission boundaries, and concurrent access -- not just the happy path
- User is breaking down a large initiative into individual feature specs and needs each one to be self-contained enough for an independent engineering team to implement
- User needs to define measurable launch criteria -- not "done when it works" but specific, verifiable checklist items that gate deployment
- User needs to document rollback plans, feature flag strategies, or phased rollout parameters for a risky or high-traffic feature

**Do NOT use this skill when:**
- User needs a high-level product requirements document spanning multiple features or an entire product area -- use `prd-writing` instead
- User needs a technical architecture document covering system design, service topology, database schema, or infrastructure decisions -- use `technical-specification` instead
- User needs only user stories in the format "As a [role], I want [action], so that [outcome]" without full spec context -- use `user-story-writing` instead
- User wants a strategic product roadmap prioritizing features across quarters -- use `product-roadmap` instead
- User is asking about a project plan with milestones, owners, and dependencies -- use `project-planning` instead
- User needs a go-to-market plan or launch plan for a feature -- use `gtm-planning` instead
- User wants a simple one-pager or executive summary of a feature -- use `product-brief` instead

---

## Process

### Step 1: Establish Feature Context and Scope

Before writing a single requirement, gather the information that determines what this spec covers and why it exists.

- Ask for the feature name, a one-sentence problem statement, and the specific user segment experiencing that problem. Generic answers like "all users" are a red flag -- push for specifics (e.g., "admins managing a team of 10+ members in a B2B SaaS product").
- Identify the parent PRD or initiative this feature belongs to. If one exists, extract the relevant goal and success metrics. If none exists, write a two-sentence problem and goal statement as the anchor for all requirements.
- Clarify scope boundaries explicitly: what is explicitly OUT of scope for this feature? Scope exclusions prevent scope creep and give the spec teeth during reviews.
- Identify all actors who interact with the feature: end users, admin roles, system processes, external services, and automated jobs. A feature that seems simple often has 3-4 actors once you enumerate them.
- Ask about the timeline, target release, and any hard constraints (regulatory deadline, competitive event, upstream dependency). These directly determine what priority tier (Must/Should/Could) requirements fall into.
- Determine whether this feature modifies, replaces, or co-exists with an existing feature. If it replaces one, a migration and sunset plan is mandatory -- see Edge Cases.

---

### Step 2: Write Functional Requirements with MoSCoW Prioritization

Functional requirements are the core of the spec. Each one must be atomic, testable, and assigned a priority tier.

- Write every requirement as an active statement: "The system must [observable behavior]" or "The system must allow [actor] to [action] when [condition]." Passive constructions ("notifications should be sent") invite ambiguity.
- Apply MoSCoW: Must (launch blocker -- feature cannot ship without this), Should (target for launch but shippable without), Could (include if time and capacity permit), Won't (explicitly deferred to a future release). The Won't tier is underused and valuable -- it signals intentional deferral rather than oversight.
- Group requirements by functional area or user flow, not by component. "Search" and "Filter" are functional areas; "Frontend" and "Backend" are not.
- Assign each requirement a stable ID (FR-01, FR-02...) that survives edits. Engineers and QA will reference these IDs in code comments, test cases, and bug reports.
- Flag requirements that have cross-dependencies on other features with a "Depends on" column. A notification preference requirement may depend on the notification dispatch system being available -- that dependency must be visible.
- Apply the testability litmus test to every requirement: can QA write a test case that either passes or fails unambiguously? "The system must be fast" fails. "The system must return search results within 500ms at p95 for queries with up to 10,000 indexed records" passes.
- Document input validation rules as requirements, not as design notes: character limits, accepted formats (ISO 8601 for dates, E.164 for phone numbers), allowed ranges, and sanitization expectations.

---

### Step 3: Map the Complete User Flow

The user flow is a structured narrative of every path through the feature -- not just the happy path.

- Start from the entry point: how does the user discover or navigate to this feature? (Direct link, in-app navigation, email CTA, search result, API call.) Multiple entry points each deserve their own entry state.
- Write the primary (happy path) flow as a numbered alternating sequence: User action → System response → User action → System response. This makes it clear what is user-initiated versus system-initiated.
- For every decision point in the primary flow, identify the alternative path. "If the user has no existing data at step 3" is an alternative flow, not an edge case -- it is a predictable variant of normal usage.
- Document error flows separately from alternative flows. Error flows involve system failures, validation failures, or permission denials. Each error flow must end in a recovery path -- where does the user go next?
- Mark exit points: every flow ends somewhere. Does the user land on a confirmation screen, return to the previous page, receive an email, or trigger a downstream process?
- Include the system-side flow for asynchronous operations: if the user submits a form that triggers a background job, document what the user sees while the job runs, when it completes, and when it fails.
- Reference wireframes or mockup IDs if they exist. If they do not exist, write a plain-language description of the key screen state at each step -- enough for a designer to produce a wireframe from the spec alone.

---

### Step 4: Specify Edge Cases with Full Handling Instructions

Edge cases are not exceptions to the spec -- they are requirements for system behavior at boundary conditions. Treat them with the same rigor as functional requirements.

- Cover five mandatory edge case categories: (1) empty/zero states, (2) boundary values (maximum and minimum inputs), (3) concurrent or conflicting access, (4) network or service failures, and (5) permission or role boundary conditions.
- For each edge case, document four elements: trigger condition (what causes this state), expected system behavior, user-facing message or feedback, and recovery path.
- Distinguish between graceful degradation (feature partially works) and hard failure (feature completely unavailable). Specify which applies to each edge case.
- For boundary value edge cases, be precise: not "large amounts of data" but "a list with exactly 10,000 items (the maximum) vs. 10,001 items (over the limit)."
- Concurrent access edge cases are often the hardest: two users editing the same record, a user submitting while a background job is running, a session expiring mid-flow. Address each one explicitly with a conflict resolution strategy (last-write-wins, optimistic locking with user prompt, queue serialization).
- Assign each edge case an ID (E-01, E-02...) so QA can map test cases directly to the spec.

---

### Step 5: Write Design and Interaction Requirements

Design requirements define the expected visual and interaction behavior without prescribing the implementation -- they are constraints, not design decisions.

- Enumerate all required visual states for every interactive element in the feature: default, hover, focus, active, disabled, loading/skeleton, empty, error, and success. Missing states are the #1 cause of inconsistent UX during implementation.
- Specify responsive behavior at defined breakpoints. Use concrete breakpoint values (e.g., "below 768px width, the two-column layout collapses to a single column; the save button becomes full-width and sticky at the bottom of the viewport").
- Write accessibility requirements as verifiable statements: "All interactive elements must be reachable via Tab key in logical DOM order," "Error messages must be associated with their input via aria-describedby," "Color is never the sole differentiator between states -- an icon or label is always included."
- Specify animation and transition behavior with timing: "The drawer opens with a 200ms ease-in-out slide from the right. If the user's operating system has reduce-motion enabled, the animation is replaced with an instant transition."
- Reference design system components by name if one exists: "Use the existing Toast component for save confirmations, not a custom alert."
- Flag any design requirements that will require new design system components or significant deviations from existing patterns -- these have resourcing implications.

---

### Step 6: Identify Technical Considerations (Constraints, Not Solutions)

This section informs engineering of the constraints they must design within. It does not prescribe architecture or implementation.

- State performance requirements with specific numbers and measurement conditions: "The feature must render initial content within 2 seconds on a 3G connection (7.2 Mbps / 400ms latency) for a user with up to 500 records." Vague performance requirements ("fast") are unenforceable.
- Identify data model changes at the conceptual level: "This feature requires associating each notification type with per-user on/off preferences. The data model must support adding new notification types without requiring a user-facing settings update." Do not specify table names or column types -- that is engineering's domain.
- Flag API surface changes: new endpoints needed, existing endpoints that will change response shape (breaking vs. additive changes), and any versioning implications.
- Document security requirements: authentication (who can access this feature), authorization (what actions each role can perform), data sensitivity (PII exposure, encryption at rest vs. in transit), and audit logging requirements.
- Note backward compatibility constraints: if this feature changes the behavior of an existing API, endpoint, or user-visible feature, existing callers and users must not break silently.
- Call out external service dependencies: if this feature requires a third-party API, name the service, state the expected usage volume, and require a failure mode specification (see Edge Cases).
- Flag scalability constraints where relevant: "This feature will be enabled for all 2 million accounts simultaneously on launch day -- the implementation must not require per-user database writes during the enable event."

---

### Step 7: Define Launch Criteria and Rollout Plan

Launch criteria are the exit conditions for development -- the feature ships when all Must items are met and the rollout plan is in place.

- Separate launch criteria into three tiers: Gate (the feature cannot ship if this item is incomplete), Target (ship with this if possible, document as known gap if not), and Post-launch (complete within 30 days of launch).
- Include specific performance benchmarks as Gate criteria with actual numbers, not placeholders. "p95 API response time under 300ms under 100 RPS load" is a gate; "performance is acceptable" is not.
- Require a feature flag strategy: specify the flag name, the initial rollout percentage (0%, 1%, 10%, 50%, 100% are standard ramp stages), the criteria for advancing each stage, and who is authorized to advance the rollout.
- Include monitoring requirements as Gate criteria: what dashboards must exist, what alerts must be configured, and what error rate threshold triggers an automatic rollback or a manual review.
- Require a rollback procedure: what is the sequence of actions to disable the feature if a critical bug is discovered post-launch, and what is the expected user impact of rollback.
- Include documentation and support readiness: does the help center need updates, does the support team need a runbook, does the API reference need updates?

---

## Output Format

```markdown
## Feature Spec: [Feature Name]

### Overview

| Field               | Value                                              |
|---------------------|----------------------------------------------------|
| **Feature**         | [Feature name]                                     |
| **Product / Area**  | [Product name and area, e.g., "Growth / Onboarding"] |
| **Author**          | [Name and role]                                    |
| **Reviewers**       | [Names and roles of required approvers]            |
| **Date created**    | [YYYY-MM-DD]                                       |
| **Last updated**    | [YYYY-MM-DD]                                       |
| **Status**          | Draft / In Review / Approved / In Development / Shipped |
| **PRD reference**   | [PRD name, version, or link]                       |
| **Target release**  | [Version number or sprint/quarter]                 |
| **Feature flag**    | [Flag name, e.g., feature_notification_preferences] |

---

### Problem and Goal

**Problem statement:** [1-2 sentences describing the user problem in concrete terms. Who is affected, what is the pain, and what is the cost of not solving it.]

**Goal:** [What this feature achieves when successfully shipped. Frame as an outcome, not a feature description.]

**Non-goals (explicit out-of-scope):**
- [Specific thing that is NOT included and why]
- [Specific thing that is NOT included and why]

**Success metrics:**
| Metric | Baseline | Target | Measurement method |
|--------|----------|--------|--------------------|
| [Primary metric, e.g., "notification opt-out rate"] | [Current value] | [Target value] | [How it will be measured] |
| [Secondary metric] | [Current value] | [Target value] | [How it will be measured] |

---

### Actors

| Actor | Description | Permissions |
|-------|-------------|-------------|
| [End user role] | [Who they are and context] | [What they can do] |
| [Admin role] | [Who they are and context] | [What they can do] |
| [System / Job] | [Automated process, if any] | [What it does] |

---

### Functional Requirements

#### [Functional Area 1: e.g., Viewing Preferences]

| ID    | Requirement                                                | Priority | Depends On | Testable |
|-------|------------------------------------------------------------|----------|------------|----------|
| FR-01 | The system must display all notification categories with the user's current enabled/disabled status for each channel | Must | -- | Yes |
| FR-02 | The system must load and display the current preferences within 1 second for a user with up to 50 notification categories | Must | -- | Yes |
| FR-03 | The system must display the last-updated timestamp for the preferences page | Should | FR-01 | Yes |

#### [Functional Area 2: e.g., Editing Preferences]

| ID    | Requirement                                                | Priority | Depends On | Testable |
|-------|------------------------------------------------------------|----------|------------|----------|
| FR-04 | The system must allow the user to toggle email notifications on or off per category | Must | FR-01 | Yes |
| FR-05 | The system must persist the preference change within 2 seconds of the user's toggle action | Must | FR-04 | Yes |
| FR-06 | The system must revert the toggle to its previous state and display an error message if the save fails | Must | FR-05 | Yes |
| FR-07 | The system should display a non-blocking success toast for 3 seconds after a successful save | Should | FR-05 | Yes |
| FR-08 | The system could allow users to save a preset (e.g., "Digest only") that configures multiple categories at once | Could | FR-04 | Yes |
| FR-09 | The system must not expose notification categories that the user's current plan does not include | Must | FR-01 | Yes |

#### [Functional Area 3: e.g., Bulk Actions]

| ID    | Requirement                                                | Priority | Depends On | Testable |
|-------|------------------------------------------------------------|----------|------------|----------|
| FR-10 | The system must provide an "Unsubscribe from all email" option that disables all email notification categories simultaneously | Must | FR-04 | Yes |
| FR-11 | The system must display a confirmation modal before executing the "Unsubscribe from all" action | Must | FR-10 | Yes |

---

### User Flow

#### Entry Points

| Entry Point | Trigger | Initial State |
|-------------|---------|---------------|
| Settings navigation | User clicks "Notifications" in account settings | Preferences page loads with current state |
| Email footer link | User clicks "Manage notification preferences" in an email footer | Same page, deep-linked to email section |
| Admin console | Admin navigates to a user's notification settings | Admin view of user's preferences (read or write per role) |

#### Primary Flow: User Edits a Single Notification Preference

1. User navigates to Settings > Notifications.
2. System fetches the user's current notification preferences and displays all categories grouped by notification type (email, push, in-app). Each row shows category name, description, and current toggle state.
3. User locates the "Weekly digest email" category and clicks the toggle to disable it.
4. System immediately reflects the disabled state in the UI (optimistic update) and sends a PATCH request to persist the change.
5. System confirms the save was successful and shows a non-blocking "Preferences saved" toast for 3 seconds.
6. User exits the page or navigates to another settings section.

#### Alternative Flow A: User Has No Push Notification Categories Available

- At step 2, if the user's account plan does not include push notifications, the push notifications section is hidden entirely (not shown as disabled). A contextual upgrade CTA is shown below the email section.

#### Alternative Flow B: First-Time Visit (Preferences Never Configured)

- At step 2, if the user has never visited this page and no explicit preferences exist, the system displays the defaults (all categories enabled per the system default configuration). A banner reads: "These are your default notification settings. Adjust them any time."

#### Error Flow: Save Fails Due to Network or Server Error

- At step 4, if the PATCH request fails after 3 retry attempts (500ms, 1s, 2s backoff), the system reverts the toggle to its pre-click state and displays an inline error message: "We couldn't save your change. Check your connection and try again." The toast is not shown.

---

### Edge Cases

| ID   | Scenario                          | Trigger Condition                                       | Expected System Behavior                                              | User-Facing Message                                                      | Recovery Path                              |
|------|-----------------------------------|---------------------------------------------------------|-----------------------------------------------------------------------|--------------------------------------------------------------------------|--------------------------------------------|
| E-01 | Empty state -- no categories exist | User's account type has zero notification categories    | Render empty state illustration and copy; no toggles shown            | "No notifications to manage yet. Check back when features are enabled."  | User navigates away                        |
| E-02 | Toggle rapid-fire input           | User clicks the same toggle 3+ times within 500ms       | Debounce: cancel in-flight requests; send only the final state after 500ms of inactivity | None (UI reflects final state immediately) | Final state is persisted correctly         |
| E-03 | New category added after last visit | System adds a new notification category post-deployment | New category appears with system default (enabled); highlighted with a "New" badge for 30 days | "New: [Category name] notifications are on by default." | User can disable on the same page          |
| E-04 | "Unsubscribe all" on already-empty preferences | All categories are already disabled when user triggers bulk action | Action succeeds silently (idempotent); no change recorded              | "You're already unsubscribed from all emails."                           | No action needed                           |
| E-05 | Session expires mid-edit          | Session token expires while user is on the page         | PATCH request returns 401; user is redirected to login with return URL set to preferences page | "Your session expired. Log in to save your changes."                     | User logs in and returns to the same page  |
| E-06 | OS-level push notifications disabled | Device OS has notifications blocked for the app         | Push toggle is shown but in a disabled/informational state; not a toggleable control | "Push notifications are blocked by your device. [How to enable]"         | User adjusts OS settings and returns       |
| E-07 | Admin views preferences for a deactivated user | Admin navigates to preferences for an account with status=deactivated | Page renders in read-only mode; all edit controls are hidden; banner indicates deactivated status | "This account is deactivated. Notification preferences are read-only."   | Admin exits or reactivates account first   |
| E-08 | Concurrent edits from two devices | Same user edits preferences simultaneously on desktop and mobile | Last-write-wins: whichever PATCH request completes last is the persisted state; no merge conflict UI is shown | None (each device reflects its own state until next page load)           | User reloads either page to see final state |

---

### Design Notes

#### Visual States

| Element                | State       | Behavior / Description                                                            |
|------------------------|-------------|------------------------------------------------------------------------------------|
| Notification toggle    | Default (on) | Toggle track is filled with brand primary color; thumb is on the right              |
| Notification toggle    | Default (off)| Toggle track is gray; thumb is on the left                                          |
| Notification toggle    | Loading      | Toggle is disabled; spinner replaces thumb for up to 2 seconds (optimistic update avoids this state in most cases) |
| Notification toggle    | Error        | Toggle reverts to pre-click state; inline error text appears below the row          |
| Preferences page       | Loading      | Skeleton rows with shimmer animation replace toggle rows during initial fetch        |
| Preferences page       | Empty        | Illustration + heading + body copy; no toggle rows                                  |
| "Unsubscribe all" button | Disabled   | Button is grayed out when all categories are already disabled                       |
| Save toast             | Success      | Non-blocking toast, bottom-right, 3-second auto-dismiss, includes checkmark icon    |
| Save toast             | Error        | Inline error below the affected row, not a toast; persists until user retries        |

#### Responsive Behavior

- **Desktop (≥1024px):** Two-column layout -- category name and description on the left, channel toggles (email, push, in-app) on the right.
- **Tablet (768px -- 1023px):** Single-column layout; channel toggles stack vertically below the category description.
- **Mobile (<768px):** Single-column layout; sticky "Unsubscribe from all" CTA anchored to bottom of viewport. Minimum touch target for all toggles: 44x44 points per WCAG 2.5.5.

#### Accessibility Requirements

- All toggle controls must use `role="switch"` with `aria-checked` reflecting current state.
- Error messages must be associated with their toggle via `aria-describedby`.
- The "New" badge on recently added categories must not convey information by color alone -- it must include the text "New."
- Keyboard navigation: Tab moves between toggle rows; Space activates the focused toggle.
- The confirmation modal for "Unsubscribe all" must trap focus while open and return focus to the trigger button on close.
- Page must meet WCAG 2.1 AA contrast ratios for all text and interactive elements.

---

### Technical Considerations

| Area                  | Consideration                                                                                     |
|-----------------------|--------------------------------------------------------------------------------------------------|
| Performance           | Initial page load must render within 1 second (p95) for users with up to 50 notification categories. PATCH requests must complete within 500ms (p95) under normal load. |
| Data model            | Requires a per-user, per-notification-category, per-channel preference store. Must support adding new categories without requiring retroactive user records (default value must be inferrable without a row). |
| API                   | Requires a GET endpoint returning all categories and user preferences in a single response (avoid N+1 per-category requests). Requires a PATCH endpoint accepting partial updates (single toggle change without resending the full preference set). |
| Security              | Users may only read and write their own preferences. Admins may read and write preferences for users within their organization. All preference changes must be written to the audit log with actor, timestamp, and before/after values. |
| Backward compatibility | Existing email dispatch logic reads a preferences record to determine whether to send. If no record exists for a user-category pair, the system must default to "enabled" to preserve current behavior for existing users. |
| Scalability           | Opt-out status is read on every notification dispatch. If the preferences store becomes a hot-read path, the implementation must support a read-through cache with TTL of no more than 60 seconds. |
| Third-party push      | Push notification enable/disable status is stored in this feature's data model but the actual token registration and deregistration is delegated to the push notification service. Specify the interface contract, not the implementation. |

---

### Launch Criteria

#### Gate (Feature Cannot Ship Without These)

- [ ] FR-01 through FR-11 (all Must requirements) implemented and passing QA test cases
- [ ] Edge cases E-01 through E-08 covered by automated or manual test cases
- [ ] p95 GET response time ≤1 second under 200 RPS load test
- [ ] p95 PATCH response time ≤500ms under 200 RPS load test
- [ ] WCAG 2.1 AA accessibility audit passed (screen reader, keyboard navigation, contrast)
- [ ] Security review: authorization boundary tested (user cannot write another user's preferences)
- [ ] Audit log entries verified for all create, update, and bulk-delete actions
- [ ] Backward compatibility verified: existing users with no preference records receive notifications correctly (defaults to enabled)
- [ ] Feature flag `feature_notification_preferences` configured; initial rollout set to 0%
- [ ] Monitoring dashboard live: tracks preference save error rate, p95 latency, and feature flag exposure rate
- [ ] Error rate alert configured: pages on-call if save error rate exceeds 1% over a 5-minute window
- [ ] Rollback procedure documented: disabling the feature flag reverts to previous settings page; no data migration required

#### Target (Ship with These if Possible)

- [ ] FR-07 (success toast) implemented
- [ ] "New" badge for recently added categories implemented
- [ ] Help center article "Managing your notification preferences" published

#### Post-Launch (Complete Within 30 Days)

- [ ] FR-08 (preference presets / "Digest only") scoped and added to backlog
- [ ] A/B test instrumented to measure impact of default-on vs. default-off for new categories on opt-out rate
- [ ] Admin bulk-preference management scoped for team accounts
```

---

## Rules

1. **Never conflate requirements with implementation.** "The system must persist preferences within 2 seconds of a toggle action" is a requirement. "Use a Redis write-through cache with a 60-second TTL in front of PostgreSQL" is an implementation decision. The spec owns the former; engineering owns the latter.

2. **Every functional requirement must include a priority tier.** Must/Should/Could/Won't is non-negotiable on every row. Unprioritized requirements are treated as Must by engineers by default, which causes scope creep and missed deadlines.

3. **Testability is mandatory, not aspirational.** Before writing a requirement, ask: can a QA engineer write a test case with a binary pass/fail result? If not, the requirement is too vague. Rewrite it with specific conditions, counts, time bounds, or observable outputs.

4. **Requirement IDs must be stable and referenced throughout the document.** FR-01 in the requirements table must be referenced in launch criteria ("all Must requirements FR-01 through FR-11 implemented"), in QA test plans, and in engineering tickets. Renumbering after review breaks traceability.

5. **Empty states are not optional.** Every list, table, or data surface must have an explicitly designed empty state. An undocumented empty state will ship as a blank screen or a raw error -- both are worse than a designed empty state.

6. **Never document design states for only the happy path.** The minimum set of states for any interactive control is: default, loading, empty, error, success. Any of these missing from the Design Notes section means a developer will invent behavior for that state during implementation.

7. **Backward compatibility is a Gate-level launch criterion.** If this feature changes the behavior of any existing API, notification dispatch path, UI component, or data record format, the spec must explicitly state whether existing consumers are affected and how. Silent behavioral changes in production are the most expensive bugs to diagnose.

8. **Performance requirements must include conditions, not just thresholds.** "Under 500ms" is insufficient. "p95 API response time under 500ms under 200 concurrent requests for a user with up to 500 records" is a testable requirement. Conditions include: percentile (p50/p95/p99), load (RPS or concurrent users), and data volume (record count).

9. **Rollback must be explicitly planned before launch, not after an incident.** The launch criteria checklist must include a documented rollback procedure. Feature flag-gated features should have confirmed that flag-off returns the product to a known-good state without data loss or data corruption.

10. **The spec must be self-contained enough for an engineer to begin implementation without reading the parent PRD.** The problem statement, actor definitions, and non-goals must provide full context. Cross-references to the PRD are supplementary, not load-bearing.

11. **Avoid requirements that describe UI layout instead of behavior.** "The system must display a button labeled 'Save'" is a UI prescription, not a requirement. "The system must allow the user to explicitly save their changes before navigating away from the page" is a requirement. Layout and label decisions belong in design artifacts.

12. **Concurrent access must always be explicitly resolved.** Every feature that involves write operations on shared data must document the conflict resolution strategy: last-write-wins, optimistic locking with user notification, pessimistic locking, or queue serialization. "Two users editing the same record" is a predictable production scenario, not a corner case.

---

## Edge Cases

### Feature That Replaces or Deprecates an Existing Feature

If this spec describes a feature that replaces existing functionality (e.g., a new notification settings page replacing an older inline settings component), the spec must include a dedicated Migration section with the following:

- **What changes for existing users:** Does their existing data persist? Does their current state carry over? Is there a one-time migration job?
- **Transition period:** Will both the old and new experiences exist simultaneously? For how long? What is the rollout gate that triggers the cutover?
- **Data migration:** Specify what happens to records, preferences, or configurations created under the old system. Explicitly state whether old data is read-compatible with the new schema.
- **Sunset plan:** Date or trigger for removing the old feature. Who is responsible for the removal? Is a deprecation notice needed for API consumers?
- Add a Gate launch criterion: "Migration verified for 100% of existing user records in staging before production rollout."

---

### Feature with Complex Role-Based Access Control

When a feature has meaningfully different behavior for different user roles (e.g., end users vs. account admins vs. super admins), the spec must include a Permissions Matrix:

- A table with roles as columns and actions as rows. Each cell is: Allowed, Denied, or Conditional (with the condition stated).
- Edge cases for role transitions: what happens if a user is downgraded from admin to member while viewing an admin-only section of the feature? Specify: immediate redirect, graceful read-only mode, or next-page-load enforcement.
- Edge cases for inherited permissions in hierarchical org structures (parent org, child org, workspace).
- Never document permissions as prose -- a matrix forces completeness and is directly usable for security review.

---

### Mobile-First or Touch-Primary Feature

For features where mobile is the primary or co-primary experience, add mobile-specific requirements explicitly:

- Minimum touch target sizes: 44x44 points (iOS HIG) or 48x48 dp (Material Design). State these as requirements, not design guidelines.
- Gesture behaviors: specify swipe-to-dismiss, long-press for context menus, and pinch-to-zoom explicitly. Do not assume gesture behavior is inherited from the platform.
- Offline behavior: can the user view stale preferences while offline? Can they queue a change to sync when connectivity returns? Specify the behavior and the user communication for offline state.
- Separate flows: if the mobile and desktop flows differ by more than a layout change (e.g., mobile uses a bottom sheet while desktop uses a sidebar), document them as separate flows with explicit state-to-state transitions.

---

### Feature with Real-Time or Collaborative Elements

Features involving real-time updates (WebSocket subscriptions, live collaborative editing, presence indicators) require explicit specifications for degraded-mode behavior:

- **Conflict resolution strategy:** Document the chosen approach -- last-write-wins (simple but can cause data loss), operational transformation (complex but correct for text), or user-prompted merge (safest for structured data). Justify the choice.
- **Staleness window:** How old can displayed data be before the system must alert the user? Specify in seconds.
- **Reconnection behavior:** When a WebSocket drops, does the UI display a "reconnecting" banner? At what threshold does the UI fall back to polling? At what threshold does it display "You are offline"?
- **Real-time vs. persistence:** Clearly separate which operations are optimistic (update UI immediately, sync later) and which are pessimistic (wait for server confirmation before updating UI).

---

### Feature Integrating with Third-Party Services

Any feature that calls an external API (payment processor, identity provider, email delivery service, push notification platform) must specify failure modes explicitly:

- **Unavailability:** What does the user see if the third-party service returns a 503 or times out? Is the feature blocked (hard failure) or degraded (soft failure)?
- **Rate limiting:** What is the expected call volume? Does it stay within the third-party's rate limits? What happens if the rate limit is exceeded -- queue, drop, or error?
- **Error mapping:** Third-party error codes must be mapped to user-facing messages. Never expose raw third-party error messages to users (they are often technical, alarming, or legally sensitive).
- **Data residency:** If the third-party service processes or stores user data, state the data residency and privacy implications. This is a launch Gate item if PII is involved.
- **Retry logic:** Specify the retry strategy (number of attempts, backoff algorithm, maximum total wait time) as a technical constraint. Uncontrolled retries cause thundering herd problems.

---

### Feature Behind a Feature Flag with Phased Rollout

When a feature uses a feature flag for controlled rollout, the spec must document the rollout plan:

- **Flag name and system:** State the exact flag identifier and the feature flag platform used (this is a standard tool in the domain -- not a vendor recommendation, but a required artifact).
- **Rollout stages:** 0% (flag off, development), 1% (internal beta), 10% (canary), 50% (broad beta), 100% (full launch). Each stage must have advancement criteria (e.g., "zero P0 bugs, error rate <0.5%, latency within SLA").
- **Targeting rules:** Is the flag targeted by user ID, organization ID, geographic region, account tier, or random percentage? Document the targeting logic.
- **Flag retirement:** Once at 100%, the flag must be retired. Specify the timeline (typically 2-4 weeks post-full-rollout) and the PR/ticket to remove the flag-gated code path. Orphaned flags are a maintenance debt and a security surface.

---

## Example

**Input:** "I need a feature spec for a CSV export feature on our data tables. Users need to be able to export filtered and sorted table data to a CSV file. We're a B2B SaaS analytics product. There's no existing export feature."

**Output:**

---

## Feature Spec: Data Table CSV Export

### Overview

| Field               | Value                                                       |
|---------------------|-------------------------------------------------------------|
| **Feature**         | Data Table CSV Export                                       |
| **Product / Area**  | Analytics Platform / Data Tables                            |
| **Author**          | [PM Name]                                                   |
| **Reviewers**       | Engineering lead, Design lead, QA lead, Security            |
| **Date created**    | 2025-01-15                                                  |
| **Last updated**    | 2025-01-15                                                  |
| **Status**          | Draft                                                       |
| **PRD reference**   | Analytics Platform PRD v2.3 -- "Data Portability" initiative |
| **Target release**  | Q2 2025 / Sprint 24                                         |
| **Feature flag**    | feature_csv_export                                          |

---

### Problem and Goal

**Problem statement:** B2B analytics users routinely need to share filtered table data with stakeholders who do not have product access, or import it into external tools (Excel, Tableau, Google Sheets, custom scripts). Currently, users manually copy table data row by row or take screenshots -- both methods are error-prone and do not scale beyond 20-30 rows. This causes users to request data extracts from their data team, adding operational overhead and delaying decisions.

**Goal:** Allow any authenticated user with table view access to export the current filtered and sorted view of any data table to a well-formed CSV file in one to two clicks, eliminating manual data extraction for datasets up to 100,000 rows.

**Non-goals (explicit out-of-scope):**
- Export to Excel (.xlsx), PDF, or other formats -- scoped to CSV only for this release
- Scheduled or automated exports (e.g., "email me this report every Monday") -- future feature
- Exporting data the user does not have view access to -- permissions are inherited from table-level access controls
- Admin-level bulk export of all tables -- separate admin tooling

**Success metrics:**

| Metric                              | Baseline     | Target         | Measurement method                               |
|-------------------------------------|--------------|----------------|--------------------------------------------------|
| "Data export" support tickets / week | 23 tickets   | <5 tickets     | Support ticket tagging                           |
| % of active users using export in first 30 days | 0%  | ≥35%          | Product analytics event: `export_csv_initiated`  |
| Export completion rate (initiated → file downloaded) | -- | ≥90% | Funnel: `export_csv_initiated` → `export_csv_downloaded` |

---

### Actors

| Actor           | Description                                             | Permissions                                             |
|-----------------|---------------------------------------------------------|---------------------------------------------------------|
| Standard user   | Any authenticated user with view access to a table      | Can export tables they have view or edit access to      |
| Viewer (read-only role) | User with explicit read-only role on the table | Can export; cannot edit table data or column configuration |
| Admin           | Workspace administrator                                 | Can export any table in the workspace; can disable export for specific tables |
| Guest / public user | Unauthenticated or externally shared view         | Cannot export; export controls are not shown            |

---

### Functional Requirements

#### Initiating an Export

| ID    | Requirement                                                                                            | Priority | Depends On | Testable |
|-------|--------------------------------------------------------------------------------------------------------|----------|------------|----------|
| FR-01 | The system must display an "Export CSV" button in the data table toolbar for all users with view access or higher | Must | -- | Yes |
| FR-02 | The system must not display the "Export CSV" button for guest or unauthenticated users                  | Must | FR-01 | Yes |
| FR-03 | The system must apply the user's current active filters and sort order to the exported data             | Must | -- | Yes |
| FR-04 | The system must include only the columns currently visible in the user's table view (respecting hidden columns) | Must | -- | Yes |
| FR-05 | The system must allow users to choose between "Export current view" and "Export all pages" when the table has more than one page of data | Should | FR-01 | Yes |

#### Generating the Export

| ID    | Requirement                                                                                            | Priority | Depends On | Testable |
|-------|--------------------------------------------------------------------------------------------------------|----------|------------|----------|
| FR-06 | The system must generate a valid RFC 4180-compliant CSV file with UTF-8 encoding                       | Must | FR-01 | Yes |
| FR-07 | The system must include a header row with column display names (not internal field identifiers)         | Must | FR-06 | Yes |
| FR-08 | The system must handle special characters in cell values by quoting fields containing commas, line breaks, or double-quote characters | Must | FR-06 | Yes |
| FR-09 | The system must complete generation and trigger the file download for datasets up to 10,000 rows within 5 seconds (p95) | Must | FR-06 | Yes |
| FR-10 | The system must support async generation for datasets between 10,001 and 100,000 rows, notifying the user via in-app notification and email when the file is ready | Must | FR-06 | Yes |
| FR-11 | The system must reject export requests for datasets exceeding 100,000 rows and display an informational message with filtering guidance | Must | FR-01 | Yes |
| FR-12 | The system should name the exported file using the format `[TableName]_[YYYY-MM-DD]_export.csv`         | Should | FR-06 | Yes |
| FR-13 | The system must not include data from rows the requesting user does not have row-level access to, if row-level security is configured | Must | FR-03 | Yes |

#### Async Export Delivery

| ID    | Requirement                                                                                            | Priority | Depends On | Testable |
|-------|--------------------------------------------------------------------------------------------------------|----------|------------|----------|
| FR-14 | The system must store async export files for a maximum of 7 days, after which the download link expires | Must | FR-10 | Yes |
| FR-15 | The system must display a progress indicator while an async export is generating                        | Should | FR-10 | Yes |
| FR-16 | The system must allow users to cancel an in-progress async export                                       | Could | FR-10 | Yes |

---

### User Flow

#### Entry Points

| Entry Point            | Trigger                                      | Initial State                              |
|------------------------|----------------------------------------------|--------------------------------------------|
| Table toolbar button   | User clicks "Export CSV" in the data table toolbar | Export options modal opens               |
| Table context menu     | User right-clicks on the table header        | Same modal                                 |
| Keyboard shortcut      | User presses Cmd+Shift+E (Mac) / Ctrl+Shift+E (Windows) | Same modal                        |

#### Primary Flow A: Synchronous Export (≤10,000 rows)

1. User has applied filters and sorting to a data table (e.g., filtered to "Region = APAC", sorted by "Revenue" descending), resulting in 847 visible rows.
2. User clicks "Export CSV" in the table toolbar.
3. System opens a modal with two options: "Visible columns only (6 columns)" and a column count note; and a row count summary: "847 rows match your current filters."
4. User confirms by clicking "Download CSV."
5. System generates the CSV file server-side, applying the active filters and sort, including only visible columns, encoding as UTF-8, RFC 4180-compliant.
6. Browser triggers a file download dialog or auto-downloads the file named `APAC_Revenue_Table_2025-01-15_export.csv`.
7. Modal closes. System records the export event in the audit log: user ID, table ID, filter state, row count, timestamp.

#### Primary Flow B: Asynchronous Export (10,001 -- 100,000 rows)

1. User applies no filters to a 75,000-row table and clicks "Export CSV."
2. System opens the modal with a message: "This export contains 75,000 rows and will be processed in the background. We'll notify you when your file is ready (usually under 2 minutes)."
3. User clicks "Start export."
4. System queues the export job, displays a progress indicator in the modal, and optionally closes the modal with an in-app notification banner: "Your export is being prepared."
5. System completes the job (asynchronously), stores the file with a 7-day expiry, and sends both an in-app notification and an email to the requesting user with a download link.
6. User clicks the download link in the notification or email.
7. System validates the link is not expired and the requesting user is the same user who initiated the export, then serves the file.

#### Alternative Flow: User Exports with No Filters Applied (Full Table, ≤10,000 rows)

- At step 3, modal displays: "You have no filters applied. This will export all 3,240 rows." User proceeds normally.

#### Error Flow: Export Exceeds 100,000-Row Limit

- At step 3, if the row count exceeds 100,000, the "Download CSV" button is replaced with an explanatory message: "Your current view has 142,000 rows, which exceeds the 100,000-row export limit. Apply filters to reduce the row count, then try again." The modal provides a "Help me filter" link to the filter documentation.

#### Error Flow: Async Export Job Fails

- After step 4, if the background job fails, the system sends an in-app notification and email: "Your export for [Table Name] could not be completed. Please try again. If the problem persists, contact support." A retry button is included in the in-app notification.

---

### Edge Cases

| ID   | Scenario                               | Trigger Condition                                             | Expected System Behavior                                                                           | User-Facing Message                                                                                     | Recovery Path                                        |
|------|----------------------------------------|---------------------------------------------------------------|----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|------------------------------------------------------|
| E-01 | Table has zero rows after filtering    | User's filters result in 0 matching rows                      | Disable the "Download CSV" button; explain the empty state in the modal                             | "No rows match your current filters. Adjust filters to export data."                                    | User modifies filters and retries                    |
| E-02 | All columns are hidden                 | User has hidden all columns in the table view                 | Disable the "Download CSV" button; explain the issue                                                | "No columns are visible. Show at least one column to export."                                            | User shows at least one column and retries           |
| E-03 | User's session expires mid-async-job  | Session token expires before the async job completes          | Job continues server-side (auth is validated at job creation, not delivery); file is generated and stored; notification sent normally | Standard async completion notification                                                               | User logs back in to download the file               |
| E-04 | Download link accessed after 7-day expiry | User clicks an expired export download link               | Return a 410 Gone response; display expiry message with option to re-export                          | "This export link has expired. Export links are valid for 7 days. Re-export to generate a new file."    | User initiates a new export                          |
| E-05 | Different user attempts to access export link | User B is sent User A's download link via email forward  | System validates that the requesting user matches the user who initiated the export; denies access  | "This export was created by a different account and cannot be downloaded here."                          | User B initiates their own export                    |
| E-06 | Cell value contains newline characters | A text field in the data contains `\n` or `\r\n`              | Cell value is quoted per RFC 4180; newline is preserved within the quoted field                     | None (transparent to user; file opens correctly in Excel and Google Sheets)                             | No recovery needed                                   |
| E-07 | Column header contains a comma        | A column is named "Revenue, USD"                              | Column header is quoted in the CSV header row                                                       | None                                                                                                    | No recovery needed                                   |
| E-08 | Async export file storage is unavailable | Object storage service is degraded during file write        | Job fails; error notification sent; job ID retained for 24 hours to allow retry without re-queuing  | "Your export couldn't be saved. We'll retry automatically in 10 minutes. You'll be notified when it's ready." | Automatic retry; user can also manually re-export |

---

### Design Notes

#### Visual States

| Element               | State     | Behavior                                                                                      |
|-----------------------|-----------|-----------------------------------------------------------------------------------------------|
| Export CSV button     | Default   | Secondary button style, export icon + "Export CSV" label                                       |
| Export CSV button     | Disabled  | Grayed out with tooltip: "No rows to export" or "No columns visible"                          |
| Export modal          | Loading (row count fetching) | Skeleton text where row count will appear; "Download CSV" button is disabled until count loads |
| Export modal          | Ready (sync) | Row count and column count shown; "Download CSV" button enabled                              |
| Export modal          | Ready (async) | Row count shown with async processing notice; "Start export" button                          |
| Export modal          | Over limit | "Download CSV" button replaced with limit-exceeded message and filter guidance                |
| Progress indicator    | Async generating | Indeterminate progress bar with "Preparing your export..." copy; cancel button visible     |
| In-app notification   | Export ready | Bell icon with "Your export is ready" + "Download" CTA + "Dismiss" action                   |
| In-app notification   | Export failed | Bell icon with "Your export failed" + "Retry" CTA + "Dismiss" action                       
