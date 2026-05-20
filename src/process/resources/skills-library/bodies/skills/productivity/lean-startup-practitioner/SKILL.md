---
name: lean-startup-practitioner
description: |
  Applied lean startup methodology covering build-measure-learn loops, MVP design, pivot decisions, validated learning, innovation accounting, and practical techniques for reducing waste in new product development.
  Use when the user asks about lean startup practitioner, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of lean startup practitioner or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "time-management frameworks template testing automation running sales video-production"
  category: "productivity"
  subcategory: "methodology-frameworks"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Lean Startup Practitioner

## When to Use

**Use this skill when:**
- A founder, product manager, or team lead asks how to validate a business idea before committing significant resources to full development
- A user needs to design a Build-Measure-Learn experiment and does not know where to start or what to measure
- A team is debating whether to pivot or persevere and needs a structured decision framework grounded in data
- A product manager needs to distinguish between vanity metrics and actionable metrics and set up innovation accounting for their product
- A startup team is building an MVP and keeps adding features -- they need help scoping to the minimum that tests one critical assumption
- A user asks about concierge MVPs, Wizard of Oz tests, smoke tests, or landing page experiments
- A team has customer discovery interviews scheduled and needs a structured approach to extract validated learning
- A founder is post-MVP with early users and needs to identify whether low retention is a product problem, an activation problem, or a market problem

**Do NOT use when:**
- The user needs help with an established product's growth strategy with proven product-market fit -- use a growth marketing or product scaling skill instead
- The user is asking about corporate innovation programs or intrapreneurship governance, which require different organizational change frameworks
- The user needs financial modeling, cap table structuring, or investor pitch preparation -- those require finance and fundraising skills
- The request is about agile sprint planning or scrum ceremonies for an existing product team -- use a software project management skill
- The user is asking about design thinking workshops or user research methodologies in isolation -- use a UX research skill for those deep dives
- The team is post-Series B with hundreds of employees and operational at scale -- lean startup is an early-validation framework, not a scaling framework

---

## Process

### Step 1: Establish the Current Stage and Riskiest Assumption

- Ask the user exactly two to three diagnostic questions before offering any guidance: (1) What is the core hypothesis in one sentence? (2) What stage are they at -- pre-customer, customer discovery, MVP in market, or iterating post-MVP? (3) What has already been tested and what were the results?
- Map their stage to the appropriate phase: Problem-Solution Fit (pre-customer and customer discovery), Product-Market Fit (MVP in market), or Scale Readiness (iterating post-MVP). Each phase has a different primary objective.
- Extract every assumption the business depends on and write each one as a falsifiable statement: "We believe X is true." Typical assumptions fall into four categories -- desirability (customers want this), feasibility (we can build it), viability (we can make money), and reachability (we can acquire customers affordably).
- Rank assumptions on a 2x2 grid: x-axis is certainty (how much evidence exists), y-axis is criticality (would the business fail if this is wrong). The top-right quadrant -- high criticality, low certainty -- is the riskiest assumption. Test that one first, always.
- If the user cannot articulate a riskiest assumption, help them by asking: "If you discovered tomorrow that [assumption X] was false, would you shut the project down?" If yes, that is critical. If no, de-prioritize it.

### Step 2: Design the Hypothesis Precisely

- Every experiment must start from a hypothesis in this exact structure: "We believe [specific customer segment] experiences [specific problem] severely enough to [specific behavior change]. If we [specific intervention], they will [measurable outcome]. We will validate this when [metric] reaches [threshold] within [timeframe] with a sample of at least [N] participants."
- The customer segment must be specific enough to find: not "small business owners" but "independent hair salon owners with 1-3 chairs in urban markets charging $50+ per cut."
- The problem statement must include severity indicators -- frequency (daily, weekly, monthly), cost (time lost, money spent, workaround effort), and emotional charge (frustration level, stakes involved).
- The success threshold must be set before the experiment runs, never after. Post-hoc threshold-setting is the single most common form of self-deception in lean startup. Write it down and share it.
- For early-stage hypotheses about problem existence, use Rob Fitzpatrick's Mom Test rules: ask about past behavior, not future intentions. "How do you currently handle this?" not "Would you use an app that did X?"

