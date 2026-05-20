---
name: funnel-analysis
description: |
  Produces a funnel analysis with defined conversion stages, step-by-step conversion rates, biggest drop-off identification, and diagnostic questions for each stage. Outputs a populated funnel table with actionable insights, not a description of funnel methodology.
  Use when the user asks to analyze conversion rates, identify where users drop off in a process, optimize a signup or purchase flow, or measure step-by-step completion rates.
  Do NOT use for cohort-based retention over time (use cohort-analysis), customer segmentation by attributes (use segmentation-design), or KPI definition (use kpi-definition).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "analysis data-science data-visualization"
  category: "data-analysis"
  subcategory: "business-intelligence"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Funnel Analysis

## When to Use

**Use this skill when:**
- The user asks to analyze a conversion funnel for any sequential process -- signup, purchase, onboarding, activation, feature adoption, trial-to-paid upgrade, or support resolution
- The user wants to identify where users drop off in a multi-step process and quantify the magnitude of each leak
- The user asks "where are we losing customers?", "why is our conversion rate low?", or "what is our checkout completion rate?"
- The user wants to compare funnel performance across segments (traffic source, device, user tier, geography, campaign), time periods, or product variants
- The user has event data, analytics exports, CRM stage counts, or even rough estimates showing user volume at each step in a sequence
- The user wants to estimate the revenue impact of improving a specific stage and prioritize optimization investments
- The user is preparing for a growth review, investor update, or product roadmap decision that requires understanding where the product loses users before they deliver value
- The user has completed a funnel change (redesign, copy test, flow simplification) and wants to evaluate before-and-after performance

**Do NOT use when:**
- The user wants to analyze retention curves or churn over time by signup cohort -- use `cohort-analysis`, which tracks the same group of users across calendar time rather than through a fixed step sequence
- The user wants to group users by behavioral or demographic attributes to create actionable segments -- use `segmentation-design`
- The user wants to define, select, or weight KPIs for a team or product -- use `kpi-definition`
- The user wants to design a controlled experiment to test a funnel improvement -- use `ab-test-design`; funnel analysis is diagnostic, not experimental
- The user is asking about a single-step conversion rate with no upstream or downstream context -- a single metric like "landing page conversion rate" does not require funnel analysis
- The user wants to model future funnel performance under different growth assumptions -- use `financial-modeling` or `scenario-planning`; funnel analysis is descriptive, not predictive

---

## Process

### 1. Clarify the Funnel Scope Before Touching Any Numbers

Before calculating anything, establish the precise boundaries and counting rules. Ambiguous definitions produce misleading numbers that undermine the entire analysis.

- **What process is being analyzed?** Name it precisely: "Free trial signup to first paid invoice" is not the same as "Landing page visit to account creation." The scope determines which stages are inside vs. outside the funnel.
- **What is the entry event?** This is the denominator for overall conversion rate. Common choices: first page view, first click on a CTA, explicit intent signal (start checkout button), or a marketing touchpoint. Choosing "homepage visit" vs. "product page visit" will dramatically change your top-of-funnel numbers.
- **What is the completion event?** Define the success state unambiguously: "order_confirmed" server-side event, not "thank you page view" (which can be reached without a real purchase in some implementations).
- **What is the time window for completion?** A 30-minute session window and a 7-day completion window produce entirely different cohorts for the same funnel. For e-commerce, 30-minute or same-session is standard. For B2B SaaS trials, 14- to 30-day windows are typical. For enterprise sales funnels, 90-180 days is realistic.
- **What is the date range?** Specify both the entry date range (when users entered the funnel) and whether you are measuring completed cohorts only (all users in the window have had the full time window to complete) or a live cohort (some users are still in progress). Incomplete cohorts will understate true conversion.
- **Who is included?** Define inclusion/exclusion criteria: new users only, all users, paid traffic only, users who meet a minimum engagement threshold. Mixing new and returning users in a signup funnel will inflate numbers with phantom re-entries.

---

### 2. Name and Define Every Stage with Precision

Vague stage names produce vague diagnoses. Each stage must have a specific event definition that a data analyst could query.

- Name each stage after what the user has **done**, not what the product is showing them. "Viewed Pricing Page" is better than "Pricing Step." The verb matters because it clarifies what triggers stage entry.
- For each stage, define:
  - **Entry event:** The specific user action or system event that places the user in this stage (e.g., `checkout_started` event fires, cart page loaded with at least one item)
  - **Completion event:** The action that moves the user forward (e.g., `shipping_address_submitted`)
  - **Alternative exits:** What users do if they do not proceed -- bounce to homepage, navigate to help center, close the browser, idle timeout. These exit paths are where qualitative investigation begins.
- Limit funnel stages to 3-8 for analysis clarity. If the actual process has 12+ micro-steps, group them into macro-stages (see Edge Cases). Do not eliminate steps conceptually; group them analytically.
- Verify stage order reflects the **actual** user path, not the intended design. Use session recordings or clickstream data to confirm users encounter stages in the expected sequence before locking in the funnel definition.
- Flag any stages where the completion event is instrumented differently from others -- e.g., stages 1-4 tracked client-side, stage 5 tracked server-side. Instrumentation gaps cause false drop-offs that look like user behavior problems but are actually data collection problems.

---

### 3. Collect and Validate the Raw Data

