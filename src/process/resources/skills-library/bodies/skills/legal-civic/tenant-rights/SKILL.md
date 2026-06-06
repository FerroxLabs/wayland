---
name: tenant-rights
description: |
  Comprehensive guide to tenant rights including lease review, security deposit rules, habitability standards, repair procedures, eviction process, rent increases, lease breaking options, documentation practices, and fair housing basics.
  Use when the user asks about tenant rights, or needs help with comprehensive guide to tenant rights including lease review, security deposit rules, habitability standards, repair procedures, eviction process, rent increases, lease breaking options, documentation practices, and fair housing basics.
  Do NOT use when the request requires professional legal advice or falls outside the scope of tenant rights.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "legal-literacy contracts tenant-rights"
  category: "legal-civic"
  subcategory: "tenant-rights"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "intermediate"
---

# Tenant Rights Guide

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand legal concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary by jurisdiction and change over time. Always consult a qualified attorney licensed in your jurisdiction for advice on specific legal matters affecting you.

## When to Use

**Use this skill when:**
- User has a landlord-tenant dispute or question about rental rights
- User needs to understand lease terms or rental law basics
- User wants to know their rights regarding repairs, deposits, or eviction
- User needs guidance on how to formally communicate with a landlord

**Do NOT use this skill when:**
- User needs legal representation in an eviction proceeding -- refer to tenant attorney or legal aid
- User wants to draft a lease agreement -- refer to legal professional
- User has a commercial lease dispute -- this skill covers residential tenancy

## Process

1. **Step 1:** Identify the specific tenant issue and relevant jurisdiction
2. **Step 2:** Explain applicable rights and landlord obligations in plain language
3. **Step 3:** Advise on documentation: photos, written communications, certified mail
4. **Step 4:** Provide template for formal communication to landlord
5. **Step 5:** Outline escalation path: housing authority, legal aid, small claims court

## Purpose

This skill helps tenants understand their rights, navigate common rental issues, and protect themselves through proper documentation. It covers the full lifecycle of a tenancy from lease signing through move-out.

---

## Questions to Ask the User First

1. **What state and city do you live in?** (Laws vary dramatically by jurisdiction)
2. **Are you currently a tenant, or are you about to sign a lease?**
3. **What type of housing?** (apartment complex, single-family rental, condo, room rental, subsidized housing)
4. **Is there a written lease, or is this a verbal/month-to-month arrangement?**
5. **What is your primary concern right now?** (signing a lease, repair issue, security deposit, potential eviction, rent increase, wanting to break lease, discrimination, other)
6. **How long have you lived at the property?**
7. **Is your landlord an individual, property management company, or housing authority?**
8. **Have you documented the issue in writing?**

---

## Step 1: Lease Review Checklist

Before signing any lease, review every item below:

### Essential Terms to Verify
```
LEASE REVIEW CHECKLIST

BASIC TERMS:
[ ] Monthly rent amount: ${{AMOUNT}}
[ ] Due date: {{DATE}} of each month
[ ] Grace period: {{DAYS}} days
[ ] Late fee amount: ${{AMOUNT}} (check if legal in your jurisdiction)
[ ] Lease start date: {{DATE}}
[ ] Lease end date: {{DATE}}
[ ] Security deposit: ${{AMOUNT}}
[ ] Move-in fees (non-refundable): ${{AMOUNT}}

PROPERTY DETAILS:
[ ] Full address including unit number
[ ] Parking space(s) included: YES / NO -- Number: {{#}}
[ ] Storage included: YES / NO -- Location: {{LOCATION}}
[ ] Appliances included: {{LIST}}
[ ] Furnishings included: {{LIST}}

UTILITIES AND SERVICES:
[ ] Electricity: TENANT / LANDLORD
[ ] Gas/Heat: TENANT / LANDLORD
[ ] Water/Sewer: TENANT / LANDLORD
[ ] Trash: TENANT / LANDLORD
[ ] Internet/Cable: TENANT / LANDLORD
[ ] Lawn care/Snow removal: TENANT / LANDLORD

POLICIES:
[ ] Pet policy: {{TERMS}} -- Pet deposit: ${{AMOUNT}}
[ ] Guest policy: {{TERMS}}
[ ] Subletting allowed: YES / NO -- Conditions: {{TERMS}}
[ ] Smoking policy: {{TERMS}}
[ ] Noise/quiet hours: {{HOURS}}
[ ] Parking rules: {{TERMS}}
[ ] Modification/decoration restrictions: {{TERMS}}

MAINTENANCE:
[ ] How to submit repair requests: {{METHOD}}
[ ] Emergency maintenance contact: {{CONTACT}}
[ ] Tenant maintenance responsibilities: {{LIST}}
[ ] Landlord maintenance responsibilities: {{LIST}}

TERMINATION:
[ ] Lease-breaking penalty: ${{AMOUNT}} or {{TERMS}}
[ ] Required notice to vacate: {{DAYS}} days
[ ] Auto-renewal terms: {{TERMS}}
[ ] Move-out inspection process: {{TERMS}}
[ ] Security deposit return timeline: {{DAYS}} days
```

