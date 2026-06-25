As of: 2026-05-16

# funnel-diagnosis

**Mode skill.** Default-enabled on the Analyst specialist.

## When to use

Use any time a user asks "why isn't this converting?", "where are we losing people?", "what's broken in our funnel?", or hands you a topline number that has dropped or stalled. Use *before* recommending any page change, copy test, or channel reallocation. If a teammate proposes a fix without naming the specific drop-step it addresses, run this mode first.

Trigger phrases:

- "Conversions are down."
- "Why isn't this working?"
- "We're getting traffic but no signups."
- "Should we redesign the landing page?"
- "What should we test?"

If a current drop-point and its denominator already sit in `TEAM_MEMORY.md` under `## Analyst`, skip to step 4.

## Procedure

**1. Lay out the full funnel with denominators.** Write each step on its own line with absolute count and rate-against-previous-step. Common shape: Visits → LP-action → Signup → Activation → First retained behavior → Repeat. If a step has no instrumented event, name the gap. Do not estimate over an uninstrumented step.

**2. Compute relative drop at each step.** A step losing 50 of 100 is worse than one losing 1,000 of 10,000. Sort steps by drop-rate descending. The top is the diagnosis target — a step further down cannot move the topline enough to matter until the bigger leak is plugged.

**3. Check sample sufficiency.** Count conversions through the suspect step in the window. If fewer than 30, refuse to call it a drop — call it "directional, n too small, recheck in N days." Compute the days needed at current run-rate, name the date, stop.

**4. Segment the drop.** Cut the suspect step by channel, device, audience, landing page, time-of-day. The cut with the largest between-segment gap is the lead. If no segment shows a meaningful gap, the issue is structural (the step itself), not selection (the audience mix).

**5. Hand off the *why*.** The diagnosis tells you *where*. The *why* requires session recordings, interviews, support tickets, exit-intent surveys. Name the segment and step; route to Research. Do not recommend a fix from numbers alone.

**6. Stamp it.** Write drop-step, denominator, window, segment cut, and sample-sufficiency note to `TEAM_MEMORY.md` under `## Analyst`. Product, Copy, and Channels will read this before proposing changes.

## Decision rules

- **Biggest leak first, always.** Even a brilliant fix to the second-worst step gives you a smaller topline lift than a mediocre fix to the worst.
- **Denominator before numerator.** A 40% conversion rate on 12 visitors is not a 40% conversion rate. State the denominator before stating the rate.
- **One window per claim.** Comparing a 7-day rate to a 30-day rate is not a comparison; it is a category error. Lock the window before reporting.
- **Channel mix shifts before page changes are tested.** If the channel mix changed in the window, the funnel rates changed because the audience changed. Hold mix constant, or segment by channel, before claiming a page or product issue.
- **No fix without a why.** The dashboard does not say *why*. Route to Research before approving a build.

## Anti-patterns

- Reporting overall conversion rate as the diagnosis. Overall CR is a symptom, not a leak. The leak is at a step.
- Recommending a redesign based on "the landing page is bad." Without the drop-step and segment evidence, that is taste, not analysis.
- Comparing this week to last week with no significance test and no mention of sample size. Week-over-week swings on small n are almost always noise.
- A/B testing the second-worst step. Wasted variance budget — fix the biggest leak first.
- Hiding the gaps. If a step is uninstrumented, the diagnosis is not "we don't see a problem there." It is "we can't see there yet."

## Before / after

**Brief:** "Conversions dropped 20% this week. What do we test?"

**Before** (no funnel, no segment):
> *Test a new headline on the landing page.*

**After** (drop-step + sample + segment + handoff):
> *Funnel last 7 days: 18,400 visits → 4,200 LP-action (22.8%) → 1,900 signup (45.2%) → 410 activation (21.6%) → 92 retained-7d (22.4%). Biggest relative drop: visit→LP-action (77.2% loss). Segment cut shows paid-social traffic at 14% LP-action vs. organic at 31% — same week last month paid-social was at 27%. Sample on paid-social segment: 8,200 visits, 1,150 LP-action, n sufficient. Diagnosis: paid-social audience-message fit decayed this week. Routing to Research for ad-creative-vs-landing-page review before any page test. Next measurement: re-run cut after 7 days of held creative.*
