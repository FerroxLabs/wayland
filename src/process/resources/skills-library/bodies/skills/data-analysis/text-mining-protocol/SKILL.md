---
name: text-mining-protocol
description: |
  Produces a text mining protocol: defines the corpus, selects the analysis type (frequency, collocation, topic modeling, named entity extraction), specifies preprocessing steps, and produces the output interpretation framework.
  Use when the user asks to analyze a text corpus computationally, extract patterns from documents, identify topics in a collection of texts, or build a text mining pipeline for unstructured data.
  Do NOT use for sentiment classification (use sentiment-analysis-guide), qualitative coding of interviews (use qualitative-coding), survey question design (use survey-design), or competitive intelligence gathering (use competitive-intelligence).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "research analysis data-science"
  category: "data-analysis"
  subcategory: "research-analysis"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Text Mining Protocol

## When to Use

**Use this skill when:**
- User asks to analyze a large collection of texts computationally (news articles, research papers, product reviews, social media posts)
- User wants to discover topics, themes, or patterns in unstructured text data
- User needs to extract entities (people, organizations, locations, dates) from documents
- User asks how to preprocess text data for analysis (tokenization, stopword removal, stemming)
- User wants to identify frequently co-occurring words or phrases in a corpus

**Do NOT use when:**
- User wants to classify text as positive, negative, or neutral (use `sentiment-analysis-guide`)
- User wants to manually code interview transcripts or open-ended responses (use `qualitative-coding`)
- User wants to design a survey with structured questions (use `survey-design`)
- User wants to track competitor activity from public sources (use `competitive-intelligence`)

## Process

1. **Define the corpus and research question.** Ask the user:
   - What text data are you analyzing? (news articles, customer reviews, academic papers, emails, social media posts, legal documents)
   - How many documents? (50 documents, 10,000 reviews, 500,000 tweets)
   - What is the language? (English only, multilingual, domain-specific jargon)
   - What question are you trying to answer? (What topics are discussed? Which entities appear most? What words co-occur with "quality"? How has language changed over time?)
   - What will the output inform? (research paper, product strategy, content strategy, regulatory compliance)

2. **Select the analysis type.** Match the analysis to the research question:

   | Analysis Type | Best For | Output | Complexity |
   |---------------|---------|--------|------------|
   | **Word frequency** | "What are the most discussed terms?" | Ranked word list with counts | Low |
   | **N-gram analysis** | "What phrases appear most often?" | Ranked phrase list (bigrams, trigrams) | Low |
   | **Collocation analysis** | "What words co-occur with [term]?" | Word pairs with association scores (PMI, chi-square) | Medium |
   | **Topic modeling (LDA)** | "What are the main topics across all documents?" | Topic clusters with top words per topic | Medium |
   | **Named entity recognition (NER)** | "What people, organizations, or places are mentioned?" | Entity list with type, frequency, and source document | Medium |
   | **Keyword-in-context (KWIC)** | "How is a specific term used across documents?" | Concordance table showing the term with surrounding context | Low |
   | **Document clustering** | "Which documents are similar to each other?" | Document groups with shared vocabulary | High |
   | **Temporal analysis** | "How has language changed over time?" | Term frequency trends over time periods | Medium |

   **Default recommendation:** Start with word frequency and n-gram analysis to understand the corpus. Then apply topic modeling if the goal is theme discovery, or NER if the goal is entity extraction.

3. **Design the preprocessing pipeline.** Text must be cleaned before analysis. Define each step:

   **Step 1: Text normalization**
   - Convert to lowercase (unless case matters for NER)
   - Remove or standardize special characters, punctuation, and numbers
   - Expand contractions ("don't" to "do not") if consistency matters

   **Step 2: Tokenization**
   - Split text into individual words (tokens)
   - Decision: word-level or sentence-level tokenization based on analysis type
   - Handle hyphenated words, abbreviations, and domain terms

   **Step 3: Stopword removal**
   - Remove common words that add no analytical value ("the", "is", "and", "of")
   - Use a standard stopword list as a starting point
   - Add domain-specific stopwords (e.g., "patient" in medical texts, "court" in legal texts if those are universally present)
   - CRITICAL: Review the stopword list before applying. Removing the wrong word can eliminate a key finding.

   **Step 4: Stemming or lemmatization**
   - **Stemming:** Reduces words to their root form by removing suffixes ("running" to "run", "studies" to "studi"). Faster but less accurate.
   - **Lemmatization:** Reduces words to their dictionary form ("running" to "run", "studies" to "study"). More accurate but slower.
   - Decision: Use lemmatization for final analysis. Use stemming for quick exploratory passes.

   **Step 5: Domain-specific adjustments**
   - Preserve multi-word terms as single tokens ("machine learning", "New York", "blood pressure")
   - Handle abbreviations and acronyms (define a mapping: "AI" = "artificial intelligence")
   - Remove boilerplate text (email signatures, standard disclaimers, headers/footers)

