---
name: pro-con-analysis
description: |
  Produces a structured pros and cons analysis that goes beyond a simple list by weighting each factor by magnitude and reversibility, identifying hidden costs, and producing a recommendation with confidence level.
  Use when the user asks about weighing pros and cons, evaluating a decision between two options, or doing a thorough comparison of trade-offs for a personal choice.
  Do NOT use for multi-option comparison with scoring (use weighted-decision-matrix), business strategic analysis (use business strategy skills), or imagining failure scenarios (use premortem-analysis).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "decision-making analysis planning"
  category: "productivity"
  subcategory: "decision-making"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Pro-Con Analysis

## When to Use

**Use this skill when:**
- The user is weighing a binary or two-option decision and wants structured reasoning -- not just a gut check but a methodology that surfaces what they might be missing
- The user says they are "torn," "going back and forth," or "can't decide" between two specific choices and wants clarity on why
- The user asks for help evaluating a yes/no decision where one branch is a clear status quo and the other is a proposed change (accept job offer, move cities, end a relationship, launch a side project)
- The user wants to validate a tentative decision they have already made by testing it against a structured framework before committing
- The user explicitly asks for "pros and cons," "advantages and disadvantages," "trade-off analysis," or "help me think through this decision"
- The user is facing a time-bounded decision with a deadline (offer expires, lease ends, enrollment window closes) and needs rapid structured thinking
- The user has been deliberating for too long and wants an external framework to break the stalemate and produce a recommendation

**Do NOT use when:**
- The user has three or more meaningfully distinct options to compare -- use `weighted-decision-matrix`, which handles multi-option scoring with configurable criteria weights more rigorously
- The user wants to imagine all the ways a decision could fail before committing -- use `premortem-analysis`, which is specifically designed for failure-mode exploration and risk cataloging
- The user wants to map second-order and third-order consequences of a decision across time -- use `second-order-thinking`, which traces causal chains rather than weighing static factors
- The user needs formal strategic business analysis (market entry, product strategy, competitive positioning) -- use business strategy skills that apply frameworks like Porter's Five Forces or BCG matrix
- The user wants to record the reasoning behind a decision made today for future review and accountability -- use `decision-journal`, which captures context, rationale, and expected outcomes for retrospective learning
- The user is asking for help with a technical comparison between products, programming languages, or software architectures -- those require domain-specific benchmarking skills, not a generic pros-cons framework
- The decision is highly quantitative and purely financial (e.g., mortgage refinancing, investment allocation) -- the numbers should drive the decision via financial modeling, not a weighted narrative analysis

---

## Process

### Step 1: Establish Decision Context Before Generating Any Analysis

Before listing a single pro or con, gather the decision parameters that will govern the entire analysis. Do not skip this step -- missing context leads to incorrectly weighted factors and an irrelevant recommendation.

- **Identify the exact decision statement.** Force precision: "Should I accept the startup job offer by Friday?" is a valid decision statement. "Should I change careers?" is not -- it is too broad for this framework.
- **Name both options explicitly.** Option A is always the proposed change or action; Option B is always the status quo or alternative. This matters because the status quo bias analysis in Step 5 requires knowing which option is the default.
- **Determine reversibility class.** Classify the decision as one of three types: Fully Reversible (can be undone with minimal cost -- trying a new productivity tool), Partially Reversible (can be changed later but with significant switching cost -- accepting a job, moving apartments), or Irreversible (cannot be meaningfully undone -- having a child, selling a family business, undergoing surgery). Irreversibility dramatically changes how cons are weighted.
- **Establish the time horizon.** Ask: what is the decision deadline, and what is the evaluation window? A decision with a 48-hour deadline requires a different analytical posture than one with 30 days. The evaluation window (how long until you would know if the choice was correct) affects how to weight uncertain pros.
- **Surface the user's stated values and priorities.** Ask what the user cares about most. Common value clusters: financial security, autonomy, relationships, growth, status, stability, adventure. If the user cannot articulate priorities, offer a short list and ask them to rank the top three. These values become the interpretive lens for weighting.
- **Identify constraints that are non-negotiable.** Constraints eliminate options entirely; they are not cons to be weighed. If the user cannot relocate, a job offer requiring relocation is off the table -- it is not a "con," it is a disqualifier. Surface and honor constraints before any analysis begins.

---

### Step 2: Generate a Complete and Unbiased Pros List for Each Option

The goal of this step is to produce a full inventory of genuine advantages, not a quick brainstorm. Quality beats quantity -- aim for 4-6 high-quality, specific pros per option rather than 10 shallow ones.

