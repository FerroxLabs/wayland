---
name: mobile-game-designer
description: |
  Free-to-play mobile game design covering F2P design patterns, retention mechanics, short session design, monetization models (IAP, ads, battle pass), mobile UX, onboarding flows, A/B testing, analytics-driven design, and live operations strategy. Use when the user asks about mobile game designer or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "game-design design mobile"
  category: "game-development"
  subcategory: "game-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Mobile Game Designer

## When to Use

**Use this skill when:**
- The user is designing a free-to-play mobile game and needs F2P design patterns, retention mechanics, or session design
- The user wants guidance on mobile monetization models (IAP, ads, battle pass, subscription)
- The user needs help with mobile-specific UX, onboarding flows, or A/B testing strategies
- The user wants to plan live operations, content calendars, or analytics-driven design for a mobile title
- The user needs KPI frameworks (retention, ARPDAU, LTV, CPI) for mobile game performance

**Do NOT use this skill when:**
- The user is designing a PC or console game without mobile considerations (use video-game-designer instead)
- The user needs virtual economy design across platforms (use game-economy-designer instead)
- The user wants to build a game for a 48-hour jam rather than a live-service product (use game-jam-guide instead)

## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to mobile game designer.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on mobile game designer
- User asks about mobile game designer best practices or techniques
- User wants a structured approach to mobile game designer

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of mobile game designer

## Questions to Ask First

Before designing any mobile game, clarify:

1. **What is the core gameplay loop?** (Match-3, idle, strategy, puzzle, action, simulation, narrative)
2. **What is the monetization model?** (IAP-primary, ad-supported, hybrid, premium, subscription)
3. **Who is the target audience?** (Casual, mid-core, hardcore, age range, geography)
4. **What is the target session length?** (1-3 minutes, 5-10 minutes, 15+ minutes)
5. **What is the competitive landscape?** (Direct competitors, market saturation)
6. **What is the team and budget?** (Solo, small studio, funded startup, large publisher)
7. **What is the launch strategy?** (Soft launch, global launch, early access)
8. **What are the target KPIs?** (Retention, ARPDAU, LTV, CPI targets)

## F2P Design Patterns

### The Core Loop

```
MOBILE CORE LOOP STRUCTURE:

  [Play Session] -> [Reward] -> [Progress] -> [Gate/Choice] -> [Return]
       |              |            |              |              |
    Gameplay      Currency,     Unlock,      Energy,        Push
    action        items,        upgrade,     timer,         notification,
                  XP            story        paywall        new content

DESIGNING FOR MOBILE:
  - Each loop iteration should be completable in ONE session
  - The reward should be immediate and visible
  - Progress should feel meaningful even in 2-minute sessions
  - Gates should create anticipation, not frustration
  - Return triggers should be timely and relevant

THE META LOOP (Long-term):
  Play -> Earn Resources -> Upgrade -> Unlock New Content ->
  Face Harder Challenges -> Need More Resources -> Play

THE SESSION LOOP (Short-term):
  Start Level -> Play -> Win/Lose -> Reward -> Choose Next Level

BOTH LOOPS must be satisfying independently.
The session loop for moment-to-moment fun.
The meta loop for long-term investment and retention.
```

### Energy Systems

```
ENERGY / STAMINA SYSTEMS:

PURPOSE:
  - Control session length (prevent binge and burnout)
  - Create scarcity (make each play session feel valuable)
  - Monetize through energy refills
  - Regulate content consumption speed

DESIGN VARIABLES:
  Energy cap: Maximum stored energy (typically 5-30 units)
  Regen rate: Time to regenerate one unit (typically 5-30 minutes)
  Cost per play: Energy consumed per attempt (1-5 units)
  Full refill time: Time from empty to full (typically 2-8 hours)

BALANCING ENERGY:
  Too generous: Players binge, exhaust content, and churn
  Too restrictive: Players feel gated and frustrated
  Sweet spot: 2-3 natural play sessions per day at 5-15 minutes each

ALTERNATIVES TO ENERGY:
  - Lives (fail X times, wait or pay)
  - Daily attempts (limited tries per day per mode)
  - Ticket systems (earn tickets through various activities)
  - Cooldown timers on specific features
  - No energy (premium or ad-monetized games)

ETHICAL CONSIDERATION:
  Energy systems that force multi-hour waits are
  frustrating and can feel exploitative. Design energy
  to pace enjoyment, not to create withdrawal symptoms.
```

