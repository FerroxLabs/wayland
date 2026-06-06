---
name: tabletop-rpg-campaign-builder
description: |
  Provides an intermediate framework for building tabletop RPG campaigns:
  session zero checklist (safety tools, tone, themes, character creation
  guidelines), world premise template, encounter pacing structure (3-act
  session format), NPC creation framework, and session planning templates.
  System-agnostic but includes examples for popular rule systems. Use when
  the user wants to run a tabletop RPG campaign, design a game world,
  prepare session zero, structure encounters, or create NPCs. Do NOT use
  for board game selection (use board-game-selection-guide), video game
  strategy guides (use video-game-strategy-guide-writer), or creative
  fiction writing (use writing category skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "tabletop-rpg planning template creative-writing"
  category: "hobbies-crafts"
  subcategory: "games-puzzles"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Tabletop RPG Campaign Builder

## When to Use

Use this skill when:

- A user wants to run a tabletop RPG campaign as game master (GM) and needs help with preparation, structure, or planning -- whether their system is D&D 5e, Pathfinder 2e, Call of Cthulhu, Blades in the Dark, Ironsworn, Savage Worlds, or any other system
- A user asks specifically about Session Zero -- what to cover, how to handle safety tools, how to establish tone, or how to run the pre-campaign planning session
- A user wants to build a campaign setting or world premise from scratch, including factions, geography, history, and central conflict
- A user asks about encounter pacing, session structure, adventure design, or how to balance combat with roleplay and exploration
- A user wants templates or frameworks for NPC creation, faction design, location building, or villain motivation
- A user needs help structuring a campaign arc across multiple sessions -- including how to plan a satisfying beginning, middle, and end without over-preparing
- A user is preparing their first session as GM and wants a concrete checklist of what to have ready
- A user has an ongoing campaign that has stalled, lost momentum, or needs structural repair

Do NOT use when:

- The user wants board game recommendations or rulebook comparisons -- use the `board-game-selection-guide` skill
- The user wants video game strategy content or walkthroughs -- use the `video-game-strategy-guide-writer` skill
- The user wants to write creative fiction set in a fantasy or sci-fi world without any game context -- use skills in the `writing` category
- The user wants a streaming or recording setup for their game sessions -- use `game-streaming-setup-guide`
- The user is looking for character optimization advice, build guides, or mechanical min-maxing within a specific system -- this skill is system-agnostic and does not provide mechanical stat blocks or build paths
- The user wants a complete adventure module written for them -- this skill provides frameworks, templates, and guidance, not finished publishable content

---

## Process

### Step 1: Gather the Campaign Brief

Before providing any framework, collect the following information. If the user has already provided some of it, acknowledge what you know and ask only for what is missing. Do not ask for everything at once -- group into two natural questions if needed.

- **Game system:** The specific rule system (D&D 5th Edition, Pathfinder 2e, Call of Cthulhu 7e, Blades in the Dark, Ironsworn, Savage Worlds, Dungeon World, Mothership, etc.) or "undecided." The system affects pacing advice (some systems like Blades in the Dark have built-in session structures), safety tool integration (some systems like Ironsworn have no GM at all), and encounter design philosophy
- **Player count:** How many players at the table. 3-5 is the design sweet spot for most systems. 6+ requires structural adjustments. 2 or fewer is a duet campaign and requires a fundamentally different approach
- **Player experience and GM experience:** All new, mixed group, all experienced. Treat these separately -- a new GM with experienced players has different needs than an experienced GM with new players
- **Session frequency:** Weekly, biweekly, monthly. Frequency affects how much recap/re-grounding is needed at the start of each session and how granular campaign notes need to be
- **Session length:** 2 hours (tight -- requires strict pacing), 3 hours (standard), 4+ hours (can breathe, but fatigue management matters in Act 2)
- **Campaign length intention:** One-shot (1 session), mini-arc (3-5 sessions), medium campaign (10-20 sessions), long campaign (20+ sessions). New GMs should never plan longer than 5 sessions in advance
- **Genre and tone:** High fantasy, dark fantasy, horror, noir, heist, political intrigue, cosmic horror, science fiction, post-apocalyptic, historical. Tone descriptors: comedic, gritty, dramatic, pulpy, mysterious, epic, intimate
- **Any existing ideas:** Does the user have a setting concept, a villain in mind, a specific adventure idea, or are they starting from zero?

### Step 2: Build the Session Zero Checklist

Session Zero is a mandatory pre-campaign session -- not optional, not skippable for "experienced groups." Its purpose is threefold: align player expectations with the GM's vision, establish trust through safety tools, and ensure the characters and story will actually work together. A Session Zero takes 1.5 to 3 hours depending on group size and experience.

**Safety Tools -- present all of these, not just one:**

- **Lines and Veils (Ron Edwards, 2001):** Lines are absolute hard limits -- content that will never appear in any form at this table. Veils are content that can exist in the narrative but will always happen off-screen. Collect these privately (index cards, private messages, anonymous Google Form). Common lines include: sexual content involving minors, real-world religious mockery, depictions of suicide methods. Common veils include: torture sequences, graphic gore, infidelity. The GM must also contribute their own lines and veils -- this is not just about protecting players.
- **The X-Card (John Stavropoulos):** A physical card (or typed "X" in chat) that any participant can invoke at any moment to immediately pause or skip a scene. No explanation required, no questions asked, no social penalty. The scene either stops or jumps forward. Normalize it by invoking it once yourself at the start of the campaign for a trivial reason -- this removes the social friction of being "the first one to use it."
- **Script Change (Beau Jágr Sheldon):** An extension of the X-Card with nuance: Rewind (go back and replay the scene differently), Fast Forward (skip ahead past this content), Pause (take an out-of-character break). Particularly useful for online play where tonal calibration is harder.
- **Open Door Policy:** Any player can leave the table -- physically or virtually -- at any time without explanation or social penalty. Sessions should always have a clear break point at roughly the midpoint.
- **Debrief:** At the end of each session, 2 minutes of "is there anything we should add to lines or veils for next time?" This is a living document, not a one-time survey.

**Tone and Expectations -- be specific:**

- Narrative tone: pick two or three words (e.g., "gritty and political," "comedic but with real stakes," "cosmic horror with noir sensibility"). Vague agreements about tone ("fun adventure") create conflict when the GM's idea of "dark" is very different from a player's
- Combat frequency and lethality: combat-heavy means most sessions include at least one fight; roleplay-heavy means combat is a rare punctuation mark. Lethality matters separately -- a combat-heavy game can still have very low character death risk
- Player vs. Player conflict: full PvP (competing characters), PvP only through established narrative beats (betrayals that are pre-planned with the GM), or no PvP at all. In new groups, no PvP is almost always correct
- Character death policy: always possible (old-school D&D philosophy), only at dramatically appropriate moments (most modern games), or never -- characters are defeated and face consequences but survive. State this explicitly, not implicitly
- Spotlight distribution: how will the GM ensure every player gets meaningful screen time? Particularly important in large groups. Commit to at least one personal scene per player per 2-session block
- Metagaming expectations: is out-of-character knowledge (knowing a monster's stat block, knowing a plot twist because you read ahead) acceptable? Most tables want players to play their character's knowledge, not the player's knowledge

**Character Creation Guidelines:**

- Allowed sources: list every book or supplement explicitly permitted. "Everything official" is a valid answer but creates expectation management issues if you later restrict something
- Character connections: do the characters know each other? Did they grow up together, meet at a specific event, or are they strangers? The best modern practice is a "web of connections" -- A knows B, B knows C, but A does not know C yet. This creates immediate social dynamics
- Backstory integration: ask each player for two elements -- one "gift" (something from their backstory the GM can use as a positive story hook) and one "wound" (something unresolved from their past the GM can use for dramatic tension). A full backstory novel is not required and is often counterproductive
- The "Session Zero Character Worksheet" approach: instead of players writing backstories at home and hoping they fit, build characters at the table together. This surfaces incompatible character concepts before they become session problems

### Step 3: Create the World Premise

Use the "5 Pillars" framework to build a world premise in under 30 minutes. The goal is not a complete world -- it is the minimum viable world needed for play to begin. The world should be built outward from where the players are, not designed comprehensively and then populated. Every element not directly connected to the starting location or the first 3 sessions is optional prep that can happen between sessions.

**Pillar 1 -- The World in One Sentence:**
This sentence contains: [adjective describing the world's condition] + [the world's defining feature] + [the implication for those who live there]. It is a premise, not a description. "A feudal kingdom with magic" is a description. "A dying empire where the old magic is fading and every noble family is scrambling to control whatever scraps of power remain" is a premise -- it implies conflict, stakes, and drama without requiring you to write a history.

**Pillar 2 -- The Central Tension:**
The background conflict that makes the world feel alive independent of the player characters. This is not the campaign plot -- it is the weather system the campaign plot moves through. It should be a genuine dilemma with no clear "right side." Examples: "The colonizers are building prosperity on land that was stolen, and the original inhabitants are deciding between armed resistance and political compromise." Or: "An alien signal has been decoded, and half of humanity thinks it is an invitation and half thinks it is a warning." The Central Tension should make every NPC have a position, not just the main villain.

**Pillar 3 -- What Makes This World Different:**
One or two worldbuilding rules that distinguish this setting from the default assumptions of the genre. These should be mechanically or narratively consequential, not just cosmetic. Not "the elves have silver eyes" (cosmetic). Yes: "Magic users are born, not made -- and the noble class hunts them at birth" (consequential). Or: "Faster-than-light travel is possible but requires a human navigator to essentially die and be revived -- and some navigators do not come back the same" (consequential). These unique rules should create decisions and dilemmas, not just flavor.

**Pillar 4 -- The Starting Location:**
A specific, named place with enough detail for the first 3 sessions. Include: a name that is memorable and pronounceable, a 3-5 sentence description covering physical appearance, social atmosphere, and one immediately visible problem or tension, 3-5 key locations within it (each with a purpose and a person associated with it), 2-3 named NPCs with full frameworks (see Step 5), and 1 immediately visible problem or opportunity that does not require the player characters to solve it but will get worse if ignored. The starting location should feel lived-in and specific, not generic.

**Pillar 5 -- The Hook:**
The hook answers three questions simultaneously: Why these characters? Why now? Why together? It must be specific, immediate, and urgent. The hook is not a mystery -- it is the situation. The mystery comes from pursuing it. "A wizard hires you to retrieve a stolen artifact" is not a hook (too vague, no urgency). "Your caravan was ambushed on the King's Road at dawn; the cargo was a diplomatic treaty that if not delivered to the capital by the new moon will restart a war; you are the only survivors and you do not know if the ambush was random or targeted" is a hook -- it has a deadline, a personal stake (you survived this), a consequence for failure, and a mystery embedded within it (who ordered the ambush?).

### Step 4: Design Session Pacing Using the 3-Act Structure

Every session -- whether 2 hours or 6 hours -- has three acts. The time ratios are fixed regardless of session length: Act 1 is 25% of the session, Act 2 is 50%, Act 3 is 25%. This is not a narrative theory -- it is a functional pacing tool that prevents the two most common GM mistakes: spending too long in setup (players feel nothing is happening) and rushing the climax (players feel cheated of the payoff).

**Act 1 -- Setup (25% of session time):**
- Recap: ask 1-2 players to recap the previous session in 2-3 minutes. Do not recap it yourself -- player recaps reveal what they found memorable and significant, which is your most valuable data about what is working
- Re-establish the situation: where are the characters, what do they know, what immediate problem or opportunity is in front of them? This can be a conversation with an NPC, a letter, a discovery, or just description of the environment
- Establish the session goal: not a mandatory railroad, but a clear "the situation is X, and the obvious next move is Y." Players will often choose Z, but giving them a clear reference point lets them make a meaningful choice about whether to follow or deviate
- The opening scene should always include at least one character-specific element -- something that speaks to a specific player's character, not the group as a whole. This signals that the GM has been paying attention

**Act 2 -- Rising Action (50% of session time):**
- Contain 2-4 encounters of varying type. The encounter types are: Combat (physical conflict), Social (negotiation, persuasion, deception, information gathering), Exploration (navigation, discovery, environmental challenge), and Puzzle/Skill Challenge (a multi-step challenge requiring resource management or creative thinking)
- Never run two encounters of the same type back-to-back. Variety regulates attention and energy at the table
- Each encounter should change the situation -- the players should end each encounter knowing something they did not know before, or having fewer or different resources, or facing a different problem. An encounter that resolves cleanly and leaves everything unchanged is wasted time
- The midpoint twist: at roughly the halfway point of Act 2, introduce a complication that reframes the situation. Not a reversal of everything established -- a new variable that makes the goal harder or more complex. Examples: an ally turns out to have been compromised; the map was intentionally wrong; the target location has already been emptied; reinforcements arrive on the enemy side; the "villain" sends a messenger asking to negotiate
- Pacing the tension curve: Act 2 should feel like it escalates from "manageable problem" to "serious problem." The last encounter of Act 2 should be the moment when the players realize the situation is more significant than they thought

**Act 3 -- Climax and Resolution (25% of session time):**
- The climactic encounter is the session's highest-stakes moment. It does not have to be a combat -- a climactic negotiation, a desperate escape, a moral choice under time pressure, or a revelation that recontextualizes everything can all serve this function
- Resolution: immediate consequences. What changed? Who is affected? What do the characters now have that they did not before (information, resources, allies, enemies)?
- The session hook: end every session on an open question, an unresolved tension, or a revelation that creates immediate curiosity about what comes next. The hook should be specific -- not "the adventure continues" but "Dunmore was last seen leaving town with a hooded stranger, moving fast, in the direction of the deep ruins." Let that image sit in the players' minds until the next session

**Managing Session Time:**
- Track time actively, especially in Act 2. If a combat encounter is running long, use compression techniques: reduce remaining enemy hit points silently, have enemies begin fleeing at 50% casualties, or fast-forward minor enemy actions
- The 10-minute warning: at 10 minutes before the planned session end, begin moving toward the Act 3 resolution regardless of where the story is. A session that ends mid-Act 2 because of time is deeply unsatisfying. A rushed but complete session arc is always better than a naturalistic but incomplete one
- Buffer planning: always have 1 optional encounter prepared that can be cut if time is short. This is your "drop scene" -- fully prepared but not structurally necessary

### Step 5: Apply the NPC Creation Framework

NPCs are the delivery mechanism for almost all narrative information and emotional engagement in a campaign. Every significant NPC needs six elements. Minor NPCs (background characters, one-interaction roles) need three.

**Full NPC Framework (6 elements):**

| Element | Function | What to Avoid |
|---------|----------|---------------|
| **Name** | Memorable, pronounceable in the session, fits the setting's naming conventions | Names that sound too similar to other NPCs; names with apostrophes that no one knows how to say aloud |
| **Role** | Structural function in the story: ally, rival, antagonist, quest-giver, information broker, moral mirror, mentor, wildcard | Defining NPCs only by their function makes them feel like furniture |
| **Want** | What they are actively pursuing at this moment in the story. This drives every interaction. Must be specific and personal | "Power" and "money" are not wants -- they are abstract goals. "Enough money to buy her daughter out of the indentured apprenticeship before the contract renews in 30 days" is a want |
| **Method** | How they pursue their want -- their strategy, their ethics, their personality expressed through action | "Ruthless" is not a method. "Will sacrifice anyone except her immediate family, genuinely regrets it afterward, keeps a list of names" is a method |
| **Secret** | Something they are hiding that the players can discover and that will change their relationship with this NPC when revealed | The secret should recontextualize the NPC's behavior so far, not just add information. If learning the secret does not change how the players feel about this person, it is not a good secret |
| **Voice/Mannerism** | One or two specific physical habits or speech patterns that make this NPC recognizable when portrayed at the table | "Speaks confidently" is not a mannerism. "Never uses contractions, always stands at an angle to whoever she is speaking to, taps the table once before making any request" is a mannerism |

**Quick NPC Framework (3 elements):** Name + Role + One memorable trait. A blacksmith named Harren who always looks at the door when you walk in and never at your face. A guard named Pela who is visibly exhausted and keeps yawning. These details cost nothing to prepare and make the world feel populated by people rather than functions.

**NPC Reaction Consistency:**
NPCs remember what the players do. Maintain a simple "NPC relationship tracker" -- not a complex document, just a note for each significant NPC: "warm," "neutral," "hostile," "suspicious," "indebted." After each session, update it. Players notice when NPCs react consistently to their past actions, and that consistency is what transforms a world from a backdrop into a living place.

**Villain Design -- the most important NPC:**
A villain who is only evil is a narrative prop, not an antagonist. The strongest villains in tabletop campaigns share three qualities: they have a coherent logic (their goals make sense from their perspective, even if their methods are monstrous), they have a personal connection to at least one player character's backstory, and they are capable of actions that the players did not predict. Never reveal a villain's full plan too early -- the players should be able to reconstruct it in retrospect but should not see it coming.

### Step 6: Structure the Campaign Arc

**For one-shots (1 session):**
The one-shot has its own arc structure: a tight premise, immediate stakes, a self-contained resolution. The hook must establish everything the players need to know to act immediately. No time for world-building tours. Provide pre-generated characters or character options limited to 3-4 choices. The climax should be reachable in the session time available even if players take a detour.

**For short arcs (3-5 sessions):**
- Sessions 1-2: establish the world, the central problem, and the party's stake in it. End session 2 with a revelation that escalates the stakes
- Session 3 (the turning point): the situation gets worse. The apparent solution fails or is more complicated than expected. The true scope of the problem becomes visible
- Sessions 4-5: the approach and the climax. Session 4 is preparation (gathering resources, building alliances, making difficult choices). Session 5 is the confrontation and resolution -- including an epilogue that addresses what changed for each character

**For medium campaigns (10-20 sessions):**
Use a "5-3-2" planning model: plan the next 5 sessions in moderate detail (scene ideas, key NPCs, encounter types), the following 3 sessions in rough outline (major story beats only), and the final 2 sessions as a thematic destination (what the campaign is building toward) rather than a plot outline. Reassess after every 5 sessions. Players will have changed the world by then.

**For long campaigns (20+ sessions):**
Never plan more than 10 sessions in detail at a time. Long campaigns live and die by flexibility. Establish a "campaign bible" with: the central tension, the factions and their agendas, the major NPCs, and the "world clock" (events that will happen in the world regardless of player action if not addressed). Let the players interact with the world clock -- this creates the sensation of a living world without requiring the GM to plan everything

**The World Clock:**
A world clock is a list of 3-5 events that will occur at specific intervals (in sessions, not in-world time) if the players do not intervene. Each event escalates the central tension. Example: Session 4 -- if the players have not investigated the ruins, a second entrance collapses, cutting off the northern route. Session 7 -- if Dunmore has not been confronted, he completes his deal and the artifact leaves town permanently. The world clock creates urgency and consequence without railroading.

**Between-Session Prep (the most important ongoing habit):**
After every session, before preparing the next one, complete a "3-2-1 review": write down 3 things the players did that you did not expect, 2 NPC reactions you need to update based on player actions, and 1 world event that should advance on the world clock. This review takes 15 minutes and is more valuable than 3 hours of new content preparation.

### Step 7: Deliver the Output

Assemble the output in the format below. Provide all sections that are relevant to the user's situation. For a first-session query, include Session Zero checklist, World Premise, Starting Location, and Session 1 Pacing. For an ongoing campaign that has lost momentum, focus on the arc repair framework and the world clock. Tailor the level of detail to GM experience -- new GMs need more explicit guidance and fewer choices; experienced GMs need the frameworks and can fill in the specifics.

---

## Output Format

```
## Campaign Framework: [Campaign Name or "Untitled Campaign"]

### Campaign Brief
- System: [game system or "undecided"]
- Players: [count] ([experience level: all new / mixed / all experienced])
- Sessions: [frequency] | [length] per session | [total arc length]
- Genre/Tone: [genre] | [2-3 tone descriptors]
- GM experience: [first time / some experience / experienced GM, new system]

---

### Session Zero Checklist
**Duration estimate:** [60 / 90 / 120 minutes]

**Safety Tools**
- [ ] Lines and Veils explained and collected privately from all participants (including GM)
- [ ] X-Card introduced and physically present (or typed "X" normalized for online play)
- [ ] Script Change tools explained (Rewind, Fast Forward, Pause) [optional but recommended]
- [ ] Open door policy stated explicitly: any player may leave any session, no explanation needed
- [ ] End-of-session debrief: confirm players know lines/veils will be reviewed after every session

**Tone and Expectations**
- [ ] Narrative tone: [specific descriptors, e.g., "gritty political drama with moments of dark humor"]
- [ ] Combat frequency: [combat-heavy / balanced / roleplay-heavy]
- [ ] Lethality: [characters can die at any time / death only at dramatic moments / no permanent death]
- [ ] PvP policy: [permitted / narrative-beats only / no PvP]
- [ ] Spotlight policy: [how the GM will ensure every player gets personal story moments]
- [ ] Metagaming expectations: [play character knowledge vs. player knowledge]

**Character Creation**
- [ ] Allowed sources: [list every permitted book/supplement]
- [ ] Character connection requirements: [web of connections / shared backstory element / strangers]
- [ ] Backstory format: [one paragraph / backstory worksheet / "gift and wound" format]
- [ ] Party composition: [any combination / roles that should be filled]
- [ ] Character sheet format: [paper / digital platform]

**Logistics**
- [ ] Schedule confirmed: [day, time, frequency]
- [ ] Cancellation policy: [e.g., "cancel if 2+ players cannot attend"]
- [ ] Communication channel: [group chat platform]
- [ ] Rulebook access: [who has what books]

---

### World Premise (5 Pillars)

| Pillar | Content |
|--------|---------|
| World in one sentence | [premise sentence including world condition + defining feature + implication] |
| Central tension | [the background conflict with no clear right side] |
| What makes it different | [1-2 worldbuilding rules that are narratively consequential] |
| Starting location | [name: brief description] |
| The hook | [why these characters / why now / why together -- specific and urgent] |

---

### Starting Location: [Location Name]

[3-5 sentences: physical appearance, social atmosphere, one immediately visible problem]

**Key Locations:**
| # | Location Name | Purpose | Associated NPC or Feature |
|---|--------------|---------|--------------------------|
| 1 | [name] | [purpose for players] | [NPC or notable feature] |
| 2 | [name] | [purpose for players] | [NPC or notable feature] |
| 3 | [name] | [purpose for players] | [NPC or notable feature] |
| 4 | [name] | [purpose for players] | [NPC or notable feature] |
| 5 | [name] | [purpose for players] | [NPC or notable feature] |

**Key NPCs:**
| Name | Role | Want (specific) | Method | Secret | Voice/Mannerism |
|------|------|-----------------|--------|--------|-----------------|
| [name] | [role] | [specific want] | [how they pursue it] | [what they hide] | [physical habit or speech pattern] |
| [name] | [role] | [specific want] | [how they pursue it] | [what they hide] | [physical habit or speech pattern] |
| [name] | [role] | [specific want] | [how they pursue it] | [what they hide] | [physical habit or speech pattern] |

---

### Session 1 Pacing Plan ([total session length])

| Act | Duration | Scene Description | Encounter Type |
|-----|----------|-------------------|---------------|
| Act 1 -- Setup (25%) | [X min] | [opening scene, situation establishment, session goal] | Roleplay: [specific scene] |
| Act 2 -- Encounter 1 | [X min] | [scene description, what changes] | [Combat / Social / Exploration / Puzzle] |
| Act 2 -- Encounter 2 | [X min] | [scene description, midpoint twist if applicable] | [Combat / Social / Exploration / Puzzle] |
| Act 2 -- Encounter 3 | [X min] | [scene description, escalation toward climax] | [Combat / Social / Exploration / Puzzle] |
| Act 3 -- Climax (25%) | [X min] | [climactic encounter description] | [encounter type and specific stakes] |
| Resolution + Hook | [X min] | [immediate consequences + specific cliffhanger] | N/A |

**Drop Scene (cut if short on time):** [one optional encounter that can be removed without damaging the session arc]
**Expansion Scene (add if running short):** [one optional scene that can be added if the session is moving faster than planned]

---

### NPC Quick Reference

| Name | Relationship to Party | Current Attitude | Notes for This Session |
|------|-----------------------|------------------|----------------------|
| [name] | [how party knows them] | warm / neutral / suspicious / hostile | [what this NPC wants in this session] |
| [name] | [how party knows them] | warm / neutral / suspicious / hostile | [what this NPC wants in this session] |

---

### Campaign Arc ([arc length])

| Act | Sessions | Core Story Beat | Key Events | World Clock Event (if skipped) |
|-----|----------|-----------------|------------|-------------------------------|
| 1 | [1-X] | [introduction beat] | [2-3 key events] | [what happens if not addressed] |
| 2 | [X-X] | [rising tension beat] | [2-3 key events] | [what happens if not addressed] |
| 3 | [X-X] | [climax and resolution] | [2-3 key events] | [irreversible consequence] |

**World Clock:**
- [Session X]: [event that occurs if not interrupted by players]
- [Session X]: [escalating event]
- [Session X]: [point of no return]

---

### Between-Session Prep Template (for GM use after each session)

**3-2-1 Review:**
1. Three things players did that I did not expect:
   - [blank for GM to fill]
   - [blank for GM to fill]
   - [blank for GM to fill]
2. Two NPC attitude updates:
   - [NPC name]: [old attitude] → [new attitude] because [player action]
   - [NPC name]: [old attitude] → [new attitude] because [player action]
3. One world clock advancement:
   - [which event advances and what it now looks like]
```

---

## Rules

1. **Safety tools are mandatory, not optional.** Lines and Veils, the X-Card, and the open-door policy must appear in every Session Zero output regardless of group experience level. "We are all adults who know each other" is not a reason to skip them -- it is a reason players will feel more social pressure to not use them if you do not explicitly normalize them. Safety tools protect the fun of the game, not just the comfort of individuals.

2. **Never provide complete stat blocks, mechanical build guides, or system-specific ability lists.** This skill provides narrative and structural frameworks. System-specific mechanical content (CR calculations, action economy analysis, spell slot management) belongs in system-specific resources. When mechanical examples are needed to illustrate a concept, label them clearly as illustrative and note that the GM should verify them against their specific system edition.

3. **World-building must follow the "outward from the players" principle.** Build the starting location in complete detail before building anything else. A fully realized capital city the players will not visit for 8 sessions is wasted preparation. The world should be revealed as the players move through it, not designed in advance and then presented to them.

4. **The campaign hook must answer three questions explicitly:** Why these specific characters, why right now (urgency), and why together (what forces them to cooperate rather than act independently). A hook that cannot answer all three in two sentences is not finished.

5. **The 3-Act session structure is a functional constraint, not a narrative preference.** Time allocations (25/50/25) are non-negotiable for session planning. A GM who spends 60% of a 3-hour session in Act 1 roleplay will always run out of time for a satisfying climax. The structure exists to prevent the most common session failure modes: slow starts, anti-climactic endings, and unresolved sessions.

6. **Every significant NPC requires a specific Want, not a category.** "Power," "money," "revenge," and "safety" are categories, not wants. A want must specify what, how much, by when, and why now. Generic wants produce generic NPCs who feel like obstacles or dispensers rather than people.

7. **Prepare at least two possible paths through every session, never just one.** Players will almost always choose a third option you did not anticipate, but having two prepared paths builds the GM's ability to improvise the third. A campaign with only one path is a railroad -- players feel the walls even when they cannot name what is wrong.

8. **New GMs must be steered toward shorter campaign commitments.** A new GM planning a 40-session campaign before running a single session is planning something that will almost certainly not finish. Recommend 1-3 sessions of planning horizon for first-time GMs, with the option to extend once the group is running. Finishing a 5-session arc is more valuable for GM skill development than abandoning a 40-session campaign at session 7.

9. **System-specific advice must be clearly labeled and treated as illustrative.** Different editions of the same game can have radically different pacing needs (D&D 4th Edition combats run significantly longer than D&D 5th Edition combats at the same level). Never make universal claims about combat duration, rest mechanics, or resource management without noting the system and edition.

10. **The "Yes, and" principle governs NPC reactions to unexpected player choices.** When players do something unexpected, NPCs react as if the world is real -- not as if there is a correct path they should have followed. The GM's job is not to redirect players back to the planned path but to show them the consequences of the path they chose. An NPC who acts identically regardless of what the players did is a sign of railroading, not good storytelling.

11. **The villain must be comprehensible, not just evil.** A villain whose motivation is "wants to destroy the world" or "enjoys suffering" is a boss encounter, not an antagonist. Every major villain needs a logic -- a version of events from their perspective in which their actions make sense. Players do not have to agree with that logic, but they must be able to understand it.

12. **Combat encounter difficulty should vary across a session.** An opening fight that nearly kills the party discourages creative problem-solving because players shift into resource-conservation mode for the rest of the session. An easy encounter (60-70% of party resources to solve) should usually precede a hard encounter (90%+ of resources) in a session structure.

---

## Edge Cases

### First-Time GM, No Prior Tabletop Experience

The biggest risk with a first-time GM is preparation paralysis -- spending weeks building a world and arriving at session one overwhelmed and under-confident. Counter this by scoping down aggressively:

- Recommend using a published starter adventure or one-shot module for the mechanical skeleton. The GM's job in session one is not to invent every detail -- it is to learn to describe scenes, voice NPCs, and manage the table. Published content provides training wheels for those skills
- Session Zero for this group should focus almost entirely on safety tools and tone. Skip complex character connection requirements. Use pre-generated characters if the system provides them
- For the first 3 sessions, linear structure is acceptable and preferred -- one path forward, clear goals, limited open-world choice. Complexity scales with GM confidence
- Identify one GM mentor resource: a podcast actual play (not for entertainment, but for observing how a skilled GM describes scenes and handles unexpected moments), a video tutorial series on the specific system, or an experienced friend the new GM can debrief with after each session

### All-New Group Including New Players

- Reduce Session Zero to its three non-negotiable elements: safety tools, tone agreement, and schedule confirmation. Skip advanced discussions about metagaming, spotlight distribution, and PvP policy -- these become relevant later
- Limit character creation options explicitly. "You can play any of these 4 options" is easier than "you can play anything in this 300-page book." Analysis paralysis in character creation is a major source of new player dropout before the first session
- Run the first session with a clear, linear structure: 3 encounters in sequence, each clearly telegraphed. The goal is not to teach players all the rules -- it is to make them feel capable and excited to return
- Plan a session 1.5 -- a brief, structured second session specifically for rules questions and character refinement before the campaign proper begins. This prevents rules confusion from accumulating silently

### Online Play (Virtual Tabletop)

Virtual play introduces specific friction points that need explicit management:

- Add to Session Zero: platform choice (Roll20, Foundry VTT, Owlbear Rodeo, Tabletop Simulator, or purely voice/text), camera expectations, audio discipline (push-to-talk vs. open mic), and a technical dropout protocol (if a player disconnects mid-session, what happens to their character?)
- The X-Card in digital spaces: agree in advance on a specific mechanism. A typed "X" in the chat, a specific emoji in the voice chat, or a dedicated "safety" button in the platform. Test it before session one
- Online sessions should plan 20-30% shorter than equivalent in-person sessions. Digital fatigue is real and affects cognitive engagement around the 2.5-hour mark even when in-person play at the same table would sustain 4 hours
- Theater of the mind vs. digital maps: this is not just a preference question -- it significantly affects session pacing. Digital battle maps with tokens can add 15-20 minutes per combat encounter due to setup time. Theater of the mind is faster but requires more descriptive skill from the GM

### Ongoing Campaign That Has Lost Momentum

Diagnose before prescribing. Lost momentum has four common causes:

- **Scheduling fragility:** if sessions are cancelling frequently, no amount of improved content will fix the problem. Reduce session frequency to a more sustainable pace, shorten session length, or move to asynchronous play (play-by-post) as a bridge option
- **Story fatigue:** the current arc has gone on too long or the central conflict feels unresolvable. Solution: introduce a time skip (weeks or months of in-game time pass), resolve the current arc at the next session even if the resolution is imperfect, and pivot to a new arc with new stakes. A hard stop followed by a fresh start is better than a slow drift to table death
- **Player disengagement:** one or more players have stopped engaging with the story. Hold individual brief check-ins (not group discussions) to understand why. Often the cause is that their character's personal arc has been neglected. Introduce a session specifically designed around that character's backstory element
- **GM burnout:** the GM is not having fun. This is the most important case and the most underdiagnosed. The immediate solution is to reduce prep burden (improv more, prep less), ask a player to run a one-shot in a different system to give the GM a break, or have an honest conversation with the group about campaign health. A GM who is not enjoying the game will eventually produce sessions that the players do not enjoy either

### Large Group (7+ Players)

Standard session design breaks down above 6 players. Specific adjustments:

- Combat duration scales roughly with player count. At 7-8 players using standard initiative systems, a medium combat encounter can take 2+ hours. Either adopt side initiative (all players act, then all enemies act, cycling) or use simplified combat mechanics that reduce individual turn complexity
- Social scenes with 7 players produce "wallpaper players" -- players who are not currently in the spotlight and have nothing to do. Break large social scenes into two simultaneous smaller groups, then have each group report back to the table. This keeps all players engaged and can be used to great narrative effect (different parties hear different versions of events)
- Spotlight management becomes critical. With 7 players and a standard session, each player gets roughly 8-10 minutes of personal focus time in a 3-hour session. Maintain an explicit spotlight tracker and ensure each player's character has a personal scene at least once every two sessions
- Consider splitting the large group into two smaller groups with the same GM for different session nights, running parallel storylines in the same world that occasionally intersect. This is logistically complex but produces dramatically better individual player experiences

### Adapting to Specific Systems With Built-In Structures

Some game systems have campaign structures that override or modify the generic 3-Act framework:

- **Blades in the Dark (Forged in the Dark family):** has a built-in session structure called the Score/Downtime cycle. Scores are heist-style missions with player-determined approach, followed by Downtime phases where characters recover and pursue personal projects. The 3-Act structure maps imperfectly onto this -- use it as the structure within a Score rather than across the full session
- **Ironsworn/Starforged:** designed for solo or GM-less cooperative play with a journaling component. The campaign framework here focuses on vow structure (short-term, medium-term, and background vows that provide the campaign arc) rather than GM-prepared sessions
- **Call of Cthulhu and horror systems:** require a fundamentally different pacing approach. Horror sessions should not follow the standard "escalation toward a satisfying climax" model -- they work best with a slow-burn structure where Act 2 is investigative and the Act 3 "climax" is often ambiguous, incomplete, or deliberately unsatisfying. The horror is in what is not explained, not in a fully resolved confrontation
- **Powered by the Apocalypse games (Dungeon World, Apocalypse World, Masks):** the GM role is explicitly framed as "playing to find out what happens" rather than preparing a plot. Session Zero should emphasize this collaborative worldbuilding philosophy. The concept of "prep less, improvise more" is built into the system design, and overcorrecting toward heavy preparation works against the system

### Player Conflict (Out-of-Character)

Player conflict is distinct from character conflict and requires immediate intervention:

- Identify whether the conflict is in-character (characters disagreeing, which is healthy) or out-of-character (players disagreeing about how to play, which is a table health issue)
- Address out-of-character conflict directly and privately before the next session. Never address it publicly at the table during a session
- If conflict involves a player feeling their character has been undermined or disrespected by another player, this is often a symptom of inadequate PvP expectations set at Session Zero -- revisit the PvP policy
- In persistent conflict situations, offer a private "Session Zero Revisit" -- a brief conversation with all players outside of session to reset expectations. Frame it as a table check-in, not a mediation of a dispute

---

## Example

**Input:** "I want to run a campaign using D&D 5th Edition for 4 friends. Two of them have played D&D before but not regularly. Two have never played at all. I have run exactly one one-shot before, about a year ago. We can play every other Saturday for about 3.5 hours. I want something dark and political -- less dungeon crawl, more intrigue and moral dilemmas. I am thinking roughly 8-10 sessions."

---

## Campaign Framework: The Weight of Old Crowns

### Campaign Brief
- System: D&D 5th Edition
- Players: 4 (2 with light experience, 2 brand new to tabletop RPGs)
- Sessions: Biweekly (every other Saturday) | 3.5 hours per session | 8-10 session arc
- Genre/Tone: Dark fantasy | Political intrigue, moral ambiguity, occasional grim violence
- GM experience: One prior one-shot; this is first multi-session campaign

---

### Session Zero Checklist
**Duration estimate:** 90 minutes

**Safety Tools**
- [ ] Explain Lines and Veils to the full group. Distribute index cards. Ask each person to write their lines (hard limits) and veils (fade to black) privately. Collect and read privately before session one. Add your own as GM.
- [ ] Introduce the X-Card: "At any time, anyone can say 'X' or hold up this card. The scene stops or skips, no questions asked, no explanation needed. I will use it myself in the first session to normalize it."
- [ ] State the Open Door Policy explicitly: "If anyone needs to step away at any point -- not just for the bathroom, but if a scene gets uncomfortable -- just say 'I need a minute' and we pause. No explanation needed, no social pressure."
- [ ] Note for this specific campaign: dark political content means potential topics including torture, execution, betrayal of trusted allies, and moral complicity. Flag these in your own lines and veils contribution. Ask players specifically whether these themes are in-bounds, in-bounds but veiled, or off the table.
- [ ] Confirm: end-of-session debrief check-in ("anything new to add before next time?")

**Tone and Expectations**
- [ ] Narrative tone: "Dark and grounded. Think less Tolkien, more George R.R. Martin -- but not grimdark for its own sake. Heroism is possible, just earned. Cynicism is warranted, but hope still exists."
- [ ] Combat frequency: roleplay-heavy. Most sessions will not have a full combat encounter. When combat happens, it means something -- someone important might die, a major relationship might break.
- [ ] Lethality: characters can die, but only at dramatically significant moments. A character will never die to a random arrow from an unnamed soldier. Death comes from choices and their consequences.
- [ ] PvP policy: character conflict and tension are welcome (this is a political intrigue game). Direct PvP violence requires GM approval and narrative justification. No ambushing fellow party members for personal gain.
- [ ] Spotlight: every session will include at least one scene that speaks directly to one character's personal backstory or motivation. Over 8-10 sessions, every character will get 2-3 dedicated spotlight moments.
- [ ] Metagaming: play what your character knows. Your character does not know that the helpful advisor is a traitor even if you have a suspicion. Stay in character's knowledge base.

**Character Creation**
- [ ] Allowed sources: Player's Handbook only. No supplements, no Unearthed Arcana. This keeps things manageable for new players and reduces rules complexity.
- [ ] Character connections: use the "web of connections" method. At Session Zero, each player defines one relationship with one other player character. A knows B; B knows C; C knows D; D knows A. No character is a stranger to every other character before the campaign begins.
- [ ] Backstory format: the "Gift and Wound" worksheet. Each player answers two questions: "What is one thing from your past that you are proud of or that you carry with you?" (Gift -- the GM will use this to give you things you care about) and "What is one thing from your past that is unresolved, broken, or that you regret?" (Wound -- the GM will use this to challenge you and give you a path to growth). This replaces a long backstory.
- [ ] Party composition: for a political intrigue campaign, push players toward characters who have social skills and reasons to be in noble or political spaces. A face character (Bard, Rogue with Criminal background, Paladin with Noble background), an investigator (Ranger Urban Tracker, Wizard with Scholar background), and a wild card (Fighter with Knight background, Warlock with a secret patron) work well. Avoid builds that only function in combat.
- [ ] Starting level: Level 3. Level 1 and 2 characters are fragile in ways that work against an intrigue game where death has narrative weight. Level 3 gives each character their subclass and a clear identity.

**Logistics**
- [ ] Schedule: every other Saturday, [time confirmed by group]
- [ ] Cancellation policy: if 2 or more players cannot attend, session is rescheduled. No "play with whoever shows up" -- continuity matters in an intrigue campaign
- [ ] Communication: a group chat for between-session discussion, sharing session notes, and roleplaying minor interactions between sessions
- [ ] Rulebook access: confirm which players have physical or digital access to the Player's Handbook. If players do not have access, they should at minimum have the D&D Beyond basic rules for their class and race

---

### World Premise (5 Pillars)

| Pillar | Content |
|--------|---------|
| World in one sentence | A crumbling dual monarchy kept alive by old alliances that every major faction is secretly working to dissolve before someone else does it first. |
| Central tension | The old treaty that has kept two rival nations from war for 60 years requires a royal heir from each side -- but the last heir of the Northern Crown died without children three months ago, and no one has announced it yet. |
| What makes it different | Magic in this world is bureaucratically controlled -- all licensed spellcasters are registered and taxed by the Treaty Authority. Unlicensed magic is treason. This means information is power, and magic-as-information (scrying, sending, speak with dead) is the most tightly regulated category. |
| Starting location | Vasskeep -- a treaty city, technically sovereign territory of neither nation, governed by a joint council and held together by commerce, compromise, and mutual suspicion. |
| The hook | The party has each been summoned separately to Vasskeep by a letter bearing the seal of Councilor Aldric Vane, the most powerful neutral arbiter in the treaty system. The letters arrived the same day the Northern Crown's ambassador died in his chambers of apparent natural causes. Vane wants to meet tonight, privately, at the Assayer's Bridge. He told each of you to come alone. |

---

### Starting Location: Vasskeep

A city of 12,000 people built on a narrow land bridge between two rivers, Vasskeep is physically impossible to attack from either direction without crossing the other nation's territory first -- which is why it was chosen as the treaty city 60 years ago. The architecture is a deliberate blend of Northern and Southern styles: Northern stone towers connected by Southern open-air walkways that are miserable in winter. The atmosphere is one of performative neutrality -- everyone is polite, everyone is watching everyone else, and the phrase "I have no political opinion on that matter" is practically the city motto. Three things are immediately apparent to any visitor: there are too many well-dressed people who seem to have no obvious occupation, the Councilors' Hall is the tallest building by law, and every door in the market district has a small iron plaque indicating which licensing authority approved the business.

**Key Locations:**

| # | Location Name | Purpose | Associated NPC or Feature |
|---|--------------|---------|--------------------------|
| 1 | The Councilors' Hall | Political center; council sessions, public audiences, private chambers. The seat of the Treaty Authority. | Councilor Aldric
