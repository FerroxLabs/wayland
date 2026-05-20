---
name: memory-palace
description: |
  Designs memory palaces using the method of loci to help learners memorize ordered information by associating items with specific locations in a familiar space. Produces a complete palace design with loci assignments for the learner's specific content.
  Use when a learner asks to create a memory palace, use the method of loci, memorize a list or sequence, or improve memorization using spatial techniques.
  Do NOT use for spaced repetition scheduling (use `spaced-repetition`), for flashcard creation (use `flashcard-generation`), or for concept relationship mapping (use `concept-mapping`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "study-skills active-recall step-by-step guide"
  category: "education"
  subcategory: "self-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Memory Palace

## When to Use

Use this skill when the learner's need matches one of these specific scenarios:

- **Ordered sequence memorization:** The learner needs to memorize a fixed-order list -- the 12 cranial nerves, the order of U.S. presidents, the steps of meiosis, the planets, the amendments to a constitution, or any enumerated sequence where order matters.
- **Vocabulary acquisition for a specific domain:** The learner needs to memorize terminology in bulk -- anatomy terms, legal definitions, chemistry element names and properties, foreign-language vocabulary tied to a particular theme, or a set of named theorems.
- **Speech or presentation preparation:** The learner needs to recall talking points, arguments, or narrative structure in a specific order without reading from notes.
- **Exam cram for factual content:** The learner has a high-stakes exam covering declarative facts (dates, names, formulas, classifications) within days and needs a faster encoding strategy than rereading.
- **Multi-item procedural recall:** The learner needs to remember a procedure in exact order -- emergency response protocols, surgical steps, cooking processes, legal pleading structures -- where skipping or misordering a step has consequences.
- **Numbered laws, rules, or principles:** The learner needs to remember Piaget's stages, Newton's laws, the DSM criteria for a disorder, the elements of a contract, or any numbered canonical list.

**Do NOT use when:**

- The learner needs to understand *why* something works, not just recall it -- this is conceptual learning; use the Feynman technique or concept mapping instead (see `concept-mapping`).
- The learner needs to schedule review sessions over time for already-encoded material -- use `spaced-repetition` for that scheduling work.
- The learner needs to build flashcard decks for self-quizzing -- use `flashcard-generation`.
- The learner needs to map relationships between concepts (cause-effect, hierarchy, analogy) -- use `concept-mapping`.
- The material changes frequently or is procedurally dynamic -- memory palaces encode static snapshots; rapidly updating content will cause palace interference and degraded recall.
- The content is primarily mathematical derivations or proof-based reasoning -- spatial encoding does not substitute for procedural fluency in math; use worked examples and retrieval practice instead.
- The learner is seeking to improve reading comprehension or analytical writing -- use active reading or outlining skills.
- The content set has fewer than 5 items -- for tiny lists, simple rehearsal or an acronym (mnemonic acrostic) is faster and more efficient.

---

## Process

### Step 1: Gather the learner's content and constraints

Before designing anything, collect specific information. Do not proceed to palace construction without the learner's actual content.

- Ask for the **exact list or sequence** to be memorized -- not a topic name, but the actual items. If the learner says "the cranial nerves," ask them to paste the full list as they need to know it.
- Ask how many items are in the list. This determines palace scale and whether you need one palace or a palace system.
- Ask whether **order matters strictly** (presidents in sequence, steps in a protocol) or whether it is a **set of items without fixed sequence** (vocabulary terms, anatomy structures). This determines whether the route must be strictly linear.
- Ask the learner's **familiarity with the technique**. If they have never used method of loci before, insert a brief orientation (Step 2 below) before palace design.
- Ask the **exam or recall date** to calibrate urgency and recommend a practice schedule.
- Ask if the learner has a **preferred palace space** in mind. If not, you will need to help them select and scaffold one.

### Step 2: Orient the learner (if needed) and select the palace space

If the learner is new to the technique, provide a concise, concrete explanation -- three to five sentences maximum -- before building the palace. Do not lecture; teach by doing.

- Explain the core mechanism: the human brain has an extraordinarily strong hippocampal spatial memory system. By converting abstract items into vivid images placed at locations you already know deeply, recall becomes a mental navigation rather than effortful search.
- Present the **palace selection decision framework** based on item count:
  - 5--12 items: A single room (bedroom, kitchen, office) with furniture as loci.
  - 13--25 items: Multiple rooms in a home, traversed in a fixed route.
  - 26--50 items: A full building (home + yard + garage) or a commute route with landmarks.
  - 51--100 items: A neighborhood walk, a campus, or a combined multi-palace system.
  - 100+ items: Nested palace system -- a palace of palaces, where each room is itself a category containing 10--15 loci.
- Confirm the learner can visualize the chosen space clearly and can mentally "walk" it in a consistent direction. If they cannot, suggest a more familiar alternative.
- Identify exactly N loci for N items, numbered and spatially ordered. Loci must be **discrete, stable, and spatially separated** -- "the left armrest of the couch" and "the right armrest of the couch" are valid distinct loci; "the couch area" is too vague.

### Step 3: Chunk and organize the source content

Raw lists must be processed before image assignment. Do not map items to loci until the content is structured.

- If the content has natural sub-groupings (e.g., cranial nerves group into sensory, motor, and mixed; the periodic table groups by period), identify those groupings and assign them to palace rooms or route segments. This creates a **two-level retrieval hierarchy**: room gives the category, locus within the room gives the item.
- If items have inherent relationships (e.g., paired concepts like stimulus/response, cause/effect), design **compound locus images** that encode the relationship -- the image shows two entities interacting, not one entity sitting passively.
- Flag any items that are conceptually complex and cannot be encoded as a simple image. For these, design a **peg chain**: a short mini-narrative (3--4 beats) anchored to the locus rather than a single static image.
- Identify items that are easily confused with each other (e.g., afferent vs. efferent, mitosis vs. meiosis, civil vs. criminal). Design deliberately contrasting images that emphasize the distinguishing feature, not just the label.
- For **numerical items** (dates, constants, quantities), apply a secondary encoding system -- the Major System (phonetic number encoding) or simple shape-number substitution (1=candle, 2=swan, 3=pitchfork) to convert numbers into imageable objects before placing them in the palace.

### Step 4: Design the vivid images for each locus

This is the highest-skill step and the most common failure point. Generic or passive images produce weak recall. Every image must meet specific criteria.

- **The ACES framework** -- every locus image must be:
  - **Action-based:** The image must be actively doing something, not stationary. A dog is weak; a dog shredding documents with its teeth is strong.
  - **Consequence-laden:** The action must have an obvious result. The shredding dog causes paper to fly everywhere and triggers a fire alarm. Stakes and consequences force the brain to encode causally.
  - **Exaggerated in scale or absurdity:** Giant, miniature, or physically impossible. A mitochondrion the size of a refrigerator. A bell the size of a cathedral. Absurdity is not optional -- it is the mechanism.
  - **Sensory-rich:** Include at least two senses beyond vision. The bell is deafeningly loud. The mitochondrion hums and glows orange and smells like burning wire.
- For items that are **abstract concepts** (unconditioned stimulus, marginal utility, due process), create a **concrete avatar** for the abstract concept first, then place the avatar in the scene. "Unconditioned stimulus" becomes a raw steak (the object that naturally causes drooling before any learning). The steak is the avatar. The avatar then performs the action at the locus.
- For items that are **names** (people, chemical elements, historical figures), use a **sound-alike substitution**: the name sounds like something imageable, and that image appears at the locus. "Pavlov" sounds like "pave" + "love" -- a road paver machine spray-painting hearts onto asphalt at your front doorstep.
- Link consecutive items causally when possible. The image at locus 3 should somehow interact with or cause the image at locus 4. Narrative chains produce superior recall because each image retrieves the next.

### Step 5: Build the complete palace table

Produce the full palace design as a structured table with every locus assigned. Never produce a partial palace and ask the learner to fill in the rest.

- Use the **Palace Construction Table** format defined in the Output Format section.
- Write out each image description in enough narrative detail that the learner can visualize it immediately -- 2--4 sentences per locus minimum.
- After the table, write a **Narrative Walkthrough** in paragraph form that strings all loci together as a story. The narrative walkthrough is essential for initial encoding -- it is easier to "live" the walk than to read a table.
- Explicitly number loci within the walkthrough so the learner can cross-reference.

### Step 6: Design the practice protocol

A palace designed but not practiced degrades rapidly. Encode a concrete 7-day rehearsal schedule.

- **Day 0 (build day):** Walk through the palace 3 times with the table open. First pass: read each description, then close eyes and visualize for 5 seconds. Second pass: cover the "Item" column and retrieve from image alone. Third pass: cover the entire table and do a full walk from memory.
- **Day 1:** Walk from memory, first forward then backward. Backward traversal tests whether encoding is dependent on route cues or genuinely encoded per locus.
- **Day 3:** Spot-quiz method -- learner opens to a random locus number and must retrieve the item without walking the route from the beginning. This tests locus-independent access.
- **Day 7:** Full recall test from scratch, with a 48-hour gap to ensure no recency effects.
- After Day 7, transition to `spaced-repetition` scheduling for long-term maintenance.
- For very large palaces (40+ items), break the practice into **segments**: practice loci 1--15 to criterion (3 consecutive errorless walks) before adding loci 16--30.

### Step 7: Verify encoding and close knowledge gaps

After delivering the palace, include a self-check protocol tuned to the specific content -- not generic questions.

- Write 3--5 **locus-specific retrieval prompts**: "What is happening at your kitchen sink?" and the answer should immediately surface the associated item. If it does not, the image needs to be redesigned.
- Write 2--3 **reverse retrieval prompts**: "You need to recall the concept of extinction -- which locus in your palace contains that? What is happening there?" This tests bidirectional encoding.
- Flag any images that the learner reports as unclear or weak during self-check and offer redesigned alternatives.
- Recommend complementary techniques: `flashcard-generation` for same-content retrieval practice from a different angle, `concept-mapping` if the learner wants to understand relationships between the memorized items rather than just recall them.

---

## Output Format

Produce the palace in this structure every time. Do not omit sections.

```
## Memory Palace: [Topic]

**Subject:** [Subject area]
**Specific Content:** [Exact list or sequence being memorized]
**Palace Space:** [Named location -- e.g., "My apartment, starting at front door"]
**Item Count:** [N] items across [N] loci
**Memorization Goal:** [Exam date / presentation date / ongoing retention]
**Order Dependency:** [Strict order required / Set -- order not critical]

---

### Palace Route Overview

[Starting point] --> [Locus 1 landmark] --> [Locus 2 landmark] --> ... --> [Final locus]

Walk direction: [Clockwise / left-to-right / front-to-back -- specify clearly]

---

### Palace Construction Table

| Locus # | Location | Item to Encode | Core Image | Full Image Description |
|---------|----------|---------------|------------|----------------------|
| 1 | [Specific location] | [Exact item] | [2-3 word image label] | [2-4 sentence vivid narrative] |
| 2 | [Specific location] | [Exact item] | [2-3 word image label] | [2-4 sentence vivid narrative] |
| N | ... | ... | ... | ... |

---

### Narrative Walkthrough

[A continuous paragraph or short paragraphs narrating the full walk through the palace,
weaving all images into a connected story. Each locus is numbered in parentheses -- e.g.,
(Locus 1) -- so the learner can cross-reference the table. Minimum 100 words for a
10-item palace; scale proportionally.]

---

### Image Design Notes

[Any items that required special encoding techniques: Major System for numbers,
sound-alike substitution for names, compound images for paired concepts,
peg chains for complex multi-part items. Explain the encoding logic so the learner
can repair or extend images independently.]

---

### Self-Check Protocol

**Locus-to-Item retrieval (forward):**
- What is happening at [specific locus]? → Should retrieve: [item]
- What is happening at [specific locus]? → Should retrieve: [item]
- What is happening at [specific locus]? → Should retrieve: [item]

**Item-to-Locus retrieval (reverse):**
- Where in the palace is [item]? What image do you see? → Should place: Locus [N]
- Where in the palace is [item]? What image do you see? → Should place: Locus [N]

**Weak image signals:** If you cannot retrieve an item within 3 seconds of mentally
arriving at the locus, the image needs redesign. Report which loci feel weak.

---

### 7-Day Practice Schedule

| Day | Activity | Duration | Success Criterion |
|-----|----------|----------|-------------------|
| 0 (today) | 3 guided walks with table | 15--20 min | Complete walk without notes on 3rd pass |
| 1 | Forward + backward walk | 10 min | <5 errors on backward walk |
| 3 | Spot-quiz (random loci) | 10 min | Any locus retrieved in <5 sec |
| 7 | Full cold recall test | 15 min | 90%+ items retrieved correctly |

After Day 7: Transfer to spaced-repetition scheduling (see `spaced-repetition` skill)

---

### Complementary Techniques

- **For deeper understanding** of the memorized concepts: `concept-mapping`
- **For retrieval practice** from a different format: `flashcard-generation`
- **For long-term retention scheduling** after Day 7: `spaced-repetition`
```

---

## Rules

1. **Never build the palace without the exact item list.** A topic name is not sufficient. If the learner says "the bones of the hand," ask them to provide the exact list in the exact form they need to recall it. Building a palace around an approximation embeds the wrong encoding.

2. **Every locus image must contain action.** Passive images ("a dog is on the couch") are consistently outperformed by active images ("a dog is eating the couch cushions and spitting the foam at the TV") in controlled memory studies. Reject any image you generate that lacks a verb depicting movement, destruction, interaction, or consequence.

3. **Enforce spatial distinctness between loci.** No two loci may be described as "the couch area" or "near the window." Every locus must have a name precise enough that a stranger could walk in and touch the exact spot without asking. Vague spatial descriptions produce locus confusion, which is the leading cause of palace failure.

4. **Do not exceed 15 items per room.** Cognitive spatial chunking research places the practical limit at approximately 15 discrete loci per bounded space before images begin to interfere with each other. For lists longer than 15, open a new room or space segment.

5. **Use the learner's genuine personal space when possible.** A palace built in a space the learner has never visited (a famous building they have only seen in photos) will underperform a palace built in their childhood home, their current apartment, or their daily commute route. The depth and detail of spatial memory correlates directly with time spent in the space. Ask the learner what spaces they know best.

6. **Apply explicit encoding techniques for numbers and abstract terms.** Do not place the word "entropy" at a locus and call it done. Entropy must become an avatar (a room filling with chaotic floating debris), and that avatar must act. Numbers must be converted via shape-number substitution or the Major System before image assignment. Raw abstract terms placed at loci without avatar conversion produce near-zero recall improvement over rereading.

7. **Always include the Narrative Walkthrough.** The table is a reference document; the narrative walkthrough is the encoding tool. Research on method of loci consistently shows that narrative coherence between loci (each image causes or leads to the next) increases recall accuracy by approximately 20--30% compared to isolated images. Do not omit the walkthrough on grounds of length.

8. **Design images for distinctive confusion pairs first.** Before designing any other images, identify the items in the list most likely to be confused with each other (similar sounds, similar concepts, adjacent positions in a sequence). Design those images to be maximally contrastive -- if "afferent" and "efferent" are both in the list, their locus images must differ in color, direction of movement, and emotional tone to prevent blending.

9. **Specify the walk direction and route in writing.** "My apartment" is not a route. "Start at the front door, turn left into the living room, touch the left wall, proceed clockwise past the bookcase, TV, couch left armrest, couch right armrest, coffee table, pass through to the kitchen..." is a route. The learner must be able to reproduce the exact spatial sequence without ambiguity. Ambiguous routes produce variable retrieval sequences, which defeats ordered-list recall.

10. **Flag palace reuse conflicts.** If the learner has used or plans to use the same palace for different content, warn them explicitly about proactive and retroactive interference. Two sets of content encoded in the same palace within 2 weeks of each other will interfere with each other's recall. Recommend either a new palace space, a waiting period of at least 14 days with one set fully consolidated, or a deliberate "clearing" walk before re-encoding.

---

## Edge Cases

### The learner has more items than their described palace can support

**Scenario:** A learner wants to memorize all 206 bones of the human body using "my house."

**Handling:** A typical house supports 40--80 well-differentiated loci. For 206 items, you need a palace system. Design a **master palace** (the house) where each room represents a body region (skull, vertebral column, thorax, upper limb, lower limb, pelvis). Each room then contains loci for the bones in that region. Explain the nested structure clearly: "You will first navigate to the right room (body region), then walk through that room's loci (individual bones)." Provide a room-to-region mapping table before building any individual room's locus assignments. Recommend tackling one room (one body region) per study session rather than attempting all 206 in one sitting.

### The learner's content is conceptual, not factual

**Scenario:** A learner says "help me make a memory palace for understanding supply and demand" or "I want to memorize how the immune system works."

**Handling:** This is a misapplication of the technique. Memory palaces encode discrete retrievable facts and sequences, not conceptual understanding. Respond honestly: "A memory palace will help you recall the specific components -- the names of the immune cells, their sequence of activation, the names of cytokines -- but it cannot substitute for understanding the mechanism. Let me separate the recall-worthy facts from the conceptual content, build the palace for the facts, and then recommend `concept-mapping` for the mechanistic understanding." Do not build a palace for pure concepts; build one for the facts that support the concepts.

### The learner reports the images feel artificial and do not stick

**Scenario:** The learner tried the palace the AI designed but says "I just can't visualize it" or "the images feel forced and disappear."

**Handling:** This usually indicates one of three problems. First, the palace space may not be deeply familiar -- if the learner only recently moved to their apartment, their spatial memory for it is shallow. Redirect to a childhood home, a school they attended for years, or a route they have walked thousands of times. Second, the images may be too complex -- if a single locus has more than two interacting entities, working memory overloads during encoding. Simplify to one primary actor doing one memorable action. Third, some learners have weaker visual imagery (lower "vividness of visual imagery" scores on the VVIQ scale). For these learners, emphasize other sensory channels: what does the image sound like, smell like, what texture does it have? Multi-sensory encoding is not optional for low-visualizers; it is the primary mechanism.

### The learner needs to memorize paired relationships, not a list

**Scenario:** The learner needs to memorize vocabulary with translations (Spanish-to-English), matched term-definition pairs, or muscle-to-function pairings.

**Handling:** Standard method of loci encodes one item per locus. For pairs, use **interaction encoding**: the two items in a pair are represented by two avatars interacting causally at a single locus. The key avatar (term, muscle name, foreign word) initiates an action that causes or transforms into the value avatar (definition, function, translation). For example, "serrano" (Spanish for mountain range) at Locus 4 (the kitchen stove): a tiny mountain range erupts from the stove burners, shooting rocky peaks through the range hood, which has a sign reading "SIERRA" (sound-alike bridge). Both elements -- the item and its paired value -- must appear in the scene and interact. Do not create a separate locus for each half of a pair; that doubles your palace size unnecessarily and disconnects the association.

### The learner needs to memorize content in a foreign language they are learning

**Handling:** Allow the learner to build the palace images in their native language while the items to encode are in the target language. The sound-alike substitution technique is especially valuable here: the foreign word's pronunciation is approximated by a native-language word or phrase that is imageable, and that image appears at the locus. "Schadenfreude" (German: pleasure from others' misfortune) sounds like "shadow frayed" -- at Locus 7 (the bathroom mirror), a shadow is frayed and tattered at the edges, and it is laughing at its own damaged state. The emotional content (malicious pleasure) is embedded in the action. Never require the learner to think in the target language during initial palace construction; language fluency and memory encoding are separate goals.

