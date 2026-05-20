---
name: elder-care-coordinator
description: |
  Comprehensive elder care planning assistant covering care needs assessment, care options comparison, Medicare/Medicaid navigation, home safety modifications, medication management, legal planning, and caregiver burnout prevention.
  Use when the user asks about elder care coordinator, or needs help with comprehensive elder care planning assistant covering care needs assessment, care options comparison, medicare/medicaid navigation, home safety modifications, medication management, legal planning, and caregiver burnout prevention.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of elder care coordinator.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "parenting family-events elder-care"
  category: "family-relationships"
  subcategory: "parenting"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Elder Care Coordinator

## When to Use

**Use this skill when:**
- User asks about elder care coordinator
- User needs guidance on elder care coordinator topics
- User wants a structured approach to elder care coordinator

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Overview

This skill helps families navigate the complex landscape of elder care with compassion and practical guidance. It covers the full spectrum from initial needs assessment through care option evaluation, financial and legal planning, and ongoing caregiver support. All guidance is informed by geriatric care management best practices, AARP resources, and the National Institute on Aging frameworks.

## Questions to Ask the User First

Before providing guidance, understand the situation fully:

1. **Who is the elder?** (Your parent, grandparent, spouse, other relation, yourself?)
2. **How old are they and what is their current living situation?** (Alone, with spouse, with family)
3. **What prompted this conversation?** (Gradual decline, specific health event, safety concern, caregiver stress)
4. **What are the primary health conditions?** (Chronic illness, mobility issues, cognitive changes, etc.)
5. **Current level of independence?** (Fully independent, needs some help, needs significant help, needs 24/7 care)
6. **What is their geographic location?** (State matters for Medicaid, local resources)
7. **Financial situation overview?** (Income sources, savings, insurance, property)
8. **What legal documents are already in place?** (Will, POA, advance directive, trust)
9. **Who else is involved in caregiving?** (Siblings, other family, paid helpers)
10. **What does the elder want?** (Their preferences and wishes are paramount)
11. **What is the most urgent need right now?**

## Care Needs Assessment

### Activities of Daily Living (ADL) Assessment

Rate each activity: **Independent / Needs Some Help / Needs Full Help / Unable**

```
BASIC ADLs (Katz Index):

1. BATHING
   [ ] Independent - bathes self completely
   [ ] Needs help with one body part or getting in/out
   [ ] Needs significant assistance or full help

2. DRESSING
   [ ] Independent - selects and puts on clothes
   [ ] Needs help with fasteners or selection
   [ ] Needs full assistance dressing

3. TOILETING
   [ ] Independent - uses toilet, cleans self, manages clothing
   # ... (condensed) ...
   [ ] Independent
   [ ] Needs help cutting food or with setup
   [ ] Needs to be fed

SCORE: ___ / 6 Independent
```

### Instrumental Activities of Daily Living (IADL) Assessment

```
INSTRUMENTAL ADLs (Lawton Scale):

1. TELEPHONE USE
   [ ] Uses phone independently, looks up numbers
   [ ] Dials a few known numbers
   [ ] Cannot use phone without help

2. SHOPPING
   [ ] Shops independently for all needs
   [ ] Needs help for major shopping
   [ ] Cannot shop without accompaniment

3. FOOD PREPARATION
   [ ] Plans and prepares meals independently
   # ... (condensed) ...
   [ ] Manages finances independently
   [ ] Needs help with complex tasks (taxes, investments)
   [ ] Cannot manage finances

SCORE: ___ / 8 Independent
```

### Cognitive Assessment Indicators

```
COGNITIVE CHANGE WARNING SIGNS:
(Not diagnostic -- for discussion with physician)

Memory:
[ ] Repeating questions or stories within minutes
[ ] skipping recent events but recalling distant past
[ ] Misplacing items in unusual places (keys in refrigerator)
[ ] Missing appointments or medications

Judgment:
[ ] Poor financial decisions or susceptibility to scams
[ ] Unsafe driving incidents
[ ] Leaving stove on, doors unlocked
[ ] Difficulty following familiar recipes or directions
# ... (condensed) ...
[ ] Changes in sleep patterns
[ ] Declining personal hygiene (previously well-kept)

If 3+ items checked: Recommend evaluation with primary care
physician and possible referral to neurologist or geriatrician.
```

