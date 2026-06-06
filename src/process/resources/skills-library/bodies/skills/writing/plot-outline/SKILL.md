---
name: plot-outline
description: |
  Creates structured plot outlines for novels, novellas, screenplays, and serialized fiction using established story architecture frameworks. Maps narrative arcs, turning points, and character trajectories.
  Use when the user asks to outline a story, plan a novel, structure a plot, or map a narrative arc.
  Do NOT use for writing scenes (use scene-writing), writing complete short stories (use short-story-writing), or developing characters without plot context (use character-development).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "creative-writing writing planning"
  category: "writing"
  subcategory: "creative-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Plot Outline

## When to Use

**Use this skill when:**
- The user asks to outline a novel, novella, screenplay, limited series, or serialized fiction from a premise, concept, or partial draft
- The user has a story idea and needs to map it into a workable structural architecture before writing begins
- The user is stuck mid-draft and needs to reverse-engineer their existing material into an outline to identify where the story broke down
- The user needs help with pacing problems -- sagging middles, rushed endings, or act breaks that land in the wrong place
- The user wants to understand how their story's external plot events align with their protagonist's internal transformation arc
- The user is adapting existing source material (memoir, true crime, mythology, IP) into a new format and needs to restructure it narratively
- The user wants to compare multiple structural approaches before committing to one framework
- The user is writing a genre story and needs to identify which genre-specific obligatory scenes and conventions belong at which structural positions

**Do NOT use this skill when:**
- The user wants to write a complete short story under 7,500 words -- use `short-story-writing`, which handles compressed narrative differently
- The user wants to draft or develop a specific scene -- use `scene-writing`, which focuses on moment-by-moment execution rather than architecture
- The user wants to develop a character's psychology, backstory, or voice without reference to plot -- use `character-development`
- The user wants to build a world's geography, history, magic system, or cultural rules without narrative structure -- use `world-building`
- The user wants feedback on a completed manuscript -- use `manuscript-critique`, which evaluates executed prose, not structural planning
- The user wants to write a personal essay, memoir chapter, or creative nonfiction piece -- the narrative principles overlap, but the constraints differ enough to warrant `creative-nonfiction-structure`

---

## Process

### Step 1: Gather Story Parameters Before Touching Structure

Do not begin outlining until you have enough material to build from. Ask for or extract the following:

- **Format and length:** Novel (70,000--120,000 words), literary novel (55,000--90,000), thriller/mystery (70,000--90,000), romance (50,000--100,000 depending on subgenre), novella (20,000--50,000), screenplay (90--120 pages for features; 22--30 pages for half-hour TV; 42--55 pages for hour-long TV), limited series (6--10 episodes at 42--55 pages each)
- **Genre and subgenre:** Genre is not decoration -- it dictates mandatory story beats, reader expectations, and pacing rhythms. A cozy mystery and a psychological thriller both involve murder, but they require fundamentally different structural commitments
- **One-sentence premise:** The story in its most compressed form. The test: does it contain a protagonist, a situation, and a built-in tension? "A woman discovers her dying patient is her sister's murderer" passes. "A story about grief and justice" fails -- that is a theme, not a premise
- **Protagonist's external goal:** What they are actively pursuing that the plot can track scene by scene
- **Protagonist's internal wound or lie:** The false belief they hold at the start that the story will force them to confront -- this is what drives the character arc
- **Central antagonistic force:** This can be a villain, a system, nature, another character, or the protagonist's own psychology. The antagonist must be strong enough to defeat the protagonist repeatedly before the climax
- **Tone and register:** Dark and unrelenting, darkly comic, hopeful, ironic, epic, intimate. Tone determines how setbacks are framed and how the ending lands
- **Existing material:** If the user has already written scenes, chapters, or notes, map what is committed versus what is still open. Do not outline over confirmed material -- integrate it

If the user cannot answer the protagonist's internal wound, stop and help them find it before proceeding. External plots without internal arcs produce stories that feel empty even when technically competent.

---

### Step 2: Select and Justify the Structural Framework

Present the recommended framework with explicit reasoning based on the user's genre, format, and premise. Do not apply frameworks mechanically -- understand what each one is optimized for:

**Three-Act Structure (Aristotle / Field / McKee)**
- Proportions: Act 1 = 25%, Act 2 = 50%, Act 3 = 25%
- In a 90,000-word novel: Act 1 ends around word 22,500; Act 2 ends around word 67,500
- In a 110-page screenplay: Act 1 ends around page 27; Act 2 ends around page 82
- Core logic: Disruption -- Complication -- Resolution. Every other framework is a refinement of this skeleton
- Best for: Most commercial fiction, screenplays, stories with clear external conflict
- Weakness: "Act 2" is so long (45,000 words in a novel) that it almost always requires internal subdivision

**Save the Cat Beat Sheet (Blake Snyder)**
- 15 named beats with specific page/word targets for screenplays; adaptable to novels
- Key beats: Opening Image (page 1), Theme Stated (page 5), Catalyst/Inciting Incident (page 12), Break into Act 2 (page 25), Fun and Games (pages 25--55), Midpoint (page 55), All Is Lost (page 75), Dark Night of the Soul (pages 75--80), Break into Act 3 (page 80), Finale (pages 85--110), Final Image (page 110)
- For novels, multiply page numbers by roughly 800 to get approximate word counts
- Best for: High-concept commercial fiction, genre thrillers, screenplays, stories where marketability matters
- Weakness: Can produce formulaic results if followed too rigidly; literary fiction often benefits from looser application

