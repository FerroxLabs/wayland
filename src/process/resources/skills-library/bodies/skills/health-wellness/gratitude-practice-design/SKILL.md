---
name: gratitude-practice-design
description: |
  Designs a personalized gratitude practice using specific formats (three-item gratitude journal, gratitude letter, appreciation inventory, gratitude walk, savoring practice). Gathers the user's goals and preferences, then produces a structured practice plan with templates, prompt sets, and a weekly schedule.
  Use when the user asks about starting a gratitude practice, gratitude journaling, building an appreciation habit, or gratitude exercises for wellbeing.
  Do NOT use for clinical positive psychology interventions, treating depression, or replacing professional mental health support.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mental-wellness self-care journaling emotional-health"
  category: "health-wellness"
  subcategory: "mental-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Gratitude Practice Design

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health or mental wellbeing. If you are experiencing a mental health crisis, contact a licensed mental health professional or crisis line immediately.

## When to Use

**Use this skill when:**
- The user explicitly asks to start or improve a gratitude practice, gratitude journal, or appreciation habit
- The user asks for gratitude prompts, templates, or exercises they can do on their own
- The user wants to build psychological resilience or a more positive attentional orientation through a self-directed practice
- The user wants to deepen a relationship or shift their focus after a period of stress, monotony, or mild low mood (not clinical depression)
- The user asks about gratitude for general wellbeing, better sleep onset, or interpersonal appreciation
- The user wants a family or household gratitude ritual (shared mealtime round, weekly family highlight)
- The user wants to combine gratitude with an existing practice (morning pages, mindfulness, exercise)
- The user is recovering from a rough period and wants to rebuild positive awareness -- without pretending problems do not exist

**Do NOT use when:**
- The user describes symptoms consistent with clinical depression (persistent low mood, anhedonia, sleep disruption, worthlessness), even if they frame it as "I just need to be more grateful" -- redirect with compassion to professional support
- The user is in acute distress, crisis, grief overwhelm, or panic -- gratitude practice is contraindicated during crisis; use `crisis-support-referral` skill instead
- The user wants a broader mental health journaling practice that includes processing difficult emotions, self-compassion work, or cognitive restructuring -- use `journaling-mental-health` skill
- The user wants comprehensive stress management (breathwork, somatic tools, cognitive tools) -- use `stress-management-toolkit` skill
- The user asks for clinical positive psychology intervention protocols (e.g., structured Positive Psychotherapy as a clinical treatment modality)
- The user wants a mindfulness meditation practice as the primary focus -- use `mindfulness-practice-design` skill
- The user needs professional relationship counseling that happens to include appreciation work

## Process

### Step 1: Gather Context Before Designing Anything

Ask all of the following before recommending any format. Do not skip this step -- the wrong format chosen without context is the single biggest reason gratitude practices fail.

- **Motivation and goal:** Why does this person want a gratitude practice now? What would success feel like in 30 days? (Common answers: better mood, less negativity, stronger relationships, help sleeping, general curiosity)
- **Prior experience:** Have they tried gratitude journaling before? If yes, why did it stop? (The answer reveals the real obstacle -- usually staleness, inauthenticity, or inconsistency)
- **Medium preference:** Do they prefer writing (physical notebook, digital app), verbal/spoken, or physical/experiential? This is not a trivial preference -- forcing a writer to do spoken affirmations or a kinesthetic person to sit still with a journal undermines adherence
- **Available time window:** How many minutes per day or week are genuinely available? Force a real number. "I have 5 minutes" is very different from "I have 15 minutes"
- **Preferred frequency:** Daily, several times per week, or weekly intensive? Research consistently shows that 3-4 times per week produces stronger wellbeing effects than daily practice for most people (Lyubomirsky, Sheldon, Schkade findings), because daily practice adapts faster and loses novelty -- share this counter-intuitive finding with users who insist on daily
- **Current life context:** Are they going through anything difficult? This affects both format choice and tone calibration
- **Relationship to "should":** Does the user feel obligated to be grateful (cultural, religious, family pressure)? If yes, adjust framing away from obligation toward curiosity and noticing

### Step 2: Select 1-2 Formats Based on Intake Data

Use the decision framework below. Match the user's constraints to the optimal format. Recommend a primary format and one lightweight secondary format.

**Three-Item Gratitude Journal (3IGJ)**
- Time: 3-7 minutes
- Medium: Writing (physical or digital)
- Best for: Beginners; anyone who has not tried journaling before; people with 5-minute windows; evening practitioners
- Core mechanism: Each item requires a specific "because" explanation -- this is mandatory, not optional, because the explanatory elaboration is the active ingredient that drives the neural attention shift
- Research grounding: Emmons and McCullough (2003) foundational study used weekly 3-5 item lists; specificity and elaboration were the key variables
- Key risk: Becomes formulaic after 2-3 weeks without novelty injection

