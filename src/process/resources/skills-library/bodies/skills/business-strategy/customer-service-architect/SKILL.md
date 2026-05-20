---
name: customer-service-architect
description: |
  Complete customer service system design covering support channel strategy, response template libraries, escalation frameworks, service level agreements, customer satisfaction metrics, team training programs, complaint resolution workflows, and building a service culture that drives retention and referrals. Use when the user asks about customer service architect or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy planning template"
  category: "business-strategy"
  subcategory: "operations"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Customer Service Architect

## When to Use

**Use this skill when:**
- The user needs to design or restructure a customer service system with channel strategy and escalation frameworks
- The user wants help creating response template libraries, SLAs, or complaint resolution workflows
- The user needs customer satisfaction metrics, team training programs, or service culture frameworks
- The user wants to build a support operation that drives retention and referrals

**Do NOT use this skill when:**
- The user needs help with sales or marketing rather than post-sale support (use relevant business skill)
- The user wants general business planning (use business-planner instead)
- The user is designing a product UX rather than a service experience

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to customer service architect.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on customer service architect
- User asks about customer service architect best practices or techniques
- User wants a structured approach to customer service architect

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of customer service architect

You are a customer service systems designer who builds support operations that scale. You understand that customer service is not a cost center -- it is a retention engine, a feedback channel, and a brand differentiator. You help businesses move from reactive, inconsistent support to proactive, systematic service that delights customers and generates loyalty.

## Questions to Ask First

1. What type of business are you running? (E-commerce, SaaS, services, retail, B2B)
2. How many customer interactions do you handle per week?
3. What channels do customers use to reach you? (Email, phone, chat, social, in-person)
4. Who currently handles support? (You, employees, contractors, nobody)
5. What are your most common customer issues?
6. What is your average response time currently?
7. Do you have any response templates or documented processes?
8. What tools are you using for support? (Inbox, helpdesk software, nothing)
9. What is your customer satisfaction score or NPS? (If you track it)
10. What is the biggest customer service problem you want to solve?

## Support Channel Strategy

### Channel Selection Framework
```
EMAIL SUPPORT:
  Best for: Detailed issues, documentation, non-urgent requests
  Response time target: 4-24 hours
  Pros: Asynchronous, creates a record, allows thoughtful responses
  Cons: Slow, impersonal, back-and-forth delays
  Staff requirement: 1 agent per 30-50 tickets/day

LIVE CHAT:
  Best for: Quick questions, pre-sales inquiries, real-time troubleshooting
  Response time target: Under 60 seconds
  Pros: Immediate, high satisfaction, agents can handle 2-3 simultaneous chats
  Cons: Requires real-time staffing, customer expectations for instant response
  Staff requirement: 1 agent per 2-3 concurrent chats

PHONE SUPPORT:
  Best for: Complex issues, emotional situations, high-value customers
  Response time target: Under 2 minutes wait time
  Pros: Personal, builds trust, resolves complex issues faster
  Cons: Expensive, hard to scale, no written record without logging
  Staff requirement: 1 agent per call, 15-20 calls/day average

SOCIAL MEDIA:
  Best for: Public-facing issues, brand reputation, quick acknowledgments
  Response time target: Under 2 hours (public), under 1 hour (DMs)
  Pros: Public resolution builds trust, reaches customers where they are
  Cons: Public nature means mistakes are visible, trolls, 24/7 monitoring
  Staff requirement: Dedicated social support or shared with marketing

SELF-SERVICE (knowledge base, FAQ):
  Best for: Common questions, how-to guides, troubleshooting
  Response time: Immediate
  Pros: Scales infinitely, available 24/7, reduces ticket volume
  Cons: Requires creation and maintenance, cannot handle unique issues
  Goal: 30-50% of support inquiries resolved through self-service

CHANNEL STRATEGY BY BUSINESS SIZE:
  Solo / Micro (< 50 tickets/week):
    Email + FAQ page. Add chat when you can staff it.

  Small (50-200 tickets/week):
    Email + Live chat (business hours) + Knowledge base.
    Consider phone for VIP customers.

  Medium (200-1,000 tickets/week):
    All channels. Helpdesk software required.
    Dedicated support team. Tiered support model.
```

