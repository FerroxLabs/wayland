---
name: sentiment-analysis-guide
description: |
  Designs a sentiment analysis approach for text data by selecting the method (lexicon-based vs. model-based), defining sentiment categories, specifying the output format, and producing an interpretation guide for the results.
  Use when the user asks to analyze sentiment in customer reviews, social media posts, support tickets, employee feedback, or any text corpus for positive, negative, and neutral tone.
  Do NOT use for manual qualitative coding of interviews (use qualitative-coding), survey question design (use survey-design), or general text mining beyond sentiment (use text-mining-protocol).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "research analysis ai-ml"
  category: "data-analysis"
  subcategory: "research-analysis"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Sentiment Analysis Guide

## When to Use

**Use this skill when:**
- A user has a corpus of text -- customer reviews, social media posts, support tickets, employee pulse surveys, NPS verbatims, or news mentions -- and wants to classify that text by emotional tone or polarity
- A user wants to compare sentiment across time periods (e.g., before and after a product launch, before and after a policy change) and needs a consistent classification framework
- A user wants to route or triage text based on sentiment (e.g., escalate negative support tickets, flag distressed employee feedback, prioritize urgent complaints)
- A user asks which sentiment method to use for their data and has not yet committed to an implementation approach
- A user wants to build a recurring sentiment monitoring system with alerts, dashboards, and trend reporting
- A user needs to produce aspect-level sentiment (what do customers feel specifically about pricing, shipping, customer service, product quality) rather than just an overall polarity score
- A user wants to validate or audit an existing sentiment system they already have in place

**Do NOT use when:**
- The user wants to conduct manual qualitative analysis of interview transcripts, focus group recordings, or open-ended survey responses with thematic coding -- use `qualitative-coding` instead
- The user wants to design the survey or text collection instrument (the questions themselves) -- use `survey-design` instead
- The user wants text mining beyond sentiment: keyword frequency analysis, topic modeling with LDA or BERTopic, named entity recognition, or document clustering -- use `text-mining-protocol` instead
- The user wants to build a full competitive intelligence system that incorporates sentiment as one signal among many (pricing, market share, product features) -- use `competitive-intelligence` instead
- The user wants to build the machine learning model from scratch (data labeling pipelines, model training loops, hyperparameter tuning, serving infrastructure) -- this skill designs the analysis approach, not the engineering implementation
- The user is analyzing structured data (star ratings, Likert scale scores, numeric fields) -- those are already quantified sentiment proxies and require descriptive statistics, not sentiment analysis

---

## Process

### Step 1: Characterize the Text Corpus and Define the Business Goal

Before selecting any method, extract precise information about the data and the decision it will drive. The wrong method for a corpus produces results that are confidently wrong -- garbage that looks rigorous.

- **Establish data volume precisely:** The dividing lines that matter are approximately 500 texts (below this, manual annotation is feasible and often better), 10,000 texts (above this, manual review of the full corpus is impractical), and 1,000,000+ texts (at this scale, computational efficiency becomes a hard constraint alongside accuracy)
- **Identify the text type and average length:** Tweets and app store reviews (15-80 words) behave differently than Amazon reviews (50-300 words), which behave differently than support tickets (100-500 words with structured fields), which behave differently than long-form customer essays or complaint letters (500+ words). Length affects which models perform best and whether aspect extraction is feasible
- **Assess language characteristics:** Is the corpus single-language, or multilingual? Does it contain domain-specific jargon (medical terminology, legal language, financial acronyms, gaming slang)? Does it contain heavy use of abbreviations, emoji, hashtags, or informal spelling (critical for social media)? Each characteristic narrows the method selection
- **Clarify the action the sentiment labels will drive:** Sentiment for a product dashboard (informational) requires different accuracy and confidence thresholds than sentiment used to automatically escalate support tickets to a legal team (consequential). Higher stakes demand higher accuracy minimums and mandatory human review steps
- **Determine if aspect-level granularity is needed:** If the user says "I want to know what customers think about our app," ask whether they need to distinguish between what customers think about performance, design, pricing, and support separately -- or whether an overall positive/negative/neutral score is sufficient. Aspect-based analysis adds 30-50% more complexity and typically reduces per-aspect accuracy by 5-15% compared to overall sentiment accuracy
- **Establish the baseline sentiment distribution expectation:** Product reviews on curated platforms skew positive (60-75% positive is typical for well-rated products). Support tickets skew negative (50-70% negative is typical). Social media brand mentions are typically mixed (30-40% positive, 30-40% neutral, 20-30% negative for established brands). This baseline affects threshold calibration and alert configuration

---

### Step 2: Select the Sentiment Analysis Method

Match the method to the data profile established in Step 1. Present the trade-offs explicitly rather than jumping to a recommendation. The four primary methods have distinct accuracy profiles, implementation cost, transparency properties, and failure modes.

