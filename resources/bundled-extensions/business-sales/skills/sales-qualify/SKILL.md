---
slash_command: false
name: sales-qualify
description: "Qualify a sales lead using BANT (Budget/Authority/Need/Timeline) and MEDDIC (Metrics/Economic Buyer/Decision Criteria/Decision Process/Identify Pain/Champion) frameworks against publicly available signals using OSINT only - no scraping of platforms whose ToS forbid it (LinkedIn §8.2, Glassdoor, G2, Capterra, Crunchbase free-tier). Produces an Opportunity Quality Score (0-100) and a Lead Grade (A/B/C/D) with recommended sales approach. Templates and analytical tools only - not legal, marketing-compliance, or data-protection advice. Trigger phrases: 'qualify this lead', 'BANT qualify <url>', 'MEDDIC analysis', 'is this a real opportunity', '/sales qualify <url>', '/sales-qualify <url>'. Also runs as the Opportunity dimension subagent under /sales prospect."
version: 1.1.0
as_of: 2026-05-03
author: Wayland Business Pack (port of zubair-trabzada/ai-sales-team-claude)
license: MIT
metadata:
  wayland:
    tags: [sales, qualification, BANT, MEDDIC, opportunity-scoring, business, smb, osint]
    related_skills: [sales-prospect, sales-research, sales-icp]
prerequisites:
  python_packages: []
attribution:
  lineage: "Wayland Business Suite (Original)"
---

> **Templates and analytical tools only - not legal, marketing-compliance, or data-protection advice.** Lead qualification draws on public sources only - never scrape LinkedIn (ToS §8.2), Glassdoor, G2, Capterra, or Crunchbase free-tier. Personal data captured during qualification (named individuals, role, employer) is regulated under GDPR Art. 6 (EU/UK), CCPA/CPRA (CA), and equivalent regimes - surface notice obligations downstream. Champion/economic-buyer identification must be evidence-based; never fabricate names or relationships.

# Sales Qualify - Lead Qualification Engine (BANT + MEDDIC)

Evaluate a prospect against two proven sales qualification frameworks - **BANT** and **MEDDIC** - using only publicly available information. Produces an Opportunity Quality Score (0-100) and a Lead Grade (A/B/C/D) with a recommended sales approach. Runs standalone via `/sales-qualify <url>` or as the Opportunity dimension subagent during `/sales prospect`.

## When to Use

Trigger phrases: "qualify this lead", "BANT score <url>", "MEDDIC analysis on <company>", "is this a real opportunity", "should we pursue <company>", `/sales qualify <url>` (verb form), `/sales-qualify <url>` (flat form).

Do NOT use for: deep company background research (`sales-research`), decision-maker contact discovery (`sales-contacts`), competitive landscape analysis (`sales-competitors`), or building an ideal customer profile (`sales-icp`).

## Invocation Modes

This skill is **dual-mode**.

**Standalone mode** (`/sales-qualify <url>`)
- User passes a company URL.
- Skill fetches the public surface, runs full Phase 1-4 BANT + MEDDIC analysis, and writes a Markdown report.
- Default output path: `build_report_path("business-sales", instruction)` - typically `.wayland/business-sales/<timestamp>-<slug>.md`.
- Caller may override with an explicit `out_path` argument.

**Subagent mode** (invoked by `sales-prospect` via `delegate_task(tasks=[...])`)
- Parent orchestrator pre-fetches all pages and passes them in `context.pages`.
- Child receives a fully self-contained `context` payload (see *Subagent contract* below) - no parent context leaks otherwise.
- Child does NOT re-fetch; it analyzes the structured page data passed in.
- Child returns a JSON object matching `output_schema` AND writes a per-dimension Markdown file to the assigned `out_path`.
- Toolset for the child is `[terminal, file, web]` - `execute_code` is blocked for delegated subagents, so any helper-script work must already be done by the parent.

## Inputs

Standalone mode accepts:
- `url` (required) - company website URL
- `pages` (optional) - pre-fetched page data `{role: text}` to avoid redundant fetches
- `icp_context` (optional) - contents of an existing `IDEAL-CUSTOMER-PROFILE.md` for pain-point and budget calibration
- `out_path` (optional) - caller-controlled output path; falls back to `build_report_path("business-sales", instruction)`

