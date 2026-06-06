---
name: readability-improvement
description: |
  Improves text readability by reducing complexity, shortening sentences, simplifying vocabulary, and restructuring for scan-ability. Targets a specific reading level or audience.
  Use when the user asks to make text more readable, reduce the reading level, simplify language, or make content accessible to a broader audience.
  Do NOT use for clarity of specific passages (use clarity-editing), conciseness without readability goals (use conciseness-editing), or academic writing conventions (use research-paper-structure).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "editing writing research"
  category: "writing"
  subcategory: "editing-refinement"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Readability Improvement

## When to Use

**Use this skill when:**
- The user explicitly asks to make text "easier to read," "more accessible," "simpler," or "less dense" for a defined or implied audience
- The user wants to lower the reading grade level of a document -- for example, converting a Grade 14 white paper to Grade 8 for a general-public audience
- The user references a readability score, Flesch-Kincaid grade level, SMOG index, or Gunning Fog index and wants to hit a specific target
- The user needs content to comply with a readability standard -- such as the federal Plain Language Act (Grade 8 target), health literacy guidelines (Grade 6), or plain English financial disclosure requirements
- The user describes scan-ability goals: "people skim this," "it needs to work on mobile," "users don't read it end to end," or "it needs to be more skimmable"
- The user is preparing content for a mixed-literacy audience: patient education materials, employee handbooks, consumer-facing product guides, onboarding documentation, or public-health campaigns
- The user says readers are dropping off, feedback says the text is "too dense," or conversion or comprehension data shows an engagement problem
- The user is reformatting content from a specialist channel (academic paper, legal brief, technical report) into a general-audience channel (blog post, FAQ, landing page, brochure)

**Do NOT use this skill when:**
- The user wants to fix a specific sentence or passage that is confusing for a reason other than complexity -- use `clarity-editing`, which addresses ambiguity, pronoun reference problems, and structural logic
- The user wants to cut word count without a readability goal -- use `conciseness-editing`, which targets redundancy and verbosity independent of grade-level targets
- The user wants to preserve and optimize academic register, disciplinary conventions, or scholarly citation practices -- use `research-paper-structure`
- The user wants to shift formality, warmth, or brand voice without a readability mandate -- use `tone-adjustment`
- The user wants to restructure argument logic or narrative flow -- use `content-restructuring`, which addresses organization at the argument level, not the sentence level
- The user wants to translate or localize content into another language or dialect -- this skill applies only to the source language

---

## Process

### Step 1: Establish the Target Audience and Reading Level

Before touching a single word, anchor the work to a concrete audience definition and a numeric readability target. Without these, readability improvement is guesswork.

- **Identify the audience** explicitly: age range, education level, familiarity with the subject, language background (native speaker vs. second-language), and reading context (leisurely desktop reading vs. scanning on a mobile screen vs. high-stress healthcare environment)
- **Select the appropriate grade-level target:**
  - Grade 4-5: Children's materials, emergency instructions, lowest-literacy adult content
  - Grade 6: Health literacy standard (National Institutes of Health, American Medical Association, Centers for Disease Control recommendations for patient-facing materials)
  - Grade 7-8: General public standard -- federal Plain Language Act target, most consumer-facing web content, news articles
  - Grade 9-10: Educated general adult audience; business communications, quality journalism
  - Grade 11-12: College-educated audience with no specialist knowledge of the subject
  - Grade 13+: Specialist professional audience; preserve technical vocabulary while improving structure
- **Select the primary readability formula** based on what will be measured or reported:
  - **Flesch-Kincaid Grade Level (FKGL):** Standard for most US government and business contexts; based on average sentence length and average syllables per word. Formula: 0.39 × (words/sentences) + 11.8 × (syllables/words) -- 15.59
  - **Flesch Reading Ease (FRE):** Scale of 0-100 (higher = easier); 60-70 is standard for general audiences, 70-80 for plain-language health content
  - **SMOG Index:** More accurate for health literacy assessment because it weights polysyllabic words more heavily; preferred by healthcare communication specialists. Targets: Grade 6 SMOG for patient education
  - **Gunning Fog Index:** Useful for business writing; highlights "hard words" (3+ syllables) alongside sentence length
  - **Coleman-Liau Index:** Based on characters rather than syllables; useful when working with text that may be processed computationally
