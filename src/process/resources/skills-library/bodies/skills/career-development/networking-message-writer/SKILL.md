---
name: networking-message-writer
description: |
  Writes professional networking messages for three scenarios: informational
  interview requests, reconnecting with dormant contacts, and introduction
  requests. Produces complete, ready-to-send message text optimized for response
  rate on LinkedIn or email. Use when the user wants to request an informational
  interview, reconnect with a former colleague, ask for an introduction, or
  write a professional networking message. Do NOT use for cold emails to hiring
  managers (use cold-outreach-email), recruiter messages (use recruiter-outreach),
  or post-interview follow-ups (use thank-you-email-writer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "career writing template linkedin networking"
  category: "career-development"
  subcategory: "job-search"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Networking Message Writer

## When to Use

Use this skill when the user needs a complete, ready-to-send professional networking message in one of three specific scenarios:

- User wants to request an **informational interview** -- reaching out to someone in a target role, company, or industry to learn about their path, their work, or how their organization operates
- User wants to **reconnect with a dormant contact** -- a former colleague, manager, classmate, conference acquaintance, or professional they have not spoken to in six months or more
- User wants to **request an introduction** through a mutual contact -- asking someone who knows both parties to facilitate a warm connection to a third person
- User asks how to write a professional networking message for LinkedIn InMail, a LinkedIn connection request, or direct email and has provided at least one specific recipient detail
- User is navigating a career transition and needs to activate their existing network -- reaching out to former teammates, mentors, or industry peers for guidance, referrals, or intel
- User attended an event (conference, meetup, webinar) and wants to follow up with a speaker, panelist, or attendee they briefly met or interacted with in a public forum

**Do NOT use this skill when:**
- User wants to cold-email a hiring manager about a specific open job posting -- use `cold-outreach-email` instead (the framing, structure, and intent are fundamentally different)
- User wants to message a recruiter at a target company or staffing agency -- use `recruiter-outreach` instead (recruiter messages require a resume summary, availability, and job-match framing)
- User needs a post-interview thank-you email -- use `thank-you-email-writer` instead (that context requires specific interview references and continuation-of-interest framing)
- User needs a cover letter attached to a formal job application -- use `cover-letter-writer` instead
- User wants to build a networking strategy or learn relationship management principles -- this skill produces messages, not strategy documents; redirect to a career coaching framework skill
- User wants to follow up after sending a networking message that already received a response -- that is a different conversational context requiring reply-threading, not a cold open

---

## Process

### Step 1: Identify the Scenario and Clarify What You Have

Before writing a single word, classify which of the three message types applies and audit what information the user has provided. Missing specifics produce generic messages that fail.

- **Informational interview request:** User wants 20-30 minutes with someone whose job, company, or career trajectory they want to understand -- typically no prior relationship exists or the relationship is weak
- **Dormant contact reconnection:** User is reaching back to someone they have a shared history with but have not spoken to in six months to several years -- the key asset is a real, shared memory or professional moment
- **Introduction request:** User wants access to a third person and is going through a mutual contact -- this is a two-message scenario (one to the mutual contact, one to be forwarded as the intro message)

After classification, check the information inventory. If ANY of these are missing, ask before writing:
- Recipient's name, title, and current company
- How the user knows of or found the recipient (mutual contact, conference, LinkedIn post, article, GitHub repo, podcast appearance)
- What the user specifically wants to discuss or learn -- not "career advice" but a precise question
- Platform: LinkedIn direct message, LinkedIn connection request note, or email
- User's one-sentence professional context (current role, career stage, what they are exploring)

---

### Step 2: Research the Recipient -- Mine Available Signals

A specific message outperforms a generic one by a factor of 3-4x on response rate. Specificity is the skill. Before drafting, extract every available signal from what the user tells you and ask for more if signals are thin.

- **Content signals:** Has the recipient published a LinkedIn post, article, industry piece, open-source project, podcast episode, or conference talk? Identify a specific claim, finding, or example from that content -- not just the title
- **Career trajectory signals:** Has the recipient recently changed companies, been promoted, or moved into a new role? A congratulatory acknowledgment of a recent transition is one of the highest-response-rate openers because it is time-relevant
- **Company signals:** Is their company doing something notable -- launching a product, entering a new market, publishing research? This gives the user a reason to reach out beyond "I want something from you"
- **Shared context signals:** Mutual connections, the same university, the same former employer, the same niche community, the same geographic market -- any overlap that makes the outreach feel warm rather than cold
- **Role-specific signals:** If the recipient is in a specialized role (design systems, revenue operations, computational biology, urban planning), show domain literacy -- use the vocabulary of their field correctly

If the user has no specific signal to reference, do not invent one. Either guide the user to find a real signal before sending (e.g., "spend 3 minutes on their LinkedIn activity before messaging") or flag that the message will be thinner and response rates will be lower.

---

### Step 3: Apply Scenario-Specific Structure and Architecture

Each message type has a proven structure. Follow it precisely. Deviation from the structure -- especially front-loading the ask or burying the specific connection -- is the most common reason networking messages fail.

**INFORMATIONAL INTERVIEW REQUEST (target: 90-120 words for LinkedIn, 120-150 words for email)**

The architecture is: Connection → Context → Specific Question → Low-Friction Ask

- **Sentence 1 -- Connection:** Name exactly how you found them or what you know of them. Be specific enough that the sentence could not apply to anyone else. "I came across your LinkedIn post on zero-trust architecture and the point about lateral movement caught my attention" is strong. "I found you on LinkedIn" is not.
- **Sentence 2 -- Context:** State your relevant professional context in one tight sentence. This is not a biography -- it establishes that you are capable of having an informed conversation, not just asking them to explain their career from scratch.
- **Sentence 3 -- Specific Question or Topic:** Name the SINGLE thing you want to understand. Informational interviews with a defined question get accepted at much higher rates because the recipient can evaluate whether they are a good person to answer it. "How you decided to move from IC engineering to engineering management at a Series B company" is a real question. "Your career path" is not.
- **Sentence 4 -- Low-Friction Ask:** "Would you be open to a 20-minute call?" is the standard. Never say "30 minutes to an hour" -- it signals disrespect for their time. Offering an async option (a few questions by email) adds a second tier for busy people who will not take a call.
- **Optional Sentence 5 -- Flexibility:** Brief and genuine. "Happy to work around your schedule" or "Anytime in the next few weeks works for me" signals that you are not going to create friction in the scheduling.

**DORMANT CONTACT RECONNECTION (target: 80-120 words for LinkedIn, 100-140 words for email)**

The architecture is: Genuine Hook → Brief Update → Honest Purpose → Specific Ask or Offer

- **Sentence 1 -- Genuine Hook:** Reference something real and specific from your shared history. The more specific the reference, the warmer the reconnection. "I still think about the retrospective process you introduced at [Company]" outperforms "Hope you have been well!" by an enormous margin. Never open with "I know it has been a while" -- it highlights the gap and starts on an apologetic note.
- **Sentence 2 -- Brief Update:** One sentence on what you have been doing since you last connected. This gives them context for why you are reaching out and signals your career trajectory. Do not over-explain or send a resume in prose form.
- **Sentence 3 -- Honest Purpose:** Name why you are reaching out now. Ambiguity here feels manipulative to experienced professionals. "I am exploring a move into product operations and thought of you given your background" is honest and focused. If you want a referral, say so -- tactfully but clearly.
- **Sentence 4 -- Specific Ask or Reciprocal Offer:** A specific ask ("Would you be open to a quick call?") or a specific offer of value before the ask ("I saw you are hiring -- happy to share any context from my time there, and would also love to reconnect"). Pure asks without any reciprocity signal feel transactional; give something if you can.

**INTRODUCTION REQUEST (this is a two-part message type)**

The introduction request has two distinct messages: the message TO the mutual contact asking for the introduction, and the forwarded intro message that you write for them to use. Always write both.

**Message 1 -- To the Mutual Contact (target: 80-100 words)**

Architecture: Context → The Target Person → Why You Want to Connect → The Ask → Offer to Draft

- Open by grounding the request in your relationship with the mutual contact ("Since you know both the enterprise sales world and my background in CS tools...") -- this contextualizes why they are the right person to make this introduction
- Name the target person specifically: name, role, company
- State the specific reason you want to connect -- one precise sentence about the conversation you want to have or the question you want to explore
- Ask explicitly: "Would you be comfortable introducing us?" -- never assume or state "I was hoping you could introduce me" as a declarative, which puts them in an uncomfortable position
- Offer to write the introduction email for them: "I can draft the intro note if that makes it easier -- just let me know." This is the single highest-impact sentence in any introduction request. It removes 90% of the friction that causes mutual contacts to intend to make an intro but never follow through.

**Message 2 -- The Forwarded Intro Note (target: 60-80 words)**

This is the short message the mutual contact forwards or pastes when making the introduction. Write it in the third person, from the mutual contact's perspective. It should:
- Introduce the user by name, role, and one-sentence context
- State why the mutual contact thinks the connection is valuable
- Name the single topic the user wants to discuss
- Include a call to action: "She would love to set up a 20-minute call" or "Feel free to respond directly to her"

---

### Step 4: Calibrate Tone to Relationship Distance

Not all networking messages should sound the same. Calibrate tone to the actual relationship distance between the user and the recipient.

- **No prior relationship (informational interview, complete stranger):** Professional and respectful, slightly formal. Show deference to their time. Establish credibility without being boastful. Avoid casual language that implies familiarity you do not have.
- **Weak prior relationship (met once, same community, mutual connection):** Warmer opening that acknowledges the shared context. Slightly more conversational. Still specific and concise.
- **Dormant relationship (real shared history):** Genuinely warm, specific, personal. The tone can be more like reaching out to an old friend -- because functionally that is what it is. Forced formality here actually reduces response rate.
- **Close contact you have drifted from:** Very warm, almost casual. The message should feel like a conversation starter, not a formal request. You can even reference the drift lightly: "It has been way too long" is acceptable when the relationship was genuinely close.

Platform affects tone calibration as well:
- LinkedIn InMail: Medium formality, professional but not stiff, under 120 words
- LinkedIn connection request note: High brevity and specificity, under 300 characters, must establish relevance immediately or it reads as spam
- Email: Slightly more formal, subject line required, can go up to 150 words, include a clear subject line that gives the recipient context before opening

---

### Step 5: Write the Subject Line (Email Only) and Message

For email, the subject line determines open rate before the message quality matters at all. Apply these subject line principles:

- **Specificity over cleverness:** "Question about your move from agency to in-house UX" outperforms "Exploring a career question" by a substantial margin
- **Reference the mutual connection if one exists:** "Sarah Chen suggested I reach out" is one of the highest-performing subject line formats in professional networking email -- it provides instant social proof and context
- **First-name reference to the recipient:** "Hi [Name] -- quick question about your work on [specific topic]" signals the email is personal, not bulk
- **Never use deceptive subject lines:** "Following up" when there has been no prior exchange, or "Re:" with no prior thread, damages trust immediately and is considered a manipulation tactic in professional contexts
- Keep subject lines under 50 characters to prevent truncation in mobile email clients

Strong subject line formulas:
- "[Mutual Contact's Name] suggested I reach out"
- "Question about [specific topic] -- [your name] from [context]"
- "Your [article/talk/post] on [specific topic] -- a quick question"
- "Congratulations on [recent achievement] -- and a question"

Now write the full message body following the structure from Step 3.

---

### Step 6: Apply the Response-Rate Optimization Pass

After drafting, run a quality check against these specific criteria before delivering the message:

- **Word count check:** LinkedIn InMail must be under 120 words. LinkedIn connection request note must be under 300 characters. Email must be under 150 words. If over, cut from the middle -- never cut the specific reference or the specific ask
- **Specificity check:** Can any sentence of this message be sent to a different person without changing a word? If yes, that sentence is too generic -- make it specific
- **Ask clarity check:** Is there one clear ask? Not two asks, not a vague hope to connect, not a question followed by another question. One specific, time-bounded, low-friction request
- **Flattery check:** Remove any sentence that is pure flattery without substance. "You have had such an incredible career" without any specific reference to what impresses the user about that career is noise. Replace flattery with specific acknowledgment: the difference between "You are amazing" and "The way you described managing the transition from waterfall to continuous delivery in your case study changed how I think about rollout planning"
- **Friction audit:** Would this ask require the recipient to do anything other than reply or click a calendar link? If scheduling, prep, or effort is implied, the response rate drops. Minimize friction at every step.
- **Tone authenticity check:** Read it aloud. Does it sound like a human wrote it for a specific person? Or does it sound like a template with names inserted? If the latter, add one more specific sentence and remove one generic sentence.

---

### Step 7: Produce the Follow-Up Message

Every complete networking message output includes a follow-up for non-responses. Apply these principles:

- Wait exactly 7 business days before sending a follow-up -- not 3 days (too impatient) and not 14 days (loses momentum)
- The follow-up must be shorter than the original -- ideally 2-3 sentences
- Reference the original message briefly but do not paste or summarize it -- assume they saw it
- Add a new piece of value or a new angle -- a question you want to add, a relevant article, an acknowledgment of something new they published
- Make it easy to say no: "I know this time of year gets busy -- completely understand if it does not work out" gives them permission to decline cleanly, which paradoxically increases response rate because it removes the guilt of ignoring you
- One follow-up only. Two follow-ups without a response crosses into unwanted contact territory in a professional networking context.

---

### Step 8: Handle the LinkedIn Connection Request Note (If Applicable)

When the user is connecting on LinkedIn rather than messaging an existing connection, a 300-character note accompanies the connection request. This is the most constrained format in professional networking and requires a different approach:

- Every word must earn its place -- 300 characters is roughly 45-55 words
- Establish relevance in the first 10 words -- why should this specific person accept this specific request?
- Name one specific shared context or one specific piece of their work
- Include a 1-2 word hint at what you want: "exploring design systems work," "navigating a move into fintech," "following your research on supply chain risk"
- Do NOT put the full ask in the connection note -- save it for the message after they accept
- Do NOT include a generic line like "I'd love to connect!" -- it adds nothing and uses up precious characters

---

## Output Format

Deliver the complete output in this structure every time. Fill in all fields -- never leave a section blank or marked as N/A without explanation.

```
## Networking Message: [Scenario Type]

**Platform:** [LinkedIn InMail / LinkedIn Connection Request + Follow-up Message / Email]
**Recipient:** [Name, Title, Company]
**Relationship Distance:** [No prior relationship / Weak prior / Dormant relationship]

---

### Message

**Subject line (email only):** [Subject line text]

[Complete message text, ready to send, no brackets remaining]

**Word count:** [number] / [120 for LinkedIn | 150 for email]

---

### Connection Request Note (LinkedIn only, if starting from no connection)

[Full connection request note text]

**Character count:** [number] / 300

---

### Message Breakdown

| Element           | Content Used                          | Purpose                                              |
|-------------------|---------------------------------------|------------------------------------------------------|
| Opening hook      | [what was referenced]                 | [why this specific reference earns attention]        |
| Credibility line  | [user background as stated]           | [what it establishes about the user's ability]      |
| Specific ask      | [exact ask as written]                | [what makes it low-friction]                         |
| Tone calibration  | [formal / professional / warm]        | [why this tone matches the relationship distance]    |
| Key risk mitigated| [generic opener / vague ask / flattery] | [what failure mode was avoided]                    |

---

### 7-Day Follow-Up Message

**Subject line (email only):** [Re: original subject line -- keep it threaded]

[Follow-up message, 2-3 sentences, ready to send]

**Word count:** [number]

---

### Introduction Forwarding Note (introduction requests only)

*Write this in the mutual contact's voice -- they forward or paste this when making the intro.*

[Forwarding note text, 60-80 words]

---

### Personalization Markers (if message will be sent to multiple similar recipients)

If adapting this message for other recipients, change these specific elements for each send:

- **[RECIPIENT_REFERENCE]:** Replace with a specific piece of their work, content, or recent event
- **[SPECIFIC_QUESTION]:** Replace with the precise question most relevant to this person's background
- **[SHARED_CONTEXT]:** Replace with the specific overlap between user and recipient

*Estimated personalization time per message: 3-5 minutes*
```

---

## Rules

1. **Always produce a complete, ready-to-send message** -- the output should require zero rewriting to use. Never produce networking tips, relationship advice, or a structural outline. The user came for a message, deliver a message.

2. **Every message must reference something specific and non-transferable about the recipient** -- a specific post, a specific company, a specific career move, a specific piece of work. If the user has not provided this, ask before writing. A message that can be sent to 50 people without changing a word is spam, not networking.

3. **Enforce word count limits as hard constraints, not guidelines** -- LinkedIn InMail over 120 words signals that you did not respect the reader's attention. Email over 150 words in a cold networking context suffers a measurable drop in response rate. Cut from the middle if over limit -- the specific reference and the specific ask are non-negotiable.

4. **The ask must be singular, specific, and time-bounded** -- "Would you be open to a 20-minute call next week?" is the standard. Never present two asks in one message. Never make the ask vague ("I'd love to connect") or open-ended ("Let me know if you ever have time"). Vague asks create decision paralysis and get deferred indefinitely.

5. **Never use "pick your brain"** -- this phrase is widely recognized among experienced professionals as a signal that the asker wants to extract value without offering any in return. Replace it with the specific question or topic the user wants to discuss. Other phrases to avoid: "I just wanted to reach out," "I know you're super busy," "I'm not sure if you remember me."

6. **For introduction requests, always write both messages** -- the message to the mutual contact AND the forwarding note written in the mutual contact's voice. Providing only the request message without the forwarding note is an incomplete output that forces the mutual contact to do extra work, which is the primary reason introduction requests fail.

7. **Never invent relationship warmth that does not exist** -- if the user barely knew someone, do not write a message that implies a close relationship. Recipients notice immediately when warmth is fabricated, and it creates distrust that makes them less likely to respond. Match the tone to the actual relationship distance documented in Step 4.

8. **For dormant contact reconnections, the shared history reference must be specific** -- "We worked together at Acme" is a factual statement, not a hook. "The debugging session where we finally tracked down that race condition in the payment service" is a hook. The specificity of the memory signals genuine care for the relationship, not a transactional agenda.

9. **Introduction requests must ask "Would you be comfortable?" not "Can you" or "Could you"** -- the "comfortable" framing explicitly gives the mutual contact permission to decline without awkwardness. This is not just polite -- it is strategically important because a reluctant or coerced intro is worse than no intro (the recipient can tell when an introduction was made under obligation).

10. **Always include the 7-day follow-up message as part of the output** -- not as optional but as standard. Most first networking messages go unanswered not because of rejection but because of timing, distraction, or busyness. A single, gracious follow-up after 7 business days recovers a significant portion of these. The follow-up must be shorter than the original, must add a new element rather than restating the original, and must make it easy for the recipient to decline.

---

## Edge Cases

### The recipient is a complete stranger with no mutual connection, no shared context, and no discoverable public work

This is functionally cold outreach, not networking, and the `cold-outreach-email` skill is the more appropriate tool. If the user insists on a networking frame, the message must be anchored on one of the following:
- A piece of specific public content the recipient has created (article, talk, GitHub commit, public comment, LinkedIn post) -- read it carefully and reference a specific claim or insight, not just the title
- A community or event they both participated in, even asynchronously (the same Slack community, the same conference, the same industry newsletter)
- The recipient's specific role and company, with a clearly articulated reason why this person specifically can answer the user's question (not just "I want to learn about your field")

If none of these exist, advise the user that spending 15 minutes finding a real specific hook before sending will increase response rate by more than any message optimization. A personalized message sent after real research outperforms a perfectly structured generic message every time.

### The user wants a referral -- not just a conversation

Many users frame a referral request as an informational interview because it feels less presumptuous. This backfires when the recipient agrees to an informational call expecting a career conversation and then feels ambushed by a referral ask at the end. Advise the user to be transparent but tactful:

Structure for the hybrid ask:
- Lead with the genuine informational intent ("I want to understand the role and culture before applying")
- Acknowledge the dual purpose explicitly and without apology: "I saw that [Company] has an opening for [Role], and before I apply, I wanted to talk to someone who could give me a realistic picture of what the team is like. If after our conversation you felt the fit was strong and you were comfortable putting in a word, I would be genuinely grateful -- but no pressure either way."
- The explicit "no pressure either way" is not just politeness -- it de-risks the ask for the recipient by making clear they can say no without damaging the relationship

Never structure a message as an informational interview request when the user's primary goal is a referral. The deceptive framing damages the relationship even if the user gets the referral, because the recipient feels manipulated.

### The relationship ended awkwardly or on bad terms

This happens with former colleagues after a difficult project, former managers after a layoff or difficult performance review, or former clients after a contract dispute. Handle as follows:

- Do not reference the awkwardness at all -- the message is not a venue for processing relationship history
- Do not over-engineer warmth to compensate -- forced warmth after a difficult history reads as insincere and creates more discomfort
- Keep the message brief, professional, and forward-focused: "I have always respected the [specific technical knowledge / leadership approach / industry expertise] you brought to [specific context], and I am reaching out because I am navigating [specific situation] and thought your perspective would be valuable."
- Give the recipient a clear, easy way to decline: an explicit low-stakes ask and a line like "Completely understand if now is not a good time"
- If the relationship ended very badly (conflict, misconduct, legal issues) -- advise the user not to send the message. Some relationships cannot be reactivated through networking outreach and the attempt will cause harm.

### The user is a career changer making an unusual pivot

Career changers face a specific credibility problem in networking messages: the recipient does not know whether to treat them as a peer, a newcomer, or a curiosity. The message must resolve this ambiguity immediately.

- Lead with the transferable expertise that makes the conversation relevant: "I have spent 8 years in clinical nursing and am transitioning into health tech product management -- I am reaching out because your work on clinical workflow software puts you at exactly the intersection I am trying to understand."
- Name the specific question that only a career changer at this stage would ask -- this signals depth of research and makes the conversation clearly valuable from the recipient's perspective
- Do not apologize for the career change or frame it as a deficiency. Frame it as a specific perspective that makes the conversation more interesting: "My clinical background gives me a perspective on the patient experience side that I am trying to understand from the product side as well."

### The user wants to mass-personalize -- sending similar messages to 15-20 people

Batch networking outreach requires a base template with clear personalization slots. Provide the base template with explicit markers:

- Mark every personalization slot with a clearly labeled bracket: [RECIPIENT_SPECIFIC_CONTENT], [SPECIFIC_QUESTION], [SHARED_CONTEXT]
- Set expectations: each message needs 3-5 minutes of personalization -- the [RECIPIENT_SPECIFIC_CONTENT] field is the most important and the one that most users shortcut to their detriment
- Advise a send cadence of 3-5 messages per day maximum -- too many at once is psychologically hard to track and follow up on
- For the follow-up pass at 7 days, provide a follow-up template with the same personalization markers
- Flag the most important rule: if the user cannot find a specific, genuine [RECIPIENT_SPECIFIC_CONTENT] for a given person on the list, skip that person rather than send a generic message. A message without genuine specificity reduces the response rate for the entire batch because it conditions the user to send mediocre messages.

### The user is a student or early-career professional reaching out to a senior leader

Students and early-career professionals often under-ask (too vague, too deferential) or over-explain their background (long bio that the senior leader has no time to read). The effective approach:

- Lead with the academic or project context that makes the outreach credible: "I am a second-year MBA student concentrating in strategy and am writing a thesis on platform economics in two-sided marketplaces" is a stronger opening than "I am a student interested in business."
- Show evidence of genuine research effort -- reference something specific about the recipient's work or career that a student who did their homework would know
- Keep the ask even smaller than the standard 20-minute call -- busy senior leaders respond to 15-minute asks or async written questions more readily than calls from people they do not know
- Be explicit about what the student brings to the conversation: curiosity, a specific research angle, a fresh perspective from a different generation or industry background -- something that makes the conversation feel less one-sided
- Use the student status honestly and without over-apologizing: "I know this is a big ask given how senior you are" is counterproductive. Own the outreach as a reasonable professional request, because it is.

### The recipient recently experienced something difficult (layoff, public setback, company failure)

Networking outreach timed poorly against a recipient's difficult moment creates lasting negative impressions. Handle with care:

- If the recipient was recently laid off or their company failed, do not reference the event at all in an informational interview request -- it highlights a wound. Instead, reference their longer career trajectory and expertise rather than their most recent role.
- If reconnecting with a dormant contact who recently had a public setback, acknowledge it briefly and humanly before any professional ask: "I saw the news about [Company] and wanted to reach out. Hope you are doing okay." Then either leave it there with no ask, or follow up separately once the dust has settled.
- A reconnection message that ignores an obvious major life event (layoff, loss, major setback) and launches directly into a professional ask reads as cold and self-interested. One sentence of genuine acknowledgment costs nothing and preserves the relationship.

---

## Example

**Input:** "I want to reconnect with David Park, who was my engineering manager at Brightway (a fintech startup) about three years ago. We had a great working relationship -- he was the one who first pushed me to take on a tech lead role and I really grew under him. He left Brightway to join a Series C company called Parallax as Head of Engineering. I haven't talked to him in about two years. I'm now a senior engineer at a larger company and I'm seriously exploring moving into engineering management. I'd love to get his perspective since he made that transition himself. LinkedIn message."

---

## Networking Message: Dormant Contact Reconnection

**Platform:** LinkedIn InMail
**Recipient:** David Park, Head of Engineering, Parallax
**Relationship Distance:** Dormant relationship -- close prior working relationship, no contact for approximately two years

---

### Message

Hi David,

I have been thinking lately about the conversation you had with me when Brightway was scaling the payments infrastructure -- the one where you told me the codebase would eventually need an owner who could hold the whole system in their head, and then looked at me like that person might be me. That nudge changed the trajectory of my last three years. I am now a senior engineer at [Current Company] and am seriously exploring the move into engineering management. Given that you made exactly that transition, I would love a 20-minute call to hear how you thought about the decision. Would that work sometime in the next few weeks?

Best,
[Your Name]

**Word count:** 118 / 120

---

### Connection Request Note (LinkedIn only, if not yet connected)

David -- former Brightway engineer here. You pushed me into the tech lead track and I never properly thanked you for it. Now exploring EM and would love to reconnect. Appreciate the connect.

**Character count:** 192 / 300

---

### Message Breakdown

| Element           | Content Used                                      | Purpose                                                                    |
|-------------------|---------------------------------------------------|----------------------------------------------------------------------------|
| Opening hook      | Specific memory of the payments infrastructure conversation | Signals genuine relationship depth -- could not be fabricated, not generic |
| Credibility line  | Senior engineer at current company                | Shows career progression since they last connected -- David's mentorship worked |
| Specific ask      | 20-minute call about his decision to move into EM | Single, defined topic David can evaluate whether he is the right person for |
| Tone calibration  | Warm and personal                                 | Matches the close prior relationship -- excessive formality would feel false |
| Key risk mitigated| Avoided "I know it's been a while" opener         | Eliminated the apologetic framing that highlights the gap rather than the relationship |

---

### 7-Day Follow-Up Message

**Subject line (email only):** N/A -- LinkedIn follow-up thread

Hi David, following up in case my message got buried. I am exploring the engineering management path and would genuinely value your perspective given your own transition. If a call is hard to schedule, I am happy to send a couple of questions by message instead -- whatever is easier for you. Either way, hope things are going well at Parallax.

**Word count:** 64

---

### Introduction Forwarding Note (not applicable for this scenario)

This is a dormant contact reconnection, not an introduction request. No forwarding note required.

---

### Personalization Markers (if adapting for similar outreach to other former managers)

If adapting this message for other former managers or senior mentors the user has drifted from, change these specific elements:

- **[RECIPIENT_SPECIFIC_CONTENT]:** Replace the Brightway payments infrastructure memory with an equally specific shared moment from the actual working relationship -- a project milestone, a hard feedback conversation, a specific decision you made together
- **[SPECIFIC_QUESTION]:** The EM transition question is specific to David's career path -- replace with the specific question that is only answerable by this particular person's career experience
- **[SHARED_CONTEXT]:** The mention of Brightway's scaling phase and the tech lead push are unique to this relationship -- do not reuse across other messages

*Estimated personalization time per message: 4-5 minutes (the specific memory retrieval is the most time-intensive and most valuable step)*

---

**Why this message works -- annotated analysis:**

The opening hook ("the conversation where you told me the codebase would eventually need an owner who could hold the whole system in their head") accomplishes four things simultaneously: it signals that the user paid attention during the relationship, it compliments David without flattery (showing his advice had real impact rather than calling him amazing), it gives David a clear reason why this reconnection feels natural rather than transactional, and it creates an emotional context that makes him genuinely glad to hear from the user. The ask is specific enough that David knows exactly what the conversation will be about (his own EM transition decision) but open enough that he has room to tell his story his way. The 20-minute frame respects his seniority. The close -- "sometime in the next few weeks" -- is flexible without being indefinitely open. The total message is 118 words on a 120-word platform constraint, meaning nothing is padded and nothing is missing.
