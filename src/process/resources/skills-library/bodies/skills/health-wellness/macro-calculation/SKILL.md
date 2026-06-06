---
name: macro-calculation
description: |
  Teaches macronutrient calculation frameworks including Total Daily Energy Expenditure estimation, macro ratio allocation by goal (fat loss, maintenance, muscle gain), and adjustment protocols. Walks through the math step-by-step with example calculations and produces a personalized macro target breakdown.
  Use when the user asks about calculating macros, TDEE estimation, how many calories or grams of protein they need, or how to set macro targets for a fitness goal.
  Do NOT use for clinical nutrition therapy, eating disorder guidance, specific diet prescriptions, or supplement recommendations.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "nutrition fitness step-by-step"
  category: "health-wellness"
  subcategory: "nutrition-diet"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---
# Macro Calculation

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

---

## When to Use

**Use this skill when:**
- A user asks how to calculate their macros (protein, carbohydrates, fat) and wants to understand the math, not just get a number
- A user wants to estimate their Total Daily Energy Expenditure (TDEE) or asks "how many calories should I eat"
- A user asks specifically how much protein they need per day for fat loss, muscle gain, or maintenance
- A user wants to set up a caloric surplus or deficit and understand how large it should be
- A user asks about body recomposition -- simultaneous fat loss and muscle maintenance -- and wants a macro framework for it
- A user is adjusting their macros after a plateau and wants a systematic protocol for doing so
- A user is transitioning between goals (e.g., ending a fat loss phase and moving to maintenance) and needs recalculated targets
- A user asks about the difference between the Mifflin-St Jeor and Harris-Benedict equations and which to use
- A user wants to understand what percentage of their calories should come from each macronutrient

**Do NOT use when:**
- The user has Type 1 or Type 2 diabetes, chronic kidney disease, phenylketonuria, or any condition requiring clinically supervised macronutrient management -- refer to a Registered Dietitian (RD) or Registered Dietitian Nutritionist (RDN)
- The user describes symptoms consistent with an eating disorder: restriction below 1,000-1,200 calories, fear of eating specific foods, obsessive tracking, binge-purge patterns, or extreme distress about food -- do not engage with calculation requests; instead, recommend professional support
- The user asks for a specific meal plan, food list, or recipe guidance -- this skill produces targets only, not food prescriptions (use a meal planning skill instead)
- The user asks about specific supplements (protein powders, creatine, fat burners, etc.) -- do not recommend supplements
- The user asks about a specific named diet protocol (ketogenic, carnivore, Atkins, Whole30) as a dietary philosophy -- these have their own frameworks and may conflict with standard macro allocation approaches
- The user is pregnant or breastfeeding -- caloric and protein needs differ substantially and require clinical guidance
- The user is under 16 years old -- pediatric and adolescent energy needs are calculated differently and require professional oversight

---

## Process

### Step 1: Gather the Minimum Required Data

Before calculating anything, collect the following. If any data is missing, ask for it -- partial data produces unreliable outputs.

- **Biological sex assigned at birth:** The Mifflin-St Jeor equation uses sex-differentiated constants (+5 for male, -161 for female) that account for average differences in lean mass and fat mass distribution. For individuals on hormone therapy, note that long-term hormone replacement therapy shifts metabolic rate toward the affirmed gender but full transition takes 1-3+ years -- use current biometrics as entered and flag the uncertainty.
- **Age in years:** Metabolic rate decreases approximately 1-2% per decade after age 20 due to declining lean mass and hormonal changes.
- **Height:** Accept centimeters or feet/inches. Convert: 1 inch = 2.54 cm. Example: 5'10" = 70 inches x 2.54 = 177.8 cm.
- **Current body weight:** Accept kilograms or pounds. Convert: 1 lb = 0.4536 kg. Use current weight, not goal weight -- the equation estimates current metabolic rate.
- **Activity level:** This is the most error-prone variable. See Step 3 for detailed guidance on selecting the correct multiplier.
- **Primary goal:** Fat loss, maintenance, or muscle gain (lean bulk). If the user says "recomp" or "body recomposition," treat as a specialized sub-case (see Edge Cases).
- **Optional but useful:** Current training split (e.g., 4-day upper/lower, 5-day PPL), training history (novice vs. experienced), and whether weight has been stable recently (stable weight confirms TDEE is close to current intake).