**The Hero's Journey (Campbell / Vogler)**
- 12 stages: Ordinary World, Call to Adventure, Refusal of the Call, Meeting the Mentor, Crossing the Threshold, Tests/Allies/Enemies, Approach to the Inmost Cave, Ordeal, Reward, Road Back, Resurrection, Return with the Elixir
- The Ordeal (stage 8) maps roughly to the midpoint -- this is where the hero "dies" symbolically and is reborn
- Best for: Epic fantasy, adventure, mythology-driven stories, coming-of-age narratives where transformation is the explicit subject
- Weakness: The 12 stages can be distorted into a checklist that produces inert, predictable genre fiction; the stages are archetypal patterns, not mandatory scenes

**Seven-Point Story Structure (Dan Wells)**
- 7 points: Hook (opposite of resolution), Plot Turn 1 (call to adventure), Pinch Point 1 (antagonist force shown at full strength), Midpoint (protagonist shifts from reactive to proactive), Pinch Point 2 (antagonist applies maximum pressure), Plot Turn 2 (protagonist gains final tool or knowledge), Resolution
- Design principle: Start by defining the Hook and Resolution (opposite states), then build backward to identify what must be true at each turning point
- Best for: Tight genre fiction, mysteries, thrillers, stories where the plot machinery must be airtight
- Weakness: The "pinch points" can feel mechanical; literary nuance requires looser handling

**Four-Act Structure (for television)**
- Acts: Setup, Complication, Crisis, Resolution -- with a teaser and tag in some formats
- Each act in an hour-long drama ends on a "button" -- a mini-cliffhanger or reversal that motivates continuing past the commercial break
- In streaming formats without commercial breaks, act breaks still function as pacing anchors but are softer
- Best for: Episodic television, limited series, serialized web fiction
- Applies per episode AND across the season arc

**Kishotenketsu (四起承転結)**
- 4 sections: Ki (introduction), Sho (development), Ten (twist/complication that recontextualizes what came before), Ketsu (reconciliation/conclusion)
- Crucially: The Ten is not a conflict in the Western sense -- it is a juxtaposition or unexpected element that forces a reframe
- Best for: Literary fiction, short-form narrative, stories that resist binary conflict structures, manga/anime narrative traditions
- Weakness: Western readers trained on conflict-drive narrative may find it unsatisfying if handled without skill; it requires mastery to execute effectively

**The Fichtean Curve**
- Structure: Multiple rising crises with no formal Act 1 setup -- the story begins in medias res with the first crisis, and exposition is woven into the action
- The curve rises with each crisis, drops slightly between them, then rises to the climax
- Best for: Short stories expanding into novella length, thrillers that must grab readers immediately, stories where backstory is a liability
- Weakness: Establishing character sympathy is harder without setup; readers can feel disoriented if grounding is insufficient

**When to recommend hybrid frameworks:** Genre mashups (romantic thriller, comic horror) often need hybrid structures. The dominant genre provides the primary framework; the secondary genre provides obligatory scenes layered in. A romantic thriller uses the thriller three-act spine but places the romance beats (meet, first kiss, black moment, reconciliation) at structurally important positions within it.

---

### Step 3: Map the Dual Throughlines -- External Plot and Internal Arc

Every well-structured story runs two parallel stories simultaneously: the external plot (what happens) and the internal arc (who the protagonist becomes). The outline must track both explicitly.

**The External Plot** is event-driven:
- What does the protagonist want? (Visible goal)
- What external obstacles block them? (Plot complications)
- What does the protagonist do to overcome those obstacles? (Actions and choices)
- What is the irreversible consequence if they fail? (Stakes)

**The Internal Arc** is transformation-driven:
- What false belief or wound does the protagonist carry into the story? (The Lie)
- What experiences force the protagonist to question that belief? (Theme in action)
- What is the moment of maximum resistance -- where they almost choose the Lie over the Truth? (All Is Lost / Dark Night of the Soul)
- What choice in the climax demonstrates they have integrated the Truth, or doubled down on the Lie in a tragedy? (Proof of transformation)

**The Mirror Test:** At the midpoint, the protagonist's external situation should be the inverse of where they started. If they started isolated, they should now have allies (even temporary ones). If they started with power, they should now be vulnerable. The midpoint reversal creates the story's second-act engine by shifting the protagonist from reactive (responding to events) to proactive (initiating events). Without this shift, the middle sags.

**Mapping internal arc to act breaks:**
- Act 1 end: Protagonist has been disrupted and chooses to engage with the conflict -- but their choice is still contaminated by the Lie
- Act 2 midpoint: Something cracks the Lie open -- a new piece of information, a relationship that challenges it, or a failure that the Lie cannot explain
- Act 2 end / All Is Lost: The Lie collapses and takes the protagonist's plan with it. Everything they built using the Lie is destroyed
- Act 3 / Climax: Protagonist acts from the Truth for the first time, which is what allows them to succeed (or, in tragedy, refuses the Truth one final time, which seals their fate)

---

### Step 4: Identify and Place All Structural Anchors

Before filling in the full outline, place these anchor beats -- they are non-negotiable structural positions that everything else is built around:

**The Inciting Incident:** The event that disrupts the protagonist's status quo and sets the story's central question in motion. It must be specific, irreversible, and personal to the protagonist. It is not the backstory; it happens in story-present. In a novel, it typically occurs between 10--15% in; in a screenplay, around page 10--15. If it arrives after 20%, the story is starting too late.