### Step 3: Select and Design the Minimum Viable Experiment

- Match the experiment type to what the hypothesis is actually testing. Use this decision tree:
  - Testing whether the problem is real and painful: customer discovery interviews (5-12 target customers, structured around past behavior, not opinions)
  - Testing whether demand exists for a solution concept: smoke test (landing page with a call to action, traffic from paid ads, measure click-through on the primary CTA and email capture rate)
  - Testing whether the solution actually solves the problem: concierge MVP (manually deliver the solution to 3-10 customers, measure satisfaction, willingness to pay, and repeat usage)
  - Testing whether customers will pay before building: pre-order or letter of intent campaign (target 10 LOIs from non-friends/family at realistic pricing)
  - Testing whether a specific UX workflow works: Wizard of Oz (the user sees a software interface, a human performs the back-end function manually, the user does not know)
  - Testing retention and core value delivery: single-feature MVP in production (one core loop, no extra features, real users, measure day-7 and day-30 retention)
- Define the smallest possible build to run the experiment. If a landing page with 200 visitors can answer the question, do not build a prototype. If 10 customer interviews can answer the question, do not build a landing page.
- Set a sample size appropriate for the experiment type. For qualitative interviews, 5-7 interviews within a segment typically produce saturation of themes. For quantitative smoke tests, aim for at least 100-200 unique visitors before drawing conclusions about conversion rates. For cohort retention analysis, you need at least 30-50 users per cohort to see meaningful patterns.
- Time-box the experiment. Most experiments at the pre-MVP stage should run no longer than 2 weeks. If it cannot be run in 2 weeks, the experiment is too large -- break it down.

### Step 4: Run the Experiment and Collect Validated Learning

- For customer interviews: use the SPIN format (Situation, Problem, Implication, Need-payoff) adapted for discovery. Start every interview with "Walk me through the last time you dealt with [problem domain]." Listen for unprompted emotion -- sighs, complaints, workarounds the customer invented themselves -- these are gold.
- For smoke tests: use a tool like a basic website builder plus a paid traffic source (search ads targeting intent-based keywords, or social ads targeting the specific demographic). A well-designed smoke test for a consumer product should achieve a CTA click rate above 5% and an email capture rate above 20% of CTA clickers if the hypothesis is valid. Below 2% CTA click-through is a strong negative signal.
- For concierge MVPs: serve the first customers completely manually. Use email, spreadsheets, phone calls, and personal attention. Do not optimize the workflow -- observe it. The inefficiencies you find manually are the features the software needs to eliminate.
- Log every data point in a structured experiment log: hypothesis tested, experiment run, metric measured, result, interpretation, decision. This log becomes the validated learning record for the team and investors.
- Separate observations (what happened) from interpretations (what we think it means) from decisions (what we will do next). Teams conflate these three constantly, which leads to confirmation bias corrupting the learning.

### Step 5: Measure with Innovation Accounting

- Establish a baseline metric before the experiment, measure after each iteration, and track the direction of change. The three-stage framework is:
  - Stage 1 -- Activation: are people completing the core onboarding action and experiencing the product's core value at least once? Target activation rates above 40% for B2C consumer products, above 60% for B2B SaaS where users are motivated.
  - Stage 2 -- Retention and Engagement: are users returning? Day-7 retention above 20% for consumer apps is a viable signal. Day-30 retention above 10% for consumer, above 25% for B2B SaaS. If day-1 retention is below 25%, fix the onboarding before acquiring more users.
  - Stage 3 -- Revenue and Unit Economics: is willingness to pay real? Can customer acquisition cost be less than one-third of lifetime value at scale?
