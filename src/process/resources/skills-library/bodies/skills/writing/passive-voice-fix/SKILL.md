---
name: passive-voice-fix
description: |
  Identifies and converts passive voice constructions to active voice where appropriate, preserving passive voice when it serves clarity, diplomacy, or emphasis. Shows each conversion with rationale.
  Use when the user asks to fix passive voice, make writing more direct, convert passive to active, or strengthen weak verb constructions.
  Do NOT use for general editing (use copy-editing), conciseness work (use conciseness-editing), or tone adjustment (use tone-adjustment).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "editing writing troubleshooting"
  category: "writing"
  subcategory: "editing-refinement"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Passive Voice Fix

## When to Use

**Use this skill when:**
- The user explicitly asks to "fix passive voice," "make writing more active," "convert passive to active," or "remove passive constructions"
- The user says their writing "feels weak," "lacks energy," "sounds bureaucratic," or "feels distant" -- passive voice overuse is a primary cause of all four
- The user shares a piece that has a clearly elevated passive rate (above 20--25% of sentences for general prose, above 15% for marketing or persuasive writing)
- The user asks why a specific sentence "doesn't land" or "sounds off" and the root cause is a passive construction burying the agent
- The user is preparing writing for a specific audience (executives, customers, journalists) and needs active, assertive prose
- The user asks to identify "zombie nouns" or nominalized verbs -- these frequently co-occur with passive constructions and are within scope
- The user shares academic or business writing and asks which sections could be "punched up" without changing the professional tone

**Do NOT use this skill when:**
- The user wants comprehensive line editing beyond voice construction -- use `copy-editing` instead
- The user wants to reduce overall word count -- many passive constructions are longer, but systematic conciseness work belongs in `conciseness-editing`
- The user wants a tone shift (e.g., more formal, warmer, more authoritative) that goes beyond active/passive conversion -- use `tone-adjustment`
- The user wants to improve sentence-level clarity through restructuring, not just voice conversion -- use `clarity-editing`
- The user is asking about passive voice in code comments, code documentation, or API references -- these follow different conventions outside this skill's scope
- The user only has one or two sentences -- a full passive voice audit is disproportionate; just fix it inline and briefly explain why
- The user is asking a grammar question about passive voice rather than asking for editing help -- answer the grammar question directly without invoking the full audit framework

## Process

### Step 1: Classify the Document Type Before Touching a Word

Before scanning for passive constructions, identify what kind of document you are working with. This determines acceptable passive voice thresholds and which sections are off-limits for conversion.

- **General business prose** (emails, memos, reports): Target below 15% passive rate; active voice is strongly preferred
- **Marketing and persuasive copy** (ads, landing pages, pitches): Target below 10%; active voice is almost always better; passive feels corporate and weak
- **Academic writing** (papers, theses, literature reviews): 25--40% passive is normal; focus conversions on introductions, discussions, and conclusions; leave methods sections alone
- **Scientific writing** (research papers, lab reports): Methods sections use passive by convention ("Samples were centrifuged at 3,000 rpm for 10 minutes"); results sections increasingly permit active; introductions and discussions should lean active
- **Legal and regulatory text** (contracts, compliance documents, policies): Passive is often structurally required for precision; convert only with explicit caution and flag every change for legal review
- **Journalistic writing** (news, features): Industry standard targets below 5% passive; active voice is a core journalistic convention
- **Technical documentation** (manuals, procedures, user guides): Procedural steps should nearly always be active and imperative ("Click the button," not "The button should be clicked"); background sections may use more passive
- Note the document type at the top of your output so the user understands why some passives are kept

### Step 2: Scan Systematically for All Five Passive Construction Types

Do not rely on surface-level pattern matching. Scan for all five types and flag each one before evaluating:

- **Standard passive with stated agent:** "The report was written by the team" -- be + past participle + by + agent. This is the easiest to spot and convert. Conversion is usually straightforward: identify agent, promote it to subject.
- **Agentless passive (truncated passive):** "Mistakes were made" -- be + past participle with no by-phrase. This is the most politically charged type. The agent may be omitted intentionally (diplomacy, blame avoidance) or carelessly (the author forgot who did the thing). Treat these differently based on context.
- **Progressive passive:** "The code is being reviewed" or "The budget was being finalized" -- be + being + past participle. Often signals ongoing institutional process. Common in corporate writing.
- **Passive infinitive:** "The documents need to be signed" or "The form is required to be submitted" -- infinitive form of be + past participle. Frequently appears in procedural writing. Often the most awkward and easiest to convert.
- **Nominalized passive (hidden passive):** "A decision was made," "An announcement was issued," "Approval was given" -- these are passive constructions dressed up as noun phrases. The verb has been converted to a noun ("decided" becomes "a decision was made"). These are the most damaging to prose energy because they hide the passive structure behind abstraction. Flag these explicitly as "hidden passive."
- For each instance found, record: sentence number, construction type, the passive phrase itself, and whether an agent is stated, implied, or unknown.

### Step 3: Apply the Four-Question Evaluation Framework

For every passive instance, answer these four questions in sequence before assigning a Convert / Keep / Optional verdict:

1. **Is an agent available?** If no agent is stated or can be reasonably inferred from immediate context, converting to active voice is impossible without inventing information. Mark as Keep (agentless) or flag for author input.
2. **Does the agent matter to the reader?** "The bridge was built in 1923" -- does the reader care who built it? If no, keeping passive is defensible. "The contract was signed by the CFO" -- if accountability matters, the agent absolutely matters and active voice is better.
3. **Is the receiver the topic?** Passive voice naturally puts the receiver in the subject position, which is useful when the receiver is what the sentence is about. "The patient was given a 20mg dose" keeps the patient as the sentence's topic, which is appropriate in a medical record focused on patient treatment. If the topic is the agent, convert.
4. **Does active voice create an awkward or longer sentence?** Some passive constructions convert elegantly; others produce tortured syntax. "The award was given to the employee who had been with the company longest" converts to "The company gave the award to the employee who had been there longest" -- marginally better but not dramatically so. "Passive optional" is the right call here.

Assign each instance one of three verdicts:
- **Convert** -- active voice is clearly better; convert and explain why
- **Keep** -- passive serves a specific purpose; leave it and explain why
- **Optional** -- either works; present the active version and let the author choose

### Step 4: Perform the Conversions

For each instance marked Convert or Optional, execute the conversion using these specific techniques:

- **Standard agent promotion:** Move the by-phrase agent to subject position, make the verb active. "The memo was distributed by the director" → "The director distributed the memo." Always verify the converted sentence has exactly the same truth conditions as the original.
- **Agentless recovery from context:** If the agent is missing from the passive sentence but is clearly established in the surrounding paragraph, surface it. "The budget was cut by 15%" -- if the previous sentence established "The finance committee reviewed costs," then "The finance committee cut the budget by 15%" is a valid recovery.
- **Hidden passive reconstruction:** Nominalized passives require a two-step conversion: first identify the buried verb, then reconstruct the sentence with that verb in active form. "A determination was made to halt production" → identify buried verb: "determine" → reconstruct: "Management determined to halt production" or "The team determined that production should halt."
- **Passive infinitive resolution:** "The form needs to be completed by applicants" → "Applicants must complete the form." In procedural contexts, consider imperative mood: "Complete the form before submitting."
- **Verify meaning preservation:** After every conversion, read both versions side by side and confirm: same facts, same emphasis on the right element, no new implications introduced. Active voice can accidentally shift emphasis or imply causation that the passive avoided.
- **Check for awkward pronoun cascades:** Converting a passive can create a string of identical pronouns. "The report was reviewed and then it was approved" → "The committee reviewed the report and then approved it" is fine. But sometimes repeated subject pronouns become monotonous -- adjust sentence structure slightly if needed.

### Step 5: Calculate Metrics Before and After

Provide concrete numbers so the user can see the impact of the changes:

- **Passive instance count:** Total number of passive constructions found (all five types)
- **Sentence count:** Total number of sentences in the document
- **Passive sentence rate:** Percentage of sentences that contain at least one passive construction (this is the most meaningful metric -- a sentence with three passive constructions still counts as one passive sentence)
- **Passive instance rate:** Total passive instances divided by total sentences (can exceed 100% if a sentence has multiple passives)
- **Converted count:** How many were changed to active
- **Kept count:** How many were deliberately left passive
- **Optional count:** How many were flagged as author's choice
- Report before and after rates for both the passive sentence rate and passive instance rate