### Step 2: Calculate BMR Using the Mifflin-St Jeor Equation

The Mifflin-St Jeor equation is the most validated for non-athletic populations and outperforms the older Harris-Benedict equation in accuracy studies. Use it as the default. The Katch-McArdle equation (BMR = 370 + 21.6 x lean body mass in kg) is superior when the user knows their body fat percentage -- use it when that data is available.

**Mifflin-St Jeor:**
- Male: BMR = (10 x weight in kg) + (6.25 x height in cm) - (5 x age in years) + 5
- Female: BMR = (10 x weight in kg) + (6.25 x height in cm) - (5 x age in years) - 161

**Katch-McArdle (when body fat % is known):**
- Lean Body Mass (kg) = total weight in kg x (1 - body fat % as decimal)
- BMR = 370 + (21.6 x lean body mass in kg)
- Example: 82 kg at 20% body fat: LBM = 82 x 0.80 = 65.6 kg; BMR = 370 + (21.6 x 65.6) = 370 + 1,417 = 1,787 kcal/day

**Why Mifflin-St Jeor over Harris-Benedict:** Harris-Benedict was derived in 1919 from a small, non-representative sample and consistently overestimates BMR by 5-15% in modern populations. Mifflin-St Jeor (1990) is validated across wider demographic ranges and overestimates by only 1-5% on average.

Always show the arithmetic explicitly -- do not just produce the final number. Users need to see and verify the calculation.

### Step 3: Calculate TDEE Using the Appropriate Activity Multiplier

TDEE = BMR x Activity Multiplier. The multiplier accounts for all caloric expenditure above baseline: exercise, non-exercise activity thermogenesis (NEAT), thermic effect of food (TEF, approximately 10% of total calories), and general daily movement.

**Activity multiplier reference:**

| Activity Level | Definition | Multiplier |
|---|---|---|
| Sedentary | Desk job, no structured exercise, minimal walking | 1.2 |
| Lightly active | 1-3 days/week light exercise or 7,500+ steps/day | 1.375 |
| Moderately active | 3-5 days/week moderate exercise, active job or 10,000+ steps | 1.55 |
| Very active | 6-7 days/week hard training, physically demanding job | 1.725 |
| Extremely active | Twice-daily training or professional athlete level | 1.9 |

**Critical guidance on multiplier selection:**
- Most people significantly overestimate their activity level. A 4-day/week gym-goer who has a desk job and drives to work is moderately active (1.55), not very active.
- NEAT is the most variable and underappreciated factor -- people with physically active jobs (construction, nursing, retail) can burn 500-1,000 more calories per day than desk workers doing the same structured exercise.
- When in doubt, use the lower multiplier and adjust upward after 2-3 weeks of tracking -- it is easier to add calories than explain why the user is gaining weight on a calculated deficit.
- For users who have recently increased their training significantly, note that NEAT often decreases unconsciously to compensate -- a common reason calculated deficits fail.

### Step 4: Set the Caloric Target Based on Goal

Apply the appropriate adjustment to TDEE. These adjustments are calibrated to maximize the rate of progress while minimizing negative adaptations (muscle loss, hormonal disruption, metabolic adaptation).

**Fat loss:**
- Standard deficit: TDEE minus 300-500 kcal/day
- A 500 kcal/day deficit produces a theoretical deficit of 3,500 kcal/week, roughly equivalent to 1 lb of fat (note: the 3,500 kcal/lb rule is an approximation -- actual fat loss rate varies due to metabolic adaptation)
- For users with significant excess body fat (BMI > 30), a deficit of up to 750 kcal/day is generally acceptable given higher fat stores available for mobilization
- Absolute floor: Never set a caloric target below the calculated BMR. As a practical minimum, do not recommend below 1,400 kcal/day for females or 1,600 kcal/day for males regardless of BMR calculation -- these represent the lower bound of sustainable intake without clinical supervision
- Rate of loss guideline: 0.5-1.0% of body weight per week is optimal for muscle preservation. At 180 lbs, this is 0.9-1.8 lbs/week. Losses consistently above 1% of body weight per week signal the deficit is too aggressive.

