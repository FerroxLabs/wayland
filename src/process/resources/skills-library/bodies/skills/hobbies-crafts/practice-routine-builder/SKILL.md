---
name: practice-routine-builder
description: |
  Builds instrument-agnostic deliberate practice schedules with structured
  time allocation across warm-up, technique, repertoire, improvisation, and
  ear training blocks. Calibrates session length and difficulty to the user's
  available time (15 to 90 minutes) and skill level. Use when the user wants
  a structured practice routine for any musical instrument, asks how to
  organize practice time, wants to improve efficiently, or needs a weekly
  practice plan. Do NOT use for learning specific guitar chords (use
  guitar-beginner-foundations), music theory concepts (use
  music-theory-fundamentals), or recording setup (use home-recording-starter).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "workout-planning planning checklist step-by-step"
  category: "hobbies-crafts"
  subcategory: "performing-arts"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Practice Routine Builder

## When to Use

Use this skill when any of the following conditions are met:

- The user wants a structured, time-blocked practice schedule for any musical instrument -- guitar, piano, bass, drums, violin, cello, viola, voice, trumpet, saxophone, flute, clarinet, ukulele, banjo, mandolin, or any other
- The user explicitly asks how to organize or prioritize their practice time, including phrases like "I don't know what to practice," "I feel like I'm just noodling," or "I practice every day but I'm not improving"
- The user has a specific upcoming goal -- an audition, a jam session, a recital, a recording session, or performing a song for someone -- and needs to reverse-engineer a schedule from that deadline
- The user describes a plateau: "I've been stuck at 120 BPM for months," "I've been playing for two years and still feel like a beginner," "I can play all the parts separately but I can't put the song together"
- The user wants to balance competing practice priorities and doesn't know how to allocate limited time across technique, repertoire, improvisation, and ear training
- The user is resuming practice after a break of weeks or months and needs to recalibrate their routine to their current (reduced) ability level
- The user is transitioning from purely informal playing to deliberate, goal-oriented practice for the first time
- The user wants a weekly plan with rest days, varying session lengths on different days, and built-in flexibility for busy schedules

**Do NOT use this skill when:**

- The user wants to learn specific chords, chord shapes, or chord fingerings on guitar -- use `guitar-beginner-foundations` instead
- The user wants to understand music theory concepts (intervals, scales, modes, chord construction, the circle of fifths) -- use `music-theory-fundamentals` instead
- The user wants to set up a recording environment or learn DAW basics -- use `home-recording-starter` instead
- The user wants to write an original song, develop lyrics, or structure a composition -- use `songwriting-framework` instead
- The user is asking about buying an instrument, comparing models, or evaluating gear -- this is outside all practice skills
- The user's question is purely about music theory application in a performance context with no scheduling or structure component -- redirect to `music-theory-fundamentals`

---

## Process

### Step 1 -- Gather Practice Context (Ask All Required Questions Before Outputting a Routine)

Never generate a routine without the following information. If any item is missing, ask before proceeding.

- **Instrument:** Get the specific instrument. "Guitar" is not specific enough -- ask acoustic, electric, or classical. "Keyboard" is not specific enough -- ask whether they are treating it as piano technique or as a MIDI controller for production. Instrument determines warm-up type, injury risk profile, and which blocks apply.
- **Experience level:** Ask how long they have been playing AND what they can currently do. Time alone is unreliable -- an 18-month player who has had consistent weekly lessons plays differently from an 18-month player who noodled alone. Use capability descriptors:
  - **True beginner (0-6 months):** Cannot yet play a full song, still learning basic technique fundamentals, chord shapes, or embouchure
  - **Early intermediate (6-18 months):** Can play a few complete songs, has basic technical foundation, works on consistency and expanding repertoire
  - **Intermediate (1.5-4 years):** Fluent in first-position/open position material, beginning advanced technique (barre chords, position shifts, faster passages), learning harder repertoire
  - **Advanced (4+ years with consistent practice):** Technically fluent, working on nuance, repertoire difficulty, stylistic depth, performance preparation
- **Available time per session:** Ask for the realistic daily time, not the aspirational time. 20 minutes that actually happens beats 60 minutes that gets skipped. Common real-world windows: 15, 20, 30, 45, 60, 90 minutes
- **Days per week:** 3-7 days. Fewer than 3 days per week produces slow progress for beginners and is only appropriate for maintenance at intermediate/advanced levels
- **Primary goal:** The single most important thing they want to improve right now. Force them to pick one: speed/accuracy on technique, learning a specific song, improvisation fluency, reading music, ear training, tone and expressiveness, endurance for long playing, or general musical confidence
- **Existing habits:** Do they currently have any structure, or are they free-playing? Have they had a previous routine that stopped working? Knowing what they have tried prevents repeating failed approaches

---

### Step 2 -- Assign the Five Core Practice Blocks and Scale to Session Length

Every session uses the same five-block architecture, with proportions adjusted by session length and skill level. The blocks must appear in order -- sequence is not arbitrary. Warm-up before hard work. Hard technique before creative play. Never reorder the blocks.

**Block 1 -- Physical and Instrumental Warm-Up (10-15% of session, minimum 2 minutes)**

This block is non-negotiable. Repetitive strain injuries -- tendinitis, carpal tunnel syndrome, rotator cuff issues for high-arm instruments -- develop from cold muscles performing high-repetition technical work. Prevention is easier than recovery.

