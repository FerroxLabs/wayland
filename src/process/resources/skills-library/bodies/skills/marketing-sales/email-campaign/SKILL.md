---
name: email-campaign
description: |
  Produces a completed email marketing sequence of 3-5 emails with subject
  lines, body copy, CTAs, and send timing using drip sequence design
  principles. Use when the user asks to create an email campaign, design a
  drip sequence, write a welcome series, build a nurture sequence, or plan
  automated email flows.
  Do NOT use for single professional email writing (use professional-email
  in writing), full campaign planning across channels (use campaign-planning),
  or cold outreach sales emails (use cold-outreach-sequence).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "marketing email planning template"
  category: "marketing-sales"
  subcategory: "marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Email Campaign

## When to Use

Use this skill when the user needs a complete multi-email sequence designed to move a reader through a defined journey -- from enrollment trigger to conversion outcome. Specific triggers include:

- User asks to create a welcome series for new subscribers, trial users, or new customers
- User wants a nurture sequence that educates leads and moves them toward a purchase decision
- User needs a re-engagement campaign for subscribers who have gone cold (no opens in 60-90+ days)
- User wants a post-purchase sequence (onboarding, upsell, review request, replenishment)
- User asks to write a drip sequence tied to a specific event (webinar registration, lead magnet download, abandoned cart, free trial signup)
- User needs promotional campaign emails for a launch, sale, or limited-time offer (3-7 email burst)
- User wants a course or challenge sequence delivered over a fixed number of days (email-based curriculum)

**Do NOT use this skill when:**

- User needs a single standalone marketing email -- use `professional-email` instead
- User is planning a multi-channel campaign across email, paid ads, social, and SMS -- use `campaign-planning` first, then return here for the email component
- User needs cold outreach emails to prospects who have never opted in -- use `cold-outreach-sequence` instead
- User needs a transactional email (order confirmation, password reset, account notification) -- these follow different deliverability and legal rules than marketing sequences
- User is writing a newsletter or editorial email that is not part of a sequence -- use `newsletter-writing` if available
- User needs email strategy (segmentation, list health, deliverability audit) without actual copy -- this skill produces copy, not strategy documents

---

## Process

### Step 1: Collect Campaign Context Before Writing Anything

Do not begin drafting until you have answers to the following. If the user has not provided them, ask in a single consolidated question block rather than one question at a time.

- **Campaign goal:** What is the single most important outcome this sequence must achieve? (e.g., activate trial users to run their first report, convert subscribers to a $97 course, recover lapsed customers with a discount)
- **Audience relationship:** Where is the reader in the customer journey? New subscriber who has never bought? Trial user on day 3 of 14? Customer who bought 6 months ago and has not returned? This determines tone, trust level, and the amount of context needed.
- **Sequence type:** Welcome, nurture, re-engagement, post-purchase, promotional, onboarding, event-follow-up, or hybrid
- **Number of emails:** Default to 4-5 unless the user specifies. Fewer than 3 rarely completes a meaningful arc; more than 7 risks fatigue unless the reader opted into a course or challenge.
- **Primary CTA:** What is the ONE action that defines success for this sequence? Every email either drives toward it or builds the conditions for it.
- **Brand voice:** Ask for 3 adjectives or a reference point (e.g., "like a knowledgeable friend, not a salesperson" or "professional but warm")
- **Product/offer details:** Price point, category, key benefits, and any objections the audience typically raises
- **Existing performance data:** If the user has open rates, click rates, or conversion rates from previous sequences, use these to calibrate targets. Industry benchmarks by vertical are provided in Step 6.

---

### Step 2: Choose the Sequence Architecture

Different sequence types require different structural arcs. Match the architecture to the campaign type:

**Welcome Sequence (new subscriber or lead):**
- Email 1: Immediate value delivery + expectation-setting (send at trigger)
- Email 2: Education or origin story -- deepen the relationship (day 2-3)
- Email 3: Social proof -- show transformation or credibility (day 5-6)
- Email 4: Soft conversion -- present the offer with low pressure (day 8-10)
- Email 5 (optional): Final offer with scarcity or urgency (day 12-14)

**SaaS Onboarding/Trial Activation Sequence:**
- Email 1: Welcome + single most important first action in the product (send at signup)
- Email 2: Second activation milestone -- based on whether they completed Email 1's action (day 2-3, behavior-triggered if possible)
- Email 3: Feature spotlight that solves a core pain point (day 4-5)
- Email 4: Social proof -- customer case study or stat (day 7)
- Email 5: Trial expiration warning with conversion CTA (day 10-12)
- Note: SaaS sequences should ideally branch on user behavior (completed action vs. did not). Flag this for the user even if the copy cannot branch.