- Use cohort analysis, not aggregate totals. Aggregate signups are a vanity metric. Cohort retention curves reveal whether the product is improving -- if successive cohorts show higher day-30 retention, the product is improving. Flat or declining cohorts mean iterations are not working.
- Track the One Metric That Matters (OMTM) for each stage. Before product-market fit, the OMTM is typically the rate of progress through the activation funnel or the weekly active user retention rate. Resist the urge to track 15 metrics -- it diffuses focus.
- Actionable metrics must meet three criteria: they are comparative (you can compare time periods or cohorts), they are ratio-based (not raw totals), and they expose causality (you can trace a change in the metric back to a specific action the team took).

### Step 6: Make the Pivot or Persevere Decision

- Set a structured review cadence: a pivot/persevere decision meeting every 4-6 weeks at the pre-PMF stage. Do not let teams drift without explicit decision points.
- Use this three-question framework at every review:
  - Is the primary metric moving in the right direction at a meaningful rate? (Define "meaningful rate" in advance -- e.g., 10% improvement per iteration cycle)
  - Have we run at least three Build-Measure-Learn cycles testing the same hypothesis? (One data point is not a pattern)
  - Is there a pattern in qualitative feedback that contradicts or redirects the current hypothesis?
- If the answer to the first question is no after three cycles with no improvement trajectory, a pivot is warranted. Distinguish between the type of pivot needed using the nine pivot types: zoom-in, zoom-out, customer segment, customer need, platform, business architecture, value capture, engine of growth, and channel pivots. Each requires a different response.
- Persevering is not the same as doing nothing. Persevering means doubling down on the current hypothesis with tighter experiments and faster cycles. If you persevere, name the specific change you are making in the next cycle.
- Document every pivot decision with: the evidence that triggered it, the hypothesis being abandoned, the new hypothesis being adopted, and what validated learning is being preserved and carried forward.

### Step 7: Synthesize and Communicate Validated Learning

- Produce a one-page Learning Summary after each experiment cycle. This is the currency of lean startup communication -- not a business plan update, not a slide deck. A learning summary covers: hypothesis tested, experiment run, result observed, conclusion drawn, and next experiment designed.
- Use the concept of Learning Milestones instead of traditional project milestones. A learning milestone is a specific validated learning achieved: "We validated that target users will pay $49/month for automated invoicing" is a learning milestone. "We shipped MVP version 1.0" is a project milestone and tells you nothing about market reality.
- When presenting to stakeholders or investors, frame progress as validated learning, not features shipped. List each assumption tested, the method used to test it, the result, and the conclusion. Investors who understand lean startup find this far more credible than a feature roadmap.
- Identify which assumptions have been validated (evidence gathered, hypothesis supported), which have been falsified (evidence gathered, hypothesis refuted and pivoted), and which are untested (still to be addressed in future cycles). This gives a clear picture of remaining risk.

---

## Output Format

When responding to a user's lean startup question, produce a structured response following this template. Adapt the depth of each section to the user's stage.

