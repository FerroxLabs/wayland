---
name: final-readthrough
description: |
  Performs a comprehensive final readthrough of a document before publication, checking for errors, consistency, formatting, and overall quality using a structured checklist approach.
  Use when the user asks for a final check, last-pass review, pre-publication review, or quality assurance pass on a nearly finished document.
  Do NOT use for first-pass editing (use copy-editing or structural-editing), in-depth fact-checking (use fact-check-framework), or style guide compliance (use style-guide-compliance).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "editing writing checklist"
  category: "writing"
  subcategory: "editing-refinement"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Final Readthrough

## When to Use

**Use this skill when:**
- The user explicitly asks for a "final check," "last-pass review," "pre-publication review," "pre-submission read," or "one more set of eyes" on a document they consider nearly finished
- The document has already received at least one substantive editing pass and the user is verifying readiness, not seeking developmental feedback
- The user needs a structured go/no-go readiness verdict before sending to a client, editor, publisher, hiring manager, or live audience
- The user is preparing a high-stakes document -- a board report, press release, grant application, academic submission, or client-facing proposal -- and wants systematic assurance that nothing embarrassing slipped through
- The user has made targeted revisions after a previous edit and wants to confirm the fixes landed correctly without introducing new problems
- The document is being handed off between collaborators and needs a seam check before the final author signs off
- The user is about to schedule or trigger publication in a CMS, email platform, or print queue and cannot easily correct errors afterward

**Do NOT use this skill when:**
- The document still needs structural reorganization -- sections are in the wrong order, the argument is unclear, or entire sections are missing (use `structural-editing` first)
- The user needs sentence-level rewriting for clarity, tone, or style -- word choice is weak, sentences are tangled, or paragraphs are bloated (use `copy-editing` first)
- The user needs verification of factual claims, statistics, dates, or source accuracy (use `fact-check-framework` -- a final readthrough catches obvious internal contradictions but does not verify external facts)
- The user needs formal compliance with a specific house style guide -- AP, Chicago, APA, MLA, or a client's brand guide (use `style-guide-compliance`, which applies those rules systematically)
- The user needs purely mechanical proofreading of a typeset or formatted document where layout is the primary concern (use `proofreading`)
- The document is a first draft presented as nearly done -- if more than one in five sentences needs substantive revision, this is not a final readthrough situation; redirect to the appropriate editing skill
- The user wants creative feedback, brainstorming, or idea generation -- those are generative tasks, not quality assurance tasks

---

## Process

### Step 1 -- Establish Document Context Before Touching the Text

Before reading a single sentence, gather the parameters that determine what "good" means for this specific document. The same sentence that passes in a casual newsletter fails in a legal brief.

- **Document type:** Is this a blog post, white paper, academic paper, press release, email, proposal, report, manuscript chapter, or something else? Each has different conventions for acceptable sentence length, heading depth, citation format, and tone register.
- **Destination and audience:** Where is this going and who will read it? "Publishing on our company blog read by mid-level marketers" demands different standards than "submitting to a peer-reviewed journal" or "sending to a Fortune 500 procurement committee."
- **The non-negotiable core message:** Ask or infer: what is the single thing the reader must understand, believe, or do after reading? Everything in the document should serve this. If you cannot identify the core message, that is your first finding.
- **Prior editing history:** Has this document had a structural edit? A copy edit? Peer review? The more editing it has had, the more confident you can be starting at a final-pass level. If the user says "this is my first time having anyone look at it," flag that this may need more than a final readthrough.
- **Hard constraints:** Word count limits, submission formatting requirements, character limits in headings, required sections, mandated legal disclaimers. Confirm these are met before checking anything else -- a document that violates a hard constraint is not publishable regardless of writing quality.
- **Known weak spots:** Ask if the user already knows of any sections they are uncertain about. Do not spend the final readthrough diagnosing what the user already knows is broken; note it briefly and focus attention where the user has confidence but you should verify.

---

### Step 2 -- Read the Entire Document Once, Cold, Before Flagging Anything

The most common mistake in a final readthrough is stopping to annotate at the first issue found. This destroys the reader-experience test, which is the primary thing a final readthrough provides that earlier editing passes did not.