- **For string players (guitar, bass, violin, cello, ukulele, banjo, mandolin):** Start with 30 seconds of wrist circles, finger extensions, and forearm stretches before touching the instrument. On the instrument, begin with a chromatic walking exercise (1-2-3-4 ascending across all six strings, 4-2-3-1 descending) at 50-60 BPM. Slow single-note melodies also work. The rule: the warm-up tempo must feel almost comically slow
- **For keyboard players (piano, organ, synthesizer):** Hanon exercises at 60 BPM (not as a technique builder -- purely as a gentle mechanical warm-up), five-finger position scales, wrist rotation exercises. Never begin with octave stretches or wide reaches -- these require warm tissue
- **For drummers:** Paradiddles and single-stroke rolls at 60-70 BPM on a practice pad. Full-body warm-up is critical for drummers -- shoulder rolls, hip flexor stretches, ankle circles. The whole body is the instrument
- **For wind and brass players (trumpet, saxophone, flute, clarinet, trombone):** Long tones are the universal warm-up -- play a comfortable middle-register note at mezzo-forte for 4-8 beats, focusing on tone quality and steady airflow. Lip slurs for brass. Slow chromatic scales. No high-register playing in the first five minutes
- **For vocalists:** Lip trills (motorboat lips), humming on a comfortable pitch, slow sirens (glide from low to high and back on a neutral vowel like "ng"), and gentle five-tone scales ("1-2-3-4-5-4-3-2-1") at moderate volume. Never belt or push high notes cold. Drink room-temperature water before and during -- not cold water, which contracts the throat

**Block 2 -- Technique (25-35% of session)**

This is the highest-intensity cognitive and physical block. It must come after warm-up and before fatigue sets in. Technique work uses focused repetition to change the motor pattern -- it is essentially physical training for the nervous system.

- **Core technique principle -- the 90% accuracy rule:** Always begin a technique exercise at a tempo where you can execute it correctly at least 90% of the time. If you are making errors more than 10% of the time, the tempo is too fast. Practicing at error-saturated tempos reinforces mistakes neurologically
- **Metronome protocol:** Start at a baseline tempo where accuracy is 90%+. Execute 3 consecutive clean repetitions. Then increase by 2-4 BPM. If accuracy drops below 90% at the new tempo, drop back 4 BPM and rebuild. This is the standard method -- never skip more than 4 BPM at a time, never "push through" errors hoping they will self-correct
- **Instrument-specific technique priorities by level:**
  - Guitar beginner: chord shape accuracy, chord changes between 2-3 chords, alternate picking on single strings at 60-80 BPM
  - Guitar early intermediate: barre chord F and B shapes, position shifts, fingerpicking patterns (Travis picking, classical arpeggios), pentatonic scale in two positions
  - Guitar intermediate: economy picking vs. alternate picking choice, string skipping, sweep picking introduction, all five pentatonic positions, major scale in three positions
  - Piano beginner: five-finger position exercises, C-G-F-Am chord shapes with both hands separately, simple two-hand coordination with blocked chords left hand and melody right hand
  - Piano early intermediate: hands-together scales (C, G, D, A major), basic arpeggios, simple left-hand Alberti bass patterns, chord inversions
  - Piano intermediate: all major scales two octaves hands together, relative minor scales, contrary motion scales, basic sight-reading
  - Drums beginner: single-stroke roll, double-stroke roll, paradiddle, quarter-note bass-snare pattern with hihat
  - Drums intermediate: 16th-note hihat, ghost notes, linear fills, offbeat hihat patterns, basic swing pattern
  - Wind/brass beginner: long tones across comfortable range, chromatic scale slowly, basic articulation (slur vs. tongue)
  - Voice beginner: breath support exercises (sustained hissing, "sh" sounds to strengthen diaphragm), vowel clarity on five-tone scales, pitch accuracy matching piano pitches

**Block 3 -- Repertoire (25-35% of session)**

Repertoire is where technique meets music. It is motivationally essential -- players who only do exercises quit. The repertoire block must balance new learning and maintenance of previously learned material.

- **New material protocol -- the 4-8 bar chunk method:** Never attempt to learn an entire song in one session. Break new pieces into chunks of 4-8 measures. Learn one chunk per session. When three consecutive clean run-throughs of the chunk are achieved at a slow tempo (50-70% of target tempo), it is ready to connect to the previous chunk. The connection point (the join between previously learned and new material) always requires extra attention -- the last measure of learned material to the first measure of new material is its own mini-chunk
- **Maintenance protocol:** Previously learned pieces need regular review or they fade. Run through 1-2 maintained pieces at performance tempo. If errors appear during maintenance, do not fix them in that session -- note which measure failed and move that passage into the Technique block in the next session as an isolated exercise
- **Slow practice is the fastest path:** A passage practiced at 60% of target tempo with perfect accuracy reaches performance tempo faster than a passage ground through at 90% tempo with frequent errors. The neural pathway being built must be built correctly -- errors create competing neural pathways that have to be overcome, not just bypassed
- **Song selection by level:** Beginners should choose pieces where 80% of the material is within current ability -- the "learning zone" is the remaining 20%. If a piece is entirely within current ability, it is maintenance material, not learning material. If more than 30% is beyond current ability, the piece is too advanced for productive repertoire work at this stage

**Block 4 -- Ear Training and Reading (10-15% of session, may be dropped for 15-minute sessions)**

Ear training is the most commonly skipped block and the most responsible for the gap between technical players who "can't really hear music" and musical players who seem to instinctively know what to play. It requires no instrument in hand for many exercises, making it easy to do during commutes, walks, or rest periods.

