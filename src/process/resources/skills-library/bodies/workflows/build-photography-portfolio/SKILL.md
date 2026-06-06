---
name: build-photography-portfolio
description: >-
  End-to-end workflow for building a professional photography portfolio from
  niche selection through shooting, editing, website creation, and client
  acquisition. Covers gear decisions, shooting technique, post-processing
  workflow, portfolio curation, online presence, and the transition from
  hobbyist to working photographer.

  Use when the user wants to build photography portfolio or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "photography-guide brand-identity-designer photography-business"
trigger_phrases: >-
  I want to build a photography portfolio start a photography business how to
  get photography clients build my photography website photography portfolio
  tips go pro as a photographer photography niche selection
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: photography editing entrepreneurship step-by-step planning
  category: creative-project
  depends: "photography-guide brand-identity-designer photography-business"
---
# Build Photography Portfolio

**Estimated time:** 2-4 months

This workflow guides you from hobbyist photographer to a professional with a
curated portfolio, online presence, and client pipeline. A portfolio is not
just a collection of your best photos -- it is a strategic marketing tool that
communicates your style, specialization, and the experience a client can expect.

The workflow covers niche selection, intentional shooting for portfolio gaps,
editing workflow development, website creation, social media strategy, and
client acquisition. It works for photographers at any level who want to
transition from shooting for fun to shooting for clients.

By the end of this workflow you will have: a defined photography niche, a
curated portfolio of 30-50 images, a professional website, active social media
presence, and a client acquisition system generating inquiries.

## When to Use

- User wants to build photography portfolio
- User needs a structured, step-by-step process for build photography portfolio
- User wants to build a photography portfolio
- start a photography business
- how to get photography clients
- Do NOT use when: the request is outside the scope of build photography portfolio or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A camera (DSLR, mirrorless, or high-quality smartphone)
- Basic understanding of exposure (aperture, shutter speed, ISO)
- Photo editing software (Lightroom, Capture One, or similar)
- Willingness to shoot intentionally for portfolio building (not just casually)

## Steps

**Step 1: Choose Your Photography Niche** (uses: photography-guide)

Use the Photography Guide and Photography Business skills to select a niche
and assess gear readiness.

- Input: photography experience and current skill level, Types of photography they enjoy and have practiced, Local market conditions and competition
- Output: Primary niche selection with market research, Current gear evaluation and upgrade plan, Shot list of images needed to fill the portfolio
- Key focus: Evaluating your existing work: which images are strongest and what do they

**Step 2: Shoot Intentionally for Your Portfolio** (uses: photography-guide)

execute intentional portfolio shoots. Focus
on:

- Input: `portfolio-targets` from Step 1 (shot list to execute), `niche-analysis` from Step 1 (niche-specific shooting requirements), `gear-assessment` from Step 1 (available equipment)
- Output: Organized raw files from 5+ portfolio shoots, Technical and creative notes from each session, Documented evolution of visual style across sessions
- Key focus: Use the Photography Guide skill to execute intentional portfolio shoots

**Step 3: Develop Your Editing Workflow** (uses: photography-guide)

build a professional editing workflow that
reinforces your visual style.

- Input: `raw-portfolio-sessions` from Step 2 (images to process), `style-development` from Step 2 (visual style to reinforce in post)
- Output: Software setup, preset library, and process documentation, Lightroom or Capture One presets defining your look, Full set of edited images ready for curation
- Key focus: Organizing a file management system: folder structure, naming conventions,

**Step 4: Build Your Portfolio Website** (uses: brand-identity-designer)

Use the Brand Identity Designer and SEO Advisor skills to create a portfolio
website that converts visitors into clients.

- Input: `edited-portfolio-set` from Step 3 (curated images for the site), `niche-analysis` from Step 1 (positioning and messaging), `competitor-research` from Step 1 (differentiation in presentation)
- Output: Live website with curated galleries and service pages, Local SEO optimization and Google Business Profile, Logo, color scheme, and typography for all materials
- Key focus: Choosing a platform: Squarespace and Pixieset are standard for photographers;

**Step 5: Acquire Clients** (uses: photography-business)

Use the Photography Business, Social Media Strategist, and Pricing Strategist
skills to build a client acquisition pipeline.

- Input: `portfolio-website` from Step 4 (destination for prospective clients), `niche-analysis` from Step 1 (target market for outreach), `competitor-research` from Step 1 (pricing and positioning context)
- Output: Clearly defined service tiers with pricing, End-to-end process from inquiry to referral, Channel selection and outreach strategy
- Key focus: Setting package pricing with clear deliverables, session length, and image count

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Showing everything instead of curating:** A portfolio of 200 images including mediocre shots is worse than 30 excellent ones. Curate ruthlessly.
- **No niche means no clients:** "I shoot everything" tells clients you specialize in nothing. Pick a niche. You can expand later.
- **Gear obsession over skill development:** A $500 camera with great lighting and composition beats a $5000 camera with poor technique. Invest in skills first.
- **Inconsistent editing style:** If every image looks like it was processed differently, the portfolio feels amateur. Develop and maintain a consistent look.
- **Waiting for clients to find you:** Clients do not find photographers by accident. You must actively market through social media, SEO, directories, and outreach.

## Expected Outcome

When this workflow is complete, the user will have:

1. A curated portfolio of 30-50 images demonstrates a consistent style and niche
2. A professional website converts visitors into client inquiries
3. An editing workflow produces consistent results efficiently
4. Pricing packages are competitive and sustainable
5. At least one client acquisition channel is generating regular inquiries
6. A repeatable client experience workflow exists from booking through delivery

## Output Format

```
BUILD PHOTOGRAPHY PORTFOLIO TRACKER
===================================

[ ] Step 1: Choose Your Photography Niche
    Status: [pending/in-progress/complete]
[ ] Step 2: Shoot Intentionally for Your Portfolio
    Status: [pending/in-progress/complete]
[ ] Step 3: Develop Your Editing Workflow
    Status: [pending/in-progress/complete]
[ ] Step 4: Build Your Portfolio Website
    Status: [pending/in-progress/complete]
[ ] Step 5: Acquire Clients
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Showing everything instead of curating:** A portfolio of 200 images including mediocre shots is worse than 30 excellent ones. Curate ruthlessly.
- **No niche means no clients:** "I shoot everything" tells clients you specialize in nothing. Pick a niche. You can expand later.
- **Gear obsession over skill development:** A $500 camera with great lighting and composition beats a $5000 camera with poor technique. Invest in skills first.
- **Inconsistent editing style:** If every image looks like it was processed differently, the portfolio feels amateur. Develop and maintain a consistent look.


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

**Input:** "I want to build photography portfolio and need a structured plan to follow step by step."

**Output:**

**Step 1 (photography-guide-photography-business):** Choose Your Photography Niche -- produces concrete deliverables for this phase.

**Step 2 (photography-guide):** Shoot Intentionally for Your Portfolio -- produces concrete deliverables for this phase.

**Step 3 (photography-guide):** Develop Your Editing Workflow -- produces concrete deliverables for this phase.

**Step 4 (brand-identity-designer-seo-advisor):** Build Your Portfolio Website -- produces concrete deliverables for this phase.

**Step 5 (photography-business-social-media-strategist-pricing-strategist):** Acquire Clients -- produces concrete deliverables for this phase.

**Result:** User has a complete build photography portfolio plan with all deliverables produced, validated, and ready for implementation.