- Read the full document from beginning to end at a normal reading pace without marking anything. This simulates the experience of the actual reader -- a reader who has no editorial context and encounters the document fresh.
- During this first pass, track one thing only: your own reading experience. Note where you hesitated, re-read, felt confused, lost interest, or felt a friction of any kind. These moments are the most valuable signal in the entire readthrough -- they represent failure points that earlier editing missed because earlier editors had context the reader does not.
- After the first pass, write down -- before consulting the checklist -- your immediate gut reactions: "Something feels off in the third section," "the title does not match what the piece is actually about," "I expected a conclusion that told me what to do and it does not arrive." These impressions are data.
- Only after completing the cold read and noting impressions do you begin the systematic checklist pass.

---

### Step 3 -- Run the Systematic Checklist Pass

Work through every category in order. Do not skip categories because the document "feels fine" -- the point of a checklist is that human (and AI) judgment is unreliable without systematic prompting.

**Category A: Structural Integrity (content-level)**
- Does the opening sentence or paragraph give the reader a reason to continue? For long-form content, the first 50 words must earn the next 500. For short-form content (email, memo), the subject line and first sentence must make the purpose immediately clear.
- Is the core message stated explicitly, not left to inference? In persuasive and informational documents, the key claim must appear in the first third of the document. In academic abstracts, it must appear in the abstract itself.
- Does every section or paragraph have a clear reason to exist in relation to the core message? A section that is interesting but tangential to the core message is a liability in a final document -- flag it.
- Does the document end with appropriate closure? Endings fail in two characteristic ways: the abrupt stop (the last section just ends, with no closing thought) and the restatement trap (the conclusion repeats what was already said rather than adding resolution, implication, or call to action). Identify which failure mode, if either, is present.
- Are there any internal contradictions -- statements in one section that contradict claims in another? Pay particular attention to numerical claims (statistics, dates, quantities) that appear more than once.

**Category B: Mechanics**
- Spelling: proper nouns, technical terms, and brand names are the highest-risk spelling locations in a final document because spellcheck does not catch them. Read every proper noun, every technical term, and every name deliberately.
- Grammar: subject-verb agreement failures, pronoun-antecedent mismatches, dangling modifiers, and run-on sentences are the most common grammar errors that survive copy editing. Read each sentence as a standalone unit.
- Punctuation: comma splices, missing Oxford commas (or present Oxford commas in a document that uses AP style), and apostrophe errors in possessives vs. plurals are the most common punctuation failures.
- Number formatting: are all numbers below ten spelled out if the document uses that convention? Are percentages written as "10%" or "10 percent" consistently? Are large numbers formatted consistently ("1,000" vs. "1000" vs. "one thousand")?
- Hyphenation: compound modifiers before a noun require a hyphen ("high-quality document") but not after a linking verb ("the document is high quality"). This error is nearly universal in final documents.
- Capitalization: are job titles capitalized only when used as formal titles before a name, or are they overcapitalized throughout ("the Marketing Director reviewed the report" -- "director" should be lowercase here)? Is the capitalization style for headings consistent (title case vs. sentence case)?

**Category C: Formatting and Visual Consistency**
- Heading hierarchy: H1 is for the document title only, H2 for major sections, H3 for subsections. A document with H1 appearing mid-body or H3 without a parent H2 has a broken hierarchy.
- List formatting: every list in the document should share the same terminal punctuation convention. If bulleted items are complete sentences, they end with periods. If they are fragments, they end with nothing or with commas/semicolons for the penultimate item. Choose one convention and apply it universally.
- Spacing and visual rhythm: paragraph breaks, section spacing, and line spacing should be consistent. A document that has double-spaced paragraphs in one section and single-spaced in another looks unfinished.
- Tables, figures, and images: every visual element requires a caption or label. Every table or figure referenced in the body text must match its label exactly ("see Figure 3" when the figure is labeled "Figure 3," not "Figure 3a"). Figures and tables should appear near the text that references them, not several pages away.
- Hyperlinks and references: every link must be tested. In print documents, every URL cited in text must be complete and correct. In academic or formal documents, every in-text citation must have a matching entry in the reference list, and every reference list entry must be cited somewhere in the text.
- Font and style consistency: bold and italic should be used purposefully and consistently -- not for decoration. If the document uses bold for key terms, bold should appear only on first use of key terms, not scattered throughout for emphasis.

