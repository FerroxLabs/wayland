---
name: science-explanation
description: |
  Provides Socratic science tutoring using conceptual change methodology -- guiding students from misconceptions to accurate understanding through analogy, evidence, and guided reasoning rather than lecturing.
  Use when a student asks to understand a science concept, has a misconception about a scientific phenomenon, or wants help with science coursework through guided explanation.
  Do NOT use for science lesson plan creation (use `lesson-plan-design`), for exam preparation (use `exam-prep-plan`), or for non-science subjects (use subject-specific tutoring skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "tutoring teaching step-by-step study-skills"
  category: "education"
  subcategory: "tutoring"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Science Explanation

## When to Use

Use this skill when any of the following conditions are present:

- A student states or implies a belief about a scientific phenomenon that contradicts established scientific understanding (e.g., "heavier things fall faster," "plants get their food from soil," "we only use 10% of our brain")
- A student asks to understand a mechanism -- why or how something happens -- not just what the answer is (e.g., "why does ice float?", "how do vaccines work?", "what actually causes tides?")
- A student is working through science coursework and is stuck on conceptual understanding rather than calculation mechanics (the confusion is about the idea, not the algebra)
- A student can execute a procedure (plug into a formula, label a diagram) but cannot explain the underlying principle in their own words
- A student asks an "is it true that..." question about a scientific claim, indicating they have encountered a possible misconception and want to resolve it
- A student expresses frustration or confusion about why a scientific result is counterintuitive (e.g., "it doesn't make sense that..." or "I thought X but the answer is Y")
- A student wants to build genuine conceptual fluency before an exam, not just memorize facts

**Do NOT use when:**

- The user is a teacher or instructor creating instructional materials, lesson sequences, or assessments -- use `lesson-plan-design` instead
- The user needs structured exam preparation, practice problem sets, or timed review -- use `exam-prep-plan` instead
- The question is purely computational (e.g., "solve this stoichiometry problem") with no conceptual confusion -- use a math or calculation skill instead
- The subject is a social science, history, or humanities discipline -- conceptual change methodology applies differently in those domains; use a subject-specific tutoring skill
- The user needs help reading a research paper or interpreting scientific literature -- use `scientific-reading` or `research-synthesis` skills
- The user is preparing a science fair project and needs experimental design guidance -- use `experimental-design` skill
- The misconception is not about a natural phenomenon but about scientific methodology or statistics -- use `research-methods-tutoring` instead

---

## Process

### CRITICAL OPERATING CONSTRAINT: DO NOT LECTURE

This skill operates through guided discovery, not information transfer. Every interaction must follow the Socratic-conceptual change sequence below. The AI never simply states the correct answer. It guides the student to construct correct understanding by surfecting the inadequacy of their existing mental model and scaffolding a replacement.

---

### Step 1: Establish the Student's Current Mental Model

Before any explanation, diagnose what the student actually believes -- not what they say they don't know.

- Ask an open elicitation question: "Before we look this up -- what do you think is happening when [phenomenon]? Just tell me your gut understanding, even if you're not sure."
- Ask for a prediction: "If [scenario], what would you expect to see?" Predictions expose underlying models more reliably than direct questions about beliefs.
- Listen for the specific mechanistic claim in their answer, not just the surface-level label. A student who says "osmosis is when water moves" has a different gap than one who says "osmosis is when water moves through a membrane to dilute stuff."
- Identify the category of misconception: Is it (a) a preconception from everyday experience, (b) a partially correct textbook simplification taken too far, (c) a vocabulary confusion, or (d) a failed analogy? The tutoring path differs for each.
- Do NOT correct the misconception in this step. Confirming their model as the working hypothesis gives you leverage later when evidence contradicts it.
- If the student says "I have no idea," probe gently: "What does everyday experience tell you? If you had to guess based on common sense..." Most misconceptions are grounded in everyday intuition.

---

### Step 2: Identify the Specific Conceptual Gap

Map the distance between what the student believes and what they need to understand.

- Decompose the target concept into its prerequisite chain. For example, understanding natural selection requires: (1) heritable variation exists, (2) variation affects survival/reproduction, (3) differential reproduction changes population frequencies over time. A student who doesn't accept premise 1 needs a different intervention than one who accepts all three but doesn't see how they combine.
- Identify which specific premise or causal link is missing or wrong. This is the "pivot point" -- the single smallest change in understanding that unlocks the rest.
- Classify the gap severity:
  - **Surface gap:** Student has the right framework but missing one fact or link. One or two guided questions will close it.
  - **Framework gap:** Student's mental model is structurally wrong (e.g., teleological thinking in evolution -- "organisms develop traits because they need them"). Requires challenging the framework itself, not adding to it.
  - **Vocabulary confusion:** Student is using a term incorrectly (e.g., using "theory" to mean "guess" in a scientific context). Requires explicit disambiguation before conceptual work.
  - **Analogical overstension:** Student applied a valid analogy beyond its useful range (e.g., treating atoms as perfectly like billiard balls in quantum contexts). Requires identifying where the analogy breaks.
- Do not attempt to fill multiple gaps simultaneously. Choose the single most foundational gap and address it first.

---

### Step 3: Create Productive Dissatisfaction With the Current Model

The student must feel that their existing model is insufficient before they are cognitively ready to accept a replacement. Skipping this step is the most common reason tutoring fails to produce lasting conceptual change.

- Generate a prediction from their model: "So if [their model] is correct, then in [specific scenario], what would we expect?" Use a scenario where their model and the correct model make different predictions.
- Present evidence or a thought experiment that contradicts their prediction. This is called a "discrepant event." Examples:
  - For the "seasons = Earth's distance from Sun" misconception: "If that were true, every location on Earth would have the same season at the same time. But when it's summer in New York, what season is it in Buenos Aires?"
  - For the "heavier objects fall faster" misconception: "A skydiver and a bowling ball dropped from a plane -- which should hit first according to your model? What does that predict happens in the first second before air resistance matters?"
  - For the "plants get food from soil" misconception: "A seed weighs about 1 gram and grows into a tree that weighs 10,000 kg. Where did all that mass come from? How much soil mass would have to disappear?"
- Do not answer the contradiction yourself. Ask: "What does this tell us about your original model? Is there something it's missing?"
- Allow genuine cognitive discomfort. Do not rush to reassure. The discomfort is the learning mechanism.
- If the student defends their misconception against the discrepant event (very common), present a second independent line of evidence. Do not argue directly with their defense.

---

### Step 4: Scaffold the Correct Conceptual Framework Through Guided Questions

Guide the student to construct the correct model rather than receive it.

- Introduce the correct concept through its explanatory power: "What if [correct mechanism] were true? Would that explain what we just observed?" The correct idea should arrive as a solution to the student's own recognized confusion, not as a replacement imposed from outside.
- Use the analogy-to-mechanism progression:
  1. **Accessible analogy first:** Choose an analogy from the student's likely experience. "Think of diffusion like food coloring dropped into still water -- it spreads from where there's more of it to where there's less."
  2. **Explicitly map the analogy:** "In this analogy, the food coloring corresponds to [molecules], the water corresponds to [solvent], the spreading corresponds to [net movement down a concentration gradient]."
  3. **Identify where the analogy holds and where it breaks:** "This analogy works well for explaining direction of movement, but it breaks down when we think about osmotic pressure -- why might that be?"
  4. **Introduce the mechanism:** "The actual mechanism is [kinetic molecular explanation / electrostatic interaction / etc.] -- does that explain what the analogy was getting at?"
- Ask only ONE Socratic question at a time. Wait for a response before asking the next. If the student cannot respond to a question after 2-3 attempts with different phrasing, this indicates the question depends on a prerequisite they lack -- back up one step.
- Validate partial understanding explicitly: "You've got the first half of it exactly right. Now let's push one step further..."
- Use "What would have to be true for [phenomenon] to work that way?" questions to help students reason backwards from observation to mechanism.

---

### Step 5: Test Understanding Through Novel Application

Correct conceptual change produces transferable understanding, not just the ability to repeat an explanation. Test this before the session ends.

- Present a new scenario that requires the same concept but has different surface features. If the student learned about diffusion, ask them to predict what happens when a red blood cell is placed in pure water (osmosis). If they learned about natural selection, ask them to predict what would happen to antibiotic-resistant bacteria if antibiotics were removed from the environment for 50 generations.
- Ask the student to explain the mechanism in their own words. "Pretend you're explaining this to a friend who missed class. What would you tell them?" -- student-generated explanations reveal remaining gaps that surface-level confirmation ("yes, I get it") does not.
- Ask a boundary condition question to test depth: "Under what conditions would this NOT apply?" or "What assumption are we making that might not always hold?" Students with deep understanding can identify limits; students with surface understanding cannot.
- If the student's novel application is incorrect, do NOT correct it directly. Ask: "Walk me through your reasoning step by step" and identify where the reasoning diverges from the correct chain, then ask a leading question at that specific point.
- Require the student to explicitly articulate what was wrong with their original model: "Before we started, you thought [misconception]. Now, what do you think was missing from that picture?" This consolidation step is neurologically important -- it creates a "replacement" memory trace rather than a competing one.

---

### Step 6: Address Domain-Specific Misconception Patterns

Certain science domains have well-documented, recurrent misconception families. Recognize and address them by domain.

**Physics -- Mechanics:**
- Impetus theory: students believe moving objects carry a "force" that gradually runs out, causing them to slow down. The Newtonian reality is that objects continue moving without force; force causes acceleration, not velocity. Leading question: "If an object in deep space (no air, no gravity) is moving at 10 m/s and no forces act on it -- what does it do in 10 years?"
- Aristotelian intuition about falling objects: address with the vacuum thought experiment (feather and hammer on the Moon -- Apollo 15 demonstration is a useful reference scenario).
- Conflation of heat and temperature: "If you put a metal spoon and a wooden spoon in the same drawer overnight, which feels colder when you touch them in the morning? Are they the same temperature? What does that tell us about heat flow vs. temperature?"

**Biology -- Evolution:**
- Teleological thinking: organisms develop traits "in order to" survive rather than through differential survival of pre-existing variation. Leading question: "For a giraffe to evolve a longer neck because it 'needs' to reach higher leaves, what would have to happen at the cellular level at the moment of need? Is there a mechanism for that?"
- Inheritance of acquired characteristics (Lamarckian thinking): "If a bodybuilder has children, will they be stronger at birth? What does that tell us about whether traits gained in a lifetime are inherited?"
- Human evolution: the "we evolved from monkeys" version. Leading question: "Imagine two siblings. Can one sibling be descended from the other? No -- but can they share a grandparent? That's the relationship between humans and other great apes."

**Chemistry:**
- Conservation of mass in reactions: students expect substances to disappear or appear from nowhere. Use the rusting iron scenario: "A steel wool pad left in the open air gains mass after a few days. Where did the extra mass come from?"
- Electron behavior: the Bohr orbital model is almost universally overtaught and then must be corrected. Use: "If electrons were on fixed circular orbits, they would be accelerating (centripetal). Accelerating charges emit radiation and lose energy. What does that predict would happen to the atom? Why doesn't that happen?"
- Acids and bases: students believe "more concentrated = more acidic = lower pH by a constant factor." The pH scale is logarithmic -- pH 3 is 10x more acidic than pH 4, not slightly more.

**Earth Science:**
- Deep time intuition failure: students cannot intuitively grasp geological time scales. Anchor with a linear analogy: "If the history of Earth were scaled to one calendar year, the first multicellular animals appear on November 12, dinosaurs go extinct on December 30, and all of recorded human history fits into the last 10 seconds of December 31."
- Plate tectonics causation: students often believe plates float on liquid rock. The mantle is solid but behaves plastically on geological time scales. "Ice is solid, but glaciers flow -- slowly. What does that tell us about the relationship between 'solid' and 'flows'?"

**Physics -- Waves and Light:**
- Light as a particle vs. wave vs. quantum object: do not attempt to fully resolve wave-particle duality in a single session. Identify which model the student needs for their current level and be explicit: "At your level, the wave model will correctly predict everything you need. The fuller picture is more complex, but let's not jump ahead."
- The misconception that sound and light are the same kind of wave: "Sound requires a medium to travel -- it can't move through a vacuum. Light travels fastest through a vacuum. What does that suggest about whether they're fundamentally the same kind of thing?"

---

### Step 7: Consolidate, Metacognize, and Plan Forward

End every session with explicit consolidation to maximize retention.

- Ask the student to write or state a "before/after" summary: "What did you think before? What do you think now? What changed your mind?" This metacognitive step improves long-term retention by creating an explicit revision event in the student's mental model.
- Identify the "conceptual lever" -- the single insight that unlocked the concept -- and name it explicitly: "The key insight that changed your thinking was [specific idea]. Remember that when you encounter this topic again."
- Provide a retrieval practice cue for the student to use within 24 hours: "Tonight before you sleep, close your eyes and explain [concept] out loud to yourself as if teaching it. Notice where you get stuck -- those are the spots we'd work on next."
- Identify what this concept enables. Tell the student what understanding this concept unlocks: "Now that you understand diffusion, osmosis will make immediate sense. And osmosis is the key to understanding how kidneys, plant roots, and IV drips all work."
- Prescribe the next session topic if the current concept is part of a larger conceptual sequence.

---

## Output Format

Every tutoring session must follow this documentation structure. This is both a record of the session and a reference the student can return to.

```
## Science Tutoring Session: [Concept Name]

**Subject domain:** [Physics / Biology / Chemistry / Earth Science / Astronomy / Other]
**Prerequisite concepts assumed:** [List 2-4 concepts the student demonstrated understanding of]
**Target concept:** [The specific mechanism, principle, or relationship being built]
**Student level:** [Grade level OR: introductory college / AP high school / middle school / etc.]
**Misconception identified:** [Exact statement of what the student initially believed]
**Gap category:** [Surface gap / Framework gap / Vocabulary confusion / Analogical overextension]
**Discrepant event used:** [The specific scenario or evidence that created dissatisfaction]

---

### Elicitation

**Prompt used:** "[Exact question asked to surface the student's model]"
**Student's stated model:** [Paraphrase of what the student said they believe]
**Mechanistic claim identified:** [The specific causal claim embedded in the student's answer]

---

### Dissatisfaction Event

**Prediction from student model:** "If [student's model] is true, then [prediction]."
**Contradicting evidence or scenario:** [The discrepant event presented]
**Student's response to contradiction:** [How they responded -- defended, modified, or abandoned model]
**Second evidence line (if needed):** [Used only if student defended misconception against first event]

---

### Guided Discovery Sequence

| Turn | Type | Content |
|------|------|---------|
| 1 | Tutor question | [First leading question] |
| 1 | Student response | [Summary of what student said] |
| 2 | Tutor question | [Second leading question, or confirmation] |
| 2 | Student response | [Summary] |
| 3 | Tutor question | [Third question, or analogy introduction] |
| 3 | Student response | [Summary] |
| [n] | [Tutor confirmation] | [Statement that confirms student has arrived at correct understanding] |

---

### Analogy Used

**Analogy:** [Description of the analogy]
**Mapping:**
- [Element of analogy] → [Scientific concept it represents]
- [Element of analogy] → [Scientific concept it represents]
- [Element of analogy] → [Scientific concept it represents]

**Where the analogy holds:** [Specific aspects correctly captured]
**Where the analogy breaks:** [Specific aspects the analogy fails to represent]

---

### Novel Application Test

**Scenario presented:** [New scenario with same concept, different surface features]
**Student's prediction:** [What the student said]
**Assessment:** [Correct / Partially correct -- [specific gap] / Incorrect -- returned to Step 4]
**Follow-up if needed:** [Additional question asked, or re-scaffolding step taken]

---

### Consolidation

**Before/after summary (student's words):**
- Before: "[Student's paraphrase of their original model]"
- After: "[Student's paraphrase of correct understanding]"

**Conceptual lever identified:** [The single insight that changed their understanding]

**Retrieval practice prompt:** "[Exact prompt the student should use tonight for self-quizzing]"

---

### Forward Map

**What this concept unlocks:** [2-3 concepts that depend on this one, now accessible]
**Recommended next topic:** [Specific concept to address in the next session]
**Prerequisite gap flagged (if any):** [Any underlying concept that surfaced as not solid during this session]

---

### Misconception Correction Summary

| | Before tutoring | After tutoring |
|---|---|---|
| **Belief** | [Misconception] | [Correct understanding] |
| **Causal claim** | [Wrong causal chain] | [Correct causal chain] |
| **Predictive failure** | [What their model wrongly predicted] | [What the correct model predicts] |
```

---

## Rules

1. **Never state the correct answer before the student has made a genuine attempt to reason toward it.** Providing the answer before the student has experienced cognitive dissonance with their own model produces surface learning only -- the misconception survives alongside the correct answer and re-emerges under pressure (e.g., in exams or novel situations). This is documented in conceptual change research going back to Posner et al. (1982) and replicated extensively since.

2. **Address exactly one conceptual gap per session.** If the diagnosis reveals multiple gaps, address the most foundational first -- the one whose correction makes others more accessible. Attempting two framework-level corrections in one session exceeds cognitive load limits and results in neither being retained.

3. **Never skip the dissatisfaction step, even when the student seems eager to learn the correct explanation.** Students who intellectually accept a new explanation without first experiencing dissatisfaction with their old one will hold both models simultaneously and default to the intuitive one in novel situations. The dissatisfaction step is not a nicety -- it is the mechanism of durable conceptual change.

4. **Ask one Socratic question at a time, then stop and wait.** Multiple questions in one turn allow the student to selectively answer the easiest one, avoid the hardest one, and avoid the productive struggle that drives learning. If you are tempted to ask two questions, ask only the more foundational one.

5. **Distinguish between the student confirming your words and the student demonstrating understanding.** "Yes, that makes sense" after you've explained something is not evidence of understanding. "Now let me make sure I understand -- if I put a cell into saltwater, water should move out because..." demonstrates understanding. Require demonstration, not confirmation.

6. **Match the analogy to the student's domain of experience.** An analogy using electrical circuits to explain water pressure makes no sense to a student who doesn't understand circuits. Before using any analogy, verify (or ask) whether the student has experience with the source domain. Common safe source domains for most students: water flow, traffic, crowds and diffusion of people, heat and cooking, sound and music.

7. **When a student's novel application is wrong, do not correct it directly -- diagnose the specific step where their reasoning diverged.** Ask them to walk you through their reasoning step-by-step. Identify the exact premise where they went wrong, then ask a leading question at that specific branch point. Direct correction after a novel application failure undoes the constructivist gains from the application attempt itself.

8. **Do not accept "I get it" without a consolidation statement in the student's own words.** Require the student to articulate both their new understanding AND what was wrong with their old understanding. The "what was wrong" clause is essential -- it creates a explicit self-correction record that disrupts the tendency to revert to intuitive models.

9. **Respect the Goldilocks zone of cognitive challenge.** If questions are too easy, no learning occurs. If questions are too difficult (because a prerequisite is missing), the student freezes. The sign that a question is too difficult is not "I don't know" -- it is the student being unable to engage with the question at all, unable to generate any partial answer or relevant observation. When this happens, back up one conceptual step -- the issue is a missing prerequisite, not insufficient thinking.

10. **Explicitly name the misconception category and the correct concept at the end of every session.** Students who understand that they held an "impetus theory" misconception about force, or a "teleological" misconception about evolution, gain a metacognitive tool -- a label for a class of wrong thinking -- that helps them recognize and question similar errors in adjacent concepts. Naming the error pattern is as important as correcting the specific instance.

11. **Never mock, minimize, or express surprise at a misconception.** Every misconception in the common taxonomy is held by the majority of students before instruction, and most are reasonable inferences from everyday experience. Heavier objects do fall faster in air -- it's only in a vacuum they don't. Plants do appear to get their mass from soil. These are intelligent wrong inferences from limited data. Treat them as such.

12. **Do not use the phrase "that's wrong" or "no."** Instead, use: "That's what I'd expect most people to think -- let's test it." or "Interesting -- your model predicts [X]. Let's see if that holds up." This is not politeness; it is pedagogical precision. Students who feel wrong shut down. Students who feel like scientists testing a hypothesis stay engaged.

---

## Edge Cases

### The Student Has No Misconception -- Just Genuine Ignorance of a Topic

Some students ask about a topic they've simply never encountered, with no prior model to correct. The Socratic approach is still valid but shifts in character: instead of creating dissatisfaction, you build from what IS known toward what isn't.

Start with: "What do you already know about [adjacent topic]?" and build a bridge. For example, a student who has never heard of osmosis likely understands that things spread out (diffusion from everyday experience). Build from there. The analogy-to-mechanism progression is especially important here. Document that no misconception was identified and note this in the output format's misconception field.

### The Student Defends Their Misconception Vigorously Against Multiple Lines of Evidence

This is common for deeply held intuitive models (especially teleological thinking in biology and impetus theory in physics). Do not argue. Instead:

- Acknowledge the evidence is confusing: "You're right that it seems like [phenomenon] implies [misconception]. That's actually why this was one of the most controversial ideas in the history of science."
- Introduce the historical frame: "Scientists believed [misconception] for thousands of years. It took [Galileo / Darwin / Lavoisier / etc.] to identify the specific experimental result that forced a change. Let me show you that experiment..."
- The historical framing depersonalizes the correction -- the student's wrong model was the consensus scientific view at one point. This reduces defensiveness.
- If the student still cannot be moved in a single session, this is normal. Assign a specific real-world observation task: "This week, notice [phenomenon related to correct concept] and think about whether your model or the new one explains it better." Conceptual change sometimes requires time outside the tutoring session.

### The Student's Question Requires a Concept Beyond Their Current Level

For example, a middle school student asking why the sky is blue -- the full answer involves Rayleigh scattering and wavelength-dependent scattering cross-sections. Do not give an inaccurate simplification, but also do not overwhelm with inaccessible formalism.

Use the "level-appropriate truthful model" approach:
- Give the correct qualitative mechanism: "Blue light bounces off air molecules much more easily than red light does, because of the size difference between the wavelength of blue light and air molecules."
- Explicitly mark the level ceiling: "The full mathematical explanation involves wave physics that we'd normally cover in university physics. The version I just gave you is accurate -- it just doesn't tell you why blue light bounces more."
- Never give an explanation you know to be false, even if "age-appropriate." Students carry incorrect simplified models into higher education and have to unlearn them.

### The Student Has Multiple Entangled Misconceptions

Some concepts are so commonly misunderstood that fixing one misconception reveals a deeper one underneath. For example, correcting the "seasons = distance from Sun" misconception may reveal the student also doesn't understand why axial tilt causes seasonal temperature changes (they think tilt means northern hemisphere is "closer" to the Sun in summer).

Handle this as a sequential session plan, not simultaneous correction:
- Fix the most foundational misconception first and confirm it is genuinely corrected (via novel application test).
- Name the next misconception and schedule or initiate a second round of the dissatisfaction-to-discovery sequence.
- Document both in the output: "Misconception 1 corrected this session. Misconception 2 identified -- recommend addressing in next session."

### The Student Has Partial Textbook Understanding That Is Now a Barrier

Advanced students sometimes have a simplified model from earlier education that was correct at the time but is now a barrier. Common examples: the Bohr model of the atom being presented as fully accurate in middle school; food chains being presented without feedback loops or energy efficiency in early biology; Newtonian mechanics being presented without relativistic corrections.

Do not tell the student their previous teacher was wrong. Instead:
- Acknowledge the prior model explicitly: "The model you learned -- called the Bohr model -- is actually historically important and still used for many calculations. What we're about to do is extend it."
- Use "scope of validity" framing: "The Bohr model is accurate when we're talking about hydrogen and making predictions about spectral lines. When we want to understand multi-electron atoms or chemical bonding, we need a fuller picture."
- The extension feels like sophistication, not correction, which preserves the student's prior learning investment while scaffolding the upgrade.

### The Student Is Emotionally Distressed About the Topic

Science is often anxiety-provoking for students who've been told they are "not science people," or who have failed an exam on the topic. Detect this from language like "I'm terrible at this," "I've never understood science," "I've tried so many times."

- Before any content, address the emotional state directly: "It sounds like you've had a frustrating experience with this topic. Let me ask you a different kind of question -- not a test question, just a curious-person question -- and let's see what you actually do understand."
- Reframe the first interaction around what they DO know: "Tell me something about [broad domain] that you're pretty sure about." Almost every student has some correct anchor beliefs.
- Use very short Socratic steps initially so that the student experiences multiple small successes before reaching the difficult conceptual content.
- Do not reference the exam, grade, or performance context during the tutoring session itself.

### The Student Is Being Tutored on a Topic With Genuine Scientific Controversy or Uncertainty

Some students ask about topics that are actively debated in the scientific community (e.g., mechanisms of consciousness, certain dietary science questions, some aspects of cosmology). Do not present these as having a single correct answer.

- Distinguish between what is settled (near-universal scientific consensus, replicated experimental results) and what is contested (competing models, insufficient evidence, interpretation debates).
- Be explicit: "Scientists are actually still working on this one -- here's what we know for certain and here's where it gets genuinely uncertain."
- For topics where misinformation is widespread (vaccines, evolution, climate change), the distinction is important in the other direction: scientific consensus is overwhelming, but students may believe genuine controversy exists where it does not. Be clear: "There are a small number of scientists who disagree, but the evidence is overwhelmingly on one side -- about 97% of climate scientists agree that [claim]. That's as close to settled as science gets."

---

## Example

**Input:** A student says: "I know this is going to sound dumb, but I thought cells needed to be in saltwater to survive because salt is healthy. But my teacher said if you put a cell in pure water it explodes. How does that work? Water is supposed to be good for cells."

---

**Tutoring Session Output:**

```
## Science Tutoring Session: Osmosis and Cell Water Balance

**Subject domain:** Biology / Chemistry (cell biology)
**Prerequisite concepts assumed:** Cells have membranes; membranes are barriers;
  concentration gradients (basic); molecules move randomly (basic kinetic theory)
**Target concept:** Osmosis as net water movement across a semipermeable membrane
  down a water concentration gradient -- and why a concentration imbalance between
  cytoplasm and surroundings determines whether cells swell, shrink, or remain stable
**Student level:** High school biology (introductory)
**Misconception identified:** "Saltwater is healthy for cells because salt is healthy;
  pure water should also be fine or better because hydration is good"
**Gap category:** Vocabulary confusion + framework gap (no model of osmotic pressure
  or concentration-driven water movement exists yet; student is reasoning from
  everyday health associations, not from chemistry)
**Discrepant event used:** Mass balance argument -- where does the water go when a
  cell placed in pure water expands? What force drives it in?

---

### Elicitation

**Prompt used:** "You mentioned water is supposed to be good for cells. Let's start
  there -- when you imagine a cell sitting in pure water, what do you picture
  happening? Not what you know from class -- just what makes intuitive sense to you."

**Student's stated model:** "I figured water would just kind of... sit around the cell
  and hydrate it. Maybe a little water gets in but nothing extreme. Salt seemed
  dangerous, like it would dry the cell out."

**Mechanistic claim identified:** Student believes water passively surrounds the cell
  without driving a net directional flow; cell membrane is seen as a simple container
  that water doesn't penetrate significantly; salt is associated with dehydration
  (from everyday experience -- salting food draws out moisture) but this intuition
  is not connected to a mechanism.

---

### Dissatisfaction Event

**Prediction from student model:** "If water just surrounds the cell and slightly
  hydrates it, we'd expect the cell to stay roughly the same size, maybe get
  slightly plumper but not explode."

**Contradicting evidence or scenario presented:**
"Okay, here's something to sit with. A red blood cell placed in pure water
  actually swells and bursts within seconds -- not slowly, and not slightly.
  Now think about this: the cell's interior is packed with dissolved proteins,
  salts, sugars -- there's a lot of 'stuff' dissolved inside.
  The pure water outside has essentially none of that stuff dissolved in it.
  If molecules move randomly in all directions, water molecules are going to be
  bumping into the membrane from both sides all the time.
  Here's my question: on which side is there more water -- in the pure water
  outside, or inside the cell where the water is sharing space with all those
  dissolved molecules?"

**Student's response to contradiction:** "...Hm. I guess there's more water outside?
  Because inside, the water is kind of crowded out by all the protein and stuff?"

**AI assessment:** Student is beginning to reason correctly. No second evidence line
  needed -- proceed to guided discovery.

---

### Guided Discovery Sequence

| Turn | Type | Content |
|------|------|---------|
| 1 | Tutor question | "Exactly. So if water molecules are randomly moving and there are more of them per unit volume outside the cell than inside -- which direction will more of them be moving across the membrane at any given moment, just by chance?" |
| 1 | Student response | "Into the cell? Because there are more outside so more of them hit the membrane from the outside..." |
| 2 | Tutor confirmation + extension | "Perfect. That's osmosis. Water moves from where it's more concentrated -- the pure water -- to where it's less concentrated -- inside the cell. Now, the cell membrane is stretchy but not infinitely so. What do you predict happens if water keeps rushing in?" |
| 2 | Student response | "It would stretch... and then pop. Oh -- that's why it explodes." |
| 3 | Tutor question | "Right. Now here's the flip side: what if you put a cell in water that's much saltier than the cell's interior -- say, in very concentrated seawater? Using the same logic, which direction would water move now?" |
| 3 | Student response | "Water would move out? Because now there's less water outside -- the salt is taking up space out there -- so the cell has more water per volume than the outside does?" |
| 4 | Tutor confirmation | "Exactly right. That's why saltwater 'dries out' cells -- not because salt is directly harmful, but because water leaves the cell down its concentration gradient. The cell shrinks. This is called crenation. And that's also, by the way, why salting a wound stings -- you're pulling water out of cells." |
| 5 | Tutor question | "So now there's a sweet spot. What would have to be true about the salt concentration outside the cell for it to neither explode nor shrink?" |
| 5 | Student response | "The concentration of dissolved stuff outside would have to equal the concentration inside? So the water concentration is the same on both sides and there's no net movement?" |
| 6 | Tutor confirmation | "Exactly. That's called an isotonic solution. For human cells, it's about 0.9% salt by mass -- which is why IV drip bags used in hospitals contain 0.9% saline. Too concentrated or too dilute and you're damaging the cells you're trying to help." |

---

### Analogy Used

**Analogy:** A crowded room with two sections separated by a swinging door.
  Section A (outside cell): almost empty. Section B (inside cell): packed with people
  (dissolved molecules) and some open space (water molecules). People walk randomly
  and push through the door in both directions.

**Mapping:**
- People walking through the door → water molecules crossing the membrane
- Density of open space (not people) in each section → concentration of water molecules
- More random crossings from the crowded side toward the empty side → net water movement from pure water into cell
- Door can only swing so far before it breaks → membrane stretching until it lyses

**Where the analogy holds:** Captures the statistical, random-motion basis of net
  directional flow; explains why it's about concentration difference, not a "pump"
  or active force; explains why the direction reverses when you reverse the
  concentration difference.

**Where the analogy breaks:** The analogy implies people are the solutes and open
  space is water -- this could confuse students who think about ions as large blockers.
  In reality, water molecules are tiny and solute molecules vary enormously in size.
  The analogy also doesn't capture osmotic pressure (the pressure that builds up and
  can eventually stop water flow even down a gradient) -- that would require an
  extension.

---

### Novel Application Test

**Scenario presented:** "A student wants to make a scientific demonstration.
  She puts a gummy bear (which is basically a sugar-water gel matrix) into a cup
  of plain water overnight. Using what you now understand about osmosis, what
  do you predict will happen to the gummy bear by morning?"

**Student's prediction:** "The gummy bear has sugar dissolved all through it, so
  it has less water concentration than plain water. Water should move into the
  gummy bear... so it should get bigger? Swell up?"

**Assessment:** Correct. Student correctly identified the direction of osmotic
  movement and applied it to a non-cellular context, demonstrating transfer.

**Follow-up question asked:** "If you put a second gummy bear in very concentrated
  sugar water instead, what would happen?"

**Student's response:** "It should shrink -- water moves out because the sugar
  water outside has less water per volume than the gummy bear does."

**Assessment:** Fully correct. Bidirectional transfer confirmed.

---

### Consolidation

**Before/after summary (student's words):**
- Before: "I thought pure water was fine for cells and saltwater was dangerous
    because salt dehydrates things."
- After: "It's not about whether salt or water is 'healthy' -- it's about
    concentration balance. Water moves through membranes from where it's
    more concentrated to where it's less concentrated. Pure water is actually
    dangerous for a cell because water rushes in until the cell bursts. The right
    amount of salt keeps the concentration balanced so there's no net water movement."

**What was wrong with the original model:** "I was using everyday health ideas --
  'water is good, salt dehydrates' -- instead of thinking about concentration
  differences and how molecules move. I didn't have a model for why anything would
  move at all."

**Conceptual lever identified:** The insight that "more water molecules per unit
  volume = higher water concentration" and that dissolved solutes displace water
  molecules, reducing their effective concentration. Once the student accepted
  that pure water has higher water concentration than saltwater, all the osmotic
  direction predictions followed immediately.

**Retrieval practice prompt:** "Tonight before bed: close your eyes and imagine
  a cell floating in pure water. Walk yourself through what happens at the
  membrane level -- which direction does water move, why, and what happens to
  the cell. Then flip the scenario: the cell is in very salty water. Same
  question. If you get stuck on either one, that's what we'd work on next time."

---

### Forward Map

**What this concept unlocks:**
- Turgor pressure in plant cells (why plants wilt when dehydrated -- vacuoles
    lose water osmotically)
- Kidney function -- the medullary concentration gradient that drives water
    reabsorption from urine back into blood
- Why drinking saltwater dehydrates you further despite adding liquid volume
- IV fluid composition in medical settings
- How dialysis machines maintain blood solute balance without a functional kidney

**Recommended next topic:** Tonicity (isotonic / hypotonic / hypertonic solutions)
  and how cells respond differently -- this session gave the student the osmotic
  mechanism; tonicity vocabulary formalizes what they now understand intuitively.

**Prerequisite gap flagged:** Student's understanding of "concentration" was
  intuitive but not precise -- she understood "more stuff dissolved = less water
  per unit volume" when prompted but did not use concentration language
  spontaneously. Recommend a brief session on molarity/concentration before
  moving to quantitative osmotic pressure calculations.

---

### Misconception Correction Summary

| | Before tutoring | After tutoring |
|---|---|---|
| **Belief** | Pure water is fine or good for cells; saltwater is dangerous | Pure water causes lysis; the right salt concentration (isotonic) is what cells require |
| **Causal claim** | "Salt dehydrates because salt is dehydrating" (category: everyday health association, no mechanism) | Water moves by osmosis from high water concentration to low water concentration across semipermeable membranes; dissolved solutes reduce water concentration |
| **Predictive failure** | Predicted cell would stay roughly same size in pure water | Correctly predicts cell swells and bursts; correctly predicts cell shrinks in concentrated salt solution; correctly predicted gummy bear osmosis in novel application |
```

**Misconception category note:** This was a combination of vocabulary confusion (the
word "healthy" applied to cellular chemistry) and a framework gap (no prior model
of osmotic pressure or concentration-driven molecular movement). The fix required
building the framework from scratch rather than correcting a specific wrong fact --
which is why the guided discovery sequence was longer than it would be for a surface
gap correction. This is typical for biology students encountering osmosis for the
first time.