**Nurture Sequence (marketing-qualified lead, not yet ready to buy):**
- Email 1: Acknowledge where they are + deliver high-value educational content (day 0)
- Email 2: Address the most common objection or misconception in the category (day 5-7)
- Email 3: Case study or social proof with specific, quantifiable results (day 10-12)
- Email 4: Direct comparison -- why this solution vs. doing nothing or using alternatives (day 15-18)
- Email 5: Transition email -- invite to next step (demo, consultation, trial) (day 20-25)
- Nurture sequences use longer delays because the reader is not yet ready; rushing converts no one.

**Re-engagement Sequence (inactive for 60-180 days):**
- Email 1: Re-introduction with an honest acknowledgment of absence (not guilt) + compelling reason to return
- Email 2: New value -- what has changed since they were last active (feature update, new content, new offer)
- Email 3: A direct "do you still want to hear from us?" ask with a clear stay/leave choice
- This sequence is 3 emails maximum. After 3 non-responses, move to suppression to protect deliverability.

**Promotional/Launch Sequence (time-bounded sale or launch):**
- Email 1: Announcement -- what it is and why it matters (day 0)
- Email 2: The details -- features, benefits, who it is for (day 2)
- Email 3: Social proof or FAQ -- remove the last objections (day 3-4)
- Email 4: Urgency email -- deadline approaching (day 5, or 24 hours before close)
- Email 5: Final hours -- last chance, short and direct (day 5-6, same day as deadline)
- Promotional sequences compress the timeline; urgency must be genuine or it destroys trust.

**Post-Purchase Sequence:**
- Email 1: Order/enrollment confirmation (transactional -- send immediately; often handled by platform)
- Email 2: Onboarding -- how to get the most value from what they bought (day 1-2)
- Email 3: Review or testimonial request (day 7-14, after they have experienced value)
- Email 4: Cross-sell or upsell -- related product or upgrade (day 21-30)
- Do not sell in the first email after purchase. The relationship is in a trust-building phase.

---

### Step 3: Write Subject Lines Using Proven Formulas

For each email, produce two subject line variants for A/B testing. The variants should test meaningfully different psychological mechanisms -- not just word swaps.

**Subject line length:**
- Hard limit: 60 characters (displays fully on 90%+ of email clients)
- Optimal: 35-50 characters
- Mobile preview: The first 30-35 characters are what most readers see before deciding to open

**The six most effective subject line mechanisms (pick two different ones per email):**
1. **Benefit-explicit:** States exactly what the reader will get -- "Your free Canva template inside"
2. **Curiosity gap:** Creates an open loop the reader must close -- "The mistake most home cooks make"
3. **Specificity:** Numbers and concrete details outperform vague claims -- "5 questions to ask before you hire"
4. **Personal/conversational:** First-person or direct address -- "Can I ask you something?"
5. **News/announcement:** Creates timely relevance -- "We just added something new"
6. **Fear of missing out:** Deadline or scarcity without being manipulative -- "Last chance: closes tonight"

**Preview text (preheader):**
- The first 85-140 characters that appear next to the subject line in most email clients
- Do not let the email platform default to "View this email in your browser" -- this wastes the preview
- Write preview text as a continuation of the subject line -- they should work as a pair
- Test: Read subject + preview together as if you are the reader deciding whether to open

**What to avoid:**
- All-caps words (triggers spam filters and reads as shouting)
- Excessive punctuation, especially multiple exclamation marks
- Spam trigger words: "Free!!!", "Guaranteed", "Act now", "Limited time" (by itself), "100% free"
- Misleading subject lines that do not match the email content -- this destroys unsubscribe rates

---

### Step 4: Write Email Body Copy

Apply these structural principles to every email in the sequence:

**Opening hook (first 2-3 sentences -- the most important real estate):**
- Never open with "I hope this email finds you well," "My name is," or "As a valued customer"
- Open with a specific observation, a provocative question, a counterintuitive statement, or a concrete scenario
- The opening must earn the reader's continued attention -- assume they are deciding whether to keep reading after the first sentence

**Body structure (choose one per email -- do not mix):**
- **Problem-Agitate-Solve (PAS):** Identify a pain, amplify why it matters, present the solution. Best for conversion emails.
- **AIDA (Attention-Interest-Desire-Action):** Classic funnel within a single email. Best for product introduction emails.
- **Star-Story-Solution:** Lead with the protagonist (the reader or a customer like them), tell their story, resolve it with your product. Best for social proof emails.
- **Direct:** State the point immediately, support it with one or two proof elements, give the CTA. Best for urgency/deadline emails where the reader already knows the offer.

