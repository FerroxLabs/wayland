---
name: medication-management-system
description: |
  Builds medication tracking systems including schedule templates, refill reminder frameworks, interaction question lists for providers, and storage guidelines. Produces a medication management document that helps users stay organized and have informed conversations with their healthcare providers about their medications.
  Use when the user asks about organizing medications, building a medication schedule, tracking refills, or preparing medication questions for their provider.
  Do NOT use for medication recommendations, dosage adjustments, drug interaction assessments, or any guidance that replaces a pharmacist or prescribing provider.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "checklist template guide"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Medication Management System

> **Disclaimer:** This skill provides general wellness and health organization information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. Nothing in this skill is a substitute for professional medical judgment from a licensed prescriber, pharmacist, or other qualified healthcare provider. Always consult your pharmacist or prescribing provider before making any changes to your medications. If you are experiencing a medical emergency, call emergency services immediately.

---

## When to Use

**Use this skill when the user:**
- Wants to build a complete medication tracking system for 2 or more prescriptions, over-the-counter (OTC) medications, vitamins, or supplements -- particularly when they are losing track of doses or refills
- Needs to create a master medication list to bring to a new provider, hospital visit, emergency room, or specialist appointment
- Wants to set up a refill cadence so they never run out of a critical medication unexpectedly
- Is managing medications for an elderly parent, a spouse with a chronic condition, or a child -- and needs a caregiver-compatible framework
- Is preparing specific, informed questions to ask their prescriber or pharmacist at an upcoming appointment
- Has recently added new medications and wants to reorganize their full regimen into a coherent daily schedule
- Has just been discharged from a hospital or urgent care and needs to integrate new prescriptions into their existing routine
- Travels frequently and needs a portable, organized medication profile to carry with them

**Do NOT use this skill when the user:**
- Asks whether two or more specific medications interact -- redirect to their pharmacist (use a clinical drug interaction skill if available, but never substitute AI output for pharmacist review)
- Reports experiencing a side effect, adverse reaction, or unexpected symptom after taking a medication -- advise them to contact their provider or pharmacist immediately; this is not an organization problem
- Asks whether they should take a specific medication, whether a dosage is appropriate, or whether a prescription is correct -- these are clinical questions for their prescriber
- Asks about stopping, tapering, or skipping doses of any medication -- especially corticosteroids, antidepressants, blood pressure medications, or anticoagulants, which have serious discontinuation risks
- Asks about self-medicating a specific condition with OTC products -- do not recommend specific OTC drugs for specific symptoms
- Asks for an interpretation of their lab results in relation to their medications -- this requires clinical judgment
- Is in distress about a potential overdose -- direct them to Poison Control (1-800-222-1222 in the US) or emergency services immediately; do not proceed with this skill
- Needs prior authorization guidance, insurance appeals, or pharmaceutical assistance program navigation -- refer them to their pharmacy's billing department or a patient advocate

---

## Process

### Step 1: Clarify the User's Medication Management Context

Before building anything, gather the minimum necessary information to personalize the system. Ask in a single, conversational message -- do not interrogate with a long form.

- **How many medications:** Distinguish between prescriptions, OTC daily medications (antacids, antihistamines, pain relievers taken on a schedule), vitamins, and supplements. Each category belongs in the master list.
- **Existing organization method:** None, pill organizer, phone alarms, pharmacy blister packs, caregiver-managed, or a previous paper list. Understanding the current system identifies friction points.
- **Primary pain point:** Forgetting doses, running out before refills, confusion about which doctor prescribed what, managing multiple pharmacy locations, or traveling. Tailor the system architecture to the specific breakdown.
- **Caregiver vs. self-management:** If the user manages another person's medications, the system must include emergency contacts, legal authority (healthcare proxy), and caregiver handoff protocols.
- **Pharmacy setup:** Single pharmacy, multiple pharmacies, mail-order service (90-day supplies), or specialty pharmacy for complex medications. This affects refill cadence calculations significantly.
- **Time-sensitive medications:** Ask if any of their medications must be taken at specific times (e.g., thyroid medications on an empty stomach, certain antibiotics at even intervals, insulin timed to meals). These require more precise scheduling infrastructure.

If the user doesn't know some details (e.g., exact dose or prescribing provider), build the list with placeholders and include a note advising them to verify with their pharmacy -- pharmacists can print a complete medication history on request.

---

### Step 2: Build the Medication Master List

The master list is the foundation of every other component. It must be complete, current, and portable.

- **Capture both generic and brand names** for every medication. Generic names travel across insurance plans, pharmacies, and countries. Brand names help with recognition in medicine cabinets. Example: metformin (Glucophage), atorvastatin (Lipitor), levothyroxine (Synthroid).
- **Record dose and form precisely:** "10 mg tablet," "500 mg extended-release tablet," "0.05 mg/mL nasal spray (2 sprays per nostril)," or "1000 IU softgel." The form matters -- a 10 mg immediate-release and a 10 mg extended-release are different medications with different administration rules.
- **Indicate the route of administration:** Oral, sublingual, topical, inhaled, injected, transdermal patch, eye drops, ear drops. This is especially important in emergency situations.
- **Record the prescribing provider for each medication** -- full name and specialty, not just "my doctor." Cardiologists, endocrinologists, psychiatrists, and primary care providers may all be prescribing simultaneously.
- **Identify the dispensing pharmacy** for each medication -- some medications may be filled at a retail chain, others at a specialty pharmacy, others through mail-order. Record the pharmacy name and phone number for each.
- **Record current days supply and last fill date.** Most 30-day supplies are actually dispensed for 28-30 tablets, and the math of "when does this run out" must be exact for time-sensitive medications.
- **Note the purpose in the patient's own words** -- not the clinical indication, but what the provider told the patient. "For my blood pressure," "for cholesterol," "for my anxiety," "a vitamin my cardiologist recommended." This prevents accidental duplication when a new provider prescribes something similar.
- **Flag any medications requiring special monitoring:** medications requiring periodic lab work (lithium requires serum levels, warfarin requires INR, thyroid medications require TSH), medications with narrow therapeutic windows, or controlled substances with specific refill restrictions.

