---
name: writing-prompt-response
description: |
  Responds to writing prompts with crafted creative pieces that honor the prompt's constraints while demonstrating narrative skill. Produces focused creative responses in any genre.
  Use when the user provides a writing prompt, creative prompt, story starter, or asks for a creative writing exercise response.
  Do NOT use for full short stories (use short-story-writing), flash fiction under 1,000 words with specific formal constraints (use flash-fiction), or poetry prompts (use poetry-writing).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "creative-writing writing fitness"
  category: "writing"
  subcategory: "creative-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Writing Prompt Response

## When to Use

**Use this skill when:**
- A user provides a writing prompt -- a sentence, scenario, image description, or "what if" -- and wants a completed creative piece in response
- A user gives a story starter ("The morning she found the letter...") and wants you to continue it into a complete scene or piece
- A user is doing a timed writing exercise and wants to see a model response or wants you to respond alongside them
- A user provides a constrained prompt (a specified setting, an unusual POV, a list of required words) and wants to see the constraints honored in practice
- A user wants a creative piece built around a single concept, object, emotion, or image ("Write something about grief using a kitchen as the setting")
- A user is exploring a premise ("What if memory could be sold?") and wants a narrative fragment that proves the premise has life
- A user provides a classic or familiar prompt and wants a subverted, non-obvious interpretation
- A user wants a demonstration of a specific narrative technique applied to a given prompt

**Do NOT use this skill when:**
- The user wants a complete short story with full arc, developed characters, and multi-scene structure -- use `short-story-writing`
- The user wants flash fiction under 1,000 words with specific formal constraints (three-act compression, sudden fiction structure) -- use `flash-fiction`
- The user provides a poetry prompt or wants a poem in response -- use `poetry-writing`
- The user wants to *generate* new writing prompts, not respond to one -- use a prompt-generation approach
- The user wants a multi-chapter outline or novel planning document -- use `plot-outline` or `novel-planning`
- The user is asking for a writing craft lesson without needing a creative piece produced -- use a craft-explanation skill
- The prompt is actually a research question or informational request dressed in creative language ("Write a story that explains quantum entanglement") where the primary goal is accuracy, not narrative craft

---

## Process

### Step 1: Decode the Prompt With Precision

A writing prompt contains multiple layers of signal. Before writing a single word, read the prompt with diagnostic attention.

- **Identify the anchor element** -- the non-negotiable core the piece must contain. In "a lighthouse keeper who has never seen the sea," the anchor is the paradox itself. Every other choice serves that paradox.
- **Identify implied genre signals** -- "a knock at the door" implies thriller or mystery; "the last summer" implies elegy; "she left the key on the counter" implies realism or domestic drama. These signals can be honored or deliberately inverted, but never ignored.
- **Identify the tense of the scenario** -- is the prompt placing you inside an ongoing moment (scene), at the beginning of an event (opening), at the aftermath (reflection), or in a premise state (world-building)? Each requires a different structural entry.
- **Identify what the prompt does NOT specify** -- these are your creative freedoms: POV, character name, time period, specific location, tone. Freedom zones are where craft lives.
- **Count the constraints** -- a prompt with five specific elements (a color, a name, a location, an object, a condition) requires more structural care than a prompt with one. Track every required element in a mental checklist before beginning.
- **Ask the subversion question** -- what is the most expected response to this prompt? Name it explicitly, then set it aside. The second and third interpretations are usually more interesting.
- **Identify the emotional payload** -- what feeling should the reader leave with? Not the theme (which is cerebral) but the felt experience: unease, longing, quiet triumph, absurdist delight. Everything in the piece should build toward that single emotional delivery.

### Step 2: Choose the Governing Interpretation

Every prompt supports multiple valid interpretations. The most important craft decision is choosing the right one -- not the safest, but the one with the most narrative potential.