- **State each pro as a specific, concrete claim.** "Better work-life balance" is weak. "No commute saves 90 minutes per day, reclaiming approximately 375 hours per year" is strong. Force specificity wherever possible -- use numbers, timeframes, and named outcomes.
- **Distinguish between first-order and second-order benefits.** A first-order pro is the direct benefit (higher salary). A second-order pro is what that benefit enables (financial runway to take a career risk in 2 years, paying off student debt 3 years earlier). Both count, but second-order benefits carry higher uncertainty and should be noted as such.
- **Assign Magnitude using the 1-2-3 scale consistently.** Minor (score: 1) -- incremental improvement with limited life impact. Moderate (score: 2) -- meaningful benefit affecting a significant domain of life or work. Major (score: 3) -- transformative benefit with long-lasting or large-scale positive effects. When in doubt between two levels, choose the lower one to avoid inflation.
- **Assign Certainty level.** High (multiplier: 1.0) -- this benefit will almost certainly materialize given current information. Medium (multiplier: 0.75) -- this benefit is likely but depends on conditions outside the user's control. Low (multiplier: 0.5) -- this benefit is speculative, contingent on uncertain future events, or requires many things to go right.
- **Calculate Weighted Value for each pro:** Magnitude Score x Certainty Multiplier. A Major pro with Low certainty scores 3 x 0.5 = 1.5, the same as a Minor pro with High certainty. This calibration is intentional -- speculative upside is genuinely worth less than modest certain gain.
- **Check for anchoring bias.** If the user described one option first and in more detail, they may have unconsciously presented it more favorably. Actively probe the other option for additional pros to ensure balanced representation.

---

### Step 3: Generate a Complete and Balanced Cons List for Each Option

Cons require more nuanced treatment than pros because they vary on a dimension pros do not: reversibility. A reversible con is an obstacle; an irreversible con is a permanent cost.

- **State each con as a specific, concrete claim.** "More stressful" is weak. "Early-stage startup environment typically requires 55-65 hour work weeks versus current 45 hours, adding approximately 10-20 hours of work per week" is strong.
- **Assign Magnitude using the 1-2-3 scale.** Apply the same definitions as pros. Be especially rigorous here -- humans systematically underweight cons due to optimism bias and loss aversion asymmetry (we underestimate how bad bad outcomes feel). When uncertain between two magnitude levels for a con, choose the higher one.
- **Assess Reversibility for each con.** Reversible (multiplier: 1.0) -- this downside can be corrected, undone, or mitigated within a reasonable timeframe and cost. Irreversible (multiplier: 1.5) -- this downside cannot be meaningfully undone once the decision is made (lost relationships, career gaps, physical consequences, opportunity costs that close permanently).
- **Calculate Weighted Value for each con:** Magnitude Score x Reversibility Multiplier. An irreversible Major con scores 3 x 1.5 = 4.5 -- the highest possible weight in the system. This is deliberate: the framework is risk-calibrated to treat permanent negative consequences with appropriate seriousness.
- **Probe for hidden costs in four categories.** Time cost (what ongoing activities or responsibilities does this option add or remove?). Opportunity cost (what future options does this choice close off?). Emotional cost (what psychological burden does this option carry -- anxiety, guilt, loneliness, resentment?). Relationship cost (how does this affect people the user cares about?). These hidden costs are often the ones users have not articulated but feel most acutely.
- **Apply loss aversion awareness.** Research by Kahneman and Tversky established that losses feel approximately twice as painful as equivalent gains feel pleasurable. This is already partially handled by the irreversibility multiplier, but remind the user explicitly when a con involves giving up something they currently have (loss framing) versus simply not gaining something new (foregone gain framing). Losses should be named precisely.

---

### Step 4: Apply the Full Weighted Scoring Calculation

This step transforms the qualitative inventory into a quantitative comparison. The numbers are not meant to be a mechanical decision oracle -- they are a structured summary of the reasoning.

- **Calculate Weighted Pros Total for each option:** Sum of (Magnitude x Certainty) across all pros.
- **Calculate Weighted Cons Total for each option:** Sum of (Magnitude x Reversibility Multiplier) across all cons.
- **Calculate Net Score for each option:** Weighted Pros Total minus Weighted Cons Total. A positive net score means the option's advantages outweigh its disadvantages on a weighted basis. A negative net score means the disadvantages outweigh the advantages.
- **Build the Comparison Summary table** with total weighted pros, total weighted cons, net score, key advantage, and key risk for each option side by side. This table is the single most important output for users who scan rather than read.
- **Apply the close-score rule.** If the difference in net scores between options is less than 2.0 points, treat the scores as effectively tied and defer to the Hidden Factors analysis and Regret Test for the recommendation. A 1-point difference in a system with this level of subjectivity is not meaningful enough to override qualitative judgment.
- **Sanity-check the scoring.** If the analysis produces a result that conflicts sharply with the user's stated intuition, do not simply present the numbers as the verdict. Instead, flag the discrepancy explicitly: "The weighted analysis favors Option A, but you expressed a strong pull toward Option B. Let's examine whether that intuition reflects a factor we have not fully weighted, or whether it is a cognitive bias worth examining."

---

### Step 5: Identify Hidden Factors and Cognitive Bias Traps

This step is what separates a thorough pro-con analysis from a simple list. Every significant decision is distorted by at least one cognitive bias. Name them explicitly.

