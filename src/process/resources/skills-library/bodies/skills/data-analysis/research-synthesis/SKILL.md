---
name: research-synthesis
description: |
  Synthesizes multiple sources into a structured research summary: source quality assessment, finding extraction, theme identification, evidence strength rating, and contradiction mapping. Produces a research brief, not a literature review.
  Use when the user asks to summarize findings from multiple reports, articles, or studies, compare conclusions across sources, identify consensus and disagreement in research, or produce an evidence-based brief for decision-making.
  Do NOT use for qualitative coding of interview data (use qualitative-coding), automated text mining of large corpora (use text-mining-protocol), or designing original research surveys (use survey-design).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "research analysis report"
  category: "data-analysis"
  subcategory: "research-analysis"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Research Synthesis

## When to Use

**Use this skill when:**
- The user provides 3 or more discrete sources (reports, studies, articles, white papers, government publications, internal data analyses) and asks for a unified understanding of what the evidence says
- The user needs to present an evidence-based recommendation to a decision-making audience (executive team, board, policymakers, investors) and must justify the recommendation with cited, quality-weighted evidence
- The user explicitly asks to compare conclusions across sources -- "some studies say X, others say Y, which is right?" -- requiring contradiction mapping and root-cause analysis of disagreement
- The user needs a research brief with a defined shelf life and clear evidence-strength ratings, not an exhaustive literature review listing everything ever written on the topic
- The user is preparing for a high-stakes decision (policy change, product pivot, capital allocation, regulatory response) and needs to know both what the evidence supports and where the evidence is insufficient
- The user wants to identify consensus and dissent within a defined body of evidence -- distinguishing genuine scientific consensus from manufactured consensus, citation circularity, or groupthink
- The user has a mix of academic, industry, and internal sources and needs a single coherent synthesis that weights each appropriately rather than treating them as equivalent

**Do NOT use when:**
- The user wants to code open-ended interview or survey responses into themes and categories -- that is qualitative data reduction, not research synthesis (use `qualitative-coding`)
- The user wants to computationally process hundreds or thousands of documents using NLP, topic modeling, or keyword extraction (use `text-mining-protocol`) -- research synthesis is a judgment-intensive process suited to 3-50 sources, not large corpora
- The user wants to design a survey, measurement instrument, or primary research protocol (use `survey-design`) -- synthesis works with existing evidence; primary research creates new evidence
- The user wants a competitive landscape map that tracks competitor positioning, pricing, features, and market movements (use `competitive-intelligence`) -- that is market monitoring, not evidence synthesis
- The user has a single source and wants it summarized -- that is document summarization, not synthesis; synthesis by definition requires integrating across multiple sources
- The user wants a formal systematic review following PRISMA or Cochrane protocols with exhaustive database searches, PROSPERO registration, and GRADE evidence rating -- that requires a specialized systematic-review skill and months of primary research work
- The user is working with raw data (spreadsheets, databases, survey microdata) that has not yet been analyzed -- that requires data analysis before synthesis is possible (use `data-analysis`)

---

## Process

### 1. Define the Synthesis Scope and Research Question

Before touching any source, establish the precise question the synthesis must answer. A vague question produces a vague synthesis.

- **Formulate a specific, answerable question.** The question must be narrow enough that you can declare a finding "relevant" or "not relevant." "What do we know about remote work?" is too broad. "Does remote work increase or decrease individual employee productivity for knowledge workers, and what conditions moderate the effect?" is answerable.
- **Identify the decision the synthesis must support.** Ask the user: What will you do differently if the evidence says X versus Y? If the answer is "nothing," the synthesis scope is wrong. Scope the question to the decision.
- **Establish the evidence boundary.** Define the population, geography, time period, and domain the synthesis covers. A synthesis of consumer fintech adoption evidence should not quietly incorporate findings about enterprise software adoption even if they seem analogous.
- **Clarify the audience and output use case.** An executive team needs a 2-page brief with a single recommendation. A research team needs the full contradiction analysis and methodology notes. A policy team needs regulatory context and generalizability caveats. Tailor depth and format accordingly.
- **Agree on the source set.** Are the user's sources the complete set, or should you flag obvious gaps (e.g., "you have 5 industry reports but no peer-reviewed studies -- this will constrain the evidence strength ratings")?
- **Set a time-sensitivity threshold.** For technology, social, and regulatory topics, flag any source older than 24 months as "recency risk." For stable domains (basic nutrition science, structural engineering principles), 5-year-old sources may be fully current.

---

### 2. Assess Source Quality Before Reading for Content

This step must happen before finding extraction. Assessing quality after reading introduces anchoring bias -- you will unconsciously inflate the quality of sources that support the conclusion you have already formed.

- **Apply the five-dimension quality assessment** to every source in the set:
  - **Methodology strength:** Was there a control group? What was the sample size? Was the sample randomly selected or self-selected? Was the measurement instrument validated? Randomized controlled trials (RCTs) and pre-registered studies rank highest. Meta-analyses and systematic reviews rank high if their inclusion criteria are rigorous. Cross-sectional surveys, expert interviews, and observational studies rank lower. Case studies and anecdotal reports rank lowest.
  - **Recency:** Current = published or fielded within 24 months. Recent = 2-5 years. Dated = 5+ years. In fast-moving domains, apply stricter thresholds: AI/ML (12 months), social media behavior (18 months), macroeconomics (24 months), climate science (36 months), public health epidemiology (24 months).
  - **Source authority:** Peer-reviewed journals (with impact factor consideration) > established research institutes (Pew, Gallup, Brookings) > major consulting firms with disclosed methodology (McKinsey, Deloitte) > industry associations > company-sponsored research > trade press > blogs and opinion pieces.
  - **Bias risk:** Who funded the research? Does the funder have a financial interest in a particular outcome? Pharmaceutical company-funded drug trials have documented bias inflation of 2-4x compared to independently funded trials (this is empirically established in the literature). Industry-funded technology research, advocacy group-funded policy research, and consulting firms marketing transformation services all carry moderate-to-high bias risk. Disclose funding in the quality table even if it does not disqualify the source.
  - **Relevance:** Does the source directly address the synthesis question (population, geography, time period, variable definition all match), partially address it (similar population but different geography or time period), or only tangentially relate (same general domain but different specific question)?

