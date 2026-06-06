---
name: customer-journey-map
description: |
  Produces a completed customer journey map across stages from awareness
  through advocacy with touchpoints, emotions, pain points, and opportunities
  at each stage using journey mapping methodology. Use when the user asks to
  map the customer journey, understand customer experience across touchpoints,
  identify friction in the buying process, or visualize the path from
  prospect to advocate.
  Do NOT use for buyer persona creation (use customer-persona), sales
  funnel metrics (use pipeline-review), or marketing analytics reporting
  (use marketing-analytics-report).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "marketing strategy planning analysis"
  category: "marketing-sales"
  subcategory: "marketing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Customer Journey Map

## When to Use

Use this skill when the user presents any of the following situations:

- User asks to create, build, or produce a customer journey map for a product, service, or business model -- including explicit requests like "map our customer journey" or "show me the path from prospect to customer"
- User wants to diagnose friction, drop-off, or dissatisfaction at specific stages of the experience -- for example: "our free trial conversion is terrible, where are we losing people?"
- User needs to align cross-functional teams (product, marketing, sales, CS) around a shared picture of the customer experience, often as a precursor to a CX improvement initiative or product roadmap session
- User wants to document the "as-is" journey so they can design a "to-be" experience -- a gap analysis between current state and desired state
- User wants to identify "moments of truth" -- the high-stakes interactions that disproportionately shape customer perception and loyalty
- User is launching a new product or entering a new market and needs to anticipate how a specific persona will discover, evaluate, adopt, and retain their solution
- User wants to improve NPS, CSAT, or retention metrics and needs to understand which journey stages are driving dissatisfaction

**Do NOT use when:**

- User needs a detailed buyer persona profile with demographics, psychographics, and motivations -- use `customer-persona` instead; a journey map requires a completed persona as input, not the other way around
- User needs to review sales pipeline health, deal velocity, stage conversion rates, or rep performance -- use `pipeline-review`; pipeline data informs journey maps but is a separate analytical task
- User needs a marketing analytics report with channel attribution, CPL, ROAS, or campaign ROI -- use `marketing-analytics-report`; these are metrics that feed into a journey map, not the map itself
- User is asking how to conduct primary customer research (interviews, surveys, ethnography) -- that is a research design task, not a journey mapping task; recommend research methods and return here once data is collected
- User needs a service blueprint (which maps frontstage and backstage operations, staff actions, and support systems behind the customer experience) -- a journey map and service blueprint are complementary but distinct documents; the journey map shows customer perspective only

---

## Process

### Step 1: Gather Minimum Required Context Before Producing Anything

Never produce a journey map without first collecting this information. Ask for what is missing.

- **Product or service:** What is being mapped? SaaS tool, physical product, professional service, marketplace, brick-and-mortar experience? The business model changes which stages matter most and which touchpoints exist.
- **Target persona:** Who is taking this journey? Job title, company size, and decision-making authority matter for B2B. Life stage, purchase frequency, and channel behavior matter for B2C. Do not accept "our customer" -- push for one specific persona. If none exists, pause and use `customer-persona` first.
- **Journey scope:** Full journey (awareness through advocacy) or a specific sub-journey (e.g., onboarding only, returns process, renewal)? Default to full if unspecified but confirm.
- **Known touchpoints:** What channels, tools, and interaction types exist today? Websites, ads, sales calls, in-product flows, support tickets, emails, account managers, packaging, invoices -- all count.
- **Known problem areas:** Where does the business already know there is friction? Low conversion rates, high support volume, NPS score drops at specific stages, high churn at predictable time periods.
- **Data sources available:** Analytics platforms, NPS/CSAT surveys, customer interview recordings, support ticket themes, sales call notes, heatmaps, session recordings, app usage data, churn cohort analysis. Mark stages as "hypothesis" if no data exists for them.
- **Perspective type:** Is this an "as-is" map (documenting current reality), a "to-be" map (designing an ideal future state), or both (gap analysis)? Most useful maps show both.

### Step 2: Establish the Correct Journey Architecture for This Business Model

The generic 5-stage model (Awareness, Consideration, Decision, Onboarding, Loyalty) is a starting point, not a constraint. Adapt it based on the business model before mapping touchpoints.

- **B2B SaaS with free trial:** Use -- Awareness / Consideration / Trial Activation / Conversion / Adoption / Expansion / Advocacy. The trial and activation phases are distinct stages that carry most of the conversion risk.
- **B2B enterprise with long sales cycle:** Use -- Awareness / Education / Evaluation (proof of concept, security review) / Procurement / Onboarding / Adoption / Renewal / Expansion. Multiple buyer personas enter at different stages -- the champion, the technical evaluator, and the economic buyer have separate sub-journeys that intersect.
- **B2C e-commerce:** Use -- Discovery / Consideration / Purchase / Post-Purchase (delivery, unboxing) / Repeat Purchase / Advocacy. Compress or eliminate onboarding. Expand the post-purchase stage because delivery experience and returns are critical satisfaction drivers.
- **Subscription consumer (streaming, subscription box, SaaS for individuals):** Add a Retention/Renewal stage between active use and advocacy. Churn prediction and win-back sequences live here.
- **Service business (consulting, agency, healthcare, hospitality):** Service delivery becomes a multi-phase stage: intake, scoping, delivery, handoff/closeout, follow-up. In-service communication quality is usually the highest emotional impact zone.
- **Marketplace (two-sided):** Map buyer and seller journeys separately. Identify where the two journeys intersect and where friction on one side causes abandonment on the other.
- **Retail (physical or omnichannel):** Include pre-visit (search, ads, reputation), in-store (parking, navigation, staff, checkout), and post-visit (receipt, review request, loyalty program) as distinct stages.

