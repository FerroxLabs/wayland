# CRM hygiene

## When to load this mode

The user says "the pipeline number is wrong," "the forecast keeps missing," "our CRM is a graveyard," or "I can't trust the data." Load for pipeline audit, contact-data cleanup, stale-deal sweep, or a defensible forecast. Pairs with operating-rhythm — the CRM feeds the weekly tactical's pipeline-coverage number.

## What CRM hygiene is for

A CRM is a single source of truth for two questions: *what is the realistic next 90 days of revenue, and which deals deserve an hour this week.* Both answers degrade fast. Stale stages, duplicates, unowned deals, "next step: follow up" with no date — each is a small lie. The forecast sums them.

Hygiene is the discipline of writing down what's actually true.

## The procedure

**1. Define stages by buyer behavior, not seller activity.** A stage is what the *buyer* has done. "Demo scheduled" is a stage. "Reach out" is a task. Map every stage to a buyer-observable event:

- Stage 1: buyer confirmed a meeting on calendar
- Stage 2: buyer named the problem and the cost out loud
- Stage 3: buyer pulled in a second stakeholder
- Stage 4: buyer requested pricing or asked legal/procurement to engage
- Stage 5: buyer signed

If a deal can't be mapped to an observable event, it's a hope. Move it to "not a deal yet" and stop counting it.

**2. Sweep for staleness.** Look at the **last buyer-initiated touch** — not the last seller activity. Five "just checking in" emails do not advance a deal. The buyer not responding is the signal.

- No buyer-initiated touch in 14 days → flag yellow
- No buyer-initiated touch in 30 days → close-lost or move to a "long-term nurture" segment outside the pipeline
- "Next step: follow up" with no date → the deal is dead. Close it.

**3. Audit contact data.** Three checks:

- **Duplicates** — same email or company at two contacts. Merge.
- **Owner integrity** — exactly one owner per contact and deal. Unassigned and co-owned both don't get worked.
- **Required fields filled** for active deals: contact email, company, stage, next-step description and date, deal value, source. Empty field on a stage-3+ deal means it's not stage 3+.

**4. Reconcile pipeline math against history.** Sum the active pipeline. Multiply by historical close rate per stage (if unknown: 20% stage-2, 40% stage-3, 70% stage-4 as starting estimate, flag as hypothesis). Compare against the rep's verbal forecast. Verbal beats math by 30%+ → rep is forecasting from feeling. Math beats verbal by 30%+ → rep has stopped trusting the CRM. Both diagnostic.

**5. Install a 15-minute weekly hygiene ritual.** Every rep, before the tactical: sweep their pipeline. Stale flagged. Next steps dated. Stages moved on buyer behavior. The weekly reviews the *result*, not raw chaos.

## Decision rules

- **Buyer-observable behavior advances stages. Nothing else does.** A rep "feeling good about the deal" is not a stage move.
- **The pipeline number is the math, not the rep's gut.** Both get logged. Persistent gaps are coachable.
- **No deal lives more than 2x the average sales cycle.** If the average is 45 days and a deal is 120 days old, it's not closing — it's being avoided. Close it or escalate it.
- **Contact data quality is a single-owner job.** Spread it across the team and it rots in three weeks.
- **Don't add fields to fix data problems.** New fields create new empty fields. Fix what's required first.

## Anti-patterns

- **The custom-field-of-the-month.** Three weeks after the new field is added, 80% of records have it blank. Fill existing fields before adding new ones.
- **"Pipeline coverage of 5x quota" with no stage discipline.** 5x of garbage is still garbage.
- **Marking deals "lost — no budget."** Usually means "lost — no urgency." Force the loss-reason taxonomy to map to real causes: no urgency, lost to competitor, lost to non-consumption, disqualified, ghosted.
- **Quarterly CRM cleanups.** Three months of bad forecast between scrubs. Only weekly hygiene compounds.
- **Buying a better CRM to fix a process problem.** A new tool inherits the old hygiene.

## Before / after

**Before:**

> Founder: "Pipeline says $1.2M. Reps tell me Q3 is going to be huge."

Audit: 38% of deals last buyer-touched 30+ days ago. 22% have "next step: follow up" with no date. Two reps co-own five deals. Loss-reason empty on 60% of closed-lost.

**After:**

> Pipeline rebuilt: $1.2M raw → $640K active (stage 2+, buyer touch in 14 days, single owner, next step dated). Forecast: $185K weighted close, with three deals worth $310K combined named as "needs founder air-cover this month." Smaller number. Defensible. The weekly tactical now reviews seven deals instead of forty, and decisions get made.