---

### Step 3: Design the Daily Medication Schedule

A usable schedule is organized by time-of-day administration windows, not by medication category. The goal is a single daily checklist that requires zero decision-making.

- **Identify natural administration anchors:** Waking up, breakfast, lunch, dinner, and bedtime are the five most reliable anchors because they are tied to habitual behavior. Linking medication times to meals or routine transitions dramatically improves adherence.
- **Morning fasting medications must be separated from food-dependent medications.** Levothyroxine, bisphosphonates (alendronate/Fosamax), and certain statins require an empty stomach or specific timing relative to food and other medications. These go first in the morning, before food anchors.
- **With-food medications go on the next anchor after the fasting window.** If a fasting medication requires 30-60 minutes before food, the with-breakfast medications follow at the breakfast anchor.
- **Twice-daily medications (BID) work best at 12-hour intervals** when clinical precision matters (e.g., antibiotics, certain blood pressure medications, metformin). Pair with breakfast and dinner anchors to achieve near-12-hour spacing.
- **Three-times-daily (TID) scheduling** should use breakfast, lunch, and dinner anchors -- or as directed by the provider. Alert the user that "three times daily" from a prescriber sometimes means every 8 hours for certain drug classes. They should verify the intended interval with their pharmacist if unclear.
- **Bedtime medications** include sleep aids (melatonin, prescription hypnotics), some blood pressure medications (amlodipine, certain beta blockers prescribed at night), and medications that cause drowsiness. These should be separated from any stimulating medications.
- **As-needed (PRN) medications** must include the condition for use exactly as described by the provider. Never define the condition yourself. Format as: "[Medication name] -- [dose] -- as directed by [Provider name] for [patient's stated purpose]." This preserves the provider's instruction without interpretation.
- **Patch and weekly/monthly medications** need their own tracking line since they do not fit daily checkbox logic. A weekly medication (like alendronate, taken once weekly on the same day) requires a separate weekly reminder, not a daily checkbox.

---

### Step 4: Build the Refill Tracking System

Running out of a critical medication -- especially antihypertensives, antidepressants, anticoagulants, or diabetes medications -- is a preventable safety risk. The refill system must eliminate this entirely.

- **Calculate days remaining with precision:**
  - Formula: (tablets on hand) ÷ (tablets per day) = days of supply remaining
  - Example: 42 tablets remaining ÷ 2 tablets/day = 21 days remaining
  - For inhalers, calculate doses remaining: most metered-dose inhalers have 60 or 120 doses per canister. Track actuation count if the user has an actuator counter; otherwise use fill date and prescribed frequency.
- **Set refill reminder thresholds by dispensing channel:**
  - Retail pharmacy (same-day pickup): request refill at 7 days remaining
  - Retail pharmacy with stock issues (specialty medications, compound medications, controlled substances with state-mandated waiting periods): request at 10-14 days remaining
  - Mail-order pharmacy (standard): request at 14 days remaining to allow 7-10 business days shipping plus processing
  - Mail-order pharmacy (USPS-dependent or rural areas): request at 21 days remaining
  - Specialty pharmacy with prior authorization requirements: request at 21 days remaining; prior auth can delay dispensing by 5-10 business days
- **Medication synchronization (med sync):** Advise users with 3+ retail prescriptions to ask their pharmacist about a synchronization program. Most major retail pharmacy chains offer this. All medications are aligned to fill on the same date each month. This reduces trips, reduces the chance of missing a refill, and allows for a monthly pharmacist check-in. Note: Some controlled substances may not be eligible for sync programs in certain states.
- **90-day supply vs. 30-day supply decisions:** Mail-order or 90-day retail fills reduce the frequency of refill logistics. Many insurance plans incentivize 90-day fills with lower co-pays. For stable, long-term medications, 90-day fills reduce out-of-pocket cost and the risk of running out. Note: if a dose change is anticipated (e.g., a medication being titrated), 30-day fills are preferable until the dose stabilizes.
- **Controlled substance refill rules:** Schedule II medications (certain stimulants, opioid pain medications) cannot be refilled early in most US states -- they require a new prescription each time and cannot be called in by phone. Schedule III-V medications have specific early refill windows. Do not advise the user on how to navigate these rules; advise them to ask their prescriber and pharmacist about their state's specific regulations.
- **Track refill history, not just upcoming refills.** A "last filled" date anchors the next fill calculation and provides documentation if a prescription is ever disputed, lost, or audited by insurance.

---

### Step 5: Build the Provider Communication Framework

Patients who arrive at appointments with organized, written questions receive more thorough care. This framework prepares the user to be an informed participant -- without crossing into clinical territory.

