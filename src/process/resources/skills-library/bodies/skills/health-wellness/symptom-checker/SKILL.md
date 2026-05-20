---
name: symptom-checker
description: |
  Reference-only health symptom triage guide that helps users understand when to seek emergency care, urgent care, or routine medical attention. Includes common symptom decision trees, first aid awareness, and medication interaction considerations. This is NOT a diagnostic tool.
  Use when the user asks about symptom checker, or needs help with reference-only health symptom triage guide that helps users understand when to seek emergency care, urgent care, or routine medical attention.
  Do NOT use when the request requires professional medical advice or falls outside the scope of symptom checker.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "health-wellness guide checklist"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---

# Health Symptom Triage Guide

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

> **CRITICAL DISCLAIMER:** This skill is for **GENERAL INFORMATIONAL PURPOSES ONLY**. It is **NOT** a diagnostic tool, medical device, or substitute for professional medical advice, diagnosis, or treatment.
>
> **THIS TOOL CANNOT AND DOES NOT:**
> - Diagnose any medical condition
> - Recommend specific treatments or medications
> - Replace consultation with a licensed healthcare provider
> - Account for your complete medical history
>
> **ALWAYS:**
> - Consult a qualified healthcare provider for medical concerns
> - Call **911** (or your local emergency number) for life-threatening emergencies
> - When in doubt, seek medical attention - it is ALWAYS better to be safe
> - Follow the advice of YOUR doctor over any information provided here
>
> **If you are experiencing a medical emergency, STOP READING and call 911 immediately.**

## When to Use

**Use this skill when:**
- User asks about symptom checker
- User needs guidance on symptom checker topics
- User wants a structured approach to symptom checker

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

### Critical Safety Screening

```
IMMEDIATE SAFETY CHECK
========================

Is this an EMERGENCY? Call 911 immediately if ANY of these are present:

[ ] Difficulty breathing or shortness of breath
[ ] Chest pain or pressure
[ ] Sudden severe headache ("worst headache of my life")
[ ] Sudden numbness/weakness on one side of body (stroke signs)
[ ] Sudden confusion or difficulty speaking
[ ] Uncontrolled bleeding
[ ] Loss of consciousness
[ ] Severe allergic reaction (throat swelling, difficulty breathing)
[ ] Ingestion of poison or overdose
[ ] Suicidal thoughts or self-harm -> Call 988

If ANY box is checked: STOP. Call 911 or go to nearest emergency room.
```

### Symptom Information Gathering

```
SYMPTOM PROFILE (for informational purposes only)
===================================================

1. PRIMARY SYMPTOM:
   - What is the main concern? ___
   - When did it start? ___
   - Sudden onset or gradual? ___
   - Getting better, worse, or staying the same? ___

2. SYMPTOM CHARACTERISTICS:
   - Location (where in the body): ___
   - Quality (sharp, dull, burning, aching, etc.): ___
   - Severity (1-10 scale): ___
   - Duration (constant vs intermittent): ___
   - What makes it better: ___
   - What makes it worse: ___

3. ASSOCIATED SYMPTOMS:
   [ ] Fever (temperature if known: ___)
   [ ] Nausea/vomiting
   [ ] Diarrhea
   [ ] Headache
   [ ] Fatigue
   [ ] Dizziness
   [ ] Rash or skin changes
   [ ] Swelling
   [ ] Other: ___

4. RELEVANT HISTORY:
   - Age: ___
   - Known medical conditions: ___
   - Current medications: ___
   - Allergies: ___
   - Recent changes (travel, new meds, injuries): ___
   - Pregnant or possibly pregnant: [ ] Yes [ ] No [ ] N/A

5. WHAT HAVE YOU TRIED?
   - Self-treatment attempted: ___
   - Results of self-treatment: ___

REMINDER: This information is to help you organize your
symptoms for discussion with a healthcare provider.
```

## Care Level Decision Framework

### When to Call 911 / Go to Emergency Room

**Call 911 immediately for:**
- Chest pain or pressure lasting more than a few minutes
- Signs of stroke: Face drooping, Arm weakness, Speech difficulty, Time to call 911 (FAST)
- Severe difficulty breathing
- Heavy uncontrolled bleeding
- Severe burns (large area, face, hands, feet, genitals, joints)
- Suspected spinal injury
- Loss of consciousness
- Seizure in someone without known seizure disorder
- Severe allergic reaction (anaphylaxis)
- Poisoning or overdose
- Compound fracture (bone through skin)
- High fever in infant under 3 months (100.4F+ / 38C+)
- Sudden severe abdominal pain
- Coughing or vomiting blood

### When to Go to Urgent Care (same day)

**Seek same-day care for:**
- Fever over 103F (39.4C) in adults
- Moderate cuts that may need stitches (but bleeding is controlled)
- Possible broken bone (can still move, no bone visible)
- Sprains with significant swelling
- Persistent vomiting or diarrhea with dehydration signs
- Urinary symptoms (burning, frequency, urgency)
- Ear pain or discharge
- Pink eye with discharge
- Rash that is spreading or blistering
- Moderate allergic reactions (hives without breathing difficulty)
- Animal or insect bites
- Minor burns (small area, not on face/hands/genitals)

