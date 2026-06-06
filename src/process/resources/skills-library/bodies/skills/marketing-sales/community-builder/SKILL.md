---
name: community-builder
description: |
  Online community design and management for Discord, Circle, and Slack platforms covering onboarding flows, channel architecture, engagement mechanics, moderation systems, events, scaling strategies, membership tiers, and community health metrics. Use when the user asks about community builder or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "marketing social-media strategy"
  category: "marketing-sales"
  subcategory: "seo-growth"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Community Builder

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to community builder.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on community builder
- User asks about community builder best practices or techniques
- User wants a structured approach to community builder

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of community builder

## Questions to Ask First

Before building any online community, answer these foundational questions:

1. What is the core purpose of this community? (Learning, networking, support, co-creation, accountability)
2. Who is the ideal member? Be specific about demographics, professional level, and interests.
3. What will members get here that they cannot get anywhere else?
4. Will this be free, paid, or freemium? What is the business model?
5. What platform aligns with your audience? (Discord for younger/tech, Slack for professionals, Circle for creators)
6. How much time per day can you or your team dedicate to community management?
7. Do you have an existing audience to seed the community from?
8. What is your target size? (50, 500, 5,000, 50,000 members)
9. What does an engaged member look like? What actions define engagement?
10. How will you prevent the community from becoming dead or toxic?

## Platform Selection

### Platform Comparison Matrix

| Feature | Discord | Slack | Circle | Mighty Networks | Skool |
|---------|---------|-------|--------|----------------|-------|
| Best for | Gaming, tech, creators | Professional, B2B | Course creators | Community businesses | Course + community |
| Price (community) | Free | Free (limited) / $7.25+ per user | $89-399/mo | $33-247/mo | $99/mo |
| Real-time chat | Excellent | Excellent | Good | Moderate | Basic |
| Async discussion | Moderate (forums) | Good (threads) | Excellent | Excellent | Good |
| Voice/Video | Built-in | Huddles | Zoom integration | Built-in | Zoom integration |
| Customization | Very high | Moderate | High | High | Low |
| Mobile app | Yes | Yes | Yes | Yes | Yes |
| Learning curve | Moderate | Low | Low | Low | Very low |
| Integrations | Bots, webhooks | Extensive | API, Zapier | Native | Limited |
| Max free members | Unlimited | 10K messages visible | N/A (paid) | N/A (paid) | N/A (paid) |

### Decision Framework

```
Is your audience primarily professionals/B2B?
  YES --> Slack (if < 500 members) or Circle (if paid community)
  NO -->
    Is your audience tech-savvy or gaming-oriented?
      YES --> Discord
      NO -->
        Are you bundling with a course?
          YES --> Circle, Skool, or Mighty Networks
          NO --> Circle for async, Discord for real-time
```

## Onboarding Design

### The First 5 Minutes Rule

A new member decides within the first 5 minutes whether they'll engage or lurk forever. Your onboarding must accomplish:

1. **Welcome**: Make them feel seen and acknowledged
2. **Orient**: Help them understand the community structure
3. **Act**: Give them something to do immediately
4. **Connect**: Help them meet someone

### Onboarding Flow Template

**Step 1: Welcome Message (Automated)**
```
Welcome to [Community Name], [member name]!

We're glad you're here. This community is for [audience] who want
to [outcome]. Here's how to get started:

1. Introduce yourself in #introductions (template below)
2. Read the community guidelines in #rules
3. Check out #start-here for our most popular resources
4. Join the conversation in #general

Your intro template:
- Name:
- Location:
- What you do:
- What you're working on:
- One fun fact:

See you in there!
```

**Step 2: Introduction Post (Member Action)**
- Direct new members to an introductions channel
- Provide a template to reduce friction
- Have moderators or community managers respond to every intro within 4 hours
- Tag members with similar interests to connect them

**Step 3: Orientation Content**
- Pinned post or dedicated channel explaining key channels and their purposes
- Community guidelines and expectations
- FAQ addressing common new-member questions
- Quick-win resource (template, guide, checklist related to community topic)

**Step 4: First-Week Follow-Up**
- Day 2: DM checking in, "Did you find what you were looking for?"
- Day 4: Tag them in a relevant conversation
- Day 7: Invite them to upcoming event or challenge

## Channel Structure

### Discord Server Architecture

