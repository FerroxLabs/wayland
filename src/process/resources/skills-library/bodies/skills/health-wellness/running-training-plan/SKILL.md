---
name: running-training-plan
description: |
  Builds structured running training plans from beginner (couch-to-5K) through half-marathon distances with weekly mileage progressions, pace zones, cross-training days, and taper protocols. Gathers the user's current fitness level, target race distance, timeline, and available training days to produce a phased training schedule.
  Use when the user asks about starting running, training for a 5K, 10K, or half-marathon, building weekly mileage, or structuring a running program.
  Do NOT use for marathon or ultra training (requires specialized periodization), sprint training for track events, or injury rehabilitation running programs.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "running fitness workout-planning"
  category: "health-wellness"
  subcategory: "fitness-exercise"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---
# Running Training Plan

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. Always consult a qualified healthcare professional before beginning a new exercise program, especially if you have a history of cardiovascular disease, musculoskeletal injury, or other medical conditions. If you experience chest pain, dizziness, or severe shortness of breath during exercise, stop immediately and contact emergency services.

---

## When to Use

**Use this skill when the user:**
- Is a complete non-runner (zero recent running history) and wants to begin running for fitness or to complete a first 5K event
- Currently runs occasionally or has a base of 1-3 miles and wants to target a 5K race with a structured build
- Has a 5K base and wants a structured 10K training plan with tempo work and mileage progression
- Has a consistent running base of 15+ miles per week and is targeting a half-marathon (13.1 miles) with a 12-16 week build
- Asks how to structure running days during the week, how to increase mileage safely, when to do speed work versus easy runs, or how to prepare for a race in the final weeks
- Wants to understand pace effort zones and how to calibrate workouts by feel or heart rate
- Asks about run/walk intervals, long run pacing strategies, or recovery week protocols

**Do NOT use this skill when:**
- The user is training for a full marathon (26.2 miles) -- the long run volumes, back-to-back long run strategies, and carbohydrate periodization required exceed this skill's scope; use a marathon-specific periodization skill instead
- The user is training for an ultra-marathon (any distance beyond 26.2 miles) -- terrain-specific training, multi-hour fueling strategies, and vertical gain programming require a dedicated ultra skill
- The user wants sprint-specific training for track events (100m, 200m, 400m) -- these require neuromuscular power development, block starts, and speed mechanics coaching outside this skill's scope
- The user is returning from a running injury (stress fracture, IT band syndrome, plantar fasciitis, Achilles tendinopathy) and needs a graduated return-to-run protocol -- defer to a sports medicine professional and a return-to-run rehabilitation skill
- The user is asking about strength training that complements running -- use a `sports-specific-conditioning` or `beginner-strength-training` skill for that component and reference it as a supplement here
- The user is a competitive track or cross-country athlete needing periodized peaking for a championship season -- elite periodization with double-threshold work and altitude exposure is outside this skill's scope
- The user is under 14 years of age -- youth running development follows entirely different growth-plate-safe mileage caps and progression rules

---

## Process

### Step 1: Gather Intake Information

Before building any plan, collect precise information. Ask all of the following in a single, friendly prompt rather than peppering the user with sequential questions.

- **Current running ability:** Non-runner, can run 1 mile continuously, can run 2-3 miles, runs 10+ miles per week regularly
- **Target race or goal:** 5K (3.1 mi), 10K (6.2 mi), half-marathon (13.1 mi), or general fitness with no race
- **Timeline:** Exact number of weeks until the target race or desired program end date
- **Available training days per week:** 3, 4, or 5 days (capture which specific days if the user knows)
- **Any flagged health conditions:** Not for diagnosis, but to note if a physician has restricted certain activities
- **Recent injury history:** Shin splints, knee pain, plantar fasciitis, etc. -- if present, escalate to the edge case protocol
- **Access to equipment or terrain:** Track, treadmill, road, trail -- affects workout prescription language

Interpret vague self-assessments carefully. "I'm pretty fit" does not mean running-fit. A cyclist who can ride 60 miles may still be a beginner runner with zero aerobic running adaptation. Ask them to describe their last run: how far, how long ago, and how they felt.

### Step 2: Select the Program Tier and Validate Timeline Feasibility

Map the user's intake data to one of four program tiers. Then cross-check their timeline to determine if the goal is achievable.

**Tier 1 -- Beginner / Couch to 5K:**
- Profile: Has not run consistently in the past 3+ months, or cannot run 10 minutes continuously
- Duration: 8-10 weeks
- Frequency: 3 days per week running, 1-2 optional cross-training days
- Goal output: Complete a 5K -- finishing is the objective, not a time goal
- Minimum timeline requirement: 8 weeks

**Tier 2 -- Intermediate 5K:**
- Profile: Can run 1-2 miles continuously, has been running 1-3x per week casually
- Duration: 6-8 weeks
- Frequency: 3-4 days per week
- Goal output: Complete 5K with a time target; introduces light tempo work in weeks 4-6
- Minimum timeline requirement: 6 weeks

**Tier 3 -- 10K Training:**
- Profile: Can run 3 miles continuously, has a base of 10-15 miles per week, completed a 5K
- Duration: 10-12 weeks
- Frequency: 4 days per week
- Goal output: Complete 10K with pace awareness; includes weekly tempo runs and one interval session per week in peak phase
- Minimum timeline requirement: 10 weeks

