---
name: hydration-planning
description: |
  Provides daily fluid intake frameworks, exercise hydration strategies, and electrolyte basics for maintaining adequate hydration. Produces a hydration schedule with intake targets, self-assessment methods, and adjustment guidelines for activity level and environmental conditions.
  Use when the user asks about how much water to drink, hydration for exercise, electrolyte basics, or building a daily hydration habit.
  Do NOT use for clinical dehydration treatment, kidney or heart condition fluid management, or specific electrolyte supplementation protocols.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "nutrition fitness guide"
  category: "health-wellness"
  subcategory: "nutrition-diet"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "beginner"
---
# Hydration Planning

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

---

## When to Use

**Use this skill when:**
- A user asks how much water they should drink per day and wants a personalized, weight-based calculation rather than the generic "8 glasses a day" rule
- A user wants a structured hydration strategy for recreational exercise -- running, cycling, strength training, team sports, hiking -- including pre-, during-, and post-exercise protocols
- A user asks when electrolytes matter, what sodium/potassium/magnesium do in the body, or how to tell if they need an electrolyte drink versus plain water
- A user wants to build a consistent daily hydration habit using habit-stacking techniques anchored to existing daily routines
- A user asks how to interpret urine color, body weight changes after exercise, or other self-monitoring signals for hydration status
- A user asks why they feel constantly thirsty, fatigued, or have frequent headaches and suspects hydration may be a factor (with clear guidance to rule out medical causes)
- A user wants to understand how environmental factors -- heat, humidity, altitude, air conditioning -- affect fluid needs
- A user asks specifically about hydration during long travel, hot weather days off, or shift work

**Do NOT use when:**
- The user has kidney disease, chronic kidney failure, or is on dialysis -- fluid restriction protocols are clinical and require a nephrologist's guidance; refer to a healthcare provider
- The user has congestive heart failure or other conditions requiring precise fluid balance management -- daily fluid limits in these patients can be life-critical; refer to a cardiologist
- The user describes symptoms of severe dehydration: no urination for 8+ hours, sunken eyes, extreme confusion, rapid heart rate, inability to keep fluids down -- this is a medical emergency; direct them to emergency services
- The user asks for specific electrolyte supplement dosing protocols for clinical hyponatremia, hypernatremia, or other electrolyte disorders -- use the **clinical-electrolyte-management** skill or refer to a physician
- The user is asking about IV hydration, oral rehydration therapy (ORT) for illness-related dehydration (gastroenteritis, cholera), or rehydration after major surgery -- these require clinical judgment
- The user is a competitive endurance athlete seeking race-day sodium loading strategies or individualized sweat-rate testing -- this requires sports science lab methodology; refer to the **endurance-athlete-nutrition** skill
- The user is pregnant or breastfeeding and has specific fluid concerns beyond general guidance -- refer to an OB/GYN or registered dietitian

---

## Process

### Step 1: Gather Key Context Before Calculating Anything

Do not jump to calculations without collecting the following. Ask conversationally if the user has not already provided it:

- **Body weight:** Required for the mL/kg baseline formula. If the user declines or doesn't know, use a population-average assumption (70 kg / 154 lbs for adults) and flag the assumption clearly.
- **Activity level and type:** Sedentary (desk job, minimal exercise), lightly active (1-3 days/week light exercise), moderately active (3-5 days/week, 30-60 min sessions), very active (6-7 days/week, 60+ min sessions), or athlete (2+ sessions/day).
- **Exercise modality:** Endurance cardio (running, cycling, rowing) generates far more sweat than strength training or yoga. The type matters for sweat-rate estimation.
- **Climate zone and season:** Temperate (18-22°C / 64-72°F), hot-dry (desert, >32°C / 90°F), hot-humid (tropical, >32°C with >70% humidity), cold-dry (winter conditions, heated indoor environments), or high altitude (>2,500 m / 8,200 ft).
- **Current intake habits:** How much do they actually drink? This reveals the gap to close and helps calibrate the habit plan.
- **Caffeinated beverages:** Number of cups of coffee, tea, or energy drinks per day. Moderate consumption (up to 400 mg caffeine / ~4 cups of brewed coffee) does not cause net dehydration and counts toward fluid totals.
- **Diet quality:** High fruit and vegetable intake increases food-derived fluid (up to 25-30% of total intake). Low produce intake means beverages must cover more.
- **Special contexts:** Night-shift work, extended travel, high-altitude environments, or physically demanding outdoor occupations each add complexity.

### Step 2: Calculate the Baseline Daily Fluid Intake Target

Use the established clinical formula as the starting point, then layer in modifiers:

**Base formula:**
- 30-35 mL per kg of body weight per day for sedentary to lightly active adults
- This represents total fluid from all sources -- beverages plus food (food typically contributes 750-1,000 mL/day for adults eating a balanced diet)
- To isolate beverage needs: subtract ~750-1,000 mL from the total target

**Worked formula example:**
- User weighs 80 kg (176 lbs)
- Baseline: 80 kg × 32 mL = 2,560 mL total fluid
- From beverages: 2,560 - 800 = ~1,760 mL (~60 oz) from drinks on sedentary days

