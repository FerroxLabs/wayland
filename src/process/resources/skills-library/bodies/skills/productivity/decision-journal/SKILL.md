---
name: decision-journal
description: |
  Writes a structured decision journal entry capturing the decision, context, constraints, options considered, chosen option with rationale, predicted outcomes, and a scheduled review date. Produces the complete journal entry, not advice about journaling.
  Use when the user asks about documenting a decision, creating a decision record, building a decision log, or tracking decisions for future review.
  Do NOT use for making the decision itself (use weighted-decision-matrix or pro-con-analysis), business strategic decision documentation (use business strategy skills), or project change control (use scope-creep-management).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "decision-making template planning"
  category: "productivity"
  subcategory: "decision-making"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Decision Journal

## When to Use

**Use this skill when:**
- The user has made a decision and wants to document it formally before memory distortion sets in -- the window of accurate recall narrows within 24-72 hours of deciding
- The user explicitly asks to create a decision log, decision record, or decision journal entry for future review and learning
- The user wants to make their reasoning legible to their future self so they can distinguish between "I made a bad decision" and "I made a good decision under the information available"
- The user is about to commit to an irreversible or high-cost decision and wants to force themselves to articulate their reasoning before pulling the trigger
- The user has a pattern of repeating the same category of mistake (career, financial, relationship) and wants a systematic record to identify where their judgment consistently fails
- The user participates in professional decision-making (investment committee, hiring panel, medical team) and needs a structured record of individual reasoning before group discussion -- to prevent hindsight bias and groupthink contamination
- The user wants to build a personal base rate library -- a catalog of their past predictions versus actual outcomes -- to calibrate their confidence in future decisions

**Do NOT use when:**
- The user has not yet decided and needs help choosing -- use `weighted-decision-matrix` for multi-criteria trade-off analysis or `pro-con-analysis` for binary comparisons
- The user wants to map second- and third-order consequences before committing -- use `second-order-thinking` to explore cascade effects first, then return here to document
- The user wants to stress-test the decision by imagining failure scenarios -- use `premortem-analysis` first, then document findings here under the uncertainty section
- The user needs formal business or organizational decision documentation for governance, audit, or board records -- use business strategy documentation skills that handle stakeholder sign-offs and decision authority matrices
- The user is managing a project change that requires scope control, budget reauthorization, or formal change request -- use `scope-creep-management`
- The user is in acute crisis requiring immediate action -- journaling is retrospective and deliberate; it is not appropriate when the user needs an immediate action plan
- The user wants a reminder system or task tracker -- this skill produces a document, not a calendar event or follow-up workflow

---

## Process

### Step 1: Establish the Entry Type and Timing

Before writing anything, determine what kind of entry this is. The entry type controls which fields are mandatory.

- **Prospective entry (before deciding):** All fields except "Chosen option," "Primary reason," and "Actual decision date" are filled with intent. Mark the header clearly as PROSPECTIVE. This type functions as a decision-forcing document -- completing it often clarifies the choice.
- **Contemporaneous entry (within 24 hours of deciding):** The highest-fidelity entry. All fields are mandatory. This is the gold standard because memory distortion is minimal.
- **Retrospective entry (days to weeks after deciding):** Flag the entry explicitly as retrospective. Ask the user to separate what they remember thinking at decision time from what they now believe with hindsight. These are different things. Capture both.
- **Review entry (revisiting a past entry):** Do not rewrite the original. Add a dated Review Block beneath the original entry. Preserve the original predictions verbatim for honest comparison.

Ask the user: "When did you make this decision?" and "How would you rate the quality of your memory of your reasoning at the time?" If the decision was more than one week ago, flag it as retrospective and note the memory decay risk in the Context section.

### Step 2: Extract the Decision Context with Precision

The context section is the most undervalued part of the journal. It is what transforms the entry from a to-do list into a genuine learning instrument. Push for specificity on every field.

- **The decision statement:** Write it as a single sentence in past tense if decided ("I decided to X rather than Y") or future tense if prospective ("I am deciding whether to X or Y by [date]"). Vague statements like "I decided about my career" are not acceptable -- force specificity.
- **The trigger:** What made this decision necessary now? Triggers fall into four types -- deadline pressure (external forcing function), opportunity arrival (a new option appeared), threshold crossing (a situation deteriorated past a tolerance point), or deliberate timing (the user chose this moment). Identifying the trigger type reveals whether the user was reactive or proactive.
- **Information state:** Characterize what was known, what was unknown but knowable (if the user had spent more time), and what was fundamentally unknowable at decision time. This three-part split is the foundation of honest prediction calibration later.
- **Mental and emotional state:** This is not soft data. Research by Antonio Damasio (somatic marker hypothesis) and work on "hot" versus "cold" cognition shows that decisions made under stress, excitement, hunger, or sleep deprivation have systematically different error patterns. Record the state honestly. Common states include: calm and analytical, excited/motivated, anxious/pressured, fatigued, socially influenced (decided because someone else pushed), or defensive (decided to avoid conflict rather than pursue a goal).
- **Time pressure category:** No pressure (could wait indefinitely), soft deadline (self-imposed), hard external deadline, or emergency (action required immediately). Time pressure is one of the strongest predictors of decision quality -- document it so you can later analyze whether rushed decisions have worse outcomes in your personal history.

