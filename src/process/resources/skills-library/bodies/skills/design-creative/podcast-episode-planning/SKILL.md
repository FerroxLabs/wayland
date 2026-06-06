---
name: podcast-episode-planning
description: |
  Produces a complete podcast episode brief with episode thesis, guest briefing,
  segment structure with timing, transition language, show notes template, and
  SEO-optimized episode description. Use when the user asks to plan a podcast
  episode, structure a podcast recording session, or create an episode outline.
  Do NOT use for interview-specific question preparation (use
  podcast-interview-guide), audio post-production settings (use
  audio-editing-guide), or video podcast storyboarding (use video-storyboard).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "podcast planning template"
  category: "design-creative"
  subcategory: "video-audio"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Podcast Episode Planning

## When to Use

Use this skill when any of the following conditions apply:

- The user wants to plan a complete podcast episode from scratch -- including format, segment breakdown, timing, and a guest document to share before recording
- The user needs to structure a recording session with specific time allocations so the episode does not run long or short
- The user wants to create an episode brief that can be handed to a co-host, guest, producer, or editor so everyone enters the recording with shared context
- The user needs show notes, timestamp outlines, or a podcast directory description written for a specific episode
- The user has a topic, a guest name, and a target length but does not yet know what argument the episode should make or how to sequence the content
- The user is launching a new podcast and wants a reusable episode structure they can apply to every episode consistently
- The user wants to plan a serialized or multi-part episode with explicit continuation hooks
- The user needs to plan a sponsored episode and must integrate ad placement timing into the segment structure

Do NOT use this skill in the following situations:

- The user needs a detailed question-by-question interview script with follow-up branches and probing techniques -- use `podcast-interview-guide` instead
- The user needs audio export settings, loudness normalization targets (LUFS), EQ chains, or post-production instructions -- use `audio-editing-guide` instead
- The user is planning a video podcast and needs camera angles, B-roll cues, or visual storyboard elements -- use `video-storyboard` instead
- The user needs a full content calendar for a podcast season or series -- this skill plans one episode at a time; a content calendar skill is more appropriate for series planning
- The user only needs an SEO title and description with no structural planning -- a standalone SEO copywriting skill is more efficient
- The user needs a podcast launch checklist covering feed setup, cover art, hosting platforms, and distribution -- that is a production operations task outside this skill's scope

---

## Process

### Step 1: Gather and Validate Episode Inputs

Collect all required inputs before producing any output. Missing a single input will produce a structurally incomplete brief.

- **Podcast name and established format:** solo, co-hosted, interview, panel, narrative/documentary. Format determines how many voices need introduction and whether you need a guest briefing section.
- **Episode topic vs. episode angle:** the topic is the subject area (e.g., "developer burnout"); the angle is the specific entry point ("why high performers burn out faster than average performers, and what managers miss about this"). You need the angle, not just the topic. If the user only provides a topic, prompt them: "What is the specific claim, finding, or story this episode will make about that topic?"
- **Target episode length in minutes:** this is the post-edit target, not the raw recording target. If the user wants a 30-minute episode, the recording session should run 40-50 minutes to allow for editing. Note this in the brief.
- **Guest name, title, and primary domain of expertise** (for interview and panel formats): this allows the guest briefing to be specific rather than generic.
- **Target listener profile:** not just demographics, but the specific question the listener brings to this episode. A product manager asking "how do I get my engineers to ship faster?" is different from an engineer asking "how do I stop being the bottleneck?" Same topic, completely different episode framing.
- **The single listener takeaway:** ask the user to complete this sentence: "After this episode, a listener will be able to ____." The answer should be a concrete behavior, belief, or capability -- not a vague state of awareness.
- **Monetization context:** does this episode have a sponsor mid-roll? Is there a product promotion embedded? This affects segment timing and requires placeholder ad break slots in the structure.

---

### Step 2: Develop the Episode Thesis

The thesis is the most important structural decision in episode planning. Everything else -- segment sequence, guest questions, the cold open hook -- is in service of the thesis.

- A thesis is a specific, arguable claim. It is not the topic and it is not a question. "Code reviews are ineffective" is a topic observation. "Code reviews fail because engineers review for compliance rather than comprehension, and fixing this requires changing the reviewer's job, not their speed" is a thesis.
- Apply the **disagreement test**: could an intelligent, informed person reasonably disagree with this thesis? If not, sharpen it. "Remote work has tradeoffs" fails the test. "Remote-first teams outperform hybrid teams not because of flexibility but because remote-first forces explicit communication that hybrid teams assume they do not need" passes the test.
- Apply the **novelty test**: does this thesis tell the listener something they do not already know, or does it confirm a belief they already hold with better evidence? Both are valid, but they produce different episode structures. The novelty thesis requires a reframe moment in Segment 1. The confirmation thesis requires evidence density and actionability in Segments 2 and 3.
- Write the thesis before designing segments. If you cannot write a one-sentence thesis, the episode topic is not scoped tightly enough. Push back and ask the user to narrow.
- For narrative/documentary formats, the thesis is replaced by a **story spine**: "In the world of [context], [protagonist] wants [goal], but [obstacle], until [turning point], and finally [outcome/lesson]. The lesson is [thesis]."