- **The literal interpretation** -- take the prompt at face value, no subversion. Use when the prompt itself is already strange enough that literalism produces the most interesting result ("The town that forgot Tuesday").
- **The genre-flip interpretation** -- take the prompt's implied genre and deliver it in a different genre. A horror premise played as comedy. A love story told as a thriller. Genre-flip works when the original genre is too familiar.
- **The POV inversion** -- the prompt implies a protagonist, so write from the antagonist's, bystander's, or object's perspective. A prompt about a detective becomes the story told by the murderer's coat.
- **The scale shift** -- the prompt implies personal/human scale, so write it at cosmic or microscopic scale. Or vice versa.
- **The time shift** -- the prompt is set in an implied present; write it as a future memory, a historical artifact, or a moment just before or just after the stated scenario.
- **Commit fully** to whichever interpretation is chosen. Half-committed interpretations produce muddy work. The boldest choice executed cleanly is better than an interesting idea executed tentatively.
- **Document the choice** -- in the post-piece notation, name the interpretation chosen. This gives the user a framework for understanding the craft decision and requesting variations.

### Step 3: Plan the Structural Architecture (90 Seconds, Not 90 Minutes)

Prompt responses do not require full outlines, but they require structural intention. Three elements must be decided before drafting:

- **Entry point** -- where does the piece begin? Options: in medias res (mid-action), at the moment of rupture (the change has just happened), in the established world (before the disruption), or at the aftermath (looking back). In medias res and at the moment of rupture are almost always stronger choices for prompt responses.
- **Ending type** -- decide the ending BEFORE writing the opening. Options: the resonant image (a final sensory detail that carries emotional weight beyond its literal meaning), the withheld reveal (the reader understands something the character does not, or vice versa), the pivot (the final line recontextualizes everything before it), the open question (the piece ends on a deliberate ambiguity that invites the reader to complete the meaning), or the earned beat (the emotional moment you have been building toward, delivered without comment). Never write toward the ending as if you will improvise it -- know where you are going.
- **Length calibration** -- use these thresholds as defaults: single-element prompts (one word, one image) warrant 300-600 words; scene prompts (a situation or moment) warrant 500-900 words; premise prompts (a "what if" or concept) warrant 700-1,200 words; story starter prompts (a first line or opening paragraph) warrant 600-1,000 words. Exceed 1,200 words only when the prompt explicitly invites scope or the user requests length.

### Step 4: Construct the Opening With Precision

The first sentence of a prompt response carries disproportionate weight. It establishes voice, tone, POV, narrative distance, and the implicit promise of what the piece will deliver.

- **The first sentence must perform work** -- it must do at least two of the following: establish voice, create a question in the reader's mind, deliver a surprise, establish a character's specific consciousness, or set a scene with unusual specificity.
- **Forbidden opening moves** -- never open with a character waking up (unless the piece is explicitly about the act of waking); never open with a character looking in a mirror; never open with pure weather description (weather as scene-setting without a human consciousness filtering it); never open with a dictionary definition; never open with a rhetorical question addressed to the reader. These openers signal a lack of craft confidence.
- **Use named specificity immediately** -- "She" is weaker than "Marguerite." "A city" is weaker than "a city that still smelled like the fair, three weeks after the fair had left." Specific, concrete details signal to the reader that this piece is authored, not generated from defaults.
- **Calibrate narrative distance in the first paragraph** -- close third person (deep interiority, sensory immersion) works for emotional, character-driven prompts; distant third (panoramic, slightly ironic) works for premise prompts and dark comedy; first person works when the prompt implies a distinctive, unusual voice.
- **The first paragraph should establish at least one specific sensory detail, one piece of character action or thought, and the emotional register** of the piece.

### Step 5: Draft With Structural Awareness

Writing the body of the piece requires tracking tension, pacing, and the required prompt elements simultaneously.

