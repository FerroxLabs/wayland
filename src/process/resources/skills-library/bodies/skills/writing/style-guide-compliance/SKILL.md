---
name: style-guide-compliance
description: |
  Checks and corrects text for compliance with a specific style guide (AP, Chicago, APA, MLA, or house style), producing a compliance report with every deviation identified and corrected.
  Use when the user asks to apply a style guide, check style compliance, format text to AP/Chicago/APA/MLA standards, or standardize document formatting.
  Do NOT use for general editing (use copy-editing), proofreading without a style guide focus (use proofreading), or citation-specific formatting (use citation-reference).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "editing writing template"
  category: "writing"
  subcategory: "editing-refinement"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Style Guide Compliance

## When to Use

**Use this skill when:**
- The user explicitly names a style guide (AP Stylebook, Chicago Manual of Style, APA Publication Manual 7th ed., MLA Handbook 9th ed., AMA Manual of Style, Bluebook, or a named house style) and wants text checked or corrected against it
- The user submits a document for publication submission and needs it formatted to a specific journal, publication, or institution's standards
- The user is converting a document from one style guide to another (e.g., converting a Chicago-formatted academic paper to APA for journal submission)
- The user needs a compliance audit -- a systematic inventory of every deviation -- rather than just light touch-up editing
- The user needs to enforce consistency across a multi-author document, white paper, or report where different sections may have been written with different conventions
- The user is developing or refining a house style guide and wants to see how a sample document performs against a draft standard
- The user is a copyeditor, managing editor, or production editor preparing text for typesetting and needs a clean, annotated deviation report

**Do NOT use this skill when:**
- The user wants general content editing for clarity, logic, or flow -- use `copy-editing` instead
- The user wants basic proofreading for typos and grammatical errors without a specific style guide in scope -- use `proofreading` instead
- The user wants citation formatting only, without broader document-level style checking -- use `citation-reference` instead
- The user wants to adjust tone, formality, or voice -- use `tone-adjustment` instead
- The user is asking for SEO or web content optimization, which follows platform-specific best practices rather than named style guides -- use an appropriate content optimization skill
- The user wants substantive feedback on argument, structure, or evidence -- style guide compliance is purely formatting and convention, never content
- The user's text is in a language other than English, where AP, Chicago, APA, and MLA do not fully apply -- flag this and recommend language-specific style resources instead

---

## Process

### Step 1: Establish the Governing Style Guide and Its Scope

Before touching a single word, lock down exactly which rulebook applies.

- **Identify the guide by name and edition.** APA 6th and APA 7th have substantial differences (running heads, DOI formats, in-text citation of works with 3+ authors). Chicago 16th and 17th have different footnote and bibliography formats. Always confirm edition if the user can provide it; default to the most current edition if not specified.
- **Map the guide to the document type.** Chicago 17th presents two distinct systems: Notes-Bibliography (used in humanities, arts, and history) and Author-Date (used in physical, natural, and social sciences). AP governs journalistic prose but not headlines, pull quotes, or captions the same way it governs body copy. APA has different rules for student papers vs. professional manuscripts.
- **Identify any house style overlay.** Many organizations use AP as a base but override specific rules (e.g., a tech company may follow AP but use serial commas, or capitalize product names that AP would lowercase). House style always supersedes the base guide where they conflict.
- **If no guide is named,** infer from context using this decision tree:
  - News, press releases, corporate communications: AP Stylebook
  - Scholarly books, trade books, general nonfiction: Chicago (Notes-Bibliography)
  - Social sciences, psychology, education, nursing: APA 7th
  - Humanities, literary criticism, language studies: MLA 9th
  - Medical, clinical, biomedical research: AMA Manual of Style 11th
  - Legal documents, law review articles: Bluebook 21st
  - Engineering, computer science: IEEE or discipline-specific guide
- **State your guide assumption explicitly** at the top of the report. Never silently apply a guide the user did not confirm.

---

### Step 2: Segment the Document into Checkable Units

Systematic compliance checking requires working through the document in passes, not in one undifferentiated read.

