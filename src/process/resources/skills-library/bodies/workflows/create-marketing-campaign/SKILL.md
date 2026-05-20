---
name: create-marketing-campaign
description: |
  Guides the user through creating a complete marketing campaign from
  strategic planning through copy creation, email execution, analytics
  measurement, and optimization testing. Use when the user needs to plan
  and execute a marketing campaign with coordinated messaging across
  channels, clear measurement, and systematic optimization.
  Do NOT use for a full product launch (use launch-product), for ongoing
  content marketing without a campaign focus (use create-content-calendar),
  or for single-channel email sequences only (use email-campaign directly).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "marketing branding content-marketing strategy step-by-step"
  category: "business-operations"
  depends: "campaign-planning landing-page-copy email-campaign marketing-analytics-report ab-test-design"
  disclaimer: "none"
  difficulty: "intermediate"
---

# Create a Marketing Campaign

A five-step workflow that takes a marketing campaign from strategic planning through landing page copy creation, email execution, analytics measurement, and A/B test optimization. Each step produces deliverables that build toward a measurable, optimizable campaign rather than a one-shot marketing effort.

**Estimated time:** 1-4 weeks (depending on campaign complexity, number of channels, and creative production requirements)

## When to Use

- User needs to plan and execute a coordinated marketing campaign for a product, service, or event
- User wants a structured process that connects strategy to execution to measurement
- User is running a promotional campaign (seasonal sale, product launch support, awareness drive) and needs a repeatable framework
- User wants to move beyond ad-hoc marketing efforts to systematic, measurable campaigns
- Do NOT use when: the user is launching a new product (use launch-product for the full launch process), managing ongoing content without a campaign focus (use create-content-calendar), or only sending email without a broader campaign (use email-campaign directly)

## Prerequisites

Before starting this workflow, ensure:

1. **Campaign objective:** The user has a clear goal for the campaign -- lead generation, sales conversion, brand awareness, event registration, or product adoption. The objective must be specific enough to measure.
2. **Target audience:** The user knows who the campaign targets, even at a general level ("small business owners in the US" or "existing customers who have not renewed").
3. **Budget and timeline:** The user has a budget range (even "$0 organic only" is a valid budget) and a campaign duration (start and end dates).
4. **Offer or message:** The user has something to communicate -- a promotion, a new feature, an event, or a value proposition that justifies the campaign.

## Steps

**Step 1: Campaign Strategy and Planning** (uses: campaign-planning)

Define the campaign's strategic foundation: objective, audience, message, channels, timeline, and budget allocation. The campaign plan ensures all subsequent creative and execution work serves a unified strategic goal.

- Input: Campaign objective, target audience, budget, timeline, offer or key message, and any brand guidelines or existing marketing assets
- Output: A complete campaign plan containing: specific measurable objective (e.g., "generate 500 qualified leads at under $25 CPL"), target audience with segmentation criteria, messaging hierarchy (headline, supporting message, proof points, CTA), channel selection with budget allocation per channel, campaign timeline with milestones and deadlines, and success metrics with measurement plan
- Key focus: The messaging hierarchy must be consistent across all channels. The headline, supporting message, and CTA should work together whether the audience sees them on a landing page, in an email, or on a social media ad. Test the messaging hierarchy by reading only the headline and CTA -- the value proposition should be clear without the supporting copy.

**Step 2: Landing Page Copy** (uses: landing-page-copy)

Create the central conversion point for the campaign. The landing page is where interest converts to action, making its copy the highest-leverage asset in the campaign.

- Input: Campaign messaging hierarchy from Step 1, offer details, target audience profile, and any design constraints or brand guidelines
- Output: Complete landing page copy containing: headline and subheadline aligned with campaign messaging, benefit-focused body copy structured for scannability, social proof elements (testimonials, logos, statistics), clear primary CTA with supporting secondary CTA, objection-handling section addressing the top 3 reasons the audience might not convert, and a form or action mechanism matched to the campaign objective (signup form, purchase button, registration link)
- Key focus: The landing page must match the promise made in the campaign ads and emails. If the ad says "Get 30% off," the landing page headline must immediately confirm the 30% discount. Any disconnect between ad promise and landing page reality kills conversion rate. This alignment is called "message match" and is the single most impactful landing page optimization.

**Step 3: Email Campaign Execution** (uses: email-campaign)

Design and execute the email component of the campaign, including the primary campaign email, follow-up sequences, and segmentation strategy. Email typically delivers the highest ROI of any marketing channel.

