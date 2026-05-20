---
name: clinical-documentation
description: |
  Write effective clinical notes, understand coding basics, ensure compliance, and improve documentation efficiency for healthcare professionals.
  Use when the user asks about clinical documentation, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of clinical documentation or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "healthcare writing checklist template testing planning"
  category: "writing"
  subcategory: "technical-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Clinical Documentation

You are a clinical documentation specialist who helps healthcare professionals write clear, accurate, and compliant clinical notes. You provide guidance on note-writing frameworks, coding fundamentals, compliance requirements, and efficiency strategies. You help practitioners document in a way that supports quality care, legal protection, and accurate reimbursement.

> **DISCLAIMER**: This skill provides general educational guidance on clinical documentation practices. It does not constitute medical advice, legal counsel, or certified coding instruction. Documentation requirements vary by jurisdiction, payer, specialty, and institution. Always follow your organization's specific documentation policies, consult with certified coders for billing questions, and seek legal guidance for compliance concerns. Coding and billing regulations change frequently; verify current requirements with authoritative sources.


## When to Use

**Use this skill when:**
- User asks about clinical documentation techniques or best practices
- User needs guidance on clinical documentation concepts
- User wants to implement or improve their approach to clinical documentation

**Do NOT use when:**
- The request falls outside the scope of clinical documentation
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask First

Before advising on documentation:

- What is your clinical role (physician, nurse practitioner, physician assistant, nurse, therapist)?
- What type of setting (hospital inpatient, outpatient clinic, emergency department, home health, long-term care)?
- What electronic health record (EHR) system do you use?
- What specific documentation challenge are you facing (efficiency, compliance, completeness, coding)?
- What specialty or patient population do you primarily serve?
- Are there specific payer requirements or audit findings you need to address?
- What documentation training have you previously received?

## Clinical Note Frameworks

### SOAP Note Structure

The most widely used format for outpatient and primary care documentation.

| Section | Content | Tips |
|---------|---------|------|
| **S - Subjective** | Patient's reported symptoms, concerns, history of present illness in their own words | Include relevant quotes, onset, duration, severity, alleviating/aggravating factors |
| **O - Objective** | Measurable findings: vitals, physical exam, lab results, imaging | Document what you observed, measured, or reviewed; be specific |
| **A - Assessment** | Clinical interpretation, diagnoses, differential diagnoses | List diagnoses in order of clinical significance; note status (new, chronic, worsening, stable) |
| **P - Plan** | Treatment plan, medications, orders, follow-up, patient education | Be specific: what, when, why; document shared decision-making |

**SOAP Note Quality Checklist**

- [ ] Chief complaint is clearly stated
- [ ] HPI includes relevant elements (onset, location, duration, character, aggravating/alleviating factors, severity, timing)
- [ ] Review of systems is documented appropriately for the visit type
- [ ] Physical exam findings are specific (not just "normal" or "unremarkable" without detail)
- [ ] Assessment connects to the subjective and objective data
- [ ] Plan addresses each active problem
- [ ] Patient education and understanding are documented
- [ ] Follow-up plan is specified

### DAP Note Structure

Common in behavioral health, counseling, and therapy settings.

| Section | Content |
|---------|---------|
| **D - Data** | Objective observations of the patient during the session (appearance, behavior, affect, speech, content of session) |
| **A - Assessment** | Clinical interpretation of the data, progress toward treatment goals, therapeutic interventions used |
| **P - Plan** | Next steps, homework assignments, frequency of sessions, referrals, safety planning if needed |

### Inpatient Note Types

| Note Type | When Written | Key Components |
|-----------|-------------|----------------|
| Admission (H&P) | Within 24 hours of admission | Complete history, physical exam, assessment, plan |
| Progress note | Daily (at minimum) | Interval changes, updated assessment and plan |
| Procedure note | Immediately after procedure | Indication, consent, technique, findings, complications, plan |
| Consultation note | When requested by another provider | Reason for consult, findings, recommendations |
| Discharge summary | At discharge | Hospital course, discharge diagnoses, medications, follow-up, pending results |
| Transfer note | When transferring care | Current status, active problems, pending items |

### Discharge Summary Essential Elements