**Body copy length guidelines:**
- Welcome and relationship-building emails: 150-250 words
- Educational/nurture emails: 200-350 words (more is acceptable when delivering genuine value)
- Conversion and promotional emails: 100-200 words (shorter creates more urgency)
- Re-engagement emails: 80-150 words (readers who have disengaged will not read long emails)
- These are guidelines, not rules -- length should be determined by what the email needs to say, not by hitting a word count

**Social proof placement:**
- Inline quotes: Best in email 3 or 4 where trust-building is the goal
- Stats ("Joined by 12,000 marketers"): Best in email 1 to establish credibility fast
- Named customer stories (with permission): Best in emails that use the Star-Story-Solution format
- Generic testimonials ("Great product, 5 stars"): Avoid -- readers assign these low credibility

**CTA rules:**
- One primary CTA per email, stated as a specific action (not "click here" or "learn more")
- CTA button text should complete the sentence "I want to ___": "Start my free trial," "Get the guide," "Book a 20-minute call"
- Place the primary CTA both inline (as a hyperlinked sentence) and as a button at the bottom
- For emails over 250 words, place a secondary CTA reference above the fold for readers who are already convinced and do not need to finish reading
- Secondary CTAs (if included) should be lower-commitment than the primary: if the primary is "Book a demo," the secondary might be "Watch the 3-minute overview video first"

**Signature and personalization:**
- Sign from a real person's name, not a brand name -- people reply to people, not logos
- Include a P.S. in conversion emails -- research consistently shows the P.S. is read almost as often as the opening, making it the second most valuable real estate in the email
- Use merge tags for first-name personalization in the subject line and opening when the data is reliable -- but include a fallback ("there" instead of a blank field)

---

### Step 5: Define Send Timing and Automation Triggers

**Trigger event (enrollment condition):**
- Be specific: "User submits email on /free-guide landing page" is better than "user subscribes"
- Identify what tag, list, or event in the email platform triggers the sequence
- Specify whether the sequence is time-based (delays from trigger) or behavior-based (next email sends when reader takes or does not take an action)

**Delay recommendations by sequence type:**

| Sequence Type | Email 1 | Email 2 | Email 3 | Email 4 | Email 5 |
|---------------|---------|---------|---------|---------|---------|
| Welcome | Immediate | +2-3 days | +5-6 days | +9-10 days | +13-14 days |
| SaaS Onboarding | Immediate | +1-2 days | +3-4 days | +7 days | +12 days |
| Lead Nurture | Immediate | +5-7 days | +10-12 days | +16-18 days | +22-25 days |
| Re-engagement | Immediate | +3-4 days | +6-7 days | -- | -- |
| Promotional | Day 0 | Day 2 | Day 4 | Day 5 | Day of deadline |
| Post-purchase | Immediate | +1-2 days | +7-10 days | +21-30 days | -- |

**Send time optimization:**
- For B2C audiences: Tuesday-Thursday, 10am or 2pm in the recipient's time zone, performs above average in most industries -- but always note that the user should test against their own list
- For B2B audiences: Tuesday-Thursday, 7-9am (before the inbox clutter accumulates) or 12-1pm
- For re-engagement: Weekend mornings often outperform weekdays because there is less competition in the inbox
- Day-of-week matters less than consistent testing -- what works for a tech audience may underperform for a retail audience

**Exit conditions (critical -- never omit):**
- Purchased the offer the sequence promotes
- Unsubscribed from the list
- Sequence completed (reached the last email)
- For SaaS: Converted from trial to paid
- For re-engagement: Opened or clicked any email (move to active segment)
- Failure to define exit conditions leads to subscribers receiving irrelevant or redundant emails after they have already converted, which damages brand trust

---

### Step 6: Set Performance Benchmarks

Industry benchmarks vary significantly by vertical. Use these calibrated benchmarks when setting targets:

| Industry | Avg Open Rate | Avg Click Rate | Avg Unsubscribe |
|----------|--------------|----------------|-----------------|
| SaaS / Software | 28-32% | 3-5% | 0.3-0.5% |
| E-commerce / Retail | 20-25% | 2-4% | 0.4-0.7% |
| Publishing / Media | 30-40% | 4-7% | 0.3-0.5% |
| B2B Professional Services | 25-35% | 3-6% | 0.2-0.4% |
| Education / E-learning | 28-35% | 4-7% | 0.3-0.5% |
| Health / Wellness | 22-28% | 2-4% | 0.5-0.8% |
| Nonprofit | 35-45% | 4-6% | 0.2-0.3% |

**Note on open rate benchmarks:** Since Apple Mail Privacy Protection (MPP) introduced open tracking inflation in late 2021, open rate benchmarks have risen across all industries as many "opens" are now machine-reads. Weight click rate and conversion rate more heavily than open rate as true engagement signals.

