---
name: womens-mens-health
description: |
  Informational guide covering gender-specific preventive screening schedules, common health concerns by life decade, hormonal health basics, reproductive health awareness, bone health, and cardiovascular health differences. Designed to promote health literacy and preventive care awareness.
  Use when the user asks about womens mens health, or needs help with informational guide covering gender-specific preventive screening schedules, common health concerns by life decade, hormonal health basics, reproductive health awareness, bone health, and cardiovascular health differences.
  Do NOT use when the request requires professional medical advice or falls outside the scope of womens mens health.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "health-wellness guide step-by-step"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---

# Gender-Specific Health Awareness

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

>
> - Personalized screening schedules
> - Interpretation of symptoms
> - Treatment decisions
> - Any health concerns
>
> Individual health needs vary based on personal and family medical history, genetics, lifestyle, and other factors. Your doctor knows your health history and is the best source of personalized guidance.

## When to Use

**Use this skill when:**
- User asks about womens mens health
- User needs guidance on womens mens health topics
- User wants a structured approach to womens mens health

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

```
HEALTH AWARENESS ASSESSMENT
==============================

1. GENERAL INFORMATION:
   - Age range: [ ] 18-29 [ ] 30-39 [ ] 40-49 [ ] 50-59 [ ] 60-69 [ ] 70+
   - Biological sex: [ ] Female [ ] Male [ ] Intersex
   - Gender identity: ___

2. WHAT INFORMATION ARE YOU LOOKING FOR?
   [ ] Age-appropriate screening recommendations
   [ ] Understanding specific health concerns
   [ ] Hormonal health information
   [ ] Reproductive health basics
   [ ] Bone health
   [ ] Heart health
   [ ] General preventive care awareness
   [ ] Health concerns by decade of life

3. FAMILY HISTORY (affects screening recommendations):
   [ ] Heart disease (first-degree relative before age 55M/65F)
   [ ] Cancer (type: ___)
   [ ] Diabetes
   [ ] Osteoporosis
   [ ] Autoimmune conditions
   [ ] Mental health conditions
   [ ] Other: ___

4. CURRENT HEALTH STATUS:
   - Under care of a primary doctor: [ ] Yes [ ] No
   - Last routine physical exam: ___
   - Current medications or conditions: ___
   - Up to date on vaccinations: [ ] Yes [ ] No [ ] Unsure

NOTE: If user does not have a primary care provider,
encourage them to establish care. Provide guidance on
finding a provider (insurance network, community health
centers, telehealth options).
```

## Preventive Screening Schedules

### Women's Screening Schedule (General Guidelines)

These are general recommendations based on USPSTF, ACS, and ACOG guidelines. Your doctor may recommend a different schedule based on your individual risk factors.

```
WOMEN'S PREVENTIVE SCREENING GUIDE
======================================

AGE 18-29:
  [ ] Annual well-woman visit
  [ ] Blood pressure: At least every 2 years
  [ ] Cervical cancer screening (Pap smear): Starting at age 21, every 3 years
  [ ] STI screening: As recommended by your provider
  [ ] Skin check: Annual self-exam, provider exam as recommended
  [ ] Dental exam: Every 6-12 months
  [ ] Eye exam: Every 2 years (annually if wearing corrective lenses)
  [ ] Mental health screening: Discuss with provider

AGE 30-39:
  [ ] All of the above, plus:
  [ ] Cervical cancer: Pap every 3 years OR Pap + HPV co-test every 5 years
  [ ] Diabetes screening: Every 3 years if BMI 25+ or risk factors
  [ ] Cholesterol screening: Discuss with provider based on risk
  [ ] Thyroid function: If symptomatic or risk factors

AGE 40-49:
  [ ] All of the above, plus:
  [ ] Mammogram: Discuss with provider; many recommend starting at 40 annually
      (ACS recommends annual from 45; USPSTF says shared decision at 40-49)
  [ ] Diabetes screening: Every 3 years starting at 45 (or earlier if risk factors)
  [ ] Cholesterol: Every 5 years (more often if abnormal)
  [ ] Blood pressure: At least annually

AGE 50-64:
  [ ] All of the above, plus:
  [ ] Mammogram: Every 1-2 years (per provider recommendation)
  [ ] Colorectal cancer screening: Starting at 45-50
      (Colonoscopy every 10 years, or other options per provider)
  [ ] Bone density (DEXA): At 65, or earlier if risk factors
  [ ] Lung cancer screening: Discuss if smoking history (20+ pack-years)

AGE 65+:
  [ ] All of the above, plus:
  [ ] Bone density (DEXA): At 65, then per provider recommendation
  [ ] Colorectal cancer: Continue until 75 (discuss with provider after 75)
  [ ] Cervical cancer: May stop at 65 if adequate prior screening
  [ ] Fall risk assessment
  [ ] Cognitive screening: As recommended
  [ ] Hearing and vision screening: Annually

Note: Family history of cancer may require earlier or more frequent screening.
Discuss your specific family history with your provider.
```