- **Interval recognition (universal starting point):** Play two notes either sequentially or simultaneously and identify the interval. For beginners: focus only on unison, octave, perfect 5th, and major 3rd vs. minor 3rd. Intermediate players add all seven basic intervals. Advanced players work on compound intervals and identifying intervals in the context of a key
- **Chord quality recognition:** Play a chord (major, minor, diminished, augmented, dominant 7th) and identify its quality. Beginners: major vs. minor only. Intermediate: add diminished and dominant 7th. Advanced: identify seventh chord types and extended chords
- **Relative pitch training:** Sing back a melody or single note played on the instrument. This is separate from perfect pitch (which is rare and cannot be reliably trained in adults) -- relative pitch training improves the ability to find and reproduce pitches by reference
- **Sight reading or chart reading:** For classically-trained and jazz players, sight-reading at half tempo without stopping is more valuable than reading slowly and correcting every error. The goal of sight-reading practice is forward motion and pattern recognition, not perfect accuracy. Move the exercise to the technique block if accuracy is the current goal
- **Active listening homework (outside session time):** Listen to a recording of a piece in the student's style and try to identify chord changes by ear, clap along to identify the meter, or sing the bass line. This is optional in-session but highly effective

**Block 5 -- Creative Play and Improvisation (10-15% of session)**

This block serves three functions: integrating skills developed in other blocks, preventing burnout, and developing musical personality. It must not become a fifth technique block. No corrections allowed, no stopping to fix wrong notes, no metronome required.

- **Backing track improvisation:** The most productive form of creative play. Choose a backing track in a style the player likes. For beginners, stick to a one-chord or two-chord vamp. For intermediate players, use a 12-bar blues, a II-V-I progression, or a common pop progression (I-V-vi-IV). Improvise freely over it, using only the techniques currently in the player's vocabulary
- **Texture exploration:** For non-improvisers and classical players who find free improvisation uncomfortable, replace it with texture exploration -- play the same four-bar phrase in three different ways: softly, loudly, with different articulation. This develops expressive range without the pressure of melodic invention
- **Compositional sketching:** Play a simple chord progression that the player invents, then find a melody over it. These sketches are discarded -- the goal is musical thinking, not finished products
- **The "only rule" for the creative block:** Keep playing for the full allotted time. Do not stop to fix mistakes. Do not restart from the beginning. Do not evaluate the output. Musical courage is developed by playing through discomfort

---

### Step 3 -- Scale Time Blocks to the User's Session Length

Apply the following proportions as the starting point, then adjust based on level and goal:

| Session | Warm-up | Technique | Repertoire | Ear/Reading | Creative |
|---------|---------|-----------|------------|-------------|----------|
| 15 min  | 2 min   | 6 min     | 5 min      | 0 min       | 2 min    |
| 20 min  | 3 min   | 7 min     | 6 min      | 2 min       | 2 min    |
| 30 min  | 4 min   | 9 min     | 9 min      | 4 min       | 4 min    |
| 45 min  | 5 min   | 14 min    | 13 min     | 7 min       | 6 min    |
| 60 min  | 8 min   | 18 min    | 18 min     | 9 min       | 7 min    |
| 90 min  | 12 min  | 25 min    | 26 min     | 14 min      | 13 min   |

**Level-based adjustments to the default proportions:**

- **True beginner (0-6 months):** Increase Technique by 5 minutes, decrease Creative by 5 minutes. Ear training may be reduced to 2 minutes (interval recognition only) for the first 8 weeks. Rationale: fundamentals require more repetition time, and creative play is less productive before basic technical vocabulary exists
- **Early intermediate:** Use default proportions. All five blocks active
- **Intermediate:** Reduce Warm-up to 8% (foundations are established, but never eliminate it). Increase Creative to 20% -- intermediate players benefit greatly from improvisation for expressive development
- **Advanced:** Proportions become highly goal-specific. A conservatory-level player preparing for an audition front-loads Repertoire to 50%. A jazz player developing fluency front-loads Creative and Ear training to 40% combined. Adapt to the stated goal

---

### Step 4 -- Build the Weekly Schedule with Rotating Emphasis

Vary the focus across the week to develop multiple skills simultaneously without making any single block the sole emphasis every day. Repetition of the same block emphasis day after day produces rapid boredom and diminishing returns.

**The seven-day rotation template (adjust for 3-7 practice days):**

- **Day 1 -- Technique Emphasis:** Extend Technique block by 8-10 minutes. Reduce Repertoire by the same amount. Rationale: starting the week with focused technical work establishes momentum and creates skills to apply in repertoire work later in the week
- **Day 2 -- Repertoire Emphasis:** Extend Repertoire by 8-10 minutes. Reduce Technique. This is the day for making real progress through a piece
- **Day 3 -- Balanced Day:** Default proportions, no adjustment. This functions as a consolidation session -- skills from Days 1 and 2 begin to integrate
- **Day 4 -- Ear Training Emphasis:** Extend Ear/Reading to double its normal duration. Reduce Creative. For players who skip ear training, this day makes it unavoidable
- **Day 5 -- Performance Simulation:** Run through all currently learned repertoire beginning to end without stopping, at or near performance tempo. Simulate real performance conditions: sit or stand as if performing, do not restart for errors. Follow with an extended Creative block
- **Day 6 -- Creative Emphasis:** Extend Creative to 25-30% of session. Reduce Technique. Improvise, explore, play for joy. This day regenerates motivation for the whole week
- **Day 7 -- Rest or Light Review:** If practicing 6 days: this is a full rest day. If practicing 7 days: 15-minute maximum, warm-up plus one loved piece played for enjoyment, no technique drills

