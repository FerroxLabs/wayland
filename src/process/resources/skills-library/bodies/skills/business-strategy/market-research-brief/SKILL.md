---
name: market-research-brief
description: |
  Produces a completed market research brief with research question, hypothesis,
  methodology, data sources, and output format using research design principles.
  Use when the user asks to plan market research, design a survey, structure
  customer research, or outline a research study for business decisions.
  Do NOT use for competitive benchmarking (use competitive-analysis), customer
  persona creation (use customer-persona), or full marketing strategy (use
  marketing-strategy).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "strategy research planning analysis"
  category: "business-strategy"
  subcategory: "strategy-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Market Research Brief

## When to Use

Use this skill when the user's need centers on designing a structured research study that will inform a specific business decision. The key signal is that the user needs a plan -- not just findings -- and that plan requires defining a question, a methodology, and an analytical approach before any data is collected.

**Trigger scenarios:**

- A product manager needs to decide whether to build a new feature and wants to survey potential users before committing engineering resources
- A founder needs to validate product-market fit assumptions before a fundraising round and wants a structured primary research approach
- A growth team wants to understand why trial users are not converting and needs a research design that goes beyond pulling analytics
- A strategy team is entering a new geographic market and needs a structured approach to understand local customer behavior, willingness to pay, and competitive perceptions
- A brand team is considering a repositioning and needs to test messaging resonance with a defined customer segment before a full launch
- A startup needs to present investors with primary research data and must produce a credible, rigorous study in under six weeks
- A product team needs to prioritize a roadmap using customer-stated versus revealed preferences and wants a conjoint or MaxDiff study design
- An executive team is debating pricing model changes and needs stated-preference data to estimate elasticity before changing live pricing

**Do NOT use when:**

- The user wants a comparison of competitors' features, pricing, or market position -- use `competitive-analysis`, which focuses on secondary research and benchmarking rather than primary research design
- The user wants a buyer persona or customer archetype document -- use `customer-persona`, which synthesizes existing knowledge rather than designing new research
- The user wants a full marketing strategy including channel selection, messaging, and budget allocation -- use `marketing-strategy`
- The user only wants help writing survey questions, not a full research design -- handle as a standalone copy or content task
- The user wants analysis of data they have already collected, such as interpreting an existing survey dataset -- this is a data analysis task, not a research design task
- The user wants a market sizing estimate using publicly available data -- this is a desk research task, not a primary research brief
- The user is asking for a literature review or summary of existing industry reports -- this is secondary research synthesis, not primary research design

---

## Process

### Step 1: Extract the Business Decision and Define the Stakes

Before touching methodology, fully understand what decision the research will unlock. Underdefined decisions produce underdefined research.

- Ask: "What are the two or three options the team is choosing between?" Research that does not map to a choice is opinion gathering, not market research.
- Identify the decision owner -- the person who will actually act on findings. This person's risk tolerance determines how rigorous the methodology needs to be.
- Establish what the team currently believes. Document the working assumption explicitly so the research can either confirm or contradict it. This becomes the hypothesis.
- Identify the consequence of a wrong decision. If a wrong decision costs $500K, the research budget should be proportionate -- typically 1-5% of the decision value. If a wrong decision is easily reversible, a lighter methodology is acceptable.
- Document internal signals already pointing in a direction: existing customer complaints, churn data, support ticket patterns, usage analytics, sales call notes. These form the baseline and may reduce the scope of primary research needed.
- Ask whether the decision has a hard deadline. A product launch date or board meeting creates a backward-planning constraint that directly affects methodology selection.

### Step 2: Formulate the Research Questions and Hypotheses

Research questions and hypotheses are not optional scaffolding -- they are the architecture that determines what data you collect, how you analyze it, and what "done" looks like.

- Write the primary research question as a single interrogative sentence that cannot be answered by internal data alone. It should be specific enough that a stranger could design a study around it without further clarification. Bad: "What do customers think?" Good: "What is the maximum monthly price that SMB buyers will pay for an AI-assisted project management tool before switching to a free alternative?"
- Write 2-4 secondary research questions that are either prerequisites for answering the primary (you need to answer them first) or sub-components that make the primary answer actionable.
- For each question, write a directional hypothesis: the answer the team currently expects, based on existing evidence. This is not a guess -- it should be grounded in whatever signals exist.
- Write a null hypothesis for the primary question: the outcome that would indicate the current assumption is wrong and the business should take a different path.
- Define the decision trigger: the specific numeric or thematic finding that crosses the threshold from "stay the course" to "change direction." Ambiguous triggers ("if results are strong") lead to teams ignoring inconvenient findings.
- Validate that each secondary question is load-bearing. If the answer to a secondary question would not change the primary recommendation under any circumstance, remove it -- it adds cost and noise.

### Step 3: Select the Research Methodology

Methodology selection is a constraint satisfaction problem. The right method is the one that answers the research question reliably, within the available time and budget, using accessible participants.

**Quantitative methods -- use when you need numbers that generalize:**
- Online surveys are the default quantitative method for B2C and SMB research. Effective for behavioral intent, attribute ranking, price sensitivity, and segmentation. Require minimum n=200 for basic reporting, n=400+ for meaningful cross-tabulation by two or more segments. At n=400, you achieve 95% confidence with ±5% margin of error -- the standard threshold for business decisions.
- Conjoint analysis and MaxDiff are used when you need to understand relative preferences across multiple attributes simultaneously. Conjoint tests realistic trade-offs (price vs. feature vs. brand); MaxDiff identifies the highest and lowest priority items from a long list. These require specialized survey design tools and a minimum of n=150 per segment to be interpretable.
- Price sensitivity measurement methods: Van Westendorp Price Sensitivity Meter (four-question format identifying acceptable price range), Gabor-Granger (tests specific price points to estimate demand curves), and Newton-Miller-Smith extension (combines both). Van Westendorp is faster; Gabor-Granger is more precise for a narrower range.
- A/B and multivariate testing are revealed-preference methods (what users actually do, not what they say they would do). Use when you have a live product and sufficient traffic -- minimum 1,000 exposures per variant for binary outcome metrics.

