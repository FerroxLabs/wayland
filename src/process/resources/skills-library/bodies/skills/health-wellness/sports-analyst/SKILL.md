---
name: sports-analyst
description: |
  Sports statistics and analysis tool covering fantasy sports strategy, player evaluation metrics by sport, team analysis frameworks, betting basics (educational), draft strategy, season prediction models, and historical comparisons.
  Use when the user asks about sports analyst, or needs help with sports statistics and analysis tool covering fantasy sports strategy, player evaluation metrics by sport, team analysis frameworks, betting basics (educational), draft strategy, season prediction models, and historical comparisons.
  Do NOT use when the request requires professional medical advice or falls outside the scope of sports analyst.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "health-wellness fitness guide"
  category: "health-wellness"
  subcategory: "fitness-exercise"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---

# Sports Analyst

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

> **NOTE:** Sports betting information is provided for educational purposes only. Gambling involves financial risk. This skill does not encourage or endorse sports gambling. Always comply with local laws regarding sports betting. If you or someone you know has a gambling problem, contact the National Council on Problem Gambling helpline at 1-800-522-4700.

## When to Use

**Use this skill when:**
- User asks about sports analyst
- User needs guidance on sports analyst topics
- User wants a structured approach to sports analyst

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

1. **What sport are you analyzing?** (Baseball / Basketball / Football / Soccer / Hockey / Other)
2. **What is your analysis goal?** (Fantasy sports / Player evaluation / Team analysis / Historical comparison / Betting education / Draft prep)
3. **What is your knowledge level?** (Casual fan / Knowledgeable fan / Statistical enthusiast / Professional analyst)
4. **What specific question do you want answered?** (Player comparison / Trade evaluation / Draft pick / Matchup analysis / Season projection)
5. **What data period are you interested in?** (Current season / Last 3 seasons / Career / Historical era)
6. **Fantasy format?** (If applicable: Standard / PPR / Half-PPR / Points league / Roto / H2H categories)

---

## Player Evaluation Metrics by Sport

### Baseball (MLB)

#### Hitting Metrics

| Metric | Full Name | What It Measures | Good/Elite |
|--------|-----------|-----------------|------------|
| AVG | Batting Average | Hits per at-bat | .270 / .300+ |
| OBP | On-Base Percentage | Times reaching base / plate appearances | .340 / .380+ |
| SLG | Slugging Percentage | Total bases / at-bats | .430 / .500+ |
| OPS | On-Base Plus Slugging | OBP + SLG | .770 / .900+ |
| OPS+ | Adjusted OPS | OPS adjusted for park and league (100 = avg) | 110 / 140+ |
| wOBA | Weighted On-Base Average | Comprehensive offensive value | .320 / .370+ |
| wRC+ | Weighted Runs Created Plus | Runs created adjusted (100 = avg) | 110 / 140+ |
| WAR | Wins Above Replacement | Total player value in wins | 3 / 6+ |
| ISO | Isolated Power | SLG - AVG (raw power) | .150 / .220+ |
| BABIP | Batting Avg on Balls in Play | Luck/skill indicator | .290-.310 avg |
| BB% | Walk Rate | Walks / plate appearances | 9% / 13%+ |
| K% | Strikeout Rate | Strikeouts / plate appearances | <20% / <15% |
| HR/FB | Home Run to Fly Ball Ratio | Power on fly balls | 12% / 18%+ |

#### Pitching Metrics

| Metric | Full Name | What It Measures | Good/Elite |
|--------|-----------|-----------------|------------|
| ERA | Earned Run Average | Earned runs per 9 innings | 3.50 / 2.80 |
| ERA+ | Adjusted ERA | ERA adjusted (100 = avg, higher is better) | 115 / 140+ |
| FIP | Fielding Independent Pitching | Pitching independent of defense | 3.40 / 2.80 |
| xFIP | Expected FIP | FIP with normalized HR/FB rate | 3.40 / 2.80 |
| WHIP | Walks + Hits per IP | Baserunners allowed per inning | 1.20 / 1.00 |
| K/9 | Strikeouts per 9 | Strikeout rate | 8.5 / 10.5+ |
| BB/9 | Walks per 9 | Control measure | 2.8 / 2.0 |
| K/BB | Strikeout to Walk Ratio | Command efficiency | 3.0 / 4.5+ |
| WAR | Wins Above Replacement | Total pitcher value | 3 / 6+ |
| SIERA | Skill-Interactive ERA | Advanced ERA estimator | 3.40 / 2.80 |

