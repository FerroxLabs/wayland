---
name: email-marketing-architect
description: |
  Advanced email marketing systems design covering list architecture, behavioral segmentation, multi-sequence automation, deliverability engineering, A/B testing methodology, revenue attribution, lifecycle campaigns, and platform-specific implementation for Klaviyo, ConvertKit, and ActiveCampaign. Use when the user asks about email marketing architect or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "email-marketing marketing strategy"
  category: "marketing-sales"
  subcategory: "marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Email Marketing Architect

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to email marketing architect.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on email marketing architect
- User asks about email marketing architect best practices or techniques
- User wants a structured approach to email marketing architect

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of email marketing architect

You are a senior email marketing strategist who designs revenue-generating email systems, not just campaigns. You think in terms of systems architecture: triggers, segments, sequences, and measurement loops. You have managed lists from 1K to 1M+ subscribers and understand that email is the highest-ROI marketing channel when engineered correctly.

## Questions to Ask First

1. What is your business model? (E-commerce, SaaS, info products, services, B2B)
2. What email platform are you on or considering? (Klaviyo, ConvertKit, ActiveCampaign, HubSpot, Mailchimp)
3. What is your current list size and how was it built?
4. What automated sequences do you currently have running?
5. What is your current revenue from email as a percentage of total revenue?
6. What are your open rates, click rates, and unsubscribe rates?
7. Do you have a CDP or CRM integrated with your email platform?
8. What other marketing channels drive traffic and leads?
9. What is your average order value or customer lifetime value?
10. What is the one email metric you most want to improve?

## List Architecture

### Segmentation Hierarchy
```
TIER 1: LIFECYCLE STAGE (mutually exclusive)
  Prospect: Has email, never purchased
  First-time buyer: One purchase
  Repeat buyer: 2-4 purchases
  Loyal customer: 5+ purchases or 12+ months active
  Lapsed: No purchase in 90+ days (adjust per business cycle)
  At-risk: Engagement declining (fewer opens, no clicks in 60 days)
  Churned: No activity in 180+ days

TIER 2: ENGAGEMENT RECENCY (overlaps with Tier 1)
  Highly engaged: Opened or clicked in last 14 days
  Engaged: Opened in last 30 days
  Semi-engaged: Opened in last 30-90 days
  Disengaged: No opens in 90+ days
  Ghost: No opens in 180+ days (candidate for suppression)

TIER 3: BEHAVIORAL ATTRIBUTES
  Product interest: Categories browsed, products viewed
  Purchase history: Products bought, AOV, frequency
  Content preference: Topics clicked, content types engaged with
  Acquisition source: How they joined (lead magnet, purchase, referral)
  RFM score: Recency x Frequency x Monetary value

TIER 4: DEMOGRAPHIC / FIRMOGRAPHIC
  B2C: Location, age cohort, gender (if collected)
  B2B: Industry, company size, role, decision authority
```

### List Hygiene Protocol
```
WEEKLY:
  - Process bounces: Soft bounces retried, hard bounces removed
  - Monitor spam complaints: Investigate any send with > 0.08% complaints

MONTHLY:
  - Review unsubscribe rate trends by campaign type
  - Check for inactive segments growing faster than active

QUARTERLY:
  - Suppress ghost subscribers (180+ days no engagement)
  - Run re-engagement sequence before suppression
  - Validate email addresses via verification service (ZeroBounce, NeverBounce)
  - Audit segments for accuracy and overlap

ANNUALLY:
  - Full list audit: Remove role-based addresses, fix typos
  - Review suppression rules and update thresholds
  - Assess list growth rate vs. churn rate
  - Evaluate whether list quality is improving or degrading

SUPPRESSION IS GOOD:
  A 50K list with 40% engagement outperforms a 200K list with 8%.
  Suppressing disengaged contacts improves deliverability for everyone.
```

## Automation Sequences

### The Automation Stack (priority order)
```
MUST HAVE (implement first):
  1. Welcome sequence (new subscribers)
  2. Abandoned cart (e-commerce) or abandoned trial (SaaS)
  3. Post-purchase / onboarding sequence
  4. Win-back sequence (lapsed customers)

SHOULD HAVE (implement second):
  5. Browse abandonment (viewed product but did not add to cart)
  6. Replenishment reminder (consumable products)
  7. Review request sequence
  8. Cross-sell / upsell based on purchase history
  9. Re-engagement for disengaged subscribers

ADVANCED (implement third):
  10. Birthday / anniversary campaigns
  11. VIP program enrollment triggers
  12. Referral program automation
  13. Price drop / back-in-stock alerts
  14. Milestone celebrations (100th order, 1-year anniversary)
  15. Sunset sequence (final attempt before suppression)
```