```
## Lean Startup Practitioner Guidance

### Situation Assessment
Stage: [Pre-Customer / Customer Discovery / MVP in Market / Post-MVP Iteration]
Current Primary Objective: [Problem-Solution Fit / Product-Market Fit / Scale Readiness]
What Has Been Validated: [List with evidence type for each item]
What Remains Unvalidated: [List in priority order]

---

### Riskiest Assumption Analysis

| Assumption | Criticality (1-5) | Certainty (1-5) | Priority to Test |
|------------|-------------------|-----------------|-----------------|
| [Assumption 1] | [score] | [score] | [1st / 2nd / 3rd] |
| [Assumption 2] | [score] | [score] | [1st / 2nd / 3rd] |
| [Assumption 3] | [score] | [score] | [1st / 2nd / 3rd] |

Top Riskiest Assumption: [The one with highest criticality and lowest certainty]

---

### Hypothesis Statement

"We believe [specific customer segment] experiences [specific problem] severely enough to [specific behavior].
If we [specific intervention], they will [measurable outcome].
We will validate this when [metric] reaches [threshold] within [timeframe] with [N] participants."

---

### Experiment Design

Experiment Type: [Interview / Smoke Test / Concierge / Wizard of Oz / Single-Feature MVP / Other]
Rationale for This Type: [Why this is the right experiment for this hypothesis]

What to Build: [Minimum required -- be specific about what NOT to include]
What to Measure: [Primary metric and how it will be collected]
Success Threshold: [Specific number set before the experiment runs]
Failure Threshold: [The number below which we pivot]
Sample Size Required: [N users/interviews/visitors and why]
Time-Box: [Duration -- should be 1-2 weeks for most pre-PMF experiments]

---

### Innovation Accounting Dashboard

Current Stage: [Activation / Engagement / Revenue]
One Metric That Matters Right Now: [Single metric with current value and target]

| Metric | Current Value | Target | Trend | Action if Below Target |
|--------|--------------|--------|-------|------------------------|
| [Activation Rate] | [x%] | [y%] | [↑/↓/→] | [specific action] |
| [Day-7 Retention] | [x%] | [y%] | [↑/↓/→] | [specific action] |
| [Day-30 Retention] | [x%] | [y%] | [↑/↓/→] | [specific action] |
| [Conversion to Paid] | [x%] | [y%] | [↑/↓/→] | [specific action] |

Vanity Metrics to Ignore Right Now: [List specific metrics the team might be tempted to track]

---

### Pivot / Persevere Recommendation

Current Evidence Summary: [What the data shows]
Recommendation: [Persevere with specific change / Pivot -- specify type / Kill]
Reasoning: [Data-driven rationale]

If Persevering:
- Specific change in next cycle: [What is different]
- New experiment: [Hypothesis and design]
- Timeline for next review: [Date]

If Pivoting:
- Pivot type: [Zoom-in / Customer Segment / Customer Need / Channel / etc.]
- Hypothesis being abandoned: [State it]
- New hypothesis: [State it]
- Validated learning being preserved: [What carries forward]

---

### Validated Learning Log Entry

Experiment #: [Number]
Date: [Date]
Hypothesis Tested: [Exact hypothesis statement]
Experiment Run: [What was built/done]
Result: [Observation only -- what happened]
Interpretation: [What we believe this means]
Decision: [Next step and why]
Open Questions: [What this experiment did not answer]

---

### Next Actions

| Action | Owner | Due Date | Success Criteria |
|--------|-------|----------|-----------------|
| [Specific action 1] | [Role] | [Date] | [Measurable outcome] |
| [Specific action 2] | [Role] | [Date] | [Measurable outcome] |
| [Specific action 3] | [Role] | [Date] | [Measurable outcome] |

Next Pivot/Persevere Review: [Date -- should be 4-6 weeks out]
```

---

## Rules

1. **Always plan the Build-Measure-Learn loop backwards.** Start with "What do we need to learn?" then work backward to "What do we need to measure?" and finally "What is the minimum we need to build to generate that measurement?" Teams that start with Build waste weeks building things that do not answer the learning question.

2. **Never let a success threshold be set after an experiment runs.** This is the most common form of motivated reasoning in product teams. If a smoke test gets a 3% CTA click rate and the team says "actually that's good for this audience," the experiment is corrupted. Write the threshold before any data is collected and treat it as binding.

3. **Separate problem validation from solution validation.** These are two completely different experiments. Do not try to test both at once. First confirm the problem is real, painful, and owned by an accessible customer segment. Only then design a solution experiment. Teams that conflate these two stages build solutions to problems that do not exist severely enough.

4. **Interviews with friends, family, or colleagues are not data.** They will not tell you your idea is bad. Every customer interview subject must be a real member of the target customer segment with no social obligation to be kind. Recruiting through relevant communities, online forums, or screened panels is required for valid qualitative data.

5. **A pivot is not the same as a restart.** Every pivot must preserve the validated learning from previous cycles. If a team pivots to a completely unrelated idea, they have effectively started a new company and the pivot framework does not apply. A lean startup pivot changes one major dimension (customer, problem, channel, revenue model, technology) while keeping others constant.

6. **Cohort analysis is mandatory for retention measurement.** Looking at total active users across all time is a vanity metric -- it can grow even as every cohort is churning completely. Separate users by the week or month they first activated and track each cohort's retention curve independently. A product improving over time will show later cohorts with higher retention than earlier cohorts.

