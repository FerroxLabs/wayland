---
name: cold-outreach-email
description: |
  Writes a personalized cold outreach email to a hiring manager or professional
  contact, optimized for response rate. Produces a complete email with subject
  line, body, and call to action that is concise, specific, and avoids generic
  templates. Use when the user wants to email a hiring manager directly, reach
  out to a professional contact about opportunities, or write a cold email for
  job search purposes. Do NOT use for recruiter messages (use recruiter-outreach),
  networking messages for informational interviews (use networking-message-writer),
  or post-interview thank-you emails (use thank-you-email-writer).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "career email writing template"
  category: "career-development"
  subcategory: "job-search"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Cold Outreach Email

## When to Use

Use this skill when any of the following triggers are present:

- The user wants to email a hiring manager, team lead, department head, or engineering director directly about a specific open role they found on a job board, LinkedIn, or company careers page
- The user wants to bypass the applicant tracking system (ATS) and get their application in front of a human decision-maker before or alongside a formal submission
- The user found a company they are excited about and wants to reach out to a relevant leader even when no specific role is posted, to introduce themselves and express interest in future openings
- The user wants to email someone they identified through LinkedIn, a conference talk, a published article, a podcast appearance, or open-source contribution -- someone they have never met but have researched
- The user has a company referral from a mutual connection but wants to send a direct email rather than go through the recruiter pipeline
- The user is a contractor, consultant, or freelancer who wants to initiate contact with a potential client or employer through a direct, professional email

**Do NOT use this skill when:**

- The user wants to message a recruiter or staffing agency contact -- use `recruiter-outreach`, which handles different tone, content, and ask structure specific to recruiters
- The user wants to request an informational interview, reconnect with a dormant contact, or ask for career advice from someone they have met before -- use `networking-message-writer`, which is built for warm and semi-warm outreach
- The user wants to write a post-interview thank-you note or follow-up after meeting someone in person -- use `thank-you-email-writer`
- The user wants to write a formal cover letter to submit through an application portal -- use `cover-letter-writer`, which is structured for ATS intake and hiring committee review
- The user wants to send a connection request on LinkedIn with a note -- the character constraints and social norms of LinkedIn require a different approach; refer to the LinkedIn Outreach edge case in this skill for guidance, but default to `networking-message-writer` if the primary goal is building a relationship rather than applying to a role

---

## Process

### Step 1: Gather Outreach Context

Before writing a single word of the email, collect all required inputs. Missing information produces generic emails that do not get responses. Ask the user directly for anything missing.

- **Recipient information:** Full name, exact title (not approximated), company name, department if known, and the city or region of their office (for send-time optimization)
- **Discovery source:** How did the user find this person? LinkedIn search, company website, a conference talk, a published article, a mutual connection's recommendation, a GitHub profile, a podcast appearance, an open-source project? The discovery source often contains the personalization hook
- **Role context:** Is there a specific job posting? If yes, get the exact job title as posted, not the user's interpretation of it. If no posting exists, what type of role is the user targeting?
- **Primary qualification:** What is the single most relevant thing this person has done that makes them valuable to this specific team? Push the user to one sentence and one metric if possible -- "8 years of Python experience" is weaker than "built a Python-based ML inference pipeline processing 500K predictions per hour at scale"
- **Personalization hook:** What specific, verifiable thing does the user know about this recipient's work, decisions, or output? This cannot be fabricated or vague. "I read your team's engineering blog post about migrating from monolith to microservices" is valid. "I admire your company's innovation" is not
- **Connection type:** Cold (no connection), warm-cold (one degree of separation, mutual contact), or referral (mutual contact specifically suggested reaching out)
- **User's name, current role, and the company they currently work for** -- these establish immediate credibility without requiring a resume

### Step 2: Classify the Outreach Type and Set Strategy

Not all cold outreach emails are the same. Classify the situation before writing, because it changes the opening sentence, the ask, and the subject line strategy.

