---
name: cold-outreach-sequence
description: |
  Produces a multi-touch cold outreach sequence combining email and social
  touches with personalization variables and follow-up cadence using
  sales cadence design methodology. Use when the user asks to create cold
  outreach emails, build a prospecting sequence, design a sales cadence,
  write cold emails, or plan multi-channel outreach to new prospects.
  Do NOT use for warm follow-up emails after a meeting (use
  follow-up-sequences), email marketing to subscribers (use email-campaign),
  or PR media pitches (use pr-pitch).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sales email planning template"
  category: "marketing-sales"
  subcategory: "sales"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Cold Outreach Sequence

## When to Use

Use this skill when the user is initiating contact with prospects who have no prior relationship with them or their company -- cold outreach, first-contact prospecting, and multi-touch sales cadence design.

**Trigger scenarios where this skill applies:**
- User wants to build a prospecting sequence targeting a defined buyer persona (e.g., "VP of Operations at logistics companies with 100-500 employees")
- User needs to write cold emails from scratch for a new product, service, or market segment they have not contacted before
- User is launching outbound sales as a new motion and needs a complete cadence architecture (touch count, timing, channels, messaging)
- User wants to combine email, LinkedIn, and phone touches into a structured sequence with day-by-day instructions
- User is a founder doing their own outbound and needs professional-quality outreach that does not read like a template
- User needs persona-specific sequences for different buyer titles (e.g., one sequence for CFOs, a separate sequence for Operations Directors)
- User wants to A/B test cold outreach messaging and needs variant copies written with specific hypotheses

**Do NOT use this skill when:**
- The prospect has already replied or taken a meeting -- use `follow-up-sequences` instead, which handles warm continuation logic
- The user is writing to an existing email subscriber list or newsletter audience -- use `email-campaign` for broadcast marketing content
- The outreach is a response to inbound interest (demo request, content download, trial signup) -- use `inbound-lead-response` for speed-to-lead sequences
- The target is a journalist, editor, or media contact -- use `pr-pitch` for earned media outreach with its own formatting norms
- The user needs to reactivate a formerly closed opportunity or past customer -- use `win-back-sequence` which handles relationship repair dynamics
- The outreach is to a referral or warm introduction where a mutual party has set context -- use `warm-intro-follow-up` to honor the existing relationship signal

---

## Process

### Step 1: Extract the Core Sequence Parameters

Before writing a single word of copy, gather all the inputs required to produce messaging that converts. Generic inputs produce generic sequences. Ask or infer the following:

- **Product or service:** What is being sold? What does it actually do, mechanically? Vague descriptions like "a productivity platform" produce vague emails. Extract the specific mechanism of value.
- **Ideal Customer Profile (ICP):** Company size (employee count, revenue band), industry vertical, geography, technology stack in use, growth stage (Series A startup vs. 5,000-person enterprise behaves differently), and buying trigger signals (hiring, funding, regulatory change, leadership change, competitive pressure).
- **Buyer persona:** Target title, seniority level (individual contributor, manager, director, VP, C-suite), functional role, and whether they are an economic buyer, technical evaluator, or champion. A CFO sequence and a Head of Engineering sequence for the same product must be structurally and tonally different.
- **Pain point and trigger events:** What is the specific operational or strategic problem this prospect is feeling? What trigger events indicate readiness to buy (e.g., a company posting 10+ sales rep jobs signals they are scaling GTM, a healthcare company that just received a compliance warning signals regulatory urgency)?
- **Desired outcome of the sequence:** Book a 20-minute discovery call, secure a product demo, start a free trial, get a referral introduction, or schedule a site visit. The CTA drives backward to determine email structure.
- **Cadence parameters:** How many touches? Over how many days? Which channels are available (email, LinkedIn, phone, video, direct mail, SMS)? What is the prospect's likely email open environment (mobile vs. desktop, which affects subject line length and formatting)?
- **Personalization assets available:** List of company names and prospect names only (light personalization), or also: recent company news, funded round dates, job posting data, technology stack from intent data, mutual LinkedIn connections, recent content the prospect published, or trigger events from a data enrichment tool.
- **Sender persona:** Who is the email coming from -- a founder, an SDR, an account executive, or a marketing automation system? Founder-sent outreach can be more informal and personal. SDR-sent outreach should feel human but is understood to be a sales motion.

### Step 2: Select the Cadence Architecture

The cadence structure -- number of touches, timing intervals, and channel mix -- is not arbitrary. Match it to the buyer's seniority, deal complexity, and typical sales cycle length.

**Architecture options by buyer type:**

