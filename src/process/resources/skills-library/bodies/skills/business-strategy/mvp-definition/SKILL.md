---
name: mvp-definition
description: |
  Defines a minimum viable product with problem statement, core functionality scope, explicit exclusions, success metrics, and validation approach using MVP methodology. Use when the user asks about MVP definition, minimum viable product, scoping an MVP, what to build first, or lean product development.
  Do NOT use for idea validation experiments (use idea-validation), Lean Canvas creation (use lean-canvas), or feature specification (use feature-spec).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "entrepreneurship planning strategy agile decision-making"
  category: "business-strategy"
  subcategory: "entrepreneurship"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# MVP Definition

## When to Use

**Use this skill when:**
- User asks to define, scope, or scope-cut an MVP for a product they are planning to build or have partially built
- User is deciding what to include in a first public launch, private beta, or pilot and needs a principled framework to draw the line
- User wants to apply lean product development principles to avoid building months of features that the market does not want
- User asks "what should I build first," "what is the minimum I need to launch," or "how do I scope my V1"
- User is experiencing scope creep on a product in development and needs to recover a clear minimum scope
- User needs to align a cross-functional team (engineering, design, product, sales) around a single constrained scope for an initial release
- User is preparing a pitch or funding conversation and needs to articulate what they will build and why it is the right starting point
- User needs to choose between multiple potential MVP scopes and evaluate which tests the most critical assumption at the lowest cost

**Do NOT use this skill when:**
- The user has not yet validated whether the problem is real -- run `idea-validation` first to determine whether an MVP is worth building
- The user needs a Lean Canvas, business model overview, or go-to-market strategy -- use `lean-canvas`
- The user wants detailed feature specifications with acceptance criteria, edge cases, and UX requirements -- use `feature-spec`
- The user wants to write user stories, epics, or a product backlog from an existing MVP scope -- use `user-story-writing`
- The user is iterating on a product that already has paying users -- this skill is for the initial MVP, not subsequent releases
- The user is asking about A/B testing, feature flags, or growth experimentation on a live product -- those are post-MVP concerns

---

## Process

### Step 1: Surface the Core Hypothesis and Risk Landscape

Before scoping a single feature, establish what unknown the MVP is designed to resolve. An MVP is not a small product -- it is a structured experiment with a falsifiable hypothesis. If the hypothesis is vague, the MVP scope will be random.

- Frame the hypothesis in the Eric Ries format: "We believe [target user] will [do specific behavior] because [reason]." Every word matters. "Users" is not the same as "B2B procurement managers at companies with 50-200 employees." "Use it" is not the same as "create 3+ reports per week."
- Identify the single riskiest assumption. Common risk types: (a) desirability risk -- do users want this at all, (b) usability risk -- can users understand and operate it, (c) viability risk -- will users pay for it, (d) feasibility risk -- can it be built reliably. The MVP must target the highest-risk assumption, not the most technically exciting feature.
- Ask: "If I build this and it fails, what will I learn?" A good MVP has a falsifiable outcome. If failure teaches you nothing, the scope is wrong.
- Ask: "What is the minimum behavior change required from the user that proves the hypothesis?" This defines the primary success metric before a single line of code is written.
- Distinguish between riskiest assumptions and dependent assumptions. You cannot test willingness-to-pay before you have tested desirability. Sequence matters: test desirability first, then usability, then viability.

---

### Step 2: Define the Target User with Specificity

The MVP serves one user type -- the early adopter -- not the eventual target market. These are different people with different needs and different tolerance for product immaturity.

- Identify the early adopter profile: the user who has the problem so acutely that they are already cobbling together a workaround, will tolerate rough edges, and will give honest feedback in exchange for a solution.
- Segment by behavioral urgency, not demographics. "Freelance designers aged 25-35" is demographic. "Freelance designers who are currently spending 3+ hours per week manually formatting client proposals in Google Slides" is behavioral and indicates acute pain.
- Validate that this early adopter segment is reachable. Where do they congregate? If you cannot reach 50-100 of them to invite to the beta, the user definition is wrong.
- Define one primary persona for the MVP. Multiple personas guarantee scope bloat. The MVP answers: "What does Person X need to succeed?" not "What does every type of user need?"
- State explicitly who is NOT the user for this MVP. This is as important as stating who IS. "Not for enterprise teams, not for agencies, not for users who need offline access."

---

### Step 3: Map the Critical Path -- The Sequence That Delivers Value

The critical path is the minimum sequence of steps a user must take to experience the core value proposition. Every feature in the MVP must appear on this path. Features not on the path are excluded by definition.