**Sequence-level conversion targets:**
- Welcome sequences: 3-8% conversion to first purchase (e-commerce, B2C)
- SaaS trial-to-paid via onboarding sequence: 15-25% (varies heavily by trial length and product)
- Lead nurture to demo/consultation: 5-12%
- Re-engagement: 15-25% reactivation of the segment that receives the sequence
- Promotional launch: 1-3% of total list, or 5-10% of engaged segment

---

### Step 7: Design the A/B Testing Plan

Build the testing plan into the sequence from the start, not as an afterthought.

**What to test and when:**
- **Email 1:** Subject line mechanism (benefit vs. curiosity) -- highest volume makes this the best test
- **Email 2-3:** CTA text and button placement -- reveals what action language resonates
- **Email 4:** Short vs. long body copy for conversion emails -- reveals whether the audience needs more convincing or less friction
- **Final email:** Urgency framing -- "Last chance" vs. a specific deadline countdown ("Offer ends at midnight")

**Testing rules:**
- Test one variable per email, never multiple changes simultaneously
- Run for minimum 1,000 sends per variant before drawing conclusions
- Statistical significance: Aim for 95% confidence (most email platforms show this)
- For sequences with small lists (under 500 total), do not split test -- choose the stronger variant based on copywriting principles and test in the next campaign

---

## Output Format

```
## Email Campaign: [Campaign Name]

**Goal:** [Specific conversion outcome with a numeric target if possible]
**Audience:** [Who receives this sequence and what their relationship to the brand is]
**Trigger:** [Exact event that enrolls someone -- form submit, tag applied, trial started, etc.]
**Sequence Type:** [Welcome / Nurture / Re-engagement / Onboarding / Promotional / Post-purchase]
**Sequence Length:** [X emails over Y days]
**Brand Voice:** [3 descriptors or a reference]

---

### Sequence Overview

| # | Email Name | Send Timing | Purpose | Primary CTA |
|---|-----------|-------------|---------|-------------|
| 1 | [Name] | Immediately on trigger | [One-sentence purpose] | [Action] |
| 2 | [Name] | +X days | [One-sentence purpose] | [Action] |
| 3 | [Name] | +X days | [One-sentence purpose] | [Action] |
| 4 | [Name] | +X days | [One-sentence purpose] | [Action] |
| 5 | [Name] | +X days | [One-sentence purpose] | [Action] |

**Exit Conditions:**
- [Purchased / converted]
- [Unsubscribed]
- [Sequence complete]
- [Other relevant trigger]

---

### Email 1: [Name]
**Send:** [Timing relative to trigger]
**Sequence Purpose:** [What this email must accomplish in the reader's journey]
**Subject Line A:** [Benefit-driven -- under 60 characters]
**Subject Line B:** [Curiosity or alternate mechanism -- under 60 characters]
**Preview Text:** [85-140 characters, works as a continuation of the subject line]

---

[Full email body copy]

---

**CTA Button Text:** [Specific action verb phrase]
**CTA Destination:** [Page or action this goes to]
**Secondary CTA (if applicable):** [Lower-commitment alternative]
**P.S. (if applicable):** [High-value real estate -- use for conversion emails]

---

### Email 2: [Name]
[Repeat same structure]

---

### Email 3: [Name]
[Repeat same structure]

---

### Email 4: [Name]
[Repeat same structure]

---

### Email 5: [Name -- if applicable]
[Repeat same structure]

---

### Performance Targets

| Metric | Target | Industry Benchmark | Notes |
|--------|--------|--------------------|-------|
| Open Rate (Email 1) | [X%] | [Benchmark for vertical] | Highest open rate in sequence |
| Open Rate (Sequence avg) | [X%] | [Benchmark] | Expect drop-off by email 3-4 |
| Click Rate | [X%] | [Benchmark] | Weighted toward conversion emails |
| Sequence Conversion Rate | [X%] | [Benchmark] | [Primary goal outcome] |
| Unsubscribe Rate | [<X%] | [Benchmark] | Flag if exceeds this |

---

### A/B Testing Plan

| Test # | Email | Variable Tested | Variant A | Variant B | Minimum Send Volume | Decision Metric |
|--------|-------|----------------|-----------|-----------|--------------------|----|
| 1 | Email 1 | Subject line mechanism | [Benefit-driven] | [Curiosity-driven] | 500/variant | Open rate |
| 2 | Email 3 | CTA button text | [Version A] | [Version B] | 500/variant | Click rate |
| 3 | Email 4 | Copy length | [Short, 150 words] | [Long, 300 words] | 500/variant | Conversion rate |

---

### Automation Setup Notes
**Platform-specific flags:**
- [Tag applied on trigger]
- [Exit condition logic in platform]
- [Behavioral branching points, if any]
- [Any wait conditions based on link clicks or actions]
```

---

## Rules

