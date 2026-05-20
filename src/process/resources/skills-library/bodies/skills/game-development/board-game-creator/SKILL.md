---
name: board-game-creator
description: |
  Complete board game design guide covering mechanic selection (worker placement, deck building, area control, etc.), theme integration, prototype creation, playtesting methodology, balance iteration, rulebook writing, art direction, Kickstarter launch strategy, and publisher submission process. Use when the user asks about board game creator or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "game-design design guide board-games"
  category: "game-development"
  subcategory: "game-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Board Game Creator

## When to Use

**Use this skill when:**
- The user wants to design a board game from concept through prototype
- The user needs help selecting game mechanics (worker placement, deck building, area control, tile placement, drafting)
- The user is preparing a board game for playtesting or Kickstarter launch
- The user needs guidance on rulebook writing, component design, or art direction
- The user wants to submit a board game to publishers or plan a self-publishing campaign

**Do NOT use this skill when:**
- The user is designing a video game (use video-game-designer instead)
- The user needs help with tabletop RPG campaigns or rule systems (use tabletop-rpg-designer instead)
- The user wants to design puzzles for escape rooms or puzzle games (use game-puzzle-designer instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to board game creator.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on board game creator
- User asks about board game creator best practices or techniques
- User wants a structured approach to board game creator

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of board game creator

## Questions to Ask First

Before designing any board game, clarify:

1. **What experience do you want players to have?** (Competitive tension, cooperative problem-solving, social deduction, strategic planning, creative expression)
2. **How many players?** (2-player games are very different from 5+ player games)
3. **What is the target play time?** (15 minutes, 1 hour, 3 hours -- this shapes every design choice)
4. **What is the complexity target?** (Gateway/family, medium weight, heavy strategy)
5. **Who is the target audience?** (Families, hobbyist gamers, party groups, kids, couples)
6. **Do you have a theme or mechanic starting point?** (Theme-first vs. mechanic-first design)
7. **What is your goal?** (Personal project, sell to publisher, self-publish via Kickstarter, commercial release)
8. **What is your design experience level?** (First game, experienced designer, published)

## Core Mechanics Selection

### Major Board Game Mechanics

```
WORKER PLACEMENT:
  Players take turns placing tokens on action spaces to claim those actions.
  Limited spaces create competition and strategic tension.
  Examples: Agricola, Lords of Waterdeep, Viticulture
  Best for: Strategic resource management, 2-5 players
  Strength: Inherent player interaction through blocking
  Challenge: Can feel punishing for new players, AP-prone

DECK BUILDING:
  Players start with identical weak decks and purchase cards to
  improve their deck during play. Your deck IS your engine.
  Examples: Dominion, Star Realms, Clank!
  Best for: Engine building, variable strategy, 2-4 players
  Strength: Every game feels different, satisfying combo creation
  Challenge: Card pool design is critical and hard to balance

AREA CONTROL / AREA MAJORITY:
  Players compete for dominance in regions of a shared map.
  Scoring based on who has the most presence in each area.
  Examples: El Grande, Blood Rage, Twilight Imperium
  Best for: Competitive territorial strategy, 3-5 players
  Strength: Highly interactive, visible conflict
  Challenge: Kingmaking, player elimination risk, long playtime

TILE PLACEMENT:
  Players place tiles to build a shared or personal landscape.
  Scoring based on tile arrangement and adjacency.
  Examples: Carcassonne, Azul, Cascadia
  Best for: Spatial reasoning, accessible strategy, 2-4 players
  Strength: Visually appealing, easy to learn
  Challenge: Can lack direct interaction

DRAFTING:
  Players select cards/resources from a shared pool, taking turns
  or passing hands (like card drafting in 7 Wonders).
  Examples: 7 Wonders, Sushi Go!, Blood Rage (draft phase)
  Best for: Quick decision-making, 3-7 players
  Strength: Meaningful choices every turn, scales well
  Challenge: Requires knowledge of the card pool to play well

ENGINE BUILDING:
  Players construct a personal system (engine) that produces
  increasingly powerful effects over time.
  Examples: Terraforming Mars, Splendor, Wingspan
  Best for: Strategic planning, satisfying growth curves
  Strength: Deeply satisfying when your engine "fires"
  Challenge: Rich-get-richer dynamics, runaway leader problem

SOCIAL DEDUCTION:
  Some players have hidden roles or agendas. Players must deduce
  who is who through discussion, voting, and action observation.
  Examples: Werewolf, The Resistance, Secret Hitler
  Best for: Large groups, parties, 5-10 players
  Strength: Intense social interaction, high drama
  Challenge: Player elimination, quarterbacking, requires right group

COOPERATIVE:
  All players work together against the game system.
  Examples: Pandemic, Spirit Island, Gloomhaven
  Best for: Collaborative groups, couples, families
  Strength: Shared experience, no hurt feelings from losing
  Challenge: Quarterbacking (one player dominates decisions)

ROLL-AND-WRITE:
  Players roll dice (or flip cards) and fill in personal sheets.
  Everyone uses the same input but makes different decisions.
  Examples: Yahtzee, Welcome To..., Cartographers
  Best for: Any player count, quick play, accessible
  Strength: Minimal component cost, scales infinitely
  Challenge: Can feel like a solo activity

AUCTION / BIDDING:
  Players bid resources to win items, rights, or advantages.
  Examples: Ra, Power Grid, Modern Art
  Best for: Player interaction, valuation skills, 3-5 players
  Strength: Deep player interaction, emergent pricing
  Challenge: New players can't evaluate items properly
```

### Choosing Your Mechanic

```
DECISION FRAMEWORK:

  Player count target:
    2 players -> Direct conflict, asymmetric, dueling
    3-5 players -> Most mechanics work; avoid player elimination
    6+ players -> Social deduction, party, simultaneous action

  Complexity target:
    Light (family/gateway) -> Tile placement, roll-and-write, drafting
    Medium -> Deck building, worker placement, engine building
    Heavy -> Area control + engine building, economic simulation

  Interaction level:
    High interaction -> Area control, social deduction, auction
    Medium interaction -> Worker placement, drafting
    Low interaction -> Engine building, roll-and-write, tile placement

  Design experience:
    First game -> Choose ONE core mechanic. Resist adding more.
    Experienced -> Combine 2-3 mechanics intentionally.

CRITICAL RULE:
  Every mechanic must serve the player experience.
  If a mechanic exists only because other games have it,
  cut it. Simplify until every rule earns its place.
```

## Theme Integration

```
THEME-FIRST vs. MECHANIC-FIRST:

THEME-FIRST:
  Start with a setting or story, then find mechanics that make
  players FEEL like they're in that world.
  "I want a game about building a space colony."
  -> What decisions does a colony builder make? (resource allocation,
     expansion, risk management) -> These become mechanics

MECHANIC-FIRST:
  Start with an interesting system, then wrap it in a theme
  that makes the mechanics intuitive and memorable.
  "I have an interesting resource-conversion engine."
  -> What real-world activity involves converting resources?
     (alchemy, cooking, manufacturing) -> Theme applied

THEME-MECHANIC FIT:
  The BEST games have theme and mechanic reinforcing each other:
  - Pandemic: Treating diseases feels like fighting a pandemic
  - Ticket to Ride: Building train routes feels like planning trips
  - Wingspan: Collecting birds feels like birdwatching

  POOR FIT: When mechanics contradict the theme
  - A cooperation-themed game with highly competitive mechanics
  - A war game where the most peaceful player wins

INTEGRATION TECHNIQUES:
  - Name mechanics after thematic actions (not "Resource A" but "Wood")
  - Make scoring feel thematically justified (why these points?)
  - Card text should evoke the theme, not just state rules
  - Art and components should reinforce the world
  - Even the turn structure should feel thematic
```

## Prototype Creation

```
THE PROTOTYPING PHILOSOPHY:
  Build the ugliest possible version that lets you test the
  core experience. You will throw this away and rebuild many times.

MATERIALS FOR FIRST PROTOTYPE:
  - Index cards (for cards of any type)
  - Blank dice or dice stickers
  - Wooden cubes from a craft store (meeples and resources)
  - Grid paper (for boards)
  - Poker chips (for currency)
  - Sharpie markers
  - Zip-lock bags for component organization
  - Cheap card sleeves with blank cards

DIGITAL PROTOTYPING TOOLS:
  - Tabletop Simulator (Steam): Digital playtesting, remote players
  - Tabletopia: Browser-based digital board game platform
  - nanDECK / Component.Studio: Card layout and printing
  - Google Slides/Sheets: Quick card and board layouts
  - Inkscape/GIMP: Free graphics tools for component design

PROTOTYPING PROCESS:
  Version 0: Paper and markers. Test the core loop ONLY.
             Does the fundamental decision-making work?
  Version 1: Printed cards and boards. Add secondary mechanics.
             Is the game interesting for 30+ minutes?
  Version 2: Refined components. Art placeholders.
             Is the game balanced and complete?
  Version 3: Near-final art and components.
             Does it present well to strangers?

CRITICAL RULE:
  Don't invest in art or production quality until the game
  is fun with ugly prototypes. Art can't save bad design.
```

## Playtesting Methodology

```
FOUR STAGES OF PLAYTESTING:

STAGE 1: SOLO TESTING
  Play both/all sides yourself. Test for:
  - Does the core loop function mechanically?
  - Do choices feel meaningful?
  - Is anything broken or degenerate?
  - Rough game length estimate

STAGE 2: FRIENDLY TESTING
  Play with friends and family who will be honest. Test for:
  - Is the game understandable from verbal rules?
  - Where do players get confused?
  - Is anyone bored or disengaged?
  - What strategies emerge?
  - Are there dominant strategies?

STAGE 3: BLIND TESTING
  Give the game to people who learn ONLY from written rules,
  without you present. Test for:
  - Can the rules teach the game without you?
  - What rules are misunderstood?
  - What questions come up that the rules don't answer?
  - Does the game work without designer intervention?

STAGE 4: EXTERNAL TESTING
  Test with your target audience (not just gamers who will
  play anything). Test for:
  - Does the target audience enjoy it?
  - Would they play again?
  - Would they recommend it?
  - How does it compare to similar games they play?

PLAYTEST DATA COLLECTION:
  Track quantitatively:
  - Game length per player count
  - Score distribution (is there always a runaway leader?)
  - Win rates by starting position/player order
  - Which strategies win most often
  - Where in the game players report being most/least engaged

PLAYTEST QUESTIONS:
  - "What was your favorite moment?"
  - "What was your least favorite moment?"
  - "Was there ever a point where you didn't know what to do?"
  - "Did you feel like your decisions mattered?"
  - "Would you play again? Why or why not?"
  - "On a scale of 1-10, how would you rate the experience?"
```

## Balance Iteration

```
BALANCING FRAMEWORK:

MATHEMATICAL BALANCE:
  - Calculate expected value of each strategy
  - Ensure no strategy dominates all others
  - Check that first-player advantage is minimal
  - Verify that the game cannot end too quickly or drag too long
  - Use spreadsheets to model resource economies

EXPERIENTIAL BALANCE:
  - Every player should feel like they have a chance to win
  - The gap between winning and losing shouldn't be humiliating
  - Comeback mechanics prevent hopeless situations
  - The game should feel close more often than not

BALANCE LEVERS:
  - Cost: Increase cost of overpowered options
  - Availability: Make powerful things rare
  - Timing: Delay powerful options to later in the game
  - Counters: Ensure every strategy has a counter-strategy
  - Opportunity cost: Powerful options should require giving up something

COMMON BALANCE PROBLEMS:
  First-player advantage: Add catch-up mechanisms or compensating resources
  Runaway leader: Add negative feedback loops (leader becomes target)
  Kingmaking: Reduce ability for losing players to determine winner
  Analysis paralysis: Limit options per turn, add time pressure
  Too long: Reduce total resources, add game-ending triggers
  Too short: Add more content between game start and end triggers
```

## Rulebook Writing

```
RULEBOOK STRUCTURE:

1. OVERVIEW AND GOAL (half page)
   What is this game? What are you trying to do?
   One paragraph that captures the essence.

2. COMPONENTS LIST (half page)
   Every component in the box with quantities.
   Include an image showing all components.

3. SETUP (1 page, with diagram)
   Step-by-step with a visual showing the table layout.
   Clear enough that someone can set up without reading further.

4. GAME FLOW / TURN STRUCTURE (main section)
   How a turn works, step by step.
   Use numbered lists, not paragraphs.
   Include examples for any non-obvious rules.

5. DETAILED RULES (subsections per mechanic)
   Card anatomy, resource descriptions, special actions.
   Edge cases and clarifications.

6. END OF GAME AND SCORING
   What triggers the end?
   How do you calculate the winner?
   Tiebreaker rules.

7. QUICK REFERENCE
   Turn summary on the back page or a separate card.
   Players should rarely need to reference the full rules
   after the first play.

RULEBOOK WRITING PRINCIPLES:
  - Define terms before using them
  - Use consistent terminology throughout (never "tokens" in one
    place and "markers" in another for the same thing)
  - Include visual examples for complex rules
  - Bold or highlight key terms on first use
  - Use the same structure as gameplay order
  - Have someone who has never played read the rules and
    try to play. Every question they ask = a rules failure
  - Keep it as short as possible. Shorter rules = more plays
```

## Art Direction

```
ART DIRECTION FOR BOARD GAMES:

STYLE DECISIONS:
  - Realistic vs. stylized vs. abstract
  - Color palette (3-5 core colors that ensure readability)
  - Must work at table distance (not just screen distance)
  - Must be clear when viewed from multiple angles
  - Iconography should be readable at small sizes

COMMISSIONING ART:
  - Create a mood board / art bible before hiring artists
  - Hire ONE artist for the whole project (consistency)
  - Budget: $50-200 per card illustration, $500-2000 for the board
  - Provide clear briefs: subject, mood, composition, technical specs
  - Art is typically the largest single expense for self-publishing

GRAPHIC DESIGN (Often more important than illustration):
  - Card layouts must be instantly readable
  - Color-code player pieces and associated elements
  - Use icons alongside text (accessibility)
  - Leave whitespace -- crowded components are hard to read
  - Test at actual print size (not just on screen)
  - Consider color-blind accessibility (use shapes + colors, not color alone)

COMPONENT DESIGN:
  - Physical components add perceived value
  - Custom meeples, metal coins, and unique tokens elevate the experience
  - Balance component quality against manufacturing cost
  - Component quality affects first impression and unboxing experience
```

## Publishing Paths

### Kickstarter Self-Publishing

```
PRE-CAMPAIGN (3-6 months before launch):
  1. Build audience: social media, BGG page, newsletter, preview copies to reviewers
  2. Get manufacturing quotes (typically from Chinese manufacturers:
     Panda, LongPack, Boda, WinGo)
  3. Determine pricing: Manufacturing + shipping + platform fees + margin
  4. Create campaign page: video, images, stretch goals, reward tiers
  5. Send preview copies to board game content creators (3 months early)
  6. Build a mailing list (aim for 500+ before launch)

CAMPAIGN DESIGN:
  Core pledge: The game at a competitive price ($30-60 for most games)
  Deluxe pledge: Upgraded components for premium price
  Add-ons: Expansions, playmats, sleeves
  Stretch goals: Pre-planned improvements that unlock with funding
  Early bird: Small discount for first 48 hours (controversial but effective)

POST-CAMPAIGN:
  - Pledge manager (BackerKit, Gamefound) for late pledges and shipping
  - Finalize art and files for manufacturing
  - Manufacturing timeline: 3-6 months
  - Shipping: Freight from manufacturer to fulfillment centers
  - Fulfillment: Use regional fulfillment partners to reduce shipping costs

REALISTIC EXPECTATIONS:
  - Average successful board game Kickstarter raises $20-50K
  - Expect 20-30% to go to manufacturing, 15-20% to shipping,
    10% to platform fees, leaving 30-40% margin
  - Timeline from campaign to delivery: 8-18 months
```

### Publisher Submission

```
WHAT PUBLISHERS WANT:
  1. A game that fills a gap in their catalog
  2. A game that playtests well with their target audience
  3. A designer who is professional and responsive
  4. A game that can be manufactured at their target price point
  5. A proven game (playtested extensively)

SUBMISSION PACKAGE:
  - Sell sheet (1 page): Game name, player count, play time,
    age range, 3-sentence pitch, 1-2 photos, your contact info
  - Rules document (formatted, clear, proofread)
  - Prototype (if requested -- many evaluate from sell sheet first)
  - Playtest data summary

WHERE TO SUBMIT:
  - Publisher websites (check submission guidelines)
  - Conventions: Origins, Gen Con, Essen, UKGE, Spiel
  - Speed dating events at conventions
  - Publisher-designer matchmaking services

TYPICAL PUBLISHING DEAL:
  - Advance: $0-5,000 (sometimes none)
  - Royalties: 3-8% of wholesale (not retail)
  - Publisher handles manufacturing, distribution, marketing
  - Timeline: 1-3 years from signing to shelf
  - Designer retains design credit and IP (negotiate this)

SUBMISSION ETIQUETTE:
  - Follow submission guidelines exactly
  - Don't send unsolicited prototypes
  - Be patient (months for a response is normal)
  - Submit to multiple publishers simultaneously (but disclose)
  - Take feedback gracefully, even from rejection
```

## Practice Exercises

### Exercise 1: Mechanic Mashup
Pick two random mechanics from the list above. Design a game that combines them meaningfully. Can you create something where both mechanics are essential?

### Exercise 2: The 10-Minute Prototype
Set a timer for 10 minutes. Using only paper, markers, and coins, create a playable 2-player game prototype. Play it once. Identify the one change that would improve it most.

### Exercise 3: Rulebook Rewrite
Take the rules from a game you know well. Rewrite them from scratch without looking at the original. Compare your version to the original. What did each version do better?

### Exercise 4: Theme Swap
Take a game you like. Completely re-theme it. Does the new theme fit the mechanics better or worse? What does this teach you about theme-mechanic integration?

### Exercise 5: Balance Breaker
Take a game in development and deliberately try to break it. Find the most overpowered strategy. Then design a fix that addresses the imbalance without reducing the strategy's appeal.

### Exercise 6: Blind Playtest
Give your prototype and rules to someone who has never seen the game. Leave the room entirely. Observe (or ask about) the experience afterward. Every moment of confusion is a design opportunity.


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Board Game Creator deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with board game creator for a mid-size project."

**Output:** A complete board game creator framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
