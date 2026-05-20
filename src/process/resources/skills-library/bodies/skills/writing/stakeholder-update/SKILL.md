---
name: stakeholder-update
description: |
  Writes executive-level stakeholder updates that translate project progress
  into business impact, surface decisions needed, and manage expectations for
  senior leadership audiences. Use when the user needs to update executives,
  board members, or cross-functional leadership on project or initiative status.
  Do NOT use for team-level status updates (use `status-update`), full business
  reports (use `business-report`), or board narratives (use `board-update-narrative`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "writing business-writing report"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Stakeholder Update

## When to Use

Use this skill when the user needs to communicate project or initiative status to senior leadership audiences -- executives, steering committees, C-suite sponsors, cross-functional leadership councils, or investment review boards. The defining characteristic of this audience is that they allocate capital and make priority decisions; they do not manage daily work.

**Use this skill when:**
- A project manager, program lead, or business owner needs to update a steering committee, executive sponsor, or C-suite stakeholder (CEO, CFO, COO, CTO, CMO) on initiative status
- A user needs to translate technical or operational progress into strategic business language for a senior audience that does not participate in day-to-day execution
- A user needs to surface a decision, escalation, or resource request that requires executive authority to resolve -- and needs to frame it persuasively with clear options and recommendations
- A user needs to change the status signal (Green to Yellow, Yellow to Red) and must communicate the change with credibility, root cause, and a recovery path
- A user is writing a sponsor briefing, executive dashboard narrative, investment review update, or steering committee packet
- A user needs to manage expectations proactively -- communicating a risk before it becomes an issue, or adjusting a forecast before a deadline passes
- An initiative is at a critical inflection point (go/no-go decision, phase gate, funding renewal) that requires executive alignment before proceeding

**Do NOT use this skill when:**
- The audience is the delivery team itself -- use `status-update` for team-level weekly status with task-level detail, sprint summaries, and operational blockers
- The user wants deep analytical content with supporting data, trend analysis, and appendices spanning multiple pages -- use `business-report` instead
- The communication target is a board of directors, investor group, or fiduciary body with governance obligations -- use `board-update-narrative` which handles fiduciary framing, forward-looking statement conventions, and governance risk language
- The user needs to document what was discussed or decided after a meeting has occurred -- use `meeting-notes`
- The user is writing an announcement or change communication to a broad employee audience -- use `change-communication`
- The user needs to make a formal business case requesting new funding from scratch -- use `business-case`

---

## Process

### Step 1 -- Gather Structured Input Before Writing Anything

Do not begin drafting until you have collected enough information to avoid generic filler. Ask the user for the following; if they provide partial information, ask targeted follow-up questions rather than making things up.

- **Initiative name and strategic purpose:** What problem does this initiative solve, and which organizational objective is it tied to? (Revenue growth, cost reduction, regulatory compliance, customer experience, operational efficiency)
- **Audience profile:** Who will read this update? Name the specific roles (e.g., CFO, Chief Revenue Officer, Steering Committee Chair). What does this audience care most about -- budget, timeline, customer impact, risk exposure, headcount implications?
- **Reporting period:** Exact date range (e.g., "March 3-14, 2026" not "this sprint")
- **Current status signal:** On track (Green), at risk (Yellow), or off track (Red) -- and the one-sentence reason
- **Status change:** Has the signal changed since the last update? If so, why?
- **Accomplishments:** What was completed or materially advanced this period? Ask for business milestones, not task lists
- **Upcoming milestones:** Next 3-6 weeks, with target dates and current confidence levels
- **Budget:** Total approved budget, amount spent to date, percentage consumed vs. percentage of work complete (these two numbers tell the real story)
- **Timeline:** Original go-live or completion date vs. current forecast. If slipped, by how much and why
- **Risks and issues:** Active risks with business impact, current mitigation actions, and owners
- **Decisions needed:** Any item requiring executive authority -- approval, priority call, resource allocation, scope change, exception to policy

If the user cannot provide budget numbers, timeline variance, or quantified impact, probe for approximations. "Roughly $50K under budget" is better than omitting the line entirely. Blanks in an executive update signal poor project controls.

### Step 2 -- Analyze the Status Signal and Set the Narrative Spine

Before writing, determine the dominant story this update tells. Every good executive update has a single organizing narrative, not a list of disconnected facts.

- **If Green (on track):** The narrative is confidence and momentum. Lead with what is going well, connect it to the strategic goal, and note what comes next. Flag any watch items early so the Green rating feels credible, not complacent.
- **If Yellow (at risk):** The narrative is early warning and controlled response. Executives must understand: what is the specific risk, what is the magnitude of impact (weeks delayed, dollars at risk, scope reduced), and what concrete actions are underway. Yellow updates that lack a mitigation plan lose stakeholder confidence fast.
- **If Red (off track):** The narrative is candor and path to resolution. Do not soften Red. State the variance clearly: "Go-live is now June 30, 8 weeks later than the March 31 plan." Present the root cause without blame-shifting. Present recovery options with trade-offs (scope reduction, budget increase, timeline extension), and make a recommendation. Executives who learn about Red status after the fact trust the team far less than those informed proactively.
- **If status improved (Yellow to Green):** Explain what changed. Unearned status improvements erode credibility. Name the specific action that resolved the risk.

The narrative spine drives every word choice. If the spine is "Yellow -- data quality risk with tooling solution pending approval," every section reinforces that story.

### Step 3 -- Translate Everything Into Business Language

This is the highest-leverage skill in executive communication. Apply the following translation rules systematically before writing a single bullet:

- **Task completion → business milestone:** "Completed API integration" → "Order management system now receives real-time inventory data, eliminating the manual reconciliation that caused 2-day order delays"
- **Percentages without anchors → anchored progress:** "60% done" → "4 of 6 regional deployments complete; remaining 2 cover the highest-volume markets (45% of total transaction volume)"
- **Technical risk → business impact:** "Database replication lag" → "Order status updates delayed up to 4 hours, affecting customer service call volume"
- **Effort metrics → outcome metrics:** "200 hours of developer time invested" → "Checkout redesign shipped; expected to recover $180K/month in abandoned cart revenue based on current cart abandonment rate"
- **Internal jargon → plain language:** "UAT signed off by BAs" → "Business teams confirmed the system handles real-world scenarios accurately before launch"

If the user cannot quantify business impact, use directional framing: "reduces manual processing time significantly," "expected to improve first-contact resolution rates," or "eliminates the primary cause of customer complaints in [category]." Estimates with stated assumptions are more credible than vague claims.

### Step 4 -- Structure the Decisions Section With Decision-Ready Framing

Decisions are the most important section of any stakeholder update. They are also the most poorly written. Apply these techniques:

- **Frame the decision as a question the executive must answer,** not as a problem the team has: "Should we approve a $20K tool investment to recover the 2-week schedule delay, or accept the extended timeline?" is better than "We have a data quality problem."
- **Always provide 2-3 options with explicit trade-offs,** not just a single request. Even if the recommendation is obvious, presenting options signals analytical rigor and respects the executive's authority to choose differently.
- **State your recommendation explicitly** and explain the reasoning in 1-2 sentences. Executives who must guess the team's recommendation lose time and trust.
- **Include a decision deadline with impact of delay.** "Decision needed by March 7. Each week of delay pushes go-live by one week due to vendor lead time." This is not pressure -- it is the information the executive needs to prioritize.
- **Separate decisions from FYI disclosures.** If the executive does not need to act, it is not a decision. Mislabeling items as decisions trains executives to ignore the decisions section.

### Step 5 -- Build the Progress, Milestone, and Risk Sections

Apply a consistent standard across these three sections:

**Progress bullets:**
- Maximum 3-5 bullets per update -- if there are more than 5 things worth reporting, the team is likely conflating tasks with milestones
- Each bullet names the milestone, states what it means for the business, and optionally quantifies the impact
- Sequence bullets from most strategically significant to least
- If a milestone slipped, report it here with the new target date -- do not omit slipped items

**Upcoming milestones table:**
- List only the next 4-6 meaningful milestones, not every task
- Include a confidence signal (On track / At risk / Dependent on decision) for each
- Dependencies column is critical -- executives use this to understand their own role in unblocking progress
- Do not list milestones more than 8 weeks out unless they are critical-path anchors (go-live, regulatory deadline, contract date)

**Risks and issues:**
- Distinguish between risks (have not materialized yet) and issues (actively impacting the project)
- Every risk needs a business impact statement in terms of time, money, scope, or customer experience
- Every risk needs a named mitigation action and a named owner -- not "the team is monitoring this"
- Risks rated High (likely to occur AND significant impact) should appear first
- A risk section with only risks and no mitigations signals a team that has identified problems but not responded to them

### Step 6 -- Write the Budget and Timeline Section With Earned Value Intuition

Budget and timeline are the two metrics executives trust most because they are hard to spin. Write them with precision and context:

- **Budget burn rate:** Report both the percentage of budget consumed AND the percentage of work complete. If 80% of budget is spent but only 60% of work is done, the project is trending toward overrun -- say so explicitly and state the projected overrun amount
- **Forecast at completion (FAC):** If there is a meaningful variance from plan, always include the projected final cost, not just current spend. "At current burn rate, projected final cost is $210K vs. $180K approved budget"
- **Schedule variance in concrete terms:** "2 weeks behind plan" is acceptable. Better: "Go-live was April 1; current forecast is April 15. The 2-week slip occurred because [specific reason]"
- **Budget consumed vs. contingency remaining:** If the project had a contingency allocation (typically 10-15% of total project budget), state how much contingency remains. Executives use contingency to assess how much additional shock the project can absorb
- **If budget and timeline are on track,** say so directly: "Budget and schedule on track. No variances to report." Do not inflate this section with filler language

### Step 7 -- Apply Executive Formatting and Length Discipline

Format decisions are not aesthetic -- they determine whether the update is read or skimmed past. Apply these formatting rules:

- **Total word count for the main body:** 300-450 words. If the update exceeds 500 words, find what to cut or move to an appendix
- **Status signal must appear in the first 2 lines** -- never buried in paragraph 3
- **Use tables for decisions, milestones, and risks** -- executives scan horizontally, not linearly. Tables make comparison and priority obvious
- **Bold only the most critical numbers and status words** -- bolding everything is the same as bolding nothing
- **Use a consistent template across every update** -- executives develop pattern recognition. A consistent format means less cognitive load and faster absorption
- **Appendix:** For updates where technical stakeholders will also read the document, offer a brief appendix with detail-level information that does not belong in the executive summary but should be accessible
- **Subject line / title convention:** "YELLOW -- CRM Migration Update -- Week of March 3" tells the reader the status signal before they open the document

### Step 8 -- Review Against the Executive Test

Before finalizing, apply this four-question review:

1. **Status clear in 10 seconds?** Read only the first two lines and the section headers. Does someone reading only those lines understand the overall health and what action is needed? If not, restructure.
2. **Every risk has a mitigation?** Scan the risks table. If any row has a blank mitigation field, go back and either fill it or note "Mitigation being developed; owner [name] will present options by [date]."
3. **Business language throughout?** Search the draft for any technical terms, tool names, or internal acronyms that would not be understood by a CFO or Chief of Staff. Translate them.
4. **Decisions section is unambiguous?** Read only the decisions section. Could an executive make the decision based solely on what is written, without asking a follow-up question? If not, add the missing context.

---

## Output Format

```
## Stakeholder Update: [Initiative Name]

**Period:** [Month Day -- Month Day, Year]
**Overall status:** [GREEN / YELLOW / RED] -- [One sentence: what this status means and why]
**Author:** [Name, Title]
**Next update:** [Date]

---

### Decisions Needed

| # | Decision | Options | Recommendation | Deadline | Impact of Delay |
|---|----------|---------|---------------|----------|----------------|
| 1 | [Crisp question requiring executive authority] | A: [Option A with cost/impact] / B: [Option B with cost/impact] | [Recommended option + 1-sentence rationale] | [Date] | [Specific consequence per week of delay] |

*If no decisions required this period: "No decisions needed this period."*

---

### Status Summary

[2-4 sentences. Lead with the status signal rationale. State what is driving this rating -- specific accomplishment or specific risk. Note any status change from last period and explain why. Connect the initiative's current position to its strategic objective.]

---

### Progress This Period

- **[Business Milestone 1]:** [What was completed, in business terms. Include quantified impact if available. One to two sentences maximum.]
- **[Business Milestone 2]:** [Same structure. What changed, what it means for the business.]
- **[Business Milestone 3]:** [Same structure. If this was a partial completion, state the percentage and what remains.]

*Maximum 5 bullets. If there are fewer than 3 milestones to report, note why (e.g., planning phase, blocked on dependency).*

---

### Upcoming Milestones

| Milestone | Target Date | Confidence | Key Dependency |
|-----------|-------------|-----------|---------------|
| [Milestone name in business language] | [Date] | On track / At risk / Blocked | [What this depends on -- decision, vendor, another team] |
| [Milestone name] | [Date] | On track / At risk / Blocked | [Dependency] |
| [Milestone name] | [Date] | On track / At risk / Blocked | [Dependency] |

---

### Risks and Issues

| # | Risk / Issue | Type | Business Impact | Mitigation Action | Owner | Target Resolution |
|---|-------------|------|----------------|------------------|-------|------------------|
| 1 | [Specific risk statement] | Risk / Issue | [Impact in time, money, scope, or customer terms] | [Specific action underway] | [Named person] | [Date] |
| 2 | [Specific risk statement] | Risk / Issue | [Impact] | [Mitigation] | [Owner] | [Date] |

*Risks are listed highest-impact first. If no active risks: "No material risks this period."*

---

### Budget and Timeline

**Budget:** $[spent] of $[total approved] ([X]% consumed | [Y]% of work complete)
**Forecast at completion:** $[FAC] ([on track / $X over / $X under] vs. approved budget)
**Contingency remaining:** $[amount] of $[original contingency]

**Timeline:** [Original target date] → [Current forecast date] ([on track / X weeks ahead / X weeks behind])
**Variance cause:** [If behind: specific root cause in one sentence. If on track: "No variance."]
**Recovery plan:** [If behind: specific actions with dates. If on track: "N/A."]

---

### Appendix (optional -- include only if technical stakeholders are also recipients)

[Detailed technical information, supporting data, full risk register, staffing details, or vendor status that supplements but does not replace the executive summary above. This section is explicitly optional and should be referenced but not required for the main update.]
```

---

## Rules

1. **Never report task-level metrics to executives.** Ticket counts, story points, lines of code, test case completion percentages -- none of these belong in a stakeholder update. Every data point must answer the question "what does this mean for the business?" If it cannot, cut it.

2. **Never bury a decision in the body of the update.** Decisions must appear in the Decisions Needed section, at the top, before any progress reporting. An executive who must hunt for the action item will often miss it entirely, causing delays that the project team then absorbs.

3. **Never soften a Red or Yellow status with reassuring language in the same sentence.** Phrases like "We are Yellow but the team is confident we'll recover" undermine the signal. State the status, state the facts, then state the recovery plan in the appropriate section. Trust the reader to see the full picture.

4. **Never report a status change without explaining exactly what changed.** If the project moves from Green to Yellow, the update must name the specific event or discovery that caused the change, when it was identified, and what has changed in the assessment since last period. Unexplained status changes destroy stakeholder trust.

5. **Never use passive voice to obscure ownership of risks or issues.** "Data quality issues have been identified" assigns no accountability. "The Enterprise data migration team identified data integrity errors in 23% of legacy records on March 5" is precise, factual, and actionable. Name the who, what, and when.

6. **Always include the forecast at completion (FAC) when there is any budget variance greater than 5%.** Reporting current spend without projecting the final cost is one of the most common ways teams mislead executive audiences. The FAC is the number executives need to make resource decisions.

7. **Always separate decisions from FYI content.** If the executive does not need to take an action or make a choice, it belongs in the Progress or Risks section, not the Decisions section. A Decisions section that contains information items trains executives to ignore it.

8. **Always quantify "at risk" timeline statements with specific numbers.** "We may be delayed" is not an executive-grade communication. "Current forecast shows a 3-week delay, moving go-live from April 1 to April 22, contingent on vendor delivery by March 15" is. Precision signals control; vagueness signals uncertainty about the situation.

9. **Always ensure every risk has a named owner and an active mitigation action.** A risk with no owner is a risk with no accountability. A risk with no mitigation is a problem the team has not responded to. Either of these signals poor project governance to a senior audience.

10. **Always maintain update cadence even when there is nothing to report.** A brief update stating "No material progress this period due to [blocked on vendor contract finalization]. Update resumes [date]. Budget and timeline remain on track." is far better than silence. Missing updates create anxiety and force executives to seek status informally -- which is a waste of their time and signals project health problems.

11. **Never write in a style that requires the reader to have read the previous update.** Each update must be independently intelligible. A new steering committee member joining mid-project, or an executive who skipped two updates, must be able to understand the current situation from this document alone. Include a one-sentence project context line if there is any doubt.

12. **Always match the tone of the status signal.** A Red update written in a positive, marketing-style voice is confusing and loses credibility. A Green update written in a defensive, hedging voice signals hidden anxiety. The tone should match the factual reality that the status signal represents.

---

## Edge Cases

### The project is significantly behind schedule (more than 20% of total timeline)

Do not trickle bad news across multiple updates by moving the date a week at a time. Present the full current forecast at once, even if it is painful. Structure the Red update as follows: (1) state the current forecast vs. original plan with specific dates, (2) identify the root cause with a factual, non-blame-shifting explanation, (3) present 2-3 recovery options with their trade-offs (e.g., Option 1: reduce scope to hit original date; Option 2: maintain scope and accept new date; Option 3: add $X resources to partially compress timeline), (4) make a recommendation with rationale, and (5) request a decision with a deadline. Executives who receive a Red update with a clear analysis and a recommended path forward respond constructively. Executives who receive a Red update with only a problem description escalate, assign blame, and lose confidence in the team.

### No meaningful progress to report this period

This happens during waiting periods -- vendor negotiations, regulatory reviews, organizational changes, or holiday breaks. Write the update anyway. State directly: "No material progress this period. The project is in [hold / waiting on vendor response / regulatory review]. Budget and timeline remain on track. Next substantive update expected [date] following [event]." Then use the update to confirm that risks and mitigation plans have not changed. An "all quiet" confirmation from a disciplined team is reassuring; silence is not.

### Multiple stakeholders with conflicting priorities and different information needs

When a single update goes to a steering committee where the CFO cares about budget, the CRO cares about customer impact, and the CTO cares about technical debt introduced by the project, write a single master update and include 1-2 stakeholder-specific callouts in the Status Summary section. Example: "Note for Finance: The budget variance analysis is detailed in the Budget and Timeline section. Note for Product and Commercial: The customer-facing capability launch is on track for the date communicated to the sales team." This technique acknowledges different interests without fragmenting the document into multiple versions.

### The project has good news and bad news simultaneously

A common mistake is burying bad news between positive bullets to soften the impact -- the "compliment sandwich" approach. Executive audiences see through this immediately, and it damages credibility. Instead, let the Green/Yellow/Red status signal do the framing work. A Yellow update can contain genuine accomplishments alongside a material risk. Present accomplishments as accomplishments and risks as risks, in their respective sections, without editorializing. "Training materials completed ahead of schedule" and "Data migration 2 weeks behind" can coexist in the same factual update without contradiction. The status signal tells the overall story.

### The executive audience is newly assigned (new sponsor, new steering committee member)

Add a "Project Context" callout box at the top of the first update sent to a new audience. It should contain 4 elements: (1) the strategic objective this initiative serves and how it was approved, (2) the total approved investment and timeline, (3) the current phase of delivery (planning, build, test, rollout), and (4) a link to the project charter or prior update if available. This callout does not replace the standard format -- it precedes it. Remove it from subsequent updates once the stakeholder is oriented.

### A decision has been outstanding for multiple periods without a response

When a decision requested in a prior update has not been received, re-surface it -- do not silently carry it forward in the tracker. In the current Decisions Needed section, add a note in bold: "PENDING FROM [prior date]." Add a specific statement of business impact: "This decision has now been pending for 3 weeks. Each additional week without a decision delays go-live by 1 week and increases contractor costs by approximately $8,000." Then send a direct message to the executive's Chief of Staff in parallel. Stakeholder update documents are not a substitute for direct communication when a decision is time-critical.

### The initiative is being considered for cancellation or significant descoping

This is a high-stakes communication requiring careful framing. Do not use the standard stakeholder update format alone -- pair it with a decision memo (use `business-case` for the memo). In the update itself, surface the decision prominently: "This period's update includes a decision request about the future scope and investment for this initiative." Present the options with full transparency: continue as planned, descope to core MVP, pause and reassess in [timeframe], or cancel with [sunk cost] and [wind-down cost] implications. Include the business value already realized and at risk. Recommend a path. Do not advocate emotionally for continuation if the data does not support it -- an executive team that receives honest analysis trusts the team more, even if they cancel the project.

---

## Example

**User input:** "I need a stakeholder update for our Customer Data Platform (CDP) implementation. We're rolling it out to the marketing and analytics teams. We're in the third month of a six-month project. Timeline is on track but we're burning budget faster than planned -- we've spent $420K of our $600K budget but are only 45% through the work. We need the CMO to decide whether to reduce scope or approve an additional $80K before we hit the ceiling. The main risk is a data governance sign-off that's waiting on Legal -- it's been 3 weeks and it's blocking the audience segmentation module. The integration with our ad platforms went live last week and is already showing results."

---

**Output:**

## Stakeholder Update: Customer Data Platform (CDP) Implementation

**Period:** March 3-14, 2026
**Overall status:** YELLOW -- Budget burn rate is outpacing work completion; a decision is needed now to prevent a funding shortfall in week 10.
**Author:** Priya Mehta, Program Director, Marketing Technology
**Next update:** March 28, 2026

---

### Decisions Needed

| # | Decision | Options | Recommendation | Deadline | Impact of Delay |
|---|----------|---------|---------------|----------|----------------|
| 1 | Address budget gap: the project is tracking $80K over the approved $600K budget at current burn rate | A: Approve $80K supplemental budget (keeps full scope, on-time delivery) / B: Reduce scope by deferring real-time predictive segmentation module to Phase 2 (saves ~$75K, no additional approval needed) / C: Pause project at end of month to rebaseline (incurs $30K in standby costs, delays go-live 6-8 weeks) | Option A -- the ad platform integration is already returning measurable ROAS improvement; abandoning predictive segmentation removes the highest-ROI module and undermines the business case for the full investment | March 21 | Without a decision by March 21, development on the audience segmentation module must pause to avoid exceeding the current budget authority, creating a minimum 2-week delay regardless of which option is chosen |

---

### Status Summary

The CDP implementation is YELLOW this period due to a budget pacing issue that requires a decision before end of March. The project is three months into a six-month plan and is on schedule -- all technical workstreams are progressing on target. However, higher-than-estimated vendor professional services fees and an additional data engineering resource added in month two have accelerated budget consumption beyond the planned rate. A decision on budget or scope is needed within the next two weeks to maintain momentum. Separately, a data governance sign-off from Legal has been pending for 3 weeks and is now on the critical path for the audience segmentation module launch.

---

### Progress This Period

- **Ad platform integration live and delivering results:** The CDP is now feeding real-time audience data into Google Ads, Meta, and LinkedIn. Early performance data (7 days of live traffic) shows a 14% improvement in cost-per-acquisition on retargeting campaigns against the same audience sets run last quarter. Marketing team estimates this will recover approximately $35K/month in media waste if sustained.
- **Marketing team onboarding complete for 40 of 60 users:** The first two cohorts of marketing analysts completed platform training with a 94% assessment pass rate. The remaining 20 users (analytics team) are scheduled for the March 24 session.
- **Data pipeline for all first-party sources connected:** Website, CRM, and point-of-sale data streams are now fully connected and refreshing in real time. Data quality validation completed with zero critical errors across 18 million customer records.

---

### Upcoming Milestones

| Milestone | Target Date | Confidence | Key Dependency |
|-----------|-------------|-----------|---------------|
| Legal data governance sign-off | March 19 | At risk | Legal review (pending 3 weeks; escalation sent March 13) |
| Audience segmentation module: build complete | April 4 | At risk | Legal sign-off by March 19; budget decision by March 21 |
| Analytics team onboarding complete | March 28 | On track | None |
| Predictive lookalike audience models: live | April 25 | On track (if budget approved) / Deferred to Phase 2 (if scope reduced) | Audience segmentation module completion |
| Full platform go-live: all modules | May 9 | On track | All above milestones |

---

### Risks and Issues

| # | Risk / Issue | Type | Business Impact | Mitigation Action | Owner | Target Resolution |
|---|-------------|------|----------------|------------------|-------|------------------|
| 1 | Budget overrun: burning at $140K/month vs. $100K/month planned | Issue | Project will exceed $600K approved budget by approximately $80K if scope is unchanged | Decision requested from CMO (see above); development leads have identified $12K in vendor fee reductions already implemented this month | Priya Mehta | March 21 (decision deadline) |
| 2 | Legal data governance sign-off: 3 weeks pending | Issue | Audience segmentation module build cannot begin; each week of further delay compresses delivery buffer by 1 week | Formal escalation sent to General Counsel on March 13 requesting resolution by March 19; Legal cited resource constraints as the cause | James Okafor, Legal Liaison | March 19 |
| 3 | Analytics team adoption risk | Risk | Low utilization post-launch would reduce ROI realization; analytics team has historically been slow adopters of new tooling | Department champion (Senior Analyst, Taryn Willis) identified and embedded in implementation team; custom analytics workflow documentation in progress | Priya Mehta | April 25 (go-live) |

---

### Budget and Timeline

**Budget:** $420K of $600K spent (70% consumed | 45% of work complete)
**Forecast at completion:** $680K at current burn rate ($80K over approved budget)
**Contingency remaining:** $0 -- contingency was fully consumed in month two when data engineering scope was expanded to handle legacy CRM data complexity

**Timeline:** Original go-live May 9, 2026 → Current forecast May 9, 2026 (on track)
**Variance cause:** No schedule variance at this time. Budget and schedule are currently decoupled -- the team has maintained timeline by absorbing the additional vendor and engineering costs rather than reducing pace.
**Recovery plan (budget):** Three options presented in the Decisions Needed section above. Pending CMO decision by March 21.

---

### Appendix: Technical Detail for Technology Stakeholders

**Vendor fee variance root cause:** The Salesforce Data Cloud professional services estimate assumed 120 hours of implementation support. Actual hours consumed through month three are 195 hours, primarily due to undocumented schema complexity in the legacy CRM (Siebel) that required custom ETL mapping not scoped in the original SOW. The vendor has agreed to cap additional overage at 40 hours at no additional cost.

**Data governance review scope:** Legal is reviewing three items: (1) consent management configuration for EU customer records under GDPR Article 22 automated processing requirements, (2) data retention policy for behavioral event data (currently set to 24 months), and (3) third-party data sharing permissions for ad platform audience syncs. Items 1 and 3 are the critical-path items for the segmentation module; item 2 can be resolved post-launch.