**Adjusting for fewer practice days:**

- **5 days/week:** Combine Days 4 and 5 (ear training folded into performance sim day). Day 6 becomes Day 5. One full rest day
- **4 days/week:** Use Day 1 (Technique), Day 2 (Repertoire), Day 3 (Balanced), Day 6 (Creative). Drop dedicated ear/performance sim days -- fold ear training into every session at minimum 3 minutes
- **3 days/week:** Monday (Technique + Ear), Wednesday (Repertoire + Creative), Friday (Balanced + Performance Sim). This is the minimum viable schedule for measurable improvement

---

### Step 5 -- Set Specific, Measurable Weekly Milestones

Milestones must be numerical. Vague goals are not milestones.

**Technique milestones:**
- Express as BPM range: "G major scale ascending/descending, two octaves, at 92 BPM by end of week" or "Chord change G to C, 4 times per measure, at 80 BPM with no hesitation"
- Express as accuracy percentage: "Barre chord F-major, 8 out of 10 attempts clean (no buzzing, all strings sounding)" -- 80% accuracy threshold
- Express as duration: "Sustain trumpet long tone on middle G for 12 beats at 60 BPM without wavering"

**Repertoire milestones:**
- Express as bars learned: "Measures 1-8 of the piece at 70% of target tempo, hands separately and together"
- Express as sections: "Verse of the song played through twice without stopping at 80 BPM"
- Express as completion: "Entire 12-bar blues head from memory at performance tempo"

**Ear training milestones:**
- Express as percentage correct out of N trials: "Identify major vs. minor chord quality correctly on 8 out of 10 trials"
- Express as interval recognition target: "Correctly identify all seven diatonic intervals (unison through octave) 70% of the time in random order"

**Creative milestones:**
- Record one 30-second improvisation per week using the phone's voice memo function. Do not evaluate the recording during the session -- listen back the following week to notice development
- Define a constraint for the week: "Improvise using only pentatonic scale and no note repetition within 4 beats" -- constraints force creative problem-solving

---

### Step 6 -- Build In Plateau-Breaking Protocols

Every player will hit plateaus. Providing pre-planned strategies in the routine itself means the player doesn't abandon the plan when stuck -- they have a procedure to follow.

**The five categories of plateau and their interventions:**

1. **Speed plateau (technique block):** The metronome has been stalled at the same BPM for more than two consecutive weeks
   - Intervention A -- Rhythmic displacement: Practice the passage in dotted-eighth-sixteenth rhythm (long-short-long-short), then in reverse (short-long-short-long). Return to even rhythm. This forces the nervous system to re-approach the passage from a different motor pattern
   - Intervention B -- Chunking inversion: Learn the passage backward (last measure first, second-to-last second) and then chain forward. Backward learning eliminates the "momentum effect" that masks technical problems in the middle of a passage
   - Intervention C -- Tempo wave: Practice at target tempo minus 15%, then target tempo minus 5%, then 5% above target, then back to target. Wave practice breaks tempo fixation

2. **Repertoire plateau (stuck on a difficult passage):** The same measures fail every time
   - Intervention A -- Isolate the seam: 95% of passage errors occur at transitions, not within phrases. The last beat of measure 4 and the first beat of measure 5 is a seam. Practice only that seam -- one beat before and one beat after the problem point -- 20 repetitions before adding context
   - Intervention B -- Slow record and listen: Record the problem passage at 50% of target tempo. Listen back immediately. The ear catches what the hands miss -- brain and fingers have different perspectives on the same performance
   - Intervention C -- Alter the sensory channel: Singers hum the melody without words. Pianists tap the rhythm on the fallboard before playing. Guitarists air-guitar the passage before picking up the instrument. Changing the sensory engagement breaks habitual failure patterns

3. **Motivational plateau (practice feels pointless):** Common after 6-18 months, often called the "intermediate slump"
   - Intervention: Record a video of current playing and compare to a recording from 3 months ago. Objective evidence of progress resets motivation when subjective feeling has gone flat
   - Intervention: Change 30% of repertoire entirely -- learn one piece in a completely different style than usual. Novelty restores curiosity
   - Intervention: Find a musical partner -- a jam session, a lesson, or an online community for the instrument. Social accountability and musical exchange break motivational stagnation

4. **Technical ceiling (approaching the limit of current ability):** The technique is as good as current physical development supports
   - This requires honest identification: Is this a temporary plateau or a genuine limit? A genuine limit means the player has built as much motor skill as is possible with current approaches. The prescription is a teacher, not more solo practice
   - Signs of a genuine ceiling: no improvement over 4-6 weeks despite varied approaches, increasing tension and discomfort during technique work (a sign of overuse), no new errors -- performance is consistent but stuck

5. **Rest-induced breakthrough:** The most underutilized protocol
   - Take 2-3 full days off. Not out of laziness -- deliberately. Sleep consolidates motor learning more effectively than additional practice. Many players return from a 3-day break and find that previously difficult passages feel easier. Build at least one "consolidation week" every 6-8 weeks into the long-term plan -- reduce practice by 50% for one full week, then resume full schedule

---

### Step 7 -- Provide a 4-Week Progression Arc

A single week's routine is not enough. Provide the 4-week arc that shows the progression within the first month so the user understands how the routine evolves.

