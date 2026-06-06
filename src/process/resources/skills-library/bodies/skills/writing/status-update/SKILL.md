---
name: status-update
description: |
  Writes structured status updates in accomplishments/upcoming/blockers format
  for weekly, sprint, or project reporting. Use when the user needs a status
  report, weekly update, sprint review, or progress report. Do NOT use for full
  business reports (use `business-report`), stakeholder updates for executives
  (use `stakeholder-update`), or meeting notes (use `meeting-notes`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "report writing analysis"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Status Update Writing

## When to Use

Use this skill when the user needs to produce a structured, periodic progress communication -- typically for a manager, team lead, scrum master, or cross-functional peer group. Specific triggers include:

- User asks for a weekly status update, progress report, or "Friday update" for their team or manager
- User needs to write a sprint report, iteration summary, or end-of-sprint recap for an agile ceremony or async distribution
- User wants to document accomplishments, upcoming work, and blockers for a project in active execution
- User needs to send a structured status email to a mailing list, Slack channel, or shared document (Confluence, Notion, Google Doc) where readers self-serve the information
- User is a team lead, IC, or PM who writes recurring status updates and wants to establish a repeatable format
- User needs a lightweight project check-in document that does not require executive narrative or financial analysis
- User has a status update template from their organization and needs help filling it in correctly

**Do NOT use this skill for:**

- Full narrative business reports with financial analysis, methodology sections, and appendices -- use `business-report` instead
- Executive or board-level stakeholder updates that require strategic framing, risk registers, and decision requests with dollar impact -- use `stakeholder-update` instead
- Post-meeting documentation that captures decisions, action items, and attendees -- use `meeting-notes` instead
- Project proposals or initiative briefs that need a problem statement, solution options, and go/no-go recommendation -- use `project-proposal` instead
- Incident post-mortems that require root cause analysis, timeline reconstruction, and corrective action tracking -- use `postmortem-report` instead
- OKR or quarterly business reviews that require multi-period trend analysis and goal alignment -- use `qbr-report` instead

---

## Process

### Step 1: Establish the Context Frame

Before writing a single word of the update, collect the minimum viable context. If the user has not provided it, ask directly.

- **Reporting period:** Get exact date range -- "this week" is ambiguous. Pin it to specific dates (e.g., "Feb 17-21"). For sprints, confirm the sprint number and duration (1-week, 2-week, or 3-week cycles).
- **Role and domain:** A software engineer's update reads differently from a marketing manager's or a construction project manager's. The vocabulary, metrics, and risk framing differ significantly.
- **Audience:** Ask who reads this update. Direct manager (1:1 format, can include raw struggles), team peers (lateral context, collaborative framing), or cross-functional stakeholders (outcome-focused, jargon-free). This single variable changes the entire tone and specificity level.
- **Medium:** Is this an email, a Slack message, a document comment, or a shared wiki page? Email and Slack have different length tolerances. Wiki pages allow headers; emails should minimize formatting.
- **Cadence history:** Is this the first update or part of an ongoing series? Recurring updates should reference the previous period's forecasts and show whether targets were met.

### Step 2: Gather Raw Material From the User

Ask the user to brain-dump. Prompt them with these exact categories to extract honest, complete information:

- **Finished work:** "What did you start and complete within this period? Include only work that is done -- not partially done." Push for specifics: file delivered, feature shipped, decision made, document published.
- **In-flight work:** "What was started but is still ongoing? What percentage complete, and what is the realistic finish date?" Do not accept "soon" or "next week" without a calendar date.
- **Planned new work:** "What do you intend to begin next period that has not yet started?" This is different from in-flight work. Upcoming items are not yet underway.
- **Blockers and dependencies:** "What is preventing you or your team from moving faster right now? Who owns the resolution?" Blockers are external -- things the writer cannot self-resolve. Risks are internal uncertainties. Distinguish between them.
- **Key metrics:** "Are there any numbers your audience expects to see -- velocity, coverage, conversion rate, budget burn, defect count, delivery date adherence?" Metrics make updates scannable and undeniable.
- **Changes from last period:** "Did anything you promised last period slip, accelerate, or change scope?" Surfacing changes proactively is far more credible than omitting them.

### Step 3: Classify and Validate Each Item

Every raw item the user provides must pass through a simple classification test before being included.

- Sort items into exactly four buckets: **Completed**, **In Progress**, **Upcoming**, and **Blockers/Risks**. Do not mix these buckets -- a half-finished item is never "Completed."
- Apply the **result vs. activity test** to every Completed item. Activities use verbs like "worked on," "reviewed," "discussed," "looked into," "spent time on." Results use verbs like "shipped," "resolved," "delivered," "reduced," "approved," "published," "closed." Reject activity language every time.
- Apply the **specificity test**: Can a reader who knows nothing about the project understand what was done? If not, add one concrete detail -- the artifact name, the number, the decision made, or the downstream effect.
- Apply the **materiality threshold**: Is this item significant enough that the audience would miss it if it were not included? Do not include minor administrative tasks (scheduling a meeting, updating a spreadsheet row) unless they have strategic significance for the audience.
- Cap each bucket at five items. If the user has more than five, group related items into a single line with parenthetical detail: "Resolved 4 billing bugs (payment timeout, duplicate charge, void receipt, tax rounding) -- all deployed to production."

### Step 4: Write Results-First Bullet Lines

Each bullet in the Completed and In Progress sections must follow a consistent syntactic pattern that puts the outcome first and the activity second.

- **Pattern for Completed:** `[Outcome noun phrase] -- [supporting detail or measurement]`
  - Example: "API authentication refactor complete -- latency reduced from 380ms to 95ms across 3 endpoints"
  - Example: "Q3 vendor contract signed -- $240K annual commitment, legal review complete"
- **Pattern for In Progress:** `[Work item name] -- [current status], expected completion [date]`
  - Example: "Data migration script -- 60% complete, expected Jan 14"
  - Example: "User interview synthesis -- 5 of 8 interviews coded, expected Jan 15"
- **Pattern for Upcoming:** `[Work item name] -- starting [date], owner [name if not author]`
- Use past tense exclusively for Completed. Use present progressive ("in progress," "underway") or future tense for Upcoming. Tense mixing is a signal of poor categorization.
- Numbers are mandatory when available. Percentages, dollar amounts, time durations, counts, and rates all make bullets unambiguous. "Increased conversion" is weak. "Increased checkout conversion from 2.3% to 3.1% over 14-day test" is strong.

### Step 5: Write Blocker Entries With Full Accountability Structure

Blockers are the highest-value section because they are action-triggering. Weak blocker entries get ignored; strong ones get unblocked.

- Every blocker must include four elements: **(1) what is blocked**, **(2) what is needed to unblock**, **(3) who specifically must act**, **(4) by what date action is needed**. Missing any of these makes the blocker unactionable.
- Write blockers in a standard format: `**[Blocked deliverable]** -- Needs [specific action] from [full name or role] by [date]. Impact if unresolved: [consequence with date or dollar/time cost].`
- Distinguish blockers from risks. A blocker is a current stop -- work cannot proceed. A risk is a potential future stop -- work may be impaired if something happens. Both belong in the section but should be labeled differently.
- If a blocker has been active for more than one reporting period, say so explicitly: "Blocker now entering week 3." Escalation signals are credibility signals.
- If the author has a preferred resolution path but the decision belongs to someone else, state it: "Recommend [action]. Awaiting approval from [person]."

### Step 6: Select and Format Key Metrics

Metrics belong in the update only if the audience tracks them and expects them. Do not invent metrics to fill the table.

- Use a metrics table only when there are three or more distinct measurements. Fewer than three metrics can be embedded inline within bullets.
- Always show at least two columns: current period value and a comparator (prior period, target, or baseline). A single number without context is nearly meaningless.
- Common metric categories by role: Engineering (sprint velocity, bug count, deployment frequency, test coverage, DORA metrics), Product (active users, feature adoption rate, NPS, conversion rate), Marketing (MQL volume, campaign CTR, pipeline generated), Operations (ticket resolution time, SLA compliance, throughput), Finance (budget burn, forecast variance, actuals vs. plan).
- If metrics are trending negatively, do not hide them in the table. Call them out explicitly in a bullet under the table with an explanation and a recovery action.

### Step 7: Apply Length and Readability Constraints

Status updates are read in under two minutes. Violating this expectation reduces the probability of the update actually being read.

- **Word count targets by audience:** Direct manager: 150-250 words. Team/peers: 200-350 words. Cross-functional distribution: 150-300 words. Executive pass-through (if the manager may forward it): 100-200 words.
- **Maximum items per section:** 5 completed, 5 in progress/upcoming, 3 blockers. More than 3 active blockers signals a systemic problem that should trigger a conversation, not a longer list.
- Scan test: Could someone read only the first bullet of each section and get the essential picture? If not, reorder. The lead bullet in each section carries the highest information density.
- Remove qualifiers: "I believe," "I think," "hopefully," "it seems." Status updates are factual. Hedging language undermines credibility and forces the reader to calibrate rather than act.
- Formatting choice: Use bold sparingly -- only for blocker descriptions and section headers. Underlining and italics are noise in this format. Bullet depth should not exceed one level (no sub-bullets within sub-bullets).

### Step 8: Final Review Pass -- The Reader's Chair Test

Before delivering the output, read the entire update as the intended audience member, not the author.

- Would the reader know, from the Completed section alone, whether this person/team is on track?
- Would the reader know exactly what to do about each blocker, and by when?
- Is every date in the Upcoming section a real calendar date -- not a relative reference like "next week" or "end of month"?
- Is any item potentially surprising or alarming to the reader? If so, is there enough context so it does not seem worse than it is?
- Does any completed item require follow-up from the reader? If so, is that ask explicit in the text?
- Would a reader with no prior context understand the update in 90 seconds? If not, simplify one more pass.

---

## Output Format

Use this structure precisely. Section headers may be adapted to organizational terminology (e.g., "Wins" instead of "Completed," "Next Up" instead of "Upcoming") only if the user requests it.

```
## Status Update: [Project / Team / Initiative Name]

**Reporting Period:** [Start Date] -- [End Date]  
**Author:** [Name], [Role]  
**Audience:** [Manager name / Team name / Distribution list]  
**Sprint / Iteration:** [Number, if applicable]

---

### Completed

- [Result noun phrase] -- [quantified detail or artifact name]
- [Result noun phrase] -- [quantified detail or artifact name]
- [Result noun phrase] -- [quantified detail or artifact name]

### In Progress

- [Work item] -- [% complete or stage], expected [specific date]
- [Work item] -- [% complete or stage], expected [specific date]

### Upcoming (Next Period)

- [Work item] -- starting [date], owner: [name if not author]
- [Work item] -- starting [date], estimated [duration]

### Blockers & Risks

- **[Blocked deliverable]** -- Needs [specific action] from [Name, Role] by [date].  
  Impact: [what slips and by how long if unresolved]
- **[Risk description]** -- [Probability: low/med/high]. Mitigation: [current action].

*No blockers this period.* [Use this line if the section is empty -- never omit the section header]

### Key Metrics

| Metric | This Period | Prior Period | Target | Trend |
|--------|------------|-------------|--------|-------|
| [Metric name] | [value] | [value] | [value] | ↑ / ↓ / → |
| [Metric name] | [value] | [value] | [value] | ↑ / ↓ / → |

**[If any metric is off-target]:** [Explanation and recovery action in one sentence]

---

*Next update: [date]. Questions? [Preferred contact method]*
```

---

## Rules

1. **Write results, not activities -- always.** "Worked on the migration" is never acceptable. "Completed schema migration for user table -- zero downtime, deployed to prod Jan 9" is correct. Reject every instance of "worked on," "started looking at," "continuing to," or "made progress on" in the Completed section. These phrases mean the work is not finished and belong in In Progress.

2. **Never omit the Blockers section even if empty.** Omitting it forces readers to wonder if blockers were forgotten or if there truly are none. Write "No blockers this period" explicitly. This is also a record for future reference -- a series of "no blockers" updates followed by a missed deadline is a credibility problem.

3. **Every blocker must name a specific human being, not a team or system.** "Waiting on DevOps" is unactionable. "Waiting on Marcus Reid (DevOps lead) to grant staging environment access" is actionable. Teams do not act -- people do. Use first and last name or role if name is unknown.

4. **Never use relative dates.** "Next Tuesday," "end of the week," "soon," and "in two weeks" are all invalid in a status update. Every date must be a calendar date: "Jan 14," "March 3," "Feb 28." Relative dates become meaningless within 48 hours of the update being read.

5. **Do not pad empty periods with process theater.** If nothing was completed (due to a holiday, all-hands, or upstream dependency), state it honestly in one sentence. Do not list administrative tasks like "attended sprint planning" or "synced with stakeholders" as completed items. These are not deliverables.

6. **Cap the update at 350 words for peer/manager audiences.** Longer updates signal poor prioritization judgment. If the user has too much content, help them group items (see Edge Cases). A reader who sees a 600-word status update will skim it -- and probably miss the blocker.

7. **Never express uncertainty with hedging language.** Replace "I think this should be done by Friday" with "Target: Friday Jan 10 -- at risk if [condition]." Replace "hopefully we can resolve this soon" with "Resolution needed by Jan 12 to avoid [impact]." Uncertainty is expressed through risk labels, not soft language.

8. **Metrics require a comparator column.** A single-column metric table (only current values) is worse than no table, because it implies the reader should know the baseline when they may not. Always include prior period, target, or both. If data is unavailable for comparison, state "baseline TBD" rather than leaving it blank.

9. **For recurring updates, explicitly close out last period's forecasts.** If the prior update promised "X will be complete by Jan 8" and it was not completed, the new update must acknowledge this: "X now expected Jan 14 -- delayed by [reason]." Silently re-listing the same forecast with a new date erodes trust rapidly.

10. **Match specificity to audience technical level.** An engineering update to other engineers can say "refactored the N+1 query on the orders index, reduced DB calls by 87%." The same update sent to a VP of Operations should read "Fixed database performance issue -- page load time reduced by 40% for order history." Both are honest. One is interpretable by the intended reader.

11. **In Progress items must have a specific completion date, not a range.** "Expected Jan 13-17" is a range, not a commitment. Pick the realistic end date of the range and call it the target. If a single date cannot be estimated, the work item needs to be broken down further before it belongs in the update.

12. **The lead bullet in each section carries the most strategic weight.** Readers often read only the first item of each section. Put the highest-stakes deliverable, most important in-progress item, and most critical blocker first. Alphabetical or chronological ordering is only appropriate if all items are truly equal priority -- which is almost never true.

---

## Edge Cases

### Nothing Significant Was Completed This Period

Do not fabricate completions or pad with trivial tasks. This happens legitimately -- a long-cycle deliverable is in flight, a holiday fell mid-sprint, or a blocker consumed the entire period.

- In the Completed section, write: "No completions this period -- [reason in one clause]." Example: "No completions this period -- infrastructure migration blocked by access provisioning delay (see Blockers)."
- Move the substantive In Progress items front and center with realistic expected dates.
- If the blocker is what prevented completion, the blocker entry should be written with urgency: include the number of days it has been active and escalation status.
- Do not apologize in the update. Present facts and recovery action. Apology language triggers defensiveness and makes the update about feelings rather than work.

### Too Many Items Across All Sections

A user on a large team or managing multiple streams may have 10+ legitimate completions and 8 in-progress items. This is a prioritization problem, not a writing problem.

- Apply the materiality test ruthlessly: would the audience make a decision or take an action differently because of this item? If no, cut it.
- Group tightly related items into a single compound bullet: "Completed sprint 14 bug backlog (7 issues) -- P1 auth crash, P1 payment timeout, and 5 P2 UI regressions. Full list in JIRA sprint report."
- Link to a detailed document (Notion, Confluence, JIRA board, Google Doc) for exhaustive lists. The status update is the summary layer; the linked document is the detail layer. Never try to make a status update do both jobs.
- If the user manages multiple separate projects, create separate mini-updates with project headers rather than interleaving items. Readers track by project, not by category.

### All Bad News -- Missed Deadlines, Stalled Work, Escalated Risks

Status updates written entirely in red are uncomfortable to write but essential for organizational trust. Burying bad news is a career-ending habit.

- Lead with the most actionable item -- the one that, if resolved in the next 24 hours, would have the most positive effect.
- Provide a revised forecast with a brief causal explanation. Not an excuse -- a cause. "API delivery pushed from Jan 10 to Jan 17 -- additional test environments needed for load testing, now provisioned."
- Name what you are doing to recover. "Revised timeline assumes [condition X]. If [condition X] is not met by [date], escalation to [person] will be triggered."
- Never write "we tried our best" or equivalent. It is not relevant to the reader. Write what is true: what happened, what the new plan is, what you need.
- If multiple commitments are slipping simultaneously, flag this explicitly as a pattern: "Three items slipping this week due to shared dependency on [person/system]. Recommend [structural change] to prevent recurrence."

### Multi-Project or Multi-Team Updates

Leads, directors, and program managers often need to report on behalf of multiple work streams in a single update.

- Use a project or team header as the organizing unit, not the section type. Restructure the format as follows: Project A header with its own Completed/In Progress/Blockers mini-section, then Project B with the same.
- Alternatively, if the update is being rolled up from individual team member updates, use team member names as sub-organizers within each section, but only if the reader cares about individual attribution.
- Always include a "Summary" section at the top of a multi-project update: two to three sentences capturing the overall health across all streams (on track, at risk, off track), and the one thing that needs the reader's attention immediately.
- Keep each project's section to 100 words maximum. If all projects combined exceed 500 words, something needs to be cut or linked out.

### Recurring Updates Where Last Period's Forecasts Did Not Materialize

This is one of the most common real-world scenarios and one of the least well-handled. When the user promised deliverables in a prior update and they did not ship, the new update must address this directly.

- Add a "Changes From Last Period" subsection between the header block and the Completed section. List each slipped item with its original forecast date, the new date, and a one-clause reason.
- Format: "[Item name] -- originally forecast [date], now expected [new date]. Reason: [single cause]."
- Do not bury slippage inside the In Progress section without acknowledgment. Readers who remember the prior forecast will notice, and silent re-dating looks like an attempt to obscure the miss.
- If an item has slipped more than twice, escalate it explicitly: "This item has slipped [N] times. Recommend [decision: reduce scope / add resource / defer / cancel]."

### Non-Technical Audiences Receiving Technical Updates

Engineers writing updates for product managers, finance partners, or business stakeholders must translate without condescending and without losing accuracy.

- Identify every technical noun in the draft and ask: "Would a non-technical reader know what this is and why it matters?" If not, replace or explain inline.
- Lead with the business outcome, follow with the technical mechanism as a subordinate clause. "Reduced customer checkout failures by 34% -- caused by fixing a race condition in the payment processing queue."
- Avoid technical acronyms unless they have been established in previous communication with this audience. DORA, ORM, CI/CD, and p95 are meaningless to most business stakeholders.
- Metrics should be expressed in business terms: not "reduced p95 response time from 2.3s to 0.4s" but "pages now load 5x faster for users on mobile -- affects 62% of our traffic."
- When describing blockers to non-technical readers, focus on the business consequence: "Until data access is granted, we cannot validate whether the new feature is being used -- this delays the go/no-go decision for the full rollout."

### Updates for Asynchronous Global Teams With No Fixed "Period"

Some teams work across time zones with no shared standup, no fixed sprint, and asynchronous-first communication. "Weekly" has no single meaning.

- Anchor the update to a fixed calendar anchor regardless of work pattern: "Update through end of day [timezone] on [date]."
- Distinguish between "completed since last update" and "completed this calendar week" -- they are different for someone who posts updates every three days.
- For high-frequency async updates (every 2-3 days), shorten the format to Completed / In Progress / Blockers only, with no metrics table and a 150-word cap.
- Label each update with an explicit version or sequence number ("Update #14, Jan 9") so team members can reference prior updates in discussions.

---

## Example

**User Input:** "I'm a backend engineer on a platform team. I need to write my weekly status update. This week I finished the rate limiting middleware, which involved a lot of complex token bucket logic -- it's now live in production. I also fixed a nasty bug in the webhook retry system that was causing duplicate events for about 3% of webhooks. I started the Kafka consumer refactor but I'm only about 30% through. Next week I'm planning to finish the Kafka work and then start the database connection pooling project. I'm blocked because I need read access to the production Datadog dashboards to validate the rate limiter's behavior in prod -- I've been waiting on the SRE team, specifically Omar Castillo, for 5 days and haven't heard back. The audience is my engineering manager, Priya."

---

**Output:**

## Status Update: Platform Engineering

**Reporting Period:** Jan 6 -- Jan 10, 2025
**Author:** [Name], Backend Engineer
**Audience:** Priya [Manager]

---

### Completed

- Rate limiting middleware live in production -- token bucket algorithm implemented, handling [N] req/sec across 3 API gateways, no incidents in 72 hours post-deploy
- Webhook duplicate delivery bug resolved -- root cause was a missing idempotency check on retry backoff; duplicate event rate reduced from 3% to 0% (verified over 48-hour window)

### In Progress

- Kafka consumer refactor -- 30% complete, targeting Jan 17. Blocking work: consumer group rebalancing logic and dead-letter queue configuration remaining.

### Upcoming

- Database connection pooling project -- scoped and ready to begin Jan 20 after Kafka refactor ships; initial estimate 8 days

### Blockers

- **Rate limiter production validation blocked** -- Need read access to production Datadog dashboards. Omar Castillo (SRE Lead) to provision access. Request submitted Jan 6 -- now 5 days without response. Impact: cannot confirm rate limiter is operating within design thresholds until this is resolved; escalation recommended if no response by Jan 13.

*No risks beyond the above blocker.*

### Key Metrics

| Metric | This Week | Prior Week | Target | Trend |
|--------|----------|-----------|--------|-------|
| Webhook duplicate rate | 0% | 3.0% | 0% | ↑ |
| Production incidents (P1/P2) | 0 | 1 | 0 | ↑ |
| Kafka refactor completion | 30% | 0% | 100% by Jan 17 | → |

---

*Next update: Jan 17. Reach out via Slack (#platform-eng) for questions.*

---

**Why this output is correct:**

- "Rate limiting middleware" is described by its production outcome (live, no incidents) -- not by the complexity of the token bucket logic, which is irrelevant to the manager
- The webhook bug uses result language: "reduced from 3% to 0% (verified over 48-hour window)" -- not "fixed the bug"
- The Kafka item is correctly placed in In Progress with a percentage and a specific calendar date, plus what remains
- The blocker names Omar Castillo specifically, includes the elapsed days (5), states the impact, and recommends an escalation action with a trigger date -- giving Priya everything she needs to act
- The metrics table shows trend direction and uses a comparator column (Prior Week) so numbers have context
- Total word count: approximately 220 words -- well within the 250-word target for a manager audience
- No hedging language appears anywhere in the document
- Tense is consistent: past tense for Completed, present progressive for In Progress, future for Upcoming
