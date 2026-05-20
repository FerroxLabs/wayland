---
name: executive-summary-slide
description: |
  Produces an executive summary slide design with a three-panel layout covering
  situation, insight, and recommendation, including data points for each panel
  and a one-sentence version of each. Use when the user asks to create an
  executive summary slide, a situation-insight-recommendation overview, or
  a one-slide briefing for leadership.
  Do NOT use for full slide deck structure (use slide-deck-structure), pitch
  deck design (use pitch-deck-structure), or data chart selection (use
  data-in-slides).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "presentation template analysis"
  category: "design-creative"
  subcategory: "presentation-design"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Executive Summary Slide

## When to Use

Use this skill when the request is specifically about designing or writing a single executive summary slide -- the concentrated, single-frame artifact used to brief a senior audience on a situation and drive a decision.

**Trigger scenarios:**
- User needs to distill a complex project, initiative, or finding into a single slide for a C-suite or board audience
- User has a recommendation to make and needs to structure the supporting argument in Situation-Insight-Recommendation form
- User is presenting at an executive business review (EBR), monthly operating review (MOR), or quarterly business review (QBR) and needs the opening or closing summary slide
- User must brief a leadership team asynchronously -- via email or Slack -- and needs a one-slide document that stands alone without a presenter
- User needs to prepare the "title slide" of a multi-slide deck that will capture the entire narrative before the supporting detail begins
- User is preparing for a 2-5 minute leadership slot and needs every word on the slide to earn its place
- User has been asked to produce a "one-pager" or "exec brief" and wants it in slide rather than document form

**Do NOT use when:**
- User needs a full multi-slide presentation structure with section flow -- use `slide-deck-structure` instead
- User is building a startup pitch deck for investors -- use `pitch-deck-structure` instead, which uses Problem-Solution-Traction-Ask rather than SIR framing
- User needs to choose or design data visualizations for charts or graphs embedded in slides -- use `data-in-slides` for chart type selection
- User is writing a full executive memo or written briefing document, not a slide -- the layout constraints and density norms are different
- User needs more than one summary slide (e.g., one per workstream in a large program review) -- treat each as a separate invocation of this skill, with a meta-summary slide wrapping them
- User is designing a slide for a general all-hands or town hall -- those audiences require different density, tone, and framing than executive audiences

---

## Process

### Step 1: Extract the Briefing Context

Before writing a single word of slide content, establish the four situational parameters that govern every design decision.

- **Audience authority level:** Identify who will actually see this slide and what they can approve. A department VP can approve budget under $100K; a CFO can approve restructuring; a board approves strategy changes and major capital allocation. The authority level determines how directive the recommendation can be.
- **Decision type:** Classify the decision as one of four types -- (1) Approve/reject a specific recommendation, (2) Choose between defined options, (3) Prioritize competing initiatives, or (4) Acknowledge and note (informational). Every structural choice flows from this classification.
- **Available time on slide:** The inverse relationship between time and text density is absolute. At 30 seconds, the slide must communicate the entire message without the presenter speaking. At 3 minutes, the presenter guides the audience through supporting detail. Design for the actual time, not ideal time.
- **Stakes of the decision:** Low-stakes slides (process improvements, minor tool investments) allow lighter supporting evidence. High-stakes slides (restructuring, major investment, market entry/exit) require every claim to be defensible in a follow-up conversation, even if the backup data lives off the slide.
- **Audience's prior knowledge level:** Establish whether the audience already knows the situation (monthly recurring audience) or is coming cold (new stakeholders, external board members). Prior knowledge determines how much Situation panel text is required -- an audience that already knows the context gets one sentence; a cold audience gets three.

---

### Step 2: Build the Situation Panel

The Situation panel is the factual foundation. It must be uncontestable.

