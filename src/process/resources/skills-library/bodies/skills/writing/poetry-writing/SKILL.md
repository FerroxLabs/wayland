---
name: poetry-writing
description: |
  Writes poetry across forms (sonnet, free verse, haiku, villanelle, ghazal, ode, elegy) with constraint-first design requiring form, theme, tone, and formal constraints before drafting.
  Use when the user asks to write a poem, compose verse, create poetry, or work in a specific poetic form.
  Do NOT use for song lyrics (different structure), prose poetry that is really flash fiction (use flash-fiction), or literary analysis of existing poems.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "creative-writing writing analysis"
  category: "writing"
  subcategory: "creative-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Poetry Writing

## When to Use

**Use this skill when:**
- The user asks to write, compose, or draft a poem in any named or unnamed form -- including sonnets (Shakespearean, Petrarchan, Spenserian), haiku, villanelle, ghazal, ode (Horatian, Pindaric, irregular), elegy, pantoum, terza rima, sestina, triolet, rondeau, concrete/visual poem, prose poem, or open/free verse
- The user wants help with a specific poetic challenge -- meter and scansion, building a volta, choosing a refrain, managing a rhyme scheme, finding the right image for an abstraction
- The user needs verse for a specific occasion -- memorial, wedding, graduation, anniversary, eulogy -- where a poem will be read aloud to an audience
- The user wants to write in the style or tradition of a specific poet or movement (Confessional, Imagist, New York School, Language Poetry, Harlem Renaissance) and needs craft techniques, not imitation
- The user asks to revise or improve an existing poem they have drafted -- tighten lines, strengthen imagery, fix a broken stanza, diagnose why a poem "isn't working"
- The user wants to write a sequence or crown -- a series of related poems that form a larger unit, requiring structural planning across multiple pieces
- The user wants an ekphrastic poem (written in response to a visual artwork) or a conceptual constraint poem (erasure, acrostic, abecedarian, anaphoric)

**Do NOT use this skill when:**
- The user wants song lyrics -- lyrics are structured around bars, hooks, verses, and chorus repetition designed for musical phrasing, not poetic line breaks; use `lyric-writing` instead
- The user wants prose poetry that is essentially flash fiction -- lyric compression is not the goal, narrative and scene are; use `flash-fiction` if the piece is under 1,000 words with a story arc
- The user wants literary analysis of existing poems -- close reading, meter analysis, comparison of two poems -- use `literary-analysis` instead
- The user wants a wedding speech, eulogy speech, or toast that may contain a quoted poem but is fundamentally a speech; use `personal-speech`
- The user wants marketing copy written to sound "poetic" -- brand taglines, ad copy, inspirational social media text; this is copywriting, not poetry
- The user asks for a greeting card sentiment -- if the goal is a 2-4 line generic rhyming message, the task is copywriting, not poetry craft; clarify whether they want actual poetry first

---

## Process

### 1. Gather the Four Foundational Constraints Before Writing a Single Line

Poetry is built from constraints. The more precisely constraints are defined, the better the poem. Before drafting anything, establish:

- **Form:** Is this a fixed form (sonnet, villanelle, ghazal, pantoum, sestina, terza rima, haiku)? A received form used loosely (ode, elegy, lyric)? Or open/free verse? Each carries its own structural logic.
  - If the user says "just write a poem," default to free verse with tight imagistic compression, but still gather theme and tone.
  - If the user names a form, confirm which variant: Shakespearean sonnet (ABAB CDCD EFEF GG, three quatrains plus couplet) vs. Petrarchan (ABBAABBA + sestet, octave/sestet division, turn at line 9) vs. Spenserian (ABAB BCBC CDCD EE, interlocking rhyme).
  - If the user wants a ghazal, confirm they understand the form's conventions: 5-12 couplets (sher), each couplet self-contained and end-stopped, a radif (refrain word or phrase) preceding the qafia (rhyme), and a maqta (signature couplet) in which the poet names themselves, often obliquely.

