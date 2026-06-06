---
name: executive-summary
description: |
  Distills longer documents into one-page executive summaries with key findings,
  recommendations, and decision-ready formatting for senior leadership. Use when
  the user needs to summarize a report, proposal, or analysis for executive review.
  Do NOT use for full business reports (use `business-report`), stakeholder updates
  (use `stakeholder-update`), or meeting notes (use `meeting-notes`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "report writing business-writing"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Executive Summary Writing

## When to Use

Use this skill when the user needs to distill a longer document into a concise, decision-ready summary for senior leadership. Specific trigger scenarios include:

- A user has completed a report, analysis, proposal, or research document and needs a one-page version for executives who will not read the full document
- A user is presenting findings to a C-suite audience (CEO, CFO, COO, board members) and needs the core message formatted for rapid scanning and immediate decision-making
- A user needs to get approval, sign-off, or resource commitment from a senior leader and must frame the ask around evidence from a longer document
- A user is preparing a board packet where each item gets a single-page summary before the full appendix
- A user has received a long vendor proposal, audit report, or consultant deliverable and needs to relay the essential findings upward without forwarding the full document
- A user needs to frame a complex technical, financial, or operational analysis for a non-specialist executive audience
- A user needs a summary that travels without its source -- circulated over email or in a meeting deck where the full report is not attached

**Do NOT use** in these situations -- use the referenced skill instead:

- The user wants to write the full report itself -- use `business-report`
- The user wants to update stakeholders on project progress rather than summarize a completed analysis -- use `stakeholder-update`
- The user wants to capture what happened in a meeting, not summarize a document -- use `meeting-notes`
- The user wants an internal memo communicating a policy or decision -- use `business-memo`
- The user wants a pitch document for investors or clients -- use `pitch-deck` or `proposal-writing`
- The user needs a brief for a government or policy audience with specific legislative format requirements -- use `policy-brief`
- The user needs a press release or public-facing summary -- use `press-release`
- The user is summarizing a legal contract or agreement -- use `contract-summary`

---

## Process

### Step 1: Gather the source material and decision context

Before writing a single word, establish the full context. An executive summary written without knowing its audience and purpose is just a shorter document -- not a decision tool.

- Ask for the source document or a detailed description of its contents. If the user cannot provide the full document, ask for: the document type, its central finding or recommendation, the key supporting data points, and any risks or caveats mentioned.
- Identify the primary reader by name and role if possible. A summary for a CFO emphasizes unit economics, cash flow impact, and financial risk. A summary for a COO emphasizes operational capacity, process change, and implementation timeline. A summary for a CEO emphasizes strategic fit, competitive implication, and resource commitment.
- Establish the decision the reader must make or the action they are being asked to take. If the user cannot name a specific decision, the source document may not be ready to summarize -- surface this.
- Clarify whether the summary is standalone or will accompany the full document. Standalone summaries must include slightly more context. Attached summaries can reference the full document for detail.
- Ask about length constraints and format. Default is 300-500 words on a single page. Some organizations have specific templates (board templates often require exactly one page with defined sections). Confirm before drafting.
- Ask whether the summary needs to reflect a single author's voice, a team's voice, or an organization's voice. This affects whether recommendations use "I recommend," "We recommend," or "The analysis recommends."

### Step 2: Identify the governing idea -- the one sentence that controls everything

Every executive summary is organized around a single governing idea. This is not the topic of the document. It is the document's central claim -- the thing that is true, important, and actionable.

- Extract the governing idea from the source document's conclusions or recommendations section, not from its introduction. Introductions state the topic; conclusions state the finding.
- Test the governing idea against three criteria: Is it specific enough to act on? Does it have evidence behind it? Does it resolve the decision the executive faces? If no to any, refine it.
- A strong governing idea is a complete declarative sentence with a subject, verb, and specific claim. "Sales performance was mixed" fails -- it is a topic. "Enterprise growth at 28% offset SMB decline at 12%, and reallocating resources will accelerate the stronger segment" succeeds -- it is a claim with direction.
- If the source document has multiple competing conclusions of equal weight, identify the primary recommendation and note the tension. The summary must take a position even when the source is ambiguous.
- Write this governing idea before writing anything else. Every section of the summary exists to support or contextualize it.

### Step 3: Select and rank the supporting evidence

Executives are not persuaded by volume of evidence -- they are persuaded by the right evidence. More data is not more convincing.

- Identify the 3-5 most persuasive data points from the source document. Prioritize: quantitative findings with specific numbers, year-over-year or period-over-period comparisons, findings that directly substantiate the governing idea, and evidence of risk or consequence if no action is taken.
- Actively exclude data that is interesting but not decision-relevant. A 47-page financial analysis may contain 80 data points; 4-6 belong in the executive summary.
- For each supporting point, check that it passes the "so what" test: does it directly support the governing idea or the recommended action? If the connection requires explanation, the data point is likely too granular for the summary.
- Replace qualitative characterizations with specific numbers wherever the source provides them. "Significant increase" becomes "37% increase." "Most customers" becomes "68% of customers." "Recent quarters" becomes "Q2 and Q3 2025."
- Order supporting evidence by impact magnitude -- most consequential first. Do not order chronologically or by how it appears in the source document.
- If the source document contains forecasts or projections, distinguish them clearly from actuals. "Revenue reached $4.2M" is different from "Revenue is projected to reach $4.2M." Conflating the two destroys credibility.

### Step 4: Characterize the risks and constraints accurately

The single fastest way to lose executive trust in a summary is to omit known risks or present conclusions with false certainty. Executives who discover uncaveated risks in the details after approving a recommendation do not trust the next summary.

- Identify every material risk, assumption, or limitation in the source document. A risk is material if it would change the executive's decision or significantly affect implementation.
- Quantify risks when possible. "SMB pipeline will fall from 1.2x to 0.8x coverage" is more credible than "SMB may be affected."
- Distinguish between risks the organization controls (resourcing, process) and risks it does not (market conditions, regulatory change, competitor action).
- Note data quality issues if the source document's conclusions rest on limited data, older data, or estimates rather than actuals.
- Frame risks as information, not hedging. "This recommendation accepts a 6-month period of reduced SMB capacity while enterprise investment matures" is decision-enabling. "There may be some risks" is noise.
- If the source document acknowledges a viable alternative approach that was rejected, note it in one sentence with the reason it was not selected. This demonstrates rigor.

### Step 5: Draft using the Inverted Pyramid structure

Executive summaries follow the inverted pyramid -- the most important information comes first, detail follows, and the least critical material sits at the end. This is the opposite of academic writing, where conclusions come last.

- **Sentence 1:** The governing idea. State the central finding or recommendation. This sentence must stand alone -- if the executive reads nothing else, they have the core message.
- **Lines 2-4 (Background):** The minimum context the executive needs to evaluate the finding. Not the full background of the project. Not the methodology. Only what a busy person needs to understand why the finding matters.
- **Bullet section (Evidence):** 3-5 specific, quantified data points. Each bullet is one line. Lead each with a bolded label and a number.
- **Paragraph (Risks):** 2-4 sentences. Specific, quantified where possible. Written as decision-relevant information.
- **Final section (Recommended Action):** A direct, active-voice statement of what the reader should do, approve, or decide -- and by when.
- Write at a reading level appropriate for the audience. Most executive summaries target Grade 12-14 reading level. Use short sentences (average 18 words or fewer). Avoid jargon unless the reader uses it themselves. Spell out acronyms on first use even if they appear in the source document.

### Step 6: Pressure-test with the BLUF and the 30-second read tests

Before finalizing, apply two diagnostic tests that mirror how executives actually consume information.

- **BLUF test (Bottom Line Up Front):** Read only the first sentence. Does it contain the single most important thing the executive needs to know? If it contains background, context, or methodology, revise -- the governing idea has not been surfaced yet.
- **30-second read test:** Read the entire summary aloud at a natural pace. If it takes more than 45 seconds, cut. Target 300-400 words for most summaries; 500 words is the outer limit for complex, multi-part analyses.
- **Scan test:** Look at the summary with unfocused eyes, the way someone scans before committing to read. Can you identify the key finding, the 3-5 evidence bullets, and the recommended action without reading word-for-word? If the structure is not visible at a glance, add section labels or bold the critical terms.
- **Fidelity check:** Verify every number and claim against the source document. Summaries sometimes introduce rounding errors, misattributed statistics, or paraphrasing that subtly changes meaning. Numbers must be exact or explicitly noted as approximated.
- **Certainty calibration:** Match the summary's language of confidence to the source document's actual certainty. If the source says "suggests," the summary cannot say "proves." If the source presents a recommendation, the summary cannot soften it to "consideration."
- **Action clarity check:** The recommended action must name who does what by when. "Management should review options" fails. "The CFO should approve the $1.4M budget reallocation before the February board meeting" succeeds.

### Step 7: Format for the specific distribution context

A summary distributed in a board packet requires different formatting than one sent in an email body or used as a slide deck cover page.

- **Board packet:** Use formal section headers, full document title, date, and prepared-by line. Include a "For Decision" or "For Information" designator in the header. Margins should allow for annotation. Include document version number if iterating.
- **Email body:** Remove formal headers. Lead with the governing idea in the first line of the email. Use short paragraphs rather than formal section headers. Close with a clear call to action.
- **Slide deck (cover page or exec summary slide):** Compress to the governing idea plus 3 bullets. 250 words maximum. Section headers become bold inline labels. The recommended action becomes the slide's bottom-line text.
- **Standalone PDF:** Include full metadata (date, author, source document reference). Use a horizontal rule to separate the header from the body. Include a version number if the summary may be revised.
- Confirm with the user whether the summary will be formatted by them (in which case provide clean text) or should be formatted as final output (in which case apply full markdown formatting).

### Step 8: Iterate based on user feedback and source document gaps

The first draft surfaces gaps, ambiguities, and areas where the source document is stronger or weaker than expected.

- If the user says the summary misses a key point, ask whether that point appears in the source document. If yes, add it and remove something of lesser importance to maintain length. If no, note that it cannot appear in the summary -- it belongs in a separate communication.
- If the user wants to soften the recommendation, discuss whether the source document supports the softer framing. Executives trust summaries that match the source; a summary that hedges more than the source looks evasive.
- If the user wants to add context that makes the summary exceed 500 words, offer to restructure -- move context into a "Background" sub-section that can be skipped by readers who have it, rather than front-loading it.
- After final approval, offer to format the summary for its intended distribution channel if not already done.

---

## Output Format

Produce the executive summary in this structure. Adapt section headers for the audience context (board-level audiences may use "Board Summary" instead of "Executive Summary").

```
## Executive Summary: [Document Title]

**Prepared for:** [Name, Title] | **Date:** [Month Year]
**Source document:** [Full title, date, author/team]
**For:** [Decision / Information / Review] -- delete as applicable

---

[GOVERNING IDEA -- one complete sentence stating the central finding or recommendation.
Bold the most critical number or outcome within this sentence.]

### Background

[2-3 sentences maximum. State only what the reader needs to evaluate the finding:
the context of the analysis, the time period or scope, and why it matters now.
Exclude methodology, history before the relevant period, and organizational background
the executive already knows.]

### Key Findings

- **[Label]:** [Specific number or finding -- one line]
- **[Label]:** [Specific number or finding -- one line]
- **[Label]:** [Specific number or finding -- one line]
- **[Label]:** [Specific number or finding -- one line]
- **[Label]:** [Specific number or finding -- one line, optional]

### Risks and Constraints

[2-4 sentences. Name specific risks with quantification where available.
Identify which risks are controllable and which are external.
Note any material assumptions the recommendation rests on.]

### Recommended Action

[1-3 sentences. Active voice. Name who does what by when.
If multiple decisions are required, list them as numbered items, each one sentence.]

---
*Full report available upon request. [Contact / location if applicable.]*
```

**Word count target:** 300-400 words (500 words hard maximum)
**Reading level target:** Grade 12-14 (Flesch-Kincaid)
**Sentence length target:** 18 words average, 28 words maximum per sentence
**Bullets:** 3 minimum, 5 maximum, one data point per bullet

---

## Rules

1. **Lead with the conclusion, always.** The first sentence of the summary is the governing idea -- the central finding or recommendation. Never open with background, context, history, or methodology. Executives decide in the first sentence whether to keep reading; bury the finding and lose the audience.

2. **Never introduce information not present in the source document.** An executive summary synthesizes -- it does not editorialize, supplement, or speculate. If a relevant point is not in the source, flag it to the user as a gap rather than filling it independently. Any added interpretation must be clearly labeled as such.

3. **Every number must be exact or explicitly approximate.** Transfer figures from the source with precision: "$1.34M," "28% YoY," "Q3 2025." If rounding, state it: "approximately $1.3M." Never convert specifics into vague language ("strong growth," "most respondents," "significant savings") -- that language belongs in marketing copy, not decision documents.

4. **Match certainty language to source certainty.** If the source says the data "suggests" a trend, the summary cannot say the trend "demonstrates" it. The confidence level of the summary must not exceed the confidence level of the underlying analysis. Overclaiming destroys credibility when the executive reads the full document.

5. **Hard limit: 500 words.** The source document does the heavy lifting. An executive summary that requires 600+ words to work is a poorly structured document that needs a different format (use `business-report` or `stakeholder-update`). If the user insists on more length, move to a two-page briefing format with an explicit "For Reader Convenience" label and a clear hierarchy between summary and detail sections.

6. **Active voice for all recommendations.** "We recommend reallocating $400K" is credible and owns the position. "It is recommended that consideration be given to reallocation" is passive, evasive, and signals low confidence. Executives trust recommendations that are owned by a voice.

7. **Risks are mandatory, not optional.** A summary without a risk section signals either a one-sided analysis or a writer who is hiding the complications. Both destroy credibility. Even when the recommendation is highly confident, note the primary assumption it rests on and the most significant external risk.

8. **The recommended action must be specific.** Name the decision-maker, the action, and the deadline. "Leadership should consider next steps" is not a recommended action -- it is noise. "The CFO should approve the revised budget by March 15 to allow Q2 implementation" is a recommended action.

9. **Never use more than five evidence bullets.** Longer bullet lists force the reader to parse for relevance -- exactly the work the summary is supposed to spare them. If more than five data points seem essential, the summary is trying to do too much. Combine related points or move detail to a separate appendix.

10. **Structure for scanning, not reading.** Assume the executive will read the first sentence, scan the bullet labels, and read the recommended action -- in that order, in under 30 seconds. The summary must convey the governing idea and the ask through that scan path alone. Bold the key number in the governing idea. Label every bullet. Make the recommended action the last and most visually distinct block of text.

11. **Never use hedging language in the governing idea.** The governing idea sentence carries no qualifications, no conditionals, and no hedges ("may suggest," "could potentially," "appears to indicate"). Save qualifications for the Risks section, where they belong. A governing idea written in hedge language signals that the analysis has not reached a conclusion.

12. **Format to the distribution context before delivery.** A summary going into a board packet, an email, and a slide deck each require different formatting. Confirm distribution context before finalizing. Applying formal document headers to an email body creates friction; stripping headers from a board document violates governance norms.

---

## Edge Cases

### The source document has no clear conclusion or recommendation

Some documents -- particularly exploratory analyses, research syntheses, or first-draft reports -- present findings without resolving them into a recommendation. The executive summary cannot invent a conclusion.

- Surface this gap to the user: "The source document presents multiple findings but does not state a clear recommendation. To write an executive summary, I need either the recommendation you want the summary to support, or guidance on whether this should be framed as an informational summary."
- If the user confirms it is informational (for awareness rather than decision), reframe the governing idea as the most significant finding: "Q4 data reveals three converging trends that will require strategic response in H1 2025."
- Replace the "Recommended Action" section with a "Key Questions for Leadership" section listing 2-3 specific decisions the findings raise. This gives the executive a path forward without overstating the analysis.
- Flag to the user that an informational executive summary is less common in high-stakes contexts -- boards and senior executives typically expect a recommendation, not a briefing of open questions.

### The source document is a draft or contains incomplete data

Drafts circulate for review, and executives sometimes need to be briefed on incomplete analyses.

- Flag the draft status prominently in the header: add "[DRAFT -- For Review Only]" immediately below the document title. This must be visible before the reader reaches any findings.
- In the governing idea, qualify the status: "Based on preliminary data through Q3, the analysis suggests..." -- do not state conclusions as settled facts when the underlying data is incomplete.
- In the Risks section, explicitly name the missing data: "Final Q4 actuals are not yet available; conclusions may shift when full-year data is incorporated."
- Do not summarize sections of the source that are placeholders or clearly incomplete ("TBD," "to be updated," "[insert data here]"). Note that those sections are pending rather than attempting to summarize their eventual content.
- Recommend to the user that the summary carry a review date -- a deadline by which the draft will be replaced with a final version.

### The executive wants a summary of an existing executive summary

This happens when a C-suite member who received a one-page summary needs to relay the core message to a board chair, a journalist, or another principal in even less time.

- Produce a BLUF (Bottom Line Up Front) format: three items only.
  - **Finding:** The governing idea in one sentence.
  - **Evidence:** The single most critical number in one sentence.
  - **Action:** The recommended decision in one sentence.
- Total word count: 40-60 words. This is a verbal brief or email lede, not a document.
- Label it explicitly as a "3-Line Brief" or "BLUF Summary" so the reader understands it is a deliberate compression, not a truncated document.
- Note that this format carries no risks or caveats -- if the executive needs to communicate nuance, they must use the one-page summary.

### Multiple competing recommendations in the source document

Consulting reports, research syntheses, and strategy analyses sometimes present two or three viable options without selecting one. An executive summary must not pretend the document is more decisive than it is -- but it also must not simply list options.

- Structure the governing idea around the decision itself rather than the outcome: "The Q3 analysis identifies three growth paths -- organic expansion, strategic partnership, and geographic entry -- and recommends organic expansion based on current cash position and team capacity."
- If the source document does not recommend among options, the governing idea becomes the most important selection criterion: "The choice between organic expansion and strategic partnership turns on whether the company can sustain 18 months of negative operating cash flow."
- Present the options in the Key Findings section as a comparison structure: one bullet per option, each with its defining trade-off ("**Organic expansion:** Preserves equity, requires $3.2M cash over 18 months" / "**Strategic partnership:** Accelerates market entry by 12 months, dilutes ownership by 15-25%").
- Close with a Recommended Action only if the source document makes a recommendation. If it does not, close with the specific decision the executive must make and the deadline by which it must be made.

### Sensitive or politically charged findings

Some analyses produce findings that are uncomfortable for the executive audience -- underperformance against targets, leadership failures, unfavorable competitive positioning, or recommendations that require reversing a prior decision.

- Do not soften the finding in the governing idea. Executives deserve accurate summaries. Frame the finding factually and specifically: "Q3 new customer acquisition fell 31% below target, driven primarily by the mid-year sales reorganization."
- In the Risks section, distinguish between findings that reflect external conditions (market, economy, regulation) and findings that reflect internal execution. Executives need to understand which problems are controllable.
- If the summary will be presented verbally alongside the written document, note to the user that sensitive findings are best introduced with context before the document is circulated -- the written summary is not the place to manage the political dimension, but the presentation sequence matters.
- Do not use euphemism that misrepresents the finding's severity. "Challenging market conditions" as a substitute for "execution failures" is misleading. Keep the language precise.

### Source document is in a different language or uses heavy domain jargon

Technical reports (clinical trials, engineering assessments, legal analyses) and documents originally written in another language require an additional translation layer before summarization.

- When the source contains technical or regulatory jargon, define terms on first use within the summary only if the executive audience is not fluent in that domain. If the CEO has a clinical background, "QALY" does not need definition. If the CFO does not, it does.
- Confirm with the user the executive's domain fluency before making translation decisions. Wrong assumptions in either direction -- over-explaining to an expert or using jargon with a generalist -- damage the summary's credibility.
- For documents translated from another language, verify that numbers, dates, and proper names have been preserved exactly rather than paraphrased. Translation errors concentrate in these elements.
- If the source contains regulatory or legal language that cannot be responsibly simplified (safety thresholds, compliance requirements, contractual terms), quote the critical language exactly and briefly explain its operational implication.

### The user needs multiple executive summaries for the same source document going to different audiences

A single analysis may need to be summarized differently for a board of directors, a management team, and a partner organization -- each with different context, authority, and interest.

- Do not simply duplicate and relabel the summary. Identify what is different for each audience: what decisions they face, what context they already have, and what emphasis serves their role.
- A board summary emphasizes fiduciary implications, strategic alignment, and risk exposure -- typically at a higher level of abstraction with less operational detail.
- A management summary emphasizes implementation requirements, resource implications, and operational risk -- more granular, with more attention to execution timeline.
- A partner summary emphasizes mutual benefit, shared risk, and coordination requirements -- with careful framing of findings that might reveal proprietary strategy if read too closely.
- Produce each summary separately. Label each clearly with its intended audience in the header. Note to the user which sections differ between versions so they can maintain consistency as the underlying analysis evolves.

---

## Example

**Input from user:** "I need an executive summary of our annual cybersecurity risk assessment for the board. The assessment found that our biggest exposure is third-party vendor access -- we have 340 vendors with some form of system access and only 22% have completed our security questionnaire. We had two near-miss incidents last year traced to vendor credentials. We're recommending a mandatory vendor security certification program that would cost $280K to implement and reduce high-risk vendors by an estimated 60%. The board needs to approve the budget."

---

**Output:**

## Executive Summary: Annual Cybersecurity Risk Assessment

**Prepared for:** Board of Directors | **Date:** February 2026
**Source document:** 2025 Annual Cybersecurity Risk Assessment, Information Security Team, January 2026
**For:** Decision -- Budget Approval Required

---

**Third-party vendor access represents the company's highest-concentration cybersecurity risk: 340 vendors hold active system access, only 22% meet our security standards, and two credential-based near-miss incidents in 2025 demonstrate the exposure is not theoretical.** Approving a $280K vendor certification program will reduce high-risk vendor relationships by an estimated 60% and close the governance gap before a breach occurs.

### Background

The 2025 assessment evaluated all external parties with access to company systems, networks, or data. Vendor access has grown 40% over three years as the company expanded its SaaS stack and outsourced operational functions -- outpacing the growth of the security program that governs it. The two 2025 near-miss incidents were contained, but each required emergency response resources and exposed credential management gaps that remain unresolved.

### Key Findings

- **Vendor access scope:** 340 vendors hold active credentials or system access permissions -- up from 243 in 2022
- **Compliance gap:** Only 75 of 340 vendors (22%) have completed the company security questionnaire; 178 (52%) have never been assessed
- **Incident history:** 2 near-miss incidents in 2025 traced to compromised or improperly managed vendor credentials; estimated containment cost $94K
- **High-risk concentration:** 47 vendors classified as "high-risk" based on access level and non-compliance -- 14 have access to production financial or customer data
- **Program cost:** $280K implementation cost for mandatory certification program; estimated $1.1M avoided-cost value per incident prevented at current industry breach rates
- **Risk reduction:** Mandatory certification projected to reduce high-risk vendor count from 47 to 18-19 within 12 months

### Risks and Constraints

The 60% risk reduction estimate is based on vendor compliance modeling from comparable programs at peer organizations and is not guaranteed -- actual reduction depends on vendor responsiveness and willingness to complete certification requirements. Approximately 8-12 vendors may resist or fail certification, requiring contract renegotiation or termination; legal costs for those cases are not included in the $280K estimate. Cyber insurance renewal in Q3 2026 may be affected by current compliance gaps if the program is not approved; the carrier indicated in December that vendor governance was a renewal-review factor.

### Recommended Action

The board should approve the $280K cybersecurity vendor certification program budget at the February board meeting. The Chief Information Security Officer will initiate vendor outreach in March and complete high-risk vendor assessments by September 30, 2026, with a progress report to the board at the Q2 meeting.

---
*Full assessment, vendor classification methodology, and incident reports available from the CISO upon request.*