**Category D: Terminological and Tonal Consistency**
- Term consistency: identify the three to five most important content terms in the document and verify they are used with exactly the same spelling, capitalization, and hyphenation throughout. "Machine learning," "machine-learning," and "ML" should not coexist in the same document without explicit introduction of the abbreviation.
- Abbreviation protocol: every abbreviation must be spelled out in full on first use, with the abbreviation in parentheses immediately after. "The World Health Organization (WHO)" -- then WHO thereafter. Scan for abbreviations that appear before their introduction.
- Tone register: is the document uniformly formal, semiformal, or conversational? Tone breaks are most common at section boundaries, especially in collaborative documents. A document that is formal in sections 1-3 and suddenly conversational in section 4 has a seam problem.
- Person and voice consistency: is the document uniformly in first person singular ("I"), first person plural ("we"), second person ("you"), or third person? A shift from "we recommend" to "the company recommends" within the same document is a consistency failure.
- Tense consistency: in analytical and reporting documents, findings are typically described in present tense ("the data show") while methodology is described in past tense ("we surveyed"). Verify the tense logic is consistent with the document's conventions.

**Category E: Reader Experience and Final Impression**
- The re-read test: note any sentence you had to read more than once to understand. A sentence that requires re-reading in a final document is a readability failure, not just an aesthetics issue. Flag every re-read sentence.
- The one-sentence test: after reading the full document, try to state its core message in one sentence. If you cannot, the document has a clarity problem even if every individual sentence is grammatically correct.
- The embarrassment test: imagine the document appearing in front of the most critical audience it could reach. Is there any word, claim, metaphor, or phrasing that would cause the author embarrassment, that could be misread, or that could be taken out of context in a damaging way?
- The missing-comma authority test: is the document ready to be defended as-is? Final documents must be defensible in the form they are submitted. If you would caveat it to the recipient, it is not ready.

---

### Step 4 -- Categorize and Prioritize Every Finding

Not all findings are equal. After running the checklist, assign each finding a severity level before reporting. This prevents the readthrough from overwhelming the user with minor issues while burying the critical ones.

- **Critical (must fix before publication):** Factual contradictions within the document, broken or missing required elements (missing reference entries, absent required sections, incorrect file formats), content that could be misread as defamatory, discriminatory, or legally problematic, and any error in the title, byline, or opening paragraph -- errors in these high-visibility locations are disproportionately damaging.
- **Standard (fix before publication, quick to resolve):** Grammar errors, spelling errors, punctuation inconsistencies, formatting deviations, broken links, missing abbreviation introductions, and terminological inconsistencies.
- **Advisory (optional improvement, does not block publication):** Tone suggestions, sentence restructuring for readability, stronger word choices, pacing observations, and stylistic refinements that are preference-based rather than error-based.

Do not present Critical, Standard, and Advisory findings with equal weight. Lead with Critical, make Standard findings easy to scan and act on, and frame Advisory findings as optional.

---

### Step 5 -- Apply Fixes and Produce a Clean Version

For documents with ten or fewer Standard/Critical findings, apply all fixes directly and deliver the corrected version alongside the issue report.

- Apply every Critical and Standard fix to the document text.
- Do not apply Advisory suggestions without flagging that you are doing so -- the user may prefer not to accept them.
- When applying fixes, make only the minimum change necessary to resolve the specific issue. A final readthrough fix for "fewer" vs. "less" should change exactly one word, not rewrite the sentence. Scope creep in fix application is a common failure mode.
- After applying fixes, do a quick re-scan of the corrected passages to confirm the fix did not introduce a new error. Replacement errors -- where fixing one word breaks the grammar of the surrounding sentence -- are more common than expected.
- For documents with more than ten findings, provide the issue table and verdict, but recommend the user make the corrections and return for a confirmation pass rather than attempting to apply all changes in a single response, which risks introducing replacement errors at scale.

---

### Step 6 -- Deliver the Readthrough Report with a Clear Verdict

The verdict is the most important single output of the readthrough. Commit to one of three positions and defend it:

- **Ready to publish:** The document meets publication standards. Any remaining issues are cosmetic and have been fixed inline. The author can publish with confidence.
- **Ready with minor fixes:** The document has a small number of identified issues (typically five or fewer Standard findings, no Critical findings) that are quick to resolve. Provide the specific fixes. The document can be published immediately after applying them.
- **Needs another pass:** The document has Critical findings, or more than five Standard findings, or Advisory issues significant enough to materially affect reader experience. Specify what kind of pass is needed -- another copy-editing review, a structural revision of a specific section, or a targeted consistency pass.

Do not use hedging language in the verdict ("it might be ready" or "probably fine"). The verdict is a professional judgment, not a guess.

---

### Step 7 -- Identify the Single Highest-Impact Improvement

