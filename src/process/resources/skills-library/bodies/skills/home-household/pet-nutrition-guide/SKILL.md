---
name: pet-nutrition-guide
description: |
  Provides life-stage feeding schedules, pet food label reading guidance, and portion recommendations by weight for dogs and cats. Covers puppy, kitten, adult, and senior feeding needs with specific frequency and quantity frameworks.
  Use when the user asks about feeding schedules, how much to feed a pet, choosing pet food, reading pet food labels, or nutrition by life stage for dogs or cats.
  Do NOT use for prescription diets, managing food allergies, treating obesity or underweight pets medically, or exotic pet nutrition. Dietary changes for health conditions require veterinary guidance.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "pet-care nutrition strategy"
  category: "home-household"
  subcategory: "pet-care"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Pet Nutrition Guide

## When to Use

**Use this skill when:**
- User asks how much to feed their dog or cat by weight, age, or life stage
- User wants a feeding schedule with specific times and meal frequencies for a puppy, kitten, adult, or senior pet
- User asks how to read a pet food label, compare brands, or interpret AAFCO statements
- User is choosing between food types (dry kibble, wet/canned, freeze-dried, semi-moist) and needs a principled comparison
- User asks how to transition a pet from one food to another safely
- User wants to understand calorie density, portion sizing, or how to convert label numbers to actual cup or gram measurements
- User asks whether treats are contributing to weight gain, or how to calculate a treat budget
- User asks about body condition scoring and how to assess their pet's weight at home

**Do NOT use when:**
- Pet has a diagnosed medical condition requiring a prescription diet (kidney disease, diabetes, pancreatitis, struvite crystals, inflammatory bowel disease) -- refer to the veterinarian and the prescription-diet guidance context
- Pet is clinically obese (body condition score 8-9/9) or severely underweight -- these require a veterinary weight management protocol, not a general feeding guide
- User is asking about food allergy diagnosis or elimination diet trials -- these are clinical procedures requiring veterinary supervision
- User is asking about nutrition for rabbits, guinea pigs, birds, reptiles, fish, or other exotic pets -- species-specific nutrition is outside this skill's scope
- User reports the pet has eaten something toxic -- direct immediately to the ASPCA Animal Poison Control Center (24/7) or an emergency veterinarian; do not attempt to navigate nutrition guidance while a toxicological emergency may be occurring
- User wants a complete homemade diet formulation -- nutritionally complete home cooking requires a board-certified veterinary nutritionist (DACVN) using software like Balance IT or similar; this skill does not substitute for that expertise
- User wants a raw diet formulation -- raw diet safety and nutritional completeness require specialized veterinary nutritionist guidance; see Edge Cases for how to acknowledge and redirect

**Important scope note:** This skill covers general nutrition for healthy dogs and cats. "Healthy" means no active medical conditions affecting metabolism, digestion, organ function, or immune response. When in doubt about whether a health condition changes the dietary picture, recommend a veterinary consultation before implementing any plan.

---

## Process

### Step 1: Gather Essential Pet Information

Before producing any feeding guidance, collect the following parameters. Missing data yields dangerously imprecise recommendations.

- **Species:** Dog or cat -- these are metabolically distinct animals with fundamentally different nutritional requirements (cats are obligate carnivores; dogs are omnivores). Never apply dog nutrition logic to cats.
- **Age in months or years:** This determines life stage classification, which drives calorie multipliers, meal frequency, and nutrient priorities.
- **Current body weight:** Required for resting energy requirement (RER) calculation. If the user does not have an exact weight, ask for an estimate and flag that the plan should be recalculated once a precise weight is obtained.
- **Breed and expected adult size (for puppies):** Giant breed puppies (expected adult weight over 70 lbs) have fundamentally different growth nutrition needs than small breed puppies. This is not a cosmetic distinction -- getting it wrong causes orthopedic disease.
- **Reproductive status:** Intact vs. spayed/neutered affects calorie needs. Spayed/neutered dogs need approximately 20-30% fewer calories than intact dogs of the same size and activity level. Neutered cats may need up to 25-30% fewer calories.
- **Activity level:** Use a structured scale -- sedentary/indoor (little or no exercise), low active (under 20 minutes exercise per day), moderately active (30-60 minutes daily), highly active (working dogs, agility dogs, hunting dogs, 60+ minutes vigorous daily exercise).
- **Current food:** If the user already has a food, ask for the kcal/cup or kcal/can from the label. This is the single most important number for portion accuracy.
- **Body condition score (BCS):** Ask the user to assess or describe the pet's body shape. A simplified guide: ribs easily felt without pressure (ideal), ribs hard to feel (overweight), ribs visually prominent (underweight).

### Step 2: Classify Life Stage and Apply the Correct Nutritional Framework

Life stage is the master variable that governs everything else in the nutrition plan. Use this classification table precisely -- it is not a rough approximation.