7. **The concierge MVP is almost always the right next step after customer interviews.** Teams jump from "we interviewed 10 people and they said they want this" directly to "let's build the app." The concierge stage -- manually delivering the solution before building any technology -- consistently reveals workflow details and edge cases that completely reshape the product design. It also validates willingness to pay under real conditions, not hypothetical ones.

8. **Engines of growth must be identified and validated, not assumed.** The three engines are: viral (each user brings in more than one new user, viral coefficient above 1.0), sticky (low churn plus high retention sustains growth), and paid (LTV > 3x CAC with a payback period under 12 months). A startup without an identified engine of growth is not a startup -- it is a feature. Validate which engine applies before scaling any acquisition spending.

9. **Do not add features to solve a retention problem without diagnosing the retention failure mode.** Low day-30 retention can be caused by: weak onboarding (fix the activation flow, not the feature set), wrong customer segment (the product works but for different customers than expected), product gaps (specific missing functionality), or fundamental value proposition mismatch (pivot required). Adding features to a retention problem caused by the wrong customer segment is wasted work.

10. **Resource level determines appropriate experiment ambition.** A two-person team with $10,000 runway should be running 1-week customer interview sprints and smoke tests, not 8-week MVP builds. A team with 6 months of runway and 5 people can afford a 4-week single-feature MVP. Match the experiment complexity to available resources so that there is always runway remaining for at least two more learning cycles after the experiment completes.

---

## Edge Cases

### The "We Already Have Users But Don't Know Why They Churn" Case
This is a post-MVP retention diagnosis problem, not an MVP design problem. Do not design new experiments -- first analyze the existing cohort data. Segment users into "retained" (active at day 30+) vs. "churned" cohorts and identify behavioral differences in the first 7 days. Retained users almost always complete a specific set of actions (the "aha moment" sequence) that churned users do not. Use product analytics to find that sequence, then redesign onboarding to drive all new users through those specific actions before anything else. If no analytics are instrumented, conduct exit interviews with 5-10 churned users using the question "Walk me through the last time you tried to use the product and what happened."

### The "B2B Enterprise Product with Long Sales Cycles" Case
Standard 2-week smoke tests and landing page experiments do not apply to enterprise products where a single sale takes 6-18 months. Adjust the validation approach: use a Letter of Intent (LOI) campaign as the smoke test equivalent -- target 5-10 enterprise prospects and ask for a signed non-binding LOI to purchase at a specific price point if the product is built. An LOI signed by a director or above with budget authority is a stronger demand signal than 1,000 landing page signups. For the concierge MVP equivalent, offer a "design partner" program -- 3-5 enterprises get the product manually delivered (often as consulting) in exchange for co-development input and a reference. This validates solution fit while generating revenue.

### The "Technical Co-founder Wants to Build First" Case
This is the most common team dynamic failure mode in lean startup. The engineer sees the MVP stage as "now I can finally build" and resists customer discovery because it feels like a detour. Reframe the conversation: the Build-Measure-Learn loop does not start with code. Show specifically how a Wizard of Oz test or concierge MVP can answer the same questions 10x faster and cheaper. Use the "10x test" -- if building the full feature takes 10 weeks and a Wizard of Oz test takes 1 week and answers the same question, the Wizard of Oz test has a 10x learning efficiency advantage. Engineers respect efficiency arguments. Also, emphasize that building a product nobody wants is not building -- it is waste.

### The "We Validated Demand But Cannot Build It" Case
This occurs when customer interviews and smoke tests confirm genuine demand, but the team discovers the solution is technically infeasible at the cost or timeline required. This is a feasibility assumption failure. Do not abandon the validated customer insight -- it is valuable. Instead, run a technology pivot: identify an alternative technical approach (often a lower-tech, more manual, or API-based approach) that can deliver 80% of the value at 20% of the build complexity. The concierge MVP was already validating a workflow -- that workflow can often be productized differently. If the feasibility gap is fundamental (e.g., the technology does not exist), the customer insight can be the foundation of a different business architecture -- selling to customers who need the workflow served, with a different delivery mechanism.

