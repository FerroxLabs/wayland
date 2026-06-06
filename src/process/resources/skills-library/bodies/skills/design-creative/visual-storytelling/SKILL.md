---
name: visual-storytelling
description: |
  Structures a visual narrative for a presentation with emotional arc, visual
  type selection per narrative beat, and storyboard sequence with image
  direction notes. Use when the user asks to tell a story through visuals,
  create an emotional presentation arc, design a visual narrative, or plan
  imagery for a presentation that persuades or inspires.
  Do NOT use for slide deck content structure (use slide-deck-structure),
  data visualization in slides (use data-in-slides), or video storyboarding
  (use video-storyboard).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "presentation design planning"
  category: "design-creative"
  subcategory: "presentation-design"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Visual Storytelling

## When to Use

- User asks to create a visual narrative for a presentation
- User wants to design an emotional arc using images and visuals in slides
- User needs to tell a story through a sequence of visuals
- User asks to plan imagery direction for a keynote or persuasive presentation
- User wants to match visual types to narrative beats in a presentation
- Do NOT use when: user needs the overall slide sequence and content structure (use `slide-deck-structure`), chart type selection for data (use `data-in-slides`), or a video production storyboard (use `video-storyboard`)

## Process

1. **Gather narrative context.** Collect these required inputs:
   - The story being told (the subject, the change, the message)
   - Audience emotional state at the start (skeptical, curious, neutral, excited, concerned)
   - Desired audience emotional state at the end (inspired, convinced, alarmed, empowered, aligned)
   - Number of slides or visual beats available
   - Visual constraints: stock photography only, company photos only, illustrations, mixed media

2. **Map the emotional arc.** Every visual narrative follows an emotional trajectory:
   - **Tension phase:** Build discomfort, concern, or curiosity. The audience should feel that something needs to change.
   - **Turning point:** The moment of shift -- a key insight, a new perspective, or the introduction of the solution. This is the emotional peak of the presentation.
   - **Resolution phase:** Release tension with the answer, the outcome, or the new reality. The audience should feel relief, confidence, or inspiration.
   - Plot the emotional intensity on a curve: start at the audience's current state, rise through tension, peak at the turning point, and resolve at the desired end state.
   - Assign a number to each phase based on available slides (e.g., 12 slides: 4 tension, 2 turning point, 4 resolution, 2 bookends)

3. **Select the visual type for each narrative beat.** Match the visual to the emotional function:

   | Narrative Beat | Emotional Function | Visual Type |
   |---------------|-------------------|-------------|
   | Opening (set the scene) | Orient, ground | Full-bleed environmental photo, wide shot, establishing image |
   | Problem/tension | Discomfort, urgency | Dark or desaturated imagery, constrained compositions, isolated subjects, red/amber accents |
   | Data as evidence | Credibility, shock | Bold single number, stark chart, data visualization with highlight |
   | Personal story | Empathy, connection | Portrait photography, candid shots, human faces with emotion |
   | Turning point | Revelation, hope | Bright color shift, expansive composition, sunrise/horizon metaphor, symmetry |
   | Solution/answer | Confidence, clarity | Clean product shots, organized layouts, brand colors restored |
   | Future vision | Inspiration, ambition | Aspirational imagery, elevated perspective (aerial, wide landscape), warm light |
   | Closing | Resolution, commitment | Return to opening imagery with a change (same scene, different state), or a single powerful image |

4. **Write image direction notes for each beat.** For every visual slide, specify:
   - **Subject:** What is in the image (person, object, scene, abstract)
   - **Composition:** How the frame is organized (rule of thirds placement, centered, off-center, negative space direction)
   - **Color mood:** The dominant color temperature and saturation (cool/warm, desaturated/saturated)
   - **Emotional tone:** What feeling the image should evoke (isolation, connection, hope, urgency)
   - **Text interaction:** Where text will overlay the image and how (bottom-left on dark area, white text on dark band)
   - **Transition from previous:** How this image relates to the one before it (contrast, continuation, reveal)

5. **Design visual transitions between beats.** The shift between emotional phases must be visible:
   - **Tension to turning point:** The most dramatic visual shift. Move from dark/constrained to bright/open. Change the color palette. Increase visual scale.
   - **Turning point to resolution:** Gradual brightening. Each subsequent slide should feel incrementally more resolved and optimistic.
   - **Opening to closing callback:** The closing image should reference the opening in some way -- same subject in a different state, same composition with different content. This creates narrative closure.