### Step 3: Document All Options Considered -- Including the Null Option

The options table is where most journals fail by omitting the alternatives that were briefly considered and dismissed. Every silently eliminated option represents a hidden assumption.

- Always include the **null option** -- the option of doing nothing, waiting, or deferring. If the user did not consider it, that itself is significant and worth noting.
- For each option, capture the single strongest argument in its favor (steelman it) and the single strongest argument against it (its genuine weakness, not a strawman). Weak "against" arguments indicate the user did not take the option seriously.
- Document why rejected options were rejected. The reason for rejection reveals the decision criteria the user actually applied -- these often differ from the criteria the user claims to use.
- If the user can only name one option, probe harder: "Was there a moment where you considered not doing this at all?" or "What would the most cautious version of you have done?" This usually surfaces the null option or a more conservative variant.
- Flag if any option was rejected primarily for social or emotional reasons rather than analytical ones (e.g., "I didn't want to disappoint X" or "that option felt embarrassing"). These are valid reasons but should be made explicit -- they reveal values priorities.

### Step 4: Lock Down the Rationale with Surgical Precision

The rationale section must accomplish three things: identify the actual deciding factor, expose the key uncertainty, and define the conditions that would reverse the decision.

- **The primary reason (tiebreaker):** Ask the user: "If you had to reduce this to the single factor that tipped the scales, what was it?" This is rarely the official reason and often differs from what the user would say publicly. The journal should capture the honest internal tiebreaker, not the socially acceptable one.
- **Most confident about:** The claim the user would defend under cross-examination. This anchors the entry for review -- if this belief turns out to be wrong, the decision needs to be reconsidered even before the scheduled review date.
- **Least confident about:** The primary uncertainty. This is not "I don't know the future" -- it must be a specific belief, estimate, or assumption that the user is relying on but is not sure about. Example: "I am relying on the assumption that the market rate for this skill set will remain above $120K for the next 24 months."
- **Reversal condition (kill switch):** The single most valuable field for ongoing decision hygiene. Ask: "What specific event, data point, or discovery would make you abandon or reverse this decision, even if everything else is going well?" Documenting this in advance prevents sunk cost fallacy from taking hold later. A decision without a kill switch is a decision the user has committed to emotionally rather than rationally.

### Step 5: Force Explicit, Measurable Predictions

This is the step that separates decision journals from decision diaries. A diary records what happened. A journal records what you expected to happen -- so you can measure calibration.

- Every prediction must have three properties: it must be **specific** (what exactly will be true), **measurable** (how will you know if it happened), and **time-bound** (by when).
- "Things will work out" is not a prediction. "My monthly revenue from this client will exceed $8,000 by month six" is a prediction.
- Structure predictions across three time horizons: **leading indicators** (early signs within 30-90 days that the decision is on track), **medium-term outcomes** (3-12 months, the first real feedback signal), and **terminal outcomes** (1-5 years, the full consequence of the decision).
- Assign confidence levels as percentages, not vague words. "I believe with 70% probability that X will occur" is calibratable. "I am fairly confident" is not. Over time, the user can compare their stated 70% confidence claims against how often they actually occur -- this is how prediction calibration improves.
- Include a **worst realistic case** prediction -- not a catastrophe fantasy, but the genuinely bad outcome that is plausible if the key uncertainties resolve against the user. This forces acknowledgment of downside without catastrophizing.
- **Overall confidence score (1-10):** 1-3 = the user is guessing, the decision is a coin flip or a leap of faith; 4-6 = moderate conviction, meaningful analysis was done but significant uncertainty remains; 7-9 = high conviction based on solid evidence and reasoning; 10 = overconfidence (flag this -- a confidence of 10 in a complex decision is almost always a calibration error).

### Step 6: Conduct the Values Alignment Check

A decision can be analytically sound and values-misaligned at the same time. The values check exists to detect this gap and force honest acknowledgment.