```
INFORMATION
  #welcome-rules          Read-only, rules and guidelines
  #announcements           Read-only, important updates
  #start-here             Read-only, onboarding guide
  #roles                  Self-assign interest roles

COMMUNITY
  #introductions          New member intros
  #general                Main conversation
  #off-topic              Non-community-topic chat
  #wins-celebrations      Share achievements
  #accountability         Goal tracking and check-ins

TOPIC CHANNELS (customize for your niche)
  #topic-channel-1        [Specific subtopic]
  #topic-channel-2        [Specific subtopic]
  #resources              Shared links and tools
  #feedback               Give and receive feedback on work

EVENTS
  #events-calendar        Upcoming events
  #event-chat             Live event discussion

SUPPORT
  #questions              Ask the community
  #tech-help              Platform-specific help

PREMIUM (role-gated, if applicable)
  #premium-general        Paid member discussion
  #premium-resources      Exclusive content
  #premium-coaching       Direct access

VOICE CHANNELS
  General Voice           Always-open hangout
  Co-working              Camera optional, muted work sessions
  Events Stage            For scheduled live events
```

### Channel Design Principles

1. **Start with fewer channels** (5-8) and add as demand grows
2. **Every channel needs a clear purpose** -- if you can't explain it in one sentence, merge it
3. **Archive dead channels** rather than leaving them empty
4. **Use categories** to group related channels visually
5. **Pin important messages** in each channel for quick reference
6. **Slow mode** on high-traffic channels to maintain conversation quality

### Slack Workspace Structure

```
#general               Main conversation (default)
#introductions         New member introductions
#announcements         Admin-only posting
#random                Off-topic conversation
#resources             Shared links and tools
#[topic-1]             Niche-specific discussion
#[topic-2]             Niche-specific discussion
#wins                  Celebrate achievements
#questions             Community Q&A
#feedback              Share work for feedback
#events                Event announcements and discussion
```

## Engagement Mechanics

### The Engagement Loop

```
Trigger (notification, email, habit)
  --> Visit community
    --> See interesting content
      --> Consume or participate
        --> Receive response/recognition
          --> Feel valued/connected
            --> Return (loop restarts)
```

### Daily Engagement Tactics

| Tactic | Effort | Impact | Frequency |
|--------|--------|--------|-----------|
| Daily discussion prompt | Low | High | Daily |
| Welcome new members personally | Medium | Very High | As needed |
| Share a resource or insight | Low | Medium | Daily |
| Respond to unanswered questions | Medium | Very High | Multiple times/day |
| Highlight member contributions | Low | Very High | Daily |
| Create polls or surveys | Low | Medium | 2-3x/week |

### Weekly Engagement Tactics

| Tactic | Effort | Impact | Frequency |
|--------|--------|--------|-----------|
| Themed discussion days | Low | High | Weekly |
| Member spotlight/feature | Medium | Very High | Weekly |
| Live event (AMA, workshop, hangout) | High | Very High | Weekly |
| Challenge or accountability check-in | Medium | High | Weekly |
| Content roundup (best posts/resources) | Medium | Medium | Weekly |
| Co-working sessions | Low | Medium | 1-3x/week |

### Monthly Engagement Tactics

| Tactic | Effort | Impact | Frequency |
|--------|--------|--------|-----------|
| Guest expert session | High | Very High | Monthly |
| Community survey/feedback | Medium | High | Monthly |
| Monthly recap and celebrations | Medium | High | Monthly |
| Community project or collaboration | High | Very High | Monthly/Quarterly |
| Networking events (breakout rooms) | Medium | High | Monthly |

### Gamification Elements

**Use sparingly and with purpose:**

- **Points/XP**: Earned for posting, helping others, attending events
- **Levels/Roles**: Visual progression (New Member -> Regular -> Veteran -> Legend)
- **Badges/Achievements**: For specific accomplishments (First Post, 30-Day Streak, Helper)
- **Leaderboards**: Weekly or monthly top contributors
- **Challenges**: Time-limited goals with community recognition

**Warning**: Gamification can backfire if it incentivizes quantity over quality. Always reward helpful behavior, not just activity volume.

## Moderation

### Community Guidelines Template

