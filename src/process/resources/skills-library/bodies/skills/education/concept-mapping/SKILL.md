---
name: concept-mapping
description: |
  Creates visual concept maps with nodes, labeled relationships, and hierarchical organization from study material for learners. Produces a text-based concept map showing how ideas connect -- not an explanation of concept mapping theory.
  Use when a learner asks to create a concept map, mind map, or knowledge map showing relationships between ideas in their study material.
  Do NOT use for Cornell-style note taking (use `cornell-notes`), for note synthesis (use `note-synthesis`), or for memory palace techniques (use `memory-palace`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "study-skills note-taking step-by-step guide"
  category: "education"
  subcategory: "self-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Concept Mapping

## When to Use

Use this skill when a learner explicitly wants a concept map built from their study material -- not a general explanation, outline, or summary.

**Trigger scenarios:**
- Learner asks to "make a concept map," "build a knowledge map," or "map out the connections" in their study material
- Student wants to see hierarchical relationships between concepts in a subject area (biology, history, chemistry, law, psychology, economics)
- Learner is preparing for an exam and wants to see how all the pieces of a complex topic fit together before drilling individual facts
- User has a dense reading (textbook chapter, research paper, lecture transcript) and wants to externalize the structure to aid comprehension
- Learner identifies that they understand individual facts but cannot explain how they connect -- concept mapping directly addresses this "isolated facts" problem
- Student is building on prior knowledge and wants to integrate new material with what they already know by anchoring new nodes to existing ones
- Learner explicitly mentions Novak methodology, propositional structure, concept nodes, or linking phrases

**Do NOT use when:**
- Learner wants to take notes during a live lecture (use `cornell-notes` -- concept mapping requires post-processing, not real-time capture)
- User wants to synthesize notes from multiple sources into a coherent summary (use `note-synthesis`)
- Learner wants to memorize a spatial layout using narrative journeys through imagined locations (use `memory-palace`)
- User wants to generate practice questions or self-test with flashcard-style prompts (use `exam-practice` or `flashcard-generation`)
- Learner is an educator designing a curriculum map or unit structure for teaching -- this skill is for the learner's own comprehension, not instructional design
- Material consists entirely of procedural steps (how to cook, how to write code, how to perform a lab procedure) where a flowchart or checklist is more appropriate than a hierarchy-based concept map
- Content is a simple list of vocabulary definitions with no meaningful relational structure between the terms -- concept mapping adds no value when relationships are absent

---

## Process

### Step 1: Gather Material and Clarify Scope

Before building anything, collect the inputs that determine map architecture.

- Ask for the **source material** directly: lecture notes, textbook sections, annotated slides, or a topic description. Do not build from topic names alone ("cell respiration" is not enough -- get the actual content).
- Clarify the **grain size**: Is this one lecture, one chapter, one exam unit, or one full course? A single lecture typically yields 10-20 concept nodes. A full course unit can yield 40+, which requires breaking into sub-maps.
- Identify the **learner's purpose**: exam preparation in the next 48 hours (favor completeness and accuracy), deep understanding over weeks (favor cross-links and integration), teaching someone else (favor clarity and logical flow), or writing an essay (favor argumentative structure and causal chains).
- Ask whether the learner is a **beginner or has prior knowledge** of the topic. Beginners need simpler hierarchies with fewer cross-links. Advanced learners benefit from dense propositional networks and integration with prior maps.
- Confirm the **subject domain** because concept map structure varies: science maps are typically causal and hierarchical; history maps are often temporal and contextual; philosophy maps are heavily comparative and definitional; medicine maps often integrate anatomical, physiological, and clinical branches.

### Step 2: Extract and Rank Concepts

Identify the concepts that will become nodes before drawing any connections.

- Scan the source material and list every meaningful **noun phrase** that represents a discrete concept. Avoid verbs, adjectives, and full sentences at this stage -- those belong in link labels, not nodes.
- Aim for **10-25 nodes** for a single-topic map. Fewer than 8 nodes produces a map too sparse to be useful. More than 30 nodes in a single map becomes visually unmanageable -- split into a master map with sub-maps.
- Apply the **parking lot technique**: write every candidate concept on a separate notional "card," then sort. Eliminate true synonyms (keep the term the learner's course uses). Merge concepts that cannot stand alone as independent ideas.
- Rank concepts on a **generality spectrum** from most inclusive (abstract, overarching) to most specific (concrete, instance-level). The most general concept becomes the apex of the hierarchy. For example, in a map on photosynthesis: "photosynthesis" > "light-dependent reactions" > "photosystem II" > "P680 reaction center."
- Flag **cross-link candidates** -- concepts that appear in two different conceptual branches but are meaningfully related. These will be drawn last but identified now.

### Step 3: Build the Propositional Structure

The core intellectual work of concept mapping is writing valid propositions, not drawing boxes.

- A **proposition** is the unit of meaning: Node A + Link Label + Node B = one meaningful, testable claim. For example: "Insulin [enables] glucose uptake" or "Extinction [is caused by] repeated CS presentation without UCS." Every connection in the map must form a valid proposition when read aloud.
- Use **specific, active link labels** -- never use generic connectors like "relates to," "is connected to," or "involves." These labels carry no information. Instead: "causes," "inhibits," "is a type of," "requires," "produces," "is measured by," "precedes," "contrasts with."
- Use the **six core relationship types** as a classification framework when choosing link labels:
  - *Hierarchical*: "is a type of," "is an example of," "includes," "is a subclass of"
  - *Causal*: "causes," "leads to," "inhibits," "prevents," "results in," "triggers"
  - *Temporal*: "precedes," "follows," "occurs during," "initiates"
  - *Functional*: "is used for," "enables," "requires," "produces," "measures"
  - *Comparative*: "differs from," "is similar to," "contrasts with," "is analogous to"
  - *Conditional*: "depends on," "requires," "is limited by," "is absent when"
- Directionality matters: arrows are **not symmetric**. "DNA [encodes] protein" is not the same proposition as "protein [encodes] DNA." Always verify that the arrow direction makes the proposition factually correct.
- Avoid **propositional chains** longer than three nodes in a single link. If you need "A causes B which causes C which causes D," break this into two propositions with a shared intermediate node.

### Step 4: Construct the Text-Based Map Architecture

Render the map in structured ASCII notation since visual diagrams cannot be reproduced in plain text.

- Use the **indented arrow notation** as the primary format:
  ```
  [CENTRAL CONCEPT]
    |-- relationship --> [CONCEPT B]
    |     |-- relationship --> [CONCEPT C]
    |-- relationship --> [CONCEPT D]
          |-- relationship --> [CONCEPT E]
  ```
- Place the **most general concept at the apex**. The second tier contains the major conceptual branches (typically 3-6). Each subsequent tier increases specificity.
- Render **cross-links** separately from the hierarchy, using an explicitly labeled "Cross-Links" section below the main tree. Format: `[CONCEPT A] <-- relationship --> [CONCEPT B] (connects [Branch X] to [Branch Y])`. Cross-links are the most intellectually significant feature of a well-built map because they reveal integrative understanding.
- Use **consistent bracket notation**: square brackets `[ ]` for nodes (concepts), angle brackets for cross-links, and plain text for link labels between them.
- Add a **focus question** at the top of the map. Novak's methodology requires a focus question because it determines which concepts are relevant and which are peripheral. Example focus question: "How does the immune system distinguish self from non-self, and what happens when this fails?" A map without a focus question is a general reference diagram, not a learning tool.

### Step 5: Add Exemplars and Anchor Instances

Concept maps without concrete examples remain abstract and do not transfer to exam performance.

- For each **second-tier or third-tier node**, add at least one exemplar in parentheses immediately after the node label. Example: `[Operant Conditioning (e.g., rat pressing lever for food pellet)]`. Exemplars ground abstract relationships in retrievable memories.
- Flag **common confusions and contrasting pairs** directly within the map using a "contrasts with" link. High-yield contrasting pairs (those that appear repeatedly on exams and in assessments) include: classical vs. operant conditioning; mitosis vs. meiosis; correlation vs. causation; speed vs. velocity; oxidation vs. reduction.
- For science and medicine maps, include **quantitative anchors** where they exist. "Resting membrane potential is approximately -70 mV" belongs in the node label or as an attached annotation, not in a separate list.
- Distinguish **definitional relationships** from **empirical relationships**. "Velocity is defined as displacement divided by time" is a definitional link (true by definition). "Heart rate increases with exercise intensity" is an empirical claim (could be falsified). Labeling these differently prevents category errors in exam answers.

### Step 6: Build Cross-Links and Identify Integration Points

Cross-links are the signature of genuine understanding -- they deserve deliberate construction.

- Review every **pair of branches** in the map and ask: "Is there any meaningful relationship between a concept on Branch A and a concept on Branch B that is not captured in the hierarchy?" If yes, add a cross-link.
- A well-built map of 20 nodes should have **at least 3-5 cross-links**. If there are zero cross-links, the map is an outline wearing a concept map's clothing -- push the learner to find integration points.
- Common cross-link patterns by domain: In biology, metabolic pathways cross-link to cell structure (mitochondria to ATP synthesis); in history, economic factors cross-link to political events; in psychology, neuroscience mechanisms cross-link to behavioral phenomena; in physics, mathematical formalisms cross-link to physical phenomena.
- Cross-links often reveal **prerequisite relationships** that are invisible in a simple hierarchy. Identifying these helps learners sequence their study: "I cannot understand enzyme kinetics until I understand equilibrium constants."

### Step 7: Deliver the Map with Self-Assessment and Study Plan

The map is a means, not an end. Close the loop with actionable learning guidance.

- Provide a **proposition audit**: list 5-8 of the most important propositions from the map in plain sentence form. These are the claims the learner must be able to reproduce and explain. This converts the map into a testable artifact.
- Include a **self-check protocol** calibrated to the learner's stated purpose: exam prep requires recall and application; deep understanding requires explanation and transfer.
- Apply **spaced repetition timing**: revisit the map at Day 1, Day 4, and Day 11 for standard academic material. For high-stakes exams within a short window, compress to Day 0 (today), Day 2, Day 5.
- Recommend a **follow-on technique** that complements concept mapping: flashcard generation targets individual node definitions; the Feynman technique uses the map as a script for explanation; practice questions test application of the propositions identified in the map.
- If the learner has prior concept maps on related topics, explicitly indicate **where the new map connects to previous ones** -- these inter-map connections are the highest level of conceptual integration.

---

## Output Format

```
## Concept Map: [Topic]

**Focus Question:** [One specific question this map answers]
**Subject:** [Subject area]
**Topic:** [Specific topic]
**Source Material:** [Lecture notes / Chapter X / Textbook section / Described by learner]
**Learner Purpose:** [Exam prep / Deep understanding / Teaching / Essay writing]
**Grain Size:** [Single lecture / Chapter / Unit / Course]

---

### Concept Inventory (Parking Lot)

Ranked from most general to most specific:

1. [Most general concept -- apex]
2. [Second tier -- major branch concept]
3. [Second tier -- major branch concept]
...
[N]. [Most specific concept -- leaf node]

**Total nodes:** [Number]
**Cross-link candidates:** [List 2-4 concepts flagged for cross-linking]

---

### Concept Map

[FOCUS QUESTION: Write the focus question here]

[APEX CONCEPT]
  |
  |-- [relationship label] --> [SECOND-TIER CONCEPT A (exemplar)]
  |     |
  |     |-- [relationship label] --> [THIRD-TIER CONCEPT A1 (exemplar)]
  |     |     |-- [relationship label] --> [FOURTH-TIER CONCEPT A1a]
  |     |
  |     |-- [relationship label] --> [THIRD-TIER CONCEPT A2]
  |           |-- [relationship label] --> [FOURTH-TIER CONCEPT A2a]
  |
  |-- [relationship label] --> [SECOND-TIER CONCEPT B (exemplar)]
  |     |
  |     |-- [relationship label] --> [THIRD-TIER CONCEPT B1]
  |     |-- [relationship label] --> [THIRD-TIER CONCEPT B2]
  |           |-- [relationship label] --> [FOURTH-TIER CONCEPT B2a]
  |
  |-- [relationship label] --> [SECOND-TIER CONCEPT C (exemplar)]
        |
        |-- [relationship label] --> [THIRD-TIER CONCEPT C1]
        |-- [relationship label] --> [THIRD-TIER CONCEPT C2]

---

### Cross-Links

(These connections span separate branches and indicate integrative understanding)

| From Concept | Relationship | To Concept | Branches Connected |
|---|---|---|---|
| [CONCEPT X] | [link label] | [CONCEPT Y] | [Branch A] <--> [Branch B] |
| [CONCEPT P] | [link label] | [CONCEPT Q] | [Branch B] <--> [Branch C] |
| [CONCEPT R] | [link label] | [CONCEPT S] | [Branch A] <--> [Branch C] |

---

### Proposition Audit

The 6-8 most important claims encoded in this map (read these aloud -- each must be a true, testable statement):

1. [Node A] [link label] [Node B] -- because: [one-sentence explanation]
2. [Node C] [link label] [Node D] -- because: [one-sentence explanation]
3. [Node E] [link label] [Node F] -- because: [one-sentence explanation]
4. [Node G] [link label] [Node H] -- because: [one-sentence explanation]
5. [Node I] [link label] [Node J] -- because: [one-sentence explanation]
6. [Node K] [link label] [Node L] -- because: [one-sentence explanation]

---

### Map Quality Indicators

| Criterion | Status | Notes |
|---|---|---|
| Focus question answered | [ ] Yes / [ ] Partial | |
| All source concepts included | [ ] Yes / [ ] Missing: _____ | |
| No generic link labels ("relates to") | [ ] Yes / [ ] Fix: _____ | |
| Cross-links present (min 3) | [ ] Yes ([N] found) / [ ] No | |
| No orphan nodes | [ ] Yes / [ ] Fix: _____ | |
| Hierarchy flows general --> specific | [ ] Yes / [ ] Fix: _____ | |

---

### Self-Check Protocol

**Recall level** (Can you retrieve from memory?):
- [ ] State the focus question and give a 2-sentence answer from memory
- [ ] List the [N] major branches of this map without looking
- [ ] Name 3 cross-links and explain why they exist

**Application level** (Can you use this knowledge?):
- [ ] Apply the key propositions to a novel scenario: [Specific scenario relevant to the topic]
- [ ] Identify which concept is the prerequisite for understanding [specific node]
- [ ] Explain the difference between [Concept A] and [Concept B] using the map's link labels

**Gap check:**
- Concepts I cannot explain without looking: [Leave blank -- learner fills in]
- Links I am unsure about: [Leave blank -- learner fills in]

---

### Study Plan

**Spaced Repetition Schedule:**
- Review today: Build map from memory (cover this document, redraw on paper)
- Review in 1-4 days: Verify propositions, add any missed cross-links
- Review in 7-14 days: Integrate with adjacent topic maps

**Next Technique:**
- [Recommended follow-on skill] -- rationale: [Why this complements concept mapping for this specific material]

**Integration with Prior Knowledge:**
- This map connects to: [Related topic or prior map]
- Key integration point: [Specific cross-concept connection to prior learning]
```

---

## Rules

1. **Never build from a topic name alone.** "Explain the Krebs cycle" is not source material. Ask for the learner's actual content -- their notes, their textbook section, their lecture slides. The map must reflect the learner's specific source, not a generic internet summary of the topic.

2. **Every link label must form a valid proposition.** Test every connection by reading it as a sentence: "[Node A] [link label] [Node B]." If the result is grammatically broken, factually wrong, or semantically empty, fix the label. Labels like "relates to," "is connected with," or "is associated with" are always rejected -- they carry no propositional content.

3. **The focus question drives node selection.** Concepts that do not contribute to answering the focus question are omitted even if they appear in the source material. A map that tries to include everything becomes an index, not a cognitive tool. If the learner has not specified a purpose, assign a focus question based on the most common exam or application angle for that topic.

4. **Cross-links are mandatory for maps with more than 10 nodes.** A hierarchy with no cross-links is an outline. The concept mapping technique's cognitive benefit -- integrative understanding -- comes from cross-links. If the learner's source material genuinely has no cross-linkable concepts, flag this and explain that a simple hierarchy or outline may be more appropriate.

5. **Node count controls are non-negotiable.** Below 8 nodes: add depth or expand scope. Above 30 nodes: split into a master map with linked sub-maps. A master map contains 8-12 super-ordinate concepts with explicit pointers to sub-maps (e.g., "[Immune Response] --> see Sub-Map 2").

6. **Arrows are directional and meaningful.** "Insulin enables glucose uptake" is not the same as "glucose uptake enables insulin." Never use bidirectional arrows unless the relationship is genuinely symmetric and symmetric relationships should be labeled in both directions. If a relationship appears bidirectional (e.g., supply and demand), label each direction with a distinct link label.

7. **Do not omit exemplars for abstract second-tier nodes.** Concept maps without concrete instances remain cognitively inert for most learners. Every second-tier concept and any third-tier concept that is abstract must include at least one parenthetical exemplar. This is especially critical in philosophy, economics, and psychology where concepts are definitionally abstract.

8. **The proposition audit is not optional.** Listing the 6-8 most important propositions in plain sentence form is the feature that makes the map testable and connects it to exam preparation. Learners who only look at the map diagram cannot self-assess. The audit converts the visual structure into falsifiable claims.

9. **Respect the learner's terminology.** If a learner's course uses "negative reinforcement" in a specific technical sense, use that term -- do not substitute "avoidance conditioning" even if technically equivalent. Concept maps encode the learner's knowledge structure, not the definitive academic taxonomy. Note discrepancies between lay usage and technical usage explicitly in the map if they are a source of confusion.

10. **When source material contains errors, flag and correct explicitly.** If the learner's notes contain a factual error (e.g., confusing independent and dependent variables), do not silently correct it by building a correct map. State the discrepancy: "Your notes describe X, but the accurate relationship is Y. I have built the map with the correct relationship and marked this node for review." The learner must know where their notes diverge from accurate knowledge.

---

## Edge Cases

### Learner provides dense technical content that exceeds single-map scope

When source material covers more than roughly 30 candidate concepts (a full chapter, a multi-topic unit, an entire course module), do not attempt a single flat map.

Build a **master map** containing only the 8-12 most super-ordinate concepts, with each second-tier node explicitly labeled as "[Topic] -- see Sub-Map [N]." Then build 2-4 sub-maps at the next level of specificity. Deliver the master map first and ask the learner which sub-topic to expand into a sub-map first. This mirrors how expert concept map practitioners (including Novak's original research groups) handled complex scientific domains.

### Learner's source material contains circular or mutually dependent concepts

Some domains genuinely involve circular causation: supply and demand affect each other; stress and sleep quality are bidirectionally related; inflammation causes tissue damage which causes inflammation. Standard hierarchies cannot represent these.

When circular relationships exist: represent them as cross-links rather than hierarchical arrows, use directional labels that specify each direction ("increases demand for" and "is increased by demand from"), and flag the circularity explicitly in the proposition audit with a note: "This is a feedback loop, not a simple causal chain." Never force a circular relationship into a one-directional hierarchy link -- doing so introduces factual distortions.

### Learner is unfamiliar with concept mapping and asks for a tutorial

Provide a **3-sentence orientation only**, then immediately begin building the map. Do not deliver a lecture on Novak's history or cognitive theory. The three sentences should cover: (1) what a node is, (2) what a link label does, and (3) what a cross-link reveals. Then say "Let me show you by building one from your material" and proceed with the full process. Learning through the artifact is faster than reading an explanation of the artifact.

### Source material is primarily procedural rather than conceptual

Some content (titration procedures, algorithm implementations, surgical techniques) is fundamentally about sequenced actions rather than relational concepts. A concept map can still be useful but must be reframed: the nodes become **states** or **conditions** rather than conceptual categories, and the links become temporal-causal ("precedes," "transitions to," "is required before," "enables"). Notify the learner that for primarily procedural material, a flowchart represents the sequence better, but a concept map can still capture the underlying conceptual structure (why each step exists, what conditions enable each transition). Offer both approaches.

### Learner's material is in a domain where the correct vocabulary is contested

In fields like economics, social science, philosophy of mind, and nutrition science, different schools of thought use incompatible terminologies for similar constructs. If the learner is from a specific course or textbook tradition, match that tradition's vocabulary and note where it diverges from competing frameworks. For example: "Your course uses 'demand-pull inflation' (Keynesian framing). Some economists describe this differently. This map reflects your course's definitions." Do not attempt to build an ecumenical map that resolves contested definitional disputes -- that is outside scope.

### Learner wants to compare two competing theories or frameworks

When the learner's purpose is explicitly comparative (classical vs. operant conditioning, Newtonian vs. Einsteinian mechanics, structuralism vs. functionalism), build a **parallel concept map** structure rather than a single hierarchy. Use a common apex ("Learning" or "Mechanics") with two parallel second-tier branches, one for each framework. Then use "contrasts with" cross-links to connect corresponding nodes across branches. This structure makes the comparison explicit and preserves the integrity of each framework rather than artificially merging them.

### Learner has produced a concept map themselves and asks for feedback

When reviewing a learner-produced map rather than building one, evaluate against five criteria in this order: (1) Is the focus question present and does the map answer it? (2) Are link labels propositionally valid -- do they form true sentences when read with their nodes? (3) Are there cross-links, and if not, identify 2-3 that should exist? (4) Are the most abstract concepts at the apex and the most specific at the leaves? (5) Are there any nodes that are actually link labels in disguise (verbs or processes that should be link labels, not nodes)? Provide specific, corrective feedback for each failure point with a revised example.

### Map is intended for a subject the learner is studying in a second language

Allow the learner to label nodes and link labels in their native language if the source material is in an L2 they are still developing. The concept mapping task should not be simultaneously a language learning task unless that is the stated goal. However, if the learner is specifically trying to acquire L2 vocabulary as part of studying, suggest a hybrid: use L2 terms for nodes with L1 translations in parentheses. This preserves the language exposure without obscuring the conceptual structure.

---

## Example

**Input:** "Help me create a concept map for my psychology lecture on classical conditioning. We covered Pavlov's experiments, unconditioned and conditioned stimuli, acquisition, extinction, spontaneous recovery, generalization, and discrimination. I'm studying for an exam in 3 days."

---

**Output:**

## Concept Map: Classical Conditioning

**Focus Question:** How does a neutral stimulus come to produce a learned response, and what determines whether that response persists or fades?
**Subject:** Psychology
**Topic:** Classical Conditioning
**Source Material:** Lecture notes -- Pavlov's experiments and associated phenomena
**Learner Purpose:** Exam preparation (3-day window)
**Grain Size:** Single lecture

---

### Concept Inventory (Parking Lot)

Ranked from most general to most specific:

1. Classical Conditioning -- apex
2. Stimuli -- major branch
3. Responses -- major branch
4. Learning Phases -- major branch
5. Phenomena After Acquisition -- major branch
6. Unconditioned Stimulus (UCS)
7. Conditioned Stimulus (CS)
8. Neutral Stimulus (NS)
9. Unconditioned Response (UCR)
10. Conditioned Response (CR)
11. Acquisition
12. Extinction
13. Spontaneous Recovery
14. Generalization
15. Discrimination
16. Pavlov's Dog Experiment

**Total nodes:** 16
**Cross-link candidates:** Extinction <--> Spontaneous Recovery; Generalization <--> Discrimination; CS <--> Acquisition

---

### Concept Map

[FOCUS QUESTION: How does a neutral stimulus come to produce a learned response, and what determines whether that response persists or fades?]

[CLASSICAL CONDITIONING]
  |
  |-- involves --> [STIMULI]
  |     |
  |     |-- includes --> [UNCONDITIONED STIMULUS / UCS (e.g., food powder)]
  |     |     |-- naturally triggers --> [UNCONDITIONED RESPONSE / UCR (e.g., salivation to food)]
  |     |
  |     |-- begins as --> [NEUTRAL STIMULUS / NS (e.g., bell before training)]
  |     |     |-- becomes through pairing --> [CONDITIONED STIMULUS / CS (e.g., bell after training)]
  |     |           |-- triggers after learning --> [CONDITIONED RESPONSE / CR (e.g., salivation to bell)]
  |     |                 |-- resembles but is weaker than --> [UCR]
  |
  |-- produces --> [RESPONSES]
  |     |
  |     |-- classified as --> [UNCONDITIONED RESPONSE / UCR]
  |     |-- classified as --> [CONDITIONED RESPONSE / CR]
  |
  |-- proceeds through --> [LEARNING PHASES]
  |     |
  |     |-- begins with --> [ACQUISITION]
  |     |     |-- requires --> [REPEATED UCS-CS PAIRING]
  |     |     |-- is stronger when --> [CS PRECEDES UCS by 0.5 seconds (ideal interval)]
  |     |
  |     |-- demonstrated by --> [PAVLOV'S DOG EXPERIMENT]
  |           |-- established --> [CS-UCS ASSOCIATION]
  |
  |-- generates --> [PHENOMENA AFTER ACQUISITION]
        |
        |-- includes --> [EXTINCTION]
        |     |-- occurs when --> [CS is presented repeatedly without UCS]
        |     |-- results in --> [GRADUAL WEAKENING of CR]
        |     |-- does NOT mean --> [FORGETTING (association is suppressed, not erased)]
        |
        |-- includes --> [SPONTANEOUS RECOVERY]
        |     |-- occurs when --> [REST PERIOD follows extinction]
        |     |-- produces --> [TEMPORARY RETURN of CR]
        |
        |-- includes --> [GENERALIZATION]
        |     |-- occurs when --> [STIMULI SIMILAR TO CS also trigger CR]
        |     |-- example --> [DIFFERENT-PITCHED BELL triggers partial salivation]
        |
        |-- includes --> [DISCRIMINATION]
              |-- occurs when --> [ORGANISM RESPONDS ONLY TO SPECIFIC CS]
              |-- requires --> [DIFFERENTIAL REINFORCEMENT during training]

---

### Cross-Links

| From Concept | Relationship | To Concept | Branches Connected |
|---|---|---|---|
| Extinction | is reversed by | Spontaneous Recovery | Phenomena After Acquisition (internal) |
| Generalization | is the opposite process of | Discrimination | Phenomena After Acquisition (internal) |
| CS | must precede to initiate | Acquisition | Stimuli branch <--> Learning Phases branch |
| CR | is weaker than and resembles | UCR | Responses branch (internal comparison) |
| Pavlov's Dog Experiment | was the original evidence for | Classical Conditioning | Learning Phases <--> Apex |

---

### Proposition Audit

1. **A Neutral Stimulus becomes a Conditioned Stimulus through repeated pairing with an Unconditioned Stimulus** -- because contiguity (close timing) between NS and UCS is the mechanism that builds the CS-UCS association; without repeated pairing, no conditioning occurs.

2. **The Conditioned Response resembles but is weaker than the Unconditioned Response** -- because the CR is a learned approximation of the UCR; the organism has learned to anticipate, not to fully replicate, the original reflex.

3. **Acquisition is strongest when the CS precedes the UCS by approximately 0.5 seconds** -- because too short an interval does not allow the organism to register the predictive relationship; too long an interval breaks the temporal contiguity required for association.

4. **Extinction occurs when the CS is repeatedly presented without the UCS** -- because the predictive value of the CS is undermined; the organism learns that the CS no longer reliably signals the UCS.

5. **Extinction does NOT equal forgetting** -- because the CS-UCS association is suppressed, not erased; evidence comes from spontaneous recovery, where the CR reappears after a rest period without further training.

6. **Spontaneous Recovery demonstrates that extinction is active inhibition, not erasure** -- because if forgetting had occurred, rest alone could not restore the CR; the return of the CR after rest reveals the original association was merely suppressed.

7. **Generalization and Discrimination are opposing adaptive processes** -- because generalization is evolutionarily useful (respond to stimuli similar to a dangerous one), while discrimination is useful when precision matters (respond only to the exact signal); both emerge from the same conditioning process.

---

### Map Quality Indicators

| Criterion | Status | Notes |
|---|---|---|
| Focus question answered | Yes | Acquisition answers "how it begins"; Extinction/SR answer "whether it persists" |
| All source concepts included | Yes | All 8 lecture concepts present |
| No generic link labels | Yes | No "relates to" or "is connected with" labels used |
| Cross-links present (min 3) | Yes (5 found) | All cross-links biologically and psychologically valid |
| No orphan nodes | Yes | Every node connects to at least one other |
| Hierarchy flows general --> specific | Yes | Classical Conditioning > Phases > Phenomena > Specific examples |

---

### Self-Check Protocol

**Recall level:**
- [ ] State the focus question and give a 2-sentence answer from memory
- [ ] Without looking, list the 4 major branches (Stimuli, Responses, Learning Phases, Phenomena After Acquisition)
- [ ] Name the 3 cross-links that span the Phenomena branch and explain why each exists

**Application level:**
- [ ] Novel scenario: A child is bitten by a dog (UCS) and hears a bark (NS). The child later flinches (CR?) when they hear any bark. Apply the map -- identify UCS, UCR, CS, CR, and name which post-acquisition phenomenon the "any bark" response represents.
- [ ] Explain why Pavlov's experiments required many trials rather than one (use the Acquisition node and the 0.5-second interval proposition)
- [ ] A dog stops salivating to the bell after 20 extinction trials. A week later, the bell again produces slight salivation. Name the phenomenon, trace it on the map, and explain why it disproves simple forgetting.

**Gap check:**
- Concepts I cannot explain without looking: ______
- Link labels I am uncertain about: ______

---

### Study Plan

**Spaced Repetition Schedule (exam in 3 days):**
- Today (Day 0): Cover this document. Redraw the map from memory on paper. Check against this version.
- Day 1: Restate all 7 propositions in the audit without reading them. Add any missed nodes.
- Day 2 (day before exam): Work through all 3 application-level self-check scenarios without notes. Confirm you can trace any exam scenario to the correct node and link label.

**Next Technique:**
- Use `flashcard-generation` for the 7 key proposition statements -- create one card per proposition with the "because" explanation on the back. Rationale: the map gives you structure; flashcards drill individual propositions for rapid retrieval under exam time pressure.

**Integration with Prior Knowledge:**
- This map connects to: Operant Conditioning (your next likely lecture topic)
- Key integration point: Classical conditioning involves involuntary, reflexive responses (UCR/CR); operant conditioning involves voluntary behaviors shaped by consequences. Build a cross-link between these two maps when you cover operant conditioning -- the contrast is high-yield for most psychology exams.
- Secondary connection: The extinction process here parallels desensitization in therapy (systematic desensitization deliberately uses extinction of conditioned fear responses). Flag this when you reach clinical applications units.
