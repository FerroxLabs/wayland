---
name: negotiate-raise
description: |
  Guides the user through a structured raise negotiation process from
  performance documentation through follow-up conversation, chaining 4 atomic
  skills in sequence. Covers timing (annual review vs. ad-hoc), leverage type
  (internal-only vs. competing offer), and outcome handling (full approval,
  partial offer, or denial). Use when the user wants to negotiate a raise or
  promotion at their current employer. Do NOT use for job offer salary
  negotiation (use land-new-job workflow), freelance rate increases (use
  start-freelancing workflow), or career pivots (use switch-careers workflow).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "salary-negotiation career step-by-step"
  category: "career"
  depends: "performance-review-prep promotion-case-builder salary-negotiation-script workplace-conversation-prep"
  disclaimer: "none"
  difficulty: "intermediate"
---

# Negotiate a Raise

**Estimated time:** 2-4 weeks (depending on review cycle timing and manager availability)

This workflow orchestrates 4 career-development skills into a raise negotiation pipeline. The process builds from evidence collection through script preparation to the actual conversation and follow-up. Each step produces artifacts that strengthen the next: performance documentation feeds the promotion case, which feeds the negotiation script, which feeds the follow-up conversation plan. The workflow handles the three most common scenarios: annual review cycle, ad-hoc timing, and competing offer leverage.

## When to Use

- User wants to negotiate a salary raise at their current employer
- User is preparing for an annual performance review and wants to maximize their compensation outcome
- User has received a competing offer and wants to use it as leverage for a raise
- User believes they are underpaid relative to market rate and wants a structured approach to addressing it
- User is seeking both a title promotion and a salary increase simultaneously
- Do NOT use when: user is negotiating salary for a new job offer (use `land-new-job` workflow Step 6), user wants to increase freelance rates with clients (use `start-freelancing` workflow), user wants to switch to a completely different career (use `switch-careers` workflow), user is in their first 6 months at a company (typically too early for raise negotiations)

## Prerequisites

Before starting this workflow, ensure:

1. **Minimum tenure:** The user has been in their current role for at least 6 months, or has had a significant scope expansion since their last compensation adjustment.
2. **Performance evidence exists:** The user can point to specific accomplishments, metrics, or projects that demonstrate they have exceeded expectations. If they cannot, Step 1 helps them find and frame this evidence -- but some evidence must exist.
3. **Manager relationship is functional:** The user can have a professional conversation with their direct manager. If the relationship is severely strained, the user should address that separately before negotiating compensation.
4. **Market rate awareness:** The user has a rough sense of what their role pays at comparable companies. Step 2 will sharpen this, but starting with zero market knowledge makes the process harder.

## Steps

**Step 1: Document Performance and Contributions** (uses: performance-review-prep)

Build a comprehensive record of the user's accomplishments, impact, and growth since their last compensation review. This is the evidence foundation that everything else builds upon.

- Input: User's role title, tenure, list of projects and responsibilities, any performance reviews from the past year, and any metrics they track or can access
- Output: Structured performance summary with quantified achievements, scope expansion evidence, and above-and-beyond contributions organized by impact area
- Key focus: Quantify everything possible. "Led the migration project" becomes "Led database migration that reduced query latency by 40% and saved $15K per month in infrastructure costs." Identify scope creep that was never formally recognized -- responsibilities that grew beyond the original job description without a title or pay adjustment.

**Step 2: Build the Promotion and Raise Case** (uses: promotion-case-builder)

Transform the performance documentation into a formal case that justifies a specific compensation increase. This includes market rate research, peer benchmarking, and a clear ask with supporting rationale.

- Input: Performance summary from Step 1, current compensation details (base, bonus, equity), target compensation range based on research
- Output: One-page promotion case document with: current vs. market compensation gap, specific accomplishments tied to business impact, scope expansion evidence, and a clear ask (specific dollar amount or percentage, not a vague "more")
- Key focus: Frame the case around business value delivered, not personal need. "I delivered $200K in cost savings and my compensation is 15% below market for this scope" is stronger than "I need more money because my expenses increased." Include peer benchmarking if available -- what do people at the same level, same company, with similar scope earn?

**Step 3: Prepare the Negotiation Script** (uses: salary-negotiation-script)

Write a conversation script with specific talking points, anticipated objections, and responses. The script covers the opening statement, the ask, objection handling, and closing.

- Input: Promotion case from Step 2, knowledge of the user's manager's communication style, company raise policies or constraints the user is aware of, and whether the user has a competing offer
- Output: Conversation script with: opening framing (positive, forward-looking), the specific ask, 5 pre-written responses to common objections ("budget is tight," "let's revisit next quarter," "that's above our bands"), and a graceful close that preserves the relationship regardless of outcome
- Key focus: Practice the script out loud before the meeting. The negotiation should feel like a professional conversation, not a confrontation. Prepare three outcomes: ideal (full ask), acceptable (partial), and walk-away threshold. If the user has a competing offer, the script should mention it factually ("I've received an offer at $X") without framing it as a threat.