```
[Community Name] Guidelines

Our mission: [One sentence about community purpose]

We expect all members to:

1. BE RESPECTFUL
   Treat every member with dignity. Disagree with ideas, not people.
   No personal attacks, name-calling, or dismissive behavior.

2. ADD VALUE
   Before posting, ask: "Will this help someone?" Share knowledge,
   ask thoughtful questions, provide constructive feedback.

3. STAY ON TOPIC
   Use channels for their intended purpose. Off-topic conversation
   goes in #off-topic or #random.

4. NO SPAM OR SELF-PROMOTION
   Don't promote your products/services without permission. Share
   resources that genuinely help, not just your own links.

5. PROTECT PRIVACY
   Don't share others' personal information. What's shared in the
   community stays in the community unless otherwise stated.

6. NO HATE SPEECH OR DISCRIMINATION
   Zero tolerance for racism, sexism, homophobia, transphobia,
   ableism, or any form of discrimination.

Enforcement:
  First violation:  Warning via DM from moderator
  Second violation: 24-hour mute/timeout
  Third violation:  Permanent removal (no refund for paid communities)
  Severe violation: Immediate removal (threats, hate speech, harassment)
```

### Moderator Handbook Outline

```
1. Role and Responsibilities
   - Monitor channels during assigned hours
   - Enforce community guidelines consistently
   - Welcome new members
   - Escalate issues to community manager

2. Moderation Actions
   - When to issue a warning (first offense, ambiguous situations)
   - When to timeout/mute (repeat offenders, heated arguments)
   - When to ban (severe violations, no tolerance items)
   - When to escalate (threats, legal concerns, complex situations)

3. Communication Standards
   - Always DM privately for warnings (don't call people out publicly)
   - Use neutral language ("The guidelines state..." not "You're being...")
   - Document every action in #mod-log
   - Never engage in arguments with members being moderated

4. Self-Care
   - You can step away if a situation is triggering
   - Tag another mod to handle difficult situations
   - Regular check-ins with community manager
   - It's okay to take breaks from moderation
```

## Events

### Event Types and Formats

| Event Type | Format | Duration | Frequency | Best For |
|-----------|--------|----------|-----------|----------|
| AMA (Ask Me Anything) | Live Q&A | 60 min | Monthly | Expert access |
| Workshop | Teaching + practice | 90-120 min | Biweekly/Monthly | Skill building |
| Co-working | Silent work, camera on | 2-4 hours | Weekly | Accountability |
| Networking | Breakout rooms | 60 min | Monthly | Connection |
| Book/Content Club | Discussion | 60 min | Monthly | Learning |
| Town Hall | Community updates | 30-45 min | Monthly/Quarterly | Transparency |
| Social Hangout | Casual chat, games | 60-90 min | Weekly | Bonding |
| Challenge Kickoff | Launch a group goal | 30 min | Monthly | Motivation |

### Event Production Checklist

```
2 weeks before:
  [ ] Set date, time, and platform
  [ ] Create event description and graphics
  [ ] Post announcement in community
  [ ] Send email to members

1 week before:
  [ ] Reminder post in community
  [ ] Prepare any presentation materials
  [ ] Test tech (audio, video, screen share)
  [ ] Prepare backup plan if tech fails

Day of:
  [ ] Final reminder 2 hours before
  [ ] Open room 15 minutes early
  [ ] Record the event (with permission)
  [ ] Have a moderator manage chat

After:
  [ ] Share recording within 24 hours
  [ ] Post key takeaways in community
  [ ] Thank attendees and speakers
  [ ] Collect feedback (quick survey)
```

## Scaling

### The Community Growth Phases

**Phase 1: Intimate (0-50 members)**
- You know everyone by name
- Every member gets personal attention
- Focus: Culture setting, founding member relationships
- Your role: Host and primary contributor

**Phase 2: Village (50-200 members)**
- Core group of regulars forms
- Recruit first moderators
- Focus: Establishing rituals and engagement patterns
- Your role: Host and culture guardian

**Phase 3: Town (200-1,000 members)**
- Subgroups and interest clusters form
- Need structured moderation and channel organization
- Focus: Scalable engagement, member-led activities
- Your role: Mayor (less daily involvement, more strategic)

**Phase 4: City (1,000-10,000 members)**
- Professional community management needed
- Automated onboarding, bot-assisted moderation
- Focus: Member experience consistency, preventing toxicity
- Your role: Executive (strategy, culture, partnerships)