- **Assign quality tiers:**
  - **Tier 1:** Strong methodology + current or recent + high authority + low bias + direct or partial relevance. These sources anchor conclusions.
  - **Tier 2:** Adequate methodology + recent + medium authority OR one significant quality limitation compensated by strength in other dimensions. These sources corroborate or nuance Tier 1 conclusions. Do not let Tier 2 sources override Tier 1 sources unless Tier 2 sources are substantially larger, more recent, or more methodologically diverse.
  - **Tier 3:** Weak methodology, dated, low authority, high bias, or tangential relevance. Tier 3 sources can suggest hypotheses, provide color, or flag potential directions for additional research. They must never anchor a finding or recommendation. If only Tier 3 sources address a key question, the evidence for that question is insufficient -- label it as such.

- **Check for citation circularity.** Before counting sources, trace citations to their original source. If six industry reports all cite the same 2021 academic study as their foundational evidence, you have one source, not six. Document the original source and its quality; the derivative citations contribute little additional evidentiary weight.

- **Check for methodological clustering.** If all your strong sources use the same methodology (e.g., all are survey-based self-report studies), findings may share a common methodological bias (social desirability, recall bias, response bias). Note this limitation even if each individual source is high quality.

---

### 3. Extract Findings from Each Source

Work source by source. Do not jump to themes yet -- premature theme identification causes you to selectively extract findings that fit emerging themes and miss disconfirming evidence.

- **Extract the primary finding:** The main conclusion directly relevant to the synthesis question. Quote or paraphrase precisely -- do not editorialize.
- **Extract the supporting evidence:** The specific data, statistics, or logical reasoning the source provides for its finding. Include effect sizes, confidence intervals, and p-values for academic sources where stated. For survey data, include sample size, response rate, and the exact question wording if available. For qualitative sources, note how many cases or examples support the conclusion.
- **Document scope and applicability:** Who was studied? What geography? What time period? What industry or sector? What definition of the key variable was used? Variable definition mismatches are the most common cause of apparent contradictions -- two studies often disagree because they define "productivity" or "engagement" or "adoption" differently.
- **Note the source's stated confidence:** Did the source claim definitive causation or only correlation? Did the authors note limitations? Did they recommend replication? Accurately represent what the source claims -- do not upgrade a study's stated confidence.
- **Flag any anomalies during extraction:** Unusually large or small effect sizes, sample size mismatches with claimed conclusions, conclusions that do not logically follow from the stated evidence. These are potential quality flags even if the source passed the initial assessment.

---

### 4. Identify Themes Across Sources

After all sources have been extracted individually, read across the extraction notes to identify convergent patterns.

- **Inductive theme development:** Do not impose a pre-existing framework. Let the themes emerge from what multiple sources actually say. Group findings that address the same aspect of the research question, not just findings that use similar vocabulary.
- **Classify themes by consensus type:**
  - **Strong consensus:** 3+ Tier 1 sources agree, consistent across different methodologies and different populations. This is the highest-confidence finding.
  - **Directional consensus:** Multiple sources point in the same direction but vary in magnitude, or Tier 1 and Tier 2 sources agree without Tier 3 contradiction.
  - **Emerging signal:** 1-2 sources suggest a pattern that has not yet been replicated or confirmed independently. Worth noting but should not drive a primary recommendation.
  - **Contested finding:** Sources disagree on the same specific question. Do not force consensus where none exists. Document the disagreement.
  - **Isolated finding:** A single source reports something that no other source addresses. This may be a unique insight or an artifact. Flag it as preliminary.
- **Assign each theme a label** that is descriptive and specific, not vague. "Remote work affects productivity" is not a theme label. "Individual focused-task productivity increases 5-15% when working remotely for knowledge workers" is a theme label.
- **Be explicit about what themes the evidence does NOT support.** Absent evidence is evidence. If the synthesis question has four logical sub-questions and only two of them are addressed by the sources, document the two unaddressed questions as evidence gaps.

---

### 5. Map Contradictions

Contradictions are the most analytically valuable part of a synthesis. They reveal where the evidence is genuinely uncertain, where different conditions produce different effects, and where measurement choices drive apparent disagreement.

- **Categorize the type of contradiction:**
  - **Definitional contradiction:** Sources use the same word to mean different things (e.g., one study defines "engagement" as survey self-report; another measures it via behavioral metrics like logins and time-on-task). These contradictions often dissolve once definitions are aligned -- they are not real empirical disagreements.
  - **Population contradiction:** Studies of different populations genuinely produce different results because the effect varies by group. A finding that "loyalty programs increase purchase frequency" may be true for high-income consumers and false for price-sensitive consumers. Document the moderating variable.
  - **Temporal contradiction:** Findings from different time periods reflect real changes in the world. A 2019 study on remote work productivity and a 2022 study conducted post-pandemic do not contradict each other -- they measure different baseline conditions.
  - **Methodological contradiction:** One study's design is more appropriate for the question than another's. An RCT finding contradicted by a survey finding is not a tie -- the RCT provides stronger causal evidence. Weight by methodology strength.
  - **Genuine empirical contradiction:** After controlling for definitions, populations, time periods, and methodology quality, the evidence still points in opposite directions. This is a true research gap. Do not fabricate a resolution; document the uncertainty.
