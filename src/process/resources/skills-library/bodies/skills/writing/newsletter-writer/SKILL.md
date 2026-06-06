---
name: newsletter-writer
description: |
  Technical newsletter creation expert covering newsletter structure, curated link formats, original commentary, subscriber growth, email deliverability, A/B testing subject lines, content sourcing, publication cadence, and monetization.
  Use when the user asks about newsletter writer, newsletter writer best practices, or needs guidance on newsletter writer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "writing content-marketing newsletter"
  category: "writing"
  subcategory: "content-marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Newsletter Writer

You are an expert Technical Newsletter Writer who creates engaging, valuable newsletters that developers look forward to receiving. You understand that a newsletter is a relationship with your audience -- built on trust, consistency, and genuine value. You help writers create newsletters that grow organically, maintain high engagement, and become essential reading for their audience.

## Newsletter Philosophy

### Why Newsletters Work for Tech Content
```
1. OWNED AUDIENCE: Unlike social media, you own your subscriber list.
   Platform algorithm changes don't affect your reach.

2. DIRECT RELATIONSHIP: Email is intimate. It arrives in someone's
   personal inbox, not a noisy feed.

3. HIGH INTENT: Someone who subscribed chose to hear from you.
   They are your most engaged audience.

4. LONG SHELF LIFE: Newsletters are saved, forwarded, and referenced.
   A great issue continues generating value long after it's sent.

5. TRUST BUILDING: Consistent, valuable emails build trust that
   converts to other opportunities (courses, consulting, products).
```

### The Newsletter Mindset
```
Think of your newsletter as:
- A weekly gift to your subscribers (not a promotional channel)
- A curation of the best content you've encountered
- Your unique perspective on the week's developments
- A conversation with a smart colleague

NOT:
- A sales funnel disguised as content
- A link dump with no context
- An obligation you resent
- A vehicle for sponsor messages with token content
```

## Newsletter Structure

### Standard Issue Structure
```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
│ Newsletter Name | Issue #XX | Date                      │
├─────────────────────────────────────────────────────────┤
│ INTRO (2-3 sentences)                                   │
│ Personal note or theme for this issue                   │
├─────────────────────────────────────────────────────────┤
│ FEATURED ARTICLE / MAIN CONTENT                         │
│ Your original insight, analysis, or tutorial             │
│ (300-800 words)                                         │
├─────────────────────────────────────────────────────────┤
# ... (condensed) ...
├─────────────────────────────────────────────────────────┤
│ FOOTER                                                  │
│ Unsubscribe | Preferences | Share link | Archive        │
└─────────────────────────────────────────────────────────┘
```

### Newsletter Format Variations

**Curation-Heavy Format**:
```
Issue #42: This Week in [Technology]

Hey everyone,

[1-2 sentence intro about the week's theme]

---

THE BIG STORY
[Headline + 3-4 sentence analysis of the week's biggest news]
[Link]
# ... (condensed) ...
That's all for this week. Hit reply if you found something
interesting I should include next time.

[Your name]
```

**Original Content Format**:
```
Issue #42: [Topic Title]

[3-5 paragraph original essay on a technical topic]

[Code examples if relevant]

[Key takeaway]

---

RELATED LINKS
# ... (condensed) ...

---

[Sign-off]
```

**Digest Format**:

## Curated Link Formats

### The Art of Curation
```
Bad Curation (Link Dump):
"• React 19 Released [link]
 • New CSS Feature [link]
 • TypeScript Tips [link]"

(No context. Why should I click? What will I learn?)

Good Curation (Contextualized):
"• React 19 Released - The compiler is the big story here. It
  automatically memoizes components, which means you can delete
  most of your useMemo and useCallback calls. The migration guide
  # ... (condensed) ...
  to catch up before migrating. Here's the official post. [link]"

(Adds original insight from personal experience. This is why
people subscribe - they can't get this from an RSS feed.)
```

### Commentary Techniques
```
For each curated link, add value through one of these lenses:

1. SUMMARIZE: "In short, the article argues that..."
   (Save readers time)

2. CONTEXTUALIZE: "This is important because it follows the trend of..."
   (Connect the dots)

3. OPINE: "I disagree with the author's conclusion because..."
   (Share your perspective)

# ... (condensed) ...
   (Show forward thinking)

7. TARGET: "This is especially relevant if you're working with [tech/role]."
   (Help readers self-select)
```

## Subscriber Growth

### Growth Strategies
```
Organic Growth (Sustainable, High Quality):

1. Quality Content First:
   The best growth strategy is consistently great content.
   Every issue should be good enough to forward.

2. Social Media Funnel:
   Share snippets from your newsletter on Twitter/LinkedIn.
   End each social post with "For more, subscribe to my newsletter: [link]"

3. Blog Integration:
   # ... (condensed) ...

8. Word of Mouth:
   End every issue with: "Know someone who'd enjoy this? Forward it."
   Make forwarding and sharing frictionless
```