- State the current state in 1-3 sentences, depending on audience prior knowledge. For recurring audiences, one sentence is sufficient. For cold audiences, include the relevant backstory.
- Ground the situation in exactly one primary metric. This is the number that defines "how big is this" -- a rate, a count, a volume, a percentage, or a trend value. Do not include two competing metrics; choose the one that best quantifies the situation's scale.
- Use past or present tense only -- the Situation panel describes what is or what happened, never what will happen. Future-facing language belongs in the Recommendation panel.
- The situation must be something the audience can verify or already believes. If the situation is disputed, flag it explicitly ("as of last quarter's data") rather than asserting it as fact.
- Apply the "headline test": if a financial journalist read only the Situation panel, would they write an accurate factual statement? If yes, the panel is written correctly.
- Avoid loaded or interpretive language in the Situation panel. Words like "alarming," "disappointing," or "excellent" belong in the Insight panel. The Situation is diagnosis, not judgment.

---

### Step 3: Build the Insight Panel

The Insight panel is the analytical layer -- the non-obvious interpretation that the audience could not reach without the presenter's expertise.

- Ask: "What does this situation mean, and what is the single most important reason it is happening?" The answer to that question is the Insight.
- Quantify the insight with a different data point than the Situation metric. The Insight metric explains "why" or "so what" -- root cause data, segmentation findings, benchmarks, or trend projections.
- Apply the "non-obviousness test": if a smart person with no domain expertise could have inferred the Insight from the Situation metric alone, the Insight is not earning its panel. Push deeper.
- The Insight must directly cause the Recommendation to follow. Work backward from the recommendation you intend to make, and ask: "What insight would make this recommendation feel inevitable?" That is the insight to surface.
- Distinguish between correlation insights ("churn is higher in enterprise accounts") and causal insights ("enterprise churn is driven by onboarding failure, confirmed by exit survey data"). Causal insights make stronger slides. Use "because" and "due to" language only when causality is established.
- If the domain requires sensitivity (HR topics, legal exposure, competitive intelligence), the Insight panel must stay factual and avoid speculative language. Note the data source inline: "based on Q3 exit interviews (n=41)."

---

### Step 4: Build the Recommendation Panel

The Recommendation panel converts the analytical work into a directive. This panel is where the slide either succeeds or fails.

- State the specific action in one declarative sentence. Avoid gerunds and conditionals: not "we should consider exploring" but "implement X by date Y."
- Include three components: (1) the action, (2) the expected outcome quantified, and (3) the resource requirement or trade-off. If any of these three are absent, the recommendation is incomplete.
- The recommendation must be within the authority of the audience in the room. If the audience cannot approve the recommendation, reframe the recommendation as: "Requesting that [this audience] escalate approval to [the appropriate authority]."
- For cost-bearing recommendations, include a minimum 2-number ROI construct: investment required and expected return, with timeframe. "Invest $X to recover $Y over Z months" is the minimal acceptable form.
- Anticipate the single most likely objection to the recommendation and defuse it in the detail text, not in a separate panel. One sentence is sufficient: "This does not require headcount changes" or "The vendor contract includes a 90-day exit clause."
- Use future-tense language with specific dates or quarters, not open-ended timelines. "By Q2" is acceptable. "In the coming months" is not.

---

### Step 5: Write the Three One-Sentence Versions

This is the most rigorous step in the process. The three headline sentences are the true content of the slide; everything else is supporting evidence.

- Each one-sentence version must be self-contained and specific -- no pronouns without antecedents, no jargon the audience would not share.
- Read the three sentences in sequence. They must form a causal chain: Sentence 1 establishes the context, Sentence 2 explains what it means, Sentence 3 tells the audience what to do. If a smart 10-year-old could not follow the logic chain, revise until they could.
- Apply the "email subject line test" to each sentence: would this sentence function as a clear, specific email subject line that would cause the right executive to prioritize reading it? A sentence that passes this test is specific enough.
- Eliminate all hedging language from the one-sentence versions: "potentially," "may," "could," "might" -- these are off the slide. If uncertainty is material, it belongs in the decision prompt footnote, not in the headline sentences.
- Keep each sentence under 25 words. If a sentence requires more than 25 words, it contains more than one idea. Split the ideas and keep the more important one.
- After writing the three sentences, read only them -- without any of the detail text -- and confirm the entire argument is intelligible. If it is not, the detail text is doing work that the headline sentences should be doing.