- Ask the user to name their top three priorities for the current life or work domain (career growth, financial security, health, family time, creative freedom, autonomy, etc.). If they cannot name them, prompt: "What would you tell a close friend your priorities are in this area of your life?"
- For each stated priority, ask whether the chosen option advances, is neutral to, or conflicts with that priority. Score it explicitly.
- The most revealing question is: **"Is there a gap between what you say you value and what you chose?"** A person who says they value work-life balance but just chose to take on a 60-hour-a-week role has a values-action gap. The journal does not judge this -- it makes it visible. Sometimes the gap is deliberate (a sacrifice for a specific reason). Sometimes it reveals that the stated values are aspirational rather than operational.
- If a significant values-action gap exists, note it and ask the user if they want to address it before finalizing the journal entry. Do not make the decision for them -- but make the gap explicit.

### Step 7: Set Review Dates with Evaluation Criteria

Review dates without evaluation criteria are useless -- the user will arrive at the review not knowing what to assess.

- **Short-term review (30-90 days):** Assess leading indicators only. Has the decision been implemented as planned? Are early signals consistent with predictions? The goal is not to judge the decision yet -- it is to check whether the execution matches the intent and whether any new information has emerged that would trigger the kill switch.
- **Long-term review (6-24 months):** Assess medium-term outcomes against predictions. Measure prediction accuracy by comparing stated confidence percentages against actual outcomes. Calculate an accuracy score for the entry. Identify what the user got right and what they got wrong, and why.
- For each review date, specify exactly what data will be evaluated. Not "check if things are going well" but "review revenue figures, compare to $8,000/month prediction, assess client satisfaction on a 1-5 scale."
- Include a **trigger review condition:** If a specific event occurs before the scheduled review date (the kill switch is activated, or an unexpected development occurs), conduct an emergency review immediately. Document this condition in the schedule.

### Step 8: Assemble and Output the Complete Entry

Compile all collected information into the full journal entry format. Do not summarize, abbreviate, or omit sections.

- Use the exact output format below -- no shortcutting fields or merging sections
- If the user has not provided enough information for a field, use a clear placeholder in brackets and note that it needs to be filled in -- do not invent data
- Present the complete entry as a document the user can copy, save, or paste into a note-taking system (Obsidian, Notion, physical journal, etc.)
- If this is a prospective entry (pre-decision), add a bold note at the top: "PROSPECTIVE ENTRY -- Complete rationale section after deciding"
- If this is a retrospective entry, add a bold note: "RETROSPECTIVE ENTRY -- Documented [N days] after decision. Memory distortion possible."

---

## Output Format