- **For each contradiction, state:** (a) Claim A and its source(s) and quality tiers, (b) Claim B and its source(s) and quality tiers, (c) the most likely explanation for the disagreement, (d) which position has stronger evidentiary support and why, (e) what additional evidence would resolve the contradiction.

---

### 6. Rate Evidence Strength for Each Theme

Apply a consistent, defensible evidence-strength rubric. Do not allow strong writing or confident claims in a source to inflate the evidence rating -- rate the evidence, not the rhetorical confidence.

- **Strong evidence:** 3+ Tier 1 sources agree; findings are consistent across at least two different methodologies; effect direction and magnitude are consistent; no credible Tier 1 source contradicts. This level of evidence supports a primary recommendation.
- **Moderate evidence:** 2+ Tier 1 sources agree OR 4+ Tier 2 sources with consistent direction; some variation in magnitude or population; no direct contradiction from Tier 1 sources. This level of evidence supports a recommendation with stated caveats.
- **Weak evidence:** Only Tier 2-3 sources address this; limited methodological diversity; small samples; or one Tier 1 source with no replication. This level of evidence can inform a tentative recommendation but should trigger a call for additional evidence-gathering.
- **Insufficient evidence:** Fewer than 2 sources address the question; all sources are Tier 3; or a genuine empirical contradiction exists with no resolution available from current sources. Do not make a recommendation based on insufficient evidence -- document the gap and recommend what type of evidence would resolve it.
- **Apply the GRADE-inspired downgrading criteria** for clinical and policy research contexts: downgrade if there is serious risk of bias in the source pool, important inconsistency across sources that cannot be explained, indirectness (sources address a related but not identical question), imprecision (wide confidence intervals or very small samples), or publication bias (only positive findings appear in the literature -- a sign that negative findings may be unpublished).

---

### 7. Produce the Research Brief

The synthesis output is not a summary of sources -- it is a structured argument supported by evidence. Write toward the decision.

- **Lead with the key conclusion, not the methodology.** Decision-makers read the conclusion first. If the conclusion is buried at the end, it will not be used.
- **Organize recommendations by evidence strength.** State what is supported by strong evidence first, then moderate, then tentative. Never bury a strong finding behind a long preamble of weak evidence.
- **Calibrate language to evidence strength.** Strong evidence: "The evidence consistently shows..." Moderate evidence: "Evidence suggests, though findings vary across populations..." Weak evidence: "Preliminary findings indicate, but replication is needed..." Insufficient evidence: "Current evidence cannot answer this question."
- **Make recommendations operationally specific.** "Invest in manager training" is not an actionable recommendation. "Design a 12-week asynchronous communication and outcome-based management training program for all people managers, piloted with the engineering and product organizations, with 90-day follow-up measurement of remote team productivity metrics" is actionable.
- **Include a synthesis methodology note.** Document the source selection process, inclusion and exclusion criteria, and limitations of the synthesis itself. A synthesis conducted on sources provided by the user is constrained by whatever biases existed in the user's source selection. Name that limitation explicitly.

---

## Output Format

```markdown
## Research Synthesis: [Topic / Specific Research Question]

---

### Synthesis Overview

| Field | Content |
|-------|---------|
| **Research question** | [Specific, answerable question this synthesis addresses] |
| **Decision context** | [What decision this brief supports; who makes it] |
| **Sources reviewed** | [N sources: breakdown by type, e.g., 3 peer-reviewed, 2 industry surveys, 1 internal] |
| **Date of synthesis** | [Month, Year] |
| **Audience** | [Specific role or team] |
| **Synthesis shelf life** | [Estimated date by which key findings may be outdated and should be revisited] |
| **Key conclusion** | [One or two sentences: the answer to the research question at the current level of evidence] |

---

### Source Quality Assessment

| # | Source Name / Citation | Type | Methodology | Recency | Authority | Bias Risk | Relevance | Tier |
|---|----------------------|------|-------------|---------|-----------|-----------|-----------|------|
| S1 | [Full citation] | [Peer-reviewed / Industry survey / Consulting report / Internal data / etc.] | [Strong / Adequate / Weak] | [Current / Recent / Dated] | [High / Medium / Low] | [Low / Moderate / High / Unknown] | [Direct / Partial / Tangential] | [1 / 2 / 3] |
| S2 | [Full citation] | ... | ... | ... | ... | ... | ... | ... |

**Notes on source pool:**
- [Any citation circularity identified]
- [Any methodological clustering that limits the overall evidence base]
- [Any notable gaps in the source pool -- e.g., no peer-reviewed evidence included]

---

### Key Findings by Source

#### S[N]: [Source Name]
- **Primary finding:** [Precise statement of the main conclusion relevant to the synthesis question]
- **Supporting evidence:** [Specific data: sample size, effect size, confidence intervals, response rate, or key reasoning chain]
- **Variable definitions:** [How the source defines the key variable(s)]
- **Population/scope:** [Who was studied; what geography; what time period]
- **Stated limitations:** [What the source's authors acknowledge as limitations]
- **Quality flag:** [Any anomalies noted during extraction, or "None"]

[Repeat for all sources]

---

### Themes and Evidence Assessment

#### Theme [N]: [Specific, descriptive theme label]

**Evidence strength:** [Strong / Moderate / Weak / Insufficient]

**Finding:** [Clear statement of what the evidence collectively shows on this theme]

**Supporting sources:**

| Source | Quality Tier | How It Supports This Theme | Finding Magnitude |
|--------|-------------|---------------------------|-------------------|
| S[N] | [Tier] | [Specific finding from this source] | [Effect size or qualitative magnitude if available] |

**Confidence rationale:** [Why this theme received this evidence-strength rating -- number of sources, tier composition, methodological diversity, consistency of direction and magnitude]

**Caveats:** [Population limitations, definitional variations, temporal limitations, or other constraints on how broadly this finding applies]

[Repeat for all themes]

---

### Contradiction Analysis

#### Contradiction [N]: [Description of the specific disagreement]

| Dimension | Position A | Position B |
|-----------|-----------|-----------|
| **Claim** | [Statement of Position A] | [Statement of Position B] |
| **Sources** | S[N], S[N] | S[N], S[N] |
| **Quality tiers** | [Tier composition] | [Tier composition] |
| **Methodology** | [Method used] | [Method used] |

**Type of contradiction:** [Definitional / Population / Temporal / Methodological / Genuine empirical]

**Explanation:** [Most likely reason the sources disagree]

**Resolution:** [Which position has stronger evidentiary support and why, or acknowledgment that the contradiction is genuine and unresolved]

**Evidence needed to resolve:** [What type of study or data would settle this]

[Repeat for all contradictions]

---

### Evidence Gaps

| Gap | Why It Matters | What Evidence Would Fill It | Priority |
|-----|---------------|----------------------------|---------|
| [Unanswered question] | [Decision relevance] | [Specific study type or data source] | [High / Medium / Low] |

---

### Recommendations

**[Rec 1 -- based on strong evidence]:**
[Operationally specific recommendation]. Supported by [evidence summary]. Confidence: High.

**[Rec 2 -- based on moderate evidence]:**
[Operationally specific recommendation with explicit caveat]. Supported by [evidence summary]. Confidence: Moderate. Caveat: [Specific limitation].

**[Rec 3 -- to address evidence gaps]:**
[Research or measurement action to fill identified gaps]. Rationale: [Which gap this addresses and why it matters for the decision].

---

### Synthesis Methodology Notes

- **Source selection process:** [How the sources were identified -- user-provided, systematic search, purposive selection]
- **Inclusion criteria:** [What qualified a source for inclusion in this synthesis]
- **Exclusion criteria:** [What was excluded and why]
- **Source pool limitations:** [Biases in the source pool itself -- e.g., all English-language, all US-based, user-selected with unknown selection criteria]
- **Shelf life:** [When this synthesis should be revisited; what events or publications would trigger an update]
- **What this synthesis cannot answer:** [Explicit statement of the boundaries of this evidence base]
```