- **Status quo bias audit.** Is Option B (the status quo) benefiting from the familiarity premium -- being favored simply because it is known and comfortable, not because it is objectively better? Ask directly: "If the current situation were Option A (the new choice) and the startup were your current job, would you be considering leaving?" This reversal often exposes hidden preference for the familiar.
- **Cost of inaction analysis.** The default option is not neutral. Calculate what staying in the status quo costs over the decision's time horizon. If staying at the current company costs $30,000/year in salary differential, that is $150,000 over 5 years. Inaction has a price that must be named.
- **Omission neglect check.** What has the user not mentioned that an outside observer would consider important? Common omissions: physical health effects, impact on partner or family, career ceiling effects, long-term financial trajectory, identity and meaning effects. Probe for at least two factors the user did not raise.
- **Sunk cost trap identification.** Is the user weighting a prior investment in one option as a reason to continue with it? Time already spent at a company, money already invested in training, or effort already put into a relationship are sunk costs -- they do not factor into forward-looking analysis. Name any sunk costs explicitly and remove them from the analysis.
- **Regret minimization test.** Frame the decision from a 1-year, 5-year, and 10-year retrospective. "Looking back from 1 year from now, which choice would sting more if it went wrong?" Then: "Looking back from 10 years from now, which regret would feel larger -- the regret of having tried and failed, or the regret of never having tried?" These two timeframes often produce different answers, which is itself diagnostic.
- **Hybrid option scan.** Rarely are the only two choices the ones initially presented. Before finalizing, check: Is there a negotiated middle ground? A staged commitment that tests the riskier option before full commitment? A "try it for 90 days" version? A way to capture the best element of each option? If a viable hybrid exists, name it as a concrete alternative in the Hidden Factors section.
- **Reference class check.** How have similar decisions played out for people in comparable situations? This is the "outside view" correction. For example: what percentage of early-stage startups of this size fail within 3 years? (Historical answer: approximately 60-70% of Series A or earlier startups do not reach maturity.) Using base rates prevents the user from treating their situation as uniquely exceptional.

---

### Step 6: Generate the Recommendation

A recommendation is mandatory. Refusing to recommend -- presenting both sides neutrally and leaving it entirely to the user -- is not analysis, it is abdication. The user can override the recommendation, but they deserve a clear directional judgment.

- **State the recommended option clearly.** Do not hedge the recommendation itself. "Accept the startup offer" or "Stay at your current company" -- not "it depends" or "both options have merit."
- **Assign a Confidence Level.** High confidence (net score difference > 4.0 points and no major qualitative factors in conflict): the analysis strongly supports one option. Medium confidence (net score difference 2.0-4.0 points, or close scores with one meaningful qualitative factor tipping the balance): the recommendation is directional but not overwhelming. Low confidence (scores within 2.0 points, or a major qualitative factor conflicts with the quantitative result): the recommendation is a tiebreaker judgment, not a strong signal. At Low confidence, the regret test carries more weight.
- **Identify the single key factor.** Name the one factor that, more than any other, explains why this option wins. Not the totality of reasons -- just the decisive factor. This is what the user will remember.
- **State the reversing condition.** Identify the one or two pieces of information or changed circumstances that would flip the recommendation. This is critical -- it tells the user what to investigate before committing, and it makes the recommendation conditional and honest rather than falsely absolute.
- **Offer a concrete next step.** What should the user do in the next 24-48 hours? This is not generic ("think about it") but specific and actionable: make a specific phone call, request a specific document, sleep on it and apply the "morning feeling" test (what did you feel when you woke up and thought about it?), ask a specific person a specific question.

---

### Step 7: Invite Iteration and Recalibration

A pro-con analysis is a living document during the deliberation window, not a fixed verdict.

- **Flag factors that could change the analysis.** Name 2-3 specific pieces of information the user could gather that would meaningfully shift the weighting (financial documents, reference conversations, trial periods).
- **Welcome additions from the user.** If the user provides new information -- a factor they had not mentioned, a constraint they realized is non-negotiable, a changed circumstance -- rerun the relevant portions and recalculate. Never resist updates to preserve the initial output's coherence.
- **Note when the analysis is complete enough.** If the user's decision is relatively low-stakes or fully reversible, say so explicitly: "This is a reversible decision. You can try it, observe the results, and adjust. The cost of a wrong choice here is recoverable. Don't let analysis paralysis prevent a good-enough decision from being made."

---

## Output Format

