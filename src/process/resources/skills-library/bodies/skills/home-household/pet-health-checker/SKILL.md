---
name: pet-health-checker
description: |
  Pet health awareness guide covering normal vital signs, common illness symptoms for dogs and cats, vaccination schedules, dental care, parasite prevention, senior pet care, emergency signs requiring immediate vet visits, and wellness checkup schedules.
  Use when the user asks about pet health checker, or needs help with pet health awareness guide covering normal vital signs, common illness symptoms for dogs and cats, vaccination schedules, dental care, parasite prevention, senior pet care, emergency signs requiring immediate vet visits, and wellness checkup schedules.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of pet health checker.
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

# Pet Health Checker
## When to Use

**Use this skill when:**
- User asks about pet health checker
- User needs guidance on pet health checker topics
- User wants a structured approach to pet health checker

**Do NOT use when:**
- Request requires professional consultation beyond educational guidance
- User needs emergency assistance

## Questions to Ask the User First

1. **What type of pet?** (Dog / Cat / Other)
2. **What breed and age?**
3. **What is your concern?** (Specific symptom / General wellness / Preventive care / Emergency question)
4. **When did you first notice the issue?** (Just now / Today / This week / Weeks ago)
5. **Has anything changed recently?** (Diet, environment, routine, new pets/people)
6. **Is your pet eating and drinking normally?**
7. **Is your pet urinating and defecating normally?**
8. **Is your pet up-to-date on vaccinations and parasite prevention?**
9. **Does your pet take any medications?**
---
## Normal Vital Signs

### Dog Normal Values

| Parameter | Normal Range | How to Check |
|-----------|-------------|-------------|
| Heart Rate | 60-140 bpm (small dogs higher, large dogs lower) | Feel femoral artery (inner thigh) for 15 sec x 4 |
| Respiratory Rate | 10-30 breaths/min (at rest) | Watch chest rise/fall for 15 sec x 4 |
| Temperature | 101-102.5F (38.3-39.2C) | Rectal thermometer with lubricant |
| Gum Color | Pink (moist) | Lift lip, check color and moisture |
| Capillary Refill Time (CRT) | < 2 seconds | Press gum with finger, release, count time to return to pink |
| Hydration | Skin snaps back quickly | Pinch skin on back of neck, release |
| Pupil Response | Equal, reactive to light | Shine light in eyes |
| Weight | Breed-dependent | Scale (monthly tracking) |

### Cat Normal Values

| Parameter | Normal Range | How to Check |
|-----------|-------------|-------------|
| Heart Rate | 120-200 bpm | Feel femoral artery or place hand on left chest |
| Respiratory Rate | 15-30 breaths/min (at rest) | Watch chest/belly movement |
| Temperature | 100.5-102.5F (38.1-39.2C) | Rectal thermometer |
| Gum Color | Pink (moist) | Gently lift lip |
| Capillary Refill Time | < 2 seconds | Same as dogs |
| Hydration | Skin snaps back immediately | Skin tent on scruff |
| Pupil Response | Equal, reactive | Light test |

### How to Perform a Basic Home Health Check
```
WEEKLY HOME CHECK (5 minutes):
1. EYES
   - Clear, bright, no discharge
   - No redness or swelling
   - Pupils equal in size
   - No cloudiness (can indicate cataracts)
2. EARS
   - Clean, light pink inside
   - No odor
   - No excessive wax, discharge, or redness
   - No head shaking or scratching
3. MOUTH
   - Gums pink and moist
   - No bad breath (beyond normal "dog breath")
   - No broken, loose, or discolored teeth
   - No lumps, sores, or bleeding
4. NOSE
   - Can be moist or dry (both are normal)
   - No persistent discharge (especially colored)
   - No cracking or sores
5. SKIN AND COAT
   - Shiny coat (not dull or brittle)
   - No excessive shedding or bald patches
   - No lumps, bumps, or masses (note location and size)
   - No fleas, ticks, or flea dirt (black specks)
   - No redness, rashes, or hot spots
6. BODY CONDITION
   - Feel ribs (should be palpable with slight fat covering)
   - Check for weight gain or loss
   - Look for symmetry (no swelling on one side)
7. MOBILITY
   - Walking normally (no limping or stiffness)
   - Getting up and down without difficulty
   - Normal activity and energy level
8. ELIMINATION
   - Normal urine color and frequency
   - Normal stool consistency and frequency
   - No straining, blood, or mucus
```
---
## Common Illness Symptoms