Garbage in, garbage out. Data validation is not optional in funnel analysis -- it is the step most often skipped and most often responsible for wrong conclusions.

- **Request the following from the user:** User counts at each stage (not session counts, unless explicitly analyzing sessions), the time period, and the counting method (unique users, unique sessions, event occurrences).
- **Check for logical impossibilities:** Stage N+1 counts cannot exceed Stage N counts in a strict sequential funnel. If they do, the funnel definition has a problem -- users may be entering mid-funnel, stages may not be truly sequential, or there is a double-counting issue.
- **Identify instrumentation gaps:** A stage that shows abnormally high conversion (>95%) often indicates the stage is not truly a friction point but rather a pass-through page that almost no one abandons -- or the event fires twice per user, inflating counts. A stage with exactly 100% conversion to the next stage is almost always an instrumentation artifact.
- **Confirm unique-user vs. session counting:** For purchase funnels, unique users per time period is standard. For checkout funnels where the same user buys multiple times in a month, unique sessions may be more appropriate. State explicitly which is used.
- **Establish a baseline:** If the user has historical data, ask for the prior equivalent period. Funnel performance in isolation is much less actionable than funnel performance vs. a prior baseline. A 4.5% overall conversion rate could be excellent (up from 3.0%) or alarming (down from 6.5%).

---

### 4. Calculate the Full Metric Suite for Every Stage

Do not report only conversion rates. The full metric suite is required to distinguish high-impact problems from low-impact ones.

For each stage, calculate:

- **Stage volume (N):** Absolute count of unique users who reached this stage. Always present this as a raw number, not only as a percentage.
- **Step conversion rate:** (Users at Stage N+1 ÷ Users at Stage N) × 100. This measures the efficiency of a single transition and isolates the friction at that specific step.
- **Overall conversion rate:** (Users at Stage N ÷ Users at Stage 1) × 100. This shows cumulative loss and is the number a business leader typically wants to see.
- **Drop-off count:** Users at Stage N minus Users at Stage N+1. This is the absolute opportunity size.
- **Drop-off percentage:** 100% minus Step Conversion Rate. Cross-check: Drop-off Count ÷ Stage N Users × 100 should equal Drop-off percentage.
- **Revenue at risk (if average order value or LTV is known):** Drop-off Count × AOV (or expected LTV). This translates user loss into business impact and is the single most powerful number for prioritizing optimization resources.
- **Cumulative drop-off:** (Users at Stage 1 minus Users at Stage N) ÷ Users at Stage 1. Useful for showing total attrition through any given point in the funnel.

For step conversion rate benchmarks by funnel type:
- E-commerce add-to-cart rates: 5-15% is typical; above 20% is strong
- E-commerce checkout completion (begin checkout to order): 50-70% is typical; below 40% indicates significant friction
- SaaS trial signup (landing to account creation): 15-25% is typical
- SaaS trial-to-paid: 10-25% for product-led growth, 20-40% for sales-assisted
- Mobile app onboarding completion (install to first key action): 30-50% is typical
- B2B MQL-to-SQL: 13-25% is the typical industry range
- B2B SQL-to-close: 20-30% for inbound, 5-15% for outbound

---

### 5. Identify and Rank the Critical Drop-offs

Not all drop-offs are equal. Prioritize by two independent dimensions, then overlay business value.

- **Rank by absolute drop-off volume:** The stage with the most users lost in raw numbers. Fixing this stage has the highest potential impact on total completions, independent of conversion rate.
- **Rank by step conversion rate:** The stage with the lowest step-to-step conversion rate. This stage is the most inefficient transition in the funnel -- even if volume is smaller, it may indicate a severe experience problem.
- **These two rankings often differ.** Document both. The top-of-funnel typically has the biggest absolute drop-off (because volume is highest) but improving a 15% add-to-cart rate by 3pp is much harder than improving a 60% payment entry rate by 10pp. Recognize the difference between high-effort/high-reward and low-effort/high-reward opportunities.
- **Calculate the 10-percentage-point improvement value:** For each of the top 2-3 drop-off stages, compute: (Current Stage N Users × 0.10) × downstream overall conversion rate × AOV or LTV. This gives the incremental completions and revenue from a 10pp step conversion improvement, holding all other stages constant.
- **Flag the "low-hanging fruit" stage:** A stage with moderate drop-off but a known, simple fix (e.g., a form field that asks for unnecessary information, a page with a broken mobile layout) may be more valuable to act on than the largest drop-off stage, which may require a full redesign.
- **Note rate-of-change anomalies:** If a specific stage's conversion dropped sharply in the last 7 days vs. the prior 21 days within the analysis window, isolate that period. A sudden drop often indicates a code deployment, copy change, or third-party dependency failure -- not a chronic optimization opportunity.

---

### 6. Generate Stage-Specific Diagnostic Questions

Data tells you WHERE users drop. The diagnostic layer tells you WHY, and it must be specific to the actual stage, not generic UX advice.

