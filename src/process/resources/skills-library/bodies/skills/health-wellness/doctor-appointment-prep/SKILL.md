---
name: doctor-appointment-prep
description: |
  Prepares users for healthcare appointments by building symptom description frameworks, question lists for their provider, medical history summaries, and medication lists. Produces a structured appointment preparation document that helps users have more productive conversations with their healthcare providers.
  Use when the user asks about preparing for a doctor visit, what questions to ask their doctor, how to describe symptoms effectively, or organizing medical information before an appointment.
  Do NOT use for interpreting symptoms, diagnosing conditions, recommending treatments, or providing medical opinions on the user's health situation.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mental-wellness strategy time-management"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Doctor Appointment Prep

> **Disclaimer:** This skill provides general wellness and organizational information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health. If you are experiencing a medical emergency, call emergency services immediately.

---

## When to Use

**Use this skill when:**
- The user has a scheduled appointment and wants to arrive organized, articulate, and prepared to use limited provider time efficiently
- The user asks what questions to bring to a primary care, specialist, urgent care, telehealth, or mental health appointment
- The user wants help describing symptoms in a way their provider can act on -- not vague statements like "I just don't feel right"
- The user is preparing for a high-stakes appointment such as a new diagnosis discussion, a second opinion, a pre-surgical consultation, or a medication review
- The user wants to compile or update their medical history summary before seeing a new provider for the first time
- The user is preparing for a chronic disease management visit (diabetes, hypertension, asthma, autoimmune conditions) and wants to present trends, not just current snapshots
- The user is helping a family member -- a child, elderly parent, or someone with cognitive or language barriers -- prepare for their appointment
- The user received test results they do not understand and wants to prepare questions before their follow-up call or visit
- The user has had a frustrating history of leaving appointments feeling unheard or without the information they needed

**Do NOT use when:**
- The user describes an acute emergency: chest pain radiating to the arm or jaw, sudden confusion, one-sided facial drooping, sudden vision loss, difficulty breathing, signs of severe allergic reaction, uncontrolled bleeding -- advise calling emergency services immediately and stop the skill
- The user is asking what their symptoms might mean or what condition they might have -- use a symptom-triage or general health information skill instead, and do not speculate even indirectly
- The user is asking whether they should see a doctor for a specific symptom -- this is triage; the answer is always "if you are concerned, contact your provider" and nothing more
- The user is asking for a second opinion on a diagnosis already given by their provider -- this is medical interpretation, not preparation
- The user asks which medication, treatment, or procedure they should choose -- this decision belongs to the provider; redirect to preparing questions about options instead
- The user wants lab results interpreted or explained clinically -- do not assign clinical meaning to numbers; instead, help them build questions to ask their provider about the results
- The user is in crisis related to a mental health emergency -- use a mental health crisis skill and refer to appropriate crisis resources

---

## Process

### Step 1: Clarify the Appointment Context

Before building any document, gather the critical parameters that shape every part of the output. Ask or infer:

- **Appointment type:** Annual physical, specialist consultation, follow-up for a known condition, new concern, pre-operative clearance, telehealth, mental health, pediatric, geriatric
- **Primary reason for the visit:** Routine maintenance, an active symptom, a lab result review, a referral follow-up, medication management, preventive screening discussion
- **Time available:** Standard primary care appointments are 15-20 minutes; specialist consultations range from 30-60 minutes; annual physicals may be 45-60 minutes; telehealth is often 10-15 minutes. The time budget shapes how many questions are realistic
- **Whether this is a new or established provider:** New providers require a complete history summary; established providers need a delta update -- what has changed since the last visit
- **Whether the user has support needs:** Anxiety about the appointment, language barrier, cognitive difficulty, a companion who will attend, or a preference for written vs. spoken summaries

Use these inputs to calibrate every section that follows. A 15-minute urgent care visit for a skin rash requires a radically different document than a 60-minute new patient intake with a rheumatologist.

---

### Step 2: Build the Symptom Description Using OPQRST-A

The gold-standard symptom description framework used in clinical training is OPQRST. Add an **A (Associated Symptoms)** element to create OPQRST-A, which captures the full picture a provider needs to work with.

For each element, help the user answer concretely rather than vaguely:

- **O -- Onset:** Exact date or approximate week the symptom began. Whether onset was sudden (seconds to minutes) or gradual (days to weeks). What the user was doing when it began. Whether anything changed around that time -- new medication, travel, dietary change, stress, injury, illness, new activity.
- **P -- Provocation and Palliation:** Specific triggers that worsen the symptom (movement, eating, lying flat, cold air, stress, exercise, specific foods, time of day). Specific factors that improve it (rest, heat, ice, over-the-counter medications -- name them and dose, positioning, food, distraction). Document what has already been tried.
- **Q -- Quality:** The character of the sensation using precise descriptors. Pain descriptors include: sharp, stabbing, dull, aching, burning, throbbing, pulsating, pressure, squeezing, cramping, tingling, numbness, electric, tearing. Non-pain symptoms need equally precise language: nausea vs. queasiness, fatigue vs. weakness vs. drowsiness, palpitations vs. skipped beats vs. racing.
- **R -- Region and Radiation:** Exact anatomical location -- not "my stomach" but upper right abdomen, lower left back, behind the sternum. Whether the symptom moves, spreads, or radiates and in what direction. Whether it is localized (fingertip-sized) or diffuse (entire side of the body).
- **S -- Severity:** A 0-10 numeric rating where 0 is absent, 5 is uncomfortable but functional, 8-10 is severe and disabling. Record the typical severity, the worst it has been, and the best it has been. Note whether severity is stable, improving, or worsening over time. This trend is often more informative than the absolute number.
- **T -- Timing:** Constant vs. intermittent. If intermittent: frequency (hourly, daily, weekly), duration of each episode (seconds, minutes, hours), and total duration of the problem (days, weeks, months). Pattern relative to activities, meals, sleep, menstrual cycle, or time of day.
- **A -- Associated Symptoms:** Other symptoms that appear alongside the primary complaint, even if the user thinks they are unrelated. Providers use these constellations to narrow differential diagnoses. Common associated symptom clusters: fever + night sweats + weight loss; headache + visual changes + nausea; chest pain + shortness of breath + leg swelling. Prompt the user to think broadly.

If the visit is routine with no active symptoms, skip the full OPQRST-A and note the absence of active complaints directly in the document.

---

### Step 3: Construct a Tiered Question List

Providers have limited time. An unprioritized list of 15 questions will leave the most important ones unanswered. Build the question list in three tiers:

**Tier 1 -- Must-Ask Questions (1-3 maximum)**
These are the questions the appointment absolutely cannot end without answering. They should be identified and written first. Examples:
- "I've had this symptom for 3 weeks -- what do you think is going on?"
- "My father was recently diagnosed with colon cancer -- does that change what screenings I need?"
- "I've been on this medication for 6 months and I'm still not feeling better -- what are our options?"

**Tier 2 -- High-Value Questions (3-5)**
These are important but could be addressed in a follow-up message through the patient portal, a nurse call, or a follow-up appointment if time runs out. Examples:
- "What should I watch for that would mean I need to come in sooner?"
- "Are there lifestyle changes that could help alongside any treatment?"
- "What does this test actually measure, and what will the result tell us?"

**Tier 3 -- Nice-to-Know Questions (0-3)**
Low urgency, can be sent via portal message or saved for the next routine visit. Examples:
- "Are there any new guidelines for my age group I should know about?"
- "I read about a supplement -- is it safe with my current medications?"

Tailor question categories to appointment type:

**For annual physicals:**
- Which screenings am I due for based on my age, sex, and family history? (Key thresholds: colorectal cancer screening at 45, mammography at 40-50 depending on guidelines, Pap smear every 3-5 years for adults 21-65, DEXA scan at 65 for women, AAA screening at 65-75 for male smokers)
- Are my labs from this visit within normal range, and are any trends concerning?
- Are my immunizations up to date? (Key adult vaccines: annual influenza, Tdap every 10 years, shingles vaccine at 50+, pneumococcal vaccine at 65+, RSV vaccine for eligible adults)
- Are all my current prescriptions still the right choice?

**For specialist consultations:**
- What is the scope of your role vs. my primary care provider's role in managing this?
- What information do you need from my primary care provider to give me the best evaluation?
- What is the natural history of this condition if we do not intervene?
- Are there subspecialty centers with higher volume experience in this condition that I should consider?

**For chronic condition management:**
- Are my target numbers being met? (HbA1c target <7.0% for most diabetics; blood pressure target <130/80 for most hypertensive adults; LDL-C targets vary by risk stratification)
- Is there anything in my pattern of readings that concerns you?
- Are there any new evidence-based treatments for my condition I am not using?
- Are any of my medications due for reassessment in terms of dose or drug choice?

**For mental health appointments:**
- How will we measure progress -- what does improvement look like?
- What is the plan if the current approach is not working in 4-6 weeks?
- Are the side effects I am experiencing expected to resolve, or do they indicate a medication change?
- Are there non-medication approaches we should combine with my current treatment?

**For medication reviews:**
- What is this medication treating, and how do we know it is working?
- Is there a generic equivalent available?
- At what point should we consider stopping it?
- What are the signs I should report immediately?

---

### Step 4: Build the Medical Information Summary

A provider who has complete, accurate information at the start of the visit spends zero time on administrative clarification and all of their time on the clinical problem. Help the user build:

**Medication List (complete)**
Every medication requires four data points: name, dose (in mg or mcg or units), frequency, and prescribing provider. This applies to:
- All prescription medications
- Over-the-counter medications taken regularly (aspirin, antihistamines, proton pump inhibitors, NSAIDs)
- Vitamins and supplements (dose matters: a standard B12 supplement vs. a therapeutic megadose are clinically different)
- Herbal preparations (St. John's Wort, valerian, echinacea -- these interact with medications)
- Hormonal contraceptives (method, dose, duration)
- Insulin and injectables (type, units, timing)

**Allergy and Adverse Reaction List**
Distinguish true allergies (immune-mediated reactions: hives, throat swelling, anaphylaxis) from intolerances (nausea, GI upset, headache) and intolerances from medication side effects. This distinction affects clinical decision-making significantly. For each entry document: the allergen, the specific reaction, and the year it occurred if known.

**Relevant Medical History**
- Chronic conditions with diagnosis dates (Type 2 diabetes diagnosed 2018, hypertension diagnosed 2020)
- Prior surgeries and procedures with approximate years (appendectomy 2005, knee arthroscopy 2019)
- Hospitalizations with reasons (pneumonia 2022, fracture repair 2015)
- Reproductive history if relevant (pregnancies, deliveries, miscarriages, current contraception method)

**Family History (first-degree relatives only unless specified)**
Flag: heart disease before age 55 in a male relative or 65 in a female relative, cancer (type and age of onset), diabetes, stroke, mental health conditions, sudden unexplained death. These are the items with the highest impact on the user's own screening and prevention plan.

**Recent Changes Since Last Visit**
This is the delta update that saves provider time. What has changed? New symptoms, resolved symptoms, new life stressors, significant life events (bereavement, divorce, job loss, new housing), significant weight change (more than 10 lbs in either direction), changes in diet, exercise, alcohol use, tobacco use, or sleep.

**Outside Records to Bring**
Imaging reports and CDs or digital files, specialist notes, lab results from other facilities, records from urgent care visits or ER visits since the last appointment.

---

### Step 5: Assess Appointment Time and Triage the Agenda

Map the user's concerns to the available time:

- A 15-minute appointment can realistically address 1 primary concern and 1 brief secondary question
- A 30-minute follow-up can address 2-3 focused concerns
- A 60-minute new patient intake can handle a complete history review plus 2-3 concerns
- Telehealth visits trend 20-25% shorter in effective communication time due to technical and interface friction

If the user has more concerns than time allows:

1. Identify the single highest-priority concern and protect it as Tier 1
2. Suggest sending lower-priority items as a pre-visit message through the patient portal before the appointment -- many practices route these to the provider before they enter the room
3. Advise the user to state their agenda at the start of the visit: "I have three things I want to cover -- headaches for 3 weeks, a question about my blood pressure medication, and a refill request. Can we prioritize the headaches?" This technique, called agenda-setting, is documented to improve appointment efficiency and patient satisfaction
4. Note which items are appropriate for a portal message or nurse phone call vs. requiring in-person assessment

---

### Step 6: Build the Symptom Timeline if the Problem is Ongoing

For symptoms lasting more than 2-4 weeks or conditions with episodic flares, a visual timeline communicates more efficiently than a verbal narrative:

- List dates on the left column
- List what was happening (symptom intensity, triggers, what was tried, what changed)
- Note any provider contacts, ER visits, or changes in medication during the same period
- Note parallel life events that might be contextually relevant (started new job, had surgery, began new exercise program)

A provider can scan a one-page timeline in 30 seconds and understand a 3-month story. The same story told verbally in the appointment may take 8-10 minutes and introduce distortion.

---

### Step 7: Add Appointment Logistics and Communication Strategies

Logistics that derail otherwise well-prepared visits:

**Before the appointment:**
- Arrive 10-15 minutes early for intake paperwork and vitals; for new patient appointments, arrive 20-30 minutes early and complete new patient forms online in advance if the portal allows
- Confirm whether fasting is required (fasting labs require 8-12 hours without food or caloric beverages)
- Bring insurance card, photo ID, and any required referral authorizations
- Bring all medication bottles or a current printed medication list; pharmacies can print a reconciled medication list at no cost in most cases
- If imaging or records from other facilities are needed, request them 5-7 business days in advance -- not the day before

**During the appointment:**
- Ask the provider to write down diagnoses, test names, and medication names -- provider handwriting on a prescription pad is still the most reliable way to capture exact names
- Ask at the end: "Can you summarize what we decided today?" -- this confirms mutual understanding before leaving the room
- Ask about next steps explicitly: "What happens next, and how will I find out about the results?" -- ambiguity about who is responsible for follow-up is the most common source of care gaps
- Ask whether the nurse or medical assistant can answer follow-up questions, or whether portal messages go directly to the provider
- Bring a trusted companion who can listen and remember -- two people hearing the same information retain significantly more than one
- If note-taking is difficult, ask whether the provider objects to recording the conversation on a phone -- many do not

**After the appointment:**
- Log into the patient portal within 24-48 hours to check that any ordered labs, imaging, or referrals appear in the system
- If results are expected within a defined window (blood panel in 24 hours, imaging in 2-3 days) and do not appear, call the office -- do not assume no news is good news
- Complete any actions assigned to the patient (schedule specialist, begin medication, return for labs in 3 months) within 48 hours of the visit while the momentum is active

---

### Step 8: Compile and Format the Appointment Preparation Document

Assemble all components into the structured output format below. Adjust sections based on appointment type -- omit OPQRST-A if the visit is routine with no active symptoms; omit symptom timeline if the concern is new and acute. Always include the logistics checklist.

---

## Output Format

```
## Appointment Preparation Document

> This document is an organizational tool to help you communicate more
> effectively with your healthcare provider. It is not a medical assessment.

---

**Provider Name / Specialty:** [Name, or "TBD / New Provider" if unknown]
**Appointment Type:** [Annual physical | Specialist consult | Follow-up | New concern | Other]
**Date and Time:** [Date / Time]
**Estimated Appointment Length:** [15 min | 30 min | 45 min | 60 min]
**Primary Reason for Visit:** [One sentence -- the most important thing to address today]

---

### Section 1: Symptom Description (OPQRST-A)
*(Complete only for visits involving an active symptom or new concern)*

| Element                  | Your Description                                                      |
|--------------------------|-----------------------------------------------------------------------|
| Onset                    | [When it started; sudden or gradual; what changed around that time]  |
| Provocation/Palliation   | [What makes it worse; what makes it better; what you have tried]     |
| Quality                  | [Character of the sensation: sharp, dull, aching, burning, etc.]     |
| Region/Radiation         | [Exact location; does it move or spread; size of the area]           |
| Severity                 | [0-10 typical / 0-10 worst / 0-10 best; stable, worsening, improving]|
| Timing                   | [Constant vs. intermittent; frequency; duration of each episode]     |
| Associated Symptoms      | [Other symptoms appearing alongside the main one]                    |

---

### Section 2: Symptom Timeline
*(Use for symptoms lasting more than 2-4 weeks or episodic conditions)*

| Date / Time Period       | What Happened                                                         |
|--------------------------|-----------------------------------------------------------------------|
| [Approximate start date] | [How the symptom began]                                               |
| [Week 1-2]               | [Changes, triggers identified, anything tried]                        |
| [Week 3+]                | [Current status; any worsening, improving, or new features]           |
| [Any ER/urgent care visit]| [What was done, what was found, what was recommended]               |
| [Any medication started/stopped]| [Name, dose, effect]                                         |

---

### Section 3: Questions for Your Provider

**TIER 1 -- Must Ask Today (ask these first):**
1. [Question 1 -- highest priority]
2. [Question 2 -- second priority]
3. [Question 3 -- third priority, if time allows]

**TIER 2 -- Important (ask if time remains, or send via portal):**
4. [Question 4]
5. [Question 5]
6. [Question 6]

**TIER 3 -- Nice to Know (portal message or next visit):**
7. [Question 7]
8. [Question 8]

*(State your agenda at the start of the visit: "I have [X] things to cover --
the most important is [Tier 1 item]. Can we make sure we get to that?")*

---

### Section 4: Current Medications

| Medication Name   | Dose      | Frequency          | Prescribing Provider     | Taking as Prescribed? |
|-------------------|-----------|--------------------|--------------------------|----------------------|
| [Name]            | [mg/mcg]  | [once daily, etc.] | [Dr. Name / Specialty]   | [Yes / No -- explain]|
| [OTC medication]  | [dose]    | [as needed / daily]| Self-managed             | [Yes / No]           |
| [Supplement]      | [dose]    | [frequency]        | Self-managed             | [Yes / No]           |

*(Include all prescriptions, OTC medications, vitamins, supplements, and herbal preparations)*

---

### Section 5: Allergies and Adverse Reactions

| Allergen          | Reaction Type                  | Specific Reaction         | Year (approx.) |
|-------------------|-------------------------------|---------------------------|----------------|
| [Drug/food/other] | [Allergy / Intolerance / Side effect] | [Description of reaction] | [Year]   |

---

### Section 6: Relevant Medical History

**Chronic Conditions:**
- [Condition -- Year Diagnosed]
- [Condition -- Year Diagnosed]

**Prior Surgeries and Procedures:**
- [Procedure -- Approximate Year]
- [Procedure -- Approximate Year]

**Hospitalizations:**
- [Reason -- Approximate Year]

**Family History (first-degree relatives):**
- [Relative]: [Condition, age at diagnosis if known]
- [Relative]: [Condition, age at diagnosis if known]

---

### Section 7: Changes Since Last Visit

- [New symptom, resolved symptom, or health change]
- [Significant life event: stress, loss, major change in routine]
- [Weight change if notable: direction and approximate amount]
- [Changes in sleep, diet, alcohol, tobacco, or exercise habits]

---

### Section 8: Records and Documents to Bring

- [ ] Insurance card and photo ID
- [ ] This preparation document (printed or accessible on phone)
- [ ] All medication bottles or printed pharmacy medication list
- [ ] Allergy list (above)
- [ ] Any lab results from outside facilities
- [ ] Imaging reports and/or CDs or digital files
- [ ] Specialist notes from other providers
- [ ] Referral authorization (if required by your insurance plan)
- [ ] Completed new patient paperwork (if first visit)

---

### Section 9: Appointment Day Strategy

**Logistics:**
- [ ] Arrive [10-15 minutes / 20-30 minutes for new patient] before scheduled time
- [ ] Confirm fasting status: [fasting required / not required / unknown -- verify with office]
- [ ] Bring a companion or designate someone to receive a follow-up phone briefing

**During the Visit:**
- [ ] State your agenda at the start: "I have [X] topics -- the most important is [Topic 1]"
- [ ] Ask the provider to write down diagnosis names, test names, and medication names
- [ ] Ask at the end: "Can you summarize what we decided today?"
- [ ] Ask: "What happens next, and who do I contact about results?"
- [ ] Take notes or ask permission to record

**After the Visit:**
- [ ] Check the patient portal within 24-48 hours for ordered tests and results
- [ ] Complete any patient action items within 48 hours
- [ ] If expected results do not appear within [timeframe the provider states], call the office
```

---

## Rules

1. **Never interpret symptoms or assign clinical significance to them.** The OPQRST-A framework is a structured communication tool only. Do not say things like "that pattern of symptoms is commonly associated with..." or "that severity suggests..." -- even framed as general knowledge, symptom interpretation belongs to the provider.

2. **Never advise whether the user should or should not seek care for a specific symptom.** If the user asks "Do you think I need to see a doctor about this?" the answer is always "If you are concerned about a symptom, contact your healthcare provider" -- nothing more, nothing less.

3. **Always triage the question list by explicit priority tiers.** A flat list of 10 questions will be addressed in the order the user remembers them, not in order of importance. Tier structure directly improves appointment outcomes.

4. **Medication lists must include dose, frequency, and prescribing provider.** A medication name without dose is clinically incomplete -- 10 mg vs. 100 mg of the same drug may represent entirely different clinical situations. If the user does not know doses, instruct them to bring the bottles or print a pharmacy list.

5. **Distinguish allergies from intolerances in the allergy section.** Conflating GI upset from a medication with a true allergic reaction can cause a provider to unnecessarily eliminate a treatment option. If the user is unsure of the distinction, instruct them to describe the reaction and let the provider classify it.

6. **Calibrate the document length to appointment time.** Do not produce a 4-page document for a 15-minute telehealth visit. For short appointments, the output should be a single page: top 2 questions, medication list, and checklist. For 60-minute new patient intakes, a comprehensive multi-section document is appropriate.

7. **Always include the agenda-setting instruction.** Research in patient communication shows that providers who hear the full patient agenda in the first 2 minutes of an appointment interrupt less and address more concerns. The instruction to state the agenda at the start of the visit must always appear in the output.

8. **For any chronic condition, flag measurable targets.** When helping a patient with diabetes, hypertension, hyperlipidemia, or asthma prepare for a management visit, include the evidence-based numeric targets (HbA1c, blood pressure, LDL-C, peak flow) so the user can ask whether their current numbers meet those targets. Do not assess whether their numbers are good -- only give them the framework to ask the question.

9. **Never recommend specific healthcare providers, facilities, or products.** Do not name specific hospital systems, urgent care chains, telemedicine platforms, pharmacy chains, or insurance plans.

10. **If the user describes a symptom pattern that sounds acute or potentially urgent -- even if they have an appointment scheduled -- include a clear, specific statement:** "If your symptoms worsen significantly before your appointment, or if you develop [symptom-specific red flags that the user themselves should know to ask their provider about], contact your provider's after-hours line or go to urgent care rather than waiting for your scheduled appointment." Do not diagnose urgency -- but do not ignore it either. Err toward including this note for any new symptom of less than 4 weeks duration.

11. **Respect the user's stated level of health literacy.** If the user uses technical language naturally, match it. If the user uses lay terms, use lay terms throughout the document. The preparation document should be usable by the patient in the room, not just comprehensible to the AI generating it.

12. **Always close the output with the post-appointment follow-up checklist.** The most common point of care failure is what happens after the appointment -- result follow-up, referral scheduling, and medication starts are frequently dropped without a structured reminder.

---

## Edge Cases

### The User Has Multiple Concerns but a Short Appointment (15-20 minutes)

This is the most common real-world scenario and requires explicit handling. Do not produce a document that covers all concerns equally -- this sets the user up to run out of time with their most important issue unaddressed.

- Identify the single concern that most directly affects the user's health or quality of life and designate it as the sole Tier 1 question
- For the remaining concerns, determine which can be sent as a patient portal message before the visit, which can be addressed with a nurse phone call, and which require a separate appointment
- Include this explicit sentence in the strategy section: "Tell your provider at the start of the visit that you have [X] concerns but want to make sure [Concern 1] is fully addressed today. This gives them the opportunity to either extend the visit, schedule a follow-up, or address the others briefly."
- Note that many practices allow a pre-visit message through the portal -- sending the full concern list 24 hours in advance allows the provider to allocate time and potentially add a note to the chart before entering the room

---

### The User Does Not Know Their Medications

This is extremely common among older adults, patients managing multiple chronic conditions, and people who did not initially organize their own healthcare.

- Instruct them to bring every medication bottle to the appointment, including OTC medications and supplements -- a brown bag medication review is a standard clinical practice and providers are accustomed to it
- Instruct them to call their pharmacy 2-3 days before the appointment and ask for a printed medication reconciliation list -- this is a free service at most pharmacies and produces a complete, dose-accurate record
- If they have a patient portal through their primary care provider, the medication list section often contains a current reconciled list -- instruct them to print or screenshot it
- Note on the document: "Medication list incomplete -- bring bottles or pharmacy printout" so the provider knows in advance

---

### The User Is Preparing for a Child's Appointment (Pediatric Visit)

OPQRST-A applies, but the framework must be adapted for a child who may not articulate symptoms reliably. Additional elements to include:

- Growth and development: Is the child hitting milestones for their age? Any changes in growth trajectory?
- Behavioral and school changes: New behavioral patterns, regression, changes in school performance or attendance, changes in peer relationships
- Immunization record: Bring the official immunization card -- pediatric providers track vaccine schedules against the CDC Advisory Committee on Immunization Practices (ACIP) schedule and will want to verify what is current vs. due
- Symptom reporting: For children under 5, symptoms are often reported by the parent -- note how the child communicates or indicates pain (pointing, behavior changes, refusing food)
- For adolescents: The provider may want to speak with the adolescent privately for a portion of the visit -- this is standard practice and promotes honest disclosure; prepare the parent and the adolescent for this

---

### The User Is Seeing a New Provider for the First Time

New patient appointments have different informational requirements than follow-ups. Add these elements:

- Complete medical history summary (not just the delta): All chronic conditions with diagnosis years, all prior surgeries, all hospitalizations
- A list of all current providers -- name, specialty, and what they manage -- so the new provider understands the existing care team
- Request records transfer from previous providers at least 5-7 business days before the appointment; many practices have a secure fax or records portal, but the patient must initiate the request
- Complete the new patient forms online before arriving if the practice offers it -- this recovers 10-20 minutes of appointment time for clinical discussion
- The first visit is a relationship-assessment as well as a clinical visit; it is appropriate to ask: "What is the best way to reach you for follow-up questions?" and "How are referrals and specialist coordination managed through your practice?"

---

### The User Has a Mental Health Appointment

The OPQRST-A framework applies but requires translation into mental health language:

- **Onset:** When did this mood state, pattern of thinking, or behavioral change begin? Was there a precipitating event?
- **Provocation/Palliation:** What situations trigger worsening? What provides relief (coping strategies, social connection, activity, avoidance)?
- **Quality:** How would you describe the experience -- numbness, sadness, hyperawareness, racing thoughts, disconnection, terror?
- **Severity:** Functional impairment is often more meaningful than a 0-10 scale -- has this affected work, relationships, sleep, self-care, or daily functioning?
- **Timing:** Is this a first episode or a recurrence? What did previous episodes look like and how long did they last?
- **Associated:** Sleep changes (insomnia, hypersomnia), appetite changes, concentration difficulties, energy level, thoughts of self-harm

Add mental health-specific questions:
- "How do we define treatment success for my situation?"
- "What validated tools are you using to track my progress?" (PHQ-9 for depression, GAD-7 for anxiety, AUDIT for alcohol use are standard screeners)
- "If I need to contact someone between sessions, what is the protocol?"
- "Are there adjunctive approaches you recommend alongside medication or therapy?"

Never assess suicidal ideation or crisis status -- if the user mentions thoughts of self-harm in the context of appointment preparation, immediately pivot to crisis resources.

---

### The User Is Preparing for a Post-Hospitalization Follow-Up

Hospital discharges frequently result in incomplete communication to the outpatient provider and patient confusion about next steps. This is a high-risk appointment type.

- Bring the full discharge summary if one was provided -- this is the single most important document for this visit
- Identify every medication listed on the discharge medication list and clarify: Is this new? Is this a change in dose? Is this temporary?
- List every instruction given at discharge and note which have been followed, which are unclear, and which have caused problems
- Key questions for post-hospitalization follow-up: "Are there any results from my hospital stay that are still pending?" "Which of my new medications are permanent and which are temporary?" "Are there any restrictions on activity, diet, or driving?" "What symptoms should prompt me to call or go to the ER?"

---

### The User Has Anxiety About the Appointment Itself

Medical appointment anxiety (sometimes called white coat anxiety) can interfere with the user's ability to communicate clearly and remember what the provider says. Address it directly:

- Validate the experience without pathologizing it -- many people find medical settings anxiety-inducing and this is common
- The preparation document itself is a validated anxiety-reduction tool: knowing you have organized information and written questions reduces the cognitive and emotional load of the visit
- Suggest the user read the document aloud to themselves the evening before the visit to rehearse the key points
- Encourage the user to bring a trusted companion who can take notes and ask questions if the user becomes overwhelmed
- Suggest arriving early enough to feel settled before entering the exam room, not rushed
- If the user has a history of significant medical anxiety or avoidance that has delayed care, note that this is something worth discussing with their provider -- it is a legitimate health concern and many providers can accommodate anxious patients with adjusted communication styles

---

## Example

**Input:** "I'm seeing my cardiologist next Thursday for the first time. My primary care doctor referred me because I've been having episodes where my heart feels like it's racing or fluttering, and a couple of times I thought I might pass out. This has been happening for about 6 weeks. I'm also on a blood pressure medication and a statin but I can't remember the names or doses. I'm pretty nervous about this appointment."

---

**Output:**

## Appointment Preparation Document

> This document is an organizational tool to help you communicate more effectively with your healthcare provider. It is not a medical assessment.

---

**Provider Name / Specialty:** Cardiologist (new provider -- name TBD)
**Appointment Type:** Specialist consultation -- new patient
**Date:** Thursday
**Estimated Appointment Length:** 45-60 minutes (standard for new cardiology consult)
**Primary Reason for Visit:** Episodes of rapid or irregular heartbeat with near-fainting, referred from primary care provider -- approximately 6 weeks duration

---

> **Important note before your appointment:** Because your symptoms include near-fainting episodes alongside the racing/fluttering sensation, please take note of this: if you experience a fainting episode, loss of consciousness, chest pain, difficulty breathing, or a significant increase in symptom frequency or severity before Thursday, contact your primary care provider's after-hours line or go to urgent care rather than waiting for your scheduled appointment. This is not a reason to panic -- it is simply a precaution given the nature of the symptoms.

---

### Section 1: Symptom Description (OPQRST-A)

Before your appointment, fill in as much of this as you can. Your answers will help your cardiologist get a complete picture quickly.

| Element                  | Your Description -- Fill This In                                                       |
|--------------------------|----------------------------------------------------------------------------------------|
| Onset                    | Approximately 6 weeks ago. Was the first episode sudden or did you notice it gradually? Was anything different around that time -- new stress, illness, new medication, significant change in caffeine, alcohol, sleep, or activity? |
| Provocation/Palliation   | Does anything seem to trigger the episodes? (Exertion, caffeine, stress, lying down, changing position, after eating?) Does anything make them stop sooner -- lying down, drinking water, holding your breath, bearing down? Have they been getting more frequent? |
| Quality                  | During an episode, how would you describe the sensation? (Rapid and steady? Irregular or skipping? Fluttering? Pounding? Is it in your chest, throat, or both? Does it feel like your heart stops briefly before racing?) |
| Region/Radiation         | Is the sensation only in your chest, or do you also feel it in your neck or throat? |
| Severity                 | On a 0-10 scale, how disabling are the episodes while they are happening? Do you have to stop activity? Have you actually fainted or only felt like you might faint? If you felt like you might faint, did you have any warning beforehand (dizziness, vision narrowing, sudden nausea)? |
| Timing                   | How many episodes in the past 6 weeks total? How long does each episode typically last -- seconds, minutes, longer? Is there any pattern (time of day, before meals, after exercise, at rest, at night)? |
| Associated Symptoms      | During or just before/after episodes: shortness of breath, chest pain or pressure, dizziness, lightheadedness, vision changes, sudden weakness, sweating, sense of doom? Any episodes of actual loss of consciousness? |

---

### Section 2: Symptom Timeline

| Time Period              | What Happened                                                                    |
|--------------------------|----------------------------------------------------------------------------------|
| Approximately 6 weeks ago| First episode noticed. Describe what you were doing and what it felt like.       |
| Weeks 2-4                | How frequently were episodes occurring? Any change in character?                 |
| Weeks 5-6 (recent)       | Are episodes more frequent, less frequent, or about the same as at the start?   |
| Near-fainting episodes   | When did these occur? How many times? During an episode or separately?           |
| Primary care visit       | When did you see your PCP? What did they say or do? Was an EKG done? Any other tests? Were you given any instructions? |

---

### Section 3: Questions for Your Cardiologist

**TIER 1 -- Ask These First:**
1. Based on how I've described these episodes, what are you considering as the most likely explanation for what I'm experiencing?
2. What tests do you want to do today or order going forward, and what will each test tell us? (Note: your cardiologist may order an EKG, Holter monitor, echocardiogram, event recorder, or loop recorder depending on episode frequency -- ask what each one is looking for)
3. Given that I've had near-fainting with these episodes -- is there anything I should avoid doing or restrict until we have more information?

**TIER 2 -- Ask If Time Allows:**
4. How does my blood pressure medication interact with what you're evaluating -- do you want to review or adjust anything while I'm here?
5. If a specific cause is identified, what are the treatment options and how do I choose between them?
6. What symptoms should trigger me to go to the emergency room rather than waiting for a follow-up?
7. How long will it take to get results, and who contacts whom -- do I wait, or do I call?

**TIER 3 -- Portal Message or Follow-Up Visit:**
8. Are there lifestyle changes (caffeine, alcohol, sleep, exercise) that would be worth trying regardless of the findings?
9. Does my statin need to be reviewed as part of this workup?

*(At the start of your appointment, say: "I have three main things I want to make sure we cover -- what might be causing these episodes, what tests you want to order, and whether I need to restrict anything in the meantime. Can we make sure we get to all three?")*

---

### Section 4: Current Medications

| Medication Name          | Dose       | Frequency | Prescribing Provider      | Taking as Prescribed? |
|--------------------------|------------|-----------|---------------------------|-----------------------|
| Blood pressure medication -- name unknown | Unknown | Unknown | Primary care provider | Unknown |
| Statin -- name unknown   | Unknown    | Unknown   | Primary care provider     | Unknown               |
| [Any OTC medications: aspirin, ibuprofen, antacids, decongestants, supplements] | | | Self-managed | |

> **Action required before Thursday:** Call your pharmacy and ask them to print your current medication reconciliation list -- this takes under 5 minutes and gives you the exact drug names, doses, and frequencies for every medication. Alternatively, bring all of your medication bottles to the appointment. Your cardiologist will need this information to evaluate drug interactions and to make any prescribing decisions.

---

### Section 5: Allergies and Adverse Reactions

| Allergen                 | Reaction Type                 | Specific Reaction         | Year (approx.) |
|--------------------------|-------------------------------|---------------------------|----------------|
| [List all drug and food allergies] | [Allergy / Intolerance] | [Describe exactly what happens] | [Year] |

---

### Section 6: Relevant Medical History

**Chronic Conditions:**
- Hypertension -- [Year diagnosed]
- Hypercholesterolemia (high cholesterol) -- [Year diagnosed]
- [Any other known conditions]

**Prior Surgeries and Procedures:**
- [Any cardiac or thoracic procedures: pacemaker, ablation, angiogram, cardiac surgery -- if none, state "none"]
- [All other surgeries with approximate years]

**Hospitalizations:**
- [Any hospital admissions, especially for cardiac or cardiovascular reasons]

**Family History (first-degree relatives):**
- [Father / Mother / Sibling]: [Heart disease, arrhythmia, sudden cardiac death, stroke, heart failure -- note the age at which it occurred]
- Flag particularly: any family member who had unexplained fainting, palpitations, or sudden death -- this is important information for your cardiologist

---

### Section 7: Changes Since Last Visit (Since Primary Care Referral)

- Have the episodes changed in frequency, duration, or character since you saw your primary care provider?
- Has near-fainting occurred again?
- Any new symptoms developed?
- Any changes in stress, sleep, or activity level?
- Have you started or stopped any medications, supplements, or herbal preparations?

---

### Section 8: Records and Documents to Bring

- [ ] Insurance card and photo ID
- [ ] Referral authorization from primary care provider (confirm with your insurance whether this is required)
- [ ] Copy of the referral note or any records your PCP sent -- call their office by Tuesday to confirm they were transmitted
- [ ] EKG printout if one was done at your PCP's office
- [ ] Any prior cardiac records (if you have ever had any cardiac testing in the past)
- [ ] Printed pharmacy medication list or all medication bottles
- [ ] This preparation document
- [ ] Completed new patient intake forms (complete online before arriving if available)
- [ ] Notebook or phone for notes

---

### Section 9: Appointment Day Strategy

**Logistics:**
- [ ] Arrive 20-30 minutes early -- new cardiology patient intake paperwork is typically extensive
- [ ] Complete any online new patient forms at least 24 hours before your appointment
- [ ] Confirm fasting: call the cardiology office before Thursday to ask whether any ordered bloodwork will require fasting -- if yes, adjust your morning eating accordingly
- [ ] Consider bringing a trusted companion -- they can take notes and help you remember what the cardiologist says

**During the Visit:**
- [ ] State your agenda at the start: "I have three things I most want to cover -- what might be causing my episodes, what tests you're recommending, and whether I need to restrict any activities until we know more."
- [ ] When the cardiologist names any test, diagnosis, or medication -- ask them to write it down
- [ ] At the end, ask: "Can you summarize what we found today and what happens next?"
- [ ] Ask: "If my symptoms change significantly before my next appointment, who do I call and when do I go to the ER instead?"
- [ ] Ask about recording the visit if you tend to forget details when anxious -- this is common and most providers will agree

**Managing Appointment Anxiety:**
It is completely understandable to feel anxious going into a cardiology consultation for the first time. Having this document means you do not need to hold all of this information in your head -- you can glance at your notes. The preparation itself is doing a lot of the work. If you feel overwhelmed in the room, it is completely appropriate to say: "I want to make sure I understand -- can you say that again?" or "Can you write that down for me?"

**After the Visit:**
- [ ] Log into the patient portal within 48 hours to confirm any ordered tests appear in the system
- [ ] If a Holter monitor or event recorder is ordered, clarify exactly when and how you will receive the device and what to do when you have an episode
- [ ] Complete any scheduled tests (echo, bloodwork, monitor pickup) within the timeframe the cardiologist specifies -- do not let these drop
- [ ] If you do not hear about results within the timeframe stated, call the office -- do not assume no news is good news for cardiac testing
- [ ] If you were given any instructions about activity restrictions, medications, or warning signs, write them down before leaving the building