#### Baseball Analysis Framework
```
HITTER EVALUATION TEMPLATE:
Player: _______________
Season/Period: _________

Contact Quality:     AVG: ___ | BABIP: ___ | K%: ___ | Contact%: ___
Power:               SLG: ___ | ISO: ___ | HR: ___ | HR/FB: ___
Plate Discipline:    OBP: ___ | BB%: ___ | O-Swing%: ___ | Z-Contact%: ___
Overall Value:       wRC+: ___ | WAR: ___ | OPS+: ___
Baserunning:         SB: ___ | CS: ___ | BsR: ___

Trend: [Improving / Stable / Declining]
Sustainability Flags: [BABIP outlier? / HR/FB outlier? / Age concern?]
```

### Basketball (NBA)

#### Key Metrics

| Metric | Full Name | What It Measures | Good/Elite |
|--------|-----------|-----------------|------------|
| PER | Player Efficiency Rating | Per-minute productivity (15 = avg) | 18 / 25+ |
| TS% | True Shooting Percentage | Scoring efficiency including FT and 3PT | 56% / 62%+ |
| USG% | Usage Rate | Percentage of team plays used | 22% / 30%+ |
| BPM | Box Plus/Minus | Points per 100 possessions vs average | 2 / 6+ |
| VORP | Value Over Replacement Player | Total value over replacement | 2 / 5+ |
| WS | Win Shares | Wins contributed | 5 / 10+ |
| WS/48 | Win Shares per 48 min | Per-minute win contribution | .100 / .200+ |
| RAPTOR | Robust Algorithm (FiveThirtyEight) | Total on-court impact | +2 / +6+ |
| RPM | Real Plus-Minus | On/off court impact adjusted | +2 / +5+ |
| AST% | Assist Percentage | Percentage of teammate FGs assisted | 20% / 35%+ |
| REB% | Rebound Percentage | Percentage of available rebounds | 10% / 18%+ |
| STL% | Steal Percentage | Steals per 100 possessions | 1.5% / 2.5%+ |
| BLK% | Block Percentage | Blocks per 100 possessions | 2% / 5%+ |
| ORTG | Offensive Rating | Points per 100 possessions | 110 / 118+ |
| DRTG | Defensive Rating | Points allowed per 100 poss (lower=better) | 108 / 104 |
| Net Rating | ORTG - DRTG | Overall impact | +3 / +8+ |

#### Basketball Analysis Framework
```
PLAYER EVALUATION TEMPLATE:
Player: _______________
Season: _______________

Scoring: PPG: ___ | TS%: ___ | USG%: ___ | FTA Rate: ___
Playmaking: APG: ___ | AST%: ___ | TOV%: ___ | AST/TOV: ___
Rebounding: RPG: ___ | REB%: ___ | OREB%: ___ | DREB%: ___
Defense: STL%: ___ | BLK%: ___ | DRTG: ___ | DWS: ___
Overall: PER: ___ | BPM: ___ | WS: ___ | VORP: ___

Role: [Star / Starter / Rotation / Bench]
Strengths: _______________
Weaknesses: _______________
Comparable Player: _______________
```

### Football (NFL)

#### Quarterback Metrics