**Qualitative methods -- use when you need to understand why:**
- In-depth interviews (IDIs) are the gold standard for exploratory research and for understanding the nuance behind quantitative patterns. Budget 45-75 minutes per interview. Reach thematic saturation at 8-15 interviews per distinct audience segment. Do not conduct fewer than 5 per segment -- you cannot identify patterns from fewer observations.
- Focus groups are useful for understanding group dynamics, social desirability effects, and reactions to creative stimuli (concepts, prototypes, messaging). They are NOT useful for uncovering individual decision-making logic -- participants conform to dominant voices. Limit to 6-8 participants per session. Run a minimum of 2 sessions per segment to compare groups.
- Contextual inquiry and ethnographic observation provide behavioral truth that surveys and interviews cannot -- you watch how people actually behave rather than how they report behaving. Most relevant for product usability, workflow studies, and physical retail environments.
- Diary studies and longitudinal observation capture behavior over time. Use when the behavior is episodic (purchase decisions, seasonal behavior, change adoption). Require 7-21 day commitment from participants; expect 20-30% dropout.

**Secondary research -- use to set context and reduce primary research scope:**
- Industry analyst reports (syndicated research), government datasets (census, trade statistics, Bureau of Labor Statistics), academic journals, and regulatory filings provide market-level context.
- Social listening and review mining (analyzing public customer reviews, forum discussions, social posts) surfaces unfiltered language that quantitative surveys miss. Use NLP tools or manual coding to identify themes. Flag that this audience is self-selected and skews toward extreme experiences.
- Competitive intelligence from public sources: job postings (reveal strategic priorities), patent filings, press releases, and earnings transcripts.

**Choosing and justifying the method mix:**
- If the research question is "how many" or "how much" -- quantitative primary
- If the research question is "why" or "how do customers think about" -- qualitative primary
- If both, design mixed methods: qualitative first (exploratory phase defines the right survey questions), then quantitative (measures prevalence of discovered themes). Never reverse this order unless hypotheses are already very well-developed.
- Document the method trade-offs explicitly in the brief: what confidence you gain and what confidence you sacrifice by choosing this method.

### Step 4: Define the Sample

Sampling is where most market research briefs fail. Vague samples produce uninterpretable results.

- Write an inclusion criteria specification: specific attributes a participant must have to qualify. Include role or title, company size, industry (if B2B), product category usage, and decision-making authority. For B2C: demographics, behavior (must be a current user of category X), and any behavioral screens.
- Write exclusion criteria: who is screened out. Always exclude: competitors' employees, market research professionals (they game screening questions), people who have participated in similar research in the past 3-6 months (panel fatigue), and internal stakeholders.
- Define the segmentation structure: which segments will be analyzed separately. Each separately analyzed segment requires its own minimum sample size. If you plan to compare three segments, you need minimum n per segment, not total n.
- Calculate the required sample size explicitly. For quantitative surveys: use the standard formula or a sample size calculator. State the confidence level (95% is standard; 90% is acceptable for low-stakes decisions; 99% is required for clinical or regulatory contexts), margin of error (±5% is standard; ±3% requires approximately n=1,000; ±7% can be achieved at n=200), and expected response distribution (use 50/50 if unknown -- this is the most conservative assumption).
- For qualitative: justify saturation. State the number of interviews per segment and cite the rationale: "8 interviews per segment following the Guest, Bunce, and Johnson (2006) finding that 80% of themes emerge by interview 6."
- Specify the recruitment source: research panel provider (for general consumer or professional samples), specialized panel (for niche professional audiences -- physicians, developers, executives), internal CRM (for customer research -- note the self-selection bias of those who agree to participate), intercept (for location-based or behavioral recruitment), or social/professional networks (LinkedIn, Reddit communities).
- Define the incentive. Industry benchmarks: 10-minute consumer survey = $2-$5; 20-minute consumer survey = $5-$10; 30-minute B2B professional survey = $25-$50; 45-minute interview = $50-$150 for consumers, $150-$300 for executives or hard-to-reach professionals. Incentives that are too low produce low-quality respondents; incentives that are too high attract participants motivated only by payment.

### Step 5: Design the Data Collection Instrument

The instrument (survey questionnaire, interview guide, or analysis codebook) is the operational heart of the research. Design it to answer the research questions, not to collect everything that might be interesting.

**For surveys:**
- Open with 2-4 screening questions. Screens must be non-leading -- never reveal what you're looking for in the screen. Use randomized option lists for category usage questions.
- Group questions by topic, not by the researcher's organizational logic. Respondents should experience a natural conversation flow.
- Place the most important questions in the first third of the survey. Respondents who abandon mid-way have still answered your core questions.
- Use established scale types for validated constructs: Likert 5-point or 7-point for attitude scales (5-point is sufficient for most business research; 7-point provides more variance for statistical modeling), Net Promoter Score (single 0-10 scale) for loyalty, semantic differential for brand perception.
- Limit open-ended questions to 2-3 per survey. Every open-ended question costs 30-60 seconds of respondent time and hours of analyst coding time.
- Include 1-2 attention check questions (e.g., "Please select 'Strongly agree' for this question to confirm you are reading carefully"). Exclude respondents who fail attention checks from analysis.
- Target 10-15 minutes maximum for consumer surveys; 20 minutes for engaged B2B professionals. Beyond these thresholds, completion rates and data quality drop significantly.

