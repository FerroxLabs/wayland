---
name: journaling-mental-health
description: |
  Creates personalized mental health journaling practices using specific formats (mood tracking journal, gratitude log, cognitive reframing journal, stream-of-consciousness dump, prompt-based reflection). Gathers the user's goals and preferences, then produces journal templates, prompt sets, and a weekly journaling schedule.
  Use when the user asks about journaling for mental health, mood tracking journals, therapeutic writing, reflection prompts, or starting a journaling practice for emotional wellbeing.
  Do NOT use for clinical therapy journaling assignments, trauma processing writing, or journaling as a replacement for professional mental health support.
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
# Journaling Mental Health

> **Disclaimer:** This skill provides general wellness information for educational and self-awareness purposes only. It does NOT constitute medical advice, diagnosis, or treatment. Journaling is a complementary self-care practice -- it is not a substitute for professional mental health support. If you are experiencing a mental health crisis, persistent distress, or thoughts of self-harm, contact a licensed mental health professional or a crisis line immediately.

---

## When to Use

**Use this skill when:**
- A user wants to build a journaling practice specifically to support emotional awareness, stress management, mood tracking, or general psychological wellbeing
- A user asks about mood tracking journals, emotional check-ins, or identifying personal emotional patterns over time
- A user wants structured journaling prompts for self-reflection and wants guidance on which type fits their situation
- A user asks about cognitive reframing through writing -- challenging automatic negative thoughts using a written format derived from CBT (Cognitive Behavioral Therapy) principles
- A user describes feeling overwhelmed, mentally cluttered, or emotionally stuck and wants a non-clinical written practice to help process and release
- A user has tried journaling before but quit and wants a more sustainable, structured approach with lower-friction formats
- A user is starting therapy and wants a complementary self-awareness practice to carry between sessions (not a replacement for session work)
- A user wants to build gratitude, self-compassion, or growth-mindset habits through a daily writing practice

**Do NOT use when:**
- A user's therapist or counselor has assigned specific journaling exercises as part of a treatment plan -- those are clinically tailored and should not be overridden (refer back to their provider)
- A user wants to process a specific traumatic event through writing -- Trauma-focused writing (such as expressive writing protocols for PTSD developed by Pennebaker) requires clinical oversight and is outside this skill's scope
- A user is in acute emotional crisis -- journaling is not crisis intervention; direct them to emergency services or a crisis line first
- A user wants a creative writing, fiction, or storytelling journal -- use a creative writing skill instead
- A user asks about building a dedicated gratitude-only practice from scratch -- use `gratitude-practice-design` for deeper gratitude-specific frameworks
- A user wants a productivity or goal-setting journal (bullet journaling for tasks, GTD systems) -- those are task-management skills, not mental health skills
- A user needs clinical interpretation of their journal content or patterns -- never interpret entries as diagnostic indicators

---

## Process

### Step 1: Gather User Context With Targeted Questions

Before producing any template, collect the following information. Ask all of these if not already stated. Do not assume defaults.

- **Primary goal:** What is the main thing they want journaling to do for them? Options to probe: reduce stress, track and understand moods, challenge negative thinking, increase self-awareness, build emotional regulation, process daily events, cultivate gratitude and positive focus, or a combination.
- **Journaling history:** Have they journaled before? If yes, what format? Why did they stop? This determines whether to recommend a high-structure or low-structure approach.
- **Medium preference:** Handwritten (notebook or dedicated journal), digital (notes app, document, dedicated app), or voice-to-text. Content guidance applies across all mediums, but formatting suggestions differ.
- **Available time per session:** Under 5 minutes, 5-10 minutes, 10-15 minutes, or 15+ minutes. This is the single biggest determinant of which formats are realistic.
- **Time of day preference:** Morning (intention-setting, priming mindset for the day), midday (brief reset check-in), evening (reflection and wind-down), or flexible. Each timing creates different psychological functions.
- **Emotional style:** Are they naturally analytical (prefer structured questions and fields) or expressive (prefer open-ended, narrative, or free-form)? Mismatching style to format is the most common reason people abandon journaling.
- **Current stress or emotional context:** Are they going through a notably difficult period, or is this general wellness maintenance? This affects how gentle or exploratory to make the prompts.

### Step 2: Select the Right Journaling Format(s)

Choose 1 primary format and optionally 1 alternate format based on the user's goal, time, and emotional style. Never recommend more than 2 formats at the start -- format overload leads to abandonment.

