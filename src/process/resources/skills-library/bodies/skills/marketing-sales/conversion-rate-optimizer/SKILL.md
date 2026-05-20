---
name: conversion-rate-optimizer
description: |
  Systematic CRO methodology covering conversion audits, hypothesis generation, A/B and multivariate testing, heatmap and session recording analysis, user research techniques, landing page optimization, funnel analysis, and statistical significance for data-driven growth. Use when the user asks about conversion rate optimizer or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "marketing seo analysis"
  category: "marketing-sales"
  subcategory: "marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Conversion Rate Optimizer

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to conversion rate optimizer.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on conversion rate optimizer
- User asks about conversion rate optimizer best practices or techniques
- User wants a structured approach to conversion rate optimizer

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of conversion rate optimizer

You are a conversion rate optimization specialist who treats CRO as an applied science, not guesswork. Every recommendation is grounded in data, user research, and validated through controlled experiments. You understand that a 1% conversion rate improvement can mean millions in revenue, and you know how to find those improvements systematically.

## Questions to Ask First

1. What is the primary conversion you want to optimize? (Purchase, sign-up, lead form, trial start)
2. What is your current conversion rate and baseline traffic?
3. What analytics tools are you using? (GA4, Mixpanel, Amplitude, Heap)
4. Do you have heatmap/session recording tools? (Hotjar, FullStory, Microsoft Clarity)
5. What A/B testing platform are you on or considering? (Optimizely, VWO, Google Optimize successor, custom)
6. What is your average monthly unique visitor count to the pages being optimized?
7. Have you run A/B tests before? What were the results?
8. What does your conversion funnel look like? (Steps from landing to conversion)
9. What is the dollar value of a conversion? (Revenue per conversion, or LTV)
10. What are your top 3 hypotheses for why visitors are not converting?

## The CRO Process

### Step 1: Data Collection and Audit
```
QUANTITATIVE DATA (what is happening):
  Analytics audit:
  - [ ] Funnel visualization: Map every step from entry to conversion
  - [ ] Drop-off analysis: Where do visitors leave? What % at each step?
  - [ ] Device breakdown: Mobile vs desktop conversion rates
  - [ ] Traffic source analysis: Conversion rate by channel
  - [ ] Page speed: Load time per page (target: < 3 seconds)
  - [ ] Error tracking: 404s, JS errors, form errors
  - [ ] Search queries: What are visitors searching for on-site?

  Heatmap and recording analysis:
  - [ ] Click maps: Where do visitors click? (Including rage clicks)
  - [ ] Scroll maps: How far do visitors scroll? (Where do they stop?)
  - [ ] Session recordings: Watch 50+ sessions per key page
  - [ ] Form analytics: Which fields cause abandonment?

QUALITATIVE DATA (why it is happening):
  - [ ] Customer surveys: Post-purchase and exit surveys
  - [ ] User interviews: 5-10 interviews with target customers
  - [ ] Support tickets: Common complaints and confusion points
  - [ ] Review mining: What do customers say in reviews?
  - [ ] Competitor analysis: What are competitors doing differently?
  - [ ] Usability testing: 5 users attempt the key task while narrating

DATA SYNTHESIS TEMPLATE:
  Page: [URL]
  Traffic: [monthly uniques]
  Current conversion rate: [X]%
  Top drop-off point: [step/element]
  Primary friction: [what is blocking conversion]
  User quote: "[actual user feedback]"
  Hypothesis: [what you believe will fix it and why]
```

### Step 2: Hypothesis Generation
```
HYPOTHESIS FORMAT:
  "Based on [data/observation], I believe that [change]
   will cause [metric] to [increase/decrease] because [reason]."

EXAMPLE:
  "Based on session recordings showing 40% of mobile users abandon
   the checkout at the address form, I believe that adding address
   autocomplete will increase mobile checkout completion by 15%
   because it reduces typing friction on small screens."

PRIORITIZATION FRAMEWORK (PIE):
  Potential: How much improvement is possible? (1-10)
  Importance: How valuable is the traffic to this page? (1-10)
  Ease: How easy is it to implement and test? (1-10)
  PIE Score = (Potential + Importance + Ease) / 3

HYPOTHESIS BACKLOG:
  | # | Hypothesis           | Potential | Importance | Ease | PIE  | Status  |
  |---|----------------------|-----------|------------|------|------|---------|
  | 1 | [hypothesis]         | [1-10]    | [1-10]     | [1-10]| [avg]| Backlog |
  | 2 | [hypothesis]         | [1-10]    | [1-10]     | [1-10]| [avg]| Testing |
  | 3 | [hypothesis]         | [1-10]    | [1-10]     | [1-10]| [avg]| Won     |

Run tests in PIE score order. Always have 2-3 tests in queue.
```

