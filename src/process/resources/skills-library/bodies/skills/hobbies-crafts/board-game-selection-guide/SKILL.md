---
name: board-game-selection-guide
description: |
  Helps users select board games matched to their group's preferences by
  evaluating player count, complexity weight, playtime, primary mechanic
  type, and group dynamics. Produces a structured recommendation rubric
  that teaches users to identify what makes a game right for their group
  rather than prescribing specific titles. Use when the user wants board
  game recommendations, asks about game selection for a specific group
  size or skill level, wants to understand game complexity ratings, or
  is building a board game collection. Do NOT use for tabletop RPG
  campaign design (use tabletop-rpg-campaign-builder), video game
  strategy (use video-game-strategy-guide-writer), or streaming setup
  (use game-streaming-setup-guide).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "board-games research guide checklist"
  category: "hobbies-crafts"
  subcategory: "games-puzzles"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Board Game Selection Guide

## When to Use

Use this skill when any of the following conditions are met:

- The user explicitly asks for board game recommendations for a specific group size, occasion, or skill level -- even vague requests like "what should we play tonight with 6 people" qualify
- The user wants to understand complexity weight ratings (BGG weight scale, complexity descriptors) and what they mean for their group
- The user is building a board game collection from scratch or filling identified gaps (no cooperative games, no two-player games, too many heavy games)
- The user has a specific game night occasion -- family reunion, corporate team-building, date night, holiday party -- and needs games that will work for that context
- The user asks about a specific mechanic category and wants to understand what mechanic types they might enjoy based on described preferences
- The user reports that a previous game night failed and wants to diagnose why and fix the selection for next time
- The user asks about the difference between supported player count and optimal player count for any game

**Do NOT use this skill when:**
- The user wants tabletop RPG campaign design, worldbuilding, or adventure structure -- use `tabletop-rpg-campaign-builder` instead
- The user wants strategy advice for a specific video game title -- use `video-game-strategy-guide-writer` instead
- The user wants to set up streaming equipment or capture card software for broadcasting game sessions -- use `game-streaming-setup-guide` instead
- The user is asking about miniature wargaming rules (Warhammer, Age of Sigmar) -- these are specialized wargame systems, not board games
- The user wants to design or publish their own board game -- that requires a separate game design skill
- The user is asking about poker, blackjack, or casino card games -- these are gambling games with distinct strategy considerations
- The user wants competitive tournament strategy for a specific game (e.g., "how do I win at Scrabble") -- that is game-specific strategy coaching, not selection guidance

---

## Process

### Step 1: Gather the Complete Group Profile

Before making any recommendations, collect all seven profile dimensions. Missing even one can produce a poor match. If the user has not volunteered information, ask directly using these exact questions:

- **Player count:** How many people play at once? Is this fixed or does it vary session to session? (The answer to variability matters enormously -- a game that scales gracefully from 2-6 is different from one that only shines at exactly 4.)
- **Age range:** What are the ages of the youngest and oldest players? Specifically flag whether anyone is under age 8, between 8-12, or over age 70, as these ranges have cognitive and physical dexterity implications for game design.
- **Experience level:** Have players tried only mass-market games (think Monopoly, Uno, Clue), gateway hobby games (Ticket to Ride, Pandemic, Catan), mid-weight games (Dominion, 7 Wonders, Power Grid), or heavy games (Twilight Imperium, Gloomhaven, Through the Ages)?
- **Available playtime per session:** How many hours are available start to finish? Subtract 30 minutes from any stated time -- groups always underestimate setup, teach time, bathroom breaks, and post-game discussion.
- **Social preference:** Is winning important, or is having fun the primary goal? Is there anyone who strongly dislikes losing or direct conflict with other players?
- **Theme tolerance:** Are there any themes the group would find off-putting (war, horror, occult, heavy historical tragedy)? Are there themes the group actively loves?
- **Budget per game:** $15-25 (card games, smaller boxes), $25-50 (mid-range), $50-80 (larger games with many components), $80+ (Kickstarter-style games with premium components, large boxes)?

If the user cannot answer all questions, use the following conservative defaults: group of 4, casual experience (Ticket to Ride level), 90-minute session, mixed competitive/cooperative preference, no theme restriction, $40 budget. State these defaults explicitly in the output so the user can correct them.

### Step 2: Assign the Complexity Weight Target

The board game hobby uses a 1.0-5.0 complexity weight scale, where 1.0 is trivially simple and 5.0 is an engineering-level rulebook. This is the single most predictive dimension for whether a group will enjoy a game. Map the user's experience profile to a starting weight, then apply the safety margin rule.

**Experience-to-weight baseline mapping:**

| Experience Descriptor | Examples They Have Played | Starting Weight Range |
|---|---|---|
| Non-gamer (no hobby games ever) | Go Fish, Monopoly, Uno | 1.0 -- 1.5 |
| Mass-market casual | Catan (basic), Pictionary, Taboo | 1.5 -- 2.0 |
| Gateway hobby gamer | Ticket to Ride, Pandemic, Sushi Go | 2.0 -- 2.5 |
| Regular hobby gamer | Dominion, 7 Wonders, Wingspan | 2.5 -- 3.5 |
| Experienced enthusiast | Viticulture, Arkham Horror, Spirit Island | 3.5 -- 4.5 |
| Heavy game veteran | Twilight Imperium, Gloomhaven, Paths of Glory | 4.5 -- 5.0 |

