---
name: clarity-editing
description: |
  Edits text for clarity by identifying and fixing ambiguous sentences, unclear references, jargon, convoluted syntax, and logical gaps. Produces tracked-change markup with clarity-focused revisions.
  Use when the user asks to make text clearer, easier to understand, less confusing, or more accessible to a specific audience.
  Do NOT use for conciseness (use conciseness-editing), structural changes (use structural-editing), or tone shifts (use tone-adjustment).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "editing writing guide"
  category: "writing"
  subcategory: "editing-refinement"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Clarity Editing

## When to Use

**Use this skill when:**
- The user explicitly asks to make text clearer, easier to understand, less confusing, or more readable for a specific audience -- including phrases like "make this make sense," "simplify this," "my readers keep asking what I mean," or "this is too hard to follow"
- The user has received feedback that their writing is unclear, dense, ambiguous, or hard to follow, and wants to address the clarity failures specifically
- The user is writing for an audience that does not share their level of expertise (technical writer communicating to executives, researcher writing for policymakers, clinician writing patient-facing materials)
- The user needs to adapt existing content for a new audience without restructuring the argument or changing the document's scope
- The user suspects a specific passage is causing confusion -- a paragraph that triggers repeated questions, a sentence that gets misquoted in replies, or a section that readers skim rather than read
- The user is preparing content that will be translated and needs to remove English-specific idioms, ambiguous syntax, and culturally embedded assumptions before the translation step
- The user wants a diagnostic scan of their document to identify where clarity breaks down, even if they will do the revisions themselves

**Do NOT use this skill when:**
- The user wants to shorten or tighten the text without changing the clarity problem -- use `conciseness-editing` (though note that clarity edits frequently produce shorter text as a byproduct)
- The user wants to reorganize sections, add headings, change the order of arguments, or restructure the document's architecture -- use `structural-editing`
- The user wants to shift from formal to conversational tone, change the emotional register, or adjust the voice -- use `tone-adjustment`
- The user wants grammatical errors corrected, punctuation fixed, or spelling checked -- use `proofreading`
- The user wants the reading level raised (more sophisticated vocabulary, more complex sentence structures) -- this is the opposite operation; use `register-elevation`
- The user wants to add new content, expand thin sections, or develop underdeveloped arguments -- use `content-development`
- The text is intentionally abstract, allusive, or deliberately dense (modernist fiction, certain legal instruments, philosophical argumentation for specialist audiences) -- clarity editing in those domains strips necessary complexity and requires specialized judgment before proceeding

---

## Process

### Step 1: Establish the Clarity Target Before Touching a Single Word

Before diagnosing or editing, gather three parameters. If the user has not provided them, ask. Editing without them produces wrong results.

- **Who is the target reader?** Identify the reader's domain expertise, familiarity with the topic, and likely purpose for reading. A cardiologist reading a case report and a patient reading a discharge summary are reading the same facts -- the clarity problem is completely different for each.
- **What is the reading context?** Skimmed in email, read once in a meeting, studied with annotations, or read aloud? Context determines how much cognitive load is acceptable and whether visual disambiguation (bullets, bold) is available.
- **What problem does the user believe exists?** "The whole thing is confusing" is different from "the third paragraph is where everyone stops reading." Localized confusion requires different treatment than systemic opacity. If the user cannot articulate the problem, that itself is data -- do a full diagnostic scan.
- **What must not change?** Identify content that is legally constrained, technically precise to a necessary degree, or stylistically intentional. Mark these zones before editing.
- **What is the target reading level?** Use Flesch-Kincaid Grade Level as a reference benchmark. General business communication targets grades 8--10. Consumer-facing materials target grades 6--8. Academic prose for specialists is typically grades 14--18, which is appropriate for that audience. If the user is writing for grade 8 but their text scores grade 14, that is a documented gap to close.

---

### Step 2: Diagnose Clarity Failures by Type

Scan the text systematically for each of the six categories of clarity failure. Do not read once and intuit -- run each category as a separate pass. The categories are distinct and easy to miss when scanning for all problems simultaneously.

**Category 1: Ambiguous Reference**
- Pronoun with multiple possible antecedents ("After the board reviewed the committee's report, they were satisfied" -- who was satisfied?)
- "This," "that," "it," "these," "those" at the start of a sentence with no clear single referent ("This led to significant delays" -- what is "this"?)
- Modifier attachment ambiguity ("We are looking for developers with experience in Python who are self-motivated" -- is self-motivation a requirement, or a preference, and does it modify the whole clause or just the Python requirement?)
- Scope ambiguity in negation ("Not all vendors were notified of the change in time" -- does "in time" modify when they were notified, or is it a softener meaning some were never notified?)