---

### Step 3: Design the Segment Structure with Precise Timing

Segment design is where most podcast episodes either succeed or fail. Vague segments produce rambling recordings; over-scripted segments produce stilted performances. The goal is a structure tight enough to keep the episode on track and loose enough to allow genuine conversation.

- **Cold open (0:30 to 0:60):** A direct excerpt, quote, or scene from later in the episode. The cold open is a promise -- it shows the listener the best thing they will hear if they stay. For interview episodes, use a verbatim guest quote that surprises or provokes. For solo episodes, state the most counterintuitive claim in the episode as a direct address. Do NOT use the cold open to introduce yourself, your podcast name, or the episode title -- that comes in the intro.
- **Intro (1:00 to 2:00):** Theme music cue, podcast name, episode number, host name. One-sentence episode preview that is NOT the thesis stated plainly -- it is the thesis framed as a question or tension. Guest introduction for interview formats: one professional credential + one personal detail that signals why they specifically belong on this show. Total intro length must not exceed 2 minutes; listeners skip long intros.
- **Segment 1 -- Setup/Problem (10-15% of target length):** Establish the shared context. What does the listener already believe about this topic? What has gone wrong, what is broken, or what is the tension the episode will resolve? This segment should create a small amount of productive discomfort -- the listener should feel that their current understanding is incomplete.
- **Segment 2 -- Core Content/Argument (40-50% of target length):** The thesis is examined, tested, and supported here. For interview episodes, this is the majority of the conversation. For solo episodes, this is where the framework, framework evidence, and counterarguments live. For narrative episodes, this is the rising action and turning point. This segment should be further broken into 2-3 sub-beats: the claim, the evidence, the "yes, but" (a steel-manned counterargument), and the "and furthermore" (the implication the listener has not considered).
- **Segment 3 -- Application/Resolution (20-25% of target length):** What does the listener do with what they just heard? This is where frameworks, tools, step-by-step processes, or personal reflection prompts live. Avoid vague advice ("think about this differently"). Provide a specific action, a decision framework, or a concrete next step that can be taken within 48 hours.
- **Sponsor/Ad Break (1:00 to 2:00 per break):** If the episode has sponsors, place pre-roll ads between the cold open and the intro. Place mid-roll ads at the transition between Segment 1 and Segment 2 -- this is the highest-retention moment in the episode structure. Post-roll (after the outro CTA) is low value; most listeners have already exited.
- **Outro (1:30 to 2:30):** Restate the thesis in one new sentence (not word-for-word from the intro). Issue one primary call to action -- subscription, newsletter, course, or community link. Do NOT issue more than two CTAs in the outro; listener action rate drops sharply with each additional ask. Tease the next episode with one concrete detail about the topic or guest.

Assign timestamps in M:SS format from 0:00. Every segment must have a start time, and the final segment's end time must equal the target episode length within 90 seconds.

---

### Step 4: Write Transition Language

Transition language is the connective tissue of the episode. Weak transitions produce a choppy listening experience; strong transitions make the episode feel like a single, building argument rather than a list of topics.

- Write transitions as **exact phrases**, not descriptions. "Host pivots to the solution" is not a transition -- "Okay, so we know why this is broken. What I want to know is what actually fixes it" is a transition.
- Each transition should do three things: (1) briefly signal that the previous segment is complete ("so we have established that X"), (2) create forward momentum toward the next segment ("but what I have not told you yet is Y"), (3) give the listener a micro-preview of what is coming.
- For interview episodes, transitions between topics should be written as pivot questions that feel like a natural escalation, not an abrupt change. The pivot question should acknowledge what the guest just said before moving forward: "What you said about X is interesting because it implies Y -- is that actually what you see happening?"
- For solo episodes, transitions can include a pattern interrupt: a rhetorical question, a brief silence cue noted as "[PAUSE -- 2 seconds]", or a restatement of the thesis with one word changed to create a twist.
- The cold-open-to-intro transition is the most important single transition in the episode -- it must make the listener feel they have already invested and must stay to hear the full version of that cold open moment.

---

### Step 5: Create the Guest Briefing (Interview and Panel Formats)

A guest briefing is not a full question list. Its purpose is to reduce anxiety, set technical expectations, and give the guest enough context to prepare the right story -- without scripting the conversation so tightly that it loses spontaneity.