**For interview guides:**
- Structure in four sections: warm-up (5 min, establishes rapport, no leading questions about the topic), exploration (20-30 min, open-ended probing of current behavior and pain points), stimulus reaction (10-15 min, reactions to concepts, prototypes, or hypothetical scenarios), and close (5 min, priorities, open floor).
- Write probing prompts for each main question: "Can you walk me through the last time that happened?", "What did you do next?", "Why does that matter to you?", "Is there anything else about that?"
- Never include the hypothesis in the interview guide. Interviewers who know what they expect to hear will inadvertently guide participants toward confirming it.
- If testing a specific concept or feature, use a "monadic" design: show one concept per participant rather than multiple concepts per participant. Comparison effects distort individual concept evaluation.

**Quality controls:**
- For surveys: attention checks (2 per survey), minimum completion time filter (remove respondents who complete a 10-minute survey in under 3 minutes -- they are straight-lining), duplicate IP address detection, open-end quality review (remove gibberish, single character, or copy-paste responses).
- For interviews: record all sessions (with consent). Use verbatim transcription rather than summary notes. Conduct a member-checking session where 2-3 participants review a summary of findings for accuracy.

### Step 6: Design the Analysis Plan

Every research question specified in Step 2 must have a corresponding analysis method. No exceptions. Specifying analysis before data collection forces clarity on what data must be collected and how it must be formatted.

**Quantitative analysis methods:**
- Descriptive statistics (frequencies, means, percentages): the baseline output for every survey question. Always the first pass.
- Cross-tabulation: compares responses across segments. Requires minimum n=100 per cell for reliable comparison. Use chi-square test for categorical variables; t-test or ANOVA for continuous variables across groups. Report statistical significance at p<0.05 for business research.
- Regression analysis: identifies which variables predict an outcome (e.g., which product attributes predict purchase intent). Requires n=200+ for reliable regression coefficients.
- Cluster analysis: creates data-driven segments from survey responses. Requires n=300+ for stable clusters. Used when you do not have predefined segments to compare.
- Penalty-reward analysis: applied to importance-satisfaction grids to identify which attributes are must-haves (their absence destroys satisfaction) versus delighters (their presence unexpectedly increases satisfaction). Standard in product feature prioritization research.

**Qualitative analysis methods:**
- Thematic analysis (Braun and Clarke framework): read transcripts, generate initial codes, develop themes, review themes, define and name themes. Requires a codebook that is reviewed by at least two analysts for inter-rater reliability.
- Framework analysis: structures qualitative data against a predefined framework (useful when research questions are well-defined in advance). Faster than inductive thematic analysis.
- Affinity mapping: physical or digital grouping of observations into clusters, then themes. Most appropriate for workshop settings and UX research.
- Jobs-to-be-Done framework coding: organizes qualitative findings around functional, emotional, and social jobs customers are trying to accomplish. Particularly useful for product development decisions.

**Specify expected outputs per question:** For each research question, specify whether the output will be a percentage, a ranked list, a mean score with confidence interval, a set of themes with supporting quotes, or a decision recommendation. This prevents the analysis from becoming a data dump.

### Step 7: Build the Timeline and Budget

Work backward from the report delivery deadline. Build in float -- qualitative research almost always takes longer than planned due to scheduling.

**Standard timeline phases and durations:**
- Brief approval and instrument design: 3-5 business days (longer if multiple stakeholder reviews)
- Panel or participant recruitment: 3-7 days for consumer panels; 7-14 days for B2B or executive audiences; 14-21 days for hard-to-reach professionals (physicians, C-suite)
- Survey data collection: 5-10 days to hit sample targets using a panel; keep survey open minimum 5 days to capture different day-of-week response patterns
- Qualitative interviews: plan 1-3 interviews per day maximum for quality; 5 days of interviewing for 10 sessions
- Transcription: 24-48 hours turnaround with professional transcription service; AI transcription tools (e.g., Otter, Descript) produce first drafts in real time but require review
- Analysis: 3-5 days for quantitative; 5-7 days for qualitative thematic coding; 7-10 days for mixed methods
- Report writing and presentation development: 3-5 days
- Stakeholder review and revision: 2-3 days
- Total minimum realistic timeline: 4 weeks for a clean survey study; 6-8 weeks for mixed methods; 8-12 weeks for complex multi-segment studies

**Standard budget components:**
- Participant incentives: the single largest variable cost; calculate as (n participants) x (incentive per person)
- Panel or recruitment platform fees: panel providers charge $3-$15 per complete for consumer research, $25-$100 per complete for B2B professionals (on top of incentives), depending on incidence rate (how many screenees qualify per complete) and difficulty of the sample
- Survey platform: research-grade platforms (Qualtrics, SurveyMonkey Audience, Alchemer) range from $200-$2,000+ depending on features needed; advanced conjoint or MaxDiff requires specialized platforms
- Qualitative recruitment and operations: scheduling tools, Zoom or user testing platform subscriptions, recording and transcription services
- Analysis tools: statistical software (many teams use Excel for basic analysis; SPSS, R, or Python for advanced statistics)
- Reporting and visualization: presentation software, charting tools
- Research operations overhead: screener design time, data cleaning time, project management time
- Contingency: always include 10-15% buffer for over-recruitment costs, re-fielding if data quality fails, or timeline extensions

### Step 8: Define Deliverables and the Decision Framework

