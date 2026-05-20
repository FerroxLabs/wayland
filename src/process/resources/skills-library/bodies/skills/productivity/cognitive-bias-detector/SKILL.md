---
name: cognitive-bias-detector
description: |
  Comprehensive cognitive bias catalog covering anchoring, confirmation bias, survivorship bias, sunk cost fallacy, Dunning-Kruger effect, availability heuristic, bandwagon effect, framing, loss aversion, status quo bias, halo effect, and more. Includes detection techniques, debiasing strategies, and decision hygiene practices. Use when the user asks about cognitive bias detector or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "decision-making analysis frameworks"
  category: "productivity"
  subcategory: "methodology-frameworks"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Cognitive Bias Detector

## When to Use

**Use this skill when:**
- A user describes a decision they made or are making and wants to know what cognitive distortions may have shaped it -- e.g., "We're $3M into this project and considering pulling the plug -- am I being rational?"
- A user presents an argument, belief, or conclusion and wants it stress-tested for biased reasoning before they act on it
- A user wants to audit a group decision-making process -- team, committee, board -- for systematic errors and recommends structural improvements
- A user is designing a hiring process, performance review system, investment checklist, or any evaluation framework and wants bias resistance built in from the start
- A user is preparing a pre-mortem, post-mortem, or decision journal entry and needs a structured bias checklist to work through
- A user explicitly names a cognitive bias and wants a deeper explanation, detection method, real-world example, and debiasing protocol
- A user describes a debate, disagreement, or negotiation and asks whether either party is reasoning poorly

**Do NOT use this skill when:**
- The user needs help with logical fallacies in formal argumentation (e.g., ad hominem, straw man, slippery slope) -- those are informal fallacies, not cognitive biases; use a logic/argumentation skill instead
- The user is asking about mental health, depression, distorted thinking, or cognitive distortions in a clinical context -- that is CBT territory, not decision science
- The user is doing statistical analysis and wants to check for measurement bias, sampling bias, or model bias -- use a data science/statistics skill instead
- The user wants to learn about persuasion or rhetoric techniques to influence others rather than improve their own thinking
- The request is narrowly about negotiation anchoring tactics as a strategy to deploy against opponents -- that is a negotiation skill domain
- The user needs a full strategic decision framework (scenario planning, SWOT, decision trees) rather than bias detection specifically -- combine with a strategic analysis skill

---

## Process

### Step 1: Elicit the Decision Context

Before analyzing biases, gather enough context to make the analysis specific rather than generic. Generic bias lists are useless; specific bias diagnoses are actionable.

- Ask: **What is the exact decision, belief, or judgment being examined?** Require the user to state it in a single sentence. Vague inputs produce vague outputs.
- Ask: **What are the stakes?** Financial loss, career risk, relationship damage, public commitment, organizational consequences. Higher stakes justify more rigorous debiasing.
- Ask: **Who decided or is deciding?** Individual, small group, committee, market crowd. Group size and dynamics change which biases are most active.
- Ask: **What information was encountered, and in what order?** The sequence of information is critical for diagnosing anchoring, framing, and recency bias.
- Ask: **What was the emotional context?** Fear, excitement, fatigue, time pressure, social pressure, grief. Emotional arousal is the primary amplifier of System 1 dominance.
- Ask: **Has the decision already been made or is it still open?** Post-hoc analysis (hindsight bias risk) differs from prospective debiasing (pre-mortem mode).

### Step 2: Classify the Decision Type

Different decision types have characteristic bias signatures. Matching the decision type to its known bias profile focuses the analysis.

- **Investment / resource allocation decisions:** Sunk cost fallacy, loss aversion, overconfidence, planning fallacy
- **Personnel evaluations (hiring, promotions, performance reviews):** Halo effect, affinity bias, anchoring to salary history, recency bias, in-group bias
- **Forecasting and estimation:** Overconfidence, planning fallacy, availability heuristic, base rate neglect
- **Group consensus decisions (strategy sessions, committee votes):** Groupthink, bandwagon effect, authority bias, shared information bias, cascade effects
- **Risk assessment:** Availability heuristic, probability neglect, optimism bias, scope insensitivity
- **Evaluating others' behavior:** Fundamental attribution error, just-world hypothesis, in-group/out-group bias
- **Continuing vs. stopping decisions:** Sunk cost fallacy, status quo bias, loss aversion, commitment escalation
- **Belief formation and updating:** Confirmation bias, myside bias, belief perseverance, Bayesian neglect

