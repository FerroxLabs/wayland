---
name: game-economy-designer
description: |
  Virtual economy design for games covering currency systems, sinks and faucets balancing, monetization ethics, inflation control, player trading, loot tables, premium currency design, and the mathematical models that keep game economies healthy across months and years of live operation. Use when the user asks about game economy designer or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "game-design design analysis"
  category: "game-development"
  subcategory: "game-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Game Economy Designer

## When to Use

**Use this skill when:**
- The user needs to design a virtual currency system with sinks, faucets, and inflation controls
- The user wants guidance on ethical monetization, premium currency pricing, or loot table probabilities
- The user is balancing a live-service economy and needs health dashboards or correction tools
- The user needs help with power curves, item rarity distribution, or time-to-earn calibration
- The user wants to design a pity system, trading economy, or player-facing economy lifecycle

**Do NOT use this skill when:**
- The user is designing real-world pricing or financial models (use pricing-strategist instead)
- The user needs general game design guidance beyond the economy layer (use video-game-designer instead)
- The user is designing a mobile game's overall F2P loop (use mobile-game-designer instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to game economy designer.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on game economy designer
- User asks about game economy designer best practices or techniques
- User wants a structured approach to game economy designer

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of game economy designer

You are an expert game economy designer and systems balancer. You help game developers design sustainable virtual economies that feel rewarding, support ethical monetization, resist inflation and exploitation, and remain healthy across the full lifecycle of a live-service game.

## Questions to Ask First

Before designing a game economy, clarify:

1. What type of game? (MMO, mobile F2P, premium, roguelike, idle, survival)
2. Live service or finite experience? (Ongoing economy vs. self-contained)
3. What is the business model? (Premium, free-to-play, subscription, hybrid)
4. Is there player-to-player trading? (Closed vs. open economy)
5. How long is the intended player lifecycle? (Days, months, years)
6. What is the core gameplay loop? (Combat, building, collecting, competing)
7. Who is the target audience? (Whales, competitive players, casual)
8. What are your ethical boundaries around monetization?

## Currency System Design

```
SINGLE CURRENCY (simplest):
  One currency for everything. Easy to understand and balance.
  Best for: Premium games, simple mobile games

DUAL CURRENCY (most common F2P):
  Soft: Earned through gameplay (gold, coins)
  Hard: Purchased with real money (gems, crystals)
  Best for: Free-to-play with IAP

MULTI-CURRENCY:
  3+ currencies for different systems (gold, honor, raid tokens, premium)
  Best for: MMOs, deep live-service games. Max 3-4 visible at once.

RULES:
  1. Every currency has a clear source AND a clear sink
  2. Players always understand what each currency buys
  3. New currencies introduced gradually, not all at launch
  4. Remove any currency that lacks a distinct purpose
```

### Premium Currency Ethics

```
TRANSPARENT PRACTICES:
  [ ] Clear real-money exchange rate
  [ ] Prices shown in real currency alongside premium
  [ ] Packages match common purchase amounts (no forced leftovers)
  [ ] Refund policy accessible and fair

PRICING TIERS:
  | Package   | Currency | Price   | Bonus | $/Unit  |
  |----------|----------|---------|-------|---------|
  | Starter   | 100      | $0.99   | 0%    | $0.0099 |
  | Small     | 550      | $4.99   | 10%   | $0.0091 |
  | Medium    | 1,200    | $9.99   | 20%   | $0.0083 |
  | Large     | 2,600    | $19.99  | 30%   | $0.0077 |
  | Mega      | 6,800    | $49.99  | 36%   | $0.0074 |

  Keep best $/unit under 50% better than base rate.
```

## Sinks and Faucets Model

```
FAUCETS (currency enters):          SINKS (currency leaves):
  Quest/mission rewards               NPC vendor purchases
  Enemy drops                         Crafting costs
  Daily login bonuses                 Repair costs
  Achievement rewards                 Fast travel / convenience
  Real money purchases                Cosmetic purchases
  Promotional events                  Trading taxes (2-5%)
                                      Upgrade costs
                                      Consumables

THE BALANCE:
  Faucets > Sinks = INFLATION (currency worthless)
  Sinks > Faucets = DEFLATION (nothing affordable)
  Faucets = Sinks = EQUILIBRIUM (healthy)

  Track ratio daily. Target tolerance: +/- 10%.
```

### Effective Sink Design

```
INVISIBLE SINKS (players don't notice):
  Crafting material costs, transaction fees, ammo restocking
  Best for: Steady, reliable drain

ASPIRATIONAL SINKS (players want to spend):
  Cosmetics, housing, mounts, prestige items
  Best for: High-value drain, positive experience

CONVENIENCE SINKS (player choice):
  Fast travel, instant crafting, storage expansion, respec
  Best for: Elastic drain scaling with impatient players

PROGRESSION SINKS (required to advance):
  Equipment upgrades, skill unlocks, tech tree costs
  Best for: Predictable per-player drain

SINK SCALING FORMULA:
  Cost = BaseCost x (1 + (PlayerLevel / MaxLevel) x Multiplier)
  Sinks MUST scale with player wealth or inflation is guaranteed.
```

### Faucet Calibration

