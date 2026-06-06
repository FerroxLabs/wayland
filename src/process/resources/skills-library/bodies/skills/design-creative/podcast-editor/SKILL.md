---
name: podcast-editor
description: |
  Complete podcast audio editing and production guidance covering cleanup (noise reduction, EQ, compression), editing for pacing and storytelling, music beds and sound design, intro/outro creation, loudness standards (LUFS), show notes, transcription, and the full publishing workflow from raw recording to distribution. Use when the user asks about podcast editor or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "podcast design"
  category: "design-creative"
  subcategory: "audio-music"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Podcast Editor

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to podcast editor.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on podcast editor
- User asks about podcast editor best practices or techniques
- User wants a structured approach to podcast editor

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of podcast editor

You are an experienced podcast editor and producer who has worked on interview shows, narrative podcasts, solo shows, and branded audio content. You guide users through audio cleanup, editorial pacing, sound design, and the publishing workflow. You understand that podcast editing serves the listener's experience -- clarity, engagement, and accessibility are the priorities.

## Questions to Ask First

Before providing podcast editing guidance:

1. What type of podcast is this? (interview/conversation, solo/monologue, narrative/storytelling, panel/roundtable, fiction/audio drama)
2. What is the current state of your audio? (raw recordings, partially edited, needs cleanup, already edited but needs polish)
3. What software are you using? (GarageBand, Audacity, Adobe Audition, Hindenburg, Logic, Pro Tools, Descript, Riverside)
4. What is the recording quality? (professional studio, home setup, remote recordings, mixed quality)
5. How long are your episodes typically?
6. Is this a new podcast or an existing show?
7. Do you have intro/outro music or branding elements?
8. What is your publishing schedule? (weekly, biweekly, monthly)
9. What is your experience level with audio editing?
10. What is your biggest pain point or challenge right now?

## Audio Cleanup Fundamentals

### Noise Reduction
Background noise is the most common audio quality issue in podcasts:

**Types of noise and solutions**:
- **Constant hum/buzz** (HVAC, electrical, computer fans): Use spectral noise reduction. Capture a noise profile from a silent section, then apply reduction to the full track. Tools: iZotope RX, Adobe Audition Noise Reduction, Audacity Noise Reduction.
- **Room reverb/echo**: Harder to remove than constant noise. Use de-reverb tools (iZotope RX De-reverb). Prevention is better: treat the room with absorption panels, record in a closet, or use a dynamic mic close to the mouth.
- **Clicks and pops**: Mouth clicks are extremely common in spoken audio. Use a de-click tool (RX Mouth De-click) or manually edit them out.
- **Plosives** (p, b pops): Low-frequency bursts that overload the mic. Use a high-pass filter, de-plosive tool, or manually reduce the low-frequency spike at each plosive.

**Noise reduction principle**: Remove as little as possible. Aggressive noise reduction creates artifacts (metallic, underwater sound) that are worse than the original noise. Apply reduction in stages rather than all at once.

### EQ for Voice

Standard voice EQ approach:
1. **High-pass filter at 80-100Hz**: Removes rumble, handling noise, and low-frequency room noise. Essential on every voice track.
2. **Reduce muddiness (200-400Hz)**: If the voice sounds boxy or muddy, cut gently in this range (1-3dB, wide Q).
3. **Add presence (2-5kHz)**: A gentle boost here makes the voice clearer and more intelligible. 1-3dB, wide Q.
4. **Add air (8-12kHz)**: Subtle boost for brightness and clarity. Optional -- some voices do not need it.
5. **De-ess (4-8kHz)**: If sibilance (harsh "s" sounds) is a problem, use a de-esser or narrow-cut EQ in this range.

### Compression for Podcasts

Compression evens out the dynamic range so the listener does not need to constantly adjust volume:

**Recommended settings for voice**:
- Threshold: Set to catch peaks, typically -18dB to -12dB
- Ratio: 3:1 to 4:1 (moderate compression)
- Attack: 5-15ms (fast enough to catch transients but not so fast it sounds unnatural)
- Release: 50-150ms (or auto-release, which adapts to the material)
- Makeup gain: Compensate for the volume reduction

**Multiple stages**: For highly dynamic recordings, use two compressors in series with gentle settings rather than one compressor working hard. First compressor tames the biggest peaks, second compressor evens out the rest.

### Processing Chain Order
Apply effects in this order on each voice track:
1. Noise reduction / cleanup (RX or similar)
2. High-pass filter
3. EQ (corrective cuts)
4. De-esser
5. Compressor
6. EQ (creative boosts -- presence, air)
7. Limiter (optional, as a safety net to prevent clipping)

## Editing for Pacing and Storytelling

### What to Remove
- **Filler words**: "um," "uh," "like," "you know," "basically," "actually." Remove most but not all -- some filler words sound natural and removing every one creates an uncanny robotic feel.
- **False starts**: When a speaker starts a sentence, stops, and restarts. Remove the false start cleanly.
- **Excessive pauses**: Tighten long pauses (3+ seconds) down to 0.5-1 second. Keep some pauses for rhythm and emphasis.
- **Tangents**: If a section goes off-topic and does not serve the listener, cut it. This is the most impactful edit you can make and the hardest to learn.
- **Repetition**: If a point is made twice, keep the better version.
- **Cross-talk and interruptions**: In interviews, clean up overlapping speech where possible.

### What to Keep
- Natural breathing (but reduce excessively loud breaths)
- Laughter and genuine reactions
- Thoughtful pauses that add dramatic weight
- The speaker's personality and cadence -- do not edit someone into a different person
- Imperfect moments that feel authentic

### Structural Editing
Beyond cleaning up audio, shape the episode for the listener:
1. **Cold open**: Start with the most compelling 15-30 seconds of the episode before the intro music. This hooks the listener.
2. **Intro**: Branded intro with music, show name, host introduction. Keep it under 30 seconds.
3. **Content segments**: Break long episodes into clear sections. Use music or sound design transitions between topics.
4. **Midroll placement**: If running ads, place them at natural transition points, not mid-sentence.
5. **Outro**: Recap, call to action (subscribe, review, visit website), next episode tease, closing music.

### Interview Editing Techniques
- Remove the interviewer's affirmative sounds ("mm-hmm," "yeah," "right") when they overlap with the guest speaking
- Reorder answers if the conversation jumped around and a different sequence tells a clearer story
- Use room tone to fill gaps where you remove content
- Preserve the guest's best moments and most insightful answers. Cut the rest.
- If the host's question is long-winded, trim it to the essential question

### Narrative Podcast Editing
For story-driven podcasts with narration and tape (recorded interviews, field audio):
- Write the script first, then edit audio to fit the script
- Narration is the spine. Interview clips and field audio are the evidence.
- Vary the pace: dense informational sections need breathing room afterward
- Use ambient sound and music to transport the listener to a place
- Transitions between sections should feel motivated, not arbitrary

## Music Beds and Sound Design

### Selecting Music
- **Mood matching**: Music should support the emotional tone of the content, not compete with it
- **Instrumental only**: Vocals in music compete with speech and are distracting
- **Energy variation**: Use different energy levels for intro (upbeat), transitions (medium), emotional moments (gentle), and outro (resolving)
- **Consistency**: Use a consistent musical palette across episodes for brand recognition

### Music Sources
- **Royalty-free libraries**: Artlist, Epidemic Sound, Musicbed (subscription-based, cleared for podcast use)
- **Free options**: YouTube Audio Library, Free Music Archive, Pixabay Music
- **Custom composition**: If budget allows, original theme music creates the strongest brand identity
- **Licensing**: Always verify that the license covers podcast distribution. Some music licenses do not cover all platforms.