- **Type 1 -- Role Exists, Direct Apply:** There is a specific job posting and the user wants to contact the hiring manager or team lead directly, either before or alongside submitting a formal application. Strategy: Reference the specific role early, lead with the credential that maps most directly to the job description, and make the ask about the role specifically. This is the highest-urgency scenario -- the role is live and the user should send within 24-48 hours of applying
- **Type 2 -- Role Exists, Pre-Apply:** The user wants to make contact before submitting the application, hoping to get a warm connection that helps their application stand out. Strategy: Express interest in the role, but frame the outreach as seeking context about the team rather than asking for a favor. This is a slightly lower-friction version of Type 1
- **Type 3 -- No Role Posted, Exploratory Interest:** The user wants to introduce themselves to a company or team they admire in case a role opens. Strategy: Frame as introducing a capability or skillset that is relevant to the team's known challenges, not as asking for a job. Never assume a role will open -- signal availability without desperation
- **Type 4 -- Referred Outreach:** A mutual contact specifically recommended reaching out. Strategy: Lead with the referral name in the first sentence, every time, without exception. A referral bumps response rates significantly and changes the entire dynamic of the email from cold to semi-warm

### Step 3: Research the Recipient for the Personalization Hook

The personalization hook is the single element that separates a 5% response rate email from a 25-35% response rate email. Help the user find a real hook if they do not have one.

- **LinkedIn activity:** Recent posts, articles they authored, projects they listed, skills they highlighted. A post they wrote three months ago about a technical challenge is a valid hook
- **Company engineering or product blog:** Many technical leaders author or are quoted in internal blog posts. Citing a specific post by title or topic is high-signal personalization
- **Conference talks and panels:** Check conference websites, YouTube, and event recaps. If the recipient gave a talk at KubeCon, re:Invent, SREcon, PyCon, or any domain-relevant event, citing a specific insight from that talk is extremely powerful
- **Open-source contributions:** GitHub profiles, PRs merged into significant projects, maintainer roles. This is particularly valuable for engineering roles
- **Podcast appearances or media coverage:** A quote in a TechCrunch article or a guest appearance on a relevant podcast provides concrete, citable material
- **Company news and press releases:** Funding rounds, product launches, acquisitions, major hiring announcements. These provide context for why the user is reaching out now and signal genuine interest in the company's trajectory
- **Academic or research publications:** For scientific, data, or research-adjacent roles, citing a published paper or methodology is a strong hook

If no personalization information is available after a reasonable research effort, do NOT fabricate it. Use team-level or company-level personalization instead, and note to the user that individual-level research before sending will significantly improve their chances.

### Step 4: Write the Subject Line (Three Options)

The subject line is the only thing standing between the email and the trash folder. It determines open rate. Generate three options using distinct strategies, then recommend the strongest.

- **Strategy A -- Role + Credential:** Combine the specific role title with the user's single most relevant credential or achievement. Example: "Senior ML Engineer -- PyTorch + Production LLM Deployment" or "Head of Growth referral -- $0 to $40M ARR in 18 months." This works best for Type 1 and Type 2 outreach where a role is posted
- **Strategy B -- Personalization Reference:** Reference the recipient's specific work, content, or decision directly in the subject line. Example: "Your microservices migration post -- a related question" or "Your KubeCon talk on eBPF observability." This works best when the user has strong research on the recipient and creates curiosity through specificity
- **Strategy C -- Referral Lead:** If the user was referred, lead with the referral name. Example: "Referred by Marcus Torres -- Senior Product Designer" or "[Mutual Contact] suggested I reach out." This is the highest-performing subject line type when applicable. A known name in the subject line increases open rates dramatically
- **Length constraint:** Keep all subject lines under 60 characters to avoid truncation in most email clients. Under 50 characters is ideal for mobile preview. Count characters including spaces and provide the count next to each option
- **Avoid at all costs:** "Quick question," "Following up," "Job inquiry," "Exciting opportunity," "Touching base," "I'd love to connect," and any subject line with an exclamation mark. These are pattern-matched by the human brain as spam or low-value before the email is opened

Recommend the strongest option with a one-sentence rationale. The referral lead wins if applicable. Otherwise, favor the subject line that is most specific to the recipient's actual work.

### Step 5: Write the Email Body Using the 4-Sentence Structure

The email body follows a precise 4-sentence structure. Each sentence has exactly one job. The total body must be under 125 words. Count the words. Every word above 125 reduces the probability of a response because longer emails signal either desperation or an inability to communicate concisely -- both are damaging signals.