### The "Market Is Too Small to Get Statistical Significance" Case
Niche B2B markets -- specialty manufacturing, specific medical subspecialties, narrow professional services -- often have a total addressable market of a few thousand people globally. Standard smoke test sample sizes of 200+ may be impossible. Adjust accordingly: in markets under 500 accessible prospects, qualitative validation carries more weight. Run 12-15 deep customer discovery interviews (versus the usual 5-7) across multiple buyer roles (user, buyer, economic decision-maker, influencer). Achieve saturation within each role. Supplement with a competitive analysis of proxy markets -- adjacent solutions that current customers use as workarounds. A market that is small but has customers who spend $50,000/year on workarounds is more validated than a large market with customers who complain but will not pay $50/month.

### The "Pivot or Persevere Decision with a Divided Team" Case
When co-founders or team members disagree sharply about whether to pivot, the disagreement is almost always about interpretation of data, not the data itself. Run a structured pre-mortem exercise: ask each team member to independently write down (1) what the data shows as observations only, (2) what they believe the data means, and (3) what they recommend doing next. Then compare the interpretations side by side. Divergent recommendations with the same underlying data reveal interpretation bias -- one person is discounting certain data points. The resolution is to design one more targeted experiment that specifically tests the interpretation in dispute, with a threshold agreed upon in advance by all parties. Do not make the pivot/persevere decision until that experiment runs. If resources do not allow another cycle, use the data-richest interpretation -- whichever position has more direct behavioral evidence (what customers did) rather than attitudinal evidence (what customers said).

### The "Lean Startup Does Not Apply to Hardware or Physical Products" Objection
This is a false objection. The principles apply -- the experiment types differ. For physical products: use a 3D-printed or hand-fabricated prototype for concierge validation instead of code. Use a crowdfunding campaign (Kickstarter-style) as both a smoke test and a pre-order mechanism -- a campaign that reaches 100% of its funding goal within 48 hours is a strong product-market signal. Use a "fake door" test -- show a product page with full specifications and a "Buy Now" button that goes to a waitlist, then measure click-through on purchase intent. For hardware with regulatory requirements (medical devices, food products), the FDA clearance or food safety certification is itself a major assumption -- validate the regulatory pathway with one or two regulatory consultants before investing in prototyping. Regulatory failure is the hardware equivalent of a technology feasibility failure.

---

## Example

**User Input:**
"I want to build an app that helps independent personal trainers manage their client scheduling, track workout progress, and send automated check-ins between sessions. I've talked to a few trainer friends who say they'd love it. I have a developer friend who's ready to start building. Where do I start?"

---

**Output:**

## Lean Startup Practitioner Guidance

### Situation Assessment
Stage: Pre-Customer (Customer Discovery)
Current Primary Objective: Problem-Solution Fit -- validate that the problem is real, painful, and worth paying to solve before any code is written
What Has Been Validated: Nothing formally. Conversations with trainer friends are social validation, not market validation (they will not tell you the idea is bad).
What Remains Unvalidated: Everything that matters -- problem severity, willingness to pay, competitive alternatives in use, the specific workflow pain that is most acute, whether scheduling, progress tracking, or automated check-ins is the primary pain

---

### Riskiest Assumption Analysis

| Assumption | Criticality (1-5) | Certainty (1-5) | Priority to Test |
|------------|-------------------|-----------------|-----------------|
| Independent trainers have a painful enough scheduling/admin problem to pay for a dedicated tool | 5 | 1 | 1st |
| Trainers will pay $X/month for this (instead of using free/cheap tools like Google Calendar + WhatsApp) | 5 | 1 | 2nd |
| Automated check-ins between sessions generate enough client retention value that trainers see it as their core problem | 4 | 1 | 3rd |
| We can acquire independent trainers affordably (not locked into gym management software) | 4 | 2 | 4th |
| A developer can build the core loop in a reasonable timeframe at viable cost | 3 | 3 | 5th |

Top Riskiest Assumption: Independent personal trainers experience their scheduling and client communication workflow as painful enough to pay $30-60/month for a dedicated app, given that free alternatives (Google Calendar, WhatsApp, notes apps, generic scheduling tools like Calendly) already exist and are in use.

