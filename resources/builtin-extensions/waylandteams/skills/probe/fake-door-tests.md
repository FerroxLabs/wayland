# Fake-door & smoke tests

## When to load this mode

The user wants to know if a new product, feature, price point, or positioning has demand before they spend weeks building it. Load this whenever someone says "should we build X," "would people pay Y for this," or "is there a market for Z."

## What a fake-door test is

A fake-door test puts the product in front of strangers as if it already existed and measures whether they walk through. The door doesn't open yet — the click, the email, the pre-order is the signal you're paying for. You're buying behavior, not opinion. A survey returns the answer respondents think makes them look reasonable. A landing page returns the answer the visitor's actual hand gives.

Common patterns:

- **Landing-page test** — one page, one call-to-action (waitlist, email, "notify me," pre-order). Paid traffic. Measure visitor-to-action rate.
- **Fake-button test** — unbuilt feature shown as a button inside the existing product. Click opens "coming soon, want to be notified?" Measure click rate against neighbor buttons.
- **Concierge / Wizard-of-Oz test** — back-end is a human or a spreadsheet; front-end looks automated. For when the action is "did they use it," not "did they click."
- **Smoke-test ad** — $50–$200 ad to a page with three pricing tiers and a "buy" button leading to "sold out — join waitlist." Measure which tier got clicked.

## Procedure

1. **Write the hypothesis** in the template: "[audience] will [observable action] when shown [stimulus], at a rate of at least [X%] within [window]." If it doesn't fit, fix it before you spend a dollar.
2. **Pre-register the kill criterion.** Below what rate does the team walk? Below what spend cap does the test get pulled? Write both numbers down before traffic starts.
3. **Build the minimum stimulus.** One page, one headline, one offer, one call-to-action. Resist feature-listing. The page exists to trigger the action you're measuring, not to sell the eventual product.
4. **Decide the traffic source.** Paid social for cold audiences, an email list for warm audiences, an existing product surface for in-app fake-buttons. The traffic source has to match the audience the hypothesis names.
5. **Set sample size.** Under 100 visitors you have a rumor, not a result. Aim for at least 300 to a single variant; more if the expected conversion rate is below 5%.
6. **Run the window flat.** No tweaking copy mid-test. No pausing because day 2 looks bad. The test ends when the window ends or sample size lands, whichever is later.
7. **Read the result against the kill criterion.** Don't squint. The number is the number.

## Decision rules

- **Use a landing-page test when:** the hypothesis is "an audience exists for this offer at this price." Cold traffic, paid, one page, email capture or pre-order.
- **Use a fake-button test when:** the hypothesis is "users of our existing product want this addition." Warm traffic already on-platform, in-app placement, click-rate measured against neighbor buttons.
- **Use a concierge test when:** the hypothesis is "people will pay for this outcome even if delivery is manual." You hand-deliver to the first ten buyers. The point is to learn whether the outcome is wanted, not whether the software works.
- **Don't use any fake-door when:** the question is qualitative ("why would they switch") — route to Scout. Or when the deliverable doesn't exist in any form and a click would betray the visitor's trust beyond what a "join waitlist" framing covers.

## Anti-patterns

- **Don't dress a fake-door as a real purchase if you can't deliver.** "Join the waitlist" is honest. "Buy now" leading to a 404 burns the audience and, in some jurisdictions, the law.
- **Don't measure traffic, measure conversion.** 10,000 visitors and 4 sign-ups is a failed test, not a successful campaign.
- **Don't run two variants without a control.** A/B without a baseline tells you which is less bad, not whether either works.
- **Don't skip the kill criterion** — you'll narrate your way around any number.
- **Don't keep the page up after the test.** The test was the test. Take it down or convert it. A stale fake-door rots into a real broken promise.

## Before / after

**Before (untestable):**

> "We think busy parents would love a meal-prep delivery for toddlers."

**After (testable):**

> "Among parents of children 1–4 in metro areas, at least 4% of paid-ad visitors will join a waitlist for a $39/week toddler meal-prep service, within a 7-day window and 500-visitor sample. Below 2% we kill."

Now the test has a hypothesis, a stimulus, a number, and a kill line. Run it.