**Tier 4 -- Half-Marathon Training:**
- Profile: Runs 15-20+ miles per week consistently, long run of 6-8 miles already in regular rotation
- Duration: 12-16 weeks
- Frequency: 4-5 days per week
- Goal output: Complete 13.1 miles; includes structured tempo, lactate threshold intervals, and a 3-week taper
- Minimum timeline requirement: 12 weeks

**Timeline feasibility check:** If the user's timeline is shorter than the minimum for their tier, do NOT compress the plan. Instead, inform them that the compressed timeline increases injury risk, recommend a realistic expectation adjustment (e.g., run-walk the race rather than run it fully), and build the best possible plan for their available time while being transparent about limitations.

### Step 3: Define and Calibrate Pace Zones

Pace zones must be anchored to the individual's physiology, not arbitrary pace numbers. Always use effort-based language as the primary descriptor, with heart rate as a secondary tool for those with a monitor.

**Zone definitions:**

- **Zone 1 -- Recovery/Easy:** Full sentences mid-run, breathing rhythmic, feels almost too slow. 60-70% of estimated maximum heart rate (MHR). This is the default zone for all easy runs, warm-ups, and cool-downs.
- **Zone 2 -- Aerobic Base:** Short sentences possible, comfortable but purposeful, could sustain for 2+ hours. 70-80% MHR. This is the long run zone for all tiers.
- **Zone 3 -- Tempo:** 3-5 word phrases only, comfortably uncomfortable. 80-87% MHR. Sustained for 20-40 minutes in training. Physiologically, this corresponds to just below lactate threshold -- the pace a trained runner could sustain for approximately 60 minutes in a race.
- **Zone 4 -- Threshold/Hard:** Single words, effort feels unsustainable beyond 10-15 minutes. 87-93% MHR. Used in structured intervals (800m to 1-mile repeats) for 10K and half-marathon plans.
- **Zone 5 -- VO2max Intervals:** Cannot speak, maximum sustainable effort for 2-5 minutes. 93-100% MHR. Used sparingly in peak training weeks for advanced segments of Tier 3 and Tier 4.

**Calibration options (in order of accuracy):**
1. **Talk test:** The gold standard for everyday runners -- have the user describe how many words they can say mid-run. This maps directly to zones above.
2. **Heart rate monitor:** Use the formula 220 minus age as a rough MHR estimate. Note this formula has a standard deviation of ±10-12 bpm and is least accurate for very fit athletes and individuals over 50. If the user has had a maximal exercise test or knows their true MHR, use that number instead.
3. **Recent race performance:** If the user completed a 5K race recently, their average pace in that race approximates Zone 4. Tempo pace (Zone 3) is approximately 30-45 seconds per mile slower than recent 5K race pace. Easy runs (Zone 1-2) are 60-90 seconds per mile slower than 5K race pace.
4. **Perceived effort (RPE) scale:** 1-10 scale where Zone 1 = 3-4/10, Zone 2 = 5/10, Zone 3 = 6-7/10, Zone 4 = 8-9/10, Zone 5 = 10/10.

Do not prescribe specific minutes-per-mile pace targets unless the user has race history to calibrate from. Even then, present pace as a reference range, not a rigid target, since terrain, weather, and daily fatigue create natural variation.

### Step 4: Build the Weekly Training Structure

The core training week is built around four run types. Not all run types appear in all tiers -- assign only what the tier supports.

**Run type assignments by tier:**

| Run Type | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---|---|---|---|
| Easy Run (Z1-2) | Yes | Yes | Yes | Yes |
| Long Run (Z1-2) | Yes (short) | Yes | Yes | Yes |
| Tempo Run (Z3) | No | Weeks 4-6 only | Yes | Yes |
| Interval Work (Z4-5) | No | No | Weeks 7-10 | Yes |
| Cross-Training | Optional | Optional | Recommended | Required |
| Rest Day | 2-3 days | 2-3 days | 2 days | 1-2 days |

**Day assignment logic:**

- Never schedule the long run the day after a tempo run or interval session. Hard efforts require 48 hours of recovery before another hard session.
- The long run should typically fall on the weekend (Saturday or Sunday) when the user has more time.
- If training 4 days per week, a common proven structure is: Tuesday (easy), Thursday (quality -- tempo or intervals), Saturday (long run), and Sunday (short easy recovery run or rest).
- If training 5 days per week, add a Wednesday easy run or cross-training day between Tuesday and Thursday quality sessions.
- Cross-training days (cycling, swimming, elliptical, yoga, rowing) should be placed between running days. They contribute aerobic fitness without the impact load of running, which is important for injury prevention in runners accumulating mileage.

**Run/walk intervals for Tier 1:**
- Week 1: Walk 2 minutes, run 1 minute, repeat for 20-25 minutes total
- Week 2: Walk 90 seconds, run 90 seconds, repeat for 25 minutes
- Week 3: Walk 90 seconds, run 3 minutes, repeat for 25 minutes
- Week 4: Walk 1 minute, run 5 minutes, repeat for 28 minutes
- Week 5: Walk 2 minutes, run 8 minutes, repeat x3
- Week 6: Walk 2 minutes, run 10 minutes, repeat x2 + run 5 minutes
- Week 7: Run 25 minutes continuously
- Week 8: Run 28 minutes continuously
- Week 9: Run 30 minutes continuously -- 5K readiness