6. **Integrate text and visuals.** Words and images must complement, not compete:
   - **High-emotion slides:** Minimal text (one phrase or single word). Let the image carry the emotion.
   - **Evidence slides:** Data headline plus supporting visual. The text delivers the fact; the image delivers the feeling.
   - **Action slides:** Clear, direct text with supporting icon or simple visual. Do not let a complex image distract from the recommended action.
   - **Rule:** If the audience is looking at the text, they are not feeling the image. If they are feeling the image, they do not need much text.

7. **Produce the visual storyboard.** Compile the complete sequence with image direction, emotional mapping, and text integration for every slide.

## Output Format

```
## Visual Narrative: [Story Title]

**Story Arc:** [one-sentence summary of the narrative]
**Audience Start State:** [emotional state at the beginning]
**Audience End State:** [desired emotional state at the end]
**Total Visual Beats:** [count]

---

### Emotional Arc Map

```
Emotion
  ^
  |        *  (turning point)
  |       / \
  |      /   \
  |     /     \        * (resolution)
  |    /       \      /
  |   /         \    /
  |  * (tension) \  /
  | /             \/
  |/ (opening)
  +-------------------------> Slides
    1  2  3  4  5  6  7  8
```

---

### Visual Storyboard

#### Beat 1: [Beat Name] -- [Phase: opening/tension/turning point/resolution/closing]
**Slide:** [number]
**Emotional function:** [what the audience should feel]
**Visual type:** [photo/illustration/data viz/icon/typography]
**Image direction:**
- Subject: [what is in the image]
- Composition: [framing and layout]
- Color mood: [temperature, saturation]
- Emotional tone: [specific feeling]
**Text on slide:** "[text, if any]"
**Text placement:** [position relative to image]
**Transition from previous:** [visual relationship to the prior slide]

---

#### Beat 2: [Beat Name] -- [Phase]
[same structure]

---

[Continue for all beats]

---

### Visual Transition Map

| Transition | From Beat | To Beat | Visual Change |
|-----------|-----------|---------|---------------|
| [name] | [N] | [N+1] | [color shift, composition change, scale change] |
| [name] | [N] | [N+1] | [description] |

---

### Production Notes
- Image sourcing: [stock, custom photography, illustrations, company photos]
- Color palette: [specific colors for each phase]
- Typography: [font pairing for each phase if different]
- Estimated image count: [total unique images needed]
```

## Rules

1. NEVER use random or decorative imagery -- every image must serve a specific emotional function in the narrative
2. ALWAYS map the emotional arc before selecting any images -- the arc determines the visuals, not the other way around
3. The turning point must be the most visually dramatic moment -- use the biggest contrast shift here
4. High-emotion slides have minimal text (one phrase maximum) -- let the image carry the feeling
5. The closing image must reference the opening image to create narrative closure
6. Visual transitions between emotional phases must be visible and intentional (color shift, composition change, scale change)
7. Image direction notes must specify subject, composition, color mood, and emotional tone for every visual slide
8. Text and image must complement each other, not compete -- if the audience reads, they do not feel; if they feel, they do not need to read
9. Each visual beat is assigned to exactly one narrative phase (opening, tension, turning point, resolution, or closing)
10. The visual storyboard is a pre-production document -- it does NOT include animation timing, slide transitions in software, or build effects

## Edge Cases

- **Data-heavy presentation that needs a narrative arc:** Alternate between data slides and visual storytelling slides. Data slides deliver evidence; visual slides deliver emotion. Structure: visual (set the scene) -> data (prove the problem) -> visual (show the human impact) -> data (prove the solution) -> visual (inspire the future).

- **Corporate presentation with strict brand guidelines:** Work within brand colors but vary intensity. Use brand primary color at full saturation for the turning point and resolution. Use desaturated or muted versions for the tension phase. Brand consistency does not prevent emotional range.

- **Abstract topic with no obvious visual metaphor:** Use metaphorical imagery instead of literal: journey (path, road, horizon), transformation (butterfly, sunrise, seasons), growth (plant, architecture, upward lines), complexity (maze, tangled threads), clarity (clean lines, open sky). Choose one metaphor and sustain it through the presentation.

