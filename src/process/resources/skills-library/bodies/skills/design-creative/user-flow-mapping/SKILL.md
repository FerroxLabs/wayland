---
name: user-flow-mapping
description: |
  Maps complete user flows with entry points, decision nodes, happy paths, error paths, and exit points as numbered step sequences with branch conditions.
  Use when the user asks to map a user journey, document a workflow, plan navigation between screens, or diagram how users move through a product.
  Do NOT use for wireframing individual screens (use wireframe-specification), defining interaction animations (use prototype-spec), or business process mapping (use a business skill).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "design planning analysis"
  category: "design-creative"
  subcategory: "ui-ux-design"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# User Flow Mapping

## When to Use

**Use this skill when:**
- The user asks to map a user flow, user journey, task flow, or "how users move through" a feature or product
- The user wants to document all navigation paths between screens (happy path, error paths, edge paths, abandon paths)
- The user needs to identify friction points, dead ends, or ambiguous branching in an existing product
- The user wants to plan a new feature's navigation before handing it to a designer or engineer
- The user is conducting a flow audit -- comparing current-state to proposed-state before a redesign
- The user needs to communicate product behavior across teams (engineering, QA, product, design) without ambiguity
- The user wants to identify what analytics events to instrument and where funnels break
- The user needs to document conditional access logic (authenticated vs. unauthenticated, free vs. paid tier, mobile vs. desktop)

**Do NOT use when:**
- The user wants to wireframe or spec the layout of a single screen (use `wireframe-specification` -- that skill handles component placement, spacing, and visual hierarchy)
- The user wants to define micro-interactions, gesture behaviors, or animation timing (use `prototype-spec` -- that skill handles state transitions and motion)
- The user wants to create a sitemap showing information architecture (a sitemap documents content hierarchy and URL structure, not user behavior sequences)
- The user wants to map a business process, organizational handoff, or back-office workflow with multiple departments (use a business-process-mapping skill -- those involve BPMN notation, swimlanes for business units, and SLA tracking, which are distinct concerns)
- The user wants to write a job story or user story (use a requirements skill -- stories are input artifacts; flows are output artifacts derived from stories)
- The user is asking about accessibility implementation details of a flow (use an accessibility-audit skill -- WCAG compliance on specific components is a different layer)
- The user wants to conduct usability testing or tree testing on an existing flow (use a usability-research skill)

---

## Process

### Step 1: Establish Flow Scope Before Writing Anything

Never begin mapping until you have answered six required questions. If the user hasn't provided them, ask explicitly:

- **Goal (task-level):** What is the single user task this flow accomplishes? Express it as a verb-noun pair: "purchase a product," "reset a password," "onboard as a new user," "submit an expense report." If the user gives a vague goal like "improve checkout," decompose it into discrete task-level flows first.
- **Actor and persona state:** Who is performing the task, and what do they know coming in? Distinguish between unauthenticated visitor, authenticated free-tier user, authenticated paid user, returning user, first-time user, admin, and guest. The actor's state determines which branches exist.
- **Entry point(s):** Where does the flow begin? Entry points are more numerous than users expect. For a checkout flow, entry points include: product detail page CTA, cart page, saved cart (email link), and social proof ad deep link. Each entry point may require a different first step.
- **Success state:** What is the binary completion condition? Frame it as a system-observable event: "order_confirmed event fires," "session token issued," "record created in database." Avoid vague success states like "user is happy."
- **Constraints and dependencies:** Authentication gates, external API calls (payment processors, identity verification, email delivery), platform constraints (mobile web vs. native app vs. desktop), feature flags, subscription tier gates, and regulatory requirements (age verification, GDPR consent).
- **Out-of-scope adjacent flows:** Explicitly list what this flow does NOT cover. If "forgot password" is a branch off the login flow, note it as a redirect exit to the "password reset" flow rather than mapping it inline.

If the user is documenting an existing product, ask them to describe the current flow verbally or share a screen inventory. Treat their description as raw input -- you will structure it, not transcribe it.

### Step 2: Map the Happy Path as a Strict Linear Sequence

The happy path is the backbone. Every other path references it. Map it completely before adding any branches.

- Each step follows the atomic structure: **[User action] → [System response] → [Resulting screen or state]**. One action. One response. If you find yourself writing "user fills out the form and clicks submit," that is two steps: "user fills out form fields" and "user clicks submit button."
- Number steps as positive integers starting at 1. Reserve decimal suffixes (3a, 3b, 3e) strictly for branches.
- Write user actions in active voice, first-person perspective: "Taps 'Add to Cart' button," not "button is pressed."
- Write system responses in present tense: "Validates card number," "Displays loading spinner," "Creates session token."
- Include transitional system steps (loading states, background processing) as their own steps when they involve user-visible feedback or latency over 400ms. Users experience these steps even if they take no action during them.
- Assign a screen name to every step. The same screen always gets the same name. Build a screen inventory as you go -- if you use "Payment Screen" once, never later call it "Checkout Screen."
- The happy path ends at exactly one success exit step. If you think there are two success endpoints, you have two flows -- split them.
- Aim for 4--12 steps on the happy path. Flows shorter than 4 steps are usually sub-flows, not standalone flows. Flows longer than 12 steps are usually two flows stitched together -- identify the natural handoff point and split them.

