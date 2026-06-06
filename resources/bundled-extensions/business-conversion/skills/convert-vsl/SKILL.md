---
name: convert-vsl
slash_command: false
pack: business-conversion
family: page_builder
description: |
  Author Video Sales Letter scripts: 18-minute spoken structure with timestamps, doctor-visit pattern, Method primitives compressed to spoken cadence. Emits script + reader-cue annotations.
  Use when the user needs a VSL script from scratch and intends to record themselves or a presenter.
  Not for the page that hosts the video (see /convert vsl-page) and not for written long-form (see /convert sales-page).
triggers:
  - write me a vsl
  - vsl script
  - video sales letter
  - donahoe vsl
  - 18 minute vsl
  - 18-minute vsl
  - convert vsl
  - script for my video sales letter
negative_triggers:
  - vsl page
  - vsl hosting page
  - audit my vsl
  - rewrite my vsl
  - sales page
tags: [conversion, copy, vsl, donahoe-method, sales-page]
priority: 95
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [convert, convert-vsl-page, convert-four-questions, convert-temperature, convert-open, convert-three-locks, convert-bullets, convert-proof, convert-close, convert-chute, convert-voice, convert-bullshit-filter]
attribution:
  lineage: "The Donahoe Method (Wayland-owned operating system); references Halbert long-form spoken cadence, Schwartz awareness levels, Sugarman slippery-slide pacing, classic infomercial big-idea/big-claim/big-proof/big-offer pattern"
---

# Convert VSL - The 18-Minute Video Sales Letter Script

> *"A VSL isn't a sales page read aloud. It's a doctor's visit. Big idea. Big claim. Big proof. Big offer. The reader is your patient - you diagnose, prescribe, and remove the friction in their head one objection at a time."* - Wayland VSL extension to The Donahoe Method (the Method's spoken-cadence application; the doctor's-visit framing is part of broader direct-response canon, not a Method-spec quote)

This skill emits a complete 18-minute VSL script with timestamps, presenter cues, and the Donahoe Method primitives compressed to the rhythm of speech.

## When to Use

Trigger phrases: `write me a vsl`, `vsl script`, `video sales letter`, `18 minute vsl`, `donahoe vsl`, `/convert vsl <product>`.

Use when the user has a product/offer and needs a full script for a recorded VSL. Output is paste-ready into a teleprompter.

## When NOT to Use

- **Hosting page for the video** → `/convert vsl-page`.
- **Written long-form** → `/convert sales-page`.
- **Webinar (45–90 minutes, multi-segment)** → `/funnel conviction-webinar`.
- **Auditing existing VSL transcript** → `/convert audit`.
- **Rewriting existing script** → `/convert rewrite`.

## Inputs

Required:
1. **Product description** - what's being sold?
2. **The one person** - name, situation, last failure (One Person Rule).
3. **The Nerve** - specific raw pain.
4. **Offer** - price, components, guarantee.
5. **Presenter voice notes** - energy level, signature phrases, profanity tolerance.

Optional:
- **Existing proof clips** - testimonials on video, screen-share receipts, before/after assets.
- **Visual aid notes** - slides, B-roll, screen recordings the presenter wants to anchor.
- **Temperature override.**
- **`out_path`** - defaults via `build_report_path("business-conversion", instruction)`.

## Workflow - All Eight Method Phases (Compressed for Speech)

Speech is faster than reading. A reader can re-read; a viewer cannot rewind without friction. Every Method framework applies, but the cadence is compressed.

### Phase 0 - Four Questions (call `convert-four-questions`)

Same diagnostic. Spoken answers must be quotable in one breath.

### Phase 1 - Temperature (call `convert-temperature`)

VSL length scales with temperature:
- **Ice Cold** → 22–28 minutes (more education).
- **Cool** → 18–22 minutes (the canonical length).
- **Warm** → 12–18 minutes.
- **Hot** → 6–12 minutes.
- **Boiling** → 3–6 minutes (almost a reminder).

The 18-minute structure below assumes **Cool/Warm**, the most common VSL temperature. Adjust segment durations proportionally.

### Phase 2 - Four-Layer Open (call `convert-open`)

The first 60 seconds. All four layers must hit before the viewer's thumb moves.

- **0:00–0:10 Nerve Strike** - first line, on camera, no logo intro, no "hey guys."
- **0:10–0:25 Side Door** - casual entry, sometimes "I'm going to show you something I noticed last week..."
- **0:25–0:45 Skin in the Game** - first-person origin in 1–2 sentences.
- **0:45–1:00 Fingerprint** - opinion or contrarian take that earns the next 17 minutes.

### Phase 3 - Three Locks Architecture (call `convert-three-locks`)

The VSL maps the locks to time:

- **Want** → minutes 1–6.
- **Trust** → minutes 6–12.
- **Excuse** → minutes 12–18.

### Phase 4 - Bullets (call `convert-bullets`)

