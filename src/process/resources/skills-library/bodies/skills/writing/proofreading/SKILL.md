---
name: proofreading
description: |
  Proofreads text for spelling, grammar, punctuation, and typographical errors, producing marked-up output with corrections and explanations. Final-pass error detection before publication.
  Use when the user asks to proofread a document, check for typos, fix grammar errors, or do a final error check on written text.
  Do NOT use for structural editing (use structural-editing), content revision (use copy-editing), tone changes (use tone-adjustment), or improving readability (use readability-improvement).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "editing writing planning"
  category: "writing"
  subcategory: "editing-refinement"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Proofreading

## When to Use

**Use this skill when:**
- The user explicitly asks to "proofread," "check for errors," "catch typos," "fix grammar," or do a "final pass" on text that is already written and substantially complete
- The user is preparing a document for publication, submission, or distribution and needs error-free text (academic paper, press release, job application cover letter, legal brief, marketing copy)
- The user says the content and structure are finalized and they only want mechanical errors corrected -- not the ideas, organization, or word choice changed
- The user wants to understand what errors they are making so they can self-correct in the future (learning-oriented proofreading)
- The user needs a consistency audit of a longer document -- checking that a proper noun is spelled the same way throughout, that heading levels are uniform, that numbered lists use consistent terminal punctuation
- The user submits a short professional communication (email, cover letter, bio) and asks to make sure it is "clean" or "ready to send"
- The user is submitting to a publication, journal, or client with a known style guide (AP, Chicago, APA, MLA, AMA, house style) and needs that guide applied

**Do NOT use this skill when:**
- The user wants sentences restructured, paragraphs reordered, or sections moved -- use `structural-editing` instead
- The user wants weak sentences rewritten for force, clarity, or precision -- use `copy-editing` instead
- The user wants the overall tone shifted (more formal, warmer, more confident) -- use `tone-adjustment` instead
- The user wants the text simplified for readability or accessibility -- use `readability-improvement` instead
- The user wants to verify factual accuracy of claims, statistics, or dates -- use `fact-check-framework` instead
- The user asks to "improve" or "make this better" without specifying error correction -- this ambiguous request needs scoping before proofreading begins; ask whether they mean error correction only, or also stylistic improvement
- The user is still drafting and has not completed a revision pass -- proofreading should be the last step in the writing process, not applied to a rough draft

---

## Process

### Step 1: Characterize the document before touching a single word

Before identifying any error, establish the interpretive context that determines what counts as an error:

- **Document type:** Academic essay, business report, fiction, journalism, legal document, marketing copy, technical documentation, personal email, social media post -- each has different conventions. A comma splice that is an error in an academic paper may be a deliberate rhythmic device in literary fiction.
- **Style guide in force:** Ask the user explicitly if it is not stated. Common guides and their key differences:
  - *AP Style* (journalism): Spell out numbers one through nine, abbreviate months, no Oxford comma by default, title case for formal titles before names only
  - *Chicago Manual of Style* (books, academic humanities): Oxford comma required, numbers one through one hundred spelled out, footnotes and endnotes for citations
  - *APA 7th edition* (social sciences): Numbers expressed as numerals when 10 or above, specific heading levels, running head on title page only
  - *MLA 9th edition* (humanities papers): Works Cited page, specific formatting for block quotations (prose: 4+ lines, poetry: 3+ lines)
  - *AMA* (medical/scientific): Numerals for all numbers 10 and above, specific abbreviation conventions for units
  - If no style guide is specified and none can be inferred, default to Chicago for formal prose and AP for journalistic or marketing text
- **Dialect of English:** American, British, Canadian, Australian, and South African English differ systematically in spelling (colour/color, organise/organize, centre/center), punctuation (British English places punctuation outside quotation marks in many cases), and vocabulary. Do not flag British spellings as errors in British English text.
- **Register:** Formal academic, professional business, conversational, casual, literary. Register determines whether contractions are errors (they are in formal academic writing; they are not in conversational blog posts), whether sentence fragments are acceptable (often yes in creative writing and marketing copy), and whether colloquial phrasing is intentional.
- **Known intentional features:** Scan for signs of authorial style -- repeated structural patterns, unconventional punctuation used consistently (an author who always uses em dashes in a specific way), deliberate dialect features (dialogue written in a regional dialect). Flag these for yourself so you do not accidentally "correct" them.

