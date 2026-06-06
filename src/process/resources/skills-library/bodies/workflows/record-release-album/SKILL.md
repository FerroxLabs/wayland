---
name: record-release-album
description: >-
  End-to-end workflow for writing, pre-producing, recording, mixing, mastering,
  and distributing an album. Covers songwriting, arrangement, DAW workflows,
  studio recording, mixing techniques, mastering chain, distribution through
  streaming platforms, and release marketing for independent musicians.

  Use when the user wants to record release album or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "songwriting-aid music-producer content-monetizer"
trigger_phrases: >-
  I want to record an album release my music how to produce an album record and
  distribute music make an album from scratch release music on Spotify
  independent album release
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: performing-arts step-by-step planning
  category: creative-project
  depends: "songwriting-aid music-producer content-monetizer"
---
# Record Release Album

**Estimated time:** 3-6 months

This workflow guides you through producing and releasing a full album, from
writing songs through pre-production, recording, mixing, mastering, and
distribution on streaming platforms. An album is the most ambitious creative
project a musician can undertake: it requires sustained creative output,
technical skill, and business acumen to deliver music that sounds professional
and reaches listeners.

The workflow covers five phases: songwriting and material development,
pre-production and arrangement, recording, mixing and mastering, and
distribution with marketing. It is designed for independent musicians who want
to produce professional-quality music without a record label.

By the end of this workflow you will have: a collection of polished songs, a
professionally mixed and mastered album, distribution on all major streaming
platforms, and a marketing plan to reach listeners.

## When to Use

- User wants to record release album
- User needs a structured, step-by-step process for record release album
- User wants to record an album
- release my music
- how to produce an album
- Do NOT use when: the request is outside the scope of record release album or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- An instrument, voice, or DAW for creating music
- A recording setup (home studio or access to a studio)
- A DAW (Ableton, Logic Pro, Pro Tools, Reaper, FL Studio, or similar)
- 5-15 songs in various stages of development (or willingness to write them)
- Budget for mastering at minimum (mixing and mastering if not doing it yourself)

## Steps

**Step 1: Write and Develop Your Material** (uses: songwriting-aid)

develop album-ready material.

- Input: existing songs and material in development, Genre, influences, and artistic vision for the album, Whether the album has a thematic concept or is a collection
- Output: All candidate songs with lyrics, chords, and demo recordings, Theme, mood arc, and artistic vision statement, Final song selection and sequencing
- Key focus: Auditing existing material: which songs are strong enough for the album,

**Step 2: Pre-Production and Arrangement** (uses: music-producer)

Use the Music Producer and Beat Maker skills to develop full arrangements and
production plans for each song.

- Input: `track-listing` from Step 1 (songs to arrange), `album-concept` from Step 1 (sonic vision to realize), `song-catalog` from Step 1 (demos to develop into arrangements)
- Output: Song-by-song arrangement with instrumentation and dynamics, Full arrangement demos for all album tracks, Tempo, key, arrangement, and sonic reference for each song
- Key focus: Creating detailed arrangements: instrumentation, part assignments, dynamics,

**Step 3: Record the Album** (uses: music-producer)

Use the Music Producer and Sound Designer skills to capture professional
recordings.

- Input: `arrangement-maps` from Step 2 (parts to record), `recording-plan` from Step 2 (session structure), `production-reference` from Step 2 (sonic targets)
- Output: Organized DAW sessions for all album tracks, Documentation of takes, comps, and technical notes per song, Rough mixes for reference during the mixing phase
- Key focus: Setting up the recording space: acoustic treatment, mic placement, headphone

**Step 4: Mix and Master** (uses: music-producer)

mix and master the album to professional
standards.

- Input: `session-files` from Step 3 (material to mix), `production-reference` from Step 2 (sonic targets for mixing), `track-listing` from Step 1 (sequence determines mastering flow)
- Output: Mixed and approved stereo files for all tracks, Stem exports for each song (vocals, instruments, drums, bass), Mastered audio files meeting streaming platform specifications
- Key focus: Mixing each song: balancing levels, panning, EQ, compression, reverb, delay,