| Metric | Full Name | What It Measures | Good/Elite |
|--------|-----------|-----------------|------------|
| QBR | Total Quarterback Rating | ESPN's comprehensive QB metric (0-100) | 60 / 75+ |
| Passer Rating | NFL Passer Rating | Traditional QB efficiency (0-158.3) | 90 / 100+ |
| ANY/A | Adjusted Net Yards/Attempt | Yards per attempt with sacks, TDs, INTs | 6.5 / 7.5+ |
| CPOE | Completion % Over Expected | Accuracy above expected | 1% / 4%+ |
| EPA/Play | Expected Points Added/Play | Points added per play vs expected | 0.10 / 0.20+ |
| DVOA | Defense-adjusted Value Over Average | Efficiency vs average (Football Outsiders) | 10% / 25%+ |
| ADOT | Average Depth of Target | Average air yards per attempt | Context-dependent |
| Pressure Rate | Pressured Dropbacks | Times pressured / dropbacks | <25% is good OL |

#### Skill Position Metrics

| Metric | Position | What It Measures | Good/Elite |
|--------|----------|-----------------|------------|
| YPC | RB | Yards per carry | 4.2 / 4.8+ |
| YAC | WR/TE | Yards after catch | 4.0 / 5.5+ |
| Target Share | WR/TE | % of team targets | 20% / 25%+ |
| YPRR | WR | Yards per route run | 1.75 / 2.25+ |
| Catch Rate | WR/TE | Catches / targets | 65% / 75%+ |
| Separation | WR | Average separation at catch | 2.5+ yards |
| Missed Tackles Forced | RB | Elusiveness metric | 0.15+ per touch |
| Snap Count % | All | Playing time share | 70%+ is starter |

#### Football Analysis Framework
```
PLAYER EVALUATION TEMPLATE:
Player: _______________  Position: ___
Season: _______________

Production: [Key stats for position]
Efficiency: [EPA, DVOA, or per-play metrics]
Usage: [Snap%, Target Share, Carries]
Advanced: [Position-specific advanced metrics]
Situation: [Team context, schedule, injuries]

Fantasy Outlook:
Ceiling: ___  Floor: ___  Projection: ___
Risk Factors: _______________
```

### Soccer (Football)

#### Key Metrics

| Metric | What It Measures | Context |
|--------|-----------------|---------|
| xG | Expected Goals | Goal probability based on shot quality |
| xA | Expected Assists | Assist probability based on pass quality |
| xG + xA per 90 | Combined attacking output | Normalized to 90 minutes |
| Progressive Passes | Passes moving ball significantly forward | Creativity measure |
| Progressive Carries | Dribbles moving ball forward | Ball-carrying ability |
| Tackles + Interceptions per 90 | Defensive actions | Defensive contribution |
| Pressing Actions per 90 | High press triggers | Work rate / pressing |
| Pass Completion % | Accuracy of passing | Depends on role and pass type |
| Shot-Creating Actions | Actions leading to shots | Creativity |
| Goal-Creating Actions | Actions directly leading to goals | Decisive impact |

### Hockey (NHL)

#### Key Metrics

| Metric | What It Measures | Good/Elite |
|--------|-----------------|------------|
| CF% | Corsi For % (shot attempts) | 52% / 56%+ |
| xGF% | Expected Goals For % | 52% / 56%+ |
| P/60 | Points per 60 minutes | 2.0 / 3.0+ |
| GAR | Goals Above Replacement | 5 / 15+ |
| WAR | Wins Above Replacement | 1 / 3+ |
| PDO | Shooting% + Save% (luck indicator) | ~100 is normal |
| HDCF% | High-Danger Chances For % | 52% / 56%+ |
| iCF | Individual shot attempts | Volume of offense |
| IPP | Individual Points Percentage | % of team goals with a point | 60% / 75%+ |
| TOI | Time on Ice | Usage indicator |

---

## Fantasy Sports Strategy

### Fantasy Football Draft Strategy
```
DRAFT POSITION STRATEGY:

Pick 1-3 (Early First Round):
- Target elite RB or top WR
- RB advantage: positional scarcity
- WR advantage: longevity, consistency

Pick 4-8 (Mid First Round):
- Best available RB/WR
- Consider elite TE (if one separates)
- Value over replacement matters most

Pick 9-12 (Late First Round):
- WR-WR or WR-RB start
- Late-round QB strategy viable
- Target high-upside players

ROUND-BY-ROUND FRAMEWORK:
Rounds 1-3: Core starters (RB/WR)
Rounds 4-6: Fill starting lineup (Flex, TE, QB)
Rounds 7-9: Depth and upside plays
Rounds 10-12: Backup QB, lottery tickets
Rounds 13+: Defense, kicker (last 2 picks)

KEY PRINCIPLES:
1. Value over replacement (VOR) drives decisions
2. Never reach for a position - take best available value
3. QB and TE can wait unless elite (top 2-3)
4. RB depth matters due to injury risk
5. Handcuff your top RBs in later rounds
6. Target high-upside late-round WRs
```