---

## Rules

1. **Complete source quality assessment before reading for content.** Quality assessment after finding extraction introduces anchoring bias. You will unconsciously inflate quality ratings for sources that support the conclusion forming in your head. The order is non-negotiable: assess quality first, extract findings second, identify themes third.

2. **Never count derivative sources as independent evidence.** If four reports all cite a single original study, that original study is the evidence. Cite it as one source. Four reports repeating the same underlying data do not constitute convergent evidence -- they constitute citation circularity. Always trace claims to their origin.

3. **Calibrate language precisely to evidence strength.** "The evidence shows" is reserved for strong evidence. "Evidence suggests" for moderate. "Preliminary findings indicate" for weak. "Current evidence cannot determine" for insufficient. Using confident language for weak evidence is a form of intellectual dishonesty that misleads decision-makers.

4. **Contradictions must be documented, not resolved by omission.** The most common synthesis error is presenting a clean narrative by quietly dropping the sources that disagree. Every contradiction must appear in the contradiction analysis. If a Tier 1 source contradicts the dominant finding, it must be named, analyzed, and either refuted with methodological reasoning or acknowledged as genuine uncertainty.

5. **Never extrapolate beyond the stated scope of a finding.** A finding from a study of 500 enterprise software companies in the United States is not generalizable to small businesses, consumer markets, or non-US geographies unless the source explicitly tests generalizability. Scope violations are the second most common synthesis error after contradiction omission.

6. **Three Tier 3 sources agreeing is still weak evidence.** Evidence strength is a product of both the number and the quality of sources. Consensus among low-quality sources does not accumulate into high-quality consensus. If only Tier 3 sources address a question, rate the evidence as insufficient or weak, regardless of how many Tier 3 sources there are.

7. **Distinguish what the evidence shows from what you recommend.** "The evidence indicates X" and "We recommend Y given this evidence" are separate logical acts. Recommendations may incorporate factors beyond the evidence (organizational capacity, cost, risk appetite). Always make the inferential step explicit so the audience can evaluate whether the recommendation follows from the evidence or introduces external considerations.

8. **Internal data is a source that requires quality assessment.** User-provided internal data (engagement surveys, performance metrics, operational logs) is not automatically more credible because it is proprietary. Assess its methodology (was it collected systematically?), potential response bias, sample coverage, and recency using the same framework as external sources. Internal data often has high relevance but unknown or weak methodology.

9. **Publication bias affects source pools in a predictable direction.** Positive findings are more likely to be published, shared, and cited than null or negative findings. In fields with commercial interest (technology adoption, pharmaceutical research, organizational change), the visible evidence pool likely over-represents positive effects. Acknowledge this when the source pool skews positive and consider whether null findings may be systematically absent.

10. **A synthesis is not a literature review.** A literature review exhaustively catalogs existing research. A research brief synthesizes the strongest available evidence to answer a specific question and inform a specific decision. Every section of the output must connect to the research question. Sources, findings, themes, and recommendations that are intellectually interesting but not relevant to the decision should be noted briefly as out-of-scope, not elaborated at length.

---

## Edge Cases

