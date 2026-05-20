---
name: customer-discovery-interview
description: |
  Creates a customer discovery interview guide with opening script, problem-exploration questions, solution-reaction prompts, closing protocol, and post-interview analysis template using customer development methodology. Use when the user asks about customer discovery, customer interviews, talking to customers, problem interviews, solution interviews, or customer development research.
  Do NOT use for idea validation experiments (use idea-validation), user research for an existing product (use user-research-plan), or survey design (use employee-survey).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "entrepreneurship research strategy planning analysis"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Customer Discovery Interview

## When to Use

**Use this skill when:**
- A founder, product manager, or researcher wants to design and conduct structured conversations with potential customers before building a product or feature -- the goal is learning, not selling
- The user is in a pre-product or early discovery phase and needs to test whether a specific problem exists, how painful it is, and how people currently cope with it
- The user needs a complete interview guide including opening script, question sequence, follow-up probes, and a structured method for analyzing findings across multiple conversations
- The user describes wanting to "talk to customers," "do customer development," run "problem interviews," or validate whether their startup idea solves a real problem
- The user has a hypothesis about a target customer segment and a problem space but has not yet spoken to anyone in that segment -- they need a methodology to prevent asking leading questions or pitching before listening
- The user has completed a few informal conversations and wants to formalize their approach before conducting a larger batch of 10-20 interviews
- The user is applying Steve Blank or Rob Fitzpatrick ("The Mom Test") customer development methodology and wants structured guidance on execution

**Do NOT use this skill when:**
- The user wants to design A/B tests, landing page experiments, or behavioral validation experiments beyond interviews -- use `idea-validation` instead
- The user has a shipped product and wants to understand how existing users experience it -- that is usability or user research, use `user-research-plan`
- The user wants to create a quantitative survey for a large audience -- use `employee-survey` or an appropriate survey design skill
- The user wants to build a Lean Canvas or business model map -- use `lean-canvas`
- The user already knows the problem is real (validated by prior research or their own experience as a practitioner) and is now designing the solution -- move to solution design or MVP definition, not discovery
- The user is conducting academic qualitative research with IRB requirements -- the methodology here is practical and commercial, not academic; ethical review, informed consent documentation, and data governance protocols differ significantly
- The user wants to evaluate the competitive landscape or pricing strategy in detail -- those are separate activities that come after discovery confirms problem-market fit

---

## Process

### Step 1: Clarify the Interview Objective and Assumptions

Before writing a single question, establish what you are trying to learn and what assumptions you are testing. The interview exists to prove or disprove specific beliefs, not to collect general feedback.

- Ask the user: What is the problem space? Describe the situation in which the target customer experiences friction -- be as specific as possible. "Project management is hard" is not a problem space. "Freelance graphic designers lose track of client feedback scattered across email, Slack DMs, and Loom videos" is a problem space.
- Identify the interview type: **problem interview** (Does this problem exist? How painful is it? How does the customer cope today?) vs. **solution interview** (Does our proposed solution resonate? Would it change their behavior?). Never combine both fully in one session -- problem interviews must happen first and run to completion before solution concepts are introduced.
- List 3-5 specific assumptions to test. Each assumption must be falsifiable. Format: "We believe [target customer] experiences [specific problem] when [situation], and that it causes [specific consequence]." Write down what evidence would confirm or contradict each assumption.
- Establish the signal threshold before conducting interviews. "People seemed interested" is not a threshold. Define it in advance: for example, "At least 7 of 10 interviewees describe this problem unprompted without being prompted with leading language" is a threshold. Defining thresholds in advance prevents moving the goalposts when results are ambiguous.
- Confirm the number of planned interviews. The minimum for a single customer segment is 5 interviews to see any pattern. 10-15 interviews typically achieve saturation -- the point at which new interviews stop producing new insights. If targeting multiple customer segments (e.g., both the buyer and the user in a B2B context), plan separate interview batches of 10+ per segment.

### Step 2: Define the Participant Profile and Recruitment Plan

The most common reason customer discovery fails is interviewing the wrong people. Being precise about participant criteria before recruitment saves significant time.

- Define the ideal participant profile using four dimensions: **role** (specific job title or life context, not broad categories), **behavior** (what they must currently be doing that relates to the problem -- this is the most important filter), **context** (company size, industry, geography, or life stage if relevant), and **decision authority** (are they the person who would actually change their behavior or make a purchase?).
- Write 2-3 screening questions that disqualify candidates efficiently before you book a 30-minute call. Screening questions should confirm the must-have behavior. For a B2B product, a screening question might be: "Roughly how many hours per week do you spend [specific activity]?" If the answer is "almost never," this person cannot give you reliable data about the problem.
- Identify recruitment channels in order of reliability: (1) warm introductions from your network -- highest quality because the referrer pre-qualifies and the interviewee is more likely to be candid; (2) professional communities and forums (LinkedIn groups, Slack communities, subreddits, industry associations) where the target segment self-organizes; (3) cold outreach via LinkedIn or email with a concise, honest message explaining you are doing research and are not selling anything; (4) paid recruitment panels (Respondent.io, User Interviews) for consumer segments that are hard to reach organically.
- Explicitly define who NOT to interview: friends and family (they optimize for your feelings, not the truth), colleagues and co-workers (same bias), people who already know your product idea (they will evaluate the solution, not describe the problem naturally), and people who self-identify as "entrepreneurs" or "innovators" -- they tend to over-report pain and over-commit to hypothetical adoption.
- Aim for diversity within the segment. If interviewing freelance developers, include people at different income levels, specializations (front-end, back-end, full-stack), and years of experience. Patterns that hold across variation in the segment are stronger signals than patterns that only appear in a narrow slice.
- Offer something of value in exchange for time. For busy professionals, a 30-minute calendar request with no incentive has poor conversion. Consider: a $25-50 Amazon gift card, a brief summary of your research findings, or simply being very specific and respectful about the time ask ("I will keep this to exactly 30 minutes and will not try to sell you anything").