- **Theme:** The subject is not the theme. "My grandmother" is a subject. "The way objects outlast the people who loved them" is a theme. Push the user from subject to tension. The tension between two opposing truths is what a poem explores.
  - Ask: What does the poem want to argue, discover, or resist? What does it not know at the start that it knows (or refuses to know) at the end?

- **Tone:** Tone is the speaker's emotional stance toward the material. Identify it precisely:
  - Not just "sad" but: elegiac (mourning with formal distance), keening (raw grief), stoic (controlled acknowledgment of loss), wry (ironic distance from pain), mournful-tender (grief suffused with love), celebratory-melancholic (joy shot through with awareness of transience)
  - Tone mismatches are a primary source of poem failure -- a tender subject handled flippantly, or a comic subject handled with unearned gravity

- **One Formal Constraint Beyond the Form:** This is the creative engine. A constraint forces invention. Examples: every stanza must begin with a color; no word may repeat; every sentence must be a question; all imagery must come from the kitchen; the poem must not name its subject directly; every line must be exactly seven syllables regardless of form; the only verbs allowed are forms of "to be" and "to hold."
  - If the user offers no constraint, propose one that serves the theme: a poem about memory might constrain itself to images of sound only; a poem about grief might forbid the word "death."

### 2. Determine and Map the Formal Architecture

For fixed forms, map the structure before drafting. Treat this as a blueprint:

- **Shakespearean Sonnet:** 14 lines, iambic pentameter (10 syllables, da-DUM x5), rhyme scheme ABAB CDCD EFEF GG. The volta traditionally lands at the couplet (lines 13-14), though a strong sonneteer places a secondary volta at line 9. The couplet must be a pivot, not a summary.
- **Petrarchan Sonnet:** 14 lines, iambic pentameter, octave (ABBAABBA) poses the problem, sestet (CDECDE or CDCDCD) resolves or complicates it. The volta at line 9 is the architecture's hinge -- the poem earns it by making the octave's tension strong enough to demand resolution.
- **Villanelle:** 19 lines, 5 tercets + 1 quatrain. Two refrains (A1 and A2) alternate as the third line of each tercet, then appear together as the final couplet. Rhyme scheme: A1bA2 / abA1 / abA2 / abA1 / abA2 / abA1A2. The refrains must be syntactically stable enough to stand alone but semantically flexible enough to shift meaning with each repetition. Write the refrains first -- they are the load-bearing walls.
- **Ghazal:** Each couplet is a separate lyric universe, connected by radif and qafia but not by narrative. The disconnection is the form's beauty. Minimum 5 couplets, maximum 12. The maqta in the final couplet names the poet. Write each couplet as if it must stand alone.
- **Pantoum:** Quatrains. Lines 2 and 4 of each stanza become lines 1 and 3 of the next. Final stanza retrieves lines 1 and 3 of the first stanza as its lines 2 and 4, completing the loop. This form enacts obsession and return -- choose subject matter that benefits from that recursive quality.
- **Sestina:** 39 lines + 3-line envoi. Six stanzas of six lines each, no rhyme, but six end-words rotate through a fixed pattern across stanzas (1-2-3-4-5-6, then 6-1-5-2-4-3, then 3-6-4-1-2-5, then 5-3-2-6-1-4, then 4-5-1-3-6-2, then 2-4-6-5-3-1). The envoi uses all six words, three per line. Choose end-words that are semantically rich and syntactically flexible (nouns that can function as verbs, words with multiple meanings).
- **Haiku:** 5-7-5 syllables across three lines. Traditional haiku requires a kigo (seasonal reference word) and a kireji (cutting word/pause -- often rendered in English as a dash or line break). The poem juxtaposes two images; the turn happens between them. The juxtaposition should create a spark of meaning that neither image generates alone.
- **Free Verse:** No fixed syllable count or rhyme scheme, but still requires internal architecture. Decide the line-break logic: breath-based, syntactic unit-based, or imagistic (each line contains one complete image). Free verse without an organizing logic is prose with line breaks -- identify the logic and apply it consistently.

