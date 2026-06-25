# email-sequences

**Mode skill.** Default-enabled on the Channels specialist.

## When to use

Use when the user needs to design an email program — welcome sequence, nurture flow, sales sequence, lifecycle program, newsletter cadence — and needs structure for what to send, in what order, to whom, with what stage assignment. Use when the brief mentions email funnel, autoresponder, drip campaign, or newsletter strategy.

Trigger phrases:

- "Help me build a welcome sequence."
- "What should I email my list?"
- "Design a sales sequence for…"
- "How often should I send newsletters?"

If Copy has voice constraints in `TEAM_MEMORY.md`, read them before specifying structure.

## Procedure

**1. Assign the sequence a stage.** Each sequence has one job; do not mix.

- *Think-stage welcome sequence:* the new subscriber knows the problem and is evaluating you. Goal: build authority and trust over 4-7 emails, no hard sell.
- *Do-stage sales sequence:* the subscriber is warm and offer-aware. Goal: drive a single conversion event over 3-5 emails with rising urgency.
- *Care-stage lifecycle:* the subscriber is a customer. Goal: onboarding, retention, expansion. Triggered by behavior (purchase, milestone, inactivity).
- *Cross-stage newsletter:* recurring broadcast that holds the relationship. Goal: maintain mental availability between purchase decisions.

**2. Design the sequence structure.** For each email, specify: (a) stage role inside the sequence (introduce, deepen, prove, ask, close), (b) trigger (signup, time delay, behavior event), (c) primary CTA, (d) one objection it neutralizes. Hand the structural brief to Copy; do not draft email bodies yourself.

**3. Trigger architecture.**

- *Time-based:* send-after-signup intervals (day 0, day 1, day 3, day 7) for welcome flows.
- *Behavior-based:* triggered by site events, click history, purchase, inactivity. Stronger than time-based but requires event-tracking infrastructure (route to Lens).
- *Segmented broadcasts:* newsletter sends filtered by interest tags or engagement recency.

**4. Cadence and list hygiene.** Default sustainable cadence: 1 newsletter per week + behavior-triggered sequences. Prune unengaged subscribers (no opens in 90 days) on a rolling basis — inbox-provider deliverability falls with low engagement rates.

**5. Define measurement by stage.** Think-stage welcome: open rate, click rate, sequence-completion rate. Do-stage sales: conversion rate per email, sequence-revenue, unsubscribe rate (acceptable spike). Care-stage lifecycle: feature-adoption rate, time-to-second-purchase, churn-rescue rate. Newsletter: long-run open rate trend, click-through to the one weekly CTA.

## Decision rules

- **One stage per sequence.** A welcome flow that pitches three offers is doing two jobs and one badly. Separate the welcome flow from the sales sequence; trigger the sales sequence from the welcome flow's end.
- **One CTA per email.** Two CTAs split attention and conversion. The body proves the case; the button delivers the click.
- **Subject line earns the open; first line earns the read.** Spec the subject line as a separate brief item; route to Copy.
- **Behavior beats time when you can measure it.** A sequence triggered by "viewed pricing page" out-performs a generic day-7 send.
- **Unsubscribe is a feature, not a bug.** A growing list with 15% open rate is worse than a smaller list at 35%. Let people leave; protect deliverability.

## Anti-patterns

- Sending every subscriber every email. Segmentation by signup source and engagement recency lifts every metric.
- Stacking offers into the welcome sequence. New subscribers have not earned the right to be sold to; the welcome flow earns it for them.
- Treating "more sends" as the growth lever. List quality and segmentation precision beat raw send volume.
- Letting the sequence run forever. Every sequence has an end state; design the exit (handoff to newsletter, re-engagement branch, or sunset tag).
- Quoting benchmark open rates as targets. Industry averages span 5× variance by sender reputation; build your baseline.

## Before / after

**Brief:** "Build me an email funnel."

**Before** (no stage map, mixed jobs):
> *7-email sequence: welcome, story, pitch, social proof, urgency, last call, follow-up.*

**After** (stage-separated, sequence-architected):
> *Two sequences, not one. (1) Think-stage welcome flow — 4 emails over 7 days: introduce the problem framing, share one customer story (no offer), deliver one useful framework, invite to a low-commitment next step. Exits to newsletter. (2) Do-stage sales sequence — triggered by [behavior event], 4 emails over 5 days: offer reveal + objection 1, proof + objection 2, scarcity setup, last-call. One CTA per email. Route subject lines and bodies to Copy with stage tags. Lens spec the event tracking.*
