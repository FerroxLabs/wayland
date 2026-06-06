---
name: audio-editing-guide
description: |
  Produces an audio editing sequence with noise reduction protocol, silence
  compression settings, EQ for voice clarity, and compression/limiting for
  loudness normalization targeting specific LUFS standards for podcast, video,
  and music contexts. Use when the user asks about audio post-production
  settings, podcast mastering, voice EQ, or loudness targets.
  Do NOT use for podcast episode planning or content structure (use
  podcast-episode-planning), interview question preparation (use
  podcast-interview-guide), or voiceover script writing (use voiceover-script).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "podcast checklist template"
  category: "design-creative"
  subcategory: "video-audio"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---
# Audio Editing Guide

## When to Use

Use this skill when the user's request is specifically about the technical execution of audio post-production -- the actual signal processing chain, tools, settings, and delivery specifications. Specific trigger scenarios include:

- User asks for a complete audio editing or mastering workflow for a podcast, video narration, audiobook, or music-with-vocals project
- User needs specific parameter values for noise reduction, EQ, compression, limiting, or loudness normalization
- User asks why their audio sounds muddy, harsh, thin, or distorted and wants processing solutions
- User wants to know what LUFS target, true peak ceiling, or loudness range (LRA) to use for a specific platform (Apple Podcasts, Spotify, YouTube, ACX, Netflix, broadcast)
- User has a specific recording problem -- excessive sibilance, boominess, room echo, background hum, inconsistent levels between speakers -- and needs a signal processing solution
- User asks what export format, bitrate, sample rate, or channel configuration to use for a delivery platform
- User needs a per-track processing chain for a multi-speaker or multitrack session (separate processing per track before bus processing)
- User asks about the signal chain order and why each stage comes before or after another

**Do NOT use when:**
- User needs help planning podcast episodes, segment structure, or show formats -- use `podcast-episode-planning`
- User wants interview question preparation or guest briefing documents -- use `podcast-interview-guide`
- User needs a voiceover or narration script written -- use `voiceover-script`
- User is asking about microphone selection, acoustic treatment, or recording room setup (these are pre-production hardware decisions, not post-production processing)
- User wants music composition, beat production, or MIDI arrangement guidance -- this skill covers voice/spoken word and mixed-audio contexts, not music production from scratch
- User needs video editing decisions (cut timing, transitions, color) -- audio post-production is this skill's scope only
- User is asking about podcast hosting, RSS feeds, or distribution strategy -- those are publishing workflow topics, not audio engineering

---

## Process

### Step 1: Gather Context to Determine the Processing Architecture

Before recommending any specific settings, establish the complete picture of the recording. Settings that work for one context will actively harm audio in another.

- **Determine output type and delivery platform:** Podcast (Apple Podcasts, Spotify, RSS general), YouTube video narration, audiobook (ACX/Audible), broadcast/streaming (Netflix, broadcast TV), or music context. Each has different loudness targets, format requirements, and tolerance for dynamic range.
- **Identify the recording environment:** Ask or assess whether the recording was made in an acoustically treated room (absorption panels, vocal booth), an untreated domestic space (bedroom, home office), or a genuinely noisy environment (outdoor lavalier, conference room). This determines how aggressive noise reduction must be and whether de-reverb processing is needed.
- **Identify microphone type and configuration:** Dynamic microphone (Shure SM7B, SM58 class) vs. condenser (large diaphragm studio, small diaphragm, USB condenser) vs. lavalier/lapel. Dynamic mics are more forgiving of untreated rooms but often need more high-frequency presence boost. Condensers pick up more room character and may need more low-mid taming. Lavaliers introduce proximity variation as the speaker moves.
- **Identify the number of speakers and how they were recorded:** Single speaker to one track; multi-speaker recorded to separate tracks (ideal); multi-speaker recorded to a single mixed track (worst case -- severely limits what can be fixed). If separate tracks exist, all processing through limiting must happen per-track before a final bus stage.
- **Identify obvious problems from the user's description:** Ask specifically about: hum (electrical interference), HVAC noise, keyboard/mouse clicks, room reverb, plosives (p/b burst), sibilance (harsh s/sh sounds), proximity effect (boomy bass buildup when speaker is close to a cardioid mic), and level inconsistencies between speakers or between recording sessions.
- **Confirm mono vs. stereo delivery:** Podcasts are almost universally delivered in mono. Stereo wastes bandwidth on speech with no perceptible benefit. Stereo is appropriate for music-with-vocals or cinematic video audio. If the user recorded in stereo but delivers a podcast, collapse to mono after all processing.

---

### Step 2: Apply Noise Reduction and Spectral Cleanup (First in Chain)

Noise reduction must precede all dynamics processing. Compressors and limiters amplify everything -- including noise -- so noise must be reduced before gain is applied.

- **Capture a noise profile:** Find 2-3 seconds of pure room tone -- the speaker is silent, no movement, no handling noise, just the ambient environment recorded by the microphone. This should come from the beginning or end of the recording, not a gap mid-sentence (which may have handling noise). Most spectral noise reduction tools (iZotope RX, Audacity's Noise Reduction, Adobe Audition's Noise Reduction) require this profile.
- **Set reduction amount by environment type:**
  - Treated room: 4-6 dB reduction is typically sufficient
  - Untreated home office/bedroom: 8-12 dB reduction
  - Genuinely noisy environment (restaurant, street, conference room): 12-18 dB -- expect some spectral artifact introduction at this level
  - If artifacts (metallic warbling, "underwater" sound) appear at the required reduction level, this is a fundamental recording quality problem. Note it and recommend re-recording as the true fix.
