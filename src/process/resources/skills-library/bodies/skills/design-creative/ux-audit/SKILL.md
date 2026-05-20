---
name: ux-audit
description: |
  Conducts a heuristic UX evaluation using Nielsen's 10 usability heuristics, identifies violations with severity ratings, and produces a prioritized remediation list.
  Use when the user asks to audit a user experience, evaluate usability, review an interface for UX issues, or identify usability problems.
  Do NOT use for accessibility-specific audits (use accessibility-review), visual design critique (use visual-hierarchy-review), or user flow analysis (use user-flow-mapping).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design analysis checklist"
  category: "design-creative"
  subcategory: "ui-ux-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# UX Audit

## When to Use

**Use this skill when:**
- The user asks to audit, evaluate, or review the usability of an existing interface -- a web application, mobile app, dashboard, checkout flow, onboarding sequence, settings screen, or any interactive product surface
- The user wants a structured heuristic evaluation grounded in Nielsen's 10 usability heuristics, producing severity-rated findings and a prioritized remediation plan
- The user needs to identify why users are struggling with a product -- support tickets mention confusion, drop-off analytics show abandonment at a specific step, or user testing revealed friction but not root causes
- The user wants to compare a redesign against an existing interface to evaluate whether usability has improved, regressed, or stayed the same
- The user wants to benchmark a product's usability quality before commissioning user research or a formal redesign, establishing a baseline of known issues
- The user wants a quick expert evaluation (heuristic evaluation is 75% as effective as full usability testing at finding serious problems, per Nielsen Norman Group research) before investing in full usability studies
- The user is a product manager, designer, or developer who needs a structured list of UX debt to feed into sprint planning or backlog grooming

**Do NOT use when:**
- The user needs an accessibility audit measured against WCAG 2.1 or 2.2 success criteria -- color contrast ratios, ARIA landmark roles, focus order, keyboard navigation compliance (use `accessibility-review`)
- The user wants a visual design critique focused on typography hierarchy, color palette harmony, grid alignment, or brand consistency (use `visual-hierarchy-review`)
- The user wants to map the end-to-end user journey, identify where flows diverge, detect dead ends, or audit navigation architecture (use `user-flow-mapping`)
- The user wants to design a new interface from scratch and needs wireframe specs or layout guidance (use `wireframe-specification`)
- The user wants to analyze quantitative data -- funnel drop-off rates, heatmaps, session recordings, or A/B test results without an interface to evaluate (use `analytics-interpretation`)
- The user wants to conduct usability testing with real participants -- recruiting, scripting, moderating (use `usability-test-planning`)
- The request is purely about content strategy, microcopy tone, or brand voice rather than interface usability (use `content-strategy`)

---

## Process

### Step 1: Gather Context Before Beginning

Never begin an audit without sufficient context. A heuristic evaluation without user context produces findings that are technically correct but strategically useless.

- **Identify the product surface:** Ask for the specific screen, flow, or product being audited. Accept URLs, annotated screenshots, written descriptions of the interface, or a combination. If the user provides a URL, describe what you observe before evaluating -- don't assume.
- **Establish the target user profile:** Who are the primary users? Novice vs. expert distinction is critical -- a violation of H7 (flexibility and efficiency) matters far more for a tool used by power users 40 hours a week than for a consumer app used once a month. Ask about technical literacy, domain expertise, and usage frequency.
- **Define the critical task set:** Identify 3-5 core tasks users must accomplish. These become your severity multipliers -- a violation that blocks a core task scores higher than an identical violation in a rarely used secondary feature.
- **Collect known signals:** Ask about existing evidence: support tickets, NPS comments, user research findings, drop-off rates at specific steps, or help documentation requests. These validate and prioritize findings rather than drive them.
- **Agree on audit scope:** Clarify whether this is a full product audit, a focused flow audit (e.g., only the checkout), a single-screen deep dive, or a comparison audit (current vs. proposed). Different scopes require different output depth. A full product audit should not attempt to evaluate 50 screens in equal depth -- identify the 5-10 highest-traffic or highest-stakes screens.

### Step 2: Apply Nielsen's 10 Usability Heuristics Systematically

Evaluate every heuristic in sequence. Do not skip heuristics that seem obviously fine -- passing heuristics should be marked as Pass with a brief rationale. Experienced evaluators find more violations when they work through each heuristic in isolation rather than doing a general walkthrough.

**H1 -- Visibility of System Status**
- Evaluate all loading states: does the system show progress during latency > 100ms? Jakob Nielsen's research shows users perceive a response as immediate if it arrives within 100ms, engaged if within 1 second, and distracted if over 10 seconds. Interfaces that cross 1 second without feedback violate H1.
- Check every form submission, file upload, background process, and state-changing toggle for feedback -- success confirmation, error state, loading spinner, or progress indicator.
- Check navigation: does the user know where they are in the product? Active states, breadcrumbs, page titles, and step indicators all support H1.
- Check asynchronous operations: email sends, data syncs, background calculations. Absence of status feedback for async operations is a common and often severe H1 violation.

**H2 -- Match Between System and Real World**
- Flag all technical jargon, system-oriented language, developer-coined labels, or internal nomenclature exposed to end users. Examples: "null state," "403 error," "payload," "boolean," "deprecated."
- Evaluate icon semantics: icons that lack labels require cultural familiarity. A floppy disk for "save" may be opaque to users under 25. The hamburger menu is still recognizable but its discoverability is lower than an explicit "Menu" label.
- Check date/time formats, currency symbols, measurement units, and numeric formatting against the user's locale conventions.
- Evaluate information ordering: does the interface sequence information the way users think about the task, or the way the database is organized?