### Step 3: Identify and Catalogue All Decision Nodes

After completing the happy path, review each step against a decision node checklist:

- **User-initiated decision:** User must choose between two or more options (proceed vs. cancel, sign in vs. continue as guest, save vs. discard).
- **System-evaluated condition:** System checks a data condition (email exists in database, token valid and not expired, inventory in stock, card authorized, user is age-verified).
- **Environment condition:** Platform or context affects the path (mobile vs. desktop -- different screens; push notification entry -- skips landing screen; returning user -- pre-filled form).
- **Permission gate:** Feature requires a subscription, role, or explicit grant (free user hits a paid feature wall, unauthenticated user hits an auth gate, user without notification permission hits an OS prompt).

For each decision node, record: the step number it follows, the condition being evaluated, the party evaluating it (user or system), and the number of branches it creates. A two-option condition creates two branches. A three-option condition creates three branches (e.g., card authorized / card declined / card network error -- these are distinct outcomes with distinct recovery paths, not a single "failure" branch).

Label conditions precisely. "Email valid?" is imprecise -- it could mean format-valid or exists-in-database. Write "Email matches registered account?" instead. Precision here prevents ambiguous engineering requirements.

### Step 4: Map Alternate Paths With Full Step Sequences

For each decision node, map every non-happy branch as a named alternate path. Use three path archetypes:

**Alternate happy path:** A valid route to the same success state that diverges from the primary happy path. Example: guest checkout vs. authenticated checkout. Both achieve "order confirmed." Map the guest checkout as a complete parallel sequence from its divergence point to the shared success exit. Do not shortcut with "similar to happy path but without login step" -- write every step explicitly.

**Error path (recoverable):** A condition that blocks forward progress but can be resolved. Specify:
- The trigger condition (what specifically went wrong)
- The exact error message or state the user sees (write real error copy, not "[error message]")
- The recovery action available to the user
- The step the flow returns to after recovery
- The maximum retry count if applicable (3 failed card attempts, 5 failed OTP attempts, etc.). After maximum retries, branch to an unrecoverable error exit.

**Error path (unrecoverable):** A condition that permanently terminates the flow. Examples: token expired with no renewal path, account suspended, required third-party service down. Specify:
- The trigger condition
- The exact error state the user sees
- Whether any partial data is preserved
- Any off-ramp for the user (contact support link, retry tomorrow messaging)

**Abandon path:** The user leaves the flow voluntarily. Classify abandon points:
- **Explicit abandon:** User clicks cancel, taps back, or closes a modal with an explicit dismiss action
- **Implicit abandon:** User navigates away, closes the browser, or lets a session time out
- For each abandon point, document whether partial state is preserved (cart persisted in localStorage, form fields saved as draft, session cookie retained)

### Step 5: Map External Dependency Steps in Detail

Any step involving a third-party system or asynchronous operation requires expanded documentation:

- **Identity the dependency:** Payment processor, email delivery service, SMS gateway, identity verification provider, OAuth provider, or internal microservice with its own SLA.
- **Document the three failure modes:** (1) Timeout -- system never responds within expected window; (2) Error response -- system responds with a definitive failure; (3) Ambiguous response -- system response is unclear (network drop mid-transaction).
- **Define expected latency:** Payment authorization typically takes 1--3 seconds; email delivery 30 seconds to 5 minutes; SMS delivery 5--30 seconds; identity document verification 30 seconds to 3 minutes. These numbers belong in step annotations, not in vague "may take a moment" copy.
- **Document the timeout threshold:** What is the maximum wait before the UI shows an error? Common thresholds: API calls 10 seconds, payment processing 30 seconds, email verification polling 5 minutes. After timeout, the flow must have an explicit path -- not a dead end.
- **Document the ambiguous-response path:** If a payment gateway drops the connection after the charge but before the confirmation, what does the system show the user? This is among the most dangerous dead ends in product design. It must be explicitly addressed.

### Step 6: Define and Label All Exit Points

Every path through the flow must terminate at exactly one of four exit types. No path may trail off without an exit label.

- **Success exit:** User achieved the goal. Specify: confirmation screen name, confirmation message, any side effects (email sent, record created, notification fired), and the next destination (where the user lands after success).
- **Error exit (unrecoverable):** Flow terminates due to a condition the user cannot resolve in-session. Specify: error screen name, error message, and available off-ramps (contact support, retry later, return to start).
- **Abandon exit:** User left the flow voluntarily or through inaction. Specify: whether state is preserved, for how long, and what the user experiences on return (resume prompt, fresh start, expired session).
- **Redirect exit:** Flow hands off to a sub-flow that, upon completion, returns control to this flow. Specify: the sub-flow name, the return step in the parent flow, and what state is passed between flows (user ID, cart contents, OAuth token).