**The First Plot Turn (End of Act 1):** The protagonist makes an irreversible commitment to the central conflict. The story's world changes permanently. In Save the Cat, this is the "Break into Act 2." In the Hero's Journey, this is "Crossing the Threshold." After this moment, returning to the Act 1 status quo is impossible.

**The Midpoint:** The story's fulcrum. The protagonist shifts from reactive to proactive. Stakes are raised to their maximum. Often involves a false victory (protagonist thinks they've won, but the real threat is just beginning) or a false defeat (everything seems lost, but the protagonist gains new information that reframes the conflict). The midpoint at 50% is not a suggestion -- when it drifts past 55%, the second half of Act 2 collapses under its own weight.

**The All Is Lost Moment:** The lowest point. The protagonist's external plan has failed and their internal wound has been exposed. This is structurally distinct from the climax -- it is not the final confrontation but the point before it. Occurs around 75% in most structures. In Save the Cat, it is followed immediately by "Dark Night of the Soul" -- a moment of stillness where the protagonist must choose to continue.

**The Climax:** The final confrontation between the protagonist and the antagonistic force, resolved by a choice that reflects who the protagonist has become. The climax must be earned by everything that preceded it. An unearned climax -- one that resolves by coincidence, external rescue, or information the reader does not have -- destroys story satisfaction retroactively.

**The Resolution:** Shows the new status quo. In commercial fiction, it is typically brief (1--2 scenes). In literary fiction, it may be longer and more ambiguous. The Opening Image / Final Image contrast (from Save the Cat) is a useful lens: what image opened the story, and how does the final image comment on how far the world or protagonist has traveled?

---

### Step 5: Integrate Genre-Specific Obligatory Scenes

Every genre carries reader contracts -- scenes the audience expects to encounter. Subverting these expectations requires first knowing them. Missing them entirely is not subversion; it is a structural failure that produces reader disappointment.

**Mystery / Crime:**
- The Crime must occur in Act 1, either on-page or discovered on-page
- The Detective (professional or amateur) must be introduced and connected to the case with personal stakes by the end of Act 1
- Red herrings must be planted with enough credibility that the reader genuinely suspects them -- not just listed
- The False Solution: Around the midpoint or Act 2, the protagonist believes they have solved it -- they are wrong, and the consequence of being wrong must raise the stakes
- The revelation must be fair-play: all clues must be available to the reader before the reveal, even if the reader did not recognize them as clues
- In cozy mystery: A closed community of suspects; the detective is embedded in it; violence is present but not visceral
- In psychological thriller: The detective may be unreliable; the "crime" may be ambiguous until late in the story

**Romance:**
- Meet: The two leads must encounter each other in a way that establishes both attraction and obstacle simultaneously
- The "black moment" (forced separation or apparent irreconcilability) must occur in Act 3, not Act 2 -- Act 2 complications are obstacles to the relationship, not the relationship's apparent death
- Happily Ever After (HEA) is mandatory in romance; Happily For Now (HFN) is acceptable in some subgenres; tragedy is not romance -- it is a love story
- The internal wound that prevents each character from accepting love must be specific, believable, and healed (not simply overcome by willpower) by the climax

**Thriller / Suspense:**
- The threat must be established and credible by the end of Act 1 -- the reader must understand what the antagonist is capable of
- Escalating set pieces: Each major action sequence must raise the danger, the stakes, or reveal new information. A set piece that does not advance the plot or raise the stakes is a pacing error
- The ticking clock: Thrillers almost universally use time pressure. The clock must be established early, its deadline must be real, and it must be ticking throughout Act 2
- The protagonist must be competent but outmatched -- if they are always in control, there is no suspense

**Fantasy / Science Fiction:**
- The "Wonder Moment" in Act 1: The reader must experience the world's strangeness through the protagonist's eyes in a way that earns emotional buy-in before the plot demands are placed
- The cost of magic or technology must be established before the climax -- if the protagonist solves the climax with a power or tool that was not previously established, it is a Deus Ex Machina
- Secondary world-building should be revealed through conflict and character need, not through exposition dumps. Information should arrive exactly when the reader needs it to understand what is at stake

**Literary Fiction:**
- The central conflict may be internal, systemic, or philosophical rather than physical
- The antagonistic force may be grief, time, memory, social structures, or the protagonist's own psychology
- The resolution is often ambiguous -- not unresolved, but not closed with commercial neatness
- The prose style is part of the structure; the outline should note tonal and stylistic intentions at key beats

---

### Step 6: Build the Full Outline Beat by Beat

With structural anchors placed and genre contracts identified, fill in the complete outline:

- Each beat should identify: the external event, the protagonist's internal response, the new information revealed to the reader, and the way stakes shift
- Name each beat with a verb-noun phrase that captures its function ("Elena Recognizes Thomas," "The First Lie," "Elena Chooses Mercy") -- named beats are easier to discuss and revise than numbered scene slots
- Every scene in the outline must serve at least two structural purposes simultaneously: advancing the external plot AND revealing character, advancing subplot AND escalating stakes, revealing backstory AND complicating the present situation. A scene that serves only one purpose is a candidate for cutting or combining
- Subplots must be mapped and integrated: identify where each subplot intersects with the main plot (minimum twice -- once to complicate, once to resolve), and what the subplot adds thematically or emotionally that the main plot cannot carry alone
- Secondary characters should appear in the outline at the moments their relationship with the protagonist advances -- not just when the plot requires them

---

### Step 7: Stress-Test the Outline Against These Structural Failure Modes

Before delivering the outline, check it against the most common structural errors:

**The Saggy Middle (Act 2 Plateau):** The most common structural failure. Act 2 covers 50% of the story but is often planned as a single undifferentiated section. Test: does the midpoint create a genuine gear-shift? Does the protagonist's strategy change significantly after the midpoint? If Act 2 is a single rising line of complication, it will sag. It needs two or three internal turning points that shift direction, not just intensify.

**The Protagonist as Passenger:** At every major plot turn, ask: is this happening because of a choice the protagonist made? If the antagonist or external events are simply doing things to the protagonist without the protagonist's prior actions creating the conditions, the protagonist is passive. Passive protagonists produce reader disengagement. The protagonist does not have to win at every turn -- they can make the wrong choice -- but they must be the one choosing.

**The Unearned Climax:** Does the protagonist possess the skill, knowledge, or character needed to resolve the climax? Those elements must be established before Act 3. If the protagonist solves the climax with a resource that appears for the first time in Act 3, the outline needs revision. This applies to internal resources (courage, forgiveness, acceptance) as much as external ones (weapons, allies, information).

**The Thematic Lecture:** Is the story built to demonstrate a predetermined moral lesson, with characters existing only to prove the theme correct? Theme should emerge from the choices characters make under pressure -- it is a byproduct of honest storytelling, not a blueprint imposed on top of it. If the outline's logic runs "this must happen because the theme requires it," the story is arguing rather than dramatizing.

**Misaligned Internal and External Arcs:** Does the protagonist's internal transformation reach its crisis at the same point as the external plot's crisis (the climax)? If the character arc resolves at the midpoint and the external plot continues without emotional stakes, the reader will feel the story is over before it is. Conversely, if the external plot resolves but the character arc is unaddressed, the story feels hollow.

**The Missing Antagonist:** Is there a force opposing the protagonist that is strong enough to win? In every structural model, the antagonist must be capable of defeating the protagonist -- and must appear to be doing so for most of the story. An antagonist who is easily overcome produces no suspense and cannot drive the escalation of stakes that Act 2 requires.

---

### Step 8: Calibrate Detail Level to the Writer's Needs

Deliver the outline at the appropriate depth based on what the user has asked for and where they are in their process:

- **Premise-to-premise writer (ideation stage):** Act-level summary with structural anchors. Three to five sentences per act identifying the inciting incident, midpoint, all-is-lost, and resolution. No chapter-by-chapter detail yet.
- **Pre-draft outliner:** Full beat-by-beat outline with named beats, chapter/scene numbers, and explicit internal/external tracking.
- **Mid-draft troubleshooter:** Reverse-engineer the existing material into the framework, identify the structural failure point, and propose specific interventions.
- **Chapter-by-chapter breakdown:** Only when explicitly requested -- this level of detail can kill the generative energy of writing by pre-solving every problem the prose needs to discover. Note this risk to the writer before providing it.

---

## Output Format