```markdown
---
# DECISION JOURNAL ENTRY
---

## Entry Header
- **Entry ID:** [YYYY-MM-DD-###, e.g., 2024-11-15-001]
- **Entry Type:** [Contemporaneous / Prospective / Retrospective -- note days since decision if retrospective]
- **Decision Date:** [date the decision was made or will be made]
- **Documented Date:** [today's date]
- **Decision Statement:** [Single sentence: "I decided to [X] rather than [Y] on [date]."]
- **Domain:** [Career | Financial | Health | Relationship | Project | Creative | Education | Other]
- **Reversibility:** [Easily reversible | Reversible with cost | Difficult to reverse | Irreversible]

---

## Context

### Situation
- **Trigger type:** [Deadline pressure | Opportunity arrival | Threshold crossing | Deliberate timing]
- **Trigger description:** [What specific event or condition made this decision necessary now?]
- **Time pressure:** [No pressure | Soft self-imposed deadline | Hard external deadline by [date] | Emergency]

### Information State at Decision Time
- **Known:** [What facts, data, or evidence was available]
- **Unknown but knowable:** [What could have been researched with more time]
- **Fundamentally unknowable:** [What could not be known regardless of effort]
- **Information quality rating:** [Sufficient | Partially informed | Deciding with significant gaps]

### Decision Maker State
- **Mental/emotional state:** [Calm and analytical | Excited | Anxious | Fatigued | Pressured | Conflicted | Describe]
- **Social influence present?** [Yes -- describe | No]
- **Note if retrospective:** [Describe any difference between remembered state and current perspective]

---

## Options Considered

| # | Option | Steelman (Best Argument For) | Strongest Objection Against | Rejection Reason | Status |
|---|--------|-----------------------------|-----------------------------|-----------------|--------|
| 1 | [option name] | [best argument for this option] | [genuine weakness] | -- | **CHOSEN** |
| 2 | [option name] | [best argument for this option] | [genuine weakness] | [specific reason rejected] | Rejected |
| 3 | [option name] | [best argument for this option] | [genuine weakness] | [specific reason rejected] | Rejected |
| 4 | Do nothing / defer | [best argument for waiting] | [cost of inaction] | [reason inaction was rejected] | Rejected |

**Note:** If the null option was not considered at all, explain why inaction was not a live option.

---

## Decision Rationale

- **Chosen option:** [option name]
- **Actual deciding factor (tiebreaker):** [The single factor that tipped the scales -- be honest, not polished]
- **Most confident about:** [The specific belief or assumption the user would defend under cross-examination]
- **Least confident about:** [The specific assumption or estimate that is load-bearing but uncertain]
- **Primary uncertainty relies on:** [The assumption that must be true for this decision to work out]
- **Kill switch (reversal condition):** [The specific event, data point, or discovery that would cause the user to abandon or reverse this decision, even mid-execution]

---

## Predicted Outcomes

### Leading Indicators (30-90 days)
| Prediction | Measurable Signal | Target Date | Confidence % | Worst Realistic Case |
|------------|------------------|-------------|--------------|----------------------|
| [specific prediction] | [how to measure it] | [date] | [X%] | [bad but plausible outcome] |
| [specific prediction] | [how to measure it] | [date] | [X%] | [bad but plausible outcome] |

### Medium-Term Outcomes (3-12 months)
| Prediction | Measurable Signal | Target Date | Confidence % | Worst Realistic Case |
|------------|------------------|-------------|--------------|----------------------|
| [specific prediction] | [how to measure it] | [date] | [X%] | [bad but plausible outcome] |
| [specific prediction] | [how to measure it] | [date] | [X%] | [bad but plausible outcome] |

### Terminal Outcomes (1-5 years)
| Prediction | Measurable Signal | Target Date | Confidence % | Worst Realistic Case |
|------------|------------------|-------------|--------------|----------------------|
| [specific prediction] | [how to measure it] | [date] | [X%] | [bad but plausible outcome] |

**Overall decision confidence:** [X]/10
**Confidence rationale:** [Why this score -- what would push it higher, what drives the uncertainty]

---

## Values Alignment Check

**Stated priorities in this life/work domain (top 3):**
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

| Priority | Does chosen option advance this? | Assessment |
|----------|--------------------------------|------------|
| [Priority 1] | [Advances / Neutral / Conflicts] | [explain] |
| [Priority 2] | [Advances / Neutral / Conflicts] | [explain] |
| [Priority 3] | [Advances / Neutral / Conflicts] | [explain] |

**Values-action gap:** [None detected | Gap exists -- describe what was sacrificed and whether it was deliberate]
**Am I optimizing for long-term or short-term?** [Long-term | Short-term | Both -- explain]

---

## Review Schedule

| Review Type | Date | What to Evaluate (Specific Metrics) | Trigger Condition for Early Review | Status |
|-------------|------|------------------------------------|------------------------------------|--------|
| Short-term (leading indicators) | [date, 30-90 days] | [exact metrics and predictions to check] | [kill switch event or unexpected development] | Pending |
| Long-term (outcome assessment) | [date, 6-24 months] | [exact metrics and predictions to check] | [kill switch event or unexpected development] | Pending |

---

## Review Block (complete at each review date)

**Review Date:** _______________
**Days since decision:** _______________
**Reviewing:** [Short-term / Long-term]

### Outcome vs. Prediction
| Original Prediction | Confidence % | Actual Outcome | Hit? (Y/N/Partial) |
|--------------------|--------------|----------------|-------------------|
| [prediction text] | [X%] | [what actually happened] | [Y/N/Partial] |

**Prediction accuracy score:** ___/10
**Overall decision quality rating:** ___/10
*(Note: Separate these two. A bad outcome does not mean a bad decision. A good outcome does not mean a good decision. Rate the quality of the process, not just the result.)*

**What I got right:** _______________
**What I got wrong:** _______________
**What I failed to anticipate:** _______________
**Calibration note:** [Were my confidence percentages too high, too low, or accurate?]
**Would I make the same decision again with the same information available at decision time?** ___
**What would I do differently next time?** _______________
```

---

## Rules

1. **Always produce the complete entry -- never output advice about journaling instead.** If the user says "I should start keeping a decision journal," ask them immediately what decision to journal, then produce the entry. The output is the entry, not a guide to journaling.

2. **Every prediction must be specific, measurable, and time-bound.** Reject formulations like "things should improve" or "I expect it to work out." Ask "work out how exactly, by when, and how will you measure it?" Vague predictions cannot be reviewed -- they just confirm whatever happened.

3. **Always include the null option (do nothing / defer).** If the user says they did not consider it, probe why. If inaction genuinely was not viable, document the reason. A decision journal that only shows the options the user liked is a rationalization document, not a learning instrument.

4. **Confidence percentages must be used for predictions -- not qualitative labels alone.** "High confidence" is ambiguous. 75% confidence is measurable against outcomes. Over time, if the user's "75% confidence" predictions come true 75% of the time, they are well-calibrated. If they come true 95% of the time, they are systematically underconfident. This is the foundation of calibration improvement.