The walk intervals are not a failure state -- they are a structured training tool. The physiological adaptation to running (tendon stiffness, bone density adaptation in the tibia, connective tissue strengthening) lags 4-6 weeks behind cardiovascular fitness. Run/walk protocols protect this adaptation window.

### Step 5: Apply Mileage Progression Rules

Mileage progression is the most critical and most frequently violated element of running programming. Apply these rules without exception.

**The 10% Rule:** Total weekly mileage should not increase by more than 10% from one week to the next. This applies to total volume, not individual run distance. Exception: when coming off a step-back week, the following build week can return to the pre-step-back volume in one jump (not increase 10% beyond it).

**Long run cap:** The long run must not exceed 30% of total weekly mileage for injury prevention. A runner doing 20 miles per week should cap the long run at 6 miles. For half-marathon training, the long run may touch 35% in peak weeks only (weeks 9-11) but should never exceed that.

**Step-back weeks:** Every 3rd or 4th week, reduce total mileage by 20-30% from the previous build week. During step-back weeks, reduce ALL runs proportionally -- do not maintain long run distance and cut only easy runs. The quality session (tempo or interval) is maintained in step-back weeks but volume is reduced (e.g., 3x800m instead of 5x800m).

**Long run progression for each tier:**
- Tier 1: Long run grows from 1.5 miles (walk/run) to 3.1 miles over 9 weeks
- Tier 2: Long run grows from 2 miles to 4-5 miles over 8 weeks
- Tier 3: Long run grows from 4 miles to 6.5 miles over 12 weeks (race is 6.2 miles; the longest long run can slightly exceed race distance in the peak week)
- Tier 4: Long run grows from 8 miles to 12 miles over weeks 1-11; the longest long run peaks at 12 miles (not 13.1 miles -- the taper and race day adrenaline account for the final mile gap)

**If a run is missed:** Do not attempt to double up or add the missed miles to another day's run. Simply skip it and continue from the next scheduled session. Doubling mileage on a single day violates the 10% rule and significantly elevates injury risk. If two or more consecutive runs are missed due to illness, restart from the previous week's volume.

### Step 6: Design the Quality Sessions (Tempo and Intervals)

Quality sessions differentiate an intermediate training plan from simply running more. They create the physiological adaptations -- lactate threshold improvement, VO2max gains, neuromuscular efficiency -- that produce race fitness.

**Tempo runs (Zone 3):**
- Structure: 10-15 minutes easy warm-up jog, sustained tempo effort block, 5-10 minutes easy cool-down
- Starting tempo block duration: 15-20 minutes for Tier 2 and Tier 3
- Progression: Increase tempo block by 3-5 minutes every 1-2 weeks up to a maximum of 40 minutes for half-marathon plans
- Tempo run total session time: 30-55 minutes including warm-up and cool-down
- Common error to avoid: Starting the tempo block too fast. If the runner can't sustain the pace for the full tempo block, they are in Zone 4, not Zone 3. True tempo is "comfortably uncomfortable" and should feel sustainable for 40-60 minutes in theory.

**Interval workouts (Zone 4, Tier 3 and Tier 4 only):**
- Tier 3 interval prescription: 4-6 x 800 meters (half mile) with 90-second to 2-minute recovery jogs between each repeat. The effort during each 800m is Zone 4 -- hard but controlled.
- Tier 4 interval prescription: 5-8 x 1,000 meters or 3-5 x 1-mile repeats with 2-3 minute recovery jogs. Alternatively, 8-12 x 400 meters in early plan phases to establish leg speed before progressing to longer repeats.
- Recovery jog between intervals: 60-75% of the interval duration (e.g., a 4-minute 800m repeat pairs with roughly 2.5-3 minutes of recovery jog)
- Total interval volume per session (just the hard reps, excluding warm-up and cool-down): Should not exceed 5% of the week's total mileage
- Interval sessions replace the tempo run -- do not schedule both tempo and intervals in the same week until the runner is in a Tier 4 peak block with 5 training days

**Strides (for Tier 2 onward):**
Strides are 15-20 second accelerations done at the end of an easy run, reaching approximately Zone 4 effort at peak speed, then decelerating gradually. 4-6 strides following an easy run, twice per week, improve running economy and neuromuscular efficiency without meaningful fatigue cost. They are the most underused tool in beginner-to-intermediate programming.

### Step 7: Build the Taper Protocol

The taper is not optional and is not a luxury -- it is where fitness converts to race performance. Under-tapered runners leave 5-10% of their potential on the course.

**Taper lengths by tier:**
- Tier 1 (Couch to 5K): 1-week gentle taper -- maintain frequency but reduce total running by 30%, no new workout types
- Tier 2 (5K): 1-2 week taper
- Tier 3 (10K): 2-week taper
- Tier 4 (Half-marathon): 3-week taper