**Category 2: Convoluted Syntax**
- Sentences where the subject and main verb are separated by more than 12 words. Count them.
- Sentences with more than three levels of embedding (a clause within a clause within a clause)
- Sentences exceeding 40 words that carry more than one logical proposition. Sentences of 20--25 words are optimal for complex information; 25--35 requires deliberate parallel structure to remain readable; over 35 without strong parallelism almost always requires breaking.
- Stacked noun phrases ("the system performance degradation mitigation strategy implementation team") that require the reader to reverse-parse to understand
- Left-branching sentences that front-load qualifications before stating the main point ("Although, in light of the previously discussed constraints and given the regulatory environment that pertains in markets where the product is currently sold, the timeline may require adjustment, the core deliverable remains unchanged")

**Category 3: Undefined or Mis-Calibrated Jargon**
- Technical terms used without definition for a non-specialist audience
- Acronyms expanded only on second use, or not expanded at all
- Terms that have one meaning in the field and a different common meaning in everyday English ("significant" means statistically tested in research; in everyday English it means "important" -- these are not the same)
- Nominalizations (turning verbs into nouns) that obscure agency: "the implementation of the solution" vs. "we implemented the solution." Nominalizations are not inherently jargon, but they frequently make jargon harder to spot and harder to read.
- False familiarity: assuming the reader knows a term because it has appeared in the industry for years, when the actual reader population may not know it

**Category 4: Logical Gaps**
- Missing causal connectors: two facts are stated but the relationship between them is not stated ("The server load increased 40%. The deployment was rolled back." -- was the rollback caused by the load? Related? Coincident?)
- Unstated warrants: the argument moves from evidence to conclusion without stating the principle that connects them ("Patient compliance was below 70%. The treatment failed." -- this assumes a 70% threshold is clinically established, but that assumption is invisible to a non-specialist reader)
- Missing transition: a paragraph ends on one topic and the next begins on another with no bridge
- Conclusion that does not follow from stated premises -- this is a logical failure that looks like a clarity failure and must be handled carefully (see Edge Cases)

**Category 5: Abstraction Overload**
- More than two consecutive abstract statements without a concrete example, analogy, or illustration
- Concepts defined in terms of other abstract concepts, creating a chain of abstraction with no grounding
- Passive constructions that remove the agent and make causation abstract ("Mistakes were made," "Costs were reduced," "A decision was reached" -- by whom?)
- Heavy nominalization clusters that make the text feel abstract even when the underlying idea is concrete ("the optimization of resource allocation strategies" vs. "allocating resources more efficiently")

**Category 6: Garden-Path and Misparsing Traps**
- Sentences where the reader naturally parses the beginning one way and must reparse after reading the full sentence ("The horse raced past the barn fell" is the textbook example; real-world equivalents appear constantly in business and technical writing)
- Reduced relative clauses that create temporary ambiguity ("The proposal rejected by the committee was later resubmitted" -- is "rejected" a past tense verb or a participial modifier? Most readers will parse it wrong on first read)
- Parallel structure that breaks mid-sentence, derailing the reader's expectation ("We need to hire quickly, train thoroughly, and the onboarding process should be streamlined")

---

### Step 3: Prioritize and Plan the Edits

Not all clarity failures are equally damaging. Prioritize before editing.

- **Severity tier 1 (fix always):** Ambiguous reference when the ambiguity produces two different meanings; logical gaps that cause the reader to draw the wrong conclusion; undefined jargon that the target audience will not know
- **Severity tier 2 (fix unless constrained):** Sentences over 35 words; abstraction chains of three or more without grounding; broken parallel structure; garden-path sentences
- **Severity tier 3 (fix when possible, preserve if stylistically intentional):** Sentences over 25 words but under 35; nominalizations when they do not obscure meaning; passive voice when the agent is genuinely unknown or unimportant
- **Do not change:** Content that is precise by necessity; domain jargon that the stated audience knows; sentence complexity that reflects genuinely complex ideas (not all difficulty is a clarity failure)

Create a working list of all flagged items by category and tier before making a single edit. This prevents the common failure mode of editing sentence by sentence, missing inter-sentence problems, and creating new ambiguities when resolving old ones.

---

### Step 4: Apply Clarity Edits Using Targeted Techniques

Each clarity failure category has specific repair techniques. Apply the right technique to the right problem -- do not apply a generic "rewrite this sentence" approach.