**Maintenance:**
- Use TDEE as calculated
- Particularly useful during diet breaks (planned 1-2 week return to maintenance during a prolonged fat loss phase to partially reverse metabolic adaptation)

**Muscle gain (lean bulk):**
- Standard surplus: TDEE plus 200-350 kcal/day
- Novice lifters (< 1 year of consistent training): can support 300-500 kcal/day surplus with higher muscle accrual rates (0.5-1 lb muscle/week)
- Intermediate lifters (1-3 years): 200-300 kcal/day surplus; muscle gain rate slows to approximately 0.25-0.5 lbs/week
- Advanced lifters (3+ years): 150-250 kcal/day surplus; muscle gain rate is 0.1-0.25 lbs/week at best -- larger surpluses primarily add fat
- Note explicitly: muscle gain is slow. A 300 kcal/day surplus does not double the rate of muscle gain compared to 150 kcal/day -- it primarily increases fat deposition above a threshold.

### Step 5: Set Protein Target First

Protein is always calculated first because it is the most critical macro for body composition, and it is fixed before carbohydrates or fat are adjusted.

**Protein guidelines by goal:**

| Goal | Protein Target | Rationale |
|---|---|---|
| Fat loss | 2.0-2.4 g/kg body weight | Elevated protein in a deficit preserves lean mass (leucine-mediated muscle protein synthesis signaling) and increases satiety via peptide YY and GLP-1 release |
| Maintenance | 1.6-2.0 g/kg body weight | Supports muscle protein turnover and recovery |
| Muscle gain | 1.8-2.2 g/kg body weight | Supports net positive muscle protein synthesis; research shows diminishing returns above 2.2 g/kg |
| Over 50, any goal | Upper end of respective range | Age-related anabolic resistance requires higher leucine intake per meal to maximally stimulate MPS |
| High body fat (> 30% BF) | Calculate from lean body mass x 2.4-2.8 g/kg LBM | Using total body weight overestimates protein needs in high-BF individuals; fat tissue has no protein requirement |

**Practical limits:** Research does not show harm from protein intakes up to 3.0-3.5 g/kg in healthy adults. No evidence supports recommendations above 2.4 g/kg for most goals -- beyond this, additional protein provides minimal additional muscle protein synthesis benefit.

**Express protein as a range, never a single number.** The midpoint of the range is the working target for calculation purposes.

**Caloric value of protein:** 4 kcal/g. Protein calories = grams x 4.

### Step 6: Set Fat Target Second

Fat intake is set second because it has a physiological minimum that must be respected before carbohydrates are allocated.

**Fat guidelines:**
- Minimum: 0.8 g/kg body weight -- below this threshold, steroid hormone production (testosterone, estrogen, cortisol) is impaired, fat-soluble vitamin absorption (A, D, E, K) is reduced, and essential fatty acid (omega-3, omega-6) needs cannot be met
- Standard recommendation: 1.0 g/kg body weight for most goals -- this provides a practical margin above the minimum
- Upper practical limit: 1.2 g/kg -- above this, carbohydrates are squeezed out, which reduces glycogen availability for training performance
- For ketogenic-style targets (not standard macro calculation): fat intake can be much higher, but this represents a different calculation framework not covered in this skill

**Caloric value of fat:** 9 kcal/g. Fat calories = grams x 9.

### Step 7: Allocate Remaining Calories to Carbohydrates

After protein and fat are set, all remaining calories go to carbohydrates. This "carbs by difference" approach is intentional -- carbohydrates are the most flexible macro and the most responsive to adjustment.

**Carbohydrate calculation:**
- Remaining calories = Total caloric target - (protein calories + fat calories)
- Carbohydrate grams = remaining calories / 4

**Verify the math:** Sum all three macro calories and confirm they equal the caloric target within 5 calories (rounding error is acceptable).

**Sanity checks:**
- If carbohydrate grams fall below 100g/day, the caloric target may be too low or protein and fat allocations are consuming too many calories -- review and adjust
- Athletes doing > 60 minutes of moderate-to-high intensity exercise daily may need carbohydrates as high as 5-7 g/kg -- if calculated carbs fall well below this, flag it and note that training performance may suffer
- Low carbohydrate outcomes (< 100g/day) are not inherently harmful but should be flagged so the user is aware