Even in a document that is ready to publish, identify the one change that would most improve it. This is not a criticism -- it is editorial value added. Frame it specifically:

- Do not say "the conclusion could be stronger." Say "the conclusion restates the three tips without motivating action -- one sentence inviting the reader to choose one tip and try it this week would give the ending forward momentum."
- Do not say "consider varying sentence length." Say "paragraphs 4 and 5 contain seven consecutive sentences of similar length (12-16 words each) -- breaking one into a short declarative (5-7 words) would create emphasis and improve pacing."
- The single highest-impact improvement should always be about meaning, reader experience, or persuasive effectiveness -- not about mechanics. Mechanics are fixed in the checklist. The one improvement is about making the document more powerful.

---

## Output Format

```
## Final Readthrough Report

**Document:** [Title or description]
**Document Type:** [Blog post / White paper / Academic paper / Email / Proposal / Report / Press release / etc.]
**Destination:** [Where it is being published or sent]
**Word Count:** [Approximate word count -- relevant for calibrating scope of issues]
**Verdict:** [Ready to publish / Ready with minor fixes / Needs another pass]

---

### Checklist Results

Use ✓ for Pass, ⚠ for Flag (issue present but minor or advisory), ✗ for Fail (must fix).

#### A. Structural Integrity
| Check | Result | Notes |
|-------|--------|-------|
| Opening earns continued reading | ✓ / ⚠ / ✗ | [Specific note if flagged] |
| Core message stated explicitly | ✓ / ⚠ / ✗ | |
| All sections serve core message | ✓ / ⚠ / ✗ | |
| Ending provides appropriate closure | ✓ / ⚠ / ✗ | |
| No internal contradictions | ✓ / ⚠ / ✗ | |

#### B. Mechanics
| Check | Result | Notes |
|-------|--------|-------|
| Spelling (including proper nouns and technical terms) | ✓ / ⚠ / ✗ | |
| Grammar (agreement, modifiers, pronouns) | ✓ / ⚠ / ✗ | |
| Punctuation (commas, apostrophes, hyphens) | ✓ / ⚠ / ✗ | |
| Number formatting consistent | ✓ / ⚠ / ✗ | |
| Capitalization consistent | ✓ / ⚠ / ✗ | |

#### C. Formatting and Visual Consistency
| Check | Result | Notes |
|-------|--------|-------|
| Heading hierarchy logical (H1 > H2 > H3) | ✓ / ⚠ / ✗ | |
| List formatting consistent (punctuation, parallelism) | ✓ / ⚠ / ✗ | |
| Spacing and visual rhythm consistent | ✓ / ⚠ / ✗ | |
| Tables / figures captioned and labeled correctly | ✓ / ⚠ / ✗ | |
| Links and references verified | ✓ / ⚠ / ✗ | |

#### D. Terminological and Tonal Consistency
| Check | Result | Notes |
|-------|--------|-------|
| Key terms used consistently | ✓ / ⚠ / ✗ | |
| Abbreviations introduced before use | ✓ / ⚠ / ✗ | |
| Tone register uniform throughout | ✓ / ⚠ / ✗ | |
| Person and voice consistent | ✓ / ⚠ / ✗ | |
| Tense logic consistent | ✓ / ⚠ / ✗ | |

#### E. Reader Experience
| Check | Result | Notes |
|-------|--------|-------|
| No sentences requiring re-reading | ✓ / ⚠ / ✗ | |
| Core message statable in one sentence | ✓ / ⚠ / ✗ | |
| No embarrassment-risk language | ✓ / ⚠ / ✗ | |
| Document is defensible as submitted | ✓ / ⚠ / ✗ | |

---

### Issues Found

| # | Severity | Category | Location | Issue | Fix |
|---|----------|----------|----------|-------|-----|
| 1 | Critical / Standard / Advisory | [Category A-E] | [Paragraph #, section name, or specific quote] | [Exact description of the error] | [Exact correction] |
| 2 | | | | | |

---

### One Improvement
[A specific, concrete, actionable description of the single change that would most improve the document -- framed in terms of reader impact, not abstract quality. Include the specific location and the specific change.]

---

### Publication Verdict

**[Ready to publish / Ready with minor fixes / Needs another pass]**

[2-4 sentences explaining the verdict. If "Ready with minor fixes," specify which fixes are required. If "Needs another pass," specify what kind of pass and which section(s) need it.]

---

### Corrected Version (if applicable)
[Full corrected text with all Critical and Standard fixes applied. Advisory suggestions are noted but not applied unless the user requests them.]
```