**Format 1 -- Mood Tracking Journal**
- Structure: Date / Time of Entry | Mood Rating (1-10) | Primary Emotion (single word from the Feelings Wheel: e.g., frustrated, content, anxious, grateful) | Trigger Event (1-2 sentences: what happened right before this mood) | Body Sensation (where do you feel this in your body?) | Response Taken (what did you do or want to do?)
- Session time: 3-5 minutes
- Best for: Users who feel disconnected from their emotions, want to identify patterns, or are working on emotional awareness with a therapist
- Key differentiator: The Feelings Wheel is essential here -- "bad" or "stressed" are too vague for pattern recognition. Guide users toward specific secondary emotions (e.g., "overwhelmed" is more specific than "stressed"; "disappointed" is more specific than "sad")
- Pattern analysis trigger: After 2 weeks of entries, the user should look for: which emotions appear most frequently, which triggers repeat, and whether mood ratings cluster around specific days or times

**Format 2 -- Cognitive Reframing Journal (CBT-Informed)**
- Structure: Situation (factual, what happened) | Automatic Thought (the first thought that arose, in quotes) | Emotion + Intensity (0-100%) | Evidence Supporting the Thought | Evidence Against the Thought | Balanced Alternative Thought | Emotion After Reframing + Intensity (0-100%)
- Session time: 10-15 minutes
- Best for: Users who identify repetitive negative thinking, catastrophizing, or find themselves locked in mental loops about specific situations
- Key differentiator: This format is adapted from the CBT Thought Record (also called a Dysfunctional Thought Record). The 0-100% intensity scale is crucial -- it makes change visible and concrete. Users often experience a 10-20% drop in emotion intensity after completing the evidence columns even if the balanced thought feels forced
- Important constraint: This format should not be used on high-trauma content. If the situation involves a past traumatic event, recommend a different format and suggest speaking with a professional

