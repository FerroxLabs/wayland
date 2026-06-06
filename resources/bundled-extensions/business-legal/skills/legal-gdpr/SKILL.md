---
name: legal-gdpr
description: Generate a GDPR / data-processing assessment, DPA template (controller-to-processor), or sub-processor disclosure. Covers Article 28 obligations, SCCs for international transfers, DPIA triggers, and data-subject-rights workflow. Templates only - not legal advice. Have a privacy attorney review before signing.
slash_command: false
attribution:
  lineage: "Wayland Business Suite (Original)"
metadata:
  wayland:
    tags: [gdpr, privacy, legal, smb, business]
---

> **Templates only - not legal advice.** Have an attorney review before signing or distributing.

# Legal - GDPR / Data-Processing Toolkit

Three modes:

1. **Assess mode** - answer "is this data flow GDPR-compliant?" with a structured analysis
2. **DPA mode** - generate a Data Processing Agreement template (Article 28-compliant)
3. **DPIA mode** - assess whether a Data Protection Impact Assessment is required, and scaffold one if so

> **Important**: GDPR is enforced by 27 different national supervisory authorities, each with their own guidance. This skill produces structured outputs, not advice. A privacy attorney must review.

## Required inputs (ask upfront)

1. **Jurisdiction** - primary country + state/province (default flagged: EU member state)
2. **Industry** - affects special category data, retention requirements
3. **Mode** - assess / DPA / DPIA
4. **Role** - controller / processor / joint-controller
5. **User geography** - which EU/UK regions hold data subjects? Are non-EU subjects involved?
6. **Data categories** - basic / special category (Art. 9) / criminal-conviction (Art. 10) / children
7. **Cross-border transfers** - does data leave the EEA? to which countries? under what mechanism?
8. **Sub-processors** - list (name, location, purpose)
9. **Retention** - by category

## Assess mode

### Step 1: Map the data flow

Produce a table:

| Field | Detail |
|---|---|
| Personal data category | (e.g., name, email, IP, health) |
| Source | Direct / third party / public |
| Lawful basis | Consent / contract / legal obligation / vital interests / public task / legitimate interests |
| Purpose | What you use it for |
| Recipients | Internal teams, sub-processors, third-party recipients |
| Retention | Period + deletion trigger |
| International transfer? | Yes/no; mechanism if yes |
| Special category? | Yes (Art. 9) / no |
| Children? | Yes/no |

### Step 2: Run the compliance checks

For each row, evaluate:

- **Lawful basis adequacy**: is the chosen basis valid for the purpose? (e.g., consent for marketing must be opt-in, freely-given, specific, informed, unambiguous; legitimate-interests balancing test must be documented)
- **Purpose limitation**: is data used only for the stated purpose, or repurposed?
- **Data minimization**: is the data collected the minimum necessary?
- **Accuracy / rectification**: is there a process to correct?
- **Storage limitation**: retention defined and enforced?
- **Integrity / confidentiality**: security measures appropriate?
- **Accountability**: documented in RoPA (Art. 30)?
- **Transparency**: disclosed in the privacy notice?
- **DSR rights**: workflow exists for access / erasure / portability / restriction / objection / automated-decision rights?
- **Children**: parental consent (Art. 8) under 16 (varies 13-16 by member state)?
- **Special category**: explicit consent or other Art. 9(2) basis?

### Step 3: Output the assessment

Save to `build_report_path("business-legal", "gdpr-assess-<flow>-<date>.md")`. Include:

- Executive summary (1-2 sentences: COMPLIANT / GAPS / NON-COMPLIANT)
- Data flow map (Step 1 table)
- Compliance check (Step 2 results, with severity per gap)
- Remediation plan (priority order)
- DPIA recommendation (yes/no + rationale)
- Footer (disclaimer block - see below)

## DPA mode

### Step 1: Determine direction