### The learner wants to reuse a palace they used months ago for something else

**Handling:** Palace reuse is viable if the original content is well consolidated (no errors on cold recall) and 3--4 weeks have passed since last active rehearsal. Before re-encoding, conduct a **clearing walk**: the learner mentally walks the palace and, at each locus, deliberately imagines the scene as empty -- wipes it clean, watches the image dissolve, replaces it with a blank white surface. Do this 2--3 times before beginning new encoding. If the learner is uncertain whether old images are gone (they still partially appear), do not reuse the palace for new content -- assign a new palace space. Palaces that were used for particularly vivid or emotionally intense content are more resistant to clearing; warn the learner of this and recommend a new palace if the old content was highly memorable.

### The learner has a very short timeline (memorization needed within hours)

**Handling:** Compress the process. For same-day encoding needs, prioritize: select the most familiar space immediately without deliberation (childhood bedroom is almost always the best default), cap item count at 12--15 for the session, spend 90% of available time on vivid image construction and 10% on the structure, and do the walkthrough verbally out loud rather than silently (subvocalizing the narrative during initial encoding adds an auditory channel that accelerates consolidation). Do not schedule a 7-day practice plan -- instead, schedule 5 rapid walks in the 2 hours before the exam: walk at T-2 hours, T-90 minutes, T-60 minutes, T-30 minutes, and T-5 minutes. High-frequency massed practice is inferior to spaced practice for long-term retention but is the correct strategy for same-day high-stakes recall.