Count your exits. A well-scoped flow of 6--10 steps typically has 1 success exit, 2--4 error exits, 1--2 abandon exits, and 0--2 redirect exits. A flow with 8 error exits is probably two flows or is over-specifying system error codes at the wrong abstraction level.

### Step 7: Annotate for Engineering and Analytics

Add a metadata layer to the flow that makes it actionable for implementation:

**Data requirements per step:** What data must exist for the step to execute? "Step 4 requires: reset_token (UUID), token_created_at (timestamp), user_id (foreign key). Token expires when current_time minus token_created_at exceeds 3600 seconds." This level of specificity catches requirement gaps before engineering sprint planning.

**Authentication and authorization per step:** For each step, annotate whether it requires an active session, a specific role, or a specific token. Steps behind an auth gate must document the redirect behavior for unauthenticated access attempts.

**Analytics instrumentation:** For every funnel step -- any step the team will want conversion data on -- specify: event name (use snake_case), the event trigger (page load, button click, API response), and 2--3 key properties to capture (user_id, session_id, flow_variant, error_code). Common funnel steps to always instrument: flow entry, each major form submission, external dependency resolution, success exit, every error exit.

**A/B test surfaces:** Note steps where the team may want to run experiments (CTA copy, form field ordering, error message tone). Flag these as "experiment surface" without designing the experiment -- that is out of scope for a flow map.

### Step 8: Compile and Structure the Final Specification

Assemble all components in the output format. Apply a final quality check:

- Every step on the happy path has a screen name
- Every decision node has a corresponding alternate path section
- Every alternate path has an exit point
- No step is a dead end (every step connects forward to another step or to an exit)
- Screen names are consistent throughout (build a screen glossary if the flow has more than 8 screens)
- Error messages are written in plain language (the spec is also a copywriting reference)
- Analytics events follow a consistent naming convention (snake_case, verb_noun or noun_verb pattern)
- External dependencies have latency annotations and failure paths

---

## Output Format

```
## User Flow: [Flow Name]

### Overview
- **Goal:** [Verb-noun task statement, e.g., "Complete a first-time purchase as a guest user"]
- **Actor:** [Persona state, e.g., "Unauthenticated visitor with items in cart"]
- **Entry point(s):** [List all valid entry points with their origin screen]
- **Success state:** [System-observable event, e.g., "order_confirmed event fires; order record created"]
- **Out of scope:** [Adjacent flows explicitly excluded]
- **Key constraints:** [Auth gates, external dependencies, platform limits, regulatory requirements]

---

### Screen Inventory
| Screen Name          | Description                                      | Auth Required? |
|----------------------|--------------------------------------------------|----------------|
| [Screen Name]        | [What this screen is and does]                   | [Yes / No]     |

---

### Happy Path
| Step | User Action                        | System Response                          | Screen            | Data / Notes                          |
|------|------------------------------------|------------------------------------------|-------------------|---------------------------------------|
| 1    | [Specific user action]             | [Specific system response]               | [Screen Name]     | [Latency / data required / notes]     |
| 2    | [Specific user action]             | [Specific system response]               | [Screen Name]     |                                       |
| ...  | ...                                | ...                                      | ...               |                                       |
| N    | [Final action]                     | [Success confirmation response]          | [Screen Name]     | **SUCCESS EXIT**                      |

---

### Decision Nodes
| After Step | Condition                              | Evaluator | Branch A (happy)              | Branch B                      | Branch C (if applicable)      |
|------------|----------------------------------------|-----------|-------------------------------|-------------------------------|-------------------------------|
| [Step #]   | [Precise condition statement]          | System    | [Continue to step N]          | [Go to path name, step Xe]    |                               |
| [Step #]   | [Precise condition statement]          | User      | [Continue / path name]        | [Alternate path name]         |                               |

---

### Alternate Paths

#### [Path Name -- e.g., "Guest Checkout Path"]
*Diverges from happy path after step [N]. Converges at step [N] / shares success exit.*

| Step  | User Action                        | System Response                          | Screen            | Notes                                 |
|-------|------------------------------------|------------------------------------------|-------------------|---------------------------------------|
| [N]a  | [Specific action]                  | [Specific response]                      | [Screen Name]     |                                       |

---

#### [Path Name -- e.g., "Card Declined -- Recoverable"]
*Triggered at step [N]. Recoverable: returns to step [N] after user action. Max [X] retries.*

| Step  | Trigger Condition                  | Error State Shown to User                | Screen            | Recovery Action               |
|-------|------------------------------------|------------------------------------------|-------------------|-------------------------------|
| [N]e  | [Exact trigger, e.g., "Issuer returns decline code 05"] | "[Exact error message copy]" | [Screen Name] | [Return to step N / Exit] |

---

#### [Path Name -- e.g., "Session Timeout -- Unrecoverable"]
*Triggered at step [N]. Unrecoverable: flow terminates.*

| Step  | Trigger Condition                  | Error State Shown to User                | Screen            | Off-Ramp Available            |
|-------|------------------------------------|------------------------------------------|-------------------|-------------------------------|
| [N]e  | [Exact trigger]                    | "[Exact error message copy]"             | [Screen Name]     | [Contact support / retry / return to start] |

---

### External Dependencies
| Step | Dependency                  | Expected Latency    | Timeout Threshold | Timeout Behavior                     | Ambiguous-Response Behavior           |
|------|-----------------------------|---------------------|-------------------|--------------------------------------|---------------------------------------|
| [#]  | [Service name / type]       | [X--Y seconds]      | [Z seconds]       | [Show error X, branch to path Y]     | [Show "processing" state, confirm via polling] |

---

### Exit Points
| Type       | After Step | Condition                         | User Sees                            | State Preserved?        | Next Destination             |
|------------|------------|-----------------------------------|--------------------------------------|-------------------------|------------------------------|
| Success    | [Step #]   | [System-observable completion]    | [Screen name + confirmation copy]    | N/A                     | [Where user lands next]      |
| Error      | [Step #]   | [Unrecoverable failure condition] | [Error screen name + message]        | [Yes / No / Partial]    | [Off-ramp link or dead end]  |
| Abandon    | [Step #]   | [User-initiated exit]             | [Save prompt / nothing]              | [Yes, 30 days / No]     | [Resume URL / fresh start]   |
| Redirect   | [Step #]   | [Sub-flow handoff condition]      | [Sub-flow start]                     | [State passed: list]    | [Returns to step N]          |

---

### Analytics Events
| Step | Event Name                  | Trigger                          | Key Properties                                      | Purpose                              |
|------|-----------------------------|----------------------------------|-----------------------------------------------------|--------------------------------------|
| [#]  | [snake_case_event_name]     | [Page load / click / API response] | user_id, session_id, [domain-specific property]   | [What funnel question this answers]  |

---

### Open Questions
| # | Question                                    | Owner          | Blocks             |
|---|---------------------------------------------|----------------|--------------------|
| 1 | [Unresolved requirement or ambiguity]       | [Product / Eng / Design] | [Step # or path name] |
```