**H3 -- User Control and Freedom**
- Identify all destructive actions: delete, archive, cancel, deactivate, clear, reset. Each should have at least one safeguard -- either a confirmation dialog, an undo mechanism, or a soft-delete with recovery period (30-day trash is the standard pattern for data deletion).
- Check for modal traps: dialogs or fullscreen overlays that lack a clear exit path. Users must always be able to escape.
- Evaluate back navigation: does the browser back button work logically? Do in-app back buttons return to the expected previous state?
- Check wizard/multi-step flows: can users move backward through steps without losing entered data? Forcing re-entry of previously validated information is a common H3 violation in checkout and onboarding flows.

**H4 -- Consistency and Standards**
- Distinguish between internal consistency (the product is consistent with itself) and external consistency (the product follows platform conventions). Both matter; external consistency violations are often more disorienting.
- Audit terminology: count how many different words are used for the same concept ("Delete" vs. "Remove" vs. "Clear" vs. "Discard"). Each synonym adds cognitive load.
- Check interactive affordances: are all clickable elements visually consistent? Do all primary actions use the same button style? Are destructive actions always in red/outlined?
- Check placement conventions: are navigation elements, search, user avatar/account menus, and CTAs where platform conventions predict them? On web: nav top-left or top-full-width, search top-center or top-right. On iOS: tab bar bottom, navigation controls top-left.

**H5 -- Error Prevention**
- This heuristic is about preventing errors before they occur, which is categorically more valuable than good error recovery (H9). Rank error prevention violations slightly higher than equivalent error recovery violations.
- Identify all irreversible actions and evaluate whether they are sufficiently guarded (confirmation dialogs with non-trivial confirmation text, not just "OK/Cancel").
- Check form inputs for inline constraints: does a password field show requirements before the user submits? Does a date field prevent impossible dates (February 30)?
- Evaluate smart defaults: are default values pre-populated with the most likely correct answer? Are dangerous options not the default?
- Check for confusable controls: two adjacent destructive buttons, a "Submit" button positioned where users might accidentally click, a dismiss gesture on mobile that's identical to a delete gesture.

**H6 -- Recognition Rather Than Recall**
- Working memory capacity is approximately 7 ± 2 items (Miller's Law), though for complex tasks it is closer to 4 items (Cowan's 2001 revision). Any interface that requires users to hold more than 3-4 items in mind simultaneously is a recognition failure.
- Check whether all available actions are visible or easily surfaced. Hidden functionality is not inherently bad (progressive disclosure is valid for advanced features) but primary actions must never be hidden.
- Evaluate icon legibility: icons without labels require recall. The standard threshold is that unlabeled icons are acceptable only when they are universally recognizable (home, search, X/close, back arrow) AND the product has sufficient onboarding to teach domain-specific icons.
- Check contextual menus, overflow menus, and long-press actions: if these contain primary task actions, that is an H6 violation.
- Evaluate empty states: when a list, table, or dashboard has no content, does the interface explain why and what to do next? A blank screen with no explanation forces recall of the workflow.

**H7 -- Flexibility and Efficiency of Use**
- This heuristic primarily affects expert users and high-frequency tasks. Score violations higher for B2B tools and SaaS products used daily by professionals.
- Identify keyboard shortcuts for primary actions. Standard expectations: Ctrl/Cmd+S to save, Ctrl/Cmd+Z to undo, Escape to dismiss, Enter to confirm. Deviations from these conventions are H4 violations, not H7.
- Evaluate bulk operations: can users apply an action to multiple items at once? Missing bulk actions in list-heavy interfaces are consistently rated as H7 major violations in enterprise products.
- Check filtering and sorting: can users narrow large datasets quickly? Absence of filtering on tables with > 20 rows is an H7 violation.
- Evaluate saved states: user preferences, recently accessed items, saved searches, and default configurations reduce repetitive setup tasks.

**H8 -- Aesthetic and Minimalist Design**
- This heuristic is specifically about information density and relevance, not visual style. Do not conflate with visual design quality.
- Count the number of distinct CTAs visible on a single screen. More than 3 primary actions (or 1 primary + 2-3 secondary) creates choice paralysis for most users.
- Evaluate progressive disclosure: is advanced or rarely-used information hidden until requested? Settings panels, advanced filters, and expert options should be collapsed by default.
- Check for redundant information: repeated labels, duplicate CTAs, and restated instructions increase cognitive load without adding value.
- Evaluate error messages and help text: are they present on-screen by default, occupying space even when no error has occurred? Placeholder instructions that persist take up space and teach users to ignore interface text.

**H9 -- Help Users Recognize, Diagnose, and Recover from Errors**
- Evaluate all error messages against the three-part standard: (1) state what went wrong in plain language, (2) explain why it went wrong if relevant, (3) tell the user exactly what to do to fix it. Error messages that fail all three parts receive severity 3. Failing one or two parts receives severity 2.
- Flag all numeric error codes exposed to end users without explanation (e.g., "Error 422" without a human-readable explanation).
- Check error message placement: errors must appear adjacent to the problem field or action that triggered them, not only in a toast notification at the top of the page.
- Evaluate network error states: offline, timeout, server error, and rate-limit errors all require distinct, actionable messages. A generic "Something went wrong" violates H9.