- **Note any domain constraints:** Legal text may not permit vocabulary simplification without legal review. Technical specifications may require precise terminology. Academic text may require hedging language. Note these constraints before proceeding.
- **Confirm the output format:** Will the improved text appear as a web page (can use headers, bullets, white space freely), a printed form (limited formatting), a spoken script (readability applies but visual structure does not), or within a fixed layout?

---

### Step 2: Measure Baseline Readability

Perform a systematic audit of the current text before any changes. This creates a before snapshot for comparison and identifies which problems are most severe.

- **Sentence length:** Calculate the average words per sentence. Flag any sentences over 25 words as high-priority targets. Note the maximum sentence length -- a single 60-word sentence is a critical barrier even if the average looks acceptable.
- **Syllable density:** Estimate the percentage of words with 3 or more syllables (polysyllabic words). Over 15% indicates a high-complexity text. Over 25% is characteristic of academic or legal writing.
- **Vocabulary complexity signals:** Scan for Latinate/Greek roots preferred in formal writing over Anglo-Saxon equivalents -- "utilize" vs. "use," "commence" vs. "start," "terminate" vs. "end," "facilitate" vs. "help," "ascertain" vs. "find out," "endeavor" vs. "try," "aforementioned" vs. "above," "subsequent" vs. "next," "optimal" vs. "best"
- **Nominalization density:** Count nominalizations -- verbs converted to nouns by adding "-tion," "-ment," "-ance," "-ence," "-ity." These add syllables and abstract meaning. "The implementation of the recommendation" = two nominalizations hiding "we recommend implementing." High nominalization is a reliable marker of bureaucratic prose.
- **Passive voice rate:** Count passive constructions. Passive voice is not universally bad, but rates above 20-25% correlate with lower readability because passive suppresses the agent (who does what to whom) and inverts natural sentence order.
- **Paragraph density:** Count average sentences per paragraph and average words per paragraph. Paragraphs over 100 words are barriers for general audiences. Paragraphs over 150 words are barriers for mobile or low-literacy audiences.
- **Structural scan-ability:** Is there a header hierarchy? Are any lists present? Is white space used? A solid wall of text with no visual breaks fails scan-ability regardless of sentence-level readability.
- **Estimated grade level:** Apply the Flesch-Kincaid Grade Level formula or approximate it by inspection. Record this as the baseline.

---

### Step 3: Diagnose the Root Causes of Complexity

Do not apply improvements uniformly. Identify which specific factors are driving the grade level up, then target those factors. Common root-cause patterns:

- **Long-sentence pattern:** Almost every sentence is a compound-complex sentence with multiple subordinate clauses. Root cause: writer trained in academic or legal prose. Fix: sentence splitting, subordinate clause reduction.
- **Vocabulary pattern:** Sentence length is reasonable but polysyllabic Latinate vocabulary dominates. Root cause: formal register, subject matter expertise, or house style. Fix: vocabulary substitution, but only where meaning is preserved exactly.
- **Nominalization pattern:** Verbs are systematically converted to nouns, creating abstract, agent-free prose. Root cause: bureaucratic writing culture. Fix: reverse nominalizations -- convert "the implementation of" to "implementing," "the determination of" to "determining," "the provision of" to "providing."
- **Density pattern:** Sentences are reasonable in length but paragraphs are extremely long and lack structure. Root cause: writer treating each section as an essay rather than a readable block. Fix: paragraph breaking, addition of headers and lists.
- **Compounding complexity pattern:** Long sentences AND complex vocabulary AND no structure. This is the most common pattern in corporate reports, academic papers adapted for general audiences, and regulatory documents. Requires all three interventions simultaneously.

---

### Step 4: Apply Sentence-Level Improvements