- **Universal questions for every appointment with every prescriber:**
  - Is each medication I am currently taking still appropriate for my current health status?
  - Have any of my diagnoses or health goals changed in a way that affects my medications?
  - Are there any new interactions I should know about, given my full medication list? (Provide the complete master list at every appointment)
  - Which of my medications, if missed for a day or two, require a specific make-up protocol?
  - Am I due for any monitoring labs related to my current medications?

- **Questions specific to newly prescribed medications:**
  - What is this medication intended to do, and how will I know if it is working?
  - How long will I take this medication -- is this short-term or long-term?
  - Are there any foods, beverages (grapefruit is a notable interaction with many medications), or supplements I should avoid while taking this?
  - What is the correct protocol if I miss a dose of this specific medication?
  - Is there a generic equivalent available, and does my insurance cover it?

- **Questions for the pharmacist specifically (not the prescriber):**
  - Can you review my complete medication list for interactions? (Pharmacists are the most accessible, best-trained professionals for this specific task)
  - Should I take any of these medications at a different time relative to each other?
  - Are there any over-the-counter products I should avoid given my current prescriptions?
  - What is the best way to dispose of my expired or unused medications?

- **Information the user must proactively bring to every appointment:**
  - The complete medication master list (printed or on phone) -- including OTC drugs, vitamins, and supplements
  - Any new medications, supplements, or herbal products started since the last visit
  - Doses missed in the past month: which medication, how often, and why (adherence data shapes prescribing decisions)
  - Any new providers seen since the last visit, and what was prescribed
  - Any samples given by another provider (samples often bypass pharmacy records)

- **"Brown bag" review:** Recommend that users periodically bring all of their actual medication bottles in a bag to their primary care provider or pharmacist for a comprehensive review. This identifies duplicate therapies, outdated prescriptions, and medications that may no longer be needed. Many pharmacies offer brown bag medication reviews at no charge.

---

### Step 6: Build the Storage and Safety Infrastructure

Poor storage degrades medications, creates safety risks, and can result in accidental ingestion by children or pets. This section should be practical and specific.

- **Avoid the bathroom medicine cabinet** -- despite its name, bathrooms are among the worst locations. Heat and humidity from showers and baths degrade tablets, capsules, and liquid medications. Temperature fluctuations accelerate chemical breakdown.
- **Recommended storage locations:**
  - Kitchen cabinet away from the stove and dishwasher (heat sources degrade medications)
  - Bedroom dresser drawer (cool, dry, dark, and accessible to the person taking the medications)
  - A designated top shelf in a hall closet, out of reach of children
  - For refrigerated medications (certain insulins, biologics, liquid antibiotics): store in the main compartment of the refrigerator, not the door (temperature variation at the door is significant). Never freeze insulin unless the pharmacist explicitly states the product is safe for freezing.
- **Temperature-sensitive medications:** Nitroglycerin degrades rapidly with temperature changes and must be kept in its original brown glass bottle. Epinephrine auto-injectors (EpiPens) should not be refrigerated and should not be left in a hot car. Insulin in use can be stored at room temperature for 28-30 days depending on the product type -- always verify with the pharmacist.
- **Original containers are mandatory for safety and legality:** Labels contain the drug name, dose, prescribing provider, dispensing date, and pharmacy contact information -- all critical in an emergency. Controlled substances in unlabeled containers can create legal problems. Do not transfer medications into pill organizers and discard original bottles until the pill organizer is fully used.
- **Expiration dates:** Check all medications on the first of each month. Expired medications should be disposed of promptly. Potency degrades after expiration (most medications lose efficacy). A few medications, notably tetracycline antibiotics, can become harmful after expiration. When in doubt, ask the pharmacist.
- **Disposal:** The safest disposal options in order of preference:
  1. DEA-authorized medication take-back locations (many retail pharmacies and police stations)
  2. FDA-recommended household disposal method: mix with coffee grounds, cat litter, or dirt in a sealed plastic bag, then place in household trash
  3. Flushing is recommended ONLY for a specific FDA list of high-risk medications (certain opioids, certain sedatives) where accidental ingestion risk outweighs disposal risk -- verify with the pharmacist
- **Child and pet safety:** All medications -- including vitamins and supplements -- should be stored in child-resistant containers in locked cabinets or high locations if children or pets are in the home. Iron supplements are a leading cause of pediatric poisoning. Keep the Poison Control number visible: in the US, 1-800-222-1222.
- **Emergency medication card:** Every person with 3+ medications should carry a wallet card or maintain a phone note with: full name, date of birth, all medications with doses, known allergies (including medication allergies), primary care provider name and phone, and emergency contact. This is used by emergency responders and ER staff.

---

### Step 7: Finalize, Format, and Deliver the Document

Deliver the complete medication management document as a clean, printable output the user can reference immediately.

- **Format for practical use:** Use tables for the master list and refill tracker (scannable at a glance). Use checklists for the daily schedule (actionable). Use numbered lists for provider questions (easy to work through in sequence).
- **Prompt the user to verify all fields with their actual medication bottles and pharmacy records.** The document is a structure -- the user must fill in their specific details. Flag every field that requires their input with a clear placeholder.
- **Include a "last updated" field at the top** of the document. Medication lists go stale quickly. Prompt the user to update the document whenever a new medication is added, a dose changes, or a medication is discontinued.
- **Recommend printing one physical copy** and keeping a digital backup. Paper copies are accessible when phones are dead or unavailable; digital copies are searchable and shareable with providers.
- **Advise sharing the document with a trusted emergency contact** -- a family member, close friend, or caregiver -- who can act on it if the user is incapacitated.