**Gratitude Letter (Sent or Unsent)**
- Time: 15-30 minutes
- Medium: Writing
- Best for: People motivated by relationships; weekly or biweekly practice; people in a rut with item-based lists; people who want to use gratitude to deepen a specific relationship
- Core mechanism: Writing to a specific person forces relational perspective-taking; the act of naming what someone did AND how it changed you is cognitively and emotionally richer than list-making
- Variant: The "sent" version (actually delivering the letter or reading it aloud) produces larger and longer-lasting wellbeing effects than unsent versions -- ask the user if they are open to delivery
- Key risk: Can feel emotionally exposing; some users resist the relational focus

**Appreciation Inventory**
- Time: 10-20 minutes
- Medium: Writing
- Best for: People who want periodic deep-dive reflection; biweekly or monthly practice; anyone whose daily practice has stalled
- Structure: Choose one category (people who helped shape me; places that feel like home; skills I take for granted; small objects that make daily life better; experiences I would not trade). List 10 items in that category with one specific detail each
- Core mechanism: The category constraint forces exploration of one domain at depth rather than skimming across all domains shallowly
- Key risk: Feels like homework if done too frequently -- best used as a monthly or quarterly reset, not daily

**Gratitude Walk**
- Time: 10-20 minutes
- Medium: Experiential/movement-based
- Best for: People who dislike writing; people who already have a daily walk; kinesthetic learners; people who feel "stuck in their head"
- Structure: Walk with no earbuds or podcast. At each minute or at designated landmarks, identify one thing for each sense category: something you see that is beautiful or interesting, something you hear that is pleasant or calming, something you feel physically (temperature, texture underfoot, air on skin), something you smell. At the end, name one thing you appreciate about having a body that can do this walk
- Core mechanism: Sensory grounding in present-moment experience; prevents the verbal-abstract gratitude that can feel performative
- Key risk: Difficult to practice in bad weather or for users with mobility limitations -- build a seated indoor variant

**Savoring Practice (Micro-Gratitude)**
- Time: 60-90 seconds, multiple times per day
- Medium: Experiential (no writing required, though a brief log is useful)
- Best for: People with no dedicated practice time; people who want to integrate gratitude into existing moments rather than add a session; people who find journaling artificial; anyone using it as a secondary practice
- Structure: Once per day (or up to 3 times), when a positive moment occurs, pause deliberately. Spend 60 seconds attending to: one visual detail, one physical sensation, one emotional tone, one thing about this moment you would want to remember. Mentally say: "This is happening. I am here for it."
- Core mechanism: Savoring amplifies positive emotion duration by preventing the automatic attention-shifting to the next task; research by Bryant and Veroff identifies this as distinct from gratitude but complementary
- Key risk: Easy to forget entirely without a cue -- anchor it to an existing daily trigger (first sip of coffee, stepping outside, ending a call)

**Three-Good-Things with Causal Analysis (3GT+CA)**
- Time: 8-12 minutes
- Medium: Writing
- Best for: Intermediate users who have done basic gratitude journaling; users whose goal is countering a negativity bias or rumination pattern; users who want more psychological depth
- Structure: Write three good things that happened today. For each, answer: What caused this good thing? Could I influence whether this happens again? What does this good thing tell me about my life or myself?
- Core mechanism: The causal analysis component is drawn from Seligman's Well-Being Therapy work; it specifically targets pessimistic explanatory style by training attribution to stable, internal, controllable causes when evidence supports it
- Key risk: Can become analytical and lose the felt sense of appreciation -- remind users that emotion matters, not just analysis

### Step 3: Design the Practice Structure

Once formats are selected, build the practice architecture with these components:

- **Time anchor:** Attach the practice to an existing habit (after brushing teeth, with morning coffee, before the evening alarm, during a lunch break). This is habit stacking (James Clear / BJ Fogg behavioral science framework) -- new behaviors require no extra willpower when anchored to established routines. Identify the exact anchor in the user's life
- **Physical location:** Where specifically will the practice happen? A designated chair, a notebook on the bedside table, a walking route? Physical location specificity increases follow-through
- **Minimum viable version (MVV):** Define the smallest possible version that still counts. The MVV exists for low-energy days and should take under 90 seconds. For written practices, the MVV is a mental list of 3 things without writing. The rule: a MVV entry still counts as a practice day. Never break the chain for less than 3 consecutive days
- **Frequency decision:** If the user wants daily practice, note the research finding that 3-4 times per week often produces better sustained outcomes than daily (prevents hedonic adaptation). Suggest 5 days per week as a middle ground if they insist on near-daily
- **Weekly variation:** If using multiple formats, assign each to specific days or week-types to prevent monotony

### Step 4: Build the Prompt Library

Create exactly 14 prompts tailored to the user's stated goals. Structure the library so that:

- Every 7 prompts cycles through all 6 categories (person, experience, place, skill, object, sense) plus one wildcard category
- Prompts are specific enough to require real thought but not so narrow that they only apply once
- At least 3 prompts involve other people (interpersonal gratitude produces stronger wellbeing effects than gratitude for objects or circumstances)
- At least 2 prompts involve the body or physical experience (counters the tendency to live entirely in the abstract)
- At least 2 prompts ask the user to consider something they usually overlook or take for granted (contrast thinking: what would my day look like without this?)
- At least 1 prompt involves the future or anticipation (prospective gratitude)
- Prompts never use the word "grateful" -- instead use: "appreciate," "value," "notice," "am glad exists," "would miss if it were gone"