- **Sentence 1 -- The Connection Hook:** This sentence establishes why you are writing to THIS person, not any other person at this company. It must reference something specific and verifiable. The formula is: "[Specific thing they did or said] [brief statement of why it resonated with you or what reaction it produced]." Examples:
  - "Your team's open-source release of the stream processing library caught my attention -- it solves a batching problem I have been navigating in production for two years."
  - "Your KubeCon talk on stateful workload scheduling described a tradeoff I ran into directly when migrating our platform to Kubernetes 18 months ago."
  - "Marcus Torres mentioned you are rebuilding the data infrastructure at Meridian -- that is exactly the problem space I have been working in for the past four years."
  - Never write: "I came across your profile on LinkedIn and was impressed." That sentence could apply to anyone and signals that no research was done

- **Sentence 2 -- The Credibility Statement:** This sentence is the one thing about the user that makes them relevant to this team. One sentence. One metric if possible. The format is: "I am a [role/identity] who [specific achievement with scope or scale]." Examples:
  - "I am a backend engineer with 7 years of Go experience who most recently built a real-time ingestion system processing 4 million events per day at Stripe."
  - "I lead growth at a Series B SaaS company where I took organic acquisition from 3K to 45K monthly signups in 14 months through content and SEO."
  - If the user has no strong metric, use scope: company name (if recognizable), team size owned, product impact (users, revenue), or a specific technical decision they led

- **Sentence 3 -- The Value Framing:** This sentence explains what the user would bring to this team's specific problem -- not what the user wants from them. The frame is contribution, not request. This is where most cold emails fail: they pivot to what the user needs ("I am looking for a new opportunity") rather than what they offer. Examples:
  - "I would be excited to bring that production experience to DataFlow's infrastructure work, particularly as your team scales the stream processing layer."
  - "I think the systems design experience maps directly to the scale challenges your platform team appears to be navigating."
  - Connect explicitly to something you know about the team's current work, challenges, or direction -- use the research from Step 3

- **Sentence 4 -- The Ask:** One ask. Low friction. Specific. The best cold email asks are yes/no questions with a clear time constraint. The 15-minute call is the gold standard because it respects the recipient's time and is easy to say yes to. Alternatives include a specific question ("Would you be the right person to speak with about this opening, or should I connect with someone else on your team?") or a document offer ("Would it be helpful if I shared the architecture doc for the pipeline I mentioned?"). Never ask for an hour. Never ask for a coffee meeting. Never leave the ask open-ended ("I would love to connect sometime"). Examples:
  - "Would you be open to a 15-minute call about the Senior Backend Engineer role?"
  - "Would you be willing to share whether there are or will be openings on your data engineering team in the next quarter?"
  - "If this is relevant, would a brief conversation make sense?"

- **Closing:** Sign with "Best," or "Thanks," -- never "Warmly" (too casual), "Sincerely" (too formal), "Cheers" (too casual for cold outreach), or "Looking forward to hearing from you" (presumes a response). Include the user's full name. No title, no phone number, no LinkedIn URL in the first email -- this is not a business card, it is a message

### Step 6: Write the Follow-Up Email

Every cold outreach package includes exactly one follow-up. The follow-up is sent 5-7 business days after the initial email if no response is received. It is the final attempt -- never send a third cold email to the same person.

- **Length:** Under 60 words. Shorter than the original. The follow-up demonstrates persistence without desperation
- **Tone:** Matter-of-fact, not apologetic. "I wanted to follow up" is appropriate. "I know you're incredibly busy and I'm so sorry to bother you again" is not appropriate -- it positions the user as a supplicant and makes the recipient feel guilty, which is counterproductive
- **New value element:** The follow-up should add one piece of new information or value that the original email did not contain. This might be: a relevant article the user found about the company's problem space, a specific insight the user had after reviewing the recipient's work further, a new development in the user's own career ("I just completed a certification in" or "I shipped a feature this week that is directly relevant"), or a specific observation about something the company recently announced
- **Same ask, slightly reframed:** Repeat the ask from the original email, but rephrase it slightly so it does not feel like a copy-paste. If the original asked about a 15-minute call, the follow-up might say "Would a brief conversation still make sense?"
- **Reply threading:** The follow-up should be sent as a reply to the original email (Re: [Subject Line]) so the recipient can see the previous message without searching their inbox. Provide the subject line in Re: format

### Step 7: Assemble the Output and Provide Send Guidance

Deliver the complete outreach package with all components:

- Three subject line options with character counts and a recommendation
- The complete email body, ready to copy and send, with a word count
- The follow-up email, with subject line in Re: format and a word count
- Outreach notes in table format (see Output Format)
- Optimal send time guidance: Tuesday through Thursday, 8:00-10:00 AM in the recipient's time zone, or 4:00-5:00 PM if they appear to be a senior leader who processes late-day email. Avoid Monday (high inbox volume from the weekend), Friday (low response intention), and any day immediately before or after a major holiday
- One specific note if the user should submit a formal application in addition to the email -- for Type 1 and Type 2 outreach, always recommend applying through the official channel as well, because many hiring managers will check the ATS before responding to confirm the candidate is officially in the system

---

## Output Format

```
## Cold Outreach Email: [Recipient Full Name] at [Company Name]

---

### Context Summary

| Field | Details |
|-------|---------|
| Recipient | [Name], [Title], [Company] |
| Outreach type | [Type 1 / Type 2 / Type 3 / Type 4 -- with one-line description] |
| Personalization hook | [Specific reference to recipient's work, content, or referral source] |
| Key qualification | [Single credential with metric] |
| Ask | [Exact ask being made] |

---

### Subject Line Options

1. [Subject line -- Strategy A: Role + Credential] ([X] chars)
2. [Subject line -- Strategy B: Personalization Reference] ([X] chars)
3. [Subject line -- Strategy C: Referral Lead OR backup option if no referral] ([X] chars)

**Recommended:** Option [#] -- [one sentence explaining why this subject line wins for this specific situation]

---

### Email Body

**Subject:** [Recommended subject line]

Hi [Recipient First Name],

[Sentence 1: Connection hook -- specific, verifiable reference to their work or the referral]

[Sentence 2: Credibility -- single strongest qualification with metric or scope]

[Sentence 3: Value framing -- what you bring to their specific team or problem]

[Sentence 4: Ask -- one low-friction yes/no or specific request]

Best,
[User's Full Name]

**Word count:** [X] / 125 maximum

---

### Follow-Up Email

*Send [X] business days after initial email if no response. This is the final outreach attempt.*

**Subject:** Re: [Original subject line]

Hi [Recipient First Name],

[Sentence 1: Brief reference to original email without guilt or apology]

[Sentence 2: New value-add -- insight, observation, or development not in original email]

[Sentence 3: Same ask, lightly reframed]

Best,
[User's Full Name]

**Word count:** [X] / 60 maximum

---

### Outreach Notes

| Element | Details |
|---------|---------|
| Personalization hook | [What makes this email specific to this recipient] |
| Key qualification | [The credential that establishes relevance] |
| Ask type | [Exactly what is being requested] |
| Optimal send window | [Day range and time range in recipient's time zone] |
| Follow-up timing | [Specific number of business days after initial send] |
| Application status | [Should user also apply through official channel? Yes/No + rationale] |
| If referred | [Referral contact name and how to acknowledge in the email] |

---

### One Thing to Verify Before Sending

[One specific, actionable item the user should confirm or double-check before hitting send -- 
e.g., correct spelling of recipient's name, verifying the role is still open, confirming 
the company's headquarters time zone, or confirming a detail about the personalization hook]
```

---

## Rules

1. **Always produce a complete, ready-to-send email -- never produce advice about cold outreach.** The output is a deliverable the user copies into their email client, not a framework they use to write their own email. Every output must include subject line, body, and follow-up.

2. **The email body must be under 125 words -- count them explicitly and display the count.** Research consistently shows response rates drop for emails over 125 words and drop sharply over 200 words. If the draft exceeds 125 words, cut from sentence 2 or 3 first -- the connection hook and the ask are non-negotiable.

3. **The personalization hook must be specific, verifiable, and unique to this recipient -- never generic company admiration.** "I love what you're building at [Company]" is not personalization. "Your decision to build the observability layer before migrating to microservices, which you described in your July engineering post, mirrors a lesson I learned the hard way" is personalization. If the user cannot provide a real hook, prompt them to research before sending and provide team-level or company-level alternatives.

4. **Include exactly one ask per email and one ask per follow-up.** Multiple asks in a cold email are the single most common structural mistake. The recipient does not know which ask to prioritize, so they defer responding until they have time to think about it -- which often means never. One ask produces one decision: yes or no.