- Walk through the user journey from zero -- before they even know your product exists -- to the moment they receive value. Map each step literally: land on the page, read the description, click sign up, enter email, confirm email, complete onboarding, input their first data, see the output, return to use it again.
- Identify value receipt: the specific moment the user gets what they came for. This is your "aha moment" or activation event. Everything in the MVP exists to get the user to this moment.
- Identify each step that can block the user from reaching value. These are required. Every other step is optional for the MVP.
- Apply the "Wizard of Oz" test to non-critical steps: can a human operator perform this function invisibly to the user? If yes, the feature can be manual in the MVP. Classic examples: a person manually triggering "AI recommendations" via a spreadsheet and email, or a founder manually matching supply-demand in a marketplace before building the matching algorithm.
- Apply the "Concierge" test to entire workflows: can the MVP deliver the entire experience manually with the founder acting as the product? Concierge MVPs (like Airbnb's founders photographing apartments themselves) are valid and often faster than any technical build.

---

### Step 4: Scope the IN Set -- Core Functionality

With the critical path defined, translate path steps into features. Apply brutal pruning.

- List only features that are required for the critical path. For each proposed feature, ask: "Can the user receive the core value without this feature?" If yes, the feature is out.
- Apply the Simplest Version constraint: for every feature that is in scope, define the simplest technically functional implementation. A blog post generator does not need six templates in the MVP -- it needs one. A dashboard does not need sorting and filtering -- it needs a flat list. Write down the simplest version explicitly so engineers do not gold-plate.
- Limit core feature count. An MVP with more than 5 features is not an MVP -- it is a V1. Target 3-4 features. The number of features is a forcing function for clarity.
- Separate "required for launch" from "required for value." Authentication, email verification, and payment integration may be required for launch without being core to the value proposition. Count these as infrastructure, not features.
- Apply the "manual until it hurts" principle systematically. Notifications? Send emails manually. Reports? Export CSV and format in Google Sheets. Integrations? Zapier webhook. Admin dashboard? Airtable or a spreadsheet the founder updates manually. The rule: if the cost of the manual process in founder-hours per week is less than the cost of building the automated version, do it manually.

---

### Step 5: Define the OUT Set -- Explicit Exclusions with Rationale

The exclusion list is as important as the inclusion list. Undocumented exclusions become "I thought we were building that" arguments that derail sprints.

- Collect every feature request, product idea, and "wouldn't it be cool" from all stakeholders. Write them all down. Then categorize each as: Phase 2 (after validation), Phase 3 (after growth), or Never (outside product scope).
- Assign explicit reasons to each exclusion. Acceptable reasons: "tests a different hypothesis," "requires scale to be valuable," "adds complexity without adding validation signal," "targets a secondary user type," "regulatory complexity exceeds MVP timeline budget."
- Common exclusion categories for most MVPs:
  - **Team/collaboration features** -- The MVP validates solo use first. Multi-user workflows require validated solo users to justify the added complexity.
  - **Admin and ops tooling** -- Internal dashboards, bulk user management, and support tooling are Phase 2. Founders operate these manually in Phase 1.
  - **Third-party integrations** -- API integrations with Salesforce, HubSpot, Slack, etc. add weeks of scope. CSV import/export covers 80% of the use case for MVP.
  - **Analytics and reporting** -- The product analytics for the founder (not in-product analytics for users) can use Mixpanel or PostHog from day one. In-product reporting for users is Phase 2.
  - **Mobile applications** -- Unless the core value proposition is inherently mobile (location, camera, push notifications), a responsive web app covers the MVP.
  - **Multi-language, accessibility, internationalization** -- Unless the target market requires it, these are post-validation.
- Document the exclusion list in the output and share it with the team before sprint planning begins. "Out of scope" decisions made in a document survive better than verbal agreements.

---

### Step 6: Define the Primary Success Metric and Decision Gate

An MVP without a pre-defined success metric produces ambiguous results. The team needs to know, before they build, what "the test passed" looks like.

- Choose ONE primary metric that most directly proves or disproves the hypothesis. Common primary metrics by hypothesis type:
  - **Desirability hypothesis** -- activation rate (percentage of new users who complete the critical path at least once), target: >40%
  - **Retention/engagement hypothesis** -- Day 7 or Day 30 retention, target: >20% D30 for consumer, >40% D30 for B2B tools (these are reference benchmarks; set the specific target based on comparable products)
  - **Willingness-to-pay hypothesis** -- conversion rate from free to paid, target: >2% for self-serve B2C, >5% for B2B PLG, >15% for sales-assisted B2B
  - **Virality hypothesis** -- viral coefficient (K-factor), target: K > 0.3 for meaningful organic growth
  - **Problem-frequency hypothesis** -- weekly active users divided by monthly active users (WAU/MAU stickiness ratio), target: >0.4 for daily-use tools
- Define secondary metrics (2 max) that provide context without replacing the primary. If the primary metric is activation rate, a secondary metric might be time-to-activation (how long does the critical path take) and qualitative NPS from the first 20 users.
- Define guardrail metrics: thresholds that must not be violated even if the primary metric is green. Examples: churn rate above 60% in first 30 days invalidates a strong activation metric; support ticket volume above 1 ticket per 3 users indicates a usability problem that corrupts the signal.
- Set the evaluation timeline. For most MVPs: launch to a controlled beta (20-50 users), run for 4-6 weeks, evaluate at the 4-week mark with enough behavioral data to make a decision.
- Define the decision gate explicitly with three outcomes:
  - **Proceed to Phase 2** (if primary metric is at or above target)
  - **Pivot** (if primary metric is below target but qualitative data reveals a different valuable direction)
  - **Kill** (if primary metric is below target and no clear pivot hypothesis emerges from user research)
  Setting this in advance removes the temptation to rationalize weak results.

---

### Step 7: Construct the Build Plan and Apply the 6-Week Rule

The build plan converts the MVP scope into a timeline and exposes scope problems before a line of code is written.

- Estimate each feature in days, not weeks. Break features down to the level where individual components are visible (auth system: 2 days; core generation logic: 3 days; editor UI: 2 days; export: 1 day). Aggregate estimates expose whether the scope is achievable.
- Apply the **6-week rule**: an MVP should be buildable and launchable in 6 weeks or fewer by the available team. Research from serial entrepreneurs and accelerator programs (YC, Techstars) consistently shows that MVPs taking longer than 8 weeks suffer from: (a) market shifts during build, (b) team motivation collapse, (c) scope creep from the additional time, and (d) a psychological commitment effect that makes pivoting harder after months of effort. The 6-week ceiling is a hard forcing function.
- If the estimate exceeds 6 weeks: cut the lowest-ranked feature, re-estimate, repeat until it fits. Do not extend the timeline -- cut the scope.
- Evaluate no-code and low-code tools for infrastructure components that do not differentiate the product: authentication (Clerk, Auth0), payments (Stripe Checkout), forms (Typeform), internal ops (Airtable, Notion), email (Resend, Postmark). These can each save 2-5 days of build time.
- Assign the build plan to named owners. "Engineering" is not an owner. "Maya" is an owner. Diffuse ownership is the most common reason MVP timelines slip.
- Set a fixed launch date, not a "when it is ready" date. A fixed date forces scope decisions. "Ready" dates expand to fill all available time (Hofstadter's Law applied to product development).

---

### Step 8: Document and Communicate the MVP Definition

An MVP definition that exists only in the founder's head is not a definition -- it is a feeling. The document must be created, shared, and used as a decision-making reference.

- Write the MVP definition in a single document (not a deck, not a Jira epic, not a Slack message) that all stakeholders can access and reference throughout the build.
- Use the output format below as the document structure. The table-based format makes scope debates faster: you can point to a row rather than debate in the abstract.
- Review the document at the start of each sprint. Ask: "Did we build anything this week that is not on the critical path?" If yes, identify why and whether the scope definition needs updating.
- When a stakeholder requests a new feature during the build, the answer is always "let's look at the MVP definition together." If the feature is not on the critical path and does not address the primary success metric, it goes on the exclusion list.
- Treat the MVP definition as a living document through the build phase but freeze it 1 week before launch. No scope additions in the final week.

---

## Output Format

```
## MVP Definition: [Product Name]

**Version:** 1.0 | **Date:** [Date] | **Decision Point:** [Date, typically 4-6 weeks post-launch]

---

### Primary Hypothesis

**We believe** [specific target user with behavioral context, not demographic]
**will** [specific measurable behavior]
**because** [core value proposition -- the reason the behavior will occur]
**We will know this is validated when** [primary metric] reaches [specific numeric target] within [X weeks of launch].

**Riskiest assumption being tested:** [The one thing that, if false, kills the product]

---

### Target User

| Field | Detail |
|---|---|
| **Segment** | [Specific user segment defined by behavior, not demographics] |
| **Early adopter profile** | [The most desperate subset -- what workaround are they using today?] |
| **Current workaround** | [What tool or manual process solves this for them today, imperfectly] |
| **Core pain** | [The specific friction or cost the MVP removes] |
| **Out of scope users** | [Who is explicitly NOT served by this MVP] |

---

### Core Functionality (IN Scope)

| # | Feature | Why On Critical Path | Simplest Viable Version | Build Estimate |
|---|---|---|---|---|
| 1 | [Feature name] | [Specific reason this is required for value delivery] | [The stripped-down implementation that works] | [X days] |
| 2 | [Feature name] | [Specific reason this is required for value delivery] | [The stripped-down implementation that works] | [X days] |
| 3 | [Feature name] | [Specific reason this is required for value delivery] | [The stripped-down implementation that works] | [X days] |
| 4 | [Feature name] | [Specific reason this is required for value delivery] | [The stripped-down implementation that works] | [X days] |
| — | **Infrastructure** | Required for launch (not product features) | Auth + email + payments if applicable | [X days] |

**Manual processes replacing build (Wizard of Oz / Concierge):**
- [Process 1]: [What the user sees vs. what the founder does manually]
- [Process 2]: [What the user sees vs. what the founder does manually]

---

### Critical User Journey

| Step | Action | What Makes This Possible | Can It Be Manual? |
|---|---|---|---|
| 1 | [User arrives / discovers] | [Channel or trigger] | N/A |
| 2 | [User signs up or enters] | [Feature or landing page] | [Yes/No] |
| 3 | [User provides input or setup] | [Onboarding or configuration] | [Yes/No] |
| 4 | **[User receives core value]** | [Core feature -- the aha moment] | [Yes/No] |
| 5 | [User saves, exports, or acts on output] | [Export or action feature] | [Yes/No] |
| 6 | [User returns] | [Retention trigger -- notification, habit, cron job] | [Yes/No] |

---

### Out of Scope (Explicit Exclusions)

| Feature | Deferred Phase | Reason for Exclusion | Who Requested It |
|---|---|---|---|
| [Feature] | Phase 2 | [Tests a different hypothesis / not on critical path / adds weeks of scope] | [Stakeholder] |
| [Feature] | Phase 2 | [Reason] | [Stakeholder] |
| [Feature] | Phase 3 | [Reason] | [Stakeholder] |
| [Feature] | Phase 3 | [Reason] | [Stakeholder] |
| [Feature] | Never | [Outside product scope boundary] | [Stakeholder] |

---

### Success Metrics

| Type | Metric | Target | Timeline | Measurement Method |
|---|---|---|---|---|
| **Primary** | [Single most important metric] | [Specific number] | [X weeks post-launch] | [Tool and method] |
| **Secondary** | [Supporting metric] | [Specific number] | [X weeks] | [Tool and method] |
| **Secondary** | [Supporting metric] | [Specific number] | [X weeks] | [Tool and method] |
| **Guardrail** | [Must-not-exceed threshold] | [Ceiling value] | Ongoing | [Tool and method] |

---

### Build Plan

| Component | Owner | Estimate | Dependencies |
|---|---|---|---|
| [Component 1] | [Named person] | [X days] | [None / Component N] |
| [Component 2] | [Named person] | [X days] | [Component 1] |
| [Component 3] | [Named person] | [X days] | [None] |
| Infrastructure | [Named person] | [X days] | [None] |
| QA / bug fix buffer | [Named person] | [3 days minimum] | All components |
| **Total** | | **[X weeks]** | |

**Launch date:** [Fixed date]
**Beta cohort size:** [20-50 users recommended for first evaluation]
**Evaluation date:** [Fixed date, 4-6 weeks post-launch]

---

### Decision Gate

| Outcome | Condition | Action |
|---|---|---|
| **Proceed to Phase 2** | Primary metric ≥ [target] | Begin Phase 2 scoping using this framework |
| **Pivot** | Primary metric < [target] AND qualitative interviews reveal alternate direction | Define new hypothesis, scope new MVP |
| **Kill** | Primary metric < [target] AND no clear alternate hypothesis | Sunset the product, document learnings |

---

### Open Questions

List any unresolved questions that could affect scope, sequencing, or success metric definition:
1. [Question 1]
2. [Question 2]
```

---

## Rules

1. **The hypothesis must be falsifiable before a single feature is chosen.** If you cannot write a specific metric and target that would prove the hypothesis false, the hypothesis is not tight enough. Rewrite the hypothesis until it is falsifiable. Scope flows from hypothesis -- if the hypothesis is vague, the scope will be vague.

2. **The primary success metric must be behavioral, not attitudinal.** "Users said they liked it" (NPS, survey ratings) is not a success metric for an MVP. Behavior -- returning, paying, referring, repeating the core action -- is the only valid signal. Users lie in surveys. They do not lie with their behavior.

3. **"Minimum viable" means minimum scope, not minimum quality on the critical path.** The features IN the MVP must work reliably and feel credible. A broken core experience invalidates the test entirely -- users cannot tell whether they rejected the concept or the execution. Invest 100% of the quality budget into the 3-4 MVP features. Defer everything else, but make the included features excellent.

4. **Every feature in the MVP must map directly to the critical user journey.** If you cannot point to the specific step in the critical path that a feature enables, the feature is not in the MVP. No exceptions. This is the single most effective scope reduction rule.

5. **The 6-week ceiling is a hard constraint, not a guideline.** If the honest build estimate exceeds 6 weeks for the available team, cut features until it fits. Do not adjust the timeline upward -- adjust the scope downward. An MVP that takes 4 months to build is a V1 with a branding problem and a team that will resist pivoting after so much investment.

6. **The exclusion list must be documented and dated.** Verbal scope exclusions do not survive the first sprint. Write them down with reasons. When a stakeholder asks "why aren't we building X?" the answer is a row in the exclusion table, not a memory of a conversation.

7. **Manual processes are first-class MVP features.** "Build an algorithm" and "founder does it manually for the first 30 users" are both valid implementations of a feature. The test is whether users experience the value -- not how the value was produced. Prioritize Wizard of Oz and Concierge implementations aggressively. They generate learning while preserving time to build the right automated version.

8. **Design for the early adopter's pain tolerance, not the mass market's polish expectations.** The early adopter will tolerate a plain UI, a CSV export instead of a dashboard, and a manual onboarding call. The mass market will not. This asymmetry is a strategic asset -- you can reach the early adopter faster and cheaper. Do not gold-plate the MVP to appeal to users who are not your audience yet.

9. **Set the decision gate before the MVP launches.** The evaluation criteria (proceed / pivot / kill and the specific metric thresholds) must be written down and agreed upon before the launch date. Post-hoc rationalization of weak results is the leading cause of zombie products -- products that neither succeed nor get killed.

10. **A marketplace, platform, or network-effect product must test one side of the network first.** Attempting to simultaneously acquire supply and demand in a two-sided market doubles the scope and introduces the chicken-and-egg problem as a variable. The MVP must test supply or demand independently. Define which side the MVP validates and scope accordingly.

11. **Regulatory or security requirements are scope-fixed, not scope-flexible.** If the product operates in healthcare (HIPAA), financial services (SOC 2, PCI-DSS), or handles children's data (COPPA), compliance features are in the MVP regardless of whether they are on the "critical path." List them as infrastructure requirements, not product features, but include them in the build estimate.

12. **The MVP scope must be agreed upon by engineering, design, and product before sprint planning begins.** A scope document that only product or the founder has read is not an agreed scope -- it is a wishlist. Require explicit acknowledgment from all build team members before locking scope.

---

## Edge Cases

### Early Adopters Are Unavailable for Feedback

Some products target users who are difficult to reach quickly (surgeons, CFOs at enterprise companies, government officials). If the beta cohort cannot be assembled within 2 weeks of launch, the MVP feedback loop breaks.

- Use a proxy user who has the same problem at lower status/scale. A billing manager at a 20-person company has structurally similar invoice management pain to a CFO at a 200-person company, and is far more accessible.
- Pre-recruit the beta cohort before the first line of code is written. If you cannot get 20 people to say "yes, send me early access," you cannot get 20 users to test the MVP. Recruiting failure is a signal about desirability, not logistics.
- Consider a high-touch concierge launch where the founder personally delivers the value to 5-10 users rather than relying on a self-serve product to generate behavior.

---

### B2B SaaS With Long Sales Cycles

In B2B, the buyer (who approves purchase) and the user (who uses the product daily) are often different people. The MVP must satisfy both, which can create conflicting scope requirements.

- Define the minimum scope for the economic buyer separately from the minimum scope for the end user. The economic buyer needs: security/compliance summary, pricing clarity, basic admin controls. The end user needs: the core workflow. Build for both, but keep both scopes minimal.
- Consider a "Land and Expand" MVP: sell to a single team or department (one buyer, small number of users) rather than attempting enterprise-wide deployment. This eliminates SSO, role-based access control, and bulk admin features from the MVP scope.
- Use a pilot agreement with one or two design partners to fund the MVP build. The design partner gets influence over scope in exchange for access and feedback. This converts the MVP from a build-and-hope exercise into a contracted validation with a paying customer.

---

### The Founder Wants to Build "The Full Vision" First

This is the most common failure mode. The founder argues that "users will only adopt it if it has features X, Y, and Z." This is almost always rationalization, not evidence.

- Ask: "Which users specifically will refuse to use the product if feature X is missing?" Push for a named user, not a hypothetical segment. If the founder cannot name a specific person, the argument is not evidence-based.
- Reframe the cost of delay: "If building features X, Y, and Z adds 12 weeks to the launch, and you discover in week 6 that users actually need a feature you did not build, you will have wasted 12 weeks. If you launch without them in 4 weeks and discover the same thing, you save 8 weeks."
- Use the "riskiest assumption" test: if the hypothesis is about whether users want the core value at all, then secondary features do not change the risk profile. If the hypothesis could be invalidated by the core feature alone, build the core feature alone.
- Present the three-outcome decision gate explicitly. The founder who wants to build everything is often avoiding the possibility of a "Kill" outcome. Normalizing the kill outcome as a successful learning reduces the psychological resistance to launching small.

---

### Hardware or Physical Product MVP

Physical prototypes are expensive to iterate, which inverts the usual lean product logic. The MVP cannot simply be "the simplest version we can build."

- Use a "Smoke Test" or "Fake Door" MVP first: a landing page, explainer video, or crowdfunding campaign (Kickstarter, Indiegogo) that describes the product and measures pre-order intent before any prototype is built. If fewer than 2-3% of targeted visitors convert to pre-orders, the demand signal is weak.
- Use a 3D-printed or modified off-the-shelf prototype for initial user testing. The goal is to test the behavioral hypothesis (will users change their routine to use this device?) not the manufacturing hypothesis (can we produce this at scale?).
- Separate the validation scope from the manufacturing scope explicitly. The MVP validates: desirability (do users want it?), usability (can users operate it?), and willingness-to-pay. The MVP does NOT validate: unit economics at scale, supply chain reliability, or regulatory certification. These are post-validation concerns.
- Use a Wizard of Oz implementation for complex hardware logic: simulate the device's outputs manually or via a laptop to test the user experience before the embedded hardware is built.

---

### Two-Sided Marketplace (Chicken-and-Egg)

Marketplaces require both supply and demand to deliver value, making it structurally impossible to build a "minimal" two-sided product. Every attempt to build both sides simultaneously produces a product that is too complex for an MVP timeline.

- Phase the MVP explicitly. Phase 1 validates one side only. The most common approach: manually curate and recruit the supply side (list the supply yourself, as Airbnb's founders did), then test the demand side experience. The supply side is a solved problem for the MVP; the demand side generates the behavioral data.
- Alternatively, build supply-side tools first. If the marketplace's key insight is a better tool for the supply side (better storefront, better inventory management, better scheduling), build that tool and acquire supply users. Demand follows supply if the supply is high-quality.
- Define "sufficient supply" numerically before the demand MVP launches. "Enough supply to give every demand-side user at least 3 relevant options" is a concrete threshold. Below this density, demand-side failure may reflect supply quality, not demand absence.
- The success metric for a marketplace MVP is typically: transaction completion rate on the demand side. Not traffic, not signups -- completed transactions. This proves both that demand users found what they needed and that supply users fulfilled the transaction.

---

### Regulated Product (Healthcare, FinTech, Legal)

Compliance requirements can make an MVP look substantially more complex than a comparable unregulated product. The risk is treating compliance as a reason to delay launch indefinitely.

- Audit the regulatory requirements early. For US healthcare: if the product does not store, process, or transmit Protected Health Information (PHI), HIPAA does not apply. Many "health" apps are not subject to HIPAA. Get a clear answer from a lawyer before assuming full compliance is required.
- Separate technical compliance (data encryption, access controls, audit logs) from product compliance (FDA clearance for medical devices, SEC registration for investment advisors). Technical compliance can usually be achieved within the MVP timeline with off-the-shelf infrastructure (SOC 2-compliant hosting, encrypted databases). Product compliance may require a separate regulatory pathway that operates in parallel with the MVP build.
- Use a "compliance-ready but not certified" MVP: build the infrastructure that supports certification (audit logs, access controls, encryption at rest and in transit) without pursuing formal certification until post-validation. This keeps the MVP timeline intact while reducing the re-work cost when certification is eventually required.
- Recruit design partners who are willing to pilot the product under a data processing agreement (DPA) before formal certification. Many healthcare IT buyers will pilot with a DPA in place even without full HIPAA certification, particularly if the pilot is limited in scope and data volume.

---

### API or Developer-Facing Product

Developer tools have a different definition of "viable" because the user is also the person evaluating technical quality and reliability. A buggy API that works 95% of the time is unusable -- 99.9% uptime is table stakes.

- For developer-facing MVPs, reliability is a feature, not a nice-to-have. The core API endpoints must work correctly 100% of the time in the MVP scope. This is non-negotiable. Scope the MVP to cover fewer endpoints, but make those endpoints production-grade.
- Define the MVP as a working integration path: "A developer can authenticate, call the core endpoint, receive a valid response, and handle errors correctly in under 30 minutes." Time-to-first-successful-API-call is the primary success metric for developer products.
- Documentation is in scope for a developer-facing MVP. A developer who cannot understand the API in 20 minutes will not continue. Minimal documentation -- one quickstart guide, one code example in the developer's primary language, one error reference -- is required for the MVP.
- Use a "DX audit" after the first 5 developers integrate: where did they get stuck, what did they Google, what error did they not understand? Fix these before scaling the beta.

---

## Example

**Input:**
"I'm building a tool for independent financial advisors (RIAs) to automatically generate personalized client portfolio review reports. Right now advisors spend 3-4 hours manually pulling data from custodians, formatting it in Word, and writing commentary for each quarterly review. I want to build something that automates this. What should the MVP be?"

---

**Output:**

## MVP Definition: AdvisorReport

**Version:** 1.0 | **Date:** [Today] | **Decision Point:** 6 weeks post-launch

---

### Primary Hypothesis

**We believe** independent RIA advisors managing 50-150 client households
**will** use AdvisorReport to generate at least 80% of their quarterly client review reports
**because** it reduces per-report preparation time from 3-4 hours to under 30 minutes by automating data aggregation and generating a structured first-draft narrative
**We will know this is validated when** at least 40% of beta advisors generate reports for 80%+ of their client base in the first full quarter of use (Q1 adoption rate ≥ 40%).

**Riskiest assumption being tested:** That advisors will trust and submit an AI-generated narrative draft to clients with light editing, rather than rewriting it from scratch -- which would eliminate the time savings entirely.

---

### Target User

| Field | Detail |
|---|---|
| **Segment** | Independent RIAs (registered investment advisors) operating solo or with 1-2 support staff, managing 50-150 household relationships |
| **Early adopter profile** | Advisors who are currently spending 2+ days per quarter manually producing quarterly review reports, have expressed frustration with the process in advisor forums (NAPFA, XY Planning Network), and are already attempting partial automation with mail merge or Excel macros |
| **Current workaround** | Manual process: export CSV from custodian (Schwab, Fidelity, TD Ameritrade), paste data into a Word template, write personalized commentary for each client, PDF it, and email it. 3-4 hours per client report. |
| **Core pain** | Time cost of report production crowds out time for client acquisition and financial planning work. Many advisors delay or skip quarterly reviews because of the production burden. |
| **Out of scope users** | Enterprise RIAs with dedicated ops staff, broker-dealers using proprietary reporting systems, advisors using full-suite wealth management platforms (Orion, Tamarac) that already include reporting modules |

---

### Core Functionality (IN Scope)

| # | Feature | Why On Critical Path | Simplest Viable Version | Build Estimate |
|---|---|---|---|---|
| 1 | CSV data import and normalization | Without data input, no report is possible. Custodian API integrations are 3-6 month projects; CSV export is already part of the advisor's workflow | Accept a standardized CSV export from Schwab Advisor Center or Fidelity Wealthscape. Parse and normalize: account value, allocation, performance YTD and 1-year, top holdings. Reject malformed files with a clear error message. | 4 days |
| 2 | Report template engine | Produces the structured output that is the product's core value. One template in the MVP -- advisors who want customization can wait for Phase 2 | Single template: executive summary (AI-generated), portfolio performance table, allocation breakdown chart (static bar chart), benchmark comparison (S&P 500 and 60/40 default), 3-bullet forward-looking commentary draft. No custom branding, no color themes. | 5 days |
| 3 | AI narrative generation | This is the riskiest assumption -- the advisor must trust the output enough to send it. Without this, the product is just a formatting tool, which is not worth paying for | GPT-4o fine-tuned prompt generating 3 sections: (a) performance summary relative to benchmark, (b) allocation rationale, (c) outlook paragraph. Advisor can edit inline in the browser before export. Tone preset: professional and client-friendly. No custom voice in MVP. | 4 days |
| 4 | PDF export | The output format advisors actually send to clients. Without a clean PDF, the report cannot be used | Single-page and multi-page PDF export. Advisor firm name and logo on header (text input only -- no custom color/font theming). Download button. | 2 days |
| — | **Infrastructure** | Auth + secure file handling (data must be treated as sensitive financial data, not stored beyond the session without consent) | Clerk for auth, server-side CSV processing (no client-side storage of financial data), session-scoped data deletion after export. No long-term data persistence in MVP -- advisor uploads fresh each time. | 3 days |

**Manual processes replacing build (Wizard of Oz / Concierge):**
- **Onboarding:** No in-product tutorial. Founder conducts a 20-minute Zoom onboarding call with each of the first 10 beta advisors. Collects qualitative feedback on the narrative quality during this call.
- **Error handling for unusual CSV formats:** Beta advisors email their CSV to the founder directly if the parser fails. Founder manually reformats and returns a report within 24 hours. This covers edge cases without building a robust parser in Week 1.
- **Benchmark data:** In the MVP, benchmark returns (S&P 500, Bloomberg Aggregate Bond Index) are hard-coded monthly values updated manually by the founder in a config file. No live market data API integration required.

---

### Critical User Journey

| Step | Action | What Makes This Possible | Can It Be Manual? |
|---|---|---|---|
| 1 | Advisor discovers product via NAPFA forum post or XY Planning Network community | Founder-led community outreach + waitlist landing page | N/A |
| 2 | Advisor signs up for beta access | Email signup with Clerk auth, founder approves access within 24 hours (manual gate in MVP) | Yes -- founder emails access code |
| 3 | Advisor exports CSV from their custodian and uploads it | CSV upload component, parser normalizes data, displays preview table for advisor to confirm | Partially -- founder can manually process misformatted CSVs |
| 4 | **Advisor reviews AI-generated report draft** | Template engine + GPT-4o narrative generation. Advisor sees formatted report with editable text fields. This is the aha moment. | No -- this is the core automated value |
| 5 | Advisor edits narrative and exports PDF | Inline text editor + PDF export | No -- PDF generation must be automated |
| 6 | Advisor returns next quarter | Email reminder 2 weeks before end of quarter: "Q[X] reports are due soon -- upload your client data to AdvisorReport" | Yes -- founder sends this email manually in MVP |

---

### Out of Scope (Explicit Exclusions)

| Feature | Deferred Phase | Reason for Exclusion | Who Requested It |
|---|---|---|---|
| Direct custodian API integration (Schwab, Fidelity) | Phase 2 | API partnerships take 3-6 months to negotiate and build. CSV covers 100% of the use case for MVP. | Initial advisor interviews |
| Custom report templates and branding | Phase 2 | Tests a customization hypothesis, not the core time-savings hypothesis. One template is sufficient to validate the primary hypothesis. | Founder vision |
| Client portal (advisors email reports directly from the platform) | Phase 2 | Adds compliance complexity (email delivery regulations for financial communications). Copy-paste or download is acceptable for MVP. | Advisor interviews |
| Multi-advisor firm accounts and role management | Phase 3 | MVP targets solo advisors. Team features require the solo use case to be validated first. | None yet |
| Automated performance calculation (YTD, IRR) | Phase 2 | Advisor's custodian already calculates performance and includes it in the CSV export. Recalculating independently adds risk without adding value in MVP. | Founder |
| CRM integration (Salesforce, Redtail, Wealthbox) | Phase 3 | CSV import covers the data need. Integration adds 3-4 weeks of scope and tests a different hypothesis (workflow integration vs. core value). | Advisor interviews |
| Regulatory disclosure management (adding required disclaimers automatically) | Phase 2 | Advisors have existing disclaimer language they append manually. This is a workflow convenience, not a core value feature. Note: advisors are responsible for their own compliance; MVP terms of service must state this clearly. | Compliance advisor |
| Historical report archive | Phase 2 | MVP does not store data beyond the session. No archive to display. Persistent storage is a Phase 2 architectural decision. | None yet |

---

### Success Metrics

| Type | Metric | Target | Timeline | Measurement Method |
|---|---|---|---|---|
| **Primary** | Quarterly report adoption rate: % of beta advisors who generate reports for ≥80% of their client book using AdvisorReport in their first full quarter | ≥ 40% of beta advisors | Q1 post-launch (approx. 10-12 weeks after launch) | Founder manually counts reports generated per advisor in the session log |
| **Secondary** | Time-to-first-report: time from CSV upload to PDF download for a first-time user | ≤ 25 minutes | Measured for first 20 reports generated | Server-side timestamps on upload event and download event |
| **Secondary** | Narrative edit rate: % of AI-generated narrative sections that advisors edit before export | Baseline measurement only -- no pass/fail target in MVP | Ongoing | Track character diff between generated text and exported text |
| **Guardrail** | Support escalation rate: % of report generation sessions that require founder intervention (broken parser, generation failure, etc.) | ≤ 15% of sessions | Ongoing | Manual count from support emails and Zoom calls |

---

### Build Plan

| Component | Owner | Estimate | Dependencies |
|---|---|---|---|
| Auth + secure session infrastructure | Engineer | 3 days | None |
| CSV parser and normalization (Schwab + Fidelity formats) | Engineer | 4 days | Auth |
| Report template engine + static chart generation | Engineer | 5 days | CSV parser |
| GPT-4o prompt engineering + narrative generation API | Engineer + Founder | 4 days | Template engine |
| Inline text editor + edit tracking | Engineer | 2 days | Template engine |
| PDF generation and download | Engineer | 2 days | Editor |
| Landing page + waitlist + beta access flow | Founder | 2 days | Auth |
| QA, edge case testing, bug fix buffer | Engineer | 4 days | All components |
| **Total** | | **26 days (~5.5 weeks for solo engineer)** | |

**Launch date:** Fixed at 6 weeks from project start
**Beta cohort size:** 15-20 independent RIA advisors recruited via NAPFA and XY Planning Network communities
**Evaluation date:** End of first full quarter post-launch (advisors must complete at least one quarterly review cycle)

---

### Decision Gate

| Outcome | Condition | Action |
|---|---|---|
| **Proceed to Phase 2** | ≥40% of beta advisors use AdvisorReport for ≥80% of their Q1 reports | Begin Phase 2: custodian API integration (Schwab), custom branding, client email delivery |
| **Pivot** | <40% adoption rate, but qualitative interviews reveal advisors are using it for a different workflow (e.g., prospect presentations rather than client reviews) | Redefine hypothesis around prospect workflow use case, scope new MVP around that use case |
| **Kill** | <40% adoption rate, narrative edit rate >90% (advisors are rewriting everything, so AI adds no value), and no clear alternate use case emerges | Sunset AdvisorReport, apply learning to adjacent problem in the RIA workflow |

---

### Open Questions

1. Do advisors need to upload one CSV per client or one consolidated CSV for all clients? This affects the parser architecture and the UX for advisors with 100+ clients.
2. Are there standard column headers across Schwab and Fidelity CSV exports, or does each custodian use different field names? Answer needed before parser development begins.
3. What is the minimum viable disclaimer language that advisors need on each report to satisfy their individual compliance obligations? This affects the template design.