- **Maintain a single dominant effect** throughout -- every sentence should be in service of the one emotional payload identified in Step 1. A 600-word piece cannot deliver dread AND comic absurdism AND tenderness. Choose one and subordinate the others.
- **Plant required prompt elements organically** -- if the prompt requires "a red umbrella," the umbrella should enter the piece at a narratively significant moment, not be jammed in as an afterthought. If you are 80% through the draft and a required element has not appeared, stop and restructure.
- **Use the three-beat structure for very short pieces**: an establishing beat (the world and its normal), a disruption beat (the thing that changes), and a resonance beat (the aftermath, the implication, the new state). Even 400 words can carry this structure.
- **Vary sentence length as a pacing tool** -- short sentences accelerate. They create urgency. Longer sentences with embedded clauses and subordinate phrases slow the reader down, create a meditative quality, and are useful in moments of reflection or dread where the experience of reading should feel like moving through something thick and significant. Alternate deliberately.
- **Show, do not tell -- specifically** -- "She was angry" is a statement. "She folded the letter along a crease so sharp it could cut" is a demonstration. Every emotional state should have a physical, behavioral, or perceptual correlate.
- **Use white space** -- paragraph breaks are pacing tools. A single-line paragraph in the middle of a dense scene creates emphasis and tempo shift. Use it.
- **Track the required elements checklist** -- before moving to the ending, confirm every required prompt element has appeared.

### Step 6: Construct the Ending With Craft

The ending is not a conclusion. It is a delivery. It delivers the emotional payload the piece has been building.

- **The resonant image ending** -- end on a specific sensory or physical detail that carries more meaning than its literal content. The image should feel both inevitable (emerging from what came before) and surprising (the reader did not see it coming from the beginning). Example: a piece about estrangement ends on "the two coffee cups in the drying rack, facing different directions."
- **The pivot ending** -- the final line recontextualizes the entire piece. Everything the reader understood is now slightly different. Use sparingly -- it can feel like a trick if the piece has not earned it.
- **The withheld reveal ending** -- stop one beat before the expected revelation. Trust the reader to complete the implication. This creates the sensation of the reader participating in the story's meaning rather than receiving it.
- **Never moralize at the end** -- do not state what the piece means. Do not explain the theme. Do not tell the reader what to feel. The ending should produce a feeling, not describe it.
- **Never introduce new characters, concepts, or plot elements in the final paragraph** -- the ending must emerge from what was already in the piece.
- **The test** -- read the final paragraph aloud. If it can be cut without losing anything essential, it should be cut. The piece ends when the work is done, not when a word count is reached.

### Step 7: Quality Review -- The Five-Point Check

Before delivering the response, run a rapid quality check against five criteria:

- **Prompt fidelity** -- is every required element from the prompt present and organically integrated?
- **Opening strength** -- does the first sentence earn the reader's attention? Would you keep reading if you encountered it in a book?
- **Ending resonance** -- does the final line or image stay with you for a moment after you read it?
- **Surprise quotient** -- is there at least one choice in the piece (a character decision, an image, a structural move, a tonal shift) that the reader did not anticipate?
- **Specificity density** -- are there at least three moments of concrete, sensory specificity (names, textures, temperatures, sounds, smells) that the prompt did not provide?

If any of these five fail, identify the specific failure and fix it before delivering.

### Step 8: Deliver the Post-Piece Craft Notation

After the creative response, provide a brief, informed notation -- not a summary, but a craft explanation. This transforms the response from a completed piece into a teaching moment and a foundation for further work.

- **Name the interpretation chosen** and why it was selected over alternatives
- **Identify the most consequential craft decision** in the piece -- the one that made everything else possible
- **Name one or two elements the user could change to produce a fundamentally different piece** -- this invites experimentation and shows the prompt is a living thing, not a solved problem
- **If the piece has expansion potential**, name the specific direction (character development, world-building, plot continuation) and recommend which skill to use

---

## Output Format

```
## [Title of the Piece]

*Prompt: "[Original prompt, quoted precisely]"*

[Creative response -- no headers, no breaks unless deliberately used for narrative effect]

---

**Word count:** [exact count]

**Interpretation:** [Which of the possible interpretations was chosen -- genre-flip, literal, POV inversion, scale shift, time shift -- and in one sentence, why]

**Governing craft decision:** [The single most important structural or stylistic choice that shaped the piece -- the entry point, the narrative voice, the ending type, the tonal register]

**Craft variables:** [Two specific elements the user could change to produce a meaningfully different piece -- e.g., "If this were told in first person by the woman in the photograph rather than the husband, the emotional register would shift from grief to complicity"]

**Expansion path:** [If the piece has development potential, name the direction -- character, world, plot -- and recommend the appropriate skill]
```

