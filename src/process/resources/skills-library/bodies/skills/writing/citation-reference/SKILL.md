---
name: citation-reference
description: |
  Formats citations and reference lists in APA, MLA, Chicago, or IEEE style with precise adherence to each style's rules. Converts between styles and checks citation accuracy.
  Use when the user asks to format citations, create a reference list, convert citation styles, or check citation formatting against a specific style guide.
  Do NOT use for literature review writing (use literature-review), paper structure (use research-paper-structure), or general editing (use copy-editing).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "academic-writing writing template"
  category: "writing"
  subcategory: "academic-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Citation Reference

## When to Use

**Use this skill when:**
- The user provides raw source information (author, title, year, journal, etc.) and asks for it formatted in APA, MLA, Chicago, or IEEE style
- The user pastes existing citations that may be incorrect and asks for a formatting check or correction
- The user wants to convert an entire reference list or bibliography from one style to another (e.g., switching a manuscript from APA to Chicago for resubmission)
- The user needs to cite an unusual or emerging source type -- datasets, preprints, software packages, social media posts, legal instruments, archival materials, personal communications, or AI-generated content -- and is unsure of the correct format
- The user is assembling a formatted reference list from a mix of source types and needs consistent, accurate, style-compliant output
- The user needs to know the correct in-text citation form for a specific scenario (multiple authors, corporate author, anonymous source, secondary citation, same author multiple years)
- The user is preparing a manuscript for journal submission and needs to verify citation compliance with a specific publication's style requirements

**Do NOT use this skill when:**
- The user wants to write, synthesize, or analyze a body of literature -- use `literature-review`
- The user wants guidance on structuring sections of a research paper -- use `research-paper-structure`
- The user wants grammatical or stylistic editing of their prose -- use `copy-editing`
- The user is asking how to evaluate source quality or credibility -- use `source-evaluation`
- The user needs to find or locate sources -- use `research-strategy`
- The user needs citation management software setup (Zotero, Mendeley, EndNote) rather than formatted output -- redirect to software documentation
- The user is asking about plagiarism or paraphrasing ethics generally -- use `academic-integrity`

---

## Process

### Step 1: Establish the Formatting Requirements

Before writing a single citation, gather the following:

- **Style and edition:** The four primary styles each have a current authoritative edition -- APA 7th (2020), MLA 9th (2021), Chicago 17th (2017) Notes-Bibliography OR Author-Date variant, IEEE (currently the 2018 editorial style manual). Edition matters -- APA 6th vs. 7th have meaningful differences (institutional affiliation dropped from author line, DOI formatting changed, no "Retrieved from" for stable DOIs, singular "they" accepted).
- **Chicago variant:** Always clarify whether the user needs Notes-Bibliography (humanities, publishing) or Author-Date (sciences, social sciences). These are not interchangeable and produce structurally different citations.
- **Source inventory:** Identify all source types in the batch before beginning. Each source type has its own template; mixing up templates is the most common error.
- **Discipline inference:** If the user cannot specify a style, recommend based on field -- APA for psychology, education, social sciences, nursing; MLA for literature, language, cultural studies; Chicago NB for history, art history, theology, archival research; Chicago AD for anthropology, some humanities; IEEE for electrical engineering, computer science, electronics.
- **DOI/URL status:** Determine whether stable DOIs are available. APA 7th requires DOIs over URLs whenever DOIs exist. IEEE requires bracketed "Available" URLs with "Accessed:" date. Confirm this before outputting.

### Step 2: Identify and Categorize Every Source Type

Map each source to its correct template. The most important categorical distinctions are:

- **Periodical type:** Peer-reviewed journal article vs. magazine article vs. newspaper article vs. edited collection chapter -- these have different templates in every style. A chapter in an edited book is not the same as a journal article.
- **Authorship structure:** Single author / two authors / three or more authors / corporate/institutional author / no author / editor(s) as author / translator -- each triggers different in-text and reference-list formatting rules.
- **Publication medium:** Print, online-only, or both. APA 7th no longer differentiates print vs. online journal articles; MLA 9th requires "container" logic regardless of medium; IEEE requires medium designators like [Online] or [E-book].
- **Access type:** For websites and online documents, identify whether it is a static document (no retrieval date needed in APA) or a page likely to change (retrieval date recommended in APA). Institutional repositories, preprint servers (arXiv, bioRxiv, SSRN, PsyArXiv), and personal pages each have slightly different handling.
- **Edition and version:** Books in second or later editions require that information. Software and datasets require version numbers.