### Red Flags in Leases
- Tenant waives right to habitable premises
- Landlord may enter without notice at any time
- Tenant liable for all repairs regardless of cause
- Security deposit is "non-refundable" (illegal in most states)
- Lease requires tenant to waive right to sue
- Excessive late fees (more than 5-10% of monthly rent)
- Automatic rent escalation without cap
- Tenant must pay landlord's attorney fees in all disputes
- Landlord can terminate for any reason with minimal notice during lease term

---

## Step 2: Security Deposit Rules

### General Principles (Verify in Your State)

Most states regulate security deposits in these areas:

| Issue | Common Rules (Vary by State) |
|---|---|
| Maximum amount | 1-2 months' rent (some states have no limit) |
| Separate account | Many states require deposits in separate, interest-bearing accounts |
| Return deadline | Typically 14-45 days after move-out |
| Itemized deductions | Required in most states |
| Allowable deductions | Damage beyond normal wear and tear, unpaid rent, cleaning if lease requires |
| Penalties for violations | Some states allow 2-3x deposit as damages |
| Walk-through inspection | Some states require pre-move-out inspection |

### Normal Wear and Tear vs. Damage

| Normal Wear and Tear (NOT Deductible) | Damage (Deductible) |
|---|---|
| Minor scuffs on walls | Large holes in walls |
| Carpet worn from foot traffic | Stains, burns, or pet damage to carpet |
| Faded paint or wallpaper | Unauthorized paint colors |
| Loose door handles from normal use | Broken doors or locks |
| Minor nail holes from hanging pictures | Large anchor holes or removed fixtures |
| Worn grout in bathroom | Broken tiles |
| Dusty window blinds | Broken or missing blinds |

### Security Deposit Protection Template
```
MOVE-IN CONDITION DOCUMENTATION

Date: {{DATE}}
Property: {{ADDRESS}}
Landlord: {{NAME}}
Tenant: {{NAME}}

For each room, document condition with photos and written description:

ROOM: {{ROOM_NAME}}
- Walls: {{CONDITION}} -- Photo #: {{#}}
- Floor/Carpet: {{CONDITION}} -- Photo #: {{#}}
- Windows: {{CONDITION}} -- Photo #: {{#}}
- Doors: {{CONDITION}} -- Photo #: {{#}}
- Light fixtures: {{CONDITION}} -- Photo #: {{#}}
- Outlets/switches: {{CONDITION}} -- Photo #: {{#}}
- Appliances: {{CONDITION}} -- Photo #: {{#}}
- Closets/storage: {{CONDITION}} -- Photo #: {{#}}
- Other: {{CONDITION}} -- Photo #: {{#}}

[Repeat for each room]

GENERAL:
- Smoke detectors working: YES / NO -- Locations: {{LIST}}
- CO detectors working: YES / NO -- Locations: {{LIST}}
- Keys received: {{COUNT}} -- Type: {{DESCRIPTION}}
- Garage opener received: YES / NO
- Existing damage not yet addressed: {{LIST}}

Tenant Signature: _____________________ Date: __________
Landlord Signature: ____________________ Date: __________
```

---

## Step 3: Habitability Standards

### Implied Warranty of Habitability

