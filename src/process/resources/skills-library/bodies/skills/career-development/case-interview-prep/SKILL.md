---
name: case-interview-prep
description: |
  Teaches the standard case interview structure used by consulting and finance
  firms: clarification, framework selection, analysis, and recommendation.
  Walks the user through a practice case and produces a structured response
  template for each case type. Use when the user is preparing for a case
  interview, applying to consulting firms, or needs to practice structured
  problem-solving in an interview context. Do NOT use for behavioral interview
  preparation (use behavioral-interview-prep), technical coding interviews
  (use technical-interview-prep), or general interview question prediction
  (use interview-question-anticipator).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "interview-prep career template"
  category: "career-development"
  subcategory: "interview-preparation"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Case Interview Prep

## When to Use

Use this skill when the user explicitly needs help with structured case interview preparation -- not general interview coaching. Trigger scenarios include:

- User is preparing for an interview at an MBB firm (McKinsey, BCG, Bain), Big 4 strategy practice (Deloitte S&O, PwC Strategy&, EY-Parthenon, KPMG), or a boutique strategy firm (Oliver Wyman, L.E.K., Roland Berger, A.T. Kearney/Kearney, Strategy&)
- User is interviewing for an internal strategy, corporate development, or M&A role that explicitly requires case-based assessment
- User is applying for a private equity, hedge fund, or investment banking role that uses case studies or investment memos as part of the interview process
- User needs to practice market sizing, profitability, market entry, M&A diligence, pricing strategy, or growth strategy cases and wants a structured approach
- User is preparing for a written case or group case exercise (common at Oliver Wyman, L.E.K., and some PE firms)
- User wants to diagnose weaknesses in their case performance after a previous round and build a targeted improvement plan
- User is a career changer (engineer, doctor, lawyer) who is new to consulting and needs to learn structured business problem-solving from scratch

**Do NOT use when:**
- User needs behavioral interview preparation ("Tell me about a time you led a team") -- use `behavioral-interview-prep` instead
- User needs technical coding interview preparation (LeetCode-style problems, system design) -- use `technical-interview-prep` instead
- User wants to predict specific interview questions at a target firm -- use `interview-question-anticipator` instead
- User wants to research a specific company's culture, values, or business model -- use `company-research-guide` instead
- User wants salary negotiation guidance after receiving an offer -- use `offer-negotiation` instead
- User needs help writing a consulting cover letter or resume -- use `resume-writing` instead
- User is preparing a client-facing business presentation or consulting deliverable (not an interview) -- use `consulting-slide-writing` instead

---

## Process

### Step 1: Diagnose the User's Situation

Before providing any frameworks or practice, gather four pieces of information:

- **Target firm tier and format:** MBB uses primarily interviewee-led cases (BCG, Bain) or a hybrid interviewer-led format (McKinsey's structured problem-solving interview, which replaced the traditional case). Big 4 and boutique firms vary widely -- Oliver Wyman uses quantitative cases with significant data, L.E.K. uses written case exercises, and Deloitte uses a mix of interviewer-led cases and group exercises. Confirm which format applies.
- **Round number:** First-round cases are typically more structured and shorter (20-25 minutes); final-round cases are more ambiguous, involve senior partners, and expect broader strategic thinking with explicit senior-hire judgment.
- **Case types already practiced:** If the user has practiced profitability and market sizing but never done an M&A or capacity expansion case, prioritize the gaps.
- **Functional background:** An engineer without business training needs more grounding in financial statements and unit economics. A finance professional needs more coaching on synthesis and structured communication rather than calculation mechanics.

Ask directly: "What firm and round are you preparing for? What types of cases have you already practiced? What aspect of case performance do you feel weakest on?"

---

### Step 2: Explain the Universal Case Architecture

Every consulting case -- regardless of type, firm, or industry -- follows the same four-phase structure. The phases differ in content but not sequence. The timing guidance below is for a standard 25-minute interviewer-led case:

**Phase 1 -- Clarify (2-4 minutes)**
- Restate the case prompt in your own words to confirm you understood the problem correctly. This is not just politeness -- it catches misunderstandings before you waste time on the wrong analysis.
- Ask 2-3 targeted clarifying questions. Good clarifying questions reduce ambiguity about scope (geography, business unit, timeframe), the definition of success (profit? market share? strategic positioning?), and whether constraints exist (budget cap, no acquisitions, specific timeline).
- Avoid asking questions whose answers you could reasonably assume or that are irrelevant to your initial framework. Asking "What is the company's mission statement?" is a red flag.
- Confirm the objective out loud: "So our goal is to determine whether [client] should [action] given [constraints], and we will measure success by [metric]. Is that correct?"
- For McKinsey's problem-solving interview (PSI/PEI format): the clarification phase is shorter and the interviewer will push you toward structured hypothesis-driven thinking immediately.

**Phase 2 -- Structure (3-5 minutes)**
- Request 30-60 seconds to structure your approach. Say exactly that: "Let me take 30 seconds to organize my thoughts before I present a framework."
- Build a MECE (mutually exclusive, collectively exhaustive) framework with exactly 3-4 top-level branches. Fewer than 3 signals underdevelopment; more than 4 signals inability to prioritize.
- Never name a canned framework (Porter's Five Forces, SWOT, BCG Growth-Share Matrix) as your primary structure. Interviewers know these models; using them by name signals you memorized rather than thought. Instead, derive branches directly from the case logic. A market entry case might have branches of "market attractiveness," "competitive dynamics," "company fit," and "financial viability" -- that happens to resemble Porter partly, but it is built from the question.
- State which branch you will analyze first and why. Prioritization signals maturity: "I would start with the revenue side because the prompt told us costs are stable -- that narrows the likely driver immediately."
- For BCG/Bain interviewee-led cases: you control the pacing and must proactively move between branches. For McKinsey PSI cases: the interviewer may redirect you mid-analysis, so your framework needs to be flexible enough to pivot.

**Phase 3 -- Analyze (15-20 minutes)**
- Work through each framework branch systematically, but stay adaptive. If data from Branch 1 strongly implicates Branch 2, say so: "The volume decline we just found makes me want to prioritize the competitive dynamics branch next rather than cost structure."
- At every node where you need data, ask for it specifically: "Do we have data on how operating margin has trended over the past three years?" Not: "Can you tell me more about the financials?"
- Perform all calculations out loud. Round aggressively to numbers divisible by common factors. Convert $47.3M to $50M; convert 22.7% to ~23% then round to 25% if needed. State your rounding explicitly: "I will call that 25% to keep the math clean -- that gives us approximately $125M."
- Synthesize after each branch before moving on. Do not just report data -- draw a conclusion: "The revenue decline appears concentrated in the SMB segment, which has lower retention rates. This suggests the issue is competitive, not pricing. Let me now check the competitive landscape."
- Watch for math traps that commonly appear in cases: percentage point changes vs. percentage changes (a margin drop from 20% to 16% is a 4 percentage point decline and a 20% relative decline -- these mean very different things), absolute vs. relative metrics, and total vs. per-unit figures.
- In profitability cases, always complete the full profit bridge before recommending fixes. Candidates who skip to solutions before quantifying the problem look junior.

**Phase 4 -- Recommend (2-3 minutes)**
- Open with a direct, confident recommendation. Never hedge at the top: "I recommend [specific action]" not "Based on what we have seen, it might be worth considering..."
- Support the recommendation with exactly three reasons drawn from your analysis. The three-reason structure signals consulting communication discipline.
- Acknowledge the single most important risk and name a concrete mitigation action.
- Propose one to two next steps that the client would actually take in real life (conduct a customer survey, run a regional pilot, commission supplier RFQ).
- If asked to present to a "CEO" or "partner" in the closing, elevate your language -- skip the analysis playback and go straight to: "The bottom line is [recommendation]. Here is why this is the right move."

---

### Step 3: Deliver Framework Templates by Case Type

Present the relevant framework for the user's target case type. Each framework below includes the standard branches, the most common data requests within each branch, and the math that typically appears.

**Profitability Case Framework**

The profit decline has two possible sources: revenue or cost. Work through each systematically before diagnosing.

Revenue = Price x Volume (x Mix, if the business has multiple product lines)
- Price: Has average selling price or realized price changed? Is there a mix shift toward lower-priced SKUs?
- Volume: Has unit volume changed? Is the decline concentrated in a segment, geography, or channel?
- Mix: Does the business have multiple products or customer segments? If one high-margin segment is shrinking, blended revenue stays flat but profit falls.

Cost = Fixed Costs + Variable Costs
- Fixed: Rent, depreciation, salaries, insurance. These should not move with volume -- if they did, ask why.
- Variable: COGS (materials, direct labor, packaging), distribution, commissions. These move with output.
- One-time charges: Write-offs, severance, legal settlements can distort a single year's profit. Always ask whether any unusual items exist.

After decomposing the P&L, calculate the magnitude of each driver: "A 5 percentage point increase in food costs on $500M of revenue is a $25M annual drag -- that alone accounts for most of the $30M profit decline."

**Market Entry Case Framework**

Four branches, in order of typical importance:

1. Market attractiveness -- Size (TAM, SAM), growth rate (5%+ is attractive, <2% is mature), profitability (industry EBITDA margins), and structural forces (concentration of buyers, substitutes, regulatory barriers).
2. Competitive dynamics -- Who are the top 3 players? What are their market shares? Is there a dominant leader (>40% share means hard to displace) or a fragmented market (top player <20% share means opportunity)? What is the basis of competition (price, quality, relationships, speed)?
3. Company capability fit -- Does the client have relevant product capabilities, operational infrastructure, brand recognition, and channel access? Where are the gaps, and how costly to close?
4. Entry mode and financial viability -- Build (slower, lower risk, full control), buy (faster, higher cost, integration risk), or partner (low capital, less control). Calculate a back-of-envelope NPV or payback period: investment required divided by annual incremental profit equals payback years. Less than 3 years is strong; more than 7 years needs strong strategic rationale.

**Market Sizing Case Framework**

Choose between top-down and bottom-up based on what is easier to anchor on:

Top-down: Start with total addressable population, segment by relevant characteristics (age, income, geography), apply penetration rate, multiply by usage frequency, multiply by average transaction value.

Bottom-up: Start with the supply side (number of units, locations, or providers), multiply by throughput (customers per day), multiply by average ticket, multiply by 365 days.

Always state every assumption before calculating it. The interviewer is not checking your arithmetic -- they are checking whether your assumptions are reasonable and whether you can defend them. Common anchors to memorize: US population ~330M, US households ~130M, US adult population ~260M, US GDP ~$25T.

**M&A / Acquisition Case Framework**

Five branches:

1. Strategic rationale -- Why does this target make sense for the acquirer? Common rationales: geographic expansion, product line extension, capability acquisition (talent or technology), vertical integration, market consolidation.
2. Target assessment -- Is the target's business healthy? Review revenue trajectory, margin profile, customer concentration (>20% revenue from one customer is a risk), and competitive positioning.
3. Synergy quantification -- Revenue synergies (cross-sell, market access) are harder to achieve and typically take 3-5 years. Cost synergies (headcount overlap, procurement savings, facility consolidation) are more reliable and faster. Apply a haircut of 30-50% to management's synergy estimates because they are almost always optimistic.
4. Valuation -- Is the price fair? Use comparable transaction multiples (EV/EBITDA for most industries, EV/Revenue for high-growth or unprofitable companies). A reasonable EBITDA multiple for a stable industrial business is 7-10x; for a high-growth SaaS business, 15-25x revenue. Check whether the synergies alone justify the premium (acquisition premium of 20-40% above market price is typical).
5. Integration and risks -- Cultural fit, retention of key talent, technology integration complexity, regulatory approval timeline (antitrust review required if combined market share exceeds ~30% in key markets), and alternatives (what happens if the deal does not close?).

**Pricing Case Framework**

Three-bound approach:

- Cost floor -- Minimum viable price = fully-loaded unit cost (variable cost + allocated fixed cost + target margin). Price below this destroys value.
- Value ceiling -- Maximum capturable price = economic value to customer, which equals the value of the best alternative plus the incremental value the product delivers above that alternative. Customers will not pay above this bound.
- Competitive anchor -- Where do direct competitors price? The client's price needs to be justified relative to the competitive set. If the product is demonstrably superior, a premium of 15-25% is typically defensible. If parity, price at market. If inferior on key dimensions, a discount is required to drive trial.

Also consider: price architecture (single price, tiered bundles, per-unit vs. subscription), willingness-to-pay segmentation (enterprise vs. SMB), and price elasticity (luxury goods have low elasticity; commodity products have high elasticity).

**Growth Strategy Case Framework**

Use Ansoff's logic (but build it from first principles, do not name it):

- Existing customers, existing products: grow share of wallet, increase purchase frequency, reduce churn. Usually the lowest-cost, fastest-payback growth lever.
- New customers, existing products: expand into new geographies, channels, or customer segments. Requires sales investment and time.
- Existing customers, new products: adjacent product or service expansion. Requires product development and carries execution risk.
- New customers, new products: diversification. Highest risk; often better executed through acquisition than organic development.

---

### Step 4: Run a Practice Case

Select a practice case appropriate to the user's target firm type and case type. Structure the simulation as follows:

- Deliver the full case prompt clearly and in one block -- as an interviewer would.
- Wait for the user to ask clarifying questions. If they skip this step, gently note it: "In an actual interview, this would be a moment to ask clarifying questions. What would you ask before building your framework?"
- When the user presents their framework, evaluate it on MECE quality, number of branches, and whether prioritization was stated.
- Feed data in response to specific data requests. Do not volunteer information the user did not ask for -- that is how real interviewers operate.
- When the user performs calculations, flag arithmetic errors or rounding issues immediately.
- Track which framework branches the user explored and which they missed before the recommendation phase.
- After the recommendation, deliver a structured debrief covering: what went well, what was missing, and one specific thing to practice before the next case.

---

### Step 5: Calibrate Feedback to Interviewer Standards

Interviewers at consulting firms evaluate candidates on five dimensions. Give the user honest, specific feedback on each:

**Structure quality:** Was the framework MECE? Were branches logical, not overlapping, and complete enough to cover the problem space? Did the candidate prioritize branches intelligently?

**Analytical rigor:** Were calculations correct? Were assumptions stated and reasonable? Did the candidate catch data traps (percentage points vs. percentages, absolute vs. relative changes)?

**Business judgment:** Did the insights reflect commercial awareness -- understanding of how real businesses operate, realistic cost structures, awareness of competitive dynamics? A technically correct analysis with commercially naive conclusions still fails.

**Communication and signposting:** Was the thinking visible? Did the candidate verbalize their logic, say what they were doing before doing it, and synthesize conclusions rather than just reporting data?

**Composure and adaptability:** Did the candidate stay organized when the interviewer pushed back or redirected? Did they adapt gracefully when new data contradicted their hypothesis?

Rate each dimension explicitly: Strong / Adequate / Needs Work. Do not just say "good job." Specify: "Your framework structure was strong -- three clear MECE branches. Your calculations were accurate. However, your recommendation lacked quantification -- you said 'reduce costs' but did not say by how much or what that would recover in profit. That is the single thing to fix before your next practice case."

---

### Step 6: Build a Targeted Practice Plan

Based on the user's timeline, gaps, and target firm, construct a specific preparation schedule:

- **2-4 weeks to interview, strong foundation:** 2 cases per day (one solo timed run, one with a practice partner), rotate through all six case types, dedicate 20 minutes per session to mental math drills (market sizing calculations), and spend 30 minutes reviewing the BCG/McKinsey published interviewer guides.
- **2-4 weeks to interview, limited experience:** Begin with profitability cases exclusively for the first week (they teach the universal structure most clearly), add market entry in week 2, add sizing in week 3, and synthesize in week 4 with mixed practice.
- **1 week to interview:** Focus only on the 2-3 most common case types for the specific target firm. Do not try to master all types under time pressure. Prioritize the recommendation phase -- candidates with limited prep often have decent analysis but weak, hedging conclusions.
- **Same-day or next-day interview:** Run one timed case end-to-end, review the four-phase structure, and practice the recommendation script three times out loud. Do not try to learn new frameworks; optimize what you already know.

---

## Output Format

```
## Case Interview Preparation: [Firm Name and Round]

### Session Overview
- Target firm: [Firm name and tier]
- Interview format: [Interviewer-led / Interviewee-led / Written case]
- Case type: [Profitability / Market entry / Market sizing / M&A / Pricing / Growth strategy]
- User experience level: [Beginner / Intermediate / Experienced]
- Key focus area: [The specific gap to address in this session]

---

### Universal Case Architecture

| Phase | Timing | Key Actions | Common Mistakes |
|-------|--------|------------|-----------------|
| Clarify | 2-4 min | Restate prompt; ask 2-3 scoped questions; confirm objective | Asking too many questions; skipping this phase entirely |
| Structure | 3-5 min | Build MECE 3-4 branch framework; state starting branch and why | Using canned framework names; more than 4 branches; no prioritization |
| Analyze | 15-20 min | Work branch-by-branch; request specific data; calculate aloud; synthesize after each branch | Going silent; reporting data without drawing conclusions; skipping the profit bridge |
| Recommend | 2-3 min | State direct recommendation; 3 supporting reasons; 1 risk + mitigation; 1-2 next steps | Hedging; recommending without quantification; no risk acknowledgment |

---

### Framework: [Case Type]

**Branch 1: [Name]**
- Key questions to answer: [Specific questions]
- Data to request: [Specific metrics]
- Math to perform: [Specific calculation]
- Synthesis test: [What conclusion would look like]

**Branch 2: [Name]**
- Key questions to answer: [Specific questions]
- Data to request: [Specific metrics]
- Math to perform: [Specific calculation]
- Synthesis test: [What conclusion would look like]

**Branch 3: [Name]**
- Key questions to answer: [Specific questions]
- Data to request: [Specific metrics]
- Math to perform: [Specific calculation]
- Synthesis test: [What conclusion would look like]

**Branch 4: [Name] (if applicable)**
- Key questions to answer: [Specific questions]
- Data to request: [Specific metrics]
- Math to perform: [Specific calculation]
- Synthesis test: [What conclusion would look like]

---

### Practice Case

**Prompt:** [Full realistic case prompt, 4-6 sentences]

**Suggested Clarifying Questions:**
1. [Specific question and why it matters]
2. [Specific question and why it matters]
3. [Specific question and why it matters]

**Suggested Framework:**
- Branch 1: [Name] -- [Why this is first]
- Branch 2: [Name] -- [Why this is second]
- Branch 3: [Name] -- [Why this is third]

**Key Data Points (Interviewer Feed):**
| Data Point | Value | What It Implies |
|------------|-------|-----------------|
| [Metric] | [Number] | [Implication for analysis] |
| [Metric] | [Number] | [Implication for analysis] |
| [Metric] | [Number] | [Implication for analysis] |
| [Metric] | [Number] | [Implication for analysis] |

**Key Calculation:**
[Show full worked math: starting numbers, operations, rounding decisions, result]

**Model Recommendation Script:**
"Based on my analysis, I recommend [specific action]. Three reasons support this: first, [reason tied to analysis]; second, [reason tied to analysis]; third, [reason tied to analysis]. The key risk is [specific risk], which I would mitigate by [specific action]. To validate this recommendation, I would [specific next step]."

---

### Debrief and Evaluation

| Dimension | Rating | Specific Feedback |
|-----------|--------|-------------------|
| Structure quality | [Strong / Adequate / Needs Work] | [Specific observation] |
| Analytical rigor | [Strong / Adequate / Needs Work] | [Specific observation] |
| Business judgment | [Strong / Adequate / Needs Work] | [Specific observation] |
| Communication | [Strong / Adequate / Needs Work] | [Specific observation] |
| Composure | [Strong / Adequate / Needs Work] | [Specific observation] |

**Top Priority Before Next Practice:** [Single most important thing to improve]

---

### Common Mistakes to Avoid

1. [Specific mistake] -- [Why it fails with interviewers] -- [How to correct it]
2. [Specific mistake] -- [Why it fails with interviewers] -- [How to correct it]
3. [Specific mistake] -- [Why it fails with interviewers] -- [How to correct it]
4. [Specific mistake] -- [Why it fails with interviewers] -- [How to correct it]
5. [Specific mistake] -- [Why it fails with interviewers] -- [How to correct it]
```

---

## Rules

1. **Never present generic advice instead of a structured case simulation.** Every session must include at minimum a framework template and a practice case with real data points. Motivational coaching ("you can do this!") or abstract tips ("practice a lot") are not this skill's job.

2. **Never name a canned framework as the primary case structure.** Do not tell the user to "use Porter's Five Forces" or "apply the BCG matrix." If a named framework happens to be relevant (e.g., a value chain analysis for a cost optimization case), you may reference it as a lens within a branch of the custom framework -- not as the framework itself.

3. **Always distinguish between interviewer-led and interviewee-led formats and adjust accordingly.** In interviewee-led cases (BCG, Bain), the user must proactively move between branches, request data unprompted, and control the pacing. In McKinsey's PSI format, the interviewer drives direction and the user must respond to redirects fluidly. These require different behavioral habits.

4. **All calculations must use clean, round numbers divisible by common factors.** Case math must be doable mentally in under 60 seconds. Use revenue figures like $200M, $500M, $1B; margin figures like 20%, 25%, 30%; market sizes like 50M households. Avoid numbers like $347M or 17.3% in practice case setups.

5. **The recommendation must always include a specific quantified outcome, not just a directional action.** "Reduce food costs" is not a consulting recommendation. "Reduce food cost as a percentage of revenue from 35% to 31% through supplier renegotiation and menu rationalization, recovering approximately $20M in annual operating profit" is a consulting recommendation.

6. **Always complete a profit bridge before diagnosing causes in a profitability case.** Magnitude first, cause second. Candidates who jump to "it must be labor costs" without first quantifying the total profit gap and then verifying which cost line accounts for it look analytically undisciplined.

7. **Market sizing cases must include an explicit assumption statement before every multiplication step.** The interviewer is testing whether assumptions are reasonable and clearly stated -- not whether the final number is precisely correct. A candidate who says "I will assume 60% of US households own a car" before multiplying is demonstrating good technique; a candidate who silently multiplies 130M x 0.6 without stating the assumption is not.

8. **Debrief feedback must be specific and actionable, not generic.** "Your structure was a bit unclear" is not useful feedback. "Your second branch -- competitive dynamics -- had three sub-bullets that all asked about the same thing (market share). That is redundant, not MECE. Rewrite that branch to cover: current players and share, basis of competition, and barriers to entry" is useful feedback.

9. **Never let the user skip the clarification phase, even under time pressure.** This phase is not optional courteous procedure -- it is a signal to the interviewer that the candidate does not solve problems before understanding them. If the user wants to skip it, explain why it matters and have them practice it.

10. **Adapt difficulty to the user's stage.** A first-practice-case beginner needs a clean profitability case with a single root cause and two or three data points. An experienced candidate preparing for a final-round partner interview needs an ambiguous growth strategy or M&A case with conflicting data, no obvious single answer, and pressure to make a judgment call under uncertainty. Mismatching difficulty produces false confidence or discouragement -- both are bad outcomes.

11. **Always flag the five most common data traps explicitly.** These appear in nearly every case: (1) percentage points vs. percentage changes, (2) total market figures vs. addressable or served market, (3) revenue growth vs. profit growth moving in opposite directions (margin compression), (4) average figures masking segment-level variation, and (5) one-time items inflating or deflating a single year's results.

12. **For written case formats (Oliver Wyman, L.E.K., PE firms), adjust the output format to include a structured memo template.** Written cases require a clear recommendation in the first paragraph (the "bottom line up front" or BLUF principle), supporting analysis in 2-3 numbered sections, and an explicit limitations or risks section. The communication style is more formal than a spoken recommendation.

---

## Edge Cases

**User has never seen a case interview before and does not know the format.**
Start from zero. Explain what a case interview is in one paragraph: it is a business problem simulation where the interviewer presents a real-world scenario and evaluates how the candidate approaches and analyzes it -- not whether they arrive at the "right" answer. Then walk through the four-phase structure before presenting any practice case. Use the simplest possible profitability case (one root cause, two data points, clean math). Focus session 1 exclusively on: asking clarifying questions, structuring a framework out loud, and delivering a direct recommendation. Do not introduce market sizing or M&A until the user is comfortable with the basic profitability loop.

**User has been practicing for months but is consistently rejected after the first round.**
This is a performance optimization challenge, not a basic training problem. Likely causes include: (a) framework quality -- branches are logically sound but not MECE and interviewers notice; (b) communication -- analysis is good but the candidate does not verbalize the logic clearly; (c) recommendation weakness -- analysis is correct but the closing is hedged or unquantified; or (d) composure under pressure -- the candidate loses structure when the interviewer pushes back. Run a timed case and evaluate against all five dimensions. The failure mode is almost always in (c) or (d) for experienced candidates. Dedicate the session to the final 4 minutes of the case exclusively.

**User is preparing for a McKinsey Problem Solving Interview (PSI), not a traditional case.**
The McKinsey PSI replaced the traditional case format in most offices. It consists of a structured problem-solving scenario presented as a series of questions (typically 5-7) that build on each other, often with exhibits (charts, tables) requiring interpretation. The key differences from a traditional case: there is no free-form framework-building phase; the interviewer directs the analysis question by question; exhibit reading accuracy is critical (read the axes, units, and title carefully before drawing conclusions); and hypothesis testing is explicit ("What hypothesis would explain this pattern in the data?"). Prepare the user with exhibit interpretation exercises and practice answering structured questions with one clear answer per question rather than an open-ended analysis.

**User is preparing for a case interview at a private equity firm.**
PE case interviews are structurally different from consulting cases. They typically involve: (a) an investment memo or LBO model setup (assess whether a target company is an attractive acquisition at a given valuation), (b) a market or competitive diligence question ("Is this market structurally attractive for a platform build?"), and (c) an operational improvement question ("How would you generate value in this portfolio company post-acquisition?"). The financial literacy bar is higher -- candidates are expected to know what an LBO is, what IRR and MOIC mean (internal rate of return and multiple on invested capital), what drives enterprise value, and how leverage affects returns. Adapt the framework to include: entry valuation and implied multiple, path to value creation (revenue growth vs. margin expansion vs. multiple expansion), exit timing and valuation, and return calculation. Use clean numbers: $100M EBITDA at 10x = $1B enterprise value; with 5x leverage (50% equity), a 20% EBITDA improvement over 5 years at the same multiple = $120M EBITDA x 10x = $1.2B exit, returning approximately $700M on $500M equity = 1.4x MOIC -- too low for most PE firms, which target 2.5-3x MOIC in 5 years.

**User receives a case type they have never seen (e.g., capacity planning, regulatory change, supply chain disruption).**
Teach the first-principles framework construction technique. Step 1: identify the decision or question the client faces. Step 2: identify what categories of information would be needed to answer that question. Step 3: group those information categories into 3-4 non-overlapping branches. For a capacity planning case: "The client needs to decide whether to build a new manufacturing facility. The relevant information categories are: demand outlook (will volume justify the investment?), existing capacity utilization (is there no alternative?), investment economics (does the return justify the capital?), and execution risk (can they build it on time and budget?)" -- those four categories become the four branches. This approach works for any novel case type.

**User is an experienced hire (5-10 years of work experience) preparing for senior consulting roles.**
Experienced hire cases are deliberately more ambiguous and expect the candidate to bring their professional experience to bear. The standard framework-and-calculate approach is necessary but not sufficient -- the interviewer also wants to see whether the candidate has genuine commercial intuition. Coach the user to explicitly reference relevant professional experience during analysis: "In my experience managing a retail P&L, labor cost increases of this magnitude typically have two causes -- wage rate inflation or turnover-driven inefficiency -- and they have very different solutions." Also: experienced hire interviews often include a "vision" or "leadership" question embedded in the case, asking what the candidate would prioritize or how they would lead the client team through the recommendation. Prepare for this by thinking through the implementation layer of any recommendation, not just the analysis.

**User is preparing for a group case exercise (common at Deloitte, Oliver Wyman).**
Group cases evaluate different skills from individual cases: collaboration, structured facilitation, constructive disagreement, and the ability to synthesize divergent views into a group recommendation. Coach the user on: opening the discussion with a proposed structure for the group ("Can I suggest we spend the first 5 minutes on the framework, then 15 minutes on analysis, and reserve 5 for the recommendation?"), listening actively and building on others' contributions rather than competing, pushing back politely when a teammate's analysis is wrong ("That is an interesting point -- I wonder if it also holds if we account for the mix shift we saw earlier?"), and volunteering to synthesize at the recommendation stage. The single most common mistake in group cases is dominating the discussion -- interviewers want to see collaborative leadership, not solo performance.

---

## Example

**Input:** "I have a BCG second-round interview in two weeks. I am an MBA student. I have done maybe 10 cases total but I always feel like my recommendation is weak -- I say things like 'it depends' or 'we should explore more.' I want to practice a market entry case."

---

**Output:**

## Case Interview Preparation: BCG Second Round -- Interviewee-Led Market Entry Case

### Session Overview
- Target firm: BCG (MBB tier, interviewee-led format)
- Interview format: Interviewee-led -- you control pacing, branch transitions, and data requests
- Case type: Market entry
- User experience level: Intermediate (10+ cases, basic structure comfortable)
- Key focus area: Recommendation strength -- moving from "it depends" to a direct, quantified recommendation with supporting reasons and explicit risk acknowledgment

---

### Universal Reminder for BCG Format

In a BCG interviewee-led case, there is no interviewer walking you through. You decide when to move from Branch 1 to Branch 2, you decide what data to ask for, and you decide when you have enough to recommend. The interviewer will only redirect you if you go off the rails. This means your transitions matter: always say out loud why you are moving to the next branch ("I have enough from the market attractiveness analysis to believe this is an attractive space -- let me now check whether our client has the right capabilities to compete here before I draw a conclusion").

---

### Framework: Market Entry

**Branch 1: Market Attractiveness**
- Key questions: What is the total addressable market size? What is the growth rate? What are the industry profit margins? Are there structural barriers that protect incumbents?
- Data to request: "What is the estimated market size for [product] in the target geography?" / "What has revenue growth looked like over the past 3-5 years?" / "What are typical operating margins for players in this space?"
- Math to perform: Market revenue x operating margin = absolute profit pool available; compare to client's current business size to assess materiality
- Synthesis test: "This market is [attractive / unattractive] because [size/growth/margin argument] -- it is [large/small] enough relative to our client's current revenue to be [material / immaterial]."

**Branch 2: Competitive Dynamics**
- Key questions: Who are the top 3 players and what are their market shares? Is the market concentrated (one player >40% share) or fragmented (<20% for top player)? What is the basis of competition -- price, product quality, distribution, brand, relationships?
- Data to request: "Can you tell me who the major competitors are and their approximate market shares?" / "On what dimension do customers primarily choose between providers?"
- Math to perform: Sum of top-3 shares; if <60% combined, the market is fragmented and easier to penetrate
- Synthesis test: "The competitive structure is [concentrated / fragmented], which means entry is [difficult / feasible]. The basis of competition is [price / quality / relationships], which is [favorable / unfavorable] for our client given their capabilities."

**Branch 3: Client Capability Fit**
- Key questions: Does the client have relevant product technology or operational capability? Does the client have distribution channels or customer relationships that translate to the new market? What are the capability gaps, and how costly and time-consuming are they to close?
- Data to request: "What is our client's current product and operational capability in adjacent markets?" / "Do they have existing customer relationships that could be leveraged here?"
- Math to perform: Estimate the cost to close capability gaps (hiring, technology investment, partnership fees) as a percentage of the investment thesis
- Synthesis test: "The client's fit is [strong / moderate / weak]. The most important gap is [specific gap], which would cost approximately [estimate] to close and take [timeframe] -- this is [manageable / prohibitive]."

**Branch 4: Financial Viability and Entry Mode**
- Key questions: What investment is required for each entry mode (organic build vs. acquisition vs. partnership)? What is the expected annual profit contribution once at scale? What is the payback period?
- Data to request: "Do we have any data on what it would cost to build out the required sales force and operations?" / "Are there potential acquisition targets in this space, and at what valuations?"
- Math to perform: Payback period = upfront investment / annual incremental profit. Under 3 years is strong; 4-6 years is acceptable with strong strategic rationale; over 7 years typically fails the investment test unless the strategic positioning value is exceptional.
- Synthesis test: "The preferred entry mode is [organic / acquisition / partnership] because [reason]. At [investment] and [annual profit estimate], the payback is approximately [X] years, which is [within / outside] an acceptable range."

---

### Practice Case

**Prompt:**
"Our client is a large U.S.-based industrial equipment manufacturer with $2B in annual revenue and 18% operating margins. They currently operate exclusively in the United States. A major European competitor recently exited the German industrial equipment market after a series of operational problems unrelated to market fundamentals. The client's CEO believes this creates a window of opportunity to enter Germany. The CEO has asked us to help them evaluate whether they should enter the German market and, if so, how. They have a decision to make in 90 days."

---

**Suggested Clarifying Questions:**

1. "When you say 'industrial equipment,' can you confirm which specific product categories the client manufactures? And are German industrial customers buying similar equipment categories, or does the German market demand meaningfully different specifications?" -- *Why it matters: if German customers require certifications or product specs the client does not hold, the entry timeline changes dramatically.*

2. "The European competitor exited for operational reasons -- do we know whether the underlying market demand in Germany is healthy, or was there a demand issue the competitor was also facing?" -- *Why it matters: you need to separate a bad competitor from a bad market.*

3. "Does the client have any existing presence in Europe -- even a small sales office or distribution relationship -- or would this be a completely greenfield entry?" -- *Why it matters: existing footholds dramatically reduce the cost and complexity of market entry and should shift the entry mode analysis.*

---

**Suggested Framework Presentation (say this out loud):**
"Let me take 30 seconds to organize my approach. [Pause.] I would analyze this across four areas: first, the attractiveness of the German industrial equipment market itself -- size, growth, and margin potential; second, the competitive dynamics now that the major European player has exited; third, whether our client has the capability and product fit to compete in Germany; and fourth, the financial viability and preferred entry mode. I would like to start with market attractiveness because the prompt tells us a major competitor just exited -- before we get excited about the white space, I want to confirm the market fundamentals are sound."

---

**Key Data Points (Interviewer Feed):**

| Data Point | Value | What It Implies |
|------------|-------|-----------------|
| German industrial equipment market size | ~$4B annual revenue | Material at ~20% of client's current revenue |
| Market growth rate | 3-4% per year | Healthy, not hyper-growth -- stable industrial demand |
| Industry operating margins in Germany | 14-16% | Slightly lower than client's 18%, likely due to higher labor costs |
| Exited competitor's former market share | ~25% | Leaves significant addressable white space -- market now more fragmented |
| Client's product specification gap | Needs EU CE certification + German-language technical documentation | 12-18 month process; ~$15M one-time investment |
| Estimated cost to establish German sales/operations | $40M upfront (hiring, warehouse, sales team) | Total initial investment ~$55M including certification |
| Expected annual profit at scale (Year 3+) | ~$80M revenue x 15% margin = ~$12M operating profit | Payback period ~$55M / $12M = ~4.6 years |
| Small German distributor available for partnership | 8% market share, strong customer relationships | Partnership could accelerate market access by 1-2 years |

---

**Key Calculation (say every step out loud):**

"I want to size the financial opportunity. The German market is $4B. If we target the 25% share the exiting competitor held, that is $1B in addressable revenue. Realistically, we probably capture 20-30% of that over 3-5 years, call it $200-300M at scale. At 15% operating margin -- slightly below our current 18% due to higher labor costs in Germany -- that is $30-45M in annual operating profit at maturity. The upfront investment is roughly $55M: $15M for certification and $40M for sales and operational setup. Payback on $55M at $12M in Year 3 profit is 4-5 years -- that is the conservative case, before we reach full scale. If we use the $30M mature profit figure, payback improves to under 2 years. The math supports entry."

---

**Model Recommendation Script (practice saying this three times):**

"Based on my analysis, I recommend that our client enter the German market through a partnership with the local distributor in the near term, with a plan to build owned operations over 3-5 years. Three reasons: first, the German industrial equipment market is $4B with 3-4% annual growth and 14-16% operating margins -- it is structurally attractive and materially sized relative to the client's current business. Second, the exit of the major European competitor has left 25% of the market without a dominant supplier, which creates a genuine first-mover window for a well-capitalized entrant -- but that window is likely 12-18 months before other players move in. Third, the financial case is solid -- even in the conservative scenario, the investment pays back in under 5 years, and at scale, Germany could contribute $30-40M in annual operating profit. The key risk is that CE certification takes 12-18 months, which constrains how fast the client can actually ship product. I would mitigate this by partnering with the local distributor immediately -- they can carry the client's products under a white-label or distribution agreement while certification is in process, establishing customer relationships before the client has full operational capability. To validate this recommendation, I would spend the next 30 days conducting 10-15 customer interviews with German industrial buyers to confirm willingness to switch from their current supplier and assess whether the client's product specifications need meaningful adaptation."

---

### Debrief and Evaluation

| Dimension | Rating | Specific Feedback |
|-----------|--------|-------------------|
| Structure quality | Strong | Four MECE branches that are non-overlapping and collectively cover the decision. Prioritization rationale (start with market attractiveness because we need to check if the competitor exit reflects a bad market) was sound. |
| Analytical rigor | Strong | Profit bridge was complete: market size to addressable share to margin to absolute profit to payback period. Certification gap was identified and incorporated into the investment estimate rather than noted and ignored. |
| Business judgment | Adequate | The partnership-first entry mode is commercially savvy. However, the candidate should also address the risk that the distributor represents -- if they are approached by a larger competitor in the 12-18 month window, the client loses their market access vehicle. Proactively naming that risk would demonstrate sharper commercial thinking. |
| Communication | Needs Work | The candidate needs to practice the recommendation script until it is smooth, direct, and delivered without hedging qualifiers. Record yourself saying it -- any sentence beginning with "I think maybe" or "it probably makes sense to" should be rewritten as a declarative statement. |
| Composure | Not tested -- run a second case where the interviewer pushes back on the partnership recommendation to practice defending a position under pressure. |

**Top Priority Before Next Practice:** Practice the recommendation script out loud three times before your next case. The analysis here was solid -- the gap is entirely in the delivery. A BCG partner wants to feel, in 90 seconds, that they could trust you to say this recommendation to a CEO. Confidence in your closing is what makes that happen.

---

### Common Mistakes to Avoid

1. **"It depends" as a recommendation** -- This phrase is acceptable in the analysis phase ("the preferred entry mode depends on the payback period, which I want to calculate next") but never in the recommendation phase. By the time you reach the closing, you have the data. Make a call. Interviewers explicitly evaluate whether you have the judgment and confidence to take a position.

2. **Framework branches that overlap** -- "Revenue analysis" and "pricing analysis" are not MECE -- pricing is a subset of revenue. The interviewer notices this. Before presenting your framework, ask yourself: "Could the same piece of information belong to two of my branches?" If yes, consolidate or redefine the branches.

3. **Performing calculations silently** -- This is the single most common mistake across all experience levels. The interviewer cannot evaluate your reasoning if they cannot hear it. Even if you are uncertain: "Let me think through this -- revenue is $500M, the margin declined 4 percentage points, so the absolute profit impact is 500M x 0.04 = $20M. I want to check whether that matches the total profit decline we were given." Uncertainty verbalized is dramatically better than silence.

4. **Missing segment-level variation** -- Many cases are designed so that the average figure is misleading. If the client has revenue from five regions and total revenue is flat, always ask whether any individual regions are growing or declining. A case where the Northeast is up 15% and the Southeast is down 20% tells a very different story than a flat average. Ask: "Is this figure consistent across geographies / customer segments / product lines, or is the average masking variation?"

5. **Recommending without quantifying the upside** -- "We should enter Germany because the market is attractive and the competition is weak" is not a consulting recommendation. "We should enter Germany -- the $4B market with 3-4% annual growth and a 25% share gap supports a $12-40M annual profit opportunity on a $55M investment, with payback in 2-5 years depending on ramp pace" is a consulting recommendation. Quantification is what separates a structured opinion from a strategic recommendation.
