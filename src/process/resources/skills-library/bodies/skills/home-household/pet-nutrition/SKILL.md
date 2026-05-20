---
name: pet-nutrition
description: |
  Pet nutrition guide covering how to read pet food labels and AAFCO standards, feeding schedules by age and size, raw diet considerations, prescription diets, treats and portions, toxic foods lists for dogs and cats, weight management, hydration needs, and breed-specific nutritional requirements.
  Use when the user asks about pet nutrition, or needs help with pet nutrition guide covering how to read pet food labels and aafco standards, feeding schedules by age and size, raw diet considerations, prescription diets, treats and portions, toxic foods lists for dogs and cats, weight management, hydration needs, and breed-specific nutritional requirements.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of pet nutrition.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "pet-care guide health-wellness"
  category: "home-household"
  subcategory: "pet-care"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Pet Nutrition Advisor
## When to Use

**Use this skill when:**
- User asks about pet nutrition
- User needs guidance on pet nutrition topics
- User wants a structured approach to pet nutrition

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

1. **What type of pet?** (Dog / Cat)
2. **What breed and age?**
3. **What is your pet's current weight?** (And is it ideal, overweight, or underweight?)
4. **What are you currently feeding?** (Brand, type, amount)
5. **Does your pet have any health conditions?** (Allergies, kidney disease, diabetes, pancreatitis, etc.)
6. **What is your concern?** (General nutrition / Weight management / Diet change / Reading labels / Toxic food question)
7. **What is your budget for pet food?** (Budget / Mid-range / Premium / No limit)
8. **Does your pet have any food sensitivities or preferences?**
9. **Is your pet spayed/neutered?** (Affects caloric needs)
---
## Reading Pet Food Labels

### Understanding AAFCO Standards
```
AAFCO (Association of American Feed Control Officials):
- Sets nutritional standards for pet food in the US
- Does NOT test or certify food (common misconception)
- Defines nutrient profiles for "complete and balanced" nutrition
- Two life stages: "Growth and Reproduction" and "Adult Maintenance"
- "All Life Stages" meets the higher growth requirements
WHAT TO LOOK FOR ON LABELS:
1. AAFCO NUTRITIONAL ADEQUACY STATEMENT:
   Best: "[Product] is formulated to meet the nutritional levels
         for [Life Stage]."
   Also Good: "Animal feeding tests using AAFCO procedures substantiate
               for [Life Stage]."
2. GUARANTEED ANALYSIS (Minimum/Maximum):
   - Crude Protein (min %): Higher is generally better
   - Crude Fat (min %): Energy source
   - Crude Fiber (max %): Digestive health
   - Moisture (max %): Important for comparing wet vs dry
3. INGREDIENT LIST:
   - Listed in order of weight (before processing)
   - First 5 ingredients matter most
   - Look for named protein sources (chicken, beef, salmon)
   - Avoid vague terms ("meat meal," "animal by-products")
```

### Decoding Ingredient Labels
```
PROTEIN SOURCES (Best to Acceptable):
Excellent: "Deboned chicken," "Fresh salmon," "Turkey"
Good: "Chicken meal" (concentrated protein, moisture removed)
Acceptable: "Poultry meal" (less specific but still protein)
UNDERSTANDING "MEAL":
- "Chicken meal" = chicken with water removed (concentrated protein)
- Not inherently bad -- it's actually higher in protein by weight than "chicken"
- "Chicken" listed first may actually contain less protein than "chicken meal"
  second, because fresh chicken is 70% water
CARBOHYDRATE SOURCES:
Whole grains: Brown rice, oatmeal, barley (good fiber + nutrients)
Grain-free alternatives: Sweet potato, peas, lentils, chickpeas
NOTE ON GRAIN-FREE DIETS:
- FDA investigation into possible link between grain-free diets and
  dilated cardiomyopathy (DCM) in dogs
- No definitive conclusion yet, but discuss with your vet
- Grain-free is NOT inherently better or healthier
- Only feed grain-free if medically necessary (grain allergy)
FILLERS AND ADDITIVES:
Beneficial: Chelated minerals, probiotics, omega-3 sources (fish oil)
Acceptable: Natural preservatives (mixed tocopherols, rosemary extract)
Avoid: BHA, BHT, ethoxyquin (artificial preservatives)
Avoid: Propylene glycol, excessive salt or sugar
```

### Comparing Dry vs Wet vs Raw