In most states, landlords must provide and maintain rental units that are fit for human habitation. This typically includes:
```
MINIMUM HABITABILITY REQUIREMENTS:

STRUCTURAL:
[ ] Weatherproof roof, walls, and windows
[ ] Unbroken windows and doors with working locks
[ ] Safe and maintained stairways, railings, and floors
[ ] Foundation free from significant cracks or settling

PLUMBING:
[ ] Hot and cold running water
[ ] Working toilet, sink, and bathtub/shower
[ ] Functional drainage/sewer system
[ ] No active leaks

HEATING:
[ ] Adequate heating system in working order
[ ] Ability to maintain reasonable temperature (varies by jurisdiction)
[ ] (Air conditioning may be required in some hot-climate jurisdictions)

ELECTRICAL:
[ ] Working electrical system up to code
[ ] Sufficient outlets in each room
[ ] Working light fixtures

SAFETY:
[ ] Working smoke detectors
[ ] Carbon monoxide detectors (where required)
[ ] Fire extinguisher access (in some jurisdictions)
[ ] Adequate fire egress/exits
[ ] Deadbolt locks on exterior doors

PEST CONTROL:
[ ] Property free from rodent and insect infestation
[ ] Landlord responsible for pest control (in most jurisdictions)

SANITATION:
[ ] Working garbage receptacles
[ ] Common areas kept clean (in multi-unit buildings)
[ ] No mold or environmental hazards
[ ] Lead paint disclosure (for pre-1978 buildings)
```

---

## Step 4: Repair Request Procedures

### Step-by-Step Repair Request Process

**Step 1: Notify the landlord in writing.**
```
REPAIR REQUEST LETTER TEMPLATE

Date: {{DATE}}

To: {{LANDLORD_NAME}}
    {{LANDLORD_ADDRESS}}

From: {{TENANT_NAME}}
      {{RENTAL_ADDRESS}}

RE: Repair Request -- {{BRIEF_DESCRIPTION}}

Dear {{LANDLORD_NAME}},

I am writing to notify you of a maintenance issue at the above property
that requires repair:

ISSUE: {{DETAILED_DESCRIPTION}}
LOCATION: {{SPECIFIC_LOCATION_IN_UNIT}}
DATE FIRST NOTICED: {{DATE}}
IMPACT: {{HOW_IT_AFFECTS_HABITABILITY_OR_DAILY_LIFE}}

[If applicable:]
This issue affects the habitability of the unit because {{REASON}}.

I am requesting that this repair be completed within {{REASONABLE_TIME}}
days. I am available for access to the unit at the following times:
{{AVAILABILITY}}.

Please confirm receipt of this request and provide a timeline for the
repair.

Thank you for your prompt attention to this matter.

Sincerely,
{{TENANT_NAME}}
{{PHONE_NUMBER}}
{{EMAIL}}

[Keep a copy of this letter and proof of delivery]
```

**Step 2: If landlord does not respond within a reasonable time (varies by state and urgency):**
```
FOLLOW-UP REPAIR REQUEST

Date: {{DATE}}

To: {{LANDLORD_NAME}}

RE: SECOND NOTICE -- Repair Request Originally Submitted {{ORIGINAL_DATE}}

Dear {{LANDLORD_NAME}},

I am following up on my repair request dated {{ORIGINAL_DATE}} regarding
{{ISSUE}}. I have not received a response or repair as of today's date.

Under [State] law, landlords are required to maintain rental properties
in habitable condition and to address repair requests within a reasonable
timeframe.

I respectfully request that this repair be scheduled within {{DAYS}} days.
If I do not hear back by {{DEADLINE_DATE}}, I may need to explore remedies
available under [State] tenant protection laws, which may include:

- Filing a complaint with {{LOCAL_HOUSING_AGENCY}}
- Repair and deduct (if permitted in this jurisdiction)
- Rent withholding (if permitted in this jurisdiction)
- Seeking assistance from legal aid

I would prefer to resolve this directly and amicably.

Sincerely,
{{TENANT_NAME}}
```

**Step 3: Know your remedies (vary by state):**
- **Repair and Deduct:** Some states allow tenants to make repairs and deduct cost from rent (usually with limitations)
- **Rent Withholding:** Some states allow withholding rent until repairs are made (strict procedural requirements)
- **Code Enforcement:** File a complaint with your local building/housing inspector
- **Lease Termination:** Severe habitability issues may give you the right to terminate

---

## Step 5: Understanding the Eviction Process

### Eviction Cannot Happen Without Due Process

Landlords cannot legally:
- Change your locks without a court order
- Remove your belongings from the unit
- Shut off utilities to force you out
- Physically remove you from the property
- Threaten or harass you into leaving