### Men's Screening Schedule (General Guidelines)

```
MEN'S PREVENTIVE SCREENING GUIDE
====================================

AGE 18-29:
  [ ] Annual physical exam (or at least every 2-3 years)
  [ ] Blood pressure: At least every 2 years
  [ ] Testicular self-exam: Monthly awareness (discuss with provider)
  [ ] STI screening: As recommended by your provider
  [ ] Skin check: Annual self-exam
  [ ] Dental exam: Every 6-12 months
  [ ] Eye exam: Every 2 years
  [ ] Mental health screening: Discuss with provider

AGE 30-39:
  [ ] All of the above, plus:
  [ ] Diabetes screening: Every 3 years if BMI 25+ or risk factors
  [ ] Cholesterol: Every 5 years (or as provider recommends)
  [ ] Blood pressure: At least every 2 years

AGE 40-49:
  [ ] All of the above, plus:
  [ ] Diabetes screening: Every 3 years starting at 45
  [ ] Cholesterol: Every 5 years (more often if abnormal)
  [ ] Blood pressure: Annually
  [ ] Heart disease risk assessment
  [ ] Colorectal cancer screening: Starting at 45
      (Colonoscopy every 10 years, or other options per provider)

AGE 50-64:
  [ ] All of the above, plus:
  [ ] Prostate cancer screening: Discuss PSA test with provider
      (Shared decision-making; not universally recommended)
  [ ] Colorectal cancer: Continue per schedule
  [ ] Abdominal aortic aneurysm: One-time ultrasound if 65-75
      with smoking history
  [ ] Lung cancer screening: If 50-80 with 20+ pack-year smoking history

AGE 65+:
  [ ] All of the above, plus:
  [ ] Abdominal aortic aneurysm: One-time screening if not done
  [ ] Bone density: Discuss with provider (less routine than for women)
  [ ] Fall risk assessment
  [ ] Cognitive screening: As recommended
  [ ] Hearing and vision screening: Annually

Note: Family history significantly affects screening recommendations.
Always discuss your family history with your healthcare provider.
```

## Common Health Concerns by Decade

### Women's Health by Decade

**Ages 20s:**
- Establishing healthy habits (nutrition, exercise, sleep)
- Menstrual health awareness and cycle tracking
- Contraception decisions
- HPV vaccination (if not already received)
- Mental health awareness (anxiety, depression peak onset)
- Skin protection (sunscreen, skin cancer prevention)

**Ages 30s:**
- Fertility awareness and family planning
- Pregnancy-related health (if applicable)
- Thyroid health monitoring
- Autoimmune condition awareness (more common in women)
- Stress management and work-life balance
- Maintaining bone-building through weight-bearing exercise

**Ages 40s:**
- Perimenopause awareness (can begin in early-to-mid 40s)
- Breast health and mammography
- Cardiovascular risk increases
- Metabolic changes (insulin sensitivity, weight distribution)
- Vision changes (presbyopia common)
- Maintaining muscle mass (sarcopenia prevention)