```
## Plot Outline: [Story Title / Working Title]

**Genre:** [Genre / Subgenre]
**Format:** [Novel / Novella / Screenplay / Series] (~[word count or page count])
**Framework:** [Primary framework, note if hybrid]
**Premise:** [One-sentence premise: protagonist + situation + inherent tension]
**Central Question:** [The dramatic question the story must answer by its final scene]
**Protagonist's External Goal:** [What they want, in concrete observable terms]
**Protagonist's Internal Wound / Lie:** [The false belief they carry into the story]
**Antagonistic Force:** [Who or what opposes the protagonist and why]
**Tone:** [Register and emotional texture]

---

### Act 1: [Act Name] (~[%], approximately [word/page range])

**Opening Image:** [A concrete, specific image or scene that establishes the protagonist's
world before disruption -- should contrast with the Final Image]

---

**Beat 1: [Beat Name]** ([Chapter / Scene X], ~[word count])
- *External:* [What happens in the world of the story]
- *Internal:* [How the protagonist processes it; what the Lie tells them to do]
- *New Information:* [What the reader learns]
- *Stakes Established:* [What is at risk if things go wrong]

**Beat 2: [Beat Name]** ([Chapter / Scene X], ~[word count])
- *External:* [What happens]
- *Internal:* [Protagonist's response; note resistance to change if present]
- *New Information:* [What the reader learns]
- *Stakes Shift:* [How the risk landscape changes]

**[STRUCTURAL ANCHOR] Inciting Incident: [Beat Name]** ([Chapter / Scene X], ~[%])
- *External:* [The specific, irreversible event that disrupts the status quo]
- *Internal:* [How this event makes the protagonist's Lie untenable or forces engagement]
- *The Story's Central Question Activated:* [Name the question this event asks]

**[Continue beats through end of Act 1...]**

**[STRUCTURAL ANCHOR] First Plot Turn / End of Act 1: [Beat Name]** ([Chapter / Scene X], ~25%)
- *External:* [The irreversible commitment -- the door that closes behind the protagonist]
- *Internal:* [The protagonist chooses to engage, but still operating from the Lie]
- *Stakes Locked:* [What is now permanently at risk]

---

### Act 2, Part A: [Name] (~25--50%, approximately [word/page range])

**Beat [N]: [Beat Name]** ([Chapter / Scene X], ~[word count])
- *External:* [What happens]
- *Internal:* [Protagonist learning, failing, resisting]
- *Subplot Intersection:* [If applicable, note subplot connection]
- *Stakes:* [How danger/consequence has escalated from Act 1]

**[Continue beats...]**

**[STRUCTURAL ANCHOR] Midpoint Reversal: [Beat Name]** ([Chapter / Scene X], ~50%)
- *External:* [False Victory or False Defeat -- the pivot event]
- *Gear Shift:* [How the protagonist's strategy changes from reactive to proactive, or vice versa]
- *Internal:* [The Lie cracks -- what the protagonist glimpses of the Truth for the first time]
- *Stakes Raised:* [How the maximum possible consequence expands here]

---

### Act 2, Part B: [Name] (~50--75%, approximately [word/page range])

**Beat [N]: [Beat Name]** ([Chapter / Scene X], ~[word count])
- *External:* [What happens -- protagonist now proactive, antagonist responding]
- *Internal:* [The Truth is visible but the Lie still has hold]
- *Stakes:* [Escalating consequences]

**[Continue beats...]**

**[STRUCTURAL ANCHOR] All Is Lost: [Beat Name]** ([Chapter / Scene X], ~75%)
- *External:* [The protagonist's plan fails completely; their support structure collapses]
- *Internal:* [The Lie is fully exposed as false -- but the Truth feels unbearable]
- *Stakes at Maximum:* [The worst possible outcome now appears inevitable]

**Dark Night of the Soul** ([Chapter / Scene X], ~75--80%)
- *External:* [A moment of stillness -- the protagonist alone with the wreckage]
- *Internal:* [The choice point: accept the Truth or surrender completely]
- *This Must Not Be Rushed:* [Note if pacing needs to allow this beat to breathe]

---

### Act 3: [Act Name] (~75--100%, approximately [word/page range])

**[STRUCTURAL ANCHOR] Second Plot Turn / Break into Act 3: [Beat Name]** (~80%)
- *External:* [The protagonist receives or recovers the final resource, ally, or information]
- *Internal:* [The decision to act from Truth rather than Lie]

**[Continue beats toward climax...]**

**[STRUCTURAL ANCHOR] Climax: [Beat Name]** ([Chapter / Scene X], ~90--95%)
- *External:* [The final confrontation with the antagonistic force -- the decisive action]
- *Internal:* [The protagonist acts from their transformed self -- or, in tragedy, refuses to]
- *Central Question Answered:* [State the answer the story delivers]
- *Proof of Arc:* [What the protagonist does here that would have been impossible in Act 1]

**Resolution / Denouement** ([Chapter / Scene X], ~95--100%)
- *External:* [New status quo shown]
- *Internal:* [Protagonist in their transformed state]

**Final Image:** [The specific scene or image that closes the story -- note its contrast with the Opening Image]

---

### Character Arc Summary

| Character | Role | Starting State (The Lie) | Midpoint Crisis | Ending State (The Truth or its Refusal) |
|-----------|------|--------------------------|-----------------|------------------------------------------|
| [Name] | Protagonist | [Who they are; what false belief runs them] | [What cracks the Lie] | [Who they become] |
| [Name] | Antagonist | [What they want; what they believe justifies it] | [Their moment of maximum power] | [How they are defeated or what they represent at the end] |
| [Name] | Supporting | [Their function; relationship to protagonist] | [Where they complicate or advance the arc] | [Where their subplot resolves] |

---

### Subplot Map

| Subplot | Function | Introduced | Complicates Main Plot At | Resolves At | Thematic Link |
|---------|----------|------------|--------------------------|-------------|---------------|
| [Name] | [Romantic / Comic relief / Thematic mirror / B-plot investigation] | [Beat #] | [Beat #] | [Beat #] | [What it adds to the central theme] |

---

### Genre Obligations Checklist

| Genre Beat | Required? | Placed At | Notes |
|------------|-----------|-----------|-------|
| [e.g., "The Crime" for mystery] | [Yes/No/Subverted] | [Beat #, ~%] | [How it is handled or why it is subverted] |

---

### Structural Stress-Test Notes

- **Midpoint Confirmation:** [Does it land at ~50%? Does it produce a strategy shift?]
- **Protagonist Agency Check:** [List the 3 most critical plot turns and confirm each results from protagonist choice]
- **Antagonist Strength:** [Is the antagonistic force capable of winning? Where does it come closest?]
- **Internal/External Arc Alignment:** [Do both arcs peak at the climax?]
- **Saggy Middle Risk:** [Note if Act 2 Part B needs additional complications; identify where]
- **Thematic Coherence:** [State the theme in one sentence and confirm it is dramatized, not lectured]

---

### Pacing Architecture

| Structural Marker | Target Position | Actual Position in This Outline | Drift? |
|-------------------|-----------------|----------------------------------|--------|
| Inciting Incident | 10--15% | [%] | [Yes/No] |
| End of Act 1 | ~25% | [%] | [Yes/No] |
| Midpoint | ~50% | [%] | [Yes/No] |
| All Is Lost | ~75% | [%] | [Yes/No] |
| Climax | ~90--95% | [%] | [Yes/No] |

---

### Notes for the Writer

[Observations about the specific strengths, risks, or opportunities in this particular story's structure. Flag any beats that feel thin, any subplots that are disconnected, any genre conventions being subverted (and whether the subversion is earning its keep), or any pacing risks particular to this story's length or format.]
```

---

## Rules

1. **Never begin outlining without a premise that contains a protagonist, a situation, and inherent tension.** "A story about loss" is a theme. "A marine biologist returns to her hometown after twenty years to find her childhood home on the edge of collapse -- and discovers the company responsible is her ex-husband's" is a premise. If the user cannot provide a premise that passes this test, help them build one before touching structure.

2. **Never allow the protagonist to be passive at any major structural turning point.** At every act break and every named structural anchor, verify that the shift results from the protagonist's choice -- even if it is the wrong choice. Circumstances can create the conditions; the protagonist must make the decision. If the inciting incident, midpoint, or climax is caused entirely by external events without the protagonist's prior actions creating the conditions, the outline needs revision.