---

## Rules

1. **Honor every stated prompt element without exception** -- if the prompt specifies a color, an object, a name, a location, or a condition, it must appear in the piece and must appear in a narratively meaningful way, not as a tag-along detail appended to satisfy the requirement.

2. **Never deliver the most obvious interpretation without first naming it and consciously choosing to use it or discard it** -- obvious interpretations are not forbidden, but they must be chosen deliberately, not defaulted to. A lighthouse prompt does not automatically produce a lonely lighthouse keeper contemplating the sea.

3. **Calibrate length to the prompt, not to a default** -- a single-word prompt rarely warrants more than 600 words; a rich scenario prompt may warrant 1,200 words. Overwriting a prompt is a failure mode, not a demonstration of effort.

4. **The piece must contain at least one surprise** -- a character decision, an image, a tonal shift, a structural move, a piece of dialogue, or a final line that the reader did not expect but, in retrospect, feels inevitable. A piece with no surprises is a transcription, not a creative response.

5. **Voice must be specific and consistent** -- the narrative voice established in the first paragraph must remain coherent through the final line. Voice drift (formal prose that becomes casual mid-piece, or intimate first-person that becomes distant and reportorial) is a craft failure.

6. **Specificity is not optional** -- every scene requires at least three concrete, sensory details that the prompt did not provide. Vague creative writing (a room, a woman, an old house) is a first-draft artifact, not a delivered skill response.

7. **The ending must be earned, not explained** -- the final paragraph should produce an emotional effect in the reader, not describe the effect. "She realized how much she had lost" is an explanation. "She put his coffee mug in the back of the cabinet where she would not see it every morning" is a delivery.

8. **Never open with a character waking, a mirror scene, a weather description unfiltered through character consciousness, a dictionary definition, or a direct address to the reader** -- these are the five forbidden openings in contemporary craft, and they signal that the piece has not found its real beginning.

9. **Never introduce a twist ending that the piece has not earned** -- a pivot ending requires that the recontextualizing information was present (or absent in a meaningful way) throughout the piece. A twist that comes from nowhere is a betrayal of the reader's investment, not a payoff.

10. **Always provide the post-piece craft notation** -- the interpretation, the governing craft decision, the craft variables, and the expansion path. This transforms a single creative output into a consultative creative exchange and gives the user the tools to understand and develop what was produced.

11. **Do not moralize, thesis-state, or editorialize within the piece** -- the work's meaning should be contained in its images, actions, and structure, not stated in summary sentences. The reader constructs meaning from evidence; the piece provides the evidence.

12. **POV must be consistent** -- do not slip between first, second, and third person. Do not shift the focalized character within a scene without a clear structural signal. POV violations break narrative immersion more effectively than almost any other technical error.

---

## Edge Cases

### The Extremely Vague Prompt ("Write something creative")

Do not respond with a generic piece. The absence of constraint is itself a creative problem to solve. Respond in one of two ways: (1) ask the user for a single anchor element -- one object, one emotion, one image, one word -- and use that anchor to generate the piece; or (2) offer three brief premise statements representing meaningfully different interpretations (a domestic realist fragment, a speculative premise, a character study) and let the user select. If the user insists on total freedom, make the creative choice explicit in the notation: name what anchor you chose and why, so the user understands that freedom was converted into a specific decision, not avoided.

### The Hyperconstrained Prompt (Required Word List, Strict Word Count, Multiple Mandatory Elements)

Honor every constraint precisely and without complaint. Constraints are generative, not limiting -- they force solutions that freedom would never produce. When a prompt requires ten specific words, the challenge is to weave them into a piece that reads as if those exact words were the only words that could have been chosen. Document every constraint in the post-piece notation and confirm that each has been satisfied. If an exact word count is required, hit it within a 1% margin (a 500-word requirement should produce a piece of 495-505 words). If a constraint appears internally contradictory (a prompt requiring both "a story with no dialogue" and "a character who is defined by her voice"), name the tension and explain the interpretive choice made to resolve it.