5. **Document the mental and emotional state at decision time even if it feels irrelevant.** Decisions made while anxious, sleep-deprived, socially pressured, or in euphoric excitement have systematically different error profiles. This field is what allows the user to later detect whether their emotional state was a confounding variable.

6. **The kill switch (reversal condition) is mandatory -- never omit it.** A decision with no reversal condition is a commitment made on faith. The kill switch is what separates rational commitment from ego-protection. If the user cannot name a condition that would make them reverse course, probe harder: "What is the single thing that would make you say you made a mistake?"

7. **Never conflate decision quality with outcome quality in the review block.** A decision made with poor information and a lucky outcome is a bad decision that got lucky. A decision made with excellent analysis and an unlucky outcome is a good decision. The review block must rate these separately. Conflating them destroys calibration -- the user learns to repeat lucky processes instead of good processes.

8. **For retrospective entries, always flag and separate remembered reasoning from current reasoning.** Ask the user explicitly: "What do you remember thinking at the time?" and "What do you think now that you know what happened?" These answers must be recorded separately. The journal captures the first; the current view belongs in a review block.

9. **The values alignment check must name actual stated priorities, not aspirational ones.** If the user says "I value family time" but has not actually acted that way in recent decisions, note the pattern. The check is only useful if it reflects real operating values, not idealized self-image.

10. **Entry IDs must follow the YYYY-MM-DD-### format.** This enables the user to build a searchable, sortable decision library over time. Entries without consistent IDs become an unstructured pile of notes that cannot be analyzed in aggregate. If the user is creating their first entry, start at 001. If they have prior entries, ask for the sequence number.

11. **Short-term reviews assess execution and leading indicators only -- not final outcomes.** A decision's ultimate success or failure is rarely visible in 30-90 days. Reviewing too early and updating confidence based on insufficient evidence creates noise. The short-term review exists to catch kill switch conditions and execution failures, not to grade the decision.

12. **If the user assigns an overall confidence of 10/10, flag it explicitly.** A confidence of 10 on any complex, multi-variable decision is an almost certain calibration error. It is appropriate to note this and ask: "What would have to be true for this decision to go wrong? If you can name even one plausible failure mode, your confidence should be below 10."

---

## Edge Cases

### 1. The User is Journaling a Decision Made Weeks or Months Ago

Memory distortion -- specifically hindsight bias and outcome bias -- is the core problem here. Research by Baruch Fischhoff on hindsight bias shows that people systematically misremember their pre-decision uncertainty as lower than it was once they know the outcome.

Handle this by:
- Flagging the entry prominently as RETROSPECTIVE with the number of days since the decision
- Asking two separate questions: "What do you remember thinking at the time?" and "What do you think now?" Record both
- For predictions, ask the user to try to reconstruct their genuine pre-outcome beliefs -- not what they know happened. If they cannot separate these, note that the predictions section may reflect hindsight rather than original foresight
- The entry is still valuable -- it captures the user's current mental model and provides a baseline for future decisions in the same domain
- Do not skip the review block prompts just because the decision is old -- if enough time has passed, offer to fill in the review block immediately based on what the user now knows

### 2. The User Wants to Document a Decision Before Making It (Prospective Entry)

This is arguably the most valuable use case. A prospective entry forces the user to articulate their reasoning before committing -- which often reveals gaps, unstated assumptions, and options not yet considered.

Handle this by:
- Marking the entry clearly as PROSPECTIVE
- Completing all sections except "Chosen option," "Primary reason," and "Decision Date"
- After the options table and values check are complete, use the entry as a decision-forcing prompt: "Now that you see all your options, their steelman arguments, and how they align with your stated priorities -- what do you choose?" This often makes the decision clear
- If the user still cannot decide after completing the entry, the journal has revealed that this is a genuine dilemma requiring further analysis -- redirect to `weighted-decision-matrix` or `pro-con-analysis`
- After the decision is made, return and complete the entry in full

### 3. The User Made a Decision Under Extreme Time Pressure with Minimal Analysis

Do not criticize the decision process in the journal entry. Document the conditions honestly and without judgment.

Handle this by:
- Recording "Emergency / Minimal analysis time available" clearly in the time pressure and information state fields
- Noting what information was and was not available given the time constraint
- Making the kill switch especially prominent -- fast decisions made with limited information need clear reversal conditions more than deliberate decisions do
- Making the short-term review date shorter than usual (14-30 days instead of 90) because fast decisions often need earlier correction
- Noting in the confidence field that confidence is inherently limited when analysis time was constrained -- even if the instinct feels strong

### 4. The User Wants to Review a Past Journal Entry

This is a second-order use of the skill -- not creating an entry, but completing the review block of an existing one.

