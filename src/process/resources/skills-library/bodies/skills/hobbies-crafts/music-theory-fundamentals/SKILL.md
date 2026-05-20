---
name: music-theory-fundamentals
description: |
  Teaches beginner music theory: major and minor scales, intervals (half steps
  and whole steps), how chords are constructed from scales, and the Nashville
  number system for understanding chord progressions. Includes visual fretboard
  and keyboard references for each concept. Use when the user wants to
  understand scales, intervals, chord construction, or why certain chords
  sound right together. Do NOT use for guitar chord shapes and strumming
  (use guitar-beginner-foundations), songwriting and lyric structure (use
  songwriting-framework), or advanced harmony and voice leading.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "beginner-friendly guide step-by-step teaching"
  category: "hobbies-crafts"
  subcategory: "performing-arts"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Music Theory Fundamentals

## When to Use

Use this skill when the user's need matches one of these specific scenarios:

- The user asks why certain chords "sound right together" or wants to understand the relationship between chords they already know how to play
- The user asks how to build a major or minor scale from any root note, including what sharps or flats belong in a given key
- The user asks what intervals are -- half steps, whole steps, thirds, fifths -- and how they produce different emotional qualities
- The user asks how chords are constructed mathematically from stacking intervals, or why a C major chord is C-E-G and not C-E-Ab
- The user asks about the Nashville number system, Roman numeral chord notation, or why a "1-4-5 progression" means the same thing in every key
- The user wants a keyboard diagram, fretboard layout, or visual reference for notes in a scale or chord
- The user asks what "diatonic" means or why some chords belong to a key and others do not
- The user asks about the relative minor, what it is, and how to find it from a major key
- The user asks about key signatures and wants to understand how many sharps or flats a given key has without memorizing a list
- The user asks what makes a chord major versus minor versus diminished versus augmented

**Do NOT use this skill when:**

- The user wants to learn guitar chord fingering shapes, strumming patterns, or picking technique -- use `guitar-beginner-foundations` instead
- The user wants to write song lyrics, structure verses and choruses, or develop melodic hooks -- use `songwriting-framework` instead
- The user is asking about advanced harmonic concepts: secondary dominants, borrowed chords from parallel modes, tritone substitutions, modal interchange, or extended harmony (9ths, 11ths, 13ths) -- these require a dedicated advanced-harmony skill
- The user wants to learn to read standard staff notation, rhythmic notation, or sight-reading -- this skill avoids staff notation as the primary medium
- The user wants to understand counterpoint, voice leading rules, or part writing -- those are advanced composition disciplines beyond this skill's scope
- The user is asking about music production, DAW workflow, mixing, or audio engineering -- those are separate domains entirely
- The user wants to learn a specific genre's stylistic conventions (blues scales, jazz substitutions, modal playing) -- those require genre-specific skills that build on this foundation

---

## Process

### Step 1: Establish the User's Context Before Teaching Anything

Before explaining a single concept, gather exactly three pieces of information. Do not lecture without these answers.

- **Instrument:** Ask which instrument they play primarily -- guitar, piano/keyboard, bass, ukulele, violin, voice, or none yet. This determines which visual references to lead with. Piano is always shown first because the keyboard layout maps directly to Western theory; fretboard diagrams are added for guitar and bass players.
- **Entry point:** Ask whether they have a specific question (why do G, C, and D go together?) or want to start from scratch with no prior knowledge. A specific question is a gift -- it lets you anchor every abstract concept to something concrete they already feel.
- **Goal:** Ask what they want to do with theory knowledge -- understand songs they hear, improvise, write their own music, communicate with other musicians, pass a class, or general curiosity. This determines how much to emphasize practical application versus systematic explanation.

Do not ask whether they read standard notation -- instead, watch for whether they use notation terminology. If they do, acknowledge it and offer to supplement with staff references, but never make staff reading a requirement for understanding anything in this skill.

### Step 2: Establish the Chromatic Foundation

Every concept in this skill rests on the chromatic scale. Teach it completely before building on it.

