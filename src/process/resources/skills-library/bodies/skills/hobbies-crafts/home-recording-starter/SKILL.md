---
name: home-recording-starter
description: |
  Guides beginners through setting up a home recording environment: the audio
  signal chain (instrument to interface to DAW to monitors), digital audio
  workstation basics, room treatment tips for reducing reflections, and
  gear recommendations organized by budget tier. Use when the user wants to
  record music at home, asks about audio interfaces, microphone selection,
  DAW setup, or room acoustics for recording. Do NOT use for music theory
  (use music-theory-fundamentals), songwriting (use songwriting-framework),
  or professional studio design and mixing techniques.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "beginner-friendly step-by-step guide checklist"
  category: "hobbies-crafts"
  subcategory: "performing-arts"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Home Recording Starter

## When to Use

Use this skill when the user presents any of the following situations:

- User wants to record music at home for the first time and does not know where to start -- they may say "I want to record my songs," "I want to make demos," or "I want to start a home studio"
- User asks specifically about audio interfaces, what they do, how to choose one, or how to connect one to a computer or instrument
- User asks about microphone selection for home recording: which type to buy, how to position it, why their recordings sound distant or boxy
- User wants to set up a DAW for the first time or is confused by DAW settings such as sample rate, buffer size, or bit depth
- User asks how to treat a bedroom, apartment, or garage for better recording sound without spending a lot of money
- User wants gear recommendations within a specific budget for vocals, acoustic guitar, electric guitar, bass, piano, or simple drum recording
- User is experiencing a specific technical problem: crackling audio, high latency in headphones, clipping on the meter, or the DAW not recognizing the interface
- User wants to understand the complete signal chain from instrument to finished audio file

Do NOT use this skill when:

- The user wants music theory instruction -- harmonic intervals, chord construction, scales, or modes (use `music-theory-fundamentals`)
- The user wants help writing lyrics, chord progressions, song structure, or melodic hooks (use `songwriting-framework`)
- The user wants a structured practice schedule for an instrument (use `practice-routine-builder`)
- The user needs professional studio design, critical listening, or advanced mixing and mastering techniques beyond beginner gain staging and track volume -- this skill stops at capturing clean audio, not polishing it
- The user is asking about live sound reinforcement, PA systems, or front-of-house mixing for live performance -- these have fundamentally different signal flow and priorities
- The user is asking about broadcast audio, podcast production, or Foley recording -- while the gear overlaps, those workflows have different standards and are out of scope here
- The user needs MIDI sequencing, software synthesis, beat production, or electronic music production -- those involve a different core workflow centered on virtual instruments, not microphones and acoustic spaces

---

## Process

### Step 1: Gather Context Before Recommending Anything

Ask the user a focused set of questions before suggesting any gear or software. The single biggest mistake when helping beginners is recommending gear before understanding what they actually need.

- **What to record:** Is the primary source vocals, acoustic guitar (fingerpicked vs strummed -- this affects mic placement), electric guitar (amp or direct), bass (amp or direct), upright or digital piano, a full arrangement overdubbed one track at a time, or something else? Different sources have dramatically different SPL (sound pressure level) ranges and frequency content.
- **Recording goal:** Demo quality for personal use, releasing to streaming platforms, sharing with collaborators, film scoring, or podcast-adjacent spoken word alongside music? This determines how much sonic accuracy matters.
- **Computer hardware:** Operating system (Windows 10/11, macOS Ventura+, or Linux), available port types (USB-A, USB-C, Thunderbolt 3/4), RAM (8 GB minimum functional, 16 GB recommended), and hard drive type (SSD is strongly preferable over HDD for audio to avoid dropouts during multitrack sessions).
- **Budget:** Firm or flexible? $150 or under, $200-400, $400-700, or $700-1200. Confirm whether the budget is for all gear combined or per item.
- **Room:** Bedroom (most common), closet (actually useful), living room (large reverb problem), apartment with noise restrictions, garage or basement (HVAC noise and concrete reflections are separate problems), or recording outdoors.
- **Existing gear:** Do they already own headphones, a microphone, a guitar with a pickup, a MIDI keyboard, or any recording software? Identifying existing assets prevents unnecessary purchases and finds upgrade targets.
- **Experience:** Never recorded digitally before, recorded on a phone or GarageBand on iPhone, used a DAW years ago and returning, or a musician who is new only to the technical side.

Compile all answers before moving to Step 2. If the user has answered several of these in their initial message, proceed with what they have provided and ask only the missing critical pieces.

### Step 2: Explain the Signal Chain With This Specific User's Context

The signal chain is not optional background information -- it is the conceptual foundation that determines every gear decision. A user who understands the chain makes better choices and can troubleshoot their own problems.

Walk through each link in the chain using the user's actual instruments and room as examples:

- **Source (acoustic energy):** The vibrating string, vocal cord, or membrane. Characteristics include SPL (how loud it is in dB), frequency range (a kick drum goes to 50 Hz, a violin up to 15 kHz), and directional pattern (does the sound radiate in all directions or primarily one direction). For a vocal, the primary energy is 80 Hz to 10 kHz. For acoustic guitar, 80 Hz to 14 kHz with significant energy at 200-500 Hz and attack transients at 2-5 kHz.
- **Transducer (microphone or pickup):** Converts acoustic energy to an analog electrical signal measured in millivolts. Dynamic microphones (moving coil design) handle high SPL (up to 150 dB SPL) and reject off-axis noise, making them excellent for close-miking loud sources and for recording in untreated rooms. Condenser microphones (capacitor design with electrically charged diaphragm) are more sensitive, capture transients faster, and extend to higher frequencies -- but they also capture more room noise and require 48V phantom power supplied by the interface. A large-diaphragm condenser (LDC, diaphragm diameter 1 inch or larger) is the standard choice for vocals and acoustic instruments. A small-diaphragm condenser (SDC, pencil mic, diaphragm smaller than 1 inch) is preferred for stereo acoustic guitar and instruments where off-axis coloration matters.
- **Cable:** XLR (3-pin balanced) from microphone to interface. Balanced cables carry the signal on two conductors with opposite polarity -- the interface's differential input cancels noise introduced along the cable length. For instrument direct input (guitar, bass, keyboard), a 1/4-inch TS (unbalanced, two conductors) is used for short runs; a 1/4-inch TRS (balanced) is used for line-level gear and monitor connections.
- **Audio interface:** The hardware hub of the entire chain. Functions include: microphone preamplifier (mic-level signal, approximately -60 dBV, boosted to line-level, approximately -10 dBV, typically 40-60 dB of gain); phantom power switch (48V DC for condenser microphones, harmless to dynamic mics); analog-to-digital converter (ADC, converts the amplified analog signal to digital binary data at the specified sample rate and bit depth); USB/Thunderbolt data transfer to the computer; digital-to-analog converter (DAC, converts digital playback back to analog for headphones and monitors); and a headphone amplifier for zero-latency direct monitoring.
- **Computer + DAW:** The computer stores the digital audio data. The DAW is software that organizes audio into tracks, enables editing, applies processing (equalization, compression, reverb), and exports the final mix. At the recording stage, the critical DAW function is simply capturing the incoming digital audio at a clean level without clipping.
- **Output transducers (monitors and headphones):** Closed-back headphones (sealed earcup) prevent headphone bleed into the microphone during tracking -- this is mandatory for any session where the performer is wearing headphones while a microphone is recording in the same room. Open-back headphones have a more accurate stereo image and are better for mixing, but their sound leakage makes them unusable for tracking. Studio monitors (near-field speakers with flat frequency response, typically 5-inch or 8-inch woofer for home use) are used for mixing and playback when no microphone is active.

Draw the chain visually for the user using their specific sources (see Output Format).

### Step 3: Address Room Acoustics Before Recommending Gear

This order is deliberate. Room problems cannot be fixed with better equipment -- a $500 microphone in a bad room sounds worse than a $100 microphone treated with blankets. Cover room treatment before the gear list so the user allocates budget correctly.

**Understand the two distinct room problems:**

- **Reflection and flutter echo:** Hard parallel surfaces (bare walls, hardwood floors, glass windows) cause the sound to bounce back to the microphone milliseconds after the direct signal arrives. This creates a "washy," indistinct, or obviously reverberant recording. Flutter echo is a rapid repetition heard as a metallic "ping" when you clap in a bare room. Both are caused by insufficient high-frequency absorption.
- **Room modes and bass buildup:** Every room has resonant frequencies determined by its dimensions. The formula for the lowest axial mode is: f = 1130 / (2 x dimension in feet), where 1130 is the speed of sound in feet per second. For a 10-foot wide room, the first mode is 56.5 Hz. Bass builds up at these frequencies and at corners where three room surfaces meet (tri-corner bass trap locations). This causes boomy, uneven low-frequency response -- a note at the resonant frequency will sound louder than surrounding notes.

**Practical treatment priorities in order of cost-effectiveness:**

