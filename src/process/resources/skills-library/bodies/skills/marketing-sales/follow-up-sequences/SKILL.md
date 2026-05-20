---
name: follow-up-sequences
description: |
  Produces post-meeting, post-demo, and post-proposal follow-up email
  sequences that advance deals through the sales pipeline using sales
  cadence methodology. Use when the user asks to create follow-up emails
  after a sales meeting, write post-demo follow-up sequences, build
  post-proposal nurture emails, or design email sequences that keep
  deals moving forward.
  Do NOT use for cold outreach to new prospects (use cold-outreach-sequence),
  customer onboarding emails (use cs-handoff-document), or marketing
  email campaigns to subscribers (use email-campaign).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sales email template planning"
  category: "marketing-sales"
  subcategory: "sales"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Follow-Up Email Sequences

## When to Use

- User asks to create follow-up emails after a sales meeting or call
- User wants to write post-demo follow-up sequences to advance a deal
- User needs post-proposal emails that nudge the prospect toward a decision
- User asks to build email sequences for different stages of the sales pipeline
- User wants to design follow-up cadences that keep deals from stalling
- Do NOT use when: user needs cold outreach to new prospects (use `cold-outreach-sequence`), post-sale onboarding emails (use `cs-handoff-document`), or marketing email campaigns (use `email-campaign`)

## Process

1. **Collect follow-up context.** Before producing the sequences, gather:
   - Product or service being sold
   - Target buyer profile (title, company type)
   - Which sales stage the follow-up addresses (post-discovery, post-demo, post-proposal)
   - Average deal cycle length
   - Key stakeholders involved in the decision
   - Common reasons deals stall at this stage
   - Materials available to share (case studies, ROI calculators, testimonials)

2. **Design the post-discovery follow-up.** After a first call:
   - **Email 1 (same day):** Recap the conversation, confirm next steps
   - **Email 2 (day 2-3):** Share a relevant resource tied to their stated pain
   - **Email 3 (day 5-7):** Check in on the agreed next step
   - Purpose: reinforce the conversation and maintain momentum

3. **Design the post-demo follow-up.** After a product demonstration:
   - **Email 1 (same day):** Recap what was shown, highlight the moment that resonated most
   - **Email 2 (day 2-3):** Send a case study from a similar company
   - **Email 3 (day 5):** Address the primary concern raised during the demo
   - **Email 4 (day 7-10):** Propose next step (proposal, trial, technical review)
   - Purpose: address concerns and build confidence in the solution

4. **Design the post-proposal follow-up.** After sending a proposal:
   - **Email 1 (day 1-2):** Confirm receipt and offer to walk through the proposal
   - **Email 2 (day 4-5):** Share a proof point relevant to their biggest concern
   - **Email 3 (day 7):** Ask if there are questions or if additional stakeholders need information
   - **Email 4 (day 10-14):** Create gentle urgency (proposal validity, implementation timeline)
   - **Email 5 (day 21):** Direct ask for a decision or honest "not now"
   - Purpose: guide the prospect toward a decision without pressuring

5. **Write each email.** For every email in every sequence:
   - Subject line referencing the previous interaction or their specific situation
   - Opening that connects to something they said or showed interest in
   - Body focused on one idea (resource, proof point, question, or next step)
   - Single clear CTA that advances the conversation
   - Under 100 words per email

6. **Define cadence rules.** For each sequence:
   - When to stop (reply received, meeting booked, deal closed)
   - When to escalate (engagement without reply -- opens but no response)
   - When to pause (out of office, holiday period, prospect asked for time)
   - When to re-engage (trigger event, new quarter, budget cycle)

## Output Format