- **SMB buyer (Director and below, company under 200 employees):** 7-9 touches over 14-21 days. Higher email frequency acceptable (every 2-3 days). LinkedIn and phone appropriate. These buyers move faster and have shorter approval chains.
- **Mid-market buyer (VP-level, 200-2,000 employees):** 6-8 touches over 18-25 days. Respect inbox fatigue -- allow 3-4 days between touches after the first two. Mix of email and LinkedIn with at least one phone attempt if number is available.
- **Enterprise buyer (C-suite, VP+ at 2,000+ employees):** 4-6 touches over 21-30 days. Fewer touches, longer intervals, higher personalization required per touch. Each email must stand on its own -- do not assume previous emails were read.
- **Technical evaluator (Engineering, IT, DevOps):** Replace LinkedIn touches with forum mentions, GitHub engagement, or technical content references. These buyers distrust marketing language -- use precise, technical framing.
- **Recommended default architecture (mid-market, all channels available):**
  - Touch 1 (Day 1): Initial email -- problem-led, specific
  - Touch 2 (Day 2): LinkedIn connection request
  - Touch 3 (Day 4): Follow-up email -- different angle, social proof
  - Touch 4 (Day 7): LinkedIn engagement or direct message (if connected)
  - Touch 5 (Day 9): Email -- insight, data, or case study angle
  - Touch 6 (Day 12): Phone attempt (voicemail if no answer)
  - Touch 7 (Day 15): Break-up email -- low pressure, door open

### Step 3: Write the Initial Email (Touch 1)

The first email sets the tone for the entire sequence. It must earn a reply on its own without relying on follow-ups. Apply these structural rules:

- **Subject line:** 4-7 words, under 40 characters on mobile. Options that work: question using their company name ("[Company]'s approach to [problem]?"), specific insight ("67% of [industry] teams miss [metric]"), or relevance trigger ("Your [job posting / funding round / product launch]"). Avoid: "Following up," "Quick question," "Synergy," "I wanted to reach out," or anything that looks like a newsletter subject.
- **Opening line:** The first sentence must be specific to this prospect, not generic. Acceptable openers: reference a job posting that signals a pain ("Saw [Company] is hiring 5 SDRs -- scaling outbound usually surfaces a data quality problem"), a recent company event ("Congrats on the Series B -- headcount growth typically brings [specific challenge]"), or a specific insight about their industry ("[Industry] companies with your revenue profile typically lose [X]% in [specific area]"). Banned openers: "I hope this email finds you well," "My name is [X] and I work at [Y]," "I wanted to introduce myself."
- **Body structure:** Problem statement (1 sentence, their world not your product) -- solution mechanism (1-2 sentences, what you do and how it works) -- social proof (1 sentence with a named customer or a specific metric). Total body: 60-90 words. No bullet lists in cold emails -- bullets signal a template and reduce trust.
- **CTA:** One ask, low friction. "Would it make sense to spend 15 minutes on a call this week?" is better than "Book a meeting on my calendar." Never ask for more than 20 minutes in a first email. Never include a Calendly link in the first email -- it signals automation and reduces response rates. Ask for a reply first; send the scheduling link after they say yes.
- **Signature:** Name, title, company, phone. No more. Do not include social media links, legal disclaimers, or a logo in the first cold email -- each adds friction and signals bulk email.

### Step 4: Write the Follow-Up Emails (Touches 3, 5, and 7)

Each follow-up email must take a meaningfully different angle from the prior touch. Sending the same email three times with "Just following up" at the top is the most common mistake in cold outreach sequences. It signals desperation and provides no new reason to respond.

**Proven angle rotation framework for follow-up emails:**

- **Angle 1 (Touch 1):** Problem-led -- open with a pain they feel and introduce your solution as the mechanism.
- **Angle 2 (Touch 3):** Social proof -- lead with a named customer story or a specific, verifiable result. "We helped [Customer] go from [before state] to [after state] in [timeframe]." If the customer name cannot be shared, use a description: "A 400-person SaaS company in [vertical]."
- **Angle 3 (Touch 5):** Insight or perspective -- share a data point, industry finding, or contrarian observation that is relevant to their role, with no ask except "thought you'd find this useful." This touch signals expertise and builds credibility without pushing. Example: "We analyzed 200 [industry] companies and found that the ones who reduced [metric] by 20% all had [specific capability] in place -- happy to share the full breakdown."
- **Angle 4 (Touch 7, Break-Up):** Permission to close -- acknowledge the lack of response without blame. Offer three options: now is not the right time, someone else is the right person, or this is not a priority. The break-up email often generates more replies than any other touch because it removes pressure and invites honesty.

**Follow-up email mechanics:**
- Subject lines for follow-ups should NOT say "Re:" unless it is a genuine reply thread -- using false Re: is widely seen as deceptive and damages trust
- Each follow-up email should stand alone -- assume the prospect has not read previous emails
- Length decreases with each touch: Touch 3 under 80 words, Touch 5 under 70 words, Touch 7 under 50 words
- Reference the previous touch only briefly if at all: "Sent a note last week about [topic] -- sharing one more angle in case it's useful"

### Step 5: Write the LinkedIn Touches

LinkedIn is not a second email channel -- treat it as a trust and visibility builder, not a pitch vehicle. Prospects who see your name on LinkedIn before reading your email convert at higher rates because of mere-exposure effect.

