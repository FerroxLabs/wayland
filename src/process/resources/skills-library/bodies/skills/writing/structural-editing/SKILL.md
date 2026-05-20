---
name: structural-editing
description: |
  Performs structural (developmental) editing on documents, producing an editorial memo with assessment and a restructured outline showing proposed reorganization, reordering, and section changes.
  Use when the user asks for structural editing, developmental editing, document reorganization, or help with the overall structure and flow of a piece.
  Do NOT use for line-level editing (use copy-editing), proofreading (use proofreading), or tone changes (use tone-adjustment).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "editing writing guide"
  category: "writing"
  subcategory: "editing-refinement"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Structural Editing

## When to Use

**Use this skill when:**
- The user explicitly requests structural editing, developmental editing, document reorganization, or an editorial assessment of their draft
- The user says the document "doesn't work," "rambles," "loses the reader," "doesn't land," or "feels disorganized" without being able to pinpoint why
- The user has a complete or near-complete draft that needs to be evaluated at the architecture level -- the problem is the blueprint, not the brickwork
- The user needs to understand whether their argument, narrative, or informational sequence is serving their audience and purpose before investing in line-level polish
- The user is preparing a high-stakes document (grant proposal, white paper, book proposal, long-form article, academic chapter, business case) and wants a professional-grade editorial assessment before submission
- The user has received vague rejection feedback from an editor or publisher ("the structure isn't quite right") and needs help diagnosing what that means concretely
- The user is working with a document that has been assembled from multiple sources, contributors, or previous drafts and now needs coherence imposed

**Do NOT use this skill when:**
- The user needs sentence-level grammar, clarity, or style improvements -- use `copy-editing` instead
- The user needs error correction: spelling, punctuation, subject-verb agreement -- use `proofreading` instead
- The user needs the voice or register adjusted (formal to conversational, passive to active) -- use `tone-adjustment` instead
- The user specifically needs to cut length or hit a word count target -- use `conciseness-editing` instead, though recommend a structural pass first if the bloat is architectural
- The user has only an outline or idea, not a draft -- use `outline-development` instead; structural editing requires actual text to assess
- The document is under 200 words and is a single-function unit (email, abstract, tweet thread) -- structural concerns at that scale collapse into sentence-level decisions; use `copy-editing` instead
- The user needs help with citations, sourcing, or factual accuracy -- use `research-review` instead
- The user needs formatting or visual design advice -- use `document-design` instead

---

## Process

### Step 1: Establish the Document's Governing Purpose and Audience

Before touching the draft, lock in the evaluative frame. All structural judgments are relative to purpose and audience -- what counts as a structural flaw in a news article is a structural feature in a legal brief.

- Ask these questions, or infer from context if the document makes the answers clear: What is the document trying to accomplish (inform, persuade, instruct, narrate, propose, inspire action)? Who is the primary reader, and what do they already know? What does the reader need to be able to do, believe, or feel after finishing?
- Identify the document type precisely: argumentative essay, how-to guide, case study, white paper, narrative feature, academic paper (and which sub-genre: empirical, theoretical, review), business proposal, personal essay, book chapter, or long-form journalism. Each has canonical structural conventions that the document either honors or deliberately violates -- and both can be valid, but violations must be purposeful.
- Determine the publication or submission context if stated (journal, magazine, internal memo, conference proceedings, general audience blog) because context governs expectations. A Nature Methods paper has a mandatory IMRaD structure; a Substack post does not.
- If the user has not specified purpose or audience, ask before proceeding. Structural editing without this frame produces advice that may be wrong for the actual reader.

### Step 2: Map the Existing Architecture

Read the entire document once without annotating, to register the reading experience as a first-time reader would. Then read it again to map its actual structure.