**Lexicon-Based Methods**
- Use pre-built sentiment word lists (VADER, SentiWordNet, AFINN, Bing Liu's Opinion Lexicon) where each word or phrase is assigned a polarity score (e.g., AFINN assigns "love" +3, "hate" -3, "okay" +1)
- VADER (Valence Aware Dictionary and sEntiment Reasoner) is the strongest general-purpose lexicon because it handles intensifiers ("very good" vs. "good"), negation ("not good"), capitalization ("GREAT"), and punctuation ("great!!!")
- Typical accuracy range: 65-75% on standard benchmarks, dropping to 55-65% on domain-specific text where jargon is common
- Recommended when: the corpus is small (fewer than 500 texts), the user needs to inspect every classification decision (regulated industries, HR contexts), or computational infrastructure is minimal
- Fatal weaknesses: sarcasm, negation in complex constructions ("I wouldn't say this is anything but terrible"), comparative sentiment ("better than their competitors but still disappointing"), and slang/emoji

**Pre-Trained Transformer Models (Off-the-Shelf)**
- Models fine-tuned on large sentiment datasets and available without further training: distilBERT-base-uncased-finetuned-sst-2-english (binary), cardiffnlp/twitter-roberta-base-sentiment (ternary, Twitter-optimized), nlptown/bert-base-multilingual-uncased-sentiment (multilingual, 5-class)
- Typical accuracy range: 80-90% on general text, 85-92% on the domain they were trained on (Twitter models on Twitter data, review models on review data)
- The critical matching rule: use a model trained on text similar to yours. A model trained on movie reviews applied to medical support tickets will underperform by 10-20 percentage points
- Recommended when: data volume is between 500 and 50,000 texts, the text type matches a well-represented training domain, and the user cannot invest in labeled training data
- Weaknesses: reduced transparency (no simple explanation of why a text was classified as negative), requires Python/API access, and performs poorly on highly specialized jargon not present in training data

**Fine-Tuned Domain-Specific Models**
- Take a pre-trained transformer (typically a BERT variant) and continue training it on labeled examples from the user's specific domain
- Minimum viable labeled dataset: 200 examples per class (600 total for ternary, 1,000 total for aspect-based). Optimal performance typically reached at 1,000-2,000 examples per class
- Typical accuracy range: 85-95% when the labeled data quality is high and representative
- Data labeling cost estimate: at $0.05-0.15 per label using crowd-sourced platforms, labeling 2,000 examples costs $100-300. With inter-annotator agreement protocol (each example labeled by 3 annotators), multiply cost by 3
- Recommended when: domain jargon is heavy and common (medical, legal, finance, gaming), the corpus exceeds 50,000 texts and will continue growing, or accuracy requirements exceed 85%
- Weaknesses: requires labeled training data, technical ML infrastructure, model versioning and retraining as language drifts

**Hybrid Approaches**
- Pattern 1 -- Lexicon bootstrapping with ML refinement: Run VADER to get initial classifications, then use a small fine-tuned model only for texts where VADER confidence is below 0.65. This reduces annotation needs by 40-60% while recovering most of the accuracy benefit
- Pattern 2 -- Rule-based overrides on ML output: Apply the ML model as the primary classifier, then apply deterministic rules for known failure modes (e.g., if text contains "sarcasm markers" identified by a rule set, route to manual review regardless of ML score)
- Pattern 3 -- Ensemble: Average predictions from two independent models (e.g., VADER and a BERT model). Ensemble typically adds 2-5 percentage points of accuracy over either model alone
- Recommended when: transparency and accuracy are both required, or when the corpus has clearly defined subsegments that respond differently to different methods (short emoji-heavy social media posts + long detailed product reviews)

**Decision Framework Summary:**

| Corpus Size | Domain Specificity | Recommended Method | Expected Accuracy |
|---|---|---|---|
| < 500 texts | General | Lexicon (VADER) | 65-75% |
| < 500 texts | Specialized | Lexicon + manual review | 70-80% with review |
| 500-10,000 texts | General | Pre-trained transformer | 80-90% |
| 500-10,000 texts | Specialized | Pre-trained + rule overrides | 75-85% |
| > 10,000 texts | General | Pre-trained transformer | 82-90% |
| > 10,000 texts | Specialized | Fine-tuned model | 85-95% |
| Any size | High stakes / consequential | Any method + human review for low-confidence | Method accuracy + 5-10% after review |

---

### Step 3: Define Sentiment Categories and Their Operational Meaning

Generic sentiment labels ("positive", "negative", "neutral") are insufficient. Every label must be operationally defined for the specific domain so the user knows exactly what the label means and what action it implies.

- **Binary (Positive / Negative):** Use only when the goal is binary triage (escalate vs. do not escalate, respond vs. do not respond). Dropping the neutral category forces ambiguous texts into one of two buckets and inflates both false positives and false negatives. Acceptable when the volume is very high and a missed neutral-as-negative causes no harm
- **Ternary (Positive / Neutral / Negative):** The standard for most business use cases. Define neutral explicitly -- it is not "the absence of opinion" but rather a specific class: factual statements, mixed positive/negative statements that cancel out, questions without emotional valence, or status updates. "My order arrived" is neutral. "My order arrived late but the product itself is great" is mixed-neutral. Do not conflate these two sub-types
- **Five-Point (Very Negative / Negative / Neutral / Positive / Very Positive):** Use when intensity drives different actions (a "very negative" review about a safety issue warrants immediate escalation; a "slightly negative" review about confusing documentation warrants documentation team review). Requires more training data to distinguish adjacent classes reliably -- the accuracy gap between ternary (80-90%) and five-point (70-82%) is typically 8-12 percentage points
- **Aspect-Based Sentiment Analysis (ABSA):** Identify the target entity or feature within the text (the aspect) and the sentiment toward that specific aspect. A review saying "The battery lasts forever but the camera produces blurry photos" contains two aspects: battery (positive) and camera (negative). The overall classification of "mixed/neutral" hides the actionable signal. Aspect categories must be domain-defined (not generic) and exhaustive enough to capture the main drivers

**Defining Aspect Categories (ABSA):**
- Derive aspects from your domain knowledge first, then validate against a random sample of 50-100 texts
- Aim for 5-10 aspect categories -- fewer than 5 is probably too coarse; more than 10 creates sparse data and overlapping categories
- For each aspect: define 5-15 seed keywords or phrases that indicate the aspect is being discussed. These seed keywords anchor the extraction logic
- Include an "Other/Uncategorized" aspect for text that discusses the product/service but does not map to any defined aspect
- Define the confidence threshold below which the aspect assignment should not be trusted (typically 0.55 for aspect extraction vs. 0.65 for overall sentiment, because aspect extraction is harder)

---

### Step 4: Specify the Output Schema

Define every field that will be produced for each text record. Ambiguous output schemas lead to downstream analysis errors and make it impossible to reproduce results.

- **Required fields for all sentiment analyses:** a stable unique identifier for the text (not just row number, which changes if data is re-sorted), the original text (never overwrite), the sentiment label, the confidence score as a float between 0 and 1, and the analysis timestamp
- **Confidence score interpretation framework:** Define three tiers -- High Confidence (≥ 0.80): classification is reliable, include in automated workflows; Medium Confidence (0.60-0.80): include in aggregate statistics but do not use for individual automated actions without human review; Low Confidence (< 0.60): route to manual review queue, do not use in aggregated metrics until reviewed (including low-confidence texts in averages distorts the aggregate)
- **For ABSA:** the aspects field is a list of objects, not a flat string. Each object contains: aspect_name (standardized label from the taxonomy), aspect_sentiment (positive/neutral/negative), aspect_confidence (float), and the supporting_phrase (the exact text span that triggered the aspect and its sentiment)
- **Metadata fields:** Include source (platform or data feed name), collection_date, text_length_tokens (useful for filtering out texts that are too short to classify reliably), and a manual_review_flag boolean that systems can set to true when confidence is below threshold
- **Version field:** Include the model_version or lexicon_version used for classification. When the model is updated, you need to be able to identify which records were classified by which version -- otherwise trend comparisons become meaningless

---

### Step 5: Design the Validation Protocol

No sentiment system should go into production without empirical accuracy validation against the target domain. Published benchmark accuracies are measured on benchmark datasets -- your data will differ.

- **Sample size for validation:** For corpora under 10,000 texts, manually review 10% or 100 texts, whichever is larger. For corpora over 10,000 texts, 200-300 manually reviewed texts is sufficient if sampled representatively. Use stratified sampling: sample proportionally from each sentiment class (do not sample uniformly at random -- this under-represents minority classes like neutral)
- **Inter-annotator reliability:** If more than one person is labeling the validation sample, measure Cohen's Kappa. A Kappa below 0.60 indicates the labeling instructions are ambiguous -- revise definitions before computing accuracy. A Kappa of 0.70-0.80 is acceptable; 0.80+ is good
- **Accuracy metrics to report:** Do not report only overall accuracy -- it is misleading when classes are imbalanced. Report precision, recall, and F1-score per class. For a corpus that is 70% positive, an "accuracy" of 72% could be achieved by classifying everything as positive. F1-score per class reveals this problem
- **Confusion matrix analysis:** The confusion matrix reveals systematic failure patterns. If the model consistently classifies "neutral" as "positive" (high neutral-to-positive confusion), investigate whether the neutral category definition is ambiguous or whether the model training data underrepresented neutral examples
- **Accuracy thresholds by use case:** For informational dashboards, 75%+ overall accuracy with F1 ≥ 0.70 per class is acceptable. For routing and triage systems, require ≥ 85% accuracy with F1 ≥ 0.80 for the negative class specifically (false negatives in the negative class mean missed escalations). For high-stakes decisions, require ≥ 90% accuracy with human review for all low-confidence cases
- **Validation cadence:** Run validation quarterly for static corpora. Run monthly if the text source is social media or covers rapidly evolving topics. Run immediately after any significant event (product launch, PR crisis, platform algorithm change) that might shift the language distribution

---

### Step 6: Document Known Failure Modes and Misclassification Patterns

Every sentiment system has predictable failure modes. Documenting them before deployment enables the user to design compensating controls rather than discovering failures during a production incident.

- **Sarcasm and irony:** The most common cause of false positives in negative contexts. Sarcasm typically has surface-level positive vocabulary ("wonderful," "fantastic," "can't get enough") with negative intent. No current automated system reliably detects sarcasm above 70% accuracy. The only reliable mitigation is human review of texts that score high-positive from users with a history of negative scores, or texts where positive sentiment conflicts with a 1-star rating
- **Negation in complex constructions:** Simple negation ("not good") is handled well by VADER and transformers. Negation in conditional constructions ("if this weren't so expensive, I'd actually love it"), double negatives ("not entirely without merit"), and distant negation ("this app, despite all the promises, is not worth a cent") defeat most systems. Flag texts containing negation markers (not, never, neither, barely, hardly, without) for elevated manual review rates
- **Comparative and contrastive language:** "Better than I expected" can be classified as positive even if expectations were extremely low. "Worse than [Competitor]" can be classified as negative even if the product is acceptable. Comparatives are especially problematic for brand sentiment -- "the worst of the good options" and "the best of the bad options" have opposite surface polarity but may warrant the same business response
- **Domain jargon with atypical sentiment valence:** In medical contexts, "positive" (as in "tested positive") is negative sentiment. In financial contexts, "short" can be positive for investors. In gaming, "broken" is sometimes used affectionately. Build a domain override list of words whose sentiment polarity differs from their general-language polarity, and apply these overrides before the main classifier
- **Truncated or low-information texts:** Texts with fewer than 5 words should be assigned a "low_information" flag and not be classified automatically. Single-word reviews ("Terrible"), single-emoji reviews, and texts that are entirely punctuation or whitespace are frequent in social media data and skew results if classified uncritically
- **Temporal language and future tense:** "Will never buy again" is negative sentiment despite containing no negative sentiment words. "Hope this gets better" is ambiguous. "Used to love this product" implies a shift from positive to negative. Temporal constructions require special attention in rules or fine-tuning

---

### Step 7: Design the Monitoring and Reporting Framework

For ongoing sentiment tracking (as opposed to a one-time analysis), define the metrics, aggregation periods, visualization types, and alert thresholds that will make the system actionable.

- **Primary metrics:** Sentiment distribution (% positive, % neutral, % negative per time period), net sentiment score (% positive minus % negative, analogous to NPS, ranges from -100 to +100), average confidence score per period (a drop in average confidence signals language drift), and text volume per period (always pair sentiment percentages with volume -- 80% negative from 5 texts is not the same as 80% negative from 500 texts)
- **Aggregation periods:** Define the primary period (daily, weekly, monthly) based on data volume. A minimum of 30 texts per aggregation period is needed for percentage statistics to be stable. If daily volume is below 30, aggregate weekly. If weekly volume is below 30, aggregate monthly and note that trend detection is slow
- **Trend visualization:** A rolling average smooths noise without hiding important shifts. Use a 7-day rolling average for daily data, a 4-week rolling average for weekly data. Overlay key events (releases, announcements, incidents) as vertical markers on trend charts -- otherwise sentiment shifts are uninterpretable
- **Aspect trend heatmap:** For ABSA systems, a heatmap with aspects on rows and time periods on columns, colored by net sentiment, instantly reveals which aspects are improving or deteriorating over time
- **Alert thresholds:** Base alert thresholds on the historical baseline, not arbitrary round numbers. A baseline of 20% negative with a standard deviation of 5% means a threshold of 30% (2 standard deviations above mean) is a meaningful signal. A corpus that runs at 50% negative normally should not trigger an alert at 30%. Compute the baseline from at least 4 weeks of data before setting thresholds
- **Alert tiers:** Define at least two tiers -- a Watch alert (1.5 standard deviations above baseline negative percentage: "monitor closely") and a Critical alert (2.5 standard deviations above baseline: "escalate immediately"). Single-threshold systems produce either too many false alarms (set too low) or miss real events (set too high)

---

### Step 8: Produce the Final Deliverable

Compile all decisions into the structured output document. The document is a complete specification that can be handed to a data team, an ML engineer, or a business analyst and implemented without further clarification.

- Review the method selection against the actual corpus characteristics one final time -- confirm volume, domain specificity, and stakes level match the chosen method
- Confirm every sentiment category has an operationally specific definition with at least one positive example and one negative example from the actual domain
- Confirm the output schema includes all required fields including confidence, timestamps, and the manual review flag
- Confirm the validation protocol specifies who will do the manual review, what tool they will use to record labels, and what happens if accuracy falls below the threshold
- Confirm alert thresholds are derived from baseline data or clearly labeled as provisional pending 4+ weeks of baseline collection
- Include a brief implementation roadmap: which steps come first (data collection, labeling, method setup), what the expected timeline is, and what the first milestone looks like

---

## Output Format

```
## Sentiment Analysis Design: [Project Name]

### 1. Analysis Context

| Parameter | Value |
|---|---|
| Data source | [Platform, system, or feed where text is collected] |
| Text type | [Reviews / Tickets / Posts / Verbatims / Other] |
| Average text length | [Approximate word count range] |
| Language(s) | [English / Multilingual -- specify languages] |
| Data volume | [N texts currently; N new texts per day/week/month] |
| Analysis goal | [What decision or action this analysis informs] |
| Granularity needed | [Overall polarity / Aspect-based] |
| Stakes level | [Informational / Routing and triage / High-stakes consequential] |
| Baseline sentiment estimate | [% positive / neutral / negative based on domain knowledge] |

---

### 2. Method Selection

**Selected Method:** [Lexicon-Based (VADER) / Pre-Trained Transformer / Fine-Tuned Model / Hybrid]

**Method Rationale:**
[2-4 sentences explaining why this method matches the specific data volume, domain, text type, and stakes level described in Section 1]

**Implementation Reference:**
- Tool/model: [VADER via Python nltk.sentiment / cardiffnlp/twitter-roberta-base-sentiment / nlptown/bert-base-multilingual-uncased-sentiment / custom fine-tuned BERT]
- Serving: [Local Python script / REST API / batch processing pipeline]
- Processing rate: [Estimated texts per second or minute for the chosen method]

**Expected Performance:**

| Metric | Expected Value | Condition |
|---|---|---|
| Overall accuracy | [65-75% / 80-90% / 85-95%] | [General domain / domain-matched / fine-tuned] |
| Positive class F1 | [Estimated range] | Based on method |
| Negative class F1 | [Estimated range] | Based on method |
| Neutral class F1 | [Estimated range -- typically lowest] | Neutral is hardest to classify |
| Confidence ≥ 0.80 coverage | [% of texts expected to exceed threshold] | Depends on domain clarity |

**Known Limitations:**
- [Specific failure mode 1 for this method on this data type]
- [Specific failure mode 2]
- [Specific failure mode 3]

---

### 3. Sentiment Category Definitions

**Classification Scheme:** [Ternary / Binary / Five-Point / Aspect-Based]

| Label | Operational Definition | Score Range | Positive Example | Negative Example (text that is NOT this class) |
|---|---|---|---|---|
| Positive | [Domain-specific: what constitutes positive sentiment in this corpus] | [0.65-1.0] | "[Real example from this domain]" | "[Borderline text that should NOT be classified positive]" |
| Neutral | [Domain-specific: what constitutes neutral -- include mixed-sentiment boundary case] | [0.40-0.65] | "[Real example from this domain]" | "[Borderline text that should NOT be classified neutral]" |
| Negative | [Domain-specific: what constitutes negative sentiment in this corpus] | [0.0-0.40] | "[Real example from this domain]" | "[Borderline text that should NOT be classified negative]" |

**[If ABSA: Aspect Taxonomy]**

| Aspect | Operational Definition | Seed Keywords | Example Positive | Example Negative |
|---|---|---|---|---|
| [Aspect 1] | [What this aspect covers and what it excludes] | [5-10 keywords] | "[Example]" | "[Example]" |
| [Aspect 2] | ... | ... | ... | ... |
| Other | Text discusses the product/service but no defined aspect applies | N/A | N/A | N/A |

---

### 4. Output Schema (Per Text Record)

| Field Name | Data Type | Required | Description | Example Value |
|---|---|---|---|---|
| text_id | string | Yes | Stable unique identifier -- not row number | "rev_20240315_00847" |
| source | string | Yes | Platform or data feed | "google_play" |
| original_text | string | Yes | Raw unmodified text | "App crashes every time I open it" |
| collection_date | date | Yes | When the text was collected | "2024-03-15" |
| analysis_timestamp | datetime | Yes | When classification ran | "2024-03-16T08:22:31Z" |
| model_version | string | Yes | Model or lexicon version used | "roberta-sentiment-v2.1" |
| overall_sentiment | string | Yes | Assigned sentiment label | "negative" |
| overall_confidence | float (0-1) | Yes | Classification confidence | 0.91 |
| manual_review_flag | boolean | Yes | True if confidence < 0.60 or other flag condition | false |
| text_length_tokens | integer | Yes | Number of tokens in text | 8 |
| [If ABSA] aspects | list of objects | Conditional | [{aspect, sentiment, confidence, phrase}] | See below |
| [If ABSA] aspects[].aspect_name | string | Conditional | Aspect label from taxonomy | "performance" |
| [If ABSA] aspects[].aspect_sentiment | string | Conditional | Aspect-level label | "negative" |
| [If ABSA] aspects[].aspect_confidence | float (0-1) | Conditional | Aspect classification confidence | 0.88 |
| [If ABSA] aspects[].supporting_phrase | string | Conditional | Text span triggering the aspect | "crashes every time I open it" |
| metadata_1 | [type] | Optional | [Domain-specific metadata field 1] | [Example] |
| metadata_2 | [type] | Optional | [Domain-specific metadata field 2] | [Example] |

---

### 5. Interpretation Guide

**Confidence Tiers:**

| Tier | Confidence Range | Interpretation | Recommended Action |
|---|---|---|---|
| High | ≥ 0.80 | Classification is reliable | Use in automated workflows and aggregate statistics |
| Medium | 0.60-0.80 | Classification is probable but uncertain | Include in aggregate statistics; do not use for automated individual-level actions |
| Low | < 0.60 | Classification is unreliable | Route to manual review queue; exclude from aggregate metrics until reviewed |

**Sentiment-to-Star-Rating Alignment (if applicable):**
- Expected alignment rate: [80-90%] of texts where both are available
- When sentiment and rating disagree: investigate for sarcasm (high-positive text + 1 star) or feature requests misclassified as positive (neutral intent classified as positive)

**Known Misclassification Patterns for This Domain:**

| Pattern | Description | Estimated Frequency | Mitigation |
|---|---|---|---|
| [Pattern 1] | [What the pattern looks like] | [~X% of corpus] | [How to handle it] |
| [Pattern 2] | [What the pattern looks like] | [~X% of corpus] | [How to handle it] |
| [Pattern 3 -- sarcasm] | [Context where sarcasm appears in this domain] | [~X% of corpus] | Manual review if positive sentiment + negative rating |
| [Pattern 4 -- negation] | [Complex negation pattern specific to this domain] | [~X% of corpus] | Flag texts containing [specific negation markers] |

---

### 6. Validation Protocol

**Initial Validation (Before Production):**

1. Sample [N] texts using stratified random sampling: [N_pos] positive, [N_neut] neutral, [N_neg] negative (proportional to expected distribution)
2. Label each text manually using the category definitions in Section 3. If multiple labelers: compute Cohen's Kappa before using labels. Target Kappa ≥ 0.70
3. Run automated classification on the same sample
4. Compute per-class precision, recall, and F1. Compute overall accuracy and macro-average F1
5. **Pass threshold:** Overall accuracy ≥ [X]%, Negative class F1 ≥ [Y] (set based on stakes level: 0.75 for informational, 0.82 for triage, 0.88 for high-stakes)
6. If threshold is not met: inspect the confusion matrix for systematic failures, revise category definitions or apply domain overrides, re-run validation
7. Document final validation metrics in a version-controlled record

**Ongoing Validation (After Production):**
- Cadence: [Monthly / Quarterly] or immediately after major events
- Sample size per validation cycle: [N] texts
- Responsible party: [Who will conduct manual review]
- Tooling: [Google Sheet / Labelbox / custom annotation interface]
- Drift indicator: If average confidence score drops by more than 0.05 points sustained over 2 weeks, trigger re-validation

---

### 7. Monitoring Dashboard Specification

| Panel | Primary Metric | Aggregation | Visualization | Update Frequency |
|---|---|---|---|---|
| Sentiment Distribution | % positive / neutral / negative | [Daily/Weekly/Monthly] | Stacked bar chart | [Daily/Weekly] |
| Net Sentiment Trend | % positive minus % negative | 7-day or 30-day rolling average | Line chart with event markers | Daily |
| Volume by Sentiment | Count of texts per class per period | Same as primary | Stacked area chart | Daily |
| Confidence Health | % of texts in each confidence tier | Weekly | Stacked bar | Weekly |
| Aspect Sentiment Heatmap | Net sentiment per aspect per period | Monthly | Heatmap (aspects × months) | Monthly |
| Manual Review Queue | Texts with manual_review_flag = true | Live | Sortable table | Real-time |
| Alert Log | Triggered alerts with date and triggering metric | Per event | Table | Real-time |
| Release Impact | Sentiment 7 days pre vs. 7 days post each release | Per release | Before/after bar chart | Per release |

---

### 8. Alert Configuration

**Baseline (computed from first [4-8] weeks of production data):**
- Baseline negative percentage: [X]% (update after baseline period)
- Baseline standard deviation: [Y]%
- Baseline daily/weekly text volume: [N] texts

**Alert Thresholds:**

| Alert Name | Trigger Condition | Tier | Notification Channel | Response Protocol |
|---|---|---|---|---|
| Negative Watch | Negative % exceeds baseline + 1.5 SD | Watch | [Channel] | Monitor for 24-48 hours; no immediate action |
| Negative Critical | Negative % exceeds baseline + 2.5 SD | Critical | [Channel] | Escalate to [team/person] within [timeframe] |
| Volume Drop | Daily volume < 50% of baseline | Data quality | [Channel] | Investigate data pipeline; do not report sentiment |
| Confidence Degradation | Average confidence < [baseline_conf - 0.05] sustained ≥ 2 weeks | Quality | [Channel] | Trigger re-validation; consider model update |
| Post-Release Watch | Active for 7 days after any release; threshold lowered by 5% | Watch | [Channel] | Product team review of triggered texts |

---

### 9. Implementation Roadmap

| Phase | Activities | Duration | Milestone |
|---|---|---|---|
| 1. Data collection & cleaning | Set up data feed, remove duplicates, filter non-classifiable texts | [N weeks] | Clean corpus available |
| 2. Validation sample labeling | Manually label [N] texts, compute inter-annotator agreement | [N weeks] | Labeled validation set |
| 3. Method implementation | Implement chosen method, run on validation sample | [N weeks] | Accuracy metrics computed |
| 4. Threshold calibration | Set confidence tiers and alert thresholds based on validation | [1 week] | Thresholds documented |
| 5. Dashboard deployment | Build monitoring panels, connect data feed | [N weeks] | Live dashboard |
| 6. Baseline collection | Run system for [4-8] weeks to establish baseline metrics | [4-8 weeks] | Alert thresholds finalized |
| 7. Production sign-off | Final validation review, stakeholder approval | [1 week] | System in production |
```

---

## Rules

1. **Never report overall accuracy without per-class F1 scores.** A classifier achieving 80% overall accuracy on a corpus that is 75% positive can achieve that accuracy by classifying everything as positive -- this is completely useless. Always report precision, recall, and F1 separately for positive, neutral, and negative classes.

2. **Never conflate the confidence score with accuracy.** A confidence score of 0.90 means the model is 90% confident in its prediction -- it does not mean the prediction is 90% likely to be correct. In miscalibrated models, 0.90 confidence may correspond to only 70% real-world accuracy. Calibration must be validated separately by computing accuracy as a function of confidence tier.

3. **Neutral is not a default or fallback category.** "Neutral" is a real category with a specific meaning: factual, ambiguous, or balanced mixed-sentiment text. It must be defined as explicitly as positive and negative. Never use neutral as a catch-all for "low confidence" or "couldn't classify." Use a separate "unclassifiable" or "low_information" label for those cases.

4. **Aspect-based sentiment must preserve the supporting phrase, not just the label.** An aspect classification of "performance: negative" without the supporting phrase ("crashes on startup") is unactionable. Product teams need the specific language, not just the category, to understand and respond to feedback. Every aspect assignment must include the verbatim text span.

5. **Never aggregate sentiment percentages without pairing them with volume.** "Negative sentiment is up to 35%" is meaningless without knowing whether that is based on 5 texts or 5,000. Percentage shifts on low-volume days are statistical noise. Set a minimum volume floor for reporting (typically 30 texts per aggregation period) and suppress percentage statistics below that floor, showing only raw counts.

6. **Alert thresholds must be derived from observed baseline data, not set arbitrarily.** Setting a threshold at 30% negative before any baseline data is collected is arbitrary -- that might be well within normal range or might already be above it. Explicitly mark thresholds as "provisional" until 4+ weeks of baseline data are collected. Document this limitation in the dashboard.

7. **Never use a model trained on a different text type without domain validation.** A model trained on IMDB movie reviews applied to medical support tickets will degrade by 10-20 percentage points and fail in systematic, predictable ways (medical negative language is clinical, not emotional). Always validate on a domain-representative sample before reporting results as production-quality.

8. **The validation sample must be stratified, not random.** Pure random sampling from an imbalanced corpus will produce a validation set that under-represents minority classes (often neutral). A validation set of 100 texts from a 70% positive corpus would contain only ~15 neutral texts -- far too few to estimate neutral class accuracy. Sample at least 30 texts per class in the validation set, regardless of class proportions.

9. **Document the model version for every classified text.** When the sentiment model is updated (new lexicon version, retrained transformer), the new model may classify the same texts differently. Without version tracking, trend data becomes uninterpretable -- it is impossible to tell whether a sentiment shift is real or an artifact of model changes. The model_version field in the output schema is non-negotiable.

10. **This skill produces the analysis design and interpretation framework, not machine learning code.** The deliverable is a structured specification: which method, how categories are defined, what the output schema looks like, what accuracy to expect, and how to validate. If the user needs implementation code (Python pipeline, API integration, batch processing), that is a separate engineering task. Make this boundary explicit so the user has correct expectations about what the design document enables vs. what it requires in addition.

---

## Edge Cases

**Short texts with minimal semantic content (fewer than 8 words)**

Short texts -- single-emoji reviews, one-word ratings ("Terrible"), very brief social media mentions ("love it") -- present two problems: lexicon-based methods have near-zero context to work with, and transformer models produce high-confidence scores that may not reflect genuine understanding. Handle as follows: flag all texts under 8 tokens with a short_text = true marker. For texts under 4 tokens, assign to a "low_information" category rather than forcing a sentiment label. If star ratings or other structured signals are available alongside short text, weight the structured signal more heavily than the text signal for these records. Note in reporting that N% of the corpus was "low_information" and excluded from trend analysis.

**Multilingual corpora or code-switching texts**

Do not translate all text to English and then apply an English sentiment model -- translation models introduce sentiment artifacts, alter nuance, and lose culturally specific expressions of dissatisfaction (understatement in British English, indirect criticism in Japanese, hyperbole in Brazilian Portuguese). Instead: run language detection first (langdetect library achieves 98%+ accuracy for texts over 20 words), then route each text to a language-specific model or lexicon. For code-switching texts (Spanish/English mixed, e.g., "Muy disappointed with this app"), neither a Spanish nor English model will perform well -- flag these for manual review or use a multilingual transformer (mBERT, XLM-RoBERTa) which handles mixed-language text better than monolingual models. Document which languages are covered and what the coverage gap is.

**Sarcasm-dominant data sources**

Certain data sources have structurally higher sarcasm rates: Twitter from users discussing tech companies (15-25% sarcasm rate in negative content), Reddit product subreddits (10-20%), review platforms where verified purchasers are known to be hyperbolic. No automated system reliably detects sarcasm above 70% accuracy. The practical approach: identify sarcasm indicators (sentiment score ≥ 0.80 positive combined with star rating ≤ 2, punctuation patterns like "...", all-caps ironic phrases) and route those texts to a manual review queue rather than including them in automated aggregates. In the documentation, explicitly state the estimated sarcasm rate for this corpus and the expected false positive rate it introduces into the positive class.

**Longitudinal analysis spanning multiple years**

Language evolves. A word that was neutral in 2018 may be charged in 2024. Brand names acquire connotations. Slang changes valence. When conducting historical sentiment analysis across a time span greater than 18-24 months, split the analysis into temporal segments and apply period-appropriate lexicons or retrain/validate the model on examples from each period. Do not apply a single current model to 2018 data and treat the results as directly comparable to 2024 results. If a single model must be used for computational or consistency reasons, include a "temporal analysis limitation" note in the interpretation guide: trend differences may reflect language drift as well as genuine sentiment change.

**High-stakes automated routing (support escalation, HR systems)**

When sentiment outputs directly trigger actions without human review -- escalating a support ticket to a legal team, flagging an employee message for HR intervention, routing a medical complaint to a safety team -- the stakes of misclassification are high. For these use cases: (a) set the confidence threshold for automated action at ≥ 0.90, not the standard ≥ 0.80; (b) require human review for all medium-confidence cases (0.70-0.90) before action is taken; (c) build an audit log that records the original text, the classification, the confidence, and the action taken so misclassifications can be identified and corrected; (d) calculate and report the False Negative Rate for the negative class specifically (missed negative texts are a harm in high-stakes contexts, more so than false positives); (e) review the routing rules with legal or compliance stakeholders before deployment, because automated text classification triggering disciplinary or legal action may have regulatory implications.

**Domain jargon with inverted sentiment polarity**

Some domains use words with sentiment polarity opposite to their general-language meaning: in cybersecurity, "sick" and "nasty" can be positive (describing an impressive piece of code); in gaming, "broken" used affectionately is positive; in music reviews, "filthy" bass is a compliment; in medical support contexts, "positive" (test result) is negative for the patient. Generic models and lexicons will systematically misclassify these. Before deploying in a specialized domain, extract the 50 most frequent sentiment-bearing words from the corpus and manually check whether their domain polarity matches their general-language polarity. Build a domain override dictionary that maps these words to their correct domain polarity, and apply it as a preprocessing step or post-processing correction before or after the main classifier.

**Temporal and conditional sentiment expressions**

Texts expressing sentiment about a past, future, or hypothetical state require careful handling. "Used to love this product" (past positive now implying current negative) should be negative, but surface lexical analysis scores it as positive. "Would be great if they fixed the bugs" is a feature request, not positive sentiment. "If the price were lower, I'd recommend it" is a conditional that implies current negative on price. These patterns are common in product reviews and NPS verbatims. Document the estimated frequency of temporal/conditional language in the target corpus (typically 5-15% of reviews). Transformer models handle these better than lexicon methods because they capture sentence structure, but accuracy drops for these constructions even with transformers. Flag texts containing temporal markers (used to, would, if, wish, hope, before, since the update) for elevated review in triage systems.

**Imbalanced training data for fine-tuned models**

When building a fine-tuned model, training data class imbalance is a critical failure mode. If 70% of labeled examples are positive, 20% negative, and 10% neutral, the model will optimize for the majority class and achieve poor recall on neutral and negative. Address this before training: (a) oversample minority classes to at least 25% of total training examples, either by duplicating existing examples or collecting new labels specifically for underrepresented classes; (b) use class-weighted loss functions during training (set class weights inversely proportional to class frequency); (c) evaluate model performance separately on a balanced test set (equal class representation) in addition to a representative test set (natural class proportions) to distinguish overall accuracy from per-class performance.

---

## Example

**Input:**
"We run a B2B SaaS platform for HR departments. Our support team receives about 800 support tickets per month. Tickets come from HR managers and deal with payroll errors, integration bugs, compliance questions, and feature requests. We want to automatically prioritize negative tickets for same-day response, flag urgent tickets for the support manager, and track whether ticket sentiment improves after product updates. Tickets average 80-150 words and are written in professional English."

---

**Output:**

## Sentiment Analysis Design: HR SaaS Support Ticket Prioritization

### 1. Analysis Context

| Parameter | Value |
|---|---|
| Data source | Internal support ticket system (Zendesk or equivalent) |
| Text type | Professional B2B support tickets |
| Average text length | 80-150 words (medium-length, structured professional writing) |
| Language(s) | English (professional/business register) |
| Data volume | ~800 tickets/month (~27 tickets/day); 9,600/year accumulating |
| Analysis goal | (1) Route negative-high-confidence tickets for same-day response; (2) Flag urgent tickets for manager review; (3) Track sentiment trend pre/post product updates to assess improvement |
| Granularity needed | Aspect-based sentiment (payroll, integrations, compliance, features, support experience) + overall urgency signal |
| Stakes level | Routing and triage -- misclassification causes missed escalations or unnecessary urgency; high stakes for negative class specifically |
| Baseline sentiment estimate | ~60% negative (support tickets are intrinsically negative-skewing), ~25% neutral (informational/compliance questions), ~15% positive (feedback, thanks) |

---

### 2. Method Selection

**Selected Method:** Pre-Trained Transformer with Domain Override Rules (Hybrid)

**Method Rationale:**
At 800 tickets/month, a pre-trained transformer model (specifically a model fine-tuned on customer support or business communication data, rather than social media or movie reviews) will achieve 82-88% accuracy on this corpus. The professional register of B2B HR tickets is well-represented in enterprise communication training sets. A domain override rule layer is added to handle HR-specific terminology where general-language polarity is inverted: "positive" (test result, HRIS flag), "critical" (payroll processing term, not always urgent-negative), and "error" (may be a generic term in integration tickets, not always negative in the emotional sense). Fine-tuning is not recommended at this stage because 800 tickets/month represents a small labeled dataset -- after 3-4 months of operation with manual review labels accumulated, fine-tuning becomes viable.

**Implementation Reference:**
- Tool/model: cardiffnlp/twitter-roberta-base-sentiment (ternary) as baseline -- swap to a model fine-tuned on customer support text (e.g., a BERT model trained on Zendesk or Freshdesk ticket datasets) if available
- Domain override dictionary: 15-20 HR-specific term overrides applied pre-classification
- Serving: Python batch processing (runs nightly on previous day's tickets) + real-time API call for urgent routing
- Processing rate: Approximately 200-500 tickets/minute (batch); 50-100ms per ticket (real-time API)

**Expected Performance:**

| Metric | Expected Value | Condition |
|---|---|---|
| Overall accuracy | 82-88% | Professional English, moderate domain specificity |
| Positive class F1 | 0.72-0.80 | Positive is least frequent and hardest to recall in support context |
| Negative class F1 | 0.85-0.90 | Critical metric for routing; target at least 0.85 |
| Neutral class F1 | 0.70-0.78 | Neutral (compliance questions) hardest to separate from negative |
| Confidence ≥ 0.80 coverage | ~65-75% of tickets | Professional writing tends toward higher model confidence |

**Known Limitations:**
- Tickets describing payroll errors using clinical HR terminology ("payroll run failed", "off-cycle adjustment required") may score medium-confidence negative when they are urgent-critical
- Tickets that begin with a polite opener ("I hope this message finds you well") before describing a severe problem may have the polite opener dilute the overall negative signal -- the transformer attends to the full text, so early-text politeness can reduce overall negative confidence
- Feature requests ("It would be helpful if the integration could...") are frequently classified as neutral or weakly positive when they reflect frustration with a missing capability

---

### 3. Sentiment Category Definitions

**Classification Scheme:** Aspect-Based Sentiment + Overall Ternary + Urgency Flag

| Label | Operational Definition | Score Range | Positive Example | Text that is NOT this class |
|---|---|---|---|---|
| Positive | Customer expresses satisfaction, appreciation, resolution confirmation, or recommends a capability | 0.65-1.0 | "The payroll fix you deployed last week resolved everything. Our team is very happy with the turnaround." | "The integration works now but took 3 weeks to fix." -- This is mixed/neutral, not positive |
| Neutral | Customer asks an informational or compliance question, reports a status without emotional charge, or provides a factual bug description without frustration | 0.40-0.65 | "Can you confirm whether the new tax table update applies to our state withholding configuration?" | "I need to know why this failed. This is the third time." -- The emotional charge makes this negative, not neutral |
| Negative | Customer expresses frustration, urgency, risk, financial impact, or threatens escalation | 0.0-0.40 | "Payroll is running in 2 hours and the system is showing incorrect deductions for 47 employees. This is a legal and financial risk." | "There is a discrepancy in the October report." -- Without urgency language, this may be neutral |

**Urgency Flag (applied on top of sentiment):**
An urgency flag is separate from sentiment polarity. A ticket can be neutral in tone but urgency-flagged because it references a time-sensitive event. Apply urgency flag = true when any of the following are present: payroll deadline (within 48 hours), compliance