### Step 5: Build Anti-Staleness Architecture

Staleness is the primary failure mode of gratitude practices. Address it proactively with these mechanisms:

- **Category rotation tracking:** Provide a simple tracking grid (6 categories x 4 weeks). Users must distribute entries across categories, with no category appearing more than 5 times in 2 weeks
- **Specificity escalation rule:** After week 2, no person, place, or object can reappear without a NEW and DIFFERENT reason. Introduce this rule at the start so users know it is coming
- **Monthly format switch:** Plan a format switch at the 4-week mark (e.g., switch from Three-Item Journal to Appreciation Inventory for one week, then return)
- **Contrast injection:** Once per week, include one "subtraction" prompt -- "What would my morning have been like if [X] did not exist?" Subtraction prompts activate more vivid appreciation than addition prompts alone (Koo et al., 2008 mental subtraction research)
- **Depth escalation:** In week 1-2, entries are 1-2 sentences. In week 3+, aim for 3-5 sentences with genuine specificity about why something matters and what life would be different without it

### Step 6: Create Pitfall Prevention and Self-Monitoring Guidance

Name the 5 most common failure patterns and give the user explicit self-diagnostic questions:

1. **Generic autopilot entries** ("health, family, coffee") -- Fix: The "because" is mandatory; the item name alone is insufficient
2. **Obligation creep** (practice feels like homework) -- Fix: Reduce frequency for 2 weeks; switch to Savoring Practice (no writing)
3. **Emotional flatness** (writing entries but feeling nothing) -- Fix: Switch from abstract to sensory gratitude; use the Gratitude Walk for 1 week
4. **Guilt spiral** (feeling bad about not being "grateful enough") -- Fix: Reframe the practice as noticing, not performing -- you do not have to feel moved, you just have to pay attention
5. **Week 3 drop-off** (the most common abandonment point) -- Fix: At day 14, proactively switch prompt sets and introduce one new format element; build this transition into the plan from day 1

### Step 7: Add a 30-Day Check-In Structure

Include a brief 30-day review framework so the practice evolves instead of being static:

- What format still feels genuine?
- Which category do entries cluster in? Rotate away from it.
- What is one thing you wrote about in week 1 that you genuinely felt, compared to week 4? What changed?
- Has the practice improved the user's goal metric? (mood, sleep quality, relationship quality, etc.)
- What would the next 30-day version of this practice look like?

## Output Format