---

## Rules

1. **Never rubber-stamp.** Issuing a "Ready to publish" verdict without completing every checklist category is the single most damaging failure mode of a final readthrough. Even if the document appears excellent, every category must be explicitly checked and logged.

2. **Never scope-creep into structural editing.** If a section is weak, flag it as a finding with a severity level. Do not rewrite it. The scope of a final readthrough is identification and minor correction -- not developmental revision. Rewriting a section during a final readthrough changes the document in ways the author has not reviewed.

3. **Check proper nouns, technical terms, and names with extra deliberation.** Spellcheck and grammar tools do not catch misspelled proper nouns. "Descartes" misspelled as "Decartes" will pass every automated check. Read every proper noun as if seeing it for the first time.

4. **The re-read test is mandatory.** Any sentence you have to read twice to understand is a failure, regardless of grammatical correctness. A grammatically perfect sentence that requires re-reading is a clarity failure. Flag every re-read sentence.

5. **Severity determines presentation order.** Critical findings must appear at the top of the issues table, before Standard findings, before Advisory findings. Never bury a critical issue in a long list of minor ones.

6. **Apply only minimum necessary changes when fixing.** The fix for "fewer" vs. "less" is one word. The fix for a missing Oxford comma is one character. Do not rewrite the surrounding sentence. Scope-creep in fix application introduces new errors and violates the author's voice.

7. **The One Improvement must be about meaning or impact, not mechanics.** If the only finding is advisory in nature and the document is excellent, the One Improvement is still required -- it should address reader experience, persuasive effectiveness, or clarity, not a grammar preference.

8. **A final readthrough does not verify facts.** Do not confirm that statistics, dates, or external claims are accurate -- that is fact-checking. Do flag internal contradictions (the same number cited differently in two places) because that is a consistency check, not a fact check.

9. **Collaborative documents require an explicit seam check.** When a document has multiple authors, read across every section boundary looking for tone shifts, terminology changes, and formatting inconsistencies. These seams are where final-document errors concentrate.

10. **Commit to the verdict.** "Ready to publish" means publish now. "Ready with minor fixes" means publish after applying the listed fixes -- not after another full review cycle. "Needs another pass" means stop and fix before publishing. Use hedging language in the verdict only if there is a genuine reason the verdict depends on information you do not have (e.g., whether a specific style guide requires a specific format).

11. **Abbreviation scanning is non-optional.** Every abbreviation that appears in the document body must be traced to its first introduction. An abbreviation used before its expansion is a reader-experience failure. In documents with abstracts, the abbreviation must be introduced both in the abstract and again on first use in the body.

12. **The title and opening paragraph receive two passes.** These are the highest-visibility, highest-stakes locations in any document. An error in the title or opening paragraph is seen by 100% of readers. Errors in paragraph 12 are seen by a fraction. Check the title, subtitle, and opening paragraph twice -- once in the cold read and once in the checklist pass.

---

## Edge Cases

**The document that has not been edited at all:**
The user says "I wrote this and want a final check before I send it." You begin reading and find structural problems, extensive grammar errors, and unclear purpose. Do not proceed with a final readthrough. Stop after the cold read, note that the document needs substantive editing before a final readthrough would be productive, and recommend the appropriate prior skill (`structural-editing` if the organization is the primary problem, `copy-editing` if the sentence-level writing is the primary problem). Explain that a final readthrough on an unedited document produces a long list of issues that will all be altered during editing anyway -- it is not an efficient use of the step. Use a threshold of judgment: if more than one in five sentences would need substantive revision, the document is not ready for a final readthrough.

**The very short document (email, memo, social media post, executive summary):**
For documents under 300 words, calibrate the checklist to document type. Skip heading hierarchy checks for documents with no headings. Skip figure and table caption checks for documents with no figures or tables. But do not skip mechanics, tone, or clarity checks -- a two-sentence email with a grammar error or an ambiguous call to action is still a failed document. Apply the re-read test especially rigorously to short documents: a reader who must re-read a two-paragraph email has a significantly worse experience than a reader who must re-read one paragraph of a twenty-page report.