Handle this by:
- Asking the user to share the original predictions verbatim (do not paraphrase them)
- Completing the Review Block section for each prediction: what was predicted, what actually happened, whether it was a hit
- Calculating a prediction accuracy score: the percentage of predictions that came true, weighted by stated confidence (a 90% confidence prediction that failed is a bigger calibration error than a 50% prediction that failed)
- Separating decision quality (was the process good?) from outcome quality (did it work out?)
- Documenting the calibration lesson: "My 80% confidence claims are actually coming true about 60% of the time -- I am overconfident in this domain"
- Never editing or revising the original entry content -- all review material goes in the Review Block only

### 5. The User Cannot Name More Than One Option

This usually signals one of three things: the user made an impulsive decision and did not consider alternatives, the user is framing the decision as "do X or not" when there are richer options available, or the user genuinely faced a situation where only one option was viable.

Handle this by:
- Probing with: "Was there a version of this decision that was more conservative? More aggressive? That involved waiting?" This usually surfaces at least one or two additional options
- Always inserting the null option (do nothing, defer, or maintain status quo) as a documented option even if it was not seriously considered
- If after probing the user genuinely had only one viable option, note this in the rationale: "This was not a selection between alternatives -- it was a decision to act on the only available path. The journal records the context and reasoning for executing the action."
- A single-option entry is still valuable -- it documents the triggering conditions, the user's state, and the predictions. Do not refuse to create the entry just because alternatives were limited.

### 6. The User Wants to Journal a Group Decision or One They Participated In (But Did Not Control)

Decision journals are traditionally individual instruments. Group decisions introduce additional dynamics.

Handle this by:
- Documenting the user's individual reasoning and vote/preference before recording the group outcome
- Noting whether the user advocated for their view or deferred to group pressure -- this is important for calibration (if the user consistently suppresses their views and the group is consistently wrong, that is a pattern worth noticing)
- Recording the group's stated rationale separately from the user's personal rationale
- Setting the review to evaluate both the group outcome and whether the user's individual prediction was more accurate than the group's
- Noting any groupthink dynamics, authority bias, or anchoring effects that were present in the discussion

### 7. The User Reports a Confidence Score of 9-10 Out of 10

A very high confidence score is a significant data point that requires acknowledgment, not silent acceptance.

Handle this by:
- Explicitly noting: "A confidence score of 9-10/10 on a complex decision is unusual and worth examining. This is not a criticism -- it may be justified. Let's verify."
- Asking: "What is the most plausible way this decision could go wrong?" If the user can name even one realistic failure path, a score below 9 is more accurate
- Asking: "Have you made similar decisions in the past at this confidence level? How often did they work out as predicted?" This connects the current confidence to historical calibration
- If the user insists on 9-10 after this check, document it as stated but add a flag: "High confidence noted -- review calibration at scheduled review date"

### 8. The User's Decision Involves a Dependent Variable That Has Not Yet Been Confirmed

For example: "I decided to accept the job offer -- but I haven't gotten final confirmation on the salary yet" or "I decided to start the project -- but the budget hasn't been approved."

Handle this by:
- Documenting the decision as made, but flagging the unconfirmed dependency explicitly in the "Least confident about" and "Unknown but knowable" fields
- Adding a conditional kill switch: "If [unconfirmed variable] resolves as [unfavorable outcome], this decision is reversed"
- Setting an interim check before the first scheduled review date -- specifically to confirm whether the dependency resolved favorably
- Noting that the decision confidence score is partially suspended pending confirmation of the dependency

---

## Example

**Input:** "I just accepted a job offer at a smaller startup instead of staying at my current company where I was up for a promotion. I made the decision yesterday. I want to document it properly."

**Output:**

---

# DECISION JOURNAL ENTRY

## Entry Header
- **Entry ID:** 2024-11-15-001
- **Entry Type:** Contemporaneous (documented 1 day after decision -- high fidelity)
- **Decision Date:** November 14, 2024
- **Documented Date:** November 15, 2024
- **Decision Statement:** "I decided to accept the Series B startup offer rather than remain at my current employer and pursue the internal promotion on November 14, 2024."
- **Domain:** Career
- **Reversibility:** Difficult to reverse -- accepting start date commits me; withdrawing the acceptance would burn the offer and damage reputation at the startup. The internal promotion track would likely close permanently.

---

## Context

### Situation
- **Trigger type:** Opportunity arrival combined with deadline pressure
- **Trigger description:** The startup offer arrived with a 72-hour acceptance window that overlapped with my employer's informal promotion cycle. Waiting for more certainty on the internal promotion was not viable within the offer window.
- **Time pressure:** Hard external deadline -- offer expired November 15 at 5pm

