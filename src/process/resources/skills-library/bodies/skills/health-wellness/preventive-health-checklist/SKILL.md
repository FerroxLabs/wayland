---
name: preventive-health-checklist
description: |
  Produces annual health maintenance checklists organized by life stage covering screenings, immunizations, dental care, vision care, and self-care habits. Creates a comprehensive yet actionable checklist that helps users stay on top of routine preventive health tasks throughout the year.
  Use when the user asks about annual health tasks, preventive health maintenance checklists, what health appointments to schedule each year, or building a yearly health routine.
  Do NOT use for interpreting health results, recommending specific screenings for individual conditions, or providing medical advice about health maintenance priorities.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "checklist fitness habits"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Preventive Health Checklist

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, screenings, or care schedule. If you are experiencing a medical emergency, contact emergency services immediately.

---

## When to Use

**Use this skill when:**
- A user wants to build an annual preventive health maintenance checklist organized by life stage (teen, 20s, 30s, 40s, 50s, 60s+)
- A user asks "what health appointments should I schedule this year?" without a specific medical condition driving the question
- A user wants to distribute health tasks across the calendar year in quarterly blocks to avoid annual overload
- A user wants to audit which preventive health tasks they have already completed and which remain outstanding
- A user is starting fresh after a period of health neglect and needs a structured re-entry point
- A user is preparing for a major life transition (new job with new insurance, moving to a new city, turning a decade milestone age) and wants to get organized
- A user is setting up a household health system covering themselves and dependents and needs a framework to track all members
- A user wants to understand the full landscape of preventive health categories beyond just "annual physical" -- including dental, vision, immunizations, mental health, home health, and self-monitoring

**Do NOT use when:**
- A user is asking about interpreting a specific lab result, abnormal screening finding, or test value -- refer to `understanding-lab-results` or direct them to their provider
- A user has a named chronic condition (diabetes, hypertension, heart disease, cancer history) and wants a monitoring schedule for that condition -- the baseline checklist applies but condition-specific monitoring is provider-directed and outside this skill's scope
- A user wants a detailed breakdown of which specific screening tests apply to their exact age and risk profile -- use `health-screening-schedule` which covers clinical screening recommendations in depth
- A user is asking about managing medications, timing doses, or reconciling their medication list -- use `medication-management-system`
- A user describes an acute symptom or new concerning finding (chest pain, a new lump, sudden vision change) -- this is NOT a checklist situation; direct them to seek care immediately
- A user is asking about occupational health requirements or pre-employment physical requirements -- those have different drivers and are employer/regulatory specific
- A user wants nutritional guidance beyond general self-care habits -- nutritional planning is a separate specialized domain
- A user wants a fitness program or exercise plan -- use the relevant fitness planning skill rather than embedding a detailed exercise protocol here

---

## Process

### Step 1: Gather Essential User Context

Before generating the checklist, collect the minimum necessary context. Ask in a single, efficient prompt rather than multiple back-and-forth questions.

- **Age or age range** -- the single most important variable. Preventive health recommendations shift significantly at ages 21, 25, 30, 40, 45, 50, 55, 65, and 75. Use decade-of-life groupings (20s, 30s, 40s, 50s, 60s, 70s+) if the user gives a specific age.
- **Biological sex** -- affects which screenings belong on the baseline checklist. Cervical cancer screening (Pap smear/HPV co-test) applies to people with a cervix; prostate-related conversations apply to people with a prostate. Ask sensitively and explain why it matters for the checklist.
- **Whether they have a primary care provider (PCP)** -- if no, the first action item is establishing one, and this should be item #1 on the checklist with specific guidance on how to find one.
- **Insurance status** -- not to make recommendations, but because it affects realistic access. Users with insurance can and should use the annual wellness visit benefit. Users without insurance should be directed toward community health centers and sliding-scale clinics.
- **Areas of concern or known gaps** -- ask if they know they are behind on anything specific (e.g., "I haven't been to the dentist in 3 years") to flag priority items prominently.
- **Whether they want the checklist for themselves only or for a household** -- this determines scope.

If the user is in a hurry and provides minimal context, default to generating the checklist for their stated age and note that biological-sex-specific items should be confirmed with their provider.

### Step 2: Establish Life Stage and Anchor the Checklist

Map the user's age to the appropriate life stage group. Each group has a distinct preventive health profile:

**Ages 18-29 (Young Adult):**
- Primary care relationship is often absent in this group -- establishing one is a top priority
- Immunization catch-up is common (meningococcal, HPV series completion, varicella confirmation)
- Mental health screening matters: this age group has high rates of depression, anxiety, and substance use issues that go unaddressed
- For people with a cervix: Pap smear begins at age 21 (every 3 years if normal; HPV co-testing added at 25-30 depending on jurisdiction)
- STI screening awareness: discuss with provider based on individual risk
- Dental hygiene habits established in this decade affect the next 50 years -- emphasize it
- Vision: many refractive errors are first corrected in this decade

**Ages 30-39 (Early Adult):**
- Cardiovascular risk begins to accumulate silently -- baseline lipid panel and blood pressure tracking become meaningful
- Mental health: peak years for stress-related health impact (career, family formation, financial pressure)
- Women: preconception health planning if relevant; discuss folate, carrier screening options with provider
- Skin: establish a dermatology relationship if family history of melanoma or significant sun exposure history
- Dental: periodontal disease risk increases -- ensure periodontal depth charting is part of cleanings