**Life stage classification:**
| Life Stage | Dog Age | Cat Age | Defining Nutritional Characteristics |
|---|---|---|---|
| Neonatal | 0-4 weeks | 0-4 weeks | Mother's milk or commercial milk replacer only -- outside this skill's scope |
| Weaning | 4-8 weeks | 4-8 weeks | Transition to softened solid food; high fat and calorie density required |
| Puppy/Kitten (growth) | 8 weeks to 12 months (small/medium breeds); up to 18-24 months (large/giant breeds) | 8 weeks to 12 months | High protein (min 22% DM for dogs, 30% DM for cats), high fat, higher calorie density, calcium:phosphorus ratio matters critically for bone development |
| Adult maintenance | 1-7 years (varies by size; giant breeds may be "senior" at 5-6) | 1-10 years | Balanced macronutrients; prevent excess calorie intake; protein minimum 18% DM dogs, 26% DM cats |
| Senior | 7+ years for medium dogs; 5-6 for giant breeds; 10+ for cats | 10+ years | Often requires higher protein despite lower calories (muscle mass preservation); reduced phosphorus if kidney function declining; increased fiber for GI motility |
| Pregnant/Lactating | Any | Any | Requires puppy/kitten food or a food labeled "for all life stages"; calorie needs increase 25-50% in late pregnancy and up to 75-200% during peak lactation -- consult veterinarian |

**Key nutritional distinctions by species:**
- Cats require dietary taurine (cannot synthesize sufficient quantities) -- deficiency causes dilated cardiomyopathy and retinal degeneration. Only feed foods labeled for cats.
- Cats require dietary arachidonic acid (cannot convert linoleic acid) -- plant-based fat sources are insufficient.
- Cats are poor at metabolizing carbohydrates; high-carb diets contribute to obesity and diabetes.
- Dogs can safely eat a wider range of macronutrient profiles; they can synthesize taurine but some breeds (Golden Retrievers, Boxers, Cocker Spaniels) have shown possible taurine-related cardiomyopathy linked to certain grain-free diets -- the FDA is investigating this association. If the user's dog is one of these breeds, note the grain-free DCM concern.

### Step 3: Calculate Resting Energy Requirement and Apply Life Stage Multiplier

Use the established veterinary formula for RER, then multiply by the appropriate life stage factor.

**RER formula (applies to both dogs and cats):**
RER (kcal/day) = 70 x (body weight in kilograms)^0.75

For quick mental math without a calculator, use the linear approximation valid for pets 2-45 kg:
RER ≈ 30 x (weight in kg) + 70

**Life stage multipliers (Daily Energy Requirement = RER x multiplier):**
| Life Stage / Condition | Multiplier |
|---|---|
| Neutered adult, indoor/low activity | 1.2 |
| Intact adult, low activity | 1.4 |
| Neutered adult, moderate activity | 1.4-1.6 |
| Intact adult, moderate activity | 1.6 |
| Highly active / working dog | 2.0-5.0 (varies enormously by work type) |
| Puppy under 4 months | 3.0 |
| Puppy 4 months to adult size | 2.0 |
| Large/giant breed puppy (conservative growth) | 1.5-2.0 |
| Weight loss (supervised) | 1.0 (do not go below RER without veterinary supervision) |
| Senior, low activity, neutered | 1.1-1.2 |
| Cat, neutered indoor | 1.0-1.2 |
| Cat, intact | 1.2-1.4 |
| Kitten (under 6 months) | 2.5 |
| Kitten (6-12 months) | 2.0 |

**Converting DER to food volume:**
1. Find the food's calorie density on the label: expressed as kcal/cup for dry food, kcal/can or kcal/kg for wet food.
2. Divide DER by calorie density to get daily food volume.
3. Divide daily volume by number of meals for per-meal portion.

This calculation -- not the bag's feeding chart -- is the correct method. Manufacturer feeding charts are conservative marketing guidelines that typically run 20-30% over actual needs.

### Step 4: Set Feeding Frequency and Schedule

Frequency is not arbitrary -- it is tied to digestive physiology and behavioral management.

**Recommended meal frequency by life stage:**
| Age / Stage | Dogs | Cats |
|---|---|---|
| 8-12 weeks | 4 meals/day evenly spaced | 4 meals/day or ad libitum dry kibble for kittens only |
| 3-6 months | 3 meals/day | 3 meals/day |
| 6-12 months | 2-3 meals/day | 2-3 meals/day |
| Adult (1+ years) | 2 meals/day (preferred) or 1 | 2-3 meals/day; meal feeding strongly preferred over free-choice |
| Senior | 2 meals/day; consider 3 smaller meals for seniors with GI issues | 2-3 meals/day |

**Frequency rationale -- do not skip this when explaining to users:**
- Two meals per day for adult dogs reduces gastric acid accumulation and hunger-driven scavenging behavior. Large deep-chested breeds (Great Danes, German Shepherds, Standard Poodles, Weimaraners, Rottweilers) should always be fed twice daily and should rest 1 hour before and after eating -- gastric dilatation-volvulus (GDV/bloat) is a life-threatening emergency with a mortality rate of 15-20% even with emergency surgery.
- Free-feeding (leaving food out all day) is appropriate only for kittens under 6 months with high energy needs and no obesity risk. For adult cats, free-feeding is a primary driver of the 60% overweight/obesity prevalence in the US cat population.
- Consistent meal times for puppies support house training -- predictable eating leads to predictable elimination within 15-30 minutes of eating.
- For cats fed wet food: serve at room temperature or slightly warmed (not hot). Cats have a thermoregulatory preference for food near body temperature (~38°C / 100°F), which mimics fresh prey. Cold refrigerated wet food is less palatable and can suppress appetite in finicky cats.