## Care Options Comparison

### Care Level Decision Framework

```
CARE LEVEL DECISION TREE:

Is the person safe living alone (or with current arrangement)?
|
|-- YES, fully independent
|   --> No changes needed. Review every 6-12 months.
|   --> Consider: medical alert device, regular check-in schedule
|
|-- MOSTLY, with minor needs
|   --> In-Home Support (Level 1): cleaning, meals, transportation
|   --> Options: family help rotation, local senior services,
|       part-time home aide (4-12 hours/week)
|
|-- NO, needs daily assistance with ADLs
# ... (condensed) ...
|       --> Compare: cost, medical complexity, safety
|
|-- MEDICAL NEEDS requiring skilled nursing
    --> Skilled Nursing Facility
    --> OR In-Home Skilled Nursing (if feasible and preferred)
```

### Care Options Detailed Comparison

| Feature | In-Home Care | Assisted Living | Memory Care | Nursing Home |
|---------|-------------|----------------|-------------|--------------|
| Independence level | Highest | Moderate | Structured | Lowest |
| Medical care | Limited-moderate | Moderate | Specialized | Highest |
| Social interaction | Depends on effort | Built-in | Built-in | Built-in |
| Cost range (monthly) | $2,000-$10,000+ | $3,000-$7,000+ | $5,000-$10,000+ | $7,000-$15,000+ |
| Medicare covers | Skilled only, limited | No | No | Post-hospital, 100 days |
| Medicaid covers | Some states, waiver | Some states | Some states | Yes, if eligible |
| Best for | Those wanting to stay home | Those needing daily help + social | Dementia/Alzheimer's | Complex medical needs |
| Family burden | Higher | Moderate | Lower | Lowest |

### Facility Evaluation Checklist

```
FACILITY VISIT CHECKLIST:

First Impressions:
[ ] Clean, well-maintained, no odors
[ ] Residents appear well-groomed and content
[ ] Staff interact warmly with residents
[ ] Comfortable common areas
[ ] Well-maintained outdoor spaces

Staffing:
[ ] Staff-to-resident ratio: ___ (ask for day, evening, and night)
[ ] RN on-site hours: ___
[ ] Staff turnover rate: ___ (ask directly)
[ ] Background check policy for all staff
# ... (condensed) ...
[ ] Any citations or complaints (check state website)
[ ] Accreditation: _______________

Visit at least twice (once scheduled, once unannounced).
Talk to current residents and families without staff present.
```

## Medicare and Medicaid Navigation

### Medicare Coverage Summary

```
MEDICARE PARTS OVERVIEW:

Part A (Hospital Insurance) - Usually premium-free if 40+ work quarters
  Covers: Inpatient hospital, skilled nursing (100 days post-hospital),
          hospice, some home health
  Does NOT cover: Long-term custodial care, assisted living

Part B (Medical Insurance) - Monthly premium (~$175+/month, income-adjusted)
  Covers: Doctor visits, outpatient care, durable medical equipment,
          preventive services, some home health
  Does NOT cover: Long-term care, routine dental/vision/hearing

Part C (Medicare Advantage) - Private plan alternative to A+B
  Covers: Everything A+B covers, often includes dental/vision/hearing
  May cover: Some supplemental benefits (transportation, meals, OTC items)
  Network restrictions apply

Part D (Prescription Drug) - Monthly premium varies by plan
  Covers: Prescription medications (formulary-based)
  Note: Coverage gap ("donut hole") and catastrophic coverage phases
```

### Medicaid Eligibility Overview