---

### Step 6: Assign and Validate the Supporting Data Points

Each panel requires exactly one primary metric displayed as a large data callout. The metrics across all three panels must tell a coherent three-number story.

- **Metric selection hierarchy:** Prefer (1) monetary values (revenue, cost, margin) because they translate directly to business impact; (2) rates and percentages because they normalize for scale; (3) absolute counts because they show magnitude but require context; (4) index values and scores only when the audience understands the scale.
- **Metric specificity rule:** Round to the precision that is defensible, not the precision that sounds impressive. "$380K" is correct if the actual number is $383,200. "$383,200" is correct only in a financial close report. Rounding appropriately signals confidence and professional judgment.
- **Three-metric coherence check:** The three metrics must not contradict each other or require math the audience cannot do in their head. If the metrics are $2M problem, 68% root cause attribution, and $150K solution, the audience can instantly verify the math makes sense. If the metrics are $2M problem, 4.2-hour cycle time, and 9.5x ROI, the audience cannot connect the dots without the presenter -- that is a weak three-number story.
- **No orphan data:** Any number that appears on the slide must appear in one of three places -- the data callout in a panel, the one-sentence headline for a panel, or the decision prompt. Numbers floating in body text without emphasis are invisible to executive readers.

---

### Step 7: Write the Slide Headline

The slide headline is the single most important sentence on the slide. It is not a title; it is an argument.

- The headline goes above the three panels and is the largest non-metric text on the slide.
- It must express the core argument in one sentence: the situation is X, therefore do Y. The word "therefore" or its logical equivalent must be implicit in the construction.
- Use the format: "[Situation summary] -- [Recommendation action]." This construction forces the headline to be prescriptive, not merely descriptive.
- The headline must be written last, after the three panels are complete, because it synthesizes all three panels rather than introducing them.
- Avoid titles like "Q3 Engineering Update" or "Code Review Automation Overview" -- these are category labels, not arguments. An executive reading only the headline should be able to act on it without reading the panels.
- If the headline cannot be written until the panels are finished, that is expected and correct. If a headline can be written before the panels exist, it is likely a category label rather than an argument.

---

### Step 8: Write the Decision Prompt and Specify Layout

The decision prompt and the layout specification are distinct tasks, but both close out the slide.

- **Decision prompt:** Place at the bottom of the slide in a visually distinct zone (full-width bar, rule-separated footer, or callout box). It must state exactly one of: (A) a specific approval request with a dollar figure and timeline, (B) a discussion question framed as a binary or forced-choice, or (C) an explicit "no action required -- for awareness" statement. Ambiguity in the decision prompt is the most common failure mode of executive slides.
- **Layout specification:** Three-column is the default for SIR frames -- it places all three panels in a single field of view, enabling immediate comparison. Three-row (stacked) is used when each panel requires more text and the audience will read top-to-bottom in sequence rather than scan horizontally. Choose three-column for recommendations requiring approval; three-row for complex analysis where each panel builds on the previous.
- **Visual coding:** Use a deliberate three-color language. Neutral (gray or slate) for Situation -- it is factual and non-alarming. Amber or yellow for Insight -- it signals "pay attention, this is the interpretation." Green for Recommendation -- it signals forward motion and action. This color coding is not decorative; it is a scanning guide for executives who look at slides before reading them.
- **Data callout sizing:** The primary metric in each panel must be the largest number on the slide, displayed at 28-36pt, bold, and centered in the panel. The panel headline sentence is 18-22pt. Body text is 14-16pt. This sizing hierarchy is non-negotiable -- it forces the executive eye to land on the data before the prose.
- **White space budget:** Allocate a minimum of 25% of each panel's area to white space. Dense panels are read less carefully than open ones. If adding text requires violating the white space budget, cut text, not white space.