### Step 5: Teach Pet Food Label Reading in Depth

A user who can read a label confidently is better equipped than one who merely follows a plan. Teach all five components.

**Component 1: AAFCO Nutritional Adequacy Statement**
- This is the single most important sentence on the label. It must say one of two things:
  - "[Food name] is formulated to meet the nutritional levels established by the AAFCO Dog/Cat Food Nutrient Profiles for [life stage]." -- this means the company calculated it on paper. Acceptable but lower standard.
  - "[Food name] has been substantiated by feeding tests using AAFCO procedures for [life stage]." -- this means the food was actually fed to animals in a feeding trial. Higher standard.
- "For all life stages" means the food meets puppy/kitten standards (the most demanding tier) and is appropriate for any age. This is not necessarily better for adults -- it may provide excess nutrients for a sedentary neutered adult.
- No AAFCO statement means the food is nutritionally unverified. Do not feed it as a primary diet.
- "For supplemental or intermittent feeding only" means it is not a complete diet. Treats, toppers, and broths often carry this statement -- they cannot be the sole food source.

**Component 2: Ingredient List**
- Ingredients are listed by pre-cooking weight, which can be misleading. Chicken is 70% water; chicken meal has had the water removed and is actually more protein-dense per pound.
- "Chicken" as the first ingredient followed by four grain or starch ingredients means the grains collectively outweigh the chicken.
- Ingredient splitting: manufacturers sometimes list corn as "corn flour," "corn gluten meal," and "ground corn" separately, each lower on the list, when combined they would be the dominant ingredient.
- Named protein sources (chicken, beef, salmon, turkey) are preferable to unnamed sources ("meat," "animal by-products," "poultry").
- "By-products" are not inherently inferior -- chicken by-product meal includes organs that are nutritionally dense. The concern is with unnamed, unspecified by-products where the protein source is unknown.
- Avoid foods where the first two ingredients are grains or starches for carnivore-leaning diets. For cats especially, look for named meat or fish as the first three ingredients.

**Component 3: Guaranteed Analysis (GA)**
- The GA reports minimum protein, minimum fat, maximum fiber, and maximum moisture. These are guarantees, not precise values.
- Because wet food contains 75-82% moisture and dry food contains 8-12%, direct GA comparison between food types is meaningless. Convert to dry-matter basis (DMB).
- **Dry-matter basis conversion:** DMB% = (Nutrient% / (100 - Moisture%)) x 100
  - Example: Wet food with 9% protein, 78% moisture: 9 / (100-78) x 100 = 40.9% protein DMB
  - Example: Dry food with 28% protein, 10% moisture: 28 / (100-10) x 100 = 31.1% protein DMB
  - The wet food appears to have less protein on the label but actually has more on a dry-matter basis
- Minimum protein for dogs (adult): 18% DMB minimum by AAFCO; quality foods typically run 25-35% DMB
- Minimum protein for cats (adult): 26% DMB minimum by AAFCO; quality foods typically run 35-50% DMB for wet, 30-40% for dry
- Fat: minimum 5.5% DMB for dogs, 9% DMB for cats (AAFCO minimums). Growing animals need higher fat.
- Fiber: under 5% DMB is typical for most commercial foods; higher fiber (8-10%) may appear in weight management formulas.

**Component 4: Calorie Content Statement**
- Required on all US pet food labels since 2013. Typically found near the feeding guidelines.
- Expressed as kcal ME (metabolizable energy) per kilogram, and per common household unit (cup or can).
- Per-cup calorie density ranges significantly: low-density dry foods run 270-320 kcal/cup; most standard kibbles run 330-400 kcal/cup; high-fat performance formulas run 450-550+ kcal/cup. Using a 400 kcal/cup formula when you assume 330 kcal/cup causes 20% overfeeding daily.
- If the kcal/cup is not on the label, the manufacturer is required to provide it on request. Without this number, accurate portioning is impossible.

**Component 5: Life Stage, Breed Size, and Manufacturing Information**
- Check whether the food is formulated for the pet's life stage specifically.
- Large breed puppy foods are not the same as puppy foods -- they have controlled calcium (0.7-1.2% DMB) and phosphorus (0.6-1.1% DMB) levels and a Ca:P ratio of 1:1 to 1.3:1. Excess calcium in large breed puppies does not get excreted -- it deposits in bone and accelerates abnormal growth.
- "Made in USA" does not mean ingredients are sourced in the USA. Look for "made with ingredients from the USA" if sourcing matters to the user.
- Lot numbers and expiration dates matter -- always check that kibble is within 18 months of the manufacturing date. Fats in kibble oxidize over time, reducing palatability and potentially producing harmful peroxides.

### Step 6: Address Treat Calories and Common Supplement Questions

Treats are the most overlooked calorie source in pet nutrition. Handle this systematically.