- **Structural elements first:** Identify title, byline, abstract, headings (H1 through H4), body paragraphs, block quotations, lists, tables, figures, captions, footnotes/endnotes, and reference list. Each has its own style guide rules.
- **Create a working inventory** of every style-sensitive element before making corrections. This prevents the common error of correcting a word on page 1 and missing the same word on page 7.
- **Segment numbers, dates, and measurements as a class.** Scan the full document for all numerals and spelled-out numbers before applying any rule, because number style rules interact (AP spells out one through nine but uses numerals for 10 and above; however, AP uses numerals for all numbers in a statistical or technical context, meaning "4 percent" is correct even though 4 is below 10).
- **Flag ambiguous proper nouns and titles early.** Capitalization rules for composition titles (books, films, journals) vary significantly: APA uses sentence case for article and book titles in references but title case in running text; Chicago uses title case throughout; AP does not italicize titles and uses specific capitalization rules.

---

### Step 3: Run the Systematic Six-Category Check

Work through each category independently. Mixing categories causes missed deviations.

#### Category 1: Numbers and Quantities
- **AP:** Spell out one through nine; use numerals for 10 and above. Use numerals always for ages, percentages (with "percent" spelled out, not %), addresses, speeds, temperatures, election results, dimensions, and monetary amounts of $1 million or more expressed as "$3.2 million." Dates use numerals without ordinal suffixes (Jan. 15, not January 15th). Fractions below one are spelled out (one-half, two-thirds).
- **Chicago:** Spell out one through one hundred; use numerals for 101 and above. In scientific and statistical contexts, use numerals throughout. Percentages: spell out "percent" in humanistic text; use % symbol in scientific text. Large round numbers may be expressed as "4 million" rather than "4,000,000."
- **APA 7th:** Spell out numbers below 10 except when they precede a unit of measurement (3 kg, 5 cm), represent statistical or mathematical functions, represent time, dates, ages, scores, or points on a scale, or appear in a series with numbers 10 or above. Use the % symbol (not "percent") when preceded by a numeral.
- **MLA 9th:** Spell out numbers expressible in one or two words (fifteen, two hundred, three million); use numerals for others. Numerals are always used for numbers that include decimal points or fractions, percentages, and numbers in a series that includes numbers that would be written as numerals.

#### Category 2: Capitalization
- **Headings and titles in running text:** Chicago and MLA use title case (capitalize all "major" words -- nouns, verbs, adjectives, adverbs -- and all words of four or more letters). APA uses title case for headings in the document body but sentence case for titles in the reference list. AP uses title case for formal titles and proper names but does not italicize.
- **Job titles:** AP capitalizes formal titles only when they immediately precede a name (President Biden, but the president spoke). Chicago and APA follow the same convention. Titles that follow a name or stand alone are lowercased.
- **Government and institutional names:** Always capitalized as proper nouns. But "the government," "the university," "the department" as generic references are lowercase (Chicago) or lowercase in AP.
- **Composition titles (books, films, journals, articles):** Chicago and MLA italicize books, journals, films, and longer works; use quotation marks for shorter works (articles, chapters, poems, songs). AP neither italicizes nor puts quotation marks around titles in news contexts. APA italicizes book and journal titles in the reference list; article titles take no special formatting.

#### Category 3: Punctuation
- **Serial comma (Oxford comma):** Chicago, APA, and MLA require it (apples, oranges, and pears). AP omits it except when needed to prevent ambiguity. This single rule generates more deviations than almost any other.
- **Em dashes and en dashes:** Chicago uses em dashes (--) without spaces for parenthetical insertions, and en dashes for ranges (pp. 45--67) and compound modifiers with a multi-word element (New York--London flight). AP traditionally used em dashes without spaces; many house styles add spaces around em dashes for readability. APA uses em dashes without spaces. MLA follows Chicago conventions. Never use a hyphen where an en dash is required.
- **Ellipses:** Chicago: three periods with spaces between (. . .) or, when text is omitted between two sentences, four (. . . .). APA and MLA: three periods without internal spaces (...), but with a space before and after. AP: three periods with no spaces between them (...).
- **Quotation marks:** All major American style guides use double quotation marks for primary quotations and single for quotations within quotations. Periods and commas go inside closing quotation marks (American style). Semicolons and colons go outside. Question marks and exclamation points go inside if part of the quoted material, outside if not.
- **Hyphenation:** This is one of the most guide-specific areas. Chicago follows Merriam-Webster for compound words; AP has its own hyphenation preferences. Key rule across guides: a compound modifier before a noun is hyphenated (well-known author) but not after (the author is well known). Suspensive hyphens: "10- and 20-year terms" (Chicago/APA) vs. avoiding this construction (AP).