| Factor | Dry Kibble | Wet/Canned | Raw |
|--------|-----------|------------|-----|
| Moisture | 6-10% | 75-85% | 60-70% |
| Calorie Density | High | Low | Medium |
| Dental Health | Mild benefit | No benefit | Bone chewing benefit |
| Shelf Life | Long | Long (unopened) | Short |
| Convenience | High | Medium | Low |
| Cost per Serving | Low | Medium-High | High |
| Palatability | Moderate | High | High |
| Hydration Benefit | Low | High | Moderate |

### Dry Matter Basis Comparison
```
To compare protein across foods with different moisture levels:
FORMULA:
Dry Matter Protein % = (Protein % on label) / (100 - Moisture %) x 100
Wet Food: 10% protein, 78% moisture
DM Protein = 10 / (100-78) x 100 = 45.5%
```
---
## Feeding Schedules by Age and Size

### Dog Feeding Schedule
```
PUPPIES (8 weeks - 4 months):
- Feed 3-4 times per day
- Puppy-specific food (higher protein, fat, calcium)
- Amount: Follow package guidelines, adjust based on body condition
- Small breeds: May need 4 meals (prone to hypoglycemia)
PUPPIES (4 months - 12 months):
- Feed 2-3 times per day
- Continue puppy food
- Large breeds: Transition to large-breed puppy food (controlled calcium)
- Small breeds: May transition to adult food at 9-12 months
ADULT DOGS (1-7 years):
- Feed 2 times per day (morning and evening)
- Adult maintenance formula
- Amount based on weight, activity level, metabolism
SENIOR DOGS (7+ years, varies by breed):
- Feed 2 times per day
- Senior formula (lower calories, joint support)
- May need smaller, more frequent meals if digestion slows
- Monitor weight closely
DAILY CALORIE REQUIREMENTS (APPROXIMATE):
Dog Weight | Inactive | Moderate | Active
-----------|----------|----------|-------
10 lbs     | 200 cal  | 275 cal  | 400 cal
20 lbs     | 325 cal  | 450 cal  | 650 cal
30 lbs     | 450 cal  | 600 cal  | 875 cal
50 lbs     | 650 cal  | 900 cal  | 1,300 cal
70 lbs     | 850 cal  | 1,150 cal| 1,650 cal
90 lbs     | 1,050 cal| 1,400 cal| 2,000 cal
Spayed/neutered pets may need 20-30% fewer calories.
```

### Cat Feeding Schedule
```
KITTENS (8 weeks - 6 months):
- Feed 3-4 times per day
- Kitten-specific food (higher protein and calories)
- Can offer unlimited kibble + scheduled wet food meals
- Kittens rarely overeat (unlike puppies)
KITTENS (6-12 months):
- Feed 2-3 times per day
- Continue kitten food until 12 months
- Begin transition to adult food at 10-12 months
ADULT CATS (1-10 years):
- Feed 2-3 meals per day (preferred over free-feeding)
- Measured portions based on weight
- Wet food at least once daily (hydration benefits)
- Cats are obligate carnivores: protein is critical
SENIOR CATS (10+ years):
- Feed 2-3 smaller meals
- Senior formula or highly digestible food
- May need increased protein (muscle maintenance)
- Monitor weight changes closely
DAILY CALORIE REQUIREMENTS (APPROXIMATE):
Cat Weight | Indoor/Inactive | Moderate | Active
-----------|----------------|----------|-------
6 lbs      | 150 cal        | 180 cal  | 220 cal
8 lbs      | 180 cal        | 220 cal  | 270 cal
10 lbs     | 210 cal        | 260 cal  | 320 cal
12 lbs     | 240 cal        | 300 cal  | 360 cal
14 lbs     | 270 cal        | 330 cal  | 400 cal
Obesity is the #1 nutritional problem in cats.
```
---
## Toxic Foods List

### Foods Toxic to Dogs

| Food | Toxicity Level | Symptoms | Notes |
|------|---------------|----------|-------|
| **Chocolate** | Moderate-Severe | Vomiting, diarrhea, seizures, death | Dark > Milk > White in toxicity |
| **Grapes/Raisins** | Severe | Kidney failure | Even small amounts can be fatal |
| **Xylitol** (sweetener) | Severe | Liver failure, hypoglycemia, death | Found in gum, candy, peanut butter |
| **Onions/Garlic** | Moderate | Anemia (destroys red blood cells) | All forms: raw, cooked, powder |
| **Macadamia Nuts** | Moderate | Weakness, vomiting, tremors | Usually not fatal |
| **Alcohol** | Severe | Vomiting, breathing difficulty, death | Even small amounts dangerous |
| **Caffeine** | Moderate-Severe | Restlessness, rapid breathing, seizures | Coffee, tea, energy drinks |
| **Avocado** | Mild-Moderate | Vomiting, diarrhea | Persin toxin in pit, skin, leaves |
| **Cooked Bones** | Moderate | GI obstruction, perforation | Splinter easily; raw bones are safer |
| **Yeast Dough** | Moderate | Bloating, alcohol production | Expands in stomach |
| **Salt (excessive)** | Moderate | Vomiting, diarrhea, sodium toxicity | Watch for salt rock lamps too |
| **Corn Cobs** | Moderate | GI obstruction | Do not pass through GI tract |

