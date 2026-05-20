---
name: content-repurposing
description: |
  Creates a content repurposing map showing how to adapt one piece of source
  content across 5 or more formats and platforms. Use when the user wants to
  maximize the reach of existing content, create multi-platform distribution
  plans, or turn a blog post into social media posts, newsletters, and other
  formats. Do NOT use for writing original content (use `blog-post-writing`),
  editorial planning (use `editorial-calendar`), or content briefs (use
  `content-brief`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "content-marketing writing template"
  category: "writing"
  subcategory: "content-marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Content Repurposing

## When to Use

Use this skill when any of the following conditions apply:

- The user has a finished piece of content -- a blog post, long-form article, research report, webinar recording, podcast episode, conference talk, or case study -- and wants to extract maximum value from it across multiple formats or platforms
- The user explicitly asks for a "repurposing plan," "content distribution strategy," "how to get more mileage" from existing content, or wants to turn a single asset into a multi-platform campaign
- The user has a high-performing piece of existing content (high traffic, high engagement, or evergreen value) and wants to reach new audiences who consume different formats
- The user is resource-constrained (small team, limited budget) and needs to produce consistent content output without writing net-new pieces from scratch every week
- The user has a content archive of older posts, reports, or videos and wants to surface that material for a current audience who hasn't seen it
- The user wants to repurpose content produced by someone else in their organization -- a subject matter expert's webinar, a founder's talk, or a sales team's FAQ document -- into audience-facing content
- The user has identified a specific platform they want to grow (LinkedIn, YouTube Shorts, a newsletter) and wants to populate it with content derived from existing assets rather than commissioning entirely new work

**Do NOT use this skill when:**

- The user wants to write original content that doesn't yet exist -- use `blog-post-writing` instead
- The user wants to plan what topics to cover over the next quarter -- use `editorial-calendar` instead
- The user wants a structured brief before creating a new piece -- use `content-brief` instead
- The user wants to audit the quality, SEO performance, or gaps across their entire content library -- use `content-audit` instead
- The user asks you to "write a blog post inspired by" a competitor's article -- this is original content creation with research, not repurposing, and risks plagiarism; use `blog-post-writing` with a research brief
- The user wants to translate content into another language -- translation requires localization judgment, not repurposing logic; treat it as a separate task
- The source content is shorter than 400 words and contains only one discrete idea -- there is insufficient material to repurpose meaningfully; prompt the user to either expand the source first or use it as the hook for an original longform piece

---

## Process

### Step 1: Intake and Source Analysis

Before producing anything, gather complete information about the source content and the user's context. If the user has provided the actual content, read it carefully. If they have provided a URL or description, ask for the full text. Never attempt to repurpose from a title alone.

- Confirm the **source format**: written (blog post, report, case study, white paper, email), audio (podcast episode, recorded meeting), video (webinar, YouTube video, conference talk), or visual (slide deck, infographic)
- Ask for the **word count or duration** of the source. A 600-word post and a 6,000-word report have radically different repurposing potential
- Identify the **publication date** -- content published within the last 12 months should be repurposed with minimal updating; content older than 18-24 months needs a freshness audit before distribution
- Ask which **platforms the user actively publishes to** -- not where they have an account, but where they have posted in the last 60 days and have any existing audience. Repurposing to a dormant platform is not a strategy
- Ask for the **primary goal**: (a) reach new audiences who won't read the original, (b) drive traffic back to the source URL for SEO and conversion, (c) deepen authority on a topic by repeating the message across surfaces, or (d) fill a content calendar efficiently. The goal changes which derivatives to prioritize
- Ask for the **available production bandwidth** this week: under 2 hours, 2-4 hours, or a full day. This determines how many derivatives to map and whether to include format-heavy outputs like carousels or video scripts

### Step 2: Extract Repurposable Elements

Read the source content and systematically pull out every discrete, reusable unit. Think of this as decomposing the content into its atomic parts. Each element should be self-contained -- a reader who only encounters that element should get value without needing context.

- **Core thesis** (1 sentence): The single claim the entire piece argues or proves. Every derivative must be consistent with this thesis even when it doesn't state it explicitly
- **Data points and statistics**: Every specific number, percentage, study citation, or benchmark. These are the highest-value social media assets because they are shareable, memorable, and authority-building. A single strong stat can generate a standalone post on its own
- **Quotable sentences**: Phrases that are punchy, contrarian, or emotionally resonant. Look for sentences that could stand alone as pull quotes. These typically appear in the introduction, section headers, or conclusion. A good test: could this appear on a slide at a conference and make sense without context?
- **Frameworks and process steps**: Any numbered list, step-by-step process, or named model. These become carousel slides, Twitter/X threads, YouTube explainer structures, and newsletter breakdowns. A 5-step framework can generate an entire carousel on its own
- **Stories and case studies**: Named or unnamed examples, anecdotes, or before/after transformations. These are the foundation of short-form video scripts and story-format social posts
- **Questions and pain points**: Problems the content addresses. These become the hook for derivative posts -- "Are you doing X wrong?" or "Why most people fail at Y" style openers
- **Contrarian or surprising claims**: Any point in the source that challenges conventional wisdom. These generate the highest engagement on social platforms and make the strongest standalone posts
- **Conclusion and call-to-action**: The resolution of the argument. Often repurposed as a newsletter closing thought or a LinkedIn "thought for the week" post

Aim to extract at least 6-8 discrete elements from any piece 800+ words. A 3,000-word report should yield 12-15 elements.

### Step 3: Map Derivatives by Platform and Format

For each platform the user is active on, identify the 1-3 formats that will best carry the source material. Understand the content architecture of each platform before mapping:

**LinkedIn:**
- Text post (1,300-character sweet spot for organic reach; 3,000-character maximum)
- Newsletter article (600-2,000 words; appears in subscriber feeds separately from the main feed)
- Document/carousel (PDF upload; 10-18 slides optimal; native carousel format drives 3-5x more impressions than link posts on LinkedIn)
- Short-form video (under 3 minutes; native upload outperforms YouTube links significantly)
- Poll (4 answer options; drives comments when framed as a debate)

**Twitter/X:**
- Single tweet (280 characters; works best for standalone stats, contrarian claims, or questions)
- Thread (8-15 tweets; works best for frameworks, step-by-step processes, and case studies; the first tweet must standalone as a hook)
- Quote card (a visual tweet image; use for the strongest quotable sentence)

**Email newsletter:**
- Lead story (full adaptation of the source as the primary newsletter section; 300-600 words)
- Supporting section (brief callout of one element; 100-150 words; links to the original)
- Digest mention (one-liner with link; works when the newsletter is a curated roundup format)

**YouTube / video:**
- Long-form video (the source content as a scripted or outlined video; requires script adaptation, not just the transcript)
- YouTube Short / Reel / TikTok (60-90 seconds; one key insight or contrarian claim; hook in the first 3 seconds)
- Audiogram (extract a 60-second audio clip with captions and a static or animated background; works for podcast repurposing)

**Other surfaces:**
- Medium or Substack (full republication with a canonical tag pointing to the original, or a substantially adapted version for a different angle)
- Reddit or Quora (answer format; extract the most useful tactical section and write it as a direct answer to a question in relevant communities)
- Slide deck / presentation (convert a framework section into a downloadable template or resource)
- Pinterest (static infographic summarizing the framework or data points)

### Step 4: Score and Prioritize Derivatives

Not all derivatives are equal. Apply a priority score to each derivative before finalizing the map. Score each derivative on three dimensions (1-3 scale each):

- **Effort** (inverse -- lower effort scores higher): 1 = under 15 minutes, 2 = 15-60 minutes, 3 = 60+ minutes
- **Reach potential**: 1 = small niche audience, 2 = moderate, 3 = platform-native format with high organic distribution (carousels on LinkedIn, threads on X, Shorts on YouTube)
- **Goal alignment**: 1 = loosely related to stated goal, 2 = supports goal, 3 = directly serves primary goal

**Priority score = (Effort score + Reach score + Goal score).** Sort derivatives by total score descending. Those scoring 7-9 are "Tier 1" (produce first, produce fully). Those scoring 4-6 are "Tier 2" (produce if bandwidth allows). Those scoring 3 or below are "Tier 3" (log as future assets, do not prioritize now).

Limit the map to a maximum of 10 derivatives total. Presenting 15 options to a two-person team creates decision paralysis. Quality of execution on 5 well-chosen derivatives beats thin coverage across 12.

### Step 5: Build the Publication Timeline

Content repurposing is most effective when derivatives are staggered -- not clustered. A publication timeline prevents simultaneous cannibalization (posting the same core message on multiple platforms on the same day, which audiences in overlap will perceive as spam) and extends the content's active lifespan from one day to 3-5 weeks.

**Standard stagger model:**
- **Day 0-1:** Publish the source content (or confirm it is already live). Post one immediate quick-win derivative (a single-stat tweet, a one-paragraph LinkedIn text post) to capture momentum from fresh publication
- **Days 2-4:** Release the highest-reach social derivatives (thread on X, LinkedIn text post) while the source is still "new" and the algorithm still pushes it
- **Week 2:** Newsletter section (email audiences expect weekly or biweekly cadence; matching their expectation, not your publication date, matters more)
- **Week 2-3:** Format-heavy derivatives (carousel, video script, infographic) which take longer to produce and also hit a different audience segment
- **Week 3-4:** Long-form platform adaptations (LinkedIn article, Medium piece, YouTube script) -- these function as second publications of the material and should be far enough from the original to not feel redundant

**For evergreen content:** Consider a 90-day re-promotion cycle. Strong evergreen content can be repurposed again 6-12 months after the initial repurposing cycle, often with updated data or a "still true a year later" framing.

### Step 6: Build the Cross-Linking Architecture

Every derivative should participate in a traffic network that points back to the source and horizontally to other derivatives. This is not optional -- it is what transforms a collection of posts into a content ecosystem.

- **Social posts:** Place the link to the original in the first comment, not the post body. On LinkedIn and Twitter/X, posts with links in the body receive 30-50% less organic reach because the algorithm penalizes outbound links. Write the post to deliver standalone value, then add "Full piece in comments" as the closing line
- **Newsletter sections:** Link directly from the text to the original URL. Email is the one surface where outbound links are rewarded, not penalized -- the entire purpose of a newsletter is to send readers somewhere
- **Platform articles (LinkedIn, Medium):** Add a canonical reference line at the top: "This piece was adapted from [title] originally published on [domain]." At the bottom, link to 2-3 related pieces on the user's own site
- **Threads on X:** The final tweet in every thread should include the link and a clear CTA: "Full 1,500-word piece at [link] -- read it for [specific value the post didn't cover]"
- **Horizontal cross-linking:** When producing two derivatives on the same platform (e.g., two LinkedIn posts from the same source), space them at least 5-7 days apart and write them so each feels like a new standalone entry point, not a sequel that requires reading the first

### Step 7: Draft the Top-Priority Derivatives

Write complete, production-ready drafts for the top 3 scored derivatives -- not summaries or outlines. A draft means something the user could copy, paste, and post with minimal editing.

Apply platform-specific writing conventions to each draft:

- **LinkedIn posts:** Open with a hook that stands alone (the first 2 lines appear before "see more"). Use single-sentence paragraphs. End with a question that invites comments from the specific target audience. Do not use hashtags in the body -- place 2-3 at the end
- **Twitter/X threads:** The first tweet must deliver the core promise of the entire thread. Number tweets explicitly (1/, 2/, etc.). Vary tweet length -- short punchy tweets after long explanatory ones. The penultimate tweet is often the strongest -- use it for the most memorable line
- **Newsletter sections:** Write in the author's voice, not generic marketing copy. Include a personal framing sentence that connects the content topic to something the reader is experiencing. Lead with the most actionable element, not the most interesting to the writer
- **Carousels:** Slide 1 = hook (bold claim or question). Slides 2-N = one idea per slide, max 40 words per slide. Final slide = CTA + visual identity element. Never put a wall of text on a carousel slide
- **YouTube Shorts / Reels scripts:** Structure as hook (0-3 sec) + payoff (3-50 sec) + CTA (last 5 sec). Write the script for spoken delivery, not reading -- contractions, short sentences, direct address

---

## Output Format

```
## Content Repurposing Map

**Source:** [Title] -- [Format] -- [Word count or duration] -- [Publication date]
**Core Thesis:** [One sentence capturing the central argument, finding, or insight]
**Goal:** [User's stated primary goal: new reach / traffic / authority / calendar efficiency]
**Available Bandwidth:** [Time available this week for production]

---

### Repurposable Elements

| # | Element Type | Content | Derivative Potential |
|---|-------------|---------|---------------------|
| 1 | Core data point | [Specific stat or finding] | Tweet, newsletter callout, carousel stat slide |
| 2 | Framework/process | [Named model or step list] | Carousel, thread, newsletter breakdown |
| 3 | Contrarian claim | [Specific counterintuitive statement] | LinkedIn post, thread hook |
| 4 | Story/case study | [Specific example with outcome] | LinkedIn post, video hook |
| 5 | Quotable sentence | [Verbatim pull quote from source] | Quote card, tweet, newsletter opener |
| 6 | Pain point/question | [Problem the content addresses] | Poll, thread opener, Reel hook |
| 7 | Conclusion/CTA | [Resolution of the argument] | Newsletter closer, final thread tweet |
| 8 | [Additional element if present] | [Content] | [Derivative potential] |

---

### Derivative Map

| Tier | # | Platform | Format | Source Elements | Est. Time | Priority Score |
|------|---|----------|--------|----------------|-----------|---------------|
| 1 | 1 | [platform] | [format] | Elements [N, N] | [time] | [score/9] |
| 1 | 2 | [platform] | [format] | Elements [N, N] | [time] | [score/9] |
| 1 | 3 | [platform] | [format] | Elements [N, N] | [time] | [score/9] |
| 2 | 4 | [platform] | [format] | Elements [N] | [time] | [score/9] |
| 2 | 5 | [platform] | [format] | Elements [N, N] | [time] | [score/9] |
| 2 | 6 | [platform] | [format] | Elements [N] | [time] | [score/9] |
| 3 | 7 | [platform] | [format] | Elements [N] | [time] | [score/9] |

---

### Publication Timeline

| Date | Derivative | Platform | Key Adaptation Note |
|------|-----------|----------|-------------------|
| Day 0 | Source published / confirmed live | [original URL or channel] | Share link internally |
| Day 1 | Derivative #[N] | [platform] | [Specific note on hook or CTA] |
| Day 2-3 | Derivative #[N] | [platform] | [Specific timing or production note] |
| Day 4-5 | Derivative #[N] | [platform] | [Spacing note] |
| Week 2, [day] | Derivative #[N] | [platform] | [Newsletter cadence note] |
| Week 2-3 | Derivative #[N] | [platform] | [Production note] |
| Week 3-4 | Derivative #[N] | [platform] | [Platform article or video note] |

---

### Cross-Linking Architecture

**Source URL:** [Where the original lives]
- [Platform A] posts: [Specific instruction -- link in first comment, CTA wording]
- [Platform B] newsletter: [Specific instruction -- inline link, where to place it]
- [Platform C] article: [Canonical reference language]
- Horizontal links: [Which derivatives reference each other, and how]

**Re-promotion window:** [Date when this content should be re-evaluated for a second repurposing cycle]

---

### Drafted Derivatives

---

**Derivative 1: [Platform] -- [Format] (Tier 1, Priority Score: [N])**
*Source elements used: [list]*
*Adaptation notes: [what changed from source, what platform conventions applied]*

[Full production-ready draft]

---

**Derivative 2: [Platform] -- [Format] (Tier 1, Priority Score: [N])**
*Source elements used: [list]*
*Adaptation notes: [what changed from source, what platform conventions applied]*

[Full production-ready draft]

---

**Derivative 3: [Platform] -- [Format] (Tier 1, Priority Score: [N])**
*Source elements used: [list]*
*Adaptation notes: [what changed from source, what platform conventions applied]*

[Full production-ready draft]

---

### Tier 2 & 3 Briefs (Summary Only)

**Derivative 4:** [One sentence description of what to create, which elements to use, and the hook]
**Derivative 5:** [One sentence description]
**Derivative 6:** [One sentence description]
**Derivative 7 (Tier 3 -- save for later):** [One sentence description with suggested timing]
```

---

## Rules

1. **Never copy source text verbatim into a derivative.** Repurposing is adaptation, not duplication. Every derivative must be rewritten for the platform's native conventions, the format's length constraints, and the audience's context at that moment. A reader who has already read the original should still feel the derivative adds something new -- a different angle, a tighter frame, or a cleaner takeaway.

2. **Never suggest a platform where the user has not posted in the last 60 days.** An inactive account has no algorithmic standing and no audience trust. Posting repurposed content to a dead account does not revive it -- it just disappears. If the user mentions a platform they want to grow but haven't posted to recently, acknowledge that growing it will require a separate channel-activation effort before repurposing pays off.

3. **Never publish the same core message to two platforms on the same day.** If a user has audience overlap between platforms (which is common -- LinkedIn and newsletter subscribers often overlap 20-40%), receiving the same insight twice in one day reads as spam. The minimum gap between same-message posts across platforms is 24-48 hours; 5-7 days is better for medium-effort derivatives.

4. **Never produce more than 10 derivatives per repurposing cycle.** A map with 15 items is a list of intentions, not a plan. The user cannot execute 15 derivatives in a reasonable window, and the dilution shows in quality. Prioritize ruthlessly and save the remaining elements in the Tier 3 section as future assets.

5. **Never produce a derivative that works only if the reader has seen the original.** Every piece must deliver standalone value. Test each draft: if you showed it to someone who had never heard of the source content, would it make sense? Would it be useful? If not, rewrite the derivative until it stands alone.

6. **Always adapt the opening line for platform context.** The hook that works on LinkedIn (a bold claim followed by a line break) is not the hook that works in a newsletter (a personal framing sentence) or a Twitter thread (a specific promise about what the thread will deliver). The source content's introduction is almost never the right opener for a derivative -- rewrite it every time.

7. **Always include creation time estimates and hold them to realistic standards.** A LinkedIn carousel does not take 10 minutes -- designing 12 slides with consistent branding takes 45-90 minutes minimum even with templates. Accurate time estimates let the user plan production honestly. Underestimating effort is the primary reason repurposing plans get abandoned.

8. **Always check whether data points and statistics in the source are still accurate before repurposing.** Sharing an outdated stat -- especially one that has since been revised or contradicted -- is a credibility risk. For any content older than 18 months, verify the source of each quantitative claim before writing it into a derivative.

9. **Always write the three Tier 1 derivatives to production-ready quality.** A draft means the user could post it today with only light editing for personal voice. Do not produce outlines, bullet structures, or summaries labeled as drafts. The entire value of this skill is saving the user production time -- that value disappears if you hand them an outline they still have to write.

10. **Never recommend a format that the user's existing audience has not demonstrated appetite for.** If a user says "I have 400 LinkedIn followers and have only posted text updates," recommending a LinkedIn video as a Tier 1 priority is bad advice -- it requires production infrastructure and audience training the user hasn't built. Match derivative formats to the user's demonstrated publishing history, then suggest one stretch format as a Tier 2 experiment.

11. **Always structure the publication timeline around the audience's consumption habits, not the content's creation order.** Newsletter sections go on the newsletter's send day, not the day you finish writing them. Thread timing on X matters -- posts published between 8-10 AM on Tuesday through Thursday typically see 30-40% higher engagement than weekend posts for B2B content. Incorporate these conventions into your timeline recommendations.

12. **Never treat a repurposing plan as permanent.** The Tier 2 and Tier 3 derivatives are a backlog, not a commitment. After the Tier 1 derivatives are published, the user should review performance data (engagement rate, click-through, newsletter open rate lift) before producing Tier 2 content. If Derivative 1 flopped, the others from the same source may need reframing before they are worth producing.

---

## Edge Cases

**The source content is a short-form post (under 400 words) with a single idea.**
Do not attempt to extract 8 elements from thin material -- you will produce derivative content that is hollow. Instead, treat the short post as a thesis statement and build upward. Map the short post to longer-form derivatives: a blog post that fully develops the argument, a newsletter section that adds a personal case study, a thread that walks through implications. In this case, you are doing content expansion, not compression. Clearly label this in the map and explain to the user that the most valuable output is a longform piece that gives the short post proper depth.

**The source content is a video or podcast episode (no transcript provided).**
Ask the user to provide either a transcript or detailed show notes before proceeding. Without text, you are guessing at the repurposable elements. If the user cannot provide a transcript, ask them to identify: (a) the 3 main points covered, (b) any specific data or examples mentioned, (c) the most memorable 1-2 minutes of the episode. Work from those raw materials. For video-native repurposing, add clip selection as an explicit derivative -- identifying the 60-90 second segment that stands alone as a Short or Reel is itself a high-value output.

**The source content addresses a topic that has evolved significantly since publication.**
Flag this explicitly at the top of the repurposing map. Do not repurpose outdated claims without a correction layer. For each derivative, add an "update note" that specifies what the user should add, change, or caveat before publishing. The most effective framing for repurposing aging content is the "what has changed" angle: "I wrote this two years ago, and most of it still applies. Here is the one thing I got wrong." This is itself a high-engagement hook on LinkedIn and in newsletters.

**The user is active on only one platform.**
Do not artificially expand to platforms they don't use. Instead, map format variation within that single platform. On LinkedIn alone, a 1,500-word blog post can generate: a text post (hook + 3 key points), a document carousel (visual framework), a newsletter article (adapted longform version), a poll (testing a claim from the post), and a comment-seeding thread (ask a question from the post in a high-traffic comment section). On Twitter/X: a single stat tweet, a thread, a quote card image, and a reply to a relevant conversation using an insight from the source. Depth on one platform beats thin presence across five.

**The user wants to repurpose a piece they didn't write -- a guest article, a quoted interview, or a team member's content.**
Confirm two things before proceeding: (a) does the user have rights or permission to repurpose the content? For a guest post they wrote for another site, they typically retain repurposing rights but should check the publication's terms. For a piece written about them, they can quote and reference but not reproduce. (b) Is the author (if different from the user) credited in the derivatives? Establish attribution conventions in the cross-linking architecture section.

**The user has multiple high-performing pieces and wants a batch repurposing plan.**
Do not try to map all pieces simultaneously in one output -- this produces a confusing, unwieldy document. Instead, ask the user to rank the pieces by repurposing priority (highest traffic, most evergreen, most relevant to a current campaign goal) and run this skill sequentially for each piece, one at a time. Note that when running multiple repurposing cycles in sequence, you should space the publication timelines to avoid cannibalization -- if two source pieces have overlapping themes, their derivatives should not run in the same week.

**The user's source content contains confidential data, unpublished research, or client-specific information.**
Flag any element that appears to be non-public before including it in derivatives. Ask the user to confirm that each data point, case study, and client reference has clearance for public distribution. Derivatives that include identifying information about clients without consent are a legal and reputational liability. Suggest anonymization conventions: "a B2B SaaS client in the $5-20M ARR range" instead of the client's name.

**The source content is a slide deck or visual report without substantial written copy.**
Slide decks require reverse-engineering -- you must reconstruct the argument from the visual structure before you can repurpose it. Ask the user to walk through the deck's narrative arc: what is the opening problem, what is the proposed solution, what is the evidence, what is the conclusion? Then treat the reconstructed narrative as your source text and proceed normally. For the derivatives, note that a well-designed slide deck also generates infographic content and quote cards directly from its existing visual assets.

---

## Example

**Input from user:**
"I published a 2,200-word guide called 'How to Run Weekly Sprints for Content Teams' on my company blog three weeks ago. It performed well -- 1,400 views, shared in a few Slack communities. I'm active on LinkedIn (about 3,500 followers, mostly marketing directors and content leads), Twitter/X (950 followers, mostly agency folks), and I send a weekly email newsletter (2,100 subscribers, 42% open rate). I have about 3 hours this week to produce repurposed content. My main goal is to reach content managers who didn't see the original post."

---

**Output:**

## Content Repurposing Map

**Source:** "How to Run Weekly Sprints for Content Teams" -- Long-form guide -- 2,200 words -- Published 3 weeks ago (still recent; no freshness update required)
**Core Thesis:** Content teams produce better work with higher consistency when they adopt a structured weekly sprint model borrowed from product development, replacing ad-hoc publishing with predictable planning cycles.
**Goal:** Reach new audiences (content managers who missed the original); secondary goal is positioning the author as a systems thinker for content operations
**Available Bandwidth:** 3 hours this week

---

### Repurposable Elements

| # | Element Type | Content | Derivative Potential |
|---|-------------|---------|---------------------|
| 1 | Core data point | Content teams using sprint models publish 2.4x more consistently than teams running ad-hoc (cite internal data or reference source) | Tweet, newsletter callout, carousel stat slide, LinkedIn hook |
| 2 | Framework/process | The 5-step weekly sprint: Monday kick-off (30 min) → Tuesday draft → Wednesday edit → Thursday finalize + schedule → Friday retrospective (15 min) | Carousel, thread, newsletter breakdown, slide graphic |
| 3 | Contrarian claim | "A content calendar isn't a workflow. Most teams mistake planning for execution." | LinkedIn post opener, thread hook, newsletter pull quote |
| 4 | Story/case study | A 4-person content team that reduced missed deadlines from 40% to under 5% in 6 weeks after adopting sprints | LinkedIn post, Reel/Short hook, newsletter section |
| 5 | Quotable sentence | "Ad-hoc content doesn't underperform because the writers are bad. It underperforms because no one agreed on what 'done' means." | Quote card, Twitter single tweet, newsletter opener |
| 6 | Pain point/question | Why content managers feel like they are always behind even when working hard | Poll, thread opener, LinkedIn post hook |
| 7 | Checklist/template | The 5-question Friday retro checklist for content teams | LinkedIn document download, newsletter attachment, tweet with screenshot |
| 8 | Conclusion/reframe | Sprint methodology transfers from software because both disciplines share the same core tension: speed vs. quality vs. volume | Newsletter closer, final thread tweet, LinkedIn comment seed |

---

### Derivative Map

| Tier | # | Platform | Format | Source Elements | Est. Time | Priority Score |
|------|---|----------|--------|----------------|-----------|---------------|
| 1 | 1 | LinkedIn | Text post (contrarian hook) | Elements 3, 6, 4 | 15 min | 8/9 |
| 1 | 2 | Twitter/X | Thread (8 tweets) | Elements 2, 1, 5, 7 | 30 min | 8/9 |
| 1 | 3 | Email newsletter | Lead section (framework breakdown) | Elements 2, 7, 8 | 45 min | 7/9 |
| 2 | 4 | LinkedIn | Document carousel (sprint framework) | Element 2 | 60 min | 6/9 |
| 2 | 5 | LinkedIn | Text post (case study angle) | Element 4 | 15 min | 6/9 |
| 2 | 6 | Twitter/X | Single tweet (stat) | Element 1 | 5 min | 5/9 |
| 3 | 7 | LinkedIn | Newsletter article (full adaptation) | Elements 1-8 | 90 min | 4/9 |

**Total estimated production time for Tier 1:** ~90 minutes (within the 3-hour bandwidth)
**Tier 2 total if bandwidth extends:** additional 80 minutes

---

### Publication Timeline

| Date | Derivative | Platform | Key Adaptation Note |
|------|-----------|----------|-------------------|
| Day 1 (today) | Derivative #1 -- LinkedIn contrarian post | LinkedIn | Post between 8-10 AM Tuesday; link to blog in first comment |
| Day 2 | Derivative #2 -- Twitter thread | Twitter/X | Post 8 AM Wednesday; link to blog in final tweet |
| Day 5 | Derivative #6 -- single stat tweet | Twitter/X | Quick mid-week reinforcement; no link needed, standalone value |
| Week 2, send day | Derivative #3 -- newsletter section | Email | Run as the lead section of the regular newsletter; include the retro checklist as inline text |
| Week 2, Day 9-10 | Derivative #5 -- LinkedIn case study post | LinkedIn | Space 7+ days from Derivative #1; different angle (evidence vs. argument) |
| Week 3, Day 15-18 | Derivative #4 -- LinkedIn carousel | LinkedIn | Requires design production; schedule after the text posts have seeded the topic |
| Week 4+ | Derivative #7 -- LinkedIn newsletter article | LinkedIn | Tier 3; produce when next sprint of bandwidth opens |

**Re-promotion window:** Revisit this content in 5 months. At the 6-month mark, run a "what I learned after 6 months of sprint-based content" follow-up post that references the original guide.

---

### Cross-Linking Architecture

**Source URL:** [blog URL for the original guide]

- **LinkedIn posts (Derivatives 1 and 5):** Write for standalone value; final line reads "Full workflow guide in the comments" -- place the blog link as the first comment immediately after posting
- **Twitter thread (Derivative 2):** Final tweet (tweet 8) reads: "I wrote a full 2,200-word guide on this including the retro checklist and a sprint template. Link in the reply below." Post the link as an immediate reply to the thread, not in the thread body
- **Single stat tweet (Derivative 6):** Standalone -- no link. If it gets traction, reply to it the next day with "Full breakdown here: [link]"
- **Newsletter (Derivative 3):** Link inline from the framework section ("I broke down each stage in detail in the full guide here: [link]") and again in the CTA at the section's end
- **LinkedIn carousel (Derivative 4):** Final slide reads "Full guide + retro template: [URL] -- see first comment." Place link in the post copy's first comment
- **Horizontal links:** The newsletter section (Derivative 3) references "the LinkedIn thread from earlier this week" to reward cross-platform readers and signal that there is a larger conversation happening

---

### Drafted Derivatives

---

**Derivative 1: LinkedIn -- Text Post (Tier 1, Priority Score: 8/9)**
*Source elements used: Elements 3 (contrarian claim), 6 (pain point), 4 (case study outcome)*
*Adaptation notes: Opens with the contrarian claim as a hook; single-sentence paragraphs for LinkedIn readability; ends with a question targeting content managers specifically; no link in body*

---

A content calendar is not a workflow.

Most content teams have a calendar full of topics and a Slack full of stress.

They have planning. They don't have a system for execution.

The result: missed deadlines, reactive publishing, and a constant feeling of being behind even when everyone is technically working hard.

The fix is not a better calendar. It is a sprint.

Weekly sprints -- borrowed from product teams -- give content work a structure that calendars can't:

A defined scope for the week.
A clear definition of "done" for each piece.
A 15-minute Friday retro that catches problems before they compound.

One team I worked with was missing 40% of their self-imposed deadlines. Not because the writers were slow -- because no one had agreed on what "ready to publish" meant.

Six weeks after adopting a sprint model: under 5% missed.

Same team. Same workload. Different system.

If you manage a content team and your biggest problem is inconsistency -- I'd ask you one question before suggesting any tool or hire:

Do you have a weekly workflow, or just a weekly wish list?

(Full sprint framework in the comments for anyone who wants the specifics.)

#ContentStrategy #ContentOperations #ContentMarketing

---

**Derivative 2: Twitter/X -- Thread (8 Tweets) (Tier 1, Priority Score: 8/9)**
*Source elements used: Elements 2 (5-step sprint), 1 (data point), 5 (quotable), 7 (retro checklist)*
*Adaptation notes: First tweet delivers the complete core promise independently; numbered explicitly; alternates short punchy tweets with explanatory ones; link to source held for reply after posting*

---

1/ Most content teams are behind because they have a calendar, not a system.

Weekly sprints fix this. Here is the full framework in 8 tweets.

2/ The problem: content work is treated like a to-do list.

Tasks get added. Priorities shift. "We'll publish it when it's ready" is not a workflow -- it is a delay with good intentions.

3/ The sprint model gives content teams what product teams have had for years:

A fixed weekly scope.
A clear definition of done.
A built-in feedback loop.

Result: teams that use it publish 2.4x more consistently than those running ad-hoc.

4/ Here is the 5-day sprint structure:

Monday: 30-min kick-off. Set the week's scope. Assign owners. Confirm what "ready" looks like for each piece.

Tuesday: Draft day. Heads-down. No review meetings.

Wednesday: Edit and feedback cycle.

Thursday: Finalize + schedule everything.

Friday: 15-min retro. One question: what slowed us down this week?

5/ The Monday kick-off is the most skipped step.

It feels unnecessary. "We already know what we're working on."

But without it, every day becomes a negotiation. The kick-off makes the week's decisions once, in 30 minutes, instead of continuously through Slack.

6/ The Friday retro is the highest-leverage 15 minutes in your week.

Not a status meeting. Five questions, answered async or live:

Did we hit scope?
What got stuck in review?
What took longer than expected?
What are we carrying forward?
What do we change next week?

7/ "Ad-hoc content doesn't underperform because the writers are bad. It underperforms because no one agreed on what done means."

The sprint's definition-of-done is the single biggest unlock. Write it explicitly, per content type, before the week starts.

8/ I wrote a full guide on this: the 5-step sprint model, the retro checklist template, and how to run the Monday kick-off for a team of 2 vs. a team of 10.

Link in the reply below.

---

**Derivative 3: Email Newsletter -- Lead Section (Tier 1, Priority Score: 7/9)**
*Source elements used: Elements 2 (framework), 7 (retro checklist), 8 (conclusion/reframe)*
*Adaptation notes: Opens with a personal framing sentence, not the contrarian hook (newsletter readers expect a warmer tone); framework is presented as directly usable guidance; retro checklist included inline so the section is fully self-contained; link to full guide at the end for those who want depth*

---

**This week: a weekly sprint framework for content teams**

Here is a pattern I keep seeing with content teams that run consistently well: they treat their work like a product sprint, not a to-do list.

It sounds like a small distinction. It isn't.

A to-do list grows until it is unmanageable. A sprint has a scope, a defined "done," and a built-in review cycle that catches problems before they compound. The teams running the most consistent editorial operations -- the ones who publish what they said they'd publish, when they said they'd publish it -- have almost all landed on some version of the same weekly rhythm.

Here is the structure, simplified:

**The 5-Day Content Sprint**

**Monday -- Kick-off (30 minutes):**
Define the week's scope. What is getting published, in what state, by what day? Assign ownership for every piece. If you can't answer those three questions in 30 minutes, you don't have a workflow yet.

**Tuesday -- Draft day:**
No review meetings. No feedback requests. Writing time, protected.

**Wednesday -- Edit and feedback cycle:**
All review and revision happens today. This prevents the "can you take a look?" interruptions that fragment Tuesday's focus.

**Thursday -- Finalize and schedule:**
Every piece that is ready goes into the queue. Everything that isn't ready gets a decision: delay or drop?

**Friday -- Retro (15 minutes):**
Five questions, answered honestly:
1. Did we hit our scope?
2. What got stuck in review, and why?
3. What took longer than estimated?
4. What are we carrying into next week?
5. What is one thing we change next Monday?

That last question is the unlock. Most retros are postmortems. This one is a system adjustment. You are not looking for blame -- you are looking for the one constraint to remove before the next sprint starts.

If your team is missing deadlines, publishing inconsistently, or always feeling behind despite genuine effort, the problem is almost certainly not the people -- it is the absence of a shared definition of what "done" looks like for each piece in each week.

The sprint gives you that definition. Run it for four weeks and see what changes.

Full guide -- including how to adapt this for a 2-person team vs. a team of 8 -- is here: [link to blog post]

---

### Tier 2 & 3 Briefs (Summary Only)

**Derivative 4 (LinkedIn Carousel):** Design a 12-slide document carousel walking through the 5-day sprint model -- one slide per day (slides 2-6), with Slide 1 as the hook ("Your content team is behind. Here is the weekly system that fixes it."), Slide 7 covering the retro checklist questions, and Slide 12 as a CTA pointing to the full guide. Use Element 2 as the structural backbone. Estimated production time: 60 minutes with a Canva template.

**Derivative 5 (LinkedIn Case Study Post):** Write a 200-word LinkedIn text post opening with the specific outcome from Element 4 ("One content team reduced missed deadlines from 40% to under 5% in six weeks") and walking backwards to the cause (no shared definition of done, no weekly review cycle). End with the question: "What's your current deadline miss rate, and what's causing it?" -- this drives comments from content managers who are experiencing the problem.

**Derivative 6 (Twitter/X single stat tweet):** "Content teams with weekly sprint models publish 2.4x more consistently than teams running ad-hoc. Same writers. Same workload. Different system." Post standalone with no link. If it generates replies or significant engagement, reply 24 hours later with "Full breakdown in this thread:" and link to Derivative 2.

**Derivative 7 (LinkedIn Newsletter Article -- Tier 3, produce in 4+ weeks):** Write a full LinkedIn newsletter article (800-1,200 words) adapting the source guide for a LinkedIn-native readership. The angle should shift slightly from "how to implement sprints" to "why content leaders resist sprint models (and why they're wrong)" -- a perspective-led framing that works better for LinkedIn's editorial format than the how-to angle of the original. Include a canonical reference: "Adapted from my original guide at [URL]." This derivative targets a different entry point to the same audience and gives the topic a second life on a separate platform algorithm.
