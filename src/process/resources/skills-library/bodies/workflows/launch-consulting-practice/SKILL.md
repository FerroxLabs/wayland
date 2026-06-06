---
name: launch-consulting-practice
description: >-
  Guided workflow for launching a professional consulting practice from niche
  selection and market positioning through pipeline development, client delivery
  frameworks, and scaling operations. Designed for experienced professionals
  transitioning to independent consulting.

  Use when the user wants to launch consulting practice or needs a structured
  multi-step process for this goal.

  Do NOT use when the request is a single-step task or requires professional
  advice beyond educational guidance.
license: Apache-2.0
type: workflow
skills: "consulting-practice personal-brand-architect sales-coach business-planner"
trigger_phrases: >-
  I want to start a consulting practice help me launch a consulting business
  become an independent consultant start my own advisory firm transition to
  consulting build a consulting pipeline
metadata:
  author: foundry-skills
  version: 1.0.0
  tags: entrepreneurship freelancing step-by-step planning
  category: business-operations
  depends: "consulting-practice personal-brand-architect sales-coach business-planner"
---
# Launch Consulting Practice

This workflow references financial information for educational purposes only. It is not financial advice. Consult a qualified financial advisor before making major financial decisions.

**Estimated time:** 6-12 weeks

This workflow guides experienced professionals through the process of
launching a sustainable consulting practice. Unlike general freelancing,
consulting requires a specific niche, a clear positioning statement,
structured sales processes, repeatable delivery frameworks, and a path to
scaling beyond trading time for money.

The workflow progresses through five stages: defining your niche and
expertise, establishing market positioning and thought leadership, building
a client acquisition pipeline, creating delivery frameworks for consistent
quality, and scaling the practice beyond solo work.

By the end of this workflow you will have: a defined consulting niche, a
professional market presence, an active sales pipeline, a delivery framework,
and a scaling strategy.

## When to Use

- User wants to launch consulting practice
- User needs a structured, step-by-step process for launch consulting practice
- User wants to start a consulting practice
- User wants to launch a consulting business
- become an independent consultant
- Do NOT use when: the request is outside the scope of launch consulting practice or requires professional advice beyond educational guidance
- Do NOT use for single-step tasks that one atomic skill can handle independently

## Prerequisites

Before starting this workflow, ensure:

- At least 5-10 years of professional experience in a specialized domain
- Deep expertise that companies would pay a premium for
- Some savings for the transition period (3-6 months of expenses)
- Professional network in the target industry
- Willingness to sell and market yourself (not just deliver work)

## Steps

**Step 1: Define Your Niche and Expertise** (uses: consulting-practice)

define a profitable consulting niche.
The niche must be specific enough to differentiate and broad enough to
sustain a business.

- Input: The consultant's professional background and experience, Industries and functions where they have deep expertise, Types of problems they enjoy solving
- Output: Specific consulting niche with positioning formula, Menu of services with descriptions and engagement models, Detailed description of the target client
- Key focus: Skills and experience audit (what are you genuinely expert at?)

**Step 2: Establish Market Positioning** (uses: personal-brand-architect)

establish authority and visibility
in your consulting niche.

- Input: `niche-definition` from Step 1 (positioning to communicate), `service-offerings` from Step 1 (what to promote), `ideal-client-profile` from Step 1 (audience to reach)
- Output: Market positioning statement and brand narrative, 90-day content calendar for thought leadership, Optimized LinkedIn profile for consulting lead generation
- Key focus: LinkedIn profile optimization for consulting (headline, about, experience)

**Step 3: Build Your Sales Pipeline** (uses: sales-coach)

build a repeatable consulting sales process.
Consulting sales are relationship-driven and typically have longer cycles.

- Input: `ideal-client-profile` from Step 1 (who to target), `service-offerings` from Step 1 (what to sell), `positioning-strategy` from Step 2 (how to message)
- Output: End-to-end consulting sales workflow, Consulting proposal template with pricing options, Discovery call structure and qualifying questions
- Key focus: Lead generation channels (referrals, LinkedIn, content, speaking, partnerships)

**Step 4: Create Your Delivery Framework** (uses: consulting-practice)

build repeatable delivery frameworks
that ensure consistent quality.