---

## Example

**Input:** "I have a pharmacology exam in 4 days and I need to memorize the 12 cranial nerves in order -- their number, name, and whether they are sensory (S), motor (M), or both (B). I've never used a memory palace before."

---

**Output:**

## Memory Palace: The 12 Cranial Nerves

**Subject:** Pharmacology / Neuroanatomy
**Specific Content:** Cranial nerves I through XII -- name and functional type (Sensory / Motor / Both)
**Palace Space:** My apartment -- starting at the front door, moving through the entryway, living room, kitchen, bathroom, and bedroom
**Item Count:** 12 items across 12 loci
**Memorization Goal:** Exam in 4 days
**Order Dependency:** Strict order required (numbered I--XII)

---

### Brief Orientation (First Time Using Method of Loci)

Your brain has an ancient, extremely powerful spatial navigation system built around the hippocampus. This system was designed to remember where things are in physical space -- where food is, where predators lurk, where home is. The method of loci exploits this system by placing abstract information (cranial nerve names) into a space your brain already knows deeply (your apartment). To recall the nerves in order, you simply "walk" through your apartment mentally and "see" each image. You do not try to remember the name directly -- you remember what you see, and the name comes with it.

The images must be vivid, active, and slightly absurd. Boring images vanish. Outrageous images persist.