### Fantasy Football Weekly Start/Sit Framework
```
START/SIT DECISION MATRIX:

Factor | Weight | Analysis
-------|--------|--------
Matchup (opponent defense rank) | 25% | Favorable or tough?
Recent form (last 3 games) | 25% | Trending up or down?
Usage/volume (snap%, targets) | 20% | Guaranteed touches?
Home/away | 10% | Home field advantage
Weather (outdoor games) | 10% | Wind, rain, cold affect passing
Injury status | 10% | Questionable? Limited practice?

SCORING: Rate each factor 1-5, multiply by weight
Score > 3.5: Strong start
Score 2.5-3.5: Borderline (consider alternatives)
Score < 2.5: Consider sitting
```

### Fantasy Baseball Strategy
```
CATEGORY ANALYSIS (Roto/Categories):

Hitting Categories (Standard 5x5):
- R (Runs) - Correlated with OBP, lineup position
- HR (Home Runs) - Power hitters, HR/FB rate
- RBI (Runs Batted In) - Lineup position, team offense
- SB (Stolen Bases) - Speed, opportunity, green light
- AVG (Batting Average) - Contact rate, BABIP

Pitching Categories (Standard 5x5):
- W (Wins) - Team dependent, unreliable
- K (Strikeouts) - K rate x innings
- ERA - FIP and xERA are more predictive
- WHIP - BB rate + hit rate
- SV (Saves) - Closer role, volatile

DRAFT STRATEGY:
1. Stars and scrubs: Pay for elite talent, fill gaps with waiver wire
2. Balanced approach: Consistent contributors across categories
3. Punting strategy: Deliberately sacrifice 1-2 categories to dominate others
```

---

## Team Analysis Framework

### Strength of Schedule Analysis Template
```
TEAM: _______________
SEASON: _______________

REMAINING SCHEDULE:
Opponent | Record | Ranking | Key Matchup Notes
---------|--------|---------|------------------
         |        |         |

STRENGTH METRICS:
Avg Opponent Win%: ___
Ranked Opponents Remaining: ___
Home/Away Split: ___
Division Games Remaining: ___
Rest Advantage/Disadvantage: ___

DIFFICULTY ASSESSMENT:
Easy stretch (weeks ___-___): ___
Tough stretch (weeks ___-___): ___
Overall SOS Rank: ___/32 (or league size)
```

### Team Efficiency Analysis
```
TEAM EVALUATION:
Team: _______________

OFFENSE:
Points/Game: ___ (Rank: ___)
Yards/Play: ___ (Rank: ___)
Turnover Rate: ___
Red Zone Efficiency: ___
3rd Down Conversion: ___

DEFENSE:
Points Allowed/Game: ___ (Rank: ___)
Yards Allowed/Play: ___ (Rank: ___)
Takeaway Rate: ___
Red Zone Defense: ___
Sack Rate: ___

SPECIAL TEAMS:
FG%: ___
Punt Average: ___
Return Yards: ___

OVERALL:
Point Differential: ___ (Rank: ___)
Pythagorean Win Expectation: ___
Actual Record vs Expected: ___
```

---

## Season Prediction Models

### Pythagorean Win Expectation
```
FORMULA:
Win% = (Points Scored^exp) / (Points Scored^exp + Points Allowed^exp)

Exponents by sport:
- Baseball: 1.83 (or 2 for simplified)
- Basketball: 13.91
- Football: 2.37
- Hockey: 2.05



USE CASE:
- Teams that outperform Pythagorean record may regress
- Teams that underperform may improve
- Indicator of "luck" in close games
```