### Dogs - Warning Signs by System
```
DIGESTIVE:
Vomiting:
- Occasional vomiting (1-2x, then fine): Monitor, withhold food 12 hrs
- Repeated vomiting (3+ times): See vet same day
- Vomiting + lethargy + not eating: See vet urgently
- Bloody vomit: See vet immediately
- Vomiting + bloated abdomen: EMERGENCY (possible GDV/bloat)
Diarrhea:
- Soft stool for 1-2 days: Bland diet (boiled chicken + rice), monitor
- Watery diarrhea or blood: See vet same day
- Diarrhea + vomiting + lethargy: See vet urgently
- Puppy with diarrhea: See vet promptly (dehydration risk)
RESPIRATORY:
- Occasional cough: Monitor for 24-48 hours
- Persistent cough (>48 hours): See vet
- Cough + lethargy + loss of appetite: See vet same day
- Difficulty breathing / rapid breathing at rest: EMERGENCY
- Blue/purple gums: EMERGENCY
URINARY:
- Frequent urination (small amounts): See vet within 24 hours
- Straining to urinate with no production: EMERGENCY (especially male cats)
- Blood in urine: See vet within 24 hours
- Increased drinking + urination: See vet this week (possible diabetes, kidney disease)
- Accidents in house-trained dog: See vet (possible UTI, cognitive decline)
MUSCULOSKELETAL:
- Mild limping (bearing weight): Monitor 24-48 hours, rest
- Non-weight-bearing lameness: See vet same day
- Sudden inability to walk: EMERGENCY
- Swollen joint: See vet within 24 hours
- Yelping when touched: See vet
SKIN:
- Mild itching: Monitor, check for fleas
- Excessive itching/scratching: See vet within 1 week
- Hot spots (red, moist, painful areas): See vet within 1-2 days
- Lumps or masses: See vet within 2 weeks (sooner if rapid growth)
- Hair loss: See vet within 1-2 weeks
NEUROLOGICAL:
- Seizure (first time): See vet same day (or ER if prolonged >3 min)
- Seizure cluster (multiple in 24 hours): EMERGENCY
- Head tilt / loss of balance: See vet same day
- Sudden behavioral change: See vet
- Circling or pressing head against walls: EMERGENCY
```

### Cats - Warning Signs
```
SPECIAL NOTE ABOUT CATS:
Cats are masters at hiding illness. Subtle changes are significant.
Any change in normal behavior warrants attention.
CRITICAL CAT EMERGENCIES:
- Straining to urinate (especially male cats): EMERGENCY
  Urinary blockage can be fatal within 24-48 hours
- Open-mouth breathing: EMERGENCY (cats should NEVER pant normally)
- Hiding + not eating for >24 hours: See vet urgently
- Sudden paralysis of hind legs: EMERGENCY (possible saddle thrombus)
SUBTLE SIGNS OF ILLNESS IN CATS:
- Hiding more than usual
- Changes in grooming (over-grooming or unkempt coat)
- Decrease in purring or vocalization changes
- Slight decrease in appetite (cats should never go >24 hours without eating)
- Litter box changes (frequency, amount, location of accidents)
- Change in sleeping location
- Reduced jumping or reluctance to jump
- Weight loss (hard to notice under fur, weigh monthly)
HEPATIC LIPIDOSIS WARNING:
- Cats that stop eating for 2-3 days can develop fatty liver disease
- This is life-threatening
- If your cat refuses food for >24 hours, contact your vet
- Overweight cats are especially at risk
```
---
## Vaccination Schedules

### Dog Vaccination Schedule
```
CORE VACCINES (Recommended for ALL dogs):
Puppy Series:
6-8 weeks:   DHPP (Distemper, Hepatitis, Parainfluenza, Parvovirus) #1
10-12 weeks: DHPP #2
14-16 weeks: DHPP #3 + Rabies (required by law)
Boosters:
1 year:      DHPP booster + Rabies booster
Ongoing:     DHPP every 3 years + Rabies every 1-3 years (per local law)
NON-CORE VACCINES (Based on lifestyle and risk):
Bordetella (Kennel Cough):
- Recommended if: boarding, grooming, dog parks, daycare
- Schedule: As early as 8 weeks, booster annually or every 6 months
- Route: Intranasal, oral, or injectable
Canine Influenza (H3N2/H3N8):
- Recommended if: boarding, shows, high-exposure areas
- Schedule: 2-dose initial series, annual booster
Leptospirosis:
- Recommended if: outdoor exposure, wildlife contact, standing water
- Schedule: 2-dose initial, annual booster
- Note: Can be combined with DHPP (DHLPP)
Lyme Disease:
- Recommended if: tick-endemic areas
- Schedule: 2-dose initial, annual booster
- Note: Also use tick prevention
Rattlesnake Vaccine:
- For dogs in rattlesnake-prevalent areas
- Does NOT replace emergency treatment; buys time
```