The research brief is not complete until it specifies exactly what happens to the findings.

- List every deliverable with a specific format and delivery date: not "a report" but "a 20-page research report with executive summary, methodology appendix, and annotated data tables in PDF format."
- Write the decision framework: a pre-agreed mapping of possible findings to business actions. This prevents post-hoc interpretation where stakeholders reframe inconvenient findings. Format it as an if-then matrix: "If [finding], then [recommended action]."
- Identify the primary audience for each deliverable and calibrate depth accordingly. An executive summary is 1-2 pages maximum. A full report includes methodology detail so the research can be replicated or audited. A stakeholder presentation is structured around implications, not methodology.
- Specify data archiving and anonymization requirements. Raw data should always be delivered in an anonymized format. Define the retention period for raw data (standard is 12-24 months for market research).

---

## Output Format

```
## Market Research Brief: [Descriptive Study Title]

**Business Decision:** [The exact choice the research will inform -- phrased as a decision, not a topic]
**Decision Owner:** [Name and title of person who will act on findings]
**Research Sponsor:** [Name and title of person commissioning the research]
**Research Lead:** [Name or role of person responsible for execution]
**Brief Date:** [Date brief was finalized]
**Decision Deadline:** [Date by which research findings must be available]
**Research Timeline:** [Start date] to [End date]
**Status:** [Draft / Under Review / Approved]

---

### 1. Business Context

**Current Situation:**
[2-4 sentences describing the business context, the gap in knowledge, and what triggered this research now]

**Internal Data Available:**
- [Source 1]: [What it contains and what it can/cannot answer]
- [Source 2]: [What it contains and what it can/cannot answer]

**Previous Research:**
[Summary of any prior research on this topic and why new research is needed, or "None conducted"]

**Consequence of Wrong Decision:**
[What happens if the business acts on incorrect assumptions -- frames the stakes and required rigor]

---

### 2. Research Questions and Hypotheses

**Primary Research Question:**
[Single clear question that the study is designed to answer]

**Primary Hypothesis:**
[Expected answer based on current evidence]

**Null Hypothesis:**
[The finding that would indicate the current assumption is wrong]

**Decision Trigger:**
[Specific quantitative or qualitative threshold that signals a change in course -- e.g., "If stated conversion intent is below 12%, do not proceed. If above 20%, proceed to build."]

**Secondary Research Questions:**

| # | Question | Hypothesis | How It Informs the Primary |
|---|----------|------------|---------------------------|
| 1 | [Question] | [Expected finding] | [Relationship to primary] |
| 2 | [Question] | [Expected finding] | [Relationship to primary] |
| 3 | [Question] | [Expected finding] | [Relationship to primary] |

---

### 3. Methodology

**Research Approach:** [Quantitative / Qualitative / Mixed Methods]

**Method Justification:**
[2-4 sentences explaining why this specific method combination is appropriate for this research question, within this timeline and budget. Address what confidence it provides and what limitations it carries.]

**Method Details:**

| Component | Specification |
|-----------|---------------|
| Primary Method | [e.g., Online survey using Van Westendorp price sensitivity methodology] |
| Secondary Method | [e.g., 10 in-depth interviews, 45-minute semi-structured] |
| Research Design | [Monadic / sequential / concurrent / comparative] |
| Confidence Level | [95% / 90%] |
| Margin of Error | [+/-X%] |
| Total Sample | [N total, with segment breakdown] |
| Study Duration | [Data collection window] |

---

### 4. Sample Design

**Target Population:**
[Definition of the full universe of people this research represents]

**Inclusion Criteria:**
- [Criterion 1: specific and measurable]
- [Criterion 2]
- [Criterion 3]

**Exclusion Criteria:**
- [Criterion 1]
- [Criterion 2 -- always include: competitors, market research professionals, recent survey participants]

**Segmentation Plan:**

| Segment | Definition | Target n | Purpose |
|---------|------------|----------|---------|
| [Segment 1] | [Criteria] | [n] | [Why analyzed separately] |
| [Segment 2] | [Criteria] | [n] | [Why analyzed separately] |
| [Segment 3] | [Criteria] | [n] | [Why analyzed separately] |
| **Total** | | **[N]** | |

**Recruitment Method:**
[Panel provider / CRM / intercept / LinkedIn / other -- specify why this source is appropriate]

**Participant Incentive:**
[Amount and format per participant type -- justify relative to participant time and difficulty of recruitment]

**Expected Incidence Rate:**
[% of screened population expected to qualify -- drives recruitment cost calculation]

---

### 5. Data Collection Instrument

**Instrument Type:** [Online survey / Semi-structured interview guide / Observation protocol / Secondary data codebook]

**Estimated Participant Time:** [X minutes]

**Structure Overview:**

| Section | Purpose | # Questions / Time | Key Constructs Measured |
|---------|---------|-------------------|------------------------|
| Screening | Qualify respondent | [2-4 questions] | [Qualifying criteria] |
| Warm-up / Context | Establish baseline behavior | [X questions / X min] | [Category usage, habits] |
| Core Research | Answer primary and secondary questions | [X questions / X min] | [Key constructs] |
| Concept or Stimulus | React to specific proposition | [X questions / X min] | [Appeal, intent, trade-offs] |
| Demographics | Enable segmentation analysis | [4-6 questions] | [Age, role, company size, etc.] |

**Key Question Topics:**
1. [Topic and measurement approach -- e.g., "Current workflow pain points: open-ended ranking, no priming"]
2. [Topic and measurement approach]
3. [Topic and measurement approach]
4. [Topic and measurement approach]
5. [Topic and measurement approach]

**Scale Types:**
- [Construct]: [Scale type and points -- e.g., "Purchase intent: 5-point Likert, 'Definitely would not' to 'Definitely would'"]
- [Construct]: [Scale type]

**Quality Controls:**

| Control | Method | Exclusion Rule |
|---------|--------|----------------|
| Attention | [e.g., Trap question at Q7: "Please select 'Neither agree nor disagree'"] | Exclude if fail |
| Speeders | Minimum completion time: [X] minutes | Exclude if below threshold |
| Straight-lining | [Check for identical responses across 5+ consecutive matrix questions] | Flag for review, exclude if egregious |
| Open-end quality | [Manual review of all open text responses] | Exclude gibberish or single character |
| Duplicate detection | [IP address and device ID deduplication] | Exclude duplicates |

---

### 6. Analysis Plan

| Research Question | Method | Tool | Expected Output Format |
|------------------|--------|------|----------------------|
| [Primary question] | [e.g., Cross-tab with chi-square test, p<0.05] | [Excel / SPSS / R] | [e.g., Table of intent by segment with significance flags] |
| [Secondary 1] | [Method] | [Tool] | [Output format] |
| [Secondary 2] | [Method] | [Tool] | [Output format] |
| [Secondary 3] | [Method] | [Tool] | [Output format] |

**Decision Framework (Pre-Agreed):**

| Finding | Interpretation | Recommended Action |
|---------|---------------|-------------------|
| [Finding threshold 1] | [What it means] | [Action A] |
| [Finding threshold 2] | [What it means] | [Action B] |
| [Finding threshold 3 -- null hypothesis confirmed] | [What it means] | [Action C] |

---

### 7. Timeline

| Phase | Duration | Start | End | Owner | Deliverable |
|-------|----------|-------|-----|-------|-------------|
| Brief approval | [X days] | [Date] | [Date] | [Name/role] | Signed-off brief |
| Instrument design | [X days] | | | | Draft survey / guide |
| Internal review and pilot | [X days] | | | | Piloted instrument (n=5) |
| Instrument finalization | [X days] | | | | Approved instrument |
| Recruitment / panel launch | [X days] | | | | Target n achieved |
| Data collection | [X days] | | | | Raw data file |
| Data cleaning and QC | [X days] | | | | Clean dataset |
| Analysis | [X days] | | | | Analytical outputs |
| Report drafting | [X days] | | | | Draft report |
| Stakeholder review | [X days] | | | | Revision comments |
| Final report delivery | [X days] | | | | Final deliverables |
| **Total** | **[X days]** | **[Start]** | **[End]** | | |

---

### 8. Budget

| Item | Unit Cost | Quantity | Total |
|------|-----------|----------|-------|
| Survey panel (per complete) | $[X] | [n] | $[X] |
| Interview participant incentives | $[X] | [n] | $[X] |
| Survey platform (monthly) | $[X] | [1-2 months] | $[X] |
| Recruitment / screening (panel fee) | $[X] | | $[X] |
| Transcription (per hour of audio) | $[X] | [X hours] | $[X] |
| Research operations (scheduling, logistics) | $[X] | | $[X] |
| Analysis tools | $[X] | | $[X] |
| Reporting and visualization tools | $[X] | | $[X] |
| Contingency (10-15%) | | | $[X] |
| **Total** | | | **$[X]** |

**Budget Notes:**
[Any assumptions in the budget, e.g., incidence rate assumption, internal labor excluded, etc.]

---

### 9. Deliverables

| Deliverable | Format | Audience | Delivery Date | Owner |
|-------------|--------|----------|---------------|-------|
| Research brief (this document) | PDF | Research team, sponsor | [Date] | [Name] |
| Finalized survey / interview guide | PDF | Research team | [Date] | [Name] |
| Executive summary | 1-2 page PDF | C-suite, decision owner | [Date] | [Name] |
| Full research report | [X]-page PDF with appendices | Research team, sponsor | [Date] | [Name] |
| Stakeholder presentation | [X]-slide deck | [Audience] | [Date] | [Name] |
| Anonymized raw data | CSV / XLSX | Research archive | [Date] | [Name] |
| Analytical data tables | XLSX | Research team | [Date] | [Name] |

**Data Retention:** Raw data will be retained for [12 / 24] months in [secure location] and then purged. No personally identifiable information will be included in shared files.

---

### 10. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [Risk 1: e.g., Low incidence rate extends recruitment timeline] | [High/Med/Low] | [High/Med/Low] | [e.g., Over-recruit by 20%; have backup panel source] |
| [Risk 2] | | | |
| [Risk 3] | | | |
```