```
## Your Personalized Gratitude Practice

> This plan was designed based on your specific goals and preferences.
> It is a living document -- adjust it as you learn what works.

---

### Practice Overview

| Field | Your Practice |
|-------|--------------|
| Goal | [user's stated goal in 1 sentence] |
| Primary Format | [format name] |
| Secondary Format | [format name or "none"] |
| Frequency | [X days per week] |
| Time Per Session | [X] minutes |
| Time Anchor | [specific habit it is attached to] |
| Location | [specific place] |
| Minimum Viable Version | [exact MVV description, under 90 seconds] |

---

### Primary Practice: [Format Name]

**When:** [specific time and trigger]
**Duration:** [X] minutes
**What You Need:** [notebook/app/no materials]

**The Template:**

[Exact fill-in template]

**Completed Example Entry:**

[A fully worked example showing specificity, "because" explanations, and depth --
not a generic placeholder. This example should be realistic and specific to the
user's context where possible.]

---

### Secondary Practice: [Format Name or "None"]

**When:** [specific time and trigger]
**Duration:** [X] minutes
**How It Works:** [step-by-step instructions for this format]

[If "none," explain why no secondary practice was chosen and at what point
the user might want to add one.]

---

### Prompt Library (14 Prompts)

Use these prompts when your default entries start to feel automatic.
Rule: If you write the same item three times, use a prompt for the next entry.

| # | Prompt | Category | Notes |
|---|--------|----------|-------|
| 1 | [prompt] | Person | [brief tip for using it] |
| 2 | [prompt] | Experience | [brief tip] |
| 3 | [prompt] | Place | [brief tip] |
| 4 | [prompt] | Skill | [brief tip] |
| 5 | [prompt] | Object | [brief tip] |
| 6 | [prompt] | Sense | [brief tip] |
| 7 | [prompt] | Wildcard | [brief tip] |
| 8 | [prompt] | Person | [brief tip] |
| 9 | [prompt] | Experience | [brief tip] |
| 10 | [prompt] | Place | [brief tip] |
| 11 | [prompt] | Sense | [brief tip] |
| 12 | [prompt] | Skill | [brief tip] |
| 13 | [prompt] | Object | [brief tip] |
| 14 | [prompt] | Subtraction | "What would today be like without...?" |

---

### Weekly Schedule

| Day | Time | Format | Duration | Notes |
|-----|------|--------|----------|-------|
| Monday | [time] | [format] | [X min] | [any variation] |
| Tuesday | [time] | [format] | [X min] | [any variation] |
| Wednesday | [time/off] | [format/rest] | [X min/--] | [note] |
| Thursday | [time] | [format] | [X min] | [any variation] |
| Friday | [time] | [format] | [X min] | [any variation] |
| Saturday | [time/off] | [format/rest] | [X min/--] | [note] |
| Sunday | [time] | [format + review] | [X+2 min] | [weekly review] |

---

### Anti-Staleness Strategies

**Category Rotation Tracker:**

| Category | Week 1 | Week 2 | Week 3 | Week 4 |
|----------|--------|--------|--------|--------|
| Person | [ ] [ ] | [ ] [ ] | [ ] [ ] | [ ] [ ] |
| Experience | [ ] [ ] | [ ] [ ] | [ ] [ ] | [ ] [ ] |
| Place | [ ] [ ] | [ ] [ ] | [ ] [ ] | [ ] [ ] |
| Skill | [ ] [ ] | [ ] [ ] | [ ] [ ] | [ ] [ ] |
| Object | [ ] [ ] | [ ] [ ] | [ ] [ ] | [ ] [ ] |
| Sense | [ ] [ ] | [ ] [ ] | [ ] [ ] | [ ] [ ] |

Tick a box each time you write an item in that category.
If any row has 4+ ticks in one week, intentionally skip that category next session.

**Specificity Escalation Rule (Begins Week 3):**
No person, place, or object may reappear with the same reason.
"Grateful for my friend Riya" can appear twice -- but the second time must name
a completely different reason than the first.

**Week 4 Format Switch:**
On the first day of week 4, replace your primary practice with [alternate format]
for one full week, then return to [primary format]. This resets hedonic adaptation.

**Monthly Subtraction Prompt:**
On the last Sunday of each month, write: "What would last month have been like
without [one thing from your most common category]?" Spend 5 minutes with this.

---

### Common Pitfalls and Fixes

| What You Notice | What Is Happening | What to Do |
|-----------------|-------------------|------------|
| Writing "health, family, coffee" on autopilot | Hedonic adaptation -- the brain treats familiar items as background noise | Force category you have NOT used this week; use a prompt from the library |
| Entries feel hollow, nothing lands emotionally | Items are too abstract; the "because" is missing or surface-level | Shift to sensory gratitude for one week; write only things you can see, hear, or feel right now |
| You have skipped 3+ days | All-or-nothing thinking is taking over | Invoke MVV immediately; do a 60-second mental list tonight; reset tomorrow |
| Practice feels like obligation | Frequency is too high for your current life | Drop to 3 days per week; switch to Savoring (no writing required) |
| You feel guilty for "not being grateful enough" | The practice is being used as a self-judgment tool | Reframe: this practice is about noticing, not performing. You do not have to feel moved. Noticing counts. |

---

### 30-Day Check-In Questions

Answer these at the end of month 1:

1. Which entry from the first week felt most genuine? What made it specific?
2. Which category appears most in your entries? Which appears least?
3. On a scale of 1-10, how would you rate your awareness of small positive moments compared to day 1?
4. Has your original goal ([user's goal]) shifted, improved, or stayed the same?
5. What would the next version of this practice look like? What would you add, remove, or change?

```

## Rules

1. **Never frame gratitude practice as a treatment for depression, anxiety, OCD, PTSD, or any diagnosable condition.** Frame it always as a general wellness practice for building attentional orientation toward positive experience. If the user's language suggests clinical-level symptoms, acknowledge compassionately and redirect to professional support before offering any practice design.

2. **The "because" explanation is always mandatory in written formats.** Writing "I am grateful for my dog" produces minimal sustained benefit. Writing "I am grateful for my dog because she forced me to walk 20 minutes at noon and I noticed the light on the trees and came back calmer" activates semantic elaboration, episodic memory encoding, and causal attribution -- these are the active psychological mechanisms. Never let a user treat the item name as sufficient.

3. **Never recommend daily practice without sharing the frequency research trade-off.** Research by Lyubomirsky and colleagues found that daily gratitude journaling produced smaller wellbeing gains than 3-4 times per week, attributed to hedonic adaptation. Give users this information and let them choose, rather than defaulting to daily because it sounds more disciplined.

4. **Always include a Minimum Viable Version for every format.** The MVV must take under 90 seconds, require no materials, and still count as a practice session. Habit continuity across low-energy days matters more than depth of any single entry. The 3-day rule applies: missing 1-2 days is normal; missing 3+ consecutive days signals a design problem, not a character problem.

5. **Enforce specificity in every template and every example.** Generic gratitude ("health, family, job") is the primary driver of staleness and emotional flatness. Specificity at the level of named individuals, particular moments, exact sensory details, and exact time contexts is the mechanism that prevents adaptation. Every template you produce must structurally require specificity -- the user should not be able to fill it in generically without actively resisting the template's design.

6. **Never use toxic positivity language or imply that gratitude cancels out difficulty.** Do not use phrases like: "just focus on the good things," "look on the bright side," "you have so much to be thankful for," "other people have it worse." Gratitude practice coexists with difficulty -- it does not require minimizing, dismissing, or solving problems. If a user mentions going through something hard, acknowledge it directly before discussing practice design.

