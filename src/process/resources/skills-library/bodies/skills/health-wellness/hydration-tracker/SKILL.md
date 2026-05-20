---
name: hydration-tracker
description: |
  Hydration optimization and habit tracking system that calculates personalized daily water intake based on body weight, activity level, and climate. Includes hydration schedules, dehydration detection, electrolyte balance guidance, habit stacking methodology, and specialized protocols for athletes.
  Use when the user asks about hydration tracker, or needs help with hydration optimization and habit tracking system that calculates personalized daily water intake based on body weight, activity level, and climate.
  Do NOT use when the request requires professional medical advice or falls outside the scope of hydration tracker.
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

# Hydration & Habit Tracker

> **Disclaimer:** This skill provides general wellness and health information for educational purposes only. It does NOT constitute medical advice, diagnosis, or treatment recommendations. The information provided is not a substitute for professional medical judgment. Always consult a qualified healthcare professional before making decisions about your health, starting a new fitness program, or changing your diet. If you are experiencing a medical emergency, contact emergency services immediately.

## When to Use

**Use this skill when:**
- User asks about hydration tracker
- User needs guidance on hydration tracker topics
- User wants a structured approach to hydration tracker

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

```
HYDRATION ASSESSMENT
======================

1. PHYSICAL DATA:
   - Body weight: ___ lbs / kg
   - Age: ___
   - Biological sex: ___

2. ACTIVITY LEVEL:
   [ ] Sedentary (desk job, minimal exercise)
   [ ] Lightly active (light exercise 1-3 days/week)
   [ ] Moderately active (moderate exercise 3-5 days/week)
   [ ] Very active (intense exercise 6-7 days/week)
   [ ] Athlete (training 2+ hours/day)

3. CLIMATE / ENVIRONMENT:
   [ ] Cool / temperate indoor
   [ ] Warm / humid
   [ ] Hot / arid
   [ ] Air-conditioned most of day
   [ ] Outdoor work
   [ ] Varies significantly
# ... (condensed) ...
   [ ] General health improvement

7. HABIT TRACKING PREFERENCES:
   [ ] Simple daily checkbox
   [ ] Detailed volume tracking
   [ ] App-based tracking
   [ ] Physical tracker (water bottle marks, journal)
   [ ] Habit stacking approach
```

## Daily Water Intake Calculation

### Base Calculation Methods

**Method 1: Body Weight Formula (most commonly recommended)**
```
Daily water (oz) = Body weight (lbs) x 0.5

Example: 160 lbs x 0.5 = 80 oz per day (about 10 cups or 2.4 liters)
```

**Method 2: Metric Calculation**
```
Daily water (mL) = Body weight (kg) x 30-35 mL

Example: 73 kg x 33 mL = 2,409 mL per day (about 2.4 liters)
```

**Method 3: General Guidelines (National Academies of Sciences)**
- Men: Approximately 125 oz (3.7 L) total water per day (from all sources)
- Women: Approximately 91 oz (2.7 L) total water per day (from all sources)
- About 80% from beverages, 20% from food

### Adjustment Factors

```
HYDRATION CALCULATOR
======================
Step 1: Base intake
  Body weight: ___ lbs x 0.5 = ___ oz base

Step 2: Activity adjustment
  Add for exercise: ___ oz
  (general: 16-24 oz per hour of exercise)
  (intense/hot: 24-32 oz per hour)

Step 3: Climate adjustment
  Hot/humid climate: Add 16-32 oz    -> + ___ oz
  Air-conditioned: No adjustment     -> + 0 oz
  High altitude (5000+ ft): Add 16 oz-> + ___ oz

Step 4: Special factors
  Caffeinated beverages: Add 8 oz per cup of coffee -> + ___ oz
  Alcohol: Add 8 oz per alcoholic drink             -> + ___ oz
  Pregnancy: Add 8-12 oz                            -> + ___ oz
  Breastfeeding: Add 32+ oz                         -> + ___ oz
  Illness (fever, vomiting, diarrhea): Add 16-32 oz -> + ___ oz

TOTAL DAILY TARGET: ___ oz (___ liters)

Divide into ___ servings of ___ oz throughout the day
```

### Intake by Category

| Category | Daily Intake Range | Notes |
|----------|-------------------|-------|
| Sedentary adult | 64-80 oz (1.9-2.4 L) | Minimum for general health |
| Active adult | 80-120 oz (2.4-3.5 L) | Depending on exercise intensity |
| Endurance athlete | 100-150+ oz (3-4.4+ L) | Plus during-exercise hydration |
| Pregnant | 80-100 oz (2.4-3 L) | Consult OB for specifics |
| Breastfeeding | 100-130 oz (3-3.8 L) | Increased demand for milk production |
| Older adults (65+) | 64-80 oz (1.9-2.4 L) | Thirst sensation may be reduced |

