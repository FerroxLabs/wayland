---
name: wayland-support-ticket-triage
description: >-
  Triage one inbound support ticket end to end: classify it, draft a reply, run
  an escalation check, then send or escalate.

  Use when the user wants a structured, multi-step process to triage a single
  support ticket from raw inbound to a sent reply or a clean escalation.

  Do NOT use for a one-line canned answer or a quick classification that one
  atomic skill can answer.
license: Apache-2.0
type: workflow
skills: "support-reply support-escalation"
metadata:
  author: wayland
  version: 1.0.0
  tags: support triage ticket reply escalation step-by-step
  category: support
  depends: "support-reply support-escalation"
---
# Triage a Support Ticket

**Estimated time:** 10-15 minutes

This workflow triages a single inbound support ticket: it classifies the ticket,
drafts a reply, runs an escalation check, and ends with the user either sending
the reply or marking it for escalation. It is interactive: the user reviews and
optionally refines the draft reply before the escalation check.

## Steps

**Step 1: Kick Off and Capture the Ticket** (uses: support-reply)

Ask the user to paste the ticket: subject, body, and any context they have. Ask
which product or service it is about. Capture the ticket text verbatim. Do not
proceed until you have the ticket body and the product/service it concerns.

- Input: user-pasted ticket subject, body, context, product/service
- Output: ticket
- Key focus: get the full ticket text plus the product context before classifying

**Step 2: Infer Classification** (uses: support-reply)

Using the support-reply skill, infer the ticket classification: kind (bug,
question, billing, feature request, etc.), urgency, owner, and SLA. State the
inferred classification and the reasoning behind it. Invite the user to override
if they know the customer's tier or contract specifics. Capture the resulting
classification.

- Input: ticket from Step 1
- Output: classification (kind / urgency / owner / SLA)
- Key focus: show the reasoning so the user can correct tier and contract details

**Step 3: Build the Reply** (uses: support-reply)

Using the support-reply skill with the ticket and the classification, draft a
reply to the customer. Show the full draft reply to the user.

- Input: ticket from Step 1, classification from Step 2
- Output: draft reply
- Key focus: match tone and content to the inferred kind and urgency

**Step 4: Review the Reply** (uses: support-reply)

Present the draft reply and ask the user whether to refine it or proceed to the
escalation check. If the user wants changes, gather specific refinement feedback
and re-run Step 3 with that feedback plus the prior reply and the ticket, looping
up to 2 times until the user is satisfied. When the user is satisfied, advance.

- Input: draft reply from Step 3, user decision and refinement feedback
- Output: approved draft reply
- Key focus: loop on the reply only until the user approves (max 2 iterations)

**Step 5: Escalation Check** (uses: support-escalation)

Using the support-escalation skill in escalation-check mode with the ticket, the
classification, and the approved reply, determine whether this ticket should be
escalated and why. Show the escalation status to the user.

- Input: ticket from Step 1, classification from Step 2, approved reply from Step 4
- Output: escalation status
- Key focus: surface any SLA-breach, churn-risk, or contractual triggers for escalation

**Step 6: Final Review and Send or Escalate** (uses: support-escalation)

Present the escalation status and ask the user whether to send the reply or mark
the ticket for escalation. Record the final decision. Assemble the triage record
with these sections: Ticket, Classification, Draft Reply, Escalation Status, Final
Decision.

- Input: escalation status from Step 5, approved reply from Step 4, user decision
- Output: triage record (assembled), final decision
- Key focus: capture the send-vs-escalate decision and assemble the record
