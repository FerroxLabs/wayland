---
name: short-story-writing
description: |
  Writes short stories (1,000-10,000 words) across any genre using constraint-first design and a five-step creative process. Collects genre, POV, premise, length, and one key constraint before drafting.
  Use when the user asks to write a short story, create fiction, draft a narrative, or develop a short prose piece.
  Do NOT use for flash fiction under 1,000 words (use flash-fiction), novel chapters (use plot-outline for planning), poetry (use poetry-writing), or screenplays (use screenplay-scene).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "creative-writing writing planning"
  category: "writing"
  subcategory: "creative-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Short Story Writing

## When to Use

**Use this skill when:**
- The user asks to write a short story, short fiction, or a prose narrative of any genre between 1,000 and 10,000 words
- The user has a premise, image, character, or scenario and wants it turned into a complete short story draft
- The user wants to develop a story idea from concept through finished draft, including structural planning and revision
- The user wants a story written in a specific style, genre, or formal constraint (e.g., epistolary, unreliable narrator, reverse chronology)
- The user has a partial draft or story fragment and wants to complete it as a short story
- The user is submitting to a literary magazine, anthology, or contest and needs a polished, genre-appropriate piece
- The user wants to experiment with a narrative technique they have encountered in their reading (e.g., second-person, frame narrative, braided structure)

**Do NOT use this skill when:**
- The user wants fiction under 1,000 words -- use `flash-fiction`, which handles the specific compression techniques flash requires (sudden fiction, six-word stories, 100-word drabbles)
- The user wants to plan a novel, series, or multi-chapter work -- use `plot-outline`, which handles act structure, subplot threading, and chapter-level scene sequencing
- The user wants a poem, prose poem, or lyric essay -- use `poetry-writing`, which handles line breaks, meter, sonic patterning, and the non-narrative lyric arc
- The user wants a screenplay, teleplay, or stage play -- use `screenplay-scene`, which handles sluglines, action blocks, dialogue formatting, and screen direction
- The user wants fanfiction using copyrighted characters, settings, or IP -- use `fan-fiction`, which handles canon compliance, shipping conventions, and transformative work norms
- The user wants a picture book, early-reader, or middle-grade story -- use `childrens-story`, which handles age-appropriate vocabulary, page-turn structure, and developmental appropriateness
- The user wants a personal essay or creative nonfiction narrative -- use `personal-essay`, which handles the lyric essay form, the "I" of memoir, and the ethics of true-story telling

---

## Process

### Step 1: Collect All Five Constraints Before Writing a Single Word

The single most common failure mode in AI-assisted short story writing is starting to draft before the creative parameters are set. Constraints are not limitations -- they are the structural pressure that forces creative invention. Do not begin drafting until you have all five of the following:

- **Genre:** Ask for the primary genre and, if relevant, a secondary genre blend. The major short-story genres are: literary fiction, science fiction, fantasy, horror, dark fantasy, gothic, magical realism, surrealism, romance, contemporary romance, historical fiction, mystery, psychological thriller, crime, western, slipstream, and speculative. Genre sets prose expectations, pacing norms, and what readers will tolerate as resolution.
- **Point of View (POV):** First person (intimate, limited, narrator-as-character), second person (immersive, unusual, risks alienating readers), third-person limited (close but grammatically separate, most common in commercial fiction), third-person omniscient (narrator with access to all minds, requires careful management), unreliable narrator (first or third, where the narrator's account is demonstrably incomplete or distorted). POV is not just a pronoun choice -- it determines what information the reader can access and when.
- **Approximate target length:** 1,000--2,000 words (flash-adjacent -- single scene or tight two-scene structure), 2,500--5,000 words (standard short story -- three to five scenes, full arc), 5,000--8,000 words (long short story -- room for subplot or secondary character development), 8,000--10,000 words (novelette-length -- multiple POV possible, thematic depth, closer to novelette conventions).
- **One-sentence premise:** This must contain a protagonist (or implied protagonist), a situation, and a potential for conflict. "A lighthouse keeper" is a character. "A lighthouse keeper who discovers letters from the future washing ashore" is a premise. "A woman" is not a premise. The premise does not need to contain the ending -- it needs to contain the engine of the story.
- **One key formal or narrative constraint:** This is the creative pressure that makes the story specific rather than generic. Examples: told entirely in dialogue with no attribution tags; epistolary (letters, emails, texts, case files); reverse chronological order; single unbroken scene in real time; unreliable narrator who is lying to themselves about a specific thing; no named characters; alternating timelines; second person; present tense only; told from a non-human POV; each section opens with a specific repeated image.

If any of these is missing, ask for it. Do not invent defaults and proceed. If the user says "you choose," offer three specific options for the missing element based on what they have already provided, and let them select.

---

### Step 2: Diagnose the Story's Core Engine

Before planning the structure, identify what type of story this fundamentally is. Short stories typically run on one of four core engines -- and the engine determines which structural choices will feel earned versus artificial:

- **Plot-driven (external conflict engine):** The story is about what happens. Tension comes from events, obstacles, danger. Common in genre fiction (thriller, horror, mystery, adventure fantasy). Resolution comes through action -- the protagonist does something that changes the external situation.
- **Character-driven (internal conflict engine):** The story is about how a person changes (or refuses to change). Tension comes from the gap between who the character is and who they need to become. Common in literary fiction. Resolution comes through a moment of recognition, decision, or revelation that shifts the character's internal state.
- **Atmosphere-driven (tonal/experiential engine):** The story is primarily creating an emotional or sensory experience -- dread, wonder, grief, unease. Common in horror, gothic, and literary surrealism. Resolution is less about event or change and more about achieving a particular feeling in the reader.
- **Idea-driven (conceptual engine):** The story is exploring a thought experiment, a thematic tension, or a philosophical question through narrative. Common in science fiction, speculative fiction, and allegory. Resolution comes through the story having dramatized the question, not necessarily answered it.

Identify which engine applies and communicate it to the user as part of the plan. A story with the wrong engine for its premise will feel structurally incoherent -- the plot-driven approach applied to a character-driven premise produces melodrama; the atmosphere-driven approach applied to a plot-driven premise produces frustrating vagueness.

---

### Step 3: Build the Story Plan and Present It for Confirmation

Generate a concrete structural plan based on the constraints and the identified engine. Present this before writing any story prose. The plan must include all seven of the following elements:

- **Opening image or moment:** The specific first sensory image, action, or line of dialogue that begins the story. This is not "the story opens with her noticing something strange." This is "the story opens mid-sentence, her voice answering a question we have not yet heard, already in the middle of an argument." Make this concrete.
- **Central tension stated as a contradiction:** The protagonist wants X. Standing between the protagonist and X is Y. Stated as a pair of opposed forces, not as a plot summary. Example: "She wants to believe her mother is still the person she remembers. The evidence of the last three days is destroying that belief."
- **Scene sequence:** For stories above 2,000 words, provide a brief scene-by-scene breakdown. Each scene should be one sentence: what happens, who is present, what changes by the end of it. A 4,000-word story will typically have four to six scenes. A 7,000-word story will have six to nine.
- **The turning point:** The single moment where the story pivots. In Aristotelian terms, this is the peripeteia -- the reversal of situation or understanding. It should occur approximately 60--70% of the way through the story, not at the midpoint and not in the final paragraph.
- **The ending approach:** Choose from: closed resolution (the central tension is resolved, the question is answered), open resolution (the tension is released but not resolved -- the story ends at the moment of decision, not after it), twist resolution (the ending recontextualizes what we understood about the story -- requires setup planted in the opening third), pyrrhic resolution (the protagonist achieves the goal at unacceptable cost), non-resolution (the character does not change and the story ends with that stasis as the statement).
- **Tonal register:** The emotional weather of the prose. Choose one primary and one secondary: elegiac, tense, darkly comic, warmly ironic, menacing, wondrous, intimate, cold and clinical, frantic, dreamy, sardonic, mournful, euphoric. These directly determine sentence rhythm, word choice, and how much emotional labor the prose performs openly vs. submerges.
- **Emotional arc for the reader:** What should the reader feel at the opening? What is the emotional midpoint? What feeling should they carry when they put the story down? This is distinct from what the characters feel -- this is about reader experience.

Present the full plan as a structured document. Ask for confirmation or adjustments before proceeding to draft.

---

### Step 4: Draft the Story Using Craft-Layer Discipline

Write the complete story in one pass, then review by layer. Do not try to perfect each sentence before moving to the next -- draft for momentum, then revise for precision. The following craft principles govern every layer of the draft:

**Prose rhythm and sentence architecture:**
- Vary sentence length deliberately. Long sentences create accumulation, intimacy, and immersion. Short sentences create impact, finality, and threat. The ratio should shift with the story's emotional temperature -- more short sentences during high-tension moments, longer more complex syntax during interiority and reflection.
- Avoid three-adjective constructions. One precise adjective beats three approximate ones. "The rotting pier" is stronger than "the old, broken-down, weathered pier."
- Paragraphing is punctuation at the scene level. A one-sentence paragraph says: stop. Pay attention here. Use it as such.

**Scene construction:**
- Every scene needs an entry point (where are we and what is immediately happening), a pressure point (the moment of highest tension in the scene), and an exit point (what has changed -- in situation, relationship, or understanding -- by the end of it). Scenes without an exit point are non-scenes; they are description masquerading as narrative.
- Enter scenes late and leave them early. Cut the first paragraph of most scenes (the setup that explains why characters are in a room) and cut the last paragraph (the transition out). Drop in at the moment something is already in motion.
- Show the scene -- don't explain it. Characters move, speak, act, notice things. The reader builds understanding from behavior, not from the narrator's summary of emotional states.

**Dialogue:**
- Dialogue does four jobs: advances plot, reveals character, creates subtext, and varies prose rhythm. Every line of dialogue should do at least two of these simultaneously.
- Subtext is the gap between what a character says and what they mean. A character who says "I'm fine" when they are not fine is interesting. A character who says "I'm devastated" when they are devastated is not.
- Attribution: use "said" and "asked" as invisible defaults. Action tags (She set down the glass. "I don't think so.") are more vivid than adverb-modified speech tags ("she said coldly"). Never use "ejaculated," "expostulated," or any attribution that draws attention to itself.
- Read all dialogue aloud mentally. If it sounds like written language rather than spoken language, it needs revision.

**POV discipline:**
- First person: the narrator has a voice, a history, and blind spots. The most important thing about a first-person narrator is what they cannot or will not see about themselves. The reader should understand more than the narrator does.
- Third-person limited: the narrative camera stays inside one character's head. Never access another character's thoughts. Render other characters entirely through observable behavior: what they say, do, wear, how they move.
- Third-person omniscient: choose a primary character to track closely and only dip into other perspectives with clear narrative purpose. Head-hopping (shifting perspective mid-scene without a break) creates reader disorientation and emotional distance. Use scene breaks (marked ---) when shifting perspective.
- Unreliable narrators: establish the unreliability in the opening third through small, observable contradictions between what the narrator claims and what the narrated events reveal. The reader should feel the ground shift before it actually does.

**The constraint in action:**
- Honor the formal constraint established in Step 1 throughout the entire draft. The constraint is not a gimmick bolted on -- it should be generating the story's specific possibilities. An epistolary story about grief should have letters that tell us about the letter-writer's relationship with the recipient through what is said and not said. A story told in second person should use the "you" to create intimacy with an experience that "I" would distance.

**Pacing by genre:**
- Literary fiction: slower interiority, longer scenes, more descriptive density, meaning embedded in texture. Acceptable pace is 400--500 words per scene beat.
- Thriller and horror: lean syntax, shorter paragraphs, high event-to-word ratio, tension maintained through withholding information. Scene beats run 150--250 words.
- Science fiction and fantasy: world-building must be delivered through scene, action, and dialogue -- not in exposition blocks. The "iceberg rule" applies: 90% of the world-building knowledge stays off the page; 10% appears, and it implies the rest.
- Romance: emotional interiority is the plot. What characters feel, desire, fear, and almost-say is more important than external action. Sensory detail of the romantic subject is expected and meaningful.
- Magical realism: the magical element is presented with the same matter-of-fact narrative tone as mundane events. The prose does not explain or marvel at the magic. Characters react to it the way they would react to weather.

---

### Step 5: Apply Genre-Specific Quality Checks Before Delivery

Review the completed draft against the following checklist. Fix failures before presenting the story to the user:

**Universal checks (all genres):**
- Does the opening sentence earn the next sentence? Does the first paragraph earn the second? The reader should be unable to stop reading the opening.
- Is there a single central tension that runs through every scene? If you can remove a scene without losing that tension, the scene is not load-bearing -- revise it or cut it.
- Is the turning point clearly identifiable? Does it occur in the second half of the story, not at the midpoint?
- Does the ending complete the emotional arc established in the opening? The ending image or line should rhyme with (but not repeat) the opening image or line.
- Is the prose doing showing-work or telling-work? Telling work ("she was lonely") should be replaced with showing work ("she had eaten the same dinner for eleven nights in a row because making two servings felt aggressive") or eliminated unless a deliberate narrative voice justifies it.
- Is every named character doing work that a named character needs to do? If a character exists only to deliver one line of information, eliminate them or give that information to a character already in the scene.

**Genre-specific checks:**
- Horror: is there genuine dread in the setup, or only gore in the resolution? The most effective horror stories create fear through anticipation, not event. The thing not-yet-seen is almost always scarier than the thing revealed.
- Mystery: are all clues discoverable in re-read, planted before they become relevant? Is the solution a logical consequence of established facts, or a revelation of new information?
- Science fiction/fantasy: is the world-building earning its word count? Every paragraph of exposition that does not also advance plot or character is a paragraph the reader will skim.
- Romance: does the emotional development of the relationship feel earned through specific shared moments, or does it feel accelerated and generic?
- Literary fiction: is the specificity of the story sufficient to prevent it from being a fable or a type-study? The character must be a specific person in a specific situation -- not a representative of a class of people.

---

### Step 6: Deliver the Story and Invite Targeted Revision

Present the story in the specified output format. After delivery, offer specific revision entry points rather than asking "Do you want any changes?" The following are productive revision offers:

- "The opening paragraph can be tightened -- want me to cut it to its essential core?"
- "The dialogue in [scene] is doing summary work that could be dramatized -- want me to expand that exchange?"
- "The ending is [closed/open/twist] as planned -- want to try the alternate resolution we discussed?"
- "The pacing in the second half accelerates faster than the first -- want me to expand [scene] to even the rhythm?"

When the user requests revisions, ask which specific element is not working (pacing, tone, character, dialogue, ending, specific scene) rather than accepting vague "make it better" requests. Make targeted surgical changes, not full rewrites. Preserve the voice, rhythm, and specific language of sections the user has not flagged.

---

## Output Format

```
## [Story Title]

*[Genre] | [POV] | [Tonal Register] | ~[word count] words*

---

[Story text begins here -- no header, no setup, just the story]

[Scene break marked by ---]

[Story continues]

[Story ends -- no footer, no author's note inside the story text]

---

### Story Notes

| Element | Detail |
|---|---|
| **Premise** | [One-sentence premise] |
| **Core engine** | [Plot-driven / Character-driven / Atmosphere-driven / Idea-driven] |
| **Key constraint** | [Formal or narrative constraint applied] |
| **POV** | [POV type and rationale] |
| **Tonal register** | [Primary + secondary tone] |
| **Structural pattern** | [e.g., linear 5-scene arc / dual timeline / single unbroken scene] |
| **Ending type** | [Closed / Open / Twist / Pyrrhic / Non-resolution] |
| **Word count** | [Actual count] |

### If You Want Changes

- **Tighten the pacing:** [Which scene(s) are candidates for cuts]
- **Deepen the character:** [Where the interiority could expand]
- **Adjust the ending:** [What the alternate resolution would be]
- **Shift the tone:** [What register change would achieve that]
```

---

## Rules

1. **Never begin drafting before all five constraints are confirmed.** Genre, POV, length, premise, and key constraint must all be established. If the user omits any element, ask specifically for that element. If the user says "you pick," offer three concrete options for the missing element and let them choose.

2. **Never open with weather, time of day, or setting description as the first sentence unless that description creates immediate tension or is directly tied to the central conflict.** "It was raining" is not a hook. "The rain had started exactly when her mother stopped speaking to her, and had not stopped in three years" is a hook -- it earns the weather by making it mean something.

3. **Never resolve conflict through coincidence, the sudden arrival of a previously unmentioned character, or the convenient discovery of an object that solves the problem.** The resolution must be a logical consequence of forces established in the first half of the story. The gun on the mantle in Act One fires in Act Three -- it does not appear in Act Three for the first time.

4. **Never end a story with the events being a dream, a simulation, or a hallucination unless the premise established this possibility from the first paragraph.** This resolution invalidates the reader's emotional investment and is a structural betrayal, not a twist.

5. **Never use adverb-modified speech tags to carry emotional content that the dialogue itself should be doing.** "He said angrily" means the dialogue failed to convey anger. Rewrite the line of dialogue. Reserve speech-tag adverbs only for situations where the emotional register genuinely contradicts the content ("he said cheerfully" when that cheerfulness is itself the sinister thing).

6. **Never write a physical description of a character's appearance as a standalone paragraph unless appearance is directly connected to the story's conflict, theme, or that character's function.** Eye color and hair color are not characterization. What a character does with their hands, how they occupy space, and what they do when they think no one is watching -- that is characterization.

7. **Always maintain POV discipline throughout the entire draft.** In first-person or third-person limited, zero access to other characters' internal states. Render other characters entirely through observable behavior. If you discover you need access to another character's interiority, either restructure the POV choice or use a scene break to shift to that character's limited POV.

8. **Always include at least one moment of subtext in every scene with dialogue.** Subtext means the character's stated words and their actual meaning or desire diverge. This is the primary technique for creating three-dimensional characters -- characters who want one thing and say another, or who do not understand what they want, are recognizable as human.

9. **Always use concrete sensory specificity rather than abstract emotional labeling.** "She was afraid" tells the reader what to feel. "She had dialed her mother's number twice and ended the call before it connected" makes the reader feel the fear. The sensory and behavioral specifics carry the emotion; the prose should not carry it for them.

10. **Always apply the formal or narrative constraint consistently from the first sentence to the last.** A constraint that disappears after three scenes is a broken promise to the reader. If the constraint proves genuinely incompatible with the story (discovered during drafting), surface this conflict to the user before delivering a story that abandons the constraint midway.

11. **Never use "suddenly" as a transition, "very" as an intensifier, or "walked over to" as movement description.** These are placeholder language that indicate an unfinished sentence. Replace each: "suddenly" with the actual event made immediate through tense or rhythm; "very [adjective]" with a more precise adjective; "walked over to" with a verb that implies character ("crossed the room," "drifted toward," "stepped back from").

12. **Every scene must exit with something changed.** The most common structural failure in AI-generated fiction is scenes that are thematically rich but narratively inert -- beautiful language in which nothing happens and nothing changes. Each scene must exit with the situation, relationship, or understanding between characters altered in at least one specific way that the next scene inherits.

---

## Edge Cases

### The User Provides No Premise Whatsoever

Do not generate a random story. Instead, ask two questions in sequence: "What genre do you enjoy reading most?" and "Give me one image, person, or situation -- something you have seen, experienced, read about, or imagined -- that interests you." From the intersection of genre preference and the specific image or situation they provide, generate three specific premises for them to choose from or modify. Each offered premise should be structurally different -- one plot-driven, one character-driven, one atmosphere-driven -- so the choice itself reveals what kind of story the user actually wants.

### The User Wants a Twist Ending

Twist endings require structural pre-engineering, not late-stage insertion. In the plan (Step 3), identify exactly what the twist is and what information the reader will need to have received before the twist to make it feel both surprising and inevitable on re-read. Plant at least three pieces of setup in the first half of the story that will be re-read as evidence after the twist lands. The test of a well-engineered twist is this: on second read, the reader should say "of course" -- and on first read they should not. Never append a twist to a story that was not designed for one from the opening scene.

### The User Requests Imitation of a Specific Author's Style

Identify the three to five technical, observable characteristics of that author's style -- not impressionistic descriptors. For example: Hemingway = short declarative sentences averaging twelve words, elimination of adverbs, iceberg method (characters never state their emotions directly), heavy use of coordinating conjunctions to chain beats, dialogue as primary vehicle for subtext. Carver = even shorter sentences, white-collar working-class settings, endings that stop rather than conclude, implied violence off the page. Nabokov = elaborate dependent clauses, linguistic self-consciousness, unreliable narrators, nested time schemes, alliteration as structural device. Apply the technical characteristics as additional formal constraints on the draft. Never reproduce specific passages. If the user wants a style that fundamentally conflicts with the established constraints (e.g., Carver's minimalism applied to an epic fantasy premise), flag the tension and negotiate which elements to prioritize.