---

### Palace Route Overview

**Front door** --> **Entryway coat rack** --> **Entryway mirror** --> **Living room couch left armrest** --> **Living room couch right armrest** --> **Living room TV** --> **Kitchen sink** --> **Kitchen stove** --> **Kitchen refrigerator** --> **Bathroom toilet** --> **Bathroom sink** --> **Bedroom bed**

Walk direction: Enter through front door, turn left, move clockwise through each room.

---

### Palace Construction Table

| Locus # | Location | Nerve (Type) | Core Image | Full Image Description |
|---------|----------|-------------|------------|----------------------|
| 1 | Front door | CN I -- Olfactory (S) | Nose sniffing door | You approach your front door and it has an enormous human nose attached to it, violently sniffing the air. The nose is twitching, flaring, and dripping. It is SENSING -- it cannot push or pull the door open, only smell it. The door smells like old perfume and gym socks. |
| 2 | Entryway coat rack | CN II -- Optic (S) | Giant eyeball on rack | Hanging on your coat rack is a single enormous eyeball -- the size of a basketball -- instead of a coat. It rotates slowly to stare at you as you enter. It is glistening and bloodshot. It can only SEE (sense), not move. It has no eyelid and never blinks. |
| 3 | Entryway mirror | CN III -- Oculomotor (M) | Eye MOVING in mirror | You look in the entryway mirror and your reflection's eyes are spinning in wild circles, darting left-right-up-down at full speed, like a slot machine. The eyes are MOVING under motor control -- the motor is running so hot that sparks fly from the eye sockets. "Oculomotor" -- the MOTOR that moves the eye. |
| 4 | Couch left armrest | CN IV -- Trochlear (M) | Trochlear = pulley on armrest | Attached to the left armrest is an old-fashioned rope PULLEY (a trochlea is Latin for pulley). The rope of the pulley runs through a tiny eye that rotates downward and inward. A weightlifter is cranking the pulley, straining. The motion is always DOWN and IN. Motor only. |
| 5 | Couch right armrest | CN V -- Trigeminal (B) | Three faces biting/feeling armrest | Three faces (TRIgeminal = three) are embedded in the right armrest. One face is BITING the armrest (motor -- chewing). The other two faces are pressing their cheeks against the armrest and reporting textures back with exaggerated facial expressions (sensory -- touch and pain). All three feel AND act. BOTH. |
| 6 | Living room TV | CN VI -- Abducens (M) | TV screen abducted, pulled sideways | The TV screen is being physically ABDUCTED -- yanked violently to the far side by a kidnapper who keeps pulling it lateral, away from center. "Abducens" means to abduct/pull away. The screen can only move outward (lateral eye movement). Motor only. The kidnapper wears a ransom note as a hat. |
| 7 | Kitchen sink | CN VII -- Facial (B) | Face on faucet smiling/moving | The kitchen faucet has sprouted a giant FACE. The face is making exaggerated expressions -- it smiles enormously (motor: facial muscles), then frowns, then it tastes the water coming out and reacts to the flavor with disgust (sensory: taste from anterior 2/3 of tongue). BOTH motor and sensory. The face is crying water instead of tears. |
| 8 | Kitchen stove | CN VIII -- Vestibulocochlear (S) | Enormous ear on stove, wobbling | Sitting on the stove burners is an enormous ear -- the size of a dinner plate -- spinning and wobbling like an unbalanced top. It HEARS the burners hissing (cochlear = hearing) and DETECTS BALANCE by spinning (vestibular = balance). It cannot move anything, only sense. SENSORY only. Flames are going into the ear canal. |
| 9 | Kitchen refrigerator | CN IX -- Glossopharyngeal (B) | Tongue licking fridge + swallowing | A giant detached tongue is pressed against the refrigerator door, tasting the surface (sensory: taste from posterior 1/3 of tongue, gag reflex). Then the tongue FLEXES and moves to swallow -- it can sense AND motor-control the pharynx. BOTH. The fridge releases a gag reflex alarm every few seconds. "Glosso" = tongue, "pharyngeal" = throat. |
| 10 | Bathroom toilet | CN X -- Vagus (B) | Vagabond wandering into organs in toilet | The toilet is a PORTAL from which a vagabond (VAGUS = wandering) climbs out, having wandered through the heart, lungs, and gut. The vagabond reports back what the organs feel (sensory) and then cranks a dial that slows the heart rate (motor -- parasympathetic). The vagabond is wearing a backpack labeled "Heart, Lungs, Stomach." BOTH. |
| 11 | Bathroom sink | CN XI -- Accessory (M) | Shoulder-shrugging accessory at sink | At the bathroom sink, a mannequin is wearing an enormous accessory -- a gaudy necklace -- and shrugging its shoulders dramatically, over and over (trapezius and sternocleidomastoid). That is ALL it does. No sensing -- pure motor. The accessory is a giant rhinestone SCM (sternocleidomastoid) bone as a pendant. MOTOR only. |
| 12 | Bedroom bed | CN XII -- Hypoglossal (M) | Tongue pushing out of bed | In the bed lies a giant tongue that keeps pushing itself straight out -- it cannot rest, it keeps extending out of the bed and then retracting (motor control of tongue movement -- "hypoglossal" = under the tongue). MOTOR only. The tongue is trying to make the bed but has no hands, only extension and retraction. |

