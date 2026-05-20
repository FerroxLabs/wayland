---
name: data-storytelling
description: |
  Structures a data narrative that turns analytical findings into a compelling story. Identifies the core insight, builds the evidence chain, selects supporting visualizations, and writes the narrative arc from setup through finding to implication and recommendation.
  Use when the user needs to present data findings to an audience in a persuasive, structured format.
  Do NOT use for raw data exploration (use eda-framework), choosing a chart type (use chart-type-selector), or formatting a data report (use report-formatting).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-visualization analysis report"
  category: "data-analysis"
  subcategory: "data-visualization"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Data Storytelling

## When to Use

**Use this skill when:**
- The user has completed an analysis and needs to present findings to an audience that must make a decision or take an action -- the analysis is done, and the communication challenge begins here
- The user asks "how do I make this data compelling?", "how do I structure this presentation?", or "my stakeholders aren't convinced by my numbers -- what am I doing wrong?"
- The user has a slide deck or report full of charts but no clear narrative thread -- data exists but story is absent
- The user needs to influence a budget decision, headcount approval, strategic pivot, or policy change using data evidence
- The user is preparing for an executive briefing, board presentation, quarterly business review, or all-hands meeting where data is the centerpiece
- The user has conflicting findings and needs to reconcile them into a coherent message rather than presenting raw contradictions
- The user has a compelling finding but isn't sure which elements to emphasize, cut, or reorder
- The user explicitly says they need to "translate" technical findings for a non-technical audience

**Do NOT use when:**
- The user hasn't finished their analysis yet and needs to run it -- redirect to `eda-framework` for exploratory analysis, `hypothesis-testing` for statistical inference, or `correlation-analysis` for relationship quantification
- The user is asking which chart type to use for a specific data type -- that is a discrete visual encoding decision, not a narrative decision; use `chart-type-selector`
- The user needs to format an existing report document (margins, headers, citation styles) -- use `report-formatting`
- The user needs to design a monitoring dashboard with multiple KPIs for ongoing operational use -- dashboards are persistent artifacts, not narratives; use `dashboard-design`
- The user is building an analytical model and needs to explain model mechanics -- this is model documentation, not storytelling
- The user simply wants a summary of their data -- a summary is a compression of facts, not a story with an argument and a call to action; use `executive-summary` instead

---

## Process

### Step 1: Establish the Decision Context Before Anything Else

Before drafting a single sentence of narrative, extract the three elements that determine every other decision in this process.

- **The audience:** Who is in the room and what do they already know? An executive team cares about revenue, risk, and resource allocation. A product team cares about user behavior and feature impact. A clinical team cares about patient outcomes and protocol adherence. The same data finding requires a completely different story depending on who is receiving it.
- **The decision on the table:** What specific action or judgment is the audience being asked to make? If the user can't name the decision in a single sentence, the story isn't ready to be told. A data story without a decision is a lecture.
- **The stakes:** How much does this decision matter, and how much time and attention will the audience give? A $50,000 budget decision gets a 5-minute hallway conversation. A $5 million investment gets a 45-minute board presentation with a written memo. Match the story's depth and evidence density to the stakes.
- **Pre-existing beliefs:** Ask the user what the audience already believes about this topic. A story that confirms existing beliefs needs only light evidence. A story that challenges existing beliefs needs stronger evidence, a more careful narrative structure, and explicit acknowledgment of the prior assumption before contradicting it.
- If the user cannot answer these questions, ask them directly before proceeding. Skipping this step produces technically correct stories that fail to persuade because they are aimed at no one in particular.

### Step 2: Identify and Sharpen the Core Insight

The core insight is the single sentence that, if the audience remembers nothing else, still causes them to make the right decision. Everything else in the story serves this one sentence.

- A core insight is NOT a finding. "Revenue declined 18% year-over-year" is a finding. "The 18% revenue decline is almost entirely attributable to the loss of three enterprise clients in Q3, which means our SMB base is healthy and the fix is targeted retention, not broad product changes" is an insight -- it tells the audience what the data MEANS and what to do about it.
- Apply the "So What? So What? So What?" chain. Take the raw finding and ask "so what?" three times. The first answer is obvious. The second is informative. The third is the insight worth building a story around.
- Test insight sharpness with the "headline test": if this sentence ran as a newspaper headline, would a reader immediately understand the implication and urgency? "Data shows mixed results" fails the test. "Enterprise churn is masking a healthy SMB engine -- targeted retention could recover $2.4M" passes it.
- One story, one insight. If the user has three separate findings, that is three stories -- possibly combined into a single presentation, but each with its own arc. Never blend two insights into one story; the audience will remember neither.
- The insight must contain a causal or directional claim, not just a correlation. "Regions with more sales reps have higher revenue" is correlation. "Adding a third sales rep in underpenetrated markets produces an average $420K revenue increase within 18 months, based on our expansion in the Southeast" is an insight with actionable specificity.

