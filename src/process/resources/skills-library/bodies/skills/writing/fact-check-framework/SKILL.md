---
name: fact-check-framework
description: |
  Provides a systematic framework for fact-checking written content by identifying claims, classifying their verifiability, flagging unsupported assertions, and recommending verification steps.
  Use when the user asks to fact-check a document, verify claims in writing, identify unsupported assertions, or assess the evidential basis of a piece.
  Do NOT use for citation formatting (use citation-reference), academic peer review (use academic-paper-review), or general editing (use copy-editing).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "editing writing research"
  category: "writing"
  subcategory: "editing-refinement"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Fact-Check Framework

## When to Use

**Use this skill when:**
- A user submits a document, article, blog post, white paper, or script and explicitly asks for fact-checking, claim verification, or assertion review
- A user wants to know which specific claims in their writing require citations or sourcing before publication
- A user suspects specific statements in their writing may be inaccurate, outdated, or overstated and wants systematic identification
- A user is editing someone else's work and needs an audit of evidential quality -- distinguishing what is solidly grounded from what is asserted without support
- A user is preparing content for a high-stakes context (journalism, litigation, policy advocacy, grant writing, or academic publishing) where false claims carry serious consequences
- A user wants to understand the difference between factual claims, interpretive claims, and opinion in a specific piece of writing so they can label or hedge appropriately
- A user has received a document from a third party and wants to evaluate its factual reliability before sharing or citing it

**Do NOT use this skill when:**
- The user wants citation formatting help -- e.g., converting bare URLs into APA or MLA format (use `citation-reference`)
- The user wants academic peer review of methodology, argument structure, or scholarly contribution (use `academic-paper-review`)
- The user wants general editing for clarity, style, or grammar (use `copy-editing`)
- The user wants proofreading for spelling and punctuation errors (use `proofreading`)
- The user wants help constructing an argument or finding supporting evidence for a position they are writing (use `research-support` or `argument-construction`)
- The user wants a bias or framing analysis rather than a factual accuracy audit -- these overlap but are distinct skills
- The user has submitted a creative fiction work for internal consistency checking -- this requires a different framework (use `continuity-review`)

---

## Process

### Step 1: Scope the Document and Define the Fact-Check Depth

Before extracting a single claim, establish what kind of fact-check the user needs. There are three operational levels:

- **Surface scan** -- Identify all verifiable claims, flag obvious concerns, and produce a prioritized list for the author to investigate. This is appropriate for long documents, first drafts, or when the user says "give me the highlights." It does not resolve any claims -- it creates an action list.
- **Deep audit** -- All claims are classified, all flagged claims receive specific verification guidance, and the evidential architecture of the document is evaluated. Appropriate for high-stakes or publication-ready documents.
- **Targeted check** -- The user has identified a specific passage, statistic, or claim they are worried about. Focus entirely on that element with maximum analytical depth.

If the user has not specified, ask one clarifying question: "Do you want a complete claim audit of the whole document, or would you like me to focus on the claims that look most vulnerable?"

Default to **deep audit** if the document is under 1,000 words; default to **surface scan** if the document is over 3,000 words unless the user specifies otherwise.

---

### Step 2: Extract and Number Every Factual Claim

Read the entire document and extract every statement that is, at minimum, potentially falsifiable. Use a literal, sentence-level extraction method -- do not paraphrase claims, as paraphrasing introduces distortion.

**Claim types to extract:**

- **Statistical claims** -- Any number, percentage, rate, ratio, ranking, count, or dollar figure. Example: "Mortality rates dropped by 22% between 2010 and 2020." Even well-known statistics are extractable because they may be outdated, misremembered, or taken out of context.
- **Causal claims** -- Any assertion that X causes, produces, drives, leads to, results in, or is responsible for Y. Example: "Sleep deprivation causes a 40% drop in cognitive performance." These require stronger evidence than correlational claims and must be flagged even when they sound intuitive.
- **Attributive claims** -- Any statement attributed to a named or unnamed person, organization, or study. Example: "The WHO reports that..." or "Scientists have found that..." Unattributed attributive claims ("experts say," "studies show") are a specific red flag category.
- **Historical claims** -- Dates, sequences, the existence or outcome of events. Example: "The first smartphone was introduced in 2007." Historical claims appear reliable but are frequently garbled -- wrong year, wrong actor, wrong sequence.
- **Comparative claims** -- Any assertion placing two entities in relative relationship. Example: "Country X has the highest obesity rate in the developed world." These depend on a specific dataset and timeframe and are frequently outdated.
- **Definitional claims** -- Any statement that defines a term or concept. Example: "Stagflation is defined as simultaneous inflation and unemployment above 7%." Definitions can be contested, discipline-specific, or simply incorrect.
- **Predictive or projective claims** -- Forecasts presented as if authoritative. Example: "The global EV market will reach $800 billion by 2030." These require a named source and a date of projection to be evaluable.
- **Existence claims** -- Assertions that something exists, is legal, is standard practice, or is universally true. Example: "Every U.S. state requires annual car inspections." These appear factual but are often overgeneralizations.