### Helpdesk Software Selection
```
SMALL BUSINESS (< 200 tickets/week):
  Freshdesk: Free for up to 2 agents, $15/agent/month for Growth
  Zoho Desk: Free for 3 agents, $14/agent/month for Standard
  Help Scout: $22/user/month, great for email-centric support

GROWING BUSINESS (200-1,000 tickets/week):
  Zendesk: $55/agent/month, industry standard, extensive features
  Intercom: $74/month starter, combines chat + email + AI
  Front: $19/user/month, shared inbox for team collaboration

ESSENTIAL FEATURES:
  - Shared inbox (multiple agents, one customer-facing address)
  - Ticket assignment and routing
  - Response templates (saved replies)
  - Knowledge base (self-service articles)
  - Customer history (previous conversations visible)
  - Reporting (response time, resolution time, satisfaction)
  - Integrations (CRM, e-commerce platform, Slack)
```

## Response Template Library

### Template Design Principles
```
TEMPLATE RULES:
  1. Start with empathy, not policy
     BAD: "Per our return policy, you have 30 days..."
     GOOD: "I am sorry this did not work out. Let me help you..."

  2. Use the customer's name
  3. Acknowledge their specific issue (not generic copy-paste)
  4. Provide clear next steps
  5. End with an offer to help further
  6. Keep templates as starting points, not rigid scripts
     Agents should personalize every response

TEMPLATE STRUCTURE:
  [Greeting + Name]
  [Empathy / Acknowledgment of their issue]
  [Solution or next steps]
  [Additional helpful information]
  [Closing offer to help + Name/Signature]
```

### Essential Templates
```
TEMPLATE 1: ACKNOWLEDGMENT (when you cannot resolve immediately)
  "Hi [Name],

  Thank you for reaching out. I understand you are experiencing
  [specific issue], and I want to make sure we get this resolved
  for you.

  I am looking into this now and will follow up within [timeframe]
  with an update. If anything changes on your end in the meantime,
  just reply to this email.

  [Name], [Title]"

TEMPLATE 2: RESOLUTION
  "Hi [Name],

  Great news -- I have resolved the [issue] for you. Here is what
  I did: [specific action taken].

  You should see [expected result] within [timeframe].

  If you have any other questions or run into anything else,
  do not hesitate to reach out. I am here to help.

  [Name], [Title]"

TEMPLATE 3: REFUND / RETURN
  "Hi [Name],

  I am sorry [product/service] did not meet your expectations.
  I have processed a [full/partial] refund of $[amount] to your
  original payment method.

  You should see this reflected in your account within [3-5/5-7]
  business days, depending on your bank.

  [If return required: Here is how to return the item: [instructions]]

  Is there anything else I can help with?

  [Name], [Title]"

TEMPLATE 4: FEATURE REQUEST / CANNOT DO
  "Hi [Name],

  Thank you for the suggestion about [feature/request]. I can see
  why that would be valuable for you.

  Right now, we are not able to [specific request] because [honest reason].
  However, I have added your feedback to our product roadmap, and our
  team reviews these requests regularly.

  In the meantime, here is an alternative approach that might help:
  [workaround or alternative].

  [Name], [Title]"

TEMPLATE 5: COMPLAINT / ESCALATION
  "Hi [Name],

  I sincerely apologize for [specific issue]. I understand how
  frustrating this must be, and I take your experience seriously.

  Here is what I am doing to fix this:
  1. [Immediate action]
  2. [Follow-up action]
  3. [Prevention measure]

  I would also like to [compensation: credit, discount, upgrade, etc.]
  as a gesture of our commitment to your satisfaction.

  I am personally going to follow up on [date] to make sure everything
  is resolved. If you need anything before then, you can reach me
  directly at [contact].

  [Name], [Title]"
```

## Escalation Framework

### Tiered Support Model
```
TIER 1: FRONTLINE SUPPORT
  Handles: Common questions, known issues, standard procedures
  Skills: Product knowledge, empathy, template usage, basic troubleshooting
  Authority: Refunds up to $[X], standard exchanges, account updates
  Escalation trigger: Issue outside scope, customer requests manager,
  technical issue beyond Tier 1 training, complaint after 2 interactions

TIER 2: SPECIALIST SUPPORT
  Handles: Complex issues, technical problems, non-standard requests
  Skills: Deep product knowledge, technical troubleshooting, judgment calls
  Authority: Refunds up to $[XX], custom solutions, policy exceptions
  Escalation trigger: Requires engineering, legal, or executive involvement

TIER 3: MANAGEMENT / ENGINEERING
  Handles: Critical issues, legal concerns, high-value customer retention
  Skills: Business judgment, technical expertise, crisis management
  Authority: Full authority, budget for retention, policy changes

ESCALATION RULES:
  1. Before escalating, Tier 1 must document:
     - Customer's issue (specific, not vague)
     - Steps already taken
     - Why escalation is needed
  2. Warm handoff: Introduce the customer to the next tier
     "I am going to connect you with [Name] on our specialist team.
     I have filled them in on everything so you do not have to repeat yourself."
  3. Never make the customer explain their problem again.
  4. Escalated tickets have priority in the queue.
  5. Every escalation is a learning opportunity. Track patterns.
     If the same issue escalates repeatedly, fix the root cause or
     train Tier 1 to handle it.
```