**H10 -- Help and Documentation**
- The best interfaces need no documentation, so the presence of extensive documentation is itself a signal of H1-H9 failures. Document this relationship.
- Evaluate contextual help: tooltips, help text beneath form fields, onboarding tours, and empty state explanations. These are the primary help mechanisms for most products.
- Check whether help is searchable: for complex products, help center search is a core navigation aid.
- Evaluate the discoverability of help: is it buried in a footer link, or is it accessible from the screen where the user needs it?

### Step 3: Rate Each Finding by Severity

Apply the Molich-Nielsen severity scale precisely. Severity combines the frequency of the problem, the impact on task completion, and the persistence of the issue.

- **Severity 0:** Purely cosmetic. No functional impact. User notices imperfection but task completion is unaffected. Example: a button shadow that looks slightly off.
- **Severity 1:** Cosmetic with minor friction. Users notice and may briefly pause but self-correct immediately. Fix when capacity allows. Example: a tooltip that appears 300ms too late.
- **Severity 2:** Usability problem with moderate impact. The user experiences confusion or delay but eventually completes the task without external help. Schedule for next sprint. Example: a filter that resets unexpectedly when navigating away.
- **Severity 3:** Major usability problem. Users fail the task, abandon the flow, make errors, or require support intervention. Fix in current sprint or within the next release cycle. Example: a form that clears all data on validation failure.
- **Severity 4:** Catastrophic. Task cannot be completed. Blocks conversion, key workflow, or critical function. Requires immediate remediation. Example: a checkout button that is non-functional on a specific browser.

**Severity calibration checks:**
- If you have assigned severity 4 to more than 2-3 issues in a single audit, recalibrate. A severity 4 means total task failure. Products with more than 2-3 genuine blockers are typically non-functional, not just poorly designed.
- If you have assigned severity 3 to the majority of findings, recalibrate downward. Severity 3 means significant task impairment, not merely annoyance.
- A well-calibrated audit of a typical commercial product has approximately: 0-2 severity 4, 3-8 severity 3, 8-15 severity 2, and several severity 1 and cosmetic findings.

### Step 4: Calculate a Composite Priority Score

Raw severity alone is insufficient for prioritization. Multiply severity by frequency and task-criticality impact to produce a composite score that drives the remediation order.

**Composite Priority Formula:**
`Priority Score = Severity × Frequency Weight × Task Criticality Weight`

- **Frequency Weight:** High (affects > 60% of users) = 1.5; Medium (30-60%) = 1.0; Low (< 30%) = 0.5
- **Task Criticality Weight:** Core task = 1.5; Secondary task = 1.0; Rare/advanced task = 0.5

**Example:** A severity 3 violation that affects 70% of users on a core task = 3 × 1.5 × 1.5 = 6.75
**Example:** A severity 3 violation affecting 20% of users on an advanced feature = 3 × 0.5 × 0.5 = 0.75

These two severity-3 violations are in completely different remediation tiers. The composite score surfaces this difference.

Sort the final remediation list by composite score descending.

### Step 5: Estimate Fix Effort for Each Violation

Effort sizing is done relative to the team's typical sprint capacity. Use the following guidelines:

- **S (Small, < 1 day):** Copy changes, color/style tweaks, adding a confirmation dialog using existing patterns, adding a tooltip, updating an error message, reordering list items. No new component required.
- **M (Medium, 1-5 days):** New UI component following existing design system patterns, adding inline validation to a form, implementing an undo mechanism, adding a search/filter to an existing list, redesigning a modal. Requires design and engineering but no new backend.
- **L (Large, 1+ weeks):** New user flow, significant information architecture change, new backend endpoint required, multi-screen redesign, new component library additions.

Identify Quick Wins explicitly: severity 2-3 violations with Small effort. These are the highest ROI items in the backlog.

### Step 6: Identify Strengths and Positive Patterns

A heuristic evaluation is not a complaint list. Document what the interface does well -- this serves two purposes: (1) it calibrates the report's credibility by showing the evaluator was balanced, and (2) it tells designers and developers what not to break in future iterations.

- Identify 3-7 specific passing patterns, not generic praise
- Reference the heuristic each strength supports
- Note if a strength is genuinely above-average for the product category -- e.g., "best-in-class empty state messaging" or "keyboard navigation that exceeds typical web app standards"

### Step 7: Write the Audit Report

Structure the output following the Output Format below. Calibrate depth to scope:
- Full product audit: complete all sections at full depth
- Single-screen or focused flow audit: note the limited scope in the summary, evaluate only relevant heuristics at full depth, briefly address remaining heuristics
- Quick audit (5-10 violations): can compress the heuristic-by-heuristic section into the violation summary table, but never skip severity ratings or remediation guidance

---

## Output Format