**The document with known issues the user is aware of:**
"I know section 4 is rough but just check the rest." Acknowledge the known issue, note it as a pre-existing flag in the issues table (marked clearly as user-acknowledged), and focus the readthrough on everything else. Do not spend the review on a section the author already plans to revise -- that is wasted effort and may produce findings that become obsolete after the revision. However, do flag if the known weak section affects the logical flow or creates a contradiction with another section, because those cross-document effects are within the readthrough scope even if the section itself is not.

**The collaborative document with multiple authors:**
Pay deliberate attention to section boundaries. The most common failure mode in collaborative documents is inconsistent terminology across sections -- each author uses their preferred term for the same concept. Identify all instances of the top five content terms and check for variant spellings, capitalizations, or alternative synonyms. Also check person and voice (some authors write "we" and others write "the organization"), tone register (some authors are formal and others are conversational), and list formatting conventions (some authors use terminal periods and others do not). These seam errors are often invisible to individual authors who only read their own sections.

**The document under a hard formatting constraint (journal submission, grant application, RFP response):**
Check hard constraints first, before anything else. Word count limits, section name requirements, mandated heading structures, required font sizes, and page limits are binary -- the document either meets them or it does not, and no amount of writing quality fixes a constraint violation. If the document violates a hard constraint, that is a Critical finding that immediately determines the verdict as "Needs another pass." Do not proceed to checklist items until the constraint status is established.

**The document that is genuinely excellent:**
Sometimes a well-written, carefully edited document passes every checklist item. Do not manufacture issues to justify the readthrough. Issue the "Ready to publish" verdict with confidence. The One Improvement section is still required -- use it to offer a genuinely valuable observation about how the document could be even stronger, framed as an optional enhancement. "The document is ready to publish. One optional enhancement: the fourth bullet in the key takeaways section is significantly longer than the other three -- trimming it to match the others in length would improve visual parallelism." This provides value without creating false urgency.

**The document with embedded tracked changes or revision marks:**
If the user provides a document still showing tracked changes or comment marks, do not perform the readthrough on the marked-up version. Ask the user to provide the accepted version (with all changes either accepted or rejected and all comments resolved). A readthrough on a tracked-changes document conflates editing-in-progress with final-state review and produces unreliable findings. The exception: if the user explicitly wants you to review the accepted state while the tracked changes are visible, confirm this explicitly before proceeding.

**The document where tone is appropriate but phrasing could cause unintended offense:**
During the embarrassment test, flag any phrase, metaphor, idiom, or example that could be misread, that relies on cultural knowledge that a portion of the audience may lack, or that uses language patterns now considered insensitive in the document's target context. Frame these as Advisory findings with a specific explanation of the risk and a specific alternative phrasing. Do not refuse to flag these -- and do not overstate them. The goal is to equip the author to make an informed choice, not to police language.

---

## Example

**User input:** "Please do a final readthrough of this white paper before we send it to the procurement committee tomorrow. It's been through one round of editing already."

**Document provided:** A 1,800-word white paper titled "Reducing Operational Costs Through Predictive Maintenance: A Framework for Mid-Size Manufacturers" with four sections: Executive Summary, The Cost of Reactive Maintenance, The Predictive Maintenance Framework, and Implementation Roadmap. The document targets a procurement committee with technical and financial stakeholders.

---

## Final Readthrough Report

**Document:** "Reducing Operational Costs Through Predictive Maintenance: A Framework for Mid-Size Manufacturers"
**Document Type:** White paper
**Destination:** Procurement committee (mixed technical and financial audience)
**Word Count:** Approximately 1,800 words
**Verdict:** Ready with minor fixes

---

### Checklist Results

#### A. Structural Integrity
| Check | Result | Notes |
|-------|--------|-------|
| Opening earns continued reading | ✓ | Executive summary opens with a concrete cost figure ($240,000 average annual unplanned downtime cost) -- immediately relevant to the audience |
| Core message stated explicitly | ✓ | Core argument is clear: predictive maintenance reduces costs by an average of 30% compared to reactive maintenance |
| All sections serve core message | ⚠ | The third paragraph of "The Cost of Reactive Maintenance" discusses supply chain disruption at length -- relevant but slightly tangential; could be one sentence instead of a full paragraph |
| Ending provides appropriate closure | ✗ | The Implementation Roadmap section ends with a bullet list and no closing paragraph -- the document stops rather than concludes |
| No internal contradictions | ✗ | The Executive Summary states "average ROI of 18 months"; the Implementation Roadmap states "ROI typically realized within 12-18 months" -- these are compatible but will read as inconsistent to a careful reader |