### Step 8: Deliver the Adjustment Protocol

A calculation is only the starting point. Metabolic adaptation, TDEE estimation error, and individual variation mean that virtually everyone will need to adjust their targets within the first few weeks. Provide a specific, systematic protocol.

**Adjustment triggers:**
- **Fat loss:** If scale weight (averaged across 7 days) is not declining after 3 full weeks, reduce total calories by 100-150 kcal/day by cutting carbohydrates (25-37g carbs) -- never protein, rarely fat
- **Fat loss, too fast:** If weight loss exceeds 1% body weight/week consistently, add 100-150 kcal/day via carbohydrates to slow loss and preserve muscle
- **Muscle gain:** If scale weight is not increasing by 0.25-0.5 lbs/week (intermediate) or 0.5-1.0 lbs/week (novice) after 3 weeks, add 100-150 kcal/day via carbohydrates
- **Recalculation trigger:** Recalculate all targets after every 10-15 lb change in body weight or every 8-12 weeks, whichever comes first -- as weight changes, BMR changes, and the same caloric target produces different results
- **Always adjust carbohydrates first** when making small changes -- protein and fat are kept as stable as possible because they serve structural and hormonal functions beyond energy

---

## Output Format

```
## Macro Calculation: [Goal] -- [Name/identifier if provided]

> Disclaimer: These are estimates based on population-average equations. Actual energy 
> needs vary by 10-20% from calculated values. Adjust based on real-world results over 
> 2-3 weeks, not on the calculation alone.

---

### Input Data

| Variable        | Value                          |
|-----------------|-------------------------------|
| Sex             | [Male / Female]               |
| Age             | [X] years                     |
| Height          | [X cm] ([ft'in"] if converted) |
| Weight          | [X kg] ([X lbs] if converted) |
| Activity Level  | [Level] -- [multiplier]       |
| Goal            | [Fat loss / Maintenance / Muscle gain] |
| Equation Used   | [Mifflin-St Jeor / Katch-McArdle] |

---

### Step 1: Basal Metabolic Rate (BMR)

**Equation:** Mifflin-St Jeor ([Male/Female])
**Formula:** ([10 x weight] + [6.25 x height] - [5 x age] ± [5 or -161])

**Calculation:**
(10 x [weight kg]) + (6.25 x [height cm]) - (5 x [age]) + [5 or -161]
= [A] + [B] - [C] + [D]
= [A+B-C+D]

**BMR: [X] kcal/day**

---

### Step 2: Total Daily Energy Expenditure (TDEE)

**Activity level:** [Description]
**Multiplier:** [X]
**Calculation:** [BMR] x [multiplier] = [TDEE]

**TDEE: [X] kcal/day**

---

### Step 3: Caloric Target

**Goal:** [Fat loss / Maintenance / Muscle gain]
**Adjustment:** [TDEE ± X calories] -- [rationale]
**Daily caloric target: [X] kcal/day**
**Implied rate of change:** [~X lbs/week loss or gain]
**BMR floor (do not go below):** [BMR value] kcal/day

---

### Step 4: Macro Targets

| Macro         | Target Basis              | Grams/Day | Calories/Day | % of Total |
|---------------|---------------------------|-----------|--------------|------------|
| Protein       | [X g/kg x weight kg]      | [X]g      | [X] kcal     | [X%]       |
| Fat           | [X g/kg x weight kg]      | [X]g      | [X] kcal     | [X%]       |
| Carbohydrates | Remaining calories / 4    | [X]g      | [X] kcal     | [X%]       |
| **TOTAL**     |                           |           | **[X] kcal** | **100%**   |

**Calculation shown:**
- Protein: [X] g/kg x [weight] kg = [X]g x 4 = [X] kcal
- Fat: [X] g/kg x [weight] kg = [X]g x 9 = [X] kcal
- Carbs remaining: [Total kcal] - [protein kcal] - [fat kcal] = [X] kcal / 4 = [X]g

---

### Step 5: Adjustment Protocol

**When to adjust:** After 3 full weeks of consistent tracking
**Adjustment unit:** 100-150 kcal/day (modify carbohydrates, keep protein fixed)

| Scenario | Action |
|---|---|
| Weight not moving in desired direction after 3 weeks | [Reduce/add] carbs by [~25g/day] |
| Weight moving faster than target rate | [Add/reduce] carbs by [~25g/day] |
| Major body weight change (10+ lbs) | Recalculate all targets from scratch |
| Plateau lasting 4+ weeks despite adjustments | Reconsider activity multiplier; consider 1-2 week diet break at TDEE |

**Protein floor:** [X]g/day -- never reduce this regardless of caloric adjustments
**Absolute caloric floor:** [BMR] kcal/day

---

### Reference Summary (Portable)

- **Daily calories:** [X] kcal
- **Protein:** [X]g
- **Fat:** [X]g
- **Carbs:** [X]g
- **Recalculate on:** [date ~8-12 weeks out] or after [10 lbs of weight change]

---

*For individualized nutrition guidance, consult a Registered Dietitian (RD) or Registered 
Dietitian Nutritionist (RDN). These calculations are starting estimates only.*
```