### Step 3: Write the Opening Script

The opening phase runs 3-5 minutes and accomplishes three objectives: establishing rapport, setting behavioral norms for the conversation (you talk, I listen), and obtaining consent to record or take notes.

- Write an explicit statement of purpose that mentions research and explicitly excludes selling. The exact phrasing matters. "I'm exploring how [segment] handles [problem area]" is neutral. "I'm building a tool for [segment]" primes them to evaluate a product, not describe their experience. Use the neutral framing.
- Set the expectation that there are no right answers and that candid, negative responses are more helpful than polite positive ones. This directly counteracts social desirability bias -- the tendency for interviewees to say what they think you want to hear. Say explicitly: "If what I'm exploring turns out not to be a real problem, that is exactly the kind of thing I need to know. Honest feedback that redirects me is more valuable than encouragement."
- Ask permission to record. Recording is preferable to live note-taking because it lets you maintain eye contact and follow conversational threads without breaking concentration to write. Transcription tools (such as Otter.ai or built-in Zoom transcription) can produce a full transcript for later analysis. Always ask for explicit verbal consent: "Is it okay if I record this call for my own notes? I will not share the recording with anyone."
- Start with a warm-up question anchored in their professional identity or daily context, not in the problem. The warm-up question lowers defensiveness by starting on comfortable ground: "Tell me a bit about your role -- what does a typical week look like for you?" Jumping directly to problem questions creates an interrogation dynamic.

### Step 4: Design the Problem Exploration Questions

This is the most important section of the interview. The goal is to elicit specific, behavioral, past-tense accounts of how the interviewee currently experiences the problem -- without leading them toward your hypothesis.

- The foundational question structure from Rob Fitzpatrick's "The Mom Test" framework: ask about their life, not your idea. The interviewee's current behavior and past experiences are ground truth. Their predictions about what they would do in the future are not.
- Order questions from general to specific. Begin with the workflow or context, narrow to friction points within that workflow, then focus on a specific recent incident. Example flow: "Walk me through your process for X" → "What parts of that are most frustrating?" → "Can you tell me about the last time that frustration caused a real problem for you?"
- The LIFTOFF sequence is a reliable question architecture for problem exploration:
  - **L -- Last time:** "Tell me about the last time you had to deal with [problem area]." Anchors the conversation in a specific, real event rather than generalizations.
  - **I -- Impact:** "What happened as a result? What did it cost you -- in time, money, or stress?"
  - **F -- Frequency:** "How often does this come up?"
  - **T -- Today:** "What are you doing today to handle this? What tools or approaches do you use?"
  - **O -- Obstacles:** "What does not work well about your current approach?"
  - **F -- Feel:** "How would you describe the emotional experience of dealing with this?" (Often the most revealing question -- pain expressed emotionally signals intensity that numerical scales miss)
- The three signals you are listening for during problem exploration are: **frequency** (does this happen daily, weekly, or once a year?), **intensity** (is this a minor irritant or a business-stopping problem?), and **existing spend** (are they already paying for something -- even an imperfect workaround -- to address this?). All three must be present for a problem to support a viable product.
- Never ask "Do you have a problem with X?" or "Is X frustrating for you?" These are leading questions that create confirmation bias. The interviewee will almost always say yes because it feels impolite to say no. Instead, describe the workflow context and let them identify the friction points themselves.
- Design 3-4 follow-up probes for use whenever an answer is vague, abstract, or hypothetical. Good probes: "Can you give me a specific example of when that happened?" / "What exactly did you do when that occurred?" / "What was the outcome?" / "Can you show me what that looks like?" -- the last one is particularly powerful in remote video interviews because it invites screen sharing of the actual workflow.
- Listen for the "hair on fire" signal: unprompted, strong, specific language about the problem. If someone says "This is one of the most painful parts of my job" without you suggesting it, that is a qualitatively different signal than someone who agrees it is painful only after you suggest it. Record the verbatim language -- not your summary of it.

### Step 5: Structure the Solution Reaction Phase (Only If Appropriate)

Solution reaction questions should only be included in interviews where (a) you have already completed enough problem interviews to validate the problem exists and (b) you have a specific concept to react to. Do not attempt both problem discovery and solution validation simultaneously in early-stage research -- you will get corrupted data on both.

- Introduce the concept with a two-sentence description maximum. Do not show wireframes, mockups, or detailed feature lists in an initial solution reaction conversation. Specific feature descriptions anchor the interviewee's thinking to your implementation and prevent them from reacting to the underlying value proposition.
- Frame the concept as something you have heard described by others, not something you built: "Based on conversations I have been having, I am exploring an idea in the direction of [X]. I want to see if it resonates with your experience." This framing keeps the interviewee in the evaluator role rather than the supportive role.
- Do not ask "Would you use this?" or "Would you pay for this?" The research on hypothetical purchasing behavior is unambiguous -- stated intention dramatically overestimates actual behavior. Instead, ask about current behavior as a proxy: "What are you currently paying for [the closest alternative] per month?" and "How many hours per week does [the problem] cost you?" These anchors let you infer willingness to pay from real economic behavior.
- Watch for the "polite yes" -- an interviewee who responds with generic enthusiasm ("That sounds great!" "Oh, I would definitely use something like that!") without specifics is not giving you a signal. A real signal looks like: "If that worked the way you described, it would save me about 4 hours a week and I currently pay $80/month for [alternative] that does not fully solve it." Specificity is evidence. Enthusiasm without specificity is noise.
- Test for switching friction: "What would make you hesitate to switch to something new like this?" Objections named in this phase are genuine barriers to adoption -- they are more valuable than agreement.