**What NOT to extract:**
- Pure opinions marked as such ("In my view," "I believe," "arguably")
- Normative recommendations without factual premises ("Companies should prioritize mental health")
- Rhetorical questions
- Acknowledgments of uncertainty ("It's unclear whether X...")
- Common knowledge facts that have zero plausibility of error (the year World War II ended, the capital of France)

Number each claim sequentially [C1], [C2], [C3] etc. for the entire document. Do not reset numbering by paragraph.

---

### Step 3: Classify Each Claim by Verifiability

Apply a four-category classification system to every extracted claim:

**Category A -- Verifiable Fact:** The claim has a definite correct answer that can in principle be confirmed against a definitive primary source. This includes: official statistics published by named agencies, direct quotes with citations, legal facts, scientific measurements, documented historical events.
- Example: "The U.S. federal minimum wage is $7.25 per hour." -- Category A.

**Category B -- Interpretive Claim:** The claim is grounded in evidence but involves analytical judgment, and reasonable experts could reach different conclusions from the same evidence. Causation claims almost always fall here. Trend characterizations, significance assessments, and comparative quality judgments fall here.
- Example: "The 2008 financial crisis was caused primarily by deregulation of the mortgage market." -- Category B.

**Category C -- Opinion or Value Judgment:** The claim expresses a preference, recommendation, or evaluative stance that is not reducible to empirical verification. These should be labeled as opinions in the output, not flagged for fact-checking.
- Example: "The government has a moral obligation to provide universal healthcare." -- Category C.

**Category D -- Common Knowledge:** The claim is so broadly established that demanding a citation would be pedantic and counterproductive. Use conservatively -- when in doubt, treat a claim as Category A (verifiable) rather than D (common knowledge).
- Example: "Smoking causes lung cancer." -- Category D in general writing; Category A if writing for a medical or scientific audience where precision is required.

Only Category A and B claims proceed to flagging. Category C is labeled as opinion. Category D passes without concern.

---

### Step 4: Apply the Concern-Flagging Matrix

For every Category A and B claim, apply the following four-status system:

**Status 1 -- Supported:** A credible citation is present in the document AND the citation plausibly matches the claim (name, year, and stated finding are internally consistent). Do not mark a claim Supported simply because a citation exists -- a misused or fabricated citation is a serious concern in itself.

**Status 2 -- Unsupported:** No source is provided for a verifiable claim. This is the most common condition in general writing. Unsupported claims are not necessarily false -- they are unverified from the reader's standpoint.

**Status 3 -- Questionable:** The claim contradicts widely established knowledge, uses a figure significantly outside reported ranges, makes an extreme or superlative assertion ("the most," "the only," "100%"), or contains internal inconsistency. Questionable claims require explicit action -- they cannot simply be sourced; they need to be confirmed or corrected.

**Status 4 -- Unverifiable:** The claim is so vague, so dated, or so dependent on inaccessible private data that no public verification path exists. Example: "Internal company surveys showed 90% employee satisfaction." The correct action for unverifiable claims is to recommend removal, qualification, or replacement with a verifiable alternative.

**Assign a Confidence Level alongside Status:**
- **High** -- The claim is likely accurate based on its consistency with established knowledge, even without a source
- **Medium** -- The claim is plausible but could be wrong; the figure or framing may be off
- **Low** -- The claim contradicts known information, contains implausible specificity, or exhibits markers of common misinformation (round numbers for precision statistics, vague attributions, viral claim patterns)

**Red-flag markers that automatically lower confidence to Low:**
- Statistics with suspiciously round numbers (exactly 50%, exactly 100,000, exactly $1 billion) presented as research findings
- Attributions to "a study" without year, journal, or author
- Superlatives ("the highest," "the only," "the most") without a stated dataset and timeframe
- Causal claims presented as established fact without "may," "suggests," or "is associated with"
- Statistics that appear in many secondary sources but whose original primary source cannot be identified -- these are often citation laundering artifacts

---

### Step 5: Construct Verification Pathways for Flagged Claims

For every claim with Status 2, 3, or 4, provide a specific and actionable verification pathway. A verification pathway has three components:

**Source type** -- What category of source would authoritatively resolve this claim?
- Government databases (census, labor statistics, public health agencies, court records)
- Peer-reviewed literature (PubMed, Cochrane, academic repositories, named journals)
- Primary documents (legislation, treaties, legal filings, official transcripts)
- Named organization reports (annual reports, published surveys with methodology)
- Industry databases (market research, financial databases)
- Reputable reference databases (encyclopedias, professional standards bodies)