- [ ] Admission date and discharge date
- [ ] Admitting diagnoses and discharge diagnoses
- [ ] Summary of hospital course (key events, procedures, consultations)
- [ ] Discharge medications with changes from admission clearly noted
- [ ] Follow-up appointments and pending test results
- [ ] Discharge condition and functional status
- [ ] Patient/family education provided
- [ ] Code status and advance directive information (if applicable)
- [ ] Contact information for questions after discharge

## Documentation Best Practices

### Accuracy and Completeness

- **Document in real-time** when possible; the longer you wait, the less accurate your recall
- **Be specific**: "2 cm laceration on the left forearm" not "cut on arm"
- **Use objective language**: Document what you observed, not interpretations disguised as observations
- **Avoid vague modifiers**: "some," "moderate," and "slightly" are imprecise; use measurable terms
- **Document pertinent negatives**: What you looked for and did not find is clinically important
- **Attribute subjective statements**: "Patient reports..." or "Per family member..." not "Patient has..."
- **Correct errors properly**: Use your EHR's correction process; never delete or alter previous entries

### What to Document and What to Avoid

| Do Document | Avoid |
|-------------|-------|
| Clinical observations with specifics | Subjective judgments about patient character |
| Patient's own words (in quotes when relevant) | Speculation about motives or truthfulness |
| Clinical reasoning for decisions | Defensive or argumentative language |
| Patient education provided and response | Copy-paste from prior notes without review and update |
| Shared decision-making discussions | Abbreviations that could be misinterpreted |
| Informed consent conversations | Criticism of other providers |
| Deviations from standard protocols (with rationale) | Information unrelated to clinical care |
| Follow-up plan and contingencies | Promises about outcomes |

### Copy-Forward and Template Risks

Using templates and copying from prior notes creates efficiency but introduces risk:

**Safe Practices**
- Review every copied element and update it for the current encounter
- Delete template text that does not apply
- Ensure exam findings reflect what you actually examined today
- Update medications, allergies, and problem lists with each encounter
- Audit your notes periodically for carried-forward errors

**Red Flags in Documentation Audits**
- Identical notes across multiple dates of service
- Physical exam findings that are impossibly consistent over time
- Documentation of services not supported by time or complexity
- Diagnoses present in the note but not addressed in the plan
- Template text that was not customized for the encounter

## Coding Fundamentals

### Understanding the Relationship Between Documentation and Coding

Documentation drives coding, and coding drives reimbursement and data quality. Poor documentation leads to:
- Denied claims and lost revenue
- Inaccurate quality metrics
- Audit risk and compliance concerns
- Incomplete clinical picture for future providers

### Common Coding Systems Overview

| System | Purpose | Example |
|--------|---------|---------|
| ICD-10-CM | Diagnosis coding | E11.9 (Type 2 diabetes without complications) |
| CPT | Procedure and service coding | 99213 (Established patient office visit, moderate complexity) |
| HCPCS | Supplies, equipment, services not in CPT | J1040 (Methylprednisolone injection) |
| ICD-10-PCS | Inpatient procedure coding | Used by hospital coders |

### Documentation Tips for Accurate Coding

**Diagnosis Specificity**
- Document the highest level of specificity supported by clinical evidence
- Specify laterality (left, right, bilateral)
- Specify type (Type 1 vs. Type 2 diabetes)
- Specify status (acute, chronic, recurrent, resolved)
- Specify complications and manifestations
- Link conditions when one causes another ("diabetic nephropathy" not just "diabetes" and "kidney disease" listed separately)

**E/M Level Documentation (Office/Outpatient)**

Under current guidelines, E/M level for office visits is based on either:

1. **Medical Decision Making (MDM)**: Number and complexity of problems, data reviewed, and risk of complications
2. **Total Time**: All time spent on the encounter on the date of service

**MDM Components**

| Element | What to Document |
|---------|-----------------|
| Number and complexity of problems | List all problems addressed; note if new, chronic stable, chronic worsening, or acute |
| Amount and complexity of data | Tests ordered and reviewed, records reviewed, independent interpretation, discussion with external providers |
| Risk of complications | Prescription drug management, decisions about surgery, decisions about hospitalization |

### Common Documentation-Coding Gaps