### Step 3: Select and Lock In the Narrative Arc

Every data story runs on one of four narrative structures. Select the arc before writing any prose. The arc is not a stylistic choice -- it is a structural commitment that determines what evidence you need and in what order it appears.

- **The Change Arc:** "We were at [X]. This [event or intervention] happened. Now we are at [Y]." Use this when the data shows a meaningful before/after difference caused by a specific action or event. This arc requires a clear timestamp, a measurable baseline, and a measurable current state. Causal language is permitted but must be supported by evidence (controlled timing, elimination of confounds). Best for: campaign results, process improvement outcomes, A/B test findings, product launch impact.
- **The Comparison Arc:** "[Option A or Group A] outperforms [Option B or Group B] on [metric] because of [mechanism]." Use this when the most important finding is a meaningful difference between two or more groups. The mechanism claim is critical -- without it, this arc feels arbitrary. Best for: competitive benchmarking, segment analysis, geographic performance, channel attribution.
- **The Discovery Arc:** "We assumed [X]. The data shows [Y]." This is the highest-impact arc when the finding is genuinely surprising, because surprising findings are more memorable and action-driving than confirming ones. Requires explicit articulation of the prior belief before revealing the contradiction. Best for: counter-intuitive results, myth-busting, findings that reverse a current strategy.
- **The Urgency Arc:** "If we do not act on [X] by [timeframe], the consequence is [Y]." Use this when the data reveals a risk, a declining trajectory, or a closing window of opportunity. The urgency must be real and quantifiable -- manufactured urgency destroys credibility. Best for: declining metrics, risk exposure, regulatory deadlines, market timing.
- **Hybrid arcs** are allowed in longer presentations: a Change Arc for the main finding followed by an Urgency Arc for the call to action. But the primary arc -- the one the story is built around -- must be singular and decided before writing begins.
- Ask the user: "What would you want the audience to say to each other in the elevator after the presentation?" The answer reveals which arc they instinctively need. "We used to do X and now we do Y" points to Change. "I didn't know our customers behaved so differently by segment" points to Discovery.

### Step 4: Build the Evidence Chain with Precision

The evidence chain is the logical spine of the story. Each link must connect to the next, and every piece of evidence must serve the core insight. This is where most data stories fail -- evidence exists but doesn't connect.

