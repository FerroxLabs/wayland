---
name: tone-adjustment
description: |
  Adjusts the tone, register, and voice of written text while preserving meaning, producing before/after comparisons with tone markers showing every change and its rationale.
  Use when the user asks to change the tone, make text more formal or casual, adjust the voice, or shift the register of existing writing.
  Do NOT use for content-level editing (use copy-editing), structural changes (use structural-editing), or proofreading (use proofreading).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "editing writing analysis"
  category: "writing"
  subcategory: "editing-refinement"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Tone Adjustment

## When to Use

**Use this skill when:**
- The user asks to make text "more formal," "more casual," "friendlier," "more authoritative," "more empathetic," "less aggressive," "warmer," "more urgent," or any similar register-shift request
- The user says their current draft feels "off" or "not quite right" and the problem is how it sounds rather than what it says
- The user needs to repurpose existing content for a new audience (the same product update email rewritten for executives vs. frontline employees, or a technical explanation adapted from an expert audience to a general one)
- The user needs to match a style guide or house voice (a brand with a defined "friendly-but-authoritative" voice, a law firm with a "professional-but-accessible" voice)
- The user wants to de-escalate emotionally charged writing -- softening a complaint letter, reducing the confrontational edge in a performance review, making a refusal sound less cold
- The user wants to increase the weight or impact of writing -- making a recommendation sound less tentative, strengthening a call to action, increasing the urgency of a safety notice
- The user is preparing to communicate across a cultural or organizational hierarchy shift (writing up to a board, writing down to new hires, writing across to peers in another department)

**Do NOT use this skill when:**
- The user wants to restructure paragraphs, change section order, or reorganize argument flow -- use `structural-editing`
- The user wants to fix grammar, spelling, or punctuation errors -- use `proofreading`
- The user wants to change what the text says, add facts, remove claims, or update the content -- use `copy-editing`
- The user wants to reduce word count without regard to tone -- use `conciseness-editing`
- The user wants to write a new document from scratch in a particular tone -- use the appropriate drafting skill (`email-drafting`, `report-writing`, etc.) with tone as a parameter
- The user is asking for feedback on whether a tone is appropriate, not a rewrite -- use `writing-feedback`
- The user needs translation between languages -- tone adjustment operates within a single language register and cannot substitute for cross-language translation

---

## Process

### Step 1: Diagnose the Source Text's Current Tone Across All Six Dimensions

Before making any changes, characterize the existing tone with precision. Vague diagnoses produce vague adjustments. Evaluate the text on these six axes, each rated on a 1--5 scale:

- **Formality (1 = casual / 5 = formal):** Measured by contraction frequency, sentence length and complexity, vocabulary register (Anglo-Saxon vs. Latinate roots), and use of colloquial expressions. A text with more than one contraction per 50 words is typically informal. Academic or legal text rarely uses any.
- **Warmth (1 = cold and distant / 5 = warm and personal):** Measured by pronoun choices (first/second person vs. third person), presence of emotional acknowledgment, use of the reader's name or group identity, and use of empathetic framing before directives.
- **Authority (1 = tentative / 5 = assertive):** Measured by hedging language density (might, perhaps, it seems, arguably, one could suggest), declarative vs. conditional phrasing, and whether the writer positions themselves as a source of certainty or a peer offering perspective.
- **Energy (1 = slow and measured / 5 = urgent and dynamic):** Measured by average sentence length, verb strength (active vs. passive, concrete vs. abstract), rhythm and sentence variety, and use of imperative mood.
- **Concreteness (1 = abstract / 5 = specific):** Measured by noun-to-verb ratio, presence of quantifiers and examples, use of nominalization (turning verbs into nouns: "the provision of support" vs. "we support"), and specificity of claims.
- **Distance (1 = intimate / 5 = institutional):** Measured by use of first-person singular ("I") vs. first-person plural ("we") vs. organizational ("the company"), degree of reader acknowledgment, and use of passive constructions to diffuse agency.

Record the source text's score on each dimension. This is the baseline. The target tone is a new set of scores on these six axes.

### Step 2: Clarify the Target Tone with Precision

Users rarely give precise tone briefs. "Make it more professional" is one of the most common requests and one of the most ambiguous. Apply this disambiguation protocol:

- **"More professional"** can mean: formal and restrained (suppress informality), confident and direct (raise authority), or polished and error-free (that's proofreading). Ask which.
- **"Friendlier"** can mean: warmer and more empathetic, more casual and relaxed, or more personal and less institutional. Clarify.
- **"Softer"** can mean: reduce formality, add warmth, reduce authority, or reduce urgency. It can also mean the user wants to avoid causing offense, which is a diplomatic register.
- **"More authoritative"** can mean: more assertive (raise authority score), more formal (raise formality score), or more credible (raise concreteness score -- add evidence and specifics).

If the user cannot clarify, ask two questions: (1) Who is the audience and what is their relationship to the author? (2) What response do you want from the reader -- deference, trust, action, comfort, agreement?

From those answers, derive the target scores on all six dimensions.

### Step 3: Map the Delta -- What Needs to Change, What Must Stay

With source and target scores in hand, identify:

- **Which dimensions are shifting** (these get active adjustment)
- **Which dimensions must hold** (these are off-limits -- if the source text has the author's distinctive voice in its warmth score, do not flatten it while raising formality)
- **Which dimensions have no constraint** (leave neutral)

Document the delta explicitly:

```
Formality:     3 → 5  (increase required)
Warmth:        2 → 4  (increase required)
Authority:     3 → 4  (slight increase)
Energy:        3 → 3  (preserve)
Concreteness:  2 → 2  (no change)
Distance:      4 → 3  (slight decrease -- make it more personal)
```

This mapping prevents the most common error in tone adjustment: shifting one dimension while inadvertently degrading another. Raising formality without watching distance, for example, often produces cold, bureaucratic text when the goal was "professional but warm."

### Step 4: Apply Tone Techniques Systematically by Dimension

Work through each dimension that requires change, applying the correct techniques. Do not work sentence-by-sentence randomly -- work dimension by dimension to maintain consistency.

**Increasing Formality (score 1--5):**
- Remove contractions entirely (it's → it is, we've → we have, can't → cannot). In highly formal contexts, eliminate even possessive contractions.
- Replace phrasal verbs with single-word equivalents: "look into" → "investigate," "find out" → "determine," "put off" → "postpone"
- Replace Anglo-Saxon colloquials with Latinate equivalents where appropriate: "help" → "assist," "use" → "utilize" (sparingly -- "utilize" is overused and often wrong), "start" → "commence," "end" → "conclude"
- Expand sentence length and use subordinate clauses to qualify statements properly
- Remove filler affirmatives: "Sure," "Of course," "Absolutely," "Definitely" as sentence openers
- Replace first-name references with title + surname in business contexts

**Decreasing Formality:**
- Introduce contractions at a natural rate (approximately one per 2--4 sentences for conversational tone)
- Replace Latinate nominalizations with their verb forms: "the implementation of changes" → "implementing changes"; "the provision of assistance" → "helping"
- Shorten sentences -- target 15--20 words average for conversational copy vs. 25--35 for formal prose
- Replace passive constructions with active voice and named agents
- Use direct address (you, your) rather than "the reader" or "users"

**Increasing Warmth:**
- Acknowledge the reader's situation or perspective before making a request or assertion: "I know this comes at a busy time -- here is what we need."
- Shift from third person ("employees are encouraged to") to second person ("you are welcome to," "we encourage you to")
- Add transitional phrases that signal care rather than mere transaction: "I wanted to make sure you had everything you need before the deadline."
- Use inclusive "we" when appropriate -- it places the author on the same team as the reader
- Reduce imperative mood for non-urgent directives: "Submit by Friday" → "Please submit by Friday" or "When you get a chance, could you submit this by Friday?"

**Decreasing Warmth (for objective, institutional, or legal contexts):**
- Move to third person: "Users may request a refund" instead of "You can ask for a refund"
- Remove personal anecdotes, emotional acknowledgment, or empathetic framing
- Replace informal transitional language with formal connectives: "Also" → "Furthermore," "But" → "However," "So" → "Therefore"
- Remove exclamations and enthusiasm markers

**Increasing Authority:**
- Eliminate hedging language: delete "might," "perhaps," "it seems," "arguably," "one could argue," "I think," "in my opinion" unless the hedging is factually necessary (i.e., genuine uncertainty)
- Convert conditional constructions to declarative: "This could potentially improve performance" → "This improves performance"
- Replace passive voice with active voice and name the agent: "Mistakes were made" → "The team made three errors"
- Front-load conclusions before evidence -- authoritative writers do not build to a conclusion; they state it first
- Replace vague quantifiers ("many," "some," "often") with specific ones ("73%," "three of the five teams," "in Q3 2023")

**Decreasing Authority (softening, hedging for diplomatic contexts):**
- Add hedging language deliberately to soften assertions: "This approach tends to improve outcomes" rather than "This approach improves outcomes"
- Use conditional mood to invite collaboration: "You might consider..." "One option would be..."
- Add explicit acknowledgment that other views exist: "While others may approach this differently..."
- Replace declarative statements with questions when the goal is to prompt reflection rather than direct

**Increasing Energy:**
- Shorten sentences. The most impactful individual change in energy is sentence length. Cut average sentence length by 30--40% to create urgency.
- Move verbs forward. Start sentences with their subjects and put the verb in position 2 or 3.
- Remove nominalizations (turning verbs to nouns). "Make a decision" → "Decide." "Provide support" → "Support." "Conduct an investigation" → "Investigate."
- Use imperative mood for calls to action
- Vary sentence rhythm: mix one short punchy sentence with two medium ones. The short one lands harder because of the contrast.

**Decreasing Energy (for deliberate, measured contexts):**
- Increase average sentence length with well-constructed compound and complex sentences
- Add qualifying clauses that demonstrate thoroughness: "...taking into account the constraints of the current budget cycle..."
- Replace imperatives with conditional or passive constructions
- Add transitional phrases that signal careful reasoning: "It follows, then, that..." "Considered alongside the broader context..."

### Step 5: Check for Dimension Consistency Across the Full Document

After applying changes, do a consistency pass -- not a revision pass. Ask these questions:

- Does every paragraph reflect the target formality score? Check the last paragraph especially -- writers often slide back to old tone at the end.
- Does the opening salutation or headline match the body tone? A formally adjusted letter with "Hey!" as the opener has not been fully adjusted.
- Are sentence lengths consistent with the target energy score throughout, or do some paragraphs have outlier lengths?
- Does pronoun use (I / we / you / the company) hold consistent with the target warmth and distance scores?
- Are hedging words absent (or present) throughout, or only in some sections?

Make any corrections this consistency pass reveals.

### Step 6: Verify Meaning Preservation at Every Changed Sentence

This is the most important check. For every sentence that was changed, confirm:

- The factual claim is identical (no facts added, removed, or altered)
- The logical relationship between clauses is identical (causation, contrast, sequence not changed)
- The degree of certainty is preserved (a hedged claim must remain hedged; a firm claim must remain firm -- unless raising or lowering authority was the explicit goal)
- The implication or connotation is not accidentally shifted (softening "we missed the deadline" must not become "the deadline was adjusted" which shifts blame)

Flag any sentence where meaning preservation required a compromise and explain the trade-off.

### Step 7: Produce the Full Deliverable

Deliver the output in three parts:
1. The before/after comparison table with tone markers for every substantive change
2. The full adjusted document, ready to use
3. The adjustment summary with dimension scores, techniques applied, and meaning preservation notes

---

## Output Format

```
## Tone Adjustment Report

**Document:** [Title or description of the source text]
**Requested shift:** [User's original request]

---

### Tone Dimension Analysis

| Dimension    | Source Score (1–5) | Target Score (1–5) | Change    |
|--------------|--------------------|--------------------|-----------|
| Formality    | [X]                | [X]                | [↑ / ↓ / =] |
| Warmth       | [X]                | [X]                | [↑ / ↓ / =] |
| Authority    | [X]                | [X]                | [↑ / ↓ / =] |
| Energy       | [X]                | [X]                | [↑ / ↓ / =] |
| Concreteness | [X]                | [X]                | [↑ / ↓ / =] |
| Distance     | [X]                | [X]                | [↑ / ↓ / =] |

---

### Before/After Comparison

| # | Original | Adjusted | Dimension | Technique Applied |
|---|----------|----------|-----------|-------------------|
| 1 | [sentence] | [sentence] | Formality ↑ | Contraction removed; phrasal verb replaced |
| 2 | [sentence] | [sentence] | Warmth ↑ | Empathetic framing added before directive |
| 3 | [sentence] | [sentence] | Authority ↑ | Hedging language removed; declarative form |
| 4 | [sentence] | [sentence] | Energy ↑ | Nominalization eliminated; sentence split |
| 5 | [sentence] | [sentence] | Distance ↓ | Third person → second person |
| N | [sentence] | [sentence] | [Dimension] | [Technique] |

---

### Meaning Preservation Notes
[Only include if any change required a trade-off or flag]
- **Row [N]:** [Original implication] vs. [adjusted implication] -- [how it was resolved]

---

### Adjusted Document

[Full text with all tone adjustments applied -- clean, no markup]

---

### Adjustment Summary

**Dimensions shifted:** [List with direction and magnitude]
**Techniques applied:**
- [Technique 1]: [How and where applied]
- [Technique 2]: [How and where applied]
- [Additional techniques as needed]

**Consistency check:** [Confirmed consistent / flagged inconsistency in paragraph X]
**Meaning integrity:** [Confirmed / flagged]
**Recommended review:** [Any passages the user should double-check for intent]
```

---

## Rules

1. **Never change what a sentence says while changing how it says it.** Tone adjustment is a surface operation. If "the product failed testing" becomes "the product encountered some challenges in the testing phase," you have changed the factual claim, not just the tone. Flag this as a meaning risk and offer the user the choice.

2. **Never adjust only part of a document when the whole is presented.** Partial tone adjustment is the most common quality failure. If the opening paragraph is raised to formal and the closing paragraph remains casual, the document is worse than before -- it appears inconsistent and careless. The consistency pass in Step 5 is mandatory, not optional.

3. **Never flatten the author's voice to produce generic tone.** If the source text has distinctive stylistic signatures -- unusual sentence rhythms, a characteristic use of rhetorical questions, a personal storytelling approach -- preserve these where they are compatible with the target tone. Tone adjustment changes register; it does not erase identity.

4. **Always rate the source text on all six dimensions before touching a word.** Adjusting without diagnosis produces overcorrection. A text that is already at formality 4 does not need aggressive formalization; a small adjustment to 5 is sufficient and will not make the text stiff.

5. **Always show every substantive change in the before/after table.** A "substantive change" is any change that is not a pure mechanical swap (removing one contraction is substantive; correcting a typo is not and belongs to proofreading). Users must be able to audit every decision.

6. **Never overcorrect on the authority dimension when the hedging is factually warranted.** If the source text says "this may increase risk," the hedge is there for a reason -- the claim is uncertain. Changing it to "this increases risk" for the sake of authority may be factually false. Before removing hedges, confirm with the user whether the underlying claim has a certainty level that permits declarative framing.

7. **Never use "utilize" as a Latinate substitute for "use" unless the specific meaning of "utilize" (to put something to use that was not intended for that use) is required.** This is one of the most common errors in formal tone adjustment. "Utilize" in place of "use" reads as overcorrection and signals inexperience to sophisticated readers.

8. **When adjusting to a warmer tone, always add empathetic framing before directives, not after.** "Please submit your report by Friday -- I know you've had a full week" is less effective than "I know you've had a full week -- when you can, please submit your report by Friday." Warmth must precede the ask to land as genuine care rather than a courtesy afterthought.

9. **When adjusting from formal to casual, actively hunt for nominalizations.** Nominalization (converting verbs to noun phrases) is the primary mechanism of formal prose and the single biggest source of stiffness. Search for "the [noun] of," "provide [noun]," "conduct [noun]," "achieve [noun]" patterns throughout the document and convert them back to verb forms.

10. **When the user requests contradictory tones (e.g., "formal but warm"), treat them as independent dimensions and show the matrix explicitly.** "Formal" and "warm" are not opposites -- they operate on different axes (formality and warmth). The correct response is not to find a compromise between them but to achieve both: high formality score AND high warmth score. Explain this to the user and demonstrate what the combination looks like in practice.

11. **If the tone adjustment significantly alters the character of the document -- such as an extreme shift from academic to social-media-conversational -- flag this as a substantial rewrite and confirm intent before proceeding.** An extreme shift may require structural changes (shorter paragraphs, headers, bullets) that fall outside tone adjustment's scope. Identify the boundary and refer the overflow to `structural-editing` if needed.

12. **Tone shifts in emotionally sensitive content (apology letters, performance reviews, termination notices, medical communications, complaint letters) require extra meaning preservation scrutiny.** In these contexts, a small word change can shift legal implication, emotional impact, or responsibility assignment in ways that carry real-world consequences. Note the sensitivity at the top of the report and flag any sentence where the adjusted version might be read differently by a reader looking for liability or weakness.

---

## Edge Cases

### "Formal but Friendly" and Other Apparently Contradictory Requests
These requests reveal a common misconception: that formality and warmth are opposites. They are not -- they are independent dimensions. A letter from a hospital consultant explaining a difficult diagnosis can be highly formal (Latinate vocabulary, no contractions, complex syntax) and highly warm (explicit empathetic acknowledgment, first-person engagement with the patient's situation, validation of their concern before delivering information). The technique is to raise the formality dimension using vocabulary and syntax choices while simultaneously raising the warmth dimension using pronoun choices, empathetic framing, and acknowledgment of the reader's experience. The result is the register of a skilled professional who respects both protocol and people. Show the user the six-dimension matrix and explain that you are targeting high scores on both axes independently.

### Adjusting Tone in Only a Section of a Larger Document
When the user specifies that only one section needs to change, make the adjustment to that section -- but also flag the tonal boundary. The adjusted section will create a seam in the document where the register shifts. In some cases (e.g., a formal report with a deliberately conversational executive summary) this is intentional and appropriate. In others, it will feel jarring. Offer to smooth the two or three sentences at each boundary of the adjusted section to create a gradual transition rather than an abrupt register shift. Also note to the user that the rest of the document, if it will be read alongside the adjusted section, may now feel inconsistent by comparison.

### Source Text with Multiple Tonal Registers Already Present
Some documents mix registers intentionally -- a marketing email that starts warm and casual and shifts to formal for legal disclaimers, or a research article with a conversational abstract and technical body. When asked to "adjust the tone" of such a document, clarify which sections are in scope. Do not flatten a deliberately mixed-register document into uniform tone without confirming that uniformity is the goal. Map the existing registers in your diagnosis and ask whether each section should be adjusted or preserved.

### Culturally Specific Registers (AAVE, Formal British English, Indian English business norms, etc.)
Cultural register is not incorrect tone -- it is a valid linguistic variety with its own formality-warmth-authority spectrum. If a user writes in a culturally specific register and asks to "make it more professional," clarify: professional by whose standard? A request to shift from AAVE to General American English is not a tone adjustment -- it is a register change with cultural and identity implications that the user should make consciously. Ask explicitly: "Are you looking to adjust within the register you're already using, or to shift to a different variety entirely?" Do not assume that the user's cultural register is informal or unprofessional by default.

### Emotionally Charged Source Text (Complaints, Apologies, Conflict Communication)
When the source text contains a complaint, grievance, demand, or emotional escalation, tone adjustment must not dilute the legitimacy of the underlying position. Softening a complaint should not become sanitizing it. If the user wants to make an angry email "more professional," the adjusted version should communicate the same substance -- the same concern, the same accountability ask, the same consequence -- with more controlled, formal language rather than with reduced stakes. Watch for these specific transformation traps: "this is unacceptable" becoming "we have some concerns" (stakes reduced), "you failed to deliver" becoming "there may have been a miscommunication" (accountability shifted), "I expect a refund" becoming "I would appreciate your consideration" (demand weakened). Flag any such shift and offer the user the choice between the toned-down version and a version that preserves full assertiveness at higher formality.

### User Is Unsure What Tone They Want
When a user says "it doesn't feel right but I'm not sure what to change," do not begin adjusting immediately. Use the six-dimension scale as a diagnostic conversation tool. Ask the user: "If you had to say which of these is the biggest problem -- it sounds too stiff/too casual, too cold/too personal, too uncertain/too pushy, too rushed/too slow -- which would it be?" From that answer, identify which single dimension is the primary problem and adjust that dimension by one increment (e.g., formality from 4 to 3). Show the user the result and ask if it feels closer. Iterative one-dimension adjustment is more useful than a full multi-dimension overhaul when the user cannot articulate the target.

### The Author's Voice Is the Problem
Sometimes what feels like a tone problem is actually a voice consistency problem -- the text sounds like it was written by committee, or it has sections clearly written by different contributors with different natural registers. In this case, tone adjustment alone cannot fix the problem. Identify this scenario early: if the inconsistency is between sections rather than between the text and its target register, note that the issue is voice consistency rather than tone and that a broader editing pass may be needed.

### Legal, Medical, or Compliance Text
Certain documents -- terms of service, medical consent forms, compliance notices, insurance documents -- have regulatory constraints on their language. Tone adjustment must work within the compliance envelope. Raising warmth or reducing formality in such a document may not be possible beyond a certain point without creating regulatory or legal risk. Flag this explicitly at the start of the report: "This document appears to contain regulated language. Tone adjustments have been limited to sections that do not affect legal or compliance language. The following sections have been left unchanged: [list]."

---

## Example

**Input:** "Make this investor update email sound more authoritative and confident. Right now I feel like I'm apologizing for our results rather than presenting them. Here is the text:

'Hi everyone, I just wanted to give you a quick update on where things stand. So Q3 was a bit of a mixed bag -- we sort of missed our revenue target (came in at $2.1M vs. the $2.4M we were hoping for), but I think we made some good progress in other areas. Subscriptions are growing, which is great, and we've been kind of working on some product improvements that I believe will hopefully pay off. We'll try to do better next quarter. Sorry for the shorter update -- things have been pretty hectic. Let me know if you have any questions!'"

---

**Output:**

## Tone Adjustment Report

**Document:** Q3 investor update email
**Requested shift:** Increase authority and confidence; eliminate apologetic register

---

### Tone Dimension Analysis

| Dimension    | Source Score (1–5) | Target Score (1–5) | Change |
|--------------|--------------------|--------------------|--------|
| Formality    | 2                  | 4                  | ↑↑     |
| Warmth       | 3                  | 3                  | =      |
| Authority    | 1                  | 4                  | ↑↑↑    |
| Energy       | 2                  | 3                  | ↑      |
| Concreteness | 2                  | 4                  | ↑↑     |
| Distance     | 3                  | 3                  | =      |

**Diagnosis:** The source text scores extremely low on authority (score: 1) due to pervasive hedging language, apologies, and vague quantifiers. It also scores low on formality (score: 2) with contractions, filler openers, and colloquial phrasing. Concreteness is low (score: 2) -- "some good progress," "kind of working on," "hopefully pay off" are all vague. The warmth and distance levels are appropriate for investor communication and will be preserved.

---

### Before/After Comparison

| # | Original | Adjusted | Dimension | Technique Applied |
|---|----------|----------|-----------|-------------------|
| 1 | "Hi everyone, I just wanted to give you a quick update on where things stand." | "Team, this is your Q3 update." | Formality ↑, Authority ↑ | Removed apologetic opener "just wanted to"; replaced vague "where things stand" with direct declarative; removed contraction |
| 2 | "So Q3 was a bit of a mixed bag" | "Q3 results were mixed." | Authority ↑, Formality ↑ | Removed filler "So"; removed hedging diminutive "a bit of"; declarative statement replaces vague idiom |
| 3 | "we sort of missed our revenue target (came in at $2.1M vs. the $2.4M we were hoping for)" | "Revenue came in at $2.1M against a $2.4M target -- a 12.5% shortfall." | Authority ↑, Concreteness ↑ | Removed "sort of" hedge; removed apologetic "we were hoping for" (replaced with neutral "target"); added calculated percentage to transform vague gap into specific metric |
| 4 | "but I think we made some good progress in other areas" | "Performance in other areas was strong." | Authority ↑ | Removed "I think" opinion hedge; replaced vague "good progress" with assertive evaluation; removed qualifying "some" |
| 5 | "Subscriptions are growing, which is great" | "Subscription growth accelerated in Q3." | Authority ↑, Energy ↑, Concreteness ↑ | Removed approval marker "which is great" (writer's enthusiasm is not relevant to investors); replaced with declarative; verb "accelerated" is stronger than "growing" and implies direction |
| 6 | "we've been kind of working on some product improvements that I believe will hopefully pay off" | "We have three product improvements in active development, with release planned for Q4." | Authority ↑↑, Concreteness ↑↑ | Eliminated "kind of," "I believe," and "hopefully" -- all hedges; replaced vague "some product improvements" with specific quantity; replaced vague future hope with concrete timeline |
| 7 | "We'll try to do better next quarter." | "Our Q4 target is $2.6M, with subscription growth as the primary driver." | Authority ↑↑, Concreteness ↑↑ | "Try to do better" is the most damaging sentence in the original -- it signals lack of confidence and lack of a plan to investors. Replaced with a specific target and a named strategy. Note: if a specific Q4 target has not been set, use "Our Q4 revenue target will be communicated at the board meeting on [date]." |
| 8 | "Sorry for the shorter update -- things have been pretty hectic." | [Removed entirely] | Authority ↑, Formality ↑ | Apologies for communication brevity are not appropriate in investor updates. Investors read short updates as efficient, not inadequate. The apology undermines authority without adding value. |
| 9 | "Let me know if you have any questions!" | "Questions and follow-up requests can be directed to [contact] or raised at the Q3 call on [date]." | Formality ↑, Authority ↑ | Replaced informal closing with structured invitation; replaced enthusiasm marker with specific action channel and date |

---

### Meaning Preservation Notes

- **Row 3:** The original does not state the percentage gap -- I calculated 12.5% from the figures provided ($0.3M / $2.4M). If this calculation is incorrect due to rounding or context I don't have, replace "a 12.5% shortfall" with "a $300K shortfall." The key principle is: name the number specifically.
- **Row 7:** The original "try to do better" was replaced with a specific Q4 target of $2.6M. This is a meaning expansion, not a preservation -- I flagged it because investors need a target, not a vague aspiration. If a specific Q4 target has not been set internally, use the fallback language noted in Row 7.
- **Row 5:** "Subscription growth accelerated" is a stronger claim than "subscriptions are growing." If growth rate did not actually accelerate (i.e., the rate was flat or slower than prior quarters), change this to "Subscription growth continued in Q3" to preserve factual accuracy.

---

### Adjusted Document

Team,

This is your Q3 update.

Q3 results were mixed. Revenue came in at $2.1M against a $2.4M target -- a 12.5% shortfall. Performance in other areas was strong. Subscription growth accelerated in Q3, and we have three product improvements in active development, with release planned for Q4.

Our Q4 target is $2.6M, with subscription growth as the primary driver.

Questions and follow-up requests can be directed to [contact] or raised at the Q3 call on [date].

[Name]

---

### Adjustment Summary

**Dimensions shifted:**
- Formality: 2 → 4 (significant increase -- contractions removed, colloquialisms eliminated, register raised throughout)
- Authority: 1 → 4 (major increase -- this was the primary problem in the source text)
- Concreteness: 2 → 4 (major increase -- vague language replaced with specific metrics and timelines)
- Energy: 2 → 3 (moderate increase -- sentence length reduced, nominalization removed, stronger verbs introduced)

**Techniques applied:**
- **Hedging elimination:** Removed "sort of," "kind of," "I think," "I believe," "hopefully," "a bit of," "some" throughout
- **Filler opener removal:** Removed "So," "Just wanted to," "Hi everyone" where they weakened the opening
- **Vague quantifier replacement:** "Some good progress" → specific claims; "some product improvements" → "three product improvements"
- **Percentage calculation:** Added 12.5% to give investors a precise shortfall figure
- **Apology removal:** Removed both apologies (for results and for update length) -- apologies are authority-suppressing in investor communications
- **Forward-looking specificity:** Replaced "try to do better" with a specific target and named driver -- investors require plans, not hopes
- **Closing formalization:** Structured call to action with named channel and date replaced informal "let me know"

**Consistency check:** Confirmed consistent. All nine sentences maintain formality-4 and authority-4 register throughout.

**Meaning integrity:** Three flags raised (see Meaning Preservation Notes above). Recommend user verify: (1) the 12.5% figure, (2) the Q4 target of $2.6M, and (3) whether "subscription growth accelerated" is accurate.

**Recommended review:** The Q4 target figure in Row 7 is the highest-stakes element in the adjusted document. An investor reading a confident Q4 target will hold the author accountable to it. Confirm this is a number the author is prepared to stand behind before sending.