### Step 6: Run the Closing Protocol

The final 3-5 minutes of the interview serve several functions beyond wrapping up politely -- they are a systematic information-gathering opportunity that most interviewers underuse.

- Ask the meta-question: "Is there anything about [problem area] that I should have asked you but did not?" This question reliably surfaces the most important insight of the conversation. Interviewees who have been listening carefully to your questions will often identify a dimension of the problem you have not considered.
- Request referrals using warm language: "Do you know 2-3 other people who deal with this same kind of challenge? Would you be willing to make an email introduction? I promise to keep it brief and respectful of their time." Referral chains produce the best subsequent interviewees because the referrer implicitly pre-qualifies them and they enter the conversation with trust rather than skepticism.
- Ask for a follow-up commitment: "Would you be willing to take a look at something I put together in a few weeks and give me 15 minutes of feedback?" This builds an early-adopter panel and signals genuine interest -- someone who says yes without hesitation is a materially different signal than someone who says "maybe."
- Express genuine gratitude and do not over-explain what you plan to do with the information. Interviewees who feel their input will be meaningfully used are more likely to respond to follow-up requests.

### Step 7: Execute Post-Interview Analysis

The single most common failure mode in customer discovery is conducting interviews but not systematically analyzing them. Without a structured synthesis process, founders remember the most recent interview most vividly and unconsciously weight it more than earlier interviews.

- Within 10 minutes of ending the interview, write unstructured notes capturing: the 3 most surprising things you heard, any verbatim quotes that struck you, the emotional intensity of the conversation, and any adjustments to make to the next interview. Memory of the specific language and tone of an interview degrades by approximately 50% within an hour. The notes written in the first 10 minutes are qualitatively different from notes written the next day.
- After each interview, update the assumption tracker: for each assumption you listed in Step 1, mark it as supported, contradicted, or unclear based on the evidence from this interview. You are not drawing conclusions yet -- you are recording raw signals.
- After completing all planned interviews (or when reaching saturation), build the pattern matrix. The pattern matrix has one row per finding and one column per interview. For each interview, mark whether this finding was mentioned spontaneously (strong signal), mentioned when probed (moderate signal), or not mentioned (absent). Findings mentioned spontaneously by 7+ of 10 interviewees are actionable signals. Findings mentioned only when directly asked are insufficient evidence.
- Identify the "hair on fire" problem -- the problem that (a) was mentioned spontaneously by the largest number of interviewees, (b) generated the strongest emotional language, and (c) is already causing people to spend money or time on imperfect workarounds. The combination of all three is the highest-confidence signal in customer discovery.
- Apply the proceed/pivot/kill framework. Define this before you start interviews (Step 1), then apply it honestly. The most common mistake is conducting 15 interviews that return mixed results and concluding "there's definitely something here" -- this is motivated reasoning. If your pre-defined threshold is not met, the right call is a pivot (change the segment or problem framing) or a kill, not a reinterpretation of the threshold.

---

## Output Format