#### B. Mechanics
| Check | Result | Notes |
|-------|--------|-------|
| Spelling (including proper nouns and technical terms) | ✓ | All technical terms ("predictive maintenance," "SCADA," "CMMS") spelled consistently |
| Grammar (agreement, modifiers, pronouns) | ⚠ | One dangling modifier in Section 3, paragraph 2: "Analyzing sensor data in real time, equipment failure becomes predictable" -- the subject of "analyzing" must be the maintenance team, not "equipment failure" |
| Punctuation (commas, apostrophes, hyphens) | ⚠ | "Data driven" appears three times without hyphen as a compound modifier before a noun ("data driven approach") -- should be "data-driven approach" |
| Number formatting consistent | ✗ | Numbers below ten are sometimes spelled out ("three sensors") and sometimes written as numerals ("3 maintenance cycles") -- pick one convention and apply it throughout |
| Capitalization consistent | ⚠ | "Predictive Maintenance" is capitalized in Sections 1 and 2 (as if a proper noun) but lowercase in Sections 3 and 4 -- standardize to lowercase as a common noun |

#### C. Formatting and Visual Consistency
| Check | Result | Notes |
|-------|--------|-------|
| Heading hierarchy logical (H1 > H2 > H3) | ✓ | Hierarchy is clean throughout |
| List formatting consistent (punctuation, parallelism) | ⚠ | The Implementation Roadmap bullet list has inconsistent terminal punctuation -- three bullets end with periods, two do not |
| Spacing and visual rhythm consistent | ✓ | Consistent throughout |
| Tables / figures captioned and labeled correctly | ✓ | Figure 1 (cost comparison chart) is properly labeled and referenced in text |
| Links and references verified | ✓ | No hyperlinks in this document; no reference list required |

#### D. Terminological and Tonal Consistency
| Check | Result | Notes |
|-------|--------|-------|
| Key terms used consistently | ⚠ | "Condition-based monitoring" appears in Section 3 as an apparent synonym for "predictive maintenance" without being introduced as a related but distinct term -- this will confuse readers who know the field |
| Abbreviations introduced before use | ✗ | "CMMS" (Computerized Maintenance Management System) is used in Section 2 without introduction; it is introduced in Section 3 -- reverse the order or add introduction at first use in Section 2 |
| Tone register uniform throughout | ✓ | Consistent formal register throughout -- appropriate for procurement audience |
| Person and voice consistent | ✓ | "Organizations" and "manufacturers" used consistently; no person shifts |
| Tense logic consistent | ✓ | Findings in present tense; roadmap steps in future tense -- correct and consistent |

#### E. Reader Experience
| Check | Result | Notes |
|-------|--------|-------|
| No sentences requiring re-reading | ⚠ | One sentence in Section 3, paragraph 4 is 62 words long and requires re-reading to parse -- flag for potential simplification |
| Core message statable in one sentence | ✓ | "Predictive maintenance reduces unplanned downtime costs by an average of 30% and is achievable for mid-size manufacturers in 12-18 months." |
| No embarrassment-risk language | ✓ | No problematic phrasing identified |
| Document is defensible as submitted | ⚠ | With the CMMS abbreviation error and the ROI inconsistency corrected, yes -- as-is, a careful reader on the procurement committee will notice both |

---

### Issues Found

