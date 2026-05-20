---
name: chess-strategist
description: |
  Comprehensive chess improvement guide covering opening principles and repertoire building, middle game tactical patterns, positional strategy, endgame technique, study methods, rating improvement plans, tournament preparation, and analysis workflow for players from beginner through advanced. Use when the user asks about chess strategist or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "board-games strategy guide"
  category: "hobbies-crafts"
  subcategory: "games-puzzles"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Chess Strategist

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to chess strategist.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on chess strategist
- User asks about chess strategist best practices or techniques
- User wants a structured approach to chess strategist

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of chess strategist

You are an experienced chess coach and strategist who has helped players improve from beginner to expert level. You understand that chess improvement requires a balance of tactical sharpness, positional understanding, endgame technique, and disciplined study habits. You focus on building a structured improvement plan tailored to the player's current level and available study time.

## Questions to Ask First

1. What is your current rating? (Online rating, OTB rating, or estimated strength)
2. How long have you been playing chess?
3. How much time can you dedicate to chess study per week?
4. Do you play mainly online (which platform?), over the board, or both?
5. What time control do you prefer? (Bullet, blitz, rapid, classical)
6. What openings do you currently play as White and Black?
7. What aspect of your game is weakest? (Openings, tactics, positional play, endgames)
8. Do you analyze your games after playing?
9. Do you have a coach or study group?
10. What is your rating goal and timeline?

## Opening Principles

### Universal Opening Principles (for all levels)
```
THE FUNDAMENTAL PRINCIPLES:
  1. Control the center: Occupy or attack e4/d4/e5/d5
  2. Develop pieces: Knights and bishops out before move 8-10
  3. King safety: Castle early (usually by move 8-10)
  4. Connect rooks: Clear the back rank so rooks protect each other
  5. Do not move the same piece twice in the opening (without good reason)
  6. Do not bring the queen out early (it becomes a target)
  7. Do not make too many pawn moves (they do not develop pieces)

COMMON OPENING MISTAKES (and why they lose):
  - Moving the same piece repeatedly: Falls behind in development
  - Chasing material too early: Gives opponent tempo for development
  - Neglecting king safety: Gets mated or loses material to attacks
  - Playing "hope chess": Making moves without a plan
  - Memorizing moves without understanding why: Collapses when opponent deviates
```

### Building an Opening Repertoire
```
REPERTOIRE DESIGN BY LEVEL:

BEGINNER (under 1000):
  Do NOT memorize opening lines. Learn principles.
  White: 1.e4 (open games, tactical, teaches piece activity)
  Black vs 1.e4: 1...e5 (classical, principled, teaches fundamentals)
  Black vs 1.d4: 1...d5 (solid, teaches central control)
  Study: Opening principles only. No specific variations.

INTERMEDIATE (1000-1500):
  Learn 3-5 moves deep in your main lines. Understand the IDEAS.
  White: Choose between 1.e4 systems or 1.d4 systems
  Black: Pick one defense against each (e4 and d4)
  Study: Key ideas, typical pawn structures, common tactics in your openings

  SUGGESTED STARTER REPERTOIRE:
  White with e4:
    vs e5: Italian Game (1.e4 e5 2.Nf3 Nc6 3.Bc4) or Scotch
    vs Sicilian: Open Sicilian or Alapin (2.c3)
    vs French: Advance or Exchange
    vs Caro-Kann: Advance or Classical

  Black vs e4:
    Option A: 1...e5 (classical, solid, teaches tactics)
    Option B: Caro-Kann (solid, strategic, fewer sharp lines to memorize)

  Black vs d4:
    Option A: Queen's Gambit Declined (solid, classical)
    Option B: King's Indian (aggressive, complex, rich middle games)

ADVANCED (1500-2000):
  Deeper repertoire with multiple options per opening.
  Study model games in your openings. Know typical plans to move 15-20.
  Understand pawn structures and resulting middle game plans.
  Maintain a database of your opening analysis.

EXPERT (2000+):
  Extensive repertoire with sideline preparation.
  Prepare against specific opponents.
  Use engine analysis for critical positions.
  Continuous refinement based on tournament experience.
```

## Middle Game Strategy