- **What to include:** the episode thesis (one paragraph), three to five questions the guest should expect (not all questions -- the discovery questions are reserved for the recording), specific preparation requests (one story, one data point or statistic, one actionable tip), and all technical requirements.
- **Technical requirements must be specific:** the recording platform (Riverside.fm, Squadcast, Zencastr, or Zoom with local recording enabled), the microphone recommendation (USB dynamic such as the Audio-Technica ATR2100x or the SM58 equivalent, or wired earbuds as a minimum), room environment guidance ("sit in a room with soft surfaces -- bedroom or office with bookshelves works; avoid kitchens, bathrooms, or rooms with hard parallel walls"), and the exact scheduled date, time with timezone, and expected recording duration.
- Add a "what NOT to prepare" note: guests frequently over-prepare and then deliver rehearsed answers that kill conversational energy. Tell the guest explicitly: "Do not prepare a complete narrative from start to finish. We want your honest, unscripted reactions."
- For panel discussions with three or more guests, each guest receives a briefing tailored to their specific area: do not send the same document to all panelists. Include a note about who the other panelists are and what angle they are covering, so each panelist can mentally position their own contribution.

---

### Step 6: Write the Show Notes

Show notes serve two audiences simultaneously: the listener who wants to revisit a reference, and the search engine that will surface the episode to new listeners. Both audiences need to be served by the same text without compromising either.

- **Episode title:** the show notes title must match the audio file metadata title exactly. Use sentence case, not title case for consistency with directory formatting (Apple Podcasts and Spotify both display titles in whatever case is submitted).
- **Summary paragraph:** two to three sentences. Sentence 1: what the episode is about and who is in it. Sentence 2: the central argument or most valuable insight. Sentence 3: what the listener will be able to do or understand after listening. This is not a teaser -- it is a complete, spoiler-inclusive description that helps the right listener decide to listen.
- **Timestamps:** every topic shift and every named resource deserves a timestamp. Use M:SS format up to 59:59, then H:MM:SS format. The minimum useful timestamp set for a 30-minute episode is six timestamps. For episodes over 45 minutes, aim for a timestamp every 5-7 minutes.
- **Resources mentioned:** include every book, tool, framework, concept, or person named in the episode. This section is the highest-engagement section of show notes -- listeners frequently return to show notes specifically to find this list.
- **Guest bio and links:** a one-paragraph bio written in third person. Include the guest's primary website or landing page, their most relevant social handle (usually LinkedIn or Twitter/X for professional podcasts), and any specific resource they mentioned during the recording (their book, course, newsletter).
- **Transcript availability note:** if a transcript will be published, include a placeholder line. Transcripts dramatically improve both accessibility and search indexing. Full transcripts should be published on the episode page, not embedded in the show notes text.

---

### Step 7: Write the SEO Episode Description

The podcast directory description (Apple Podcasts, Spotify, Overcast, Pocket Casts) is the primary discovery text for new listeners. It must simultaneously rank for relevant keywords and convert a browsing listener into a pressing-play listener.

- **Hard length limit is 4,000 characters** for Apple Podcasts and Spotify. However, only the first 110-180 characters display without a "more" tap on mobile -- treat the first sentence as a standalone meta-description that must work alone.
- The first sentence must contain the primary keyword phrase and a hook. The primary keyword phrase is typically the topic + the specific angle: "code review knowledge transfer" not just "code reviews." The hook is a surprising claim, a provocative question, or a clear promise of utility.
- **Keyword strategy:** include the primary keyword phrase once in the first sentence and once more in the body. Include two to three secondary keyword phrases naturally in the text. Do NOT keyword-stuff -- Apple and Spotify both penalize for it, and listeners will abandon a description that reads unnaturally.
- Under 250 words is a good target for listenability, even though the hard limit is higher. Descriptions over 250 words tend to feel like press releases and reduce play rates.
- End with a specific CTA that tells the listener exactly what to do: "Hit play to hear the full framework" or "Listen now for three changes you can make to your team's review process this week." Avoid generic CTAs like "Tune in!" or "Don't miss this episode!"
- Write three variations of the first sentence with different keyword angles. Choose the one that passes the "would I click this?" test for the target listener profile defined in Step 1.

---

## Output Format