Work through the text systematically. Apply the following techniques in priority order, based on impact:

- **Split long sentences at natural logical boundaries.** The conjunction rule: every "which," "that," "although," "however," "furthermore," "in addition," "moreover," "as a result," and "therefore" is a potential split point. Convert subordinate clauses to separate sentences. Convert relative clauses to standalone sentences: "The report, which was completed last quarter and which identified three major risk factors, has now been reviewed" becomes "The report was completed last quarter. It identified three major risk factors. We have now reviewed it."
- **Apply the one-idea rule.** Each sentence should carry one discrete idea. Test by asking: can this sentence be summarized in a three-word subject-verb-object phrase? If not, it probably contains two ideas.
- **Reverse nominalizations.** Find "-tion," "-ment," "-ance," "-ence," "-ity" nouns that derive from verbs. Restore the verb. "The organization of the data" → "organizing the data." "The establishment of a new policy" → "establishing a new policy" or "the new policy." "The provision of services" → "providing services."
- **Eliminate stacked prepositional phrases.** More than two consecutive "of," "in," "for," "at," "by," "from," "with" phrases creates a parsing burden. "In the context of the analysis of the results of the survey of employees" → "in the employee survey results." Restructure by converting one of the prepositional phrases into a possessive or a compound noun.
- **Convert passive voice to active where it improves directness.** Active voice rule: Name the agent. "The decision was made by the committee" → "The committee decided." "Errors were identified" → "We identified errors" or "Auditors identified errors." Exceptions: passive is appropriate when the agent is unknown, unimportant, or when the object is the clear topic (laboratory writing, where "samples were analyzed" is conventional).
- **Front-load sentences with subject and verb.** Readers process sentences faster when subject and verb appear within the first seven words. "In light of the significant changes that have occurred over the past several months in the regulatory environment, the company has decided..." → "The company has decided... given recent regulatory changes."
- **Use concrete, specific language over abstractions.** Abstract: "The situation was problematic." Concrete: "The system failed three times in January." Abstractions require readers to supply their own mental image; concrete language provides one.

---

### Step 5: Apply Vocabulary-Level Improvements

Vocabulary simplification requires the most judgment. Every substitution must preserve exact meaning. When in doubt, keep the original word and flag it.

- **Apply the Anglo-Saxon preference rule** for common concepts: prefer short, common, one- or two-syllable words derived from Old English or Old Norse over their Latinate or Greek equivalents. Core substitutions:
  - utilize → use
  - commence → start / begin
  - terminate → end / stop
  - facilitate → help / make easier / enable
  - endeavor → try
  - ascertain → find out / confirm / determine
  - subsequent → next / following / later
  - aforementioned → above / the above / this / these
  - approximately → about
  - demonstrate → show
  - implement → carry out / put in place / apply
  - require → need
  - obtain → get
  - sufficient → enough
  - indicate → show / mean / suggest
  - purchase → buy
  - additional → more / extra
  - approximately → about
  - concerning → about
  - in order to → to
  - prior to → before
  - subsequent to → after
  - in the event that → if
  - at this point in time → now
  - due to the fact that → because

- **Do NOT substitute technical terms that have no simpler equivalent.** "Myocardial infarction" is appropriately simplified to "heart attack" for patient audiences, but "atrial fibrillation" may require both the clinical term and a plain-language explanation in parentheses, not a substitution, because no common synonym exists. Medical, legal, and technical vocabulary often has no exact plain-language equivalent -- use the term plus a brief parenthetical definition.
- **Apply the audience test:** Would the target reader know this word without looking it up? If not, either substitute or define in context.
- **Avoid euphemism:** Do not substitute a vague word for a precise one in the name of simplicity. "Adverse event" simplified to "bad thing" loses precision. "Adverse event" simplified to "side effect" or "complication" may preserve enough meaning for the context.

---

### Step 6: Apply Structural and Formatting Improvements

Structural readability is separate from linguistic readability. A text can have perfect Grade 7 FKGL and still be unreadable because it is formatted as a wall of text.

