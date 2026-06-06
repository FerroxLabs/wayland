---
name: content-haro-reply
slash_command: false
pack: business-content
family: earned_media
description: |
  Write a HARO (Help A Reporter Out) or Qwoted/SourceBottle expert-source reply that gets quoted - not buried. Opens with a credentialed one-liner that answers "why this person, for this query," delivers the answer in 3-5 tight bullets with specifics and a contrarian take, and closes with a pull quote written to be lifted verbatim.
  Use when responding to a journalist query on HARO, Qwoted, SourceBottle, or similar journalist-source services where you have genuine expertise and a 2-4 hour reply window.
  Not for writing cold pitches to journalists (use content-press-release + pitch email) and not for full press release drafting (use content-press-release).
triggers:
  - haro reply
  - haro pitch
  - help a reporter out
  - journalist query reply
  - expert source reply
  - qwoted reply
  - sourcebottle reply
  - journalist source request
  - media query response
  - get quoted in press
  - expert quote for article
  - respond to journalist
negative_triggers:
  - write a press release
  - podcast guest pitch
  - media kit
tags: [content, earned_media, haro, pr, expert_source, journalist_query, quoted]
priority: 80
version: 1.0.0
author: Wayland Business Pack
license: MIT
metadata:
  wayland:
    related_skills: [content-press-release, content-media-kit, content-podcast-pitch, content-blog]
attribution:
  lineage: "Peter Shankman (HARO founder) on journalist time pressure and source quality; Cameron Herold 'Double Double' (2011) for earned-media positioning; Eugene Schwartz 'Breakthrough Advertising' (1966) for specificity-as-credibility; David Ogilvy 'Ogilvy on Advertising' (1983) for the pull-quote as the unit of communication; Sean Donahoe (28-year DR practitioner) for the 90-second quotability frame"
---

# Content HARO Reply - The 90-Second Quotability Stack

> *"A journalist reading HARO replies has 90 seconds and 50+ responses. You're not competing with bad answers - you're competing with decent answers. The only way to win is to be so specific, so credentialed, and so quotable that using you is the path of least resistance."* - Sean Donahoe

HARO (now merged into Connectively), Qwoted, and SourceBottle exist because journalists need expert sources fast. A reporter on deadline with 60 replies in their inbox is not looking for the most comprehensive answer - they are looking for the answer they can drop into their article in 90 seconds without rewriting.