```
## Episode Brief: [Episode Title]

**Podcast:** [Podcast Name]
**Episode:** #[number] | **Season:** [number, if applicable]
**Format:** [solo | co-hosted | interview | panel | narrative]
**Target Length (post-edit):** [X] minutes
**Recommended Recording Length:** [X + 12-15] minutes
**Guest:** [Full name, title, and organization -- or N/A]
**Recording Date:** [date and time with timezone -- or TBD]
**Recording Platform:** [platform name -- or TBD]

---

### Episode Thesis

[One specific, arguable sentence. Must pass the disagreement test.]

**Target Listener:** [One sentence describing who this listener is and what question they bring to this episode]

**Listener Takeaway:** After this episode, a listener will be able to [specific behavior or capability].

---

### Segment Structure

| # | Segment | Content Description | Start | Duration |
|---|---------|---------------------|-------|----------|
| - | Cold Open | [Exact quote or scene excerpt that hooks the listener] | 0:00 | 0:45 |
| - | Intro | [Theme music, podcast name, episode #, host intro, guest intro with 1 credential + 1 personal detail] | 0:45 | 1:30 |
| [AD] | Pre-Roll Sponsor | [Sponsor name or TBD -- skip row if no sponsor] | 2:15 | 1:00 |
| 1 | [Segment Title: Setup] | [What context is established. What does the listener believe before this segment ends?] | 3:15 | [Xm] |
| [AD] | Mid-Roll Sponsor | [Sponsor name or TBD -- skip row if no sponsor] | [M:SS] | 1:00 |
| 2 | [Segment Title: Core Argument] | [Sub-beat 1: claim. Sub-beat 2: evidence. Sub-beat 3: steel-man counterargument. Sub-beat 4: implication.] | [M:SS] | [Xm] |
| 3 | [Segment Title: Application] | [Specific steps, framework, or decision tool the listener takes away] | [M:SS] | [Xm] |
| - | Outro | [Thesis restatement (new phrasing), primary CTA, next episode tease with one concrete detail] | [M:SS] | 2:00 |
| | **Total** | | | **[X:00]** |

---

### Transition Language

**Cold Open → Intro:**
"[Exact phrase that closes the cold open moment and moves to the podcast intro -- must make the listener feel invested]"

**Intro → Segment 1:**
"[Opening question or statement that establishes the problem or context -- for interviews, this is the opening question addressed to the guest]"

**Segment 1 → Mid-Roll Ad (if applicable):**
"[Natural pause point. Something like: 'Before we get into the specifics of how to fix this, a quick word from today's sponsor.']"

**Mid-Roll Ad → Segment 2 (if applicable):**
"[Re-entry phrase that re-engages listeners who may have skipped the ad]"

**Segment 1 → Segment 2 (if no ad):**
"[Transition that closes the problem framing and opens the core argument -- should feel like escalation, not a topic change]"

**Segment 2 → Segment 3:**
"[Transition from argument/evidence to practical application -- must make the shift from 'here is what is true' to 'here is what you do about it' feel earned]"

**Segment 3 → Outro:**
"[Closing pivot to the guest's exit or the host's synthesis -- for interview episodes, this is the handoff question that leads to the guest's final recommendation and links]"

---

### Guest Briefing (omit section if solo or co-hosted episode)

**For:** [Guest Name]
**Recording:** [Platform], [Date], [Time with timezone], [Expected recording duration]

**What this episode is about:**
[One paragraph. State the thesis, why the guest's experience is specifically relevant to it, and what the listener will walk away with.]

**Questions to expect (not exhaustive):**
1. [Opening question -- typically about their background or entry point into the topic]
2. [Core argument question -- asks the guest to make the central claim]
3. [Evidence/story question -- asks for a specific experience that supports the claim]
4. [Counterargument question -- steelmans the opposing view and asks the guest to respond]
5. [Application question -- asks for the practical takeaway]

**Please prepare:**
- One specific story from your own experience that illustrates [specific theme from the thesis]
- One data point, study result, or concrete example that surprised even you
- One thing a listener could try or change within the next 48 hours

**Please do NOT prepare:**
- A rehearsed narrative from start to finish -- unscripted reactions create the best moments
- A list of talking points to hit -- follow the conversation, not a checklist

**Technical requirements:**
- Platform: [Riverside.fm / Squadcast / Zencastr / Zoom with local recording / specify] -- link will be sent separately
- Microphone: USB dynamic microphone preferred (Audio-Technica ATR2100x, Samson Q2U) -- wired earbuds acceptable as minimum; no Bluetooth headphones
- Environment: Room with soft surfaces (bedroom, carpeted office, room with bookshelves) -- avoid kitchens, bathrooms, and rooms with bare parallel walls
- Internet: Wired ethernet preferred over WiFi; close other browser tabs and apps during recording
- Clothing: No jewelry or clothing with buckles that will rattle against the microphone

---

### Show Notes

**Title:** [Episode Title -- must match audio file metadata exactly]

**Summary (publish on episode page and in feed description):**
[Sentence 1: who is in this episode and what is the subject. Sentence 2: the central argument or most valuable insight, stated directly. Sentence 3: what the listener gains -- specific capability, decision, or understanding.]

**Timestamps:**
- 0:00 -- Cold open
- [M:SS] -- [Topic: specific enough that a listener can navigate to it]
- [M:SS] -- [Topic]
- [M:SS] -- [Topic]
- [M:SS] -- [Topic]
- [M:SS] -- [Topic]
- [M:SS] -- [Topic]
- [M:SS] -- Outro and guest/host links

**Resources Mentioned:**
- [Book / tool / framework / study -- with enough context that the listener knows why it was referenced]
- [Resource 2]
- [Resource 3]

**Guest:** [One paragraph bio in third person. Include current role, relevant background, and why this guest is specifically credible on this topic.]

**Connect with [Guest Name]:**
- [Primary website or landing page]
- [Most relevant social handle]
- [Specific resource they mentioned: book, course, newsletter, etc.]

**Connect with [Podcast Name]:**
- [Newsletter, community, or primary website]
- [Primary social handle]

---

### SEO Episode Description (max 250 words; first 180 characters must stand alone)

[First sentence: primary keyword phrase + hook. This sentence must work as a standalone meta-description on mobile.]

[Body: 3-4 sentences expanding on the thesis and the guest's specific insight. Include two secondary keyword phrases naturally. Name the three most concrete things the listener will learn -- specificity drives clicks.]

[Closing sentence: specific CTA. Not "tune in" -- name the exact benefit of pressing play right now.]
```

