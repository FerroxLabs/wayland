---
name: customer-persona
description: |
  Produces a detailed buyer persona using Jobs-to-be-Done framework with
  demographics, pain points, goals, buying triggers, decision criteria, and
  vocabulary. Use when the user asks to create a customer persona, define
  target buyer, build an ideal customer profile, or understand their audience
  for marketing or product decisions.
  Do NOT use for market segmentation strategy (use go-to-market-strategy),
  customer journey across touchpoints (use customer-journey-map), or
  competitive positioning (use competitive-analysis).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy marketing planning research"
  category: "business-strategy"
  subcategory: "strategy-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Customer Persona

## When to Use

Use this skill when the user needs a structured, research-grounded portrait of a specific type of buyer or user that will drive real decisions about messaging, product features, sales scripts, or content strategy.

**Use when:**
- The user asks to create, build, or document a buyer persona, user persona, or ideal customer profile (ICP) for B2B or B2C contexts
- The user wants to understand why a specific customer type buys, what language they use, and what barriers prevent them from converting
- The user needs to align a cross-functional team (marketing, product, sales, CS) around a shared understanding of who they are building for
- The user has customer interview data, CRM export, or support ticket patterns they want synthesized into a structured persona
- The user is launching a new product and needs a hypothesis-based persona to guide early positioning before customer data exists
- The user wants to document a negative persona -- a profile of customers to actively disqualify -- to protect sales efficiency and reduce churn from poor-fit customers
- The user is designing onboarding flows, email nurture sequences, or product tours and needs to anchor those experiences in a specific persona's mental model

**Do NOT use when:**
- The user wants to map the full purchase and post-purchase journey across touchpoints -- use `customer-journey-map` instead, which addresses awareness through advocacy stages
- The user needs to segment a total addressable market into prioritized tiers for go-to-market sequencing -- use `go-to-market-strategy` instead
- The user wants to conduct original customer research (design a survey, write interview questions, recruit participants) -- use `market-research-brief` instead
- The user needs to position their product against named competitors based on differentiated attributes -- use `competitive-analysis` instead
- The user is asking for a customer satisfaction measurement framework, NPS scoring, or CSAT process -- these are measurement tools, not persona work
- The user needs a full brand archetype or brand voice definition -- personas inform brand voice but are not a substitute for that work

---

## Process

### 1. Collect and Validate Inputs Before Writing Anything

Persona quality is directly proportional to the specificity of inputs. Never produce a persona from a vague description alone.

- Ask for the product or service, and specifically what problem it solves -- not the feature list, but the job it performs for the customer
- Determine B2B or B2C immediately, because the frameworks diverge significantly: B2B requires firmographics, buying committee mapping, and procurement process; B2C requires life-stage context, emotional purchase drivers, and channel-specific behavior
- Ask whether any real customer data exists: CRM records, support tickets, sales call transcripts, review site text (G2, Trustpilot, Amazon), NPS verbatims, or churn interview notes -- even 10-15 data points from real customers are more valuable than assumption-based demographics
- Identify the primary business decision this persona will drive: messaging refinement, pricing tiers, feature prioritization, channel investment, or sales qualification -- the decision context shapes which persona attributes get emphasized
- Confirm the number of personas needed and their relationship to each other -- most products have 2-4 meaningful personas; more than 5 suggests a segmentation problem, not a persona problem
- If no customer data exists, explicitly label what follows as a hypothesis-based persona and flag the top 5 assumptions that must be tested with real interviews before the persona is used to make significant budget or product decisions

### 2. Build the Biographical and Contextual Profile

The biographical layer grounds the persona in reality and prevents the team from mentally substituting themselves for the customer.

- For B2B personas: specify job title, seniority level (individual contributor vs. manager vs. director vs. VP vs. C-suite), years of experience in the role, department, typical team size they manage or work within, and company size expressed as employee count AND revenue band -- a 200-person company with $50M ARR behaves very differently from a 200-person company at $8M ARR
- For B2C personas: specify age range (10-year bands are usually sufficient), income bracket, household structure (single, partnered, children at home), employment status, geographic context (urban/suburban/rural and regional culture), and education level when it affects how the product is evaluated or how copy should be written
- Give the persona a name that follows a simple, memorable convention -- alliterative names ("Onboarding Olivia," "DevOps Daniel") help teams remember which persona is which during product reviews; avoid names that introduce demographic bias unrelated to buying behavior
- Include a one-sentence "persona summary" that describes what makes this person distinctly different from your other personas -- this prevents personas from blending together in team discussions
- Document only attributes that affect buying behavior -- income affects willingness to pay; geography affects channel preference; seniority affects approval authority; age rarely matters unless it predicts technology comfort or life-stage buying context

### 3. Apply the Jobs-to-be-Done Framework with Full Depth

JTBD is the analytical core of this persona method. The goal is to understand the causal mechanism of the buying decision, not just surface-level preferences.

