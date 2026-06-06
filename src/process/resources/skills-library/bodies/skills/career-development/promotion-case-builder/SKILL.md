---
name: promotion-case-builder
description: |
  Builds a written promotion case document with accomplishments and metrics, expanded
  scope evidence, peer and stakeholder impact, market rate context, and a clear ask.
  Produces a shareable document the user can present to their manager or leadership.
  Use when the user wants to make a case for promotion, prepare a promotion packet,
  or document their achievements to support a level-up request.
  Do NOT use for performance review self-assessments (use performance-review-prep),
  salary negotiation scripts (use salary-negotiation-script), or resume writing
  (use resume-bullet-writer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "career planning template writing"
  category: "career-development"
  subcategory: "career-growth"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Promotion Case Builder

## When to Use

Use this skill when the user explicitly wants to build a written, shareable document that makes the case for a promotion -- not when they want coaching, a conversation script, or general career advice.

**Trigger scenarios:**
- User says they want to prepare a promotion packet, promotion case, or promotion document to submit to their manager or a review committee
- User asks how to document their accomplishments to justify a level-up request at an upcoming review cycle
- User has already been informally told they are on the promotion track and needs to formalize the evidence
- User is preparing for a promotion calibration meeting where their manager will advocate for them to a committee and needs supporting material
- User wants to proactively build the case before a formal cycle opens so they are ready to submit immediately
- User was passed over for promotion in a previous cycle and wants to build a stronger, more structured case for the next one
- User's company requires a self-authored promotion packet as part of the formal process (common at senior IC and manager levels at tech companies, consulting firms, and financial services firms)
- User wants to document a pattern of operating above their current level to make the timing argument -- that the promotion is overdue, not aspirational

**Do NOT use when:**
- User wants to write a performance review self-assessment that will be submitted as part of an annual review cycle -- use `performance-review-prep` instead, which structures content around review rubrics rather than promotion criteria
- User wants a script, talking points, or coaching for an in-person promotion conversation -- use `salary-negotiation-script` for the compensation discussion component
- User needs help writing or rewriting resume bullets to reflect accomplishments -- use `resume-bullet-writer`, which applies action-verb and STAR formatting for a resume audience rather than an internal advocacy document
- User is asking whether they deserve a promotion or wants you to evaluate their readiness -- this skill builds the document, it does not render a verdict
- User is writing a nomination or recommendation for someone else's promotion -- this skill produces a first-person self-advocacy document
- User needs a 30-60-90 day plan for a role they are about to enter -- that is onboarding planning, not promotion case building

---

## Process

### Step 1: Gather Promotion Context Before Writing Anything

The quality of the promotion case depends entirely on understanding the organizational context. Ask all of these questions before drafting a single line of the document.

- **Current and target title and level:** Get the exact titles. "Senior" and "Staff" mean different things at different companies. If the company uses numeric levels (L4, L5, E5, Band 6), capture both the title and the level code because leveling guides are indexed to codes, not titles.
- **Time in current role:** This matters for two reasons -- it determines whether the case needs to address tenure concerns (under 12 months is a headwind; 12-24 months is standard; 36+ months may require addressing why the promotion has not happened yet), and it sets the evidence window.
- **Promotion process type:** Four common archetypes exist. (1) Formal cycle with committee calibration -- common at tech companies, banks, and consulting firms; the document will be read by people who do not know the user. (2) Manager-initiated with HR approval -- the document is for the manager to use as internal advocacy material. (3) Self-nomination with peer review packet -- the user submits directly; the document must stand alone. (4) Ad-hoc or conversation-based -- no formal process; the document becomes a leave-behind or a structured email attachment.
- **Leveling guide availability:** If the company publishes a career ladder or leveling framework, get the specific criteria for both the current and target level. The case must map evidence to those exact criteria, not to generic competencies. If no guide exists, ask the user what behaviors or expectations they have heard associated with the target level.
- **Manager's posture:** Supportive (manager is already advocating, needs ammunition), neutral (manager is open but unconvinced), or skeptical (manager has reservations or has given mixed signals). This determines framing -- skeptical managers require the case to preemptively address objections.
- **Known objections:** Ask the user directly: "Has your manager or anyone else raised any concerns about your readiness?" Common objections include tenure too short, scope too narrow, technical depth vs. breadth questions, or comparisons to peers. Each known objection must be addressed directly in the document.
- **Previous review cycle outcome:** If the user was passed over before, ask what feedback they received. The new case must show how they have addressed that specific feedback.

### Step 2: Build the Accomplishment Inventory

This is the evidentiary core of the document. Do not accept vague descriptions.

- Aim for 5-8 accomplishments. Fewer than 5 looks thin. More than 8 dilutes the strongest evidence and makes the document unwieldy for a busy reviewer.
- For each accomplishment, require four elements: (1) the action taken -- what specifically the user did, not the team, (2) the outcome -- what changed as a result, (3) the metric -- a number, percentage, time delta, or dollar figure, and (4) the level mapping -- which competency at the target level this evidence satisfies.
- Push hard on quantification. If the user says "I improved customer satisfaction," ask: By how many NPS points? What was the before and after CSAT score? How many customers were affected? What was the churn rate before vs. after? If the user truly cannot produce a number, use a scope-consequence framing: "Improved onboarding flow for 8,000 monthly new users, reducing the primary support escalation category by eliminating the top three friction points identified in user research."
- Sort accomplishments by impact magnitude, not chronologically. The most business-critical accomplishment goes first. If the user led a project that drove $500K in revenue, that is the anchor; if they also reduced a meeting time, that is not accomplishment #2.
- Distinguish between outputs (what was delivered) and outcomes (what changed because of the delivery). Committees and managers at calibration meetings care about outcomes. "Shipped the new search feature" is an output. "Shipped the new search feature that increased search-to-purchase conversion by 18%, contributing $1.2M in incremental quarterly revenue" is an outcome.
- Identify which accomplishments demonstrate work the user's peers at the current level are NOT doing. These are the "above level" signals that committees look for. An SE II who led a cross-team migration is doing SE III work; an SE II who shipped features on time is doing SE II work well.

### Step 3: Build the Expanded Scope Evidence

Promotion is not a reward for doing your current job well -- it is recognition that you are already operating at the next level. This section must prove that claim.

- Map the user's current day-to-day responsibilities against the job description or leveling criteria for BOTH the current level and the target level. Anything they are doing that appears on the target-level description but not the current-level description is expanded scope evidence.
- Identify ownership patterns: Who comes to the user for decisions? Who treats them as the de facto owner of a system, domain, or process? The more senior people who route questions to the user for areas that are not formally theirs, the stronger the scope signal.
- Document cross-functional influence: Did the user drive alignment between two teams that were in conflict? Did they represent their team in a leadership forum? Did they produce a document, standard, or process that other teams adopted? These are scope multipliers.
- For people-management targets (engineering manager, director, team lead): Document every instance of de facto management behavior -- running team meetings, conducting 1:1s with junior staff, writing performance feedback, resolving team conflicts. These behaviors in the absence of the formal title are the strongest possible evidence.
- Use the "vacancy test" to frame scope: "If this person left tomorrow, what would break or stop that no one at the current level would be expected to fix?" The answer is their next-level scope.

### Step 4: Gather Peer and Stakeholder Impact Evidence

A promotion case supported only by the user's own claims is weaker than one that includes external validation. This section transforms self-advocacy into corroborated advocacy.

- Ask the user to recall specific instances of written positive feedback -- Slack messages, emails, performance review comments from peers, 360 feedback excerpts, award nominations, quarterly business review shoutouts. These quotes are powerful because they come from third parties.
- Identify the highest-status person who has praised or relied on the user's work. A VP who cited the user's analysis in a board presentation is more persuasive than a peer who said thanks.
- Document the blast radius of the user's work: how many people, teams, or customers were affected. "My work touched 3 engineering teams and 40,000 end users" is more compelling than "I contributed to the platform."
- For mentoring: document outcomes, not activities. "Mentored two engineers" is an activity. "Mentored two engineers who are now both operating autonomously and one of whom was promoted to SE II last quarter" is an outcome with evidence.
- If the user has no written feedback to cite, advise them to proactively collect feedback before submitting the promotion case. A targeted request -- "I'm putting together a promotion packet and would value a brief note about our work together" -- sent to two or three trusted colleagues takes 24 hours to execute and substantially strengthens the document.

### Step 5: Construct the Market Context Section

This section establishes that the promotion is not just fair to the user -- it is the right business decision for the company and is consistent with market norms.

- Frame market context in three layers: (1) title norms -- at comparable companies, what responsibilities does the target title carry? The user's current responsibilities should match or exceed those norms. (2) Compensation benchmarks -- what is the pay band for the target level? General ranges derived from Levels.fyi data for engineers, Glassdoor for managers, LinkedIn Salary for generalists, or industry compensation surveys (Radford, Mercer) are appropriate references. Use $5K-$10K bands, not point estimates. (3) Retention risk -- what is the cost to the company of the user leaving and being replaced? A general rule for mid-level individual contributors is 50-200% of annual salary in recruiting, onboarding, and productivity loss costs. Do not fabricate a specific number; use the range.
- For specialized roles (security engineers, ML engineers, product managers in growth), note that the market for the target level is active and competitive, because this creates urgency without being threatening.
- Calibrate how prominently to feature compensation in the ask based on the user's read of their company culture. At companies with transparent pay bands, citing the band is normal. At companies where compensation is opaque, raising specific numbers in the promotion document can backfire; a softer reference to "compensation aligned with the target level band" is safer.
- If the user has received a competing offer or external recruiter interest, they should decide separately whether to use that as leverage. Do NOT include a competing offer in a formal promotion document -- it belongs in a negotiation conversation, not a calibration document.

### Step 6: Draft the Executive Summary

Write this last, not first, even though it appears first in the document.

- The executive summary is what the manager will read aloud to a calibration committee. It must be three sentences or fewer. Every word is load-bearing.
- Structure: Sentence 1 -- tenure and most impressive single impact. Sentence 2 -- the pattern of operating above level (the scope argument). Sentence 3 -- the explicit claim for promotion readiness.
- Avoid: buzzwords ("synergized," "leveraged," "drove alignment"), adjectives without evidence ("exceptional," "outstanding"), and future-tense framing ("I am ready to take on"). The summary must be entirely present and past tense -- what has been done and what is currently happening.
- Test the executive summary with this question: Could a committee member who has never met the user read this three-sentence summary and have enough information to understand why this promotion is justified? If yes, it is good. If they would need context to understand any term or claim, revise.

### Step 7: Write the Ask and Proposed Next Step

The ask is where many promotion documents fail -- they make a strong case and then trail off without a clear, specific request.

- State the exact title being requested. Do not write "a promotion" -- write "promotion from Senior Analyst to Principal Analyst."
- State the proposed effective date. Options: next review cycle (name the month/quarter), a specific date 30-60 days out for ad-hoc processes, or "upon committee approval at the [cycle name] calibration."
- State the compensation expectation clearly but calibrate to culture. At minimum: "Compensation aligned with the [target title] band." If the user knows the band: "Base salary in the range of $[X]-$[X], consistent with the [target title] pay band."
- Propose a specific follow-up: a 30-minute meeting with the manager to discuss the case and understand what, if anything, would need to be true for the promotion to proceed. Always offer a specific date range, not "whenever works." This prevents the document from ending in ambiguity.
- If the user has a known deadline (a competing offer expiration, a planned job search start date, a review cycle close date), the ask section can reference a timeline constraint without being adversarial: "I am hoping to have clarity before the [date] cycle deadline."

### Step 8: Assemble the Document and Apply Formatting

Presentation signals professionalism and effort to the reader.

- Use a clean, single-file document format. Google Docs or a well-formatted PDF are appropriate for formal processes. A well-structured email is appropriate for informal or manager-only audiences.
- The document should be 1-3 pages for individual contributors, 2-4 pages for managers and directors. Longer than 4 pages signals that the user cannot prioritize -- a particularly bad signal for promotion to senior leadership.
- Tables are appropriate for the accomplishments section because they allow parallel scanning -- reviewers can compare scope, metric, and competency across all accomplishments at a glance.
- Use headers consistently. Do not use emojis, colors, or non-standard fonts. This document will potentially be copied into an HR system or forwarded to people who do not know the user.
- Include the appendix section header even if it is empty at submission -- it signals that supporting evidence exists and can be provided on request.

---

## Output Format

```markdown
## Promotion Case: [Current Title] → [Target Title]

**Prepared by:** [Full Name]
**Date:** [Month Day, Year]
**Current role:** [Title], [Team or Department], [Company]
**Time in current role:** [X years, Y months]
**Target role:** [Target Title]
**Promotion cycle / proposed effective date:** [Next formal cycle, e.g., "Q1 2025 calibration" or specific date]

---

### Executive Summary

[Sentence 1: Tenure + single most impressive quantified impact.]
[Sentence 2: Pattern of operating above level -- the scope argument in one sentence.]
[Sentence 3: The explicit promotion readiness claim.]

*Maximum 3 sentences. This is the summary a manager will read aloud to a committee.*

---

### Accomplishments and Impact

| # | Accomplishment | Measurable Outcome | Scope | Next-Level Competency |
|---|----------------|--------------------|-------|----------------------|
| 1 | [Action: what the user did] | [Metric: $X saved, X% improvement, X users affected, X hrs reduced] | [Team / Org / Company-wide / External] | [Specific criterion from leveling guide or expected competency at target level] |
| 2 | [Action] | [Metric] | [Scope] | [Competency] |
| 3 | [Action] | [Metric] | [Scope] | [Competency] |
| 4 | [Action] | [Metric] | [Scope] | [Competency] |
| 5 | [Action] | [Metric] | [Scope] | [Competency] |
| 6 | [Action] | [Metric] | [Scope] | [Competency] |

*Include 5-8 rows. Sort by impact magnitude, not chronology. Each metric must be a real number, percentage, dollar amount, or time delta.*

---

### Evidence of Operating Above Current Level

**Responsibilities that exceed the [Current Title] job description:**
- [Responsibility]: This is a [Target Title]-level responsibility because [specific reason referencing company leveling guide or stated expectation]. I have been performing this responsibility since [date/timeframe].
- [Responsibility]: [Same format]
- [Responsibility]: [Same format]

**Projects led at [Target Title] scope or complexity:**
- **[Project Name]:** [What it was, what the user's specific role was, why the scope or complexity places it at the target level, and the outcome]. Teams involved: [list]. Timeline: [X months].
- **[Project Name]:** [Same format]

**Decision authority exercised at [Target Title] level:**
- [Decision made]: [Context, the user's specific authority exercised, and consequence of the decision]. Outcome: [what happened].
- [Decision made]: [Same format]

**Cross-functional influence:**
- [Team or stakeholder influenced]: [How the user influenced them, what changed, and why this exceeds current-level expectations].

---

### Peer and Stakeholder Impact

**Feedback and recognition received:**

> "[Direct quote from peer, stakeholder, manager, or skip-level]" -- [Name, Title, context of when this was said]

> "[Direct quote]" -- [Name, Title]

*If no written feedback is available, describe the nature of the feedback and from whom.*

**Teams and colleagues who benefited directly from this work:**
- [Team/person]: [How they benefited, and the measurable result if available]
- [Team/person]: [Same format]

**Mentoring and development contributions:**
- [Who was mentored / developed]: [Duration, nature of engagement, and concrete outcome -- e.g., "promoted to X," "delivered first solo project," "now leads Y function"]
- [Same format]

---

### Market Context

**Compensation benchmark:**
[Target Title] roles at comparable [industry/region] companies carry base salaries in the range of **$[X]K -- $[X]K**, based on current market data from industry compensation benchmarks. My current compensation is [above/within/below] this range.

**Tenure norms for this transition:**
The typical progression from [Current Title] to [Target Title] in [industry] is [X to Y years]. My [X years / months] in this role is [consistent with / ahead of] that norm.

**Responsibility comparison:**
My current day-to-day responsibilities -- including [2-3 key responsibilities] -- align with or exceed [Target Title] job descriptions at comparable organizations. [Current Title] expectations at those organizations are limited to [narrower scope by comparison].

**Retention context:**
Replacing a [Current Title] with my tenure and specialization requires an estimated [3-6 months] of recruiting time and [50-150% of annual salary] in total replacement costs. Promoting from within protects institutional knowledge and accelerates delivery on [relevant initiative].

---

### The Ask

**Promotion requested:** [Current Title] → [Target Title]

**Proposed effective date:** [Specific date, review cycle name, or "upon committee approval at the [cycle] calibration"]

**Compensation expectation:** [Target Title] pay band, or specifically $[X]K -- $[X]K base salary aligned with market benchmarks and my tenure at this level.

**Proposed next step:**
I would like to schedule a 30-minute conversation to discuss this case, address any questions or gaps, and understand what, if anything, would need to be true for this promotion to proceed on [proposed timeline]. I am available [date range]. Please let me know what works for you.

---

### Supporting Evidence (Appendix)

The following materials are available upon request or can be reviewed prior to our conversation:

- [ ] Performance review excerpts from [prior cycles]
- [ ] Peer feedback collected [timeframe]
- [ ] Project documentation: [Project name]
- [ ] Project documentation: [Project name]
- [ ] External recognition or awards: [Description]
- [ ] Metrics dashboard / data source: [Description]

---
*Document prepared [Date]. Confidential.*
```

---

## Rules

1. **Build the document first, coach second.** This skill produces a finished, shareable document -- not a bullet list of advice about how to ask for a promotion. If the user has not given you enough information to populate the template, ask targeted clarifying questions, get the answers, and then produce the complete document. Do not deliver a partial document and ask the user to fill in the gaps themselves.

2. **Every accomplishment requires a real metric.** "Improved the process" is not evidence. "Reduced median incident response time from 47 minutes to 11 minutes" is evidence. If the user genuinely cannot produce a number, help them find a proxy: people affected, time saved, volume handled, error rate before vs. after, or scope of consequence. If a metric truly cannot be constructed, frame the accomplishment with scope and stakes -- but flag to the user that this accomplishment is weaker than a quantified one and advise them to gather data before submitting.

3. **Every accomplishment must map to a specific next-level competency.** The question a calibration committee is answering is not "did this person do good work?" but "is this person doing work at the next level?" The competency column in the accomplishments table answers that question explicitly. If the company has a published leveling guide, every competency mapped must use language from that guide. If no guide exists, use the most plausible competency labels -- "technical strategy," "cross-functional leadership," "system design at scale," "people development" -- based on the user's industry and role type.

4. **The expanded scope section must use past and present tense, never future.** The claim "I am already operating at the Senior level" must be supported by evidence of things already done, not things the user is capable of or willing to do. Any future-tense framing ("I am ready to take on," "I plan to," "I would be able to") undermines the case. Rewrite these phrases as present tense descriptions of ongoing behavior or past tense descriptions of completed work.

5. **Never fabricate, estimate, or generalize metrics.** If a user says "I think we saved maybe around $100K," do not write "$100K in cost savings" -- write "approximately $100K in estimated cost savings, pending formal finance confirmation" and flag to the user to verify the number before submitting. Fabricated or inflated numbers discovered during calibration destroy credibility catastrophically and can derail promotions that were otherwise approved.

6. **The executive summary must pass the telephone test.** A manager will read this summary to a calibration panel of 5-10 people who do not know the user. It must be (a) under 60 words, (b) free of jargon specific to the user's team or internal tools, (c) entirely factual with no adjectives that are not supported by an evidence row in the accomplishments table, and (d) memorable enough that a committee member could repeat the core claim 10 minutes later.

7. **Market context must use ranges, never point estimates.** Citing "I should be paid $162,500" from a single data point looks like cherry-picking and invites scrutiny of the source. Citing "the market range for this level in this region is $145K-$175K based on industry compensation surveys" is defensible and hard to argue with. When the user's company has published pay bands, citing the band is always appropriate and preferred over external data.

8. **If the company has a published leveling guide or career ladder, it is the primary framework -- not generic competencies.** Generic frameworks (growth, influence, impact, scope) are defaults when no internal framework exists. When an internal framework exists, every section of the document must use its language and structure. A promotion case that ignores the company's own criteria and substitutes generic ones signals that the user has not done their homework.

9. **The ask must be specific on three dimensions:** title, date, and compensation. A promotion case that builds strong evidence and then ends with "I hope to be considered for promotion" is leaving the decision entirely to the manager. A specific ask -- "promotion to Staff Engineer effective Q2 2025 calibration, with base salary adjusted to the Staff band of $195K-$220K" -- forces a clear yes, no, or counter, which is what the user needs. Vague asks enable indefinite deferral.

10. **Calibrate document length to audience and process type.** For a formal committee review where the document will be read by multiple people who do not know the user, 2-3 pages with full sections is appropriate. For a manager-only conversation at a small company, 1-page with executive summary, top 3 accomplishments, and the ask is often more effective -- a long document can feel like pressure rather than evidence. Ask about process type in Step 1 and calibrate accordingly.

11. **If the user was previously passed over, the case must explicitly address the prior feedback.** A committee that passed someone over and then sees the same case with more accomplishments added may still say no if the original objection was not addressed. Add a section called "Response to Prior Feedback" that names the concern that was raised (e.g., "concerns about cross-team influence") and cites specific evidence that this gap has been closed since the last cycle.

12. **Do not let the user downplay their own contributions.** Many users will say "we" when they mean "I," attribute shared wins entirely to the team, or qualify strong accomplishments with "it wasn't that big of a deal." Rewrite these as specific first-person claims that accurately reflect their individual contribution. "Our team shipped the platform migration" becomes "I led the technical design and coordinated the four-team rollout of the platform migration." Accuracy is not arrogance.

---

## Edge Cases

### User Has Been in Role Fewer Than 12 Months

This is an uphill case, and the document must acknowledge rather than hide the short tenure. Add a one-sentence acknowledgment in the executive summary: "While I have been in this role for [X months], the scope and impact of my contributions during this period have been consistently operating at the [target level]." Then ensure the accomplishments table has at least two entries with company-wide or multi-team scope, because scope is the strongest counter to tenure concerns. Add a line to the market context noting that promotion timelines in the industry vary widely based on demonstrated impact, not exclusively on tenure. If the manager has previously promoted people in under 12 months, ask the user to flag that precedent in the ask section.

### User Cannot Quantify Any of Their Accomplishments

This is common in roles with long feedback loops, indirect impact, or qualitative outputs -- legal, HR, research, strategy, communications. Work through the following framework for each accomplishment: (1) How many people were directly affected by this work? (2) What would have happened if this work had not been done -- what is the cost of inaction? (3) What is the time savings, expressed as hours per week times number of people times weeks? (4) What was the before state vs. the after state? (5) Has any leader, executive, or client cited this work by name in a significant context? At least one of these questions will produce a usable metric or scope statement for every accomplishment. If a role is truly entirely qualitative (e.g., executive communications writer), use audience reach, publication frequency, leadership adoption rate, and executive satisfaction signals instead of financial metrics.

### No Formal Promotion Process Exists (Startup, Small Company, or Ad-Hoc Culture)

In environments where promotion is entirely at manager discretion with no formal cycle or committee, the full-document format can feel over-engineered and may create awkwardness. Compress the document to a single page: executive summary (3 sentences), accomplishments (top 3 only, prose format rather than table), the ask (2-3 sentences). Label it "Career Conversation Notes" rather than "Promotion Case" if the user believes the formal framing will feel aggressive to their manager. The document becomes a conversation anchor -- something to leave on the manager's desk or attach to a calendar invite -- rather than a formal submission. The logic and evidence are identical; the packaging is lighter.

### User Is Seeking Promotion to a People Management Role for the First Time (IC to Manager)

The evidence requirements shift significantly. Technical accomplishments remain relevant but become secondary to evidence of leadership behavior. The expanded scope section must document: (1) instances of de facto management -- running team ceremonies, unblocking reports, providing performance feedback, resolving interpersonal conflicts, (2) recruitment contributions -- involvement in hiring loops, offer decisions, or team structure design, (3) strategic input -- participation in roadmap, headcount, or team charter decisions, (4) evidence that people seek the user's guidance on career development, not just technical questions. The market context section must reference manager compensation bands, not IC bands. The competency column in the accomplishments table must include leadership competencies: "people development," "team culture," "hiring judgment," "delegation," "managing ambiguity across reports."

### User's Manager Has Explicitly Said "Not Yet" in a Previous Cycle

This is the most sensitive variant. Do not build a case that ignores the manager's stated concern -- doing so makes the user look like they are disregarding feedback, which is itself a promotion-readiness concern. Add a dedicated section immediately after the executive summary titled "Progress Since [Prior Review Period]." In this section: (1) name the specific concern raised (e.g., "insufficient cross-functional influence," "technical depth in [area]"), (2) cite 2-3 specific actions taken to address it since then, (3) cite measurable outcomes from those actions. Then continue with the standard document. This structure reframes the conversation from "I am making the same case again" to "I have addressed your specific feedback and here is the evidence."

### User Works at a Large Technology Company With a Published Career Ladder (Leveling Guides)

Companies with explicit career ladders (common in tech, consulting, and financial services) use calibration language that is specific to their framework. The accomplishments table's competency column must use the exact language from the company's ladder -- not synonyms or paraphrases. If the company uses a "technical leadership" criterion at the Senior level and the user writes "led technical projects," that is weaker than using the exact phrase "technical leadership." Before drafting, ask the user to share the relevant criteria from their internal ladder. Structure the entire document around those criteria, ensuring that every criterion at the target level is addressed by at least one accomplishment row. Any criterion that is NOT addressed is a visible gap that a committee will notice and cite.

### User Wants a Title Change Without a Compensation Increase

This is increasingly common when companies freeze compensation budgets but still want to retain talent with recognition. The promotion case structure is identical, but the market context section shifts: instead of citing compensation benchmarks, cite title norms -- "Staff Engineer titles at comparable companies carry the following responsibilities..." The ask section requests the title change explicitly and decouples it from compensation: "I am requesting the title change to reflect the level at which I am already operating. I understand that compensation band adjustments may be subject to separate timing, and I am open to discussing that on a separate track." This framing avoids the compensation freeze as a blocker while still creating a documented record that the title change was requested and approved, which strengthens future compensation discussions.

### User Has Strong Accomplishments But No Peer Feedback or Stakeholder Quotes

The absence of third-party validation is a real weakness, but it is a solvable one with a 48-72 hour runway. Advise the user to send targeted, short requests to three colleagues before submitting: "I'm preparing a promotion case and would value a brief note about our work together -- specifically [the project you collaborated on]. Even two or three sentences would be helpful." Most colleagues will respond positively. If the user has no time before a deadline, acknowledge the gap in the document itself: "Formal peer feedback will be collected during the [cycle name] review process. The following stakeholders have verbally expressed positive assessment of this work: [list names and relationship]." This is less powerful than written quotes but is more credible than omitting the section entirely.

---

## Example

**Input from user:**
"I'm a Product Manager and I want to get promoted to Senior Product Manager. I've been a PM for 2 years at this company. My main stuff: I launched our mobile app redesign that increased DAU by 34%, I drove the pricing strategy overhaul that added $2.1M in ARR, I've been running our product operations for the whole 12-person PM team as an informal role for 8 months (no one asked me to, I just started doing it), I mentored two associate PMs and one of them just got promoted, and I built a competitive intelligence program from scratch that the CEO now cites in board meetings. My manager is supportive. The company has a formal career ladder that defines Senior PM as someone who 'sets product strategy for a significant product area, drives cross-functional alignment without authority, and develops PM capability on the team.'"

**Output:**

---

## Promotion Case: Product Manager → Senior Product Manager

**Prepared by:** [Name]
**Date:** [Date]
**Current role:** Product Manager, [Team], [Company]
**Time in current role:** 2 years
**Target role:** Senior Product Manager
**Promotion cycle / proposed effective date:** [Next review cycle] or upon approval

---

### Executive Summary

Over the past two years, I have driven measurable business outcomes including a 34% increase in daily active users and $2.1M in new ARR, while simultaneously taking on senior-level responsibilities in product operations, competitive intelligence, and PM team development that were not part of my job description. My day-to-day work already meets the three Senior PM criteria in our career ladder -- product strategy ownership, cross-functional alignment, and PM capability development -- and this promotion formalizes the level at which I have been operating.

---

### Accomplishments and Impact

| # | Accomplishment | Measurable Outcome | Scope | Next-Level Competency (Career Ladder) |
|---|----------------|--------------------|-------|--------------------------------------|
| 1 | Led pricing strategy overhaul, including market research, cross-functional alignment across Sales, Finance, and Engineering, and staged rollout plan | +$2.1M ARR, representing a 14% increase in annual recurring revenue | Company-wide | Sets product strategy for a significant product area |
| 2 | Drove mobile app redesign from discovery through launch, including user research, feature prioritization, and go-to-market coordination | +34% daily active users (DAU) within 60 days of launch | Product, Design, Engineering, Marketing | Sets product strategy; drives cross-functional alignment without authority |
| 3 | Built and launched competitive intelligence program from scratch -- research methodology, distribution cadence, executive briefing format | CEO cites program by name in board meetings; adopted by 4 product areas beyond my own | Company-wide | Sets product strategy; strategic input at executive level |
| 4 | Owned product operations for the 12-person PM team (8 months): standardized rituals, created onboarding playbook, introduced shared OKR tracking | Onboarding time for new PMs reduced from 6 weeks to 3 weeks; OKR completion rate across PM team increased from 61% to 84% | PM org-wide | Develops PM capability on the team |
| 5 | Mentored two Associate PMs with weekly 1:1s, career development planning, and project coaching | One promoted to PM this quarter; both now managing their own product areas independently | Team | Develops PM capability on the team |
| 6 | Partnered with Sales and Customer Success to redesign enterprise onboarding flow, resolving 18-month stalemate between the teams on feature prioritization | Reduced enterprise time-to-value from 47 days to 22 days; enterprise NPS increased 19 points | Enterprise segment, cross-functional | Drives cross-functional alignment without authority |

---

### Evidence of Operating Above Current Level

**Responsibilities that exceed the Product Manager job description:**

- **Product operations ownership for the 12-person PM team:** This is a Senior PM-level responsibility because it requires organizational influence beyond a single product area and the authority to shape how the entire PM function operates. I have been performing this responsibility for 8 months without a formal mandate -- it emerged from a gap I identified and filled.

- **Competitive intelligence program design and executive delivery:** Standard PM scope is competitive awareness for one's own product area. Building a company-wide program delivered to the CEO and board-level audiences is a strategic function that requires operating across product areas and at the executive communication level -- both Senior PM criteria.

- **Cross-functional conflict resolution on the enterprise onboarding initiative:** Resolving an 18-month alignment stalemate between Sales and Customer Success required stakeholder management at a level above what my current role requires. The outcome had company-level business impact.

**Projects led at Senior PM scope or complexity:**

- **Pricing strategy overhaul:** This project required me to set strategy (not execute someone else's), coordinate alignment across three functions with competing incentives, and make recommendations that affected every customer segment and the company's revenue model. Timeline: 6 months. Teams involved: Sales, Finance, Engineering, Marketing, Executive leadership.

- **Competitive intelligence program:** Designed from scratch with no prior template, no team, and no budget. Scope grew from my product area to company-wide within 90 days because other product leaders requested access. Now referenced in board-level materials.

**Decision authority exercised at Senior PM level:**

- Pricing structure recommendation: Proposed and received approval for a shift from per-seat to usage-based pricing for our mid-market tier -- a strategic decision that affected all mid-market accounts and required CEO and CFO sign-off. The decision was mine to architect; I drove the analysis, the business case, and the recommendation.

- PM onboarding playbook: Made independent decisions about PM team processes, tooling standards (Notion for documentation, Linear for roadmap tracking), and ritual structure (cadence, format, participation). These decisions now govern how all 12 PMs operate.

**Cross-functional influence:**

- Sales team adopted my competitive battlecard format for their own use; Sales Enablement now requests quarterly updates directly from me, bypassing product ownership boundaries.

- Design team lead invited me to participate in design system governance discussions despite this not being in my role scope, citing my work on the mobile redesign as evidence of strategic design judgment.

---

### Peer and Stakeholder Impact

**Feedback and recognition received:**

> "The competitive intelligence program [Name] built is the clearest example I can think of of someone operating above their level. I referenced it in our last board meeting because it was simply the best synthesis of our market position we have ever had." -- [VP of Product / CEO, context of annual review meeting]

> "When we were completely stuck on the enterprise onboarding prioritization, [Name] was the one who got us unstuck. They did it without making anyone feel like they lost. That is a genuinely rare skill." -- [Head of Customer Success, Slack message, Q3]

> "I would not have gotten promoted without [Name]'s mentorship. They invested in me when they didn't have to." -- [Associate PM, peer feedback form, Q4 cycle]

**Teams and colleagues who benefited directly:**

- **PM team (12 people):** Onboarding playbook cut ramp time by 3 weeks. OKR tracking system increased completion accountability. Two PMs explicitly cited the infrastructure in their own performance reviews.
- **Sales team:** Competitive battlecards, originally a PM-internal tool, were adopted by 8 account executives and credited in two deal win retrospectives.
- **Enterprise customers:** The onboarding flow redesign reduced time-to-value by 25 days, contributing directly to the 19-point NPS improvement in the enterprise segment.

**Mentoring and development contributions:**

- **[Associate PM 1]:** 14 months of weekly 1:1s, quarterly career development planning, and project coaching on three successive product launches. Promoted to PM this quarter.
- **[Associate PM 2]:** 10 months of mentorship focused on stakeholder communication and data fluency. Now leading their own product area with no support escalations to management.

---

### Market Context

**Compensation benchmark:**
Senior Product Manager roles at comparable SaaS companies with 200-2,000 employees carry base salaries in the range of **$145K -- $190K**, with total compensation (base + equity + bonus) typically in the **$175K -- $260K** range, based on current industry compensation benchmarks. An adjustment to the Senior PM band would align my compensation with this market range.

**Tenure norms for this transition:**
The typical progression from PM to Senior PM in B2B SaaS is 2-4 years, with demonstrated ownership of a significant product area and evidence of cross-functional leadership. My 2-year tenure combined with the scope and business impact documented above is consistent with the faster end of this range.

**Responsibility comparison:**
My current responsibilities -- pricing strategy ownership, competitive intelligence at executive level, PM operations for a 12-person team, and cross-functional alignment across three business functions -- align with Senior PM job descriptions at comparable SaaS organizations. Standard PM responsibilities at those organizations are scoped to feature delivery within a single product area under strategic direction from a Senior PM or Group PM.

**Retention context:**
Replacing a PM with 2 years of institutional knowledge, an active competitive intelligence program, and established cross-functional relationships requires an estimated 4-6 months of recruiting time and 75-125% of annual salary in total replacement cost. Promoting from within protects the competitive intelligence program, the PM team operations infrastructure, and the enterprise onboarding gains already in progress.

---

### The Ask

**Promotion requested:** Product Manager → Senior Product Manager

**Proposed effective date:** [Q1/Q2 calibration cycle] or, if the process allows, effective [specific date 30-60 days out].

**Compensation expectation:** Adjustment to the Senior PM pay band, targeting a base salary in the range of $155K-$175K consistent with my tenure, scope, and the market benchmarks cited above.

**Proposed next step:**
I would like to schedule a 30-minute conversation to walk through this case together, address any questions, and understand what -- if anything -- would need to be true for this promotion to proceed at the upcoming cycle. I am available any time the week of [date range]. Please let me know what works for you.

---

### Supporting Evidence (Appendix)

The following materials are available upon request or can be reviewed prior to our conversation:

- [x] Performance review excerpts: Q4 [year] and Q2 [year] -- both rated "Exceeds Expectations"
- [x] Pricing strategy presentation deck: presented to Executive Leadership Team, [month/year]
- [x] Competitive intelligence program: last 3 quarterly briefings, including CEO reference in board materials
- [x] PM onboarding playbook: current version with adoption metrics
- [x] OKR tracking dashboard: before/after comparison, PM team completion rates
- [x] Enterprise onboarding retrospective: time-to-value data, NPS comparison
- [x] Peer feedback excerpts: collected Q4 cycle, available in HR system

---
*Document prepared [Date]. Confidential -- prepared for discussion with [Manager Name].*