**Ages 50s:**
- Menopause transition and management
- Bone health becomes critical (accelerated bone loss post-menopause)
- Heart disease risk increases significantly
- Colorectal cancer screening
- Joint health and arthritis management
- Cognitive health maintenance

**Ages 60s+:**
- Osteoporosis screening and management
- Heart disease (leading cause of death in women)
- Cancer screenings continuation
- Fall prevention
- Cognitive health
- Social connection and mental health
- Maintaining independence and mobility

### Men's Health by Decade

**Ages 20s:**
- Establishing healthy habits
- Testicular health awareness
- Mental health (men less likely to seek help - normalize this)
- Injury prevention (higher risk-taking behavior)
- Substance use awareness
- Skin protection

**Ages 30s:**
- Cardiovascular health foundation (diet, exercise, not smoking)
- Stress management and work-life balance
- Weight management (metabolism begins to slow)
- Mental health check-in
- Family planning considerations
- Maintaining regular medical checkups (men underutilize healthcare)

**Ages 40s:**
- Heart health becomes critical (risk increases significantly)
- Colorectal cancer screening begins
- Diabetes risk increases
- Testosterone levels begin gradual decline
- Prostate health awareness
- Eye health (presbyopia, glaucoma screening)
- Sleep apnea awareness

**Ages 50s:**
- Prostate health discussion with doctor
- Heart disease prevention intensifies
- Metabolic syndrome awareness
- Bone health (men get osteoporosis too, though less commonly)
- Colorectal cancer screening continuation
- Hearing health
- Maintaining muscle mass and physical activity

**Ages 60s+:**
- Prostate health monitoring
- Heart disease management
- Cancer screening continuation
- Fall prevention and balance training
- Cognitive health
- Social isolation prevention
- Maintaining physical independence

## Hormonal Health Basics

### Women's Hormonal Health

**Key Hormones:**
| Hormone | Primary Functions | Symptoms of Imbalance |
|---------|------------------|----------------------|
| Estrogen | Reproductive health, bone density, heart protection, brain function | Hot flashes, irregular periods, mood changes, bone loss |
| Progesterone | Menstrual cycle regulation, pregnancy support, calming effect | Irregular periods, anxiety, sleep issues, PMS |
| Testosterone | Libido, muscle mass, energy, mood | Fatigue, decreased libido, muscle loss |
| Thyroid (T3/T4) | Metabolism, energy, temperature regulation | Weight changes, fatigue, hair changes, mood |

**Menstrual Cycle Basics:**
```
MENSTRUAL CYCLE PHASES (average 28-day cycle)
================================================
Days 1-5:    MENSTRUATION - Uterine lining sheds
Days 1-13:   FOLLICULAR PHASE - Follicles develop; estrogen rises
Day 14 (avg): OVULATION - Egg released; peak fertility
Days 15-28:  LUTEAL PHASE - Progesterone rises; PMS may occur

Normal cycle length: 21-35 days
Consult a doctor if: cycles are consistently irregular, very heavy,
extremely painful, or absent (when not pregnant)
```

**Perimenopause and Menopause:**
- Perimenopause: Transition period, can last 4-8 years (typically starts in 40s)
- Menopause: Defined as 12 consecutive months without a period (average age 51)
- Post-menopause: After menopause; increased risk for osteoporosis and heart disease
- Common symptoms: hot flashes, sleep disruption, mood changes, vaginal dryness
- Management: Discuss options with your doctor (HRT, lifestyle changes, other treatments)

### Men's Hormonal Health

**Key Hormones:**
| Hormone | Primary Functions | Symptoms of Low Levels |
|---------|------------------|-----------------------|
| Testosterone | Muscle mass, bone density, libido, mood, energy | Fatigue, decreased libido, muscle loss, mood changes, fat gain |
| DHEA | Precursor to sex hormones, immune function | Fatigue, depression, decreased immunity |
| Thyroid (T3/T4) | Metabolism, energy, temperature | Weight changes, fatigue, cold intolerance |
| Cortisol | Stress response, metabolism, immune function | Fatigue (low), weight gain and anxiety (high) |