## Retention Mechanics

### Day 1, Day 7, Day 30 Retention

```
RETENTION BENCHMARKS (F2P mobile):
  Day 1 (D1):  Good: 40%+    Great: 50%+
  Day 7 (D7):  Good: 15%+    Great: 25%+
  Day 30 (D30): Good: 5%+    Great: 10%+

D1 RETENTION (First Session):
  The first session is EVERYTHING. If players don't return
  after Day 1, nothing else matters.

  DESIGN FOR D1:
  - Instant gratification (fun within 30 seconds)
  - Clear progression in first session
  - End first session on a cliffhanger or anticipation
  - Set up a reason to return (pending reward, next unlock, timer)
  - Tutorial should teach by DOING, not by READING

D7 RETENTION (First Week):
  Players have learned the basics. They need DEPTH.

  DESIGN FOR D7:
  - Unlock new features across the first week (drip content)
  - Daily login rewards with escalating value
  - Social features become available (guilds, friends, leaderboards)
  - First "wall" that creates decision-making (spend, grind, or optimize)
  - Events that create urgency (limited-time content)

D30 RETENTION (First Month):
  Players who stay 30 days are potential long-term players.

  DESIGN FOR D30:
  - Meaningful progression visible (how far they've come)
  - Community connections (leaving a guild is harder than leaving a game)
  - Variety through game modes, events, updates
  - Investment: collections, upgrades, customization they don't want to lose
  - Regular new content (content cadence is critical)
```

### Engagement Mechanics

```
DAILY LOGIN REWARDS:
  Day 1: Small reward (currency)
  Day 2-6: Escalating rewards
  Day 7: Major reward (rare item, premium currency)
  THEN: Reset or continue with streak bonuses
  Design: Never give the BEST reward early. Build anticipation.

DAILY QUESTS/MISSIONS:
  3-5 tasks that can be completed in a single session.
  "Win 3 matches" "Use skill X 5 times" "Collect 100 coins"
  Purpose: Guide play behavior, ensure variety, provide goals.
  Include an "auto-complete" option for monetization.

STREAKS:
  Reward consecutive-day logins or activity.
  Breaking a streak should feel like a loss (loss aversion).
  But be careful: a broken 30-day streak can cause rage-quit.
  Solution: Allow 1-2 "missed day" saves in the streak.

LIMITED-TIME EVENTS:
  Seasonal or themed content with exclusive rewards.
  Creates FOMO (Fear Of Missing Out) and urgency.
  Duration: 3-14 days typically.
  Must have its own mini-loop and rewards.

SOCIAL MECHANICS:
  - Guilds/clans: Community creates commitment
  - Gifting: Send and receive from friends
  - Leaderboards: Competition drives engagement
  - Cooperative challenges: Social obligation to contribute
  - Friend systems: Import from contacts or social media
```

## Session Design