```
## Customer Discovery Interview Guide: [Problem Area]

---

### Interview Objective

| Field | Value |
|-------|-------|
| **Problem space** | [Specific situation in which target customer experiences friction] |
| **Target customer** | [Specific segment -- role + behavior + context] |
| **Interview type** | Problem interview / Solution interview / Combined (with rationale) |
| **Key assumptions to test** | 1. [Assumption 1 -- falsifiable] / 2. [Assumption 2] / 3. [Assumption 3] |
| **Signal threshold (proceed)** | [e.g., 7 of 10 describe this problem unprompted] |
| **Signal threshold (kill)** | [e.g., Fewer than 3 of 10 confirm the problem independently] |
| **Target interviews** | [Number] across [Number of segments] |
| **Duration per interview** | 30-45 minutes |

---

### Participant Profile

| Field | Criteria |
|-------|----------|
| **Role / context** | [Specific job title, life stage, or role -- not broad] |
| **Must-have behavior** | [What they must currently be doing that relates to the problem] |
| **Context** | [Company size / industry / geography / life stage if relevant] |
| **Decision authority** | [Are they the decision-maker, influencer, or end-user?] |
| **Disqualifiers** | [Who to exclude and why] |

**Screening questions (ask before booking):**
1. [Confirms they are in the target segment]
2. [Confirms they currently experience the relevant behavior]
3. [Confirms decision authority or relevant level of involvement]

**Recruitment channels (in order of priority):**
1. Warm introductions via [specific network or context]
2. [Specific community, forum, or platform]
3. Cold outreach via [platform] with [specific message frame]

---

### Interview Script

#### Phase 1: Opening (3-5 min)

**Purpose statement:**
"Hi [Name], thank you for making time. I am [Your Name]. I am doing research on how [specific segment] handles [problem area]. I am not here to sell anything -- I genuinely want to understand your experience. There are no right or wrong answers, and honestly, if you tell me this is not a real problem for you, that is some of the most useful information I can get. This should take about 30 minutes. Is it okay if I record this call just for my own notes? I will not share it with anyone."

**Warm-up question:**
"Before we get into specifics -- can you tell me a bit about your role and what a typical [day / week / project cycle] looks like for you?"

*(Listen for: context that will help you interpret later answers. Do not probe or redirect. This is about building rapport and understanding their frame of reference.)*

---

#### Phase 2: Problem Exploration (15-20 min)

| # | Question | What to Listen For | Probes If Answer Is Vague |
|---|---------|-------------------|--------------------------|
| 1 | "Walk me through how you currently handle [problem area]. Start from the beginning." | Workflow steps, tools, people involved, decision points | "What happens first? What comes next?" |
| 2 | "What is the most frustrating or time-consuming part of that process for you?" | Self-identified pain points -- note exact language used | "Can you tell me more about that?" |
| 3 | "Can you tell me about the last time [the frustrating part] caused a real problem for you?" | Specific incident, consequences, recency, emotional memory | "What exactly happened? What was the outcome?" |
| 4 | "How often does something like that come up?" | Frequency -- daily, weekly, monthly | "Is that a one-time thing or pretty typical?" |
| 5 | "What have you tried to solve that? What tools or approaches do you use?" | Existing alternatives, workarounds, prior spend | "How well does that work? What does not work about it?" |
| 6 | "How much time per [week / month] would you estimate this takes you -- including the workarounds?" | Quantified time drain | "Is that consistent or does it spike sometimes?" |
| 7 | "Have you ever lost money, a client, or an opportunity because of this problem?" | Economic impact, stake size | "How did you handle that situation?" |
| 8 | "If you could change one thing about how you handle [problem area] right now, what would it be?" | Ideal outcome in their words, not yours | "What would that look like in practice?" |

**Universal follow-up probes (use after any vague or hypothetical answer):**
- "Can you give me a specific example of when that happened?"
- "What did you actually do in that situation?"
- "How did that turn out?"
- "How did that make you feel?"
- "Why do you think that happens?"
- *(Silence -- wait 3-5 seconds after any answer. Interviewees fill silence with the most honest elaborations.)*

---

#### Phase 3: Solution Reaction (5-10 min) -- include only in solution interviews or late-stage problem interviews

**Introduction framing:**
"Based on conversations I have been having with people in similar situations, there is an idea I have been exploring in this space. I want to share it at a high level and get your honest reaction -- especially if your gut response is skepticism."

*[Two-sentence description of the concept -- describe the value proposition, not the features. Example: "It is essentially a single place where all client feedback on a project lives, connected to the specific deliverable it refers to, so nothing gets lost across email threads."]*

| # | Question | What to Listen For |
|---|---------|-------------------|
| 1 | "What is your first reaction to that?" | Specific enthusiasm vs. polite agreement vs. genuine skepticism |
| 2 | "How would that change -- if at all -- the way you currently handle [problem area]?" | Perceived behavioral change, concrete use case |
| 3 | "What would make you hesitate to try something like this?" | Real objections, switching friction, trust barriers |
| 4 | "What would it need to do -- that it might not be doing -- for you to actually switch from your current approach?" | Minimum viable feature set from their perspective |
| 5 | "What are you currently paying -- in money or time -- for your current approach to this?" | Real economic baseline for willingness-to-pay inference |

---

#### Phase 4: Closing (3-5 min)

1. "Is there anything about [problem area] that I should have asked you but did not?"
2. "Do you know 2-3 other people who deal with this same challenge? Would you be willing to make an email introduction? I will keep it very brief."
3. "Would you be open to taking a look at something I put together in the next few weeks and giving me 15 minutes of quick feedback?"
4. "Thank you so much -- this has been genuinely useful. I will let you know what I find."

---

### Post-Interview Analysis Template

**Interview #:** ___
**Date:** ___
**Participant:** [Role / Company size / Industry -- anonymized if needed]
**Interview type:** Problem / Solution
**Signal strength:** Strong / Moderate / Weak

| Category | Notes |
|----------|-------|
| **Top 3 verbatim quotes** | 1. "[Exact quote]" 2. "[Exact quote]" 3. "[Exact quote]" |
| **Problem confirmed?** | Yes (spontaneous) / Yes (when probed) / No / Partially |
| **Current workaround** | [What they use today, including paid tools] |
| **Time cost (stated)** | [Hours per week or month] |
| **Economic cost (stated)** | [Money spent on alternatives or lost due to the problem] |
| **Pain intensity (1-10, their rating)** | [Number + context for the rating] |
| **Frequency** | [Daily / Weekly / Monthly / Occasional] |
| **Switching willingness** | High / Medium / Low -- [evidence for this rating] |
| **Key objections** | [Specific objections raised, verbatim if possible] |
| **Surprises** | [Anything unexpected -- new problem dimensions, different customer context] |
| **Assumption updates** | [Which assumptions were supported, contradicted, or clarified] |
| **Referrals obtained** | [Number of referrals / Names if available] |
| **Follow-up commitment** | Yes / No |

---

### Pattern Matrix (complete after all interviews)

| Finding | Int. 1 | Int. 2 | Int. 3 | Int. 4 | Int. 5 | Int. 6 | Int. 7 | Int. 8 | Int. 9 | Int. 10 | Count | Signal |
|---------|--------|--------|--------|--------|--------|--------|--------|--------|--------|---------|-------|--------|
| [Problem/pattern] | S/P/-- | S/P/-- | S/P/-- | ... | ... | ... | ... | ... | ... | ... | X/10 | Strong/Mod/Weak |
| [Problem/pattern 2] | ... | | | | | | | | | | X/10 | |

*Key: S = mentioned spontaneously (strong signal), P = mentioned when probed (moderate signal), -- = not mentioned*

**"Hair on fire" problem (strongest signal overall):** [State the finding and the evidence]

---

### Decision Framework

| Decision | Criteria | Confidence | Next Step |
|----------|----------|-----------|-----------|
| **Proceed** | [Pre-defined threshold] spontaneously confirmed, economic impact quantified in 5+ interviews, active spend on imperfect workarounds present | High | Move to solution definition and MVP scoping |
| **Proceed with modification** | Problem confirmed but different framing, adjacent pain stronger than expected | Medium | Reframe hypothesis, conduct 5 more targeted interviews |
| **Pivot** | Problem exists but target segment wrong, or different problem is clearly stronger | Low-Medium | Redefine segment or problem hypothesis, new interview batch |
| **Kill** | [Pre-defined kill threshold] -- problem not confirmed, no economic impact, no current spend on workarounds | Low | Document learnings, apply to adjacent hypothesis |
```