- **Connection request note (under 300 characters):** Reference something specific about their profile, content, or company -- not your product. "Saw your post on [topic] -- had a perspective to share." or "We're both in [specific community/group/event] -- thought it made sense to connect." Never pitch in the connection note.
- **Post engagement (Day 7 or after connection accepted):** Find a post the prospect published in the last 30 days and leave a genuine comment that adds value -- a counterpoint, a relevant data point, or a personal experience that builds on their idea. Two sentences minimum. Do not mention your product. Do not end with "Would love to chat." This touch is pure credibility building.
- **Direct message (after connection accepted):** If they have accepted your connection and you are past Day 3, you may send one brief LinkedIn DM. Keep it to 2-3 sentences. Reference something specific: "Thanks for connecting -- noticed you're leading the [initiative] at [Company]. I sent an email recently with something that might be relevant -- let me know if it landed or got buried."
- **Do not pitch cold in LinkedIn DMs:** The #1 mistake SDRs make on LinkedIn is sending a 200-word pitch immediately after a connection request is accepted. This burns the channel. LinkedIn DMs should only be used to bridge to email conversation, not to replace it.

### Step 6: Define Personalization Variables and Fallback Logic

Personalization is a spectrum from shallow (first name + company name) to deep (specific insight derived from their business situation). Define which level is achievable and build fallbacks for each variable.

**Personalization depth levels:**
- **Level 1 (Minimum viable):** [Name], [Company]. Always available from a prospect list. Without these, outreach is spam.
- **Level 2 (Standard):** [Name], [Company], [Industry-specific pain point from ICP research], [Similar Customer in their industry]. Achievable with 10 minutes of research per prospect.
- **Level 3 (High-personalization):** [Name], [Company], [Specific trigger event: funding, job posting, product launch, leadership hire, earnings call mention, regulatory filing], [Specific metric from their public data], [Mutual connection or shared community]. Requires data enrichment tools or dedicated research time. Appropriate for enterprise targets and high-ACV deals.

**Fallback rules for each variable:**
- If [Trigger Event] is not available, fall back to an industry-level insight: "Companies in [vertical] with your size typically see [problem]."
- If [Named Customer] cannot be used, fall back to a descriptive reference: "A healthcare network with 800 employees in the Southeast."
- If [Employee Count / Revenue] is not known, use company funding stage or industry vertical as a proxy.
- Document every fallback in the personalization guide so the SDR or automation tool knows which field triggers which fallback.

**Personalization variables notation:** Use double brackets for required variables ([Name]), single brackets for optional with fallback ([Industry Pain Point | default: "keeping data clean at scale"]).

### Step 7: Define Cadence Rules, Escalation Logic, and Exit Conditions

A sequence without rules is just a list of emails -- the rules determine when to act on signals and when to stop. Define these explicitly.

- **Stop conditions:** Prospect replies with any content (positive, negative, or neutral). Prospect books a meeting directly. Prospect unsubscribes or sends a remove-me request -- this must trigger immediate removal from all active sequences.
- **Escalation triggers:** Prospect opens the same email 3+ times without replying -- this signals high interest with a friction point. Escalate to a personalized phone call or a heavily personalized LinkedIn DM within 24 hours. Prospect clicks a link in the email -- move them to a higher-priority queue for same-day follow-up.
- **Pause conditions:** Prospect is out of office (OOO auto-reply detected) -- pause the sequence and resume 2 days after their stated return date, not immediately on their return.
- **Branch conditions:** Prospect replies with "not the right person" -- ask for a referral to the correct contact and create a new sequence for that referral. Prospect replies with "reach out in [timeframe]" -- create a time-delayed follow-up sequence starting 2 weeks before that date.
- **Post-sequence disposition:** After all touches are complete with no response, move to a low-frequency nurture sequence (monthly, relevant content, no hard CTA). After 90 days in nurture, attempt re-engagement if a new trigger event exists.
- **Maximum sequence attempts per prospect per year:** No more than 2 full sequences per prospect in a 12-month period. After two attempts, move to nurture only unless a significant trigger event (funding, new role, major company change) warrants a third.

### Step 8: Assemble and Review the Complete Sequence

Before delivering the sequence, apply a quality checklist:

- Verify each email is a different angle -- no repeated pitches
- Confirm word counts (Touch 1: 60-90 words, follow-ups: progressively shorter, break-up: under 50 words)
- Check all subject lines for mobile length (under 40 characters) and spam trigger words ("free," "guarantee," "no obligation," "act now")
- Verify each email has exactly one CTA -- not two asks in the same email
- Confirm personalization variables are marked and fallbacks are defined
- Confirm LinkedIn touches are non-promotional
- Confirm the break-up email is respectful and includes a clear "no need to reply" signal
- Check that the cadence table matches the actual email content (day numbers, channels, purposes)

---

## Output Format