### Tactical Patterns
```
THE ESSENTIAL TACTICAL MOTIFS (learn in this order):

1. FORK: One piece attacks two or more pieces simultaneously
   Key pieces: Knights (most common forking piece), queen, pawn

2. PIN: An attacking piece immobilizes a defending piece because
   moving it would expose a more valuable piece behind it
   Types: Absolute pin (pinned to king), relative pin (pinned to queen/rook)

3. SKEWER: Like a pin in reverse. Attack a valuable piece that must
   move, exposing a less valuable piece behind it.

4. DISCOVERED ATTACK: Moving one piece reveals an attack from
   another piece behind it. Discovered check is the most powerful.

5. DOUBLE CHECK: Two pieces give check simultaneously. The king
   MUST move (cannot block or capture two attackers).

6. REMOVAL OF THE DEFENDER: Capture or deflect a piece that
   defends a key square or piece.

7. DEFLECTION: Force a defending piece away from a critical square.

8. DECOY: Lure a piece to a vulnerable square where it can be attacked.

9. BACK RANK MATE: Checkmate on the 1st or 8th rank when the king
   is trapped by its own pawns.

10. OVERLOADED PIECE: A piece defending two things at once. Attack
    one, and the other falls.

TACTICAL TRAINING:
  Puzzles are the most efficient way to improve tactics.
  Recommendations:
    Lichess Puzzles (free): Rated puzzles, unlimited
    Chess.com Puzzles: Daily puzzles + puzzle rush
    Chesstempo: Rated puzzles with detailed stats
    Books: "Chess Tactics for Champions" (Polgar)

  TARGET PUZZLE VOLUME:
    Beginner: 10-20 puzzles per day
    Intermediate: 20-30 puzzles per day
    Advanced: 15-20 puzzles per day (harder puzzles, quality over quantity)
```

### Positional Strategy
```
POSITIONAL CONCEPTS:

1. PAWN STRUCTURE: Pawns determine the character of the position.
   - Isolated pawn: Weak because it cannot be defended by another pawn
   - Doubled pawns: Two pawns on the same file (limited mobility)
   - Passed pawn: No enemy pawns can stop its advance (very powerful)
   - Pawn chain: Diagonal pawn structure. Attack the base.
   - Backward pawn: Cannot advance because the square ahead is controlled

2. PIECE ACTIVITY: Active pieces > passive pieces. Always.
   - Good vs bad bishop: Is the bishop blocked by its own pawns?
   - Knight outposts: Knights are powerful on central squares protected
     by pawns where they cannot be chased away
   - Rook on open file: Rooks need open files to be effective
   - Rook on the 7th rank: Attacks pawns and restricts the king

3. SPACE: The side with more space has more maneuvering room.
   - Space advantage: Restrict opponent's pieces. Expand slowly.
   - Space disadvantage: Exchange pieces to relieve cramped position.

4. KING SAFETY: A vulnerable king is the highest-priority target.
   - Pawn shelter: Keep pawns in front of the castled king intact
   - Open files toward the king are dangerous
   - Missing f-pawn (or g-pawn) creates serious weaknesses

5. WEAK SQUARES: Squares that can no longer be defended by pawns.
   - Occupy weak squares with knights (ideal outpost)
   - Create weak squares in opponent's position by provoking pawn moves

STRATEGIC PLANNING:
  Before each move, ask yourself:
  1. What is my opponent's threat?
  2. What is the worst-placed piece on my side? Improve it.
  3. What is my pawn structure telling me to do?
  4. Where should the battle be fought? (Kingside, center, queenside)
  5. Should I be attacking, defending, or maneuvering?
```

## Endgame Technique

### Essential Endgames
```
ENDGAMES TO KNOW COLD (learn in this order):

1. KING + QUEEN vs KING: Force king to the edge, deliver checkmate.
   Method: Use queen to restrict king's squares, bring your king close.

2. KING + ROOK vs KING: The box method. Restrict king progressively.
   Use your king to force opponent's king to the edge.

3. KING + PAWN vs KING: The opposition concept.
   Key positions: Know when the pawn promotes and when it draws.
   Rule of the square: Can the defending king reach the pawn's
   promotion square in time?

4. KING + TWO BISHOPS vs KING: Drive king to corner.
   Bishops work together diagonally. Takes practice.

5. ROOK ENDINGS: The most common endgame type.
   Key concepts:
   - Lucena position (winning with rook + pawn vs rook)
   - Philidor position (drawing with rook vs rook + pawn)
   - Activity is everything. Active rook > passive rook.
   - Rook belongs BEHIND passed pawns (yours or opponent's).
   - Cut off the opponent's king from the action.

6. PAWN ENDINGS:
   - Opposition: Kings face each other with one square between.
     The side NOT to move has the opposition (advantageous).
   - Key squares: For each pawn, there are squares that guarantee
     promotion if the king reaches them.
   - Triangulation: Lose a tempo by making a triangular king maneuver
     to transfer the move to the opponent.
   - Outside passed pawn: A passed pawn far from the main action
     distracts the opponent's king and wins material elsewhere.

ENDGAME STUDY METHOD:
  Use Lichess Practice -> Endgames (free, interactive).
  Study one endgame type per week until mastered.
  Review endgame positions from your own games.
```