### Step 2: Conduct a systematic error scan in a defined sequence

Do not scan once and hope to catch everything. Professional proofreaders make multiple targeted passes because the brain normalizes text when reading for meaning. Run these passes in order:

**Pass 1 -- Spelling:**
- Common misspellings: accommodate (two c's, two m's), occurrence, separate (not seperate), necessary (one c, two s's), definitely (not definately), receive (i before e), liaison, privilege, calendar
- Homophones -- the single largest class of errors that spell-checkers miss:
  - their/there/they're
  - your/you're
  - its/it's (its = possessive pronoun, no apostrophe; it's = it is or it has)
  - affect/effect (affect is almost always a verb meaning to influence; effect is almost always a noun meaning the result -- rare exceptions: effect as a verb meaning "to bring about"; affect as a noun in psychology)
  - complement/compliment
  - principal/principle
  - stationary/stationery
  - discrete/discreet
  - flaunt/flout
  - ensure/insure/assure
  - further/farther (farther = measurable physical distance; further = figurative or degree)
  - lay/lie (lay requires a direct object: "Lay the book down"; lie does not: "I lie down")
  - who's/whose
  - then/than
- Near-miss words (correctly spelled but wrong word): desert/dessert, precede/proceed, council/counsel, cite/site/sight, peak/pique/peek

**Pass 2 -- Grammar:**
- *Subject-verb agreement:* Especially with collective nouns (the committee is/are -- "is" in American English, "are" acceptable in British), indefinite pronouns (everyone, everyone is -- not "are"), intervening phrases that mislead ("The box of apples was left," not "were")
- *Tense consistency:* Identify the primary tense of the document. Flag all shifts that are not logically motivated (historical present in narrative is acceptable; random shifts are not)
- *Pronoun-antecedent agreement:* Vague "this" and "it" referents, mismatched number (a company ... they -- "a company" is singular), ambiguous pronoun reference when two nouns of the same gender precede a pronoun
- *Dangling and misplaced modifiers:* "Walking down the street, the trees were beautiful" -- the trees are not walking. The participial phrase must modify the sentence's grammatical subject.
- *Parallel structure:* Items in a list or series must use the same grammatical form. "She likes running, to swim, and to eat" is non-parallel; "She likes running, swimming, and eating" is parallel.
- *Sentence fragments:* Subordinate clauses standing alone ("Because the report was late."), verbless sentences in formal writing -- flag and check whether intentional
- *Run-on sentences and comma splices:* "I went to the store, I bought milk" is a comma splice (two independent clauses joined only by a comma). Options: period, semicolon, coordinating conjunction, or subordination.
- *Double negatives:* "I didn't do nothing" is non-standard in formal writing
- *Incorrect comparative/superlative forms:* "more better," "most unique" (unique is an absolute adjective -- something either is unique or is not)