- **Week 1:** Establish baseline. Use conservative tempos and easy milestones. The primary goal is building the habit of the routine, not maximum progress. Log starting BPMs and starting accuracy percentages for every tracked element
- **Week 2:** Increase technique target tempo by 4-8 BPM. Add one new bar or chunk to repertoire. Slightly increase ear training targets (add one new interval or chord quality to the recognition pool)
- **Week 3:** Assess what has improved and what has not. Apply plateau strategies to anything that has not progressed in two consecutive weeks. Do not increase targets across the board -- increase only what has responded to training
- **Week 4:** Consolidation week. Reduce overall session length by 10-15 minutes. Focus on polishing existing work rather than adding new material. Run the performance simulation day twice this week. This builds retention before the next month's learning phase begins

---

### Step 8 -- Deliver Instrument-Specific Safety and Technique Notes

Every routine output must include a brief instrument-specific safety note. These are not optional disclaimers -- they prevent common injuries and habits that cause long-term problems.

- **Guitar/bass:** Stop if you feel pain or tingling in the wrist, forearm, or shoulder. Tingling is nerve compression, not soreness -- it is a medical issue. Check left-hand thumb position (should be behind the neck, not hooked over) and right-hand wrist angle (flat wrist for flatpicking, not severely bent)
- **Piano:** Stop if you feel tension in the forearm or between the knuckles. Piano technique depends on arm weight, not finger pressure -- pushing hard is the enemy of speed and the cause of tendinitis. Wrists should be level or slightly raised, never dropped below the keys during fast passages
- **Drums:** Hearing protection is non-negotiable during full-kit practice. Even 30 minutes of unprotected drumming at full volume in a small room causes measurable temporary threshold shift. Use foam earplugs (NRR 29+) or drummer's earmuffs (Vic Firth and similar brands are industry standards for kit practice). Grip check: matched grip wrists should be level with sticks at rest, not angled up
- **Brass/wind:** Mouthpiece pressure is the most common beginner error -- pressing the mouthpiece into the lips harder does not improve the high register, it restricts blood flow and causes fatigue and eventual embouchure damage. High register development requires air speed and lip configuration changes, not pressure
- **Voice:** Never practice through throat soreness. The speaking voice becoming hoarse after singing is a warning sign, not normal fatigue. Singers who are sick should rest the voice entirely. Maximum continuous singing in a practice session without rest: 20-25 minutes for beginners, 40 minutes for intermediate singers

---

## Output Format

Deliver the complete routine in this structure every time:

```
## Practice Routine: [Instrument] ([Level])

### Practice Profile
- Instrument: [specific instrument, e.g., "Acoustic Guitar -- Steel String"]
- Level: [level descriptor and duration, e.g., "Early Intermediate (18 months)"]
- Session length: [X] minutes
- Days per week: [X]
- Primary goal: [single stated goal]
- Secondary goal (if stated): [secondary goal or "none stated"]
- Session type: [Solo home practice / Lesson-supplementary / Pre-performance preparation]

---

### Daily Session Template ([X] minutes)
| Block         | Duration | This Week's Specific Focus                       | Metronome/Tempo       |
|---------------|----------|---------------------------------------------------|-----------------------|
| Warm-up       | X min    | [Specific exercise, body part, movement]          | [BPM or "slow/easy"]  |
| Technique     | X min    | [Specific exercise: name, key, pattern, target]   | [Start BPM -- goal BPM] |
| Repertoire    | X min    | [Piece title, specific bars, tempo target]        | [BPM]                 |
| Ear Training  | X min    | [Specific drill: interval type, chord quality]    | N/A                   |
| Creative Play | X min    | [Specific prompt or backing track key/style]      | Off                   |

---

### Weekly Schedule ([X] practice days)
| Day         | Emphasis          | Adjusted Blocks                                    | Total Time |
|-------------|-------------------|----------------------------------------------------|------------|
| [Day Name]  | Technique Heavy   | Technique +X min, Repertoire -X min                | X min      |
| [Day Name]  | Repertoire Heavy  | Repertoire +X min, Technique -X min                | X min      |
| [Day Name]  | Balanced          | Standard allocation                                | X min      |
| [Day Name]  | Ear Training      | Ear Training doubled, Creative reduced             | X min      |
| [Day Name]  | Performance Sim   | Full run-throughs, extended Creative               | X min      |
| [Day Name]  | Rest / Light      | Warm-up + one favorite piece, 15 min max           | 15 min max |

---

### This Week's Milestones
| Block         | Measurable Target                                   | How to Verify              |
|---------------|-----------------------------------------------------|----------------------------|
| Technique     | [Exercise] at [X] BPM, [X] consecutive clean reps  | Metronome + count reps     |
| Repertoire    | [Piece/section], bars [X]-[X] at [X]% target tempo | Run-through without stop   |
| Ear Training  | [Interval/chord quality] correct [X] out of 10     | Self-scored tally sheet    |
| Creative      | Record 30-sec improvisation, [key/style prompt]     | Voice memo or phone video  |

---

### Plateau Strategies (Pre-Planned -- Use When Stuck)
1. [Technique plateau strategy specific to this instrument and the stated goal]
2. [Repertoire plateau strategy specific to the piece type or passage challenge]
3. [Motivational strategy specific to this level]

---

### Safety Note
[Instrument-specific injury prevention note -- 2-3 sentences maximum]

---

### 4-Week Progression Arc
| Week | Technique Target      | Repertoire Target              | Ear Target           | Session Tone         |
|------|-----------------------|--------------------------------|----------------------|----------------------|
| 1    | [Start BPM/accuracy]  | [Starting chunk: bars X-X]     | [Starting interval]  | Build habit          |
| 2    | [+4-8 BPM or +5% acc] | [Next chunk: bars X-X]         | [Add one new item]   | Build skill          |
| 3    | [Continued increase]  | [Chain sections or add piece]  | [Increase difficulty] | Assess and adjust   |
| 4    | [Consolidation tempo] | [Polish all learned material]  | [Retention check]    | Consolidate, rest   |
```