- Input: Campaign plan and messaging from Step 1, landing page copy and URL from Step 2, email list segments matching the target audience, and email platform capabilities (automation, A/B testing, personalization)
- Output: A complete email campaign containing: primary campaign email (subject line, preview text, body copy, CTA) aligned with campaign messaging, follow-up sequence for non-openers (2-3 emails with varied subject lines and angles), follow-up sequence for openers who did not convert (addressing likely objections from the landing page), segmentation strategy (which audience segments receive which email variant), and send schedule optimized for the audience's engagement patterns
- Key focus: The email sequence is not just "send the same message three times." Each follow-up must offer a different angle on the same value proposition. If the first email leads with a benefit, the follow-up might lead with social proof. If the second follow-up leads with scarcity, the third might lead with a case study. Same offer, different persuasion frame.

**Step 4: Campaign Analytics** (uses: marketing-analytics-report)

Measure campaign performance against the success metrics defined in Step 1. Analytics turns a campaign from a one-time effort into a learning opportunity that improves every subsequent campaign.

- Input: Campaign success metrics from Step 1, actual campaign data (email metrics, landing page metrics, ad metrics, conversion data), and baseline benchmarks for the channel and industry
- Output: A marketing analytics report containing: overall campaign performance vs objective (did we hit the goal?), channel-by-channel performance breakdown (which channels delivered, which underperformed), funnel analysis (awareness to click to landing page to conversion -- where are the drop-offs?), audience segment analysis (which segments converted best?), cost analysis (CPL, CPA, ROAS), and a prioritized list of optimization opportunities for the next campaign or the A/B testing phase
- Key focus: Identify the single biggest conversion bottleneck in the funnel. If the click-through rate is high but landing page conversion is low, the problem is on the landing page. If click-through is low but conversion is high, the problem is in the ad or email copy. Fixing the bottleneck has more impact than optimizing elements that are already performing adequately.

**Step 5: A/B Test and Optimize** (uses: ab-test-design)

Design and run experiments to optimize the campaign's weakest points based on the analytics from Step 4. Testing transforms intuition-based marketing decisions into data-driven improvements.

- Input: Analytics report from Step 4 (especially the optimization opportunities and funnel bottlenecks), remaining campaign budget and timeline, and existing creative assets that can be varied
- Output: An A/B testing plan containing: 2-4 prioritized experiments targeting the identified bottlenecks, hypothesis and success criteria for each test, test variants (what specifically is being changed -- headline, CTA, image, send time, audience segment), sample size and duration requirements for statistical significance, and a measurement plan tied back to the campaign's success metrics
- Key focus: Test one variable at a time per experiment. Changing the headline, image, and CTA simultaneously makes it impossible to attribute the result to any single change. Start with the element closest to the conversion point (CTA button, form design) because small improvements at the bottom of the funnel have outsized impact on total conversions.

## Output Format

```
## Marketing Campaign: [Campaign Name]

### Campaign Strategy
- **Objective:** [specific measurable goal]
- **Target Audience:** [segment description]
- **Budget:** [total] allocated as [channel 1: $X], [channel 2: $X]
- **Timeline:** [start date] to [end date]
- **Key Message:** [headline | supporting message | CTA]

### Landing Page
- **URL:** [page URL or draft location]
- **Headline:** [headline text]
- **Primary CTA:** [CTA text and action]
- **Social Proof:** [type and count -- e.g., "3 customer testimonials, 2 logo bars"]
- **Message Match Check:** [confirmed aligned with ad/email copy]

### Email Campaign
- **Primary Email:**
  - Subject: [subject line]
  - Send Date: [date and time]
  - Segment: [audience segment]
- **Follow-up Sequence:**
  | Email | Trigger              | Subject Line           | Angle        | Send Date |
  |-------|----------------------|------------------------|--------------|-----------|
  | FU-1  | Non-opener (48hr)    | [subject]              | [angle]      | [date]    |
  | FU-2  | Opener, no convert   | [subject]              | [angle]      | [date]    |
  | FU-3  | Final reminder       | [subject]              | [angle]      | [date]    |

### Campaign Analytics
- **Objective Status:** [met/not met] -- [actual] vs [target]
- **Funnel Performance:**
  | Stage           | Volume  | Rate    | Benchmark |
  |-----------------|---------|---------|-----------|
  | Impressions     | [count] | --      | --        |
  | Clicks          | [count] | [CTR]   | [bench]   |
  | Landing Page    | [count] | [conv%] | [bench]   |
  | Conversions     | [count] | [total] | [bench]   |
- **Best Segment:** [segment] -- [conversion rate]
- **Cost:** CPL [amount], CPA [amount], ROAS [ratio]
- **Bottleneck:** [identified funnel stage]

### A/B Tests
| Test | Variable         | Control          | Variant          | Hypothesis           | Result  |
|------|-----------------|------------------|------------------|----------------------|---------|
| 1    | [element]       | [current]        | [test version]   | [if X then Y]        | [TBD]   |
| 2    | [element]       | [current]        | [test version]   | [if X then Y]        | [TBD]   |
```