---

## Output Format

```
========================================
MEDICATION MANAGEMENT SYSTEM
Last Updated: [DATE]
Patient Name: [NAME]
Date of Birth: [DOB] (for emergency identification)
Known Medication Allergies: [LIST OR "NKDA - No Known Drug Allergies"]
Primary Care Provider: [Name, Phone]
Primary Pharmacy: [Name, Phone]
Emergency Contact: [Name, Relationship, Phone]
========================================

---

## SECTION 1: MEDICATION MASTER LIST

| # | Generic Name (Brand) | Form & Dose | Route | Frequency | Timing | Prescriber | Pharmacy | Purpose (Your Words) | Special Notes |
|---|---------------------|-------------|-------|-----------|--------|-----------|----------|----------------------|---------------|
| 1 | [Generic (Brand)]   | [X mg tab]  | Oral  | Once daily| Morning, empty stomach | [Dr. Name, Specialty] | [Pharmacy] | [e.g., "for thyroid"] | Take 30 min before food |
| 2 | [Generic (Brand)]   | [X mg tab]  | Oral  | Twice daily| Morning + Evening | [Dr. Name, Specialty] | [Pharmacy] | [e.g., "for blood pressure"] | Take with food |
| 3 | [Generic (Brand)]   | [X mg cap]  | Oral  | Once daily| Bedtime | [Dr. Name, Specialty] | [Pharmacy] | [e.g., "for cholesterol"] | Avoid grapefruit -- verify with pharmacist |
| 4 | [Generic (Brand)]   | [X mcg tab] | Oral  | Once weekly| Sunday morning | [Dr. Name, Specialty] | [Pharmacy] | [e.g., "for bone health"] | Take with full glass of water, remain upright 30 min |
| 5 | [Supplement/OTC]    | [Dose]      | Oral  | Once daily| With breakfast | Self/[Provider] | [Pharmacy/Store] | [e.g., "Vitamin D - cardiologist recommended"] | -- |

---

## SECTION 2: DAILY MEDICATION SCHEDULE

**On Waking (Before Food -- Fasting Required):**
- [ ] [Medication 1] -- [dose] -- wait [X] minutes before eating
- [ ] [Medication 2] -- [dose] -- if applicable

**Morning (With Breakfast):**
- [ ] [Medication 3] -- [dose] -- take with food
- [ ] [Medication 4] -- [dose]
- [ ] [Supplement]  -- [dose]

*Recommended breakfast alarm: [e.g., 8:00 AM]*

**Midday (With Lunch):**
- [ ] [Medication 5] -- [dose] -- only if prescribed TID with meals
*Only include if medications are prescribed for midday administration*

**Evening (With Dinner):**
- [ ] [Medication 6] -- [dose] -- take with food
- [ ] [Medication 7] -- [dose]

*Recommended dinner alarm: [e.g., 6:30 PM]*

**Bedtime:**
- [ ] [Medication 8] -- [dose]

*Recommended bedtime alarm: [e.g., 10:00 PM]*

**Weekly (Not Daily):**
- [ ] [Medication] -- [dose] -- every [DAY OF WEEK]
  Set a recurring weekly phone reminder for [DAY, TIME]

**As Needed (PRN):**
- [Medication] -- [dose] -- as directed by [Provider Name] for [patient's stated purpose]
  Do NOT exceed [X] per day / per week as instructed by provider

---

## SECTION 3: REFILL TRACKER

| Medication | Last Filled | Days Supply | Tablets on Hand | Days Remaining | Refill Reminder Date | Dispensing Channel | Pharmacy Phone |
|------------|-------------|-------------|-----------------|----------------|----------------------|--------------------|----------------|
| [Name]     | [Date]      | 30 days     | [#]             | [Calculate]    | [Date minus 7 days]  | Retail             | [Number]       |
| [Name]     | [Date]      | 90 days     | [#]             | [Calculate]    | [Date minus 14 days] | Mail-order         | [Number]       |
| [Name]     | [Date]      | 30 days     | [#]             | [Calculate]    | [Date minus 14 days] | Specialty          | [Number]       |

**Refill Buffer Rules (copy from these):**
- Retail pharmacy standard: request 7 days before supply runs out
- Mail-order pharmacy: request 14 days before supply runs out
- Specialty pharmacy or prior auth required: request 21 days before supply runs out
- Controlled substance (Schedule II): contact prescriber for new prescription; cannot be called in

**Days Remaining Formula:**
Tablets on hand ÷ tablets per day = days remaining
Example: 18 tablets ÷ 2 per day = 9 days remaining -- refill now if retail

---

## SECTION 4: PROVIDER COMMUNICATION GUIDE

### Questions for Every Prescriber Appointment:
1. Are all of my current medications still appropriate given my health status today?
2. Have any of my conditions changed in a way that should affect my medications?
3. I'm going to hand you my complete medication list -- can you review it for anything that concerns you?
4. Am I due for any lab work or monitoring related to my current medications?
5. Which of my medications would be most critical not to miss -- and what should I do if I do miss a dose?
6. [Add personalized questions here based on user's specific situation]

### Questions for a Newly Prescribed Medication:
1. How will I know this medication is working?
2. How long am I expected to take it?
3. Are there foods, drinks, or supplements to avoid? (Ask specifically about grapefruit if relevant)
4. What do I do if I miss a dose of this specific medication?
5. Is a generic available and covered by my insurance?

### Questions for My Pharmacist:
1. I'm going to show you my full medication list -- can you check for any interactions or timing conflicts?
2. Should any of these medications be taken at a specific time relative to each other?
3. Are there any OTC medications I should avoid given what I'm currently taking?
4. Can you show me how to dispose of my expired medications?

### Information to Bring to Every Appointment:
- [ ] Printed or phone copy of this complete medication list
- [ ] List of any new medications, supplements, or vitamins started since last visit
- [ ] Notes on any doses missed in the past month (medication name and approximate frequency)
- [ ] Any prescriptions from other providers written since last visit
- [ ] Any medication samples received from any provider

---

## SECTION 5: STORAGE AND SAFETY CHECKLIST

**Storage:**
- [ ] All medications stored in: [Location -- e.g., kitchen cabinet, bedroom drawer] -- NOT the bathroom
- [ ] Refrigerated medications in main fridge compartment (not door): [List if applicable]
- [ ] Temperature-sensitive medications stored per pharmacist instructions: [List if applicable]
- [ ] All medications in original labeled containers
- [ ] Child-resistant caps in use (if children or pets in the home)

**Monthly Safety Check (Do on the 1st of each month):**
- [ ] Check all expiration dates -- remove and dispose of expired items
- [ ] Count tablets and update the refill tracker
- [ ] Confirm refill reminder dates are current
- [ ] Update the medication master list if anything has changed

**Emergency Information (Post Somewhere Visible or Keep in Wallet):**
- Full name: ________________
- Date of birth: ________________
- Medication allergies: ________________
- Current medications (attach master list or summary)
- Primary care provider: ________________ Phone: ________________
- Primary pharmacy: ________________ Phone: ________________
- Emergency contact: ________________ Phone: ________________
- Poison Control (US): 1-800-222-1222

**Disposal:**
- Preferred method: Take-back program at participating pharmacy or police station
- Household disposal: Mix with coffee grounds or cat litter in sealed bag, place in trash
- Do NOT flush unless pharmacist specifically advises it for that medication
```