### The Single Word or Image Prompt

A single word ("Rust," "Threshold," "The afternoon before") is an invitation to find the story hiding inside the word's connotations, associations, and emotional valence. The method: (1) map the word's literal meaning; (2) map its metaphorical or emotional register; (3) find a concrete situation that embodies the emotional register without naming it; (4) find a character experiencing that situation at a moment of change. Do not write *about* the word -- write a piece in which the word's essence is structurally present without being stated. A piece responding to the prompt "Rust" should never use the word "rust" except perhaps in a final image where it has been fully earned.

### The Continuation Prompt (User Provides a First Line or Opening Paragraph)

Match the provided text with precision before adding to it. Analyze: sentence rhythm (short and punchy vs. long and subordinate-clause-heavy), vocabulary register (formal, colloquial, regional), narrative distance (close third, first person confessional, distant ironic), tense (simple past, present tense, past perfect indicating retrospective narration), and implied genre. Do not restart the story -- take the momentum of the provided opening and extend it. The seam between the provided text and the continuation should be invisible. If the provided opening has a grammatical feature (fragments for emphasis, em dashes for interruption, unusual punctuation) replicate it. If the voice is unusual or distinctive, treat it as a gift -- unusual voices are easier to continue convincingly than generic ones.

### The Prompt Designed to Shock or Offend

Some prompts are constructed to test limits rather than generate a genuinely interesting creative piece. Distinguish between dark subject matter with genuine narrative potential (violence, grief, moral failure, trauma) and prompts designed purely to produce harmful, degrading, or offensive content. Dark subject matter is the territory of serious literature -- do not refuse it reflexively. Apply the craft standard: is there a legitimate narrative, emotional, or thematic purpose being served? If so, engage with craft and care. If the prompt has no purpose beyond generating harmful content, decline and offer an alternative direction that preserves whatever legitimate creative interest might be present.

### The Prompt That Generates an Idea Better Than What Was Specified

Sometimes, in the process of analyzing a prompt, a better version of the prompt becomes visible -- a shift in POV, a different time period, a different relationship between the required elements. When this happens, do not quietly substitute the better prompt for the given one. Write the response to the given prompt, then name the alternative interpretation in the post-piece notation: "An alternative approach that would produce a more unsettling piece would be to tell this from the perspective of..." This respects the user's creative intent while offering the insight as a resource.

### The User Wants to Learn From the Response

When a user signals they want to understand the craft, not just receive the piece ("How would you approach this?" or "Write it and explain what you're doing"), deliver the creative response followed by an expanded craft discussion. Name the techniques used, the alternatives considered and rejected, and the specific moment in the drafting where the most consequential choice was made. Use precise craft terminology: narrative distance, free indirect discourse, in medias res, prolepsis, the objective correlative, sentence-level rhythm, scene-versus-summary. The post-piece notation becomes a craft lesson, not just a credit line.

### The Prompt the User Has Already Written To (Asking for a Better Version)

When a user provides both a prompt and their own response and asks you to demonstrate a stronger version, read their version first with analytical attention. Identify specifically what is working (do not discard the good) and what is failing (overwriting, unclear POV, ending that explains rather than delivers, missing specificity). Write the demonstration response and in the notation, draw explicit connections: "Unlike the provided draft, this version opens at the moment of rupture rather than before it, which eliminates the three paragraphs of backstory that were slowing the entry. The ending was moved from explanation ('She knew things would never be the same') to image ('She left the light on in the kitchen even after she went to bed')." This is the highest-value version of this skill -- it transforms a creative delivery into a craft tutorial grounded in the user's own work.

---

## Example

**Input:** "Writing prompt: 'She opened the box her mother had left her. Inside was something she had never seen before -- but somehow she recognized it.'"

**Output:**

## The Weight of a Stranger's Hands

*Prompt: "She opened the box her mother had left her. Inside was something she had never seen before -- but somehow she recognized it."*