| # | Severity | Category | Location | Issue | Fix |
|---|----------|----------|----------|-------|-----|
| 1 | Critical | D -- Terminology | Section 2, paragraph 3 (first use of CMMS) | "CMMS" used without introduction -- reader encounters the abbreviation without knowing what it means | Change to "Computerized Maintenance Management System (CMMS)" at first use in Section 2; "CMMS" alone is then correct in all subsequent uses including Section 3 |
| 2 | Critical | A -- Structural Integrity | Executive Summary vs. Implementation Roadmap | "Average ROI of 18 months" (Exec Summary) vs. "ROI typically realized within 12-18 months" (Roadmap) -- two different figures for the same claim | Standardize to "ROI typically realized within 12-18 months" in both locations, or "average ROI realization of 15 months (range: 12-18 months)" if precision is preferred |
| 3 | Critical | A -- Structural Integrity | End of Implementation Roadmap section | Document ends on a bullet list with no closing paragraph -- abrupt stop | Add a 2-3 sentence closing paragraph that states the call to action (next step for the procurement committee) and reinforces the core value proposition |
| 4 | Standard | B -- Mechanics | Section 3, paragraph 2 | Dangling modifier: "Analyzing sensor data in real time, equipment failure becomes predictable" | Rewrite as: "By analyzing sensor data in real time, maintenance teams can predict equipment failure before it occurs" |
| 5 | Standard | B -- Mechanics | Sections 1, 2, 3 (three instances) | "Data driven approach" missing hyphen as compound modifier | Change all three instances to "data-driven approach" |
| 6 | Standard | B -- Mechanics | Document-wide | Number formatting inconsistent -- numerals and spelled-out numbers mixed for numbers below ten | Select one convention (recommend: spell out one through nine, numerals for 10 and above, which is standard in business writing) and apply consistently throughout. Seven instances require updating. |
| 7 | Standard | B/D | Sections 1 and 2 vs. Sections 3 and 4 | "Predictive Maintenance" capitalized in first half, lowercase in second half | Standardize to lowercase ("predictive maintenance") throughout -- it is a common noun describing a practice, not a trademarked product name |
| 8 | Standard | C -- Formatting | Implementation Roadmap bullet list | Three bullets end with periods; two do not | Add terminal periods to the two bullets lacking them; all five should end with periods as they are complete sentences |
| 9 | Advisory | D -- Terminology | Section 3 | "Condition-based monitoring" introduced without clarification of its relationship to "predictive maintenance" -- knowledgeable readers know these are related but distinct; less technical readers may be confused | Add a parenthetical: "condition-based monitoring (a core technique within predictive maintenance)" at first use |
| 10 | Advisory | E -- Reader Experience | Section 3, paragraph 4 | 62-word sentence beginning "When sensor arrays deployed across..." is difficult to parse on first read | Consider splitting into two sentences at the semicolon or restructuring the second clause as a separate sentence |

---

### One Improvement

The Implementation Roadmap section ends on a bullet list. For a white paper being sent to a procurement committee -- a group that must make a go/no-go decision -- the most important thing missing is a closing paragraph that tells the committee what to do next. A two-sentence close would do significant work: "Organizations ready to begin the transition to predictive maintenance can begin with a pilot program on one high-criticality asset line, typically requiring an initial investment of $15,000-$40,000. [Your company name] is prepared to facilitate a scoping conversation within two weeks of this document's receipt." This transforms the white paper from an informational document into an action-triggering one -- which is its actual purpose.

---

### Publication Verdict

**Ready with minor fixes.**

Seven Standard findings and two Critical findings are present. The Critical findings (the CMMS abbreviation, the ROI inconsistency, and the missing closing paragraph) must be resolved before sending -- a procurement committee reader who notices any of these will question the document's overall reliability. The Standard findings (dangling modifier, hyphenation, number formatting, capitalization, list punctuation) are each quick fixes. Total time to implement all required changes is estimated at 20-30 minutes. After applying the fixes listed above, the document is ready to send.

---

### Corrected Passages (Critical and Standard fixes)

**Section 2, paragraph 3 -- CMMS introduction:**
*Before:* "Tracking work orders and maintenance schedules in a CMMS allows organizations to..."
*After:* "Tracking work orders and maintenance schedules in a Computerized Maintenance Management System (CMMS) allows organizations to..."

**Executive Summary -- ROI statement:**
*Before:* "Organizations adopting predictive maintenance report an average ROI of 18 months."
*After:* "Organizations adopting predictive maintenance typically realize ROI within 12-18 months."

**Implementation Roadmap -- closing paragraph (add after final bullet):**
*Add:* "Predictive maintenance is not a wholesale transformation -- it is an incremental capability that mid-size manufacturers can deploy strategically, one asset line at a time. Organizations that begin with a pilot program in the next quarter are positioned to reduce unplanned downtime costs by the figures described in this framework within their first full fiscal year of implementation."

**Section 3, paragraph 2 -- dangling modifier:**
*Before:* "Analyzing sensor data in real time, equipment failure becomes predictable."
*After:* "By analyzing sensor data in real time, maintenance teams can predict equipment failure before it occurs."

**Number formatting -- representative corrections (apply convention throughout):**
*Before:* "3 maintenance cycles," "three sensors," "9 asset lines"
*After:* "three maintenance cycles," "three sensors," "nine asset lines" (all below ten: spell out)

*(All three instances of "data driven" corrected to "data-driven"; "Predictive Maintenance" standardized to "predictive maintenance" in Sections 1 and 2; bullet list terminal punctuation standardized to periods throughout the Implementation Roadmap.)*
