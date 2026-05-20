---
name: report-formatting
description: |
  Produces a data report structure with executive summary format, findings section template with chart-plus-interpretation pairs, methodology note, and appendix organization. Separates insight from supporting detail for maximum readability.
  Use when the user needs to structure a data-driven report for stakeholders, management, or publication.
  Do NOT use for single-chart formatting (use chart-formatting), infographic layout (use infographic-planning), or data narrative writing (use data-storytelling).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "data-visualization report template"
  category: "data-analysis"
  subcategory: "data-visualization"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Report Formatting

## When to Use

**Use this skill when:**
- A user has completed a data analysis and needs to structure the results into a professional document for stakeholders, management, a client, or an internal review board
- A user asks "what sections should my report include?", "how do I organize my findings?", or "can you help me build a report template?"
- A user needs to create a recurring report (weekly operational, monthly business review, quarterly board report, annual performance summary) with a repeatable, consistent structure
- A user has multiple findings of unequal importance and needs a framework that separates the critical insight from supporting detail so executives can skim while analysts can drill down
- A user is preparing a written deliverable that will accompany a presentation -- the report serves as the leave-behind artifact that persists after the meeting
- A user needs to make a data-driven recommendation to a decision-maker and must structure evidence, logic, and next steps in a single credible document
- A user has mixed audiences (executives wanting conclusions, analysts wanting methodology) and needs a layered architecture that serves both without forcing either to read what they don't need

**Do NOT use when:**
- The user needs to format a single chart or choose the right chart type for a single metric (use `chart-formatting`)
- The user wants a one-page visual summary or infographic for quick consumption (use `infographic-planning`)
- The user wants to write a narrative data story with prose-forward structure, character arcs, or dramatic tension (use `data-storytelling`)
- The user needs to design an interactive, real-time monitoring interface (use `dashboard-design`)
- The user is writing an academic paper with peer review requirements -- academic formatting has distinct conventions (citation styles, abstract word limits, IRB disclosures) that fall outside business report formatting
- The user needs a slide deck as the primary deliverable rather than a document -- slide architecture has fundamentally different constraints (use `presentation-design`)
- The user needs to format raw data output from a query or extract without any interpretive layer -- that is data export, not reporting

---

## Process

### Step 1: Establish Report Requirements Before Writing a Single Word

Clarify these five parameters before proposing any structure. A report built on wrong assumptions wastes significant effort.