```
DESIGNING FOR SHORT SESSIONS:

SESSION LENGTH TARGETS:
  Hyper-casual: 1-3 minutes (infinite runner, simple puzzle)
  Casual: 3-7 minutes (match-3, word games)
  Mid-core: 7-15 minutes (strategy, RPG)
  Hardcore: 15-30+ minutes (MOBA, battle royale)

SESSION STRUCTURE:
  0:00 - Load and re-engage (show rewards earned while away, daily bonuses)
  0:15 - Choose activity (play a level, do daily quest, manage resources)
  0:30 - Core gameplay begins
  X:00 - Session complete (clear reward summary, preview next goal)
  End  - Trigger for return (notification setup, pending timer, next reward)

DESIGN PRINCIPLES:
  1. Instant start: 0-3 taps from app open to gameplay
  2. Interruptible: Player can put phone down at any moment
  3. Resumable: Game state is saved constantly
  4. Completable: Each session has a natural endpoint
  5. Progressive: Even short sessions should feel productive
  6. Connected: Each session links to the next (breadcrumbs)

SAVE AND RESUME:
  Mobile games MUST handle interruptions gracefully:
  - Incoming calls, notifications, app switching
  - Save state constantly (never rely on explicit save actions)
  - Reconnect seamlessly after brief interruptions
  - Handle long absences (away for days) with "welcome back" flow
```

## Monetization Design

### In-App Purchases (IAP)

```
IAP TYPES:

CONSUMABLES (spent on use):
  - Currency packs (gems, coins, crystals)
  - Energy refills
  - Power-ups and boosts
  - Extra lives or attempts
  Pricing: $0.99 - $99.99 (typical range)

NON-CONSUMABLES (permanent):
  - Premium characters or skins
  - Unlock features (no-ads, extra mode)
  - Expansion content
  Pricing: $1.99 - $29.99 (typical range)

SUBSCRIPTIONS:
  - VIP pass (daily rewards, bonuses)
  - Season pass / Battle pass
  - Premium membership (enhanced features)
  Pricing: $4.99 - $14.99/month (typical range)

IAP PRICING STRATEGY:
  Starter pack: Best value, purchase once ($0.99-4.99)
    Purpose: Convert free players to payers (break the seal)
  Regular packs: Standard pricing tiers ($4.99-29.99)
    Purpose: Ongoing monetization for engaged players
  Whale packs: Premium bundles ($49.99-99.99)
    Purpose: High-value option for dedicated spenders

THE 80/20 RULE (often more extreme):
  ~5% of players will spend money
  ~50% of revenue comes from ~1% of players ("whales")
  Design must work for BOTH paying and non-paying players.
  The game should be enjoyable without spending.
```

### Ad Monetization

```
AD TYPES:

REWARDED VIDEO ADS (Most player-friendly):
  Player CHOOSES to watch a 15-30 second ad for a reward.
  Example: "Watch ad for 2x rewards" / "Watch ad for extra life"
  Revenue: $10-40 eCPM (varies by market)
  Best practice: 3-5 rewarded ad views per session maximum

INTERSTITIAL ADS (Between natural breaks):
  Full-screen ad between levels or sessions.
  Revenue: $5-15 eCPM
  Best practice: Never during gameplay. Only at natural breaks.
  Maximum frequency: every 3-5 minutes of play

BANNER ADS (Always visible):
  Small banner at screen edge during gameplay.
  Revenue: $0.50-3 eCPM (low but constant)
  Best practice: Only for hyper-casual games where volume is high

NATIVE ADS (Integrated into game UI):
  Ads that look like game content.
  Revenue: Varies widely
  Best practice: Clearly labeled as ads. Never deceptive.

AD PLACEMENT PRINCIPLES:
  1. Never interrupt gameplay flow
  2. Rewarded ads should feel like a BONUS, not a requirement
  3. Non-paying players should be ad-supported, not ad-punished
  4. Ad frequency should not make the game unusable
  5. Test ad placement impact on retention (too many ads = churn)
  6. Give players the option to remove ads via IAP
```

### Battle Pass Design