**Testosterone and Aging:**
- Testosterone levels peak in late teens/early 20s
- Gradual decline of approximately 1-2% per year after age 30
- "Andropause" or "late-onset hypogonadism" is more gradual than menopause
- Not all men experience significant symptoms
- Lifestyle factors significantly influence levels (sleep, exercise, stress, weight)
- Testosterone replacement therapy requires careful medical evaluation

**When to Discuss Testosterone with Your Doctor:**
- Persistent fatigue not explained by other causes
- Significant decrease in libido
- Erectile dysfunction
- Depression or mood changes
- Loss of muscle mass despite regular exercise
- Increased body fat, especially abdominal
- Decreased bone density

## Reproductive Health Awareness

### Women's Reproductive Health
- **Annual well-woman exam:** Discuss with your OB/GYN or primary care provider
- **Contraception:** Many options available; discuss with provider to find best fit
- **Fertility awareness:** General fertility begins declining in early 30s, more rapidly after 35
- **Pregnancy planning:** Prenatal vitamins (folic acid) ideally 1-3 months before conception
- **HPV vaccination:** Recommended through age 26 (available through 45 by shared decision)
- **Breast awareness:** Know what is normal for you; report changes to your doctor

### Men's Reproductive Health
- **Testicular awareness:** Know what is normal; report changes, lumps, or pain
- **Prostate health:** Discuss screening timeline with your doctor
- **Fertility:** Generally maintained longer than in women, but quality declines with age
- **Erectile health:** Can be an early indicator of cardiovascular disease; discuss with doctor
- **HPV vaccination:** Recommended through age 26 (available through 45 by shared decision)
- **STI prevention:** Regular screening if sexually active with new or multiple partners

## Bone Health

### Risk Factors for Osteoporosis

**Higher Risk:**
| Factor | Women | Men |
|--------|-------|-----|
| Sex | Higher risk overall | Lower but still significant |
| Age | Risk increases after menopause | Risk increases after 70 |
| Family history | Strong predictor | Strong predictor |
| Body frame | Small/thin frame higher risk | Small/thin frame higher risk |
| Ethnicity | White and Asian women highest risk | White and Asian men highest risk |
| Hormones | Low estrogen/early menopause | Low testosterone |
| Lifestyle | Sedentary, smoking, excess alcohol | Sedentary, smoking, excess alcohol |
| Medications | Corticosteroids, some others | Corticosteroids, some others |

### Bone Health Protection Strategies

```
BONE HEALTH CHECKLIST
=======================
NUTRITION:
  [ ] Calcium: 1000-1200 mg/day (food first, supplement if needed)
      Sources: dairy, fortified foods, leafy greens, sardines
  [ ] Vitamin D: 600-800 IU/day (1000-2000 IU commonly recommended)
      Sources: sunlight, fatty fish, fortified foods, supplements
  [ ] Adequate protein: supports bone structure
  [ ] Limit excess sodium: can increase calcium loss
  [ ] Limit excess caffeine: more than 3 cups/day may affect absorption
  [ ] Limit alcohol: more than 2 drinks/day increases fracture risk

EXERCISE (critical for bone density):
  [ ] Weight-bearing: walking, jogging, dancing, stair climbing
  [ ] Resistance training: weights, bands, body weight exercises
  [ ] Balance exercises: reduce fall risk
  [ ] Aim for 30+ minutes most days

LIFESTYLE:
  [ ] Don't smoke (or quit if you do)
  [ ] Limit alcohol
  [ ] Fall prevention at home (remove tripping hazards, good lighting)
  [ ] Regular bone density screening as recommended by doctor
```

## Heart Health Differences

### Key Differences Between Women and Men

| Factor | Women | Men |
|--------|-------|-----|
| Age of onset | Typically 10 years later than men | Earlier onset (risk rises after 45) |
| Symptoms of heart attack | May be "atypical" - fatigue, nausea, back/jaw pain, shortness of breath | More often "classic" - chest pain/pressure, left arm pain |
| Risk factors | All standard risks + pregnancy complications, autoimmune diseases, menopause | All standard risks + earlier family history threshold |
| Awareness | Women's heart disease often underdiagnosed | Generally better recognized |
| Leading cause of death | #1 for women (kills more women than all cancers combined) | #1 for men |