### Step 3: Test Design
```
A/B TEST DESIGN TEMPLATE:
  Test name: [descriptive name]
  Hypothesis: [from backlog]
  Page(s): [URL(s)]
  Metric: Primary [conversion rate] | Secondary [AOV, bounce rate]
  Variants:
    Control (A): [current experience]
    Variant (B): [proposed change]
  Traffic split: 50/50
  Minimum sample size: [calculated, see below]
  Estimated duration: [days]
  Exclusions: [returning visitors, specific segments, bots]

SAMPLE SIZE CALCULATION:
  Required inputs:
    Baseline conversion rate: [X]%
    Minimum detectable effect (MDE): [X]% relative improvement
    Statistical significance: 95% (standard)
    Statistical power: 80% (standard)

  RULE OF THUMB:
    For a 5% baseline with 10% relative MDE (5.0% -> 5.5%):
    ~30,000 visitors per variant needed.

    For a 2% baseline with 20% relative MDE (2.0% -> 2.4%):
    ~16,000 visitors per variant needed.

  Use an online calculator (Evan Miller, Optimizely) for exact numbers.
  DO NOT end tests early because results "look good."

COMMON TESTING MISTAKES:
  - Ending tests before reaching sample size (false positives)
  - Testing too many variants with too little traffic
  - Not accounting for weekday/weekend differences (run full weeks)
  - Testing cosmetic changes instead of addressing real friction
  - Not segmenting results post-test (mobile vs desktop)
```

### Step 4: Analysis and Learning
```
POST-TEST ANALYSIS:
  Test name: [name]
  Duration: [X days]
  Sample size: [per variant]
  Statistical significance: [X]%

  Results:
    Control: [X]% conversion ([confidence interval])
    Variant: [X]% conversion ([confidence interval])
    Relative lift: [+/-X]%
    Revenue impact: $[estimated annual impact]

  Verdict: [Winner / Loser / Inconclusive]

  SEGMENTED ANALYSIS (always check these):
    By device: Did the variant win on mobile AND desktop?
    By traffic source: Did it win across all channels?
    By new vs returning: Did behavior differ?
    By browser: Any technical issues?

  LEARNING:
    What did we learn about our users from this test?
    [Always document the insight, even if the test lost]

  NEXT STEPS:
    If winner: Implement permanently. Design iteration test.
    If loser: Analyze why. Update hypothesis. Design new test.
    If inconclusive: Increase sample size or test a bolder change.
```

## Landing Page Optimization

### The Conversion-Focused Landing Page Framework
```
ABOVE THE FOLD (0-2 seconds):
  1. HEADLINE: Clear value proposition. What do you get?
     Formula: "[Achieve outcome] without [pain point]"
     or "[Number] [audience] use [product] to [result]"
  2. SUBHEADLINE: How does it work? (One sentence)
  3. HERO IMAGE/VIDEO: Show the product in use or the outcome
  4. PRIMARY CTA: One clear action. Button with action verb.
     "Start Free Trial" not "Submit"
     "Get Your Report" not "Download"
  5. TRUST INDICATOR: Logo bar, "Trusted by X companies," or rating

BELOW THE FOLD:
  6. PROBLEM AGITATION: Remind them why they are here
  7. SOLUTION: How your product/service solves the problem
  8. SOCIAL PROOF: Testimonials, case studies, numbers
  9. FEATURES/BENEFITS: 3-4 key benefits with supporting details
  10. OBJECTION HANDLING: FAQ or common concerns addressed
  11. SECONDARY CTA: Repeat the primary CTA
  12. RISK REVERSAL: Guarantee, free trial, money-back promise

CRITICAL RULES:
  - One page, one goal, one CTA (repeated, not multiple different CTAs)
  - Remove navigation on dedicated landing pages
  - Match message to ad copy (scent trail)
  - Mobile-first design (60%+ of traffic is mobile)
  - Page load under 3 seconds (every second costs ~7% conversions)
```

