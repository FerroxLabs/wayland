---
name: blog-post-writing
description: |
  Writes complete blog posts with title, introduction hook, H2-structured body
  sections, and a closing call-to-action. Use when the user asks to write a blog
  post, draft a blog article, create website content, or compose an online article.
  Do NOT use for SEO-optimized posts (use `seo-blog-post`), listicles (use
  `listicle-writing`), how-to tutorials (use `how-to-guide`), or opinion/editorial
  pieces (use `opinion-piece`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "blog-post writing content-marketing"
  category: "writing"
  subcategory: "content-marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Blog Post Writing

## When to Use

Use this skill when the user's request matches one of these specific scenarios:

- User asks to write a blog post, blog article, or blog entry on a specific topic -- regardless of industry, from B2B SaaS to gardening
- User wants to create a content piece for their company blog, personal blog, or editorial section of a website where the primary format is prose-driven sections (not a list, not a tutorial)
- User has a topic and wants a complete, publication-ready draft with title, introduction, body, and conclusion
- User wants to convert existing notes, a talk transcript, or a raw outline into a polished blog post
- User wants a thought leadership piece, an industry commentary post, or an educational explainer post that stops short of pure opinion or heavy SEO optimization
- User asks for help drafting a "blog article" or "web article" for an audience that will consume it on screen, not in print

**Do NOT use when:**

- User explicitly asks for SEO keyword targeting, meta descriptions, or keyword density optimization -- use `seo-blog-post` instead
- User wants a numbered list as the primary structural format ("10 reasons...", "7 tools...") -- use `listicle-writing` instead
- User wants step-by-step instructions for completing a task or procedure -- use `how-to-guide` instead
- User wants to argue a position, make a case, or publish an op-ed -- use `opinion-piece` instead
- User wants a 2,000+ word deep dive with headers, sub-headers, FAQ sections, and table of contents -- use `long-form-article` instead
- User wants a press release, product announcement, or corporate communications piece -- use `press-release` instead
- User wants a newsletter email, not a website post -- use `email-newsletter` instead

---

## Process

### 1. Gather Context Before Writing a Single Word

Collect these inputs before generating any content. If the user is chatting interactively, ask. If the user's request already contains this information, extract it and confirm silently:

- **Topic or angle** -- not just a subject ("remote work") but a specific angle or argument ("why remote work increases individual productivity but harms team cohesion"). If the user gives only a subject, propose three specific angles and ask which direction resonates.
- **Target audience** -- who will read this, their expertise level with the topic, and what they care about. "Small business owners" is vague; "small business owners who sell products online and are trying to compete with Amazon on customer experience" is usable.
- **Post goal** -- map to one of four functions: inform (teach something), build trust (demonstrate expertise without selling), generate leads (drive a conversion action), or spark conversation (prompt shares and comments). The goal shapes every structural decision.
- **Desired word count** -- default to 800-1,000 words for general blog posts. Shorter posts (500-700 words) suit topic updates and announcements; longer posts (1,100-1,400 words) suit evergreen educational topics. Do not exceed 1,400 words unless using `long-form-article`.
- **Existing content** -- ask if the user has existing blog posts, brand guidelines, or a voice sample. If they do, read it before writing. If they do not, default to conversational authority (see Step 2).
- **Constraints** -- any technical terms to include or avoid, competitors not to mention, claims that need hedging, or legal sensitivity in the industry (healthcare, finance, legal, security).

### 2. Calibrate Voice, Register, and Tone

Voice miscalibration is the most common failure mode in AI-written blog posts. Lock these three variables before drafting:

- **Register:** Choose one -- *conversational* (contractions, direct address, informal connectives like "Here's the thing," short sentences), *professional* (no contractions, longer sentence structure, formal connectives like "however" and "consequently"), or *technical* (precise terminology, assumes vocabulary, hedges claims appropriately). Most general blog posts use conversational. B2B, legal, or medical contexts use professional or technical.
- **Expertise level of audience:** If readers are beginners, explain terms once on first use. If intermediate, skip basics and lead with implications. If expert, skip implications and go straight to nuance. Never explain a term and also define it in a parenthetical on the same paragraph -- choose one or the other.
- **Emotional register:** Decide whether the post is energetic, measured, empathetic, or authoritative. The emotional register affects word choice ("transform" vs. "change"), sentence rhythm (short declarative sentences drive urgency; longer compound sentences slow the pace for reflection), and use of first-person voice ("I" vs. "we" vs. third person).
- **Contractions rule:** In conversational posts, use contractions throughout (you're, it's, don't, they've). In professional posts, avoid them. Mixing registers -- formal prose with sudden "don't" -- signals inconsistency and reads as low quality.
- **Brand voice sample check:** If the user provides a URL or pasted sample, identify three voice markers (sentence length, whether they use "you" or "the reader," use of em dashes, preferred examples style) and replicate them.

### 3. Generate a Title and Structural Outline

Titles and structure are not administrative steps -- they are the post's argument made visible. Do not skip this step.

- **Generate three title options.** Each title should follow a different structural pattern:
  - *Specificity title*: Leads with a concrete number or situation ("The 3-Email Sequence That Re-Engages Dormant Customers")
  - *Contrast/tension title*: Sets up a conflict or counterintuitive claim ("Why More Features Make Your Product Harder to Sell")
  - *Benefit-forward title*: Leads with what the reader gains ("How to Cut Your Customer Onboarding Time in Half")
- **Evaluate each title against these criteria:** Does it make a specific promise? Is it readable in under 8 words without losing meaning? Does it avoid "clickbait" phrasing that overpromises? Does it avoid generic labels ("A Guide to...", "Everything You Need to Know About...")?
- **Build the structural outline.** For an 800-1,000 word post, plan exactly 3 body sections. For 1,000-1,400 words, plan 4 sections. Each section should have a one-sentence purpose: not "we discuss X" but "we show the reader why X is harder than it looks and give them one concrete fix." Purpose sentences discipline the draft and prevent sections from becoming vague.
- **Sequence the sections intentionally.** Three proven sequences: *Problem → Consequence → Solution* (builds urgency then relieves it), *Conventional wisdom → Why it's wrong → Better approach* (creates intellectual tension), *Before → During → After* (narrative arc, good for process-adjacent topics). Choose the sequence that matches the post's argument.
- **If interactive:** Present titles and outline to the user before drafting. This saves complete rewrites. If not interactive, proceed with the strongest option and note your choices briefly at the start of the draft.

### 4. Write the Introduction

The introduction is the highest-stakes paragraph in the post. Readers abandon blog posts within 10-15 seconds if the opening does not earn their attention. Every sentence must do work:

- **Sentence 1 -- the hook.** Choose one hook type for this specific post:
  - *Specific scenario*: Place the reader inside a recognizable situation ("Your pull request has been sitting in review for four days. Your release is blocked. Your manager wants an update.").
  - *Counterintuitive fact*: A real, specific statistic or claim that challenges what the reader assumed ("Companies that publish fewer blog posts -- one per week instead of four -- generate more inbound leads over 12 months.").
  - *Specific failure or problem* (without rhetorical question): "The resume that took two hours to write sat in an ATS queue for six seconds before an algorithm discarded it."
  - *Never use*: rhetorical questions, "In today's [anything]," abstract generalizations, or a definition of the topic.
- **Sentences 2-3 -- stakes and relevance.** State what is at risk if the reader ignores this topic, or what opportunity they are missing. Quantify the stakes if possible ("teams lose an average of 14 hours per week to...").
- **Final sentence -- the promise.** Tell the reader explicitly what they will understand or be able to do after reading. This is not a thesis statement -- it is a contract with the reader. "By the end of this post, you will have a framework for..." is acceptable. "This post covers..." is a weak hedge -- avoid it.
- **Length target:** 80-120 words. Under 80 feels thin. Over 150 feels like a second post has started.
- **Do not introduce the post's structure** ("First, we'll look at X, then Y, then Z"). That belongs in textbooks. Modern blog introductions make a promise and get out of the way.

### 5. Write Each Body Section

Each body section is a self-contained argument with a claim, evidence, and implication. Treat each section as a short, tight essay:

- **Open with a strong topic sentence.** The first sentence of each section states the section's main claim -- not a transition from the previous section, not background context. "Remote work increases individual output" is a topic sentence. "Now that we've discussed the challenges, let's talk about benefits" is a transition filler and should be deleted.
- **Develop with evidence.** Choose the evidence type best suited to the claim:
  - *Statistic or research finding*: Use when the claim is empirical and the reader needs proof. Be specific ("48% of enterprise buyers," not "nearly half").
  - *Brief case study or anecdote*: Use when the claim is about human behavior or outcomes. Keep to 3-5 sentences: context, action, result.
  - *Concrete analogy*: Use when the concept is abstract and needs grounding. The analogy must map cleanly -- abandon it if you need to qualify it more than once.
  - *Direct example from reader's context*: Use when you can name a situation the target reader lives inside. More effective than generic examples.
- **Use H3 subheadings sparingly.** Add an H3 inside a body section only if the section covers two distinct sub-ideas that genuinely need separation. An H3 in a 200-word section is a formatting tic, not a structural improvement.
- **Paragraphs under 4 sentences.** Online reading is scanning. Short paragraphs create visual breathing room and keep readers moving. A paragraph of 6-7 sentences on screen looks like a wall and triggers abandonment.
- **Vary sentence length deliberately.** A run of five similar-length sentences creates monotony. After two or three medium-length sentences, insert a short one. Short sentences land with emphasis.
- **End sections with implication, not summary.** The last sentence of a section should push the idea forward ("The implication is that teams who fix this first will compress their go-to-market timeline by weeks") not backward ("So, as we can see, latency matters"). Never summarize what you just said in the same section -- if the writing was clear, the summary is redundant; if it was unclear, the summary does not fix it.

### 6. Write the Conclusion

The conclusion is not a summary -- it is the landing. Most blog post conclusions fail because they shrink from the commitment to actually tell the reader what to do next:

- **Restate the core insight in one sentence** -- not a list of everything covered, just the one thing the reader should carry away. If you cannot write this sentence, the post lacks a unifying argument and needs structural revision.
- **Bridge to action.** The call-to-action must be:
  - *Specific* ("Download the worksheet linked below" is specific; "learn more" is not)
  - *Low-friction* for the post's goal -- if the goal is trust-building, the CTA should be engagement (subscribe, comment, share) not purchase; if the goal is lead generation, the CTA can be heavier (book a call, start a free trial)
  - *Singular* -- one CTA, not three. Multiple CTAs in a conclusion split the reader's attention and produce lower conversion on all of them.
- **Close with a sentence that opens outward** -- a question the reader can now think differently about, a consequence that extends beyond what the post covered, or a forward-looking observation. This is the post's last impression. It should create momentum, not closure.
- **Length:** 80-120 words, matching the introduction in weight. A 3-sentence conclusion after a 1,000-word post signals the writer gave up.

### 7. Review Against Rules and Deliver

Before delivering the draft, run through this specific checklist. Do not skip it:

- Does the title make a specific promise without overpromising?
- Does the first sentence open with a concrete noun, action, or situation -- not an abstraction?
- Is every body section opened with a topic sentence (claim first, evidence second)?
- Does every section include at least one specific, non-generic example?
- Are all paragraphs four sentences or fewer?
- Is there exactly one call-to-action in the conclusion?
- Are there any forbidden openers or closers from the Rules section? If yes, rewrite.
- Is the voice consistent from start to finish -- no register mixing?
- Does the word count fall within the agreed range?
- Are there any transition summaries that restate the previous paragraph? Delete them.

---

## Output Format

Deliver the post in this structure. Every field is required:

```
---
**Working title considered and rejected (note why, if a different title was chosen):**
[Optional note to user on structural or voice choices made -- 1-2 sentences. Delete this
line before final publication.]
---

# [Final Blog Post Title]

[Introduction -- 80-120 words. Hook in sentence 1, stakes in sentences 2-3, promise in
final sentence. No structure preview. No rhetorical questions.]

## [Body Section 1 Heading -- Specific and benefit-oriented]

[2-4 paragraphs. Topic sentence opens. Evidence (statistic, anecdote, analogy, or example)
develops. Implication closes. Each paragraph: maximum 4 sentences.]

## [Body Section 2 Heading -- Specific and benefit-oriented]

[2-4 paragraphs. Different evidence type than Section 1. Topic sentence opens. No
transition summary from Section 1.]

## [Body Section 3 Heading -- Specific and benefit-oriented]

[2-4 paragraphs. Contains actionable guidance the reader can apply, not just insight.
Implication or forward momentum closes the section.]

## [Body Section 4 Heading -- Specific and benefit-oriented, if 1,000+ word target]

[2-4 paragraphs. Deepens or extends the argument. Does not merely repeat what Section 3
covered with different examples.]

## [Conclusion Heading -- e.g., "What to Do Next," "The Bottom Line," "Your Move"]

[2-3 paragraphs: core single takeaway stated cleanly, single specific CTA, forward-looking
closing sentence. 80-120 words total.]
```

**Metadata block** (include beneath the post):

| Field | Value |
|---|---|
| Word count | [n] |
| Voice register | Conversational / Professional / Technical |
| Audience expertise | Beginner / Intermediate / Expert |
| Post goal | Inform / Build trust / Generate leads / Spark conversation |
| Evidence types used | List (e.g., statistic, case study, analogy) |
| CTA type | Engagement / Subscription / Conversion |

---

## Rules

1. **Never open with "In today's [anything]."** This includes "In today's fast-paced world," "In today's digital landscape," "In the modern era," "As technology continues to evolve," and any variant that starts with an abstract temporal context. These phrases signal generic AI output and damage credibility in the first three seconds of reading.

2. **Never open with a rhetorical question.** "Have you ever wondered...?", "What if I told you...?", "Did you know that...?", "Are you tired of...?" -- all of these are soft openers that delay the real content and signal uncertainty about whether the reader cares. Start with something that assumes they care and proves it immediately.

3. **Never summarize mid-post.** Phrases like "Now that we've covered...", "As we discussed above...", "As we've seen...", or "With that in mind..." are transition fillers. Delete them. If the sections are well-ordered, readers carry the context forward without being reminded.

4. **Never include a "What is [Topic]?" definition section** unless the topic is a genuine niche term unfamiliar to the target audience AND the user explicitly asks for introductory-level content. A post about customer lifetime value for CMOs does not need a paragraph defining what a customer is. A post about homomorphic encryption for general business readers might.

5. **Never use more than one exclamation point in the entire post.** Blog post writing is not social media copy. One exclamation point for genuine emphasis is acceptable. Two reads as enthusiasm-padding. Three reads as manipulative.

6. **Never write a conclusion that is a list of everything just covered.** "In this post, we explored X, then looked at Y, and finally discussed Z" is a table of contents written after the fact. Readers just read those sections. The conclusion should add one new level of synthesis or a forward-looking statement that the body sections did not already contain.

7. **Never pad word count with redundant elaboration.** If you have made the point, stop. "This is important because it matters to the business's bottom line. In other words, it affects revenue. Simply put, it has financial implications." -- that is three sentences saying one thing. Write it once, write it well, and move on.

8. **Always write body section headings as specific claims or outcomes, not vague labels.** "Why Feedback Loops Prevent Expensive Rewrites" is a heading. "Feedback" is a label. "The Importance of Communication" is a corporate memo. The heading should tell the reader what they will understand by the end of the section, not just what category the section falls into.

9. **Always use at least one specific, non-generic data point or example per body section.** "Studies show that email is effective" is not a data point -- it is a gesture toward data. "Transactional emails average a 47% open rate compared to 20% for promotional emails" is a data point. If no data is available, a brief, specific anecdote achieves the same function: one person, one situation, one outcome.

10. **Always match the voice register established in Step 2 from the first sentence to the last.** Voice drift -- formal paragraph, then suddenly casual, then formal again -- reads as inconsistency and breaks reader trust. If the post is conversational, use "you" throughout. If professional, use "organizations" or "teams" and avoid direct address. Register is a commitment, not a suggestion.

11. **Never use buzzwords as evidence.** "Leverage synergies," "move the needle," "disruptive innovation," "digital transformation," "best-in-class" -- these terms exist in business writing to signal familiarity with a discourse without making a specific claim. They communicate nothing. Replace every buzzword with the concrete thing it is gesturing at.

12. **If the user provides no goal context, default to informational-trust building** -- the post should teach something genuinely useful with no overt conversion pressure. A soft CTA (subscribe for more, share with a colleague) is appropriate. A hard conversion CTA ("start your free trial") is not appropriate without explicit user instruction.

---

## Edge Cases

**The user provides a topic with no other context at all.**
Ask one targeted follow-up question before generating anything: "Who is the ideal reader for this post -- what do they do, and what problem are they trying to solve?" This single question surfaces audience, goal, and voice register simultaneously. If the user does not respond with useful detail or explicitly says "just write it," apply these defaults: conversational authority register, informed generalist audience (curious but not expert), 800-1,000 word target, informational goal, no conversion CTA.

**The user wants a post under 500 words.**
A 500-word post is a different structural beast. Reduce to 2 body sections maximum. The introduction collapses to 2-3 sentences (hook + promise only, no stakes development). Each body section gets one paragraph, not two to four. The conclusion is 2 sentences: takeaway and CTA. Skip the outline confirmation step -- go directly to drafting. Do not attempt to force 3 full body sections into this word count; sections under 80 words read as bullet points with headings, not as actual sections.

**The user provides a draft and asks for a rewrite.**
Treat the existing draft as a voice sample and content inventory. Do not add information, claims, or examples that are not present or clearly implied in the original -- the user owns the intellectual content. Your job is structure, clarity, and application of the genre rules. Read the draft once for argument, once for voice markers, then restructure. If the draft contains a section that violates a rule (a rhetorical question opener, a definition section that isn't needed, a buzzword-heavy passage), rewrite that section and briefly note what you changed and why.

**The topic involves legally or medically sensitive claims.**
If the post makes health claims, financial advice claims, or legal guidance claims, apply these constraints automatically without waiting to be asked: add hedging language ("may," "can," "some research suggests"), recommend consulting a qualified professional in the relevant section or conclusion, and avoid absolute outcome claims ("this will cure," "you will earn"). Notify the user that these hedges were added for liability and compliance reasons. Do not remove them unless the user confirms they have appropriate professional review in their publication process.

**The user wants a post on a topic where recent facts matter but no data is provided.**
Acknowledge this directly. Write the post with structural placeholders where data would strengthen the argument: [Insert current statistic on X -- verify before publishing]. Do not invent statistics. Do not use placeholder numbers as if they are real. Flag each placeholder clearly so the user knows exactly where to add verified data before the post goes live. A post with honest gaps is more trustworthy than one with fabricated precision.

**The user asks for a series of 3-5 posts on a related topic.**
Write each post as a complete, standalone piece that does not require reading the others to make sense. Do not create cross-post dependencies ("As we covered in Part 1...") unless the user explicitly requests a serialized format. Vary the evidence types and angles across the series so posts feel distinct and do not cannibalize each other's audience. Deliver posts one at a time with a brief note on how the coverage differs from each adjacent post in the series.

**The user writes in a non-English context or for a multilingual audience.**
Apply the same structural rules, but adjust idiomatic expressions. Many English idioms ("move the needle," "circle back," "boil the ocean") translate poorly and read as confusing or culturally opaque to non-native readers. Replace them with direct, non-idiomatic equivalents. In conversational register, prefer shorter sentences than you would for a native English audience -- shorter sentences reduce cognitive load in second-language reading. If the user writes in a non-English language, apply every rule in this skill in that language, not by translating from English.

---

## Example

**Input:** "Write a blog post about why small businesses should use email marketing instead of relying solely on social media. Target audience is small business owners with limited marketing budgets. Conversational tone. Around 900 words."

**Voice and structure decisions made:**
Register: Conversational. Audience: Intermediate (familiar with social media marketing, less familiar with email metrics). Goal: Build trust with an informational lean. Structure: Problem (rented reach) → Evidence (conversion gap) → Solution (accessible start) → Conclusion with soft CTA. Title chosen: specificity title.

---

**Output:**

---

# The Channel You Actually Own: Why Email Marketing Outperforms Social Media for Small Businesses

A coffee shop spent 18 months building a 12,000-follower Instagram audience. When the platform's algorithm shifted in the spring, their post reach dropped 73% in a single week. Their email list of 2,200 subscribers? Still landing a 41% open rate every Tuesday morning. The difference between those two numbers is the difference between borrowed attention and owned attention -- and for small businesses running on lean budgets, that difference shapes whether your marketing survives a platform change or collapses under one.

## Social Media Reach Is a Lease, Not a Purchase

Every follower you accumulate on Instagram, Facebook, or TikTok exists on someone else's infrastructure. The platform decides which of your followers sees your content, when they see it, and whether your posts appear in their feeds at all. Facebook organic reach for business pages now averages around 5% of total followers. That means a business with 2,000 followers is reliably reaching roughly 100 people per post -- without paying for ads.

Email bypasses that filter entirely. When you send an email, it goes to the inbox. Average open rates for small business email campaigns run between 25% and 35% depending on industry, and every person on that list chose to be there. No algorithm decides your email is less relevant than a competitor's promoted post. The distribution is direct and the audience is warm.

The risk is easy to underestimate until a platform changes its rules. Instagram has adjusted its algorithm 12 times since 2016. TikTok has shifted from chronological feed to pure engagement ranking to hybrid models. Each change redistributes reach -- and the businesses that built their entire audience on one platform are the ones who feel it hardest.

## The Conversion Gap Between Email and Social Is Wider Than You Think

Reach is one issue. Revenue is another. Consistent data across retail, service businesses, and e-commerce shows that email converts at 3 to 5 times the rate of social media for direct sales. Average email click-through rates for retail hover around 2.5%. Average click-through rates on organic social posts sit between 0.5% and 0.9%. For a business sending to 1,000 subscribers versus posting to 1,000 followers, email generates measurably more website visits per message -- without spending a cent on paid amplification.

The reason comes down to intent and context. A person who subscribed to your mailing list made a deliberate decision. They gave you their email address, confirmed it, and stayed on your list. That is a different behavioral signal than a casual follow tap while scrolling through a feed. Email subscribers are further along the trust curve. They expect to hear from you. They are primed to read and, when the offer is right, to act.

Seasonal promotions illustrate this clearly. A bakery offering a holiday pre-order discount sees dramatically different results from a social post versus a targeted email to past customers. The email goes to people who already bought. It lands in their personal inbox. It does not compete with 20 other posts for the same eyeball in the same scroll session.

## Getting Started Costs Less Than a Month of Ad Spend

The most common objection small business owners raise to email marketing is budget. It is the wrong objection. Several established email platforms offer free plans for lists under 500 to 1,000 subscribers, which covers the majority of small businesses starting out. A list of 500 engaged subscribers, properly cultivated, is worth more in conversion revenue than 5,000 passive social followers.

The minimum viable email program for a small business requires three things: a basic welcome email that goes out automatically when someone subscribes, a simple opt-in incentive (a discount code, a free resource, or early access to a sale), and a consistent send cadence -- even once every two weeks is enough to maintain relationship without burning out your subscribers. That is an afternoon to set up, not a staff hire.

Compare that to meaningful social media advertising. For a local business to achieve reliable reach on Facebook or Instagram through paid ads, a realistic minimum budget runs $200 to $500 per month. The targeting is powerful, but the moment the budget stops, the reach stops. Email lists compound. Every subscriber you earn stays on the list and can be reached again at near-zero marginal cost.

## Start With One Email This Week

You do not need a content calendar, a copywriter, or an automation platform to start. Pick the one question your customers ask you most often -- your best-selling product's story, a common mistake in your industry, or a tip that saves them time or money. Write 200 words about it. Send it to your existing customer list with a simple subject line. That is your first newsletter.

Track the open rate after three days. For a new list, anything above 20% is a healthy baseline. Look at who clicked. Those are your most engaged customers -- they are telling you what they want to hear more about. Build from there, one email at a time, before worrying about automations, segmentation, or subject line A/B testing. The businesses that win with email are the ones that start simply and stay consistent, not the ones that build perfect systems before sending a single message.

---

| Field | Value |
|---|---|
| Word count | 878 |
| Voice register | Conversational |
| Audience expertise | Intermediate |
| Post goal | Build trust (informational) |
| Evidence types used | Statistic, case study/anecdote, direct example, analogy |
| CTA type | Engagement (start with one email, track, iterate) |