**Treat calorie budget:**
- Maximum 10% of daily caloric intake from treats. This is not a soft guideline -- it is the threshold above which the diet's nutritional balance is meaningfully disrupted.
- Calculate the budget: DER x 0.10 = maximum treat calories per day
- Common treat calorie counts: small dog biscuit (25-40 kcal), medium rawhide chew (50-100 kcal), dental chew (60-100 kcal), peanut butter (1 teaspoon = 32 kcal), commercial training treat (3-10 kcal each)
- Strategy for high-frequency training: use the pet's daily kibble ration as training rewards. This eliminates the treat calorie problem entirely.
- Safe low-calorie human foods as treats for dogs: baby carrots (4 kcal), green beans (2 kcal per bean), watermelon chunks without seeds (5-8 kcal), plain cooked chicken shredded (9 kcal per tablespoon), blueberries (1 kcal each)
- Safe low-calorie treats for cats: small piece of plain cooked chicken (~5 kcal), plain cooked shrimp (~7 kcal), plain cooked tuna in water (1 teaspoon = ~8 kcal, but limit due to mercury and phosphorus)

**Foods that are toxic to dogs:** Chocolate (theobromine), grapes and raisins (mechanism unknown but causes acute kidney failure), onions and garlic (all forms, including powdered -- cause hemolytic anemia), xylitol (artificial sweetener found in peanut butter, gum, toothpaste -- causes severe hypoglycemia), macadamia nuts (neurological effects), avocado (persin toxicity), cooked bones (splintering risk), raw dough (yeast expansion and alcohol toxicity), alcohol.

**Foods that are toxic to cats:** All of the above plus: raw fish (thiamine deficiency with regular feeding), raw eggs (avidin blocks biotin absorption), milk/dairy (most adult cats are lactose intolerant despite the cultural image -- causes diarrhea), dog food as a primary diet (taurine-deficient for cats).

**Supplements:** Most pets eating a complete and balanced diet do not need supplements. Exceptions where evidence supports supplementation:
- Omega-3 fatty acids (EPA/DHA from fish oil): 20-55 mg EPA+DHA per kg body weight for dogs; 10-20 mg/kg for cats. Benefits include coat health, inflammatory modulation, and possible joint support. Use fish oil, not flaxseed oil (cats cannot convert ALA to EPA/DHA efficiently; dogs convert poorly).
- Probiotics: evidence is mixed but generally safe. Useful during antibiotic treatment, GI upset, or transition periods. Canine/feline-specific strains (Lactobacillus acidophilus, Bifidobacterium animalis) are preferable to human probiotics.
- Never supplement calcium to pets on a complete and balanced commercial diet -- excess calcium in puppies causes orthopedic disease, and excess calcium in adult dogs can cause urinary calcium oxalate stones.

### Step 7: Produce the Comprehensive Nutrition Plan

Compile all gathered information and calculations into the output format below. Include all sections -- do not skip body condition monitoring or the label checklist, as these drive ongoing management after the initial plan.

---

## Output Format