---

## Rules

1. **Never assess, confirm, or speculate about drug interactions** -- even if the user names two medications and asks directly. Acknowledge the question, redirect to the pharmacist, and proceed with the organizational framework only. Pharmacists have access to clinical interaction databases that no organizational skill can replicate.

2. **Never recommend a medication, supplement, dose, or frequency** -- including common OTC products. If the user asks whether they should take vitamin D or whether 10 mg is the right dose for their blood pressure medication, the answer is always: ask your prescriber or pharmacist.

3. **Never define or reinterpret a PRN (as-needed) medication's conditions for use.** If the user says their provider told them to take something "when my chest feels tight," record exactly that phrase. Do not substitute "for breathing difficulty" or any other interpretation.

4. **Always include the prescribing provider for every prescription medication** -- full name and specialty, not just "my doctor." In multi-prescriber situations, the identity of each prescriber is critical safety information.

5. **The daily schedule must be built around the user's actual lifestyle anchors** -- not a theoretical ideal schedule. A person who does not eat breakfast needs a non-food anchor for morning medications. A shift worker with a non-standard sleep schedule needs a schedule built around their actual wake/sleep cycle.

6. **Refill reminders must account for dispensing channel.** A single 7-day reminder works for a retail pharmacy. It is dangerously insufficient for mail-order or specialty pharmacy. Distinguish these explicitly and set the appropriate buffer.

7. **Controlled substances (Schedule II-V in the US) have legal constraints that vary by state** -- including refill timing windows, quantity limits, and prescription format requirements. Do not advise the user on how to navigate or work around these rules. Advise them to ask their prescriber and pharmacist directly.

8. **The master list must include supplements and vitamins alongside prescriptions.** Omega-3 fatty acids at high doses affect bleeding time. St. John's Wort induces drug-metabolizing enzymes and reduces the efficacy of numerous medications. Vitamin K affects anticoagulation. These are not inert -- they belong on the list and should be disclosed to every provider.

9. **If the user's information is incomplete** -- they do not know the dose, the prescriber, or the purpose of a medication -- build the list with explicit placeholder fields and tell them exactly how to find the missing information: ask their pharmacist for a printed medication history, which pharmacies are required to provide.

10. **Never name a specific medication management app, electronic health record patient portal, or pharmacy service brand as the solution** unless the user has already named it themselves. Recommend the functional category (phone calendar reminders, pill organizer, pharmacy synchronization program) and let the user choose the specific tool.

11. **The "last updated" date on the medication document is not cosmetic.** A medication list that was last reviewed 18 months ago may be dangerously outdated. Always include it and prompt the user to treat it as a live document requiring updates with every medication change.

12. **If the user cannot identify the purpose of any medication on their list**, advise them to contact the prescribing provider's office or their pharmacist before the next scheduled dose. Taking an unknown medication is a safety risk. Do not attempt to identify the medication's purpose from its name.

---

## Edge Cases

### The User Manages Medications for an Elderly Parent or Dependent Adult

The system requires additional infrastructure beyond self-management.

