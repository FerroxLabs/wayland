---
name: caregiver-medication-management
description: |
  Produces medication tracking systems for caregivers including medication list
  templates, dosing schedule organizers, pharmacy coordination checklists,
  provider communication templates, and refill management workflows. Teaches
  caregivers how to maintain accurate medication records and coordinate with
  healthcare providers and pharmacies.
  Use when the user asks about organizing medications for a family member,
  setting up medication tracking, or coordinating prescriptions.
  Do NOT use for medication selection, dosing decisions, or advice on whether
  to take or stop any medication -- those decisions require a physician.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "elder-care checklist template"
  category: "family-relationships"
  subcategory: "caregiving"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Medication Management for Caregivers

**Important:** This skill teaches medication TRACKING and COORDINATION systems for caregivers. It does NOT provide guidance on medication selection, dosing adjustments, drug interactions, or whether any medication should be taken, changed, or stopped. All medication decisions require direction from a licensed physician or pharmacist.

## When to Use

**Use this skill when:**
- User asks about organizing medications for an aging parent or family member
- User wants to set up a medication tracking system or schedule
- User needs templates for recording and managing prescriptions
- User asks about coordinating between multiple pharmacies or physicians
- User wants to create a medication list for emergency use or physician visits

**Do NOT use this skill when:**
- User asks whether a specific medication should be taken or stopped (physician decision)
- User asks about drug interactions or side effects (pharmacist or physician consultation)
- User asks about medication dosing or adjusting doses (physician decision)
- User wants to compare medications or choose between treatment options (physician decision)
- User asks about over-the-counter medication recommendations (physician or pharmacist guidance)

## Process

1. **Build the master medication list.** Create a single authoritative record of all medications:

   For each medication, record:
   - **Medication name** (brand name AND generic name)
   - **Prescribed dosage** (mg, ml, or units as prescribed)
   - **Form** (tablet, capsule, liquid, patch, injection, inhaler, eye drops, cream)
   - **Frequency** (once daily, twice daily, as needed, etc.)
   - **Time of day** (morning, with lunch, bedtime, specific clock times)
   - **Taken with/without food** (as directed)
   - **Prescribing physician** (name and contact)
   - **Pharmacy** (name, phone, prescription number)
   - **Date started** (when this medication was first prescribed)
   - **Purpose** (what condition this medication is for, as stated by the physician)
   - **Refill information** (refills remaining, next refill date, auto-refill status)
   - **Special instructions** (crush allowed, refrigerate, take with full glass of water, etc.)

   Also record:
   - **Known allergies and adverse reactions** (medication name, reaction type, severity)
   - **Discontinued medications** (name, date stopped, reason per physician)
   - **Over-the-counter medications and supplements** taken regularly (include vitamins, herbal supplements)

2. **Create the daily medication schedule.** Organize by administration time:

   | Time | Medication | Dose | Instructions | Given By | Initials |
   |------|-----------|------|-------------|----------|----------|
   | 7:00 AM (with breakfast) | [Med A] | [X mg] | Take with food | | |
   | 7:00 AM (with breakfast) | [Med B] | [X mg] | Swallow whole, do not crush | | |
   | 12:00 PM (with lunch) | [Med C] | [X mg] | Take with full glass of water | | |
   | 5:00 PM (with dinner) | [Med D] | [X mg] | Take with food | | |
   | 9:00 PM (bedtime) | [Med E] | [X mg] | Take 30 minutes before bed | | |
   | As needed | [Med F] | [X mg] | Maximum X times per day, minimum Y hours apart | | |

   **Administration tracking:**
   - Check off each medication as given
   - Record the actual time given (not just the scheduled time)
   - Note if a dose was missed, refused, or delayed (and why)
   - Record any PRN (as needed) medications: time given, reason, and response

3. **Set up the weekly pill organization system:**

   **Pill organizer setup (do once per week, same day each week):**
   - [ ] Wash hands before handling medications
   - [ ] Use a 7-day AM/PM pill organizer (or 4-compartment if there are midday and bedtime doses)
   - [ ] Fill from the master medication list, not from memory
   - [ ] Double-check each day's compartment against the daily schedule
   - [ ] Note any medications that cannot go in the organizer (liquids, refrigerated, patches, inhalers)
   - [ ] Store organizer in a consistent location (not in bathroom -- humidity degrades medications)
   - [ ] Record the date the organizer was filled

   **Medications that require separate handling:**
   - Liquids: measure with provided dosing device at administration time
   - Patches: apply per schedule, note application site and rotation
   - Refrigerated medications: store per label instructions, check expiration monthly
   - Eye drops: administer directly, do not pre-load
   - Inhalers: keep at bedside or in a designated location, track usage count

