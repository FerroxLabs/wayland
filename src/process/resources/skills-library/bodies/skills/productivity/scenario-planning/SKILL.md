---
name: scenario-planning
description: |
  Develops three named scenarios (optimistic, base, pessimistic) for a decision or situation. Each scenario includes driving assumptions, key events, outcome description, and preparation actions. Produces a complete scenario set, not a description of scenario methodology.
  Use when the user asks about planning for different outcomes, thinking through best-case and worst-case scenarios, preparing for uncertainty, or building contingency plans.
  Do NOT use for business strategic scenario planning (use business strategy skills), risk registers for projects (use risk-assessment), or simple pros and cons comparisons (use pro-con-analysis).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "decision-making planning analysis"
  category: "productivity"
  subcategory: "decision-making"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Scenario Planning

## When to Use

**Use this skill when:**
- The user faces a decision or situation with meaningful uncertainty and wants to prepare for multiple possible futures -- career transitions, major purchases, relationship decisions, relocation, launching a side project, educational choices, or health-related planning
- The user asks explicitly about best-case, worst-case, or most-likely outcomes and wants more than a list of possibilities -- they want a structured, actionable plan for each
- The user needs to calibrate their preparation across an uncertain future: they know something significant is coming but cannot predict how it will go (a job search, a medical diagnosis, a contract negotiation, a business launch)
- The user wants to identify which early warning signals to watch so they know which future is unfolding before it fully arrives
- The user is paralyzed by uncertainty and needs a structured method to make decisions now despite incomplete information
- The user explicitly asks about contingency planning, preparing for the unexpected, or thinking through "what if" variations on a decision

**Do NOT use when:**
- The user needs organizational or corporate strategic scenario planning with stakeholder mapping, industry analysis, and multi-year strategy documents -- use business strategy skills instead
- The user wants a formal project risk register with likelihood/impact matrices, risk owners, and mitigation controls -- use `risk-assessment` for that structured format
- The user wants to compare two specific defined options head-to-head -- use `pro-con-analysis`, which is designed for known alternatives rather than uncertain futures
- The user wants to examine only the failure case in depth, imagining the project or decision has already failed -- use `premortem-analysis` for that single-scenario backward reasoning
- The user wants to trace the downstream consequences of a single decision through second and third-order effects -- use `second-order-thinking` for causal chain analysis
- The user wants a simple checklist or plan without uncertainty -- if the future is not meaningfully uncertain, scenario planning adds complexity without value; use a standard planning or goal-setting skill instead
- The user needs a financial model with quantitative sensitivity analysis -- scenario planning is narrative and qualitative; point them to spreadsheet-based sensitivity analysis for pure numbers work

---

## Process

### Step 1: Anchor the Situation and Define the Planning Horizon

Before building scenarios, establish a crisp, shared understanding of what is being planned around.

- Identify the **core situation**: a decision to be made, a transition underway, or a goal being pursued. Make it concrete -- "deciding whether to move to Denver for a job offer" is a workable anchor; "thinking about my future" is not.
- Establish a **time horizon** that matches the decision's natural cadence. Near-term decisions (job changes, moves, product launches) work best with a 6-to-18-month horizon. Medium-term goals (career pivots, financial milestones, educational programs) suit a 2-to-5-year horizon. Beyond 5 years, acknowledge explicitly that scenario reliability degrades sharply and focus on directional orientation rather than precision.
- Identify the **one key question** the scenarios must answer. This is usually a decision ("Should I do X?"), a preparation question ("How should I prepare for X?"), or a monitoring question ("Which way is this going?"). The scenarios will be calibrated to answer this question.
- Clarify what is **known with confidence** (constants) versus what is **uncertain** (scenario drivers). Constants do not vary across scenarios. Scenario drivers do.
- Note the user's **current baseline expectation** -- what they privately think will happen. This becomes the starting point for the Base scenario and reveals optimism or pessimism bias early.
- If the user has not stated the time horizon, recommend one based on the decision type. A freelance launch warrants a 12-month horizon. A housing purchase warrants 3-5 years. A medical treatment decision may warrant 6-12 months.

---

### Step 2: Identify and Rank the Driving Forces

Scenario planning quality lives or dies on the quality of the driving forces identified. Mediocre scenarios recycle the same force repeatedly; excellent scenarios isolate the two or three variables that actually determine the range of futures.