```
## Pet Nutrition Plan: [Pet Name or Description]

### Pet Profile
| Parameter            | Value                                         |
|----------------------|-----------------------------------------------|
| Species              | [Dog / Cat]                                   |
| Breed / Size class   | [Breed or small/medium/large/giant]           |
| Age                  | [Age in weeks, months, or years]              |
| Current weight       | [Weight in lbs and kg]                        |
| Life stage           | [Puppy/Kitten / Adult / Senior]               |
| Reproductive status  | [Spayed/Neutered / Intact]                    |
| Activity level       | [Sedentary / Low / Moderate / High / Working] |
| Body condition score | [1-9 scale: Underweight <4 / Ideal 4-5 / Overweight >5] |
| Health status        | [Healthy / Any noted conditions]              |

---

### Calorie Calculation
| Step                            | Value                                     |
|---------------------------------|-------------------------------------------|
| Weight in kg                    | [X] kg                                    |
| RER formula                     | 70 x (X kg)^0.75 = [RER] kcal/day        |
| Life stage multiplier           | [X.X] ([reason -- neutered adult, etc.])  |
| Daily Energy Requirement (DER)  | [RER x multiplier] = [DER] kcal/day      |
| Adjustment for BCS              | [+/- X% if overweight or underweight]     |
| **Final daily calorie target**  | **[X] kcal/day**                          |

---

### Food Portion Calculation
| Parameter               | Value                                         |
|-------------------------|-----------------------------------------------|
| Food type               | [Dry kibble / Wet / Combination]              |
| Food calorie density    | [X] kcal per cup (dry) / kcal per can (wet)  |
| Daily portion           | [daily kcal ÷ calorie density] = [X cups/cans/grams] |
| Meals per day           | [X meals]                                    |
| Portion per meal        | [X cups / grams / half-cans per meal]        |

**Measuring note:** [Reminder to use a kitchen scale for dry food if possible; note that a standard 8-oz measuring cup holds different weights of different kibbles -- gram measurement is more accurate]

---

### Daily Feeding Schedule
| Time          | Meal                | Portion                    | Notes                        |
|---------------|---------------------|----------------------------|------------------------------|
| [7:00 AM]     | [Breakfast]         | [X cups / X grams]         | [Any specific instructions]  |
| [12:00 PM]    | [Midday, if 3x]     | [X cups / X grams]         | [Puppies/kittens only]       |
| [6:00 PM]     | [Dinner]            | [X cups / X grams]         | [Any specific instructions]  |

---

### Treat Budget
| Parameter               | Value                                               |
|-------------------------|-----------------------------------------------------|
| 10% treat allowance     | [DER x 0.10] = [X] kcal/day maximum from treats    |
| Recommended treat types | [Species-appropriate options with kcal per treat]  |
| Training approach       | [Kibble-as-treat option if high-frequency training] |
| Foods to NEVER give     | [Toxic foods specific to this species]             |

---

### Food Label Checklist
- [ ] AAFCO statement present and matches life stage: "[Life stage of pet]"
- [ ] AAFCO feeding trial claim (preferred over formulation claim)
- [ ] Named protein source as first ingredient: ________________________
- [ ] Calorie content noted: _______ kcal per cup / per can
- [ ] No "supplemental or intermittent feeding only" statement
- [ ] Check expiration date: within 18 months of manufacture date for dry food
- [ ] Large breed puppy: calcium 0.7-1.2% DMB, Ca:P ratio 1:1 to 1.3:1 [include only if puppy]
- [ ] Dry-matter protein comparison completed if comparing wet and dry options

---

### Body Condition Monitoring Protocol
**How to assess body condition at home:**
- **Ribs:** Run hands along both sides of the rib cage without pressing hard. You should feel each rib distinctly under a thin, even layer of soft tissue. If ribs require firm pressure to feel: overweight. If ribs visible or feel sharp: underweight.
- **Waist:** View from above. There should be a visible narrowing behind the rib cage. No visible waist = overweight.
- **Tuck:** View from the side. The belly should slope upward behind the rib cage. Level or sagging belly = overweight.

**Monitoring schedule:**
| Frequency   | Action                                                    |
|-------------|-----------------------------------------------------------|
| Every 2 weeks | Manual rib/waist/tuck check; adjust portions if trending wrong |
| Monthly     | Weigh pet (vet scale, or weigh self then hold pet)        |
| Every 3-4 months | Full body condition reassessment; compare to baseline |

**Portion adjustment rules:**
- If overweight (ribs hard to feel, no waist): reduce daily calories by 10-15% for 3-4 weeks, then reassess
- If underweight (ribs sharp, visible): increase daily calories by 10-15% for 2 weeks, then reassess
- Never exceed 1-1.5% of body weight lost per week for dogs; 0.5-1% per week for cats

---

### Food Transition Plan (if switching foods)
| Day Range   | Current Food | New Food | Instructions                              |
|-------------|-------------|----------|-------------------------------------------|
| Days 1-2    | 75%         | 25%      | Mix thoroughly; serve at regular meal times |
| Days 3-4    | 50%         | 50%      | Mix thoroughly                            |
| Days 5-6    | 25%         | 75%      | Mix thoroughly                            |
| Day 7+      | 0%          | 100%     | Transition complete                       |
| If GI upset | Return to previous ratio for 2-3 days, then advance more slowly |

---

### Veterinary Follow-Up Recommendations
- [ ] [Specific action based on findings -- e.g., weigh-in check in 30 days]
- [ ] [Any referral indicated -- e.g., BCS >6, weight management program]
- [ ] Annual nutritional assessment at wellness exam
```

---

## Rules

1. **Never skip the calorie calculation step.** Giving a volume recommendation (cups per day) without knowing the food's calorie density is a guess, not a plan. Every food has different calorie density. If the user does not know the kcal/cup, tell them exactly where to find it and how to use it.

2. **Never use bag feeding charts as the authoritative portion guide.** Manufacturer feeding charts are printed to maximize consumption and typically recommend 20-30% more food than most pets need for maintenance. Calculate portions from DER divided by calorie density, then use the bag chart only as a rough sanity check.

3. **Apply species-appropriate logic at all times.** Cats are obligate carnivores and cannot thrive on dog food, vegan diets, or low-protein formulations. Do not import dog nutrition reasoning into cat guidance. If there is any ambiguity about species, ask before proceeding.

4. **Flag the GDV risk for all large, deep-chested dog breeds.** Great Danes, Standard Poodles, German Shepherds, Weimaraners, Irish Setters, Boxers, Saint Bernards, Rottweilers, and Dobermans are high-risk. Always recommend twice-daily feeding, avoiding vigorous exercise 1 hour pre- and post-meal, and using a floor-level bowl (elevated feeders may increase GDV risk per some studies, despite earlier conflicting advice).

5. **Always include a treat calorie budget.** Treats are the most common hidden source of excess calories and are the first thing to audit when a pet is gaining weight despite an appropriate kibble portion. Calculate the 10% budget explicitly using the pet's DER, and name it in kcal.

6. **Never recommend calcium supplements for pets on complete and balanced diets.** Over-supplementing calcium causes developmental orthopedic disease in puppies and calcium oxalate urinary stones in adults. This is a frequently requested but contraindicated intervention.