```
## Pro-Con Analysis: [Precise Decision Question]

### Decision Context
- **Decision:** [Single clear question in the form "Should I [action]?"]
- **Option A (Change/Action):** [Name and brief description]
- **Option B (Status Quo/Alternative):** [Name and brief description]
- **Reversibility Class:** [Fully Reversible / Partially Reversible / Irreversible] -- [one-sentence explanation of why]
- **Decision deadline:** [Specific date or timeframe]
- **Evaluation window:** [How long until you would know if the choice was correct]
- **User's stated priorities:** [Top 2-3 values the user named as most important]
- **Non-negotiable constraints:** [Any hard constraints that eliminate sub-options]

---

### Option A: [Full Name]

**Pros:**
| # | Pro | Magnitude (1-3) | Certainty | Weighted Value |
|---|-----|----------------|-----------|---------------|
| 1 | [Specific, concrete benefit with detail] | [1/2/3] | [High 1.0 / Med 0.75 / Low 0.5] | [M x C] |
| 2 | [Specific, concrete benefit with detail] | [1/2/3] | [High 1.0 / Med 0.75 / Low 0.5] | [M x C] |
| 3 | [Specific, concrete benefit with detail] | [1/2/3] | [High 1.0 / Med 0.75 / Low 0.5] | [M x C] |
| 4 | [Specific, concrete benefit with detail] | [1/2/3] | [High 1.0 / Med 0.75 / Low 0.5] | [M x C] |
| | **Weighted Pros Total** | | | **[Sum]** |

**Cons:**
| # | Con | Magnitude (1-3) | Reversible? | Weighted Value |
|---|-----|----------------|------------|---------------|
| 1 | [Specific, concrete drawback with detail] | [1/2/3] | [Yes 1.0 / No 1.5] | [M x R] |
| 2 | [Specific, concrete drawback with detail] | [1/2/3] | [Yes 1.0 / No 1.5] | [M x R] |
| 3 | [Specific, concrete drawback with detail] | [1/2/3] | [Yes 1.0 / No 1.5] | [M x R] |
| 4 | [Specific, concrete drawback with detail] | [1/2/3] | [Yes 1.0 / No 1.5] | [M x R] |
| | **Weighted Cons Total** | | | **[Sum]** |

**Net Score for Option A:** [Weighted Pros Total] - [Weighted Cons Total] = **[Net]**

---

### Option B: [Full Name]

**Pros:**
| # | Pro | Magnitude (1-3) | Certainty | Weighted Value |
|---|-----|----------------|-----------|---------------|
| 1 | [Specific, concrete benefit with detail] | [1/2/3] | [High 1.0 / Med 0.75 / Low 0.5] | [M x C] |
| 2 | [Specific, concrete benefit with detail] | [1/2/3] | [High 1.0 / Med 0.75 / Low 0.5] | [M x C] |
| 3 | [Specific, concrete benefit with detail] | [1/2/3] | [High 1.0 / Med 0.75 / Low 0.5] | [M x C] |
| | **Weighted Pros Total** | | | **[Sum]** |

**Cons:**
| # | Con | Magnitude (1-3) | Reversible? | Weighted Value |
|---|-----|----------------|------------|---------------|
| 1 | [Specific, concrete drawback with detail] | [1/2/3] | [Yes 1.0 / No 1.5] | [M x R] |
| 2 | [Specific, concrete drawback with detail] | [1/2/3] | [Yes 1.0 / No 1.5] | [M x R] |
| 3 | [Specific, concrete drawback with detail] | [1/2/3] | [Yes 1.0 / No 1.5] | [M x R] |
| | **Weighted Cons Total** | | | **[Sum]** |

**Net Score for Option B:** [Weighted Pros Total] - [Weighted Cons Total] = **[Net]**

---

### Hidden Factors

**Cognitive Bias Check:**
- **Status quo bias:** [Is the familiar option receiving an unfair premium? Name the test and result.]
- **Sunk cost identified:** [Any prior investment inappropriately influencing the analysis? Name it and dismiss it from weighting.]
- **Omission audit:** [What did the user not mention that an outside observer would consider important?]

**Cost of Inaction:** [What does staying in Option B cost over 1 year, 3 years, 5 years? Use numbers where possible.]

**Regret Test (1-year horizon):** [Which choice would sting more if it went wrong in 1 year, and why?]

**Regret Test (10-year horizon):** [Which regret would feel larger at 10 years: the regret of trying and failing, or never trying?]

**Reference Class:** [How do similar decisions typically play out? What do base rates suggest?]

**Hybrid Option:** [Is there a staged, negotiated, or combined version of these options? Describe it concretely or state "No viable hybrid identified."]

---

### Comparison Summary

| Dimension | Option A: [Name] | Option B: [Name] |
|-----------|-----------------|-----------------|
| Weighted Pros Total | [value] | [value] |
| Weighted Cons Total | [value] | [value] |
| **Net Score** | **[value]** | **[value]** |
| Score difference | [absolute difference -- note if < 2.0 (effectively tied)] | -- |
| Key advantage | [Single strongest pro of this option] | [Single strongest pro of this option] |
| Key risk | [Highest-weighted single con of this option] | [Highest-weighted single con of this option] |
| Regret asymmetry | [Which regret type dominates for this option] | [Which regret type dominates for this option] |

---

### Recommendation

- **Recommended choice:** [Option A or Option B -- name it clearly]
- **Confidence:** [High / Medium / Low] -- [One-sentence justification of the confidence level]
- **Key factor:** [The single factor -- stated as a specific claim -- that tips the balance more than any other]
- **Would reverse if:** [The specific condition or piece of information that would flip this recommendation]
- **Next step (24-48 hours):** [One concrete, specific action the user should take before committing]
- **Reversibility note:** [If the decision is fully or partially reversible, explicitly state this as permission to act without perfect information]
```