### Step 3: Run the Primary SCAN Diagnostic

Apply the SCAN protocol systematically to the described situation. This produces a structured first-pass bias inventory.

- **S -- Sources of information:** What data did the decision-maker use? Were disconfirming sources consulted? Did the first piece of information dominate? (Anchoring, confirmation bias, availability heuristic)
- **C -- Comparisons and reference points:** What was the decision compared against? Was an explicit alternative analysis performed, or was the status quo the implicit baseline? (Status quo bias, anchoring, relativity)
- **A -- Affected parties and incentives:** Who benefits from this decision being made this way? Who was in the room and who was absent? Whose voices were amplified? (Authority bias, in-group bias, incentive-driven reasoning)
- **N -- Narrative coherence:** Does the reasoning feel like a smooth, compelling story? Stories that are "too clean" indicate motivated reasoning. Real situations are messy; if the account has no counterevidence, it's been edited. (Confirmation bias, narrative fallacy, hindsight bias)

### Step 4: Apply the Deep Bias Diagnostic Checklist

After the SCAN, run the full 20-point bias diagnostic. For each applicable bias, determine: Present / Absent / Cannot Determine, and estimate its influence on the decision (Low / Medium / High).

**Category 1 -- Anchoring and Estimation Biases:**
- Anchoring: Was an initial number, date, or estimate mentioned before deliberation began?
- Overconfidence: Is the confidence level expressed proportional to the actual expertise and evidence?
- Planning Fallacy: Does any timeline or budget estimate ignore historical base rates for similar projects?

**Category 2 -- Evidence Evaluation Biases:**
- Confirmation Bias: Was evidence that contradicts the conclusion actively sought, or only evidence supporting it?
- Availability Heuristic: Is probability being estimated from ease of recall rather than actual frequency data?
- Survivorship Bias: Are conclusions drawn from observable successes while ignoring the distribution of failures?
- Base Rate Neglect: Is a specific case being judged without reference to how often this type of situation ends in various outcomes?

**Category 3 -- Loss and Change Biases:**
- Sunk Cost Fallacy: Is past investment (time, money, emotion) cited as a reason to continue rather than future expected value?
- Loss Aversion: Is a potential loss of X being weighted more heavily than an equivalent potential gain of X?
- Status Quo Bias: Is the current option preferred primarily because changing requires action and the default is inertia?
- Commitment Escalation: Is a prior public commitment driving the decision rather than new information?

**Category 4 -- Social and Group Biases:**
- Bandwagon Effect: Is the decision or belief supported primarily by consensus rather than independent evidence?
- Authority Bias: Is an authority being cited outside their domain of genuine expertise?
- In-Group Bias: Is evaluation of people or ideas influenced by tribal affiliation rather than merit?
- Groupthink: Did a group suppress dissenting views or reach consensus faster than the complexity warranted?

**Category 5 -- Perception and Attribution Biases:**
- Halo Effect: Is a positive quality in one domain being imported to an unrelated domain?
- Framing Effect: Would the decision change if the identical facts were presented with opposite framing?
- Fundamental Attribution Error: Are other parties' behaviors attributed to character while one's own are attributed to circumstances?
- Dunning-Kruger / Blind Spot Bias: Is the confidence level in the decision consistent with demonstrated domain track record?
- Hindsight Bias: Is a past outcome being described as "obvious in retrospect" in a way that distorts lessons learned?

### Step 5: Severity-Rank the Active Biases

Not all detected biases are equally consequential. Rank them by influence to focus the debiasing effort.

- **High severity:** The bias likely changed the direction of the decision or belief -- without it, a different choice would probably have been made. Requires explicit debiasing before proceeding.
- **Medium severity:** The bias inflated confidence or distorted emphasis but probably did not change the ultimate direction. Requires a calibration check.
- **Low severity:** The bias was present but its effect on the outcome was minor given other evidence. Note it for awareness but do not over-engineer around it.
- For each High-severity bias, pair it with its primary debiasing strategy (see the Bias-to-Debiasing Map in the reference section).
- If 3 or more biases are present in the same decision, flag for **compound bias amplification** -- biases interact and compound each other's effects.

### Step 6: Prescribe Targeted Debiasing Protocols

Deliver specific, actionable debiasing steps matched to the identified biases. Generic advice ("think more carefully") is useless. Specific protocols are not.