4. **Configure the analysis parameters.** For each analysis type:

   **Word frequency:**
   - Minimum frequency threshold (exclude words appearing fewer than N times)
   - Maximum frequency threshold (exclude words appearing in more than X% of documents -- these are likely domain stopwords)
   - TF-IDF weighting: weight words by how distinctive they are to individual documents vs. the whole corpus

   **Topic modeling (LDA):**
   - Number of topics (K): start with K = 5-10 for small corpora, 10-30 for large corpora. Iterate.
   - Number of top words per topic to display: 10-15 words
   - Convergence criteria: how many iterations before the model is considered stable
   - Evaluation metric: topic coherence score (higher is better; aim for above 0.4)

   **Named entity recognition:**
   - Entity types to extract: PERSON, ORGANIZATION, LOCATION, DATE, MONEY, PRODUCT (select relevant types)
   - Confidence threshold: minimum confidence score for entity classification (0.7-0.9 depending on precision needs)
   - Entity linking: whether to resolve variations to a canonical form ("NYC", "New York City", "New York" to one entity)

5. **Design the output format and interpretation guide.** Define what the results look like and how to read them.

6. **Plan validation.** Define how to verify the results are meaningful:
   - Manual review of a random sample (50-100 documents) to check preprocessing quality
   - For topic models: human evaluation of topic coherence (can a person label each topic based on its top words?)
   - For NER: precision and recall on a manually annotated sample

## Output Format

```
## Text Mining Protocol: [Project Name]

### Corpus Definition
- **Source:** [Where the text data comes from]
- **Volume:** [Number of documents and approximate word count]
- **Language:** [Primary language(s)]
- **Time span:** [Date range of documents, if applicable]
- **Research question:** [What this analysis aims to answer]

### Analysis Selection

| Analysis | Purpose | Expected Output |
|----------|---------|-----------------|
| [Analysis 1] | [Why this analysis] | [What it produces] |
| [Analysis 2] | [Why this analysis] | [What it produces] |

### Preprocessing Pipeline

| Step | Operation | Configuration | Rationale |
|------|-----------|---------------|-----------|
| 1 | Text normalization | [Specific operations] | [Why] |
| 2 | Tokenization | [Word-level / Sentence-level] | [Why] |
| 3 | Stopword removal | [Standard list + domain additions] | [Why] |
| 4 | Stemming / Lemmatization | [Method choice] | [Why] |
| 5 | Domain adjustments | [Multi-word terms, abbreviations] | [Why] |

**Domain stopwords added:** [List of domain-specific words removed]
**Multi-word terms preserved:** [List of phrases treated as single tokens]

### Analysis Configuration

[Analysis-specific parameters -- see Process step 4]

### Output Specification

#### Word Frequency Output

| Rank | Term | Raw Count | TF-IDF Score | % of Documents |
|------|------|-----------|-------------- |----------------|
| 1 | [term] | [count] | [score] | [%] |

#### Topic Model Output (if applicable)

| Topic | Label | Top Words | Representative Document | Coherence |
|-------|-------|-----------|------------------------|-----------|
| 1 | [Human-assigned label] | [word1, word2, word3, ...] | [Doc ID] | [Score] |

#### Entity Extraction Output (if applicable)

| Entity | Type | Frequency | First Seen | Documents |
|--------|------|-----------|------------|-----------|
| [entity] | [PERSON/ORG/LOC] | [count] | [doc ID] | [list] |

### Interpretation Guide

**Word frequency interpretation:**
- Top 10 terms represent the dominant vocabulary of the corpus
- Compare against expected terms: missing expected terms may indicate preprocessing issues
- TF-IDF highlights terms that are distinctive, not just frequent

**Topic model interpretation:**
- Each topic is a cluster of co-occurring words -- assign a human-readable label
- A document can belong to multiple topics (mixed membership)
- Topics with overlapping words may need to be merged (reduce K)
- Topics with incoherent words may need to be split (increase K)

**Entity extraction interpretation:**
- High-frequency entities are the most-discussed actors in the corpus
- Entity co-occurrence reveals relationships (entities mentioned in the same document)
- Precision matters more than recall: a wrong entity is worse than a missed entity

### Validation Protocol
1. Manually review [N] preprocessed documents to verify cleaning quality
2. [Analysis-specific validation steps]
3. Document any adjustments made after validation
```