---

## Rules

1. **Always show the arithmetic, step by step, with the user's actual numbers substituted in.** Do not produce a final number without showing the calculation chain. Users who see the math can identify errors, learn the framework, and recalculate independently in the future. Opaque outputs undermine trust and utility.

2. **Always state TDEE estimates carry 10-20% individual variation** due to genetic differences in metabolic efficiency, NEAT variation (which can vary by 500-800 kcal/day between individuals at the same activity level), thermic effect of food differences, and medication effects (SSRIs, beta-blockers, thyroid medications, and corticosteroids all affect metabolic rate). Present TDEE as a starting estimate, not a fact.

3. **Never set caloric targets below BMR, and never recommend below 1,400 kcal/day for females or 1,600 kcal/day for males** regardless of what the formula produces. Intakes below these levels increase catabolism of lean tissue, suppress thyroid hormone (T3), elevate cortisol, impair immunity, and are not maintainable without clinical supervision.

4. **Never recommend a deficit larger than 500 kcal/day without explicitly flagging the risks:** muscle catabolism accelerates above 500 kcal/day deficit, adaptive thermogenesis (metabolic slowdown) is more pronounced, hormonal disruption (menstrual dysfunction, testosterone suppression) becomes more likely, and dietary adherence drops sharply. If the user pushes for a larger deficit, acknowledge the goal, explain the trade-offs, and offer a compromise (e.g., 500 kcal deficit plus 1 refeed day per week).

5. **Always set protein first, then fat, then carbohydrates by difference.** The order is not arbitrary -- protein is set based on body weight for physiological reasons, fat is set to a physiological minimum, and carbohydrates absorb all remaining calories because they are the most adjustable macro without physiological minimum constraints (except for athletes with high glycolytic demand).

6. **Fat targets must never go below 0.8 g/kg body weight.** Dietary fat is required for synthesis of testosterone, estradiol, progesterone, cortisol, and vitamin D. Sub-0.8 g/kg fat intake impairs these pathways, particularly in females where fat intake below this level is associated with hypothalamic amenorrhea. This is a hard floor, not a guideline.

7. **Express protein as a range (e.g., 2.0-2.4 g/kg) but calculate from a specific point within the range** -- use the high end for fat loss and older adults, mid-range for muscle gain, low-mid for maintenance. State explicitly which value was used and why, so the user understands the rationale and can adjust within the range.

8. **When a user's weight has been changing recently, note that current weight is the correct input** -- not a recent low, not a goal weight, not an average. The equation estimates current metabolic rate, which is determined by current mass and composition.

9. **Do not recommend specific foods, meal timing, intermittent fasting windows, or food elimination strategies** as part of this output. Macro targets tell the user what quantities to hit -- how they achieve those quantities through food selection is a separate topic. Offering unprompted dietary strategy beyond macro targets oversteps this skill's scope.

10. **If the calculated carbohydrate result is negative or below 50g/day, flag this as a signal that the caloric target or macro allocation needs review** before presenting it as a recommendation. A negative carbohydrate result means protein and fat calories exceed the total caloric target -- revisit protein or fat allocation. A sub-50g carbohydrate result is functionally a ketogenic-range intake and should be named as such, with the note that this represents a specific dietary strategy with its own considerations beyond standard macro allocation.