**Taper mileage reduction protocol:**
- Taper week 1 (T-3 for half): Reduce total mileage by 20%. Maintain quality session but reduce volume (e.g., 3x1000m instead of 5x1000m). Long run at 80% of previous week's long run.
- Taper week 2 (T-2 for half): Reduce total mileage by 40% from peak. Quality session: 2-3 short tempo efforts of 10-12 minutes each. Long run: 60-70% of peak long run.
- Taper week 3 / race week (T-1 for half): Reduce total mileage by 60% from peak. Include one 20-25 minute easy run with 4-6 strides 2 days before the race. 1-2 days complete rest before race day.

**Taper anxiety is real:** Warn the user that reduced mileage during taper often produces phantom fatigue, sore legs, and doubt. This is a documented psychological response to mileage reduction, not a sign of fitness loss. Fitness is maintained with mileage reductions of up to 60% for up to 3 weeks. Remind the user that the hay is in the barn -- the work is done.

**Race week specifics:**
- 3 days before: 30-40 minute easy run with strides
- 2 days before: Complete rest or 15-20 minute very easy jog
- 1 day before: Complete rest; focus on hydration and familiar pre-race meal
- Race morning: 10-15 minute easy warm-up jog before the start, dynamic stretching

### Step 8: Deliver the Plan and Set Expectations

Present the plan in the output format below. After delivering the plan, include a brief "How to use this plan" section covering:
- How to adjust if a week feels too easy (add 0.5-1 mile to easy runs, never to the long run)
- How to adjust if a week feels too hard (repeat the previous week rather than pushing forward)
- Hydration guidance: 16-20 oz of water in the 2 hours before running; sip during runs over 60 minutes; replace with electrolytes during runs over 75 minutes
- Warm-up protocol: Never start cold -- walk briskly or jog slowly for the first 5-10 minutes of every run
- When to seek professional guidance: Any pain that changes gait, persists for more than 3 days, or is localized to bone (vs. general muscle soreness) warrants evaluation

---

## Output Format

```
## Running Training Plan: [Distance Goal]

> **Health Disclaimer:** This plan is for general educational purposes only
> and does not constitute medical advice. Consult a healthcare professional
> before beginning any new exercise program.

---

**Tier:** [1 / 2 / 3 / 4] -- [Tier Name]
**Goal:** [Complete 5K / Finish 10K under [time] / Half-marathon finish]
**Duration:** [X] weeks
**Days per week:** [X] running + [X] optional cross-training
**Starting weekly mileage:** [X] miles
**Peak weekly mileage:** [X] miles (Week [X])
**Taper start:** Week [X]

---

### Pace Zone Reference

| Zone | Name | Talk Test Cue | RPE (1-10) | Heart Rate (Est.) |
|------|------|---------------|------------|-------------------|
| 1 | Easy / Recovery | Full sentences, could sing | 3-4 | 60-70% MHR |
| 2 | Aerobic Base | Short sentences, comfortable | 5 | 70-80% MHR |
| 3 | Tempo | 3-5 words only, uncomfortable | 6-7 | 80-87% MHR |
| 4 | Threshold | Single words, hard | 8-9 | 87-93% MHR |
| 5 | VO2max Interval | Cannot speak, maximum | 10 | 93-100% MHR |

**Your estimated MHR:** [220 minus user age = X bpm]
*(Note: This estimate has ±10-12 bpm individual variation. Use talk test as primary guide.)*

---

### Weekly Structure Template

| Day | Session Type | Zone | Workout Detail | Purpose |
|-----|-------------|------|----------------|---------|
| [Mon] | Rest or Cross-Training | -- | [e.g., 30-45 min easy cycling or yoga] | Active recovery |
| [Tue] | Easy Run | 1-2 | [X miles, conversational pace] | Aerobic base building |
| [Wed] | Rest or Cross-Training | -- | [e.g., swimming or strength work] | Recovery, injury prevention |
| [Thu] | Quality Session | [3 or 4] | [e.g., 10 min warm-up + 20 min tempo + 10 min cool-down] | Lactate threshold / speed |
| [Fri] | Rest | -- | Complete rest | Recovery |
| [Sat] | Long Run | 1-2 | [X miles, slowest pace of the week] | Aerobic endurance |
| [Sun] | Easy Run or Rest | 1-2 | [X miles or rest] | Recovery run or full rest |

---

### Phase Breakdown

**Phase 1 -- Base Building (Weeks 1-[X]):**
Focus: Build aerobic foundation, establish routine, develop running economy.
Key workouts: Easy runs + long run. Quality sessions introduced [Week X].

**Phase 2 -- Build (Weeks [X]-[X]):**
Focus: Increase mileage and quality session intensity. Introduce [tempo / intervals].
Key workouts: [Specific workout types and progressions].

**Phase 3 -- Peak (Weeks [X]-[X]):**
Focus: Maximum training load before taper. Longest long runs here.
Key workouts: Peak long run of [X miles]. Hardest quality sessions.

**Phase 4 -- Taper (Weeks [X]-[X]):**
Focus: Mileage reduction while maintaining intensity. Freshen legs for race day.
Mileage: [Reduce by 20% / 40% / 60% across taper weeks].

---

### Full Mileage Progression Table

| Week | Phase | Total Miles | Long Run | Quality Session | Notes |
|------|-------|-------------|----------|-----------------|-------|
| 1 | Base | [X] | [X mi] | [None / Intro easy] | Establish routine |
| 2 | Base | [X+10%] | [X mi] | [None / Easy strides] | Build |
| 3 | Base | [X+20%] | [X mi] | [Intro tempo] | Build |
| 4 | Base | [Step-back -25%] | [X mi] | [Reduced] | Recovery week |
| 5 | Build | [X] | [X mi] | [Tempo: 20 min] | Resume build |
| 6 | Build | [X+10%] | [X mi] | [Tempo: 23 min] | Build |
| 7 | Build | [X+20%] | [X mi] | [Tempo: 26 min] | Build |
| 8 | Build | [Step-back -25%] | [X mi] | [Reduced] | Recovery week |
| 9 | Peak | [X] | [X mi] | [Intervals or long tempo] | Peak build |
| 10 | Peak | [X+10%] | [X mi] | [Hard quality] | Peak week |
| 11 | Taper | [-20% from peak] | [X mi] | [Reduced quality] | Taper begins |
| 12 | Taper | [-40% from peak] | [X mi] | [2x10 min tempo] | Final sharpening |
| [13] | Taper | [-60% from peak] | [3-4 mi shakeout] | [Light strides only] | Race week |

---

### Taper Protocol Detail

| Week | Total Mileage | Long Run | Quality Session | Key Notes |
|------|--------------|----------|-----------------|-----------|
| T-[3] | -20% from peak | [X mi easy] | [Reduced volume, same intensity] | Maintain feel |
| T-[2] | -40% from peak | [X mi easy] | [2-3 x 10 min tempo] | Mental freshness |
| T-[1] / Race Week | -60% from peak | [2-4 mi shakeout] | [4-6 strides only] | Rest, hydrate, sleep |
| Race Day | -- | [Race distance] | Race effort | Trust the training |

---

### Race Day Checklist
- [ ] Wake up 3+ hours before start; eat a familiar, carbohydrate-rich breakfast
- [ ] Arrive at race with 45+ minutes to spare for warm-up and logistics
- [ ] 10-15 minute easy warm-up jog + dynamic stretching (leg swings, hip circles)
- [ ] Start 20-30 seconds per mile slower than goal pace for first mile -- adrenaline will push you out too fast
- [ ] Hydrate at every water station; don't wait until thirsty
- [ ] If targeting a time goal, split the race evenly or run a slight negative split (second half marginally faster)

---

### How to Adapt This Plan

**If a week feels too easy:** Add 0.5 miles to one or two easy runs. Never add to the long run unilaterally.
**If a week feels too hard:** Repeat the previous week's volume before continuing.
**If you miss 1 run:** Skip it -- do not double up.
**If you miss 1 full week:** Return at 80% of the volume from the week before you stopped.
**If you miss 2+ weeks:** Restart 2-3 weeks earlier in the plan.
```