---

### Narrative Walkthrough

You approach your front door and stop short -- there is a giant, twitching NOSE glued to the door, sniffing the air desperately (Locus 1 -- CN I Olfactory, Sensory). The nose has apparently been staring at the door all day because as you push past it, you bump into the entryway coat rack, and hanging there instead of your jacket is an enormous, glistening EYEBALL that rotates to stare at you the moment you enter (Locus 2 -- CN II Optic, Sensory). The eyeball has been watching the entryway mirror, and when you glance at the mirror, your reflection's eyes are SPINNING madly in their sockets, driven by a tiny sparking motor visible through the skin -- oculomotor in full overdrive (Locus 3 -- CN III Oculomotor, Motor).

You collapse onto the couch to recover. Your hand lands on the left armrest, which has a rope PULLEY bolted to it, cranked by a tiny weightlifter straining to pull the rope DOWN and INWARD, over and over (Locus 4 -- CN IV Trochlear, Motor). You shift to the right armrest, which has THREE faces pressed into it: one is biting the armrest foam (chewing), while the other two report textures back in dramatic pantomime, pressing cheeks to the fabric (Locus 5 -- CN V Trigeminal, Both). You look up at the TV, which is being physically ABDUCTED -- a kidnapper in a ransom-note hat yanks the screen far to the right, lateral, away from center, again and again (Locus 6 -- CN VI Abducens, Motor).