```
## UX Audit Report: [Product / Screen / Flow Name]

### Audit Summary
| Field                  | Value                                                    |
|------------------------|----------------------------------------------------------|
| Scope                  | [Specific screens, flows, or features audited]           |
| Target Users           | [User profile, technical level, usage frequency]         |
| Critical Tasks         | [3-5 core tasks evaluated against]                       |
| Evaluation Method      | Nielsen's 10 Usability Heuristics (Molich-Nielsen, 1990) |
| Severity Scale         | 0 (cosmetic) to 4 (catastrophic)                         |
| Severity Distribution  | [X] catastrophic | [X] major | [X] minor | [X] cosmetic  |
| Total Violations Found | [X]                                                      |
| Quick Wins Available   | [X] (high severity, low effort)                          |

---

### Heuristic Evaluation

#### H1: Visibility of System Status
- **Overall Rating:** Pass / Partial / Fail
- **Findings:**
  - [Specific observation with evidence] -- Severity: [0-4]
- **Positive Patterns:** [What works well under this heuristic, if applicable]

#### H2: Match Between System and Real World
- **Overall Rating:** Pass / Partial / Fail
- **Findings:**
  - [Specific observation with evidence] -- Severity: [0-4]
- **Positive Patterns:** [If applicable]

#### H3: User Control and Freedom
- **Overall Rating:** Pass / Partial / Fail
- **Findings:**
  - [Specific observation with evidence] -- Severity: [0-4]
- **Positive Patterns:** [If applicable]

#### H4: Consistency and Standards
- **Overall Rating:** Pass / Partial / Fail
- **Findings:**
  - [Specific observation with evidence] -- Severity: [0-4]
- **Positive Patterns:** [If applicable]

#### H5: Error Prevention
- **Overall Rating:** Pass / Partial / Fail
- **Findings:**
  - [Specific observation with evidence] -- Severity: [0-4]
- **Positive Patterns:** [If applicable]

#### H6: Recognition Rather Than Recall
- **Overall Rating:** Pass / Partial / Fail
- **Findings:**
  - [Specific observation with evidence] -- Severity: [0-4]
- **Positive Patterns:** [If applicable]

#### H7: Flexibility and Efficiency of Use
- **Overall Rating:** Pass / Partial / Fail
- **Findings:**
  - [Specific observation with evidence] -- Severity: [0-4]
- **Positive Patterns:** [If applicable]

#### H8: Aesthetic and Minimalist Design
- **Overall Rating:** Pass / Partial / Fail
- **Findings:**
  - [Specific observation with evidence] -- Severity: [0-4]
- **Positive Patterns:** [If applicable]

#### H9: Help Users Recognize, Diagnose, and Recover from Errors
- **Overall Rating:** Pass / Partial / Fail
- **Findings:**
  - [Specific observation with evidence] -- Severity: [0-4]
- **Positive Patterns:** [If applicable]

#### H10: Help and Documentation
- **Overall Rating:** Pass / Partial / Fail
- **Findings:**
  - [Specific observation with evidence] -- Severity: [0-4]
- **Positive Patterns:** [If applicable]

---

### Violation Register

| ID  | Heuristic | Finding Description                    | Severity | Frequency | Core Task? | Priority Score |
|-----|-----------|----------------------------------------|----------|-----------|------------|----------------|
| V01 | H[X]      | [Concise, specific description]        | [0-4]    | H/M/L     | Yes/No     | [X.X]          |
| V02 | H[X]      | [Concise, specific description]        | [0-4]    | H/M/L     | Yes/No     | [X.X]          |
(Sorted by Priority Score descending)

---

### Prioritized Remediation Plan

| Rank | ID(s)    | Fix Description                              | Effort | Impact | Type           |
|------|----------|----------------------------------------------|--------|--------|----------------|
| 1    | V[X]     | [Specific, actionable change to make]        | S/M/L  | H/M/L  | Quick Win / Redesign / Copy |
| 2    | V[X]     | [Specific, actionable change to make]        | S/M/L  | H/M/L  | [Type]         |

(Group violations that share a single fix. Identify Quick Wins explicitly.)

---

### Strengths

| Heuristic | Strength Description                                   |
|-----------|--------------------------------------------------------|
| H[X]      | [Specific positive pattern and why it works well]      |
| H[X]      | [Specific positive pattern and why it works well]      |

---

### Strategic Recommendations

1. **[Recommendation title]:** [2-4 sentences explaining the recommendation, which violations it addresses, and the expected user impact]
2. **[Recommendation title]:** [2-4 sentences]
3. **[Recommendation title]:** [2-4 sentences]

---

### Suggested Next Steps

- [ ] Validate severity 3-4 findings with usability testing (5 users will uncover ~85% of issues, per Nielsen's formula)
- [ ] Bring Quick Wins into the next sprint without additional research
- [ ] Raise H[X] findings with content/copy team for terminology review (if applicable)
- [ ] Re-audit after remediation to verify improvements and catch regressions
```

---

## Rules

1. **Evaluate all 10 heuristics, always.** Mark heuristics with no violations as "Pass" with a one-sentence rationale. Skipping heuristics signals an incomplete audit and undermines report credibility. Never omit a heuristic because it seems obviously fine.

2. **Every finding must receive a numeric severity (0-4).** Never use qualitative adjectives alone ("somewhat problematic," "a bit confusing"). The severity number allows findings to be compared across heuristics and tracked over time.

3. **Calibrate severity to actual task impact, not evaluator instinct.** Ask: "Does this prevent task completion (4), seriously impair it (3), mildly impair it (2), or cause no functional impairment (1-0)?" Severity inflation is the most common heuristic evaluation error. A beautiful product with bad microcopy is not full of severity-4 issues.

4. **Sort remediation by composite priority score, not by heuristic number and not by evaluator preference.** A severity-2 violation on a core task used by 80% of users outranks a severity-3 violation on a feature used by 5% of users.

5. **Every violation needs a specific fix, not a problem restatement.** "The error message is unhelpful" is a finding description. The fix must be: "Replace 'Invalid input' with 'Your email address must include an @ symbol -- for example, name@domain.com.'" The fix should be concrete enough that a developer could implement it without a follow-up design meeting.

6. **Group violations that share a single fix.** If three violations are all resolved by "add a design system component for inline form validation," list them as one remediation item with multiple violation IDs. Fragmented remediation lists obscure implementation efficiency.

