---
name: produce-podcast-episode
description: |
  Guides the user through producing a complete podcast episode from planning
  through distribution, chaining 6 atomic skills across design-creative, writing,
  and business categories. Covers interview vs. solo format, budget-conscious
  tool selection, and multi-platform distribution strategy. Use when the user
  wants to produce a podcast episode from concept to published audio. Do NOT use
  for ongoing podcast strategy (use individual skills), video-only content (use
  video production skills), or written content creation (use writing workflows).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "podcast step-by-step guide planning"
  category: "creative-project"
  depends: "podcast-episode-planning podcast-interview-guide voiceover-script audio-editing-guide content-brief seo-content-strategy"
  disclaimer: "none"
  difficulty: "intermediate"
---

# Produce a Podcast Episode

**Estimated time:** 3-10 hours per episode (depending on interview vs. solo format, editing complexity, and show notes depth)

This workflow orchestrates 6 skills across design-creative, writing, and business categories into a complete podcast production pipeline. Producing a podcast episode involves significantly more than recording -- the planning, preparation, editing, and distribution steps determine whether the episode reaches its intended audience and sounds professional. Each step produces a specific artifact that feeds the next, from episode outline through published audio with show notes and SEO-optimized distribution.

## When to Use

- User wants to produce their first podcast episode or improve their production process for an existing show
- User has a podcast concept and wants a structured workflow from planning through publication
- User wants to create a repeatable process for producing episodes consistently
- User is launching a new podcast and needs to produce the first 3-5 episodes before launch
- Do NOT use when: user wants to plan an entire podcast series strategy without producing an episode (use individual planning skills), user wants to create video-only content (use video production skills), user wants to write articles or blog posts (use writing workflows)

## Prerequisites

Before starting this workflow, ensure:

1. **Topic or theme identified:** The user has a clear topic for this episode or an overall podcast concept. This workflow does not help choose a podcast theme -- it produces an episode once the concept exists.
2. **Recording capability:** The user has a microphone (even a smartphone or laptop mic works for first episodes) and a quiet space to record. Professional equipment improves quality but is not required to start.
3. **Hosting platform selected (or willing to select one):** The user knows where they will publish (Spotify for Podcasters, Buzzsprout, Anchor, Podbean, etc.) or is prepared to choose during distribution setup.
4. **Guest confirmed (if interview format):** If this is an interview episode, the guest has agreed and a recording date is set.

## Steps

**Step 1: Plan the Episode Structure** (uses: podcast-episode-planning)

Create a detailed episode plan with segment structure, talking points, timing, and production notes. This is the blueprint that ensures the recording session is focused and efficient.

- Input: Episode topic, target audience, desired episode length, format (interview vs. solo vs. co-hosted), and any specific points or stories the user wants to cover
- Output: Episode outline with: title, hook or cold open concept, segment breakdown with timing estimates, key talking points per segment, transitions between segments, and call-to-action for the episode close
- Key focus: Structure the episode for listener retention. The first 60 seconds must hook the listener with a compelling question, surprising fact, or preview of the most interesting moment. Break content into 5-10 minute segments to maintain attention. Plan a clear call-to-action (subscribe, review, visit website, reply on social) for the closing.

**Step 2: Prepare Interview or Solo Script** (uses: podcast-interview-guide)

If this is an interview episode, prepare a detailed interview guide with researched questions, follow-up prompts, and conversation flow. If this is a solo episode, this step adapts to create a detailed talking points script.

- Input: Episode outline from Step 1, guest background research (for interviews), user's key messages and stories (for solo episodes)
- Output: For interviews: question list organized by theme with follow-up prompts, conversation steering notes, and time allocation per topic. For solo episodes: detailed talking points with transitions, story prompts, and natural pause points.
- Key focus: For interviews, prepare 3 types of questions: warm-up (easy, builds rapport), core (the substance of the interview), and signature (the unique question that produces the most memorable answer). For solo episodes, write transitions between segments to avoid dead air. Include time markers so the user knows when to move to the next topic during recording.

**Step 3: Write Voiceover and Intro Scripts** (uses: voiceover-script)