**Step 4: Plan the Follow-Up Conversation** (uses: workplace-conversation-prep)

Regardless of the negotiation outcome, prepare a follow-up plan. If the raise was approved, confirm details in writing. If it was partially approved or denied, establish a clear timeline and criteria for re-evaluation.

- Input: Outcome of the negotiation conversation, any commitments made by the manager, and the user's plan if the outcome was unsatisfactory
- Output: Follow-up email template confirming the outcome, a timeline document for next review (if raise was denied or deferred), and a decision framework for whether to accept the outcome, escalate, or begin an external job search
- Key focus: Always confirm verbal agreements in writing within 24 hours. "Per our conversation, I understand my base salary will increase to $X effective [date], and we will revisit the Senior title in Q3 during the next review cycle." If denied, the follow-up should establish specific measurable criteria: "What specific outcomes would you need to see by [date] to approve this increase?"

## Decision Points

- **Before Step 1:** If the user is within their company's annual review window (typically 4-8 weeks before reviews), proceed normally -- the timing is optimal. If the user is outside the review cycle, they must decide: wait for the cycle (lower risk, but months of delay) or request an ad-hoc meeting (higher friction, but faster resolution). Ad-hoc timing is justified when the user has had a significant scope change, received a competing offer, or discovered a large market rate gap.

- **Before Step 3:** If the user has a competing offer, the negotiation script shifts significantly. The competing offer provides concrete leverage but must be used carefully. The script should present it as information, not as a threat. If the user does not have a competing offer, the case relies entirely on internal performance and market data from Step 2, which is often sufficient but may require more patience.

- **Before Step 3:** If the user is seeking a promotion (title change) in addition to a raise, the case must address both the compensation gap and the role-level gap separately. Some companies can approve raises faster than promotions (different approval chains). The script should be prepared to accept a raise now with a promotion timeline, or a promotion now with a raise to follow.

- **After Step 3:** If the manager defers the decision ("Let me check with HR," "I need to discuss with my leadership"), this is common and not a rejection. The follow-up plan in Step 4 becomes critical -- set a specific date for the answer and confirm it in writing.

## Failure Handling

- **Step 1 fails (insufficient performance evidence):** If the user genuinely cannot identify quantifiable accomplishments or scope expansion, the raise negotiation is premature. Instead of proceeding, the user should spend 2-3 months deliberately tracking their contributions with metrics, then restart the workflow. Attempting to negotiate without evidence results in a weak case and potentially damages credibility for future requests.

- **Raise denied outright:** If the manager says no without offering an alternative timeline, the follow-up in Step 4 should establish re-entry criteria: "I understand. What specific goals or outcomes should I achieve for us to revisit this in [3-6 months]?" Get the criteria in writing. If the manager cannot articulate criteria, or if the criteria seem designed to be unmeetable, this is a signal that the user may need to explore external options (transition to the land-new-job workflow).

- **Partial offer (less than asked):** If the manager offers a raise below the user's target but above their minimum, Step 4 helps evaluate whether to accept. Consider: is the gap closable with a follow-up in 6 months? Does the partial raise move the user closer to market rate? Is the relationship and role otherwise strong enough to justify staying at slightly below target? Accept with a documented follow-up timeline, or counter with a specific middle ground.

- **Manager defers indefinitely:** If the conversation keeps getting postponed or the manager agrees in principle but never follows through, the user needs to escalate. Step 4 should include an escalation plan: first, document the pattern ("We discussed this on [dates], and I was told [X] each time"). Second, determine whether HR or skip-level management is an appropriate escalation path. Third, set a personal deadline for resolution before beginning an external search.

- **User wants to change direction mid-workflow:** If during Step 2 the user discovers their market value is significantly higher than they realized, they may decide to pursue external offers instead of (or in addition to) an internal raise. This is a natural transition to the land-new-job workflow. The performance documentation from Step 1 and market research from Step 2 transfer directly.

## Output Format

```
## Raise Negotiation Plan: [User's Role Title]

### Step 1: Performance Documentation
- Review period: [start date] to [current date]
- Key accomplishments: [count]
- Quantified metrics: [list top 3 with numbers]
- Scope expansion evidence: [yes/no, with summary]

### Step 2: Raise Case
- Current compensation: $[amount]
- Market rate range: $[low] - $[high]
- Specific ask: $[amount] ([percentage]% increase)
- Justification summary: [one-sentence business case]

### Step 3: Negotiation Script
- Opening framing: [positive, forward-looking statement]
- The ask: $[amount] justified by [top 3 reasons]
- Objection responses prepared: [count]
- Walk-away threshold: $[minimum acceptable]
- Competing offer leverage: [yes/no]

### Step 4: Follow-Up Plan
- Outcome: [approved / partial / denied / deferred]
- Confirmed in writing: [yes / pending]
- Next review date: [date]
- Re-evaluation criteria: [specific measurable goals]
```