You retreat to the kitchen for water. The faucet has grown a FACE that is cycling through expressions -- enormous grin, tremendous frown -- while tasting the water that flows from its own mouth and reacting with disgust (Locus 7 -- CN VII Facial, Both). On the stove, an ear the size of a dinner plate wobbles and spins on the burners, flames entering its canal while it detects its own imbalance and tries to hear the hissing gas below it (Locus 8 -- CN VIII Vestibulocochlear, Sensory). You open the refrigerator and a giant detached tongue presses itself against the door from inside, tasting the cold surface, then flexes back to trigger a swallowing motion while the fridge emits a gag reflex alarm (Locus 9 -- CN IX Glossopharyngeal, Both).

You go to the bathroom. From the toilet climbs a VAGABOND, travel-worn, who has apparently been wandering through your heart and lungs and stomach, reporting back organ sensations and periodically cranking a dial to slow things down -- the parasympathetic wanderer (Locus 10 -- CN X Vagus, Both). At the bathroom sink, a mannequin in an enormous gaudy necklace-accessory repeatedly shrugs its shoulders with theatrical commitment, bouncing the rhinestone pendant, doing nothing else, sensing nothing (Locus 11 -- CN XI Accessory, Motor).

Finally, in the bedroom, a giant tongue lies in the bed, unable to rest -- it keeps extending straight out past the footboard, then retracting, extending, retracting, trying and failing to make the bed without hands (Locus 12 -- CN XII Hypoglossal, Motor). You have walked through all twelve. Close your eyes and walk back.