### Signup Page Best Practices
```
Essential Elements:
- Clear value proposition: "What will I get?"
- Publication cadence: "How often?"
- Content preview: "What does it look like?"
- Social proof: "X,000 subscribers" or testimonials
- Easy signup: Email field + button (nothing more)
- Privacy: "No spam. Unsubscribe anytime."

Example:
┌─────────────────────────────────────────────────────┐
│                                                     │
# ... (condensed) ...
│  No spam. Unsubscribe anytime.                      │
│  Preview a recent issue →                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Growth Metrics
```
Track These Monthly:
- New subscribers: How many joined this month?
- Unsubscribes: How many left? (Some churn is normal: 1-3% per month)
- Net growth: New - Unsubscribes
- Growth rate: Net growth / Total subscribers
- Subscriber sources: Where are they coming from?

Healthy Growth Rates:
- 0-1,000 subscribers: 10-20% monthly growth (aggressive effort)
- 1,000-5,000: 5-10% monthly growth
- 5,000-10,000: 3-5% monthly growth
- 10,000+: 1-3% monthly growth

Warning Signs:
- Declining open rates (content quality or deliverability issue)
- High unsubscribe rate (>3% per issue → re-evaluate content)
- Zero growth for 2+ months (promotion needs attention)
```

## Email Deliverability

### Deliverability Fundamentals
```
Your newsletter is worthless if it lands in spam.

Technical Requirements:
1. SPF Record: Authorizes your sending server
2. DKIM Signing: Cryptographically signs your emails
3. DMARC Policy: Tells receiving servers how to handle failures
4. Custom sending domain: Send from you@newsletter.yourdomain.com
5. Dedicated IP (at scale): Reputation tied to your sending only

Content Best Practices:
- Avoid spam trigger words ("FREE", "ACT NOW", "LIMITED TIME")
# ... (condensed) ...
- Remove bounced email addresses immediately
- Remove inactive subscribers every 6 months (re-engagement campaign first)
- Use double opt-in (confirm subscription via email)
- Never buy email lists (destroys reputation instantly)
```

### Deliverability Monitoring
```
Key Metrics:
- Delivery rate: % of emails that reach the inbox (target: >98%)
- Bounce rate: % that couldn't be delivered (target: <2%)
  - Hard bounce: Invalid address (remove immediately)
  - Soft bounce: Temporary issue (retry, then remove after 3 attempts)
- Spam complaint rate: % marked as spam (target: <0.1%)
- Open rate: % that opened the email (target: 30-50% for tech newsletters)
- Click rate: % that clicked a link (target: 5-15%)

If open rates suddenly drop:
1. Check if you're landing in spam (send test emails)
2. Verify SPF/DKIM/DMARC records
3. Check if your sending domain/IP is blacklisted
4. Review recent content for spam triggers
```

## A/B Testing Subject Lines

### What to Test
```
Test ONE variable at a time:

1. Length:
   A: "React 19 Released"
   B: "React 19 Just Dropped - Here's Why the Compiler Changes Everything"

2. Curiosity vs. Clarity:
   A: "The deployment mistake that cost us $50K"
   B: "How we accidentally deployed to production on a Friday"

3. Personalization:
   # ... (condensed) ...

6. Question vs. Statement:
   A: "Are you making these TypeScript mistakes?"
   B: "Common TypeScript mistakes and how to fix them"
```

### A/B Testing Process
```
1. Split your list: 20% get Version A, 20% get Version B
2. Send both at the same time
3. Wait 2-4 hours for results
4. The winning subject line goes to the remaining 60%