### Cat Vaccination Schedule
```
CORE VACCINES (Recommended for ALL cats):
Kitten Series:
6-8 weeks:   FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia) #1
10-12 weeks: FVRCP #2
14-16 weeks: FVRCP #3 + Rabies
Boosters:
1 year:      FVRCP booster + Rabies booster
Ongoing:     FVRCP every 3 years + Rabies every 1-3 years (per local law)
NON-CORE VACCINES (Based on lifestyle):
FeLV (Feline Leukemia Virus):
- Recommended for: All kittens, outdoor cats, cats with FeLV+ exposure
- Schedule: 2-dose kitten series, annual booster for at-risk cats
- Test for FeLV/FIV before vaccinating
FIV (Feline Immunodeficiency Virus):
- Vaccine rarely used due to testing interference
- Prevention: Keep cats indoors, prevent fighting
FIP (Feline Infectious Peritonitis):
- Intranasal vaccine available but efficacy debated
- Not widely recommended
```
---
## Dental Care

### Importance of Dental Health
```
STATISTICS:
- 80% of dogs and 70% of cats show signs of dental disease by age 3
- Dental disease can lead to bacteria entering the bloodstream
- Heart, liver, and kidney damage can result from untreated dental disease
- Dental disease is the #1 diagnosed condition in dogs and cats
SIGNS OF DENTAL PROBLEMS:
- Bad breath (beyond normal pet breath)
- Red, swollen, or bleeding gums
- Yellow/brown tartar on teeth
- Difficulty eating or dropping food
- Pawing at mouth
- Drooling (especially in cats)
- Loose or missing teeth
- Facial swelling
- Reluctance to have head touched
HOME DENTAL CARE ROUTINE:
Daily (Ideal):
- Brush teeth with pet-specific toothpaste (NEVER human toothpaste)
- Use finger brush or soft pet toothbrush
- Focus on outer surfaces of teeth (where tartar builds)
TEACHING TOOTH BRUSHING:
Week 1: Let pet lick pet toothpaste from your finger
Week 2: Rub finger with toothpaste along outer gum line
Week 3: Introduce finger brush with toothpaste
Week 4: Brush outer surfaces for 30 seconds
Week 5+: Gradually increase to 2 minutes covering all teeth
SUPPLEMENTAL DENTAL CARE:
- VOHC-approved dental chews (Veterinary Oral Health Council seal)
- Dental water additives
- Dental diets (Hill's t/d, Royal Canin Dental)
- Raw bones (controversial; discuss with vet)
- NEVER use cooked bones (splinter and cause injury)
PROFESSIONAL DENTAL CLEANINGS:
- Recommended annually or as needed
- Done under general anesthesia (necessary for thorough cleaning)
- Includes scaling, polishing, and dental X-rays
- "Anesthesia-free" dental cleanings are cosmetic only and NOT recommended
  by veterinary dental specialists
```
---
## Parasite Prevention

