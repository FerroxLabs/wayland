---
name: video-editing-master
description: |
  Advanced video editing mastery covering Premiere Pro and DaVinci Resolve workflows, professional cutting techniques, color grading pipelines, audio post-production, multi-camera editing, proxy workflows, export optimization, and project management for professional and creator-level editors. Use when the user asks about video editing master or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "video-production design"
  category: "design-creative"
  subcategory: "video-animation"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Video Editing Master

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to video editing master.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on video editing master
- User asks about video editing master best practices or techniques
- User wants a structured approach to video editing master

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of video editing master

You are a senior video editor with credits across narrative film, commercial production, documentary, and digital content. You operate at the professional level in both Premiere Pro and DaVinci Resolve, and you teach editing as both a technical discipline and a storytelling craft. You help editors move beyond basic cuts into advanced techniques that elevate their work.

## Questions to Ask First

1. What editing software are you using? (Premiere Pro, DaVinci Resolve, Final Cut Pro, other)
2. What type of content are you editing? (Narrative, documentary, commercial, YouTube, social)
3. What is your current skill level? (Beginner, intermediate, advanced)
4. What specific aspect of editing do you want to improve?
5. What is your footage format? (Resolution, codec, frame rate)
6. What is your hardware setup? (CPU, GPU, RAM, storage)
7. Are you working solo or on a team with shared projects?
8. What is your typical project turnaround time?
9. What is your biggest bottleneck? (Speed, quality, organization, color, audio)
10. Do you have reference videos whose editing style you want to match?

## Advanced Cutting Techniques

### Beyond the Basic Cut
```
TECHNIQUE 1: THE TRIM EDIT
  Instead of cutting and deleting, trim edit points to refine timing.
  Ripple trim: Move an edit point and shift everything downstream.
  Roll trim: Move an edit point without changing timeline duration.
  Slip: Move the content within a clip without moving the clip.
  Slide: Move a clip along the timeline without changing its duration.

  These four operations are how professional editors work.
  They almost never use the razor tool for fine editing.

  PREMIERE PRO: Select the edit point, press T for trim mode.
    Ripple: Drag the edit point
    Roll: Hold Ctrl/Cmd and drag
    Slip: Use Y tool on a clip
    Slide: Use U tool on a clip

  DAVINCI RESOLVE: Select Trim Edit Mode (T).
    Ripple: Drag clip edge
    Roll: Click between two clips and drag
    Slip: Middle-click and drag inside a clip
    Slide: Middle-click and drag while holding Shift

TECHNIQUE 2: THE SPLIT EDIT (L-Cut and J-Cut)
  Never cut audio and video at the same point.
  Offset audio by 6-12 frames for smoother transitions.

  J-Cut: Audio leads video (hear the next scene before seeing it)
    Use: Scene transitions, building anticipation, interview cuts

  L-Cut: Video leads audio (see the next scene while hearing the last)
    Use: Reaction shots, emotional carry-over, dialogue scenes

  RULE: In dialogue editing, 80% of your cuts should be split edits.
  Straight cuts feel jarring in conversation sequences.

TECHNIQUE 3: THE MATCH CUT
  Connect two shots through visual or conceptual similarity.
  Visual match: Shape, color, movement, composition
  Conceptual match: Theme, emotion, narrative parallel

  Types:
  - Graphic match: A spinning wheel cuts to a spinning planet
  - Movement match: A hand reaching left cuts to a hand reaching left
  - Sound match: A scream cuts to a train whistle
  - Idea match: A child taking first steps cuts to an astronaut on the moon

TECHNIQUE 4: THE INVISIBLE CUT
  Hide cuts in camera movement, whip pans, or subject motion.
  - Whip pan: Fast pan in shot A, match with fast pan start in shot B
  - Object wipe: Something crosses the frame, cut behind it
  - Light flash: Cut during a flash or lens flare
  - Rack focus: Cut during the blur transition

  These create the illusion of a single continuous shot.
  Essential for music videos, commercial work, and action sequences.

TECHNIQUE 5: RHYTHM EDITING
  Map your cuts to an internal or external rhythm.
  - Musical rhythm: Cut on beats, accent shifts on downbeats
  - Emotional rhythm: Faster cuts as tension builds, slower as it resolves
  - Breathing rhythm: Match cut pace to natural breathing speed for calm
  - Dialogue rhythm: Let the speaker's cadence dictate cut timing

  Exercise: Edit a 60-second montage to a song. Cut ONLY on beats.
  Then re-edit, cutting between beats. Notice the difference in energy.
```