```
## Cold Outreach Sequence: [Campaign Name / Persona Name]

**Sender:** [Name, Title, Company]
**Target Persona:** [Title] at [Company Type, Size, Industry]
**ICP Trigger Signal:** [What indicates this prospect is a fit right now]
**Goal:** [Book X-minute [call/demo/visit] | Start free trial | Get referral]
**Sequence Length:** [X touches over Y days]
**Channels:** [Email (X), LinkedIn (Y), Phone (Z)]
**Personalization Depth:** [Level 1 / Level 2 / Level 3]
**Created:** [Date]

---

### Cadence Overview

| Touch | Day | Channel | Angle | CTA | Word Count |
|-------|-----|---------|-------|-----|------------|
| 1 | Day 1 | Email | Problem-led | Reply to confirm interest | 60-90 |
| 2 | Day 2 | LinkedIn | Connection | Connect | <300 chars |
| 3 | Day 4 | Email | Social proof | Reply to explore fit | 70-80 |
| 4 | Day 7 | LinkedIn | Engagement | Comment / DM | 2-3 sentences |
| 5 | Day 9 | Email | Insight / data | Reply to get resource | 60-70 |
| 6 | Day 12 | Phone | Direct outreach | Leave voicemail | 30-second script |
| 7 | Day 15 | Email | Break-up | Reply if timing changes | <50 |

---

### Touch 1: Initial Email (Day 1) -- Problem-Led

**Subject:** [Under 40 characters | Personalized | No clickbait]

**Body:**

Hi [Name],

[Personalized opener -- 1 sentence referencing their specific situation, trigger event, or a verifiable data point about their company or industry]

[Problem statement -- 1 sentence naming the pain in their language, not product language]

[Solution mechanism -- 1-2 sentences explaining what you do and specifically how it works, including a named or described customer and a concrete result metric]

[Single CTA -- 1 low-friction question asking for 15-20 minutes]

[First Name]
[Title] | [Company] | [Phone]

**Personalization Variables:**
- [Name] -- Required | Source: CRM/list | Fallback: N/A (do not send without)
- [Company] -- Required | Source: CRM/list | Fallback: N/A
- [Trigger/Opening Hook] -- Recommended | Source: LinkedIn, news, job postings, funding data | Fallback: [Industry-level insight]
- [Named/Described Customer] -- Recommended | Source: case study library | Fallback: "[Descriptor] company with [X] employees in [vertical]"

**Word Count Target:** 60-90 words
**Spam Risk Check:** No use of "free," "guarantee," "no obligation," "limited time," or ALL CAPS

---

### Touch 2: LinkedIn Connection Request (Day 2)

**Action:** Send connection request to [Name] at [Company]

**Connection Note (300 character max):**

[Personalized reference to their content, role, shared community, or company initiative -- no pitch, no ask beyond connecting]

**Note:** Do not send a pitch message on acceptance. Wait until Day 7 for any DM.

---

### Touch 3: Follow-Up Email (Day 4) -- Social Proof Angle

**Subject:** [Different from Touch 1 | Under 40 characters]

**Body:**

Hi [Name],

[1-sentence bridge acknowledging the prior email briefly, or omit entirely and lead with the new angle]

[Social proof story -- specific customer or described company, before state, after state, timeframe. 2-3 sentences maximum]

[Single CTA -- same or adjacent ask to Touch 1]

[First Name]

**Personalization Variables:**
- [Name], [Company] -- Required
- [Customer Reference] -- Recommended | Fallback: described company reference

**Word Count Target:** 70-80 words

---

### Touch 4: LinkedIn Engagement (Day 7)

**Action:** Find a post published by [Name] in the last 30 days and engage genuinely

**Comment guidance:**
- Add a counterpoint, a supporting data point, or a personal experience that builds on their idea
- Minimum 2 sentences -- single-word reactions ("Great post!") are invisible in feeds and add no credibility
- No mention of your product or any ask
- If prospect is not active on LinkedIn, skip this touch and send Touch 5 email one day earlier

**If connection was accepted and no reply to emails:**

**LinkedIn DM (2-3 sentences max):**

[Name], thanks for connecting. I sent an email about [brief topic] -- let me know if it got buried or if it's not the right time. Either way, happy to share a quick resource on [relevant topic] if useful.

---

### Touch 5: Value / Insight Email (Day 9) -- Expertise Angle

**Subject:** [Data point, finding, or question format | Under 40 characters]

**Body:**

Hi [Name],

[Lead with an insight, data point, or contrarian finding that is directly relevant to their role and situation -- 1-2 sentences. Frame it as useful information, not a pitch]

[Connect the insight to your solution in 1 sentence only -- do not make this a pitch]

[Low-friction ask -- offer to share more, not to sell]

[First Name]

**Word Count Target:** 60-70 words

---

### Touch 6: Phone / Voicemail (Day 12)

**Action:** Call [Name] at [Phone if available]. Leave voicemail if no answer.

**Voicemail Script (30 seconds / ~70 words spoken):**

"Hi [Name], this is [Your Name] from [Company]. I've sent a couple of emails about [brief topic] -- didn't want to keep emailing without giving you a call. The short version is: we help [persona] at [company type] [achieve specific result] -- [Customer] did [result] in [timeframe]. If that's on your radar, I'm at [phone]. No worries if not -- I'll send one final note."

**If no phone number available:** Skip this touch. Advance to Touch 7 on Day 14 instead.

---

### Touch 7: Break-Up Email (Day 15) -- Permission to Close

**Subject:** [Low-pressure, closing signal | Under 35 characters]

**Body:**

Hi [Name],

I've reached out a few times about [brief topic]. I'll assume the timing isn't right.

If that changes, I'm happy to pick this up -- no need to explain anything. And if someone else on your team owns [relevant area], I'd appreciate the intro.

Otherwise, I won't follow up again unless you reach out.

[First Name]

**Word Count Target:** 45-55 words
**Tone check:** No guilt, no urgency, no "last chance" language. The goal is a reply, even a "not interested" -- any reply allows a graceful conversation.

---

### Personalization Guide

| Variable | Required | Source | Fallback If Missing |
|----------|----------|--------|---------------------|
| [Name] | Yes | CRM, list | Do not send -- skip prospect |
| [Company] | Yes | CRM, list | Do not send -- skip prospect |
| [Trigger Event] | Recommended | LinkedIn, Crunchbase, news, job postings | "[Industry] companies your size often see [pain]" |
| [Named Customer] | Recommended | Case study library | "[Description] company with [X] employees in [vertical]" |
| [Specific Metric] | Optional | Customer data, public benchmarks | Remove metric, use directional language ("significantly") |
| [Mutual Connection] | Optional | LinkedIn 2nd-degree | Omit entirely |
| [Employee Count] | Optional | LinkedIn, ZoomInfo | "[Company type] your size" |

---

### Cadence Rules

**Stop immediately if:**
- Prospect replies with any content (positive, negative, or "not interested")
- Prospect books a meeting through any channel
- Prospect clicks unsubscribe or sends a remove-me request

**Escalate within 24 hours if:**
- Prospect opens the same email 3+ times without replying -- call or send personalized LinkedIn DM
- Prospect clicks a link in any email -- move to top of call queue

**Pause if:**
- Out-of-office reply received -- resume 2 business days after stated return date

**Branch if:**
- Prospect replies "not the right person" -- ask for referral, start new sequence for referred contact
- Prospect replies "reach out in [timeframe]" -- set calendar reminder, restart sequence 2 weeks before that date

**Post-sequence:**
- No response after Touch 7 -- move to monthly nurture list (relevant content, no hard CTA)
- Re-engage after 90 days only if a new trigger event exists
- Maximum 2 full sequences per prospect per 12 months
```

