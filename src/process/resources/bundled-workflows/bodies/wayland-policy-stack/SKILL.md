---
name: wayland-policy-stack
description: >-
  Build a complete legal policy stack for a product: Terms of Service, Privacy
  Policy, Refund Policy + EULA, and Cookie / Acceptable Use, all aligned to the
  product type, jurisdictions, and compliance requirements (GDPR, CCPA, HIPAA).

  Use when the user wants a structured, multi-step process to produce the full set of
  user-facing legal policies for a product before launch.

  Do NOT use for a single policy in isolation, or as a substitute for licensed legal
  advice. Outputs are drafts; counsel review is required before publication.
license: Apache-2.0
type: workflow
skills: "legal-tos legal-privacy legal-refund-policy"
metadata:
  author: wayland
  version: 1.0.0
  tags: legal tos privacy refund eula cookie compliance step-by-step business-legal
  category: business-legal
  depends: ""
---
# Policy Stack

**Estimated time:** 45-60 minutes

This workflow builds the full legal policy stack a product needs before launch:
Terms of Service, Privacy Policy, Refund Policy and EULA, and Cookie / Acceptable
Use policies. Every policy is aligned to the product type, the jurisdictions where
users and customers are, the data collected, and the compliance regime (GDPR,
CCPA, HIPAA, and similar).

The outputs are drafts. Counsel review is required before publication.

## When to Use

- User wants the complete set of user-facing legal policies for a product
- User needs policies aligned to product type, jurisdictions, and compliance regime
- User is preparing a product for launch and needs ToS, Privacy, Refund, EULA, Cookie, AUP
- Do NOT use for a single policy in isolation when no stack is needed
- Do NOT use as a replacement for licensed legal advice

## Steps

**Step 1: Intake the Product Brief** (uses: legal-tos)

Ask the user for the product type (SaaS, e-commerce, marketplace, digital download,
service, or mobile app), the jurisdictions where users and customers are, the data
collected, and any compliance requirements (GDPR, CCPA, HIPAA, etc.). Do not
proceed until you have the product type, jurisdictions, and data-collection summary.

- Input: product type, jurisdictions, data collected, compliance requirements
- Output: captured product brief
- Key focus: capture jurisdictions and data collection because they drive every policy

**Step 2: Determine the Required Policies** (uses: legal-tos)

From the brief, infer which policies this product actually needs given its type and
jurisdictions (e.g. GDPR triggers a data-processing and cookie-consent posture, a
marketplace needs different terms than a digital download). State the required
policy set, explain the reasoning, and let the user add or remove policies.

- Input: product brief from Step 1
- Output: confirmed list of required policies for this product and jurisdictions
- Key focus: scope the stack to what the product and its jurisdictions require

**Step 3: Draft the Terms of Service** (uses: legal-tos)

Draft the Terms of Service for this product, aligned to the product type and the
required-policy set. Cover acceptable use, account terms, liability limits,
dispute resolution and governing law, and termination. Surface the draft to the
user.

- Input: product brief from Step 1, required policies from Step 2
- Output: Terms of Service draft
- Key focus: terms matched to the product archetype and governing law

**Step 4: Draft the Privacy Policy** (uses: legal-privacy)

Draft the Privacy Policy aligned to the data collected and the compliance regime.
Cover what data is collected, why, legal basis, sharing and processors, retention,
user rights (access, deletion, portability), and jurisdiction-specific disclosures
(GDPR, CCPA). Surface the draft to the user.

- Input: product brief from Step 1, required policies from Step 2
- Output: Privacy Policy draft with compliance-specific disclosures
- Key focus: data practices and user rights mapped to the compliance regime

**Step 5: Review ToS and Privacy with the User** (uses: legal-tos)

Present the ToS and Privacy Policy together and ask whether to proceed to the
remaining policies or refine these two. If the user wants changes, gather feedback,
re-run the ToS draft incorporating it, and re-present (loop up to two times). When
approved, proceed.

- Input: ToS from Step 3, Privacy from Step 4, user feedback
- Output: approved ToS and Privacy Policy
- Key focus: lock the two highest-stakes policies before drafting the rest

**Step 6: Draft the Refund Policy and EULA** (uses: legal-refund-policy)

Draft the Refund Policy and EULA aligned to the product type and required-policy
set. Cover refund eligibility and windows, chargeback posture, license grant and
restrictions, and warranty disclaimers appropriate to the product. Surface the
draft to the user.

- Input: product brief from Step 1, required policies from Step 2
- Output: Refund Policy and EULA draft
- Key focus: refund windows and license terms matched to the product type

**Step 7: Draft Cookie and Acceptable Use Policies** (uses: legal-tos)

Draft the Cookie Policy and Acceptable Use Policy aligned to the product and
jurisdictions. Cover cookie categories and consent (GDPR/ePrivacy where relevant),
tracking disclosures, and prohibited-use terms. Surface the draft to the user.

- Input: product brief from Step 1, required policies from Step 2
- Output: Cookie Policy and Acceptable Use Policy draft
- Key focus: cookie consent posture matched to the jurisdictions

**Step 8: Review Remaining and Assemble the Stack** (uses: legal-tos)

Present the Refund, EULA, Cookie, and Acceptable Use drafts and ask whether to
assemble the stack or refine them. If the user wants changes, gather feedback,
re-run the cookie / acceptable-use step incorporating it, and re-present (loop up
to two times). When approved, assemble the full Policy Stack: product brief,
required policies, ToS, Privacy, Refund + EULA, and Cookie / Acceptable Use,
marked DRAFTS requiring counsel review before publication.

- Input: remaining drafts from Steps 6-7, all prior outputs, user feedback
- Output: assembled Policy Stack marked DRAFTS pending counsel review
- Key focus: deliver one assembled stack with the counsel-review gate clearly stated