1. **Never begin drafting without goal, audience, and sequence type.** These three inputs determine every structural decision. Writing copy without them produces generic emails that could belong to any campaign.

2. **Subject lines must be under 60 characters and test two genuinely different psychological mechanisms.** Two subject lines that are slightly reworded versions of each other ("Get our guide free" vs. "Download our free guide") are not a meaningful test -- they will produce nearly identical results and waste the test.

3. **Each email must have exactly one primary CTA.** If you find yourself wanting to include multiple CTAs, it means the email is trying to do too much. Split it into two emails or eliminate the weaker ask. Multiple CTAs divide attention and consistently lower click-through rates in A/B tests.

4. **Never open an email with a greeting followed by a sentence about the company or brand.** "Welcome to [Brand]! We are so excited to have you." This opening is about the sender, not the reader. The reader does not care about the sender's excitement -- they care about what is in it for them.

5. **Preview text is mandatory for every email.** The default fallback ("View this email in your browser") is an abandoned conversion opportunity. Preview text and subject line together determine whether the email gets opened, and they must be written as a pair.

6. **The P.S. line is not optional in conversion emails.** The P.S. in emails is read almost as frequently as the opening paragraph because readers scan to the bottom. Use it to restate the most compelling benefit or deadline, not to add a throwaway note.

7. **Exit conditions must be defined before the sequence is considered complete.** A subscriber who purchases on day 3 of a 10-day promotional sequence must be removed from that sequence immediately. Failing to define this is not just an annoyance -- it actively damages trust and can cause deliverability problems.

8. **Re-engagement sequences must not exceed 3 emails.** Sending more than 3 emails to a subscriber who has not opened in 60-180 days will damage sender reputation and domain deliverability score. The third email should include a clear opt-out path and explain that they will be removed if they do not engage.

9. **Urgency must be real to be effective.** Countdown timers and "last chance" language that resets the next day trains subscribers to ignore urgency signals and is increasingly flagged by email clients. If the offer does not actually expire, do not use deadline language.

10. **Personalization must include a fallback for missing data.** Merge tags like {{first_name}} that fail silently produce emails that open with "Hi ," -- a trust-destroying glitch. Always specify the fallback: {{first_name | default: "there"}} or equivalent syntax for the platform in use.

11. **B2B nurture sequences must not mirror B2C cadence.** A welcome sequence sending three emails in the first week is appropriate for e-commerce; it is aggressive and off-putting in a B2B context where the buying cycle is measured in weeks or months. Space B2B nurture emails 5-7 days apart minimum.

12. **Do not mix promotional and educational intent in a single email.** An email that opens with a valuable tip and then pivots to a hard sell trains readers to distrust the educational content. If the email is educational, let the CTA be low-friction (read more, download a guide). If the email is a promotional conversion email, be transparent about that from the opening.

---

## Edge Cases

### Behavioral Branching in SaaS Onboarding
When writing a SaaS onboarding sequence, the ideal architecture branches on whether the user completed the activation action from the previous email (e.g., "Did they connect their first integration?"). Most email platforms (ActiveCampaign, Klaviyo, HubSpot, Drip) support conditional branching based on link clicks or contact property changes. When the user wants this and their platform supports it, produce two variants of affected emails: one for users who completed the action ("Great, here is the next step") and one for users who did not ("Let us help you get past this"). Flag which emails need branching logic and specify the condition that triggers each path.

### Small List Size (Under 500 Subscribers)
A/B testing is statistically meaningless at small list sizes -- 50 opens per variant cannot reach 95% confidence on a 2-3% difference in open rates. For small lists, advise the user to choose the stronger variant based on copywriting principles, document the rationale, and plan to test in future campaigns as the list grows. Suggest using the sequence itself as a baseline measurement rather than splitting traffic.

### Transactional Boundary Compliance
Post-purchase sequences often blend transactional emails (order confirmation, shipping notification) with marketing emails (upsell, review request). In most jurisdictions under CAN-SPAM and GDPR, transactional emails can be sent to anyone regardless of marketing consent, but marketing emails require explicit opt-in. Flag this to the user if the sequence crosses that boundary. The first 1-2 emails in a post-purchase sequence may be transactional; emails 3+ are typically marketing and require consent.

### High-Ticket B2B Offer ($5,000+)
For sequences promoting high-ticket services or enterprise software, email alone rarely closes the deal. The sequence's CTA goal should not be "purchase" but rather "book a discovery call" or "request a proposal." The email sequence functions as qualification and trust-building; the actual conversion happens off-email. Structure the sequence to screen for fit (ideal customer profile signals) and lower the barrier to the first conversation rather than attempting to close by email.

