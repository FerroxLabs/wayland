---
name: spaced-repetition
description: |
  Creates spaced repetition schedules using the Leitner system or SM-2 algorithm for long-term memory retention. Produces a concrete review schedule with interval recommendations calibrated to the learner's material and available time -- not a description of how spaced repetition works.
  Use when a learner asks to create a review schedule, build a spaced repetition plan, optimize memorization, or set up a flashcard review system.
  Do NOT use for flashcard content creation (use `flashcard-generation`), for general study planning (use `study-plan`), or for exam-specific preparation (use `exam-prep-plan`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "spaced-repetition study-skills active-recall step-by-step"
  category: "education"
  subcategory: "self-learning"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Spaced Repetition

## When to Use

Use this skill when the learner's primary need is scheduling -- deciding *when* to review material, not *what* to review or *how* to learn it initially.

**Trigger scenarios:**

- Learner asks to create a spaced repetition schedule, review calendar, or interval plan for memorizing a specific body of material
- Student wants to set up a Leitner box system for physical flashcards or configure SM-2 parameters in a digital tool
- User has a defined card count (e.g., 300 vocabulary words, 150 anatomy terms, 80 historical dates) and wants a concrete review cadence
- User asks how often to review cards, when to retire mastered cards, or how to handle cards they keep forgetting
- User wants to integrate flashcard review into a fixed daily time budget (10-30 minutes) and needs a sustainable pace calculation
- User is experiencing review debt -- their due-card pile has grown unmanageable -- and needs a recovery protocol
- User wants to track progress toward a mastery target (e.g., 90% retention before an exam or certification)

**Do NOT use when:**

- User wants to *create* the flashcard content itself -- use `flashcard-generation`, which handles question formulation, cloze deletion design, and card formatting
- User needs a multi-technique study plan covering reading, practice problems, summarization, and review together -- use `study-plan`
- User is preparing for a specific upcoming exam and needs to prioritize high-yield topics, simulate test conditions, and manage anxiety -- use `exam-prep-plan`
- User wants to understand *how* spaced repetition works conceptually or the neuroscience behind the forgetting curve -- this skill produces schedules, not explanations
- User is designing a spaced repetition curriculum or course for *other* learners -- this skill targets individual learner scheduling, not instructional design
- User needs help with active recall techniques like the Feynman Technique, retrieval practice, or elaborative interrogation -- these involve content engagement, not interval scheduling

---

## Process

### Step 1: Gather the Four Critical Parameters

Before producing any schedule, collect complete information on these four dimensions. If any is missing, ask -- do not assume.

- **Material type:** Vocabulary (word-to-definition), factual associations (capital cities, chemical formulas, historical dates), procedural facts (medical drug dosages, legal statutes, code syntax), or concept recognition (anatomy diagrams, circuit symbols). Material type determines card format and tolerable review speed.
- **Total item count:** Get a specific number. If the learner says "a lot," prompt them to estimate: a typical textbook chapter yields 30-80 card-worthy facts; a foreign language A1-B1 vocabulary list is typically 500-2000 words; a medical licensing exam deck (e.g., USMLE Step 1) may contain 10,000-20,000 cards.
- **Daily time budget:** Ask for a realistic number in minutes, not a wish. 10-15 minutes/day is achievable for most learners long-term; 30-45 minutes is sustainable for motivated learners with clear deadlines; 60+ minutes/day indicates a high-intensity cram phase that should not run longer than 4-6 weeks.
- **Timeframe and deadline:** Distinguish between "I have an exam in 6 weeks" (fixed deadline, back-calculate pace) and "I want to maintain this vocabulary long-term" (ongoing maintenance, optimize for steady state). These produce fundamentally different schedules.
- **Current familiarity:** Ask if the material is entirely new, partially known, or review of previously learned content. Partially known material can skip the first 1-day review interval for known cards, dramatically reducing early load.

### Step 2: Select and Configure the Algorithm

Choose one algorithm based on the learner's context, then configure its specific parameters. Do not offer all three as equal choices -- recommend based on the situation.

**Leitner 5-Box System (recommend when):**
- Learner uses physical paper flashcards
- Learner is new to spaced repetition and needs a simple, tactile mental model
- Total card count is under 300 (above this, box management becomes unwieldy without software)
- Review intervals: Box 1 = daily, Box 2 = every 2 days, Box 3 = every 4 days, Box 4 = every 7 days, Box 5 = every 14 days (retire or move to "mastered" pile after Box 5)
- Movement rules: correct recall moves card up one box; incorrect recall sends card back to Box 1 regardless of current position

**SM-2 Algorithm (recommend when):**
- Learner uses Anki, Mnemosyne, or any app that implements SM-2
- Card count exceeds 300 or the learning horizon exceeds 3 months
- Key parameters: initial ease factor (EF) = 2.5; minimum EF = 1.3; maximum EF = 3.0; first two intervals are fixed at 1 day and 6 days; subsequent intervals = previous interval × current EF; EF adjusts per card based on recall quality ratings (0-5 scale: 0-1 resets to day 1, 2 keeps interval, 3 keeps interval with EF decrease of 0.14, 4 keeps EF, 5 increases EF by 0.1)
- For Anki specifically: set new cards/day to match the pace calculation from Step 3; set maximum reviews/day to 150-200; leave interval modifier at 100% initially; graduating interval 1 day, easy interval 4 days
- SM-2 produces longer intervals for well-recalled cards and shorter intervals for poorly recalled cards -- this self-calibration is its key advantage over Leitner

**Simplified Fixed-Interval Schedule (recommend when):**
- Learner explicitly refuses to track algorithms or use an app
- Material has a hard deadline (exam in 4-6 weeks) and the learner wants to review every item a fixed number of times
- Intervals: Day 0 (learn), Day 1, Day 3, Day 7, Day 14, Day 30 -- six total reviews brings an item to long-term memory under normal conditions
- This schedule does not self-adapt, so all items get the same treatment regardless of difficulty -- acceptable for exam prep, suboptimal for long-term retention

**FSRS Algorithm (recommend when advanced user mentions it):**
- FSRS (Free Spaced Repetition Scheduler) is the modern replacement for SM-2, now available in Anki 23.10+. It models memory stability and retrievability directly rather than ease factors.
- For users who have used Anki for 1000+ reviews, recommend enabling FSRS and running the optimizer, which calibrates the 17 FSRS parameters to the individual learner's historical performance.
- Key FSRS settings to specify: desired retention (recommend 0.85-0.90 for most learners, 0.90-0.95 for medical/high-stakes material), enable FSRS in Anki preferences, run optimizer monthly.

### Step 3: Calculate the Sustainable Daily Pace

This step prevents the most common spaced repetition failure mode: introducing cards faster than they can be reviewed.

**Core formula:**
- Minutes available for *reviews only* = total daily minutes × 0.65 (leave 35% for new card learning, which takes longer per item)
- Maximum review cards per session = (minutes × 60 seconds) / 10 seconds per card (use 10 seconds as the median review time for trained learners; use 15-20 seconds for beginners or complex material)
- Example: 20 minutes total × 0.65 = 13 minutes for reviews = 780 seconds / 10 = 78 review cards maximum

**Steady-state review load calculation:**
- Each new card added today will generate approximately 3-4 reviews in the first 30 days (across its interval chain)
- At N new cards/day, review load at steady state ≈ N × 3.5 reviews/day (Leitner) or N × 2-3 reviews/day (SM-2, because intervals grow longer faster)
- Solve for N: N = max_reviews / 3.5
- Example: 78 max reviews / 3.5 = 22 new cards/day maximum at steady state. For safety, use 80% of this: 17-18 new cards/day

**Deadline back-calculation:**
- If deadline is fixed, calculate: required pace = total cards / (days until deadline × 0.6) -- the 0.6 factor reserves 40% of days as buffers for catch-up, illness, and heavy review days
- If required pace exceeds the sustainable pace, the learner must choose: extend the deadline, reduce the card count (triage to highest-priority items), or accept lower retention for low-priority cards

**Cap new cards at hard limits:**
- Beginner (first month of spaced repetition): 10-15 new cards/day maximum regardless of time budget -- the brain needs time to consolidate the practice habit
- Intermediate (3+ months of experience): 15-25 new cards/day is typical; 30+ is aggressive
- High-intensity exam prep mode: 30-50 new cards/day is possible for 4-6 weeks but requires 45-60 minutes/day and is not sustainable indefinitely

### Step 4: Build the Day-by-Day Schedule

Construct a concrete schedule showing the first 7-14 days in daily detail, then weekly summaries for the remainder. Vague schedules are not followed.

- **Days 1-3:** Introduce the first batch of new cards only. Do not introduce more new cards than the learner can review the following day. Keep total session time under the stated budget.
- **Days 4-7:** New card introduction continues at the calculated daily pace. Review load begins building. First cards should be reaching Box 2 (Leitner) or their 6-day interval (SM-2). Show the review arithmetic explicitly.
- **Week 2:** The "review debt cliff" typically hits in Week 2 -- this is when learners using no schedule abandon the system. Show that total daily time remains stable or decreases as cards graduate to longer intervals, even as new cards continue to be added.
- **Week 3+:** Most of the initial batch has graduated to 4-7+ day intervals, substantially reducing daily review load for those cards. This is when the system starts feeling sustainable.
- Mark weekends or low-energy days explicitly: reduce new cards to zero on those days, review only Box 1 and Box 2 / due cards. Protecting against missed sessions is more important than optimal pacing.
- Include a "no new cards" phase in the final week before any deadline: spend that week reviewing only due and overdue cards to consolidate everything already in the system.

### Step 5: Design the Self-Assessment Protocol

Without clear recall-quality criteria, learners rate their performance inconsistently, corrupting the interval calculation. Provide explicit, behavioral criteria.

**For Leitner:**
- Instant and effortless recall before flipping the card (under 3 seconds, no hesitation): advance to next box
- Recalled correctly but required retrieval effort (3-10 seconds, slight uncertainty): stay in current box
- Recalled incorrectly, recalled the wrong answer, or could not recall at all: return to Box 1 immediately, no exceptions
- Do not allow "close enough" grading -- partial recall (knew part of the answer but not all required elements) counts as a miss

**For SM-2 / Anki:**
- Again (0): Did not recall, or remembered only after seeing the answer -- reset to 1 day
- Hard (1-2): Recalled with significant effort, very slow, or with a minor error -- interval reduces (EF drops by 0.14)
- Good (3): Recalled correctly with moderate effort, typical response time -- interval stays; this is the default for satisfactory recall
- Easy (4-5): Recalled instantly and effortlessly -- interval increases beyond normal; use sparingly. Overuse of Easy inflates intervals and leads to forgetting later.
- Instruct learners: when in doubt between ratings, choose the lower one. It is better to review a card slightly too early than to lose it.

**Accuracy tracking:**
- Target: 85-92% correct on any given review session. Below 85% means the learning pace is too aggressive or the material is harder than estimated. Above 95% means cards are being reviewed too frequently (over-reviewing wastes time).
- Track weekly: count total cards reviewed and cards answered incorrectly. Compute percentage. If below 85% for two consecutive weeks, apply the reduction protocol in Step 6.

### Step 6: Build the Feedback and Adjustment Protocol

A schedule that does not adapt to real performance is a calendar, not a learning system. Include explicit decision rules.

**Weekly review audit (5 minutes, Sunday or end-of-week):**
- Count cards in each box (Leitner) or check the Anki statistics deck progress screen (reviews per day, retention rate, card maturity histogram)
- Compare actual box distribution to projected box distribution from the schedule
- If lagging by more than one week: do not panic. Pause new cards for 3-5 days and clear the overdue pile first.

**If accuracy drops below 80% for one week:**
- Immediately reduce new cards by 50% (e.g., from 15/day to 8/day)
- Spend two extra minutes per session on the most frequently missed cards -- write a mnemonic, create a new example sentence, or strengthen the encoding before re-entering them into the rotation
- If accuracy does not recover within 10 days, consider whether the card format itself is the problem (e.g., cards are too complex or ambiguous -- consult `flashcard-generation`)

**If review time exceeds budget by 20%+ for three consecutive days:**
- Do not review Box 4 and Box 5 cards (Leitner) or cards with intervals > 21 days (SM-2) -- they are the most stable and will survive a brief delay without significant retention loss
- Prioritize Box 1 and Box 2 / short-interval cards -- these are at the highest risk of being forgotten
- Pause all new cards until review time returns to budget

**End-of-deadline assessment:**
- One week before any fixed deadline, conduct a full self-test on all cards in the system
- Cards missed in the full self-test go immediately to Box 1 / get reset to 1-day interval -- this is the final consolidation phase
- Reduce new card introduction to zero in this final week

---

## Output Format

```
## Spaced Repetition Schedule: [Subject / Material Name]

**Material:** [Specific description: e.g., "Spanish A2 vocabulary -- nouns and verbs, word + gendered article + example sentence"]
**Total Items:** [Exact number]
**Daily Time Budget:** [Minutes]
**Algorithm:** [Leitner 5-Box / SM-2 (Anki) / FSRS (Anki 23.10+) / Simplified Fixed-Interval]
**Starting Familiarity:** [New / Partially known (estimate % known) / Review]
**Target:** [Mastery by [date] / Ongoing maintenance at [X]% retention]

---

### Pace Calculation

| Parameter | Value | Calculation |
|-----------|-------|-------------|
| Daily time budget | [X] min | Given |
| Time available for reviews | [X] min | Budget × 0.65 |
| Time available for new cards | [X] min | Budget × 0.35 |
| Max review cards/session | [N] | Review minutes × 60 / 10 sec |
| Sustainable new cards/day | [N] | Max reviews / 3.5 (Leitner) or / 2.5 (SM-2) |
| Required pace for deadline | [N] | Total cards / (days × 0.60) |
| **Recommended new cards/day** | **[N]** | Lower of sustainable vs. required |
| Days to introduce all cards | [N] | Total cards / new cards per day |

### Algorithm Configuration

**[Algorithm Name] Settings:**
[For Leitner:]
- Box 1: Review daily -- new cards and all missed cards
- Box 2: Review every 2 days -- e.g., Tuesday/Thursday/Saturday
- Box 3: Review every 4 days -- e.g., Monday/Friday
- Box 4: Review every 7 days -- e.g., Sunday
- Box 5: Review every 14 days -- mastered; retire after second successful Box 5 review

[For SM-2 / Anki:]
- New cards per day: [N]
- Maximum reviews per day: [N] (set in Anki deck options)
- Starting ease: 250% (Anki default = 2.5 EF)
- Graduating interval: 1 day
- Easy interval: 4 days
- Interval modifier: 100%
- Leech threshold: 8 lapses (flag for card redesign, not just review)

[For FSRS:]
- Desired retention: [X]% (recommended 87-90% for standard; 92% for high-stakes)
- FSRS weights: run optimizer after 1000+ reviews
- Maximum interval: 365 days (standard)

### Daily Schedule (Weeks 1-2, Day-by-Day)

| Day | Day of Week | New Cards | Reviews Due | Est. Time | Running Total |
|-----|-------------|-----------|-------------|-----------|---------------|
| 1 | [Mon] | [N] | 0 | [X min] | [N] |
| 2 | [Tue] | [N] | [N] | [X min] | [N] |
| 3 | [Wed] | [N] | [N] | [X min] | [N] |
| 4 | [Thu] | [N] | [N] | [X min] | [N] |
| 5 | [Fri] | [N] | [N] | [X min] | [N] |
| 6 | [Sat] | 0 (rest day) | [N due] | [X min] | [N] |
| 7 | [Sun] | 0 (rest day) | [N due] | [X min] | [N] |
| 8 | [Mon] | [N] | [N] | [X min] | [N] |
| 9 | [Tue] | [N] | [N] | [X min] | [N] |
| 10 | [Wed] | [N] | [N] | [X min] | [N] |
| 11 | [Thu] | [N] | [N] | [X min] | [N] |
| 12 | [Fri] | [N] | [N] | [X min] | [N] |
| 13 | [Sat] | 0 | [N due] | [X min] | [N] |
| 14 | [Sun] | 0 | [N due] | [X min] | [N] |

*Note: "Reviews Due" is a projection assuming ~75% of cards advance on first review. Actual numbers depend on performance.*

### Weekly Summary (Weeks 3+)

| Week | New Cards Introduced | Cumulative Total | Avg Daily Reviews | Est. Daily Time |
|------|---------------------|-----------------|-------------------|-----------------|
| 3 | [N] | [N] | [N] | [X min] |
| 4 | [N] | [N] | [N] | [X min] |
| 5 | [N] | [N] | [N] | [X min] |
| ... | ... | ... | ... | ... |

### Projected Box / Maturity Distribution (End of Each Week)

| Week | Box 1 / <1d | Box 2 / 1-6d | Box 3 / 7-14d | Box 4 / 14-21d | Box 5+ / >21d | Total |
|------|-------------|--------------|---------------|----------------|---------------|-------|
| 1 | [N] | [N] | [N] | [N] | [N] | [N] |
| 2 | [N] | [N] | [N] | [N] | [N] | [N] |
| 3 | [N] | [N] | [N] | [N] | [N] | [N] |
| 4 | [N] | [N] | [N] | [N] | [N] | [N] |

### Self-Assessment Protocol

**Leitner grading criteria:**
| Rating | Behavioral definition | Action |
|--------|----------------------|--------|
| Instant recall | Answer produced in < 3 sec, no hesitation, full answer | Advance one box |
| Effortful recall | Answer produced in 3-10 sec, or required partial prompting | Stay in current box |
| Miss | Wrong answer, incomplete answer, or no answer after 10+ sec | Return to Box 1 |

**SM-2 / Anki grading criteria:**
| Button | When to use | EF effect |
|--------|------------|-----------|
| Again | Did not recall; recalled only after seeing answer | Reset to 1 day; EF -0.20 |
| Hard | Recalled with significant effort; slow or shaky | EF -0.14; interval × 1.2 |
| Good | Recalled correctly with normal effort | No EF change; interval × EF |
| Easy | Recalled instantly, effortlessly | EF +0.10; interval × EF × 1.3 |

*When in doubt between two ratings, choose the lower one.*

### Milestones and Checkpoints

| Checkpoint | Metric | On-Track Indicator | Action If Behind |
|------------|--------|--------------------|------------------|
| End of Week 1 | [N] cards introduced; accuracy [X]% | Box 2+: [N]+ cards | Reduce new cards to [N]/day |
| End of Week 2 | [N] cards; review load stable or falling | <20% in Box 1 | Pause new cards 3 days |
| Mid-point | [N] cards; accuracy 85%+ | [N]+ cards in Box 3+ | Redesign worst-performing cards |
| Pre-deadline | All cards introduced; no new cards | 80%+ in Box 3+ | Run emergency review sprint |
| Deadline | Full self-test | [X]% correct | -- |

### Adjustment Rules

| Trigger | Action |
|---------|--------|
| Accuracy < 80% for 1 week | Cut new cards by 50%; add 3 min to review session |
| Accuracy < 70% | Stop new cards entirely; review-only mode until 80% restored |
| Session time > budget × 1.2 | Skip Box 4-5 / mature cards; review Box 1-3 only |
| Missed 2+ consecutive days | Catch-up protocol: review only cards in Box 1-2 / overdue < 14 days first |
| Accuracy consistently > 95% | Increase new cards by 20%; check if cards are too easy |
| Specific card missed 5+ times | Flag as leech; redesign the card before next review |
```

---

## Rules

1. **Never introduce new cards faster than the existing review queue can be cleared.** Calculate the review burden before specifying a daily new-card count. If the learner's stated time budget cannot sustain the pace needed to cover all material before their deadline, say so explicitly and offer a triage strategy -- do not silently produce an unworkable schedule.

2. **Always reset incorrectly recalled cards to the shortest interval, no exceptions.** Letting a "close enough" recall slide to a longer interval is the single most common reason retention fails. The Leitner rule is binary: either the full, correct answer was produced before flipping the card, or it goes back to Box 1.

3. **Never recommend reviewing all cards every day.** A review session where every card is reviewed regardless of interval is massed practice, not spaced repetition. It produces the "fluency illusion" -- familiarity from repeated same-day exposure that evaporates within a week.

4. **Always include specific interval numbers.** "Review later," "review again soon," or "review periodically" are not instructions. Every recommendation must state explicit days: Box 1 every day, Box 2 every 2 days, SM-2 first interval 1 day, second interval 6 days.

5. **Account for review load accumulation.** Day 30 of a 200-card deck has dramatically more reviews due than Day 5. Show the learner this math explicitly in the schedule. The most common reason people abandon spaced repetition is hitting the unexpected review cliff in Week 2-3 without having been warned.

6. **Apply the leech threshold.** Any card missed 5 or more times is a leech -- it is consuming disproportionate review time while not entering long-term memory. The correct response is not to review it more aggressively. The correct response is to redesign the card: break it into smaller sub-cards, add a mnemonic hook, change the question direction, or add an image. Refer to `flashcard-generation` for card redesign.

7. **Back-calculate from deadlines.** If the learner has a fixed exam date, calculate whether all cards can reach the 14+ day interval before that date -- cards in this maturity range have a significantly higher probability of being retained at test time. If the math does not work, communicate this clearly and help prioritize: which 80% of the material is highest yield?

8. **Distinguish maintenance mode from acquisition mode.** A learner building a new vocabulary list (acquisition) needs a different schedule from a learner maintaining a vocabulary built over the past year (maintenance). Maintenance schedules for stable long-term memory typically require only 5-10 minutes/day for up to 1000 mature cards in Anki/FSRS.

9. **Never let the final week before a deadline include new card introductions.** The last 5-7 days should be a consolidation phase: zero new cards, clear all overdue reviews, run a full self-test, and reset any failed cards to short intervals. Introducing new cards in the final week crowds out review of cards already in the system and typically produces a net negative outcome.

10. **Always include a missed-day recovery protocol.** Life disrupts schedules. Missing 1-2 days is normal; missing 5+ days produces a review backlog that, if not managed correctly, causes learners to abandon the system entirely. The protocol: on return after 2+ missed days, do not attempt to review everything at once. Sort by interval length and review the shortest-interval (most vulnerable) cards first, capping total session time at 1.5× the normal budget. Resume normal pace the following day.

---

## Edge Cases

### Very Large Card Sets (500+ Items)

Running 500+ cards simultaneously as one deck creates an unmanageable review load within 3 weeks. At 20 new cards/day and 3.5 reviews per card per month, 500 cards generate 58 reviews/day at steady state -- a 10-minute review burden that is sustainable, but only once steady state is reached. The problem is the transition period (Days 14-30), where review load spikes before cards start graduating to long intervals.

**Handling protocol:** Subdivide into themed subdecks of 50-100 cards. Sequence subdecks by priority (highest-yield material first). Introduce Subdeck 1 and bring 80% of cards to Box 3+ before starting Subdeck 2. This staggers the review load. For Anki users, use the deck hierarchy feature: parent deck sets the daily new-card limit, child decks organize by topic. Set a global new-card limit of 20/day regardless of how many subdecks are active.

### Learner Already Using Anki or a SM-2 App

Do not produce a manual Leitner schedule for an Anki user -- produce configuration instructions and a deck setup checklist instead.

**Recommended Anki settings for a new deck:**
- New cards/day: calculated from Step 3 pace formula
- Maximum reviews/day: minimum 150, ideally uncapped or set to 9999
- Learning steps: 10m 1d (two learning steps before the card enters the review queue)
- Graduating interval: 1 day
- Easy interval: 4 days
- Starting ease: 250%
- Leech threshold: 8 lapses
- Leech action: suspend (not tag only -- suspended cards are invisible and will not keep wasting review time until redesigned)

If the learner has 6+ months of Anki history and 1000+ reviews, recommend enabling FSRS: go to Preferences → Review → Enable FSRS → optimize after enabling. Set desired retention to 0.87 initially and run the optimizer monthly.

### Material Poorly Suited to Isolated Fact Cards

Medical physiology mechanisms, legal reasoning, mathematical proof techniques, programming architecture patterns, and historical causation chains resist reduction to flashcard format. Forcing them into isolated Q&A cards produces superficial recall that fails on application tasks.

**Alternative scheduling approach:** Apply the spacing principle to practice problems rather than flashcards. Create a log of problem types and schedule re-exposure using the same intervals as Box 3-4 (every 4-7 days). After each practice session, rate performance: solved correctly on first attempt (advance interval), solved with hints (keep interval), could not solve (reset to 3-day interval). This produces spaced practice rather than spaced recall -- the scheduling math is identical, the card format is different. Combine with a small set of definition/formula flashcards for the factual anchors of the conceptual material.

### Learner With an Existing Review Debt (the "Buried in Cards" Scenario)

An Anki user who has let their due pile grow to 300-500+ overdue cards presents a specific recovery problem. Attempting to clear the backlog in one or two sessions is overwhelming and often produces low-quality rushed reviews that corrupt ease factors.

**Recovery protocol:**
1. Sort overdue cards by interval length (ascending) -- shortest-interval cards are most vulnerable and should be reviewed first
2. Set a hard cap of 100-150 reviews per day during recovery, even if more cards are overdue
3. Suspend all new cards during recovery -- zero introductions until the overdue queue is under 50 cards
4. If using Anki, use the "Forget" function (not "Delete") on the most severely overdue cards (>60 days overdue and originally had intervals < 14 days) -- these effectively need to be re-learned, and artificially long intervals from the backlog review will be misleading
5. Recovery typically takes 5-10 days for a 300-card backlog at 100 reviews/day
6. Once cleared, immediately calculate a sustainable daily pace to prevent re-accumulation

### Multiple Subjects With Separate Card Decks

A medical student reviewing pharmacology, anatomy, and pathology simultaneously, or a language learner studying two languages at once, faces interleaving and prioritization challenges.

**Handling protocol:** Do not interleave within a single Anki session by default -- context switching between unrelated subjects within one sitting produces interference. Instead, schedule subjects in sequence within the day: pharmacology first (highest priority, most demanding cognitive load), then anatomy, then pathology. Each subdeck gets its own daily new-card budget calculated proportionally to its total card count and relative deadline urgency.

If using Leitner with physical cards, use separate physical boxes per subject with different colored card sets. Review all subjects' Box 1 cards daily (this is non-negotiable -- Box 1 represents the most fragile memories). Rotate Box 2-5 reviews by subject on alternating days to keep session length under budget.

### Learner With Irregular or Unpredictable Daily Schedules

Shift workers, traveling professionals, or caregivers cannot commit to the same 20-minute daily window. A rigid day-by-day schedule will be abandoned.

**Handling protocol:** Build the schedule around a weekly time budget rather than a daily one. Example: 20 minutes/day × 7 = 140 minutes/week. Designate 3-4 primary review days (ideally evenly spaced across the week, not consecutive) as review-heavy days (30 minutes each) and use remaining days opportunistically for Box 1 / shortest-interval cards only (5-10 minutes). Use the Anki mobile app or a physical card wallet for commute-time review. The key constraint: Box 1 / 1-day interval cards *must* be reviewed within 24-36 hours or they are effectively lost -- build the schedule so that at least a 5-minute mini-session is possible on every single calendar day, even if the full session is skipped.

### High-Stakes Exam with Insufficient Lead Time

A learner who comes to the schedule 3 weeks before an exam with 400 unseen cards has a mathematical problem: 400 cards / 21 days = 19 new cards/day. At 19 new cards/day, steady-state review load exceeds 66 cards/day (19 × 3.5), requiring approximately 18 minutes of review time -- achievable. But cards introduced in Week 3 will only reach 1-week maturity by exam day, which is below the 14-day threshold for reliable long-term encoding.

**Handling protocol:**
1. Triage immediately: divide the 400 cards into Tier 1 (high-yield, definitely on exam) and Tier 2 (lower probability) -- aim for Tier 1 ≤ 200 cards
2. Schedule Tier 1 cards to be fully introduced by Day 14, leaving a 7-day consolidation window
3. Introduce Tier 2 cards only if Tier 1 accuracy is 85%+ and there is remaining time budget
4. In the final week: zero new cards, clear all overdue, run a full self-test on Tier 1
5. Accept explicitly that Tier 2 cards may not reach durable encoding -- superficial review of them is better than not reviewing at all, but set realistic expectations

---

## Example

**Input:** "I'm learning 300 Japanese kanji readings using physical flashcards. I have 8 weeks before a placement test and can study for 25 minutes a day. I know about 50 of the kanji already."

**Output:**

## Spaced Repetition Schedule: Japanese Kanji Readings (Placement Test Prep)

**Material:** 300 Japanese kanji -- each card has: kanji on front; onyomi reading + kunyomi reading + one example word on back
**Total Items:** 300 cards (250 new + 50 partially known -- known cards begin in Box 2)
**Daily Time Budget:** 25 minutes
**Algorithm:** Leitner 5-Box System (physical flashcards)
**Starting Familiarity:** ~50 cards already known (Box 2 start), 250 new
**Target:** 90%+ retention across all 300 kanji by Day 56 (8 weeks)

---

### Pace Calculation

| Parameter | Value | Calculation |
|-----------|-------|-------------|
| Daily time budget | 25 min | Given |
| Time available for reviews | 16 min | 25 × 0.65 |
| Time available for new cards | 9 min | 25 × 0.35 |
| Max review cards/session | 80 | 16 min × 60 / 12 sec* |
| Sustainable new cards/day | 23 | 80 / 3.5 |
| Required pace for deadline | 14 | 250 new / (56 days × 0.60) = 7.4, rounded up with buffer |
| **Recommended new cards/day** | **14** | Required pace is well within sustainable limit |
| Days to introduce all 250 new cards | 18 days | 250 / 14 = 17.8 |

*Kanji recall (reading + meaning) takes slightly longer than vocabulary -- 12 sec used instead of 10 sec.*

The 50 known kanji begin in Box 2, generating a small review load from Day 1. This is factored into the review estimates below.

---

### Algorithm Configuration: Leitner 5-Box System

| Box | Review Frequency | Review Trigger Days | Notes |
|-----|-----------------|--------------------|-|
| Box 1 | Daily | Every session | All new cards and all misses land here |
| Box 2 | Every 2 days | Mon, Wed, Fri, Sun | 50 known kanji start here |
| Box 3 | Every 4 days | Mon, Fri | Intermediate retention; test kun + on readings |
| Box 4 | Every 7 days | Sunday | Weekly review; test production (write from memory) |
| Box 5 | Every 14 days | 1st and 15th of each week block | Near-mastered; full kanji+reading+example word |

**Physical box setup:** Label 5 cardboard boxes or use 5 sections of a card binder with divider tabs. Write the review schedule on an index card kept in Box 1. Mark cards with colored corner dots (red = Box 1, orange = Box 2, yellow = Box 3, green = Box 4, blue = Box 5) to enable fast sorting.

---

### Daily Schedule: Weeks 1-2

| Day | Day | New Cards | Box 1 Reviews | Box 2 Reviews | Box 3+ Reviews | Est. Time | Running Total |
|-----|-----|-----------|--------------|--------------|----------------|-----------|---------------|
| 1 | Mon | 14 | 0 | 25* | 0 | 18 min | 264 |
| 2 | Tue | 14 | 14 | 0 | 0 | 9 min | 278 |
| 3 | Wed | 14 | 28 | 37 | 0 | 24 min | 292 |
| 4 | Thu | 14 | 35 | 0 | 0 | 11 min | 300 |
| 5 | Fri | 0 (rest) | 35 | 37 | 22 | 25 min | 300 |
| 6 | Sat | 14 | 35 | 0 | 0 | 12 min | 314 |
| 7 | Sun | 0 (rest) | 30 | 37 | 14 | 22 min | 314 |
| 8 | Mon | 14 | 30 | 44 | 22 | 25 min | 328 |
| 9 | Tue | 14 | 28 | 0 | 0 | 10 min | 342 |
| 10 | Wed | 0 (rest) | 28 | 44 | 22 | 25 min | 342 |
| 11 | Thu | 14 | 25 | 0 | 0 | 9 min | 356 |
| 12 | Fri | 14 | 25 | 44 | 28 | 25 min | 370 |
| 13 | Sat | 0 (rest) | 22 | 0 | 0 | 7 min | 370 |
| 14 | Sun | 14 | 22 | 44 | 35 | 25 min | 384 |

*Day 1 Box 2 = the 50 pre-known kanji reviewed on their first even-day trigger.

*Note: "Rest days" for new cards are not optional rest days -- reviews still happen. These are days where the review load from accumulating boxes fills the time budget without adding new cards.*

---

### Weekly Summary: Weeks 3-8

| Week | New Cards This Week | Cumul. Total | Avg Daily Reviews | Avg Daily Time |
|------|--------------------|--------------|--------------------|----------------|
| 3 | 42 | ~270 | 68 | 22 min |
| 4 (intro complete) | 8 (to 300) | 300 | 72 | 22 min |
| 5 | 0 (consolidation) | 300 | 60 | 19 min |
| 6 | 0 (consolidation) | 300 | 50 | 16 min |
| 7 | 0 (consolidation) | 300 | 38 | 13 min |
| 8 (pre-test) | 0 (consolidation) | 300 | 30 + full self-test | 25 min |

*Review load drops in Weeks 5-8 because the majority of cards graduate to Box 4 and Box 5 intervals. This is normal and expected -- do not fill the freed time with new cards.*

---

### Projected Box Distribution (End of Each Week)

| Week | Box 1 | Box 2 | Box 3 | Box 4 | Box 5 | Total |
|------|-------|-------|-------|-------|-------|-------|
| 1 | 25 | 55 | 18 | 5 | 0 | 264* |
| 2 | 22 | 60 | 45 | 22 | 8 | 300 |
| 3 | 18 | 50 | 60 | 45 | 27 | 300 |
| 4 | 15 | 40 | 50 | 70 | 50 | 300** |
| 5 | 10 | 30 | 40 | 80 | 90 | 300 |
| 6 | 8 | 22 | 30 | 70 | 120 | 300 |
| 7 | 6 | 18 | 24 | 52 | 150 | 300 |
| 8 | 8 | 15 | 20 | 37 | 165 | 300 |

*Week 1 total < 300 because introduction continues through Week 4.
**All 300 introduced by end of Week 4; 50 pre-known cards included throughout.

---

### Self-Assessment Protocol for Kanji Cards

| Rating | Behavioral criterion | What to test before flipping | Action |
|--------|---------------------|------------------------------|--------|
| Instant recall | Produced the primary onyomi reading and one example word aloud in under 3 seconds | Say "this kanji is read [X] as in [word]" before flipping | Advance one box |
| Effortful recall | Produced the correct reading in 4-10 seconds, or knew the reading but forgot the example word | Got the core reading but slow or incomplete | Stay in current box |
| Miss | Could not produce the reading, produced the wrong reading, or confused with another similar kanji | Any incorrect or absent response | Return to Box 1 |

**Additional protocol for kanji specifically:** If you confuse two similar-looking kanji (e.g., 土 and 士), return *both* cards to Box 1. Confusion between similar items must be resolved together, not independently.

---

### Milestones and Checkpoints

| Checkpoint | Target | On-Track Indicator | Action If Behind |
|------------|--------|--------------------|-----------------|
| End Week 1 | ~115 cards introduced; accuracy 80%+ | Fewer than 30 cards in Box 1 | Reduce new cards to 10/day |
| End Week 2 | 200 cards introduced; accuracy 82%+ | 20+ cards in Box 3 or higher | Pause new cards 3 days |
| End Week 3 | 260 cards; review load stable | Under 25 cards in Box 1 | Redesign most-missed cards |
| End Week 4 | All 300 introduced; Box 4 contains 60+ | Average daily time under 22 min | Extend consolidation by 1 week |
| End Week 6 | 100+ cards in Box 5 | Self-test: 20 random cards → 17+ correct | Increase Box 4/5 review frequency slightly |
| Week 8, Day 1 | Full self-test all 300 cards | 270+ correct (90%) | Reset all missed cards; emergency review sprint |

---

### Self-Assessment: Full Week 8 Test Protocol

On Day 50 (6 days before the test), pull all 300 cards from all boxes and shuffle them. Work through all 300 without access to Box numbers or any hints. Grade strictly using the instant-recall criterion.

- Score 270+ correct (90%+): System worked. Review only the missed cards daily through test day.
- Score 240-269 correct (80-89%): Identify the 30-60 weakest cards. Run daily Box 1-style review on those cards only for the remaining 6 days.
- Score below 240 (<80%): Triage. Identify the 50 highest-frequency/highest-yield kanji among the misses. Focus exclusively on those for the remaining 6 days. Accept that the lower-frequency kanji are not fully consolidated.

---

### Adjustment Rules

| Trigger | Action |
|---------|--------|
| Accuracy < 80% for 1 week | Cut new cards to 7/day; add 3 minutes of mnemonic work per session |
| Accuracy < 70% for any single session | Stop new cards entirely; review-only for 5 days minimum |
| Daily review time exceeds 25 min × 1.2 (>30 min) | Skip Box 4 and Box 5 reviews; review Box 1-3 only |
| Missed 2+ consecutive days | Clear Box 1 and Box 2 only first day back; resume full schedule Day 2 |
| Any kanji missed 5+ times | Set it aside; create a new memory hook (stroke mnemonic, context sentence, visual story) before re-entering it |
| Accuracy consistently above 95% | Increase new cards to 18/day; check if cards are too simple |

---

### Special Notes for Japanese Kanji

- If a kanji has multiple common readings, prioritize the onyomi (Chinese-derived reading) first and add kunyomi as a secondary fact on the same card -- do not create separate cards for each reading until Box 3 (once the core reading is stable)
- Cards that share a radical (e.g., all 氵(water radical) kanji) are more likely to interfere with each other -- when you add a new kanji, check Box 1 for similar-looking cards and review them back-to-back to force discrimination
- Week 7 is the recommended time to begin production practice: take 20 Box 4-5 cards per session and attempt to write the kanji from memory (not just recognize it). This does not replace the Leitner schedule but supplements it for the writing component of the placement test.
