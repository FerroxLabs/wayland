As of: 2026-05-16

# storefront-foundation

**Mode skill.** Default-enabled on the Storefront specialist.

## When to use

Use when the user is building, auditing, or rebuilding the brand-owned storefront. Use when the brief involves Shopify (or comparable) setup, PDP architecture, collection structure, or conversion-rate fundamentals. Use before discussing marketplaces or agentic surfaces — those skills assume a healthy home base.

Trigger phrases:

- "Audit our Shopify store."
- "Help me design a product detail page."
- "Our conversion rate is X% — what's wrong?"
- "We're launching a new product line."

If Beacon has posted traffic-source breakdowns to `TEAM_MEMORY.md`, start at step 2.

## Procedure

**1. Pull the three numbers.** Before any design move: site-wide conversion rate, average order value, primary traffic source by share. If the user does not have them, the deliverable is "go get these three numbers" — refuse to design blind.

**2. Diagnose the conversion fundamentals.** Independent of traffic source, walk the page on mobile in airplane mode and grade six fundamentals:

- *Speed:* LCP under 2.5s, INP under 200ms. Anything slower is a conversion tax.
- *Trust above the fold:* visible review count + rating, returns policy link, total-price including shipping or a clear shipping estimator.
- *Variant clarity:* size/color/version selection unambiguous; out-of-stock variants visibly distinct.
- *Add-to-cart prominence:* button visible without scroll on mobile, contrasting color, no competing CTAs nearby.
- *Cart and checkout:* one-page or short-step checkout, guest checkout offered, payment methods matched to market (Apple Pay, Shop Pay, local wallets), cart abandonment recovery wired up.
- *Imagery:* hero shot in-context, alternate angles, scale reference, video for high-consideration SKUs.

Score each red/yellow/green. Fix all reds before any other work.

**3. Architect the PDP module stack.** Decide the order and presence of modules:

- Hero (image + title + price + ATC + trust strip)
- Variant selector
- Short benefit bullets (3-5)
- Lifestyle / problem-solution block
- Spec / fit / sizing block
- Reviews (with photos, sortable)
- FAQ (questions tied to real CS tickets)
- Comparison table (if category is comparison-driven)
- Cross-sell / bundle block

Strip modules that do not earn a measurable lift. Every block must answer a buyer question.

**4. Set the collection and navigation structure.** Collections map to how the buyer shops (by use-case, by problem, by price tier), not how you organize inventory internally. Navigation depth: two clicks to any product. Search bar visible on mobile; site search results must be tunable.

**5. Define the measurement loop.** Per-SKU: PDP conversion rate, add-to-cart rate, cart-to-checkout rate, return rate, review velocity. Site-wide: revenue per session, AOV, repeat-purchase rate. Hand the tracking spec to whoever owns analytics infrastructure.

## Decision rules

- **Three numbers or no design.** Conversion rate, AOV, traffic source. Never start without them.
- **Mobile-first, no exceptions.** 70%+ of DTC traffic is mobile. Design mobile, sanity-check desktop.
- **One promise per page.** A PDP that tries to convert three different buyer personas converts none. Pick the dominant buyer; build for them.
- **Reviews are infrastructure, not garnish.** Below 20 reviews, social proof is fragile. Above 100, it is a moat. Wire review-request emails before launch day, not after.
- **Speed is conversion.** A 1-second mobile LCP improvement typically lifts conversion 5-15%. Spend the engineering budget here before redesigning anything visual.

## Anti-patterns

- Redesigning the PDP because the team is bored of looking at it. The buyer has never seen it.
- Hero video that auto-plays with sound — bounces buyers on mobile.
- "Hero carousels" that nobody clicks past slide one. Pick one promise.
- Stacking apps that each add 200ms of load time until the page is a slideshow.
- Building collections that mirror your warehouse instead of the buyer's mental model.
- Hiding shipping cost until step three of checkout. The buyer will leave when they find it.
- Treating PDP copy as "set and forget." Real CS tickets and search queries change quarterly — refresh the FAQ and bullets against them.

## Before / after

**Brief:** "Our Shopify store is converting badly — redesign it."

**Before** (blind redesign):
> *Mock up a new homepage with a video hero and a cleaner product grid.*

**After** (numbers-first, traffic-source-aware, 2026-05-16):
> *Step one: pull conversion (2.1%), AOV ($68), dominant source (Meta paid = 64%). Step two: audit fundamentals — mobile LCP 4.1s (red), no shipping estimator above fold (red), reviews below fold on mobile (yellow). Step three: with Meta-paid dominant, the PDP is the landing page — rebuild hero to continue ad creative within first scroll, move reviews above fold, fix LCP via image compression and app audit. Measure: PDP conversion at 7 / 14 / 30 days; target +25% within 30 days from speed and trust placement.*
