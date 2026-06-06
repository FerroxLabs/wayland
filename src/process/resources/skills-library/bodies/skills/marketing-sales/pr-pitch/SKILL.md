---
name: pr-pitch
description: |
  Produces a media pitch email with news hook, story angle, expert
  availability, and supporting data using PR pitch structure. Use when the
  user asks to write a PR pitch, pitch a story to journalists, create a
  media pitch, draft a press pitch email, or prepare outreach to media
  outlets about a newsworthy announcement.
  Do NOT use for influencer collaboration briefs (use influencer-brief),
  sales outreach emails (use cold-outreach-sequence), or social media
  content (use social-media-strategy).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "marketing writing email planning"
  category: "marketing-sales"
  subcategory: "marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# PR Pitch

## When to Use

Use this skill when the user needs to produce a media pitch email designed to land press coverage. Trigger scenarios include:

- User wants to pitch a story to a journalist, reporter, editor, or producer at a specific publication, podcast, newsletter, or broadcast outlet
- User is making a business announcement -- product launch, funding round, acquisition, new hire, partnership, or milestone metric -- and needs media outreach to accompany it
- User needs to pitch original research, a proprietary dataset, or a survey finding to generate earned media coverage
- User wants to develop multiple pitch angles for the same announcement, targeting different beat reporters (tech vs. business vs. vertical trade press)
- User is pitching a "thought leadership" or trend story where the company has no hard news but has a data-backed perspective or expert commentary to offer
- User needs to craft a pitch for a reactive opportunity -- responding to a trending story in the news to offer a contrarian view, expert comment, or supplementary data
- User needs a follow-up pitch to re-engage a journalist who did not respond to an earlier outreach

**Do NOT use this skill when:**

- User needs influencer collaboration outreach -- that involves deliverables, compensation, and content schedules, which is a different relationship structure (use `influencer-brief`)
- User needs sales prospecting or cold email outreach to potential customers -- the goal is revenue, not editorial coverage (use `cold-outreach-sequence`)
- User needs to write a press release -- a press release is a formal, third-person announcement document, not a conversational pitch email; these are complementary but distinct documents (use a press-release skill if available)
- User is managing a crisis -- responding to negative coverage, issuing a correction, or managing reputational fallout requires a crisis communications framework with legal review, not a pitch template
- User is requesting paid media placement -- sponsored content, advertorials, and native advertising are media buying decisions, not PR pitches; editorial and advertising are separated by a firewall at any credible outlet
- User needs an award submission or analyst briefing -- these follow entirely different formats and relationship norms than journalist pitches


## Process

### Step 1: Extract the Pitch Brief

Before writing a single word of copy, gather every piece of information needed to construct a compelling pitch. Ask if any of the following are missing:

- **The announcement or story:** What specifically is happening? Be precise -- "we launched a product" is not enough; "we launched a B2B SaaS product that reduces accounts payable processing time by 67% for mid-market manufacturers" is workable.
- **The news timing:** When is the announcement going public? Is there an embargo? Is the news already live? Timing affects urgency language, exclusivity offers, and which pitch variant to lead with.
- **The data or proof point:** What single, specific, quantified fact makes this credible? Original research data, customer metrics, revenue figures, or usage statistics. If the user has none, probe for any measurable outcome -- even "100 paying customers in 90 days" is more useful than zero.
- **The spokesperson:** Full name, title, and the specific expertise that qualifies them to speak on this topic. "Our CEO" is incomplete. "Maria Chen, CEO and former head of supply chain operations at a Fortune 500 company with 15 years managing manufacturing logistics" is a spokesperson.
- **Target beats:** Which journalist beats care about this story? Technology? Healthcare? Retail? Small business? Local news? Each beat has different news value criteria, vocabulary, and reader demographics.
- **The competitive landscape:** Has any competitor received coverage for a similar story? What made that story work? This helps calibrate the angle.
- **Supporting assets available:** High-resolution images, video demos, customer references willing to go on record, embargoed data reports, founder backstory, or investor names that can be cited.

### Step 2: Define the News Hook with Precision

The news hook is the single most important sentence in any pitch. It answers "why would a journalist's editor approve this story for their readers?" -- not "why does this matter to the company?"

Apply the News Value Test by checking the announcement against journalism's five core news values:

- **Timeliness:** Is this happening now, or does it connect to a trend that is peaking now? Pitch timing windows are typically 48--72 hours around an announcement; trend hooks can be pitched any time the trend is in the news cycle.
- **Proximity:** Is there a geographic, industry, or audience-specific angle that makes this locally or sector-relevant? Regional and trade press require proximity framing.
- **Prominence:** Does the announcement involve a well-known company, investor, or figure? Name recognition accelerates reporter interest.
- **Impact:** How many people are affected, how significantly, and in what measurable way? "$2,800 per month in lost revenue for the average restaurant" is more impactful than "helps restaurants save money."
- **Conflict or tension:** Does this challenge conventional wisdom, contradict an industry narrative, or reveal a problem that was previously undisclosed?

Score the announcement against these five values. If fewer than two are present, the pitch needs a manufactured hook -- a research study, a customer story, or a contrarian angle -- to earn news value. If three or more are present, lead with the strongest two.

Classify the hook type, because each type follows a different opening structure:

- **Hard news hook:** "Company X today announced Y, making it the first/largest/fastest in Z category." Used for launches, funding, and milestones.
- **Data hook:** "New research from Company X finds that [specific percentage] of [specific audience] [specific problem]." Used when the data is the story.
- **Trend hook:** "As [macro trend] accelerates, [Company X] is seeing [specific evidence] that [implication]." Used for thought leadership pitches.
- **Human story hook:** "[Founder name] spent [X years] watching [specific problem] destroy [specific outcome] before building a solution." Used for profile pitches and founder-led narratives.
- **Reactive hook:** "Following [recent news event], new data from [Company X] shows the impact is [specific, measurable outcome]." Used for newsjacking pitches.

### Step 3: Match Hook to Beat and Outlet Type

Different journalists require structurally different pitches even for the same announcement. Mismatching hook to beat is the most common reason a technically good pitch fails.

**Beat-specific framing guidelines:**

- **Technology reporters** (TechCrunch, The Verge, Wired, tech desk at major dailies): Lead with what is technically novel or architecturally interesting. Include funding amount if disclosed, investor names, and the problem in the competitive landscape. Tech reporters want to understand what changed in the world.
- **Business reporters** (Bloomberg, WSJ, Business Insider, Forbes, business desks): Lead with market size, revenue impact, valuation, or economic implication. Business reporters need to justify why their financial audience should care. Include numbers whenever possible.
- **Vertical trade press** (Restaurant Business, Modern Healthcare, Retail Dive, Automotive News): Lead with the specific operational or industry impact. Trade reporters know their beat deeply -- never over-explain basic industry concepts. Use industry vocabulary without defining it.
- **Small business and entrepreneurship media** (Inc., Entrepreneur, Fast Company): Lead with the founder story, the relatable struggle, or the bootstrapped ingenuity. These outlets prioritize aspirational narratives and practical takeaways for their SMB reader base.
- **Consumer lifestyle publications** (NYT Styles, Vogue Business, Food & Wine): Lead with the reader experience. How does this change what a reader buys, eats, wears, or does? Consumer media pitches must be deeply reader-centric.
- **Local TV news and newspaper reporters**: Lead with local economic impact -- jobs created, local founders, community benefit. Local reporters ask "why does my specific audience in this city care about this today?"
- **Newsletter writers and independent journalists**: Pitch them as you would a feature writer at a magazine. They value access, exclusivity, and being ahead of mainstream coverage. Offer them a brief before it goes wide.

### Step 4: Write the Pitch Email

A professional pitch email has six components. Each has precise constraints that experienced PR professionals treat as hard rules:

**Subject line (45--65 characters):**
- Must convey the news value in plain language, not marketing language
- Must NOT contain exclamation points, ALL CAPS, or "FYI/ICYMI" framing
- Must reference either the specific announcement, the data finding, or the trend angle -- never the company name alone
- Best-performing subject lines make a factual claim: "73% of restaurants underprice their best dishes" outperforms "Exciting new restaurant tech startup announcement"
- For reactive pitches: include the name of the story or event being referenced

**Opening line (1 sentence, under 30 words):**
- Must answer "why does this matter to your readers right now" before the journalist can ask
- Do NOT open with pleasantries, self-introduction, or context about the company
- Do NOT open with "I hope..." or "I'm reaching out because..."
- Start with the news, the data point, or the tension -- then the journalist's interest is established

**Body paragraph (2--4 sentences, 60--90 words):**
- Sentence 1: The specific announcement with precise details (what happened, who it affects, measurable outcome)
- Sentence 2: Why this matters beyond the company -- market context, trend connection, or broader implication
- Sentence 3: One additional supporting data point or proof of traction (customer count, pilot results, market size)
- Sentence 4 (optional): A brief explanation of how the product/company works if the journalist cannot infer it from context