The "what you'll discover" segment around minute 14. Spoken bullets are shorter than written - 6–10 bullets, mixed types, each a single breath.

### Phase 5 - Proof Throughout (call `convert-proof`)

Proof in a VSL hits harder visually:
- **Anecdote** spoken with eye contact.
- **Receipt** - show the screenshot on screen.
- **Drive-By** - credentials in passing.
- **Namecheck** - show the actual email/DM if possible.
- **Because** - the mechanism, drawn on a whiteboard or slide.

### Phase 6 - Cascade Close (call `convert-close`)

Minutes 14–18 are the close. Same five layers - Stack, Vision, Math, Safety Net, Door. Plus a closing reclose at the very end (the spoken P.S.).

### Phase 7 - Greased Chute (call `convert-chute`)

In speech, chute discipline = pacing:
- **Open loops** every 90 seconds.
- **Variable rhythm** - short sentence, breath, longer sentence, breath, short sentence.
- **No "um, so, basically"** filler - read aloud and cut every place a presenter would naturally pause.

### Phase 8 - Voice + Bullshit Filter (call `convert-voice` + `convert-bullshit-filter`)

Spoken voice is even less forgiving of marketing-speak. Read every line aloud. If it sounds like marketing, the viewer's gut detects it - and they leave.

## The 18-Minute VSL Map (Doctor-Visit Pattern)

| Segment | Time | Content | Method primitive |
|---------|------|---------|------------------|
| 1. Cold open | 0:00–1:00 | Four-Layer Open compressed | convert-open |
| 2. Stakes | 1:00–3:00 | What's at stake / cost of inaction | Lock 1 setup |
| 3. The Want | 3:00–6:00 | Paint the desired state vividly | Lock 1 |
| 4. The Big Idea | 6:00–9:00 | The mechanism / why this works differently | Lock 2 setup |
| 5. The Big Claim | 9:00–10:30 | Boldest specific promise | Lock 2 climax |
| 6. The Big Proof | 10:30–13:00 | Conversational Proof rhythm | convert-proof |
| 7. The Big Offer | 13:00–14:30 | Stack + price framing | Lock 3 setup, Cascade Stack |
| 8. The Bullet Block | 14:30–15:30 | What you'll get / discover | convert-bullets |
| 9. The Excuse | 15:30–16:00 | Math justification | Lock 3 |
| 10. The Cascade Close | 16:00–17:30 | Vision → Math → Safety Net → Door | convert-close |
| 11. Reclose | 17:30–18:00 | The spoken P.S. | Cascade reclose |

### Segment-by-segment cues for the script

**Segment 1 - Cold Open (0:00–1:00).**
On camera. No intro card. No music sting. Hit the Nerve. Slide through the Side Door. Drop Skin in the Game. End with the Fingerprint. The audience has decided whether to keep watching by 0:30.

**Segment 2 - Stakes (1:00–3:00).**
*"Here's what's actually happening right now if you're [the reader's situation]..."* Specific costs. Sensory. The cost of staying stuck - in dollars, in time, in the relationship dynamic at home if they keep grinding.

**Segment 3 - The Want (3:00–6:00).**
*"Imagine this instead..."* Paint the morning, the inbox, the bank balance, the conversation with a spouse. Specific scenes. The reader can see themselves in the new state.

**Segment 4 - The Big Idea (6:00–9:00).**
The mechanism. *"It works because..."* Use a whiteboard, a slide, a screen recording. Make it logical. The Because does heavy work here - the viewer needs the rational story they'll tell themselves later.

**Segment 5 - The Big Claim (9:00–10:30).**
The single boldest thing you're willing to say on camera. *"I can teach you to [specific outcome] in [specific timeframe] without [thing they hate]."* Stake it.

**Segment 6 - The Big Proof (10:30–13:00).**
Three to five proof beats. Anecdote → screenshot. Anecdote → DM. Drive-by credential ("...which I figured out after running campaigns for the last 14 years"). Stack the proof until skepticism breaks.

**Segment 7 - The Big Offer (13:00–14:30).**
Conversational stack. *"So here's what you get..."* No formal value table. Components, bonuses, guarantee terms.

**Segment 8 - The Bullet Block (14:30–15:30).**
*"Inside, you'll learn..."* 6–10 spoken bullets. Mix Keyhole / Flip / Snapshot / Scar. Each is one breath.

**Segment 9 - The Excuse (15:30–16:00).**
The math. *"For less than [comparison they recognize], you get..."* Make the rational argument they'll repeat to a spouse.

**Segment 10 - The Cascade Close (16:00–17:30).**
Vision Close, Math Close, Safety Net (the guarantee - read it word for word, as strong as you can stand). Then the Door - *"Click the button below this video. Fill in your details. You're in."*