- **Add headers for sections longer than ~200 words.** Headers serve as cognitive maps -- they tell the reader where they are and where they are going. Use a clear, descriptive noun phrase or imperative verb phrase: "How to Submit a Claim," "What Happens After You Apply," "Why This Matters."
- **Convert appropriate lists to bullet points or numbered lists.** Candidate structures for lists: any sentence containing three or more items separated by semicolons or commas; any sequence of steps that must occur in order (use numbered list); any set of options, features, or considerations without a required sequence (use bullets).
- **Limit bullet points to five to seven items.** More than seven items overwhelm working memory. Break long lists into grouped sublists with subheadings.
- **Keep bullet text parallel.** All bullets in a list should start with the same grammatical structure -- all noun phrases, all verb phrases, or all complete sentences. Mixed parallelism is a readability barrier.
- **Use white space deliberately.** Short paragraphs (three to five sentences maximum for general audiences; one to three sentences for mobile or low-literacy contexts) create visual breathing room. Do not combine unrelated ideas into a paragraph solely to avoid short paragraphs.
- **Apply the inverted pyramid.** In each section, put the most important information first, then supporting detail, then background. Readers who stop reading partway through should have encountered the essential information.
- **Use bold text sparingly for key terms or critical information.** One or two bolded items per section maximum. Excessive bolding loses its signal value.
- **Use tables for comparison, not prose.** If the text compares three options across four criteria, a table is more readable than three paragraphs. Tables work in most digital contexts; in plain-text or voice contexts, use a different structure.

---

### Step 7: Perform Post-Improvement Measurement and Quality Check

After applying improvements, measure the results and check for unintended damage.

- **Recalculate all baseline metrics:** Average sentence length, passive voice rate, polysyllabic word percentage, paragraph length, estimated grade level. Compare to the target.
- **Check for overshooting:** If the target was Grade 8 and the text is now Grade 5, you have oversimplified for the audience. Readability should match the audience -- not be minimized.
- **Check for choppy prose:** Splitting too many sentences without considering logical flow creates staccato, disconnected text. Read the revised text aloud. If it sounds like a children's primer for an adult audience, some sentences should be reconnected with a simple coordinating conjunction.
- **Check for meaning preservation:** Review every vocabulary substitution and every sentence split. Confirm the original meaning is intact. A simpler sentence that changes the information is worse than a complex sentence that preserves it.
- **Check for lost transitions:** Sentence splitting often deletes logical connectors -- "therefore," "however," "as a result," "because." Restore these as needed at the start of new sentences rather than embedded in compound clauses: "This created a bottleneck. As a result, delivery times increased."
- **Check structural integrity:** Confirm that any conversion to bullet points or headers hasn't fragmented continuous reasoning that requires prose to convey. Argument, narrative, and causal explanation usually require prose. Enumeration and comparison usually benefit from lists.
- **Identify trade-off flags:** Note every place where a simplification may have affected nuance, precision, or completeness. Present these as explicit trade-off notes for the author to decide, not as implicit choices already made.

---

### Step 8: Deliver the Report and Revised Text

Present the output in the structured format below. Always show before and after metrics side by side. Always surface trade-offs explicitly.

---

## Output Format