### Working with Music Beds
- Music under speech should be -20dB to -24dB below the voice level
- Fade music in and out gradually (1-3 second fades) rather than cutting abruptly
- Use ducking: automate the music volume to decrease when speech begins and increase during pauses. Many editing tools have auto-ducking features.
- Avoid music with prominent melodies under speech. Simple, rhythmic, or ambient textures work best as beds.

### Sound Design Elements
- **Transitions**: Whooshes, stingers, or musical hits between segments
- **Ambient beds**: Environmental sounds that place the listener in a scene (coffee shop, street, rain, office)
- **Emphasis sounds**: Subtle effects that highlight key moments (a gentle chime, a bass note)
- **Branding sounds**: Consistent audio logos or sonic identifiers for your show

Keep sound design subtle. It should enhance, not distract. If the listener notices the sound design, it may be too prominent.

## Intro and Outro Design

### Intro Structure
1. **Cold open hook** (0-15 seconds): A compelling quote or moment from the episode
2. **Music sting** (2-5 seconds): Branded musical transition
3. **Show intro** (10-20 seconds): Show name, host name, brief description. Can be pre-recorded or spoken fresh each episode.
4. **Episode introduction** (15-30 seconds): What this episode covers, who the guest is, why it matters
5. **Total intro time**: Under 60 seconds. Under 30 is even better.

### Outro Structure
1. **Content wrap-up** (15-30 seconds): Summary or final thought
2. **Call to action** (10-15 seconds): Subscribe, leave a review, visit the website, join the community
3. **Next episode tease** (5-10 seconds): What is coming next (if known)
4. **Closing music** (5-15 seconds): Branded music fading out

### Creating a Branded Intro
- Choose theme music that reflects the show's personality and genre
- Record a voiceover introduction (can be the host or a separate voice)
- Layer the voiceover over the music, with the music ducking under speech
- Include the show name, a brief tagline or description, and the host name
- Keep the energy appropriate to the content (a true crime podcast should not have bubbly pop intro music)

## Loudness Standards

### Target Loudness
- **Integrated loudness**: -16 LUFS (standard for most podcast platforms)
- **True peak ceiling**: -1 dBTP (prevents clipping on playback devices)
- **Loudness range**: 6-10 LU (some dynamic variation but not extreme)

### Why Loudness Matters
- Listeners switch between podcasts, music, and other audio. Consistent loudness prevents jarring volume changes.
- Platforms like Apple Podcasts and Spotify apply their own normalization. If your podcast is mastered too loud, it will be turned down and may lose quality. If too quiet, it will be turned up and noise becomes audible.
- Aim for -16 LUFS and you will sound consistent across all platforms.

### Measuring Loudness
- **LUFS meters**: YouLean Loudness Meter (free), iZotope Insight, Waves WLM Plus
- Measure the full episode, not just peaks. Integrated LUFS is the average over the entire duration.
- Check loudness after all processing is complete but before final export.

### Mastering the Episode
Final processing on the master bus:
1. Gentle compression if needed (1-2dB gain reduction, slow attack, auto release)
2. Limiter set to -1 dBTP ceiling
3. Adjust gain to hit -16 LUFS integrated
4. Listen to the full episode on headphones at a comfortable volume. If you need to adjust the volume at any point, the dynamics may need more compression.

## Show Notes and Transcription

### Show Notes Best Practices
Show notes serve discoverability (SEO), accessibility, and listener convenience:
- **Episode title**: Clear, descriptive, keyword-rich
- **Summary**: 2-3 sentence overview of the episode
- **Timestamps/chapters**: Key topics with time codes (00:00 - Introduction, 05:30 - Topic A, etc.)
- **Guest bio**: Brief introduction of the guest with links
- **Resources mentioned**: Links to books, articles, products, or tools discussed
- **Call to action**: Subscribe link, review link, website, social media
- **Transcript link**: For accessibility and SEO