---

## Rules

1. **Map the happy path first, completely, before writing a single branch.** Every branch references step numbers from the happy path. If you write branches before the happy path is complete, your step numbers will shift and your cross-references will break.

2. **Each step is exactly one user action paired with exactly one system response.** "User fills out the registration form" is not a step -- it is 4--6 steps. Atomic steps allow QA to write test cases from the flow map without ambiguity. If you cannot write a single automated test assertion for a "system response," the step is not atomic.

3. **Never write a vague error message.** Write the exact message the user will see: "Your session has expired. Please log in again." not "[Session expiry message]." The flow map is the canonical source for error copy before a content designer reviews it. Placeholder copy propagates into shipped products.

4. **Every decision node must document the evaluator -- user or system.** A user choice (proceed vs. cancel) and a system condition check (token valid?) both create branches, but they have completely different implementation implications. Mislabeling the evaluator causes engineering to build the wrong thing.

5. **External dependency steps must have three explicitly documented failure modes:** timeout, definitive failure response, and ambiguous/indeterminate response. The ambiguous response case (network drop mid-transaction, payment charged but confirmation lost) is the most dangerous dead end in product flows. It must never be omitted.

6. **Looping paths (retry flows) must specify a maximum iteration count.** "Returns to step 4" with no maximum creates an infinite loop in the spec. Specify the limit and the escalation path: "Returns to step 4, max 3 attempts; on third failure, branches to account-locked error exit."

7. **Screen names are controlled vocabulary.** Establish the screen inventory in Step 1 of your process and never deviate from it. If the same screen appears under two names, engineers may build two screens. A screen name change mid-document is a defect in the spec, not a stylistic choice.

8. **Redirect exits must document both the outbound state (what is passed to the sub-flow) and the return point (which step in the parent flow execution resumes from).** A redirect that says only "goes to create account flow" is incomplete. Specify: "Redirect to Create Account flow, passing cart_id and session_id. On Create Account success, return to step 4 of this flow with authenticated user session established."

9. **If a flow has more than 12 happy-path steps, decompose it.** Flows of 15--20 steps are almost always two flows with a redirect exit between them. Identify the natural midpoint (usually a major state change: account created, payment authorized, identity verified) and split. A parent flow with redirect exits to sub-flows is always cleaner than a single mega-flow.

10. **Document abandoned state preservation with specificity.** "State saved" is not acceptable. Write: "Cart contents persisted in localStorage for 30 days," "Form draft auto-saved to backend every 60 seconds for authenticated users, not saved for unauthenticated users," or "No state preserved -- user must restart on return." Unspecified state preservation is one of the most common causes of divergence between product intent and engineering implementation.