5. **The ask must be low-friction and time-bounded.** A 15-minute call is appropriate. A 30-minute call is borderline. An hour-long meeting, a coffee, a phone call with no time boundary, or an open-ended "I'd love to connect sometime" are all disqualifying. Low friction means the recipient can say yes without significant calendar commitment. Time-bounded means the recipient knows exactly what they are agreeing to.

6. **Never include a resume, portfolio, or any attachment in the first cold email.** Attachments in cold email trigger spam filters, signal presumption, and put the recipient in the position of evaluating a document they did not request. Offer the resume in the follow-up or after the recipient expresses interest. Exception: if the user is in a portfolio-dependent creative field (design, animation, video) and has a public portfolio URL, a single hyperlink -- not an attachment -- in the postscript is acceptable.

7. **Never use desperation language, excessive deference, or pre-emptive apology.** Words and phrases that immediately undermine credibility include: "I know you're incredibly busy," "Sorry to bother you," "I would be so grateful," "I hope this isn't too forward," "I'm sure you get a lot of these emails," and "I would love the chance to prove myself." These phrases signal low confidence and shift the dynamic from professional peer to supplicant. The email should read as if two qualified professionals are having a conversation, not as if someone is asking for charity.

8. **If the user was referred by a mutual contact, the referral must appear in sentence 1 and in the subject line.** A referral is the most powerful variable in cold outreach response rate -- it transforms the email from cold to semi-warm. Burying the referral in sentence 3 wastes the highest-value asset. The referral name goes first, always.

9. **Provide exactly three subject line options using three distinct strategies and recommend one with a rationale.** Do not provide options that are minor variations of the same strategy (e.g., two subject lines that both lead with the role title). Distinct strategies produce distinct open rate profiles and help the user understand what is working if they track responses.

10. **The follow-up email is the final outreach -- never recommend a third email to the same person.** Sending a third unsolicited email is intrusive, harms the user's professional reputation, and nearly never produces a response. If two emails receive no response, the candidate should accept the non-response and redirect energy to other contacts. The only exception is if new, significant external context changes the situation (e.g., the company announces a major expansion and the user has genuinely new information to contribute) -- in that case, a gap of at least 60 days should pass before attempting contact again.

11. **Always recommend the user submit a formal application in addition to the email for Type 1 and Type 2 outreach.** Hiring managers at companies with ATS systems often cannot move a candidate forward unless they are officially in the system, regardless of how much the manager wants to hire them. The email is a door-opener, not a substitute for the application.

12. **Never invent or extrapolate personalization details the user did not provide.** If the user says "Sarah runs the backend team," do not infer or add details about their specific projects, opinions, or decisions that the user did not confirm. Fabricated personalization that turns out to be incorrect is far more damaging than generic personalization -- it signals that the sender is careless with facts, which is not a trait any employer wants to hire.

---

## Edge Cases

### The User Has No Personalization Information About the Recipient

This is the most common scenario. The user found a hiring manager on LinkedIn but knows nothing specific about their work.

Prompt the user to spend 15-20 minutes researching before sending. Direct them to: LinkedIn activity tab (posts, likes, comments from the past 90 days), the company engineering or product blog (many leaders author or co-author posts), GitHub profile (check username against the company org if technical), conference website speaker lists, and YouTube (search "[Name] + [Company]" for talks or panels).

If research genuinely produces nothing useful, fall back to company-level personalization: reference a specific product decision, a recent funding round, a technical architecture choice the company made publicly, or a feature shipped recently that the user has informed opinions about. This is weaker than individual-level personalization but still significantly better than generic admiration. Example: "Your team's decision to build the recommendation engine in-house rather than using a vendor, described in last month's product blog, aligns directly with the systems work I have been doing."

### The User Is Reaching Out to a C-Suite Executive (CEO, CTO, CPO, VP Level)

Executives receive many unsolicited emails. Their bar for engaging is higher and their time is shorter. Adjust the approach:

- Shorten the email to under 80 words, not 125
- Sentence 2 (credibility) should be the most impressive, highest-signal credential the user has -- not a list of qualifications, but one headline statement
- Change the ask: executives are more likely to delegate than to engage directly. The most effective ask for C-suite cold outreach is "Would you be willing to point me to the right person on your team to discuss [specific topic or role]?" This ask requires almost no decision-making on their part, gives them an easy way to say yes by forwarding the email, and is flattering rather than demanding
- Subject line should reference either a referral (if applicable) or a very specific, impressive credential -- not a generic role title
- Skip the follow-up if the executive is at the CEO or CTO level of a large company (500+ employees). One email is appropriate. At a startup (under 100 people), the standard follow-up protocol applies

