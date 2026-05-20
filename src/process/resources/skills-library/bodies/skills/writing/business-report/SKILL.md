---
name: business-report
description: |
  Writes formal business reports with structured sections, data integration,
  analysis, findings, and actionable recommendations. Use when the user needs a
  business report, performance report, analysis report, or formal findings
  document. Do NOT use for executive summaries (use `executive-summary`), status
  updates (use `status-update`), or stakeholder updates (use `stakeholder-update`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "report writing business-writing"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Business Report Writing

## When to Use

Use this skill when the user needs a complete, formal business report -- a structured analytical document that presents data, interprets findings, and delivers actionable recommendations to support a specific organizational decision.

**Trigger scenarios:**
- User requests a performance report covering a defined period (monthly, quarterly, annual) for a function, team, product, or business unit
- User needs a market analysis, competitive landscape report, or feasibility study to inform a go/no-go decision
- User requires an operational review documenting process efficiency, cost structure, or resource utilization with proposed improvements
- User asks for a formal findings report following an audit, investigation, survey, or research engagement
- User needs a financial analysis report connecting revenue, cost, and margin data to strategic or operational decisions
- User is preparing a due diligence report, vendor assessment, or procurement evaluation with scoring criteria and recommendations
- User needs a post-mortem or incident analysis report with root cause findings and corrective action plans
- User requires an investment case or business case report with financial modeling, risk assessment, and recommendation tiers

**Do NOT use when:**
- The user wants only a 1-2 page executive summary (use `executive-summary` instead) -- business reports always contain full body content with data and analysis
- The user wants a weekly or biweekly status update with RAG indicators (use `status-update` instead) -- status updates are progress snapshots, not analytical documents
- The user needs a narrative for a board presentation or investor deck (use `board-update-narrative` instead) -- board narratives follow slide logic, not report logic
- The user wants a stakeholder communication email or update memo (use `stakeholder-update` instead)
- The user needs a one-page briefing note or policy brief (these are distinct formats requiring their own structure)
- The document is purely descriptive with no data or analysis (use `informational-memo` instead)
- The user needs only a data visualization or dashboard narrative without formal report structure

---

## Process

### Step 1: Establish Report Parameters Before Writing

Before drafting any content, gather the inputs that determine every structural and tonal decision in the report. A report written for the wrong audience or against unclear scope wastes significant effort.

- **Identify the primary decision the report must enable.** Every structural choice -- what findings to include, how deep the analysis goes, what recommendations to make -- flows from this. Ask: "What action will the reader take, or not take, based on this report?"
- **Clarify the audience hierarchy.** Identify the primary reader (decision-maker), secondary readers (functional managers, analysts), and any downstream audience (board, regulators, partners). The primary reader's level of domain expertise determines terminology, the depth of methodology explanation, and how prominently findings are surfaced.
- **Define the report period and data boundary.** Establish the precise time window (e.g., Q3 FY2025, January 1 -- March 31, 2025), geographic scope, product lines, customer segments, or business units included and excluded. Ambiguous scope produces disputed findings.
- **Identify all data sources.** List systems, databases, surveys, interviews, or third-party reports. Note collection dates, sample sizes, and known limitations. Data older than the report period by more than one prior cycle generally requires a caveat.
- **Establish the organizational standard for format.** Ask whether a template exists. If so, use it -- organizational muscle memory around report formats is real and matters for adoption. Note required sections, page limits, citation style, and confidentiality classification.
- **Determine whether this report updates a prior report.** If yes, identify what changed and what comparison data needs to carry forward. Update reports require a "Changes from Prior Period" section immediately after the executive summary.
- **Clarify sensitivity level.** Determine whether data is internal-only, restricted to named recipients, subject to regulatory confidentiality (e.g., legal hold, HIPAA, SEC quiet period), or contains personnel information. This affects headers, footers, distribution lists, and whether specific data must be redacted or aggregated.

---

### Step 2: Select the Correct Report Architecture

Business reports are not all identical. The architecture varies by report type. Choose the right structure before outlining.

- **Analytical/Performance Reports** (most common): Use the full structure -- Executive Summary, Introduction, Methodology, Findings, Analysis, Recommendations, Appendices. These reports diagnose a situation and prescribe action.
- **Feasibility and Investment Reports**: Add a dedicated Risk Assessment section between Analysis and Recommendations. Include financial modeling tables (NPV, IRR, payback period, or cost-benefit ratio) in the Findings section. Recommendations should be tiered by investment level.
- **Audit and Compliance Reports**: Replace "Recommendations" with "Corrective Actions" and add a "Findings Classification" section that rates each finding by severity (Critical, High, Medium, Low, Informational). Auditors use COSO, ISO 19011, or IIA standards -- reference the applicable framework in the methodology section.
- **Research and Market Analysis Reports**: Add a "Market Context" section before Findings. Include primary vs. secondary research distinction in methodology. Findings should address market size, growth rate, competitive dynamics, and customer segments separately.
- **Post-Mortem / Root Cause Reports**: Use a timeline-first structure -- Incident Summary, Timeline of Events, Root Cause Analysis (using 5-Why or Fishbone/Ishikawa methodology), Contributing Factors, Impact Assessment, Corrective Actions. Never assign individual blame in a written report; address systemic causes.
- **Operational Review Reports**: Organize Findings by process area or functional domain. Include a process efficiency metric table benchmarked against industry standards (cycle time, defect rate, cost per unit, throughput). Recommendations should map directly to specific process steps.

---

### Step 3: Write the Executive Summary Last, Place It First

The executive summary is the highest-stakes section of any business report because most primary decision-makers read only this section. Write it after the full report is complete so it accurately reflects the final content.

- **Length:** 250--500 words for reports under 20 pages; up to 750 words for reports over 30 pages. One page maximum in all cases.
- **Open with the most important finding or the report's central conclusion.** Never open with context or background. The reader knows why the report exists. Lead with what the data reveals.
- **Cover four elements in sequence:** (1) What was examined and over what period, (2) the 3--5 most significant findings with key data points, (3) the primary analytical conclusion connecting findings to cause or implication, (4) the top-priority recommendations with expected impact.
- **The executive summary must be fully self-contained.** A reader who reads only this section must understand the situation, the key evidence, and what to do. No forward references ("see Section 3 for details") in the executive summary -- paraphrase the relevant data instead.
- **Use specific numbers, not qualitative language.** "Customer satisfaction declined 11 points to 67%" is informative. "Customer satisfaction declined significantly" is not.
- **Do not introduce findings, analysis, or recommendations that do not appear in the body.** The executive summary is a compression, not a supplement.

---

### Step 4: Write Findings as Declarative Statements Supported by Data

Findings are the core empirical content of the report. Each finding states what the data shows, not what to do about it.

- **Structure each finding as a declarative sentence that asserts a measurable fact.** Example: "Average order fulfillment time increased from 3.2 days to 5.8 days between Q2 and Q3, a deterioration of 81%." Not: "There were some challenges with fulfillment time."
- **Every finding requires three elements:** (1) the finding statement, (2) supporting data in table or chart format, (3) context (prior period comparison, industry benchmark, target/SLA, or peer comparison). A finding without context is a data point, not an insight.
- **Use tables for any comparison involving 3 or more data points or metrics.** Tables allow the reader to scan and validate data independently. Use consistent units, decimal places, and column order across all tables.
- **Organize findings thematically, not chronologically.** Group related observations under a common finding category. Chronological presentation buries the significance of patterns.
- **Distinguish between findings (observed facts) and analysis (interpretation).** "Revenue declined 14% in Q3" is a finding. "The Q3 revenue decline is attributable primarily to customer churn in the mid-market segment, not pricing changes" is analysis. Keep these in separate sections.
- **Assign a finding number to each major finding.** This allows recommendations to reference specific findings unambiguously ("Recommendation 2 addresses Finding 2.3").
- **Use confidence qualifiers when data is incomplete or estimated.** Phrases like "based on available data," "estimated from a 38% survey response rate," or "provisional finding pending Q4 reconciliation" protect the report's credibility without eliminating the finding.
- **For financial data, always state the currency, the accounting basis (cash vs. accrual), and whether figures are audited or unaudited.**

---

### Step 5: Write Analysis That Explains Causation and Patterns

Analysis is the intellectual center of the report. It transforms findings from isolated facts into a coherent explanation.

- **Organize analysis around the primary decision, not around repeating findings.** Analysis should answer: Why is this happening? What is the relationship between findings? What does this mean for the decision at hand?
- **Use causal language precisely.** "X is correlated with Y" and "X caused Y" are not interchangeable. Use "associated with," "coincides with," or "is correlated with" unless you have causal evidence. State the basis for any causal claim.
- **Identify the 1--2 root drivers among multiple contributing factors.** Reports that list ten contributing factors without distinguishing primary from secondary drivers force the reader to do the analysis themselves. Prioritize.
- **Reference finding numbers explicitly.** "As shown in Finding 2.3, engineering escalations account for 32% of tickets and average 36 hours in queue -- the primary driver of the resolution SLA gap identified in Finding 2.2."
- **Include a constraints and limitations paragraph in the analysis section when data quality affects conclusions.** State which conclusions are well-supported and which are provisional.
- **For reports with financial modeling:** Show calculations, not just outputs. Include assumptions tables. State the sensitivity of conclusions to changes in key assumptions (e.g., "If churn rate improves by 5 percentage points, payback period shortens from 18 to 11 months").
- **Length:** Analysis is typically 20--30% of the report body. Do not let it become a second findings section that restates data without interpretation.

---

### Step 6: Write Recommendations That Are Specific, Prioritized, and Connected

Recommendations are the action layer of the report. Weak recommendations destroy the value of strong analysis.

- **Each recommendation must be traceable to at least one specific finding.** State the connection explicitly ("This recommendation addresses the resolution gap identified in Finding 2.3").
- **Use direct, active voice.** "Hire one Tier 2 technical specialist by Q1" -- not "It is recommended that staffing levels be evaluated." The recommendation must specify who should do what, by when.
- **Every recommendation requires four components:** (1) the specific action, (2) the responsible party or function, (3) the expected outcome with a quantified impact where possible, (4) a realistic implementation timeline with phasing if appropriate.
- **Prioritize recommendations using a two-axis framework:** impact (High/Medium/Low) and implementation effort or cost (High/Medium/Low). Present recommendations in a priority-ranked table. High-impact, low-effort recommendations ("quick wins") should be ranked first even if they are not the largest strategic moves.
- **Distinguish between recommendation types:** immediate actions (within 30 days), short-term actions (30--90 days), and strategic actions (90+ days or requiring capital approval). Mixing these without labeling them creates unrealistic expectations.
- **Avoid over-recommending.** Three to seven well-supported, specific recommendations are more valuable than twelve vague ones. If the analysis supports more than seven recommendations, group related ones into a single structured recommendation with sub-components.
- **For reports going to decision-makers who control budgets:** Include an estimated cost or resource requirement for each recommendation, even if rough. Recommendations without cost context cannot be approved.
- **Flag dependencies between recommendations.** If Recommendation 3 only works if Recommendation 1 is implemented first, state this explicitly.

---

### Step 7: Format for the Reader, Not the Writer

Professional business reports are structured for scanning -- most readers will not read every word. The formatting choices determine whether the report's content is actually absorbed.

- **Heading hierarchy:** H1 for the report title, H2 for major sections (Executive Summary, Introduction, Findings, Analysis, Recommendations, Appendices), H3 for subsections within each major section. Never go deeper than H3 in the main body.
- **White space is functional.** Break dense paragraphs. Use bullet points for lists of 3 or more parallel items. Never use a paragraph where a table communicates the same information more clearly.
- **Page limitations by report type:** Standard operational/performance reports: 8--12 pages of body content plus appendices. Market analysis or feasibility reports: 15--25 pages. Audit reports: no page limit, but each finding should be self-contained. Move all raw data, full survey results, and supporting calculations to appendices.
- **Label every table and figure.** Use consistent numbering ("Table 1: Q3 Ticket Volume by Channel," "Figure 2: Resolution Time Trend, Q1--Q4"). Reference tables by label in the body text ("see Table 3").
- **Number all pages.** Include the report title and confidentiality classification in the footer of every page.
- **Use a consistent date format** throughout the document. ISO format (YYYY-MM-DD) is unambiguous for international distribution; spell out month names (e.g., "15 January 2026") for domestic reports requiring clarity.
- **For long reports (15+ pages), include a table of contents** after the title page with page numbers. For reports under 15 pages, a table of contents is optional but useful.
- **Highlight key numbers.** Bold the single most important metric in each finding section. Do not bold for decoration -- bold exactly the data point a skimming reader should not miss.

---

### Step 8: Review Against Quality Criteria Before Delivering

Apply a final structured review before presenting the report to the user.

- **The "So What" test:** For every finding, ask "so what?" If the answer is not in the analysis or recommendations, the finding needs either more development or removal.
- **The "Who Does What By When" test:** Apply to every recommendation. Any recommendation that cannot answer all three questions is incomplete.
- **The "Data Source" test:** Every number in the body must trace to a source stated in the methodology section or cited inline. Unsourced numbers in a business report are a credibility risk.
- **The "Executive Summary Standalone" test:** Cover the body of the report and read only the executive summary. A reader who stops there should understand the situation clearly enough to make a provisional decision.
- **Consistency check:** All numbers that appear in both the executive summary and the body must match exactly. All finding numbers referenced in the analysis and recommendations sections must exist in the findings section.
- **Tone check:** The report tone should be objective and evidence-based throughout. Editorializing, advocacy, or hedging language that softens clear findings weakens the report. "Revenue declined 23%" -- not "revenue experienced a challenging decline."

---

## Output Format

```
# [Report Title]: [Report Type and Period]

**Prepared by:** [Author Name, Title]
**Prepared for:** [Primary Audience, Title/Function]
**Date:** [Date of Issue]
**Report period:** [Start Date -- End Date]
**Distribution:** [Named recipients or distribution class]
**Classification:** [Internal / Restricted / Confidential / Public]
**Report version:** [v1.0 / v1.1 Final / etc.]

---

## Executive Summary

[Open with the central finding or conclusion -- not background context.]

[2--4 sentences covering what was examined, the report period, and the
data sources used.]

[3--5 key findings stated with specific metrics. Each finding in 1--2
sentences. Include the most significant data point for each.]

[1--2 sentences on the primary analytical conclusion: what drives the
pattern observed across findings.]

[Top 2--3 recommendations with expected impact. Specific and actionable.
No vague language.]

[Total: 300--500 words. One page maximum.]

---

## 1. Introduction

### 1.1 Purpose

[State the specific question or decision this report addresses. One
paragraph, 3--5 sentences. Avoid "This report aims to..." -- state
the decision context directly.]

### 1.2 Scope

[Define what is included: time period, business units, geographies,
product lines, customer segments, channels.]

[Define what is explicitly excluded and why. Exclusions prevent scope
disputes after the report is issued.]

### 1.3 Methodology

[Describe each data source: system or database name, data type, time
range, record count or sample size.]

[Describe the analytical methods applied: statistical techniques,
benchmarking sources, survey methodology, interview protocol.]

[State known limitations: missing data, survey response rates below
60%, estimates or projections used, data not yet reconciled or audited.]

---

## 2. Findings

### 2.1 [Finding Category -- e.g., "Revenue Performance"]

**Finding 2.1:** [Declarative statement of the finding in one sentence,
quantified where possible.]

[1--2 sentences providing context: prior period, target, or benchmark.]

| Metric | [Period/Baseline] | [Current Period] | Change | Target |
|--------|------------------|-----------------|--------|--------|
| [Metric 1] | [value] | [value] | [+/- %] | [value] |
| [Metric 2] | [value] | [value] | [+/- %] | [value] |
| [Metric 3] | [value] | [value] | [+/- %] | [value] |

*Table 1: [Descriptive table title]. Source: [Data source and date].*

[1--2 sentences on the significance of this finding for the decision
at hand.]

---

### 2.2 [Finding Category -- e.g., "Customer Satisfaction"]

**Finding 2.2:** [Declarative statement.]

[Context paragraph with benchmark or prior-period comparison.]

| Metric | [Baseline] | [Current] | Change | Industry Benchmark |
|--------|-----------|----------|--------|--------------------|
| [Metric] | [value] | [value] | [delta] | [value] |

*Table 2: [Table title]. Source: [Source].*

[Significance statement.]

---

### 2.3 [Finding Category -- e.g., "Operational Efficiency"]

**Finding 2.3:** [Declarative statement.]

[Supporting narrative and data table.]

---

[Add additional Finding sections (2.4, 2.5, etc.) as warranted.
Typical reports contain 3--6 finding categories.]

---

## 3. Analysis

### 3.1 [Primary Driver or Theme]

[Analytical paragraph connecting findings to causation or pattern.
Reference finding numbers explicitly. Use causal language precisely.]

### 3.2 [Secondary Driver or Theme]

[Second analytical paragraph or theme. Identify interdependencies
between findings.]

### 3.3 Constraints and Confidence Level

[State which conclusions are well-supported by complete data and which
are provisional. Identify what additional information would strengthen
or change the conclusions.]

---

## 4. Recommendations

[Opening sentence: reference the primary analytical conclusion and
state that the following recommendations address it.]

| # | Recommendation | Addresses Finding | Expected Impact | Responsible Party | Timeline | Cost Estimate | Priority |
|---|---------------|------------------|----------------|-------------------|----------|---------------|----------|
| R1 | [Specific action verb + who + what] | 2.1, 2.3 | [Quantified outcome] | [Function or role] | [30/60/90 days or Q] | [$ range or FTE] | High |
| R2 | [Specific action verb + who + what] | 2.2 | [Quantified outcome] | [Function or role] | [Timeline] | [Cost] | High |
| R3 | [Specific action verb + who + what] | 2.3 | [Quantified outcome] | [Function or role] | [Timeline] | [Cost] | Medium |
| R4 | [Specific action verb + who + what] | 2.4 | [Quantified outcome] | [Function or role] | [Timeline] | [Cost] | Medium |
| R5 | [Specific action verb + who + what] | 2.2, 2.4 | [Quantified outcome] | [Function or role] | [Timeline] | [Cost] | Low |

### Implementation Notes

[Note any dependencies between recommendations. Flag which
recommendations require budget approval, headcount approval, or
cross-functional coordination. Identify quick wins (high impact,
low effort) and strategic actions (longer timeline, capital required).]

---

## 5. Appendices

### Appendix A: [Detailed Data Tables]

[Full data sets, raw survey results, or complete financial models
referenced in Findings. Label each table as "Table A-1," "Table A-2,"
etc.]

### Appendix B: [Supporting Analysis or Methodology Detail]

[Regression outputs, statistical test results, interview guides,
or benchmark source documentation.]

### Appendix C: [Definitions and Glossary]

[Define all metrics, acronyms, and technical terms used in the report.
Especially important for cross-functional or external audiences.]

### Appendix D: [Changes from Prior Report] *(if applicable)*

[Table comparing key metrics from the prior report period to the current
period. Note methodology or scope changes that affect comparability.]
```

---

## Rules

1. **Never merge findings and recommendations in the same section.** The findings section states what the data shows. Recommendations state what to do. Mixing them forces the reader to evaluate evidence and conclusions simultaneously -- a known source of decision fatigue and disagreement in organizational settings.

2. **Never present a number without its denominator, baseline, or benchmark.** "Sales increased by $240,000" tells the reader almost nothing. "Sales increased by $240,000 (8.3%), from $2.89M in Q2 to $3.13M in Q3, against a plan of $3.00M" is a complete data point. Always provide prior period, target, or industry reference.

3. **Never use qualitative intensity language in place of quantified data.** Words like "significant," "substantial," "dramatically," "notable," and "considerable" are not measurements. Replace them with the actual percentage, dollar amount, or count. Reserve qualitative language for context, not for the measurement itself.

4. **Never write a recommendation that does not specify a responsible party.** "The company should improve customer onboarding" is not a recommendation -- it is a wish. "The Customer Success team should redesign the onboarding checklist by March 31" is a recommendation.

5. **Never open the executive summary with background or context.** The reader knows why the report was commissioned. Opening with "The purpose of this report is to examine..." wastes the reader's highest-attention moment on information they already possess. Lead with the most important finding.

6. **Always separate data limitations from findings.** Data quality issues belong in the methodology section and in a constraints paragraph in the analysis section -- not scattered as caveats throughout the findings. Readers who see repeated hedging in findings lose trust in all the data, including the reliable parts.

7. **Always number findings and cross-reference them in recommendations.** A recommendation that says "to address the escalation queue issue described earlier" is less defensible and harder to follow than "to address Finding 2.3 (engineering escalation queue averaging 36 hours)." Numbered cross-references make the report's logical structure auditable.

8. **Always include a version number and issue date on the report.** Business reports are frequently revised before final issuance. Undated or unversioned reports create distribution and citation confusion. Use version notation (v0.1 draft, v1.0 final, v1.1 revised final).

9. **Always move raw or granular data to appendices.** A table with 40 rows of transaction data in the body of a report destroys narrative flow and buries the finding. Summarize to 5--8 rows in the body table; reference the appendix for the full dataset. Decision-makers read summaries; analysts use appendices.

10. **Never adjust findings to align with a preferred recommendation.** The analytical sequence must always run: data collection → objective findings → analysis → recommendations. If the preferred recommendation does not emerge from the data, the correct response is to state what the data does support and note the gap -- not to reverse-engineer findings to justify a predetermined conclusion. A report discovered to have manipulated findings destroys organizational trust in all future reports.

11. **Always match the reading level and terminology to the primary audience.** A report written for a Chief Financial Officer should use finance-domain terminology without explanation. The same findings written for a frontline operations manager should define financial terms. Misjudging audience level makes the report either condescending or inaccessible.

12. **For any report containing financial projections, always include an assumptions table.** State the key inputs (growth rate assumed, cost per unit, headcount, churn rate, etc.) in a dedicated table. Projections without visible assumptions cannot be stress-tested by the reader and are routinely dismissed in senior decision-making forums.

---

## Edge Cases

### Missing, Incomplete, or Disputed Data

When key data is unavailable, the report must not simply omit the relevant finding. State the finding with appropriate confidence qualification: "Based on available Q3 data (87% of transactions reconciled), average processing cost is estimated at $4.20 per unit; final figures will be confirmed in the Q3 audit." Distinguish between data that is missing entirely, data that is available but of uncertain quality, and data that is disputed between organizational units. For disputed data, present both versions of the data with their sources and note that the discrepancy requires resolution before conclusions can be finalized. Do not pick one disputed data point as "correct" in the body of the report without organizational agreement.

### No Clear Recommendations Emerge from the Data

Some reports are commissioned to document a baseline, diagnose a situation, or respond to a regulatory request -- and the data does not yet support actionable recommendations. Label the report explicitly as a "Findings and Diagnostic Report" in the title. Replace the Recommendations section with a "Next Steps and Open Questions" section that identifies: (1) what additional data would be needed to support recommendations, (2) which stakeholder decisions must occur before recommendations can be made, and (3) the proposed timeline for a follow-up report with full recommendations. Do not fabricate recommendations to fill the section.

### Multiple Audiences with Conflicting Information Needs

When the same report must serve both senior decision-makers and functional analysts, layer the report explicitly. The executive summary and Recommendations section serve the senior audience -- write these in strategic, outcome-focused language. The Findings and Analysis sections serve functional managers -- write in operational language with process-level detail. The Appendices serve analysts -- include full data tables, methodology detail, and calculation documentation. Add a brief reader's guide after the table of contents: "Senior leaders: begin with the Executive Summary and Section 4 (Recommendations). Operations managers: begin with Section 2 (Findings). Analysts: see Appendices A--C."

### Report Updates a Prior Report with Methodology Changes

When the current report covers the same domain as a prior report but uses different data sources, revised metric definitions, or an updated time period baseline, the comparisons will be non-equivalent. Do not present prior-period data from the old methodology in the same table as current data under the new methodology without explicit disclosure. Add a "Methodology Changes" subsection in the Introduction. If the changes are significant, include a reconciliation table in an appendix showing the old calculation vs. the new calculation for the most recent shared period, so readers understand the magnitude of the definitional difference. Never silently change a metric definition between report periods.

### Confidential or Personnel-Sensitive Content

When the report contains performance data on named individuals, compensation information, personnel actions, or pre-decisional content subject to legal privilege, apply the following controls: Mark the classification level ("Restricted -- Named Recipients Only") in the header and footer of every page. Remove or aggregate data in a way that no individual can be identified from report tables (generally, groups of fewer than 5 individuals should be aggregated or suppressed). Include an explicit distribution restriction statement on the title page. If the report contains legally privileged content (prepared at direction of counsel), include "Prepared at the Direction of Legal Counsel -- Privileged and Confidential" on the title page. Note that this classification affects how and where the report may be stored and shared.

### Findings Contradict Stakeholder Expectations or Prior Commitments

Business reports sometimes produce findings that contradict what leadership expected, promised, or publicly committed to. The correct approach is to present findings objectively regardless of their political sensitivity, and to address the discrepancy explicitly in the analysis section rather than allowing it to surface as an implicit contradiction. Example framing: "The Q3 findings indicate that the cost reduction target of 15% was not achieved; actual reduction was 6.2%. Section 3 examines the primary factors contributing to this gap and the conditions required to achieve the original target in Q4." A report that softens or omits inconvenient findings to protect stakeholder expectations provides false assurance and is a material failure of the business report's core function.

### Very Limited Data (Small Sample, Short Time Window, or Single Source)

When data is limited -- fewer than 30 observations for a quantitative finding, a survey with under 25% response rate, or a single quarter of history for a metric that normally requires 4--6 quarters to interpret -- state limitations prominently. Use confidence intervals or ranges rather than point estimates where statistically appropriate. Avoid trend language ("declining," "improving") when only two data points exist -- two data points describe a difference, not a trend. Recommend in the methodology section that findings be treated as directional indicators requiring confirmation in the next reporting period, not as definitive conclusions.

### Report Must Be Delivered in a Non-Standard Format

Organizational requirements sometimes mandate specific templates, software outputs (e.g., a specific enterprise report format), or document structures that conflict with best-practice report architecture. In these cases: Follow the organizational template for section naming and ordering. Apply all content quality rules (declarative findings, quantified data, traceable recommendations) within the required structure -- even if the sections have different names. If the mandatory template omits a critical section (such as methodology or recommendations), add it as a subsection within the closest available section and note the accommodation. Document format compliance constraints in the methodology section.

---

## Example

**Input:** "Write a quarterly business report. We're a mid-size SaaS company. Q3 product usage data shows daily active users dropped from 8,400 to 6,900. New customer onboarding completion rate is 54% -- was 71% last quarter. Our enterprise tier (top 40 accounts) is fine -- 94% retention. The problem is with our SMB segment. Churn in SMB jumped from 3.1% monthly to 5.8% monthly. Support ticket volume from new users (0--90 days) is up 180% -- mostly about the same three features. We changed our onboarding flow in July. Revenue impact is about $380,000 ARR at risk."

**Output:**

---

# Q3 Product Usage and SMB Retention Report

**Prepared by:** Head of Product Operations
**Prepared for:** Chief Product Officer; Chief Revenue Officer
**Date:** October 14, 2025
**Report period:** July 1 -- September 30, 2025
**Distribution:** CPO, CRO, VP Customer Success, VP Engineering, Head of SMB Sales
**Classification:** Internal -- Restricted
**Report version:** v1.0 Final

---

## Executive Summary

SMB segment churn tripled following the July onboarding flow redesign, placing approximately $380,000 in ARR at immediate risk. Daily active users declined 17.9% (8,400 to 6,900) over the quarter. New customer onboarding completion fell from 71% to 54%, a 17-point drop coinciding directly with the July onboarding change. SMB monthly churn accelerated from 3.1% to 5.8% -- well above the 2.0% industry benchmark for SMB SaaS -- while the enterprise tier held at 94% retention. Support ticket volume from users in their first 90 days increased 180%, concentrated in three specific feature areas: data import, dashboard customization, and API key generation.

The data strongly indicates the July onboarding redesign created friction points that SMB customers -- who typically have less technical support than enterprise accounts -- cannot resolve independently. Enterprise customers are absorbing the same friction through dedicated customer success resources, masking the product-level problem at the aggregate level.

**Priority recommendations:** (1) Immediately roll back or offer a legacy onboarding path for new SMB accounts while fixes are developed. (2) Publish self-service resolution content for the three high-volume support issues within 14 days to stop the immediate ticket surge and reduce early churn. (3) Commission a structured SMB user testing session before re-releasing the redesigned onboarding flow. Addressing these three actions is estimated to recover 60--70% of the at-risk ARR within one quarter.

---

## 1. Introduction

### 1.1 Purpose

This report examines the drivers of Q3 user engagement decline and elevated SMB churn, with the goal of informing an immediate product and customer success response. The central question is whether the Q3 metrics represent a temporary activation problem, a product-market fit issue in the SMB segment, or a recoverable onboarding execution failure. The findings support the third interpretation and allow for a targeted, time-bound recovery plan.

### 1.2 Scope

**Included:** All registered customer accounts active during Q3 2025 (July 1 -- September 30). User activity data from the product analytics platform. Support ticket data from the CRM. Churn data from billing records confirmed through account management.

**Excluded:** Trial accounts (pre-conversion). Accounts in legal dispute or negotiated off-boarding. Enterprise accounts under multi-year contract lock-in where churn is structurally prevented for the reporting period.

**Segment definitions:** SMB = accounts with fewer than 200 employees or ARR below $24,000. Enterprise = accounts with 200+ employees or ARR of $24,000+. The top 40 accounts referenced throughout this report represent the enterprise tier.

### 1.3 Methodology

**Product usage data:** Extracted from the product analytics platform on October 10, 2025. Daily active user (DAU) metric is defined as any authenticated user who performed at least one core workflow action within the session. Total records: 847,000 session events across the quarter.

**Churn data:** Pulled from billing system on October 11, 2025. Monthly churn rate calculated as (accounts churned during month) ÷ (accounts at start of month). Data covers 1,204 SMB accounts and 40 enterprise accounts.

**Onboarding completion rate:** Defined as the percentage of new accounts completing all 7 steps of the onboarding checklist within 30 days of account creation. Q2 baseline from onboarding system logs. Q3 data from same system post-July redesign.

**Support ticket data:** Exported from CRM on October 9, 2025. "New user tickets" defined as tickets submitted by users in accounts created within the prior 90 days. Ticket categorization performed by the Support team using existing tag taxonomy; categories with fewer than 10 tickets in the period were grouped into "Other."

**Known limitations:** Net revenue impact of $380,000 ARR at risk is an estimate based on churned accounts plus accounts flagged as "at-risk" by account managers -- not a confirmed revenue loss. Exact attribution of churn to onboarding vs. other factors (pricing, competition, support experience) is directional, not statistically isolated.

---

## 2. Findings

### 2.1 Daily Active User Decline

**Finding 2.1:** Daily active users declined 17.9% over Q3 2025, falling from 8,400 at the start of July to 6,900 by end of September -- the steepest single-quarter decline in the past eight quarters.

The decline began in the second week of July and accelerated through August before partially stabilizing in September. The drop is concentrated in accounts in their first 90 days of use.

| Metric | Q2 2025 | Q3 2025 | Change | Prior 4-Q Avg |
|--------|---------|---------|--------|--------------|
| Peak DAU | 8,400 | 6,900 | -17.9% | +4.2% per Q |
| Avg monthly DAU | 8,100 | 7,300 | -9.9% | +3.8% per Q |
| DAU from accounts 0--90 days | 1,820 | 980 | -46.2% | +8.1% per Q |
| DAU from accounts 90+ days | 6,280 | 5,920 | -5.7% | +2.9% per Q |

*Table 1: Daily active user metrics, Q2 vs. Q3 2025. Source: Product analytics platform, extracted October 10, 2025.*

**The decline is disproportionately driven by new accounts.** Users in accounts older than 90 days declined only 5.7%, consistent with normal seasonal variation. Users in new accounts (0--90 days) declined 46.2%, indicating a sharp degradation in early activation, not broad disengagement from the existing user base.

---

### 2.2 Onboarding Completion Rate Deterioration

**Finding 2.2:** New customer onboarding completion dropped from 71% in Q2 to 54% in Q3 -- a 17-percentage-point decline -- immediately following the July onboarding flow redesign.

Industry benchmark for SaaS onboarding completion in the SMB segment is 65--75% for well-optimized flows. The Q3 rate of 54% falls below this range for the first time in six quarters.

| Metric | Q1 2025 | Q2 2025 | Q3 2025 | Change Q2-Q3 | SMB SaaS Benchmark |
|--------|---------|---------|---------|-------------|-------------------|
| Onboarding completion rate | 68% | 71% | 54% | -17 pts | 65--75% |
| Median time to complete onboarding | 4.2 days | 3.9 days | 9.1 days | +133% | 3--5 days |
| % completing within 7 days | 74% | 79% | 41% | -38 pts | 70--80% |
| % completing within 30 days | 88% | 91% | 62% | -29 pts | 85--95% |

*Table 2: Onboarding completion metrics, Q1--Q3 2025. Source: Onboarding system logs. Benchmark: SaaS Metrics Benchmarks 2025, Product-Led Growth segment.*

The median time to complete onboarding more than doubled, from 3.9 days in Q2 to 9.1 days in Q3. Accounts that do not complete onboarding within 14 days have a historically 3.4x higher churn rate in their first 6 months, based on internal cohort analysis.

---

### 2.3 SMB Churn Acceleration

**Finding 2.3:** SMB monthly churn rate increased from 3.1% in Q2 to 5.8% in Q3 -- an 87% deterioration -- placing the company significantly above the 2.0% SMB SaaS industry benchmark.

At 5.8% monthly churn, the implied annual churn rate is approximately 50%. The enterprise tier showed no comparable deterioration, holding at 94% annual retention.

| Metric | Q2 2025 | Q3 2025 | Change | SMB SaaS Benchmark |
|--------|---------|---------|--------|--------------------|
| SMB monthly churn rate | 3.1% | 5.8% | +87% | ≤2.0% |
| SMB implied annual churn | ~34% | ~50% | +16 pts | ≤22% |
| Enterprise annual retention | 94% | 94% | 0 pts | N/A |
| Accounts churned (SMB) | 37 | 70 | +89% | -- |
| Estimated ARR at risk | -- | ~$380K | -- | -- |

*Table 3: Churn metrics by segment, Q2 vs. Q3 2025. Source: Billing system, October 11, 2025. ARR at risk includes confirmed churn and at-risk flagged accounts.*

**Of the 70 SMB accounts that churned in Q3, 61 (87%) had not completed the onboarding flow** at the time of cancellation. This is the strongest single data point connecting onboarding failure to churn outcome.

---

### 2.4 Support Ticket Surge Concentrated in Three Features

**Finding 2.4:** Support tickets from new users (accounts aged 0--90 days) increased 180% in Q3, with 68% of the volume attributable to three specific features introduced or modified in the July onboarding redesign.

Total new-user support tickets increased from 210 in Q2 to 588 in Q3. The three high-volume categories are data import (31% of new-user tickets), dashboard customization (22%), and API key generation (15%).

| Ticket Category | Q2 Volume | Q3 Volume | Change | % of Q3 New-User Tickets |
|----------------|-----------|-----------|--------|--------------------------|
| Data import | 28 | 182 | +550% | 31% |
| Dashboard customization | 19 | 129 | +579% | 22% |
| API key generation | 11 | 88 | +700% | 15% |
| Password/login issues | 41 | 52 | +27% | 9% |
| Billing questions | 33 | 44 | +33% | 7% |
| Other | 78 | 93 | +19% | 16% |
| **Total new-user tickets** | **210** | **588** | **+180%** | -- |

*Table 4: Support ticket volume by category, new users (accounts aged 0--90 days), Q2 vs. Q3 2025. Source: CRM export, October 9, 2025.*

The 550--700% increases in the three feature-specific categories are not consistent with volume growth or seasonal variation. The baseline "Other" and administrative categories (billing, login) grew only 19--33%, indicating a feature-specific rather than a systemic support load increase.

---

## 3. Analysis

### 3.1 Root Cause: July Onboarding Redesign Created Unresolvable Friction for SMB Users

The convergence of four simultaneous Q3 signals -- DAU decline concentrated in new accounts (Finding 2.1), onboarding completion collapse (Finding 2.2), SMB churn acceleration (Finding 2.3), and support ticket surge in three specific features (Finding 2.4) -- points to a single root cause: the July onboarding redesign introduced friction that SMB customers cannot resolve without support, and which a meaningful percentage abandon entirely.

The three high-volume support features (data import, dashboard customization, API key generation) were each modified or repositioned within the onboarding flow in July. The pre-July flow guided users through data import after account activation; the redesigned flow front-loaded API key generation -- a step that requires developer involvement that many SMB accounts do not have readily available. This sequencing change alone likely accounts for a significant portion of the onboarding abandonment.

### 3.2 Enterprise Tier Is Masking the Product-Level Problem

The enterprise tier's stable 94% retention (Finding 2.3) does not indicate that enterprise customers are unaffected by the onboarding changes -- it indicates that dedicated Customer Success resources are absorbing the friction on their behalf. Enterprise accounts receive white-glove onboarding with a named CSM. SMB accounts are expected to self-serve through the onboarding flow. The same product issue is producing different outcomes in the two segments because of the support model, not because of product-segment fit differences.

This distinction is important: if the analysis were limited to aggregate retention metrics, the July change would appear harmless. The SMB-specific cut reveals the actual product-level problem.

### 3.3 Financial Exposure and Trajectory

At 5.8% monthly SMB churn, the account base will decline approximately 50% over 12 months if the rate is not reversed. The $380,000 ARR at risk is a point-in-time estimate; at the current churn trajectory, the 12-month revenue exposure is materially higher. Additionally, increased support load (588 tickets in Q3 from new users alone, compared to 210 in Q2) represents a significant operational cost increase that compounds the revenue impact. Reversing the onboarding failure is both a revenue retention action and an operational cost control action.

### 3.4 Confidence Level

The connection between the July onboarding change and the Q3 metrics is highly supported across four independent data streams that all changed in the same direction in the same time period. The specific attribution of churn to onboarding vs. other factors (competitor activity, pricing sensitivity) is directional. One confounding factor to investigate: July historically shows some seasonal variation in SMB churn. However, the Q3 rate of 5.8% is 87% above Q2 and 190% above the 2.0% benchmark -- well beyond normal seasonal range.

---

## 4. Recommendations

The following recommendations address the SMB onboarding and churn crisis in sequence: first stopping the immediate damage (R1, R2), then diagnosing and fixing the root cause (R3, R4), then preventing recurrence (R5).

| # | Recommendation | Addresses Finding | Expected Impact | Responsible Party | Timeline | Cost Estimate | Priority |
|---|---------------|------------------|----------------|-------------------|----------|---------------|----------|
| R1 | Immediately offer SMB new accounts access to the legacy (pre-July) onboarding path as an alternative while the redesign is fixed | 2.2, 2.3 | Onboarding completion rate returns to ~68--71%; SMB churn begins declining within 30 days | VP Engineering + VP Customer Success | Within 7 days | Engineering: ~20 hours to re-enable legacy path | **High** |
| R2 | Publish self-service help articles and in-app tooltips for the top 3 ticket categories: data import, dashboard customization, API key generation | 2.4 | Reduce new-user ticket volume by estimated 50--60%; partially offset churn for users mid-onboarding | Head of Support + Product Marketing | Within 14 days | ~30 hours content creation | **High** |
| R3 | Conduct structured usability testing (minimum 12 SMB-profile participants) on the redesigned onboarding flow before re-releasing | 2.1, 2.2 | Identifies specific friction points; ensures redesign achieves ≥70% completion rate before launch | Product Design + UX Research | 30--45 days | ~$8,000--$12,000 for external participants + facilitation | **High** |
| R4 | Resequence API key generation step in onboarding to occur after data import and dashboard setup, not before | 2.2, 2.4 | Removes single largest blocker for non-technical SMB administrators; estimated to recover 8--12 pts of onboarding completion rate | Product + Engineering | 30 days | Engineering: ~15 hours | **High** |
| R5 | Implement a 14-day onboarding health check for all new SMB accounts: automated trigger if onboarding completion < 40% by day 14, routed to Customer Success for outreach | 2.1, 2.2, 2.3 | Identifies at-risk accounts before churn decision; estimated 15--20% recovery of abandoning accounts | Customer Success + Engineering (automation) | 60 days | Engineering: ~40 hours; CS: 0.25 FTE ongoing | **Medium** |

### Implementation Notes

R1 and R2 are independent and should be executed in parallel immediately. R3 must be completed before the redesigned onboarding flow is re-released to the full SMB segment. R4 can be implemented in parallel with R3 as a targeted fix that does not require full testing to deploy safely. R5 depends on completion of R1 and R4 to be effective -- a health check that routes users back to a broken flow is not useful.

Budget authority: R1, R2, and R4 are within standard engineering and content budgets. R3 requires a discrete budget approval of up to $12,000. R5 requires VP Engineering approval for the automation scope.

---

## 5. Appendices

### Appendix A: Full SMB Churn Data by Month, Q1--Q3 2025

| Month | SMB Accounts (Start) | Churned | Churn Rate | New Accounts Added |
|-------|---------------------|---------|------------|-------------------|
| Jan | 1,090 | 28 | 2.6% | 54 |
| Feb | 1,116 | 27 | 2.4% | 48 |
| Mar | 1,137 | 31 | 2.7% | 62 |
| Apr | 1,168 | 33 | 2.8% | 51 |
| May | 1,186 | 34 | 2.9% | 58 |
| Jun | 1,210 | 37 | 3.1% | 47 |
| **Jul** | **1,220** | **58** | **4.8%** | **44** |
| **Aug** | **1,206** | **71** | **5.9%** | **38** |
| **Sep** | **1,173** | **70** | **6.0%** | **41** |

*Table A-1: Monthly SMB churn, January -- September 2025. Source: Billing system. Note: July onboarding redesign deployed July 8,