---

## Rules

1. **Never produce a brief without a named business decision.** The brief must begin with a specific choice the organization is facing, not a topic of curiosity. If the user cannot state the decision, ask clarifying questions before proceeding. Research without a decision trigger is unfundable and unactionable.

2. **Always include a decision trigger with a specific threshold.** The decision trigger is the pre-agreed finding that changes the course of action. It must include a specific number or clear qualitative standard -- not "if results are positive." Without this, stakeholders will rationalize any result as confirmation of their prior belief.

3. **Sample size must be justified with explicit statistical parameters.** For quantitative studies, state confidence level (minimum 90%, standard 95%), margin of error (standard ±5%), and expected response distribution. For qualitative studies, cite the saturation threshold and justify the number of interviews per segment. Never write "n=50 interviews" without explaining why 50 is appropriate for this study design.

4. **Never recommend a methodology without justifying it against the specific research question, timeline, and budget.** A conjoint study that requires 6 weeks and $40K is wrong for a $5K, 3-week brief. A 5-question survey is wrong when the team needs to understand emotional drivers of churn. The justification for methodology selection must be explicit in the brief.

5. **Every research question must have a corresponding row in the analysis plan.** If you cannot specify how a question will be analyzed before data collection, the question is not ready to be in the brief. Questions without analysis plans generate data that cannot be interpreted.