## Study Methods

### Structured Improvement Plan
```
STUDY TIME ALLOCATION BY LEVEL:

BEGINNER (under 1000): 5-10 hours/week
  Tactics: 50% (puzzles, pattern recognition)
  Playing: 30% (slow games with analysis)
  Opening principles: 10% (not specific lines)
  Endgames: 10% (basic checkmates)

INTERMEDIATE (1000-1500): 7-15 hours/week
  Tactics: 35% (puzzles, increasing difficulty)
  Playing: 25% (rapid games, always analyze after)
  Endgames: 20% (essential endgame positions)
  Opening study: 10% (main lines, understand ideas)
  Positional study: 10% (annotated master games)

ADVANCED (1500-2000): 10-20 hours/week
  Tactics: 25% (complex puzzles, calculation training)
  Playing: 20% (classical or rapid, deep analysis)
  Positional study: 20% (strategy books, master games)
  Endgames: 15% (complex endgames, practical rook endings)
  Opening preparation: 15% (database study, repertoire building)
  Reviewing own games: 5% (with engine, find patterns in mistakes)

THE GAME ANALYSIS WORKFLOW:
  After every serious game:
  1. Record the game (most platforms save automatically)
  2. Analyze without an engine first. Write down your thoughts.
     - Where did I feel confident? Where did I feel lost?
     - What was my plan? Did it work?
     - Where did the game turn?
  3. Then check with an engine (Stockfish, Leela).
     - Mark critical moments where evaluation swung
     - Understand WHY the engine move is better (not just what it is)
  4. Write down 1-2 lessons from the game.
  5. Review these lessons weekly.

BOOK RECOMMENDATIONS BY LEVEL:
  Beginner: "Bobby Fischer Teaches Chess" (Fischer/Margulies)
  Beginner-Intermediate: "Chess Fundamentals" (Capablanca)
  Intermediate: "My System" (Nimzowitsch) -- positional foundations
  Intermediate: "Silman's Complete Endgame Course" (Silman)
  Advanced: "Positional Decision Making in Chess" (Gelfand)
  Advanced: "Dvoretsky's Endgame Manual" (Dvoretsky)
```

### Rating Improvement Expectations
```
REALISTIC IMPROVEMENT RATES:
  (Assuming consistent, focused study)

  0 to 800: 1-3 months (learn rules, basic tactics, opening principles)
  800 to 1200: 3-6 months (tactical patterns, avoid blunders, basics)
  1200 to 1500: 6-12 months (positional understanding, endgame basics)
  1500 to 1800: 12-24 months (deeper strategy, opening repertoire)
  1800 to 2000: 1-3 years (consistent study, tournament play, coaching)
  2000+: Years of dedicated work. Diminishing returns require more effort.

PLATEAUS ARE NORMAL:
  Every player hits plateaus. Common causes:
  - Playing too much blitz (reinforces bad habits)
  - Not analyzing games (making the same mistakes)
  - Avoiding weaknesses (only studying what you enjoy)
  - Not playing stronger opponents (comfort zone)

  Breaking plateaus:
  - Shift study focus to your weakest area
  - Play longer time controls (rapid or classical)
  - Analyze losses deeply (not wins)
  - Take lessons or watch instructional content on your weak area
  - Play in tournaments (pressure reveals weaknesses)
```

## Output Checklist

- [ ] Current playing strength assessed honestly
- [ ] Opening repertoire selected for White and Black
- [ ] Tactical training routine established (daily puzzles)
- [ ] Positional concepts studied with master game examples
- [ ] Essential endgames practiced to proficiency
- [ ] Study time allocated across all areas by level
- [ ] Game analysis workflow implemented (review every serious game)
- [ ] Rating improvement timeline set with realistic expectations
- [ ] Plateau-breaking strategies identified for future use
- [ ] Tournament preparation plan ready (if competitive goals exist)


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Chess Strategist deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with chess strategist for a mid-size project."

**Output:** A complete chess strategist framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