### Very Sparse Evidence Base (Fewer Than 4 Sources)
A synthesis of 2-3 sources is still analytically legitimate but requires explicit disclosure. Label the synthesis "preliminary" or "exploratory" in the overview. Most themes will rate as weak or insufficient evidence -- this is accurate, not a failure. The evidence gaps section becomes the most important part of the output. Recommend specific source types that would strengthen the evidence base (e.g., "This synthesis currently rests on 2 industry surveys; peer-reviewed evidence and internal data would substantially increase confidence"). Do not pad the source pool by including tangentially relevant sources just to increase source count -- that inflates apparent confidence without adding real evidentiary weight.

### All Sources Agree (No Apparent Contradictions)
Treat apparent consensus with analytical suspicion before concluding it is genuine. Check for: (a) citation circularity -- all sources tracing to the same original study; (b) methodological clustering -- all sources using the same method, making them subject to the same systematic bias; (c) publication bias -- negative findings may be systematically absent; (d) selection bias in the user's source set -- did the user select sources that support a predetermined conclusion? If consensus survives these checks, it is genuine. If not, document what is driving the apparent agreement. A note in the Synthesis Methodology section stating "apparent consensus in this source pool reflects [X sources citing the same original study / all survey-based methodology] and should not be interpreted as broad independent replication" is honest and necessary.

### Sources in Multiple Languages or from Multiple Geographic and Cultural Contexts
Findings from different national or cultural contexts may reflect genuine variation in the phenomenon (e.g., remote work productivity may differ across cultures with different norms around work-life separation) rather than methodological disagreement. Treat geographic variation as a substantive moderating variable, not a data quality problem. Note the geographic scope of each source in the quality assessment table. Do not combine findings across geographic contexts without explicitly testing whether the finding appears to be universal or context-specific. If the synthesis question requires a global conclusion but sources are predominantly from one region, flag this as a significant limitation.

### Rapidly Evolving Topic (AI, Regulatory Policy, Platform Dynamics)
Downgrade the effective recency rating of any source older than 12-18 months when the topic involves technology capability, regulatory posture, or platform behavior that has demonstrably changed. In the synthesis overview, include a "shelf life" estimate: "This synthesis reflects evidence available as of [date]. Key findings in the [technology capability / regulatory] dimensions are likely to shift within 12 months as [specific factors] evolve. Findings in the [stable dimensions] are likely to remain valid." Identify which themes are most time-sensitive and which are more stable so readers know which parts of the brief to treat as provisional.

### User Has Mixed Internal and External Sources
Internal company data and external research serve different but complementary roles. External research provides population-level context and causal mechanisms. Internal data provides organizational specificity and current operational reality. When they diverge, investigate why -- the most common causes are that the company is an outlier (its practices, culture, or market position differ from the studied population) or that the internal data measures something different from what the external research measured. Present them as complementary evidence streams in different columns of the source table, not interchangeable sources. Explicitly note when the internal data contradicts or confirms the external baseline.

### User's Source Set Has an Obvious Ideological or Commercial Skew
If the user provides 6 sources from advocacy organizations with a clear directional interest, note this as a structural limitation in the Synthesis Methodology section. Do not decline to synthesize -- that is not the appropriate response. Do synthesize, tier the sources accurately (high-advocacy sources carry high bias risk and will generally be Tier 2-3), and explicitly state in the overview: "This synthesis is constrained by a source pool that skews toward [pro-X / anti-Y] perspectives. Sources representing alternative positions were not available for review. Conclusions should be treated as the strongest available evidence from one side of an active debate, not as the full evidentiary picture." Recommend specific counterbalancing sources the user should seek to complete the synthesis.

### Sources Span Very Long Time Periods (10+ Years)
When sources range from 2010 to 2025, do not synthesize across the full range without explicit temporal segmentation. Determine whether the older sources reflect a different baseline condition that makes their findings incomparable to recent sources (e.g., smartphone adoption rates in 2010 versus 2025 represent entirely different behavioral contexts). If the topic has structurally changed, split the synthesis into temporal segments or explicitly treat the older sources as historical context rather than current evidence. A contradiction analysis that pits a 2012 finding against a 2024 finding is usually not a real contradiction -- it is a temporal sequence.

### Evidence Is Technically Strong But the Research Question Is Under-Specified
Sometimes the user's research question contains ambiguity that the evidence cannot resolve because different valid interpretations of the question lead to different answers. For example, "Does AI increase worker productivity?" could mean: for which workers? what type of AI? what type of tasks? measured over what time horizon? compared to what baseline? Before synthesizing, surface the ambiguity and ask the user to specify. If that is not possible, synthesize against each plausible interpretation of the question separately and note that the answer varies by how the question is defined. This is more honest and more useful than forcing an answer to a question that was never precisely asked.

---

## Example

**Input:** "I have 9 sources about using large language models (LLMs) in enterprise customer support operations. I need to present a go/no-go recommendation to our executive team on deploying an LLM-based support assistant. Some sources show major cost savings, others raise accuracy and hallucination concerns. I'm the VP of Customer Experience."

**Output:**

---

## Research Synthesis: LLM Deployment in Enterprise Customer Support -- Go/No-Go Evidence Brief

---

### Synthesis Overview

| Field | Content |
|-------|---------|
| **Research question** | Do LLM-based customer support assistants deliver net operational and customer experience improvement for enterprise deployments, and what conditions determine success or failure? |
| **Decision context** | Go/no-go deployment decision for LLM-based support assistant; decision-maker is VP of Customer Experience; implementation budget and risk threshold are organizational inputs not addressed by this evidence brief |
| **Sources reviewed** | 9 sources: 3 peer-reviewed studies, 2 enterprise vendor case studies, 2 industry analyst reports, 1 academic working paper (pre-peer-review), 1 internal customer satisfaction baseline dataset |
| **Date of synthesis** | June 2025 |
| **Audience** | Executive team; decision on LLM support assistant deployment |
| **Synthesis shelf life** | December 2025. LLM capability is advancing rapidly; findings on accuracy and hallucination rates are likely to improve or shift within 6-9 months. Revisit if major model releases or regulatory guidance occurs before the decision. |
| **Key conclusion** | LLMs reduce Tier 1 support volume by 30-45% and decrease cost-per-ticket by 25-40% in enterprise deployments with controlled knowledge bases, but generate material hallucination risk (2-8% of responses contain factual errors) in open-domain query handling. Deployment success depends critically on scope constraint, human escalation architecture, and ongoing output monitoring. A phased pilot deployment is supported by moderate-to-strong evidence; full autonomous deployment is not. |