**Ages 40-49 (Middle Adult):**
- Major screening initiations occur in this decade
- Colorectal cancer screening: conversations begin at 45 (colonoscopy every 10 years OR annual stool-based testing -- discuss options with provider)
- Diabetes screening: fasting glucose or HbA1c if overweight or with risk factors
- Blood pressure monitoring becomes more critical -- home blood pressure monitoring devices become a useful tool
- For people with a cervix: Pap smear/HPV co-test every 5 years at this stage
- Mammography: conversations about frequency begin; discuss with provider based on individual risk factors
- Vision: presbyopia commonly begins in mid-40s -- annual eye exams are increasingly important
- Hearing: baseline hearing assessment is reasonable in this decade, particularly for people with noise exposure history
- Bone density: conversation with provider about when baseline DEXA scan is appropriate (especially women approaching menopause)

**Ages 50-64 (Midlife):**
- Colorectal cancer screening is in full effect -- ensure it is current
- Shingles (zoster) vaccination: recommended at age 50 (two-dose Shingrix series)
- Pneumococcal vaccination: discuss timing with provider
- Lung cancer screening: low-dose CT (LDCT) for those aged 50-80 with a 20+ pack-year smoking history who currently smoke or quit within the past 15 years
- Bone density (DEXA) scan: standard for postmenopausal women; discuss for men with risk factors
- Cholesterol management: lipid panel every 5 years minimum; more frequently if values are trending
- Glucose/HbA1c: annual screening appropriate for those with risk factors
- Sleep: sleep apnea screening becomes more relevant; Epworth Sleepiness Scale is a useful self-assessment tool

**Ages 65+ (Older Adult):**
- Medicare Annual Wellness Visit is a distinct benefit -- it includes a health risk assessment, cognitive screening, and advance care planning discussion; this is different from a standard physical
- Fall risk assessment: should be explicitly included; balance, gait, vision, and medication review all feed into fall risk
- Cognitive screening: brief structured cognitive tools (like the Mini-Cog) are standard at wellness visits
- Advance care planning: healthcare proxy, power of attorney, and living will -- essential items for this age group
- Pneumococcal vaccination schedule: Prevnar 20 or the two-vaccine series depending on prior vaccination history
- Annual flu vaccine remains critical (higher-dose formulations recommended for 65+)
- Medication reconciliation: polypharmacy is a major issue -- annual review of all medications, including OTC and supplements, for interactions
- Hearing and vision: both deteriorate with age and substantially affect quality of life and safety; annual assessment is appropriate

### Step 3: Build Category-by-Category Checklist Items

For each category, populate with the specific items relevant to the user's life stage. Use the following as the canonical category structure:

**Category 1: Medical Appointments**
- Annual physical or wellness exam with PCP
- Age-appropriate lab work: at minimum, complete metabolic panel (CMP), complete blood count (CBC), fasting lipid panel, fasting glucose, thyroid-stimulating hormone (TSH) if indicated; discuss specifics with provider
- Blood pressure measurement: at least annually; home monitoring (devices with upper-arm cuffs validated by recognized standards bodies) recommended if readings have been elevated previously
- BMI and weight tracking: note this is a limited metric but used as a screening trigger
- Colorectal cancer screening if 45+
- Skin check with dermatologist: annually for people with family history of melanoma, significant mole burden, or significant UV exposure history; every 2-3 years otherwise
- STI screening: per risk assessment with provider
- Specialist follow-ups: any outstanding referrals or conditions requiring monitoring

**Category 2: Dental Health**
- Professional cleaning and comprehensive exam: every 6 months for most adults
- Dental X-rays: bitewing X-rays annually to biennially; full mouth series every 3-5 years
- Periodontal probing: should be performed at every exam visit; readings above 3mm in multiple sites warrant periodontal specialist evaluation
- Oral cancer screening: should occur at every dental exam (visual and tactile inspection of mucosa, tongue, floor of mouth, palate, oropharynx)
- Fluoride treatment: recommended for adults with high caries risk
- Night guard assessment: if clenching/bruxism is noted, a custom occlusal guard is an important protective measure
- Address identified caries, periodontal disease, or other issues within 3 months of identification

**Category 3: Vision Care**
- Comprehensive dilated eye exam: annually if over 40, using corrective lenses, or with diabetes/glaucoma risk; every 2 years for low-risk adults under 40
- Key conditions screened for: refractive error, glaucoma (intraocular pressure + optic nerve assessment), age-related macular degeneration (AMD, especially 50+), cataracts (50+), diabetic retinopathy (if diabetic)
- Prescription update for glasses or contact lenses if needed
- Screen time and digital eye strain habits: 20-20-20 rule (every 20 minutes, look 20 feet away for 20 seconds) -- note this as an ongoing habit item

**Category 4: Immunizations**
- Influenza (flu): annually, ideally September-November; high-dose or adjuvanted formulation for adults 65+
- COVID-19: per current public health guidance at time of checklist creation
- Tdap (tetanus, diphtheria, pertussis): one-time Tdap dose if not previously received; Td booster every 10 years
- Shingles (Zoster): Shingrix two-dose series for adults 50+; given 2-6 months apart
- Pneumococcal: Prevnar 20 (one dose) for adults 65+, or Prevnar 15 followed by Pneumovax 23; discuss with provider for adults 19-64 with certain risk factors
- MMR (measles, mumps, rubella): confirm immunity, especially if born after 1957 and vaccination records are uncertain
- Varicella: two doses if no prior infection or vaccination
- HPV: recommended through age 26 for all adults; shared clinical decision-making for ages 27-45
- Hepatitis B: three-dose series if not previously vaccinated; recommended for all adults 18-59; discuss for 60+
- Hepatitis A: two-dose series; recommended for travel to endemic regions, liver disease, or occupational risk