**Pass 3 -- Punctuation:**
- *Comma rules:* After introductory phrases/clauses of 5+ words (shorter introductory elements are discretionary), around non-restrictive (non-essential) clauses, between independent clauses joined by coordinating conjunctions (FANBOYS: for, and, nor, but, or, yet, so), in series (apply the style guide's rule on Oxford/serial comma)
- *Semicolons:* Connect two independent clauses of equal weight without a coordinating conjunction; also used in series when items contain internal commas. Do not use a semicolon where a colon is correct.
- *Colons:* Introduce a list, explanation, or elaboration only when a complete independent clause precedes them. "The ingredients are: flour, eggs, and milk" is incorrect -- remove the colon because "the ingredients are" is not a complete independent clause.
- *Apostrophes:*
  - Possessives: singular nouns add 's (the cat's dish, even James's book in Chicago style; AP uses James' book)
  - Plural possessives: plural nouns ending in s add only the apostrophe (the students' grades)
  - Contractions: it's = it is, they're = they are, you're = you are
  - Do NOT use apostrophes for plural nouns (not "the 1990's" but "the 1990s"; not "CEO's" but "CEOs")
- *Quotation marks:* In American English, periods and commas go inside closing quotation marks; colons and semicolons go outside; question marks and exclamation points go inside only if part of the quoted material. British English places all punctuation outside the quotation marks unless it is part of the quoted text.
- *Hyphenation:* Compound modifiers before a noun are hyphenated (well-known author), not after (the author is well known); no hyphen after -ly adverbs (a carefully written report); check compound nouns that have evolved (email vs. e-mail -- AP now uses email; follow the style guide)
- *Dashes:* En dash (--) for ranges (pages 10--15, 2010--2015) and compound adjectives with open compounds (New York--based); em dash (---) for interruption, apposition, or emphasis -- used without spaces in American English, with spaces in British English

**Pass 4 -- Typography and formatting:**
- Double spaces after periods (a holdover from typewriter convention -- not standard in digital publishing)
- Repeated words ("the the," "and and") -- the brain skips these when reading for meaning
- Missing spaces ("ofthe," "canalso")
- Smart/curly quotes vs. straight quotes -- choose one and be consistent
- Inconsistent capitalization of the same term throughout the document
- Inconsistent formatting of numbers: decide whether numbers are written as words or numerals per the style guide and apply uniformly
- Widow/orphan considerations in formatted documents: single words or very short lines left at the top or bottom of a page

**Pass 5 -- Consistency audit:**
- Proper nouns: Flag any name, title, product, place, or organization that appears spelled differently in two places (McKinsey vs. Mckinsey, WorldCom vs. Worldcom, USA vs. U.S.A.)
- Terminology: If the document uses a technical term, check that it is used consistently ("machine learning model" vs. "ML model" vs. "the model" -- inconsistency is not an error per se, but flag it)
- Abbreviations: On first use, most style guides require spelling out the term followed by the abbreviation in parentheses -- "National Aeronautics and Space Administration (NASA)" -- check this is done and that abbreviations are used consistently thereafter
- List formatting: All items in a bulleted list should have consistent punctuation at the end (all periods, all nothing, never mixed), consistent capitalization of the first word, and consistent grammatical structure
- Heading levels: If the document uses headings, verify the hierarchy is consistent (H1 for main sections, H2 for subsections, not random)
- Number/date formatting: Dates should be consistent throughout (January 14, 2024 vs. 14 January 2024 vs. 1/14/24 -- pick one per the style guide)

### Step 3: Classify each identified error

For every correction, assign:
- **Category:** Spelling | Grammar | Punctuation | Typography | Consistency | Style suggestion
- **Severity:** Error (clear violation of the applicable rule or style guide) | Style suggestion (a judgment call where reasonable editors could disagree) | Query (something that may be intentional -- ask the author before correcting)
- **Location reference:** Paragraph number, sentence number, or a short excerpt of surrounding text that lets the user find it quickly

### Step 4: Apply corrections and mark changes

- Quote the exact original text, including enough context to locate it unambiguously
- Provide the corrected version
- Give a one-line explanation grounded in the specific rule: "subject-verb agreement: 'data' is treated as plural in scientific writing under APA" rather than "grammar error"
- For style suggestions, explain both options and the tradeoff so the user can choose
- For queries (possible intentional rule-breaking), phrase as a question: "This appears to be a sentence fragment -- is this intentional for stylistic effect?"

### Step 5: Produce the full corrected document

- Apply every confirmed correction to produce a clean version the user can use directly
- Do not silently change anything beyond the identified corrections -- if you notice something during the corrected-document pass that was not in your error list, add it to the corrections list before applying it
- Preserve all formatting: bold, italic, headers, lists, blockquotes -- do not flatten the document

### Step 6: Summarize errors by category and flag patterns

- Count errors by category in a summary table
- Identify recurring patterns -- the same error appearing 3 or more times constitutes a pattern worth naming
- A pattern note is instructional: "You consistently omit the Oxford comma. If that is intentional under AP Style, it is correct; if not, consider a dedicated comma pass."
- A document with more than 5% error density (roughly 1 error per 20 words) may need copy-editing, not just proofreading -- flag this to the user

### Step 7: Surface scope boundaries encountered

- Note any passages that require decisions beyond proofreading (unclear meaning that proofreading cannot fix, factual claims that seem suspicious, structural problems visible at the sentence level)
- Do NOT act on these -- do note them so the user knows proofreading has its limits here
- Example flag: "Paragraph 3 contains a sentence whose meaning is unclear even after grammatical correction -- this may need copy-editing to resolve."

---

## Output Format

```
## Proofreading Report

**Document type:** [Academic paper / Business report / Blog post / Fiction / etc.]
**Style guide applied:** [Chicago 17th / AP 2023 / APA 7th / MLA 9th / Standard American English / etc.]
**Dialect:** [American English / British English / Canadian English / etc.]
**Word count (approximate):** [n words]
**Error density:** [n errors per 100 words -- flag if above 5]

---

### Corrections

**1. [Category] -- [Severity]**
- **Location:** [Paragraph X, Sentence Y / "...surrounding context..."]
- **Original:** "[exact original text]"
- **Corrected:** "[corrected text]"
- **Rule:** [Specific rule or style guide entry -- e.g., "Chicago 7.23: possessives of proper nouns ending in s take 's"]
- **Note:** [Optional -- only if context matters, e.g., "AP style would use a different form here"]

**2. [Category] -- [Severity]**
- **Location:** [Paragraph X, Sentence Y / "...surrounding context..."]
- **Original:** "[exact original text]"
- **Corrected:** "[corrected text]"
- **Rule:** [Specific rule]
- **Note:** [Optional]

[Continue for all corrections, numbered sequentially...]

---

### Error Summary

| Category        | Errors | Style Suggestions | Queries | Examples |
|----------------|--------|-------------------|---------|---------|
| Spelling        | [n]    | --                | [n]     | [key examples] |
| Grammar         | [n]    | [n]               | [n]     | [key examples] |
| Punctuation     | [n]    | [n]               | [n]     | [key examples] |
| Typography      | [n]    | --                | --      | [key examples] |
| Consistency     | [n]    | [n]               | --      | [key examples] |
| **Total**       | **[n]**| **[n]**           | **[n]** |         |

**Error density:** [n] errors per 100 words

---

### Patterns Noted

- [Pattern 1: "You used 'it's' where 'its' is needed 4 times -- this is the document's dominant error type. The rule: 'its' is the possessive pronoun; 'it's' is the contraction of 'it is.'"]
- [Pattern 2, if any]
- [Pattern 3, if any]
- [If no patterns: "No repeating error patterns detected."]

---

### Scope Flags (Items Beyond Proofreading)
[Only include this section if relevant]

- [Flag 1: "Paragraph X -- meaning unclear; grammatical correction has been made but a copy-editing pass may be needed."]
- [Flag 2, if any]

---

### Corrected Document

[Full text with all confirmed corrections applied. Preserve all original formatting.]
```

---

## Rules

1. **Never alter the author's word choices, voice, or stylistic decisions.** Proofreading corrects rule violations. If a word is correctly spelled, grammatically appropriate, and used correctly, do not change it -- even if you would choose a different word. "Utilize" is not an error, even if "use" might be simpler; that is a copy-editing preference, not a proofreading correction.

2. **Never correct without explaining.** Every correction must cite the specific rule being applied -- not "grammar error" but "subject-verb agreement: the subject 'committee' is singular in American English." Unexplained corrections are not useful and cannot be learned from.

3. **Distinguish error from style suggestion from query.** A comma splice is an error in academic prose; it is a query in literary fiction. "Which" without a comma before a restrictive clause is an error under the American rule (restrictive clauses use "that"); it is a style suggestion in British English. Use the three-level classification -- Error, Style Suggestion, Query -- and apply it consistently.

4. **Apply the identified style guide rigorously -- never mix guides.** The Oxford comma is required in Chicago and optional in AP. Abbreviating months is standard in AP and non-standard in Chicago. If you apply both rules in the same document, you have introduced inconsistency. When no guide is specified and cannot be inferred, ask the user before proceeding or state your default explicitly in the report header.

5. **Run five distinct passes -- do not rely on a single reading.** Professional proofreaders catch roughly 95% of errors only when they make separate targeted passes. A single reading catches an estimated 60--70% of errors because the brain reads for meaning and autocorrects at the neural level. Each pass has a specific cognitive target: spelling, grammar, punctuation, typography, consistency.

6. **Always produce the full corrected document.** The user must receive usable output -- a marked-up error list without a clean corrected version requires the user to manually implement every correction, which reintroduces error risk. The corrected document is non-optional.

7. **Never silently change text.** If a correction was not listed in the Corrections section, it must not appear in the Corrected Document. Every change must be visible, explained, and accountable. Silent corrections violate the author's trust and may introduce errors the author has no way to catch.

8. **Flag error density above 5%.** A document with more than roughly 1 error per 20 words (5% density) typically indicates that the content has not been adequately self-edited and may have structural or clarity problems that proofreading alone cannot address. Alert the user and suggest a copy-editing pass precede proofreading.

9. **Treat homophones and near-miss words as a high-priority check.** Spell-checkers do not catch homophones (their/there/they're, affect/effect, principal/principle). These are the most common errors in professionally written text because they pass automated checks and are read past by the brain in context. Give this class of error dedicated attention in Pass 1.

10. **Respect dialect and register.** British spelling is not an error in British English text. A contracted verb form is not an error in a conversational blog post. A comma splice in dialogue is not an error if the author uses it consistently as a speech pattern. Applying American formal standards to British informal text produces a proofreading report that is largely wrong. Establish dialect and register in Step 1 and hold yourself to those parameters throughout.

11. **Never rewrite a sentence to fix a grammatical error if simpler targeted surgery is available.** If a sentence has a dangling modifier, correct the modifier's attachment -- do not rewrite the entire sentence. Minimal intervention is the operating principle. A correction that changes 2 words is always preferable to one that changes 15, provided both fix the error.

12. **Distinguish possessives, plurals, and contractions involving apostrophes with explicit rule citation.** Apostrophe errors are among the most common errors in all forms of writing. For every apostrophe correction, state the rule: "plural nouns do not take apostrophes (CEOs, not CEO's)," "singular possessive takes 's (the company's policy)," "contractions take an apostrophe at the point of omission (it's = it is)." Do not just correct -- explain.

---

## Edge Cases

**1. Creative writing with deliberate rule-breaking**
Fiction writers, poets, and experimental prose writers routinely use sentence fragments, comma splices, unconventional capitalization, non-standard punctuation, and dialect grammar as craft choices. The test: is the rule-breaking systematic (used consistently with apparent purpose) or scattered (appearing irregularly with no pattern)? Systematic: classify as Query, flag it once ("This document uses sentence fragments consistently throughout -- if intentional, these are not errors. Please confirm."), and do not repeat the flag for each instance. Scattered: treat as probable errors and correct, noting "if intentional, disregard."

**2. Academic or technical documents with discipline-specific conventions**
Medical and scientific writing uses AMA style and has specific rules: numerals for all numbers 10 and above; specific abbreviations (mL, not ml; kg, not KG); passive voice is often preferred or required; "data" is plural in strict scientific usage ("the data were collected," not "was collected"). Legal documents have their own conventions: capitalization of defined terms ("the Agreement," "the Parties"), use of "shall" and "may" with specific legal meanings, numbered paragraph structures. Do not apply general style rules to these documents -- apply the discipline's conventions.

**3. Documents with mixed audiences or bilingual passages**
Some documents deliberately include text in two languages (a Spanish phrase in an English document, technical terms in Latin). Do not correct a foreign-language phrase as if it were an English spelling error. Flag it with a Query: "This phrase appears to be [language] -- proofreading covers the English portions only; please verify the [language] text separately." Do not attempt to correct a language in which full proofreading expertise is not available.

**4. Heavily formatted documents (legal briefs, academic papers, reports with tables)**
Proofreading extends to formatting consistency. In formatted documents, check: heading levels (H1, H2, H3 used consistently and hierarchically), numbered list sequence (no skipped numbers), table alignment and consistent number formatting within columns, figure and table caption numbering, footnote/endnote numbering sequence, page header and footer consistency. A formatted document with correct prose but broken numbering has proofreading errors.

**5. Very short texts under 50 words (social media posts, taglines, email subject lines)**
The standard five-pass system still applies, but the output format can be abbreviated -- a full table is disproportionate for a 30-word email subject line. For texts under 50 words, use an inline correction format: quote the original, quote the corrected version, list errors inline. Still categorize each error. Do not skip errors because the text is short -- short texts are often high-stakes (a typo in a company tagline or email subject is more visible than one buried in a 5,000-word report).

**6. Documents already "proofread" by the user who wants a second check**
Users who have already self-proofread tend to have cleared the obvious errors (misspellings of common words) but tend to leave the errors their eyes are habituated to (homophones, missing commas, subject-verb agreement with complex subjects). For these documents, weight your passes toward Pass 2 (grammar), Pass 3 (punctuation), and Pass 5 (consistency), where self-proofreaders are weakest. Still run Pass 1 (spelling) -- the user's confidence may be misplaced.

**7. Documents flagged "urgent -- just check for major errors"**
When a user specifies a fast check or asks you to prioritize, triage by error impact: (1) errors that change meaning (wrong homophone, misplaced modifier, incorrect number), (2) errors visible to any reader (repeated words, obvious misspellings), (3) grammatical errors requiring attention, (4) style consistency issues. Even under time pressure, never skip the homophone pass -- meaning-changing errors that pass spell-check are the most damaging in published text.

**8. Documents with tracked changes or editor comments already present**
If the user provides a document that already contains markup or notes from another editor, clarify scope: proofread the original text, the accepted changes, or both? Do not add proofreading corrections that address issues already flagged by the existing editor -- this creates conflicting markup. Note existing editor queries that intersect with your findings.

---

## Example

**Input:**
"Proofread this press release:

For Immediate Release

Acme Pharmaceuticals Announces Breaktrough Partnership with MedCore Labs

Acme Pharmaceuticals (NASDAQ: ACME) today announced it has entered in to a strategic partnership with MedCore Laboratories, a leading developer of bio-tech solutions. The partnership will allow both companies to leverage there respective reserach capabilities to develop next-generation treatments for cardivascular disease.

'We are extatic to be working with MedCore,' said Dr. Sarah Chen, Acme's Chief Science Officer. 'There cutting-edge platform complements our own pipeline in ways that we believe will yeild significant benifits for patients.' Dr. Chen, who has lead Acme's research division since 2019, added that the first joint clinical trial is expect to begin in early 2025.

The agreement was reach following 18 months of negotiation's. Terms of the deal was not disclosed. The companies plan to issue a more detailed announcement the forth coming week."

**Expected style guide:** AP Style (standard for press releases)
**Dialect:** American English

---

**Output:**

## Proofreading Report

**Document type:** Press release
**Style guide applied:** AP Style 2023
**Dialect:** American English
**Word count (approximate):** 155 words
**Error density:** 13 errors / 155 words ≈ 8.4% -- above the 5% threshold; see note below

---

### Corrections

**1. Spelling -- Error**
- **Location:** Headline
- **Original:** "Breaktrough Partnership"
- **Corrected:** "Breakthrough Partnership"
- **Rule:** Standard spelling -- "breakthrough" (noun/adjective) has no transposition of "th" and "r."

**2. Punctuation / Hyphenation -- Style Suggestion**
- **Location:** Paragraph 1: "bio-tech solutions"
- **Original:** "bio-tech solutions"
- **Corrected:** "biotech solutions"
- **Rule:** AP Style does not hyphenate "biotech" -- the compound has been closed as a standard word. This is a style suggestion under AP; the hyphenated form is not egregiously wrong but is non-standard in current AP usage.

**3. Grammar -- Error**
- **Location:** Paragraph 1: "has entered in to a strategic partnership"
- **Original:** "has entered in to"
- **Corrected:** "has entered into"
- **Rule:** "Into" (a preposition expressing movement or transition) is one word. "In to" (adverb + preposition) is used in constructions like "came in to see us." This context requires the single-word preposition.

**4. Spelling (Homophone) -- Error**
- **Location:** Paragraph 1: "to leverage there respective"
- **Original:** "there respective"
- **Corrected:** "their respective"
- **Rule:** "Their" is the third-person plural possessive pronoun. "There" is an adverb of place or a pronoun in existential constructions. The sentence requires the possessive.

**5. Spelling -- Error**
- **Location:** Paragraph 1: "respective reserach capabilities"
- **Original:** "reserach"
- **Corrected:** "research"
- **Rule:** Standard spelling -- transposition of "e" and "a."

**6. Spelling -- Error**
- **Location:** Paragraph 1: "treatments for cardivascular disease"
- **Original:** "cardivascular"
- **Corrected:** "cardiovascular"
- **Rule:** Standard spelling -- the combining form is "cardio-" from Greek "kardia" (heart). The "o" is missing.

**7. Spelling -- Error**
- **Location:** Paragraph 2 (quote): "We are extatic to be working"
- **Original:** "extatic"
- **Corrected:** "ecstatic"
- **Rule:** Standard spelling -- "ecstatic" derives from Greek "ekstasis." The word begins with "ec-," not "ex-," and contains "tc" not just "t."

**8. Spelling (Homophone) -- Error**
- **Location:** Paragraph 2 (quote): "There cutting-edge platform"
- **Original:** "There cutting-edge platform"
- **Corrected:** "Their cutting-edge platform"
- **Rule:** Same as Correction 4. "Their" is the possessive; "there" is locative or existential. This is the second instance of this homophone error.

**9. Spelling -- Error**
- **Location:** Paragraph 2 (quote): "will yeild significant benifits"
- **Original:** "yeild"
- **Corrected:** "yield"
- **Rule:** Standard spelling -- "yield" follows the standard "ie" pattern (i before e). No silent vowel transposition.

**10. Spelling -- Error**
- **Location:** Paragraph 2 (quote): "will yeild significant benifits"
- **Original:** "benifits"
- **Corrected:** "benefits"
- **Rule:** Standard spelling -- "benefit" (base word); the plural is "benefits." The "e" in the second syllable is commonly dropped in misspelling.

**11. Grammar (Tense) -- Error**
- **Location:** Paragraph 2: "who has lead Acme's research division since 2019"
- **Original:** "has lead"
- **Corrected:** "has led"
- **Rule:** "Lead" is the base form and present tense of the verb (also a homograph with the metal "lead"). The past tense and past participle is "led," not "lead." The present perfect tense ("has led") requires the past participle.

**12. Grammar (Verb form) -- Error**
- **Location:** Paragraph 2: "the first joint clinical trial is expect to begin"
- **Original:** "is expect"
- **Corrected:** "is expected"
- **Rule:** The construction "is expected to" requires the past participle in the passive voice. "Is expect" is a missing past participle; the correct form is "is expected."

**13. Grammar (Tense) -- Error**
- **Location:** Paragraph 3: "The agreement was reach following"
- **Original:** "was reach"
- **Corrected:** "was reached"
- **Rule:** Passive voice construction ("was + past participle") requires the past participle. "Reach" is the base form; "reached" is the past participle.

**14. Punctuation (Apostrophe) -- Error**
- **Location:** Paragraph 3: "18 months of negotiation's"
- **Original:** "negotiation's"
- **Corrected:** "negotiations"
- **Rule:** "Negotiations" here is a plural noun, not a possessive. Plural nouns do not take apostrophes. The apostrophe incorrectly implies possession where none is intended.

**15. Grammar (Subject-verb agreement) -- Error**
- **Location:** Paragraph 3: "Terms of the deal was not disclosed"
- **Original:** "Terms of the deal was not disclosed"
- **Corrected:** "Terms of the deal were not disclosed"
- **Rule:** The subject is "Terms" (plural noun). The intervening prepositional phrase "of the deal" does not change the number of the subject. A plural subject requires a plural verb: "were," not "was."

**16. Spelling / Formatting -- Error**
- **Location:** Paragraph 3: "a more detailed announcement the forth coming week"
- **Original:** "forth coming"
- **Corrected:** "forthcoming"
- **Rule:** "Forthcoming" is a single closed compound adjective meaning "about to happen or appear." It is not written as two words.

---

### Error Summary

| Category        | Errors | Style Suggestions | Queries | Examples |
|----------------|--------|-------------------|---------|---------|
| Spelling        | 9      | --                | --      | breaktrough, reserach, cardivascular, extatic, yeild, benifits |
| Grammar         | 4      | --                | --      | "has lead" → "has led," "was reach," "is expect," subject-verb "Terms...were" |
| Punctuation     | 1      | --                | --      | negotiation's (erroneous possessive apostrophe) |
| Typography      | 1      | --                | --      | forth coming → forthcoming |
| Consistency     | --     | --                | --      | No additional consistency issues |
| Style suggestions | --  | 1                 | --      | bio-tech → biotech (AP style) |
| **Total**       | **15** | **1**             | **0**   |         |

**Error density:** ~9.7% (1 error per 10 words) -- well above the 5% threshold.

---

### Patterns Noted

- **Homophone errors (their/there):** This error appears twice (Corrections 4 and 8). "Their" is the possessive pronoun; "there" is the locative adverb or existential pronoun. Recommend a dedicated search for "there" in all its forms throughout future drafts.
- **Past participle omission:** Three verbs are missing their past participles in passive constructions ("has lead," "is expect," "was reach"). This pattern suggests the draft was composed quickly without a grammar check. A targeted pass on passive voice constructions ("was ___," "is ___," "has ___") is recommended.
- **Spelling errors cluster in technical and borrowed vocabulary** (cardiovascular, ecstatic, biotech). These are high-frequency words in pharmaceutical communications -- consider building a personal spelling reference list for domain-specific terminology.

---

### Scope Flags (Items Beyond Proofreading)

- The headline reads "Acme Pharmaceuticals Announces Breakthrough Partnership with MedCore Labs." Press release headlines under AP Style use title case -- this is applied correctly. However, the company name used in the headline ("MedCore Labs") differs slightly from the full name used in the body ("MedCore Laboratories"). This is a consistency issue -- confirm which form is the official company name and apply it uniformly, or establish an abbreviation protocol.
- The phrase "a more detailed announcement the forthcoming week" is grammatically corrected above but remains slightly awkward in meaning ("the forthcoming week" is unusual phrasing; "in the coming week" or "next week" would be more idiomatic). This is a copy-editing observation, not a proofreading correction, and has not been changed in the corrected document.

---

### Corrected Document

For Immediate Release

**Acme Pharmaceuticals Announces Breakthrough Partnership with MedCore Labs**

Acme Pharmaceuticals (NASDAQ: ACME) today announced it has entered into a strategic partnership with MedCore Laboratories, a leading developer of biotech solutions. The partnership will allow both companies to leverage their respective research capabilities to develop next-generation treatments for cardiovascular disease.

"We are ecstatic to be working with MedCore," said Dr. Sarah Chen, Acme's Chief Science Officer. "Their cutting-edge platform complements our own pipeline in ways that we believe will yield significant benefits for patients." Dr. Chen, who has led Acme's research division since 2019, added that the first joint clinical trial is expected to begin in early 2025.

The agreement was reached following 18 months of negotiations. Terms of the deal were not disclosed. The companies plan to issue a more detailed announcement the forthcoming week.