11. **Flows involving authentication must document the unauthenticated intercept explicitly.** If a user deep-links to step 5 of a flow that requires authentication, what happens? There must be an auth intercept path: redirect to login, complete login, return to intended step. This path is easy to omit and routinely causes a poor return experience.

12. **Analytics events use snake_case verb-noun naming with a flow namespace.** Good: `checkout_payment_submitted`, `checkout_payment_declined`, `checkout_order_confirmed`. Avoid generic names like `button_clicked` or `page_viewed` -- they are unactionable in a funnel analysis. Every major funnel step and every error exit must have its own event.

---

## Edge Cases

**Multi-actor flows (marketplace checkout with buyer and seller, or two-sided approval workflows):**
Create a swimlane section beneath the happy path table with one labeled lane per actor. Steps that involve only one actor appear in that actor's lane. Steps at the boundary -- where one actor's action triggers a system notification to the other, or where both actors must complete an action before the flow proceeds -- are annotated as "handoff steps." Document what the waiting actor sees during the other actor's action (a pending state screen, an email notification, nothing). Do not fold multi-actor flows into a single-actor flow by treating one actor as a "system response" -- that obscures real UX decisions about the secondary actor's experience.

**Flow re-entry after an async break (email verification, document review, delayed approval):**
Some flows have a natural pause of minutes, hours, or days while an async process completes. Treat the pause as two sub-flows: the submission sub-flow (user submits and sees a confirmation screen) and the re-entry sub-flow (user returns via email link or push notification and continues). Document both. The re-entry sub-flow has its own entry point (email link or notification), its own authentication check (is the token in the link still valid?), and its own "resume" step that continues the parent flow. Specify: what does the user see if they return before the async process completes? What if they return after it has timed out?

**Feature-flagged or A/B-tested steps:**
When a step has two variants under test, document both variants as named alternate paths -- not as a single step with a parenthetical note. Use labels like "Variant A (control): Single-page checkout" and "Variant B: Step-by-step checkout wizard." Specify the experiment surface annotation and what the branching condition is (user is in experiment cohort A or B). This ensures QA can test both variants and analytics can segment by variant.

**Accessibility-forced alternate paths:**
Some users will interact with the flow via keyboard navigation, screen reader, or voice input, producing interaction sequences that differ from mouse/touch flows. For flows with complex interactions (drag-and-drop, multi-step modals, file uploads), note steps where the interaction model changes for assistive technology users. Example: "Step 3 -- file upload: mouse users drag and drop; keyboard/screen reader users interact with a file picker dialog triggered by a visibly labeled button." Flag these for accessible design review without specifying WCAG implementation details (that belongs in an accessibility audit).

**Flow audit of an existing, potentially broken product:**
If the user is documenting a current-state flow to identify problems, produce two artifacts: a "Current State" flow map that faithfully documents the existing behavior (including its broken paths, dead ends, and missing error handling), followed by a "Friction Annotations" table that lists every identified problem with its step reference, problem type (dead end, missing error message, unnecessary decision node, excessive steps, inconsistent naming), severity (blocking / high / medium / low), and proposed resolution. Then produce a "Proposed State" flow map. The separation of current-state and proposed-state is critical -- conflating them produces a spec that no one can implement because it is unclear which parts already exist.

**Mobile-specific flow variations:**
Mobile flows often diverge from desktop flows due to platform capabilities (biometric authentication replaces password entry, camera-based document capture replaces file upload, push notification entry bypasses the web entry point entirely). When the user specifies a mobile-native context, add a "Platform Variants" section to each step where mobile behavior differs from desktop. Document specifically: what is different (biometric prompt vs. password field), which platform each variant applies to (iOS / Android / mobile web), and whether the variant produces a different step count or just a different interaction on the same step. A mobile-native flow that simply copies a desktop flow without accounting for platform capabilities is not a mobile flow -- it is a desktop flow with a smaller screen.

**Regulatory and consent gates (GDPR, CCPA, age verification, financial compliance):**
Consent and legal gates appear as mandatory decision nodes that the team may want to minimize but cannot remove. Document these as first-class decision nodes with their legal requirement noted (e.g., "GDPR Article 6(1)(a) -- explicit consent for marketing emails required before account creation completion"). The branches are: user consents (continue), user declines (continue with restricted permissions, not block -- most consent is optional for account creation), user does not act (do not proceed without explicit action). Document the minimum required consent disclosures as step annotations. Flag ambiguous consent UX patterns (pre-checked checkboxes, bundled consent) as design risks in the Open Questions table.

---

## Example

**Input:** "Map the user flow for adding a payment method to an account in a SaaS web app. The user is already logged in. They can add a credit card or a bank account via ACH."

**Output:**

---

## User Flow: Add Payment Method

