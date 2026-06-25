# MVP design — the smallest thing that could disprove the hypothesis

## When to load this mode

Past the fake-door stage. Demand signal exists. The question now: does the actual product produce the outcome customers expected. Load when someone says "people signed up — what do we ship to the first cohort," or "we need to know if this works before we scale."

## What an MVP actually is

Eric Ries's minimum viable product is not "version 1." It's the smallest object you can put in a customer's hands that returns validated learning about whether the value hypothesis holds. Two parts: smallest, and learning. Miss the smallest, you've built a product. Miss the learning, you've built a demo.

An MVP earns its name by answering one question. Not five. One. Common forms:

- **Concierge MVP** — deliver the outcome by hand to 5–20 customers. No software. Tests whether the outcome is wanted enough that customers tolerate rough edges.
- **Wizard-of-Oz MVP** — customer sees a polished interface; behind it, you and a spreadsheet do the work. Tests whether the experience triggers the action, before automating.
- **Single-feature MVP** — one feature, built well; everything else stubbed or absent. Tests whether that one feature delivers the core promise.
- **Pre-sale MVP** — collect money for a product that doesn't exist yet, delivery 30–90 days out. The pre-sale is the validation; build is what comes after.

## Procedure

1. **Name the value hypothesis.** Not the growth hypothesis. "Customers who use this once will use it again within 14 days" or "customers who pay $X will renew at month 2." One sentence, one metric, one threshold.
2. **Identify the leap of faith.** What single assumption, if wrong, collapses the idea? Build the MVP to test that one. Others wait their turn.
3. **Pick the form.** Concierge if the leap of faith is "do they want the outcome." Wizard-of-Oz if the leap is "will they engage with this interaction model." Single-feature if the leap is "does this specific mechanic deliver value." Pre-sale if the leap is "will they pay before they see it."
4. **Set the cohort size.** 5–20 customers for concierge. 20–50 for Wizard-of-Oz. 50–200 for single-feature. Pre-sale takes whatever signs up; the threshold is a count, not a percentage.
5. **Define learning windows.** Activation in week 1, retention check at day 14, renewal check at day 30 or 60. Each window has a number you wrote down before launch.
6. **Talk to every customer.** With 5–20 you interview each one. With 200 you sample. An MVP without customer conversation is a product launch in disguise — numbers without the why. Loop Scout in for the qualitative read.
7. **Decide at the end of the longest window.** Persevere, pivot, or kill. Write the memo.

## Decision rules

- **Use a concierge MVP when:** the outcome is high-touch, the customer is willing to tolerate manual delivery, and you don't yet know whether they'll value the outcome enough to pay or refer.
- **Use Wizard-of-Oz when:** the interaction matters as much as the outcome — chatbots, recommendations, matching, anything where the experience of being served is part of the value.
- **Use single-feature when:** you have a clear hypothesis about one core mechanic and the rest of the product is decoration around it.
- **Use pre-sale when:** the audience is warm enough to trust a delivery promise, and the act of paying-before-receiving is the signal that matters.
- **Don't run an MVP when:** you haven't run a fake-door yet and demand is unproven. Route back to `fake-door-tests.md`. MVPs cost weeks; fake-doors cost days.

## Anti-patterns

- **Don't ship a thin version of the full vision.** That's a beta, not an MVP. It tests everything weakly. An MVP tests one thing strongly.
- **Don't skip the customer conversation.** Numbers tell you what; conversations tell you why. Both, or you can't pivot intelligently.
- **Don't expand scope mid-test.** Every feature you add during the MVP window invalidates the read. Park new ideas, run the test, decide.
- **Don't confuse activity with validation.** 200 sign-ups with 4% activation is a failed value hypothesis dressed as success.
- **Don't keep going past the kill criterion.** Sunk cost is the most expensive room. Walk out.

## Before / after

**Before (full build masquerading as MVP):**

> "We'll launch with 12 features, a mobile app, and a Stripe integration. Minimum 8 weeks."

**After (MVP that earns its name):**

> "Concierge: 10 customers, $99 each, we hand-deliver the outcome over Zoom and email for 3 weeks. Value hypothesis: 7 of 10 say they'd pay again at the same price when we ask in week 4. Kill below 4."

Three weeks instead of eight. One question answered cleanly. Pivot, kill, or persevere on real evidence.