### Reusing Sequences Across Audience Segments
If the user wants one sequence to serve multiple audience types (e.g., a welcome sequence for both individual freelancers and agency owners who subscribe to the same list), recommend against it. Audiences at different awareness levels and with different pain points will respond poorly to the same narrative. Instead, segment at the point of subscription (use a survey or intake form) and create tailored sequences. If the user cannot segment, write to the most common audience type and note who the sequence will underserve.

### Promotional Sequence During a Saturated Send Period
If the user is running a launch during a high-email-volume period (Black Friday, end-of-quarter, January "new year" season), the sequence needs to account for inbox competition. In these windows, shorten delays between emails (do not wait 3 days between promotional emails when the sale window is 5 days total), increase subject line specificity, and move the urgency email earlier rather than waiting for the final day. Also recommend the user temporarily suppress the sequence from recipients who have not opened the last 2-3 sends, since those subscribers are unlikely to engage and will harm deliverability.

### Re-engagement Sequence for Compliance List Cleaning
When the primary goal is list hygiene rather than reactivation (i.e., the user needs to identify and remove non-engaged contacts to improve deliverability), the sequence design changes. Email 1 should be the most compelling possible reason to stay (best offer, most valuable content). Email 3 should be a direct binary choice: click this link to confirm you want to keep receiving emails, or you will be removed. Contacts who do not click the confirmation link by 48 hours after Email 3 should be suppressed from future sends. This is distinct from a re-engagement sequence designed primarily to recover revenue.

---

## Example

**Input:** "We run a project management SaaS. Our 14-day free trial just launched. New trial users sign up but most never connect their first integration -- that is our activation milestone. We want a 5-email onboarding sequence to get them to activate and convert to paid ($29/month). Trials that hit the activation milestone convert at 40%; trials that do not convert at 6%. Voice: friendly, knowledgeable, a bit direct."

---

## Email Campaign: Trial Onboarding -- Activation & Conversion Sequence

**Goal:** Drive trial users to connect their first integration (activation milestone) within 7 days; convert activated users to paid at $29/month before day 14
**Audience:** New free trial users who signed up but have not yet connected an integration
**Trigger:** Free trial account created (tag: `trial_started`, integration status: `none`)
**Sequence Type:** SaaS Onboarding / Trial Activation
**Sequence Length:** 5 emails over 12 days
**Brand Voice:** Friendly, knowledgeable, direct -- like a senior colleague who knows the product cold and wants you to succeed with it

---

### Sequence Overview

| # | Email Name | Send Timing | Purpose | Primary CTA |
|---|-----------|-------------|---------|-------------|
| 1 | One thing to do today | Immediately on trial start | Drive to first integration connection | Connect your first integration |
| 2 | What connected teams actually look like | +2 days | Education + social proof for non-activators | Connect an integration |
| 3 | The feature most people miss | +4 days | Feature spotlight tied to integration value | See it in your account |
| 4 | How [similar company] cut meeting time by 40% | +7 days | Customer story -- make the outcome concrete | Book a 15-minute walkthrough |
| 5 | Your trial ends in 3 days | +11 days | Urgency + conversion to paid | Start your $29/month plan |

**Exit Conditions:**
- User connects their first integration (activation achieved -- move to "activated" nurture track)
- User converts to paid plan (remove from sequence)
- User unsubscribes
- Sequence complete (day 12 -- user did not convert, move to re-engagement track after 30-day pause)

---

### Email 1: One thing to do today
**Send:** Immediately on trial start
**Sequence Purpose:** Get the user to take the single action most correlated with retention and conversion -- connecting their first integration -- before the novelty of a new tool wears off
**Subject Line A:** One setup step that changes everything (48 chars)
**Subject Line B:** Most teams skip this on day one -- don't (46 chars)
**Preview Text:** It takes 4 minutes and it is the only thing we will ask you to do today.

---

Hey {{first_name | default: "there"}},

Your trial is live. You have 14 days -- and I want to make sure you actually get something out of them.

Here is the honest version of how most trials go: people sign up, poke around, and then get pulled back into their day. Two weeks later the trial expires and they cannot quite remember what the tool was supposed to do for them.

Here is what the teams who end up staying do differently on day one: they connect one integration.

Not five. Not a full setup. One.

When your project data lives in one place -- whether that is Slack, GitHub, Google Drive, or your calendar -- you stop switching between tools to find out what is happening. Everything your team updates shows up where you are already working.

It takes about 4 minutes. Here is the exact page where you do it.

[Connect your first integration →]

Try it before end of day. That one step is the difference between a tool you evaluate and one your team actually uses.

-- Alex, Head of Customer Success

**CTA Button Text:** Connect Your First Integration
**CTA Destination:** [In-app integrations page -- direct link with account authentication]
**Secondary CTA:** Browse the 40+ integrations we support (lower-commitment for users who want to see their options first)
**P.S.:** If you run into anything during setup, reply to this email. It goes straight to our team, not a ticketing system.