**Category 5: Mental Health**
- Annual mental health check-in with PCP or therapist: use the PHQ-2 as a self-screening tool (two questions: over the past 2 weeks, have you felt little interest or pleasure in doing things? Have you felt down, depressed, or hopeless?); a "yes" to either warrants a fuller PHQ-9 and professional conversation
- Anxiety screening: GAD-7 (Generalized Anxiety Disorder 7-item scale) is a validated self-screening tool; scores of 10+ suggest moderate anxiety warranting professional evaluation
- Sleep quality: PSQI (Pittsburgh Sleep Quality Index) is a structured self-assessment; or simply tracking sleep hours and wake episodes monthly
- Stress burden assessment: identify major stressors and evaluate whether coping resources (social support, professional support, lifestyle practices) are adequate
- If applicable: substance use self-check using the AUDIT-C (Alcohol Use Disorders Identification Test-Consumption) or similar; a brief 3-question tool
- Annual review of whether a standing relationship with a therapist or counselor is desired or needed

**Category 6: Self-Monitoring Habits**
- Skin self-exam: monthly; use the ABCDE framework (Asymmetry, Border irregularity, Color variation, Diameter >6mm, Evolution/change); check all body surfaces including scalp and between toes
- Blood pressure self-monitoring: if prior readings have been 120-129 (elevated) or higher, track at home weekly using a validated upper-arm cuff device; log results to share at appointments
- Testicular self-exam: monthly for people with testes, especially ages 15-40 (peak risk period for testicular cancer)
- Breast self-awareness: monthly; note changes in texture, shape, skin appearance, or nipple discharge; report changes promptly
- Dental self-care: brushing twice daily with fluoride toothpaste, flossing daily (or water flosser), tongue brushing
- Sun protection: SPF 30+ broad-spectrum sunscreen on exposed skin year-round; reapply every 2 hours outdoors; UV-blocking sunglasses
- Sleep tracking: consistent bedtime and wake time within 30 minutes; 7-9 hours for adults 18-64, 7-8 hours for adults 65+
- Physical activity: 150 minutes/week moderate intensity (brisk walk, cycling, swimming at conversational pace) OR 75 minutes/week vigorous intensity; plus 2 sessions/week muscle-strengthening activity targeting major muscle groups
- Hydration: approximately 2.7 liters/day (women) or 3.7 liters/day (men) total water from all sources -- not a rigid rule but a useful reference point

**Category 7: Home Health Maintenance**
- First aid kit: inspect and restock every 6 months (January and July); standard contents include adhesive bandages (multiple sizes), sterile gauze, medical tape, antiseptic wipes, antibiotic ointment, digital thermometer, pain reliever/antipyretic, antihistamine, tweezers, scissors, emergency blanket, gloves
- Medication cabinet audit: quarterly; check expiration dates, dispose of expired medications safely (many pharmacies offer drug take-back programs), note any medications that need refilling
- Sunscreen: replace expired products annually (sunscreen loses efficacy after 3 years; check expiration date)
- Smoke and carbon monoxide detectors: test monthly; replace batteries annually; replace units every 10 years (smoke) and 5-7 years (CO)
- Personal health record: update annually (current medications with doses, allergies and reactions, medical conditions, prior surgeries with dates, family medical history highlights)
- Emergency medical information: wallet card or phone health app with blood type, allergies, emergency contacts, and current medications; update whenever medications change
- Healthcare proxy / advance directive: create if not in place; review annually to confirm it still reflects your wishes

### Step 4: Assign Quarterly Distribution

Distribute checklist items across four quarters to prevent task overload and ensure nothing clusters so densely that it creates a financial or time burden in a single month.

**Quarter 1 (January-March):**
- Schedule and complete annual physical (or book it now for a date within Q1-Q2)
- Complete lab work ordered at physical
- Update personal health record and emergency contacts
- Medication cabinet expiration audit
- Confirm immunization status and schedule any gaps
- First aid kit restock
- Review prior year's checklist and note any outstanding items from last year

**Quarter 2 (April-June):**
- First dental cleaning and exam of the year
- Eye exam (if due this year)
- Review lab results with provider; schedule any follow-up appointments
- Skin check with dermatologist (if due or if any new skin changes noted)
- Mental health check-in (mid-spring is a natural assessment point after winter)
- STI screening (if applicable per risk profile)

**Quarter 3 (July-September):**
- Mid-year self-care habits review (physical activity, sleep, nutrition -- are habits on track?)
- Any follow-up appointments identified from Q1-Q2 medical work
- Second medication cabinet audit
- First aid kit restock (July)
- Hearing assessment (if in appropriate age range or noted concern)

**Quarter 4 (October-December):**
- Annual flu vaccine (ideally by end of October)
- Second dental cleaning and exam of the year
- Review insurance benefits for any unused preventive care (many benefits expire December 31)
- Schedule any remaining screenings covered under current insurance year
- Advance care planning review (healthcare proxy, living will)
- Smoke/CO detector battery replacement (pair with end of daylight saving time in November as a reminder)
- Begin planning Q1 of the following year (book physical appointment early -- popular slots fill quickly)

### Step 5: Flag Priority Items for Users Who Are Catching Up

When a user indicates they have been neglecting their health, use a triage framework:

**Tier 1 -- Highest Priority (Do These First):**
1. Establish a primary care provider if none exists
2. Schedule annual physical and baseline labs
3. Confirm immunization status (especially flu, Tdap, and COVID-19)
4. Dental exam if >1 year since last visit (undetected periodontal disease and caries progress silently)

