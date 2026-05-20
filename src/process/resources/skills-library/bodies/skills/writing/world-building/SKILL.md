---
name: world-building
description: |
  Creates detailed fictional worlds with consistent internal logic, history, culture, geography, and power structures for use in fiction, games, or creative projects.
  Use when the user asks to build a fictional world, create a setting, design a fantasy/sci-fi universe, or develop the backdrop for a story.
  Do NOT use for character creation (use character-development), plot structure (use plot-outline), or writing scenes set in the world (use scene-writing).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "creative-writing writing template"
  category: "writing"
  subcategory: "creative-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# World Building

## When to Use

**Use this skill when:**
- The user asks to build a fictional world, setting, or universe from scratch or from a seed idea
- The user wants to design a magic system, technology framework, political structure, religion, or cultural system for a speculative fiction context
- The user needs a "setting bible" or "world document" for a novel, game, short story collection, screenplay, or tabletop RPG campaign
- The user is developing an alternate history and needs to reason through what changed, when, and what the cascading consequences are
- The user has a premise or central concept ("what if gravity worked differently?" or "what if the Roman Empire never fell?") and needs to extrapolate a coherent world from it
- The user has an existing world with gaps, inconsistencies, or underdeveloped regions and wants to deepen or repair it
- The user wants to design a world for a video game, interactive fiction, or immersive experience where the audience will explore it actively

**Do NOT use this skill when:**
- The user wants to develop specific characters who inhabit the world -- use `character-development`
- The user wants to outline a plot or story structure that happens within the world -- use `plot-outline`
- The user wants to write actual prose scenes set in the world -- use `scene-writing`
- The user is asking about real-world geography, history, or politics for nonfiction purposes -- this is not a fiction skill
- The user wants to analyze or critique an existing fictional world (a different analytical task, not a creation task)
- The user needs a setting for a single scene only and does not need systemic depth -- use `scene-writing` with a brief setting description

---

## Process

### Step 1: Establish World Parameters Before Writing Anything

Never start building before understanding the project's constraints. Gather the following before generating content:

- **Genre archetype:** High fantasy, secondary-world fantasy, low fantasy, hard science fiction, soft science fiction, space opera, cyberpunk, biopunk, solarpunk, steampunk, dieselpunk, urban fantasy, dark fantasy, epic fantasy, sword-and-sorcery, post-apocalyptic, dystopian, alternate history, mythpunk, or hybrid combinations. Genre sets audience expectation and internal logic standards.
- **Scale:** Classify the world into one of five scales -- a single building or institution (micro), a single city or region (local), a single continent or planet (standard), a solar system or small cluster (macro), or a full universe or multiverse (cosmic). Scale determines how much detail is productive versus how much is noise. For a local-scale world, know every district; for a cosmic-scale world, know the broad rules and a few anchor locations.
- **Central premise (the "What If"):** The one counterfactual or invented rule that makes this world not our world. If the user cannot articulate it in one sentence, help them find it before proceeding. Everything else flows from this premise.
- **Narrative purpose:** Who will consume this world and how? A reader experiences the world sequentially through a protagonist's lens. A tabletop RPG player actively interrogates and breaks the world. A video game player needs mechanical affordances. Each purpose changes what you build first.
- **Tone register:** Where on the axis between grimdark and hopepunk does the world sit? Between satirical and sincere? Between mythic and mundane? Tone must be consistent with the physical and social rules -- a whimsical tone paired with a brutal survival economy creates dissonance unless that dissonance is intentional.
- **What the user has already decided:** Never invent something the user has already established. Ask explicitly: "Is there anything about this world you already know?" before generating.

---

### Step 2: Identify and Stress-Test the Central Premise

The central premise is the world's load-bearing wall. Everything else depends on it being sound.

- **Articulate the premise with maximum precision:** "Magic exists" is not a premise. "Human beings can manipulate electromagnetic fields through a protein expressed in 3% of the population, with each manipulation drawing energy from the practitioner's caloric reserves at a 10:1 ratio" is a premise. Push the user toward specificity.
- **Apply the "And Therefore / But / So What" test:** For every element of the premise, ask: what does this enable? What does it prevent? What problem does it create that it cannot solve? "Teleportation exists BUT it requires a physical anchor point at both ends, AND therefore the first explorers had to walk" is richer than "teleportation exists."
- **Trace second-order and third-order effects systematically:** Use the PEST framework (Political, Economic, Social, Technological) and ask what the premise changes in each domain. If healing magic exists, hospitals look different, life expectancy changes, the meaning of aging changes, the power of healers shifts social hierarchies, and warfare changes because injuries are recoverable. Work through all four quadrants for every major element.
- **Establish hard limits before soft rules:** Define what is impossible in this world before defining what is difficult. Impossibilities create genre rules and prevent readers from asking "why didn't they just...?" The harder and more consistent the limits, the more legitimate the tension.
- **Test the premise against "Why hasn't this solved everything?":** If your central premise is genuinely world-altering, identify three to five global problems it would plausibly have solved, and explain why it hasn't solved them. This generates realistic complications: cost, access barriers, political suppression, unintended consequences, or the problem being too distributed to solve at scale.

---

### Step 3: Build the Physical Foundation

Physical geography is the oldest constraint on human civilization. It determines resources, trade, conflict, and culture more than any other single factor. Build it first.