- Produce a reverse outline: a stripped-down summary of what each section, subsection, and major paragraph actually does (not what it claims to do or what the author intended). A section titled "Background" may actually function as an argument for urgency -- the real function determines structural analysis.
- For each unit, record: the unit label (if it has one), its word count or proportional weight, its actual function (context-setting, argument, evidence, counterargument, transition, conclusion, recapitulation, digression), and whether it is load-bearing (the document cannot make sense without it) or decorative.
- Identify the document's current structural model: Is it using a pyramid structure (conclusion first, then support)? An inverted pyramid? A problem-solution frame? A chronological narrative? A listicle with parallel structures? A Socratic Q&A? Knowing the implicit model reveals whether the document is failing to execute its chosen structure or is using the wrong structure for its purpose.
- Note the proportional weight of each major section as a percentage of total length. Disproportionate sections (a "methodology" that is 60% of a persuasion piece) are a diagnostic signal.
- Map information dependencies: which sections require the reader to have read another section to make sense. Mapping these dependencies reveals whether information is introduced in the right sequence.

### Step 3: Diagnose Structural Problems Against a Taxonomy

Use a systematic taxonomy of structural failure modes. Identify every problem that applies, then triage by severity.

- **Front-loading failure:** The document buries its thesis, central claim, or most compelling hook. Threshold: if the reader must read past 15% of the document before understanding what it is about, the opening structure is failing. In journalism this is called "burying the lede"; in academic writing it is called a "delayed thesis"; in business writing it is called "throat-clearing."
- **Payoff sequencing error:** The document's most valuable content (the insight, the recommendation, the twist, the surprising finding) appears too late. A corollary: setup sections are proportionally too long relative to the payoff sections they are preparing the reader for.
- **Missing scaffolding:** Arguments or narratives make logical jumps without the transitions, definitions, or contextual sections that would allow the reader to follow. The author has invisible knowledge the reader lacks.
- **Orphaned sections:** Content that is internally coherent but does not connect to the document's central purpose or argument. Often the result of research or drafting that was interesting to the author but is not doing work for the reader.
- **Redundancy without progression:** The same point is made in multiple sections, but without building, deepening, or complicating it each time. Repetition is a structural flaw; deliberate recapitulation with new framing is not.
- **Structural contradiction:** The document's explicit claims about its structure (signposted in the introduction) do not match what the document actually delivers. "This paper argues X, Y, and Z" but only X and Y appear, or they appear in a different order.
- **Pacing asymmetry:** Minor points receive disproportionate development; major points are underdeveloped. A rule of thumb: if any supporting point receives more than 20% of the document's total length, it is likely crowding out the central argument.
- **Weak anchors:** The opening and/or closing sections do not perform their essential functions. An opening must orient, hook, and promise; a closing must resolve, synthesize, and release. A document that trails off ("In conclusion, this paper has shown...") without synthesizing is structurally unresolved.
- **Frame/content mismatch:** The structural genre the document is performing (e.g., a how-to guide) is wrong for the content or audience. A piece that contains a complex argument but is structured as a listicle will fail both as a listicle (the points require too much setup) and as an argument (the structure fragments the logic).
- **Scope creep in structural form:** The document has multiple centers -- it is trying to be two or three different documents, none of which is fully developed.

### Step 4: Apply Structural Remedies and Generate Recommendations

For each diagnosed problem, develop a specific, implementable recommendation. Structural editing is advisory, not executive -- the editor identifies and prescribes, the author executes.

- For each recommendation, specify the exact action in one of eight categories: **Move** (reposition a section or passage), **Cut** (remove without replacement), **Expand** (develop an existing section further), **Compress** (reduce without cutting the content entirely), **Merge** (combine two sections into one), **Split** (divide one section into two discrete units), **Add** (create new content to fill a gap), or **Reframe** (keep the content but change its function or framing -- e.g., turn a narrative section into a numbered framework).
- Anchor every recommendation to a reader-experience rationale: "Move Section 3 before Section 1 because the reader needs to understand the problem before the solution will register." This frames the edit in terms of the reading experience, not the editor's aesthetic preference.
- When recommending cuts, name specifically what is being lost and acknowledge whether it has value in a different context. Authors are more likely to implement cuts when the editor respects the content's merit.
- When recommending additions, be specific about what kind of content is needed (a concrete example, a definition of the key term, a counterargument acknowledgment, a transition sentence that names the logical connection). "Add a transition here" is insufficient; "Add a sentence that names the contrast between X and Y before the paragraph that introduces Y" is actionable.
- Check recommendations for internal consistency: do not recommend moving a section earlier if that section depends on information introduced later. Map dependencies before finalizing recommendations.