### Overview
- **Goal:** Add a verified payment method to an existing account for future billing
- **Actor:** Authenticated user with an active account, no payment method on file (or adding an additional method)
- **Entry point(s):** (1) Billing Settings page "Add Payment Method" button; (2) In-context prompt during upgrade flow when no payment method exists
- **Success state:** `payment_method_added` event fires; payment method record created and marked as verified in billing system; method appears in Billing Settings payment methods list
- **Out of scope:** Removing an existing payment method, setting a default payment method, processing a charge against the new method
- **Key constraints:** User must be authenticated with an active session. Credit card tokenization handled by third-party payment processor (PCI DSS compliance -- raw card data never touches application server). ACH verification requires micro-deposit confirmation, which takes 1--2 business days and requires a second user session to complete.

---

### Screen Inventory
| Screen Name                  | Description                                                               | Auth Required? |
|------------------------------|---------------------------------------------------------------------------|----------------|
| Billing Settings             | Lists current payment methods, billing history, plan details              | Yes            |
| Add Payment Method Modal     | Entry point modal with method-type selector (card vs. ACH)                | Yes            |
| Card Entry Form              | Tokenized card input fields (number, expiry, CVV, billing ZIP)            | Yes            |
| ACH Bank Entry Form          | Bank routing number and account number entry                              | Yes            |
| ACH Verification Pending     | Confirmation screen showing micro-deposit pending status                  | Yes            |
| ACH Verify Deposits          | Form for entering two micro-deposit amounts to verify account             | Yes            |
| Payment Method Success       | Inline success confirmation within Billing Settings                       | Yes            |
| Payment Method Error         | Inline error state within the active form                                 | Yes            |

---

### Happy Path (Credit Card)
| Step | User Action                                      | System Response                                                         | Screen                    | Data / Notes                                                                 |
|------|--------------------------------------------------|-------------------------------------------------------------------------|---------------------------|------------------------------------------------------------------------------|
| 1    | Clicks "Add Payment Method" button               | Opens Add Payment Method Modal                                          | Billing Settings          | Modal overlays Billing Settings                                              |
| 2    | Selects "Credit or Debit Card" option            | Highlights card option; activates "Continue" button                     | Add Payment Method Modal  | Default selection; ACH is the alternate path                                 |
| 3    | Clicks "Continue"                                | Renders Card Entry Form with tokenized input fields                     | Card Entry Form           | Payment processor iframe loaded; no card data touches app server (PCI)       |
| 4    | Enters card number, expiry, CVV, and billing ZIP | Inline format validation as user types; no submission yet               | Card Entry Form           | Luhn algorithm validates card number format client-side                      |
| 5    | Clicks "Add Card"                                | Submits tokenized card data to payment processor; shows loading spinner | Card Entry Form           | Latency: 1--3 seconds; timeout threshold: 10 seconds                        |
| 6    | (System step -- no user action)                  | Payment processor returns card token and card fingerprint               | Card Entry Form           | Token stored; raw card data discarded                                        |
| 7    | (System step -- no user action)                  | App server creates payment method record; sets as default if first card | Payment Method Success    | `payment_method_added` event fires; **SUCCESS EXIT**                        |
| 8    | Views success state                              | Billing Settings reloads with new card in payment methods list          | Billing Settings          | Success toast: "Visa ending in 4242 added successfully."                    |

---

### Decision Nodes
| After Step | Condition                                              | Evaluator | Branch A (happy)                        | Branch B                                        | Branch C                                    |
|------------|--------------------------------------------------------|-----------|-----------------------------------------|-------------------------------------------------|---------------------------------------------|
| 2          | Which payment method type does user select?            | User      | Credit/Debit Card -- continue to step 3 | ACH Bank Account -- go to ACH Path, step 2a     |                                             |
| 4          | Are all required card fields populated and format-valid? | System  | Continue to step 5                      | Inline validation errors shown -- stay at step 4 |                                            |
| 5--6       | Does payment processor return a valid card token?      | System    | Continue to step 7 (token received)     | Card tokenization error -- go to path "Card Tokenization Failure" | Timeout (10s) -- go to path "Processor Timeout" |
| 6          | Does card pass basic verification (Luhn + BIN check)?  | System    | Continue to step 7                      | Card rejected at tokenization -- go to path "Card Rejected at Entry" |                             |

---

### Alternate Paths

#### ACH Bank Account Path
*Diverges from happy path at step 2. ACH verification requires micro-deposit confirmation in a second session (1--2 business days later). This path has two phases: initial submission and deposit verification.*

**Phase 1 -- Bank Account Submission:**