---

## Rules

1. **Never exceed 10% weekly mileage increase.** This is a physiological limit, not a guideline. Running injuries -- particularly stress fractures in the tibia, fibula, and metatarsals -- are directly correlated with rapid mileage spikes. The bone remodeling cycle that allows bone to safely absorb running loads takes 6-8 weeks. The cardiovascular system adapts faster than connective tissue every time.

2. **The long run must not exceed 30% of total weekly mileage (35% only in peak weeks for Tier 4).** A runner totaling 20 miles per week with a 9-mile long run has created a dangerous imbalance -- all the aerobic stimulus is concentrated in one session with inadequate recovery distributed across the rest of the week.

3. **At minimum 60% of all weekly running volume must be at Zone 1-2 effort.** The "more is harder = better" instinct is the most common mistake in recreational runners. Polarized and pyramidal training models consistently show that running too much in Zone 3 (moderate intensity) -- not too little -- is the primary cause of stagnation and overtraining syndrome. Easy runs must feel genuinely easy.

4. **Never recommend running through pain that alters gait.** Soreness that is symmetrical, muscular, and resolves within 24-48 hours is acceptable adaptation. Pain that is sharp, localized to bone, one-sided, or persists for more than 3 days is a warning sign requiring professional evaluation. If the user mentions any of these characteristics, do not modify the plan to "work around" the pain -- advise cessation and referral.

5. **Include a recovery/step-back week every 3-4 weeks without exception.** Recovery weeks are where aerobic adaptation is consolidated. Skipping them to "make up" for a good streak is the physiological equivalent of withdrawing from a bank account repeatedly without making deposits.

6. **Never prescribe specific pace targets (min/mile or min/km) without race history to calibrate from.** Prescribing 10:30 per mile for a beginner who runs 13-minute miles is demoralizing and physiologically wrong. Effort zones are precise enough for training stimulus and are calibrated to the individual, not a generic population average.

7. **The longest long run in the plan should equal race distance for 5K and 10K, but stop at 12 miles for the half-marathon.** Running 13+ miles in training before a half-marathon is unnecessary and increases injury risk. Race day adrenaline, proper taper, and carbohydrate loading account for the final gap. The common mistake of running the full half-marathon distance in training adds fatigue without proportional fitness benefit.

8. **Taper periods are mandatory for all race-goal plans.** A runner who continues at full volume until race week will perform below their fitness level on race day. Central nervous system fatigue, glycogen store depletion, and micro-damage accumulation all require 1-3 weeks to resolve. The fitness is not lost during taper -- it is expressed.

