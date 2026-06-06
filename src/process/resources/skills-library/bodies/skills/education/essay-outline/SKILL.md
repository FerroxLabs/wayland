---
name: essay-outline
description: |
  Creates detailed essay outlines with thesis statements, topic sentences, evidence placeholders, and conclusion structure for learners planning academic essays. Produces a complete skeleton the learner can fill in -- distinct from writing skills that produce finished text.
  Use when a learner asks to outline an essay, plan an academic paper, structure their writing before drafting, or organize their arguments.
  Do NOT use for writing the full essay (use writing category skills), for research paper structure (use writing `research-paper-structure`), or for creative writing outlines (use writing category skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "academic-writing study-skills research step-by-step"
  category: "education"
  subcategory: "academic-skills"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Essay Outline

## When to Use

Use this skill when a learner needs a structural skeleton for an academic essay -- not finished prose, but a complete architectural plan they can execute independently.

**Trigger scenarios:**
- A learner says "I need to outline my essay on X" or "help me plan my argument before I start writing"
- A student has a prompt and knows the topic but cannot figure out how to structure or sequence their argument
- A learner has done research and collected notes/sources but cannot figure out how to organize them into a coherent argument
- A student asks for help with thesis development and needs to see how the thesis connects to supporting paragraphs before drafting
- A learner is revising a draft and needs to reverse-outline what they actually wrote to diagnose structural problems
- A student needs to submit an outline as a graded assignment before the essay is due
- A learner asks "how many paragraphs should I write" or "where does the counterargument go" -- structural planning questions that belong here

**Do NOT use when:**
- The learner wants finished essay prose written for them -- use writing category skills instead
- The request involves a research paper with literature review, methodology, and findings sections -- use `research-paper-structure` instead
- The user is writing a creative nonfiction, personal narrative, or memoir -- use writing category creative skills instead
- The assignment is a lab report, case study, or scientific report with IMRaD structure -- use writing category scientific report skills instead
- The learner needs help evaluating or improving a complete draft -- use writing category revision/feedback skills instead
- The user is an educator designing an essay assignment rubric -- use teaching subcategory skills instead
- The request is for a speech, presentation, or oral argument structure -- use communication category skills instead

---

## Process

### Step 1: Collect Essential Context Before Producing Anything

Never generate an outline without knowing these four things. If any are missing, ask directly before proceeding.

- **Prompt or topic:** Get the exact wording of the assignment prompt if one exists. The specific verbs in a prompt (analyze, argue, compare, evaluate, discuss) determine the essay type and the evidence strategy.
- **Essay type:** Determine whether the essay is argumentative (takes a debatable stance), analytical (examines how or why something works), expository (explains or informs), compare-contrast, or cause-effect. If the learner doesn't know, read the prompt together and identify the operative verb.
- **Target length:** Get the word count or page count. A 500-word essay has 3 body paragraphs at most; a 2,000-word essay supports 4-6. Length determines how many body paragraphs the outline should have and how much evidence each needs.
- **Available sources:** Ask whether the learner has sources already, is using course readings, needs to find sources, or is writing from personal knowledge. This determines whether evidence slots are filled or labeled as "find source for X."
- **Academic level and course context:** High school vs. undergraduate vs. graduate; English class vs. history vs. sociology. This affects the depth of analysis expected, the citation style required (MLA, APA, Chicago), and whether a counterargument section is expected.

Ask these as a single grouped request, not five separate questions, to respect the learner's time.

### Step 2: Identify the Essay Type and Its Structural Logic

Each essay type has a distinct internal logic that drives the outline structure. Apply the right logic before placing any content.

- **Argumentative:** Thesis must be debatable -- someone reasonable could disagree. Structure is claim-evidence-rebuttal. A counterargument section is mandatory. Place it in the second-to-last body paragraph position (after your strongest supporting argument) so you end on your strongest rebuttal, not the opposing view.
- **Analytical:** Thesis identifies a pattern, mechanism, technique, or significance -- not just a description. Each body paragraph analyzes one element and explains how it contributes to the whole. Evidence is textual or data-based; close reading and quotation integration are the primary tools.
- **Expository:** Thesis is a clear statement of fact or explanation, not an argument. Body paragraphs follow a logical sequence: chronological, spatial, or general-to-specific. No counterargument needed.
- **Compare-contrast:** Two structural options exist -- block structure (all of Subject A, then all of Subject B) vs. point-by-point (one criterion at a time across both subjects). Point-by-point is almost always superior for analytical depth; use block only if the subjects are so different they share few comparison points.
- **Cause-effect:** Distinguish whether the essay argues causes, effects, or both. A common error is mixing up causes and effects within the same paragraph. Map the causal chain explicitly in the outline before assigning paragraph slots.

### Step 3: Build the Thesis Statement First

The thesis is the load-bearing structure. Every paragraph in the outline must be traceable back to it. Build the thesis before anything else.

- A strong thesis has three components: a specific subject, a debatable or analytical claim about that subject, and a signal of the essay's scope or reasoning path.
- The "because" test: A thesis is strong if completing the sentence "This essay will argue X BECAUSE Y, Z, and W" produces the actual argument and maps naturally to three body paragraph topics.
- The "so what?" test: If someone could reasonably respond "of course, obviously" to the thesis, it is too weak. Push the claim further.
- For argumentative essays: The thesis should be falsifiable -- another writer using the same sources could reach a different conclusion.
- For analytical essays: The thesis should name the mechanism or technique being analyzed ("Toni Morrison uses fragmented chronology to mirror her characters' psychological trauma"), not just the topic.
- Avoid thesis statements that merely announce the essay's structure ("This essay will discuss three causes of the French Revolution"). This is a list, not an argument.
- If the learner cannot produce a thesis, offer 2-3 candidate thesis statements based on their topic and ask them to pick and refine one. Do not write the thesis for them without engagement.

### Step 4: Determine the Paragraph Count and Evidence Density

Use the target word count to calibrate the outline's scope before populating it.

- **500-600 words (typical 5-paragraph essay):** Introduction (~100 words) + 3 body paragraphs (~120 words each) + Conclusion (~80 words). Each body paragraph supports ONE piece of evidence with analysis. No room for counterargument unless it replaces one body paragraph.
- **800-1,000 words:** Introduction (~150 words) + 3-4 body paragraphs (~150-180 words each) + optional counterargument (~150 words) + Conclusion (~100 words).
- **1,500-2,000 words:** Introduction (~200 words) + 4-5 body paragraphs (~200-250 words each) + counterargument/rebuttal (~200 words) + Conclusion (~150 words). Each body paragraph can support 2 pieces of evidence with analysis.
- **2,500+ words:** Introduction (~250 words) + 5-6 body paragraphs (~300 words each) + counterargument (~250 words) + Conclusion (~200 words). Body paragraphs may have 2-3 evidence points each.
- Evidence density rule: Each piece of evidence must be followed by at least as many words of analysis as the evidence itself. A 50-word quotation needs 50+ words of analysis. At the outline stage, mark this explicitly so the learner knows to plan for it.

### Step 5: Populate Body Paragraphs Using the TEAC Structure

For each body paragraph, apply the TEAC structure: Topic sentence -- Evidence -- Analysis -- Connection.

- **Topic sentence:** One declarative sentence that states the paragraph's main claim and connects explicitly to the thesis. The topic sentence should be able to stand alone as a mini-thesis for the paragraph. Test: if you read only the topic sentences of the body paragraphs in sequence, can you follow the entire argument?
- **Evidence slots:** For each piece of evidence, label it by type (direct quotation, paraphrase, statistic, case example, historical event) and source. If the learner hasn't found a source yet, write "[Source needed: find X type of evidence showing Y]" so the research gap is explicit.
- **Analysis notes:** At the outline stage, write 1-2 sentences describing what the analysis should argue -- not the full analysis, but a directional note. Example: "Explain how this statistic shows correlation, not causation, which strengthens the nuanced version of the thesis."
- **Connection sentence:** A brief note on the transition logic to the next paragraph. Specify the relationship: addition (furthermore), contrast (however), causation (therefore), sequence (subsequently). Using "also" or "additionally" as the only transition strategy is a structural weakness -- vary the logical relationship.
- **Paragraph ordering logic:** Once all body paragraphs are drafted, arrange them using one of three ordering principles: (a) chronological/sequential for historical or process topics, (b) weakest-to-strongest for argumentative essays (end on the most compelling point), (c) thematic clusters when arguments are mutually reinforcing. Explain the ordering choice to the learner so they understand the logic, not just the order.

### Step 6: Design the Introduction and Conclusion Slots

Introductions and conclusions are the most frequently botched essay components. Treat them as requiring specific design choices, not boilerplate.

**Introduction design:**
- The hook must match the essay's tone. Academic essays rarely benefit from rhetorical questions as hooks (overused and often vague). Better hooks for academic writing: a counterintuitive statistic, a brief concrete scene that illustrates the problem, a provocative expert claim the essay will complicate, or a historical moment that crystallizes the issue.
- Context sentences (2-4 sentences) should narrow from broad to specific -- not from "since the beginning of time" (never use this) but from the relevant historical, disciplinary, or social context to the specific case the essay addresses.
- The thesis is always the last sentence of the introduction. Do not bury it in the middle.
- At the outline stage, mark the hook type the learner should aim for, but do not write the hook itself -- that is a drafting task.

**Conclusion design:**
- A conclusion that only restates the introduction fails. The conclusion should synthesize -- show how the body paragraphs together prove something larger than any single paragraph could.
- The "so what?" move is non-negotiable: the conclusion must state why the argument matters beyond the essay itself. This could be a policy implication, a call to further research, a connection to a broader pattern, or a reframing of the stakes.
- The final sentence should not trail off into vague generality. It should be the most memorable sentence in the essay -- connect back to the hook (circular structure), pose a forward-looking question, or make a precise, striking claim.

### Step 7: Run the Outline Through a Structural Integrity Check

Before delivering the outline, verify it against these five diagnostic questions:

1. **Thesis-paragraph alignment:** Do ALL body paragraph topic sentences directly support or develop the thesis? Any paragraph that doesn't connect should be cut or repositioned.
2. **Evidence coverage:** Is there at least one piece of identified (or researched) evidence for every body paragraph? An outline with empty evidence slots is a draft plan, not a usable outline.
3. **Logical flow:** Reading only the topic sentences in sequence -- does the argument build? Is there redundancy (two paragraphs making the same point)?
4. **Counterargument placement (argumentative only):** Is the counterargument followed immediately by a rebuttal with evidence? A counterargument without a rebuttal is an admission of weakness.
5. **Transition logic:** Is each inter-paragraph transition labeled with its logical relationship? Transitions should do logical work, not just announce movement.

---

## Output Format

Deliver the outline in the following structure. Fill every field with content specific to the learner's essay. Do not leave template placeholders.

```
## Essay Outline: [Full Working Title]

**Essay Type:** [Argumentative / Analytical / Expository / Compare-Contrast / Cause-Effect]
**Prompt (if provided):** [Exact prompt wording]
**Target Length:** [Word count] -- [Resulting paragraph count]
**Citation Style:** [MLA / APA / Chicago / None specified]
**Thesis Statement:** [One complete, arguable sentence]

---

### I. Introduction

- **Hook type:** [Statistic / Scene / Expert claim / Historical moment -- with brief description of what it should convey]
- **Context sentences (2-4):** [What background information narrows the reader to this specific argument -- list the ideas, not the prose]
- **Thesis (final sentence of intro):** [Exact thesis statement]

---

### II. Body Paragraph 1 -- [Keyword label for this argument]

- **Topic sentence:** [One sentence, directly supporting the thesis]
- **Logical role in argument:** [Why this paragraph comes FIRST -- e.g., "establishes the foundational condition that makes paragraphs 2 and 3 possible"]
- **Evidence 1:**
  - Type: [Direct quotation / Statistic / Case example / Historical event / Paraphrase]
  - Source: [Author, title, or "[Source needed: find X type of evidence demonstrating Y]"]
  - Analysis direction: [1-2 sentences: what should the analysis argue about this evidence?]
- **Evidence 2 (if word count supports it):**
  - Type: [...]
  - Source: [...]
  - Analysis direction: [...]
- **Transition to Paragraph 2:** [Logical relationship + bridging idea]

---

### III. Body Paragraph 2 -- [Keyword label for this argument]

- **Topic sentence:** [One sentence, directly supporting the thesis]
- **Logical role in argument:** [Why this paragraph comes SECOND]
- **Evidence 1:**
  - Type: [...]
  - Source: [...]
  - Analysis direction: [...]
- **Evidence 2 (if word count supports it):**
  - Type: [...]
  - Source: [...]
  - Analysis direction: [...]
- **Transition to Paragraph 3:** [Logical relationship + bridging idea]

---

### IV. Body Paragraph 3 -- [Keyword label for this argument]

- **Topic sentence:** [One sentence, directly supporting the thesis]
- **Logical role in argument:** [Why this paragraph comes THIRD / is the strongest supporting argument]
- **Evidence 1:**
  - Type: [...]
  - Source: [...]
  - Analysis direction: [...]
- **Transition to Counterargument or Conclusion:** [Logical relationship + bridging idea]

---

### V. Counterargument and Rebuttal [INCLUDE for argumentative essays; OMIT for analytical/expository]

- **Opposing claim:** [The strongest version of the argument against your thesis -- steelman it, do not strawman it]
- **Why this objection has merit:** [1-2 sentences acknowledging what is legitimate about the opposing view]
- **Rebuttal claim:** [One sentence: why your thesis holds despite this objection]
- **Rebuttal evidence:**
  - Type: [...]
  - Source: [...]
  - Analysis direction: [...]
- **Transition to Conclusion:** [...]

---

### VI. Conclusion

- **Thesis restatement:** [Rephrase the thesis in different words -- do not copy-paste]
- **Synthesis move:** [How do the body paragraphs together prove something larger? What pattern or truth emerges from their combination?]
- **"So what?" statement:** [Why does this argument matter beyond the essay -- broader implications, stakes, or call to action]
- **Final sentence strategy:** [Circular return to hook / Forward-looking question / Precise closing claim -- describe the approach]

---

### Paragraph Order Rationale

| Paragraph | Keyword Label | Ordering Logic |
|-----------|--------------|----------------|
| Body 1 | [Label] | [Why first] |
| Body 2 | [Label] | [Why second] |
| Body 3 | [Label] | [Why third] |
| Counterargument | [Label] | [Why here, not earlier/later] |

---

### Evidence Gap Tracker

| Paragraph | Evidence Needed | Source Status |
|-----------|----------------|---------------|
| Body 1 | [Description of evidence type needed] | [Found / In course readings / Needs research] |
| Body 2 | [Description] | [Status] |
| Body 3 | [Description] | [Status] |
| Counterargument | [Description] | [Status] |

---

### Structural Integrity Check

- [ ] Every body paragraph topic sentence explicitly connects to the thesis
- [ ] No two body paragraphs make the same argument (check for overlap)
- [ ] Reading topic sentences in sequence tells a coherent, building argument
- [ ] Every piece of evidence has an analysis direction (not just cited)
- [ ] Counterargument is followed by a rebuttal with evidence (argumentative only)
- [ ] Conclusion synthesizes rather than merely restates
- [ ] Transitions specify logical relationships, not just sequence

---

### When to Move to Drafting

This outline is ready for drafting when:
1. Every evidence slot has a source identified (not "[Source needed]")
2. You can explain each paragraph's topic sentence aloud without looking at notes
3. Reading the topic sentences in sequence makes a complete argument on its own
4. You can answer "so what?" for the essay as a whole in one sentence
```

---

## Rules

1. **Never generate the outline before collecting the essay type and target length.** These two variables determine the entire structure. Producing a generic 5-paragraph outline for a 2,500-word comparative essay is actively harmful.

2. **The thesis must be genuinely arguable before the outline is built around it.** If the learner's proposed thesis is a statement of fact ("World War I began in 1914"), refuse to outline around it and redirect to thesis development first. An outline built on a weak thesis produces a weak essay regardless of how good the structure is.

3. **Every body paragraph topic sentence must contain a controlling idea that directly extends the thesis.** Topic sentences like "Another reason is..." or "There are many factors..." are structural failures. Require specific, claim-bearing sentences.

4. **Evidence slots must specify type and source.** "Evidence: something about the economy" is not a usable evidence slot. Write "[Source needed: find economic data showing X trend from Y time period]" to make the research task explicit and actionable.

5. **Never place the counterargument as the first or last body paragraph.** First position gives it undue weight and can derail the essay's opening argument. Last position before the conclusion leaves the reader on the opposing view. The correct position is second-to-last, so the rebuttal is the freshest argument before the conclusion.

6. **Compare-contrast essays must declare their structural method (block vs. point-by-point) in the outline header.** A student who switches between methods mid-essay produces an incoherent structure. Decide and commit at the outline stage.

7. **Do not use the phrase "In conclusion" as the conclusion's opening move.** Flag this explicitly in the outline's conclusion section. Similarly, flag "since the dawn of time," "throughout history," and "Webster's dictionary defines X as..." as opening hook approaches to avoid.

8. **A conclusion that only restates the introduction fails the synthesis requirement.** At the outline stage, specify the synthesis move and the "so what?" argument separately. If the learner cannot articulate either, they need to deepen their thesis before drafting.

9. **For argumentative essays, steelman the counterargument -- do not allow a strawman.** If the opposing view in the outline is obviously weak or caricatured, the rebuttal earns no credit. The counterargument should represent the strongest honest version of the opposing position.

10. **Produce a transition logic label for every inter-paragraph connection.** Transitions must show the logical relationship between paragraphs (causation, contrast, addition, concession, sequence), not just signal movement. "Another point is..." signals nothing. "Because this condition exists, the following consequence becomes possible..." signals causation. Require this specificity at the outline stage so it is not patched in during drafting.

---

## Edge Cases

**The learner has a prompt but no thesis or argument yet.**
Do not skip to outline structure. Begin with thesis development as an embedded sub-task: present 2-3 candidate thesis statements based on the prompt, explain what makes each stronger or weaker, and ask the learner to choose and refine. Only after a working thesis is agreed upon does the outline proceed. An outline without a thesis is a list of topics, not an argument architecture.

**The learner has written a draft but wants an outline (reverse outlining).**
Shift to reverse-outline mode: extract the actual main claim of each paragraph as it was written, compare those claims to the stated thesis, and identify where the draft's structure diverges from the argument's logic. The output in this case is a diagnostic outline (what the draft actually argues) alongside a corrected outline (what it should argue), with a gap analysis. This is one of the most powerful revision tools available and should be framed as such.

**The assignment requires a specific structure mandated by the instructor (e.g., a required four-part body, mandatory section headings, or a forced compare-contrast format).**
Override default structural recommendations and follow the instructor's requirements exactly. Document any cases where the instructor's required structure conflicts with best-practice outline principles, and note them as "instructor-required departure" without suggesting the learner violate the assignment.

**The learner's topic is genuinely complex and resists a clean three-point thesis.**
Some topics support more than three body paragraphs legitimately. For essays above 1,500 words, a four- or five-point thesis is appropriate. Do not artificially compress four distinct arguments into three just to fit a conventional template. Instead, check whether any two of the planned paragraphs are making the same argument at different scales (a common cause of over-extended outlines) and consolidate only where genuine overlap exists.

**The learner is writing a compare-contrast essay and wants to use block structure.**
Block structure (all of A, then all of B) is rarely the strongest choice for analytical compare-contrast essays because it delays comparison until the reader must hold everything from the A-block in memory. Explain this trade-off. If the learner has a legitimate reason for block structure (the subjects are highly asymmetrical, or the instructor specified it), accommodate it -- but flag that the conclusion must do extra synthesis work to connect the blocks explicitly.

**The learner has too many arguments and does not know which to include.**
Apply the "direct thesis support" filter: ask for each proposed argument, "Does this paragraph prove the thesis, or does it provide interesting background context?" Background context paragraphs belong in the introduction's context sentences, not as body paragraphs. Any argument that only indirectly relates to the thesis should be cut. Then apply the "distinctiveness" filter: any two paragraphs making overlapping claims should be merged. Typically this process reduces an unwieldy 6-paragraph plan to a tight 3-4 paragraph structure.

**The learner needs to cite sources but hasn't done research yet.**
Produce the outline with labeled evidence gaps rather than pretending sources exist. For each evidence slot marked "[Source needed]," include a specific research prompt the learner can use to find the right type of evidence: "Find a peer-reviewed source from the last 10 years showing [specific claim or data type]." This bridges the outline to the research phase without conflating the two tasks.

**The essay is for a discipline with unconventional essay conventions (e.g., philosophy, law, fine arts criticism).**
Flag the disciplinary conventions that differ from standard academic essay structure. Philosophy essays often open with a precise statement of the argument's logical form before the thesis. Legal essays use IRAC (Issue-Rule-Application-Conclusion) structure at the paragraph level. Fine arts criticism may integrate close description before analysis. Adapt the body paragraph structure accordingly while maintaining the core thesis-evidence-analysis logic.

---

## Example

**Input from learner:** "I have to write a 1,200-word argumentative essay for my first-year sociology class on whether social media causes depression in teenagers. I haven't found sources yet but I think it does cause it. The essay is due in 4 days."

---

```
## Essay Outline: Does Social Media Cause Depression in Teenagers? A Critical Examination

**Essay Type:** Argumentative
**Prompt:** Evaluate whether social media use is a cause of depression in teenagers.
**Target Length:** 1,200 words -- 4 body paragraphs (including counterargument)
**Citation Style:** APA (standard for sociology)
**Thesis Statement:** While social media use correlates with depressive symptoms in teenagers,
the causal relationship is driven not by use itself but by specific mechanisms --
social comparison and sleep disruption -- that vary significantly by usage pattern,
meaning that targeted behavioral interventions are more effective than blanket restrictions.

---

### I. Introduction

- **Hook type:** Counterintuitive statistic -- the hook should note that despite dramatic
  increases in social media use since 2012, rates of severe depression among teenagers
  vary significantly by subgroup and usage type, complicating the simple "social media
  causes depression" narrative. (Find this statistic before drafting -- look for CDC or
  Pew Research data on adolescent mental health trends 2012-2023.)
- **Context sentences (2-4 ideas to develop):**
  1. Social media platforms became ubiquitous among U.S. teenagers after 2012, with
     smartphone adoption changing the nature of adolescent social life.
  2. Public discourse and some legislative responses treat social media as a clear
     causal threat to mental health.
  3. Sociological research complicates this picture by identifying specific mechanisms
     rather than a uniform effect.
- **Thesis (final sentence of intro):**
  "While social media use correlates with depressive symptoms in teenagers, the causal
  relationship is driven not by use itself but by specific mechanisms -- social comparison
  and sleep disruption -- that vary significantly by usage pattern, meaning that targeted
  behavioral interventions are more effective than blanket restrictions."

---

### II. Body Paragraph 1 -- Social Comparison as a Mechanistic Driver

- **Topic sentence:** "The primary mechanism linking social media to teenage depression is
  not passive exposure but active social comparison with idealized peer presentations,
  a process that disproportionately affects girls aged 14-17."
- **Logical role in argument:** This paragraph establishes the first and most empirically
  supported causal mechanism, setting up the nuance in the thesis that it is specific
  mechanisms -- not use itself -- that drive harm.
- **Evidence 1:**
  - Type: Peer-reviewed study with quantitative findings
  - Source: [Source needed: find a study on social comparison theory applied to
    social media use and depression in adolescent girls -- search for Twenge, Haidt,
    or Vogel in APA PsycINFO; target 2018-2023 publication window]
  - Analysis direction: Explain that the study's findings show correlation between
    upward social comparison (comparing oneself to people perceived as better-off)
    on image-heavy platforms and depressive symptom scores -- this supports the
    thesis's claim that mechanism matters more than raw usage time.
- **Evidence 2:**
  - Type: Data distinguishing passive vs. active use
  - Source: [Source needed: find research distinguishing passive scrolling from
    active posting in terms of mental health outcomes -- Verduyn et al. or similar]
  - Analysis direction: Note that active, communicative use shows weaker negative
    effects than passive consumption, which directly supports the thesis argument
    that "use" is too broad a category and behavioral pattern is what matters.
- **Transition to Paragraph 2:** "If social comparison explains the emotional dimension
  of the effect, a second physiological mechanism -- sleep disruption -- explains why
  heavy social media use compounds depressive vulnerability through a distinct pathway."

---

### III. Body Paragraph 2 -- Sleep Disruption as a Compounding Mechanism

- **Topic sentence:** "A second mechanism connecting social media to teenage depression
  is chronic sleep disruption caused by nighttime device use, which independently
  increases depressive risk and amplifies emotional reactivity to social stressors."
- **Logical role in argument:** This paragraph demonstrates that two distinct mechanisms
  operate simultaneously, supporting the thesis's "specific mechanisms" language and
  showing that the relationship is more complex than a simple cause-effect chain.
- **Evidence 1:**
  - Type: Sleep research with adolescent-specific data
  - Source: [Source needed: find research on adolescent sleep deprivation and
    depression correlation -- American Academy of Sleep Medicine or Journal of
    Adolescent Health; look for studies linking nighttime phone use specifically
    to reduced sleep duration in 13-18 age group]
  - Analysis direction: Show that sleep loss below 8 hours per night is independently
    associated with increased depressive symptom scores, and that this compounds
    the emotional vulnerability to social comparison effects identified in Paragraph 1.
- **Transition to Paragraph 3:** "Because these two mechanisms are behavioral and
  specific rather than inherent to social media itself, interventions that target
  particular usage patterns -- rather than blanket platform restrictions -- emerge
  as the more proportionate and evidence-based response."

---

### IV. Body Paragraph 3 -- Targeted Interventions Outperform Blanket Restrictions

- **Topic sentence:** "Behavioral interventions targeting social comparison exposure
  and nighttime use -- such as usage scheduling, platform curation, and 'phone-free
  bedroom' policies -- show stronger mental health outcomes than broad bans or
  time limits imposed without behavioral specificity."
- **Logical role in argument:** This is the thesis's strongest supporting point and
  the most directly practical. Placing it third (before the counterargument) means
  the essay reaches its affirmative peak before turning to address the opposing view,
  giving the rebuttal maximum credibility.
- **Evidence 1:**
  - Type: Intervention study or policy evaluation
  - Source: [Source needed: find a study or school-level policy evaluation showing
    outcomes of targeted social media interventions vs. blanket phone bans --
    search Journal of Adolescent Health or Pediatrics journal; also look for
    Australian or UK school phone ban outcome data from 2019-2023]
  - Analysis direction: Use this to argue that if blanket bans produced equivalent
    results, mechanism-specificity would be irrelevant -- the fact that targeted
    interventions outperform suggests the mechanism framing is not just academically
    interesting but practically important.
- **Transition to Counterargument:** "The most significant objection to this position
  is that the mechanisms themselves are inseparable from platform design, making
  individual behavioral interventions insufficient without structural change to the
  platforms."

---

### V. Counterargument and Rebuttal -- Platform Design as Root Cause

- **Opposing claim:** "Critics argue that social comparison and sleep disruption are not
  accidental byproducts of social media but are deliberately engineered features --
  infinite scroll, algorithmic amplification of emotionally provocative content, and
  notification systems -- making individual behavioral interventions insufficient
  without platform-level structural reform."
- **Why this objection has merit:** This is a legitimate and well-supported position.
  Scholars like Shoshana Zuboff on surveillance capitalism and the internal Facebook
  research on Instagram's effects on girls (leaked in 2021) provide serious empirical
  grounding for the view that harm is architecturally embedded. Do not dismiss this.
- **Rebuttal claim:** "While platform design does amplify harmful mechanisms, a solely
  structural critique overlooks the documented effectiveness of individual and family-
  level interventions in the near term, and the two approaches are complementary
  rather than mutually exclusive."
- **Rebuttal evidence:**
  - Type: Research showing individual-level intervention efficacy alongside acknowledgment
    of platform responsibility
  - Source: [Source needed: find a source that argues for multi-level intervention --
    both individual behavioral change AND platform regulation -- this might be a
    public health framework or policy paper; American Psychological Association
    reports or JAMA Pediatrics would be strong options]
  - Analysis direction: Use this to argue that the thesis's focus on mechanism-specific
    behavioral interventions does not deny structural critique -- it addresses what is
    actionable for individuals and families now, while systemic reform operates on a
    longer horizon.
- **Transition to Conclusion:** "Taken together, the evidence for two distinct causal
  mechanisms and the relative effectiveness of targeted responses points toward a
  more precise and practically actionable understanding of social media's role in
  teenage depression."

---

### VI. Conclusion

- **Thesis restatement:** "Social media does not cause depression in teenagers through
  its mere existence, but specific, identifiable mechanisms -- social comparison and
  sleep disruption -- create measurable risk, particularly under heavy passive use
  and nighttime exposure."
- **Synthesis move:** The three body paragraphs together establish that mechanism
  specificity is not an academic abstraction but a practical tool -- once you know
  which behaviors drive harm, you can design interventions that address them. The
  counterargument reinforces rather than undermines this by showing that platform
  design amplifies the same mechanisms, making the mechanisms the appropriate
  unit of analysis at every level.
- **"So what?" statement:** If policymakers, parents, and platforms continue framing
  the issue as "social media: yes or no," they will continue missing the behavioral
  specificity that the evidence actually supports. The stakes are adolescent mental
  health policy, school technology decisions, and individual family practice.
- **Final sentence strategy:** Circular return to the hook's statistic -- if the
  opening noted variation in depression rates despite uniform social media access,
  the closing should assert that this variation is explained by the mechanisms
  identified, and that understanding the variation is the first step toward
  addressing it effectively.

---

### Paragraph Order Rationale

| Paragraph | Keyword Label | Ordering Logic |
|-----------|--------------|----------------|
| Body 1 | Social Comparison | First because it is the most studied and empirically robust mechanism -- establishes the core of the causal argument |
| Body 2 | Sleep Disruption | Second because it adds a distinct (physiological) causal pathway, building complexity without repeating Body 1 |
| Body 3 | Targeted Interventions | Third (strongest position) because it is the practical payoff of the mechanistic argument -- the "so what" of the first two paragraphs |
| Counterargument | Platform Design | Second-to-last because it represents the strongest genuine challenge and must be followed immediately by the rebuttal |

---

### Evidence Gap Tracker

| Paragraph | Evidence Needed | Source Status |
|-----------|----------------|---------------|
| Hook | CDC or Pew data on adolescent depression trends 2012-2023 | Needs research |
| Body 1 (E1) | Quantitative study on social comparison and depression in adolescent girls | Needs research -- Twenge/Haidt/Vogel are likely candidates |
| Body 1 (E2) | Passive vs. active use and mental health outcomes | Needs research -- Verduyn et al. is likely |
| Body 2 | Nighttime phone use and adolescent sleep/depression link | Needs research |
| Body 3 | Targeted intervention outcomes vs. blanket ban outcomes | Needs research -- school phone ban data is promising |
| Counterargument | Multi-level intervention framework acknowledging both individual and structural factors | Needs research -- APA or JAMA Pediatrics likely |

---

### Structural Integrity Check

- [x] Every body paragraph topic sentence explicitly connects to the thesis
- [x] No two body paragraphs make the same argument (social comparison ≠ sleep disruption ≠ interventions)
- [x] Reading topic sentences in sequence tells a coherent, building argument
- [x] Every evidence slot has a research direction (not just "find a source")
- [x] Counterargument is steelmanned (platform design critique is legitimate) and followed by rebuttal with evidence
- [x] Conclusion synthesizes (explains why mechanism specificity matters at policy level) rather than merely restates
- [x] All transitions specify logical relationships (causation, contrast, sequence)

---

### Research Priority Order (given 4-day timeline)

1. **First (today):** Body Paragraph 1, Evidence 1 -- This is the thesis's load-bearing evidence. If this study is weaker than expected, the thesis may need adjustment before you draft anything else.
2. **Second (today):** Body Paragraph 2 evidence -- Sleep research is well-documented; this should be quick.
3. **Third (Day 2):** Body Paragraph 3 intervention evidence -- May require more searching; allow extra time.
4. **Fourth (Day 2):** Hook statistic and counterargument source -- These are important but can be refined during drafting.
5. **Draft (Day 3):** With all evidence in hand, drafting from this outline should take 2-3 hours.
6. **Revise (Day 4):** Read topic sentences alone first to check argument flow, then check evidence-to-analysis ratio in each paragraph.

### When to Move to Drafting

This outline is ready for drafting when:
1. All "[Source needed]" slots have a specific source with author, title, and year
2. You can explain each paragraph's topic sentence aloud without looking at notes
3. Reading the topic sentences in sequence makes a complete argument: comparison mechanism -- sleep mechanism -- targeted interventions work -- platform design objection is valid but complementary -- conclusion
4. You can answer "so what?" in one sentence: "Mechanism-specific thinking produces better mental health policy than blanket restrictions."
```