- **Very short presentation (3-5 slides):** Compress the arc: Slide 1 (tension + context), Slide 2 (turning point), Slide 3 (resolution + action). Every slide does double duty. The visual contrast between slides 1-2 and 2-3 must be stark because there are no gradual transitions.

- **Presentation delivered virtually (small screens, potential distractions):** Use higher-contrast imagery and bolder compositions. Subtle visual transitions are lost on small screens. Increase text size on image overlays. Consider adding more visual variety (change every 30-45 seconds) to maintain attention.

## Example

**Input:** "Design a visual narrative for an 8-slide internal presentation about why our company needs to invest in employee mental health programs. The audience is the leadership team, starting skeptical about the ROI. I want them to end feeling that this is a strategic priority, not a nice-to-have."

**Output:**

## Visual Narrative: The Case for Employee Mental Health Investment

**Story Arc:** Employee burnout is silently costing the company millions in turnover and lost productivity, and a targeted mental health program will recover that value while building a competitive advantage in talent retention.
**Audience Start State:** Skeptical -- views mental health programs as a "nice-to-have" benefit, not a business priority
**Audience End State:** Convinced -- sees mental health investment as a strategic priority with measurable ROI
**Total Visual Beats:** 8

---

### Emotional Arc Map

```
Intensity
  ^
  |           * Beat 5 (turning point: the solution)
  |          / \
  |    * B3 /   \
  |   / \  /     * B6 (evidence of ROI)
  |  /   \/       \
  | / B2  B4       * B7 (future vision)
  |/                \
  * B1 (opening)     * B8 (closing commitment)
  +---------------------------------> Slides
    1   2   3   4   5   6   7   8
```

---

### Visual Storyboard

#### Beat 1: "The Office Everyone Sees" -- Opening
**Slide:** 1
**Emotional function:** Establish familiarity, create a false sense of normalcy
**Visual type:** Full-bleed photograph
**Image direction:**
- Subject: Open office environment, people at desks, daylight streaming in
- Composition: Wide shot, eye-level, showing the full floor
- Color mood: Warm, slightly oversaturated -- everything looks great on the surface
- Emotional tone: Comfortable, routine, status quo
**Text on slide:** "We have a great team."
**Text placement:** Bottom-left, white text, 36pt
**Transition from previous:** First slide -- sets the baseline

---

#### Beat 2: "What We Do Not See" -- Tension
**Slide:** 2
**Emotional function:** Disrupt the comfort, introduce doubt
**Visual type:** Photograph with desaturation
**Image direction:**
- Subject: Same office environment but desaturated, focus on one person at their desk with head in hands (staged, not exploitative)
- Composition: Medium shot, slightly off-center, shallow focus on the one person with the rest blurred
- Color mood: Cool, desaturated -- the warmth from Slide 1 is gone
- Emotional tone: Isolation, quiet struggle
**Text on slide:** "1 in 3 of your employees is struggling. Silently."
**Text placement:** Top-left, white text on dark gradient overlay
**Transition from previous:** Same setting, different color treatment. The visual shift signals that something is wrong under the surface.

---

#### Beat 3: "The Numbers" -- Tension (Data)
**Slide:** 3
**Emotional function:** Convert concern into urgency with hard data
**Visual type:** Bold single number on dark background
**Image direction:**
- Subject: Large "$1.8M" in white on a dark charcoal background
- Composition: Number centered, supporting text below
- Color mood: Dark, stark, high contrast
- Emotional tone: Shock, gravity
**Text on slide:** "$1.8M -- annual cost of turnover attributed to burnout in our company (based on industry rates applied to our headcount and salary data)"
**Text placement:** Number centered at 72pt, context text below at 20pt
**Transition from previous:** Color continues to darken. The emotional weight increases.

---

#### Beat 4: "The Human Cost" -- Tension (Peak)
**Slide:** 4
**Emotional function:** Make the data personal -- move from numbers to faces
**Visual type:** Portrait photography
**Image direction:**
- Subject: Three employee portraits (real or representative), each with a one-line quote about workplace stress
- Composition: Three vertical panels side by side, each portrait cropped to shoulders-up
- Color mood: Muted, natural tones -- not dramatized, just real
- Emotional tone: Empathy, recognition
**Text on slide:** Three short quotes: "I have not taken a real vacation in two years." "I do not tell my manager when I am struggling." "I am looking for a new job because I am exhausted."
**Text placement:** Below each portrait, 16pt italic
**Transition from previous:** From abstract number to human faces. The tension peaks here.