### Step 3: Map Every Stage Using the Full 7-Dimension Framework

For each stage, document all seven dimensions. Skipping any dimension produces an incomplete map.

- **Customer goal:** What does the customer actually want to accomplish at this stage? Frame it from the customer's perspective, not the company's. "Understand if this tool will work for my team" is a customer goal. "Complete product evaluation" is company language.
- **Touchpoints:** Every channel, interaction, and artifact the customer encounters. Distinguish between company-owned (website, app, email), company-controlled (Google Ads, paid social), partner/third-party (review sites like G2 or Trustpilot, analyst reports, resellers), and peer (word-of-mouth, community forums, LinkedIn posts from peers).
- **Customer actions:** What does the customer physically do? Search keywords, click ads, read reviews, sign up for trial, schedule a demo, attend a webinar, export data to evaluate, submit a support ticket.
- **Customer thoughts and questions:** The internal monologue. "Is this better than what I already use?" "Can my team actually adopt this?" "What happens if I need help?" "How do I justify this cost to my manager?" Capturing this is what separates a journey map from a funnel diagram.
- **Emotions:** Use a specific emotional vocabulary. Do not write "positive" or "negative" -- write: curious, skeptical, overwhelmed, hopeful, frustrated, confident, anxious, delighted, relieved, disappointed. Where possible, tie emotion labels to data (e.g., CSAT of 6.2/10 at onboarding means anxious/uncertain, not delighted).
- **Pain points:** Specific frictions. "The comparison page doesn't show pricing for our use case size" is specific. "The website is confusing" is not. Pain points should be traceable to a specific touchpoint and actionable by a specific team.
- **Opportunities:** Concrete improvements tied directly to the pain point. Every pain point should pair with at least one opportunity. Frame opportunities as testable hypotheses: "If we add a team-size filter to the pricing page, customers with 25-100 seats will reach the demo request form at a higher rate."

### Step 4: Identify and Score Moments of Truth

Not all touchpoints are equal. The customer journey literature identifies "moments of truth" as the interactions that disproportionately define the overall relationship. Apply a structured framework to identify them.

- **First moment of truth (FMOT):** The first encounter with the product or brand in a purchase context -- seeing a product on a shelf, landing on a website, receiving a sales outreach. In SaaS, this is often the product landing page or the first demo. If this interaction fails to establish credibility and relevance within 8 seconds, most visitors leave.
- **Second moment of truth (SMOT):** The experience of actually using the product for the first time. In SaaS this is trial activation and first-session experience. In physical products it is unboxing and first use. The SMOT determines whether the brand promise made at FMOT is delivered.
- **Ultimate moment of truth (UMOT):** The moment the customer becomes a source of social proof -- leaving a review, posting on LinkedIn, making a referral. This is the output of a successful end-to-end journey and the input to another customer's FMOT.
- **Zero moment of truth (ZMOT):** Pre-FMOT -- the research and peer influence that happens before the customer ever engages with the brand directly. Review sites, community forums, analyst ratings, and peer recommendations. Brands that ignore ZMOT lose customers before the journey even starts.
- Score each moment of truth on two dimensions: **emotional intensity** (1-5, how strongly does the customer feel something at this moment) and **decision leverage** (1-5, how much does this moment influence whether they continue or exit the journey). Moments scoring 4+ on both dimensions are your critical intervention points.

### Step 5: Map the Emotional Arc and Identify the Experience Signature

- Plot a satisfaction/emotion curve across all stages on a 1-10 scale. This is the "experience signature" -- the shape of the emotional journey. Share it as a simple high-low-high or dip-then-recovery pattern described in text if a visual chart cannot be produced.
- A healthy journey has a "confidence ramp" -- emotions trending upward from uncertainty (awareness) to confidence (decision) to delight (onboarding) to pride/trust (advocacy). Any downward spike after purchase is a churn warning.
- The "IKEA effect" applies to onboarding: customers who invest effort in setup and configuration value the product more highly. However, effort must be bounded -- complexity that exceeds 45 minutes of non-rewarded effort in digital onboarding reliably drives abandonment.
- Identify the "valley of despair" if it exists -- the period after purchase when excitement drops and the customer has not yet achieved measurable value. This is the highest churn-risk window and the primary target for onboarding design.
- Research by Forrester and others shows that emotion is the single biggest driver of customer loyalty -- more than ease or effectiveness. Design the emotional arc intentionally, not accidentally.

### Step 6: Build the Prioritized Improvement Action Plan