---

### Hypothesis Statement

"We believe independent personal trainers (working with 10-25 clients, not employed by a gym) experience client scheduling conflicts, missed session tracking, and inconsistent follow-up communication as a significant daily pain point that costs them either client retention or unpaid administrative time.

If we conduct 10 structured customer discovery interviews with real independent trainers (not friends), we will find that at least 7 of 10 trainers describe a specific scheduling or communication incident that cost them a client, required embarrassing manual recovery, or generates measurable stress more than 3 times per week.

We will validate this as the riskiest problem worth solving when 7 of 10 interviews surface unprompted frustration with current admin tools, AND at least 5 of 10 trainers currently pay for at least one scheduling or client management tool (proving willingness to pay for this category)."

---

### Experiment Design

Experiment Type: Customer Discovery Interviews (qualitative) followed by a Concierge MVP if interviews validate the problem
Rationale: No code should be written before validating that the problem is severe enough to displace existing tools. Trainer friends are a biased sample. The developer's time is the most expensive resource -- protect it until the problem is confirmed with strangers.

**Phase 1 -- Customer Discovery (this week):**
- What to Build: Nothing. A simple interview script (30-45 minutes per interview, structured around past behavior)
- Who to Interview: 10-12 independent personal trainers who are NOT friends or family. Recruit through fitness-focused online communities, local gym bulletin boards, or paid screener ads targeting personal trainers with 10+ clients
- Interview Structure (Mom Test principles):
  - "Walk me through how you handle a new client booking today, from first contact to the first session."
  - "Tell me about the last time a client cancelled or rescheduled -- what happened and what did you do?"
  - "What tools do you currently use to track your clients' workout progress? Show me if possible."
  - "How often do you reach out to clients between sessions? What does that look like?"
  - "What's the most annoying part of the non-training side of your work?"
  - "What software or apps do you pay for right now related to your training business?"
- What to Measure: (1) Frequency of unprompted scheduling/admin complaints (target: 7/10 interviews), (2) Current tool payment behavior (target: 5/10 already pay for something in this category), (3) Specific pain point ranking -- which of the three features generates the most emotion
- Success Threshold: 7 of 10 interviews with unprompted scheduling/admin pain AND evidence of current spending on related tools
- Failure Threshold: Fewer than 5 of 10 interviews surface genuine pain, or trainers are universally satisfied with Google Calendar + WhatsApp combination
- Sample Size: 10-12 interviews (qualitative saturation for a single customer segment)
- Time-Box: 7-10 days to complete all interviews and synthesize

**Phase 2 -- Concierge MVP (if Phase 1 validates the problem, weeks 3-4):**
- What to Build: A manual service. Offer 5 real independent trainers (paying customers, not friends) a "personal trainer admin assistant" service at $49/month. You personally handle their scheduling (via a shared Google Calendar), send their clients 48-hour reminder texts (manually from a Google Voice number), and send a 3-question check-in message to clients mid-week (manually via a template in iMessage or WhatsApp).
- This is not a product. It is a workflow validation. You learn which parts of the manual service they value, which parts they ignore, and what edge cases the software would need to handle.
- What to Measure: (1) Do 5 trainers agree to pay $49/month for this manual service? (2) After 4 weeks, do they renew or ask to continue? (3) Which specific parts of the service do they reference as valuable in check-in calls?
- Success Threshold: 3 of 5 trainers pay and actively engage with the service for 4 weeks
- Failure Threshold: Fewer than 3 trainers engage meaningfully, or trainers use the service but will not pay (suggests solution is nice-to-have, not must-have)

---

### Innovation Accounting Dashboard

Current Stage: Pre-Stage (problem validation, not yet measuring product metrics)
One Metric That Matters Right Now: Interview validation rate -- percentage of non-friend-or-family interviews that surface unprompted scheduling/admin pain AND current willingness to pay for tools in this category