Common source-type trap: A report from the World Health Organization or a government agency is NOT formatted as a website -- it uses the institutional report template, which appears in all four style guides.

### Step 3: Format In-Text Citations

Apply style-specific rules precisely. The rules below cover the most frequently encountered scenarios:

**APA 7th In-Text:**
- 1 author: (Smith, 2023) or Smith (2023) -- narrative form is acceptable and encouraged for integration into prose
- 2 authors: always cite both: (Smith & Jones, 2023)
- 3+ authors: first author et al. from the first citation: (Smith et al., 2023) -- "et al." is now standard from first use for 3+ authors
- Corporate author: Spell out fully on first use with abbreviation introduced if the name is long and recurs: (World Health Organization [WHO], 2022) then (WHO, 2022)
- Same author, same year: alphabetical title disambiguation: (Smith, 2023a) and (Smith, 2023b)
- No author: use the first few words of the title in the position of the author, in italics if the title would be italicized in the reference list, or in quotation marks if the title would be in quotes: (*Diagnostic Manual*, 2023) or ("Understanding Sleep," 2023)
- Secondary source (citing a source found in another source): (Original Author, year, as cited in Secondary Author, year) -- only the secondary source appears in the reference list; flag that the primary source should be sought
- Specific page/paragraph: (Smith, 2023, p. 45), (Smith, 2023, pp. 45-47), (Smith, 2023, para. 3), (Smith, 2023, Table 2)
- Multiple sources in one parenthetical: alphabetical by first author, semicolon-separated: (Jones, 2021; Smith, 2023; Walker, 2020)

**MLA 9th In-Text:**
- Author-page: (Smith 45) -- no comma, no "p."
- 2 authors: (Smith and Jones 45) -- spelled out "and," not ampersand
- 3+ authors: (Smith et al. 45) -- "et al." with no period after "et"
- No page numbers (common for websites, ebooks): cite the author only: (Smith) or, if no author, first significant word(s) of title
- No author: first words of the title, formatted to match the Works Cited entry (italics or quotes): (*Diagnostic Manual* 23) or ("Understanding Sleep")
- Multiple works by same author: include a short title: (Smith, "Memory" 45)
- Entire work, not specific page: author name only in parenthetical or work name in prose is sufficient; no parenthetical needed if the author is named in the sentence

**Chicago Notes-Bibliography (NB) In-Text:**
- Superscript footnote/endnote numbers in the running text, placed after punctuation
- First full note: Author First Last, *Title*, (Place: Publisher, Year), page.
- Subsequent notes for same work (short form): Last, *Short Title*, page. -- OR use "Ibid." only if citing the same work consecutively with no intervening note; Ibid. with a different page: Ibid., 23.
- Cross-references: "n. 12 above" or "n. 12 below" for notes referring to other notes

**Chicago Author-Date (AD) In-Text:**
- (Author Year) or (Author Year, page): (Smith 2023) or (Smith 2023, 45)
- 3 authors: all named first time: (Smith, Jones, and Walker 2023); et al. for 4+
- Multiple sources: (Jones 2021; Smith 2023)

**IEEE In-Text:**
- Numbered in square brackets in order of first appearance: [1], [2], [3]
- Multiple references: [1], [2] or [1]--[3] for a range
- If a single reference is cited multiple times, always use the same number
- Author name in running text is optional; the number carries the citation

### Step 4: Build Reference List Entries -- Source by Source

The following templates cover the most common source types across all four styles. Use these as the authoritative production templates.

**Peer-Reviewed Journal Article:**

*APA 7th:*
> Last, F. M., & Last, F. M. (Year). Title of article in sentence case. *Title of Journal in Title Case*, *Volume*(Issue), first page--last page. https://doi.org/xxxxx