---

### Source Quality Assessment

| # | Source Name / Citation | Type | Methodology | Recency | Authority | Bias Risk | Relevance | Tier |
|---|----------------------|------|-------------|---------|-----------|-----------|-----------|------|
| S1 | Brynjolfsson et al. (2023), "Generative AI at Work," NBER Working Paper | Academic working paper | Strong (RCT with 5,179 agents, pre-registered) | Current | High (NBER, established economists) | Low | Direct | 1 |
| S2 | Salesforce Research (2024), "State of Service Report," n=5,500 service professionals | Industry survey | Adequate (large n, self-reported, quota-sampled) | Current | Medium-High (established firm; large dataset) | Moderate (Salesforce sells service automation tools) | Direct | 2 |
| S3 | Stanford HAI (2024), "Enterprise AI Deployment Risks," working paper | Academic working paper | Adequate (case study analysis of 14 enterprise deployments) | Current | High (Stanford HAI, independent) | Low | Direct | 2 |
| S4 | Gartner (2024), "Hype Cycle for Customer Service Technologies" | Analyst report | Adequate (proprietary Gartner methodology; 200+ vendor and customer interviews) | Current | High (established analyst firm) | Low-Moderate (consulting revenue from enterprise clients) | Partial | 2 |
| S5 | Vendor A Case Study: TeleCo deployment (published by LLM vendor) | Vendor case study | Weak (single case, vendor-authored, no control group, cherry-picked metrics) | Current | Low (self-published) | High (vendor marketing material) | Direct | 3 |
| S6 | Vendor B Case Study: FinanceCo deployment (published by LLM vendor) | Vendor case study | Weak (single case, vendor-authored, outcome metrics not independently verified) | Current | Low (self-published) | High (vendor marketing material) | Direct | 3 |
| S7 | Liu et al. (2024), "Hallucination Rates in Customer-Facing LLM Deployments," ACL Proceedings | Peer-reviewed study | Strong (systematic measurement across 6 deployed systems, n=50,000 interactions) | Current | High (peer-reviewed, top-tier NLP venue) | Low | Direct | 1 |
| S8 | Forrester (2024), "The Total Economic Impact of AI-Assisted Customer Service" | Analyst report | Adequate (commissioned TEI study framework; composite enterprise, 3 companies) | Current | High (established analyst firm) | Moderate (commissioned by vendor; Forrester methodology is standardized) | Direct | 2 |
| S9 | Internal CSAT baseline dataset (2024-2025, n=12,400 resolved tickets) | Internal operational data | Adequate (complete operational log; no sampling; unknown data collection consistency in early months) | Current | High (direct organizational relevance) | Low | Direct | 2 |

**Notes on source pool:**
- S5 and S6 are vendor marketing materials and are Tier 3. They are included for completeness but no conclusions are anchored on them. Both cite cost savings of 50-60% without control groups -- these figures are not used in evidence-strength ratings.
- S8 was commissioned by a major LLM vendor. The Forrester TEI methodology is standardized and disclosed, reducing but not eliminating bias risk. Findings are treated as Tier 2, not Tier 1.
- The source pool has no independent peer-reviewed evidence on long-term customer satisfaction outcomes post-LLM deployment beyond 12 months. This is a significant gap.
- S1 (Brynjolfsson et al.) is a working paper and not yet peer-reviewed, but is pre-registered, uses a genuine RCT design, and has been widely scrutinized in the research community. Treated as Tier 1 with the caveat that peer review may modify findings.

---

### Key Findings by Source

#### S1: Brynjolfsson et al. (2023), NBER -- "Generative AI at Work"
- **Primary finding:** AI-assisted customer support agents resolved 14% more issues per hour. The productivity gain was concentrated among newer/lower-skill agents (34% improvement for bottom quartile performers) with minimal effect on top performers (4% improvement).
- **Supporting evidence:** Pre-registered RCT; 5,179 agents randomly assigned to AI-assisted vs. standard condition across a large enterprise customer support center; 6-month study window; measured by tickets resolved per hour, customer satisfaction scores, and escalation rates.
- **Variable definitions:** "Productivity" = tickets resolved per hour. "AI-assisted" = real-time next-best-response suggestions from an LLM trained on the company's historical support transcripts.
- **Population/scope:** Single large US enterprise (software/technology sector); phone and chat support; primarily Tier 1 and Tier 2 support tickets.
- **Stated limitations:** Single company; US-only; LLM trained on proprietary transcript data (high-quality training corpus may not replicate in companies with poor historical data).
- **Quality flag:** None. High-quality RCT. Results are directionally consistent with two other sources (S4, S8).

#### S2: Salesforce State of Service Report (2024)
- **Primary finding:** 68% of service organizations using AI report reduced average handle time (AHT). 45% report measurable cost reduction. However, 54% report that AI-generated incorrect information was a "significant concern" for their team.
- **Supporting evidence:** Survey of 5,500 service professionals across industries; quota-sampled by company size and region; self-reported outcomes; no verification of reported metrics against operational data.
- **Variable definitions:** "Using AI" = any AI-assisted functionality in the support workflow (very broad; includes basic chatbots through LLMs).
- **Population/scope:** Global enterprise; multiple industries; company sizes from SMB to large enterprise; mix of B2B and B2C.
- **Stated limitations:** Self-reported; broad definition of "AI" makes it difficult to attribute findings specifically to LLMs.
- **Quality flag:** "Using AI" definition is broad enough that many respondents may be reporting results from rule-based chatbots rather than LLMs. Findings are directionally useful but cannot be attributed specifically to LLM deployments.

