---
name: salary-negotiation-script
description: |
  Produces a word-for-word salary negotiation dialogue with branching responses for
  different scenarios including initial offers, raise requests, pushback handling,
  and closing techniques. Works for both new job offers and current role raises.
  Use when the user wants to negotiate salary, prepare for a compensation conversation,
  counter an offer, or ask for a raise with specific talking points.
  Do NOT use for written counter-offer emails (use counter-offer-letter), freelance rate
  setting (use freelance-rate-calculator), or general career planning (use career-pivot-roadmap).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "salary-negotiation career template"
  category: "career-development"
  subcategory: "career-growth"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Salary Negotiation Script

## When to Use

- User has received a job offer and wants to negotiate the compensation
- User wants to ask their current employer for a raise
- User needs word-for-word talking points for a salary conversation
- User asks how to respond when given a number they want to counter
- User wants to prepare for pushback during a compensation discussion
- Do NOT use when: user needs a written counter-offer email (use `counter-offer-letter`), user wants to set freelance rates (use `freelance-rate-calculator`), user wants to build a promotion case document (use `promotion-case-builder`)

## Process

1. **Gather negotiation context.** Collect the specific details before scripting:
   - Scenario type: new job offer negotiation OR raise request at current employer
   - Current compensation (salary, bonus, equity, benefits)
   - The offer or current salary being negotiated
   - User's target number and walk-away number (minimum acceptable)
   - 2-3 strongest justification points (market data, achievements, competing offers, expanded scope)
   - The person they will be negotiating with (hiring manager, HR, direct manager)
   - User's leverage level: strong (competing offer, hard-to-replace skills), moderate (solid performer, market data), limited (early career, no alternatives)
   - Any constraints or concerns (relocation, timeline, non-compete, specific benefits that matter)

2. **Build the opening anchor.** Script the first statement:
   - For new offers: express enthusiasm for the role, then introduce the counter
   - For raise requests: frame the conversation around value delivered, then state the ask
   - The opening must include the specific number and the top justification
   - Use collaborative language ("based on my research" not "I demand")
   - The opening anchor should be 10-15% above the target to leave room for negotiation

3. **Script the branching responses.** Prepare for the most common employer responses:
   - **Branch A: "That's above our budget"** -- Redirect to total compensation, ask what flexibility exists
   - **Branch B: "We need to think about it"** -- Establish a timeline, express continued interest
   - **Branch C: "That's our best offer"** -- Explore non-salary components (signing bonus, equity, PTO, remote work, title)
   - **Branch D: "We can meet you partway"** -- Evaluate the counter, decide whether to accept or push once more
   - **Branch E: "We can do that"** -- Accept gracefully, confirm in writing
   - Each branch provides exact words to say, not paraphrased guidance

4. **Script the closing.** Prepare the ending for each scenario:
   - Acceptance: "Thank you, I'm excited to accept. Can you confirm the updated terms in writing?"
   - Partial win: "I appreciate you working with me on this. I'd like to accept at [agreed number] with [agreed terms]."
   - Needs time: "Thank you for the conversation. I'd like to take 24-48 hours to review. When would you need my decision by?"
   - Walking away: "I appreciate the offer and your time, but the gap between what I need and what's available is too large for me to accept. I wish you the best in filling the role."

5. **Add tactical notes.** Include specific tactical guidance:
   - When to use silence (after stating your number, pause and let them respond)
   - How to handle the "what are your salary expectations?" question if it comes before an offer
   - What to do if they ask about current salary (deflect to target range)
   - How to follow up if the conversation ends without resolution

## Output Format