DPAs flow controller → processor. Confirm which side the user is on. If they're a processor (e.g., a SaaS company taking customer data), they need an "outbound" DPA template they offer to customers. If a controller (e.g., a business buying SaaS), they need a "vendor DPA" template they require sub-processors to sign.

### Step 2: Generate the DPA

Required Article 28 elements:

1. **Subject matter and duration** of processing
2. **Nature and purpose** of processing
3. **Type of personal data** processed
4. **Categories of data subjects**
5. **Obligations and rights of controller**
6. **Processor obligations**:
   - Process only on documented controller instructions
   - Confidentiality of processing personnel
   - Implement appropriate technical and organizational measures (Art. 32)
   - Engage sub-processors only with controller's prior written authorization (specific or general with right to object)
   - Assist controller with DSRs
   - Assist controller with security, breach notification, DPIA, and prior consultation obligations
   - Delete or return data at end of services (controller's choice)
   - Provide controller with information necessary to demonstrate compliance + allow audits
7. **Sub-processor terms** (flow-down: same data-protection obligations)
8. **International transfer mechanism** - append SCCs (2021/914) module 2 or 3 as applicable; UK Addendum if UK data; Swiss Addendum if Swiss data
9. **Security measures** - Annex II (technical and organizational measures)
10. **Data breach notification** - processor must notify controller "without undue delay" (recommend 24-48h)

### Step 3: Save

Save to `build_report_path("business-legal", "dpa-<counterparty>-<date>.md")`.

## DPIA mode

### Step 1: Trigger check

DPIA is mandatory under Art. 35 when processing is "likely to result in a high risk." Mandatory triggers:

- Systematic and extensive evaluation / profiling with legal or similarly significant effects
- Large-scale processing of special categories or criminal-conviction data
- Systematic monitoring of publicly accessible areas at scale

National supervisory authorities have published "DPIA always required" lists (e.g., CNIL, ICO, DSK). Cross-check the user's flow.

If no mandatory trigger but processing is novel / large-scale / uses new tech / involves vulnerable groups, recommend DPIA as best practice.

### Step 2: Scaffold the DPIA

Required content:

1. **Description of processing** (purposes, categories, recipients, retention, transfers)
2. **Necessity and proportionality** - why this data, why this scope, alternatives considered
3. **Consultation** - DPO, data subjects (where appropriate), supervisory authority (Art. 36 prior consultation if residual risk is high)
4. **Risks to data subjects** - likelihood × severity for each identified risk
5. **Measures to address risks** - technical and organizational
6. **Sign-off** - DPO and accountable executive

### Step 3: Save

Save to `build_report_path("business-legal", "dpia-<flow>-<date>.md")`.

## Cross-border transfer cautions

After Schrems II (CJEU 2020), every transfer of EU personal data to a non-adequacy country requires:

- A valid transfer mechanism (SCCs 2021/914, BCRs, derogations Art. 49)
- A Transfer Impact Assessment (TIA) documenting that the destination's law and practice do not undermine the SCC protections
- Supplementary measures where required (encryption, pseudonymization, contractual additions)

For US transfers: the EU-US Data Privacy Framework (DPF, July 2023) restored adequacy for certified US importers. UK and Swiss extensions exist but are separate frameworks.

These are technical and shifting - flag prominently for counsel.

## Output footer (REQUIRED on every generated document)

End every generated GDPR document with this block, verbatim:

```
---
**DRAFT - NOT LEGAL ADVICE**

This document was generated as a starting template. It has not been reviewed by an attorney and may not comply with applicable law in your jurisdiction. Before signing, distributing, or relying on this document, you must:

1. Have a qualified attorney licensed in your jurisdiction review and revise it.
2. Verify all clauses are enforceable under applicable law.
3. Confirm it fits your specific situation, parties, and use case.

Generated by Wayland business-legal plugin. No warranty, express or implied.
```

---

> _Templates only - not legal advice. GDPR enforcement is jurisdiction-by-jurisdiction; engage qualified privacy counsel._