7. **Distinguish between heuristic violations and design preferences.** A personal preference for flat design over skeuomorphic design is not a usability violation. Document only violations that have evidence of user impact, and flag when a finding is based on evaluator judgment vs. observed user behavior.

8. **State all frequency estimates explicitly as evaluator judgment when user data is absent.** If there are no analytics, session recordings, or usability test results, write "Frequency: estimated high -- recommend validating with analytics." Do not present judgment-based frequency estimates as facts.

9. **Never invent interface details.** If the user has provided insufficient information to evaluate a heuristic, write "Insufficient information to assess -- recommend [specific method: moderated usability test, analytics review, stakeholder interview]." Making up interface behavior to complete an audit is actively harmful.

10. **Include at least 3 and no more than 7 strengths.** Fewer than 3 suggests bias toward negativity or insufficient analysis of positive patterns. More than 7 suggests the evaluator is praising ordinary functionality rather than identifying genuinely strong design decisions.

11. **Effort estimates (S/M/L) must account for design system maturity.** An S fix in a mature design system (existing components, documented patterns) may be an M or L fix in a product with no design system. Ask about design system status if it affects more than 2-3 effort estimates.

12. **Do not conflate H1 (status feedback) with H9 (error recovery).** Status feedback tells users what the system is doing in normal operation. Error recovery messaging appears after something goes wrong. A missing loading spinner is H1. An unhelpful error message is H9. Misclassification creates duplicate findings and weakens the analysis.

---

## Edge Cases

### Static Screenshot or Image-Only Audit
When evaluating from screenshots alone, only H2, H4, H6, and H8 can be assessed with confidence from static images. H1 (requires observing state transitions), H3 (requires testing undo/exit paths), H5 (requires attempting to trigger errors), H7 (requires testing shortcuts and efficiency features), H9 (requires triggering error states), and H10 (requires locating help mechanisms) are all interaction-dependent. For these heuristics, write: "Cannot assess from static image. Recommended validation: [specific method -- e.g., 'interact with the live prototype to trigger an error state and observe the recovery message.']" Do not fabricate behavioral findings from static images. The screenshot-only audit should note its limited scope prominently in the Audit Summary.

### CLI Tools, Chatbots, and Text-Only Interfaces
Adapt all heuristics to the text/command paradigm. H1 becomes response latency indicators and operation progress messages. H2 becomes command naming conventions -- do commands use verb-noun pairs that match user mental models (e.g., `git commit` rather than `git finalize`)? H4 becomes consistent command syntax and flag conventions (are all flags `--long-form` and `-s` short form consistently?). H6 becomes command discoverability -- does the tool offer help, autocomplete, or suggested commands? H7 becomes support for command history, aliases, piping, and scripting. H8 becomes output verbosity -- does the tool output only what the user needs by default, with `--verbose` for more? H9 becomes error message quality for invalid commands. Skip purely visual sub-checks within heuristics (e.g., icon legibility in H6) and replace them with text equivalents.

### Comparison Audit (Current vs. Proposed Design)
Structure the Heuristic Evaluation table with three columns: Current, Proposed, and Delta (Improved / Regressed / Unchanged). Calculate separate severity distributions for each design. The remediation plan applies to the proposed design only, listing any regressions as high-priority items alongside any unresolved violations inherited from the current design. Flag any new violations introduced by the redesign explicitly -- redesigns commonly improve targeted flows while inadvertently degrading adjacent ones (e.g., a navigation overhaul that improves H4 globally while creating new H6 violations in a specific section).

### Micro-Audit (Single Feature or Targeted Flow)
When auditing a narrow scope -- a single modal, a checkout step, a specific form -- restrict evaluation depth to the 3-5 heuristics most relevant to that surface type. For forms: prioritize H5 (error prevention), H9 (error recovery), H1 (submission feedback), and H2 (label language). For data tables: prioritize H7 (filter/sort efficiency), H6 (recognition), and H8 (information density). For onboarding flows: prioritize H1 (progress visibility), H3 (freedom to skip/exit), and H6 (recognition without prior context). Note the limited scope prominently. Do not rate heuristics you didn't evaluate -- leave them blank rather than guessing.

### Evaluating a Product in a Regulated Domain
Healthcare, financial services, legal, and government interfaces have regulatory constraints that override some heuristic recommendations. A confirmation dialog that seems excessive for a consumer app may be legally mandated for a medical device. A settings screen that appears to have unnecessary information density may be meeting regulatory disclosure requirements. Flag these constraints explicitly rather than rating them as violations. Write: "This pattern appears to violate H8 but may be required by [e.g., FDA 21 CFR Part 11 / FINRA disclosure requirements]. Confirm with compliance before recommending removal." This is especially important for H5 (error prevention) and H8 (minimalist design) findings.

### Multi-Platform Audit (Web + iOS + Android)
Each platform has its own design language conventions -- iOS Human Interface Guidelines, Android Material Design, and web browser conventions diverge on navigation patterns, gesture behavior, and control placement. An H4 violation on iOS (tab bar at top instead of bottom) is not a violation on web. Evaluate H4 (consistency and standards) against platform-specific conventions for each platform independently. Identify cross-platform inconsistencies separately as a product-level finding -- divergent interaction patterns between platforms increase cognitive load for users who switch between them, which is an H4 violation at the product level even if each platform individually follows its own conventions.

