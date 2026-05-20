---
name: sport-skill-progression-planner
description: |
  Builds a sport-agnostic skill progression plan using assessment, skill decomposition, drill progression, milestone marking, and reassessment cycles. Gathers the user's chosen sport, current level, and goals to produce a structured skill ladder with drills, practice schedules, and measurable milestones.
  Use when the user asks about improving at a specific sport, building a practice plan for athletic skills, creating a skill development roadmap, or structuring deliberate practice for any sport.
  Do NOT use for team coaching or managing other athletes, professional/competitive training periodization, injury rehabilitation programs, or general fitness without a sport-specific skill focus (use health-wellness skills instead).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "planning workout-planning step-by-step guide"
  category: "hobbies-crafts"
  subcategory: "outdoor-recreation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Sport Skill Progression Planner

## When to Use

**Use this skill when:**
- User asks about improving at a specific sport (tennis, basketball, swimming, golf, soccer, etc.)
- User wants a structured practice plan for athletic skill development
- User asks about creating a skill development roadmap or training ladder
- User mentions deliberate practice, skill decomposition, or drill progression
- User wants to track sport-specific skill milestones
- User asks how to identify and address weaknesses in their sport performance

**Do NOT use when:**
- User asks about coaching a team (this is for individual self-improvement)
- User needs competitive periodization with peaking cycles (advanced training science)
- User is recovering from an injury and needs rehabilitation (refer to healthcare professional)
- User wants general fitness improvement without sport-specific goals (use health-wellness skills)
- User asks about sport nutrition or weight management (use nutrition skills)

## Process

1. **Gather sport and athlete information.** Ask the user for:
   - Sport: which sport they want to improve in
   - Current level: complete beginner (never played), novice (played casually, no instruction), intermediate (some instruction or years of casual play), advanced (competitive experience)
   - Specific goals: what they want to be able to do (e.g., "serve consistently in tennis," "shoot 3-pointers in basketball," "swim freestyle for 500 meters")
   - Available practice time: hours per week, session length, days available
   - Access to facilities: gym, court, pool, field, home practice space
   - Access to equipment: full sport-specific equipment, partial, minimal
   - Access to coaching or training partners: solo practice only, has a practice partner, has a coach

2. **Perform skill assessment.** Build a current-state evaluation:
   - **Identify the core skill domains** for the chosen sport. Every sport has 3-6 fundamental skill domains. Examples:
     - Tennis: serve, groundstrokes, net play, footwork, match strategy
     - Basketball: shooting, ball handling, passing, defense, rebounding
     - Swimming: stroke technique, breathing, endurance, turns, starts
     - Golf: full swing, short game, putting, course management
   - **Rate each domain** on a 1-5 scale:
     - 1 = Cannot perform the basic motion
     - 2 = Can perform the motion but with major inconsistencies
     - 3 = Can perform consistently in practice but breaks down under pressure or fatigue
     - 4 = Consistent in practice and competition; minor refinements needed
     - 5 = Near-automatic execution; focus shifts to tactical application
   - **Identify the limiting factor:** Which domain at the lowest rating has the highest impact on overall performance? This becomes the primary development target.

3. **Decompose the target skill.** Break the primary skill into component sub-skills:
   - **Movement chain analysis:** What are the sequential body movements required?
     - Example (tennis serve): grip -> stance -> toss -> backswing -> trophy position -> rotation -> contact point -> follow-through
   - **Identify the weakest link:** Which sub-skill in the chain is the point of breakdown?
   - **Prerequisite check:** Does the user have the physical prerequisites (flexibility, strength, coordination) for the sub-skill? If not, build prerequisites first.

4. **Build the drill progression.** Create a ladder from current level to target level:
   - **Stage 1: Isolation drills (10-15 sessions)**
     - Practice the weakest sub-skill in isolation, removing game context
     - Reduce speed and complexity to focus on correct movement pattern
     - Success criterion: can perform the isolated movement correctly 7 out of 10 attempts
   - **Stage 2: Combination drills (10-15 sessions)**
     - Chain the isolated sub-skill with the adjacent sub-skills in the movement chain
     - Increase speed gradually toward game speed
     - Success criterion: can perform the combined movement correctly 6 out of 10 attempts at 75% game speed
   - **Stage 3: Contextual drills (10-15 sessions)**
     - Practice the full skill in simplified game situations
     - Add decision-making: when to use this skill, which variation to apply
     - Success criterion: can apply the skill in a practice game or scrimmage at 70% success rate
   - **Stage 4: Competition integration (ongoing)**
     - Use the skill in full competition or game conditions
     - Track success rate over multiple sessions
     - Success criterion: success rate matches or exceeds pre-improvement baseline by at least 20%

