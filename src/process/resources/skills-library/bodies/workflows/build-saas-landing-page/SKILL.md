---
name: build-saas-landing-page
description: >-
  End-to-end workflow for creating a high-converting SaaS landing page from
  copywriting through design, development, SEO optimization, and analytics
  setup. Covers persuasion frameworks, responsive design, performance
  optimization, and conversion tracking to turn visitors into customers.

  Use when the user wants to build saas landing page or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: >-
  copywriter nextjs-architect tailwind-designer accessibility-auditor
  web-performance seo-advisor seo-optimizer brand-strategist
  presentation-builder analytics-engineer
trigger_phrases: >-
  I want to build a landing page I need a SaaS website How do I create a
  high-converting landing page I want to build a marketing site
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: seo frontend step-by-step planning
  category: software-project
  depends: >-
    copywriter nextjs-architect tailwind-designer accessibility-auditor
    web-performance seo-advisor seo-optimizer brand-strategist
    presentation-builder analytics-engineer
  disclaimer: none
  difficulty: intermediate
---
# Build Saas Landing Page

**Estimated time:** 2-4 weeks

A SaaS landing page is the most important page in your business. It is where strangers become prospects and prospects become customers. This workflow covers the full lifecycle: persuasive copywriting using proven frameworks, visual design and development, SEO to drive organic traffic, performance optimization for fast load times, and analytics to measure and improve conversion rates.

The workflow follows a content-first approach: write the copy before you design, and design before you code. This ensures the page is built around persuasive messaging rather than forcing copy into a pre-built template. Every decision is oriented toward one goal: converting visitors into signups or sales.

## When to Use

- User wants to build saas landing page
- User needs a structured, step-by-step process for build saas landing page
- User wants to build a landing page
- I need a SaaS website
- How do I create a high-converting landing page
- Do NOT use when: the request is outside the scope of build saas landing page or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- A SaaS product (launched or in development) with a clear value proposition
- Understanding of your target customer and their pain points
- Brand assets (logo, color palette, typography) or willingness to create them
- Domain name and hosting capability
- Basic web development skills or a developer to implement

## Steps

**Step 1: Define Messaging and Write Copy** (uses: copywriter)

nail your positioning: what category are you in, who are you for, and what makes you different? Then use the Copywriter skill to write landing page copy using the PAS (Problem-Agitation-Solution) or AIDA (Attention-Interest-Desire-Action) framework. Write each section: hero headline and subheadline, problem statement, feature/benefit blocks (features tell, benefits sell), social proof section, pricing (if visible), FAQ, and CTA. Write multiple headline variants for A/B testing.

- Input: Target customer persona (who, what role, what pain), Product value proposition (what you do, why it matters), Competitive landscape (how you differ)
- Output: Positioning statement, Hero headline (3-5 variants for A/B testing), Subheadline and hero body copy
- Key focus: Use the Brand Strategist skill to nail your positioning: what category are you in, who are you for, and what makes you different? Then use the Copywriter skill to write landing page copy using the PAS (Problem-Agitation-Solution) or AIDA (Attention-Interest-Desire-Action) framework

**Step 2: Design and Develop the Page** (uses: nextjs-architect)

build the landing page with server-side rendering for SEO and fast initial load. Use the Tailwind Designer skill for responsive design with a mobile-first approach. Structure the page in sections that follow the copy flow: hero, problem, solution/features, social proof, pricing, FAQ, footer CTA. Use visual hierarchy to guide the eye: large headlines, breathing room between sections, contrasting CTA buttons. Implement smooth scrolling, subtle animations for engagement, and responsive images with next/image.

- Input: Copy from Step 1, Brand assets (logo, colors, typography), Design inspiration and competitors
- Output: Landing page implemented in Next.js with Tailwind CSS, Responsive design (mobile, tablet, desktop), Component structure for each page section
- Key focus: Use the Next.js Architect skill to build the landing page with server-side rendering for SEO and fast initial load

