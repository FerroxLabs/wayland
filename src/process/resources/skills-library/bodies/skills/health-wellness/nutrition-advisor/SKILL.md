---
name: nutrition-advisor
description: |
  Evidence-based nutrition planning assistant that calculates macronutrient needs, builds meal plans aligned with USDA MyPlate guidelines, and provides guidance on nutrition for specific goals including muscle gain, fat loss, and endurance performance.
  Use when the user asks about nutrition advisor, or needs help with evidence-based nutrition planning assistant that calculates macronutrient needs, builds meal plans aligned with usda myplate guidelines, and provides guidance on nutrition for specific goals including muscle gain, fat loss, and endurance performance.
  Do NOT use when the request requires professional medical advice or falls outside the scope of nutrition advisor.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "health-wellness nutrition guide"
  category: "health-wellness"
  subcategory: "preventive-health"
  depends: ""
  disclaimer: "not-medical-advice"
  difficulty: "intermediate"
---

# Nutrition Advisor

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

## When to Use

**Use this skill when:**
- User asks about nutrition advisor
- User needs guidance on nutrition advisor topics
- User wants a structured approach to nutrition advisor

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

### Required Nutrition Assessment

```
NUTRITION ASSESSMENT QUESTIONNAIRE
====================================

1. PRIMARY GOAL:
   [ ] Fat loss / weight loss
   [ ] Muscle gain / bulking
   [ ] Body recomposition (lose fat, gain muscle)
   [ ] Athletic performance / endurance
   [ ] General health improvement
   [ ] Weight maintenance
   [ ] Specific medical nutrition (consult RD)

2. PHYSICAL DATA:
   - Age: ___
   - Biological sex: ___
   - Height: ___
   - Current weight: ___
   - Goal weight (if applicable): ___
   - Body fat % (if known): ___

3. ACTIVITY LEVEL:
   [ ] Sedentary (desk job, little exercise)
   [ ] Lightly active (light exercise 1-3 days/week)
   [ ] Moderately active (moderate exercise 3-5 days/week)
   [ ] Very active (hard exercise 6-7 days/week)
   [ ] Extremely active (very hard exercise + physical job)

4. DIETARY RESTRICTIONS / PREFERENCES:
   [ ] No restrictions
   [ ] Vegetarian
   [ ] Vegan
   [ ] Gluten-free
   [ ] Dairy-free
   [ ] Nut-free
   [ ] Kosher / Halal
   [ ] Low-sodium
   [ ] Diabetic considerations
   [ ] Other: ___

5. FOOD ALLERGIES: ___

6. CURRENT EATING HABITS:
   - Meals per day: ___
   - Typical eating window: ___ to ___
   - Current diet description: ___
   - Frequent snacking: [ ] Yes [ ] No
   - Alcohol consumption: ___
   - Current supplements: ___

7. COOKING SITUATION:
   - Cooking skill level: [ ] Beginner [ ] Intermediate [ ] Advanced
   - Time available for meal prep: ___
   - Access to kitchen: [ ] Full [ ] Limited [ ] None
   - Budget considerations: ___

8. CHALLENGES:
   - Biggest nutrition struggle: ___
   - Previous diet attempts: ___
   - Emotional eating: [ ] Yes [ ] No
   - Irregular schedule: [ ] Yes [ ] No
```

## Step 1: Calculate Total Daily Energy Expenditure (TDEE)

### Mifflin-St Jeor Equation (most accurate for most people)

**Males:**
BMR = (10 x weight in kg) + (6.25 x height in cm) - (5 x age) + 5

**Females:**
BMR = (10 x weight in kg) + (6.25 x height in cm) - (5 x age) - 161

### Activity Multiplier
| Activity Level | Multiplier |
|---------------|------------|
| Sedentary | BMR x 1.2 |
| Lightly active | BMR x 1.375 |
| Moderately active | BMR x 1.55 |
| Very active | BMR x 1.725 |
| Extremely active | BMR x 1.9 |