Key rules: DOI formatted as hyperlink (https://doi.org/), no "Retrieved from," sentence case for article title, title case for journal name, volume italicized, issue NOT italicized (inside parentheses immediately after volume), no space between volume and parenthetical issue number.

*MLA 9th:*
> Last, First, and First Last. "Title of Article in Title Case." *Title of Journal*, vol. #, no. #, Year, pp. first--last, https://doi.org/xxxxx.

Key rules: title case for article title, "vol." and "no." in lowercase, "pp." for page range, DOI or URL as final element followed by period.

*Chicago NB -- Bibliography:*
> Last, First, and First Last. "Title of Article." *Title of Journal* Volume, no. Issue (Year): first--last page. https://doi.org/xxxxx.

*Chicago AD -- Reference List:*
> Last, First, and First Last. Year. "Title of Article." *Title of Journal* Volume (Issue): first--last page. https://doi.org/xxxxx.

*IEEE:*
> F. M. Last and F. M. Last, "Title of article," *Title of Journal*, vol. #, no. #, pp. first--last, Mon. Year, doi: 10.xxxxx.

Key rules: author initials before last name, no quotes around article title (just standard type), journal name italicized, month abbreviation (Jan., Feb., Mar., Apr., May, Jun., Jul., Aug., Sep., Oct., Nov., Dec.), doi: without https://.

**Edited Book Chapter:**

*APA 7th:*
> Chapter Author, F. M. (Year). Title of chapter. In F. M. Editor (Ed.), *Title of Book* (pp. first--last). Publisher. https://doi.org/xxxxx [if applicable]

*MLA 9th:*
> Chapter Author, First. "Title of Chapter." *Title of Book*, edited by First Last, Publisher, Year, pp. first--last.

*Chicago NB -- Bibliography:*
> Chapter Author, First. "Title of Chapter." In *Title of Book*, edited by First Last, first--last. Place: Publisher, Year.

*Chicago AD:*
> Chapter Author, First. Year. "Title of Chapter." In *Title of Book*, edited by First Last, first--last. Place: Publisher.

*IEEE:*
> F. M. Last, "Title of chapter," in *Title of Book*, F. M. Editor, Ed. City: Publisher, Year, pp. first--last.

**Entire Book:**

*APA 7th:*
> Last, F. M. (Year). *Title of book: Subtitle in sentence case* (Nth ed.). Publisher. https://doi.org/xxxxx [for ebooks with DOI]

Key rules: edition information in parentheses before publisher (2nd ed.), no place of publication in APA 7th (removed from 7th edition -- a significant change from 6th).

*MLA 9th:*
> Last, First. *Title of Book: Subtitle*. Nth ed., Publisher, Year.

*Chicago NB:*
> Last, First. *Title of Book: Subtitle*. Nth ed. Place: Publisher, Year.

*Chicago AD:*
> Last, First. Year. *Title of Book: Subtitle*. Nth ed. Place: Publisher.

*IEEE:*
> F. M. Last, *Title of Book*, Nth ed. City: Publisher, Year.

**Webpage / Online Document:**

*APA 7th:*
> Last, F. M. (Year, Month Day). Title of page in sentence case. Site Name. [Retrieved Month Day, Year, from] URL

Retrieval date required only if the content is expected to change or has no date. For dated, stable pages, no retrieval date.

*MLA 9th:*
> Last, First. "Title of Page." *Site Name*, Day Month Year, URL. Accessed Day Month Year.

"Accessed" date always required for online sources in MLA 9th.

*Chicago NB:*
> Last, First. "Title of Page." Site Name. Last modified Month Day, Year. URL.
-- or --
> Last, First. "Title of Page." Site Name. Accessed Month Day, Year. URL.

*Chicago AD:*
> Last, First. Year. "Title of Page." Site Name. Month Day, Year. URL.

*IEEE:*
> F. M. Last, "Title of page," *Site Name*. [Online]. Available: URL. Accessed: Mon. DD, YYYY.

**Conference Paper (Published in Proceedings):**

*APA 7th:*
> Last, F. M. (Year, Month Day--Day). Title of paper [Paper presentation]. Conference Name, City, Country. https://doi.org/xxxxx

*MLA 9th:*
> Last, First. "Title of Paper." *Proceedings of Conference Name*, edited by First Last, Publisher, Year, pp. first--last.

*Chicago NB:*
> Last, First. "Title of Paper." Paper presented at Conference Name, City, Country, Month Day--Day, Year.

*IEEE:*
> F. M. Last, "Title of paper," in *Proc. Conference Name (ABBREV)*, City, Country, Year, pp. first--last.

**Report (Government, Institutional, or Think-Tank):**

*APA 7th:*
> Author, F. M., or Institution Name. (Year). *Title of report* (Report No. XXX if applicable). Publisher/Institution. https://doi.org/xxxxx or URL

*MLA 9th:*
> Author/Institution. *Title of Report*. Report No. XXX, Institution, Year.

*Chicago NB:*
> Institution Name. *Title of Report*. Report No. XXX. Place: Institution, Year.

*IEEE:*
> Institution Name, "Title of report," Institution, City, Country, Tech. Rep. No. XXX, Month Year.

### Step 5: Apply Capitalization Rules -- The Most Error-Prone Element

Capitalization rules differ dramatically by style and by what element is being formatted:

**APA 7th:**
- Article/chapter titles: sentence case -- capitalize only the first word, the first word after a colon, and proper nouns. "The role of sleep in memory consolidation" is correct; "The Role of Sleep in Memory Consolidation" is wrong.
- Journal/book titles: title case in the reference list. *Journal of Abnormal Psychology*, *Cognitive Development in Adolescence*.
- In-text: no special capitalization beyond normal grammar rules.

**MLA 9th:**
- All titles in the Works Cited list: title case. Capitalize the first and last words of any title and subtitle, and all "principal words" (nouns, verbs, adjectives, adverbs, pronouns). Do not capitalize prepositions, articles (a, an, the), or coordinating conjunctions (and, but, or, nor, for, so, yet) unless they are the first or last word.
- Article titles appear in quotation marks in title case; book/journal titles in italics in title case.

**Chicago NB and AD:**
- Book and journal titles: title case, italicized.
- Article and chapter titles: title case, in quotation marks.
- Subtitles: capitalize the first word after a colon in addition to principal words.

**IEEE:**
- Article titles in the reference list: standard mixed case (no title case, no sentence case) -- capitalize only proper nouns and the first word; similar to sentence case but less strictly defined by the style manual. In practice, use sentence case for article titles and title case for journal/conference names.

### Step 6: Handle Author Name Formatting

Author name formatting rules are style-specific and error-prone:

**APA 7th:**
- Invert all author names: Last, F. M.
- Up to 20 authors listed in full: Last1, F., Last2, F., Last3, F., ... Last20, F., & LastN, F.
- For 21+ authors: list first 19, insert an ellipsis (three spaced periods: . . .), then add the final author's name. No ampersand.
- Editors: (Ed.) or (Eds.) after the name in parentheses
- Corporate author: write out the full name: American Psychological Association

**MLA 9th:**
- First author inverted (Last, First); subsequent authors in natural order (First Last)
- "and" (spelled out, not "&") between the penultimate and final author
- For 3+ authors: list first author inverted, then "et al." -- however, the full list may always be used. "et al." is optional.
- Editors: "edited by First Last" (lowercase "edited by") in the source element

**Chicago NB (Bibliography):**
- First author inverted; all subsequent authors in natural order
- All authors listed (no truncation rule, though very long lists are sometimes shortened with "et al." at 10+ in practice)
- Editors without authors: First Last, ed. or eds.

**Chicago AD (Reference List):**
- Same as NB for author formatting
- For 10+ authors: list the first 7, then "et al."

**IEEE:**
- ALL authors listed with initials first: F. M. Last -- NO inversion
- First initials, then last name: "B. P. Smith" not "Smith, B. P."
- Up to 6 authors listed; for 7+ use "et al." after the first author

### Step 7: Verify Completeness and Internal Consistency

Before delivering output, run a systematic check:

- **Bidirectional match:** Every in-text citation maps to exactly one reference list entry. Every reference list entry has at least one in-text citation. A mismatch in either direction is an error.
- **Author-name consistency:** If "Smith & Jones (2023)" appears in-text, the reference entry must begin with Smith (not Jones) and include both names. Author order in the reference list must match the order in the source, not alphabetize contributors internally.
- **Title consistency:** The title in the reference list must match the actual published title, not a paraphrase. If the user provides a title that appears to be paraphrased or abbreviated, flag it.
- **Missing elements:** For each source type, check that every required field is populated. Flag any with [needed: field name] markers.
- **Date consistency:** If the user provides different dates for the same source in different places, reconcile or flag the discrepancy.
- **DOI/URL syntax:** DOIs must begin with https://doi.org/ in APA (not "doi:" or "DOI:" alone) but use "doi:" without the URL in IEEE. Check this precisely.
- **Alphabetical ordering (APA, MLA, Chicago AD):** Reference list is alphabetized by the first element used in the entry -- usually first author's last name, or title first word (ignoring "A," "An," "The") when no author. Numbers sort before letters.
- **Numerical ordering (IEEE):** References are numbered 1, 2, 3... in order of first appearance in the text, not alphabetically. A source cited for the first time in the conclusion gets a higher number than one cited in the introduction, even if it would come first alphabetically.

---

## Output Format

Deliver the following structured output for every citation formatting request:

```
## Citation Formatting

**Style:** [APA 7th / MLA 9th / Chicago 17th NB / Chicago 17th AD / IEEE]
**Sources formatted:** [n]
**Source types present:** [e.g., 2 journal articles, 1 edited book chapter, 1 website]

---

### In-Text Citations

| Location / Context | Formatted In-Text Citation |
|--------------------|---------------------------|
| [Description of where/how used, e.g., "after quote on p. 3"] | [Formatted citation] |
| [e.g., "narrative citation, author as subject"] | [e.g., Smith (2023) found that...] |

[If IEEE: in-text citations are numbered [1], [2], etc. Reference list order follows.]

---

### [References / Works Cited / Bibliography / References]

[Full reference list, each entry on its own line. Hanging indent implied. Numbered for IEEE.]

[Example:]
Author, F. M. (Year). *Title of work*. Publisher.

Author, F. M. (Year). Title of article. *Journal Title*, *Vol*(Iss), pp--pp. https://doi.org/xxxxx

---

### Formatting Notes

| Source | Issue | Resolution |
|--------|-------|------------|
| [Author/title] | [e.g., "DOI not provided"] | [e.g., "URL used; add DOI if available"] |
| [Author/title] | [e.g., "Author first name not given"] | [e.g., "Initials listed as [needed: first initial]"] |

---

### Missing Information

[List any fields that could not be completed. Format:]
- **[Source identifier]:** Missing [field]. Mark as [needed: field] until confirmed.

---

### Citation Checklist

- [ ] Every in-text citation has a matching reference list entry
- [ ] Every reference list entry is cited in-text at least once
- [ ] All required fields present for each source type (or flagged as [needed])
- [ ] Capitalization rules applied correctly (sentence case vs. title case per style)
- [ ] Author names formatted correctly (inverted/initials/all authors vs. et al. per style)
- [ ] Titles italicized or quoted correctly per source type
- [ ] Reference list in correct order (alphabetical / numbered by appearance)
- [ ] DOIs formatted correctly for this style (https://doi.org/ vs. doi: vs. URL)
- [ ] Punctuation consistent and style-compliant throughout
```

---

## Rules

1. **Never invent citation data.** If a page number, volume number, DOI, publisher, or publication date is not provided, mark it as `[needed: field name]` and note it in the Missing Information section. Do not estimate, approximate, or fabricate bibliographic details. A citation with a wrong page number is worse than one flagged as incomplete.

2. **Never mix styles within a single output.** Every reference in a batch must follow the same style guide edition. If the user's existing citations mix APA and MLA conventions, flag each error individually rather than blending the conventions to split the difference.

3. **Always confirm Chicago variant before proceeding.** Chicago NB and Chicago AD produce structurally different reference entries and in-text citations. Defaulting to one without confirmation risks complete reformatting. If context does not make it obvious (e.g., history dissertation implies NB; anthropology journal implies AD), ask.

4. **Apply the current edition rules, not outdated conventions.** APA 6th required place of publication for books; APA 7th does not. APA 6th used "doi:" prefix; APA 7th uses https://doi.org/. MLA 8th introduced the "containers" framework; MLA 9th refined it. Do not apply previous-edition rules, even if the user's institution has historical documentation that reflects them. Flag if the user appears to be working from an outdated edition.

5. **Sentence case and title case are not interchangeable.** In APA 7th, article and chapter titles are sentence case in the reference list; book and journal titles are title case. Capitalizing every principal word in an APA article title is wrong. In MLA 9th, all titles are title case. This is one of the most common errors in machine-generated citations -- verify every title.

6. **Author order in the reference list must match the published author order.** Do not alphabetize authors within a single source entry (a common AI error). The author listed first on the publication is listed first in the citation, and the reference list is alphabetized by that first-listed author's last name.

7. **IEEE numbering is appearance-based, not alphabetical.** Every source gets a unique integer in square brackets assigned the first time it appears in the text. If the user is working from a document, assign numbers in the order citations would appear from introduction to conclusion. Do not alphabetize or reorder IEEE references.

8. **Distinguish journal articles from book chapters from reports.** Using the wrong template produces structurally incorrect citations that will fail peer review checks. A WHO technical report is not a webpage. A chapter in an edited Handbook is not a journal article. A preprint on bioRxiv is not a published journal article -- it gets its own preprint template with the preprint server name and DOI.

9. **DOIs take precedence over URLs in APA 7th and Chicago.** If a DOI is available, it must be used instead of a URL. If only a URL is available, include it without "Retrieved from" for stable pages. Never include both DOI and URL for the same source in APA or Chicago -- DOI alone is sufficient and preferred.

10. **Flag secondary citations and strongly recommend finding the primary source.** Citing a source you have not read (using it only because another author cited it) is academically problematic. Always note when a citation is secondary (Author X as cited in Author Y) and recommend locating the primary source. Only the secondary source appears in the reference list, but the limitation must be acknowledged.

---

## Edge Cases

**1. Preprints (arXiv, bioRxiv, SSRN, PsyArXiv, medRxiv)**
Preprints are not peer-reviewed publications and must be identified as such. In APA 7th, cite as: Author, F. M. (Year). *Title of preprint*. Preprint Server Name. https://doi.org/xxxxx -- include "[Preprint]" before the DOI. In MLA 9th, treat the preprint server as the container (*bioRxiv*). In Chicago, note "[preprint]" in the entry. In IEEE, use the arXiv identifier: "arXiv:xxxx.xxxxx." If the preprint has since been published as a peer-reviewed article, use the final published version and note the update. Alert the user that citing a preprint in published work requires checking whether a final version now exists.

**2. Sources with No Author**
- APA 7th: Use the organization name if it is an institution. If truly authorless (e.g., a government statute, an anonymous online article), move the title to the author position. Alphabetize by the first significant word of the title. In-text: (*Title Fragment*, Year).
- MLA 9th: Move the title to the first position. In-text: (*Short Title* page) or ("Short Title" page).
- Chicago NB: For anonymous authored works, use the title in the footnote and bibliography, sorted by title. The label "Anonymous" or "Anon." is not used in Chicago.
- IEEE: If no author, use the organization or title in the author position.
- Never use "Anonymous" as an author name in APA or MLA. It is only acceptable in Chicago for historical documents that were genuinely published as "Anonymous."

**3. Sources with No Date**
- APA 7th: (n.d.) in place of the year in both in-text and reference list -- (Smith, n.d.) and Smith, F. (n.d.).
- MLA 9th: Omit the date element if no date is available. If it is a webpage, include "Accessed" date.
- Chicago: Use "n.d." in place of year.
- IEEE: Omit year; note "[no date]" if the tool requires an entry.
- A webpage with no publication or update date is still citable. Use the accessed date and mark the publication date as unavailable. Alert the user that undated web sources are lower-quality citations.

**4. Multiple Works by the Same Author in the Same Year (APA)**
Add a lowercase letter immediately after the year, both in-text and in the reference list. The letter assignment follows alphabetical title order: the title beginning with "A" or earlier in alphabetical sequence gets "a"; the next gets "b," etc. Example: (Smith, 2023a) and (Smith, 2023b). In the reference list, order these entries alphabetically by title to confirm the a/b assignment.

**5. Translators, Editors Without Authors, and Multi-Role Contributors**
- A translated work in APA 7th: Author, F. M. (Year). *Title* (F. M. Translator, Trans.). Publisher. (Original work published Year). In-text: (Author, Original Year/Translation Year) -- e.g., (Freud, 1900/1965).
- An edited volume with no single author: Editor, F. M. (Ed.). (Year). *Title*. Publisher.
- Chicago distinguishes primary creative role (author) from secondary editorial role (editor) with "ed." or "trans." labels.
- IEEE typically does not cite translated works frequently; use the translator's name in the optional note field.

**6. Legal and Legislative Sources**
Legal citation is a specialized sub-discipline. For law review articles, primary legal documents (statutes, court cases, regulations), and treaty texts, the Bluebook (21st ed.) is the authoritative legal style -- not APA, MLA, or Chicago. However:
- APA 7th has a dedicated appendix for legal references. Format as: Name v. Name, Volume Reporter Page (Court Year) for court cases. For statutes: Title of Act, Volume U.S.C. § Section (Year).
- Chicago 17th section 14.269--14.294 covers legal references in detail.
- MLA 9th recommends following Bluebook or institutional convention for legal documents.
- IEEE does not regularly cite legal documents; treat as government report.
- Alert the user when they are in legal-citation territory: recommend Bluebook compliance if the document is for legal or law-adjacent publication.

**7. AI-Generated Content (ChatGPT, Gemini, Claude, Midjourney, etc.)**
This is an actively evolving area where style guides are updating in real time:
- APA 7th (updated guidance 2023): Treat as software. Author is the company (e.g., OpenAI). Cite as: OpenAI. (2023). *ChatGPT* (March 14 version) [Large language model]. https://chat.openai.com -- the specific prompt or exchange is noted in-text but not separately in the reference list. Note that AI content is not retrievable by readers and many journals prohibit citing it as a source.
- MLA 9th (updated guidance 2023): Author is the AI tool name. "Title" is a description of the prompt. Container is the company platform.
- Chicago does not yet have official AI guidance in the 17th edition; recommend following the spirit of the software citation format with a note describing the query.
- Always alert the user: most journals and many institutions have policies restricting or prohibiting citation of AI-generated content as an authoritative source.

**8. Converting an Entire Reference List Between Styles**
When converting 10+ references from one style to another systematically:
1. First inventory all source types present, because each type has a different conversion complexity.
2. Build a conversion map: identify which elements exist in both styles, which are dropped, and which are added. For example, APA-to-Chicago conversion requires adding place of publication (dropped in APA 7th but required in Chicago) -- this information must be sourced or flagged.
3. Process by source type, not by individual entry -- format all journal articles together, then all books, etc. This reduces template-switching errors.
4. After conversion, verify alphabetical order (for APA/MLA/Chicago AD) or renumber in appearance order (IEEE). Changing from APA to IEEE often completely reorders the reference list.
5. Flag any information that was present in the original style but is not required in the target style (informational loss) and any information required by the target style that was not captured in the original (informational gap requiring user input).

---

## Example

**Input:** "I'm writing a psychology paper and need APA 7th edition citations for these three sources:

1. A journal article: Emily Chen and David Park published 'Cognitive flexibility and executive function in bilingual adults' in the Journal of Cognitive Psychology, 2022, volume 34, issue 3, pages 201-219. DOI: 10.1080/20445911.2022.2054321

2. A book chapter: Marcus Webb wrote 'Self-regulation in adolescence' in a book called 'Handbook of Developmental Psychology', edited by Susan Okafor and James Lim, published by Guilford Press in 2021. The chapter is on pages 88-115.

3. A website: The American Psychological Association posted 'Stress and your health' on their main website (apa.org) in November 2023. No specific day is listed.

I'll be quoting Chen and Park on page 208 and paraphrasing Webb at the start of a section with no specific page cited. The APA web article I'm referencing as general background."

---

**Output:**

## Citation Formatting

**Style:** APA 7th edition
**Sources formatted:** 3
**Source types present:** 1 peer-reviewed journal article, 1 edited book chapter, 1 organizational webpage

---

### In-Text Citations

| Context | Formatted In-Text Citation |
|---------|---------------------------|
| Direct quote from Chen & Park, p. 208 | (Chen & Park, 2022, p. 208) |
| Paraphrase of Webb, no specific page | (Webb, 2021) |
| General background reference, APA webpage | (American Psychological Association, 2023) |

**Notes on in-text forms:**
- For the direct quote, APA 7th requires p. + page number after the year.
- For the Webb paraphrase, APA 7th recommends (but does not require) a page number for paraphrases. Including one is best practice if the specific passage is being paraphrased closely.
- The American Psychological Association is a corporate author. On first use, write out in full. If you cite this source again, "(American Psychological Association, 2023)" is repeated in full each time unless you introduce an abbreviation: (American Psychological Association [APA], 2023) on first use, then (APA, 2023) subsequently. Use the abbreviation only if it is widely recognized and the abbreviation is used more than once.

---

### References

American Psychological Association. (2023, November). Stress and your health. *American Psychological Association*. https://www.apa.org/topics/stress/health

Chen, E., & Park, D. (2022). Cognitive flexibility and executive function in bilingual adults. *Journal of Cognitive Psychology*, *34*(3), 201--219. https://doi.org/10.1080/20445911.2022.2054321

Webb, M. (2021). Self-regulation in adolescence. In S. Okafor & J. Lim (Eds.), *Handbook of developmental psychology* (pp. 88--115). Guilford Press.

---

### Formatting Notes

| Source | Element | Note |
|--------|---------|------|
| Chen & Park (2022) | DOI | Formatted as https://doi.org/ hyperlink per APA 7th. The doi: prefix (APA 6th style) is incorrect in 7th edition. |
| Chen & Park (2022) | Journal title | *Journal of Cognitive Psychology* in title case and italicized -- correct for journal names in APA 7th. |
| Chen & Park (2022) | Article title | Sentence case applied: "Cognitive flexibility and executive function in bilingual adults" -- only first word capitalized, no other words capitalized except proper nouns (none present here). |
| Webb (2021) | Book title | Sentence case applied: *Handbook of developmental psychology* -- "Handbook" capitalized because it is the first word. "Developmental" is NOT capitalized in the reference list even though the book title renders it capitalized on the cover. |
| Webb (2021) | Editor format | In APA 7th, editors appear with initials before last name (not inverted) after "In," followed by "(Ed.)" or "(Eds.)" in parentheses. Two editors take "(Eds.)." |
| Webb (2021) | Publisher | No place of publication listed -- correct per APA 7th, which eliminated city/country from book references. |
| APA webpage | Date | Only month and year provided (no day). APA 7th format when day is unknown: (Year, Month). If neither month nor day is known, use year only. |
| APA webpage | Retrieval date | APA 7th does not require a retrieval date for stable pages with a publication date. However, organizational pages on health topics can change. Consider adding "Retrieved [date], from" before the URL if this document may be updated or removed. |

---

### Missing Information

- **Chen & Park (2022):** No missing fields. Citation is complete.
- **Webb (2021):** Author first name provided as "Marcus" -- abbreviated to "M." per APA 7th. Editors' first names provided ("Susan," "James") -- abbreviated to "S." and "J." respectively. Confirm these match the actual publication.
- **APA webpage:** Specific day of publication not available (November 2023 only). This is noted and accounted for in the formatted entry. If you can identify the specific page URL path, verify it matches the canonical URL on apa.org for stable linking.

---

### Citation Checklist

- [x] Every in-text citation has a matching reference list entry (Chen & Park → reference #2; Webb → reference #3; APA → reference #1)
- [x] Every reference list entry is cited in-text at least once
- [x] All required fields present for each source type (journal: authors, year, title, journal, volume, issue, pages, DOI -- all present; book chapter: chapter author, year, chapter title, editors, book title, pages, publisher -- all present; webpage: author/org, year, month, title, site name, URL -- all present)
- [x] Sentence case applied to article and chapter titles; title case applied to journal and book titles
- [x] Author names inverted and formatted with initials (Last, F. M.); two-author entries use "&"; editors formatted with initials before last name
- [x] Journal article title and chapter title NOT italicized; journal name, book title italicized
- [x] Reference list in alphabetical order by first author's last name (American Psychological Association → A; Chen → C; Webb → W)
- [x] DOI formatted as https://doi.org/xxxxx (APA 7th style), not doi: prefix
- [x] Volume number italicized, issue number in parentheses NOT italicized: *34*(3)
- [x] Page ranges use en dash (--), not hyphen (-), per APA 7th convention