---

## Rules

1. **Never begin writing without a defined prospect persona and pain point.** Generic outreach ("we help companies grow") produces 0-1% reply rates. Sequences built on a specific ICP with a named pain point produce 5-15% reply rates. If the user cannot define their target persona, ask before writing.

2. **Every email in the sequence must take a meaningfully different angle.** Problem-led, social proof, insight, and break-up are four distinct angles. Do not send variations of the same pitch with different subject lines -- prospects recognize recycled content and it damages credibility.

3. **Subject lines must be under 40 characters and must not contain spam trigger words.** Words that increase spam filter scoring include: "free," "guarantee," "no obligation," "limited time," "act now," "click here," "earn money," "risk-free," and all-caps words. Test subject lines against a spam word list before outputting.

4. **Cold email body length decreases with each touch.** Touch 1: 60-90 words. Touch 3: 70-80 words. Touch 5: 60-70 words. Touch 7: 45-55 words. Longer emails are read less, not more. If the user insists on longer emails, flag the conversion risk explicitly.

5. **The opening line must be prospect-specific.** Opening with "I hope this finds you well," "My name is [X] from [Y]," "I wanted to reach out," or "We are a leading provider of" is the single fastest way to destroy reply rates. The first sentence should make the prospect think "how did they know that?"

6. **LinkedIn touches must never be promotional.** Using the LinkedIn connection note to pitch or sending a product message immediately after connection acceptance burns the channel. LinkedIn must be used for credibility building and visibility -- not as a second email inbox.

7. **Each email must contain exactly one CTA.** Two asks ("book a call OR reply to this email OR download this resource") creates decision paralysis and reduces response rates. Choose one ask per email. In Touches 1-5, the ask is a conversation. In Touch 7, the ask is permission to move on.

8. **Personalization variables must have documented fallbacks.** Every personalization field must have a defined fallback so that the sequence can still send if enrichment data is missing. A sequence that fails silently because [Trigger Event] was empty is worse than a sequence that uses a well-crafted industry fallback.

9. **The break-up email must remove pressure, not apply it.** Language like "this is your last chance," "I haven't heard back," or "I'm disappointed we haven't connected" increases negative sentiment. The break-up email should read like a professional close, not a guilt trip. It is designed to elicit a reply from prospects who were interested but distracted -- not to pressure uninterested prospects.