```
MEDICAID FOR LONG-TERM CARE:

Eligibility (varies significantly by state):
  Income limit: Generally ~$2,829/month (2024, individual) but varies
  Asset limit: Generally ~$2,000 individual (many exceptions)

  Exempt assets (typically):
  - Primary home (up to equity limit, ~$713,000)
  - One vehicle
  - Personal belongings and household goods
  - Burial fund (up to limit)
  - Life insurance (face value under $1,500)

  Look-back period: 60 months (5 years)
  - Gifts or transfers during this period may trigger penalty
  - Penalty period = value transferred / average monthly nursing home cost

IMPORTANT: Medicaid rules are state-specific. Consult an elder law
attorney in your state before any financial planning or transfers.
```

### Benefits Coordination Checklist

```
FINANCIAL RESOURCES TO INVESTIGATE:

[ ] Medicare (Parts A, B, C, D)
[ ] Medicaid (if eligible or potentially eligible)
[ ] Veterans benefits (Aid & Attendance if veteran/surviving spouse)
[ ] Long-term care insurance (check all old policies)
[ ] Social Security benefits optimization
[ ] Pension benefits
[ ] Supplemental Security Income (SSI)
[ ] State-specific programs:
    [ ] Home and Community Based Services (HCBS) waivers
    [ ] Program of All-inclusive Care for the Elderly (PACE)
    [ ] State pharmaceutical assistance programs
[ ] Local resources:
    [ ] Area Agency on Aging: eldercare.acl.gov or 1-800-677-1116
    [ ] Meals on Wheels
    [ ] Senior transportation services
    [ ] Adult day programs
    [ ] Respite care programs
[ ] Tax deductions:
    [ ] Medical expense deduction (if > 7.5% of AGI)
    [ ] Dependent care credit (if applicable)
```

## Home Safety Modifications

### Room-by-Room Safety Assessment

```
BATHROOM (highest risk area):
[ ] Grab bars at toilet and in shower/tub
[ ] Non-slip mats or strips in tub/shower and on floor
[ ] Raised toilet seat (if needed)
[ ] Shower bench or chair
[ ] Handheld shower head
[ ] Adequate lighting (night light minimum)
[ ] Medications secured but accessible
[ ] Water temperature set to 120°F or lower (scald prevention)

BEDROOM:
[ ] Bed at appropriate height (easy to get in/out)
[ ] Clear path from bed to bathroom (no tripping hazards)
[ ] Night lights along path
# ... (condensed) ...
[ ] Well-lit walkways and entrance
[ ] Handrails on all steps
[ ] Even walking surfaces (repair cracks)
[ ] Non-slip surface on porch/deck
[ ] Snow/ice removal plan for winter
```

## Medication Management

### Medication Organization System

```
MEDICATION MANAGEMENT PLAN:

Current Medications:
| Medication | Dose | Frequency | Prescriber | Purpose | Started |
|-----------|------|-----------|-----------|---------|---------|
| _________ | ____ | _________ | _________ | _______ | _______ |
| _________ | ____ | _________ | _________ | _______ | _______ |

Organization Method:
[ ] Pill organizer (weekly, AM/PM sections)
[ ] Automatic pill dispenser (alerts and locks)
[ ] Pharmacy blister packs (pre-sorted)
[ ] Medication management app
[ ] Caregiver-administered
# ... (condensed) ...
- Pharmacist review: Every 6 months (many pharmacies offer free)
- Physician review: At every appointment, bring all bottles
- Check for: interactions, duplications, no-longer-needed medications
- "Brown bag review": Put ALL medications (including OTC, supplements)
  in a bag and bring to doctor
```

## Legal Planning

### Essential Legal Documents

```
LEGAL PLANNING CHECKLIST:

PRIORITY 1 - Complete immediately:
[ ] Durable Power of Attorney (Financial)
    Agent: _______________
    Alternate: _______________
    Scope: [broad / limited to: ___]

[ ] Healthcare Power of Attorney / Healthcare Proxy
    Agent: _______________
    Alternate: _______________

[ ] Advance Directive / Living Will
    Preferences documented for:
    # ... (condensed) ...
[ ] Letter of intent (non-legal guidance for family)

IMPORTANT: These documents must be completed while the elder has
legal capacity to sign. Do not delay. Consult an elder law attorney.
Find one at: nelf.org or naela.org
```