#### Category 4: Abbreviations and Acronyms
- **First use:** All major guides require spelling out an abbreviation or acronym on first use, with the abbreviation in parentheses: "the American Psychological Association (APA)." Subsequent uses may use the abbreviation alone.
- **State abbreviations:** AP uses its own set of state abbreviations (Calif., not CA; Fla., not FL) in datelines and running text; US Postal Service two-letter codes are for addresses only. Chicago uses either spelled-out or postal codes, not AP abbreviations. APA uses postal codes.
- **Titles and honorifics:** AP abbreviates Dr., Gov., Lt. Gov., Rep., Sen., and military titles before names; spells out Professor and President before a name in most contexts. Chicago spells out most titles in text but abbreviates in footnotes. APA abbreviates common titles.
- **Latin abbreviations:** Chicago allows i.e., e.g., cf., et al., and ibid. in footnotes and parenthetical material. APA allows i.e. and e.g. in parenthetical material only; in running text, use "that is" and "for example." AP avoids Latin abbreviations in news prose.
- **Units of measurement:** APA uses metric measurements in scientific text. Chicago spells out most units in humanistic text but uses abbreviations in scientific contexts. AP spells out measurements in narrative text but may abbreviate in tabular material.

#### Category 5: Citations and References
- This category is deep enough to warrant its own skill (`citation-reference`), but a style guide compliance check must verify that in-text citation format and reference list format match the governing guide.
- **APA 7th in-text:** (Author, Year) or (Author, Year, p. X) for direct quotes. Three or more authors: (Author et al., Year) from the first citation.
- **Chicago Notes-Bibliography:** Footnote with full citation on first use, shortened form thereafter. Bibliography at end.
- **Chicago Author-Date:** (Author Year, page) in text; reference list at end.
- **MLA:** (Author page) in text, no year. Works Cited list at end. No "p." before page numbers.
- **AP:** AP does not have a formal citation system for news prose. For AP-style content with attribution, use "according to [source]" or "a [year] study by [institution] found..." constructions.

#### Category 6: Formatting and Miscellaneous Usage
- **Dates:** AP: Jan. 15, 2024 (abbreviate months with more than five letters; no ordinal suffix). Chicago: January 15, 2024 (spell out month) or 15 January 2024 (day-month-year in some international contexts). APA: January 15, 2024 in text; 2024, January 15 in references.
- **Time:** AP: 3 p.m., 10:30 a.m. (lowercase with periods, no space before). Chicago: 3:00 PM or 3 p.m. (both acceptable, but be consistent). APA: 3:00 PM.
- **Decades:** AP: the 1990s (no apostrophe). Chicago: the 1990s or the nineties. APA: the 1990s.
- **Percentages:** AP: 5 percent (spell out "percent" in news text). APA: 5% (numeral + symbol). Chicago: depends on register (humanistic text spells out; scientific uses symbol).
- **Guide-specific usage rules:** AP famously prefers "more than" over "over" for numerical comparisons (though this rule was relaxed in 2014 but many house styles retain it). AP prefers "toward" not "towards," "forward" not "forwards." Chicago defers to Merriam-Webster for usage questions. APA has extensive bias-free language guidelines (Chapter 5 of the 7th edition) covering person-first language, specificity of group labels, and avoidance of outdated clinical terms.

---

### Step 4: Compile the Deviation Table