## Edge Cases

- **User has been at the company less than 1 year:** Raise negotiations this early are uncommon and carry higher risk of appearing presumptuous. The workflow should proceed only if the user has had a significant, documented scope change (e.g., team lead responsibilities added). In Step 2, the case must heavily emphasize scope expansion over tenure-based arguments.

- **User is in a pay-freeze or company-wide budget cut period:** Step 2 should acknowledge the constraint and shift the ask to non-monetary compensation: title change, additional PTO, flexible schedule, professional development budget, or equity. Step 3 script reframes: "I understand the current budget constraints. Can we discuss non-salary adjustments that reflect my expanded contributions?"

- **User has a competing offer they do not intend to accept:** Using a competing offer as leverage when the user has no intention of accepting it is risky -- if the employer calls the bluff by saying "take the other offer," the user loses credibility. Step 3 should only incorporate competing offer leverage if the user is genuinely willing to leave.

- **User works in a union or collective bargaining environment:** Raise negotiations may be constrained by union agreements. Verify whether individual negotiation is possible before proceeding. If not, this workflow does not apply -- the user should work through their union representative.

- **User recently received a negative performance review:** Negotiating a raise immediately after negative feedback undermines the case. The user should address the feedback first, demonstrate improvement for 3-6 months, then restart this workflow with the improvement trajectory as part of the Step 1 evidence.

- **User's manager is new or about to change:** If the decision-maker does not have firsthand knowledge of the user's contributions, Step 1 documentation becomes even more critical. Include peer testimonials, project records, and any written feedback from the previous manager.

## Expected Outcome

When this workflow is complete, the user will have:

1. A structured performance summary documenting their quantified contributions and scope expansion
2. A formal promotion and raise case with market rate data and a specific compensation ask
3. A rehearsed negotiation script with objection responses and outcome scenarios
4. A follow-up plan with email templates, timeline documentation, and next-step decision framework
5. Either an approved raise with written confirmation, or a clear timeline and criteria for re-evaluation


### Timeline Considerations

This workflow is designed to be completed sequentially, but experienced users may parallelize some steps. Key dependencies:

- Each step builds on outputs from previous steps
- Steps involving external parties may have variable timelines
- Budget constraints may require phasing steps across multiple weeks or months
- Regular progress reviews between steps help catch issues early

### Success Indicators

Track these signals to confirm the workflow is on track:

- Each step produces a concrete, reviewable deliverable
- User confidence increases as steps are completed
- Deliverables from early steps remain valid as later steps are executed
- No critical assumptions from earlier steps are invalidated
- External feedback (where applicable) is incorporated before proceeding


### Timeline Considerations

This workflow is designed to be completed sequentially, but experienced users may parallelize some steps. Key dependencies:

- Each step builds on outputs from previous steps
- Steps involving external parties may have variable timelines
- Budget constraints may require phasing steps across multiple weeks or months
- Regular progress reviews between steps help catch issues early

## Example

**Input:** "I've been a senior software engineer for 18 months. My responsibilities have grown significantly since I was hired -- I now lead a team of 3 and own the architecture for our payment system. My annual review is in 6 weeks and I want to negotiate a raise from $145K to $165K."

**Output:**

**Step 1 (performance-review-prep):**
The user documents: led payment system architecture redesign (reduced processing errors by 60%), mentored 3 junior engineers (2 promoted within the year), led incident response for the Q2 outage (resolved in 4 hours vs. 12-hour average), and took over team lead responsibilities without a title change 8 months ago. Each accomplishment is tied to a business metric.

**Step 2 (promotion-case-builder):**
Market research shows senior engineers with team lead responsibilities at comparable companies earn $160-180K. The promotion case presents: current salary ($145K) is 10-17% below market for the scope of work being performed. The document highlights the gap between the original senior engineer job description and the user's current responsibilities (team leadership, architecture ownership, incident response lead).

**Step 3 (salary-negotiation-script):**
The script opens with: "I want to discuss my compensation in the context of how my role has evolved over the past 18 months." It presents the specific ask ($165K, which is mid-range for the market research) justified by the three strongest accomplishments. Objection responses prepared for: "Budget is tight this cycle" (response: propose a smaller immediate increase with a scheduled catch-up), "You're already well-compensated" (response: present market data), and "Let's revisit after Q1" (response: "I'd like to understand what specific criteria would make Q1 different").

**Step 4 (workplace-conversation-prep):**
The manager approves a raise to $158K (partial -- below $165K target but above $145K current). The follow-up email confirms: "$158K effective [date], with a re-evaluation for the remaining gap in Q3 contingent on [specific criteria the manager named]." The user also documents the conversation for their records in case the Q3 follow-up does not materialize.

**Result:** The user secured a $13K raise (9% increase) with a documented path to the remaining $7K within 6 months, all supported by evidence-based documentation that strengthens their position for future negotiations.