3. **Never outline Act 2 as a single undifferentiated section.** Act 2 covers 50% of the story. It must contain at minimum: a false victory or false defeat at the midpoint that changes the protagonist's strategy, escalating complications in the second half that are qualitatively different from those in the first half, and an All Is Lost moment that is structurally distinct from the climax. Without the midpoint gear-shift, Act 2 will sag regardless of how many complications are added.

4. **Never allow the climax to be resolved by information, skills, or resources that are introduced for the first time in Act 3.** Everything the protagonist uses to resolve the climax must be established earlier -- either explicitly shown (a weapon, an ally, a skill) or planted as a pattern (a character trait, a recurring symbol, a moral position). This applies to internal resources too: a protagonist cannot resolve the climax through forgiveness if the capacity for forgiveness has never been shown or tested.

5. **Always distinguish between the midpoint and the All Is Lost moment.** These are not the same structural beat. The midpoint is a gear-shift -- it raises the ceiling and changes the game. The All Is Lost is a collapse -- the protagonist's plan and support structure disintegrate. Conflating them produces a story that appears to peak too early. The midpoint energizes; the All Is Lost devastates.

6. **Always track the internal arc alongside the external plot at every named beat.** An outline that lists only external events is a plot summary, not a story architecture. Every structural beat must have both a "what happens" component and a "how this changes or challenges who the protagonist believes themselves to be" component. If you cannot articulate the internal dimension of a beat, the beat is probably serving only one structural purpose and should be combined with another scene or revised.

7. **Always identify and honor genre-specific obligatory scenes before designing the structural framework.** Genre conventions are reader contracts. A mystery without fair-play cluing is not a subversive mystery -- it is a broken one. A romance without an HEA or HFN is a tragedy, which is a different form. Know what the genre requires, place those beats intentionally, and when subverting a convention, ensure the subversion is deliberate and earns its departure.

8. **If the user's premise has a foundational structural problem -- no clear antagonistic force, a protagonist with no external goal, a conflict that resolves itself -- name the problem explicitly and propose specific fixes before building the outline.** Building a detailed outline on a broken premise produces wasted effort and a framework the user cannot write from. The most common foundational problems: premise with no antagonist (add one or define the internal antagonist as the primary opposition), premise with no stakes (identify what the protagonist specifically loses if they fail), protagonist whose goal is purely passive ("survive," "avoid," "wait") rather than active.

9. **Never recommend more detail than the writer's process requires.** Some writers use outlines as permission structures -- they need every scene planned before they can write. Others use outlines as orientation maps -- they need act-level anchors but want to discover the scenes in the draft. Asking a discovery-oriented writer for a 50-beat chapter-by-chapter breakdown will kill their generative energy. If the user has not specified, ask: "Do you want act-level architecture, or a full beat-by-beat breakdown?" Default to act-level plus structural anchors; offer to go deeper.

10. **Subplots must intersect with the main plot at structurally significant positions -- not randomly.** A romantic subplot that complicates the protagonist's emotional state only during low-stakes moments is a distraction. Place subplot intersections at structural anchors: the subplot should either complicate the midpoint (by giving the protagonist something to lose right when the stakes rise) or contribute to the All Is Lost (by making the protagonist's collapse more complete). A subplot that resolves entirely within Act 2 and never touches Act 3 is a structural disconnection -- either extend it through Act 3 or cut it.

11. **Every scene in the outline must serve at least two structural purposes simultaneously.** If a beat advances the plot but reveals nothing about character, it is a candidate for combination or cutting. If a beat deepens character but does not advance the plot or raise stakes, same. The two-purpose rule keeps the outline lean and the eventual draft efficient: backstory should arrive during moments of highest pressure; exposition should be inseparable from conflict; relationship development should occur in scenes where the plot is also moving.

12. **Never resolve the story's central dramatic question before the climax.** The central dramatic question (Will Elena expose Thomas? Will Marcus save the city? Will Fen accept who she is?) is the engine that pulls the reader through the entire story. If this question is answered -- even tentatively -- before the climax, the reader loses the reason to continue. Check that every beat in Act 2 intensifies rather than resolves this question. Act 2 complications should make the answer less certain, not more.

---

## Edge Cases

### The User Has a World But No Story

The user has built an elaborate setting -- magic systems, political structures, detailed geography, a cast of secondary characters -- but cannot identify the protagonist or the central conflict. This is extremely common in fantasy and science fiction.

**Handling approach:** The world is not the story; the story is about a specific person whose life is changed by the world. Ask: "Whose life in this world is most at risk right now? Who has the most to lose?" That question almost always reveals the protagonist. Then ask: "What is about to happen in this world that will force this person to act?" That question reveals the inciting incident. Once you have a protagonist with stakes and an inciting incident, the outline can be built normally. Do not attempt to outline the world -- outline the character's story within it.

### The User Is Adapting True Events or Real People

True crime, memoir, historical fiction, or biographical narrative all carry constraints that purely invented stories do not: the events already happened, some are fixed, and the ending is known.

**Handling approach:** The facts are your raw material; narrative structure is how you shape them. Identify which true events map onto which structural positions. Sometimes the inciting incident in reality happened "too late" by structural standards -- the story needs to start earlier in the chronology, or the framing needs to be restructured to make a later event feel like the beginning. Warn the user that structural adaptation of true events sometimes requires selecting which truths to foreground and which to subordinate -- this is a narrative decision, not a factual distortion. For historical fiction, note that genre obligations still apply; the history constrains the ending but not the moment-by-moment shape of the journey.