```
## Readability Improvement Report

### Document Information
| Field               | Value                          |
|---------------------|-------------------------------|
| Document title      | [title or description]        |
| Target audience     | [audience description]        |
| Target grade level  | [grade and formula used]      |
| Readability formula | [FKGL / SMOG / Fog / FRE]    |
| Scope               | [full document / section / paragraph] |

---

### Baseline Metrics (Before)
| Metric                        | Value         |
|-------------------------------|---------------|
| Average sentence length       | [n] words     |
| Maximum sentence length       | [n] words     |
| Average paragraph length      | [n] sentences |
| Polysyllabic word percentage  | [n]%          |
| Passive voice rate            | [n]%          |
| Nominalization count          | [n]           |
| Estimated reading level       | Grade [n]     |
| Structural elements present   | [yes/no -- headers, lists, white space] |

---

### Target Metrics
| Metric                        | Target        |
|-------------------------------|---------------|
| Average sentence length       | [n] words     |
| Polysyllabic word percentage  | [n]%          |
| Passive voice rate            | < [n]%        |
| Estimated reading level       | Grade [n]     |

---

### Changes Applied
| Technique                     | Count / Scope | Example                        |
|-------------------------------|---------------|-------------------------------|
| Sentences split               | [n]           | [before] → [after]            |
| Vocabulary substitutions      | [n]           | [word] → [word]               |
| Nominalizations reversed      | [n]           | [phrase] → [phrase]           |
| Passive → active conversions  | [n]           | [sentence] → [sentence]       |
| Paragraphs broken             | [n]           |                               |
| Headers added                 | [n]           | [header text]                 |
| Lists created                 | [n]           | [what was converted]          |
| Stacked prepositional phrases resolved | [n] | [phrase] → [phrase]          |

---

### After Metrics (Revised)
| Metric                        | Value         | Change             |
|-------------------------------|---------------|--------------------|
| Average sentence length       | [n] words     | [↓ n words]        |
| Maximum sentence length       | [n] words     | [↓ n words]        |
| Average paragraph length      | [n] sentences | [↓ n sentences]    |
| Polysyllabic word percentage  | [n]%          | [↓ n%]             |
| Passive voice rate            | [n]%          | [↓ n%]             |
| Estimated reading level       | Grade [n]     | [↓ n grades]       |

---

### Revised Document
[Full revised text with all readability improvements applied]

---

### Trade-off Notes
| Location             | Original                    | Simplification Made           | Risk / Decision for Author             |
|----------------------|-----------------------------|-------------------------------|----------------------------------------|
| [Para / sentence #]  | [original phrase]           | [simplified phrase]           | [what may have been lost; author's choice] |

---

### Recommendations for Further Improvement (Optional)
[Any structural, formatting, or content decisions beyond sentence-level editing that would further improve readability -- e.g., "Section 3 would benefit from a summary table," "Consider adding a glossary for the five remaining technical terms."]
```

---

## Rules

1. **Always establish the target grade level before editing.** Readability is always relative to an audience. Improving readability without a target is like adjusting temperature without knowing whether someone is cold or hot. Default to Grade 8 if no target is specified, but confirm this with the user.

2. **Never substitute a technical term when no exact plain-language equivalent exists.** When "myocardial infarction" must be simplified for patients, "heart attack" is an acceptable equivalent. When "force majeure" must be simplified in a legal document, no single word captures the legal meaning -- define it in parentheses and keep the term. Meaning preservation always outranks readability score optimization.

3. **Never convert all paragraphs to bullet points.** Bullet points are not universally more readable -- they fragment reasoning, eliminate logical connectors, and obscure causal relationships. Use bullets for genuinely enumerable content (lists of items, steps, options, features). Use prose for explanation, argument, narrative, and causation.

4. **Never split a sentence if the split creates a logical disconnect that the reader must supply.** "It rained. The game was canceled." requires the reader to infer causation. "The game was canceled because of rain" is one sentence but is clearer. Use judgment: sentence splitting is a tool, not a rule.

5. **Readability must not drop below the audience's actual level.** A text revised to Grade 4 for an audience of healthcare professionals is insulting and may damage credibility and trust. Match the floor to the audience; do not minimize the grade level for its own sake.

6. **Always show before and after metrics.** Readability improvement is a quantified discipline. Qualitative claims ("this is simpler now") are insufficient. Always show numerical change on at least sentence length and estimated grade level.

7. **Flag every trade-off explicitly rather than making the author's decisions for them.** When a simplification reduces precision, note it. When a sentence split removes a logical relationship, note it. When a technical term is retained, explain why. The author has subject-matter authority; the readability editor has process authority. Do not conflate them.