**Activity multipliers (add to baseline beverages, not total fluid):**
- Lightly active (30 min low-intensity exercise): add 300-400 mL on training days
- Moderately active (30-60 min moderate intensity): add 500-750 mL on training days
- Very active (60-90 min vigorous exercise): add 750-1,200 mL on training days
- High-intensity 90+ min sessions: add 1,000-1,500 mL; electrolytes become essential

**Environmental modifiers (add to daily total, independent of exercise):**
- Hot-dry climate: add 500-1,000 mL/day above baseline
- Hot-humid climate: add 500-750 mL/day (humidity impairs evaporative cooling, increasing sweat burden)
- Cold-dry environments with heated indoor air: add 250-500 mL/day (respiratory fluid loss increases, thirst perception decreases)
- High altitude above 2,500 m: add 500-1,000 mL/day (increased respiratory rate and reduced thirst perception are both documented at altitude)

**The "8 glasses a day" rule:** This originated from a 1945 US Food and Nutrition Board recommendation that was widely misinterpreted. The original statement noted that most of the required fluid was already contained in food. The weight-based formula is more accurate and individually calibrated. Do not present "8 glasses" as a scientific target.

### Step 3: Build the Exercise Hydration Protocol

Treat exercise hydration as three distinct phases with separate targets and different fluid compositions:

**Pre-exercise hydration (the most neglected phase):**
- Goal: arrive at exercise euhydrated (normal body water), not try to catch up during the session
- 2-4 hours before: 5-7 mL/kg body weight (for an 80 kg person: 400-560 mL / 14-19 oz)
- 10-20 minutes before: an additional 200-300 mL if urine is still dark after the 2-4 hour drink
- Urine should be pale yellow before beginning exercise -- if it isn't, the pre-exercise window was missed and the person started the session already behind

**During exercise -- the rate equation:**
The goal is to replace sweat losses without exceeding them. The American College of Sports Medicine (ACSM) guideline: drink enough to prevent more than 2% body weight loss, but do not drink so much that body weight increases during exercise (hyponatremia risk).

- Practical rate for most recreational exercisers: 400-800 mL per hour (150-200 mL every 15-20 minutes)
- Use the lower end (400-500 mL/hr) for: cool conditions, low-intensity exercise, shorter sessions, smaller-framed individuals
- Use the upper end (700-800 mL/hr) for: hot-humid conditions, high-intensity exercise, larger body mass, high sweat-rate individuals
- Drink on a schedule during intense exercise -- thirst lags behind physiological fluid need by 15-20 minutes at high intensities; waiting for thirst means you're already 1-1.5% dehydrated

**Session duration determines fluid composition:**
- Under 45 minutes at moderate intensity: water only, no electrolytes needed
- 45-60 minutes in cool conditions: water remains sufficient for most people
- 45-60 minutes in heat or humidity: small amount of sodium (200-300 mg) beneficial to support fluid retention
- 60-90 minutes any conditions: sodium-containing fluid recommended (300-600 mg sodium per hour)
- Over 90 minutes especially in heat: full electrolyte replacement critical (sodium 500-1,000 mg/hr, potassium 100-200 mg/hr)

**Post-exercise rehydration:**
- Weigh yourself before and after exercise (in minimal clothing, after toweling off sweat)
- Each 1 kg of body weight lost equals approximately 1 liter of fluid deficit
- Rehydrate at 1.5x the amount lost over the 4-6 hours following exercise (the 1.5x multiplier accounts for ongoing urine losses during recovery)
- Example: lost 0.8 kg during a run -- drink 1.2 liters (40 oz) over the next 4-6 hours
- If weighing is not practical: monitor urine color and drink to achieve pale yellow within 2-3 voids post-exercise
- For prolonged or very hot sessions, include sodium in the recovery drink or eat a salty snack (crackers, pretzels, soup) to stimulate thirst and support fluid retention -- drinking plain water in large volumes post-exercise without sodium can paradoxically suppress thirst before full rehydration occurs

### Step 4: Explain Electrolyte Basics with Practical Thresholds

Electrolytes are minerals that carry an electrical charge and regulate fluid movement between body compartments. Provide this context before the numbers:

**Sodium (Na+) -- the critical one:**
- Primary electrolyte in extracellular fluid; controls where water goes in the body
- Typical sweat sodium concentration: 460-1,150 mg per liter of sweat (average ~900 mg/L, but there is enormous individual variation -- "salty sweaters" can lose 1,500+ mg/L)
- Signs of low sodium need: muscle cramps during prolonged exercise, feeling bloated while drinking, hyponatremia symptoms (nausea, headache, confusion) after long events where large volumes of plain water were consumed
- Daily recommended intake for adults: 1,500-2,300 mg (from all food and beverage sources)
- Exercise replacement guideline: 300-600 mg sodium per hour of exercise beyond 60 minutes; up to 1,000-1,500 mg/hr for high-intensity exercise in extreme heat or for documented salty sweaters

**Potassium (K+):**
- Primary intracellular electrolyte; involved in muscle contraction and nerve signaling
- Sweat losses are relatively low: 120-225 mg per liter of sweat
- Adequate intake (AI): 2,600 mg/day for adult women, 3,400 mg/day for adult men
- Dietary sources cover needs for nearly all recreational exercisers: one medium banana provides ~420 mg, one medium baked potato with skin ~925 mg, half an avocado ~345 mg
- Specific potassium supplementation is rarely needed outside of prolonged multi-day endurance events