**Safety margin rule:** Always recommend 0.5 weight points below the group's apparent baseline. A group that correctly self-identifies as "regular gamers" should start at 2.5, not 3.5. A game that feels slightly easy generates confidence and enthusiasm. A game that feels too hard on first play generates frustration and often ends the game night -- and sometimes ends the hobby for new players.

**Mixed experience rule:** The weight ceiling is set by the least experienced player in the group, not the average or the most experienced. A table of four veterans and one non-gamer is a weight 1.5 table until the non-gamer develops familiarity. There are no exceptions to this rule. Experienced players are capable of enjoying light games; the reverse is not reliably true.

**Weight creep awareness:** Groups naturally want to increase complexity as they play more. Build this into long-term collection advice -- recommend that the group plan to step up 0.5 weight points after every 8-10 game nights together.

### Step 3: Map Social Preferences to Mechanic Categories

Every board game is built on one or more core mechanical systems. Matching the mechanic to how the group likes to engage socially is as important as matching the weight. Use this decision framework:

**Primary social style to mechanic mapping:**

| Social Style | Core Mechanic | What Players Actually Do | Conflict Level |
|---|---|---|---|
| Reading people, catching liars | Social deduction | Hold hidden roles; deduce, accuse, and bluff | High indirect |
| Building something that grows | Engine building | Develop a personal system that generates compounding output | Low-medium |
| Competing for territory | Area control | Deploy units to claim and hold map regions | High direct |
| Collecting and completing sets | Set collection | Gather matching or complementary cards/tokens for points | Low-medium |
| Strategic resource management | Worker placement | Assign limited action pawns to spaces that produce resources | Medium |
| Surviving together against difficulty | Cooperative | All players share information and coordinate to beat the game system | None (vs. game) |
| Combining cards for powerful effects | Deck building | Start with weak cards, buy better cards, optimize a personal deck | Low-medium |
| Storytelling and branching choices | Narrative/adventure | Make decisions that advance a story with persistent consequences | Variable |
| Fast, chaotic fun | Real-time | Simultaneously complete tasks before a timer or faster opponent | High excitement |
| Negotiating deals and alliances | Trading/diplomacy | Propose, negotiate, and break deals with other players | Very high indirect |
| Spatial reasoning and placement | Tile/pattern building | Place physical tiles or tokens to create configurations for points | Low-medium |
| Probability and risk management | Push-your-luck | Decide when to stop pressing for more rewards before losing everything | Medium |

**Hybrid preference handling:** Most groups express two preferences. When this happens, look for games that combine both mechanics (e.g., a group that likes both engine building and cooperative play should look for cooperative games with distinct player roles that each build separate asymmetric powers). Note that some mechanic pairings are rare -- social deduction plus heavy worker placement is unusual, and if a user asks for that combination, acknowledge the tension and recommend them separately.

**Conflict aversion flag:** If anyone in the group mentions disliking direct conflict, direct player elimination, or "take-that" mechanics (where one player's action directly removes another player's progress), flag this prominently. Recommend area control only if the conflict-averse player can be accommodated with a lower-conflict role or if cooperative games are prioritized.

### Step 4: Evaluate Specific Games with the Weighted Rubric

When the user has a shortlist of games they are considering -- either games they have heard of or games surfaced by their research -- apply the six-criterion weighted scoring rubric. Each criterion is scored 1-5, then multiplied by its weight percentage.

**Criterion definitions and scoring anchors:**

**Player Count Match (20% weight)**
- Score 5: The game's "best at" count exactly matches the group size
- Score 4: The group size is within 1 of the "best at" count
- Score 3: The game supports the group size but "best at" is 2+ players different
- Score 2: The game technically supports the count but reviews consistently note degraded experience
- Score 1: The game requires a house rule, team variant, or bot to reach the group's count
- Critical note: Never rely on the box's listed minimum-maximum range alone. Research the "best at" count from player reviews and designer notes. A game listed as "2-6 players" may be genuinely excellent at 4 and nearly unplayable at 6.

**Complexity Match (20% weight)**
- Score 5: The game's rated weight is within 0.3 of the target weight range
- Score 4: The game's weight is within 0.5 of the target range
- Score 3: The game's weight is 0.5-1.0 outside the target range but in the "lighter" direction
- Score 2: The game's weight is 0.5-1.0 heavier than the target range
- Score 1: The game's weight is 1.0+ heavier than the target range

**Playtime Match (15% weight)**
- Score 5: The game's actual play time (with teach time added) fits within 80% of available session time
- Score 4: The game fits with normal efficiency but not if rules take long to learn
- Score 3: The game is possible but leaves little buffer for a second game or late start
- Score 2: The game reliably runs over the session time by 20-30%
- Score 1: The game cannot reasonably be completed in the session
- Teach time formula: add 20 minutes for a weight 1.5-2.0 game, 30-45 minutes for 2.0-3.0, 45-60 minutes for 3.0+, on the first play only. Subsequent plays require no teach time adjustment.

**Mechanic Match (20% weight)**
- Score 5: The primary mechanic directly matches the group's stated social preference
- Score 4: A secondary mechanic matches the preference, or the primary is adjacent
- Score 3: The mechanic is neutral -- neither a match nor a conflict with preference
- Score 2: The mechanic is unlikely to appeal based on stated preferences
- Score 1: The mechanic directly conflicts with a stated preference (e.g., heavy direct conflict for a conflict-averse group)

