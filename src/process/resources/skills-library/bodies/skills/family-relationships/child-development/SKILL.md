---
name: child-development
description: |
  Child development milestone tracking based on CDC guidelines across physical, cognitive, social-emotional, and language domains, with enrichment suggestions, school readiness assessment, and guidance on when to consult a pediatrician.
  Use when the user asks about child development, or needs help with child development milestone tracking based on cdc guidelines across physical, cognitive, social-emotional, and language domains, with enrichment suggestions, school readiness assessment, and guidance on when to consult a pediatrician.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of child development.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "parenting family-events guide"
  category: "family-relationships"
  subcategory: "parenting"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Child Development Milestone Tracker

## When to Use

**Use this skill when:**
- A parent, caregiver, grandparent, or early childhood educator asks about specific milestones a child should be reaching at a given age (e.g., "My 18-month-old isn't talking yet -- is that normal?")
- A caregiver wants to understand whether observed behaviors fit typical developmental ranges according to CDC "Learn the Signs. Act Early." guidelines and AAP Bright Futures periodicity schedule
- A user needs concrete enrichment activities tailored to a child's current developmental stage to support skill acquisition at home
- A parent is preparing for a well-child visit and wants to gather observations to share with their pediatrician, including documenting what the child is and is not yet doing
- A caregiver is assessing kindergarten readiness for a child approaching age 5 and wants to understand academic, social, self-care, and attention expectations
- A user needs guidance on navigating Early Intervention (ages 0--3) or school-district-based evaluation services (ages 3+) and doesn't know how to access them
- A parent of a premature infant needs to understand how adjusted age affects milestone interpretation during the first two years of life
- A caregiver suspects regression in a previously acquired skill and wants help framing their concern for a pediatric appointment

**Do NOT use when:**
- The child has an existing diagnosis (autism spectrum disorder, cerebral palsy, Down syndrome, sensory processing disorder) and the user needs diagnosis-specific therapy goals -- refer to a developmental pediatrician or the child's therapy team instead
- The user describes an acute medical emergency (seizure, loss of consciousness, sudden inability to walk or speak) -- direct to emergency services immediately
- The request involves mental health crisis for a parent or caregiver -- use a mental health support skill instead
- The user is a licensed professional (speech-language pathologist, occupational therapist, physical therapist, developmental pediatrician) seeking clinical protocols -- this skill provides parent-facing educational content, not clinical decision-making
- The child is older than 8 years and the questions center on academic learning disabilities, ADHD diagnosis, or behavioral disorders -- those require school psychologist evaluation frameworks beyond this skill's scope
- The user is asking about feeding disorders, failure to thrive, or medically complex nutritional concerns -- refer to a pediatric dietitian or feeding specialist

---

## Process

### Step 1: Gather Accurate Baseline Information Before Any Assessment

- Ask the child's **exact age in months** for children under 3, and years plus months for ages 3--5. "Two years old" is not precise enough -- a 24-month-old and a 35-month-old are both "two" but have vastly different milestone profiles.
- Ask directly: **"Was this child born premature?"** If yes, ask gestational age at birth. Calculate adjusted age by subtracting weeks premature from chronological age. A child born at 32 weeks (8 weeks early) who is now 12 months chronological should be assessed against 10-month milestones. Adjusted age is used for milestones until the child's **second birthday**.
- Ask: **"Has your child's pediatrician raised any concerns at recent well visits?"** This surfaces existing professional context that shapes how you frame observations.
- Ask about **diagnosed conditions or active evaluations** -- this determines whether you flag milestones as general education or as part of an ongoing monitoring conversation.
- Ask: **"Which domain concerns you most right now -- movement, communication, thinking and learning, or social-emotional?"** This focuses the output on what the caregiver most needs rather than a generic sweep.
- Ask: **"What is your child doing well?"** Starting with strengths is clinically sound (it establishes baseline competence) and emotionally supportive for caregivers who may be anxious.
- If the child is bilingual or multilingual, note this explicitly. Bilingual children may have smaller vocabulary counts in each individual language while their **total vocabulary across both languages** meets typical range. Never flag a bilingual child's language as delayed based on single-language word counts alone.

### Step 2: Apply the Correct Milestone Framework for the Child's Age