8. **Preserve domain-appropriate hedging language.** In health, legal, regulatory, and scientific contexts, hedging words like "may," "in some cases," "under certain conditions," and "consult a qualified professional" are not complexity artifacts -- they are precision markers and liability management. Do not remove them in the name of directness.

9. **Passive voice is a technique, not always an error.** Convert passive to active only when the conversion reveals a real agent and creates a more direct sentence. "Mistakes were made" → "We made mistakes" is a meaningful improvement. "Samples were analyzed at 37°C" → "Scientists analyzed samples at 37°C" adds noise without improving readability. Apply judgment, not mechanical conversion.

10. **Do not apply structural formatting (headers, bullets, tables) to content that is too short to benefit from it.** A 100-word paragraph does not need three subheadings. A list of two items is better written as a sentence: "The package includes a guide and a warranty card." Apply structure when it genuinely aids navigation of content that is long enough to require it -- generally 300+ words for headers, three or more items for lists.

11. **When applying the SMOG Index for health content, use its formula correctly.** Count all polysyllabic words (3+ syllables) in 30 sentences -- 10 from the beginning, 10 from the middle, 10 from the end. Take the square root of the count and add 3. For texts shorter than 30 sentences, note this as a limitation of the measurement.

12. **Front-loading is a readability technique, not just a style preference.** The most important information in any paragraph belongs in the first sentence. The most important paragraph in any section belongs first. This is especially critical for audiences who skim -- if the key message is buried in sentence four, most readers in a scan context will miss it.

---

## Edge Cases

### The Academically Constrained Text
When the user provides an academic paper or section that must remain suitable for peer-reviewed publication, readability improvement must operate within tight register constraints. Do not simplify vocabulary that constitutes disciplinary terminology -- the discipline's own readers would find "utilize" appropriate in certain contexts, and "hedonic adaptation" has no single-word plain-language equivalent. Instead, focus on structural improvements: shorten sentences where subordinate clauses are genuinely separable, reduce passive voice in narrative sections (introduction, discussion) while leaving methods sections in conventional passive, and break dense paragraphs. Aim for the lower end of the acceptable academic range rather than a general-public target. Typical academic prose runs Grade 14-18; reducing to Grade 12-13 while preserving register is a meaningful improvement.

### The Health Literacy Document
Patient education materials, medication guides, and public health campaigns require the most aggressive readability standards: Grade 6 on SMOG, Flesch Reading Ease of 70+, average sentence length under 15 words, and no more than three sentences per paragraph. The National Patient Safety Foundation and the American Medical Association recommend using the "teach-back" design principle: after every key instruction, the reader should be able to answer "What do I need to do?" in one sentence. For these materials, also check: Are illustrations referenced? Are action steps numbered? Are warnings clearly distinguished from information? Do not use "may cause" when a side effect is certain -- in health literacy, hedging that is imprecise can cause patient harm.

### The Legal or Regulatory Text
Legal writing is subject to the plain language movement (the Plain Writing Act of 2010 for US federal documents; similar requirements in the UK and EU). However, legal precision is non-negotiable: "shall" vs. "must" vs. "may" have distinct legal meanings; defined terms cannot be casually substituted; exceptions and conditions must appear in full. Approach legal text in layers: first, restructure paragraphs to separate the main obligation from conditions and exceptions (consider using a base-rule-then-exceptions structure). Second, replace clearly inflated vocabulary -- "in the event that" → "if," "prior to" → "before," "subsequent to" → "after" -- these substitutions do not change legal meaning. Third, flag any vocabulary change that touches a defined term, a term of art, or a condition for a lawyer's review before finalizing. Never make vocabulary substitutions in legal text without this flag.

### The Mixed-Literacy Audience
Some documents serve audiences with a wide literacy range -- for example, an employee handbook distributed to staff ranging from warehouse workers to corporate managers, or a community health communication reaching both educated residents and adults with limited literacy. In these cases, use a layered readability strategy: write the primary message at Grade 6-7 for maximum inclusion, then provide technical or detailed information in sidebars, callout boxes, or appendices that more literate readers can access. Do not attempt to write at Grade 8 as a "middle ground" -- this satisfies neither group. The primary text must be accessible to the lowest-literacy segment of the audience because that is who most needs the information.