- For **anchoring:** Have the decision-maker write their own estimate of the quantity in question before seeing any numbers. Then compare. If their estimate shifted more than 15--20% toward an anchor they encountered, the anchor was dominant.
- For **confirmation bias:** Assign the Steel Man Protocol -- require the user to write the strongest possible version of the opposing argument in 3--5 sentences. If they cannot do this, they have not adequately engaged with disconfirming evidence.
- For **sunk cost fallacy:** Apply the Newspaper Test -- "If a journalist reported that we continued this decision ONLY because of prior investment, would we be embarrassed?" Also ask: "If we had not already invested anything, would we start this today at the current expected return?"
- For **loss aversion:** Convert the decision to expected value in common units. Probability-weight both gains and losses explicitly. Ask whether the loss framing or gain framing of the identical expected value changes the choice.
- For **availability heuristic:** Require a base rate lookup. "How often does X type of outcome occur in situations like this?" For business decisions, check industry base rates (e.g., startup survival rates, M&A success rates, product launch failure rates).
- For **groupthink:** Implement structured disagreement. Each participant writes their position independently before discussion. The discussion facilitator reads all written positions before anyone speaks. Dissent is given explicit air time.
- For **halo effect:** Use independent dimension evaluation. Score each relevant attribute separately on a defined scale before computing an overall evaluation. Never start with holistic impressions.

### Step 7: Deliver the Bias Audit Report

Structure the final output using the standardized format below. Include: the decision statement, the SCAN summary, the full diagnostic table, the severity ranking, and the specific debiasing protocols prescribed. Close with a Decision Confidence Rating -- a calibrated estimate of how much the identified biases may have inflated or deflated confidence in the conclusion.