- Use the **2023 CDC milestone revisions** as your primary reference. The 2023 update shifted milestone timing to reflect what 75% (not 50%) of children achieve by a given checkpoint -- this makes the thresholds more clinically actionable for flagging concerns.
- Organize assessment across four domains: **Gross and Fine Motor (Physical), Cognitive, Language and Communication, Social-Emotional.** Each domain can be on track, emerging, or flagged for discussion independently.
- Apply the **"red flag" vs. "monitor" distinction**: Red flags are skills absent at a checkpoint where 90%+ of children have achieved them. Monitor flags are skills where the child is 4--6 weeks behind but trajectory looks positive. Red flags warrant a pediatrician conversation at the next visit; regression (losing a skill) warrants contact within the week regardless of age.
- Use the **"What to expect at the NEXT checkpoint"** framing to give caregivers forward momentum rather than only backward assessment.
- For ages 0--6 months, lean heavily on sensory-motor and social referencing milestones. For ages 12--24 months, language and joint attention milestones carry the highest clinical weight. For ages 3--5, cognitive flexibility, narrative language, and cooperative play are most diagnostically informative.
- Note that **boys and girls show small but real developmental timing differences**, particularly in language (girls average slightly earlier) and gross motor (boys average slightly earlier in some measures). These differences are within normal developmental variation and do not change screening thresholds.

### Step 3: Conduct the Milestone Review by Domain

- For each of the four domains, sort observed behaviors into three categories: **On Track** (milestone clearly present and consistent), **Emerging** (behavior appearing sometimes but not consistently), **Not Yet Observed** (caregiver has not seen the behavior or reports it is absent).
- Apply the **30-minute observation heuristic**: milestones should be behaviors the child performs regularly in daily life, not just once ever. A child who said "mama" once at 11 months but rarely vocalizes at 18 months is not meeting the language milestone for 18 months.
- For **Gross Motor**, assess postural control, balance, locomotion quality, and bilateral coordination in sequence. The typical sequence is: head control (2 mo) → rolling (4--6 mo) → sitting (6--8 mo) → pulling to stand (9--10 mo) → walking (12--15 mo) → running (18 mo) → jumping (24 mo) → hopping on one foot (42 mo).
- For **Fine Motor**, assess reach and grasp quality, hand-to-midline crossing, finger isolation, and tool use. Key benchmarks: raking grasp gives way to pincer grasp between 7--10 months; crayon grasp transitions from fist to digital-pronate to tripod between 18 months and 4 years. Scissors use with two-finger control emerges around 3.5--4 years.
- For **Language**, always assess both **receptive** (what the child understands when others speak) and **expressive** (what the child produces -- words, gestures, sentences). Receptive language typically leads expressive by 2--4 weeks. Receptive delays are more clinically significant than expressive-only delays.
- For **Social-Emotional**, assess **joint attention** (does the child follow a point to look at what you're pointing to?), **social referencing** (does the child look at a caregiver's face to check their reaction?), **emotional regulation**, and **play schema** (solitary → parallel → associative → cooperative, roughly tracking ages 1--4 years).

### Step 4: Calculate Concern Level and Assign Follow-Up Priority

- Use a three-tier prioritization system:
  - **Tier 1 -- Routine Monitoring**: Child meets all milestones in all domains. Provide enrichment suggestions and next-checkpoint preview. No clinical action needed.
  - **Tier 2 -- Watch and Support**: One milestone in one domain is emerging rather than established, no regression, no red flags. Provide targeted enrichment activities, suggest discussing at the next scheduled well-child visit (typically at 9, 12, 15, 18, 24, 30 months, then annually).
  - **Tier 3 -- Discuss with Pediatrician Soon**: Two or more milestones in one domain not yet observed, any red flag present, any regression of a previously acquired skill, or caregiver gut instinct that something is consistently "off." Recommend contacting the pediatrician's office within 1--2 weeks, not waiting for the next routine visit.
- Apply the **"regression = always flag" rule** without exception: any skill a child reliably performed and has stopped doing (words disappearing, loss of walking ability, withdrawal from social engagement) is a Tier 3 flag regardless of whether all other milestones are met.
- For language concerns, apply the **"50 words by 24 months"** threshold from AAP guidelines. Children with fewer than 50 words at 24 months, regardless of comprehension, qualify for Early Intervention speech evaluation in most US states.
- For autism-spectrum-related patterns, apply the **M-CHAT-R/F awareness frame**: if a caregiver describes absent pointing by 12 months, absent babbling by 12 months, absent two-word phrases (not echolalia) by 24 months, or any skill regression, note that these are core screening indicators and prompt a formal M-CHAT-R/F completion with the pediatrician.