**Tier 2 -- Schedule Within 3-6 Months:**
5. Eye exam if >2 years since last visit
6. Age-appropriate cancer screenings (colorectal if 45+; cervical if >3-5 years since last Pap; discuss others with provider)
7. Mental health check-in if any emerging symptoms

**Tier 3 -- Build Into Ongoing Routine:**
8. Home health maintenance items
9. Self-monitoring habit establishment
10. All remaining recurring items

### Step 6: Provide the Tracking Infrastructure

The checklist is only useful if the user can actually track progress. Offer two options:

**Option 1 -- Quarterly Paper/Digital Checklist:**
Generate the full formatted checklist (see Output Format) with checkboxes, due dates, and completion date fields. This works well for users who prefer a document they can print or save.

**Option 2 -- Calendar Integration Approach:**
Walk the user through placing calendar reminders for key annual items:
- January 1: "Schedule annual physical this month; update health records; restock first aid kit"
- April 1: "Schedule dental cleaning #1"
- October 1: "Get flu vaccine; schedule dental cleaning #2; review insurance benefits"
- Quarterly on the first of January, April, July, October: "Medication cabinet expiration check"
- First of every month: "Skin self-exam"

### Step 7: Deliver the Output with Necessary Caveats

- Present the checklist with the disclaimer prominently
- Explicitly note which items are universal versus which are "discuss with your provider to confirm applicability"
- Remind the user that the annual physical is the gateway to personalizing this checklist -- many items will be modified based on their provider's assessment of their individual risk factors, family history, and current health status
- Invite the user to return to the checklist each quarter to update completion dates and identify what remains

---

## Output Format

The output should be a complete, formatted checklist with the following structure. Populate all fields based on the user's age group and context gathered.