### Information State at Decision Time
- **Known:** Startup offer details (title: Senior Product Manager, base salary: $145K, equity: 0.15% vesting over 4 years, 40-person company, Series B of $22M closed 6 months ago). Current company salary: $118K. Promotion if received would likely bring base to approximately $128-132K with no equity.
- **Unknown but knowable (if I had more time):** Startup's burn rate and runway length. More detailed cap table to understand equity dilution. References from current startup employees beyond the two I spoke with. Whether my employer would have matched or accelerated my promotion timeline if I raised the external offer.
- **Fundamentally unknowable:** Whether the promotion would have materialized (it was informal and not guaranteed). Startup's probability of successful exit or IPO. Whether the market for my skill set will remain strong in 24 months.
- **Information quality rating:** Partially informed -- sufficient on role and compensation, significant gaps on startup financial health and equity value

### Decision Maker State
- **Mental/emotional state:** Excited by the opportunity, moderately anxious about the financial risk, slightly fatigued from a compressed decision window
- **Social influence present?** Yes -- a former mentor encouraged the startup move strongly. I gave this more weight than I should have without independently validating his view. Note this for review calibration.
- **Memory note:** Decision was made yesterday. Memory is fresh. This is a contemporaneous entry.

---

## Options Considered

| # | Option | Steelman (Best Argument For) | Strongest Objection Against | Rejection Reason | Status |
|---|--------|-----------------------------|-----------------------------|-----------------|--------|
| 1 | Accept startup offer | Higher immediate comp, equity upside, faster scope of impact at a smaller company, forces new skill development | Startup risk is real -- ~65% of Series B companies do not reach exit; equity may be worth nothing; less stability | -- | **CHOSEN** |
| 2 | Decline startup, wait for internal promotion | Known entity, promotion track record at this employer is solid, lower financial risk, no disruption | Promotion is informal and not guaranteed; comp ceiling is lower; limited equity; I have been frustrated with the pace here for 18 months | Promotion is not certain, the comp gap is too large to ignore, and I am already dissatisfied with growth rate | Rejected |
| 3 | Negotiate with startup for more equity before deciding | Could improve the upside meaningfully -- 0.15% is on the lower end for a Series B PM hire | Risky -- startup had already said the equity band was fixed; could have withdrawn the offer | Employer signaled firm equity band during initial negotiation; risk of losing the offer outweighed potential equity gain | Rejected |
| 4 | Do nothing / ask for extension on offer deadline | Could have used 2+ more weeks to research startup financials and test internal promotion prospects | Startup was clear that the window was firm; inaction would have effectively meant declining | Extension was not a viable option; inaction was equivalent to rejection given the 72-hour window | Rejected |

**Note:** The null option (do nothing) was considered but was functionally equivalent to declining the offer given the hard deadline.

---

## Decision Rationale

- **Chosen option:** Accept the Series B startup offer
- **Actual deciding factor (tiebreaker):** The honest tiebreaker was not the salary difference. It was the recognition that I have been dissatisfied at my current employer for 18 months and have been rationalizing staying because of promotion possibility. The startup offer forced me to admit that I would not be happy even if the promotion materialized. The offer was the forcing function, not the destination.
- **Most confident about:** The role itself is a strong fit -- I have reviewed the product, spoken to the CEO and two team members, and the PM scope is broader than anything available to me at my current employer. This is the claim I would defend under cross-examination.
- **Least confident about:** The startup's runway and financial health. I know they closed a $22M Series B six months ago, but I do not know their burn rate. If they are burning $1.5M/month, they have roughly 14 months of runway -- which is uncomfortably close to my 4-year equity vest cliff. I am relying on the assumption that they will either extend runway or raise additional capital before exhausting Series B funds.
- **Primary uncertainty relies on:** Startup raises a Series C or achieves cash-flow positivity before running out of runway. This is load-bearing for the equity value and for job security beyond 18 months.
- **Kill switch (reversal condition):** If within 90 days I discover the startup is burning faster than $1.5M/month without a credible plan to raise Series C or cut burn, I will begin a confidential job search immediately rather than waiting for a potential layoff.

---

## Predicted Outcomes

### Leading Indicators (30-90 days)
| Prediction | Measurable Signal | Target Date | Confidence % | Worst Realistic Case |
|------------|------------------|-------------|--------------|----------------------|
| I will be fully onboarded and have a clear 90-day product roadmap ownership | Delivered first roadmap presentation to stakeholders | Feb 14, 2025 | 80% | Onboarding is disorganized; no clear owner accountability; I am still scrambling for context at day 90 |
| The team and culture match the interview impression | I would recommend the company to a trusted peer after 60 days | Jan 14, 2025 | 75% | Culture is more chaotic and less collaborative than presented; early-stage dysfunction is disguised as "moving fast" |

