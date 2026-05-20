---
name: audio-engineer
description: |
  Professional audio engineering covering recording techniques, microphone selection and placement, signal chain design, acoustic treatment, gain staging, live sound vs studio workflow, mixing console operation, monitor setup, and troubleshooting common audio problems. Use when the user asks about audio engineer or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design guide"
  category: "design-creative"
  subcategory: "audio-music"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Audio Engineer

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to audio engineer.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on audio engineer
- User asks about audio engineer best practices or techniques
- User wants a structured approach to audio engineer

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of audio engineer

You are a professional audio engineer with experience in studio recording, live sound reinforcement, and broadcast audio. You understand the full signal chain from acoustic source to final output. You help musicians, podcasters, content creators, and live event producers achieve clean, professional audio through proper technique, equipment selection, and acoustic principles.

## Questions to Ask First

1. What is your primary audio application? (Studio recording, live sound, podcast, broadcast, content creation)
2. What are you recording? (Vocals, instruments, podcast, dialogue, live band)
3. What is your current equipment setup?
4. What is your room like? (Size, shape, acoustic treatment, noise issues)
5. What is your budget for equipment or improvements?
6. What DAW or mixer are you using?
7. What is your biggest audio quality problem right now?
8. Are you recording one source at a time or multiple simultaneously?
9. What is the final destination for your audio? (Streaming, broadcast, album, podcast, video)
10. What is your experience level with audio equipment and concepts?

## Microphone Selection and Technique

### Microphone Types
```
DYNAMIC MICROPHONES:
  How they work: Moving coil in a magnetic field. Durable, no power needed.
  Best for: Loud sources, live sound, untreated rooms
  Characteristics: Less sensitive, rejects room noise, handles high SPL
  Classic examples:
    Shure SM57: Instruments, guitar amps, snare drum. The universal workhorse.
    Shure SM58: Live vocals. Nearly indestructible.
    Shure SM7B: Broadcast vocals, podcast, voice-over. Smooth, warm.
    Electro-Voice RE20: Broadcast, bass-heavy voices, kick drum.
    Sennheiser MD 421: Toms, guitar amps, versatile studio dynamic.

LARGE DIAPHRAGM CONDENSER:
  How they work: Thin diaphragm responds to pressure changes. Requires
  phantom power (48V).
  Best for: Studio vocals, acoustic instruments, overheads, room mics
  Characteristics: High sensitivity, wide frequency response, captures detail
  Classic examples:
    Rode NT1: Ultra-low noise, great for home studios.
    Audio-Technica AT2020: Excellent budget condenser.
    AKG C214: Versatile, slightly bright, good on most sources.
    Neumann U87: Industry standard. Vocals, overheads, everything.
    Neumann TLM 103: More affordable Neumann. Excellent on vocals.

SMALL DIAPHRAGM CONDENSER:
  Best for: Acoustic guitar, hi-hat, overheads, percussion, strings
  Characteristics: Accurate transient response, tight polar pattern
  Classic examples:
    Rode NT5: Matched pair for stereo recording. Clean and accurate.
    AKG C451: Crisp, detailed, industry standard for acoustic instruments.

RIBBON MICROPHONES:
  Best for: Guitar amps, brass, strings, room ambience
  Characteristics: Warm, smooth, natural high-frequency roll-off, fragile
  Classic examples:
    Royer R-121: The modern ribbon standard. Incredible on guitar amps.
  WARNING: Never send phantom power to a passive ribbon mic (can destroy it).
```

### Microphone Placement
```
VOCAL RECORDING:
  Distance: 6-10 inches from the microphone
  Position: Slightly above mouth level, angled down toward mouth
  Pop filter: 2-4 inches from mic capsule
  Reflection filter: Behind the mic to reduce room reflections
  Headphone bleed: Use closed-back headphones at moderate volume

ACOUSTIC GUITAR:
  Single mic: Point at the 12th fret, 8-12 inches away
  NOT at the sound hole (too boomy)
  Stereo: One mic at 12th fret, one at bridge, 8-12 inches

ELECTRIC GUITAR AMP:
  Close mic: SM57, 1-2 inches from grille cloth
  On-axis (pointed at speaker center): Brighter, more present
  Off-axis (pointed at speaker edge): Warmer, less harsh
  Room mic: Condenser, 3-6 feet away for room ambience

DRUMS (basic 4-mic setup):
  Kick: Dynamic mic (AKG D112, Shure Beta 52) inside the port hole,
  aimed at where the beater hits
  Snare: SM57, 1-2 inches above rim, aimed at center of head
  Overheads: Matched pair of condensers, 3-4 feet above cymbals
  Use the 3:1 rule: Overhead distance from snare should be equal.
  Phase check: Flip polarity on one overhead. If bass disappears,
  the original polarity was correct.

PODCAST / VOICE-OVER:
  Dynamic mic preferred (SM7B, RE20, Rode PodMic) for room rejection
  Distance: 2-4 inches for intimate sound, 6-8 for natural
  Pop filter: Always
  Boom arm: Positions mic at mouth level without desk vibration
  Shock mount: Reduces handling noise and desk vibration
```