## Rules

1. NEVER skip the preprocessing step -- unprocessed text produces meaningless frequency counts dominated by stopwords and punctuation
2. ALWAYS define the stopword list explicitly and review it before applying -- removing a word that matters to the research question invalidates the entire analysis
3. Topic model results must be evaluated by a human -- a coherence score alone does not confirm that topics are meaningful to the research question
4. NEVER report raw word counts without TF-IDF or document frequency context -- a word that appears 1,000 times in one document is not the same as a word that appears once in each of 1,000 documents
5. Named entity recognition results must include a confidence threshold -- entities extracted with low confidence pollute the analysis with false positives
6. The number of topics (K) in topic modeling is a parameter that must be tuned, not assumed -- running LDA once with K=10 and accepting the result is not analysis
7. Multi-word terms must be identified and preserved before tokenization -- splitting "machine learning" into "machine" and "learning" destroys the meaning
8. Preprocessing decisions must be documented -- another researcher must be able to reproduce the exact same cleaning steps on the same corpus and get the same result
9. Temporal analysis requires consistent document dating -- if document timestamps are unreliable, do not claim temporal trends
10. This skill produces the mining PROTOCOL, not a software implementation -- describe the analysis pipeline, parameters, and interpretation, not the code

## Edge Cases

- **Very short documents (tweets, chat messages, headlines):** Standard preprocessing may remove too much. Reduce stopword removal aggressiveness. Skip stemming (short texts have less morphological variation). Consider character n-grams instead of word n-grams for very short texts. Topic modeling performs poorly on short texts -- use document clustering with TF-IDF instead.

- **Highly technical or domain-specific corpus (medical, legal, patent):** Build a domain-specific stopword list (common legal terms like "hereby" and "pursuant" add noise). Create a domain abbreviation dictionary before tokenization. Standard NER models may miss domain entities (drug names, legal case numbers) -- note the limitation and recommend domain-specific models.

- **Multilingual corpus:** Either analyze each language separately or use multilingual preprocessing tools. Do not mix languages in a single topic model -- the topics will cluster by language, not by theme. Document which languages are included and which are excluded from the analysis.

- **Corpus with significant boilerplate (emails with signatures, legal documents with standard clauses):** Identify and remove boilerplate before analysis. Boilerplate terms will dominate frequency counts and distort topic models. Define boilerplate patterns explicitly in the preprocessing pipeline.

- **Longitudinal analysis (corpus spanning years):** Language evolves. Terms may change meaning, new terms may appear, and old terms may disappear. Divide the corpus into time windows and run the analysis per window. Compare term frequencies across windows rather than treating the entire corpus as one unit.

## Example

**Input:** "I have 5,000 customer support tickets from the last 6 months. I want to know what the most common issues are and whether any new issues have emerged recently."

**Output:**

## Text Mining Protocol: Customer Support Ticket Analysis

### Corpus Definition
- **Source:** Customer support ticket database (subject line + description fields)
- **Volume:** 5,000 tickets, estimated 250,000 words total
- **Language:** English (primary), potential multilingual tickets flagged for exclusion
- **Time span:** September 2025 through February 2026 (6 months)
- **Research question:** What are the most common support issues, and have new issue categories emerged in the most recent months?

### Analysis Selection

| Analysis | Purpose | Expected Output |
|----------|---------|-----------------|
| Word frequency + TF-IDF | Identify the dominant terms in support tickets | Ranked term list highlighting distinctive problem words |
| N-gram analysis (bigrams, trigrams) | Capture multi-word issue descriptions ("password reset", "billing error") | Ranked phrase list |
| Topic modeling (LDA) | Discover issue categories automatically | 8-15 topic clusters, each representing a support issue type |
| Temporal analysis | Detect new or growing issues | Topic frequency by month, highlighting trends |