- Extract **3 to 6 driving forces** -- the key variables whose value most determines which future unfolds. Common categories: financial variables (income, cost, market rates), personal capability or behavior (skill acquisition rate, network strength, health), external environment (market demand, regulatory change, economic conditions), relationship factors (employer decisions, family circumstances, partner agreement), and timing or sequencing (how fast things unfold).
- Test each variable for **genuine uncertainty**: if you can predict its value with high confidence, it is a constant, not a scenario driver. Remove it from the driver list and treat it as a fixed assumption across all scenarios.
- Check for **independence**: the most analytically clean scenarios use drivers that are not highly correlated with each other. In practice, some correlation is acceptable, but two drivers that always move together should be combined into one.
- Classify each driver by **controllability**: High (the user can directly determine this), Partial (the user influences it but does not control it fully), or External (driven by environment, market, or others). This classification directly informs what preparation actions are possible.
- Assign each driver a **plausible range** -- not a statistical confidence interval, but a realistic low-end and high-end value. The range from low-end to high-end defines the spread of scenarios. If the ranges are narrow, the scenarios will look similar (which is itself useful information: the situation has low variance).
- Rank the drivers by **impact**: which variable, if it went wrong, would most dramatically change the outcome? The top two or three high-impact, high-uncertainty variables are the "axes" of the scenario space. Lower-ranked variables are embedded as assumptions within scenarios but do not define them.

---

### Step 3: Build Three Internally Consistent Scenarios

Each scenario is a coherent narrative, not a list of independent best-case or worst-case assumptions. The optimistic scenario is not built by setting every variable to its best value simultaneously -- that creates an implausible fantasy. Instead, each scenario is anchored by a coherent set of driving force values that would plausibly occur together.

- **Scenario 1 -- Optimistic ("Tailwind"):** The primary driving forces trend favorably, but not at their absolute maximum. One or two things go better than expected; the others play out at or slightly above baseline. This scenario should have a realistic probability of 15%-35% for most personal planning situations.
- **Scenario 2 -- Base ("Steady State"):** Current trends continue. The most realistic extrapolation of present conditions. If the user took no additional actions beyond what they have already committed to, this is approximately what would happen. Probability is typically 40%-60% for well-anchored base cases.
- **Scenario 3 -- Pessimistic ("Headwind"):** Primary driving forces trend unfavorably. Something meaningful goes wrong -- not a catastrophe, but a realistic setback. One or two key variables underperform; the rest are flat. Probability is typically 15%-35%.

For each scenario, define all of the following:
- **Distinctive name**: not "Best Case/Most Likely/Worst Case" -- use a short, evocative label that captures the character of the scenario and makes it memorable in conversation (e.g., "Runway to Revenue," "Slow Build," "Dry Pipeline"). Good names stick in the user's mind and make trigger-based planning feel natural.
- **Driving assumptions**: the 3-5 specific conditions that must be true for this scenario to unfold. These are the "if-then" foundations. Each assumption should be falsifiable -- you can observe whether it is occurring.
- **Key event timeline**: 4-6 milestone events in chronological sequence. These make the scenario tangible and show the causal chain from starting conditions to final outcome. Each event should be specific enough that the user would recognize it if it happened.
- **Outcome description**: a narrative paragraph describing what the user's situation looks, feels, and functions like at the time horizon. Include financial, relational, professional, and emotional dimensions as relevant to the situation.
- **Probability estimate**: a rough percentage. Make the three estimates sum to 100%. If the user has no basis for estimation, start at 33/33/34 and adjust based on stated context. Note that probability estimates in scenario planning are not statistical forecasts -- they are relative weights to guide attention and preparation prioritization.
- **Early indicators**: 2-4 observable signals, detectable within the first 30-90 days, that indicate this scenario is beginning to materialize. These must be concrete enough to observe in real-time (not "things are going well" but "I have received two qualified inbound inquiries by the end of month 1").

---

### Step 4: Validate Internal Consistency

Before writing preparation actions, check each scenario for coherence. This is the step most often skipped and most responsible for useless scenario planning output.

- Read each scenario's driving assumptions and ask: do these naturally co-occur? If the optimistic scenario requires high client demand AND low personal risk tolerance simultaneously, those may be in tension -- reconsider.
- Walk the key event timeline and ask: does each event logically follow from the previous one given the driving assumptions? If the timeline jumps illogically, add an intermediate event or revise the sequence.
- Compare the three scenarios and ask: are they **differentiated enough**? If the outcome descriptions look similar across all three, widen the range. Ask the user: "What is the most realistic good outcome?" and "What is the worst realistic outcome?" If both answers describe a similar state, the situation genuinely has low variance -- document that conclusion explicitly.
- Check for **asymmetric disasters**: the pessimistic scenario should not be existentially catastrophic unless the situation genuinely carries that risk (severe health condition, complete financial ruin). Extreme downside scenarios are paralyzing rather than planning-useful. Keep the pessimistic scenario at the "bad but recoverable" end of realistic.
- Verify that no scenario requires the user to be a different person than they are. If the optimistic scenario depends on the user suddenly becoming extremely extroverted when they have described themselves as introverted, revise it.

---

### Step 5: Develop Preparation Actions for Each Scenario

Scenarios without preparation actions are intellectual exercises. The preparation layer is where planning converts to behavior.

For each scenario, provide:

- **Actions to take NOW**: what the user can do before knowing which scenario unfolds. These are typically insurance-buying actions (building runway, reducing dependencies, creating optionality) or capability-building actions (skill development, network activation, research). They should be executable in the current period, not contingent on future information.
- **Trigger events to watch**: specific, observable events that should activate the scenario's response plan. The trigger should be timed and concrete: "If I have not landed a first client by the end of Month 2" or "If rate negotiations consistently land below $70/hour."
- **Response plan**: what changes if the trigger fires. This is the contingency layer -- not a full plan, but a clear direction. Response plans for the Headwind scenario typically involve activating a backup option, accelerating expense reduction, or triggering a defined exit condition.
- **Upside capture plan**: for the Tailwind scenario specifically, identify 1-2 actions that accelerate or amplify the upside. Many planners prepare only for downside and fail to capitalize on positive scenarios.

---

### Step 6: Identify Robust Actions (Scenario-Independent Priorities)

This is the highest-value output of scenario planning and must never be omitted.

- A **robust action** is one that produces positive outcomes (or reduces harm) across all three scenarios. It is sometimes called an "all-weather" or "no-regret" action.
- Identify robust actions by asking: "What would I recommend regardless of which scenario unfolds?" Candidates typically include: building financial reserves, acquiring portable skills, maintaining or expanding relationships, gathering more information before committing, and reducing irreversible commitments.
- Distinguish robust actions from **scenario-specific actions**. Scenario-specific actions may be optimal in one future but harmful in another (e.g., signing a long-term lease is great in the Tailwind scenario but damaging in the Headwind). Robust actions avoid that asymmetry.
- Rank robust actions by **effort and impact** and present them in priority order. These should be the first things the user actually does.
- The presence of only 1-2 robust actions suggests scenarios are very differentiated -- appropriate preparation is highly path-dependent. The presence of 5+ robust actions suggests the scenarios may not be differentiated enough from each other.

---

### Step 7: Establish a Review and Update Schedule

Scenario planning is not a one-time artifact. It degrades in quality as the real world produces new information.

- Schedule **early indicator reviews** at 30 and 60 days. These are lightweight: the user simply checks whether any early indicators from the three scenarios have appeared, and notes which scenario(s) the evidence is consistent with.
- Schedule a **probability re-weighting** at the first major milestone. After enough time has passed for early indicators to appear, reassess which scenario is materializing and shift attention and resources accordingly.
- Schedule a **full scenario refresh** at the midpoint of the time horizon. By then, the base conditions may have changed enough that the original driving forces need to be revised.
- Include an **explicit exit condition** -- a trigger that would cause the user to abandon all three scenarios and rebuild the scenario set from scratch (e.g., a completely unexpected event that the original scenarios did not contemplate).
- Embed review dates in the output as calendar-ready checkpoints, not vague recommendations.

---

## Output Format