## Decision Points

- **Before Step 1 (paid vs organic):** If the campaign budget is $0, skip paid channel planning in Step 1 and focus on owned channels (email, blog, social organic). The email campaign in Step 3 becomes the primary conversion channel. If budget is available, allocate 60-70% to the highest-confidence channel and 30-40% to testing a secondary channel.
- **After Step 1 (single channel vs multi-channel):** If the campaign runs on a single channel (email only or social only), Steps 2 and 3 merge into a single execution step. The landing page may not be needed if the conversion happens within the channel itself (e.g., an in-email purchase or a social media DM).
- **After Step 1 (brand awareness vs direct response):** Brand awareness campaigns measure reach and recall, not conversions. Adjust Step 4 analytics to track brand metrics (reach, impressions, engagement rate, share of voice) instead of conversion metrics. Step 5 tests creative effectiveness rather than conversion optimization.
- **After Step 2 (budget allocation decision):** If the landing page conversion rate in early data is below 2%, reallocate budget from traffic acquisition to landing page optimization. Driving more traffic to a low-converting page wastes budget. Fix the page first, then scale traffic.
- **After Step 4:** If one channel delivers more than 3x the ROI of other channels, reallocate remaining budget entirely to the winning channel. Diversification is valuable for learning but not for maximizing results within a single campaign.

## Failure Handling

- **Step 1 fails (unclear objective or audience):** If the user cannot define a specific, measurable campaign objective, do not proceed. Help them narrow the objective using the SMART framework: Specific (what exactly?), Measurable (what number?), Achievable (is it realistic?), Relevant (does it serve a business goal?), Time-bound (by when?). An objective of "get more leads" becomes "generate 200 qualified leads from enterprise accounts by March 31."

- **Step 2 produces low-converting landing page:** If the landing page conversion rate is below 1% after 500+ visits, diagnose before fixing: (a) check message match between ad/email and landing page headline, (b) verify the CTA is visible above the fold, (c) test page load speed (every additional second of load time reduces conversion by 7%), (d) review the form for unnecessary fields (every additional field reduces completion by 10%). Fix one element at a time and re-measure.

- **Step 3 email deliverability issues:** If email open rates are below 15% (industry benchmark is 20-25%), the problem is likely deliverability, not subject lines. Check: sender reputation, authentication (SPF, DKIM, DMARC), list hygiene (remove bounces and inactive subscribers), and sending volume (sudden volume spikes trigger spam filters). Fix deliverability before testing subject lines.

- **Step 4 shows campaign underperformance:** If the campaign misses its objective by more than 50%, identify whether the failure is strategic (wrong audience, wrong message) or tactical (poor execution, technical issues). Strategic failures require returning to Step 1. Tactical failures can be addressed in Step 5 through testing and optimization.

- **Step 5 tests are inconclusive:** If A/B tests do not reach statistical significance within the campaign timeline, extend the test duration or increase traffic to the test. Do not declare a winner based on insufficient data. If the campaign ends before significance is reached, document the directional results and apply the learnings to the next campaign.

- **User wants to change direction mid-workflow:** If the campaign objective changes after Step 3 execution has begun, evaluate whether existing creative assets can serve the new objective. If the message must fundamentally change, restart from Step 1. If only the target audience or channel mix changes, restart from Step 2 with the existing messaging.

## Expected Outcome

When this workflow is complete, the user will have:

1. A documented campaign strategy with clear objectives, audience targeting, and budget allocation
2. A high-converting landing page with message-matched copy and clear CTA
3. An executed email campaign with primary and follow-up sequences
4. A campaign analytics report showing performance vs objectives with funnel analysis
5. A/B test results that inform the next campaign's creative and targeting decisions
6. A repeatable campaign framework that improves with each iteration

## Edge Cases