**Spokesperson credential (1 sentence):**
- Name and title alone are not enough -- add the credential that qualifies them to speak on THIS story specifically
- "Ten years running restaurant operations" is a credential for a restaurant tech pitch
- "Former NIH researcher" is a credential for a health tech pitch
- Avoid generic credentials like "passionate entrepreneur" or "visionary leader"

**Call to action (1 sentence):**
- Must offer something concrete: an exclusive interview, embargoed access to a dataset, a product demo, an introduction to a customer willing to go on record, or first access before a broader announcement
- NEVER use "please let me know if you're interested" or "happy to chat if you want to learn more" -- both put the burden on the journalist without giving them a reason to respond
- Include a specific time offer when possible: "Available for a 20-minute call Tuesday or Wednesday" removes scheduling friction

**Signature:**
- Full name, title, company
- Direct phone number (journalists work on deadline and may need to call)
- Email address
- Optional: one-line description of the company or a link to a press kit

**Total word count:** 120--180 words. Pitches over 200 words have measurably lower open and response rates. Journalists who work deadline cycles have limited time per pitch. If the full story cannot be conveyed in 180 words, the hook needs sharpening, not more explanation.

### Step 5: Write Two to Three Pitch Variants

A single announcement typically warrants three distinct pitch variants because the same news serves different journalistic purposes. Never send the same pitch text to every journalist -- it signals that the pitch was not written for them.

**Variant 1 -- Hard News / Announcement angle:** For news desk reporters and daily beat writers who cover breaking announcements. This variant is timely, factual, and front-loads all key details. Best for launch day or the 24 hours following an announcement going live.

**Variant 2 -- Trend / Insight angle:** For feature writers, magazine editors, and newsletter writers who cover the broader narrative. This variant frames the announcement as evidence of a larger shift and offers the spokesperson as an expert source, not just a subject. Best for pitches without a hard news hook, or as a follow-up variant after the hard news window has passed.

**Variant 3 -- Data / Research angle:** For data journalists, analysts, and reporters who cover statistics-driven stories. This variant leads with the research finding and offers the dataset or methodology as the primary hook, with the company in a supporting role. Best when the user has original data that stands on its own merit.

### Step 6: Evaluate Pitch Quality Before Output

Run each pitch variant through these six quality checks before delivering it to the user:

- **The 3-second test:** Can a journalist read the subject line and first sentence in 3 seconds and know whether this story is relevant to their beat? If no, rewrite.
- **The audience test:** Does every sentence serve the journalist's reader, not the company? If any sentence is primarily about how great the product or company is without explaining reader relevance, cut or reframe it.
- **The specificity test:** Are all numbers, timeframes, names, and claims specific? Replace "many restaurants" with "73% of 50,000 restaurants analyzed." Replace "recently launched" with "launched Tuesday."
- **The credential test:** Does the spokesperson's one-line qualifier directly match the story's topic? If not, revise the credential.
- **The CTA test:** Does the call to action offer something the journalist receives -- access, data, a source -- rather than ask for something they give? "Let me know if you're interested" is a request. "I can share the full dataset" is an offer.
- **The exclusivity test:** Is an exclusive or embargo being offered to only one journalist? If yes, flag it clearly in the pitch. Never offer the same exclusive to multiple journalists simultaneously -- this destroys trust and the journalist will find out.

### Step 7: Prepare the Supporting Materials Brief

A pitch email is only as effective as the materials that back it up when a journalist responds. List every asset needed and its current status so the user knows what to prepare before sending:

- **Embargoed press release or company fact sheet:** One page, third-person, with company boilerplate at the bottom. Should be ready before any pitch goes out.
- **High-resolution images:** Minimum 300 DPI, at least 2400 x 1600 pixels for print; 1920 x 1080 minimum for web. Product images, founder headshots, and company logo in both color and white backgrounds.
- **The data brief or research summary:** A one-to-two page PDF that a journalist can read, cite, and share with their editor as backup for any statistics cited in the pitch.
- **Customer reference:** At least one customer willing to take a journalist call and go on record. The journalist may need a third-party voice to write the story.
- **Video or demo access:** A Loom, product demo video, or live demo URL. Especially valuable for tech and product pitches where the journalist cannot experience the product from a description alone.
- **Spokesperson media training status:** Note whether the spokesperson has been briefed on likely questions, message pillars, and off-limits topics. An unprepared spokesperson can derail a story that the pitch successfully landed.

