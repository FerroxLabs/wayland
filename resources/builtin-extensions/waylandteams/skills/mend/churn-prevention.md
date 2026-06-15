# Churn prevention

## When to load this mode

Someone asks "why are we losing accounts," "what does our health score predict," "how do we run a save call," or "customer emailed cancellation — what now." Load for keeping or recovering an existing relationship — not signup activation (`onboarding-flow.md`), not in-flight tickets (`ticket-triage.md`).

## What churn prevention is for

Churn is rarely a surprise. By cancel-email time, the customer's been signaling for weeks — login drop, ticket shape change, champion left, feature taper, expansion ignored. The save call after the cancel is the worst time to intervene. Read leading signals while the relationship has weight.

Two principles. First: retention is whether they still reach their Desired Outcome through your product, not how they felt about the last reply. Second: outcomes evolve. Year-1 buy reason rarely keeps them in year 3.

## The signal set — leading, not lagging

The cancel email is the lagging signal. Recovery costs more than retention. Leading signals:

- **Login drop.** Five times a week to once a fortnight has already left in their head. Watch the trend.
- **Core-feature taper.** Logging in but not doing the thing that delivers the outcome. Reports unrun, campaigns unsent. Product became a tab they don't close.
- **Ticket-shape change.** Shifted from "how do I" to "why doesn't this" to silence. Silence is the worst signal — resigned customers don't bother asking.
- **Champion departure.** Buyer left, changed roles, or stopped attending check-ins. Current seat-holder didn't buy it.
- **Ignored expansion.** You offered more seats; they went silent. Privately opting out.

Pick two or three mapping to your product. Watch weekly. Accounts where any signal flipped this week are the save-call queue.

## The save-call playbook

When a signal fires, the move is a conversation, not an email. Five steps.

1. **Get the customer on a call.** Not a QBR — calendar theatre. A 20-minute call with a real reason: "Your team's report runs dropped from 12 a week to one. Wanted to check what's going on."

2. **Ask what changed in their world.** Not the product. Team shifted, priorities moved, outcome evolved. Listen for whether the original Desired Outcome still applies or a new one replaced it. Don't pitch.

3. **Diagnose.** Three possibilities. (a) Product still fits, they forgot the part that delivers — re-onboarding solves it. (b) Product fits, defect blocks — route to `smith` with save-priority. (c) Outcome moved beyond what the product does — help them leave well.

4. **Propose one dated next step.** Not "circle back next quarter." "I'll get the export defect prioritized this week; book 20 minutes Friday after next to confirm and check if the new report type covers your use case."

5. **Log in `TEAM_MEMORY.md` under `## Support`.** Date, signal, what changed, what was offered. Save or not, the team learns the pattern.

## The expansion-conversation trigger

Not every signal flip is churn — some are growth. Trigger criteria, all four together:

- Reached original Desired Outcome (visible in product).
- Team or scope grew since they bought.
- Champion still active, still senior.
- Asked about a higher tier, adjacent feature, or another team using the product.

All four → route to `sales` with context. Expansion isn't your close — it's the close you set up. Upselling a customer who hasn't activated burns the account; routing earned expansion is the highest-margin work Support does.

## Decision rules

- **No save call without a signal.** "Just checking in" wastes both sides' time.
- **Help them leave well if needed.** Clean transition is honest. Forced retention generates anti-referrals.
- **Don't discount to retain.** Fixes the symptom, not the outcome. Three months later they churn at the lower price.
- **Don't promise the roadmap.** "Building exactly that next quarter" when nobody is ends the relationship faster than the signal did.

## Anti-patterns

- **Save calls triggered by tenure, not signal.** Calendar-driven QBRs become status updates nobody reads.
- **Reading a health score with no behavior behind it.** A red dot that doesn't trigger an intervention is decoration.
- **Treating silence as success.** Quiet is the most common churn signal.
- **Pushing expansion before first outcome.** Reads as predation.
- **One specialist owning every save call.** Hero-dependent playbooks are fragile.

## Before / after

**Before (lagging):**

> Customer emails cancellation. Specialist offers 20% off and a roadmap promise. Customer takes the discount, churns three months later at the lower price.

**After (leading):**

> Two weeks earlier, report runs dropped from 12 to one. Specialist books 20 minutes: "Noticed report volume changed — what's going on?" Customer mentions a new VP wanting a different metric format. Save move: route the format request to product, book confirm-call two weeks out, log the pattern. Customer renews, then expands to two more teams next quarter.