- **User has never run a marketing campaign before.** Simplify Step 1 to a single-channel campaign (email or social organic) with a single audience segment. Reduce the analytics in Step 4 to 3-5 key metrics rather than a full funnel analysis. The first campaign is a learning exercise -- perfection is not the goal, data collection is.
- **Campaign is for an internal audience (employee engagement, internal launch).** Replace external marketing channels with internal channels (Slack, email, intranet). The landing page in Step 2 becomes an internal announcement page. Analytics in Step 4 tracks participation and engagement rather than conversion.
- **Campaign has a very short timeline (under 1 week).** Combine Steps 1 and 2 into a single day. Skip Step 5 (A/B testing requires time for statistical significance). Focus on executing Steps 3-4 cleanly and documenting learnings for the next campaign.
- **Campaign targets existing customers, not new prospects.** Adjust Step 2 copy to reference the existing relationship and past value delivered. The messaging in Step 1 shifts from "why us" to "what is new" or "why upgrade." Email segmentation in Step 3 should use purchase history and engagement data for personalization.
- **Campaign runs simultaneously in multiple markets or languages.** Create separate landing pages (Step 2) and email sequences (Step 3) per market. The campaign strategy (Step 1) should be unified, but execution adapts to local market conventions, language, and cultural context. Measure analytics (Step 4) both globally and per-market.
- **Budget is entirely in-kind (partnerships, sponsorships, cross-promotions).** Replace paid channel planning in Step 1 with partnership value exchange planning. Each partner relationship should have a clear deliverable (what you provide, what they provide, what the audience receives). Track partner channel performance separately in Step 4.

## Example

**Input:** "We sell an online project management course for freelancers. We want to run a campaign for our spring enrollment period. Budget is $2,000, campaign runs for 3 weeks, and the goal is 100 new enrollments at $199 each."

**Output:**

## Marketing Campaign: Spring Enrollment Drive

### Campaign Strategy
- **Objective:** 100 new course enrollments ($19,900 revenue) in 3 weeks, at under $20 CPA
- **Target Audience:** Freelance designers and developers, 1-5 years experience, currently struggling with project organization
- **Budget:** $2,000 allocated as [Email: $0 (existing list)], [Social ads: $1,200], [Content promotion: $800]
- **Timeline:** March 3 to March 24
- **Key Message:** "Stop losing freelance clients to missed deadlines" | "The PM system built for how freelancers actually work" | "Enroll now -- spring cohort starts April 1"

### Landing Page
- **Headline:** "Stop Losing Freelance Clients to Missed Deadlines"
- **Primary CTA:** "Enroll in Spring Cohort -- $199"
- **Social Proof:** 3 student testimonials with revenue impact metrics, completion rate badge (87% completion), freelancer community logos
- **Message Match Check:** Confirmed -- ad copy and email subject lines reference "missed deadlines" and "freelance PM"

### Email Campaign
- **Primary Email:**
  - Subject: "The freelance project system I wish I had 3 years ago"
  - Send Date: March 3, 10:00 AM
  - Segment: Full email list (2,400 subscribers), freelancer tag
- **Follow-up Sequence:**
  | Email | Trigger              | Subject Line                         | Angle           | Send Date |
  |-------|----------------------|--------------------------------------|-----------------|-----------|
  | FU-1  | Non-opener (48hr)    | "Spring cohort: 23 spots left"       | Scarcity        | Mar 5     |
  | FU-2  | Opener, no convert   | "How Sarah went from chaos to $8K months" | Case study   | Mar 10    |
  | FU-3  | Final reminder       | "Last week: spring enrollment closes Friday" | Deadline   | Mar 19    |

### Campaign Analytics (End of Week 2)
- **Objective Status:** On track -- 67 enrollments (67% of target with 1 week remaining)
- **Funnel Performance:**
  | Stage           | Volume  | Rate    | Benchmark |
  |-----------------|---------|---------|-----------|
  | Email sends     | 2,400   | --      | --        |
  | Email opens     | 864     | 36%     | 25%       |
  | Clicks to LP    | 312     | 36%     | 15%       |
  | LP conversions  | 42      | 13.5%  | 8%        |
  | Social ad clicks| 1,840   | 2.1%   | 1.5%      |
  | Social LP conv  | 25      | 1.4%   | 1.0%      |
- **Best Segment:** Email list, freelance designers (18% conversion from open)
- **Cost:** CPL $8.20, CPA $14.90, ROAS 9.9x
- **Bottleneck:** Social ad to landing page conversion (1.4% vs 13.5% from email)

### A/B Tests
| Test | Variable         | Control               | Variant                    | Hypothesis                   | Result    |
|------|-----------------|------------------------|----------------------------|-------------------------------|-----------|
| 1    | Social ad CTA   | "Learn More"           | "See the Curriculum"       | Specificity increases CTR 20% | +27% CTR |
| 2    | LP headline     | "Stop Losing Clients"  | "The Freelancer PM System" | Benefit beats feature         | Control wins by 15% |