---

### Email 2: What connected teams actually look like
**Send:** +2 days after trial start (send if integration NOT yet connected)
**Sequence Purpose:** Overcome the "I will get to it later" inertia by making the outcome of activation concrete and showing social proof that real teams like theirs have done this
**Subject Line A:** What your dashboard looks like with a live integration (55 chars)
**Subject Line B:** The 4-minute setup most teams forget until week 3 (50 chars)
**Preview Text:** Here is what changes immediately when your first integration is live.

---

{{first_name | default: "Hey"}},

Two days in -- how is it going?

I want to show you something specific. When a team connects their first integration (Slack is the most popular starting point), three things happen immediately in their account:

**1. Your feed becomes real.** Instead of placeholder data, you see actual project updates from your team in real time.

**2. You stop getting "is this done?" messages.** Team members can see project status without pinging anyone, because it is automatically reflected from whatever tool they are already using.

**3. Status meetings get shorter.** When everyone can see progress in one place before the meeting, you spend meeting time on decisions -- not on updates.

Mehdi, an engineering lead at a 12-person software team, described it this way: "We had a 45-minute standup every morning. After connecting GitHub and Slack, it is 15 minutes. We talk about blockers now instead of reading out what everyone did."

You can be at this point by tonight.

[Connect your first integration -- it takes 4 minutes]

**CTA Button Text:** Connect an Integration Now
**CTA Destination:** [In-app integrations page]
**Secondary CTA:** Not sure which integration to start with? See our recommended setup guide for your team size.

---

### Email 3: The feature most people miss
**Send:** +4 days after trial start
**Sequence Purpose:** Deliver standalone educational value while reinforcing the integration dependency -- the most powerful features require an active integration, creating a natural incentive to activate
**Subject Line A:** The reporting feature 80% of users find by accident (51 chars)
**Subject Line B:** You probably have not seen this part yet (40 chars)
**Preview Text:** It only appears after you connect a data source -- here is what it does.

---

{{first_name | default: "Hey"}},

Most people discover the Workload View by accident, usually when a project is already off the rails.

Here is what it does: it shows you, in one view, how much active work each person on your team is carrying -- across every project simultaneously. Not a manually updated spreadsheet. Not a status update meeting. A live view, updated automatically from your connected tools.

When a project manager at a 30-person design agency showed this to her CEO, his response was: "Why have we been having capacity planning meetings for three years when we could have just had this screen?"

The catch: Workload View only pulls live data if you have an integration connected. Without it, you are looking at manually entered estimates -- which are almost always wrong.

If you have connected an integration already, go check out Workload View right now. It is in the left sidebar under "Team."

If you have not connected one yet, here is your on-ramp:

[Connect an integration to unlock live Workload View]

Either way -- go find it. It is the feature most teams wish they had found on week one instead of month three.