```
BATTLE PASS STRUCTURE:

FREE TRACK:
  Available to all players. Provides moderate rewards at each tier.
  Purpose: Show the system, create desire for premium track.

PREMIUM TRACK ($5-15 per season):
  Unlocked via purchase. Better rewards at each tier.
  Purpose: Primary recurring revenue source.

SEASON LENGTH: 4-8 weeks typically
TIERS: 30-100 tiers (completable with regular play)

DESIGN PRINCIPLES:
  1. Free track must have genuine value (not just crumbs)
  2. Premium rewards should be visible to free players (aspiration)
  3. Completion should be achievable with regular play (not pay-to-complete)
  4. Daily/weekly missions should provide most of the XP needed
  5. Allow purchasing tiers for players who missed time (catch-up)
  6. Exclusive content creates urgency (this skin is only available NOW)

BATTLE PASS ECONOMICS:
  If the premium pass costs $10 and contains $30+ worth of items
  (at regular store prices), it feels like a great deal.
  This perception drives purchase rates.
```

## Mobile UX Design

```
MOBILE-SPECIFIC UX PRINCIPLES:

TOUCH TARGETS:
  Minimum 44x44 points (Apple HIG) / 48x48 dp (Android)
  Fingers are imprecise. Buttons must be large enough.

ONE-HANDED PLAY:
  Most mobile games are played with one hand (often thumb).
  Place critical actions within thumb reach zones.
  Test on actual devices, not just monitors.

VISUAL CLARITY:
  - High contrast for outdoor visibility
  - Clear iconography (recognizable at small sizes)
  - Minimal text (read on a 6-inch screen in motion)
  - Important information should be visible at a glance

NAVIGATION:
  - Maximum 3 taps to reach any feature from the home screen
  - Clear back/home buttons
  - Bottom navigation bar for primary features (thumb accessible)
  - Avoid deep menu hierarchies
  - Show the player's current location in the UI at all times

PERFORMANCE:
  - Load times under 5 seconds (every second loses players)
  - Smooth 60fps gameplay
  - Battery-conscious design
  - Work on older devices (not just the latest flagship)
  - Network-resilient (graceful offline/reconnect behavior)

NOTIFICATIONS:
  - Meaningful notifications only (reward ready, event starting, friend request)
  - Never spam (diminishing returns leads to notification mute)
  - Respect quiet hours
  - Allow granular notification control
  - Optimal notification timing: 6-8 hours after last session
```

## Onboarding

```
THE FIRST-TIME USER EXPERIENCE (FTUE):

PRINCIPLES:
  1. PLAY FIRST, LEARN LATER: Let the player DO something fun
     within the first 30 seconds before any tutorial
  2. CONTEXTUAL TEACHING: Teach mechanics when the player
     NEEDS them, not before
  3. SHOW, DON'T TELL: Interactive tutorials > text popups
  4. GRADUAL COMPLEXITY: Reveal features over time (progressive
     disclosure), not all at once
  5. LET PLAYERS SKIP: Experienced players should be able to
     skip or speed through tutorials

ONBOARDING FLOW:
  0:00 - App opens. Minimal loading (< 3 seconds ideally)
  0:03 - Brief (5-second) brand/splash screen
  0:08 - Immediate interactive gameplay (tutorial level)
  0:30 - First success and reward (dopamine hit)
  1:00 - Core loop experienced once completely
  2:00 - Name/avatar creation (AFTER they're invested)
  3:00 - Second core loop with slight complexity increase
  5:00 - First session ends with clear next goal and reason to return

WHAT NOT TO DO:
  - Long cutscenes before gameplay
  - Text-heavy tutorial screens
  - Requiring account creation before play
  - Overwhelming the player with all features at once
  - Forcing the player to read the rules before playing
  - Pop-ups asking for permissions, ratings, or social connections
    in the first session
```

## A/B Testing and Analytics

