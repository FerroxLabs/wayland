---
name: twitch-streamer
description: |
  Complete Twitch streaming guide covering OBS setup, alerts, overlays, community building, moderation systems, monetization through subscriptions, bits and ads, raid strategy, and the path from Affiliate to Partner. Use when the user asks about twitch streamer or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "social-media marketing content-marketing"
  category: "marketing-sales"
  subcategory: "seo-growth"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Twitch Streamer

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to twitch streamer.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on twitch streamer
- User asks about twitch streamer best practices or techniques
- User wants a structured approach to twitch streamer

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of twitch streamer

## Questions to Ask First

Before building a Twitch streaming practice, answer these:

1. What category will you primarily stream? (Gaming, Just Chatting, Creative, Music, IRL)
2. What is your streaming goal? (Community building, income, entertainment career, networking)
3. How many hours per week can you consistently stream? (Minimum 3 streams/week recommended)
4. What is your PC/hardware situation? Can it handle streaming + your content simultaneously?
5. Do you have a reliable internet connection? (Upload speed of 6+ Mbps minimum)
6. Are you comfortable talking to a camera with potentially zero viewers for weeks?
7. What makes you different from the thousands of other streamers in your category?
8. Do you have any existing community or social media following?
9. What is your budget for initial setup? ($0, $200, $500, $1,000+)
10. Are you prepared for the time investment before seeing any financial return? (Typically 6-12+ months)

## Stream Setup: OBS Configuration

### OBS Studio Settings for Twitch

**Video Settings:**
```
Base Resolution:     1920x1080
Output Resolution:   1920x1080 (or 1280x720 if PC struggles)
FPS:                 60 (or 30 if PC limited)
```

**Output Settings (Streaming):**
```
Encoder:       x264 (CPU) or NVENC (GPU - preferred if you have NVIDIA)
Rate Control:  CBR
Bitrate:       4500-6000 kbps (for 1080p60)
               2500-4000 kbps (for 720p60)
Keyframe:      2 seconds
Preset:        Quality (NVENC) or Faster/Fast (x264)
Profile:       High
```

**Audio Settings:**
```
Sample Rate:    48kHz
Channels:       Stereo
Desktop Audio:  Your speakers/headphones output
Mic/Aux:        Your microphone input
```

### Scene Setup Blueprint

**Essential Scenes:**

1. **Starting Soon** - Animated screen with countdown, music, chat visible
2. **Main Content** - Game capture or screen share + webcam overlay
3. **Just Chatting** - Webcam full-screen or large + chat overlay
4. **BRB (Be Right Back)** - Animated screen with music
5. **Ending/Raid Screen** - Thank you message, social links, raid target

### Source Layer Order (Bottom to Top)

```
Layer 1: Game Capture / Display Capture
Layer 2: Webcam (positioned bottom-left or bottom-right)
Layer 3: Overlay frame (borders around webcam, alerts zone)
Layer 4: Alert box (follower, subscriber, donation notifications)
Layer 5: Chat overlay (optional, for fullscreen viewers)
Layer 6: Event list (recent followers, subs, donations)
Layer 7: Channel point redemptions
```

## Alerts and Overlays

### Alert Setup with StreamElements or Streamlabs

**Essential Alerts:**
| Event | Visual | Sound | Duration |
|-------|--------|-------|----------|
| New Follower | Subtle animation | Gentle chime | 3-5 seconds |
| Subscription | Prominent animation | Celebration sound | 5-8 seconds |
| Bits/Cheer | Animated emote | Coin/cheer sound | 5-8 seconds |
| Raid | Full-screen welcome | Dramatic sound | 8-10 seconds |
| Donation | Thank you animation | Custom sound | 5-8 seconds |

**Alert Best Practices:**
- Keep alerts visible but not disruptive to content
- Acknowledge every alert verbally (builds community)
- Don't make alerts so flashy they distract from content
- Test all alerts before going live
- Set minimum amounts for TTS (text-to-speech) to prevent spam

### Overlay Design Principles

- **Minimal is better**: Don't cover more than 15% of screen with overlays
- **Brand consistency**: Use 2-3 colors and one font family
- **Webcam border**: Simple frame that matches your brand
- **Info panels**: Stream title, social handles, goals (bottom bar)
- **Avoid clutter**: Every element should serve a purpose

### Free Overlay Sources

- StreamElements (free themes)
- Streamlabs (free themes)
- OWN3D.tv (free and paid)
- Nerd or Die (free basic packages)
- Canva (create custom overlays)

## Community Building

### The First 100 Followers Strategy

1. **Network before you stream**: Spend time in other streamers' chats (genuinely)
2. **Be consistent**: Same days, same times, every week
3. **Stream in smaller categories**: Avoid Fortnite/League (oversaturated) early on
4. **Talk constantly**: Narrate everything, even to zero viewers (VODs attract future viewers)
5. **Engage every person who chats**: Use their name, ask questions back
6. **Raid other small streamers** after every stream (builds reciprocal relationships)
7. **Create clips**: Post best moments on TikTok, YouTube Shorts, Twitter
8. **Join streamer communities**: Discord servers for small streamers in your niche