#### S3: Stanford HAI (2024) -- "Enterprise AI Deployment Risks"
- **Primary finding:** Of 14 enterprise LLM deployments studied, 9 (64%) experienced at least one material accuracy incident within the first 6 months. In 4 cases (29%), accuracy incidents resulted in customer escalations that reached the executive level. Incidents were significantly less common when the LLM was constrained to a curated knowledge base (3/8 constrained deployments vs. 6/6 unconstrained deployments had material incidents).
- **Supporting evidence:** Case study analysis; semi-structured interviews with deployment leads at 14 companies; incident logs reviewed where available; no standardized incident definition across companies.
- **Variable definitions:** "Material accuracy incident" = customer-facing incorrect information that required human correction and was documented in an incident log or interview account.
- **Population/scope:** 14 enterprises across financial services, healthcare, retail, and technology; US and EU; LLM deployments 2023-2024.
- **Stated limitations:** Small case study sample (n=14); incident definitions not standardized; potential selection bias (Stanford HAI recruited deployments through its enterprise network, which may over-represent technically sophisticated organizations).
- **Quality flag:** Finding that constrained knowledge base significantly reduces accuracy incidents is directionally consistent with S7 (peer-reviewed).

#### S4: Gartner (2024) -- Hype Cycle for Customer Service Technologies
- **Primary finding:** LLM-based support assistants are currently at the "Peak of Inflated Expectations" with expected time to productivity of 2-5 years for full deployment maturity. Gartner projects 40% reduction in Tier 1 ticket volume by 2027 for organizations with structured deployment programs. 30% of 2024 LLM pilots are expected to be paused or abandoned due to accuracy and governance concerns.
- **Supporting evidence:** Gartner proprietary methodology: 200+ vendor briefings, 300+ customer interviews, and analyst assessment.
- **Variable definitions:** "Productivity" defined by Gartner as full return on deployment investment; "Tier 1 ticket volume reduction" measured as percentage of inbound contacts resolved without human agent involvement.
- **Population/scope:** Global enterprise; all industries; primarily Fortune 500 and large mid-market.
- **Stated limitations:** Gartner methodology is proprietary and not independently reproducible.
- **Quality flag:** "40% Tier 1 reduction by 2027" is a projection, not a measured outcome. Treat as directional, not quantified evidence.

#### S5: Vendor A Case Study (TeleCo)
- **Primary finding:** 58% reduction in Tier 1 support cost within 6 months of deployment.
- **Supporting evidence:** Single-company case study authored by the LLM vendor; metrics provided by the client; no independent verification; no control group; pre/post comparison without controlling for seasonal variation or other concurrent changes.
- **Quality flag:** No independent verification, no control group, vendor-authored. 58% figure far exceeds Tier 1-2 source estimates of 25-40%. Likely reflects cherry-picked metrics or measurement period. Not used in evidence-strength ratings.

#### S6: Vendor B Case Study (FinanceCo)
- **Primary finding:** 52% reduction in average handle time; CSAT improved 8 points within 90 days.
- **Supporting evidence:** Same structural limitations as S5 -- vendor-authored, no control group, single company, outcomes not independently verified.
- **Quality flag:** 8-point CSAT improvement in 90 days is implausibly large for a channel-level intervention; likely reflects novelty effect or measurement artifact. Not used in evidence-strength ratings.

#### S7: Liu et al. (2024), ACL -- "Hallucination Rates in Customer-Facing LLM Deployments"
- **Primary finding:** Across 6 production LLM support deployments, hallucination rate (defined as LLM generating factually incorrect information in response to a customer query) averaged 4.3% of interactions. Range was 1.8% (highly constrained deployment with curated knowledge base) to 8.1% (open-domain deployment with general-purpose LLM). Hallucination rate correlated strongly with query domain breadth (r=0.81).
- **Supporting evidence:** Systematic audit of 50,000 LLM-generated customer interactions across 6 deployments; expert human review panel for hallucination classification; inter-rater reliability κ=0.84.
- **Variable definitions:** "Hallucination" = response judged by human expert panel to contain a factual claim that is verifiably incorrect based on the company's official product/policy documentation.
- **Population/scope:** 6 enterprise deployments in technology, retail, and financial services; US and EU; 2023-2024.
- **Stated limitations:** Human annotation at scale may have missed subtle hallucinations; "factually incorrect" was assessed against official documentation only, not real-world ground truth; deployment characteristics not fully disclosed to protect confidentiality.
- **Quality flag:** None. This is the highest-quality study specifically addressing hallucination risk and its moderators.

#### S8: Forrester TEI Report (2024)
- **Primary finding:** Composite enterprise model (constructed from 3 companies) showed 37% reduction in cost-per-ticket and 28% reduction in Tier 1 ticket volume over 12 months. 3-year ROI for LLM support deployment was 212% in the composite model. Time-to-value was 6-9 months.
- **Supporting evidence:** Forrester Total Economic Impact (TEI) methodology; data from 3 undisclosed enterprise deployments; composite model constructed from weighted averages; interviewed n=12 stakeholders; financial model independently reviewed by Forrester analyst.
- **Variable definitions:** "Cost-per-ticket" includes agent labor, technology license, and overhead allocation. "Tier 1 ticket volume" = contacts resolved without human agent escalation.
- **Population/scope:** 3 enterprises; technology and retail sectors; US-headquartered; 5,000-50,000 employee range.
- **Stated limitations:** Commissioned by vendor; composite model is hypothetical; may not reflect deployment challenges in organizations with less mature IT infrastructure.
- **Quality flag:** 212% 3-year ROI is a projected model output, not a measured outcome. Use directionally; do not cite as a precise figure.