**Magnesium (Mg2+):**
- Involved in over 300 enzymatic reactions including energy metabolism and muscle relaxation
- Sweat loss is modest but cumulative in high-volume training
- RDA: 310-420 mg/day depending on age and sex
- Best dietary sources: pumpkin seeds (156 mg/oz), dark chocolate (64 mg/oz), almonds (76 mg/oz), spinach (157 mg per cooked cup), black beans (60 mg per half cup)
- Magnesium deficiency is more common than potassium deficiency in athletes who restrict food intake or eat low-variety diets

**Chloride, phosphate, bicarbonate:** Lost in sweat in smaller amounts; adequately covered by normal dietary sodium and food variety. Not relevant for planning recreational exercise hydration.

**The practical decision tree for electrolytes:**
- Exercise under 60 min, any intensity: water only
- Exercise 60-90 min, cool conditions, moderate intensity: water plus a salty snack after
- Exercise 60-90 min, hot or humid: electrolyte-containing fluid during exercise
- Exercise over 90 min: always include sodium in the fluid plan, regardless of temperature

### Step 5: Provide a Self-Assessment Monitoring System

Teach the user a layered monitoring approach with three methods in order of practicality:

**Method 1 -- Urine Color (WUT scale: Well-hydrated, Underhydrated, Thirsty):**
- Color 1-2 (pale straw/lemonade yellow): well hydrated -- maintain current intake
- Color 3-4 (medium yellow): mild underhydration -- add 300-500 mL over the next 2-3 hours
- Color 5-6 (dark yellow/amber like apple juice): significant underhydration -- drink 500-750 mL promptly and investigate why
- Color 7-8 (orange/brown): potentially concentrated dehydration -- hydrate carefully and monitor; brown/very dark urine unrelated to beets or B vitamins warrants medical evaluation
- Colorless: likely overhydrated -- skip the next planned drinking occasion; not dangerous acutely but sustained overhydration dilutes electrolytes
- **Caveats:** Multivitamins (especially B2/riboflavin) artificially brighten urine to vivid yellow regardless of hydration. First morning void is naturally concentrated and not representative of overall status. Beets and blackberries cause reddish discoloration.

**Method 2 -- Pre/Post Exercise Weight:**
- Most objective field method available outside a sports science lab
- Equipment: same scale, same time of day (or same protocol: minimal clothing, after drying off sweat), same conditions
- Less than 1% body weight lost: optimal exercise hydration
- 1-2% body weight lost: mild dehydration; expect reduced aerobic performance (roughly 5-8% VO2 drop at 2% dehydration)
- 2-3% body weight lost: moderate dehydration; thirst is strong, performance measurably impaired, use as trigger to review pre-exercise and during-exercise protocols
- Over 3% body weight lost: significant dehydration; this is a planning failure -- the pre-exercise and during-exercise protocol needs substantial revision
- Weight gain during exercise: a warning sign of hyponatremia risk from drinking too much plain water; more common in slower endurance athletes who over-drink

**Method 3 -- Thirst and Physical Signals:**
- Thirst for daily hydration: reliable enough for most adults in non-exercise contexts. Research shows the thirst mechanism, when not blunted by age or medication, keeps healthy adults within 0.5-1% of optimal hydration.
- Thirst during exercise: unreliable -- use scheduled drinking instead
- Early dehydration signals: dry lips/mouth, slight headache, reduced urine frequency (less than 4 voids in an 8-hour waking day), mild fatigue without sleep cause
- Moderate dehydration signals: headache, difficulty concentrating, reduced physical performance, muscle fatigue out of proportion to effort
- Thirst blunting conditions: aging (thirst sensitivity decreases significantly after age 65), certain antihistamines and antidepressants, high-altitude exposure

### Step 6: Build the Daily Hydration Schedule Using Habit Anchors

The best hydration schedule is one that requires no willpower -- it attaches to existing behavioral cues. Use habit-stacking methodology:

**Anchor points in the typical day:**
- Wake up: 300-500 mL before coffee. The body loses 300-500 mL overnight through respiration and perspiration, making morning the most consistent underhydrated moment of the day. A glass of water before the coffee maker finishes is the single highest-leverage habit change.
- With each meal: 250-350 mL. Eating naturally creates a pause and social permission to drink; using this anchor takes zero additional behavior change.
- Exercise transitions: pre-exercise drink (habit anchor: when changing into workout clothes), post-exercise drink (habit anchor: entering the shower/locker room)
- Desk/work: Keeping a large (750 mL / 25 oz) water bottle visible on the desk is consistently more effective than reminder apps for most sedentary workers -- the visual cue is continuous, reminder fatigue sets in quickly
- Pre-bedtime taper: taper fluid after dinner to reduce nocturia (waking for bathroom trips). Anyone who wants to reduce overnight bathroom trips should stop drinking within 90-120 minutes of sleep, but must ensure afternoon intake was adequate to prevent a net daily deficit.

**Spacing guidance:**
- Distribute intake across 6-8 occasions throughout the day -- gut absorption rate peaks at about 400-600 mL per hour; consuming more than 800 mL in one bolus results in significant urinary losses with minimal net retention
- Large single volumes are not only inefficient but can create discomfort (gastric distension) and in rare cases at very high volumes (3-4 liters at once) can cause acute hyponatremia
- Front-load toward the first two-thirds of the day for better absorption and sleep quality