**Step 5: Distribute and Market** (uses: content-monetizer)

Use the Content Monetizer and Social Media Strategist skills to distribute and
market the album.

- Input: `master-files` from Step 4 (audio to distribute), `track-listing` from Step 1 (metadata for distribution), `album-concept` from Step 1 (marketing narrative)
- Output: Distributor account with all tracks uploaded and metadata complete, Single release timeline, album launch plan, and marketing calendar, Album artwork, promotional photos, social media content
- Key focus: Choosing a distributor: DistroKid (simple), TuneCore (features), CD Baby

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Recording before songs are ready:** Unfinished songs in the studio waste time and money. Lock arrangements in pre-production before hitting record.
- **Mixing while recording:** These are different mindsets. Record everything first, then mix. Switching between modes kills momentum and consistency.
- **Loudness war mastering:** Squashing dynamics to be "loud" makes music fatiguing. Master for streaming normalization standards (-14 LUFS for Spotify).
- **Releasing the album cold:** An album with no pre-release singles or marketing lands in silence. Build anticipation over 6-8 weeks before the release.
- **Skipping PRO registration:** Without registering with a performing rights organization, you lose royalties from radio play, streaming, and public performance.

## Expected Outcome

When this workflow is complete, the user will have:

1. 8-12 songs are written, arranged, and polished
2. Professional-quality recordings capture the best performances
3. Mixing and mastering achieve competitive production quality
4. The album is distributed on all major streaming platforms
5. Marketing generates streams, saves, and playlist placements
6. Royalty collection is set up for all revenue streams

## Output Format

```
RECORD RELEASE ALBUM TRACKER
============================

[ ] Step 1: Write and Develop Your Material
    Status: [pending/in-progress/complete]
[ ] Step 2: Pre-Production and Arrangement
    Status: [pending/in-progress/complete]
[ ] Step 3: Record the Album
    Status: [pending/in-progress/complete]
[ ] Step 4: Mix and Master
    Status: [pending/in-progress/complete]
[ ] Step 5: Distribute and Market
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Recording before songs are ready:** Unfinished songs in the studio waste time and money. Lock arrangements in pre-production before hitting record.
- **Mixing while recording:** These are different mindsets. Record everything first, then mix. Switching between modes kills momentum and consistency.
- **Loudness war mastering:** Squashing dynamics to be "loud" makes music fatiguing. Master for streaming normalization standards (-14 LUFS for Spotify).
- **Releasing the album cold:** An album with no pre-release singles or marketing lands in silence. Build anticipation over 6-8 weeks before the release.


### Timeline Considerations

This workflow is designed to be completed sequentially, but experienced users may parallelize some steps. Key dependencies:

- Each step builds on outputs from previous steps
- Steps involving external parties may have variable timelines
- Budget constraints may require phasing steps across multiple weeks or months
- Regular progress reviews between steps help catch issues early

### Success Indicators

Track these signals to confirm the workflow is on track:

- Each step produces a concrete, reviewable deliverable
- User confidence increases as steps are completed
- Deliverables from early steps remain valid as later steps are executed
- No critical assumptions from earlier steps are invalidated
- External feedback (where applicable) is incorporated before proceeding

## Example

**Input:** "I want to record release album and need a structured plan to follow step by step."

**Output:**

**Step 1 (songwriting-aid):** Write and Develop Your Material -- produces concrete deliverables for this phase.

**Step 2 (music-producer-beat-maker):** Pre-Production and Arrangement -- produces concrete deliverables for this phase.

**Step 3 (music-producer-sound-designer):** Record the Album -- produces concrete deliverables for this phase.

**Step 4 (music-producer):** Mix and Master -- produces concrete deliverables for this phase.

**Step 5 (content-monetizer-social-media-strategist):** Distribute and Market -- produces concrete deliverables for this phase.

**Result:** User has a complete record release album plan with all deliverables produced, validated, and ready for implementation.