### Step 6: Reconstruct the Full Revised Document

Do not just provide a table of changes -- always deliver the full revised text:

- Apply all Convert verdicts to produce the revised draft
- Leave all Keep verdicts unchanged in the revised draft
- For Optional verdicts, apply the active version in the revised draft but annotate it with "[Optional -- passive also acceptable]" so the author can revert easily
- Ensure the revised text reads as coherent prose -- sometimes converting adjacent sentences to active voice creates monotonous subject-verb-object rhythm; if this happens, vary sentence structure slightly without changing meaning
- Do not introduce any new edits beyond passive voice conversion -- this skill has narrow scope; flag any other issues you notice in a brief separate note at the end

### Step 7: Deliver the Pattern Analysis

Every passive voice report should end with a diagnostic insight specific to this author's document, not generic grammar advice:

- Identify which passive type dominates (e.g., "Most of your passives are hidden passives -- nominalized verbs buried in noun phrases")
- Identify contextual triggers (e.g., "Passive voice clusters around sections where you describe actions taken by management -- this suggests intentional institutional distancing")
- Provide the "by zombies" test as a self-check tool: if you can insert "by zombies" after the verb and the sentence remains grammatically valid, it is passive ("The report was written [by zombies]" ✓ passive; "Zombies wrote the report" -- "by zombies" insertion makes no sense ✗ active)
- Provide a document-specific heuristic: e.g., "In this document, any time you write 'was [verb]ed' in reference to a company action, ask yourself: which specific person or team did this? If you know, name them."
- Note if the passive voice pattern reveals something about the author's relationship to the content (hedging, uncertainty, blame avoidance, institutional deference)

### Step 8: Flag Adjacent Issues Without Scope Creep

Passive voice often travels with companion problems. Note them briefly without fixing them:

- **Zombie nouns (nominalizations):** "provide assistance" instead of "help"; "make a decision" instead of "decide"; "conduct an investigation" instead of "investigate" -- flag but note these belong in `conciseness-editing`
- **Weak linking verbs:** Overuse of "is," "are," "was," "were" in non-passive constructions still weakens prose -- flag but note this belongs in `clarity-editing`
- **Hedging qualifiers that compound passive weakness:** "It may be noted that the results were found to be..." -- flag but note this belongs in `tone-adjustment`
- Keep this section brief (3--5 bullet points maximum) and always direct the user to the appropriate skill for follow-up work

## Output Format

```
## Passive Voice Audit -- [Document Title or Description]

**Document type:** [General business prose / Academic / Scientific / Legal / Marketing / Technical / Journalistic]
**Acceptable passive threshold for this document type:** [X%]

### Metrics

| Metric | Before | After |
|--------|--------|-------|
| Total sentences | [n] | [n] |
| Sentences with passive constructions | [n] ([X]%) | [n] ([X]%) |
| Total passive instances | [n] | [n] |
| Passive instance rate | [X]% | [X]% |
| Converted to active | -- | [n] |
| Kept as passive | -- | [n] |
| Flagged as optional | -- | [n] |

### Passive Voice Instances

| # | Type | Original (Passive) | Revised (Active) | Verdict | Rationale |
|---|------|--------------------|------------------|---------|-----------|
| 1 | [Standard / Agentless / Progressive / Passive infinitive / Hidden passive] | [exact passive phrase in context] | [active version] | Convert | [specific reason active is better here] |
| 2 | [type] | [exact passive phrase] | [kept as-is] | Keep | [specific reason passive serves a purpose here] |
| 3 | [type] | [exact passive phrase] | [active version -- author's choice] | Optional | [why either works; what each version emphasizes] |

### Revised Document

[Full revised text with all Convert verdicts applied, all Keep verdicts unchanged, Optional verdicts shown in active with "[Optional]" annotation]

### Pattern Analysis

**Dominant passive type:** [Which of the five types appears most often and why this matters]
**Contextual trigger:** [What topics or situations seem to trigger passive voice in this specific document]
**Self-check heuristic:** [A specific, document-tailored rule the author can apply going forward]
**By-zombies test reminder:** "The report was approved [by zombies]" ✓ -- if "by zombies" fits grammatically, it is passive.

### Adjacent Issues (Out of Scope)
- [Issue 1] -- address with [skill name]
- [Issue 2] -- address with [skill name]
```