### Step 5: Produce the Restructured Outline with Comparison

Present the current structure and the proposed structure in a format that allows the author to see both at once and understand the transformation being proposed.

- The reverse outline produced in Step 2 becomes the "Current Structure" column. Each row is one discrete structural unit (section, subsection, or major movement), described by its actual function, not just its label.
- The proposed structure shows the new sequence with the action taken (Move, Cut, Expand, etc.) and a brief rationale for each change.
- Mark load-bearing elements explicitly so the author understands which changes are essential versus optional refinements.
- Indicate approximate target word count or proportional weight for major sections in the proposed structure when the current proportions are significantly wrong.

### Step 6: Write the Editorial Memo

The editorial memo is the primary deliverable. It must be specific, prioritized, and actionable.

- Open with an overall assessment of 2-4 sentences that does three things: acknowledges genuine strengths (this is not courtesy -- it orients the author to what is working and therefore what not to accidentally dismantle), names the central structural problem, and states the single highest-impact change.
- Present the structural diagnosis section by section, using the taxonomy from Step 3. For each problem: name it, cite the specific section or passage where it occurs, describe the reader experience it produces, and state the recommended fix.
- Present a priority-ranked list of recommendations. The ranking criterion is impact on the document's ability to achieve its purpose -- not ease of implementation. Easy and low-impact should rank below difficult and high-impact.
- Limit the total number of major structural recommendations to 5-7. More than 7 signals that the document may need a fundamentally different approach -- if that is the case, say so directly and offer to help the author develop a new architecture rather than patch the existing one.
- Close with a "next steps" sequence: structural changes first, then copy editing, then proofreading. Remind the author that copy-editing text that will be moved or cut is wasted effort.

### Step 7: Offer a Demonstration Pass

After delivering the memo, offer to demonstrate one specific recommendation in action.

- Select the highest-impact or most complex recommendation for the demo -- the one the author is most likely to misunderstand or under-execute.
- Show the "before" (the relevant passage in its current position and form) and the "after" (the passage moved, reframed, or restructured, with minimal rewriting).
- Explicitly label what changed structurally versus what you chose not to touch at the line level. The demo must not become a covert copy edit.
- Offer to do the same for any other recommendation the author wants to see modeled.

### What Bad Output Looks Like

- **The covert line edit:** Rewriting sentences and paragraphs while calling it structural editing. If the output contains substantial new prose that did not exist in the original, the skill has been misapplied.
- **The vague assessment:** "The structure could be tightened" or "the flow is a bit uneven" without specifying which sections, what the structural mechanism of the problem is, and what the fix would be.
- **The everything-is-wrong memo:** A list of 15 structural problems with equal priority weighting. This overwhelms the author and signals that the editor has not done the analytical work of distinguishing major from minor structural issues.
- **The phantom recommendation:** Advising the author to "restructure the argument" without specifying how -- leaving the author with the original problem plus the added confusion of vague feedback.
- **The structural recommendation that ignores content:** Recommending that the conclusion come first without acknowledging that this requires a brief setup for the reader to understand the conclusion -- the structural change must be complete, not just a repositioning command.
- **The false encouragement:** Telling the author the structure is basically fine when it is not, because the document contains good sentences. Good sentences in bad architecture is still bad architecture.

---

## Output Format