Subagent mode receives in `context`:
- `company_url`, `company_name`
- `pages` - pre-fetched structured data, e.g. `{homepage, pricing, careers, about, blog, case_studies}`
- `external_signals` - pre-fetched data from LinkedIn / Crunchbase / news / G2 (parent runs `web_search` once and embeds results)
- `icp_context` - ICP pain-point map, if available
- `scoring_rubric` - the rubric below, embedded so child has it without reading parent prompt
- `output_schema` - exact JSON shape the child must return
- `out_path` - deterministic absolute path the child writes its dimension report to

---

## Phase 1: Data Collection

### 1.1 Primary Data Sources

Gather qualification signals from these sources. In standalone mode use `web_extract` for site pages (≤5 URLs per call) and `web_search` for external data (≤5 results per call). For raw text on long pages, use `terminal` + `curl --max-filesize 200000` instead of `web_extract`. In subagent mode, read everything from `context.pages` and `context.external_signals` - do NOT re-fetch.

| Source | What to Extract | Qualification Relevance |
|--------|----------------|------------------------|
| **Pricing page** | Price points, tiers, enterprise tier, "Contact Sales" | Budget signals, deal size potential |
| **Careers page** | Open roles, department sizes, growth rate | Budget (hiring = spending), Need (roles reveal pain), Timeline (urgency of hiring) |
| **Job postings** | Required tools, skills, responsibilities | Tech stack, pain points, current solutions, budget for tools |
| **Blog / Resources** | Pain point topics, challenges discussed, industry trends | Need validation, problem awareness |
| **Case studies** | Problems solved, vendors used, results achieved | Need patterns, buying behavior, vendor preferences |
| **About page** | Company size, stage, mission, leadership | Authority mapping, budget signals |
| **Review sites (G2, Capterra)** - *manual human lookup only; do not scrape (ToS forbid)* | Reviews of their product, reviews they leave for other tools | Current tool satisfaction, switching signals |
| **Glassdoor** - *manual human lookup only; do not scrape (ToS forbid)* | Employee reviews mentioning tools, processes, problems | Internal pain points, culture around change |
| **LinkedIn** - *Marketing Developer Platform / Sales Navigator API only; ToS §8.2 forbids automated scraping* | Employee count growth, recent hires, leadership posts | Timeline signals, authority mapping, growth trajectory |
| **News / Press** | Funding, partnerships, expansions, challenges | Budget signals, timeline triggers, need amplifiers |
| **Social media** | Company posts, executive posts, engagement | Problem awareness, vendor sentiment, trigger events |
| **Competitor mentions** | References to competing solutions on their site or job posts | Current solutions, competitive landscape |

### 1.2 Signal Extraction Methodology

For each data source:

1. **Fetch the source** (parent only) or **read from `context`** (subagent).
2. **Scan for keywords** related to each BANT and MEDDIC dimension.
3. **Classify each signal** as Strong, Moderate, Weak, or Absent.
4. **Record the evidence** - exact quote or paraphrase with source URL.
5. **Assign confidence level** (High, Medium, Low, Inferred).

**Confidence level definitions:**

| Confidence | Definition | Example |
|-----------|-----------|---------|
| **High** | Directly stated or clearly observable fact | Pricing page shows $499/mo enterprise tier |
| **Medium** | Reasonable inference from available data | 5 open engineering roles suggests growing tech team |
| **Low** | Indirect signal requiring interpretation | Blog post about "scaling challenges" suggests growing pains |
| **Inferred** | Educated guess based on company profile | Series B company likely has $500K+ annual software budget |

---

## Phase 2: BANT Framework Assessment

### Budget (0-25 points)

**What we are assessing:** Does this prospect have the financial capacity and willingness to purchase our solution?

**Signal detection:**

| Signal | Points | Confidence | Where to Find |
|--------|--------|-----------|---------------|
| Explicit budget mentioned (rare for public data) | 20-25 | High | RFPs, procurement portals |
| Recent funding round (Series A: +12, B: +16, C+: +20) | 12-20 | High | Crunchbase, press releases |
| Enterprise pricing tier on their own product | 10-15 | Medium | Their pricing page |
| Multiple paid SaaS tools visible in tech stack | 8-12 | Medium | Job posts, integration pages |
| Hiring for roles that use your product category | 10-15 | Medium | Job postings |
| Employee count suggests adequate budget (50+ employees) | 5-10 | Low | LinkedIn, About page |
| Cost-conscious signals (all free tools, tiny team) | 0-3 | Medium | Tech stack, team size |
| Recent layoffs or cost-cutting news | 0-5 | High | News, LinkedIn |