**Theme Appeal (10% weight)**
- Score 5: The theme directly matches a stated group preference
- Score 3: No theme preference stated -- treat as neutral and apply to all games equally
- Score 1: The theme falls into a category the group has flagged as off-putting

**Replayability (15% weight)**
- Score 5: Variable setup with multiple distinct strategies, asymmetric player powers, or modular board/scenario system. Each play feels genuinely different.
- Score 4: High variance through card randomization or player interaction but same strategic arc
- Score 3: Moderate replay -- the game is fun multiple times but the experience converges after 5-6 plays
- Score 2: Low replay -- the optimal strategy becomes apparent quickly and subsequent plays feel repetitive
- Score 1: The game has a single "solved" path, no variable setup, or relies on a hidden-information reveal that loses impact on repeat plays

**Scoring interpretation:**
- 4.5 -- 5.0: Exceptional match. Strongly recommend.
- 4.0 -- 4.4: Strong match. Recommend.
- 3.5 -- 3.9: Good match with one notable weakness. Recommend with caveat.
- 3.0 -- 3.4: Acceptable. Worth considering if alternatives score lower.
- Below 3.0: Poor fit for this group. Do not recommend regardless of the game's general reputation.

### Step 5: Build or Audit the Collection Strategy

For users building a new collection or auditing an existing one, apply the five-slot collection framework. The goal is maximum variety coverage with minimum redundancy.

**The Five Essential Slots:**

**Slot 1 -- The Icebreaker (weight 1.0-1.5, 4-10 players, 10-25 min)**
Function: Start every game night, accommodate latecomers, onboard non-gamers with zero friction. This game must be explainable in under 3 minutes and require no prior game night experience. It should work at an irregularly attended large group (6-10 people) because not everyone arrives on time. Real-time games, trivia formats, and social word games fill this slot well. Pure party games work here -- the goal is fun and connection, not strategic depth.

**Slot 2 -- The Gateway (weight 1.5-2.5, 2-5 players, 30-60 min)**
Function: The first "real" board game you show new players. It must have a single clear primary mechanic, a compelling theme, and a satisfying arc from setup to end. This is the game that converts non-gamers into hobby gamers. It needs a strong first-play experience even before players understand the optimal strategy. The gateway game should have been reviewed as "easy to teach, hard to master" -- the learning curve is gentle at first, then reveals depth.

**Slot 3 -- The Main Event (weight 2.5-3.5, 2-4 players, 60-120 min)**
Function: The centerpiece of a dedicated game night. Assumes players have cleared their schedule and are committed to a full session. Should have substantial strategic decisions, high replayability, and a game arc that builds to a satisfying climax. This slot should align most closely with the group's identified primary mechanic preference.

**Slot 4 -- The Cooperative Option (weight 1.5-3.5, 2-5 players, variable)**
Function: An alternative for sessions where competitive games would create friction -- when someone is in a bad mood, when the group is unbalanced in skill, or when a conflict-averse player is present. A good cooperative game must have interesting decision space that prevents one dominant player from "quarterbacking" (taking over all decisions) -- look for hidden information among teammates, simultaneous decision-making, or asymmetric player roles.

**Slot 5 -- The Two-Player Game (weight 1.5-3.5, exactly 2 players, 30-75 min)**
Function: Serves the date night, sibling rivalry, or "only two of us showed up" scenario. This slot requires games specifically designed for two -- not games that merely support 2 players on the box. Games designed for exactly 2 players typically have a direct back-and-forth tempo, more information per player, and tighter mechanical tension than multi-player games scaled down. This distinction is significant enough that it should be flagged explicitly.

**Collection audit rule:** If the user already has games, count how many slots are unfilled and how many are duplicated. Recommend filling gaps before deepening any single slot. Three engine-building games is a gap, not a collection.

**Expansion timing:** Recommend the user play a game at least five times before purchasing its expansion. Expansions add content and complexity that can overwhelm a group still learning the base game, and they are frequently unnecessary for groups who have not yet exhausted the base experience.

### Step 6: Design the Game Night Flow

Game night sequencing matters as much as game selection. A poorly ordered night drags even good games down.

**The three-act game night structure:**

**Act 1 -- Arrival and warmup (first 15-30 minutes):**
Play a low-commitment icebreaker game while people arrive, get drinks, and settle. This game should not require everyone to be present from the start. Players can join mid-game without penalty. The game should be completable even if only half the group has arrived. Do not start the main game until the full group is assembled.

**Act 2 -- The main event (middle block):**
The centerpiece game. Teach the rules using the progressive disclosure method: explain only the objective (how to win), the turn structure (what you do on your turn), and any instant-failure conditions (how you lose immediately). Do not read the full rulebook. Do not pre-answer every possible question. Play the first round slowly, answer questions as they arise, and explicitly allow a "re-do" for the first turn of any player who made an obvious mistake due to misunderstanding -- this dramatically reduces frustration in new players. After the main event, debrief: ask what everyone liked and what felt confusing. This feedback directly informs the next purchase.

**Act 3 -- Wind-down filler (final 20-30 minutes):**
A light, quick game that provides closure without demanding full attention. People are tired, conversation has shifted to social, and not everyone wants to commit to another full game. Real-time games, push-your-luck card games, or light deduction games fill this slot. The wind-down filler should be completable even if one player needs to leave early.