7. **Always build anti-staleness architecture into the plan from day 1, not as an afterthought.** Category rotation, specificity escalation, monthly format switches, and subtraction prompts must be included in the initial plan, not added later when the user reports boredom. Tell the user that week 2-3 is the highest-risk abandonment window and explain exactly what to do when it arrives.

8. **If the user previously tried and abandoned a gratitude practice, diagnose the failure mode before redesigning.** Common failure modes have specific fixes: staleness (new category rotation system), inauthenticity (switch to sensory/concrete format), inconsistency (time anchor is wrong -- find a better one), obligation feeling (reduce frequency and switch format). Redesigning the same format that failed will produce the same failure.

9. **Select formats based on medium preference and time availability, not on what sounds most beneficial.** A user who genuinely hates writing and receives a journaling-heavy plan will abandon it within 10 days regardless of the plan's quality. Match the medium to the person. Kinesthetic learners get the Gratitude Walk. Verbal processors get spoken entries recorded in a voice memo app. Writers get the journal formats. These are non-negotiable accommodations, not optional alternatives.

10. **Include interpersonal gratitude in at least 30% of prompts.** Gratitude directed toward other people -- acknowledging specific actions, kindnesses, or contributions -- produces consistently stronger wellbeing and relationship satisfaction effects than gratitude for circumstances or objects. This is one of the most replicated findings in the gratitude research literature. Every prompt library must have at least 4 of 14 prompts focused on people.

11. **If a user reports that the practice consistently makes them feel worse** (guilt, sadness, shame, hopelessness) after 2+ weeks, do not adjust the practice -- recommend pausing it entirely and speaking with a licensed mental health professional. Persistent difficulty experiencing positive emotion, or a pattern where gratitude exercises increase distress, can be a signal of clinical-level difficulty that requires professional evaluation. Gratitude practice is not appropriate as a solitary intervention in these cases.

12. **Always provide a 30-day check-in structure.** The practice should evolve based on what the user actually learns about themselves. A static plan that never updates will stagnate. The check-in questions help users notice what is working, what category they are avoiding, and what the next version of their practice should look like.

## Edge Cases

### User Is Going Through Active Grief, Job Loss, or Health Crisis

Acknowledge the difficulty explicitly and without minimizing it before offering anything. Do not say "but there's still good in life." Say something like: "Going through [difficulty] is genuinely hard, and there is no gratitude practice that should require you to pretend otherwise."

Adapt the format to micro-gratitude: "Name one moment today that was not terrible." "What is one small comfort -- a warm drink, a text from someone, five minutes of quiet -- that you accessed today?" These are not about finding silver linings in the difficulty itself. They are about locating pockets of neutral-to-positive experience that coexist alongside the hard stuff. Introduce the Savoring Practice (60-second noticing) as the only format during this period -- it requires no writing, no session, and no commitment to positive framing.

If the user describes prolonged inability to experience any positive moments, persistent hopelessness, or functional impairment, this is outside the scope of this skill. Compassionately note that speaking with a mental health professional would be more appropriate than a gratitude practice right now.

### User Says "I've Tried This and It Feels Fake"

This is almost always a specificity problem and occasionally a format-medium mismatch. Demonstrate the difference immediately with a real contrast:

Generic (feels fake): "I am grateful for my health."
Specific (feels real): "I am grateful that when I walked up the stairs this morning carrying groceries, my knees did not hurt the way they did last winter."

The generic version describes a category. The specific version describes an actual moment in an actual body. The brain processes these differently. If the user still resists after this demonstration, the format itself is wrong -- move them to the Gratitude Walk or Savoring Practice, which are experiential rather than verbal-abstract, and therefore feel less like "saying the right things."

If the user's sense of fakeness is deeper -- a feeling that gratitude practice is culturally performative or psychologically coercive -- validate this perspective. The neuroscience of attention and noticing does not require the word "gratitude." Reframe the practice as "attentional noticing of positive moments" if the user finds that framing more authentic.

### User Wants 3-4 Times Per Week But Worries About Which Days to Skip

This is a scheduling anxiety trap. Give a direct, concrete answer: anchor practice days to the structure of the week rather than relying on motivation. Monday-Wednesday-Friday-Sunday is a common and effective pattern that distributes practice across the week without clustering. Alternatively, "weekdays except Wednesday" creates natural midweek rest. The specific days matter less than the fact that they are pre-decided -- decision fatigue around "should I practice today?" is itself a barrier to habit formation.

Give the user permission to treat off-days as genuine recovery, not as failures. Savoring Practice (no writing, 60 seconds) can be the off-day activity without counting as a formal session.

### User Wants a Family Gratitude Practice (Children or Household)

Design a table-round format rather than individual journaling. Structure:
- At dinner, one person asks the round: "What is one specific good thing that happened today?"
- Each person answers in 1-2 sentences. No item-naming without a brief "because" explanation even with children -- model the "because" yourself
- The facilitator (a parent or partner) does NOT judge, compare, or redirect answers
- Duration: under 5 minutes, ending before it feels like homework
- For children under 8: use sensory prompts ("What tasted good today? What made you laugh? What did you see today that was interesting?"). Abstract prompts about "what you value" are developmentally too advanced
- For teenagers: do not make it mandatory or it will be resisted. Make it genuinely optional but model it yourself consistently. Teens who see adults doing the practice authentically will engage more than teens who are required to perform it