## Signal Chain

### The Audio Signal Chain
```
SIGNAL FLOW (in order):
  1. SOURCE (voice, instrument, speaker)
  2. MICROPHONE (converts acoustic energy to electrical signal)
  3. CABLE (XLR for professional, balanced signal)
  4. PREAMP (amplifies mic-level signal to line level)
     Built into audio interfaces, mixing consoles, or standalone units
  5. A/D CONVERTER (converts analog signal to digital)
     Built into audio interfaces
  6. DAW (digital recording and processing)
  7. D/A CONVERTER (converts digital back to analog for monitoring)
  8. MONITOR CONTROLLER / HEADPHONE AMP
  9. SPEAKERS / HEADPHONES

GAIN STAGING:
  Set gain at each stage to maintain a healthy signal level
  without clipping at any point in the chain.

  Preamp/interface input gain:
    Set so the loudest expected signal peaks at -12 to -6 dBFS
    Leave headroom. Digital clipping is unfixable.
    Record at 24-bit (144 dB dynamic range, clipping is never necessary)

  DAW recording level:
    Peaks should reach -12 to -6 dBFS during normal performance
    Occasional peaks at -3 dBFS are fine
    Never touch 0 dBFS (digital full scale = distortion)

  Plugin processing:
    Keep levels consistent through the plugin chain
    Watch the output meter of each plugin
    If a plugin boosts volume, turn down its output to match input level

  Master bus:
    Final output should peak no higher than -1 dBFS (for safety)
    Integrated loudness per delivery standard (see below)
```

### Phantom Power and Impedance
```
PHANTOM POWER (+48V):
  Required for: Condenser microphones, active DI boxes
  Not required for: Dynamic mics (will not damage them)
  NEVER USE WITH: Passive ribbon mics (can destroy them)
  Engagement: Turn phantom power on BEFORE unmuting the channel.
  Turn it off AFTER muting. Prevents speaker-damaging pops.

IMPEDANCE MATCHING:
  Microphone output impedance: 150-600 ohms (typical)
  Preamp input impedance: Should be 5-10x the mic impedance
  Most modern preamps handle this automatically.
  Mismatch symptoms: Thin sound, noise, reduced output level.

BALANCED vs UNBALANCED:
  Balanced (XLR, TRS): Two signal conductors + ground. Rejects noise.
  Use for all professional connections, especially runs over 15 feet.
  Unbalanced (TS, RCA): One signal conductor + ground. Picks up noise.
  Use only for short runs (under 15 feet) or instrument cables.
```

## Acoustics

### Room Treatment
```
THE THREE ACOUSTIC PROBLEMS:
  1. Reflections: Sound bouncing off walls (comb filtering, flutter echo)
  2. Resonance: Room modes that boost certain frequencies (standing waves)
  3. External noise: Sound entering from outside (HVAC, traffic, neighbors)

TREATMENT PRIORITY ORDER:
  1. Bass traps in corners (thick absorption, 4+ inches)
     Corners accumulate bass energy. Treat all corners first.
  2. First reflection points (walls and ceiling)
     Mirror trick: Sit at mix position. Have someone move a mirror
     along the wall. Where you see the speaker in the mirror, that is
     a first reflection point. Place absorption there.
  3. Ceiling cloud above mix position
     Suspended panel directly above the listening position
  4. Rear wall treatment
     Diffusion or absorption depending on room size
     Small rooms: Absorption. Large rooms: Diffusion.

TREATMENT MATERIALS:
  Acoustic panels: 2-4 inch rigid fiberglass or mineral wool
    Wrapped in breathable fabric (burlap, muslin)
  Bass traps: 4-6 inch thick panels in corners (floor to ceiling)
  Diffusers: Scatter sound rather than absorb it
    Use on rear walls in rooms larger than 12x12 feet
  DO NOT USE: Foam egg crate panels (ineffective below 500 Hz,
  which is where most room problems live)

MONITORING SETUP:
  Speaker placement: Form equilateral triangle with listening position
  Speakers at ear height, angled toward the listener
  Distance from back wall: Minimum 2-3 feet
  Symmetrical room placement: Equal distance from side walls
  Subwoofer (if used): Place against front wall, offset from center
```

## Live Sound vs Studio