### Preprocessing Pipeline

| Step | Operation | Configuration | Rationale |
|------|-----------|---------------|-----------|
| 1 | Text normalization | Lowercase all text; remove ticket IDs, timestamps, and agent signatures | Ticket metadata adds noise |
| 2 | Tokenization | Word-level tokenization | Standard for frequency and topic analysis |
| 3 | Stopword removal | English standard list + domain stopwords (see below) | Remove non-informative words |
| 4 | Lemmatization | Dictionary-based lemmatization | "crashes" and "crashing" should count as one term |
| 5 | Domain adjustments | Preserve multi-word terms; map abbreviations | "password reset" is one concept, not two |

**Domain stopwords added:** "hi", "hello", "thanks", "thank", "please", "help", "need", "want", "issue", "problem", "ticket", "support", "team", "dear", "regards", "sincerely"

**Multi-word terms preserved:** "password reset", "billing error", "login failure", "account locked", "payment declined", "two factor", "error message", "loading time", "subscription cancellation"

### Analysis Configuration

**Topic modeling parameters:**
- Number of topics (K): Start with K=10, test K=8 and K=15, select based on coherence score
- Top words per topic: 15
- Iterations: 1,000 minimum
- Target coherence: above 0.4

**Temporal analysis parameters:**
- Time windows: monthly (6 windows: September through February)
- Metric: topic proportion per month (percentage of tickets assigned to each topic)
- Trend detection: flag any topic whose monthly proportion increases by more than 50% relative to its 6-month average

### Output Specification

#### Topic Model Output

| Topic | Label | Top Words | Ticket Count | % of Total |
|-------|-------|-----------|-------------|------------|
| 1 | Login and Authentication | password, reset, login, locked, account, access, authentication, two-factor, email, verification | 820 | 16.4% |
| 2 | Billing and Payments | billing, charge, payment, declined, invoice, refund, subscription, renewal, credit, amount | 710 | 14.2% |
| 3 | Performance Issues | slow, loading, crash, freeze, timeout, performance, lag, response, speed, page | 650 | 13.0% |
| 4 | Feature Requests | feature, add, integration, ability, option, support, export, import, connect, missing | 540 | 10.8% |
| 5 | Data and Sync | data, sync, missing, lost, export, import, update, refresh, display, incorrect | 480 | 9.6% |

#### Temporal Trend Output

| Topic | Sep | Oct | Nov | Dec | Jan | Feb | Trend |
|-------|-----|-----|-----|-----|-----|-----|-------|
| Login | 14% | 15% | 16% | 15% | 17% | 19% | Rising (35% increase) |
| Billing | 13% | 14% | 14% | 16% | 14% | 13% | Stable |
| Performance | 12% | 12% | 13% | 13% | 14% | 15% | Slight rise |
| Feature Requests | 11% | 11% | 10% | 10% | 11% | 11% | Stable |
| Data and Sync | 8% | 9% | 9% | 10% | 10% | 12% | Rising (50% increase -- flag) |

### Interpretation Guide

**Topic interpretation:**
- Topic 1 (Login) accounts for the largest share of tickets. The rising trend suggests a growing authentication issue -- investigate recent changes to the login flow.
- Topic 5 (Data and Sync) shows a 50% increase over 6 months. This is the strongest emerging trend and may indicate a new issue introduced by a recent feature or integration.
- Topics with stable trends represent ongoing baseline issues. Prioritize by volume (Topic 2: Billing is the second-largest category).

**Temporal trend interpretation:**
- A rising trend means the issue is becoming more common relative to total ticket volume, not just in absolute numbers.
- Seasonal effects may explain some variation: December billing spikes may correlate with annual subscription renewals.
- A new topic appearing only in recent months (not in the original K=10 model) may indicate a genuinely new issue class -- rerun with K=12 or K=15 to check.

### Validation Protocol
1. Manually review 100 randomly selected tickets and compare their assigned topics to a human reading
2. For each topic, verify that the top 15 words form a coherent theme a support manager would recognize
3. If any topic is incoherent (top words do not relate to each other), adjust K and rerun
4. Verify temporal trends by spot-checking 20 tickets from the most recent month assigned to the rising topics