## Customer Satisfaction Metrics

### Measuring Service Quality
```
METRIC 1: CUSTOMER SATISFACTION SCORE (CSAT)
  Survey: "How satisfied were you with your support experience?"
  Scale: 1-5 or 1-7
  Calculation: % of responses that are 4-5 (satisfied/very satisfied)
  Target: 85-95%
  When to send: Immediately after ticket resolution

METRIC 2: NET PROMOTER SCORE (NPS)
  Survey: "How likely are you to recommend us to a friend? (0-10)"
  Calculation: % Promoters (9-10) minus % Detractors (0-6)
  Target: +30 to +70 (varies by industry)
  When to send: Periodically (quarterly) to overall customer base

METRIC 3: CUSTOMER EFFORT SCORE (CES)
  Survey: "How easy was it to get your issue resolved? (1-7)"
  Calculation: Average score
  Target: 6+ out of 7
  Why: CES is the best predictor of future loyalty.
  Low-effort experiences create loyal customers.

METRIC 4: FIRST CONTACT RESOLUTION (FCR)
  Definition: % of issues resolved in a single interaction
  Target: 70-80%
  Why: Every additional contact doubles customer frustration.

METRIC 5: RESPONSE AND RESOLUTION TIME
  First response time: Time from ticket creation to first reply
  Resolution time: Time from ticket creation to issue resolved
  Targets (vary by channel):
    Email: First response < 4 hours, resolution < 24 hours
    Chat: First response < 60 seconds, resolution < 15 minutes
    Phone: Wait time < 2 minutes, resolution during the call

MONTHLY SERVICE REPORT:
  Total tickets: [X]
  Tickets by channel: Email [X] | Chat [X] | Phone [X] | Social [X]
  Average first response time: [X]
  Average resolution time: [X]
  First contact resolution rate: [X]%
  CSAT score: [X]%
  Top 5 issue categories: [list with counts]
  Escalation rate: [X]%
  Self-service deflection rate: [X]%
```

## Team Training

### Training Program Design
```
WEEK 1: FOUNDATIONS
  Day 1-2: Product knowledge (deep dive into what you sell)
  Day 3: Tools training (helpdesk, CRM, knowledge base)
  Day 4: Communication skills (empathy, tone, de-escalation)
  Day 5: Template review and practice responses

WEEK 2: PRACTICE
  Day 1-3: Shadow experienced agents (listen and observe)
  Day 4-5: Handle tickets with supervision (reviewed before sending)

WEEK 3-4: RAMP
  Handle tickets independently with spot-check reviews.
  Daily check-in with mentor or manager.
  QA review of 100% of tickets in week 3, 50% in week 4.

ONGOING:
  Weekly team meeting: Share difficult cases, discuss solutions
  Monthly QA: Review random sample of each agent's tickets
  Quarterly: New product training, process updates, skill development

QA SCORECARD (rate each ticket 1-5):
  Accuracy: Was the answer correct?
  Completeness: Were all questions addressed?
  Tone: Was the response empathetic and professional?
  Efficiency: Was the issue resolved without unnecessary back-and-forth?
  Policy adherence: Were procedures followed correctly?
```

## Output Checklist

- [ ] Support channels selected based on business size and customer preferences
- [ ] Helpdesk software selected and configured
- [ ] Response template library created for top 10 issue types
- [ ] Escalation framework documented with tiers, authority levels, and handoff process
- [ ] Service level agreements defined (response time, resolution time per channel)
- [ ] Customer satisfaction measurement in place (CSAT, NPS, or CES)
- [ ] Knowledge base created with articles for top 20 common questions
- [ ] Team training program designed with onboarding and ongoing development
- [ ] Monthly service report template built with key metrics
- [ ] QA process established for ongoing quality assurance


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Customer Service Architect deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with customer service architect for a mid-size project."

**Output:** A complete customer service architect framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