```
## Scenario Planning: [Situation/Decision]

### Planning Parameters
- **Situation:** [concrete description of what is being planned around]
- **Time horizon:** [specific duration, e.g., "12 months from date of transition"]
- **Key planning question:** [the one question these scenarios are designed to answer]
- **Date of analysis:** [today's date]
- **Known constants:** [factors that will not vary -- treat as fixed across all scenarios]

---

### Driving Forces
| # | Variable | Current State | Optimistic Value | Base Value | Pessimistic Value | Controllability |
|---|----------|---------------|-----------------|------------|-------------------|----------------|
| 1 | [variable name] | [where it is today] | [best plausible] | [continuation] | [worst plausible] | High / Partial / External |
| 2 | [variable name] | [where it is today] | [best plausible] | [continuation] | [worst plausible] | High / Partial / External |
| 3 | [variable name] | [where it is today] | [best plausible] | [continuation] | [worst plausible] | High / Partial / External |
| 4 | [variable name] | [where it is today] | [best plausible] | [continuation] | [worst plausible] | High / Partial / External |

---

### Scenario 1: "[Distinctive Name]" -- Tailwind (Optimistic)
**Probability:** [X]% | **Character:** [one sentence capturing the spirit of this scenario]

**Driving Assumptions (what must be true for this scenario to unfold):**
- [Assumption 1: specific condition that goes right]
- [Assumption 2: specific condition that goes right]
- [Assumption 3: contextual factor that supports the favorable outcome]

**Key Event Timeline:**
| Period | Event | Significance |
|--------|-------|-------------|
| [Month/Quarter X] | [specific event] | [why this matters] |
| [Month/Quarter Y] | [specific event] | [why this matters] |
| [Month/Quarter Z] | [specific event] | [why this matters] |
| [Final period] | [culminating condition] | [confirms scenario fully realized] |

**Outcome at [time horizon]:**
[Narrative paragraph: what the user's situation looks like -- financial, professional, personal, emotional. Be specific. Use numbers where available.]

**Early Indicators (observable within 30-90 days):**
- [Signal 1: what you would observe if this scenario is unfolding]
- [Signal 2: what you would observe]
- [Signal 3: what you would observe]

**Upside Capture Actions:**
- [What to do if Tailwind indicators appear to accelerate and amplify the positive outcome]

---

### Scenario 2: "[Distinctive Name]" -- Steady State (Base)
**Probability:** [X]% | **Character:** [one sentence capturing the spirit of this scenario]

**Driving Assumptions (what must be true for this scenario to unfold):**
- [Assumption 1: current condition continues]
- [Assumption 2: current condition continues]
- [Assumption 3: no major surprises in either direction]

**Key Event Timeline:**
| Period | Event | Significance |
|--------|-------|-------------|
| [Month/Quarter X] | [specific event] | [why this matters] |
| [Month/Quarter Y] | [specific event] | [why this matters] |
| [Month/Quarter Z] | [specific event] | [why this matters] |
| [Final period] | [culminating condition] | [confirms scenario fully realized] |

**Outcome at [time horizon]:**
[Narrative paragraph: realistic continuation of present trends. Honest about what is good, what is still a work in progress, and what remains uncertain.]

**Early Indicators (observable within 30-90 days):**
- [Signal 1: what confirms current trends are holding]
- [Signal 2: what confirms baseline conditions]

**Maintenance Actions:**
- [What to do to stay on track if Steady State indicators appear]

---

### Scenario 3: "[Distinctive Name]" -- Headwind (Pessimistic)
**Probability:** [X]% | **Character:** [one sentence capturing the spirit of this scenario]

**Driving Assumptions (what must be true for this scenario to unfold):**
- [Assumption 1: specific condition that goes wrong]
- [Assumption 2: specific condition that goes wrong]
- [Assumption 3: compounding factor that makes recovery harder]

**Key Event Timeline:**
| Period | Event | Significance |
|--------|-------|-------------|
| [Month/Quarter X] | [specific early warning event] | [why this matters] |
| [Month/Quarter Y] | [specific deterioration event] | [why this matters] |
| [Month/Quarter Z] | [decision point] | [the pivot moment] |
| [Final period] | [outcome if no course correction] | [what the user is managing] |

**Outcome at [time horizon]:**
[Narrative paragraph: bad but recoverable. Describe the genuine difficulty without catastrophizing. What is the realistic damage? What is still intact?]

**Early Indicators (observable within 30-90 days):**
- [Signal 1: the first warning sign this scenario is materializing]
- [Signal 2: the confirming signal]
- [Signal 3: the trigger for contingency activation]

**Contingency Activation Trigger:**
- [Specific, observable condition that should cause the user to formally activate the Headwind response plan -- not a vague feeling, a measurable event]

---

### Preparation Actions Summary
| Scenario | Act Now (before knowing which unfolds) | Trigger to Watch | Response If Triggered |
|----------|----------------------------------------|-----------------|----------------------|
| Tailwind | [action to position for upside] | [observable signal] | [how to accelerate] |
| Steady State | [action to sustain baseline] | [confirmation signal] | [adjustment to make] |
| Headwind | [action to reduce downside exposure] | [observable early warning] | [contingency to activate] |

---

### Robust Actions (highest priority -- work across all scenarios)
Listed in priority order:
1. **[Action]** -- [Why it helps in all three scenarios]
2. **[Action]** -- [Why it helps in all three scenarios]
3. **[Action]** -- [Why it helps in all three scenarios]
4. **[Action]** -- [Why it helps in all three scenarios]

---

### Review and Update Schedule
| Checkpoint | Date | Activity |
|------------|------|----------|
| 30-day indicator check | [date] | Review early indicators for all three scenarios; note which signals have appeared |
| 60-day indicator check | [date] | Re-assess indicator pattern; are multiple signals pointing to one scenario? |
| Probability re-weighting | [date] | Adjust scenario probabilities based on observed evidence; shift preparation resources |
| Mid-horizon full review | [date] | Revisit driving forces, revise scenarios if base conditions have shifted materially |
| End-of-horizon assessment | [date] | Evaluate which scenario materialized and what the scenario plan got right or wrong |

**Scenario Reset Trigger:** [Describe an event or condition unexpected enough that the user should discard the current scenario set and rebuild from scratch]
```

---

## Rules

1. **Always produce all three scenarios fully populated before writing preparation actions.** Partial outputs -- two scenarios and a promise of a third -- are not acceptable. The comparative value of scenario planning comes from seeing all three side by side.

2. **Scenario names must be distinctive and evocative, never generic.** Names like "Best Case," "Likely," and "Worst Case" undermine the cognitive stickiness that makes scenarios useful over time. The user should be able to say "I'm in Dry Pipeline territory" to a friend and convey the situation instantly.

3. **The three probability estimates must sum to exactly 100%.** If uncertain, start at 35/45/20 (optimistic/base/pessimistic) as a default distribution reflecting the common human bias toward expecting better-than-median outcomes. Adjust from there based on the user's stated context.