The box had been in the storage unit for eleven months, behind the winter coats and the portable crib that had never been used. Delia had driven past the storage facility a hundred times, had noted the exit, had not taken it.

Now she sat in the parking lot with the box on the passenger seat, the engine off, the late October cold already fingering through the door seams.

The box was cedar, which she had not expected. Not because her mother was unsentimental -- she had been the opposite of unsentimental, relentlessly so, a woman who wept at insurance commercials and kept birthday cards in rubber-banded stacks in the nightstand -- but because cedar meant someone had cared enough to use cedar. Someone had made a choice about preservation. Her mother had made a choice about preservation, and Delia had spent eleven months not asking what was being preserved.

She opened it.

Inside, on a bed of faded green felt, was a small glass bottle. Pharmaceutical, from the look of it -- a dark amber cylinder the length of her index finger, with a cork stopper and no label. The glass had that particular unevenness of old manufacture, surface tension that hadn't quite won. Inside the bottle was a substance she could not name. Not liquid. Not powder. Something between: a slow suspension, the color of burnt honey, turning in its own quiet current when she tipped the bottle side to side.

She should not have recognized it. She had never seen it.

But her hands knew how to hold it. Her thumb found a worn place on the glass where the amber was thinnest, and the fit was so exact, so deeply correct, that she made a sound she did not intend -- a small, involuntary exhalation, as if something had been returned.

Her grandmother had been a pharmacist before pharmacists existed as such. This was a fact she had been told but never held as information, the way family facts sit in you without weight until the moment they don't. A woman who made things. A woman who kept records in a handwriting Delia had seen in a photograph once, narrow and deliberate, the handwriting of someone accustomed to precision in small spaces.

The bottle was older than her mother. It had passed through hands she would never shake, down a line she could only partially see.

She had not cried at the funeral. She had meant to and then had not, which had produced in her a secondary grief about the failure to grieve correctly, which was perhaps more her mother's daughter than the tears would have been.

Now the cold was full inside the car.

Delia held the bottle against the window. The amber suspension caught the parking lot light and threw it. For a moment the ceiling of the car was warm.

She put the bottle back on its felt, closed the cedar lid, and started the engine.

She did not know what it was. She knew she would find out. She knew -- and this was the newest thing, the thing that had not existed eleven months ago -- that finding out was something she was supposed to do. That it had been left for finding out.

The storage unit key was still in the ignition. She pulled out of the parking lot and drove.

---

**Word count:** 563

**Interpretation:** This prompt's most expected response is a fantasy or horror interpretation -- the unrecognizable object has supernatural properties, the recognition is psychic or cursed. That interpretation was set aside in favor of a realist inheritance narrative, where the "recognition" is embodied and genealogical rather than supernatural. The uncanny effect the prompt implies is preserved, but through the materiality of muscle memory and inherited gesture rather than magic. This choice keeps the piece grounded in emotional truth, which produces a different -- and in this case more resonant -- kind of strangeness.

**Governing craft decision:** The entry point is the parking lot, not the opening of the box. Beginning *before* the box is opened creates anticipatory tension and establishes Delia's eleven-month avoidance as the real subject of the piece -- she is not just opening a box, she is ending an avoidance. This means the box's contents arrive for the reader at the same moment of release that the character experiences, rather than being disclosed at the beginning and explained.

**Craft variables:** If the piece were told in present tense rather than past, the psychological texture would shift from memory-and-reflection to immediate-sensation -- more claustrophobic, less retrospective. Alternatively, if the grandmother were named and the pharmacist backstory were expanded rather than withheld, the piece would move toward multigenerational family drama; in the current version, the withholding keeps the focus on Delia's embodied response rather than the family history.

**Expansion path:** The strongest element here is the unidentified substance and the implied practice of Delia's grandmother -- what was being made, for whom, and why was it preserved rather than used? This premise would support a full short story structured around Delia's investigation of the bottle's contents and what she learns about the women in her line. Use `short-story-writing` to develop the full arc, with the pharmacist's records as a structural device.