## Hydration Schedule Templates

### Standard Daily Schedule (80 oz target)

```
DAILY HYDRATION SCHEDULE
===========================
Time          | Amount | Running Total | Trigger/Habit
6:00-7:00 AM  | 16 oz  | 16 oz        | Upon waking (before coffee)
9:00 AM       | 8 oz   | 24 oz        | Morning break
10:30 AM      | 8 oz   | 32 oz        | Mid-morning
12:00 PM      | 12 oz  | 44 oz        | With lunch
2:00 PM       | 8 oz   | 52 oz        | Afternoon break
4:00 PM       | 8 oz   | 60 oz        | Mid-afternoon
6:00 PM       | 12 oz  | 72 oz        | With dinner
8:00 PM       | 8 oz   | 80 oz        | Evening (not too close to bed)

DAILY TOTAL: 80 oz

Adjust times to fit your schedule.
Taper off 1-2 hours before bed to avoid sleep disruption.
```

### Athlete Training Day Schedule (120 oz target)

```
ATHLETE HYDRATION SCHEDULE
=============================
Time          | Amount | Running Total | Notes
6:00 AM       | 16 oz  | 16 oz        | Upon waking
7:00 AM       | 8 oz   | 24 oz        | With breakfast
PRE-WORKOUT   | 16-20oz| 44 oz        | 2 hours before training
DURING WORKOUT| 7-10 oz| 54-64 oz     | Every 15-20 minutes
POST-WORKOUT  | 16-24oz| 78-88 oz     | Within 30 min after
12:00 PM      | 12 oz  | 100 oz       | With lunch
3:00 PM       | 8 oz   | 108 oz       | Afternoon
6:00 PM       | 8 oz   | 116 oz       | With dinner
8:00 PM       | 4 oz   | 120 oz       | Evening

POST-WORKOUT REHYDRATION PROTOCOL:
  Weigh before and after exercise
  Drink 16-24 oz for every pound lost during exercise
  Include electrolytes for sessions > 60 minutes
```

## Dehydration Signs and Stages

### Early Warning Signs (Mild Dehydration - 1-3% body weight loss)
- Thirst (already mildly dehydrated when you feel thirsty)
- Darker yellow urine
- Dry lips and mouth
- Slightly decreased energy
- Mild headache

### Moderate Dehydration (3-5% body weight loss)
- Very dark urine or decreased urine output
- Dry skin (skin tenting test: pinch back of hand, slow return)
- Dizziness or lightheadedness
- Rapid heartbeat
- Muscle cramps
- Headache
- Irritability

### Severe Dehydration (5%+ body weight loss - SEEK MEDICAL HELP)
- Very little or no urine output
- Very dry skin and mucous membranes
- Sunken eyes
- Rapid breathing and heartbeat
- Confusion or lethargy
- Fainting
- Low blood pressure

### Urine Color Chart

```
URINE COLOR HYDRATION GUIDE
==============================
Color               | Hydration Status      | Action
Clear/transparent   | Over-hydrated         | Reduce slightly
Pale straw          | Well hydrated         | Maintain current intake
Light yellow        | Hydrated              | Good - keep it up
Yellow              | Mildly dehydrated     | Drink 8-16 oz soon
Dark yellow         | Dehydrated            | Drink 16-24 oz now
Amber/honey         | Very dehydrated       | Drink immediately, increase daily intake
Brown/cola          | Severely dehydrated   | Seek medical attention

Note: Urine color can be affected by vitamins (B vitamins make it bright
yellow), medications, and certain foods (beets, asparagus). Use as a
general guide alongside other signs.
```

## Electrolyte Balance

### Key Electrolytes and Functions

| Electrolyte | Function | Food Sources | Daily Need |
|------------|----------|-------------|-----------|
| Sodium | Fluid balance, nerve function | Salt, broth, cheese | 1500-2300 mg |
| Potassium | Muscle function, heart rhythm | Bananas, potatoes, spinach, avocado | 2600-3400 mg |
| Magnesium | Muscle/nerve function, energy | Nuts, seeds, leafy greens, dark chocolate | 310-420 mg |
| Calcium | Bones, muscle contraction | Dairy, fortified foods, leafy greens | 1000-1300 mg |
| Chloride | Fluid balance, digestion | Salt, seaweed, tomatoes | 1800-2300 mg |

### When You Need Electrolytes (not just water)
- Exercise lasting more than 60 minutes
- Heavy sweating (hot weather, intense activity)
- Illness with vomiting or diarrhea
- Working outdoors in heat
- After consuming alcohol
- Low-carb or fasting diets