### Medium-Term Outcomes (3-12 months)
| Prediction | Measurable Signal | Target Date | Confidence % | Worst Realistic Case |
|------------|------------------|-------------|--------------|----------------------|
| I am owning a product surface that ships 2+ meaningful features to production | Shipped features are live and measurable | Nov 14, 2025 | 70% | Company pivots or deprioritizes my product area; I spend the year in planning without shipping |
| The startup raises Series C or demonstrates credible path to profitability | Public funding announcement or internal financial update showing >18 months runway | Nov 14, 2025 | 55% | Series C is not raised; company enters cost-cutting mode within 12 months; layoff risk rises substantially |
| Total compensation including equity annualized value is higher than my previous employer's promotion-track trajectory | Annual base + equity fair market value exceeds $165K annualized | Nov 14, 2025 | 60% | Equity is underwater or unvested cliff is still far away; total comp is only marginally better than the promotion I passed up |

### Terminal Outcomes (1-5 years)
| Prediction | Measurable Signal | Target Date | Confidence % | Worst Realistic Case |
|------------|------------------|-------------|--------------|----------------------|
| The startup reaches a liquidity event (acquisition or IPO) within 5 years and my equity is worth at least $200K | Actual liquidity event with equity payout | Nov 14, 2029 | 35% | Company shuts down, is acqui-hired at a minimal valuation, or I leave before the 4-year vest cliff -- equity worth near zero |
| This role is the catalyst for a Director/VP of Product role within 3 years | Promoted or recruited to VP-level role by 2027 | Nov 14, 2027 | 65% | The startup stagnates; I leave in 18 months with modest resume improvement but without the career acceleration I anticipated |

**Overall decision confidence:** 7/10
**Confidence rationale:** Strong conviction on role fit and the growth opportunity. Significant uncertainty on startup financial health, equity value, and long-term trajectory. The 7 reflects genuine optimism tempered by the information gaps I was unable to close in 72 hours. A 9 would require seeing the cap table and burn rate; I do not have that yet.

---

## Values Alignment Check

**Stated priorities in this life/work domain (top 3):**
1. Career growth rate and scope expansion -- moving faster than a large company allows
2. Financial security -- building meaningful savings and net worth
3. Intellectual challenge -- working on genuinely hard product problems

| Priority | Does chosen option advance this? | Assessment |
|----------|--------------------------------|------------|
| Career growth rate | Advances | Startup scope is broader; decision-making cycle is faster; I will own more with less committee overhead |
| Financial security | Mixed | Base salary is higher ($145K vs. $118K current, vs. ~$130K estimated promotion). But equity is speculative. Short-term financial security improves; long-term remains uncertain |
| Intellectual challenge | Advances | The product problem is genuinely novel; current employer's PM work has become incremental and predictable |

**Values-action gap:** Minor gap exists. I say I value financial security, but I made a choice with meaningful financial risk (equity uncertainty, startup stability). This gap is deliberate -- I am accepting short-term uncertainty in exchange for potential long-term upside. I am treating career growth as the dominant priority here, which is the honest operating value even if financial security sounds more responsible.
**Am I optimizing for long-term or short-term?** Long-term -- this decision trades short-term certainty for long-term career trajectory and financial upside

---

## Review Schedule

| Review Type | Date | What to Evaluate (Specific Metrics) | Trigger for Early Review | Status |
|-------------|------|------------------------------------|-----------------------------|--------|
| Short-term (90 days) | February 14, 2025 | Onboarding quality, roadmap ownership achieved, culture assessment (1-5 scale), burn rate information obtained, kill switch condition check | Discovery that startup burn rate exceeds $1.5M/month without credible Series C path | Pending |
| Long-term (12 months) | November 14, 2025 | Feature shipping record, Series C status, total comp vs. benchmark, regret rating (1-10), would I recommend this company to a peer | Layoff or restructuring event; formal acquisition offer | Pending |

---

## Review Block (complete at each review date)

**Review Date:** _______________
**Days since decision:** _______________
**Reviewing:** [Short-term / Long-term]

### Outcome vs. Prediction
| Original Prediction | Confidence % | Actual Outcome | Hit? (Y/N/Partial) |
|--------------------|--------------|----------------|-------------------|
| [prediction text] | [X%] | [what actually happened] | [Y/N/Partial] |

**Prediction accuracy score:** ___/10
**Decision quality rating (separate from outcome quality):** ___/10
*(Was the process good, given what I knew at the time? Rate independently of outcome.)*

**What I got right:** _______________
**What I got wrong:** _______________
**What I failed to anticipate entirely:** _______________
**Calibration note:** [Were my confidence percentages too high, too low, or well-calibrated?]
**Would I make the same decision again with the same information available on November 14, 2024?** ___
**What would I do differently in my decision process?** _______________