**For shift workers and irregular schedules:**
- Anchor hydration to shift transitions, meal breaks, and task checkpoints rather than clock times
- Night-shift workers in heated or physically demanding environments are at higher risk of chronic mild dehydration because the sensation of thirst is mildly suppressed in the body's biological night hours

### Step 7: Provide Adjustment Guidelines and a Review Framework

Hydration needs are not static. Provide a framework for recalibrating:

**When to increase intake from baseline:**
- Any increase in exercise volume or intensity (add 500 mL per additional 30 minutes of vigorous activity)
- Temperature rises above 28°C / 82°F: add 250-500 mL/day
- Fever: general guidance is 200-300 mL per degree C above 37°C (per hour of fever), though this is a wellness estimate -- prolonged fever with dehydration warrants medical care
- High-altitude travel above 2,500 m: add 500-750 mL/day for the first 3-5 days of acclimatization
- Increased caffeine intake above 400 mg/day: modest additional fluid may offset mild diuretic effect, though evidence shows adaptation occurs within days of regular caffeine use
- Spicy or very salty diet: may increase sweat and thirst; monitor urine color and adjust

**When to decrease intake from baseline:**
- Sedentary period (injury, illness rest): reduce activity adjustment, maintain baseline
- Cool or cold weather with low activity: lower end of the 30-35 mL/kg range is appropriate
- High fruit and vegetable diet: food-derived fluid may be 1,000-1,200 mL/day, reducing beverage requirements by 200-400 mL relative to a low-produce diet

**Two-week recalibration check:**
After the first two weeks, review: Is urine consistently pale yellow by mid-morning? Does energy feel stable through the day? Any persistent headaches? Are habit anchors being consistently used? Adjust quantities up or down in 250 mL increments based on monitoring signals rather than making large sudden changes.

### Step 8: Generate the Final Hydration Plan Output

Compile all calculations and guidance into the structured output format below. Always include:
- Numerical targets (in both mL and oz)
- Day-type distinction (rest day vs. training day)
- Exercise protocol table if applicable
- Self-assessment reference
- Electrolyte notes relevant to this specific user's training duration and conditions
- 2-3 key habit anchors most relevant to their described routine

---

## Output Format

```
## Hydration Plan: [User Profile -- e.g., "Recreational Cyclist, 72 kg, Hot Climate"]

> **Health Disclaimer:** This plan provides general wellness guidance only. It is not
> medical advice. Consult a healthcare professional for any medical conditions affecting
> fluid balance.

---

### Calculated Targets

| Metric                         | Value                              |
|--------------------------------|------------------------------------|
| Body weight                    | [X kg / X lbs]                     |
| Baseline formula               | [X kg × 32 mL = X mL/day total]    |
| Estimated food-derived fluid   | ~800 mL/day                        |
| Baseline beverage target       | [X mL / X oz] on rest days         |
| Activity adjustment            | +[X mL / X oz] per training session|
| Climate adjustment             | +[X mL / X oz] daily               |
| Training day total (beverages) | [X mL / X oz]                      |

---

### Daily Hydration Schedule -- Rest Day

| Time Window        | Amount              | Habit Anchor                       | Notes                          |
|--------------------|---------------------|-------------------------------------|--------------------------------|
| Wake-up (first act)| [X mL / X oz]       | Before turning on phone/coffee      | Replaces overnight losses      |
| Breakfast          | [X mL / X oz]       | With meal                           |                                |
| Mid-morning        | [X mL / X oz]       | Large bottle visible at workspace   | Sip; don't chug                |
| Lunch              | [X mL / X oz]       | With meal                           |                                |
| Early afternoon    | [X mL / X oz]       | Bottle refill after lunch           |                                |
| Late afternoon     | [X mL / X oz]       | Before dinner prep                  |                                |
| Dinner             | [X mL / X oz]       | With meal                           |                                |
| Evening            | [X mL / X oz]       | Last drink 90-120 min before bed    | Taper to reduce nocturia       |
| **Daily total**    | **[X mL / X oz]**   |                                     |                                |

---

### Exercise Hydration Protocol -- Training Day

| Phase            | Timing                | Amount                 | Fluid Type                    | Notes                                     |
|------------------|-----------------------|------------------------|-------------------------------|-------------------------------------------|
| Pre-exercise     | 2-4 hours before      | [X mL / X oz]          | Water                         | Check urine is pale yellow before session |
| Pre-exercise top-up| 10-20 min before    | 200 mL (7 oz) if needed| Water                         | Only if urine was still dark              |
| During exercise  | Every 15-20 min       | [X mL / X oz per hr]   | [Water / electrolyte drink*]   | Drink on schedule, not only when thirsty  |
| Post-exercise    | First 30 min          | [X mL / X oz]          | [Water / electrolyte drink*]   | Replace 1.5x weight lost                 |
| Post-exercise    | Over next 4-6 hrs     | [X mL / X oz]          | Water + salty snack if >60min | Spread; avoid large boluses               |

*Electrolyte drink recommended for sessions exceeding 60 minutes or any session in heat/humidity.

---

### Electrolyte Guidelines

| Session Duration       | Conditions          | Sodium Recommendation                     |
|------------------------|---------------------|-------------------------------------------|
| Under 45 min           | Any                 | Water only; no electrolyte supplement needed |
| 45-60 min              | Cool                | Water; salty snack post-session sufficient |
| 45-60 min              | Hot or humid        | Add 200-300 mg sodium during or after     |
| 60-90 min              | Any                 | 300-500 mg sodium/hr during exercise      |
| Over 90 min            | Any                 | 500-1,000 mg sodium/hr; include potassium |

Potassium and magnesium for this activity level: covered by a varied diet including fruits,
vegetables, nuts, and whole grains. No supplementation needed for recreational training volumes.

---

### Self-Assessment Reference

| Method               | Optimal Signal            | Action Needed                              |
|----------------------|---------------------------|--------------------------------------------|
| Urine color (mid-day)| Pale straw/lemonade yellow| Maintain plan                              |
| Urine color (dark)   | Apple juice / amber       | Add 500 mL spread over next 2-3 hours      |
| Urine color (clear)  | Colorless                 | Skip next drinking occasion; add electrolytes if prolonged |
| Pre/post weight loss | Under 1% body weight      | Exercise hydration is optimal              |
| Pre/post weight loss | 1-2% body weight          | Increase during-exercise intake next session|
| Pre/post weight loss | Over 2% body weight       | Revise full pre+during+post protocol       |
| Thirst (rest day)    | Occasional                | Normal; drink when thirsty                 |
| Thirst (exercise)    | Avoid relying on this     | Use schedule; thirst lags 15-20 min at intensity |

---

### Key Habit Anchors (Your Priority Habits)

1. [Most important anchor for this user -- e.g., "500 mL glass before coffee every morning"]
2. [Second anchor -- e.g., "750 mL bottle always visible at desk, refill at lunch"]
3. [Exercise anchor -- e.g., "Pre-run drink when putting on running shoes; post-run drink entering shower"]

---

### 2-Week Review Checklist

- [ ] Urine consistently pale yellow by 10 AM most days
- [ ] No persistent afternoon headaches or unexplained fatigue
- [ ] Habit anchors used consistently (>5 of 7 days)
- [ ] Post-exercise weight loss under 1.5% on most training days
- [ ] Adjustments made for any heat events or travel

If any boxes are unchecked, increase intake in 250 mL increments at the unchecked phase.
```