```
## Structural Edit: Editorial Memo

**Document:** [Title or working title]
**Document Type:** [Essay / White paper / Blog post / Book chapter / Academic paper / etc.]
**Purpose:** [Inferred or stated purpose in one phrase]
**Audience:** [Inferred or stated primary reader]
**Current Word Count:** [Approximate]
**Structural Model Identified:** [Inverted pyramid / Problem-solution / Narrative arc / IMRaD / Listicle / Chronological / etc.]

---

### Overall Assessment

[2-4 sentences. Acknowledge the strongest element of the document. Name the central structural problem. State the single highest-impact structural change that would most improve the document's effectiveness.]

---

### Structural Diagnosis

**Problem 1: [Name the structural failure mode]**
Location: [Section name, paragraph range, or approximate position in the document]
Issue: [Specific description of what is happening structurally, with evidence from the text]
Reader impact: [What the reader experiences as a result -- confusion, disengagement, failure to understand a key concept, etc.]
Recommendation: [Specific action -- Move / Cut / Expand / Compress / Merge / Split / Add / Reframe -- with precise instruction]

**Problem 2: [Name the structural failure mode]**
Location: [Section / passage]
Issue: [Description]
Reader impact: [Effect]
Recommendation: [Action]

[Continue for all major structural problems, up to 7 total]

---

### Current vs. Proposed Structure

| # | Current Section | Function (Actual) | Word Weight | Proposed Action | Rationale |
|---|----------------|-------------------|-------------|-----------------|-----------|
| 1 | [Section name/label] | [Real function] | [~XX% or ~XXX words] | Keep | [Why it stays] |
| 2 | [Section name/label] | [Real function] | [~XX%] | Move to position 4 | [Reader-experience rationale] |
| 3 | [Section name/label] | [Real function] | [~XX%] | Cut | [Why it does not serve the document] |
| 4 | [Section name/label] | [Real function] | [~XX%] | Expand + Reframe as [new framing] | [What is missing and why it matters] |
| 5 | [Section name/label] | [Real function] | [~XX%] | Merge with Section 6 | [Why they are doing the same work] |
| — | [New section] | [Needed function] | [~XX% target] | Add | [What gap it fills and what it should contain] |

---

### Priority Ranking

1. [Highest-impact recommendation] -- [One sentence on why this is the first priority: reader experience effect if done vs. not done]
2. [Second-highest recommendation] -- [Rationale]
3. [Third recommendation] -- [Rationale]
4. [Fourth recommendation] -- [Rationale]
5. [Fifth recommendation if applicable] -- [Rationale]

---

### Proposed Outline (Post-Restructure)

1. [New section 1 title/function] (~[word count target])
   - [Key content that should appear here]
   - [Transition function: what it should set up for section 2]

2. [New section 2 title/function] (~[word count target])
   - [Key content]
   - [Transition function]

[Continue through all proposed sections]

---

### Next Steps

**Sequence:**
1. Implement structural changes per the recommendations above
2. Re-read the restructured draft end-to-end before any line-level work
3. Copy edit the revised draft (sentence clarity, concision, style)
4. Proofread final draft (errors, formatting, citations)

**Optional demonstration:** [Name the specific recommendation the AI offers to demonstrate with a before/after example]
```

---

## Rules

1. **Never rewrite content during structural editing.** The deliverable is diagnosis and recommendation, not a revised draft. If a passage must move, describe where it should go -- do not rewrite it to fit the new location. The moment the output contains substantial new prose, the skill has shifted from structural editing to ghostwriting without the author's instruction.

2. **Anchor every diagnosis to a specific location in the text.** "The introduction is weak" is not structural editing. "The introduction (paragraphs 1-3, approximately 300 words) spends 70% of its length establishing historical context the reader does not need before they understand the thesis -- the thesis does not appear until paragraph 4" is structural editing.

3. **Anchor every recommendation to a reader-experience rationale.** Structural changes are not aesthetic preferences -- they are argued positions about what the reader needs and when. Every recommendation must explain why the current arrangement fails the reader and how the proposed arrangement serves them better.

4. **Apply the 15% threshold for front-loading failure.** If the document's central claim, thesis, or primary hook does not appear within the first 15% of the document, diagnose this as a front-loading problem unless there is a documented genre reason for delayed thesis (certain legal arguments, mystery narratives, and Socratic essays deliberately delay the claim -- this must be purposeful and effective, not accidental).

5. **Apply the 20% pacing asymmetry threshold.** If any single supporting element (a single piece of evidence, a background section, a methodology explanation) occupies more than 20% of the document's total length, flag this as a pacing asymmetry problem unless the document's purpose is specifically to develop that element (e.g., a methodology paper).

6. **Never recommend more than 7 major structural changes.** If the document has more than 7 distinct structural problems, identify the 5-7 that are most load-bearing and note that additional refinement may be needed after the primary changes are implemented. A memo with 15 recommendations is an overwhelming failure of editorial prioritization.