**Step 3: Ensure Accessibility** (uses: accessibility-auditor)

verify the landing page meets WCAG 2.2 Level AA. Check: color contrast ratios (minimum 4.5:1 for body text, 3:1 for large text), keyboard navigation (Tab key traverses all interactive elements), screen reader compatibility (semantic HTML, ARIA labels), image alt text, form accessibility, and focus indicators. Fix any violations. Accessible landing pages convert better because they reach more users.

- Input: Developed landing page from Step 2, WCAG 2.2 Level AA requirements, Target audience considerations
- Output: Accessibility audit report, Color contrast verification for all text/background combinations, Keyboard navigation test results
- Key focus: Use the Accessibility Auditor skill to verify the landing page meets WCAG 2.2 Level AA

**Step 4: Optimize Performance** (uses: web-performance)

optimize for Core Web Vitals: LCP (Largest Contentful Paint) under 2.5 seconds, FID/INP under 100ms, CLS (Cumulative Layout Shift) under 0.1. Optimize images (WebP/AVIF, responsive srcset, lazy loading), minimize JavaScript bundle (code splitting, tree shaking), enable compression (Brotli), configure CDN caching, and preload critical resources. Run Lighthouse and WebPageTest to verify performance. Every 100ms of load time improvement increases conversion rates by approximately 1%.

- Input: Developed landing page from Step 2, Core Web Vitals targets, Target audience geography and device types
- Output: Lighthouse performance audit (target: 90+ score), Core Web Vitals measurements (LCP, FID/INP, CLS), Image optimization (formats, sizes, lazy loading)
- Key focus: Use the Web Performance skill to optimize for Core Web Vitals: LCP (Largest Contentful Paint) under 2.5 seconds, FID/INP under 100ms, CLS (Cumulative Layout Shift) under 0.1

**Step 5: Optimize for SEO** (uses: seo-advisor)

Use the SEO Advisor skill for strategic SEO planning and the SEO Optimizer skill for on-page optimization. Implement: meta title and description (with target keywords), Open Graph and Twitter Card meta tags, structured data (Organization, Product, FAQ schema), semantic HTML (proper heading hierarchy), internal linking, sitemap.xml, and robots.txt. Create a content strategy for supporting pages (blog, documentation, comparison pages) that drive organic traffic to the landing page.

- Input: Developed landing page with copy from Step 1, Target keywords for organic discovery, Competitor SEO analysis
- Output: On-page SEO implementation (meta tags, headings, structured data), Open Graph and Twitter Card meta tags, Structured data (JSON-LD) for Organization, Product, FAQ
- Key focus: Use the SEO Advisor skill for strategic SEO planning and the SEO Optimizer skill for on-page optimization

**Step 6: Set Up Analytics and Conversion Tracking** (uses: analytics-engineer)

implement conversion tracking. Set up analytics (GA4, Plausible, or PostHog) with event tracking for key actions: page views, scroll depth, CTA clicks, form submissions, and conversions. Implement UTM parameter tracking to attribute conversions to marketing channels. Set up funnel visualization to identify where visitors drop off. Create a dashboard that shows the metrics that matter: traffic, conversion rate, bounce rate, and revenue impact.

- Input: Landing page from Steps 2-5, Key conversion actions (signup, demo request, pricing click), Marketing channels driving traffic
- Output: Analytics implementation (GA4 or privacy-friendly alternative), Event tracking for all CTAs and form submissions, Conversion funnel visualization
- Key focus: Use the Analytics Engineer skill to implement conversion tracking

**Step 7: Launch and Iterate** (uses: copywriter)

iterate on conversion rate. Launch the first A/B test (headline variants from Step 1) within the first week. Analyze scroll depth data to identify where visitors lose interest. Test CTA copy, button colors, and social proof placement. Each test should run for at least 2 weeks or 1,000 visitors (whichever is longer) to reach statistical significance. Document every test result to build institutional knowledge about what converts.