**Budget scoring rubric:**

| Score | Interpretation |
|-------|---------------|
| 20-25 | Strong budget signals. Recent funding or clear enterprise spend. High confidence. |
| 15-19 | Good budget indicators. Company size and tech spend suggest capacity. |
| 10-14 | Moderate signals. Budget likely exists but unconfirmed. |
| 5-9 | Weak signals. Budget is uncertain. May require creative pricing. |
| 0-4 | Poor budget signals. Early stage, cost-conscious, or financial distress. |

### Authority (0-25 points)

**What we are assessing:** Can we identify who makes the buying decision, and can we access them?

**Signal detection:**

| Signal | Points | Confidence | Where to Find |
|--------|--------|-----------|---------------|
| Economic buyer identified by name and title | 20-25 | High | Team page, LinkedIn |
| Org structure visible (clear hierarchy) | 10-15 | Medium | Team page, LinkedIn, org chart |
| Decision-making titles found (VP+, C-suite, Director) | 8-12 | Medium | Team page, LinkedIn |
| Buying committee roles identifiable | 12-18 | Medium | Org structure, LinkedIn |
| Procurement process visible (vendor portal, RFP process) | 5-10 | Medium | Website, job postings |
| Flat org / owner-operator (easy authority mapping) | 15-20 | High | Small team, founder-led |
| Complex enterprise structure (hard to navigate) | 3-8 | Low | Large company, many layers |
| No leadership info publicly available | 0-5 | Low | Insufficient data |

**Authority scoring rubric:**

| Score | Interpretation |
|-------|---------------|
| 20-25 | Clear buying authority identified. Direct path to decision maker. |
| 15-19 | Key stakeholders identified. Likely buying process understood. |
| 10-14 | Some authority figures found. Buying process partially mapped. |
| 5-9 | Limited authority visibility. Need discovery call to map. |
| 0-4 | Cannot identify decision makers from public data. |

### Need (0-25 points)

**What we are assessing:** Does this prospect have a problem that our solution solves, and are they aware of it?

**Signal detection:**

| Signal | Points | Confidence | Where to Find |
|--------|--------|-----------|---------------|
| Explicit pain point mentioned (blog, interview, social) | 20-25 | High | Blog, news, social media |
| Job posting for role that solves the problem your tool solves | 15-20 | High | Job postings |
| Negative reviews of their current solution | 12-18 | Medium | G2, Capterra, social media |
| Blog content about challenges you solve | 10-15 | Medium | Company blog |
| Competitor product mentioned in job posts | 10-15 | Medium | Job postings |
| Industry-wide pain point applicable to their segment | 5-10 | Low | Industry reports, news |
| Feature requests on their own product suggest internal needs | 8-12 | Low | Community forums, social |
| No visible pain signals | 0-5 | Low | Insufficient data |

**Need scoring rubric:**

| Score | Interpretation |
|-------|---------------|
| 20-25 | Clear, validated pain point. Prospect is actively seeking solutions. |
| 15-19 | Strong need indicators. Problem is real even if not explicitly stated. |
| 10-14 | Moderate need signals. Likely experiencing the problem. |
| 5-9 | Weak need signals. Problem may exist but is not a priority. |
| 0-4 | No visible need. Solution may be premature for this prospect. |

### Timeline (0-25 points)

**What we are assessing:** Is there urgency to buy? What is the likely timeframe for a decision?

**Signal detection:**

| Signal | Points | Confidence | Where to Find |
|--------|--------|-----------|---------------|
| RFP or vendor evaluation in progress | 22-25 | High | Procurement portals, news |
| Active hiring for role that would use your product | 15-20 | High | Job postings |
| Recent trigger event (funding, leadership change, expansion) | 12-18 | Medium | News, press releases |
| Budget cycle alignment (fiscal year start, Q4 budget) | 8-12 | Low | Industry norms, fiscal calendar |
| Contract renewal cycle (annual contracts up for renewal) | 8-12 | Low | Inferred from industry |
| Seasonal buying patterns for their industry | 5-10 | Low | Industry knowledge |
| Competitor dissatisfaction signals (recent negative reviews) | 8-12 | Medium | G2, social media |
| Rapid growth creating urgency | 10-15 | Medium | Hiring pace, funding, news |
| No urgency signals detected | 0-5 | Low | Insufficient data |