---

## Rules

1. **Always present the disclaimer before delivering any plan.** The disclaimer must appear at the top of the output, not buried at the end.

2. **Never give a single hard number as the daily fluid target.** Always present a range (e.g., 2,200-2,600 mL) and explicitly state that individual sweat rates, metabolic rates, diet composition, and environmental exposure create meaningful variation. A single number implies false precision.

3. **Distinguish total fluid from beverage fluid in every calculation.** Food contributes approximately 750-1,000 mL/day for adults eating a balanced mixed diet, up to 1,200 mL for high fruit-and-vegetable consumers, and as little as 500 mL for highly processed low-moisture diets. Failing to note this distinction causes users to systematically over-drink when food intake is high.

4. **Never recommend specific electrolyte supplement products, specific brands of sports drinks, or specific electrolyte tablet brands.** Describe what the product should contain (sodium concentration, osmolality range) so the user can evaluate options themselves. Commercially available sports drinks and electrolyte products vary widely in sodium content (some as low as 20 mg/serving, some appropriate at 300+ mg/serving) -- teach the user to read labels rather than depend on brand guidance.

5. **Always include the overhydration and hyponatremia warning when discussing exercise hydration.** Exercise-associated hyponatremia (EAH) kills more marathon runners than exercise-associated dehydration. The risk is concentrated among slower endurance athletes (4+ hour marathon finish times) who drink water aggressively throughout an event and sweat relatively less due to lower exercise intensity. Hyponatremia warning signs: nausea, headache, confusion, bloating, unusual fatigue disproportionate to effort -- these require medical evaluation, not more water.

6. **Electrolyte guidance must be gated by exercise duration and conditions.** Sessions under 45 minutes at any intensity in normal temperatures: water only. Sessions 45-60 minutes in heat: modest sodium consideration. Sessions over 60 minutes: sodium replacement actively recommended. Sessions over 90 minutes in heat: structured electrolyte protocol required. Do not apply the 90+ minute electrolyte guidance to 45-minute workouts -- it creates unnecessary complexity and can lead to excess sodium or sugar intake.

7. **Always include the pre/post exercise weigh-in method as the gold standard self-assessment for anyone exercising more than 3 times per week at moderate+ intensity.** Urine color alone is insufficient for optimizing athletic performance -- it is reliable for catching significant dehydration but not sensitive enough to detect the 1-2% losses that measurably impair aerobic performance.

8. **Never claim that drinking more water cures, treats, prevents, or reverses any specific medical condition** -- including but not limited to: kidney stones, urinary tract infections, constipation, skin conditions, cognitive decline, or weight loss. The evidence supporting water intake for kidney stone risk reduction is one of the stronger associations but still requires appropriate medical framing.

9. **Distribute the daily schedule across 6-8 occasions with no single bolus exceeding 600 mL.** The gut can absorb approximately 400-600 mL per hour under normal conditions. Drinking 1.5 liters at once generates rapid urinary losses, defeating the purpose. Large bolus intake is also associated with transient hyponatremia in sensitive individuals.