```
## Annual Preventive Health Checklist
**Life Stage:** [Age Group, e.g., Ages 40-49]
**Generated For:** [Calendar Year]
**Biological Sex Considered:** [Yes -- female-specific items included / Yes -- male-specific items included / Not specified -- discuss sex-specific items with provider]

---

### TIER 1: DO FIRST (If Catching Up)
- [ ] Establish primary care provider (if none) -- Action: Contact insurance for in-network list or search community health centers
- [ ] Schedule annual physical -- Target: [Month/Quarter]
- [ ] Confirm immunization status -- Target: At physical

---

### MEDICAL APPOINTMENTS

| Item | Frequency | Due By | Completed | Notes |
|------|-----------|--------|-----------|-------|
| Annual physical / wellness exam | Annually | [Month] | ___ | Bring medication list, health history |
| Complete metabolic panel (CMP) | Per provider | With physical | ___ | Fasting labs typically ordered |
| Fasting lipid panel (total, LDL, HDL, triglycerides) | Per provider | With physical | ___ | Fast 9-12 hours beforehand |
| Fasting glucose or HbA1c | Per provider | With physical | ___ | HbA1c does not require fasting |
| CBC (complete blood count) | Per provider | With physical | ___ | |
| TSH (thyroid) | If indicated | Per provider | ___ | |
| Blood pressure check | Annually minimum | At physical + any visits | ___ | Home monitoring if previously elevated |
| [Colorectal cancer screening -- if 45+] | See options | Discuss with provider | ___ | Colonoscopy q10yr or annual stool test |
| [Cervical screening -- if applicable] | Every 3-5 years | Per last test date | ___ | Pap alone q3yr (21-65) or co-test q5yr (25-65) |
| [Mammogram discussion -- if applicable] | Per provider | Discuss at physical | ___ | |
| [Bone density (DEXA) -- if applicable] | Per provider | Discuss at physical | ___ | |
| [Lung cancer screening LDCT -- if 50-80, 20 pack-year history] | Annually | Discuss with provider | ___ | |
| Skin check with dermatologist | Annually or every 2-3yr | [Month] | ___ | Based on risk profile |
| Specialist follow-ups (if applicable) | Per specialist | Per schedule | ___ | |

---

### DENTAL HEALTH

| Item | Frequency | Due By | Completed | Notes |
|------|-----------|--------|-----------|-------|
| Dental cleaning and comprehensive exam #1 | Every 6 months | [Month] | ___ | Request periodontal probing |
| Dental cleaning and comprehensive exam #2 | Every 6 months | [Month, 6 months after #1] | ___ | |
| Dental X-rays (bitewing) | Annually to biennially | Per dentist | ___ | |
| Oral cancer screening | At every cleaning | Included at exam | ___ | Should be automatic; confirm it is done |
| Address any identified issues (caries, perio disease) | Within 3 months | As scheduled | ___ | |

**Daily Self-Care:**
- [ ] Brush 2x/day with fluoride toothpaste (2 minutes each session)
- [ ] Floss or use water flosser: daily
- [ ] Tongue brushing: daily
- [ ] Replace toothbrush or brush head: every 3 months

---

### VISION CARE

| Item | Frequency | Due By | Completed | Notes |
|------|-----------|--------|-----------|-------|
| Comprehensive dilated eye exam | Annually (40+, corrective lenses, diabetes); every 2yr otherwise | [Month] | ___ | |
| Prescription update | As needed | At exam | ___ | |
| Glaucoma screening | Included in dilated exam | At exam | ___ | Especially important 40+ |
| AMD assessment | Included in dilated exam (50+) | At exam | ___ | |
| Digital eye strain habit: 20-20-20 rule | Ongoing | Daily | ___ | |

---

### IMMUNIZATIONS

| Vaccine | Schedule | Last Received | Next Due | Status |
|---------|----------|---------------|----------|--------|
| Influenza (flu) | Annually (Sept-Nov) | ___ | This Oct/Nov | |
| COVID-19 | Per current guidelines | ___ | Per guidelines | |
| Tdap / Td | Td every 10yr; one-time Tdap | ___ | If 10+ years | |
| Shingrix (Zoster) [50+] | 2-dose series, 2-6 months apart | ___ | If not completed | |
| Pneumococcal [65+ or high-risk] | Per schedule | ___ | Discuss with provider | |
| Hepatitis B | 3-dose if unvaccinated | ___ | If not completed | |
| HPV | Through age 26; discuss 27-45 | ___ | If applicable | |
| MMR | Confirm immunity | ___ | If uncertain | |

---

### MENTAL HEALTH

| Item | Frequency | Due By | Completed | Notes |
|------|-----------|--------|-----------|-------|
| PHQ-2 depression self-screen | Quarterly | Every 3 months | ___ | Score ≥3 -- use PHQ-9 and discuss with provider |
| GAD-7 anxiety self-screen | Quarterly | Every 3 months | ___ | Score ≥10 -- discuss with provider |
| Sleep quality review (hours, wake episodes) | Monthly | Monthly | ___ | 7-9 hours/night target |
| AUDIT-C substance use self-check | Annually | At annual review | ___ | Score ≥3 (women) or ≥4 (men) -- discuss with provider |
| Mental health professional appointment (if desired/needed) | Per need | Ongoing | ___ | |
| Stress inventory: identify top 3 stressors, evaluate coping | Quarterly | Every 3 months | ___ | |

---

### SELF-MONITORING HABITS

| Habit | Target | Tracking Method | Monthly Check-In |
|-------|--------|-----------------|------------------|
| Physical activity | 150 min/week moderate OR 75 min/week vigorous + 2x strength training | App, journal, or wearable | ___ |
| Sleep | 7-9 hours/night; consistent schedule ±30 min | Sleep log or app | ___ |
| Hydration | ~2.7L (women) / ~3.7L (men) total daily water from all sources | Habit tracking | ___ |
| Skin self-exam (ABCDE) | Monthly | Calendar reminder, 1st of month | ___ |
| Blood pressure home monitoring | Weekly (if elevated history) or at medical visits | Log readings with date | ___ |
| Breast self-awareness [if applicable] | Monthly | Calendar reminder | ___ |
| Testicular self-exam [if applicable] | Monthly | Calendar reminder | ___ |
| Sun protection (SPF 30+ broad spectrum) | Daily on exposed skin | Ongoing habit | ___ |
| Fluoride toothpaste use | Daily, 2x/day | Ongoing habit | ___ |

---

### HOME HEALTH MAINTENANCE

| Item | Frequency | Due Dates | Completed | Notes |
|------|-----------|-----------|-----------|-------|
| First aid kit inspection and restock | Every 6 months | January + July | ___ | Check bandages, antiseptic, thermometer, OTC medications |
| Medication cabinet expiration audit | Quarterly | Jan/Apr/Jul/Oct | ___ | Safe disposal at pharmacy take-back |
| Personal health record update | Annually | January | ___ | Medications, doses, allergies, conditions, surgeries, family history |
| Emergency wallet card / phone health app update | When meds change; annually confirm | January + any med change | ___ | Include blood type, allergies, emergency contacts |
| Healthcare proxy / advance directive review | Annually | January | ___ | Create if not in place; confirm it reflects current wishes |
| Smoke detector test | Monthly | 1st of each month | ___ | |
| Smoke detector battery replacement | Annually | November (with DST change) | ___ | |
| CO detector battery replacement | Annually | November | ___ | Replace unit every 5-7 years |
| Sunscreen expiration check | Annually | Spring (April) | ___ | Replace if expired (>3 years old) |

---

### QUARTERLY TASK DISTRIBUTION

| Quarter | Key Tasks | Target Completion | Done |
|---------|-----------|-------------------|------|
| Q1 (Jan-Mar) | Annual physical + labs; update health record; medication audit; confirm immunization status; first aid kit restock | March 31 | ___ |
| Q2 (Apr-Jun) | Dental cleaning #1; eye exam (if due); dermatology visit (if due); lab result review and follow-up; mental health check-in | June 30 | ___ |
| Q3 (Jul-Sep) | Mid-year habits review; follow-up appointments from Q1-Q2; medication audit; first aid restock; hearing assessment (if applicable) | September 30 | ___ |
| Q4 (Oct-Dec) | Flu vaccine; dental cleaning #2; insurance benefits audit; advance care planning review; smoke/CO detector batteries; plan Q1 next year | December 31 | ___ |

---

### NOTES AND PERSONALIZATIONS
[Space for provider recommendations, specific monitoring items, or personal context]
```

---

## Rules

1. **Always include the disclaimer at the top.** The disclaimer must appear before any health information is provided, not buried at the end. This is non-negotiable.

2. **Never specify that the user NEEDS a particular screening.** The checklist frames items as "discuss with your provider" or "if due based on your history." Only a provider can determine whether a specific screening is indicated for an individual. The checklist provides the category and the general population guidance -- it does not issue clinical directives.

3. **Never omit dental and vision.** These are the most systematically neglected categories in health maintenance, and their omission is the most common failure of "annual health" resources. Periodontal disease has documented associations with cardiovascular and metabolic outcomes. Undetected glaucoma causes irreversible vision loss. Both categories belong on every checklist.