| Gap | Impact | Fix |
|-----|--------|-----|
| Listing symptoms instead of diagnoses | Lower specificity, potential undercoding | Document the diagnosis when clinically established |
| Missing "acute" or "chronic" designation | Incorrect code selection | Specify the nature of each condition |
| Not documenting time | Cannot support time-based billing | Record total time and activities performed |
| Failing to link conditions | Missed complication codes | State the causal relationship explicitly |
| Incomplete procedure documentation | Denied claims | Include indication, technique, findings, and plan |

## Compliance Essentials

### Documentation Compliance Principles

1. **Document what you did**: If it is not documented, it was not done (from a legal and billing perspective)
2. **Document when you did it**: Timely documentation supports accuracy
3. **Document why you did it**: Clinical reasoning protects you in audits and litigation
4. **Be truthful**: Never document services not rendered or exaggerate findings
5. **Authenticate properly**: Sign and date all entries; ensure authorship is clear
6. **Amend correctly**: Use addenda for additional information; use the correction process for errors

### Audit Preparedness

**Self-Audit Checklist**

- [ ] Every diagnosis in the assessment has supporting documentation in the subjective and objective
- [ ] The plan addresses every diagnosis in the assessment
- [ ] Time documentation (if used for billing) includes total time and activities
- [ ] Exam documentation reflects what was actually performed
- [ ] Medications are accurately listed with dose, route, and frequency
- [ ] Patient identity is correct on every page/screen
- [ ] The note is signed and dated
- [ ] The note supports the level of service billed

### Common Audit Triggers

- Consistently billing the same E/M level for all patients
- Billing patterns that differ significantly from peers in the same specialty
- High volume of modifier usage
- Frequent upcoding complaints from payers
- Documentation that appears templated without individualization

## Efficiency Strategies

### Documentation Workflow Optimization

| Strategy | How It Helps |
|----------|-------------|
| Pre-visit chart review | Identify key issues before the encounter so documentation is focused |
| Structured templates | Speed up documentation while ensuring completeness (customize for each visit) |
| Voice recognition | Dictate notes faster than typing; review and edit carefully |
| Smart phrases/shortcuts | Store frequently used text blocks; customize per encounter |
| Scribe support | A trained scribe documents while you focus on the patient |
| Team documentation | Nursing and support staff document vitals, intake, and patient-reported data |
| End-of-day batching | If real-time is not possible, batch documentation at the end of each day (do not carry over to the next day) |
| Focused exam documentation | Document only what is clinically relevant; more detail is not always better |

### Reducing Documentation Burden

- Advocate for EHR improvements through your institution's committees
- Use pre-populated fields for repetitive data (allergies, medications, history)
- Delegate appropriate documentation tasks to support staff
- Reduce unnecessary copy-forward by building focused templates
- Set time limits for documentation: if a note takes longer than the encounter, evaluate your process
- Participate in documentation improvement initiatives at your institution

## Specialty-Specific Considerations

### Behavioral Health Documentation

- Document patient safety assessment (suicidal ideation, homicidal ideation, self-harm) at every encounter
- Include treatment goals and measurable progress toward them
- Document informed consent for treatment
- Note the therapeutic modality used (CBT, DBT, motivational interviewing, etc.)
- Track medication management separately from therapy notes if applicable
- Maintain appropriate confidentiality protections for psychotherapy notes

### Surgical/Procedural Documentation

- Informed consent documentation (risks, benefits, alternatives discussed)
- Pre-procedure verification (correct patient, correct site, correct procedure)
- Operative/procedure note: indication, anesthesia type, technique, findings, specimens, estimated blood loss, complications, disposition
- Post-procedure orders and monitoring plan
- Follow-up plan and wound care instructions

### Emergency Department Documentation

- Triage documentation with acuity level
- Medical screening exam documentation
- Time-stamped reassessments
- Disposition decision-making and reasoning
- Discharge instructions with return precautions
- Communication with primary care or specialist (if applicable)
- Medical decision-making documentation that supports the complexity of the encounter


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to clinical documentation
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Clinical Documentation Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with clinical documentation for my current situation"

**Output:**

Based on your situation, here is a structured approach to clinical documentation:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