- Add a caregiver section to the master list header: who has legal authority to pick up controlled substances (must be designated on file at the pharmacy -- this is a pharmacy-specific enrollment, not assumed); who is the healthcare proxy or power of attorney for medical decisions; all caregivers' names, phone numbers, and designated responsibilities.
- Build the daily schedule to be used by anyone filling the caregiver role, not just the primary caregiver. Avoid pronouns; use the patient's name. Include specific notes about known adherence challenges (e.g., "Mom refuses the pink tablet -- it is [medication name] -- ask her doctor about a tablet-splitting or liquid alternative").
- Include a caregiver handoff log -- a simple dated log where each caregiver records doses given and any observations. This prevents double-dosing and creates a record for the provider.
- Flag any medications with high fall risk in elderly patients -- sedatives, hypnotics, some blood pressure medications, and anticholinergic drugs are associated with falls in older adults. The user should discuss fall risk specifically with the provider; document this as a provider question, not an assessment.
- Identify which medications can be crushed or opened (for patients who cannot swallow tablets) and which absolutely cannot -- extended-release tablets, enteric-coated tablets, and certain capsules must not be crushed. This is a pharmacist question; flag it explicitly in the document.

### The User Has Multiple Prescribers Across Specialties

Fragmented prescribing is a significant medication safety risk. The organizational system must compensate.

- Map each medication to its prescribing provider and flag any cases where two providers are prescribing medications in the same drug class (e.g., two different blood pressure medications from two different specialists -- this may be intentional or may represent a gap in communication).
- Do not assess whether this is appropriate -- flag it as a question for the primary care provider, who should function as the coordinator of the full medication regimen.
- Build a "prescriber notification log" -- a simple table recording when each prescriber was last given a copy of the complete medication list. The user should hand the printed master list to every provider at every appointment and request that it be scanned into their record.
- Note that specialist prescribers often do not receive updates from other specialists unless the patient initiates it. The primary care provider is the best single point of coordination.
- Identify any prescriptions that may need renewal from an unavailable or retired provider -- advise the user to request a transition of care from their primary care provider before the supply runs out.

### The User Travels Frequently (Domestic and International)

Medication management while traveling requires advance planning with specific lead times.

- **Domestic US travel (air):** TSA permits medications in carry-on and checked luggage in quantities exceeding 3.4 oz. Carry medications in original labeled containers. Recommend carry-on for all medications -- checked luggage can be lost or delayed. Bring enough supply for the trip plus 3-5 extra days as buffer for delays.
- **International travel:** Research the destination country's importation rules for each medication. Controlled substances are especially regulated -- some medications legal in the US are controlled or banned in other countries. The US embassy or consulate website for the destination country is the appropriate reference. Advise the user to consult their provider and pharmacist at least 4 weeks before international travel.
- **Time zone adjustments for time-sensitive medications:** For medications dosed at specific intervals for clinical reasons (e.g., oral contraceptives, HIV antiretrovirals, immunosuppressants), time zone shifts require a dosing adjustment plan. This is a provider conversation -- document a pre-travel provider question: "How should I adjust the timing of [medication] when crossing [X] time zones?"
- **Refrigerated medications:** Insulin, biologics, and some liquid medications require temperature control. Insulated travel cases with gel packs maintain temperature for 24-48 hours. For longer travel, advise the user to ask their pharmacist for guidance on the specific product's temperature tolerance.
- **Documentation for international travel:** A letter from the prescribing provider on practice letterhead -- including the patient's name, medication names, doses, and medical necessity -- is recommended for any controlled substance or injectable medication carried across international borders.

### The User Was Just Discharged from a Hospital or Emergency Setting

Post-discharge medication reconciliation is one of the highest-risk medication scenarios. Errors occur frequently at care transitions.

- The user may have new medications, discontinued medications, and dose changes -- all in a single event. The existing medication list is likely outdated the moment they are discharged.
- Build the master list from scratch using the discharge medication list provided at discharge (sometimes called a "discharge summary" or "discharge instructions"). Do not assume previous medications are still active.
- Explicitly flag any medication on the pre-admission list that does NOT appear on the discharge list -- these may have been intentionally discontinued or may have been omitted in error. Document these as questions for the first follow-up appointment.
- Post-discharge follow-up appointments are typically scheduled within 7-14 days. Advise the user to call the provider's office within 24-48 hours if they cannot get the discharge medication list, if they cannot understand the instructions, or if they are unable to obtain any prescribed medication.
- Some discharge prescriptions are short-term (a 5-day antibiotic, a brief steroid taper); others are new long-term medications. The user should ask the discharging provider or follow-up provider which new medications are temporary and which are permanent additions to their regimen.

### The User Has a Very Simple Regimen (1-2 Medications, Stable)

The full system may be more complexity than the situation requires. Scale appropriately.

- For a single daily medication with a 30-day refill, the system can be simplified to: a single phone alarm at a consistent daily time, a calendar event 23 days after each fill date (7-day buffer before a 30-day supply runs out), and a single card or note with the medication name, dose, prescribing provider, and pharmacy contact information.
- Still include the provider communication questions -- even simple regimens benefit from asking whether the medication is still appropriate and whether a generic is available.
- Still include the master list -- even one medication should be documented with prescriber and purpose, because this becomes the seed of a more complete document when additional medications are added later.
- Avoid overbuilding. A complex tracking system for a single antibiotic course is counterproductive. Acknowledge the simplicity of the regimen and deliver a proportionally simple document.

### The User Reports They Are Currently Missing Medication or Cannot Afford a Refill

This is not an organizational problem -- it is an access problem requiring immediate guidance.