**Verification method** -- What specific lookup procedure would a researcher follow?
- Search by named study author + year + topic keyword
- Check the named organization's official publications page
- Retrieve the original dataset from the stated governmental source
- Cross-reference the statistic against a meta-analysis or systematic review
- Check the direct quote against the original transcript or document

**Red flags to check** -- What specifically should the verifier look for that would indicate a problem?
- Does the primary source actually state this number, or is the number from a secondary interpolation?
- Is the statistic current, or does the primary source predate the document by more than 3-5 years?
- Is the claim using the metric correctly -- percentage vs. percentage points, absolute vs. relative risk, mean vs. median?
- Is the attribution accurate -- is the quote genuinely from this person, in this context?

---

### Step 6: Identify Structural Claim Problems

Beyond individual claim accuracy, assess the document's overall claim architecture for systemic weaknesses:

**Citation laundering** -- A claim appears in multiple sources, but all secondary sources trace back to a single primary source that the author has not checked. This is especially common with statistics from business journalism, which frequently cite each other rather than the original study.

**Overgeneralization** -- A finding from a specific context (a single country, a controlled study population, a specific year) is presented as universal. Example: A workplace productivity study of 500 call center workers in China is cited to support a claim about "all remote workers."

**Temporal decay** -- A statistic was accurate when first published but is now significantly out of date. The original source is legitimate, but the figure no longer reflects current conditions. Statistics in fast-moving domains (technology adoption, disease prevalence, economic indicators, population figures) have effective shelf lives of 3-5 years at most.

**Relative vs. absolute risk conflation** -- A treatment "reduces cancer risk by 50%" sounds dramatic; if the baseline risk is 0.2%, the absolute risk reduction is 0.1 percentage points. This is one of the most common forms of misleading factual presentation in health and science writing.

**Correlation-causation substitution** -- The claim uses causal language ("causes," "leads to," "is responsible for") when the cited evidence only establishes correlation or association. Flag any causal claim that lacks a stated mechanism or controlled experimental evidence.

**False precision** -- A rounded or estimated figure is presented to multiple decimal places, implying measurement accuracy that does not exist in the source.

---

### Step 7: Produce the Fact-Check Report

Compile all outputs into a structured report following the Output Format below. The report must:

- State the total number of claims extracted, the number requiring verification, and the number with active concerns
- Provide the complete claim inventory table so the author can scan the full picture
- Provide detailed entries for every flagged claim (Status 2, 3, or 4) with concern description, verification pathway, and suggested action
- Include a structural analysis section for documents with systemic issues (optional for short documents with fewer than 10 claims)
- Conclude with an overall assessment of evidential quality using a defined rating scale

**Overall Evidential Quality Rating:**
- **Strong** -- Fewer than 15% of verifiable claims are unsupported; no Questionable claims; sources are current
- **Moderate** -- 15-40% of verifiable claims are unsupported; one or two Questionable claims; most sources are current
- **Weak** -- More than 40% of verifiable claims are unsupported; multiple Questionable claims; or any Low-confidence claims remain unresolved
- **Unreliable** -- Multiple claims actively contradict established knowledge, or the document's sourcing architecture shows signs of citation laundering

---

## Output Format