Write the scripted portions of the episode: the intro, outro, sponsor reads (if applicable), and any narrated segments. These polished segments bookend the more conversational content.

- Input: Episode outline from Step 1, podcast branding (show name, tagline, typical intro style), any sponsor or advertisement requirements
- Output: Scripted intro (15-30 seconds), outro (30-60 seconds), and any mid-episode narrated segments, written for natural spoken delivery with breathing marks and emphasis cues
- Key focus: The intro script must accomplish three things in under 30 seconds: identify the show, set up the episode topic, and give the listener a reason to keep listening. The outro should include the call-to-action from Step 1, preview the next episode (if known), and thank the listener. Write for the ear, not the eye -- read scripts aloud during drafting and revise anything that sounds stiff.

**Step 4: Record and Edit Audio** (uses: audio-editing-guide)

Record the episode using the preparation from Steps 1-3, then edit the raw audio into a polished final product. Editing covers technical cleanup, content trimming, and production polish.

- Input: Raw recorded audio (from the recording session), voiceover scripts from Step 3, any music or sound effects for intro and outro
- Output: Final edited audio file ready for upload, with: consistent volume levels, removed ums and long pauses, trimmed tangents, intro and outro attached, and export in the correct format for the hosting platform (typically MP3 at 128kbps for spoken word)
- Key focus: Edit in two passes. First pass: content editing (remove tangents, tighten transitions, cut sections that do not serve the episode's core message). Second pass: technical editing (normalize volume levels, remove background noise, add intro and outro music, ensure consistent audio quality throughout). For interviews, remove only genuine errors and dead air -- do not over-edit natural conversation into sounding scripted.

**Step 5: Write Show Notes and Episode Description** (uses: content-brief)

Create comprehensive show notes that serve both listeners and search engines. Show notes are the episode's written companion -- they help listeners find specific moments, provide links mentioned during the episode, and improve discoverability.

- Input: Final edited episode from Step 4, episode outline from Step 1, any resources, links, or references mentioned during the episode
- Output: Episode description (150-300 words for podcast platforms), detailed show notes (500-1000 words for the podcast website), timestamps for key moments, and a list of all resources and links mentioned
- Key focus: The episode description must work on podcast platforms where it is the only text a potential listener sees before deciding to play. Lead with the most compelling aspect of the episode. Include timestamps for key moments (listeners increasingly expect these). Show notes should include enough detail that someone skimming can find specific information discussed in the episode without re-listening to the full episode.

**Step 6: Distribute and Optimize for Discovery** (uses: seo-content-strategy)

Publish the episode to the hosting platform and optimize metadata, descriptions, and promotional content for maximum discoverability across podcast directories and search engines.

- Input: Final audio from Step 4, show notes from Step 5, episode artwork (if applicable), target audience keywords
- Output: Published episode with optimized title, description, tags, and category selection for the hosting platform. Also: social media promotional posts, a cross-posting strategy, and analytics setup to track downloads and listener behavior.
- Key focus: Podcast discoverability depends on three things: (1) title and description keywords that match how potential listeners search for content, (2) consistent publishing schedule (directories favor shows that publish regularly), and (3) early download velocity (getting listeners in the first 48 hours signals quality to algorithms). Promote the episode through social media, email newsletter (if available), and any relevant communities. Track downloads, completion rate, and listener demographics for future episode planning.

## Decision Points

- **Before Step 2:** If this is an interview episode, proceed with the full interview guide preparation. If this is a solo episode, adapt Step 2 to create detailed talking points instead of interview questions. Solo episodes require more scripting because there is no guest to share the conversational load. Co-hosted episodes fall between the two: prepare topic outlines for each host but allow for natural conversation.

- **Before Step 4:** If the user has zero budget for editing tools, recommend free options: Audacity for desktop editing, GarageBand for Mac users, or Anchor's built-in editor for basic needs. If the user has a production budget ($10-50 per month), recommend tools with noise removal and multi-track editing capabilities. The editing approach stays the same regardless of tool -- the tools change, the process does not.

- **Before Step 4:** If the recording quality is poor (excessive background noise, echo, inconsistent volume), the user has two options: (a) salvage through aggressive noise reduction in editing (quality ceiling is limited), or (b) re-record with improved conditions (closer to microphone, quieter room, better equipment). If the content was outstanding but audio quality was poor, re-recording is usually worth the effort -- listeners tolerate imperfect audio but abandon episodes where they cannot clearly hear the speaker.

- **Before Step 6:** If the user wants audio-only distribution (podcast directories only), proceed directly to hosting platform upload. If the user also wants video podcast distribution (YouTube, Spotify video), Step 4 must include video considerations (recording with camera, video editing for visual elements, thumbnail creation). Video podcasting doubles the production effort but significantly expands the potential audience.

- **After Step 6:** If download numbers are low after the first 3 episodes (fewer than 50 downloads per episode within the first week), the problem is usually discoverability, not content quality. Double down on promotion: cross-post in relevant communities, ask guests to share with their audience, and consider appearing on other podcasts to build visibility.

## Failure Handling

- **Guest cancellation (interview format):** If the guest cancels before recording, the user has three options: (a) reschedule, (b) replace with a different guest who can cover the same topic, or (c) convert to a solo episode covering the same topic from the host's perspective. Option (c) produces the fastest turnaround if the episode has a scheduled publish date. The planning from Step 1 and research from Step 2 transfer to the solo format.

- **Poor audio quality discovered during editing:** If recording quality is below acceptable standards (heavy background noise, severe echo, unintelligible segments), the user must decide: (a) re-record the affected segments (possible for solo episodes, difficult for interviews), (b) use audio restoration tools to salvage what exists (limited improvement possible), or (c) publish with a brief apology for quality issues (acceptable for early episodes of a new show, not for established shows). Prevention: always do a 60-second test recording before starting the full session.

- **Low download numbers after launch:** If the first 3-5 episodes receive fewer downloads than expected, audit three areas before quitting: (a) discoverability -- are the titles, descriptions, and tags optimized for how potential listeners search? (b) promotion -- has the user actually told people the podcast exists? (c) hook quality -- do the first 60 seconds of each episode compel someone to keep listening? Most podcast growth is slow for the first 20 episodes. Consistency matters more than viral moments.

- **User runs out of episode ideas:** Return to Step 1 with a brainstorming approach: survey the audience (if one exists), research trending topics in the niche, revisit popular earlier episodes for sequel opportunities, or invite guest pitches. A content planning session of 2 hours can produce 10-20 episode concepts.

## Output Format

```
## Podcast Episode Production: [Episode Title]

### Step 1: Episode Plan
- Format: [interview / solo / co-hosted]
- Target length: [minutes]
- Segments: [count with brief descriptions]
- Hook: [first 60 seconds concept]
- Call to action: [what listeners should do]

### Step 2: Interview/Script Preparation
- Questions prepared: [count] (interview) or Talking points: [count] (solo)
- Estimated recording time: [minutes]
- Key topics: [list]

### Step 3: Scripted Segments
- Intro: [word count, duration]
- Outro: [word count, duration]
- Sponsor reads: [count, if applicable]

### Step 4: Recording and Editing
- Raw recording length: [minutes]
- Final edited length: [minutes]
- Editing passes: [content + technical]
- Export format: [MP3 128kbps / other]

### Step 5: Show Notes
- Episode description: [word count]
- Show notes: [word count]
- Timestamps: [count]
- Links included: [count]

### Step 6: Distribution
- Platform: [hosting platform]
- Directories: [list]
- Promotional posts: [count and platforms]
- Analytics setup: [yes / no]

### Production Status
- Current step: [Step N]
- Target publish date: [date]
- Total production hours: [estimated]
```

## Edge Cases

- **User is producing their very first podcast episode ever:** Add a pre-workflow step: choose a podcast name, create cover art (even simple), and set up a hosting account. The first episode should be a "trailer" or short introduction episode (3-5 minutes) rather than a full-length episode, to test the production pipeline before committing to a full episode's worth of effort.

- **User wants to produce a highly produced narrative podcast (like Serial or This American Life):** This workflow covers conversational and interview podcast formats. Narrative podcasts require additional skills: sound design, music scoring, multiple narrator tracks, and script-driven production. The planning and distribution steps still apply, but Steps 3-4 need significant expansion beyond this workflow's scope.

- **User is producing a podcast in a language other than English:** All structural advice applies universally. Platform selection in Step 6 may need adjustment -- some hosting platforms have better support for non-English content and specific regional podcast directories.

- **User has a co-host in a different location:** Remote co-hosting requires recording setup coordination. Both participants should record locally (double-ender recording) for best quality. Step 4 editing must sync two separate audio tracks. Add 30 minutes to the production timeline for track alignment.

- **User wants to monetize the podcast from episode one:** Monetization (sponsors, listener support, premium content) is outside this workflow's scope but influences Step 3 (sponsor read scripts) and Step 6 (distribution to monetization-friendly platforms). The user should not expect meaningful revenue until reaching at least 500 downloads per episode consistently.

## Example

**Input:** "I run a design agency and want to produce a weekly interview podcast where I talk to creative directors about their career paths and creative process. This is my first podcast. Budget is minimal."

**Output:**

**Step 1 (podcast-episode-planning):**
Episode 1 focuses on a creative director at a branding agency. Format: 30-minute interview. Segments: cold open with a compelling quote from the guest (30 seconds), intro (30 seconds), warm-up segment on the guest's origin story (5 minutes), core segment on their creative process (15 minutes), rapid-fire questions (5 minutes), closing and call-to-action (2 minutes). The cold open pulls the most interesting quote from the interview to hook listeners immediately.

**Step 2 (podcast-interview-guide):**
15 questions prepared in three tiers: warm-up ("How did you first know you wanted to work in design?"), core ("Walk me through your creative process from brief to final delivery -- what does the messy middle actually look like?"), and signature ("What is the worst creative decision you have ever made, and what did it teach you?"). Follow-up prompts prepared for each question in case the guest gives a short answer.

**Step 3 (voiceover-script):**
Intro script (20 seconds): "Welcome to Creative Paths, the podcast where we go behind the portfolio with the creative directors shaping today's brands. I'm [Host Name], and each week I sit down with a design leader to unpack their creative process, career pivots, and the projects that defined them. Today, [Guest Name] from [Agency] joins me to talk about [teaser]." Outro includes subscribe prompt and next episode preview.

**Step 4 (audio-editing-guide):**
Recorded on Zoom (free) with both participants using headphones. Raw recording: 42 minutes. Content edit: trimmed to 31 minutes by removing a 6-minute tangent and tightening transitions. Technical edit: noise removal on the guest's track (slight background hum), volume normalization, intro music added (royalty-free, 10-second fade). Exported as MP3 128kbps.

**Step 5 (content-brief):**
Episode description (200 words): leads with the guest's most provocative insight about creative process. Show notes (600 words): includes timestamps for each segment, 3 key takeaways, guest bio, links to the guest's portfolio and agency website, and the book the guest recommended during the episode. Format optimized for both podcast platform display and the show's website page.

**Step 6 (seo-content-strategy):**
Published to Buzzsprout, which distributes to Apple Podcasts, Spotify, Google Podcasts, and 8 other directories automatically. Title optimized: "How [Guest Name] Builds Brands That Last | Creative Director at [Agency]" (includes the guest's name for searchability). Tags: creative direction, design career, branding, agency life. Promotional posts created for LinkedIn (professional audience) and Instagram (design community). Analytics tracked: downloads in first 48 hours, completion rate, geographic distribution.

**Result:** First episode published in 6 hours total production time. The repeatable process (Steps 1-6) is now established, and subsequent episodes take 3-4 hours each as the user builds efficiency.

## Expected Outcome

When this workflow is complete, the user will have:

1. A structured episode plan with segment timing, talking points, and production notes
2. An interview guide or solo script with researched content and natural transitions
3. Polished intro and outro scripts that brand the show and direct listener action
4. A professionally edited audio file ready for distribution
5. Comprehensive show notes with timestamps, links, and an SEO-optimized episode description
6. A published episode distributed across major podcast directories with promotional content
