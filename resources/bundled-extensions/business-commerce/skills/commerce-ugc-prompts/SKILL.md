---
slash_command: false
name: commerce-ugc-prompts
description: "Generate review + photo + video prompts at the right post-delivery moment by product type. Inputs: product type (consumable / durable / cosmetic / apparel), platform. Output: prompt-timing recommendation (D+3 / D+7 / D+14 by category), template copy, incentive structure (compliant with platform anti-incentive rules), photo-prompt CTA. Trigger phrases: 'review prompt', 'UGC prompt', 'ask for a photo review', 'request video testimonial', '/commerce ugc-prompts <product-type>'."
version: 1.0.0
author: Wayland Business Pack
license: MIT
attribution:
  lineage: "Wayland Business Suite (Original)"
metadata:
  wayland:
    tags: [ecommerce, ugc, review-prompt, photo-review, video-review, yotpo, okendo, loox, trustpilot, amazon-reviews, anti-incentive]
    related_skills: [commerce, commerce-postpurchase-thankyou, commerce-review-response, commerce-tiktok-shop]
prerequisites:
  python_packages: []
---

# Commerce UGC Prompts

Generate review + photo + video prompts that fire at the right post-delivery moment, with platform-TOS-compliant incentive structures. UGC (user-generated content) compounds: each review prompts the next conversion. Timing and incentive structure determine whether it works or backfires.

## When to Use

Trigger phrases: "review prompt", "UGC prompt", "ask for a photo review", "request a video testimonial", "post-delivery review email", "incentivize UGC", `/commerce ugc-prompts <product-type>`.

Do NOT use for: full post-purchase sequence (use `commerce-postpurchase-thankyou`), responding to a review (use `commerce-review-response`), TikTok creator-affiliate brief (use `commerce-tiktok-shop`).

## Inputs

**Required:**
- `product_type` - consumable / durable / cosmetic / apparel / service / digital
- `platform` - Shopify | Amazon | Etsy | Trustpilot | Google | TikTok Shop | Walmart | other. **Determines incentive constraints.**

**Optional:**
- `review_platform` - Yotpo | Okendo | Loox | Stamped | Judge.me | Trustpilot | Amazon native | Etsy native | Google Business | TikTok Shop native
- `incentive_capacity` - none / fixed dollar / percent off next order / loyalty points / charity donation
- `brand_voice`
- `existing_review_count` - informs whether to lead with social proof
- `out_path`

If `product_type` or `platform` is missing, ask before generating.

## Platform anti-incentive rules (read first)

Different platforms have different rules about what you can offer in exchange for a review. Get this wrong and you risk account suspension or review removal.

| Platform | Incentive policy |
|---|---|
| **Amazon** | **No incentives whatsoever** for reviews. Even free product → review is a "Vine Voices" exclusive program; outside Vine, any free / discounted product offered conditional on a review is a TOS violation. Asking for "honest reviews" without conditional offer is fine. |
| **Etsy** | No conditional incentives. May ask for review; may not offer compensation in exchange. |
| **Trustpilot** | **Strictest in this category.** Inviting all customers equally is fine. **Any compensation, discount, gift, or store credit "in exchange for an updated, removed, or revised review" is prohibited.** Even framing it as "thank you for the review" is risky if it follows the review and looks like a quid-pro-quo. |
| **Google Business reviews** | Google's policy prohibits offering incentives in exchange for reviews. Asking is fine. |
| **Walmart Marketplace** | Similar to Amazon - no incentives in exchange for reviews. |
| **Shopify storefront (Yotpo, Okendo, Loox, Judge.me)** | Generally permitted: discount on next order, loyalty points, photo-review bonus. **The discount must be offered to all buyers, not conditional on review content (positive or negative).** Yotpo, Okendo, Loox have built-in "discount-after-review" logic that is compliant when the discount fires regardless of star rating. |
| **TikTok Shop native reviews** | Conditional incentives for content (UGC video tagged on the listing) are permitted via the creator-affiliate program. Direct review incentives - same as Amazon (avoid). |

**Bottom line:**
- For Amazon, Walmart, Etsy, Trustpilot, Google: **never offer compensation conditional on a review**. Send the prompt; thank the customer regardless.
- For Shopify storefront review platforms: discount-after-review is fine when the discount is unconditional on rating.
- For TikTok Shop UGC: route through creator-affiliate program (`commerce-tiktok-shop`), not this skill.

## Workflow

### Phase 1: Timing per product type

Default delivery-to-prompt windows:

| Product type | Best window | Why |
|---|---|---|
| **Consumable** (food, supplements, beauty replenishables) | **D+14** | Used long enough to evaluate effect / taste |
| **Cosmetic / skincare** | **D+21** | Skin results visible after ~3 weeks |
| **Apparel** | **D+7** | Worn, washed once, fit confirmed |
| **Durable** (home goods, electronics, furniture) | **D+30** | Used long enough to evaluate quality and durability |
| **Service** | **D+3** | Recall is fresh |
| **Digital / SaaS** | **D+14 + D+30** | Two prompts - first impressions + sustained value |
| **Gift purchases (any category)** | Adjust to D+gift_date+N rather than D+order+N | Buyer may not have used the product yet |

For Amazon, the platform itself sends a review request at variable intervals; piling another email on top is permitted but should be timed to NOT overlap.

### Phase 2: Prompt copy template

Each prompt is a single email (or SMS) with:

1. **Subject:** specific to the product (not "leave a review")
2. **Body (≤ 150 words):**
   - Acknowledge they've had it for N days
   - One specific question that gets a real answer (not "how is it?" but "is the leather softening yet?")
   - Single review CTA - link directly to the review platform's submission form, pre-filled with the product if possible
   - **Photo / video prompt** if applicable: explicit ask, with constraints ("a photo of the product in your space", "a 15-30 second clip showing it in use")
   - **Incentive disclosure** (only if your platform permits) - clearly state the discount/credit is offered to all reviewers regardless of rating
3. **CTA:** primary = leave review; secondary (optional) = upload photo / video; tertiary (optional) = referral program
4. **Anti-pattern check:** the email must work as well for a 5-star review as for a 2-star review. If the copy reads as fishing for positive only, rewrite.

### Phase 3: Photo + video prompt copy

Photo and video reviews are **3-5x more useful** than text-only for converting future buyers. Specific asks beat generic.

**Photo prompt:**
- Short, generous: "A photo of the <product> in your kitchen / bedroom / bag" - name the context.
- Mention the technical floor: "Phone-camera quality is more than enough - no studio shot needed."
- If your review platform supports auto-import (Loox, Okendo from Instagram), say so: "Or tag us @<brand> on Instagram and we'll pull it in for you."

**Video prompt (only if appropriate to product type):**
- 15-30 seconds.
- One specific moment: "Show the <product> in use - first 5 seconds, on-screen text if you want."
- For TikTok-Shop-eligible products: route to creator-affiliate program; this skill is for owned-channel video prompts.

### Phase 4: SMS variant

For short text-review platforms (Trustpilot, Google Business), an SMS variant is fine. For photo / video prompts, email is better - phones can compose photos but the email has the link.

SMS template (≤ 160 chars, TCPA-quiet-hours aware):
```
Hi {{ first_name|default:'there' }} - quick favor: would you leave a 1-line review of your <product>? <short link>
Reply STOP to opt out.
```

### Phase 5: Incentive structure (platform-aware)

**Permitted (Shopify storefront / owned channel):**
- "10% off your next order after you submit a review (any rating)"
- "100 loyalty points for any review; 200 for a photo review (any rating)"
- "We donate $1 to <charity> per review submitted (any rating)"
- "Featured customer of the week - submit a photo and we'll pick one to feature on our IG"

**Prohibited (Amazon, Etsy, Trustpilot, Google, Walmart):**
- Anything conditional on rating
- Anything tied to "5-star reviews only"
- Anything offered after a review with the implicit expectation of an update

### Phase 6: Sanity check

- Timing matches product type
- Email copy works for any rating
- Photo / video ask is specific and generous
- Incentive structure is platform-compliant
- TCPA quiet hours respected on SMS
- No anti-pattern (rating-conditional incentive, fishing for 5-stars)

## Output Schema

Write to resolved `out_path`:

```markdown
# UGC Prompt Sequence: <product_type>
**Platform:** <platform>   **Review platform:** <review_platform>
**Date drafted:** <YYYY-MM-DD>

## Timing
- Best window: D+<N> from delivery
- Reasoning: <one line>

## Email Prompt
**Subject A / B / C:** ...
**Preview:** ...
**Body:** [≤ 150 words]
**Review CTA:** <link to review platform>
**Photo CTA (if applicable):** ...
**Video CTA (if applicable):** ...

## SMS Variant (if SMS opt-in)
[≤ 160 chars + STOP/HELP]

## Incentive Structure
- Type: <none / discount / loyalty points / charity / feature>
- Platform compliance: ✅ / 🚫
- Conditional on rating: NO (verified)
- Disclosed in copy: yes / no

## Anti-pattern Audit
- Copy works for 2★ as well as 5★: yes / no
- No fishing for positive only: yes / no
- No off-platform contact in Amazon/Etsy/Walmart copy: yes / no

## Recommended next steps
- Wire flow trigger in Klaviyo / ESP: "Order delivered N days ago AND order contains <product_type tag>"
- Connect review platform's auto-publish webhook so reviews surface on PDP
- Run `/commerce review-response` to align reply scripts with this prompt cadence
- Run `/commerce postpurchase-thankyou` if not already in place - UGC prompt sits naturally at D+<N> in that sequence
```