9. **Do not prescribe interval work (Zone 4-5) for Tier 1 or early Tier 2.** Beginners lack the aerobic base and running mechanics efficiency to benefit from intensity before the base is established. High-intensity work on a thin aerobic base produces injury and burnout, not fitness. Introduce strides (brief accelerations) as the first intensity tool before progressing to true interval sessions.

10. **Cross-training days count toward aerobic fitness but not toward running mileage totals.** A runner who swims 30 minutes and cycles 30 minutes is doing valuable work, but those sessions do not count toward the weekly mileage calculation for the 10% rule. Only logged running miles count. Cross-training serves recovery and general aerobic fitness -- it does not substitute for running-specific adaptation.

11. **If the user's available timeline is shorter than the tier minimum, do not compress the plan.** A compressed 12-week half-marathon plan squeezed into 8 weeks does not make the user half-marathon ready -- it makes them injured. Be honest about what is achievable, adjust the goal (e.g., run the half as a run-walk rather than a full run), and build the best plan for the available time.

12. **For users over 50, apply conservative mileage progression (7% instead of 10%) and prioritize step-back weeks every 3rd week rather than every 4th.** Recovery rates slow significantly with age due to reduced hormonal stimulus for tissue repair. The same training load that a 30-year-old recovers from in 48 hours may require 72+ hours for a 55-year-old.

---

## Edge Cases

### Complete Non-Runner with a Race in 8-10 Weeks

A non-runner who signs up for a 5K in 8 weeks is the most common intake scenario. The Couch-to-5K (Tier 1) protocol fits precisely -- but set the correct goal framing. The objective is to finish the 5K, not to run it continuously without walking. The run/walk method is not a fallback; interval running is a legitimate and time-tested approach used by runners of all experience levels. Do not frame walking intervals as failure. In weeks 1-5, the run/walk ratio progresses from 1:2 (run:walk) to 4:1. By weeks 7-9, most users can run 25-30 minutes continuously, which covers a 5K at a moderate pace. If the user cannot achieve continuous 20-minute running by week 7, maintain the run/walk format and assure them this is sufficient to cross the finish line.

### User Has Only 2-3 Training Days Available

A 2-day running week is challenging but not futile. Assign: (1) one easy-to-moderate run of moderate distance building to 40-60 minutes, and (2) one long run. On a 2-day plan, progress mileage at 7% per week maximum rather than 10%, because each session carries more cumulative load. Supplement with 2-3 cross-training sessions (cycling, swimming, rowing) to maintain aerobic development without impact stress. Acknowledge explicitly that this runner will take longer to reach race-readiness and adjust the recommended timeline minimum upward by 2-3 weeks. Do not attempt to replicate a 4-day plan on 2 days -- the recovery between sessions is the point.

### User Is Already Running Regularly but Has Never Followed a Structured Plan

This user is the most likely to underestimate how structured training differs from recreational running. Do not slot them into a beginner tier. Assess their actual weekly mileage (the average of the past 4 weeks, not their best week), their typical long run distance, and whether they have ever done a tempo run or interval session. Build the plan from their actual current base. A runner averaging 18 miles per week with a 7-mile long run belongs in Tier 4 base building, not Tier 3. Their first quality sessions should introduce tempo running gently -- 10-15 minutes of sustained Zone 3 effort -- as their cardiovascular system will be ready but their neuromuscular system may not be adapted to sustained hard effort. They will likely be surprised how hard true Zone 3 feels when properly calibrated.

### User Mentions Pain During the Intake

If the user mentions any of the following during intake, do not build a running plan until they address it: knee pain during or after runs, shin pain that is localized and worsens with mileage (potential stress reaction), heel pain that is worst on first steps in the morning (plantar fasciitis), or Achilles tightness or swelling. Acknowledge their desire to run, affirm their goal, and be direct: training through these specific symptoms typically converts a 2-week problem into a 2-month problem. Recommend evaluation by a sports medicine physician or physical therapist who works with runners. Once cleared, offer to build a modified plan based on any restrictions provided by their provider. Do not attempt to design a "pain-safe" running plan around described symptoms -- this is outside scope and potentially harmful.

### User Wants a Half-Marathon but Has an Insufficient Base

A half-marathon training plan requires a minimum running base of approximately 15 miles per week with a recent long run of at least 6-8 miles. A user who currently runs 8 miles per week and wants to train for a half-marathon in 16 weeks has a mismatch. Handle this in two stages: (1) a 4-6 week base-building phase to elevate weekly mileage from 8 to 15-18 miles and extend the long run to 6+ miles, followed by (2) the standard 12-week Tier 4 plan. This means the full program is 16-18 weeks. Presenting this as a two-phase approach (Base Building + Race Prep) is more motivating and more accurate than forcing a 12-week plan on someone who isn't ready for it.

### User Is Training in Extreme Heat or Cold

Environmental conditions significantly affect training. Hot weather (above 75°F / 24°C with high humidity) increases cardiovascular load, elevates heart rate by 10-20 bpm for equivalent effort, and slows pace by 1-2 minutes per mile at the same perceived exertion. In these conditions: move runs to early morning or evening, accept slower paces without alarm, add hydration reminders, and reduce long run distance by 20% on days above 85°F (29°C). Cold weather (below 20°F / -7°C) affects breathing, increases muscle stiffness, and slows warm-up time -- advise adding 5-10 minutes to the warm-up and layering with wicking base layers, but not overdressing. Running on ice or snow requires pace reduction and extra caution to avoid falls. Treadmill substitution is valid for all workouts in severe conditions.