10. **Define cadence rules before the sequence runs.** Stop conditions, escalation triggers, pause logic, and post-sequence disposition must all be specified. A sequence without exit logic will continue emailing unresponsive prospects indefinitely, damaging sender domain reputation and violating CAN-SPAM / GDPR requirements. Always include an unsubscribe mechanism in cold email sequences targeting B2C contacts and comply with applicable regulations for the prospect's jurisdiction.

11. **Re-engagement sequences must reference the prior outreach and anchor on a new trigger.** Sending the same sequence to a prospect who already received it with no changes is the fastest way to generate spam complaints. Re-engagement must open with a new event: a product update, a new case study, a regulatory change, or a relevant piece of news about their company.

12. **Sequence timing must account for business days, not calendar days.** Day 1 should never land on a Friday (email sits over the weekend). Day 7 follow-ups should not land on Mondays (high inbox competition). Optimal send windows for B2B email: Tuesday through Thursday, 8:00-10:00 AM or 2:00-4:00 PM in the prospect's local time zone.

---

## Edge Cases

### Enterprise Prospect (C-Suite or VP+ at 1,000+ Employees)
Reduce to 4-5 touches over 21-30 days. Each email must be shorter (under 60 words for Touches 3-5) and more specifically personalized -- a Level 3 personalization approach is non-negotiable. Do not reference operational metrics; reference strategic priorities: revenue growth, market share, board-level risk, or competitive positioning. The CTA should be a "brief conversation to share a perspective" rather than a "demo." Enterprise buyers do not agree to demos from cold email -- they agree to conversations. After the conversation, a demo follows. Connection note on LinkedIn should reference their published content or a public speaking engagement, not their title.

### Highly Regulated Industry (Healthcare, Financial Services, Legal, Government)
Avoid any language that could be construed as a performance guarantee or clinical/legal claim. Replace "reduces phishing click rates by 70%" with "customers report a measurable reduction in employee phishing susceptibility within 90 days." Reference compliance capabilities (HIPAA, SOC 2, FedRAMP, ISO 27001) early -- regulated buyers filter on compliance before evaluating features. Skip any urgency language, which reads as pressure in regulated environments. Include a brief disclaimer in the signature noting that results vary by organization. Research the prospect's regulatory environment before writing -- a CISO at a healthcare network has different concerns than a CISO at a hedge fund.

### Prospect with No LinkedIn Presence or Social Media Activity
Skip all LinkedIn touches. Replace the Touch 4 LinkedIn engagement with a second email delivering a specific resource (a one-page case study PDF, a 2-minute Loom video overview, or a short research finding). If phone number is available, move the phone touch to Day 4 instead of Day 12 -- this prospect is not a social buyer and phone is more appropriate. Increase email touch frequency by one day per interval (Touch 3 on Day 3 instead of Day 4). Consider whether direct mail is appropriate for this prospect if they are in a high-ACV segment.

### Re-Engagement of a Previously Contacted Prospect (No Response to Prior Sequence)
Build a shortened sequence of 3-4 touches maximum. Touch 1 must explicitly reference the prior outreach without dwelling on it: "I reached out a few months ago about [topic] -- didn't want to resurface unless something changed, but [new trigger event] made me think the timing might be different." The new trigger event is mandatory -- a new product capability, a relevant industry development, a new customer win in their sector, or a significant result metric that did not exist in the prior sequence. Spacing should be slightly longer between touches (every 5-7 days) to avoid feeling aggressive.

### Founder-to-Founder Outreach
Eliminate all corporate language. No "synergies," no "solutions," no "leveraging capabilities." Write in first person with authentic voice. Reference shared experiences directly: "We went through the exact same hiring bottleneck at our seed stage -- spent 3 months building infrastructure that existed off the shelf." Skip the formal cadence structure -- 3-4 touches maximum, each feeling like a genuine individual note, not a sales sequence. The CTA should be peer-level: "Would you want to grab a call and compare notes?" not "Can I show you a demo?" Founder outreach that reads like a sales sequence is immediately disqualifying at the startup level.

### High-Volume SDR Cadence (100+ Prospects Per Week)
At high volume, Level 3 personalization is not achievable for every prospect. Design a tiered approach: top 20% of accounts (by fit score, intent data, or ACV potential) receive Level 3 personalization with manual research. Middle 60% receive Level 2 personalization with enrichment tool data. Bottom 20% receive Level 1 with only name and company. Build separate sequence templates for each tier. Document this clearly in the sequence output so the SDR knows which tier requires manual research time. For Level 1 sequences, compensate for reduced personalization with tighter ICP targeting -- a less personalized email to a perfectly targeted prospect still outperforms a highly personalized email to the wrong person.