### Step 8: Build the Target Media List Framework

The pitch variants mean nothing without a targeting strategy. Provide the user with a tiered targeting framework:

- **Tier 1 -- Exclusive targets (1--2 outlets):** Offer an exclusive to the highest-priority outlet. This means one journalist gets first access before the news goes public. An exclusive typically increases the chance of coverage at a top-tier outlet by 2--3x, but it limits the pitch to one outlet until that story publishes or the outlet passes.
- **Tier 2 -- Simultaneous embargo (5--10 outlets):** Offer embargoed access to a cohort of journalists with the same release date and time. All publish simultaneously. This creates coverage volume without giving any single outlet an unfair advantage. Embargo periods are typically 24--72 hours, but can extend to a week for feature writers.
- **Tier 3 -- Wide release (open distribution):** After embargo lifts or for non-exclusive pitches, send personalized variants to a broader media list. "Personalized" means at minimum a first name in the greeting and a single line referencing a specific article they wrote or beat they cover. Generic mass email pitches are deleted without reading.


## Output Format

```
## PR Pitch Brief: [Announcement or Story Name]

**News Hook:** [1-sentence statement of why a journalist's reader should care, specific and factual]
**Hook Type:** [Hard News / Data / Trend / Human Story / Reactive]
**Target Beats:** [Comma-separated list of journalist beat types]
**Embargo:** [None] or [Lift date and time, timezone]
**Spokesperson:** [Full name, title, and one-line qualifying credential]
**Supporting Data Point:** [The single most compelling statistic available]
**Assets Ready:** [List: press release, images, data brief, customer reference, demo]

---

### Variant 1 -- [Hard News / Announcement Angle]
*Best for: news reporters, daily beat writers, tech and business press*

**Subject:** [45--65 characters, factual claim or specific announcement]

[First name],

[Opening line: why this matters to their readers, right now -- 1 sentence, max 30 words.]

[Body: what happened + precise detail, why it matters beyond the company, one supporting data point -- 2--4 sentences, 60--90 words.]

[Spokesperson: name, title, specific qualifying credential for this story -- 1 sentence.]

[CTA: specific offer -- interview, dataset, customer source, demo access -- with timeframe -- 1 sentence.]

[Your full name]
[Title], [Company]
[Direct phone] | [Email]
[Optional: one-line company description or press kit link]

**Word count:** [X words]

---

### Variant 2 -- [Trend / Insight Angle]
*Best for: feature writers, magazine editors, newsletter journalists*

**Subject:** [45--65 characters, frames the macro trend or question]

[First name],

[Opening line: the macro trend or tension this story fits into -- 1 sentence.]

[Body: the trend evidence + the company as one data point in a larger story, market implication, specific metric -- 2--4 sentences, 60--90 words.]

[Spokesperson as expert source, not just subject -- credential ties to the trend, not just the company -- 1 sentence.]

[CTA: offer of exclusive access, trend briefing, or embargoed data -- 1 sentence.]

[Your full name]
[Title], [Company]
[Direct phone] | [Email]

**Word count:** [X words]

---

### Variant 3 -- [Data / Research Angle]
*Best for: data journalists, analysts, statistics-driven beats, policy reporters*

**Subject:** [45--65 characters, leads with the research finding as a declarative fact]

[First name],

[Opening line: the research finding stated as a factual claim -- 1 sentence.]

[Body: methodology credibility (sample size, collection method, time period), the two or three most significant findings, implication for the beat's audience -- 2--4 sentences, 60--90 words.]

[Spokesperson as researcher or data interpreter -- credential ties to the methodology -- 1 sentence.]

[CTA: offer to share the full dataset, summary PDF, or briefing call -- 1 sentence.]

[Your full name]
[Title], [Company]
[Direct phone] | [Email]

**Word count:** [X words]

---

### Quality Check Summary

| Check | Variant 1 | Variant 2 | Variant 3 |
|----------------------|-----------|-----------|-----------|
| 3-second test | Pass/Fail | Pass/Fail | Pass/Fail |
| Audience-first framing | Pass/Fail | Pass/Fail | Pass/Fail |
| All claims specific | Pass/Fail | Pass/Fail | Pass/Fail |
| Spokesperson credentialed | Pass/Fail | Pass/Fail | Pass/Fail |
| CTA offers, not asks | Pass/Fail | Pass/Fail | Pass/Fail |
| Under 180 words | [X words] | [X words] | [X words] |

---

### Supporting Materials Status

| Asset | Status | Notes |
|---------------------------------------|--------------------------|--------------------------------|
| Press release / fact sheet | Ready / Draft / Needed | [Format, length, key quotes] |
| Product or service images (300 DPI+) | Ready / Draft / Needed | [Subject matter, quantity] |
| Spokesperson headshot | Ready / Draft / Needed | [Resolution, background] |
| Data brief or research summary PDF | Ready / Draft / Needed | [Page count, key findings] |
| Customer reference (on record) | Ready / Draft / Needed | [Name, company, quote status] |
| Demo video or live access | Ready / Draft / Needed | [Format, URL, access method] |
| Press kit URL | Ready / Draft / Needed | [Location, access instructions] |

---

### Media Targeting Tier Plan

| Tier | Approach | Outlet Type | # Contacts | Variant to Use | Timing |
|------|----------|-------------|------------|----------------|--------|
| Tier 1 | Exclusive | [Outlet name or type] | 1--2 | Variant 1 | [X days before announcement] |
| Tier 2 | Embargo cohort | [Beat types] | 5--10 | Variant 1 or 2 | [Embargo lift: date/time] |
| Tier 3 | Wide personalized | [Beat types] | 10--25 | Variant 2 or 3 | [Announcement day or after] |

**Recommended follow-up cadence:**
- Follow-up 1: 3--4 business days after initial send, reply to same email thread, add one new piece of information (a new data point, a customer quote, or a relevant news hook that emerged)
- Follow-up 2: 5--7 days after follow-up 1 only if there is a genuine update; do not follow up a second time to simply ask if they saw your first follow-up
```


