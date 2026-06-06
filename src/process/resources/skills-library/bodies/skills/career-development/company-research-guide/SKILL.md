---
name: company-research-guide
description: |
  Produces a structured company research brief covering business model,
  financial health signals, culture indicators, recent developments, competitive
  position, and role fit analysis. Prepares the user to ask informed questions
  and demonstrate company knowledge in interviews. Use when the user is
  researching a company before an interview, evaluating a potential employer,
  or wants to understand a company's business model and culture. Do NOT use for
  predicting interview questions (use interview-question-anticipator), writing
  answers to interview questions (use behavioral-interview-prep), or analyzing
  a specific job description (use job-description-analyzer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "interview-prep career research"
  category: "career-development"
  subcategory: "interview-preparation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Company Research Guide

## When to Use

**Use this skill when:**
- The user is preparing for a first, second, or final-round interview and needs a structured understanding of the company before they walk in the door
- The user has received an offer and is evaluating whether to accept -- they need to assess financial stability, culture, and role quality before deciding
- The user is preparing for a networking conversation with someone at a target company and wants to demonstrate informed interest rather than asking basic questions
- The user is writing a cover letter or preparing a tailored resume and needs to understand the company's strategic priorities deeply enough to mirror their language
- The user wants to understand how a company makes money, who its customers are, and where it sits in its competitive landscape -- before any career touchpoint with that company
- The user is choosing between two or more job offers and needs parallel research briefs to compare employers on the same dimensions

**Do NOT use this skill when:**
- The user wants to predict what questions the interviewer will ask -- use `interview-question-anticipator`
- The user wants to write or practice their answers to behavioral or technical questions -- use `behavioral-interview-prep`
- The user wants a line-by-line analysis of a specific job description -- use `job-description-analyzer`
- The user wants a multi-week plan for finding and applying to jobs -- use `job-search-strategy`
- The user wants to negotiate an offer based on market compensation data -- use `salary-negotiation-guide`
- The user wants help writing a cover letter -- use `cover-letter-writer` (though this skill can feed research into that one)
- The user is asking about a company for investment purposes -- this skill produces employer research, not investment analysis; never provide stock price opinions or investment recommendations

---

## Process

### Step 1: Gather Research Inputs

Before producing any output, collect the following. If the user has not provided them, ask directly.

- **Company name** -- exact legal or brand name matters for finding filings, press releases, and LinkedIn data
- **Role title and level** -- "Software Engineer" vs. "Staff Software Engineer" vs. "VP of Engineering" require completely different research angles; the level tells you whether to analyze individual contributor culture or management culture
- **Interview stage** -- phone screen needs light research (30-minute read); final-round panel needs deep research (2+ hour brief with competitive landscape and financials)
- **What the user already knows** -- prevents repeating information they have and identifies gaps to fill
- **Specific concerns** -- common concerns include: layoff risk, remote work policy changes, equity value uncertainty, management quality, technical debt culture; ask explicitly
- **User's background** -- knowing whether the user is switching industries, re-entering the workforce, or a specialist helps tailor which research dimensions matter most

If the user provides the company name without any other context, produce a general research brief at medium depth -- then offer to go deeper on any dimension once they provide role context.

### Step 2: Build the Business Model Analysis

This is the foundation. Everything else -- culture, financials, competitive position, role fit -- makes more sense when you understand exactly how the company generates and captures value.

- **Identify the revenue model** with precision. Do not just say "subscription." Distinguish between: usage-based SaaS (billed per seat, API call, or consumption), transactional (takes a cut of each transaction), marketplace (takes a percentage from both sides or one side), advertising (monetizes attention), licensing (one-time or annual license fees for software or IP), professional services (consulting wrapped around a software product), or hybrid models. Hybrid models -- where a company has a product-led free tier that converts to enterprise contracts -- are the most common in modern tech and require special attention because they create internal tension between product teams and sales teams.
- **Identify the customer segment precisely.** "B2B" is not specific enough. The difference between "enterprise Fortune 500 accounts with 12-month sales cycles" and "SMB self-serve with 14-day trial to paid conversion" creates entirely different internal cultures, product priorities, and career dynamics. Note whether the go-to-market is top-down (sales-led), bottom-up (product-led), or partner-channel (sold through resellers or system integrators).
- **Name the company stage** using a four-stage model: (1) Early/pre-product-market-fit: burn-heavy, iterating, sub-$10M ARR for SaaS or pre-revenue; (2) Growth/scaling: found PMF, accelerating revenue, building infrastructure, typically $10M--$100M ARR; (3) Late-growth/scaling efficiency: $100M+ ARR, balancing growth and profitability, often preparing for or post-IPO; (4) Mature/optimizing: slowing top-line growth, optimizing margins, often executing on cost reduction. The stage has direct career implications -- early-stage offers learning and equity upside but instability; mature companies offer stability but slower career progression.
- **Identify 2-3 North Star metrics** for this specific business type. SaaS: ARR, Net Revenue Retention (NRR), and Customer Acquisition Cost (CAC) to Lifetime Value (LTV) ratio. Marketplace: Gross Merchandise Volume (GMV), take rate, and liquidity (number of buyers per seller). Consumer: Daily Active Users (DAU), DAU/MAU ratio (engagement ratio; above 0.5 is strong), and retention at Day-1, Day-7, Day-30. E-commerce: Revenue per visitor, conversion rate, and average order value. Fintech: Assets Under Management (AUM), transaction volume, and net interest margin. Knowing these metrics lets the user speak fluently about the business in the interview.
- **Map the value chain.** Understand what the company builds itself vs. outsources. A software company that relies on AWS infrastructure and third-party payment processing has a fundamentally different risk profile than one with proprietary infrastructure. This matters for engineering and product roles because it signals build-vs-buy culture.

### Step 3: Assess Financial Health Signals

The goal is to form a stability and trajectory assessment without access to non-public information. Use only public signals.

**For public companies:**
- **Revenue growth rate** is the primary signal. Above 20% YoY is strong for a mature company; above 50% is high-growth; below 5% growth or declining revenue at a growth-stage company is a concern. Find this in earnings calls, press releases, or financial news.
- **Profitability status.** Is the company GAAP profitable, operating-income profitable, or cash-flow positive? These are different thresholds. Many growth-stage companies are deliberately unprofitable but cash-flow neutral, which is acceptable. A company losing cash at an accelerating rate without a clear path to profitability is a risk.
- **Gross margin.** Software companies should run 65-85% gross margins; if they are below 50%, there is likely a heavy professional services or infrastructure cost component that suppresses scalability.
- **Stock trajectory.** Not for investment purposes -- but as a signal of market confidence. A stock down 60% from its all-time high warrants a red flag annotation and an explanation of what happened.

**For private companies:**
- **Funding history.** Map the full history: seed, Series A, B, C, etc. Note the lead investors (top-tier VC backing -- Sequoia, Andreessen Horowitz, Benchmark, Accel -- signals institutional validation but also pressure for 10x returns). Note the time between rounds; rounds more than 3 years apart may indicate the company struggled to raise.
- **Last valuation.** If publicly announced, compare it to the current year. A company valued at $2B in 2021 that has not raised since is likely navigating a down round or struggling -- the 2021 valuations were peak multiples that many companies have not grown into.
- **Revenue proxies.** Job postings for enterprise sales roles signal B2B revenue growth. Press coverage of customer wins signals traction. G2 or Capterra review volume and recency signals product adoption. Employee count on LinkedIn over time is a leading indicator -- a company that grew from 50 to 300 employees in 18 months is almost certainly in growth mode.
- **Runway signals.** For startups, layoffs without accompanying "we're becoming leaner and more efficient" messaging are a warning sign. Multiple rounds of layoffs within 12 months is a significant red flag.

**Universal signals to check for all companies:**
- LinkedIn employee count trend over the trailing 12 months -- is headcount up, flat, or down?
- Glassdoor rating trend (not just the current number -- a company at 3.8 and falling is worse than one at 3.4 and rising)
- Executive departures in the prior 12 months -- particularly CFO (financial instability signal), Chief People Officer (culture instability), or CTO (technical leadership instability)
- Pending litigation -- PACER for US federal court cases; relevant for companies facing employment law class actions or IP disputes that could affect operations

### Step 4: Analyze Culture Signals Rigorously

The most common mistake in company research is treating culture as a binary thumbs-up/thumbs-down. Culture is multi-dimensional, and stated culture differs from observed culture in specific, documentable ways.

**The two-column method:** For each culture dimension, document what the company says and what evidence shows separately. The gap between them is the most important finding.

- **Stated values analysis.** Read the company's mission, vision, and values page. Note whether values are specific ("We ship on Fridays" or "We argue with data") or generic ("Integrity, Innovation, Teamwork" -- nearly meaningless). Specific operational values suggest a company that has actually thought about culture. Generic values are aspirational decoration.
- **Employee review pattern analysis.** Do not read individual Glassdoor reviews -- read for patterns. If 40% of 1-star reviews mention the same manager or team, the problem is localized. If 40% of all reviews (positive and negative) mention "fast-paced" and "no work-life balance," that is a consistent observable culture signal. Look for the words that appear most frequently in both positive and negative reviews -- they reveal what is consistently true about the company, not just what disgruntled or enthusiastic outliers say.
- **Leadership communication style.** Read the CEO's public writing -- blog posts, LinkedIn articles, company all-hands summaries shared publicly. Transparent leaders who share numbers, admit mistakes, and explain decisions in public create different environments than leaders who communicate only through PR. Look for whether the leadership team comments on employee posts, which signals accessibility.
- **Engineering or product blog.** Technical companies that publish engineering blogs demonstrate intellectual culture, pride in craft, and willingness to share. The topics they write about reveal what technical problems they are actually solving (vs. what the marketing website claims).
- **Remote/hybrid policy signals.** Do not trust the website alone -- search LinkedIn for employee job locations. If 90% of employees are listed as San Francisco while the website claims "remote-first," there is a policy-reality gap.
- **Promotion and tenure patterns.** Check LinkedIn for how long employees stay at the company (median tenure) and whether internal promotions are common. A company where the average tenure is 14 months and all senior roles are filled by external hires has a culture that does not develop or retain people.

### Step 5: Map Competitive Position

The goal is to give the user enough competitive intelligence to answer "Why did you choose us over [Competitor]?" and to ask intelligent questions about strategy.

- **Identify the primary competitive set.** Distinguish between: (1) Direct competitors -- same product category, same customer segment; (2) Indirect competitors -- different product, same budget category or same user problem; (3) Status quo -- the spreadsheet, the manual process, or the incumbent the company is replacing.
- **For each competitor, identify:** What they do better (honestly -- do not assume the company the user is interviewing at wins every dimension), what they charge, their market segment, and whether they are growing or declining. Demonstrating knowledge of competitor weaknesses AND strengths shows business acumen.
- **Articulate the company's sustainable competitive advantage.** Use the language of competitive moats: network effects (the product gets more valuable as more people use it -- Slack, LinkedIn), switching costs (customers are locked in by data, integrations, or workflow -- Salesforce), scale advantages (the more they process, the cheaper it gets -- AWS), IP or regulatory moat (patents, FDA approval, financial license), or brand (premium willingness-to-pay -- Apple).
- **Assess market trajectory.** Is the total addressable market (TAM) expanding or contracting? A great company in a declining market is a career risk. A good-enough company in an expanding market can carry you. Use public industry research, analyst reports, or market sizing logic to estimate this.
- **Identify disruptors.** Who is the company that does not yet exist -- or the existing company pursuing an adjacent strategy -- that could threaten this business in 3-5 years? Interviewers at growth companies are impressed when candidates identify strategic threats proactively.

### Step 6: Conduct Role Fit Analysis

This step translates the research into what it means for the specific person in the specific role. This is the highest-value section because it is the one the user cannot find anywhere else.

- **Connect the role to the company's current strategic moment.** A company in growth mode hiring a VP of Sales is building out a commercial function -- that role will have high autonomy and high risk. A company in optimization mode hiring a senior analyst is building control infrastructure -- that role will have less upside but more stability.
- **Identify the likely pressures the role will face.** A product manager at a company pivoting from SMB to enterprise will face constant roadmap tension. An engineer at a company going through a platform migration will face technical debt and legacy system constraints. Name these specifically.
- **Assess equity and compensation context.** For early-stage companies, equity can be meaningful or worthless -- note the stage and dilution history. If the company raised at a $2B valuation and is Series C, standard option packages at senior IC level are typically 0.05% to 0.25%. For public companies, note whether RSU vesting is front-loaded (common: 25% after 1 year, then monthly or quarterly) and how the stock has performed.
- **Identify what the user needs to learn in the interview** to complete their assessment. List the specific factual gaps -- things the research could not answer -- that the user should ask about directly.

### Step 7: Generate Research-Based Questions to Ask

Every question must be traceable to a specific research finding. Generic questions ("What does success look like in this role?") are usable but not differentiated. Research-based questions demonstrate preparation and create memorable impressions.

- Generate a minimum of 5 and maximum of 8 questions.
- Categorize by audience: questions for the hiring manager, questions for team peers, questions for a recruiter.
- Make each question specific enough that it could only be asked of this company -- not copy-pasted to every interview.
- Include at least one question that addresses a red flag tactfully -- the user should validate concerns, not ignore them.
- Include at least one question about the team's current challenges -- this signals the user wants to solve problems, not just show up.

---

## Output Format

```
## Company Research Brief: [Company Name]
**Role:** [Role Title and Level]
**Interview Stage:** [Phone Screen / Second Round / Final Round / Offer Evaluation]
**Research Depth:** [Light / Standard / Deep]
**Brief Prepared:** [Date or "Current"]

---

### 1. Business Model

| Dimension | Details |
|-----------|---------|
| Core product / service | [Plain-language description of what they sell] |
| Primary customer segment | [Specific segment: enterprise, SMB, consumer -- with context] |
| Go-to-market motion | [Sales-led / Product-led / Partner-led / Hybrid] |
| Revenue model | [Subscription / Usage-based / Transaction / Advertising / Marketplace / Licensing / Hybrid] |
| Company stage | [Early (<$10M ARR or pre-PMF) / Growth ($10M-$100M ARR) / Late-growth ($100M+ ARR) / Mature] |
| North Star metrics | [The 2-3 metrics that most drive decision-making at this company] |
| Competitive moat type | [Network effects / Switching costs / Scale / IP / Brand / None identified] |

**Business model summary (2-3 sentences):** [A plain-language paragraph explaining how this company makes money and why customers pay. This is the answer to "explain what this company does" in 30 seconds.]

---

### 2. Financial Health Assessment

| Signal | Finding | Implication for Role |
|--------|---------|---------------------|
| Revenue trajectory | [Growing X% / Flat / Declining] | [Stability signal, team growth likely] |
| Profitability status | [GAAP profitable / Cash-flow positive / Operating at loss with runway] | [Risk signal] |
| Funding status (private) or market cap trend (public) | [Details] | [Financial runway or stability signal] |
| Headcount trend (12-month) | [+X% / Flat / -X%] | [Team growth or contraction signal] |
| Key executives (stability) | [Stable / Notable departures in past 12 months] | [Leadership continuity signal] |
| Red flags | [None identified / List with brief descriptions] | [Severity: Low / Medium / High] |

**Financial health summary:** [2-3 sentences on overall stability. Include confidence level in the assessment: high confidence = public company with recent earnings; low confidence = private company with limited public data.]

---

### 3. Culture Analysis

| Dimension | Stated (What They Claim) | Observed (What Evidence Shows) | Gap? |
|-----------|--------------------------|-------------------------------|------|
| Core values | [Company values page summary] | [What reviews and behavior reveal] | [Yes/No -- describe if yes] |
| Work style | [Remote/hybrid/office claim] | [What LinkedIn locations and reviews show] | [Yes/No] |
| Work pace | [Marketing language: fast-paced, collaborative, etc.] | [Review patterns, median tenure data] | [Yes/No] |
| Leadership transparency | [What leadership claims about communication] | [Public communications, employee feedback] | [Yes/No] |
| Career development | [Stated commitment to growth] | [Internal promotion rate, tenure patterns] | [Yes/No] |
| DE&I | [Stated commitments and representation goals] | [Observable leadership diversity, pay equity reports if published] | [Yes/No] |

**Glassdoor / review signal:** Rating [X.X/5], trend [Rising/Falling/Stable], most frequent positive themes: [theme 1, theme 2], most frequent critical themes: [theme 1, theme 2]

**Culture fit note for this user:** [1-2 sentences specifically connecting the observed culture to what the user has shared about their preferences or concerns]

---

### 4. Competitive Position

| Competitor | What They Do Best | [Company Name]'s Advantage Over Them | Threat Level |
|------------|------------------|--------------------------------------|-------------|
| [Competitor 1] | [Their genuine strength] | [Honest differentiation] | [Low/Medium/High] |
| [Competitor 2] | [Their genuine strength] | [Honest differentiation] | [Low/Medium/High] |
| [Competitor 3 or "Status quo"] | [What inertia or alternatives look like] | [Why customers choose this company instead] | [Low/Medium/High] |

**Market trajectory:** [Expanding/Stable/Contracting] -- [1 sentence of supporting reasoning]

**Strategic risk:** [The most credible threat to this company's position in the next 3-5 years]

---

### 5. Role Fit Analysis

| Factor | Assessment |
|--------|-----------|
| Strategic alignment | [How this role connects to the company's highest-priority initiative right now] |
| Likely primary challenges | [The 2-3 specific tensions or constraints this role will face, based on company context] |
| Definition of success | [What impact in this role would look like in 6 months and 18 months] |
| Equity / compensation context | [Stage-appropriate equity expectation; public vs. private stock considerations] |
| Growth trajectory | [Realistic career path from this role within this company] |
| Critical unknowns | [What the research could not answer -- must validate in interview] |

---

### 6. Questions to Ask in the Interview

**For the Hiring Manager:**

| Question | What It Reveals | Research Trigger |
|----------|----------------|-----------------|
| "[Specific, non-generic question about team or role]" | [The real information this question extracts] | [Which finding prompted it] |
| "[Question about current challenge or strategic priority]" | [What it reveals] | [Research trigger] |
| "[Question addressing a specific red flag tactfully]" | [What it reveals] | [Research trigger] |

**For Team Peers (if panel interview):**

| Question | What It Reveals | Research Trigger |
|----------|----------------|-----------------|
| "[Question about day-to-day reality vs. company narrative]" | [What it reveals] | [Research trigger] |
| "[Question about team dynamics or recent changes]" | [What it reveals] | [Research trigger] |

**For the Recruiter:**

| Question | What It Reveals | Research Trigger |
|----------|----------------|-----------------|
| "[Question about compensation, equity, or process]" | [What it reveals] | [Research trigger] |
| "[Question about timeline or team growth plans]" | [What it reveals] | [Research trigger] |

---

### 7. Research Source Log

| Source Type | What It Provided | Confidence |
|------------|-----------------|-----------|
| Company website / investor relations | Business model, values, product descriptions | High (primary source, but may be promotional) |
| LinkedIn headcount data | Hiring trends, team structure, tenure patterns | Medium (self-reported, not audited) |
| Employee reviews (Glassdoor, Blind, etc.) | Culture signals, management quality | Medium (self-selected respondents, check for patterns not outliers) |
| Press coverage / TechCrunch / Bloomberg | Funding history, executive moves, partnerships | High for facts; Medium for interpretation |
| Engineering / product blog | Technical culture, problem space, sophistication | High (written by insiders) |
| SEC filings / earnings transcripts (public only) | Revenue, margins, headcount, strategic priorities | High (audited or disclosed to regulators) |
| Competitor websites / G2 / Capterra | Competitive positioning, customer sentiment | Medium |
| [Other source used] | [What it contributed] | [Confidence level] |

**Information gaps:** [List any dimensions where public data was unavailable. Note: gaps in public information are themselves a signal -- very low-transparency companies should prompt questions about openness.]

---

### 8. Pre-Interview Preparation Checklist

- [ ] Read the company's most recent press release or blog post (within the last 30 days)
- [ ] Review the LinkedIn profiles of the people you will interview with (understand their background and tenure)
- [ ] Know the company's founding story and year founded
- [ ] Be able to name the CEO and at least one other C-suite leader
- [ ] Be able to name two competitors and articulate why this company is differentiated
- [ ] Understand what the product does well enough to explain it to a non-technical person in 60 seconds
- [ ] Have your 3 research-based questions written out and memorized
- [ ] Know the company stage and what stage-specific concerns to monitor
```

---

## Rules

1. **Always produce the structured brief -- never a list of research tips.** The output is a completed research document the user can print or reference during preparation, not instructions telling them what websites to visit. If you cannot fully complete a section due to limited information about a private company, fill it with what is available and annotate the gap.

2. **Maintain the stated vs. observed culture distinction rigorously.** Never merge what the company claims with what evidence supports. The gap itself is often the most important finding. A company claiming "work-life balance" while its Glassdoor reviews uniformly mention 60-hour weeks is a more important signal than either data point alone.

3. **Never provide investment analysis or stock price opinions.** This is employer research, not securities analysis. Statements like "the stock has declined 40% from peak, which investors interpret as..." are acceptable framing. Statements like "the stock is undervalued and likely to recover" are not appropriate in this context.

4. **Calibrate research depth to interview stage.** A phone screen deserves 20-30 minutes of research and a light brief; a final-round panel deserves 2-3 hours of research and a deep brief with financial analysis. Do not produce a 12-section deep brief when the user has a 30-minute first-round call tomorrow -- match the depth to the stakes and the time available.

5. **Name real competitors -- never use generic labels like "Competitor A."** If the competitive landscape is genuinely uncertain or the company operates in a niche where public competitor data is unavailable, say so explicitly and explain what the user would need to research to fill that gap.

6. **Flag red flags with specificity and proportional severity.** A company that laid off 8% of its workforce in a single restructuring round in a market downturn is categorically different from a company that has conducted three separate rounds of layoffs across 18 months. Report both, but apply different severity levels and different recommended follow-up questions.

7. **Every question in the "Questions to Ask" section must be traceable to a research finding.** Questions that could apply to any company ("What does success look like in this role?") should either be omitted or upgraded with a company-specific angle. The standard is: could this exact question be asked at only this company based on this specific research?

8. **Use precise financial language.** "They're funded" is not an acceptable financial health summary. "Series C, raised $85M at a $600M valuation in 2022, with no public round since -- in a market where late-stage valuations compressed 40-60%, this likely represents a valuation overhang" is the standard.

9. **Do not editorialize on whether the user should accept or decline a role.** Present findings, annotate severity, and surface the questions the user needs to ask. The user makes the employment decision. The skill's job is to eliminate information asymmetry, not to make the decision for them.

10. **Match role level to research depth on culture.** Researching culture for a software engineer requires looking at team culture, engineering practices, and day-to-day work environment. Researching culture for a VP of Product requires looking at board composition, CEO management style, and political dynamics between functions. Apply the appropriate lens for the level.

11. **For regulated industries, include regulatory context as a first-class section.** A company in healthcare, financial services, energy, or government contracting operates under compliance constraints that directly affect culture, velocity, and role priorities. These are not footnotes -- they shape the entire work environment.

12. **Do not present a headcount number without a trend.** "Notion has 800 employees" tells the user almost nothing. "Notion grew from 300 to 800 employees between 2021 and 2023, then held roughly flat through 2024" tells the user the company scaled rapidly, has since stabilized, and is likely in a phase of operational efficiency rather than headcount growth.

---

## Edge Cases

### Company is pre-product-market-fit or in stealth mode
Public information may be nearly nonexistent -- no Glassdoor reviews, no press coverage, a website with two sentences. In this case: (1) Research the founders deeply -- their prior companies, funding history, and reputation in the industry; (2) research the investors, who signal the expected trajectory and board governance style; (3) use LinkedIn to understand the team's composition -- a team of former Google and Stripe engineers signals technical credibility even if the product is unannounced; (4) if the user can access the product in any form (beta, waitlist, or demo), describe it in the brief; (5) annotate clearly that information scarcity is expected at this stage and is not itself a red flag, but the user should ask more probing questions in the interview to compensate.

### Company is a large enterprise with many divisions (Amazon, Google, Microsoft, JPMorgan)
Do not research the parent company -- research the specific division, product line, or team. Amazon Web Services has a different culture, business model, and career trajectory than Amazon Retail or Amazon Advertising. The research brief should identify the specific org unit the role sits in and treat it as the unit of analysis. If the user does not know which division the role sits in, instruct them to ask the recruiter before preparing, and note what is known and unknown in the brief. For large public companies, supplement the divisional analysis with parent company financial health because headcount, budget, and layoff decisions cascade from the corporate level.

### Company has recent significant negative press (major layoffs, executive scandal, product failure, regulatory action)
Do not editorialize, but do not minimize. Report what happened factually: the date, the scale (e.g., "laid off 1,200 employees, representing 18% of global headcount, in January 2024"), the stated reason, the observed market reaction, and whether the company has publicly addressed it with a recovery plan. Rate the severity. Prepare 1-2 questions the user can ask to probe the company's current trajectory and team morale. A candidate who asks "I saw the restructuring announcement in January -- how has the team stabilized since then, and what does the current org structure look like?" demonstrates research, shows maturity, and gives the interviewer a chance to tell a recovery story they are likely proud of.

### Company is in a regulated industry (healthcare, financial services, government contracting, energy)
Add a dedicated regulatory context block to the brief. Include: the primary regulatory bodies overseeing the company (FDA, SEC, FINRA, CMS, FERC, etc.), recent enforcement actions or compliance milestones, and how the regulatory environment directly affects the role. A product manager at a digital health company must understand FDA Software as a Medical Device (SaMD) classification. A software engineer at a financial services firm must understand SOC 2, PCI DSS, or SOX controls. An account executive at a government contractor must understand FAR/DFARS compliance and procurement cycle constraints. These are not nice-to-know -- they are core to understanding the role.

### Company has recently gone through a merger or acquisition
Distinguish between: (1) the company acquiring another business (they are the acquirer -- research what they bought and why, and whether integrations have historically gone well); (2) the company being acquired (the user is interviewing into an entity that may be absorbed -- research the acquirer's culture and track record of post-acquisition retention); (3) the company having recently been acquired and still integrating (the highest-risk scenario -- role definitions, team structures, and leadership may change significantly in the next 12-24 months). Flag integration risk explicitly and suggest questions about reporting structure stability and integration timeline.

### Company has multiple rounds of public funding at declining valuations (down rounds)
A down round -- where a new funding round values the company lower than the previous round -- has direct implications for employee equity. Option strike prices set during high-valuation rounds may now be above the current fair market value, meaning early employees' options are "underwater." This is a factual finding to include in the financial health section with an explanation of what it means for compensation. Include a suggested question for the user to ask: "Can you help me understand the current 409A valuation and how employee equity has been treated through the recent financing rounds?" This is a legitimate and reasonable question that any financially informed candidate should ask.

### User is evaluating an international company or a role based internationally
The research brief should expand to include: country-specific labor law context (notice periods, severance requirements, employment-at-will vs. employment-protection regimes), the local competitive landscape if it differs from the global one, currency and economic risk if compensation is in a non-home currency, and cultural work norms that may differ from the user's experience (hierarchy levels in Japanese or Korean firms, collectivist vs. individualist team cultures, communication directness norms in Northern European vs. Southern European workplaces). Do not generalize entire cultures with stereotypes -- anchor observations to observable evidence, company-specific data, and specific team compositions where possible.

### User is comparing two job offers simultaneously
Produce parallel briefs using identical section structure so the comparison is direct. After completing both briefs, add a "Comparative Decision Framework" section that ranks each company across 5-7 dimensions the user has identified as priorities, scores them 1-5 on each dimension, and surfaces the areas of greatest divergence. Do not make the recommendation -- present the comparison and identify what information would change the ranking.

---

## Example

**Input:** "I have a final-round interview next week for a Senior Software Engineer role at Stripe. I know they do payments but I don't know much beyond that. I'm most concerned about work-life balance and whether the company is financially stable given all the fintech news lately."

**Output:**

---

## Company Research Brief: Stripe
**Role:** Senior Software Engineer
**Interview Stage:** Final Round
**Research Depth:** Deep
**Brief Prepared:** Current

---

### 1. Business Model

| Dimension | Details |
|-----------|---------|
| Core product / service | Developer-first payment infrastructure -- APIs and SDKs that allow businesses to accept payments, manage subscriptions, run marketplaces, handle fraud, and now access banking-as-a-service features (Stripe Treasury, Stripe Issuing) |
| Primary customer segment | Developers and technical founders at companies from startups to large enterprises; top customers include Amazon, Alphabet/Google, and Ford -- B2B, both SMB and enterprise |
| Go-to-market motion | Product-led (developers self-onboard via documentation) converting to sales-led for enterprise accounts over $1M+ in processing volume |
| Revenue model | Transaction-based: takes a percentage cut (standard 2.9% + $0.30 per transaction for Stripe Checkout; negotiated rates for enterprise) plus flat monthly fees for add-on products like Radar (fraud), Billing, and Connect |
| Company stage | Late-growth / pre-IPO: estimated $14B+ ARR as of 2024, scaling efficiency after a period of significant headcount reduction in 2023 |
| North Star metrics | Total Payment Volume (TPV) processed, take rate (revenue as a percentage of TPV), and Net Revenue Retention from existing customers adding new Stripe products |
| Competitive moat type | Switching costs (deep API integration into customer codebases) + developer brand (considered the gold standard developer experience in fintech) |

**Business model summary:** Stripe makes money by charging a small percentage of every transaction it processes for its hundreds of thousands of customers. The more those customers grow, the more Stripe earns without acquiring new customers -- this is a powerful flywheel. They are expanding from core payments into adjacent financial infrastructure (lending, corporate cards, bank accounts), which each carry their own margin profile. The company has been profitable on an operating basis since at least 2023 and is widely expected to pursue a public listing, though no definitive date has been confirmed publicly.

---

### 2. Financial Health Assessment

| Signal | Finding | Implication for Role |
|--------|---------|---------------------|
| Revenue trajectory | Growing: estimated $14B+ ARR in 2024, up from ~$12B in 2022; TPV surpassed $1 trillion processed annually | Engineering resources are not being cut; growth-stage investment continues |
| Profitability status | GAAP profitability achieved in 2023 per company announcements -- first time in company history | No imminent cash pressure; signals operational maturity, not desperation |
| Funding status | Private; last known valuation $50B in 2023 (down from $95B peak in 2021 -- a deliberate internal recalibration, not a forced down round) | Employees who joined at or after 2023 valuation are likely in-the-money on equity; 2021-era employees face valuation overhang |
| Headcount trend (12-month) | Stabilized after 14% global reduction (approximately 1,100 people) in January 2023; selective hiring in 2024 in product engineering and enterprise sales | Team is lean; new hires will carry meaningful scope quickly; growth is not through headcount inflation |
| Key executives (stability) | Patrick and John Collison remain co-CEO and President respectively; Chief People Officer and CFO roles have been stable since 2023 restructuring | Leadership continuity is strong; the 2023 restructuring appears complete |
| Red flags | 2023 layoffs (14% of workforce); valuation reduction from $95B to $50B; delayed IPO timeline | Severity: Low-to-Medium. The 2023 actions appear to have been strategic rightsizing during a market correction, not distress. Company reached profitability post-restructuring. |

**Financial health summary:** Stripe's financial position as of 2024 is strong -- a profitable, high-revenue-growth business with a dominant market position and strong balance sheet. The primary concern is the 2021-era valuation overhang for employees who received equity at $95B valuations and are now sitting on options priced against a company valued at ~$50B. This is worth asking about directly during the interview. Confidence in this assessment: Medium-High -- Stripe is private, so figures are estimates from press reporting and company announcements, not audited financials.

---

### 3. Culture Analysis

| Dimension | Stated (What They Claim) | Observed (What Evidence Shows) | Gap? |
|-----------|--------------------------|-------------------------------|------|
| Core values | "Move with urgency and focus," high craft standards, written communication culture, long-termism, user-first | Glassdoor reviews consistently describe high intellectual standards, writing-heavy culture (docs over meetings), and high expectations -- consistent with stated values | Minimal gap -- this is unusually consistent |
| Work style | Hybrid with office hubs in SF, NYC, Seattle, Dublin, Singapore; not remote-first | LinkedIn shows ~60% of employees based near hub cities; Glassdoor reviews from 2023-2024 describe 3-day in-office expectations for hybrid roles; remote work significantly reduced post-2022 | Minor gap -- website neutral language understates in-office expectation |
| Work pace | "Move with urgency" is a stated value | Reviews consistently describe high workload, ambitious timelines, and a culture where underperformance is visible quickly; median engineer tenure ~2.2 years, below industry median of ~2.8 years | Small gap -- stated urgency matches observed pace; tenure data suggests the pace does cause turnover |
| Leadership transparency | Patrick Collison publishes public writing; company has shared financials voluntarily during key moments | All-hands culture described positively in reviews; management is described as intellectually engaged but sometimes remote from day-to-day; 2023 layoff communication was handled with a written memo that was generally considered clear | Low gap -- transparency is observed, not just claimed |
| Career development | Investment in employee growth described in job postings | Internal promotion rate not publicly documented; reviews suggest strong learning environment but rapid growth through individual excellence, not structured ladder programs | Moderate gap -- growth exists but is individual-driven, not program-driven |
| DE&I | Published diversity report; stated commitments to representation | 2022 diversity report showed female engineers at ~20% of engineering roles, below industry average; leadership team is majority male | Moderate gap -- stated commitment vs. slower-than-peer observable progress |

**Glassdoor / review signal:** Rating ~3.9/5, trend: Stable-to-slightly-falling post-2023 layoffs; most frequent positive themes: "smart colleagues," "interesting problems," "high standards," "good compensation"; most frequent critical themes: "intense pace," "high expectations," "can feel impersonal," "work-life balance challenging for some teams"

**Culture fit note for this user:** Given your stated concern about work-life balance, the observed culture at Stripe is a genuine yellow flag. The intensity and pace are authentic, not just marketing language. This is a company that selects for people who find hard problems intrinsically motivating -- some engineers thrive and stay 5+ years; others find the expectations unsustainable and leave within 18-24 months. The key variable is team -- culture varies significantly by organization within Stripe. This makes team-specific questions essential in your final round.

---

### 4. Competitive Position

| Competitor | What They Do Best | Stripe's Advantage Over Them | Threat Level |
|------------|------------------|------------------------------|-------------|
| Adyen | Enterprise and global payment processing at scale; trusted by Spotify, McDonald's, eBay; strong international acquiring | Developer experience and API design are significantly stronger; startup-to-enterprise flywheel creates earlier enterprise relationships; Radar (fraud) is best-in-class | Medium -- Adyen is a credible competitor for large enterprises |
| Braintree / PayPal | Distribution advantage -- PayPal's consumer network creates merchant network effects; Venmo integration | Stripe's documentation, developer experience, and API quality are widely considered superior; faster product iteration | Low-to-Medium -- legacy architecture limits PayPal/Braintree's developer appeal |
| Square / Block | Dominant in offline/SMB point-of-sale; strong hardware ecosystem | Stripe is stronger in online/API-first and enterprise; Block's ecosystem is fundamentally different go-to-market | Low -- differentiated by channel, not head-to-head |
| Status quo (in-house payments or legacy processors) | No switching cost; existing integrations; preference for known systems | Stripe's developer velocity allows faster feature shipping than in-house teams; pricing is competitive at scale | Medium -- enterprise companies periodically evaluate build vs. buy |

**Market trajectory:** Expanding -- global digital payments volume is growing approximately 15% annually through 2027 per industry analyst estimates; Stripe's multi-product expansion (Treasury, Issuing, Capital) grows their share of wallet within existing customers even in slower growth years.

**Strategic risk:** The most credible 3-5 year threat is continued commoditization of core payment processing APIs, which could compress Stripe's take rate as enterprise customers negotiate harder and as open-banking infrastructure in Europe (PSD2) creates new alternatives. Stripe's response -- expanding into financial infrastructure beyond payment routing -- is a coherent hedge against this.

---

### 5. Role Fit Analysis

| Factor | Assessment |
|--------|-----------|
| Strategic alignment | Engineering at Stripe is the product -- this is not a supporting function. Senior engineers own problems end-to-end, write technical design documents, and are expected to shape direction, not just execute tickets. The company's current focus on reliability at trillion-dollar TPV scale and multi-product infrastructure expansion makes senior engineering talent a top investment |
| Likely primary challenges | (1) The "one-click simplicity vs. infinite configurability" tension is a permanent product engineering challenge at Stripe -- making systems that work for a solo developer and JPMorgan simultaneously; (2) post-2023, teams are leaner, which means scope per engineer is higher than pre-restructuring; (3) operating at financial infrastructure scale means correctness > speed -- a bug in payment processing costs customers real money, creating a high-stakes engineering culture |
| Definition of success | At 6 months: independently shipping production-quality features with limited oversight; positive peer review feedback on code and design doc quality; contributing to oncall rotation. At 18 months: owning a meaningful project end-to-end; influencing technical direction for a subsystem; potential first step toward Staff Engineer consideration |
| Equity / compensation context | Stripe's current 409A valuation (~$50B) means new hires receive options or RSUs against a more conservative valuation than 2021 cohorts -- this is actually favorable for new employees entering now, assuming an eventual public offering at or above current valuation. Total compensation for Senior SWE at Stripe (SF) has been reported at $450K-$600K+ including equity, which is top-of-market. Verify current equity parameters with recruiter |
| Growth trajectory | Senior SWE → Staff Engineer (L6 equivalent) is the natural next step; Stripe has an identifiable Staff+ engineering culture with named technical leads who are public figures in the industry. Management track exists but is not the primary status path at Stripe -- technical excellence is the valued track |
| Critical unknowns | (1) Which team or product area this role sits in -- culture and pace vary meaningfully; (2) whether the role is hybrid 3 days/week or more flexible; (3) recent team changes or whether the team was affected by the 2023 layoffs; (4) current equity grant size and vesting schedule |

---

### 6. Questions to Ask in the Interview

**For the Hiring Manager:**

| Question | What It Reveals | Research Trigger |
|----------|----------------|-----------------|
| "Stripe went through a meaningful restructuring in 2023. How has the team's scope and ownership model changed since then -- are engineers carrying more surface area than before?" | Whether the lean team creates unsustainable workload or actually empowered ownership | 2023 layoff finding + work-life balance concern |
| "Can you describe what the weekly rhythm looks like for an engineer on this team -- how much of the work is meetings vs. deep work, and how does that compare to Stripe's writing-first culture generally?" | The actual day-to-day experience, not the idealized description | Culture finding that Stripe is writing-heavy and the user's WLB concern |
| "What's the biggest unsolved technical challenge this team is working on right now, and what would a successful Senior Engineer contribution to that problem look like in the first 12 months?" | Whether the work is genuinely challenging and whether the manager has a clear vision for the role | Business model finding that reliability at trillion-dollar TPV is the key engineering challenge |
| "How does the team balance moving fast on new product areas like Treasury and Issuing against the correctness requirements for core payment processing?" | The actual prioritization culture and whether speed is valued when it creates quality risk | Competitive position finding about multi-product expansion |

**For Team Peers (if panel interview):**

| Question | What It Reveals | Research Trigger |
|----------|----------------|-----------------|
| "What's something you wish you'd known about the team's way of working before you joined?" | The honest day-to-day reality that would not appear in any official material | Culture gap finding -- stated vs. observed intensity |
| "How has team culture changed in the past 18 months -- has the team composition shifted significantly?" | Whether the team is stable and functioning well, or still adjusting post-restructuring | 2023 layoffs + user's stability concern |

**For the Recruiter:**

| Question | What It Reveals | Research Trigger |
|----------|----------------|-----------------|
| "Can you help me understand the current 409A valuation and what the typical RSU or option grant looks like for a Senior SWE at this stage?" | Whether new employee equity is in-the-money from day one and what the size of the grant is | Valuation overhang finding -- $95B to $50B |
| "Is this role hybrid with a 3-day-per-week expectation, or is there more flexibility depending on the team?" | Actual remote/hybrid policy for this specific role | Culture analysis finding that in-office expectations are understated on the website |

---

### 7. Research Source Log

| Source Type | What It Provided | Confidence |
|------------|-----------------|-----------|
| Stripe's company blog and engineering blog | Business model, product roadmap, engineering culture signals, writing culture confirmation | High -- primary source, reflects actual direction |
| LinkedIn headcount data | Post-2023 stabilization pattern, role composition, hub city distribution | Medium -- self-reported, but directionally reliable |
| Glassdoor reviews (pattern analysis, not individual reviews) | Work pace, culture consistency, management quality, compensation data points | Medium -- self-selected respondents; patterns across 1,000+ reviews carry statistical weight |
| Press coverage (TechCrunch, Bloomberg, WSJ) | 2023 layoff details, valuation history, profitability announcement, TPV milestones | High for facts; Medium for interpretation of private company signals |
| Patrick Collison's public writing (Twitter/X, blog) | Leadership style, transparency level, long-term thinking orientation | High -- direct primary source |
| Competitor websites and G2/Capterra | Adyen, Braintree positioning and customer base | Medium |
| Levels.fyi and Glassdoor compensation data | Total compensation ranges for Senior SWE | Medium -- crowdsourced, typically within 10-20% of reality for large companies |

**Information gaps:** Stripe's exact current ARR, gross margin by product, and specific equity grant size for this role are not publicly disclosed. These are among the most important unknowns and should be raised directly in the interview. The equity question in particular is essential given the 2021 valuation history.

---

### 8. Pre-Interview Preparation Checklist

- [x] Know that Stripe processes over $1 trillion in payment volume annually and reached GAAP profitability in 2023
- [x] Be able to explain the difference between Stripe's core Payments product, Stripe Billing, Stripe Radar, and Stripe Treasury
- [x] Know the two co-founders (Patrick and John Collison, Irish brothers, founded 2010 in San Francisco)
- [x] Be able to name Adyen and Braintree as primary competitors and explain Stripe's developer experience advantage
- [x] Understand what "writing culture" means at Stripe (design docs, RFCs, asynchronous decision-making over meetings)
- [x] Have the 4 hiring manager questions and 2 peer questions written out and practiced
- [x] Know the 2023 restructuring context so you can ask about it without seeming uninformed or alarmed
- [x] Understand the equity valuation history so you can ask the recruiter question from a position of knowledge, not confusion