---

## Output Format

```
## Executive Summary Slide: [Topic]

**Audience:** [Role titles of the people in the room or receiving this slide]
**Authority Level:** [What this audience can approve: dollar threshold, decision type]
**Decision Type:** [Approve/reject | Choose between options | Prioritize | Informational]
**Presenter Time:** [Seconds or minutes available on this slide]
**Audience Prior Knowledge:** [Cold (new context) | Warm (some background) | Deep (recurring audience)]

---

### Slide Headline

"[One declarative sentence, under 30 words, that expresses: situation → therefore → recommendation]"

---

### Three-Panel Content

#### Panel 1: Situation
**One-sentence version (≤25 words):** [Factual statement of the current state, specific and uncontestable]
**Supporting detail (2-3 sentences):** [Context that grounds the situation -- what is happening, for how long, at what scale]
**Primary metric:** [Number] -- [Label: what this number measures and over what period]
**Metric type:** [Revenue | Rate | Count | Percentage | Index]

#### Panel 2: Insight
**One-sentence version (≤25 words):** [Analytical interpretation -- what the situation means, not what it is]
**Supporting detail (2-3 sentences):** [The "so what" -- root cause, benchmark comparison, trend direction, or segment finding]
**Primary metric:** [Number] -- [Label: what this number measures and what it proves]
**Non-obviousness check:** [One sentence confirming this insight is not self-evident from the situation alone]

#### Panel 3: Recommendation
**One-sentence version (≤25 words):** [Declarative action statement with timeline]
**Supporting detail (2-3 sentences):** [Action + expected outcome + resource requirement. Preempt the top objection in one sentence.]
**Primary metric:** [Number] -- [Label: ROI, cost, projected impact, or payback period]
**Authority check:** [Confirm this recommendation is within the decision authority of the audience listed above]

---

### Three-Number Story Check

| Panel | Metric | What It Proves |
|-------|--------|---------------|
| Situation | [metric] | [what it establishes] |
| Insight | [metric] | [what it explains] |
| Recommendation | [metric] | [what it justifies] |

**Coherence note:** [One sentence confirming the three metrics form a logical chain without requiring arithmetic the audience cannot do mentally]

---

### Slide Headline Sentence (Final Version)

"[Final headline -- written after panels are complete, synthesizes all three]"

---

### Decision Prompt

**Type:** [Approval request | Discussion question | Informational]
**Text:** "[Exact language to appear at the bottom of the slide -- specific dollar figure, specific timeline, or explicit 'no action required' statement]"

---

### Layout Specification

| Element | Specification |
|---------|--------------|
| Panel structure | [3 columns (default for approval slides) | 3 rows (for complex analysis)] |
| Slide headline | Top of slide, full width, left-aligned, 28-32pt bold |
| Panel headers | 20-24pt, color-coded per color scheme below |
| One-sentence versions | 16-18pt bold, immediately below panel header |
| Body text | 14-16pt, regular weight |
| Primary metric callout | 28-36pt bold, centered in panel, above body text |
| Decision prompt | Bottom of slide, full-width bar, 16-18pt bold |
| Situation panel color | Neutral gray (#6B7280 or equivalent) |
| Insight panel color | Amber/yellow (#D97706 or equivalent) |
| Recommendation panel color | Action green (#059669 or equivalent) |
| White space budget | Minimum 25% of each panel area |
| Confidentiality label | Top-right corner, 10pt, if required |

---

### Backup Slide Notes

[List 2-4 items that belong on backup slides rather than this summary slide -- methodology notes, data source citations, alternative options considered, detailed financial models. These items must NOT appear on the executive summary slide itself.]
```

---

## Rules

1. **The SIR framework is non-negotiable at three panels.** Never add a fourth panel for "background," "methodology," or "alternatives." Any content that does not fit into Situation, Insight, or Recommendation belongs on a backup slide. Adding panels is the most common mistake made when presenters do not trust their audience to ask follow-up questions.