11. **Recalculate triggers must be explicit.** Always state the specific recalculation condition: every 10-15 lb weight change or every 8-12 weeks, whichever comes first. Calculations made at a higher weight do not remain accurate as weight decreases -- the error compounds over time.

12. **When a user describes a specific structured training program** (e.g., 5/3/1, GZCLP, PHAT, PHUL), use that information to refine the activity multiplier selection rather than relying solely on days-per-week exercise frequency. A 3-day/week powerlifting program with high intensity and 2-hour sessions may warrant a higher multiplier than a 4-day/week moderate cardio program.

---

## Edge Cases

### Users Who Know Their Body Fat Percentage

When a user provides a reliable body fat estimate (DEXA scan, Bod Pod, or hydrostatic weighing -- not handheld BIA which has ±3-5% error), use the Katch-McArdle equation instead of Mifflin-St Jeor. Katch-McArdle is more accurate for lean individuals and individuals with high body fat because it removes the confounding effect of fat mass on BMR. Show the LBM calculation explicitly: LBM = total weight x (1 - BF%). For protein targets at high body fat levels (> 30%), calculate from LBM x 2.4-2.8 g/kg rather than total body weight to avoid over-prescribing protein.

### Body Recomposition Goal

Body recomposition -- simultaneous fat loss and muscle gain -- is physiologically possible primarily in three populations: true beginners (< 6 months resistance training), individuals returning after a long training break ("muscle memory" effect), and individuals with significant excess body fat (> 25% for males, > 35% for females) where mobilized fat can fuel muscle growth. For these users: set calories at TDEE (no deficit, no surplus), set protein at the high end of the fat loss range (2.2-2.4 g/kg), and note that progress is slower than either dedicated fat loss or muscle gain phases. For experienced, lean lifters requesting recomposition, explain that simultaneous fat loss and muscle gain is possible but minimal -- dedicated phases (bulk/cut cycles) produce faster results. Do not refuse the recomposition target; instead, explain the trade-offs and set the targets appropriately.

### User With High Body Fat Requesting Aggressive Fat Loss

Users with BMI > 35 often request larger deficits because they want faster results. A larger deficit is more justified here than for lean individuals because fat stores are abundant and protein-sparing capacity is higher. However: never go below BMR, maintain protein at 2.0-2.4 g/kg of LBM (not total weight), and explicitly note that losses above 2 lbs/week are associated with disproportionate lean mass loss even at high body fat. For this population, a 500-750 kcal/day deficit is reasonable. Always calculate their BMR to confirm the floor, as high body weight means BMR is often 2,000+ kcal/day, making a 750 kcal deficit still well above the floor.

### Very Low Resulting Caloric Targets for Small-Framed Individuals

A sedentary female, age 55, height 5'1" (155 cm), weight 115 lbs (52 kg), seeking fat loss may produce: BMR = (10 x 52) + (6.25 x 155) - (5 x 55) - 161 = 520 + 968.75 - 275 - 161 = 1,053 kcal/day. A 500 kcal deficit would put her at 553 kcal/day -- clearly impossible. In these cases, apply the hard floor (minimum 1,400 kcal/day for females) and explain that at low body weights, a traditional deficit is often not feasible -- the appropriate strategy is a small deficit of 100-200 kcal/day combined with increasing activity to raise TDEE, making more room for a sustainable deficit.

### Vegetarian and Vegan Users

Macro targets by weight apply identically regardless of dietary pattern -- there is nothing fundamentally different about protein grams required. However, flag the following practical considerations: plant-based protein sources are typically less leucine-dense per gram of food (e.g., 100g of chicken provides ~30g protein; 100g of cooked lentils provides ~9g protein), requiring higher total food volume to hit targets. Soy, quinoa, and buckwheat are complete protein sources; most other plant proteins are incomplete (lysine-deficient grains, methionine-deficient legumes) and should be combined across the day. Creatine and L-carnitine are absent from plant-based diets, affecting some aspects of muscle metabolism -- this is relevant context but does not change the macro calculation itself. Note these considerations without recommending specific supplements.

### Users Over 50