- Input: Live landing page with analytics from Step 6, Initial traffic and conversion data, Headline variants from Step 1
- Output: A/B test plan with hypothesis and metrics, Test results documentation, Conversion rate optimization backlog
- Key focus: Use the Copywriter skill to iterate on conversion rate

## Decision Points

- **After Step ?:** 
  - If **After Step 1**: Revise copy based on target audience feedback
  - If **After Step 4**: Optimize until performance targets are met
  - If **After Step 5**: Fix SEO issues before launch
  - If **After Step 6**: Fix tracking gaps before going live

## Failure Handling

- **Feature-centric copy:** -- Listing features instead of benefits. Nobody cares about "AI-powered analytics" -- they care about "make decisions 10x faster."
- **Designing before writing:** -- Fitting copy into a template forces awkward messaging. Write first, design to support the message.
- **Slow page load:** -- Every second of load time costs conversions. Optimize images, minimize JavaScript, and use a CDN.
- **No mobile optimization:** -- Over 50% of traffic is mobile. If the mobile experience is poor, half your visitors bounce.
- **Weak CTA:** -- "Submit" and "Learn More" are weak CTAs. Use action-oriented, value-focused language: "Start Free Trial" or "Get Your Dashboard."

## Expected Outcome

When this workflow is complete, the user will have:

1. Landing page loads in under 2.5 seconds on mobile (LCP)
2. Lighthouse score is 90+ across Performance, Accessibility, Best Practices, and SEO
3. Conversion rate exceeds industry average (typically 2-5% for SaaS)
4. Organic traffic grows month over month after SEO implementation
5. A/B testing produces at least one statistically significant improvement per month
6. Bounce rate is below 50%

## Output Format

```
BUILD SAAS LANDING PAGE TRACKER
===============================

[ ] Step 1: Define Messaging and Write Copy
    Status: [pending/in-progress/complete]
[ ] Step 2: Design and Develop the Page
    Status: [pending/in-progress/complete]
[ ] Step 3: Ensure Accessibility
    Status: [pending/in-progress/complete]
[ ] Step 4: Optimize Performance
    Status: [pending/in-progress/complete]
[ ] Step 5: Optimize for SEO
    Status: [pending/in-progress/complete]
[ ] Step 6: Set Up Analytics and Conversion Tracking
    Status: [pending/in-progress/complete]
[ ] Step 7: Launch and Iterate
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Feature-centric copy:** -- Listing features instead of benefits. Nobody cares about "AI-powered analytics" -- they care about "make decisions 10x faster."
- **Designing before writing:** -- Fitting copy into a template forces awkward messaging. Write first, design to support the message.
- **Slow page load:** -- Every second of load time costs conversions. Optimize images, minimize JavaScript, and use a CDN.
- **No mobile optimization:** -- Over 50% of traffic is mobile. If the mobile experience is poor, half your visitors bounce.

## Example

**Input:** "I want to build saas landing page and need a structured plan to follow step by step."

**Output:**

**Step 1 (copywriter-brand-strategist):** Define Messaging and Write Copy -- produces concrete deliverables for this phase.

**Step 2 (nextjs-architect-tailwind-designer):** Design and Develop the Page -- produces concrete deliverables for this phase.

**Step 3 (accessibility-auditor):** Ensure Accessibility -- produces concrete deliverables for this phase.

**Step 4 (web-performance):** Optimize Performance -- produces concrete deliverables for this phase.

**Step 5 (seo-advisor-seo-optimizer):** Optimize for SEO -- produces concrete deliverables for this phase.

**Step 6 (analytics-engineer):** Set Up Analytics and Conversion Tracking -- produces concrete deliverables for this phase.

**Step 7 (copywriter):** Launch and Iterate -- produces concrete deliverables for this phase.

**Result:** User has a complete build saas landing page plan with all deliverables produced, validated, and ready for implementation.