---

### Image Design Notes

**Sound-alike substitutions used:**
- "Trochlear" (CN IV): Encoded as "trochlea" = pulley (the anatomical trochlea is literally a pulley-like structure). Accurate and imageable.
- "Glossopharyngeal" (CN IX): Split into "glosso" (tongue) + "pharyngeal" (throat/pharynx). Two body parts are both visible in the scene.
- "Vestibulocochlear" (CN VIII): Split into vestibular (balance/spinning) + cochlear (hearing/ear). Both functions are represented in the single image.
- "Vagus" (CN X): Sound-alike + meaning -- "vagabond/wanderer." Accurate to the nerve's name (vagus = wandering) and creates a mobile, organ-traversing character.
- "Hypoglossal" (CN XII): "Hypo" (under) + "glossal" (tongue). The tongue image is the direct encoding; the motor function is shown through what the tongue cannot do without motor control.

**Encoding the S/M/B distinction:**
- Sensory-only nerves (I, II, VIII): Their images can only perceive -- they cannot move, act, or change anything. They observe, detect, taste, hear.
- Motor-only nerves (III, IV, VI, XI, XII): Their images perform repetitive physical actions but have no sensory feedback -- they cannot react to what they encounter, only act.
- Both (V, VII, IX, X): Their images both act AND respond to sensory information within the same scene. Look for the dual-action structure in each description.