---

## Rules

1. **Never produce a flat pro-con list.** The output must always include weighted scoring, hidden factor analysis, a bias audit, and a directional recommendation. A plain list without these elements is not this skill -- it is a lesser output that fails the user.

2. **Maintain strict Magnitude calibration.** Minor (1) = affects one area of life temporarily. Moderate (2) = affects one major life domain meaningfully or multiple areas slightly. Major (3) = transforms a primary life domain or affects multiple major domains simultaneously. Never assign Major simply because a factor feels important -- it must meet the threshold.

3. **Apply multipliers without exception.** Every irreversible con gets the 1.5x multiplier regardless of whether it feels like a big deal. Every Low-certainty pro gets the 0.5x multiplier regardless of how exciting the upside sounds. Consistency in applying multipliers is what makes the system calibrated rather than ad hoc.

4. **Option A is always the change or proposed action; Option B is always the status quo or alternative.** This convention is required for the status quo bias audit to work correctly. If both options are changes (e.g., "Move to City A vs. Move to City B"), identify which one the user is more familiar with or more emotionally attached to and treat that as the status quo equivalent.

5. **The net score difference threshold for a tied result is 2.0 points.** Any difference below 2.0 must be declared effectively tied, and the recommendation must be driven by the regret test and qualitative factors, not the score difference. Reporting a 0.5-point advantage as a decisive recommendation is false precision.

6. **Minimum of 4 pros and 4 cons per option.** Fewer entries almost always means important factors have been omitted. If the user only surfaces 2 cons for one option, probe actively: "What would a critic of this option say? What could go wrong that you haven't mentioned?" Asymmetric lists usually signal unconscious bias toward the option that appears more favorably presented.

7. **The recommendation must be stated as a choice, not a hedge.** "It depends on your values" is not a recommendation -- it is a refusal to analyze. "Option A is the stronger choice, with Medium confidence, contingent on X condition" is a recommendation. The user can disagree with and override it, but they deserve a clear directional answer.

8. **Always run the cost of inaction calculation.** The status quo is never free. Quantify what Option B (the default) costs over 1, 3, and 5 years in the unit most relevant to the decision -- dollars, hours, career levels, relationship quality metrics. Hidden costs of inaction are the most systematically underweighted factor in personal decision-making.

9. **Never let a single factor -- even a very high-weight one -- automatically override the full analysis.** If one factor scores 4.5 and everything else in the analysis points the other way, flag the anomaly and discuss whether that single factor genuinely outweighs the combined weight of all other considerations. The framework is a decision aid, not a mechanical verdict machine.

10. **Emotional and identity factors are legitimate and must be explicitly included.** "This aligns with who I want to be" or "This would feel like a betrayal of my values" are real factors with real weight. Assign them Magnitude and Certainty like any other factor. Do not dismiss them as irrational -- identity alignment is among the most durable predictors of decision satisfaction. At the same time, label them clearly as values/identity factors so the user can consciously weigh them against financial or practical factors.

11. **Check for and name the reference class.** Every significant personal decision has a domain where base rates exist -- job change success rates, startup survival statistics, relocation satisfaction studies, relationship outcome patterns. Citing the relevant base rate grounds the analysis in reality and prevents the user from treating their situation as uniquely exceptional in ways that inflate uncertain pros.

12. **Emotional attachment requires explicit handling, not suppression.** If the user is clearly attached to one option, do not pretend they are neutral. Acknowledge it, include it as a scored factor called "Emotional resonance / identity alignment," and then proceed to weight it against practical factors. Suppressing emotional reality produces analyses that feel wrong to the user and get ignored.

---

## Edge Cases

**The user has already decided and wants validation, not analysis.**
Recognize this pattern from phrasing like "I'm pretty sure I'm going to [X] but wanted to make sure" or "Can you help me think through why [X] is the right call?" Proceed with the full analysis anyway. If the analysis supports their choice, the output provides genuine confirmation with data -- more satisfying and durable than reassurance alone. If the analysis does not support their choice, present the findings clearly and neutrally without pressure: "The weighted analysis actually leans toward [Option B]. Here is what is driving that result. This does not mean your intuition is wrong -- it may be capturing something the framework isn't weighting correctly. Let's look at what that might be." Never tell the user their intuition is wrong. Name the discrepancy and invite examination.

**One option is clearly superior on nearly all dimensions.**
This happens more often than expected, and it is a valuable result. The analysis confirms the obvious, eliminates doubt, and accelerates commitment. Do not artificially inflate the losing option's score to make the analysis look more rigorous. State the result plainly: "Option A dominates Option B across all major dimensions. This is a clear call. The analysis supports your choice with High confidence." Users often need permission to go with the clear winner rather than feeling they have to agonize longer to feel they "did due diligence."