### Simple ELO Rating Explanation
```
ELO SYSTEM:
- Each team starts with a base rating (1500)
- Winners gain points, losers lose points
- Amount gained/lost depends on:
  * Expected outcome (upset = more points transferred)
  * Margin of victory (bigger wins = more adjustment)
  * Home-field advantage (built into expected outcome)

INTERPRETING ELO:
1700+ : Elite / Championship contender
1550-1700 : Playoff team
1450-1550 : Average
1350-1450 : Below average
Below 1350 : Rebuilding / Bottom tier

APPLICATIONS:
- Game-by-game win probability
- Season win total projections
- Power rankings
- Historical team comparisons
```

---

## Historical Comparisons Framework
```
PLAYER COMPARISON TEMPLATE:

Player A: _______________  |  Player B: _______________
Era: _______________       |  Era: _______________

Metric        | Player A | Player B | Advantage
-------------|----------|----------|----------
[Metric 1]   |          |          |
[Metric 2]   |          |          |
[Metric 3]   |          |          |
[Metric 4]   |          |          |
[Metric 5]   |          |          |

ERA ADJUSTMENT NOTES:
- [Rule changes affecting comparison]
- [League-wide trend differences]
- [Schedule/competition level differences]

PEAK vs LONGEVITY:
Peak Seasons (Player A): ___ seasons above elite threshold
Peak Seasons (Player B): ___ seasons above elite threshold
Career Totals Comparison: ___

CONCLUSION:
[Nuanced comparison considering era, role, and context]
```

---

## Betting Basics (Educational Only)

### Common Bet Types Explained

| Bet Type | Description | Example |
|----------|-------------|---------|
| Moneyline | Pick the winner | Team A -150 (bet $150 to win $100) |
| Spread | Margin of victory | Team A -7.5 (must win by 8+) |
| Over/Under (Total) | Combined score | Over 48.5 (teams combine for 49+) |
| Parlay | Multiple bets combined | All legs must hit for payout |
| Prop Bet | Individual stat/event | Player X over 25.5 points |
| Futures | Season-long outcome | Team X to win championship |

### Understanding Odds
```
AMERICAN ODDS:
-150: Bet $150 to win $100 (favorite)
+200: Bet $100 to win $200 (underdog)

IMPLIED PROBABILITY:
Favorite: Risk / (Risk + Profit) x 100
  -150: 150 / (150 + 100) x 100 = 60%

Underdog: 100 / (Odds + 100) x 100
  +200: 100 / (200 + 100) x 100 = 33.3%

THE VIG (JUICE):
- Sportsbooks add margin to both sides
- Example: -110 on both sides of a 50/50 bet
- Implied probability: 52.4% each side (total 104.8%)
- The 4.8% over 100% is the book's edge
```

### Key Concepts
```
IMPORTANT EDUCATIONAL NOTES:
1. The house always has an edge (the vig/juice)
2. Parlays significantly increase the house edge
3. Sharp money (professional bettors) moves lines
4. Line movement indicates where money is flowing
5. Injuries and weather can dramatically affect outcomes
6. Past results do not guarantee future performance
7. Bankroll management is critical for anyone who bets
8. Never bet more than you can afford to lose
9. Chasing losses leads to larger losses
10. Most bettors lose long-term
```

---

## Output Format

When providing sports analysis, present it as:
```
ANALYSIS: [Type - Player/Team/Matchup/Draft]
Sport: [Sport]
Context: [Fantasy / Evaluation / Comparison]

SUMMARY:
[1-2 sentence overview]

KEY METRICS:
Metric | Value | League Rank/Percentile | Trend
-------|-------|------------------------|------
       |       |                        |

ANALYSIS:
[Detailed breakdown with context]

COMPARABLE PLAYERS/SITUATIONS:
[Historical or current comparisons]

RECOMMENDATION:
[Actionable insight based on analysis goal]

CONFIDENCE LEVEL: [High / Medium / Low]
KEY RISKS: [Factors that could change the analysis]
```

## Example

**Input:** "Help me get started with sports analyst"

**Output:** A structured sports analyst plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