5. **Create the practice schedule.** Structure weekly sessions:
   - **Warm-up (10-15 min):** Sport-specific movement preparation, not static stretching
   - **Skill work (40-60% of session):** Drill progression from Step 4
   - **Game play or simulation (20-30% of session):** Apply skills in context
   - **Cool-down and reflection (10 min):** Note what improved, what needs more work
   - **Session length recommendations:**
     - Beginner: 45-60 minutes (attention and fatigue limits quality)
     - Intermediate: 60-90 minutes
     - Advanced: 90-120 minutes
   - **Frequency recommendations:**
     - Minimum for progress: 2 sessions per week
     - Standard progression: 3-4 sessions per week
     - Accelerated progression: 5-6 sessions per week (include 1-2 lighter sessions)

6. **Set measurable milestones.** Define checkpoints at regular intervals:
   - **2-week checkpoint:** Can the user perform the isolation drill at success criterion?
   - **4-week checkpoint:** Has the user progressed to combination drills?
   - **8-week checkpoint:** Is the user performing contextual drills at criterion?
   - **12-week checkpoint:** Is the skill showing up in game or competition conditions?
   - **Reassessment:** After each 12-week cycle, re-rate all skill domains. Identify the next limiting factor and repeat the process.

## Output Format

```
## Sport Skill Progression Plan

### Athlete Profile
| Parameter          | Value                             |
|--------------------|-----------------------------------|
| Sport              | [Sport name]                      |
| Current level      | [Beginner / Novice / Intermediate / Advanced] |
| Primary goal       | [Specific skill goal]             |
| Practice schedule  | [X sessions/week, X minutes each] |
| Facilities         | [Available facilities]            |
| Equipment          | [Available equipment]             |

### Skill Domain Assessment
| Domain             | Rating (1-5) | Notes                    |
|--------------------|--------------|--------------------------|
| [Domain 1]         | [X]          | [Strength/weakness note] |
| [Domain 2]         | [X]          | [Strength/weakness note] |
| [Domain 3]         | [X]          | [Strength/weakness note] |
| **Limiting factor** | [Domain]    | [Why this domain matters most] |

### Skill Decomposition: [Target Skill]
| Sub-Skill          | Status       | Priority               |
|--------------------|--------------|------------------------|
| [Sub-skill 1]      | [OK / Needs work] | [Primary / Secondary] |
| [Sub-skill 2]      | [OK / Needs work] | [Primary / Secondary] |
| **Weakest link**   | [Sub-skill]  | [This is the focus]    |

### Drill Progression Ladder
#### Stage 1: Isolation (Weeks 1-3)
| Drill              | Description  | Reps/Sets    | Success Criterion |
|--------------------|--------------|--------------|-------------------|
| [Drill 1]          | [How to do it] | [X reps x X sets] | [7/10 correct] |

#### Stage 2: Combination (Weeks 4-6)
| Drill              | Description  | Reps/Sets    | Success Criterion |
|--------------------|--------------|--------------|-------------------|
| [Drill 1]          | [How to do it] | [X reps x X sets] | [6/10 at 75% speed] |

#### Stage 3: Contextual (Weeks 7-9)
| Drill              | Description  | Reps/Sets    | Success Criterion |
|--------------------|--------------|--------------|-------------------|
| [Drill 1]          | [How to do it] | [Situation]  | [70% in scrimmage] |

#### Stage 4: Competition Integration (Weeks 10-12)
| Focus              | Description  | Measurement  | Target            |
|--------------------|--------------|--------------|-------------------|
| [Game application]  | [How to apply] | [Track metric] | [20% improvement] |

### Weekly Practice Schedule
| Day       | Focus                          | Duration |
|-----------|--------------------------------|----------|
| [Day 1]   | Skill work + game play         | [X min]  |
| [Day 2]   | Rest or light cross-training   | --       |
| [Day 3]   | Skill work + game play         | [X min]  |
| ...       | ...                            | ...      |

### Milestones
| Checkpoint   | Target                          | Date       |
|--------------|---------------------------------|------------|
| 2 weeks      | [Isolation drill criterion met] | [Date]     |
| 4 weeks      | [Combination drills started]    | [Date]     |
| 8 weeks      | [Contextual drills at criterion]| [Date]     |
| 12 weeks     | [Skill in competition]          | [Date]     |

### Reassessment Plan
- Re-rate all skill domains after 12 weeks
- Identify next limiting factor
- Build new drill progression for next cycle
```