---

## Rules

1. **Never plan an episode without a thesis.** A topic is not a thesis. If the user cannot articulate an arguable, specific claim, spend one full step narrowing the topic before touching the segment structure. An episode without a thesis will ramble regardless of how clean the segment structure looks.

2. **Segment time allocations must sum to the target episode length within 90 seconds.** If the user says 30 minutes, the segment table must total 28:30 to 31:30. Use the recommended recording length (target + 12-15 minutes) to account for editing headroom, and state this explicitly in the brief.

3. **The cold open must be 30 to 60 seconds.** Under 30 seconds and the hook has no time to land. Over 60 seconds and it starts to feel like the episode has already begun, which disorients listeners who join from the beginning. For interview episodes, the cold open quote should be pulled from the guest's most specific or surprising statement -- not a generic motivational comment.

4. **Transition language must be written as exact, ready-to-use phrases.** "Host transitions to the topic of solutions" is not transition language. The transition must be complete enough that a host could read it verbatim without it sounding unnatural.

5. **Guest briefings contain three to five preview questions, not the full question list.** Sending all questions in advance produces interview answers that are polished but lifeless. The preview questions should cover the episode's structural spine; all discovery and follow-up questions are held for the recording.

6. **Show notes timestamps use M:SS format up to 59:59, then H:MM:SS.** A 35-minute episode's final timestamp reads 34:15, not 0:34:15. Consistency here matters because Spotify and Apple Podcasts auto-link timestamps in the description field when the format is correct.

7. **The SEO description's first 180 characters must function as a standalone meta-description.** Mobile podcast apps truncate at 110-180 characters before the "more" tap. Test the first sentence: does it contain a keyword, name the guest or topic, and give the listener a reason to tap? If not, rewrite it.

8. **Do not include audio engineering, file format, or post-production instructions in the episode brief.** Loudness targets (LUFS), EQ settings, bit rate, export format, and noise reduction parameters belong in `audio-editing-guide`. Including them here creates a bloated document that confuses the pre-production and post-production stages.

9. **Ad break placements follow a specific formula.** Pre-roll ads go between the cold open and the intro (high skip rate, low value -- only use for contractual pre-roll requirements). Mid-roll ads go at the Segment 1 to Segment 2 boundary -- this is the highest listener-retention moment in the episode and commands the highest CPM rates (typically 2x pre-roll). Post-roll ads are low value for listener conversion. If there is only one ad slot, always place it mid-roll.

10. **The solo episode structure requires explicit sub-points in Segment 2 that would otherwise emerge naturally in conversation.** Without a guest to ask follow-up questions, the host must build the interrogation into the outline itself. Segment 2 for solo episodes must list at least three sub-points: the claim, a concrete example, and a "yes, but" counterargument the host addresses directly. Without this, solo Segment 2 runs long and becomes unfocused.

11. **The guest briefing's technical requirements must specify the recording platform, microphone standard, room environment, and internet connection type.** Vague technical requirements ("have a good microphone in a quiet room") produce unusable audio. The specific minimum is: wired earbuds with mic, room with soft surfaces, wired internet or strong WiFi with other applications closed.

12. **Episode titles in show notes must match the audio file metadata title exactly.** Discrepancies between the RSS feed title and the audio file ID3 tag title cause display errors in some podcast clients (especially Overcast and Castro) and break automated transcript linking in tools that match by episode title string.

---

## Edge Cases

### Solo Episode (No Guest)
Remove the guest briefing section entirely. The cold open should tease the episode's most counterintuitive claim or the specific insight that the listener does not have yet -- not a quote from a guest. Segment 2 must be explicitly structured with sub-points because there is no conversational partner to draw out new angles organically. Include a "monologue pacing note" for the host: recommend inserting a 1-2 second intentional pause between major sub-points to give the listener processing time and to give the editor clean cut points. Show notes should include a "Key Takeaways" section with three to five bullet points since solo episodes often contain denser information without conversational repetition to reinforce ideas.

### Panel Discussion (Three or More Guests)
Add a **Speaker Map** table to the segment structure showing each panelist's name, role, and the specific angle or position they represent. Assign "anchor questions" -- questions directed at specific panelists by name -- to prevent the most dominant voice from answering every question. Include a moderator note at the top of the brief: "If two panelists are responding simultaneously, redirect to the one whose expertise is most specific to the question. If a panelist has been quiet for more than four minutes, use a direct address question." Technical note: panel recordings require each participant to record a local track. Include this in the technical requirements for every panelist: Riverside.fm and Squadcast support local recording natively; Zoom does not without a third-party recording tool.