4. **Optimistic is not fantasy; pessimistic is not catastrophe.** The Tailwind scenario must be achievable without extraordinary luck or implausible assumptions. The Headwind scenario must be bad enough to be worth preparing for but not so bad that it triggers paralysis rather than planning. A useful test: "Is there at least one person in a similar situation who has experienced this outcome in the last three years?"

5. **Each scenario's driving assumptions must be falsifiable.** Assumptions like "things go well" or "the economy cooperates" are not testable and cannot serve as early indicators. Every assumption must describe a condition concrete enough to observe: "At least two clients commit to a second project by month 3" or "My employer approves the remote work arrangement within 60 days."

6. **Early indicators must be observable within 30 to 90 days of the scenario clock starting.** Indicators that arrive at month 9 in a 12-month horizon are useless for course correction. If no early indicators are detectable in the first 90 days, the scenario's structure needs revision -- something meaningful about the trajectory must be visible early.

7. **Robust actions must be justified explicitly as scenario-independent.** It is not enough to list them. Each robust action must include a brief explanation of why it helps regardless of which scenario unfolds. This forces genuine analysis rather than a recycled to-do list.

8. **Never allow the pessimistic scenario to contain events that are outside the user's ability to survive or recover from, unless the situation genuinely warrants it.** The purpose of a downside scenario is to prepare the user to navigate a difficult outcome -- not to produce dread. If the realistic pessimistic outcome is genuinely existential, acknowledge that explicitly and pair it with a specific exit or recovery pathway.

9. **The preparation actions for each scenario must be differentiated.** If the actions for Tailwind, Steady State, and Headwind are essentially the same, the scenarios are not differentiated enough or the preparation layer needs more work. Identical preparation across scenarios defeats the purpose of scenario planning.

10. **Include a scenario reset trigger in every output.** Real-world events regularly render scenario sets obsolete -- a key employer collapses, a relationship ends, a health diagnosis changes the picture entirely. The user needs a pre-defined threshold that signals "this scenario set no longer applies, rebuild from scratch." Without this, outdated scenarios become anchors rather than tools.

---

## Edge Cases

**The user cannot estimate probabilities and finds the exercise speculative.**
Acknowledge this explicitly -- scenario planning probability estimates are not statistical forecasts. They are attention weights that help the user decide how much preparation to invest in each scenario. Start with equal weights (33/33/34) and ask: "Do you think any of these futures is significantly more or less likely than the others?" Use the answer to adjust. If the user refuses any probability framing, substitute "High focus / Medium focus / Low focus" as preparation priority labels and proceed.

**The user wants more than three scenarios (e.g., wants to model four or five futures).**
Hold the line at three for the primary set. Additional scenarios dilute attention and make preparation actions harder to prioritize. If a specific additional scenario is genuinely important (a "wildcard" involving a low-probability but high-impact event -- a major regulatory change, a health crisis, an unexpected acquisition offer), add it as a "Wildcard Scenario" in a separate short section that includes driving assumptions and a contingency action, but exclude it from the probability sum and the preparation actions table. Make clear that it is a monitoring scenario, not a preparation priority.

**All three scenarios produce similar outcomes, and the user notices.**
This is valuable information, not a planning failure. It means the situation has low variance -- the driving forces do not diverge enough to produce meaningfully different futures. Respond by widening the plausible range: push the optimistic scenario further in the positive direction and the pessimistic scenario further negative, and ask the user to confirm plausibility. If outcomes remain similar after widening, document the conclusion explicitly: "This situation has low outcome variance. The realistic range of outcomes is narrow, which means the user can commit with greater confidence and preparation complexity can be simplified." This is an honest and useful result.

**The user is emotionally fixated on one scenario -- almost always the pessimistic one.**
This is common and predictable. Loss aversion causes people to weight downside scenarios more heavily than their probability warrants, which leads to over-preparation for unlikely bad outcomes and under-preparation for likely or positive ones. When this occurs: (a) require equal depth and specificity in the optimistic scenario; (b) ask directly "What specific conditions would need to be true for the best case to happen?" -- this forces engagement with the upside; (c) note explicitly whether the pessimistic scenario's probability justifies the emotional weight being given to it; (d) do not dismiss the concern, but reframe: "We will prepare thoroughly for the Headwind scenario. We will also make sure we are ready to act if the Tailwind scenario appears." Balance is the goal.

**The time horizon is very long (7-10+ years) and the user wants decade-scale scenarios.**
Acknowledge that beyond 5 years, scenario reliability degrades sharply -- the number of compounding uncertainties grows faster than the ability to model them. For 7-10 year horizons: (a) focus on the 2-3 highest-impact driving forces only, and accept that others cannot be reliably projected; (b) describe scenarios in directional terms rather than specific events -- "the user has established a senior position in the field" rather than "the user earns $180K by year 8"; (c) set review checkpoints at 18-24 month intervals rather than 30-60 days; (d) emphasize robust actions even more heavily, since they are the primary hedge against long-horizon unpredictability.