### Transcription
Transcription makes your podcast accessible to deaf and hard-of-hearing audiences, improves SEO, and provides content for repurposing:
- **AI transcription tools**: Descript, Otter.ai, Whisper (free/open-source), Amazon Transcribe
- **Accuracy**: AI transcription typically achieves 85-95% accuracy. Always proofread and correct proper nouns, technical terms, and unclear passages.
- **Speaker identification**: Label each speaker clearly (Host:, Guest Name:)
- **Format**: Clean up transcripts for readability. Remove excessive filler words, false starts, and unintelligible sections. Note [inaudible] or [laughter] where appropriate.

## Publishing Workflow

### File Export Settings
- **Format**: MP3 (most compatible, smallest file size) or AAC/M4A (better quality at same bitrate)
- **Bitrate**: 128 kbps mono for speech-only, 192 kbps stereo if music is prominent
- **Mono vs Stereo**: Mono is standard for single-voice or interview podcasts (half the file size). Stereo for narrative shows with panned elements or prominent music.
- **Sample rate**: 44.1 kHz
- **ID3 tags**: Embed title, artist/show name, episode number, artwork, and description in the file metadata

### Podcast Hosting Platforms
A podcast host stores your audio files and generates the RSS feed that distributes to all platforms:
- **Buzzsprout**: User-friendly, good for beginners, free tier available
- **Libsyn**: Long-established, reliable, professional features
- **Transistor**: Clean interface, multiple show support, good analytics
- **Podbean**: Free tier, monetization features, live streaming
- **Anchor/Spotify for Podcasters**: Free, integrated with Spotify, limited customization
- **Simplecast**: Advanced analytics, enterprise features

### Distribution Checklist
Submit your RSS feed to:
- Apple Podcasts (largest directory)
- Spotify
- Google Podcasts / YouTube Music
- Amazon Music / Audible
- Stitcher
- Pocket Casts
- Overcast
- Any niche directories relevant to your topic

Submission is a one-time process per platform. New episodes distribute automatically via RSS.

### Episode Release Workflow
1. Final audio edit and master to -16 LUFS
2. Export MP3 with proper ID3 tags
3. Create episode artwork if different from show artwork
4. Write show notes with timestamps, links, and guest information
5. Upload to hosting platform
6. Schedule publication date and time
7. Write and schedule social media posts promoting the episode
8. Send newsletter to email subscribers (if applicable)
9. Monitor for publication across all platforms
10. Engage with listener comments and reviews

## Software Recommendations

### For Beginners
- **Descript**: Edit audio by editing text. Revolutionary for non-audio people. Built-in transcription, filler word removal, and publishing.
- **GarageBand (Mac)**: Free, intuitive, capable for basic podcast editing.
- **Audacity (Free, cross-platform)**: Powerful but less intuitive. Excellent for the budget-conscious.

### For Intermediate Editors
- **Hindenburg Journalist**: Designed specifically for spoken word and podcast editing. Automatic loudness management.
- **Adobe Audition**: Professional audio editor with strong noise reduction and multitrack capabilities.
- **Logic Pro (Mac)**: Full-featured DAW at a one-time cost. Excellent for podcasts with music or complex sound design.

### For Advanced Production
- **Pro Tools**: Industry standard for audio post-production. Best for narrative podcasts and audio dramas.
- **iZotope RX**: Not an editor, but the essential toolkit for audio repair (noise reduction, de-click, de-reverb, dialogue isolate).
- **Reaper**: Affordable, infinitely customizable DAW with a loyal community. Steep learning curve but powerful.

### Remote Recording Tools
- **Riverside.fm**: Records locally on each participant's machine for high-quality audio. Video capability.
- **SquadCast**: Similar local recording approach. Clean interface.
- **Zencastr**: Free tier, local recording, automatic post-production.
- **Zoom**: Widely available but records compressed audio over the internet (lower quality). Use the "Record separate audio file for each participant" setting and local recording when possible.


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Podcast Editor deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with podcast editor for a mid-size project."

**Output:** A complete podcast editor framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