10. **Flag any symptoms of severe dehydration or clinical conditions immediately and redirect to emergency services or healthcare.** Warning phrases to trigger medical escalation: "haven't urinated in 8+ hours," "extremely confused," "fainted," "can't keep any fluids down," "heart racing," "severe muscle cramps that won't release." These are medical presentations, not hydration planning scenarios.

11. **Adjust guidance for age-specific considerations.** Adults over 65 have demonstrably impaired thirst sensation and are at disproportionate risk for chronic mild dehydration -- their plan should be schedule-based, not thirst-based, with explicit instruction not to rely on thirst. Children and adolescents have higher surface-area-to-mass ratios and are more vulnerable to heat-related dehydration during exercise.

12. **Do not conflate sweat rate variation with pathology.** Sweat rate varies by 3-4 fold among normal healthy adults (0.5 L/hr to 2.0 L/hr under similar conditions). High sweat rate individuals are not sick; they need more sodium and fluid per session. Acknowledge this variation when the user reports surprising weight losses after exercise or persistent dehydration despite following general guidelines.

---

## Edge Cases

### User Is Over 65 or Reports Not Feeling Thirsty Even When Likely Dehydrated
Age-related decline in thirst sensitivity is well-documented beginning around age 65 and becomes progressively more pronounced. These users must use a schedule-based plan, not a thirst-based one. The morning urine color check becomes especially important as their primary monitoring tool since thirst cannot be trusted. Increase the number of scheduled drinking occasions to 7-9 per day in smaller volumes (200-250 mL each). Ensure the schedule does not front-load so heavily that evening fluid is insufficient -- older adults are also at higher fall risk with nocturia, so the evening taper is genuinely important.

### User Drinks Primarily Coffee, Tea, or Other Caffeinated Beverages
The myth that coffee and tea "don't count" toward hydration is medically outdated. Moderate caffeine (up to 400 mg/day, approximately 4 cups of drip coffee) produces a mild, transient diuretic effect but the net fluid balance from consuming a caffeinated beverage is positive -- you retain more fluid than you lose. Regular caffeine consumers develop tolerance to even the mild diuretic effect within 3-4 days of consistent use. Caffeinated beverages count fully toward the daily fluid target. However: caffeinated beverages are not appropriate for intra-exercise hydration for most people (GI distress risk, palatability issues), and the diuretic effect is more pronounced at intakes above 600 mg/day -- flag this if the user is reporting 6+ cups daily.

### User Exercises Outdoors in Extreme Heat (Above 35°C / 95°F) or High Humidity (Above 80%)
Sweat rates can reach 1.5-2.5 liters per hour in these conditions for moderately to highly fit individuals. Standard hydration recommendations do not scale linearly to these conditions. Guidance:
- Pre-exercise hyperhydration strategy: 600-750 mL in the 2-4 hours before, plus 200-300 mL in the final 15 minutes (the upper limit of the standard range)
- During-exercise rate: target the upper end of the 600-800 mL/hr range; experienced exercisers in extreme heat may need 800-1,000 mL/hr but this should be coupled with 500+ mg sodium/hr to prevent hyponatremia from dilution
- Mandatory sodium supplementation for any session over 45 minutes in these conditions
- Session length recommendation: limit unsupported outdoor exercise to 60-75 minutes in extreme heat; beyond this, sweat losses and thermoregulatory demands exceed what practical on-the-body hydration can cover
- Post-exercise: aggressive rehydration at 1.5x weight loss, with sodium-containing food or fluid, within 30 minutes

### User Wants to Reduce Frequent Nighttime Urination (Nocturia)
This is one of the most common complaints from users trying to follow higher daily intake targets. The solution is redistribution, not reduction:
- Goal: consume 80% of daily fluid before 5 PM, with the final 20% spread through the evening and tapering by 90-120 minutes before sleep
- Specifically: 500 mL at wake, 500-600 mL during morning, 400-500 mL at lunch and early afternoon, 300-400 mL in mid-afternoon, then only 250-400 mL with dinner and afterward
- If the user currently under-drinks during the day and compensates at night -- the most common pattern -- evening tapering will feel very uncomfortable until the morning/afternoon intake habit is established
- Note: persistent nocturia (3+ times per night) despite appropriate fluid distribution warrants medical evaluation to rule out conditions unrelated to fluid intake (e.g., benign prostatic hyperplasia, overactive bladder, sleep apnea-related fluid shifts)

### User Is Traveling at High Altitude (Above 2,500 m / 8,200 ft)
Altitude presents a unique multi-mechanism dehydration challenge:
- Increased respiratory water loss: breathing rate increases to compensate for lower oxygen partial pressure; each breath at altitude loses more water vapor due to the cold, dry air typical of high-altitude environments
- Reduced thirst sensation: despite greater fluid need, the perception of thirst is blunted at altitude
- Diuresis: in the first 24-48 hours, the body compensates for altitude by excreting bicarbonate to manage respiratory alkalosis (increased breathing); this process increases urine output
- Practical guidance: drink 500-750 mL above baseline daily during the first 3-5 days of acclimatization regardless of thirst; continue monitoring urine color; altitude headache that responds to hydration is common in the first 1-3 days -- headache that worsens or is accompanied by confusion or ataxia requires medical evaluation to rule out acute mountain sickness

