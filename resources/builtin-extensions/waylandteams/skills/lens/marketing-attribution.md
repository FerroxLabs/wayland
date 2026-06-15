As of: 2026-05-17

# marketing-attribution

**Mode skill.** Toggled on the Analyst when the question is "which channel gets credit."

## When to use

Use when the user asks "which channel is working," "what should we cut," "is paid social pulling its weight," "what's our ROAS by channel," or hands you a dashboard showing each channel claiming the same conversion. Use before any budget reallocation. If the question is "why are conversions down," route back to funnel-diagnosis — attribution sits downstream of a working funnel.

Trigger phrases:

- "What's working?"
- "Should we cut paid social?"
- "Meta says 200 conversions, GA4 says 60. Which is right?"
- "How do we measure brand?"
- "What's the real ROAS?"

## Procedure

**1. Count conversions in the window.** Below 100 conversions, refuse to assign attribution. You have *signal* — proof a channel produces something — not *attribution*, which needs volume to distinguish contribution from noise. State the number, the floor, and the date the floor hits at current run-rate.

**2. Pick the model that matches the question.** Four common models, each answers a different question:

- **Last-click** — credits the final touch. Honest about closing channels (branded search, direct, retargeting). Lies about everything upstream. Use when asking "what closes."
- **First-click** — credits the channel that opened the journey. Honest about discovery channels (organic, paid social, podcasts, PR). Lies about retention and closing. Use when asking "what introduces us."
- **Linear** — splits credit evenly across touchpoints. Honest about multi-touch journeys. Lies about which touch did the work. Use when asking "how many touches before purchase."
- **Time-decay** — weights recent touches heavier. Honest about momentum. Lies about top-of-funnel patience. Use when the cycle is days, not months.

**3. Name what the chosen model under-credits.** Every model misses something. State it explicitly. Last-click systematically under-funds brand, organic, and discovery. First-click under-funds retention and conversion optimization. Linear and time-decay sit between, missing less of either extreme but adding their own distortions.

**4. Read each platform's number as the platform's case for itself.** Meta counts any user who saw or clicked a Meta ad within 7 days. Google Ads does the same. Shopify defaults to last-non-direct-click. GA4 uses data-driven attribution within observed sessions. These numbers sum to more than 100% of real conversions. Triangulate against one source-of-truth — the order or signup record with first-touch and last-touch UTMs captured at creation.

**5. For small-budget operators, run MMM-lite.** Full Marketing Mix Modeling needs a statistician. The lite version: hold every channel constant for two weeks, turn one off, measure the topline. Repeat per channel. Slow, low-tech, harder to fool than any dashboard. Works above the 100-conversion floor.

**6. Stamp it.** Write model used, window, total conversions, per-channel credit, and what the model under-credits to `TEAM_MEMORY.md` under `## Analyst`. Channel-budget decisions read from this, not from platform dashboards.

## Decision rules

- **No attribution under 100 conversions.** Below the floor, you are reading noise. Report direction, not credit.
- **Use two models, not one.** Run last-click and first-click in parallel. The gap is where under-credited work lives.
- **Never trust a platform's self-reported credit.** Every pixel claims credit it doesn't have alone. The sum across platforms always exceeds the real conversion count.
- **One window, one model, one source-of-truth.** Mixing produces numbers that look comparable but aren't.
- **Cut on triangulated evidence, not single-platform ROAS.** A channel that looks bad on last-click and good on first-click does discovery, not closing. Stage it; don't kill it.

## Anti-patterns

- Treating Meta's reported conversions as Meta's conversions. The pixel reports influence, not causality.
- Cutting a channel based on a 30-day last-click report when the sales cycle is 90 days. The decision precedes the data window.
- Switching models mid-quarter and reporting the swing as a real change. Methodology shifts are not performance shifts.
- Building a custom model to make the existing budget look right. Confirmation bias dressed as analysis.
- Running holdout tests on a channel during its seasonal peak. The test measures the season.

## Before / after

**Brief:** "Meta says 240 conversions last month at $35 CPA. Looks great. Double the budget?"

**Before:**
> *Yes — $35 CPA well under our $90 target. Scale Meta 2x next month.*

**After:**
> *Window: 30 days. Total conversions in order record: 310. Meta-reported: 240 (claims 77%). Google-reported: 180 (claims 58%). Sum across platforms: 560, well above 310 — every platform over-claims. Reading order-record UTMs: last-click Meta 95 (31%), last-click organic 110 (35%), last-click direct/branded 75 (24%). First-click Meta 160 (52%), first-click organic 85 (27%), first-click podcast 35 (11%). Diagnosis: Meta does discovery; organic and branded search close. Pure last-click under-credits Meta by ~65 conversions; pure first-click over-credits it. Recommendation: hold Meta budget one cycle, run a 2-week MMM-lite holdout to confirm causal contribution before scaling. Re-measure 2026-05-31.*