---

## Rules

1. **Never ask predictive purchasing questions.** "Would you pay for this?" and "Would you buy this?" are the most common mistakes in customer discovery interviews. Research in behavioral economics consistently shows that stated intent overestimates actual purchase behavior by 4-10x. Instead, ask about current spending as a proxy: "What are you currently paying for [the closest alternative]?" and "How much time per week does this cost you?" Actual economic behavior is evidence. Predicted future behavior is noise.

2. **Never pitch during a problem interview.** The moment you introduce a product concept, solution description, or feature list, the interviewee shifts cognitive mode from honest reporter to polite evaluator. You will start receiving responses shaped by their desire to be encouraging, not by their genuine experience. Keep the problem interview completely free of any reference to your solution until Phase 3, and only enter Phase 3 if you are intentionally running a solution interview.

3. **Require spontaneous confirmation for the "hair on fire" signal.** A problem confirmed only after you name it and ask "is that a problem for you?" is a weak signal at best. Real evidence is when an interviewee uses strong, specific language to describe a problem without you having introduced it. In your pattern matrix, distinguish between spontaneous mentions and probe-induced mentions -- they have fundamentally different implications for product viability.

4. **Conduct problem interviews before solution interviews, always.** Running solution interviews before you have established through problem interviews that the problem is real and frequent produces corrupted data. If you show a concept to someone who does not actually experience the problem, their reaction will be enthusiasm or confusion -- neither is useful. The sequence is: problem interviews (5-10+) → analyze findings → confirm signal → then conduct solution interviews.

5. **Maintain a 20/80 speaking ratio.** If you are speaking more than 20% of the time in a 30-minute interview, you are presenting, not interviewing. Track this actively. If you catch yourself explaining, justifying, or filling silence with elaboration, stop. Ask the most recent question again, more simply, and wait. Silence is your most powerful tool. Most interviewees will fill a 3-5 second pause with the most honest and specific thing they said in the entire conversation.

6. **Use verbatim quotes, not summaries, in your analysis.** When you summarize an interviewee's response in your own language, you introduce your interpretation. When you record their exact words, you preserve the signal. The difference between "they said the process is slow" and "they said 'I basically have to redo this from scratch every single time'" is enormous in terms of the intensity signal it carries. Capture exact language for every finding that will appear in the pattern matrix.

7. **Never conduct fewer than 10 interviews before making a proceed/pivot/kill decision on a single segment.** Patterns in fewer than 5 interviews are statistically unreliable and cognitively distorted by recency bias and the vivid memory of a single strong interview. 10-15 interviews per segment is the minimum for a reliable signal. If the problem is dramatically confirmed or dramatically absent after 7 interviews, you may call it -- but document why you are stopping early and acknowledge the reduced confidence.

8. **Define signal thresholds before the first interview, not after.** Post-hoc threshold setting is motivated reasoning dressed as rigor. After 10 interviews that produced mixed results, any entrepreneur can construct a narrative that the results are encouraging. The only protection against this is to write down in advance: "We will proceed if X, pivot if Y, kill if Z." Then honor those criteria regardless of what you hoped the interviews would reveal.

9. **Ask for referrals at the close of every interview, without exception.** Referral chains are the highest-quality source of subsequent interview participants because the referring interviewee implicitly pre-qualifies the new candidate as someone who deals with the same problem. A referral from an interviewee who described the problem as extremely painful is a warm lead to someone who likely shares that context. Skipping the referral request at the close is one of the most common and costly omissions in customer discovery execution.

10. **Write post-interview notes within 10 minutes of ending the call.** The specific language an interviewee used, the hesitation before answering a particular question, the moment of visible frustration or enthusiasm -- these disappear from memory rapidly and are not recoverable from a transcript alone. Notes written within 10 minutes capture micro-signals that disappear within an hour. Set a rule: the interview is not considered complete until the post-interview notes are written. Do not schedule interviews back-to-back without a 15-minute gap for this purpose.

11. **Separate the interviewee's lived problem from their proposed solution.** Interviewees will frequently offer feature ideas and solution proposals: "You should build a dashboard that shows..." or "If it integrated with Salesforce, that would be the killer feature." These are not useful at the problem discovery stage. The underlying problem that prompted the suggestion is useful -- the suggestion itself is not. When an interviewee proposes a solution, redirect: "That is helpful. Before we get into that -- can you tell me more about the specific situation that made you think of that? What is happening today that that would solve?" Extract the problem, not the proposed solution.