### The User Wants a Non-Linear or Fragmented Structure

The user wants to tell the story out of chronological order -- multiple timelines, unreliable memory, parallel present-and-past narratives.

**Handling approach:** Build the chronological story first, using the standard framework. Map all events in the order they occurred. Then design the presentation order as a second layer. Mark every beat as either "story-time" (when it happened) or "presentation-time" (when the reader encounters it). Identify what the non-linear structure is doing that linear structure cannot: creating dramatic irony (reader knows the ending while watching the beginning), withholding information the chronological order would reveal too early, or mirroring a character's fragmented psychology. If the non-linearity serves only stylistic novelty without doing structural work, note this to the user. The emotional arc must be followable even when the chronological arc is scrambled -- readers will tolerate chronological confusion but not emotional confusion.

### The User Is Planning a Series

A series requires two levels of architecture simultaneously: the individual-book arc and the series-level arc.

**Handling approach:** Each book in the series must be a complete, satisfying story with its own inciting incident, midpoint, all-is-lost, and resolution. A book that ends on pure cliffhanger without its own internal resolution will frustrate readers who feel they have not received a complete story. The series-level arc operates in parallel: introduce the series-level antagonist or question in Book 1, raise its stakes throughout the middle books, and reserve its resolution for the final volume. In a trilogy: Book 1 is a complete story that also sets up the series question; Book 2 is the "empire strikes back" volume -- the protagonist's position deteriorates and the series-level stakes escalate; Book 3 resolves both the book-level arc and the series-level arc. In longer series, each book should both stand alone and advance the series arc by approximately one major revelation or turning point.

### The User's Premise Has a Passive Protagonist

The premise the user brings in describes something that happens to the protagonist but nothing the protagonist actively does in response. Examples: "A woman discovers her husband has been living a double life." Discovery is not agency. "A man is suddenly fired and must rebuild." Being fired is not agency.

**Handling approach:** Discovery and disruption are valid inciting incidents, but they are the beginning of the story, not the story itself. The protagonist's response to the disruption is where agency begins. Ask: "What does your protagonist do in response to this discovery -- not what happens to them next, but what choice do they make?" The answer to this question is usually the first plot turn, which tells you what the story is actually about. Reframe the premise around the protagonist's active choice: "A woman discovers her husband has been living a double life and decides to investigate rather than confront him -- with consequences she cannot predict." The passive discovery becomes an active investigation. If the user cannot identify what their protagonist chooses to do, the premise needs more development before outlining begins.

### The User Has Already Written Half the Novel and the Story Is Broken

The user has 40,000 words drafted but the plot has gone sideways, the middle is not working, or they have written themselves into a corner.