### Building a Loyal Community

**The CARE Framework:**
- **C**onsistency: Stream on schedule without fail
- **A**uthenticity: Be genuinely yourself, not a character
- **R**ecognition: Remember regulars, celebrate their milestones
- **E**ngagement: Make viewers feel like participants, not spectators

### Community Engagement Tactics

- **Custom channel point rewards**: Let viewers influence the stream
- **Regular viewer shoutouts**: "Welcome back [name], good to see you"
- **Inside jokes and emotes**: Build shared culture
- **Viewer game nights**: Play with your community
- **Milestone celebrations**: Follower/subscriber milestones become events
- **Discord server**: Off-stream community gathering place
- **Mod appreciation**: Publicly thank your moderators regularly

## Moderation

### Setting Up AutoMod

Twitch AutoMod filters messages before they appear in chat:
- **Level 1-2**: Light filtering (blocks severe content)
- **Level 3**: Moderate filtering (good starting point)
- **Level 4**: Heavy filtering (good for family-friendly streams)

### Chat Rules Template

```
Welcome to [Channel Name]! Please follow these rules:

1. Be respectful to everyone in chat
2. No hate speech, discrimination, or harassment of any kind
3. No spam or excessive caps
4. No self-promotion without permission
5. No spoilers unless the streamer asks for them
6. Listen to moderators
7. Keep conversations relevant to the stream
8. Have fun and be kind

Breaking rules may result in timeout or ban at moderator discretion.
```

### Moderator Selection and Training

**When to recruit mods**: After 20-30 consistent viewers

**Good mod qualities:**
- Regular viewer who understands your community culture
- Level-headed under pressure
- Available during your stream times
- Communicates with you about issues
- Doesn't power-trip

**Mod guidelines to establish:**
- When to timeout vs warn vs ban
- How to handle borderline messages
- Escalation path (mod -> head mod -> you)
- Clear rules about personal bias vs rule enforcement

### Bot Setup (Nightbot/StreamElements)

Essential bot commands:
```
!socials    - Links to your social media
!schedule   - Your streaming schedule
!discord    - Link to your Discord
!lurk       - Acknowledge lurkers ("Thanks for the lurk, [user]!")
!commands   - List available commands
!uptime     - How long the stream has been live
!followage  - How long a user has followed
```

## Schedule Consistency

### Building Your Stream Schedule

**Minimum viable schedule**: 3 streams per week, same days and times

**Schedule Design Factors:**
1. When is your target audience available? (Check Twitch category viewer patterns)
2. When are you at your best energy? (Don't stream when you're exhausted)
3. When is competition lowest in your category? (Fewer big streamers live)
4. Can you maintain this schedule for 6+ months without burning out?

### Schedule Template

```
Monday:    6 PM - 9 PM EST    [Main content]
Wednesday: 6 PM - 9 PM EST    [Main content]
Friday:    7 PM - 11 PM EST   [Extended stream / special event]
Saturday:  2 PM - 5 PM EST    [Variety / community games] (optional)
```

### Stream Length Guidelines

- **Minimum**: 2 hours (gives time for viewers to find you)
- **Sweet spot**: 3-4 hours (good balance of content and energy)
- **Maximum recommended**: 6 hours (beyond this, quality drops)
- **Marathon streams**: Special events only, not regular practice

## Monetization

### Revenue Streams on Twitch

| Revenue Source | Requirements | Typical Earnings |
|---------------|-------------|-----------------|
| Subscriptions | Affiliate status | $2.50 per Tier 1 sub (50/50 split until Partner) |
| Bits (Cheers) | Affiliate status | $0.01 per bit to you |
| Ads | Affiliate/Partner | $3.50-10 CPM |
| Donations | None (third-party) | Variable, viewer generosity |
| Sponsorships | Brand interest | $50-5,000+ per stream |
| Affiliate links | None | 5-20% commission |
| Merchandise | Audience demand | Variable |

### Subscription Strategy

**Encouraging subs without begging:**
- Offer genuine value for subscribers (emotes, badges, sub-only perks)
- Run sub goals with community rewards ("At 50 subs, I'll do [event]")
- Thank every sub personally and by name
- Use channel points to give subscribers bonus perks
- Create subscriber-only streams or events monthly

**Emote progression:**
- Tier 1 (2 emote slots at Affiliate): Your most expressive/useful emotes
- Unlock more slots as sub count grows
- Let community vote on new emote designs
- Commission an artist ($30-100 per emote) for quality emotes

### Bits and Cheering

- Set up bit-triggered alerts (minimum 100 bits to prevent spam)
- Create bit badges that incentivize cumulative cheering
- Acknowledge every cheer during stream
- Don't put minimum amounts too high (kills casual cheering)

### Ad Strategy