### 3. Assemble the Poem's Core Materials Before Drafting

Before writing the first line, identify:

- **The central image:** One concrete, sensory image that embodies the poem's theme. This is not the poem's subject -- it is the image the poem will build around. "The threshold with a different lock" can carry "the impossibility of return." The image should be tactile, visual, or sonic -- accessible through the body, not the intellect.
  - Test the image: Could this image appear in a photograph? If yes, it is concrete enough.

- **The volta:** Where does the poem turn? A poem without a turn is a still life, not a poem. The turn is a shift in perspective, tone, emotional register, or logical direction. Know in advance approximately where it lands:
  - In a 14-line sonnet: line 9 (Petrarchan) or line 13 (Shakespearean)
  - In a haiku: between lines 2 and 3 (the kireji)
  - In free verse: roughly two-thirds through the poem (set up the turn, then deliver it, then allow a short landing)
  - The turn can be a reversal, a complication, a question, an acceptance, a refusal -- anything that changes the angle

- **The last line:** Often useful to know the last line or its register before beginning. The last line carries disproportionate weight. It should end on a word, image, or syntactic structure that leaves resonance, not closure. Poems that end with summary ("And so I learned to love again") fail. Poems that end with image or action ("The window held the shape of what had been") succeed.

- **Sound palette:** What sonic textures serve this poem's tone? Hard consonants (k, g, t, d, p, b) create tension and percussive force. Soft consonants (l, m, n, s, sh, f) create ease and intimacy. Vowel sounds: long vowels (oh, ah, ay) slow the poem; short vowels (i, e, u) accelerate it. Identify 2-3 sound textures that belong to the poem's emotional register.

### 4. Draft the Poem -- Line by Line with Discipline

Write the complete draft:

- **Open on action or image, never abstraction.** The first line must create a scene, a sensation, or a situation. "The morning she left, the radiator ticked" -- not "Loss arrives without warning."
- **Enjambment vs. end-stopping:** Enjambment (the sentence continues past the line break) creates momentum and creates meaning by the unexpected word that arrives at the start of the next line. End-stopping (the line ends where a phrase or sentence ends) creates emphasis and weight. A poem that end-stops every line feels like a list. A poem that enjambs every line feels breathless. Vary deliberately.
- **Line length as rhythm:** Longer lines slow the reader, create room for accumulation. Shorter lines accelerate, create isolation. A sudden short line after a sequence of long lines is a formal detonation -- use it for the volta or the most important image.
- **Meter in fixed forms:** Scan each line for iambic pentameter (or the form's required meter) using the standard mark-up: unstressed syllables as ∪, stressed as /. Acceptable substitutions: a trochee (/ ∪) at the start of a line (trochaic substitution), a spondee (/ /) for emphasis, a feminine ending (adding an unstressed syllable at line's end). Avoid three consecutive unstressed syllables (tribrachic run) -- the line loses its pulse.
- **In free verse, count the pressure points:** Even without formal meter, each line has a strongest word -- the word that carries the most weight. That word should fall at the line's end or its beginning. Burying a poem's pressure points in the middle of long lines is a structural failure.
- **Each stanza is a unit of thought:** A stanza break is like a paragraph break but more charged. It signals a shift in angle, image, or time. If two stanzas cover the same emotional or logical ground, one should be cut or merged.

### 5. Apply the Abstraction Audit

After completing the draft, systematically identify and address every abstraction:

- Circle every abstract noun: love, loss, grief, hope, beauty, truth, freedom, joy, sorrow, pain, longing, eternity, meaning, wonder, memory
- For each circled word, apply the substitution test: What concrete image, action, or physical detail embodies this abstraction in this specific context?
  - "Grief" becomes: the unwashed coffee cup she left on the windowsill, the four rings of dried coffee inside it
  - "Love" becomes: the way he always checked that her car door had fully closed before walking away
  - "Memory" becomes: the smell of cedar closets, the specific pitch of a screen door's spring