**TDEE = BMR x Activity Multiplier**

### Caloric Targets by Goal
| Goal | Daily Calories |
|------|---------------|
| Fat Loss (moderate) | TDEE - 500 (1 lb/week loss) |
| Fat Loss (aggressive) | TDEE - 750 (1.5 lb/week loss) |
| Maintenance | TDEE |
| Lean Bulk | TDEE + 250 |
| Bulk | TDEE + 500 |

### TDEE Calculation Template

```
TDEE CALCULATION WORKSHEET
============================
Weight: ___ lbs / 2.205 = ___ kg
Height: ___ inches x 2.54 = ___ cm
Age: ___ years

BMR (Male):   (10 x ___kg) + (6.25 x ___cm) - (5 x ___age) + 5 = ___ cal
BMR (Female): (10 x ___kg) + (6.25 x ___cm) - (5 x ___age) - 161 = ___ cal

TDEE: ___ BMR x ___ activity multiplier = ___ calories/day

Goal adjustment: ___ TDEE +/- ___ = ___ target calories/day
```

## Step 2: Macronutrient Ratios by Goal

### Protein Recommendations
| Goal | Protein (g/lb bodyweight) | Protein (g/kg bodyweight) |
|------|--------------------------|--------------------------|
| Fat Loss | 1.0-1.2 g/lb | 2.2-2.6 g/kg |
| Muscle Gain | 0.8-1.0 g/lb | 1.8-2.2 g/kg |
| Maintenance | 0.7-0.8 g/lb | 1.6-1.8 g/kg |
| Endurance Athlete | 0.7-0.9 g/lb | 1.6-2.0 g/kg |
| General Health | 0.6-0.7 g/lb | 1.2-1.6 g/kg |

### Macro Split Templates

**Fat Loss:**
- Protein: 40% | Carbs: 30% | Fat: 30%
- Example at 1800 cal: 180g P / 135g C / 60g F

**Muscle Gain:**
- Protein: 30% | Carbs: 45% | Fat: 25%
- Example at 2800 cal: 210g P / 315g C / 78g F

**Maintenance / General Health:**
- Protein: 30% | Carbs: 40% | Fat: 30%
- Example at 2200 cal: 165g P / 220g C / 73g F

**Endurance Performance:**
- Protein: 20% | Carbs: 55% | Fat: 25%
- Example at 2600 cal: 130g P / 358g C / 72g F

**Keto-Adapted:**
- Protein: 25% | Carbs: 5% | Fat: 70%
- Example at 2000 cal: 125g P / 25g C / 156g F

### Calorie Values
- Protein: 4 calories per gram
- Carbohydrates: 4 calories per gram
- Fat: 9 calories per gram
- Alcohol: 7 calories per gram

## Step 3: USDA MyPlate Guidelines

### Daily Recommended Amounts (2000-calorie baseline)

| Food Group | Daily Amount | Key Nutrients |
|-----------|-------------|--------------|
| Fruits | 2 cups | Fiber, Vitamin C, Potassium |
| Vegetables | 2.5 cups | Fiber, Vitamin A, Vitamin C |
| Grains | 6 oz equivalents | B vitamins, Iron, Fiber |
| Protein | 5.5 oz equivalents | Protein, Iron, Zinc, B12 |
| Dairy | 3 cups | Calcium, Vitamin D, Protein |

### Vegetable Subgroup Weekly Targets
- Dark green vegetables: 1.5 cups/week
- Red and orange vegetables: 5.5 cups/week
- Beans, peas, lentils: 1.5 cups/week
- Starchy vegetables: 5 cups/week
- Other vegetables: 4 cups/week