- Run pre-roll ads to catch up on chat (when you'd be reading chat anyway)
- Mid-roll ads during natural breaks (bathroom, food, loading screens)
- Don't run ads during key content moments
- Subscribers skip pre-roll ads (another sub incentive)
- 3-minute ad-free guarantee for new viewers if you run a 90-second ad

## Raid and Host Strategy

### Raiding Other Streamers

**Why raiding matters:**
- Builds genuine relationships with other creators
- Your viewers discover new streamers (they appreciate it)
- Raided streamers often reciprocate
- Creates a network effect in your community

**Raid targeting strategy:**
1. Raid streamers in your size range (0.5x to 3x your viewer count)
2. Raid within your category or adjacent categories
3. Raid the same streamers regularly (builds real relationships)
4. Announce the raid: "Let's go show [streamer] some love!"
5. Stay in their chat for a few minutes after raiding

### Incoming Raids

- Have a raid alert that welcomes the raiding community
- Thank the raiding streamer by name
- Welcome raiders individually if possible
- Give a brief introduction to what you're doing
- Follow back and raid them in the future

## The Affiliate to Partner Path

### Twitch Affiliate Requirements

| Requirement | Threshold | Tips |
|-------------|-----------|------|
| Followers | 50 | Achievable in 2-4 weeks with networking |
| Stream days (last 30) | 7 different days | Consistent schedule |
| Stream hours (last 30) | 8 hours total | ~2 hours/stream |
| Average viewers (last 30) | 3 concurrent | Hardest requirement -- focus here |

### Twitch Partner Requirements

| Requirement | Threshold | Tips |
|-------------|-----------|------|
| Stream days (last 30) | 12 different days | Nearly every other day |
| Stream hours (last 30) | 25 hours | ~2 hours per stream day |
| Average viewers (last 30) | 75 concurrent | The real challenge |

**Note**: Meeting Partner requirements does not guarantee acceptance. Twitch reviews applications holistically.

### The Growth Plan from Affiliate to Partner

**Phase 1: Foundation (0-6 months, 0-50 followers)**
- Establish schedule and stick to it
- Learn OBS, alerts, and stream management
- Network with 10+ streamers in your category
- Create social media presence (clips on TikTok/YouTube)

**Phase 2: Affiliate (6-12 months, 50-500 followers)**
- Optimize stream quality (audio, video, overlays)
- Build Discord community
- Develop signature content (what makes YOUR stream unique)
- Collaborate with other Affiliates
- Start tracking analytics seriously

**Phase 3: Growth (12-24 months, 500-5,000 followers)**
- Content diversification (YouTube highlights, TikTok clips)
- Brand consistency across platforms
- Community events and special streams
- Consider a stream team
- Approach small brands for sponsorships

**Phase 4: Partner Push (18-36 months, 5,000+ followers)**
- Consistent 75+ concurrent viewers
- Professional stream quality
- Active multi-platform presence
- Community management team (mods, Discord admins)
- Apply for Partner when requirements are met consistently

## Burnout Prevention

### Warning Signs

- Dreading going live
- Skipping scheduled streams
- Irritability during stream
- Comparing yourself to larger streamers constantly
- Neglecting personal relationships and health
- Feeling like you "have to" stream rather than "want to"

### Prevention Strategies

1. **Schedule days off**: At least 2-3 days per week with no streaming obligations
2. **Set boundaries**: Don't stream past your planned end time just for viewer retention
3. **Batch content creation**: Film clips and social content in one session
4. **Delegate**: Let mods handle Discord, social media, or clip creation
5. **Remember your why**: Reconnect with the reason you started
6. **Celebrate small wins**: 10 concurrent viewers is an achievement
7. **Take planned breaks**: Announce 1-week breaks quarterly
8. **Exercise and sleep**: Physical health directly impacts stream energy
9. **Have non-streaming hobbies**: Maintain interests outside of content creation
10. **Connect with streamer friends**: Share the struggles with people who understand

## Analytics and Improvement

### Key Metrics to Review Weekly

| Metric | What It Means | Target Direction |
|--------|--------------|-----------------|
| Average viewers | Stream attraction power | Up |
| Peak viewers | Event/content quality | Up |
| Unique chatters | Community engagement | Up |
| Follower conversion | Profile/content appeal | 10%+ of unique viewers |
| Sub retention | Value perception | 70%+ monthly retention |
| Stream summary | Best/worst moments | Learn and repeat peaks |
| Clip views | Discovery potential | Up |
| Raid incoming/outgoing | Network strength | Active in both directions |

### The Weekly Review Process

```
Every Monday (15 minutes):
1. Check last week's average viewers vs previous week
2. Identify best-performing stream (why was it good?)
3. Identify worst-performing stream (what happened?)
4. Review chat engagement patterns (what topics drove conversation?)
5. Check social media growth (clips, TikToks, YouTube)
6. Set one specific improvement goal for this week
7. Update content plan based on findings
```


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Twitch Streamer deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with twitch streamer for a mid-size project."

**Output:** A complete twitch streamer framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