| Step  | User Action                                   | System Response                                                  | Screen                   | Notes                                             |
|-------|-----------------------------------------------|------------------------------------------------------------------|--------------------------|---------------------------------------------------|
| 2a    | Selects "Bank Account (ACH)" option           | Highlights ACH option; activates "Continue"                      | Add Payment Method Modal |                                                   |
| 3a    | Clicks "Continue"                             | Renders ACH Bank Entry Form                                      | ACH Bank Entry Form      |                                                   |
| 4a    | Enters routing number and account number      | Validates routing number format (9 digits, ABA checksum)         | ACH Bank Entry Form      | ABA checksum validates routing number format      |
| 5a    | Clicks "Add Bank Account"                     | Submits to ACH processor; initiates micro-deposit request        | ACH Bank Entry Form      | Latency: 2--4 seconds; micro-deposits sent in 1--2 business days |
| 6a    | (System step)                                 | App creates unverified payment method record; sends confirmation email | ACH Verification Pending | Email: "Bank account added -- verify deposits to activate" |
| 7a    | Views pending confirmation screen             | Displays pending status with instructions                        | ACH Verification Pending | **PHASE 1 SUCCESS -- flow pauses for async verification** |

**Phase 2 -- Micro-Deposit Verification (separate session, 1--2 business days later):**

| Step  | User Action                                       | System Response                                             | Screen                | Notes                                        |
|-------|---------------------------------------------------|-------------------------------------------------------------|-----------------------|----------------------------------------------|
| 8a    | Returns to Billing Settings; clicks "Verify" on pending bank account | Renders ACH Verify Deposits form | ACH Verify Deposits   | Entry point: Billing Settings or email link  |
| 9a    | Enters two micro-deposit amounts (in cents)       | Validates amounts against stored expected values            | ACH Verify Deposits   | Max 3 attempts before account verification locked |
| 10a   | Clicks "Verify"                                   | Amounts match -- updates payment method status to verified  | Billing Settings      | `payment_method_verified` fires; **SUCCESS EXIT** |

---

#### Card Field Validation Errors (Recoverable)
*Triggered at step 4. User remains on Card Entry Form until all fields are valid.*

| Step  | Trigger Condition                                | Error State Shown to User                                                 | Screen          | Recovery Action                |
|-------|--------------------------------------------------|---------------------------------------------------------------------------|-----------------|--------------------------------|
| 4e    | Card number fails Luhn algorithm                 | "Please enter a valid card number."                                       | Card Entry Form | User corrects field; retry     |
| 4e    | Expiry date is in the past                       | "This card has expired. Please use a different card."                     | Card Entry Form | User corrects field; retry     |
| 4e    | CVV is wrong digit count for card type           | "Please enter a valid security code."                                     | Card Entry Form | User corrects field; retry     |
| 4e    | Billing ZIP is not 5 digits (US) or valid postal format | "Please enter a valid billing ZIP code."                         | Card Entry Form | User corrects field; retry     |

---

#### Card Rejected at Tokenization (Recoverable)
*Triggered at step 6 when the payment processor rejects the card during token generation. Max 3 attempts per session.*

| Step  | Trigger Condition                                      | Error State Shown to User                                                                       | Screen                | Recovery Action                    |
|-------|--------------------------------------------------------|-------------------------------------------------------------------------------------------------|-----------------------|------------------------------------|
| 6e    | Processor returns: card number invalid (BIN not found) | "We couldn't verify this card. Please check your card details and try again."                  | Card Entry Form       | Return to step 4; max 3 attempts   |
| 6e    | Processor returns: card type not accepted              | "We don't accept this card type. Please use Visa, Mastercard, or American Express."             | Card Entry Form       | Return to step 4; switch card      |
| 6e    | 3 consecutive tokenization rejections                  | "We're having trouble adding your card. Please contact support or try a different payment method." | Payment Method Error | **ERROR EXIT** -- link to support  |

---

#### Processor Timeout (Unrecoverable in session -- retry available)
*Triggered at step 5 when the payment processor does not respond within 10 seconds.*

| Step  | Trigger Condition                              | Error State Shown to User                                                                              | Screen                | Off-Ramp               |
|-------|------------------------------------------------|--------------------------------------------------------------------------------------------------------|-----------------------|------------------------|
| 5e    | No response from processor after 10 seconds   | "Something went wrong connecting to our payment service. Please wait a moment and try again."         | Payment Method Error  | "Try again" button returns to step 3 |
| 5e    | Timeout on retry attempt                       | "We're still having trouble. This may be a temporary issue. Please try again in a few minutes."       | Payment Method Error  | "Done" returns to Billing Settings   |

---

#### ACH Micro-Deposit Amount Mismatch (Recoverable -- max 3 attempts)
*Triggered at step 9a when the entered amounts do not match the stored micro-deposit values.*

| Step  | Trigger Condition                                  | Error State Shown to User                                                                          | Screen               | Recovery Action                        |
|-------|----------------------------------------------------|----------------------------------------------------------------------------------------------------|-----------------------|----------------------------------------|
| 9ae   | One or both amounts do not match                   | "Those amounts don't match our records. Please double-check and try again. You have [X] attempts remaining." | ACH Verify Deposits | Return to step 9a; max 3 total attempts |
| 9ae   | 3 failed verification attempts                     | "This bank account could not be verified and has been removed. Please add it again or use a different payment method." | Billing Settings | **ERROR EXIT** -- bank account record deleted; `ach_verification_failed` event fires |