- Abstract nouns are not automatically forbidden -- sometimes naming an abstraction directly is the move (after the poem has earned it through accumulated concrete image). But "earning" requires at least three concrete images before the abstraction lands.
- Also audit adjectives: "beautiful," "terrible," "profound," "incredible" are abstraction in adjectival form. Replace with the specific quality that makes the thing beautiful or terrible in this poem's world.

### 6. Run the Four Technical Checks

Before finalizing, verify:

- **Form compliance check:** For fixed forms, count every syllable in every line, verify every rhyme against the scheme, confirm every structural element (refrain placement in villanelle, maqta in ghazal, end-word rotation in sestina). A Shakespearean sonnet with 13 lines is not a sonnet with a flaw -- it is not a sonnet.
- **Line-break audit:** Read each line ending aloud in isolation. The last word of every line receives emphasis. If a line ends on "the," "a," "and," "of," "to," "in" -- it is almost certainly an error. These function words carry no pressure. End lines on nouns, verbs, adjectives -- words that can bear the weight of a pause.
- **Music test:** Read the entire poem aloud three times. First for sense, second for sound, third for rhythm. Note where the tongue stumbles (a consonant cluster that doesn't work), where the rhythm flags (three unstressed syllables in a row without intention), where a rhyme sounds forced (a sound that was hunted rather than found).
- **Cliché scan:** Check every comparison and image. Common failures: "like a knife," "burns like fire," "dark as night," "light at the end," "heart of stone," "time heals," "broken wings," "shining star." If the image arrived effortlessly, treat it with suspicion. Original imagery requires resistance -- it is the thing you think of after the cliché has been rejected.

### 7. Revise -- Subtract Before You Add

Revision in poetry is primarily subtractive:

- **The one-cut test:** Which single line, if removed, would make the poem stronger? Usually this line is the poem explaining itself -- the line where the speaker summarizes what the imagery already said. Cut it.
- **The first-stanza question:** First stanzas are often warm-ups -- the poet finding the poem. Ask: Does the poem actually begin in stanza 2? If so, cut stanza 1.
- **The adjective ratio:** Count adjectives. If more than one adjective modifies each noun on average, the poem is over-decorated. Trust the nouns. Trust the verbs. Reduce adjectives to those that carry genuine surprise or specificity.
- **The verb strength audit:** Identify all linking verbs (is, are, was, were, be, been, being, seem, appear, become). Each one is an opportunity to replace with a stronger, more active verb. "The shadow was long" vs. "The shadow stretched into the neighbor's yard." Transitive, active, specific verbs carry the poem's energy.
- **Syllabic fine-tuning for fixed forms:** In iambic pentameter, after cutting and revising, rescan all lines. Substitutions (trochee, spondee, pyrrhic) are legitimate tools, but more than two substitutions per line destabilize the meter. Lines with no substitutions can sound mechanical -- perfect regularity is also a problem.

### 8. Present the Poem with Craft Transparency

Deliver the poem in the specified output format, with craft notes that allow the user to understand and learn from the choices made. Do not over-explain -- the notes should point to specific lines, not summarize what the poem "means." Offer to revise any element the user wants to rework.

---

## Output Format

```
## [Poem Title]

*Form: [Form name and variant] | Theme: [Theme stated as tension, not subject] | Tone: [Precise tone descriptor] | Constraint: [The formal constraint and how it operated]*

---

[Poem text]

[Stanza break -- blank line between stanzas]

[Second stanza]

[Continue through complete poem]

---

### Craft Notes

**Form compliance:**
[Specific verification -- rhyme scheme, syllable counts for any line in question, structural elements confirmed. For sonnets: note the volta's location. For villanelles: confirm refrain placements. For haiku: confirm syllable count per line and identify the kigo and kireji.]

**Volta / Turn:**
[Line number and exact mechanism of the turn -- what shifts, from what to what, and why it earns the shift]

**Central image:**
[The image, quoted from the poem, and what conceptual or emotional weight it carries]

**Sound architecture:**
[Rhyme scheme if applicable. Key instances of internal rhyme, assonance, consonance, alliteration -- not listed exhaustively but pointed at most effective moments. Dominant sound textures (hard/soft consonants, vowel palette).]

**Formal constraint execution:**
[Confirm the constraint was applied and note any places where it created unexpected inventions]

**One line to notice:**
[Single out one line and explain its craft -- the specific choice that makes it work]

**Revision options:**
[One or two specific alternatives the user might consider if they want to adjust tone, form, or imagery -- not "you could change anything," but specific targeted options]
```

---

## Rules

1. **Never open on abstraction.** The first line must deliver a concrete image, action, or sensory detail. "Love is a country I keep leaving" fails on rule 1 -- "Love" is abstract and the metaphor is worn. "The kitchen smelled of burnt sugar and her particular silence" succeeds -- concrete, sensory, charged.

2. **Never force a rhyme word.** If achieving a rhyme requires inverting natural syntax ("upon the hill so green / the fairest could be seen"), choosing a weaker word, or altering the poem's meaning, choose slant rhyme instead. Slant rhyme -- near-rhyme, consonance rhyme, or assonance rhyme -- is not a failure; it is a craft choice. "Stone / alone," "love / move," "moon / mourn" are acceptable slant rhymes with more tension than their perfect-rhyme equivalents.

3. **A sonnet with 14 lines that do not scan as iambic pentameter is not a sonnet.** Fix the meter or do not call it a sonnet. The same applies to every fixed form: a villanelle without its refrains is a 19-line poem, not a villanelle; a haiku that is 5-7-6 is not a haiku.

4. **Never end on a moral, lesson, or emotional summary.** Final lines that tell the reader what to feel, what the poem meant, or what lesson was learned kill the poem's resonance. The last line should be an image, a question, an action, or a syntactic structure that opens rather than closes. If the last line could appear on an inspirational poster, rewrite it.

5. **Every poem must have a volta -- a turn.** The turn does not need to be violent or dramatic, but the poem at its end must occupy a different emotional or logical position than it did at its beginning. A poem that begins with grief and ends with grief, in exactly the same register, is not a poem -- it is a lament that hasn't discovered what it thinks about grief.

6. **Do not confuse free verse with prose.** Free verse requires a principled line-break logic. Apply one and apply it consistently. If lines break at breath points, they must break at breath points throughout. If they break at syntactic boundaries, maintain that throughout. Mixed or random line breaks signal that the writer doesn't know why each line ends where it ends -- and the reader will feel that uncertainty as formlessness.

7. **Occasion poems (memorial, wedding, eulogy) must contain specific details.** Ask for: one specific memory, one physical detail, one habit or gesture of the person, or one place. "She loved the ocean" is not a specific detail. "She kept a jar of Atlantic sand on her desk and shook it when she was thinking" is specific. Generic occasion poems are interchangeable. They fail the person they honor.

8. **In a villanelle, write the two refrain lines before writing anything else.** The refrains must carry enough semantic weight to justify 19 repetitions across the poem (A1 appears 6 times, A2 appears 5 times). If the refrain is a generic sentiment, the villanelle cannot be saved by the middle stanzas. Test the refrain: Does it change meaning depending on what precedes it? If not, rethink it.

9. **Check the verb-to-adjective ratio.** Strong poems are verb-driven. If a draft contains more adjectives than verbs, the poem is describing instead of enacting. Verbs carry action, time, transformation -- the things poetry does that prose cannot do as efficiently. "The leaves fell" has one verb and no adjectives. "The beautiful, golden, rustling autumn leaves drifted slowly down" has five adjectives and one weakened verb. The first is poetry; the second is decoration.

10. **Sound is not decoration -- it is structure.** Assonance, consonance, internal rhyme, and alliteration should connect the poem's most important words. If the sonic texture connects minor words while the key words float free of the sound pattern, the structure is inverted. Map the poem's most important three words and verify they are embedded in the poem's sonic architecture.

11. **In a ghazal, each couplet must be able to stand alone.** If removing a couplet requires re-reading the others for comprehension, the ghazal has failed its form. Each couplet is a complete lyric unit. The connection between couplets is made through the radif/qafia and through thematic resonance, not narrative logic.

12. **For a sestina, choose end-words with syntactic flexibility.** Words that function as only one part of speech (e.g., "beautiful" can only be an adjective; "run" can be noun or verb; "light" can be noun, verb, or adjective) determine whether the sestina is trapped or alive. If end-words cannot shift syntactically across six stanzas, the poem will feel mechanical. Test each of the six words before beginning: can it appear in six different grammatical functions?

---

## Edge Cases

### The User Wants a Haiku but Doesn't Understand the Form

Many users believe haiku is simply "three short lines about nature." Clarify the form's requirements without being pedantic:
- 5-7-5 syllable count (confirm: "syllable" not "word")
- A kigo (seasonal or natural reference) that grounds the poem in physical time -- "cherry blossom," "first frost," "cicadas," "harvest moon"
- A kireji, the cutting moment -- in Japanese this is a specific grammatical particle (ya, kana, keri); in English it is rendered as a dash, an ellipsis, a line break that creates a pause, or a shift in grammatical subject between lines 2 and 3
- The juxtaposition: two images or observations that create meaning in their collision. The haiku does not explain the connection -- the connection sparks in the gap
- If the user wants to follow contemporary English haiku conventions (which often relax syllable count but preserve juxtaposition and brevity), confirm this preference first

### The User Wants a "Simple Rhyming Poem" for a Child

Do not apply adult-poem complexity constraints. A children's poem has legitimate craft requirements of its own:
- Anapestic or trochaic meter (da-da-DUM or DUM-da) creates the bouncing rhythm children expect and enjoy -- iambic pentameter feels adult and flat to young readers
- Perfect rhyme is preferred over slant rhyme for young audiences -- the sonic satisfaction of an exact rhyme is part of the poem's function
- Concrete, funny, surprising imagery at a child's experiential level -- snails, sandwiches, socks, rain puddles, pets
- Active voice, present tense, second person ("you") draws children in
- Keep stanzas to quatrains; keep each quatrain as a complete unit; keep total length to 8-16 lines for short-form children's verse
- Avoid sentimentality or adult emotional logic presented as childlike ("treasure each moment")

### The User Wants to Write in the Style of a Specific Poet

This is a craft exercise, not imitation. Identify the poet's specific formal fingerprints and apply them as constraints:
- **Emily Dickinson:** Hymn meter (common meter: 8-6-8-6 syllable alternation, quatrains), slant rhyme in preference to perfect rhyme, dashes as syntactic pivots and breath marks, capitalization of significant nouns, compressed syntax that removes transitional words, predilection for death, immortality, and domestic imagery
- **Walt Whitman:** Anaphoric catalogs (parallel "I" or noun constructions across long lines), long Hebraic lines without end-rhyme, apostrophe (direct address to America, to the reader, to the body), democratic accumulation of common and extraordinary in the same breath
- **Sylvia Plath (late Ariel period):** Short tercets or irregular stanzas, controlled mania in imagery, mythological references undercut with domestic specificity, hard k/g/t sounds, color as violence (white, red, black), the confessional speaker in extremis
- **Frank O'Hara (New York School):** First-person conversational speaker, references to specific people and places by name, present-tense action, celebration of the mundane and urban, no symbolism or allegory, direct statement over metaphor, speed and lightness
- **Pablo Neruda (Odes):** Odes to humble objects (an onion, a pair of socks, a tomato), apostrophe (direct address to the object), long flowing lines, sensory abundance, catalogs of physical qualities, ecstatic wonder as the default register
- Never copy specific phrases or lines. Apply the formal techniques as a constraint framework.

### The User Provides a Draft and Asks for Revision Help

Treat this as a diagnostic task before a writing task:
- Read the draft once for overall impression, once for formal analysis
- Identify the poem's strongest 2-3 lines -- name them specifically; these are what to protect
- Identify the single most significant problem: Is it the abstraction level? The form failure? The weak volta? The forced rhymes? One primary diagnosis, not a list of everything wrong
- Propose specific alternative language for one weak line -- show, don't just tell
- Ask whether the user wants structural revision (rearranging, cutting stanzas), line-level revision (refining specific lines), or both
- Do not rewrite the entire poem unless asked -- revision assistance preserves the user's voice; wholesale rewriting replaces it

### The User Wants a Long Poem (50+ Lines)

Structure becomes paramount at length. A 60-line poem without internal architecture is not a long poem -- it is a short poem that doesn't know when to stop:
- **Sequence:** A series of numbered or titled sections, each a complete poem, connected by theme and returning images. Each section should be able to stand alone. Length comes from depth across sections, not from exhausting a single lyric thread.
- **Crown of sonnets:** Seven Shakespearean or Petrarchan sonnets in which the last line of each becomes the first line of the next, and the last line of the seventh repeats the first line of the first. This is a master-level form -- only recommend it if the user understands and wants the challenge.
- **Ode in Pindaric structure:** Three-part (strophe, antistrophe, epode) repeating sections. The strophe and antistrophe mirror each other metrically; the epode differs. This structure allows length without formlessness.
- **Free-verse meditation with recurring motifs:** Identify 3-5 images or phrases that will recur across the poem's length, evolving in meaning with each appearance. The recurring motifs provide architecture. Plan their placement before drafting.

### The User Wants an Ekphrastic Poem (Responding to an Artwork)

Ekphrasis (poetry written in response to a visual work) has specific craft requirements:
- The poem must do something the image cannot do: move through time, inhabit a perspective the image excludes, speculate on what happened before or after, give voice to a figure in the image, or refuse what the image offers
- Do not merely describe what is in the image -- that is ekphrastic description, not ekphrastic poetry
- Three established approaches: (1) Direct address to the artwork or its maker; (2) Dramatic monologue from within the image (speaking as a figure depicted); (3) Meditation that departs from the image to explore what it evokes in the speaker
- Ask the user for specific details from the image: What is in it? What colors dominate? What is the light source? Is there a figure? What is their posture or expression? Ekphrasis fails without specific visual detail.
- The poem should create something the viewer could not experience from the image alone -- add time, add sound, add interiority, add history

### The User Wants the Poem to Rhyme but It Keeps Sounding Forced

This is among the most common craft failures. Diagnose and address specifically:
- **Root cause diagnosis:** Is the rhyme forced because the rhyme scheme is too rigid for the content, or because the line endings are wrong? In many cases, moving from couplet rhyme (AABB) to alternating rhyme (ABAB) adds the slack needed to achieve natural syntax while still rhyming.
- **Slant rhyme intervention:** Offer specific slant-rhyme pairs that serve the poem's sonic texture better than perfect rhymes that damage syntax. Present pairs: stone/alone, breath/depth, door/more, water/daughter, love/move/groove, gone/drawn/dawn, blue/through/dew.
- **Internal rhyme alternative:** If end-rhyme continues to force awkward syntax, move the sonic weight inward. Internal rhyme connects the poem's architecture through sound without demanding that every line end on a rhyme word.
- **Write the content first, then find the form:** Have the user write the poem's central idea in natural prose sentences. Then identify which words in that prose already rhyme or slant-rhyme. Build the poem from those organically occurring sound connections rather than reverse-engineering content to fit a rhyme scheme.

---

## Example

**Input:** "Write me a ghazal. Theme: the feeling of loving someone you cannot reach -- distance, not loss. Tone: longing, precise, not sentimental. Constraint: every couplet must contain a specific body of water."

---

**Output:**

## Distances, Kept

*Form: Ghazal (6 couplets + maqta) | Theme: Loving across the unreachable -- distance as the medium of feeling, not its obstacle | Tone: Longing, precise, controlled | Constraint: Each couplet contains a named or typed body of water*

---

I have learned to love you the way a lake loves the sky it cannot touch --
its clouds are never the clouds themselves, but I hold them anyway, such.

The Caspian has no exit to the ocean; it deepens into itself.
I carry what you said last March the same way -- sealed, still, such.

Each tide that pulls from Monterey brings something and takes something.
You are the tide's direction: not the water, not the beach -- the interval, such.

Across the Yellow River the ferry runs twice in dry season, no more.
I count your messages like crossings -- precious, limited, such.

The aquifer never sees the sky and does not call it deprivation.
I have started calling this underground life sustainable, almost: such.

A canal between two cities holds exactly the water it was given.
I am exact: I hold what you offered and mistake nothing for more, such.

-- Here at the reservoir's edge I admit what the water already knows:
that Aziz holds the level steady, never floods, never such.

---

### Craft Notes

**Form compliance:**
Seven couplets including the maqta. Each couplet is syntactically self-contained and end-stopped (ghazal requirement met). The radif (refrain word) is "such" -- a word chosen for its unusual function: it performs completeness, even sufficiency, while carrying an undertone of resignation. The qafia (rhyme preceding the radif) uses a slant rhyme progression through the poem -- "touch/such," "itself/such," "interval/such," "more/such," "deprivation/such," "more/such" -- the slant rhymes are deliberately imperfect, echoing the poem's theme of not quite reaching. The maqta (final couplet) names the poet obliquely as "Aziz," using a proper name that also means "precious" or "dear" in Arabic/Urdu, adding a layer of meaning consistent with ghazal tradition.

**Volta / Turn:**
The turn is architectural in a ghazal rather than linear -- it accumulates across couplets. The clearest turn arrives in couplet 5 (the aquifer couplet): the poem shifts from documenting longing to reconsidering it. "I have started calling this underground life sustainable" marks the speaker's attempt at acceptance -- not achieved, but attempted. The maqta then holds the tension between steady maintenance ("holds the level") and resignation ("never such"), refusing resolution.

**Central image:**
Couplet 4 -- "the aquifer never sees the sky and does not call it deprivation." The aquifer exists beneath, invisible, self-contained, and sustaining. This is the poem's most precise image of loving without access: the water that does not experience its own deprivation because it has no reference for what it lacks. It reframes the poem's longing as not lack but condition.

**Sound architecture:**
The radif "such" creates the ghazal's characteristic sonic return with an unusual word -- most ghazal radifs are nouns or verbs with obvious weight; "such" is a determiner/pronoun whose weight is context-dependent, making each repetition semantically different. Hard consonant sounds (c/k sounds: Caspian, count, crossings, canal, correct) run through the poem's middle stanzas, creating a subtle tension against the open vowel sounds of the water imagery (lake, Monterey, Yellow, aquifer). The maqta breaks both patterns -- "reservoir's edge" introduces softer sounds (r, z, v, s) to land the poem in a quieter register.

**Formal constraint execution:**
Bodies of water across the seven couplets: lake (couplet 1), Caspian Sea (2), Monterey Bay/Pacific tide (3), Yellow River (4), aquifer (5), canal (6), reservoir (maqta). The water types were chosen to escalate: from visible surface water (lake, bay) to hidden water (aquifer) to built/controlled water (canal, reservoir) -- tracking the poem's shift from natural longing to managed self-containment.

**One line to notice:**
"You are the tide's direction: not the water, not the beach -- the interval, such." The line performs its own argument: it strips away the obvious metaphors (you = water, you = shore) and locates the beloved in what cannot be depicted -- the interval, the pull itself, the direction of force rather than any physical thing. The colon and dashes create a progressive clarification that arrives at something grammatically odd ("the interval") but conceptually exact. The word "interval" is from music and physics -- a gap that is also a relationship. It holds without sentimentality.

**Revision options:**
If the radif "such" feels too oblique or British-formal, it could be replaced with "still" (carrying both "motionless" and "nevertheless") or "enough" (performing the poem's attempt at sufficiency). Either change would shift the poem's register: "still" leans more stoic; "enough" leans more resigned. The Monterey couplet is the most conventional in its water imagery -- if a couplet is to be revised for freshness, start there.
