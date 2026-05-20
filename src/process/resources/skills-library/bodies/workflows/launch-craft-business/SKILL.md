---
name: launch-craft-business
description: >-
  End-to-end workflow for turning a crafting hobby into a business, from product
  development and pricing through branding, platform setup, and marketing.
  Covers handmade product refinement, cost-based pricing, brand identity,
  marketplace setup on Etsy and beyond, product photography, and marketing
  strategies specific to handmade and artisan businesses.

  Use when the user wants to launch craft business or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "craft-project-planner pricing-strategist brand-identity-designer handmade-seller social-media-strategist"
trigger_phrases: >-
  I want to sell my crafts start a craft business sell handmade items online
  launch an Etsy shop turn my hobby into a business handmade business guide
  craft business from home
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: sewing entrepreneurship branding step-by-step planning
  category: creative-project
  depends: "craft-project-planner pricing-strategist brand-identity-designer handmade-seller social-media-strategist"
---
# Launch Craft Business

**Estimated time:** 4-8 weeks

This workflow guides you from crafting hobbyist to business owner, covering
every step from product refinement through pricing, branding, platform setup,
and marketing. The handmade economy is thriving, but the gap between making
something beautiful and running a profitable business is where most crafters
stumble. Making the product is the easy part. Pricing it, branding it,
photographing it, listing it, and marketing it -- that is the business.

The workflow covers five phases: product development, pricing and costing,
brand identity, platform setup, and marketing. It is designed for crafters who
already make things people want to buy and need the business infrastructure to
sell them.

By the end of this workflow you will have: a refined product line, accurate
pricing, professional branding, active marketplace listings, and a marketing
strategy driving sales.

## When to Use

- User wants to launch craft business
- User needs a structured, step-by-step process for launch craft business
- User wants to sell my crafts
- start a craft business
- sell handmade items online
- Do NOT use when: the request is outside the scope of launch craft business or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A craft skill producing items people have expressed interest in buying
- Ability to produce items consistently (same quality every time)
- Basic materials and tools for your craft
- Time for both production and business operations
- A willingness to treat this as a business, not just a hobby

## Steps

**Step 1: Refine Your Product Line** (uses: craft-project-planner)

Use the Craft Project Planner and Handmade Seller skills to refine your product
offering into a sellable line.

- Input: craft skills and what they currently make, Feedback received from friends, family, or craft fair attendees, Available production time per week
- Output: Defined product catalog with descriptions and specifications, Quality checklist and standardized production process, Supplier list with pricing and lead times
- Key focus: Auditing your current products: which items get the most positive response,

**Step 2: Set Pricing That Works** (uses: pricing-strategist)

Use the Pricing Strategist and Handmade Seller skills to create sustainable
pricing.