**Analysis paralysis mitigation:**
- Pre-agree on a per-turn time limit before starting competitive games: 60 seconds for light games, 90 seconds for medium, 2 minutes for heavy
- Use a physical timer visible to all players rather than relying on social pressure
- For first plays, suspend turn timers entirely -- the goal is learning, not speed

**The "only game tonight" scenario:**
When the group has only one game and three hours, adjust: play the main game twice. The second play is faster (no teach time), more strategic (players know what to do), and often more satisfying. Many games reveal their true depth on the second play.

### Step 7: Provide Selection Research Methodology

Teach the user how to research and verify games independently, since specific titles can go out of print or be replaced by new editions.

**The four-source verification method:**
1. **Weight and mechanics:** Look up any candidate game and verify its complexity weight rating and primary mechanic category. The weight score from a large community database is based on thousands of plays and is a reliable predictor of how experienced the game feels.
2. **Player count reviews:** Search specifically for reviews mentioning your exact player count. Search strings like "game name + 5 players" or "game name + 2 player review" surface player-count-specific feedback that box descriptions never provide.
3. **First play experience:** Look for "first play" or "learning game" impressions specifically -- not veteran strategy reviews. A game can be excellent for experienced players while being a nightmare to teach.
4. **Teach time estimates:** Search for "how long does it take to teach [game name]" or "rulebook length [game name]." These estimates will not appear on the box and are critical for realistic session planning.

**Red flags to look for during research:**
- Reviews that mention "the first game always ends early because someone made an irreversible mistake" -- indicates a game with unforgiving early rules
- Editions confusion (multiple versions with incompatible rule differences) -- verify which edition is current before purchasing
- Out-of-print status with no reprint announced -- the secondary market price may be inflated beyond budget
- Rulebook quality complaints -- a well-designed game with a poorly written rulebook generates the same teach-night frustration as a poorly designed game
- "Better with the expansion" sentiment in most reviews -- this signals the base game may be incomplete, and the real cost is higher than the box price

---

## Output Format

Produce all seven sections below for every recommendation request. Do not omit sections even if information is incomplete -- use the stated defaults and note them explicitly.

```
## Board Game Selection Report

### Group Profile Summary
| Dimension           | Value                        | Confidence   |
|---------------------|------------------------------|--------------|
| Player count        | [number or range]            | [stated / assumed] |
| Age range           | [youngest -- oldest]         | [stated / assumed] |
| Experience level    | [descriptor + example games] | [stated / assumed] |
| Session time        | [hours available, adjusted]  | [stated / assumed] |
| Social preference   | [competitive / cooperative / mixed / party] | [stated / assumed] |
| Theme preference    | [specific themes or none]    | [stated / assumed] |
| Budget per game     | [range]                      | [stated / assumed] |

---

### Complexity Target
- **Recommended weight range:** [X.X -- X.X]
- **Ceiling weight (hard limit):** [X.X -- based on least experienced player]
- **Growth path:** After [N] game nights, step up to [X.X -- X.X]
- **Reasoning:** [2-3 sentences explaining how the group profile maps to this weight range]

---

### Mechanic Recommendations
| Group Preference / Social Style | Primary Mechanic Match | Secondary Mechanic (if applicable) | Conflict to Avoid |
|---------------------------------|------------------------|-------------------------------------|-------------------|
| [preference 1]                  | [mechanic]             | [mechanic or none]                  | [mechanic]        |
| [preference 2]                  | [mechanic]             | [mechanic or none]                  | [mechanic]        |

**Mechanic notes:** [Any important nuances -- e.g., "avoid direct conflict mechanics due to stated conflict aversion; semi-cooperative fits best"]

---

### Game Evaluation Rubric
*Score each candidate game 1-5 per criterion, then calculate the weighted total.*

| Criterion           | Weight | [Game Candidate A] | [Game Candidate B] | [Game Candidate C] |
|---------------------|--------|--------------------|--------------------|---------------------|
| Player count match  | 20%    | [1-5]             | [1-5]             | [1-5]              |
| Complexity match    | 20%    | [1-5]             | [1-5]             | [1-5]              |
| Playtime match      | 15%    | [1-5]             | [1-5]             | [1-5]              |
| Mechanic match      | 20%    | [1-5]             | [1-5]             | [1-5]              |
| Theme appeal        | 10%    | [1-5]             | [1-5]             | [1-5]              |
| Replayability       | 15%    | [1-5]             | [1-5]             | [1-5]              |
| **Weighted total**  |        | **[X.XX]**        | **[X.XX]**        | **[X.XX]**         |
| **Recommendation**  |        | [Yes/Consider/No] | [Yes/Consider/No] | [Yes/Consider/No]  |

**How to calculate:** Multiply each score by the weight decimal (e.g., a score of 4 at 20% = 0.80). Sum all six weighted scores for the total (max 5.00).

**Research checklist before scoring:**
- [ ] Verified weight rating from community database
- [ ] Confirmed "best at" player count from player reviews (not box text)
- [ ] Estimated actual playtime including first-play teach time
- [ ] Read at least one "first play" impression (not a veteran strategy review)
- [ ] Confirmed current edition and in-print status

---

### Collection Blueprint
| Slot              | Function                | Target Weight | Target Player Count | Target Playtime | Priority     |
|-------------------|-------------------------|---------------|---------------------|-----------------|--------------|
| 1. Icebreaker     | Party / arrival game    | 1.0 -- 1.5   | [group size]+       | 10-25 min       | Buy first    |
| 2. Gateway        | New player introduction | 1.5 -- 2.5   | 2 -- [group size]   | 30-60 min       | Buy first    |
| 3. Main event     | Dedicated game night    | 2.5 -- 3.5   | 2 -- [group size]   | 60-120 min      | Buy second   |
| 4. Cooperative    | Conflict-free option    | 1.5 -- 3.5   | 2 -- [group size]   | 45-90 min       | Buy second   |
| 5. Two-player     | Small group / date night| [matched]    | Exactly 2           | 30-75 min       | Buy when needed |

**Collection gap analysis (if user has existing games):**
| Existing Game | Fills Slot | Duplicate? | Recommendation |
|---------------|-----------|------------|----------------|
| [game name]   | [slot #]   | [yes/no]   | [keep / replace / supplement] |

---

### Game Night Schedule
| Time Block           | Game Slot              | Notes                                           |
|----------------------|------------------------|-------------------------------------------------|
| Arrival (0-30 min)   | Icebreaker             | Must work with partial group; join mid-game OK  |
| Main block           | Main event             | Start only when full group is assembled         |
| Wind-down (last 20-30 min) | Filler          | Light, completable if someone leaves early      |

**Teaching plan for main event:**
1. State the objective (how to win) in one sentence
2. Explain the turn structure (what you do each turn) in under 2 minutes
3. Name any instant-failure or must-avoid conditions
4. Play one demo round together before starting in earnest
5. Allow one re-do per player during the first round

---

### Research and Verification Checklist
- [ ] Search for "[game] + [player count] players" to find count-specific reviews
- [ ] Search for "[game] first play" to find teach experience impressions
- [ ] Verify current edition and confirm it is in print at target price
- [ ] Check rulebook quality reviews (important independent of game quality)
- [ ] Confirm expansion is NOT required to enjoy the base game
- [ ] Add teach time to stated playtime: [+X minutes based on weight]

---

### Personalized Next Steps
1. [Specific action 1 -- research or purchase priority]
2. [Specific action 2 -- game night scheduling or logistics]
3. [Specific action 3 -- feedback collection after first play]
4. [Specific action 4 -- collection growth plan after N plays]
```