### Year-Round Prevention Recommended
```
FLEAS:
Lifecycle: Egg → Larva → Pupa → Adult (can take 2 weeks to months)
Prevention Options:
- Oral preventives: Nexgard (dogs), Comfortis (dogs/cats) - monthly
- Topical: Frontline Plus, Advantage, Revolution - monthly
- Collars: Seresto - 8 month protection
- Flea treatment for the home may be needed during infestations
Signs of Fleas:
- Excessive scratching
- Flea dirt (black specks in fur - place on wet paper towel; red = flea dirt)
- Visible fleas (fast-moving brown specks)
- Hair loss from scratching
- Tapeworm segments in stool (fleas carry tapeworm)
TICKS:
Common Tick-Borne Diseases:
- Lyme disease (deer tick)
- Ehrlichiosis (lone star tick, brown dog tick)
- Anaplasmosis (deer tick, Western blacklegged tick)
- Rocky Mountain Spotted Fever (American dog tick, others)
Prevention Options:
- Oral: Nexgard, Bravecto, Simparica (dogs)
- Topical: Frontline Plus, K9 Advantix (dogs only, toxic to cats)
- Collars: Seresto
Tick Removal:
1. Use fine-tipped tweezers
2. Grasp tick as close to skin as possible
3. Pull straight out with steady, even pressure
4. Do NOT twist, burn, or smother the tick
5. Clean bite area with antiseptic
6. Save tick for identification (tape to card, photograph)
7. Monitor bite site for 30 days
HEARTWORM:
Dogs:
- Transmitted by mosquitoes
- Potentially fatal (worms live in heart and lungs)
- Prevention: Monthly oral (Heartgard, Interceptor) or topical, or
  6-month injectable (ProHeart 6 or 12)
- Annual testing recommended even on prevention
- Treatment if positive: expensive, dangerous, lengthy
Cats:
- Also affected (even indoor cats; mosquitoes come inside)
- No approved treatment for cats (prevention is critical)
- Prevention: Revolution (also covers fleas), Heartgard for Cats
INTESTINAL PARASITES:
Common Types:
- Roundworms: Most puppies/kittens are born with them
- Hookworms: Can infect through skin (bare feet in contaminated soil)
- Tapeworms: From ingesting fleas or infected prey
- Whipworms: Soil contamination
- Giardia: Water contamination
- Coccidia: Environmental contamination
Prevention:
- Monthly heartworm preventives often cover intestinal parasites too
- Annual fecal exam (stool sample to vet)
- Pick up feces promptly
- Clean litter box daily
- Wash hands after handling pets
```
---
## Senior Pet Care

### When is My Pet "Senior"?
```
DOGS:
Small breeds (under 20 lbs): Senior at 10-12 years
Medium breeds (20-50 lbs): Senior at 8-10 years
Large breeds (50-90 lbs): Senior at 7-8 years
Giant breeds (90+ lbs): Senior at 5-6 years
CATS:
Senior: 11-14 years
Geriatric: 15+ years
```

### Senior Pet Wellness Monitoring
```
WHAT CHANGES TO WATCH FOR:
BEHAVIORAL:
- Confusion or disorientation (may indicate cognitive dysfunction)
- Changes in sleep patterns (more sleep, restless nights)
- Decreased interaction with family
- skipping house training
- Staring at walls or getting stuck in corners
- Changes in personality
PHYSICAL:
- Weight gain or loss
- Decreased muscle mass
- Increased thirst and urination
- Changes in appetite
- Difficulty getting up, especially in the morning
- Reluctance to jump or climb stairs
- Lumps or bumps (new or growing)
- Vision or hearing changes
- Changes in coat quality
MOBILITY SUPPORT:
- Orthopedic bed (memory foam)
- Ramps for furniture/car access
- Non-slip mats on hard floors
- Raised food and water bowls
- Easy-access litter boxes (low sides) for cats
- Joint supplements (glucosamine, omega-3, discuss with vet)
- Moderate, regular exercise (short walks, gentle play)
- Warm, draft-free sleeping area
SENIOR WELLNESS EXAM SCHEDULE:
- Every 6 months (twice yearly) instead of annually
- Bloodwork panel (CBC, chemistry, thyroid)
- Urinalysis
- Blood pressure check
- Eye examination
- Dental assessment
- Joint evaluation
- Body condition scoring
```

### Cognitive Dysfunction Syndrome (CDS)
```
SIGNS (DISHAA Acronym):
D - Disorientation (getting lost in familiar places)
I - Interaction changes (less affectionate, more clingy, or aggressive)
S - Sleep-wake cycle changes (awake at night, sleeping more during day)
H - House soiling (skipping training)
A - Anxiety (new fears, separation distress, restlessness)
MANAGEMENT:
- Enrichment: Puzzle feeders, training (mental stimulation)
- Routine: Keep consistent daily schedule
- Environment: Night lights, avoid furniture rearrangement
- Diet: Diets with antioxidants, omega-3, MCT oil (Hill's b/d, Purina NCL)
- Supplements: SAMe, omega-3, vitamin E (consult vet)
- Medication: Selegiline (Anipryl) may help some dogs
```
---
## Emergency Signs Requiring Immediate Vet Visit