- Do not proceed with the standard medication management system until the immediate gap is addressed.
- For affordability barriers: advise the user to contact their pharmacist about generic alternatives, manufacturer patient assistance programs (available for most brand-name medications), and GoodRx-type discount programs (mention the category, not a specific brand). Their pharmacist is the best navigator for cost reduction options.
- For a lapsed prescription that cannot be renewed without an appointment: advise them to call the prescriber's office and explain they are out of medication. Most offices can provide a bridge supply or emergency refill for established patients without requiring an immediate appointment. Urgent care providers can also bridge critical medications in some cases.
- For a potentially dangerous gap (anticoagulants, seizure medications, immunosuppressants, insulin): advise the user to contact their provider or pharmacist the same day. Missing even a few doses of some medications carries serious risk. Flag this explicitly.
- Do not assess which medications are dangerous to miss -- advise them to call their pharmacist or prescriber with that question.

---

## Example

**Input:** "I take 6 different medications -- metformin twice a day, lisinopril once a day in the morning, atorvastatin at night, a levothyroxine pill first thing in the morning, vitamin D once a day, and omeprazole in the morning. I have two different doctors and I always forget which one prescribed what. I also keep running out of my metformin before I remember to refill it. Can you help me build a real system?"

**Output:**

---

```
========================================
MEDICATION MANAGEMENT SYSTEM
Last Updated: [TODAY'S DATE -- update whenever a medication changes]
Patient Name: [YOUR NAME]
Date of Birth: [DOB -- for emergency identification]
Known Medication Allergies: [Fill in or write NKDA if none known]
Primary Care Provider: [Name, Phone -- fill in]
Endocrinologist / Specialist: [Name, Phone -- if applicable]
Primary Pharmacy: [Name, Phone -- fill in]
Emergency Contact: [Name, Relationship, Phone -- fill in]
========================================
```

---

### SECTION 1: MEDICATION MASTER LIST

| # | Generic Name (Brand) | Form & Dose | Route | Frequency | Timing | Prescriber | Pharmacy | Purpose (Your Words) | Special Notes |
|---|---------------------|-------------|-------|-----------|--------|-----------|----------|----------------------|---------------|
| 1 | Levothyroxine (Synthroid) | [X mcg tab] | Oral | Once daily | On waking -- before food | [Dr. Name -- fill in] | [Pharmacy] | [e.g., "for my thyroid"] | Must be taken on empty stomach; wait 30-60 min before breakfast; separate from calcium or iron supplements by 4 hours -- verify exact timing with pharmacist |
| 2 | Omeprazole (Prilosec) | [X mg capsule] | Oral | Once daily | 30-60 min before breakfast | [Dr. Name -- fill in] | [Pharmacy] | [e.g., "for acid reflux / stomach"] | Works best taken before first meal of the day -- ask pharmacist whether this timing conflicts with your levothyroxine window |
| 3 | Metformin (Glucophage) | [X mg tablet] | Oral | Twice daily | With breakfast + With dinner | [Dr. Name -- fill in] | [Pharmacy] | [e.g., "for blood sugar / diabetes"] | Must be taken WITH food to reduce stomach upset; do not take on empty stomach |
| 4 | Lisinopril (Zestril/Prinivil) | [X mg tablet] | Oral | Once daily | Morning (with breakfast) | [Dr. Name -- fill in] | [Pharmacy] | [e.g., "for blood pressure"] | Ask your prescriber whether morning or evening timing is preferred for your situation |
| 5 | Atorvastatin (Lipitor) | [X mg tablet] | Oral | Once daily | Bedtime | [Dr. Name -- fill in] | [Pharmacy] | [e.g., "for cholesterol"] | Avoid large amounts of grapefruit/grapefruit juice -- verify with pharmacist |
| 6 | Vitamin D3 | [X IU softgel] | Oral | Once daily | With breakfast | [Self / Dr. Name -- fill in] | [Pharmacy/Store] | [e.g., "for bone health / Vitamin D deficiency"] | Fat-soluble -- absorbs better with a meal that contains fat |

**⚠ Action item:** Confirm with each prescriber which doctor prescribed which medications. Bring this list to your next appointment with each provider and ask them to verify the list is complete and accurate.

---

### SECTION 2: DAILY MEDICATION SCHEDULE

**On Waking (Empty Stomach -- Before Breakfast):**
- [ ] Levothyroxine -- [X mcg] -- immediately on waking, before food or coffee
  - Set a waking alarm for this medication specifically

*Wait 30-60 minutes (check with your pharmacist for your specific product) before moving to breakfast*

**Morning (At Breakfast -- With Food):**
- [ ] Omeprazole -- [X mg] -- take 30-60 min before breakfast if possible, or at start of breakfast if same-time dosing is needed (ask your pharmacist about timing relative to levothyroxine)
- [ ] Metformin -- [X mg] -- take WITH breakfast (not before)
- [ ] Lisinopril -- [X mg] -- take with breakfast
- [ ] Vitamin D3 -- [X IU] -- take with breakfast (fat-containing meal improves absorption)

*Set a breakfast medication alarm: [e.g., 8:00 AM -- adjust to your actual breakfast time]*

**Evening (At Dinner -- With Food):**
- [ ] Metformin -- [X mg] -- take WITH dinner (second daily dose)

*Set a dinner medication alarm: [e.g., 6:30 PM -- adjust to your actual dinner time]*