## Templates / Examples

### Example A - Cosmetic / skincare ($35 serum, Shopify + Loox, casual voice, D+21)

**Email:**

Subject A: Three weeks in - what's your skin saying?
Subject B: D+21 - the question we actually want to hear
Subject C: Photo bonus - share your week-3 with the serum

Body:
```
{{ first_name|default:'Hey' }} -

You've had the <serum> for three weeks now. By now your skin has had time to actually respond - most users see the strongest shift between week 2 and week 4.

One specific question: are you seeing the change you hoped for, or is something off?

[Leave a review - any rating, any length]

If you'd like to share a before/after or a current selfie, you can [upload a photo here] or tag us @<brand> on Instagram. Phone-camera quality is more than enough.

A small thank-you: every review (any rating) earns 100 points; photo reviews earn 200. Points apply on your next order.

- The team
```

### Example B - Apparel ($89 sneaker, Shopify + Okendo, casual voice, D+7)

**Email:**

Subject A: Week 1 - how do they fit?
Subject B: 7 days in - quick check-in
Subject C: Photo prompt - your sneakers in the wild

Body:
```
You've had the Field Sneakers for a week.

Two questions, one CTA:

1. **Fit** - true-to-size, or wish you'd sized differently?
2. **Break-in** - softening at the toe box yet?

[Leave a 1-line review (any rating)]

Bonus: if you snap a photo of the sneakers in the wild - at the trail, on the subway, wherever - you can [upload it here] or tag @<brand>. We pick one shot a week to feature.

10% off your next order after you submit a review, any rating, no minimum.

- The Field team
```

### Example C - Amazon ($24 coffee bag, Amazon native review, formal voice, D+14, NO INCENTIVE)

**Email** (sent via brand-site if customer also opted in to brand newsletter - Amazon does not allow seller-direct review-prompt emails outside Amazon's own messaging system):

Subject: Your <coffee> - two-week check-in
Preview: A note from the roastery - and an honest ask.

Body:
```
Hi -

Thank you for ordering the <coffee> from us through Amazon. You've had it for two weeks now, so by now you've probably brewed the bag a few times.

If you have a moment, an honest review on the Amazon listing helps the next person decide. A 1-sentence review is more than enough - what worked, what didn't.

[Leave a review on Amazon]

We don't offer discounts or compensation for reviews - Amazon prohibits it, and we'd rather hear what you actually think than buy a positive review.

If something was off with the order or the coffee, please use the Contact seller link on your Amazon order page so we can resolve it directly.

- The roastery team
```

### Example D - Trustpilot service review (B2B SaaS onboarding, D+3)

**Email:**

Subject A: 3 days in - quick favor?
Subject B: Your honest take on onboarding
Subject C: 1-sentence review - Trustpilot

Body:
```
Hi {{ first_name|default:'there' }} -

You completed onboarding three days ago. While the process is fresh, would you leave an honest review on Trustpilot?

[Leave a Trustpilot review]

We don't offer compensation for reviews - Trustpilot's policy doesn't allow it, and we wouldn't want to anyway. Just an honest read of the experience helps prospective customers make a real decision.

If something didn't work in onboarding, please reply directly and we'll fix it.

- The team
```

## Notes

- **Platform anti-incentive policies are the single biggest compliance risk in UGC prompts.** Get this wrong on Amazon, Walmart, Etsy, or Trustpilot and you risk listing or seller-account suspension.
- **Specific questions get specific answers.** "How is it?" gets generic 5-star reviews. "Is the leather softening?" gets useful, detailed reviews that convert future buyers.
- **Photo / video reviews lift conversion 30-50% on PDPs** (Yotpo / Okendo published data). The investment in a generous photo-prompt pays back.
- **The email must work for a 2★ review.** If the copy fishes for positive only, you're training a biased review pool that will eventually correct on you.
- **TCPA quiet hours apply to SMS prompts.** 8am-9pm local time, US.
- **Suggested follow-ups:** `/commerce postpurchase-thankyou` to integrate this prompt into the full post-purchase sequence; `/commerce review-response` to align reply scripts with reviews that come in.