12. **Do not interview people who already know your idea.** This includes anyone you have pitched at a startup event, anyone who has seen your deck, and anyone to whom you have described the product. They have already shifted from the reporter role to the evaluator role. Their responses to problem questions will be contaminated by their prior knowledge of your solution. Maintain a clean separation between people you recruit for discovery interviews and people you have introduced to your concept.

---

## Edge Cases

### B2B Products Where the Buyer and User Are Different People

In B2B contexts, the person who experiences the problem daily (the user) is often not the person who approves a budget (the buyer). These two personas have different problems, different success metrics, and different objections, and they require separate interview batches.

The user interview focuses on daily workflow friction, emotional experience of the problem, workarounds currently in use, and what they wish they could change. The buyer interview focuses on the business case for change, budget ownership and approval process, how success would be measured, what the cost of the current approach is in business terms, and what would derail adoption. Design separate question sets for each persona. A product that solves the user's problem but does not satisfy the buyer's business case will not be purchased. A product that satisfies the buyer's business case but creates friction for users becomes shelfware. Both signal types are necessary. Conduct 10 user interviews and 5-8 buyer interviews at minimum, and explicitly map where their priorities align and diverge in your pattern analysis.

### Technical Products Where Users Cannot Articulate the Problem Verbally

For complex technical workflows -- developer tooling, data pipeline management, laboratory procedures -- verbal description is a poor representation of the actual problem. Users often have difficulty articulating tacit knowledge: things they do automatically and fluidly that still represent significant friction.

In these cases, supplement verbal interviews with **contextual inquiry**: ask the interviewee to share their screen and walk you through the actual workflow in real time, narrating as they go. Their narration during the live task will surface problems they would never surface in a retrospective verbal account. Watch for: micro-hesitations before a step, explanations that begin with "this is annoying but...", steps where they apologize for the complexity, workarounds that involve switching tools or copying data between systems, and spreadsheets or scripts they have built to compensate for a gap in existing tools. A spreadsheet maintained by a technical user to compensate for a missing feature is one of the strongest signals of a real, painful problem you will encounter in discovery research.

### Emerging Markets or Latent Needs Where Customers Do Not Know They Have the Problem

In some markets -- particularly those being created by new technology -- potential customers have not framed their experience as a "problem" because they have no reference point for a better alternative. They accept the current state as normal.

Do not attempt to name the problem and ask for agreement. That approach generates false positives. Instead, ask about the workflow broadly and listen for the symptoms: complaints about time spent, descriptions of steps they find tedious, frustration with errors or inconsistencies, mention of workarounds they have "just learned to live with." A customer who says "I guess I've just gotten used to doing it this way" while describing a 3-hour manual process is signaling a latent need. After 5-7 interviews where nobody spontaneously identifies the problem, do not conclude the problem does not exist -- evaluate whether the problem is truly latent (real but unrecognized) or whether your hypothesis is simply wrong. The test: if you can show them a dramatically better outcome in 60 seconds and they respond with genuine surprise ("I didn't know this was possible"), you have a latent need. If they shrug, the problem is not real.

### Remote Video Interviews and Maintaining Engagement Quality

Video interviews introduce specific friction that can reduce data quality: interviewees multitask more, emotional signals are harder to read, and the conversation can feel transactional without deliberate rapport-building.

Specific mitigations for remote interviews: Send a one-paragraph calendar invitation that explains the research purpose and confirms that no recording will be shared -- this reduces anxiety before the call. Begin with 2-3 minutes of genuine conversation about a contextually relevant topic (their industry, a recent event) before starting the warm-up question. Ask for screen shares during problem exploration: "Would you be willing to show me your current setup for this -- even briefly?" This activates visual memory and produces much richer description than verbal recall alone. Record the call with permission and use transcription. Watch for the interviewee's body language during Phase 2 -- a slight lean forward, a shift in facial expression, or an increase in speaking pace signals emotional connection to a problem. These are as important as the verbal content and are captured only if you are watching the video, not multitasking.

### Interviewees Who Want to Design the Solution

A common pattern: an interviewee who is deeply engaged with the problem will skip past problem description and start proposing detailed feature ideas. "What you should do is build a dashboard where..." This is not a problem -- it is actually a sign of a motivated potential customer. But if you follow this thread, you will end an interview with a feature list and no problem data.

The redirection technique: acknowledge the idea genuinely ("That is really interesting -- I want to make sure I capture that"), then immediately ask for the underlying problem: "Before we go further with that -- can you tell me more about the specific situation that made you think of that? What is actually happening in your workflow today that would make that feature valuable?" Run this redirect as many times as necessary. At the close of the interview, return to their feature ideas and ask: "Earlier you mentioned [feature idea] -- can I ask a few more questions about that?" By that point you have the full problem context and can properly evaluate whether their proposed solution addresses the most important part of their problem or a peripheral symptom.

### Interviewees From Cultures With High Social Deference (Avoiding Disagreement or Negativity)

In some professional and cultural contexts, interviewees will avoid expressing criticism or dissatisfaction because it feels rude, confrontational, or professionally risky. This creates systematic false positives in discovery data -- everyone sounds enthusiastic and no genuine pain surfaces.