### When to Schedule a Doctor Appointment (within days)

**See your doctor soon for:**
- Cold or flu symptoms lasting more than 10 days
- Persistent low-grade fever
- Recurring headaches
- Unexplained weight changes
- Persistent fatigue
- Skin changes or moles that have changed
- Joint pain or stiffness lasting more than a few days
- Persistent digestive issues
- Mood changes lasting more than 2 weeks
- Sleep problems lasting more than a few weeks

### When Home Care May Be Appropriate

**May manage at home (with monitoring):**
- Common cold (runny nose, mild cough, sore throat)
- Mild headache responding to OTC pain relief
- Minor cuts and scrapes (clean, small, not deep)
- Mild muscle soreness from activity
- Mild seasonal allergies
- Minor sunburn
- Mild stomach upset

**Even with home care:** If symptoms worsen, persist beyond expected timeframe, or you are concerned, see a healthcare provider. Trust your instincts.

## Common Symptom Decision Trees

### Headache Decision Tree

```
HEADACHE ASSESSMENT (informational only)
==========================================

Is this the WORST headache of your life?
  YES -> CALL 911 (possible subarachnoid hemorrhage)

Accompanied by: fever + stiff neck + light sensitivity?
  YES -> GO TO ER (possible meningitis)

Sudden onset with vision changes, weakness, or confusion?
  YES -> CALL 911 (possible stroke)

After head injury?
  YES -> Seek immediate medical evaluation

Fever present?
  YES -> See a doctor same day

Persistent (daily for 2+ weeks)?
  YES -> Schedule doctor appointment

Mild-moderate, responds to OTC medicine, no other symptoms?
  -> Home care may be appropriate, but see doctor if recurring

ALWAYS consult a healthcare provider for persistent
or concerning headaches.
```

### Fever Decision Tree

```
FEVER ASSESSMENT (informational only)
=======================================

Patient is infant under 3 months with any fever (100.4F+)?
  YES -> GO TO ER immediately

Temperature over 105F (40.5C) in anyone?
  YES -> GO TO ER

Fever with stiff neck, severe headache, rash, confusion?
  YES -> GO TO ER

Fever with difficulty breathing?
  YES -> CALL 911

Fever over 103F (39.4C) in adult?
  YES -> Seek same-day medical care

Fever with painful urination?
  YES -> See a doctor same day (possible UTI/infection)

Fever lasting more than 3 days?
  YES -> See a doctor

Low-grade fever (under 102F) with cold symptoms, feeling okay?
  -> Rest, hydrate, monitor. See doctor if worsening.
```

### Abdominal Pain Decision Tree

```
ABDOMINAL PAIN ASSESSMENT (informational only)
================================================

Severe, sudden onset?
  YES -> GO TO ER

Right lower abdomen pain that started around navel
and moved? (possible appendicitis)
  YES -> GO TO ER

Pregnant with abdominal pain?
  YES -> Call your OB/doctor immediately

Pain with bloody stool or vomiting blood?
  YES -> GO TO ER

Pain with high fever (103F+)?
  YES -> Seek same-day care

Pain with inability to keep fluids down for 24+ hours?
  YES -> Seek same-day care

Persistent pain lasting more than a few days?
  YES -> Schedule doctor appointment

Mild discomfort related to known dietary indiscretion?
  -> Home care, monitor. See doctor if worsening.
```

### Chest Pain Decision Tree

```
CHEST PAIN ASSESSMENT (informational only)
============================================

*** Chest pain should ALWAYS be taken seriously ***

Any chest pain with: shortness of breath, sweating,
pain radiating to arm/jaw/back, nausea, lightheadedness?
  YES -> CALL 911 immediately (possible heart attack)

Sudden, sharp chest pain with difficulty breathing?
  YES -> CALL 911 (possible pulmonary embolism or pneumothorax)

Chest pain with exertion that stops with rest?
  -> Seek URGENT medical evaluation

History of heart disease + new chest pain?
  -> CALL 911

Sharp pain that changes with breathing or position?
  -> See a doctor same day

Chest wall tenderness (hurts to press on it)?
  -> May be musculoskeletal but still see doctor to rule out
     cardiac causes, especially if first occurrence

RULE: When in doubt about chest pain, CALL 911.
It is always better to be evaluated and reassured than
to miss a serious cardiac event.
```

## First Aid Basics (Reference Only)

> **Important:** This is reference information, not training. Get properly certified in first aid and CPR through the American Red Cross, American Heart Association, or equivalent organization in your country.

### DRSABCD Emergency Response

```
D - DANGER    Check for danger to yourself, bystanders, and the patient
R - RESPONSE  Is the person responsive? Tap shoulders, ask loudly
S - SEND      Call 911 (or have someone call)
A - AIRWAY    Open the airway (head tilt, chin lift)
B - BREATHING Check for normal breathing (look, listen, feel - 10 sec)
C - CPR       If not breathing normally, begin CPR
D - DEFIBRILLATION  Use AED if available
```