### Evaluating with No Access to Real Users or Data
When the audit is based entirely on evaluator judgment with no user research, analytics, or usability test data to draw from, add a prominent disclaimer to the Audit Summary: "This report represents expert heuristic evaluation only. Severity and frequency estimates reflect evaluator judgment and have not been validated with user data. All severity-3 and severity-4 findings should be verified through moderated usability testing with [5-8 representative users] before committing to major remediation." Include a Validation Priority column in the Violation Register indicating which findings most urgently need user data to confirm (typically those with effort = L and severity = 3-4).

### Legacy Enterprise Software Audit
Enterprise tools built over many years often have deep usability debt where fixing H4 violations (inconsistency accumulated across years of development by multiple teams) requires systematic effort beyond the scope of a single audit. For legacy products, add a Legacy Debt category to the Violation Register to distinguish between systemic architectural issues (which require a design system or platform unification initiative to resolve) and point-fix violations (which can be addressed individually). Avoid recommending individual fixes for violations that are symptoms of a systemic problem -- instead, recommend the systemic fix and describe it as a strategic initiative in the Strategic Recommendations section.

---

## Example

**Input:** "We need a UX audit of our B2B SaaS dashboard for financial analysts. The main screen shows a data table with 30+ columns of financial metrics, filter controls along the top, a date range picker, an export button, and a sidebar with saved report templates. Users are primarily financial analysts who use this tool daily for 4-6 hours. Main tasks: run ad-hoc data queries, apply filters to narrow results, save and recall report configurations, and export data to CSV or PDF. Known issues: users complain they can't find filters they've already applied, exports sometimes fail silently, and new users take weeks to get proficient."

**Output:**

---

## UX Audit Report: Financial Analytics Dashboard -- Main Data View

### Audit Summary
| Field                  | Value                                                                                                 |
|------------------------|-------------------------------------------------------------------------------------------------------|
| Scope                  | Main dashboard: data table, filter bar, date range picker, export function, saved templates sidebar    |
| Target Users           | Financial analysts, expert domain users, high-frequency (4-6 hrs/day), moderate-high technical literacy |
| Critical Tasks         | 1) Run ad-hoc data queries 2) Apply and manage filters 3) Save/recall report configurations 4) Export data |
| Evaluation Method      | Nielsen's 10 Usability Heuristics (Molich-Nielsen severity scale 0-4)                                  |
| Severity Distribution  | 1 catastrophic | 4 major | 6 minor | 2 cosmetic                                                    |
| Total Violations Found | 13                                                                                                    |
| Quick Wins Available   | 4 (severity 2-3, effort S)                                                                            |

---

### Heuristic Evaluation

#### H1: Visibility of System Status
- **Overall Rating:** Fail
- **Findings:**
  - Export function fails silently -- no error message, no status indicator, no notification when the export process does not complete successfully. Users are unaware the export failed until they check their downloads folder and find nothing. -- Severity: 4
  - Data table shows no loading indicator when filters are applied and results are being fetched. For queries with > 5,000 rows, fetch time exceeds 2 seconds with no feedback. Users reported clicking "Apply" multiple times, stacking duplicate requests. -- Severity: 3
  - Date range picker shows no indication of the currently active date range after it is set and the picker is closed. Users must re-open the picker to verify the active range. -- Severity: 2
- **Positive Patterns:** The data table shows a row count in the table footer ("Showing 1,247 results"), which gives users clear status on query scope.

#### H2: Match Between System and Real World
- **Overall Rating:** Partial
- **Findings:**
  - Filter control labels use internal database column names rather than the analyst's domain terminology. "acct_rev_adj_wkd" instead of "Adjusted Working Capital Revenue" creates a translation burden for every filter selection. -- Severity: 3
  - Export button labels read "Export Format A" and "Export Format B" rather than "Export to CSV" and "Export to PDF." -- Severity: 2
- **Positive Patterns:** Column headers in the data table use financial industry-standard abbreviations (EBITDA, P/E Ratio, YTD) consistent with analyst expectations. Date range presets (MTD, QTD, YTD, LTM) match the domain vocabulary precisely.

#### H3: User Control and Freedom
- **Overall Rating:** Partial
- **Findings:**
  - Applying a saved template overwrites all current filter selections without a confirmation step and without an undo mechanism. A user who accidentally clicks a template during a complex ad-hoc analysis loses all their current configuration. -- Severity: 3
  - No "Reset Filters" button. Clearing all applied filters requires removing each filter individually, which is 8-12 clicks for a typical analysis configuration. -- Severity: 2
- **Positive Patterns:** Individual filter chips can be removed with a single click. Column sort order can be reversed by clicking the header again, with no destructive consequence.

#### H4: Consistency and Standards
- **Overall Rating:** Partial
- **Findings:**
  - Three different interaction patterns are used to apply filters: dropdown select (for categorical filters), a range slider (for numeric filters), and a free-text input with manual entry (for date filters), despite a date range picker component existing on the same screen. -- Severity: 2
  - The "Save Template" action uses a floppy disk icon in the main toolbar but a "Save Report" text label in the sidebar. Same action, two representations, neither cross-references the other. -- Severity: 2
- **Positive Patterns:** Primary action buttons consistently use a high-contrast filled style. Secondary actions consistently use outlined buttons. Destructive actions are not present on this screen, so no destructive/safe styling confusion exists.