**The situation involves another person whose behavior is a primary driving force (a partner, an employer, an investor).**
Third-party behavior is among the hardest variables to model in scenario planning because it is External and often discontinuous. When another person's choices are a primary driver: (a) explicitly name that person's decision as a driving force in the table; (b) build scenarios around their plausible decision paths rather than around your assumptions about their intent; (c) include in the early indicators section: "Direct conversation with [person] confirms X" -- sometimes the best information-gathering action is to simply ask; (d) note the limits of prediction and emphasize the user's response plan rather than their ability to anticipate the other party accurately.

**The user has already committed to a course of action and wants scenarios for post-commitment management.**
The planning question shifts from "should I do this?" to "how do I navigate this successfully?" Reframe accordingly: the Tailwind scenario is "how this goes well," the Steady State is "how this plays out as expected," and the Headwind is "what goes wrong and how I recover." Omit any scenario content that implicitly questions the commitment -- that creates regret without utility. Focus preparation actions on execution, course correction, and contingency within the committed path.

---

## Example

**Input:** "I'm a 34-year-old software engineer considering leaving my job at a large tech company to join an early-stage startup as employee number 8. The offer is $120K base (vs. my current $165K) plus 0.5% equity with a 4-year vest. I want to plan for how this could go over the next 3 years."

---

## Scenario Planning: Joining an Early-Stage Startup as Employee #8

### Planning Parameters
- **Situation:** Leaving $165K senior software engineering role at a large tech company to join an early-stage startup as employee #8, accepting $120K base + 0.5% equity with 4-year vest
- **Time horizon:** 36 months from start date at startup
- **Key planning question:** How should I prepare for, and respond to, the three most plausible ways this decision plays out?
- **Date of analysis:** [today]
- **Known constants:** 4-year equity vesting schedule with standard 1-year cliff; current personal monthly expenses of approximately $5,800; engineering skills are portable and in-demand; startup has 18 months of runway at time of joining

---