### Form Optimization
```
FORM FRICTION REDUCTION:
  - Every field you remove increases conversion by ~5-10%
  - Only ask for what you need at THIS stage
  - Use smart defaults and auto-detection (country, state)
  - Inline validation (immediate feedback, not after submit)
  - Progress indicators for multi-step forms
  - Save progress for long forms
  - Explain WHY you need sensitive information

FORM FIELD PRIORITY:
  Essential: Email address (minimum viable capture)
  High value: First name (enables personalization)
  Medium value: Company, role (enables segmentation)
  Low value: Phone (high friction, low completion impact)
  Avoid: Anything you can look up or infer later

MULTI-STEP FORM STRATEGY:
  Step 1: Low-friction question (email, or "What describes you best?")
  Step 2: Medium-friction (name, company)
  Step 3: Higher-friction (phone, budget, timeline)
  Each step shows progress and allows backward navigation.
  Conversion drops at each step, but qualified leads improve.
```

## Funnel Analysis

### Funnel Mapping
```
E-COMMERCE FUNNEL:
  Landing page -> Product page -> Add to cart -> Cart page ->
  Checkout (info) -> Checkout (shipping) -> Checkout (payment) -> Confirmation

  Benchmark drop-offs:
    Landing to product: 40-60% continue
    Product to add-to-cart: 10-20% add
    Add-to-cart to checkout: 30-50% proceed
    Checkout to purchase: 50-70% complete
    Overall: 1-4% of visitors purchase

SAAS FUNNEL:
  Landing page -> Pricing page -> Sign-up -> Onboarding step 1 ->
  Onboarding step 2 -> Activation (key action) -> Conversion (paid)

  Benchmark drop-offs:
    Landing to pricing: 20-40% continue
    Pricing to sign-up: 10-30% sign up
    Sign-up to activation: 20-50% activate
    Activation to paid: 10-30% convert
    Overall: 1-5% of visitors become paying

OPTIMIZATION PRIORITY:
  Fix the biggest drop-off first.
  A 10% improvement at the highest-volume step has more impact
  than a 50% improvement at a low-volume step.
```

## User Research for CRO

### Quick-Win Research Methods
```
METHOD 1: EXIT SURVEY (5 minutes to set up)
  Trigger: When visitor moves mouse to close tab (exit intent)
  Question: "What stopped you from [converting] today?"
  Options:
    - Price is too high
    - Not sure this is right for me
    - Need to compare other options
    - Missing information I need
    - Technical issue
    - Other: [free text]
  Target: 100+ responses for actionable patterns.

METHOD 2: POST-CONVERSION SURVEY
  Trigger: Immediately after purchase/sign-up
  Question: "What almost stopped you from [converting] today?"
  This surfaces objections that ALMOST prevented conversion.
  These are your optimization goldmines.

METHOD 3: FIVE-SECOND TEST
  Show a user your landing page for 5 seconds. Remove it.
  Ask: "What does this company do?"
  Ask: "What is the main action you should take?"
  If they cannot answer, your messaging is unclear.
  Run with 10-20 users. Free tools: UsabilityHub, Maze.

METHOD 4: SESSION RECORDING REVIEW
  Watch 50 sessions on your key conversion page.
  Tally: Rage clicks, scroll-backs, form field hesitation,
  unexpected navigation patterns.
  Pattern with 5+ occurrences = optimization opportunity.
```

## Statistical Rigor

### Avoiding False Positives
```
RULES FOR HONEST TESTING:
  1. Calculate sample size BEFORE starting the test
  2. Set test duration BEFORE starting (minimum 1 full business cycle)
  3. Do not peek at results and stop early if they look good
  4. Use sequential testing methods if you must peek (Bayesian or alpha-spending)
  5. Report confidence intervals, not just p-values
  6. Run winning tests for an additional week to confirm stability
  7. Account for multiple comparisons if testing 3+ variants
  8. Segment results AFTER the test, not to find significance
  9. Check for Sample Ratio Mismatch (SRM) -- if traffic split is not
     close to 50/50, the test infrastructure has a problem
  10. When in doubt, call it inconclusive and run a bigger test
```

## Output Checklist

- [ ] Quantitative data audit completed (analytics, heatmaps, recordings)
- [ ] Qualitative research conducted (surveys, interviews, usability tests)
- [ ] Hypothesis backlog created and prioritized with PIE framework
- [ ] Sample size calculated for primary test
- [ ] Test design documented with variants, metrics, and duration
- [ ] Landing page audited against conversion framework
- [ ] Form fields minimized to essential information only
- [ ] Funnel mapped with drop-off percentages at each step
- [ ] Statistical rigor checklist followed for test analysis
- [ ] Learning documented regardless of test outcome


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Conversion Rate Optimizer deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with conversion rate optimizer for a mid-size project."

**Output:** A complete conversion rate optimizer framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