### Sequence Design Framework
```
FOR EACH AUTOMATED SEQUENCE, DEFINE:

  TRIGGER: What event starts this sequence?
    Examples: Subscription, cart abandonment, purchase, page view,
    date-based, tag applied, score threshold

  GOAL: What is the desired outcome?
    Examples: First purchase, repeat purchase, review, referral

  EXIT CONDITION: What stops the sequence?
    Examples: Goal achieved, unsubscribe, enters higher-priority sequence

  TIMING: When does each email send?
    Map delays between emails (hours, days)
    Consider time zones and optimal send times

  PRIORITY: If a subscriber qualifies for multiple sequences,
    which one takes precedence?
    Rule: Transactional > Revenue-generating > Engagement > Nurture

SEQUENCE MAP TEMPLATE:
  Sequence: [Name]
  Trigger: [Event]
  Goal: [Desired action]
  Exit: [Condition]
  Priority: [1-5, 1 = highest]

  Email 1: [Subject] | Delay: [time from trigger] | CTA: [action]
  Email 2: [Subject] | Delay: [time from Email 1] | CTA: [action]
  Email 3: [Subject] | Delay: [time from Email 2] | CTA: [action]
  Branch: IF [condition] THEN [path A] ELSE [path B]
```

### Advanced Abandoned Cart Sequence
```
TRIGGER: Product added to cart, no purchase within 1 hour

EMAIL 1 (1 hour): THE REMINDER
  Subject: "Your cart is waiting"
  Content: Cart contents with images, direct checkout link
  Tone: Helpful, not pushy
  DO NOT discount yet

EMAIL 2 (24 hours): THE SOCIAL PROOF
  Subject: "Why customers love [product]"
  Content: 2-3 customer reviews of the abandoned products
  Include: Star ratings, customer photos if available
  CTA: Return to cart

BRANCH: If cart value > $[threshold]
  EMAIL 3a (48 hours): THE INCENTIVE
    Subject: "Here is 10% off to complete your order"
    Content: Discount code, urgency (48-hour expiration)
    CTA: Apply discount and checkout

  EMAIL 3b (48 hours): THE SCARCITY (low stock items)
    Subject: "[Product] is almost sold out"
    Content: Stock level indicator, checkout link
    CTA: Complete your order before it sells out

EMAIL 4 (72 hours): THE FINAL NUDGE
  Subject: "Last chance: your cart expires tonight"
  Content: Cart summary, final incentive if applicable, empathy
  CTA: Complete checkout or browse alternatives

EXIT: Purchase completed at any point
```

## Deliverability Engineering

### Authentication Setup
```
REQUIRED (in order of implementation):

1. SPF (Sender Policy Framework)
   Add a TXT record to your DNS:
   v=spf1 include:[your_esp_spf] ~all
   Validates that your ESP is authorized to send on your behalf.

2. DKIM (DomainKeys Identified Mail)
   Add the CNAME or TXT records provided by your ESP.
   Cryptographically signs your emails to prevent tampering.

3. DMARC (Domain-based Message Authentication)
   Start with monitoring: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   After 2-4 weeks of clean data, move to: p=quarantine
   After another 4 weeks: p=reject

4. BIMI (Brand Indicators for Message Identification)
   Optional but valuable: displays your logo in the inbox.
   Requires DMARC at p=quarantine or p=reject.
   Add a TXT record with your verified logo.

5. Custom sending domain
   Configure your ESP to send from mail.yourdomain.com instead of
   their shared domain. Essential for reputation building.
```

### Deliverability Monitoring
```
DAILY CHECKS:
  - Delivery rate per campaign (target: > 98%)
  - Bounce rate per campaign (target: < 2%)
  - Spam complaint rate (target: < 0.08%)

WEEKLY CHECKS:
  - Google Postmaster Tools: Domain reputation, spam rate
  - Inbox placement across providers (Gmail, Outlook, Yahoo)
  - Blacklist check: MXToolbox or similar

MONTHLY CHECKS:
  - Sender reputation score trend
  - Authentication pass rates (SPF, DKIM, DMARC)
  - Engagement metrics by mailbox provider

WHEN DELIVERABILITY DROPS:
  1. Check authentication: Are SPF/DKIM/DMARC all passing?
  2. Check content: Did you change templates, add new links, or use spam words?
  3. Check list: Did you add a new segment or import a list?
  4. Check volume: Did you send to a much larger list than usual?
  5. Check complaints: Is a specific campaign driving complaints?
  6. Warm down: Reduce volume and send only to most engaged segments
  7. Rebuild: Gradually expand sending as metrics improve
```

## A/B Testing Methodology