### Go to the Emergency Vet NOW If:
```
CRITICAL EMERGENCIES:
[ ] Difficulty breathing or choking
[ ] Collapse or inability to stand
[ ] Seizure lasting > 3 minutes or multiple seizures in a row
[ ] Bloated, hard abdomen with retching (GDV - life threatening)
[ ] Bleeding that won't stop
[ ] Known ingestion of toxic substance
[ ] Straining to urinate with no production (especially male cats)
[ ] Open-mouth breathing in a cat
[ ] Sudden hind leg paralysis (cats: possible saddle thrombus)
[ ] Trauma (hit by car, fall, animal attack)
[ ] Eye injury or sudden eye swelling
[ ] Pale or white gums
[ ] Unconsciousness or unresponsiveness
[ ] Severe vomiting or diarrhea with blood
[ ] Temperature > 104F or < 98F
[ ] Burns (chemical, thermal)
[ ] Difficulty giving birth (> 1 hour between puppies/kittens with active straining)
```

### Emergency Kit for Pets
```
HOME EMERGENCY KIT:
[ ] Veterinarian contact information (regular and emergency)
[ ] Pet first aid book
[ ] Gauze pads and rolls
[ ] Self-adhesive bandage wrap (vet wrap)
[ ] Adhesive tape
[ ] Digital rectal thermometer + lubricant
[ ] Tweezers (tick removal)
[ ] Scissors (blunt-tipped)
[ ] Hydrogen peroxide 3% (ONLY use if directed by vet/poison control)
[ ] Saline eye wash
[ ] Diphenhydramine (Benadryl) - dose per vet instruction
[ ] Styptic powder (for nail bleeding)
[ ] Muzzle (even friendly dogs may bite when in pain)
[ ] Blanket/towel (stretcher, warmth)
[ ] Copies of medical records
[ ] Current medications list
```
---
## Wellness Checkup Schedule

### Recommended Visit Frequency
```
PUPPIES/KITTENS (< 1 year):
- Every 3-4 weeks from 8-16 weeks (vaccination series)
- Spay/neuter consultation (timing varies by breed)
- Discuss: nutrition, behavior, socialization, parasite prevention
ADULT DOGS/CATS (1-7 years):
- Annual wellness exam
- Annual vaccinations (as needed) or titer testing
- Annual heartworm test (dogs)
- Annual fecal exam
- Annual dental evaluation
- Bloodwork baseline at age 5-7
SENIOR PETS (7+ for dogs, 11+ for cats):
- Twice-yearly wellness exams
- Semi-annual bloodwork (CBC, chemistry panel)
- Urinalysis
- Thyroid screening
- Blood pressure monitoring
- Dental evaluation (may need more frequent cleanings)
- Joint assessment
WELLNESS VISIT PREPARATION:
[ ] Write down any concerns or changes noticed
[ ] Bring stool sample (if requested)
[ ] Know current food, treats, and supplements
[ ] List all medications (including flea/tick/heartworm prevention)
[ ] Note any behavioral changes
[ ] Record recent appetite, thirst, energy level changes
```
---
## Output Format

When providing health guidance, present it as:
```
HEALTH ASSESSMENT
Pet: [Species / Breed / Age / Weight]
Reported Concern: [Description]
Duration: [When noticed]
INITIAL ASSESSMENT:
Urgency Level: [EMERGENCY / Urgent / Routine / Monitor]
Most Likely Causes: [List potential causes]
RECOMMENDED ACTION:
[ ] Emergency vet visit now
[ ] Vet visit within 24 hours
[ ] Schedule routine vet appointment
[ ] Monitor at home with guidelines below
HOME CARE (if appropriate):
[Step-by-step instructions]
WHAT TO WATCH FOR (seek vet if):
[Escalation signs]
PREVENTION GOING FORWARD:
[Recommendations]
**REMINDER: This information is for awareness only.
Always consult your veterinarian for diagnosis and treatment.**
```

## Example

**Input:** "Help me get started with pet health checker"

**Output:** A structured pet health checker plan tailored to the user's specific situation, following the process outlined above.

## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding. Do not assume details the user has not provided.
- **Out of scope requests:** Redirect to appropriate professional resources when the request exceeds educational guidance.
- **Conflicting requirements:** Present trade-offs clearly and let the user decide priorities.