Mitigations: Explicitly and repeatedly normalize negative responses: "I am genuinely more interested in what does not work than what does. The most valuable thing you can tell me is that this is not a real problem." Use third-person framing to reduce social pressure: "Some people I have spoken with describe [workflow] as really tedious -- does that match your experience, or is it different for you?" The third-person frame allows the interviewee to either join a consensus (reducing social risk) or differentiate themselves. Ask comparative questions rather than absolute ones: "Compared to other parts of your workflow, where would you rank this on the frustration scale?" Comparative framing is easier to answer honestly than "how painful is this?" because it anchors to relative experience rather than requiring an absolute judgment. If possible, recruit participants through anonymous or semi-anonymous channels where they have no professional relationship with you -- cold recruits from relevant communities often speak more candidly than warm introductions from your network.

### Interpreting Mixed Signals Across Interview Batches

After 10-15 interviews, it is common to have a pattern matrix that shows moderate signal on multiple problems but strong signal on none -- 5 of 10 mention Problem A, 4 of 10 mention Problem B, 3 of 10 mention Problem C. This is not the same as a strong signal, and should not be treated as one.

Mixed signal usually indicates one of three things: (1) the target segment is too broad -- different sub-segments have different primary problems and you are averaging across them; (2) the problem framing is slightly off -- there is a real problem but your questions are not landing on the sharpest version of it; or (3) the problem exists but is not painful enough to support a product -- people cope adequately with existing workarounds and will not change behavior for a solution. Diagnose which of these is occurring by looking at the matrix for clustering -- do the 5 interviewees who mentioned Problem A share a specific sub-characteristic (company size, role, industry) that the others do not? If yes, narrow the segment and conduct another 10 interviews within that sub-segment. If the clustering does not reveal a pattern, reframe the problem hypothesis and run a new batch.

---

## Example

**Input:** "I am working on a product that helps small-business owners manage their bookkeeping without needing an accountant for day-to-day tasks. I want to interview potential customers before I build anything to understand whether this is a real problem and what specifically they find painful about their current situation."

---

## Customer Discovery Interview Guide: Small Business Owner Bookkeeping

### Interview Objective

| Field | Value |
|-------|-------|
| **Problem space** | How small-business owners manage day-to-day financial record-keeping, categorization, and reporting without full-time accounting support |
| **Target customer** | Small-business owners (1-10 employees, $100K-$2M annual revenue) who are primarily responsible for their own bookkeeping -- either doing it themselves or managing a part-time bookkeeper |
| **Interview type** | Problem interview |
| **Key assumptions to test** | 1. Small-business owners experience significant time drain and anxiety from managing bookkeeping themselves, even when using tools like QuickBooks. 2. The most painful moment is month-end reconciliation and categorization, not day-to-day transaction entry. 3. They are already paying for bookkeeping software and/or part-time bookkeeper help but feel the result is unreliable or difficult to interpret. |
| **Signal threshold (proceed)** | 7 of 10 owners describe bookkeeping as a top-3 time or stress drain in their business, with specific incidents of errors or lost time that cost them money |
| **Signal threshold (kill)** | Fewer than 3 of 10 identify bookkeeping as a significant personal pain point; most report satisfaction with current tools or delegation |
| **Target interviews** | 12 (single segment -- owner-operators, not businesses with dedicated finance staff) |
| **Duration per interview** | 35 minutes |

---

### Participant Profile

| Field | Criteria |
|-------|----------|
| **Role / context** | Owner, founder, or sole proprietor of a business with 1-10 employees |
| **Must-have behavior** | Personally logs into their bookkeeping software at least once per month OR directly manages a part-time bookkeeper without an in-house CFO or controller |
| **Revenue context** | $100K-$2M annual revenue -- large enough that bookkeeping errors matter, small enough that dedicated finance staff is not standard |
| **Industry** | Service-based businesses preferred for first batch (consultants, tradespeople, agencies, therapists, personal trainers) -- product-based businesses involve inventory complexity that is a separate problem |
| **Disqualifiers** | Businesses with a full-time bookkeeper or controller on staff; businesses using a full-service outsourced accounting firm for monthly reconciliation; businesses under $50K revenue (bookkeeping complexity is too low) |

**Screening questions (ask before booking the call):**
1. "Do you personally handle any part of your bookkeeping -- things like categorizing transactions, reconciling accounts, or reviewing your P&L?" *(If they say their accountant handles everything and they never touch it, disqualify.)*
2. "Roughly how many hours per month would you estimate you spend on bookkeeping tasks -- including any time reviewing or correcting your bookkeeper's work?" *(Minimum 2 hours/month to qualify -- below this, the problem may not be acute enough.)*
3. "Are you the primary financial decision-maker for your business, or does someone else handle that?" *(Looking for owner-operators with direct involvement, not passive owners.)*