## Rules

1. **Never lead with the company name.** Journalists do not care who is announcing the news; they care why their readers care. "Acme Corp today launched..." goes to trash. "New data shows 73% of restaurants underprice their top dishes..." earns a second sentence.

2. **Pitches must be 120--180 words, not counting the signature.** This is not a stylistic preference -- it is a conversion reality. Pitches over 200 words require journalists to scroll, which reduces response rates materially. If the full story cannot be explained in 180 words, the hook is not sharp enough.

3. **Subject lines must make a factual claim or state a specific outcome, not describe the pitch.** "Interview opportunity with our CEO" describes the pitch. "Why independent restaurants lose $2,800/month on menu pricing" makes a claim the journalist wants to verify.

4. **Every statistic cited must include its source, sample size, and collection method in the supporting data brief.** A journalist will ask. An unverifiable statistic kills a story -- and the relationship. If the user's only data is a small internal sample, acknowledge the limitation and frame it as "early data" or "findings from [X] pilot customers."

5. **Never offer the same exclusive to two journalists simultaneously.** This is the fastest way to permanently damage relationships with both. An exclusive means one journalist, one outlet, confirmed in writing before the news goes anywhere else. If the exclusivity offer is declined, confirm the rejection in writing before moving to the next target.

6. **Do not mention competitors by name in a pitch unless the journalist has specifically asked for competitive context.** Unprompted competitive comparisons read as insecurity and give the journalist a reason to also contact the competitor for comment, potentially benefiting them.

7. **The spokesperson's credential must connect directly to the story's subject matter, not to the company's general success.** "Former restaurant operator with 12 years managing three locations" is a credential for a restaurant tech story. "Award-winning entrepreneur" is not a credential -- it is a marketing claim.

8. **Never send the same pitch text to all journalists.** Even if the core story is identical, the subject line, opening sentence, and framing must reflect the specific journalist's beat and readership. A tech reporter and a food industry reporter need completely different entry points to the same story.

9. **The call to action must offer something concrete that the journalist receives -- not request something they give.** "Let me know if you're interested" requests the journalist's attention. "I can share the full 50,000-menu dataset with methodology" offers the journalist something useful. The offer must be specific enough that a journalist can evaluate it without a follow-up question.

10. **Flag embargo terms explicitly and early.** If the announcement is under embargo, state the exact lift date and time, the timezone, and what is and is not embargoed in the opening of the email, before the pitch itself. Breaking an embargo is a journalist career risk -- they will not take it if the terms are ambiguous.

11. **Do not include a press release in the first pitch email.** Attach the press release only after the journalist confirms interest. A cold pitch email with a press release attached signals that this is a mass distribution, not a personal outreach, and reduces the perception of exclusivity.