- **Map the chain on paper first** before writing prose. List: Context → Tension → Evidence Point 1 → Evidence Point 2 → (Evidence Point 3) → Insight → Recommendation. Each arrow must represent a logical "therefore" or "which means." If you can't fill in the arrow, you are missing a bridge piece of evidence.
- **Context (1-2 data points):** Establish the current situation as the audience understands it. This is the shared starting point. Use numbers the audience already accepts as true -- prior-period baselines, publicly known benchmarks, or previously approved targets. Do not introduce contested data here.
- **Tension (1 statement):** Name the gap, problem, or question that the context creates. This is the narrative hook. "Despite [context], [something is wrong or unknown]." Tension is what makes the audience lean in. A story without tension is a press release.
- **Evidence (2-4 findings, never more than 4):** Research on working memory (Miller's Law) establishes that audiences can process 3-5 distinct pieces of information before retention degrades. Keep evidence to 2-3 findings for briefings, 3-4 for formal presentations. Each finding must be: specific (a number, not a direction), comparative (vs. something), and causal or directional (pointing toward the insight).
- **Build the evidence in escalating strength order:** Start with the most accessible, easy-to-accept finding. Progress to the most compelling or surprising finding last (just before the insight). This mimics the classic "foot in the door" persuasion structure -- small agreements build to large ones.
- **Every piece of evidence needs a "therefore" transition:** Finding 1 shows X. Therefore, we looked at Y. Finding 2 shows Y explains Z. Therefore, we can conclude [Insight]. Without explicit logical connectors, evidence feels like a list, not an argument.
- **Eliminate supporting evidence that doesn't serve the core insight**, even if it is interesting or took significant work to produce. This is the "kill your darlings" discipline of data storytelling. If a finding requires a detour to explain how it connects, it belongs in an appendix, not the main narrative.

### Step 5: Select and Annotate Supporting Visualizations

Visualizations are supporting actors, not the lead. Each chart must make exactly one point, and that point must be the specific data claim it supports in the narrative.

- **Match visualization type to the narrative claim being made:**
  - Trend claim → line chart with annotation at inflection points
  - Comparison across categories → horizontal bar chart (sorted by value, not alphabetically)
  - Part-to-whole claim → stacked bar or treemap (avoid pie charts for more than 3 segments)
  - Relationship/correlation claim → scatter plot with a regression line and labeled outliers
  - Distribution claim → histogram or box plot (not a bar chart of averages -- averages hide distributions)
  - Geographic claim → choropleth map (with a sequential or diverging color scale, not categorical)
- **Annotate directly on the chart.** Do not rely on the audience to read a caption and then look back at the chart. Place the key number, label, or arrow directly on the visualization where the finding occurs. "This is the month response time crossed below our 2-hour target" belongs as text on the chart at that x-axis point.
- **Remove all chart elements that don't support the single point the chart is making.** This means: remove gridlines when the exact value doesn't matter (use data labels instead), remove legends when there is only one data series, remove decimal precision beyond what is meaningful (87.3% becomes 87% unless the tenth of a percent is the point), and remove background colors and 3D effects entirely.
- **Use pre-attentive attributes to direct attention:** Color (single highlight color against gray baseline), size (make the key bar taller by controlling scale), and position (put the most important item first in a sorted bar chart). The audience's eye must land on the finding without conscious effort.
- **Sequence visualizations to match the evidence chain.** Each chart is a chapter. The audience should not be surprised by a chart's position in the sequence. If a chart introduces new context not yet established in prose, the chart is out of order.
- **The maximum number of data series per chart is 5** for most audiences. Beyond 5, pattern extraction becomes cognitively demanding. If the user's data has 12 categories, collapse the bottom 7 into "Other" or create a separate comparison chart for a specific subset.

### Step 6: Write the Narrative Prose

The prose is what holds the charts together and tells the audience what to think about what they are seeing. Without prose, a deck of charts is a Rorschach test.

- **Lead with the finding, never the methodology.** The first sentence of the story should state the core insight or the setup for it. "We ran a logistic regression model on 24 months of transaction data" is a methodology sentence -- it belongs in an appendix. "Our highest-risk customers are twice as likely to churn within 30 days of their first support ticket going unresolved" is a finding sentence -- it belongs first.
- **Write at the audience's vocabulary level, not the analyst's.** Non-technical audiences understand percentages, dollar amounts, ratios, and time durations. They do not understand p-values, confidence intervals, R-squared, or standard deviations without translation. "The relationship is statistically significant" becomes "this pattern holds consistently across all 24 months, not just a few outliers." "R-squared of 0.83" becomes "response time explains about 83% of the variation in satisfaction scores -- it's by far the strongest driver we can measure."
- **Every number needs three things:** a unit (dollars, percentage points, customers), a comparison (vs. prior period, vs. benchmark, vs. target), and a direction or implication ("which puts us 6 weeks ahead of our annual goal"). A number with fewer than these three elements is not yet a story element.
- **Use the "1-3-1" sentence structure for evidence paragraphs:** One sentence that states the finding. Three sentences maximum that explain it or provide supporting context. One sentence that draws the logical connection to the next finding or to the core insight.
- **Active voice for insights, data verbs for evidence.** Say "churn doubled" not "a doubling of churn was observed." Say "customers who received follow-up calls renewed at 34% higher rates" not "renewal rates were higher among customers in the follow-up call cohort."
- **Use transitions that signal logical progression, not chronological progression.** "This means," "as a result," "which explains why," and "taken together, these findings suggest" are logical connectors. "Next," "then," and "after that" are chronological connectors that make a story feel like a timeline rather than an argument.

### Step 7: Construct a Specific, Bounded Recommendation

A data story without a recommendation is an expensive report. The recommendation is the entire point. Everything before it is justification.

- **Be specific about the action, the owner, the timeline, and the expected outcome.** "Improve our onboarding process" is not a recommendation. "Assign a dedicated onboarding specialist to each new enterprise account within 30 days of contract signing, targeting a 20-point improvement in 90-day retention rates based on the pattern observed in our Southeast region pilot" is a recommendation.
- **Bound the recommendation by what the data can support.** If the evidence shows correlation, the recommendation should be to run a pilot or test, not to scale immediately. If the evidence shows causation (controlled experiment, regression with confounders isolated), the recommendation can be to scale. Over-claiming from correlational evidence destroys credibility.
- **Include a measurement plan for every recommendation.** Name the metric that will confirm success, the threshold that counts as success, and the review timeline. Without this, the recommendation is unfalsifiable and unaccountable.
- **Name the cost of inaction.** The most persuasive data stories frame the recommendation not just as a gain from action but as a loss from inaction. "Hiring 3 support agents could push CSAT to 92%" is less persuasive than "Every month we delay hiring, we are likely losing approximately $180K in preventable churn based on our current CSAT-to-retention relationship."
- **Limit recommendations to 1-3 actions.** More than 3 and the audience will defer the decision or implement nothing. If the data genuinely supports more actions, prioritize by impact and present only the top 2-3 with the others noted as "subsequent steps pending outcome."

### Step 8: Apply the "Audience Stress Test" Before Finalizing

Before the narrative is complete, run three adversarial checks that simulate the audience's reaction.

- **The skeptic test:** Read the narrative as the most skeptical person in the room. What question would they immediately ask? "But couldn't this be explained by [other factor]?" If you can predict the question, address it proactively in the narrative. Unaddressed objections become the only thing skeptics talk about after the presentation.
- **The executive summary test:** Could someone read only the Setup, Insight, and Recommendation sections and walk away with the full story? If not, the Insight section is not doing enough work. The three sections should form a complete logical unit even without the Evidence section.
- **The memory test:** What will the audience remember in 48 hours? Research on narrative memory (Schank and Abelson's story schema theory) shows audiences remember: the setup situation, the most surprising finding, and the recommended action. Check that each of these elements is unambiguous and memorable. If the most surprising finding is buried in Finding 2 out of 4, reorder the evidence chain.

---

## Output Format

```
## Data Story: [Active-voice title stating the key finding, not the topic]

### Context Snapshot
- **Audience:** [Who is receiving this story and their relevant background]
- **Decision required:** [The specific action or judgment the audience must make]
- **Arc type:** [Change / Comparison / Discovery / Urgency]
- **Core insight (one sentence):** [The single sentence the entire story supports]

---

### The Setup
[1-2 sentences grounding the audience in the current situation using numbers they already accept.
Establish the baseline, the target, or the prior state.]

### The Tension
[1-2 sentences naming the gap, problem, or question that makes the finding necessary.
This is the hook. Something is wrong, unknown, or at risk.]

---

### The Evidence Chain

**Finding 1: [Short declarative statement with a number and comparison]**
[1-3 sentences explaining what this data shows, with its full context -- unit, comparison, direction.]
[1 sentence connecting this finding to the next: "This means..." or "Which raises the question of..."]
_Visualization: [Chart type] | Data: [What is on each axis or series] | Key annotation: [The specific element to highlight on the chart]_

**Finding 2: [Short declarative statement with a number and comparison]**
[1-3 sentences explaining what this data shows, building on Finding 1.]
[1 sentence connecting to the next finding or to the insight.]
_Visualization: [Chart type] | Data: [What is on each axis or series] | Key annotation: [The specific element to highlight]_

**Finding 3: [Short declarative statement with a number and comparison]** *(if needed)*
[1-3 sentences completing the evidence chain.]
[1 sentence leading directly into the insight.]
_Visualization: [Chart type] | Data: [What is on each axis or series] | Key annotation: [The specific element to highlight]_

---

### The Insight
[1-2 sentences interpreting what the evidence MEANS, not what it shows.
This must contain a causal or directional claim, not just a summary.
Format: "Taken together, these findings show that [mechanism], which means [implication]."]

---

### The Recommendation

| # | Action | Owner (role) | Timeline | Expected Outcome | Success Metric |
|---|--------|-------------|----------|-----------------|----------------|
| 1 | [Specific action] | [Role] | [Timeframe] | [Quantified outcome] | [Metric + threshold + review date] |
| 2 | [Specific action] | [Role] | [Timeframe] | [Quantified outcome] | [Metric + threshold + review date] |
| 3 | [Measurement / pilot / review] | [Role] | [Timeframe] | [Validation milestone] | [Go/no-go criterion] |

**Cost of inaction:** [What happens if the audience does nothing, in quantified terms, per month or per quarter]

---

### Skeptic Prep
**Most likely objection:** [The question the most skeptical stakeholder will ask]
**Preemptive response:** [1-2 sentences that address this objection, grounded in the evidence]

---

### Appendix (for technical audiences)
*Omit entirely for non-technical presentations. Include only if the audience will want to verify the statistical basis.*
- **Data source and date range:** [Source, n, date range]
- **Methodology note:** [What analysis was run, what confounders were controlled for]
- **Confidence and limitations:** [Any caveats, sample size issues, or data quality flags]
```

---

## Rules

1. **Lead with the finding, end with the recommendation -- never reverse this order.** The biggest structural error in data storytelling is burying the finding at the end after pages of methodology. Executives make decisions about whether to keep listening in the first 90 seconds. State the finding or its implications in the opening.

2. **The title must contain a verb and a number, or a causal claim.** "Analysis of Customer Retention" fails. "Unresolved Support Tickets Drive 2.3x Higher Churn in Enterprise Accounts" passes. If the title could apply to an empty deck, rewrite it.

3. **Never exceed 4 evidence points in the main narrative.** Cognitive load research (Sweller, 1988) establishes that working memory degrades sharply beyond 5-7 chunks of new information. For data presentations, where each finding requires integration with prior findings, the practical limit is 3-4. Any additional findings go in an appendix or a separate follow-up story.

4. **Every number requires a unit, a comparison, and an implication.** "Revenue is up 15%" is incomplete. "Revenue is up 15% year-over-year, which puts us $1.2M ahead of our annual target with two quarters remaining" is complete. Run this check on every number in the narrative before finalizing.

5. **Do not use the word "significant" without a quantifier.** "Significantly higher" means nothing to a non-technical audience and is imprecise even for technical audiences. Replace with the actual magnitude: "47% higher," "three times the industry rate," or "the largest single-quarter drop in five years."

6. **One chart, one claim.** A dual-axis chart with two data series is permissible only when both series are being compared to show their relationship (e.g., response time and CSAT on the same timeline to demonstrate co-movement). A chart showing revenue, margin, units sold, and customer count is four claims crammed into one space -- it will be used to avoid any of them rather than support all of them.

7. **Explicitly acknowledge the most obvious alternative explanation before the skeptic raises it.** If a competitor's product launch, a seasonal effect, or a macroeconomic shift could plausibly explain the finding, the narrative must address it proactively. "One might attribute the Q3 revenue decline to the broader market downturn -- but our competitors reported 4% growth in the same period, which rules out market conditions as the primary driver." Silence on an obvious alternative reads as ignorance or evasion.

8. **The recommendation must be bounded by the evidence standard.** Correlational data supports a pilot. A controlled A/B test supports scaling. Observational trend data supports monitoring and investigation. Never recommend broad organizational change based on a single correlation -- this is both analytically wrong and will be correctly challenged by technical stakeholders.

9. **Strip all "we" language that refers to the analysis team rather than the audience.** "We ran a 6-month study" inserts the analyst into the story. The story is about the audience and their decision, not the analyst's work. Use passive construction or subject-first structure: "A 6-month analysis of 28,000 customer records reveals..." Keep the analyst out of the frame.

10. **Match narrative length to the decision stakes and the audience's available attention.** A Slack message to a product manager gets 2 paragraphs and 1 chart. A board presentation gets a 6-slide narrative with a written one-page summary. A quarterly business review gets 10-15 minutes of narrative with a backup appendix. Do not produce a 20-page document when the audience will have 8 minutes. Ask the user what format and duration the presentation requires before selecting evidence depth.

11. **Test every "therefore" in the evidence chain.** Write out the chain as a series of logical statements: "X is true. Therefore Y. Therefore Z. Therefore our recommendation." If any "therefore" requires a logical leap that isn't supported by the evidence, either add evidence or soften the claim. Unearned "therefores" are where data stories lose credibility.

12. **Never present averages as the only representation of a distribution when the distribution is skewed or bimodal.** "Our average order value is $87" hides whether that average is driven by many $87 orders or a few $2,000 orders and many $10 orders. When the finding depends on distribution shape -- churn timing, customer spend, support ticket resolution time -- include the distribution, not just the mean.

---

## Edge Cases

### The User Has Five Compelling Findings That All Seem Equally Important

This is the most common data storytelling failure mode. The analyst has done excellent work and wants to honor all of it. Resist this impulse on the audience's behalf.

- Run each finding through a single filter: "Which finding, if acted on, produces the largest positive change in the metric the audience cares most about?" That finding is the core insight. Build the story around it.
- The remaining findings become supporting evidence if they logically strengthen the core insight, supporting observations in a labeled "Additional Findings" section if they are independent, or appendix material if they are interesting but not decision-relevant.
- Never present 5 equal-weight findings as a "multi-point recommendation." The audience will remember none of them and the meeting will end with "let's follow up on this."
- If the user genuinely cannot prioritize (because different stakeholders care about different findings), ask who the primary decision-maker in the room is and build the story for that person. Other findings can be addressed in 1-1 follow-ups.

### The Data Contradicts a Decision the Audience Has Already Made or Is Committed To

This is the politically sensitive case. The data story is essentially saying "you were wrong."

- Use the Discovery Arc, but frame the contradiction as new information that was unavailable at the time of the prior decision -- not as evidence the decision was bad. "When we made this investment in Q2, the data supported it. What we've learned since then changes the outlook."
- Never make the contradiction the first thing the audience hears. Establish full alignment on the context and on the prior decision's logic before introducing the contradicting evidence.
- Frame the recommendation as "course correction" rather than reversal. "Based on what the data now shows, we recommend adjusting our approach in [specific way] while preserving [element of original decision that still makes sense]."
- Quantify what has changed externally (market conditions, customer behavior, competitive landscape) to provide the audience with a face-saving explanation for why the original decision was reasonable but new information now points elsewhere.

### The Audience Is Deeply Divided -- Half Will Love the Finding, Half Will Resist It

When the room contains stakeholders whose interests are opposed by the data finding (e.g., the data shows marketing's channel underperforms sales, and both teams are present):

- Address this in the Skeptic Prep section of the output explicitly. Name the competing perspective and prepare a response that acknowledges the validity of the concern before providing the evidence-based counter.
- Use neutral, shared business objectives as the framing throughout. "Both teams share the goal of maximizing customer acquisition at the lowest cost" is a unifying frame. "Marketing's channel is underperforming" is a combative frame that will cause defensive listening.
- Recommend a pilot or shared test as the action rather than a complete shift. "Run a 60-day controlled test with 20% of budget allocated differently" is a lower-threat recommendation than "shift all budget to sales." Pilots are much easier to approve in divided rooms.

### The User Is Presenting in Written Format (Report or Memo), Not Slides

Narrative structure changes when prose carries the full argument rather than spoken words.

- The written format requires explicit transitional sentences between evidence points that would be implicit in a verbal presentation. Every evidence-to-evidence link must be written out. Do not rely on bullet lists -- prose paragraphs create logical flow; bullet lists create parallel lists that feel unconnected.
- The core insight belongs in the first paragraph, not buried after evidence (this is the inverted pyramid structure standard in executive communication). State the finding, then prove it, then recommend action.
- Each visualization needs a caption that contains the finding it supports, not a description of what the chart shows. "Figure 1: Response Time and CSAT, 2023-2024" is a description. "Figure 1: Monthly CSAT Tracked Response Time Improvements Closely -- a 57% Drop in Wait Times Corresponded to a 14-Point Satisfaction Gain" is a narrative caption that works even for a reader who only scans the visuals.
- Include an executive summary box at the top of any written narrative longer than 2 pages. The box contains: one sentence for context, one sentence for the core insight, and bullet points for the recommendations. Many executives will read only this box and use it to decide whether to read further.

### The Audience Asks for the Data Behind the Finding During the Presentation

This happens when a finding surprises a skeptical stakeholder who wants to validate it before accepting it.

- Prepare the appendix slides proactively for any finding that will be surprising or contested. The appendix contains: data source details, sample size, time range, methodology, and the raw data table if small enough to display.
- Train the user on the "park and proceed" move: "Great question -- I've included the underlying data in the appendix and would be glad to walk through it after we finish the main narrative. Can I complete the full story first so the context is clear?" This prevents the presentation from devolving into a data audit before the recommendation is delivered.
- If the data challenge is fundamental -- the skeptic is questioning whether the data is valid, not just surprising -- acknowledge it directly and offer a validation step as part of the recommendation: "Let's agree to validate this finding with [additional data source] and reconvene in two weeks." Never argue about data quality in real time without supporting evidence.

### The User Has No Clear Recommendation -- The Finding Is Ambiguous

Some analyses genuinely produce uncertainty rather than a clear direction. This is a valid story.

- The Urgency Arc works well here: "We don't yet have the answer, and here is why that matters and what it will cost us to remain uncertain." Frame the call to action as "fund the next analysis" rather than "implement this change."
- The recommendation section becomes a decision framework: "If [Scenario A] proves true through [test], then [Action A]. If [Scenario B] proves true, then [Action B]. The test required to determine which scenario is accurate is [specific test with timeline and cost]."
- Avoid presenting the ambiguity as a failure. Frame it as responsible analysis: "The data does not yet support a definitive conclusion, and making a $2M decision on this level of evidence would be premature. We recommend a focused 8-week test that will reduce uncertainty to an acceptable level before full commitment."
- Name the specific uncertainty (sample size too small, confounders not isolated, time range too short) so the audience understands the problem is solvable, not fundamental.

### The Finding Is Negative -- The Team's Project or Initiative Failed

Delivering bad news via data requires specific structural care to prevent the meeting from becoming about blame rather than improvement.

- Lead with the impact on the business, not the performance of the team. "We are losing approximately 340 customers per month who never complete the onboarding process" is a business impact framing. "Our onboarding team's completion rates are down 22%" is a performance framing that immediately creates defensiveness.
- Use the Urgency Arc with a forward-looking recommendation as the emotional center of the story. The finding is the problem; the recommendation is the protagonist. The audience should leave feeling like they have agency, not like they are watching a post-mortem.
- Include a "what we learned" section that converts the failure into organizational knowledge. This reframes the bad news as a return on investment: the initiative failed, but the finding is worth its cost if it prevents a more expensive mistake.
- Quantify the path forward, not just the current state. "Fixing the onboarding drop-off requires [X investment] and is projected to recover [Y customers per month] within [Z weeks]" is more productive than dwelling on the magnitude of the problem.

---

## Example

**Input:** "We run an e-commerce subscription box service. We've noticed that customers acquired through influencer marketing campaigns have much higher churn rates in the first 90 days than customers from other channels. We're spending $340K per quarter on influencer campaigns. I need to present this to the leadership team to recommend reallocating part of that budget to channels with better retention."

---

**Output:**

## Data Story: Influencer-Acquired Customers Churn at 2.4x the Rate of Other Channels -- $680K in Annual Revenue Is At Risk

### Context Snapshot
- **Audience:** Leadership team (CEO, CMO, CFO) -- financially sophisticated, protective of current marketing mix, will want to see channel comparison with confidence
- **Decision required:** Whether to reallocate a portion of the $340K quarterly influencer marketing budget to retention-optimized acquisition channels
- **Arc type:** Comparison Arc (channel performance) with Urgency framing on cost of inaction
- **Core insight (one sentence):** Influencer-acquired customers churn at 2.4 times the rate of email and paid search customers within 90 days, meaning we are spending $340K per quarter to acquire customers who generate significantly less lifetime revenue than the channels we are underinvesting in.

---

### The Setup
We currently acquire new subscribers across four channels: influencer partnerships, paid search, organic social, and email referrals. Influencer campaigns represent our single largest acquisition investment at $340K per quarter -- more than twice what we spend on paid search ($140K) and email ($80K) combined. This investment has produced strong new subscriber volume: influencer campaigns delivered 1,840 new subscribers last quarter, our highest single-channel total.

### The Tension
New subscriber volume is only half the acquisition equation. The other half is how long those subscribers stay -- and 90-day retention data reveals a meaningful performance gap that our top-line acquisition numbers have been obscuring. If influencer-acquired customers are churning at materially higher rates before recovering their acquisition cost, our effective cost per retained customer is significantly higher than our reported cost per acquisition.

---

### The Evidence Chain

**Finding 1: Influencer-acquired customers churn at 47% within 90 days -- 2.4x higher than the 20% average of all other channels**
Last quarter, 47% of the 1,840 influencer-acquired subscribers cancelled before completing their third box. Across the same period, email referrals churned at 17%, paid search at 22%, and organic social at 21%. The influencer channel is a meaningful outlier -- its 90-day churn rate is not marginally higher, it is more than double the next-worst channel. This means that of the 1,840 subscribers acquired last quarter through influencer campaigns, we can expect to retain approximately 975 past the 90-day mark.
_Visualization: Horizontal bar chart | Data: 90-day churn rate by acquisition channel, sorted ascending | Key annotation: Red highlight bar for Influencer at 47%, gray bars for all other channels, reference line at 20% (all-channel average), data labels on each bar_

**Finding 2: Because of the churn gap, the effective cost per retained customer through influencer campaigns is $349 -- versus $87 for email and $116 for paid search**
Our reported cost per acquisition (CPA) for influencer campaigns is $185 per new subscriber, which appears competitive. But when we adjust for 90-day retention, the cost per retained subscriber (CPRS) -- the number that actually reflects acquisition efficiency -- rises to $349 for influencer versus $87 for email and $116 for paid search. We are paying 4x more per retained customer through influencer campaigns than through email, our most efficient channel. On a $340K quarterly budget, this gap represents approximately $168K in quarterly spend that delivers retained customers at a cost we would not accept from any other channel.
_Visualization: Grouped bar chart | Data: CPA (reported) vs. CPRS (retention-adjusted) for each channel | Key annotation: Arrow showing the gap between CPA and CPRS for influencer channel specifically, with a callout "Influencer CPRS is 4x the email channel"_

**Finding 3: Influencer-acquired subscribers generate 43% less 12-month revenue per customer than email-acquired subscribers**
Retention affects not just subscriber count but lifetime revenue. Using 12-month revenue projections based on historical cohort data, influencer-acquired customers who do stay beyond 90 days still have a lower average order add-on rate (14% vs. 31% for email cohorts) and a lower 12-month renewal rate (61% vs. 78%). The result: an influencer-acquired subscriber generates an average $187 in projected 12-month revenue, versus $327 for an email-acquired subscriber. The channel delivers lower volume of retained customers at higher acquisition cost with lower downstream revenue per customer -- all three revenue levers are moving in the wrong direction simultaneously.
_Visualization: Stacked bar chart | Data: 12-month revenue composition (base subscription, add-ons, renewal) per retained customer by channel | Key annotation: Total height of each bar (12-month revenue per customer), with influencer and email bars explicitly labeled at their totals_

---

### The Insight
Taken together, these findings show that our influencer marketing budget is optimized for a metric (new subscriber volume) that does not reflect acquisition quality. The channel's fundamental problem is audience-fit: influencer-acquired customers are likely coming to the product with different expectations -- novelty, social proof, FOMO -- than customers who actively searched or were referred by a friend, and those expectations produce lower commitment to the subscription model. This means that the $340K we are spending on influencer campaigns is generating the highest volume of the lowest-quality customers in our acquisition portfolio, and the gap is large enough that reallocation would likely improve both revenue and margin even if it reduces new subscriber headline numbers.

---

### The Recommendation

| # | Action | Owner (role) | Timeline | Expected Outcome | Success Metric |
|---|--------|-------------|----------|-----------------|----------------|
| 1 | Reallocate $170K/quarter (50% of influencer budget) to email referral and paid search -- the two highest CPRS channels | CMO + Head of Acquisition | Begin next quarter | Reduce blended CPRS from current $196 to approximately $140; increase 90-day retention rate from 73% to an estimated 80% | 90-day retention rate reviewed at end of Q1; target 78%+ across all channels |
| 2 | Pilot retention-focused onboarding for influencer subscribers: tailored email sequence addressing subscription value, unboxing content, and personalization survey in week 1 | CRM Manager | Launch within 6 weeks | Target: reduce influencer churn from 47% to 33% without reducing acquisition volume | 90-day churn rate of influencer cohort vs. prior cohort; measure at week 12 |
| 3 | Establish monthly CPRS reporting as a standard acquisition metric alongside CPA | Analytics + CMO | Implement this quarter | Prevent future budget allocation decisions based on CPA alone, which obscures retention-adjusted economics | CPRS included in monthly marketing performance dashboard by next monthly review |

**Cost of inaction:** At the current trajectory, we are spending $340K per quarter -- $1.36M annually -- on our least retention-efficient channel. Each quarter of delay preserves approximately $168K in avoidable acquisition inefficiency. The recommended reallocation could recover approximately $530K in annual retained-customer revenue at the same total marketing budget.

---

### Skeptic Prep
**Most likely objection:** "Influencer campaigns drive brand awareness and word-of-mouth that doesn't show up in direct attribution -- you're only looking at direct subscribers, not the halo effect on other channels."

**Preemptive response:** "That's a real consideration and we've accounted for it in two ways: first, organic social (our clearest proxy for brand-driven acquisition) showed 21% 90-day churn -- in line with the all-channel average, not elevated above it, suggesting influencer campaigns are not meaningfully boosting organic acquisition quality. Second, our recommendation is to reduce, not eliminate, influencer spend -- we are proposing to preserve $170K per quarter in influencer investment while reallocating the underperforming half, which maintains brand presence while testing whether reallocated budget improves blended economics."

---

### Appendix (for technical review)
- **Data source and date range:** Internal subscription platform export, Q1-Q3 this fiscal year, n = 6,840 new subscribers across all channels
- **Methodology note:** 90-day churn defined as cancellation before day 91 of subscription. CPRS calculated as channel quarterly spend divided by number of subscribers retained past 90 days. 12-month revenue projection uses 18-month historical cohort data from subscribers who entered in the same season last year, adjusted for current pricing.
- **Confidence and limitations:** Influencer campaign performance varies by individual influencer and campaign theme -- the 47% churn figure is an average across 12 campaigns with a range of 31%-61%. The pilot in Finding 3 (onboarding sequence) has no direct historical analog -- the 33% churn target is based on comparable onboarding interventions from industry case data and should be treated as a directional estimate pending a controlled test.

---

### Narrative Structure Used
- **Arc type:** Comparison Arc with Urgency framing on cost of inaction
- **Audience:** CEO, CMO, CFO -- financially sophisticated, decisions-focused
- **Key metric:** Cost per retained subscriber (CPRS): $349 influencer vs. $87 email
- **Visualization sequence:** 1) Channel churn rate comparison (establishes the gap), 2) CPA vs. CPRS by channel (monetizes the gap), 3) 12-month revenue per retained customer by channel (closes the argument with lifetime value)