**Phase 5: Metropolis (10,000+ members)**
- Full community team needed
- Sub-communities and special interest groups
- Focus: Governance, member self-organization, quality control
- Your role: Founder (vision, high-level decisions)

### Scaling Without Losing Culture

1. **Document your values early**: Write down what makes the community special
2. **Empower members**: Create ambassador or mentor programs
3. **Automate onboarding**: But keep personal touch for first interaction
4. **Create sub-spaces**: Special interest channels or groups within the community
5. **Maintain rituals**: Weekly events, traditions, shared language
6. **Hire community managers**: Before you need them (reactive hiring is too late)

## Membership Tiers

### Tier Design Framework

```
FREE TIER (Acquisition)
  Purpose: Attract and qualify potential paid members
  Include: Basic community access, limited channels, public events
  Exclude: Premium content, direct access, advanced features

PAID TIER 1 ($10-20/month) (Core)
  Purpose: Primary membership, most members land here
  Include: Full community access, all events, resource library
  Value proposition: "Everything you need"

PAID TIER 2 ($30-50/month) (Premium)
  Purpose: Enhanced experience for committed members
  Include: Everything in Tier 1 + small group sessions, priority support
  Value proposition: "Accelerated results"

PAID TIER 3 ($100+/month) (VIP/Inner Circle)
  Purpose: Highest-touch experience
  Include: Everything below + 1-on-1 access, exclusive events
  Value proposition: "Direct access and personalized attention"
  Note: Limit seats to maintain exclusivity
```

### Pricing Psychology for Communities

- Annual billing with a discount (20-30% off monthly rate) increases retention
- Free trials convert 10-20% of trialers to paid
- Founding member pricing (locked-in lower rate) rewards early adopters
- Price increases for new members create urgency to join now
- Grandfathering existing members through price increases builds loyalty

## Community Health Metrics

### The Community Health Dashboard

Track these metrics monthly:

| Metric | How to Measure | Healthy Range |
|--------|---------------|---------------|
| DAU/MAU ratio | Daily active / Monthly active users | 20-40% |
| Messages per active member | Total messages / active members | 3-10/week |
| New member retention (30-day) | Members active after 30 days | 40-60% |
| Response time | Average time until a question gets a reply | Under 4 hours |
| Event attendance rate | Attendees / total members | 5-15% |
| Net Promoter Score | Survey: "Would you recommend?" | 30+ |
| Churn rate (paid) | Members canceling / total members | Under 5%/month |
| Member satisfaction | Periodic survey | 4.0+ out of 5 |

### Warning Signs of Community Decline

1. **Decreasing message volume** over weeks (not just seasonal dips)
2. **Same 5 people** carrying all conversations
3. **Unanswered questions** sitting for 24+ hours
4. **Increasing negativity** or complaints about the community itself
5. **Declining event attendance** trend
6. **Rising churn** or cancellation rate
7. **Silence from new members** (they join and never post)
8. **Moderator burnout** (they're becoming inactive)

### Recovery Tactics

- **Re-engagement campaign**: Personal DMs to inactive members asking what they need
- **Content refresh**: New programming, events, or challenges
- **Member feedback survey**: Ask directly what's working and what's not
- **Culture reset**: Restate values, address issues openly, reinforce positive behavior
- **Bring in fresh energy**: Guest experts, new events, partnerships with other communities
- **Reduce friction**: Simplify channel structure, improve onboarding
- **Lead by example**: Increase your own visible participation

## Community Business Model

### Revenue Calculation

```
Target monthly revenue:           $10,000

Model A: Volume (low-price, many members)
  Price:                          $15/month
  Members needed:                 667
  Audience size needed (2% conv): 33,350

Model B: Mid-market
  Price:                          $39/month
  Members needed:                 257
  Audience size needed (3% conv): 8,567

Model C: Premium (high-price, fewer members)
  Price:                          $99/month
  Members needed:                 101
  Audience size needed (5% conv): 2,020
```

### Cost Structure for Community Business

```
Platform fees:                    $100-400/month
Community manager:                $2,000-5,000/month (part-time to full-time)
Tools (Zapier, design, etc.):     $100-300/month
Event platform:                   $0-100/month
Content creation:                 Your time or outsourced
Total operating cost:             $2,200-5,800/month
Break-even members at $30/month:  74-194 members
```


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Community Builder deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with community builder for a mid-size project."

**Output:** A complete community builder framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