### User Has Previously Had Heat Illness (Heat Exhaustion or Heat Stroke)
Prior heat illness increases susceptibility to future episodes -- this is physiologically documented. The user's hydration plan should be conservative:
- Always use the upper end of environmental and exercise adjustment ranges
- Pre-exercise hydration is non-negotiable, not optional, for these individuals
- Session length should be reduced and recovery time extended in warm conditions
- The user should always have a designated hydration partner or check-in system for solo outdoor exercise
- Any recurrence of symptoms during exercise (nausea, dizziness, cessation of sweating despite heat, confusion) is a medical emergency -- stop activity immediately, move to shade, apply cool water to skin, call for help

### User Exercises at Very High Volumes (2+ Hours Daily, 6+ Days per Week)
Standard recreational formulas under-estimate needs for serious amateur athletes significantly. Key adjustments:
- The 30-35 mL/kg baseline does not account for large daily energy expenditure -- use 40-45 mL/kg as the baseline when training volume exceeds 10 hours per week
- Cumulative daily sweat loss across multiple sessions can reach 4-6 liters for endurance athletes training in warm environments
- Electrolyte management shifts from reactive to proactive -- these users should assess electrolyte intake as a daily planning concern, not only during long sessions
- Chronic low-grade dehydration is a documented performance limiter in high-volume athletes; if the user reports persistent mid-afternoon fatigue, heavy training feelings, declining performance, poor sleep, or dark morning urine despite drinking what feels like a lot -- systematically document intake and output for 3 days to identify the gap
- Referral to a registered sports dietitian is appropriate for users training at this volume; hydration cannot be effectively planned in isolation from total energy and carbohydrate intake

---

## Example

**User Input:** "I'm 68 kg, I work a desk job and go to an indoor cycling class 4 mornings a week (55 minutes per class). I live in Phoenix, Arizona. I currently drink about 4-5 cups of coffee a day and maybe one or two glasses of water. I keep getting afternoon headaches."

**Analysis before output:**
- Weight: 68 kg (150 lbs)
- Baseline: 68 × 32 mL = 2,176 mL total daily fluid; subtract ~800 mL food-derived = ~1,376 mL beverages on rest days
- Activity: 55-min indoor cycling, 4x/week -- aerobic, moderate-high intensity; indoor but vigorous sweat expected; duration is just under the 60-min threshold but intensity warrants sodium consideration, especially given heat climate
- Climate: Phoenix is hot-dry climate (summer ambient temperatures 38-45°C; even with indoor cycling, commute and daily outdoor exposure increases daily fluid loss and ambient dehydration risk significantly); add 500-750 mL/day to baseline
- Current intake: 4-5 cups coffee (~800-1,000 mL) + 2 glasses water (~500 mL) = ~1,300-1,500 mL total -- counting only beverages and excluding food. This is 600-900 mL below even the conservative baseline need before climate adjustment.
- Afternoon headaches: classic mild-to-moderate dehydration symptom; the pattern of front-loading caffeine (diuretic at high doses, though net positive at this amount) and under-hydrating through the day is the likely driver
- Coffee: 4-5 cups (~400-500 mg caffeine) is at the upper limit of moderate intake; net fluid positive, counts toward total, but has mild diuretic nudge that makes water replacement more important

---

**Output:**

## Hydration Plan: Desk Worker / Indoor Cyclist, 68 kg, Phoenix AZ

> **Health Disclaimer:** This plan provides general wellness guidance only and is not medical advice. If your headaches are severe, persistent, associated with visual changes or neck stiffness, or not resolved by improving hydration, consult a healthcare professional.

---

### Calculated Targets

| Metric                         | Value                                      |
|--------------------------------|--------------------------------------------|
| Body weight                    | 68 kg (150 lbs)                            |
| Baseline formula               | 68 × 32 mL = 2,176 mL total fluid/day      |
| Estimated food-derived fluid   | ~800 mL/day (mixed diet)                   |
| Baseline beverage target       | ~1,400 mL (47 oz) on rest days             |
| Hot-dry climate adjustment     | +600 mL/day (Phoenix summer baseline)       |
| Cycling session adjustment     | +600-750 mL per session day                |
| Rest day target (beverages)    | ~2,000 mL (68 oz) -- includes climate adj  |
| Cycling day target (beverages) | ~2,600-2,750 mL (88-93 oz)                 |
| Current estimated intake       | ~1,300-1,500 mL/day (600-700 mL deficit)   |

**Your afternoon headaches are almost certainly connected to this deficit.** Your current intake of coffee and minimal water is meeting roughly 60-65% of your need before the Phoenix climate adjustment is factored in. The good news: this is straightforward to fix by redistributing drinking throughout the day.

**Note on your coffee:** 4-5 cups per day counts fully toward your fluid total -- at this level, coffee is net hydrating. You don't need to cut back on coffee. You do need to add water alongside it.

---

### Daily Hydration Schedule -- Rest Day (Target: ~2,000 mL / 68 oz)

