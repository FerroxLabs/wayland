---
name: literature-search
description: |
  Creates systematic literature search strategies with database selection, keyword combinations, Boolean operators, and inclusion/exclusion criteria for learners conducting academic research. Produces a complete search protocol -- not advice on why literature reviews matter.
  Use when a learner asks to search for academic sources, find research papers, create a literature search strategy, or build a systematic review protocol.
  Do NOT use for evaluating source credibility (use `source-evaluation`), for writing the literature review itself (use writing category skills), or for citation formatting (use `citation-management`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "research academic-writing study-skills step-by-step"
  category: "education"
  subcategory: "academic-skills"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Literature Search

## When to Use

Use this skill when a learner needs to build and execute a systematic search strategy for finding academic sources. Specific trigger scenarios:

- A student says "I need to find research papers on [topic] for my thesis/dissertation" and has not yet built a search protocol
- A learner asks how to search databases like PubMed, Scopus, or Web of Science and does not know which to prioritize or how to construct query strings
- A researcher needs to design a formal systematic review or scoping review and requires a reproducible, documented search protocol
- A graduate student is conducting a literature review for a seminar paper and is getting either too many results (thousands) or too few (under 20) with their current approach
- A learner wants to build inclusion/exclusion criteria to filter sources consistently before reading begins
- A researcher asks how to combine keywords using Boolean logic for a specific discipline (e.g., health sciences, social sciences, engineering)
- A user needs to know which databases cover their field and which provide full-text versus abstract-only access
- A user conducting a systematic or scoping review needs a PRISMA-compatible search log to document their methodology

**Do NOT use when:**

- The user has already collected sources and wants to evaluate whether they are credible or peer-reviewed -- use the `source-evaluation` skill instead
- The user needs to write, structure, or draft the literature review document itself -- use the appropriate writing category skill
- The user needs to format citations (APA, MLA, Chicago, Vancouver) or manage a reference library -- use the `citation-management` skill
- The user is asking about synthesizing or thematically organizing findings across multiple papers -- use a synthesis or note-taking skill
- The user needs help identifying a research gap or framing a research question from scratch -- use a `research-question-formulation` skill before running this one
- The user is an educator designing a library instruction session for their class -- use a teaching-skills subcategory skill
- The user needs only a single quick source and is not building a repeatable protocol -- provide direct guidance without a full protocol

---

## Process

### Step 1: Establish the Research Context

Before building any search protocol, gather the information that will determine every subsequent decision.

- Ask for the **specific research question or topic**, not just a broad subject area. "Mental health" is not enough -- "the effect of social media use on depression outcomes in adolescents aged 13--18" is a workable starting point.
- Identify the **review type** the user is conducting: a rapid review (1--3 databases, less exhaustive), a narrative literature review (2--4 databases, discipline-focused), a scoping review (broad, at least 3--5 databases with gray literature), or a systematic review (exhaustive, 5+ databases, registered protocol, PRISMA reporting). Each type has different depth requirements.
- Determine the **discipline or field**: database selection, subject headings, and vocabulary conventions differ dramatically between STEM, health sciences, social sciences, and humanities.
- Clarify the **intended audience and purpose**: thesis chapter, journal submission, grant background section, seminar paper. This affects how exhaustive the search needs to be.
- Note **practical constraints**: access to subscription databases through a university library, time available, whether the user has a librarian they can consult, and whether this review needs to be reproducible for peer scrutiny.

### Step 2: Decompose the Research Question into Searchable Concepts

Use the PICO, SPIDER, or PCC framework depending on the review type, then extract discrete search concepts from each element.

- **PICO** (Population, Intervention, Comparison, Outcome) is the standard for clinical and quantitative health research questions. Example: P = adolescents, I = cognitive behavioral therapy, C = no treatment or waitlist, O = anxiety reduction.
- **SPIDER** (Sample, Phenomenon of Interest, Design, Evaluation, Research type) is better for qualitative and mixed-methods health research.
- **PCC** (Population, Concept, Context) is used for scoping reviews per the Joanna Briggs Institute methodology and suits broad, exploratory questions.
- For social sciences, education, and humanities where PICO does not apply naturally, decompose the question into 2--4 conceptual pillars. Example for education research: "peer feedback | undergraduate writing | digital learning environments."
- Aim for **2--4 core concepts** per search. More than 4 concepts in a single AND chain will typically reduce results below a useful threshold. If the question has 5+ elements, decide which 2--3 are essential and which can be applied as post-search filters.
- Write out each concept explicitly before assigning terminology. This prevents conflating related-but-distinct ideas, which leads to either recall gaps or irrelevant precision.

### Step 3: Build the Controlled Vocabulary and Keyword Sets

Each database uses a combination of free-text keyword searching and a controlled vocabulary (subject headings). Use both layers for every core concept.

- **Identify the controlled vocabulary for each target database**: MeSH (Medical Subject Headings) for PubMed and MEDLINE, Emtree for Embase, Thesaurus terms for PsycINFO, Subject Headings for CINAHL, Descriptors for ERIC (education). Ignoring controlled vocabulary is the single most common cause of missed relevant literature.
- For each concept, generate **synonyms, abbreviations, brand names, spelling variants, and related terms**. Example for "adolescents": teenager, teen, youth, young person, young people, juvenile, "secondary school student," "high school student." In health databases, also include the MeSH term "Adolescent" as a subject heading search (tagged with the database's heading field code, e.g., [MH] in PubMed).
- Apply **truncation symbols** to capture morphological variants: `adolescen*` captures adolescent, adolescents, adolescence. Most databases use an asterisk (*); some use a dollar sign ($) or pound sign (#) -- confirm the truncation symbol before running searches.
- Use **wildcard characters** for spelling variants: `behavio*r` or `behavio?r` captures behaviour and behavior simultaneously.
- Use **phrase searching** (quotation marks) for multi-word concepts: "cognitive behavioral therapy," "social media," "eating disorder." Without quotes, databases may search words independently and return irrelevant results.
- Decide whether to include **adjacent word operators** for databases that support them (e.g., NEAR/3 in Scopus or Web of Science, to find terms within 3 words of each other): useful when a phrase relationship matters but exact phrasing varies.
- Organize all terms into a **concept-by-synonym grid** (the search term table in the Output Format) before building any query string. This ensures no terms are omitted and makes the query auditable.

### Step 4: Select and Prioritize Databases

Database selection is not arbitrary -- choose databases based on disciplinary coverage, indexing depth, and the review type's exhaustiveness requirements.

- **Health and medicine**: PubMed/MEDLINE (free, comprehensive, MeSH-indexed), Embase (stronger European and drug trial coverage, requires subscription), CINAHL (nursing, allied health), Cochrane Library (systematic reviews, RCTs), PsycINFO (psychology, psychiatry).
- **Social sciences and education**: ERIC (education-specific, free via EBSCO or IES), PsycINFO, Sociological Abstracts, SSRN (preprints), Web of Science Social Sciences Citation Index.
- **Engineering and computer science**: IEEE Xplore (conference proceedings and journals), ACM Digital Library, Scopus (broad STEM coverage), arXiv (preprints, especially ML/AI).
- **Multidisciplinary**: Web of Science Core Collection (best for citation analysis and impact metrics), Scopus (largest abstract/citation database, strong for systematic reviews), Google Scholar (broadest but not filterable enough for formal systematic reviews -- use for supplementary searching or citation chasing, not as a primary database).
- **Minimum database counts by review type**: rapid review -- 1--2 targeted databases; narrative review -- 2--3; scoping review -- 3--5 plus gray literature; systematic review -- 5+ with documented justification for each selection.
- **Gray literature sources** (for scoping and systematic reviews): institutional repositories, government reports (e.g., via Greynet, NICE, CDC), clinical trial registries (ClinicalTrials.gov, WHO ICTRP), conference abstracts, dissertations (ProQuest Dissertations & Theses, EThOS).
- Record the **date each database was searched** and the **date range applied** -- this is required for reproducible and peer-reviewed methodology sections.

### Step 5: Construct and Test the Boolean Query String

Assemble the controlled vocabulary and keywords into a working query string, test it, and iteratively refine.

- The fundamental structure is: **(Concept 1 terms joined by OR) AND (Concept 2 terms joined by OR) AND (Concept 3 terms joined by OR)**. OR broadens within a concept; AND narrows across concepts. NOT should be used sparingly and only when a term introduces unambiguous noise (e.g., `mercury NOT planet` in a toxicology search) -- NOT can exclude relevant papers that coincidentally mention the excluded term.
- Build and test **each concept block separately** first. A concept block searching for "adolescents" that returns 50,000 records, combined with a "depression" block returning 80,000, may return 3,000--8,000 results after AND -- which is still screenable with tools, but may need further scoping.
- **Target result thresholds**: for a thesis literature review, 200--600 results after all database searches combined (pre-deduplication) is a manageable starting point. For a full systematic review, 2,000--8,000 combined results (pre-deduplication) is typical before title/abstract screening. Fewer than 50 results across all databases should trigger a broadening review of the keyword set.
- **Limit use of filters** at the query stage for systematic and scoping reviews -- apply publication date ranges, language limits, and study design filters as documented restricting criteria, not silently. For rapid and narrative reviews, filters are appropriate earlier.
- Run the query in **at least two databases** and compare result counts. A search that returns 1,200 in PubMed and only 12 in Embase on the same topic signals either a controlled vocabulary mismatch or a very narrow Embase query -- investigate and reconcile before proceeding.
- **Save search histories** in every database using the database's account/alert function. PubMed, Scopus, Web of Science, and most EBSCO databases allow you to save searches. For systematic reviews, export the exact search string and run date as this is required for the methods section.
- After each search string is finalized, perform a **known-item check**: identify 3--5 papers that must appear in the results (papers you found through other means that are clearly central to the topic). If any are missing, the search has a recall gap -- identify why and add missing terms.

### Step 6: Apply Inclusion and Exclusion Criteria

Inclusion/exclusion criteria operationalize the scope of the review. They should be pre-specified before screening begins, not adjusted post hoc based on results.

- **Inclusion criteria** are the characteristics a source must have to be considered. Typical categories include: publication date range (e.g., 2013--2024, or "last 10 years"), publication type (peer-reviewed journal articles, conference proceedings, book chapters, gray literature), language (English only vs. all languages with translation capacity), population or sample characteristics, study design (RCTs only, qualitative studies, empirical studies only), geographic scope, and outcome or variable type.
- **Exclusion criteria** are the reasons to discard a source. Avoid simply inverting inclusion criteria -- state specific reasons: editorials and opinion pieces with no primary data, case reports (unless case studies are the design of interest), duplicate publications of the same dataset, gray literature without methodology disclosure, non-peer-reviewed sources (for systematic reviews).
- Every criterion should be **operationally defined** so that two independent screeners would apply it consistently. "Recent literature" is not a criterion; "published 2015 or later" is.
- For systematic reviews, criteria should be determined **before** any screening using tools like Covidence, Rayyan, or Abstrackr -- these tools enforce pre-registration of criteria.
- Indicate at which screening stage each criterion is applied: **title/abstract screen** vs. **full-text screen**. Some criteria (e.g., sample size thresholds, specific outcome measures) cannot be assessed from the abstract and should only be applied at full-text.

### Step 7: Document the Search Log and Produce the Protocol

A search that cannot be reproduced is not a valid systematic or scoping review search. Documentation is a methodological requirement, not optional record-keeping.

- Record the following for each database searched: database name, platform/interface used (e.g., PubMed via NLM, MEDLINE via OVID), date of search, complete search string exactly as entered, number of results retrieved.
- Track **deduplication**: after importing all results into a reference manager (Zotero, EndNote, Mendeley, or a review tool like Rayyan), record the number of records before and after removing duplicates. Cross-database duplication rates of 20--40% are typical for multidisciplinary searches.
- Build a **PRISMA flow diagram** for systematic and scoping reviews: records identified, records after deduplication, records screened, records excluded at title/abstract (with reasons), full-text articles assessed, full-text excluded (with reasons), studies included in synthesis. Even for narrative reviews, a simplified version demonstrates rigor.
- Store the complete protocol document with version numbering. If the search is updated (e.g., for a dissertation submitted 12 months after the initial search), run an updated search and document separately, merging results.
- For registered systematic reviews, deposit the protocol in **PROSPERO** (for health-related systematic reviews) before data collection begins. For scoping reviews, consult the Open Science Framework (OSF) for pre-registration options.

### Step 8: Recommend Next Actions After Search Execution

The search protocol is a starting point. Guide the learner on what to do with results.

- **Citation chasing**: for any highly relevant paper found through database searching, check its reference list (backward citation chasing) and search for papers that have cited it using Google Scholar, Web of Science, or Scopus's "cited by" function (forward citation chasing). This recovers 10--25% of relevant literature missed by keyword searching alone.
- **Hand-searching key journals**: for specialized topics, identify 2--3 journals that publish the majority of relevant work and manually scan their tables of contents for the past 5 years.
- **Alert setup**: in PubMed, Scopus, and Web of Science, set up email alerts for the saved search string to receive notifications of new publications matching the criteria -- critical for keeping a living review current or for dissertation students with long write-up periods.
- **Reference management**: import all results into Zotero, EndNote, or a systematic review platform before screening. Attempting to screen from database interfaces directly leads to lost data and poor deduplication.
- Refer the learner to `source-evaluation` skill for assessing individual paper quality and `citation-management` for organizing and formatting the final reference list.

---

## Output Format

Produce the following complete search protocol. Fill every field with content specific to the user's topic and context -- no placeholders.

```
## Literature Search Protocol: [Full Research Question or Topic]

**Review Type:** [Rapid / Narrative / Scoping / Systematic]
**Discipline/Field:** [Health sciences / Social sciences / Engineering / etc.]
**Researcher Level:** [Undergraduate / Masters / Doctoral / Independent]
**Date Protocol Created:** [Date]
**Target Search Completion:** [Estimated date]

---

### Research Question (Structured)

**Full question:** [Written out completely]
**Framework used:** [PICO / SPIDER / PCC / Custom decomposition]

| Framework Element | Label | Content |
|-------------------|-------|---------|
| [P / S / Population] | Population | [Who: age, condition, setting] |
| [I / Phenomenon / Concept] | Concept/Intervention | [What: treatment, phenomenon, technology] |
| [C / Context] | Comparison/Context | [Compared to what, or in what context] |
| [O / Evaluation] | Outcome | [What are you measuring or exploring] |

---

### Search Concept Map

| Concept # | Concept Label | Primary MeSH/Thesaurus Term | Free-Text Keywords | Truncated/Wildcard Forms | Phrases |
|-----------|--------------|----------------------------|-------------------|--------------------------|---------|
| 1 | [Label] | [Subject heading] | [keyword1, keyword2] | [truncat* form] | ["exact phrase"] |
| 2 | [Label] | [Subject heading] | [keyword1, keyword2] | [truncat* form] | ["exact phrase"] |
| 3 | [Label] | [Subject heading] | [keyword1, keyword2] | [truncat* form] | ["exact phrase"] |

**Boolean logic structure:** (Concept 1 terms) AND (Concept 2 terms) AND (Concept 3 terms)

---

### Database Selection and Rationale

| Database | Platform | Rationale | Access | Controlled Vocabulary |
|----------|---------|-----------|--------|----------------------|
| [DB name] | [Interface] | [Why chosen] | [Free/Library] | [MeSH/Emtree/Descriptors/None] |
| [DB name] | [Interface] | [Why chosen] | [Free/Library] | [MeSH/Emtree/Descriptors/None] |
| [DB name] | [Interface] | [Why chosen] | [Free/Library] | [MeSH/Emtree/Descriptors/None] |

**Gray literature sources (if applicable):**
- [Source 1 and rationale]
- [Source 2 and rationale]

---

### Full Search Strings by Database

**[Database 1 Name] -- [Platform]**
```
[Complete, exact query string formatted for this database's syntax, including field tags]
```
Example field tags: [MH] for MeSH heading (PubMed), [TIAB] for title/abstract (PubMed), TITLE-ABS-KEY() for Scopus, TS= for Web of Science topic search

**[Database 2 Name] -- [Platform]**
```
[Complete query string]
```

**[Database 3 Name] -- [Platform]**
```
[Complete query string]
```

---

### Inclusion and Exclusion Criteria

| Criterion Type | Category | Specification | Applied at Stage |
|---------------|---------|---------------|-----------------|
| Inclusion | Publication date | [Year range and rationale] | Title/Abstract |
| Inclusion | Publication type | [e.g., Peer-reviewed empirical articles] | Title/Abstract |
| Inclusion | Language | [e.g., English and Spanish] | Title/Abstract |
| Inclusion | Population | [Specific characteristics] | Full-text |
| Inclusion | Study design | [e.g., RCTs, qualitative studies, all empirical] | Full-text |
| Exclusion | Publication type | [e.g., editorials, case reports, dissertations] | Title/Abstract |
| Exclusion | Population | [e.g., clinical populations only, age outside range] | Full-text |
| Exclusion | Outcome | [e.g., no primary data, narrative opinion only] | Full-text |

---

### Search Log (To Complete During Execution)

| Database | Platform | Date Searched | Search String Version | Results Retrieved | After Deduplication |
|----------|---------|--------------|----------------------|-------------------|---------------------|
| [DB 1] | | [Date] | v1.0 | | |
| [DB 2] | | [Date] | v1.0 | | |
| [DB 3] | | [Date] | v1.0 | | |
| **TOTAL** | | | | | |

---

### PRISMA Flow Summary (Complete After Screening)

- Records identified through database searching: ___
- Additional records through other sources (citation chasing, hand search): ___
- Records after duplicates removed: ___
- Records screened (title/abstract): ___
- Records excluded (title/abstract): ___ | Reasons: ___
- Full-text articles assessed: ___
- Full-text articles excluded: ___ | Reasons: ___
- **Studies included in final review: ___**

---

### Known-Item Verification Checklist

List 3--5 papers that must appear in results as a quality check:
- [ ] [Author, Year, Title] -- Expected in: [Database]
- [ ] [Author, Year, Title] -- Expected in: [Database]
- [ ] [Author, Year, Title] -- Expected in: [Database]

If any are missing, review: [specific gap diagnosis]

---

### Next Steps

| Priority | Action | Tool/Method | Deadline |
|----------|--------|-------------|----------|
| 1 | Import results to reference manager | [Zotero / EndNote / Rayyan] | [Date] |
| 2 | Run deduplication | Reference manager dedup function | [Date] |
| 3 | Title/abstract screening | [Tool] | [Date] |
| 4 | Citation chasing on included studies | Google Scholar / Web of Science | [Date] |
| 5 | Set up search alerts | PubMed MyNCBI / Scopus alerts | [Date] |

### Complementary Skills for Next Phases
- `source-evaluation` -- assess methodological quality of included papers
- `citation-management` -- organize and format your reference list
- Writing skills -- draft the literature review narrative from synthesized sources
```

---

## Rules

1. **NEVER conflate database searching with general internet searching.** Google Scholar is a supplementary tool for citation chasing and quick reconnaissance, not a primary search engine for systematic or scoping reviews. Scopus and Web of Science provide reproducible, filterable, field-tagged search environments that Google Scholar cannot replicate.

2. **ALWAYS build controlled vocabulary terms alongside free-text keywords.** Searching only with free-text keywords in PubMed, PsycINFO, or CINAHL misses any paper indexed under a subject heading that uses different language from the author's title/abstract. For PubMed, always include both MeSH terms (with [MH] or [MeSH] tag) and keyword variants.

3. **Match review type to search exhaustiveness requirements.** A narrative literature review for a seminar paper does not need 6 databases and a PRISMA diagram. A systematic review submitted to a peer-reviewed journal does. Mismatching the depth of the search to the review type either wastes the learner's time or produces a methodologically invalid review.

4. **Do NOT apply too many AND operators in the base search string for systematic reviews.** Every AND reduces recall. For reviews claiming to be exhaustive, start with the 2--3 most essential concepts in the AND chain, then use post-search filtering (language, date, study design) as documented limits rather than embedded query elements.

5. **Require a known-item verification step before declaring the search complete.** Any search protocol that skips this step has no quality assurance on recall. Identify at least 3 landmark papers on the topic and confirm they appear in results. If they do not, the search has a gap that must be diagnosed and fixed before proceeding.

6. **Inclusion/exclusion criteria must be operationally specific and pre-specified.** "Relevant studies" is not a criterion. "Empirical studies with a quantitative or mixed-methods design, published in peer-reviewed journals between 2010 and 2024, using human participants aged 13--25" is a criterion. Vague criteria introduce reviewer bias and reduce reproducibility.

7. **Record the exact search string and date for every database searched.** For systematic and scoping reviews, this is a non-negotiable methodological requirement. Omitting it makes the review unreproducible and will be flagged by peer reviewers or dissertation committees.

8. **Do NOT use NOT operators broadly.** Using NOT to exclude terms risks silently eliminating relevant papers. For example, `depression NOT treatment` would exclude any paper studying both depression etiology and treatment outcomes. Use NOT only when a specific, well-defined subset of irrelevant results is identified and the exclusion is verified to be safe.

9. **Tailor the search string syntax to each specific database.** PubMed uses [MH], [TIAB], [AU] field tags. Scopus uses TITLE-ABS-KEY(), AUTHKEY(), and parenthetical nesting. Web of Science uses TS=, AU=, SO=. EBSCO databases (PsycINFO, CINAHL, ERIC) use the visual search builder with drop-down field selectors. A PubMed string pasted directly into Scopus will not run correctly. Always adapt syntax.

10. **Deduplication must occur before screening, not during.** Attempting to screen the same paper twice from different databases wastes time and introduces inconsistency. Import all results to a reference manager or systematic review platform (Rayyan, Covidence, Zotero) and deduplicate before any screening begins. For large reviews (1,000+ records), automated deduplication tools like ASySD or the Zotero dedup merge function reduce manual effort.

---

## Edge Cases

### User Is Conducting a Systematic Review for Journal Submission

This is the highest-stakes scenario. Apply full protocol rigor:
- Recommend registering the protocol in PROSPERO (for health/clinical topics) or OSF before any searching begins. Reviewers will ask whether the protocol was pre-registered.
- The search must cover a minimum of 5 databases for most health and social science topics. Justify any database not searched.
- Recommend co-searching with a subject librarian -- systematic review searches are complex enough that librarian co-authorship is now standard practice at many institutions and expected by high-impact journals.
- The search string must be published in full in the paper or as supplementary material. Peer reviewers in journals like BMJ, JAMA, and Cochrane will scrutinize every operator.
- PRISMA 2020 reporting guidelines require specific disclosures about search strategy -- follow the PRISMA-S extension for search reporting.

### User Gets Fewer Than 50 Results Across All Databases

This is a recall problem. Systematically diagnose before concluding the literature is thin:
- Check whether controlled vocabulary terms were included -- many researchers miss this and rely only on title/abstract keywords.
- Check for overly restrictive AND chaining -- if 4+ concepts are ANDed together, test removing one concept and reassessing.
- Check for over-specific phrase searching -- "adolescent social media depression longitudinal" as a phrase finds only papers using all those words in sequence. Break into components.
- Check whether the topic is genuinely sparse or whether it is indexed under different terminology (e.g., a new intervention may not yet have MeSH terms assigned; search only by keyword).
- Check that date restrictions are not too narrow -- if the field is emerging, 5 years may produce few results; expand to 10 years.
- For genuinely sparse topics, recommend supplementing with gray literature, dissertations (ProQuest), and conference proceedings.

### User Gets More Than 5,000 Results in a Single Database

This is a precision problem for manageable reviews (not full systematic reviews, where 5,000 is sometimes expected). Resolve by:
- First, check whether inclusion of subject headings without proper "explode" or "restrict" settings is generating noise. In PubMed, "exploding" a MeSH term includes all narrower terms -- sometimes this is undesirable.
- Add a third or fourth conceptual constraint if the research question genuinely requires it. Ensure it is theoretically justified.
- Apply documented study design filters (e.g., [pt] = "Clinical Trial" in PubMed, or the Cochrane/Scottish Intercollegiate Guidelines Network study design search filters).
- Apply language and date restrictions as documented limits.
- For a thesis literature review (not a systematic review), it is methodologically acceptable to run the search with filters and document them explicitly. The goal is a manageable, representative corpus, not exhaustive recall.

### User Has No Access to Subscription Databases

Many learners do not have university library access. A viable protocol is still possible:
- PubMed (MEDLINE), PubMed Central (full text), ERIC (via IES website), DOAJ (Directory of Open Access Journals), and BASE (Bielefeld Academic Search Engine) are free and comprehensive.
- Google Scholar is acceptable as a primary database for narrative reviews at undergraduate level with appropriate documentation of limitations.
- Many university libraries offer community borrowing cards, alumni access, or inter-library loan services -- recommend the learner investigate these.
- The Unpaywall browser extension and Sci-Hub (noting legal ambiguity) are commonly used for accessing full text of papers found in database searches -- focus this skill on finding the records; note that full-text access is a separate practical problem.
- For systematic reviews, lack of access to Embase, CINAHL, or PsycINFO is a documented limitation that must be acknowledged in the methods section.

### User's Topic Spans Multiple Disciplines

Cross-disciplinary research (e.g., technology ethics in healthcare, environmental psychology, educational neuroscience) requires expanded database selection and awareness of disciplinary vocabulary differences:
- Build parallel search concept maps for each disciplinary vocabulary. The term "cognitive load" is standard in education and cognitive psychology; the same phenomenon may be discussed as "mental workload" in human factors engineering and ergonomics.
- Search each discipline's primary database separately with its own controlled vocabulary. Do not assume a single search string will work across disciplines.
- Expect higher deduplication rates (30--50%) because multidisciplinary databases (Web of Science, Scopus) index many of the same sources as specialist databases.
- Pay attention to methodological norms: a "rigorous study" in clinical medicine means an RCT, while in qualitative social science it means theoretical saturation and reflexive analysis. Inclusion criteria for study design must be appropriate to the epistemological assumptions of the review.

### User Is Updating a Previously Conducted Literature Search

Updating a search is methodologically distinct from starting fresh:
- Document the original search date and the update search date explicitly. The update search should cover only the gap period.
- Rerun the original search strings with a date limiter restricted to the period since the last search (e.g., "from 2022-06-01 to present").
- Check whether any MeSH terms or database thesaurus terms have changed since the original search -- vocabulary is periodically updated and new preferred terms may be introduced.
- Run a citation chasing pass on newly included studies from the original review -- they may have generated responses, replications, or critiques not captured by keyword searching.
- If the original search was more than 3 years prior, consider whether the entire search should be reconceptualized rather than simply updated, as the field's terminology may have shifted substantially.

### User Is a Complete Beginner With No Prior Database Searching Experience

For a learner who has never used an academic database:
- Begin with a brief conceptual orientation: academic databases index peer-reviewed literature, are organized by discipline, and use structured search syntax. This is categorically different from searching Google.
- Start with PubMed or Google Scholar as the first practice environment before introducing more complex interfaces like Ovid or Scopus.
- Walk through one concept block at a time: first search only for the population terms, examine a few results to assess relevance, then add the second concept block with AND.
- Explain the difference between a subject heading search and a keyword search using a concrete example from their topic.
- Recommend the learner save their search history in the database before logging out -- this is a beginner mistake that results in losing hours of work.
- Do not introduce more than 3 databases in the initial protocol. Complexity can increase with subsequent searches.

---

## Example

**Input:** "I'm a second-year master's student in public health. I need to build a search protocol for my thesis literature review on the effectiveness of mobile health (mHealth) apps for improving medication adherence in adults with type 2 diabetes. I have access to my university library, so I can use subscription databases. I'm not doing a full systematic review -- it's a narrative literature review but I want it to be rigorous. I've already found one key paper by Mbuagbaw et al. (2015) on mHealth and adherence."

---

**Output:**

## Literature Search Protocol: Effectiveness of mHealth Applications for Medication Adherence in Adults With Type 2 Diabetes

**Review Type:** Rigorous Narrative Literature Review
**Discipline/Field:** Public Health / Health Informatics / Endocrinology
**Researcher Level:** Masters (MPH)
**Date Protocol Created:** [Current Date]
**Target Search Completion:** Within 2 weeks of protocol finalization

---

### Research Question (Structured)

**Full question:** In adults diagnosed with type 2 diabetes, do mobile health (mHealth) applications improve medication adherence compared to usual care or no intervention?

**Framework used:** PICO

| Framework Element | Label | Content |
|-------------------|-------|---------|
| P | Population | Adults (18+) diagnosed with type 2 diabetes mellitus |
| I | Intervention | Mobile health applications (smartphone apps, SMS reminders, app-based self-management tools) |
| C | Comparison | Usual care, no intervention, non-digital interventions, or other digital health formats |
| O | Outcome | Medication adherence (self-reported, pill count, electronic monitoring, prescription refill rates, HbA1c as proxy) |

---

### Search Concept Map

| Concept # | Concept Label | Primary MeSH/Thesaurus Term | Free-Text Keywords | Truncated/Wildcard Forms | Phrases |
|-----------|--------------|----------------------------|--------------------|--------------------------|---------|
| 1 | Population: Type 2 Diabetes | "Diabetes Mellitus, Type 2" [MeSH] | type 2 diabetes, T2DM, T2D, non-insulin dependent diabetes | diabet* | "type 2 diabetes," "non-insulin dependent diabetes mellitus," "adult-onset diabetes" |
| 2 | Intervention: mHealth Apps | "Mobile Applications" [MeSH]; "Telemedicine" [MeSH] | mHealth, mobile health, smartphone app, mobile app, mobile application, text message, SMS, digital health, eHealth | app*, mobil*, telephon* | "mobile health," "mobile application," "smartphone application," "text message reminder," "digital health intervention" |
| 3 | Outcome: Medication Adherence | "Medication Adherence" [MeSH] | medication adherence, medicine adherence, drug adherence, treatment adherence, medication compliance, pill adherence, antidiabetic adherence | adher*, complian* | "medication adherence," "treatment compliance," "medication compliance," "drug adherence" |

**Boolean logic structure:** (Concept 1 terms) AND (Concept 2 terms) AND (Concept 3 terms)

**Note on Concept 3:** Adherence outcomes will also be assessed at full-text screening via proxy measures (HbA1c improvement, refill rates) even when the word "adherence" does not appear in abstract. Include "glycemic control" and "HbA1c" as supplementary Concept 3 keywords.

---

### Database Selection and Rationale

| Database | Platform | Rationale | Access | Controlled Vocabulary |
|----------|---------|-----------|--------|----------------------|
| PubMed/MEDLINE | NLM (free) | Core biomedical database; comprehensive coverage of diabetes, mHealth, adherence literature; MeSH indexing critical for this topic | Free | MeSH terms required |
| Embase | Elsevier via library | Stronger European trial coverage; Emtree has specific terms for mobile apps and patient compliance; captures conference abstracts missed by PubMed | Library subscription | Emtree |
| CINAHL | EBSCO via library | Essential for nursing and patient self-management literature; adherence interventions frequently published in nursing journals | Library subscription | CINAHL Headings |
| Cochrane Library | Wiley (free) | Systematic reviews and RCTs specifically; the CENTRAL trials register will identify RCTs on mHealth and adherence not indexed elsewhere | Free | N/A (keyword search) |
| Web of Science Core Collection | Clarivate via library | Citation analysis; good for identifying high-impact papers; useful for forward citation chasing from Mbuagbaw et al. 2015 | Library subscription | None (keyword + topic search) |

**Gray literature sources:** Not included in this narrative review. If review were systematic, would add: ClinicalTrials.gov (registered but unpublished trials), WHO ICTRP, manufacturer app development reports.

---

### Full Search Strings by Database

**PubMed -- NLM Interface**
```
("Diabetes Mellitus, Type 2"[MeSH] OR "type 2 diabetes"[TIAB] OR "T2DM"[TIAB] OR "non-insulin dependent diabetes"[TIAB] OR diabet*[TIAB])
AND
("Mobile Applications"[MeSH] OR "Telemedicine"[MeSH] OR "mHealth"[TIAB] OR "mobile health"[TIAB] OR "smartphone app*"[TIAB] OR "mobile app*"[TIAB] OR "text message*"[TIAB] OR "SMS"[TIAB] OR "eHealth"[TIAB] OR "digital health"[TIAB])
AND
("Medication Adherence"[MeSH] OR "medication adher*"[TIAB] OR "treatment adher*"[TIAB] OR "medication complian*"[TIAB] OR "drug adher*"[TIAB] OR "HbA1c"[TIAB] OR "glycemic control"[TIAB])

Filters: Humans; English; 2010/01/01 to present (mHealth apps became viable only around 2008--2010; pre-2010 literature is largely inapplicable)
```

**Embase -- Elsevier**
```
('diabetes mellitus'/exp/mj OR 'type 2 diabetes mellitus'/exp OR 'non-insulin-dependent diabetes mellitus':ti,ab,kw)
AND
('mobile health application'/exp OR 'telemedicine'/exp OR 'mHealth':ti,ab,kw OR 'mobile health':ti,ab,kw OR 'smartphone application':ti,ab,kw OR 'text messaging':ti,ab,kw OR 'SMS':ti,ab,kw OR 'digital health':ti,ab,kw)
AND
('patient compliance'/exp OR 'medication compliance'/exp OR 'medication adherence':ti,ab,kw OR 'treatment compliance':ti,ab,kw OR 'drug adherence':ti,ab,kw OR 'HbA1c':ti,ab,kw)

Filters: human; English language; 2010 to present
```

**CINAHL -- EBSCO**
```
(MH "Diabetes Mellitus, Type 2+" OR TI "type 2 diabetes" OR AB "type 2 diabetes" OR TI "T2DM" OR AB "T2DM")
AND
(MH "Mobile Applications" OR MH "Telemedicine+" OR TI "mHealth" OR AB "mHealth" OR TI "mobile health" OR AB "mobile health" OR TI "smartphone app*" OR AB "smartphone app*" OR TI "text messag*" OR AB "text messag*")
AND
(MH "Medication Adherence" OR TI "medication adher*" OR AB "medication adher*" OR TI "treatment complian*" OR AB "treatment complian*" OR TI "HbA1c" OR AB "HbA1c")

Filters: English; 2010--present; Peer Reviewed
```

**Cochrane Library -- Wiley (CENTRAL + Cochrane Reviews)**
```
("type 2 diabetes" OR "T2DM" OR "diabetes mellitus type 2")
AND
("mHealth" OR "mobile health" OR "mobile application" OR "smartphone" OR "text message" OR "SMS")
AND
("medication adherence" OR "treatment adherence" OR "medication compliance" OR "HbA1c")

Date: 2010 to present
```

**Web of Science Core Collection**
```
TS=("type 2 diabetes" OR "T2DM" OR "non-insulin dependent diabetes")
AND TS=("mHealth" OR "mobile health" OR "mobile application*" OR "smartphone app*" OR "text message*" OR "SMS" OR "digital health intervention*")
AND TS=("medication adherence" OR "medication compliance" OR "treatment adherence" OR "drug adherence" OR "HbA1c" OR "glycemic control")

Timespan: 2010--present; Language: English
```

---

### Inclusion and Exclusion Criteria

| Criterion Type | Category | Specification | Applied at Stage |
|---------------|---------|---------------|-----------------|
| Inclusion | Publication date | Published 2010 or later (mHealth infrastructure not viable before this) | Title/Abstract |
| Inclusion | Publication type | Peer-reviewed empirical articles (quantitative, qualitative, or mixed methods with primary data) | Title/Abstract |
| Inclusion | Language | English only (no translation resources available for this review) | Title/Abstract |
| Inclusion | Population | Adult participants (18+ years) with a confirmed type 2 diabetes mellitus diagnosis | Full-text |
| Inclusion | Intervention | Intervention must include a mobile device-based component (smartphone app, SMS/text messaging, tablet app) as the primary or co-primary element | Full-text |
| Inclusion | Outcome | Study must report a measure of medication adherence (self-report scales, pharmacy refill, pill count, electronic monitoring) OR HbA1c as a proxy adherence/glycemic outcome | Full-text |
| Exclusion | Publication type | Editorials, letters to the editor, opinion pieces, narrative review articles, protocol papers without results, conference abstracts without accompanying full text | Title/Abstract |
| Exclusion | Population | Studies exclusively in type 1 diabetes; pediatric populations (under 18); studies in gestational diabetes only | Full-text |
| Exclusion | Intervention | Interventions using only web-based desktop platforms, telephone calls without app component, or wearable devices only (without software app component) | Full-text |
| Exclusion | Outcome | Studies reporting only patient satisfaction or usability without adherence or glycemic outcomes | Full-text |

---

### Search Log (To Complete During Execution)

| Database | Platform | Date Searched | Search String Version | Results Retrieved | After Deduplication |
|----------|---------|--------------|----------------------|-------------------|---------------------|
| PubMed | NLM | | v1.0 | | |
| Embase | Elsevier | | v1.0 | | |
| CINAHL | EBSCO | | v1.0 | | |
| Cochrane Library | Wiley | | v1.0 | | |
| Web of Science | Clarivate | | v1.0 | | |
| **TOTAL** | | | | | **Target: 400--900 pre-dedup** |

*Expected deduplication rate: 25--35% across these databases due to multidisciplinary overlap.*

---

### PRISMA Flow Summary (Complete After Screening)

- Records identified through database searching: ___
- Additional records through citation chasing (Mbuagbaw et al. 2015 + 2 other anchor papers): ___
- Records after duplicates removed: ___
- Records screened (title/abstract): ___
- Records excluded at title/abstract: ___ | Primary reasons: wrong population (T1D, pediatric), wrong intervention (web-only, wearable-only), wrong outcome (usability only)
- Full-text articles assessed for eligibility: ___
- Full-text articles excluded: ___ | Reasons: adherence not measured, study design (protocol paper, no results), population outside range
- **Studies included in narrative review: ___ (target: 25--60 studies for a rigorous narrative review)**

---

### Known-Item Verification Checklist

These papers must appear in results. If any are missing after running the full search, the protocol has a recall gap.

- [ ] Mbuagbaw et al. (2015) -- mHealth and adherence (anchor paper; known to be in PubMed)
- [ ] Hou et al. (2016), "Apps for self-management of type 2 diabetes," Diabetes Care -- Expected in PubMed and Embase
- [ ] Liang et al. (2011), systematic review of mobile interventions and diabetes management -- Expected in PubMed and Cochrane

If any are missing: Check whether [TIAB] field restriction is excluding papers where the primary term appears only in the full text. Broaden one concept's field tags or add a subject heading search if not already included.

---

### Citation Chasing Strategy

**Backward chasing:** Review the reference lists of the 5--8 most relevant papers identified after title/abstract screening. This is especially important for Mbuagbaw et al. (2015), which is a systematic review and will have a comprehensive reference list of earlier empirical studies.

**Forward chasing:** Use Web of Science "Times Cited" or Google Scholar "Cited by" to identify papers that have cited Mbuagbaw et al. (2015) and any other anchor systematic reviews. This is the most efficient way to capture 2016--2024 empirical studies building on earlier work.

**Hand-search recommendation:** Journal of Medical Internet Research (JMIR) and JMIR mHealth and uHealth publish the majority of high-quality mHealth intervention studies. Scan the tables of contents for 2018--2024 issues for any missed studies.

---

### Search Alert Setup

After running the protocol, set up the following saved search alerts:
- **PubMed MyNCBI**: Save the PubMed search and set to email alerts (monthly frequency). PubMed adds 1--2 million new citations per year; new mHealth trials are published continuously.
- **Scopus or Web of Science**: Set citation alert for Mbuagbaw et al. 2015 -- any new paper citing this anchor will likely be relevant.
- **Google Scholar Alert**: Set alert for `mHealth "type 2 diabetes" "medication adherence"` as a broad supplementary monitor.

---

### Next Steps

| Priority | Action | Tool/Method | Deadline |
|----------|--------|-------------|----------|
| 1 | Run all 5 database searches and export results in RIS/BibTeX format | PubMed, Embase, CINAHL, Cochrane, WoS | Within 3 days |
| 2 | Import all records into Zotero and run deduplication | Zotero Duplicate Items finder or Better BibTeX plugin | Day 4 |
| 3 | Title and abstract screening | Zotero tags (Include/Exclude/Maybe) or Rayyan (free web tool) | Days 5--10 |
| 4 | Full-text retrieval and full-text screening | University library full-text links; inter-library loan for inaccessible items | Days 11--18 |
| 5 | Citation chasing on included studies | Google Scholar "Cited by" + anchor paper reference lists | Days 19--21 |
| 6 | Set up monthly search alerts | PubMed MyNCBI; Scopus alert | Before search completion date |

### Complementary Skills for Next Phases
- `source-evaluation` -- use to assess methodological quality of included mHealth RCTs and observational studies (risk of bias tools, GRADE framework)
- `citation-management` -- use to organize your final included studies in APA 7th format for the thesis reference list
- Writing skills -- use after synthesis to draft the narrative literature review chapter from your organized findings