**Timeline scoring rubric:**

| Score | Interpretation |
|-------|---------------|
| 20-25 | Active buying process or immediate trigger event. Decision within weeks. |
| 15-19 | Strong urgency signals. Likely to act within 1-3 months. |
| 10-14 | Moderate urgency. Timeframe is 3-6 months. |
| 5-9 | Low urgency. Timeframe is 6-12 months or undefined. |
| 0-4 | No urgency detected. Long-term nurture candidate. |

### BANT Score Calculation

```
BANT Score = Budget + Authority + Need + Timeline
Range: 0-100
```

---

## Phase 3: MEDDIC Framework Assessment

### Metrics

**What we are assessing:** What business metrics does this prospect care about? What would success look like to them?

**Research approach:**
1. Check their homepage for metric claims ("We help companies achieve X")
2. Read case studies for the metrics they highlight
3. Check executive LinkedIn posts for KPIs they discuss
4. Review job postings for OKR/KPI mentions
5. Analyze their product to infer which metrics their customers care about

**Output format:**
- Primary metrics they likely care about (3-5)
- How your solution impacts those metrics
- Evidence and confidence level for each

### Economic Buyer

**What we are assessing:** Who holds the purse strings? Who gives final approval?

**Research approach:**
1. Check team/leadership page for C-suite and VP titles
2. Search LinkedIn for the company + titles like "VP of [relevant department]", "Head of [relevant area]"
3. For SMBs: founder/CEO is almost always the economic buyer
4. For mid-market: VP or Director level in the relevant department
5. For enterprise: May need multiple approvals (VP + Procurement + Legal)

**Output format:**
- Name and title of likely economic buyer
- Evidence for why this person is the economic buyer
- Alternative economic buyers if uncertain
- Confidence level

### Decision Criteria

**What we are assessing:** What factors will they use to evaluate solutions?

**Research approach:**
1. Check if they have published evaluation criteria (RFPs, vendor requirements)
2. Analyze their job postings for tool requirements and evaluation criteria
3. Look at their current tech stack for patterns (best-of-breed vs suite, cloud-first vs hybrid)
4. Read reviews they have left for other tools (what do they value?)
5. Check their industry for common evaluation criteria

**Output format:**
- Likely evaluation criteria ranked by importance
- Evidence for each criterion
- How your solution performs against each criterion

### Decision Process

**What we are assessing:** How does this company buy software/services?

**Research approach:**
1. Company size: Smaller = faster, simpler process. Larger = committees, procurement
2. Check for procurement portals, vendor registration pages
3. Look for compliance requirements (SOC2, GDPR, HIPAA mentions)
4. Check if they have a dedicated procurement or vendor management team
5. Analyze their existing tech stack for buying pattern (many tools = decentralized, few = centralized)

**Output format:**
- Estimated buying process (self-serve, single decision maker, committee, formal procurement)
- Estimated timeline for the process
- Key stakeholders likely involved
- Potential gates or blockers in the process

### Identify Pain

**What we are assessing:** What specific pain points does this prospect experience that we can solve?

**Research approach:**
1. Read job postings for pain-related language ("we need to fix", "improve our", "build out")
2. Check Glassdoor reviews for internal frustrations
3. Read their blog for problem-focused content
4. Search social media for complaints or challenges they post about
5. Look at their product reviews for internal process issues
6. Check industry forums for common pain points in their segment

**Output format for each pain point:**
- Pain point description
- Evidence (with source)
- Severity estimate (Critical / High / Medium / Low)
- Your solution's relevance to this pain
- Confidence level

### Champion

**What we are assessing:** Who could be our internal advocate? Who would push for our solution inside the company?

**Research approach:**
1. Look for mid-level managers in the department that would use your product
2. Find people who have used your product (or competitors) at previous companies
3. Identify people who post about problems your product solves
4. Look for people who recently joined in roles related to your solution area
5. Find people who engage with your company's content or competitors' content

**Output format:**
- Potential champion(s) with name, title, and reasoning
- Connection points (shared connections, communities, interests)
- Approach strategy for each potential champion
- Confidence level

