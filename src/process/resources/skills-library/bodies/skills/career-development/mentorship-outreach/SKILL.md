---
name: mentorship-outreach
description: |
  Writes a personalized mentorship request message that is specific, time-respectful,
  and contains a clear ask. Produces a ready-to-send outreach message.
  Use when the user wants to reach out to a potential mentor, ask someone for career
  guidance, or write a message requesting an informational conversation or ongoing
  mentorship relationship.
  Do NOT use for cold outreach for job opportunities (use cold-outreach-email),
  networking event follow-ups (use networking-message-writer), or recruiter messages
  (use recruiter-outreach).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "career writing template"
  category: "career-development"
  subcategory: "career-growth"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Mentorship Outreach

## When to Use

Use this skill when the user's primary goal is to establish a guidance relationship or learning conversation with a more experienced professional -- not to get a job, not to network broadly, but specifically to learn from someone's experience and expertise.

**Trigger scenarios:**
- User wants to write a message asking a specific person to serve as a mentor, formal or informal
- User needs to request a 20-30 minute informational conversation with a senior professional they have not met before
- User wants to reach out to someone they met briefly (conference, workshop, webinar) to continue a specific professional conversation
- User wants to reconnect with a former manager, professor, or colleague and ask for career guidance after a period of no contact
- User is attempting to build a mentorship relationship with someone inside their own company who they do not report to
- User wants to reach out to the author of a book, article, or course that influenced their work
- User needs to write a follow-up message after a first mentorship conversation to maintain the relationship

**Do NOT use this skill when:**
- User wants to ask for a job referral or introduction to a hiring manager -- use `cold-outreach-email` instead, which is designed for transactional professional asks
- User is following up after a networking event where cards were exchanged or connections were made in a social context -- use `networking-message-writer` instead
- User is reaching out to a recruiter or talent acquisition professional -- use `recruiter-outreach` instead
- User wants to pitch themselves for a speaking slot, advisory board role, or collaboration -- those are value-exchange propositions, not mentorship requests, and require a different framing
- User wants to send a mass outreach to multiple potential mentors using the same template -- this skill produces individualized messages only; template-blasting is the single fastest way to get no responses and damages professional reputation

---

## Process

### Step 1: Gather the Critical Context Before Writing Anything

Do not draft a single sentence until you have the following. If the user has not provided it, ask directly. Generic information produces generic messages, and generic messages do not get responses.

- **Recipient identity:** Full name, current title, current company, and how the user knows about this person (found via LinkedIn, heard speak, read an article, referred by someone)
- **The specific hook:** What single piece of the recipient's work, writing, career history, or stated experience is the user connecting to? This must be concrete -- a specific talk title and one idea from it, a specific article and a specific argument in it, a specific career transition the recipient made, a named project they led. "I admire your career" is not a hook.
- **The user's current situation:** Current role, company type (startup vs. enterprise, industry), years of experience, and the specific problem or decision they are facing
- **The specific guidance topic:** What exact question or challenge does the user want to discuss? "Career advice" is not specific. "How to evaluate whether to take a people manager track versus an individual contributor track at the senior engineer level" is specific.
- **The ask format:** One-time 20-minute call, email exchange, or ongoing relationship? Default to a one-time 20-minute call unless the user has a compelling reason otherwise.
- **The delivery channel:** LinkedIn message, email, Twitter/X DM, or through a mutual connection. Each has different word count limits and tone conventions.
- **Mutual connection:** If a mutual connection suggested this outreach or can be named, this is the single highest-value piece of information. Always ask if one exists.

If any of these elements are missing and cannot be inferred, ask the user before drafting. Do not fabricate specificity.

---

### Step 2: Assess the Relationship Distance and Calibrate Accordingly

Not all mentorship outreach is the same. The appropriate message tone, length, and ask size depends on the relationship distance between the user and the recipient. Apply this framework:

**Tier 1 -- Warm connection (former colleague, former professor, referred by a mutual friend who knows both parties well):**
- Lead immediately with the mutual connection or shared history
- Can ask for slightly more time (30 minutes vs. 20) without seeming presumptuous
- Can be slightly more personal in tone
- Word count ceiling: 200 words (email), 175 words (LinkedIn)

**Tier 2 -- Semi-warm connection (met briefly at an event, interacted online, has read the person's public work, same professional community):**
- Reference the specific point of contact immediately -- the event, the article, the comment thread
- Stick to 20-minute ask
- Moderate formality
- Word count ceiling: 175 words (email), 150 words (LinkedIn)

**Tier 3 -- Cold outreach (no prior contact, found via LinkedIn search, referenced in an article, prominent public figure):**
- Reference the most specific and credible piece of their public work you can find
- Ask for the smallest viable commitment (15-20 minutes, or even a single email response to one question)
- Maximum brevity and precision
- Word count ceiling: 150 words (email), 100 words (LinkedIn)
- For very senior or prominent recipients (VP+, published authors, public figures), target 100 words total across all channels

This calibration prevents the most common failure mode: the user treats a cold outreach with the warmth and length appropriate for a warm connection, which reads as presumptuous and inflates the perceived time cost.

---

### Step 3: Construct the Message Architecture

Every mentorship outreach message follows this five-component structure, in this order. Each component has a specific job and a specific length target:

**Component 1 -- The Credibility Bridge (1-2 sentences, first priority):**
This answers the recipient's first question: "Why is this person writing to me specifically?" Lead with the mutual connection name if one exists. If no mutual connection, open with the specific reference point -- the talk, article, or career move -- not with who the user is. Opening with "My name is X and I work at Y" is a wasted first sentence on a senior person who gets 50 messages a week.

*Strong:* "I read your piece in [Publication] on zero-trust architecture and your argument about identity perimeters replacing network perimeters changed how I presented our security roadmap to our board."
*Weak:* "My name is Alex and I'm a security engineer who really admires your work."

**Component 2 -- The User's Situation (2-3 sentences, second priority):**
Give the recipient enough context to understand who is asking and why the specific guidance topic matters to this specific person right now. Include: current role, relevant experience level, and the precise challenge or decision they are facing. Do not include resume details, educational history, or past accomplishments unless directly relevant to the ask.

*Strong:* "I'm a security engineer three years in, currently leading the first formal security program at a 150-person SaaS company. We're about to migrate to a cloud-native architecture and I'm trying to decide how to sequence the identity and access management rollout."
*Weak:* "I'm a security engineer with experience in several environments looking to grow my career."

**Component 3 -- The Specific Ask (1-2 sentences, third priority):**
Name exactly what you are requesting. Include: the format (call, email exchange), the time commitment in minutes, and the specific topic -- stated as a concrete question if possible. The ask must be the smallest viable commitment that would genuinely help the user. This signals respect and gives the recipient a clear, low-friction decision to make.

*Strong:* "Would you have 20 minutes for a call about how you approached sequencing the IAM rollout at [Company] -- specifically the decision of whether to tackle workforce identity or customer identity first?"
*Weak:* "I'd love to pick your brain about security architecture if you have time."

Never use "pick your brain." It signals that the user has not thought carefully about what they actually want. Replace it with the specific question.

**Component 4 -- The Easy Off-Ramp (1 sentence, fourth priority):**
Every message must include a sentence that makes it genuinely easy to decline. This is not a polite formality -- it is a strategic choice. Recipients who feel they can easily say no are more likely to say yes. Recipients who feel pressured or trapped by a request often simply ignore it.

*Strong:* "If your schedule doesn't allow it, I completely understand and appreciate you reading this far."
*Acceptable:* "No pressure at all if the timing isn't right."
*Never:* "I'll follow up next week if I don't hear back." (deadline pressure)
*Never:* "I know you're busy but..." (self-undermining and sycophantic)

**Component 5 -- The Close (1 sentence maximum):**
A simple expression of appreciation. Not effusive, not self-deprecating. "Thank you for your time." or "I appreciate you considering it." is sufficient. Nothing more.

---

### Step 4: Apply the Specificity Test Before Drafting

Before writing the full message, run the user's information through this three-part test:

1. **Name test:** Could this exact message be sent to 10 different people with only the name changed? If yes, it is not specific enough. The message should contain at least one detail that is only true of this recipient.

2. **Research test:** Does the user's reference point prove they have engaged with the recipient's actual work? Listing someone's job title does not count. Quoting a specific idea from a specific piece of work does count.

3. **Ask test:** If the recipient asked "what exactly do you want to talk about?", does the message already answer that question? If the user would need to explain further, the ask is not specific enough.

If the user's provided information fails any of these tests, ask follow-up questions before drafting. It is better to produce one excellent message than to draft a passable message that gets no response.

---

### Step 5: Draft the Message for the Specific Channel

Apply channel-specific constraints:

**LinkedIn message:**
- Hard ceiling: 150 words (300-character subject field if using InMail, but standard messages have no subject line)
- Tone: Professional but conversational -- LinkedIn is a social platform
- No formal salutation like "Dear [Name]" -- use "Hi [Name]"
- No signature block needed -- your profile is visible
- Avoid bullet points -- prose reads better in LinkedIn's message interface
- Do not attach anything -- LinkedIn does not support attachments in standard messages

**Email:**
- Hard ceiling: 200 words (body text)
- Subject line required -- see subject line formula below
- Slightly more formal than LinkedIn but still approachable
- Use a simple closing: "Best regards," or "Thank you,"
- Include name and title (or brief identifier) in signature

**Subject line formula for email:**
The subject line serves one purpose: getting the email opened. Three formulas that work for mentorship outreach:
- **Mutual connection lead:** "[Name] suggested I reach out -- [specific topic]" -- highest open rates
- **Specific content reference:** "Question about your [Article/Talk] on [Specific Topic]"
- **Direct role-specific subject:** "[User's role] seeking 20 minutes on [specific topic you covered]"

Never use: "Quick question" (vague), "Hi!" (unprofessional), "[User's name] -- mentorship request" (makes the ask before establishing value), or anything that sounds like a mass email subject line.

**Twitter/X DM or similar platforms:**
- Maximum 100 words
- Often appropriate to reference a specific tweet or thread they posted
- Acknowledge the unusual nature of the outreach briefly: "I know this is an unusual channel..."
- Ask for the smallest possible commitment: a single question, a recommendation for a resource, or an email address to send a more detailed note

---

### Step 6: Review Against the Quality Checklist

Before producing the final message, verify every item on this list:

- [ ] Opens with the specific reference point or mutual connection name, NOT with "My name is"
- [ ] Contains exactly one piece of specific evidence that proves the user read/watched/engaged with this recipient's actual work
- [ ] Does not use "pick your brain"
- [ ] Does not use "mentor" or "mentorship" in the first ask (too big an initial ask -- a conversation first)
- [ ] The time ask is stated in minutes (20 minutes, not "a quick chat")
- [ ] Includes an easy off-ramp sentence
- [ ] Does not contain deadline language ("I'll follow up by Friday")
- [ ] Does not reference the user's resume, portfolio, or LinkedIn profile
- [ ] Does not include a job ask, referral ask, or introduction request
- [ ] Word count is within channel limits

---

### Step 7: Produce the Final Output and Stats Block

Produce the complete, ready-to-send message in the output format below. Follow the message immediately with the stats block. The stats block is for the user's benefit -- it makes explicit what choices were made and why, helping them understand the strategy so they can adapt future messages themselves.

If a subject line is needed, produce it separately above the message. Do not embed the subject line inside the message body.

---

### Step 8: Anticipate Follow-Up Needs

After producing the message, briefly note:
- If the user asks about following up after no response: wait 7-10 days minimum, send one follow-up under 60 words that adds a new reference point, never send a third message to the same person within a 90-day window
- If the user asks what to do if the person responds positively: offer to help them prepare for the actual conversation (goals, questions to ask, how to make the call valuable for both parties)
- If the user reports receiving a "no" or no response: this is expected at a 20-40% response rate even for well-crafted messages; encourage them to send to additional contacts and treat each message as a skill they are developing

---

## Output Format

```
## Mentorship Outreach Message

**To:** [Recipient full name, title, company]
**Channel:** [LinkedIn / Email / Twitter DM / Other]
**Subject:** [Subject line -- email only; "N/A" for LinkedIn and other channels]
**Relationship Tier:** [Warm / Semi-warm / Cold]

---

[Complete, ready-to-send message text. No placeholders except for items the
 user explicitly must fill in, which are marked in brackets like [Meetup Name]
 with a note explaining what to insert.]

---

**Notes for user:**
[Any bracketed items in the message that require the user to fill in specific details,
 explained clearly. For example: "[Meetup Name] -- insert the actual name of the meetup
 or event where you saw her speak."]

**Message stats:**
- Word count: [X] words (limit for this channel: [Y] words)
- Relationship tier: [Warm / Semi-warm / Cold]
- Credibility bridge: [One-sentence description of the specific reference used]
- The ask: [The exact request, stated in one sentence]
- Time commitment requested: [X minutes / email exchange]
- Easy off-ramp: [Yes -- quote the specific sentence used]
- "Pick your brain" used: No
- Deadline language used: No
```

For follow-up messages after no response:

```
## Follow-Up Message (Attempt [1 or 2])

**To:** [Recipient full name]
**Channel:** [Channel]
**Days since original message:** [X days]

---

[Complete follow-up message, under 60 words]

---

**Notes:**
- New reference point added: [What new element justifies the follow-up]
- Recommendation if no response after this: [Do not send a third message within 90 days /
  or this is attempt 2, do not follow up again]
```

---

## Rules

1. **Never produce a generic message.** If the user has not provided a specific reference point about the recipient's work, ask for one before writing a single word. A message without a specific reference is worse than no message -- it signals low effort and produces no responses. Do not rationalize incomplete information by writing vague admiration.

2. **Never use "pick your brain."** This phrase is universally recognized as signaling that the sender wants to extract value without having thought about what they specifically need. Replace every instance with a concrete question. There is no acceptable context in which this phrase should appear in a mentorship outreach message.

3. **Never open with "My name is."** The first sentence is the highest-value real estate in a short message. Wasting it on self-introduction -- information the recipient can read in one click on your profile -- signals inexperience with professional communication. The first sentence must establish why THIS recipient is being contacted.

4. **Never ask for "mentorship" in the first message.** Asking a stranger to commit to an ongoing mentorship relationship in a cold message is the equivalent of proposing marriage on a first date. The appropriate first ask is always a single conversation. Ongoing mentorship relationships develop naturally from a series of positive interactions. The word "mentor" can appear in follow-up messages after a relationship has been established, but not in initial outreach.

5. **Enforce word count limits absolutely.** LinkedIn messages over 150 words have measurably lower response rates -- longer messages signal that the writer values their own need to explain over the recipient's time. Email bodies over 200 words for cold or semi-warm outreach have similar drop-off. If the user's context is so complex that it requires more words, that is a signal the ask is too large, not that the word limit should be raised.

6. **Never include deadline language or follow-up threats.** "I'll follow up on Friday if I don't hear back" or "I'm hoping to connect before the end of the month" creates pressure that damages the relationship before it starts. The easy off-ramp must be genuine. If the user wants to follow up, that is a separate message sent after 7-10 days with no response -- it is never pre-announced.

7. **Never attach documents or reference a resume in a mentorship request.** Attaching a resume signals that the ask is actually a job-related request in disguise, which destroys trust immediately. Even in an email, do not include a LinkedIn profile URL in the message body unless the recipient explicitly asks for it. The signature is sufficient.

8. **If a mutual connection exists, lead with their name in the first sentence without exception.** A warm introduction dramatically increases response rates -- research on professional networking consistently shows response rates 3-5x higher for referred contacts versus cold outreach. This is the single highest-leverage element in a mentorship message. Never bury it in the middle of the message.

9. **The specific ask must name the topic, not just the format.** "Would you have 20 minutes for a call?" is incomplete. "Would you have 20 minutes for a call about how you managed the transition from individual contributor to director without losing your technical credibility?" is complete. The recipient should be able to decide immediately whether they have relevant experience to share -- a vague ask forces them to do more work and reduces response rates.

10. **After two follow-up attempts with no response, stop.** Three messages to someone who has not responded is crossing the line from persistent to harassing. The professional community is small. Burning a relationship before it starts by over-messaging has long-term reputational costs. Advise the user to redirect energy to the next potential mentor, not to send a third message.

11. **Never include flattery that cannot be substantiated.** "You're the leading expert in this field" from someone who found the recipient via a LinkedIn search is not credible and reads as manipulative. Flattery should be replaced with specificity: not "you're amazing at scaling teams" but "your framework of hiring for the team you'll have in 6 months rather than the team you have today directly influenced how I wrote our Q3 headcount request."

12. **Recognize when the ask is misclassified and redirect.** If the user says they want mentorship but describes wanting a job referral, introduction to a hiring manager, or someone to review their resume, this is not a mentorship request -- route them to the appropriate skill. Sending a mentorship message when the actual ask is transactional is the most damaging form of professional deception in outreach and permanently closes doors.

---

## Edge Cases

### The user has no specific reference point about the recipient

This is the most common failure mode. A user says "I want to reach out to [Name], a VP of Engineering" but cannot name anything specific about their work. Do not proceed with drafting. Instead, give the user a specific research protocol: (1) Read their LinkedIn profile for career transitions, published posts, or featured articles. (2) Search their name plus their company name to find any interviews, press quotes, or company blog posts they authored. (3) Search the conference circuit in their industry -- most senior practitioners speak at least occasionally. (4) Check if they have a newsletter, substack, or personal site. Require the user to return with at least one specific reference point before drafting. If the user genuinely cannot find anything public, they can reference the recipient's career trajectory itself -- "your move from engineering manager at [Company A] to building the engineering org at [Company B] from scratch" -- but this requires the user to demonstrate they understand what that transition entailed, not just that they saw it on LinkedIn.

### The user wants to ask a very prominent or famous person (widely published author, prominent public speaker, CEO)

Apply extreme brevity and surgical specificity. These recipients receive volume that makes 150-word messages feel long. Target 80-100 words maximum. Make the ask as small as possible -- a single email question, not a call. Reference the most specific and least-obvious element of their work: not the main thesis of a book but a specific argument in a specific chapter, not their most famous talk but an offhand point they made in a Q&A. Consider whether the ask is realistic at all -- some people are simply inaccessible for direct mentorship. If the person has a public Q&A format, newsletter reply option, or office hours structure, use that channel instead of cold outreach.

### The user wants to reconnect with someone they knew well in the past but have not contacted in years

This requires a different opening structure. Do not pretend the gap does not exist -- acknowledge it briefly and naturally. "It's been a few years since we worked together at [Company] -- I hope you're well." Then move directly to the specific reason for reconnecting: what has changed in the user's situation that makes this person's experience relevant now. Do not over-explain the years of silence -- a brief, natural acknowledgment is sufficient. The rest of the message follows standard structure. The word count ceiling is slightly more flexible for warm reconnections (200 words LinkedIn, 250 words email) because the relationship history provides established rapport.

### The user is reaching out to a potential mentor inside their own company (internal mentorship)

Internal outreach requires additional calibration because the relationship will be ongoing and visible within the organization. Avoid anything that could be perceived as bypassing the user's direct manager or attempting to accelerate promotions through informal channels. The message should focus purely on learning a specific skill or navigating a specific career challenge, not on career advancement. If the potential mentor is in the user's direct reporting chain (skip-level manager), acknowledge the organizational relationship briefly: "I've cleared it with [Direct Manager's Name] that I'd like to seek some additional perspective outside our immediate team." For internal outreach, email or an in-person ask is usually more appropriate than LinkedIn -- using LinkedIn for an internal contact can feel oddly formal and may signal that the user is also considering leaving the company.

### The user received no response and wants to follow up

Enforce the 7-10 day minimum before following up. The follow-up message has one job: give the recipient a new, low-effort reason to say yes that they did not have before. Acceptable new elements include: a piece of work the user published, completed, or shipped since the original message (shows forward momentum), a recent piece of the recipient's work that the user just read or engaged with (shows continued genuine interest), or a change in the user's situation that makes the ask more time-sensitive or different in nature. The follow-up must be under 60 words. It must not repeat the original pitch. It must not guilt the recipient ("I know you're very busy but..."). If no response after the follow-up, write no third message within 90 days. After 90 days, a genuine new context -- a different topic, a different circumstance, a mutual connection introduced since then -- can justify a new first message, treated as a fresh outreach.

### The user is a very early-career professional reaching out to someone dramatically senior (10+ year gap)

The primary risk here is that the message reads as naive about the value exchange. Very senior professionals mentoring very junior ones incur significant time cost with lower certainty of a productive conversation. The message must do extra work to demonstrate that the user is serious, has done their homework, and will make the conversation efficient. Include a single brief signal of the user's level of preparation: "I've already [completed a specific course / read [specific book] / talked with three people at your level about X and have a list of specific questions]." Keep the ask very small -- a 15-minute call or a single email question. Demonstrate awareness of the gap with genuine humility, not self-deprecation: "I recognize this is a significant time ask given where I am in my career, which is why I want to be specific about exactly what I'm hoping to learn."

### The user received a positive response and wants to prepare for the actual conversation

This is beyond the scope of drafting the outreach message itself, but commonly follows from this skill. Brief guidance: The user should send a brief pre-call note (3-5 bullet points) 24 hours before the call outlining what they hope to cover -- this makes the senior person's time feel protected and signals respect. The user should prepare 3-5 specific questions, not open-ended ones. The first question should be easy and conversational; the hardest, most specific question should come second when attention is highest. The user should take notes and send a follow-up thank-you email within 24 hours of the call that references something specific the mentor said -- this is the foundation of every subsequent interaction.

---

## Example

### Example 1 -- Cold LinkedIn Outreach, Semi-Warm (Met at an Event)

**Input:**
"I want to reach out to Sarah Chen, VP of Engineering at Meridian Financial. I saw her give a talk at a local ProductCraft meetup about scaling engineering teams from 20 to 100 people. She specifically talked about the transition from a single autonomous team to a multi-team structure and made a point about how most companies hire for the team they have today rather than the team they'll need in six months. I'm an engineering manager leading a 6-person team at a Series B fintech startup and we just got approval to grow to 20 engineers over the next 18 months. I want to send her a LinkedIn message."

**Skill assessment:**
- Relationship tier: Semi-warm (attended her public talk, not a mutual introduction)
- Specific hook: Strong (named talk topic, specific idea about hiring timing)
- Ask: One-time 20-minute call about early-stage scaling
- Channel: LinkedIn -- 150-word ceiling applies
- "Mentor" in first message: Will be avoided -- framed as a conversation

**Output:**

## Mentorship Outreach Message

**To:** Sarah Chen, VP of Engineering, Meridian Financial
**Channel:** LinkedIn
**Subject:** N/A (LinkedIn message)
**Relationship Tier:** Semi-warm

---

Hi Sarah,

Your talk at the ProductCraft meetup on scaling from 20 to 100 engineers stuck with me -- especially the point about hiring for the team you'll need in six months rather than the team you have today. It reframed how I'm thinking about our current moment.

I lead a 6-person engineering team at a Series B fintech company. We just got approved to grow to 20 engineers over the next 18 months, and I'm trying to figure out how to structure that growth without fracturing the collaborative dynamic we've built as a single team.

Would you have 20 minutes for a call about how you approached the single-team to multi-team transition in the early stages -- specifically what you wish you had decided earlier? If your schedule doesn't allow it, I completely understand.

Thank you for your time.
[Your name]

---

**Notes for user:**
No bracketed items require filling in -- all specific details were provided. Confirm the meetup name is "ProductCraft" and that this was the correct event.

**Message stats:**
- Word count: 148 words (limit for LinkedIn: 150 words)
- Relationship tier: Semi-warm
- Credibility bridge: Named the specific meetup, quoted the specific concept about hiring timing
- The ask: 20-minute call about the single-team to multi-team transition and what to decide earlier
- Time commitment requested: 20 minutes
- Easy off-ramp: Yes -- "If your schedule doesn't allow it, I completely understand."
- "Pick your brain" used: No
- Deadline language used: No

---

### Example 2 -- Warm Email Outreach via Mutual Connection

**Input:**
"My former colleague David Kim suggested I reach out to Maria Rodriguez, Director of Product at a health tech startup called Veridian Health. He said she made the transition from general B2B SaaS product management into health tech about three years ago and that she's been open about how hard the regulatory learning curve was. I'm a PM with four years of experience in B2B SaaS -- enterprise HR software specifically -- and I'm seriously considering a move into health tech. I want to understand how HIPAA and FDA constraints actually change the day-to-day PM workflow and what she would have learned earlier if she could. I want to send an email."

**Skill assessment:**
- Relationship tier: Warm (mutual connection suggested outreach, knows both parties)
- Specific hook: Mutual connection name + recipient's personal career transition + specific regulatory topic (HIPAA, FDA)
- Ask: 20-minute call about health tech PM transition
- Channel: Email -- 200-word ceiling, subject line required
- Subject line: Lead with David Kim's name

**Output:**

## Mentorship Outreach Message

**To:** Maria Rodriguez, Director of Product, Veridian Health
**Channel:** Email
**Subject:** David Kim suggested I reach out -- Question about the health tech PM transition

---

Hi Maria,

David Kim suggested I reach out to you. He mentioned you made the move from B2B SaaS product management into health tech about three years ago and that you've been candid about how steep the regulatory learning curve was -- which is exactly what I'm trying to understand before I make a similar move.

I'm a product manager with four years of experience in enterprise HR software. I'm seriously considering health tech roles and my main uncertainty is how the HIPAA and FDA constraints actually change the day-to-day PM workflow -- not in theory, but in practice. David thought you'd have direct perspective on that adjustment.

Would you have 20 minutes for a call about what surprised you most about the regulatory reality of the PM role and what you'd prioritize learning first if you were in my position? I'm happy to work around your schedule. If the timing doesn't work, I completely understand.

Thank you for considering it.

Best regards,
[Your name]
[Title, Company]

---

**Notes for user:**
No bracketed items require filling in beyond your own name, title, and company in the signature.

**Message stats:**
- Word count: 183 words (limit for email: 200 words)
- Relationship tier: Warm
- Credibility bridge: David Kim's direct referral, specific reference to Maria's personal transition timeline and public candor about the regulatory learning curve
- The ask: 20-minute call about HIPAA/FDA day-to-day reality and what to prioritize learning first
- Time commitment requested: 20 minutes
- Easy off-ramp: Yes -- "If the timing doesn't work, I completely understand."
- "Pick your brain" used: No
- Deadline language used: No

---

### Example 3 -- Cold LinkedIn Outreach to a Prominent Public Figure (Author/Speaker)

**Input:**
"I want to reach out to James Okafor. He's a well-known engineering leadership coach who wrote a book called 'The Leverage Point' about how senior engineers build organizational influence without becoming managers. I'm a staff engineer at a 400-person company and I've been stuck trying to get traction on a major architectural proposal. His chapter on 'pre-wiring' decisions before the formal meeting -- getting each stakeholder aligned individually before the room convenes -- is something I tried last month and it actually worked. I want to reach out via LinkedIn."

**Skill assessment:**
- Relationship tier: Cold (no prior contact, prominent public figure, author)
- Specific hook: Very strong (named book, named specific chapter concept, described applying it with success)
- Ask: Must be minimal -- this person receives high message volume. Target a single question or 15-minute call maximum.
- Channel: LinkedIn -- target 100 words for a prominent figure
- Key risk: Over-asking given the recipient's prominence; word count must be aggressive

**Output:**

## Mentorship Outreach Message

**To:** James Okafor, Author / Engineering Leadership Coach
**Channel:** LinkedIn
**Subject:** N/A (LinkedIn message)
**Relationship Tier:** Cold (prominent public figure -- applying 100-word ceiling)

---

Hi James,

Your pre-wiring concept from "The Leverage Point" changed how I approached a major architectural proposal last month -- I aligned each stakeholder individually before the formal review and got my first "yes" after three months of stalled progress.

I'm a staff engineer navigating organizational influence without moving into management, which is essentially what your book is about. I have one specific question I haven't found addressed in the book: how do you handle a stakeholder who agrees privately but reverses in the room under peer pressure?

Would you have 15 minutes, or even a brief reply if a call isn't feasible? I completely understand if your schedule doesn't allow it.

[Your name]

---

**Notes for user:**
No bracketed items require filling in beyond your name.

**Message stats:**
- Word count: 118 words (target for prominent figure: 100-120 words -- slightly above but justified by the strength of the specific reference)
- Relationship tier: Cold -- prominent public figure
- Credibility bridge: Named the book, named the specific concept (pre-wiring), described applying it with a concrete outcome (first yes after three months)
- The ask: 15-minute call OR a brief reply to one specific question (smallest viable commitment offered with a lower-cost alternative)
- Time commitment requested: 15 minutes (or single email reply)
- Easy off-ramp: Yes -- "I completely understand if your schedule doesn't allow it."
- "Pick your brain" used: No
- Deadline language used: No

---

### Example 4 -- Follow-Up After No Response (10 Days Later)

**Input:**
"I sent the LinkedIn message to Sarah Chen 10 days ago and haven't heard back. I want to follow up. Since I sent the original message, I wrote an internal post-mortem on our team's failed Q2 hiring sprint that my company's engineering blog picked up and published externally."

**Skill assessment:**
- Days since original message: 10 days -- follow-up is appropriate (7-10 day minimum met)
- New reference point available: Yes -- published post-mortem on failed hiring sprint (directly relevant to Sarah's expertise)
- This is Follow-Up Attempt 1

**Output:**

## Follow-Up Message (Attempt 1)

**To:** Sarah Chen, VP of Engineering, Meridian Financial
**Channel:** LinkedIn
**Days since original message:** 10 days

---

Hi Sarah,

Following up briefly on my note from last week. Since then, I published a post-mortem on our team's Q2 hiring sprint on [Company]'s engineering blog -- writing it actually clarified exactly what I'm hoping to learn from someone who's navigated this at your scale. The offer for 20 minutes stands if the timing works. No pressure at all if not.

[Your name]

---

**Notes for user:**
Replace [Company] with your company's name. If the blog post has a title, consider naming it: "...a post-mortem titled '[Title]'..." -- this adds one more element of specificity and gives Sarah something she could read before responding.

**Message stats:**
- Word count: 62 words
- New reference point added: Published post-mortem on failed hiring sprint -- relevant to Sarah's scaling expertise and shows forward momentum
- Follow-up attempt: 1 of 2 maximum
- Recommendation if no response: Wait another 7-10 days. If still no response, send a maximum of one additional follow-up only if a genuinely new and significant connection point emerges. After two follow-up attempts with no response, do not message again within 90 days.
