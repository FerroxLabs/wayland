---
name: hr-handbook
description: Generate employee handbook sections covering required-by-law policies (EEO, anti-harassment, ADA accommodation, FMLA, lactation, voting/jury/military, pay transparency, whistleblower, at-will + handbook-not-a-contract, NLRA §7 carve-outs) and standard-but-optional perks. Templates only - not employment-law advice.
slash_command: false
argument-hint: "<section topic>"
attribution:
  lineage: anthropics/knowledge-work-plugins/human-resources/skills/policy-lookup/SKILL.md (Apache-2.0)
  upstream_commit: 9789ea78ad66
metadata:
  wayland:
    tags: [handbook, policy, hr, people-ops, smb]
---

> **Templates only - not employment-law advice.** Employee handbook policies are state-specific and rapidly changing - Have HR counsel review before publishing or distributing.

# HR - Employee Handbook

Generate clear, professional, **legally-defensible** employee handbook sections.

## Pre-flight

1. **State(s) of employment** (drives state-specific requirements)
2. **Country** (US handbook structure differs from UK/EU)
3. **Total headcount** (FMLA 50+, Title VII 15+, etc.)
4. **Federal contractor status** (OFCCP additional requirements)
5. **Any cannabis/recreational-use jurisdiction** (CA, CT, IL, MT, NJ, NV, NY, RI, WA + DC require off-duty protections)

## Usage

```
/hr handbook <section topic>
```

## Two tables: required-by-law vs standard-but-optional

### Required-by-law sections (every US handbook should have)

| Section | Why it's required / strongly recommended |
|---------|------------------------------------------|
| **EEO / Anti-Discrimination policy** | Title VII / ADEA / ADA / GINA / state FEPAs; affirmative-action contractors required |
| **Anti-Harassment with reporting + non-retaliation** | CA FEHA explicit requirement (2 CCR §11023); Faragher/Ellerth defense in any harassment case |
| **ADA reasonable-accommodation request process (interactive)** | ADA + state equivalents; failure to engage = automatic loss |
| **Religious accommodation** | *Groff v. DeJoy* (2023) raised standard from "de minimis" to "substantial burden" |
| **Pregnancy / PWFA accommodation** | PWFA (June 2023, 15+ EE) + state PFLA-like statutes |
| **Lactation accommodation** | PUMP Act (2022) - federal, nearly all employers; private space + reasonable break time |
| **FMLA + state PFML** | FMLA at 50+ EE; state PFML thresholds vary (CA CFRA 5+, NY 1+, etc.) |
| **PTO / sick leave** | State paid-sick-leave laws (CA, AZ, CO, CT, IL, ME, MA, MD, MI, MN, NJ, NM, NV, NY, OR, RI, VT, WA + cities) |
| **Voting / jury duty / military leave (USERRA)** | State voting-leave laws; federal USERRA |
| **Domestic-violence leave** | CA, NY, IL, KS, RI, others |
| **Pay transparency / right to discuss wages** | NLRA §7 - handbooks regularly violate this with confidentiality clauses; explicit carve-out required |
| **Whistleblower / SOX protection** | SOX, Dodd-Frank, state whistleblower acts |
| **At-will disclaimer + handbook-not-a-contract** | Case-law-driven; without it, handbook may be construed as contract |
| **NLRA §7 carve-outs** in confidentiality, social-media, off-duty-conduct sections | Handbook policies that "chill" §7 activity are unfair labor practices |
| **Social media + off-duty conduct** | NLRA §7 limits employer rights; CA Lab. Code §96(k) protects off-duty lawful conduct |
| **Drug & alcohol** with cannabis-jurisdiction nuance | NY Lab. §201-d, NJ CREAMM, CT, NV - recreational-use protection; CA AB 2188 (2024) |
| **Open-door / grievance process** | Faragher/Ellerth defense |
| **Records access** | GDPR Art. 15 (1-month response), CA CPRA (employee data rights since Jan 1 2023) |
| **Anti-retaliation** | EEOC, FMLA, OSHA, NLRA, FLSA all have anti-retaliation provisions |
| **Acknowledgment receipt** | Legal hook for handbook enforceability + at-will reaffirmation |

### Standard-but-optional perks sections

| Section | Coverage |
|---------|----------|
| Remote work / WFH | Equipment stipend, location restrictions, tax considerations |
| Parental leave (paid) | If exceeding statutory minimum |
| Bereavement | Number of days, family definition |
| Sabbatical | Eligibility, duration, pay continuation |
| Professional development | Learning budget, conference policy, tuition |
| Wellness / EAP | Employee assistance program, wellness stipend |
| Travel | Booking, accommodations, international |
| Equipment / BYOD | Laptop policy, software requests |
| Conflicts of interest | Outside employment, vendors, investments |
| Performance management | Review cadence, ratings, PIP framework |