### Foods Toxic to Cats

| Food | Toxicity Level | Symptoms | Notes |
|------|---------------|----------|-------|
| **Onions/Garlic** | Severe | Anemia | Cats MORE sensitive than dogs |
| **Chocolate** | Moderate-Severe | Same as dogs | Cats rarely eat it but still toxic |
| **Grapes/Raisins** | Severe | Kidney failure | Same as dogs |
| **Alcohol** | Severe | Same as dogs | Very small amount is dangerous |
| **Caffeine** | Moderate-Severe | Same as dogs | |
| **Lilies** (flowers) | CRITICAL | Kidney failure, death | Even pollen can be fatal to cats |
| **Raw Fish** (excessive) | Moderate | Thiamine deficiency | Occasional is okay; daily is not |
| **Dog Food** (long-term) | Moderate | Nutritional deficiency | Lacks taurine and adequate protein |
| **Xylitol** | Moderate | Liver damage | Less data than dogs but still dangerous |
| **Essential Oils** | Variable | Liver damage, respiratory distress | Tea tree, peppermint, citrus especially |

### Safe Human Foods for Dogs and Cats
```
SAFE FOR DOGS (in moderation):
- Carrots (cooked or raw)
- Blueberries
- Apple slices (no seeds)
- Peanut butter (xylitol-free)
- Plain cooked chicken
- Green beans
- Watermelon (seedless)
- Pumpkin (plain, canned)
- Sweet potato (cooked)
- Rice (plain, cooked)
- Bananas (small amounts)
SAFE FOR CATS (in moderation):
- Cooked chicken or turkey (plain, boneless)
- Cooked salmon or tuna (small amounts)
- Cooked eggs
- Pumpkin (plain)
- Blueberries
- Cantaloupe
- Cooked carrots
IF YOUR PET EATS SOMETHING TOXIC:
1. Call your veterinarian immediately
2. ASPCA Animal Poison Control: (888) 426-4435 ($75 fee)
3. Pet Poison Helpline: (855) 764-7661 ($65 fee)
4. Note what was eaten, how much, and when
5. Do NOT induce vomiting unless directed by a professional
```
---
## Raw Diet Considerations

### Raw Diet Overview
```
TYPES OF RAW DIETS:
1. Commercially prepared raw (frozen or freeze-dried): Safest option
2. BARF (Biologically Appropriate Raw Food): Bones, organs, muscle, veggies
3. Prey model: Whole prey ratios without plant matter
4. Home-prepared raw: Custom recipes
POTENTIAL BENEFITS (Claimed):
- Shinier coat
- Smaller, firmer stools
- Improved energy
- Better dental health
- Reduced allergies
POTENTIAL RISKS (Documented):
- Bacterial contamination (Salmonella, E. coli, Listeria)
  * Risk to pet AND humans in household
  * Especially dangerous for immunocompromised people, children, elderly
- Nutritional imbalance if not properly formulated
- Bone fragment hazards (obstruction, perforation, broken teeth)
- More expensive and time-consuming
- No strong scientific evidence of superiority over quality commercial diets
IF PURSUING RAW:
- Consult a veterinary nutritionist (board-certified DACVN)
- Use commercially prepared raw with AAFCO statement
- If home-preparing: work with a nutritionist for balanced recipes
- Handle with food safety precautions (wash hands, surfaces, bowls)
- Not recommended for homes with immunocompromised individuals
- Not recommended for puppies/kittens (higher risk)
```
---
## Weight Management