**CTA Button Text:** See Workload View in My Account
**CTA Destination:** [Direct deep link to Workload View in the user's account]
**Secondary CTA:** Connect an integration first (for users who have not activated yet)

---

### Email 4: How [similar company] cut meeting time by 40%
**Send:** +7 days after trial start
**Sequence Purpose:** Concrete, specific customer outcome story that makes the transformation real -- and softly introduces the paid plan by referencing a team that uses the full product
**Subject Line A:** 40% fewer meetings -- here is exactly how they did it (51 chars)
**Subject Line B:** The setup that saved this team 6 hours a week (47 chars)
**Preview Text:** A 22-person ops team, two integrations, and one month. Here is the breakdown.

---

{{first_name | default: "Hey"}},

I want to tell you about Clearline Operations, a 22-person operations team that came to us nine months ago.

They had the same problem most teams have: work was happening everywhere -- Slack threads, Google Docs, spreadsheets, email -- and no one had a clear picture of what was actually getting done or what was stuck.

Their setup took about 20 minutes. They connected Slack and Google Drive. That is it.

One month later:
- Morning standup dropped from 45 minutes to 18 minutes
- Project managers stopped receiving "what is the status on X" messages
- Their CEO could pull a real-time project health report without scheduling a meeting to get one

I am not telling you this to impress you. I am telling you because their starting point -- scattered work, unclear ownership, too many status updates -- is where most teams are when they sign up for a trial.

You have 7 days left. If you want a 20-minute walkthrough of how to set up what Clearline set up, I am happy to do that with you live.

[Book a 15-minute walkthrough with our team]

No sales pitch. Just your account, your integrations, and a setup that actually works for your team size.

**CTA Button Text:** Book a 15-Minute Walkthrough
**CTA Destination:** [Calendly or scheduling tool link -- assigned rep or CS team]
**Secondary CTA:** Prefer to explore on your own? Here is the exact integration setup guide we use with new teams.
**P.S.:** If a live call is not your thing, reply here with your biggest question and I will answer it directly.

---

### Email 5: Your trial ends in 3 days
**Send:** +11 days after trial start (3 days before trial expiration on day 14)
**Sequence Purpose:** Direct urgency email -- this is not the time for education or stories. The reader either sees the value or they do not. The job of this email is to convert the ones who see the value but have not acted.
**Subject Line A:** Your trial ends in 3 days -- here is what happens next (54 chars)
**Subject Line B:** Before your account locks on Friday... (38 chars)
**Preview Text:** Your projects, integrations, and history stay -- if you upgrade before Friday.

---

{{first_name | default: "Hey"}},

Your 14-day trial ends on Friday.

Here is what I want you to know:

If you upgrade before then, everything in your account carries over -- your projects, your integrations, your history, your team members. Nothing resets.

If your trial expires without upgrading, your account goes into read-only mode. You can see what is there, but nothing updates and your team loses access.

The paid plan is $29/month. That is the full product -- no feature tiers, no integrations locked behind a higher plan.

If you have been meaning to get your integrations set up and kept putting it off, now is the time. It is the step that turns the tool from something you evaluate into something your team uses every day.

[Start my $29/month plan before Friday]

If you have questions about billing, team seats, or what the paid plan includes, reply here. I check this daily.

-- Alex

**CTA Button Text:** Upgrade Before My Trial Ends
**CTA Destination:** [In-app billing/upgrade page with trial account pre-authenticated]
**Secondary CTA:** Questions about the plan? See full pricing details.
**P.S.:** Not ready to upgrade yet? Reply with "extend" and we will give you an extra 7 days. We would rather you make the right decision than a rushed one.

---

### Performance Targets

| Metric | Target | Industry Benchmark | Notes |
|--------|--------|--------------------|-------|
| Email 1 Open Rate | 55-60% | 28-32% (SaaS) | Day-of send to fresh signups drives high open rates |
| Sequence Average Open Rate | 35-40% | 28-32% | Expect drop-off; Email 5 often rebounds with urgency |
| Integration Activation Rate | 30-40% from sequence | Varies | 40%+ activation predicts ~40% trial-to-paid conversion |
| Trial-to-Paid Conversion | 20-25% of activated users | 15-25% (SaaS) | Non-activated users convert at ~6% regardless of sequence |
| Click Rate (sequence avg) | 5-8% | 3-5% | Weight Email 1 and Email 5 CTAs most heavily |
| Unsubscribe Rate | < 0.4% | 0.3-0.5% | Flag if any email exceeds 1% -- review targeting |
| Demo/Walkthrough Bookings | 8-12% of Email 4 recipients | Varies | Leading indicator of high-value customer acquisition |

---

### A/B Testing Plan

| Test # | Email | Variable Tested | Variant A | Variant B | Min Send Volume | Decision Metric |
|--------|-------|----------------|-----------|-----------|-----------------|-----------------|
| 1 | Email 1 | Subject line mechanism | Benefit: "One setup step that changes everything" | Curiosity: "Most teams skip this on day one -- don't" | 500/variant | Open rate |
| 2 | Email 1 | CTA placement | CTA button only at bottom | CTA inline above fold + button at bottom | 500/variant | Click rate |
| 3 | Email 5 | Urgency framing | Deadline-specific ("before Friday") | Loss-aversion ("account goes read-only") | 500/variant | Conversion rate |
| 4 | Email 4 | CTA type | Book a live walkthrough | Self-serve setup guide | 500/variant | Downstream paid conversion rate |

---

### Automation Setup Notes

**Platform-specific flags:**
- Tag trigger: `trial_started` applied on account creation; sequence enrolls within 5 minutes
- Exit condition 1: Tag `integration_connected` applied by webhook when first integration is saved -- suppresses emails 2-3 and adjusts emails 4-5 to reflect activated status (create separate "activated" track)
- Exit condition 2: Tag `paid_customer` applied on billing webhook -- removes from sequence immediately
- Exit condition 3: Unsubscribe event from any email platform event
- Behavioral branch point: Email 2 should check `integration_connected` tag before send. If the user activated between day 0 and day 2, send an alternate Email 2 ("You are off to a great start -- here is your next step") rather than the re-engagement version. Create both variants in the platform.
- Email 5 P.S. extension offer: Route "extend" replies to a shared inbox monitored by CS; set up a 7-day extension tag that triggers a separate 2-email extension sequence (not covered here -- flag to user to design separately)
- Timing note: All sends should use recipient time zone if available, defaulting to 9am local or 10am UTC. Email 5 send time matters -- send at 9am so users have the full business day to upgrade before close-of-business