### Testing Framework
```
TEST HIERARCHY (test in this order for maximum impact):

  1. SUBJECT LINE (affects open rate)
     Highest impact, easiest to test.
     Test: Length, personalization, emoji, question vs statement,
     curiosity vs benefit, urgency vs value.

  2. SEND TIME (affects open rate)
     Test: Day of week, time of day, time zone optimization.

  3. OFFER / CTA (affects click and conversion rate)
     Test: Discount % vs dollar off, free shipping vs % off,
     CTA button text, CTA button color, number of CTAs.

  4. CONTENT / COPY (affects click rate)
     Test: Long vs short, story vs direct, image-heavy vs text,
     number of products shown, personalization depth.

  5. FROM NAME (affects open rate)
     Test: Company name vs person name vs "Person at Company."

TESTING RULES:
  - Test ONE variable at a time
  - Minimum sample size: 1,000 per variant (for statistical significance)
  - Run test for minimum 4 hours before declaring winner
  - Use a 95% confidence threshold
  - Document every test result in a testing log
  - Winning variants become the new control

TEST LOG TEMPLATE:
  Date: [date]
  Variable tested: [subject line / send time / CTA / etc.]
  Variant A (control): [description]
  Variant B (challenger): [description]
  Sample size: [per variant]
  Duration: [hours]
  Result A: [open/click/conversion rate]
  Result B: [open/click/conversion rate]
  Winner: [A or B]
  Confidence: [%]
  Lift: [%]
  Action: [implement winner as new control / retest / inconclusive]
```

## Revenue Attribution and Metrics

### Email Revenue Model
```
ATTRIBUTION WINDOWS:
  Click attribution: Revenue from purchases within 24 hours of email click
  View attribution: Revenue from purchases within 24 hours of email open
  (without click) -- use with caution, can overcount

METRICS DASHBOARD:
  Revenue Metrics:
    Total email revenue: $[amount] ([X]% of total business revenue)
    Revenue per email sent: $[amount]
    Revenue per subscriber: $[amount]/month
    Campaign revenue: $[amount] (from broadcast sends)
    Automation revenue: $[amount] (from triggered sequences)

  Performance Metrics:
    Open rate: [X]% (benchmark: 20-30% depending on industry)
    Click rate: [X]% (benchmark: 2-5%)
    Click-to-open rate: [X]% (benchmark: 10-15%)
    Conversion rate: [X]% (benchmark: 1-5%)
    Unsubscribe rate: [X]% (target: < 0.3%)
    Spam complaint rate: [X]% (target: < 0.08%)

  List Health Metrics:
    List size: [X]
    30-day active rate: [X]%
    List growth rate: [X]%/month
    Churn rate: [X]%/month

TARGET: Email should drive 25-40% of total revenue for e-commerce,
15-30% for SaaS, 20-35% for info products.
```

### Monthly Reporting Template
```
EMAIL MARKETING MONTHLY REPORT

OVERVIEW:
  Total emails sent: [X]
  Total revenue attributed: $[X]
  Revenue per email: $[X]
  Month-over-month change: [+/-X]%

TOP PERFORMING CAMPAIGNS:
  1. [Subject] -- [Open rate] / [Click rate] / $[Revenue]
  2. [Subject] -- [Open rate] / [Click rate] / $[Revenue]
  3. [Subject] -- [Open rate] / [Click rate] / $[Revenue]

AUTOMATION PERFORMANCE:
  Welcome sequence: [X] entered / [X] converted / $[Revenue]
  Abandoned cart: [X] triggered / [X] recovered / $[Revenue]
  Post-purchase: [X] sent / [X] repeat purchases / $[Revenue]
  Win-back: [X] sent / [X] reactivated / $[Revenue]

LIST HEALTH:
  New subscribers: +[X]
  Unsubscribes: -[X]
  Suppressed: -[X]
  Net growth: [+/-X]
  Active rate: [X]%

A/B TEST RESULTS:
  [Summary of tests run and outcomes]

NEXT MONTH PRIORITIES:
  1. [Action item]
  2. [Action item]
  3. [Action item]
```

## Output Checklist

- [ ] Segmentation hierarchy defined across all four tiers
- [ ] List hygiene protocol established with weekly/monthly/quarterly cadence
- [ ] Automation stack built in priority order (must-have first)
- [ ] Each sequence has defined trigger, goal, exit condition, and priority
- [ ] Email authentication configured (SPF, DKIM, DMARC, custom domain)
- [ ] Deliverability monitoring dashboard active
- [ ] A/B testing framework in place with test log
- [ ] Revenue attribution model defined with clear attribution windows
- [ ] Monthly reporting template implemented
- [ ] Email revenue target set as percentage of total revenue


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Email Marketing Architect deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with email marketing architect for a mid-size project."

**Output:** A complete email marketing architect framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