4. **Never omit mental health as a distinct category.** Depression and anxiety are among the most prevalent and underdiagnosed conditions in adults. Embedding mental health as a sub-bullet under "general health" minimizes its importance. It must stand as its own section with specific self-screening tools named (PHQ-2, GAD-7).

5. **Age-specific items must be explicitly labeled.** When generating a checklist for a 38-year-old, do not include colorectal screening as an active checklist item -- note it as "initiates at 45" and put it in a "Coming Up" or "Preview" section. Including inapplicable items creates noise and erodes trust in the checklist.

6. **Always include the quarterly distribution.** A flat list of 40+ annual tasks creates overwhelm and inaction. The quarterly distribution is a functional behavior-change tool that transforms the checklist from a wall of text into a manageable calendar. Quarterly cadence is the minimum granularity -- monthly breakdowns can be offered for users who want more structure.

7. **Biological-sex-specific items must be noted but handled with sensitivity.** State clearly why the question about biological sex is relevant (certain screening recommendations apply to specific anatomical structures). If the user does not wish to specify, include all potentially relevant items with a note to discuss applicability with their provider.

8. **Always include home health maintenance.** Smoke detectors, first aid kits, medication cabinet audits, and emergency information are invisible until they fail. These items protect health in ways that medical appointments cannot. They must be present on every checklist.

9. **Immunizations are non-negotiable checklist items.** Many adults believe immunizations are "for children." The adult immunization schedule is substantial -- annual flu, COVID-19, Tdap booster, Shingrix at 50, pneumococcal at 65, and catch-up series for those with incomplete childhood vaccination. Immunizations must have their own section with specific vaccine names listed.

10. **The checklist must be actionable, not aspirational.** Every item must have a verb (Schedule, Complete, Check, Update, Restock, Review, Get). Items like "be healthier" or "improve wellness" have no place on this checklist. If an item cannot be assigned a specific action, a specific frequency, and a completion date field, it is not a checklist item -- it is a goal, and goals belong in a separate planning framework.

11. **When the user has no primary care provider, this is item #1.** All other preventive health infrastructure depends on a PCP relationship. Do not bury this. Make it the first item on the checklist with explicit language about how to find one (contact insurance company for in-network list; search community health center directories; federally qualified health centers operate on sliding scale fees for uninsured patients).

12. **Never recommend specific brands of products, specific devices by name, or specific insurance products.** Generic categories are appropriate: "validated upper-arm cuff blood pressure device," "broad-spectrum SPF 30+ sunscreen," "digital thermometer." Specific brand names are not.

---

## Edge Cases

**User Has No Primary Care Provider:**
This is extremely common, particularly among adults in their 20s and 30s and among those who have recently moved. The first and most important checklist item is establishing a PCP. Offer specific action steps: (1) Contact insurance company to request a list of in-network primary care physicians accepting new patients; (2) If uninsured, search for federally qualified health centers (FQHCs) which operate on sliding-scale fees based on income; (3) Urgent care clinics are acceptable for acute illness but are NOT a substitute for preventive primary care -- they do not maintain longitudinal records, coordinate specialist referrals, or manage preventive screening schedules. Note that once a PCP is established, many of the remaining checklist items will be ordered, coordinated, or discussed at the first appointment.

**User Has Chronic Conditions (Diabetes, Hypertension, Heart Disease, Autoimmune Disease, Cancer History):**
The baseline preventive health checklist still applies in full -- people with chronic conditions still need dental cleanings, eye exams, flu vaccines, and skin checks. However, their provider will add a layer of condition-specific monitoring on top of the baseline (e.g., A1C every 3 months for poorly controlled diabetes vs. annually for well-controlled; echocardiogram and stress testing for cardiac patients; regular inflammatory markers for autoimmune conditions). Frame this clearly: "This checklist is your baseline -- your provider's monitoring plan for your specific condition adds to it, it does not replace it." Do not attempt to enumerate condition-specific monitoring -- this falls outside the scope of this skill and into clinical management territory.

**User Is Overwhelmed and Wants to Know the Absolute Minimum:**
Provide a "Minimum Viable Annual Health Maintenance" tier explicitly. The five non-negotiables: (1) Annual physical with PCP; (2) At least one dental cleaning and exam; (3) Annual flu vaccine; (4) Age-appropriate cancer screenings if due (colorectal at 45+, cervical if applicable); (5) Any immunization boosters that are overdue. Everything else on the checklist is valuable but can be phased in over 12-24 months. Start the user on the highest-impact items and add layers as they build the habit. Do not sacrifice the minimum to the comprehensive.

**User Asks About Children or Dependents:**
Pediatric preventive health has a fundamentally different schedule driven by developmental milestones and vaccine series timing. Well-child visits occur at: 1 week, 1 month, 2 months, 4 months, 6 months, 9 months, 12 months, 15 months, 18 months, 24 months, 30 months, 3 years, and annually from ages 4-21. The vaccine schedule is complex and should be directed entirely to the child's pediatrician. General adult checklist principles still apply for teen dependents (dental, vision, mental health). Note that adolescent-specific items include: HPV vaccine series (typically begins at 11-12); meningococcal vaccine (age 11-12 with booster at 16); depression screening (recommended annually in adolescents by major pediatric organizations). Refer the user to the pediatric well-child skill or their child's pediatrician for a complete framework.