6. **Always include a null hypothesis for the primary research question.** This is the finding that would indicate the team's current assumption is wrong. Including it forces the team to acknowledge that the research might produce an inconvenient answer -- and designs the study to detect that outcome.

7. **Qualitative and quantitative methods must not be treated as interchangeable.** Qualitative research answers "why" and "how" -- it cannot produce percentages that generalize to a population. Quantitative research answers "how many" and "how much" -- it cannot explain underlying motivations. If a brief is using qualitative findings to make percentage claims, flag this as a methodological error and correct it.

8. **Budget must include all cost components, not just the most visible ones.** Incentives, panel fees, platform subscriptions, transcription, recruitment logistics, analysis tools, and a 10-15% contingency must all appear. Teams routinely underestimate panel fees (incidence rate), transcription costs, and over-recruitment expenses.

9. **Timeline must be built backward from the decision deadline, not forward from today.** Identify the hard deadline first, then subtract each phase's minimum duration. If the resulting timeline is insufficient for the proposed methodology, recommend a scaled-down method and explicitly state the trade-offs in confidence and generalizability.

10. **Do not recommend a survey when a 5-interview qualitative study would actually answer the question better.** Surveys are expensive, slow, and over-specified for early-stage exploratory questions. If the team does not yet know what they do not know, qualitative exploration should precede quantitative measurement. The default is not always a survey.

11. **Include quality controls specific to the chosen method.** For surveys: attention checks, speeder detection, duplicate IP filtering, and open-end quality review. For interviews: transcription, member checking, and inter-rater reliability on coding. Generic "we will ensure data quality" statements are not quality controls.

12. **If the user's budget or timeline cannot support a methodologically sound study, say so explicitly.** Propose a scaled alternative and state what confidence and generalizability it sacrifices. Never produce a brief that would generate misleading findings without flagging the limitations. A brief that oversells weak methodology causes real business harm.

---

## Edge Cases

**Zero or near-zero budget (under $1,000):**
Shift entirely to no-cost or low-cost methods. Secondary research options: government datasets (Bureau of Labor Statistics, Census Bureau NAICS data, SEC filings), free industry report executive summaries, Google Trends and keyword research for demand signals, and app store review mining. Internal data options: CRM export analysis, support ticket tagging and frequency analysis, sales call notes and lost-deal reasons. Guerrilla qualitative: 5-7 intercept interviews with target customers at industry events, LinkedIn direct outreach interviews (no incentive, frame as advisory conversation), or community forum listening (Reddit, Slack communities, LinkedIn groups). The brief must state limitations prominently: "These findings are directional only. Secondary and social listening data reflect self-selected voices. No statistical generalization is possible."

**Compressed timeline (under 10 business days):**
Use a rapid-research design: a 5-question online survey (sub-7-minute completion) deployed via a consumer panel for same-day or next-day data collection, combined with 5 exploratory interviews using a 20-minute guide (schedule via LinkedIn or internal network). Note: at this speed, survey n will be limited (target n=200 minimum), confidence will be lower (report ±7% margin at 90% confidence rather than ±5% at 95%), and qualitative themes will be provisional rather than saturated. The brief must include a recommendation to conduct follow-up research before committing major resources to the findings.

**Sensitive topics -- pricing, competitive switching, churn, or reasons for non-purchase:**
Several methodological adaptations are required. Use indirect questioning: instead of "Why did you cancel?" ask "Describe the moment you decided to reconsider your subscription." Use third-party recruiters and interviewers when churn or switching is the topic -- participants are more honest with people they do not perceive as the company being studied. For pricing research, avoid direct "What would you pay?" questions (they anchor respondents and produce artificially high willingness-to-pay estimates). Use Van Westendorp or Gabor-Granger instead. For surveys, include explicit anonymity language in the invitation and instrument: "Your responses are anonymous. [Company] will not see individual responses."

**International or multi-market research:**
Direct translation of surveys is not sufficient. Instrument adaptation requires: (1) translation into the target language by a native speaker with domain knowledge, (2) back-translation by a different native speaker to check for conceptual drift, (3) in-market pilot with 5-10 respondents to verify comprehension. Response style bias is a documented issue: many Asian markets show extreme response avoidance on Likert scales (central tendency bias); Latin American markets show acquiescence bias (tendency to agree). Adjust scale types and include scale-use prompts accordingly. Recruitment is significantly harder in markets with lower panel penetration -- add 5-10 additional business days for recruitment in B2B panels outside English-speaking markets. Budget per complete is typically 1.5-2x higher in specialized international B2B panels.

**No prior baseline data exists:**
If the team has no existing data on the research topic (new market, new category, new customer segment), the brief should be structured as a two-phase study. Phase 1 is exploratory qualitative (8-12 interviews) to map the territory: what vocabulary do customers use, what jobs are they doing, what alternatives do they currently consider? Phase 1 outputs inform the Phase 2 instrument design. Phase 2 is quantitative measurement. Without Phase 1, survey question design will reflect the company's vocabulary and assumptions rather than the customer's mental model, producing misleading data.

**Research on customers the company already has (customer research vs. market research):**
When the sample comes from the company's own CRM, introduce bias mitigations: (1) sample should be stratified by customer value tier, tenure, and engagement level -- not just "all customers who agreed to be contacted"; (2) for churn or satisfaction research, weight toward recently churned or low-NPS customers who are rarely over-represented in volunteer samples; (3) disclose to respondents who is conducting the research and what it will be used for -- this is required for GDPR and CCPA compliance. Do not recruit from internal customer lists for competitive research -- participants will not be candid about competitive products when they know you are watching.