```
## Salary Negotiation Script: [Scenario Type]

**Context:** [Offer/current situation summary]
**Your target:** $[Target amount]
**Your anchor (opening ask):** $[Anchor amount -- 10-15% above target]
**Your walk-away:** $[Minimum acceptable]

---

### Opening Statement

> "[Exact words to open the negotiation]"

**Key elements in this opening:**
- [What this opening accomplishes]
- [Why this framing works]

---

### Response Branches

#### Branch A: "That's above our budget / We can't go that high"

**Them:** "We appreciate your interest, but [anchor] is above our range for this role."

> **You:** "[Exact response redirecting to total compensation or flexibility]"

**If they name a ceiling:**

> **You:** "[Exact response exploring non-salary components]"

---

#### Branch B: "We need to think about it / Let me check with [decision-maker]"

**Them:** "That's a fair point. Let me discuss this with [person] and get back to you."

> **You:** "[Exact response establishing timeline and maintaining momentum]"

**Follow-up if no response in [X] days:**

> **You:** "[Exact follow-up message]"

---

#### Branch C: "This is our best and final offer"

**Them:** "We've gone as high as we can on base salary."

> **You:** "[Exact response pivoting to non-salary components]"

**Non-salary items to negotiate:**
- [Item 1]: "[Exact ask]"
- [Item 2]: "[Exact ask]"
- [Item 3]: "[Exact ask]"

---

#### Branch D: "We can meet you at [counter]"

**Them:** "We can offer $[counter amount]."

**If counter is at or above your target:**

> **You:** "[Exact acceptance response]"

**If counter is between walk-away and target:**

> **You:** "[Exact response for one more push or acceptance]"

**If counter is below walk-away:**

> **You:** "[Exact response declining respectfully]"

---

#### Branch E: "We can do that"

**Them:** "We can make that work."

> **You:** "[Exact acceptance and confirmation response]"

---

### Closing Scripts

**Accepting:**
> "[Exact acceptance statement with written confirmation request]"

**Requesting time:**
> "[Exact statement asking for 24-48 hours]"

**Declining respectfully:**
> "[Exact decline statement maintaining the relationship]"

---

### Tactical Notes

- **Silence:** [When and how to use strategic pauses]
- **"What are your expectations?":** [Exact deflection if asked before receiving an offer]
- **Current salary question:** [Exact response deflecting to target range]
- **Follow-up timing:** [When and how to follow up after the conversation]
```

## Rules

1. Always produce a complete negotiation script with exact words for every scenario -- never tips about negotiation strategy or generic advice
2. Every response branch must contain word-for-word dialogue the user can say, enclosed in blockquotes -- not paraphrased suggestions like "politely redirect the conversation"
3. The opening anchor must be 10-15% above the user's stated target to create negotiation room -- if the user's target IS the offer, anchor at 10-15% above
4. NEVER tell the user to lie about competing offers they do not have -- all justification points must be based on real data the user can substantiate
5. Include at least 4 response branches covering: budget pushback, delay, final offer, and partial counter
6. Every branch must end with a clear next step (what to say or do after)
7. The script must include a graceful walk-away option -- negotiation only works if the user is prepared to decline
8. NEVER use aggressive, adversarial, or ultimatum language -- all scripts use collaborative framing ("based on my research," "I'd like to find something that works for both of us")
9. Include the tactical note about silence after stating the number -- this is the single most effective negotiation technique and must not be omitted
10. If the user has no leverage (no competing offer, early career, limited experience), adjust the script to use achievement-based and market-data-based justification rather than leverage-based tactics

## Edge Cases

- **User has a competing offer:** Include the competing offer as a justification point but script it carefully: "I have another opportunity at $[X], and while this role is my first choice, the compensation gap is significant." Never frame it as a threat or ultimatum.
- **User is negotiating a first job out of school:** Adjust expectations and language. The anchor should be more modest (5-10% above offer). Focus justification on market data for the role and location rather than past achievements. Include the non-salary negotiation items (signing bonus, start date, PTO) as primary targets since base salary flexibility may be limited for entry-level roles.
- **User is asking for a raise (not negotiating a new offer):** Restructure the script to lead with accomplishments and expanded scope. The opening should reference specific metrics and value delivered. Include a branch for "the budget cycle isn't until [future date]" with a response that locks in commitment for the next cycle.
- **User does not know their market value:** Before scripting, ask the user to research salary ranges for their role, location, and experience level using publicly available salary aggregation tools. The script cannot be written without a target number grounded in market data.
- **Remote work or benefits are more important than salary:** Adjust the script to anchor on the non-salary item first. Structure branches around remote work negotiation, PTO, equity, or other benefits rather than base salary. Include exact language for redirecting a salary conversation to the non-salary priority.

## Example

**Input:** "I got a job offer for $95,000 as a senior marketing manager. My research shows the market range is $100,000-$120,000 for this role in my city. I'd like to get to $110,000. My minimum is $102,000. I don't have a competing offer but I do have 7 years of experience and I led a campaign that generated $2M in pipeline."

**Output:**

## Salary Negotiation Script: New Job Offer Counter

**Context:** Offered $95,000 for Senior Marketing Manager; market range $100K-$120K
**Your target:** $110,000
**Your anchor (opening ask):** $118,000
**Your walk-away:** $102,000

---

### Opening Statement

> "Thank you so much for the offer -- I'm genuinely excited about this role and the team. I've done some research on compensation for senior marketing managers in [city] with my level of experience, and the market range I'm seeing is $100,000 to $120,000. Given my 7 years of experience and my track record -- including leading a campaign that generated $2 million in pipeline -- I was hoping we could discuss a base salary closer to $118,000. Is there flexibility to get closer to that range?"