7. **When recommending a cut, name what is lost and where it might belong.** Authors implement cuts more readily when the editor acknowledges the value of the excised content and suggests that it may belong in a different document, an appendix, a follow-up piece, or a footnote. "Cut Section 2 because it is off-topic" is less actionable than "Cut Section 2 from this piece -- the historical background it provides would serve well as a prefatory note or a separate companion piece, but it is delaying the argument here by approximately 400 words."

8. **Identify and protect load-bearing elements explicitly.** Some structural elements that appear redundant or misplaced are actually doing essential work -- they are the only place a key term is defined, or the only place the reader is given permission to question the central claim. Before recommending that any section be cut or significantly compressed, confirm it is not load-bearing in a way that would leave a gap if removed.

9. **The editorial memo must not contradict itself.** Before finalizing recommendations, check that no recommendation undermines another. Moving Section 3 before Section 1 while also recommending that Section 1 be expanded with content from Section 3 is a contradictory instruction set. Map the dependency chain before finalizing.

10. **If the structure is fundamentally sound, say so explicitly.** Not every document needs restructuring. If the architecture is serving the document's purpose well and the problems are at the sentence or paragraph level, say this clearly: "The overall structure of this document is sound. The problems I am observing are at the paragraph and sentence level and are better addressed by a copy-editing pass. I recommend proceeding with copy editing rather than structural reorganization." This is more useful than fabricating structural problems to justify the skill.

---

## Edge Cases

**The document has no discernible structure.** Some drafts are genuinely unorganized -- they contain ideas, research, and observations that have not yet been shaped into any intentional sequence. Do not perform structural editing on these. Instead, use the content to build a proposed architecture from scratch: identify the document's implied purpose from what is present, cluster the content into logical groups, and propose a structural model with a brief rationale. Present this as a "structural proposal" rather than an editorial memo, and note that the author will need to reorganize the draft against this proposed framework before a proper structural edit can assess the result.

**The user wants structural editing and copy editing in the same pass.** Explain the sequencing problem clearly: copy editing text that will be moved, merged, or cut is wasted effort, and copy editing text in its current position may make the author more reluctant to move it (the sunk cost of polished prose). Complete the structural edit, ask the author to implement the structural changes, and then proceed to copy editing on the revised draft. If the user insists on a combined pass, do the structural edit first and flag any passages that have been targeted for structural change so the copy edit can skip them.

**The document has a mandatory structure the author cannot change.** Academic papers in certain disciplines (empirical science: IMRaD; legal briefs: statement of facts, argument, conclusion), grant proposals, and some regulatory filings have prescribed structural formats. In these cases, structural editing shifts from "what structure should this document use" to "is the document executing the required structure correctly and effectively." Diagnose failures to execute the prescribed structure, underdeveloped required sections, and content appearing in the wrong required section. Do not recommend deviations from the mandatory format.

**The user is emotionally attached to content that needs to be cut.** This is the most common implementation failure in structural editing. Never use the word "delete." Instead: offer "move to a separate document for future use," "hold in reserve for a follow-up piece," "relocate to an appendix where it is available to interested readers without interrupting the main argument." Frame cuts as editorial decisions about this document's purpose, not as judgments on the quality of the excised content. Acknowledge explicitly that the passage may be well-written and interesting while explaining why it does not serve this document's specific goal.

**The document has multiple authors or has been assembled from multiple sources.** Documents assembled from contributor submissions, inherited from a previous author, or compiled from research notes often have structural problems that are artifacts of their composition process rather than reasoning failures. These typically manifest as: redundant coverage of the same topic from different angles without integration, inconsistent abstraction level (some sections are detailed, others are high-level summaries), and orphaned sections that served a purpose in an earlier version but no longer connect. When diagnosing these, note that the structural problems are compositional rather than argumentative -- the author's task is integration and selection, not reconceiving the argument.

**The document is a creative work (fiction, narrative nonfiction, personal essay).** Structural editing of creative work uses a different vocabulary but the same analytical framework. Replace "thesis" with "central tension or question." Replace "argument" with "narrative arc." Replace "sections" with "scenes, chapters, or movements." Replace "transitions" with "scene breaks, chapter endings, and narrative bridges." The diagnostic taxonomy still applies: delayed hook (front-loading failure), scenes that do not advance the central tension (orphaned sections), overlong backstory before the inciting incident (pacing asymmetry), unresolved emotional question at the end (weak anchor). The editorial memo format remains the same; only the domain vocabulary shifts.