1. **First reflection point absorption (highest priority, lowest cost):** The first reflection point is where the direct sound from the source reflects off the wall and ceiling before reaching the microphone or the listener's ears. For a vocal setup, it is the wall directly behind the singer and the wall the microphone faces. Hang moving blankets, sleeping bag material, or a winter coat on a mic stand behind the source. This single action reduces the most audible reflections.
2. **Floor treatment:** A thick area rug (wool, minimum 5x7 feet, ideally 8x10 feet) placed under the recording position eliminates floor bounce, which is the clearest path for a reflection to travel.
3. **Recording in a closet or near a bed:** A closet full of hanging clothes is one of the best free vocal booths available. The irregular surfaces and soft materials absorb mid and high frequencies effectively. Recording at the foot of a fully made bed (blanket, pillows stacked against the headboard) creates similar absorption on one side.
4. **DIY panel construction:** 2x4 frame filled with 703 rigid fiberglass or Rockwool/Mineral wool insulation (2-inch thickness absorbs down to approximately 500 Hz; 4-inch thickness absorbs down to approximately 250 Hz), wrapped in acoustically transparent fabric (muslin or burlap). Materials cost $40-80 per 2x4-foot panel. Four panels placed at the four wall reflection points surrounding the recording position constitute a functional treated space.
5. **Corner bass traps:** Stacking 4 inches or more of absorption material (or commercial bass trap panels) in floor-to-ceiling corners reduces low-frequency buildup. This is less critical for home recording tracks (which will be EQ'd in mixing) than for mixing rooms, but it reduces the boxy coloration in recordings.

**What to tell the user NOT to do:**
- Egg cartons absorb almost nothing -- their surface area creates diffusion at very high frequencies but provides zero meaningful absorption in the 200-2000 Hz range where most coloration problems live
- Foam "soundproofing" sold cheaply online (1-inch pyramid foam) adds minimal absorption and zero sound isolation (mass and decoupling reduce sound transmission, not foam)
- Do not over-deaden a room -- when every surface is absorbed, the recording sounds unnaturally dry and may require heavy reverb in mix to sound listenable; aim for controlled reflections, not a dead room

### Step 4: Build the Gear Recommendation by Budget Tier

Organize recommendations around the user's stated budget. Provide specific specifications, not just categories, so the user knows exactly what to look for on a product page.

**Starter Tier ($150 and under) -- The Minimum Viable Studio:**

The constraint at this budget is that a separate audio interface plus microphone plus headphones totals approximately $150-180, leaving nothing for optional items. The viable alternative is a USB microphone (microphone and ADC combined in one unit, connects directly via USB with no separate interface required).

- USB microphone specifications to look for: cardioid polar pattern, frequency response 50 Hz to 15 kHz or wider, USB-A or USB-C connection, built-in headphone monitoring jack (critical -- avoids computer-induced latency). Trade-off: cannot add a second microphone without a separate interface, and preamp quality is determined by the microphone manufacturer rather than a dedicated interface.
- Headphones: closed-back, over-ear, impedance 32-80 ohms (lower impedance headphones are easier to drive from a USB microphone's small headphone amp), frequency response 20 Hz to 20 kHz. Avoid consumer "bass-boosted" headphones -- they mislead the listener about low-frequency content.
- DAW: GarageBand (free, macOS/iOS only), Cakewalk by BandLab (free, Windows only), or Ardour (free, open source, all platforms). GarageBand is the easiest for a complete beginner; Cakewalk provides a professional feature set at no cost.
- Total: $80-150 for USB microphone + $30-50 for headphones + $0 DAW = $110-200.

**Home Studio Tier ($200-500) -- The Full Signal Chain:**

This budget enables a proper audio interface plus dedicated microphone, which unlocks future expansion (add a second microphone, instrument direct input, MIDI keyboard).

- Audio interface specifications: USB 2.0 or USB-C connection, 2 XLR/TRS combo inputs (handles both microphone XLR and instrument 1/4-inch in one jack), 48V phantom power switch (per-channel or global), onboard direct monitoring with a mix knob (blends live input signal with DAW playback at zero latency), minimum 24-bit/96kHz ADC/DAC, headphone output with dedicated volume knob, ASIO driver support (Windows) or Core Audio compatibility (macOS). Budget: $100-150.
- Large-diaphragm condenser microphone specifications: 1-inch gold-sputtered diaphragm, cardioid polar pattern (some models offer multi-pattern: omni and figure-8 as well), frequency response 20 Hz to 20 kHz, self-noise below 15 dB(A) (quieter is better -- self-noise floor determines how well the mic captures quiet acoustic sources like fingerpicked guitar), maximum SPL handling 130 dB or higher. Budget: $80-150.
- XLR cable: 10 to 15 feet, quad-core shielded (Mogami, Canare, or any cable using Neutrik-style connectors at the ends) for minimum interference pickup. Budget: $12-20.
- Boom mic stand: floor-standing, adjustable boom arm, weighted base (lighter stands tip and vibrate). Budget: $20-35.
- Pop filter: double-layer nylon mesh or perforated metal, gooseneck clamp, 6-inch diameter minimum. A pop filter placed 2 to 3 inches in front of the microphone diaphragm reduces the pressure bursts from plosive consonants (P, B, T, K) that cause low-frequency clipping. Budget: $10-20.
- Closed-back headphones: 40mm or larger drivers, frequency response 10 Hz to 25 kHz, impedance 35-80 ohms, coiled or straight cable, clamping pressure comfortable for 2+ hour sessions. Budget: $50-80.
- Total for interface + microphone + cable + stand + pop filter + headphones: $272-455.

**Serious Hobbyist Tier ($500-1000) -- Quality and Flexibility:**

- Audio interface: Same criteria as mid tier but with USB-C or Thunderbolt connection for lower jitter, better ADC/DAC chips (look for THD+N below -90 dB and dynamic range above 110 dB in spec sheets), and 4 inputs (allows simultaneous stereo guitar mic, vocal mic, and keyboard direct input). Budget: $200-300.
- Microphone set: Both a large-diaphragm condenser (for vocals, acoustic instruments) and a dynamic cardioid (for electric guitar amp, snare, close-miking loud sources). Together: $150-250.
- Shock mount: Isolates the condenser microphone from stand vibration -- floor footsteps, HVAC rumble, and bumping the stand will not appear as low-frequency noise in the recording. Ensure the shock mount is compatible with the microphone's body diameter. Budget: $20-40.
- Reflection filter: A curved absorptive panel that mounts on the mic stand behind the microphone, reducing rear reflections from the room wall. Effective for mid and high frequencies (above 500 Hz). Reduces but does not eliminate room sound. Budget: $40-80.
- Studio monitors: Near-field, active (powered), 5-inch woofer minimum (8-inch for better bass extension in a room larger than 12x12 feet), frequency response 50 Hz to 20 kHz or wider, XLR or TRS balanced input, front-facing bass port preferred for placement near walls. A matched pair is critical -- monitors must be identical for accurate stereo. Budget: $150-350 per pair.
- Acoustic treatment panels: 4 to 6 panels as described in Step 3, placed at first reflection points on the walls and ceiling at the recording position. Budget: $150-300 DIY or $200-400 commercial.
- Full DAW license: A paid DAW adds features beyond what bundled software offers -- non-destructive comping (selecting the best parts of multiple takes), advanced automation, flexible plugin support (VST3/AU). Budget: $0-200 (some DAWs are one-time purchase; others are subscription).
- Total: $710-1170 (can be staged over time by buying the interface, microphone, and headphones first).

### Step 5: Configure the DAW

DAW configuration for recording is not about learning every feature -- it is about setting four parameters correctly before the first recording session. Wrong settings cause problems that beginners misdiagnose as hardware failures.

**Driver selection (Windows-specific):**
- Windows requires ASIO (Audio Stream Input/Output) drivers for low-latency recording -- Windows' built-in audio drivers (WDM/WASAPI) introduce 30-100 ms of latency, which is perceivable as a distracting echo in headphones while performing
- Install the manufacturer's ASIO driver from the interface manufacturer's website before opening the DAW
- In the DAW audio preferences, select the interface's ASIO driver, not "Generic ASIO" and not the Windows audio device
- On macOS, Core Audio handles low-latency audio natively -- no driver installation is usually needed, but interface firmware updates from the manufacturer improve stability

**Sample rate:** Set to 44100 Hz for music intended for streaming or CD distribution (44.1 kHz is the standard for these formats and avoids sample rate conversion artifacts). Set to 48000 Hz if the recorded music will be used in video production (48 kHz is the broadcast and video standard). Do not set to 96000 Hz for beginner recording -- it doubles the file size, increases CPU load, and provides no perceptible quality benefit for tracking vocals and acoustic guitar; 24-bit depth at 44100 Hz captures more dynamic range (144 dB theoretical) than any acoustic space or microphone can produce.

**Buffer size:**
- Buffer size controls how many audio samples the computer collects before processing them and sending them to the output. Small buffers = fast processing = low latency (the delay you hear in headphones). Large buffers = slower processing = higher latency but less CPU strain.
- For tracking (recording): set buffer to 64 or 128 samples. At 44100 Hz, 128 samples = approximately 2.9 ms latency, which is imperceptible. Most modern computers handle 128 samples without dropouts.
- For mixing (no live recording): increase to 512 or 1024 samples to allow more plugins to run simultaneously without audio dropouts (crackling, skipping).
- If crackling occurs at 128 samples: increase to 256 and test again. Crackling at any buffer size suggests a driver issue, USB bandwidth contention (unplug other USB devices), or background processes consuming CPU (turn off WiFi, browser tabs, antivirus scan during recording).

**Bit depth:** Always record at 24-bit, not 16-bit. 24-bit provides 144 dB of theoretical dynamic range versus 96 dB for 16-bit. This extra headroom means that even if the recorded signal is lower than optimal, it can be boosted in the DAW without audible noise floor problems. Export the final mix at 16-bit/44100 Hz for distribution (streaming platforms accept 16-bit; the bit depth reduction from 24 to 16 should use dithering, but this is a mixing concern for later).

**Creating the first recording session:**
1. Open DAW, create a new empty project. Set project sample rate to match the interface setting (they must be identical -- a mismatch causes pitch-shifted, distorted audio).
2. Create a mono audio track (one microphone = one channel = mono track; a stereo track wastes a channel for single microphone recording).
3. Assign the track input to Interface Input 1 (or whichever physical input has the microphone connected).
4. Arm the track for recording (the red record enable button on the track).
5. Enable input monitoring on the track (lets you hear the input signal in your headphones through the DAW; alternatively, use the interface's direct monitoring to hear input without DAW-induced latency).
6. Speak or play at performance volume. Watch the track's input meter.
7. Adjust the interface gain knob until average peaks hit approximately -18 dBFS and loudest peaks do not exceed -6 dBFS. The full target range is -18 dBFS average to -6 dBFS peak, often stated as "peaking at -12 dBFS" as a single reference point. The critical rule: peaks must never reach 0 dBFS during recording. Digital clipping at 0 dBFS creates hard, irrecoverable distortion. Analog clipping (if the gain is too hot going into the interface preamp) creates distortion before the ADC even converts the signal.
8. Place the click track (metronome) in the mix -- in most DAWs, enable the metronome in the transport bar and set the project tempo to match the song.
9. Press record. Perform. Press stop.
10. Disarm the track, press play, listen through headphones or monitors.

### Step 6: Microphone Placement for Common Sources

Placement determines the sound before any processing. Moving a microphone 2 inches changes the recording more than switching between two midrange condenser microphones.

**Vocals:**
- Distance: 6 to 8 inches from the capsule. Closer than 4 inches exaggerates bass frequencies due to the proximity effect (a physical characteristic of cardioid and directional mics -- the low-frequency response rises as the mic approaches the source). This can be used creatively for a warm, intimate sound on male vocals, or avoided for bright female vocals. Further than 12 inches picks up excessive room reflections.
- Angle: microphone capsule aimed directly at the mouth (on-axis) for maximum clarity. Aiming the capsule at the forehead or chin (slightly off-axis) can reduce sibilance (harsh "s" and "sh" sounds) if they are a problem.
- Pop filter: positioned 2 to 3 inches in front of the capsule between the capsule and the singer's mouth.
- Singer position: singer stands or sits, does not lean into or away from the microphone while singing -- consistent distance is more important than perfect distance.

**Acoustic guitar:**
- Single microphone placement (standard starting point): aim the capsule at the point where the neck meets the body (12th fret area), 6 to 10 inches away. This balances the low-end warmth from the body with the clarity and string attack from the neck. Avoid aiming directly at the soundhole -- the soundhole produces a boomy, uneven low-frequency response.
- Alternative for more brightness: move toward the headstock end of the neck, 8 to 12 inches away. Captures string detail and attack.
- Alternative for more warmth and body: aim toward the lower bout (the larger rounded area of the body, opposite the waist) from 6 to 10 inches away.
- Stereo placement (requires two microphones and two interface inputs): XY configuration (two cardioid mics crossed at 90 degrees, capsules co-incident at a single point) placed 8 to 12 inches from the guitar provides a natural stereo image without phase problems. ORTF (microphones angled at 110 degrees apart, capsules spaced 17 cm) provides a wider stereo field.

**Electric guitar (amplifier):**
- Dynamic microphone on the speaker cone: place the microphone 1 to 3 inches from the speaker grille, aimed at the edge of the dust cap (the center dome of the speaker cone) rather than the center. The center of the cone produces a harsher, brighter sound; the edge produces a fuller, more balanced tone. This single-mic technique requires no room treatment.
- Blended approach (requires two inputs): combine the close dynamic microphone with a condenser placed 3 to 6 feet back to capture room ambience. These two signals are mixed to taste in the DAW.
- Direct injection (DI): plug the guitar directly into a DI (direct injection) box or into the instrument input of the audio interface, and use an amplifier simulation plugin in the DAW. Eliminates room acoustic problems entirely and allows re-amping later. Suitable for apartments where amp volume is a problem.

**Bass guitar:**
- DI is the standard home recording approach for bass: plug the bass directly into the instrument input on the interface. The low frequencies of a bass (40-200 Hz) require long wavelengths to develop -- a microphone placed near a bass cabinet in a small room captures a boom-heavy, uneven signal that is difficult to mix.
- If miking a bass cabinet: use a dynamic microphone 1 to 2 inches from the speaker cone, same placement principles as electric guitar.

### Step 7: Conduct a First Recording Session Walkthrough

Walk the user through their complete first session from silence to saved file.

Pre-session checklist:
- Instrument is in tune (use a clip-on tuner or tuner plugin in the DAW)
- Room is set up: microphone positioned, pop filter attached, blankets hung, rug in place
- Interface connected and powered (bus-powered USB interfaces draw power from the USB port; some larger interfaces require a separate power adapter)
- DAW open with project created, track armed, input assigned

During recording:
- Perform 30 to 60 seconds of the song while watching the meter. Identify the loudest moment and ensure it does not reach 0 dBFS. Adjust gain. This is called a "sound check pass" and prevents discovering a level problem after the best take.
- Record multiple takes -- at least 3 complete takes of each part. Track one take per pass (do not stack multiple passes in one recording arm). The best take is selected in editing.
- For each take, announce the take number out loud into the microphone at the start ("Take 1"), then wait 3 seconds before playing. This creates an audible cue in the DAW timeline for finding take boundaries.

Post-recording:
- Save the project immediately with a descriptive name including the date (e.g., "vocal_demo_acoustic_2024-03-15_take3").
- Export the raw recorded audio file as a WAV (uncompressed, 24-bit, 44100 Hz) to a separate backup folder. Do not rely solely on the DAW project file -- a WAV backup is readable in any audio software.
- Listen through headphones and identify any takes with clipping (a clip indicator light on the track header in the DAW turns red), excessive noise (interface gain too high introducing hiss), or technical problems (microphone rubs against stand, cable bumps), and flag those takes for re-recording.

---

## Output Format

Deliver the following structured plan as the response. Fill in every bracketed field with real content based on the user's specific situation. Never leave fields blank.

```
## Home Recording Setup Plan

### Recording Goal Summary
- Primary source(s): [e.g., acoustic guitar and lead vocals, recorded as separate overdubbed tracks]
- Recording objective: [demo quality / streaming release / film score / personal archiving]
- Budget: $[amount] ([tier name])
- Computer: [OS and version], [port types available], [RAM if known]
- Room: [room type, dimensions if known, floor material, notable features]
- Existing gear: [list items the user already owns]

---

### Signal Chain Diagram

For [user's primary source]:

[Source: Acoustic Guitar / Voice / Electric Guitar DI / etc.]
    |
    v
[Transducer: Large-diaphragm condenser mic / Dynamic mic / DI box / Pickup]
    |  (XLR balanced cable, [length] ft)
    v
[Audio Interface: USB, 2-input, with 48V phantom power]
    | (USB-C / USB-A to computer)
    v
[Computer: Windows/macOS + DAW software]
    |
    v
[Output: Closed-back headphones (tracking) / Studio monitors (playback/mix)]

---

### Gear Checklist

| Item                   | Role in Signal Chain        | Minimum Specification                                      | Budget Estimate |
|------------------------|-----------------------------|------------------------------------------------------------|-----------------|
| Audio interface        | ADC/preamp/phantom power    | 2 combo inputs, 48V phantom, USB, direct monitoring        | $[price]        |
| Microphone             | Acoustic-to-electric        | [LDC cardioid / dynamic cardioid] -- specific to source    | $[price]        |
| XLR cable              | Mic to interface            | 10-15 ft, balanced, shielded, locking connectors           | $[price]        |
| Boom mic stand         | Microphone positioning      | Floor stand, adjustable boom, weighted base                | $[price]        |
| Pop filter             | Plosive protection          | Double nylon or perforated metal, 6-inch, gooseneck clamp  | $[price]        |
| Closed-back headphones | Tracking monitor            | Over-ear, sealed, 32-80 ohms, 20 Hz to 20 kHz response    | $[price]        |
| [Studio monitors]      | Playback/mixing             | Active near-field, 5-inch woofer, balanced input [if budget allows] | $[price] |
| [Acoustic panels/DIY]  | Reflection control          | 2-inch rigid fiberglass or Rockwool, 4+ panels [if budget] | $[price]       |
| **Estimated Total**    |                             |                                                            | **$[sum]**      |

Items in brackets are optional based on budget. List what to buy first if budget is limited.

---

### DAW Configuration Checklist

DAW: [specific DAW name -- e.g., GarageBand (free, macOS), Cakewalk by BandLab (free, Windows), Reaper ($60 license), Logic Pro ($199.99 macOS), Ableton Live Lite (free bundled)]

- [ ] Install DAW and any required interface drivers
      Windows: Install manufacturer ASIO driver first; select it in DAW Audio Preferences > Driver Type > ASIO
      macOS: No driver install required for most interfaces; select interface under System Preferences > Sound (verify) then in DAW Preferences > Audio > Device
- [ ] Set sample rate: [44100 Hz for music release / 48000 Hz if using with video]
- [ ] Set bit depth: 24-bit
- [ ] Set buffer size: 128 samples (recording mode) -- increase to 512-1024 for mixing
- [ ] Confirm round-trip latency shown in DAW (should be under 10 ms total at 128 samples on most interfaces)
- [ ] Create new project, set tempo to [user's tempo or 120 BPM default]
- [ ] Create mono audio track, label it (e.g., "Vocal_Take1")
- [ ] Assign track input to Interface Input 1 (or 2 per physical connection)
- [ ] Enable direct monitoring on interface OR enable input monitoring on DAW track
- [ ] Arm track for recording, test signal level
- [ ] Target: average peaks -18 dBFS, loudest peaks no higher than -6 dBFS, never touching 0 dBFS

---

### Room Treatment Plan

Room condition: [summarize the user's room -- e.g., 10x12 ft bedroom, hardwood floors, one window, minimal furniture]
Primary problem: [reflections / bass buildup / noise bleed / all three]

| Priority | Treatment                        | Location                                       | Method (DIY or commercial)          | Est. Cost |
|----------|----------------------------------|------------------------------------------------|-------------------------------------|-----------|
| 1        | First reflection point -- wall   | Wall behind the singer / behind the mic        | 2 moving blankets hung from curtain rod or mic stand | $0-20 |
| 2        | Floor treatment                  | Under the recording position                   | Thick area rug, minimum 5x7 ft      | $20-50    |
| 3        | First reflection point -- ceiling| Overhead between source and ceiling            | Blanket draped over a suspended rod or foam panel taped flat | $0-30 |
| 4        | Recording position               | Record at the open face of a clothes closet    | Use existing closet                 | $0        |
| 5        | Corner bass traps                | Floor-to-ceiling corners of the room           | Stack 4+ inch rockwool or use dedicated bass trap panels | $30-80 |
| 6        | DIY absorption panels            | Side walls at listening/mic height             | 2x4 frame, 2-inch Rockwool, fabric wrap | $40-80 per panel |

Realistic expectation: With treatments 1-4 (cost: $20-70), a small bedroom will record vocals and acoustic guitar with noticeably less room coloration. Treatments 5-6 are meaningful improvements but not required for clean demo-quality recording.

---

### First Session Walkthrough

Setup:
1. [Microphone placement specific to source and distance]
2. [Pop filter position if recording vocals]
3. [Phantom power on/off -- on for condenser, off or leave on for dynamic]
4. [Interface gain starting position -- begin at 9 o'clock (25%), increase while playing]

Level setting:
5. Play/sing at performance volume (the loudest you will be during the actual take)
6. Adjust gain until loudest peaks read approximately -10 to -12 dBFS on the DAW track meter
7. If meter hits 0 and clips: reduce gain, re-test
8. If meter barely moves above -30 dBFS: check cable connection, confirm phantom power for condenser, confirm input assignment in DAW

Recording:
9. Announce take number into the mic, wait 3 seconds, begin performance
10. Complete the entire performance without stopping for minor mistakes (fix in a second take, not mid-take)
11. Press stop. Save project.

Review:
12. Rewind to the start. Listen through headphones at a moderate volume.
13. Check for: audible clipping (harsh distortion), excessive hiss (reduce gain and re-record), excessive room reverb (add more absorption, move mic closer to source), cable or stand noise (re-examine physical setup)
14. Record at least 2 more takes. Compare takes and mark the keeper.

---

### Common Problems and Quick Fixes

| Problem                            | Likely Cause                                          | Fix                                                        |
|------------------------------------|-------------------------------------------------------|------------------------------------------------------------|
| No signal in DAW                   | Interface not selected as audio device, track input not assigned, track not armed | Check each step in DAW audio preferences, track input, and arm button |
| Clipping (meter hits red at 0 dBFS)| Interface gain too high                               | Turn gain knob counterclockwise, re-test                   |
| Loud hiss behind the signal        | Gain too high, condenser in noisy room, cheap cable   | Reduce gain, move mic closer to source, check cable        |
| Echo/reverb in recording           | Bare room reflections captured by mic                 | Hang blankets behind singer, move mic closer (6-8 inches for vocals) |
| Crackling/dropouts                 | Buffer too small for CPU load, USB bandwidth issue    | Increase buffer size to 256, disconnect other USB devices  |
| Buzzing 60 Hz hum                  | Ground loop, often from nearby phone charger or light dimmer | Move away from sources, use balanced cables, turn off dimmers |
| Latency echo in headphones         | DAW input monitoring adding latency                   | Enable direct monitoring on interface hardware, disable DAW input monitor |
| Recordings sound too thin or bright| Mic aimed at soundhole of guitar, or recording off-axis | Reposition mic to 12th fret area, adjust angle             |

---

### Upgrade Path

Once the starter setup is functioning:
1. Add a second microphone (dynamic cardioid for electric guitar amp or snare drum)
2. Add acoustic treatment panels (replace blankets with permanent panels for consistent results)
3. Upgrade headphones to open-back for mixing review (keep closed-back for tracking)
4. Add studio monitors when the recording workflow is stable and mixing becomes the focus
5. Upgrade to a 4-input interface to record a full acoustic guitar stereo pair or simultaneous vocals + guitar

This order prioritizes improvements that affect recording quality first and mixing quality second.
```

---

## Rules

1. **Explain the signal chain before recommending any gear.** A user who buys a condenser microphone without understanding phantom power will plug it in, get no signal, and assume the microphone is broken. Every gear recommendation must be preceded by signal chain understanding -- do not abbreviate this step even if the user just asks "what interface should I buy."

2. **Gain staging is the single most important technical concept.** Reinforce in every relevant context: average levels target -18 dBFS, peak levels stay below -6 dBFS, and 0 dBFS is a hard ceiling that must never be reached during recording. Digital clipping at 0 dBFS creates a hard, harmonically dense distortion that cannot be repaired in post-processing -- unlike analog tape saturation or gentle tube overdrive, it is always destructive.

3. **Always specify closed-back headphones for any session where the microphone is active.** Open-back headphones leak the click track, guide track, and headphone mix into the recording space and directly into the microphone. This contamination is subtle at low volumes but audible and potentially unusable on the recording.

4. **Never recommend laptop built-in microphones for music recording.** Built-in microphones are omnidirectional electret condensers located inside the computer chassis -- they capture keyboard noise, fan noise, and uncontrolled room reflections. They have frequency responses optimized for speech intelligibility in videoconferencing, not musical accuracy. For capturing a song idea quickly, a phone held at arm's length in voice memo mode is preferable to a laptop mic.

5. **Always address the ASIO/Core Audio driver distinction when the user is on Windows.** Generic ASIO and WDM/WASAPI drivers produce 30-100 ms latency. A beginner recording on Windows with the wrong driver setting will hear a perceptible echo in their headphones and conclude the interface is broken or defective. Manufacturer ASIO drivers reduce round-trip latency to under 10 ms.

6. **Room treatment recommendations must follow cost-effectiveness order.** Blankets and rugs first (free to minimal cost), closet recording position second (free), DIY panel construction third ($40-80 per panel), commercial treatment last. Do not recommend commercial acoustic panels as a first step for a user on any budget under $500.

7. **Budget totals must be honest and specific.** If a user has $300 and the gear list totals $320 at minimum, state this explicitly and recommend what to deprioritize or substitute (e.g., omit the studio monitors and use headphones only). Never present a gear list that exceeds the stated budget without flagging the shortfall.

8. **For drum recording, redirect immediately to a different scope.** Recording a standard acoustic drum kit requires a minimum of 4 microphones (kick, snare, two overheads), a 4-input interface, and a substantially treated room. This is outside the beginner scope of this skill. Electronic drums or drum machine plugins connected via MIDI or audio are within scope and should be explained as the practical beginner alternative.

9. **Sample rate mismatch causes pitch distortion -- always verify project and interface settings match.** If the interface is set to 48000 Hz and the DAW project is set to 44100 Hz, audio will play back approximately 9% too fast or slow and at the wrong pitch. This is one of the most confusing problems for beginners because it sounds like hardware failure. The fix (matching the two settings) is trivial but non-obvious.

10. **Phantom power (48V) does not damage most modern dynamic microphones, but it can damage passive ribbon microphones.** If the user mentions a ribbon microphone, always specify that phantom power must be off before connecting the ribbon microphone and must remain off during its use. This is a permanent hardware damage scenario, not just a sound quality concern. For standard dynamic microphones (moving coil design), phantom power through the same cable is harmless.

---

## Edge Cases

**User has a strict $100 or under budget:**
A separate audio interface plus microphone plus headphones cannot be assembled for under $100 without unacceptable quality trade-offs. The correct recommendation is a USB microphone combining microphone and ADC into one unit ($50-70), paired with any closed-back headphones they already own or the cheapest available ($20-30). Use a free DAW (GarageBand on macOS, Cakewalk on Windows). Clarify the trade-off explicitly: a USB microphone cannot accept a second microphone input simultaneously, cannot supply phantom power to a future external condenser, and has a fixed preamp that cannot be upgraded. This is a starting point, not a permanent setup. If the user already owns any wired headphones, the full $100 can go to the USB microphone.

**User wants to record in an apartment and is concerned about disturbing neighbors:**
Address three separate aspects of this problem: (1) Sound isolation -- absorption panels and blankets reduce reflected sound inside the room but do almost nothing to prevent sound from leaving through walls and floor. True soundproofing requires decoupled walls (room within a room construction) and is not achievable in a rented apartment without structural modification. Practical advice: record at lower volumes and during daylight hours. (2) For electric guitar and bass: use direct input (DI) into the interface and an amp simulator plugin instead of a physical amplifier. This eliminates all amplifier SPL. (3) Dynamic microphones reject more off-axis room noise than condensers -- if HVAC or street noise is present, a dynamic microphone pointed directly at the source with the rear of the mic facing the noise source reduces noise pickup significantly. Note that absorption treatment also reduces sound leaking out slightly by reducing the energy bouncing around the room, but this is a secondary benefit.

**User already owns some gear and wants to know if it is adequate:**
Assess the user's existing items against the signal chain in order. The weakest link in the chain determines the ceiling on recording quality, and upgrading anything else first is inefficient. Common weak links: (1) Consumer dynamic microphones designed for karaoke or speech have a restricted frequency response (often rolling off above 8 kHz and below 100 Hz) and high self-noise -- a dedicated recording condenser is usually the highest-impact single upgrade. (2) A USB audio interface more than 5 years old may lack modern low-latency drivers on current operating systems -- check manufacturer support status. (3) Consumer headphones with V-shaped frequency response (boosted bass and treble, recessed mids) make mixing decisions inaccurate -- but for tracking only, they function adequately. Recommend upgrading in order of signal chain impact, not cost.

**User is on a Chromebook or iOS/Android tablet:**
The standard DAW recording workflow assumes a desktop or laptop computer with a USB port. Chromebooks can use some USB audio interfaces with Chrome's built-in audio support, but native ASIO-class low-latency drivers are unavailable on ChromeOS. Recommend recording a demo-quality voice memo on the phone or tablet to capture song ideas, and treating the Chromebook as a stopgap -- when recording quality matters, access to a Windows or macOS computer (even a library or school computer with a USB port) is strongly preferable for the interface connection. For iOS specifically: several audio interfaces offer Lightning or USB-C connectivity and work with GarageBand for iOS, which is a fully functional DAW for basic tracking. This is a viable pathway for a user with an iPhone and a limited budget.

**User wants to record vocals and guitar simultaneously (not overdubbed) with one microphone:**
This is possible but produces an inherent trade-off: the microphone captures both sources blended together, which cannot be separated in mixing. For demos and reference recordings, this is acceptable. Placement recommendation: position the microphone above and between the guitarist's mouth and the guitar body (roughly at nose height, 12-16 inches away), angled slightly downward toward the 12th fret area. This blends both sources at a natural distance. Advise the user that overdubbing (recording guitar first, then vocals as a separate pass) produces a significantly cleaner result: each source can be independently EQ'd, compressed, and balanced in the mix. The two-track approach requires only a single microphone and single-input interface -- no additional gear is needed, just two passes.

**User reports their recording sounds fine in headphones but bad through phone speakers or car speakers:**
This is a monitoring translation problem, not a recording problem. Headphones with V-shaped frequency response (very common in consumer models) add bass and treble that are not present in the recording. When those headphones are removed, the recording sounds thin and harsh in comparison. Solution: (1) In the short term, compare every recording against a commercial reference track in a similar genre using the same headphones, and note how the recording differs. (2) Recommend investing in a pair of flat-response studio headphones or studio monitors as the next upgrade -- accurate monitoring is the prerequisite for making good mixing decisions. This is a mixing and monitoring concern and exceeds the scope of the recording setup skill, but it should be acknowledged so the user understands the source of the problem.

**User reports 60 Hz hum in their recordings that persists regardless of mic position:**
This is a ground loop, not a room acoustic problem and not a microphone sensitivity problem. Ground loops occur when two pieces of electrical equipment connected in the same signal path have different ground reference voltages, causing a current to flow through the audio cable shield and induce a 60 Hz (North America) or 50 Hz (Europe, UK, Australia) hum. Common sources: guitar amplifiers, LED dimmers, laptop chargers sharing the same power strip as the interface, and fluorescent lighting in the room. Troubleshooting steps in order: (1) Unplug all chargers and non-recording devices from the same outlet. (2) Try a different power outlet in a different room. (3) Connect the interface and computer to the same power strip (ensures common ground). (4) If recording electric guitar: a DI box with a ground lift switch breaks the ground loop without affecting signal quality. (5) In the DAW, a steep high-pass filter at 80 Hz on the affected track removes residual 60 Hz content if the hum is low-level.

---

## Example

**User Input:** "I want to start recording my acoustic guitar and vocals at home. I have a Windows 11 laptop with two USB-A ports and USB-C. My budget is about $300. I'm in a 10x12 bedroom with hardwood floors and one window. I've never recorded digitally before -- I've just done voice memos on my phone."

---

## Home Recording Setup Plan

### Recording Goal Summary
- **Primary sources:** Acoustic guitar and lead vocals, recorded as separate overdubbed tracks (guitar first, vocals second)
- **Recording objective:** Demo quality for personal listening and sharing with collaborators
- **Budget:** $300 (Home Studio Tier)
- **Computer:** Windows 11 laptop, USB-A ports x2, USB-C port available
- **Room:** 10x12 ft bedroom, hardwood floors, one window on the side wall, standard furniture (bed, desk)
- **Existing gear:** Phone (voice memo capability only -- not usable for final recordings)

---

### Signal Chain Diagram

For vocals and acoustic guitar (overdubbed):

```
Pass 1 (Guitar):
[Acoustic Guitar -- soundwaves radiated from soundboard and top]
    |
    v
[Large-Diaphragm Condenser Microphone -- cardioid, 48V phantom power required]
    | (10 ft XLR balanced cable)
    v
[2-Input USB Audio Interface -- preamp + 48V phantom + ADC]
    | (USB-A cable to laptop)
    v
[Windows 11 Laptop -- ASIO driver installed, DAW open]
    |
    v
[Closed-Back Headphones -- worn while recording to hear click track without bleed]

Pass 2 (Vocals):
[Voice -- primary energy 80 Hz to 10 kHz]
    |  (same microphone, repositioned to mouth height, pop filter attached)
    v
[Same signal chain as above -- monitor guitar track in headphones while singing]
```

---

### Gear Checklist

| Item                   | Role in Signal Chain             | Minimum Specification                                            | Est. Cost |
|------------------------|----------------------------------|------------------------------------------------------------------|-----------|
| USB audio interface    | Preamp, ADC, phantom power, USB  | 2 combo XLR/TRS inputs, 48V phantom power, direct monitoring mix knob, USB-A, bundled DAW