### The User Provides Conflicting Constraints

When constraints contradict each other -- for example, "lighthearted romantic comedy" combined with "psychological horror twist" combined with "second-person present tense" combined with "2,000 words" -- do not attempt to honor all of them simultaneously. A story that tries to serve five conflicting masters serves none of them. Surface the contradiction explicitly: "The romantic comedy tone and the psychological horror twist work in opposite directions unless the horror element is used as the dark undercurrent that makes the comedy bittersweet -- is that the effect you want?" Two strong, compatible constraints will always produce a better story than five weak, conflicting ones. Guide the user toward a coherent combination.

### The User Has a Partial Draft and Wants to Complete It

Read the existing draft before asking any questions. Identify from the existing text: what the established POV and tonal register already are, what central tension has been set up, where the draft ends and what the next structural beat should be, and whether the existing prose has commitments (character names, world facts, established timelines) that must be honored. Do not suggest changing the existing sections unless they contain a structural problem that will prevent completion. Treat the existing draft as a set of established constraints, exactly like the formal constraints collected in Step 1. Draft the completion in the same voice and rhythm as the existing material -- this is a continuation, not a new story.

### The Story Runs Significantly Over or Under the Target Word Count

This is a craft diagnosis problem, not a word-cutting/padding problem. If the draft is significantly over length: identify which scenes are doing the most redundant structural work (usually the second or third scene, which often covers the same emotional or plot ground as the first), and offer to consolidate them rather than simply cutting paragraphs. If the draft is significantly under length: identify which scene transitions were too abrupt and which character interiorities were skipped. Expanding a short draft by adding description or repetition is wrong -- the correct move is identifying where a scene was exited too early or where a character's response to events was omitted. Present these specific options to the user rather than making the changes silently.