### Narrative or Documentary Format
Replace the thesis with a story spine. Replace segment titles with narrative beat labels: Setup, Inciting Incident, Rising Action, Turning Point, Resolution, and Lesson. The cold open is a scene excerpt -- a specific moment with sensory detail -- not a thesis preview. Transition language includes sound design cues written as stage directions: "[MUSIC: ambient tension fades to silence]" or "[SFX: archival audio clip 4 seconds]". The show notes for narrative episodes should include a "Story Summary" field separate from the episode summary -- one paragraph that tells the narrative arc without spoiling the resolution.

### Very Short Episode (Under 12 Minutes)
Compress to three segments: combined cold open + intro (maximum 1:30), core content (8-9 minutes), and outro (1:00). Remove the Setup/Problem segment -- the problem must be stated in one sentence during the intro. Remove the Application segment -- actionable advice is integrated directly into the core content as the final sub-point. Remove the mid-roll ad placement; a mid-roll in a sub-12-minute episode interrupts the listening experience too severely and signals low production value. Guest briefings for short episodes should include a note: "We will keep the conversation tight. Please give direct, concise answers -- we can always expand if the conversation calls for it, but we will edit to keep under 12 minutes."

### Sensitive or Controversial Topic
Add a **Content Advisory** block at the very top of the episode brief, before the thesis. The content advisory specifies: the nature of the sensitive content (graphic descriptions of violence, mental health crisis content, explicit discussion of substance use, etc.), the specific language the host should use to introduce it ("This episode discusses suicide prevention and contains specific references to methods -- listener discretion is advised"), and a note on whether platform content flags are required (Apple Podcasts requires explicit content flagging for episodes with profanity or adult content; failure to flag can result in demotion from search results). Include a **Framing Note** for the host: the exact opening language to set tone, including what NOT to say (avoid clinical detachment, avoid language that sensationalizes, avoid euphemisms that obscure the seriousness of the topic). Add a **Resources Mentioned** requirement: for mental health, addiction, or crisis topics, a standard resource (hotline number, national organization) must appear in both the show notes and be read aloud by the host at the end of the episode.

### Serialized or Multi-Part Episode
Add a **Series Context** block to the episode brief showing where this episode falls in the arc (Episode 2 of 4, for example), what was established in the previous episode that this one builds on, and what must be left unresolved to create a continuation hook. The outro for a mid-series episode is structurally different from a standalone episode outro: instead of a generic episode tease, it must include a specific unresolved question or reveal that was deliberately withheld in the current episode. The cold open for episode 2 and beyond should include a one-sentence "previously on" recap -- no longer, or it will feel like padding.

### Repurposed Content Episode (Based on Existing Material)
When the user wants to build an episode around an existing blog post, webinar, presentation, or previous episode, the thesis must be restated from the source material's argument -- not copied verbatim. Ask the user: "What does your audience know from reading/watching the original? What can the audio format reveal that the written/visual format could not?" The answer defines the episode's unique value. Guest or co-host presence becomes particularly valuable here -- a second voice adds the conversational texture and spontaneous insight that distinguishes the podcast version from the original. Note in the brief: "This episode is adapted from [source]. The show notes should link to the original source and note the connection explicitly."

---

## Example

**Input:** "I want to plan a 40-minute interview podcast episode for my show called 'The Ops Room' -- it's for startup operators, COOs, and chiefs of staff. My guest is a COO who scaled a SaaS company from 20 to 200 employees in 18 months without breaking the team. I want to talk about how they kept the culture intact while growing that fast."

---

**Output:**

## Episode Brief: Culture Doesn't Scale Itself -- How One COO Kept Team Culture Intact Through 10x Growth

**Podcast:** The Ops Room
**Episode:** #[number to confirm with host] | **Season:** N/A
**Format:** Interview
**Target Length (post-edit):** 40 minutes
**Recommended Recording Length:** 52-55 minutes
**Guest:** [Guest Name], COO -- scaled [Company Name] from 20 to 200 employees in 18 months
**Recording Date:** TBD
**Recording Platform:** TBD

---

### Episode Thesis

Culture does not survive hyper-growth by accident -- it survives because someone explicitly converts unwritten cultural norms into documented operating systems before headcount doubles, and the COO's job during a scaling event is to be that conversion process.

**Target Listener:** A COO, VP of Operations, or chief of staff at a company that has just raised a Series A or Series B and is about to begin aggressive hiring, asking: "How do I keep the culture we have right now from disappearing in the next 18 months?"

**Listener Takeaway:** After this episode, a listener will be able to identify which cultural norms at their company are currently unwritten and vulnerable, and will have a specific framework for documenting and operationalizing them before the next hiring surge.

---

### Segment Structure