**Bedtime:**
- [ ] Atorvastatin -- [X mg] -- take at bedtime

*Set a bedtime medication alarm: [e.g., 10:00 PM]*

**As Needed (PRN):** [None listed -- add any if applicable]

---

### SECTION 3: REFILL TRACKER

| Medication | Last Filled | Days Supply | Tablets on Hand | Days Remaining | **Refill Reminder Date** | Pharmacy Phone |
|------------|-------------|-------------|-----------------|----------------|--------------------------|----------------|
| Levothyroxine | [Date] | 30 days | [Count tonight] | [Calculate] | [Fill date + 23 days] | [Number] |
| Omeprazole | [Date] | 30 days | [Count tonight] | [Calculate] | [Fill date + 23 days] | [Number] |
| **Metformin** | [Date] | 30 days | [Count tonight] | [Calculate] | [Fill date + 23 days] | [Number] |
| Lisinopril | [Date] | 30 days | [Count tonight] | [Calculate] | [Fill date + 23 days] | [Number] |
| Atorvastatin | [Date] | 30 days | [Count tonight] | [Calculate] | [Fill date + 23 days] | [Number] |
| Vitamin D3 | [Date] | [Varies] | [Count] | [Calculate] | [7 days before out] | [Number/Store] |

**Your Metformin Fix -- Why You Keep Running Out:**
You are running out of metformin because you are likely refilling at the last minute. Here is how to fix it:

1. Tonight: Count your remaining metformin tablets. Divide by 2 (you take 2 per day). That is your days remaining.
2. Set a phone calendar event titled "Refill Metformin" for the date that is 7 days before you calculate running out.
3. When that reminder fires, call or use the pharmacy app to request the refill. Do not wait until the day you run out.
4. **Better fix:** Ask your pharmacy about medication synchronization. All 5 of your prescriptions can be aligned to refill on the same day each month. One trip. One reminder date. Ask at your next pharmacy visit.

**Days Remaining Calculation:**
Tablets on hand ÷ tablets per day = days remaining
Metformin example: 15 tablets on hand ÷ 2 per day = 7.5 days remaining -- request refill immediately

---

### SECTION 4: PROVIDER COMMUNICATION GUIDE

**Questions for Your Prescribing Providers (bring this list to appointments):**

*For your primary care appointment:*
1. I have medications from two different doctors -- can you review my complete list and confirm you are aware of everything I am taking, including my Vitamin D?
2. Are there any interactions or timing conflicts between all six of these medications that I should know about?
3. Is there a monitoring lab I should be getting regularly given my current medications?
4. Can any of my prescriptions be switched to a 90-day supply to reduce how often I need to refill?
5. Is there a generic available for each of these, and am I already on the most cost-effective version?
6. If I miss a dose of metformin -- one of the twice-daily doses specifically -- should I take it when I remember, or skip it and take the next scheduled dose? (Do not answer this -- note it as a provider question)

*For your specialist (if applicable):*
1. I want to make sure my primary care doctor has a copy of everything you have prescribed -- can you confirm the medications and doses in my chart so I can provide an accurate list?

*For your pharmacist:*
1. Can you review my full medication list and let me know if there are any interaction concerns or timing adjustments I should make?
2. I take levothyroxine first thing in the morning -- is there anything about the timing of my omeprazole or my other morning medications that conflicts with that?
3. Can you set up medication synchronization for my prescriptions so they all refill on the same date?

---

### SECTION 5: STORAGE AND SAFETY CHECKLIST

**Storage Setup:**
- [ ] Primary storage location selected: [e.g., Kitchen cabinet away from stove -- NOT bathroom]
- [ ] Atorvastatin and metformin in cool, dry cabinet at room temperature: confirmed
- [ ] Levothyroxine kept away from heat, moisture, and light: confirmed (original container)
- [ ] All 6 medications in original labeled containers with legible labels
- [ ] Child-resistant caps in use (if children or pets in the home)

**Monthly Safety Check (Do on the 1st of each month):**
- [ ] Check expiration dates on all 6 medications
- [ ] Count tablets on hand for all prescriptions and update refill tracker
- [ ] Confirm upcoming refill reminder dates are set on phone
- [ ] Update medication list if any doses, medications, or providers have changed

**Emergency Wallet Card (Copy and Carry):**
```
Name: _______________  DOB: _______________
Allergies: _______________
Medications:
  Levothyroxine [dose] -- thyroid
  Omeprazole [dose] -- stomach
  Metformin [dose] -- blood sugar
  Lisinopril [dose] -- blood pressure
  Atorvastatin [dose] -- cholesterol
  Vitamin D3 [dose] -- supplement
PCP: _______________ Ph: _______________
Pharmacy: _______________ Ph: _______________
Emergency contact: _______________ Ph: _______________
```

**Disposal:**
- [ ] Take expired or unused medications to take-back program at pharmacy or police station
- [ ] Do not flush unless pharmacist specifically instructs you to for a specific product

---

**Next Steps for You:**
1. Tonight: Count all medication tablets and fill in the refill tracker dates.
2. This week: Confirm which doctor prescribed which medication by calling each office or asking your pharmacist for a printed medication history.
3. Next pharmacy visit: Ask about medication synchronization and 90-day supply options for your stable long-term medications.
4. Before your next appointment: Print this document, bring it to your provider, and ask them to review the complete list.
5. Update this document any time a medication is added, changed, or discontinued.