7. **Call out the spayed/neutered calorie reduction explicitly.** Neutering reduces caloric maintenance needs by 20-30% in dogs and 25-30% in cats due to reduced metabolic rate and reduced activity associated with the hormonal change. Failure to reduce food after spay/neuter is a primary cause of post-surgery weight gain. Always note this if the pet's reproductive status is known.

8. **Do not apply adult cat calorie logic to kittens or senior cats.** Kittens need 2.0-2.5x RER; adult indoor cats need 1.0-1.2x RER; senior cats often need more protein (not fewer kcal from protein) to prevent sarcopenia (muscle wasting), even when total calories are reduced. These are distinct frameworks.

9. **Dry-matter basis conversion is mandatory when comparing wet and dry food protein content.** A wet food with 8% protein and a dry food with 28% protein may have nearly identical protein concentrations on a dry-matter basis. Presenting raw label numbers without conversion is misleading and undermines the user's ability to make informed food choices.

10. **Escalate immediately and unambiguously for these red flags:** cat not eating for more than 24-36 hours (risk of hepatic lipidosis, which can develop in 48-72 hours of food restriction in overweight cats), any pet that lost more than 10% of body weight in under a month without intentional dietary change, puppies or kittens under 12 weeks not eating (hypoglycemia risk is rapid and severe), any pet with concurrent vomiting, diarrhea, and appetite loss lasting more than 12-24 hours. For all of these, direct to a veterinarian before implementing any nutrition plan.

---

## Edge Cases

**Large breed puppy calcium management:**
Large and giant breed puppies (expected adult weight over 50 lbs) must eat large-breed-specific puppy food -- not standard puppy food, not adult food, and not puppy food supplemented with calcium. Their bone remodeling is driven by absolute calcium intake, not the Ca:P ratio alone. Unlike small breed puppies, they cannot regulate intestinal calcium absorption efficiently and absorb excess calcium passively. Target calcium: 0.7-1.2% DMB, phosphorus: 0.6-1.1% DMB. Growth rate should be steady and moderate -- the goal is lean growth, not maximum growth rate. An underweight large breed puppy that is otherwise healthy should be gradually increased in calories, but never pushed to rapid catch-up growth. Advise the owner to work with a veterinarian for growth chart tracking at 3-month intervals.

**Post-spay/neuter transition:**
Within 1-3 months of spay or neuter surgery, most dogs and cats begin gaining weight on their previous food portions. The metabolic rate drops and the hormonal drive toward activity diminishes. Advise users to reduce daily calories by 20-25% beginning 4-6 weeks post-surgery if weight gain is observed, or prophylactically at the 1-month mark. Some manufacturers produce post-neutering specific formulas with higher protein-to-calorie ratios designed to maintain lean mass. These are legitimate options.

**Picky or food-refusing cat:**
A cat that refuses food for over 24 hours requires veterinary evaluation -- this is not a preference issue to solve with palatability tricks alone. However, for cats that are eating but inconsistently or with little enthusiasm: (1) try warming wet food to approximately 38°C (100°F); (2) add a small amount of low-sodium broth (chicken, no garlic, no onion) to wet food; (3) try a different texture -- some cats prefer pate, others prefer shredded or gravy-style; (4) ensure the bowl is wide and shallow -- cats have touch-sensitive whiskers and deep narrow bowls cause "whisker fatigue" and food avoidance. Do not cycle through multiple foods rapidly -- cats can develop food aversions to foods they ate while feeling nauseous, creating lasting refusals. If a cat has been on the same food for over 6 months and suddenly refuses it, rule out medical causes first.

**Multi-pet household with different life stage or calorie needs:**
This is extremely common (puppy and adult dog, senior cat and adult cat) and requires a management strategy. Recommended approaches: (1) feed in completely separate rooms with doors closed to prevent resource guarding and cross-eating; (2) use microchip-activated feeders that open only for the correct pet (commercially available and highly effective); (3) feed the food-motivated pet in a crate or behind a baby gate while the other eats freely; (4) pick up all food bowls after 15-20 minutes and feed at consistent scheduled times -- free-feeding in any multi-pet household with differing needs is nearly unmanageable.

**Raw diet inquiry:**
If a user asks about raw feeding, acknowledge that it is a deeply held preference for many pet owners, do not dismiss it dismissively, but provide complete information: raw meat diets carry documented risks of bacterial contamination (Salmonella, Listeria monocytogenes, Campylobacter, E. coli) that affect both the pet and all humans in the household, including immunocompromised individuals, children under 5, and the elderly. The FDA, American Veterinary Medical Association (AVMA), and American Animal Hospital Association (AAHA) all advise against raw meat diets. Additionally, homemade raw diets are almost universally nutritionally incomplete when analyzed -- a study published in the Journal of Nutritional Science found over 95% of homemade pet diets contain at least one nutritional deficiency or excess. If the user is committed to raw feeding: strongly recommend a board-certified veterinary nutritionist (DACVN) to formulate and verify the diet, recommend commercial frozen raw diets that have been third-party tested and carry AAFCO statements over homemade, and advise on safe handling practices. This skill does not provide raw diet formulations.