| # | Segment | Content Description | Start | Duration |
|---|---------|---------------------|-------|----------|
| - | Cold Open | Guest quote: "At employee 80, I realized we had already lost the culture we were trying to protect. We had been so focused on hiring fast that we forgot to teach anyone what we actually believed. That was the moment I stopped treating culture as a feeling and started treating it as a system." | 0:00 | 0:50 |
| - | Intro | Theme music, "The Ops Room," episode number, host intro. Guest intro: "[Guest Name] is the COO who took [Company] from 20 to 200 people in 18 months -- and is here today because their team retention rate during that period was 91%. They are also a former D1 athlete, which, as you will hear, turns out to be directly relevant to how they think about culture." | 0:50 | 1:30 |
| [AD] | Mid-roll Ad placeholder | [Sponsor TBD] | 2:20 | 1:00 |
| 1 | The Myth of Culture Fit | What most operators believe about culture during scaling: that hiring for "culture fit" will protect it. Why this belief is dangerous. How culture fit becomes a proxy for homogeneity and the guest's specific moment of realization. | 3:20 | 8:00 |
| 2 | Culture as Operating System | The thesis: culture survives scaling when it is converted from unwritten norms into documented systems BEFORE headcount doubles. Guest's framework: the Culture Codification Sprint (identify the 10 most important unwritten norms, write the decision rule behind each one, embed each rule into one operational process). Evidence from the 20-to-200 journey. The counterargument ("culture can't be documented without killing it") and why it is wrong. The implication: most COOs are 30 days behind on this at all times. | 11:20 | 16:00 |
| 3 | The Ops Playbook: What to Do This Month | Three specific actions: (1) Run the Culture Audit -- list the ten norms that would disappear if your founding team left tomorrow. (2) Assign a Culture Owner for each norm -- not HR, but a named senior IC who embodies it. (3) Write one decision rule per norm and embed it in the onboarding checklist for the next hire. Guest shares the single change that had the highest ROI during the 20-to-200 scaling period. | 27:20 | 10:00 |
| - | Outro | Thesis restatement, guest's primary resource to share, CTA (subscribe + newsletter), next episode tease | 37:20 | 2:40 |
| | **Total** | | | **40:00** |

---

### Transition Language

**Cold Open → Intro:**
"That was [Guest Name], and we are going to spend the next 40 minutes unpacking exactly what they meant by that -- what it looks like when culture becomes a system, and why the COO is the person responsible for making that happen. I'm [Host Name], this is The Ops Room. Let's get into it."

**Intro → Segment 1:**
"[Guest Name], thank you for coming on. I want to start with the belief that I hear from almost every operator I talk to, which is that you protect culture by hiring people who already fit it. You have a strong opinion about why that is actually one of the most dangerous things you can do during a scaling period. Walk me through your thinking."

**Segment 1 → Mid-Roll Ad:**
"Before we get into what you actually did to fix this -- and there is a very specific framework I want you to walk us through -- let me take a quick break."

**Mid-Roll Ad → Segment 2:**
"We're back. [Guest Name], you told me before we started recording that there was a specific moment around employee 80 where you realized the approach wasn't working. Tell me what you saw, and then let's get into the framework you built to address it."

**Segment 2 → Segment 3:**
"Okay, so the framework is the Culture Codification Sprint -- identify the unwritten norms, write the decision rule behind each one, embed it in an operating process. I want to make this actionable for the operator who is listening to this on their commute and is going into a leadership team meeting tomorrow. If someone wants to start this week, what do they actually do first?"

**Segment 3 → Outro:**
"Three things: the Culture Audit, assigning Culture Owners, and writing one decision rule per norm into the onboarding checklist. [Guest Name], this has been exactly the kind of practical that our audience comes to this show for. Last question: if someone wants to go deeper on this -- your writing, your thinking -- where do they find you?"

---

### Guest Briefing

**For:** [Guest Name]
**Recording:** [Platform], [Date], [Time with timezone], expected recording duration 50-55 minutes (episode will edit to 40 minutes)

**What this episode is about:**
The Ops Room audience is made up of COOs, VPs of Operations, and chiefs of staff who are either in the middle of a scaling event or know one is coming. This episode's central argument is that culture survives rapid growth not through good intentions or careful hiring but through deliberate operationalization -- converting unwritten cultural norms into documented systems before headcount doubles. Your experience taking [Company] from 20 to 200 employees in 18 months with a 91% retention rate is a rare, concrete proof point for this argument. The listener will walk away with a specific three-step process they can begin this week.

**Questions to expect (not exhaustive):**
1. Most operators believe that hiring for "culture fit" is how you protect culture during fast growth. What do you believe instead, and when did your thinking shift?
2. You have described culture as an "operating system" rather than a feeling. Walk me through what you mean by that and how you started treating it that way.
3. There is a real argument that once you write culture down, you kill its authenticity -- it becomes a marketing document, not a lived experience. How do you respond to that?
4. If a COO is listening to this and their company is about to go from 40 to 100 people in the next 12 months, what is the first thing they should do this month -- not eventually, this month?
5. What is the single change you made during the 20-to-200 period that had the highest return on culture preservation?