---

### Self-Check Protocol

**Locus-to-Item retrieval (forward):**
- What is happening at your kitchen stove? → Should retrieve: CN VIII Vestibulocochlear -- Sensory
- What is at your couch right armrest? → Should retrieve: CN V Trigeminal -- Both
- What climbs out of your toilet? → Should retrieve: CN X Vagus -- Both
- What is your bedroom bed occupied by? → Should retrieve: CN XII Hypoglossal -- Motor

**Item-to-Locus retrieval (reverse):**
- Where is the facial nerve? What is it doing? → Should place: Locus 7, Kitchen sink -- face on faucet expressing and tasting
- Where is CN XI? What is the S/M/B status? → Should place: Locus 11, Bathroom sink -- Motor only, shoulder shrugging
- Which nerve is at the entryway coat rack, and why is it only Sensory? → Should retrieve: CN II Optic -- the eyeball can only see, not move or act

**Weak image signals:** If you arrive mentally at the bathroom toilet and nothing appears within 3 seconds, the vagabond image needs more emotional content. Add a smell -- the vagabond smells like heart and lung tissue -- and add a specific object in the backpack you can see clearly. Report any loci where images feel thin.

---

### 7-Day Practice Schedule

| Day | Activity | Duration | Success Criterion |
|-----|----------|----------|-------------------|
| 0 (today) | 3 guided walks with table open | 20 min | Complete all 12 names and types without notes on 3rd pass |
| 1 | Forward walk, then backward walk (XII to I) | 12 min | Fewer than 3 errors on backward walk |
| 2 | Spot-quiz: Ask yourself "What is at Locus 5? Locus 9? Locus 3?" in random order | 8 min | Any locus retrieved in under 4 seconds |
| 3 | Write out all 12 nerves from memory without the palace -- just the list | 10 min | 10+ correct; rework images for any failures |
| 7 | Full cold recall: name, number, and type for all 12 | 15 min | 11/12 or better (one error acceptable) |

**Pre-exam rapid review (morning of exam):** Walk through the palace once, deliberately, touching each locus and seeing the image clearly. This takes approximately 3 minutes and refreshes recency without overwriting consolidation.

---

### Common Confusions to Watch For

- **CN II (Optic) vs. CN VIII (Vestibulocochlear):** Both are Sensory-only. Distinguish by location -- II is always on the coat rack (it sees the room), VIII is always on the stove (it hears the burners and spins).
- **CN IV (Trochlear) vs. CN VI (Abducens):** Both are Motor-only. Trochlear pulls DOWN and IN (left armrest, weighted down by pulley). Abducens pulls LATERAL (TV screen yanked to the side). Direction of movement is the key.
- **CN IX (Glossopharyngeal) vs. CN X (Vagus):** Both are Both-type and both involve the throat. Distinguish by location -- IX is at the fridge (tongue + swallowing), X is at the toilet (the wandering vagabond going deep into the body's organs). IX is peripheral (mouth, throat), X is systemic (heart, lungs, gut).

---

### Complementary Techniques

- **To practice retrieval from text cues instead of spatial cues:** Use `flashcard-generation` to create cards testing "Name the cranial nerve that controls facial expression" from a different angle.
- **To understand the clinical significance of each nerve's function:** Use `concept-mapping` to map what happens when each nerve is damaged (CN VII palsy, CN X injury effects on heart rate).
- **To schedule long-term retention beyond Day 7:** Use `spaced-repetition` with intervals of 14 days, 30 days, and 90 days based on Day 7 recall performance.