4. **Establish the pharmacy coordination workflow:**

   **Single pharmacy preference:** Using one pharmacy for all prescriptions enables the pharmacist to check for interactions across all medications. If multiple pharmacies are necessary (specialty, mail-order), ensure each pharmacy has the complete medication list.

   **Refill management:**
   - [ ] Record refill dates for all medications in a calendar (physical or digital)
   - [ ] Set reminders 7 days before each refill is due
   - [ ] Confirm refills remaining on each prescription
   - [ ] Schedule physician appointments for new prescriptions before refills run out (some require visits every 3-6 months)
   - [ ] For mail-order prescriptions, order 14 days in advance to allow for shipping delays
   - [ ] Keep a minimum 3-day emergency supply if possible

   **Pharmacy communication template:**
   When calling the pharmacy, have ready:
   - Patient's full name and date of birth
   - Prescription number(s) in question
   - Prescribing physician's name
   - The specific question or request
   - Caregiver's name and relationship (pharmacy may need authorization on file)

5. **Create the physician visit preparation template:**

   **Before every appointment, bring:**
   - [ ] Printed copy of the complete medication list (including OTC and supplements)
   - [ ] List of any new symptoms or changes since last visit
   - [ ] Record of any missed or refused doses and frequency
   - [ ] List of any side effects observed (when they started, severity, pattern)
   - [ ] Questions about medications (written down -- do not rely on memory)
   - [ ] Insurance card and identification

   **Questions to ask at medication review:**
   - Are all current medications still necessary?
   - Can any medications be simplified (combined, reduced frequency)?
   - Are there any known interactions between current medications?
   - What symptoms should we watch for and report immediately?
   - Is there a less expensive equivalent available?
   - Should any labs be done to monitor medication effects?

   **After the appointment:**
   - [ ] Update the master medication list with any changes immediately
   - [ ] Confirm new prescriptions were sent to the correct pharmacy
   - [ ] Call the pharmacy to verify they received new or changed prescriptions
   - [ ] Update the daily schedule if timing changed
   - [ ] Inform all caregivers of medication changes within 24 hours
   - [ ] Update the pill organizer to reflect changes

6. **Set up the medication change log:**

   | Date | Medication | Change | Ordered By | Reason | Effective Date | Caregivers Notified |
   |------|-----------|--------|------------|--------|---------------|---------------------|
   | [Date] | [Name] | Added/Removed/Dose changed | [Physician] | [Reason stated] | [When to start] | [Date and method] |

   This log creates a history that helps physicians understand the medication journey over time.

7. **Build the error prevention checklist:**
   - [ ] Verify medication against the master list at each administration (right medication, right dose, right time)
   - [ ] Check expiration dates monthly -- dispose of expired medications per pharmacy guidance
   - [ ] Never transfer medications between containers (keep in original labeled bottles for identification)
   - [ ] When a new caregiver takes over, walk through the entire medication list together
   - [ ] If a dose is missed, consult the physician's office or pharmacy before doubling the next dose
   - [ ] Store look-alike medications in separate locations to prevent mix-ups
   - [ ] Use a magnifying glass for small print on labels if needed

## Output Format

```
## Medication Management System for [Care Recipient Name]

### Master Medication List
Last updated: [Date]
Updated by: [Name]

| # | Medication (Brand/Generic) | Dose | Form | Frequency | Time | With Food | Prescriber | Pharmacy | Rx# | Refills Left | Next Refill |
|---|---------------------------|------|------|-----------|------|-----------|------------|----------|-----|-------------|-------------|
| 1 | [Name] | [Xmg] | [Tab] | [1x/day] | [7AM] | [Yes/No] | [Dr.] | [Pharmacy] | [#] | [X] | [Date] |

### Allergies and Adverse Reactions
| Substance | Reaction | Severity | Date Identified |
|-----------|----------|----------|-----------------|
| [Name] | [Reaction] | [Mild/Moderate/Severe] | [Date] |

### Daily Administration Schedule
| Time | Medication | Dose | Instructions |
|------|-----------|------|-------------|
| [Time] | [Name] | [Dose] | [Instructions] |

### Refill Calendar
| Medication | Next Refill | Refills Remaining | Action Needed |
|-----------|-------------|-------------------|---------------|
| [Name] | [Date] | [X] | [None / Schedule appointment / Contact pharmacy] |

### Physician Visit Checklist
[Pre-visit preparation items]

### Medication Change Log
| Date | Medication | Change | By | Reason |
|------|-----------|--------|-----|--------|
```