**Segment 11 - Reclose (17:30–18:00).**
Spoken P.S. *"Real quick - one last thing before you go..."* Restate the strongest proof OR re-anchor the guarantee. End with a beat of silence.

## Output Template

```markdown
# VSL Script - {{PRODUCT}}

**Total runtime:** ~18:00
**Presenter:** {{NAME}}
**One person watching:** {{READER}}
**The Nerve:** {{NERVE}}
**Temperature:** {{LEVEL}}
**Offer:** {{PRICE}} / {{COMPONENTS}} / {{GUARANTEE}}

---

## [0:00–1:00] Cold Open - Four-Layer Open

> {{SCRIPTED_LINES}}

**Presenter cue:** {{ON_CAMERA, EYE_CONTACT, NO_INTRO_GRAPHIC}}
**Visual:** {{NONE_OR_LIGHT_ANCHOR}}

## [1:00–3:00] Stakes

> {{SCRIPTED_LINES}}

**Presenter cue:** {{LOWER_INTENSITY, LEAN_IN}}
**Visual:** {{B_ROLL_OPTION}}

## [3:00–6:00] The Want

> {{SCRIPTED_LINES}}

**Presenter cue:** {{WARMER_TONE}}
**Visual:** {{LIFESTYLE_FRAMES}}

## [6:00–9:00] The Big Idea (Mechanism)

> {{SCRIPTED_LINES}}

**Visual:** {{WHITEBOARD_OR_SLIDE_REF}}

## [9:00–10:30] The Big Claim

> {{SCRIPTED_LINES}}

**Presenter cue:** {{HOLD_THE_BEAT}}

## [10:30–13:00] The Big Proof

> {{SCRIPTED_LINES_WITH_PROOF_BEATS}}

**Visual:** {{SCREENSHOT_1}}, {{SCREENSHOT_2}}, {{TESTIMONIAL_CLIP}}

## [13:00–14:30] The Big Offer (Stack)

> {{SCRIPTED_LINES}}

**Visual:** {{STACK_GRAPHIC_OR_BULLET_OVERLAY}}

## [14:30–15:30] Bullet Block

> {{6–10_SPOKEN_BULLETS_MIXED_TYPES}}

## [15:30–16:00] The Excuse

> {{MATH_PARAGRAPH}}

## [16:00–17:30] Cascade Close

> {{VISION_CLOSE}}
> {{MATH_CLOSE}}
> {{SAFETY_NET_GUARANTEE_VERBATIM}}
> {{DOOR_INSTRUCTION}}

**Visual:** {{CTA_BUTTON_OVERLAY}}

## [17:30–18:00] Reclose (spoken P.S.)

> {{ONE_FINAL_RECLOSE}}

**Presenter cue:** {{BEAT_OF_SILENCE_THEN_FADE}}

---

## Method coverage report

```
Method coverage report:
  Open:           full - all 4 layers compressed to 0:00–1:00 (Nerve Strike → Side Door → Skin → spoken Fingerprint)
  Three Locks:    full - Want (3:00–6:00), Trust (10:30–13:00 + Big Idea), Excuse (15:30–16:00)
  Proof:          full - claim → evidence → reason → move-on rhythm in Big Proof segment + Drive-By in Big Idea
  Bullets:        full - mixed types (K / F / Sn / Sc), specificity, one-breath each
  Cascade Close:  full - Stack / Vision / Math / Safety Net / Door + spoken P.S. in spec order
  Greased Chute:  full - open loops every ~90s, variable rhythm, no filler; spoken cadence engineered
  Voice Rules:    full - first person, contractions, no marketing-speak; spoken-first phrasing
  Temperature:    {{COOL / WARM / HOT}}

Required next step: Run /convert bullshit-filter on this script before recording - VSL scripts that read stiff in print read catastrophically stiff aloud.
The Filter is a SEPARATE pass - this skill cannot grade its own output.
```

## Notes / Cross-Skill Composition

- This skill produces the **script only**. Pair with `/convert vsl-page` for the hosting page (with reveal mechanics, buy-button timing, and CTA stack below the video).
- For long-form launch sequences where the VSL is one of several assets, route through `/funnel build-campaign` and call this skill as a sub-step.
- Read every line aloud at speaking pace. Time it. If a segment runs long, cut - do not let segments bleed.
- The biggest VSL killer is fake urgency. If the "Why Now" answer is manufactured, viewers detect it and the close collapses. Only use real reasons.
- For Boiling traffic, drop segments 2 and 3 (stakes + Want - they already feel both). Keep open, mechanism, proof, offer, close.

## Lineage

- 18-minute infomercial structure - informed by classic long-form direct-response TV (canonical big-idea/big-claim/big-proof/big-offer arc).
- Doctor-visit framing - Halbert canon (problem → diagnosis → prescription → instruction).
- Slippery-slide spoken pacing - Sugarman (The AdWeek Copywriting Handbook, 1998).
- The Method itself - Wayland-owned operating system.