---

### External Dependencies
| Step  | Dependency                          | Expected Latency       | Timeout Threshold | Timeout Behavior                                    | Ambiguous-Response Behavior                                                     |
|-------|-------------------------------------|------------------------|-------------------|-----------------------------------------------------|---------------------------------------------------------------------------------|
| 5--6  | Payment processor (card tokenization) | 1--3 seconds         | 10 seconds        | Show processor timeout error; offer retry to step 3 | Log ambiguous response; do not create payment method record; show generic retry error |
| 5a--6a | ACH processor (micro-deposit initiation) | 2--4 seconds      | 15 seconds        | Show timeout error; do not create unverified record; offer retry | Log event; check ACH processor dashboard; do not create duplicate record         |

---

### Exit Points
| Type     | After Step | Condition                                           | User Sees                                                         | State Preserved?                     | Next Destination               |
|----------|------------|-----------------------------------------------------|-------------------------------------------------------------------|--------------------------------------|--------------------------------|
| Success  | 7--8       | Card token received; payment method record created  | Billing Settings with "Visa ending in 4242 added" success toast   | N/A                                  | Billing Settings               |
| Success  | 10a        | ACH micro-deposits verified; method status updated  | Billing Settings with "Bank account verified and active" toast    | N/A                                  | Billing Settings               |
| Pending  | 7a         | ACH submitted; awaiting micro-deposit completion    | ACH Verification Pending screen; confirmation email sent          | Unverified record held for 7 days    | Returns via Billing Settings   |
| Error    | 6e (3rd)   | 3 consecutive card tokenization failures            | Payment Method Error screen with support link                     | No                                   | Support page or Billing Settings |
| Error    | 5e (retry) | Processor timeout on retry                          | Payment Method Error with "try later" message                     | No                                   | Billing Settings               |
| Error    | 9ae (3rd)  | 3 failed ACH verification attempts                  | Billing Settings with error message; unverified record deleted     | No                                   | Billing Settings               |
| Abandon  | Any        | User closes modal or navigates away                 | Nothing (modal closes or navigation proceeds)                     | No partial state saved               | Previous page or Billing Settings |

---

### Analytics Events
| Step  | Event Name                         | Trigger              | Key Properties                                                         | Purpose                                               |
|-------|------------------------------------|----------------------|------------------------------------------------------------------------|-------------------------------------------------------|
| 1     | `payment_method_flow_started`      | Modal opens          | user_id, account_id, entry_point (settings / upgrade_prompt)          | Track flow initiation rate by entry point             |
| 2     | `payment_method_type_selected`     | User selects type    | user_id, method_type (card / ach)                                     | Track card vs. ACH preference                         |
| 5     | `card_submission_attempted`        | "Add Card" clicked   | user_id, card_brand (if detectable from BIN)                          | Track submission attempt rate                         |
| 7     | `payment_method_added`             | Record created       | user_id, method_type, card_brand, is_first_method (bool)              | Primary success metric for this flow                  |
| 5a    | `ach_submission_attempted`         | "Add Bank" clicked   | user_id                                                               | Track ACH initiation rate                             |
| 6a    | `ach_pending_created`              | Unverified record created | user_id                                                          | Track ACH funnel entry                                |
| 10a   | `payment_method_verified`          | ACH verification completes | user_id, days_to_verify                                        | Track ACH full-funnel completion and time-to-verify   |
| 6e    | `card_tokenization_failed`         | Processor rejection  | user_id, error_code, attempt_number                                   | Track card rejection rate by error code               |
| 9ae   | `ach_verification_failed`          | 3rd failed attempt   | user_id                                                               | Track ACH drop-off at verification step               |
| 5e    | `payment_processor_timeout`        | 10s timeout fires    | user_id, method_type, attempt_number                                  | Monitor processor reliability and timeout frequency   |

---

### Open Questions
| # | Question                                                                                                    | Owner   | Blocks                          |
|---|-------------------------------------------------------------------------------------------------------------|---------|---------------------------------|
| 1 | Should the app attempt instant ACH verification via bank OAuth (e.g., Plaid Link) before falling back to micro-deposits? Instant verification eliminates the 1--2 day delay for supported banks. | Product | ACH Path design                 |
| 2 | What is the business rule when a user has 3 failed tokenization attempts? Lock the user from adding cards for 24 hours, or just surface a support contact? | Product | Card error exit handling        |
| 3 | For users entering from the upgrade flow, should a successful card add automatically complete the upgrade, or should the user confirm separately? This affects whether there is a redirect exit back to the upgrade flow. | Product | Exit points, redirect exit spec |
| 4 | Is billing ZIP required for all geographies or only US cards? International users may not have a ZIP equivalent. | Engineering | Step 4 validation rules       |