---

## Rules

1. **Never output a routine without all required context.** If the user has not stated their instrument, level, session time, and primary goal, ask before generating the routine. A mismatched routine is worse than no routine -- it builds the wrong habits or fails to fit the player's actual schedule.

2. **Warm-up is never optional and never abbreviated below 2 minutes.** Even for a 15-minute session, 2 minutes of warm-up is mandatory. The most common cause of practice-related injury among hobbyists is starting technique work cold. Document this explicitly in the output.

3. **Technique block metronome use is mandatory.** Practice without a metronome in the technique block builds sloppy timing that becomes increasingly difficult to correct. The brain optimizes for whatever pattern it repeats -- practicing without a reference point means the player is practicing their own tempo inconsistencies. There are no exceptions to this rule in the Technique block. The Creative block is explicitly metronome-free by contrast.

4. **Session length must exactly match the stated available time.** If the user says they have 25 minutes, do not output a 30-minute routine. Round down to the nearest template (20 minutes in that case). A routine the user cannot complete in the allotted time will be abandoned after the first day.

5. **At least one full rest day per week is mandatory.** For 7-days-per-week requesters: provide the routine but include a firm note that 7 consecutive days of focused practice inhibits neural consolidation and increases injury risk. Strongly recommend 1-2 rest days. Motor learning consolidates during sleep and rest -- the day off is not wasted practice time, it is an active part of the learning process.

6. **Technique exercises must be fully specified.** "Practice scales" is not a technique exercise. The correct format is: "[Scale name] in [key], [starting octave], [pattern], [fingering if relevant], [tempo range]." Example: "G major scale, two octaves, ascending and descending, alternate picking, 70-84 BPM." Anything less specific cannot be practiced consistently from session to session.

7. **Milestones must be numerical.** "Improve at barre chords" is not a milestone. "Barre chord F-major with all six strings sounding clean, 7 of 10 attempts, by end of week" is a milestone. The measurement method must be specified alongside the target -- not just what to achieve but how to verify it.

8. **Never exceed 90 minutes of focused practice per session for amateur and hobbyist players.** Beyond 90 minutes, attention deteriorates, muscle fatigue increases error rates, and the neural learning signal weakens. Professional players with years of physical conditioning may practice 4-6 hours with structured breaks, but for the target audience of this skill, 90 minutes is the hard ceiling. If a user insists on longer sessions, suggest 2 separate sessions with a minimum 4-hour rest between them.

9. **True beginners in the first 8 weeks get a modified block structure.** Ear training is reduced to 2 minutes (unison/octave recognition only) and Creative block time is redirected to additional Repertoire. Beginners need maximum repetition time on fundamentals before creative exploration becomes productive. The standard five-block proportions apply from Week 9 onward.

10. **The Creative Play block must be explicitly judgment-free in the output.** Write the creative block instruction in a way that communicates that wrong notes, silence, and repetition are all acceptable. Many players, especially beginners and classically trained players, experience anxiety in unstructured practice. Framing the creative block as a reward and a zone without correction actively counteracts this anxiety and maintains long-term practice motivation.

---

## Edge Cases

### User has only 10-15 minutes per day
The research on massed vs. distributed practice strongly supports short daily sessions over long infrequent ones -- 15 minutes daily produces more motor learning than 75 minutes once a week for beginner and intermediate players. For 15-minute sessions, compress to four blocks and drop Ear Training entirely from the session:

- Warm-up: 2 minutes (non-negotiable)
- Technique: 5-6 minutes
- Repertoire: 5 minutes
- Creative: 2 minutes

Schedule Ear Training separately: 5-10 minutes during a commute, lunch break, or before bed using a piano app or relative pitch trainer app on the phone. Ear training does not require the instrument in hand and can be decoupled from physical practice sessions.

### User practices multiple instruments simultaneously
Do not split a single session between two instruments. Context switching between instruments within a session reduces the learning depth for both. Instead, build separate complete routines and assign each to dedicated sessions. Alternate days when possible: Instrument A on Monday/Wednesday/Friday, Instrument B on Tuesday/Thursday/Saturday. Both routines should stand alone as complete sessions, not as halves of a combined routine. If daily time is too limited to give each instrument adequate sessions, acknowledge this directly and help the user choose a primary instrument for focused development. "Dabbling in two instruments" is a valid hobby -- but if progress is the goal, depth of focus on one instrument for 3-6 months before adding the second is the more effective path.

### User is recovering from a repetitive strain injury (tendinitis, carpal tunnel, lateral epicondylitis)
This is a medical situation, not a practice optimization challenge. The routine must be redesigned around zero-pain limits:

- Reduce all session lengths to 50% of normal
- Eliminate the Technique block entirely during recovery -- high-repetition, rhythmically dense work is what caused the injury
- Gentle Repertoire at very slow tempo (50% of normal tempo) is acceptable if it produces no discomfort
- Ear training and theory work (paper-based or mental) produce no physical strain and can fill the time
- Creative play with zero technical demands (slow, expressive, single-note playing) is acceptable
- Include this statement explicitly: "If you feel any pain, numbness, or tingling during practice, stop immediately. Please consult a physician or physical therapist who works with musicians before resuming full practice. Continuing to practice through RSI symptoms converts a temporary injury into a chronic condition."