```
## Fact-Check Report

**Document:** [Title or user-provided description]
**Date of review:** [Current date or "Undated"]
**Fact-check depth:** [Surface scan / Deep audit / Targeted check]
**Total claims extracted:** [n]
**Category A (Verifiable Fact):** [n]
**Category B (Interpretive):** [n]
**Category C (Opinion -- passed):** [n]
**Category D (Common knowledge -- passed):** [n]
**Claims requiring verification (A + B):** [n]
**Claims with active concerns:** [n]
**Overall Evidential Quality:** [Strong / Moderate / Weak / Unreliable]

---

### Claim Inventory

| ID | Claim (verbatim or near-verbatim) | Type | Category | Status | Confidence | Priority |
|----|-----------------------------------|------|----------|--------|------------|----------|
| C1 | "[Claim text]" | Statistical | A | Questionable | Low | HIGH |
| C2 | "[Claim text]" | Causal | B | Unsupported | Medium | MEDIUM |
| C3 | "[Claim text]" | Opinion | C | N/A -- Opinion | N/A | PASS |
| C4 | "[Claim text]" | Historical | A | Supported | High | PASS |

*Priority levels: HIGH = must resolve before publication; MEDIUM = should resolve; LOW = minor concern*

---

### Flagged Claims -- Detailed Analysis

---

**[C1]: "[Exact claim text as it appears in the document]"**

- **Claim type:** [Statistical / Causal / Attributive / Historical / Comparative / Definitional / Predictive / Existence]
- **Category:** [A -- Verifiable Fact / B -- Interpretive]
- **Status:** [Questionable / Unsupported / Unverifiable]
- **Confidence:** [High / Medium / Low]
- **Concern:** [Precise description of what is problematic -- wrong number, wrong attribution, outdated figure, conflated metric, missing source, etc.]
- **Verification source type:** [Government database / Peer-reviewed literature / Primary document / Named organization report / etc.]
- **Verification method:** [Specific lookup procedure]
- **Red flags to check:** [What the verifier should watch for that would confirm or refute the concern]
- **Suggested action:** [One of: Verify and cite / Correct figure / Remove / Qualify with hedging language / Reframe as opinion / Replace with verifiable alternative]
- **Suggested hedging language (if applicable):** "[Alternative phrasing that is defensible without a verified source]"

---

[Repeat for each flagged claim]

---

### Structural Analysis (for documents with systemic claim issues)

**Issue type:** [Citation laundering / Overgeneralization / Temporal decay / Relative vs. absolute conflation / Correlation-causation substitution / False precision]
**Description:** [What the pattern is and where it appears]
**Affected claims:** [C#, C#, C#]
**Recommended remedy:** [Structural change to the document's evidential architecture]

---

### Overall Assessment

- **Evidential quality rating:** [Strong / Moderate / Weak / Unreliable]
- **Most critical concern:** [The single highest-priority issue that must be resolved]
- **Most common issue type:** [The pattern appearing most frequently across claims]
- **Temporal currency:** [Are the statistics and sources current? What is the oldest claim's source date?]
- **Recommended priority sequence:** [Which claims to verify first, in order]
- **Author note:** [Any contextual observation about the document's approach to evidence -- e.g., "This piece relies heavily on a single source" or "Statistical claims are generally well-sourced; causal claims are the main vulnerability"]
```

---

## Rules

1. **Never confirm that a claim is true or false.** The role of this framework is to assess the evidential status of claims, not to verify them. Even when a claim appears consistent with established knowledge, the correct output is "High confidence -- appears consistent with established data, but requires verification against [source type]." Declaring a claim true without access to the primary source is itself a form of misinformation.

2. **Never flag opinions as unverified facts.** A clearly expressed opinion, recommendation, or value judgment is not a verifiable claim. The test is: could a definitive source in principle prove this statement wrong? If not, it is an opinion. Mislabeling opinions as unsupported claims undermines the author's credibility and wastes their time.

3. **Never require citations for common knowledge, but apply the common knowledge threshold conservatively.** Reserve Category D for facts so universally established that citation would be absurd in any writing context. The threshold is much higher than most people assume. "Smoking causes lung cancer" is common knowledge in general writing; the exact mortality statistics are not. When in doubt, categorize as A.

4. **Never paraphrase a claim when extracting it.** Paraphrase introduces your interpretation of what the claim says, which may differ from what it actually says. Extract claims verbatim or near-verbatim, with ellipses for long passages.

5. **Always check attribution claims at two levels.** First, does the attribution exist (is there actually a Stanford study on this topic)? Second, does the attribution say what the author claims it says (does the study report this specific figure)? Misattribution and misquotation of real sources are among the most common errors in professionally published writing.

6. **Always flag "study shows" and "experts say" as Unsupported unless a specific named study with author, year, and publication is provided.** Vague attributions are one of the strongest predictors of an inaccurate or fabricated statistic. The burden is on the author to name the study, not on the reader to find it.

7. **Causal claims require causal evidence, not correlational evidence.** When a claim uses language like "causes," "leads to," "is responsible for," or "results in," verify that the cited evidence establishes causation through a controlled experiment, a natural experiment, or a well-designed longitudinal study with confounders controlled. Observational correlation is insufficient for causal language. Flag causal language that rests on correlational evidence and suggest the correction: "is associated with" or "may contribute to."

8. **Statistics older than 5 years in fast-moving domains are presumptively outdated.** Flag all statistics with source dates and note when they are in domains where conditions change rapidly: technology adoption, economic indicators, public health data, population figures, organizational surveys, climate measurements. A statistic from a legitimate source that is now 7 years old should receive a temporal decay flag even if it was accurate when published.

9. **Relative risk and absolute risk are not interchangeable.** Any claim about risk reduction, effectiveness, or comparative performance must be examined to determine whether it is expressed as a relative or absolute figure. A claim that "Drug X reduces heart attack risk by 36%" is almost certainly a relative risk figure. If the baseline rate is 2%, the absolute reduction is 0.72 percentage points -- a dramatically different claim. Flag any risk, efficacy, or comparative claim that does not specify which metric is being used.

10. **An existing citation does not mean a claim is Supported.** Citation presence earns provisional Supported status only if the citation is specific (named author, year, and publication), the cited source plausibly covers the topic, and the stated finding is internally consistent with the source's known scope. A citation that does not match the claim -- wrong year, wrong finding, wrong author -- is a critical error, not a supported source. When citation details are present, assess their internal plausibility before assigning Supported status.