- **Apply a high-pass filter (HPF) at this stage:** Before spectral reduction or as part of it, apply an HPF. For most spoken-word microphone setups: 80 Hz at 12 dB/octave slope for dynamic mics, 100 Hz at 18 dB/octave for condensers, 120 Hz for lavaliers. This removes subsonic energy, HVAC rumble, desk vibration, and footfall that consumes headroom without contributing to voice quality.
- **Address specific interference types:** For 60 Hz electrical hum (US, Japan, some Americas), apply a narrow notch filter at 60 Hz and its harmonics at 120 Hz, 180 Hz, and 240 Hz. For 50 Hz hum (EU, UK, Australia, most of the world), notch at 50 Hz, 100 Hz, 150 Hz, and 200 Hz. Notch Q should be very narrow (8-16) to avoid affecting adjacent frequencies. For broadband hiss from cheap preamps: gentle noise reduction at 6-8 dB combined with a high-shelf cut at 15 kHz by 2-3 dB reduces audibility without dulling the voice.
- **For plosive clicks (p/b burst artifacts):** These appear as very short low-frequency transient spikes on the waveform. They can be treated individually using spectral repair tools, or reduced globally with a low-shelf cut below 80 Hz. Manual removal in a DAW (fade out over 3-5 ms) is more precise than global filtering.
- **For room reverb/echo:** If the room has significant reverb, spectral noise reduction will not fix it -- noise reduction operates on stationary noise, not time-domain reflections. A dedicated de-reverb tool (iZotope RX's De-Reverb, Acon Digital Acoustica's De-Reverb) can attenuate reverb tails. Without one: a fast gate on each voice track with a 5-10 ms attack and 80-150 ms release will cut reverb tails between phrases. Boost presence (3-5 kHz) to improve intelligibility relative to the washed reverb -- this does not remove reverb but improves speech over it.

---

### Step 3: Edit Silences, Pacing, and Filler Words

This is a structural editing step that shapes the listening experience. It happens after noise reduction (so silences are clean) but before dynamics processing (which would alter the character of silence-adjacent transients if editing happened after).

- **Silence compression targets by context:**
  - Podcast conversation: compress gaps longer than 1.2-1.5 seconds down to 0.6-0.8 seconds. This tightens pacing without sounding rushed.
  - Solo narration/audiobook: compress gaps longer than 0.8 seconds down to 0.3-0.5 seconds. Narration has more deliberate pacing control and listeners expect less dead air.
  - Interview with intentional thinking pauses: be more conservative -- compress gaps longer than 2.0 seconds to 1.0 seconds. Cutting too aggressively removes the human character of a real conversation.