**Conjoint or MaxDiff study design requests:**
These require specialized treatment. Conjoint analysis (choice-based or adaptive): define attributes and levels first (typically 4-6 attributes, 2-4 levels each). Stimuli are built automatically by the platform into choice tasks. Each respondent completes 8-15 choice tasks. Requires minimum n=150 per segment for stable part-worth utilities; n=300 is more reliable. Use CBC (Choice-Based Conjoint) for realistic purchase simulation; ACBC (Adaptive CBC) for studies with many attributes. MaxDiff: appropriate for prioritizing a list of 10-30 items when ranking produces satisficing bias. Requires 3-4 choice sets per item, so a 20-item MaxDiff requires 5-6 sets per respondent. Minimum n=100 per segment; n=200 recommended. Both methods require specialized survey platforms (Sawtooth Software is the gold standard for conjoint; Qualtrics supports both at a higher price point). Plan additional instrument design time: 1-2 weeks for attribute development, internal testing, and pilot.

**Stakeholder alignment failure -- team cannot agree on the research question:**
If the user cannot define a single primary research question because internal stakeholders are pulling the study in multiple directions, flag this as a project risk before producing the brief. Recommend a 60-minute research scoping workshop with all stakeholders before finalizing the brief. In the workshop: (1) have each stakeholder write their most important question on a card, (2) group questions by theme, (3) ask which question, if answered, would most directly inform the immediate business decision, (4) make that the primary question. Studies designed by committee to answer everyone's question simultaneously answer no one's question reliably.

---

## Example

**Input:** "We run a B2B SaaS product for mid-market HR teams -- roughly 200-2,000 employee companies. Our ACV is $18,000. We've been losing deals to a competitor that offers AI-driven candidate screening, which we don't have. We're trying to decide whether to build native AI screening, partner with a vendor and white-label it, or just improve our existing filtering tools. Before we commit engineering resources, we want to understand how much HR buyers actually value AI screening versus other features, and whether it's actually driving our losses or if sales is overstating it. We have about $15,000 and 6 weeks."

---

**Output:**

## Market Research Brief: AI Screening Feature Value and Competitive Loss Analysis

**Business Decision:** Should we build native AI candidate screening, white-label a third-party AI screening vendor, or invest in improving existing filtering capabilities to address competitive losses?
**Decision Owner:** VP of Product
**Research Sponsor:** Chief Product Officer
**Research Lead:** Head of Research / Research Vendor TBD
**Brief Date:** [Current date]
**Decision Deadline:** [6 weeks from today]
**Research Timeline:** [Today] to [6 weeks from today]
**Status:** Draft -- pending CPO approval

---

### 1. Business Context

**Current Situation:**
We are losing a meaningful proportion of competitive deals to a competitor that offers AI-driven candidate screening. Sales is attributing losses to this feature gap, but this attribution comes from post-call notes rather than structured buyer research -- the actual role of AI screening in purchase decisions has not been validated. Before committing 6-9 months of engineering time or entering a partnership agreement, the product team needs direct evidence of how mid-market HR buyers weigh AI screening against other product capabilities, and whether it is a genuine table-stakes requirement or a feature that is strategically useful in sales conversations but not actually determinative.

**Internal Data Available:**
- CRM lost-deal reasons (last 18 months): Contains sales rep attribution of loss reasons. Useful as directional signal; not reliable as primary evidence because rep attribution is subjective and varies by rep.
- Win/loss call notes (partial): Roughly 40% of lost deals have documented notes. Insufficient for systematic analysis but will inform interview guide development.
- NPS and CSAT data (existing customers): Can identify which customers are at risk of churning to competitor. Will be used to select interview participants for retention-risk segment.

**Previous Research:**
No formal primary research has been conducted on this decision. An informal sales team survey was conducted 8 months ago (n=12 internal respondents) confirming that AI screening is "coming up in deals frequently," but no buyer-side research exists.

**Consequence of Wrong Decision:**
Committing to native build is a 6-9 month engineering investment at approximately $400K-$600K. A wrong build decision wastes this investment and delays other roadmap items. A wrong "do nothing" decision risks continued competitive erosion. The $15K research budget represents less than 4% of the minimum build cost -- the research is well-justified financially.

---

### 2. Research Questions and Hypotheses

**Primary Research Question:**
Among mid-market HR buyers (200-2,000 employee companies), how does AI candidate screening rank in importance relative to other product capabilities when evaluating or switching HR software vendors?

**Primary Hypothesis:**
AI candidate screening is valued but is not a top-3 purchase driver for most mid-market HR buyers. It appears prominently in competitive conversations because it is a salient, demonstrable differentiator -- but factors like implementation ease, customer support quality, and ATS integration depth are more determinative of purchase decisions.

**Null Hypothesis:**
AI candidate screening is a table-stakes requirement for more than 40% of mid-market HR buyers, meaning its absence is a primary reason to eliminate a vendor from consideration -- confirming the sales team's attribution.

**Decision Trigger:**
- If AI screening is ranked in the top 3 features by 40% or more of buyers AND is cited as a purchase barrier by 30% or more: prioritize build or partner.
- If AI screening is ranked top 3 by 20-39% of buyers: evaluate white-label partnership as a lower-investment response.
- If AI screening is ranked top 3 by fewer than 20% of buyers: de-prioritize AI screening investment; address other gaps first.

**Secondary Research Questions:**