Note clearly: this skill designs the practice structure. It does not provide family therapy, parenting advice, or guidance on family dynamics.

### User Wants to Combine Gratitude With Mindfulness Meditation

Design a two-phase session that does not blend the practices into incoherence:

Phase 1 (3-5 minutes): Mindfulness -- breath awareness or body scan, whatever the user's existing practice uses. No content, no language. Just settling attention.

Phase 2 (5 minutes): Gratitude -- coming out of the settled attention, write or mentally name three specific items. The transition from mindfulness into gratitude is effective because mindfulness reduces the verbal autopilot that generates generic entries. Users who practice this sequence often report that their gratitude entries are more specific and more emotionally resonant than entries written "cold."

Do not attempt to run both practices simultaneously (e.g., "mindfully notice what you are grateful for during the breath"). This produces neither good mindfulness nor good gratitude. Keep phases distinct.

### User Wants to Use a Digital App Instead of a Physical Notebook

App-based practice is entirely valid -- the medium is less important than the specificity and regularity of the entries. Common app features that support this skill:

- Notification reminders (anchor to an existing daily alarm already in the phone)
- Entry history browsing (useful for the specificity escalation rule -- users can review what they have already written)
- Photo attachment (some users find that photographing one thing they appreciate before writing about it increases specificity dramatically)
- Streak tracking (motivating for some users; demoralizing for others after a missed day -- instruct the user not to treat a streak break as a practice failure)

If the user uses a notes app rather than a dedicated gratitude app, suggest creating a template note they paste at the start of each entry (the template from the practice design) so they do not have to reconstruct it from memory. Cognitive friction around format design reduces completion rates.

### User Asks About Gratitude for Sleep Improvement Specifically

The research support for gratitude and sleep quality is specific: gratitude practice that immediately precedes sleep onset reduces pre-sleep cognitive arousal (worry, rumination, to-do list processing) by giving the brain a structured alternative focus. The mechanism is attentional displacement, not relaxation induction.

Design accordingly: the Three-Item Gratitude Journal or Three-Good-Things format, done in bed (or immediately before getting into bed) with no other activities between the practice and sleep onset. Do not combine with phone use, TV, or conversation. Physical notebook is preferable to a phone for sleep contexts because screen light and app notifications undermine sleep onset regardless of the content. Total time should be under 7 minutes to prevent the practice from becoming activating rather than settling.

## Example

**Input:** "I've tried gratitude journaling twice before and both times stopped after about 2-3 weeks because it started feeling repetitive and hollow. I'd end up writing 'grateful for my family, my health, my job' every single night and it meant nothing. I have about 7-8 minutes in the morning over coffee. I'm a pretty good writer. My goal is just to start my days feeling more grounded rather than immediately anxious. I want to do this maybe 4-5 times a week."

---

**Output:**

## Your Personalized Gratitude Practice

> This plan was designed based on your specific goals and preferences.
> It is a living document -- adjust it as you learn what works.

---

### Practice Overview

| Field | Your Practice |
|-------|--------------|
| Goal | Start the day feeling grounded rather than immediately anxious |
| Primary Format | Three-Good-Things with Causal Analysis (3GT+CA) |
| Secondary Format | Savoring Practice (no writing, embedded in existing activities) |
| Frequency | 4-5 days per week |
| Time Per Session | 7-8 minutes |
| Time Anchor | Morning coffee, before checking phone or email |
| Location | Wherever you drink your morning coffee -- same spot each time |
| Minimum Viable Version | 60-second mental recall of one specific good thing from yesterday, done before getting out of bed |

---

### A Note on Your Previous Experiences

You have already identified the exact problem: generic entries. "Grateful for family, health, job" is not a practice failure -- it is a format design failure. That structure does not prevent generic answers, so generic answers are what it produces.

This plan uses a different format (Three-Good-Things with Causal Analysis) that structurally prevents generic entries by requiring you to answer *why* something happened and *what you could do* to make it happen again. You are a good writer -- this format will reward that. It asks more of you than a list, but it is also the format most likely to actually feel like something.

The plan also includes a Specificity Escalation Rule that kicks in at week 3, and an explicit transition plan for week 4, specifically because week 2-3 is the highest-risk period for the experience you have had twice before.

---

### Primary Practice: Three-Good-Things with Causal Analysis (3GT+CA)

**When:** During morning coffee, before opening your phone or email -- ideally the first 7-8 minutes of your seated morning

**Duration:** 7-8 minutes

**What You Need:** A notebook or dedicated notes app. Physical notebook recommended -- it keeps the practice off the same screen where your anxious morning scrolling happens.

---

**The Template:**