---

## Rules

1. **Never use game complexity weight in isolation.** Weight must always be interpreted alongside the specific group profile. A weight of 2.5 is a challenging stretch for a non-gamer and a warm-up for a veteran. Always state the weight relative to the group's baseline, not as an absolute quality judgment.

2. **The "best at" player count is mandatory research.** A game's box range is the minimum information needed; the "best at" count is the required information. A recommendation made based solely on the box range is an incomplete recommendation. If the "best at" count cannot be determined, state this explicitly and flag it as a research action for the user.

3. **The least experienced player sets the weight ceiling.** There are no exceptions. A single non-gamer in a group of veterans caps the session at weight 1.5-2.0 for the main event unless the veteran players are willing to run a parallel simpler game. If the user resists this rule, explain that the cost of going too heavy is a ruined game night and a player who does not return; the cost of going too light is a successful game night with a less satisfied veteran -- clearly the better outcome.

4. **Playtime on the box is never the actual playtime.** Apply teach time additions: 20 minutes for weight 1.5-2.0, 30-45 minutes for weight 2.0-3.0, 45-60 minutes for weight 3.0-4.0, on the first play. State the adjusted playtime in the output, not the box estimate. For subsequent plays, box estimates are approximately accurate.

5. **Cooperative games must be evaluated for quarterbacking risk.** A cooperative game where one dominant player can see all information and direct all decisions degrades the experience for less experienced players. Before recommending a cooperative game, assess whether it has mechanisms that prevent dominant control: hidden information among teammates, simultaneous blind selection, asymmetric player roles with unique abilities, or real-time pressure that prevents deliberation. Name the quarterbacking risk if it exists.

6. **Collection variety before depth.** Never recommend a second game of the same primary mechanic until all five collection slots are filled. A collection with three engine-building games and no cooperative or two-player option is an unbalanced collection regardless of how good the individual games are.

7. **First play experience outweighs long-term depth for groups under 10 game nights.** A game with excellent long-term strategic depth but a brutal first-play experience is the wrong choice for new or casual groups. Recommend the game with the better first-play experience even if veteran reviewers rate the deeper game higher. Depth can be appreciated only after the player survives the first session.

8. **Never recommend a game that requires its expansion to be satisfying.** Some games are explicitly designed as incomplete without their first expansion (thin card pools, abbreviated content, a "season 1" structure). If reviews consistently describe the base game as "too short" or "not enough content," the real price is the base plus expansion. Account for this in budget calculations and flag it explicitly.

9. **Conflict aversion is an absolute filter, not a preference.** If any player has flagged a dislike of direct conflict (attacking other players, stealing resources, player elimination), all area control and heavy negotiation games must be filtered out of the recommendation. This is not a weight on the mechanic match criterion -- it is a disqualification. Semi-cooperative games with optional conflict are acceptable only if the conflict-averse player can opt out without disadvantage.

10. **Teach by playing, always.** The progressive disclosure teaching method (objective, turn structure, failure conditions, then play and answer as questions arise) must be recommended for every new game regardless of the group's experience level. Reading a rulebook aloud before the first play is the single most common cause of game night failure. If the user asks about teaching method, this is the only method to recommend for new players. For experienced groups learning a new heavy game, a "rules overview video" viewed independently before game night can replace or supplement the teach.