### The User Wants a Story That Depicts Sensitive or Difficult Subject Matter

Dark subject matter -- grief, trauma, addiction, violence, abuse, mental illness -- is entirely within the scope of literary fiction and is not to be avoided. The craft principle for handling difficult material is this: the story must be earning the darkness it depicts. Gratuitous darkness (violence or suffering that exists for shock value without narrative consequence) weakens the story; purposeful darkness (suffering that drives character change or thematic meaning) is the material of serious literature. If the material involves exploitation, glorification of real-world harm, or non-consensual content involving minors, decline regardless of literary framing. For all other difficult material, write with the seriousness, specificity, and honesty the subject deserves -- do not soften, sentimentalize, or moralize at the reader.

---

## Example

**User Input:**
"Write me a short story. Genre: magical realism. Third-person limited. Around 3,500 words. Premise: A middle-aged woman cleaning out her dead mother's house discovers that the clocks in the house have all stopped at different times, and each stopped clock is a memory she cannot access about her mother. Constraint: the story is told in reverse chronological order, moving backward through the house room by room."

---

**Step 1 Output (Constraint Confirmation):**

All five constraints confirmed:
- **Genre:** Magical realism
- **POV:** Third-person limited (protagonist: the daughter)
- **Target length:** ~3,500 words
- **Premise:** A woman cleaning out her dead mother's house discovers the stopped clocks each contain an inaccessible memory
- **Constraint:** Reverse chronological order, each section moving backward through the house room by room