## Rules

1. NEVER advise on medication selection, dosing adjustments, or whether to take or stop any medication -- all medication decisions require a licensed physician or pharmacist
2. NEVER interpret side effects or drug interactions -- direct all such questions to the prescribing physician or pharmacist
3. ALWAYS include both brand name and generic name for every medication on the master list
4. ALWAYS include the prescribing physician for each medication -- when multiple specialists prescribe, this prevents confusion about who manages what
5. The master medication list must include over-the-counter medications and supplements -- physicians need the complete picture to assess interactions
6. ALWAYS include a process for communicating medication changes to all caregivers within 24 hours
7. The daily schedule must include a check-off mechanism -- memory is unreliable, especially with multiple medications
8. Include the allergies and adverse reactions section at the top of every medication document -- this information is critical in emergencies
9. Never recommend doubling a dose after a missed dose -- direct this question to the physician or pharmacy
10. ALWAYS recommend a single pharmacy when possible for interaction checking across all prescriptions

## Edge Cases

- **Multiple prescribers (PCP + specialists):** When several physicians prescribe medications, the risk of uncoordinated prescribing increases. Designate one physician (usually the PCP) as the medication review coordinator. Before any specialist appointment, provide the complete medication list. After any change, notify the coordinating physician. Flag this in the master list by color-coding medications by prescriber.

- **Cognitive impairment affecting self-administration:** When the care recipient has dementia or memory issues that prevent reliable self-administration, all medications should be caregiver-administered (not self-managed). Lock medications in a secure location. Use pre-filled pill organizers prepared by one designated person. Require initials from the administering caregiver for each dose. If the care recipient resists taking medications, document refusals and report to the physician -- do not force medications.

- **Frequent medication changes:** When medications change often (new diagnoses, dosage adjustments, trial periods), increase the update frequency on the master list. Add a "date last verified" field and check with the pharmacy monthly to ensure their records match yours. Use the change log actively and review it at every physician visit to confirm all changes were intentional.

- **Emergency situation:** In an emergency, the medication list must be immediately accessible to paramedics and emergency room staff. Keep a printed copy on the refrigerator (a common location paramedics check), in the care recipient's wallet, and as a photo on the primary caregiver's phone. Include allergies at the top in large, bold text. Update the emergency copies whenever the master list changes.

- **Transition between care settings (hospital to home, facility to home):** Medication reconciliation is critical at every care transition. At discharge, go through the discharge medication list with the discharging nurse and compare line by line with the pre-admission medication list. Ask specifically: what was added, what was stopped, what doses changed, and why. Contact the PCP within 48 hours of discharge to verify the medication plan. Many post-hospitalization medication errors occur because discharge instructions conflict with pre-existing prescriptions.

## Example

**Input:** "My mom takes about 8 medications prescribed by three different doctors. I keep getting confused about which ones she takes when, and I missed a refill last week. Can you help me set up a system?"

**Output:**

## Medication Management System for Mom