**The document is very short (200-700 words) but structurally problematic.** Structural editing at short scale focuses on: the opening sentence's ability to orient and hook the reader, the document's internal paragraph sequence and whether each paragraph earns its position, the closing paragraph's ability to provide resolution or synthesis, and the information hierarchy within paragraphs (topic sentences, supporting detail, and transition must be in the right order). The full editorial memo format still applies, but the "sections" in the comparison table may be individual paragraphs rather than major sections. Note to the author that at this scale, structural and paragraph-level editing overlap significantly.

**The user receives the memo and disagrees with the diagnosis.** Do not capitulate to author preference if the structural diagnosis is sound, but do engage with the disagreement seriously. Ask the author to articulate what they believe the section is doing for the reader -- sometimes authors have structural intentions that did not survive execution, and sometimes the editor has misread the document's purpose or audience. If the author's explanation reveals a genuine misread, revise the diagnosis. If the author's explanation is about attachment to the content rather than a structural argument, hold the diagnosis and explain the reader-experience evidence again.

---

## Example

**Input:** "Here's a draft white paper I wrote on supply chain resilience for a manufacturing industry audience. I feel like it's not convincing anyone -- we keep getting feedback that it's 'interesting but not actionable.' Can you do a structural edit?"

**[Assume the provided document has the following structure and characteristics: Introduction (850 words, 17% of draft) covering global supply chain history since WWII; Section 1 "Why Supply Chains Break" (1,100 words) covering disruption categories with academic citations; Section 2 "Case Studies" (1,400 words) with three case studies of supply chain failures at large companies; Section 3 "Resilience Strategies" (600 words) listing five strategies in brief bullet form; Section 4 "The Cost of Inaction" (700 words) covering financial risk of not acting; Conclusion (350 words) summarizing the history and reiterating the problem. Total: ~5,000 words.]**

**Output:**

---

## Structural Edit: Editorial Memo

**Document:** Supply Chain Resilience White Paper (working title)
**Document Type:** Industry white paper
**Purpose:** Persuade manufacturing executives to invest in supply chain resilience measures
**Audience:** Senior operations and procurement leaders in manufacturing
**Current Word Count:** ~5,000 words
**Structural Model Identified:** Background-heavy academic argument (problem-focused, evidence-stacked, solution-light)

---

### Overall Assessment

This white paper is thorough, well-researched, and correctly identifies genuine problems -- but it is structured as an academic literature review when its purpose is executive persuasion. The document's most critical failure is that the Resilience Strategies section (Section 3), which is the only section that directly serves the reader's need for actionable guidance, receives less than 12% of the document's total length and is presented as a bulleted list with no implementation detail. The single highest-impact change is to expand and reposition the resilience framework as the document's centerpiece, with the case studies repositioned to support each strategy rather than to stand independently as a problem catalog. This structural inversion -- from "here is everything that can go wrong" to "here is how to protect yourself, illustrated by what happens when you don't" -- is the difference between an interesting document and an actionable one.

---

### Structural Diagnosis

**Problem 1: Front-loading failure / Delayed payoff**
Location: Introduction (850 words, paragraphs 1-7)
Issue: The introduction spends 850 words -- 17% of the document -- on the history of global supply chain development from the postwar era through the 2000s. This is context the target audience (senior operations and procurement leaders) already possesses. The document's core claim -- that manufacturing companies need to invest in specific resilience measures now -- does not appear until the final paragraph of the introduction.
Reader impact: A manufacturing executive opening this white paper already knows supply chains are complex and vulnerable. Spending the first 850 words telling them what they already know signals that the document is not calibrated to their level, and most will skim or abandon before reaching the actionable content.
Recommendation: Cut the historical overview entirely (approximately 600 words) and replace with an opening that presents the central business case in the first 150-200 words: what is the financial exposure, what does resilience investment cost, and what is the return. Consider opening with the most striking financial figure from Section 4 ("The Cost of Inaction") -- move the most compelling quantified risk stat to the document's first paragraph.