### User Describes a "Plateau" -- Running More but Getting Slower

This is a classic overtraining or under-recovery presentation. Key indicators: resting heart rate elevated by 5+ bpm from normal baseline, persistent leg heaviness, declining motivation, and pace regression despite maintained or increased volume. The prescription is counterintuitive: reduce mileage by 30-40% for 1-2 weeks (an extended step-back), replace one run per week with a cross-training session, and audit sleep and nutrition. If the user is running more than 5 days per week without structured easy-day discipline, the most common cause is running too many miles in Zone 3 (the "black hole" of training intensity -- hard enough to cause fatigue, not hard enough to drive adaptation). Re-introduce the plan from a lower mileage base with strict Zone 1-2 enforcement on easy days.

### User Has Completed Multiple Races but Wants to Improve Time, Not Just Finish

This user needs a performance-oriented plan rather than a completion plan. The key differences: (1) introduce intervals (Zone 4) earlier in the plan -- by week 4-5 rather than weeks 7-10; (2) use race-history pace data to anchor all zones to real numbers; (3) add a mid-plan time trial (3 miles at goal race effort) in week 6-7 to assess fitness and recalibrate zones; (4) structure the long run with the final 20-30% at tempo pace (a "progression long run") in peak weeks. For the half-marathon in particular, add 3-4 race-pace miles within the long run during weeks 8-11 -- running 8 miles total with the middle 4 miles at goal half-marathon pace. This teaches the body to sustain goal effort on tired legs, which is the exact physiological demand of the race.

---

## Example

**User Input:** "I can run about 2 miles without stopping but I have to slow down a lot by the end. I want to run a 10K in 12 weeks. I can train 4 days a week -- Tuesday, Thursday, Saturday, and Sunday. I'm 34 years old and I've never had any injuries."

**Tier Assessment:** The user can run 2 miles continuously -- this places them above Tier 1 but below the full Tier 3 entry point (which assumes 3-mile continuous running and a 10-15 mile base). They belong in early Tier 3 with a modified, conservative first 3 weeks.

**Timeline check:** 12 weeks for a 10K with a 2-mile starting base is feasible. Tier 3 minimum is 10 weeks; 12 weeks gives comfortable headroom.

**MHR estimate:** 220 minus 34 = 186 bpm

---

## Running Training Plan: 10K (6.2 Miles)

> **Health Disclaimer:** This plan is for general educational purposes only and does not constitute medical advice. Consult a healthcare professional before beginning any new exercise program.

---

**Tier:** 3 -- Intermediate 10K Training
**Goal:** Complete a 10K (6.2 miles) -- finish strong, build to a comfortable continuous run
**Duration:** 12 weeks
**Days per week:** 4 running days (Tuesday, Thursday, Saturday, Sunday)
**Starting weekly mileage:** 8 miles
**Peak weekly mileage:** 18 miles (Week 10)
**Taper:** 2-week taper beginning Week 11
**Estimated MHR:** 186 bpm (use talk test as primary zone guide)

---

### Pace Zone Reference

| Zone | Name | Talk Test Cue | RPE (1-10) | Heart Rate (Est.) |
|------|------|---------------|------------|-------------------|
| 1 | Easy / Recovery | Full sentences, could sing | 3-4 | 112-130 bpm |
| 2 | Aerobic Base | Short sentences, comfortable | 5 | 130-149 bpm |
| 3 | Tempo | 3-5 words only, uncomfortable | 6-7 | 149-162 bpm |
| 4 | Threshold | Single words, hard | 8-9 | 162-173 bpm |
| 5 | VO2max Interval | Cannot speak, maximum | 10 | 173-186 bpm |

*Primary calibration: Use the talk test. Heart rate ranges above are estimates based on 220 minus 34 = 186 bpm MHR and will vary individually.*

---

### Weekly Structure Template

| Day | Session Type | Zone | Workout Detail | Purpose |
|-----|-------------|------|----------------|---------|
| Tuesday | Easy Run | 1-2 | 2-4 miles, fully conversational pace | Aerobic base, recovery |
| Thursday | Quality Session | 3 (later 4) | Tempo run or interval session (see progression) | Lactate threshold stimulus |
| Saturday | Long Run | 1-2 | Slowest pace of the week, see progression table | Aerobic endurance |
| Sunday | Short Easy Run | 1 | 2-3 miles, recovery pace -- even slower than Tuesday | Active recovery, mileage accumulation |

**Cross-training note:** On Monday and Wednesday, 30-45 minutes of easy cycling, swimming, or yoga is optional and will support aerobic fitness and injury prevention without adding impact load. These days are not counted in mileage totals.

---

### Phase Breakdown

**Phase 1 -- Base Building (Weeks 1-3):**
The user's 2-mile current capacity places them below the Tier 3 assumed entry point. These first 3 weeks add easy volume and introduce the training routine before any quality sessions begin. Tempo work starts conservatively in week 3. All four days are runs, but all remain at Zone 1-2. The Sunday run is kept short (2 miles) and treated as pure recovery. Focus on building the habit, not building intensity.