## Rules

1. **Never convert passive voice blindly.** Every instance must pass the four-question evaluation framework (agent available? agent matters? receiver is topic? active version is cleaner?) before conversion. Blanket conversion is the most common and most damaging error in passive voice editing.

2. **Never invent an agent.** If the passive is agentless and no agent can be confidently inferred from the immediate surrounding context, do not supply one. Flag the instance as "Agent unknown -- author must specify" and leave the passive in place rather than fabricating accountability.

3. **Never convert scientific methods section passives.** "Samples were incubated," "Data were collected," "Participants were randomly assigned" -- these are standard scientific register and should be left completely alone. Converting them marks you as unfamiliar with the genre.

4. **Never create a more awkward sentence in the name of active voice.** Active voice is not inherently superior to passive voice -- it is superior when it produces cleaner, clearer, more natural prose. If the active version is tortured, longer, or harder to read, keep the passive and note that it is appropriate here.

5. **Always note document type upfront.** The acceptable passive rate for a methods section is 60--80%; for a marketing email it is under 10%. Without document type classification, every other judgment is unmoored.

6. **Always present all five passive construction types.** Missing hidden passives (nominalizations) is the most common failure mode. "A determination was reached," "An assessment was conducted," "A recommendation was provided" are all passive constructions that a surface-level scan will miss.

7. **Always provide before-and-after metrics.** The passive sentence rate and passive instance rate must both be reported before and after conversion so the user can see quantified impact. Qualitative description alone is insufficient.

8. **Always deliver the full revised document.** A table of changes without a revised draft forces the author to manually integrate the edits. Always provide the complete, ready-to-use revised text.