**User Is Approaching or Has Recently Reached Medicare Eligibility (65+):**
The Medicare "Welcome to Medicare" visit and annual Medicare Wellness Visit are distinct benefits with different structures than standard preventive care visits. The Welcome to Medicare preventive visit (within the first 12 months of Part B enrollment) includes a comprehensive review of health history, physical exam, cognitive screening, and creation of a personalized prevention plan. The Annual Wellness Visit (AWV) updates this each year. These visits are free under Medicare (no copay) and specifically designed for preventive planning. Key additions to the checklist at this life stage: fall risk assessment (including medication review for falls-risk drugs, balance testing), cognitive screening, advance care planning discussion, pneumococcal and shingles vaccination if not previously received, and high-dose or adjuvanted flu vaccine. Encourage early scheduling of the Welcome to Medicare visit and bringing a complete health history and current medication list.

**User Has Significant UV Exposure History or Family History of Melanoma:**
Escalate the dermatology recommendation to annual visits with a dermatologist rather than every 2-3 years. Teach the ABCDE framework explicitly in the skin self-exam section. Note that full-body skin exams should include the scalp (use a hand mirror or have a partner assist), between the toes, under the nails, and the soles of the feet -- areas frequently missed in self-exams. Any ABCDE-positive finding warrants prompt dermatology evaluation, not a "watch and wait" approach.

**User Is Pregnant or Planning Pregnancy:**
Prenatal care has its own schedule entirely distinct from the standard annual preventive checklist. Direct the user to their OB-GYN or midwife for the prenatal visit schedule. The standard checklist items that remain highly relevant: dental care (pregnancy affects gum tissue and is associated with increased periodontal disease risk; dental cleanings are safe and recommended during pregnancy); flu vaccine (especially important during pregnancy due to increased severity risk); mental health screening (perinatal depression and anxiety are common and underdiagnosed). The Tdap vaccine is specifically recommended during each pregnancy (ideally 27-36 weeks gestation) to protect the newborn before they can be vaccinated. Remind users that COVID-19 vaccination is recommended during pregnancy per current guidance and should be discussed with their provider.

**User Asks About Insurance and Cost:**
Note that under the Affordable Care Act, most insurance plans are required to cover preventive services with an "A" or "B" recommendation from the USPSTF (U.S. Preventive Services Task Force) at no cost-sharing when delivered by an in-network provider. This includes annual wellness visits, many cancer screenings, immunizations, and depression screening. However, the way a visit is billed matters: a visit coded as a "preventive" visit may be free, while the same visit coded as "diagnostic" (e.g., if the user brings up a specific symptom) may trigger a copay. Users should ask their provider's billing office how to maximize their preventive benefits. For uninsured users, sliding-scale clinics, state health departments (for immunizations), and community health centers are key access points.

---

## Example

**Input:** "I just turned 47, I'm a woman, and I've honestly been terrible about my health for the last few years. I have a primary care doctor but I haven't seen her in about 3 years. I don't have any major medical conditions. Where do I even start?"

**Output:**

> **Disclaimer:** This checklist is for general health education purposes only and does not constitute medical advice. Individual screening recommendations depend on your personal and family health history -- please discuss this checklist with your healthcare provider to confirm which items apply to you and at what frequency.

---

## Annual Preventive Health Checklist
**Life Stage:** Ages 40-49
**Generated For:** Current Calendar Year
**Notes:** You are catching up after a 3-year gap. This checklist is organized so you tackle the highest-impact items first. You have a PCP -- that is a significant advantage. Start by scheduling that appointment; it will unlock everything else.

---

### WHERE TO START: YOUR FIRST THREE MONTHS

You do not need to do everything at once. Here is your re-entry sequence:

**Week 1-2: Make These Calls**
- [ ] Schedule appointment with your PCP -- request a comprehensive "new patient" level visit even though she knows you, to ensure full history review -- Due: This week
- [ ] Request any records from prior providers if relevant history is elsewhere -- Due: Before your PCP appointment

**At Your PCP Appointment (Target: Within 6 weeks):**
- [ ] Complete metabolic panel (CMP) -- fasting required (9-12 hours, water is fine)
- [ ] Fasting lipid panel (total cholesterol, LDL, HDL, triglycerides)
- [ ] Fasting glucose AND HbA1c (HbA1c does not require fasting; often ordered together)
- [ ] CBC (complete blood count)
- [ ] TSH (thyroid) -- particularly important for women in this age range
- [ ] Blood pressure reading (note: if elevated at this visit, your provider may recommend home monitoring)
- [ ] Discuss colorectal cancer screening -- you are 47, which means this is due; discuss colonoscopy (every 10 years) vs. annual stool-based testing (Cologuard or FIT test); this is a shared decision with your provider
- [ ] Confirm immunization status -- bring any records you have
- [ ] Cervical cancer screening status: if your last Pap was more than 3 years ago or your last co-test (Pap + HPV) was more than 5 years ago, this may be due; your provider will confirm
- [ ] Discuss mammography: guidelines vary between organizations (some recommend starting at 40, others at 45 or 50); this is a personal decision made with your provider based on your risk factors
- [ ] Update medications list and allergy record

---

### MEDICAL APPOINTMENTS