- **Climate and biome:** Determine latitude bands, ocean currents (warm currents moderate cold coasts; cold currents produce fog and aridity), rain shadow effects from mountain ranges, and seasonal extremes. A desert on the leeward side of a mountain range is geographically inevitable -- not arbitrary. Use real-world analogues: the Atacama, the Sahel, the Pacific Northwest, the Steppe. Analogues give you a fast cultural inference engine.
- **Resource distribution:** Map where fresh water, arable land, timber, metal ore, and fuel (coal, oil, magic crystals, whatever the world's energy source is) exist. Civilizations cluster around these. Scarcity of any of them generates trade networks, wars, and migration. If your world has a magical resource, decide where it concentrates geographically and why -- random distribution is less interesting than geological or climatic logic.
- **Natural barriers and corridors:** Mountain ranges, seas, rivers, and deserts function as political and cultural borders. Rivers are simultaneously barriers (hard to cross in force) and highways (ideal for trade). Decide which function each major waterway serves in your world and why.
- **The Rule of Three Regions:** For every standard-scale world, build at least three ecologically distinct regions that generate different cultures, economies, and conflicts through contact. Monoplanet syndrome -- one climate, one ecosystem -- is the most common worldbuilding error in science fiction.
- **Scale the map to travel time:** Know how long it takes to cross the world using the era's fastest transport. Pre-industrial: a horse covers 40-50 km per day on roads; a sailing ship covers 150-200 km per day with good wind; a pedestrian covers 25-35 km per day. Industrial: trains change everything in the 1800s. This determines how unified the world can plausibly be, how information travels, and how isolated communities stay.

---

### Step 4: Layer History With Purpose

World history should be built backward from the present, not forward from the beginning. Start with "why is the world the way it is right now?" and work back to find the events that produced it.

- **Build only load-bearing history:** Every historical era, event, war, or dynasty that appears in the world document must connect to something that matters in the present-day story. If an ancient empire's fall doesn't produce a present-day consequence (ruins someone lives in, a law that still governs someone, a grievance that fuels a faction), it does not belong in the world bible. It belongs in the appendix at best.
- **The Three-Layer Historical Model:** Construct history in three temporal layers -- (1) Mythic Age: events so old they may be legend, providing spiritual and cosmological foundations; (2) Formative Age: 200-500 years ago, producing current borders, dynasties, religious structures, and economic systems; (3) Living Memory: within the last 60-80 years, producing characters' parents' and grandparents' traumas, wars, revolutions, and golden ages. Each layer has a different narrative function.
- **Identify the Wound:** Every civilization has a defining wound -- a catastrophic loss, betrayal, or failure that shapes how it sees itself and others. The wound is always present, even when unspoken. It produces paranoia, pride, taboo, or ritual. Ask: "What happened to this society that it has never fully recovered from?"
- **Determine what is forgotten and why:** Not all history is remembered. What knowledge has been lost, suppressed, or deliberately destroyed? Who benefits from the official version of history? Who knows the real version? Gaps in collective memory are some of the most productive sources of story tension.
- **Avoid Tolkien's Error (for non-epic works):** Tolkien's depth of history works because the entire project is the mythology. For most worldbuilding purposes, three to five major historical events per region is sufficient. More becomes an appendix the audience will never read. Prioritize events that produce current characters, current conflicts, and current objects or places of significance.

---

### Step 5: Construct Power Structures and Social Systems

Power is the most important dynamic to map with precision. Who controls what, by what mechanism, and who is trying to change it?

- **Classify the political system type and its actual mechanism:** Monarchy, oligarchy, theocracy, democracy, technocracy, feudalism, anarchic zones, corporate sovereignty -- but more importantly, identify the real mechanism of power. In a monarchy, does the king control the army, or does the army control the king? In a democracy, who controls the ballot process, the media, and the courts? The formal system and the real system often differ. This gap is where drama lives.
- **Map three to five factions with incompatible goals:** Every stable world has at least three factions in dynamic tension. Each faction needs: a clear interest (what they want), a grievance (what was done to them or taken from them), a method (how they pursue their goals), and a blind spot (what they cannot see about their own situation). Factions should feel internally rational even when externally antagonistic.
- **Apply the Monopoly Test to power:** Ask who holds a monopoly on each of the following -- violence, law, currency, food, information, spiritual authority, and the world's unique resource (magic, tech, etc.). Where monopolies are contested, you have conflict. Where a single entity holds multiple monopolies, you have oppression and eventual rebellion. Where no one holds any monopoly, you have chaos or frontier conditions.
- **Define the social stratification system explicitly:** Class, caste, race, species, digital/biological status, citizenship status -- how is hierarchy organized? What markers signal status (accent, clothing, body modification, brand marks, gene expression)? What are the mechanisms of mobility upward? Downward? How porous are the boundaries? Real inequality is always self-justifying -- the upper stratum always has an ideology that explains why the hierarchy is just, natural, or necessary. Build that ideology.
- **Design the rule of law:** What is legal and what is illegal? Who enforces it? Who is above it? What are punishments and who administers them? Law reveals values -- what a society criminalizes tells you what it fears. Note that law and morality frequently diverge; this divergence is a story generator.

---

### Step 6: Build the Magic or Technology System With Discipline

The speculative element of a world -- magic, advanced technology, psychic ability, divine power -- must be the most carefully structured component. Undefined systems break worlds.

- **Use the CELT framework for any speculative system:** Classify it by Cost, Extent, Limits, and Teacher. Cost: what does using it take from the user or world (calories, years of life, sanity, environmental damage, a specific resource)? Extent: what can it do, and what range of scale (personal, local, regional, global)? Limits: what can it absolutely not do (resurrect the dead, break physical laws, compel free will, create matter)? Teacher: how is the ability learned, passed on, or restricted (apprenticeship, genetics, divine selection, purchase, training, accident)?
- **Apply Brandon Sanderson's Laws as a diagnostic (not a rulebook):** The First Law: the more you want magic to solve your protagonist's problems, the more defined it must be. The Second Law: limitations are more interesting than powers. The Third Law: expand what you already have before adding something new. These are diagnostic questions, not constraints -- hard magic needs defined rules; soft magic can remain mysterious if it never solves plot problems directly.
- **Define access inequality explicitly:** Who has access to the speculative element, and why? Genetics, wealth, geography, education, divine favor, species, or chance? Access inequality is the most important social fact in a speculative world. If healing magic exists, only its distribution model tells you whether the world is more or less just than ours.
- **Build the economy of the speculative element:** If magic or technology exists, it will be commodified, taxed, rationed, monopolized, or black-marketed. What does a unit of magical output cost in grain, gold, or political favor? Who profits from that economy? What happens to people who try to use it outside authorized channels?
- **Soft vs. Hard magic decision framework:** Hard magic (fully defined rules, costs, limits) works best when: the protagonist's primary problem-solving tool is the magic, the story is plot-driven, and the audience needs to strategize alongside the character. Soft magic (mysterious, undefined, emotionally driven) works best when: magic represents forces beyond human comprehension, the story is character-driven, and the wonder of the unknown is more important than strategic clarity. Most worlds use hard magic for common practitioners and soft magic for divine or cosmic-scale powers -- a tiered system.

---

### Step 7: Construct the Conflict Engine

A world without built-in tension is a museum. Every strong setting has a structural engine that generates new conflicts even without authorial intervention.

- **Identify the primary scarce resource and its politics:** Every world runs on something someone does not have enough of. Water, arable land, magical essence, processing power, fertile genetic lines, sunlight, oxygen. Define what it is, who has it, who wants it, and what prevents free access. Scarcity must be enforced by something -- geography, monopoly, physical limitation, political control, or deliberate destruction.
- **Build the irreconcilable worldview clash:** The deepest conflicts are not about resources but about incompatible visions of what the good world looks like. Two groups can both be reasonable people in a reasonable argument about whether individual freedom or collective security should govern a society, whether the old order or the new is more legitimate, whether the natural or the synthetic is more valuable. Map at least one philosophical conflict that cannot be resolved by compromise without one side losing something fundamental.
- **Establish the destabilizing secret:** Every world has something true that, if widely known, would shatter the current order. The holy book was written by a fraud. The founding hero committed an atrocity. The magic system has a flaw that makes the most powerful users the most dangerous. Someone already knows. Someone is about to find out. This is your inciting incident machine.
- **Design the pressure-release mechanism:** What stops the world from exploding right now? What keeps the conflict at a slow burn rather than a conflagration? Safety valves -- scapegoating mechanisms, ritual releases of tension, economic safety nets, physical separation of hostile groups, mutually assured destruction -- are what make a world feel stable enough to have a history. Removing a safety valve is how you start a story.
- **Track what is currently changing:** The world your story takes place in should be in the middle of a transition. Population is growing past the land's capacity. A new technology is disrupting an established economic order. A religious schism has moved from theological to military. A climate shift is pushing a civilization toward a neighbor's territory. Static worlds feel dead. Pick one major change happening right now and let it pressurize everything else.

---

### Step 8: Stress-Test, Cross-Check, and Deliver

Before delivering the world, run a consistency audit.

- **The Smart Inhabitant Test:** Imagine the smartest, most self-interested person living in this world. Would they have already solved the problem the story depends on? If healing magic exists and wounds are the story's stakes, why hasn't the protagonist obtained a healer? If teleportation exists and escape is the story's solution, why hasn't the villain used it to escape? Every apparent hole needs a patch -- cost, access barrier, specific limitation -- or it should be used deliberately to complicate the story.
- **The Anthropological Checklist:** Verify the world has addressed: birth, coming-of-age rituals, marriage or partnership customs, death and burial practices, at least three distinct food traditions, a music or oral storytelling tradition, at least one religious or spiritual framework, at least two linguistic communities, a criminal underworld or shadow economy, and forms of humor and play. A world that only addresses warfare and governance feels depopulated.
- **The Monoculture Audit:** Look at every group, culture, or civilization in the world. Does each one have internal diversity? A religion should have at least two interpretive traditions (orthodox and reform, or esoteric and exoteric). A kingdom should have at least three regional subcultures. An empire should have at least two conquered populations who remember being conquered differently.
- **Scale the detail to the story's lens:** For a novel with a single-city scope, the city should be built to the district and neighborhood level, with named streets and specific institutions. The rest of the world should exist as broad context. For a tabletop RPG campaign, focus on the campaign region at the neighborhood level and the surrounding nations at the faction level -- players will not go everywhere, but they will ask questions about everything.
- **Deliver with story hooks:** A world without story hooks is a geography textbook. Every section of the world document should suggest at least one story, one character, or one conflict that emerges naturally from the system. These are not assigned to the user -- they are demonstrations that the world is generative.

---

## Output Format

Deliver the world as a structured World Bible. Use this format, scaling depth to the project's scope:

```
## World Bible: [World Name]

### Logline
[One sentence: what is this world, and what is its defining tension?]

### Premise
[Two to four sentences: the central counterfactual or invented rule, stated precisely with its costs and limits]

### Tone and Register
- Tone: [e.g., gritty realism with mythic undertones]
- Closest analogues: [two to three existing works this world resembles in feel, not premise]
- What this world is NOT: [one or two tonal clarifications to prevent drift]

---

### Foundational Rules

| Rule | Definition | Cost / Limit | Second-Order Effects |
|------|-----------|--------------|----------------------|
| [Primary rule] | [Precise definition] | [What it costs, what it cannot do] | [What this changes about politics, economy, culture, warfare] |
| [Secondary rule] | [Precise definition] | [Cost / limit] | [Effects] |
| [Hard limit] | [What is impossible] | [Why -- mechanistic, not authorial] | [What this prevents narratively] |

---

### Geography and Environment

**World Scale:** [Micro / Local / Standard / Macro / Cosmic]

**Key Regions:**

| Region Name | Climate / Biome | Key Resource | Analogous Real Place | Defining Feature |
|-------------|----------------|--------------|---------------------|-----------------|
| [Name] | [e.g., arid steppe] | [e.g., iron ore] | [e.g., Central Asia] | [What makes it distinct] |

**Travel Times:** [How long does it take to cross the world by the era's fastest transport?]

**Geographic Constraints:** [What mountain ranges, seas, or deserts define political and cultural borders?]

---

### History

**Historical Layers:**

| Layer | Era Name | Approximate Period | Defining Events | Present-Day Consequence |
|-------|----------|-------------------|-----------------|------------------------|
| Mythic | [Name] | [e.g., 3,000+ years ago] | [Events] | [What this explains or justifies today] |
| Formative | [Name] | [e.g., 200-500 years ago] | [Events] | [Current borders, institutions, or laws] |
| Living Memory | [Name] | [e.g., last 60-80 years] | [Events] | [Current characters' wounds, opportunities, grudges] |

**The Wound:** [One sentence: the defining catastrophic loss that this civilization has never recovered from]

**What Is Forgotten (and Why):** [What knowledge has been suppressed, lost, or distorted and who benefits from the gap]

---

### Political Structure

**Formal System:** [Type of government]
**Real Power Mechanism:** [Who actually controls violence, law, currency, food, information?]

**Factions:**

| Faction | What They Want | Their Grievance | Their Method | Their Blind Spot |
|---------|---------------|-----------------|--------------|-----------------|
| [Name] | [Goal] | [Historical wrong] | [How they pursue it] | [What they cannot see] |

**Monopoly Map:**

| Domain | Who Holds It | Is It Contested? |
|--------|-------------|-----------------|
| Violence | [Entity] | [Yes/No -- if yes, by whom] |
| Law | [Entity] | [Yes/No] |
| Currency | [Entity] | [Yes/No] |
| Food supply | [Entity] | [Yes/No] |
| Information | [Entity] | [Yes/No] |
| Spiritual authority | [Entity] | [Yes/No] |
| [World's unique resource] | [Entity] | [Yes/No] |

---

### Culture and Society

**Social Stratification:** [How is hierarchy organized? What markers signal status? How permeable is the boundary?]

**Dominant Ideology:** [What does the upper stratum say to justify the hierarchy?]

**Key Cultural Details:**

- **Birth and coming-of-age:** [Practices]
- **Death and burial:** [Practices, beliefs about afterlife]
- **Food traditions:** [At least two regional or class-based food customs]
- **Religion / spirituality:** [Framework, schisms, orthodoxy vs. heterodoxy]
- **Art and oral tradition:** [What stories do people tell themselves?]
- **Humor and play:** [What do people do when they are not surviving?]
- **Taboos:** [What is unspeakable, and what happens to those who speak it?]

---

### Magic / Technology System

**System Type:** [Hard / Soft / Tiered -- see decision framework above]

**CELT Breakdown:**

| Element | Detail |
|---------|--------|
| **Cost** | [What does using this take from the user or the world?] |
| **Extent** | [What can it do? At what scale?] |
| **Limits** | [What can it absolutely NOT do? Why?] |
| **Teacher** | [How is it learned, inherited, or restricted? Who gatekeeps access?] |

**Access Distribution:** [Who has it? What percentage of the population? What barriers exist?]

**Economy of the System:** [What does a unit of output cost? Who profits? What is the black market?]

---

### Economy and Resources

**Primary Scarce Resource:** [What does everyone fight over?]
**Control Mechanism:** [Who has it, why, and what prevents redistribution?]
**Trade Networks:** [What flows between regions and why?]
**Inequality Structure:** [How does wealth concentrate? What does poverty look like? What does extreme wealth look like?]

---

### Conflict Engine

- **Scarce resource:** [What is insufficient for everyone who wants it?]
- **Irreconcilable worldview clash:** [Two philosophically incompatible visions of the good society]
- **Destabilizing secret:** [The true thing that, if known, would shatter the current order -- and who knows it]
- **Pressure-release mechanism:** [What is currently keeping the conflict from exploding?]
- **The current change:** [What transition is happening right now that threatens the existing order?]

---

### Story Hooks

1. **[Hook title]:** [Two to three sentences describing a specific conflict, character, or situation that emerges naturally from this world's systems -- not invented but derived]
2. **[Hook title]:** [Same format]
3. **[Hook title]:** [Same format]
4. **[Hook title]:** [Same format -- aim for hooks from different factions' perspectives]

---

### Consistency Notes

- **Flagged Tensions:** [Any potential inconsistencies in the world as built, with suggested resolutions]
- **Underdeveloped Areas:** [Sections intentionally left thin for the user to develop, with prompts for how to approach them]
- **Recommended Next Steps:** [character-development for key figures | plot-outline for the central narrative | scene-writing for the opening scene]
```

---

## Rules

1. **Never build a speculative system without applying CELT (Cost, Extent, Limits, Teacher).** An undefined magic or technology system will break the world at the first narrative stress. If the user resists defining limits, explain that limits are what create tension -- omnipotence is boring.
2. **Never produce a monoculture civilization.** Every society has regional variation, class variation, generational variation, and dissenting subcultures. A civilization that speaks one language, practices one religion, and holds one political view has not been thought about -- it has been sketched.
3. **Never write history forward from the beginning.** Build history backward from the present. Every historical event must connect to a present-day consequence; events without present-day consequences are encyclopedism, not worldbuilding.
4. **Always trace second-order and third-order effects of the central premise.** The most common worldbuilding failure is a premise that changes one thing and nothing else. If magic can heal wounds, the premise doesn't just change combat -- it changes life expectancy, what surgery means, the social status of healers, the economics of danger, the meaning of aging, and the theology of death.
5. **Geography must drive culture, economics, and politics.** If a mountain range exists, it creates a rain shadow, a trade corridor, a border dispute, and a cultural divide. If you place geography arbitrarily, your world will feel arbitrary. Every physical feature should have at least one cultural or political consequence.
6. **Every faction must have a motivation that is internally rational.** No civilization is evil from its own perspective. Every group -- including antagonists -- has a legitimate interest, a genuine grievance, and a self-justifying ideology. If you cannot explain why a reasonable person would join or support a faction, the faction is not built yet.
7. **Always include a destabilizing secret.** The world needs a true thing that, if widely known, would change everything. This is your story's most reliable inciting incident machine. Plant it in the history section and let it surface in story hooks.
8. **The Smart Inhabitant Test is mandatory.** Before finalizing any world element, ask: would the smartest person in this world have already solved this problem? If yes, explain why they have not. The explanation must be diegetic (built into the world's logic) not authorial (because the story needs it to be unsolved).
9. **Scale detail to narrative purpose.** A novel focused on a single city needs that city built to the block level. The rest of the continent needs broad strokes. A tabletop RPG needs every major location the players can reach. A short story collection needs anthology-consistent rules without exhaustive geography. Over-building what the audience will never see wastes time and produces unusable documents.
10. **Always deliver story hooks derived from the world's systems, not invented independently.** The test of a good world is generativity -- it should produce stories by itself. Every story hook must emerge from a collision of two or more world systems (e.g., the scarcity of the key resource plus the faction that controls it plus the destabilizing secret). If a hook requires importing a conflict from outside the world, the world is not built deeply enough.
11. **Flag consistency problems explicitly rather than ignoring them.** If the user's premise creates a logical hole -- healing magic that somehow leaves the sick poor, a surveillance state that somehow hasn't noticed the resistance movement -- name the hole and offer two to three possible patches. A world with unacknowledged holes is worse than a world with acknowledged, addressed ones.
12. **Soft magic cannot solve hard plot problems.** If the narrative requires the protagonist to overcome a specific obstacle, the speculative system must be defined precisely enough to have a clear answer about whether that system can solve the obstacle. Mysterious magic that intervenes whenever the plot needs it is not soft magic -- it is deus ex machina.

---

## Edge Cases

**The user has a fully realized premise but no detail yet.**
This is the ideal starting condition. Begin with Step 2 (stress-testing the premise) before touching geography or culture. Spend significant effort on second-order effects. A single precise premise, fully extrapolated, produces a richer world than ten half-formed elements stacked together. Example prompt: "Let's trace what your premise changes across six domains -- political, economic, social, military, religious, and technological. I'll start with political: if [premise], then power over [relevant domain] shifts, which means..."

**The user has extensive existing material but wants to fill a specific gap.**
Do not rebuild what already exists. Ask: "What specific element feels thin or inconsistent to you?" Then request a summary of everything adjacent to that gap before building into it. A common failure mode here is inventing something for the gap that contradicts what already exists. Read the existing material as constraints, not suggestions. Build the missing piece with explicit connectors to established elements on both sides.

**The user wants a "realistic" or "low-magic" fantasy world.**
Realism in fantasy means the physical and social rules of the real world apply everywhere the author has not explicitly overridden them. Ground every element in historical analogue. If the world is analogous to 14th-century Western Europe, then crop yields are low, child mortality is high, literacy is rare, travel is slow, and the church is the primary information-control institution. Magic, if present, must integrate into this real-world logic -- it has a guild, a church position on it, a taxation policy, and a black market -- not float above it.

**The user wants a hard science fiction world with no faster-than-light travel.**
Honor the physics absolutely. Communication delays between star systems (years to decades depending on distance) are not obstacles to work around -- they are the world's defining features. News of a war may arrive after the war ends. A colony may be functionally independent for centuries. Generation ships mean the people who arrive are not the people who departed. Relativistic time dilation means a ship crew ages slower than the civilization they serve. These constraints produce more interesting worlds than FTL does because they require the author to think carefully about what interstellar civilization actually means without magical shortcuts.

**The user wants a world for a tabletop RPG campaign.**
Reorient the world document toward player agency. Every region should have: something players can do there (a mission-generating faction, a dungeon, a political problem requiring resolution), something they can acquire (a resource, an ally, an ability), something that can go wrong (an enemy faction, a natural hazard, a moral dilemma). Include explicit mechanical hooks -- what game system, what economy of actions and resources, what decisions are meaningful. A world built only for reading does not work as a playable environment because players do not read linearly; they interrogate the world sideways, ask questions the author never anticipated, and break systems that were never meant to be broken. Design for interrogation, not narration.

**The user wants a world at micro-scale (single city, single institution, single building).**
Apply every layer of the full world-building process but zoom in. A single city has its own geography (hills, rivers, districts, defensible and indefensible areas), history (founding myth, great fire, political coup, golden age), political structure (city council, crime guilds, merchant associations, the church), culture (neighborhood traditions, class markers, local saints, food), economy (what this city produces, what it imports, what it smuggles), and conflict engine (the thing that will tear this city apart if nothing changes). The advantage of micro-scale is density -- every alley can have a story, every institution can be named. The challenge is resisting the urge to gesture at the wider world instead of building the small world with full seriousness.

**The user says "I don't know where to start -- surprise me."**
Do not generate a full world without parameters. Instead, generate three highly specific one-sentence premises spanning different subgenres and tones, then ask the user to choose one or combine elements from two. Example: "(1) A dying empire on a tidally locked planet where the habitable strip between the burning and frozen hemispheres has been fought over for 4,000 years. (2) A solarpunk city-state governed by a mycelial network intelligence that reached consensus 300 years ago and has been slowly losing coherence since. (3) An alternate 1920s where the Great War never ended because one side discovered a way to resurrect its war dead, and both sides now field armies of the controlled undead." Three premises with genuine specificity will always produce a better conversation than open-ended generation.

**The user's world has an internal contradiction that they do not recognize.**
Name it clearly and without condescension: "I want to flag something before we continue -- [X] and [Y] seem to be in tension. If [X] is true, then [Y] would most likely have already [consequence]. Here are three ways to resolve it: [Option 1 -- change X], [Option 2 -- change Y], [Option 3 -- add a bridging mechanism that explains why the contradiction exists in-world]." Always offer resolution options; never just flag the problem and leave it.

---

## Example

**Input:** "I want to build a world for a novel. The premise is that roughly 200 years ago, a cataclysm destroyed the ability to grow food in soil -- agriculture stopped working globally. Humanity survived by pivoting to massive oceanic farming and floating city-states. The world is mid-scale, basically just Earth's oceans plus some coastal strips. Gritty, political, somewhat hopeful. I want the world to have a real class structure around who controls the ocean farms."

---

**Output:**

## World Bible: The Pelagic Age

### Logline
Two hundred years after the Soilblight ended land agriculture forever, humanity survives on the open ocean -- and whoever controls the food controls everything.

### Premise
In 2031 (by old reckoning), an engineered fungal pathogen called the Silt Rot achieved global dispersal within 18 months, rendering terrestrial soil microbiomes incapable of supporting root-based plant growth. Crops failed worldwide. 6.8 billion people died in the Collapse Decade. The survivors -- roughly 1.2 billion -- retreated to coastlines and open water, developing three food technologies that now underpin civilization: deep-sea kelp farming, offshore protein cultivation (shellfish, crustacean, and engineered fish), and hydroponic tower platforms anchored to submerged structures. Two hundred years later, humanity has stabilized at roughly 2.4 billion people across the world's ocean surfaces. The land is not dead -- it is biologically foreign. Nothing edible grows in soil. The forests have vanished. The grasslands are ash and rock. Coastal strips support architecture and industry but no food production. The ocean is the world.

### Tone and Register
- **Tone:** Gritty political realism with moments of genuine beauty -- the ocean is brutal and gorgeous, and people who live on it are both
- **Closest analogues in feel:** The Expanse (political realism in a speculative setting, class tension between different populations), Ursula K. Le Guin's The Dispossessed (competing economic philosophies presented with equal seriousness), Moby-Dick in its relationship between human ambition and oceanic indifference
- **What this world is NOT:** Post-apocalyptic nihilism. The Collapse was 200 years ago. People are not in survival mode -- they are in politics mode. The world is not Mad Max on water. It is more like the Renaissance Italian city-states, but the city-states are floating and the Medicis control the kelp farms.

---

### Foundational Rules

| Rule | Definition | Cost / Limit | Second-Order Effects |
|------|-----------|--------------|----------------------|
| Soilblight | Silt Rot remains active in all terrestrial soil globally. Introducing any viable seed or root system into soil results in immediate fungal colonization and death of the plant within 48-72 hours. The fungus cannot be killed at scale -- attempts have been made. | Hydroponics work because they use no soil -- only water and substrate. Soil-adjacent growing media (peat, coir) carry contamination risk and are regulated. | Land has zero agricultural value. Land value is now industrial, architectural, or strategic (ports, high ground, defensible positions). The entire global economy of pre-Collapse land ownership is irrelevant. No one is a landed aristocracy anymore -- the new aristocracy is oceanic. |
| Oceanic Farming Complexity | Deep-sea kelp farming and offshore aquaculture require significant capital infrastructure (anchored platforms, current management, breeding stock, monitoring systems) and sustained skilled labor. This is not subsistence farming -- it is industrial agriculture at sea. | Small operators can run coastal shellfish beds with minimal investment but produce minimal yield. Large-scale protein and caloric yield requires Ark-class platforms costing the equivalent of a small nation's annual production to build. | The barrier to entry for food production is enormous. Capital naturally concentrates. Three major Aquaculture Consortia now control roughly 68% of global caloric output. The rest is produced by city-state public farms, independent operators, and a gray market. |
| The Drift | Ocean currents, storm patterns, and thermal gradients make optimal farming locations shift seasonally. The richest growing zones (warm current upwellings, high-nutrient zones) move. Platforms can reposition, but slowly. The "Drift Season" (roughly 90 days per year, hemisphere-dependent) is when farming yields drop 20-35% globally. | Drift Season cannot be predicted more than 30 days in advance with current technology. Attempts to stabilize platforms against current shifts at large scale have failed. | Drift Season is politically explosive. Food prices spike. Rationing begins. Cities that have not stockpiled adequately face shortages. Wars have started over priority access to nutrient upwelling zones during Drift. It is the world's most reliable political pressure cooker. |
| Hard Limit: No Land Agriculture | Not a policy -- a physical fact. Silt Rot is not curable at current biological or chemical technology levels. | Unknown if a cure is possible. The Consortia have funded suppression research (not cure research, because a cure would destroy their monopoly). This distinction is not publicly known. | The hope of returning to land -- the political movement called Restoration -- exists and has significant popular support. It is either humanity's best hope or a con being sold by people who want to destabilize the Consortia for their own ends. Both interpretations have evidence. |

---

### Geography and Environment

**World Scale:** Standard (Earth's ocean surface plus coastal strips)

**Key Regions:**

| Region Name | Climate / Biome | Key Resource | Analogous Real Place | Defining Feature |
|-------------|----------------|--------------|---------------------|-----------------|
| The Meridian | Tropical open ocean, warm currents | Highest-yield kelp forests, year-round growing | Pacific equatorial zone | Controlled by Aurum Consortium; 3 Ark-class platforms |
| The Shallows | Subtropical coastal strips, Europe/North Africa remnant | Shellfish beds, hydroponic tower cities | Mediterranean basin | Dense city-state population; fiercely independent; anti-Consortium |
| The Coldwater Run | Sub-Antarctic waters, rich upwelling | Cold-water protein species (highest nutritional density per kg) | Southern Ocean | Contested; no single authority; the world's most dangerous region to operate |
| The Silt Coast | Former Pacific coast of the Americas, coastal strip cities | Industrial manufacturing, shipbuilding | Pacific Rim | Produces the platforms and ships everyone else depends on; significant independent political leverage |
| The Dead Interior | All former continental interiors | Nothing edible; some mineral extraction, salvage | Sahel, American Midwest, Eurasian steppe | Legally claimed by no one; inhabited by Soil Runners -- people who live in the poisoned interior by choice or desperation |

**Travel Times:** A fast cargo vessel crosses the Atlantic equivalent in 8-12 days. A slow cargo barge, 18-22 days. A racing courier vessel (expensive, rare) can make it in 5-6 days. Information travels at ship speed unless you have access to the Consortium-controlled satellite relay network, which transmits at light speed but at premium cost.

**Geographic Constraints:** The former mountain ranges and continental interiors create dead zones -- uninhabitable for food production, sparsely populated. The Drift Season patterns mean that the equatorial zones are contested and valuable; the polar approaches are dangerous and sparse. There is no "center" of the world geographically -- political centers are wherever the largest Ark platforms anchor seasonally.

---

### History

| Layer | Era Name | Approximate Period | Defining Events | Present-Day Consequence |
|-------|----------|-------------------|-----------------|------------------------|
| Mythic | The Before / The Land Time | Before 2031 | The era of soil agriculture, cities, and nation-states. Almost entirely mythologized. | Cultural grief and nostalgia for a world no living person experienced. "Before food" is shorthand for impossible abundance. Old national identities are worn as cultural costume, not political reality. |
| Formative | The Collapse Decade and the First Platforms | 2031-2080 | Silt Rot dispersal, collapse of terrestrial agriculture, mass die-off of 6.8B, first successful offshore kelp farms, establishment of early Platform Cities. | Current legal frameworks, Consortium charters, city-state constitutions, and maritime law all date to First Platform treaties. The Three Charters (2071) are the world's closest thing to a constitution. |
| Living Memory | The Consolidation | 2150-2230 (current year 2231) | The Aurum, Kelp Union, and Deepwater Consortia each absorbed or destroyed smaller competitors over 80 years. Drift War of 2198-2204 established current zone-control agreements. Restoration movement emerged ca. 2210. | Current political alignment. Anyone over 40 remembers the Drift War's food rationing. The Consortia are powerful but recently powerful -- their monopoly is young enough that people remember when it wasn't. |

**The Wound:** The Collapse. 6.8 billion people died over ten years. Every family alive today lost everyone who stayed inland. There is no grief ritual adequate to this loss -- it is too large to process. Instead, it has become a founding myth: humanity survived, humanity endured, humanity is strong. The psychological cost of this narrative is that grief is privatized and dissent is framed as ingratitude toward the survivors who built civilization from the ocean up.

**What Is Forgotten (and Why):** The Consortia's founding charters contain a clause -- Section 7, the "Stewardship Provision" -- that requires them to fund active Soilblight cure research. They have not done so in 80 years. The clause has been buried in legal restructuring. A researcher named Pellucida Vehs found the original 2071 charter in a sunken archive salvage three years ago. She has not yet decided what to do with it.

---

### Political Structure

**Formal System:** A tripartite world -- the Three Consortia (private aquaculture corporations), the Free Cities Compact (coalition of independent city-states), and the Uncharted (everyone outside both systems, including Soil Runners, pirate fleets, and unaffiliated platform communities).

**Real Power Mechanism:** Food. The Consortia produce 68% of global calories. Any city-state that defies them faces the possibility of a supply reduction that looks, legally, like a logistics problem. No Consortium executive has ever explicitly threatened a city-state with starvation. They have never needed to.

**Factions:**

| Faction | What They Want | Their Grievance | Their Method | Their Blind Spot |
|---------|---------------|-----------------|--------------|-----------------|
| Aurum Consortium | Maintain and expand market dominance in Meridian zone | Believe they saved humanity and receive insufficient deference for it | Supply contracts, legal leverage, political marriages between executive families, occasional sabotage of competitors framed as accident | They are beginning to believe their own mythology; internal dissent is suppressed rather than heard |
| Free Cities Compact | Political independence from Consortium control; public ownership of coastal shellfish beds | Consortium pricing makes food insecurity a permanent condition for working-class city residents | Coalition voting, cross-city trade agreements, funding Restoration research as political leverage | The Compact is deeply fractured -- three of its twelve cities would defect to Aurum given the right economic incentive |
| Restoration Movement | A cure for Soilblight; return of terrestrial agriculture; dissolution of Consortium monopoly | The land is humanity's birthright; Consortium monopoly is an artifact of manufactured scarcity | Public advocacy, underground biological research, civil disruption, and a splinter cell that has begun platform sabotage | They do not know about Section 7. If they did, they would also not know whether to release it or use it for leverage. |
| The Uncharted | To be left alone; access to Coldwater Run protein; freedom from Compact or Consortium jurisdiction | Both systems have tried to absorb, tax, or destroy independent operators for 80 years | Evasion, piracy, informal information networks, and -- crucially -- control of specific salvage knowledge from sunken pre-Collapse infrastructure | Deeply fragmented; will not form a unified bloc; their strength is also their inability to make binding agreements |
| Deepwater Consortium | Expand operations into Coldwater Run; diversify from current Shallows position | Aurum locked them out of Meridian zone in the 2204 treaty, a wound still raw in executive culture | Investing in Restoration research (as a hedge -- a cure destroys Aurum's dominance even more than theirs); funding Free Cities sympathizers | A cure would also partially destroy their own monopoly. They have not fully thought through the implications of what they are funding. |

**Monopoly Map:**

| Domain | Who Holds It | Is It Contested? |
|--------|-------------|-----------------|
| Violence | No single entity -- three Consortium security forces, twelve city-state navies, Uncharted pirate fleets | Yes -- the Coldwater Run is a live conflict zone |
| Law | Free Cities Compact maritime law (nominal); Consortium contract law (functional) | Yes -- the Consortia's legal jurisdiction is self-asserted and not universally recognized |
| Currency | The Caloric Standard (Cal) -- units pegged to kelp protein output, managed by the Aurum-dominated Pelagic Exchange | Partially -- Uncharted communities use barter and salvage-value currency |
| Food supply | Aurum Consortium (38%), Kelp Union (18%), Deepwater Consortium (12%), Free Cities public farms (14%), independents (18%) | Deeply contested -- this is the world's central conflict |
| Information | Consortium satellite relay network (premium); word-of-mouth via shipping routes (free, slow) | Yes -- controlling information speed is a major advantage the Consortia actively exploit |
| Spiritual authority | No global institution; city-state variations include the Church of Endurance (land-return theology), the Pelagic Observance (ocean-as-sacred), and secular civic humanism | Contested at the local level; no global spiritual power |
| Soilblight cure research | Deepwater Consortium (covertly funded); scattered independent biologists | Technically contested but practically monopolized by whoever controls lab infrastructure |

---

### Culture and Society

**Social Stratification:** Class is determined primarily by food security and platform access. The upper tier (roughly 8% of population) are Consortium executives, senior engineers, and major city-state politicians -- food security is total, platform access is unrestricted. The middle tier (roughly 35%) are skilled workers on platforms, city-state professionals, and independent operators -- food secure in non-Drift periods, precarious during Drift Season. The lower tier (roughly 45%) are port laborers, low-skilled platform workers, and urban poor -- rationing is a normal feature of life; Drift Season is genuinely dangerous. The remainder are Uncharted -- outside the measurement system entirely.

**Dominant Ideology:** Survivalism -- the belief that the Collapse was survived through discipline, hierarchy, and expertise, and that preserving those systems is preserving humanity itself. Consortium PR constantly invokes the Collapse Decade: "We remember what hunger costs. We built so you would never know it." This is both true and self-serving.

**Key Cultural Details:**

- **Birth:** New births are registered with the Compact or the nearest Consortium platform for caloric allocation purposes. A birth without registration means no food allocation -- a form of legal invisibility. Uncharted births are unregistered by definition, which is why Uncharted communities share resources communally.
- **Coming-of-age:** At 14, registered citizens receive their first adult Cal allocation card. The ceremony varies by city-state but almost universally involves a first adult meal -- typically a multi-course meal of the local specialty protein -- eaten without portion restriction. The symbolism is not subtle.
- **Death and burial:** Burial at sea is universal. Land burial is impossible (the fungus immediately colonizes organic matter in soil). The Pelagic Observance holds that the ocean is the body of the First Survivors and death is a return. The Church of Endurance holds that death on the water is a temporary state -- the land will reclaim its children when Restoration comes.
- **Food traditions:** The Shallows city-states have developed extraordinarily sophisticated shellfish and seaweed cuisine -- the equivalent of Mediterranean food culture, intricate and regional, with dozens of preparation traditions. Consortium platform workers eat engineered protein blocks with flavoring supplements -- nutritionally adequate, culturally barren. "Platform food" is slang for anything without joy. The Uncharted eat whatever they can get and have developed a forager-scavenger cuisine of extraordinary resourcefulness.
- **Religion / spirituality:** The Church of Endurance (largest organized religion, ca. 400 million adherents) teaches that Soilblight was a divine punishment for pre-Collapse environmental sin, that the land is being purified, and that Restoration is a moral imperative. They fund legitimate Restoration research but also have a prophetic fringe that believes Restoration will happen supernaturally, not scientifically. The Pelagic