```
Date: _______________
Day _____ of practice (keep a running count)

GOOD THING 1:
What happened: _______________________________________________
What specifically made it good: __________________________________
What caused it: ________________________________________________
Could I influence whether this happens again? How?
_____________________________________________________________

GOOD THING 2:
What happened: _______________________________________________
What specifically made it good: __________________________________
What caused it: ________________________________________________
Could I influence whether this happens again? How?
_____________________________________________________________

GOOD THING 3:
What happened: _______________________________________________
What specifically made it good: __________________________________
What caused it: ________________________________________________
Could I influence whether this happens again? How?
_____________________________________________________________

One sentence I want to carry into today:
_____________________________________________________________
```

---

**Completed Example Entry:**

```
Date: Thursday, October 10
Day 8 of practice

GOOD THING 1:
What happened: I had a call with my project lead yesterday afternoon that
I had been dreading, and it went fine -- better than fine, actually.
What specifically made it good: She was direct but not harsh, and the
problem we discussed turned out to be fixable in a way I had not
anticipated. I left the call less tense than I had been for three days.
What caused it: I had prepared for 15 minutes the night before and knew
what I actually wanted to say. That preparation kept me from going blank.
Could I influence whether this happens again? Yes. The preparation made
the difference. That is a repeatable action.

GOOD THING 2:
What happened: I made the slow-cooker lentil soup I had been postponing
for a month.
What specifically made it good: The kitchen smelled good for three hours
and dinner required no thought at all after a mentally tiring day. I ate
slowly and read something that had nothing to do with work.
What caused it: I finally had a morning where I did not need to be
anywhere by 9, so I set it up at 8. That flexibility was key.
Could I influence whether this happens again? Yes and no. I cannot always
control my schedule, but I can batch slow-cooker days to Sundays when
my morning is consistently more open.

GOOD THING 3:
What happened: My neighbor knocked and returned my umbrella I had left
in the hallway two weeks ago.
What specifically made it good: I had genuinely forgotten it existed. The
knock surprised me in the best way -- someone noticed something small
and did the small right thing. That felt like evidence that ordinary
kindness is still out there operating quietly.
What caused it: My neighbor chose to act on a small noticing. I did not
cause this one.
Could I influence whether this happens again? Not directly -- but I can
be the version of that neighbor for someone else. That is interesting.

One sentence I want to carry into today:
Preparation made the call survivable; I know how to prepare.
```

---

### Secondary Practice: Savoring (No Writing Required)

**When:** Once per day, whenever a genuinely pleasant moment occurs -- not scheduled, triggered by the moment itself

**Duration:** 60-90 seconds

**How It Works:**

1. When something pleasant happens -- good coffee, a moment of quiet, finishing something you were avoiding, sunlight, a real laugh -- stop what you are doing for 60 seconds
2. Notice: one thing you can see in this moment, one physical sensation in your body right now, one word for what you feel emotionally
3. Say mentally (or quietly aloud): "This is happening. I am here for it."
4. Return to what you were doing

No writing required. No app. No streak to maintain. This is a 60-second noticing practice that repurposes moments already happening in your day. It trains the same attentional muscle as the morning journal but at random intervals throughout the day, which prevents the anxiety-return that can happen between morning practice and the rest of the day.

---

### Prompt Library (14 Prompts)

Use these when your default 3GT entries start feeling automatic.
**Trigger rule:** If you find yourself writing the same person, place, or theme three times in two weeks, use a prompt from this library for your next session.

| # | Prompt | Category | Notes |
|---|--------|----------|-------|
| 1 | Who is someone who helped you in the past week -- not dramatically, but in a small practical way -- and what specifically did they do? | Person | Name them by name. Name the moment. |
| 2 | What is one thing you completed, finished, or resolved this week that had been waiting? What did it feel like to close it? | Experience | Works especially well when you feel unproductive |
| 3 | Name a physical space you spent time in yesterday. What about it made it tolerable or pleasant? | Place | Challenge: avoid your home unless you can name something specific you rarely notice |
| 4 | What is one skill you used this week that you did not have five years ago -- not a career skill, a human one? | Skill | Communication, patience, noticing, saying no -- these count |
| 5 | Pick one object within reach right now. What would your morning look like if it did not exist? | Object | The subtraction question activates appreciation more vividly than the addition question |
| 6 | Describe a physical sensation from yesterday that was pleasant or neutral -- not peak joy, just unremarkable comfort. What was it? | Sense | Warm water, soft chair, cold air, full stomach -- small and specific |
| 7 | What is something you were dreading this week that either did not happen, or was less bad than you expected? | Wildcard | This prompt directly targets morning anxiety -- which is your stated context |
| 8 | Name someone you have not thought about in a while who taught you something you still use. What did they teach you? | Person | The person does not need to be in your life currently |
| 9 | What is one experience from the past year that was uncomfortable at the time but that you are now glad happened? | Experience | Do not force this -- only use it when a genuine answer presents itself |
| 10 | Is there a route, neighborhood, or landscape you pass through regularly that you have stopped actually looking at? What is one specific detail you noticed today? | Place | Pairs well with a morning walk or commute |
| 11 | What sound in your environment this morning was pleasant, or at least not unpleasant? Be specific about what made it tolerable or good. | Sense | Trains sensory specificity; counteracts abstract-verbal default |
| 12 | What is something you know how to do that once felt impossible? How long did it take to learn? | Skill | Reframes competence and growth; useful during imposter syndrome episodes |
| 13 | What is one convenience in your daily life that you almost certainly take for granted? What would a Tuesday look like without it? | Object | Running water, electricity, transit, a reliable device -- specificity required |
| 14 | What is one thing you are genuinely looking forward to in the next two weeks -- not a large event, something small and specific? | Subtraction | Prospective gratitude; anticipation extends positive emotion forward in time |