**Key elements in this opening:**
- Leads with enthusiasm (shows you want the job, not just more money)
- Cites market data as the basis (external justification, not personal need)
- Includes a specific achievement with a metric ($2M pipeline)
- Anchors at $118K to create room to land at $110K
- Ends with a question, not a demand

---

### Response Branches

#### Branch A: "That's above our budget"

**Them:** "We appreciate your research, but $118K is above the range for this position. Our budget tops out around $100K-$105K."

> **You:** "I understand there are budget constraints, and I appreciate you sharing the range. Given my experience leading revenue-generating campaigns -- the $2M pipeline result being one example -- I believe I'd be contributing above a typical senior marketing manager level from day one. Could we explore meeting at $108,000? I'm also open to discussing the total compensation package -- signing bonus, performance bonus structure, or equity -- if that gives us more flexibility to close the gap."

**If they hold firm at $105K:**

> **You:** "I appreciate you being transparent about the ceiling. If $105,000 is the maximum on base, could we structure a performance bonus that brings total compensation closer to my target? For example, a $5,000-$10,000 bonus tied to measurable marketing outcomes in the first year?"

---

#### Branch B: "Let me check with the team"

**Them:** "That's a fair point about the market data. Let me take this back to our VP and HR and see what we can do."

> **You:** "Of course, I appreciate you advocating for that. When would be a good time to reconnect? I want to make sure we can finalize things in a timely way since I'm eager to get started."

**If no response after 3 business days:**

> **You:** "Hi [Name], I wanted to follow up on our compensation conversation from [date]. I remain very excited about the role and the team, and I'm hoping we can finalize the details soon. Is there an update on the salary discussion?"

---

#### Branch C: "This is our final offer"

**Them:** "$100,000 is the absolute max we can do on base salary. That's our final number."

> **You:** "I appreciate you working to get to $100,000 -- that shows good faith and I value that. Since there isn't more room on base, I'd love to explore a few other elements that would make the total package work for me."

**Non-salary items to negotiate:**
- Signing bonus: "Would a one-time signing bonus of $8,000-$10,000 be possible? That would bridge the gap without affecting the ongoing salary budget."
- Additional PTO: "Could we add 5 additional PTO days to the standard package?"
- Remote flexibility: "Would the team be open to a hybrid schedule with 3 days remote per week?"
- Early review: "Could we schedule a 6-month compensation review with the possibility of an adjustment based on performance?"

---

#### Branch D: "We can offer $108,000"

**Them:** "We talked it over and can offer $108,000."

**$108K is between target ($110K) and walk-away ($102K) -- close enough to accept or push once:**

> **You:** "Thank you -- I really appreciate you working with me on this. $108,000 is much closer to where I'd hoped to be. Would $110,000 be possible? That's right in line with the market midpoint and would make this a very easy yes. If not, I understand, and $108,000 with the other terms we've discussed works for me."

**If they hold at $108K:**

> **You:** "That works for me. I'm excited to accept at $108,000. Could you send the updated offer letter confirming the new terms?"

---

#### Branch E: "We can do $118,000"

**Them:** "We reviewed your background and the market data, and we can offer $118,000."

> **You:** "That's wonderful -- thank you for recognizing the value I'll bring to the team. I'm thrilled to accept. Could you send the updated offer letter so I can review and sign? I'm looking forward to getting started."

---

### Closing Scripts

**Accepting:**
> "Thank you -- I'm excited to accept. Could you send the updated offer letter with the agreed terms? I'd like to review and sign within 24-48 hours so we can move forward."

**Requesting time:**
> "I appreciate you working through this with me. I'd like to take 24 hours to review everything before giving my final answer. Is that timeline comfortable for you?"

**Declining respectfully:**
> "I want to thank you sincerely for the offer and for the time you've invested in this process. Unfortunately, the gap between the compensation I need and what's available is too significant for me to accept in good conscience. I have a lot of respect for the team and the work you're doing, and I hope our paths cross again in the future."

---

### Tactical Notes

- **Silence:** After stating your anchor number ($118K), stop talking. Do not fill the silence with justification or nervous chatter. Let them respond first. The pause signals confidence and gives them space to process.
- **"What are your salary expectations?" (if asked before an offer):** "I'd prefer to understand the full scope of the role and the compensation range you've budgeted before sharing a number. Could you share the range for this position?"
- **"What's your current salary?"** "I'd prefer to focus on the value I'll bring to this role and what the market supports for this position and level. Based on my research, the range for this role in [city] is $100K-$120K."
- **Follow-up timing:** If the conversation ends with "we'll get back to you," follow up after 3 business days. One follow-up is appropriate. After a second follow-up with no response, the silence is the answer.