| Item | Frequency | Due By | Completed | Notes |
|------|-----------|--------|-----------|-------|
| Annual physical / wellness exam | Annually | Book now -- within 6 weeks | ___ | First visit in 3 years -- request comprehensive review |
| CMP (comprehensive metabolic panel) | Per provider | At physical | ___ | Fasting (9-12 hours) |
| Fasting lipid panel | Per provider | At physical | ___ | Fasting (9-12 hours) |
| Fasting glucose | Per provider | At physical | ___ | |
| HbA1c | Per provider | At physical | ___ | No fasting required |
| CBC | Per provider | At physical | ___ | |
| TSH (thyroid) | Per provider | At physical | ___ | Standard for women 40+ |
| Blood pressure check | Annually + all visits | At every medical visit | ___ | Home monitoring if elevated (120+ systolic) |
| Colorectal cancer screening | Colonoscopy q10yr OR annual stool test | OVERDUE -- discuss at physical | ___ | Age 47 -- this is due |
| Cervical screening (Pap / HPV co-test) | Every 3-5 years depending on type | Likely overdue -- confirm at physical | ___ | Last test >3-5 years ago |
| Mammography discussion | Per provider recommendation | Discuss at physical | ___ | Shared decision based on risk factors |
| Skin check (dermatologist) | Every 1-3 years | Q2 this year | ___ | Has this ever been done? Flag at physical |
| Bone density (DEXA) -- future planning | Typically initiates at menopause or per risk | Discuss with provider | ___ | Not necessarily due now but ask about timeline |

---

### DENTAL HEALTH

| Item | Frequency | Due By | Completed | Notes |
|------|-----------|--------|-----------|-------|
| Dental cleaning and exam #1 | Every 6 months | Q2 -- April/May | ___ | If >6 months since last cleaning, this is overdue |
| Dental cleaning and exam #2 | Every 6 months | Q4 -- October/November | ___ | |
| Dental X-rays (bitewing) | Annually to biennially | At first cleaning | ___ | Especially important given 3-year gap |
| Periodontal probing | At every cleaning | At first cleaning | ___ | Request this specifically; silent gum disease is common |
| Oral cancer screening | At every cleaning | At first cleaning | ___ | Visual and tactile exam; should be standard |
| Address any identified issues | Within 3 months | As scheduled | ___ | |

**Daily Home Care (Build These Habits Now):**
- [ ] Brush twice daily with fluoride toothpaste -- 2 minutes per session
- [ ] Floss daily (or use water flosser)
- [ ] Replace toothbrush every 3 months

---

### VISION CARE

| Item | Frequency | Due By | Completed | Notes |
|------|-----------|--------|-----------|-------|
| Comprehensive dilated eye exam | Annually at 47+ | Q2 -- May/June | ___ | Presbyopia common in mid-40s; glaucoma screening important |
| Prescription update (if applicable) | As needed | At exam | ___ | |
| Glaucoma screening | Included in dilated exam | At eye exam | ___ | Elevated intraocular pressure is silent |
| Digital eye strain habit (20-20-20 rule) | Daily | Ongoing | ___ | Every 20 min, look 20 ft away for 20 sec |

---

### IMMUNIZATIONS

| Vaccine | Your Status | Action Needed | Target Date |
|---------|-------------|---------------|-------------|
| Influenza (flu) | Unknown -- likely overdue | Get this fall | October-November |
| COVID-19 | Unknown | Confirm status at PCP visit | At physical |
| Tdap / Td booster | Unknown -- if last was >10 years ago, overdue | Confirm at PCP | At physical |
| Shingrix (Zoster) | Not yet recommended (starts at 50) | Note for 3 years from now | Age 50 |
| Hepatitis B | Confirm immunity | Discuss at physical | At physical |
| HPV | Discuss with provider (ages 27-45 is shared decision-making) | Discuss at physical | At physical |

---

### MENTAL HEALTH

| Item | Target | Due By | Completed | Notes |
|------|--------|--------|-----------|-------|
| PHQ-2 self-screen (depression) | Quarterly | Every 3 months | ___ | Score ≥3: complete PHQ-9 and discuss with provider |
| GAD-7 self-screen (anxiety) | Quarterly | Every 3 months | ___ | Score ≥10: discuss with provider |
| Sleep quality review | Monthly | Monthly | ___ | 7-9 hours/night; consistent schedule |
| Stress inventory | Quarterly | Every 3 months | ___ | Identify top stressors; evaluate coping resources |
| AUDIT-C substance use self-check | Annually | Q1 | ___ | Score ≥3: discuss with provider |
| Mental health professional (if desired) | Per need | Ongoing | ___ | |

---

### SELF-MONITORING HABITS

| Habit | Target | Tracking | Monthly Check-In |
|-------|--------|----------|------------------|
| Physical activity | 150 min/week moderate OR 75 min/week vigorous + 2x strength training | Calendar, app, or wearable | ___ |
| Sleep | 7-9 hours; consistent bedtime ±30 min | Sleep log or phone app | ___ |
| Hydration | ~2.7L total daily water from all sources | Habit tracking | ___ |
| Skin self-exam (ABCDE) | Monthly, 1st of each month | Calendar reminder | ___ |
| Blood pressure home monitoring | Weekly if any elevated readings at medical visits | Log with dates | ___ |
| Breast self-awareness | Monthly -- note any changes in texture, shape, skin, nipple | Calendar reminder | ___ |
| Sun protection (SPF 30+ broad spectrum) | Daily on exposed skin | Ongoing habit | ___ |

---

### HOME HEALTH MAINTENANCE

| Item | Frequency | Due Dates | Completed |
|------|-----------|-----------|-----------|
| First aid kit inspection and restock | Every 6 months | January + July | ___ |
| Medication cabinet expiration audit | Quarterly | January, April, July, October | ___ |
| Personal health record update | Annually | January | ___ |
| Emergency wallet card / phone health app update | Annually + any medication change | January | ___ |
| Healthcare proxy / advance directive | Review annually | January | ___ |
| Smoke detector test | Monthly |
