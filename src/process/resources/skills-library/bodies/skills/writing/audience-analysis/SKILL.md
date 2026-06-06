---
name: audience-analysis
description: |
  Creates detailed audience persona documents with demographics, pain points,
  vocabulary mapping, content preferences, and behavioral insights. Use when the
  user needs to define their target audience, create buyer personas, build audience
  profiles, or understand who their content serves. Do NOT use for content auditing
  (use `content-audit`), editorial planning (use `editorial-calendar`), or voice
  and tone documentation (use `voice-tone-guide`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "content-marketing marketing research"
  category: "writing"
  subcategory: "content-marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Audience Analysis

## When to Use

Use this skill when the user needs to build a rigorous, actionable understanding of who their content, product, or service is actually for. Specific trigger scenarios include:

- The user is starting a new content program, product launch, or marketing campaign and needs to define who they are writing for before producing any content
- The user has existing content that is not performing (low engagement, poor conversion, high bounce rates) and suspects a mismatch between what they publish and what their audience actually needs
- The user is entering a new market segment, launching a new product line, or targeting a buyer role they have not served before and needs to build a persona from scratch
- The user has inherited a marketing program and wants to audit and rebuild the audience assumptions that were baked in by a previous team
- The user is briefing a content team, agency, or freelancers and needs a shared reference document so writers can work without constant hand-holding
- The user is building a messaging framework, sales deck, or positioning document and needs the audience layer to be defined before working on messaging
- The user is designing a content funnel (awareness, consideration, decision content) and needs to understand what questions the persona has at each stage

**Do NOT use this skill when:**

- The user wants to evaluate existing content against an audience -- use `content-audit` instead, which focuses on performance data, gap analysis, and content inventory scoring
- The user wants to schedule, plan, or sequence content production -- use `editorial-calendar` instead, which assigns audience-informed topics to publishing timelines
- The user wants to define how the brand speaks (tone, formality, vocabulary rules for the brand's voice) -- use `voice-tone-guide` instead, which documents the brand's expression rather than the audience's characteristics
- The user wants a one-page creative brief for a single piece of content -- use `content-brief` instead, which applies audience data to a specific content assignment
- The user is doing quantitative market sizing or total addressable market analysis -- this is a revenue and business strategy exercise, not a content marketing exercise
- The user wants to segment their email list for a campaign send -- that is a segmentation and deliverability task, not a persona-building exercise
- The user is building a user research report from usability testing sessions -- use a UX research synthesis skill, which focuses on product interaction patterns rather than content consumption behavior

---

## Process

### Step 1: Intake -- Gather What the User Already Knows

Before building anything, extract what already exists. Ask the user directly for:

- **The offering:** What product, service, or content are they trying to connect with this audience? Is it a SaaS product, a service business, a media publication, an e-commerce brand, or a content creator channel? The answer shapes everything.
- **Existing evidence:** Do they have any customer data -- CRM records, support tickets, win/loss notes, survey results, interview transcripts, NPS comments, or sales call notes? Even fragments are more valuable than assumptions.
- **Known audience parameters:** Industry, company size, geography, job title, life stage, or any hard constraints the user already knows to be true. Treat these as anchors.
- **The problem they want this persona to solve:** Are they trying to improve content relevance, brief a new writer, build a messaging framework, or define a new market? The use case determines how much detail each section needs.
- **Number of distinct segments:** Ask explicitly whether the user serves one audience or multiple. If they serve multiple, are they truly distinct (different problems, different vocabulary, different channels) or are they variations of the same core persona? Default to building one persona at a time unless the user confirms real behavioral differences between segments.
- **Validation status:** Ask whether they want a data-backed persona (from existing evidence) or a hypothesis persona (from inference and assumption). This determines how you label every attribute in the final document.

If the user cannot answer basic questions about their offering or audience, do NOT proceed to build a persona. Instead, help them articulate the problem they are solving and the person experiencing that problem first.

### Step 2: Classify the Persona Type and Context

Before documenting demographics, determine which persona architecture applies:

- **B2B buying persona:** Has a professional role, operates within an organization's buying process, has budget authority or influence, and experiences professional consequences if they make a bad decision. Firmographic attributes (company size, industry, tech stack, growth stage) are as important as individual demographics.
- **B2B user persona:** Uses a product or service but did not buy it. Has different pain points than the buyer -- they care about usability, daily workflow friction, and outcomes, not ROI or vendor selection criteria. Often overlooked in B2B content.
- **B2C consumer persona:** Defined by life stage, values, lifestyle context, household situation, and personal identity. Demographics are relevant but behavioral and psychographic attributes carry more weight than in B2B.
- **Creator or media audience persona:** Consumes content without a purchase intent in the traditional sense. Defined by topic interest, content format preferences, attention span, and what they do with information after consuming it.

The persona type determines which attributes to prioritize and which sections of the output to expand or contract.

For B2B personas, always document the **buying committee structure** -- the persona rarely makes a purchase decision alone. Map who else is involved (economic buyer, technical evaluator, end user champion, legal/procurement blocker) and note how their content needs differ.

For B2C personas, always document **identity and values** -- the persona is not just solving a functional problem. They are also choosing who they want to be, what community they belong to, and what their purchase or content consumption says about them.

### Step 3: Build Demographic and Firmographic Attributes

Document concrete, specific attributes -- never ranges so wide they apply to everyone:

**For B2B personas:**
- Job title (primary) and common alternative titles for the same role (secondary) -- e.g., "VP of Marketing, sometimes Director of Demand Generation, sometimes Head of Growth"
- Company size by employee count AND by revenue range (these do not always correlate). A 50-person company in fintech operates differently than a 50-person company in e-commerce.
- Growth stage: bootstrapped/lifestyle, early-stage startup (pre-Series A), growth-stage (Series A-C), scale-up (post-Series D), mid-market, or enterprise. This determines urgency, budget fluidity, and decision-making speed.
- Industry vertical and any sub-vertical nuances (not "technology" -- specify "B2B SaaS for HR teams" or "cloud infrastructure for financial services")
- Years in role and total career experience -- someone three years into a VP role has different anxieties than someone who just got promoted
- Team size they manage -- a marketing leader with a team of 12 has different leverage constraints than one with a team of 2
- Decision-making authority: primary budget holder, co-approver, influencer who creates shortlists, or end user who generates internal demand

**For B2C personas:**
- Age range (keep it to a 10-12 year span at most -- "25-55" is not useful)
- Life stage context: student, early career, establishing career, partnered without children, parent of young children, empty nester, pre-retirement -- these drive scheduling, spending, and priority constraints more than age alone
- Household income range (expressed as a spending behavior: "comfortable spending $200 on an online course without requiring spousal approval" is more actionable than "$80,000 household income")
- Geographic context: urban/suburban/rural matters for distribution channel assumptions; regional and national differences matter for reference points and cultural vocabulary
- Education level as a proxy for content sophistication and trust in credentialed sources

**Across all types:**
- Annotate every attribute as either **[Validated]** (confirmed by data) or **[Hypothesis]** (inferred from reasoning). This is not optional. It tells content creators and decision-makers where the risks are.

### Step 4: Map Pain Points, Motivations, and the Jobs-to-Be-Done Framework

This is the most important section and the most commonly done poorly. Pain points listed as generic frustrations produce useless personas. Use the Jobs-to-Be-Done (JTBD) framework to add depth:

**The JTBD structure:** Every persona "hires" a product, service, or piece of content to do a specific job. The job has three dimensions:
- **Functional job:** What they are literally trying to accomplish ("produce eight blog posts a month without increasing headcount")
- **Emotional job:** How they want to feel while accomplishing it or after ("confident that the content quality reflects well on me professionally")
- **Social job:** How they want to be perceived by others as a result ("seen by my CEO as running a modern, efficient marketing function")

For each pain point, document all three dimensions. Most personas only document the functional dimension and miss the emotional and social drivers that actually determine what content resonates.

**Pain point specificity rules:**
- Every pain point must be written in first-person, from the persona's perspective: "I spend three hours every week editing freelance drafts that miss the technical nuance of our audience" -- not "needs better content quality"
- Every pain point must have a **frequency dimension**: Is this a daily frustration, a weekly problem, or a quarterly crisis? Frequency determines urgency and therefore content timing
- Every pain point must connect to a **consequence**: What happens if the pain is not resolved? Missed revenue target, missed promotion, public failure, team turnover? Consequences determine how motivated the persona is to seek solutions
- Limit primary pain points to 3-5. More than 5 signals that you have multiple personas collapsed into one, or that you have not prioritized

**Motivation framing:**
- Document both **toward motivations** (positive outcomes the persona is chasing: growth, recognition, efficiency, career advancement) and **away motivations** (negative outcomes they are trying to avoid: losing budget, looking incompetent, falling behind competitors, getting fired)
- Away motivations drive more urgent content consumption than toward motivations. Loss aversion is stronger than gain seeking. A persona more afraid of losing their budget than excited about growing it will respond to different content framing.

### Step 5: Build the Vocabulary Map

The vocabulary map is the highest-leverage output in the entire persona document. It directly translates into headline copy, SEO keyword targeting, sales messaging, and content brief language. Treat it as a translation dictionary between how the audience talks and how companies talk.

**How to build a rigorous vocabulary map:**

- **Mine primary sources:** The most valuable vocabulary data comes directly from the audience. Pull language from: product reviews on G2, Capterra, or Trustpilot; Reddit threads in relevant subreddits; LinkedIn posts and comments from people in the persona's role; Quora answers; job postings that describe responsibilities this persona has (job postings reveal the vocabulary of a role because they are written to attract the person, not impress executives); support ticket subject lines; sales call transcripts; NPS open-text responses
- **Identify the vocabulary gap:** Map the difference between how the company describes its solution versus how the audience describes their problem. This gap is where most content marketing fails. A company that sells "enterprise content operations platforms" serves people who say "I need to get off this spreadsheet and stop losing track of drafts"
- **Document search query language:** Real search queries are the closest thing to unfiltered audience language. Ask the user for their top organic search queries from Google Search Console. If unavailable, use the "People Also Ask" and "Related Searches" sections for seed keywords to infer the actual language the persona uses when searching
- **Categorize vocabulary by intent:** Awareness-stage vocabulary ("why does my team keep missing content deadlines") differs from consideration-stage vocabulary ("content marketing agency vs. in-house team") differs from decision-stage vocabulary ("content agency pricing B2B SaaS"). Document all three if content strategy is the use case
- **Flag emotional vocabulary:** Words that carry emotional weight are more important than neutral descriptors. "Embarrassed" is more useful than "frustrated." "Overwhelmed" is more useful than "busy." Emotional vocabulary signals the intensity of the pain and reveals the right register for content

**Resistance vocabulary:** Document words and phrases that create friction, skepticism, or disengagement. Common patterns:
- Corporate jargon the audience has learned to dismiss ("leverage," "synergy," "holistic," "best-in-class")
- Buzzwords that signal inauthenticity to technically sophisticated audiences ("AI-powered everything," "disruptive," "game-changing")
- Category labels the audience does not self-identify with (a solo developer who uses your tool does not describe himself as an "enterprise software professional")

### Step 6: Define Content and Channel Preferences

Map content preferences to the audience's actual context, not an idealized version of it:

**Format preferences by role and behavior:**
- Time-constrained professionals (C-suite, founders) prefer skimmable formats: executive summaries, bullet-heavy posts, short video, audio (consumed during commute or exercise). They will not read 3,000-word guides during the workday.
- Practitioners (managers, individual contributors doing the work) prefer detailed how-to content with specific examples, templates, and step-by-step processes. They will invest 20-30 minutes in a guide if it saves them hours of work.
- Technical audiences (developers, data teams, security engineers) prefer documentation-style content, code examples, benchmarks, and peer-written content. They trust technical specificity over polished prose.
- Decision-makers evaluating purchases prefer comparison content, case studies with named clients and specific metrics, and third-party validation (analyst reports, peer reviews, reference calls).

**Channel behavior specifics:**
- LinkedIn is the dominant B2B content channel but behavior varies by segment. C-suite scrolls LinkedIn on mobile for 10-15 minutes. Individual contributors read longer posts and click through to full articles. Job title targeting works in paid but organic reach depends heavily on the poster's network.
- Email newsletters have a comeback in B2B because inbox is still where professionals manage work. Note whether the persona treats newsletters as reading material (saved for later) or ambient scanning (read subject line and snippet, delete or archive).
- Podcasts have high loyalty but long purchase consideration cycles. Personas who consume podcast content have often been in relationship with a brand for 3-12 months before converting.
- YouTube has displaced Google for how-to searches for visual workflows, software walkthroughs, and comparison reviews. If the persona is learning a new skill or evaluating software, YouTube is often the first research channel, not Google.
- Reddit and niche communities (Slack groups, Discord servers, private forums) are where authentic peer-to-peer information exchange happens. Personas who participate in communities have higher brand trust thresholds and higher resistance to corporate content.

**Content depth calibration:**
- Map content depth preference to the persona's **decision stage** -- not their role. A first-time VP of Marketing evaluating content agencies for the first time will consume more educational content than a repeat buyer who just needs vendor comparison data. Do not assume experienced personas want short content; they want precise content.
- Document content consumption constraints: Does the persona read on a second monitor while working? On a phone during a commute? At a desk with focused attention? Physical and temporal context determines what formats are practical.

**Trust signals by persona type:**
- B2B buyers trust: Named case studies with specific company names and metrics (not "a Fortune 500 company"), analyst endorsements, peer reviews from similar-sized companies, detailed ROI calculations, and references from people in their network
- Technical audiences trust: Benchmarks with disclosed methodology, open-source code, conference talks from practitioners, documentation quality, and the ability to try before buying
- B2C consumers trust: Real user reviews with photos or video, endorsements from people who look and live like them (not celebrities), before/after evidence, and transparent ingredient/process information

### Step 7: Define Trigger Moments and the Decision Journey

Trigger moments are the events that transform a passive audience member into an active information seeker. Documenting them accurately is what separates a useful persona from a generic one.

**Trigger moment categories:**
- **External event triggers:** Industry change, competitive move, regulatory requirement, technology shift, or economic pressure that creates sudden urgency ("our biggest competitor just published a 50-page industry report and we have nothing")
- **Internal performance triggers:** A metric crosses a threshold, a project fails, a deadline is missed, or an audit reveals a gap ("content pipeline is empty for the next six weeks")
- **Career event triggers:** New job, new responsibility, promotion, performance review, or quarterly planning cycle that forces the persona to evaluate their current approach ("just became VP of Marketing and I need to show results in 90 days")
- **Social proof triggers:** Peer success or peer failure that makes the persona reconsider their current approach ("two people in my LinkedIn network just shared results from a content strategy I have not tried")
- **Capacity triggers:** Team change (someone leaves, new hire is onboarding slowly, agency contract ends) that creates a resource gap

For each trigger moment, document:
- The specific event
- The emotional state it produces (urgency, anxiety, ambition, embarrassment)
- The first action the persona takes (searches Google, asks peers on LinkedIn, opens their email archive looking for vendor recommendations, calls a trusted colleague)
- The content format most useful at that moment (they will not watch a 45-minute webinar in a moment of crisis; they will Google and read the first three results)

**The decision journey for B2B personas:**

Map the buying committee at each stage. Use a simplified version of the customer decision journey:

1. **Problem recognition:** Someone on the team names the problem. Often not the buyer -- often an individual contributor who experiences the friction daily.
2. **Internal search:** The team asks internally -- "has anyone dealt with this before?" LinkedIn network, Slack, email.
3. **Category search:** The buyer searches for the category of solution, often using imprecise vocabulary. This is where SEO and awareness content matters.
4. **Vendor identification:** A shortlist of 3-5 vendors is assembled, usually within 2-4 weeks for SMB, 2-3 months for enterprise.
5. **Evaluation:** Deep dive on shortlisted vendors. Case studies, demos, reference calls, pricing comparison. Champion/blocker dynamics play out here.
6. **Decision and approval:** Final vendor is selected; budget is approved. For purchases above $10K/year at a 50-200 person company, typically requires CEO or CFO sign-off.

The content strategy for this persona must address all six stages, not just awareness.

### Step 8: Build the Validation Plan and Label Hypothesis Attributes

Every persona contains a mix of validated facts and educated hypotheses. The validation plan turns hypotheses into evidence over time. A persona without a validation plan is a creative writing exercise, not a strategic tool.

**Validation method priority (highest to lowest evidence quality):**
1. **Customer interviews:** 30-45 minute conversations with actual customers or prospects. Aim for 5-8 interviews per persona segment to identify patterns. Fewer than 5 interviews may reflect outliers. Ask about past behavior ("tell me about the last time you looked for a solution like this"), not hypothetical future behavior ("would you use a feature like X").
2. **Survey data:** Quantitative validation of patterns found in interviews. A survey of 50-150 respondents can confirm or disprove frequency assumptions about pain points. Use a Likert scale for pain point ranking and open-text fields for vocabulary mining.
3. **Win/loss analysis:** Review of closed-won and closed-lost deals with explicit capture of stated buying reasons. Even 10 win/loss records can validate or disprove the trigger moments in a persona.
4. **Analytics data:** Website analytics (pages visited, time on page, scroll depth, traffic source by landing page), search query data (Google Search Console), and email analytics (subject line open rates as a proxy for vocabulary resonance).
5. **Social listening and community monitoring:** Reddit, LinkedIn comments, industry Slack communities, and niche forums provide unfiltered real-time language. Look for recurring phrases, recurring complaints, and recurring questions.
6. **Competitor review mining:** G2, Capterra, TrustRadius, Amazon, and Yelp reviews of competitors contain detailed pain point and vocabulary data from the exact audience you are targeting.

For each unvalidated attribute in the persona, assign it to a specific validation method and a specific action the user can take in the next 30-60 days.

---

## Output Format

```
## Audience Persona: [Descriptive Persona Name That Reflects Their Situation]

**One-liner:** [Who they are in their professional or life context] + [the core problem that brings them to this category] + [what success looks like for them in one sentence]

**Persona type:** [B2B Buyer / B2B User / B2C Consumer / Media Audience]
**Validation status:** [Fully validated / Partially validated (note which sections) / Hypothesis only]
**Date created:** [Month, Year]
**Last reviewed:** [Month, Year or "Not yet reviewed"]

---

### 1. Demographics and Firmographic Profile

| Attribute | Detail | Validation Status |
|-----------|--------|------------------|
| Primary role/title | [Specific title] | [Validated / Hypothesis] |
| Common alternative titles | [2-3 equivalent titles] | [Validated / Hypothesis] |
| Industry (specific) | [Vertical and sub-vertical] | [Validated / Hypothesis] |
| Company size (employees) | [Range, e.g., 50-200 employees] | [Validated / Hypothesis] |
| Company stage/revenue | [Growth stage and revenue range] | [Validated / Hypothesis] |
| Team size managed | [Number of direct reports] | [Validated / Hypothesis] |
| Years of experience | [Range in career / range in role] | [Validated / Hypothesis] |
| Decision authority | [Primary buyer / Co-approver / Influencer / End user] | [Validated / Hypothesis] |
| Budget authority | [Amount they can approve independently] | [Validated / Hypothesis] |
| Age range | [10-12 year range if relevant] | [Validated / Hypothesis] |
| Geographic context | [Region / Urban-suburban-rural / Remote-office split] | [Validated / Hypothesis] |

---

### 2. Jobs to Be Done

| Job Type | What They Are Trying to Accomplish |
|----------|----------------------------------|
| Functional job | [The literal task or outcome they need to achieve] |
| Emotional job | [How they want to feel during or after achieving it] |
| Social job | [How they want to be perceived by peers, leadership, or team] |

---

### 3. Pain Points

*Each pain point written in first-person from the persona's perspective.*

**Pain Point 1 -- [Label]**
> "[First-person statement of the pain]"
- **Frequency:** [Daily / Weekly / Monthly / Quarterly / Event-triggered]
- **Consequence if unresolved:** [What happens if they do not solve this]
- **What they have already tried:** [Specific attempted solutions and why they failed]

**Pain Point 2 -- [Label]**
> "[First-person statement of the pain]"
- **Frequency:** [Frequency]
- **Consequence if unresolved:** [Consequence]
- **What they have already tried:** [Attempted solutions]

**Pain Point 3 -- [Label]**
> "[First-person statement]"
- **Frequency:** [Frequency]
- **Consequence if unresolved:** [Consequence]
- **What they have already tried:** [Attempted solutions]

*(Add Pain Points 4-5 if validated; do not add more than 5 without splitting into a second persona)*

---

### 4. Motivations: Toward and Away

| Direction | Motivation | Emotional Intensity (1-5) |
|-----------|-----------|--------------------------|
| Toward | [Positive outcome they are actively pursuing] | [1=mild, 5=driving force] |
| Toward | [Second positive outcome] | [Intensity] |
| Toward | [Third positive outcome] | [Intensity] |
| Away | [Negative outcome they most want to avoid] | [Intensity] |
| Away | [Second negative outcome] | [Intensity] |

---

### 5. Buying Committee (B2B Only)

| Role in Buying Process | Typical Title | Their Primary Concern | Content They Need |
|-----------------------|--------------|----------------------|------------------|
| Economic buyer | [Title] | [ROI, budget risk, strategic fit] | [Content type] |
| Champion | [Title] | [Solving the day-to-day problem] | [Content type] |
| Technical evaluator | [Title] | [Integration, security, scalability] | [Content type] |
| Blocker/Skeptic | [Title] | [Risk, change management, vendor reliability] | [Content type] |
| End user | [Title] | [Ease of use, time savings] | [Content type] |

---

### 6. Vocabulary Map

| They Say | They Mean | Underlying Intent | Do NOT Say |
|----------|----------|-------------------|-----------|
| "[Their phrase]" | [What they mean by it] | [Functional or emotional intent] | "[Company jargon to avoid]" |
| "[Their search query]" | [What they are really asking] | [Stage of awareness] | "[Term that creates friction]" |
| "[Their complaint phrasing]" | [The pain it represents] | [Away motivation] | "[Polished marketing synonym]" |
| "[Their success phrasing]" | [What good looks like to them] | [Toward motivation] | "[Feature-first language]" |

**Awareness-stage vocabulary:**
- [3-5 search queries or phrases used when the persona first realizes they have a problem]

**Consideration-stage vocabulary:**
- [3-5 queries or phrases used when comparing solutions]

**Decision-stage vocabulary:**
- [3-5 queries or phrases used when close to purchasing or committing]

---

### 7. Content and Channel Preferences

| Attribute | Preference | Notes |
|-----------|-----------|-------|
| Preferred formats | [List, e.g., case studies, how-to guides, comparison posts] | [Why this format works for this persona] |
| Content depth | [Word count range or time investment] | [Context for why this depth] |
| Primary channels | [Ranked list] | [How they use each channel] |
| Consumption context | [When and where they consume content] | [Device, time of day, attention level] |
| Trust signals | [What makes a source credible to them] | [Specific evidence types] |
| Content they avoid | [Formats or tones that create resistance] | [Why] |
| Newsletter behavior | [Reader / Skimmer / Archiver] | [Engagement pattern] |
| Community participation | [Lurker / Active commenter / Creator] | [Relevant communities] |

---

### 8. Trigger Moments and Decision Journey

**Trigger moments (ordered by urgency they create):**

1. **[Trigger Name] -- [High / Medium / Low urgency]**
   - What happens: [Specific event]
   - Emotional state produced: [Specific emotion]
   - First action they take: [Search behavior, peer outreach, etc.]
   - Best content format at this moment: [Format and why]

2. **[Trigger Name] -- [Urgency]**
   - What happens: [Event]
   - Emotional state: [Emotion]
   - First action: [Behavior]
   - Best content: [Format]

3. **[Trigger Name] -- [Urgency]**
   - What happens: [Event]
   - Emotional state: [Emotion]
   - First action: [Behavior]
   - Best content: [Format]

*(Add 2-3 more trigger moments as needed)*

**Decision journey stage map (B2B):**

| Stage | What They Are Doing | Content That Serves Them |
|-------|--------------------|-----------------------|
| Problem recognition | [Specific behavior] | [Content type and example topic] |
| Internal search | [Specific behavior] | [Content type and example topic] |
| Category search | [Specific behavior + search vocabulary] | [SEO content type] |
| Vendor identification | [Comparison behavior] | [Comparison and social proof content] |
| Evaluation | [Deep research behavior] | [Case studies, demos, references] |
| Decision/approval | [Internal stakeholder management] | [ROI calculators, executive summaries] |

---

### 9. Barriers and Objections

| Barrier | Root Cause | How to Overcome It in Content |
|---------|-----------|-------------------------------|
| [Barrier 1] | [Why this barrier exists -- historical, psychological, organizational] | [Specific content approach] |
| [Barrier 2] | [Root cause] | [Content approach] |
| [Barrier 3] | [Root cause] | [Content approach] |
| [Barrier 4] | [Root cause] | [Content approach] |

---

### 10. Validation Plan

| Assumption to Validate | Current Status | Validation Method | Specific Action | Timeline |
|-----------------------|---------------|------------------|----------------|----------|
| [Demographic assumption] | [Hypothesis] | [Customer interview] | [Specific question to ask] | [30-60-90 days] |
| [Pain point assumption] | [Partial data] | [Win/loss analysis] | [Specific data to pull] | [Timeline] |
| [Vocabulary assumption] | [Hypothesis] | [Review mining] | [Specific source to analyze] | [Timeline] |
| [Channel assumption] | [Hypothesis] | [Analytics] | [Specific metric to check] | [Timeline] |
| [Trigger moment assumption] | [Hypothesis] | [Sales call review] | [Specific pattern to look for] | [Timeline] |

---

### 11. Content Strategy Implications

*3-5 direct implications for content strategy, messaging, or channel investment based on this persona.*

1. [Implication 1 -- specific and actionable, e.g., "Lead with loss-aversion framing rather than gain framing because the dominant away motivations outrank toward motivations"]
2. [Implication 2]
3. [Implication 3]
4. [Implication 4]
5. [Implication 5]
```

---

## Rules

1. **Never conflate the buyer and the user.** In B2B especially, the person who signs the contract is frequently not the person who experiences the problem. Build separate profiles or clearly document both roles within one persona document if they overlap in the same individual. Conflating them produces content that speaks to neither.

2. **Never state a pain point from the company's perspective.** "Needs better reporting tools" is company language. "I spend 90 minutes every Monday building a report I could automate if I had the right setup, and it makes me feel like I am wasting my most productive hours of the week" is persona language. The difference is not stylistic -- it determines headline copy, email subject lines, and landing page structure.

3. **Never build a persona without a validation status label on every attribute.** An unlabeled persona implies all attributes are equally reliable. They are not. A "VP of Marketing" label that came from actual CRM data is not the same as a "VP of Marketing" that came from a founder's intuition. Mixing them without labeling them produces false confidence.

4. **Never create more than 3 personas for a single content program.** If the user insists on more, push back. More than 3 personas typically signals either (a) an under-defined product that has not found its audience, or (b) personas built on surface demographic differences (age, gender, geography) rather than behavioral and need-based differences. The test: if two personas have nearly identical pain points, vocabulary, and trigger moments but different demographics, they are one persona with demographic range, not two personas.

5. **Never skip the vocabulary map.** The vocabulary gap between how companies describe their solutions and how audiences describe their problems is the single largest cause of content that does not convert. A persona document without a vocabulary map gives writers demographic data but no language to work with. Demographics do not write headlines -- vocabulary does.

6. **Never use demographic attributes as proxies for behavior.** "Millennials who prefer digital content" is not a behavioral insight -- it is a demographic label with an assumption attached. "Marketing managers who discovered their current knowledge gap via a LinkedIn post and immediately opened two browser tabs to research solutions" is a behavioral observation. The difference is what allows content to meet the audience at their actual moment of need.

7. **Always document away motivations alongside toward motivations.** Away motivations (what the persona is trying to avoid) typically drive more urgent behavior than toward motivations. A persona more afraid of missing their pipeline target than excited about hitting a stretch goal will respond to fear-of-loss content framing. Ignoring away motivations produces content that is too aspirational and not urgent enough.

8. **Always map vocabulary by buyer journey stage.** The language a persona uses when they first realize they have a problem is completely different from the language they use when evaluating vendors. Awareness-stage content that uses decision-stage vocabulary will be ignored because it does not match the persona's current mental model. A vocabulary map that ignores journey stage is only useful for one stage of the funnel.

9. **Always include at least 4 trigger moments.** Trigger moments are the operational link between the persona's pain and the content program's timing. Without them, content teams produce content on an arbitrary schedule with no understanding of when the audience is most receptive. Three trigger moments is a minimum -- four or five gives the content team enough variety to plan across the calendar.

10. **Always specify a validation timeline in the validation plan.** A validation plan without timelines becomes a permanent backlog. Each validation action should have a 30, 60, or 90-day deadline attached. Personas that are never validated become the outdated documents that content teams ignore two years after they were built.

11. **When creating a persona for a new market (no existing customers), build a "minimum viable persona" with only the attributes you can infer with reasonable confidence.** Label every attribute as hypothesis. Do not fabricate specificity to fill in a template. A spartan, honest hypothesis persona with a rigorous validation plan is more useful than a detailed persona built on invented specificity.

12. **Always distinguish between content the persona actively seeks and content they passively receive.** Content that interrupts them (paid social, email) must earn attention in 3-4 seconds. Content they seek out (search, community recommendations) can assume higher intent and interest. The same persona has radically different receptivity depending on the channel and whether they initiated the interaction.

---

## Edge Cases

### 1. The User Has No Existing Customers (Pre-Launch or New Market Entry)

Build a hypothesis persona using proxy evidence from adjacent sources:
- **Competitor review mining:** Pull 50-100 reviews of the closest competitor from G2, Capterra, TrustRadius, or relevant app stores. Code reviews for pain points mentioned, vocabulary used, and outcomes praised. This is the highest-quality proxy data available for a pre-launch persona.
- **Job posting analysis:** Search for job postings that describe a role that would use or buy the product. The responsibilities and "must have" requirements sections describe the persona's daily reality in their own organization's language. Collect 15-20 job postings and identify recurring phrases.
- **Community observation:** Identify 2-3 Reddit communities, LinkedIn groups, or Slack communities where the target persona is active. Read 30-60 posts or threads asking for help with the problem your product solves. This is unfiltered language and real trigger moment documentation.
- **Label every attribute as [Hypothesis].** Set a 60-day validation plan that prioritizes 5 customer discovery interviews before the persona is used to make significant content investment decisions.

### 2. The User Serves Both B2B and B2C Audiences Simultaneously

Never combine B2B and B2C in a single persona. The buying process, vocabulary, channel behavior, trust signals, and content preferences are structurally different enough that a combined persona produces content that serves neither audience well. Build two separate persona documents and flag the interaction point if applicable (e.g., the B2C consumer is also the employee at a B2B company that might become a customer -- document this only as a note, not as a merged persona).

When building both:
- B2B persona: Start with firmographic attributes and buying committee structure. Pain points are professional and consequential -- they relate to career risk, budget accountability, and organizational performance.
- B2C persona: Start with life stage context and identity/values. Pain points are personal -- they relate to time, money, self-image, family, or personal aspiration.

### 3. The User Has a Highly Technical or Niche Audience

Technical audiences have extremely low tolerance for imprecision and extremely high sensitivity to vocabulary errors. A single incorrect use of a technical term destroys credibility with this persona faster than any other audience type. Handle this edge case by:
- Dedicating extra depth to the vocabulary map. In technical personas, the vocabulary map is the most important section.
- Documenting what the persona considers "lazy content" -- broad overviews, surface-level how-tos, listicles with no technical depth, content that could apply to any tool or any problem. Technical personas reject this content immediately.
- Noting the persona's existing knowledge baseline. Technical content should start two levels above "beginner" unless the persona is explicitly learning a new technology. Explaining what an API is to a software engineer is an instant credibility killer.
- Identifying the peer sources the technical persona trusts. Conference talks (especially practitioner-delivered talks at events like Strange Loop, DockerCon, or KubeCon), open-source repository readmes, technical blog posts written by engineers (not marketing), and documentation quality are the primary trust signals for technical audiences.

### 4. The Audience Spans Multiple Experience Levels Within the Same Role

When a VP of Marketing can be a first-time VP promoted from within, or a seasoned executive with 20 years of experience, the shared job title masks radically different needs, confidence levels, and content preferences. Do not average them into one persona -- tiered personas serve both better:
- **The New-to-Role Persona:** High anxiety, more hungry for frameworks and best practices, more responsive to "how to" and "guide" content formats. Searches frequently for validation that their approach is correct.
- **The Experienced Practitioner Persona:** Lower tolerance for basic content, more interested in new research, benchmarks, or edge cases. Seeks peer validation from others at their level. More likely to engage with original data and contrarian perspectives than with foundational guides.

Build two sub-personas with a shared demographic header and separate pain point, vocabulary, and content preference sections. Note where they overlap.

### 5. The User Wants Personas for a Platform Serving Multiple Sides of a Marketplace

Marketplace businesses (job boards, freelance platforms, booking platforms, SaaS with both sellers and buyers) have at minimum two structurally different audiences with opposing motivations. The persona for the supply side (freelancers, job seekers, vendors) and the demand side (employers, buyers, brands) require completely separate documents. Resist any attempt to merge them. The content strategy, channel selection, vocabulary, and trigger moments for each side are almost entirely non-overlapping.

Additionally, note the chicken-and-egg dynamic in the trigger moments section: supply-side personas are often triggered by demand-side behavior and vice versa. Document this interdependency explicitly if the user's content strategy needs to grow both sides simultaneously.

### 6. The Persona Has Emerged Through Company Growth and Is Now Outdated

If the user presents an existing persona document from 12+ months ago and asks to update it:
- Do not start from scratch. Treat the existing document as a hypothesis baseline and run a structured validation pass.
- Check every attribute against recent evidence: Has the job market for this role changed? Have industry norms shifted? Has the competitive landscape introduced new vocabulary? Has remote work, economic conditions, or technology change altered the persona's context?
- Specifically re-examine the vocabulary map and channel preferences -- these change the fastest. A channel preference documented in 2021 may be completely wrong in 2024 (Clubhouse, Google Podcasts, and Twitter's organic reach are obvious examples of channels that have changed dramatically).
- Mark every unverified attribute from the old document as [Needs Revalidation] rather than as Validated.

### 7. The User Needs a Persona for Content That Converts a Skeptical or Resistant Audience

Some audiences have high default resistance to commercial content: security professionals, developers, healthcare practitioners, academics, and experienced procurement managers are trained to be skeptical of vendor content. For these personas:
- Document the skepticism itself as a persona attribute, not just as a barrier. It is structural, not situational.
- The vocabulary map must specifically include the phrases that trigger dismissal ("we leverage AI to deliver enterprise-grade...") alongside the phrases that earn credibility ("our architecture uses edge caching at the CDN layer because...").
- The trust signals section becomes the most critical section after vocabulary. For highly skeptical personas, third-party validation (independent reviews, academic citations, public benchmarks), technical transparency (open methodology, disclosed limitations), and anti-marketing tone (stating what the product does NOT do) outperform all standard marketing approaches.
- Trigger moments for skeptical personas are often driven by failure of the status quo -- they do not move until their current approach breaks visibly. Document the specific failure events that create openness.

---

## Example

**Input:** "We are a B2B SaaS company selling a project management tool specifically built for creative agencies -- design firms, ad agencies, video production companies. The typical buyer is the operations director or studio manager who is responsible for keeping projects on track and teams staffed to the right projects. We have about 40 customers, most of them agencies with 15-75 employees. We need a persona to brief our content team."

**Output:**

---

## Audience Persona: The Studio Manager Holding Everything Together

**One-liner:** An operations director or studio manager at a small-to-mid-size creative agency who carries the organizational burden of keeping 15-60 creative professionals on deadline, on budget, and allocated to the right projects -- without the enterprise operations tools built for their scale or the industry-specific context that generic project management software ignores.

**Persona type:** B2B Buyer (primary) / B2B User (secondary -- also the daily user)
**Validation status:** Partially validated -- demographics and pain points from 40 customer profiles; vocabulary and trigger moments are hypothesis pending sales call review
**Date created:** November 2024
**Last reviewed:** November 2024

---

### 1. Demographics and Firmographic Profile

| Attribute | Detail | Validation Status |
|-----------|--------|------------------|
| Primary role/title | Operations Director, Studio Manager | Validated |
| Common alternative titles | Director of Project Management, Head of Production, Chief of Staff, Traffic Manager | Hypothesis |
| Industry (specific) | Creative agency -- design, advertising, video production, brand strategy | Validated |
| Company size (employees) | 15-75 employees (sweet spot: 25-50) | Validated |
| Company stage/revenue | Established agency, $2M-$12M annual revenue, not VC-backed | Validated |
| Team size managed | 0-2 direct reports; coordinates across 10-60 indirect staff | Validated |
| Years of experience | 5-15 years in agency operations; 2-5 years in current role | Hypothesis |
| Decision authority | Primary influencer and champion; budget holder is typically the agency owner/CEO | Validated |
| Budget authority | Can approve tools up to $500-$1,500/month independently; above that needs owner sign-off | Hypothesis |
| Age range | 30-45 | Hypothesis |
| Geographic context | US, UK, Australia primarily; mid-size city or urban; mostly in-office or hybrid | Hypothesis |

---

### 2. Jobs to Be Done

| Job Type | What They Are Trying to Accomplish |
|----------|----------------------------------|
| Functional job | Keep all active projects staffed correctly and on deadline so the agency can bill what it estimates, deliver what it promises, and avoid the chaos of last-minute resource reshuffling |
| Emotional job | Feel in control of a system that is inherently unpredictable -- and feel seen as the person who makes the agency function, not just the person who fixes things when they break |
| Social job | Be recognized by agency leadership and creative staff as the person whose systems enable creative excellence -- not the bureaucratic enforcer who slows creative work down |

---

### 3. Pain Points

**Pain Point 1 -- The Spreadsheet System That Everyone Ignores**
> "I have a resource allocation spreadsheet that I update every Monday morning, and by Monday afternoon it is already wrong because three projects changed scope and two designers updated their availability without telling me. I am constantly working from stale data."
- **Frequency:** Daily -- this is the persistent ambient pain of the role
- **Consequence if unresolved:** Designers get double-booked, client work gets delayed, the agency takes a financial hit from scope creep it cannot track, and the operations director gets blamed for chaos they did not create
- **What they have already tried:** More elaborate spreadsheets, shared Google Sheets with edit notifications, trying to enforce a daily check-in process that creative staff ignore, bribing project leads with Slack reminders

**Pain Point 2 -- Generic Project Management Tools Designed for Software Teams**
> "I have tried Asana, Monday.com, and ClickUp. They all work fine if you are a software development team. They do not understand that our 'sprint' is a photo shoot with 12 freelancers, a client approval process that takes however long it takes, and a deliverable that cannot be broken into Jira tickets."
- **Frequency:** Acute during tool evaluation phases; ongoing as a low-grade frustration when workarounds accumulate
- **Consequence if unresolved:** The tool gets abandoned, staff revert to email and Slack, and the operations director loses credibility for the failed implementation
- **What they have already tried:** All three major project management platforms named above, plus custom-built solutions in Notion and Airtable that required weeks of setup and still do not handle retainer billing tracking or creative feedback rounds

**Pain Point 3 -- Capacity Blindness During New Business Pitches**
> "The owner walks in and says we just pitched a new client and it looks like we are going to win. I have 20 minutes to figure out whether we can actually take on this project without burning out the team or missing existing deadlines. I am guessing, and I know I am guessing."
- **Frequency:** Monthly -- tied to the agency's new business cycle
- **Consequence if unresolved:** The agency either declines work it could take or accepts work it cannot deliver, both of which damage the agency's trajectory
- **What they have already tried:** Capacity planning in spreadsheets, gut-feel conversations with creative leads, trying to maintain a forward-looking calendar that never stays current

**Pain Point 4 -- Freelancer Coordination Overhead**
> "I manage a bench of 15-20 freelancers in addition to the full-time team. Onboarding a freelancer into whatever project management system we are using this year, getting them the right files, briefing them on the project -- it takes half a day every time and most of them are only on the project for a week or two."
- **Frequency:** Weekly -- agencies of this size use freelancers constantly to handle volume spikes
- **Consequence if unresolved:** Freelancer onboarding time erodes margin on projects that already have tight budgets; freelancers deliver out of context because they never got properly briefed
- **What they have already tried:** Freelancer intake documents in Google Docs, Slack channels per project, Dropbox folders per client -- all of which require the operations director to manually manage information distribution

**Pain Point 5 -- No Clear Data When the Owner Asks "How Are We Doing?"**
> "Every quarter the owner asks me to put together a summary of project profitability, team utilization, and whether we are on track with our biggest clients. I spend two days pulling this together from four different places and the numbers are always approximate."
- **Frequency:** Quarterly for formal reporting; the underlying data gap is constant
- **Consequence if unresolved:** Agency leadership makes pricing, hiring, and growth decisions on approximate data; the operations director cannot make the case for hiring when they cannot prove current utilization rates
- **What they have already tried:** Harvest for time tracking (disconnected from project planning), Xero for invoicing (disconnected from project status), manual reconciliation in Excel every quarter

---

### 4. Motivations: Toward and Away

| Direction | Motivation | Emotional Intensity (1-5) |
|-----------|-----------|--------------------------|
| Toward | Run the agency's operations well enough that the creative team can focus entirely on creative work | 5 |
| Toward | Build systems that scale -- so the agency can double in size without doubling the chaos | 4 |
| Toward | Get recognized as a strategic contributor, not just a logistical coordinator | 4 |
| Away | Avoid being the reason a client deliverable is late | 5 |
| Away | Avoid another failed tool implementation that the creative team mocks as "the operations director's new obsession" | 5 |
| Away | Avoid the agency owner discovering a capacity or profitability problem they should have seen coming | 4 |

---

### 5. Buying Committee

| Role in Buying Process | Typical Title | Their Primary Concern | Content They Need |
|-----------------------|--------------|----------------------|------------------|
| Champion (our persona) | Operations Director, Studio Manager | Does this solve the specific problems of creative agency operations? Does it actually work for a team of designers? | Detailed how-to content, case studies from similar agencies, free trial |
| Economic buyer | Agency Owner, Managing Director | Will this save money, reduce missed billing, or let us take on more work without hiring? What is the ROI? | ROI calculator, named case studies with revenue or margin impact metrics, 10-minute executive overview |
| Skeptic/Blocker | Creative Director, Lead Designer | Will this slow me down with bureaucratic overhead? Will I be tracked and reported on? | Content that explicitly addresses the "this will not add process burden to creative staff" concern |
| End user | Designers, Project Managers, Account Managers | Is this easy to use daily? Does it fit how I actually work? | Onboarding guides, video walkthroughs, template libraries they can adopt immediately |

---

### 6. Vocabulary Map

| They Say | They Mean | Underlying Intent | Do NOT Say |
|----------|----------|-------------------|-----------|
| "Resourcing" or "staffing projects" | Allocating specific team members to specific projects based on skills and availability | Functional -- capacity management | "Resource management" (sounds like enterprise HR software) |
| "Traffic management" | Routing incoming work requests to the right people and tracking progress | Functional -- workflow routing | "Work intake optimization" |
| "The chaos" | The unpredictable, constantly shifting nature of creative project work | Away motivation -- they want to reduce it | "Dynamic work environment" |
| "Creative teams are different" | Our team has deep professional identity around not being managed like a software development team | Social -- they need tools that respect creative work | "Agile for creatives" |
| "Utilization" | What percentage of each team member's time is billable to a client vs. on overhead | Functional -- profitability measurement | "