#### H5: Error Prevention
- **Overall Rating:** Partial
- **Findings:**
  - The export function does not validate whether the current filtered dataset is within the export size limit before initiating the export. Exports over 100,000 rows silently fail (also an H1 violation). Showing a warning -- "Your current filter returns 142,000 rows. Export limit is 100,000 rows. Apply additional filters or split this export." -- would prevent the failure entirely. -- Severity: 3
  - Template overwrite on load (described in H3) lacks a confirmation step, qualifying as both an H3 and H5 violation -- users can prevent their own data loss. -- Severity: 3 (logged under H3; flagged here for remediation bundling)
  - Filters that return zero results are applied silently, leaving the user with a blank table. A zero-result preview warning ("This filter combination returns 0 results") before the filter is applied would prevent the confusion. -- Severity: 2
- **Positive Patterns:** Date range picker correctly disables future dates beyond today, preventing invalid date range selection.

#### H6: Recognition Rather Than Recall
- **Overall Rating:** Fail
- **Findings:**
  - Currently applied filters are not persistently visible after the filter bar is scrolled out of view. Users who scroll down through a long table lose sight of their active filter state, requiring scroll-back or memory of applied filters -- a recall burden for complex multi-filter configurations. -- Severity: 3
  - The 30+ column table provides no column grouping, pinning, or column visibility controls. Users must scroll horizontally to locate columns, relying on memory of column positions that change between sessions. -- Severity: 3
  - The saved templates sidebar shows template names only, with no preview of what filters or columns are configured in each template. Users must load a template to discover its contents. -- Severity: 2
- **Positive Patterns:** The filter bar surfaces all available filter dimensions without requiring users to know filter names in advance -- good recognition support for filter discovery.

#### H7: Flexibility and Efficiency of Use
- **Overall Rating:** Fail
- **Findings:**
  - No keyboard shortcuts for any primary actions. For analysts using this tool 4-6 hours daily, absence of shortcuts for Apply Filter (common action), Export, and column navigation creates significant efficiency loss. -- Severity: 3
  - No bulk column visibility controls ("Show All," "Hide All," "Reset to Default View"). Each column must be shown/hidden individually. -- Severity: 2
  - No ability to save a partial filter configuration as a starting point (distinct from saving a full report template). Analysts who build variations on a base configuration must rebuild from scratch each time. -- Severity: 2
  - Exported file is always named "export_[timestamp].csv" with no option to name the file at export time or inherit the template name. -- Severity: 1
- **Positive Patterns:** Saved templates provide a solid efficiency foundation for recurring reports. Column sort is accessible via header click. Date range presets (MTD/QTD/YTD) reduce repetitive date entry.

#### H8: Aesthetic and Minimalist Design
- **Overall Rating:** Partial
- **Findings:**
  - The filter bar shows all available filter dimensions simultaneously (estimated 14-18 filter controls), regardless of whether most are relevant to the current analysis context. This creates choice overload and makes the most-used filters harder to locate. -- Severity: 2
  - The sidebar displays "Recently Used Templates," "Shared Templates," "My Templates," and "System Templates" in four separate sections with no collapse controls, consuming significant horizontal space regardless of usage. -- Severity: 1
- **Positive Patterns:** The data table itself is clean and dense without being cluttered -- appropriate information density for expert financial analyst users who prefer data-dense displays over consumer-style sparse layouts.

#### H9: Help Users Recognize, Diagnose, and Recover from Errors
- **Overall Rating:** Fail
- **Findings:**
  - Silent export failure (described in H1) provides zero recovery path. Users do not know whether to retry, reduce the dataset, or report a bug. -- Severity: 4 (same violation as H1/V01 -- rated here for cross-heuristic flagging; not double-counted in violation register)
  - Zero-result filter states display a blank table with no message explaining why the table is empty or suggesting a corrective action (e.g., "No results match your current filters. Try removing the 'Revenue > $1B' filter to broaden your results."). -- Severity: 3
  - Session timeout causes silent data loss of unsaved filter configurations. The timeout error message ("Your session has expired. Please log in again.") does not offer to restore the user's pre-timeout state. -- Severity: 3
- **Positive Patterns:** Filter validation (described in H5) correctly prevents future date selection, which also prevents a class of H9 errors related to invalid date ranges.

#### H10: Help and Documentation
- **Overall Rating:** Partial
- **Findings:**
  - No tooltips or contextual help for the internal-named filter dimensions (e.g., hovering over "acct_rev_adj_wkd" should show a tooltip with the full name and definition). This compounds the H2 terminology violation. -- Severity: 2
  - No onboarding or guided tour for new users. Known issue from the user brief: new users take weeks to become proficient. No progressive disclosure or workflow guidance accelerates this. -- Severity: 2
- **Positive Patterns:** The sidebar template system implicitly serves as institutional knowledge transfer -- shared templates from experienced analysts help new users get started with pre-built configurations.

---

### Violation Register

| ID  | Heuristic   | Finding Description                                                                    | Severity | Frequency | Core Task? | Priority Score |
|-----|-------------|----------------------------------------------------------------------------------------|----------|-----------|------------|----------------|
| V01 | H1, H9      | Export fails silently -- no error state, no recovery path                              | 4        | H         | Yes        | 9.0            |
| V02 | H6          | Active filters not visible when filter bar scrolled out of view                        | 3        | H         | Yes        | 6.75           |
| V03 | H9          | Zero-result filter state shows blank table with no explanation or recovery suggestion  | 3        | H         | Yes        | 6.75           |
| V04 | H2          | Filter labels use internal database column names, not analyst domain terminology       | 3        | H         | Yes        | 6.75           |
| V05 | H9          | Session timeout causes silent loss of unsaved filter configuration                    | 3        | M         | Yes        | 4.50           |
| V06 | H1          | No loading indicator during filter query fetch (>2s with no feedback)                 | 3        | H         | Yes        | 6.75           |
| V07 | H5          | Export does not validate row count against export limit before initiating              | 3        | M         | Yes        | 4.50           |
| V08 | H3          | Loading a saved template overwrites current filters with no confirmation or undo       | 3        | M         | Yes        | 4.50           |
| V09 | H7          | No keyboard shortcuts for any primary actions                                          | 3        | H         | Yes        | 6.75           |
| V10 | H6          | Column table has no grouping, pinning, or visibility controls                         | 3        | H         | Yes        | 6.75           |
| V11 | H3          | No "Reset All Filters" control -- clearing requires 8-12 individual clicks             | 2        | H         | Yes        | 3.0            |
| V12 | H8          | Filter bar exposes all 14-18 dimensions simultaneously regardless of analysis context  | 2        | H         | No         | 2.0            |
| V13 | H10         | No tooltips for database-named filter dimensions                                       | 2        | H         | Yes        | 3.0            |

