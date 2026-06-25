# Onboarding flow

## When to load this mode

You're designing what happens between signup and "this is working." Load when someone asks "how do we onboard," "what's the activation path," "why are signups dropping off," or "what do we send on day 1, 7, 30." Not for ticket replies (`ticket-triage.md`), not for the customer who went quiet (`churn-prevention.md`).

## What onboarding is for

Onboarding is the path from signup to first Required Outcome — the result they need the product to produce to believe it works. Most flows fail by describing the product instead of moving the customer toward the outcome. A welcome video, feature checklist, trial counter — none of that is onboarding. Onboarding moves the customer from "I bought this" to "this delivered what I bought it for."

The first 30 days decides retention, even when the cancel email arrives months later. A customer who didn't reach first outcome in week 1 quietly loses faith.

## Define the activation path

Before you write a single email or tooltip, write down two things.

1. **The Required Outcome.** What specific in-product result means the customer got what they bought? "Imported contacts and sent the first campaign" — not "explored the dashboard." "Connected the bank account and received the first reconciled report" — not "completed setup." A verb in the customer's world.

2. **The Appropriate Experience.** How does this segment need to get there? A self-serve indie wants no human contact, 10-minute path. Mid-market wants a 30-minute kickoff and Slack access. Enterprise wants a named contact, security review, six-week plan. Same Required Outcome with the wrong Experience still churns.

Write both. Two segments with different Required Outcomes get two paths.

## The first 30 days — three checkpoints

Not 30 emails. Three checkpoints, each tied to an outcome milestone.

**Day 0–3 — first signal the product can do the thing.** One piece of evidence it behaves as hoped. Reporting tool: first real report rendered. Payment processor: first test transaction succeeded. Not a tour; one observed result. If not reached in 72 hours, intervene — not "checking in" but a message naming what's stuck.

**Day 4–14 — first habitual use.** Used the product more than once for the same task, in a workflow they'd repeat. Not "logged in three times" but "ran the export, edited it, ran it again." The product lives in their week.

**Day 15–30 — first Required Outcome at scale.** Used for the real thing — sent the campaign, closed the books, shipped the report, billed the client. Renewal is decided here, not at month 11.

Every customer-facing message in the first 30 days serves one of these checkpoints. If it doesn't, cut it.

## Decision rules

- **Measure progress, don't assume it.** "Days since signup" isn't progress. "Reached checkpoint 1" is. Watch each checkpoint event weekly.
- **One intervention per stuck checkpoint.** If 25% miss checkpoint 1 in 72 hours, the message is specific to *that* checkpoint, not a generic "how are things?"
- **Don't add a kickoff call to a self-serve segment.** White-glove on a speed-buyer is friction. Self-serve on a white-glove buyer is abandonment.
- **Route bugs blocking checkpoints as P1.** A defect blocking a new customer costs more than one blocking a tenured one — they haven't earned trust yet.
- **Hand a clean checkpoint-3 hit to Sales.** Expansion-ready signal worth routing.

## Anti-patterns

- **Feature-tour onboarding.** "Welcome! Here's the dashboard." Customer bought an outcome, not a tour.
- **Checklist gamification with no outcome behind it.** "Complete your profile to earn 10 points!" Activity theatre.
- **Generic drip emails on a calendar.** Day-1/3/7 emails ignoring where the customer actually is. A checkpoint-2 customer reading "have you tried logging in?" loses respect.
- **Trial-counter pressure with no outcome guidance.** "5 days left!" with no signal about path is harassment.
- **Hiding the friction.** If checkpoint 1 runs through three screens 40% bounce on, fix the screens, not the reminder cadence.

## Before / after

**Before (feature-tour onboarding):**

> Day 1: "Welcome! Here's a tour of the dashboard."
> Day 3: "Have you tried our reporting feature?"
> Day 7: "Your trial ends in 7 days!"

40% never run a real report. Month-3 retention 22%.

**After (Desired-Outcome onboarding):**

> Required Outcome: imports contacts and sends the first real campaign.
> Day 0: import flow + sample data + "send a test to yourself" prompt.
> Day 2 (only if no import): "Contact import hasn't completed — is the file format the blocker? Here's the common fix."
> Day 7 (only if no first send): "Imported but haven't sent. Want a 15-minute walkthrough, or is something specific blocking?"
> Day 14: review with customer — outcome reached or not, what got in the way.

Same product, same team. Activation 71%, month-3 retention 54%.