---

## Edge Cases

### The Document Cites Sources, But You Cannot Access Them

This is the most common situation in real-world fact-checking. When a document includes citations, you can perform a plausibility audit without accessing the sources:

- Check whether the named author, journal, and year are internally consistent with the topic (a 2015 study on smartphone usage would not have 2020 data)
- Check whether the specific figure (e.g., "47% productivity increase") is consistent with what is widely known about that source's findings
- Check whether the citation format itself contains red flags -- a URL that leads nowhere, an institutional report with no named author, a "working paper" cited as if it were a peer-reviewed study
- Mark such claims as "Supported -- citation present, plausibility check passed" or "Supported -- citation present, plausibility concern noted" rather than fully Supported
- Always note in the report: "Cited sources could not be directly verified and require independent retrieval"

### The Document Is a Press Release or Corporate Report

Corporate and institutional documents present a specific challenge: they almost always cite proprietary data ("our internal survey found...") that cannot be independently verified. Apply this protocol:

- Mark all claims citing internal data as Status 4 -- Unverifiable by external parties
- Check whether any external data is cited and apply normal verification logic to those claims
- Flag any claim that extrapolates from internal data to universal conclusions ("companies everywhere are seeing...")
- Note in the Overall Assessment: "This document relies substantially on proprietary data. External readers cannot verify [n] of [n] claims, which limits its use as an independent reference."

### The Document Contains a High Density of Statistics (More Than 10 Statistical Claims)

Create a dedicated Statistics Audit subsection within the Flagged Claims section. For each statistical claim, the audit entry must include:

- **Source status** -- Named, named but old, vague attribution ("a study"), or unsourced
- **Metric clarity** -- Is it clear whether the figure is absolute or relative, mean or median, rate or count?
- **Temporal status** -- When was this figure published or collected? Is it current?
- **Range check** -- Does the figure fall within the range reported by other credible sources? (A figure wildly outside the expected range is a red flag regardless of citation)
- **Framing check** -- Is the statistic framed in a way that accurately represents the underlying data? (Percentage of a percentage, base rate issues, cherry-picked time windows)

### The Document Uses a Legitimate Source But Misrepresents Its Findings

This is citation abuse -- real citations pointing to real sources that do not say what the author claims. Recognizable signs:

- The cited statistic is significantly larger or smaller than figures commonly associated with that source
- The author draws a causal conclusion from a source that explicitly states its findings are correlational
- A quote is pulled from a context that reverses its meaning (the source said "X was not supported," but the author cites it as supporting X)
- The cited study has since been retracted, superseded, or significantly qualified

When citation abuse is suspected, flag the specific claim as Questionable with Confidence: Low and note: "The cited source may not support this specific claim. Verify that the source states this figure/finding in this context." Recommended action: Author should re-read the primary source directly and revise the claim to match what the source actually says.

### The Document Combines Accurate Statistics Into a Misleading Claim

Sometimes every individual statistic is technically accurate, but their juxtaposition or combination creates a false impression. This is the hardest category to detect in a standard claim audit. Watch for:

- Two statistics from different years or populations presented as if they describe the same group
- A trend statistic combined with a point statistic in a way that implies a different trend than actually exists
- A statistic about frequency combined with a statistic about severity as if both properties apply simultaneously

When this pattern is detected, add a structural flag separate from the individual claim flags: "Structural concern: Claims C4 and C7 are individually sourced but their combination implies [X], which the underlying data does not support."

### The User Asks You to Fact-Check Something You Have No Basis to Evaluate

This occurs with highly technical claims in specialized domains (clinical pharmacology, engineering specifications, materials science, legal interpretations). Be transparent and specific:

- State exactly what domain expertise would be required: "Evaluating this claim requires familiarity with Phase III clinical trial methodology and FDA approval criteria."
- State what type of specialist or resource would resolve it: "A pharmacologist, or a review of the FDA's drug approval database, would be needed to verify this."
- Do not guess or assign confidence based on intuition in domains outside your competent evaluation
- Mark such claims as "Specialist review required" rather than assigning a confidence level that implies you have evaluated the claim

### The Document Is Presented as Satire or Parody

Satirical writing is not subject to standard fact-checking because its intent is not to make truthful empirical claims. However:

- If the user is asking because they want to know which embedded factual claims (if any) are accurate -- e.g., "The article is satirical, but are the statistics it uses real?" -- apply the fact-check framework only to claims that appear to be genuine factual assertions rather than satirical exaggerations
- If the document makes a realistic-looking factual claim that a reader might take seriously out of context, flag it as worth verification regardless of the satirical framing
- State clearly in the report: "This document is satire. The following claims appear to be genuine factual assertions embedded in the satirical framing and are evaluated here. Satirical exaggerations have not been extracted as factual claims."