### Heart Attack Warning Signs

```
HEART ATTACK SIGNS - CALL 911 IMMEDIATELY
============================================

COMMON IN BOTH:
  - Chest pain, pressure, squeezing, or fullness
  - Pain radiating to arm, back, neck, or jaw
  - Shortness of breath
  - Cold sweat
  - Nausea
  - Lightheadedness

MORE COMMON IN WOMEN (may occur WITHOUT chest pain):
  - Unusual fatigue (can start days before)
  - Back or jaw pain
  - Pressure or pain in lower chest or upper abdomen
  - Nausea or vomiting
  - Shortness of breath
  - Dizziness

DO NOT wait to see if symptoms go away.
DO NOT drive yourself to the hospital.
CALL 911 immediately.
```

### Modifiable Risk Factors for Heart Disease

```
HEART HEALTH RISK ASSESSMENT
===============================
Rate your current status for each modifiable risk factor:

                          | Good | Needs Work | Concern
Blood pressure            | [ ]  | [ ]        | [ ]
  (Target: < 120/80)
Cholesterol               | [ ]  | [ ]        | [ ]
  (Get tested; know numbers)
Blood sugar               | [ ]  | [ ]        | [ ]
  (Fasting < 100 mg/dL)
Physical activity         | [ ]  | [ ]        | [ ]
  (150+ min/week moderate)
Diet quality              | [ ]  | [ ]        | [ ]
  (Fruits, vegetables, whole grains, lean protein)
Weight                    | [ ]  | [ ]        | [ ]
  (BMI 18.5-24.9 or healthy waist circumference)
Smoking status            | [ ]  | [ ]        | [ ]
  (Non-smoker is the goal)
Stress management         | [ ]  | [ ]        | [ ]
  (Active coping strategies)
Alcohol consumption       | [ ]  | [ ]        | [ ]
  (Moderate or less)
Sleep quality             | [ ]  | [ ]        | [ ]
  (7-9 hours, good quality)

Top 3 areas to improve:
1. _______________
2. _______________
3. _______________

Discuss these with your healthcare provider at your next visit.
```

## Encouraging Preventive Care

### Common Barriers and Solutions

| Barrier | Solution |
|---------|----------|
| "I feel fine, why see a doctor?" | Many conditions have no symptoms until advanced. Screening catches them early when most treatable. |
| "I can't afford it" | Community health centers offer sliding-scale fees. Many screenings are covered by insurance with no copay under the ACA. |
| "I don't have time" | Schedule annual exams like any other important appointment. Many screenings take under 30 minutes. |
| "I'm scared of what they'll find" | Early detection saves lives. Not knowing doesn't protect you. |
| "I don't have a doctor" | Start with a community health center, or ask your insurance for in-network providers. Telehealth is also an option. |
| "Men don't need to go to the doctor" | Men die younger on average partly due to underutilization of healthcare. Regular checkups are a strength, not a weakness. |

### Building a Preventive Health Routine

```
MY PREVENTIVE HEALTH PLAN
============================
Primary care provider: _______________ Phone: ___
Last checkup: ___________  Next due: ___________

Screenings due this year:
  [ ] _______________ Date scheduled: ___
  [ ] _______________ Date scheduled: ___
  [ ] _______________ Date scheduled: ___

Vaccinations due:
  [ ] Flu shot (annual)
  [ ] Other: _______________

Daily health habits:
  [ ] Physical activity: ___
  [ ] Nutrition focus: ___
  [ ] Sleep: ___
  [ ] Stress management: ___

Questions for my next doctor visit:
  1. _______________________________________________
  2. _______________________________________________
  3. _______________________________________________
```


## Output Format

```
WOMENS MENS HEALTH OUTPUT
=========================

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

**Input:** "Help me get started with womens mens health"

**Output:** A structured womens mens health plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