### Prospect Responds Negatively ("Not Interested" or "Remove Me")
This is an exit condition, not a follow-up trigger. Immediately remove from the sequence and all future sequences. Send a single acknowledgment reply: "Understood -- I'll remove you from my outreach. Apologies for the interruption." Do not ask why they are not interested. Do not offer alternatives. Do not schedule a future follow-up. Log the response in CRM with a "do not contact" flag. In the sequence output, note that negative responses and unsubscribe requests must be honored within 10 business days under CAN-SPAM, and within 30 days under GDPR, though best practice is within 24 hours.

### International Prospects (Non-US/UK)
Adjust formality level based on the prospect's country and culture. German and Japanese business cultures expect more formal language and a slower-paced relationship before a sales ask -- reduce CTA directness and increase the number of value-add touches before any ask. Latin American and Southern European prospects respond better to warmer, more relationship-oriented openers. If the prospect's primary language is not English, consider whether outreach should be written in their language -- a Spanish-language email to a Mexican CISO will outperform an English-language email in most cases. Note any GDPR implications if the prospect is in the EU -- cold email to EU individuals requires a legitimate interest basis for processing and must include an opt-out mechanism.

---

## Example

**Input:** "Create a cold outreach sequence for me. I sell a revenue intelligence platform that uses AI to give sales leaders real-time pipeline visibility and forecast accuracy. My target is VP of Sales or CRO at B2B SaaS companies between $10M and $100M ARR. Our customers typically improve forecast accuracy from 62% to 89% within 60 days. I want to book 30-minute discovery calls. I have email and LinkedIn available. I have prospect names, companies, and LinkedIn profiles but no other enrichment data."

---

**Output:**

## Cold Outreach Sequence: Revenue Intelligence for SaaS Sales Leaders

**Sender:** [Rep Name, Title, Company]
**Target Persona:** VP of Sales or CRO at B2B SaaS companies, $10M-$100M ARR
**ICP Trigger Signal:** Company has a sales team of 10+ reps, is in a growth stage (Series B-D), and is hiring for sales operations or revenue operations roles (indicates pipeline visibility pain)
**Goal:** Book a 30-minute discovery call
**Sequence Length:** 7 touches over 15 days
**Channels:** Email (5), LinkedIn (2)
**Personalization Depth:** Level 2 (name, company, LinkedIn profile review, industry fallback for trigger)
**Created:** [Date]

---

### Cadence Overview

| Touch | Day | Channel | Angle | CTA | Word Count |
|-------|-----|---------|-------|-----|------------|
| 1 | Day 1 | Email | Problem-led: forecast accuracy | Reply to confirm interest | 80 words |
| 2 | Day 2 | LinkedIn | Connection request | Connect | <300 chars |
| 3 | Day 4 | Email | Social proof: customer result | Reply to explore fit | 75 words |
| 4 | Day 7 | LinkedIn | Post engagement or DM | Comment / DM | 2-3 sentences |
| 5 | Day 9 | Email | Insight: pipeline math | Reply to get breakdown | 65 words |
| 6 | Day 12 | Email | Reframe: cost of bad forecast | Reply | 60 words |
| 7 | Day 15 | Email | Break-up | Reply if timing changes | 50 words |

---

### Touch 1: Initial Email (Day 1) -- Problem-Led

**Subject:** [Company]'s forecast accuracy

**Body:**

Hi [Name],

Most VP of Sales at [Company]'s stage tell me their CRM gives them deal status, not deal reality -- they're running pipeline reviews off data that's 2 weeks old and gut-checking the gaps.

We give sales leaders at B2B SaaS companies real-time pipeline signals and AI-generated forecasts that replace the spreadsheet math.

[Customer] went from 61% to 88% forecast accuracy in 45 days.

Worth 30 minutes to see if we're a fit?

[First Name]
[Title] | [Company] | [Phone]

**Personalization Variables:**
- [Name] -- Required | Source: prospect list | Fallback: Do not send
- [Company] -- Required | Source: prospect list | Fallback: Do not send
- [Customer] -- Recommended | Source: case study library | Fallback: "A Series C SaaS company with 40 reps"

**Word Count:** 80 words
**Subject line character count:** 30 characters

---

### Touch 2: LinkedIn Connection Request (Day 2)

**Action:** Send connection request to [Name]

**Connection Note:**

[Name] -- noticed you're leading sales at [Company] through what looks like a strong growth stage. I work with VPs at similar-stage SaaS companies on pipeline visibility. Would love to connect and follow your journey.

**Character count:** 214 -- within limit.
**Note:** No pitch. No product mention. Wait for Day 7 before any DM.

---

### Touch 3: Follow-Up Email (Day 4) -- Social Proof Angle

**Subject:** What [similar SaaS company] changed

**Body:**

Hi [Name],

Sent a note earlier this week -- sharing one more angle.

[Customer], a Series B SaaS company with 35 reps, was running their forecast off a weekly pipeline review that was consistently 28% off. Their board calls were painful.

After 60 days with our platform, forecast variance dropped to under 8%. Their CRO told us they stopped dreading QBRs.

Would it make sense to walk through how that worked?

[First Name]