## Rules

1. NEVER prescribe specific exercises without knowing the user's sport -- every drill must be sport-specific
2. ALWAYS start with assessment before building drills -- skipping assessment leads to working on the wrong skills
3. The limiting factor principle: always prioritize the lowest-rated skill domain that has the highest impact on overall performance
4. Drill progression must follow the isolation -> combination -> contextual -> competition sequence -- skipping stages leads to poor skill transfer
5. Success criteria must be measurable: a count (7 out of 10), a percentage (70% success rate), or a time-based target
6. Rest days must be included in every practice schedule -- skill acquisition requires sleep and recovery for neural consolidation
7. Session length must scale with the athlete's level -- beginners fatigue faster and quality degrades, making additional practice counterproductive
8. NEVER include drills that require a coach or partner if the user practices solo -- provide solo alternatives
9. Reassessment must occur at least every 12 weeks to prevent stale practice
10. If the user's goal requires physical prerequisites (strength, flexibility) they do not have, build those prerequisites into the plan as a pre-stage

## Edge Cases

- **User cannot identify their weaknesses:** Provide a self-assessment protocol: record themselves performing the sport (phone video is sufficient), compare to instructional reference material for their level, and look for the first point where their movement diverges from the reference. Alternatively, suggest a single session with a qualified coach for an initial assessment.

- **User has limited practice time (under 2 hours per week):** Focus all practice time on the single most impactful sub-skill. Eliminate game play from sessions and dedicate 100% to deliberate drill work. Progress will be slower but still measurable. Set milestones at 4-week intervals instead of 2-week intervals.

- **User is learning a completely new sport from zero:** Skip the assessment step (all domains are at 1). Instead, identify the one foundational skill that enables all others in that sport (e.g., ball control in soccer, floating in swimming, grip and stance in golf). Build the entire first 12-week cycle around that foundational skill. No game play until Stage 3.

- **User has hit a plateau and stopped improving:** Plateaus typically indicate one of three issues: (a) practice is too easy -- increase difficulty or add decision-making pressure; (b) practice is not specific enough -- add more contextual and competition drills; (c) a prerequisite skill is limiting progress -- reassess and look for a hidden weakness in a supporting skill domain. Recommend varying practice conditions (different partners, different environments) to break pattern dependency.

- **User practices a solo sport (running, swimming, golf):** Adjust the competition integration stage to focus on personal benchmarks and simulated pressure (time trials, score tracking over rounds, race-pace sets). Replace partner drills with self-monitoring drills: video recording, metric tracking, and comparison to previous performances.

## Example

**Input:** "I play recreational basketball twice a week. I've been playing for about a year but I still miss most of my 3-point shots. I'd like to become a more reliable outside shooter. I can practice 3 times a week for about an hour each time at my local gym."

**Output:**

## Sport Skill Progression Plan

### Athlete Profile
| Parameter          | Value                                   |
|--------------------|-----------------------------------------|
| Sport              | Basketball                              |
| Current level      | Novice (1 year casual play)             |
| Primary goal       | Improve 3-point shooting consistency    |
| Practice schedule  | 3 sessions/week, 60 minutes each       |
| Facilities         | Local gym with basketball court         |
| Equipment          | Basketball, standard court with 3-point line |

### Skill Domain Assessment
| Domain        | Rating (1-5) | Notes                                         |
|---------------|--------------|------------------------------------------------|
| Shooting      | 2            | Can shoot the motion but major inconsistency from 3-point range |
| Ball handling | 3            | Adequate for recreational play                 |
| Passing       | 3            | Adequate for recreational play                 |
| Defense       | 2            | Positioning needs work                         |
| Rebounding    | 2            | Positioning and timing inconsistent            |
| **Limiting factor** | Shooting | Directly matches stated goal; outside shooting unlocks spacing and creates better offensive opportunities for the whole game |

### Skill Decomposition: 3-Point Shooting
| Sub-Skill           | Status       | Priority   |
|----------------------|--------------|------------|
| Shooting form (BEEF) | Needs work   | Primary    |
| Footwork (catch-and-shoot stance) | Needs work | Primary |
| Release point and arc | Needs work  | Secondary  |
| Shot selection (when to shoot) | OK for current level | Later |
| **Weakest link**     | Shooting form and footwork | These determine consistency before range |

### Drill Progression Ladder