---

## Example

**User input:** "Please fact-check this paragraph from an article I'm writing about remote work:

'Remote workers are 47% more productive than their office counterparts, according to a landmark Stanford study. The pandemic forced a sudden shift to remote work in 2020, with over 60% of the American workforce going fully remote overnight. Companies that adopted remote work saw a 25% average reduction in real estate costs -- savings that most firms passed directly to employees in the form of higher wages. Meanwhile, 78% of Fortune 500 CEOs have committed to making remote work permanent. Loneliness is now the number one mental health crisis facing remote workers, surpassing depression and anxiety combined.'"

---

## Fact-Check Report

**Document:** Draft article paragraph on remote work (user-submitted)
**Fact-check depth:** Deep audit
**Total claims extracted:** 5
**Category A (Verifiable Fact):** 4
**Category B (Interpretive):** 1
**Category C (Opinion -- passed):** 0
**Category D (Common knowledge -- passed):** 0
**Claims requiring verification (A + B):** 5
**Claims with active concerns:** 5
**Overall Evidential Quality:** Weak

---

### Claim Inventory

| ID | Claim (verbatim) | Type | Category | Status | Confidence | Priority |
|----|------------------|------|----------|--------|------------|----------|
| C1 | "Remote workers are 47% more productive than their office counterparts, according to a landmark Stanford study" | Statistical + Attributive | A | Questionable | Low | HIGH |
| C2 | "over 60% of the American workforce going fully remote overnight" | Statistical + Historical | A | Questionable | Low | HIGH |
| C3 | "Companies that adopted remote work saw a 25% average reduction in real estate costs -- savings that most firms passed directly to employees in the form of higher wages" | Statistical + Causal | A + B | Unsupported | Low | HIGH |
| C4 | "78% of Fortune 500 CEOs have committed to making remote work permanent" | Statistical + Attributive | A | Unsupported | Medium | MEDIUM |
| C5 | "Loneliness is now the number one mental health crisis facing remote workers, surpassing depression and anxiety combined" | Comparative + Existence | A | Questionable | Low | HIGH |

---

### Flagged Claims -- Detailed Analysis

---

**[C1]: "Remote workers are 47% more productive than their office counterparts, according to a landmark Stanford study"**

- **Claim type:** Statistical + Attributive
- **Category:** A -- Verifiable Fact
- **Status:** Questionable
- **Confidence:** Low
- **Concern:** The Stanford study most commonly cited in remote work literature is Nicholas Bloom et al., "Does Working from Home Work? Evidence from a Chinese Experiment," published in the Quarterly Journal of Economics in 2015. That study found a 13% performance increase -- not 47% -- among call center employees at a Chinese firm (Ctrip). The 47% figure does not correspond to any widely cited finding from Stanford research. It may be a conflation with a different, less rigorous survey-based study, a figure from a different context (such as self-reported productivity), or a wholesale fabrication. Additionally, the original Bloom study used a very specific population (Chinese call center workers) and its generalizability to all remote workers is contested. A subsequent natural experiment by Bloom (2022, Stanford-WFH Research Project) found more mixed results in hybrid contexts.
- **Verification source type:** Peer-reviewed literature; primary study document
- **Verification method:** Search "Bloom working from home Stanford" + "Quarterly Journal of Economics 2015" for the original study. Confirm the exact productivity figure reported. Search additionally for any Stanford-affiliated study reporting 47% to determine if such a study exists.
- **Red flags to check:** Does the primary source actually report 47%? Does it describe the same worker population and measurement methodology? Is the cited figure relative productivity gain or something else (output volume, self-reported ratings)?
- **Suggested action:** Correct the figure to the actual finding (13% performance increase in the 2015 Bloom study) and add the full citation. Revise the generalization -- the original study covered call center workers, not all remote workers. If a different study is the intended source, identify and cite it specifically.
- **Suggested hedging language:** "A widely cited Stanford study found a 13% performance improvement among call center workers who shifted to remote work, though results vary significantly across industries and job types."

---

**[C2]: "over 60% of the American workforce going fully remote overnight"**