### Step 5: Generate Targeted Enrichment Recommendations

- Enrichment activities must be **age-appropriate, low-cost, naturally embedded in daily routines**, and specific to the domain(s) where the child is emerging or delayed. Do not recommend enrichment that requires purchasing specialized equipment.
- For **language enrichment**, the three highest-evidence strategies are: (1) **Joint book reading daily** -- the single intervention with the largest effect size across all socioeconomic groups; (2) **Language expansion** -- repeating back what the child said with one added word ("Ball!" → "Big red ball!"); (3) **Serve-and-return conversation** -- responding to every communication attempt, including non-verbal ones, within 5 seconds.
- For **cognitive enrichment**, prioritize **open-ended play materials** (blocks, playdough, sand, water) over electronic toys. Cause-and-effect toys (pop-up boxes, simple puzzles) are high-value for ages 9--24 months. Sorting games, simple board games with rules, and pretend play scenarios build executive function in ages 2--5.
- For **gross motor enrichment**, outdoor free play on varied terrain (grass, gravel, sand, slight inclines) develops proprioception and balance more effectively than structured gym activities. Unstructured running, climbing, and ball play 60+ minutes per day is the WHO recommendation for ages 3--5.
- For **fine motor enrichment**, focus on activities that build intrinsic hand strength: playdough manipulation, water-bead play, pegs and pegboards, tearing paper, and threading large beads. Premature pencil-and-paper work before tripod grasp is established can reinforce inefficient grips.
- For **social-emotional enrichment**, parallel play facilitation (two children playing near each other with similar materials), emotion labeling by caregivers ("You look frustrated that the tower fell"), and predictable routines are more effective than direct social skills instruction for children under 4.
- Recommend **no more than 3--5 targeted activities** per output to avoid overwhelming caregivers. Prioritize activities the family can implement in the next 2 weeks with materials they already have.

### Step 6: Address School Readiness If the Child Is Ages 4--5

- Apply the five-domain kindergarten readiness framework: **Academic Readiness, Language and Literacy, Social-Emotional Readiness, Self-Care Independence, and Attention/Executive Function**.
- Key academic benchmarks for kindergarten entry: recognizes own name in print, knows 8--10+ colors, can count to 10 with one-to-one correspondence (not just rote counting), knows basic shapes (circle, square, triangle, rectangle), can write first name with recognizable letters.
- Key literacy benchmarks: understands books are read front-to-back and left-to-right, can identify some letters (especially those in their own name), rhymes words, retells a 3--4 event sequence from a familiar story.
- Social readiness benchmarks: separates from caregiver without prolonged distress, follows 2--3 step directions from an unfamiliar adult, takes turns in a structured group of 4+ children, expresses needs using words rather than physical behavior.
- Self-care benchmarks: independently toilets and manages clothing, opens lunch containers, manages backpack, washes hands without prompting.
- Attention benchmarks: sustains focus on a preferred activity 15+ minutes, transitions between activities with one verbal warning, completes a 3--4 step task from start to finish.
- Frame readiness as a **spectrum, not a gate**. Kindergarten teachers expect a range of readiness. The single most important readiness factor identified in longitudinal research is **self-regulation** (ability to manage impulses and attention) -- it predicts academic outcomes more reliably than letter knowledge or counting ability.

### Step 7: Provide Concrete Guidance for Accessing Professional Support

- If Tier 3 concerns are present, give **specific action steps**, not vague advice to "see a doctor."
- For children ages **0--3**: Direct caregivers to **Early Intervention** (Part C of IDEA). This is federally mandated, free in all 50 US states, and does NOT require a physician referral. Parents can self-refer by contacting their state's Early Intervention program directly. Services begin within 45 days of referral. Evaluation is free even if the child does not qualify for services.
- For children ages **3--5**: Services transition to the local **school district** under IDEA Part B. Caregivers should send a written (not verbal) request for evaluation to the special education director of their school district. The district has 60 days (federally) to complete the evaluation. Services are free and available whether or not the child is enrolled in public school.
- For children ages **5+**: Written request to the building principal and/or special education coordinator triggers a formal evaluation process. Include a brief description of specific concerns, not just "I'm worried about development."
- Coach caregivers on **how to speak to their pediatrician**: be specific ("She has 8 words at 18 months and is not pointing"), ask explicitly for a developmental screening tool (the AAP recommends the M-CHAT-R/F, Ages & Stages Questionnaire [ASQ-3], or Survey of Well-Being of Young Children at ages 9, 18, 24, and 30 months), and push back politely but firmly if the response is only "let's wait and see" without a specific timeline and follow-up plan.
- Note that **Early Intervention has documented effectiveness** only when started early -- the brain's synaptic plasticity is highest before age 3. Waiting costs developmental time that cannot be recovered. This is an important point to convey gently but clearly to caregivers who are hesitant to seek evaluation.