### Vocalist edge case
Vocalists require an entirely different warm-up sequence and injury prevention paradigm than instrumentalists. The vocal instrument is embedded in the body and subject to systemic factors (hydration, sleep quality, illness, acid reflux, hormonal changes) that external instruments are not:

- Replace physical warm-up with: 2 minutes of humming on comfortable pitches, lip trills on a five-tone scale (do-re-mi-re-do), slow sirens on "ng" consonant, spoken text articulation exercises
- Replace technique with: breath support exercises (sustained hiss for 15-20 seconds, building to 25-30 seconds), vowel modification on scales, registration transitions (chest-to-head voice negotiation on a slide), vibrato development for singers who have been singing 2+ years
- Add hydration protocol to the output: 500-750ml of room-temperature water before and during practice, no dairy within 2 hours before practice (thickens mucus), no caffeine within 2 hours (dries mucosa), no whispering when voice is fatigued (whispering is more vocally damaging than gentle phonation)
- Schedule-specific note: voices fatigue differently than hands. Two 20-minute sessions separated by 2 hours produce more vocal development than one continuous 40-minute session

### User wants a routine for performance preparation with a specific deadline
This is a different planning problem than open-ended skill development. Reverse-engineer from the deadline:

- Count available practice days until the performance
- Identify all material that must be performance-ready
- Divide the time into three phases: Learning Phase (first 40% of available time), Polishing Phase (next 35%), Performance Simulation Phase (final 25%)
- During Performance Simulation Phase, do a full run-through under simulated conditions at least twice per week -- standing if performing standing, using an actual microphone if the performance uses a mic, inviting one observer to watch (the stress of a single observer is 80% of the stress of a full audience)
- Reduce new learning to zero in the final two weeks -- the brain cannot consolidate new motor patterns fast enough to be useful at performance level, and attempting to add new material increases performance anxiety

### User has had no previous structured routine and describes "just noodling" for 1-2 years
This is a very common profile: a player with real accumulated ability and intuitive musicianship who has never applied deliberate practice. They will often be more capable than their formal "level" suggests (because years of free play builds musical ear and creativity) but have significant gaps in fundamentals (scale knowledge, consistent technique, sight-reading).

- Start with an assessment week: ask them to record themselves playing for 5 minutes (anything they want, how they normally play)
- Based on what they describe in their recording, identify 2-3 specific skill gaps that deliberate practice can address
- The first week's routine should feel only slightly more structured than what they already do -- increase structure gradually or the transition from free play to deliberate practice will cause them to abandon the routine
- Creative block is especially important for this profile -- it must be large enough (at least 15% of session) that the routine does not feel like it is eliminating the fun they previously had

### User practices only 3 days per week and wants to know if that is "enough"
Frame the honest answer carefully: 3 days per week is enough for meaningful, consistent progress -- but "meaningful" is calibrated to realistic expectations. With 3 days per week at 30 minutes per session (90 minutes of weekly practice), a beginner player can expect to learn 1-2 new chord changes per month, advance technique tempo by approximately 4-8 BPM per week, and reach comfortable early-intermediate level after 18-24 months. A 5-day-per-week player will cover the same ground in approximately 12-14 months. What 3 days per week prevents is: rapid improvement, high-level technique development, and performance readiness for demanding material. It is a perfectly valid choice for a hobbyist whose goal is enjoyment and gradual growth.

---

## Example

**User input:** "I've been playing piano for about 2.5 years. I can play hands together, I know all the major scales, and I'm learning a Chopin nocturne (Op. 9 No. 2). I have 45 minutes a day, 5 days a week. My main frustration is that my right hand runs (the ornamented melody sections) are always rushed and uneven, and I can't get the left hand arpeggios smooth at a musical tempo yet. I'm aiming to have this piece performance-ready in 10 weeks."

---

## Practice Routine: Piano (Intermediate -- Performance Preparation)

### Practice Profile
- Instrument: Piano
- Level: Intermediate (2.5 years, hands-together, all major scales, learning advanced romantic repertoire)
- Session length: 45 minutes
- Days per week: 5 (Monday through Friday, with Saturday and Sunday as rest)
- Primary goal: Performance-ready Chopin Nocturne Op. 9 No. 2 in 10 weeks
- Secondary goal: Even right-hand ornamented runs and smooth left-hand arpeggios
- Session type: Performance preparation with 10-week deadline
- Performance phases: Learning/Polishing (Weeks 1-7), Performance Simulation (Weeks 8-10)

---

### Daily Session Template (45 minutes)