### The Already-Readable Text
When the user asks for readability improvement but the text is already within the target range, say so clearly and provide evidence. Present the before metrics, confirm they fall within the target range, and note any minor improvements (a single long sentence, one stacked prepositional phrase) without implying the text is problematic. Resist the temptation to change things to show work. A text at Grade 8 targeting a Grade 8 audience is correct. Offer a brief note on what would push readability down if the text grows -- for example, "If additional technical detail is added, watch for the tendency to reintroduce nominalized verbs."

### The Very Long Document
For documents over 2,000 words, performing a full sentence-by-sentence revision in one pass is impractical in many contexts. Use a triage approach: (1) identify the three to five sections with the highest density of readability problems using a scan for sentence length outliers, polysyllabic density, and structural absence; (2) perform full improvement on those sections and on any section the user identifies as highest-priority; (3) provide a document-wide summary of the readability pattern and a set of writer-actionable guidelines specific to the problems found in this document -- so the author can apply the same techniques to remaining sections; (4) note whether sections that appear to be in good shape require any attention. This approach delivers actionable improvement without creating an unmanageably long output.

### The Text Being Read Aloud (Scripts, Voice Interfaces, Podcasts)
When the output will be spoken rather than read, standard readability rules apply at the sentence level but visual structure rules do not. Do not add bullet points, headers, or tables. Instead, apply spoken-language readability techniques: sentences should be even shorter than in print (target 10-12 words on average) because listeners cannot reread; use signposting phrases ("First... Second... Finally...," "Here's what that means...," "In other words...") instead of visual structure; avoid parenthetical definitions (which interrupt spoken flow) in favor of embedded explanations ("atrial fibrillation -- an irregular heartbeat -- can cause..."); and avoid acronyms without first spelling them out audibly.

### The User Has No Grade-Level Target in Mind
When the user says "make this more readable" without specifying an audience or grade level, ask one clarifying question before proceeding: "Who will read this -- for example, is this for a general public audience, a professional audience, or a specific group?" If the user cannot or does not specify, default to Grade 8 (Flesch-Kincaid), which is the most broadly appropriate target, note this assumption explicitly in the report, and flag whether the content appears to target a specialist audience that may warrant a higher threshold. Do not proceed without at least a stated assumption.

---

## Example

**Input:**
"Make this more readable for our employees in the field, most of whom didn't finish college: 'The implementation of the updated safety compliance protocols necessitates the mandatory completion of an annual certification examination, the successful attainment of which is a precondition for the continuation of employment within the operational divisions of the organization. Employees who fail to achieve satisfactory performance on said examination within the designated timeframe will be subject to a remediation process, the parameters of which are delineated in Appendix C of the Employee Policy Manual. Noncompliance with these requirements may result in the initiation of disciplinary action in accordance with established organizational procedures.'"

---

**Output:**

## Readability Improvement Report

### Document Information
| Field               | Value                                               |
|---------------------|-----------------------------------------------------|
| Document title      | Safety Compliance Policy Notice                     |
| Target audience     | Field employees, most without college education     |
| Target grade level  | Grade 6-7 (FKGL)                                   |
| Readability formula | Flesch-Kincaid Grade Level (FKGL)                  |
| Scope               | Three-sentence policy paragraph                     |

---

### Baseline Metrics (Before)
| Metric                        | Value                          |
|-------------------------------|-------------------------------|
| Average sentence length       | 44 words                      |
| Maximum sentence length       | 53 words (sentence 1)         |
| Average paragraph length      | 3 sentences / 132 words       |
| Polysyllabic word percentage  | 41%                           |
| Passive voice rate            | 67%                           |
| Nominalization count          | 9 (implementation, completion, attainment, continuation, compliance, performance, remediation, initiation, noncompliance) |
| Estimated reading level       | Grade 17 (post-graduate)      |
| Structural elements present   | None                          |