### Body Condition Scoring (1-9 Scale)
```
1-3: UNDERWEIGHT
- Ribs, spine, hip bones easily visible
- Obvious loss of muscle mass
- No palpable body fat
- Action: Increase calories, vet check for underlying disease
4-5: IDEAL
- Ribs easily felt with slight fat covering
- Waist visible from above
- Abdominal tuck visible from side
- Action: Maintain current diet and exercise
6-7: OVERWEIGHT
- Ribs hard to feel under fat layer
- Waist barely visible from above
- Little abdominal tuck
- Action: Reduce calories 15-20%, increase exercise
8-9: OBESE
- Cannot feel ribs at all
- No waist visible, may have "barrel" shape
- Fat deposits on neck, limbs, base of tail
- Action: Vet consultation, structured weight loss plan
HEALTH RISKS OF OBESITY:
- Diabetes (especially cats)
- Arthritis and joint problems
- Heart disease
- Reduced lifespan (up to 2 years shorter)
- Respiratory issues
- Increased surgical/anesthetic risk
- Heat intolerance
```

### Weight Loss Protocol
```
STEP 1: VET CONSULTATION
- Rule out thyroid issues (hypothyroidism in dogs, rare in cats)
- Get target weight and timeline
- Discuss any food restrictions
STEP 2: CALCULATE CALORIES
- Target calories = RER for IDEAL weight x activity factor
- RER (Resting Energy Requirement) = 70 x (ideal weight in kg)^0.75
- Weight loss factor: RER x 1.0 (strict) to x 1.2 (moderate)
- Aim for 1-2% body weight loss per week
STEP 3: FEEDING PLAN
- Measure food precisely (use a kitchen scale)
- Feed 2-3 meals per day (no free-feeding)
- Reduce treats to <10% of daily calories
- Use portion of daily kibble as training treats
- Add water or low-sodium broth to food for fullness
- Consider weight management formula (higher fiber, lower calorie)
STEP 4: EXERCISE
Dogs: Gradually increase walks by 5 minutes per week
Cats: Interactive play 15-20 min daily, puzzle feeders
STEP 5: MONITOR
- Weigh every 2 weeks
- Body condition score monthly
- Adjust calories if loss is too fast or too slow
- Celebrate milestones
WEIGHT LOSS LOG:
Date | Weight | BCS | Calories/Day | Exercise | Notes
-----|--------|-----|-------------|----------|------
     |        |     |             |          |
```
---
## Prescription Diets

### Common Prescription Diets and Their Purposes

| Condition | Diet Type | Key Features | Major Brands |
|-----------|-----------|-------------|--------------|
| Kidney Disease | Renal Support | Low phosphorus, moderate protein | Royal Canin Renal, Hill's k/d |
| Urinary Crystals | Urinary Health | pH modification, controlled minerals | Royal Canin Urinary SO, Hill's c/d |
| Diabetes | Diabetic | Low carb, high protein (cats) | Royal Canin Diabetic, Hill's m/d |
| Allergies | Hydrolyzed/Novel Protein | Hydrolyzed protein or novel source | Royal Canin HP, Hill's z/d |
| GI Issues | Gastrointestinal | Highly digestible, low fat | Royal Canin GI, Hill's i/d |
| Joint Disease | Joint Support | Omega-3, glucosamine, chondroitin | Hill's j/d, Purina JM |
| Liver Disease | Hepatic Support | Moderate protein, low copper | Royal Canin Hepatic, Hill's l/d |
| Heart Disease | Cardiac | Low sodium, taurine, L-carnitine | Royal Canin Cardiac, Hill's h/d |
| Weight Loss | Metabolic/Satiety | Low calorie, high fiber | Hill's Metabolic, Royal Canin Satiety |
```
IMPORTANT NOTES:
- Prescription diets require veterinary recommendation
- Do not use without professional guidance
- They address specific medical conditions
- They are NOT better than regular food for healthy pets
- Follow transition guidelines carefully
- Regular monitoring required (bloodwork, etc.)
```
---
## Hydration

### Water Requirements
```
DOGS:
- General rule: 1 oz of water per pound of body weight per day
- 50-lb dog: approximately 50 oz (about 6 cups) per day
- More needed: hot weather, exercise, nursing, illness
- Less needed: dogs eating wet food
CATS:
- General rule: 3.5-4.5 oz of water per 5 lbs of body weight per day
- 10-lb cat: approximately 7-9 oz per day
- Cats have low thirst drive (desert-adapted ancestors)
- Chronic dehydration is common in cats eating only dry food
ENCOURAGING WATER INTAKE:
Dogs:
- Fresh water available at all times
- Clean bowl daily
- Multiple water stations
- Add ice cubes (some dogs enjoy this)
- Water fountain (movement attracts drinking)
Cats:
- Cat water fountains (many cats prefer running water)
- Wide, shallow bowls (whisker fatigue with deep bowls)
- Separate water from food station
- Multiple water stations
- Add water to wet food
- Flavor water with tuna juice (small amount, low sodium)
- Feed wet food at least once daily
DEHYDRATION SIGNS:
- Skin tent test: Pinch skin on back of neck; should snap back immediately
- Dry gums (tacky or sticky)
- Sunken eyes
- Lethargy
- Reduced urination
- Panting (cats: serious sign)
```
---
## Breed-Specific Nutritional Considerations