**Phase 2 -- Build (Weeks 4-8):**
Tempo runs are introduced in week 3 and become the Thursday anchor session. The tempo block grows from 15 minutes in week 3 to 30 minutes by week 8. Step-back weeks occur in weeks 4 and 8. Long run builds progressively toward 6 miles by week 8. Strides (6 x 20 seconds at Zone 4 effort, full recovery between) are added to the end of Tuesday easy runs starting in week 5 -- these are the user's first taste of faster running and require no special track or surface.

**Phase 3 -- Peak (Weeks 9-10):**
Maximum training load. Long run reaches 6.5 miles in week 9 -- this slightly exceeds race distance and is the confidence-building stimulus that confirms the body can cover the race. Thursday quality sessions in weeks 9-10 shift from pure tempo to a 4 x 800m interval session (Zone 4 effort), introducing the leg speed needed on race day. Total mileage peaks at 18 miles in week 10.

**Phase 4 -- Taper (Weeks 11-12):**
Mileage drops while one quality session per week is maintained to preserve sharpness. Week 11 reduces to 14 miles. Week 12 reduces to 11 miles. The long run in week 12 is capped at 4 miles -- an easy, confidence-building run, not a training stimulus. Race day is Sunday of week 12 (or as scheduled).

---

### Full Mileage Progression Table

| Week | Phase | Tue (Easy) | Thu (Quality) | Sat (Long) | Sun (Easy) | Total Miles | Notes |
|------|-------|------------|---------------|------------|------------|-------------|-------|
| 1 | Base | 2 mi | 2 mi easy | 3 mi | 2 mi | 9 mi | Establish routine, all easy |
| 2 | Base | 2.5 mi | 2.5 mi easy | 3.5 mi | 2 mi | 10.5 mi | Build volume |
| 3 | Base | 3 mi | 10 min WU + 15 min tempo + 10 min CD | 4 mi | 2 mi | ~12 mi | First tempo |
| 4 | Step-Back | 2 mi | 10 min WU + 10 min tempo + 10 min CD | 3 mi | 2 mi | ~9 mi | Recovery week |
| 5 | Build | 3 mi + 6 strides | 10 min WU + 20 min tempo + 10 min CD | 4.5 mi | 2.5 mi | ~13.5 mi | Strides added |
| 6 | Build | 3.5 mi + 6 strides | 10 min WU + 23 min tempo + 10 min CD | 5 mi | 2.5 mi | ~15 mi | Build |
| 7 | Build | 3.5 mi + 6 strides | 10 min WU + 26 min tempo + 10 min CD | 5.5 mi | 2.5 mi | ~16 mi | Build |
| 8 | Step-Back | 2.5 mi | 10 min WU + 15 min tempo + 10 min CD | 4 mi | 2 mi | ~12 mi | Recovery week |
| 9 | Peak | 3.5 mi + 6 strides | 10 min WU + 4 x 800m (Z4) + 10 min CD | 6.5 mi | 3 mi | ~18 mi | Peak long run |
| 10 | Peak | 3.5 mi + 6 strides | 10 min WU + 4 x 800m (Z4) + 10 min CD | 6 mi | 3 mi | ~18 mi | Peak week |
| 11 | Taper | 3 mi | 10 min WU + 20 min tempo + 10 min CD | 5 mi | 2 mi | ~14 mi | Taper week 1 (-22%) |
| 12 | Taper | 2.5 mi | 10 min WU + 2 x 10 min tempo + 10 min CD | 4 mi | -- | ~11 mi | Taper week 2 (-39%) |
| Race | Race | Easy 2 mi (Fri or Sat shakeout) | -- | 10K Race (Sun) | -- | -- | Trust the training |

*WU = warm-up jog at Zone 1. CD = cool-down jog at Zone 1. Tempo = Zone 3 sustained effort. 800m intervals = Zone 4 hard effort with 90-second recovery jog between each.*

*Long run cap check: Week 10 long run (6 mi) is 33% of total weekly mileage (18 mi) -- within the 35% peak-week allowance.*

---

### Thursday Quality Session Detail

**Weeks 1-2:** Easy Zone 1-2 run -- same as other days. No quality session yet.

**Weeks 3-4 (Intro Tempo):**
- 10 minutes easy Zone 1 jog (warm-up)
- 15 minutes (week 3) / 10 minutes (week 4, step-back) at Zone 3 effort -- 3-5 word phrase threshold, uncomfortable but sustainable
- 10 minutes easy Zone 1 jog (cool-down)
- If you cannot hold the Zone 3 effort without gasping or dropping to single words, you are in Zone 4 -- slow down slightly

**Weeks 5-8 (Building Tempo):**
- Same warm-up / cool-down structure
- Tempo block grows: 20 min (wk 5) → 23 min (wk 6) → 26 min (wk 7) → 15 min (wk 8 step-back)
- By week 7, a 26-minute sustained Zone 3 block is a meaningful lactate threshold session

**Weeks 9-10 (Intervals):**
- 10 minutes easy Zone 1 warm-up jog
- 4 repetitions of 800 meters (half mile) at Zone 4 effort -- this should feel genuinely hard but controlled, not panicked
- 90-second easy jog recovery between each 800m repeat
- 10 minutes easy Zone 1 cool-down
- Total quality