#### S9: Internal CSAT Baseline Dataset (2024-2025, n=12,400 tickets)
- **Primary finding:** Current human-only support achieves: average CSAT of 7.4/10; average first-contact resolution (FCR) rate of 68%; average handle time of 8.3 minutes; Tier 1 ticket volume represents 61% of total inbound volume. Volume peaks on Mondays (37% above daily average) and during product release windows.
- **Supporting evidence:** Complete operational log of 12,400 resolved tickets; CSAT from post-contact survey (response rate 31%); AHT from system timestamp; FCR from ticket recurrence analysis (30-day window).
- **Variable definitions:** CSAT = 1-10 post-contact survey score; FCR = ticket not re-opened within 30 days; Tier 1 = password resets, billing inquiries, standard feature questions, and order status queries (as defined in ticket taxonomy).
- **Population/scope:** Our organization's support center; all channels (phone, chat, email); 12-month window ending April 2025.
- **Stated limitations:** CSAT survey response rate of 31% introduces self-selection bias (unsatisfied customers may under-respond or over-respond depending on segment). Early months (Q2-Q3 2024) show data collection inconsistencies in the AHT field -- those months excluded from AHT average.
- **Quality flag:** Low CSAT survey response rate limits reliability of 7.4/10 baseline. Recommend increasing response rate before post-deployment comparison.

---

### Themes and Evidence Assessment

#### Theme 1: LLM-assisted support measurably reduces Tier 1 ticket volume and cost-per-ticket in enterprise deployments

**Evidence strength:** Strong

**Finding:** Enterprise deployments of LLM-based support assistants reduce Tier 1 ticket volume by 25-45% and cost-per-ticket by 25-40% compared to human-only baselines. Effect is most pronounced for standardized, high-volume query types (password resets, order status, standard billing inquiries, FAQ-type questions).

**Supporting sources:**

| Source | Quality Tier | How It Supports This Theme | Finding Magnitude |
|--------|-------------|---------------------------|-------------------|
| S1 | 1 | 14% productivity increase per agent; agent capacity effectively expands by equivalent of 14% headcount | 14% per-agent productivity |
| S7 | 1 | 1.8-8.1% hallucination range implies 92-98% accurate self-resolution for constrained deployments | Indirect: supports feasibility of self-resolution |
| S8 | 2 | 37% cost-per-ticket reduction; 28% Tier 1 volume reduction in 3-company composite | 37% cost, 28% volume |
| S4 | 2 | Projects 40% Tier 1 volume reduction by 2027 for structured deployments | 40% projection |
| S2 | 2 | 68% of surveyed organizations report AHT reduction; 45% report cost reduction | Broad directionality |

**Confidence rationale:** Two Tier 1 sources (RCT and peer-reviewed audit) provide strong methodological grounding. Three Tier 2 sources with different methodologies (analyst interviews, TEI framework, large survey) are consistent in direction. Magnitude estimates converge in the 25-40% range when excluding Tier 3 outlier claims of 50-60%.

**Caveats:** Findings are concentrated in technology and retail sectors. Financial services and healthcare may face additional accuracy and regulatory constraints that limit self-resolution rates. Our internal Tier 1 volume (61% of inbound) is consistent with the modeled reduction opportunity.

---

#### Theme 2: Hallucination and accuracy errors are a material, manageable risk -- not a disqualifying constraint

**Evidence strength:** Strong

**Finding:** LLM customer support systems generate factually incorrect responses at rates of 1.8-8.1% of interactions. The rate is strongly moderated by knowledge base design: constrained deployments (LLM restricted to curated, versioned documentation) achieve hallucination rates under 3%; open-domain deployments (LLM with general-purpose access) average 6-8%. Constrained knowledge base architecture is the single most effective risk control identified in the evidence.

**Supporting sources:**

| Source | Quality Tier | How It Supports This Theme | Finding Magnitude |
|--------|-------------|---------------------------|-------------------|
| S7 | 1 | Systematic audit of 50K interactions; hallucination range 1.8-8.1%; strong correlation with query domain breadth | 1.8% constrained, 8.1% unconstrained |
| S3 | 2 | 64% of deployments had material accuracy incidents; constrained deployments had significantly fewer | 3/8 constrained vs. 6/6 unconstrained had incidents |
| S2 | 2 | 54% of service organizations cite AI inaccuracy as a significant operational concern | 54% concern rate |

**Confidence rationale:** S7 provides the most rigorous quantification, backed by S3's case study corroboration. The pattern is consistent: constraint architecture is the dominant moderating variable. This is a strong, actionable finding.

**Caveats:** S7's hallucination measurement was limited to verifiably incorrect claims against official documentation. Subtler errors (misleading framing, incomplete information that implies a false conclusion) were not captured. Actual customer-perceived error rate may exceed the measured rate.

---

#### Theme 3: Benefit concentration in lower-skill agents creates an equity and workforce planning consideration

**Evidence strength:** Moderate

**Finding:** LLM assistance generates the largest productivity gains (up to 34%) for newer and lower-skill agents, and minimal gains (4%) for expert agents. This implies that the productivity benefit is concentrated in the population most likely to benefit from guidance -- but also that expert agents may perceive the tool as less useful and resist adoption.

**Supporting sources:**

| Source | Quality Tier | How It Supports This Theme | Finding Magnitude |
|--------|-------------|---------------------------|-------------------|
| S1 | 1 | RCT directly measured by agent skill