**The user is in acute emotional distress about the decision.**
If the user is describing high anxiety, fear, or emotional overwhelm, the first task is not to launch the framework -- it is to briefly acknowledge the weight of the decision before proceeding. Do not let the structured output feel cold when the user is scared. After acknowledging, proceed with the analysis, and in the recommendation, explicitly address the emotional dimension: "The analytical case supports [Option A]. If the anxiety around this is disproportionate to the actual stakes, that is worth noting -- this is a partially reversible decision, and the worst-case scenario is recoverable."

**The decision involves other people's lives or preferences significantly.**
Add a "Stakeholder Impact" section between the Option tables and the Hidden Factors section. For each affected person or group, name the impact of each option on them and whether their preferences are aligned or misaligned with the user's tentative preference. A decision that is analytically optimal for the user but severely harmful to a partner or dependent is not actually optimal -- relationship and family costs are legitimate cons that belong in the formal weighting.

**The user adds new information or constraints mid-analysis.**
Welcome this as healthy iteration, not an interruption. Stop and restate what has changed: "With this new information -- [specific detail] -- I need to adjust [specific factor]. The new weighting is [X]. Here is how this affects the net score and recommendation." Then provide the updated result. Never say "let's keep going with the original analysis" -- outdated analyses built on superseded information are worse than no analysis.

**Both options are actually bad (forced choice between two poor alternatives).**
Recognize this pattern when all major factors for both options score negatively or when the user expresses dissatisfaction with both choices before analysis begins. Do not pretend the analysis can make a bad situation good. Name it directly: "This analysis suggests neither option is strongly positive -- you are choosing the least-bad path, not a great outcome. That framing matters." Then: recommend the less-bad option, name it as such, and explicitly investigate whether a third option (delay, renegotiate, refuse, or create a new path) exists that the user has not considered. Refer to `weighted-decision-matrix` if a third option materializes.

**The decision has an extremely short deadline (under 24 hours).**
When the user is under acute time pressure, streamline the output. Skip the full tables and produce: a bulleted weighted summary (top 3 pros and top 3 cons per option with their weights), the net comparison, and a clear recommendation with the key factor and the single most important reversing condition. Label this explicitly as "Rapid Pro-Con Analysis (Time-Constrained)" so the user understands it is a condensed version. Offer to run the full analysis if more time becomes available or the deadline gets extended.

**The user's stated priorities conflict with what the analysis reveals they actually value.**
This is a sophisticated edge case. A user may say "financial security is my top priority" but express strong emotional language only when discussing Option A's creative freedom. When stated priorities and emotional language diverge, flag it gently: "You've described financial security as your top priority, but your responses suggest strong emotional weight around the autonomy and creative aspects of Option A. It's possible your priorities have shifted, or that the creative dimension is carrying more weight than you've consciously acknowledged. Does that resonate?" This is not manipulation -- it is helping the user surface their actual preference function, which is the most important input to any decision analysis.

---

## Example

**Input:** "I'm trying to decide whether to accept a job offer at a startup (50% pay raise, equity, remote work) or stay at my current company (stable, good team, clear promotion path). The startup is a 30-person Series A company, about 18 months old. I have 5 days to decide. I have a mortgage and a young kid. I've been at my current company for 4 years."

---

## Pro-Con Analysis: Accept Series A Startup Offer vs. Stay at Current Company

### Decision Context
- **Decision:** Should I accept the Series A startup job offer before the deadline in 5 days?
- **Option A (Change):** Accept the startup offer -- 50% salary raise, equity package, fully remote, 30-person company, Series A, 18 months old
- **Option B (Status Quo):** Stay at current company -- 4-year tenure, stable income, strong team relationships, defined promotion path
- **Reversibility Class:** Partially Reversible -- leaving can be undone (can return to job market), but the specific current role, tenure-based institutional position, and team relationships cannot be fully recovered once exited
- **Decision deadline:** 5 days from today
- **Evaluation window:** 12-18 months until meaningful signal on startup viability; 6 months until clarity on promotion path at current company
- **User's stated priorities (inferred):** Financial security (mortgage + child), career growth, stability
- **Non-negotiable constraints:** Cannot take a pay cut; must have health insurance coverage; cannot relocate (remote option satisfies this)

---

### Option A: Accept Startup Offer

**Pros:**
| # | Pro | Magnitude (1-3) | Certainty | Weighted Value |
|---|-----|----------------|-----------|---------------|
| 1 | 50% salary increase -- immediate and certain; if current salary is $120k, this is $60k/yr more, accelerating mortgage payoff and child education savings by years | 3 | High 1.0 | 3.0 |
| 2 | Equity stake with meaningful upside -- Series A companies that reach exit return median 3-5x invested value to early employees; if granted 0.25% and company exits at $100M, that is $250k pre-dilution | 3 | Low 0.5 | 1.5 |
| 3 | Fully remote -- eliminates commute cost and time (assume 60 min/day = 250 hours/year reclaimed), provides schedule flexibility critical for a young child | 2 | High 1.0 | 2.0 |
| 4 | Broader scope and ownership -- at 30 people, scope of role is likely 2-3 levels broader than equivalent role at a larger company; accelerated skill accumulation and resume differentiation | 2 | Med 0.75 | 1.5 |
| 5 | First-mover career leverage -- startup experience at Series A, if successful, dramatically increases market value and opens doors to senior leadership roles or future founding opportunities | 2 | Med 0.75 | 1.5 |
| | **Weighted Pros Total** | | | **9.5** |