- **Functional jobs** are the literal tasks the persona needs to accomplish. Write these as job statements following the JTBD grammar: "[Verb] + [object of the verb] + [contextual clarifier]." For example: "Reconcile contractor invoices against project budgets before the monthly board meeting" is a functional job statement. "Better invoicing" is not.
- **Emotional jobs** capture the internal state the persona wants to achieve or avoid. Most personas are trying to reduce anxiety, avoid embarrassment, or achieve confidence. Be specific about the emotion and its source: "Feel confident that compliance requirements are met before an audit" is emotional. "Feel good about the product" is useless.
- **Social jobs** capture how the persona wants to be perceived by their manager, peers, customers, or industry. Social jobs are especially powerful in B2B where career risk is a real buying motivator -- a VP of Engineering who adopts the wrong monitoring tool looks bad in a postmortem. Frame social jobs around the audience: "Be seen by the CEO as someone who catches infrastructure problems proactively."
- For each job, document the **current solution** the persona uses today and its specific shortcomings -- this is where product differentiation lives. If there is no current solution, that signals an emerging market where education is the primary marketing job.
- Rank jobs by **importance** (how critical is this job to the persona's role or life?) and **frequency** (how often does the job arise?). High-importance, high-frequency jobs are the primary messaging territory. High-importance, low-frequency jobs (like annual audits) require different messaging timing strategies.
- Identify the **progress metric** for each functional job: how would the persona know they had done it well? "All invoices reconciled with zero discrepancies before the 5th of the month" is a progress metric. These metrics become proof points in case studies and landing page copy.

### 4. Map Pain Points, Severity, and the Switching Moment

Pain point documentation is the most commonly done poorly. Vague pains produce vague copy.

- Identify 4-7 pain points and assign each a severity level: **High** (blocks the job from being done or creates significant rework), **Medium** (makes the job harder but does not stop it), **Low** (friction that accumulates but is individually tolerable)
- Quantify every pain point where possible. The four quantification dimensions for B2B are: time lost, money wasted, revenue at risk, and career/reputational risk. For B2C: money spent, time lost, emotional toll (described concretely), and social consequences. Use ranges from real customer data: "spends 5-8 hours per week" is better than "spends hours" and more believable than "spends exactly 6 hours."
- Identify **situational pains** (triggered by a specific event like a failed audit or a key employee departure) vs. **chronic pains** (ongoing friction that the persona has normalized). Situational pains create buying urgency; chronic pains create the switching motivation when normalized.
- Document the **switching moment** precisely -- this is the single event or pattern that moves the persona from "I should probably look into this someday" to "I need to solve this now." Common switching moments: missed a deadline that caused a visible failure, hired 5 more people and the old process broke, received a complaint from a key stakeholder, or competitors adopted a tool and the persona's company is now visibly behind. The switching moment is the most important piece of information for ad targeting and outbound sales timing.
- Identify **pains the persona does not know they have yet** -- problems they will discover once they start evaluating solutions. These become sales conversation topics and trial/demo design opportunities.

### 5. Document Desired Gains in Functional and Aspirational Terms

Gains are not just the absence of pain -- they are what the persona would love to be true beyond the minimum.

- **Minimum required gains** are the baseline expectations -- the persona will not buy without these (e.g., "must integrate with Salesforce"). These are table stakes and should not be primary marketing messages because they are assumed by all competitors.
- **Expected gains** are standard benefits the persona expects based on category norms -- "saves some time on data entry." These are worth messaging but will not create strong differentiation.
- **Desired gains** are benefits beyond what the persona expects -- things that would delight them but that they would not necessarily ask for ("automatically generates the executive summary report I was spending 2 hours writing every Friday").
- **Unexpected gains** are gains the persona would not have imagined -- these are product innovation opportunities that emerge from deep JTBD research.
- Frame all gains in the first person from the persona's perspective -- this exact language feeds into headline testing, email subject lines, and sales talk tracks.

### 6. Document Buying Behavior with Channel and Process Specificity

Buying behavior translates the persona into actionable marketing and sales strategy. Vague channel descriptions produce vague channel strategies.

- For B2B research channels, name the specific places this persona actually goes: specific LinkedIn groups (HR professionals groups, DevOps community), Slack communities (e.g., HR Tech community Slack, SaaStr), industry associations (SHRM for HR, IEEE for engineering), comparison platforms (G2, Capterra, Software Advice), analyst sources (Gartner Magic Quadrant, Forrester Wave), and peer networks activated by direct outreach
- For B2C research channels, name specific search behavior patterns, platform types (Reddit communities, YouTube tutorial searches, Amazon reviews), social platforms and content format preferences, and offline channels (word of mouth networks, in-store consultation)
- Map the **buying committee** for B2B personas using the six classic roles: Champion (internal advocate who owns the problem), Economic Buyer (controls budget and signs the contract), Technical Evaluator (assesses integration and security), End User (uses the product daily), Legal/Compliance (reviews contract terms and data agreements), and Influencer (respected peer or consultant whose opinion carries weight). Not every purchase involves all six roles, but missing any role that is present will cause deals to stall.
- Document decision criteria as a **ranked and weighted list** -- the rank determines messaging hierarchy and the weights reveal how much a single weakness in one criterion can be offset by strength in others. A decision criteria matrix with weights forces honest prioritization.
- Identify the **evaluation process stages**: awareness of problem, search for solutions, shortlist formation (typically 3-5 vendors), hands-on evaluation (trial, demo, POC), business case development (for B2B), final negotiation, and contract execution. For each stage, note what information the persona needs and what could cause them to stall or disqualify your product.
- Document the **average sales cycle length** in weeks, not just "short" or "long" -- this has direct implications for email nurture sequence length, retargeting window settings, and sales team quota planning.
- List 4-6 specific objections with the underlying concern behind each objection -- the surface objection ("it is too expensive") usually masks a deeper concern ("I cannot justify the ROI to my CFO without proof this will save us more than it costs"). Handling the surface objection without addressing the underlying concern will not advance the deal.

### 7. Capture Authentic Voice and Build the Vocabulary Map

Voice and vocabulary documentation is the bridge between persona insights and actual creative output. It is what separates a persona that stays in a deck from one that changes how the team writes.

- Collect verbatim language from real customer interviews, sales call transcripts, support tickets, and review site copy. If working from hypothesis, write phrases that reflect how this professional or consumer archetype actually speaks in their context -- use jargon they would use, not jargon from your product category.
- Create a **vocabulary contrast table**: what the persona calls the problem vs. what your marketing currently calls it. Misalignment here is the most common cause of landing pages that get traffic but no conversions.
- Document **resonant language** -- specific words and framing that generate positive response. Common resonant patterns: specific numbers ("save 5 hours"), outcome framing ("never miss a deadline again"), role-specific validation ("built for HR teams at fast-growing companies"), and social proof references ("used by teams like yours at companies like X")
- Document **resistant language** -- words and frames that trigger skepticism or rejection. Common patterns: overclaiming ("revolutionary"), jargon that signals complexity ("enterprise-grade," "AI-powered orchestration"), words that sound like more work ("implementation," "onboarding process"), and category labels the persona does not identify with ("HR platform" when they think of themselves as a "people operations team")
- Write a **day-in-the-life narrative** (3-5 sentences) that places the persona in their actual work or life context and shows where the problem surfaces and how it affects them emotionally and practically. This narrative is the empathy tool that makes the persona useful in design sprints and messaging workshops.

### 8. Synthesize and Format the Deliverable

- Assemble all sections into the standard output format
- Add a "Reach and Engage" section that translates persona insights into specific tactical channel recommendations
- Flag the top 3 assumptions built into the persona that need validation with customer research
- If multiple personas were created, add a "Persona Comparison" table that shows the key differences in job priorities, decision criteria, and channels -- this prevents team members from conflating distinct personas
- State explicitly what this persona should NOT be used for, to prevent misapplication (e.g., "This persona represents the buyer, not the daily end user -- product UX decisions should use the End User persona")

---

## Output Format

```
## Customer Persona: [Persona Name]

**One-Line Summary:** [What makes this persona distinct from other buyers of this product]
**Role:** [Job title or life role]
**Segment:** [B2B: company type, size, industry | B2C: demographic and life-stage profile]
**Created for:** [The specific business decision this persona is designed to inform]
**Persona Type:** [Hypothesis-based / Research-validated / Composite from customer data]

---

### Demographics and Context
| Attribute | Detail |
|-----------|--------|
| Age Range | [Range -- only if relevant to buying behavior] |
| Title / Role | [Specific job title or life role] |
| Seniority Level | [IC / Manager / Director / VP / C-Suite -- B2B] |
| Company Size | [Employee count AND revenue band -- B2B] |
| Industry / Vertical | [Specific industries, not "various"] |
| Department | [Functional department -- B2B] |
| Reports To | [Title of their manager -- B2B] |
| Team Size Managed | [Number of direct reports or cross-functional team] |
| Income / Budget Authority | [Personal income range AND purchasing authority limit] |
| Location | [Region, urban/suburban/rural, office/remote/hybrid] |
| Technology Comfort | [High/medium/low with specific indicators] |

---

### Jobs to Be Done
| Priority | Job Type | Job Statement | Current Solution | Shortcoming | Progress Metric |
|----------|----------|--------------|-----------------|-------------|-----------------|
| 1 | Functional | [Verb + object + context] | [What they use today] | [Specific gap] | [How they measure success] |
| 2 | Functional | [Verb + object + context] | [Current approach] | [Specific gap] | [Success metric] |
| 3 | Functional | [Verb + object + context] | [Current approach] | [Specific gap] | [Success metric] |
| 4 | Emotional | [Internal state they want] | [Current emotional experience] | [Unmet need] | [What "good" feels like] |
| 5 | Social | [How they want to be perceived] | [Current perception] | [Desired shift] | [Validation signal] |

---

### Pain Points
| # | Pain Point | Type | Severity | Quantified Impact |
|---|-----------|------|----------|-------------------|
| 1 | [Specific, concrete pain] | Chronic/Situational | High | [Time, money, risk, or emotional cost] |
| 2 | [Specific, concrete pain] | Chronic/Situational | High | [Quantified impact] |
| 3 | [Specific, concrete pain] | Chronic/Situational | Medium | [Quantified impact] |
| 4 | [Specific, concrete pain] | Chronic/Situational | Medium | [Quantified impact] |
| 5 | [Specific, concrete pain] | Chronic/Situational | Low | [Quantified impact] |

**The Switching Moment:**
[The specific event or accumulated pattern that moves this persona from passive dissatisfaction to active search. Be specific about timing, trigger, and emotional state.]

**Hidden Pain (Discovered During Evaluation):**
[A pain point the persona does not know they have until they see a demo or start a trial -- becomes a sales and demo design asset]

---

### Desired Gains
| Gain Type | Gain Statement | Priority |
|-----------|---------------|----------|
| Minimum Required | [Must-have -- table stakes] | Non-negotiable |
| Expected | [Standard category benefit] | High |
| Desired | [Beyond-expectation benefit] | High |
| Desired | [Beyond-expectation benefit] | Medium |
| Unexpected | [Surprise delight -- product innovation opportunity] | Medium |

---

### Buying Behavior
| Attribute | Detail |
|-----------|--------|
| Research Channels | [Specific named communities, platforms, publications, analyst sources] |
| Peer Influences | [Specific networks, associations, or trusted peer types] |
| Evaluation Stages | [Awareness > Shortlist > Trial/Demo > Business Case > Negotiation] |
| Decision Criteria (Ranked) | [1. Most important criterion > 2 > 3 > 4 > 5. Least important] |
| Budget Range | [Specific range for this solution category] |
| Budget Cycle | [When budgets refresh -- fiscal year, quarterly, event-triggered] |
| Buying Committee Roles | [Champion / Economic Buyer / Technical Evaluator / End User / Legal] |
| Approval Process | [Who recommends, who approves, who can veto, typical steps] |
| Average Sales Cycle | [X weeks from first contact to signed contract] |
| Disqualification Signals | [What causes them to remove a vendor from consideration] |

**Common Objections and Underlying Concerns:**
| Objection | Underlying Concern | Counter-Strategy |
|-----------|-------------------|-----------------|
| "[Verbatim objection]" | [Root fear or need behind the words] | [How to address the real concern] |
| "[Verbatim objection]" | [Root concern] | [Counter-strategy] |
| "[Verbatim objection]" | [Root concern] | [Counter-strategy] |

---

### Vocabulary Map
**Their language for the problem:**
- "[Exact phrase]"
- "[Exact phrase]"
- "[Exact phrase]"

**Their language for the desired outcome:**
- "[Exact phrase]"
- "[Exact phrase]"

**Industry jargon they use (and expect vendors to use correctly):**
- [Term]: [How they use it / what it means to them]
- [Term]: [Meaning in their context]

**Language that resonates:**
- [Word or phrase]: [Why it works for this persona]
- [Word or phrase]: [Why it works]

**Language that creates resistance:**
- [Word or phrase]: [Why it backfires for this persona]
- [Word or phrase]: [Why it signals the wrong thing]

---

### Day in the Life
[3-5 sentence narrative placing this persona in their real daily context. Show where the problem surfaces, how it affects their day, the emotional weight it carries, and how your product category would change that day. Write in third person, present tense, with specific details that make the narrative feel like a real person and not a slide deck character.]

---

### How to Reach and Engage This Persona
| Priority | Channel | Tactic | Content Type | Timing |
|----------|---------|--------|-------------|--------|
| 1 | [Specific channel] | [Specific tactic] | [Format that works for this persona] | [When in buying cycle] |
| 2 | [Channel] | [Tactic] | [Content format] | [Timing] |
| 3 | [Channel] | [Tactic] | [Content format] | [Timing] |
| 4 | [Channel] | [Tactic] | [Content format] | [Timing] |

---

### Assumptions to Validate
| # | Assumption | Validation Method | Priority |
|---|-----------|------------------|----------|
| 1 | [Most consequential assumption in this persona] | [Customer interview / survey / CRM analysis / usage data] | High |
| 2 | [Second assumption] | [Validation method] | High |
| 3 | [Third assumption] | [Validation method] | Medium |

---

### Usage Guidance for This Persona
**Use this persona for:** [e.g., top-of-funnel messaging, email nurture sequences, sales qualification criteria, feature prioritization for Q3 roadmap]
**Do NOT use this persona for:** [e.g., enterprise segment decisions -- use the VP of HR persona instead; UX decisions for daily end users -- use the HR Coordinator persona]
```

---

## Rules

1. **Never produce a persona without first identifying the business decision it serves.** A persona created "in general" gets filed and forgotten. A persona created to answer "should we invest in LinkedIn ads or direct outbound for Q3?" gets used in the meeting where that decision is made.

2. **B2B and B2C personas require fundamentally different structures.** B2B personas must include buying committee mapping, approval authority limits, and procurement process details. B2C personas must include life-stage context, emotional purchase drivers, and the social network influences that validate the decision. Applying a B2B template to a consumer product produces a persona that feels clinical and misses the emotional core of consumer buying.

3. **All pain points must be quantified in at least one dimension.** The four dimensions are: time (hours per week, days per quarter), money (cost of the problem, cost of the current solution, revenue at risk), quality (error rates, rework cycles, compliance failures), and career risk (documented examples of the problem causing professional consequences). If real data is unavailable, use ranges that are clearly labeled as estimates -- "estimated 3-6 hours per week based on comparable process complexity."

4. **The switching moment is the most operationally important field in the persona.** This single data point directly controls paid advertising targeting (target the event, not the demographic), sales outbound sequencing (trigger outreach when the event occurs), and product trial messaging (validate that the user is experiencing the moment). If you cannot identify a specific switching moment, the persona is not yet specific enough to be actionable.

5. **Decision criteria must be ranked AND the ranking must be justified.** Listing five decision criteria without ranking is useless for messaging priority decisions. The #1 criterion is the headline claim. The #2 criterion is the supporting claim. Criteria ranked #4 and below are table stakes copy or FAQ content. If the user cannot rank criteria, prompt them to use a forced-choice exercise: "If you could only have one of these two things, which would you choose?"

6. **Voice and vocabulary must contain verbatim language, not paraphrases.** "They care about saving time" is a paraphrase -- it is the analyst's interpretation. "I just need to know nothing fell through the cracks" is a verbatim phrase -- it is the customer's actual language, which goes directly into email subject lines and landing page headlines. Paraphrases strip out the specificity that makes copy perform.

7. **Buying committee mapping is mandatory for all B2B personas.** Even if the Champion is the primary persona, omitting the Economic Buyer's concerns will produce sales collateral that converts Champions but stalls at approval. At minimum, note the title, primary concern, and preferred proof type for each committee role.

8. **Emotional and social jobs must be included, not treated as optional.** Functional jobs are necessary but not sufficient for understanding why one solution wins over another that is functionally similar. The emotional job (reduce anxiety, feel in control) and the social job (look competent to the board, be seen as innovative by peers) explain the irrationalities in buying decisions that functional analysis cannot explain. Skipping these produces personas that lose to competitors at the final decision stage.

9. **Flag hypothesis-based personas clearly and prominently.** A persona built from assumption rather than customer data should be labeled as such in the title, in the summary, and in the assumptions table. Teams that forget a persona was hypothetical start making million-dollar product decisions on educated guesses. The validation plan section exists to force this distinction into every review meeting.

10. **Negative personas must be created alongside positive ones for any product with a significant percentage of churned or poor-fit customers.** If more than 15% of customers churn within 90 days or if sales cycles consistently extend beyond 3x the stated average, a negative persona likely does not exist yet. Negative personas directly improve sales qualification efficiency, customer success resource allocation, and paid acquisition targeting exclusions.

---

## Edge Cases

### B2B Persona with a Formal Buying Committee (5+ Stakeholders)

Complex B2B purchases -- typically above $25K ACV -- involve structured evaluation committees where the Champion rarely has unilateral authority. In these cases, create a primary persona document for the Champion (the person who owns the problem and drives internal adoption), then append a **Buying Committee Supplement** that documents each additional role: title, their specific concern in the purchase, the proof format they respond to (ROI analysis, security questionnaire, reference call, legal review, technical documentation), and the message or content piece designed to address their concern. Common stall patterns occur when the Champion has been fully sold but the Economic Buyer has not seen an ROI model or the Technical Evaluator has not received an integration architecture diagram. The persona document should call out the two most common committee roles that kill otherwise-won deals for this product category.

### Multiple Distinct Personas for One Product

When a product serves 2-4 meaningfully different buyer types, create individual full persona documents for each. Then create a single-page **Persona Comparison Matrix** that shows side by side: the primary job for each persona, the #1 pain point, the #1 decision criterion, the primary research channel, the average deal size or LTV, and the preferred content format. This matrix is what teams use in sprint planning, budget allocation, and campaign brief reviews -- it prevents the common error of building messaging for Persona A into a channel that only reaches Persona B. In the comparison matrix, also note which features matter most to which persona -- this is the input to product packaging and tiering decisions.

### Hypothesis-Based Persona for a Pre-Launch Product

When no customers exist yet, the persona is a structured set of testable hypotheses. Label the document "Hypothesis-Based Persona -- Version 1.0" and include a validation plan section that lists the top 5 assumptions in ranked order of consequence (the assumption that would most change your strategy if proven wrong is Priority 1). For each assumption, specify the minimum number of customer interviews needed to build confidence (typically 5-8 interviews with consistent responses) and the specific question that would test it. Focus the JTBD section entirely on current alternatives and their gaps -- this is where the product's right to exist lives. Common pre-launch persona failure mode: teams treat hypothesis-based personas as validated after internal review rather than external customer interviews.

### Consumer Persona with Limited or No Demographic Data

When the user has a new B2C product with no purchase history, use behavioral and psychographic proxies instead of leading with demographics. Start with the job to be done and work backward to who most likely has that job urgently: what life stage creates that job (new homeowner, new parent, recent career transition), what income level makes the product accessible, what geography creates the context. Supplement with public behavioral data from category-level research where available. Include a "Data Gaps" section that lists the 3-4 demographic or behavioral attributes that most need validation, and suggest the fastest path to that data (a 2-week paid social test with 3 different audience hypotheses, analyzed by conversion rate by audience segment, will often produce more useful data than a survey).

### Persona for a Usage-Based or Product-Led Growth (PLG) Product

PLG products have two distinct personas that must not be conflated: the **End User Persona** (the person who discovers and adopts the product through self-service trial) and the **Buyer Persona** (the person who converts the team from free to paid, or who approves the contract expansion). These two people often have completely different jobs, pains, and vocabularies. The End User Persona drives product onboarding design, in-product messaging, and the activation experience. The Buyer Persona drives pricing page design, upgrade prompts, and expansion sales plays. Conflating them produces a product that gets adopted but not purchased, or a pricing page that speaks to engineers when the approval authority is a CFO.

### International or Culturally Diverse Persona

When the product operates across multiple geographic markets with meaningful cultural differences in buying behavior, decision authority, or communication preferences, flag which persona attributes are universal and which are market-specific. Risk tolerance in buying decisions varies significantly by region -- markets with higher uncertainty avoidance (many Northern European markets) require more extensive proof, more reference customers, and longer evaluation periods than markets with lower uncertainty avoidance. Communication style preferences affect sales process design: direct value claims that work in US markets may come across as overconfident in Japanese markets where understated proof is more persuasive. Document market-specific variations as addenda to a base persona rather than creating entirely separate personas for each market, unless the buying process is structurally different.

### Persona Refresh for a Maturing Product

Personas built at product launch often drift from reality as the product evolves and the customer base changes. A persona should be reviewed and validated every 12-18 months using a combination of: quantitative analysis of CRM data (have average deal sizes, company sizes, or job titles shifted?), review mining from updated G2 or Trustpilot pages (has the language customers use to describe problems changed?), and 4-6 fresh customer interviews focused specifically on what has changed in the persona's world in the past year. Treat the refresh as a structured comparison of the current persona against updated evidence -- note which attributes have held, which have changed, and which were revealed to have been incorrect from the start.

---

## Example

**Input:** "We're building a SaaS tool for freelance graphic designers to manage client projects -- sending proposals, tracking revisions, collecting payments, and storing final deliverables. We don't have customers yet. Help me build a buyer persona."

**Output:**

---

## Customer Persona: Independent Isabel

**One-Line Summary:** A self-employed graphic designer generating $60K-$120K annually who is highly skilled at creative work but spends 30-40% of her billable week on administrative tasks that slow her down and sometimes cause her to undercharge or under-deliver.
**Role:** Freelance Graphic Designer -- sole proprietor
**Segment:** Self-employed creative professional, 2-8 years freelancing, primarily US and Western European markets
**Created for:** Product positioning, pricing strategy, onboarding flow design, and top-of-funnel content strategy
**Persona Type:** Hypothesis-based -- Version 1.0 (see Assumptions to Validate section)

---

### Demographics and Context
| Attribute | Detail |
|-----------|--------|
| Age Range | 26-38 -- old enough to have established a client base, young enough to be comfortable with SaaS tools |
| Title / Role | Freelance Graphic Designer / Brand Designer / Visual Designer |
| Seniority Level | Solo operator -- no direct reports, occasional subcontractors for overflow |
| Company Size | Solo business; annual revenue $60K-$120K; 8-20 active clients at any point |
| Industry / Vertical | Agency overflow, small business branding, startup brand identity, content marketing design |
| Department | N/A -- sole operator who handles all client-facing and back-office functions |
| Reports To | N/A -- self-directed; accountable only to clients |
| Team Size Managed | 0 direct; occasionally contracts out photography or copywriting |
| Income / Budget Authority | Net personal income $45K-$90K after business expenses; willingness to pay $20-$60/month for tools that visibly save time or increase revenue; reluctant to pay for tools that feel like "admin overhead" |
| Location | Urban or suburban US, UK, Canada, Australia; works from home studio or coworking space; client meetings via video call |
| Technology Comfort | Medium-high -- uses Adobe Creative Cloud daily, comfortable with Notion or Airtable for project tracking, but does not want to build complex systems; chooses tools that work out of the box |

---

### Jobs to Be Done
| Priority | Job Type | Job Statement | Current Solution | Shortcoming | Progress Metric |
|----------|----------|--------------|-----------------|-------------|-----------------|
| 1 | Functional | Send polished, professional project proposals to prospective clients within 24 hours of a discovery call | Google Docs or Canva templates emailed as PDFs | No tracking of whether client opened it; no e-signature; requires reformatting for every project | Proposal sent within 24 hours; client responds within 72 hours; close rate above 40% |
| 2 | Functional | Track which revision round each active client project is currently on and enforce revision limits specified in the contract | Mental tracking or a sticky-note system on the desktop | Routinely does extra revisions for free because she cannot easily cite "revision 3 of 2 allowed"; clients claim revisions were not counted accurately | Zero unpaid revisions per quarter; every revision documented with a timestamp |
| 3 | Functional | Collect payment from clients on the agreed schedule without awkward follow-up conversations | Emailing a PayPal.me link or a manually created invoice via Wave | 35% of invoices are paid late; chasing payment feels unprofessional and anxiety-inducing; does not have automated reminders | 90%+ of invoices paid within 7 days of due date without manual follow-up |
| 4 | Functional | Deliver final brand or design files to clients in an organized, professional package that the client can actually find months later | Google Drive folder shared with a link; sometimes Dropbox | Links expire or get lost; clients email weeks later asking for the original files; re-sending files takes 20-30 minutes per request | Zero "I can't find the files" requests from past clients in the 6 months after project close |
| 5 | Emotional | Feel in control of her business and confident she is not letting anything fall through the cracks | Daily mental inventory of active projects | Wakes up at 2 AM worried about a missed deadline or an uncollected invoice; persistent background anxiety about the business side of the work | Can close the laptop at 6 PM knowing every open item is tracked and nothing requires attention until morning |
| 6 | Social | Be perceived by clients as a highly professional, organized creative partner -- not just a talented freelancer | Inconsistent proposal and invoice templates across clients; different processes for every project | Clients sometimes treat her as a vendor rather than a strategic partner; she feels the inconsistency undermines her premium positioning | Clients proactively refer her to peers; at least one unsolicited "wow this is impressive" per quarter about her process |

---

### Pain Points
| # | Pain Point | Type | Severity | Quantified Impact |
|---|-----------|------|----------|-------------------|
| 1 | Spends 6-10 hours per week on non-billable administrative tasks: creating proposals, tracking projects, chasing payments, resending files | Chronic | High | At a $75/hour effective rate, this represents $450-$750/week in lost billable capacity -- up to $35,000/year |
| 2 | Routinely performs unpaid revision work because revision rounds are tracked inconsistently | Chronic | High | Estimated 2-4 unpaid revision hours per month per active project; with 6 active projects, this is 12-24 hours/month of uncompensated work |
| 3 | 30-40% of invoices are paid late, requiring manual follow-up emails that are emotionally taxing and time-consuming | Chronic | High | Average 45 minutes per late invoice resolution; 2-3 late invoices/month = 90-135 minutes/month on payment chasing; cash flow unpredictability makes personal financial planning difficult |
| 4 | Every new project requires rebuilding a proposal and project setup from scratch because there is no reusable template system that is also flexible enough to customize | Chronic | Medium | 2-3 hours per new project on setup that should take 30 minutes |
| 5 | Cannot easily show clients a professional deliverables portal -- final files are scattered across Google Drive folders with inconsistent naming | Chronic | Medium | 20-30 minutes per re-delivery request; 2-3 requests per month from past clients; damages professional brand perception |

**The Switching Moment:**
Isabel loses a project to another freelancer who sent a proposal link (not a PDF) that the client could sign and pay the deposit on in the same step. The client tells her, "The other designer just made it so easy." She realizes her process -- Google Docs proposal, email the PayPal link, track revisions in a sticky note -- is actively costing her business. She Googles "proposal and invoicing software for freelance designers" within 48 hours.

**Hidden Pain (Discovered During Evaluation):**
Isabel does not realize how much time she loses re-explaining her process to new clients in the first 2 weeks of every project. Once she sees a client portal with automated onboarding steps, she understands that she has been doing a manual version of this in 6-10 email threads per project.

---

### Desired Gains
| Gain Type | Gain Statement | Priority |
|-----------|---------------|----------|
| Minimum Required | Must be able to send a professional-looking proposal and receive an e-signature without requiring the client to create an account | Non-negotiable |
| Minimum Required | Must integrate with Stripe or PayPal so payment can be collected in the same workflow as proposal acceptance | Non-negotiable |
| Expected | Saves her time on administrative tasks compared to her current cobbled-together system | High |
| Desired | Makes her look more professional than other freelancers the client is comparing her to -- elevates her perceived expertise and justifies her premium pricing | High |
| Desired | Automatically tracks revision rounds and flags when a client requests a revision beyond the contracted limit, so she never has to be the one to raise it awkwardly | High |
| Unexpected | Provides a branded client portal the client can bookmark, log into, and reference for project status and past files -- so Isabel becomes the most organized creative partner the client has ever worked with |Medium |

---

### Buying Behavior
| Attribute | Detail |
|-----------|--------|
| Research Channels | YouTube tutorials for creative freelancers, Reddit communities (r/freelance, r/graphic_design), Twitter/X designer community, designer-focused newsletters, peer recommendations in designer Slack groups (Brand Design Masters, ADPList community), Google search for "best proposal software for designers" |
| Peer Influences | Other freelance designers who are 2-3 years ahead of her in business sophistication; designers who post about their business systems on social media; podcast hosts in the creative freelance space |
| Evaluation Stages | Problem recognition (losing a deal or having a bad revision situation) > Google and community search > watches 2-3 YouTube review videos > signs up for free trials of 2-3 tools > tests by creating one real proposal > checks if payment collection works > evaluates pricing vs. current spend > converts or churns within 14 days of trial start |
| Decision Criteria (Ranked) | 1. Quality and customizability of proposal templates (must look better than her current Google Docs), 2. Integrated payment collection (must not require a separate tool), 3. Ease of use -- must require zero training to send first proposal, 4. Pricing under $40/month (strong resistance above this threshold for a solo operator), 5. Revision tracking capability |
| Budget Range | $15-$40/month for a comprehensive tool; will pay up to $60/month if the time savings are immediately visible in trial |
| Budget Cycle | No formal budget cycle -- purchases are event-triggered, approved instantly by Isabel alone, paid on personal credit card, deducted as a business expense |
| Buying Committee Roles | Isabel is the sole decision-maker, economic buyer, technical evaluator, and end user -- this is a single-person buying decision with no committee |
| Approval Process | No approval required; Isabel decides within her trial period (typically 7-14 days); cancels if she has not sent a real proposal to a real client within the first week |
| Average Sales Cycle | 5-14 days from first visit to paid conversion; driven by urgency of the switching moment |
| Disqualification Signals | Requires more than 30 minutes to set up first proposal; client must create an account to sign or pay; templates look generic or corporate; pricing page is unclear about what is included; no free trial |

**Common Objections and Underlying Concerns:**
| Objection | Underlying Concern | Counter-Strategy |
|-----------|-------------------|-----------------|
| "I'm already using Wave for invoicing -- I don't want to pay for something I'm already getting for free" | She is solving parts of the problem with free tools and does not see the value of a unified system vs. a stitched-together free stack | Show the specific costs of the free stack: 6 hours/week in tool-switching overhead, lack of revision tracking, no deliverables portal -- then show what consolidation is worth in time saved |
| "I'm not sure my clients will bother with a new portal -- they're used to how we work" | She fears introducing friction into established client relationships by changing the process | Show that the client experience is better, not just different: one link instead of 3 separate emails, no more lost files, mobile-friendly signing -- most clients respond positively within the first 1-2 projects |
| "I'll set this up when things slow down" | She is overwhelmed right now and adding a tool feels like adding work; she has low trust that setup will be as fast as advertised | Reduce setup friction to under 30 minutes for first proposal; make "slow down" irrelevant by showing that setup is less work than her current process, not more |

---

### Vocabulary Map
**Their language for the problem:**
- "I'm drowning in admin"
- "I just want to focus on the actual design work"
- "Chasing invoices makes me feel like a collections agency"
- "Every project starts from scratch -- I'm rebuilding the wheel every time"
- "My client said they couldn't find the files I sent 3 months ago and I had to resend everything"

**Their language for the desired outcome:**
- "I want my business to look as polished as my design work"
- "I just want to send a link and have everything taken care of"
- "I want to get paid on time without having to be weird about it"

**Industry jargon they use (and expect vendors to use correctly):**
- "Deliverables": The final design files handed off to the client -- NOT the project itself
- "Revisions": Specific rounds of changes; "revision 1 of 3 included" is standard contract language
- "Brand kit": The full package of logo files, color palettes, and typography guidelines delivered at project end
- "Discovery call": The initial consultation before a proposal is sent

**Language that resonates:**
- "Built for freelance designers": Signals the tool understands her specific workflow, not a generic small business tool
- "Send your first proposal in 10 minutes": Specific, concrete, respects her time constraint, creates a testable promise
- "Get paid faster": Addresses the #3 pain directly without making her feel like a bad businessperson

**Language that creates resistance:**
- "All-in-one business platform": Sounds like enterprise software with a learning curve and a price to match
- "Automate your business": Slightly threatening -- she is a creative; "automation" feels like it could make her work feel mechanical or remove the personal touch she values
- "CRM": She does not identify as someone who needs a CRM; this word signals the tool is for salespeople, not designers

---

### Day in the Life
Isabel starts work at 9 AM and immediately opens three browser tabs: her Gmail (where she tracks which client is waiting for what), a Google Drive folder (where she manages project files), and a Wave invoice she was supposed to send yesterday. She spends 40 minutes writing a proposal in Google Docs for a new branding project, formatting it carefully, exporting it as a PDF, and emailing it -- knowing that she has no idea if or when the client will open it. Around 11 AM she gets a Slack message from a client asking to see "version 2 of the logo" -- but she is not sure if that counts as a revision under the contract because they already asked for small changes twice last week that she did not formally document. She does the work, does not charge for it, and adds a mental note to fix her revision tracking system "sometime." By 3 PM, she is doing her best creative work but cannot fully concentrate because she is aware that two invoices from last month are still unpaid and she needs to send a follow-up email that she keeps delaying because it feels awkward.

---

### How to Reach and Engage This Persona
| Priority | Channel | Tactic | Content Type | Timing |
|----------|---------|--------|-------------|--------|
| 1 | YouTube | Pre-roll and mid-roll on channels covering freelance design business (Creative Pep Talk, The Futur) | 60-second video showing a real proposal being sent in under 5 minutes -- no voiceover, just screen recording with simple captions | Always on; spike budget when seasonal freelance ramp-up occurs (January, September) |
| 2 | Reddit (r/freelance, r/graphic_design) | Organic presence in threads where designers complain about proposal/invoice/revision problems; sponsored posts with specific problem-first framing | Text posts with a direct "I built something for this" narrative; no hard sell | Trigger-based: monitor keywords like "revision nightmare," "chasing invoices," "proposal software" |
| 3 | Designer community newsletters | Sponsor placements in Sidebar, Dense Discovery, and similar designer-focused newsletters with a before/after time-savings story | Short-form case study: one designer, one metric, one outcome | Consistent monthly presence -- this persona reads newsletters but ignores display ads |
| 4 | Google Search | Paid search on high-intent keywords: "proposal software for freelancers," "best invoicing app for designers," "freelance project management tool" | Landing page anchored to the switching moment ("Just lost a deal because your proposal process looked outdated?") | Always on with bid adjustments for mobile (Isabel researches on her phone between client calls) |

---

### Assumptions to Validate
| # | Assumption | Validation Method | Priority |
|---|-----------|------------------|----------|
| 1 | The switching moment is specifically about losing a deal to a more process-polished competitor -- rather than a bad revision dispute or a cash flow crisis from late payments | 8 customer discovery interviews with the opening question: "Tell me about the moment you decided you needed a better system" | High |
| 2 | The $40/month price ceiling is real and not merely a negotiating position -- i.e., a designer who saves 6 hours/week will still resist paying $60/month | A/B test pricing page at $29/month vs. $49/month with identical feature sets; measure trial-to-paid conversion rate difference | High |
| 3 | Proposal quality and e-signature are the primary evaluation criteria -- not payment collection or file delivery | Track feature engagement during free trials: which feature is used first and which is used most in the first 7 days | High |
| 4 | Isabel does her research primarily on YouTube and community forums, not via SEO-driven blog content | UTM analysis on first-touch attribution after first 500 sign-ups; survey new users: "How did you find us?" | Medium |
| 5 | The emotional job (feeling in control, not waking up anxious) is a strong enough motivator to drive paid conversion -- i.e., emotional messaging outperforms functional messaging | A/B test email subject lines: "Save 6 hours a week on admin" (functional) vs. "Close the laptop at 5 PM knowing nothing fell through the cracks" (emotional); measure open rate and click-to-trial rate | Medium |

---

### Usage Guidance for This Persona
**Use this persona for:** Product onboarding flow design, top-of-funnel content strategy and channel investment decisions, pricing page copywriting, free trial activation email sequences, and feature prioritization for the core proposal-to-payment workflow.
**Do NOT use this persona for:** Enterprise or agency sales strategy (that requires a separate Agency Creative Director persona with buying committee dynamics); product decisions about team collaboration features (Isabel works solo -- team features are irrelevant to her and will create UI clutter she resents); customer success playbooks for accounts above $200/month (those are larger studios with different operational needs).