Two key physiological changes affect calculation for this population: (1) Anabolic resistance -- muscle protein synthesis requires more leucine stimulation per meal, meaning 3+ meals/day each containing 35-40g of protein are more effective than 6 meals at 20g each. This doesn't change the daily total but is worth noting for context. (2) Reduced NEAT and declining metabolic rate -- the calculated TDEE may overestimate actual needs by a greater margin than in younger adults. Recommend starting with the lower activity multiplier and tracking carefully before adjusting. Use the high end of the protein range regardless of goal (2.0-2.4 g/kg for fat loss, 2.0-2.2 g/kg for maintenance and muscle gain). Resistance training is particularly important for this population to preserve lean mass -- this context is appropriate to mention without constituting a training prescription.

### User Wants to Use Macros as Percentages Rather Than Grams

Some users come in with a percentage-based framework (e.g., "I want 40% protein, 30% carbs, 30% fat"). This approach is less precise and can be problematic: at very low or very high caloric intakes, a fixed percentage can result in inadequate protein. For example, at 1,500 kcal/day with 30% protein, protein = 450 kcal / 4 = 112.5g. For a 180 lb (82 kg) person, this is only 1.4 g/kg -- below the threshold for muscle preservation in a deficit. Always convert percentage-based goals to gram targets using the user's caloric total, then check the resulting grams against the body-weight-based ranges. If the grams fall short, explain why grams-first is more reliable and recalculate using the body weight method.

### Users on Medications That Affect Metabolism or Body Composition

Several medications significantly affect the accuracy of TDEE estimates or alter macro needs:
- **SSRIs (fluoxetine, sertraline, etc.):** Can increase appetite and cause weight gain through multiple mechanisms; TDEE estimates may understate actual intake needed for maintenance or overstate deficit
- **Beta-blockers:** Reduce exercise capacity and lower TDEE by 5-10% -- consider using a lower activity multiplier
- **Corticosteroids:** Promote muscle catabolism and fat redistribution; protein needs may be at the high end of any range
- **Thyroid medications:** If well-controlled on levothyroxine, calculation proceeds normally -- if undertreated hypothyroidism is suspected (unexplained lack of response to deficit), defer to physician

Do not diagnose or recommend medication changes. Simply note that these variables affect metabolic rate and that recalibration based on real-world weight trends is especially important in these cases.

---

## Example

**User input:** "I'm a 28-year-old woman, 5'6" (167.6 cm), 155 lbs (70.3 kg), I work a desk job and train with weights 4 days a week. I want to lose fat but I'm worried about losing muscle. I've been at roughly the same weight for the past 2 months so my current calories must be around maintenance."

---

## Macro Calculation: Fat Loss (Muscle Preservation) -- Female, 28 years

> Disclaimer: These are estimates based on population-average equations. Actual energy needs vary by 10-20% from calculated values. The fact that your weight has been stable for 2 months is useful real-world confirmation of your approximate TDEE -- this will help calibrate the starting point.

---

### Input Data