2. **Every panel requires exactly one primary metric displayed as a large callout.** A panel without a metric is opinion. A panel with two competing metrics creates cognitive load and signals the presenter has not decided what matters most. Choose one number per panel, make it the largest non-headline text in that panel, and cut the rest.

3. **The three one-sentence panel versions must form a complete argument when read without any supporting text.** Test this by reading only the three one-sentence versions aloud. If the argument is incomplete, the sentences are descriptions, not arguments. Revise until the three sentences alone could justify the decision.

4. **The slide headline is an argument, not a title.** It must express a complete thought with a logical connection between situation and action. "Q3 Performance Review" is a title. "Customer acquisition cost has exceeded lifetime value in the SMB segment -- recommending exit from SMB new sales by Q2" is a headline. Titles add no value on a single-slide summary.

5. **Specificity is mandatory for all numbers.** "$380K" not "significant revenue loss." "68%" not "most customers." "4.2 hours" not "several hours." Unspecific numbers signal that the presenter does not know the actual data, which destroys credibility with executive audiences faster than any other single failure.

6. **The Recommendation must be within the decision authority of the audience on the slide.** If the audience cannot approve the recommendation, the slide is misaddressed. Either change the recommendation to what this audience CAN approve (e.g., "proceed to board vote") or change the audience designation. Mismatched authority is the second most common executive slide failure mode.

7. **The decision prompt is required on every executive summary slide, including informational ones.** "No action required -- for awareness only" is a valid decision prompt. An absent decision prompt forces the audience to figure out what is being asked of them, which is the presenter's job, not the audience's.

8. **Color coding across the three panels must follow the neutral-amber-green convention or a deliberate equivalent.** Do not use the same color for all three panels. The color coding is a scanning guide that allows executives to orient themselves in under two seconds. Using red for the Recommendation panel will cause the audience to treat the recommendation as a warning rather than a directive.

9. **The Insight panel must fail the "obvious test."** Before finalizing the Insight, ask: "Would every person in this room have reached this conclusion from looking at the Situation metric alone?" If yes, the Insight is not an insight -- it is a restatement of the situation. The analytical value of the slide lives entirely in this panel; if it fails the obvious test, the entire slide fails.

10. **Backup data must not appear on the executive summary slide itself.** Detailed methodology, source citations, raw data tables, and alternative options belong on backup slides that the presenter is prepared to show if asked. Putting this content on the summary slide increases reading time, reduces impact, and signals that the presenter does not trust the strength of the argument. If the argument requires footnotes to be credible, the argument is not ready to be the headline.

---

## Edge Cases

### Case 1: The Situation Is Disputed

Some executive audiences will contest the Situation metric before the presenter can reach the Recommendation. This typically happens when the Situation data reflects unfavorably on a function the audience leads, or when the data source is internal and contested.

- Preempt the dispute by stating the data provenance in the Situation panel detail text: "Source: CRM export as of November 1; reviewed by Finance." One attribution sentence prevents 10 minutes of methodology debate.
- If the dispute is material and unresolved, do not present the slide until alignment on the Situation metric is reached. A disputed Situation metric makes the Insight and Recommendation undefendable.
- Consider phrasing the Situation metric as a range rather than a point estimate: "Between $320K and $420K in annual churn risk" signals honest uncertainty without undermining the argument.
- Move the disputed metric to the Insight panel and use a less-contested metric in the Situation panel. The Insight panel is analytically positioned and better tolerates "this is our interpretation" language.

---

### Case 2: Good News Slide (No Problem to Solve)

The SIR framework is designed around a problem structure, but executive audiences also require achievement briefings, milestone summaries, and strategic win communications. The framework adapts without breaking.