**Personalization Variables:**
- [Name], [Company] -- Required
- [Customer story] -- Recommended | Fallback: "A B2B SaaS company with a 30-person sales team"

**Word Count:** 79 words

---

### Touch 4: LinkedIn Engagement (Day 7)

**Action:** Review [Name]'s LinkedIn activity in the last 30 days. Find a post they published or shared with original commentary.

**Sample comment (if they posted about Q3 pipeline or sales forecasting):**

The manual reconciliation problem is real -- we've seen this show up at almost every SaaS company between $20M and $80M ARR. The challenge is that CRM reflects what reps record, not what's actually happening in deals. The gap between those two is where forecasts fall apart.

**If they posted on a different topic:** Comment authentically on that topic without referencing your product.

**If they are not active on LinkedIn:** Skip this touch. Move Touch 5 to Day 8.

**LinkedIn DM if connected (send only if they haven't replied to emails):**

[Name] -- thanks for connecting. I sent a couple of notes about pipeline visibility and forecast accuracy. Let me know if it got buried or just isn't the right timing. Either way, happy to share a quick breakdown of how we calculate the cost of forecast error if it's useful.

---

### Touch 5: Value / Insight Email (Day 9) -- Pipeline Math Angle

**Subject:** The math on a 1% forecast miss

**Body:**

Hi [Name],

A 1% miss on a $20M pipeline equals $200K in unplanned variance -- and most SaaS companies at your stage are missing by 15-25%.

We built a 2-minute calculator that shows what forecast inaccuracy is actually costing your team in sandbagged deals, premature closes, and headcount decisions made on bad data.

Want me to send it over?

[First Name]

**Personalization Variables:**
- [Name] -- Required
- [Pipeline figure] -- Optional | Fallback: "your pipeline size"

**Word Count:** 65 words
**Note:** The CTA here is to receive a resource, not to book a call -- this is intentional. It lowers friction and creates a natural reason to follow up once they reply.

---

### Touch 6: Reframe Email (Day 12) -- Cost of Inaction Angle

**Subject:** What bad forecasts actually cost

**Body:**

Hi [Name],

One thing I've heard from VPs in your position: the real cost of forecast inaccuracy isn't the board conversation -- it's the hiring and spending decisions made on projections that turned out to be wrong.

We help sales leaders separate signal from noise in their pipeline before those decisions get made.

Still worth 30 minutes?

[First Name]

**Personalization Variables:**
- [Name] -- Required

**Word Count:** 60 words

---

### Touch 7: Break-Up Email (Day 15)

**Subject:** Closing the loop

**Body:**

Hi [Name],

I've sent a few notes about pipeline visibility and forecast accuracy at [Company]. I'll take the silence as a timing signal and leave it here.

If forecast accuracy becomes a priority -- or if someone else on your team owns this -- I'd appreciate the intro. Otherwise, I won't follow up again.

[First Name]

**Word Count:** 51 words
**Tone check:** No guilt, no urgency, no "last chance." The phrase "I'll take the silence as a timing signal" respects the prospect's autonomy. "Someone else on your team" opens a referral path without demanding one.

---

### Personalization Guide

| Variable | Required | Source | Fallback If Missing |
|----------|----------|--------|---------------------|
| [Name] | Yes | Prospect list | Do not send -- skip prospect |
| [Company] | Yes | Prospect list | Do not send -- skip prospect |
| [Customer Story] | Recommended | Case study library | "A Series B SaaS company with 35 reps" |
| [Pipeline Figure] | Optional | Funding data, job postings | "your pipeline" |
| [LinkedIn Activity] | Recommended | Manual LinkedIn check | Skip Touch 4, advance Touch 5 by 1 day |
| [Trigger Event] | Optional | LinkedIn, news | "[Company]'s stage" (growth-stage framing) |

---

### Cadence Rules

**Stop immediately if:**
- [Name] replies with any content
- [Name] books a call through any channel
- Unsubscribe or remove-me request received -- remove from all sequences within 24 hours

**Escalate within 24 hours if:**
- [Name] opens Touch 1 or Touch 3 more than 3 times without replying -- call if phone available, or send a manually written LinkedIn DM
- [Name] clicks the calculator link in Touch 5 -- send a personalized follow-up within 2 hours referencing the resource

**Pause if:**
- Out-of-office detected -- resume 2 business days after stated return date
- [Name] replies "not the right time" -- set a 45-day reminder and restart with Touch 1 (reframe version)

**Branch if:**
- [Name] replies "wrong person" -- reply thanking them and asking for the right contact, then start a new sequence for that contact
- [Name] replies "reach out in Q1" -- set calendar alert for December 1st and restart sequence with new trigger framing

**Post-sequence disposition:**
- No response after Touch 7 -- move to monthly SaaS sales leader newsletter (relevant content, no hard CTA)
- Re-engage after 90 days only if: company raises a new funding round, posts a VP of Revenue Operations or Sales Ops hire, or releases earnings showing pipeline miss
- Maximum 2 full sequences per prospect in a 12-month window