**Recruitment channels (in order of priority):**
1. Warm introductions via small-business owner networking groups (local Chamber of Commerce, BNI chapters, entrepreneur Slack communities such as Indie Hackers or local founders' groups)
2. Facebook groups for small-business owners in specific industries (e.g., "Self-Employed Contractors," "Freelance Designers Network")
3. LinkedIn outreach to owners of small service businesses with a concise message: "I am researching how small-business owners manage their bookkeeping and would love 30 minutes of your time. No sales pitch -- just genuine research. Happy to share what I find."

---

### Interview Script

#### Phase 1: Opening (3-5 min)

**Purpose statement:**
"Hi [Name], thank you so much for making time. I am [Your Name]. I am doing research on how small-business owners handle the financial side of running their business -- specifically bookkeeping and record-keeping. I am not selling anything today, and I genuinely want to understand your experience. There are no right or wrong answers -- if you tell me this is all perfectly fine and you have no complaints, that is incredibly useful information too. This should take about 35 minutes. Is it okay if I record this call just for my own notes? I will not share it with anyone."

**Warm-up question:**
"Before we get into specifics -- can you tell me a bit about your business? What do you do, and roughly how long have you been running it?"

*(Listen for: industry, size, years in business, whether they built it themselves or acquired it. Do not redirect -- let them set the context. This information will help you interpret their answers to later questions.)*

---

#### Phase 2: Problem Exploration (15-20 min)

| # | Question | What to Listen For | Probes If Vague |
|---|---------|-------------------|----------------|
| 1 | "Walk me through how you handle your bookkeeping today -- what does your current setup look like?" | Software used, whether they do it themselves or delegate, frequency of engagement | "What does that process look like step by step?" |
| 2 | "What is the most frustrating or time-consuming part of managing your financials?" | Self-identified pain -- note whether they name it before you probe | "Can you tell me more about that specific part?" |
| 3 | "Tell me about the last time something went wrong with your bookkeeping -- or a time when it caused a problem for your business." | Specific incident, financial or operational consequence, emotional memory of it | "What exactly happened? What did it cost you?" |
| 4 | "How much time per month would you estimate you personally spend on bookkeeping -- logging in, reviewing, fixing things, preparing for your accountant?" | Quantified time cost -- watch for surprises when they actually calculate it out loud | "Does that feel like a lot to you, or does it feel manageable?" |
| 5 | "When you look at your financial reports -- your P&L, your cash position -- do you feel confident that you understand what they are telling you?" | Financial literacy friction, anxiety about interpretation, trust in the numbers | "When was the last time you were uncertain about a number? What did you do?" |
| 6 | "How do you currently handle things like categorizing transactions, reconciling your bank account, or preparing for taxes?" | Manual vs. automated, use of an accountant or bookkeeper, pain around categorization errors | "What happens when you are not sure what category to put something in?" |
| 7 | "Have you ever made a business decision -- pricing, hiring, a major purchase -- and later found out your financial picture was different than you thought it was at the time?" | Decision quality degraded by unreliable data -- this is the highest-stakes problem signal | "How did that happen? What was the outcome?" |
| 8 | "If you could change one thing about how you manage the financial side of your business right now, what would it be?" | Their ideal outcome in their own words -- this is gold for positioning | "What would that look like practically?" |

**Universal follow-up probes:**
- "Can you give me a specific example of when that happened?"
- "What did you actually do in that situation?"
- "How did that turn out?"
- "How did that make you feel?"
- "Why do you think that keeps happening?"
- *(3-5 seconds of silence after any answer -- most interviewees will elaborate with the most valuable material)*

---

#### Phase 3: Solution Reaction -- not included in this first batch

*Rationale: This is a problem interview batch. Solution reaction questions will be designed after analyzing the results of these 12 interviews and confirming the primary problem signal. Do not introduce any solution concept in this batch.*

---

#### Phase 4: Closing (3-5 min)

1. "Is there anything about managing your business finances -- or bookkeeping specifically -- that I should have asked you about but did not?"
2. "Do you know 2-3 other small-business owners who handle their own bookkeeping? Would you be willing to make an email introduction? I promise to keep it brief and respectful of their time."
3. "Would you be open to giving me 15 minutes of feedback in a few weeks when I have something concrete to show you?"
4. "This has been incredibly helpful -- thank you. I will follow up with a brief summary of what I found if you are interested."

---

### Post-Interview Analysis Template (Example -- Interview #3)

**Interview #:** 3
**Date:** [Interview date]
**Participant:** Owner of a 4-person residential cleaning business, 6 years operating, uses QuickBooks Self-Employed
**Interview type:** Problem interview
**Signal strength:** Strong

| Category | Notes |
|----------|-------|
| **Top 3 verbatim quotes** | 1. "I basically do my books in a panic the week before I have to send stuff to my accountant." 2. "Half the time I'm not sure if I'm making money or just moving it around." 3. "I've just accepted that taxes are going to ruin my month every year." |
| **Problem confirmed?** | Yes -- spontaneously, before any probing |
| **Current workaround** | QuickBooks Self-Employed ($15/month) plus a 2-hour session with a CPA quarterly at $200/session; manually categorizes transactions "when I remember" |
| **Time cost (stated)** | 4-6 hours/month, spikes to 12+ hours in January |
| **Economic cost (stated)** | $800/year for CPA quarterly sessions; estimates she has underpaid herself by "at least $15K" due to unclear cash picture |
| **Pain intensity (1-10, their rating)** | 8 -- "It's not what's keeping me up at night, but it's always in the background" |
| **Frequency** | Monthly review; quarterly crisis; annual tax preparation crisis |
| **Switching willingness** | High -- "I would pay real money to not feel this way every January" |
| **Key objections** | "I've tried to learn this stuff and it just doesn't stick. I don't want to take a course. I just want it to be handled." |
| **Surprises** | The emotional framing ("I'm not sure if I'm making money or just moving it around") -- this is about confidence and decision quality, not just time savings. This reframes the problem significantly. |
| **Assumption updates** | Assumption 1 confirmed strongly. Assumption 2 partially confirmed -- month-end is painful but tax prep is the "hair on fire" moment. Assumption 3 confirmed -- she is paying for QuickBooks and quarterly