**Please prepare:**
- One specific story -- ideally a moment when you saw the culture beginning to erode, what you observed, and what you did about it
- One data point from your own experience: retention rate, engagement score, a specific outcome that shows the approach worked
- One thing a listener can do within 48 hours that will make a meaningful difference -- specific enough to be actionable, not just a mindset shift

**Please do NOT prepare:**
- A polished narrative that covers every aspect of the topic from start to finish -- the best moments in this kind of interview come from real-time thinking and reaction, not rehearsed answers
- A list of all the points you want to make -- trust the conversation to surface them

**Technical requirements:**
- Platform: [Riverside.fm / Squadcast -- link sent separately 24 hours before recording]
- Microphone: USB dynamic microphone strongly preferred (Audio-Technica ATR2100x, Samson Q2U, Blue Yeti all work well) -- wired earbuds with inline mic are acceptable as a minimum; please do not use AirPods or other Bluetooth headphones
- Room: Choose a room with soft surfaces -- a bedroom, a carpeted home office, or any room with bookshelves or fabric furniture. Avoid kitchens, bathrooms, open office environments, or rooms with large glass walls
- Internet: Wired ethernet strongly preferred; if on WiFi, close all other browser tabs and applications before joining
- Clothing: No metal jewelry, buckled straps, or anything that will move against the microphone or desk during the conversation
- Backup: Even if we are recording on the platform, please also hit record on your phone's voice memo app as a safety backup

---

### Show Notes

**Title:** Culture Doesn't Scale Itself -- How One COO Kept Team Culture Intact Through 10x Growth with [Guest Name]

**Summary:**
[Guest Name] is the COO who took [Company] from 20 to 200 employees in 18 months -- and maintained a 91% team retention rate while doing it. In this episode, they explain why the conventional wisdom of "hire for culture fit" is one of the most dangerous beliefs during a scaling event, and introduce the Culture Codification Sprint: a specific process for converting unwritten cultural norms into operational systems before headcount doubles. If your company is approaching or in the middle of a growth surge, this episode gives you a concrete three-step playbook to start this week.

**Timestamps:**
- 0:00 -- Cold open: the moment culture started disappearing at employee 80
- 3:20 -- Why hiring for "culture fit" is dangerous during rapid growth
- 11:20 -- Culture as an operating system: the Culture Codification Sprint framework
- 18:00 -- The counterargument: can you document culture without killing it?
- 23:40 -- What the data showed: retention outcomes from the 20-to-200 period
- 27:20 -- Three things to do this month: the Culture Audit, Culture Owners, and the decision rule checklist
- 34:15 -- The single change with the highest ROI during scaling
- 37:20 -- Where to find [Guest Name] and closing

**Resources Mentioned:**
- [Book or article referenced by guest during recording -- to be confirmed]
- Culture Codification Sprint framework -- [Guest Name]'s description and template [add link if guest shares one]
- [Any specific tool, process, or framework named during recording]

**Guest:** [Guest Name] is the COO of [Company], where they led the organization from 20 to 200 employees in 18 months while maintaining a 91% team retention rate. Prior to [Company], [Guest Name] served as [previous relevant role]. They write about operations and organizational design at [publication or newsletter -- to confirm]. [Guest Name] is also a former [D1 sport] athlete, a background that directly informs their systems-based approach to team culture.

**Connect with [Guest Name]:**
- Website: [to confirm]
- LinkedIn: [to confirm]
- Newsletter / writing: [to confirm]

**Connect with The Ops Room:**
- Newsletter: [link]
- Website: [link]
- Subscribe on Apple Podcasts / Spotify / [other platform]

---

### SEO Episode Description

How do you keep company culture intact when you're growing 10x in 18 months? In this episode of The Ops Room, COO [Guest Name] explains why "hiring for culture fit" is one of the most dangerous beliefs a scaling company can hold -- and what to do instead.

[Guest Name] led [Company] from 20 to 200 employees in 18 months with a 91% team retention rate. Their core argument: culture doesn't survive rapid growth through good intentions. It survives because someone converts unwritten cultural norms into documented operating systems before headcount doubles. They call this process the Culture Codification Sprint.

In this conversation, you will hear the specific moment at employee 80 when [Guest Name] realized their culture was already eroding, the three-step framework they built to stop it, and the single change that had the highest return on culture preservation throughout the scaling period. You will also hear their response to the strongest counterargument: that documenting culture kills its authenticity.

If you are a COO, VP of Operations, or chief of staff heading into a hiring surge, this episode gives you a concrete playbook -- the Culture Audit, the Culture Owner model, and the decision rule checklist -- that you can begin implementing this week.

Hit play for one of the most operationally specific conversations on culture scaling we have had on this show.