These actions are called "self-help evictions" and are illegal in virtually every state.

### Typical Legal Eviction Process
```
STEP 1: NOTICE
Landlord serves written notice (3-day, 14-day, 30-day, etc.)
Type depends on reason and state law:
- Pay or Quit (unpaid rent)
- Cure or Quit (lease violation)
- Unconditional Quit (severe violations)
- No-Cause Termination (month-to-month, where permitted)

STEP 2: COURT FILING
If tenant does not comply with notice, landlord files eviction lawsuit
(called "unlawful detainer," "forcible entry and detainer," or "summary process")

STEP 3: SERVICE OF SUMMONS
Tenant receives court papers with hearing date
CRITICAL: You MUST respond and/or appear by the deadline

STEP 4: COURT HEARING
Both sides present their case
Tenant can raise defenses (retaliation, habitability, improper notice)

STEP 5: JUDGMENT
Judge rules for landlord or tenant
If for landlord, tenant is given a deadline to vacate

STEP 6: ENFORCEMENT
Only a sheriff/marshal can physically enforce an eviction order
Landlord still cannot self-help evict
```

### Common Eviction Defenses
1. **Improper notice** -- wrong form, wrong timeline, wrong delivery method
2. **Retaliation** -- eviction filed after tenant complained about conditions or exercised legal rights
3. **Discrimination** -- eviction motivated by protected class status
4. **Habitability** -- landlord failed to maintain habitable conditions
5. **Payment** -- rent was paid (keep all receipts)
6. **Waiver** -- landlord accepted rent after the notice period

---

## Step 6: Rent Increase Rules

### General Framework

| Lease Type | Rent Increase Rules |
|---|---|
| Fixed-term lease | Cannot increase during the term unless lease allows it |
| Month-to-month | Can increase with proper notice (usually 30-60 days) |
| Rent-controlled unit | Increases limited by local ordinance |
| Section 8/subsidized | Governed by program rules |

### Rent Increase Notice Requirements (General)
- Must be in writing
- Must provide adequate advance notice (30-90 days depending on jurisdiction)
- Cannot be retaliatory (e.g., right after you filed a complaint)
- Cannot be discriminatory
- In rent-controlled areas, must comply with allowable increase percentages

---

## Step 7: Lease Breaking Options

### Legitimate Reasons for Breaking a Lease