### DIY Electrolyte Drink Recipe

```
HOMEMADE ELECTROLYTE DRINK
=============================
Option 1: Simple
  - 16 oz water
  - 1/8 tsp salt
  - Squeeze of lemon or lime
  - 1 tsp honey (optional)

Option 2: Sports Performance
  - 32 oz water
  - 1/4 tsp salt
  - 1/4 tsp baking soda
  - 2 tbsp honey or maple syrup
  - 2 tbsp lemon juice

Option 3: Recovery
  - 16 oz coconut water (natural electrolytes)
  - Pinch of salt
  - Squeeze of citrus

Note: For intense training or medical situations,
commercial electrolyte solutions may be more appropriate.
```

## Habit Stacking Methodology

### Core Concept (from James Clear's Atomic Habits)

```
HABIT STACKING FORMULA:
"After I [CURRENT HABIT], I will [NEW HABIT]."
```

### Hydration Habit Stacks

```
HYDRATION HABIT STACKS
========================
Choose the stacks that fit your existing routine:

MORNING:
  "After I turn off my alarm, I will drink 16 oz of water."
  "After I start the coffee maker, I will drink a glass of water."
  "After I brush my teeth, I will fill my water bottle."

WORK:
  "After I sit down at my desk, I will drink 8 oz of water."
  "After I end a meeting, I will refill my water."
  "After I use the restroom, I will drink 8 oz of water."
  "After I check my email, I will take 3 sips of water."

MEALS:
  "After I sit down for a meal, I will drink a full glass of water."
  "After I finish eating, I will refill my water glass."

EXERCISE:
  "After I put on my workout clothes, I will drink 16 oz of water."
  "After I finish a set, I will take a sip of water."
  "After I complete my workout, I will drink 16-24 oz."

EVENING:
  "After I arrive home, I will drink a glass of water."
  "After I finish dinner, I will check my daily water total."
```

### The Two-Minute Rule

Start with the smallest possible version of the habit:
- Instead of "Drink 80 oz of water daily" -> "Fill my water bottle every morning"
- Instead of "Track every ounce" -> "Mark a checkbox when I finish a bottle"
- Build consistency first, optimize quantity second

## Tracking Systems

### Simple Daily Tracker

```
WEEKLY HYDRATION TRACKER
===========================
Target: ___ oz per day

        | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
--------|-----|-----|-----|-----|-----|-----|-----|
Glass 1 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
Glass 2 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
Glass 3 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
Glass 4 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
Glass 5 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
Glass 6 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
Glass 7 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
Glass 8 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
--------|-----|-----|-----|-----|-----|-----|-----|
Total oz|     |     |     |     |     |     |     |
Urine   |     |     |     |     |     |     |     |
color   |     |     |     |     |     |     |     |
Energy  |     |     |     |     |     |     |     |
(1-10)  |     |     |     |     |     |     |     |

Weekly average: ___ oz/day
Target met: ___/7 days
```

### Water Bottle Method

```
WATER BOTTLE TRACKING
=======================
Bottle size: ___ oz
Bottles needed per day: ___ (total target / bottle size)

Track refills:
  Bottle 1: [ ] Filled at ___
  Bottle 2: [ ] Filled at ___
  Bottle 3: [ ] Filled at ___
  Bottle 4: [ ] Filled at ___
  Bottle 5: [ ] Filled at ___

TIP: Use time-marked water bottles with hourly goals
printed on the side, or add your own marks with tape.
```

### 30-Day Hydration Challenge

```
30-DAY HYDRATION CHALLENGE
=============================
Start date: ___________
Daily target: ___ oz

Instructions:
  - Check off each day you meet your target
  - Track how you feel each week
  - Don't break the chain!

Week 1: [ ][ ][ ][ ][ ][ ][ ]  Energy: ___ Mood: ___ Notes: ___
Week 2: [ ][ ][ ][ ][ ][ ][ ]  Energy: ___ Mood: ___ Notes: ___
Week 3: [ ][ ][ ][ ][ ][ ][ ]  Energy: ___ Mood: ___ Notes: ___
Week 4: [ ][ ][ ][ ][ ][ ][ ]  Energy: ___ Mood: ___ Notes: ___
Days 29-30: [ ][ ]

Current streak: ___ days
Longest streak: ___ days
```

## Reminder Design

### Reminder Strategies

| Strategy | How It Works | Best For |
|----------|-------------|----------|
| Phone alarms | Set alarms every 1-2 hours | Structured schedules |
| App notifications | Use a hydration app | Tech-friendly users |
| Visual cues | Keep water bottle visible on desk | Visual learners |
| Habit stacking | Pair with existing habits | Routine-oriented people |
| Rubber band method | Move rubber bands from one wrist to the other per glass | Tactile learners |
| Tally marks | Mark your hand or a note card | Minimalists |
| Accountability partner | Check in with someone daily | Social motivation |