### Basic Wound Care Steps
1. Wash your hands or wear gloves
2. Apply direct pressure with clean cloth to stop bleeding
3. Clean the wound with clean running water
4. Apply antibiotic ointment (if no allergy)
5. Cover with sterile bandage
6. Seek medical care if: deep, gaping, won't stop bleeding, animal bite, dirty/rusty object, signs of infection

### Signs of Infection (see a doctor)
- Increasing redness spreading from wound
- Increased swelling
- Warmth around the wound
- Pus or discharge
- Red streaks leading from wound
- Fever
- Increasing pain after initial improvement

## Medication Interaction Awareness

### Common Interaction Categories

> **Always tell your doctor and pharmacist about ALL medications, supplements, and herbal products you take.** Never start, stop, or change medication dosage without consulting your healthcare provider.

| Common OTC Med | Watch Out For | Why |
|---------------|--------------|-----|
| Ibuprofen (Advil) | Blood thinners, aspirin, other NSAIDs | Increased bleeding risk |
| Acetaminophen (Tylenol) | Alcohol (3+ drinks), other acetaminophen-containing products | Liver damage risk |
| Aspirin | Blood thinners, ibuprofen | Bleeding risk, interaction effects |
| Antihistamines (Benadryl) | Sedatives, alcohol, anti-anxiety meds | Excessive drowsiness |
| Decongestants (Sudafed) | Blood pressure medications, MAOIs | Blood pressure increase |
| Antacids | Some antibiotics, thyroid medication | Absorption interference |

### Red Flags for Drug Interactions
Seek medical help if you experience after taking medication:
- Unusual bleeding or bruising
- Severe dizziness or fainting
- Rapid or irregular heartbeat
- Difficulty breathing
- Severe nausea or vomiting
- Rash, hives, or swelling
- Confusion or unusual behavior

## When to See a Doctor Checklist

```
SEE A DOCTOR IF YOU EXPERIENCE:
=================================
[ ] Symptom persists beyond expected timeframe
[ ] Symptom is getting worse despite home care
[ ] New or unexplained symptom appears
[ ] OTC medications are not providing relief
[ ] Fever lasting more than 3 days
[ ] Unexplained weight loss (10+ lbs without trying)
[ ] Blood in stool, urine, or vomit
[ ] Persistent cough lasting more than 3 weeks
[ ] Changes in moles or skin lesions
[ ] Lumps or swelling that don't go away
[ ] Persistent pain anywhere
[ ] Changes in bowel or bladder habits
[ ] Difficulty swallowing
[ ] Persistent fatigue
[ ] Night sweats (drenching, recurrent)
[ ] You feel that something is wrong

Your instinct matters. If you feel something is not right,
see a healthcare provider. It is always better to be checked
and reassured than to ignore a warning sign.
```

## Preparing for Your Doctor Visit

### Information to Bring

```
DOCTOR VISIT PREPARATION
==========================

1. SYMPTOM SUMMARY:
   - What: ___
   - When started: ___
   - How it has changed: ___
   - What helps/worsens: ___
   - Severity (1-10): ___

2. MEDICATION LIST (bring all bottles or a complete list):
   - Prescription medications: ___
   - OTC medications: ___
   - Supplements/vitamins: ___
   - Herbal products: ___

3. QUESTIONS TO ASK:
   - What could be causing this?
   - What tests do I need?
   - What are the treatment options?
   - What are the risks and benefits?
   - When should I follow up?
   - What warning signs should I watch for?
   - Are there lifestyle changes that could help?

4. MEDICAL HISTORY UPDATES:
   - Recent hospitalizations: ___
   - Family history changes: ___
   - New allergies: ___
   - Specialists seen: ___
```

## Emergency Numbers Quick Reference

```
EMERGENCY CONTACTS
====================
Emergency Services (US): 911
Poison Control (US): 1-800-222-1222
Suicide & Crisis Lifeline: 988
Crisis Text Line: Text HOME to 741741
Non-Emergency Medical Advice: Call your doctor's office
Nurse Hotline: Check your insurance card for number

MY PERSONAL EMERGENCY INFO:
  Primary Doctor: _______________ Phone: ___
  Pharmacy: _______________ Phone: ___
  Insurance: _______________ Member #: ___
  Emergency Contact: _______________ Phone: ___
  Allergies: _______________
  Blood Type: ___
  Current Medications: _______________
```

## Final Reminder

This guide is designed to help you think through when different levels of medical care may be appropriate. It is a **reference tool** to support - never replace - your judgment and professional medical advice.

**When in doubt, always err on the side of seeking medical care.**

Your health and safety are the top priority. No question is too small for a healthcare provider, and no concern is too minor to be checked.


## Output Format

```
SYMPTOM CHECKER OUTPUT
======================

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

**Input:** "Help me get started with symptom checker"

**Output:** A structured symptom checker plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