**Senior cat protein needs:**
A common misconception is that senior cats need low-protein diets. This was derived from research on dogs with kidney disease and improperly applied to healthy aging cats. Healthy senior cats actually benefit from higher protein intake (40-50% DMB) to counter sarcopenia -- the age-related loss of lean muscle mass that is the primary driver of reduced quality of life and functional decline in aging cats. Only cats with confirmed, diagnosed chronic kidney disease (CKD) require phosphorus-restricted, protein-moderated diets, and this must be managed by a veterinarian. For healthy senior cats, the directive is: maintain or slightly increase protein content, control total calories, and monitor body weight carefully (weight loss in a senior cat is a significant clinical sign warranting veterinary evaluation, not a feeding adjustment).

**Weight gain in a newly adopted pet:**
Shelters often feed ad libitum or in controlled portions based on their own protocols. The new owner has no reliable baseline. Start by establishing the pet's current weight, assessing BCS, and starting at the calculated DER-based portion. Reassess at 2 weeks and 4 weeks. Do not assume the previous feeding amount was correct simply because the pet ate it willingly. Many shelter dogs are food-motivated and will overeat if given the opportunity. Many shelter cats, conversely, are stressed and undereat initially -- do not interpret early appetite suppression as confirmation that a portion is correct.

---

## Example

**Input:** "My cat Mochi is 5 years old, about 12 pounds. She was just spayed last month. She's always been indoor only. She eats dry food -- I'm not sure exactly what kind of food but the bag probably has the info on it. Should I change how much I'm feeding her? She gets a couple of treats a day too."

**Output:**

## Pet Nutrition Plan: Mochi (Adult Cat, 5 Years, Recently Spayed)

### Pet Profile
| Parameter            | Value                                                |
|----------------------|------------------------------------------------------|
| Species              | Cat                                                  |
| Breed / Size class   | Unknown (assumed domestic shorthair/mixed)           |
| Age                  | 5 years                                              |
| Current weight       | 12 lbs (5.45 kg)                                    |
| Life stage           | Adult                                                |
| Reproductive status  | Spayed (1 month ago -- recent metabolic change)     |
| Activity level       | Sedentary (indoor only)                             |
| Body condition score | Unknown -- assess with rib/waist/tuck check (instructions below) |
| Health status        | Healthy (spay was routine surgery)                  |

---

### Why This Matters Right Now

Mochi was spayed last month, which is exactly the right time to reassess her food portions. Spaying reduces a cat's resting metabolic rate by approximately 25-30%, and her activity level typically decreases as well. If she is still eating the same amount she ate before surgery, she is almost certainly eating more than she needs and will gain weight over the next few months. This is one of the most common and preventable causes of feline obesity.

---

### Calorie Calculation

| Step                          | Value                                                 |
|-------------------------------|-------------------------------------------------------|
| Weight in kg                  | 12 lbs ÷ 2.2 = 5.45 kg                               |
| RER formula                   | 70 x (5.45)^0.75 = 70 x 3.85 = **approximately 270 kcal/day** |
| Quick-check formula           | 30 x 5.45 + 70 = 163 + 70 = 233 kcal/day (approximation; use 270 from full formula) |
| Life stage multiplier         | 1.0-1.2 (spayed, sedentary adult indoor cat)          |
| Pre-spay DER estimate         | 270 x 1.2 = 324 kcal/day                             |
| Post-spay adjustment          | Reduce by 20-25% to account for metabolic change      |
| **Post-spay calorie target**  | **270 x 1.0 = 270 kcal/day (start here; adjust based on BCS at 4 weeks)** |

**Practical note:** 270 kcal/day is a starting point. Cats have individual metabolic variation. Mochi's actual need could be anywhere from 240-300 kcal/day. The body condition check every 2-3 weeks is what fine-tunes this number to her specific metabolism.

---

### Food Portion Calculation

To calculate Mochi's exact portion, locate the calorie information on her dry food bag. It will look like: **"Calorie Content: [X] kcal/kg; [Y] kcal/cup"** -- find the kcal per cup (or kcal per 8-oz measuring cup).

| Scenario                   | Food kcal/cup | Daily Amount       | Per Meal (2 meals)  |
|----------------------------|--------------|--------------------|----------------------|
| Low-density kibble         | 290 kcal/cup | 270 ÷ 290 = 0.93 cups | 0.47 cups (~just under ½ cup) |
| Standard kibble            | 360 kcal/cup | 270 ÷ 360 = 0.75 cups | 0.38 cups (~⅓ cup + 1 Tbsp) |
| High-density kibble        | 430 kcal/cup | 270 ÷ 430 = 0.63 cups | 0.31 cups (~⅓ cup)  |

**These amounts may look small.** That is intentional and correct. Most indoor adult cats need far less food than their owners expect, and far less than the bag's feeding chart recommends. Stick with the calculated amount and monitor body condition.

**Measuring tip:** Use a standard kitchen measuring cup and level it off. Even better -- use a kitchen food scale. For dry cat food, a level cup is typically 95-115 grams depending on kibble size and density. Weighing in grams is more precise and removes the variability of how loosely or tightly the cup is filled.

---

### Daily Feeding Schedule

