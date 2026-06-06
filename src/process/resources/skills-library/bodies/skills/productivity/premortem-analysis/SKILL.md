---
name: premortem-analysis
description: |
  Conducts a premortem by imagining a decision has failed one year from now, identifying the specific reasons for failure, and producing a mitigation plan for the top failure modes. Creates a complete premortem report with actionable prevention steps.
  Use when the user asks about anticipating what could go wrong with a decision, running a premortem, stress-testing a plan, or identifying failure modes before committing.
  Do NOT use for project risk registers (use risk-assessment), comparing options with scoring (use weighted-decision-matrix), or business strategic risk analysis (use business strategy skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "decision-making analysis planning"
  category: "productivity"
  subcategory: "decision-making"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Premortem Analysis

## When to Use

**Use this skill when:**
- The user has a specific, defined plan or decision they are about to commit to and wants to stress-test it before acting -- a business launch, hiring decision, major purchase, career move, product release, partnership agreement, or personal commitment
- The user explicitly asks to "run a premortem," "imagine what could go wrong," or "think through failure scenarios" for something they are nearly ready to execute
- The user wants to identify blind spots in a plan that has already been positively framed -- they have been selling the idea to themselves or others and need permission to think negatively
- The user wants to build specific safeguards, tripwires, or kill switches before beginning a significant commitment of time, money, or reputation
- The user is about to make an irreversible or difficult-to-reverse decision (signing a lease, quitting a job, launching publicly, making a large investment) and wants structured anticipatory thinking
- The user is in a group or organizational context and wants to surface dissenting views, overcome groupthink, or give junior members permission to raise concerns about a plan that leadership has championed
- The user is running a retrospective on a past failure and wants a structured framework to prevent repetition (retrospective premortem -- the same framework applied backward)

**Do NOT use when:**
- The user has not yet chosen a course of action and is still comparing options -- use `weighted-decision-matrix` to score and select, then return to premortem once a decision is made
- The user wants an exhaustive ongoing risk register for an active project with probability tracking, owners, residual risk, and audit trails -- use `risk-assessment`, which is built for that operational context
- The user is thinking through second- and third-order consequences of a decision that is not yet made -- use `second-order-thinking` to explore the causal chain before committing
- The user wants to document the rationale, context, and reasoning for a decision they have already fully committed to -- use `decision-journal`
- The user is analyzing strategic business risk at the enterprise or portfolio level (market disruption, competitive positioning, macro scenarios) -- use business strategy skills built for scenario planning
- The user wants to evaluate a decision that is purely reversible with low stakes (what restaurant to choose, which book to read) -- premortem overhead is not warranted; a simple pros and cons list suffices
- The user wants a root cause analysis of something that has already failed -- use a `5-whys` or fishbone approach, which is designed for post-failure diagnosis rather than pre-failure prevention

## Process

### 1. Capture the Decision, Success Definition, and Horizon

Before any failure generation, establish an unambiguous picture of what you are stress-testing.

- Ask the user to state the decision in one sentence. If they cannot, the plan is not yet concrete enough for a premortem -- help them sharpen it first. A premortem on a vague plan produces vague failures.
- Elicit the specific success definition with numbers where possible: not "the course succeeds" but "200 students enrolled at $99 within 12 months, generating $19,800 gross revenue." Failure is only meaningful relative to a concrete success target.
- Establish the time horizon. Research by Gary Klein, who developed the premortem technique at Klein Associates, suggests 12 months is the default for most personal and professional plans. Use 6 months for fast-moving projects (software sprints, marketing campaigns) and 24-36 months for long-cycle decisions (career transitions, business partnerships, real estate).
- Record the user's initial confidence level on a 1-10 scale BEFORE generating any failure modes. This baseline is critical -- the post-premortem confidence delta is one of the most diagnostic outputs of the analysis. If confidence does not drop at all after the premortem, the failure modes were not specific enough.
- Note any constraints or non-negotiables the user has already committed to: budget locked, team selected, deadline fixed. These become inputs to the detectability and mitigation analysis.

### 2. Establish the Premortem Mental Frame -- Lock the Failure as Certain

The single most important cognitive shift in a premortem is moving from "this might fail" to "this has failed." This is not rhetorical -- it is a documented psychological mechanism.

- Use this exact framing: "It is [time horizon] from now. [The plan] has failed. Not partially, not 'could have gone better' -- it has completely failed. [Success definition] was not achieved. You are standing at the wreckage, looking back. The failure is real and certain."
- Explain why this framing works: research in counterfactual thinking (Kahneman and Lovallo, 1993; Klein, 2007) shows that imagining a future state as already true, rather than as a probability, removes the natural defensive optimism that suppresses negative thinking. People generate 30% more failure reasons in prospective hindsight than in standard risk brainstorming.
- Do NOT soften the frame. "What might go wrong" produces hedged, low-stakes answers. "What went wrong" produces committed, specific answers. Push back if the user starts listing things as "possible risks" -- reframe every answer as a past-tense explanation: "I underestimated X," "The assumption about Y was wrong," "I ran out of Z before hitting the goal."
- If the user is in a group setting, have each person write their failure reasons independently before sharing. Social influence from dominant voices is one of the primary ways premortems get captured by optimism bias in groups.

### 3. Generate Failure Reasons -- Structured Divergent Thinking

Generate 8-12 specific failure reasons using a structured category sweep. Do not stop at the obvious failures -- the most valuable premortem outputs are the non-obvious ones.

- Sweep across these six failure categories systematically. Missing any category is a common source of blind spots:
  - **Execution failures:** The plan was sound but was not carried out. Causes include underestimated time (the Planning Fallacy -- Daniel Kahneman's research shows people underestimate task duration by 25-100%), lack of follow-through, skill gaps that were not identified in advance, bottlenecks from dependencies on others, and scope creep.
  - **Assumption failures:** A belief that was treated as fact turned out to be wrong. These are the most dangerous failures because the plan designer often cannot see them. Common examples: "customers want this," "the technology will work as expected," "the market is big enough," "I will have enough time," "the partner will deliver."
  - **External failures:** Events outside the plan designer's control that derailed the plan. Market shifts, regulatory changes, competitor moves, economic changes, personal life events, platform policy changes, key person departures.
  - **Motivation and psychological failures:** The plan designer lost momentum, burned out, shifted priorities, or encountered unexpected emotional resistance. Underappreciated in most risk analysis but extremely common in personal and entrepreneurial plans. Ask specifically: "When in the past have you abandoned something you were excited about? What happened?"
  - **Resource failures:** Money ran out before results materialized, time was consumed by other obligations, team capacity was overestimated, key tools or infrastructure proved more expensive or complex than anticipated.
  - **Feedback and learning failures:** The plan had no mechanism to detect that it was failing early enough to course-correct. The person kept executing a failing plan because the signal was too weak or too delayed. This is the "boiling frog" failure -- incremental deterioration that is never acute enough to trigger response.

- For each failure reason, push for specificity. "I ran out of money" is not a failure reason -- "I had $20,000 budgeted for development but the actual cost was $38,000 because I did not account for QA, legal review, and the third iteration of the MVP" is a failure reason. Specificity is what makes mitigations actionable.
- Use the "newspaper test": if this failure happened, what would the headline say? This forces concrete, imageable failure scenarios rather than abstract risks.
- Generate a minimum of 8 failure reasons across at least 4 different categories. Fewer than 8 almost always means the user is anchoring on the most obvious failures and missing the blind-spot class that premortems are specifically designed to surface.

### 4. Score and Rank Failure Modes with RPN

Use a Risk Priority Number (RPN) framework adapted from Failure Mode and Effects Analysis (FMEA), which was developed in aerospace engineering and is now used across industries precisely because it surfaces non-obvious high-priority risks.

- Score each failure mode on three independent dimensions:
  - **Likelihood (L):** How probable is this failure, given everything you know? Scale of 1-5, where 1 = very unlikely (less than 10% chance), 2 = unlikely (10-25%), 3 = possible (25-50%), 4 = likely (50-75%), 5 = almost certain (greater than 75%). Base likelihood on comparable past experience, not optimistic projections. First-time activities should rarely score below 3 on relevant execution and knowledge failure categories.
  - **Impact (I):** If this failure occurred, how severely would it damage the overall outcome? Scale of 1-5, where 1 = minor setback (plan continues with small adjustment), 3 = significant damage (plan is delayed or partial success at best), 5 = fatal to the plan (total failure of success definition). Impact should be scored independently of likelihood -- a low-probability, high-impact failure is exactly what insurance is for.
  - **Detectability (D):** How early would you know this failure was occurring? Scale of 1-5, where 1 = very early warning (you would know within days and have time to respond), 3 = moderate warning (you might notice after weeks but still have time), 5 = no warning until too late (you will not know until the failure has already completed). This is the most underrated dimension -- a highly detectable failure is far less dangerous than an undetectable one, even if likelihood and impact are equal.

- Calculate RPN = Likelihood × Impact × Detectability. Range: 1 (no concern) to 125 (maximum concern).
- Rank all failure modes by RPN, highest first.
- Treat RPN as a relative ranking tool, not an absolute threshold. The goal is to identify which failure modes deserve deep mitigation investment, not to certify a risk level.
- When two failure modes have equal RPNs, prioritize by Detectability first (higher D = less visible = more dangerous), then by Impact (higher I = more consequential if it happens).
- Flag any failure mode with Impact = 5 regardless of RPN. A rare but fatal failure deserves explicit contingency planning even if its RPN is moderate.

### 5. Build Mitigation Plans for the Top Three to Five Failure Modes

For each top-ranked failure mode, construct a three-part mitigation response: prevention, early warning tripwire, and contingency.

- **Prevention action:** What single concrete action, taken NOW before the plan begins, most reduces the likelihood or impact of this failure? The prevention action must be specific enough to calendar or assign. "Do more research" is not a prevention action. "Interview 5 potential customers this week to validate the core assumption that they will pay $99 for this" is a prevention action.
- **Early warning tripwire:** A tripwire is a pre-defined, observable signal that triggers a specific response. It is NOT a vague "watch for problems" -- it is a specific metric or observable event with a threshold. Example: "If I have not reached 100 email subscribers by 4 weeks before launch, I delay launch by 6 weeks and pivot to audience-building." Tripwires prevent the common failure mode of executing a failing plan too long because the deterioration is gradual. Define the tripwire metric, the threshold, and the response in advance.
- **Contingency response:** If the failure occurs despite prevention and the tripwire was missed, what is the damage-control response? Contingency plans should be calibrated to the impact score -- high-impact failures need detailed contingencies, low-impact failures can have simple ones.
- For each mitigation, assign an owner. In solo plans, "Self" is fine, but name a specific accountability mechanism: a calendar reminder, an accountability partner, a weekly review process.
- Note the cost of each prevention action -- time, money, delay. If the cost of prevention is high relative to the risk, that is useful information for the confidence recalibration.

### 6. Identify Fatal Flaws and Plan-Threatening Combinations

A standard premortem treats each failure mode independently. A deep premortem also checks for failure combinations.

- After ranking individual failure modes, scan for failure pairs that are correlated. If failure A occurs, does it increase the likelihood of failure B? Example: losing a key team member (external failure) often simultaneously triggers execution failures AND motivation failures. Correlated failures compound risk multiplicatively.
- Check for fatal flaws: a failure mode that, if it occurred, cannot be mitigated and would end the plan regardless of other actions. Fatal flaws require one of three responses: redesign the plan to eliminate the flaw, accept and explicitly acknowledge the risk, or reconsider whether to proceed.
- A plan with a fatal flaw and no viable mitigation should prompt an explicit "reconsider" recommendation, not just a mitigation plan. A premortem that prevents a bad decision is more valuable than one that patches it. Be direct about this.
- Also check for timeline compression: are there failure modes that individually score moderate RPNs but if they both occur in sequence, they collapse the plan? Sequence risk is underweighted in single-failure analyses.

### 7. Recalibrate Confidence and Produce the Final Report

The confidence recalibration is where the premortem produces its most actionable output: a clear recommendation about whether to proceed, modify, or reconsider.

- Ask the user for their updated confidence level after reviewing all failure modes and mitigations. A well-executed premortem typically drops confidence by 1-3 points for a sound plan (it surfaces real risks but the plan survives scrutiny) and by 4-5 points for a plan with serious unresolved weaknesses.
- If confidence increases after a premortem, something went wrong -- either the failure modes were too vague, the mitigations were too easy, or the user was not engaging with the failure scenario as real. Push back: "Is there any failure mode we identified that you have genuinely never considered before today? If not, we probably missed something."
- Generate a three-option recommendation: Proceed (plan is sound, mitigations are in place), Proceed with modifications (specific changes to address top failure modes), or Reconsider (one or more fatal flaws, or confidence drop greater than 4 points without viable mitigation).
- Compile the Prevention Action Checklist -- all prevention actions from the top mitigation plans, formatted as a concrete to-do list with owners and timelines. This is the document the user takes away and acts on immediately.

## Output Format

```
## Premortem Report: [Decision/Plan Name]

---

### Plan Summary
| Field | Details |
|-------|---------|
| Decision | [One-sentence description of the plan] |
| Success definition | [Specific, measurable outcome -- numbers where possible] |
| Time horizon | [X months/years post-launch or post-execution] |
| Initial confidence | [X]/10 |
| Constraints already locked | [Budget, team, deadline, or other fixed inputs] |

---

### The Failure Scenario

> "It is [time horizon] from now. [The plan] has failed completely and unambiguously. [Success definition] was not achieved. [State the specific failure outcome in concrete terms -- e.g., 'Revenue was $3,200 against a $19,800 target. The product was shut down. Here is what went wrong:'"]

---

### All Failure Modes

| # | Failure Reason | Category | L (1-5) | I (1-5) | D (1-5) | RPN | Fatal Flaw? |
|---|---------------|----------|---------|---------|---------|-----|-------------|
| 1 | [Specific past-tense failure description] | [Execution / Assumption / External / Motivation / Resource / Feedback] | [score] | [score] | [score] | [L×I×D] | [Yes/No] |
| 2 | [Specific failure] | [category] | [score] | [score] | [score] | [RPN] | [Yes/No] |
| 3 | [Specific failure] | [category] | [score] | [score] | [score] | [RPN] | [Yes/No] |
| 4 | [Specific failure] | [category] | [score] | [score] | [score] | [RPN] | [Yes/No] |
| 5 | [Specific failure] | [category] | [score] | [score] | [score] | [RPN] | [Yes/No] |
| 6 | [Specific failure] | [category] | [score] | [score] | [score] | [RPN] | [Yes/No] |
| 7 | [Specific failure] | [category] | [score] | [score] | [score] | [RPN] | [Yes/No] |
| 8 | [Specific failure] | [category] | [score] | [score] | [score] | [RPN] | [Yes/No] |

**Scoring guide:** L = Likelihood (1=<10%, 5=>75%) | I = Impact (1=minor setback, 5=fatal to plan) | D = Detectability (1=immediate warning, 5=no warning until complete) | RPN = L × I × D

---

### Correlated Failure Risk

[Identify any failure modes that are causally linked -- if A occurs, B becomes more likely. Note sequence risks where two moderate-RPN failures in sequence could be plan-killing even though neither is fatal alone.]

---

### Top [3-5] Failure Mode Mitigation Plans

**#[Rank]: [Failure reason] -- RPN: [score]**
- **Why this ranks highest:** [Explain which of the three RPN dimensions is driving the score and why this is more dangerous than it appears]
- **Prevention action (do NOW):** [Specific action, specific owner, specific deadline]
- **Early warning tripwire:** [Observable metric] + [Threshold that triggers action] + [Specific triggered response]
- **Contingency response:** [Damage control if failure occurs despite prevention]
- **Cost of prevention:** [Time/money/delay required for prevention action]
- **Owner:** [Person responsible and accountability mechanism]

[Repeat for each top failure mode]

---

### Fatal Flaw Assessment

[Either: "No fatal flaws identified -- all top failure modes have viable mitigations." OR a specific description of the fatal flaw, why it cannot be mitigated, and what plan redesign or reconsideration it warrants.]

---

### Confidence Recalibration

| Metric | Value |
|--------|-------|
| Initial confidence | [X]/10 |
| Post-premortem confidence | [Y]/10 |
| Delta | [+/- Z points] |
| Reason for change | [What specific failure modes or blind spots drove the confidence shift] |

**Recommendation:** [Proceed / Proceed with modifications / Reconsider]

[If Proceed with modifications: list the 2-3 specific changes to the plan that address the top failure modes before execution begins.]

[If Reconsider: name the specific fatal flaw or cluster of unmitigated risks that warrants a plan redesign, not just a mitigation patch.]

---

### Prevention Action Checklist

Execute these actions BEFORE beginning the plan:

- [ ] [Prevention action 1] -- Owner: [name] -- Deadline: [date or milestone]
- [ ] [Prevention action 2] -- Owner: [name] -- Deadline: [date or milestone]
- [ ] [Prevention action 3] -- Owner: [name] -- Deadline: [date or milestone]
- [ ] [Prevention action 4] -- Owner: [name] -- Deadline: [date or milestone]
- [ ] Define tripwire monitoring system: [what metric, what tool, what frequency]
- [ ] Schedule first tripwire review: [specific date, X weeks after launch]
- [ ] Schedule full plan health check: [specific date, X months after launch]
```

## Rules

1. **Never produce a premortem that treats failure as hypothetical.** The entire mechanism depends on imagining failure as certain and past. Use past tense throughout the failure scenario. If the user responds with "what might go wrong" framing, restate: "You are not predicting -- you are explaining. It already happened. Why?"

2. **Always generate at least 8 failure reasons across at least 4 distinct categories.** A premortem that only generates 3-4 execution failures has not surfaced blind spots -- it has restated the plan's obvious challenges. The assumption, feedback, and motivation categories are the ones most likely to contain the non-obvious failures that make premortems valuable.

3. **Score every failure mode on all three RPN dimensions independently.** Likelihood and impact are intuitive; detectability is the dimension people skip. A failure that scores 3/3/3 (RPN 27) is less dangerous than a failure that scores 2/3/5 (RPN 30), even though the second one is less likely and equally impactful -- because you will not see it coming. Detectability must be scored based on available feedback mechanisms in the actual plan, not in theory.

4. **Every prevention action must be executable before the plan begins.** "Monitor closely" is not a prevention action -- it is a statement of intent. "Set up a weekly enrollment tracking dashboard with a tripwire at 10 students in month 1 that triggers a pivot to 1:1 outreach" is a prevention action. Push every vague prevention statement to specificity.

5. **Define tripwires in quantitative, non-negotiable terms before execution.** A tripwire that is not defined in advance will be rationalized away when the failure signal is ambiguous (which it always is in the moment). Tripwires must have a specific observable metric, a specific threshold, and a pre-committed response -- all three elements, not one or two.

6. **Flag any failure mode with Impact = 5 for explicit mitigation, regardless of RPN.** A low-likelihood, high-impact failure with a low detectability score (RPN might be 10-15) deserves a contingency plan. The RPN framework is designed to rank priorities, not to deprioritize catastrophic outcomes. Insurance exists precisely for low-probability, high-impact events.

7. **Check for correlated failures before finalizing the report.** The most dangerous premortem blind spot is treating each failure as independent when in reality one failure causes or enables others. External disruptions often simultaneously trigger execution failures and motivation failures. Sequence risk -- two moderate failures in order -- can be plan-killing even when neither alone would be.

8. **If a fatal flaw is identified, recommend reconsideration explicitly and specifically.** Do not soften a fatal flaw into a mitigation plan. If the core assumption of a plan is wrong and cannot be tested before commitment, say so directly. "Adding a buffer budget" is not a mitigation for a business model that does not generate demand. Naming a fatal flaw is the highest-value output a premortem can produce.

9. **The confidence delta is a diagnostic tool, not just a number.** If confidence drops by 0-1 points, the premortem was probably too gentle -- push harder on assumption failures and feedback failures. If confidence drops by 5+ points, the plan likely has fundamental problems that mitigation cannot resolve, and a redesign conversation is warranted. A drop of 1-3 points for a sound plan is normal and healthy.

10. **Do not allow the prevention checklist to become a wish list.** Every item on the checklist must have an owner and a deadline. A checklist without owners and deadlines is documentation, not commitment. In solo plans, the mechanism for accountability must be explicit: a calendar block, an accountability partner check-in, a written commitment, or a public announcement.

## Edge Cases

### The plan is highly personal (health change, relationship decision, major life move)
Personal plans have an additional failure category that professional plans underweight: identity and self-concept failures. These occur when the plan requires the person to behave in ways that conflict with their current self-image or social environment. A person who has always been sedentary planning a marathon training program faces execution failures AND identity failures -- "I stopped thinking of myself as someone who runs." In these cases, add a specific question: "Is there any part of this plan that requires you to become a different kind of person? What is the evidence you can make that transition?" Probe for social environment failures: who in their current social circle will consciously or unconsciously undermine the change? This is one of the most reliable predictors of personal plan failure and one of the least discussed.

### The user has already begun executing the plan
Premortems are still valuable mid-execution, but the frame shifts in two important ways. First, ask: "It is 12 months from NOW -- not from the start -- and it has failed. What went wrong from this point forward?" This correctly scopes the analysis to the remaining decision space. Second, classify prevention actions as either "still possible" or "already committed." Some prevention actions will reference decisions that have already been made and cannot be reversed -- label those as "monitor only" in the mitigation plan. Sunk cost is real: the user cannot get back time or money already spent, but they CAN still make choices about what happens next. Keep the analysis focused on the forward decision space.

### The user's plan is a group or organizational decision with multiple stakeholders
In group premortems, the most important process modification is ensuring independent generation of failure reasons before group discussion. Have each person write their list individually, then combine. Research by Klein and others shows that group premortems conducted conversationally reproduce the optimism bias of group planning -- the dominant voice's failure list becomes the group's failure list. When combining individual lists, count how many people independently identified each failure (frequency = a proxy for consensus risk level) and prioritize failures that were independently surfaced by multiple people. Also: failure reasons that only ONE person identified and that the group initially dismisses deserve special scrutiny -- they are likely to be the contrarian insights that premortems are designed to surface.

### Multiple failure modes share the same or similar RPN
When RPNs tie, apply a priority tiebreaker sequence: (1) prioritize by Detectability, highest first -- failures you cannot see coming are more dangerous regardless of likelihood; (2) then by Impact, highest first -- given equal visibility, the failure that damages the plan more deserves more mitigation investment; (3) then by Likelihood, highest first -- given equal visibility and impact, the more probable failure gets prioritized. Document the tiebreaker reasoning in the report so the user understands why one tied failure outranks another.

### The user rates all failure modes as low likelihood (optimism bias)
This is common and expected -- it is the same optimism bias that makes premortems necessary. Challenge each low likelihood rating with three questions: (1) "Has this ever happened to you on a similar plan?" (2) "Has this ever happened to someone you know on a similar plan?" (3) "If you were advising a friend on this plan, would you rate this as unlikely?" If any answer is "yes" or "I'm not sure," the rating should be at least 3/5. Additionally, use the outside view correction: for any first-time activity (first business, first course, first major renovation), base rates for similar plans should anchor the likelihood estimates. Most first-time businesses do not reach their year-one revenue targets. Most home renovations exceed budget by 20-40%. These base rates should inform likelihood scoring more than the user's optimistic projection.

### The premortem reveals a failure mode that is also a benefit of the plan
Some failure modes reveal that the plan has embedded a real option or upside case that has not been explicitly considered. For example: a course launch "fails" because a corporate client wants to license the entire curriculum, and the creator spends all their time on that deal instead of selling individual enrollments. The original success metric (200 individual students) is missed, but a better outcome is achieved. When a "failure" scenario reveals an unexpected upside path, note it separately as a "pivot opportunity" -- a scenario worth planning for deliberately rather than treating as a failure to prevent. This is the premortem equivalent of discovering a valuable assumption you did not know you were making.

### The plan involves external dependencies on partners, vendors, or third parties
Plans with external dependencies have a structural vulnerability: the premortem analyst can only generate mitigations for decisions within their control. For any failure mode caused by a third-party dependency, add a specific mitigation type that is often overlooked: contractual and structural safeguards. Before the plan begins, failure modes driven by vendor failure, partner non-performance, or platform changes should prompt: "What contract clause, SLA, backup vendor, or structural redundancy would protect against this?" A technology startup whose plan depends on a single API provider should ask: "What is our contingency if that API is deprecated or pricing doubles?" The answer to that question -- a backup provider relationship, a contractual rate lock, or an internal capability build -- is the mitigation, not optimism about the provider's stability.

## Example

**Input:** "I'm a senior software engineer at a large company. I've decided to quit my job and start a B2B SaaS company targeting law firms -- I want to build a contract review automation tool. I have 8 months of living expenses saved and a co-founder who will handle sales. We plan to launch an MVP in 6 months and have 10 paying customers by month 12 at $500/month. I'm pretty confident -- maybe 8/10."

---

## Premortem Report: B2B SaaS Contract Review Automation for Law Firms

---

### Plan Summary
| Field | Details |
|-------|---------|
| Decision | Quit full-time employment to co-found a B2B SaaS company building contract review automation for law firms |
| Success definition | 10 paying law firm customers at $500/month recurring ($5,000 MRR) by month 12 after quitting |
| Time horizon | 12 months post-quit date |
| Initial confidence | 8/10 |
| Constraints already locked | 8 months of runway (personal savings), co-founder on sales already committed, founder is primary technical builder |

---

### The Failure Scenario

> "It is 12 months after you quit your job. The contract review SaaS has failed. You have 2 paying customers, generating $1,000 MRR -- 20% of target. Your savings are exhausted. You are negotiating to return to employment or take contract work to cover expenses. Your co-founder has disengaged. Looking back, here is what went wrong:"

---

### All Failure Modes

| # | Failure Reason | Category | L (1-5) | I (1-5) | D (1-5) | RPN | Fatal Flaw? |
|---|---------------|----------|---------|---------|---------|-----|-------------|
| 1 | Law firms did not buy from an unknown vendor with no legal industry track record -- trust and procurement cycles defeated the sales process | Assumption | 4 | 5 | 4 | 80 | Yes (if no mitigation) |
| 2 | Enterprise sales cycles for law firms are 6-12 months -- the runway ran out before deals closed | Resource | 4 | 5 | 3 | 60 | Yes (if no mitigation) |
| 3 | Co-founder did not generate pipeline -- "handling sales" meant sending emails, not building a repeatable process | Execution | 3 | 5 | 3 | 45 | No |
| 4 | The MVP was technically functional but did not map to how law firm associates actually review contracts in practice | Assumption | 3 | 4 | 5 | 60 | No |
| 5 | Founder burned out at month 7 -- building the product alone while also doing customer development, marketing, and operations | Motivation | 4 | 4 | 3 | 48 | No |
| 6 | Legal liability concerns -- law firms refused to use AI for contract review without indemnification clauses the founders could not offer | External | 3 | 5 | 5 | 75 | Yes (if unaddressed) |
| 7 | A well-funded competitor (or an incumbent like Kira Systems or Luminance) released a competitive feature while the MVP was in development | External | 3 | 3 | 4 | 36 | No |
| 8 | Customer discovery was done with in-house legal teams at tech companies, not actual law firms -- the target customer's workflow was not validated | Feedback | 4 | 4 | 5 | 80 | No |
| 9 | The $500/month price point was too low for law firms but too high to close quickly -- pricing was neither enterprise nor self-serve | Assumption | 3 | 3 | 4 | 36 | No |
| 10 | No legal industry network meant cold outreach was the only acquisition channel -- response rates were below 1% | Execution | 4 | 4 | 4 | 64 | No |

**Scoring guide:** L = Likelihood (1=<10%, 5=>75%) | I = Impact (1=minor setback, 5=fatal to plan) | D = Detectability (1=immediate warning, 5=no warning until complete) | RPN = L × I × D

---

### Correlated Failure Risk

**High-risk correlation: Failure #1 (law firm trust/procurement) + Failure #2 (runway exhaustion).** These are not independent. If law firms require 3-6 months to move through procurement, and the sales process was not started until after the MVP was built (month 6), the first paying customers may not close until month 9-11 -- leaving no buffer if any deals slip. The runway failure is a near-certain consequence of the procurement cycle failure.

**High-risk correlation: Failure #4 (MVP does not fit workflow) + Failure #8 (customer discovery with wrong customer segment).** If discovery was done with in-house legal teams rather than law firm associates, the product will be built for the wrong workflow. This failure is invisible until actual law firm users try the product -- late discovery, late iteration, runway consumed.

**Sequence risk: Failure #3 (co-founder sales underperformance) → Failure #5 (founder burnout).** If the co-founder does not generate qualified pipeline, the technical founder will feel compelled to do customer development, sales, AND product -- a classic founder burnout sequence that is extremely common and extremely hard to see coming because each individual task seems reasonable.

---

### Top 5 Failure Mode Mitigation Plans

**#1 (tied): Customer discovery was done with the wrong customer segment -- RPN: 80**
- **Why this ranks at the top:** Detectability is 5/5 -- this failure will not be visible until the MVP is built and real law firm users try it for the first time. At that point, 5-6 months of build time has been consumed and the learning is expensive. The impact is severe because a product that does not fit the actual workflow cannot be sold regardless of how good the technology is.
- **Prevention action (do NOW -- before quitting the job):** Interview 15 law firm associates (not in-house counsel, specifically law firm associates doing commercial contract review at AmLaw 200 or comparable firms) in the next 6 weeks. Use a structured discovery script focused on: what tool they use today, where they lose time in the review process, what they have tried and abandoned, and what a perfect outcome looks like. Do not pitch the product. Map their actual workflow step-by-step. Build the MVP to fit that map, not your assumption of it.
- **Early warning tripwire:** If you cannot get 15 law firm associates to agree to a 30-minute discovery call within 4 weeks, you do not have sufficient market access to launch -- delay quit date until you do. Threshold: fewer than 5 discovery calls completed by week 4 triggers an outreach strategy review.
- **Contingency response:** If post-MVP user testing with actual law firms reveals the workflow assumption was wrong, do not ship. Run a 2-week sprint to rebuild the core workflow based on observed user behavior. Document what assumption failed and why before building the corrected version.
- **Cost of prevention:** 20-30 hours of founder time before quit date. No financial cost.
- **Owner:** Founder -- calendar 3 outreach sessions per week for 6 weeks starting immediately.

**#2 (tied): Law firms distrust unknown vendors -- procurement and trust barriers -- RPN: 80**
- **Why this ranks at the top:** This is the classic "crossing the chasm" failure for enterprise B2B in a regulated, risk-averse industry. Law firms are late technology adopters by structure: they have malpractice liability, client confidentiality obligations, and IT security reviews that make buying from unknown startups genuinely risky for them, not just uncomfortable. Likelihood is 4/5 because this is a documented pattern, not speculation.
- **Prevention action (do NOW):** Before launching, identify and recruit 1-2 advisory board members who are current or former law firm partners with active professional networks. Offer meaningful equity (0.1-0.25% vested over 2 years) in exchange for active introductions. Advisory credibility is a trust proxy that can shorten procurement timelines by 50-70% in legal markets. Also: apply to at least one legal tech accelerator or incubator (many law firms run them) to gain institutional credibility before cold outreach begins.
- **Early warning tripwire:** If 30 cold outreach contacts to law firm decision-makers (managing partners or heads of operations) yield fewer than 2 discovery calls in 60 days, cold outreach alone will not scale to 10 customers. Threshold: 2 positive responses / 30 contacts in 60 days triggers a full channel pivot to warm introductions and legal tech community engagement.
- **Contingency response:** If pipeline is stalling due to trust barriers in month 4-6, pivot the go-to-market to a "lighthouse customer" strategy: offer the first 2-3 law firms a free 90-day pilot with a money-back guarantee and unlimited support. Prioritize getting a recognizable firm name on the customer list over initial revenue. One named reference customer in legal tech can unlock the next 10.
- **Cost of prevention:** 10-20 hours finding advisors plus equity grant. Potentially 4-6 weeks of runway consumed by a free pilot program if that contingency is activated.
- **Owner:** Both founders -- co-founder to lead advisor recruitment; founder to lead legal tech community engagement.

**#3: Legal liability and indemnification barriers -- RPN: 75**
- **Why this ranks third:** This is scored as a potential fatal flaw because it is structural. Law firms using AI for contract review face malpractice exposure if the tool makes an error that results in a client claim. A startup with no insurance, no track record, and no ability to offer meaningful indemnification will be rejected by risk-averse law firm procurement committees even if the technology is excellent. Detectability is 5/5 -- this objection typically surfaces only when the deal is near close, after months of sales time have been invested.
- **Prevention action (do NOW -- before launch):** Consult a legal technology attorney (not a general startup attorney) about the liability landscape for AI-assisted legal document review. Research what indemnification language competitors offer. Determine whether professional liability insurance for AI-assisted legal work is available and what it costs. Build an acceptable indemnification clause into the standard contract before the first sales conversation, not after the first objection.
- **Early warning tripwire:** If any discovery call includes the phrase "what happens if the tool misses something" or "how do you handle errors," treat it as a liability objection signal. Pre-prepare a liability brief and include it in all follow-up materials. If 3 or more discovery conversations raise this as a blocker, the liability framework needs immediate re-architecture.
- **Contingency response:** If the product cannot be sold with viable indemnification terms, pivot the business model from "the tool makes the decision" to "the tool assists the lawyer, who retains final judgment." This repositions the product as a productivity tool rather than a decision tool -- materially different liability profile. May require product changes but preserves the market.
- **Cost of prevention:** $2,000-5,000 in legal fees for a proper liability review. A small cost relative to the potential cost of a deal falling through due to an unresolved objection.
- **Owner:** Founder -- schedule legal consultation within 30 days of quit date.

**#4: Enterprise sales cycle exceeds runway -- RPN: 60 (tied with workflow mismatch, prioritized by impact)**
- **Why this ranks fourth:** The mechanics of B2B sales cycles in law firms are well-documented. Mid-size law firms (50-200 attorneys) typically have 3-6 month procurement cycles for new software. If the MVP launches at month 6 and sales begins in earnest then, the earliest first payment is month 9 -- leaving 1-2 months of runway when 10 customers are needed. This is a structural timing problem, not a performance problem.
- **Prevention action (do NOW):** Restructure the sales strategy to begin pipeline development in month 1 (immediately after quitting), not month 6 (after MVP is built). The goal of months 1-3 is not product -- it is building a pipeline of 10-15 qualified prospects who have committed to be "first to try" when the MVP is ready. This means sales begins before product. Also: reconsider the runway. 8 months is insufficient for B2B SaaS targeting law firms. A seed round or revenue-based advance from a legal tech accelerator should be part of the plan.
- **Early warning tripwire:** At month 3, if the co-founder does not have 5 qualified law firms with a named contact who has agreed to a demo when the MVP is ready, the month-12 target is mathematically unreachable given procurement timelines. Threshold: fewer than 5 committed demo prospects by month 3 triggers a pivot to a lower-friction customer segment (e.g., solo practitioners or small firms with shorter procurement cycles) as a bridging revenue strategy.
- **Contingency response:** If runway is approaching exhaustion (2 months of expenses remaining) before achieving $3,000 MRR, the founder must either raise a bridge round (target: $150,000-250,000), take on consulting work at their engineering day rate (typically $150-250/hour for senior engineers) to extend runway, or pivot to a self-serve pricing model for smaller firms to generate faster, lower-value revenue while the enterprise sales cycle matures.
- **Cost of prevention:** No direct cost -- this is a sequencing change. Extend runway planning should include a seed funding target.
- **Owner:** Co-founder leads pipeline; founder leads funding strategy -- establish milestone at 90 days post-quit.

**#5: No legal industry network -- cold outreach as sole acquisition channel -- RPN: 64**
- **Why this ranks fifth:** Cold outreach to law firms has documented response rates of 0.5-2% at the top of funnel. At 1% response rate, reaching 10 paying customers requires roughly 1,000 cold contacts -- a volume that is incompatible with a 12-month runway for a 2-person team that is simultaneously building a product. This is not a pessimistic projection; it is the base rate for cold B2B SaaS outreach in a low-trust industry.
- **Prevention action (do NOW):** Before quitting, invest 60 hours over 6 weeks building a warm outreach foundation. Join and participate in legal technology communities: Legal Tech Hub, the Association of Legal Administrators, Legal Innovators Slack communities, bar association technology committees. Attend one legal tech conference (ILTACON, CLOC, Legalweek) either as a sponsor or participant before launch. Publish 3-5 pieces of thought leadership content (on LinkedIn or in legal trade publications) on contract review automation. These activities convert cold outreach into warm outreach, improving response rates by 5-10x.
- **Early warning tripwire:** If at month 2, the co-founder's outreach is generating fewer than 3 positive responses per week from qualified prospects, cold outreach is not the right channel. Threshold triggers: shift to partnership channel -- approach law firm management consultants, legal operations consultants, and bar association technology committees as intermediaries who can refer business.
- **Contingency response:** If acquisition is stalling completely, consider a channel partnership with a legal tech consultant or a legal practice management software company (e.g., integrate with an existing platform used by law firms) to access their installed base rather than acquiring law firms directly.
- **Cost of prevention:** $500-2,000 for conference attendance; 60 hours of pre-quit relationship-building time.
- **Owner:** Both founders -- co-founder builds outreach channels; founder builds content and community presence.

---

### Fatal Flaw Assessment

**Two conditional fatal flaws identified:**

1. **Legal liability and indemnification** (Failure #6) is a potential fatal flaw if not addressed before the first enterprise sales conversation. It is not inherently fatal -- it is solvable with a proper legal framework -- but it will kill deals if left unaddressed. This must be resolved in the first 30 days post-quit, not treated as a later-stage concern.

2. **Runway vs. enterprise sales cycle mismatch** (Failure #2) is a structural fatal flaw if the funding plan does not change. 8 months of runway is incompatible with 6-12 month B2B sales cycles. A funding strategy (seed round, accelerator, or bridge) must be part of the plan from day one, not treated as something to pursue only if revenue fails to materialize. Recommend: set a seed funding target of $300,000-500,000 and begin investor conversations in month 1, not month 6.

Both fatal flaws are solvable, which means the plan is viable -- but only if these two items are addressed before launch, not after.

---

### Confidence Recalibration

| Metric | Value |
|--------|-------|
| Initial confidence | 8/10 |
| Post-premortem confidence | 5/10 |
| Delta | -3 points |
| Reason for change | The sales cycle / runway mismatch and the liability framework gap are structural issues that were not in the original plan. The customer discovery gap means the MVP may be built for the wrong workflow. None of these are plan-killers, but all three require concrete action before the original plan timeline can be trusted. |

**Recommendation:** Proceed with modifications

**Required modifications before executing the original plan:**

1. Do not quit until 15 law firm associate discovery interviews are complete. This is the foundation. If you cannot get these interviews, you do not have enough market access to execute the plan.
2. Add a seed funding or accelerator track to the plan starting in month 1. 8 months of runway is insufficient for this market. Target: $300,000-500,000 bridge or accelerator funding by month 4.
3. Engage a legal technology attorney in month 1 to build a liability framework and indemnification clause before the first sales conversation.
4. Restructure the co-founder's activities so pipeline development starts in month 1, not month 6. The co-founder should have 5 committed demo prospects by month 3.

---

### Prevention Action Checklist

Execute before quitting your job:

- [ ] Complete 15 discovery interviews with law firm associates (not in-house counsel) -- Deadline: 6 weeks from today -- Owner: Founder
- [ ] Identify and approach 2 law firm partner advisory board candidates -- Deadline: 4 weeks from today -- Owner: Both founders
- [ ] Join 3 legal tech professional communities and make 10 substantive contributions -- Deadline: Before quit date -- Owner: Founder
- [ ] Publish first thought leadership piece on contract review automation -- Deadline: Before quit date -- Owner: Founder

Execute in month 1 post-quit:

- [ ] Engage legal technology attorney for liability and indemnification review -- Deadline: Day 30 -- Owner: Founder -- Budget: $3,000-5,000
- [ ] Identify and apply to 2 legal tech accelerators -- Deadline: Day 30 -- Owner: Both founders
- [ ] Build seed investor target list of 20 investors with legal tech portfolio experience -- Deadline: Day 30 -- Owner: Both founders
- [ ] Co-founder to begin structured outreach to law firm operations directors -- Deadline: Day 14 -- Owner: Co-founder

Execute as ongoing tripwire reviews:

- [ ] Month 3 tripwire review: co-founder has 5 qualified demo-committed law firm prospects (if not, trigger customer segment pivot review) -- Owner: Both founders
- [ ] Month 3 tripwire review: seed funding or accelerator process is active (if not, trigger consulting revenue bridge plan) -- Owner: Founder
- [ ] Month 4 full health check: reassess all 10 failure modes with updated scores based on 4 months of real data -- Owner: Both founders