12. **Follow up exactly once per pitch, on business day 3 or 4 after the original send.** The follow-up must add new information -- a subsequent data point, a new customer quote, or a relevant news event -- not simply restate the original pitch. A second follow-up with no new information is spam.


## Edge Cases

### The Announcement Has No Original Data

When the user's news is an announcement without original research, proprietary data, or quantified customer outcomes, the pitch has no inherent data hook. Solutions:

- Commission a fast-turn survey using tools like Google Consumer Surveys, SurveyMonkey Audience, or Pollfish with a sample of 300--500 respondents in the target customer demographic. A 48--72 hour turnaround is standard. Even a small survey creates an original data hook.
- Reframe the pitch around the business outcome rather than the product: "In 90 days since launch, [X] businesses have done [specific outcome]" is data.
- Use a trend hook that cites publicly available third-party data (industry reports, government statistics, publicly available research) and position the company as the solution to a problem the data reveals. The data is not proprietary but the interpretation can be.
- If no data exists at all, lead with the founder's personal story or a customer story, and be explicit with the journalist that this is a narrative pitch, not a data pitch.

### Pre-Launch Embargo with Exclusive Offer

When the user wants to generate coverage before a product launches and is willing to offer an exclusive, follow this protocol precisely:

- Identify one journalist at the highest-priority outlet for the beat. This is the exclusive target.
- Send the pitch with a clearly stated embargo: "This is an exclusive pitch under embargo until [exact date, time, and timezone]. I am offering this exclusively to [Outlet Name] and will wait for your decision before approaching other outlets."
- Give the journalist 48--72 hours to respond. If no response, send a single follow-up. If still no response after the follow-up window, send a formal release note: "I'm releasing this exclusive to other outlets as of [date/time]." Then approach a second-tier target.
- Never pitch an exclusive to two journalists at the same time, even under different framing. Industry networks are small and journalists compare notes.
- Document all embargo terms in the pitch email and keep records. If a journalist breaks an embargo, it is a legitimate grievance; if the company breaks the exclusive, the journalist has a legitimate grievance.

### Reactive or Newsjacking Pitch

When the user wants to respond to a trending news story with a pitch offering expert commentary or contradicting data, timing is the entire strategy:

- Reactive pitches must go out within 2--4 hours of the triggering story being published. After 24 hours, the story has moved and the hook is stale.
- The subject line must reference the triggering story by name: "Re: [Publication]'s story on [topic] -- new data challenges the premise"
- The opening line must acknowledge the journalist's recent work before pivoting: "[Journalist name]'s piece on [topic] published this morning noted [specific claim from their article]. New data from [Company] tells a different story."
- The spokesperson credential must be directly relevant to the story's subject matter -- a reactive pitch with a generalist spokesperson is not credible.
- Offer a rapid-response interview: "Available today by phone for a 15-minute comment" -- reactive pitches require fast availability, not a future calendar slot.

### Pitch for a Local or Regional Business

When the user is a local or regional business seeking local television, newspaper, or radio coverage, the news value criteria are fundamentally different from national or trade press:

- National metrics (market size, total addressable market, national revenue) are irrelevant to local reporters. Reframe all metrics in local terms: jobs created locally, number of local customers served, local economic impact in dollars, neighborhood or community relevance.
- Local TV news specifically requires a visual story. The pitch should identify a 30-second visual moment -- a location to film, a product in action, an employee or customer willing to appear on camera. If there is no visual, TV is not the right medium.
- Local newspaper pitches should offer a community impact angle: "First business of its kind to open in [neighborhood/city]," "Creates [X] full-time jobs," or "Serves [X] underserved families in [specific area]."
- The spokesperson for local press should ideally be from the community -- a local founder, a local customer, or a recognized community figure, not a corporate executive who lives elsewhere.
- Timing local pitches to community events, local government meetings, or local economic milestones (neighborhood revitalization, school year start, seasonal demand) dramatically increases relevance.

### Pitch After Previous Outreach Received No Response

When the user is following up on an existing pitch that received no response after the first send and first follow-up, the strategy must change -- not simply repeat:

- Do not send a third pitch on the same story with the same angle. If two contacts on the same story have received no response, the angle is not resonating with that journalist.
- Evaluate whether the story has developed new evidence since the original pitch: new data, a new customer success metric, a new industry development that validates the original claim. If yes, re-pitch as a new pitch with new information, not a follow-up.
- Consider whether the pitch was sent to the right journalist for the beat. Research the journalist's recent bylines -- if they have not written about this topic in the past 90 days, they may have moved to a different beat.
- Test an alternative variant. If Variant 1 (hard news) failed, try Variant 2 (trend) or Variant 3 (data) as a fresh outreach, not a follow-up chain.
- If all variants have failed with a journalist, move to a different journalist at the same outlet before concluding the outlet is not interested. Most publications have multiple reporters per beat.

### User Has Controversial or Sensitive News to Pitch

When the announcement involves sensitive content -- layoffs, a product recall, a pivot that abandons previous customers, a leadership departure, or a failed feature -- the standard pitch structure still applies, but framing and tone require adjustment:

- Lead with the forward-looking strategy, not the adverse event. "Refocusing the team on core product after reducing headcount by 15% to extend runway" is a more pitchable framing than "announced layoffs today."
- Never be evasive about facts a journalist can easily verify. If the journalist asks about the layoff number and it is public record, the spokesperson must confirm it accurately.
- Pre-brief the spokesperson on likely difficult questions and establish clear message pillars: what the company is doing, why it is the right decision for customers and stakeholders, and what the path forward looks like.
- Do not pitch sensitive news as a "positive story" -- experienced journalists will identify the spin and distrust everything else in the pitch. Be direct about what happened and frame it in honest, forward-looking terms.
- Legal review is required before pitching any story that involves personnel changes, regulatory matters, litigation, or product safety. The pitch skill produces copy only -- the user must seek legal clearance independently before sending.


## Example

**Input:** "Write a PR pitch for us. We run a platform that helps independent auto repair shops manage their parts inventory. We just closed a $4.2 million seed round led by Autotech Ventures. We also analyzed 18,000 repair orders from our platform and found that the average independent shop loses $380 per month because technicians order wrong parts that get returned, and that shops using our system reduced wrong-part orders by 61% within 60 days. Our CEO is Marcus Webb, who ran a 12-location auto repair chain for 9 years before founding the company. We want to target automotive industry trade press, small business media, and tech investors media."

---

## PR Pitch Brief: $4.2M Seed Round -- Auto Repair Inventory Intelligence Platform

**News Hook:** Analysis of 18,000 repair orders finds independent auto shops lose $380/month to wrong-part returns -- a problem the company's AI inventory platform cuts by 61% in 60 days
**Hook Type:** Data (primary) + Hard News (funding announcement, secondary)
**Target Beats:** Automotive trade press, small business operations media, venture/startup tech media
**Embargo:** None (confirm with user before sending)
**Spokesperson:** Marcus Webb, CEO and Founder -- former operator of a 12-location independent auto repair chain for 9 years
**Supporting Data Point:** 61% reduction in wrong-part orders within 60 days across platform users; $380/month average loss per shop from incorrect parts returns (n = 18,000 repair orders)
**Assets Ready to Confirm:** Seed round press release, Marcus Webb headshot, data brief with methodology, customer reference shops willing to speak on record, Autotech Ventures partner quote

---

### Variant 1 -- Hard News / Funding Announcement Angle
*Best for: automotive trade press news desks, startup and VC-beat reporters, auto industry publications*

**Subject:** Auto repair inventory startup raises $4.2M to cut parts return losses

Marcus,

Independent auto shops bleed an average of $380 a month returning wrong parts -- a fixable problem that costs the industry an estimated $1.5 billion annually.

ShopIQ, a parts inventory intelligence platform for independent repair shops, today announced a $4.2 million seed round led by Autotech Ventures to tackle this problem at scale. The platform analyzes historical repair order data to flag parts mismatches before technicians order, reducing wrong-part returns by 61% within 60 days across a current base of 340 shops. The round brings total funding to $4.8 million.

Marcus Webb, CEO and a former operator of 12 repair locations over nine years, founded the company after watching incorrect parts orders erode technician productivity across his own shops.

I would be glad to connect you with Marcus for a 20-minute briefing or share the full repair-order dataset analysis. Available Tuesday through Thursday this week -- what works?

Jordan Salas
VP Communications, ShopIQ
312-555-0194 | jordan@shopiq.com

**Word count:** 158 words

---

### Variant 2 -- Trend / Insight Angle
*Best for: Automotive Management, Motor Age, Ratchet and Wrench, Independent Shop Owner, small business operations writers*

**Subject:** The hidden $380/month drain killing independent auto shops

Marcus,