### Large/Giant Breed Dogs
```
PUPPIES:
- Large-breed puppy food (controlled calcium and phosphorus)
- Prevents too-rapid growth (skeletal problems)
- Calcium: 0.8-1.5% on dry matter basis (not more)
- Do NOT supplement calcium
- Feed to moderate growth rate (not maximum)
- Transition to adult food at 12-18 months (giant breeds 18-24 months)
ADULTS:
- Joint support supplements (glucosamine, chondroitin, omega-3)
- Monitor caloric intake (obesity worsens joint issues)
- Consider elevated feeding bowls (bloat risk is debated)
- Avoid exercise immediately after eating (bloat prevention)
- Feed 2-3 smaller meals instead of one large meal
```

### Small Breed Dogs
```
PUPPIES:
- Small-breed puppy formula (smaller kibble, calorie-dense)
- Feed 3-4 times per day (prone to hypoglycemia)
- Always have food available for very small puppies under 4 months
ADULTS:
- Higher calorie per pound needs (fast metabolism)
- Dental health is a major concern (small mouths, crowded teeth)
- Consider dental diet or dental chews
- Smaller, calorie-dense kibble
```

### Brachycephalic Breeds (Flat-faced)
```
CONSIDERATIONS:
- Difficulty eating from deep bowls (use flat or puzzle feeders)
- Prone to overheating (don't exercise after meals)
- May swallow more air while eating (gas, bloating)
- Slow feeder bowls recommended
- Elevated feeding position may help
```

### Cat Breeds
```
MAINE COON / LARGE BREEDS:
- Higher calorie needs during growth (slow maturing)
- Joint support for larger frame
- May benefit from larger kibble size
SIAMESE / ORIENTAL:
- Tend to be lean; may need slightly higher calories
- Can be picky eaters
PERSIAN / FLAT-FACED:
- Difficulty grasping food (almond-shaped kibble designs)
- Prone to eye-related eating difficulties
- May prefer wet food
BENGAL / ACTIVE BREEDS:
- Higher calorie needs for activity level
- May benefit from higher protein formulas
```
---
## Treats and Portions

### The 10% Rule
```
Treats should make up NO MORE than 10% of daily caloric intake.
Common Treat Calories:
- Small commercial treat: 5-15 cal
- Medium biscuit: 30-50 cal
- Milk-Bone (large): 115 cal
- Pig ear: 200+ cal
- Bully stick (6"): 80-100 cal
- Baby carrot: 4 cal
- Blueberry: 1 cal
- Piece of cheese (1" cube): 70 cal
- Hot dog slice: 15 cal
HEALTHY, LOW-CALORIE TREAT OPTIONS:
Dogs: Baby carrots, green beans, apple slices, blueberries, ice cubes
Cats: Freeze-dried single-ingredient treats, small pieces of cooked chicken
```
---
## Output Format

When providing nutrition guidance, present it as:
```
NUTRITION ASSESSMENT
Pet: [Species / Breed / Age / Weight]
Body Condition Score: [1-9]
Current Diet: [What they're eating]
Concern: [What needs addressing]
RECOMMENDED DIET PLAN:
Meal | Time | Food | Amount | Calories
-----|------|------|--------|--------
     |      |      |        |
Daily Total: _____ calories
FOOD RECOMMENDATIONS:
Primary: [Brand / Type]
Alternative: [Brand / Type]
Treats: [Type, max amount per day]
TRANSITION PLAN (7-10 days):
Day 1-2: 75% old / 25% new
Day 3-4: 50% old / 50% new
Day 5-7: 25% old / 75% new
Day 8+: 100% new
SUPPLEMENTS (if applicable):
[Supplement, dose, purpose]
MONITORING:
- Weigh every [frequency]
- Body condition score every [frequency]
- Next vet check: [timing]
FOODS TO AVOID:
[Specific to this pet's needs]
```

## Example

**Input:** "Help me get started with pet nutrition"

**Output:** A structured pet nutrition plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