### Environment Design for Hydration

- Keep a full water bottle at your desk at all times
- Place a glass of water on your nightstand for morning
- Keep water visible in the fridge (front and center)
- Have water bottles in your car, gym bag, and work bag
- Replace soda/juice with sparkling water or infused water
- Use a larger bottle (32 oz) to reduce refill frequency

## Hydration for Athletes

### Pre-Exercise Protocol
- **2-4 hours before:** Drink 16-20 oz (500-600 mL)
- **15-30 minutes before:** Drink 8-12 oz (240-350 mL)
- **Assess:** Urine should be light yellow before starting

### During Exercise Protocol
- **General:** 7-10 oz (200-300 mL) every 10-20 minutes
- **Duration under 60 min:** Water is sufficient
- **Duration over 60 min:** Add electrolytes (sodium 300-600 mg/hour)
- **Hot conditions:** Increase intake; consider pre-cooling strategies

### Post-Exercise Protocol
- **Weigh before and after:** Drink 16-24 oz per pound lost
- **Within 30 minutes:** Begin rehydration with electrolytes
- **Recovery drink:** Water + sodium + carbohydrates for optimal absorption
- **Monitor:** Continue hydrating until urine returns to light yellow

### Sweat Rate Calculation

```
SWEAT RATE CALCULATOR
=======================
Step 1: Pre-exercise weight (nude or minimal clothing): ___ lbs
Step 2: Post-exercise weight: ___ lbs
Step 3: Weight change: ___ lbs (Step 1 - Step 2)
Step 4: Fluid consumed during exercise: ___ oz
Step 5: Convert weight to oz: ___ lbs x 16 = ___ oz

Sweat rate = (Weight change in oz + fluid consumed) / exercise duration in hours

Example:
  Pre: 170 lbs, Post: 168 lbs = 2 lbs lost = 32 oz
  Consumed 16 oz during 1 hour of exercise
  Sweat rate = (32 + 16) / 1 = 48 oz/hour

Your sweat rate: ___ oz/hour
Aim to replace 80% of sweat losses during exercise
Fully rehydrate after exercise
```

## What Counts Toward Hydration

### Beverages That Hydrate
| Beverage | Hydration Value | Notes |
|----------|----------------|-------|
| Water | Excellent | Gold standard |
| Herbal tea | Excellent | Caffeine-free varieties |
| Milk | Good | Also provides protein, calcium |
| Fruit-infused water | Excellent | Adds flavor without calories |
| Coconut water | Good | Natural electrolytes |
| Decaf coffee/tea | Good | Minimal diuretic effect |
| Diluted juice | Moderate | Watch sugar content |
| Broth/soup | Good | Also provides sodium |

### Beverages That May Dehydrate
| Beverage | Impact | Guidance |
|----------|--------|----------|
| Coffee (caffeinated) | Mild diuretic | Moderate amounts (3-4 cups) still provide net hydration |
| Tea (caffeinated) | Mild diuretic | Similar to coffee at moderate amounts |
| Alcohol | Diuretic | Match each drink with a glass of water |
| Energy drinks | Variable | High caffeine + sugar; not ideal for hydration |
| Sugary sodas | Minimal hydration | High sugar impairs absorption; avoid as primary source |

### Hydrating Foods (approximate water content)
| Food | Water Content |
|------|--------------|
| Cucumber | 96% |
| Lettuce | 96% |
| Celery | 95% |
| Watermelon | 92% |
| Strawberries | 91% |
| Cantaloupe | 90% |
| Oranges | 87% |
| Yogurt | 85% |
| Apples | 84% |
| Grapes | 81% |

## Common Hydration Myths

| Myth | Reality |
|------|---------|
| "You need 8 glasses a day" | Needs vary by individual; 8 glasses is a reasonable starting point but not universal |
| "Coffee dehydrates you" | Moderate coffee consumption provides net hydration |
| "Clear urine means you're hydrated" | Consistently clear urine may indicate over-hydration; aim for light yellow |
| "Thirst means you're already dehydrated" | Thirst is an early signal; mild dehydration begins before severe symptoms |
| "You can't drink too much water" | Over-hydration (hyponatremia) is real and dangerous, especially during endurance events |
| "Sports drinks are always better" | Water is sufficient for most activity under 60 minutes |


## Output Format

```
HYDRATION TRACKER OUTPUT
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

**Input:** "Help me get started with hydration tracker"

**Output:** A structured hydration tracker plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
