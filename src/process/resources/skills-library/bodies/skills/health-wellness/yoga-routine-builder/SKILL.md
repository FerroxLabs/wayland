---
name: yoga-routine-builder
description: |
  Builds structured yoga sequences for morning, evening, and focus-specific practices (hip-opener, back relief, stress reduction) with pose selection, hold times, flow order, and modifications by flexibility level. Produces a complete sequenced routine with Sanskrit and English pose names.
  Use when the user asks about building a yoga routine, designing a yoga sequence, morning or evening yoga flows, or yoga for specific areas like hips, back, or shoulders.
  Do NOT use for meditation-only practices, injury rehabilitation yoga (consult a qualified yoga therapist), or advanced inversion and arm-balance training.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "yoga fitness mental-wellness"
  category: "health-wellness"
  subcategory: "fitness-exercise"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Yoga Routine Builder

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. This information is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before beginning a new fitness program, particularly if you have any pre-existing conditions, injuries, or chronic pain. If you are experiencing a medical emergency, contact emergency services immediately.

---

## When to Use

**Use this skill when:**
- A user wants to build a structured yoga sequence for a specific time of day -- morning energizing practice, midday reset, or evening wind-down
- A user requests a yoga routine targeting a specific area -- hip openers, hamstring lengthening, spinal decompression, shoulder mobility, or chest opening
- A user wants a goal-oriented yoga sequence -- stress reduction, improved sleep, athletic recovery, or general flexibility development
- A user asks for a beginner-friendly yoga flow with clear breath cues and pose-by-pose guidance
- A user wants a session of a specific duration (15, 20, 30, 45, or 60 minutes) with a structured arc
- A user wants to understand how to sequence poses intelligently (what comes before what, and why)
- A user practicing at home wants prop adaptations and modifications to replace studio instruction

**Do NOT use this skill when:**
- The user wants only pranayama (breathwork) or meditation without physical asana -- use a dedicated breathing or mindfulness skill instead
- The user is recovering from a specific injury (torn rotator cuff, herniated disc, post-surgical rehabilitation, ankle fracture) -- refer them to a qualified yoga therapist (C-IAYT) or physical therapist; do not adapt sequences therapeutically without clinical assessment
- The user asks for advanced inversion training -- headstand (Sirsasana), handstand (Adho Mukha Vrksasana), or forearm stand (Pincha Mayurasana) all require direct in-person instruction for safe neck, shoulder, and fall mechanics; do not program these
- The user wants arm balance progressions -- Crow pose (Bakasana), Side Crow (Parsva Bakasana), Flying Pigeon (Eka Pada Galavasana) carry significant wrist and fall risk without real-time feedback
- The user specifies a prenatal context -- prenatal yoga sequencing requires specialized training around supine time, blood pressure, diastasis recti risk, and trimester-specific contraindications; direct to a certified prenatal yoga instructor
- The user describes acute or undiagnosed pain as the primary reason for seeking yoga -- pain is a signal requiring medical evaluation before exercise programming

---

## Process

### Step 1: Gather Practice Parameters

Before generating any sequence, collect the following. If the user's request already contains this information, extract it directly without asking again.

- **Primary purpose:** Choose one -- morning energizing, evening wind-down, hip opening, hamstring lengthening, spinal decompression/back relief, shoulder and chest opening, athletic recovery (post-run, post-strength training), stress and anxiety reduction, sleep preparation, general flexibility
- **Session duration:** 15 minutes (abbreviated, high-focus), 20 minutes (short but complete), 30 minutes (standard home practice), 45 minutes (full class equivalent), 60 minutes (extended practice with deeper holds)
- **Experience level:** Complete beginner (never done yoga or fewer than 5 sessions), beginner (some exposure, knows basic poses), intermediate (consistent practice 6+ months, comfortable in most standing poses and basic inversions like Downward Dog), experienced (2+ years, familiar with Sanskrit names and sequencing logic)
- **Physical flags:** Any areas to avoid or move around carefully (tight hamstrings, sensitive knees, wrist discomfort, limited shoulder range, recent neck strain); note that these are adaptations, not therapeutic prescriptions
- **Props available:** Mat is assumed. Ask whether they have: blocks (2 recommended), a strap or belt, a bolster or firm pillow, a folded blanket, and a wall nearby. Props change what poses are accessible, especially for beginners.

If the user omits critical information (especially purpose and duration), ask before building the sequence. Generating a misaligned routine wastes their time.

### Step 2: Determine the Anatomical Arc

Every yoga sequence follows a physiological arc -- the body must be prepared layer by layer before deep work is safe and effective. This is not optional; it is the difference between a sequence that creates release and one that creates strain.

**The standard arc has six phases:**