**Problem 2: Misallocated weight / Pacing asymmetry**
Location: Section 3 "Resilience Strategies" (600 words, ~12% of the document)
Issue: The strategies section -- the only section that tells the reader what to do -- receives 600 words across five bullet points, with no implementation detail, no guidance on prioritization, no cost or resource implications, and no connection to the case studies that precede it. By contrast, the problem documentation (Introduction + Section 1 + Section 2) receives 3,350 words, or 67% of the document.
Reader impact: The reader who persists through 3,350 words of problem framing reaches the solution section and finds five bullet points. This produces the "interesting but not actionable" feedback the author has received. The document has a 67% / 12% problem-to-solution ratio; it should be closer to 40% / 45%.
Recommendation: Expand Section 3 to 2,000-2,200 words. For each of the five strategies, provide: a one-paragraph explanation of what the strategy involves operationally, a 2-3 sentence note on typical implementation cost or resource requirement, one concrete example (drawn from the existing case studies or new material), and a signal for when this strategy should be prioritized. Reframe the five strategies from a bullet list into a numbered, titled framework with a memorable name.

**Problem 3: Case studies functioning as problem documentation rather than solution evidence**
Location: Section 2 "Case Studies" (1,400 words)
Issue: The three case studies document supply chain failures in detail but do not connect to the strategies in Section 3. They function as additional problem evidence rather than as illustrations of what resilience looks like in practice. One case study (Company B's semiconductor shortage response) actually demonstrates a successful resilience strategy, but this is not framed as a positive model -- it is presented as a disruption case like the other two.
Reader impact: The reader processes three failure stories in a row and concludes that supply chains are fragile and companies suffer when they break. This reinforces the problem without pointing toward the solution. The positive case study's insight is buried.
Recommendation: Restructure the case studies section as an integrated element of the expanded strategies section. Pull the relevant case detail from each case study to illustrate specific strategies. Company B's positive example should become a "what resilience looks like" exemplar under whichever strategy it illustrates. The case studies no longer need their own standalone section -- they become evidence within the framework.

**Problem 4: Conclusion recapitulates the problem, not the solution**
Location: Conclusion (350 words)
Issue: The conclusion summarizes the supply chain disruption history and reiterates the severity of the risk. It does not summarize the recommended strategies, does not give the reader a specific next action, and does not include any call to action or contact/engagement hook that white papers for business development typically require.
Reader impact: A reader who has made it to the conclusion is primed for decision-making. A conclusion that cycles back to the problem instead of crystallizing the solution and providing a clear next step releases the reader's decision energy without directing it anywhere.
Recommendation: Rewrite the conclusion as a 200-word executive synthesis: the five strategies in a single consolidated sentence each, the central business case restatement (investment cost vs. risk exposure), and a specific recommended first step the reader can take (e.g., a supply chain risk audit framework, a conversation to schedule, a diagnostic checklist -- whatever is appropriate for the document's business context). Remove the historical recapitulation entirely.

**Problem 5: "Cost of Inaction" section sequencing**
Location: Section 4 "The Cost of Inaction" (700 words, currently second-to-last)
Issue: The financial risk quantification -- the most compelling material for an executive audience -- appears at position 4 of 5, after the reader has already been presented with the strategies. This is the reverse of the optimal persuasion sequence for a business audience: executives need to understand financial exposure before they will engage with solution detail.
Reader impact: By the time the reader reaches the financial risk data, they may have already decided the document is not actionable and disengaged.
Recommendation: Move Section 4 material to the opening. Integrate the key financial risk figures into the new introduction. The detailed breakdown can remain as a standalone section, but positioned as Section 1 (immediately after the new, shorter introduction) so the business case is established before the strategies are presented.

---

### Current vs. Proposed Structure

| # | Current Section | Function (Actual) | Word Weight | Proposed Action | Rationale |
|---|----------------|-------------------|-------------|-----------------|-----------|
| 1 | Introduction | Historical context (supply chains since WWII) | ~850 words / 17% | Cut 600 words; reframe as business case hook | Audience already has this context; document must earn attention immediately with financial stakes |
| 2 | Section 1: "Why Supply Chains Break" | Problem taxonomy with academic citations | ~1,100 words / 22% | Compress to 400-500 words; move to position 3 | Useful context but should follow the business case, not precede it; compress by removing academic citation chains not needed for executive audience |
| 3 | Section 2: Case Studies | Problem documentation (three failure stories) | ~1,400 words / 28% | Restructure and distribute -- integrate into expanded strategies section as evidence per strategy | Case studies serve solution illustration, not problem documentation; reposition as evidence for each strategy |
| 4 | Section 3: Resilience Strategies | Solution (five bullets) | ~600 words / 12% | Major expansion to ~2,200 words; reframe as named framework; move to position 2 or 3 | This is the document's core value; it is critically underdeveloped |
| 5 | Section 4: Cost of Inaction | Financial risk quantification | ~700 words / 14% | Move to position 1 (early in document, after new hook) | Business case must be established before solutions are presented |
| 6 | Conclusion | Problem recapitulation | ~350 words / 7% | Rewrite as solution synthesis + call to action | Conclusion must crystallize the recommendation and direct reader action |

---

### Priority Ranking

1. **Expand Section 3 (Resilience Strategies) from 600 to 2,000+ words with implementation detail** -- This is the only change that directly addresses the "interesting but not actionable" feedback. Everything else is sequencing; this is substance. Without this change, no amount of restructuring will make the document actionable.

2. **Move the Cost of Inaction material to the front of the document** -- Executive audiences make reading decisions based on financial stakes. Establishing the business case in the first 200 words will hold the audience through the rest of the document.

3. **Redistribute the case studies as evidence within the strategies section** -- Case studies without strategy context are horror stories. Strategy without case study evidence is ungrounded. Integrating them makes both more persuasive.

4. **Cut the historical introduction and replace with a 200-word business case opening** -- Eliminates the front-loading problem and respects the audience's existing knowledge level.

5. **Rewrite the conclusion as an executive synthesis with a call to action** -- Converts the conclusion from a backward-looking summary into a forward-looking decision prompt.

---

### Proposed Outline (Post-Restructure)

1. **Opening: The Business Case** (~250 words)
   - Lead with the most striking financial risk figure (from current Section 4)
   - One-sentence statement of the document's central claim: specific resilience investments that deliver measurable protection against quantified risk
   - Brief statement of what the document will provide: a five-strategy framework with implementation guidance
   - Transition: sets up the reader to evaluate the strategies against the risk profile

2. **The Risk Landscape** (~500 words, compressed from current Section 4 + Section 1)
   - Disruption categories (compressed from current Section 1)
   - Financial exposure quantification (from current Section 4)
   - Transition: "Given this exposure, here is what resilience actually looks like in practice"

3. **The Five-Strategy Resilience Framework** (~2,200 words, expanded from current Section 3 + integrated case study material)
   - Framework introduction: what resilience means operationally, not conceptually
   - Strategy 1: [title] -- explanation, cost/resource note, case study integration, prioritization signal
   - Strategy 2: [title] -- same structure
   - Strategy 3: [title] -- same structure
   - Strategy 4: [title] -- same structure
   - Strategy 5: [title] -- same structure, featuring Company B's positive exemplar as the closing illustration
   - Transition: "The companies that have implemented these strategies demonstrate a consistent pattern..."

4. **Conclusion: What to Do Next** (~200 words)
   - Five strategies crystallized in one sentence each
   - Investment vs. risk exposure restated in one sentence
   - Specific recommended first action for the reader
   - Engagement hook appropriate to the document's business purpose

---

### Next Steps

**Sequence:**
1. Implement the major structural changes -- expand Section 3, reposition the financial risk material, redistribute the case studies, rewrite the introduction and conclusion
2. Re-read the restructured draft end-to-end before any line-level work to confirm the new sequence reads coherently
3. Proceed to copy editing on the revised draft for sentence clarity, concision, and executive register
4. Proofread the final version for errors, citation formatting, and visual layout

**Optional demonstration:** I can show you a before/after for the opening restructure -- taking the current 850-word historical introduction and converting it to a 200-word business case hook using content already present in the document. This will demonstrate the tone and level of specificity the new opening requires without requiring you to draft from scratch. Would you like to see that?
