---
name: support
description: Customer support orchestrator. Routes to the right sub-skill based on your verb - reply, kb-article, faq, escalation, refund-script, sla-review, nps-analysis, churn-investigate, or report.
argument-hint: "<verb> [context]"
attribution:
  lineage: "Wayland Business Suite (Original)"
metadata:
  wayland:
    tags: [orchestrator, customer-support, smb, business]
---

# /support - Customer Support Orchestrator

> **Note:** Support templates are starting points. Refund-script and SLA-review outputs may create binding commitments - review against your actual policies and applicable consumer law (FTC, EU CRD, state UDAPs) before sending.

Central entry point for all customer support work. Parse the user's verb and dispatch to the appropriate sub-skill.

## Usage

```
/support <verb> [context or ticket content]
```

## Verb → Sub-skill Routing Table

| Verb(s) | Dispatches to | What it does |
|---|---|---|
| `reply`, `draft`, `respond`, `response` | `support-reply` | Draft a professional customer-facing response |
| `kb-article`, `kb`, `article`, `knowledge-base` | `support-kb-article` | Create a publish-ready KB article from a resolved issue |
| `faq`, `faqs`, `faq-entry` | `support-faq` | Generate FAQ entries from common questions or ticket patterns |
| `escalation`, `escalate`, `escalate-to-eng`, `escalate-to-leadership` | `support-escalation` | Package a structured escalation brief for engineering, product, or leadership |
| `refund`, `refund-script`, `compensation`, `credit` | `support-refund-script` | Generate a refund or compensation response script |
| `sla`, `sla-review`, `sla-audit` | `support-sla-review` | Audit open tickets and queue against SLA targets |
| `nps`, `nps-analysis`, `survey`, `feedback-analysis` | `support-nps-analysis` | Analyze NPS or CSAT feedback for themes and action items |
| `churn`, `churn-investigate`, `at-risk`, `retention` | `support-churn-investigate` | Investigate churn signals for an account and recommend interventions |
| `report`, `summary`, `metrics` | `support-report` | Generate a support health summary with key metrics |

## Dispatch Logic

1. Read the user's input and identify the leading verb or intent keyword.
2. Match it against the routing table above (fuzzy match on synonyms is fine).
3. Load and execute the matched sub-skill with the remaining input as context.
4. If no verb matches, ask: "Which support task would you like to do? reply / kb-article / faq / escalation / refund-script / sla-review / nps-analysis / churn-investigate / report"

## Examples

```
/support reply "Customer says their export has been failing for 2 days"
/support escalation API returning 500s for Acme Corp - they're threatening to churn
/support kb-article Ticket #4521 - SSO config issue resolved
/support faq common questions about webhook setup
/support refund Customer was charged twice this month
/support sla-review
/support nps-analysis [paste of NPS verbatims]
/support churn-investigate Acme Corp - 3 unresolved tickets, no logins in 14 days
/support report
```

## Notes for Sub-skill Authors

- Sub-skills are hidden from the auto-index (`slash_command: false`). Users reach them only via this orchestrator or explicit qualified loads (`business-support:<skill>`).
- Output paths: use `build_report_path("business-support", instruction)` for any file output.
- Tool remap in all sub-skills: `web_extract` (not WebFetch), `web_search` (not WebSearch), `terminal` (not Bash), `file_tools.*` (not Read/Write/Edit), `delegate_task` (not Agent).