- State clearly which biases were found present, which were absent, and which could not be determined from available information.
- Flag if the situation requires a structural intervention (redesigning the process) versus an individual intervention (debiasing the decision-maker's reasoning).
- If the decision has already been made, reframe the output as lessons for future decisions rather than suggesting the person was irrational -- this preserves utility and engagement.
- Provide a 1-3 item priority action list -- the highest-leverage changes the person can make right now.

---

## Output Format

```
╔══════════════════════════════════════════════════════════════╗
║              COGNITIVE BIAS AUDIT REPORT                     ║
╚══════════════════════════════════════════════════════════════╝

DECISION STATEMENT
──────────────────────────────────────────────────────────────
[One sentence stating the decision, belief, or judgment examined]

DECISION TYPE: [Investment / Personnel / Forecasting / Group Consensus /
                Risk Assessment / Attribution / Continuation / Belief]

CONTEXT SUMMARY
──────────────────────────────────────────────────────────────
Stakes:         [Financial / Career / Organizational / Reputational]
Decision-maker: [Individual / Small group / Committee / Market]
Decision status:[Open (prospective) / Already made (retrospective)]
Emotional state:[Noted amplifiers: time pressure, fear, excitement, etc.]

SCAN DIAGNOSTIC SUMMARY
──────────────────────────────────────────────────────────────
S (Sources):    [What sources were used; were disconfirming sources absent?]
C (Comparisons):[What reference points anchored the comparison?]
A (Affected):   [Who had influence; who was absent from the room?]
N (Narrative):  [Does the account feel suspiciously clean or messy?]

FULL BIAS DIAGNOSTIC TABLE
──────────────────────────────────────────────────────────────
Bias                     | Status    | Severity | Evidence
─────────────────────────|-----------|----------|──────────────────────────
Anchoring                | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Overconfidence           | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Planning Fallacy         | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Confirmation Bias        | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Availability Heuristic   | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Survivorship Bias        | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Base Rate Neglect        | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Sunk Cost Fallacy        | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Loss Aversion            | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Status Quo Bias          | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Commitment Escalation    | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Bandwagon Effect         | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Authority Bias           | [P/A/ND]  | [H/M/L]  | [Specific evidence]
In-Group Bias            | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Groupthink               | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Halo Effect              | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Framing Effect           | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Fundamental Attribution  | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Dunning-Kruger           | [P/A/ND]  | [H/M/L]  | [Specific evidence]
Hindsight Bias           | [P/A/ND]  | [H/M/L]  | [Specific evidence]

Status codes: P = Present, A = Absent, ND = Cannot Determine
Severity codes: H = High (likely changed outcome), M = Medium (inflated confidence),
                L = Low (minor effect)

COMPOUND BIAS FLAG: [Yes -- [X] biases co-present and likely amplifying / No]

SEVERITY-RANKED ACTIVE BIASES
──────────────────────────────────────────────────────────────
HIGH SEVERITY (address before proceeding):
  1. [Bias name] -- [One-sentence explanation of how it operated here]
  2. [Bias name] -- [One-sentence explanation]

MEDIUM SEVERITY (calibrate):
  1. [Bias name] -- [One-sentence explanation]

LOW SEVERITY (note for awareness):
  1. [Bias name] -- [One-sentence explanation]

TARGETED DEBIASING PROTOCOLS
──────────────────────────────────────────────────────────────
For each High-severity bias:

[Bias Name]
  Protocol:   [Specific named technique -- e.g., Steel Man Protocol]
  Steps:      [Concrete numbered steps, 2-4 items]
  Success indicator: [How do you know the debiasing worked?]

PRIORITY ACTION LIST (Top 3 highest-leverage actions)
──────────────────────────────────────────────────────────────
  1. [Specific action with method and timing]
  2. [Specific action with method and timing]
  3. [Specific action with method and timing]

DECISION CONFIDENCE RATING
──────────────────────────────────────────────────────────────
Pre-debiasing confidence stated/implied: [X]%
Estimated bias inflation/deflation:      [+/-Y percentage points]
Calibrated confidence recommendation:   [X ± Y]%
Interpretation: [One sentence on what this means for next steps]
```

---

## Rules

1. **Never diagnose biases without evidence from the user's actual account.** Saying "you might have confirmation bias" without citing a specific element of their description is useless speculation. Every bias finding must cite the specific detail that triggered it.

2. **Distinguish between bias present and bias decisive.** A bias can be present but not change the outcome. If the decision would have been the same under debiased conditions, say so -- over-pathologizing good decisions undermines trust and utility.

3. **Sequence debiasing by severity, not by alphabetical or canonical order.** Always address High-severity biases first. A user who fixes a minor framing issue while missing a catastrophic sunk cost fallacy has been poorly served.

4. **Never say "just be more objective" or "think more carefully."** These are not debiasing strategies. Every prescription must be a named protocol with concrete steps -- Steel Man, Reference Class Forecasting, Independent Assessment before Group Discussion, Pre-Mortem, Blind Evaluation, etc.

5. **Respect that knowing about a bias does not eliminate it.** Research by Pronin, Lin, and Ross (2002) demonstrated the Bias Blind Spot -- people rate themselves as less biased than others even after being educated about their own biases. Structural interventions (process changes, checklists, blind evaluation) outperform insight alone.

6. **Flag compound bias situations explicitly.** When 3 or more biases are co-present, they interact non-linearly. Sunk cost + loss aversion + commitment escalation, for example, create a reinforcing trap that is far stronger than any individual bias. Compound situations require structural debiasing, not just individual reflection.

7. **Treat retrospective decisions and prospective decisions differently.** If the decision is already made and irreversible, pivot the analysis toward learning -- what does this reveal about the decision-making process that can be changed going forward? Do not make users feel foolish for past decisions; that produces defensiveness, not learning.

8. **Do not confuse risk tolerance with loss aversion.** Choosing a safe option is not necessarily loss aversion. Loss aversion is specifically irrational avoidance of an option with positive expected value because the loss component is weighted disproportionately. A person with genuinely low risk tolerance who correctly calculates expected value and still prefers certainty is exercising a legitimate preference, not a bias.

9. **Apply base rates wherever quantitative claims appear.** If someone says "this startup is going to succeed because the founder is great," the relevant base rates are: roughly 10% of startups survive 10 years (U.S. Bureau of Labor Statistics), roughly 1 in 2,000 reach significant scale, and founder quality is one of many factors. Grounding claims in base rates prevents both overconfidence and availability-heuristic distortions.

10. **When organizational processes are the source of bias, recommend structural changes, not just individual debiasing.** If a hiring process has no blind resume review, no structured interview scorecard, and no independent evaluations before group discussion, telling one person to "be more objective" will accomplish nothing. The system produces the bias; fixing the system fixes the bias.

---

## Edge Cases

### The User Is Rationalizing, Not Analyzing

**Scenario:** The user describes a decision, lists "possible biases," but the framing is clearly self-exculpatory -- they are seeking confirmation that their decision was fine.

**Handling:** Do not simply validate the desired conclusion. Apply the SCAN test with particular attention to the Narrative indicator. A genuinely messy decision will have acknowledged counterevidence; a rationalization will not. Name the dynamic directly but non-accusatorially: "The account you've described presents a compelling case for the decision made. For the analysis to be genuinely useful, I need to find the strongest version of the case against it. Can you describe the 2-3 best arguments an intelligent critic would make?"

### Multiple Biases Cancel or Compensate

**Scenario:** Anchoring pushed the estimate high, but excessive risk aversion pushed it low, and the final decision happens to be near the rational midpoint by accident.

**Handling:** Report both biases as present even if their net effect was approximately zero. The fact that biases cancelled does not mean the process was sound -- a different situation with the same decision-making style could produce two biases in the same direction. Flag this explicitly: "The process was biased, even if the outcome approximated what an unbiased process might have reached."

### The User Is Evaluating Someone Else's Decision (Not Their Own)

**Scenario:** A manager wants to know if their team made a biased decision, or a journalist wants to diagnose a public figure's reasoning.

**Handling:** Apply additional caution about the Fundamental Attribution Error in the analysis itself. The user analyzing someone else's decision is prone to attributing the other party's reasoning flaws to character or stupidity rather than to circumstances and predictable cognitive architecture. Explicitly note: "The biases identified here are features of the decision-making environment, not evidence of the decision-maker's intelligence or integrity." Also flag Actor-Observer Asymmetry -- the user may hold the other party to a standard they would not apply to their own reasoning in the same situation.

### Group Decisions with Unclear Deliberation Records

**Scenario:** The user describes a committee decision but does not know the order in which opinions were expressed, whether independent assessments were gathered, or whether dissent was suppressed.

**Handling:** The absence of information about group process is itself diagnostic. If there is no record of independent pre-discussion positions, the default assumption should be that anchoring to the first speaker and preference cascade effects were present. Recommend reconstructing as much of the process as possible by asking participants individually and privately what their initial positions were before discussion began.

### Decision Involves Strong Emotional Investment

**Scenario:** The user is evaluating a career change, a relationship decision, or a family business choice -- domains where emotional stakes are extreme and the line between rational preference and biased reasoning is genuinely contested.

**Handling:** Distinguish carefully between biases (systematic errors) and values (genuine preferences that rational people can hold). Choosing job security over higher income at a risky startup is not necessarily loss aversion -- it may accurately reflect the person's utility function. Focus the analysis on whether the factual beliefs supporting the decision (not the values themselves) show signs of bias. "You believe this startup has a 70% chance of success. Let's look at whether that specific belief is well-calibrated."

### Bias Identified But Reversal Would Produce the Same Decision

**Scenario:** The diagnostic reveals clear confirmation bias in how evidence was gathered, but upon examining the available disconfirming evidence, it would not have changed the conclusion.

**Handling:** Report the bias as real and the process as flawed, but note that robustness analysis suggests the conclusion survives debiasing in this instance. This is an important nuance -- a bad process can occasionally produce a good outcome. The recommendation should focus on fixing the process: "The conclusion appears robust here, but the next time this process runs with a case where disconfirming evidence is actually decisive, it will miss it. Fix the process now, not just the conclusion."

### The User Wants to Use This Skill to Manipulate Others

**Scenario:** A user asks how to use cognitive bias knowledge to exploit others' biases in negotiation, sales, or persuasion -- essentially asking for a manipulation toolkit.

**Handling:** This skill is explicitly scoped to detecting and reducing biases in one's own reasoning and designing fairer evaluation systems. Techniques for exploiting others' cognitive biases fall under persuasion/manipulation domains. Redirect: "This skill focuses on improving decision quality for the person or team doing the reasoning. For negotiation strategy, a negotiation skill would be more appropriate. I can help you understand what biases to watch for in your own negotiation reasoning."

### The Dunning-Kruger Trap in the Analysis Itself

**Scenario:** The user has done some reading on cognitive biases and now confidently identifies biases in every situation, over-applying the framework to the point where their "debiasing" is itself a form of overconfident pattern-matching.

**Handling:** Note the meta-level irony when appropriate: familiarity with bias vocabulary creates its own form of overconfidence -- the certainty that you can reliably detect biases in others and yourself. Apply the same epistemic humility criteria to the bias analysis itself: "What evidence would I need to see to be wrong about this bias diagnosis?" If the user cannot answer that question, their bias identification may itself be confirmation bias in action.

---

## Example

**User Input:**
"My team has been building an internal analytics platform for 18 months. We've spent about $1.4M and 6,000 engineering hours on it. A vendor just released a SaaS product that does 85% of what we need for $80K per year. Our CTO says we should keep building because we're 'so close to done' and 'we've come this far.' Half the team agrees, half wants to switch. How do I think about this decision rationally?"

---

**Full Bias Audit Report:**

```
╔══════════════════════════════════════════════════════════════╗
║              COGNITIVE BIAS AUDIT REPORT                     ║
╚══════════════════════════════════════════════════════════════╝

DECISION STATEMENT
──────────────────────────────────────────────────────────────
Should the company continue building a custom internal analytics
platform (after $1.4M and 18 months of investment) or switch to
a vendor SaaS product at $80K/year that covers 85% of requirements?

DECISION TYPE: Continuation / Resource Allocation

CONTEXT SUMMARY
──────────────────────────────────────────────────────────────
Stakes:         $1.4M already invested; ongoing engineering cost vs.
                $80K/yr SaaS; opportunity cost of 6,000 eng. hours
Decision-maker: Small group (mixed team + CTO)
Decision status:Open (prospective) -- decision not yet finalized
Emotional state:Fatigue (18-month project); potential identity
                investment by the CTO; social pressure from team split

SCAN DIAGNOSTIC SUMMARY
──────────────────────────────────────────────────────────────
S (Sources):    CTO's reasoning cites past investment and subjective
                proximity to completion ("so close"). No base rate
                data cited for build-vs-buy decisions at this stage.
                No independent estimate of remaining build cost.
C (Comparisons):The implicit comparison baseline is the $1.4M already
                spent -- not the future cost and value of each option.
                The correct comparison: Expected future value of
                continuing vs. expected future value of switching.
A (Affected):   CTO holds authority and has likely been the internal
                champion of the build. Engineers who built it have
                identity invested. The team members favoring the switch
                may be applying cleaner forward-looking analysis.
N (Narrative):  The "so close to done" narrative is a classic
                completion-proximity illusion -- teams routinely
                underestimate the final 20% of a software project.
                The account is suspiciously optimistic about
                remaining effort.

FULL BIAS DIAGNOSTIC TABLE
──────────────────────────────────────────────────────────────
Bias                     | Status | Severity | Evidence
─────────────────────────|--------|----------|─────────────────────────────
Anchoring                | P      | M        | Comparison anchored to $1.4M
                         |        |          | already spent, not future NPV
Overconfidence           | P      | H        | "So close to done" -- no
                         |        |          | estimate of remaining scope
Planning Fallacy         | P      | H        | "Almost done" on complex SW
                         |        |          | project defies base rates;
                         |        |          | last 20% typically = 40-60%
                         |        |          | of total effort
Confirmation Bias        | P      | M        | CTO seeking support for
                         |        |          | continuing; 85% coverage of
                         |        |          | vendor not being interrogated
Availability Heuristic   | A      | --       | No clear availability effect
Survivorship Bias        | ND     | --       | Cannot assess without knowing
                         |        |          | how similar build decisions
                         |        |          | were referenced
Base Rate Neglect        | P      | H        | No reference to industry
                         |        |          | base rates for build-vs-buy
                         |        |          | decisions or internal tool
                         |        |          | completion rates
Sunk Cost Fallacy        | P      | H        | "$1.4M and 6,000 hours"
                         |        |          | cited as reason to continue
                         |        |          | -- this is textbook
                         |        |          | sunk cost reasoning
Loss Aversion            | P      | M        | Abandoning the build feels
                         |        |          | like "losing" $1.4M; staying
                         |        |          | feels like preserving it,
                         |        |          | even though the $1.4M is
                         |        |          | gone either way
Status Quo Bias          | A      | --       | The status quo IS building;
                         |        |          | this is partly captured by
                         |        |          | sunk cost and commitment
                         |        |          | escalation
Commitment Escalation    | P      | H        | CTO has been public champion
                         |        |          | of the build for 18 months;
                         |        |          | reversing = public loss of face
Bandwagon Effect         | A      | --       | Team split means no bandwagon
Authority Bias           | P      | M        | CTO's authority may be
                         |        |          | suppressing the half of the
                         |        |          | team that favors switching
In-Group Bias            | ND     | --       | Insufficient info on team
                         |        |          | dynamics
Groupthink               | P      | M        | The team split suggests
                         |        |          | suppression risk; unclear
                         |        |          | if dissent is fully expressed
Halo Effect              | ND     | --       | Insufficient info
Framing Effect           | P      | H        | "We've come this far" frames
                         |        |          | the problem as about past
                         |        |          | investment; correct frame
                         |        |          | is "which option has better
                         |        |          | expected value from today?"
Fundamental Attribution  | ND     | --       | Not applicable here
Dunning-Kruger           | P      | M        | "So close to done" suggests
                         |        |          | underestimation of remaining
                         |        |          | complexity -- common in
                         |        |          | software engineering
Hindsight Bias           | A      | --       | Decision not yet made

Status: P = Present, A = Absent, ND = Cannot Determine
Severity: H = High, M = Medium, L = Low

COMPOUND BIAS FLAG: YES -- 5 biases co-present at High/Medium severity
(Sunk Cost + Commitment Escalation + Planning Fallacy + Framing +
Base Rate Neglect). This is a reinforcing trap, not independent errors.
Each bias amplifies the others and makes stopping feel irrational
even when continuing is the irrational choice.

SEVERITY-RANKED ACTIVE BIASES
──────────────────────────────────────────────────────────────
HIGH SEVERITY (address before proceeding):

  1. Sunk Cost Fallacy -- The phrase "we've come this far" explicitly
     uses past investment to justify continuation, which is the
     textbook definition. Past costs are gone regardless of the
     decision made today.

  2. Commitment Escalation -- The CTO has 18 months of public
     advocacy for the build. Switching now signals that the
     original decision was wrong. This creates personal incentive
     to continue independent of forward-looking merit.

  3. Planning Fallacy -- "So close to done" on an 18-month
     engineering project with no completion estimate cited is
     a significant red flag. Research on software project completion
     shows that the final 20% of estimated work routinely takes
     40-60% of total elapsed time.

  4. Base Rate Neglect -- No reference has been made to how often
     internal analytics platforms built at this stage actually
     reach production quality and deliver superior value vs. a
     comparable SaaS product. The base rate is unfavorable: most
     internal tooling projects at the 18-month mark are further
     from done than they appear.

  5. Framing Effect -- The entire decision is framed as "should we
     abandon what we've built?" when the correct frame is: "Starting
     from today, which option has better expected value over the
     next 3 years?"

MEDIUM SEVERITY (calibrate):
  1. Overconfidence -- Confidence in completion timeline should be
     pressure-tested with a structured estimate.
  2. Authority Bias -- CTO's position may be suppressing legitimate
     dissent from the team members favoring the switch.
  3. Commitment/Loss Aversion -- The $1.4M feels "lost" only if
     you stop; but it is equally gone if you continue.

TARGETED DEBIASING PROTOCOLS
──────────────────────────────────────────────────────────────

SUNK COST FALLACY
  Protocol:   The New CEO Test + Prospective Accounting
  Steps:
    1. Ask every decision-maker: "If you joined this company
       tomorrow and had no history with this project, and you
       were told you could build the remaining functionality for
       [estimated cost] or buy 85% coverage for $80K/year,
       which would you choose?"
    2. Separately, calculate: What is the estimated cost to
       reach production-ready? Use the engineering team's
       estimate then multiply by 1.5x to correct for planning
       fallacy.
    3. Calculate the 3-year total cost of ownership for each
       path: Build (remaining cost + maintenance) vs. Buy
       ($240K over 3 years + integration cost for the 15% gap).
    4. Make the decision ONLY based on the forward-looking
       comparison. Strike "$1.4M already spent" from the
       analysis entirely.
  Success indicator: The team can articulate the choice purely
  in terms of future expected value without referencing past spend.

COMMITMENT ESCALATION (CTO)
  Protocol:   Role Separation + Third-Party Facilitation
  Steps:
    1. The CTO should formally recuse from the final vote or
       at minimum should not present the recommendation -- their
       role becomes providing technical facts, not advocacy.
    2. Bring in one person not previously involved in the
       decision (another technical leader, a trusted board
       member, or a neutral senior engineer) to facilitate
       and cast a tie-breaking informed view.
    3. Frame the outcome explicitly: "Making the highest-value
       decision for the company is the mark of strong leadership,
       even if that means changing course."
  Success indicator: The CTO is able to articulate a genuine
  version of the case for switching, in writing, before the
  group decision is made.

PLANNING FALLACY
  Protocol:   Reference Class Forecasting
  Steps:
    1. Identify 3-5 comparable internal tooling projects your
       engineers have been involved with. What did "almost done"
       mean in those cases? How long did the final phase take?
    2. Apply the following rule of thumb: If an engineering team
       estimates X weeks remaining on a project that has already
       taken 3x longer than original estimates, apply a 2x
       multiplier to the remaining estimate before making the
       comparison.
    3. Get an independent estimate from an engineer not
       emotionally invested in the build. Do not share the
       existing estimate before they give theirs.
  Success indicator: The remaining effort estimate is grounded
  in base rates rather than intuition.

FRAMING EFFECT
  Protocol:   Dual-Frame Decision Brief
  Steps:
    1. Write the decision brief twice. Version A: "Should we
       continue investing in the build?" Version B: "Starting
       today with $0 sunk cost, should we allocate future
       engineering resources to build or to integrate the
       SaaS product?"
    2. Present both frames to all decision-makers. If their
       preference changes between frames, the original frame
       was biased.
    3. Make the decision using the prospective frame (Version B).
  Success indicator: Decision-makers acknowledge that the framing
  affected their intuitions and consciously apply the forward-
  looking frame.

PRIORITY ACTION LIST
──────────────────────────────────────────────────────────────
  1. IMMEDIATELY: Commission an independent engineering estimate
     of remaining build effort -- from someone not on the
     current build team. Apply 1.5x multiplier for planning
     fallacy correction. Complete before any group decision.

  2. THIS WEEK: Build a 3-year Total Cost of Ownership model
     comparing both paths using only future costs. Include:
     engineering time, maintenance burden, time-to-value,
     integration cost for the 15% capability gap. Share the
     model inputs and outputs openly with the full team.

  3. BEFORE THE DECISION MEETING: Each team member writes their
     recommendation in private and submits it before the group
     discussion begins. The CTO's submission is weighed as one
     vote, not as a pre-frame for the group.

DECISION CONFIDENCE RATING
──────────────────────────────────────────────────────────────
Pre-debiasing confidence in "continue building":  ~65%
                    (estimated from CTO advocacy + team split)
Estimated bias inflation:                        +25 to +35 pp
                    (sunk cost + commitment escalation compound)
Calibrated confidence recommendation:            30-40% that
                    continuing is the better option -- subject
                    to the results of independent estimate and
                    TCO model
Interpretation: The compound bias profile strongly suggests
the "continue building" position is being inflated by past
investment and the CTO's commitment. A rigorous prospective
analysis may well favor the SaaS switch. Run the debiasing
protocols before making this decision -- the compound bias
risk is high enough that an unbiased process may produce a
materially different outcome.
```

---

## Quick Reference: Bias-to-Debiasing Map

```
BIAS                    PRIMARY PROTOCOL                    SECONDARY CHECK
───────────────────────────────────────────────────────────────────────────────
Anchoring               Generate own estimate first         Consider 3 ref points
Confirmation            Steel Man Protocol                  Assign devil's advocate
Sunk Cost               New CEO Test                        Prospective accounting
Loss Aversion           Expected value calculation          Opportunity cost reframe
Status Quo              "Would I choose this fresh?"        Scheduled audits
Availability            Base rate lookup                    Check actual statistics
Survivorship            Seek failure cases actively         Ask for base rate
Base Rate Neglect       Reference class forecasting         Industry data lookup
Planning Fallacy        Reference class forecasting         1.5-2x multiplier rule
Dunning-Kruger          Expert feedback + track record      Calibration log
Halo Effect             Independent dimension scoring       Blind evaluation
Framing                 Dual-frame rewrite                  Opposite-frame test
Bandwagon               Form opinion before checking        Blind peer review
Commitment Escalation   Role separation                     Third-party facilitation
Authority Bias          "What evidence, independent of      Domain expertise check
                        who said it?"
In-Group Bias           Blind evaluation                    Standardized criteria
Groupthink              Independent written pre-positions   Explicit dissent role
Fundamental Attribution Generate 3 situational explanations Actor-observer check
Hindsight               Decision journal (pre-outcome)      Pre-mortem practice
Overconfidence          Calibration training                Confidence interval ranges
```