```
KEY METRICS (KPIs):

ACQUISITION:
  CPI (Cost Per Install): What you pay per new user
  Organic vs. Paid ratio: Healthy games have 30%+ organic

ENGAGEMENT:
  DAU/MAU (Daily/Monthly Active Users): Overall engagement
  Session length: Time per play session
  Sessions per day: How often players return
  D1/D7/D30 retention: % of players returning after N days

MONETIZATION:
  ARPDAU: Average Revenue Per Daily Active User ($0.05-$0.50 typical)
  ARPPU: Average Revenue Per Paying User ($5-50 per month typical)
  Conversion rate: % of players who spend money (2-5% typical)
  LTV: Lifetime Value of a player (total revenue over their lifetime)
  LTV > CPI = profitable game

A/B TESTING FRAMEWORK:
  1. HYPOTHESIS: "Changing X will improve Y by Z%"
  2. CONTROL: Current version (A)
  3. VARIANT: Modified version (B)
  4. SAMPLE SIZE: Ensure statistical significance (thousands of users)
  5. DURATION: Run for at least 7 days (account for weekday/weekend)
  6. MEASUREMENT: Track primary and secondary metrics
  7. ANALYSIS: Statistical significance test before declaring winner

WHAT TO A/B TEST:
  - Onboarding flow variations
  - Store pricing and bundle composition
  - Ad placement and frequency
  - Tutorial length and approach
  - Push notification timing and messaging
  - Difficulty curves
  - Reward amounts and types
  - UI layout and button placement

ANALYTICS TOOLS:
  - Unity Analytics, GameAnalytics (free tier)
  - Amplitude, Mixpanel (event tracking)
  - Firebase Analytics (Google ecosystem)
  - Adjust, AppsFlyer (attribution)
```

## Live Operations

```
LIVE OPS STRATEGY:

CONTENT CADENCE:
  Daily: New daily quests, login reward cycle
  Weekly: New challenges, leaderboard reset, mini-events
  Monthly: New content drop (characters, levels, features)
  Quarterly: Major updates, seasonal events, meta changes
  Annually: Anniversary events, major milestones

EVENT DESIGN:
  - Theme: Tied to real-world seasons/holidays or game lore
  - Duration: 3-14 days (long enough to engage, short enough to create urgency)
  - Unique mechanic: Something different from normal play
  - Exclusive rewards: Available only during the event (FOMO)
  - Leaderboard: Competitive element for engagement
  - Progression: Clear milestones within the event

COMMUNITY MANAGEMENT:
  - Social media presence (daily/weekly posts)
  - Community Discord or forum
  - Regular developer updates (transparency builds trust)
  - Respond to bug reports quickly
  - Feature community content and player achievements
  - Sneak peeks and teasers for upcoming content

GAME HEALTH MONITORING:
  - Daily KPI dashboard review
  - Retention trend monitoring
  - Revenue trend monitoring
  - Crash rate and performance monitoring
  - Player sentiment analysis (reviews, social media)
  - Competitive intelligence (what are competitors doing)
```

## Practice Exercises

### Exercise 1: Core Loop Analysis
Play 5 top-grossing mobile games for 30 minutes each. Map their core loop exactly. Identify what creates the desire to play "one more time."

### Exercise 2: FTUE Audit
Install 3 games you've never played. Record your first 5 minutes. Note every moment of delight or frustration. How quickly did you understand the core loop?

### Exercise 3: Monetization Mapping
For a game concept, design 3 different monetization models (IAP-only, ad-only, hybrid). Estimate which would generate the most revenue and which would create the best player experience.

### Exercise 4: Retention Hook Design
Design a Day 1, Day 7, and Day 30 retention strategy for your game. What specific design elements bring players back at each interval?

### Exercise 5: A/B Test Design
Design 3 A/B tests for a mobile game's onboarding. For each, state the hypothesis, control, variant, primary metric, and minimum sample size.

### Exercise 6: Session Design
Design a complete 5-minute mobile session that includes: re-engagement, core gameplay, reward, progress visibility, and a hook for the next session.


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Mobile Game Designer deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with mobile game designer for a mid-size project."

**Output:** A complete mobile game designer framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