**Ambiguous reference repairs:**
- Replace ambiguous pronouns with the specific noun, even if it feels repetitive. Repetition is clearer than ambiguity. ("After the board reviewed the committee's report, the board was satisfied.")
- For "this/that/it" at the start of a sentence, insert a noun immediately after: "This decision led to..." or "This increase in server load led to..." not "This led to..."
- For modifier attachment ambiguity, recast the sentence so the modified element is adjacent to its modifier or use a relative clause to make the attachment explicit

**Convoluted syntax repairs:**
- Apply the "one proposition per sentence" rule to sentences over 35 words. Count the logical propositions and split accordingly. The logical relationship between the split sentences must be stated explicitly using a connector (because, therefore, however, as a result, in contrast -- not left implicit).
- Move subjects and verbs to the front. Left-branch qualifications should become separate preceding sentences or trailing dependent clauses, not front-loaded subordinate clauses.
- Unstack noun phrases by adding prepositions and relative clauses: "the system performance degradation mitigation strategy implementation team" becomes "the team implementing the strategy to address system performance degradation"
- Fix broken parallel structure by making all items in a list grammatically identical (all nouns, all infinitives, all gerunds -- choose one and enforce it)

**Jargon repairs:**
- For undefined jargon, apply the parenthetical-on-first-use rule: introduce the full term and a plain-language gloss in parentheses, then use the term freely. Do not re-gloss on subsequent uses -- it is patronizing.
- For acronyms, spell out on first use with the abbreviation in parentheses, then use the abbreviation.
- For terms with dual meanings (e.g., "significant," "random," "theory," "error"), flag the specialized meaning explicitly when the audience is non-specialist: "statistically significant (meaning the result is unlikely to be due to chance)"
- For nominalizations, convert to verb form when the nominalization obscures agency or makes the sentence abstract: "implementation of the solution" -> "we implemented the solution"

**Logical gap repairs:**
- Add the missing causal connector between two juxtaposed facts. If you are not certain of the causal relationship, do not invent one -- flag it for the user to confirm before adding.
- Add the missing warrant as a brief embedded clause: "Because patient compliance below 70% has been shown to reduce efficacy in similar interventions, the treatment failed."
- Add the missing transition sentence between paragraphs. A good transition sentence restates the conclusion of the previous paragraph and states the question that the next paragraph answers.

**Abstraction overload repairs:**
- After every two consecutive abstract statements, add a concrete example using the formula "For example," or "In practice, this means..." or "To illustrate:"
- Convert passive constructions to active where the agent matters: "Costs were reduced by 20%" becomes "The operations team reduced costs by 20%"
- When a concept is defined in terms of other abstractions, find the concrete bottom of the chain. What does this actually look like when you see it happening?

**Garden-path and misparse repairs:**
- Add "that" after verbs that introduce relative clauses when its absence causes misparse: "The proposal that the committee rejected was later resubmitted"
- Restore full relative clauses: "the proposal rejected by the committee" -> "the proposal that the committee rejected"
- Fix broken parallel structure by identifying the implicit pattern and making it explicit throughout

---

### Step 5: Verify the Edits Have Not Created New Problems

After editing, run three checks before delivering output.

- **Accuracy check:** Has any edit changed the meaning, narrowed a scope that was intentionally broad, or introduced a factual claim that was not in the original? Clarity must never come at the cost of accuracy. If you are uncertain whether a restatement is accurate, flag it explicitly rather than committing to the restatement.
- **Audience calibration check:** Is every word in the edited version appropriate for the stated target audience? Have you over-simplified for an audience that has domain expertise? Have you left terms undefined that the audience will not know?
- **Coherence check:** Read the edited version as a continuous document. Does the logical flow from sentence to sentence and paragraph to paragraph work without re-reading? Are the transitions between ideas traceable?

---

### Step 6: Produce the Tracked-Change Output

Present clarity edits using a consistent tracked-change format (see Output Format below). For each edit:
- Identify the location (sentence number, paragraph, or quoted fragment)
- State the category of clarity failure
- Show the original text
- Show the revised text
- Explain specifically why the original was unclear and how the revision addresses it
- Note the severity tier

Then present the full edited document with all changes incorporated.

---

### Step 7: Provide a Clarity Audit Summary

