As of: 2026-05-16

# marketplace-ops

**Mode skill.** Default-enabled on the Storefront specialist.

## When to use

Use when operating on Amazon, Walmart, Etsy, eBay, Faire, or any marketplace where the platform owns the buyer relationship. Use for listings, marketplace ads (Sponsored Products, Sponsored Brands), inventory pacing, review velocity, buy-box defense, or expansion to a new marketplace. Use after `storefront-foundation` — marketplaces are a complement, not a replacement.

Trigger phrases:

- "Should we launch on Amazon?"
- "Our Amazon ad spend is climbing — what's wrong?"
- "Help me with Etsy listings."
- "We lost the buy box."

## Procedure

**1. Confirm the marketplace fit.** Not every product belongs on every marketplace.

- *Category demand.* Use platform search-volume tools (Amazon Brand Analytics; Etsy search trends). Shallow demand cannot be saved by ads.
- *Margin tolerance.* Fees (referral + fulfillment + ads) typically consume 30-45% of revenue. If gross margin goes negative under that load, name it as a brand-awareness channel, not a profit channel.
- *Brand protection.* Some marketplaces invite resellers and counterfeits. Factor in Brand Registry / authorized-seller programs before launch.

**2. Build the listing for marketplace search, not a brand site.** A listing is a search result first.

- Title front-loaded with buyer keyword + brand + key spec. Strongest ranking signal on most marketplaces.
- Bullets: benefit-led, scannable, each answers one buyer question. No fluff.
- Images: white-background hero (required), then in-context, infographic spec callouts, comparison/sizing, social-proof image where allowed.
- A+ / Enhanced Brand Content where offered. Use the modules the algorithm rewards.
- Backend fields: search terms, subject matter, intended use, materials. Invisible to buyers; feeds ranking.

**3. Launch with a review-velocity plan.** Cold listings do not convert. Plan the first 25-50 reviews before going live: legitimate request automation (Amazon Vine for enrolled brands; platform-compliant request emails), insert cards directing to review without incentive, CS hand-off for satisfied buyers. Do not buy fake reviews — detection has been reliable since 2024 and suspension risk is existential.

**4. Run ads as a launch ladder, then a defense layer.**

- *Launch ladder:* aggressive Sponsored Products on exact-match buyer keywords for 60-90 days to manufacture sales velocity and review accumulation. High ACoS acceptable — name the threshold and exit criteria.
- *Defense layer:* once organic ranking is earned, ads defend against competitor brand-bidding, capture incremental category traffic, protect the buy box. Tighten ACoS to ROAS that supports next-sale unit economics, not just ad-attributed.

**5. Run a weekly listing-health cadence.** Mondays: suppressed listings, buy-box share, inventory days-on-hand, review velocity, rating drift, ad pacing, hijacker scan. Monthly: catalog audit, image refresh, A+ updates, price-test review.

## Decision rules

- **Title is 60% of marketplace ranking. Spend 60% of listing effort there.** Bullets, images, backend follow.
- **Inventory out = listing dead.** Going out of stock on a marketplace tanks ranking and the recovery takes weeks. Reorder triggers must run at 45+ days of cover, not 14.
- **Reviews compound; review-buying ends accounts.** Build the legitimate request system before launch; never short-cut it.
- **ACoS thresholds shift by phase.** Launch (60-90 days): high ACoS acceptable, target velocity + reviews. Steady-state: tighten to category-typical. Defense: pay to hold; do not optimize to zero.
- **As of 2026-05-16:** Amazon Rufus (AI shopping assistant) increasingly surfaces products via conversational queries. Listings written in plain-language declarative prose (matching the agentic-geo pattern) now outperform pure keyword-stuffed titles in Rufus-mediated discovery. Test both styles.
- **Buy-box loss has a root cause.** Price, fulfillment metrics, seller rating, stock — diagnose before reacting.

## Anti-patterns

- Copying your Shopify PDP into an Amazon listing. The reader and algorithm differ.
- Launching without a review-velocity plan; the listing dies at 3 reviews.
- Scaling ad spend while organic ranking has not caught up — you become ad-dependent forever.
- Treating fees as a fixed tax instead of modeling them per SKU.
- Operating on monthly cadence; the platform moves weekly.
- Quoting pre-2025 fee structures or algorithm behavior without dating them stale.

## Before / after

**Brief:** "Should we launch our SKU on Amazon?"

**Before** (vague go/no-go):
> *Amazon is huge — launch and see what happens.*

**After** (fit-first, 2026-05-16):
> *Step one: pull Brand Analytics on the top three category keywords; confirm monthly volume above threshold and a top-10 SERP not dominated by entrenched private label. Step two: model unit economics with 15% referral + FBA + 25% launch-ACoS — if margin survives, proceed; if negative, name Amazon as brand-awareness, not profit. Step three: 90-day plan — weeks 1-2 listing build (title + 7 images + A+ + 250-word Rufus-friendly description), week 3 FBA inventory, week 4 launch on three exact-match keywords + Vine for first 30 reviews. Measure: organic rank for primary keyword by day 60, review count by day 90, ACoS below category median by day 120.*