**Format 3 -- Stream-of-Consciousness Dump (Expressive Writing)**
- Structure: None -- timed, unedited, unstructured writing. No rereading required or recommended immediately after.
- Session time: 5-10 minutes (Pennebaker's original research used 15-20 minutes over 3-4 consecutive days; for ongoing maintenance, 5-10 minutes is sufficient)
- Best for: Users who feel mentally cluttered, overwhelmed, or anxious and want to externalize mental noise rather than analyze it
- Key differentiator: The rule "do not reread immediately" is critical -- the goal is release, not rumination. If the user wants to reread, wait at least 24 hours. Research by James Pennebaker (University of Texas) shows that even 3 sessions of expressive writing produces measurable reductions in psychological distress and physical health markers
- Appropriate pairing: Best used on alternating days with a structured format, not as the sole practice for someone who wants to build long-term self-awareness

**Format 4 -- Prompt-Based Reflection Journal**
- Structure: One prompt at the top of the entry, followed by open-ended written response (5-15 sentences). No required fields.
- Session time: 5-10 minutes
- Best for: Beginners who face blank-page paralysis, or users who have been writing the same things repeatedly and need fresh angles
- Key differentiator: Prompt quality determines outcome quality. Weak prompts ("How do you feel today?") produce shallow entries. Strong prompts use specificity, hypotheticals, sensory detail, or time-shifting ("What would the version of you from 5 years ago think about what you handled today?")
- Prompt categories to rotate: self-compassion prompts, values clarification prompts, body awareness prompts, relationship prompts, future-self prompts, meaning-making prompts

**Format 5 -- Daily Check-In Template (Minimum Viable Journaling)**
- Structure: 3-5 fixed short-answer fields answered in 1-3 sentences each. No open-ended sections.
- Session time: 3-5 minutes
- Best for: Busy users, consistency-focused users, users who have repeatedly failed to maintain longer practices, or users who want the shortest sustainable habit
- Key differentiator: This is the "never miss twice" format. The goal is consistency over depth. Even a 3-minute daily check-in builds the neurological habit loop (cue-routine-reward) that makes longer practices possible later
- Standard fields: Date | Mood Score (1-10) | One Word for Today | What drained me | What energized me | One intention for tomorrow

### Step 3: Build the Specific Journal Template

For each selected format, produce:
- The exact blank template with labeled fields (not descriptions of fields -- actual usable fields)
- A fully completed example entry using realistic, specific content (not placeholder text)
- Any special instructions for that format (e.g., "Do not edit while writing" for the stream-of-consciousness format)
- A note on what to do if a particular field is difficult to complete (e.g., "If you cannot identify a body sensation, skip it -- this awareness develops over time")

### Step 4: Generate a 14-Prompt Library Calibrated to the User's Goal

Produce exactly 14 prompts organized by the user's stated goal and emotional style. Follow these quality standards for every prompt:

- **Specificity rule:** Every prompt must contain a specific angle that prevents a one-word answer. "What are you grateful for?" fails this test. "What happened in the last 24 hours that you would have missed if you had not been paying attention?" passes.
- **Variety rule:** No two consecutive prompts should target the same emotional domain. Rotate among: self-awareness, relationships, body/physical experience, meaning and values, past/future perspective shifts, and behavioral reflection.
- **Forward-orientation ratio:** At least 6 of 14 prompts should be forward-looking or strengths-based, not retrospective or problem-focused. This prevents the journal from becoming a daily complaint log.
- **Week 2 depth rule:** Prompts 8-14 should be slightly more introspective or challenging than prompts 1-7. Beginners need an on-ramp before they can engage with deeper self-inquiry.
- **Day 7 and Day 14 prompts:** Always use these slots for weekly review prompts that synthesize the week's entries.

### Step 5: Design the Weekly Schedule

Map journaling sessions to specific days and times based on the user's available schedule:

- **Beginners (never journaled or repeatedly quit):** 3 days per week. Never daily. Daily journaling has a 60-70% dropout rate in the first 3 weeks among people who have not established the habit before. Starting at 3 days allows the habit to consolidate without becoming a burden.
- **Intermediate users (occasional journaling, want more structure):** 4-5 days per week. Include one "format-free" day where they use any prompt they want.
- **Advanced users (regular journalers wanting refinement):** 5-7 days per week with format alternation to prevent staleness.
- **Anchor the habit:** Connect journaling to an existing daily anchor behavior -- after morning coffee, before getting into bed, after the evening meal. Habit stacking (pairing a new habit with an existing one) is the most reliable way to build consistency according to behavioral science research.
- **Sunday review:** Build a weekly synthesis session into the last journaling day of every week. This is where patterns become visible and self-awareness compounds.

### Step 6: Create the Getting Unstuck Guide

Produce a table of at least 5 specific obstacles and their solutions. This is not generic advice -- each solution must be specific to the journaling context.

Common obstacles with domain-specific solutions:
- Blank page paralysis -- specific intervention
- "Writing makes me feel worse" -- format switching protocol
- Skipped multiple days and feel like a failure -- re-entry protocol
- Writing the same entry every day -- format rotation trigger
- Running out of things to say mid-entry -- prompt rescue technique
- Journal feels like a chore or obligation -- re-motivation technique
- Concern about privacy (someone reading it) -- specific privacy solutions

### Step 7: Include Guidance on Knowing When to Seek Professional Support

Provide clear, non-alarmist language about signals that suggest journaling alone is not sufficient:
- Persistent themes of hopelessness or worthlessness appearing in entries over 2+ weeks without any change
- Entries that feel more distressing to write over time rather than less
- Inability to identify a single positive experience across 10+ consecutive entries despite trying
- Journaling begins to feel compulsive (the user feels they cannot cope without it as a coping mechanism and no other tools work)
- Any appearance of thoughts of self-harm or harming others

Frame this section as: "Journaling is working when..." and "Journaling may need a professional partner when..."

---

## Output Format

```
## Your Personal Journaling Practice

**Goal:** [user's stated goal in their own words]
**Primary Format:** [format name]
**Alternate Format:** [format name or "None for now"]
**Session Length:** [X] minutes
**Frequency:** [X] days per week
**Scheduled Days:** [specific days]
**Preferred Time:** [morning / evening / flexible]
**Medium:** [handwritten / digital / voice-to-text]

---

### Primary Template: [Format Name]

**What this format does:** [1-2 sentence explanation of the psychological function]

**Blank Template:**

**Date:** _______________
**[Field 1 Name]:** _______________
**[Field 2 Name]:** _______________
**[Field 3 Name]:** _______________
**[Field 4 Name]:** _______________
**[Field 5 Name]:** _______________

**Instructions for this format:**
- [specific instruction 1]
- [specific instruction 2]
- [specific instruction 3]

---

### Completed Example Entry

**Date:** [realistic sample date and day]
**[Field 1 Name]:** [specific, realistic example content -- not placeholder]
**[Field 2 Name]:** [specific, realistic example content]
**[Field 3 Name]:** [specific, realistic example content]
**[Field 4 Name]:** [specific, realistic example content]
**[Field 5 Name]:** [specific, realistic example content]

---

### [Alternate Format Name, if selected]

**Blank Template:**
[fields or structure]

**Example Entry:**
[completed example]

---

### 14-Day Prompt Library

*Use these on any day you want fresh material, or on days when the template feels repetitive.*

| Day | Focus Area | Prompt |
|-----|------------|--------|
| 1   | [focus area] | [specific, complete prompt] |
| 2   | [focus area] | [specific, complete prompt] |
| 3   | [focus area] | [specific, complete prompt] |
| 4   | [focus area] | [specific, complete prompt] |
| 5   | [focus area] | [specific, complete prompt] |
| 6   | [focus area] | [specific, complete prompt] |
| 7   | Weekly Review | [synthesis prompt covering the week] |
| 8   | [focus area] | [specific, complete prompt] |
| 9   | [focus area] | [specific, complete prompt] |
| 10  | [focus area] | [specific, complete prompt] |
| 11  | [focus area] | [specific, complete prompt] |
| 12  | [focus area] | [specific, complete prompt] |
| 13  | [focus area] | [specific, complete prompt] |
| 14  | Weekly Review | [synthesis prompt covering both weeks] |

---

### Weekly Schedule

| Day | Time | Format | Duration | Notes |
|-----|------|--------|----------|-------|
| [Day 1] | [time] | [format] | [X] min | [anchor habit note] |
| [Day 2] | [time] | [format] | [X] min | [note] |
| [Day 3] | [time] | [format or prompt] | [X] min | [note] |
| [Day N] | [time] | Weekly Review + [format] | [X] min | Synthesis session |

**Habit Anchor:** Attach journaling to [existing daily behavior] to make it automatic.

---

### Weekly Review Questions
*Answer these on your final journaling day each week (after your regular entry):*

1. [specific synthesis question about the week's entries]
2. [specific pattern-identification question]
3. [specific forward-looking intention question]

---

### Getting Unstuck

| Problem | Specific Solution |
|---------|-------------------|
| [obstacle 1] | [specific fix with instructions] |
| [obstacle 2] | [specific fix with instructions] |
| [obstacle 3] | [specific fix with instructions] |
| [obstacle 4] | [specific fix with instructions] |
| [obstacle 5] | [specific fix with instructions] |

---

### How to Know Your Practice Is Working

**Journaling is helping when:**
- [specific positive signal]
- [specific positive signal]
- [specific positive signal]

**Consider adding professional support when:**
- [specific signal -- non-alarmist, practical]
- [specific signal]
- [specific signal]

*Journaling works best as a self-awareness tool alongside human support -- professional or personal.*
```

---

## Rules

1. **Never use diagnostic language.** Do not use terms like "depression," "anxiety disorder," "PTSD," "OCD," or "bipolar" when discussing a user's entries, patterns, or emotional states. The skill operates in the wellness space, not the clinical space. Use descriptive language ("persistent low mood," "recurring worry," "difficulty winding down") rather than clinical labels.

2. **Always provide a fully completed example entry for every template.** An empty template without a completed example causes blank-page paralysis at first use. The example must use realistic, specific content -- not placeholder text like "[describe your emotion here]." Seeing what a good entry looks like is the most effective onboarding tool.

3. **Never recommend daily journaling to a beginner.** Start at 3 days per week. Daily journaling creates a high compliance demand that leads to shame spirals when sessions are missed, which paradoxically causes complete abandonment. The research on habit formation (BJ Fogg's Tiny Habits methodology) is clear: start smaller than feels necessary, then scale up only after the habit stabilizes across 3-4 weeks.

4. **Match format to emotional style, not just goal.** A user who is analytical and wants to reduce stress should get the Daily Check-In or Cognitive Reframing format -- not the Stream-of-Consciousness Dump, which feels uncomfortably unstructured for analytical thinkers. A user who is expressive and wants to track moods might do better with narrative mood entries than a pure 1-10 rating scale. Always ask about emotional style before selecting formats.

5. **Prompt quality is non-negotiable.** Every prompt must contain a specific constraining angle that forces concrete thinking. Test each prompt against this standard: "Can this be answered with one word or a vague statement?" If yes, it is too weak. Strong prompts use time constraints ("in the last 48 hours"), hypotheticals ("if you could change one thing"), sensory detail requests ("what did your body do when"), or perspective shifts ("what would a trusted friend say about").

6. **The Cognitive Reframing format must include explicit use of the 0-100% intensity scale.** Emotion intensity before and after is what makes CBT-style journaling work. Without the intensity measurement, users cannot perceive change and abandon the format as "not doing anything." The measurable drop in intensity -- even a shift from 80% to 65% -- creates the evidence that the practice is working.

7. **Never instruct users to use their journal entries to self-diagnose or identify their own mental health conditions.** Journaling produces raw emotional data. Translating that data into diagnostic conclusions requires clinical training. Instruct users to notice patterns (e.g., "the same trigger appears 3 times this week") not to interpret them clinically (e.g., "this means you have social anxiety").

8. **Include the Getting Unstuck section in every output, with at least 5 specific obstacles.** Privacy concerns (fear of someone reading the journal) are the most commonly overlooked obstacle and must always be addressed. Generic advice ("just write!") does not solve specific obstacles. Each solution must be actionable in the next 24 hours.

9. **Always specify a habit anchor in the weekly schedule.** A journaling session without an anchor to an existing behavior has a dramatically lower adherence rate. The anchor should be specified as an existing behavior the user already performs: "after your evening tea," "before checking your phone in the morning," "after brushing your teeth." Never schedule journaling as a standalone time block with no behavioral anchor.

10. **Include the "How to Know Your Practice Is Working" section in every output.** Users need both positive signals (reinforcement that the practice is helping) and clear thresholds for when to seek professional support. Frame the professional support threshold gently but clearly: persistent distress that journaling does not ease -- themes of hopelessness, worthlessness, or self-harm appearing in entries over 2+ consecutive weeks -- warrants a conversation with a licensed mental health professional. Never present this as alarming; present it as a natural and sensible next step.

---

## Edge Cases

### The User Has Tried Journaling Multiple Times and Always Quits
This is a format mismatch problem in most cases, not a willpower or motivation problem. Ask specifically: "What format were you using when you quit?" and "What made you stop -- was it time pressure, not knowing what to write, feeling like it wasn't doing anything, or something else?" Map each answer to a diagnosis:
- "I didn't know what to write" -- prescribe the Prompt-Based Reflection format and provide all 14 prompts upfront
- "It took too long" -- prescribe the Daily Check-In Template (3 minutes maximum) and reinforce that brevity is a feature, not a compromise
- "It felt like it wasn't doing anything" -- prescribe the Mood Tracking format with the weekly review, which produces visible data within 7 days
- "I missed a few days and gave up" -- emphasize the "never miss twice" rule and reduce frequency to 2 days per week initially

Never prescribe the same format they previously quit. The psychological barrier to trying a format that failed before is higher than starting something genuinely new.

### The User Reports That Writing About Emotions Makes Them Feel Worse
This is a documented phenomenon called "co-rumination" -- using journaling to rehearse negative thoughts rather than process them. Indicators include: entries that get longer and more detailed about negative events over time, entries that always end at the same negative conclusion, or the user reporting they feel more distressed after writing than before.

Intervention protocol:
1. Immediately discontinue the Cognitive Reframing format, which requires dwelling on negative thoughts in detail
2. Switch to the Stream-of-Consciousness Dump with the explicit instruction NOT to reread the entry
3. Add a mandatory closing ritual to every entry: the last 2-3 sentences of every session must describe something present, concrete, and neutral or positive ("Right now I am sitting in my living room. The lamp is on. The room is quiet.")
4. Shift the prompt library to 100% forward-looking or sensory-present prompts for the next 2 weeks
5. If writing consistently increases distress even after these format changes, instruct the user to pause journaling and consult a licensed mental health professional before resuming

### The User Wants to Track Mood Patterns Analytically and Visualize Trends
This user typically has a data-oriented personality and responds better to numbers and patterns than narrative. Serve this need specifically:
- Recommend the Mood Tracking Journal format as primary
- Suggest a simple supplementary tracking method: a mood log table in a spreadsheet with columns for Date, Mood Score (1-10), Primary Emotion, and one-word Trigger category
- After 2 weeks, they can calculate: average mood by day of week, most frequent emotion categories, most frequent trigger categories, and correlation between specific triggers and lowest mood scores
- Note that this is descriptive self-awareness data, not clinical analysis. The goal is to notice "my mood is consistently lower on Sunday evenings and Monday mornings, and the trigger category is 'work'" -- not to diagnose what that means clinically
- Recommend they share interesting patterns with a therapist if they have one, as the data can accelerate therapy work

### The User Has a Therapist and Wants a Complementary Practice
Frame the journaling practice explicitly as "between-session support" not as a replacement for therapy. Practical guidance:
- Recommend the Prompt-Based Reflection format or Cognitive Reframing format, as these tend to surface material useful in therapy sessions
- Suggest the user bring 1-2 journal entries or observations to each therapy session, rather than summarizing everything verbally
- Do NOT suggest the user bring all entries -- this can create dependency on sharing every entry rather than using it for personal processing
- Advise the user to tell their therapist they are journaling, and ask if the therapist has specific formats or prompts they prefer. If the therapist's recommendations conflict with this skill's output, defer to the therapist's guidance entirely
- Avoid prompts that dig into specific past traumatic events without the therapist's knowledge -- keep prompts anchored in recent experiences (last 1-7 days) unless the therapist has specifically suggested historical exploration

### The User Is Concerned About Privacy (Fear of Someone Reading the Journal)
This is one of the most underaddressed barriers to journaling and one of the most common reasons people write vaguely or stop entirely. Practical solutions by medium:
- **Digital:** Use a notes app or document with password protection or device-level biometric lock. Apps with specific journal privacy features (passcode entry, no cloud backup) can be useful. Alternatively, write in a locked folder on a device only they access.
- **Handwritten:** Keep the journal in a private location. Some users prefer to tear out and destroy entries they do not want to keep -- this is entirely valid and does not undermine the practice. Writing and then discarding is still writing.
- **Alternative framing:** Some users write in intentionally vague or coded language when privacy is a concern. This is a valid adaptation but may reduce the depth of self-reflection. If safety is a genuine concern (e.g., user lives with someone controlling or abusive), recommend digital options with no visible app icon or passcode-protected apps before anything else.
- Never dismiss privacy concerns as irrational -- for some users, the risk of someone reading their journal is real and significant.

### The User Is Going Through an Acute Life Stressor (Breakup, Job Loss, Grief, Major Illness)
Adjust the practice for high-emotional-load periods:
- Reduce required frequency. If they were doing 4 days per week, drop to 2 during the acute period. Compliance under stress is harder; failure creates shame; shame stops the practice entirely.
- Do NOT recommend the Cognitive Reframing Journal during acute grief or loss. Requiring someone in acute grief to write "evidence against my thought that things will never get better" is invalidating. The Stream-of-Consciousness Dump or Prompt-Based Reflection with self-compassion prompts is appropriate.
- Include prompts from the self-compassion domain: "What would I say to a close friend going through exactly what I am going through right now?" "What does my body need today that it hasn't gotten?" "What have I managed to do today despite how hard things feel?"
- Explicitly state that the journaling practice may need to pause entirely during periods of acute crisis, and that pausing is not failure -- it is appropriate self-care.

### The User Is a Teenager or Young Adult (Under 21)
The core formats and methodologies apply equally to younger users, but several adaptations improve fit:
- Use voice-to-text or digital formats by default -- younger users are dramatically less likely to sustain handwritten practices
- The Prompt-Based Reflection format is typically most effective for this age group due to lower self-reflective experience
- Avoid the Cognitive Reframing Journal for users under 16 without parental or therapeutic context -- the level of metacognitive abstraction required (examining and questioning one's own thoughts) requires a developmental baseline that varies significantly in adolescence
- Adjust prompt language to feel less clinical: "What made you feel like yourself today?" instead of "What felt authentic to your values today?"
- Include social and peer-relationship domains in the prompt library, as these are primary drivers of adolescent emotional experience

---

## Example

**Input:** "I've been really anxious lately -- not clinically diagnosed or anything, just a lot of racing thoughts at night. I've tried journaling before but I always stop after a week because I don't know what to write. I have about 10 minutes before bed and I prefer structure to free writing. I've never been consistent with anything like this."

**Analysis before output:**
- Goal: Reduce nighttime racing thoughts and cognitive overload; improve sleep onset
- History: Repeated attempts, quit due to blank-page paralysis -- classic format mismatch
- Time: 10 minutes, evening (pre-sleep -- ideal for reflective wind-down)
- Style: Structured preferred, free-form fails for this user
- Primary format: Daily Check-In Template (structured, low-friction, 5 minutes) plus Prompt-Based Reflection as alternate (solves blank-page problem)
- Do NOT use Cognitive Reframing (too cognitively demanding right before sleep; can increase rumination)
- Frequency: 3 days per week to start -- never daily for a self-described non-consistent user

---

**Output:**

## Your Personal Journaling Practice

**Goal:** Reduce nighttime racing thoughts and create mental closure at end of day
**Primary Format:** Daily Check-In Template
**Alternate Format:** Prompt-Based Reflection (use when check-in feels repetitive)
**Session Length:** 10 minutes
**Frequency:** 3 days per week to start (expand to 4-5 after 3 weeks if it's feeling easy, not before)
**Scheduled Days:** Monday, Wednesday, Sunday
**Preferred Time:** Evening, 20-30 minutes before getting into bed
**Medium:** Structured template (handwritten or digital -- same content either way)

---

### Primary Template: Daily Check-In

**What this format does:** Creates mental closure at end of day by externalizing the day's events and emotional residue into a structured form. Getting thoughts out of your head and onto paper reduces the cognitive load your brain carries into sleep, which directly supports falling asleep faster.

**Blank Template:**

**Date:** _______________
**Today's mood score (1-10):** _____ 
**One word that describes today:** _______________
**The moment that took the most mental energy today:** _______________
**One thing I handled reasonably well (even if imperfectly):** _______________
**One thing I'm carrying into tomorrow that I want to set down for tonight:** _______________
**Tomorrow's one small intention:** _______________

**Instructions for this format:**
- Write in the same physical or digital location every time. Consistency of place strengthens the habit loop.
- Keep every field to 1-3 sentences maximum. This is not a comprehensive diary -- it is a mental clearing mechanism. Length is not the goal.
- The "set down for tonight" field is a deliberate cognitive technique: writing down an unresolved concern signals to your brain that the thought has been captured and does not need to be actively held. This is a concrete technique from sleep research on "scheduled worry" -- externalizing concerns before sleep reduces their intrusion during sleep onset.
- Do not judge or edit. Write the first thing that comes to mind for each field.

---

### Completed Example Entry

**Date:** Wednesday, Week 1
**Today's mood score (1-10):** 5
**One word that describes today:** Fragmented
**The moment that took the most mental energy today:** My manager pulled me into an unplanned meeting at 4pm to review a report I hadn't finished yet. I spent the hour before it trying to prepare and kept second-guessing every number in the document.
**One thing I handled reasonably well (even if imperfectly):** I told my manager honestly that I had two sections still to complete and asked for 24 more hours. She said that was fine. The conversation I had dreaded for an hour lasted 3 minutes.
**One thing I'm carrying into tomorrow that I want to set down for tonight:** Whether I said the right things in that meeting. I've written it down here. It's captured. I don't need to keep turning it over tonight.
**Tomorrow's one small intention:** Start the workday with the two unfinished report sections before opening email.

---

### Alternate Template: Prompt-Based Reflection

**What this format does:** Replaces blank-page paralysis with a specific question that guides the entire entry. Use this on any scheduled journaling day when the check-in template feels repetitive or you want to go deeper.

**Blank Template:**

**Date:** _______________
**Today's prompt:** [choose from the library below or use any prompt from the 14-day list]
**My response:**
[Write for 5-8 minutes in response to the prompt. No structure required. Just follow the question wherever it takes you.]
**One sentence to close:** [Write one sentence that summarizes or concludes your thoughts.]

**Example Entry:**

**Date:** Sunday, Week 1
**Today's prompt:** What is one thing you have been worrying about this week that, if you are honest with yourself, you have very little actual control over?
**My response:**
The main thing is whether the project my team submitted will get approved by the leadership committee next week. I've spent probably 4 hours this week mentally rehearsing what I'll say if they reject it, preparing counterarguments, imagining worst-case scenarios. When I actually think about it right now, I've done everything I can do -- the work was solid, we presented it well, and the rest is genuinely out of my hands. The committee will do what they do. The anticipatory worry is creating a lot of noise in my head that isn't producing any useful information or action. I think I keep returning to it because uncertainty feels unsafe and mental preparation feels like control, even when it isn't really control.
**One sentence to close:** I've prepared as well as I can; the outcome belongs to the process, not to more hours of mental rehearsal tonight.

---

### 14-Day Prompt Library

*Use these on any scheduled journaling day instead of or after the check-in template.*

| Day | Focus Area | Prompt |
|-----|------------|--------|
| 1 | Self-Awareness | What was one moment today when you felt your body tense up or brace? What was happening right before it? |
| 2 | Behavioral Reflection | What is one thing you said yes to this week that you wished you had said no to -- and what made it hard to decline? |
| 3 | Body Awareness | Where in your body do you tend to carry stress? What does it feel like right now as you sit here? |
| 4 | Relationships | Who did you feel most like yourself around in the last 7 days? What was it about that interaction? |
| 5 | Strengths | What is one situation from this week where you managed something difficult without realizing it in the moment? |
| 6 | Values | If this week had a theme -- something your choices and reactions kept circling back to -- what would that theme be? |
| 7 | Weekly Review | Look back at your entries from this week. What emotion appeared most often? What triggered it most consistently? What does that tell you about what matters to you right now? |
| 8 | Future Self | What would a version of you who is sleeping well and feeling calm be doing differently on a typical Tuesday evening? |
| 9 | Gratitude -- Specific | What happened in the last 48 hours that you would have missed if you had not been paying attention? |
| 10 | Perspective Shift | What is the most stressful thing on your mind right now? What will be true about it in 6 months -- will it still feel this large? |
| 11 | Self-Compassion | What have you expected of yourself this week that you would never expect of a close friend going through the same circumstances? |
| 12 | Meaning | What is one small thing you do regularly that, if you had to explain to someone else why it matters, you could articulate clearly? |
| 13 | Behavioral Intention | What is one specific, small thing you could do tomorrow that would make tomorrow's evening check-in entry slightly easier to write than tonight's? |
| 14 | Weekly Review | Looking at the past two weeks of entries together: what is the most common "mental energy drain" you identified? What would it look like to reduce it by even 20% in the coming week? |

---

### Weekly Schedule

| Day | Time | Format | Duration | Habit Anchor |
|-----|------|--------|----------|--------------|
| Monday | Evening | Daily Check-In | 5-7 min | After brushing teeth, before getting into bed |
| Wednesday | Evening | Daily Check-In or Prompt (your choice) | 8-10 min | After brushing teeth, before getting into bed |
| Sunday | Evening | Prompt-Based Reflection + Weekly Review | 10 min | After any wind-down activity (tea, shower, reading) |

**Habit Anchor:** After brushing your teeth at night is the most effective anchor for this user profile -- it is already a nightly consistent behavior with a clear endpoint, and the physical transition (bathroom to bed area) reinforces that journaling is part of the wind-down sequence, not an additional task.

**Frequency note:** Three days per week is deliberate. When you have gone 4 consecutive weeks without missing a scheduled session, add a fourth day (Thursday works well as a midweek check-in). Do not add the fourth day before 4 weeks.

---

### Weekly Review Questions
*Answer these on Sunday after your regular entry:*

1. Look at your mood scores across this week's entries. What is the range (highest score to lowest score)? What was happening on the lowest-score day?
2. Did the same stressor, worry, or theme appear in more than one entry this week? Name it specifically.
3. What is one concrete thing -- even very small -- you will do differently in the next 7 days based on what you noticed this week?

---

### Getting Unstuck

| Problem | Specific Solution |
|---------|-------------------|
| "I stare at the blank template and nothing comes" | Open the 14-day prompt library, pick any prompt you have not used, and write your response to it for exactly 5 minutes. The check-in template is optional -- any writing counts. |
| "I missed 2 weeks and now starting again feels weird" | Write tonight. Write one sentence for each field if a full entry feels too hard. "I haven't written in two weeks. Tonight was hard. My mood score is 4. That's enough for tonight." Streaks are not the goal -- return is the goal. |
| "Every entry sounds exactly the same -- same stressor, same mood score" | Switch to the prompt-based format for 2-3 consecutive sessions using the perspective-shift or future-self prompts (Days 8 and 10 in the library). Same-entry repetition means the check-in fields are no longer surfacing new information -- a different question angle will. |
| "Writing about my racing thoughts right before bed makes my mind more active, not less" | Move journaling to 60 minutes before bed instead of 20 minutes before. If the window is right before sleep, try reducing the entry to 3 fields only: mood score, one thing I'm setting down for tonight, and tomorrow's intention. Under-stimulating entries wind the brain down; over-analytical entries can wind it up. |
| "I'm worried someone in my house will read it" | For digital journaling, use a notes app with biometric lock (fingerprint or face ID) and turn off any preview notifications. For handwritten, keep the journal in a bag or drawer with a physical cover that does not label its contents, or write entries on loose paper and discard each one after writing -- the benefit comes from the act of writing, not from keeping the archive. |
| "I feel guilty if I skip a scheduled day" | Guilt means the practice has become a source of self-criticism rather than self-support. That is the opposite of the goal. When you skip a day, write one sentence at any point in the next 24 hours: "I skipped yesterday. Tonight I'm at a [X] mood. Tomorrow I'll try again." One sentence resets the habit without making the missed session larger than it is. |

---

### How to Know Your Practice Is Working

**Journaling is helping when:**
- You notice you are identifying specific emotions (frustrated, disappointed, relieved) rather than just "stressed" or "bad" after 2-3 weeks -- this is emotional vocabulary expanding, which is a real and measurable benefit
- The "carrying into tomorrow" field becomes easier to write over time because you are getting better at naming what is actually bothering you
- You begin to notice recurring patterns without actively trying to -- a specific day of the week, a specific type of interaction, or a specific time of day that consistently produces a lower mood score
- You reach for the journal on a hard day because it genuinely helps, not only because you scheduled it

**Consider bringing a professional into your support picture when:**
- You have been writing for 3+ weeks and entries consistently end in the same place of hopelessness, with no sense of movement or relief
- The racing thoughts you are trying to manage at night are significantly affecting your sleep, work, or daily functioning over multiple weeks, despite a consistent journaling practice
- You notice themes of worthlessness, self-harm, or persistent inability to find any positive material across 10 or more consecutive entries
- The journal begins to feel like the only thing that keeps you functional -- if it feels compulsive rather than supportive, that is a signal to speak with a licensed mental health professional

*A good therapist will welcome knowing you journal. The self-awareness you build here makes every form of professional support more effective -- it is not a replacement, it is a foundation.*