For every deviation found, record it before making corrections. The deviation table is the primary deliverable for editorial accountability.

- List deviations in document order (by paragraph or line) so the author can locate each one.
- Cite the specific rule: "AP Stylebook, Numbers chapter: spell out one through nine" is more useful than "AP number style." Where possible, include the section title or chapter name the rule comes from.
- Classify each deviation by category (Numbers, Capitalization, Punctuation, Abbreviations, Citations, Formatting/Usage).
- Flag edge cases where the guide allows discretion: mark these "Guide discretion -- recommendation applied" so the author knows the correction is a preference, not a hard rule.
- Do not collapse multiple deviations of the same type into one entry -- each instance must appear separately so the author can assess scope and choose whether to accept each correction.

---

### Step 5: Calculate the Compliance Score

A compliance score gives the author an at-a-glance gauge of how much work was needed.

- **Count style-sensitive elements checked** (not total words). Count each instance of a number, each heading, each punctuation decision in a list, each citation, each date -- every element where a style guide rule applies.
- **Count deviations found.** One sentence may contain three style-sensitive elements and two deviations.
- **Score = ((Elements checked -- Deviations) / Elements checked) × 100.**
- **Interpret scores:** 95--100% = publication-ready; 85--94% = light revision needed; 70--84% = moderate revision; below 70% = substantial revision, style guide training may be indicated.
- **Note the score's limitations:** A document with one paragraph of dense scientific notation may have 40 checkable elements; a document with 10 paragraphs of general narrative may have only 25. Score is a relative measure within a document, not a universal benchmark.

---

### Step 6: Produce the Corrected Document

After the deviation table, deliver the full corrected document.

- Apply every confirmed correction from the deviation table.
- Do NOT make any changes not listed in the deviation table -- no silent edits.
- Preserve the author's formatting, paragraph breaks, headings, and structure exactly as submitted, changing only what the style guide requires.
- If a deviation was flagged as "intentional?" do not correct it in the clean version; instead, leave the original text and note it in the Guide Ambiguities section.
- Bold or bracket corrections in the compliant document only if the user has requested tracked-change-style output; otherwise deliver a clean, unformatted corrected version.

---

### Step 7: Report Ambiguities and Discretionary Choices

Style guides are not complete rulebooks. Many situations fall into gray areas.

