---
name: legal
description: AI legal-document orchestrator for SMB owners and operators. Routes requests to 12 legal sub-skills - NDA, Terms of Service, Privacy Policy, generic service contract, GDPR / data-processing, employment agreement, refund policy, independent contractor, EULA, DMCA, cease-and-desist, equity grant. Templates only - not legal advice; outputs must be reviewed by a qualified attorney.
attribution:
  lineage: "Wayland Business Suite (Original)"
metadata:
  wayland:
    tags: [orchestrator, legal, smb, business]
---

> **⚠️ Important: Templates Only - Not Legal Advice**
>
> Outputs from this skill pack are **template documents and analytical frameworks** designed to help you structure legal-adjacent work - they are **NOT legal advice**, are **NOT a substitute for an attorney**, and may not be appropriate for your jurisdiction, industry, or specific situation. Laws vary by country, state, and locality, and templates that work in one context may be unenforceable, illegal, or harmful in another.
>
> **Before using ANY output from this skill pack:**
> - Have a qualified attorney licensed in your jurisdiction review the document
> - Verify that all clauses comply with applicable local, state, and federal law
> - Confirm that the document fits your specific business context, parties, and intended use
>
> Anthropic, Wayland, and the plugin authors disclaim all liability for use of these templates.

# /legal - Business Legal Orchestrator

Route any legal-template request to the right specialist skill. The orchestrator reads your instruction, picks the matching sub-skill, and delegates. Sub-skills are not registered as slash commands - they are reachable only through this orchestrator (or via explicit `skill_view("business-legal:<skill-name>")`).

## Verb → Sub-skill routing table

| Verb / keyword | Sub-skill dispatched | Example |
|---|---|---|
| `nda`, `non-disclosure`, `confidentiality` | `legal-nda` | `/legal nda mutual` |
| `tos`, `terms`, `terms-of-service`, `terms-of-use` | `legal-tos` | `/legal tos saas-product` |
| `privacy`, `privacy-policy` | `legal-privacy` | `/legal privacy mobile-app` |
| `contract`, `service-contract`, `sow`, `msa` | `legal-contract` | `/legal contract msa` |
| `contractor`, `consulting`, `independent-contractor`, `consulting-agreement`, `1099` | `legal-contractor` | `/legal contractor freelance-designer` |
| `gdpr`, `data-processing`, `dpa`, `ccpa` | `legal-gdpr` | `/legal gdpr eu-customers` |
| `employment`, `employment-agreement`, `offer-letter`, `at-will` | `legal-employment` | `/legal employment software-engineer` |
| `refund`, `refund-policy`, `return-policy` | `legal-refund-policy` | `/legal refund-policy ecommerce` |
| `eula`, `end-user-license`, `app-store-eula` | `legal-eula` | `/legal eula mobile-app` |
| `dmca`, `takedown`, `counter-notice`, `designated-agent`, `safe-harbor` | `legal-dmca` | `/legal dmca takedown youtube-video` |
| `cease-and-desist`, `c&d`, `c-and-d`, `demand-letter` | `legal-cease-and-desist` | `/legal cease-and-desist trademark` |
| `equity`, `equity-grant`, `stock-option`, `iso`, `nso`, `rsu`, `83b`, `83(b)` | `legal-equity-grant` | `/legal equity-grant senior-engineer-iso` |
| `help` | (this skill) | `/legal help` |

## Composite flows

- `/legal saas-launch <product>` - fans out `legal-tos`, `legal-privacy`, and `legal-refund-policy` in parallel for a complete SaaS public-facing legal pack
- `/legal new-hire <role>` - fans out `legal-nda` and `legal-employment` together for hiring kits
- `/legal vendor-onboard <vendor>` - runs `legal-contract` then `legal-nda` (mutual)

## Dispatch instructions

When the user invokes `/legal <verb> [args]`:

1. Match the verb to the routing table above (case-insensitive, accept hyphen or space).
2. Load the matched sub-skill via `skill_view("business-legal:<skill-name>")`.
3. Pass the full original instruction (verb + args) to the sub-skill.
4. **Hard-gate enforcement** - sub-skills enforce their own gates. The orchestrator MUST NOT silently default to "Delaware, USA" for missing jurisdiction. Each sub-skill decides whether jurisdiction is a hard gate (refuse-to-generate after one ask) or a soft default. The current rules:
   - **Hard gate (refuse if missing)**: `legal-nda` (template mode), `legal-tos`, `legal-privacy`, `legal-refund-policy`, `legal-contract`, `legal-contractor`, `legal-eula`, `legal-employment`, `legal-equity-grant`, `legal-gdpr` (DPA mode)
   - **Soft default with prominent flag**: `legal-dmca` (US-centric by design), `legal-cease-and-desist` (sender + recipient jurisdictions both required)
5. If the verb is ambiguous, ask one clarifying question before dispatching.
6. If the verb is not in the table, reply with the help table above.

Sub-skills are hidden from the auto-index. They are only reachable through this orchestrator or via `skill_view("business-legal:<skill-name>")`.

## Tooling

Skills in this pack use Wayland-mapped tools:

- Web research: `web_search`, `web_extract`
- File ops: `file_tools.read`, `file_tools.write`, `file_tools.edit`
- Shell: `terminal`
- Sub-agents: `delegate_task`
- Output paths: `build_report_path("business-legal", instruction)`

## Output discipline (every sub-skill)

Every generated document MUST end with the standard disclaimer footer block defined in each sub-skill's SKILL.md. Do not strip it. Do not summarize it. Reproduce it verbatim.

## Disclaimer (repeat on every output)

> _Templates only - not legal advice. Have an attorney licensed in your jurisdiction review every document before signing or distributing._