1. **Arrival and breath (1-3 min):** Stationary grounding pose (Sukhasana, Savasana, or Child's Pose). Establishes body awareness before movement begins. Synchronizes attention with breath.

2. **Spinal warm-up (3-5 min):** Cat-Cow (Marjaryasana-Bitilasana), Tabletop circles, gentle seated or supine twists. The spine is the central axis of every yoga practice. Warming spinal extensors, flexors, and rotators before loading them is mandatory.

3. **Primary phase -- body-type-specific (variable):** This is where the purpose-specific work happens. The structure within this phase depends on whether the session is active/standing, seated/floor-based, or restorative (see Step 3).

4. **Transition and counter-poses (2-4 min):** After deep hip openers, include a gentle hip-neutral pose (Dandasana or Bridge). After backbends, include a gentle forward fold (Apanasana or Child's Pose). Counter-poses neutralize the spine and prevent accumulation of one directional stress.

5. **Cool-down and release (3-7 min):** Long-held supine or seated stretches, typically 8-15 breaths each. This is when the nervous system begins shifting from sympathetic to parasympathetic. Hold time is the key variable -- longer holds drive proprioceptive change and signal the body to downregulate.

6. **Savasana (3-10 min):** Non-negotiable final pose. The nervous system integrates the session during Savasana. Skipping it or shortening to under 3 minutes significantly reduces the stress-reduction benefit of the practice.

**Duration allocation by session length:**

| Phase | 15 min | 20 min | 30 min | 45 min | 60 min |
|---|---|---|---|---|---|
| Arrival + breath | 1 min | 1 min | 2 min | 2 min | 3 min |
| Spinal warm-up | 2 min | 3 min | 4 min | 5 min | 6 min |
| Primary phase | 6 min | 9 min | 14 min | 22 min | 30 min |
| Counter-poses | 1 min | 1 min | 2 min | 3 min | 5 min |
| Cool-down | 2 min | 3 min | 5 min | 7 min | 10 min |
| Savasana | 3 min | 3 min | 3 min | 5 min | 6 min |

### Step 3: Select the Sequence Template by Purpose

Each practice type has a proven structural template. Use the appropriate one and populate it with poses from the curated library in Step 4.

**Morning Energizing:**
Arrival (Sukhasana, 3-part breath) -- Spinal warm-up (Cat-Cow, Table circles) -- Sun Salutations A (Surya Namaskar A, 2-4 rounds depending on time) -- Standing sequence (Warrior I, Warrior II, Extended Side Angle, Triangle) -- Balance (Tree, Warrior III with wall option) -- Seated forward fold -- Savasana
*Rationale: Sun salutations generate internal heat and synchronize breath and movement, which elevates cortisol appropriately for morning alertness. Standing poses build neuromuscular activation. Balance poses sharpen proprioception.*

**Evening Wind-Down:**
Arrival (Supine with knees to chest, slow breathing) -- Gentle spinal warm-up (supine Cat-Cow, pelvic tilts) -- Seated hip openers (Bound Angle, Seated Twist, Head-to-Knee) -- Supine sequence (Reclined Pigeon, Supine Twist, Happy Baby) -- Legs Up the Wall (Viparita Karani, 5-7 min) -- Savasana
*Rationale: No standing poses in the primary phase -- standing poses activate the sympathetic nervous system. Everything remains low to the ground, which reduces vestibular stimulation and supports parasympathetic transition.*

**Hip Opening:**
Arrival (Child's Pose with wide knees) -- Cat-Cow -- Low Lunge series (Anjaneyasana, Crescent) -- Standing hip openers (Warrior II, Goddess, Wide-Legged Forward Fold) -- Seated deep openers (Pigeon, Lizard, Fire Log/Double Pigeon) -- Supine hip openers (Reclined Pigeon, Happy Baby) -- Savasana
*Rationale: Hip opening progresses from external rotation in standing (Warrior II) to combined flexion and external rotation in floor poses (Pigeon, Fire Log). Forcing Pigeon without adequate warm-up risks medial knee strain.*

**Back Relief (Spinal Decompression):**
Arrival (Constructive Rest -- supine, knees bent) -- Cat-Cow (10+ rounds, slow) -- Thread the Needle twist -- Child's Pose -- Sphinx (gentle backbend) -- Bridge (Setu Bandha Sarvangasana, supported option) -- Supine Twist -- Knees-to-Chest (Apanasana) -- Savasana
*Rationale: Chronic back discomfort often involves both tight hip flexors (pulling lumbar into extension) and weak glutes. Cat-Cow addresses spinal mobility. Sphinx and Bridge gently activate posterior chain. Twists restore rotational mobility.*

**Stress Reduction:**
Arrival with extended exhale breathing (4-count inhale, 6-8 count exhale, 2-3 min) -- Child's Pose (extended, 2 min) -- Seated gentle flow (Easy Seat twists, Seated Forward Fold) -- Reclined Bound Angle (Supta Baddha Konasana, 5 min) -- Legs Up the Wall (Viparita Karani, 5-7 min) -- Savasana (extended, 8-10 min)
*Rationale: The extended exhale directly activates the vagus nerve, accelerating parasympathetic response. Long holds (2-5+ min) at low intensity maximize relaxation response more effectively than a vigorous flow at the same duration.*

**Shoulder and Chest Opening:**
Arrival -- Cat-Cow with Thread the Needle alternating -- Puppy Pose (Anahatasana) -- Downward Dog with shoulder rolls -- Warrior I with clasped hands behind back -- Cow Face Arms (Gomukhasana arms) standing and seated -- Seated Chest Opener with strap or hands clasped -- Reclined Twist -- Savasana
*Rationale: Shoulder mobility work progresses from axial extension (Puppy Pose) to combined glenohumeral and thoracic extension (Warrior I with bound hands) to isolated glenohumeral rotation (Cow Face Arms). Straps are nearly essential for Cow Face Arms in tight practitioners.*

**Athletic Recovery:**
Arrival -- Supine full-body check-in (body scan) -- Low Lunge with quad stretch (Anjaneyasana with back knee down) -- Pigeon (hold 2+ min per side) -- Hamstring stretch supine with strap -- IT band stretch (Supine cross-body leg) -- Legs Up the Wall -- Savasana
*Rationale: Post-training (especially running and cycling), the priority is hip flexor release, quad lengthening, hamstring decompression, and IT band work. Longer hold times (90 seconds to 3 minutes) at low intensity facilitate deeper myofascial release than short holds.*

### Step 4: Assign Poses Using the Curated Library

Select poses appropriate to the template and experience level. Every pose has three tiers.

**Warm-Up Poses:**
- Cat-Cow (Marjaryasana-Bitilasana): Beginner -- slow 4 counts each direction; Standard -- link to breath; Advanced -- add lateral flexion and thoracic circles
- Child's Pose (Balasana): Beginner -- knees wide, arms forward or at sides; Standard -- full expression; Advanced -- extended arm stretch with side bend
- Tabletop Circles: Beginner -- small slow circles; Standard -- full barrel roll with breath; Advanced -- one-armed variation
- Thread the Needle (Parsva Balasana): Beginner -- small rotation; Standard -- shoulder to floor; Advanced -- bind top arm behind back

**Standing Poses:**
- Warrior I (Virabhadrasana I): Beginner -- shorten stance, back heel slightly lifted; Standard -- back heel grounded, 90-degree front knee; Advanced -- clasp hands behind back, mini backbend
- Warrior II (Virabhadrasana II): Beginner -- narrower stance; Standard -- front knee over second toe, arms parallel to floor; Advanced -- reverse warrior flowing transition
- Extended Side Angle (Utthita Parsvakonasana): Beginner -- forearm on front thigh; Standard -- hand to floor outside front foot; Advanced -- full bind
- Triangle (Trikonasana): Beginner -- hand on shin; Standard -- hand to floor or block; Advanced -- top arm extended in line with bottom, gaze up
- Chair Pose (Utkatasana): Beginner -- minimal knee bend; Standard -- thighs toward parallel; Advanced -- prayer twist (Parivrtta Utkatasana)
- Goddess (Utkata Konasana): Beginner -- slight bend; Standard -- knees over ankles, thighs toward parallel; Advanced -- add Cactus arms or heel raises
- Wide-Legged Forward Fold (Prasarita Padottanasana): Beginner -- hands to blocks; Standard -- hands to floor, crown of head toward floor; Advanced -- hands clasped behind back

**Balance Poses (always include wall as option for beginners):**
- Tree (Vrksasana): Beginner -- foot on calf below knee, fingertips on wall; Standard -- foot inner thigh above knee; Advanced -- arms overhead, eyes closed
- Warrior III (Virabhadrasana III): Beginner -- both hands on wall, lifted leg low; Standard -- arms extended; Advanced -- bound or eagle-arm variation
- Half Moon (Ardha Chandrasana): Beginner -- hand on block, standing foot near wall; Standard -- full expression; Advanced -- top hand grips top foot (Sugarcane)

**Hip-Opening Poses:**
- Low Lunge (Anjaneyasana): Beginner -- back knee padded with folded mat; Standard -- full expression with arms overhead; Advanced -- add quad stretch (reach back for foot)
- Pigeon (Eka Pada Rajakapotasana, preparation): Beginner -- blanket under front hip, upright torso; Standard -- fold forward; Advanced -- extended pigeon (prop foot away from hip for more intensity)
- Lizard (Utthan Pristhasana): Beginner -- back knee down; Standard -- both forearms to floor; Advanced -- forearms down, twist top arm to sky
- Fire Log / Double Pigeon (Agnistambhasana): Beginner -- one leg extended (Janu Sirsasana shape); Standard -- stacked shins; Advanced -- fold forward
- Bound Angle (Baddha Konasana): Beginner -- sit on folded blanket; Standard -- feet together, fold forward; Advanced -- feet pulled close, chest to floor
- Reclined Pigeon (Supta Kapotasana): Beginner -- keep bottom foot on floor; Standard -- pull leg toward chest; Advanced -- thread and clasp behind thigh
- Happy Baby (Ananda Balasana): Beginner -- hold backs of thighs; Standard -- hold outer feet; Advanced -- rock side to side, single-leg extension

**Spinal / Back Poses:**
- Sphinx (Salamba Bhujangasana): Beginner -- elbows wide; Standard -- elbows under shoulders; Advanced -- press forearms to deepen curve
- Bridge (Setu Bandha Sarvangasana): Beginner -- small lift, hands at sides; Standard -- full bridge with chin away from chest; Advanced -- clasp hands under back, full expression
- Locust (Salabhasana): Beginner -- one leg at a time; Standard -- both legs, arms back; Advanced -- full Locust with arms extended
- Supine Twist (Supta Matsyendrasana): Beginner -- knees stacked, small rotation; Standard -- knees stacked, shoulder to floor; Advanced -- top leg extended

**Restorative / Long-Hold Poses:**
- Legs Up the Wall (Viparita Karani): Beginner -- blanket under hips; Standard -- hips close to wall; Advanced -- bound angle variation (feet together, knees wide)
- Reclined Bound Angle (Supta Baddha Konasana): Beginner -- blocks under thighs; Standard -- bolster under spine; Advanced -- full expression without support
- Supported Child's Pose: Beginner and all levels -- bolster under chest, knees wide, arms forward, 3-5 min hold

### Step 5: Assign Hold Times and Breath Cues

Hold times are one of the most consequential decisions in sequencing. More is not always better -- matching hold time to tissue target and nervous system goal is essential.

**Hold time reference by pose type and effect:**

| Pose Category | Hold Duration | Primary Effect | Breath Pattern |
|---|---|---|---|
| Sun salutation transitions | 1 breath per movement | Circulation, heat | Ujjayi or natural |
| Active standing poses | 5-8 breaths (30-50 sec) | Strength, stability | Steady Ujjayi |
| Balance poses | 5-10 breaths | Neuromuscular focus | Soft, quiet breath |
| Active seated poses | 8-12 breaths (50-75 sec) | Flexibility initiation | Steady |
| Deep hip openers (Pigeon, Lizard) | 15-25 breaths (90 sec - 2.5 min) | Connective tissue + hip flexors | Slow, diaphragmatic |
| Restorative holds | 2-5 minutes | Parasympathetic activation, deep release | Natural, extended exhale |
| Legs Up the Wall | 3-7 minutes | Venous return, nervous system reset | Natural |
| Savasana | 3-10 minutes | Integration | Natural |

**Ujjayi breath guidance:** A slight constriction at the back of the throat creates a soft ocean sound during both inhale and exhale. Regulates breath pace, builds mild internal heat, and sharpens mind-body connection. Recommend it during active phases; release it during restorative holds.

**Directional breath cues:**
- Inhale expands the ribcage outward and upward -- pair with chest-opening movements, rising, extending, lengthening the spine
- Exhale contracts the ribcage inward and downward -- pair with folding, twisting, grounding, descending into a pose
- In twists: inhale to lengthen the spine, exhale to rotate further
- In forward folds: inhale to lengthen (create axial length), exhale to release and deepen
- In backbends: inhale to open and lift, exhale to stabilize and draw navel slightly toward spine

### Step 6: Add Modifications Systematically

For every pose in the sequence, provide three tiers in the output table:
- **Beginner/Tighter:** Reduces range of motion, adds a prop for support, or offers an alternative entrance into the shape that demands less flexibility or balance
- **Standard:** The conventional form of the pose as taught in most classes
- **Deepening:** An intensification that is appropriate without crossing into advanced inversion or arm balance territory

Critical modification knowledge:
- Knees in Downward Dog: bending the knees takes hamstrings out of the equation and allows the spine to lengthen -- this is almost always the better beginner cue over forcing straight legs with a rounded back
- Blocks in Triangle: placing the bottom hand on a block rather than the floor prevents collapsing in the torso and preserves the full spinal rotation that makes the pose effective
- Blanket under the front hip in Pigeon: without this, tight practitioners rotate the pelvis so severely to compensate that the hip flexor (primary target) barely stretches -- the blanket levels the pelvis and makes the stretch actually work
- Strap in Seated Forward Fold: wrapping a strap around the feet and holding the strap allows the practitioner to keep a long spine rather than rounding catastrophically to reach the feet, which stresses the lumbar spine without stretching the hamstrings
- Wall proximity for all balance poses in beginners: reduces fear response (which prevents muscle release) and allows practice without the cognitive load of fall management

### Step 7: Assemble and Review the Sequence for Anatomical Logic

Before finalizing the output, review the complete sequence against these checks:

1. **Warm-up is genuinely warm:** Did you include at least 2-3 minutes of spinal movement before any deep stretch or standing pose?
2. **No jarring transitions:** Does every pose transition logically from the previous? (Warrior I -- Warrior II is logical; Warrior II -- seated Pigeon with no transition is jarring)
3. **Side balance:** Are bilateral poses (Warrior, Pigeon, Triangle) always done on both sides?
4. **Backbend-forward fold balance:** If the sequence includes backbends (Cobra, Bridge, Camel), is there a compensating forward fold or neutralizing pose (Child's Pose, Apanasana) afterward?
5. **No deep hip opener before any hip flexor warm-up:** Pigeon should not appear before Low Lunge or some hip preparation. The hip flexor enters Pigeon in a lengthened position -- forcing it cold risks strain.
6. **Savasana is last:** Always, without exception.
7. **Duration math checks out:** Count the actual hold times plus conservative transition estimates (15-20 seconds per pose change) and verify the total is within ±3 minutes of the stated duration.

---

## Output Format

Produce the output exactly as shown below, filling every field with real pose-specific content. Do not leave placeholder text.

```
> **Disclaimer:** This yoga sequence is for general wellness purposes only and does
> not constitute medical advice. Consult a healthcare professional before beginning
> a new exercise program, especially if you have existing health conditions or pain.

## Yoga Routine: [Purpose Title]

**Duration:** [X minutes]
**Level:** [Complete Beginner / Beginner-Friendly / All Levels / Intermediate]
**Focus:** [One sentence describing primary physical and mental aim]
**Props suggested:** [List only props that are genuinely useful, e.g., "2 blocks, 1 strap, folded blanket"]
**Breath style:** [Ujjayi throughout active phase / Natural breath throughout / Extended exhale focus]

---

### Phase Breakdown

| Phase | Duration | Description |
|---|---|---|
| Arrival & Breath | X min | [What the practitioner does to settle] |
| Spinal Warm-Up | X min | [Spinal movement sequence] |
| [Primary Phase Name] | X min | [Active or passive main work] |
| Counter-Poses | X min | [Neutralizing poses] |
| Cool-Down | X min | [Long-hold release work] |
| Savasana | X min | [Final rest description] |

---

### Full Sequence

| # | Pose (English) | Sanskrit | Phase | Hold | L/R | Beginner Modification | Standard Form | Deepening Option |
|---|---|---|---|---|---|---|---|---|
| 1 | [Pose] | [Sanskrit] | [Phase] | [X breaths / X min] | [Both / R then L / -] | [Specific modification] | [Standard cue] | [Deepening cue] |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... |

---

### Breath & Transition Cues

**Inhale for:** [List the movements paired with inhale in this specific sequence]
**Exhale for:** [List the movements paired with exhale in this specific sequence]
**Pause after exhale:** [Yes/No -- relevant for restorative and stress-reduction practices]

**Key transitions:**
- From [Pose X] to [Pose Y]: [Specific instruction on how to move between them]
- From [Pose X] to [Pose Y]: [Specific instruction]

---

### Practitioner Notes

- [Specific safety or awareness note relevant to this sequence]
- [Any note about where the practitioner might feel sensation and what is normal vs. concerning]
- [Pacing note specific to this sequence's purpose]
```

---

## Rules

1. **Always present the disclaimer at the top of every output.** Do not skip or shorten it. Yoga carries real physical risk and there is no way to assess a user's body through text.

2. **Every sequence must end with Savasana for a minimum of 3 minutes.** For restorative and stress-reduction sequences, Savasana is never less than 5 minutes. The neurological integration function of Savasana is not optional -- it is when the nervous system consolidates the practice.

3. **Always provide modifications for every pose.** Three tiers: beginner, standard, deepening. This is not optional even for poses that seem "easy" -- beginners often struggle most with Child's Pose (knee issues) and Downward Dog (tight hamstrings and wrist loading), both of which require modification knowledge.

4. **Sequence must follow anatomical progression:** warm-up -- standing/active work -- floor work -- supine release -- Savasana. Never place a deep stretch (Pigeon, Seated Forward Fold) before adequate spinal and hip warm-up. Never end an active standing sequence abruptly without a cool-down transition.

5. **Hold times must be specified in breaths for all active poses and in minutes for all restorative holds (2+ minutes).** Never specify hold times in seconds only -- yoga practitioners use breath as the primary unit of time. Providing seconds alongside breaths is acceptable (e.g., "5 breaths / approx. 30 seconds").

6. **Both English and Sanskrit names are required for every pose.** Exceptions: transitional movements that do not have a named pose equivalent (e.g., "return to Table Top between sides") may use English only.

7. **Never include Headstand, Handstand, Forearm Stand, Crow Pose, or any arm balance in a generated sequence.** These require direct observation and feedback for safe technique and fall preparation. If a user specifically requests them, explain why in-person instruction is necessary and offer a preparatory alternative (e.g., Dolphin Pose as a headstand preparation, Plank and Chaturanga for arm balance foundation work).

8. **Never use language that instructs forcing, pushing through, or ignoring sensation.** Replace "push deeper," "go further," and "hold even if it hurts" with phrases like "move to the edge of comfortable sensation," "breathe into areas of resistance," and "honor what your body offers today." At the same time, do not sanitize the skill to the point of uselessness -- some sensation is the point.

9. **Always balance bilateral poses.** Every pose done on the right side must be done on the left side in the same session, in immediate sequence. Never do three right-side poses and then move on without left-side equivalents.

10. **When the user mentions pain (not discomfort -- pain) in a specific area, explicitly note the following before providing any sequence:** "Persistent or sharp pain should be evaluated by a qualified healthcare professional before continuing yoga practice targeting that area. The sequence below is designed for general wellness and is not a therapeutic intervention."

11. **Prop use must be specific and instructional.** Do not simply list "blocks optional." State exactly how a block is used: "place a block at its lowest height directly under your right hand to maintain spinal length in Triangle Pose." Props are the difference between a pose that works and one that creates injury for a tight practitioner.

12. **Duration math must be accurate.** Before finalizing a sequence, verify that the sum of all hold times plus estimated transitions (allow 15-20 seconds per pose change, 30 seconds per side-switch) falls within ±3 minutes of the stated duration.

---

## Edge Cases

**1. Complete beginner with no yoga experience:**
Limit the sequence to 8-10 poses maximum. Use only floor-based or wall-supported standing poses. Omit Sun Salutations entirely -- the sequencing logic of a Sun Salutation is not intuitive and requires understanding of plank, Chaturanga, Upward Dog, and Downward Dog in sequence. Replace with Cat-Cow and a few basic standing poses. Include breath cues at every single transition, not just selected ones. Suggest placing the mat near a wall. Use more conservative hold times (5 breaths maximum for floor poses). Do not use Sanskrit names as primary labels -- lead with English and add Sanskrit parenthetically.

**2. User requests yoga for back pain:**
First, include the explicit safety note from Rule 10. Then distinguish between the two most common presentations and address each: (a) lower back tightness / general stiffness -- appropriate to address with Cat-Cow, gentle supine twists, Knees-to-Chest (Apanasana), and supported Bridge; (b) sharp, radiating, or nerve-related back pain -- explicitly advise evaluation before any yoga practice. Do not program Seated Forward Fold (Paschimottanasana) for lower back pain sequences without the strap modification -- rounding the lumbar in flexion under load is contraindicated for many common back conditions. Avoid deep backbends (Camel, Wheel) entirely in back-relief sequences.

**3. Only 15 minutes available:**
Apply the following strict constraints: maximum 6 poses plus Savasana, Savasana minimum 3 minutes (leaving 12 minutes for poses), skip Sun Salutations (take 5+ minutes for a meaningful number of rounds), prioritize only the single most important phase for the stated purpose (e.g., for hip opening: spend 8 minutes exclusively on Pigeon and Reclined Pigeon after a 2-minute Cat-Cow warm-up). Add a note that a 15-minute sequence is a maintenance or emergency practice -- for genuine progress in flexibility or stress reduction, 30+ minutes is more effective.

**4. User wants a more challenging or vigorous sequence:**
Increase intensity without crossing into unsafe territory by: extending standing pose hold times to 10-15 breaths, adding continuous vinyasa transitions between standing poses (Warrior I -- Warrior II -- Reverse Warrior -- Extended Side Angle as one flowing unit), increasing the number of Sun Salutation rounds (4-6 rounds of Surya Namaskar A), introducing Surya Namaskar B which includes Chair Pose and Warrior I within the salutation, and adding strength-demanding static holds (high Plank held for 10 breaths). Still exclude arm balances and inversions. For balance challenges, advance from Tree to Warrior III to Half Moon, all without touching the wall.

**5. User mentions wrist discomfort or wrist injury:**
This significantly changes what poses are accessible. Downward Dog becomes Puppy Pose (Anahatasana) or Dolphin Pose (forearm variation). Plank becomes Forearm Plank. All weight-bearing on wrists (Plank, Down Dog, Cat-Cow in Table) must be replaced with forearm variants or eliminated. Standing poses, seated floor poses, and supine poses are largely unaffected. Note that wrist discomfort in Downward Dog is often due to weight distribution -- cue pressing the pads of the fingers actively into the floor rather than sinking weight into the heel of the palm. If this cue alone resolves the issue, the full pose remains accessible.

**6. User wants a sequence for sleep preparation:**
This is a specific subtype of evening wind-down with additional constraints. No standing poses of any kind. No active backbends. Light level should be noted as important (dim lights if possible). Sequence should be entirely supine or very low-to-ground seated. Recommended poses: Reclined Bound Angle (Supta Baddha Konasana) -- 5 min, Legs Up the Wall (Viparita Karani) -- 7 min, Supine Twist -- 2 min per side, Knees to Chest rocking (Apanasana) -- 2 min, Savasana -- 8-10 min. Total: 24-26 min. Include specific breath instruction: 4-count inhale, 7-count hold, 8-count exhale (4-7-8 breathing) during Legs Up the Wall phase, which has documented parasympathetic activation effects.

**7. User is very inflexible and discouraged:**
Inflexibility is not a barrier to yoga -- it is one of the best reasons to practice. Reframe this explicitly in the output: "This sequence is specifically designed for practitioners who are working to build flexibility from a tighter starting point. Props are not training wheels -- they are tools that make the poses more effective by allowing correct alignment." Then build a sequence that uses props aggressively: blocks in every standing pose, strap for all hamstring work, blanket under hips in all seated poses, blanket under front hip in Pigeon. Focus on poses where tightness is not problematic (twists, gentle backbends) and use the most accessible variation of every hip and hamstring pose.

**8. Athlete seeking post-training recovery yoga (running, cycling, strength training):**
Target the three highest-priority areas for most athletes: hip flexors (compressed from running and cycling), hamstrings (shortened from running, loaded from strength training), and thoracic spine (rounded from cycling, heavy pressing). Sequence priorities: Low Lunge with quad stretch (Anjaneyasana) -- 2 min per side, Pigeon -- 2.5 min per side, Supine hamstring stretch with strap -- 90 sec per side, Reclining IT band stretch (supine cross-body leg pull) -- 90 sec per side, Thoracic extension over a rolled blanket or block -- 3 min, Legs Up the Wall -- 5 min, Savasana -- 5 min. Hold times should all be 90 seconds or longer -- shorter holds do not meaningfully address the chronic tissue compression athletes accumulate.

---

## Example

**Input:** "Can you build me a 30-minute hip-opening yoga sequence? I have done some yoga before but I am not super experienced. I have two blocks and a strap."

**Output:**

> **Disclaimer:** This yoga sequence is for general wellness purposes only and does not constitute medical advice. Consult a healthcare professional before beginning a new exercise program, especially if you have existing health conditions, knee sensitivity, or hip-related pain or injury.

## Yoga Routine: Hip Opening

**Duration:** 30 minutes
**Level:** Beginner-Friendly
**Focus:** Systematically releasing hip flexors, external rotators, and inner groin -- the three primary hip muscle groups -- to increase mobility, reduce low-back tightness, and improve seated posture
**Props suggested:** 2 blocks (you will use both), strap, folded blanket (or firm pillow as substitute)
**Breath style:** Ujjayi (gentle ocean breath) during active phase; slow natural breath with extended exhale during long holds

---

### Phase Breakdown

| Phase | Duration | Description |
|---|---|---|
| Arrival & Breath | 2 min | Constructive Rest -- supine, knees bent, hands on belly. Observe breath. Set intention for releasing rather than forcing. |
| Spinal Warm-Up | 4 min | Cat-Cow and Tabletop hip circles to lubricate the spine and begin warming hip flexors before standing work |
| Standing Hip Openers | 8 min | Low Lunge, Warrior II, Goddess -- builds heat and warms the hip complex through active range before floor-based deep holds |
| Deep Floor Openers | 10 min | Lizard, Fire Log, Bound Angle -- deep connective tissue and external rotator work; long holds apply |
| Supine Release | 3 min | Reclined Pigeon and Happy Baby -- passive, gravity-assisted final hip release |
| Savasana | 3 min | Full-body integration in stillness |

---

### Full Sequence

| # | Pose (English) | Sanskrit | Phase | Hold | L/R | Beginner Modification | Standard Form | Deepening Option |
|---|---|---|---|---|---|---|---|---|
| 1 | Constructive Rest | (no Sanskrit) | Arrival | 2 min | -- | Place one hand on belly, one on chest; simply breathe | Supine, knees bent, feet hip-width, arms at sides | Close eyes; notice which hip feels more restricted |
| 2 | Cat-Cow | Marjaryasana-Bitilasana | Warm-Up | 10 slow rounds | -- | Move at half-speed; tiny range of motion is fine | Inhale to arch (Cow), exhale to round (Cat), full spinal wave | Add lateral flexion between rounds; look over each shoulder at the end |
| 3 | Tabletop Hip Circles | (no Sanskrit) | Warm-Up | 8 circles each direction | -- | Keep circles small and slow | Draw large circles with the hips in Table position | Reverse and add figure-eights |
| 4 | Low Lunge -- right | Anjaneyasana | Standing | 8 breaths | R first | Back knee on folded blanket; hands on front thigh | Arms overhead, lengthen through the back hip flexor | Add quad stretch: reach back for back foot with same-side hand |
| 5 | Low Lunge -- left | Anjaneyasana | Standing | 8 breaths | L | Same as right side | Same as right side | Same as right side |
| 6 | Warrior II -- right | Virabhadrasana II | Standing | 6 breaths | R | Narrower stance; front knee bent less | Front knee over second toe, arms exactly parallel to floor, gaze over front fingers | Transition directly to Reverse Warrior: flip front palm up, arc top arm back |
| 7 | Warrior II -- left | Virabhadrasana II | Standing | 6 breaths | L | Same as right | Same as right | Same as right |
| 8 | Goddess Pose | Utkata Konasana | Standing | 8 breaths | Both | Slight knee bend; toes pointed forward more | Feet wide, toes 45 degrees out, knees track over second toes, thighs toward parallel | Pulse 3x on exhale, then hold; add Cactus arms (elbows at shoulder height, bent 90 degrees) |
| 9 | Lizard -- right | Utthan Pristhasana | Floor | 15 breaths / ~90 sec | R | Back knee down; hands on blocks at highest height | Both forearms to floor or blocks; back knee down | Forearms to floor, twist top arm to ceiling; or lower back knee and reach for top foot |
| 10 | Lizard -- left | Utthan Pristhasana | Floor | 15 breaths / ~90 sec | L | Same as right | Same as right | Same as right |
| 11 | Fire Log -- right leg on top | Agnistambhasana | Floor | 20 breaths / ~2 min | R on top | Sit on folded blanket to tilt pelvis; keep bottom leg straight (Janu Sirsasana shape) if stacked shins are inaccessible | Stacked shins, both feet flexed, sit tall; fold forward on exhale if available | Fold fully forward, forehead toward floor; hands extended |
| 12 | Fire Log -- left leg on top | Agnistambhasana | Floor | 20 breaths / ~2 min | L on top | Same as right | Same as right | Same as right |
| 13 | Bound Angle | Baddha Konasana | Floor | 20 breaths / ~2 min | Both | Sit on folded blanket; place blocks under each knee for support | Feet together, soles touching, fold gently forward; hold feet or ankles | Feet pulled close to pelvis; walk hands forward and rest forehead toward heels |
| 14 | Reclined Pigeon -- right | Supta Kapotasana | Supine | 12 breaths / ~75 sec | R | Keep bottom foot on floor; gentle pull | Thread right ankle over left thigh; flex right foot; pull left thigh toward chest with hands or strap | Pull deeply; extend bottom leg toward ceiling for double hamstring/hip opener |
| 15 | Reclined Pigeon -- left | Supta Kapotasana | Supine | 12 breaths / ~75 sec | L | Same as right | Same as right | Same as right |
| 16 | Happy Baby | Ananda Balasana | Supine | 10 breaths | Both | Hold backs of thighs or calves | Hold outer edges of feet; pull knees toward armpits | Rock gently side to side; extend one leg at a time toward ceiling |
| 17 | Savasana | Savasana | Final Rest | 3 min | -- | Blanket over the body if cool; support under knees if low back is tender | Arms slightly away from body, palms up, feet naturally falling out | Full stillness; allow the hip work to integrate; breathe naturally |

---

### Breath & Transition Cues

**Inhale for:** Rising out of Low Lunge, extending arms overhead in Warrior I, lifting the chest in Goddess, lengthening the spine before folding in Bound Angle, lifting into any transition between poses

**Exhale for:** Sinking deeper into Low Lunge, grounding in Warrior II, folding forward in Fire Log and Bound Angle, pulling the knee closer in Reclined Pigeon, melting into Savasana

**Pause after exhale:** Yes -- in Fire Log and Bound Angle, after a full exhale, notice the moment of stillness before the next inhale. That pause is when the nervous system registers the new, released position. Do not rush the next breath.

**Key transitions:**
- From Low Lunge (right) to Warrior II (right): plant back foot parallel to the back of the mat, straighten the front knee briefly, then re-bend into Warrior II -- avoid going directly from Low Lunge to Warrior II without this intermediate step, which prevents knee torquing
- From Warrior II (right) to Warrior II (left): step the right foot to meet the left, pause in Mountain Pose (Tadasana) for one breath, then step left foot forward into Low Lunge left before transitioning to Warrior II left
- From standing (Goddess) to floor (Lizard): from Goddess, pivot to face the long edge of the mat, come to hands and knees (Table), then step the right foot forward to the outside of the right hand
- From Fire Log to Bound Angle: simply uncross the legs, bring the soles of the feet together, and let the knees fall open -- no additional movement needed

---

### Practitioner Notes

- **In Fire Log (Agnistambhasana):** You will feel significant sensation in the outer hip and possibly behind the knee of the top leg. Sensation in the outer hip is the pose working correctly. Any sharp, shooting, or joint-level pain at the knee is a signal to back off immediately and use the beginner modification (bottom leg extended).
- **In Lizard (Utthan Pristhasana):** The hip flexor of the back leg is the primary target -- most practitioners feel this more in the back hip than the front. If you feel almost nothing, try pressing the back heel toward the back of the room actively to engage the back hip flexor stretch.
- **Blanket under hips:** If you feel your pelvis tilting backward (tailbone tucking under) in any seated pose, place your folded blanket under your sit bones immediately. A tilted pelvis in seated hip openers means the hamstrings are limiting the pose before the hips get a chance to open. The blanket creates the anterior pelvic tilt that allows actual hip work.
- **Pacing:** The long holds in this sequence (15-20 breaths) may feel uncomfortably still if you are accustomed to faster-paced classes. Resist the urge to come out early. The connective tissue around the hip joint (primarily the hip joint capsule and iliopsoas) requires sustained time under tension -- brief holds produce brief changes. Stay with the discomfort of stillness; it is doing the work.
- **After this session:** Hips may feel either very open or slightly tender in the 24 hours following. Both are normal. Avoid intense hip-loading exercise (heavy squats, running sprints) in the 12 hours after a deep hip-opening practice.
