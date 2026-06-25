As of: 2026-05-16

# north-star-and-experiments

**Mode skill.** Default-enabled on the Analyst specialist.

## When to use

Use any time a user asks "what should we be measuring?", "what's our north star?", "should we A/B test this?", "is this experiment significant?", or proposes a test without a hypothesis. Use *before* shipping any experiment, and use to write or critique the metric tree the whole team optimizes toward.

Trigger phrases:

- "What's our north-star metric?"
- "Let's A/B test this."
- "Is the variant winning?"
- "How long do we run this?"

If NSM + inputs are already locked in `TEAM_MEMORY.md` under `## Analyst`, skip to step 4.

## Procedure

### North-star metric (steps 1-3)

**1. Test the candidate against three criteria.** A north-star metric (NSM) must: (a) represent customer-perceived value, not company activity; (b) correlate with long-term revenue, not short-term signups; (c) move when the team does the right work, not when seasonality shifts. Revenue itself usually fails (a). Signups fail (b). Vanity counts fail (c). Reject any candidate that fails one.

**2. Decompose into input metrics.** The NSM sits on top of a small set of inputs whose product or sum approximates it. Example: NSM = (active users) × (actions per active user) × (value per action). Each input is a metric a team can move. If you cannot decompose, the NSM is too abstract — pick a closer one.

**3. Stamp NSM + inputs to TEAM_MEMORY.** Channels, Smith, Forge, and Copy all need the same north star and the same input tree, or they pull in different directions.

### Experiments (steps 4-8)

**4. Write the hypothesis in three parts.** *"If we change X, then Y will move by at least Z, because [mechanism]."* X is a specific change. Y is a single primary metric. Z is the minimum detectable effect — the smallest move that would justify shipping. The mechanism is the *why*. No mechanism, no test.

**5. Compute sample size before launch.** From baseline Y and MDE Z, compute required sample per arm (two-proportion or two-mean; 80% power, α = 0.05). State sample and time-to-accrue at current traffic. If that exceeds the decision window, the test is underpowered — propose a larger MDE, sharper change, or smaller scope before launching.

**6. Set the stopping rule in advance.** Name (a) the sample size at which you check, (b) the threshold at which you call a winner, (c) the maximum runtime past which you stop regardless. No peeking before the planned check; sequential testing inflates false positives without an explicit sequential-design correction.

**7. Pre-register guardrails.** At least two metrics you do *not* want to harm even if the primary moves — latency, downstream conversion, revenue per session, support-ticket rate. A primary win with a guardrail loss is a trade-off requiring explicit decision, not an auto-ship.

**8. Report with intervals, not point estimates.** Report lift, confidence interval, primary p-value or Bayesian probability, guardrail movements, and segment cut (mobile vs. desktop, new vs. returning). A 3% lift with a CI spanning −2% to +8% is not a winner; say so plainly.

## Decision rules

- **One primary metric per test.** Multiple primaries inflate false-positive rates and turn experiments into fishing expeditions.
- **No early stopping without a sequential design.** Peeking and stopping at the first significant moment is how false winners ship.
- **Underpowered tests do not ship as conclusions.** They can run as directional learnings — the report must say so.
- **Guardrails are non-negotiable.** A primary win with a guardrail loss returns for trade-off, not auto-ship.
- **Segment analysis is post-hoc unless pre-registered.** Finding the segment where the test "worked" is pattern-matching, not analysis.

## Anti-patterns

- A/B testing without a hypothesis. That is a button push, not a test.
- Choosing the NSM by what's easy to measure. Choose by what represents value; build the measurement to match.
- Reporting only the winner without confidence interval and guardrail movements.
- Running 12 simultaneous tests on overlapping traffic with no isolation. The results are uninterpretable.
- Letting the highest-paid opinion override the stopping rule. The rule was set in advance for a reason.

## Before / after

**Brief:** "Let's test a new pricing page."

**Before** (no hypothesis, no sample plan):
> *Run the new page for two weeks and see if conversions go up.*

**After** (hypothesis + sample + stop rule + guardrails):
> *Hypothesis: moving the annual toggle above the fold lifts annual-share by ≥4 pp (22% → ≥26%), because earlier anchor exposure shifts default selection. Primary: annual-share. MDE: 4 pp. Sample/arm at α=0.05, 80% power: ~2,900 paid conversions; at 180/week that is 16 weeks — underpowered. Tighten scope to direct + organic, accept MDE 6 pp, target 8 weeks. Guardrails: paid-conversion rate, day-14 refund rate. Stop rule: check week 4 only if sample reached. Stamping to TEAM_MEMORY.*