| Variable | Value |
|---|---|
| Sex | Female |
| Age | 28 years |
| Height | 167.6 cm (5'6") |
| Weight | 70.3 kg (155 lbs) |
| Activity Level | Moderately active -- desk job + 4 days/week resistance training (1.55) |
| Goal | Fat loss with muscle preservation |
| Equation Used | Mifflin-St Jeor (body fat % not provided) |

---

### Step 1: Basal Metabolic Rate (BMR)

**Equation:** Mifflin-St Jeor (Female)
**Formula:** (10 x weight in kg) + (6.25 x height in cm) - (5 x age) - 161

**Calculation:**
(10 x 70.3) + (6.25 x 167.6) - (5 x 28) - 161
= 703 + 1,047.5 - 140 - 161
= 1,449.5

**BMR: 1,450 kcal/day** (rounded)

---

### Step 2: Total Daily Energy Expenditure (TDEE)

**Activity level:** Moderately active -- sedentary job but consistent 4-day/week resistance training
**Multiplier:** 1.55
**Calculation:** 1,450 x 1.55 = 2,248

**TDEE: 2,248 kcal/day**

**Confirmation note:** You mentioned your weight has been stable for ~2 months. This strongly suggests your current intake is approximately your true TDEE -- a very useful data point. If you know roughly what you're currently eating, compare it to this 2,248 figure. If your tracked intake is consistently 2,000 or 2,400, use that real-world figure as your TDEE baseline rather than the calculated estimate -- real-world data outperforms equation estimates every time.

---

### Step 3: Caloric Target

**Goal:** Fat loss with muscle preservation
**Adjustment:** TDEE - 400 kcal/day (moderate deficit, upper-moderate range selected given 4-day training schedule -- preserving training performance is a priority)
**Daily caloric target: 1,848 kcal/day** (rounded to 1,850 kcal for ease of tracking)

**Implied rate of loss:** ~0.8 lbs/week (~0.5% of body weight/week -- within the optimal 0.5-1.0% range for muscle preservation)
**BMR floor (absolute minimum -- do not go below):** 1,450 kcal/day
**Practical minimum:** 1,400 kcal/day (female floor) -- you are well above this

---

### Step 4: Macro Targets

**Protein (set first -- fat loss, female, active, muscle preservation priority):**
Using 2.2 g/kg (high end of fat loss range, appropriate given 4-day training schedule and explicit muscle preservation goal)
70.3 kg x 2.2 = 154.7g → **155g protein/day**
155g x 4 kcal/g = 620 kcal from protein

**Fat (set second -- physiological minimum + practical margin):**
Using 1.0 g/kg (standard recommendation, meets hormonal health requirements, preserves room for carbohydrates)
70.3 kg x 1.0 = 70.3g → **70g fat/day**
70g x 9 kcal/g = 630 kcal from fat

**Carbohydrates (remaining calories):**
1,850 - 620 - 630 = 600 kcal remaining
600 / 4 = **150g carbohydrates/day**

| Macro | Target Basis | Grams/Day | Calories/Day | % of Total |
|---|---|---|---|---|
| Protein | 2.2 g/kg x 70.3 kg | 155g | 620 kcal | 33% |
| Fat | 1.0 g/kg x 70.3 kg | 70g | 630 kcal | 34% |
| Carbohydrates | Remaining calories / 4 | 150g | 600 kcal | 33% |
| **TOTAL** | | | **1,850 kcal** | **100%** |

**Verification:** 620 + 630 + 600 = 1,850 kcal ✓

**Calculation chain shown:**
- Protein: 70.3 kg x 2.2 = 154.7g (rounded to 155g) x 4 = 620 kcal
- Fat: 70.3 kg x 1.0 = 70.3g (rounded to 70g) x 9 = 630 kcal
- Carbs: (1,850 - 620 - 630) = 600 kcal ÷ 4 = 150g

---

### Step 5: Adjustment Protocol

**When to adjust:** After 3 full weeks of consistent tracking (7-day average weight, not day-to-day fluctuations)

| Scenario | Action |
|---|---|
| Weight not declining after 3 weeks | Reduce carbs by 25g/day (−100 kcal) → new total 1,750 kcal |
| Weight dropping faster than ~0.8 lbs/week | Add carbs by 25g/day (+100 kcal) → new total 1,950 kcal |
| Weight dropping and training performance declining noticeably | Add carbs by 25g on training days only (carb cycling) |
| Plateau lasting 4+ weeks despite calorie reduction | Consider 1-2 week diet break at 2,248 kcal (TDEE) to partially reverse metabolic adaptation |
| 10+ lbs of weight lost | Recalculate all targets from scratch at new body weight |

**Protein floor:** 155g/day -- never reduce this regardless of caloric adjustments. Protein is the last macro to cut.
**Absolute caloric floor:** 1,450 kcal/day (your BMR)

**First 1-2 weeks:** Expect the scale to drop more than 0.8 lbs/week initially. This is primarily water weight and glycogen depletion, not fat. Do not interpret this as faster-than-expected fat loss and do not use it as a reason to eat more. Wait for the 3-week trend.

---

### Reference Summary (Portable)

- **Daily calories:** 1,850 kcal
- **Protein:** 155g
- **Fat:** 70g
- **Carbs:** 150g
- **Recalculate:** After 10 lbs of weight loss, or in approximately 10 weeks -- whichever comes first
- **Protein range (acceptable):** 148-169g (2.1-2.4 g/kg) -- 155g is the working target
- **Fat minimum (do not go below):** 56g/day (0.8 g/kg)

---

*For individualized nutrition guidance, consult a Registered Dietitian (RD) or Registered Dietitian Nutritionist (RDN). These calculations are starting estimates -- adjust based on real-world results, not just the math.*