- Score each identified opportunity on two axes using a simple 2x2 matrix: **Customer Impact** (how significantly does this improvement change the customer's experience at this stage -- Low/Medium/High) and **Implementation Effort** (engineering time, budget, cross-team coordination required -- Low/Medium/High).
- Priority 1 (Quick Wins): High Impact / Low Effort -- execute in the next 30 days. These are typically content changes, email sequence improvements, in-app message additions, or support process updates.
- Priority 2 (Major Projects): High Impact / High Effort -- schedule in the next quarter with dedicated resources. These typically involve product changes, redesign of core flows, or restructuring of onboarding programs.
- Priority 3 (Fill-Ins): Low Impact / Low Effort -- batch these together and execute when bandwidth allows.
- Deprioritize: Low Impact / High Effort -- document these and revisit only if the strategic context changes.
- Every improvement in the action plan must have: a specific owner (team, not just "marketing"), a measurable success metric tied to the stage metric table, and a realistic timeline. Avoid vague timelines like "Q3" -- use week counts from the present date.

### Step 7: Define Stage-Level Metrics and Measurement Infrastructure

- Each stage needs at least one leading indicator metric (a behavioral signal that predicts future outcomes) and one lagging indicator metric (a business result). Tracking only lagging indicators means you discover problems after customers have already churned or not converted.
- **Awareness stage metrics:** Branded search volume (leading), Share of Voice on review platforms, organic reach, ad impression share. Lagging: cost per qualified lead, assisted conversion rate.
- **Consideration stage metrics:** Time-on-site for high-intent pages (leading), return visit rate, content engagement rate. Lagging: demo request rate, trial sign-up rate, MQL-to-SQL conversion rate.
- **Decision stage metrics:** Proposal acceptance rate (leading), sales cycle length, days between demo and close. Lagging: close rate, average deal size.
- **Onboarding/Activation metrics:** Time-to-first-value (leading -- the time from sign-up to the first moment of experiencing the core product benefit), setup completion rate, day-7 and day-30 active usage rates, help center article views (high views = confusion). Lagging: trial-to-paid conversion rate.
- **Retention/Loyalty metrics:** Product engagement score (feature adoption breadth), NPS score at 60 and 180 days (leading), support ticket volume trend. Lagging: renewal rate, churn rate, expansion revenue rate, referral rate.
- Specify the tracking tool for each metric. Generic metric tables with no tracking method are useless. Be specific: Google Analytics 4 for website behavior, Mixpanel or Amplitude for in-product events, Salesforce or HubSpot for pipeline, Intercom or Zendesk for support volume, Delighted or Medallia for NPS.

### Step 8: Mark Hypothesis vs. Validated Data Across All Stages

- Every section of a journey map exists on a confidence spectrum from "validated by data" to "best-guess hypothesis." Conflating the two leads to prioritizing the wrong improvements.
- Mark each stage with a confidence level: **Validated** (supported by quantitative data -- analytics, survey results, user research with 10+ interviews), **Partial** (supported by anecdotal evidence -- sales call notes, occasional customer feedback, limited survey data), or **Hypothesis** (team assumption with no direct customer evidence).
- For all Hypothesis-rated stages, include a specific research recommendation: "Conduct 5 structured customer interviews with churned users to validate assumed pain points at onboarding stage" or "Add a single-question CSAT survey at checkout completion to measure Decision stage sentiment."
- Research best practices: 5-7 customer interviews per persona typically reaches theme saturation for qualitative research. 50+ survey responses for quantitative stage sentiment are needed for statistical reliability. Exit surveys need a 15%+ response rate to be representative.

---

## Output Format

```
## Customer Journey Map: [Product/Service Name]

**Persona:** [Persona name and one-line description]
**Business Model:** [SaaS / E-commerce / B2B Services / etc.]
**Journey Scope:** [Full journey -- Awareness through Advocacy / specific stages]
**Perspective:** [As-Is / To-Be / Gap Analysis]
**Date:** [Date]
**Data Confidence:** [% of stages Validated / Partial / Hypothesis]

---

### Journey Overview (Emotion Curve Summary)

| Stage | Customer Goal | Key Touchpoints | Dominant Emotion | Satisfaction (1-10) | Confidence |
|-------|--------------|-----------------|-----------------|---------------------|------------|
| Awareness | [Customer goal] | [Top 2-3 channels] | [Emotion word] | [Score] | [V/P/H] |
| Consideration | [Goal] | [Channels] | [Emotion word] | [Score] | [V/P/H] |
| Decision | [Goal] | [Channels] | [Emotion word] | [Score] | [V/P/H] |
| Onboarding | [Goal] | [Channels] | [Emotion word] | [Score] | [V/P/H] |
| Retention | [Goal] | [Channels] | [Emotion word] | [Score] | [V/P/H] |
| Advocacy | [Goal] | [Channels] | [Emotion word] | [Score] | [V/P/H] |

**Emotional Arc:** [Describe the shape: e.g., "Rises from curious (6/10) through anxious (4/10) at onboarding
valley, then recovers to confident (8/10) at retention -- classic valley-of-despair pattern with primary
risk window at days 0-14 post-signup."]

---

### Stage 1: Awareness
**Confidence Level:** [Validated / Partial / Hypothesis]
**Customer Goal:** [What the customer wants to accomplish, written from their perspective]

| Dimension | Detail |
|-----------|--------|
| Touchpoints | [Company-owned: ...] [Third-party: ...] [Peer: ...] |
| Customer Actions | [Specific behaviors -- searching, reading, clicking] |
| Customer Thoughts | ["Am I...?" "Is there a...?" "Why does...?" -- actual internal questions] |
| Dominant Emotion | [Specific emotion word + brief rationale] |
| Information Needed | [What content helps them progress to next stage] |

**Pain Points:**
- [Specific, traceable friction tied to a specific touchpoint]
- [Second pain point]

**Opportunities:**
- [Concrete improvement framed as testable hypothesis]
- [Second opportunity]

**Moment of Truth at This Stage:** [If applicable -- which interaction here is highest stakes]

---

### Stage 2: Consideration
[Same structure as Stage 1]

---

### Stage 3: Decision
[Same structure]

---

### Stage 4: Onboarding / Activation
[Same structure]

---

### Stage 5: Retention / Loyalty
[Same structure]

---

### Stage 6: Advocacy
[Same structure]

---

### Moments of Truth Analysis

| Moment | Type | Stage | Emotional Intensity (1-5) | Decision Leverage (1-5) | Current Experience | Target Experience |
|--------|------|-------|--------------------------|------------------------|-------------------|-------------------|
| [Moment 1 name] | FMOT/SMOT/ZMOT/UMOT | [Stage] | [Score] | [Score] | [Current state -- specific] | [Desired state -- specific] |
| [Moment 2 name] | [Type] | [Stage] | [Score] | [Score] | [Current] | [Target] |
| [Moment 3 name] | [Type] | [Stage] | [Score] | [Score] | [Current] | [Target] |

---

### Improvement Action Plan (Prioritized by Impact/Effort Matrix)

**Priority 1 -- Quick Wins (High Impact / Low Effort, target: 0-30 days)**

| Improvement | Stage | Owner | Metric to Move | Timeline |
|-------------|-------|-------|---------------|----------|
| [Specific improvement] | [Stage] | [Team] | [Metric name + current value] | [Weeks] |

**Priority 2 -- Major Projects (High Impact / High Effort, target: 30-90 days)**

| Improvement | Stage | Owner | Metric to Move | Timeline |
|-------------|-------|-------|---------------|----------|
| [Improvement] | [Stage] | [Team] | [Metric] | [Weeks] |

**Priority 3 -- Fill-Ins (Low Impact / Low Effort, schedule as available)**

| Improvement | Stage | Owner | Metric to Move | Timeline |
|-------------|-------|-------|---------------|----------|
| [Improvement] | [Stage] | [Team] | [Metric] | [Weeks] |

---

### Stage Metrics Dashboard

| Stage | Leading Indicator | Current | Target | Lagging Indicator | Current | Target | Tracking Tool |
|-------|------------------|---------|--------|-------------------|---------|--------|---------------|
| Awareness | [Metric] | [Value] | [Value] | [Metric] | [Value] | [Value] | [Tool] |
| Consideration | [Metric] | [Value] | [Value] | [Metric] | [Value] | [Value] | [Tool] |
| Decision | [Metric] | [Value] | [Value] | [Metric] | [Value] | [Value] | [Tool] |
| Onboarding | Time-to-first-value | [Value] | [Value] | Trial conversion rate | [Value] | [Value] | [Tool] |
| Retention | Product engagement score | [Value] | [Value] | Churn rate | [Value] | [Value] | [Tool] |
| Advocacy | NPS (180-day) | [Value] | [Value] | Referral rate | [Value] | [Value] | [Tool] |

---

### Research Gaps and Validation Roadmap

| Stage | Confidence Level | Evidence Available | Research Needed | Method | Timeline |
|-------|-----------------|-------------------|-----------------|--------|----------|
| [Stage] | Hypothesis | [What is known] | [What needs validation] | [Interview / Survey / Analytics] | [When] |
```

---

## Rules

1. **Never produce the map without minimum context.** If persona, product, and at least one known problem area are not provided, ask before outputting anything. A journey map built on complete unknowns is fiction masquerading as strategy and will mislead rather than help.

2. **One persona per map.** A journey map depicting "our customers" without a specific persona is not a journey map -- it is a generic process diagram. If the user wants to map multiple personas, produce separate maps. B2B buying committees are the exception: map the primary buyer's journey and annotate where other stakeholders enter, rather than producing parallel maps.

3. **Emotions must use specific vocabulary, never valence labels.** Write "frustrated" or "skeptical" or "overwhelmed" not "negative." Write "excited" or "relieved" or "confident" not "positive." Vague emotional labels are unmappable to interventions. If emotional data is absent, use team inference but mark it as hypothesis.

4. **Pain points must be traceable to a specific touchpoint and specific customer action.** "The website is hard to use" fails this test. "Customers arriving from Google Ads land on a generic homepage that does not reflect the ad message, causing 78% to bounce within 10 seconds" passes. If the user has not provided specific pain points, ask what their support ticket themes, churn interview findings, or NPS verbatims say.

5. **Moments of truth must be scored, not just listed.** Apply the 2-axis scoring (emotional intensity 1-5 and decision leverage 1-5). Only interactions scoring 4 or above on both axes qualify as moments of truth. This prevents the map from listing every touchpoint as "critical."

6. **Every improvement in the action plan needs an owner, a metric, and a timeline.** "Improve onboarding" with no owner is not an action item. Ownership must be at team level minimum (Product, Marketing, CS, Sales). The metric must be a currently-tracked or immediately-trackable number.

7. **Distinguish as-is from to-be in every stage.** The map must make clear what is current reality and what is an aspirational target. Blending them produces documents that look like a plan but describe the present. Use column headers or labels to separate current state from target state throughout.

8. **Mark confidence levels explicitly.** Every stage must carry a confidence label (Validated, Partial, Hypothesis). Hypothesis stages must include a specific research recommendation with method and minimum sample size (e.g., "conduct 6 churn interviews" not "gather more customer feedback").

9. **The emotional arc must be described at the map level, not just implied by individual stage scores.** A one-paragraph narrative summary of the emotional shape of the entire journey is required in the Journey Overview section. This is what makes the map legible to executives and cross-functional teams who will not read every stage detail.

10. **Include both leading and lagging indicators for every stage.** A metrics table with only conversion rates or revenue outcomes is insufficient. Leading indicators (behavioral signals that predict outcomes) enable teams to intervene before customers churn, don't convert, or disengage. If the user has not defined leading indicators, propose specific ones based on the business model.

11. **The journey map must be actionable for at least three different teams.** A map that only surfaces work for one team (e.g., only product changes) is incomplete. Most journey stages create implications for Marketing, Product, Sales, and Customer Success simultaneously. Ensure the action plan distributes ownership across functions.

12. **Never model the journey from the company's process perspective.** The map describes what the customer experiences, thinks, and feels -- not what the company does operationally. Confusing these produces a service blueprint, not a journey map. If the user asks for operational process details, note that a service blueprint is the right tool and produce that separately.

---

## Edge Cases

### B2B Enterprise With a Multi-Stakeholder Buying Committee
A six-to-eighteen-month enterprise deal involves three to seven distinct buyer personas: the business champion who identifies the problem, the technical evaluator who assesses security and integration, the economic buyer (VP or CFO) who approves budget, end users who will actually operate the product, and procurement who handles contracting. Mapping the primary champion's journey first is correct. Then annotate each stage where secondary stakeholders enter with a notation like "[Technical evaluator enters here -- separate evaluation sub-journey begins]." Produce a stakeholder entry/exit table as an appendix showing which personas are involved at which stages and what their specific concerns are. The moments of truth differ by stakeholder: the champion's moment of truth is the first internal demo, the technical evaluator's is the security review, the economic buyer's is the ROI projection. Each needs a separate intervention strategy.

### Free Trial SaaS With Sub-7-Day Dropout Crisis
When the user reports that most trial abandonment happens within the first 72 hours, the Onboarding stage must be expanded into sub-stages: Signup (0-5 minutes), Activation (first session, 0-60 minutes), Habit Formation (days 1-7), and Value Realization (days 7-14). Each sub-stage needs its own touchpoint map, emotion rating, and metrics. The critical metric here is "time-to-first-value" -- the elapsed time from account creation to the moment the user completes the core action that delivers the product's primary benefit for the first time (sending a first campaign, completing a first project, connecting a first integration). Research from product-led growth firms shows that trials where time-to-first-value exceeds 24 hours have conversion rates 40-60% lower than those where value is realized in the first session. Map what the specific "aha moment" is for this product and redesign the onboarding stage around compressing the path to that moment.

### High-Churn Subscription Business With No Qualitative Research
When churn is high but the company has no customer interview data, survey results, or NPS verbatims, the journey map must be clearly marked as a hypothesis map requiring immediate validation. Do not produce a map that implies certainty. For each stage where churn could originate, produce a "churn hypothesis" column with at least three competing explanations for why customers might leave (e.g., at 90 days: customers hit a feature ceiling, pricing feels misaligned with perceived value, a competitor sent a re-engagement offer). Recommend a structured churn interview protocol: contact churned customers within 14 days of cancellation, conduct 8-12 interviews, use a structured guide asking about the last positive experience, first sign of doubt, what prompted the final cancellation decision, and what would have changed the outcome. Map outcomes into the journey map after interviews complete.

### Omnichannel Retail (Physical + Digital)
The journey includes both digital (Instagram ads, Google search, website, email) and physical (store visit, associate interaction, checkout line, packaging) touchpoints that must be mapped together. The hand-off moments between digital and physical channels are high-risk: a customer who researches online and visits in-store expects staff to have access to their browsing history or wishlist -- if that continuity fails, satisfaction drops sharply. Key omnichannel-specific touchpoints to map: click-and-collect pickup experience, in-store return of online purchase, price-match interactions, and loyalty program point visibility across channels. Rate each channel transition point for "continuity score" -- how seamlessly does the experience continue across the channel boundary?

### Mapping a Specific Sub-Journey (Not the Full End-to-End)
When a user asks to map only the returns process, the renewal flow, or the in-app upgrade path, apply the same full methodology to that narrowed scope -- do not simplify the framework. A returns process journey has its own stages: Problem Discovery (customer realizes item is defective or wrong), Return Initiation (finding return policy, printing label), Drop-Off (physical or digital submission), Wait Period (anticipating refund), and Resolution (refund confirmation + sentiment). Map emotions, pain points, and opportunities at each sub-stage. Include moments of truth specific to this sub-journey (e.g., the return initiation moment is a moment of truth for returns -- customers who encounter a confusing return policy at this point often escalate to chargebacks rather than completing the return). Connect the sub-journey outcomes to the parent journey's Loyalty and Advocacy stages: a well-handled return often produces stronger advocacy than a problem-free purchase.

### User Has Rich Data but Needs Help Interpreting It
When a user provides raw data -- NPS scores by cohort, support ticket tags, session recordings, or churn survey results -- the primary task is synthesis and translation before mapping. Cluster support tickets into the journey stage they represent: tickets about "how do I set up X" are Onboarding stage, tickets about "I can't find Y feature" are Adoption stage, tickets about billing confusion are Renewal stage. Cross-reference NPS scores by customer tenure to identify which journey period produces the steepest satisfaction drop. Use session recording data to identify specific UX friction points in the Decision and Onboarding stages. Once interpreted, map the synthesized insights into the appropriate stage dimensions with explicit citations: "Based on analysis of 340 support tickets tagged 'setup,' 67% occur within the first 72 hours -- classified as Onboarding stage pain point."

### SaaS With Product-Led Growth (PLG) Model
In a PLG model, the product itself is the primary acquisition, activation, and expansion channel -- there is no traditional sales-assisted journey for the majority of customers. This changes the journey architecture significantly. Awareness comes through word-of-mouth, app stores, or integration marketplaces rather than marketing campaigns. The Consideration and Decision stages collapse because users self-serve into a trial without speaking to sales. Freemium-to-paid conversion depends entirely on the product experience. Map the "freemium ceiling" as a distinct critical moment: the point where a free user hits a usage limit or encounters a paywalled feature they want. The experience at this exact moment (how the paywall is presented, what upgrade path is shown, how friction-free the upgrade process is) is the highest-leverage intervention point in the entire PLG journey. Map it with sub-stage detail.

---

## Example

**User Input:** "Map the customer journey for our SaaS project management tool. Our target user is a marketing manager at a 50-person B2B company. Our two biggest problems are low trial-to-paid conversion (currently 8%, industry average is 15-20%) and high churn at the 90-day mark. We have some Google Analytics data and our NPS is 32 at 60 days."

---

## Customer Journey Map: Project Management SaaS

**Persona:** Alex Chen -- Marketing Manager at a 50-person B2B SaaS company
**Business Model:** B2B SaaS, free trial (14-day) to paid subscription
**Journey Scope:** Full journey -- Awareness through Advocacy
**Perspective:** As-Is (with Target State for priority improvement stages)
**Date:** [Current date]
**Data Confidence:** Awareness (Hypothesis), Consideration (Partial), Decision (Partial), Onboarding (Validated -- GA data), Retention (Partial -- NPS 32 at 60 days), Advocacy (Hypothesis)

---

### Journey Overview (Emotion Curve Summary)

| Stage | Customer Goal | Key Touchpoints | Dominant Emotion | Satisfaction (1-10) | Confidence |
|-------|--------------|-----------------|-----------------|---------------------|------------|
| Awareness | Find a tool that fixes team chaos | Google search, peer Slack groups, G2 reviews | Frustrated (with current state) | 4/10 | Hypothesis |
| Consideration | Evaluate if this tool fits our team | Website, comparison pages, G2 profile, demo video | Skeptical but curious | 6/10 | Partial |
| Decision | Start a trial with minimal commitment | Trial signup page, onboarding email | Cautiously hopeful | 7/10 | Partial |
| Onboarding | Set up a project and see value quickly | In-app setup wizard, help center, day-1 email | Overwhelmed, then anxious | 4/10 | Validated |
| Retention | Build the tool into our team's workflow | Product (daily), in-app notifications, CS email | Uncertain, inconsistent | 5/10 | Partial |
| Advocacy | Get recognized as someone who improved the team | LinkedIn, word-of-mouth, G2 review request | Disconnected -- no channel offered | 3/10 | Hypothesis |

**Emotional Arc:** The journey follows a classic "valley of despair" pattern. Emotions start moderately low (4/10) driven by frustration with the status quo, rise slightly through consideration and signup (6-7/10) as the tool appears promising, then drop sharply at onboarding (4/10) as complexity overwhelms Alex before she has experienced tangible value. The 8% trial-to-paid conversion rate directly reflects this valley -- most users who do not convert never reach the point where the tool becomes easier than the learning curve. NPS of 32 at 60 days indicates that those who do convert are still not reliably delighted -- satisfaction has recovered somewhat (estimated 5/10) but has not reached the level that generates advocacy. No structured advocacy stage exists at all. Primary intervention window: days 0-14 post-trial-signup.

---

### Stage 1: Awareness
**Confidence Level:** Hypothesis
**Customer Goal:** "I need to stop managing campaigns across five spreadsheets and three Slack channels -- there has to be a better way."

| Dimension | Detail |
|-----------|--------|
| Touchpoints | Company-owned: blog, SEO landing pages. Third-party: G2, Capterra, SoftwareAdvice, Product Hunt. Peer: Marketing-focused Slack communities (#tools channel), LinkedIn posts from peers. |
| Customer Actions | Searches "marketing team project management tool," reads 3-4 G2 reviews, clicks a LinkedIn post from a peer mentioning the tool, scans the homepage for 15-30 seconds |
| Customer Thoughts | "Is this built for marketing teams or just software teams?" "Does it integrate with our existing stack (HubSpot, Slack, Google Workspace)?" "What does a team our size actually pay?" |
| Dominant Emotion | Frustrated with current situation; slightly skeptical about whether any tool will actually fix the problem versus creating new process overhead |
| Information Needed | Social proof from similar-sized marketing teams (not generic testimonials), clear differentiation from generic project management tools, ballpark pricing transparency |

**Pain Points:**
- G2 profile has generic testimonials from "enterprise" and "tech companies" -- Alex, who manages a 12-person marketing team, cannot identify with any reviewer's situation
- Homepage hero copy ("The platform for modern teams") does not address the specific chaos of multi-campaign management that Alex is experiencing

**Opportunities:**
- Add a segment selector on the homepage ("I manage a marketing team / I run a software team / I lead a services firm") to route Alex to persona-specific messaging and case studies immediately
- Seed G2 with 10 reviews from marketing managers at 20-100 person companies specifically, using targeted customer ask campaigns

**Moment of Truth at This Stage:** ZMOT -- The G2 review page is where Alex builds her first impression before ever visiting the website. If the average rating is below 4.2 stars or reviews look generic, she will not click through.

**Research Needed:** Conduct 5 customer interviews with trial users who came from organic search to understand what search terms they used and what they were hoping to find when they landed. Current mapping is hypothesis-based.

---

### Stage 2: Consideration
**Confidence Level:** Partial (website analytics available; no direct customer interview data)
**Customer Goal:** "I want to understand if this is meaningfully better than Asana or Monday, and whether my team will actually use it."

| Dimension | Detail |
|-----------|--------|
| Touchpoints | Company-owned: Features page, pricing page, comparison pages (vs. Asana, vs. Monday), demo video, case studies. Third-party: YouTube reviews, G2 comparison grid. Sales-assisted (if applicable): live demo request. |
| Customer Actions | Visits pricing page (average 2.3 times before converting per GA data), watches demo video to 65% completion, looks for "team size" pricing tier that matches her 12-person team, searches for HubSpot integration confirmation |
| Customer Thoughts | "The features look good but so does every tool's demo." "Can I actually get my team to adopt this -- we tried Asana and it died in 3 weeks." "Is there a free plan or do I commit with a credit card?" "What does 'per seat' pricing add up to for my team?" |
| Dominant Emotion | Skeptical -- has likely evaluated and abandoned a tool before. Wants evidence of adoption success with similar teams, not just feature coverage. |
| Information Needed | A "teams like yours" case study with specific before/after metrics (time saved, project completion rate, adoption rate). A team-size-specific pricing calculator. Clear integration list. Friction-free trial access. |

**Pain Points:**
- Pricing page shows per-seat costs but does not show what a 12-seat team pays annually -- Alex has to do math, and she does not. This is the number one reason qualified prospects leave the pricing page without converting per similar SaaS benchmarks.
- The demo video is a general product walkthrough, not a marketing-use-case scenario. Alex watches a software engineer running a sprint and mentally disqualifies the tool as "not for us."

**Opportunities:**
- Add a pricing calculator ("I have [__] team members" = "Your team pays $X/month") directly on the pricing page. A/B test shows this change consistently lifts trial sign-up rates by 15-25% in comparable SaaS tools.
- Create a 3-minute demo video for the specific "marketing campaign management" use case showing campaign briefs, content calendar view, and deadline tracking -- not sprint boards.

**Moment of Truth at This Stage:** FMOT -- The pricing page is the highest-intent moment in Consideration. GA data showing 2.3 average visits suggests Alex returns because she is interested but did not get clear enough answers the first time. Each return visit that ends without conversion is a risk of competitor capture.

---

### Stage 3: Decision (Trial Signup)
**Confidence Level:** Partial
**Customer Goal:** "I want to start a trial with no risk and understand exactly what I am signing up for."

| Dimension | Detail |
|-----------|--------|
| Touchpoints | Trial signup page, email confirmation, first onboarding email (triggered immediately post-signup) |
| Customer Actions | Completes signup form, confirms email, lands in the product for the first time |
| Customer Thoughts | "Do I need to enter a credit card?" "How long is the trial -- 14 days feels short." "Will I actually have time to evaluate this properly this week?" |
| Dominant Emotion | Cautiously hopeful but already managing time anxiety -- Alex knows she will not have 10 hours to evaluate software this week |
| Information Needed | Clear confirmation of: no credit card required (if true), trial length, what happens at trial end, and -- critically -- what she should do first to get value in her first session |

**Pain Points:**
- Current first onboarding email is generic ("Welcome to [Product]! Here's what you can do...") with six different feature callouts and no single recommended first action. Alex does not know where to start.
- The trial is 14 days but Alex's working pattern means she may open the product seriously only 3-4 times in that window. 14 days of calendar time is not 14 days of evaluation time.

**Opportunities:**
- Redesign welcome email to a single-CTA format: "Your one task for today: Create your first marketing campaign in 5 minutes. [Start here]." Remove all secondary feature promotions from email 1.
- Add a trial extension offer (3 extra days, no credit card, triggered at day 10 if the user has not completed first project setup) to convert time-anxious evaluators.

---

### Stage 4: Onboarding / Activation
**Confidence Level:** Validated (Google Analytics data on in-app behavior; this is the primary problem stage)
**Customer Goal:** "I need to set up one real project, get a win, and see that my team could actually use this."

| Dimension | Detail |
|-----------|--------|
| Touchpoints | In-app setup wizard, help center (high traffic in first 72 hours -- indicates confusion, not curiosity), days 1-7 email sequence, in-app tooltips, Intercom chat |
| Customer Actions | Begins project setup, hits the 15-field configuration screen, abandons setup, browses features aimlessly, may open a help article, returns the next day but does not complete setup |
| Customer Thoughts | "Why are there so many fields just to start a project?" "I just want a simple board with my campaign names and deadlines." "I don't know what 'workflow stage automation' means and I don't care right now." |
| Dominant Emotion | Overwhelmed in minutes 5-30. Anxiety by day 3 if no project is set up. Silent abandonment rather than complaint -- Alex does not reach out to support, she simply stops logging in. |
| Information Needed | A pre-built "Marketing Campaign Tracker" template with 3 fields to customize (campaign name, owner, deadline). A guided "day 1 success path" with a single visible goal. A 5-minute video of a real marketing team's board. |

**Pain Points:**
- The setup wizard requires 15+ configuration decisions before a user can create a single task. Time-to-first-value is currently estimated at 45-90 minutes of focused effort -- 3 to 5 times the threshold at which SaaS trial abandonment becomes likely.
- Help center visits spike at 70% of trial users in first 72 hours but chat support is not proactively offered until day 5. By then, most who needed help have already abandoned.
- No email or in-app message specifically addresses the common objection: "I tried Asana before and my team never adopted it." This concern is active in Alex's mind but the onboarding flow does not acknowledge or counter it.

**Opportunities:**
- **Priority 1:** Add a "Marketing Team" template as a one-click option on first login. Template should contain 5 pre-populated campaigns with sample tasks and an invitation prompt. This directly reduces time-to-first-value from 60 minutes to under 10 minutes.
- **Priority 1:** Trigger a proactive Intercom message at the 15-minute mark if setup wizard has not been completed: "Setting up your first project? I can do it with you in 5 minutes." This addresses abandonment at the highest-risk moment without waiting for day 5.
- **Priority 2:** Create a 7-day onboarding email sequence with one specific, small action per email: Day 1 (set up campaign board), Day 2 (invite one teammate), Day 3 (add first task with due date), Day 5 (use the calendar view), Day 7 (check your team's progress). Each email contains only one CTA.

**Moment of Truth at This Stage:** SMOT -- The first 30 minutes of the first product session is the single highest-leverage moment in the entire journey. GA data showing 8% trial-to-paid conversion against an industry average of 15-20% points directly at SMOT failure. Current experience: complex, intimidating, no guided path to value. Target experience: template-driven, guided, first project live in under 10 minutes.

---

### Stage 5: Retention / Loyalty
**Confidence Level:** Partial (NPS 32 at 60 days; churn timing at 90 days known; root cause not validated)
**Customer Goal:** "I need this tool to become how my team actually works -- not something I have to nag them to open."

| Dimension | Detail |
|-----------|--------|
| Touchpoints | Product (daily for power users, weekly for light users), in-app notifications, CS outreach (currently minimal), monthly summary email if configured, Slack integration notifications |
| Customer Actions | Uses the tool for 2-3 active campaigns, discovers the tool lacks a feature she assumed existed (e.g., custom field reporting), begins to feel the product is "almost good enough" but not fully solving the problem |
| Customer Thoughts | "My team is using it but not consistently." "I'm paying for seats but two of my team members haven't logged in in 2 weeks." "I wish I could run reports by campaign owner -- we have to export to Excel for that." |
| Dominant Emotion | Uncertain -- the tool is better than before but the promised transformation has not materialized. NPS of 32 reflects a "passive" base: people who will not churn immediately but will not advocate either. |
| Information Needed | Evidence that the tool is working (usage stats, tasks completed, on-time delivery rate). Proactive guidance on underused features that match her workflow. A clear path to resolving the specific limitation she hit. |

**Pain Points:**
- No proactive CS outreach or health check occurs before day 90. By the time churn happens, the customer has been silently disengaged for 3-6 weeks and no intervention has occurred.
- The product does not surface usage data to Alex: she cannot see that 8 of her 12 teammates logged in this week or that 47 tasks were completed. This data exists in the system but is not visible to the team manager, preventing the "proof of progress" moment.
- When Alex hits the reporting limitation, there is no in-product path to a feature request, an explanation of the roadmap, or a workaround. She experiences the limitation as a dead end.

**Opportunities:**
- **Priority 2:** Implement a "team progress digest" -- a weekly or biweekly email to the account admin showing team login rate, tasks completed, and campaigns active. This surfaces the value the product is already delivering, which Alex is not currently seeing.
- **Priority 1:** Build a day 60 health check into the CS workflow. Trigger an email at day 60 (not day 90) with a usage summary and an invitation to a 20-minute check-in call. The goal is to identify dissatisfaction 30 days before churn happens, not at the cancellation event.
- **Priority 3:** Add an in-app "suggest a feature" button on any screen where a user attempts an action the product does not support. Connect submissions to a public roadmap board so Alex can see her request and its status.

---

### Stage 6: Advocacy
**Confidence Level:** Hypothesis
**Customer Goal:** "I want to be seen as the person who brought in the tool that changed how our marketing team operates."

| Dimension | Detail |
|-----------|--------|
| Touchpoints | G2 review request email, referral program (if it exists), LinkedIn sharing, peer Slack community posts |
| Customer Actions | Currently: nothing -- no structured advocacy activation exists. Potential: leaves G2 review when prompted, mentions the tool to a peer in a Slack community, shares a "how we run our marketing team" LinkedIn post |
| Customer Thoughts | "I'd recommend this but nobody has asked me to." "I don't want to recommend it until I'm sure my whole team is using it consistently." "If there was a referral bonus, I'd mention it to my network." |
| Dominant Emotion | Disconnected -- the product has delivered some value but no channel exists for Alex to express it or be recognized for championing the tool internally and externally |
| Information Needed | A frictionless review request (1-click to G2) timed to a positive moment (after a successful campaign delivery, not randomly). A referral program with a meaningful incentive for both referrer and new customer. An optional "share your setup" LinkedIn template. |

**Pain Points:**
- G2 review requests are currently sent at a fixed interval (day 30) regardless of product usage level. A user who has not yet activated fully at day 30 receiving a review request is at best ignored, at worst asked to report a bad experience.
- No referral program exists. Word-of-mouth is the primary acquisition channel for SMB SaaS but it is happening by accident, not by design.

**Opportunities:**
- **Priority 2:** Implement trigger-based G2 review requests: fire the request only after Alex has completed at least 3 projects and has logged in within the last 7 days. This ensures the reviewer has enough experience to write a meaningful review and is in a positive engagement state.
- **Priority 2:** Build a simple referral program offering one month free for both referrer and new customer, with a shareable link available in the product's account settings page and triggered by a "How are you liking [Product]?" prompt at day 75.

---

### Moments of Truth Analysis

| Moment | Type | Stage | Emotional Intensity (1-5) | Decision Leverage (1-5) | Current Experience | Target Experience |
|--------|------|-------|--------------------------|------------------------|-------------------|-------------------|
| G2 first impression | ZMOT | Awareness | 3 | 5 | Generic reviews from enterprise companies; no marketing-team social proof | 10+ reviews from marketing managers at 20-100 person companies with specific metrics |
| Pricing page visit | FMOT | Consideration | 3 | 5 | Per-seat pricing shown; no team-size total cost; math required | Interactive calculator: "My team has [12] people = $[X]/month" visible immediately |
| First 30 minutes in product | SMOT | Onboarding | 5 | 5 | 15-field setup wizard with no template; time-to-first-