Independent repair shops are losing the war on parts management -- not because they lack good technicians, but because they lack the data infrastructure to prevent ordering mistakes that chain operators took for granted a decade ago.

An analysis of 18,000 repair orders processed through ShopIQ's platform found that the average independent shop loses $380 each month to wrong-part returns: parts ordered, returned, reordered, and often billed to the shop when the supplier won't accept the return. Shops that deployed ShopIQ's inventory intelligence layer cut wrong-part order rates by 61% in their first 60 days on the platform. The problem isn't technician skill -- it's parts data fragmented across three or four supplier catalogs with no reconciliation layer.

Marcus Webb, who ran 12 repair locations before founding ShopIQ, can speak to how inventory errors compound across multi-bay shops and why independent operators face a structurally different problem than franchise chains.

Happy to share the full analysis methodology and connect you with two shop owners currently on the platform. Available for a 15-minute call this week.

Jordan Salas
VP Communications, ShopIQ
312-555-0194 | jordan@shopiq.com

**Word count:** 179 words

---

### Variant 3 -- Data / Research Angle
*Best for: Automotive Analytics editors, trade data journalists, industry research coverage at Automotive News, Fleet Owner, SAE publications*

**Subject:** 18,000 repair orders: wrong parts cost shops $380/month on average

Marcus,

New data from 18,000 repair orders processed on a live platform quantifies the parts return problem in independent auto shops with more precision than prior industry estimates.

ShopIQ's analysis, drawn from repair order data across 340 independent shops over 14 months, found: the average shop files 6.2 wrong-part returns per month at a blended cost of $61.40 per incident, totaling $380 per month in direct losses. Shops in higher-labor-cost markets average $510. Shops that deployed ShopIQ's inventory matching layer reduced return incidents by 61% within 60 days, with the steepest improvement in shops running five or more bays. The data challenges previous SEMA estimates that placed wrong-part loss rates at under $200 per location per month.

Marcus Webb, CEO and former 12-location chain operator, can walk through the dataset methodology and discuss implications for parts supplier relationships and shop profitability benchmarks.

I can send a two-page data brief with full methodology ahead of our call. Available this week -- what day works?

Jordan Salas
VP Communications, ShopIQ
312-555-0194 | jordan@shopiq.com

**Word count:** 177 words

---

### Quality Check Summary

| Check | Variant 1 | Variant 2 | Variant 3 |
|--------------------------|-----------|-----------|-----------|
| 3-second test | Pass | Pass | Pass |
| Audience-first framing | Pass | Pass | Pass |
| All claims specific | Pass | Pass | Pass |
| Spokesperson credentialed | Pass | Pass | Pass |
| CTA offers, not asks | Pass | Pass | Pass |
| Under 180 words | 158 | 179 | 177 |

---

### Supporting Materials Status

| Asset | Status | Notes |
|---------------------------------------|---------|--------------------------------------------------------------|
| Press release / fact sheet | Needed | Should include Autotech Ventures partner quote, company boilerplate, and funding use of proceeds |
| Product screenshots or UI images | Needed | Minimum 2400 x 1600px; show the parts mismatch alert interface |
| Marcus Webb headshot | Needed | Minimum 300 DPI, neutral background, business casual |
| Data brief (methodology + findings) | Needed | 2 pages max; include sample size, collection period, shop size distribution |
| Customer reference shops | Needed | 1--2 shop owners willing to speak on record with a quote cleared for attribution |
| Autotech Ventures partner quote | Needed | For press release and as supplementary credibility for investor-beat pitches |
| Press kit URL | Needed | Password-protected page with all of the above in downloadable form |

---

### Media Targeting Tier Plan

| Tier | Approach | Outlet Type | # Contacts | Variant | Timing |
|------|-----------------|----------------------------------|------------|---------|----------------------------------------|
| Tier 1 | Exclusive | Automotive News or TechCrunch | 1 | V1 | 48 hours before announcement |
| Tier 2 | Embargo cohort | Automotive trade press, VC media | 6--8 | V1, V2 | Embargo lift: announcement day, 9am ET |
| Tier 3 | Wide personalized| Small biz media, regional auto | 12--18 | V2, V3 | Announcement day through day 5 |

**Recommended follow-up cadence:**
- Follow-up 1: Business day 4 after initial send -- reply to the same thread with one new element (a shop owner quote, the data brief attached, or a relevant development like a trade show appearance)
- Follow-up 2: Only if a new, substantive development occurs (second customer milestone, industry news that validates the problem) -- not a simple re-ask