- Input: `service-offerings` from Step 1 (deliverables to systematize), `proposal-template` from Step 3 (scope definitions), Signed or pending client engagements
- Output: Step-by-step delivery process for each service offering, Diagnostic tools and templates for client assessments, Standardized templates for common consulting outputs
- Key focus: Engagement kickoff process (stakeholder alignment, scope confirmation)

**Step 5: Scale the Practice** (uses: business-planner)

develop a scaling strategy that moves
beyond solo consulting.

- Input: `revenue-model` from Step 1 (growth targets), `delivery-playbook` from Step 4 (processes to scale), `pipeline-tracker` from Step 3 (demand signals)
- Output: Growth plan with chosen scaling model and timeline, Non-billable-hour revenue streams, Hiring or subcontracting plan for expanded capacity
- Key focus: Evaluating scaling options (subcontractors, employees, partnerships, productized services)

## Decision Points

- **After each step:** Evaluate output quality before proceeding. If output is insufficient, iterate on the current step before moving forward.
- **Mid-workflow:** If circumstances change significantly, re-evaluate earlier steps before continuing.

## Failure Handling

- **Niche too broad:** "Management consultant" is not a niche. Specificity commands premium rates and makes marketing easier.
- **All delivery, no sales:** Block time for business development every week, even when fully booked. An empty pipeline catches up fast.
- **Underpricing:** Consulting rates should reflect the value of the outcome, not the hours invested. Do not anchor to your previous salary divided by 2,000 hours.
- **No delivery framework:** Winging each engagement leads to inconsistent quality and makes scaling impossible.
- **Ignoring thought leadership:** Consulting is a trust business. Publishing insights builds credibility that cold outreach cannot replicate.

## Expected Outcome

When this workflow is complete, the user will have:

1. A consulting niche is defined that commands premium rates
2. Market positioning attracts inbound inquiries from ideal clients
3. A repeatable sales process generates consistent pipeline
4. Delivery frameworks ensure quality and enable delegation
5. The practice has a clear path to scaling beyond the founder's time
6. Revenue targets are met within the first 6-12 months
7. Client satisfaction generates referrals and repeat engagements

## Output Format

```
LAUNCH CONSULTING PRACTICE TRACKER
==================================

[ ] Step 1: Define Your Niche and Expertise
    Status: [pending/in-progress/complete]
[ ] Step 2: Establish Market Positioning
    Status: [pending/in-progress/complete]
[ ] Step 3: Build Your Sales Pipeline
    Status: [pending/in-progress/complete]
[ ] Step 4: Create Your Delivery Framework
    Status: [pending/in-progress/complete]
[ ] Step 5: Scale the Practice
    Status: [pending/in-progress/complete]

Timeline: ______ weeks
Overall Status: [IN PROGRESS / COMPLETE]
```

**Adaptation notes:**
- Adjust timeline based on user's availability and prior experience
- Steps may be reordered if dependencies allow parallel execution
- Skip optional steps if time or budget is constrained

## Edge Cases

- **Niche too broad:** "Management consultant" is not a niche. Specificity commands premium rates and makes marketing easier.
- **All delivery, no sales:** Block time for business development every week, even when fully booked. An empty pipeline catches up fast.
- **Underpricing:** Consulting rates should reflect the value of the outcome, not the hours invested. Do not anchor to your previous salary divided by 2,000 hours.
- **No delivery framework:** Winging each engagement leads to inconsistent quality and makes scaling impossible.


### Timeline Considerations

This workflow is designed to be completed sequentially, but experienced users may parallelize some steps. Key dependencies:

- Each step builds on outputs from previous steps
- Steps involving external parties may have variable timelines
- Budget constraints may require phasing steps across multiple weeks or months
- Regular progress reviews between steps help catch issues early

## Example

**Input:** "I want to launch consulting practice and need a structured plan to follow step by step."

**Output:**

**Step 1 (consulting-practice):** Define Your Niche and Expertise -- produces concrete deliverables for this phase.

**Step 2 (personal-brand-architect):** Establish Market Positioning -- produces concrete deliverables for this phase.

**Step 3 (sales-coach):** Build Your Sales Pipeline -- produces concrete deliverables for this phase.

**Step 4 (consulting-practice):** Create Your Delivery Framework -- produces concrete deliverables for this phase.

**Step 5 (business-planner):** Scale the Practice -- produces concrete deliverables for this phase.

**Result:** User has a complete launch consulting practice plan with all deliverables produced, validated, and ready for implementation.