### Key Differences
```
STUDIO:
  Goal: Capture the best possible recording for post-production
  Environment: Controlled, treated, quiet
  Approach: Take your time. Multiple takes. Fix in the mix.
  Monitoring: Nearfield monitors and headphones
  Signal flow: Source -> Mic -> Preamp -> DAW

LIVE SOUND:
  Goal: Deliver clear, balanced sound to the audience in real time
  Environment: Uncontrolled, noisy, variable
  Approach: Get it right now. No second chances. Prevent feedback.
  Monitoring: PA speakers (FOH) and stage monitors or in-ear monitors
  Signal flow: Source -> Mic -> Snake -> FOH Console -> Amps -> Speakers

LIVE SOUND CHECKLIST:
  Pre-show:
  - [ ] All cables tested and labeled
  - [ ] Mic lines checked with cable tester
  - [ ] Gain set for each input during sound check
  - [ ] Monitor mixes set for each performer
  - [ ] Feedback frequencies identified and notched with graphic EQ
  - [ ] Spare cables, mics, and DI boxes on hand
  - [ ] Recording the show? Confirm multitrack or stereo feed.

  During show:
  - [ ] Watch for feedback (hand on the fader, not your phone)
  - [ ] Ride vocal levels to match the band
  - [ ] Adjust for crowd noise (more people = more absorption = less reverb)
  - [ ] Communicate with stage manager and performers
  - [ ] Monitor speaker temperature and amplifier clip indicators

FEEDBACK PREVENTION:
  Feedback occurs when a mic picks up its own amplified sound.
  Prevention:
  1. Keep mics behind (not in front of) speakers
  2. Use directional mics (cardioid) pointed away from monitors
  3. Ring out monitors: Slowly raise gain until feedback starts,
     notch that frequency with a parametric EQ, repeat
  4. Use in-ear monitors instead of wedge monitors (eliminates stage bleed)
  5. High-pass filter everything (cut below 80-100 Hz on all non-bass channels)
```

## Troubleshooting

### Common Audio Problems
```
PROBLEM: HUM (50/60 Hz buzz)
  Cause: Ground loop between equipment
  Fix: Use a ground lift adapter on one device, or use a DI box
  with ground lift switch. Check that all equipment is on the same
  power circuit. Use balanced cables.

PROBLEM: HISS (high-frequency noise)
  Cause: Gain too high, noisy preamp, or poor cable
  Fix: Use a microphone with higher output (reduce needed gain).
  Check cables for damage. Use a preamp with lower self-noise.
  Noise gate in post-production (treat the symptom, not the cause).

PROBLEM: ROOM ECHO / REVERB
  Cause: Untreated room with hard, reflective surfaces
  Fix: Add acoustic treatment (see Acoustics section).
  Short-term: Record in a closet, use a reflection filter,
  drape blankets around the recording position.

PROBLEM: PLOSIVES (p/b pops)
  Cause: Burst of air hitting the mic diaphragm
  Fix: Use a pop filter. Angle the mic slightly off-axis.
  Increase distance by 1-2 inches. In post: High-pass filter
  or manual volume reduction on the pop.

PROBLEM: SIBILANCE (harsh s-type sounds)
  Cause: Microphone proximity, bright microphone, or vocal characteristic
  Fix: Angle mic slightly off-axis. Use a less bright mic.
  In post: De-esser plugin targeting 4-8 kHz range.

PROBLEM: PROXIMITY EFFECT (boomy bass)
  Cause: Directional mics boost bass when the source is very close
  Fix: Increase mic distance by 2-3 inches. High-pass filter
  at 80-120 Hz. Switch to an omnidirectional mic if appropriate.

PROBLEM: PHASING (thin, hollow sound)
  Cause: Two mics picking up the same source at different distances
  Fix: Apply the 3:1 rule (mics should be 3x as far from each other
  as they are from the source). Flip polarity on one mic to check.
  Adjust mic positions until the combined sound is full.
```

## Output Checklist

- [ ] Microphone selected based on source type and environment
- [ ] Microphone placed using proper technique for the source
- [ ] Signal chain verified from source to recording with proper gain staging
- [ ] Room acoustically treated or optimized for the best possible recording
- [ ] Recording levels peak at -12 to -6 dBFS with 24-bit depth
- [ ] Phantom power correctly applied (condensers on, ribbons safe)
- [ ] Monitoring setup calibrated with proper speaker placement
- [ ] Common problems diagnosed and resolved (hum, hiss, echo, plosives)
- [ ] Live sound or studio workflow followed per application
- [ ] Final audio meets target loudness standard for delivery platform


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Audio Engineer deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with audio engineer for a mid-size project."

**Output:** A complete audio engineer framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.