| Metric | Current Value | Target | Trend | Action if Below Target |
|--------|--------------|--------|-------|------------------------|
| Interview validation rate | 0% (no interviews run yet) | 70% (7 of 10) | -- | Pivot to different customer segment or problem framing |
| Current tool payment rate (among interviewees) | Unknown | 50% (5 of 10) | -- | If below 30%, problem may not be painful enough to monetize |
| Concierge paying conversion | 0% (not started) | 60% (3 of 5) | -- | If below this, solution is wrong despite valid problem -- redesign service |
| Concierge 4-week retention | 0% (not started) | 60% (3 of 5) | -- | If retained but won't pay more, pricing is the issue |

Vanity Metrics to Ignore Right Now: App store downloads (app doesn't exist yet), waitlist signups from trainer friends, social media engagement on any posts about the idea, compliments received from trainer friends after pitching the concept

---

### Pivot / Persevere Recommendation

Current Evidence Summary: Zero validated data. One co-founder bias (the trainer friends who gave positive feedback are socially incentivized to be supportive and are not representative of a paying stranger market). The developer is ready to build -- that readiness is creating pressure to start building before the problem is confirmed.

Recommendation: Persevere on the hypothesis but do not build any code. Run the customer discovery interview phase immediately.

Reasoning: The market hypothesis is plausible but entirely unvalidated. The existing competition is real -- Mindbody, Trainerize, TrueCoach, and generic tools like Calendly exist in this space. The reason most new entrants fail against established tools is not product quality -- it is that the pain point they chose to solve is not the most acute pain for the target customer. The interviews will reveal whether scheduling, progress tracking, or between-session communication is the primary driver. That finding will determine the product's entire design and positioning.

If Persevering:
- Specific change in next cycle: Shift from talking to trainer friends to recruiting and interviewing 10 genuine strangers before any design or development begins
- New experiment: 10 structured customer discovery interviews using Mom Test principles
- Timeline for next review: 10 days from now (after interview synthesis is complete)

---

### Validated Learning Log Entry

Experiment #: 0 (Pre-experiment baseline)
Date: [Current date]
Hypothesis Tested: None formally tested yet
Experiment Run: Informal conversations with trainer friends (not a valid experiment)
Result: Positive sentiment expressed by 2-3 trainer friends about the concept
Interpretation: Cannot draw any validated conclusions -- social desirability bias invalidates friend feedback as market evidence
Decision: Design and run proper customer discovery interviews with 10 non-friend independent trainers before any development starts
Open Questions: (1) Is scheduling, progress tracking, or between-session communication the primary pain? (2) What tools are trainers currently paying for and why? (3) What would make a trainer switch from their current setup? (4) What is the revenue model -- per trainer subscription, per client seat, or transaction-based?

---

### Next Actions

| Action | Owner | Due Date | Success Criteria |
|--------|-------|----------|-----------------|
| Recruit 10-12 independent trainers for 30-min interviews (use fitness communities, not contacts) | Founder | Day 3 | 10 confirmed interviews scheduled with non-friends |
| Write interview script using Mom Test principles -- past behavior questions only, no future intent questions | Founder | Day 2 | Script reviewed against Mom Test checklist: no "would you," no "do you think," no leading questions |
| Run all 10 interviews and record with permission | Founder | Day 10 | 10 completed interview recordings or detailed notes |
| Synthesize interview findings: pain frequency, tool payment behavior, primary pain category | Founder | Day 12 | One-page learning summary with hire/fire decision on each hypothesis |
| Hold pivot/persevere review with developer based on interview findings | Both | Day 13 | Clear go/no-go decision on which problem to build for, or decision to redesign hypothesis entirely |
| If validated: recruit 5 paying trainers for concierge MVP at $49/month | Founder | Day 20 | 3+ paying trainer customers enrolled in manual service |

Tell the developer: "We are protecting your time by confirming the riskiest assumption first. Two weeks of interviews saves you from building 6 months of the wrong product. If 7 of 10 strangers describe this pain without prompting, we start building immediately. If they don't, we pivot the concept before a single line of code exists."

Next Pivot/Persevere Review: Day 13 (after interview synthesis)