### Master Medication List
Last updated: [Today's date]
Updated by: [User's name]

| # | Medication | Dose | Form | Freq | Time | Food | Prescriber | Pharmacy | Rx# | Refills | Next Refill |
|---|-----------|------|------|------|------|------|------------|----------|-----|---------|-------------|
| 1 | Lisinopril (Zestril) | 10mg | Tablet | 1x/day | 7:00 AM | No | Dr. [PCP] | [Pharmacy] | [#] | 3 | [Date] |
| 2 | Metformin (Glucophage) | 500mg | Tablet | 2x/day | 7:00 AM, 5:00 PM | Yes | Dr. [PCP] | [Pharmacy] | [#] | 2 | [Date] |
| 3 | Amlodipine (Norvasc) | 5mg | Tablet | 1x/day | 7:00 AM | No | Dr. [Cardio] | [Pharmacy] | [#] | 5 | [Date] |
| 4 | Atorvastatin (Lipitor) | 20mg | Tablet | 1x/day | 9:00 PM | No | Dr. [Cardio] | [Pharmacy] | [#] | 4 | [Date] |
| 5 | Levothyroxine (Synthroid) | 50mcg | Tablet | 1x/day | 6:30 AM | Empty stomach, 30 min before food | Dr. [Endo] | [Pharmacy] | [#] | 1 | [Date] |
| 6 | Omeprazole (Prilosec) | 20mg | Capsule | 1x/day | 6:30 AM | 30 min before breakfast | Dr. [PCP] | [Pharmacy] | [#] | 0 | OVERDUE |
| 7 | Vitamin D3 | 2000 IU | Tablet | 1x/day | 7:00 AM | Yes | Dr. [PCP] | OTC | N/A | N/A | Buy monthly |
| 8 | Aspirin (low-dose) | 81mg | Tablet | 1x/day | 7:00 AM | Yes | Dr. [Cardio] | OTC | N/A | N/A | Buy monthly |

### Allergies and Adverse Reactions
| Substance | Reaction | Severity | Date Identified |
|-----------|----------|----------|-----------------|
| Penicillin | Hives, facial swelling | Severe | [Year] |
| Codeine | Nausea, vomiting | Moderate | [Year] |

### Daily Administration Schedule

**6:30 AM -- Empty Stomach (30 minutes before breakfast):**
| Medication | Dose | Special Instructions | Given | Time | Initials |
|-----------|------|---------------------|-------|------|----------|
| Levothyroxine (Synthroid) | 50mcg | Empty stomach, full glass of water | [ ] | _:_ | ___ |
| Omeprazole (Prilosec) | 20mg | Swallow whole, do not crush | [ ] | _:_ | ___ |

**7:00 AM -- With Breakfast:**
| Medication | Dose | Special Instructions | Given | Time | Initials |
|-----------|------|---------------------|-------|------|----------|
| Lisinopril | 10mg | | [ ] | _:_ | ___ |
| Metformin | 500mg | Take with food to reduce stomach upset | [ ] | _:_ | ___ |
| Amlodipine | 5mg | | [ ] | _:_ | ___ |
| Vitamin D3 | 2000 IU | | [ ] | _:_ | ___ |
| Aspirin 81mg | 81mg | Take with food | [ ] | _:_ | ___ |

**5:00 PM -- With Dinner:**
| Medication | Dose | Special Instructions | Given | Time | Initials |
|-----------|------|---------------------|-------|------|----------|
| Metformin | 500mg | Take with food | [ ] | _:_ | ___ |

**9:00 PM -- Bedtime:**
| Medication | Dose | Special Instructions | Given | Time | Initials |
|-----------|------|---------------------|-------|------|----------|
| Atorvastatin | 20mg | | [ ] | _:_ | ___ |

### Refill Calendar

| Medication | Next Refill | Refills Left | Action |
|-----------|-------------|-------------|--------|
| Omeprazole | **OVERDUE** | **0** | **Call Dr. [PCP] for new prescription immediately** |
| Levothyroxine | [Date] | 1 | Schedule Dr. [Endo] appointment before next refill |
| Metformin | [Date] | 2 | Set reminder 7 days before |
| Lisinopril | [Date] | 3 | Set reminder 7 days before |
| Amlodipine | [Date] | 5 | On track |
| Atorvastatin | [Date] | 4 | On track |

### Immediate Action Items
1. **Today:** Call Dr. [PCP] to request a new Omeprazole prescription (0 refills remaining)
2. **Today:** Transfer all prescriptions to one pharmacy if currently using multiple (enables interaction checking)
3. **This week:** Purchase a 7-day AM/PM pill organizer and fill it each Sunday evening
4. **This week:** Set phone reminders for refill dates (7 days before each refill due)
5. **This week:** Print this medication list -- place one copy on the refrigerator, one in Mom's wallet, and save one as a phone photo
6. **Within 2 weeks:** Schedule appointment with Dr. [Endo] before the Levothyroxine prescription expires (only 1 refill left)

### Coordination Note for Three Prescribers
Mom's PCP (Dr. [PCP]) should be designated as the medication review coordinator. Before appointments with Dr. [Cardio] or Dr. [Endo], bring the complete medication list. After any specialist changes a medication, call Dr. [PCP]'s office to inform them of the change.