- **Preserve breath sounds at a natural level:** Breath inhales that are below -40 dBFS (relative to the speech level) typically disappear in the mix and can be left. Breath sounds that peak above -25 dBFS are often audible and distracting -- attenuate them by 6-10 dB rather than cutting entirely (hard cuts on breaths sound unnatural). A de-breath tool handles this automatically; manual editing is a fade-down over 30-50 ms.
- **Filler word editing policy:** The right approach depends on context and severity. Remove "um"/"uh" clusters of 3 or more in succession. Remove filler words in the middle of a clear sentence where they break intelligibility. Leave isolated single "um" in a casual conversation podcast -- it reads as human. NEVER remove all fillers from a casual interview format; the result sounds robotic. For scripted narration and audiobook, remove all fillers without exception.
- **Click and pop removal:** Recording clicks from keyboard, mouse, mouth sounds, and jewelry should be removed individually. In a waveform editor, they appear as sharp spikes sharply above the noise floor. Repair by: short fade (3-5 ms) over the click, or use a spectral repair brush tool (iZotope RX's Spectral Repair "Replace" mode is highly effective).
- **Handling the between-track gap for multi-speaker sessions:** When two speakers are on separate tracks, ensure silence compression on Speaker A's track does not overlap into Speaker B's response on their track. Review crossover points manually. If editing leaves a gap that creates an unnatural jump cut, add a very short crossfade (50-100 ms) at the edit point.

---

### Step 4: Apply EQ for Voice Clarity and Tonal Balance

EQ shapes the frequency content of the voice. The goals are: remove energy that muddies or clutters the signal, add presence that aids intelligibility, and fix microphone-specific colorations. Apply EQ on individual tracks before compression -- EQ after compression is valid for mastering bus processing but not for individual voice tracks.

- **High-pass filter (already applied in noise reduction step):** Confirm it is in the chain. If working in a DAW where noise reduction was applied destructively and you are now in an EQ plugin, re-apply the HPF here within the EQ.
- **Low-mid mud reduction (the most important cut for untreated rooms):** The 200-400 Hz range accumulates room resonances, proximity effect buildup from cardioid microphones, and the "boxy" quality of recordings made in small reflective spaces. Apply a narrow-to-medium cut:
  - Dynamic/condenser large-diaphragm mic in small room: cut 2-4 dB at 280-320 Hz, Q of 1.2-1.8
  - Lavalier on clothing: the proximity and fabric resonance peaks between 180-250 Hz -- cut 3-5 dB at 220 Hz, Q of 1.5
  - Male voice with pronounced chest resonance: cut 2-3 dB at 350-400 Hz, Q of 1.2
  - Female voice: typically less problematic here; a lighter cut of 1-2 dB at 250 Hz is usually sufficient
- **Presence boost for intelligibility (2-5 kHz range):** This is the frequency range where consonants, articulation, and the "bite" of speech live. A gentle boost here dramatically improves how clearly listeners can understand speech, especially over background music or in compressed audio formats.
  - For most male voices: +1.5 to +2.5 dB at 3-3.5 kHz, wide Q of 0.7-1.0
  - For most female voices: +1 to +2 dB at 3.5-4 kHz, wide Q of 0.7-0.9 -- go slightly higher in frequency to avoid the harsh 2-3 kHz sibilance zone
  - For voices that already sound bright or harsh on a condenser: skip or reduce this boost to +0.5 dB; instead rely on the de-esser and high-shelf
- **High-shelf air boost (optional, context-dependent):** A gentle high-shelf boost at 10-12 kHz by 1-2 dB adds perceived "openness" and reduces the feeling of the voice being trapped in a box. Use this for podcast and video. Avoid it for audiobook (ACX noise floor requirements make high-frequency shelving risky -- it can raise hiss level). Avoid for male voices that already have sibilance issues.
- **De-esser placement and settings:** Apply the de-esser after EQ because the presence boost may have introduced or exaggerated sibilance. The de-esser is a frequency-specific compressor or dynamic EQ that only attenuates when energy in the sibilance band exceeds a threshold.
  - Male voices: sibilance typically peaks at 5-7 kHz; target 6 kHz with 3-5 dB reduction when threshold is exceeded
  - Female voices: sibilance typically peaks at 7-9 kHz; target 7.5 kHz with 4-6 dB reduction
  - The de-esser should engage only on harsh "s" and "sh" sounds, not on every sentence. If it is triggering constantly, the threshold is too low or the presence boost above was too aggressive.
- **Voice-type specific adjustments:**
  - Deep baritone voices with proximity buildup: more aggressive low-mid cut (3-4 dB at 300-350 Hz) and less low-shelf needed
  - Thin or reedy voices: gentle low-shelf boost of +1.5 dB at 120 Hz to add body, reduce the HPF slope from 18 dB/oct to 12 dB/oct
  - Nasal voices: a surgical cut of 1.5-2.5 dB at 800-1200 Hz (the nasal resonance zone) can help without sounding processed
  - Voices with excessive brightness or "edge": cut 2-3 dB at 2-2.5 kHz (the harshness zone) with a Q of 2.0

---

### Step 5: Apply Dynamics Processing -- Compression

Compression controls the dynamic range of the voice. Speech has enormous natural variation -- a speaker may range from -35 dBFS to -6 dBFS in the same sentence. Compression brings the quieter parts up and the louder parts down, creating a consistent, controlled level that listeners can follow without adjusting their volume.

- **Threshold setting methodology:** Play back the recording and watch the gain reduction meter. The compressor should begin engaging on normal conversational speech -- not just on shouts or peaks. For most podcast voice recordings that have been properly gained (peaking around -12 to -6 dBFS before compression), a threshold of -18 to -24 dBFS is appropriate. If the recording peaks much lower (poorly gained, quiet speaker), lower the threshold to match.
- **Ratio selection by context:**
  - Controlled narration in treated room: 2:1 to 2.5:1 -- subtle leveling
  - Conversational podcast in home office: 3:1 to 4:1 -- moderate leveling
  - Highly animated speaker with extreme dynamic variation: 4:1 to 6:1 -- aggressive leveling
  - Lavalier in variable-distance scenario (speaker moves): 4:1 to 5:1 with a faster attack
  - Ratios above 8:1 are limiting, not compression -- avoid for primary voice compression; use a separate limiter stage
- **Attack time tradeoffs:** Attack controls how quickly the compressor responds after the signal crosses the threshold. For voice:
  - 8-15 ms preserves the natural attack transient of consonants ("p", "t", "k") while still catching the body of loud phrases -- this is the sweet spot for most speech
  - 3-8 ms is useful for a speaker with very sudden level jumps but risks a "pumping" artifact if the release is also fast
  - 20-30 ms is appropriate for narration with very deliberate pacing where natural dynamics are valued
- **Release time tradeoffs:** Release controls how quickly the compressor stops attenuating after the signal drops below the threshold.
  - 100-200 ms works well for most speech -- the compressor recovers during natural pauses and breath gaps
  - Auto-release (available in most modern compressors) adapts to the signal's envelope and is a good default for unpredictable speech
  - Release that is too fast (under 50 ms) creates audible "pumping" in the gain reduction
  - Release that is too slow (over 400 ms) means the compressor never fully recovers, resulting in consistent over-compression
- **Gain reduction monitoring:** Watch the GR meter during playback. Target 3-6 dB average gain reduction with peaks no higher than 8-9 dB. If the GR meter is consistently showing 10-15 dB of reduction, the threshold is set too low -- either raise the threshold or lower the ratio. Over-compressed speech loses its natural prosody and energy.
- **Makeup gain:** After compression reduces the average level, makeup gain restores the output level. Apply enough makeup gain so the output peaks approximately where the input peaked (before compression). This is typically the amount of average gain reduction -- if the compressor averages 4 dB of reduction, apply approximately +4 dB of makeup gain. Many compressors offer an "auto" makeup gain; use it as a starting point and fine-tune by ear.
- **Two-stage compression for severely variable recordings:** For recordings where a single compressor cannot cleanly handle both gross level differences (speaker drifting from mic) and subtle phrase-to-phrase variation, use two compressors in series:
  - First compressor: high threshold (-12 dBFS), high ratio (8:1 to 10:1), slow attack (20 ms), slow release (300 ms) -- handles gross level excursions only
  - Second compressor: standard settings (threshold -20 dBFS, ratio 3:1, attack 12 ms, release 150 ms) -- fine-tunes the leveled signal

---

### Step 6: Apply Limiting

The limiter is a safety device and a loudness-ceiling enforcer. It is not a substitute for proper compression in the previous step.

- **Limiter ceiling at -1.0 dBFS (true peak, not sample peak):** Platform encoders (MP3, AAC, Opus) introduce inter-sample peaks (ISPs) during lossy encoding. A file that peaks at exactly 0 dBFS in the DAW may produce clipping artifacts after encoding. Setting the true peak ceiling to -1.0 dBTP provides the necessary headroom for encoder ISPs.
- **Threshold placement:** Set the limiter threshold so it catches only the highest peaks -- typically the top 2-3% of dynamic events. If the limiter is engaging frequently and consistently (visible constant gain reduction), the compression stage is insufficient. Reduce the compressor threshold by 2-3 dB and re-evaluate before adjusting the limiter.
- **Limiter settings for transparency:**
  - Lookahead: 1-3 ms on a transparent limiter (prevents "brick wall" distortion artifacts on sharp transients)
  - Release: 50-100 ms -- fast enough to recover before the next transient, slow enough to avoid pumping
  - ISP detection: enable true peak detection mode (labeled "ISP" or "True Peak" in most limiter plugins) to catch inter-sample peaks
- **Bus limiter vs. track limiter:** For multi-speaker sessions, place a limiter on each individual track (ceiling -3.0 dBFS, loose settings) as an emergency ceiling during the mixing stage. Place the master bus limiter (ceiling -1.0 dBFS, tight settings) on the final output. This prevents any single track from blowing out the bus before the master limiter can catch it.

---

### Step 7: Loudness Measurement, Platform Compliance, and Export

Loudness metering is the final quality check before delivery. Never rely on peak meters alone -- platforms normalize based on integrated loudness (LUFS), and a peak-normalized file will sound either too loud or too quiet after platform processing.

- **Loudness targets by platform and context:**
  | Platform / Context | Integrated LUFS | True Peak | Loudness Range (LRA) |
  |--------------------|----------------|-----------|----------------------|
  | Apple Podcasts | -16 LUFS | -1.0 dBTP | 5-12 LU |
  | Spotify (podcast) | -14 LUFS | -1.0 dBTP | 5-12 LU |
  | YouTube | -14 LUFS | -1.0 dBTP | 7-20 LU |
  | Netflix (dialogue) | -27 LUFS | -2.0 dBTP | Max 20 LU |
  | EBU R128 (broadcast) | -23 LUFS | -1.0 dBTP | Max 18 LU |
  | ACX/Audible audiobook | -18 to -23 LUFS | -3.0 dBFS | < 15 LU |
  | Music streaming (Spotify, Apple Music) | -14 to -11 LUFS | -1.0 dBTP | Varies by genre |
  | Podcast (general RSS, no normalization) | -16 LUFS | -1.0 dBTP | 5-10 LU |

- **Measurement methodology:** Measure integrated LUFS over the full program (entire episode or chapter), not a short clip. Short-term and momentary LUFS numbers are useful for monitoring in real time but do not represent the final compliance measurement. Use a meter that conforms to the ITU-R BS.1770-4 standard (the current measurement standard). Tools: iZotope Insight, Waves WLM Plus, Nugen VisLM, Youlean Loudness Meter (free), or any meter with ITU-R BS.1770-4 integrated measurement.
- **If the integrated LUFS measurement is off-target:**
  - More than 1 LU too quiet: increase compression makeup gain, or apply a gentle gain stage on the bus
  - More than 1 LU too loud: lower makeup gain or reduce the compression threshold slightly
  - More than 3 LU off target in either direction: the compression settings are likely wrong -- revisit Step 5
  - Never use a limiter to increase loudness by pushing the threshold aggressively -- this causes distortion artifacts and reduces LRA (sounds crushed and fatiguing)
- **Loudness Range (LRA) assessment:** LRA measures the variation in loudness across the program. An LRA of 3 LU or below sounds crushed and over-compressed. An LRA of 20+ LU sounds uncontrolled and inconsistent. Target 5-12 LU for podcast and narration, up to 20 LU for music contexts. If LRA is too low, reduce compression ratio. If LRA is too high, the compression threshold may not be set low enough.
- **Export specifications by platform:**
  - Podcast (Apple, Spotify, RSS): MP3, 128 kbps constant bitrate (mono), 44.1 kHz sample rate. Stereo option: 192 kbps. ID3 tags: podcast title, episode title, track number, artwork (3000x3000 px, JPEG or PNG). Some distributors accept MP3 at 320 kbps but 128 kbps mono is the industry standard for spoken word.
  - YouTube video: Export audio as a WAV or FLAC, 48 kHz sample rate (video standard, not 44.1 kHz), stereo or mono as appropriate. If delivering audio to a video editor, deliver 48 kHz WAV to avoid sample rate conversion artifacts in the video timeline.
  - Audiobook (ACX): MP3, 192 kbps constant bitrate, 44.1 kHz, mono. Include room tone (0.5 seconds) at the start and end of each chapter file. Chapter files must be continuous -- no internal gaps. Export each chapter as a separate file with consistent naming.
  - Netflix/Streaming video: WAV or broadcast WAV (BWF), 48 kHz, 24-bit, stereo or 5.1 as specified by the deliverable. -27 LUFS target requires significantly less compression than podcast delivery.
  - Music with vocals: WAV, 44.1 or 48 kHz (match the project sample rate), 24-bit, stereo. A separate mastering stage is typical for music -- this processing chain covers the mix stage.

---

## Output Format

When producing an audio editing settings document, use the following complete template structure. All values must be specific numbers -- do not leave ranges unless a specific starting point recommendation is included.

```
## Audio Editing Settings: [Descriptive Title]

**Output Type:** [podcast | video narration | audiobook | music vocal | broadcast]
**Delivery Platform(s):** [Apple Podcasts / Spotify / YouTube / ACX / Netflix / RSS]
**Target Integrated Loudness:** [X LUFS]
**True Peak Ceiling:** [-1.0 dBTP or as required by platform]
**Recording Environment:** [treated studio | untreated domestic | noisy environment]
**Microphone Type:** [dynamic | condenser large-diaphragm | condenser small-diaphragm | lavalier | USB condenser]
**Speaker Configuration:** [single | dual (separate tracks) | dual (mixed to one track) | multi-speaker panel]

---

### Processing Chain (apply strictly in this order)

#### Stage 1: Noise Reduction and Spectral Cleanup
- Noise profile source: [first/last X seconds of each track]
- Spectral noise reduction: [X dB reduction]
- High-pass filter: [X Hz, X dB/octave slope]
- Electrical hum notch filters: [frequencies if applicable, or "not required"]
- De-plosive treatment: [spectral repair on plosives | low-shelf cut at X Hz | not required]
- De-reverb: [required | not required -- reason]
- Artifacts expected at this reduction level: [yes, note for review | no]

#### Stage 2: Silence and Pace Editing
- Compress silences longer than: [X seconds] down to: [X seconds]
- Preserve breath pauses under: [X seconds] unchanged
- Breath level management: [attenuate breaths above -X dBFS by -X dB | leave | de-breath tool]
- Filler word editing: [remove clusters of X+, leave singles | remove all | leave all]
- Click/pop removal: [spectral repair | manual fade | not required]
- Inter-speaker crossfade at edits: [X ms | not applicable]

#### Stage 3: EQ Settings

[Repeat per speaker track if multi-speaker]

**[Speaker / Track name and voice description]:**

| Band | Type | Frequency | Gain | Q / Slope | Purpose |
|------|------|-----------|------|-----------|---------|
| High-pass | Filter | X Hz | -- | X dB/oct | Remove rumble/subsonic |
| Low-mid | Cut | X Hz | -X dB | X.X | Reduce boominess/mud |
| Nasal cut | Cut | X Hz | -X dB | X.X | Reduce nasal resonance [if needed] |
| Presence | Boost | X kHz | +X dB | X.X | Clarity and intelligibility |
| Air | Hi-shelf | X kHz | +X dB | -- | Openness [if applicable] |
| De-esser | Dynamic EQ | X kHz | -X dB | Threshold: X dBFS | Sibilance control |

#### Stage 4: Compression (per speaker track)
- Threshold: [X dBFS]
- Ratio: [X:1]
- Attack: [X ms]
- Release: [X ms -- or "auto-release"]
- Knee: [soft | hard] -- [soft for transparent, hard for more aggressive leveling]
- Expected gain reduction: [X dB average, peaks to X dB]
- Makeup gain: [+X dB]
- Two-stage compression required: [yes -- Stage 1: high threshold X, ratio X:1 | no]

#### Stage 5: Per-Track Safety Limiter [multi-speaker sessions only]
- Ceiling: [-3.0 dBFS]
- Threshold: [-6.0 dBFS]
- Purpose: prevent individual track blowout before bus processing

#### Stage 6: Bus Processing [applies to final mix output]
- Bus compression [optional]: [ratio X:1, threshold X dBFS, attack X ms, release X ms | not applied]
- Bus limiter -- Ceiling: [-1.0 dBFS (true peak)]
- Bus limiter -- Threshold: [X dBFS]
- Bus limiter -- Lookahead: [1-3 ms]
- Bus limiter -- Release: [X ms]
- ISP / True peak detection: [enabled]

#### Stage 7: Loudness Measurement and Compliance
- Integrated LUFS target: [X LUFS]
- Measured over: [full program / full episode / full chapter]
- True peak ceiling: [X dBTP]
- Target loudness range (LRA): [X-X LU]
- Measurement standard: [ITU-R BS.1770-4]
- If off-target by >1 LU: [adjust makeup gain / revisit compression threshold]

---

### Export Specifications
| Parameter | Value |
|-----------|-------|
| Format | MP3 / WAV / FLAC / BWF |
| Bitrate (if MP3) | X kbps, constant bitrate |
| Sample rate | X kHz |
| Bit depth | X-bit (WAV/FLAC only) |
| Channels | Mono / Stereo |
| Normalization | Off (loudness already set) |

### Metadata Tags
- Title: [episode or chapter title]
- Artist/Author: [show name or narrator name]
- Track number: [episode or chapter number]
- Artwork: [3000x3000 px minimum, JPEG or PNG -- podcast only]
- Year: [publication year]

---

### Quality Check Checklist
- [ ] No audible noise reduction artifacts (metallic warbling, underwater effect)
- [ ] No audible clipping or limiting distortion
- [ ] No plosive burst sounds remaining
- [ ] De-esser not over-attenuating -- sibilants sound natural
- [ ] Integrated LUFS within 0.5 LU of target
- [ ] True peak does not exceed ceiling
- [ ] LRA within target range
- [ ] Export format and bitrate match platform requirements
- [ ] Metadata tags complete
- [ ] File plays back correctly in a reference player before delivery
```

---

## Rules

1. **Always apply the processing chain in the defined order: noise reduction -- silence editing -- EQ -- compression -- limiting -- loudness measurement.** Reversing any stage creates compounding problems. Compressing before noise reduction amplifies the noise. EQing after compression can alter the levels that the compressor set. Limiting before loudness measurement produces inaccurate readings.

2. **Never treat LUFS targets as flexible based on how loud the audio "feels."** Integrated LUFS is a measurement, not a perception. A program can feel loud and measure at -19 LUFS if the audio is spectrally bright. Measure with a calibrated ITU-R BS.1770-4 meter; do not rely on peak meters or your monitoring volume to gauge loudness compliance.

3. **Never use the limiter as the primary loudness tool.** A limiter with a very low threshold used to push integrated loudness will crush dynamic range and introduce distortion artifacts. Loudness comes from compression (Step 5). The limiter's job is to catch the top 2-5% of peaks. If you need to push loudness more than 2 LU above what compression achieves, revisit compression settings.

4. **Always process multi-speaker sessions on separate tracks before mixing.** Applying a single compressor to a mixed two-speaker track means the compressor responds to the combined signal, not each voice individually. When Speaker A talks loudly, the compressor will duck Speaker B's simultaneous or subsequent phrase. Separate track processing is non-negotiable for quality results.

5. **EQ cuts require narrow Q; EQ boosts require wide Q.** A narrow cut (Q 1.5-2.0) surgically removes a problem frequency without affecting adjacent frequencies. A narrow boost creates an unnatural tonal spike that sounds processed and fatiguing. Wide boosts (Q 0.5-1.0) add tonal color naturally. Violating this rule produces audio that sounds "EQ'd" rather than natural.

6. **Noise reduction artifacts at 12+ dB reduction indicate a fundamental recording quality problem.** If the required noise reduction level to achieve a clean noise floor introduces metallic artifacts, spectral warbling, or resonant overtones, note this explicitly in the output and recommend re-recording as the correct solution. No amount of processing can fully recover a badly recorded track -- and over-processed audio is often harder to listen to than slightly noisy audio.

7. **The high-pass filter frequency must match the microphone type and intended bass response.** Setting a 120 Hz HPF on a dynamic microphone in a voice-over context will thin the low-end character that many listeners associate with warmth and authority in spoken word. Setting a 60 Hz HPF on a lavalier will allow significant proximity and rumble into the signal. Match the HPF to the microphone's real-world low-frequency behavior.

8. **True peak meters, not sample peak meters, must be used for final compliance checking.** Sample peak meters (the standard vu-style meters in most DAWs) do not detect inter-sample peaks. A file can pass a sample peak check at 0 dBFS and still clip after MP3 or AAC encoding. Always use a true peak meter (labeled "TP" or "dBTP") for the final compliance measurement, especially before any lossy export.

9. **Export sample rate must match the delivery standard for the platform -- 44.1 kHz for podcast/audiobook/music, 48 kHz for video.** Sample rate conversion introduces subtle artifacts, and delivering a 44.1 kHz audio file to a video timeline running at 48 kHz causes the video editor's DAW to perform sample rate conversion, which is avoidable. Always confirm the video project's sample rate with the video editor before exporting audio for video.

10. **De-essing must be applied after the presence boost EQ, never before.** If a de-esser is placed before the presence boost, the EQ boost will recreate sibilance that the de-esser already attenuated. The de-esser must see the final EQ'd signal to accurately target and control the true sibilance level in the output.

---

## Edge Cases

### Case 1: Recording Made on a Single Mixed Track with Two Speakers

This is the hardest scenario to fix in post. If the user recorded a two-person conversation to a single stereo or mono file (e.g., using a portable recorder at a conference table, or a Zoom recording that only captured the mixed output), individual track processing is impossible.

- Apply a mid-side (M/S) decode if the file is stereo -- speakers positioned differently in the stereo field can be partially separated via M/S processing. This only works if speakers were at different positions relative to the stereo microphone.
- Apply a multiband compressor with conservative settings -- this allows different frequency regions to be compressed differently, which provides some level control for voices that are tonally different (e.g., a deep male voice and a higher female voice).
- Accept that the dynamic range between speakers will be imperfect. Apply compression to the mixed file at ratio 3:1 to 4:1 targeting -20 dBFS threshold, with slow attack (20 ms) and medium release (200 ms).
- Inform the user that this scenario has a hard technical ceiling on quality and document the limitation in the output.

### Case 2: Very Short Program Duration (Under 3 Minutes)

Integrated LUFS measurements become statistically unreliable for programs under 3 minutes. A very quiet intro or quiet ending can drag the integrated LUFS significantly below the body of the episode.

- Trim silence at head and tail to reduce the proportion of the file that is below the average speech level.
- Use short-term LUFS (3-second window) in addition to integrated for monitoring, and treat the integrated measurement as a guide rather than a strict rule for programs this short.
- For audiobook chapters that may be quite short, ACX ACX requires the integrated LUFS measurement of the full chapter -- if a chapter is only 90 seconds of actual narration, still trim all excess silence and measure only the narrated content.

### Case 3: Audiobook with ACX Compliance Requirements (Strict Standards)

ACX has the strictest technical requirements of any major audio delivery format. The specific requirements are: -18 to -23 LUFS integrated, noise floor below -60 dBFS (measured as the RMS level of a 0.5-second sample of room tone with the narrator silent), true peak below -3 dBFS (stricter than podcast's -1.0 dBTP), and no extraneous sounds.

- The -60 dBFS noise floor requirement is extremely demanding. Untreated rooms with HVAC, traffic, or computer fan noise frequently fail. Noise reduction of 12-15 dB may be required.
- True peak at -3 dBFS means the limiter ceiling must be set to -3 dBFS, not -1.0 dBFS. Adjust the Stage 6 limiter accordingly.
- The LUFS range of -18 to -23 LUFS is narrower and quieter than podcast. Use a compression ratio of 2:1 to 2.5:1 (less compression than podcast) and aim for -20 LUFS as the center target.
- Each chapter must begin with 0.5 seconds of room tone and end with 0.5 seconds of room tone -- this is an ACX technical requirement, not optional.
- ACX Quality Assurance (QA) checks are automated on submission. An incorrect noise floor measurement will trigger an automatic rejection. Always measure the noise floor using the same method ACX uses: find a 0.5-second segment of silence within the chapter and measure its RMS level. It must be below -60 dBFS.

### Case 4: Voice Recording with Significant Proximity Effect (Cardioid Mic at 3-6cm Distance)

Proximity effect is the bass buildup that occurs when a directional (cardioid) microphone is placed very close to the sound source. It produces a "boomy" or "radio DJ" quality that can sound good but often needs management.

- The typical proximity effect peak is at 80-200 Hz for most large-diaphragm cardioid condensers and dynamic mics.
- Apply a low-shelf cut of 3-6 dB below 200 Hz, in addition to the standard low-mid cut at 280-350 Hz.
- Or apply a more aggressive HPF: rather than 80 Hz at 12 dB/octave, use 100 Hz at 18 dB/octave to roll off more of the proximity buildup.
- Be careful not to over-correct: some proximity effect warmth is desirable in spoken word and music contexts. Reduce until the voice sounds natural, not until all bass is gone.
- If the speaker was inconsistent in mic distance during the recording (moving toward and away from the mic), the proximity effect will vary dynamically and cannot be fully fixed with a static EQ. In this case, a dynamic EQ band monitoring the 80-200 Hz range and cutting when energy exceeds a threshold is more effective than a static cut.

### Case 5: Recording with Background Music Bed Already Mixed In

If the user received a file that already has background music mixed with voice (rather than separate stems), the processing options are severely limited.

- Separation tools (iZotope RX's Music Rebalance or Dialogue Isolation) can partially separate voice from music. This is imperfect AI-based separation and introduces artifacts, but may produce acceptable results for a heavily mixed signal.
- After attempted separation, process the extracted voice track with standard EQ and compression settings.
- If the user has access to the original stems (voice and music separately), always use those instead of trying to separate the mixed file.
- For future recordings: always record voice and music as separate files/tracks and mix them in post. Never commit to a mix at the recording stage.
- For sidechain music ducking on a proper multi-track session: trigger the sidechain compressor from the voice track's signal chain. Use a low-pass filtered sidechain signal (cut above 300 Hz) so the compressor responds to the fundamental voice energy rather than sibilance and consonants. Music duck target: 10-14 dB below the unducked level. Attack: 5 ms. Release: 200-300 ms. Ratio: 4:1.

### Case 6: Ultra-Wide Loudness Range (LRA > 18 LU) After Processing

If the integrated LUFS measurement is on target but the LRA is extremely wide, it indicates some sections of the program are very quiet and others very loud -- inconsistent content (a dramatic drop in the presenter's voice, a very quiet segment, or a section recorded in a different environment).

- Review the program for the specific segments dragging the LRA up. A single very quiet 30-second segment can distort the LRA significantly.
- Apply clip gain automation in the DAW: manually bring up the quiet segment by 3-6 dB before the compressor in the chain (clip gain is pre-processing and does not affect the processing decisions, only the input level).
- After clip gain adjustment, re-run the full chain measurement. Do not simply raise the master volume -- this will change the integrated LUFS compliance.
- For music contexts, a wide LRA is acceptable and desirable (dynamic music). The issue is more pressing for podcast and narration contexts where a consistent listening experience is expected.

### Case 7: Exporting for a Platform That Normalizes Audio Loudness

Spotify, Apple Podcasts, and YouTube all normalize uploaded audio to their target loudness. This means if a file is delivered louder than the target, the platform will turn it down. If delivered quieter, the platform will turn it up (Spotify and YouTube do this; Apple Podcasts turns loud content down but may not turn quiet content up).

- Always deliver at the specified target LUFS. Do not try to "game" normalization by delivering loud content expecting the platform to normalize it -- the normalization process can add artifacts.
- Do not deliver at -8 LUFS thinking it will "sound louder after normalization." Spotify will turn it down to -14 LUFS and the audio will sound exactly as loud as a -14 LUFS delivery -- but the compression artifacts from over-compressing to reach -8 LUFS will remain.
- The practical implication: the competition is not at the delivery loudness level. Optimize for sound quality, not for gaming loudness normalization.

---

## Example

**User Input:** "I recorded a solo podcast in my home office with a USB condenser mic. There's some room echo and occasional computer fan noise. I want it on Spotify and Apple Podcasts. Can you give me the full editing settings?"

**Output:**

---

## Audio Editing Settings: Solo Podcast -- USB Condenser, Home Office

**Output Type:** podcast (spoken word)
**Delivery Platforms:** Spotify, Apple Podcasts
**Target Integrated Loudness:** -16 LUFS (Apple Podcasts compliance; Spotify normalizes to -14 LUFS -- delivering at -16 LUFS is safe for both)
**True Peak Ceiling:** -1.0 dBTP
**Recording Environment:** untreated home office -- room echo present, fan noise present
**Microphone Type:** USB condenser (small or medium diaphragm, typically hypercardioid or cardioid pattern)
**Speaker Configuration:** single speaker, single mono track

---

### Processing Chain (apply strictly in this order)

#### Stage 1: Noise Reduction and Spectral Cleanup

- **Noise profile source:** Capture 3 seconds of room tone from the beginning of the recording (before you start speaking). Ensure the computer fan is running during this capture -- it must be active during the noise profile capture to be included in the spectral model.
- **Spectral noise reduction:** 10 dB reduction -- this handles both the fan noise (broadband, consistent) and the low-level room hiss typical of USB condensers. Start at 8 dB and increase to 10 dB only if the fan is still audible. Listen carefully at 10 dB for any metallic artifact quality in the voice; if present, reduce back to 8 dB and accept a slightly noisier floor.
- **High-pass filter:** 100 Hz, 18 dB/octave slope. USB condensers with close positioning tend to capture proximity effect buildup and desk vibration. The 18 dB/octave slope is steeper than standard to handle the condenser's more extended low-frequency pickup.
- **Electrical hum notch filters:** Not required unless you hear a steady tone. If a 60 Hz (US) or 50 Hz (EU) hum is present, add notch filters at the appropriate fundamental and harmonic frequencies.
- **De-reverb:** Required. The home office room echo description indicates reflective surfaces (hard walls, desk surface, monitor screens). Apply de-reverb processing (spectral method if available). Target: reduce reverb tail by 4-6 dB. If no de-reverb plugin is available, apply a gate on the voice track: attack 8 ms, hold 50 ms, release 120 ms, threshold set 6 dB above the noise floor. This will cut reverb tails in pauses between phrases. Note: de-reverb will not eliminate room character entirely -- it reduces it to a less distracting level.
- **Plosive treatment:** Apply spectral repair to any visible plosive spikes in the waveform (sharp low-frequency impulses under 80 Hz visible as brief amplitude spikes). USB condensers with no pop filter are highly susceptible to plosives.
- **Artifact check:** After noise reduction, listen to 30 seconds of speech and 5 seconds of silence. Speech should sound natural with no metallic "warbling" on vowels. Silence should have minimal audible noise. If artifacts are present, reduce noise reduction to 8 dB and note that the noise floor may not meet strict broadcast standards at this reduction level.

#### Stage 2: Silence and Pace Editing

- **Compress silences longer than:** 1.5 seconds down to 0.7 seconds. Solo podcast narration benefits from tighter pacing.
- **Preserve breath pauses under:** 0.4 seconds unchanged. Breaths shorter than 0.4 seconds contribute to natural rhythm.
- **Breath level management:** Attenuate any breath sounds peaking above -28 dBFS by 8 dB using a fade-down. USB condensers pick up breaths clearly due to their sensitivity. Full removal sounds robotic; attenuating loud ones sounds natural.
- **Filler word editing:** Remove clusters of 3 or more consecutive filler words ("um," "uh," "like," "you know"). Leave single isolated fillers that occur in natural thinking pauses -- these maintain the conversational quality of a solo podcast.
- **Click/pop removal:** Remove any keyboard click sounds, mouse clicks, and mouth sounds using spectral repair. USB condenser microphones at typical home desk placement pick these sounds up easily.
- **Inter-speaker crossfade:** Not applicable -- single speaker.

#### Stage 3: EQ Settings

**Track: Solo Host (USB condenser, close proximity, room echo)**

| Band | Type | Frequency | Gain | Q / Slope | Purpose |
|------|------|-----------|------|-----------|---------|
| High-pass | Filter | 100 Hz | -- | 18 dB/oct | Remove rumble, proximity buildup, desk vibration |
| Low-shelf | Cut | 160 Hz | -2.0 dB | -- | Reduce remaining room warmth buildup from USB condenser proximity |
| Low-mid | Cut | 300 Hz | -2.5 dB | 1.6 | Reduce boxy room resonance and condenser muddiness |
| Presence | Boost | 3.5 kHz | +2.0 dB | 0.8 | Add clarity and intelligibility (slightly boosted to overcome room diffusion) |
| Harshness check | Cut | 2.0 kHz | -1.0 dB | 2.0 | Reduce the "edge" that USB condensers can introduce at this frequency |
| Air | Hi-shelf | 10 kHz | +1.0 dB | -- | Restore airiness lost by noise reduction processing |
| De-esser | Dynamic EQ | 7.5 kHz | -5 dB | Threshold: -18 dBFS | USB condensers are often bright and harsh on sibilants |

**EQ application notes:**
- The 2.0 kHz cut at -1.0 dB is conditional: apply only if the voice sounds harsh or "edgy" after the presence boost. Bypass and listen before committing.
- The air shelf boost at 10 kHz is conditional: apply only if the voice sounds dull after noise reduction. Noise reduction can dull high frequencies.
- Always A/B compare (EQ engaged vs. bypassed) after applying each band to confirm it is improving, not degrading, the sound