---

## Edge Cases

### Solo Play (Exactly 1 Player)

Solo gaming is a significant and growing segment of the hobby, not a niche exception. Many games have robust solo modes, and some games are designed exclusively for one player.

When recommending for solo play:
- Remove the weight ceiling constraint entirely. There is no weakest-link problem in solo play. The player can pause, re-read rules, and take as long as needed.
- Prioritize puzzle-style optimization games (the player solves a spatial or resource puzzle), campaign games with persistent narrative (decisions carry forward across sessions creating a personal story), and asymmetric challenge games (the player faces a game system that escalates difficulty).
- Evaluate replay value with higher weight (increase replayability criterion from 15% to 30%) since a solo player plays the same game far more often than group players who rotate titles.
- Distinguish between "designed solo mode" (purpose-built single-player experience with its own rules) and "automa solo mode" (a bot that simulates other players). Both are valid, but automa-based solos introduce artificial player behavior that can feel mechanical. Pure solo modes with no simulated opponents often provide cleaner experiences.
- Average session time for solo play should be estimated at 70% of the stated multiplayer time (no downtime between turns, no rules explanation needed on subsequent plays).

### Very Large Groups (8-12 Players)

Groups of 8 or more players create a structural problem: virtually no hobby strategy games are designed for this count. Most hobby games that list large player counts (like certain social deduction games) are specifically designed for large groups, but mainstream strategy games are not.

Approaches in priority order:
1. **Dedicated large-group games:** Some categories of games are explicitly designed for 6-12 players -- team-based trivia games, large-group social deduction games, party word games, and some negotiation games. These fill the full-group slot.
2. **Split tables:** For groups of 8+, split into two tables of 4 playing the same or different games simultaneously. This is often better for the experience than forcing 8 players into a game designed for 6. It requires owning two copies of a game or two compatible games at similar complexity.
3. **Team variants:** Some games for 4 players can be extended to 8 by pairing players into teams who share a single game position. This works best in real-time games, word games, and light strategy games where sharing decisions adds comedy rather than analysis paralysis. It does not work for games with complex hidden information.
4. Never recommend area control or heavy strategy games designed for 4 to a group of 8. The "it says up to 6 on the box" approach consistently produces very long turns, excessive downtime, and analysis paralysis compounded by committee decision-making.

### Mixed Adult-Child Groups (Ages 5-12 with Adults)

Children under age 8 need games that meet specific cognitive and physical design requirements:
- Rules must be learnable by demonstration without reading (visual turn structure, iconography)
- Winning should not be achievable through pure adult strategy advantage -- dexterity components, luck elements, or cooperative design levels the playing field
- Session length must stay under 20 minutes for under-6, under 30 minutes for ages 6-8
- Elimination mechanics (player loses and must wait) are inappropriate for young children -- they cannot regulate the frustration of watching others play
- Physical dexterity games (stacking, flicking, balancing) are the best equalizer because fine motor skills at the required task level are similar across ages 5-50

Children ages 8-12 are genuinely capable of weight 2.0-2.5 games with appropriate teaching. This age group often underestimates itself. Present the game as a challenge rather than a simplified version of an adult game.

Cooperative games are the best choice for all-ages groups: adults can support without undermining, younger players contribute meaningfully, and shared victory or defeat removes the sting of age-based skill differences.

### The "We Tried Board Games and Didn't Like It" Group

This is one of the most common and most recoverable scenarios. Almost every case of "we don't like board games" is a diagnosis problem, not a permanent preference.

Diagnostic questions to ask:
- What game did you play? (Determines if the problem was weight, mechanic, theme, or playtime)
- How long did the session take? (If over 2 hours with new players, the game was too long regardless of quality)
- Did anyone feel confused or lost? (Weight too high)
- Did anyone feel like they couldn't catch up once they fell behind? (Runaway leader problem or steep skill gap)
- Was there a lot of waiting between turns? (Player count too high for the game, or the game has too much downtime)
- Did anyone feel ganged up on? (Direct conflict too intense)

Map the answer to the corrective recommendation:
- Confusion and rules problems --> weight 1.5-2.0 with progressive disclosure teaching
- Too long --> games under 45 minutes until the group is comfortable
- Couldn't catch up --> cooperative games or games with catch-up mechanics (games where losing players receive benefits that help them recover)
- Too much waiting --> real-time games or games with simultaneous turns
- Felt targeted or ganged up on --> cooperative games or games with no direct conflict

Always validate the experience first: "That sounds like the wrong game for that group" rather than "board games are actually great if you try the right ones." Positioning it as a selection problem (which it is) rather than a group preference problem opens the door to a retry.

### Accessibility Constraints

Accessibility dimensions frequently go unstated but materially affect game selection:

**Color vision deficiency:** Many games distinguish game state using color coding. If any player has color blindness, verify that the game uses iconography, shape differentiation, or text in addition to color coding. Red-green is the most common deficiency. Games that rely on color-only distinction are a poor choice without verification.

**Fine motor limitations:** Games with many small tokens, cards that require frequent shuffling, or dexterity components (stacking, flicking) may be difficult for players with arthritis or tremors. Card holders, larger tokens, and apps that replace physical components can mitigate some issues. Flag this when a player is 70+.