Most replies fail not because the expertise is wrong, but because:
- The credential is generic ("I'm a marketing expert with 15 years of experience")
- The answer is too long (journalists don't read walls of text from strangers)
- There's no pull quote (the journalist has to write the quote themselves)
- The reply answers a different question than the one asked

The 90-Second Quotability Stack fixes all four.

## When to Use

Trigger phrases: "HARO reply", "HARO pitch", "journalist query", "expert source reply", "get quoted in press", "respond to journalist query", "Qwoted reply".

Use when:
- You have received a HARO / Qwoted / SourceBottle query that matches your actual expertise
- The deadline is within 2-4 hours (most journalist queries have same-day or next-day deadlines)
- You can provide specific numbers, named experiences, or a genuinely contrarian take - not general advice anyone could give
- You want to build a press citation record for your media kit or `content-media-kit`

Do NOT use for:
- Cold-pitching journalists who didn't post a query - use press outreach adapted from `content-press-release`
- Responding to queries outside your actual expertise - journalists verify sources; misrepresentation destroys relationships
- Writing a long-form editorial or byline - use `content-blog` instead

## The Query Audit (Required Before Writing)

Before writing a single word, answer three questions:

1. **Am I actually qualified?** Not "adjacent to" or "interested in" - actually qualified. A journalist who quotes you and later learns your credentials were stretched will never use you again and may note it publicly.
2. **Do I have something specific to say?** "It depends on the situation" is not quotable. "In 23 of the 40 client engagements I've run, the specific failure point was X" is quotable.
3. **Am I answering the question they asked?** Read the query again. Many responses answer a nearby question. If the journalist asks "what's the biggest mistake founders make in year one," don't answer "here's my framework for founding a startup." Answer the question asked.

If any answer is no, skip this query. Sending a mediocre reply wastes the journalist's time and your reputation.

## The 90-Second Quotability Stack

### Component 1 - The Credentialed One-Liner (line 1)

Not a bio. Not a paragraph. One sentence that answers: "why should this journalist trust me on this specific query?"

Formula: `[Specific role] with [specific evidence of experience], [specific relevant credential for THIS query].`

Weak: "I'm a marketing expert with 15 years of experience in the industry."
Strong: "I'm a fractional CFO who has reviewed the financial statements of 40 bootstrapped e-commerce brands doing $1M-$10M in annual revenue - this exact cashflow question is the most common failure point I see."

The one-liner must pass the substitution test: could any other person in your field say this sentence? If yes, it's too generic. Add one more specific.

### Component 2 - The Direct Answer (1-2 sentences)

Answer the journalist's question in the first two sentences. Not background. Not context. The answer.

This is Ogilvy's principle applied to expert sourcing: the journalist (like the reader) decides in the first sentence whether to keep reading. If sentence one is setup, they're already skimming for the next reply.

Direct: "The single biggest mistake is [X]."
Then: "Here's why that matters specifically: [one sentence of stakes or mechanism]."

### Component 3 - The 3-5 Bullet Evidence Stack

Support the direct answer with 3-5 bullets - each one a specific piece of evidence. Specificity is credibility (Schwartz's rule: the more specific the claim, the more believable it is).

Each bullet format: **[Specific claim or finding]** - [one sentence of context or mechanism]

Rules:
- Every bullet must have at least one specific: a number, a named situation, a date, a named company (with permission), or a measurable result
- No bullet should be general advice that any Google search would return
- At least one bullet should be contrarian - the thing most sources won't say, or the finding that surprises people
- Total bullets: 3 minimum (substance), 5 maximum (journalist's time limit)

### Component 4 - The Pull Quote

Write one sentence, in quotation marks, designed to be lifted verbatim into the article.

This is the single highest-leverage thing most HARO sources don't do. A journalist on deadline needs:
1. A quote
2. Attribution

If you provide the quote pre-written, you remove two steps from their workflow. They can edit it, but they'll often use it close to verbatim if it's good.

Pull quote criteria:
- 1-2 sentences max (25-40 words is the sweet spot for article quotes)
- Written in first person, present tense, natural spoken cadence
- Contains either a surprising specific, a strong claim, or a memorable frame
- Does not start with "I think" or "In my opinion" - opens with the point, then attributes

Example: "Most founders think they're running out of money - they're actually running out of time to make the right decision before they run out of money. Those are two very different problems with two very different solutions."

### Component 5 - Credentials + Contact Block

Three lines maximum:

```
[Full name], [title/role]
[Company or website]
[Phone or email - give whichever you'll actually answer in the next 2 hours]
```

Include a link to one supporting resource only if directly relevant (a study you authored, a report you published, a specific article). Never a generic homepage link. The journalist will find your site; they don't need you to provide it.

## Inputs

Required:
1. **The journalist's query** - paste the full query text including outlet name, journalist name, deadline, and angle
2. **Your relevant credential for THIS query** - specific role, years in this domain, specific evidence of expertise
3. **Your specific finding, data, or POV** - the thing you'll say that generic experts won't

Optional:
- **Named client results** - with permission; anonymized if needed ("a $4M e-commerce brand I worked with in Q1 2025")
- **Published research or cited data** - third-party data you can cite (always with source)
- **Contrarian position** - the thing most sources get wrong about this topic
- **Media kit URL** - for the journalist to pull bio and headshot if they want to use you

## Output Spec

The skill produces:
1. **Query audit result** - qualified / partially qualified / skip this one (with reasoning)
2. **Full HARO reply** - credentialed one-liner + direct answer + 3-5 bullet stack + pull quote + contact block
3. **Word count** - should be 150-300 words total; flag if over 300
4. **Quotability score** - 3-point check: (a) one-liner passes substitution test, (b) pull quote can be lifted verbatim, (c) at least one bullet is contrarian or data-backed
5. **Follow-up note** - if the journalist uses you, what to do next (send media kit, offer further comment, monitor for publication)

## Worked Example

**Query (hypothetical):** *"HARO - Forbes Small Business: I'm writing a piece on why most small business owners underprice their services. Looking for expert sources (coaches, consultants, pricing strategists, accountants) who can speak to the psychology of pricing fear and give 2-3 actionable tips. Deadline: 5pm ET today. - Jordan Rivers, Forbes."*

**Guest:** Business coach with 8 years coaching 6-figure service businesses; has worked with 200+ clients on pricing specifically; runs a community of 4,200 service-based entrepreneurs.

---

**Subject:** Forbes pricing piece - source reply [deadline today]

I'm a business coach specializing in pricing strategy for 6-figure service businesses; I've worked through this exact issue with 200+ clients over 8 years and run a community of 4,200 service entrepreneurs where pricing fear is the #1 topic by engagement volume.

Most small business owners don't underprice because they don't know their worth - they underprice because they believe the client's price objection before they even get one. The fear of the objection is doing more damage than the objection itself.

Three specific things I see repeatedly:

- **The "I'll lose them" catastrophe loop.** In 80% of the pricing conversations I've facilitated with clients, the imagined lost sale never materializes after a price increase. Of my last 30 clients who raised prices by 20-30%, 27 retained all core clients with zero revenue loss.
- **Anchoring to the wrong comparison.** Service providers price against what they used to charge, not against the outcome they deliver. A $500/hour coach who saves a founder 6 months of the wrong direction isn't competing with $150/hour - they're competing with a $200K mistake.
- **The discount reflex.** Offering a discount before the client asks signals that the original price wasn't real. I track this specifically: clients who stop discounting unprompted see average revenue per client increase 18% in 90 days without adding a single new client.

**Pull quote:** "Pricing fear is almost never about the client - it's about the owner needing the client to confirm their value before they'll claim it. The moment they stop asking for permission to charge what they're worth, the objections largely disappear."

---

Dana Osei, Business Coach & Pricing Strategist
danaoseicoaching.com
dana@danaoseicoaching.com | 404-555-0183

---

**Word count: 271. Quotability audit: PASS (one-liner passes substitution test; pull quote is lift-ready; two bullets are data-backed, one is contrarian).**

---

## Edge Cases / Common Failures

**1. Answering a different question than the one asked.** The query says "why do owners underprice." The reply is "here's how to set prices." These are different questions. Read the query three times. Answer the one they asked.

**2. The generic credential.** "I have 15 years of experience in business coaching" could describe 10,000 people. The credential must be specific to *this query*: "I have worked through this specific pricing issue with 200 clients" is specific to a pricing question. "I have 15 years of coaching experience" is not.

**3. No pull quote.** The most common failure. The journalist has to write the quote themselves - that's additional work in a deadline situation. Write the quote for them. You control the language; they control whether to use it.

**4. Too long.** HARO replies over 400 words are rarely read in full. Journalists are on deadline. 150-300 words is the window. Edit ruthlessly.

**5. Following up after the deadline.** Once the deadline passes, the story is filed. Following up to add more information is a waste of both parties' time. Monitor for publication instead, then send a brief thank-you with a link to your media kit.

## DR Fundamentals Embedded

The journalist is the buyer. The quote is the product. The reply is a 250-word sales letter. Map the DR frame:

| DR Element | HARO Reply Equivalent |
|---|---|
| **Hook** | Credentialed one-liner - "why this person, for this query, right now" |
| **Promise** | Direct answer in first 2 sentences - "I will answer your question, not a nearby question" |
| **Proof** | 3-5 bullet evidence stack - specifics, data, contrarian take; specificity IS credibility (Schwartz) |
| **Close** | Pull quote + contact - make the "yes" (quoting you) require zero additional work |

Ogilvy's rule: "The pull quote is the unit of communication in print journalism." Write the quote. Don't make the journalist write it.

Eugene Schwartz's rule: specificity is the mechanism of belief. "Most clients" is weak. "27 of 30 clients" is strong. Every bullet in the evidence stack should contain at least one number, date, or named situation.

Sean Donahoe's 28-year insight: earned media via HARO compounds in two ways - the immediate citation builds domain authority (SEO + credibility), and journalists who find you useful become recurring sources. One great reply can generate 5 subsequent placements over 12 months from the same journalist.

## Workflow

### Step 1 - Run the query audit

Three questions before writing a word: Am I actually qualified? Do I have something specific to say? Am I answering the question they asked? If any answer is no, skip this query. There is no partial credit in HARO - a mediocre reply from an over-credentialed source still loses to a sharp reply from an exactly-right source.

### Step 2 - Draft the credentialed one-liner

Write it, then apply the substitution test: could any other person in your field say this sentence without changing a word? If yes, it's still generic. Add one more specific - a client count, a specific domain, a named result - until the sentence could only come from you.

### Step 3 - Write the direct answer first

Two sentences. The answer, not the setup. Journalists skim. If the first sentence of your reply is context or biography, they've already moved to the next reply. Lead with the point, then back it up.

### Step 4 - Build the bullet stack

Write 5 bullets, then cut to the 3-4 strongest. Each bullet needs one specific: a number, a date, a named situation, or a measurable result. Read each bullet and ask: "Would a Google search return this?" If yes, cut it - generic bullets waste the word count and dilute the credibility of the specific ones.

### Step 5 - Write the pull quote last

After the answer and bullets are locked, write the pull quote. It should distill the single most quotable insight from the reply. Test it by reading it aloud - does it sound like something a person would say on a stage? Or does it sound like marketing copy? Pull quotes that survive are the ones that sound like the speaker is slightly more willing to say the thing than most people would be.

### Step 6 - Assemble and count

Paste: credentialed one-liner + direct answer + bullet stack + pull quote + contact block. Word count target: 150-300. If over 300, cut from the bullet stack first (pick the weakest bullet), then from the direct answer. Never cut the pull quote - it's the highest-value element.

### Step 7 - Send before the hour mark

HARO journalists read early replies preferentially. Set a notification for each HARO send time (typically 5:35am, 12:35pm, 5:35pm ET) and reply within the first 60 minutes of queries that match your expertise. The difference between being quoted and being buried is often not the quality of the reply - it's the timestamp.

### Step 8 - Monitor and capture

Set a Google Alert for your name + the journalist's name immediately after sending. When the story publishes, share it on LinkedIn within 24 hours (tag the journalist if appropriate - they appreciate it, and it flags you as a reliable source for future queries). Add the citation to your `content-media-kit` the same day.

## Building a HARO Source Profile Over Time

Earned media via HARO is a compounding asset, not a one-off transaction. The journalists who quote you once are the ones most likely to come back - but only if you make their first experience frictionless.

**Three behaviors that turn a one-time quote into a recurring relationship:**

1. **Reply fast and consistently.** A journalist who gets a sharp reply from you within 30 minutes of a query drop will remember you for the next relevant query. Speed signals reliability; reliability signals repeatability.
2. **Never stretch your credentials.** Journalists verify. One instance of overstated expertise - "I've worked with Fortune 500 companies" when it was one small project - and the relationship is over. Permanent. The internet is long.
3. **Make it easy to use you again.** After publication, send a two-sentence thank-you with a link to your media kit: "Great piece - here's my media kit if useful for future stories in this space." This is the one follow-up that is appropriate after the deadline; it is not pestering, it is logistics.

**Categories of queries to prioritize:**

Not all HARO queries are equal. Prioritize by: (a) outlet prestige (Forbes, WSJ, Inc. citations carry more domain authority and credibility transfer than local trade publications), (b) alignment with your primary topic area (the citation you want in your media kit should reinforce the expertise you want to be known for), and (c) whether the journalist is a recurring beat reporter vs. a one-off freelancer (beat reporters write about the same topic weekly; they need reliable sources; that's you).

## Notes

- Pair with `content-media-kit` - after your first major outlet citation, journalists will look for a media kit; have it at a direct URL before you reply to your first query, not after
- Pair with `content-press-release` - HARO gets you quoted inside other people's stories; press releases create your own story; run both in parallel for maximum earned-media surface area
- Monitor for publication: set a Google Alert for your name + the journalist's name the moment you send the reply; when the story runs, share it immediately and add the citation to your media kit
- HARO (Connectively) sends queries 3x/day; replies within the first hour of each drop have meaningfully higher selection rates - the journalist reads early replies first and the story often fills before the posted deadline
- Qwoted, SourceBottle, and Terkel operate similarly; this method applies to all journalist-source request platforms; the 90-Second Quotability Stack is platform-agnostic