### What Counts as a Serving
| Food Group | One Serving Equals |
|-----------|-------------------|
| Fruit | 1 medium fruit, 1/2 cup cut fruit, 1/4 cup dried |
| Vegetables | 1 cup raw leafy, 1/2 cup other vegetables |
| Grains | 1 slice bread, 1/2 cup cooked rice/pasta, 1 cup cereal |
| Protein | 1 oz meat/fish, 1 egg, 1/4 cup beans, 1 tbsp nut butter |
| Dairy | 1 cup milk/yogurt, 1.5 oz natural cheese |

## Meal Timing Strategies

### Standard Approach (3 meals + 2 snacks)
| Meal | Time | Calories | Focus |
|------|------|----------|-------|
| Breakfast | 7-8 AM | 25% | Protein + complex carbs |
| Morning Snack | 10 AM | 10% | Protein + fruit |
| Lunch | 12-1 PM | 30% | Balanced plate |
| Afternoon Snack | 3 PM | 10% | Protein + healthy fat |
| Dinner | 6-7 PM | 25% | Protein + vegetables + healthy fat |

### Pre/Post Workout Nutrition
**Pre-Workout (1-2 hours before):**
- 20-40g protein + 40-60g carbs + low fat
- Examples: chicken + rice, protein shake + banana, Greek yogurt + oats

**Post-Workout (within 1-2 hours):**
- 20-40g protein + 40-80g carbs
- Examples: protein shake + fruit, lean meat + sweet potato

### Intermittent Fasting Patterns
| Protocol | Eating Window | Fasting Window |
|----------|--------------|----------------|
| 16:8 | 8 hours | 16 hours |
| 14:10 | 10 hours | 14 hours |
| 5:2 | 5 normal days | 2 reduced-calorie days |

## Hydration Guidelines

### Daily Water Intake Formula
- **Baseline:** Body weight (lbs) / 2 = ounces per day
- **Active:** Add 16-24 oz per hour of exercise
- **Hot climate:** Add 16-32 oz additional
- **General minimum:** 64 oz (8 cups) per day

### Hydration Schedule
| Time | Amount | Trigger |
|------|--------|---------|
| Upon waking | 16 oz | Start the day |
| With each meal | 8-16 oz | Mealtime |
| Before exercise | 16-20 oz | 2 hrs before |
| During exercise | 7-10 oz | Every 10-20 min |
| After exercise | 16-24 oz | Per lb lost |
| Before bed | 8 oz | 1 hr before sleep |

## Supplement Basics

### Evidence-Based Supplements (strongest research support)
| Supplement | Dosage | Purpose | Notes |
|-----------|--------|---------|-------|
| Creatine Monohydrate | 3-5g/day | Strength, power, muscle | Most researched supplement |
| Vitamin D3 | 1000-4000 IU/day | Bone health, immunity | If blood levels < 30 ng/mL |
| Omega-3 (EPA/DHA) | 1-3g/day | Heart, brain, inflammation | From fish oil or algae |
| Protein Powder | As needed | Meet protein targets | Whey, casein, or plant-based |
| Magnesium | 200-400mg/day | Sleep, muscle, recovery | Glycinate or citrate forms |

### Supplements to Be Cautious About
- Fat burners / thermogenics - minimal evidence, potential side effects
- Testosterone boosters - mostly ineffective
- BCAAs - unnecessary if protein intake is adequate
- Detox / cleanse products - body detoxes itself via liver and kidneys

> Always consult a healthcare provider before starting any supplement regimen.

## Reading Nutrition Labels

### Key Items to Check (in order of importance)
1. **Serving size** - Everything on the label is based on this
2. **Calories per serving** - Multiply if eating more than one serving
3. **Protein** - Aim for higher protein per calorie
4. **Fiber** - Aim for 25-35g/day total
5. **Added sugars** - Limit to < 25g/day (women) or < 36g/day (men)
6. **Sodium** - Limit to < 2300mg/day
7. **Saturated fat** - Limit to < 10% of total calories
8. **Ingredient list** - Fewer and recognizable ingredients preferred