| Time          | Meal          | Portion                       | Notes                                    |
|---------------|---------------|-------------------------------|------------------------------------------|
| 7:00 AM       | Breakfast     | Half the daily calculated amount | Serve at the same time daily; consistency regulates hunger |
| 6:00 PM       | Dinner        | Half the daily calculated amount | Pick up any uneaten food after 20 minutes |

**Why meal feeding instead of free-choice:** Now that Mochi is spayed and has a reduced metabolic rate, leaving food out all day makes it very easy for her to eat more than she needs. Two scheduled meals with measured portions gives you control over her intake and will help prevent the gradual weight gain that affects most post-spay indoor cats.

---

### Treat Budget

| Parameter               | Value                                                     |
|-------------------------|-----------------------------------------------------------|
| Daily calorie target    | 270 kcal/day                                             |
| 10% treat allowance     | 27 kcal/day maximum from treats                          |
| Approximate treat examples | Small commercial cat treat: 2-4 kcal each -- she can have 7-13 per day maximum |
| Plain cooked chicken    | 1 tablespoon shredded = ~9 kcal -- a great high-protein option |
| Plain cooked shrimp     | 1 small shrimp = ~7 kcal                                 |

**Practical guidance:** "A couple of treats a day" is probably fine as long as the treats are small. Check the calorie content on the treat bag -- many commercial cat treats list kcal per treat or kcal per bag serving. If treats are large or high-calorie, switch to breaking them into smaller pieces. Mochi gets the same sensory reward from a pea-sized piece as from a full-sized treat.

**Foods to never give Mochi:** Onions, garlic, chives (in any form including powder), grapes/raisins, chocolate, xylitol (artificial sweetener), raw dough, alcohol, macadamia nuts, dog food as a regular meal (taurine deficient for cats), and large amounts of raw fish.

---

### Food Label Checklist for Mochi's Current or Next Food

When you look at Mochi's food bag, check for these things:

- [ ] **AAFCO statement:** Should say "complete and balanced for adult maintenance" or "for all life stages." If it says "supplemental or intermittent feeding only," this is not a complete diet and should not be her only food.
- [ ] **Life stage:** She is an adult, so "adult" or "all life stages" is correct. Kitten food has excess calories and nutrient levels for her current needs.
- [ ] **First ingredient:** Should be a named protein source -- chicken, turkey, salmon, tuna, beef. Not "meat" or "poultry" without a species name.
- [ ] **Calorie content:** Note the exact kcal per cup. This is essential for accurate portioning. Record it here: _______ kcal/cup.
- [ ] **Expiration or best by date:** Dry food has a shelf life. Check that the bag is within the use-by window.

---

### Body Condition Assessment -- Do This Today

Since we don't know Mochi's current BCS, assess her now and use it to calibrate the plan:

1. **Ribs:** Gently run both thumbs along her rib cage from the spine outward. You should feel each rib distinctly under a smooth, even layer of soft covering -- like feeling the back of your knuckles through a thin glove. If you must press to find ribs, she is likely overweight. If ribs are visually prominent or feel sharp, she may be underweight.
2. **Waist:** Look at her from directly above. Behind the rib cage and before the hips, there should be a visible narrowing. No visible narrowing = likely overweight.
3. **Tummy tuck:** View her from the side. Her belly should slope upward between her chest and hips. If it hangs level or sags, she likely has excess abdominal fat.

**Interpreting the result:**
- If ribs are easy to feel, waist visible, tuck present: start at 270 kcal/day and maintain.
- If ribs are hard to feel, no clear waist: start at 245-255 kcal/day (approximately 10% below calculated DER), reassess in 4 weeks.
- If ribs are sharp or visible, tuck pronounced: consult a veterinarian. Do not increase calories dramatically without ruling out a medical cause of low weight.

---

### Body Condition Monitoring Schedule

| Frequency      | Action                                                         |
|----------------|----------------------------------------------------------------|
| Every 2 weeks  | Rib/waist/tuck check                                          |
| Monthly        | Weigh on home scale (weigh yourself, then hold Mochi, subtract) or at veterinarian's office |
| 4 weeks out    | First calorie adjustment checkpoint -- increase or decrease by 10% based on BCS trend |
| Annual exam    | Ask your veterinarian to assess body condition score formally and review diet |

---

### Next Steps

- [ ] Find the kcal/cup on Mochi's current food bag and calculate her exact daily portion using 270 kcal/day as the target
- [ ] Switch from free-feeding (if currently doing that) to two measured meals per day starting today
- [ ] Do the rib/waist/tuck body condition check today to establish a baseline
- [ ] Weigh Mochi this week and record the number -- this is your baseline for tracking over the next 3 months
- [ ] Reassess body condition in 2 weeks. If no change toward ideal, reduce portion by 10% and hold for another 2 weeks
- [ ] At Mochi's next veterinary visit (likely a post-spay check or annual exam), mention that you have adjusted her feeding and ask them to formally assess her body condition score -- vets can identify subtle changes that are hard to catch at home

**Important:** If Mochi stops eating for more than 24 hours at any point, contact your veterinarian immediately. Cats -- especially cats who are overweight -- can develop hepatic lipidosis (fatty liver disease) within 48-72 hours of not eating. This is a true medical emergency. Do not attempt to solve sudden appetite loss with diet changes alone.
