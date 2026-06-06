---
name: health-screening-schedule
description: |
  Provides age-based and sex-based preventive health screening frameworks derived from major medical guideline structures. Produces a screening timeline organized by life stage with screening types, general frequency guidelines, and questions to discuss with a healthcare provider.
  Use when the user asks about recommended health screenings by age, when to get certain check-ups, or how to build a preventive screening schedule.
  Do NOT use for interpreting screening results, recommending specific tests for individuals, or making scheduling decisions for users with existing health conditions.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "fitness guide strategy"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Health Screening Schedule

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health. If you are experiencing a medical emergency, contact emergency services immediately.

---

## When to Use

**Use this skill when:**
- A user asks which health screenings are recommended for their age group (e.g., "What tests should I get in my 40s?")
- A user wants to understand the purpose and general frequency of specific preventive screenings (e.g., "What is a colonoscopy screening for and when do people start getting them?")
- A user wants to build a structured preventive health timeline to bring to a primary care appointment
- A user asks why a particular screening exists -- what disease or condition it is designed to catch early
- A user asks general questions about the difference between a wellness visit and a diagnostic visit
- A user wants to understand which screenings are sex-specific or anatomy-specific and why
- A user returning to the healthcare system after a gap wants to understand what may have changed in screening guidelines

**Do NOT use this skill when:**
- The user is asking to interpret a specific screening result (e.g., "My PSA came back at 5.2 -- is that bad?") -- use a result-interpretation or clinical-review handoff instead
- The user has a named diagnosis, active symptoms, or a condition that drives a different screening protocol -- those require individualized clinical guidance beyond this skill's scope
- The user has a known hereditary cancer syndrome (BRCA1/2, Lynch Syndrome, familial adenomatous polyposis) -- their screening protocol is substantially different and must be provider-managed
- The user asks whether they specifically need a given test -- that is an individualized clinical recommendation, not a framework delivery
- The user is asking about pediatric or adolescent screenings (under age 18) -- those follow a different well-child and adolescent framework
- The user is a healthcare professional asking for clinical protocol depth -- point them to clinical decision tools and primary guideline sources
- The user is already symptomatic and asking whether a screening is appropriate -- symptomatic investigation is diagnostic workup, not preventive screening

---

## Process

### Step 1: Establish the User's Context Before Presenting Information

Before presenting a framework, clarify the three elements that most significantly shape screening structure:

- **Age:** Decade of life is sufficient. Do not ask for a specific birth date. Age is the primary driver of which screenings become relevant and when.
- **Biological sex / anatomy:** Some screenings are anatomy-specific (cervical, breast, prostate, ovarian). Use inclusive, non-assumptive language: "Do any of these apply to your anatomy -- cervix, breasts, prostate, ovaries -- or would you like me to include all anatomy-based screenings and you can note which apply to you?"
- **Screening purpose:** Is the user trying to understand what exists, build a general checklist, or prepare for a specific provider conversation? This shapes the depth and format of the output.

If the user volunteers no information, provide the full framework organized by life stage and note they can identify the relevant tier.

Always note at this stage: if the user does not have an established primary care provider, the single highest-yield first action is establishing one -- this should be stated clearly before any framework is delivered.

### Step 2: Select and Present the Correct Life Stage Framework

Map the user's age to one of four life stage tiers. These tiers correspond to when major screening transitions occur in general guideline structures:

- **Tier 1: Ages 18-39 -- Young Adult Baseline**
- **Tier 2: Ages 40-49 -- Early Mid-Life Transition**
- **Tier 3: Ages 50-64 -- Core Preventive Window**
- **Tier 4: Ages 65+ -- Comprehensive Geriatric Maintenance**

Users who are at a tier boundary (e.g., age 44 approaching 45) should receive guidance for their current tier AND a preview of what screening conversations become relevant in the next tier within 1-5 years. This is a high-value addition -- many screenings have an "initiation" discussion that should happen 1-2 years before the recommended start age.

### Step 3: Structure the Framework by Screening Domain

Within each life stage, organize screenings by clinical domain rather than alphabetically. Clinical domain organization mirrors how a provider actually discusses these topics and helps the user understand the logical groupings:

1. **Cardiovascular risk** -- blood pressure, lipids, glucose/A1C, BMI/weight
2. **Cancer screenings** -- colorectal, lung, breast, cervical, prostate, skin
3. **Metabolic and endocrine** -- thyroid, diabetes markers
4. **Sensory and dental** -- vision, hearing, oral health
5. **Bone and musculoskeletal** -- osteoporosis (DEXA), fall risk
6. **Infectious disease / immunizations** -- STI screenings, vaccine status
7. **Mental health** -- depression screening, cognitive assessment (65+)
8. **Functional and safety** -- advance directives, medication review, fall risk (65+)

For each screening type, provide:
- The target condition it is designed to detect
- The general recommended start age for average-risk adults
- The general frequency when normal results are returned
- What moves someone to a higher-frequency or earlier-start category (risk factors, without specifying the individual's risk)
- A concrete "question to ask your provider" specific to that screening

### Step 4: Provide Specific Frequency Numbers and Thresholds

Generic advice like "check regularly" is not useful. Provide the actual general framework numbers that reflect common guideline structures. These are the numbers the user will encounter in conversations with their provider:

**Cardiovascular:**
- Blood pressure: Every 2 years if consistently below 120/80 mmHg; annually if 120-129/less than 80 (elevated range); more frequently if 130+ mmHg (hypertension range)
- Fasting lipid panel: Every 5 years for normal results in a low-risk adult; every 1-2 years if borderline or on treatment
- Fasting glucose or A1C: Every 3 years starting at age 35-45 for average risk; baseline A1C normal is below 5.7%; prediabetes range 5.7-6.4%

**Cancer:**
- Colorectal: Average risk -- discussion at 45, options include colonoscopy every 10 years (if normal), annual fecal immunochemical test (FIT), or stool DNA test (Cologuard) every 1-3 years
- Cervical: Age 21-65 with a cervix -- Pap smear every 3 years ages 21-29; co-testing (Pap + HPV) every 5 years ages 30-65, or Pap alone every 3 years; high-risk HPV primary testing every 5 years is an accepted alternative in some guideline structures
- Breast (mammography): Many guideline structures suggest annual screening beginning at 40; others suggest shared decision-making at 40-44 with recommended annual screening from 45-54 and every 2 years from 55+. The variation in guideline structures on this topic is worth noting explicitly -- the user should discuss this directly with their provider.
- Lung: Annual low-dose CT (LDCT) for adults aged 50-80 who have a 20 pack-year smoking history AND currently smoke OR quit within the past 15 years
- Prostate (PSA): Shared decision-making discussion at age 50 for average risk; at 45 for Black men (who have higher incidence) or those with a first-degree relative diagnosed before 65; at 40 for those with multiple first-degree relatives diagnosed at early age
- Abdominal aortic aneurysm (AAA): One-time abdominal ultrasound for men aged 65-75 who have ever smoked (100+ cigarettes lifetime)

**Bone:**
- DEXA bone density: Women -- begin at age 65 for average risk; earlier for women with risk factors (low body weight, steroid use, early menopause, fracture history). Men -- discuss at age 70 or earlier if significant risk factors present.

**Mental Health:**
- Depression screening: At least annually as part of a wellness visit across all adult age groups; PHQ-2 and PHQ-9 are the tools commonly used in primary care

### Step 5: Address Sex-Specific and Anatomy-Based Screenings with Appropriate Sensitivity

Many screenings depend on anatomy, not gender identity. Frame this clearly:

- Cervical cancer screening applies to anyone who has a cervix, regardless of gender identity
- Breast cancer screening applies to anyone who has breast tissue
- Prostate screening applies to anyone who has a prostate
- Ovarian cancer has no recommended general population screening -- note this explicitly because many users assume there is one. There is currently no reliable general-population screening test for ovarian cancer with proven benefit; this is a common misconception to address.
- For transgender and non-binary users, note that hormone therapy duration and surgical history affect which anatomy-based screenings remain relevant, and a provider with expertise in transgender health should guide the personalized schedule

### Step 6: Present the Immunization Layer

Adult immunizations are a parallel preventive track that the screening conversation often neglects. Integrate them as a distinct section:

- **Annual:** Influenza (all adults), COVID-19 (per current guidance)
- **Every 10 years:** Td (tetanus/diphtheria); one-time Tdap (tetanus/diphtheria/pertussis) if not previously received as an adult
- **Age 19-26 (or through 45 per provider discussion):** HPV vaccine series (Gardasil 9) -- 2-dose series if started before age 15, 3-dose series if started at 15 or older
- **Age 50+:** Recombinant zoster vaccine (Shingrix) -- 2-dose series, 2-6 months apart; highly recommended
- **Age 65+:** Pneumococcal vaccines (PCV15 or PCV20 depending on prior vaccination history); RSV vaccine (one-time, age 60+, per shared decision-making)
- **All adults:** Hepatitis B series if not previously vaccinated or if serology is negative
- **Higher-risk adults:** Hepatitis A, meningococcal, pneumococcal at younger ages based on conditions or exposures

### Step 7: Generate the Provider Conversation Framework

The most actionable output of this skill is equipping the user to have a productive conversation with their provider. Generate a customized list of specific, intelligent questions calibrated to the user's life stage. Generic questions ("Are there other screenings I need?") are less useful than targeted ones ("I've read that some guidelines recommend starting colorectal screening at 45 -- given my family history and health, when do you think I should start and which method would you recommend?").

Provider conversation questions should:
- Name the specific screening being asked about
- Reference the life stage relevance ("I know this becomes relevant in my 40s...")
- Invite the provider to personalize ("Given my specific history...")
- Include risk factor openings ("Is there anything in my family history that would change when I start?")

### Step 8: Deliver the Output in the Structured Format Below

Use the Output Format template, populated with real numbers and domain-specific content for the user's life stage. Do not leave placeholder fields. Every row in the screening table should contain real general guideline frequency data.

---

## Output Format

```
## Preventive Screening Framework: Ages [XX-XX] ([Sex/All Anatomy])

> **Important:** This framework reflects general guideline structures for average-risk adults.
> Individual schedules should be personalized by a healthcare provider based on your
> personal and family health history, lifestyle factors, and prior screening results.

---

### Domain 1: Cardiovascular Risk Screening

| Screening           | Target Condition          | General Start Age | Average-Risk Frequency    | Risk Escalation Trigger             |
|---------------------|---------------------------|-------------------|---------------------------|--------------------------------------|
| Blood pressure      | Hypertension              | 18                | Every 2 yrs if <120/80    | Annually if 120-129; more if 130+    |
| Fasting lipid panel | Dyslipidemia, CVD risk    | 20 (baseline)     | Every 5 yrs if normal     | Every 1-2 yrs if borderline          |
| Fasting glucose/A1C | Prediabetes, Type 2 DM    | 35-45             | Every 3 years             | Annually if prediabetes (5.7-6.4%)  |
| BMI assessment      | Obesity, metabolic risk   | 18                | At each wellness visit    | More frequent if BMI ≥ 30            |

**Key threshold to know:** An A1C below 5.7% is considered normal. 5.7-6.4% is prediabetes. 6.5%+ on two separate tests is diagnostic of diabetes.

---

### Domain 2: Cancer Screenings

| Screening             | Target          | General Start Age | Method Options                      | Average-Risk Frequency             |
|-----------------------|-----------------|-------------------|--------------------------------------|------------------------------------|
| Colorectal            | Colorectal ca.  | 45                | Colonoscopy / FIT / Cologuard        | Colonoscopy: 10 yrs; FIT: annually |
| Cervical (if cervix)  | Cervical ca.    | 21                | Pap smear / co-test (Pap+HPV)        | Pap: every 3 yrs; co-test: 5 yrs  |
| Breast (if tissue)    | Breast cancer   | 40-50 (varies)    | Mammogram                            | Annually or every 2 yrs (discuss)  |
| Lung                  | Lung cancer     | 50 (if eligible)  | Low-dose CT scan (LDCT)              | Annually if eligible               |
| Prostate (if prostate)| Prostate ca.    | 50 (or 45/40)     | PSA blood test (shared decision)     | Per provider after discussion      |
| Skin                  | Skin cancer     | All ages          | Clinical skin exam / self-exam       | Annual clinical exam if risk present|
| Oral cancer           | Oral ca.        | All adults        | Via dental exam                      | Every 6-12 months (dental visit)   |

**Note on ovarian cancer:** There is currently no recommended general-population screening test for ovarian cancer. Reporting symptoms (bloating, pelvic pain, early satiety, urinary urgency) promptly to a provider is the current guidance.

---

### Domain 3: Metabolic and Endocrine Screening

| Screening              | Target               | General Start Age | Frequency                              |
|------------------------|----------------------|-------------------|-----------------------------------------|
| Thyroid (TSH)          | Hypothyroidism       | Per provider      | Not routine without symptoms or risk    |
| Vitamin D              | Deficiency           | Per provider      | Not universally recommended; discuss   |
| Kidney function (BMP)  | CKD risk             | Per provider risk | More relevant if hypertension/DM       |

---

### Domain 4: Bone Health

| Screening    | Target        | General Start Age             | Frequency                       |
|--------------|---------------|--------------------------------|---------------------------------|
| DEXA scan    | Osteoporosis  | Women: 65 / Men: 70 (avg risk) | Every 2 yrs if borderline; 5-10 if normal |

---

### Domain 5: Sensory and Dental Health

| Screening      | Target                  | Frequency                                      |
|----------------|-------------------------|------------------------------------------------|
| Dental exam    | Caries, periodontal, oral ca. | Every 6-12 months                         |
| Vision exam    | Refractive error, glaucoma risk | Every 2 years; annually with correction   |
| Hearing screen | Hearing loss            | Discuss at 50+; annually at 65+                |

---

### Domain 6: Mental Health Screening

| Screening             | Tool Used Commonly | Frequency                         | Notes                             |
|-----------------------|--------------------|------------------------------------|------------------------------------|
| Depression            | PHQ-2 / PHQ-9      | Annually at wellness visit         | Applies all adult age groups       |
| Anxiety               | GAD-7              | Per provider judgment              | Increasingly recommended routinely |
| Cognitive assessment  | MoCA / MMSE        | Per provider judgment              | Typically initiated 65+            |

---

### Domain 7: Immunization Status

| Vaccine                | Population                   | Schedule                              |
|------------------------|------------------------------|----------------------------------------|
| Influenza              | All adults                   | Annually (fall)                        |
| COVID-19               | All adults                   | Per current public health guidance     |
| Tdap/Td                | All adults                   | Tdap once; Td booster every 10 years   |
| HPV (Gardasil 9)       | Through age 26 (discuss 27-45)| 2-dose or 3-dose series               |
| Shingrix (Zoster)      | Age 50+                      | 2 doses, 2-6 months apart              |
| Pneumococcal           | Age 65+                      | PCV20 (or per prior vaccine history)   |
| RSV                    | Age 60+                      | One-time, per shared decision          |
| Hepatitis B            | All unvaccinated adults       | 3-dose series (or 2-dose Heplisav-B)  |

---

### Questions to Bring to Your Provider

**Cardiovascular:**
1. "My last cholesterol panel was [X years ago]. Given my age and lifestyle, how often should I be checking this, and is my cardiovascular risk profile something we should reassess?"
2. "Should I be screened for diabetes or prediabetes now that I'm in my [40s/50s]? What does my A1C look like relative to the prediabetes threshold?"

**Cancer:**
3. "I know colorectal screening is recommended starting at 45 for average risk. Which method do you recommend for me -- colonoscopy, FIT, or the stool DNA test -- and when should I start?"
4. "Are there any cancer screenings I should be starting earlier given my family history?"

**Anatomy-Specific:**
5. "[If relevant] What is your recommendation on mammography for me -- the guidelines seem to vary. Should I start at 40 or 45, and should I screen annually or every two years?"
6. "[If relevant] I'd like to have the PSA discussion. Can you walk me through the pros and cons and what you'd recommend given my history?"

**Immunizations:**
7. "Can you run through my immunization history? I want to make sure I'm current on Tdap, and I believe I'm due for Shingrix."

**General:**
8. "Is there anything in my family history or current health that would accelerate any of these timelines?"

---

### Annual Health Maintenance Checklist

- [ ] Schedule annual wellness visit / physical with primary care provider
- [ ] Bring an updated medication list (prescription, OTC, and supplements)
- [ ] Bring updated family health history (any first-degree relatives with new diagnoses)
- [ ] Discuss screening timeline using questions above
- [ ] Confirm immunization record and identify gaps
- [ ] Schedule dental exam (every 6-12 months)
- [ ] Schedule eye exam if due
- [ ] Ask specifically: "Is there anything I should be doing to reduce my personal risk of [cardiovascular disease / diabetes / cancer] based on what you know about me?"
```

---

## Rules

1. **Always present the disclaimer before providing any health framework.** The disclaimer is not optional and must appear before any screening content is delivered.

2. **Never recommend a specific screening for a specific individual.** The skill presents general guideline structures, not individualized clinical recommendations. The framing must always be "general guidelines for average-risk adults suggest..." not "you should get a colonoscopy."

3. **Never use the phrase "you need" in reference to any screening.** Use "many guideline structures recommend," "the general framework suggests," or "a common recommendation for average-risk adults is." The word "need" implies clinical determination.

4. **Always provide the actual frequency number -- never leave it as "regularly" or "as needed."** If a screening has a 3-year interval for normal results, state 3 years. Vague frequency language is the primary failure mode of generic health content.

5. **Always name the target condition the screening is designed to detect.** Users understand screenings better when they know what condition is being caught early. This also helps them understand why certain screenings start at certain ages.

6. **Never present mammography screening as settled.** The breast cancer screening guidelines across major medical organizations genuinely differ on start age (40 vs. 45 vs. 50) and frequency (annual vs. biennial). Accurately representing this as a "discuss with your provider" item is correct, not evasive -- it reflects actual guideline divergence.

7. **Always address the ovarian cancer screening misconception if relevant.** Many users believe routine ovarian cancer screening exists. It does not have a recommended general-population test. Correcting this misconception is a high-value action that prevents false reassurance.

8. **Never omit the immunization layer.** Adult immunizations are a core component of preventive health that is frequently neglected. Treating them as a separate optional section leads users to overlook vaccine gaps that are clinically significant (e.g., Shingrix, hepatitis B, HPV catch-up).

9. **Always note when a risk factor category would escalate the screening protocol, even without specifying the user's own risk.** Phrases like "if you have a first-degree relative diagnosed with colorectal cancer before age 60, the general framework typically moves the start age to 40 or 10 years before their diagnosis age, whichever is earlier" are informative without being diagnostic.

10. **If the user has no primary care provider, make establishing one the first and most prominent output before any screening framework.** A preventive screening framework is substantially less actionable without a provider relationship to implement it. The absence of a PCP is not a footnote -- it is the most important clinical gap.

11. **When the user is near a life stage transition (within 2-3 years), always preview the upcoming tier's new screening conversations.** The 43-year-old approaching 45 should know that colorectal screening and potentially mammography discussions are imminent. Proactive previewing is high clinical value.

12. **Always separate screening (asymptomatic detection) from diagnostic workup (symptom-driven testing).** If a user asks "I've been having rectal bleeding -- should I get a colonoscopy?" that is a diagnostic question, not a screening question. Redirect clearly: "What you're describing is a symptom that warrants a call to your provider today -- that's different from routine screening and should be evaluated promptly."

---

## Edge Cases

### User Has a Known Strong Family History

When a user volunteers a first-degree relative with a specific cancer or cardiac condition, acknowledge the clinical significance without specifying how it changes their protocol. Use this framing: "A first-degree family history of [condition] is clinically significant and typically changes both the starting age and frequency of related screenings. For example, a first-degree relative with colorectal cancer diagnosed before age 60 generally moves the recommended start for colonoscopy to either age 40 or 10 years before their diagnosis age -- whichever comes first. I can tell you the general family-history rules of thumb for the condition you're asking about, but your provider needs to take a complete family history to apply this to your specific situation."

### User Has No Primary Care Provider

This is the most important edge case. Present it prominently: "Before building a screening timeline, the single highest-yield step I can recommend is establishing a primary care provider. The framework I'm about to share is designed to be brought into that relationship -- a provider who knows your history can take this general structure and convert it into a personalized calendar. To find a provider: check your insurance plan's directory for in-network primary care physicians or internists, or look into federally qualified health centers (FQHCs) if cost or coverage is a barrier -- they provide services on a sliding-scale fee basis."

### User Asks About a Condition for Which No General-Population Screening Exists

Several conditions commonly believed to have routine screenings do not:
- **Ovarian cancer:** No recommended general-population screening test. CA-125 and transvaginal ultrasound are used in high-risk populations (BRCA carriers) but are not recommended for general population use.
- **Pancreatic cancer:** No recommended general-population screening.
- **Brain tumors:** No recommended general-population screening.

When a user asks about these, do not leave a vacuum. Explain: "There is currently no recommended routine screening test for [condition] in the general population. This is because no available test has been shown to reliably catch it early enough to meaningfully improve outcomes at the population level without causing more harm than benefit from false positives. If you have a specific concern or family history of [condition], that conversation belongs with your provider, who can assess whether any specialized screening is appropriate for you individually."

### User Is Concerned About Cost

Provide concrete guidance: "In the United States, the Affordable Care Act requires most insurance plans (non-grandfathered) to cover preventive screenings at an A or B recommendation rating without cost-sharing (no copay, no deductible applied). This includes screenings like blood pressure, cholesterol, colorectal cancer, mammography, and depression. Always call your insurer before the appointment to confirm: ask 'Is this coded as a preventive service under ACA mandates or as a diagnostic service?' The billing code matters. If the provider adds diagnostic coding during the visit, it can trigger cost-sharing even for a preventive appointment." For those without insurance: federally qualified health centers (FQHCs), community health centers, and health department clinics offer screenings on sliding-scale fees.

### User Is Transgender or Non-Binary

Frame clearly and sensitively: "Preventive screening recommendations for anatomy-based screenings are determined by which organs are present and any hormone exposure, not by gender identity. A person who was assigned female at birth, currently identifies as male, and has not had a hysterectomy or oophorectomy still has a cervix and ovaries -- cervical screening guidelines still apply. Hormone therapy also affects some screening timelines. I'd encourage connecting with a primary care provider who has experience in transgender health to build a fully personalized screening plan that accounts for your specific anatomy, hormone use, and surgical history."

### User Is in Their Late 30s and Asks "Is It Too Early?"

This is a common and important question. Many screenings that "officially" start at 40 or 45 have a meaningful on-ramp conversation at 38-39. Frame it this way: "It's never too early to discuss screening -- the discussion itself is the preventive action. For colorectal screening, for example, most guidelines now recommend the conversation starts at 45 for average-risk adults, which means having the discussion with your provider at 43-44 so you're not late. Blood pressure, cholesterol, and glucose checks are appropriate now regardless of age. The single best thing you can do in your late 30s is have a comprehensive baseline wellness visit and ask your provider: 'What's my cardiovascular risk score, and are there any screenings I should be initiating now rather than waiting?'"

### User Asks Why Guidelines Differ Across Organizations

This comes up most often with breast cancer screening and prostate cancer screening. Explain the underlying reason clearly: "Medical guidelines are set by different organizations (medical specialty societies, independent advisory bodies) using the same evidence but weighing trade-offs differently. The core tension is between sensitivity (catching more cancers early) and specificity (avoiding false positives that lead to unnecessary biopsies, anxiety, and procedures that carry their own risks). For breast cancer, some organizations weight early detection more heavily and recommend annual screening from 40; others apply a population-benefit framework and find that the harm-benefit ratio favors starting at 45 or 50 with biennial screening. Neither position is wrong -- they reflect genuinely different value judgments about risk. This is why the 'discuss with your provider' guidance is not a deflection: it is asking you to make a shared decision about your own values and risk tolerance."

### User Has Had a Prior Abnormal Screening Result

If the user mentions a prior abnormal finding (e.g., "I had a polyp removed during my last colonoscopy"), clarify immediately: "A history of polyps, abnormal Pap results, or other prior findings changes your screening schedule -- that is now a surveillance schedule, not a population-level screening schedule. Surveillance intervals are shorter and follow a different protocol. I can share the general population screening framework, but your surveillance schedule was or should have been set specifically by the provider who did the procedure. If you don't have that information, contact that provider's office and ask for your surveillance recommendation in writing."

---

## Example

**Input:** "I'm a 47-year-old woman. I haven't been to the doctor in a few years and I want to get back on track with my health screenings. What should I be looking at?"

**Output:**

---

## Preventive Screening Framework: Ages 40-49 (Female Anatomy)

> **Important:** This framework reflects general guideline structures for average-risk adults. Your individual screening schedule should be personalized by a healthcare provider based on your personal and family health history, prior screening results, and lifestyle factors. This is intended as a preparation guide for that conversation -- not a substitute for it.
>
> **First priority:** Since you mention it's been a few years, establishing or re-establishing care with a primary care provider and scheduling a comprehensive wellness visit is the most important first step. Bring this framework to that appointment.

---

### Domain 1: Cardiovascular Risk Screening

| Screening            | Target                    | General Start Age | Avg-Risk Frequency              | Key Threshold                         |
|----------------------|---------------------------|-------------------|---------------------------------|----------------------------------------|
| Blood pressure       | Hypertension              | 18                | Every 2 yrs if <120/80 mmHg     | Annual if 120-129; more if ≥130 mmHg  |
| Fasting lipid panel  | Dyslipidemia, CVD risk    | 20 (baseline)     | Every 5 yrs if consistently normal | More frequent if borderline LDL    |
| Fasting glucose/A1C  | Prediabetes, Type 2 DM    | 35-45             | Every 3 years                   | A1C 5.7-6.4% = prediabetes range      |
| BMI assessment       | Obesity, metabolic risk   | 18                | At every wellness visit         | BMI ≥ 30 escalates frequency/intensity|

**What to know at 47:** Cardiovascular risk in women increases significantly around perimenopause. Cholesterol profiles often shift during hormonal transition, which makes a baseline lipid panel a high-value test if you haven't had one recently. If your last blood pressure check was years ago, that is likely the first thing measured at your upcoming visit.

---

### Domain 2: Cancer Screenings

| Screening           | Target          | General Start Age | Method Options                        | General Frequency               |
|---------------------|-----------------|-------------------|----------------------------------------|----------------------------------|
| Colorectal          | Colorectal ca.  | 45                | Colonoscopy / FIT / Cologuard stool DNA| Colonoscopy: 10 yrs; FIT: annual |
| Cervical            | Cervical ca.    | 21 (with cervix)  | Pap smear (every 3 yrs) OR co-test (Pap+HPV every 5 yrs) | Per last result |
| Breast (mammogram)  | Breast cancer   | 40-50 (varies)    | Mammogram -- 2D or 3D (tomosynthesis)  | Annual or every 2 yrs (discuss)  |
| Skin                | Melanoma, skin ca.| All adults      | Clinical skin exam; self-monitoring   | Annual clinical exam if risk     |
| Oral cancer         | Oral ca.        | All adults        | Via dental exam                        | Every 6-12 months (dental visit) |

**Important notes at 47:**
- **Colorectal:** You are at or past the age where this conversation should be happening. If you have not had a colonoscopy or completed any colorectal screening, this is one of the most time-sensitive items on this list. Ask your provider this visit.
- **Cervical:** Depending on your last Pap and HPV test results, you may be due or still within a 3-5 year window. Bring whatever records you have. If you have no records and haven't been seen in years, assume you are due.
- **Breast:** Guideline structures for mammography timing genuinely differ. Some recommend annual screening from age 40; others recommend beginning the discussion at 40-44 with annual screening recommended from 45-54 and biennial from 55. You are in the window where this conversation should be happening now if it hasn't already. 3D mammography (digital breast tomosynthesis) is now widely available and has modestly better detection rates than standard 2D in women with dense breast tissue.
- **Ovarian cancer:** There is no recommended routine screening test for ovarian cancer in the general population. Reporting persistent symptoms (bloating, pelvic pain, early fullness when eating, urinary frequency or urgency) to your provider is the current guidance.

---

### Domain 3: Bone Health

| Screening | Target       | General Start Age     | Frequency                                        |
|-----------|--------------|-----------------------|---------------------------------------------------|
| DEXA scan | Osteoporosis | Women: 65 (avg risk)  | Earlier if risk factors present; every 2 yrs if borderline |

**What to know at 47:** DEXA is not yet routinely recommended at 47 for average-risk women. However, perimenopause accelerates bone density loss. Risk factors that move this earlier include: low body weight (BMI under 21), corticosteroid use, smoking history, prior fractures, or early menopause (before 45). Raise these with your provider to see if earlier screening applies to you.

---

### Domain 4: Mental Health Screening

| Screening   | Common Tool    | Frequency                       |
|-------------|----------------|----------------------------------|
| Depression  | PHQ-2 / PHQ-9  | Annually at wellness visit       |
| Anxiety     | GAD-7          | Per provider judgment            |

Midlife is a period of elevated depression risk, particularly for women during hormonal transition. This is a standard part of the wellness visit and is nothing to avoid or be surprised by.

---

### Domain 5: Sensory and Dental Health

| Screening       | Target                        | General Frequency                        |
|-----------------|-------------------------------|-------------------------------------------|
| Dental exam     | Caries, periodontal, oral ca. | Every 6-12 months                         |
| Vision exam     | Refractive change, glaucoma   | Every 2 years; annually with correction   |
| Hearing         | Hearing loss                  | Discuss starting at 50; begin annual at 65|

---

### Domain 6: Immunization Review

| Vaccine        | Status for You at 47                     | Schedule Note                                  |
|----------------|------------------------------------------|--------------------------------------------------|
| Influenza      | Due annually                             | Best received September-October                  |
| COVID-19       | Per current public health guidance       | Discuss updated booster timing                   |
| Tdap/Td        | Tdap once in adulthood; Td every 10 yrs  | If you can't recall your last tetanus, you may be due |
| HPV            | Shared decision-making ages 27-45        | Discuss with provider if not previously completed |
| Shingrix       | Begins at age 50                         | Start planning: 2 doses, 2-6 months apart        |
| Hepatitis B    | If not previously vaccinated or serology negative | 2-dose Heplisav-B or 3-dose Engerix series |

**Preview for your early 50s:** Shingrix (shingles vaccine) is one of the highest-efficacy vaccines in the adult schedule and is recommended starting at age 50. Begin the conversation at your upcoming visit so it is on the radar.

---

### Questions to Bring to Your Provider

**High priority given your gap in care:**

1. "I haven't been seen in a few years. Can we do a baseline review -- blood pressure, fasting lipids, glucose/A1C, and a CBC -- so we know where I'm starting from?"

2. "I'm 47 and I haven't had colorectal screening yet. Which method do you recommend for me -- colonoscopy, the annual FIT test, or the Cologuard stool DNA test? When can we get this scheduled?"

3. "When was my last cervical Pap or co-test documented? Do you have records, or should I track down my prior records? Am I currently due?"

4. "I know mammography guidelines vary. What is your recommendation for me -- should I be screening annually or every two years, and should I have a 3D mammogram given that I'm not sure about my breast density?"

5. "Are there any risk factors in my history -- family history, weight, cholesterol trends -- that would move any of these screening timelines earlier?"

6. "Can you check my immunization history? I want to confirm I'm current on Tdap, and I know Shingrix is coming up at 50."

7. "Is there anything about perimenopause I should be watching for that would affect my screening schedule or general health approach over the next several years?"

---

### Annual Health Maintenance Checklist -- Priority Reset Visit

Given a multi-year gap, treat this first visit as a comprehensive baseline reset:

- [ ] Book comprehensive wellness visit (not a sick visit -- request a "preventive/annual physical")
- [ ] Request fasting bloodwork in advance: lipid panel, fasting glucose or A1C, CBC, and per provider CMP
- [ ] Bring all medication, supplement, and OTC drug information
- [ ] Bring whatever prior records you have (especially prior Pap/HPV results and colonoscopy history)
- [ ] Bring updated family health history (any new first-degree relative diagnoses)
- [ ] Ask provider to review immunization status and print a current immunization record
- [ ] Discuss colorectal screening method and schedule the procedure or first FIT test
- [ ] Discuss mammography timing and schedule if due
- [ ] Ask about cervical screening status and schedule if due
- [ ] Schedule dental exam (every 6-12 months)
- [ ] Schedule eye exam if more than 2 years since last
- [ ] Ask: "What is my 10-year cardiovascular risk, and is there anything I should be doing now to improve it?"

---

**One final note:** Returning to care after a gap is genuinely one of the most health-protective decisions you can make. The screenings listed above exist specifically because many serious conditions -- cardiovascular disease, colorectal cancer, cervical cancer, diabetes -- are significantly more treatable when caught early, before symptoms appear. You are doing the right thing.