**Cons:**
| # | Con | Magnitude (1-3) | Reversible? | Weighted Value |
|---|-----|----------------|------------|---------------|
| 1 | Startup failure risk -- approximately 60-65% of Series A companies do not achieve a successful exit within 5 years; job loss within 12-36 months is a plausible scenario, not an edge case; with mortgage and child, this is not abstract risk | 3 | No 1.5 | 4.5 |
| 2 | Loss of 4-year tenure and established institutional capital -- relationships, reputation, domain knowledge, and trust built over 4 years at current company cannot be easily reconstructed; the promotion likely within 12 months disappears | 3 | No 1.5 | 4.5 |
| 3 | Early-stage startup workload -- Series A companies typically expect 55-65 hour weeks during growth phases vs. established-company norm of 40-45; adds 10-20 hours/week with a young child at home | 2 | Yes 1.0 | 2.0 |
| 4 | Benefits uncertainty -- health insurance quality, 401k matching, and PTO are often weaker at early-stage startups; must verify before signing | 1 | Yes 1.0 | 1.0 |
| 5 | Role ambiguity and organizational instability -- 30-person companies restructure roles frequently; the job offered today may look significantly different in 6 months | 2 | Yes 1.0 | 2.0 |
| | **Weighted Cons Total** | | | **14.0** |

**Net Score for Option A:** 9.5 - 14.0 = **-4.5**

---

### Option B: Stay at Current Company

**Pros:**
| # | Pro | Magnitude (1-3) | Certainty | Weighted Value |
|---|-----|----------------|-----------|---------------|
| 1 | Income stability with mortgage and young child -- known salary, no income interruption risk; financial floor is protected | 3 | High 1.0 | 3.0 |
| 2 | Promotion path within approximately 12 months -- user has 4 years of tenure and institutional credibility; promotion is likely (though not guaranteed) and means title, salary, and scope increase within current safety | 2 | Med 0.75 | 1.5 |
| 3 | Established team relationships -- high-quality team relationships are rare and take years to build; these relationships have current professional value and likely generate ongoing referrals and support | 2 | High 1.0 | 2.0 |
| 4 | Known culture and operating environment -- no adaptation cost, no uncertainty about management style, company direction, or culture fit | 1 | High 1.0 | 1.0 |
| 5 | Full benefits package intact -- health insurance, 401k, PTO all confirmed and established; important given family status | 1 | High 1.0 | 1.0 |
| | **Weighted Pros Total** | | | **8.5** |

**Cons:**
| # | Con | Magnitude (1-3) | Reversible? | Weighted Value |
|---|-----|----------------|------------|---------------|
| 1 | Immediate and ongoing salary gap -- at $60k/year differential, staying costs $60k in Year 1, $300k over 5 years in foregone income (assuming no correction); even with promotion, unlikely to close the gap fully | 3 | Yes 1.0 | 3.0 |
| 2 | No remote work -- daily commute continues; with a young child, commute time is a particularly high-cost burden competing directly with family presence and energy | 2 | Yes 1.0 | 2.0 |
| 3 | Career growth ceiling risk -- larger established companies often have slower promotion cycles, higher competition for advancement, and more rigid role boundaries than startup environments | 2 | Med 0.75 | 1.5 |
| 4 | Regret risk -- if the startup succeeds significantly (outcome visible within 2-3 years), the user will have clear evidence of what not taking the risk cost; regret under high visibility is psychologically costly and hard to recover from | 2 | No 1.5 | 3.0 |
| 5 | Stagnation signal -- having been at the same company 4 years without major progression may increasingly affect marketability; at the 6-7 year mark this becomes a resume question in competitive job markets | 1 | Med 0.75 | 0.75 |
| | **Weighted Cons Total** | | | **10.25** |

**Net Score for Option B:** 8.5 - 10.25 = **-1.75**

---

### Hidden Factors

**Cognitive Bias Check:**
- **Status quo bias:** Staying at the current company feels safer partly because it is known and comfortable. The reversal test: if you were currently at the startup and your old company offered you the equivalent of current stability + team + promotion path, would you seriously consider returning? Likely yes -- which suggests Option B's appeal is partly familiarity, not pure quality.
- **Sunk cost identified:** Four years of tenure at the current company is a meaningful sunk cost. The effort, relationships, and loyalty built are real -- but they do not obligate future years. They are not a reason to stay; they are an emotional pull that needs to be named and separated from forward-looking analysis.
- **Omission audit:** The user did not mention the equity vesting schedule (typical is 4-year vest with 1-year cliff -- if laid off at month 11, all equity is forfeited), the startup's runway beyond Series A (how many months of cash on hand?), or the identity of the startup's investors (tier-1 VCs dramatically reduce failure risk and increase exit probability). These are critical data points that are missing from the analysis.