For each below-average stage transition (below the funnel's own median step conversion rate), generate 3-5 specific questions across these five diagnostic categories:

- **Expectation mismatch:** What did the user expect to see or do at this stage, and what did they actually encounter? For example, at a "Create Account" gate: "Did the user expect to be able to complete the action as a guest? Is guest checkout available?"
- **Friction audit:** What is the specific friction at this stage? Count form fields (remove any not strictly required -- each additional field costs 5-10% of completions on average). Measure page load time (conversions drop ~7% per additional second above 3s on mobile). Check for CAPTCHA, phone number verification, or credit card required before value delivery.
- **Information gap:** What does the user need to know to proceed that they do not currently know? At a pricing step: "Are the plan differences clear enough to make a choice? Is there social proof (logos, reviews) near the decision point?"
- **Technical failure hypothesis:** What might be broken? Payment processors fail silently in ~2-3% of transactions in misconfigured setups. Form validation errors that do not explain what is wrong cause 30-40% of form abandonment. Broken states on mobile (iOS Safari has specific issues with input fields) are common and often unreported.
- **Alternative path hypothesis:** Are users finding a different way to complete their goal that bypasses this stage? If direct-to-cart URLs exist, some users may be navigating directly to checkout, skewing the add-to-cart metric.

---

### 7. Produce Segment Breakdown and Cross-Funnel Comparison

A single overall funnel number hides enormous heterogeneity. Segmentation reveals where to focus.

- **Standard segments to evaluate** (use whichever the user has data for): device type (desktop/mobile/tablet), traffic source (organic search, paid search, paid social, direct, email), new vs. returning users, geographic region, user account type (free/paid/enterprise), campaign or promo code applied.
- **For each segment, recalculate the full funnel.** Do not report only overall conversion by segment -- the step-level breakdown by segment often shows that the same stage fails differently for different segments (mobile users abandon at shipping info; desktop users abandon at account creation).
- **Prioritize segments by: volume × conversion gap.** A segment with 30% of traffic and a 2pp conversion gap contributes more opportunity than a segment with 5% of traffic and a 10pp gap.
- **Present segment comparison as a table.** Show Stage 1 volume, each stage conversion rate, and overall conversion for each segment. A segment that converts well through early stages but collapses at a specific stage has a very different diagnosis from one that leaks uniformly across the funnel.
- **Time-based segmentation:** Compare current period vs. prior equivalent period (same 30 days last year, or prior 30 days). If overall conversion is down, identify which specific stage changed. This is the fastest way to diagnose a recent regression.
- **Caution on small segments:** Do not draw conclusions from fewer than 200 users per segment per stage. Small sample sizes produce conversion rates that look dramatically different but may just reflect statistical noise. Flag any segment comparison where either cell has fewer than 200 users.

---

### 8. Synthesize Prioritized Recommendations with Testable Hypotheses

Diagnosis without action is analysis theater. Every recommendation must be specific, testable, and resource-scoped.

- **Structure every recommendation as a testable hypothesis:** "We believe [specific change] at [specific stage] will improve [step conversion rate] by [estimated magnitude] because [mechanism/evidence]." This format forces the recommendation to be falsifiable and grounds it in a causal theory.
- **Assign each recommendation to a tier:**
  - **Tier 1 (investigate first):** Low effort, potentially high impact -- check for broken instrumentation, fix obvious mobile layout issues, remove unnecessary form fields. These cost hours, not weeks.
  - **Tier 2 (A/B test):** Medium effort, addressable by product or growth team in a sprint -- add guest checkout, show shipping cost earlier, add social proof to the payment page.
  - **Tier 3 (major initiative):** Significant redesign or architectural change -- full mobile checkout redesign, personalization at the product page, account creation flow rewrite.
- **Quantify the expected value of each recommendation:** Even rough estimates ("if this test wins at the expected lift, it adds approximately N completions and $X per month") help product and engineering teams prioritize.
- **Flag what data is missing** that would sharpen the diagnosis: "Session recordings for users who abandon at payment entry would confirm whether this is a form usability problem or a payment method availability problem."

---

## Output Format

```
## Funnel Analysis: [Funnel Name]

### Funnel Definition
- **Process:** [Precise description of what process is being analyzed, from entry event to completion event]
- **Date range:** [Analysis period with specific dates if available]
- **Cohort status:** [Closed cohort (all users have had full time to complete) or live cohort (some users still in progress)]
- **Time window:** [How long a user has to complete the funnel after entering -- e.g., same session, 7 days, 30 days]
- **Entry event:** [Specific event or action that places a user in Stage 1]
- **Completion event:** [Specific event or action that marks funnel success]
- **Counting method:** [Unique users or unique sessions, and any inclusion/exclusion filters]
- **Baseline (if available):** [Prior period conversion rate for comparison]

---

### Funnel Performance Table

| Stage | Stage Name | Entry Event | Users | Step Conv. Rate | Overall Conv. Rate | Drop-off (Users) | Drop-off % | Revenue at Risk |
|-------|-----------|------------|-------|-----------------|-------------------|-----------------|------------|----------------|
| 1 | [Name] | [Event] | [N] | -- | 100% | [N] | [%] | $[N] |
| 2 | [Name] | [Event] | [N] | [%] | [%] | [N] | [%] | $[N] |
| 3 | [Name] | [Event] | [N] | [%] | [%] | [N] | [%] | $[N] |
| 4 | [Name] | [Event] | [N] | [%] | [%] | [N] | [%] | $[N] |
| 5 | [Completion Name] | [Event] | [N] | [%] | [%] | -- | -- | -- |

**Overall funnel conversion:** [Stage 1 to Completion: X.X%]
**Prior period conversion (if available):** [X.X% -- delta: +/- X.Xpp]

---

### Critical Drop-off Summary

| Priority | Transition | Users Lost | Step Conv. Rate | Revenue at Risk | Drop-off Type |
|----------|-----------|------------|-----------------|-----------------|---------------|
| #1 | Stage [X] → Stage [Y] | [N] | [%] | $[N] | [Volume / Rate] |
| #2 | Stage [X] → Stage [Y] | [N] | [%] | $[N] | [Volume / Rate] |
| #3 | Stage [X] → Stage [Y] | [N] | [%] | $[N] | [Volume / Rate] |

**Biggest absolute drop-off:** Stage [X] to Stage [Y] -- [N] users lost, [%] of that stage's users
**Lowest step conversion rate:** Stage [X] to Stage [Y] -- [%] step conversion
**10pp improvement value (top stage):** Improving [Stage X to Y] by 10pp adds approximately [N] completions and $[X] per [period], assuming downstream rates hold

---

### Diagnostic Questions by Stage

**Stage [X] → Stage [Y] ([%] step conversion -- [N] users lost)**

*Expectation mismatch:*
- [Specific question about what the user expected vs. what they encountered]

*Friction audit:*
- [Specific question about form fields, page load, account creation gates, or visible friction]
- [Specific question about mobile vs. desktop experience at this stage]

*Information gap:*
- [Specific question about what information is missing that users need to proceed]

*Technical failure hypothesis:*
- [Specific question about instrumentation, payment processor errors, or form validation failures]

*Alternative path hypothesis:*
- [Specific question about whether users are bypassing this stage via an alternative route]

**Stage [X] → Stage [Y] ([%] step conversion -- [N] users lost)**
[Repeat structure]

---

### Segment Comparison

| Segment | Stage 1 Users | Stage 2 Conv. | Stage 3 Conv. | Stage 4 Conv. | Overall Conv. | Conv. Gap vs. Average |
|---------|--------------|---------------|---------------|---------------|---------------|-----------------------|
| [Segment 1] | [N] | [%] | [%] | [%] | [%] | [+/- Xpp] |
| [Segment 2] | [N] | [%] | [%] | [%] | [%] | [+/- Xpp] |
| [Segment 3] | [N] | [%] | [%] | [%] | [%] | [+/- Xpp] |

**Highest-leverage segment:** [Segment name] -- [X%] of total traffic, [Xpp] conversion gap, representing approximately [N] additional completions per period if closed to average

**Key segment finding:** [One specific observation about where a specific segment's funnel diverges from the aggregate]

---

### Recommendations

| Tier | Recommendation | Stage Targeted | Expected Lift | Effort | Testable Hypothesis |
|------|---------------|----------------|---------------|--------|---------------------|
| 1 | [Specific action] | Stage [X] → [Y] | [X-Xpp] | Low | We believe [change] will improve [stage] by [X]pp because [mechanism] |
| 2 | [Specific action] | Stage [X] → [Y] | [X-Xpp] | Medium | We believe [change] will improve [stage] by [X]pp because [mechanism] |
| 3 | [Specific action] | Stage [X] → [Y] | [X-Xpp] | High | We believe [change] will improve [stage] by [X]pp because [mechanism] |

**Immediate next step:** [Specific investigation, data pull, or session recording review to do before building anything]

**Data gaps that would sharpen this analysis:** [What additional data, if available, would most improve the diagnosis]
```

---

## Rules

1. **NEVER present conversion rates without absolute numbers.** A 50% step conversion rate from 20 users is statistically meaningless and operationally insignificant. A 50% rate from 40,000 users represents 20,000 lost users. Every percentage in the funnel table must be accompanied by the raw user count it represents. If the user only provides percentages, ask for the absolute volume at entry, then back-calculate stage volumes.

2. **Stages must be sequential and non-overlapping.** If a user can reach Stage 4 without going through Stage 3 (e.g., direct links into checkout, deep links in emails), this is not a true sequential funnel. Document the skip paths explicitly, note what percentage of Stage 4 arrivals bypassed Stage 3, and present the intended path as the primary analysis with a "skip path" annotation.

3. **Always calculate both step conversion rate AND overall conversion rate.** Step conversion rate answers "how efficient is this specific transition?" and is used for diagnosing and fixing individual stages. Overall conversion rate answers "how valuable is a user who enters here?" and is used for budget allocation, CAC math, and growth modeling. They answer different questions and both must appear in the table.

4. **Quantify drop-offs in revenue or business value, not just user counts.** A stage with 2,000 users lost at an AOV of $150 represents $300,000 in potential monthly revenue. Executives and product teams allocate resources based on business impact, not user counts. Always calculate Revenue at Risk = Drop-off Users × AOV (or expected LTV if the funnel precedes multiple purchases).

5. **NEVER diagnose a drop-off from data alone.** Funnel data shows WHERE users leave. It cannot show WHY. Data must always be paired with diagnostic questions that require investigation -- session recordings (Hotjar, FullStory, LogRocket are standard tools), user interviews, heatmaps, or form analytics (Mouseflow, Formisimo). Stating "users drop off at checkout" and recommending "improve the checkout experience" is not a diagnosis; it is a restatement of the data.

6. **Diagnostic questions must be stage-specific.** "Improve the user experience" is not a diagnostic question. "Does the account creation gate appear for the first time at Stage 3, forcing users who want to check out as a guest to stop and create a password?" is a diagnostic question. Each question must be answerable with a specific investigation and must directly address the mechanism of drop-off at that precise stage.

7. **Define time window explicitly and state whether the cohort is complete.** A "30-day analysis" where some users entered 5 days ago have not had the full window to complete will understate true conversion. Always identify whether you are measuring a closed cohort (all users have had the full completion window) or a live cohort (some are still in progress). For live cohorts, note that the reported conversion rate is a floor, not the final number.

8. **If funnel has more than 8 stages, group into macro-stages first.** Present 3-5 macro-stages in the summary table (e.g., "Awareness" covering stages 1-3, "Consideration" covering stages 4-6, "Conversion" covering stages 7-9). Then produce a detailed breakdown for the worst-performing macro-stage only. This prevents cognitive overload while keeping the analysis navigable.

9. **Segment comparisons require volume thresholds.** Do not draw directional conclusions from segments with fewer than 200 users at any stage within the comparison. Statistical noise at small N levels will produce conversion rate differences of 5-15pp that are meaningless. Flag any segment cell with N < 200 with an asterisk and note "low confidence."

10. **Every recommendation must include a testable hypothesis in the format: "We believe [specific change] at [specific stage] will improve [metric] by [estimated magnitude] because [mechanism]."** This format forces three things: specificity about what is being changed, accountability for the expected outcome, and a causal theory that can be validated or refuted. Recommendations without hypotheses are wishes, not plans.

11. **Do not mix unique users and sessions without flagging it.** If Stage 1-3 are measured in unique users but Stage 4-5 are measured in sessions (which can happen when different analytics tools cover different parts of a flow), the funnel will appear to have a false drop-off at the measurement boundary. Always ask how each stage is instrumented and flag any measurement methodology change between stages.

12. **Benchmark funnel performance against industry standards.** Presenting a 4.5% overall checkout conversion rate without context is not useful. E-commerce checkout completion (product page to order) averages 2.5-3.5% across all traffic; above 4% is strong. SaaS trial-to-paid averages 15-25% for product-led growth products. Providing these reference points prevents both false alarm and false reassurance.

---

## Edge Cases

### Non-Linear Funnel (Users Skip Steps or Take Branching Paths)

Some funnels have legitimate skip paths -- a returning user who has already entered shipping info may go directly to payment, bypassing the shipping stage. A B2C product may have both "Sign Up" and "Buy as Guest" paths that converge at order confirmation.

Do not force these into a strict linear funnel and pretend the skips don't exist. Instead: present the linear "intended path" as the primary analysis, calculate what percentage of all completions passed through each stage (e.g., "72% of orders went through the full linear path; 28% used guest checkout and bypassed account creation"), and add a "Path Variation Analysis" section. High skip rates at a specific stage often indicate that the stage is unnecessary friction -- users who can bypass it do, and users who cannot abandon. If >30% of completions skip a specific stage, that is a strong signal to consider making that stage optional for all users.

### Re-Entry Funnel (Users Restart After Abandonment)

Many funnels are not single-attempt. A user who starts checkout three times and completes on the third attempt has a very different story depending on whether you count at the user level or the session level. User-level: 100% conversion (they completed). Session-level: 33% conversion.

Always specify which level you are analyzing. For optimization purposes, user-level conversion is usually the right frame -- the goal is to get users to complete, not to make them complete in fewer attempts. However, session-level analysis is useful for identifying how many users who completed required multiple attempts, which surfaces abandonment-and-return behavior. If re-entry is high (>40% of completers tried more than once), investigate what brings users back -- cart abandonment emails, retargeting ads, or organic return -- and factor that into the funnel's marketing cost structure.

### Very Long Funnel (10+ Stages)

B2B sales funnels, onboarding flows, and compliance-heavy processes routinely have 12-20 measurable stages. Presenting all 18 stages in a single table creates a wall of numbers that is analytically paralyzing.

Apply a two-pass approach. Pass 1: group stages into 3-5 macro-stages based on user journey phase (Awareness, Intent, Qualification, Activation, Revenue) and calculate macro-stage conversion rates. Identify which macro-stage has the worst conversion. Pass 2: expand only that macro-stage into its individual steps with full diagnostic treatment. This structure makes the analysis both navigable for stakeholders and detailed enough for practitioners. Note explicitly in the output that other macro-stages have been summarized and can be expanded on request.

### B2B Funnel with Committee Buying or Multi-Stakeholder Accounts

In B2B contexts, "user" may mean an individual employee, but the purchase decision requires approval from finance, security, and a VP. An individual account executive may complete all demo stages but stall at procurement review. Tracking individuals through a funnel where the decision is made at the account level will produce misleading conversion rates.

Define the unit of analysis explicitly: account-level or individual-level. For account-level funnels, a stage is "complete" when any individual within the account completes the action (e.g., any user in the account has viewed the demo). For conversion stages that require formal approval (procurement, security review), track accounts, not individuals. Note which stages are individual-level and which are account-level, because they require different interventions -- individual stage failures call for UX or content fixes, while account-level stage failures call for sales process and relationship interventions.

### Two-Sided Marketplace Funnel

A marketplace (e.g., a freelance platform, a rental marketplace, a B2B sourcing tool) has buyer funnels and seller/supplier funnels that are interdependent. A buyer may abandon because there are not enough relevant listings -- that is a supply problem, not a buyer UX problem. Conflating them produces wrong diagnoses.

Produce two separate funnels: one for buyers, one for sellers/suppliers. In each, explicitly note the dependency on the other side (e.g., "buyer Stage 3 'Search Results Viewed' conversion is partially determined by supply density -- if there are fewer than 5 relevant listings in a buyer's category, step conversion to 'Listing Viewed' drops 40%"). Do not attempt to diagnose the buyer funnel in isolation if supply quality is a known variable. Instead, present a "supply-adjusted" conversion rate alongside the raw rate.

### Funnel with Divergent User Quality (Traffic Quality Problem vs. Funnel Efficiency Problem)

Sometimes a funnel's conversion rate drops because the funnel itself changed, and sometimes it drops because the mix of users entering the funnel changed -- lower-intent traffic from a new paid channel, or a bot traffic spike. These require completely different responses.

When overall conversion drops, always check whether Stage 1 volume changed at the same time. If Stage 1 volume increased sharply (e.g., a new paid campaign launched) and overall conversion dropped proportionally, the funnel itself may be performing identically -- lower-intent users are just being added at the top. Compute conversion rate separately for the new traffic source vs. existing sources. If the new source converts at 1/3 the rate of existing sources, the "funnel problem" is actually a traffic quality problem. Recommend traffic quality improvement (better audience targeting, keyword match type tightening) rather than funnel UX changes.

### Funnel with Suspected Instrumentation Failure

A sudden, sharp drop at a specific stage that coincides with a code deployment, analytics library update, or third-party tag change is more likely an instrumentation failure than a user experience regression.

Before diagnosing a behavioral cause, check: Did conversion at this stage drop to near-zero overnight? That is almost never a UX change -- it is a broken event. Did it drop 30-50% on a specific date? Check the deploy log for that date. Is the drop device-specific or browser-specific? That suggests a client-side event firing issue. Always recommend that instrumentation be validated (cross-referencing with server-side records, comparing analytics tool data to database records of actual completions) before investing in UX or product changes. Diagnosing a broken tracking pixel as a user abandonment problem wastes engineering resources and produces false optimization stories.

---

## Example

**Input:** "Analyze our SaaS product's free trial activation funnel. Steps are: Trial Signup, Email Verified, Profile Completed, First Project Created, First Team Member Invited, Integration Connected. We're looking at the last 30 days. We have desktop and mobile segments."

**Data provided:**
- Trial Signup: 8,400 users (desktop: 5,460 / mobile: 2,940)
- Email Verified: 6,048 users (desktop: 4,241 / mobile: 1,807)
- Profile Completed: 4,234 users (desktop: 3,178 / mobile: 1,056)
- First Project Created: 3,049 users (desktop: 2,480 / mobile: 569)
- First Team Member Invited: 1,525 users (desktop: 1,364 / mobile: 161)
- Integration Connected: 763 users (desktop: 709 / mobile: 54)
- Average contract value (ACV) for users who complete activation: $1,800/year
- Activation-to-paid conversion rate: 22%
- Analysis window: 7 days from signup to complete activation

---

**Output:**

## Funnel Analysis: Free Trial Activation

### Funnel Definition
- **Process:** Free trial signup through full product activation (project, team, and integration setup)
- **Date range:** Last 30 days (entering cohort: Jan 27 -- Feb 26, 2026)
- **Cohort status:** Closed cohort -- all users who entered the funnel have had their full 7-day window to complete. Users who signed up in the final 7 days of the period are excluded.
- **Time window:** 7 days from trial signup. Any activation step completed after day 7 is not counted toward this analysis period.
- **Entry event:** `trial_signup_completed` server-side event (form submission confirmed, account record created)
- **Completion event:** `integration_connected` event fires at least once within the 7-day window
- **Counting method:** Unique users. A user who signed up once and completed actions across multiple sessions is counted once at each stage.
- **Baseline:** Prior 30-day period activation rate was 9.4%. Current period: 9.1% -- a 0.3pp decline, directionally concerning but not yet statistically significant at this volume.

---

### Funnel Performance Table

| Stage | Stage Name | Entry Event | Users | Step Conv. Rate | Overall Conv. Rate | Drop-off (Users) | Drop-off % | Revenue at Risk |
|-------|-----------|------------|-------|-----------------|-------------------|-----------------|------------|----------------|
| 1 | Trial Signup | `trial_signup_completed` | 8,400 | -- | 100% | 2,352 | 28.0% | $93,139 |
| 2 | Email Verified | `email_verified` | 6,048 | 72.0% | 72.0% | 1,814 | 30.0% | $71,835 |
| 3 | Profile Completed | `profile_completed` | 4,234 | 70.0% | 50.4% | 1,185 | 28.0% | $46,922 |
| 4 | First Project Created | `project_created` | 3,049 | 72.0% | 36.3% | 1,524 | 50.0% | $60,321 |
| 5 | First Team Member Invited | `team_member_invited` | 1,525 | 50.0% | 18.2% | 762 | 50.0% | $30,171 |
| 6 | Integration Connected | `integration_connected` | 763 | 50.0% | 9.1% | -- | -- | -- |

Revenue at Risk = Drop-off Users × 22% activation-to-paid rate × $1,800 ACV ÷ 12 months (monthly value)

**Overall funnel conversion:** 9.1% (trial signup to integration connected)
**Prior period conversion:** 9.4% (delta: -0.3pp -- within normal variance at this volume)

---

### Critical Drop-off Summary

| Priority | Transition | Users Lost | Step Conv. Rate | Revenue at Risk (monthly) | Drop-off Type |
|----------|-----------|------------|-----------------|--------------------------|---------------|
| #1 | Project Created → Team Invited | 1,524 | 50.0% | $60,321 | Both volume AND rate |
| #2 | Trial Signup → Email Verified | 2,352 | 72.0% | $93,139 | Volume (expected attrition) |
| #3 | Team Invited → Integration Connected | 762 | 50.0% | $30,171 | Rate (low conversion, smaller pool) |
| #4 | Profile Completed → Project Created | 1,185 | 72.0% | $46,922 | Volume |

**Biggest absolute drop-off:** Stage 1 to Stage 2 (2,352 users lost) -- however, email verification drop-off of 28% is within industry norms (20-30%). This is partially expected attrition from mistyped emails, inactive addresses, and low-intent signups.

**Highest-priority optimization target:** Stage 4 to Stage 5 -- 1,524 users created a project but did NOT invite a team member. This is the 50% step conversion rate at the point of highest individual investment (user has already created content), and team invitation is a known leading indicator of paid conversion in collaborative SaaS products. Users who invite a teammate are typically 2-4x more likely to convert to paid.

**10pp improvement value (Stage 4 → Stage 5):** Improving team invite rate from 50% to 60% means 305 additional users reach Stage 5. At current downstream conversion (50% Stage 5→6 × 22% activation-to-paid × $1,800 ACV), this represents approximately 305 × 0.50 × 0.22 × $150/month = **$5,032 additional MRR per month**, or ~$60,000 ARR.

---

### Diagnostic Questions by Stage

**Stage 4 → Stage 5: First Project Created → First Team Member Invited (50.0% -- 1,524 users lost)**

*Expectation mismatch:*
- Are solo users (freelancers, individual contributors) signing up for the trial without any intention of inviting teammates? If so, the funnel definition may need a "solo user" vs. "team user" segmentation -- a solo user who creates a project and connects an integration IS fully activated, even without an invitation step.
- Does the product communicate clearly that team collaboration is a core value proposition during onboarding? Or does the invite prompt appear as an afterthought after project creation?

*Friction audit:*
- How many steps does it take to invite a team member? Is it a modal that appears after project creation, or does the user need to navigate to Settings > Team > Invite?
- Does the invite flow require entering multiple email addresses at once? Users who want to invite one person are often blocked by interfaces designed for bulk invitations.
- Is team invite gated behind a plan tier that free trial users cannot access? If invite is a paid feature, this drop-off is expected and the funnel definition should exclude it as an activation criterion for solo users.

*Information gap:*
- Does the user understand WHY they should invite a teammate? Is the value of collaboration visible at the moment the invite prompt appears (e.g., "projects with 2+ members complete 3x faster")?
- Does the user have teammates who would use the product? If they signed up from a personal email, they may not have work colleagues in their address book.

*Technical failure hypothesis:*
- Does the invite email land in spam for corporate domains? Gmail and Outlook have aggressive spam filtering for SaaS invitation emails. Test delivery from common corporate domains (Google Workspace, Microsoft 365, large enterprise domains).
- Is the invite confirmation that "invitation sent" appearing? If the UI shows no feedback after clicking Send, users may not know the action completed and abandon.

*Alternative path hypothesis:*
- Are some users completing the integration step without inviting a teammate? Check how many users went directly from Stage 4 (project created) to Stage 6 (integration connected), skipping Stage 5 entirely. If this path exists, it suggests some users are solo adopters who connect integrations without team buy-in -- a legitimate activation path.

---

**Stage 1 → Stage 2: Trial Signup → Email Verified (72.0% -- 2,352 users lost)**

*Expectation mismatch:*
- Did users understand at signup that email verification was required before accessing the product? If the product appeared to accept them ("Welcome! Your account is ready") before verification, the verification email feels like an unexpected gate.
- What is the delay between signup and receipt of the verification email? Delays over 2 minutes dramatically reduce verification rates as users move on to other tasks.

*Friction audit:*
- How many clicks does email verification require? The gold standard is a single magic-link click. If users are required to copy a code and return to the app, a meaningful percentage will abandon.
- Is a "Resend Verification Email" button accessible immediately and prominently on the waiting state? Users who don't receive the first email within 30 seconds will need this.
- Is the product fully locked until email is verified, or is there a limited "preview" mode that lets users see value before completing verification? Products that show value before verification see 15-20% higher verification completion rates.

*Technical failure hypothesis:*
- Are verification emails landing in spam? Check SPF, DKIM, and DMARC records. Test deliverability to Gmail, Outlook, Yahoo, and major corporate domains.
- Are users signing up with work email addresses that have aggressive spam filtering? If >40% of signups use corporate domains, email deliverability is the most likely technical cause.

*Information gap:*
- Is the from-address recognizable? Verification emails from `noreply@cloudplatform-notifications.io` will be ignored; emails from `hello@[ProductName].com` perform measurably better.

---

**Stage 5 → Stage 6: First Team Member Invited → Integration Connected (50.0% -- 762 users lost)**

*Expectation mismatch:*
- Do users understand what "integration" means in this context? If users think "integration" means API access or a developer-only feature, non-technical users will not attempt it.
- Is the integration step positioned as essential to product value, or as an optional power-user feature? If it's framed as optional, many users who invited teammates will consider themselves "done" with onboarding.

*Friction audit:*
- How many integrations are available, and how are they surfaced? An integration catalog with 50 options and no recommendation logic will paralyze users with choice. The highest-converting onboarding flows show 3-5 "most popular integrations" specific to the user's role or company type.
- Is OAuth the primary connection method? OAuth integrations have 70-80% completion rates when initiated; API-key-based integrations have 30-50% because users must navigate to a third-party settings page to generate a key.

*Technical failure hypothesis:*
- Are there specific integrations with broken OAuth flows? A single broken Salesforce or Slack OAuth connection that throws a 500 error will silently fail for all users attempting that integration. Check error rates by integration type.

---

### Segment Comparison

| Segment | Stage 1 Users | Email Verified | Profile Completed | Project Created | Team Invited | Integration Connected | Overall Conv. | Gap vs. Average |
|---------|--------------|----------------|------------------|-----------------|--------------|----------------------|---------------|-----------------|
| Desktop | 5,460 | 77.7% | 75.0% | 78.0% | 55.0% | 52.0% | 13.0% | +3.9pp |
| Mobile | 2,940 | 61.5% | 58.4% | 53.9% | 28.3% | 37.9% | 1.8% | -7.3pp |

**Highest-leverage segment:** Mobile users -- 35% of total signups, overall conversion 1.8% vs. 9.1% aggregate, representing a 7.3pp gap. Closing mobile conversion to even 5% (half the desktop rate) would add approximately 94 monthly activating users, or ~$3,384 MRR at current activation-to-paid rates.

**Key segment finding:** The mobile funnel collapses specifically at Stage 4 to Stage 5 (project created to team member invited) -- 28.3% step conversion on mobile vs. 55.0% on desktop. This 26.7pp gap is the single largest device-specific disparity in the funnel. Combined with a 53.9% mobile Project Creation rate vs. 78.0% on desktop, mobile users are failing at both getting started AND inviting teammates. This suggests the project creation flow AND the team invite flow both have mobile-specific UI problems, not just the invite step in isolation.

Additionally, email verification is 16pp lower on mobile (61.5% vs. 77.7% desktop). Mobile users who sign up on-the-go often do not have immediate access to their email client within the same session. An SMS verification fallback option could recover a meaningful percentage of this drop.

---

### Recommendations

| Tier | Recommendation | Stage Targeted | Expected Lift | Effort | Testable Hypothesis |
|------|---------------|----------------|---------------|--------|---------------------|
| 1 | Audit team invite email for spam delivery on corporate domains | Stage 4 → 5 | 3-5pp | Low (2 hrs) | We believe invite emails are landing in spam for corporate domains because SPF/DKIM records are not fully configured, causing the 50% invite step conversion to be artificially low for enterprise signups |
| 1 | Add "Resend verification email" button with 30-second auto-prompt on verification waiting state | Stage 1 → 2 | 2-4pp | Low (1 day) | We believe users who don't receive the verification email within 60 seconds abandon without knowing how to resend it, because the current waiting state shows no resend option for 5 minutes |
| 2 | Add contextual invite prompt immediately after first project save, with social proof copy ("Teams with 2+ members are 3x more likely to ship on time") | Stage 4 → 5 | 5-8pp | Medium (1 sprint) | We believe users who create a project are receptive to inviting teammates at the moment of project creation because the value of collaboration is most salient immediately after creating something worth sharing |
| 2 | Redesign mobile project creation flow to reduce required fields from 6 to 3 (defer optional fields to post-creation) | Stage 3 → 4 mobile | 10-15pp mobile | Medium (1 sprint) | We believe mobile users abandon project creation because the 6-field form is difficult to complete on a small screen without a keyboard, and that 3 required fields would meet the minimum viable project creation threshold |
| 2 | Offer SMS verification as alternative to email for mobile signups | Stage 1 → 2 mobile | 8-12pp mobile | Medium (2 sprints) | We believe mobile signers-up do not complete email verification because they sign up on mobile but their email client is on desktop or is inaccessible during the signup session |
| 3 | Implement integration recommendation engine that surfaces the top 3 integrations based on user role and connected apps | Stage 5 → 6 | 8-12pp | High (1 quarter) | We believe users abandon the integration step because they are overwhelmed by the full integration catalog and cannot identify which integration is most relevant to them, whereas a personalized 3-option prompt would reduce decision fatigue |

**Immediate next step:** Before building anything, run session recordings (FullStory or LogRocket) on 50 mobile sessions that drop off between Project Created and Team Invited. Confirm whether users are seeing the invite prompt at all, clicking it and abandoning mid-flow, or never reaching it. This 2-hour investigation will determine whether the fix is prompt placement (low effort) or invite flow redesign (medium effort).

**Data gaps that would sharpen this analysis:**
1. **Solo vs. team intent at signup:** A survey question at signup ("Are you using this for yourself or with a team?") would allow separation of the funnel by intended use case and remove the confound of solo users in the team-invite stage.
2. **Integration error logs by integration type:** Knowing which specific integrations have the highest failure rates at OAuth connection would immediately surface whether this is a UX problem or a broken connector problem.
3. **Activation-to-paid rate by activation path:** If users who skip the team invite step and go directly to integration have a different paid conversion rate than those who follow the full path, the activation definition itself may need revision.