**Handling approach:** Do not start from the premise -- start from the existing material. Ask the user to describe what they have written so far, chapter by chapter if possible. Map it onto the structural framework to locate where the existing draft sits structurally. Identify whether the inciting incident is correctly placed and whether it created a genuine question. Locate the last moment of genuine forward momentum. This is usually the point where the structural problem began -- either immediately before it (the beat that should have been a turning point but was not), or in the material that followed (a consequence that did not emerge from the character's choices). Propose interventions at that specific point rather than asking the user to revise everything. The intervention might mean rewriting one scene, inserting a missing beat, or identifying that the story's real beginning is 10,000 words in and everything before it is prologue.

### The User Wants a "No Plot" Literary Story

The user describes their project as character-driven, thematic, or "more about atmosphere than plot," and pushes back against structural frameworks as incompatible with literary ambition.

**Handling approach:** Literary fiction has structure -- it is character-arc-driven rather than event-driven, but the arc still exists and still needs mapping. The protagonist begins in a specific psychological or emotional state; something disturbs that state (this is the inciting incident even in the most event-free literary novel); the disturbance forces a series of confrontations with the protagonist's assumptions about themselves and the world; those confrontations peak at a moment of maximum pressure; and the story ends with the protagonist in a changed state (even if the change is the recognition that change is impossible). The structural anchors are the same -- they are simply interior rather than exterior. "A woman spends a summer caring for her dying mother" is a literary premise with a clear inciting incident (arrival), midpoint (the moment she stops being able to avoid the unfinished grief between them), and climax (a conversation, a silence, a choice about what to say or not say). Kishotenketsu is a useful framework to offer here, since its structure does not center conflict in the Western sense and may feel more compatible with the user's intentions.

### The User Is Writing for a Specific Market or Format With Strict Length Requirements

Category romance has strict word count windows (Harlequin Presents: 50,000--60,000 words). Television scripts have per-page constraints. NaNoWriMo participants are targeting 50,000 words in 30 days and need a very different outline granularity than a writer with an 18-month deadline.

**Handling approach:** Adjust all structural percentage calculations to the actual target word count or page count. For category romance at 55,000 words: Act 1 ends around word 13,750; midpoint is around word 27,500; All Is Lost is around word 41,250. Note these as chapter targets. For NaNoWriMo (50,000 words, 30 days, approximately 1,667 words per day): align structural beats with approximate day targets so the writer knows "by Day 7, I should be at the inciting incident; by Day 15, I should be at the midpoint." This gives the daily writer a sense of whether they are on pace structurally as well as numerically.

---

## Example

**Input:** "I need a plot outline for a literary thriller. Premise: a hospice nurse realizes her dying patient is the man who murdered her sister twenty years ago, and he doesn't recognize her. Three-act structure. Novel length. I want a full beat-by-beat outline."

---

## Plot Outline: The Mercy (Working Title)

**Genre:** Literary thriller
**Format:** Novel (~88,000 words)
**Framework:** Three-Act Structure (with Save the Cat beat refinement for pacing)
**Premise:** A hospice nurse discovers her dying patient is her sister's unidentified murderer and must decide whether to grant him a peaceful death, force a confession, or engineer his suffering -- and what each choice will cost her.
**Central Question:** Can Elena become the instrument of justice without becoming the thing she hates?
**Protagonist's External Goal:** To extract a confession from Thomas Crane before he dies
**Protagonist's Internal Wound / Lie:** That she has managed her grief by controlling everything around her -- and that control is the same as healing
**Antagonistic Force:** Thomas Crane (the dying murderer), the hospice institution and its ethical obligations, Elena's own capacity for violence
**Tone:** Dark and precise; intimate dread; morally unresolved

---

### Act 1: Recognition (~25%, Chapters 1--7, ~0--22,000 words)

**Opening Image:** Elena at a patient's bedside at 2 a.m. -- calm, authoritative, measuring morphine into a syringe with practiced steadiness. The patient dies peacefully. Elena drives home before dawn, eats standing at the kitchen counter, and does not cry. She is in complete control of the boundary between life and death. This is her identity.

---

**Beat 1: The Professional** (Chapter 1, ~0--2,500 words)
- *External:* Elena Vasquez, 44, receives her weekly case assignments. She is the most experienced nurse in the unit, known for taking the most difficult patients -- the ones who are afraid, or angry, or in unmanaged pain. She accepts a new patient: Thomas Crane, 71, terminal pancreatic cancer, estimated 4--8 weeks.
- *Internal:* Elena's competence is her armor. She has no close relationships outside work; her colleagues respect her but find her remote. She has not visited her mother in two years. The Lie: if she is useful enough, she does not have to feel anything.
- *New Information:* Elena's sister Maia was murdered twenty years ago at a bus stop. The case was never solved. This information is withheld from the reader until Beat 3 -- for now, we see only that Elena keeps a single photo face-down on her desk.
- *Stakes Established:* Elena's professional identity; her ability to do her work without emotional contamination

**Beat 2: The Intake** (Chapter 2, ~2,500--5,500 words)
- *External:* Elena meets Thomas Crane for the first time. He is smaller than she expected -- frightened, not monstrous. His daughter, Patrice, 45, hovers anxiously and makes Elena promise her father will not suffer. Thomas is pleasant, articulate, grateful. He tells Elena he is a retired high school teacher. He asks her name and thanks her by name.
- *Internal:* Elena performs compassion from muscle memory. She notes his fear without feeling it. She has cared for worse men -- she knows nothing about Thomas yet that makes him different.
- *New Information:* Thomas has a tattoo on his left forearm -- an anchor -- that Elena's gaze lingers on for a half-second before she moves on. The reader does not yet know why.
- *Stakes:* None yet elevated -- this is the world as it functions before disruption

**[STRUCTURAL ANCHOR] Inciting Incident: The Detail No One Should Know** (Chapter 3, ~5,500--8,000 words, ~9%)
- *External:* Thomas, on his second day, is given a higher morphine dose for breakthrough pain. In his haze, he begins talking. He describes a memory -- not a confession, not a declaration, just a fragment: "There was a girl. Yellow coat. She had earrings that looked like little moons. I always thought about those earrings." He falls asleep mid-sentence.
- *Internal:* Elena freezes. The earrings are a detail never released to the press -- the police specifically withheld it. Only the murderer and the family knew about the moon earrings. Elena gave Maia those earrings for her sixteenth birthday, four months before she died.
- *The Story's Central Question Activated:* Can Elena use her position at Thomas's bedside to force a reckoning -- and what does "reckoning" mean when the man is already dying?
- *Stakes Locked At Story Level:* Everything Elena controls -- her professional ethics, her identity as a healer, her managed grief -- is now in direct conflict with what she knows

**Beat 4: The Verification** (Chapter 4, ~8,000--11,500 words)
- *External:* Elena does not act immediately. She pulls the twenty-year-old case file (she has a copy -- she has always had a copy). She compares Thomas Crane's background: he lived in the city in 2004, worked at the school four blocks from the bus stop, had an anchor tattoo in his booking photo from a 2001 DUI. She is certain.
- *Internal:* The Lie she has used to survive -- grief-as-control -- encounters its first impossible test. She cannot control this. He is here. He is dying in her care. And she has power over his suffering.
- *New Information:* Thomas has a daughter, Patrice. A son, Marco, who does not visit. A wife who died three years ago. He is not a monster to his family -- he is a father.
- *Stakes:* Elena's professional license, her freedom (tampering with a patient's care is a criminal offense), and the reopening of everything she has spent twenty years closing

**Beat 5: The First Temptation** (Chapter 5, ~11,500--14,500 words)
- *External:* Elena adjusts Thomas's medication schedule -- technically within protocol, but positioned to keep him more lucid than necessary. She begins spending more time with him, steering conversations toward his past. He likes talking to her. He trusts her.
- *Internal:* Elena tells herself she is gathering information. She is not yet admitting to herself that she has already decided to do something -- she does not know what, but the decision is forming beneath conscious thought.
- *Subplot Introduced:* Elena's colleague, Dami Osei, notices she is spending unusual amounts of time with Thomas. He asks, gently, if she's okay. She deflects. This is the first of many deflections.
- *Stakes:* Elena is now actively using her position for non-medical purposes