### The User Was Referred by a Mutual Contact

This is the highest-performing outreach scenario and requires special handling:

- The mutual contact's name goes in sentence 1 and in the subject line, without exception
- Confirm with the user that the mutual contact has actually agreed to be named -- never name someone as a referral without their knowledge or consent
- The formula for sentence 1: "[Mutual contact full name] suggested I reach out to you about [specific topic or role]." Then add the brief context of why the connection suggested it, if the user knows
- Email length can expand slightly to 130-135 words because the referral context adds necessary content
- The ask remains low-friction but can be slightly more direct: "Would you be open to a 15-minute call this week?" is appropriate because the referral provides enough social context to justify a slightly more specific request

### The User Is Reaching Out About a Role That Is Not Publicly Posted

The user wants to express interest in a company but has no evidence that a specific role exists.

Never frame this as asking for a job that may not exist. Frame it as introducing a relevant capability:

- Sentence 1: Personalization hook as usual
- Sentence 2: Credibility as usual, but connect the credential to the type of work the team does, not to a job description
- Sentence 3: Frame as exploratory: "I am not sure whether your team has openings for someone with this background, but if you do or anticipate needing this skill set, I would welcome the conversation."
- Ask: "Would you be open to a brief conversation to see whether there is a mutual fit?" or "Would you be willing to let me know if this kind of background would be relevant to your team in the coming months?"
- Avoid: Any language that implies the recipient has an obligation to create a role or find the user a position

### The User Wants to Adapt the Email for LinkedIn Instead of Direct Email

LinkedIn message constraints change the strategy significantly:

- **Connection request with note (300 characters maximum):** This is only 2-3 sentences. The connection request should contain: the personalization hook (1 sentence) and a brief qualifier (1 sentence). Do not include an ask in a connection request -- the connection itself is the first ask. Example: "Your talk on eBPF observability at SREcon described exactly the architecture I am building at Cloudbase. I would appreciate connecting." (193 chars)
- **LinkedIn InMail (2,000 character limit for most accounts):** Use the full 4-sentence structure from this skill. The InMail subject line field should use the same strategy as the email subject line
- **Direct message after connection (standard LinkedIn message):** Once connected, use the full 4-sentence structure. Mention that you connected recently to provide context: "Thank you for connecting -- I wanted to follow up on why I reached out."
- Note to the user: email consistently outperforms LinkedIn direct message for cold outreach because LinkedIn messages are mixed in with notifications and recruiter spam. If the user can find a direct email address, recommend using it over LinkedIn

### The Recipient Is at a Direct Competitor of the User's Current Employer

This scenario requires additional discretion:

- Advise the user to review any non-compete or non-solicitation agreements before outreach
- The email itself should not mention the user's current employer in a way that reveals sensitive competitive information -- for example, describing specific customers, unreleased products, or proprietary technical systems
- Sentence 2 (credibility) should be framed in terms of skill, scale, and outcome -- not in terms of employer-specific knowledge: "I built distributed caching systems handling 100M daily requests" rather than "At [Current Employer] I built the caching layer for [specific proprietary product]"
- If the user is subject to a garden leave clause or active non-compete, this should be disclosed to the recipient at some point in the conversation -- but not in the cold email itself

### The User Has a Significant Employment Gap or Unconventional Background

- Do not hide or explain the gap in the cold email -- the 4-sentence structure does not have room for defensive explanation, and attempting to preemptively justify a gap in a cold email draws more attention to it than saying nothing
- Focus sentence 2 entirely on what the user has done, not on timeline or continuity. A strong credential stands regardless of when it was achieved
- If the gap is recent (last 6-12 months) and the user did something substantive during that time (freelance work, an open-source project, a certification, caregiving that they are willing to mention), sentence 2 can reference it: "Most recently I spent six months building a personal trading system in Rust, which gave me deep exposure to latency-sensitive systems design."
- If the unconventional background is a career pivot, sentence 3 (value framing) is where to bridge the pivot explicitly: "My background in clinical research gives me a different lens on patient data workflows than most engineering candidates, which I think is directly relevant to what your team is building."