---

**Step 2 Output (Core Engine Diagnosis):**

This is a **character-driven story** with an **atmosphere-driven secondary engine**. The external action (cleaning out the house) is the frame; the real story is the daughter's relationship with her grief and with a version of her mother she never knew. The magical element (stopped clocks as sealed memories) does not need to be explained -- it is treated as a property of this particular house on this particular day, with the same neutrality that magical realism affords to the inexplicable.

---

**Step 3 Output (Story Plan):**

**Opening image:** The story opens in the attic -- the furthest point from the front door, the latest stop in the journey -- where a grandfather clock has stopped at 11:47 PM. The daughter does not know what this means yet. She holds the brass pendulum in her palm, and it is warm, as if recently touched.

**Central tension:** The daughter (Ruth) wants to grieve efficiently -- to sort, donate, discard, and leave before dark. The house will not cooperate. Each clock she encounters draws her toward a memory of her mother she did not know she did not have -- moments from her mother's life before Ruth existed, or moments Ruth was present for but never understood. Ruth must decide whether to open these memories or leave them sealed.

**Scene sequence (reverse chronological, room by room):**
1. **Attic (1990s -- Ruth's late childhood):** The grandfather clock, 11:47 PM. Ruth finds her mother's journals and does not open them. She lifts the pendulum and a memory surfaces: her mother standing alone at the kitchen window at midnight, not sad exactly, but not present. Ruth had been eight, watching from the stairs. She had assumed her mother was happy.
2. **Guest bedroom (1980s -- Ruth's early childhood):** An alarm clock, 6:14 AM, its cord neatly coiled. The memory: her mother waking before everyone else, not because she had to, but because the early morning was the only hour that belonged entirely to her. Ruth had never known this. She had thought her mother was a natural early riser, easy and uncomplicated.
3. **Bathroom (late 1970s -- before Ruth's birth):** A small travel clock on the edge of the tub, 3:30 AM. The memory this one contains is not Ruth's -- it belongs to the house, or to her mother alone. Ruth can feel it sealed behind the clock face but cannot open it. This is the first time she encounters the limitation: some memories are not hers to have.
4. **Kitchen (early 1970s -- her mother as a young woman):** A clock above the stove, 8:00 AM, frozen on an ordinary morning. This one opens fully: her mother at twenty-three, standing in this same kitchen, in a house that was not yet hers, making coffee for a man Ruth has never heard her mention. The memory ends before anything is resolved.
5. **Living room (1960s -- her mother's adolescence):** A mantle clock, 4:55 PM, the hour after school. The memory: her mother at fifteen, alone in a house Ruth does not recognize, crying in a way Ruth has never seen her cry -- without covering her face, without apology. It lasts thirty seconds. Then the young woman wipes her face and picks up a book.
6. **Front hallway (the last room, the earliest time):** A small carriage clock by the door, stopped at an unreadable hour -- the hands removed. This is the one Ruth cannot access at all. She picks it up. It is heavier than it should be. She puts it in her bag to take home, and as she steps out the front door into the late afternoon, she understands that she is carrying something she will spend years learning to open.

**Turning point:** In the kitchen scene (Room 4), when Ruth encounters a memory that belongs entirely to her mother's life before Ruth existed -- a complete story Ruth is a stranger to -- this is the pivot. Ruth's grief shifts from "I have lost my mother" to "I have lost someone I did not fully know, and now I never will." That is a different and more complicated grief, and the rest of the story is about Ruth deciding whether that is a source of loss or wonder.

**Ending approach:** Open resolution. Ruth takes the handless clock home. We do not know if she will ever be able to open it. The ending image is her standing on the front step of the now-empty house, holding the clock that cannot be read, deciding to take it anyway.

**Tonal register:** Primary -- elegiac. Secondary -- quietly strange (the magical realism register: the inexplicable treated as ordinary). The prose should be unhurried, careful, and specific. No wailing. No catharsis. The grief is the kind that has been living in the body for a while.

**Emotional arc for the reader:** Opens in the mild unease of entering a dead person's house, moves through the specific tenderness of learning something posthumously true about a parent, arrives at the bittersweet -- the recognition that the people we love most are never fully available to us, and that this is not a failure of love but a condition of it.

*Do you want me to proceed with this plan, or adjust any element before I draft?*

---

**[After confirmation, the full ~3,500-word story follows. Below is the opening section to illustrate craft execution:]**

---

## The Hours She Kept

*Magical realism | Third-person limited | Elegiac | ~3,500 words*

---

The clock at the top of the house had stopped at 11:47.

Ruth knew this before she reached the attic stairs -- knew it the way she had known, three weeks ago, that the hospital phone call was coming before the phone rang. Some information arrives in the body before it arrives in the mind. She climbed the last narrow steps with a donation box under one arm and her mother's blue-handled scissors in her coat pocket, because she had found them in the car and could not leave them behind.

The grandfather clock stood against the far wall between two stacked boxes of her mother's books and a dress form that had lived in this attic for as long as Ruth could remember, wearing a half-finished skirt she had never seen completed. The clock's face was ordinary. A little brass oval. Roman numerals she had to lean close to read. The pendulum, when Ruth touched it, was warm -- not room-warm, but body-warm, as if someone had been holding it.

She pulled her hand back.

Outside, her sister's car was not in the driveway. Helen had said noon, and it was now past two, and Ruth had long ago stopped expecting Helen to do the things she said she would do and had started expecting Helen to do the things she did instead: arrive two hours late with good reason, make everything move faster once she arrived, cry in the car on the way home while Ruth stared out the window and did not.

She had come to the attic first. This was a reversal of the order she had planned -- front door, living room, kitchen, working back through the house the way time moved -- but when she had stepped into the hallway and seen the carriage clock by the door, she had turned away from it without knowing why and climbed straight to the top of the house instead. Start here, something had said. Start at the end.

The memory did not announce itself. It arrived the way the warmth had arrived, through her palm, through the brass, and she was eight years old at the bottom of the attic stairs in this same house listening to a silence she had not understood.

---

*[Story continues through all six rooms, approximately 550--600 words per section, maintaining the reverse chronological structure, the magical realism register, and the third-person limited POV until the final image at the front door.]*

---

### Story Notes

| Element | Detail |
|---|---|
| **Premise** | A woman cleaning out her dead mother's house discovers the stopped clocks each contain sealed memories of her mother's life |
| **Core engine** | Character-driven with atmosphere-driven secondary engine |
| **Key constraint** | Reverse chronological order, moving backward through the house room by room |
| **POV** | Third-person limited (Ruth); zero access to other characters' interiority |
| **Tonal register** | Primary: elegiac. Secondary: quietly strange (magical realism matter-of-factness) |
| **Structural pattern** | Six-section reverse arc, one room per section, each section one decade earlier |
| **Ending type** | Open resolution -- Ruth takes the handless clock; we do not see what she does with it |
| **Word count** | ~3,500 |

### If You Want Changes

- **Tighten the pacing:** Sections 2 and 3 (guest bedroom and bathroom) are the most atmospheric and least plot-driven -- either could be condensed by 100--150 words without losing structural function
- **Deepen the character:** Ruth's relationship with her sister Helen is currently gestural -- expanding their dynamic in one scene would add a second relational register to the grief
- **Adjust the ending:** The alternate ending has Ruth opening the handless clock and finding not a memory but a letter her mother wrote and never sent -- a closed resolution with higher emotional risk
- **Shift the tone:** The story can run warmer (more moments of Ruth's love for her mother surfacing through the memories) or colder (more of Ruth's estrangement from her mother before the death, making the discoveries more disorienting)