#### Stage 1: Isolation -- Form Shooting (Weeks 1-3)
| Drill                   | Description                                    | Reps/Sets     | Success Criterion |
|-------------------------|------------------------------------------------|---------------|-------------------|
| Form shooting at rim    | Stand 3 feet from basket. Focus on BEEF: Balance, Eyes on target, Elbow aligned, Follow-through. Shoot with one hand, guide hand off. | 50 shots x 3 sets | 40/50 makes (80%) |
| Free throw form shots   | Move to free throw line. Same BEEF focus. Two-hand shot. | 30 shots x 3 sets | 20/30 makes (67%) |
| Catch-and-shoot stance  | Partner or wall passes ball, catch with feet square to basket, knees bent, eyes on rim. No shot -- just the catch and stance. | 20 reps x 3 sets | Feet square on 18/20 catches |

#### Stage 2: Combination -- Extending Range (Weeks 4-6)
| Drill                   | Description                                    | Reps/Sets     | Success Criterion |
|-------------------------|------------------------------------------------|---------------|-------------------|
| Mid-range spot shooting  | 5 spots at 12-15 feet. Shoot 10 from each spot. Focus on identical form from Stage 1. | 50 total (10 x 5 spots) | 30/50 makes (60%) |
| Step-back to 3-point line | From mid-range, step back to 3-point line. Same form. Slower shot is fine. | 30 shots from 3 spots | 12/30 makes (40%) |
| Catch-shoot-repeat       | Retrieve ball, return to 3-point spot, set feet, shoot. Build the full rhythm. | 20 shots x 3 sets | 8/20 makes at 75% game rhythm |

#### Stage 3: Contextual -- Game Simulation (Weeks 7-9)
| Drill                   | Description                                    | Situation     | Success Criterion |
|-------------------------|------------------------------------------------|---------------|-------------------|
| 5-spot 3-point drill    | Shoot from 5 spots around the 3-point line. Move to next spot after each shot (make or miss). 2 full rotations. | 50 total shots | 15/50 makes (30%) |
| Off-the-dribble 3       | Dribble from half court, pull up at 3-point line, set feet, shoot. | 20 shots | 6/20 makes (30%) |
| Pressure free throws + 3s | Alternate: 2 free throws, then 1 three-pointer. Track combined percentage under fatigue. | 30 min | Combined 45% |

#### Stage 4: Competition Integration (Weeks 10-12)
| Focus                    | Description                                    | Measurement    | Target            |
|--------------------------|------------------------------------------------|----------------|-------------------|
| 3-point attempts per game | In pickup games, take at least 5 three-point attempts per session | Track makes/attempts | 25% or better (up from current ~10-15%) |
| Shot selection tracking   | Note: was the shot open? Was your stance set? Rate each attempt. | Tracking log | 80% of attempts are from set, open positions |

### Weekly Practice Schedule
| Day        | Focus                                     | Duration |
|------------|-------------------------------------------|----------|
| Monday     | Skill work (current stage drills)         | 60 min   |
| Tuesday    | Pickup game (apply skills in competition) | 60 min   |
| Wednesday  | Rest                                      | --       |
| Thursday   | Skill work (current stage drills)         | 60 min   |
| Friday     | Rest                                      | --       |
| Saturday   | Pickup game (apply skills in competition) | 60 min   |
| Sunday     | Rest or light shooting (fun, no pressure) | Optional |

### Session Structure (Skill Work Days)
| Block          | Duration | Activity                              |
|----------------|----------|---------------------------------------|
| Warm-up        | 10 min   | Light jog, dynamic stretching, layups |
| Stage drills   | 35 min   | Current drill progression from ladder |
| Free shooting  | 10 min   | Shoot from spots you enjoy -- maintain motivation |
| Cool-down      | 5 min    | Stretch, log results in tracking sheet |

### Milestones
| Checkpoint  | Target                                          | Date       |
|-------------|--------------------------------------------------|------------|
| 2 weeks     | Form shooting at rim: 80% make rate              | Week 2     |
| 4 weeks     | Free throw: 67% make rate with consistent form   | Week 4     |
| 6 weeks     | 3-point spot shooting: 40% from set positions    | Week 6     |
| 8 weeks     | 5-spot drill: 30% from 3-point line              | Week 8     |
| 12 weeks    | Pickup game 3-point rate: 25%+ on 5+ attempts    | Week 12    |

### Reassessment Plan
After 12 weeks, re-rate all basketball skill domains. If shooting has improved to a 3 rating, identify the next limiting factor (likely defense or rebounding) and build a new 12-week cycle. If shooting is still at 2, review video of your current form, identify the remaining sub-skill weakness, and run another shooting cycle with adjusted drills targeting the specific breakdown point.
