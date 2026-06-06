---
name: wayland-sku-launch
description: >-
  Launch a new SKU end to end: gather the product brief, recommend pricing and a
  naming approach, build the listing, then build the post-purchase thank-you page
  and the upsell flow, with review gates before shipping the launch package.

  Use when the user wants a structured multi-step process to take a new product
  from idea to a complete, launch-ready package.

  Do NOT use for editing an existing live listing or a single pricing question.
license: Apache-2.0
type: workflow
skills: "funnels-offer-pricing commerce-listing commerce-description commerce-postpurchase-thankyou commerce-upsell-flow"
metadata:
  author: wayland
  version: 1.0.0
  tags: commerce ecommerce sku-launch pricing listing upsell step-by-step
  category: marketing
  depends: "funnels-offer-pricing commerce-listing commerce-description commerce-postpurchase-thankyou commerce-upsell-flow"
---
# SKU Launch

**Estimated time:** 30-45 minutes

This workflow preps a new SKU for launch: pricing, naming, listing, the
post-purchase thank-you page, and the upsell flow. It moves from the product
brief through inferred pricing and naming, to a built listing, to the
post-purchase experience, with review gates so the user can refine before the
full launch package ships.

## When to Use

- User is launching a new product or service and needs the full launch package
- User can describe the product, platform, cost basis, and target margin
- Do NOT use for editing an existing listing or answering a lone pricing question

## Steps

**Step 1: Gather the SKU brief** (uses: commerce-listing)

Tell the user you will prep a new SKU launch covering name, price, listing, and
post-purchase flow. Then gather: the product (what it does, who it is for), the
platform, the COGS or service-cost, and the target margin. Capture this as the
SKU brief that drives pricing, naming, and the listing. Do not proceed without
the product description, cost basis, and target margin.

- Input: user-provided product, platform, COGS/service-cost, target margin
- Output: a structured SKU brief
- Key focus: cost basis and target margin are required before pricing

**Step 2: Recommend pricing** (uses: funnels-offer-pricing)

From the brief, recommend a pricing tier that respects the cost basis and target
margin and fits the market positioning. Present the recommended price (and any
tiering, e.g. good/better/best) with the reasoning. Let the user confirm or
override before naming and listing build on top of it.

- Input: SKU brief from Step 1
- Output: a recommended pricing tier with reasoning
- Key focus: price must satisfy the target margin given the cost basis

**Step 3: Recommend a naming approach** (uses: commerce-listing)

Using the brief and the chosen pricing, recommend a naming approach for the SKU:
descriptive, branded, or outcome-based, with one or two concrete name options.
Present the recommendation and the reasoning (price tier and audience inform
whether a premium/branded name or a plain descriptive name fits best). Let the
user confirm or override.

- Input: SKU brief and confirmed pricing
- Output: a recommended naming approach with concrete name options
- Key focus: align the name with the price tier and the buyer

**Step 4: Build the listing** (uses: commerce-description)

Build the full SKU listing from the brief, pricing, and naming: title, hero,
value proposition, feature/benefit body, and CTA. Show the listing. Then ask
whether to refine the listing or proceed to the post-purchase flow; if they
refine, revise against their feedback and re-show, for up to three rounds,
before advancing.

- Input: SKU brief, pricing, and naming
- Output: a complete new-SKU listing
- Key focus: the listing reflects the agreed name and price; fold in feedback

**Step 5: Build the post-purchase thank-you page** (uses: commerce-postpurchase-thankyou)

Build the post-purchase thank-you page for the new SKU: order confirmation,
next-step guidance, expectation-setting, and the hook into the upsell. Use the
listing and brief as context. Show the thank-you page.

- Input: the built listing and the SKU brief
- Output: a post-purchase thank-you page
- Key focus: confirm the purchase and set up the upsell

**Step 6: Build the upsell flow** (uses: commerce-upsell-flow)

Build the upsell flow for the new SKU: the offer(s) presented after purchase,
their sequencing, and the logic for when each upsell or down-sell fires. Use the
listing and brief as context. Show the upsell flow. Then ask whether to ship the
SKU launch package or refine the upsell flow; if they refine, revise and re-show,
up to two rounds, before completing.

- Input: the built listing and the SKU brief
- Output: a post-purchase upsell flow with offer sequencing and trigger logic
- Key focus: maximize order value without harming the post-purchase experience

**Step 7: Assemble the launch package** (uses: commerce-listing)

Compile the final deliverable: a SKU Launch Package bringing together the brief,
pricing, naming, listing, thank-you page, and upsell flow in one document the
user can execute against. Present it as the shipped artifact.

- Input: brief, pricing, naming, listing, thank-you page, and upsell flow
- Output: a complete SKU Launch Package
- Key focus: one launch-ready document covering the full SKU lifecycle