### MEDDIC Completeness Score

Calculate the percentage of MEDDIC elements with at least medium confidence:

```
MEDDIC Completeness = (Elements with Medium+ Confidence / 6) * 100
```

| Completeness | Interpretation |
|-------------|---------------|
| 80-100% | Excellent qualification data. Well-positioned for engagement. |
| 60-79% | Good data. Some gaps to fill during discovery calls. |
| 40-59% | Moderate data. Need discovery call to fill gaps before advancing. |
| 20-39% | Limited data. Early stage research. More intelligence needed. |
| 0-19% | Insufficient data. May need different research approach or sources. |

---

## Phase 4: Synthesis and Scoring

### 4.1 Opportunity Quality Score (0-100)

```
Opportunity Quality Score = (
    BANT_Score * 0.50 +
    MEDDIC_Completeness * 0.30 +
    Urgency_Modifier * 0.20
)
```

**Urgency Modifier (0-100):**
- 80-100: Active buying process or major trigger event in last 30 days
- 60-79: Recent trigger event (last 90 days) or strong urgency signals
- 40-59: Moderate urgency (industry trends, gradual pain escalation)
- 20-39: Low urgency (nice-to-have, future planning)
- 0-19: No urgency detected

### 4.2 Lead Grade Assignment

| Grade | Score Range | Label | Recommended Action |
|-------|-----------|-------|-------------------|
| **A** | 75-100 | Sales Qualified Lead | Assign to senior rep. Initiate personalized outreach immediately. Multi-thread to buying committee. Prepare custom proposal. |
| **B** | 50-74 | Marketing Qualified Lead | Begin standard outreach sequence. Schedule discovery call. Gather more MEDDIC data. Nurture with relevant content. |
| **C** | 25-49 | Information Qualified Lead | Add to long-term nurture. Share thought leadership content. Monitor for trigger events. Re-qualify in 60-90 days. |
| **D** | 0-24 | Unqualified | Do not pursue actively. Add to awareness campaigns only. Re-evaluate if major changes occur (funding, leadership, growth). |

### 4.3 Buying Signals & Red Flags

Compile both into structured tables: each signal/flag with its **Source**, **Strength/Severity**, and **Relevance/Mitigation**. The Buying Signals table feeds the rep's outreach hooks; the Red Flags table feeds disqualification or objection-handling prep.

### 4.4 Recommended Approach

- **Grade A:** Direct executive outreach. Lead with specific ROI calculation. Reference specific pain points and trigger events. Prepare for a 2-4 week deal cycle.
- **Grade B:** Educational outreach. Lead with industry insights and best practices. Build relationship before pitching. Prepare for a 1-3 month deal cycle.
- **Grade C:** Content nurture. Share relevant resources without selling. Set trigger-based re-engagement alerts. Prepare for a 3-6 month warming period.
- **Grade D:** Marketing awareness only. Add to newsletter/blog distribution. Monitor for qualification changes. Do not invest individual sales rep time.

---

## Output

### Standalone mode - Markdown report

Write the report via `file_tools.write` to the resolved `out_path`:

```markdown
# Lead Qualification: <Company Name>
**URL:** <url>
**Date:** <YYYY-MM-DD>
**Opportunity Quality Score: X/100**
**Lead Grade: A/B/C/D - <Label>**
**BANT Score: X/100 | MEDDIC Completeness: X%**

## Qualification Snapshot
| Metric | Value |
|--------|-------|
| Company | ... |
| Industry | ... |
| Employees | ... |
| BANT Score | X/100 |
| MEDDIC Completeness | X% |
| Opportunity Quality Score | X/100 |
| Lead Grade | letter - label |
| Urgency Level | High/Medium/Low/None |
| Recommended Action | one-line recommendation |

## BANT Scorecard
| Dimension | Score | Key Evidence | Confidence |
|-----------|-------|-------------|------------|
| Budget | X/25 | ... | High/Medium/Low/Inferred |
| Authority | X/25 | ... | ... |
| Need | X/25 | ... | ... |
| Timeline | X/25 | ... | ... |
| TOTAL | X/100 | | |

### Budget Analysis
<Funding history, tech spend indicators, pricing signals, budget proxies.>

### Authority Analysis
<Identified decision makers with titles. Org structure. Buying process.>

### Need Analysis
<Specific pain points with evidence. Problem awareness level. Current solution satisfaction.>

### Timeline Analysis
<Trigger events, urgency signals, buying cycle estimation, seasonal factors.>

## MEDDIC Assessment
| Element | Finding | Evidence | Confidence |
|---------|---------|----------|------------|
| Metrics | ... | ... | ... |
| Economic Buyer | name, title | ... | ... |
| Decision Criteria | ... | ... | ... |
| Decision Process | ... | ... | ... |
| Identify Pain | ... | ... | ... |
| Champion | ... | ... | ... |

### Metrics Deep Dive / Economic Buyer Profile / Decision Criteria / Decision Process Map / Pain Point Analysis / Champion Strategy
<Per-element narratives.>

## Buying Signals Detected
1. **Signal** - Evidence (Source, Strength)
...

## Red Flags
1. **Flag** - Evidence (Source, Severity). *Mitigation:* ...
...

## Opportunity Quality Score: X/100
| Component | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| BANT Score | X/100 | 50% | X |
| MEDDIC Completeness | X/100 | 30% | X |
| Urgency Modifier | X/100 | 20% | X |
| TOTAL | | 100% | X/100 |

## Recommended Approach
<2-3 paragraphs: messaging angles, stakeholders, timeline, deal-size estimate.>

## Next Steps
1. ...
2. ...
```

Also emit a condensed terminal summary:

```
=== LEAD QUALIFICATION COMPLETE ===
Company:  <name>
Industry: <vertical>

BANT Score: X/100
  Budget:    XX/25
  Authority: XX/25
  Need:      XX/25
  Timeline:  XX/25

MEDDIC Completeness: X%
  Metrics / Economic Buyer / Decision Criteria / Decision Process / Identify Pain / Champion: Found/Partial/Missing

Opportunity Quality Score: X/100
Lead Grade: letter - label

Top Buying Signals: 1. ... 2. ... 3. ...
Red Flags: 1. ... 2. ...

Recommended Action: <one-line>
Full report saved to: <out_path>
```

### Subagent mode - JSON return + Markdown file

Return JSON matching `context.output_schema` (typical shape):

```json
{
  "dimension": "qualify",
  "dimension_score": 72,
  "subscores": {
    "budget":    {"score": 72, "rationale": "<one-line>"},
    "authority": {"score": 80, "rationale": "<one-line>"},
    "need":      {"score": 88, "rationale": "<one-line>"},
    "timeline":  {"score": 72, "rationale": "<one-line>"}
  },
  "key_findings": ["<one-line>", "..."],
  "bant_score": 78,
  "meddic_completeness": 67,
  "urgency_modifier": 60,
  "lead_grade": "B",
  "meddic_confidence": {
    "metrics": "Medium",
    "economic_buyer": "High",
    "decision_criteria": "Low",
    "decision_process": "Medium",
    "identify_pain": "High",
    "champion": "Low"
  },
  "buying_signals": [
    {"signal": "...", "source": "...", "strength": "Strong"}
  ],
  "red_flags": [
    {"flag": "...", "source": "...", "severity": "Medium", "mitigation": "..."}
  ],
  "pain_points": [
    {"pain": "...", "severity": "High", "source": "...", "solution_relevance": "Direct", "confidence": "Medium"}
  ],
  "economic_buyer": {"name": "...", "title": "...", "confidence": "Medium"},
  "champion_candidates": [
    {"name": "...", "title": "...", "reason": "...", "confidence": "Medium"}
  ],
  "recommendations": [
    {"tier": "immediate|short_term|long_term", "title": "...", "impact": "high|medium|low", "effort": "low|medium|high"}
  ],
  "recommended_action": "...",
  "report_path": "<absolute out_path>"
}
```

**Scale conversion.** The BANT rubric grades each of the 4 sub-dimensions on a 0-25 band (sum = 0-100). For the canonical JSON above:
- `subscores.<bucket>.score = rubric_value * 4` to land on the 0-100 scale.
- Top-level `dimension_score` is the Opportunity Quality Score: `round(BANT_Score * 0.50 + MEDDIC_Completeness * 0.30 + Urgency_Modifier * 0.20)` - already a 0-100 integer.