**Cost of Inaction:** At $60,000/year salary differential, staying in Option B costs approximately $60,000 in Year 1, $127,500 over 2 years (accounting for a likely promotion), and $240,000 over 5 years in direct foregone income, excluding equity upside. This is the price of Option B. It must be named explicitly.

**Regret Test (1-year horizon):** At 1 year out, the more acute regret scenario is taking the startup role and losing the job at month 13 due to a startup failure -- leaving a mortgage-holding parent unemployed in a potentially tighter job market than today. This is the regret that should feel heaviest over the short horizon, and it is what the weighted analysis reflects.

**Regret Test (10-year horizon):** At 10 years out, the calculus reverses. If the startup is successful (exits, grows significantly), the user will have clear, visible evidence of what not taking the risk cost -- both financially and in terms of career trajectory. The 10-year regret of never trying, in a domain the user clearly finds exciting enough to be considering it seriously, is likely to be durable. "I was too scared" is a harder thought to live with at 40 than "I took a risk and it didn't work out."

**Reference Class:** Series A startups in 2023-2024 vintage have approximately a 35-40% chance of a successful exit or sustained operation within 5 years, based on historical venture outcomes. The first 18 months post-Series A are typically the highest-execution-risk period. A company that is already 18 months old and still operating has survived its most fragile window -- slightly positive signal. The user should ask for the exact months of runway remaining on current funding before deciding.

**Hybrid Option:** Two concrete hybrids exist. First: negotiate with the current employer before the deadline -- specifically request (a) a salary adjustment of 20-30% and (b) 2-3 remote days per week. If granted, this option captures meaningful benefits of both paths without the startup risk. Second: ask the startup if the offer is open to a 30 or 60-day start date rather than immediate -- this buys time to negotiate with the current employer and gather more financial data from the startup. Both hybrids are worth attempting before the deadline.

---

### Comparison Summary

| Dimension | Option A: Accept Startup | Option B: Stay Current |
|-----------|------------------------|----------------------|
| Weighted Pros Total | 9.5 | 8.5 |
| Weighted Cons Total | 14.0 | 10.25 |
| **Net Score** | **-4.5** | **-1.75** |
| Score difference | Option B wins by 2.75 points -- meaningful but not decisive | -- |
| Key advantage | 50% salary raise (certain, immediate) + remote flexibility | Income stability protecting mortgage + family during startup's highest-risk phase |
| Key risk | Job loss at month 12-18 due to startup failure with mortgage active | $240k foregone income over 5 years + increasing career stagnation signal |
| Regret asymmetry | 10-year regret of never trying is high; 1-year regret of failed risk is acute | 1-year regret of staying is manageable; 10-year regret of staying grows over time |

---

### Recommendation

- **Recommended choice:** Option B -- Stay at current company -- but only if the hybrid options below are attempted first
- **Confidence:** Medium -- the weighted analysis supports staying by 2.75 points, but that margin is substantially driven by two missing data points: the startup's current runway and the equity vesting schedule. If the runway is 24+ months and the vesting has no cliff or a short cliff, the risk profile of Option A drops materially and the recommendation may flip.
- **Key factor:** The combination of an active mortgage, a young child, and the startup's 18-month age puts the household in the highest-vulnerability window if the startup fails. The 4.5-weighted irreversible cons of failure risk and tenure loss are the single most influential factors in the analysis. If household financial exposure were lower (e.g., no mortgage, dual income), the recommendation would likely reverse.
- **Would reverse if:** (1) The startup can demonstrate 24+ months of runway on current funding -- this reduces failure risk from a plausible scenario to a manageable one. (2) The current employer refuses any salary adjustment and remote flexibility -- eliminating the hybrid option forces a starker binary. (3) The equity vesting schedule has a cliff shorter than 12 months -- meaning equity begins accumulating faster and reduces the risk of walking away with nothing.
- **Next step (24-48 hours):** Contact the startup's hiring manager or CFO and ask two specific questions: "What is the company's current runway in months on Series A funding?" and "Can you walk me through the equity vesting schedule, including cliff period?" Then contact your current manager and initiate a conversation with: "I've received a competitive external offer and I'd like to discuss whether there's flexibility on compensation and remote work before I make a decision." These two conversations will produce the information needed to either confirm or reverse this recommendation.
- **Reversibility note:** This is a partially reversible decision. If you accept the startup and it fails within 2 years, you will return to the job market as someone with startup leadership experience and a record of taking intelligent career risks -- qualities that generally improve marketability, not diminish it. The worst-case scenario, while genuinely hard with a mortgage and child, is survivable and recoverable. Do not treat this as if a wrong choice means permanent damage. It does not.