---

## Example

**User input:** "I want to reach out to Marcus Webb, Director of Engineering at a company called Lattice Systems. They build infrastructure tooling for ML teams. I found a Senior Platform Engineer role posted two days ago. I saw Marcus gave a talk at KubeCon last year about multi-tenant GPU scheduling and it was really good. I have 5 years of Kubernetes experience. I built a multi-tenant GPU cluster from scratch at my current company -- 200 nodes, 50 research teams. No mutual connections."

---

## Cold Outreach Email: Marcus Webb at Lattice Systems

---

### Context Summary

| Field | Details |
|-------|---------|
| Recipient | Marcus Webb, Director of Engineering, Lattice Systems |
| Outreach type | Type 1 -- Role exists (Senior Platform Engineer, posted 2 days ago), reaching out to direct hiring manager |
| Personalization hook | KubeCon talk on multi-tenant GPU scheduling |
| Key qualification | 5 years Kubernetes, built 200-node multi-tenant GPU cluster serving 50 research teams |
| Ask | 15-minute conversation about the Senior Platform Engineer role |

---

### Subject Line Options

1. Senior Platform Engineer -- Kubernetes + GPU scheduling (52 chars) -- Strategy A: Role + Credential
2. Your KubeCon talk on multi-tenant GPU scheduling (49 chars) -- Strategy B: Personalization Reference
3. Multi-tenant GPU cluster at scale -- Platform Engineer role (57 chars) -- Strategy A variant with scope signal

**Recommended:** Option 2 -- Marcus gave this talk, it is specific to him and not to the company generally, it creates a question in his mind ("who watched my talk?"), and it does not front-load "job application" energy, which means it is more likely to get opened. The talk is also directly adjacent to the work described in the role posting, so the open creates immediate relevance.

---

### Email Body

**Subject:** Your KubeCon talk on multi-tenant GPU scheduling

Hi Marcus,

Your KubeCon talk on multi-tenant GPU scheduling addressed the exact isolation and resource contention problems I have been navigating in production -- your approach to priority classes changed how I think about fair-share scheduling. I am a platform engineer with five years of Kubernetes experience, and most recently I designed and built a multi-tenant GPU cluster from scratch at my current company -- 200 nodes across 50 research teams. I would be excited to bring that hands-on production experience to Lattice's infrastructure work as your platform scales. Would you be open to a 15-minute conversation about the Senior Platform Engineer role?

Best,
[Your Name]

**Word count:** 103 / 125 maximum

---

### Follow-Up Email

*Send 6 business days after initial email if no response. This is the final outreach attempt.*

**Subject:** Re: Your KubeCon talk on multi-tenant GPU scheduling

Hi Marcus,

I wanted to follow up on my note from last week about the Senior Platform Engineer opening. I have been reviewing Lattice's public architecture documentation since I reached out, and I have a few thoughts on the scheduler extension approach you described at KubeCon that I think would be worth comparing notes on. Would a brief conversation still make sense?

Best,
[Your Name]

**Word count:** 58 / 60 maximum

---

### Outreach Notes

| Element | Details |
|---------|---------|
| Personalization hook | KubeCon talk on multi-tenant GPU scheduling -- directly validates the user's specific production experience |
| Key qualification | 200-node, 50-team GPU cluster built from scratch -- strong metric that maps exactly to Lattice's domain |
| Ask type | 15-minute conversation about the Senior Platform Engineer role |
| Optimal send window | Tuesday, Wednesday, or Thursday, 8:00-10:00 AM Pacific (Lattice Systems -- confirm their HQ timezone before sending) |
| Follow-up timing | 6 business days after initial send |
| Application status | Yes -- submit a formal application through Lattice's careers page in addition to this email. Many directors cannot advance a candidate without an official ATS record, regardless of personal interest |
| If referred | No referral -- cold outreach. If a mutual contact emerges before sending, revise sentence 1 and subject line to lead with the referral name |

---

### One Thing to Verify Before Sending

Confirm the spelling of "Marcus Webb" and his exact title ("Director of Engineering") against Lattice Systems' LinkedIn page or website before sending. A misspelled name or wrong title in a cold email signals low attention to detail -- the one trait a platform engineering hiring manager will immediately notice.