`bant_score`, `meddic_completeness`, `urgency_modifier`, and `lead_grade` remain as auxiliary fields. The aggregator (`sales-prospect` Phase 3) reads the canonical `dimension_score` directly.

Also write the same content as Markdown to `context.out_path` so the parent can aggregate by reading files. The Markdown follows the standalone report skeleton above (BANT scorecard, MEDDIC table, signals, red flags, recommended approach).

The Opportunity Quality dimension is weighted **20%** in the `sales-prospect` aggregate.

## Notes

- **Never invent pain points.** Only report pain points you have evidence for. "They probably struggle with X" is not evidence. "Their job posting mentions needing to fix X" IS evidence.
- **Be honest about unknowns.** Much BANT information is only available through direct conversation. Score what you CAN assess and clearly flag what requires further qualification.
- **Distinguish signal from noise.** One employee complaining on Glassdoor is noise. A pattern of complaints about the same issue is a signal.
- **Trigger events must be recent.** A funding round from 3 years ago is not a trigger event. Within the last 12 months is the threshold.
- **Budget estimation should be conservative.** Better to underestimate than overestimate.
- **Timeline is the hardest to assess externally.** Be transparent. Note timeline as the first thing to validate in conversation.
- **Champion potential is speculative.** Rarely score above 7 without direct evidence.
- **Score the opportunity, not the company.** A great company with no current need scores low. A mediocre company with urgent, well-funded need scores higher.
- In subagent mode the child cannot call `execute_code` and cannot re-fetch - work only from `context.pages` and `context.external_signals`. If a source is missing, mark the corresponding finding as "not analyzable - source not provided".
- Always produce a qualification report with whatever data is available. Even incomplete data is valuable for prioritization. If BANT score is below 25 and confidence is Low/Inferred across all dimensions, recommend manual research before any outreach.
- If sibling reports (`COMPANY-RESEARCH.md`, `DECISION-MAKERS.md`, `COMPETITIVE-INTEL.md`, `IDEAL-CUSTOMER-PROFILE.md`) exist in the run directory, read them via `file_tools.read` to pre-populate company data, authority/champion analysis, current-solution context, and ICP pain alignment.
- Suggested follow-ups after a standalone run: `/sales-contacts` for decision-maker deep dive, `/sales-research` for richer company background, `/sales-icp` to refine targeting.

## Limitations

- `web_search` is hard-capped to 5 results per call; chain multiple targeted searches rather than one broad query.
- `web_extract` is hard-capped to 5 URLs and auto-summarizes pages > 5000 chars. For raw long-page text (e.g. a careers page with 40 listings), use `terminal` + `curl --max-filesize 200000` instead.
- Public-only data - no logged-in scraping, no purchased datasets. The skill intentionally produces a pre-conversation qualification, not a post-call one.
- **OSINT only.** Refuse to ingest scraped LinkedIn / Glassdoor / G2 / Capterra / Crunchbase free-tier data. Use official APIs or manual human lookup.

## Output footer (REQUIRED on every qualification report)

End every generated qualification report with this block, verbatim:

```
---
**LEAD QUALIFICATION - NOT LEGAL, MARKETING-COMPLIANCE, OR DATA-PROTECTION ADVICE**

Before acting on this qualification, the user must:

1. Confirm contact and signal data was sourced via OSINT or official platform APIs only - not scraped from LinkedIn (§8.2), Glassdoor, G2, Capterra, or Crunchbase free-tier.
2. Treat champion / economic-buyer identifications as evidence-based hypotheses; never name a person as a relationship contact without confirmed evidence.
3. Personal data of identified individuals (EU/UK / California persons) triggers GDPR / CCPA processing obligations downstream - confirm a lawful basis under GDPR Art. 6 and satisfy Art. 14 indirect-collection notice within one month if data came via broker.
4. Outreach derived from this qualification inherits sales-outreach Phase 0 jurisdiction gate - refuse cold to DE/AT/CH, refuse without sender postal address for US (CAN-SPAM §5(a)(5)), refuse Framework 4 / mutual-connection without documented referrer permission.

Generated by Wayland business-sales plugin. No warranty, express or implied. Wayland and the plugin authors disclaim all liability for use of this report.
```

---

> _**Templates and analytical tools only - not legal, marketing-compliance, or data-protection advice.** OSINT only; respect platform ToS; satisfy GDPR / CCPA on downstream processing._