- Input: `product-line` from Step 1 (items to price), `materials-sourcing` from Step 1 (cost inputs), `capacity-assessment` from Step 1 (production time per item)
- Output: True cost breakdown per product, Retail and wholesale prices with margin calculations, Shipping method, pricing, and packaging plan
- Key focus: Calculating true cost per item: materials + labor (pay yourself a real hourly

**Step 3: Build Your Brand** (uses: brand-identity-designer)

create a cohesive brand identity.

- Input: `product-line` from Step 1 (products that define the brand), `pricing-model` from Step 2 (market positioning)
- Output: Logo, colors, typography, and brand guidelines, Branded packaging materials and unboxing experience, Written narrative for about pages and marketing
- Key focus: Defining brand values: what your craft stands for (handmade quality,

**Step 4: Set Up Your Sales Platform** (uses: handmade-seller)

Use the Handmade Seller and E-Commerce Advisor skills to create your online
storefront.

- Input: `product-line` from Step 1 (items to list), `pricing-model` from Step 2 (prices and shipping), `brand-identity` from Step 3 (visual presentation)
- Output: Fully configured Etsy shop (and optional secondary platforms), Optimized listings with photos, descriptions, and tags, Professional product images for all listings
- Key focus: Setting up an Etsy shop: shop banner, about section, shop policies, and

**Step 5: Market and Grow** (uses: social-media-strategist)

Use the Social Media Strategist and Handmade Seller skills to build an audience
and drive sales.

- Input: `brand-identity` from Step 3 (brand voice and visual identity), `shop-setup` from Step 4 (storefront to drive traffic to), `product-photography` from Step 4 (content for social media)
- Output: Channel selection, content plan, and budget allocation, 30-day content plan across platforms, Etsy listing optimization guide
- Key focus: Instagram strategy: product flat lays, process videos, behind-the-scenes

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Pricing based on materials only:** If you neglect to pay yourself for labor, you are running a charity, not a business. Include your time at a fair hourly rate.
- **Trying to sell everything you make:** A focused product line with a cohesive aesthetic sells better than a random assortment. Curate ruthlessly.
- **Poor product photography:** On Etsy, the photo is the first impression. Natural light, clean backgrounds, and multiple angles are non-negotiable.
- **Ignoring Etsy SEO:** Etsy is a search engine. If your titles and tags do not match what buyers type, your products are invisible regardless of quality.
- **No brand consistency:** A logo on Etsy, a different look on Instagram, and plain brown packaging tells customers you are not serious. Consistency builds trust.

## Expected Outcome

When this workflow is complete, the user will have:

1. A cohesive product line of 10-15 items is available for purchase
2. Pricing covers all costs and generates sustainable profit
3. Brand identity is professional and consistent across all touchpoints
4. Online shop is live with optimized listings and professional photography
5. Marketing is active across at least 2 channels and driving consistent traffic
6. The transition from hobby to business is complete with systems for orders,

## Output Format

```
LAUNCH CRAFT BUSINESS TRACKER
=============================

[ ] Step 1: Refine Your Product Line
    Status: [pending/in-progress/complete]
[ ] Step 2: Set Pricing That Works
    Status: [pending/in-progress/complete]
[ ] Step 3: Build Your Brand
    Status: [pending/in-progress/complete]
[ ] Step 4: Set Up Your Sales Platform
    Status: [pending/in-progress/complete]
[ ] Step 5: Market and Grow
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Pricing based on materials only:** If you neglect to pay yourself for labor, you are running a charity, not a business. Include your time at a fair hourly rate.
- **Trying to sell everything you make:** A focused product line with a cohesive aesthetic sells better than a random assortment. Curate ruthlessly.
- **Poor product photography:** On Etsy, the photo is the first impression. Natural light, clean backgrounds, and multiple angles are non-negotiable.
- **Ignoring Etsy SEO:** Etsy is a search engine. If your titles and tags do not match what buyers type, your products are invisible regardless of quality.


### Timeline Considerations

This workflow is designed to be completed sequentially, but experienced users may parallelize some steps. Key dependencies:

- Each step builds on outputs from previous steps
- Steps involving external parties may have variable timelines
- Budget constraints may require phasing steps across multiple weeks or months
- Regular progress reviews between steps help catch issues early

### Success Indicators

Track these signals to confirm the workflow is on track:

- Each step produces a concrete, reviewable deliverable
- User confidence increases as steps are completed
- Deliverables from early steps remain valid as later steps are executed
- No critical assumptions from earlier steps are invalidated
- External feedback (where applicable) is incorporated before proceeding

## Example

**Input:** "I want to launch craft business and need a structured plan to follow step by step."

**Output:**

**Step 1 (craft-project-planner-handmade-seller):** Refine Your Product Line -- produces concrete deliverables for this phase.

**Step 2 (pricing-strategist-handmade-seller):** Set Pricing That Works -- produces concrete deliverables for this phase.

**Step 3 (brand-identity-designer):** Build Your Brand -- produces concrete deliverables for this phase.

**Step 4 (handmade-seller-e-commerce-advisor):** Set Up Your Sales Platform -- produces concrete deliverables for this phase.

**Step 5 (social-media-strategist-handmade-seller):** Market and Grow -- produces concrete deliverables for this phase.

**Result:** User has a complete launch craft business plan with all deliverables produced, validated, and ready for implementation.