1. **Uninhabitable conditions** that the landlord will not fix
2. **Military deployment** (Servicemembers Civil Relief Act)
3. **Domestic violence** (many states have protections)
4. **Landlord harassment or illegal entry**
5. **Constructive eviction** (landlord's actions make the unit unusable)
6. **Job relocation** (may or may not reduce liability; check lease)

### Minimizing Liability When Breaking a Lease
```
LEASE-BREAKING ACTION PLAN:

1. Review your lease for:
   [ ] Early termination clause (penalty amount)
   [ ] Subletting provisions
   [ ] Assignment provisions
   [ ] Required notice period

2. Check your state's mitigation duty:
   [ ] Does your landlord have a legal duty to re-rent?
   [ ] (Most states require landlords to make reasonable efforts to re-rent)

3. Give maximum notice possible:
   [ ] Provide written notice of your intent to vacate
   [ ] Explain circumstances (if you have legal grounds)
   [ ] Propose solutions (finding a replacement tenant)

4. Help find a replacement tenant:
   [ ] Advertise the unit (with landlord's permission)
   [ ] Screen interested tenants
   [ ] Facilitate showings

5. Document everything:
   [ ] Written notice to landlord (keep copy)
   [ ] Landlord's response
   [ ] Evidence of landlord's efforts (or lack thereof) to re-rent
   [ ] All communication about the situation
```

---

## Step 8: Documentation Best Practices

### What to Document and How
```
TENANT DOCUMENTATION SYSTEM:

ALWAYS DOCUMENT:
- Move-in condition (photos + written checklist)
- All repair requests (written, with dates)
- All communication with landlord (written preferred)
- Rent payments (receipts, bank statements, canceled checks)
- Move-out condition (photos + video with timestamp)
- Any lease violations by the landlord
- Witnesses to any verbal agreements or incidents

HOW TO DOCUMENT:
- Photos/Video: Include timestamps (visible date in frame or metadata)
- Written communication: Email or certified mail (return receipt)
- Keep copies of everything in a separate, safe location
- Use a log to track dates and issues:

DATE        | ISSUE           | ACTION TAKEN        | RESPONSE
{{DATE}}    | {{DESCRIPTION}} | {{WHAT_YOU_DID}}    | {{LANDLORD_RESPONSE}}
```

---

## Step 9: Fair Housing Basics

### Protected Classes Under Federal Fair Housing Act

It is illegal for landlords to discriminate based on:
- Race or color
- National origin
- Religion
- Sex (including sexual orientation and gender identity per recent rulings)
- Familial status (having children under 18)
- Disability

Many state and local laws add additional protected classes such as age, source of income, marital status, military/veteran status, and more.

### Signs of Housing Discrimination
- Different terms offered to different applicants for no legitimate reason
- Steering (directing you to certain neighborhoods or buildings)
- Refusing reasonable accommodations for disability
- Refusing service animals with proper documentation
- Discouraging you from applying
- Different maintenance response times based on protected characteristics

### Filing a Discrimination Complaint
1. **HUD:** File online at hud.gov or call 1-800-669-9777
2. **State Fair Housing Agency:** Search for your state's equivalent
3. **Local Fair Housing Organization:** Many cities have their own agencies
4. **Deadline:** Generally 1 year for HUD, varies for state/local

---

## Resource Finder Template
```
LOCAL TENANT RESOURCES:

State: {{STATE}}
City: {{CITY}}

Tenant Rights Hotline: {{PHONE}}
Legal Aid Society: {{NAME}} -- {{PHONE}} -- {{WEBSITE}}
Housing Authority: {{NAME}} -- {{PHONE}}
Code Enforcement: {{DEPARTMENT}} -- {{PHONE}}
Fair Housing Office: {{NAME}} -- {{PHONE}}
Tenant Union/Organization: {{NAME}} -- {{WEBSITE}}
Small Claims Court: {{LOCATION}} -- Filing fee: ${{AMOUNT}}
Rent Board (if applicable): {{NAME}} -- {{PHONE}}
```

---

*This skill provides general tenant rights information. Tenant protection laws vary significantly by jurisdiction. For specific legal situations, contact a local tenant rights organization or attorney.*


## Output Format

```
TENANT RIGHTS OUTPUT
====================

Section 1: Assessment / Analysis
- Key findings
- Recommendations

Section 2: Action Plan
- Step-by-step guidance
- Timeline if applicable

Section 3: Resources
- Relevant references
- Next steps
```

## Example

**Input:** "My landlord has not fixed the broken heater in my apartment for 3 weeks. It is winter and I have been using space heaters. Can I withhold rent?"

**Output:**

## Tenant Rights: Uninhabitable Conditions (No Heat)

### Your Situation
Lack of heat in winter is generally classified as an uninhabitable condition -- landlords have a legal duty to maintain habitable premises. This is called the "implied warranty of habitability."

### Your Rights [JURISDICTION: verify -- laws vary by state]
1. **Right to habitable conditions:** Heat is considered an essential service in virtually all jurisdictions
2. **Repair and deduct:** Some states allow you to hire a repair person and deduct the cost from rent (typically limited to one month's rent)
3. **Rent withholding:** Some states allow withholding rent until repairs are made -- BUT you must follow specific procedures
4. **Lease termination:** If conditions are severe enough, you may be able to break your lease without penalty

### Required Steps Before Withholding Rent
1. **Written notice:** Send landlord a written repair request via certified mail (not just text/verbal)
2. **Reasonable time:** Allow a reasonable time for repair (varies by jurisdiction, typically 14-30 days, shorter for emergencies like no heat in winter)
3. **Document everything:** Photos of broken heater, temperature readings in apartment, copies of all communications
4. **Escrow option:** Some jurisdictions require you to deposit withheld rent in an escrow account, not just keep it

### Template Notice
"Dear [Landlord], This letter serves as formal written notice that the heating system at [address] has been non-functional since [date]. I reported this issue on [date]. I am requesting repair within [7 days / your jurisdiction's emergency timeline]. Failure to repair may result in my exercising tenant remedies available under [state] law."

### What NOT to Do
- Do NOT stop paying rent without following your jurisdiction's specific procedure
- Do NOT make repairs costing more than your state's repair-and-deduct limit
- Do NOT withhold rent for minor issues -- this remedy is for habitability

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