| Block         | Duration | This Week's Specific Focus                                                                    | Metronome/Tempo          |
|---------------|----------|-----------------------------------------------------------------------------------------------|--------------------------|
| Warm-up       | 5 min    | E-flat major scale (the home key of the nocturne), 2 octaves, hands separately then together, then E-flat major arpeggio, both hands | 60-72 BPM, no pressure   |
| Technique     | 14 min   | (7 min) RH ornamental run isolation: mm. 5-6 right hand only, scale segment extracted, slow practice with rhythmic displacement. (7 min) LH arpeggios: left hand alone, mm. 1-4, arm weight technique, no finger pressure | RH: start at 50 BPM (16th = 1 beat). LH: 52 BPM |
| Repertoire    | 13 min   | Learning section: mm. 1-8, hands separate, then hands together. Polishing previously learned: mm. 1-4 at 75% of target tempo (target = approx. 60 BPM dotted-quarter) | 45 BPM dotted-quarter for new material, 52 BPM for polishing |
| Ear Training  | 7 min    | Chopin harmonic ear training: play the left-hand accompaniment in mm. 1-4 (E-flat major, B-flat7, cm, A-flat) and sing/identify each chord quality. Then, play the nocturne's chromatic passing tones and identify each as a semitone above or below the underlying harmony | No metronome              |
| Creative Play | 6 min    | Improvise freely in E-flat major using only the ornamental rhythm figure from the nocturne as a melodic motif over a simple I-IV-V-I pattern. No metronome. No corrections. | Off                       |

---

### Weekly Schedule (5 practice days)

| Day       | Emphasis            | Adjusted Blocks                                                                 | Total Time |
|-----------|---------------------|---------------------------------------------------------------------------------|------------|
| Monday    | Technique Heavy     | Technique 22 min (+8), Repertoire 8 min (-5), others standard                  | 45 min     |
| Tuesday   | Repertoire Heavy    | Repertoire 20 min (+7), Technique 7 min (-7), others standard                  | 45 min     |
| Wednesday | Balanced            | Standard allocation (5/14/13/7/6)                                               | 45 min     |
| Thursday  | Ear Training Heavy  | Ear Training 14 min (doubled), Creative 0 min (absorbed into ear), Technique 10 min | 45 min  |
| Friday    | Performance Sim     | Technique 5 min (only warm-up level), Repertoire 28 min (full run-throughs of all learned material, no stopping), Creative 7 min | 45 min |
| Saturday  | Rest                | Full rest                                                                       | 0 min      |
| Sunday    | Rest                | Full rest                                                                       | 0 min      |

---

### This Week's Milestones

| Block         | Measurable Target                                                                                   | How to Verify                          |
|---------------|-----------------------------------------------------------------------------------------------------|----------------------------------------|
| Technique     | RH ornamental run (mm. 5-6 extracted pattern) at 60 BPM (16th = 1 beat), 3 consecutive clean reps with no rushing at the top of the turn | Metronome + count consecutive reps     |
| Technique     | LH mm. 1-4 arpeggios at 56 BPM, arm weight not finger pressure, all notes equal volume (no thumb accent) | Metronome + phone recording for thumb accent check |
| Repertoire    | Measures 1-8, hands together, at 45 BPM dotted-quarter, no stopping for errors                     | Full run-through of these 8 bars once without stopping |
| Ear Training  | Correctly identify all 4 chords in mm. 1-4 (E-flat, B-flat7, cm, A-flat) by quality and function 4 of 4 times | Play without score, sing chord names aloud |
| Creative      | Record one 2-minute improvisation in E-flat major using ornamental rhythms                          | Phone voice memo, filed by date         |

---

### Plateau Strategies (Pre-Planned -- Use When Stuck)

1. **If the RH ornamental run remains uneven after 2 weeks:** Extract exactly the 4-6 notes of the ornament (not the surrounding melody) and practice only those notes in dotted-eighth/sixteenth rhythm, then reverse to sixteenth/dotted-eighth, then even 16ths. Return to the full measure after rhythmic displacement has clarified the sequence. If the rushing happens specifically at the peak of the ornament (the turn), isolate the three-note turn alone and practice it at 40 BPM before re-inserting it into context

2. **If LH arpeggios feel stiff or show thumb accent bumps:** Practice the arpeggio with the thumb muted (thumb depresses the key but produces no sound -- just maintain key contact). The remaining four fingers must carry all the sound. This forces redistribution of arm weight away from thumb dominance. Restore thumb sound after 5 repetitions. Alternatively, practice the arpeggio with arm rotation -- feel the forearm rotate slightly from the elbow as the hand crosses from bass note to upper notes, rather than a sideways wrist shift

3. **If motivational plateau occurs around Week 5-6 (very common in performance prep):** Record a full play-through of the entire learned section on video. Watch it back 48 hours later. Compare to the recording from Week 1. The gap between subjective feeling ("I'm not improving") and objective evidence (the recording) is usually large and restorative. Additionally, learn one new piece for pure enjoyment -- a simple piece that takes one week, not 10. This "palate cleanser" prevents burnout without breaking the preparation timeline

---

### Safety Note

Piano technique depends on arm weight transfer, not on pressing down with the fingers. If you notice tension or soreness in the forearm (especially during fast passage work or large stretches), stop immediately and reassess hand position -- wrists should be level or slightly elevated, knuckles domed, fingers curved. Flat fingers and dropped wrists are the most common cause of piano-related tendinitis. The ornamental runs in Chopin require loose wrists, not firm ones. If your wrist is rigid during the run, the notes will be both uneven and physically risky over time.

---

### 4-Week Progression Arc

| Week | Technique Target                                    | Repertoire Target                                   | Ear Target                               | Session Tone              |
|------|-----------------------------------------------------|-----------------------------------------------------|------------------------------------------|---------------------------|
| 1    | RH ornament at 60 BPM / LH arpeggio at 56 BPM      | Learn mm. 1-8, HT at 45 BPM dotted-quarter          | Identify 4 chords mm. 1-4 by quality     | Build routine habit       |
| 2    | RH ornament at 66 BPM / LH arpeggio at 60 BPM      | Learn mm. 9-16, chain mm. 1-16, HT at 48 BPM        | Add mm. 5-8 