| Time Window           | Amount              | Habit Anchor                           | Notes                                     |
|-----------------------|---------------------|----------------------------------------|-------------------------------------------|
| Wake-up (first act)   | 500 mL (17 oz)      | Large glass before turning on phone    | Highest-leverage single habit change      |
| First coffee          | Count ~250 mL       | Already happening -- note it counts    | Contributes to daily total                |
| Mid-morning           | 400 mL (13 oz)      | 750 mL bottle visible on desk          | Refill becomes the mid-day anchor         |
| Lunch                 | 300 mL (10 oz)      | With lunch                             | Water, not additional coffee here         |
| Early afternoon       | 350 mL (12 oz)      | Bottle refill immediately after lunch  | Front-loading to prevent the 2-3 PM crash |
| Second coffee window  | Count ~250 mL       | Already happening                      | Limit to 1 coffee in afternoon            |
| Dinner                | 300 mL (10 oz)      | With dinner                            |                                           |
| Evening               | 200 mL (7 oz)       | 90 minutes before bed at latest        | Taper to protect sleep                    |
| **Daily total**       | **~1,950-2,050 mL** |                                        | Meets target with food fluid              |

---

### Cycling Day Hydration Protocol (Target: ~2,600-2,750 mL / 88-93 oz)

| Phase                | Timing                  | Amount               | Fluid Type                          | Notes                                           |
|----------------------|-------------------------|----------------------|-------------------------------------|-------------------------------------------------|
| Pre-workout wake     | First thing AM          | 500 mL (17 oz)       | Water                               | Do this before coffee; ride is in the AM        |
| Pre-exercise         | 30-45 min before class  | 350 mL (12 oz)       | Water                               | Check urine is pale yellow before leaving       |
| During cycling class | Every 15-20 min         | 150-200 mL per interval| Water                             | ~600-750 mL total across 55-min class           |
| Post-exercise        | Within 30 min of class  | 400-500 mL (16 oz)   | Water + salty snack (crackers/pretzels) | 55-min class in Phoenix warrants sodium         |
| Post-exercise cont.  | Over next 2-3 hours     | 400 mL (13 oz)       | Water                               | Spread it; don't drink it all at once           |
| Rest of day          | Per rest-day schedule   | ~1,000-1,100 mL      | Water + coffee as per rest day plan |                                                 |
| **Cycling day total**| **~2,650-2,800 mL**     |                      |                                     | On target                                       |

**Why a salty snack after your cycling class?** A 55-minute vigorous cycling class in a hot climate environment -- especially Phoenix, where heat exposure begins before and after class -- means meaningful sodium loss in sweat. Drinking water post-exercise without sodium can temporarily suppress thirst before you're fully rehydrated. Adding salt to the equation retains the water you're drinking. A small handful of pretzels, salted nuts, or crackers with your post-ride drink costs nothing and makes a measurable difference.

---

### Electrolyte Guidelines for Your Training

| Session Duration           | Conditions         | Recommendation                                                     |
|----------------------------|--------------------|--------------------------------------------------------------------|
| 55-min indoor cycling      | Indoor (AC)        | Water during; salty snack within 30 min after class               |
| 55-min cycling, heat exposure around session | Phoenix summer | Add 200-300 mg sodium post-ride; monitor if cramping occurs |
| If you extend sessions to 75+ min | Any       | Include sodium-containing fluid during class (look for 150-300 mg sodium per 500 mL serving) |

Your potassium and magnesium needs are met by a balanced diet. One banana or a serving of leafy greens most days covers it at your training volume.

---

### Self-Assessment Reference

| Method                   | Optimal Signal              | What to Do                                        |
|--------------------------|-----------------------------|---------------------------------------------------|
| Urine color at wake      | Medium to dark yellow       | Normal; drink 500 mL immediately (expected)       |
| Urine color mid-morning  | Pale straw / lemonade       | On track -- maintain plan                         |
| Urine color mid-afternoon| Pale yellow                 | Afternoon hydration is working                    |
| Urine color (amber/dark) | Any time outside of wake    | Add 400-500 mL over the next 90 minutes           |
| Afternoon headache check | None by week 2              | Hydration gap is closed                           |
| Post-cycling weight loss | Under 0.7 kg (1.5 lbs)      | Exercise hydration is adequate                    |
| Post-cycling weight loss | 1-1.5 kg (2-3 lbs)          | Increase during-class intake to upper range       |

---

### Your Priority Habit Anchors (Start Here -- Pick These Three First)

1. **500 mL glass of water before your first coffee, every morning.** This is the single change most likely to reduce your afternoon headaches within 5-7 days. The overnight deficit is the root of your pattern.
2. **750 mL visible water bottle on your desk, refilled at lunch.** Visual cue beats reminder apps. Two fills of this bottle covers your desk-hour target without any tracking.
3. **Post-cycling: water + salty snack within 30 minutes of finishing class.** Add this to your existing post-workout transition (changing, showering) -- it costs 3 minutes and closes the gap your body is already signaling through fatigue.

---

### 2-Week Review Checklist

- [ ] Urine pale yellow by 10 AM on most mornings (at least 5 of 7 days)
- [ ] Afternoon headaches reduced or eliminated by Day 7-10
- [ ] Morning 500 mL habit consistent for 10+ of 14 days
- [ ] Desk bottle habit consistent for 10+ of 14 days
- [ ] Post-cycling sodium habit consistent for all 4 cycling days per week
- [ ] Post-cycling weight loss under 1 kg on most sessions

**If afternoon headaches persist after 10 days of consistent implementation:** consult a healthcare provider -- headaches unresponsive to hydration correction have other causes that require evaluation.