```
## Follow-Up Sequences: [Product/Service]

**Target Buyer:** [Title at company type]
**Sales Cycle:** [Average length]
**Date:** [Date]

---

### Sequence 1: Post-Discovery Follow-Up

**Trigger:** After a completed discovery call
**Goal:** Secure the next meeting (demo, technical review, proposal)
**Emails:** 3 over 7 days

---

**Email 1: Same-Day Recap**
**Subject:** [Reference to their conversation]
**Send:** Within 2 hours of the call

Hi [Name],

[Recap sentence referencing what they shared about their challenge.]

[Confirm the agreed next step with specific date/time.]

[Attach or link to any materials promised during the call.]

[Signature]

**Word count target:** 60-80 words

---

**Email 2: Resource Share (Day 2-3)**
**Subject:** [Resource tied to their stated pain]

Hi [Name],

[One sentence connecting to their specific challenge.]

[Brief description of the resource and why it is relevant to their situation.]

[Low-pressure CTA: "Thought this might be useful as you evaluate options."]

[Signature]

**Word count target:** 50-70 words

---

**Email 3: Next Step Check-In (Day 5-7)**
**Subject:** [Reference to the agreed next step]

Hi [Name],

[One sentence checking on the agreed next step.]

[Offer flexibility: "If timing has shifted, happy to adjust."]

[Specific CTA: suggest 2-3 times for the next meeting.]

[Signature]

**Word count target:** 40-60 words

---

### Sequence 2: Post-Demo Follow-Up

**Trigger:** After a completed product demo
**Goal:** Address concerns and advance to proposal or trial
**Emails:** 4 over 10 days

---

**Email 1: Same-Day Demo Recap**
**Subject:** [Reference to the demo highlight]
**Send:** Within 2 hours of the demo

[Recap the demo, highlight the feature or moment that resonated most.]

[Confirm next steps discussed at end of demo.]

**Word count target:** 70-90 words

---

**Email 2: Case Study (Day 2-3)**
**Subject:** [Similar company's result]

[Share a case study from a company similar to the prospect's.]

[Connect their stated challenge to the case study outcome.]

**Word count target:** 60-80 words

---

**Email 3: Concern Addresser (Day 5)**
**Subject:** [Address their primary objection or concern]

[Reference the concern raised during the demo.]

[Provide specific information, data, or example that addresses it.]

**Word count target:** 60-80 words

---

**Email 4: Next Step Proposal (Day 7-10)**
**Subject:** [Advancing the conversation]

[Propose the specific next step: proposal, trial, technical review.]

[Explain what the next step involves and what they will get from it.]

**Word count target:** 50-70 words

---

### Sequence 3: Post-Proposal Follow-Up

**Trigger:** After sending a formal proposal
**Goal:** Guide the prospect to a decision
**Emails:** 5 over 21 days

---

**Email 1: Proposal Walk-Through Offer (Day 1-2)**
**Subject:** [Proposal reference]

[Confirm they received the proposal.]

[Offer to walk through it together.]

**Word count target:** 40-60 words

---

**Email 2: Proof Point (Day 4-5)**
**Subject:** [Relevant result from a similar customer]

[Share a specific data point or testimonial related to their biggest concern.]

**Word count target:** 50-70 words

---

**Email 3: Stakeholder Check (Day 7)**
**Subject:** [Questions or stakeholder needs]

[Ask if other stakeholders need information or a separate conversation.]

**Word count target:** 40-60 words

---

**Email 4: Gentle Urgency (Day 10-14)**
**Subject:** [Timeline or implementation reference]

[Reference the proposal validity date or implementation timeline.]

[Create gentle urgency without pressure.]

**Word count target:** 50-70 words

---

**Email 5: Decision Ask (Day 21)**
**Subject:** [Direct and respectful]

[Direct ask for a decision: yes, no, or not now.]

[Respect their time -- make it easy to say any of the three.]

**Word count target:** 40-50 words

---

### Cadence Rules

| Sequence | Stop When | Escalate When | Pause When | Re-engage When |
|----------|-----------|---------------|------------|----------------|
| Post-Discovery | Reply or meeting booked | 3+ opens, no reply -- call | Out of office | New trigger event |
| Post-Demo | Reply or next step agreed | Proposal opened but no reply -- call | Asked for more time | New feature or case study |
| Post-Proposal | Decision made (any) | Proposal viewed 3+ times -- call | Holiday or budget freeze | New quarter or budget cycle |
```

## Rules

1. NEVER produce follow-up sequences without first collecting the sales stage, buyer profile, and deal context
2. Every email must be under 100 words -- follow-ups that read like proposals are ignored
3. Each email in a sequence must have a different purpose -- do not repeat the same ask
4. The first follow-up after any meeting must be sent within 2 hours, not "later today"
5. Every email must reference something specific from the previous interaction -- no generic "checking in"
6. CTAs must be specific and low-friction: "reply with a time" not "let me know your thoughts"
7. The post-proposal decision ask (final email) must make it easy to say "no" or "not now" -- respect beats persistence
8. Include cadence rules for when to stop, escalate, pause, and re-engage for each sequence
9. Subject lines must reference the prospect's situation or previous conversation, not generic follow-up language
10. NEVER use guilt, artificial scarcity, or pressure tactics in follow-up emails

## Edge Cases

- **Multi-threaded deal (multiple stakeholders):** Create follow-up variants for each stakeholder. The technical evaluator gets different content than the economic buyer. Include a sequence for the champion to use internally (email they can forward to their boss with your key points).
- **Prospect went dark (no response to any emails):** After the final email in a sequence, move to a long-term nurture cadence (monthly value-add, no ask). Re-engage when a trigger event occurs (new funding, leadership change, competitor news). Do not keep sending follow-ups into silence.
- **Very fast sales cycle (under 1 week):** Compress all sequences to 1-2 emails each. Combine post-demo recap with proposal delivery. The post-proposal sequence becomes same-day and next-day only. Speed matters more than sequence completeness.
- **Prospect said "not now, follow up in Q2":** Create a single nurture email per month leading up to Q2 with relevant content (no pitch). Re-initiate the post-proposal sequence when Q2 arrives, referencing the previous conversation and what has changed since then.
- **Deal involves a formal procurement process:** Follow-up content shifts to procurement support: ROI documentation for the business case, security questionnaire completion, reference customer contacts. The cadence follows the procurement timeline, not the sales timeline.

## Example

**Input:** "Create follow-up sequences for our project management SaaS. We sell to marketing managers at mid-size companies. Average deal is $15K/year, 3-4 week cycle. Main concern after demos is team adoption."

**Output:**

## Follow-Up Sequences: [Product] Project Management

**Target Buyer:** Marketing Manager at mid-size companies (50-500 employees)
**Sales Cycle:** 3-4 weeks
**Date:** [Current date]

---

### Sequence 2: Post-Demo Follow-Up

**Email 1: Same-Day Demo Recap**
**Subject:** Your team's workflow in [Product]

Hi [Name],

Thanks for walking me through how your marketing team manages campaigns today. The moment that stood out was when you saw how [Product] maps to your existing sprint process -- you mentioned that was the first tool that did not force your team to change how they work.

As discussed, I will send over a proposal by [date]. In the meantime, here is the recording of your personalized demo.

[Signature]

**Word count:** 68 words

---

**Email 3: Concern Addresser (Day 5)**
**Subject:** How [Customer Name]'s team went from 20% to 90% adoption

Hi [Name],

You mentioned adoption was your biggest concern -- your team has tried tools before and stopped using them within a month.

[Customer Name]'s marketing team had the same experience. They failed with two previous tools before [Product]. The difference: we configured [Product] to match their existing workflow instead of asking them to learn a new one. They hit 90% adoption in 3 weeks.

Happy to connect you with their marketing director if that would be helpful.

[Signature]

**Word count:** 82 words