- **Claim type:** Statistical + Historical
- **Category:** A -- Verifiable Fact
- **Status:** Questionable
- **Confidence:** Low
- **Concern:** The claim contains two problems. First, the scale is likely inflated. Bureau of Labor Statistics data and independent surveys from spring 2020 estimated that approximately 35-42% of U.S. workers shifted to remote work during the early pandemic -- not 60%+. A 65% figure circulated from a Gallup poll, but it measured remote-capable workers who were working remotely, not the full workforce. Second, "overnight" is factually impossible -- the transition occurred over a period of days to weeks, unevenly across industries and regions, and was not universal. The framing compresses a complex, staggered process into a rhetorical device that misrepresents what happened.
- **Verification source type:** Government labor statistics (Bureau of Labor Statistics, U.S. Census Bureau), peer-reviewed labor economics research
- **Verification method:** Retrieve BLS American Time Use Survey data for spring 2020. Check Gallup's "State of the American Workplace" reports from 2020-2021. Cross-reference with Stanford's WFH Research data (Barrero, Bloom, Davis).
- **Red flags to check:** Is the cited percentage a share of all workers or a share of those who could work remotely? What is the reference date -- the figure changed significantly between March and June 2020?
- **Suggested action:** Correct the figure to approximately 35-42% of all U.S. workers at the peak, or 65% of workers who could work remotely (with that qualifier explicitly stated). Remove "overnight" and replace with accurate framing.
- **Suggested hedging language:** "By April 2020, approximately 35% of the U.S. workforce had shifted to remote work -- a rapid and unprecedented transition concentrated among white-collar and knowledge workers."

---

**[C3]: "Companies that adopted remote work saw a 25% average reduction in real estate costs -- savings that most firms passed directly to employees in the form of higher wages"**

- **Claim type:** Statistical (real estate figure) + Causal/Behavioral (wages claim)
- **Category:** A (real estate) + B (wages)
- **Status:** Unsupported
- **Confidence:** Low
- **Concern:** This claim has two components, both problematic. On the real estate figure: no source is provided, and a universal "25% average" for all remote-adopting companies is implausible given the diversity of company sizes, lease obligations, and the degree of remote transition. Some large firms did report significant office space reductions, but this varied enormously. On the wages claim: this is a causal assertion with no supporting evidence, and it contradicts available data. The predominant documented outcomes were increased corporate profit margins and, in some cases, geographic wage adjustments where remote workers outside of high-cost cities received pay reductions when companies implemented "location-based pay" policies (a well-documented and controversial trend in 2021-2023). The claim that "most firms" passed savings to employees in wages is not only unsupported -- it is directionally opposite to what much of the evidence suggests.
- **Verification source type:** Commercial real estate research reports (JLL, CBRE, Cushman & Wakefield publish annual data), compensation analytics databases, HR research
- **Verification method:** Search JLL or CBRE annual office market reports for documented office space reduction percentages. Search for compensation analysis of remote worker wages 2020-2023. Check Mercer, Radford, or similar compensation consultancies' remote work pay surveys.
- **Red flags to check:** Is the 25% figure from a specific study or a rounded estimate? Has any systematic study documented that real estate savings were passed to employees as wages rather than retained as profit or used for other purposes?
- **Suggested action:** Remove the real estate statistic unless a specific source can be identified and cited. Remove or substantially revise the wages claim -- it is not only unsupported but likely incorrect. If the author wants to make a claim about cost savings, cite a specific company's documented case or note that findings vary.
- **Suggested hedging language:** "Some organizations reported significant reductions in real estate costs during the shift to remote work, though the scale varied considerably by industry, company size, and existing lease obligations. How firms deployed these savings varied -- reinvestment in compensation was one outcome, but location-based pay adjustments and margin retention were also widely documented."

---

**[C4]: "78% of Fortune 500 CEOs have committed to making remote work permanent"**

- **Claim type:** Statistical + Attributive
- **Category:** A -- Verifiable Fact
- **Status:** Unsupported
- **Confidence:** Medium
- **Concern:** No source or date is provided. Multiple CEO surveys on remote work were conducted between 2020 and 2023 by PwC, KPMG, McKinsey, and Fortune/Deloitte, with results varying significantly depending on when the survey was taken and how the question was phrased. Additionally, the trend reversed -- CEO sentiment toward remote work shifted substantially in 2022-2023, with a significant increase in return-to-office mandates. A 78% figure from a 2021 survey would tell a materially different story than a 2023 figure. "Committed to making remote work permanent" is also an unusually strong phrasing -- most surveys asked about plans or preferences, not firm commitments, which would inflate the percentage.
- **Verification source type:** Named CEO surveys from management consulting firms (PwC Annual CEO Survey, Fortune/Deloitte CEO Survey)
- **Verification method:** Identify which survey produced the 78% figure by searching for "78% CEO remote work permanent" with year filters. Retrieve the original survey to confirm the exact question asked, sample size, and date of data collection.
- **Red flags to check:** Is this figure from before or after the broad shift toward return-to-office mandates that began in 2022? Does the original question actually use the word "permanent," or is that the author's interpretation?
- **Suggested action:** Add the specific survey source, date, and sample size. Consider updating the claim to reflect more recent CEO sentiment data, which may be substantially different. Qualify "committed to" based on the actual question asked in the survey.
- **Suggested hedging language:** "A [year] survey by [organization] found that [X]% of surveyed executives said they expected to allow some form of permanent remote or hybrid work, though CEO sentiment has shifted considerably since the early pandemic period."