**Cognitive processing speed:** Players with slower processing speed (whether from age, fatigue, or cognitive differences) are most affected by real-time games, games with many simultaneous considerations, and games with hidden action selection under time pressure. Recommend games with a clear, sequential turn structure and no time pressure for these groups.

**Language barriers:** If the group includes players who are not fluent in the game's printed language, prioritize games with minimal text on cards (look for "low language dependency" or "language-independent" designations). Abstract games and many tile-laying games have little to no necessary text.

### Budget Constraints Under $20 Per Game

Budget-constrained selection requires different criteria weighting: value per dollar becomes a primary filter, not an afterthought.

Highest value categories in order:
1. **Card games with small boxes ($10-18):** Many award-winning, well-designed card games retail in this range. Component count is lower but gameplay depth can be equivalent to $50+ games. Fast to teach, easy to transport.
2. **Print-and-play games ($0-10):** A large library of licensed and free print-and-play games exists, requiring only a printer and scissors. Quality ranges from excellent to poor -- look for games that have won physical print-and-play awards or have large online communities. The component cost is paper and printer ink.
3. **Used and secondhand market:** Popular hobby games from 3-7 years ago are frequently available used at 30-50% of retail. Verify that the used copy is the current edition, contains all components (use the publisher's component list), and has no water damage on cards.
4. **Abstract games ($15-30):** Pure abstract games (no theme, geometric pieces) tend to be inexpensive and have very high replay value due to their puzzle nature. They are appropriate for groups comfortable with abstract thinking and less reliant on thematic engagement.

Recommend buying two inexpensive games ($12-18 each) over one expensive game ($50) for new groups. Two games provide mechanic variety, a backup if one does not land, and more information about the group's preferences -- all valuable for a $36 total spend.

---

## Example

**User input:** "We have 5 people for a regular monthly game night -- me and four friends. Everyone is in their late 20s to early 30s. We've played Ticket to Ride and Catan and loved both. A couple of us have played Wingspan. One friend says she really hates games where other people can attack or steal from her. We usually have from 7pm to 10pm. We're not sure if we want competitive or cooperative -- both sound appealing. Theme-wise, no strong preference but nothing grim or war-heavy. Budget is around $40-55 per game."

---

**Output:**

## Board Game Selection Report

### Group Profile Summary
| Dimension | Value | Confidence |
|---|---|---|
| Player count | 5 (consistent) | Stated |
| Age range | Late 20s -- early 30s | Stated |
| Experience level | Gateway-to-mid-weight (Ticket to Ride, Catan, Wingspan exposure) | Stated |
| Session time | 7:00 PM -- 10:00 PM = 3 hours, adjusted to 2.5 hours usable | Stated |
| Social preference | Mixed -- open to competitive and cooperative; one player conflict-averse | Stated |
| Theme preference | No strong preference; avoid grim/war themes | Stated |
| Budget per game | $40 -- $55 | Stated |

**Critical flag:** One player explicitly dislikes games where other players can attack or steal from her. This eliminates all direct conflict and "take-that" mechanics from competitive game recommendations. Semi-cooperative (team vs. the game) and cooperative designs are strongly preferred for the main event. Competitive games in this collection must have indirect competition only -- racing to a goal, not attacking other players' progress.

---

### Complexity Target
- **Recommended weight range:** 2.0 -- 3.0
- **Ceiling weight (hard limit):** 3.0 (Wingspan is approximately 2.4-2.6; exceeding 3.0 significantly risks confusion on first play)
- **Growth path:** After 6-8 game nights together, this group is well-positioned to step up to 3.0-3.5 if interest holds
- **Reasoning:** This group has moved beyond pure gateway games (Catan, Ticket to Ride are ~2.0-2.2) and has exposure to Wingspan (~2.4). They have appetite for moderate complexity. Starting at 2.5 captures that experience level while staying accessible. The conflict-averse player is not identified as a less experienced player, so weight is determined by game experience, not social preference. However, the indirect-conflict-only rule must be applied regardless of weight.

---

### Mechanic Recommendations

| Group Preference / Social Style | Primary Mechanic Match | Secondary Mechanic | Conflict to Avoid |
|---|---|---|---|
| Open to teamwork vs. the game | Cooperative with asymmetric roles | Semi-cooperative (team + traitor) | Player elimination; resource stealing; direct attack |
| Strategic building (liked Catan, Wingspan) | Engine building | Set collection | Take-that card effects |
| Competitive but indirect | Route/network building | Area majority (no direct displacement) | Direct conflict; area control with combat |

**Mechanic notes:** The conflict-averse player's constraint rules out area control with combat, trading games with mandatory resource theft, and any "take-that" card mechanics. Indirect competition (racing to complete goals, optimizing your own engine faster than others) is acceptable. The best mechanic targets are engine building (builds personal systems without attacking others), route building (familiar from Ticket to Ride), and cooperative games where all five players win or lose together. Avoid negotiation games -- the social pressure to negotiate can feel coercive for conflict-averse players.

---

### Game Evaluation Rubric

*This rubric is populated with three illustrative game profiles matching the search criteria. The user should verify all data before purchasing.*

| Criterion | Weight | Engine-Builder (weight ~2.4, 2-5p, 60-90 min, indirect competition) | Cooperative Adventure (weight ~2.5, 1-5p, 60-90 min) | Set Collection Race (weight ~2.0, 2-5p, 45-60 min) |
|---|---|---|---|---|
| Player count match | 20% | 5 / 5 (designed for up to 5, reviews positive at 5) | 4 / 5 (supports 5; some reviews prefer 3-4) | 5 / 5 (plays well at all counts to 5) |
| Complexity match | 20% | 5 / 5 (weight ~2.4, directly in target range 2.0-3.0) | 5 / 5 (weight ~2.5, in range) | 4 / 5 (weight ~2.0, slightly light but accessible) |
| Playtime match | 15% | 4 / 5 (60-90 min stated; first play ~105-120 min -- fits within 2.5 hr) | 4 / 5 (75-90 min stated; first play ~110 min -- fits tightly) | 5 / 5 (45-60 min stated; first play ~75 min -- leaves room for two games) |
| Mechanic match | 20% | 5 / 5 (engine building, indirect competition -- matches group profile exactly) | 5 / 5 (cooperative with roles -- eliminates conflict, satisfies teamwork preference) | 4 / 5 (set collection race -- indirect, familiar feel to Ticket to Ride) |
| Theme appeal | 10% | 3 / 5 (not grim; neutral theme -- no strong match but no conflict) | 4 / 5 (adventure theme, positive tone, no war or horror) | 3 / 5 (neutral/abstract theme) |
| Replayability | 15% | 5 / 5 (variable card market, multiple engine strategies, high variance) | 4 / 5 (scenario-based or modular, different difficulty levels) | 3 / 5 (moderate replay; strategy converges after 8-10 plays) |
| **Weighted total** | | **4.65** | **4.45** | **4.10** |
| **Recommendation** | | **Yes -- strong fit** | **Yes -- strong fit** | **Yes -- good backup** |

**Weighted calculation example (Engine-Builder):**
- Player count: 5 × 0.20 = 1.00
- Complexity: 5 × 0.20 = 1.00
- Playtime: 4 × 0.15 = 0.60
- Mechanic: 5 × 0.20 = 1.00
- Theme: 3 × 0.10 = 0.30
- Replayability: 5 × 0.15 = 0.75
- **Total: 4.65**

**Research checklist before purchasing:**
- [ ] Verify weight rating from community database for each candidate
- [ ] Search "game name + 5 players" to confirm experience at that count
- [ ] Search "game name + first play" to confirm teachability
- [ ] Confirm in-print status and current edition at target price ($40-55)
- [ ] Confirm no expansion is required to have a complete experience
- [ ] Check rulebook quality reviews separately from gameplay reviews

---

### Collection Blueprint

| Slot | Function | Target Weight | Target Players | Target Playtime | Priority |
|---|---|---|---|---|---|
| 1. Icebreaker | Arrival / warm-up | 1.0 -- 1.5 | 4 -- 8+ | 15-25 min | Buy first |
| 2. Gateway | Already covered (Ticket to Ride, Catan in hand) | -- | -- | -- | Already owned |
| 3. Main event (indirect competitive) | Centerpiece / engine builder | 2.0 -- 3.0 | 3 -- 5 | 60-90 min | Buy first |
| 4. Cooperative | Conflict-free option | 2.0 -- 3.0 | 2 -- 5 | 60-90 min | Buy first |
| 5. Two-player | Date night / small group | 2.0 -- 3.0 | Exactly 2 | 30-60 min | Buy when needed |

**Collection gap analysis:**
| Existing Game | Fills Slot | Notes |
|---|---|---|
| Ticket to Ride | Gateway (Slot 2) | Already owned -- route-building, minimal direct conflict -- excellent for conflict-averse player |
| Catan | Gateway (Slot 2) -- partial | Trading mechanic has some conflict; may not work when the conflict-averse player is in a sensitive mood |
| Wingspan | Main event (Slot 3) | Weight ~2.4, engine building, indirect competition -- already owned and well-matched |

**Key insight from gap analysis:** The group already owns a strong main event game (Wingspan). The priority purchases should be an icebreaker (Slot 1) and a cooperative game (Slot 4). The group does not need a second indirect competitive game until they exhaust Wingspan's replay value (~15-20 plays).

**Revised purchase priority:**
1. Icebreaker game ($15-25) -- fills a slot not yet owned, solves the arrival period problem
2. Cooperative main event ($40-55) -- fills Slot 4, provides the conflict-free evening option
3. Two-player game ($30-45) -- fills Slot 5 for smaller gatherings

---

### Game Night Schedule

| Time Block | Game Slot | Notes |
|---|---|---|
| 7:00 -- 7:25 PM | Icebreaker | Works with 3+ players; latecomers join in progress; no elimination |
| 7:25 -- 7:35 PM | Rules teach for main game | Progressive disclosure method (see teaching plan below) |
| 7:35 -- 9:30 PM | Main event | Alternate monthly: cooperative one month, Wingspan the next |
| 9:30 -- 10:00 PM | Wind-down filler or discussion | Light card game; or if the main event ran to 9:45, skip and debrief |

**Teaching plan for new main event game:**
1. "The goal is to [win condition in one sentence -- e.g., 'have the most points at the end of 7 rounds']"
2. "On your turn you do one of these [2-4 options] -- here's what each one does" (2 minutes maximum)
3. "The only thing that can end your game early is [instant failure condition, if any]"
4. Play a demo round together -- all hands face-up, decisions discussed aloud
5. Any player who makes