- Rename the panels: "Achievement" (what happened and how significant), "Why It Matters" (strategic impact and what it unlocks), "Next Move" (how to capitalize on the momentum).
- The one-sentence chain becomes: "[We achieved X.] [This matters because Y.] [To capitalize, we will do Z.]"
- The Insight/Why It Matters panel is where the slide adds real value on a good-news brief -- most good-news slides stop at achievement and fail to make the strategic case. The "why it matters" must connect the achievement to a business outcome the audience cares about, not just to team satisfaction.
- The Recommendation/Next Move panel on a good news slide is the least obvious but most important: it prevents the achievement from feeling like a closing chapter and instead frames it as a launchpad. Always include it.

---

### Case 3: Multiple Options (No Single Recommendation)

When the analysis produces two or three viable paths rather than a clear winning recommendation, the Recommendation panel must be restructured rather than collapsed into ambiguity.

- Rename Panel 3 to "Options" and present up to three alternatives, each with: (1) the action in one sentence, (2) the cost or resource requirement, and (3) the expected outcome. Use a mini-table or three sub-bullets.
- Mark the recommended option with a "Recommended" label or highlight in a different color. The presenter must have a preferred option even in an options frame -- "we recommend Option 2, but are bringing Options 1 and 3 for your input" is a legitimate and respectful framing for an executive audience.
- If the presenter genuinely has no preference between options, that is a signal the analysis is incomplete. An options slide without a recommendation signals to executives that the team cannot make decisions, which undermines credibility. Push for a recommendation even if it is provisional.
- Keep the three-number story intact: one metric per option in the Options panel, with the recommended option's metric as the primary callout.

---

### Case 4: Asynchronous Delivery (Emailed or Shared Without Presenter)

An executive summary slide sent via email or shared in a document management system must function as a complete communication without a presenter voice to fill gaps.

- Increase each panel's body text by one sentence -- from 2 sentences to 3 -- since the reader controls pace and there is no time pressure to keep text minimal.
- Add data source citations in 10pt text below each panel's primary metric. Asynchronous readers cannot ask "where does this number come from?" and will lose confidence in the slide if the source is not shown.
- Add a "Questions? Contact [name, role, contact method]" footer. Without a presenter, the decision prompt must include a path to the decision-maker.
- Add a date stamp to the slide header: "As of [Date]." Undated asynchronous slides create confusion about whether the data is current.
- Do NOT add explanatory paragraphs to compensate for the missing presenter. The correct response to asynchronous delivery is to make each sentence more precise, not more numerous. If the slide requires extensive prose to be understood, it should be a written memo, not a slide.

---

### Case 5: Highly Sensitive or Confidential Content

Slides containing personnel decisions, M&A activity, regulatory findings, or competitive intelligence require modifications to both content and structure.

- Add a classification label ("Confidential -- Board Only," "Privileged and Confidential -- Attorney-Client Communication") in the top-right corner at 10-12pt. Do not embed the classification in the slide title -- it must be visible as a header element.
- Replace exact financial figures with ranges or indexed values if the slide may be photographed, projected in a room with unintended viewers, or included in meeting minutes that circulate broadly. "$350K-$420K" instead of "$383,200."
- Remove named individuals from the Recommendation panel if the recommendation involves personnel. Use role titles: "the SVP of Sales role" rather than the person's name.
- In the decision prompt, specify distribution restrictions: "Not for distribution beyond this meeting." This is a legal and professional courtesy that protects both the presenter and the organization.
- For M&A and legal matters, confirm with legal counsel before finalizing the Insight language. Specific analytical claims about a target company or a regulatory finding may carry legal implications if the slide is later disclosed.

---

### Case 6: The Audience Will Not Have Time to Read the Slide

In some executive settings -- particularly standing briefings, corridor conversations, or back-to-back review meetings -- the presenter will have 60 seconds or less on the slide, and the audience may be distracted or only partially engaged.

- Design for the 10-second scan: the three primary metrics and the slide headline must tell the complete story without any body text. Place metrics at the top of each panel, not the bottom.
- Increase headline font to 32pt and metric callout font to 40pt. Reduce body text to 12pt or remove it entirely, moving it to a backup slide note.
- Reduce the one-sentence panel versions to half-sentences: "Review cycle time: 4.2 hours" (Situation), "Pilot reduced time 50%" (Insight), "Rollout costs $8,160/year, returns $78K" (Recommendation). These are scanning anchors, not full prose.
- Prepare a verbal script that covers the three panels in 45 seconds. The slide is the visual anchor for the verbal delivery, not the primary content vehicle.
- After the meeting, send the full asynchronous version (Case 4) to the audience as a follow-up so the detail is available for reference.