---

#### Beat 5: "There Is an Answer" -- Turning Point
**Slide:** 5
**Emotional function:** Release tension, introduce hope
**Visual type:** Full-bleed photograph with color restoration
**Image direction:**
- Subject: Bright, open space -- a person walking outside in natural light, or a team in a relaxed collaborative setting
- Composition: Wide shot, high horizon line, expansive sky, subject small in the frame surrounded by open space
- Color mood: Warm, fully saturated -- dramatic contrast from the dark slides before
- Emotional tone: Relief, possibility, fresh air
**Text on slide:** "Targeted mental health programs reduce burnout turnover by 30-40%."
**Text placement:** Bottom-center, dark text on a light band across the image
**Transition from previous:** The most dramatic visual shift in the deck. From dark portraits to bright, open space. This is the moment the audience's emotional state pivots.

---

#### Beat 6: "The ROI" -- Resolution (Data)
**Slide:** 6
**Emotional function:** Validate the hope with evidence
**Visual type:** Data visualization
**Image direction:**
- Subject: Simple bar chart: cost of program vs. cost of burnout turnover saved, with net savings highlighted in green
- Composition: Chart occupies 60% of slide, headline above, key number callout to the right
- Color mood: Clean white background, green highlight for savings, gray for costs
- Emotional tone: Confidence, logic supporting the emotional shift
**Text on slide:** "For every $1 invested, we recover $3.20 in reduced turnover and productivity gains."
**Text placement:** Headline at top, 28pt. ROI callout right of chart, 36pt bold green.
**Transition from previous:** From aspirational image to concrete evidence. The warm color palette continues.

---

#### Beat 7: "The Future We Build" -- Resolution (Vision)
**Slide:** 7
**Emotional function:** Inspire action by showing the future state
**Visual type:** Aspirational photograph
**Image direction:**
- Subject: Team in an energized meeting, natural smiles, collaborative posture, bright environment
- Composition: Medium-wide shot, eye-level, subjects slightly off-center with space in the frame for text
- Color mood: Warm, vibrant, saturated -- the "ideal" version of the office from Slide 1
- Emotional tone: Optimism, team strength, pride
**Text on slide:** "A workplace where people stay, perform, and grow."
**Text placement:** Right side, white text on subtle dark gradient, 32pt
**Transition from previous:** From data back to human imagery, but now positive and forward-looking.

---

#### Beat 8: "Our Commitment" -- Closing
**Slide:** 8
**Emotional function:** Resolve the arc, call to action
**Visual type:** Typography-driven with callback image
**Image direction:**
- Subject: The same office view from Slide 1, but now with the warm, vibrant treatment from Slide 7 (not the original slightly-too-perfect version, but the genuine warmth)
- Composition: Full-bleed background image, slightly blurred, with a centered text block
- Color mood: Warm, confident -- echoing the resolution palette
- Emotional tone: Commitment, determination
**Text on slide:** "Approve the mental health program. $240K investment. $768K annual return. Healthier team."
**Text placement:** Centered, 28pt, white text on dark semi-transparent overlay
**Transition from previous:** Returns to the opening setting, but transformed. The audience sees the same office with new eyes.

---

### Visual Transition Map

| Transition | From Beat | To Beat | Visual Change |
|-----------|-----------|---------|---------------|
| Surface to reality | 1 | 2 | Desaturation, focus shift to isolated individual |
| Personal to data | 2 | 3 | Cut to stark number on dark background |
| Data to human | 3 | 4 | Return to faces, muted but personal |
| Tension to hope | 4 | 5 | Dramatic brightening, open composition, warm color |
| Hope to evidence | 5 | 6 | Clean data slide, green accent, confidence |
| Evidence to vision | 6 | 7 | Return to warm human imagery, forward-looking |
| Vision to commitment | 7 | 8 | Callback to opening setting, transformed |

---

### Production Notes
- Image sourcing: Internal company photos preferred for authenticity (Slides 1, 2, 4, 7). Stock photography acceptable for aspirational imagery (Slides 5, 8).
- Color palette: Tension phase (cool grays, desaturated), turning point (warm gold/amber), resolution (saturated brand colors with green accent for ROI)
- Typography: One sans-serif family throughout, weight variation for emphasis
- Estimated unique images needed: 6-8 (some can be color-treated variations of the same source)