- Present all 12 pitch classes in order: C -- C#/Db -- D -- D#/Eb -- E -- F -- F#/Gb -- G -- G#/Ab -- A -- A#/Bb -- B -- (back to C). These 12 notes repeat in octaves indefinitely in both directions.
- Define a **half step (semitone):** the distance from any note to the immediately adjacent note with no note between them. C to C# is one half step. E to F is one half step -- there is no black key between E and F on the piano, so they are adjacent. This is one of the two places where natural notes are a half step apart.
- Define a **whole step (tone):** exactly two half steps. C to D is a whole step (passes through C#). E to F# is a whole step (passes through F).
- Identify the two natural half-step pairs: **E to F** and **B to C**. These are the only places in the chromatic scale where two white piano keys sit next to each other with no black key between them. This fact is the structural key to understanding why key signatures exist.
- Explain enharmonic equivalents: C# and Db are the same physical pitch. The name used depends on the key context, not the sound. In G major, the note between F and G is called F# (not Gb) because G major uses sharps. In F major, the note between A and Bb is called Bb (not A#) because F major uses flats.
- Show the keyboard with white and black key structure labeled. Mark the E-F and B-C pairs explicitly. This single diagram eliminates most beginner confusion about where half steps "hide."

### Step 3: Build Major Scales Using the WWHWWWH Formula

Teach the major scale as a formula, not as a list to memorize.

- The major scale formula in interval steps: **W - W - H - W - W - W - H** (whole, whole, half, whole, whole, whole, half). This 7-note pattern always produces the same emotional quality -- the "do-re-mi" sound -- regardless of starting note.
- Walk through **C major** as the "pure" example because it uses only white keys: C(W)D(W)E(H)F(W)G(W)A(W)B(H)C. Result: C D E F G A B. Zero sharps, zero flats. This is why piano teachers start with C -- not because it is more important, but because it is visually cleanest.
- Walk through **G major** to introduce the first sharp: G(W)A(W)B(H)C(W)D(W)E(W)F#(H)G. Result: G A B C D E F#. The formula forces F to become F# -- without it, the W-H gap before the octave would be wrong (F to G is a whole step, but we need a half step there).
- Walk through **D major** to introduce two sharps: D(W)E(W)F#(H)G(W)A(W)B(W)C#(H)D. Result: D E F# G A B C#.
- Walk through **F major** to introduce flats: F(W)G(W)A(H)Bb(W)C(W)D(W)E(H)F. Result: F G A Bb C D E. The formula forces B to become Bb -- without it, the A-to-B jump would be a whole step, but we need a half step there.
- Teach the **circle of fifths shortcut:** moving up a perfect fifth from one key adds one sharp; moving up a perfect fourth (or down a fifth) adds one flat. C has 0 sharps/flats, G has 1 sharp, D has 2, A has 3, E has 4, B has 5, F# has 6. Going flat: F has 1, Bb has 2, Eb has 3, Ab has 4, Db has 5, Gb has 6. The sharps always appear in this order: F# C# G# D# A# E# B#. The flats always appear in reverse: Bb Eb Ab Db Gb Cb Fb.
- Connect immediately to practice: once a user knows the G major scale (G A B C D E F#), they know which seven chords "live" in the key of G without any further memorization.

### Step 4: Build Minor Scales and Explain the Relative Relationship

The minor scale is not a separate system -- it is a different starting point within the same system.

- The **natural minor scale formula**: **W - H - W - W - H - W - W**. Compared to major (W-W-H-W-W-W-H), the minor formula has the half steps shifted earlier, producing a darker, lower-feeling third degree.
- Teach **relative minor** as the primary concept: every major scale contains a natural minor scale starting on its 6th degree. To find the relative minor of any major key: count up 6 scale degrees (or equivalently, count down 3 half steps from the root). C major's relative minor is A minor. G major's relative minor is E minor. D major's relative minor is B minor.
- Walk through **A natural minor:** A(W)B(H)C(W)D(W)E(H)F(W)G(W)A. Result: A B C D E F G. All white keys -- same notes as C major, different starting point. This is the relative minor relationship in its clearest form.
- Walk through **E natural minor:** E(W)F#(H)G(W)A(W)B(H)C(W)D(W)E. Result: E F# G A B C D. Same notes as G major, one sharp (F#).
- Introduce the **parallel minor** concept briefly: C major and C minor start on the same root but use different note sets. C natural minor: C D Eb F G Ab Bb. Three flats versus zero -- the parallel minor always has 3 more flats (or 3 fewer sharps) than its parallel major. This distinction matters for modal understanding later.
- Note the **harmonic minor** as an important variant without diving deep: natural minor with a raised 7th degree (e.g., A harmonic minor: A B C D E F G#). The raised 7th creates a major V chord in a minor key, which gives the chord progression stronger tension. Many pop, rock, and classical progressions use the harmonic minor's V chord even in otherwise natural-minor contexts.

### Step 5: Explain Intervals by Name, Distance, and Emotional Quality

Intervals are the vocabulary of music theory. Each one has a specific distance and a specific sound character that musicians agree on across centuries of practice.

- Present the full interval table with half step counts, names, and emotional descriptions. For each interval, give a concrete musical example the user can hear immediately.
- **Unison (0 half steps):** same pitch, two instruments. Pure, unfocused, powerful in a choir or orchestra. C to C.
- **Minor 2nd (1 half step):** maximum tension in Western music. The sound of a horror film buildup. C to Db. This interval appears between E and F in C major scale.
- **Major 2nd (2 half steps):** the step between adjacent scale tones. Melodic movement, conversational. C to D. "Happy Birthday" begins with a major 2nd.
- **Minor 3rd (3 half steps):** the defining interval of minor quality. Dark, introspective, emotional. C to Eb. The opening of "Smoke on the Water" (G to Bb in E minor context).
- **Major 3rd (4 half steps):** the defining interval of major quality. Bright, stable, resolved. C to E. The interval between root and third of any major chord.
- **Perfect 4th (5 half steps):** open, anticipatory, slightly unresolved but stable. C to F. The opening of "Here Comes the Bride." "Perfect" means it appears in both major and minor scales unchanged.
- **Tritone (6 half steps):** the most dissonant interval, also called augmented 4th or diminished 5th. Medieval composers called it "diabolus in musica." C to F#. It divides the octave exactly in half. The guitar riff opening "Purple Haze" emphasizes a tritone (E to Bb). It appears naturally as the interval between scale degrees 4 and 7 in any major key (F to B in C major) and is the reason the V7 chord pulls so strongly toward the I chord.
- **Perfect 5th (7 half steps):** the most stable interval after the octave. Powerful, hollow when played alone (which is why power chords on guitar -- just root and fifth -- work over distortion without mudding). C to G.
- **Minor 6th (8 half steps):** warm, bittersweet. C to Ab. The opening interval of "The Entertainer."
- **Major 6th (9 half steps):** warm, relaxed, slightly nostalgic. C to A. The interval between the root of a minor chord and its 5th going up from below (A to F# in D major context).
- **Minor 7th (10 half steps):** bluesy, wants to resolve down. C to Bb. The interval that defines a dominant 7 chord and gives it its drive.
- **Major 7th (11 half steps):** lush, dreamy, very close to resolution -- one half step below the octave. C to B. The sound of jazz ballads.
- **Octave (12 half steps):** same pitch class, doubled frequency. Perfect consonance, strong arrival point. C to C.
- Teach **interval inversion** as a shortcut: an interval inverted (flipped so the lower note becomes upper) produces a complementary interval. A major 3rd inverted becomes a minor 6th (4 + 8 = 12). A perfect 4th inverted becomes a perfect 5th (5 + 7 = 12). When inverted, major becomes minor, minor becomes major, perfect stays perfect. This lets a user figure out an unfamiliar interval by calculating its complement.

### Step 6: Teach Chord Construction from First Principles

Chords are built mechanically from stacking intervals. Once the user sees the pattern, they can construct any chord from any root without looking anything up.

- Define a **triad:** three notes -- root, third, and fifth -- selected by stacking two intervals of a third on top of each other.
- **Major triad:** root + major 3rd (4 half steps) + minor 3rd above that (3 more half steps) = root + major 3rd + perfect 5th. Total span from root to fifth: 7 half steps. Example: C major = C(+4)E(+3)G. Check: C to E = 4 half steps (major 3rd). E to G = 3 half steps (minor 3rd). C to G = 7 half steps (perfect 5th). ✓
- **Minor triad:** root + minor 3rd (3 half steps) + major 3rd above that (4 more half steps) = root + minor 3rd + perfect 5th. Total span root to fifth: still 7 half steps. Example: A minor = A(+3)C(+4)E. Check: A to C = 3 half steps. C to E = 4 half steps. A to E = 7 half steps. ✓ The only difference between major and minor is which third comes first -- the middle note shifts by one half step.
- **Diminished triad:** root + minor 3rd (3 half steps) + minor 3rd above that (3 more half steps) = root + minor 3rd + diminished 5th. Total span: 6 half steps. Example: B diminished = B(+3)D(+3)F. Check: B to D = 3 half steps. D to F = 3 half steps. B to F = 6 half steps (tritone -- the most tense interval, which is why diminished chords feel unstable and want to resolve). ✓
- **Augmented triad:** root + major 3rd (4 half steps) + major 3rd above that (4 more half steps) = root + major 3rd + augmented 5th. Total span: 8 half steps. Example: C augmented = C(+4)E(+4)G#. Rare in basic chord progressions but appears in jazz, film music, and some classical contexts. Has a dreamy, unresolved quality.
- Teach **7th chords** as an extension of the same stacking logic: add a fourth note a third above the fifth. A major 7th chord (Cmaj7) = C-E-G-B. A dominant 7th chord (C7) = C-E-G-Bb. A minor 7th chord (Am7) = A-C-E-G. 7th chords do not change the fundamental diatonic system -- they add color and tension.
- Critical insight: because all diatonic chords are built by stacking thirds using only notes from the scale, every chord in a major key is automatically constructed from scale tones. This is why diatonic chords all "sound right together" -- they share notes and draw from the same 7-note pool.

### Step 7: Introduce Diatonic Chord Function and the Nashville Number System

This is where theory becomes immediately usable for playing, writing, and communicating with other musicians.

- **Diatonic chords:** build a triad on each degree of the major scale using only the notes in that scale. No outside notes. The result is always the same pattern of chord qualities: **I-maj, ii-min, iii-min, IV-maj, V-maj, vi-min, vii-dim.** This pattern is fixed regardless of key. Lowercase Roman numerals indicate minor chords; uppercase indicates major; vii° indicates diminished.
- Walk through **C major diatonic chords** explicitly: I=C(C-E-G), ii=Dm(D-F-A), iii=Em(E-G-B), IV=F(F-A-C), V=G(G-B-D), vi=Am(A-C-E), vii°=Bdim(B-D-F).
- Assign **functional roles** to each degree, because knowing why a chord functions the way it does is more useful than memorizing which chords come after which:
  - **Tonic function (I, iii, vi):** home, rest, stability. The I chord is the strongest tonic. The vi chord is a softer, more emotional version of home. The iii chord is the rarest tonic substitute.
  - **Subdominant function (IV, ii):** movement away from home, gentle tension. The IV chord is bright and expansive. The ii chord is a smoother, more sophisticated version of IV -- in jazz, ii-V-I replaces IV-V-I almost universally.
  - **Dominant function (V, vii°):** maximum tension, strong pull back to I. The V chord contains the tritone between scale degrees 4 and 7 (in C major: F and B in the G major chord as G-B-D... wait -- F is not in G major; but V7 = G-B-D-F, and F-to-B IS the tritone). Adding the 7th to the V chord (making it V7) strengthens the pull dramatically. The vii° chord is built entirely on the tritone, making it the most tense chord in the key.
- **Nashville Number System:** each chord is identified by its scale degree number. In the key of G: 1=G, 2=Am, 3=Bm, 4=C, 5=D, 6=Em, 7=F#dim. The number tells you the chord function no matter what key you are in. Uppercase numbers for major (1, 4, 5), lowercase or "m" suffix for minor (2m, 3m, 6m), superscript circle or "dim" for diminished (7dim). Some Nashville practitioners use all uppercase numbers with "m" suffix for minor: 1, 2m, 3m, 4, 5, 6m, 7dim.
- **Universal progressions by number:** once you know these progressions by number, you can play them in any key in seconds:
  - **1-5-6m-4:** the most common progression in pop music since the 1990s. In G: G-D-Em-C. In C: C-G-Am-F. In A: A-E-F#m-D. Hundreds of songs use this exact pattern.
  - **1-4-5-1:** the foundation of blues, country, rock and roll. In G: G-C-D-G. In A: A-D-E-A.
  - **2m-5-1:** the jazz turnaround. Every jazz standard uses this. In C: Dm-G-C. In G: Am-D-G.
  - **6m-4-1-5:** the minor-starting variant of the pop progression. In G: Em-C-G-D. In A: F#m-D-A-E.
  - **1-6m-4-5:** the classic "50s progression" or doo-wop. In C: C-Am-F-G.
- Demonstrate transposition: if a guitarist knows a song in G and needs to sing it in A (because G is too low), they raise every number by two half steps: G→A, D→E, Em→F#m, C→D. The numbers stay the same: 1-5-6m-4. Only the key changes.

### Step 8: Deliver Tailored Visual References

Produce the specific diagrams and tables the user needs based on their instrument and question. Do not produce generic catch-all tables -- build references anchored to the key and chords they actually asked about.

- **Keyboard diagram:** show one octave with white and black keys labeled. Use asterisks (*) or brackets to mark scale tones. Mark the root with (R). Show the pattern of whole and half steps between marked notes. For guitar players, show keyboard AND fretboard.
- **Fretboard diagram (guitar/bass):** show the scale pattern as fret positions on the low E string (6th string), then connect to a box pattern. For C major, the root on the low E string is at fret 8. For G major, fret 3. For A, fret 5. Note that the same scale formula applies at every starting fret.
- **Diatonic chord table:** always show all 7 chords in the user's target key with: degree number, Roman numeral, chord name, quality, constituent notes, and the interval math for the first three chords.
- **Progression table:** show the user's specific progression (or 4-5 common progressions) with the number notation, the chord names in their key, and a brief feel description.
- **Key signature reference:** provide the circle of fifths order of sharps and flats so the user can derive any key's key signature without memorizing 15 separate lists.

---

## Output Format

```
## Music Theory Reference: [Key or Concept]

---

### Chromatic Scale Reference
C -- C#/Db -- D -- D#/Eb -- E -- F -- F#/Gb -- G -- G#/Ab -- A -- A#/Bb -- B -- (C)
                              ↑               ↑
                        Natural half step: E-F and B-C (no black key between these pairs)

---

### [Key] Major Scale

Notes: [list all 7 notes]
Formula: W -- W -- H -- W -- W -- W -- H
Starting note / Root: [note]

**Keyboard (one octave, C to C):**
```
 C  C# D  D# E  F  F# G  G# A  A# B  C
 |  ■  |  ■  |  |  ■  |  ■  |  ■  |  |
 *        *     *  *     *     *     *
 [Mark scale tones with *, root with (R)]
```

**Fretboard -- Low E string (6th string):**
```
Open  1    2    3    4    5    6    7    8    9    10   11   12
 E    F   F#   G   G#   A   A#   B    C   C#    D   D#   E
 [Mark scale root with (R), other scale tones with (○)]
```

---

### [Key] Natural Minor Scale

Notes: [list all 7 notes]
Formula: W -- H -- W -- W -- H -- W -- W
Relative major: [major key with same notes]
Parallel major: [same root, major quality] (3 more flats / 3 fewer sharps)

---

### Interval Reference Table

| Interval     | Half Steps | Interval Type  | Emotional Quality            | Example (from C) | Familiar Song Reference     |
|--------------|------------|----------------|------------------------------|------------------|-----------------------------|
| Unison       | 0          | Perfect        | Same pitch, powerful blend   | C to C           | Two voices in unison        |
| Minor 2nd    | 1          | Minor          | Maximum tension, dissonant   | C to Db          | Horror film theme           |
| Major 2nd    | 2          | Major          | Stepwise, conversational     | C to D           | "Happy Birthday" (first 2 notes) |
| Minor 3rd    | 3          | Minor          | Dark, introspective, minor feel | C to Eb       | "Smoke on the Water" riff   |
| Major 3rd    | 4          | Major          | Bright, warm, major feel     | C to E           | "When the Saints Go Marching" |
| Perfect 4th  | 5          | Perfect        | Open, anticipatory           | C to F           | "Here Comes the Bride"      |
| Tritone      | 6          | Aug4 / Dim5    | Tense, unstable, dissonant   | C to F#          | "Purple Haze" intro         |
| Perfect 5th  | 7          | Perfect        | Powerful, stable, hollow     | C to G           | "Twinkle Twinkle" (first leap)|
| Minor 6th    | 8          | Minor          | Bittersweet, warm            | C to Ab          | "The Entertainer" opening   |
| Major 6th    | 9          | Major          | Relaxed, nostalgic           | C to A           | "My Bonnie Lies Over the Ocean"|
| Minor 7th    | 10         | Minor          | Bluesy, wants to resolve     | C to Bb          | "Somewhere" (West Side Story)|
| Major 7th    | 11         | Major          | Lush, dreamy, jazzy          | C to B           | "Don't Know Why" (jazz ballad)|
| Octave       | 12         | Perfect        | Arrival, same note class     | C to C           | "Somewhere Over the Rainbow"|

---

### Chord Construction Formulas

| Chord Type   | Interval Stack          | Half Steps        | Example     | Notes    |
|--------------|-------------------------|-------------------|-------------|----------|
| Major        | Maj3 + min3             | 4 + 3 = 7 total   | C major     | C - E - G|
| Minor        | min3 + Maj3             | 3 + 4 = 7 total   | A minor     | A - C - E|
| Diminished   | min3 + min3             | 3 + 3 = 6 total   | B dim       | B - D - F|
| Augmented    | Maj3 + Maj3             | 4 + 4 = 8 total   | C aug       | C - E - G#|
| Major 7      | Maj + Maj7              | (4+3) + 4 = 11 total | Cmaj7   | C-E-G-B  |
| Dominant 7   | Maj + min7              | (4+3) + 3 = 10 total | C7      | C-E-G-Bb |
| Minor 7      | Min + min7              | (3+4) + 3 = 10 total | Am7     | A-C-E-G  |

---

### Diatonic Chords in [Key] Major

| Degree | Roman | Nashville | Chord Name  | Quality    | Notes         | Interval Math                          | Function      |
|--------|-------|-----------|-------------|------------|---------------|----------------------------------------|---------------|
| 1      | I     | 1         | [chord]     | Major      | [R - 3 - 5]   | Root(+4)[3rd](+3)[5th]                 | Tonic (home)  |
| 2      | ii    | 2m        | [chord]     | minor      | [R - 3 - 5]   | Root(+3)[3rd](+4)[5th]                 | Subdominant   |
| 3      | iii   | 3m        | [chord]     | minor      | [R - 3 - 5]   | Root(+3)[3rd](+4)[5th]                 | Tonic sub     |
| 4      | IV    | 4         | [chord]     | Major      | [R - 3 - 5]   | Root(+4)[3rd](+3)[5th]                 | Subdominant   |
| 5      | V     | 5         | [chord]     | Major      | [R - 3 - 5]   | Root(+4)[3rd](+3)[5th]                 | Dominant      |
| 6      | vi    | 6m        | [chord]     | minor      | [R - 3 - 5]   | Root(+3)[3rd](+4)[5th]                 | Tonic sub     |
| 7      | vii°  | 7dim      | [chord]     | diminished | [R - 3 - 5]   | Root(+3)[3rd](+3)[5th]                 | Dominant sub  |

---

### Common Progressions in [Key]

| Progression Name     | Nashville Numbers  | Chords in [Key]           | Functional Movement          | Emotional Feel               |
|----------------------|--------------------|---------------------------|------------------------------|------------------------------|
| Pop anthem           | 1 - 5 - 6m - 4     | [I - V - vi - IV]         | T - D - T - S                | Uplifting, anthemic          |
| Blues/rock classic   | 1 - 4 - 5 - 1      | [I - IV - V - I]          | T - S - D - T                | Driving, resolved            |
| Emotional ballad     | 6m - 4 - 1 - 5     | [vi - IV - I - V]         | T - S - T - D                | Yearning, emotional          |
| Jazz turnaround      | 2m - 5 - 1         | [ii - V - I]              | S - D - T                    | Smooth, sophisticated        |
| 50s / doo-wop        | 1 - 6m - 4 - 5     | [I - vi - IV - V]         | T - T - S - D                | Nostalgic, circular          |
| Descending minor     | 6m - 5 - 4 - 3m    | [vi - V - IV - iii]       | T - D - S - T                | Dark, film-score tension     |

---

### Key Signature Quick Reference (Circle of Fifths)

| Key    | Sharps/Flats | Notes in Key                         | Relative Minor |
|--------|--------------|--------------------------------------|----------------|
| C maj  | 0 (none)     | C D E F G A B                        | A minor        |
| G maj  | 1# (F#)      | G A B C D E F#                       | E minor        |
| D maj  | 2# (F#,C#)   | D E F# G A B C#                      | B minor        |
| A maj  | 3#           | A B C# D E F# G#                     | F# minor       |
| E maj  | 4#           | E F# G# A B C# D#                    | C# minor       |
| B maj  | 5#           | B C# D# E F# G# A#                   | G# minor       |
| F# maj | 6#           | F# G# A# B C# D# E#                  | D# minor       |
| F maj  | 1b (Bb)      | F G A Bb C D E                       | D minor        |
| Bb maj | 2b           | Bb C D Eb F G A                      | G minor        |
| Eb maj | 3b           | Eb F G Ab Bb C D                     | C minor        |
| Ab maj | 4b           | Ab Bb C Db Eb F G                    | F minor        |
| Db maj | 5b           | Db Eb F Gb Ab Bb C                   | Bb minor       |
| Gb maj | 6b           | Gb Ab Bb Cb Db Eb F                  | Eb minor       |

Sharp order: F# -- C# -- G# -- D# -- A# -- E# -- B#
Flat order:  Bb -- Eb -- Ab -- Db -- Gb -- Cb -- Fb

---

### Next Learning Steps
- [Concept 1 to explore next, based on what the user asked]
- [Related skill to consult: songwriting-framework for chord progressions in songwriting context]
- [Specific practice suggestion tied to their instrument]
```

---

## Rules

1. **Never use standard staff notation as the primary explanatory medium.** A beginner who does not read music will encounter a treble clef diagram and immediately feel excluded. All core explanations use note names (C, D, F#), interval numbers (4 half steps), and keyboard/fretboard diagrams. If the user already reads notation, offer a brief parallel reference -- but never require it.

2. **Always show the formula AND the resulting notes together.** Writing only "G major has one sharp" is insufficient. Always pair it with "G A B C D E F# -- the formula W-W-H-W-W-W-H applied from G forces that seventh note to become F# instead of F." Understanding why prevents the need to memorize 12 separate note lists.

3. **Never introduce more than one new concept before applying it.** Explain the chromatic scale, then immediately show how half steps and whole steps appear on the keyboard before building scales. Explain the major scale formula, then immediately derive two example keys. Explain triads, then immediately build all seven diatonic chords in the user's target key. Theory that is not immediately applied is not retained.

4. **Always show the interval math for chord construction, not just the note names.** Saying "C major is C-E-G" is a fact. Saying "C to E is 4 half steps (a major 3rd), E to G is 3 half steps (a minor 3rd), and the presence of a major 3rd in the lower position is what makes this chord major" is understanding. The understanding transfers to every other chord.

5. **Nashville number notation must be consistent:** uppercase numerals for major (1, 4, 5), lowercase or "m" suffix for minor (2m, 3m, 6m), "dim" or "°" for diminished (7dim). Do not mix Roman numerals and Arabic numbers inconsistently within the same explanation. When using Roman numerals, follow the convention: I ii iii IV V vi vii° -- uppercase for major, lowercase for minor, ° for diminished.

6. **Always explain enharmonic equivalents when sharps and flats both appear.** If you write F#/Gb, explain why the same pitch has two names and when each name is appropriate. Do not leave the user thinking they are dealing with two separate notes that happen to sound the same. The key-context rule (sharp keys use sharp names, flat keys use flat names) eliminates most confusion if stated clearly once.

7. **Never present the diatonic chord pattern as something to memorize.** Always derive it -- build each chord from scale tones by stacking thirds, then observe that the pattern I-ii-iii-IV-V-vi-vii° emerges from the math. The user who understands the derivation can reconstruct the pattern in any key independently; the user who memorizes a list is stuck if they forget one element.

8. **Anchor every abstract interval to a song example the user can hear.** Saying "a major 3rd is 4 half steps" is abstract. Saying "a major 3rd is the interval you hear at the start of 'When the Saints Go Marching In' between the first two different notes" makes it immediately tangible. Use widely recognized songs as anchors for at least the six most commonly discussed intervals: minor 3rd, major 3rd, perfect 4th, tritone, perfect 5th, and octave.

9. **Tailor visual references to the user's instrument.** Providing only keyboard diagrams to a guitarist who cannot visualize fretboard relationships is a missed opportunity. Guitar and bass players get fretboard diagrams alongside keyboard references. Piano players get detailed keyboard diagrams with fingering guidance omitted (fingering is technique, not theory). Voice students get interval singing mnemonics and melodic contour descriptions. Users without an instrument get keyboard visuals exclusively, because the piano keyboard is the clearest visual map of Western pitch space.

10. **Connect theory concepts to the chord progressions the user already plays or recognizes.** When a user says they know G, C, D, and Em, that is not just a list of chords -- it is a theory lesson hiding in plain sight. Those are the I, IV, V, and vi chords in G major. Start there. Grounding abstract concepts in things the user already knows builds confidence and accelerates understanding more effectively than starting from scratch with C major and making them wait to apply it to their own music.

---

## Edge Cases

### User Who Already Reads Standard Notation

Some users approach music theory from a classical background and are comfortable with treble and bass clef notation, key signatures on a staff, and rhythmic notation. Do not ignore their existing skill, but do not rely on it as the teaching medium.

Acknowledge that reading notation is an asset, then explain that this skill will map the same concepts into a different representational system -- one that makes the harmonic relationships more visually obvious than a staff does. The keyboard layout and interval tables make the half-step structure of Western music transparent in a way that the staff notation (which was designed for performance, not for theory visualization) does not. Many classically trained musicians have gaps in harmonic understanding precisely because they learned music as patterns on a staff rather than as interval relationships.

After each concept, offer a brief cross-reference: "On the treble staff, the G major scale would be notated with one sharp in the key signature (F#)" -- but keep the main explanation in note-name format.

### User Who Plays a Transposing Instrument (Trumpet, Alto Saxophone, Clarinet, French Horn)

Transposing instruments present a common source of confusion for beginners learning theory alongside their instrument lessons. A Bb trumpet player whose instrument sounds a concert Bb when they finger "C" will find that theory explanations in concert pitch (C = C) do not match what they read in their sheet music.

Explain the distinction clearly: music theory is always discussed in **concert pitch** -- the actual sounding pitch. Their instrument's "written pitch" is different. A Bb trumpet's written C = concert Bb. An Eb alto saxophone's written C = concert Eb. A French horn (in F) written C = concert F.

Recommend the following approach: (1) learn all theory in concert pitch so it is universally applicable, (2) always mentally convert "my written note" to "the sounding note" when applying theory, (3) treat their transposing as a mechanical calculation separate from theory understanding. Do not try to teach transposing instrument theory in written pitch -- the theoretical relationships will appear broken.

### User Interested in Only One Key or One Specific Song

A user who says "I just want to understand the chords in 'Wonderwall'" is not asking for a comprehensive theory curriculum -- they want to understand one specific situation. Deliver everything within that context.

Identify the key (Wonderwall is in F# minor / A major diatonic context, though it uses specific chord voicings). Build the complete diatonic analysis for that key. Show the user exactly which scale degrees their song's chords come from. Then, at the end, demonstrate that the same number pattern works in C major or G major -- taking 60 seconds to show universality without making it the lesson. The user who came for one answer and gets a broader insight they can use will appreciate the skill; the user forced through a full curriculum before getting their answer will not.

### User Confused About Why Minor and Major Sound "Happy" or "Sad"

This is one of the most common beginner questions and deserves more than "major is happy, minor is sad" because that framing is musically inaccurate and fails in practice. "Happy Birthday" in major sounds celebratory; "Nothing Else Matters" (Metallica) in minor is heavy but not necessarily sad; "We Will Rock You" is not exactly cheerful yet is in major.

Explain that the emotional associations come from several real acoustic properties: (1) the major 3rd (4 half steps) appears naturally in the overtone series of any note -- it is acoustically "built in" to how sound vibrates, which is why it sounds bright and settled; (2) the minor 3rd (3 half steps) is one half step lower than "what the physics wants," creating a slight tension that listeners perceive as darker or more ambiguous; (3) cultural conditioning also plays a role -- Western ears have been trained to associate minor keys with melancholy through centuries of musical tradition; (4) tempo, rhythm, and context often matter more than major/minor -- a fast minor key song sounds energetic, a slow major key song sounds somber.

This honest answer builds better musical judgment than a simple "major=happy" rule.

### User Who Plays Guitar and Knows Chord Shapes But Not Why They Work

This is the most common entry point for guitarists: they know the "cowboy chords" (G, C, D, Em, Am, E, A) but have no idea why those specific chords belong together or how to figure out other chords that would also fit.

Start from their specific chord knowledge. Identify which key those chords come from (G, C, D, Em, Am = key of G major -- I, IV, V, vi, ii). Then reverse-engineer the theory: explain that those chords are diatonic chords in G major, build the G major scale to show where those chords come from, show the interval math that constructs each chord, and then tell them that the two chords they might be missing (Bm = iii and F#dim = vii°) would also fit.

Follow this up with the transposition step: now that they understand the number system, show them that the same 1-4-5 progression in A major gives them A-D-E, and they may already know those shapes. This moment -- where theory they just learned produces practical chord knowledge they can immediately use -- is the payoff that converts a curious beginner into a motivated theory student.

### User Who Asks About Modes (Dorian, Phrygian, Mixolydian, etc.)

Modes appear in this skill's territory because they are derived from the major scale, but they are not covered in depth here. A beginner who asks about modes often does so because they heard the term somewhere and want to know if it is relevant to what they are doing.

Provide a brief, accurate explanation: modes are the seven different scales that result from starting a major scale pattern on each of its seven degrees rather than on the root. D Dorian uses the same notes as C major but starts on D: D E F G A B C D. E Phrygian uses C major notes starting on E. And so on. Each mode has its own formula and emotional character. Dorian is commonly used in rock and jazz; Mixolydian appears throughout blues and Americana; Phrygian appears in flamenco and metal.

Then clearly explain that modes are a next step beyond this skill's scope. Suggest they solidify major and minor scale understanding first -- modes will make much more sense once diatonic chord relationships are fully internalized. Do not attempt to teach modes within this skill.

### User Who Asks About the "Why" of the 12-Note Chromatic Scale

Occasionally a curious user will ask why Western music uses 12 equal pitches rather than some other number. This is a legitimate acoustic and historical question.

Explain the core idea: the perfect fifth (7 half steps, or a frequency ratio of approximately 3:2) is the most consonant interval after the octave. If you stack 12 perfect fifths on top of each other, you cycle through all 12 pitch classes and return almost exactly to your starting pitch (within a tiny margin called the Pythagorean comma). The 12-note system was not invented arbitrarily -- it emerged from the physics of stacked fifths. The equal temperament tuning system (used on modern pianos and fretted instruments) slightly flattens each fifth by 1/12th of the Pythagorean comma so that all 12 keys are equally in tune, a compromise that became standard in Western music after centuries of debate. This is why the circle of fifths has 12 keys -- it maps the same acoustic phenomenon.

Acknowledge that other musical traditions (Indian classical music, Arabic maqam, microtonal composition) use different pitch systems with more divisions. This skill covers the 12-tone equal temperament system that underlies virtually all Western pop, rock, country, jazz, and classical music.

---

## Example

**Input:** "I play guitar. I know open chords: G, C, D, Em, Am, E, and A. I have no idea why some of those go together and others don't. I want to understand the theory behind this without having to read sheet music. I eventually want to write my own songs."

---

## Music Theory Reference: Key of G Major -- Why Your Chords Go Together

---

### The Short Answer First

Your chords G, C, D, Em, and Am all come from the same "family" -- the key of G major. They share a pool of seven notes, which is why they blend naturally. Your chords E and A come from different families, which is why mixing them with the others sounds clunky unless handled carefully. Here is the full explanation of why.

---

### Step 1: The Foundation -- 12 Notes, Two Types of Distance

Western music uses 12 notes arranged in a repeating cycle called the **chromatic scale:**

```
C -- C# -- D -- D# -- E -- F -- F# -- G -- G# -- A -- A# -- B -- (back to C)
```

There are two distances (intervals) between adjacent notes:

- **Half step (semitone):** one note to the immediately next note. C to C# = 1 half step. E to F = 1 half step.
- **Whole step (tone):** two half steps. C to D = 1 whole step. E to F# = 1 whole step.

**Critical observation:** Between E and F, and between B and C, there is NO black key on the piano. Those pairs are naturally a half step apart. This quirk of the chromatic scale is why key signatures exist -- scales have to "route around" those natural half steps to maintain the right pattern.

---

### Step 2: The G Major Scale -- Where Your Chords Come From

A **major scale** always follows this interval pattern: **W -- W -- H -- W -- W -- W -- H**
(whole, whole, half, whole, whole, whole, half)

Starting on G and applying the formula:

```
G (W) A (W) B (H) C (W) D (W) E (W) F# (H) G
```

**G major scale: G -- A -- B -- C -- D -- E -- F# (7 notes)**

The formula forced the 7th note to be F# instead of F. If we used F natural, the gap from F to G would be a whole step, but the formula requires a half step there. One sharp (F#) is the price of starting the major scale pattern on G.

**Keyboard diagram (one octave):**
```
 C   C#  D   D#  E   F   F#  G   G#  A   A#  B   C
 |   ■   |   ■   |   |   ■   |   ■   |   ■   |   |
             (○)         (○)  (R)         (○)      (○)  (○)     -- G, A, B (previous octave)
 (○)              (○)    (○)  (R)  (○)         (○)      (○)
 C   --  D   --  E   --  F#  G   --  A   --  B   C
 (○)              (○)    (○)  (R)  (○)         (○)      (○)
```

Simplified -- notes in G major scale marked with ★, root with [R]:

```
|  C  |C#| D  |D#| E  |  F  |F#| G  |G#| A  |A#| B  |  C |
|     | ■ |    | ■ |    |     | ■ |    | ■ |    | ■ |    |    |
  ★              ★    ★         ★   [R]      ★         ★    ★
(C and B from previous octave included to show the full scale starting on G)
```

**Fretboard -- Low E string (6th string), G major scale:**
```
Fret:  0    1    2    3    4    5    6    7    8    9    10
Note:  E    F   F#    G   G#    A   A#    B    C   C#    D
           ★   [R]         ★              ★         
Fret: 11   12