### Quick Label Assessment
```
NUTRITION LABEL SCORECARD
==========================
Product: _______________
Serving size: ___ | Servings I'll eat: ___

Per my actual serving:
  Calories: ___ x ___ servings = ___
  Protein:  ___g  (aim: >10g per snack, >20g per meal)
  Fiber:    ___g  (aim: >3g)
  Sugar:    ___g  (aim: <10g added)
  Sodium:   ___mg (aim: <600mg per meal)

Verdict: [ ] Good choice  [ ] Occasional  [ ] Avoid
```

## Portion Sizing Without Measuring

### The Hand Method
| Hand Measure | Equivalent | Food Type |
|-------------|-----------|-----------|
| Palm | 3-4 oz | Protein (meat, fish, tofu) |
| Fist | 1 cup | Vegetables, fruits, grains |
| Cupped hand | 1/2 cup | Carbs (rice, pasta, potatoes) |
| Thumb | 1 tablespoon | Fats (oils, nut butters) |
| Thumb tip | 1 teaspoon | Oils, butter |

### Portions Per Meal by Goal
| Goal | Protein | Veggies | Carbs | Fats |
|------|---------|---------|-------|------|
| Fat Loss (women) | 1 palm | 2 fists | 1 cupped hand | 1 thumb |
| Fat Loss (men) | 2 palms | 2 fists | 1 cupped hand | 1 thumb |
| Maintenance (women) | 1 palm | 2 fists | 1.5 cupped hands | 1.5 thumbs |
| Maintenance (men) | 2 palms | 2 fists | 2 cupped hands | 2 thumbs |
| Muscle Gain (women) | 1.5 palms | 2 fists | 2 cupped hands | 1.5 thumbs |
| Muscle Gain (men) | 2 palms | 2 fists | 3 cupped hands | 2 thumbs |

## Nutrition Plan Generation Workflow

1. Collect user assessment data
2. Calculate BMR and TDEE
3. Set caloric target based on goal
4. Determine macronutrient ratios
5. Establish meal frequency and timing
6. Build meals using MyPlate framework
7. Apply dietary restrictions and preferences
8. Generate sample 3-day meal plan
9. Create grocery shopping list
10. Set check-in schedule (weekly weigh-ins, bi-weekly adjustments)

## Common Nutrition Mistakes to Avoid

1. **Drastically cutting calories** - Never go below BMR; aim for 500-750 cal deficit max
2. **Neglecting protein** - Protein is critical for all goals, especially fat loss
3. **Eliminating food groups** - Unless medically necessary, all food groups contribute to health
4. **Ignoring liquid calories** - Sodas, juices, alcohol, and fancy coffee drinks add up fast
5. **Weekend overeating** - Two days of excess can erase five days of deficit
6. **Relying on supplements over food** - Whole foods first, supplements to fill gaps
7. **Not adjusting over time** - As weight changes, recalculate TDEE every 10-15 lbs
8. **All-or-nothing thinking** - One imperfect meal does not ruin a plan; consistency over perfection

## Quick Reference: High-Protein Foods

| Food | Serving | Protein | Calories |
|------|---------|---------|----------|
| Chicken breast | 4 oz | 26g | 120 |
| Greek yogurt (nonfat) | 1 cup | 17g | 100 |
| Eggs | 2 large | 12g | 140 |
| Canned tuna | 3 oz | 20g | 70 |
| Cottage cheese (low-fat) | 1/2 cup | 14g | 80 |
| Tofu (firm) | 4 oz | 10g | 90 |
| Lentils (cooked) | 1/2 cup | 9g | 115 |
| Whey protein powder | 1 scoop | 24g | 120 |
| Salmon | 4 oz | 23g | 160 |
| Lean ground turkey | 4 oz | 22g | 150 |


## Output Format

```
NUTRITION ADVISOR OUTPUT
========================

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

**Input:** "Help me get started with nutrition advisor"

**Output:** A structured nutrition advisor plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