9. **Flag agentless passives explicitly.** "Mistakes were made" is not just passive voice -- it is a deliberate or careless agent suppression. Flag every agentless passive with a note about whether the agent suppression appears intentional (diplomacy) or careless (the author simply didn't specify). This is one of the highest-value insights this skill delivers.

10. **Never scope-creep into other editing domains.** This skill is narrowly scoped to active/passive voice conversion. Do not restructure sentences for reasons unrelated to voice, do not cut filler words, do not change tone, do not fix grammar errors beyond the voice conversion itself. Note everything else you see, but fix only passive voice constructions.

11. **Apply the 40% rule.** If more than 40% of sentences contain passive constructions, the document has a systemic passive voice habit that likely stems from writing process (drafting in institutional voice, uncertainty about ownership, genre imitation). Call this out explicitly and note that it warrants attention beyond line edits -- the author's drafting process needs adjustment.

12. **Treat political passives with explicit care.** "Errors were found in the submission," "The decision was made at a senior level," "Concerns have been noted" -- these agentless passives are often deliberately chosen to avoid assigning blame or attributing decisions. Before converting them, ask whether the user wants to surface agents or maintain diplomatic distance. Never make this choice unilaterally in a sensitive organizational document.

## Edge Cases

**Case 1: Scientific or academic writing with heavy passive throughout**
Methods sections use passive voice as a disciplinary convention -- do not touch them. Results sections are transitioning in many fields toward active voice ("We observed," "Our analysis revealed"), so flag passive results sentences as Optional with a note that active is increasingly accepted. Introductions and discussions should lean active and are the primary conversion targets. When handling academic writing, always note the journal's style guide if the user has mentioned it -- many journals specify their passive voice preferences explicitly. If the overall document is above 35% passive, focus the audit on introduction and discussion sections only, and explain to the user why methods passives are out of scope.

**Case 2: Legal and compliance documents**
Legal passive voice often encodes specific obligations independent of actor identity. "The applicant shall be notified within 30 days" emphasizes the obligation and the timeline, not who notifies. "The penalty will be assessed" is deliberately agentless because the enforcing party may vary by circumstance. In legal writing, flag every potential conversion and add a blanket disclaimer: "Every change to a legal document should be reviewed by a qualified legal professional before use." Convert only where the user explicitly confirms the document is a draft or internal working document, not a finalized legal instrument.

**Case 3: User says "remove ALL passive voice" or "no passive voice at all"**
This instruction reflects a common but mistaken belief that passive voice is always wrong. Do not comply mechanically. Explain that some passive voice is grammatically necessary (when the agent is genuinely unknown), stylistically appropriate (scientific conventions, diplomatic contexts), or structurally superior (when the receiver is the topic). Offer to convert every instance where active voice is clearly better, flag all Keep instances with explanation, and let the user make the final call on each. If the user insists after the explanation, execute all conversions but add a brief note for any case where the conversion creates an inferior sentence.

**Case 4: Document has very low passive voice (below 10%)**
If the passive rate is already low, call this out immediately before doing any detailed work. A document at 8% passive voice rate likely does not need passive voice editing at all -- the few instances remaining are probably appropriate kept passives. Confirm with the user whether they still want the audit. If they do, complete it, but frame the finding as "your passive voice usage is already well-controlled."

**Case 5: Passive voice appears to signal the author's uncertainty**
Some authors unconsciously shift to passive voice when they are less confident in a claim. "It has been suggested that..." is hedging through passive. "It was found that results were inconclusive" is double-passive hedging. If you notice that passive constructions cluster around specific claims while the rest of the document is active, flag this pattern to the user. It may reveal that the author needs to either strengthen those claims with evidence or explicitly acknowledge their tentativeness -- neither of which is a passive voice fix, but both of which the author needs to know.

**Case 6: Mixed passive patterns in a single document**
If a document switches between active and passive seemingly at random, this often signals collaborative authorship (different writers with different habits) or a rushed draft. Note the inconsistency explicitly. Do not just convert passives in isolation -- flag that the document's overall voice is inconsistent and recommend a full pass after passive voice corrections to check for register consistency. This is not scope creep; it is a necessary observation about what the user will encounter after applying the fixes.

**Case 7: Passive voice in direct quotations**
Never convert passive voice inside direct quotations. If the user's text includes a quoted source using passive voice, mark it as Keep (quoted material) and do not touch it. If the user is paraphrasing a source, the paraphrase is fair game. Distinguish clearly between direct quotation and paraphrase in the audit.

**Case 8: Passive voice in headings and titles**
Passive headings ("Results Were Significant," "Budget Was Approved") are unusual and almost always convert cleanly to active or nominalized forms ("Significant Results," "Board Approves Budget"). Flag passive voice in headings separately from body text -- these are high-visibility locations where active or nominalized constructions almost always serve better.

## Example

**User input:** "Can you fix the passive voice in this? It's a project update email to the executive team. 'The Q3 product roadmap has been reviewed by the engineering and product teams. Several timeline adjustments were required due to resource constraints that were identified during the sprint reviews. A decision was made to deprioritize the mobile checkout feature until Q4. Customers will be impacted by this change, and a communication plan has been drafted. Approval is needed from the VP of Product before the plan can be distributed. The revised roadmap will be shared with all stakeholders by end of week.'"

---

## Passive Voice Audit -- Q3 Product Update Email

**Document type:** Business prose (executive email)
**Acceptable passive threshold for this document type:** Below 15% passive instance rate; active voice strongly preferred in executive communications

### Metrics

| Metric | Before | After |
|--------|--------|-------|
| Total sentences | 6 | 6 |
| Sentences with passive constructions | 6 (100%) | 1 (17%) |
| Total passive instances | 9 | 1 |
| Passive instance rate | 150% | 17% |
| Converted to active | -- | 7 |
| Kept as passive | -- | 1 |
| Flagged as optional | -- | 1 |

### Passive Voice Instances

| # | Type | Original (Passive) | Revised (Active) | Verdict | Rationale |
|---|------|--------------------|------------------|---------|-----------|
| 1 | Standard | "The Q3 product roadmap has been reviewed by the engineering and product teams" | "The engineering and product teams have reviewed the Q3 product roadmap" | Convert | Agent is explicitly stated ("by the engineering and product teams") -- active voice is shorter, more direct, and leads with the responsible parties, which executives value for accountability |
| 2 | Agentless | "Several timeline adjustments were required" | "Resource constraints required several timeline adjustments" | Convert | Agent recoverable from immediate context ("resource constraints" appears in same sentence) -- surfacing it removes the institutional vagueness and makes the causal chain explicit |
| 3 | Standard | "resource constraints that were identified during the sprint reviews" | "resource constraints that the sprint reviews surfaced" | Convert | "Were identified" is passive with an implied agent (the sprint review process) -- "surfaced" is an active verb that tightens the clause and eliminates the passive construction |
| 4 | Hidden passive | "A decision was made to deprioritize the mobile checkout feature" | "We decided to deprioritize the mobile checkout feature" (or "Product leadership decided...") | Convert | Classic hidden passive -- "a decision was made" suppresses who decided, which in an executive email creates ambiguity about ownership; surfacing "we" or the specific team assigns accountability |
| 5 | Standard | "Customers will be impacted by this change" | "This change will impact customers" | Convert | Agent ("this change") is stated -- active version is more direct and leads with the cause; in executive communications, clarity about cause-and-effect is critical |
| 6 | Agentless | "a communication plan has been drafted" | "The communications team has drafted a communication plan" | Optional | Agent not stated in the email -- if the author knows who drafted it (e.g., the comms team, a specific person), name them for accountability; if genuinely unknown or irrelevant, the passive is acceptable here |
| 7 | Passive infinitive | "Approval is needed from the VP of Product before the plan can be distributed" | "The VP of Product must approve the plan before we distribute it" | Convert | Passive infinitive construction ("can be distributed") combined with agentless passive ("is needed") -- the active version makes the dependency chain explicit and the call to action clear, which is exactly what an executive email should do |
| 8 | Standard | "before the plan can be distributed" | (absorbed into conversion #7 above) | Convert | Converted as part of the full sentence restructuring in instance #7 |
| 9 | Standard | "The revised roadmap will be shared with all stakeholders by end of week" | Keep -- see rationale | Keep | The receiver ("all stakeholders") is the topic of this sentence -- the reader cares about who receives the roadmap, not specifically who sends it; this passive is appropriate and any active version ("We will share the revised roadmap...") is only marginally better |

### Revised Document

"The engineering and product teams have reviewed the Q3 product roadmap. Resource constraints that the sprint reviews surfaced required several timeline adjustments. We decided to deprioritize the mobile checkout feature until Q4. This change will impact customers, and the communications team has drafted a communication plan. [Optional: "a communication plan has been drafted" if the drafter is unknown or irrelevant.] The VP of Product must approve the plan before we distribute it. The revised roadmap will be shared with all stakeholders by end of week."

### Pattern Analysis

**Dominant passive type:** Hidden passives and agentless passives -- 5 of your 9 passive instances either suppress the agent entirely or bury the action inside a noun phrase ("a decision was made," "approval is needed"). This is the highest-impact passive type to eliminate in executive communication.

**Contextual trigger:** Passive voice clusters in this email around decisions and accountability -- "a decision was made," "approval is needed," "a communication plan has been drafted." This pattern is extremely common in corporate writing where authors are uncertain who owns a decision or reluctant to name decision-makers directly to senior leadership. In executive emails, this reads as evasiveness. The cleaner move is to name the owner and be direct.

**Self-check heuristic:** Before sending any executive email, read each sentence and ask: "Who did this? Who owns this? Who must act?" If you cannot answer, that is where your passive voice is hiding. Name the owner or the team explicitly.

**By-zombies test reminder:** "A decision was made [by zombies]" ✓ passive. "We decided [by zombies]" -- does not work ✓ active. Apply this test to any sentence you are unsure about.

### Adjacent Issues (Out of Scope)
- "Resource constraints" is doing a lot of work as a cause -- consider specifying what resources were constrained (engineering headcount? budget? third-party dependencies?) for executive precision. Address with `clarity-editing`.
- "A communication plan" is abstract -- executives will likely ask "what does the plan say?" Consider one sentence summarizing the plan's key messages. Address with `clarity-editing`.
- The email has no clear ask or next step until the second-to-last sentence. Consider restructuring to lead with the request. Address with `copy-editing`.