(Sorted by Priority Score descending. V01 elevated to 9.0 due to catastrophic severity.)

---

### Prioritized Remediation Plan

| Rank | ID(s)       | Fix Description                                                                                               | Effort | Impact | Type       |
|------|-------------|---------------------------------------------------------------------------------------------------------------|--------|--------|------------|
| 1    | V01         | Add explicit export status: in-progress spinner, success confirmation with filename, and failure message specifying cause (size limit exceeded / network error / format error) with retry action | S | High | Quick Win |
| 2    | V02         | Add a sticky "Active Filters" summary bar that persists at the top of the table as the user scrolls, showing active filter chips with individual remove controls | M | High | New Component |
| 3    | V03, V12    | When a filter combination returns zero results, display an empty state message: "No results match your current filters." with a "Clear All Filters" action and a suggestion to remove the most restrictive filter | S | High | Quick Win |
| 4    | V04, V13    | Replace internal column names in filter labels with human-readable analyst terminology. Add hover tooltips showing full name, definition, and example value for each filter dimension | M | High | Copy + Component |
| 5    | V06         | Add skeleton loading state or progress bar triggered immediately on filter apply, clearing when results load | S | High | Quick Win |
| 6    | V09         | Implement keyboard shortcut system: Ctrl+Enter to apply filters, Ctrl+E to export, Ctrl+S to save template, Escape to clear active filter focus. Publish shortcut reference accessible via "?" | M | High | New Feature |
| 7    | V07, V08    | Pre-validate export row count before initiating -- show warning modal if over limit. Add confirmation dialog before template load: "Loading '[Template Name]' will replace your current filter configuration. Continue?" with Cancel/Load options | S | High | Quick Win |
| 8    | V10         | Add column management panel: column visibility toggles, column pinning, "Reset to Default" control, and column grouping by category (Income Statement, Balance Sheet, Ratios) | L | High | Redesign |
| 9    | V05         | On session restoration after timeout, attempt to restore last active filter state from session storage. Show notification: "Your session expired. We've restored your last filter configuration." | M | Medium | Engineering |
| 10   | V11         | Add "Clear All Filters" button adjacent to the filter bar, appearing only when 2+ filters are active | S | Medium | Quick Win |

---

### Strengths

| Heuristic | Strength                                                                                                           |
|-----------|--------------------------------------------------------------------------------------------------------------------|
| H2        | Column headers use correct financial abbreviations (EBITDA, P/E, YTD, LTM) -- no translation burden for domain experts |
| H3        | Individual filter chips support single-click removal -- low-friction correction of individual filter choices           |
| H4        | Consistent primary/secondary button styling throughout -- no ambiguity about action hierarchy                         |
| H5        | Date range picker disables future dates, preventing invalid range entry proactively                                    |
| H7        | Saved templates with shared templates provide strong efficiency foundation for recurring analyst workflows              |
| H8        | Data table information density is appropriately high for expert users -- avoids over-simplification for power users    |

---

### Strategic Recommendations

1. **Resolve the silent export failure immediately (V01):** This is the only catastrophic finding and directly damages analyst trust in the tool's reliability. The fix is a Small effort -- adding status feedback and error handling to an existing export flow. This should enter the current sprint regardless of other priorities. The absence of export feedback is the single most likely source of the user complaints referenced in the brief.

2. **Implement a persistent active-filters summary bar (V02, V11):** The inability to see applied filters while viewing data is the root cause of the "can't find filters they've already applied" complaint. A sticky filter summary bar resolves this at medium effort. This is the highest-impact Medium-effort fix in the audit and should follow the quick wins in the next sprint.

3. **Align filter terminology to analyst domain language (V04, V13):** Internal database column names exposed as filter labels create a daily translation burden for every analyst, every session. This is both an H2 and H10 violation and likely the primary contributor to the weeks-long onboarding problem. A terminology mapping exercise (internal names to human-readable labels) combined with definition tooltips will simultaneously reduce new user proficiency time and daily friction for experienced users. Prioritize this as a content/data collaboration task alongside the V02 filter bar work.

---

### Suggested Next Steps

- [ ] Bring V01 (silent export failure) and V03/V05/V07 (quick wins) into the current sprint immediately
- [ ] Schedule a 1-week design sprint for V02 (sticky filter bar) and V04 (terminology alignment)
- [ ] Validate V02 and V10 with 5 representative analyst users via moderated usability testing before committing to the column management panel redesign (L effort)
- [ ] Conduct a content audit with the data team to produce an internal-to-analyst terminology mapping for V04
- [ ] Re-audit the filter and export flows after remediation to verify improvements and check for regressions