---

### Case 7: The Situation and Insight Are the Same Thing

This is the most common structural failure in executive slide writing. It occurs when the writer conflates describing the problem with explaining the problem.

- Apply the acid test: "Could the Situation panel be published in a press release as fact?" and "Does the Insight panel require analytical expertise to produce?" If the answer to the first question is yes and the second is yes, the panels are correctly separated. If both feel like facts, the Insight has collapsed into Situation.
- Typical incorrect Insight: "Customer churn is increasing and if it continues we will lose more revenue." This is a projection of the Situation, not an insight. It adds no analytical value.
- Corrected Insight: "Exit interviews show 68% of churned customers cited onboarding failure -- not product or price -- meaning churn is solvable with a process change, not a product change." This is non-obvious, causal, and directly enables the Recommendation.
- When the Situation and Insight feel identical, push the analysis deeper. The Insight must answer: "Why is this happening?" or "What does this pattern mean for our strategy?" or "What would change if we understood this correctly?"

---

## Example

**Input:**
"We run a regional hospital network. Across 6 hospitals, ED wait times have increased from 38 minutes to 71 minutes over 18 months. We analyzed it and found the main driver is boarding -- patients who are admitted but stuck in the ED waiting for inpatient beds. Our proposed solution is a real-time bed management dashboard that shows bed availability and predicted discharge times. We piloted it in one hospital for 3 months and reduced boarding wait from 4.1 hours to 1.8 hours. Cost to deploy across all 6 hospitals is $220,000 (one-time) plus $30,000/year maintenance. We need approval from the Chief Operating Officer and Chief Medical Officer."

---

**Output:**

## Executive Summary Slide: Real-Time Bed Management System -- Network-Wide Deployment

**Audience:** Chief Operating Officer, Chief Medical Officer
**Authority Level:** Capital expenditure approval up to $500K (single-year); operational technology deployment
**Decision Type:** Approve/reject a specific recommendation
**Presenter Time:** 3 minutes
**Audience Prior Knowledge:** Warm -- both leaders are aware ED wait times have risen; neither has seen the pilot data

---

### Slide Headline

"ED boarding is the primary driver of a 33-minute wait time increase -- pilot data confirms a $220K bed management system can cut boarding time by 56% across all six hospitals."

---

### Three-Panel Content

#### Panel 1: Situation
**One-sentence version (≤25 words):** Average ED wait time across the network has risen from 38 to 71 minutes over 18 months -- a 87% increase.
**Supporting detail:** The network's 6 EDs processed 312,000 visits last year. Patient satisfaction scores (HCAHPS) for ED wait time have declined from the 61st to the 39th percentile nationally. Extended wait times are now a contributing factor in 3 active patient complaint escalations and two regulatory inquiries.
**Primary metric:** 71 minutes -- current average ED wait time, network-wide (up from 38 min, 18 months ago)
**Metric type:** Rate (time-based average)

---

#### Panel 2: Insight
**One-sentence version (≤25 words):** Boarding -- admitted patients waiting in the ED for inpatient beds -- accounts for 74% of excess wait time, and it is operationally solvable.
**Supporting detail:** Analysis of 6 months of ED flow data identified that boarding patients occupy an average of 3.2 ED beds at any given time across the network. The root cause is not bed shortage but information latency: charge nurses cannot see real-time bed availability or predicted discharge times, causing manual coordination delays of 2-4 hours. Competing factors (staffing, acuity) account for the remaining 26% of wait time increase and are being addressed separately.
**Primary metric:** 74% -- share of excess ED wait time attributable to boarding delays
**Non-obviousness check:** The insight that boarding is an information problem rather than a capacity problem is non-obvious and counter to the typical executive assumption that longer waits mean the hospital needs more beds.