| # | Question | Hypothesis | How It Informs the Primary |
|---|----------|------------|---------------------------|
| 1 | Which product capabilities are most important when evaluating HR software for mid-market companies (100-2,000 employees)? | Ease of implementation, ATS integration, and reporting/analytics rank higher than AI features among buyers | Establishes the full competitive landscape of priorities so AI screening can be ranked within it |
| 2 | Among buyers who evaluated our product and chose a competitor, what was the primary stated reason for their decision? | Deal losses are driven by a combination of factors; AI screening is one of several cited, not the sole differentiator | Validates or contradicts sales team's attribution of losses to AI gap specifically |
| 3 | What is the willingness to pay a premium for AI screening capabilities, if offered as an add-on versus included in base price? | Fewer than 25% of mid-market buyers would pay a premium add-on for AI screening; most expect it included if offered | Informs the partnership economics decision: if buyers won't pay a premium, white-labeling at cost may not be viable |
| 4 | Which specific AI screening use cases do buyers find most valuable: resume parsing, automated shortlisting, bias detection, or interview scheduling automation? | Automated shortlisting and resume parsing rank highest; bias detection is valued rhetorically but not a purchase driver | Scopes any build or partner decision to the minimum viable AI feature set |

---

### 3. Methodology

**Research Approach:** Mixed Methods -- Quantitative primary, Qualitative secondary

**Method Justification:**
The primary research question requires quantitative measurement to produce rankable, statistically reliable feature priority data that can be compared across buyer segments. However, interview data is critical to understanding the decision context around AI screening -- specifically, how buyers describe and weigh AI features in their own vocabulary. Qualitative interviews will precede the survey instrument design to ensure that feature descriptions in the survey reflect buyer language rather than product team language. The budget supports a credible mixed-methods study within the timeline.

**Method Details:**

| Component | Specification |
|-----------|---------------|
| Primary Method | MaxDiff survey for feature prioritization, with purchase intent and willingness-to-pay questions using Van Westendorp Price Sensitivity Meter |
| Secondary Method | 10 in-depth interviews (45 minutes, semi-structured), conducted before survey launch to inform instrument design |
| Research Design | Sequential mixed methods: qualitative exploration informs quantitative measurement |
| Confidence Level | 95% |
| Margin of Error | ±6% (achievable at n=250 within budget) |
| Total Sample | 10 IDIs + 250 survey completions |
| Study Duration | Interviews: 8 business days; survey: 10 business days |

---

### 4. Sample Design

**Target Population:**
HR directors, HR managers, VP of HR, Talent Acquisition leads, and CHROs at US-based companies with 200-2,000 employees who have participated in an HR software evaluation (purchase or replacement) in the past 24 months.

**Inclusion Criteria:**
- Job title in HR, People Operations, or Talent Acquisition
- Company size 200-2,000 US employees
- Involved in or influenced a purchasing decision for HR software (ATS, HRIS, or recruiting platform) in the past 24 months
- B2B company (not staffing agencies or professional employer organizations, which have different buyer behavior)

**Exclusion Criteria:**
- Employees of HR software or recruiting technology companies (competitors and category participants)
- Market research or survey professionals
- Participated in HR software research survey in the past 6 months (panel fatigue and bias)
- Companies with fewer than 200 or more than 2,000 employees (outside the target ICP)
- HR administrators without budget or evaluation influence

**Segmentation Plan:**

| Segment | Definition | Target n (Survey) | Target n (IDIs) | Purpose |
|---------|------------|-------------------|-----------------|---------|
| Recent switchers | Evaluated and switched HR vendor in past 12 months | 100 | 4 | Direct evidence of purchase drivers; most relevant to competitive loss question |
| Active evaluators | Currently evaluating HR software vendors | 75 | 3 | Forward-looking intent data; highest purchase decision clarity |
| Status quo | Using current HR software, no active evaluation | 75 | 3 | Baseline priority data; understand latent demand for AI features |
| **Total** | | **250** | **10** | |

**Recruitment Method:**
B2B professional panel for survey (2-3 panel providers used simultaneously to achieve n=250 within timeline -- single provider rarely delivers 250 B2B completions in under 10 days). LinkedIn Sales Navigator outreach combined with panel for IDI recruitment. IDI participants should not overlap with survey panel participants.

**Participant Incentive:**
- Survey (15 min): $35 Amazon gift code (B2B professional rate)
- IDI (45 min): $150 Amazon gift code

**Expected Incidence Rate:**
Estimated 15-20% for survey panel (strict job title, company size, and recency of purchase decision criteria). Budget is built at 15% incidence rate.

---

### 5. Data Collection Instrument

**Survey Instrument Type:** Online survey -- MaxDiff feature prioritization module + Van Westendorp price sensitivity + purchase driver attribution

**Estimated Participant Time:** 14-16 minutes

**Structure Overview:**

| Section | Purpose | Questions | Key Constructs |
|---------|---------|-----------|----------------|
| Screening | Qualify respondent | 4 questions | Title, company size, purchase involvement, recency |
| HR tech context | Establish baseline | 3 questions | Current vendor, tenure with vendor, overall satisfaction |
| Feature prioritization (MaxDiff) | Answer primary question | 12 choice tasks, 5 items per task across 18 features | Relative importance of 18 product features including 4 AI screening variants |
| Purchase decision attribution | Answer secondary Q2 | 2 questions (evaluators and switchers only) | Top reasons for current vendor selection; barriers to switching |
| AI screening attitudes | Answer secondary Q4 | 3 questions | Familiarity with AI screening, use cases ranked, perceived value |
| Pricing and willingness to pay | Answer secondary Q3 | 4 questions