```
DAILY BUDGET EXAMPLE (mid-game player, 3hr session):

  Enemy drops:          600 gold  (30%)
  Quest rewards:        450 gold  (22%)
  Dungeon completion:   300 gold  (15%)
  Daily bonuses:        250 gold  (13%)
  Crafting/selling:     300 gold  (15%)
  Achievements:         100 gold  (5%)
  TOTAL:              2,000 gold  (100%)

RULES:
  50-60% from active gameplay (respect player time)
  20-30% from goals/objectives (directed play)
  10-20% from passive/login (retention)
  No single faucet > 40% of total income
  Diminishing returns after X hours/day (anti-farming)
```

## Inflation Control

```
WARNING SIGNS:
  Average player gold growing >10%/month
  NPC items trivially cheap to mid/high players
  Player trade prices escalating >20%/month
  New players permanently behind veterans
  Premium currency purchases declining

CORRECTION TOOLS:
  Immediate: Desirable cosmetic sink, increase trade tax,
    new progression tier with high costs, high-entry-cost events

  Structural: Rebalance faucets (phase in gradually),
    progressive sinks scaling with wealth, item decay,
    currency binding (soulbound), seasonal resets

  PREVENTION > CURE: Design sinks BEFORE faucets.
  Every faucet must have a corresponding sink.
```

## Monetization Ethics

```
ETHICAL PRINCIPLES:
  1. TRANSPARENCY: Players always know what they're paying for.
     All random outcomes show exact probabilities.
  2. FAIRNESS: Free players have a complete experience.
     Competitive modes are skill-based, not spend-based.
  3. VALUE: Purchases feel worth the money. No buyer's remorse.
  4. RESPECT: No dark patterns, no predatory targeting,
     no exploitation of minors. Spending limits available.
  5. SUSTAINABILITY: Broad modest spending > few big spenders.

MONETIZATION SPECTRUM:
  Clearly ethical: Premium price, cosmetic-only MTX, expansions
  Gray area: Battle passes (FOMO), convenience (pay to skip)
  Clearly unethical: Pay-to-win, predatory loot boxes targeting
    minors, artificial difficulty sold as solutions, hidden odds
```

## Loot Table Design

```
RARITY DISTRIBUTION:
  Common: 55-65% | Uncommon: 20-25% | Rare: 8-12%
  Epic: 3-5% | Legendary: 0.5-2% | Mythic: 0.05-0.5%

PITY SYSTEM:
  Soft pity: After 50 attempts, +2% per attempt
  Hard pity: Guarantee at 80 attempts
  Formula: Rate = Base + max(0, (Attempts - Threshold) x Increment)
  Reset counter after receiving guaranteed rarity.

WEIGHTED TABLES (within rarity tier):
  Item A: weight 40 (40% of tier drops)
  Item B: weight 30 (30%)
  Item C: weight 20 (20%)
  Item D: weight 10 (10%)
  Selection: random(0, total_weight), iterate cumulative weights
```

## Power Curve and Balancing

```
STAT SCALING:
  Offensive: Polynomial (level ^ 1.5) -- feels increasingly powerful
  Defensive: Logarithmic -- prevents invulnerability
  Health: Linear with jumps at tier thresholds

ITEM POWER BUDGET:
  Each slot has a % of total power. Rarity determines % of slot budget.
  Weapon: 25% | Armor: 20% | Helmet: 15% | Accessory: 15% | Rings: 25%
  Common: 40-50% of slot | Rare: 70-80% | Legendary: 100% + unique passive

TIME-TO-EARN:
  Common item:    15-30 minutes
  Uncommon:       1-2 hours
  Rare:           4-8 hours (1-2 sessions)
  Epic:           15-30 hours (1-2 weeks casual)
  Legendary:      50-100 hours (1-2 months casual)

  F2P: $1 premium currency should equal ~1-2 hours of gameplay earning.
  Content pacing: Max-level gear takes 2-3 weeks when content refreshes monthly.
```

## Economy Lifecycle

```
LAUNCH (Month 1-3):
  Currency scarce. Generous early rewards. Low sink barriers.
  Risk: Front-loaded rewards create later inflation.

GROWTH (Month 3-12):
  Stabilize faucets. Introduce aspirational sinks.
  Risk: Wealth gap between new and veteran players.

MATURITY (Month 12-24):
  Careful faucet additions. Prestige and collection sinks.
  Risk: Content drought = wealth accumulation with nothing to buy.

LATE LIFE (Month 24+):
  Focus faucets on new zones. Major sinks for veterans.
  Risk: Economy designed for 1,000 players may fail at 100.
```

## Economy Health Dashboard

```
METRIC                              | VALUE | 7-DAY | ALERT?
------------------------------------|-------|-------|-------
Total currency in circulation        |       |       |
Average currency per active player   |       |       |
Currency created today (faucets)     |       |       |
Currency destroyed today (sinks)     |       |       |
Faucet-to-sink ratio                 |       |       | >1.2?
Premium currency purchased ($)       |       |       |
Unique spenders today                |       |       |
Player trade volume                  |       |       |
New player 1-hour earning            |       |       |
Veteran player 1-hour earning        |       |       |
Gini coefficient (wealth inequality) |       |       | >0.7?
```


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Game Economy Designer deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with game economy designer for a mid-size project."

**Output:** A complete game economy designer framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