- **Enumerate every place where the guide allows multiple acceptable forms.** Example: Chicago allows either "website" or "Web site" (though "website" is now standard in 17th ed.); APA allows either the spelled-out "they" or "he or she" for generic pronoun; AP allows either "adviser" or "advisor" (but prefers "adviser").
- **State which form was chosen and why** (usually: for consistency with the rest of the document, or because the guide's preference section leans one way).
- **Note where house style would override** the base guide if a house style was provided.
- **Flag genuinely contested rules.** Some AP rules (the "over/more than" distinction, the "since/because" distinction) are debated even among AP editors. Note these rather than applying them as if they were unambiguous.

---

### Step 8: Deliver the Summary and Recommendations

Close with a summary that helps the author understand the pattern of deviations.

- The deviation summary table (by category) shows whether the problems are concentrated in one area (e.g., all punctuation errors, suggesting the author is unfamiliar with the serial comma rule) or spread across categories.
- If a single rule accounts for more than 30% of deviations, call it out explicitly: "The majority of deviations (12 of 31) result from inconsistent number style. Recommendation: review the Numbers chapter of the AP Stylebook."
- If the document shows evidence of a different style guide (e.g., serial commas throughout in an AP document), note this: "The document appears to have been drafted in Chicago style. The systematic presence of serial commas suggests a prior style guide was applied."

---

## Output Format

```
## Style Guide Compliance Report

**Style guide:** [Full guide name, edition, and year]
**Document type:** [e.g., academic journal article, news release, book chapter, white paper]
**Total style-sensitive elements checked:** [n]
**Deviations found:** [n]
**Compliance score:** [X]% ([n] compliant out of [n] checked)

---

### Deviations (in document order)

| # | Location | Category | Original Text | Corrected Text | Rule Reference |
|---|----------|----------|---------------|----------------|----------------|
| 1 | Para. 1, sentence 2 | Numbers | "5 researchers" | "five researchers" | AP Stylebook, Numbers: spell out one through nine |
| 2 | Para. 1, sentence 3 | Punctuation | "apples, oranges and pears" | "apples, oranges, and pears" | Chicago 17th §6.19: serial comma required |
| 3 | [Location] | [Category] | [Original] | [Corrected] | [Guide §, chapter, or rule name] |

---

### Deviation Summary by Category

| Category | Deviations | % of Total |
|----------|------------|------------|
| Numbers | [n] | [X]% |
| Capitalization | [n] | [X]% |
| Punctuation | [n] | [X]% |
| Abbreviations | [n] | [X]% |
| Citations/References | [n] | [X]% |
| Formatting & Usage | [n] | [X]% |
| **Total** | **[n]** | **100%** |

**Most frequent deviation type:** [Category] ([n] instances) -- [One-sentence explanation of the rule and its implications]

---

### Compliant Document

[Full corrected text, preserving all structure, paragraphing, headings, and formatting -- only style guide corrections applied, nothing more]

---

### Guide Ambiguities and Discretionary Choices

| Element | Options Allowed by Guide | Choice Applied | Rationale |
|---------|--------------------------|----------------|-----------|
| [e.g., generic pronoun] | "they" or "he or she" | "they" | APA 7th recommends singular "they" as inclusive default |
| [e.g., website capitalization] | "website" or "Website" | "website" | Chicago 17th preference in running text |

---

### Recommendations

1. [Most impactful single change the author can make to prevent future deviations]
2. [Second recommendation, if applicable]
3. [Note if a different style guide appears to have been used previously]
```

---

## Rules

1. **Never apply a style guide without naming it, identifying the edition, and stating your source for every rule cited.** "AP style" is not sufficient -- "AP Stylebook, Numbers chapter: spell out one through nine" is the standard.

2. **Never mix rules from different guides within a single compliance pass.** If you are applying AP, do not apply the Chicago serial comma. If you catch yourself thinking "this seems cleaner with a serial comma," you must suppress it unless the guide in scope requires it.

3. **Never change content, argument, meaning, or word choice for stylistic preference.** Style guide compliance is narrowly scoped to formatting and convention. "More impactful" vs. "more influential" is a content question, not a style guide question, unless the guide has a specific usage entry about that word.

4. **Always list deviations in document order.** Editorial accountability requires the author to be able to locate each deviation. Grouping by category makes the list unusable as a revision tool.

5. **Never collapse multiple instances of the same deviation into one entry.** If "5" appears where it should be "five" in six different sentences, list all six. The author may choose to accept some and reject others.

6. **Always flag discretionary corrections explicitly.** Mark any correction based on a guide's preference (not a hard rule) as "discretionary -- guide preference" so the author understands these are not mandatory changes.

7. **When a house style conflicts with the base guide, apply the house style and note the conflict.** Example: "House style requires serial comma; AP does not. House style takes precedence per editorial hierarchy."

8. **Never apply the wrong number rule for context.** AP's "spell out one through nine" has exceptions for ages, addresses, percentages, dimensions, speeds, and statistical contexts. Applying the base rule without checking exceptions is one of the most common compliance errors.

9. **Do not infer style guide intent.** If the guide does not address a specific element, say so explicitly: "The AP Stylebook does not provide a rule for this construction. No correction applied." Do not guess or generalize from adjacent rules.

10. **APA bias-free language guidelines (Chapter 5, 7th ed.) are mandatory, not optional.** APA compliance is incomplete without checking for outdated group labels, person-first vs. identity-first language preferences by community, and gendered language. This applies even when the author does not explicitly request it.

11. **When converting between style guides, build a conversion matrix before making changes.** Identify every rule that differs between Guide A and Guide B for this document type. Apply the matrix systematically rather than editing by memory or impression.

12. **Compliance score must reflect elements checked, not word count.** A 500-word document with 80 style-sensitive elements has a more meaningful score than one with 20. State the number of elements checked so the author can interpret the score in context.

---

## Edge Cases

### The Document Has a House Style That Partially Overrides a Base Guide
Some organizations use "AP style with exceptions" -- for example, a tech publication that follows AP but requires serial commas, uses title case for product names, and spells out "percent" always rather than using %. When this occurs:
- Apply house style rules first; they govern wherever they speak.
- Apply the base guide (AP, Chicago, etc.) for everything the house style does not address.
- In the deviation table, tag each correction as either "[House style]" or "[AP base]" so the author can trace the source.
- If house style and base guide conflict, house style wins -- document this in the Guide Ambiguities section.
- If you receive a house style document, read it fully before running the check. House style guides often contain unexpected overrides (e.g., "we always use 'setup' not 'set up' as a noun and as a verb").

### Converting from One Style Guide to Another
A writer submitting a Chicago-formatted dissertation chapter to an APA journal must change dozens of conventions. This is not a single-pass correction -- it requires a conversion matrix.
- Build a side-by-side comparison of the two guides for the six categories before editing.
- Key differences between Chicago NB and APA 7th: serial comma (both require it, so no change); title case vs. sentence case in references (major change -- every reference title must be re-cased); footnote citations vs. in-text author-date citations (structural change, not just formatting); "ibid." and shortened forms eliminated (APA has no equivalent); running heads required in APA professional manuscripts but not Chicago.
- Key differences between AP and APA: AP spells out "percent," APA uses %; AP spells out one through nine with exceptions, APA spells out below ten with different exceptions; AP has no formal citation system, APA has a mandatory one.
- After building the matrix, apply changes systematically by category, not sentence by sentence.
- Warn the author that citation conversion (especially footnote-to-author-date) may require information not present in the original document (page numbers for quotes, DOIs, publication years for footnote-only sources).

### The Text Shows Evidence of Multiple Style Guides Applied Inconsistently
This is common in multi-author documents (committee reports, white papers, academic anthologies). Some sections will use serial commas; others will not. Some will spell out percentages; others will use the % symbol.
- Do not silently correct all instances to the governing guide. First, note the inconsistency explicitly: "This document appears to have been written by multiple authors using different style conventions. Sections 1 and 3 follow Chicago conventions; Sections 2 and 4 follow AP conventions."
- Apply the governing guide uniformly after noting the inconsistency.
- Flag this to the author as a potential sign that the document needs substantive editorial review beyond style compliance alone.

### The Author Has Made Intentional Style Guide Deviations for Effect
Creative writers, literary essayists, and marketers sometimes intentionally break style guide rules -- lowercase proper nouns, unconventional capitalization (e.e. cummings), sentence fragments as stylistic devices, or em dashes used in ways that violate Chicago conventions.
- Flag every deviation but do not auto-correct intentional ones.
- Use the notation "Deviation -- intentional?" in the Corrected Text column, leaving the original text unchanged in the compliant document version.
- Ask the author to confirm intentional deviations before finalizing.
- Never assume a deviation is intentional just because it is consistent -- consistent errors are still errors.

### The Document Contains Specialized Content Requiring Domain-Specific Style
Medical content may need to follow AMA 11th edition (which has its own abbreviation list, drug name conventions, and statistical reporting standards) even when the base guide is APA or Chicago. Legal content may need Bluebook citation conventions embedded within an otherwise APA or Chicago document.
- Flag specialized content as requiring domain-specific checking beyond the governing guide.
- Apply the governing guide to non-specialized sections.
- For specialized sections (e.g., a methodology section reporting clinical statistics in an APA paper), note: "This section contains clinical/statistical content. AMA conventions for reporting p-values, confidence intervals, and drug names may apply in addition to APA 7th requirements."
- Do not attempt to apply AMA or Bluebook rules from memory without the user confirming those guides are in scope.

### The Document Is Very Long (More Than 3,000 Words)
A full element-by-element audit of a 10,000-word document is impractical in a single pass.
- Sample the first, middle, and final sections for a pattern audit before committing to a full check.
- Identify the two or three most prevalent deviation types from the sample.
- Apply the prevalent corrections globally (search-and-replace logic applied to all instances of the deviation pattern).
- Then run a targeted check for the remaining categories.
- Report: "Due to document length, this report applies a pattern-based audit. [n] instances of [deviation type] have been corrected throughout the document. A full element-by-element audit would require [estimated scope]."

### The Style Guide Rule Has Changed Between Editions
AP updates its stylebook annually. APA moved from 6th to 7th edition with significant changes. Chicago moved from 16th to 17th with changes to digital source citation. When an author has been trained on an older edition:
- Note edition-specific changes explicitly: "This correction applies the APA 7th edition rule. APA 6th required three or more authors to be cited as [Author et al.] from first use; APA 7th requires this from first use for works with three or more authors [same rule, but the threshold changed from 6 to 3 authors between 6th and 7th]."
- If the user's document was clearly written under an older edition (e.g., systematic use of "et al." only after six authors, a 6th edition convention), note this and apply the current edition corrections.
- If the user explicitly states they need to comply with an older edition (some institutions still require APA 6th), apply that edition's rules and note them as such.

---

## Example

**Input:**
> "Check this abstract for APA 7th edition compliance: 'This study examined the effects of sleep deprivation on cognitive performance in 150 college-aged students (male: 75, female: 75). Participants completed 3 tasks: a memory recall test, a reaction time assessment, and a problem-solving exercise, over a period of seventy-two hours. The results indicated that sleep deprived participants performed significantly worse (p < .05) on all tasks. These findings have important implications for University administrators and Mental Health Professionals working with college populations. The data was collected between January 1st, 2023 and March 31st, 2023.'"

---

## Style Guide Compliance Report

**Style guide:** APA Publication Manual, 7th Edition (2020)
**Document type:** Academic abstract (empirical study)
**Total style-sensitive elements checked:** 22
**Deviations found:** 9
**Compliance score:** 59% (13 compliant out of 22 checked)

---

### Deviations (in document order)

| # | Location | Category | Original Text | Corrected Text | Rule Reference |
|---|----------|----------|---------------|----------------|----------------|
| 1 | Sentence 1 | Numbers | "150 college-aged students" | "150 college-aged students" -- COMPLIANT | APA 7th §6.32: numerals for numbers 10 and above; 150 is correct |
| 2 | Sentence 1 | Formatting | "(male: 75, female: 75)" | "(men: 75, women: 75)" | APA 7th §5.5 Bias-free language: "male/female" as standalone nouns are acceptable in biological/medical contexts but "men/women" are preferred for human participants in behavioral research |
| 3 | Sentence 2 | Numbers | "3 tasks" | "three tasks" | APA 7th §6.32: spell out numbers below 10; 3 does not precede a unit of measurement and is not a statistical value, so the exception does not apply |
| 4 | Sentence 2 | Punctuation | "a memory recall test, a reaction time assessment, and a problem-solving exercise," | COMPLIANT | APA 7th §6.3: serial comma required before "and" in a list -- already present |
| 5 | Sentence 2 | Numbers | "seventy-two hours" | "72 hours" | APA 7th §6.32: use numerals for numbers that represent time; "72 hours" is a unit of time measurement -- numerals required |
| 6 | Sentence 3 | Formatting | "sleep deprived" | "sleep-deprived" | APA 7th §6.12 (hyphenation table): compound modifier before a noun is hyphenated; "sleep-deprived participants" |
| 7 | Sentence 3 | Numbers | "(p < .05)" | COMPLIANT | APA 7th §6.36: italicize p; report without leading zero; "(p < .05)" is correct -- note p should be italicized in final typeset: (*p* < .05) |
| 8 | Sentence 4 | Capitalization | "University administrators" | "university administrators" | APA 7th §6.16: generic institutional titles are not capitalized when used as common nouns; "university" is not a proper noun here |
| 9 | Sentence 4 | Capitalization | "Mental Health Professionals" | "mental health professionals" | APA 7th §6.16: occupational titles and professional descriptors used as common nouns are lowercased; only capitalize when the full formal title precedes a name |
| 10 | Sentence 4 | Usage | "The data was collected" | "The data were collected" | APA 7th §4.19 and Merriam-Webster guidance cited in APA: "data" is a plural noun in academic and scientific writing; use plural verb "were" |
| 11 | Sentence 5 | Formatting | "January 1st, 2023" | "January 1, 2023" | APA 7th §6.35: dates in text do not use ordinal suffixes (1st, 2nd, 3rd); write January 1, 2023 |
| 12 | Sentence 5 | Formatting | "March 31st, 2023" | "March 31, 2023" | APA 7th §6.35: same rule -- no ordinal suffix on dates |

*(Note: Item #1 and #4 were checked and confirmed compliant; they appear in the table for transparency.)*

---

### Deviation Summary by Category

| Category | Deviations | % of Total |
|----------|------------|------------|
| Numbers | 2 | 22% |
| Capitalization | 2 | 22% |
| Punctuation | 0 | 0% |
| Abbreviations | 0 | 0% |
| Formatting & Dates | 3 | 34% |
| Bias-free Language & Usage | 2 | 22% |
| **Total** | **9** | **100%** |

**Most frequent deviation type:** Formatting and Dates (3 instances) -- APA 7th prohibits ordinal suffixes on dates and requires hyphenation of compound modifiers; these are commonly overlooked because they differ from informal writing habits.

**Notable pattern:** The capitalization errors (items #8 and #9) suggest the author may be applying a house style or intuitive capitalization rule (capitalizing professional roles for perceived importance). APA 7th does not recognize this convention.

---

### Compliant Document

This study examined the effects of sleep deprivation on cognitive performance in 150 college-aged students (men: 75, women: 75). Participants completed three tasks: a memory recall test, a reaction time assessment, and a problem-solving exercise, over a period of 72 hours. The results indicated that sleep-deprived participants performed significantly worse (*p* < .05) on all tasks. These findings have important implications for university administrators and mental health professionals working with college populations. The data were collected between January 1, 2023 and March 31, 2023.

*(Note: The italicization of p in "*p* < .05" should be applied in the typeset version. Plain text rendering may not preserve italics.)*

---

### Guide Ambiguities and Discretionary Choices

| Element | Options Allowed by Guide | Choice Applied | Rationale |
|---------|--------------------------|----------------|-----------|
| "men/women" vs. "male/female" as participant descriptors | APA 7th §5.5 allows "male/female" when referring to biological sex in clinical contexts; recommends "men/women" for behavioral research | "men/women" applied | This is a behavioral/cognitive study, not a clinical sex-difference study; "men/women" is the APA preference for this context |
| "data were" vs. "data was" | APA prescribes "data were" per §4.19; some style guides (Chicago 17th) now permit "data is" as acceptable informal usage | "data were" applied | APA is the governing guide; "data were" is mandatory in APA context regardless of emerging informal usage |
| p-value italicization | APA 7th requires *p* in italics; plain text submission may not support this | Noted but not applied in plain text | Author should apply italics in word processor or typesetting software before submission |

---

### Recommendations

1. **Review APA 7th §6.32 (Numbers) in full** before the next draft. The rule has more exceptions than most writers expect (units of measurement, statistical values, time, ages), and applying the base rule ("spell out below 10") without checking exceptions is the source of two deviations here.
2. **Apply a capitalization review pass as a final step** in all academic writing. Common nouns -- even important-sounding ones like "university," "mental health professional," and "government" -- are lowercased in APA unless they are part of a specific formal proper name.
3. **The document's punctuation is strong** -- the serial comma is applied correctly throughout, and no comma splice or apostrophe errors appear. This category requires no further attention.
4. **Bias-free language (APA 7th Chapter 5) deserves a dedicated pass** on the full manuscript. This abstract shows one instance of a terminology choice that, while not incorrect, is suboptimal for APA. Longer documents will have more such choices.