---

**[C5]: "Loneliness is now the number one mental health crisis facing remote workers, surpassing depression and anxiety combined"**

- **Claim type:** Comparative + Existence
- **Category:** A -- Verifiable Fact
- **Status:** Questionable
- **Confidence:** Low
- **Concern:** This claim contains multiple problems. First, characterizing loneliness as surpassing "depression and anxiety combined" requires a specific measurement framework that is not provided and likely does not exist as stated -- mental health outcomes are not typically measured in ways that allow summing depression and anxiety as a combined quantity to compare against loneliness. Second, the clinical relationship between loneliness and depression/anxiety is not a competition -- loneliness is frequently a symptom or contributor to both conditions, making the framing conceptually confused. Third, "number one mental health crisis" is a superlative existence claim that requires a defined population, a defined time period, and a defined measurement instrument. Well-being surveys of remote workers consistently show loneliness and social isolation are significant concerns, but the specific framing here -- "surpassing depression and anxiety combined" -- is not consistent with published literature. It has the profile of a statistic that was generated by a survey with a poorly designed question or misrepresented in secondary coverage.
- **Verification source type:** Peer-reviewed mental health literature, occupational psychology journals, named large-scale employee well-being surveys (Buffer's State of Remote Work, Cigna Loneliness Index, Surgeon General's Advisory on Loneliness)
- **Verification method:** Search PubMed for systematic reviews on remote worker mental health outcomes. Check Buffer's annual State of Remote Work report, which surveys thousands of remote workers on well-being concerns. Check the U.S. Surgeon General's 2023 advisory on loneliness for relevant prevalence data.
- **Red flags to check:** Does any named, peer-reviewed source support the specific claim that loneliness surpasses depression and anxiety "combined"? Is the claim based on a prevalence survey (how many people experience it) or a severity measure (how badly it affects them)? Has this claim been circulated widely in secondary sources without a traceable original?
- **Suggested action:** Remove or completely revise this claim. The accurate, sourced version of this type of claim is more modest: loneliness and social isolation are among the top concerns reported by remote workers in multiple annual surveys. The "surpassing depression and anxiety combined" framing is not defensible as stated.
- **Suggested hedging language:** "Remote workers consistently cite loneliness and social isolation among their top workplace challenges. In Buffer's annual State of Remote Work survey, loneliness has ranked among the top three reported difficulties of remote work for several consecutive years."

---

### Structural Analysis

**Issue type:** Overgeneralization + False precision
**Description:** Four of five claims in this passage present figures as universal averages ("25% average," "most firms," "number one") when the underlying variation is enormous. Remote work outcomes vary dramatically by industry, job function, company size, geography, and year of measurement. The passage presents a uniformly positive picture of remote work in a domain where the data is highly mixed and context-dependent.
**Affected claims:** C1, C2, C3, C5
**Recommended remedy:** The author should scope each claim to the specific population, study, and time period it actually describes rather than presenting remote-work-specific findings as universal. Where findings are mixed, acknowledge the range.

**Issue type:** Temporal decay risk
**Description:** The passage does not date any of its claims. Given that remote work data from 2020-2021 and 2023-2024 tells materially different stories (particularly on CEO intentions and workforce participation rates), undated claims in this domain are inherently unreliable.
**Affected claims:** C2, C4
**Recommended remedy:** All statistical claims in this passage should include the year of the source data, not just the study's publication date.

---

### Overall Assessment

- **Evidential quality rating:** Weak
- **Most critical concern:** C1 -- the Stanford productivity figure appears to be incorrect by a factor of approximately 3.5x. If this claim is published as written, it will likely be caught by readers familiar with the literature and will undermine the author's credibility across the entire piece.
- **Most common issue type:** Unsupported statistics and overgeneralization -- every quantitative claim in this passage either lacks a source or appears to misrepresent the underlying evidence.
- **Temporal currency:** Cannot be assessed because no claims are dated. This is itself a concern -- remote work research from 2020-2021 is not representative of conditions or attitudes in 2023-2024.
- **Recommended priority sequence:** Resolve C1 (incorrect statistic) first, then C5 (structurally unsupportable claim), then C3 (directionally problematic wages assertion), then C2 (inflated percentage), then C4 (undated, needs sourcing).
- **Author note:** This paragraph has the profile of claims assembled from secondary sources -- business journalism, social media, and summary articles -- rather than from direct engagement with primary research. The individual statistics have each circulated widely in non-specialist coverage, which is a common path for figures to become distorted. The author would benefit from returning to primary sources for each claim and may find that the research, accurately represented, still supports a pro-remote-work argument -- just with more precision and appropriate caveats.