After showing all tracked changes and the full edited document, provide a summary that:
- Lists the count of each type of clarity failure found
- States the estimated Flesch-Kincaid grade level before and after (or a qualitative estimate if FK calculation is not possible)
- Identifies any unfixed problems (areas that require the user's judgment because fixing would require changing content)
- Makes two or three highest-priority recommendations if the user cannot implement all edits at once

---

### What Bad Clarity Editing Looks Like

Recognize and avoid these failure modes:

- **The dumbing-down error:** Removing necessary precision to make text "simpler." A sentence that is simple but wrong is worse than a sentence that is complex but accurate. Clarity means correctly understood on first read, not simplified.
- **The over-explanation spiral:** Adding so much clarification -- "that is to say," "in other words," "to put it plainly" -- that the text becomes padded and patronizing. Clarification should be surgical, not additive.
- **The audience mismatch:** Editing a text written for specialists as if it is written for a general audience. Stripping domain terminology from a document that cardiologists will read makes it less clear to them, not more.
- **The invisible edit:** Making changes without explaining what was unclear and why. This fails the user because they cannot learn from the edit or apply the same judgment to future writing.
- **The half-fix:** Fixing the syntax of a sentence without addressing the underlying logical gap. A sentence can be grammatically clear and logically incomplete simultaneously.
- **The new ambiguity:** Creating a fresh pronoun ambiguity or logical gap while fixing the original one. Always verify that repairs do not introduce new failures.
- **The context strip:** Removing framing clauses and hedges that are not stylistic padding but functional precision -- "under the conditions tested," "in most cases," "as of the date of this writing." These may look like noise but are often doing work.

---

## Output Format

Deliver output in this exact structure. Complete all fields. Do not omit sections.

```
## Clarity Edit Report

**Document title or identifier:** [User-provided title or "Untitled passage"]
**Target audience:** [Specific description of the reader -- expertise level, purpose, context]
**Reading context:** [How the document will be consumed -- email, briefing, policy document, etc.]
**Word count (original):** [n]
**Flesch-Kincaid Grade Level (original):** [n or qualitative estimate]
**Flesch-Kincaid Grade Level (target):** [n or qualitative estimate]
**Total clarity issues found:** [n]

---

### Tracked Changes

#### Change [n]: [Category of Clarity Failure] -- Severity Tier [1/2/3]
**Location:** [Sentence number or quoted fragment of 5--8 words]
**Original:** "[exact original text]"
**Revised:** "[revised text]"
**Why unclear:** [Specific explanation -- what ambiguity, what gap, what misparse risk, what undefined term]
**How fixed:** [Specific technique applied]

[Repeat for every change]

---

### Clarity Audit Summary

| Clarity Failure Category | Issues Found | Issues Fixed | Unfixed (Requires User Judgment) |
|--------------------------|:------------:|:------------:|:--------------------------------:|
| Ambiguous reference       |      [n]     |      [n]     |               [n]                |
| Convoluted syntax         |      [n]     |      [n]     |               [n]                |
| Undefined/mis-calibrated jargon |   [n]   |      [n]     |               [n]                |
| Logical gap               |      [n]     |      [n]     |               [n]                |
| Abstraction overload      |      [n]     |      [n]     |               [n]                |
| Garden-path / misparse    |      [n]     |      [n]     |               [n]                |
| **Total**                 |    **[n]**   |    **[n]**   |             **[n]**              |

**Readability before:** [Grade level or qualitative estimate]
**Readability after:** [Grade level or qualitative estimate]

**Unfixed issues requiring user input:**
- [Description of any issue that could not be resolved without changing content or confirming a causal relationship]

**Priority recommendations if partial implementation:**
1. [Most critical fix -- the one that damages comprehension most severely]
2. [Second most critical]
3. [Third most critical]

---

### Edited Document

[Full text of the document with all clarity edits applied, presented as clean readable prose with no markup. Paragraph structure preserved unless paragraph breaks were themselves a clarity issue.]
```

---

## Rules

1. **Never sacrifice accuracy for simplicity.** Clarity means easily and correctly understood -- not simplified. If fixing a sentence requires changing what it says factually, flag it for the user to confirm rather than committing to the rewrite.

2. **Never edit for a hypothetical reader.** Edit for the stated target audience. Jargon is defined by what that specific audience does not know. A term that requires a definition for a general manager requires none for a software engineer reading technical documentation.

3. **Always identify the specific category of clarity failure for every change.** "This sentence is confusing" is not a diagnosis. "This sentence contains a pronoun with two possible antecedents, which produces two different readings" is.

4. **Never remove hedges and qualifications without confirming they are stylistic rather than substantive.** "In most cases," "under the conditions tested," "as currently understood" are frequently precision markers, not weasel words. Stripping them changes meaning.

5. **When breaking long sentences, always state the logical relationship between the resulting sentences explicitly.** Do not let the relationship be implied. Use: because, therefore, however, as a result, in contrast, which means, this happened because, and so -- not just a period.

6. **Never fix an ambiguous pronoun with "the former" or "the latter."** These constructions require the reader to reverse-scan and re-read. Always replace with the specific noun.

7. **When adding definitions for jargon, use the parenthetical-on-first-use technique exactly once.** Do not re-gloss the term on second use. Re-glossing is patronizing to readers who have now encountered the term and slows readers who have known it all along.

8. **Always check that an edit has not created a new clarity failure.** Especially check for: new pronoun ambiguities introduced when restructuring sentences; new logical gaps when splitting long sentences; and new abstraction overload when removing concrete examples that were embedded in the original complex syntax.

9. **Flag logical gaps separately from clarity edits if the gap requires a factual or causal claim you cannot verify.** Do not invent causal links. Write: "Possible logical gap: the relationship between [X] and [Y] is not stated. If [X] caused [Y], consider adding 'because' or 'as a result.' If the relationship is different, please specify."

10. **Clarity editing changes words, not arguments.** If making the text clear reveals that the argument is weak, circular, or incorrect, that is an `argumentation` or `content-development` problem -- flag it, do not fix it silently. The user needs to know the underlying problem.

11. **When the user provides text that will be localized or translated, apply stricter standards:** eliminate all idioms, reduce sentence complexity to under 20 words average, prefer active voice throughout, and replace culturally embedded references with universal equivalents.

12. **Do not apply clarity edits to text with intentional stylistic complexity without confirming with the user.** Legal boilerplate, philosophical argument, literary prose, and certain forms of academic writing may have complexity that is doing work, not creating a problem.

---

## Edge Cases

**1. Highly technical text for a technical audience**
The clarity failures in specialist-to-specialist communication are almost never vocabulary-based -- they are structural. Focus exclusively on: ambiguous references (pronoun antecedents are just as ambiguous in a research paper as in a business email), long sentences with subject-verb distance over 12 words, logical gaps between sections (methods to results, results to conclusion), and missing transition sentences between paragraphs. Do not touch the vocabulary. Do not add definitions. Assess calibration: if a cardiologist has written "ejection fraction" in a paper for cardiologists, that is not jargon -- it is the correct term. Flag it only if the paper is intended for a mixed audience that includes non-cardiologists.

**2. Legal and regulatory text**
Precision is legally enforced in many instruments -- "shall," "must," "may," and "should" are terms of art with precise legal weight and cannot be made interchangeable for clarity. "Notwithstanding the foregoing" is not pompous filler -- it is a legal operation. Before editing legal text, identify which elements are legally specified versus which are drafting style choices. Apply clarity editing only to the latter: organize long sentences where permitted, replace "the same" and "said [noun]" (archaic legal reference forms) with the specific noun, add white space and headings if the format permits. Never change legal term-of-art vocabulary without flagging it.

**3. Text with genuine logical problems disguised as clarity problems**
Sometimes text is unclear not because of writing but because the underlying thinking is unclear. You can produce a grammatically clean version of a circular argument or an empirically unsupported claim. Recognize the signs: you fix the syntax, but the edited sentence still produces confusion; you add a logical connector, but the connection is not actually there; the premises do not support the conclusion even in the clearest possible prose. When this happens, flag it explicitly: "This passage reads unclearly because the underlying argument has a gap that cannot be resolved through editing. The passage asserts [X] as a consequence of [Y], but [Y] does not produce [X] without [missing premise]. This requires content revision, not clarity editing."

**4. Text with deliberate ambiguity or complexity (literary, artistic, philosophical)**
Do not resolve intentional ambiguity. In literary fiction, an ambiguous pronoun may be doing exactly what the author wants -- creating two simultaneous readings. In philosophy, a sentence that requires re-reading may be demonstrating a difficult concept through its form. Confirm with the user: "This text contains passages that appear intentionally ambiguous or complex. Should I focus only on unintentional clarity failures, or is some of this stylistic complexity also a target for editing?" Then scope accordingly.

**5. The user does not know their audience**
This is common. A writer preparing a report for "senior leadership" does not know whether that audience has technical backgrounds, reads financial documents, or is encountering this subject for the first time. In this case, before editing, ask: "What decisions will readers make based on this document? What do they already know about this topic? Have they read previous documents on this subject?" These questions establish functional audience calibration. If the user genuinely cannot answer, edit for educated non-specialist with no background in the specific domain -- this is the safest default because it produces text that specialists can still read while non-specialists can also read it. Note the assumption explicitly in the report.

**6. The user wants clarity and conciseness simultaneously**
These goals frequently overlap but sometimes conflict. Clarity edits that add a concrete example or an explicit logical connector increase word count. When clarity and conciseness conflict on a specific edit, clarity wins -- and the edit is noted as a clarity-conciseness tradeoff. Apply conciseness edits (cutting words that do not carry meaning) everywhere that they do not compromise clarity. Mark every place where a clarity fix increased length so the user can consciously decide whether to accept the added words or find a more efficient path to the same clarity.

**7. Very long documents (over 2,000 words)**
Do not attempt a complete word-by-word clarity edit in one pass for documents over 2,000 words without confirming the user wants that level of analysis. Instead, offer a two-phase approach: Phase 1 is a diagnostic scan that identifies the categories of clarity failure, their frequency, and the highest-severity locations. Phase 2 is the full edit, which can be done section by section. For documents over 5,000 words, always propose section-by-section editing. When prioritizing sections, use this order: executive summary or abstract (highest impact, most read), conclusion, introduction, body sections with the highest density of tier-1 failures.

**8. Text that has already been clarity-edited (re-editing request)**
Sometimes a user asks for clarity editing on text that has already been through one round of editing. The most common residual problems after a first-round clarity edit are: (a) new pronoun ambiguities introduced during the first round's sentence restructuring, (b) logical gaps that the first editor resolved with connectors that do not actually fit the causal relationship, and (c) jargon that was glossed incorrectly (wrong definition added). Run the diagnostic scan fresh -- do not assume the first edit resolved the category correctly. Look especially for over-explanation (text that has become verbose from too many clarifying additions) and calibration drift (text that has been edited toward the wrong audience level).

---

## Example

**User input:** "Make this clearer for a non-technical VP of Operations who will use it to decide whether to approve the project budget: 'The proposed migration from the legacy monolith to a distributed microservices architecture leverages containerization via Docker and orchestration through Kubernetes to achieve horizontal scalability, with service mesh implementation using Istio enabling inter-service communication security and observability, while the phased deprecation of the existing PostgreSQL instance in favor of a polyglot persistence approach -- utilizing Redis for caching, Cassandra for time-series write loads, and the retained PostgreSQL core for transactional integrity -- has been scoped to 18 months with an estimated TCO reduction of 23% by year 3, contingent upon successful completion of the foundational infrastructure buildout in Q1 and Q2.'"

---

## Clarity Edit Report

**Document title or identifier:** Budget approval paragraph -- system migration project
**Target audience:** VP of Operations, non-technical; making a budget approval decision; no software engineering background assumed; familiar with business metrics, project timelines, and cost language
**Reading context:** Read once, likely in a budget meeting or pre-read memo; decision must be traceable to the paragraph without re-reading
**Word count (original):** 122 words
**Flesch-Kincaid Grade Level (original):** Approximately grade 18+ (one 122-word sentence with six embedded technical concepts and no plain-language anchors)
**Flesch-Kincaid Grade Level (target):** Grade 9--11 (business prose suitable for an executive audience)
**Total clarity issues found:** 11

---

### Tracked Changes

#### Change 1: Convoluted Syntax -- Severity Tier 1
**Location:** Entire passage (single 122-word sentence)
**Original:** [the entire paragraph is one sentence with six embedded technical concepts connected by commas, dashes, and a single subordinating clause]
**Revised:** Split into five sentences, each carrying one logical proposition: (1) what we are doing, (2) what technical approach enables it, (3) what we are doing with the database, (4) the timeline and cost outcome, (5) what the cost projection depends on
**Why unclear:** A 122-word sentence requires a reader to hold all six concepts in working memory simultaneously while parsing the grammatical structure. For a non-technical reader making a financial decision, this means they cannot identify what they are being asked to approve or what the projected benefit is without re-reading.
**How fixed:** Applied the one-proposition-per-sentence rule; identified six logical propositions and reduced to five sentences (two propositions related closely enough to share a sentence); stated all causal relationships explicitly using "which means," "as a result," and "this depends on."

---

#### Change 2: Undefined Jargon -- "legacy monolith to a distributed microservices architecture" -- Severity Tier 1
**Location:** Opening clause
**Original:** "migration from the legacy monolith to a distributed microservices architecture"
**Revised:** "replacing our current all-in-one software system with a set of smaller, independent components"
**Why unclear:** "Legacy monolith" and "microservices architecture" are software engineering terms with no plain-language equivalent available to a non-technical VP. A budget decision cannot be made on a term that the decision-maker does not understand.
**How fixed:** Replaced both terms with a plain-language description of what the change actually is -- one large system becoming smaller independent parts. The technical terms are preserved in a parenthetical for teams who need them.

---

#### Change 3: Undefined Jargon -- "containerization via Docker and orchestration through Kubernetes" -- Severity Tier 1
**Location:** Second embedded clause
**Original:** "leverages containerization via Docker and orchestration through Kubernetes to achieve horizontal scalability"
**Revised:** "packaging each component so it can run independently and scale automatically when demand increases"
**Why unclear:** Docker, Kubernetes, containerization, and horizontal scalability are all technical terms. None of them maps to a concept a non-technical VP can evaluate. "Achieves horizontal scalability" tells the reader nothing about what that means for operations or cost.
**How fixed:** Translated to the operational outcome: components run independently and scale automatically with demand. Tool names (Docker, Kubernetes) are removed from the VP-facing version and should appear in the technical appendix. The outcome -- scaling with demand -- is what the VP needs to evaluate.

---

#### Change 4: Undefined Jargon -- "service mesh implementation using Istio enabling inter-service communication security and observability" -- Severity Tier 1
**Location:** Third embedded clause following the comma after "horizontal scalability"
**Original:** "with service mesh implementation using Istio enabling inter-service communication security and observability"
**Revised:** "built-in monitoring and security controls between components"
**Why unclear:** "Service mesh," "Istio," "inter-service communication," and "observability" are all specialist terms. The concept being communicated is security and monitoring between the components -- a concept the VP can evaluate. The implementation mechanism is irrelevant at this level.
**How fixed:** Stated the operational output (security controls and monitoring) without the implementation vocabulary. Istio and "service mesh" belong in the technical specification, not the budget approval paragraph.

---

#### Change 5: Undefined Jargon -- "polyglot persistence approach utilizing Redis for caching, Cassandra for time-series write loads, and the retained PostgreSQL core for transactional integrity" -- Severity Tier 1
**Location:** Following the em-dash
**Original:** "a polyglot persistence approach -- utilizing Redis for caching, Cassandra for time-series write loads, and the retained PostgreSQL core for transactional integrity"
**Revised:** "using specialized data storage tools optimized for different types of data -- one for rapid temporary lookups, one for high-volume time-stamped records, and the existing database for financial and transactional records"
**Why unclear:** "Polyglot persistence," "Redis," "Cassandra," and "time-series write loads" are all technical terms. A VP of Operations needs to know that the database is being split into specialized components for performance reasons, not the names of the tools.
**How fixed:** Described the function of each storage type in operational terms (rapid lookups, time-stamped records, financial records) rather than the tool names. "Polyglot persistence" is removed entirely from the plain-language version -- it describes the approach to engineers but carries no meaning for a budget decision.

---

#### Change 6: Logical Gap -- relationship between technical changes and cost reduction -- Severity Tier 1
**Location:** Between the technical description and the "23% TCO reduction" claim
**Original:** [technical changes described] "...has been scoped to 18 months with an estimated TCO reduction of 23% by year 3"
**Revised:** Added the causal bridge: "Because each component can scale independently instead of the whole system scaling together, infrastructure costs drop as usage patterns vary. This is projected to reduce total technology operating costs by 23% by year 3."
**Why unclear:** The original states technical changes and then a cost figure with no stated connection between them. A VP approving a budget needs to understand why the technical changes produce the cost reduction -- not just that they do.
**How fixed:** Added the causal mechanism in plain language (independent scaling vs. whole-system scaling reduces cost) as the explicit bridge between the technical approach and the financial projection.

---

#### Change 7: Ambiguous Reference -- "contingent upon successful completion of the foundational infrastructure buildout" -- Severity Tier 2
**Location:** Final clause
**Original:** "contingent upon successful completion of the foundational infrastructure buildout in Q1 and Q2"
**Revised:** "This projection assumes the infrastructure setup work in Q1 and Q2 is completed on schedule. If that work is delayed, the 23% cost reduction timeline shifts accordingly."
**Why unclear:** "Contingent upon" is formal and passive; it buries the risk. For a decision-maker, the important information is: the cost projection is at risk if Q1 and Q2 milestones slip. The original does not say this clearly -- it uses a legal-style qualifier that may not register as a risk flag.
**How fixed:** Restated the contingency as an explicit risk statement with the consequence spelled out. The VP now knows: Q1/Q2 delivery is a dependency for the financial projection, and slippage has a named consequence.

---

#### Change 8: Abstraction Overload -- "TCO reduction" -- Severity Tier 2
**Location:** Penultimate clause
**Original:** "estimated TCO reduction of 23% by year 3"
**Revised:** "23% reduction in total technology operating costs by year 3"
**Why unclear:** TCO (Total Cost of Ownership) is a widely used acronym in finance and operations, but it is not universal. A VP of Operations may know it, may not, and the full form takes five words -- the cost of ambiguity outweighs the cost of spelling it out once.
**How fixed:** Spelled out in full on first use. If the document uses TCO again, the abbreviation can be used freely after this instance.

---

#### Change 9: Convoluted Syntax -- subject-verb distance -- Severity Tier 2
**Location:** "the phased deprecation of the existing PostgreSQL instance in favor of a polyglot persistence approach...has been scoped to 18 months"
**Original:** Subject ("the phased deprecation...") and verb ("has been scoped") are separated by 22 words and an embedded parenthetical list
**Revised:** Broken into: (1) sentence describing what is happening to the database, (2) separate sentence with the timeline and scope
**Why unclear:** By the time the reader reaches "has been scoped," they have processed a 22-word subject phrase with an embedded three-item list. Most readers will have lost the grammatical thread and will not be able to identify what has been scoped.
**How fixed:** Sentence split. The database change is described first; the scoping and timeline are stated in a separate sentence with a clear subject ("the full migration").

---

#### Change 10: Garden-Path Trap -- "phased deprecation" -- Severity Tier 2
**Location:** After the em-dash
**Original:** "phased deprecation of the existing PostgreSQL instance"
**Revised:** "a planned, gradual retirement of the existing database"
**Why unclear:** "Deprecation" is a software term meaning "marking something as obsolete before removing it." A non-technical VP may parse "deprecation" as "depreciation" (an accounting term) or simply not know the term. Either misparse changes the meaning significantly.
**How fixed:** Replaced with plain operational language -- "planned, gradual retirement" -- which conveys the same concept (removing it slowly in phases) without risk of misparse.

---

#### Change 11: Passive Construction Obscuring Agency -- Severity Tier 3
**Location:** "has been scoped to 18 months"
**Original:** "has been scoped to 18 months"
**Revised:** "The engineering team has scoped the full migration at 18 months"
**Why unclear:** "Has been scoped" removes the agent -- the VP cannot tell who created the 18-month estimate. For a budget approval decision, knowing that the engineering team (not a vendor, not an executive, not a consultant) scoped the estimate is relevant information.
**How fixed:** Restored the agent. If a different party scoped the timeline (external consultant, project manager), substitute accordingly -- this is flagged for the user to confirm.

---

### Clarity Audit Summary

| Clarity Failure Category     | Issues Found | Issues Fixed | Unfixed (Requires User Judgment) |
|------------------------------|:------------:|:------------:|:--------------------------------:|
| Ambiguous reference           |      1       |      1       |               0                  |
| Convoluted syntax             |      2       |      2       |               0                  |
| Undefined/mis-calibrated jargon |    6       |      6       |               0                  |
| Logical gap                   |      1       |      1       |               0                  |
| Abstraction overload          |      1       |      1       |               0                  |
| Garden-path / misparse        |      1       |      1       |               0                  |
| Passive (agency obscured)     |      1       |      1       |               0                  |
| **Total**                     |    **13**    |    **13**    |             **0**                |

**Readability before:** Grade 18+ (one 122-word sentence; no plain-language anchors; six undefined technical terms)
**Readability after:** Grade 9--10 (five sentences averaging 22 words; all technical terms replaced or glossed; causal logic explicit)

**Unfixed issues requiring user input:**
- Change 11 assumes the engineering team scoped the 18-month estimate. If a different party (external consultant, vendor, PMO) created this estimate, the revised sentence should name that party instead. Confirm the agent before finalizing.
- The 23% TCO reduction figure is cited as an estimate. If there is a confidence interval or a range (e.g., 18--28%), adding it would be more accurate for a budget decision. This is a content decision, not a clarity fix.

**Priority recommendations if partial implementation:**
1. Split the single 122-word sentence into multiple sentences (Change 1) -- this alone improves readability by more than any other single edit
2. Replace the five undefined technical terms (Changes 2--5) -- these are the terms most likely to cause misparse or to make the VP feel unable to evaluate the request
3. Add the causal bridge between technical changes and cost reduction (Change 6) -- without this, the budget case is incomplete

---

### Edited Document

We are replacing our current all-in-one software system with a set of smaller, independent components -- each able to run, update, and scale on its own. This approach includes built-in monitoring and security controls between components, as well as the ability for each component to scale automatically when demand increases, instead of scaling the entire system.

We are also moving from a single database to specialized data storage tools optimized for different types of data: one for rapid temporary lookups, one for high-volume time-stamped records, and the existing database (retained) for financial and transactional records.

Because each component can scale independently instead of the whole system scaling together, infrastructure costs drop as usage patterns vary. This is projected to reduce total technology operating costs by 23% by year 3.

The engineering team has scoped the full migration at 18 months. This projection assumes the infrastructure setup work in Q1 and Q2 is completed on schedule. If that work is delayed, the 23% cost reduction timeline shifts accordingly.