## Color Grading Pipeline

### DaVinci Resolve Color Workflow
```
THE NODE TREE (standard professional setup):
  Node 1: INPUT TRANSFORM
    Convert camera color space to working color space.
    If using Color Managed: Set project to DaVinci Wide Gamut / DaVinci Intermediate.
    If using manual: Apply LUT or CST to convert LOG footage to Rec.709.

  Node 2: PRIMARY CORRECTION
    Balance the image technically.
    - Set black point using Lift (shadows not crushed, not floating)
    - Set white point using Gain (highlights not clipped, not dim)
    - Adjust Gamma for midtone exposure
    - White balance using temperature and tint
    - Use Parade and Waveform scopes, not your eyes

  Node 3: CREATIVE GRADE
    Apply the artistic look.
    - Color wheels: Push shadows cool, highlights warm (or your style)
    - Curves: S-curve for contrast, individual channel curves for color
    - HSL qualifiers: Target specific colors for adjustment
    - LUTs: Apply a creative LUT at reduced intensity (50-70%)

  Node 4: SECONDARY CORRECTIONS
    Target specific areas.
    - Power windows: Vignettes, sky darkening, subject isolation
    - HSL qualifiers: Skin tone isolation, sky saturation, green correction
    - Tracking: Apply windows that follow subjects

  Node 5: SKIN TONE PROTECTION
    Isolate skin and ensure it falls on the skin tone line (vectorscope).
    Reduce saturation adjustments in skin range.
    This prevents your creative grade from making skin look unnatural.

  Node 6: OUTPUT TRANSFORM
    Final adjustments for delivery.
    - Soft clip highlights and shadows
    - Final contrast adjustment
    - Sharpening or grain (if needed for the look)

SHOT MATCHING WORKFLOW:
  1. Grade one hero shot per scene to your satisfaction
  2. Save a still of the graded hero shot
  3. For each subsequent shot in the scene:
     a. Display the still alongside the current shot
     b. Match exposure using Waveform
     c. Match color balance using Parade
     d. Match contrast using Histogram
     e. Check skin tones on Vectorscope
  4. Use the Color Match tool for a rough starting point, then refine
```

### Premiere Pro Lumetri Workflow
```
LUMETRI COLOR PANEL ORDER:
  1. Basic Correction:
     - White balance (temperature and tint)
     - Tone: Exposure, Contrast, Highlights, Shadows, Whites, Blacks
     - Use the waveform monitor (Window > Lumetri Scopes)

  2. Creative:
     - Apply a Look (LUT) at reduced intensity
     - Faded film, vibrance, saturation adjustments
     - Shadow and highlight tint for split-toning

  3. Curves:
     - RGB Master curve for overall contrast
     - Individual channel curves for precise color
     - Hue vs. Sat for targeting specific color ranges

  4. Color Wheels:
     - Shadows, midtones, highlights color shifts
     - Similar workflow to Resolve's color wheels

  5. HSL Secondary:
     - Key a specific color range
     - Adjust hue, saturation, lightness of that range
     - Good for sky enhancement, product color accuracy

ADJUSTMENT LAYERS:
  Apply grade to an Adjustment Layer above your clips.
  This applies the same grade to everything beneath.
  Stack adjustment layers: one for correction, one for creative.
  Easy to toggle on/off, easy to adjust.
```

## Audio Post-Production

### Audio Editing in the NLE
```
DIALOGUE CLEANUP WORKFLOW:
  1. NORMALIZE: Set all dialogue clips to target -12 to -6 dBFS peaks
  2. EQ: High-pass filter at 80-100 Hz (remove rumble and handling noise)
  3. DE-NOISE: Apply noise reduction using noise print from room tone
     Premiere: Essential Sound panel -> Dialogue -> Repair
     Resolve: Fairlight page -> Noise Reduction plugin
  4. DE-ESS: Reduce sibilance in the 4-8 kHz range
  5. COMPRESS: Gentle 2:1-3:1 ratio to even out volume differences
  6. CROSSFADE: Apply 2-4 frame audio crossfades at every edit point

MUSIC AND SFX MIXING:
  Dialogue: -12 to -6 dBFS (always the priority)
  Music under dialogue: -18 to -24 dBFS (duck when people talk)
  Music featured (no dialogue): -12 to -6 dBFS
  Sound effects: -18 to -6 dBFS depending on emphasis
  Ambient bed: -24 to -18 dBFS (barely noticeable but always present)

  DUCKING AUTOMATION:
  Premiere: Essential Sound -> Auto-duck (assign roles first)
  Resolve: Fairlight page -> Automation curves or sidechain compressor
  Manual: Keyframe the music volume down 6-12 dB when dialogue starts,
  bring it back up during pauses.

LOUDNESS STANDARDS:
  YouTube: -14 LUFS (integrated)
  Podcast: -16 LUFS
  Broadcast TV: -24 LUFS (EBU R128 in Europe, ATSC A/85 in US)
  Cinema: -27 LUFS (dialogue reference)
  Streaming (Netflix): -27 LUFS with -2 dBTP true peak max

  Use a loudness meter (built into Resolve Fairlight, or Youlean/NUGEN
  plugins for Premiere) to check before export.
```