### Driving Forces
| # | Variable | Current State | Optimistic Value | Base Value | Pessimistic Value | Controllability |
|---|----------|---------------|-----------------|------------|-------------------|----------------|
| 1 | Startup growth trajectory | Pre-revenue, seed-stage | Series A closed by month 12, strong revenue traction | Series A closes by month 18 with moderate traction | Fundraising fails, runway burns out by month 15-20 | External |
| 2 | Equity value at exit/liquidity | $0 (unvested) | $600K-$1.2M at Series B or acquisition by year 3 | $150K-$400K if startup reaches Series A | $0 if startup fails before liquidity event | External |
| 3 | Personal compensation gap | $45K annual gap vs. current job | Gap narrows to $20K after year-1 raise; bonus closes remainder | Gap remains $35-45K through all 3 years | Gap widens if startup cannot afford raises |  Partial |
| 4 | Engineering ownership and role growth | Employee #8, IC role | Principal engineer or VP Eng by year 2 | Senior engineer with meaningful scope growth | Scope diminishes as senior hires join above you | Partial |
| 5 | Personal financial runway | [user's current savings -- assumed 6 months expenses] | Runway extended by side income or partner income | Runway sufficient for 2 years at reduced salary | Runway depleted if startup fails and job search takes 3+ months | High |

---

### Scenario 1: "Rocket Trajectory" -- Tailwind (Optimistic)
**Probability:** 20% | **Character:** The startup executes well, raises its Series A on schedule, and your early equity position becomes genuinely valuable within 3 years.

**Driving Assumptions:**
- The startup's core product achieves product-market fit within 9 months, producing measurable revenue traction (MRR $100K+ by month 12)
- A Series A of $8M-$15M closes by month 12-14 at a valuation that makes your 0.5% worth $500K+ pre-dilution
- You are recognized as a founding technical leader and given a VP Engineering or Principal Engineer title with commensurate comp increase ($145K-$160K) by year 2
- The broader startup funding market remains receptive to strong Series A candidates in your sector

**Key Event Timeline:**
| Period | Event | Significance |
|--------|-------|-------------|
| Month 3-6 | First paying customers onboarded; early revenue signal emerges | Validates product direction; reduces existential risk |
| Month 9 | MRR crosses $80K; founder begins Series A conversations with warm intros | Fundraising process begins from position of strength |
| Month 12-14 | Series A closes at $35M+ valuation | Your 0.5% (pre-dilution) is now valued at ~$175K; post-Series B potential grows significantly |
| Month 18 | Salary renegotiated to $150K following Series A close | Compensation gap narrows to $15K vs. former employer |
| Month 24 | VP Engineering title; equity refreshed with new grant | Role scope and comp now competitive with FAANG alternatives |
| Month 36 | Startup at Series B conversations or acquisition discussions; your vested equity (75% of grant) is worth $450K-$900K | Clear liquidity path emerging |

**Outcome at 36 months:**
You are a core technical leader at a company with real revenue, institutional investors, and a credible path to exit. Your total comp (base + equity value at current valuation) substantially exceeds what you would have earned staying at your former employer. Your resume now carries founder-adjacent credibility that opens both future startup and senior IC opportunities. You have 75% of your original grant vested and have likely received a refresh grant. The $45K annual salary sacrifice has cost approximately $90K over 2 years, but paper equity value has recovered and then significantly exceeded that gap.

**Early Indicators (observable within 30-90 days):**
- The startup ships a meaningful product update or feature within your first 60 days -- execution velocity is high
- Founders share board meeting materials and financial dashboards with you -- transparency culture is intact
- At least one inbound customer conversation is happening without heavy founder sales involvement by month 2

**Upside Capture Actions:**
- Request equity refresh conversations at month 12 and month 24 -- early employees often miss refresh grants by not asking
- Establish yourself as the technical decision-maker before senior hires arrive; document architectural decisions formally
- Build relationships with Series A investors directly -- these become references for future opportunities

---

### Scenario 2: "Long Slog" -- Steady State (Base)
**Probability:** 50% | **Character:** The startup makes genuine progress but more slowly than hoped -- fundraising is harder, your salary stays below market for longer, and equity upside is real but modest and distant.

**Driving Assumptions:**
- Product iteration takes 12-15 months to find clear product-market fit; MRR grows to $40K-$60K by month 12
- Series A fundraising takes 20-24 months and closes at a lower valuation ($18M-$22M), making your pre-dilution 0.5% worth $90K-$110K
- Salary remains at $120K-$128K through year 2 due to cash conservation pressure; raise possible in year 3
- You have meaningful technical ownership but the role does not evolve into formal leadership -- you remain a senior IC

**Key Event Timeline:**
| Period | Event | Significance |
|--------|-------|-------------|
| Month 6 | Product ships v1; early customers are engaged but paying revenue is slow | Progress, but product-market fit is still being searched for |
| Month 12 | MRR at $40K; founder begins Series A conversations; initial rejections | Fundraising will take longer than hoped; runway tightens |
| Month 18 | Bridge financing of $1.5M closes to extend runway; Series A ongoing | Not a failure -- but a signal of slower trajectory |
| Month 24 | Series A closes at $20M valuation | Your 0.5% pre-dilution is valued at $100K; meaningful but not life-changing |
| Month 30 | First salary review; raise to $130K | Still $35K below former employer; gap persists |
| Month 36 | Company has 25 employees, growing, but exit is 3-5 more years away | Equity has value but no near-term liquidity |

**Outcome at 36 months:**
The startup is alive and growing, but the trajectory is more modest than hoped. You have learned an enormous amount, worked on meaningful problems, and built a strong network. Your equity is worth something on paper but illiquid and dependent on future fundraising rounds and dilution. Total compensation over 3 years is approximately $90K-$135K below what you would have earned at your former employer. The bet has a reasonable chance of paying off but requires patience for another 2-4 years. The decision is neither a success nor a failure at the 3-year mark -- it is unresolved.

**Early Indicators (observable within 30-90 days):**
- Fundraising conversations are happening but founders describe investor interest as "lukewarm" or "they want to see more traction first"
- Customer acquisition is happening but requires heavy founder involvement in every deal
- Burn rate discussions arise in team meetings before month 3

**Maintenance Actions:**
- Maintain your technical skills and external network actively -- keep your LinkedIn updated and attend 1-2 external technical events per quarter
- Have an explicit financial plan for operating on $120K for 3 years; identify discretionary expenses to reduce and rebuild savings
- Negotiate for a small equity refresh at the bridge financing round to maintain alignment

---

### Scenario 3: "Failed Runway" -- Headwind (Pessimistic)
**Probability:** 30% | **Character:** The startup cannot raise its Series A, burns through its runway within 18-24 months, and either shuts down or is acqui-hired at a price that produces little or no return on your equity.

**Driving Assumptions:**
- Product iteration does not produce clear revenue traction; MRR is below $25K at month 12
- Series A fundraising fails; bridge financing is either unavailable or insufficient; runway runs out by month 18-22
- The company either shuts down or accepts an acqui-hire at a valuation that wipes out equity holders (common acquisition structure acqui-hires the team but pays nothing to common stockholders)
- Your unvested equity is worthless; vested equity (less than 25% at cliff date, less than 50% at shutdown) produces $0-$15K net

**Key Event Timeline:**
| Period | Event | Significance |
|--------|-------|-------------|
| Month 3 | Slow early customer traction; founders pivot product direction | First sign that initial product hypothesis needs revision |
| Month 9 | Revenue still below $20K MRR; Series A conversations begin but are not progressing | Fundraising is likely to fail at current traction |
| Month 12 | First layoffs or team restructuring to extend runway | Morale impact; role scope changes; best colleagues may leave |
| Month 15 | Founders announce runway is 3-4 months remaining; team goes into stress mode | Decision point: begin job search now, before announcement goes public |
| Month 18-20 | Company shuts down or accepts acqui-hire at sub-liquidation-preference price | Equity worthless; team transitions |
| Month 21-24 | Job search completed; back in a senior engineering role | Recovery; but 18-24 months of below-market comp with no equity return |

**Outcome at 36 months:**
You are back in a senior individual contributor role, likely earning $155K-$175K -- roughly recovered to where you were. The financial cost of the experiment is approximately $60K-$90K in forgone salary over 18-24 months, plus the opportunity cost of unvested equity at your former employer. The experience has real professional value: startup experience is currency for future founding or joining roles, and the skills learned are genuine. However, if financial reserves were thin when you joined, the runway burn may have created stress or debt during the job search period.

**Early Indicators (observable within 30-90 days):**
- Founders are evasive or vague when directly asked about runway and fundraising timeline in your first 60 days
- The company has no customers or active trials by the end of month 2
- Two or more early employees leave within your first 90 days

**Contingency Activation Trigger:**
If by Month 12 the company has not reached $40K MRR and has not received a formal Series A term sheet or strong verbal commitment, begin a quiet, non-urgent parallel job search. Do not wait for the company to announce problems. The typical runway-to-shutdown sequence from "fundraising is hard" to "shutting down" can be as short as 3-4 months, which is not enough time to run a quality job search from a position of strength.

---

### Preparation Actions Summary
| Scenario | Act Now (before knowing which unfolds) | Trigger to Watch | Response If Triggered |
|----------|----------------------------------------|-----------------|----------------------|
| Rocket Trajectory | Build internal visibility; document architectural work; request equity refresh at series close | Inbound customer traction, product-market signal by month 6, Series A interest | Negotiate VP title + refresh grant; accelerate savings with comp increase |
| Long Slog | Reduce monthly expenses by $800-$1,000 before starting; increase savings rate now; maintain external network actively | Bridge financing, slow Series A timeline, salary freeze past month 18 | Negotiate equity refresh at bridge; explore contract work nights/weekends to rebuild financial cushion |
| Failed Runway | Build 9+ months of expenses in liquid savings BEFORE starting; do not burn the bridge with your current employer until Day 90 | Evasive fundraising answers, zero customer traction by month 2, early employee departures | Activate job search by month 12 if traction signals are absent; do not wait for official announcement |

---

### Robust Actions (highest priority -- work across all scenarios)
Listed in priority order:
1. **Build 9 months of liquid expenses ($52,200) before your start date** -- In the Headwind scenario, this is your survival buffer during job search. In the Steady State, it eliminates financial stress during the long runway. In the Tailwind, it is simply good financial hygiene you will never regret.
2. **Do not formally resign from your current employer until you have completed 90 days at the startup** -- Many companies have a "return offer" window or at minimum will be more receptive to rehiring someone who left recently if approached within 6 months. This option has asymmetric value: it costs nothing to preserve and is invaluable in the Headwind scenario.
3. **Maintain and actively invest in your external engineering network throughout** -- Attend 1-2 external technical talks or meetups per quarter; keep your GitHub active on open source; accept speaking invitations. This is free insurance in all three scenarios: in Tailwind, it brings credibility; in Steady State, it keeps optionality alive; in Headwind, it dramatically shortens job search time.
4. **Get the equity terms in writing with full clarity on preference stack, anti-dilution provisions, and exercise window** -- Understand your liquidation preference position before signing. In many startup failures, common stock holders (you) receive nothing because preferred stockholders (investors) have liquidation preferences that absorb the exit proceeds. Know this going in, not at exit.

---

### Review and Update Schedule
| Checkpoint | Date | Activity |
|------------|------|----------|
| 30-day indicator check | [Day 30 of employment] | Are founders transparent with financials? Is there customer traction signal? Note which scenario indicators are appearing |
| 60-day indicator check | [Day 60 of employment] | Are customers in active trials or paying? Is Series A fundraising in motion? Update scenario probability weighting |
| Probability re-weighting | [Month 6] | Based on MRR, fundraising progress, and team stability -- which scenario is most consistent with evidence? Shift preparation resources accordingly |
| Mid-horizon full review | [Month 18] | Full scenario rebuild if base conditions have shifted materially (new CEO, pivot, acquisition offer, Series A closed) |
| End-of-horizon assessment | [Month 36] | Document which scenario materialized and what the plan got right or wrong. Use as input for next planning cycle. |

**Scenario Reset Trigger:** If the company announces a pivot that changes the fundamental product or market (not iteration -- full pivot), or if founding team changes dramatically (CEO departure, co-founder exit), discard this scenario set and rebuild. The driving forces are different enough that the original scenarios no longer apply.