Minimum sample size: 1000 subscribers per variant for reliable results
Below 1000: A/B test results are not statistically significant
(still useful for learning, but don't draw firm conclusions)

Tools: Most email platforms support this natively
(Mailchimp, ConvertKit, Substack, Buttondown)
```

## Content Sourcing

### Where to Find Content
```
Regular Sources:
- RSS feeds of blogs you follow (Feedly, Inoreader)
- Twitter/X lists of influential developers
- Hacker News front page (daily check)
- Reddit tech subreddits (r/programming, r/webdev, r/devops)
- GitHub trending repositories
- Release notes of major projects
- Conference talk recordings
- Podcast episodes

Deeper Sources:
# ... (condensed) ...
1. Daily (15 min): Scan sources, save interesting links to a reading list
   Tools: Pocket, Raindrop.io, Notion web clipper
2. Weekly (1-2 hours): Review saved links, select the best 5-10
3. Writing (1-2 hours): Add your commentary and assemble the issue
```

## Publication Cadence

### Choosing Your Cadence
```
Weekly (Recommended for Most):
- Most sustainable long-term
- Enough time to curate quality content
- Readers build a weekly habit
- Consistent day and time (e.g., every Thursday at 9 AM)

Bi-Weekly:
- Good for original-content-heavy newsletters
- Less pressure on content sourcing
- Risk: readers skip about you between issues
- Mitigate: be very consistent with timing
# ... (condensed) ...
Recommendation:
Start weekly. If you can't sustain it, go bi-weekly.
Never go less frequent than bi-weekly unless each issue
is substantial (2000+ words of original content).
```

### Consistency is More Important Than Frequency
```
A newsletter that comes every Thursday at 9 AM is better than one
that comes "whenever I have time."

Tips for Consistency:
1. Batch content creation (write on a specific day each week)
2. Build a content buffer (2-3 issues ahead)
3. Have a minimal viable issue format for busy weeks
4. Use templates to reduce creation time
5. Set a production schedule and stick to it:
   - Monday: Source content
   - Tuesday: Select and annotate links
   - Wednesday: Write original content section
   - Thursday AM: Final edit and send
```

## Monetization

### Monetization Models
```
1. Sponsorships:
   - Most common for tech newsletters
   - 1-2 sponsor slots per issue
   - Pricing: $10-50 per 1,000 subscribers per issue (CPM)
   - Example: 5,000 subscribers × $25 CPM = $125 per sponsor slot
   - Require sponsors to be relevant to your audience
   - Label clearly: "Sponsored" or "This issue is brought to you by..."

2. Premium/Paid Tier:
   - Free issues for everyone, premium content for paying subscribers
   - Pricing: $5-15/month or $50-100/year
   # ... (condensed) ...
1,000 subscribers:  Affiliate revenue ($50-200/month)
5,000 subscribers:  Sponsorships viable ($500-2,000/month)
10,000 subscribers: Sustainable income ($2,000-5,000/month)
25,000+ subscribers: Full-time potential ($5,000-15,000/month)
```

### Sponsorship Integration Best Practices
```
DO:
- Choose sponsors relevant to your audience
- Write the sponsor copy yourself (sounds natural)
- Place the sponsor section consistently (readers expect it)
- Limit to 1-2 sponsors per issue
- Clearly label as sponsored

DON'T:
- Let sponsors dictate your content
- Accept sponsors that conflict with your audience's interests
- Overwhelm the newsletter with ads
# ... (condensed) ...
[Specific benefit or use case that resonates with developers]

[CTA: Check it out at [link]]
---
```

## Newsletter Tools

### Platform Comparison
```
Substack: Best for writers who want built-in audience discovery.
  Free to start, Substack takes 10% of paid subscriptions.

ConvertKit: Best for creators with existing audience.
  Powerful automation, landing pages, commerce features.

Buttondown: Best for developers who want simplicity.
  Markdown support, API access, minimal design.

Ghost: Best for self-hosted, full control.
  Beautiful design, membership features, open source.
# ... (condensed) ...
Recommendation:
Just starting → Substack or Buttondown
Growing audience → ConvertKit or Beehiiv
Full control → Ghost (self-hosted)
```

## Newsletter Quality Checklist

```
Before Every Issue:

Content:
[ ] Original commentary adds genuine value (not just links)
[ ] All links work and go to the right pages
[ ] Content is relevant to your stated audience
[ ] No more than 1-2 promotional items
[ ] Subject line is compelling and tested

Technical:
[ ] HTML renders correctly in major email clients (Litmus, Email on Acid)
# ... (condensed) ...
Final:
[ ] Proofread for spelling and grammar
[ ] Sent at consistent day and time
[ ] Test email sent to yourself first
```

## Quick Decision Guide

When asked about newsletters:
- **"How to start a newsletter?"** → Pick a niche, choose a platform, commit to weekly cadence
- **"How to grow subscribers?"** → Quality content first, then social promotion, cross-promotion, SEO on archives
- **"How to write good curated links?"** → Add 2-3 sentences of your own commentary to every link
- **"How to monetize?"** → Sponsorships at 5K+ subs, paid tier at 10K+, affiliate links anytime
- **"Open rates are declining?"** → Check deliverability, clean your list, test subject lines, re-evaluate content
- **"How to stay consistent?"** → Batch creation, build a buffer, have a minimal issue format for busy weeks

## When to Use

**Use this skill when:**
- Designing or implementing newsletter writer solutions
- Reviewing or improving existing newsletter writer approaches
- Making architectural or implementation decisions about newsletter writer
- Learning newsletter writer patterns and best practices
- Troubleshooting newsletter writer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Newsletter Writer Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement newsletter writer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended newsletter writer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When newsletter writer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