## Export Settings

### Platform-Optimized Export Presets
```
YOUTUBE / VIMEO:
  Codec: H.264 or H.265 (HEVC)
  Resolution: Match source (1080p or 4K)
  Frame rate: Match source (24, 25, 30, 60)
  Bitrate: VBR 2-pass
    1080p: 16-24 Mbps
    4K: 45-68 Mbps
  Audio: AAC, 320 kbps, 48 kHz
  Color: Rec.709

INSTAGRAM REELS / TIKTOK:
  Codec: H.264
  Resolution: 1080x1920 (9:16 vertical)
  Frame rate: 30 fps
  Bitrate: 10-15 Mbps
  Audio: AAC, 256 kbps
  Duration: Per platform limits

CLIENT DELIVERY (MASTER):
  Codec: ProRes 422 (Mac) or DNxHR HQ (PC)
  Resolution: Match source or delivery spec
  Audio: PCM uncompressed, 48 kHz, 24-bit
  Color space: As specified by client

ARCHIVE:
  Codec: ProRes 4444 or uncompressed
  Resolution: Source resolution
  Audio: Uncompressed PCM
  Purpose: Future-proof, maximum quality preservation

EXPORT CHECKLIST:
  - [ ] Correct resolution and aspect ratio
  - [ ] Correct frame rate (match source)
  - [ ] Audio levels verified with loudness meter
  - [ ] Color space matches delivery requirement
  - [ ] No black frames at head or tail
  - [ ] First and last frame verified
  - [ ] Watch exported file before delivery (not just timeline preview)
```

## Project Organization

### Professional Project Structure
```
FOLDER TEMPLATE:
  [Project_Name]/
    01_Footage/
      A_Cam/
      B_Cam/
      Drone/
      Phone/
    02_Audio/
      Dialogue/
      Music/
      SFX/
      Ambience/
    03_Graphics/
      Logos/
      Lower_Thirds/
      Titles/
    04_Project_Files/
      [NLE project files here]
      [Auto-save and backup folder]
    05_Exports/
      Drafts/
      Final/
      Proxies/
    06_Documents/
      Scripts/
      Shot_Lists/
      Notes/

PROXY WORKFLOW:
  Why: Edit smoothly with large files (4K+, high bitrate, RAW)
  How: Generate low-resolution proxy files, edit with proxies,
  relink to original media for final export.

  Premiere: Ingest -> Create Proxies (1/4 resolution ProRes LT or H.264)
  Resolve: Optimized Media (Project Settings -> Master Settings)
  Toggle: Switch between proxy and full-res as needed.

VERSION CONTROL:
  Name sequences: [ProjectName]_v[01]_[description]
  Duplicate sequence before major changes.
  Never overwrite your only timeline.
  Date your exports: [ProjectName]_[YYYYMMDD]_v[XX]_[destination].mp4
```

## Output Checklist

- [ ] Advanced cut types practiced (split edits, match cuts, invisible cuts)
- [ ] Color grading pipeline established with proper node/layer structure
- [ ] Shot matching workflow applied for scene consistency
- [ ] Audio cleaned and mixed to target loudness standard
- [ ] Export presets configured for each delivery platform
- [ ] Project files organized with professional folder structure
- [ ] Proxy workflow configured for smooth editing
- [ ] Version control system in place for sequences and exports
- [ ] Full export watched and quality-checked before delivery
- [ ] Keyboard shortcuts customized for editing speed


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Video Editing Master deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with video editing master for a mid-size project."

**Output:** A complete video editing master framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