---

#### Panel 3: Recommendation
**One-sentence version (≤25 words):** Deploy real-time bed management dashboards across all 6 hospitals by Q2 at a one-time cost of $220K, based on validated pilot results.
**Supporting detail:** A 3-month pilot at St. Luke's (the network's highest-volume hospital) reduced boarding wait time from 4.1 hours to 1.8 hours -- a 56% reduction -- with no additional staffing. Network-wide deployment requires $220,000 in one-time implementation and training costs plus $30,000 annually for software maintenance. At the piloted impact rate, network-wide ED wait times are projected to fall from 71 minutes to approximately 48 minutes, returning the network to the 58th national HCAHPS percentile. This deployment does not require new headcount or changes to nursing staff ratios.
**Primary metric:** 56% reduction in boarding wait time -- validated in 3-month, single-site pilot (4.1 hrs → 1.8 hrs)
**Authority check:** COO and CMO together hold joint approval authority for operational technology investments up to $500K. This deployment at $220K + $30K/year is within their combined authority.

---

### Three-Number Story Check

| Panel | Metric | What It Proves |
|-------|--------|----------------|
| Situation | 71 minutes (up from 38) | The problem is large and growing -- an 87% deterioration in 18 months |
| Insight | 74% of excess wait time from boarding | The problem has a primary, identifiable, addressable root cause |
| Recommendation | 56% boarding reduction validated in pilot | The solution works at scale in our own operating environment |

**Coherence note:** The audience can follow the logic in one pass: wait times nearly doubled, 74% of the increase traces to boarding, and the pilot showed a 56% boarding reduction -- the math strongly supports approval without requiring the audience to perform any mental calculations.

---

### Slide Headline (Final Version)

"ED wait times have nearly doubled in 18 months due to boarding delays -- a validated $220K bed management deployment can recover 23 minutes of average wait time across all six hospitals."

---

### Decision Prompt

**Type:** Approval request
**Text:** "Requesting COO and CMO approval: $220,000 one-time capital expenditure + $30,000/year for real-time bed management deployment across 6 hospitals. Implementation begins within 30 days of approval. Full deployment by end of Q2."

---

### Layout Specification

| Element | Specification |
|---------|--------------|
| Panel structure | 3 columns (approval slide, horizontal scan) |
| Slide headline | Top of slide, full width, left-aligned, 28pt bold |
| Panel headers | 22pt bold, color-coded per color scheme below |
| One-sentence versions | 16pt bold, immediately below panel header |
| Body text | 14pt, regular weight, left-aligned |
| Primary metric callout | 32pt bold, centered in panel, displayed above body text |
| Decision prompt | Bottom of slide, full-width blue bar, 16pt bold, white text |
| Situation panel color | Neutral slate header (#64748B) |
| Insight panel color | Amber header (#D97706) |
| Recommendation panel color | Action green header (#059669) |
| White space budget | Minimum 25% of each panel area -- cut body text before cutting white space |
| Confidentiality label | Top-right corner, 10pt: "Confidential -- Internal Leadership Only" |

---

### Backup Slide Notes

The following content must NOT appear on the executive summary slide. Prepare as backup slides:

1. **Full pilot methodology:** 3-month timeline, patient volume during pilot period, charge nurse adoption rate, measurement methodology for boarding time (to address the anticipated question: "How did you measure before/after?")
2. **Detailed financial model:** $220K cost breakdown by hospital, $30K/year maintenance contract terms, 3-year total cost of ownership, and comparison to alternative interventions considered (staffing increase, physical expansion)
3. **HCAHPS percentile trend data:** 18-month chart showing the decline from 61st to 39th percentile, with network peer benchmarks, to support the regulatory and competitive context
4. **Vendor selection summary:** The two vendors evaluated, selection criteria, contract terms, and implementation timeline detail -- to address procurement questions without cluttering the summary slide