## Output Format

```markdown
## [Section Title]
**Last Updated:** [Date] | **Owned By:** People / HR | **Jurisdiction:** [State, Country]

### Policy Statement
[1-2 sentence summary of what this policy covers and who it applies to]

### Details

#### [Subsection 1]
[Policy text - clear, plain language, specific where it needs to be]

#### [Subsection 2]
[Policy text]

### How It Works
[Step-by-step process if applicable - e.g., how to request PTO, how to file an expense]

### Eligibility
[Who this applies to - full-time, part-time, contractors, by tenure, etc.]

### Anti-retaliation
Employees are protected from retaliation for reporting concerns, requesting
accommodations, taking protected leave, or participating in any investigation,
under federal and state law including [Title VII, ADA, ADEA, FMLA, OSHA, NLRA,
state FEPA]. Report retaliation to [contact].

### NLRA §7 carve-out (where relevant)
Nothing in this policy restricts employees' rights to (i) discuss wages, hours, or
terms and conditions of employment with co-workers, (ii) communicate with
government agencies (NLRB, EEOC, OSHA, SEC, DOL, state DOL), (iii) exercise
Section 7 rights under the National Labor Relations Act, or (iv) testify truthfully
under oath.

### Exceptions
[When the standard policy may not apply and how exceptions are handled]

### Questions?
Contact [HR/People team] at [contact] for questions about this policy.

---
*This policy is subject to change. Material updates will be communicated and a
new acknowledgment may be requested. This policy and the handbook in which it
appears do not constitute a contract of employment, and employment remains at-will
[except as required by Montana law / EU member-state employment law / UK ERA 1996].*
```

## Acknowledgment receipt template (issue at hire and on material updates)

```markdown
EMPLOYEE HANDBOOK ACKNOWLEDGMENT

I acknowledge that I have received and read the [Company] Employee Handbook dated
[Version Date]. I understand that:

1. This Handbook describes [Company]'s policies and procedures and is not a
   contract of employment, express or implied.
2. My employment is at-will [or, in MT: subject to the Wrongful Discharge from
   Employment Act after probation] - meaning either party may terminate the
   employment relationship at any time, with or without notice or cause, except
   as prohibited by law.
3. [Company] may revise this Handbook at any time. Material changes will be
   communicated.
4. I am responsible for reading and complying with the Handbook.
5. I understand that my discussions of wages, hours, and working conditions with
   co-workers, my right to file charges with the EEOC/NLRB/OSHA/state agencies,
   and other rights under federal and state law are NOT restricted by this
   Handbook.

Employee signature: __________________________ Date: __________
Printed name: ________________________________
```

## Writing Principles

1. **Plain language** - 8th-grade reading level. No legalese.
2. **Specific over vague** - "Up to $500/year" beats "reasonable expenses."
3. **Show the process**.
4. **Jurisdiction awareness** - flag where local law overrides (CA sick leave, NY PFL, EU GDPR, UK ERA 1996).
5. **NLRA §7 carve-out** in any policy that touches confidentiality, social media, off-duty conduct, or non-disparagement.
6. **GDPR Art. 30 ROPA + Art. 13/14 privacy notice** if any EU/UK employee data is processed.
7. **Tone: employee-first**.

## Output Path

Save the handbook section using `build_report_path("business-hr", instruction)` when writing to file.

## Output footer (REQUIRED on every generated section)

End every handbook section with this block, verbatim:

```
---
**DRAFT - REVIEW REQUIRED**

This handbook section was generated as a starting template. It has not been reviewed
by employment counsel and may not comply with applicable law in your jurisdiction.
Before publishing:

1. Verify state-specific overrides (paid sick leave, leave laws, cannabis protections,
   pay transparency).
2. Verify NLRA §7 carve-out is present in any policy touching confidentiality,
   social media, off-duty conduct, or non-disparagement.
3. If EU/UK employees: verify GDPR Art. 30 ROPA entry + Art. 13/14 privacy notice.
4. Re-issue acknowledgment receipt on material updates.
5. Have HR counsel licensed in your jurisdiction review the full handbook annually.

Generated by Wayland business-hr plugin. Templates only - not employment-law advice.
```

---

> _Templates only - not employment-law advice. Have HR counsel review every handbook section before publication._