---

### Target Metrics
| Metric                        | Target        |
|-------------------------------|---------------|
| Average sentence length       | ≤ 15 words    |
| Polysyllabic word percentage  | ≤ 12%         |
| Passive voice rate            | < 20%         |
| Estimated reading level       | Grade 6-7     |

---

### Changes Applied
| Technique                     | Count | Example                                                                                   |
|-------------------------------|-------|-------------------------------------------------------------------------------------------|
| Sentences split               | 3 → 7 | "The implementation of...is a precondition for..." → Three separate sentences             |
| Vocabulary substitutions      | 14    | "necessitates" → "requires"; "delineated" → "explained"; "attainment" → "passing"        |
| Nominalizations reversed      | 7     | "implementation of the updated...protocols" → "updated safety rules"; "initiation of disciplinary action" → "disciplinary action" |
| Passive → active conversions  | 4     | "will be subject to a remediation process" → "will need to complete extra training"       |
| Prepositional stacks resolved | 3     | "in accordance with established organizational procedures" → "following company rules"   |
| Lists created                 | 1     | Consequences listed as three bullets for scan-ability                                     |
| Headers added                 | 0     | (Paragraph too short to require headers)                                                  |

---

### After Metrics (Revised)
| Metric                        | Value         | Change           |
|-------------------------------|---------------|------------------|
| Average sentence length       | 13 words      | ↓ 31 words       |
| Maximum sentence length       | 18 words      | ↓ 35 words       |
| Average paragraph length      | 4 sentences / section |          |
| Polysyllabic word percentage  | 9%            | ↓ 32%            |
| Passive voice rate            | 14%           | ↓ 53%            |
| Nominalization count          | 1             | ↓ 8              |
| Estimated reading level       | Grade 6       | ↓ 11 grades      |

---

### Revised Document

**What you need to do:**

All field employees must pass an annual safety certification exam. Passing this exam is required to keep your job in our field operations.

**If you don't pass:**

You will need to complete extra training. The steps for this training are explained in Appendix C of the Employee Policy Manual.

**If you don't meet the requirements:**

The company may take disciplinary action, following standard company rules.

---

### Trade-off Notes
| Location      | Original                                             | Simplification Made                          | Risk / Decision for Author                                                                                       |
|---------------|------------------------------------------------------|----------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| Sentence 1    | "precondition for the continuation of employment"   | "required to keep your job"                  | Low risk. Meaning is preserved. "Keep your job" is more direct and comprehensible for the target audience.       |
| Sentence 2    | "within the designated timeframe"                   | Removed -- no timeframe specified in original | The original does not name a specific timeframe. If a deadline exists (e.g., 90 days), add it explicitly here.  |
| Sentence 2    | "parameters of which are delineated in Appendix C"  | "steps for this training are explained in Appendix C" | Slight scope assumption: "parameters" could mean eligibility criteria, not just steps. Author should confirm.   |
| Sentence 3    | "in accordance with established organizational procedures" | "following standard company rules"     | "Standard company rules" is vague. If a specific policy number or procedure name applies, name it explicitly.    |
| Sentence 3    | "may result in the initiation of disciplinary action" | "may take disciplinary action"              | Meaning preserved. "Initiation of" was pure nominalization padding with no added meaning.                        |

---

### Recommendations for Further Improvement

- If this notice will be distributed in writing, add a header above the full block ("Annual Safety Certification -- What Every Field Employee Needs to Know") so employees scanning a bulletin board or email immediately understand the subject.
- Consider adding the specific exam date or scheduling deadline immediately after "annual safety certification exam" -- the current text does not include a timeframe, which is likely the most important practical detail for the audience.
- The reference to "Appendix C of the Employee Policy Manual" assumes employees have access to and can locate that manual. If access is not universal, add a note on where to find it or provide a contact name and number.
- If this text will be read by employees whose first language is not English, target Grade 5 FKGL, use numbered steps instead of prose paragraphs, and have it reviewed by a bilingual colleague for natural phrasing.