---

## Output Format

Deliver responses using this structured template. Adapt section depth to the level of concern -- a routine monitoring case needs less detail in the "Seek Evaluation" section than a Tier 3 case.

---

**DEVELOPMENTAL SNAPSHOT**

| Field | Value |
|---|---|
| Child's Name/Identifier | [name or "your child"] |
| Chronological Age | [X months / X years Y months] |
| Adjusted Age (if applicable) | [X months -- used because born at [gestational age] weeks] |
| Assessment Date | [today's date] |
| Concern Level | Tier 1 -- Routine / Tier 2 -- Watch and Support / Tier 3 -- Discuss with Pediatrician Soon |

---

**MILESTONE REVIEW**

Domain: Gross Motor / Fine Motor (Physical)
- On Track: [list specific observed skills with examples]
- Emerging: [list skills appearing inconsistently]
- Not Yet Observed: [list absent skills]
- Assessment: [On Track / Monitor / Discuss with Pediatrician] -- [1--2 sentence rationale]

Domain: Cognitive (Thinking and Learning)
- On Track: [list specific observed skills]
- Emerging: [list]
- Not Yet Observed: [list]
- Assessment: [level] -- [rationale]

Domain: Language and Communication
- Receptive (Understanding): [what child comprehends when others speak]
- Expressive (Output): [words, gestures, sentences the child produces]
- On Track / Emerging / Not Yet Observed: [organized list]
- Assessment: [level] -- [rationale]

Domain: Social-Emotional
- On Track: [list]
- Emerging: [list]
- Not Yet Observed: [list]
- Assessment: [level] -- [rationale]

---

**OVERALL CONCERN LEVEL AND RATIONALE**

[2--4 sentences summarizing the pattern across domains, using plain language. Note any cross-domain patterns. Avoid alarmist language; use factual, supportive framing.]

---

**ENRICHMENT ACTIVITIES (Next 4--6 Weeks)**

| Priority | Activity | Domain Targeted | How to Do It | Frequency |
|---|---|---|---|---|
| 1 | [activity name] | [domain] | [specific instructions] | [daily / 3x/week / etc.] |
| 2 | [activity name] | [domain] | [specific instructions] | [frequency] |
| 3 | [activity name] | [domain] | [specific instructions] | [frequency] |

---

**WHAT'S COMING NEXT (Next 1--3 Months)**

- [Upcoming milestone 1 in plain language]
- [Upcoming milestone 2]
- [Upcoming milestone 3]
- [Upcoming milestone 4]

---

**SCHOOL READINESS SUMMARY** *(include only for children ages 4.5--5.5)*

| Domain | Status | Notes |
|---|---|---|
| Academic Readiness | On Track / Emerging / Not Yet | [detail] |
| Language and Literacy | On Track / Emerging / Not Yet | [detail] |
| Social-Emotional Readiness | On Track / Emerging / Not Yet | [detail] |
| Self-Care Independence | On Track / Emerging / Not Yet | [detail] |
| Attention / Executive Function | On Track / Emerging / Not Yet | [detail] |

---

**PROFESSIONAL GUIDANCE** *(include only for Tier 2 and Tier 3)*

- [Specific action step with who to contact and how]
- [What to say to the pediatrician, with specific language]
- [Early Intervention or school district referral details if applicable]
- [Timeline recommendation -- when to act]

---

**NEXT CHECK-IN**

Recommended reassessment timeframe: [specific -- e.g., "at 18-month well-child visit in approximately 6 weeks" or "within 2 weeks if no improvement is seen in pointing behavior"]

---

## Rules

1. **Never flatten a specific concern into reassurance.** If a child has no words at 18 months, do not lead with "every child develops at their own pace." Lead with the specific CDC threshold (10+ words expected by 18 months per 2023 revision), note the gap clearly, assign Tier 3, and provide action steps. Vague reassurance delays evaluation and harms outcomes.

2. **Always calculate and apply adjusted age for premature infants through 24 months.** A baby born at 28 weeks (12 weeks early) is, at 12 months chronological, developmentally 9 months adjusted. Applying 12-month milestones to this child produces a false concern. Applying 9-month milestones produces an accurate picture. Do not skip this step when prematurity is mentioned.

3. **Always distinguish receptive from expressive language.** A child who understands "get your shoes," "throw the ball," and "where's daddy?" but speaks only 5 words is linguistically very different from a child who neither speaks nor follows directions. Receptive delay without expressive delay is concerning in a different way than the reverse. Never combine them into a single "language" score.

4. **Never recommend "wait and see" without a specific timeline and follow-up trigger.** If a 15-month-old is not yet walking, "let's wait a few more weeks" is acceptable advice only if you also specify: wait until 16 months, contact pediatrician if still not walking, ask for a physical therapy referral at that point. Open-ended waiting is not a plan.

5. **Regression of any previously acquired skill is always Tier 3, always immediately.** This includes: words disappearing, loss of social smile, return of crawling after walking was established, loss of toilet training after 6+ months of success. Do not assign this to Tier 1 or Tier 2 under any circumstances. Regression can indicate medical causes that require prompt evaluation.

6. **Do not apply single-language vocabulary counts to bilingual children.** A bilingual 24-month-old with 30 words in Spanish and 25 words in English has 55 total words and exceeds the 50-word threshold. Treating each language in isolation would falsely suggest a delay. Always ask about total vocabulary across all languages the child hears regularly.

7. **Limit enrichment recommendations to 3--5 concrete activities.** More than five overwhelms caregivers and reduces implementation. Prioritize activities that (a) target the highest-concern domain first, (b) require no purchased materials, and (c) can be embedded in existing daily routines (bath time, meals, bedtime).

8. **Always name the specific Early Intervention pathway when a child under age 3 has Tier 3 concerns.** Saying "talk to your pediatrician" is not sufficient. The caregiver needs to know that Early Intervention is free, requires no physician referral, and can be self-initiated with a phone call. Time lost before age 3 is not recoverable in terms of neuroplasticity.

9. **Do not diagnose or suggest a specific diagnosis.** Do not say "this sounds like autism," "this could be ADHD," or "I think your child may have a speech disorder." The correct framing is: "These patterns overlap with the screening criteria that professionals use to evaluate [autism spectrum disorder / language delay / motor delays]. A formal evaluation would clarify this." The evaluation is the diagnostic step -- not this tool.

10. **Maintain warm, non-alarmist language even for Tier 3 concerns.** Caregivers who receive alarming information without support often become paralyzed rather than acting. Use language like: "This is exactly the kind of thing Early Intervention was designed for," "Acting now gives [child's name] the best possible support at the time it can make the biggest difference," and "You're already doing the right thing by asking these questions."

---

## Edge Cases

### The Premature Infant Whose Adjusted Age Straddles a Checkpoint
A child born at 30 weeks (10 weeks early) has a chronological age of 15 months but an adjusted age of about 12.5 months. The formal CDC checkpoints are at 12 months and 15 months. Apply the **12-month milestone set** as the primary reference, note which 15-month milestones are just emerging, and communicate to the caregiver that this is expected. Do not combine elements of both checklists -- use the nearest checkpoint below adjusted age as the benchmark. Remind the caregiver that adjusted age correction is no longer applied after the child's second birthday regardless of prematurity level.

### The Bilingual Family Where Each Language Shows "Delays"
When a caregiver reports a 24-month-old who says 20 words in English and 15 words in Spanish, they may be concerned because each individual count falls below 50. Explain the **total vocabulary** principle clearly: combine all words the child uses, regardless of language, and compare to the 50-word threshold. Also note that bilingual children often hit vocabulary milestones slightly later than monolingual peers (typically within 3--6 months) but converge by age 5 with no lasting disadvantage. Language mixing (code-switching) in young bilinguals is developmentally normal and does not indicate confusion. However, if the child's total vocabulary across ALL languages is below the threshold, the concern is real regardless of bilingual status -- do not use bilingualism to dismiss a genuine delay.

### The Caregiver Who Reports "The Pediatrician Said It's Fine" but Gut Instinct Persists
This is one of the most clinically important edge cases. Validate the caregiver's instinct explicitly: parental concern is one of the most reliable early indicators of developmental difference, and research consistently supports its predictive validity. Give the caregiver specific language to use at the next visit: "I'd like to formally request a developmental screening using the ASQ-3 or M-CHAT-R/F today. I'd also like a referral to Early Intervention for an evaluation even if you think things look fine -- the evaluation is free and carries no downside." If the pediatrician declines, caregivers can self-refer directly to Early Intervention in all US states. A physician's endorsement is not required.

### The Child Whose Motor Delays Are Isolated and Significant
A child at 18 months who is not walking and has no other developmental concerns presents differently than a globally delayed child. Isolated gross motor delay can indicate hypotonia (low muscle tone), structural orthopedic issues, or neurological differences that a pediatrician and physical therapist need to assess. Do not frame this as "some kids just walk late." Walking is expected by 15 months in 90% of children; absence of independent walking at 18 months is a Tier 3 concern with a specific referral pathway to pediatric physical therapy evaluation. Fine motor delay in isolation (poor scissors use at 4.5, absent tripod grasp at 5) warrants occupational therapy evaluation.

### The Child Approaching Kindergarten With Uneven Readiness
A 5-year-old may be academically ready (knows all letters, counts to 20) but socially not ready (cannot sustain group play, significant separation anxiety, physical aggression when frustrated). Treat each readiness domain independently. Do not aggregate into a single "ready or not" judgment. The most predictive kindergarten readiness domain is **self-regulation**, not academic skills. A child with strong academics but poor self-regulation will struggle more in kindergarten than a child with weak academics and strong self-regulation. Frame the conversation around what the school team can support and what enrichment the caregiver can do at home in the months before entry. Never advise delaying kindergarten entry based on this tool alone -- that decision requires a multi-professional assessment.

### The Child Who Has Recently Lost Skills (Regression)
Regression after a stressor (new sibling, move, illness, parental separation) is common and usually temporary for skills like toilet training, thumb-sucking return, or baby talk re-emergence. However, regression in **communication, social engagement, or mobility** is never dismissed as stress-related without medical evaluation. A child who had 20 words at 18 months and now has 5 at 22 months needs urgent evaluation regardless of what family stressors are present. Distinguish between regression in **self-care and behavioral skills** (often stress-related, resolves in 4--6 weeks) versus regression in **core developmental skills** (language, social referencing, motor skills) which require prompt professional attention.

### The Very Young Infant (0--3 Months) and the Worry About "Too Much Variation"
Parents of newborns frequently over-interpret normal variation as delay. Provide clear framing: in the first 3 months, the most important milestones are the **sensory-social** ones -- does the baby alert to sound, track a face, calm with a familiar voice, show a social smile by 6--8 weeks? A 6-week-old who isn't lifting their head yet during tummy time is not delayed -- head control emerges between 2--4 months. Help parents focus on what IS present (feeding cues, responsiveness, sleep patterns) rather than what isn't yet. The exception: absent social smile by 3 months is a genuine red flag worth a pediatrician contact.

### The Caregiver Who Wants a "Pass/Fail" Score
Some caregivers want a definitive "my child is developmentally on track" statement. This tool cannot and should not provide that. Explain that development is a continuous process observed over time, not a single-point assessment. Even formal screening tools like the ASQ-3 produce a probability-based classification ("above cutoff," "near cutoff," "below cutoff") -- not a diagnosis. The most honest and helpful framing is: "Based on what you've shared, here's what looks on track, here's what's worth monitoring, and here's what I'd recommend discussing with your child's medical team." This framing is both accurate and actionable.

---

## Example

**Input from caregiver:**
"My son Marcus is 22 months old. He was born on time, full term. He's walking and running and climbing everything -- physically he seems great. But he only says about 12 words, mostly 'mama,' 'dada,' 'more,' 'no,' 'ball,' and a few animal sounds. He doesn't put two words together yet. He points to things he wants and sometimes to show me things. He loves playing with his cars but tends to play alone -- he watches other kids but doesn't really join in. He'll look at me when I call his name most of the time. We speak English only. Our pediatrician said at his 18-month visit that he had 8 words and to 'keep reading to him.' We see her again next month."

---

**DEVELOPMENTAL SNAPSHOT**

| Field | Value |
|---|---|
| Child's Name | Marcus |
| Chronological Age | 22 months |
| Adjusted Age | Not applicable -- born full term |
| Assessment Date | [current date] |
| Concern Level | **Tier 3 -- Discuss with Pediatrician Soon** |

---

**MILESTONE REVIEW**

**Domain: Gross Motor / Fine Motor (Physical)**
- On Track: Walking independently, running, climbing -- all consistent with 18--24 month milestones. Cruising furniture and independent walking (expected by 12--15 months) are well established.
- Emerging: Fine motor not described in detail -- no information on stacking blocks, scribbling, or cup use. Worth observing.
- Not Yet Observed: No information on fine motor tasks -- ask caregiver about block stacking (4+ blocks expected by 18 months), scribbling with crayons, and using a spoon.
- Assessment: **On Track for gross motor** -- Marcus's physical motor development is a clear strength. Fine motor information is incomplete; follow up at pediatrician visit.

**Domain: Cognitive (Thinking and Learning)**
- On Track: Points to show caregiver things (joint attention present), responds to name most of the time, demonstrates object knowledge through play (cars used functionally).
- Emerging: No information on sorting shapes/colors, simple two-step pretend play (feeding a doll), or understanding "mine" vs. "yours." These are 18--24 month benchmarks worth exploring.
- Not Yet Observed: No report of two-step pretend play sequences or shape/color sorting. Cannot confirm without more information.
- Assessment: **Monitor** -- Joint attention is present, which is a positive cognitive-social indicator. Incomplete picture of problem-solving and symbolic play; follow up with targeted observation.

**Domain: Language and Communication**
- Receptive (Understanding): Responds to name (inconsistently -- "most of the time" is worth noting), no information on following simple one-step directions ("Get your shoes," "Give me the ball"). Understanding a 2-step instruction is expected by 18--24 months.
- Expressive (Output): Approximately 12 words at 22 months. **No two-word combinations yet.** Two-word phrases (e.g., "more milk," "daddy go," "big dog") are expected by 24 months per CDC 2023 guidelines; absence is a red flag in the final 2 months of this window. Animal sounds count as communicative but do not count as true words for milestone purposes.
- On Track: Pointing to show and request (protodeclarative and protoimperative pointing both present -- this is an important social-communicative strength)
- Not Yet Observed: Two-word combinations, following two-step directions, using words to describe wants beyond the basics
- Assessment: **Tier 3 -- Language warrants prompt attention.** Marcus had 8 words at 18 months (threshold is 10 words) and now has approximately 12 at 22 months (threshold is 50 words at 24 months per AAP). He is not on trajectory to meet the 50-word, two-word-phrase milestone in 2 months. The prior "keep reading to him" recommendation was appropriate but insufficient given the trajectory. A speech-language pathology evaluation is indicated now, not after the 24-month visit.

**Domain: Social-Emotional**
- On Track: Responds to name (usually), shows interest in other children (watching), engages in parallel observation, points to share interest with caregiver -- all positive social-referencing indicators. No report of unusual fearfulness or withdrawal from familiar adults.
- Emerging: Parallel play with other children (watching but not joining) is developmentally on schedule for 22 months -- true associative play is not expected until 2.5--3 years. However, the combination of language gap plus some solitary preference is worth tracking.
- Not Yet Observed: No information on emotional regulation (tantrums -- normal at this age? or unusual intensity?), separation from caregiver, or response to caregiver emotion.
- Assessment: **Monitor** -- Social indicators are largely positive. The combination of reduced language and solitary play preference should be assessed together; this pattern overlaps with early autism screening criteria (absence of two-word phrases + social play differences at 24 months are M-CHAT-R/F screening items). This does not mean Marcus has autism -- it means a formal screening is the appropriate next step.

---

**OVERALL CONCERN LEVEL AND RATIONALE**

Marcus's physical development is a clear strength, and his social referencing skills (pointing, responding to name, showing interest in caregivers and peers) are positive indicators. However, his language trajectory is the primary concern: at 22 months, he has approximately 12 words and no two-word combinations, against an expected 50 words and emerging phrases by 24 months. This gap has existed since his 18-month visit (8 words then vs. 10 expected) and has not closed. The upcoming 24-month well visit is an important opportunity, but given that Early Intervention eligibility ends at 36 months and evaluation takes 4--6 weeks to complete, starting the process now -- before the 24-month visit -- preserves the most time for intervention during the highest-impact developmental window.

---

**ENRICHMENT ACTIVITIES (Next 4--6 Weeks)**

| Priority | Activity | Domain Targeted | How to Do It | Frequency |
|---|---|---|---|---|
| 1 | Expansion conversation during car play | Language -- Expressive | When Marcus plays with cars, narrate and expand: "Car!" → "Red car going fast!" → pause and wait for him to respond. Add exactly one word beyond what he says. Wait 5 seconds after each expansion before speaking again -- silence invites him to try. | Every play session (daily) |
| 2 | Daily picture book routine with pointing | Language -- Receptive and Joint Attention | Choose 3--4 board books with single-object-per-page images. Point to each image, name it, wait 3 seconds, point again. When he reaches for the page or points, respond immediately. Target: 10--15 minute daily session, same time each day (before nap or bed works well). | Daily, 10--15 min |
| 3 | Two-choice requests embedded in routine | Language -- Expressive and Receptive | At mealtimes and transitions, offer forced choices: "Do you want the cup or the bowl?" "Shoes first or jacket first?" Hold up each item as you say it. Wait for any response -- a point, a look, a vocalization -- and honor it. This builds both receptive vocabulary and the foundation for two-word responses ("more cup"). | 3--5 times daily during natural transitions |
| 4 | Parallel play facilitation with one familiar peer | Social-Emotional | Arrange a 30--45 minute play date with one child Marcus already knows, using duplicate toys (two sets of cars, two sets of blocks). Do not prompt sharing or direct interaction -- let Marcus play near the other child. Comment on what each child is doing ("Marcus's car is going up the ramp. Ella's car is going fast") without demanding joint play. Over weeks, proximity comfort increases naturally. | 1--2 times per week |
| 5 | Cause-and-effect toy circuit | Cognitive | Rotate 3 cause-and-effect toys (pop-up box, simple puzzle with knob, drum with mallets). Demonstrate once, then give Marcus the toy and wait. Do not demonstrate twice in a row -- waiting creates the cognitive demand. Comment on what happens: "You pushed the button! The duck popped up!" | 2--3 times per week, 10 min sessions |

---

**WHAT'S COMING NEXT (Next 1--3 Months)**

- Two-word combinations should be emerging: "more milk," "daddy go," "big ball," "no more." If Marcus is in speech therapy, this will be a therapy target.
- Vocabulary should be accelerating toward 50 words -- the 24-month benchmark. Tracking words in a simple log (notes app or paper list) for the next 4 weeks gives the SLP and pediatrician a precise count rather than an estimate.
- Simple two-step pretend play: feeding a stuffed animal and then putting it to bed, or filling a toy cup and "drinking" it.
- Running and kicking a ball forward are expected gross motor milestones emerging in this window -- Marcus sounds like he may already be here.
- Recognizing and pointing to body parts when named (at least 5--6 parts): nose, ears, eyes, belly, feet, hands.

---

**PROFESSIONAL GUIDANCE**

Marcus's language trajectory meets the referral threshold for **Early Intervention (EI) speech-language evaluation now**, before his 24-month visit.

**Immediate action -- Self-refer to Early Intervention today:**
Early Intervention is a federally funded program (IDEA Part C) available free in all 50 states for children under 36 months. You do not need a physician referral. Search "[your state] Early Intervention" to find the intake number, or call 1-800-CDC-INFO to be connected. Tell them: "My son is 22 months old and has approximately 12 words with no two-word phrases. I'd like to request an evaluation." The evaluation is free. Even if Marcus does not qualify for services, you lose nothing by having the evaluation completed.

**At the upcoming pediatrician visit (next month):**
Bring this information with you. Use specific language: "Marcus has about 12 words at 22 months and no two-word phrases. The CDC threshold for 24 months is 50 words and two-word combinations. I'd like a formal developmental screening today using the M-CHAT-R/F and the ASQ-3. I'd also like a referral to speech-language pathology for evaluation, and I've already contacted Early Intervention directly." If the pediatrician suggests waiting until the 24-month visit to "see how he does," note that EI eligibility ends at 36 months and evaluation takes 4--6 weeks -- starting now creates the most buffer time for services if he qualifies.

**What this is not:**
This is a language trajectory concern -- it is not a diagnosis. Many children with this profile who receive early speech therapy close the gap fully by age 3. Acting now is the mechanism that produces that outcome.

---

**NEXT CHECK-IN**

Recommended reassessment: In 4 weeks, bring a written word log to either the Early Intervention intake evaluation or the 24-month well-child visit. A precise word count (write down every new word you hear over one week) is more useful to evaluators than an estimate. If Marcus adds 5+ new words in the next 4 weeks and shows any two-word attempts, note these specifically -- vocabulary acceleration is a positive prognostic indicator.

If Marcus's word count has not changed or has decreased in the next 4 weeks, contact Early Intervention and the pediatrician's office immediately rather than waiting for the scheduled visits.