### Having the Conversation

```
APPROACHING LEGAL/CARE PLANNING CONVERSATIONS:

Timing:
- Choose a calm, private moment (not during crisis)
- When everyone is rested and not rushed
- May need multiple conversations, not one marathon session

Framing:
- "I want to make sure we respect your wishes..."
- "I've been thinking about what would give you the most peace of mind..."
- "This is about protecting you and making things easier for everyone..."
- NOT: "We need to talk about what happens when you can't..."

Structure:
# ... (condensed) ...
- Don't force it. Plant the seed and return later.
- Share a relevant story (not scare tactic, just real-life example)
- Involve a trusted advisor (doctor, clergy, attorney, financial advisor)
- Acknowledge their feelings: "I understand this is hard to think about"
- Focus on what they can control: "This is how you stay in charge"
```

## Caregiver Support and Burnout Prevention

### Caregiver Self-Assessment

```
CAREGIVER BURNOUT WARNING SIGNS:
Rate each: 0 (never) to 4 (always)

___ I feel exhausted even after sleeping
___ I get sick more often than I used to
___ I have lost interest in activities I used to enjoy
___ I feel resentful toward the person I'm caring for
___ I feel isolated from friends and family
___ I snap at people more easily
___ I worry constantly even when away from caregiving
___ I've been neglecting my own health
___ I feel like caregiving controls my entire life
___ I feel guilty when I do anything for myself

Score: ___ / 40
0-10: Managing well. Maintain self-care.
11-20: Caution. Increase support and respite.
21-30: High risk. Seek help now (respite, support group, counseling).
31-40: Crisis level. Professional support and immediate respite essential.
```

### Caregiver Support Plan

```
CAREGIVER SELF-CARE PLAN:

Daily Non-Negotiables (even 10 minutes counts):
  - Physical: _______________
  - Emotional: _______________
  - Social: _______________ (even a phone call)

Weekly:
  - Respite time (someone else covers): ___ hours
  - Activity for yourself: _______________
  - Connection with support person: _______________

Monthly:
  - Own medical appointments: _______________
  # ... (condensed) ...
  - AARP Caregiver Support: aarp.org/caregiving
  - Caregiver Action Network: caregiveraction.org, 1-855-227-3640
  - Eldercare Locator: eldercare.acl.gov, 1-800-677-1116
  - Family Caregiver Alliance: caregiver.org
  - Alzheimer's Association 24/7 Helpline: 1-800-272-3900
```

### Family Caregiving Coordination

```
FAMILY CARE TEAM PLAN:

Primary Caregiver: _______________
Care Coordinator (may be different): _______________

Task Distribution:
| Task | Person | Frequency | Backup |
|------|--------|-----------|--------|
| Daily visits/check-ins | _______ | Daily | _______ |
| Medication management | _______ | Daily | _______ |
| Grocery/errands | _______ | Weekly | _______ |
| Medical appointments | _______ | As needed | _______ |
| Financial management | _______ | Monthly | _______ |
| Home maintenance | _______ | As needed | _______ |
# ... (condensed) ...
Communication Plan:
  - Shared update channel (group text, shared document, app)
  - Family care meeting: [weekly / biweekly / monthly]
  - Decision-making process: _______________
  - Conflict resolution approach: _______________
```

## Output Format

When providing elder care guidance, structure as:

```
SITUATION ASSESSMENT:
  Current care level: [independent / needs some help / significant needs / 24/7 care]
  Most urgent need: _______________
  Biggest concern: _______________

RECOMMENDED NEXT STEPS:
  Immediate (this week):
    1. _______________
    2. _______________
  Short-term (this month):
    1. _______________
    2. _______________
  Longer-term (3-6 months):
    1. _______________
# ... (condensed) ...
  Support available to you: _______________

IMPORTANT DISCLAIMER:
  This guidance is informational, not legal, medical, or financial advice.
  Consult appropriate professionals for specific situations.
```

## Example

**Input:** "Help me get started with elder care coordinator"

**Output:** A structured elder care coordinator plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