- **Audience type and decision authority:** Who will read this report, and what decision will they make with it? A CMO approving a $500K budget reallocation needs different content density than a marketing manager reviewing weekly campaign metrics. Distinguish between the primary reader (who acts) and secondary readers (who may be consulted or cc'd).
- **Report purpose:** Is this descriptive (what happened?), diagnostic (why did it happen?), predictive (what will happen?), or prescriptive (what should we do)? Most business reports blend all four but one purpose dominates, and that determines the weight given to each section.
- **Recurring vs. one-time:** Recurring reports require fixed section positions, consistent chart axes, and period-over-period comparison infrastructure. One-time reports can be designed around the specific findings without worrying about comparability to a prior edition.
- **Distribution method:** A document distributed as PDF has different layout constraints than one distributed as a Word file (where recipients may edit), a Google Doc (where comments accumulate inline), or a printed board packet (where color costs money and resolution matters). Establish this before recommending fonts or chart styles.
- **Length tolerance:** Confirm whether the audience has an explicit or implicit page limit. Board packets at Fortune 500 companies are often hard-capped at 2 pages per section. Internal operational reviews may routinely run 20-30 pages. Mismatching length to audience tolerance is one of the most common report failures.

---

### Step 2: Select and Justify the Correct Report Architecture

Three architectures cover 95% of business report needs. Select one and explain the choice to the user.

**Architecture A -- Executive Brief (2-5 pages)**
- Use when: Primary audience is C-suite or senior management, decision timeline is short, recommendations are the main deliverable
- Structure: Cover page → Executive summary (1 page) → 3-5 findings with one chart each (1-3 pages) → Recommendations table (0.5 page) → Appendix reference note
- Key constraint: Every finding must link directly to a decision or action. Findings that are merely "interesting" do not belong in this format.
- Total chart count: 3-5 charts maximum. Charts must be interpretable without seeing the data table.

**Architecture B -- Operational Report (5-15 pages)**
- Use when: Audience includes both managers and practitioners, the report will be referenced throughout a work period, and methodology transparency is important
- Structure: Cover page → Table of contents → Executive summary (1 page) → Background and methodology (1-2 pages) → Findings sections with charts, interpretation, and supporting tables (5-10 pages) → Recommendations with owners and timelines (1 page) → Appendices
- Key constraint: The main body must be self-contained -- an analyst reading only the main body should not need the appendix to understand the findings.

**Architecture C -- Technical or Research Report (15+ pages)**
- Use when: Findings will be scrutinized for methodological validity, the report establishes a new baseline or changes a policy, or the audience includes domain experts who will challenge the methodology
- Structure: Cover page → Abstract (200-300 words) → Table of contents → Introduction and research questions → Literature context or prior baselines → Methodology (detailed enough to reproduce the analysis) → Findings organized by research question → Discussion of implications and limitations → Conclusions → Recommendations → References → Appendices (data tables, code, instruments)
- Key constraint: Every claim in the findings section must be traceable to a specific data source cited in the methodology section.

---

### Step 3: Structure Each Finding Section Using the CICS Pattern

Every finding in the report's main body follows a four-part pattern called CICS: Claim, Illustration, Context, So-What.

- **Claim (the heading):** State the finding as a declarative conclusion in the heading itself. The heading "Customer Churn Increased 23% After the July Price Increase" communicates a finding. The heading "Customer Churn Analysis" communicates nothing. Every reader who skims headings should be able to reconstruct the story of the report.
- **Illustration (the chart or table):** Place the chart or table immediately below the heading, before any prose. The reader should see the evidence before reading your interpretation of it. This builds credibility -- you are showing the data, then explaining it, rather than asserting a claim and then cherry-picking evidence.
- **Context (the interpretation paragraph):** Write 2-4 sentences that do three things: (a) describe what the chart shows in plain language, (b) explain why the pattern exists if the data supports an explanation, and (c) compare the result to a benchmark -- a prior period, a target, an industry standard, or a comparable group. Never end the interpretation paragraph without a comparison. "Conversion rate was 4.2%" is not an interpretation. "Conversion rate was 4.2%, up from 3.1% in the prior quarter and above the industry median of 3.5% reported in the most recent sector benchmarking study" is an interpretation.
- **So-What (the implication):** End each finding section with a single sentence or short paragraph that explicitly states what this finding means for a decision. This is the bridge between analysis and recommendation. "This finding implies that the July price increase is the most likely driver of churn and should be evaluated before the planned November price increase proceeds."

---

### Step 4: Write the Executive Summary Using the Inverted Pyramid

The executive summary is the most-read section of any report and the hardest to write well. Apply the inverted pyramid: most important information first, least important last.

- **Sentence 1 (the lede):** State the single most important finding and its magnitude. Include a number. "Q3 marketing performance exceeded lead generation targets by 18% while reducing cost per lead by 16%, delivering the strongest quarter in eight periods."
- **Sentences 2-4 (supporting findings):** Add 2-3 findings that contextualize the lede. Use quantitative language throughout. Avoid phrases like "significant improvement" or "notable decline" without attaching a number.
- **Sentence 5 (primary recommendation):** State the recommended action in one sentence. This is not a list of considerations -- it is a specific recommendation. "The primary recommendation is to reallocate 20% of the paid search budget to content marketing, which has a cost per lead of $22 vs. $56 for paid search."
- **Sentence 6 (key limitation or caveat):** Every executive summary must include at least one limitation that affects how the findings should be interpreted. This is not a hedge -- it is a credibility signal. Analysts who hide limitations are distrusted; analysts who disclose them are believed.
- **Length target:** 150-250 words for executive briefs, 200-350 words for operational reports, 300-500 words (formatted as an abstract) for technical reports. Test the executive summary by asking: if the reader stops here and acts, will they make the right decision? If not, the summary is incomplete.

---

### Step 5: Design the Page Architecture and Visual Standards

Consistent visual standards make the report feel authoritative and reduce cognitive load. Specify the following explicitly:

- **Typography:** Body text at 10-11pt in a serif font (Georgia, Garamond) for print-primary reports or a humanist sans-serif (Calibri, Source Sans Pro) for screen-primary reports. Headings at 14pt bold (H1), 12pt bold (H2), 11pt bold (H3). Never use more than two font families in a single report.
- **Margins:** 1 inch on all sides for standard documents. 0.75 inches for dense operational reports. 1.25 inches for board packets that will be annotated by hand.
- **Chart sizing:** Full-width charts (spanning the text column at 6-6.5 inches) for primary findings. Half-width charts (3 inches) for secondary supporting charts that appear side-by-side. Never embed a chart smaller than 2.5 inches wide -- interpretation below that size is unreliable.
- **Color palette:** Use a maximum of 3-4 colors in the entire report. Designate one primary color for positive/above-target performance, one for negative/below-target, one neutral gray for baselines and reference lines, and one accent for highlighted callouts. Use the same color conventions consistently across all charts in the report.
- **Tables in the main body:** Maximum 10-12 rows per table in the main body. More than that belongs in the appendix. Use a shaded header row, alternating row fill (white / very light gray, approximately 10% opacity), and right-align all numeric columns. Column headers for numbers should match the alignment of the values.
- **Page numbering:** Start numbering from the first page after the cover page. Bottom center is conventional. Include the report title and date in the footer for multi-page documents that may be printed and separated.

---

### Step 6: Build the Methodology Note With the Right Level of Detail

The methodology note is not an afterthought -- it determines whether findings can be trusted, reproduced, or challenged.

- Include: data source and version date, time period analyzed, universe definition (who or what was measured), sample size and any sampling method, key metrics and their precise definitions (not "revenue" but "net revenue after returns and discounts, excluding intercompany transactions"), tools used for analysis, and any transformations applied (outlier removal thresholds, normalization, currency conversion rates).
- Disclose any departures from prior methodology in recurring reports -- changes in data sourcing, metric definitions, or time period segmentation invalidate period-over-period comparisons and must be flagged explicitly.
- State what the analysis cannot answer. An analysis of website traffic cannot answer why a visitor converted. An analysis of sales data cannot answer why a customer churned. Stating boundaries prevents misuse of the findings.
- For executive briefs, place the methodology note after the recommendations, before the appendix (1/2 page maximum). For operational reports, place it in a dedicated section between background and findings (1-2 pages). For technical reports, the methodology section is a full chapter with subsections for data collection, cleaning, analysis approach, and validation.

---

### Step 7: Organize the Appendix as a Reference Library

The appendix is not a dumping ground -- it is a curated reference library that allows analysts to verify and extend the work.

- **Appendix A (Data Tables):** Full supporting data tables that were summarized in the main body. Label every table with the finding it supports and the page number of the main-body reference.
- **Appendix B (Additional Charts):** Charts that validate findings but are not essential to the argument. For example, a residuals plot from a regression, a seasonality decomposition chart, or a segmentation matrix.
- **Appendix C (Methodology Details):** Survey instruments, SQL queries or Python/R code, sampling frame documentation, data dictionary for all fields used in the analysis.
- **Appendix D (Glossary):** Define every term that the primary audience may not know. This includes technical statistical terms, industry jargon, and acronyms. Alphabetical order, one definition per line.
- Number appendix items (A-1, A-2, B-1, B-2) so that main-body cross-references are precise: "see Appendix B-3" is more useful than "see Appendix B."

---

### Step 8: Apply a Pre-Delivery Quality Check

Before finalizing the report, check all of the following:

- Every finding heading states a conclusion, not a topic
- Every chart has an interpretation paragraph directly below it
- Every number in the executive summary matches the corresponding number in the findings section exactly
- Every recommendation includes a measurable expected outcome, a timeline, and an owner
- The appendix is referenced at least once from the main body for each appendix item
- No main-body table exceeds 12 rows
- The methodology note includes at least one explicit limitation
- The executive summary stands alone as a complete document -- print only page 1 and verify that a reader would understand the conclusions

---

## Output Format

```
## DATA REPORT STRUCTURE

═══════════════════════════════════════════════════════════════
REPORT METADATA
═══════════════════════════════════════════════════════════════

| Element            | Value                                          |
|--------------------|------------------------------------------------|
| Report Title       | [Title that states the report's subject and    |
|                    | time period -- e.g., "Q3 2025 Marketing        |
|                    | Performance Report"]                           |
| Report Type        | [Executive Brief / Operational Report /        |
|                    | Technical Report / Recurring: Monthly|         |
|                    | Quarterly|Annual]                              |
| Architecture       | [A -- Executive Brief / B -- Operational /     |
|                    | C -- Technical]                                |
| Primary Audience   | [Role and decision they will make]             |
| Secondary Audience | [Role and how they will use the report]        |
| Author             | [Name, role, department]                       |
| Report Date        | [Date of publication]                          |
| Data Period        | [Start date to end date of data analyzed]      |
| Confidentiality    | [Public / Internal / Confidential /            |
|                    | Restricted]                                    |
| Distribution       | [PDF / Word / Google Doc / Printed / Email]    |
| Version            | [v1.0 -- or version number if revised]         |

---

═══════════════════════════════════════════════════════════════
COVER PAGE ELEMENTS
═══════════════════════════════════════════════════════════════

- Report title (large, centered)
- Subtitle: time period covered
- Author name and role
- Report date
- Confidentiality classification (bottom of page)
- Organization logo (top right, if applicable)

---

═══════════════════════════════════════════════════════════════
TABLE OF CONTENTS (Architecture B and C only)
═══════════════════════════════════════════════════════════════

1. Executive Summary ................................ p. 2
2. Background and Context .......................... p. 3
3. Methodology ..................................... p. 4
4. Findings
   4.1 [Finding 1 Heading -- Conclusion Stated] .... p. 5
   4.2 [Finding 2 Heading -- Conclusion Stated] .... p. 7
   4.3 [Finding 3 Heading -- Conclusion Stated] .... p. 9
5. Recommendations ................................. p. 11
6. Limitations ..................................... p. 12
Appendix A: [Title] ................................ p. 13
Appendix B: [Title] ................................ p. 16
Appendix C: [Title] ................................ p. 18

---

═══════════════════════════════════════════════════════════════
EXECUTIVE SUMMARY (Page 1 after cover, 150-350 words)
═══════════════════════════════════════════════════════════════

[Sentence 1 -- Lede: Most important finding with magnitude and
comparison benchmark]

[Sentences 2-4 -- Supporting findings, each with a number and
brief context]

[Sentence 5 -- Primary recommendation stated as a specific
action, not a direction]

[Sentence 6 -- Key limitation that affects interpretation]

QUICK REFERENCE: Key Metrics at a Glance

| Metric         | Current Value | Prior Period | vs. Target | Trend |
|----------------|--------------|--------------|------------|-------|
| [Metric name]  | [Value]      | [Value]      | [+/- %]    | [↑↓→] |
| [Metric name]  | [Value]      | [Value]      | [+/- %]    | [↑↓→] |
| [Metric name]  | [Value]      | [Value]      | [+/- %]    | [↑↓→] |
| [Metric name]  | [Value]      | [Value]      | [+/- %]    | [↑↓→] |

---

═══════════════════════════════════════════════════════════════
BACKGROUND AND CONTEXT (Architecture B and C only, 0.5-2 pages)
═══════════════════════════════════════════════════════════════

- Business context: What environment or situation prompted this analysis?
- Analytical questions: What specific questions does this report answer?
  1. [Question 1]
  2. [Question 2]
  3. [Question 3]
- Prior baselines: What did prior periods or benchmarks show?
- Scope boundaries: What is explicitly out of scope?

---

═══════════════════════════════════════════════════════════════
METHODOLOGY NOTE
═══════════════════════════════════════════════════════════════

| Element              | Detail                                        |
|----------------------|-----------------------------------------------|
| Data Source(s)       | [System name, table/report name, export date] |
| Analysis Period      | [Start date] to [End date]                    |
| Universe Definition  | [Who or what was measured, inclusion/         |
|                      | exclusion criteria]                           |
| Sample Size          | [N = number of records/observations]          |
| Key Metric           | [Metric name]: [Precise definition]           |
| Definitions          | [Metric name]: [Precise definition]           |
| Analysis Tools       | [Tools used: Excel, Python, R, Tableau, etc.] |
| Data Transformations | [Outlier handling, normalization, currency    |
|                      | conversion, date adjustments]                 |
| Changes from Prior   | [Any changes in definition, source, or        |
| Period               | method vs. the previous edition]              |
| Key Assumptions      | [Assumptions that affect interpretation]      |
| Limitations          | [What this analysis cannot answer]            |

---

═══════════════════════════════════════════════════════════════
FINDINGS SECTION
(Repeat the block below for each finding)
═══════════════════════════════════════════════════════════════

### Finding [N]: [CONCLUSION STATED AS DECLARATIVE SENTENCE
                  -- Include the metric, direction, and magnitude]

---

**ILLUSTRATION**

Chart Type: [Bar / Line / Scatter / Heatmap / Waterfall / etc.]
Chart Title: [Descriptive title that matches the finding heading]

[Chart placeholder: describe axes, series, and key visual
annotation]

- X-axis: [Field name and unit]
- Y-axis: [Field name and unit]
- Series: [What each color/line represents]
- Reference lines: [Targets, baselines, industry benchmarks shown]
- Annotations: [Specific data points called out on the chart]

---

**INTERPRETATION**

[Sentence 1: What does the chart show in plain language?]
[Sentence 2: What explains the pattern, based on the data?]
[Sentence 3: How does this compare to a target, prior period,
or external benchmark?]
[Sentence 4 (if needed): What is the magnitude of the effect
in business terms?]

---

**SUPPORTING DATA TABLE** (summary only; full table in Appendix A-[N])

| [Dimension]   | [Metric 1]  | [Metric 2]  | [Change]    |
|---------------|-------------|-------------|-------------|
| [Category 1]  | [Value]     | [Value]     | [+/- %]     |
| [Category 2]  | [Value]     | [Value]     | [+/- %]     |
| [Category 3]  | [Value]     | [Value]     | [+/- %]     |
| **TOTAL**     | **[Value]** | **[Value]** | **[+/- %]** |

*Full data table: Appendix A-[N], p. [##]*

---

**IMPLICATION**

[One sentence that connects this finding to a specific decision,
risk, or opportunity. Must reference a named decision-maker or
action.]

═══════════════════════════════════════════════════════════════

---

═══════════════════════════════════════════════════════════════
RECOMMENDATIONS
═══════════════════════════════════════════════════════════════

| # | Recommendation           | Expected Impact     | Timeline  | Owner              | Finding Ref |
|---|--------------------------|---------------------|-----------|--------------------|-------------|
| 1 | [Specific action verb +  | [Measurable outcome | [Q# YYYY  | [Named role or     | Finding [N] |
|   | specific object +        | with number]        | or Month  | team]              |             |
|   | specific target]         |                     | YYYY]     |                    |             |
| 2 | [...]                    | [...]               | [...]     | [...]              | [...]       |
| 3 | [...]                    | [...]               | [...]     | [...]              | [...]       |

Prioritization note: [Brief explanation of why Recommendation 1
is prioritized above others, if not obvious]

---

═══════════════════════════════════════════════════════════════
APPENDIX STRUCTURE
═══════════════════════════════════════════════════════════════

Appendix A: Detailed Data Tables
  A-1: [Table title] -- supports Finding 1, p. [##]
  A-2: [Table title] -- supports Finding 2, p. [##]

Appendix B: Additional Charts
  B-1: [Chart title] -- supports Finding [N], p. [##]
  B-2: [Chart title] -- context / validation, p. [##]

Appendix C: Methodology Details
  C-1: Data dictionary (all fields used in analysis)
  C-2: [Query code / survey instrument / sampling frame]
  C-3: [Statistical tests or model specifications]

Appendix D: Glossary
  [Term]: [Definition]
  [Term]: [Definition]

---

═══════════════════════════════════════════════════════════════
PAGE LAYOUT STANDARDS
═══════════════════════════════════════════════════════════════

| Element           | Standard                                         |
|-------------------|--------------------------------------------------|
| Margins           | 1 inch all sides (standard) /                    |
|                   | 1.25 in for annotated board packets              |
| Body font         | 11pt Calibri or Georgia, 1.15 line spacing       |
| H1 (section)      | 14pt bold, same family as body, 18pt space above |
| H2 (subsection)   | 12pt bold, 12pt space above                      |
| H3 (sub-sub)      | 11pt bold italic, 6pt space above                |
| Primary chart     | Full text width (6-6.5 inches)                   |
| Secondary chart   | Half width (3 inches), paired side-by-side       |
| Minimum chart     | 2.5 inches wide                                  |
| Table style       | Bold shaded header row (#f2f2f2), alternating    |
|                   | white/#fafafa rows, right-aligned numeric cols   |
| Color -- positive | [Defined green, e.g., #2e7d32]                   |
| Color -- negative | [Defined red, e.g., #c62828]                     |
| Color -- neutral  | [Gray, e.g., #757575]                            |
| Color -- accent   | [Brand or report accent color]                   |
| Page numbers      | Bottom center, starting p. 2, format: "Page N"   |
| Footer            | Report title | Date | Confidentiality level      |
```

---

## Rules

1. **Finding headings must always state conclusions, never topics.** "Customer Churn Rose 23% Following the July Price Increase" is a finding. "Customer Churn Analysis" is a topic. This is the single most common failure in business report writing. Enforce this without exception.

2. **Every chart in the main body must be followed immediately by an interpretation paragraph.** A chart that appears alone, without prose interpretation, transfers the analytical burden to the reader. The reader will either skip it or draw the wrong conclusion. No exceptions. If a chart needs no interpretation, it does not belong in the main body.

3. **The executive summary must be able to stand alone.** Test it by imagining the reader discards every other page. They should be able to understand the top finding, supporting findings, primary recommendation, and key limitation. If they need to flip to page 5 to understand the executive summary, the summary is incomplete.

4. **Every recommendation must have a measurable outcome, a deadline, and a named owner.** "Improve customer onboarding" fails all three criteria. "Reduce onboarding completion time from 5 days to 2 days by Q2 2026, owned by the Customer Success Operations Manager" passes all three. Vague recommendations erode trust in the entire report.

5. **Main-body tables must not exceed 12 rows.** Tables larger than 12 rows in the main body interrupt reading flow and cannot be meaningfully absorbed. Summarize to the 10-12 most important rows and move the full dataset to Appendix A, with a cross-reference.

6. **Separate findings from methodology completely.** Never explain how you analyzed the data in the same section as the results. This forces the reader to simultaneously evaluate the method and the finding -- a cognitive overload that undermines confidence in both. Methodology goes in a dedicated section before findings (or after recommendations in executive briefs).

7. **All numbers in the executive summary must exactly match the corresponding numbers in the findings sections.** Rounding or summarization discrepancies between the executive summary and the detailed findings section destroy credibility. If the finding section says 23.4%, the executive summary cannot say "approximately 25%."

8. **Every methodology note must include at least one explicit limitation.** An analysis without stated limitations signals either overconfidence or concealment -- both reduce trust. State what the analysis cannot answer, what data was missing or estimated, and how those gaps affect the reliability of specific findings.

9. **Use consistent color conventions for positive and negative performance throughout the entire report.** If green means above target in Chart 1, green must mean above target in Charts 2, 3, and 4. Mixed conventions force readers to re-read the legend for every chart, and they will often not bother.

10. **For recurring reports, freeze the section order, chart positions, and metric definitions between editions.** Changing the structure, chart type, or metric definition between Monthly Report Issue 6 and Issue 7 makes period-over-period comparison impossible and suggests the analyst is obscuring an unfavorable comparison. Any necessary changes must be disclosed explicitly ("Note: This edition uses updated attribution methodology; prior periods have been restated accordingly").

11. **Never embed a chart smaller than 2.5 inches wide in the main body.** At widths below 2.5 inches, axis labels become unreadable, data point annotations disappear, and trend lines become ambiguous. Scale up or move to the appendix.

12. **Appendix items must always be referenced at least once from the main body with a page number.** An unreferenced appendix item will never be read. Every appendix table and chart must be tied to a specific finding via an inline citation ("see Appendix A-2, p. 14").

---

## Edge Cases

### Recurring Report That Needs to Show Change Over Time

Fixed templates are the backbone of recurring reports -- they allow readers to build mental models that accelerate comprehension over repeated editions.

- Lock the section headings, chart positions, and axis scales between editions. Do not redesign the report because the data looks different this period.
- Add a "Period-Over-Period Highlights" callout box at the top of each finding section, formatted consistently each edition. It should contain exactly three elements: the current period value, the prior period value, and the change expressed as both absolute and percentage.
- Include a 6-12 period trend chart for each key metric in the appendix, even if it does not appear in the main body. Trend charts reveal seasonality and structural shifts that single-period comparisons miss.
- If you must change a metric definition, chart type, or data source between editions, add a "Methodology Change Notice" box in the methodology section with the old definition, the new definition, and whether prior periods have been restated. Readers who miss this notice will draw wrong conclusions from the period-over-period comparison.

---

### Report Based on Incomplete or Low-Quality Data

Incomplete data is not a reason to withhold a report -- it is a reason to disclose carefully.

- Add a "Data Completeness Assessment" table before the findings section. For each key metric, report: the total records expected, the records available, the completeness percentage, how missing records were handled (excluded, imputed with mean/median/forward fill, or flagged), and how this affects each finding.
- Findings based on less than 80% complete data should carry an explicit reliability flag in the finding heading: "Finding 2: Lead Quality Appears to Decline in Q3 [NOTE: Based on 68% complete records -- interpret with caution]."
- Imputation methods must be disclosed in the methodology note with enough detail that the reader could apply the same method. "Missing values excluded" is acceptable. "Missing values replaced with the segment average without disclosure" is not.
- If a finding's reliability is severely compromised by data gaps, demote it from the main body to the appendix and replace it with a "Pending Finding" notice that explains what data would be needed to complete the analysis.

---

### Mixed Audience (Executives and Analysts Reading the Same Document)

This is the most common structural challenge in business reporting. The solution is layered architecture, not compromise.

- Divide the document explicitly into two layers using clear visual breaks or section labels. Layer 1 (pages 1-3): Executive Summary, Key Findings, and Recommendations -- designed for reading speed, with one chart per page maximum and no inline statistical notation. Layer 2 (pages 4+): Detailed Findings, Full Methodology, Supporting Charts -- designed for verification and extension, with full data tables and analytical depth.
- Consider adding a "Reading Guide" box on the cover or first page: "Executives: Pages 1-3 contain the full story. Analysts: Pages 4-12 contain the supporting detail."
- Do not use executive-layer pages to introduce findings that are not in the executive summary. The two layers must be consistent -- the detailed layer amplifies the executive layer, it does not contradict or supplement it with additional conclusions.

---

### Report Has Only One Finding

A one-finding report can still be rigorous and credible if the single finding is analyzed in depth.

- Expand the single finding into a multi-layered structure: (a) the primary result, (b) segmentation analysis (does the finding hold across all subgroups or is it concentrated in a specific segment?), (c) time series (is this a new pattern or a longstanding trend?), (d) correlation with potential drivers (what factors move with this metric?), (e) alternative explanations (what else could explain the observed pattern and why is the proposed explanation more compelling?).
- A one-finding report should be 3-5 pages minimum to demonstrate analytical rigor. A single paragraph finding with one chart signals insufficient analysis, not efficient communication.
- The recommendations section for a one-finding report should still have 2-3 distinct recommended actions, since a single finding typically has implications across multiple operational domains.

---

### Report Accompanies a Presentation

When the report serves as a leave-behind for a meeting, its purpose changes slightly -- it must be comprehensible without the spoken presentation.

- Add a "Presentation Notes" text box below each finding that captures the 2-3 key points the presenter made verbally. Without this, attendees who missed the meeting, or who review the document weeks later, lose the narrative context that made the findings compelling in the room.
- Ensure that every chart in the report is fully labeled and interpretable without narration. Charts that depend on color meaning explained verbally, or on a comparison only visible in an animated slide sequence, must be redesigned for the document format.
- The executive summary must be more complete in a leave-behind report than in a standalone report, because it is the only section most recipients will read after the meeting.

---

### Report Contains Statistical Analysis or Modeling Output

Reports that include regression results, significance tests, or model outputs require additional conventions to remain accessible to non-technical executives.

- Never present raw statistical output (coefficient tables, p-value listings, confusion matrices) in the main body. Translate every statistical result into a business-language statement in the finding heading and interpretation paragraph. Move the raw output to Appendix C.
- For significance tests, state the practical implication first: "The difference between Group A and Group B is unlikely to be due to random variation (p < 0.05, n = 4,200)." Never lead with "p = 0.03" to a non-statistical audience.
- Include a "Statistical Methods" note in the methodology section that names the test or model used, states the significance threshold applied (typically α = 0.05), and explains in one sentence what the test is designed to determine.
- For predictive models, always include a model performance summary in the methodology note: the training/validation split, the evaluation metric used (RMSE, AUC, accuracy), and the baseline comparison (what a naive model would score). A model that achieves 70% accuracy sounds impressive until the baseline is 68%.

---

### Confidential Report Distributed Electronically

Reports marked Confidential or Restricted require additional structure to prevent unauthorized distribution or accidental sharing.

- Add a confidentiality notice on the cover page, the footer of every page, and the first paragraph of the executive summary. The notice should specify the intended audience, the prohibition on distribution, and a contact for questions about authorization.
- If the report contains personally identifiable information (PII), aggregate all tables to group sizes of at least 10-15 individuals to prevent re-identification. Never include individual-level data in a widely distributed report.
- Number each physical copy (Copy 1 of 5, Copy 2 of 5) if the report is printed and handed out to a specific set of named recipients. Digital PDFs should include recipient name and date in the document metadata.

---

## Example

**Input:** "I need to format a quarterly marketing performance report. We track website traffic, lead generation, conversion rate, and cost per lead. The audience is the CMO and marketing directors. It's a recurring quarterly report."

---

**Routing decision:** Architecture A -- Executive Brief. Audience is C-suite and senior management. Recurring quarterly. Four key metrics align well with 4 findings. Target: 5-7 pages.

---

```
═══════════════════════════════════════════════════════════════
REPORT METADATA
═══════════════════════════════════════════════════════════════

| Element            | Value                                          |
|--------------------|------------------------------------------------|
| Report Title       | Q3 2025 Marketing Performance Report           |
| Report Type        | Recurring Quarterly Review                     |
| Architecture       | A -- Executive Brief                           |
| Primary Audience   | CMO -- budget allocation and strategy approval |
| Secondary Audience | Marketing Directors -- channel and campaign    |
|                    | execution decisions                            |
| Author             | Marketing Analytics, [Analyst Name]            |
| Report Date        | October 15, 2025                               |
| Data Period        | July 1 -- September 30, 2025                   |
| Confidentiality    | Internal                                       |
| Distribution       | PDF via email to named recipients              |
| Version            | v1.0                                           |

═══════════════════════════════════════════════════════════════
COVER PAGE
═══════════════════════════════════════════════════════════════

Q3 2025 Marketing Performance Report
July -- September 2025

Prepared by: Marketing Analytics
Issued: October 15, 2025

INTERNAL USE ONLY -- Do not distribute outside the Marketing
leadership team without CMO approval.

═══════════════════════════════════════════════════════════════
EXECUTIVE SUMMARY (Page 2, 218 words)
═══════════════════════════════════════════════════════════════

Q3 2025 was the strongest marketing quarter in eight periods,
with lead generation exceeding target by 18% (1,245 vs. 1,050)
while cost per lead fell to a record low of $38, down 16% from
Q2's $45. Website traffic grew 12% quarter-over-quarter to
148,000 sessions, driven predominantly by organic search, which
now accounts for 54% of all sessions compared to 41% one year
ago. Conversion rate reached 4.2%, above both the Q2 result of
3.1% and the sector median of 3.5%.

The improvement is attributable to two Q2 investments: the
landing page redesign (correlated with a 30% reduction in
bounce rate from paid traffic) and the content marketing
expansion (correlated with the 13-percentage-point shift toward
organic search). Both investments are now operating above
projected ROI thresholds.

The primary recommendation is to reallocate 20% of the paid
search budget to content marketing in Q4. Organic search
currently delivers leads at $22 per lead compared to $56 for
paid search -- a 61% cost advantage -- and organic traffic
scales without a proportional increase in spend.

One limitation: all attribution uses a last-touch model, which
systematically undervalues organic content that initiates the
funnel. True organic channel ROI is likely higher than
reported.

QUICK REFERENCE: Key Metrics at a Glance

| Metric           | Q3 2025 | Q2 2025  | Q3 Target | vs. Target | Trend |
|------------------|---------|----------|-----------|------------|-------|
| Website Sessions | 148,000 | 132,000  | 140,000   | +5.7%      | ↑     |
| Leads Generated  | 1,245   | 1,031    | 1,050     | +18.6%     | ↑     |
| Conversion Rate  | 4.2%    | 3.1%     | 3.5%      | +0.7pp     | ↑     |
| Cost Per Lead    | $38     | $45      | $44       | +13.6%     | ↑     |

[Note: Cost Per Lead "vs. Target" shown as improvement vs.
target ceiling -- a lower CPL is a positive result]

═══════════════════════════════════════════════════════════════
FINDING 1: Organic Search Overtook Paid as the Dominant
           Traffic Channel, Growing from 41% to 54% of Sessions
═══════════════════════════════════════════════════════════════

ILLUSTRATION

Chart Type: 100% stacked bar chart, one bar per quarter for the
past 5 quarters (Q3 2024 through Q3 2025)
Title: "Channel Mix Shift: Organic Search Now Majority of
Traffic"

- X-axis: Quarter (Q3 2024, Q4 2024, Q1 2025, Q2 2025, Q3 2025)
- Y-axis: Percentage of sessions (0-100%)
- Series: Organic Search (green), Paid Search (blue),
  Direct (gray), Referral (light gray), Social (purple)
- Annotation: Arrow pointing to Q3 2025 Organic bar with label
  "54% -- record high"
- Reference line: Dashed line at 50% labeled "Majority
  threshold"

INTERPRETATION

Organic search grew from 41% of sessions in Q3 2024 to 54% in
Q3 2025, the first quarter in which organic has been the
majority traffic source. Paid search correspondingly declined
from 39% to 27% of sessions over the same period, while
absolute paid search volume held steady at approximately 40,000
sessions, meaning the mix shift reflects organic growth rather
than paid reduction. The shift accelerated in Q3 2025 and
closely follows the Q2 content marketing expansion, which
added 48 new long-form articles targeting high-intent search
terms. At current session volumes, the 13-percentage-point
organic channel shift represents approximately 19,000 sessions
per quarter arriving at a $22 cost per lead versus $56 for
paid, a channel value difference of approximately $644,000
annualized.

SUPPORTING DATA TABLE (Full table: Appendix A-1, p. 9)

| Channel        | Q3 2024  | Q2 2025  | Q3 2025  | YoY Change |
|----------------|----------|----------|----------|------------|
| Organic Search | 52,500   | 71,100   | 79,900   | +52.2%     |
| Paid Search    | 50,000   | 38,900   | 40,000   | -20.0%     |
| Direct         | 18,000   | 13,200   | 14,800   | -17.8%     |
| Referral       | 7,500    | 6,600    | 8,100    | +8.0%      |
| Social         | 0        | 2,200    | 5,200    | n/a        |
| **Total**      | **128,000** | **132,000** | **148,000** | **+15.6%** |

*Full 8-quarter channel data: Appendix A-1, p. 9*

IMPLICATION

The CMO should treat the organic/paid crossover as a structural
inflection point rather than a quarterly anomaly. The Q4
budget decision -- whether to extend paid search contracts at
current levels or reallocate to content -- will determine
whether this channel mix becomes the new operating baseline
or reverts under budget pressure.

═══════════════════════════════════════════════════════════════
FINDING 2: Lead Generation Exceeded Q3 Target by 18.6% With
           Accelerating Month-Over-Month Growth
═══════════════════════════════════════════════════════════════

ILLUSTRATION

Chart Type: Clustered bar chart with target line overlay
Title: "Monthly Lead Generation vs. Target, Q3 2025"

- X-axis: Month (July, August, September)
- Y-axis: Leads generated (0 to 550)
- Series: Monthly leads (green bars), monthly target (dashed
  horizontal line at 350)
- Annotation: Each bar labeled with actual value and % vs.
  target; September bar annotated "Best month on record"

INTERPRETATION

Lead generation totaled 1,245 in Q3 against a target of 1,050,
an 18.6% positive variance. The trajectory was positively
accelerating: July ran 8.6% above target, August 16.3%, and
September 30.9% -- a pattern consistent with organic content
assets that compound in search ranking over time rather than
campaign-driven leads that spike and revert. September's 458
leads is the highest single-month total in the past 12 months.
The Q3 result compares favorably to Q3 2024 (842 leads), a
47.9% year-over-year improvement.

SUPPORTING DATA TABLE (Full table: Appendix A-2, p. 10)

| Period        | Leads   | Target  | vs. Target | YoY Change |
|---------------|---------|---------|------------|------------|
| July 2025     | 380     | 350     | +8.6%      | +39.7%     |
| August 2025   | 407     | 350     | +16.3%     | +44.3%     |
| September 2025| 458     | 350     | +30.9%     | +58.6%     |
| **Q3 2025**   | **1,245**| **1,050**| **+18.6%** | **+47.9%** |
| Q3 2024 (ref) | 842     | 900     | -6.4%      | --         |

*Full 12-month lead data by channel: Appendix A-2, p. 10*

IMPLICATION

Current lead generation capacity demonstrably exceeds the Q3
target. Marketing Directors should evaluate whether the Q4
target of 1,100 (set in the annual plan) reflects current
capability, or whether it should be revised upward to 1,300-
1,400 to align with demonstrated performance and the continued
scaling of organic content.

═══════════════════════════════════════════════════════════════
FINDING 3: Conversion Rate Reached 4.2%, Exceeding Target and
           Sector Median, Driven by Landing Page Redesign
═══════════════════════════════════════════════════════════════

ILLUSTRATION

Chart Type: Line chart with two reference lines
Title: "Quarterly Conversion Rate Trend, Q1 2024 -- Q3 2025"

- X-axis: Quarter (Q1 2024 through Q3 2025, 7 quarters)
- Y-axis: Conversion rate, percentage (0% to 5%)
- Series: Actual conversion rate (solid blue line)
- Reference lines: Q3 target at 3.5% (dashed gray),
  sector median at 3.5% (dashed orange, labeled)
- Annotation: Q2 2025 point labeled "Landing page launch";
  Q3 2025 point labeled "4.2% -- record high"

INTERPRETATION

Conversion rate in Q3 2025 was 4.2%, up from 3.1% in Q2 and
above both the quarterly target of 3.5% and the industry
sector median of 3.5%. The 1.1 percentage point improvement
from Q2 to Q3 is the largest single-quarter gain in seven
quarters and follows the landing page redesign deployed in
early July. In absolute terms, the conversion rate improvement
generated approximately 140 additional leads beyond what Q2's
3.1% rate would have produced on the same session volume --
equivalent to approximately $5,320 in avoided cost at the
current $38 CPL.

IMPLICATION

The landing page redesign has produced a measurable and
statistically meaningful conversion improvement. The Digital
Marketing Director should assess whether the redesign
principles (simplified form, social proof placement, mobile
optimization) should be extended to the 12 secondary landing
pages that still use the prior template.

═══════════════════════════════════════════════════════════════
FINDING 4: Cost Per Lead Fell to a Record Low of $38,
           Driven by the Channel Mix Shift Toward Organic
═══════════════════════════════════════════════════════════════

ILLUSTRATION

Chart Type: Bar chart with trend line overlay
Title: "Cost Per Lead by Channel and Blended Average, Q3 2025"

- X-axis: Channel (Organic Search, Paid Search, Direct,
  Referral, Social, Blended)
- Y-axis: Cost per lead in dollars ($0 to $70)
- Bars: CPL for each channel (color-coded by channel)
- Reference line: Prior quarter blended CPL of $45
  (dashed gray)
- Annotation: Blended bar labeled "$38 -- Q3 record low"

INTERPRETATION

The blended cost per lead fell from $45 in Q2 to $38 in Q3, a
16% reduction and the lowest quarterly result in three years.
The primary driver is the channel mix shift: organic search,
which generates leads at $22 per lead, now accounts for 54%
of sessions compared to 41% one year ago. Paid search costs
$56 per lead and its session share declined from 39% to 27%
over the same period. The channel-weighted CPL improvement --
not a reduction in campaign costs -- is the mechanism. Total
marketing spend was within 2% of the prior quarter, confirming
that the improvement reflects efficiency, not underinvestment.

SUPPORTING DATA TABLE (Full table: Appendix A-3, p. 11)

| Channel        | Q3 CPL  | Q2 CPL  | Change | Session Share |
|----------------|---------|---------|--------|---------------|
| Organic Search | $22