---

### Weekly Schedule

| Day | Time | Format | Duration | Notes |
|-----|------|--------|----------|-------|
| Monday | Morning coffee | 3GT+CA | 7 min | Week's first entry -- use yesterday's Sunday as material |
| Tuesday | Morning coffee | 3GT+CA | 8 min | |
| Wednesday | Morning coffee | 3GT+CA | 7 min | If entries feel thin, use a prompt from library |
| Thursday | Rest day | Savoring only | 60 sec x 1-2 | No writing. Just noticing. |
| Friday | Morning coffee | 3GT+CA | 8 min | End-of-week entries often richest -- lean into specificity |
| Saturday | Rest day | Savoring only | 60 sec x 1-2 | Optional: spend 2 min reading back this week's entries |
| Sunday | Morning coffee | 3GT+CA + weekly review | 10 min | Add 2 min to read back the week and answer one check-in question |

---

### Anti-Staleness Strategies

**Category Rotation Tracker:**

| Category | Week 1 | Week 2 | Week 3 | Week 4 |
|----------|--------|--------|--------|--------|
| Person | [ ] [ ] | [ ] [ ] | [ ] [ ] | [ ] [ ] |
| Experience | [ ] [ ] | [ ] [ ] | [ ] [ ] | [ ] [ ] |
| Place | [ ] [ ] | [ ] [ ] | [ ] [ ] | [ ] [ ] |
| Skill | [ ] [ ] | [ ] [ ] | [ ] [ ] | [ ] [ ] |
| Object | [ ] [ ] | [ ] [ ] | [ ] [ ] | [ ] [ ] |
| Sense | [ ] [ ] | [ ] [ ] | [ ] [ ] | [ ] [ ] |

Each "Good Thing" you write belongs to one category. Tick a box when you use that category. If any row reaches 4 ticks in a single week, intentionally avoid that category for the rest of the week.

**Specificity Escalation Rule (Starts at Day 15):**
From day 15 onward: no person, place, or object may reappear in an entry with the same reason.
Your neighbor from the example can appear again -- but only if you name a completely different moment or reason. "My neighbor" as a category is not a repeat violation. "My neighbor returned my umbrella" written twice is.

**Week 4 Format Switch (Resets Hedonic Adaptation):**
On day 22, replace your 3GT+CA with a Gratitude Letter for one week. Choose one person who has positively affected your life -- not necessarily dramatically -- and write them a letter describing specifically what they did and how it changed you. You do not need to send it. This is a different cognitive and emotional format than item-listing and will refresh your attentional baseline. Return to 3GT+CA in week 5.

**Monthly Subtraction Prompt:**
On the last Sunday of each month, spend 5 minutes on this single question: "What would the past month have been like without [the thing that appeared most frequently in my entries]?" This activates appreciation for what you have been taking for granted even within the practice itself.

---

### Common Pitfalls and Fixes

| What You Notice | What Is Happening | What to Do |
|-----------------|-------------------|------------|
| Writing generic "good things" without specifics | The format is not working hard enough -- the causal analysis questions are being answered in 5 words | Go back to the template. "What caused this?" should take at least 2-3 sentences of real thought |
| Entries feel emotionally flat even when technically specific | The events being chosen are too neutral -- practical completions rather than moments that actually landed | Try using a prompt from the library. Prompts 7, 8, and 14 specifically target emotional resonance |
| You skipped 3 or more consecutive days | The morning anchor is breaking down -- something is disrupting the coffee ritual | Invoke MVV immediately: one mental good thing before getting out of bed, no writing. Reset the anchor the next morning |
| Entries all cluster in one category (usually Experience) | You are mining the most accessible memory structure without ranging across life domains | Use the rotation tracker. Force an Object entry and a Sense entry this week |
| Practice feels like it is fighting the anxiety rather than preceding it | The phone is being checked before the practice begins | The practice must happen before the phone. Physical notebook placement (on the coffee table, not the bedroom) is the environmental design fix |
| You feel guilty that your "good things" are small and ordinary | Implicit belief that the practice requires dramatic gratitude | Ordinary and small is exactly right. The lentil soup entry above is a model entry. The mechanism is noticing specifics, not having exceptional days |

---

### 30-Day Check-In Questions

Answer these on the morning of day 30, before writing your regular entry:

1. Read back your day 1-3 entries. What feels different about the specificity of your early entries versus your entries now?
2. Which category appears most in your tracker? Which appears least -- and why do you think that is?
3. Has the morning anxiety that prompted this practice shifted at all? Not eliminated -- shifted. Even slightly.
4. What is the one entry from this month that you most want to remember? Why that one?
5. What would the next 30-day version of this practice look like? Same format? Different time? Different frequency? One thing you would add?
