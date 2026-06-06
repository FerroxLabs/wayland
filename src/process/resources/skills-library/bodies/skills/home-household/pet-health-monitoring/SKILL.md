---
name: pet-health-monitoring
description: |
  Guides at-home health monitoring for dogs and cats covering normal versus abnormal indicators, weekly health check routines, and when to call the veterinarian. Produces a monitoring checklist and abnormality reference guide.
  Use when the user asks about at-home pet health checks, normal vital signs for dogs or cats, when to take a pet to the vet, or how to monitor a pet's health between veterinary visits.
  Do NOT use for diagnosing specific diseases, recommending medications or treatments, or replacing veterinary examination. This skill helps owners observe and report -- not diagnose or treat.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "pet-care checklist guide"
  category: "home-household"
  subcategory: "pet-care"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Pet Health Monitoring

## When to Use

**Use this skill when:**
- A user wants to establish or improve a weekly at-home health check routine for a dog or cat and needs a structured, species-specific protocol
- A user asks what constitutes normal vital signs, body condition, or behavior for their dog or cat, and wants to understand the ranges that distinguish healthy from concerning
- A user has noticed a specific change in their pet (eating less, drinking more, limping, coat changes) and wants to know whether it warrants a veterinary visit and how urgently
- A user wants to create a health monitoring log or tracking system to share meaningful clinical history with their veterinarian
- A user is caring for a senior pet and wants to know what additional monitoring is appropriate as pets age into higher disease-risk life stages
- A user is a first-time pet owner and wants a foundational framework for understanding what "healthy" looks like so they can detect deviations early
- A user wants to prepare for a veterinary wellness visit and needs to know what observations to report and how to document them effectively

**Do NOT use when:**
- A user describes a life-threatening emergency (pet is not breathing, has collapsed, is having a seizure, has ingested a known toxin, is showing signs of urinary blockage) -- stop immediately and direct to emergency veterinary care; do not proceed with this skill
- A user is asking for a diagnosis of a specific disease or condition -- this skill teaches structured observation and triage, not medical diagnosis; use a veterinary consultation referral instead
- A user is asking about medication dosing, over-the-counter treatments, supplements, or home remedies -- all treatment decisions belong to a licensed veterinarian
- A user is asking about exotic pets including birds, reptiles, fish, rabbits, guinea pigs, hamsters, ferrets, or any species other than domestic dogs and cats -- normal values and monitoring protocols differ significantly and require species-specific expertise
- A user needs post-surgical wound care instructions beyond basic wound monitoring -- they should contact the discharging veterinarian directly for post-operative protocols
- A user needs nutritional or dietary formulation advice beyond general body condition scoring -- refer to a veterinary nutritionist consultation for therapeutic or weight-management diets

**Important note throughout:** Every output produced by this skill must reinforce that observation is not diagnosis. The goal is to produce an owner who can describe what they see accurately and who knows which observations require same-day emergency care, which require a veterinary visit within 24-48 hours, and which can wait for the next scheduled appointment. Early, accurate observation paired with timely veterinary care produces the best health outcomes.

---

## Process

### Step 1: Gather the Pet Profile

Before producing any monitoring plan, collect essential profile information. The appropriate normal ranges, check frequency, and risk factors differ substantially by species, size, age, lifestyle, and existing health conditions.

- **Species:** Dog versus cat monitoring protocols differ -- cats mask illness more effectively than dogs, behavioral changes are earlier and more subtle, and certain emergencies (urinary blockage, hepatic lipidosis from anorexia) are far more time-critical in cats
- **Breed and size:** Large and giant breed dogs (over 50 lbs) have resting heart rates of 60-90 bpm; small breed dogs (under 20 lbs) run 90-140 bpm; giant breeds such as Great Danes age faster and are considered senior at 5-6 years; brachycephalic breeds (Bulldogs, French Bulldogs, Pugs, Persian cats) have modified respiratory normals
- **Age category:** Puppy or kitten (under 1 year), young adult (1-3 years), adult (3-7 years for dogs, 3-10 years for cats), senior (7+ years for most dogs, 5-6 years for giant breeds, 10+ years for cats) -- monitoring frequency and the list of age-relevant findings change at each stage
- **Current weight:** Get an accurate starting weight so future changes can be quantified; weight loss of 5-10% of body weight (e.g., a 10 lb cat dropping to 9 lbs) is clinically significant even when the owner perceives the cat as "just a little thinner"
- **Known health conditions:** A diabetic dog has different monitoring priorities (daily appetite, water consumption, urination) than a healthy young adult dog; a cat on long-term steroids needs monthly weight checks and blood glucose awareness
- **Lifestyle:** Indoor-only cat versus indoor-outdoor cat dramatically changes parasite exposure, trauma risk, and wound monitoring needs; an off-leash hiking dog needs tick checks after every outing

### Step 2: Establish Species-Specific Baseline Vital Signs

Teach the owner to measure and record baseline values when the pet is healthy. A single abnormal reading is less useful than knowing what changed from that individual's personal baseline.

**Normal vital signs reference table:**

| Parameter | Dog -- Normal Range | Cat -- Normal Range | How to Measure |
|---|---|---|---|
| Resting heart rate | 60-140 bpm (large breeds 60-90; small breeds 90-140) | 140-220 bpm | Place flat hand on left chest wall just behind the elbow; count beats for 15 seconds; multiply by 4 |
| Resting respiratory rate | 10-30 breaths/min | 20-30 breaths/min | Count chest rises while pet is calm or sleeping; count for 30 seconds; multiply by 2; a resting rate above 30 in a sleeping cat is a red flag for heart disease |
| Rectal temperature | 101.0-102.5°F (38.3-39.2°C) | 100.5-102.5°F (38.1-39.2°C) | Digital rectal thermometer; lubricate tip with petroleum jelly; insert 1 inch; hold 60 seconds or until the device beeps; below 99°F or above 104°F is an emergency |
| Capillary refill time (CRT) | Less than 2 seconds | Less than 2 seconds | Press the gum above the upper canine tooth firmly with a finger until it turns white; release; count seconds until pink returns; over 2 seconds suggests poor circulation |
| Gum (mucous membrane) color | Moist, salmon-pink | Moist, salmon-pink | Lift lip and observe the gum tissue directly (not the lip skin); pale, white, blue, bright red, yellow, or mottled color indicates a medical emergency |
| Skin turgor (hydration) | Snaps back in under 1 second | Snaps back in under 1 second | Gently tent skin on the back of the neck between thumb and forefinger; release; delayed return (over 1-2 seconds) indicates dehydration of at least 5-8% |

**Teach the measurement technique for each parameter** because owners who have never taken a rectal temperature on a pet or assessed gum color will produce inaccurate readings. Walk through each technique step by step and encourage practice during a calm, healthy period so the owner has a baseline to compare against.

**Special case -- resting respiratory rate (RRS) monitoring for cardiac patients:** For pets diagnosed with heart disease, particularly dogs with mitral valve disease or dilated cardiomyopathy, and cats with hypertrophic cardiomyopathy (HCM), a resting respiratory rate above 30 breaths per minute during sleep is an early warning sign of fluid accumulation in the lungs (congestive heart failure). Many cardiologists recommend daily RRS tracking for known cardiac patients. If the veterinarian has diagnosed heart disease, emphasize this monitoring.

### Step 3: Teach the Weekly Head-to-Tail Physical Check

This 5-7 minute structured exam is the core of the monitoring skill. Train the owner to perform it consistently on the same day each week, in a consistent, calm setting. The sequence -- head to tail -- helps ensure nothing is skipped.

**Eyes:**
- Normal: clear corneas, bright alert expression, pupils equal in size and symmetrically reactive, small amount of clear or slightly rust-tinged discharge in the inner corner (particularly in certain breeds), no squinting or pawing at eyes
- Abnormal findings requiring veterinary attention: cloudiness (corneal opacity or cataract), redness of the white of the eye (sclera) or third eyelid prominence, yellow or green discharge (infection), squinting or frequent blinking (corneal ulcer or pain -- urgent, same-day visit), one pupil different in size from the other (unequal pupils, called anisocoria, can indicate neurological emergency), bulging globe
- Cherry eye (prolapsed nictitating gland): red round mass in the inner corner of the eye; not an emergency but requires veterinary management; common in Bulldogs, Cocker Spaniels, Beagles

**Ears:**
- Normal: light pink inner ear flap, mild warm odor at most, small amount of light tan or slightly darker wax, no discomfort when the base of the ear is gently massaged
- Abnormal: dark brown to black discharge (common in yeast otitis), red inflamed ear canal visible at the opening, foul smell, head shaking, pawing at ears, tilting head consistently to one side (head tilt is a vestibular or neurological concern -- same-day veterinary visit)
- Floppy-eared breeds (Cocker Spaniels, Basset Hounds, Labrador Retrievers) and dogs that swim are at higher risk for otitis externa (ear infection) and need more frequent ear checks

**Mouth, Gums, and Teeth:**
- Assess gum color (see vital signs table above) and CRT at this step
- Normal: pink moist gums, minimal tartar (light yellowing is stage 1 dental disease), mild "dog breath" but not overtly foul
- Abnormal findings: bright red gum line (gingivitis -- routine veterinary dental visit), heavy brown-to-tan tartar deposits especially at the gum line (stage 2-3 dental disease requiring professional cleaning under anesthesia), broken teeth with exposed pink pulp (urgent, often painful), foul necrotic odor (tissue death or periodontal abscess), excessive drooling especially in cats (dental pain is a very common cause in cats), oral ulcers or masses
- Never underestimate dental disease: chronic periodontal disease releases bacteria into the bloodstream and has documented associations with kidney, liver, and cardiac disease

**Neck, Throat, and Lymph Nodes:**
- Run fingers along the underside of the neck on both sides; feel for symmetrical, soft, slightly movable lymph nodes (submandibular nodes) roughly the size of a large grape depending on the pet's size
- Normal: small, symmetrical, soft, slightly movable nodes; the pet does not react to light palpation
- Abnormal: enlarged, firm, immovable, or painful lymph nodes; asymmetry (one side larger); rapid growth over days to weeks; multiple lymph node regions enlarged simultaneously -- schedule a veterinary visit within a few days; sudden marked enlargement warrants an urgent visit

**Skin and Coat:**
- Part the fur in multiple locations on the back, flanks, and belly; inspect the skin surface directly
- Normal: light pink to pigmented skin (depending on breed), smooth coat with appropriate breed texture, no visible parasites, minimal shedding outside of seasonal coat changes, no odor from the skin itself
- Abnormal findings: red or irritated patches (hot spots in dogs are moist, painful, rapidly expanding dermatitis -- urgent, as they can double in size within hours), alopecia (hair loss patches), crusting or scaling (seborrhea, ringworm, mange), black pepper-like specks at the skin surface (flea dirt -- test by placing on a white surface and adding a drop of water; if it turns reddish-brown, it is flea feces), new lumps or masses (any new lump should be brought to the veterinarian's attention, especially in cats where even small masses carry higher malignancy risk), skin that is thickened or elephant-textured (lichenification -- chronic inflammation)
- Check between toes and in skin folds (shar-pei, English Bulldog, overweight pets) for moisture, redness, or yeast odor (corn-chip smell indicates Malassezia)
- For outdoor pets: part the coat to check for ticks, particularly around the head, neck, ears, between toes, and in the groin and axillary (armpit) areas

**Body Condition Score (BCS):**
- Use the standardized 1-9 Purina Body Condition Score scale: 4-5 is ideal for most dogs and cats
- BCS 4-5 (ideal): ribs easily palpable with light pressure (like knuckles of a fist), minimal fat covering, waist visible from above, abdominal tuck visible from the side
- BCS 6-7 (overweight): ribs require firm pressure to feel, no visible waist, flattened abdominal tuck -- discuss with veterinarian; obesity shortens lifespan and accelerates joint disease
- BCS 8-9 (obese): ribs not palpable under thick fat deposits, distended abdomen, fat deposits over neck and limb insertions
- BCS 2-3 (underweight): ribs prominent with no palpable fat, spine and hips visibly prominent, severe abdominal tuck -- urgent weight loss of over 10% of body weight warrants same-week veterinary visit
- Muscle condition score (MCS): separate from BCS; assess muscle mass over the lumbar spine, skull, and shoulder blades; muscle wasting (sarcopenia) in a senior pet with maintained body weight (fat replacing muscle) is a significant health concern

**Abdomen:**
- Gently palpate the abdomen from behind the rib cage to the pelvis with flat hands; the pet should be relaxed
- Normal: soft, non-tender, no hard masses or gas-filled organs, mild gurgling sounds are normal
- Abnormal: extreme tightness or rigidity (acute abdomen -- emergency), visibly distended abdomen especially in large-breed dogs (suspect GDV/bloat -- emergency; a large breed dog with a distended abdomen, unproductive retching, and restlessness requires emergency care immediately -- mortality increases rapidly without intervention), pain response to palpation (guarding, crying out, attempting to bite), palpable masses

**Limbs, Joints, and Gait:**
- Observe the pet standing, walking, and trotting on a firm surface (not carpet) if possible; all four limbs should bear weight equally
- Normal: fluid, even gait, nails touching the ground with a slight click on hard floors (indicating appropriate nail length), paw pads moist and smooth, no swelling at joints
- Abnormal: head bobbing when trotting (forelimb lameness -- head drops when the non-lame foot hits the ground), hip swing asymmetry (hindlimb lameness), bunny-hopping on hindlimbs (bilateral hindlimb weakness, common in hip dysplasia), swollen joints, reluctance to put weight on any single leg for more than a few steps, knuckling (dorsal surface of paw touching the floor instead of the pads -- neurological concern, urgent)
- Assess nail length: nails should not curve under the paw pad or click audibly on hard floors; dewclaws require separate check as they do not contact the ground and can grow in a circle and pierce the paw pad

### Step 4: Track Behavioral and Appetite Indicators

Behavior changes often precede physical findings by days. A cat that has been consistently social and suddenly hides, or a dog whose appetite was reliable and who now approaches the bowl and then walks away, is communicating discomfort or illness. Owners often dismiss these changes as "moods" -- emphasize that behavioral changes in pets deserve the same attention as visible physical changes.

**Behavioral monitoring table:**

| Observation | Duration Threshold for Veterinary Contact | Possible Significance |
|---|---|---|
| Decreased or absent appetite | Dogs: over 24 hours; Cats: over 12-24 hours | Dental pain, GI disease, systemic illness, nausea; in cats, even 24-48 hours of anorexia can trigger hepatic lipidosis (fatty liver), particularly in overweight cats |
| Increased appetite without weight gain | Several days | Diabetes mellitus, hyperthyroidism (cats), exocrine pancreatic insufficiency (dogs), intestinal malabsorption |
| Polydipsia (markedly increased water intake) | 3+ days consistently | Diabetes mellitus, chronic kidney disease, hyperthyroidism (cats), hyperadrenocorticism (Cushing's disease, dogs), pyometra in intact females |
| Lethargy beyond post-exercise recovery | Over 24 hours | Pain, infection, anemia, organ dysfunction, cardiac disease, cancer |
| Hiding (cats specifically) | Over 24 hours, or combined with any other sign | Pain and illness are the primary medical causes; never dismiss as introversion if new onset |
| Increased vocalization or howling at night | 3+ nights | Cognitive dysfunction syndrome (CDS) in seniors, hypertension (especially hyperthyroid cats), pain, hearing loss |
| Sudden aggression or snapping | Any episode in a previously non-aggressive pet | Pain is the number one cause -- a painful pet may bite or scratch to protect itself; pursue veterinary evaluation before behavioral intervention |
| Excessive licking of lips or swallowing repeatedly | Hours | Nausea, esophageal discomfort, dental pain; in dogs, can precede vomiting or regurgitation |
| Circling, stumbling, or falling to one side | Any occurrence | Vestibular disease or neurological event -- same-day veterinary evaluation |
| Persistent coughing in dogs | 48+ hours, or any cough in a known cardiac patient | Kennel cough, tracheal collapse, heart disease with pulmonary edema, laryngeal paralysis |
| Open-mouth breathing in cats at rest | Any occurrence | Emergency -- cats are obligate nasal breathers; any open-mouth breathing at rest indicates serious respiratory distress |

**Monitoring elimination closely:**

For stool: Normal stool is formed (tubular, not loose), brown, passed in a single movement without straining, with a mild odor. Score stool on a 1-7 fecal scoring scale (Purina Fecal Scoring Chart): score 2-3 is ideal; score 5-7 (liquid to watery diarrhea) combined with lethargy or blood requires urgent veterinary attention. Black, tarry stool (melena) indicates digested blood from the upper GI tract and is always urgent.

For urination: Normal frequency is 3-5 times daily for dogs (varies by water intake) and 2-4 litter box visits daily for cats. Straining to urinate with little to no output is a veterinary emergency in any cat (especially males, whose narrow urethra occludes easily) and in any dog. Blood-tinged urine (hematuria) warrants same-day veterinary evaluation.

### Step 5: Establish the Preventive Care and Monitoring Schedule

At-home monitoring supplements -- never replaces -- regular veterinary wellness care. Build a calendar around the pet's life stage.

**Preventive care schedule by life stage:**

| Life Stage | At-Home Monitoring Frequency | Veterinary Visit Frequency | Key Focus Areas |
|---|---|---|---|
| Puppy/kitten (0-12 months) | Daily observation; weekly weight check | Every 3-4 weeks until 16 weeks for vaccine series; 6-month visit for spay/neuter assessment | Vaccine schedule completion, socialization health effects, growth rate, parasite screening, bite wound monitoring |
| Young adult (1-3 years) | Weekly head-to-tail check; monthly weight | Annual wellness exam | Dental baseline, body condition, parasite prevention, behavior baseline, vaccine boosters |
| Adult (3-7 years) | Weekly check; monthly weight | Annual wellness exam with comprehensive blood panel | Dental disease progression, weight management, pre-anesthetic blood work if dental cleaning needed |
| Senior dog (7+ years; giant breeds 5+) | Weekly check; twice-monthly weight | Every 6 months with complete blood count, chemistry panel, urinalysis, thyroid panel | Cognitive function, mobility, drinking and urination changes, weight loss, oral pain, lump monitoring |
| Senior cat (10+ years) | Weekly check; weekly weight monitoring | Every 6 months with blood work including T4 (thyroid), blood pressure measurement, kidney values | Hyperthyroidism (affects 10% of cats over 10), chronic kidney disease (CKD affects 30-40% of cats over 12), hypertension, weight loss, cognitive dysfunction |

**At-home monitoring intervals summary:**
- Weekly: full head-to-tail physical check for all adult and senior pets
- Monthly: weigh all pets on a consistent scale at a consistent time (same scale, same time of day, before feeding); record and track trend over time
- After every outdoor outing (tick-endemic areas): tick check
- Daily: observe appetite, energy level, and elimination (this takes 30 seconds per pet)

### Step 6: Build the Health Log

The health log is one of the most clinically useful tools an owner can bring to a veterinary appointment. Veterinarians see the pet for 15-30 minutes once or twice a year. The owner has 365 days of observational data. A log that shows gradual weight loss of 0.5 lbs per month over four months, combined with increased water intake noted three months ago, is far more actionable than a vague report of "she seems thinner lately."

**What to log:**
- Date of observation
- Weight (measured, not estimated)
- Appetite score (1-5: 1 = refused all food, 3 = ate normally, 5 = ate ravenously and more)
- Stool quality (1-7 scale as above, or simple descriptor: normal, soft, loose, diarrhea, constipated, blood noted)
- Urine observations (normal frequency, straining noted, blood noted, color change)
- Energy/activity level (1-5: 1 = would not get up, 3 = normal for this pet, 5 = unusually energetic)
- Any specific observations from the weekly check (new lump noted on right shoulder, slight squinting of left eye, etc.)
- Medications and supplements administered
- Notable environmental changes (new food, new pet, household move, boarding)
- Veterinary visits or communications

**How to use the log:** Review the trend, not individual data points. A single day of soft stool means very little. Two weeks of progressively looser stool combined with mild appetite decrease is a clinical pattern. Bring the last 3-6 months of logs to every veterinary visit.

### Step 7: Produce the Complete Monitoring Plan Output

Synthesize all gathered information into the formatted monitoring plan described in the Output Format section. Tailor every section to the specific pet -- a 12-year-old overweight indoor cat gets a materially different plan than a 2-year-old athletic outdoor Labrador. Do not produce a generic plan when you have specific information about the pet. If information is incomplete (breed unknown, weight unknown), produce the plan with the available information and note what baseline data the owner should collect at the next veterinary visit.

---

## Output Format

Produce this structured monitoring plan. Every field should be completed with pet-specific information -- do not leave sections as generic placeholders if the user has provided details.

```
## Pet Health Monitoring Plan: [Pet Name] the [Breed/Species]

---

### 1. Pet Profile
| Parameter             | Value                                         |
|-----------------------|-----------------------------------------------|
| Name                  | [name or "unnamed"]                           |
| Species               | [Dog / Cat]                                   |
| Breed                 | [breed or mix; if unknown, note approximate size] |
| Sex                   | [male/female; intact or spayed/neutered]      |
| Age                   | [age and life stage: puppy/adult/senior]      |
| Current Weight        | [lbs and kg if known; note date weighed]      |
| Body Condition Score  | [1-9 scale with descriptor]                   |
| Lifestyle             | [Indoor only / Outdoor access / Outdoor only] |
| Known Health Conditions | [list or "none reported"]                   |
| Current Medications   | [list or "none"]                              |
| Regular Veterinarian  | [name/clinic if provided, or "not specified"] |

---

### 2. Baseline Normal Values for This Pet
| Parameter             | Normal Range for This Pet                     | Baseline Reading (to fill in) |
|-----------------------|-----------------------------------------------|-------------------------------|
| Resting heart rate    | [species/size-adjusted range] bpm             | ___ bpm (date: ___)           |
| Resting respiratory rate | [species-adjusted range] breaths/min       | ___ breaths/min (date: ___)   |
| Temperature           | [species-adjusted range] °F                   | ___ °F (date: ___)            |
| Body weight           | [current known weight or "establish baseline"]| ___ lbs (date: ___)           |
| Gum color             | Moist salmon-pink                             | [confirm at next check]       |
| Capillary refill time | Under 2 seconds                               | ___ sec (date: ___)           |
| Skin turgor           | Returns in under 1 second                     | [confirm at next check]       |

---

### 3. Weekly Head-to-Tail Check Routine (~7 minutes)
Perform every [day of week]. Mark each item as ✓ (normal), ⚠ (watch), or ✗ (contact vet).

**Head:**
- [ ] Eyes: clear corneas, no discharge beyond light inner-corner crust, no squinting, equal pupils
- [ ] Ears: light pink, minimal odor, no dark discharge, no head shaking, no pain on base massage
- [ ] Mouth: salmon-pink moist gums, CRT under 2 seconds, no foul odor, no excessive drooling
- [ ] Teeth: minimal tartar, no broken teeth visible, no facial swelling below the eye (abscess sign)
- [ ] Lymph nodes (under chin): small, soft, symmetrical, no reaction to light touch

**Body:**
- [ ] Skin and coat: smooth coat, no bald patches, no redness, no parasites or flea dirt
- [ ] Skin folds (if applicable): dry and clean between folds
- [ ] Body condition: ribs palpable with light pressure, waist visible from above
- [ ] Abdomen: soft, non-tender, no visible distension
- [ ] New lumps or masses: run hands over full body systematically; note any new findings

**Limbs and Movement:**
- [ ] Gait: even weight bearing on all four limbs, no head bob or hip swing asymmetry
- [ ] Joints: no swelling, no heat, no pain on gentle flexion and extension
- [ ] Paws: pads intact and smooth, nails appropriate length, no excessive licking between toes

**Elimination (observed over the past week):**
- [ ] Stool: formed, brown, no blood, no mucus, passed without straining
- [ ] Urine: normal frequency and color, no straining, no blood, no change in location (cats)

**Behavioral summary (daily observations reviewed weekly):**
- [ ] Appetite: consistent with normal for this pet
- [ ] Energy: consistent with normal for this pet
- [ ] Social behavior: no new hiding, withdrawal, or unprovoked aggression
- [ ] Water intake: no significant increase or decrease

---

### 4. Warning Signs -- Call the Vet
Urgency levels: **Routine** = next available appointment (within 1-2 weeks); **Urgent** = within 24-48 hours; **Same-Day** = today, even if after hours

| Symptom or Finding                                         | Urgency Level | Notes |
|------------------------------------------------------------|---------------|-------|
| New lump or mass (any location)                            | Routine       | Note exact location, size (compare to a coin or grape), texture, movability |
| Mild limping that resolves within 24 hours                 | Routine       | If it recurs, escalate |
| Mild increase in water consumption without other symptoms  | Routine       | Track daily water intake in measured amounts for 5 days before the visit |
| Occasional single-episode vomiting (dog) without lethargy  | Routine/Watch | If 2+ episodes within 24 hours, escalate to urgent |
| Dental: visible tartar, mild bad breath, gum redness       | Routine       | Schedule professional dental cleaning assessment |
| Gradual coat or skin changes without itch or discomfort   | Routine       | Document with photos over 1-2 weeks before visit |
| Not eating for over 24 hours (dog) or over 12-24 hours (cat) | Urgent      | Cats at particular risk for hepatic lipidosis |
| Vomiting 3+ times within 24 hours                         | Urgent        | Especially if combined with lethargy or blood |
| Limping lasting over 24 hours, or unable to bear weight    | Urgent        | Same-day if non-weight-bearing |
| Sudden, significant behavior change (hiding 24+ hours)    | Urgent        | Rule out pain and illness before assuming behavioral cause |
| Blood in stool or urine                                    | Urgent        | Same-day if combined with straining or lethargy |
| Rapid or unexplained weight loss (over 5-10% of body weight) | Urgent     | [scale-dependent -- note lbs lost and over what timeframe] |
| Eye: squinting, cloudiness, or unequal pupils              | Same-Day      | Corneal ulcers worsen rapidly; unequal pupils may indicate neurological emergency |
| Sudden complete anorexia with lethargy (any species)       | Same-Day      | Multiple causes; do not wait for symptoms to resolve |
| Head tilt, circling, falling to one side                  | Same-Day      | Vestibular or neurological event |
| Persistent cough in a known cardiac patient               | Same-Day      | May indicate pulmonary edema |
| Pronounced abdominal distension with retching (dogs)       | EMERGENCY     | Suspect GDV/bloat -- minutes matter |

---

### 5. Emergency Signs -- Go to Emergency Veterinarian Now
Do not wait. Do not monitor overnight. Contact the nearest emergency veterinary facility immediately.

**EMERGENCY -- Go Now:**
- [ ] Not breathing, gasping, or making choking sounds
- [ ] Gum color is white, pale gray, blue (cyanotic), bright cherry red, or yellow
- [ ] Collapse or inability to stand; loss of consciousness
- [ ] Seizure (involuntary muscle contractions, loss of consciousness, paddling limbs)
- [ ] Straining to urinate with little or no urine produced, especially in cats and male dogs (urinary blockage -- can be fatal within 24-48 hours)
- [ ] Open-mouth breathing at rest in a cat (cats are nasal breathers -- this is always an emergency)
- [ ] Suspected toxin ingestion: lilies (all parts including pollen -- lethal to cats; even water from a lily vase is toxic), grapes/raisins, xylitol (artificial sweetener in sugar-free gum, peanut butter, candy), antifreeze (ethylene glycol), human medications (especially acetaminophen, ibuprofen), chocolate, rodenticide, permethrin-containing flea products applied to cats
- [ ] Bloat/GDV: large or deep-chested dog (Great Dane, German Shepherd, Standard Poodle, Weimaraner, Rottweiler) with distended abdomen, unproductive retching or drooling, restlessness, and anxiety
- [ ] Uncontrolled bleeding not controlled by direct pressure within 5 minutes
- [ ] Suspected broken bone with visible bone or severe angulation
- [ ] Known or suspected fall from height or vehicular trauma (even if the pet seems okay -- internal injuries may not show immediately)
- [ ] Eye injury or sudden loss of vision

**What to tell the emergency clinic:** Species, breed, age, weight, current medications, what happened and when, current symptoms, and whether any toxin exposure is possible.

---

### 6. Preventive Care Calendar
| Timing                       | Task                                                              | Who Performs   |
|------------------------------|-------------------------------------------------------------------|----------------|
| Weekly                       | Head-to-tail physical check (this routine)                       | Owner at home  |
| Monthly                      | Weight measurement and body condition score; record in log        | Owner at home  |
| [Every 2-4 weeks]           | Nail trim                                                         | Owner or groomer |
| [As prescribed]              | Parasite prevention (flea, tick, heartworm per veterinarian recommendation and regional risk) | Owner |
| [Every 6-12 months, dentist-dependent] | Toothbrushing with pet-safe enzymatic toothpaste (ideally daily) | Owner |
| Annual                       | Veterinary wellness examination, vaccine assessment, dental evaluation | Veterinarian |
| Annual                       | Heartworm test (dogs); fecal parasite exam                       | Veterinarian   |
| [Annual or per vet guidance] | Baseline blood work: complete blood count, chemistry panel, urinalysis | Veterinarian |
| Every 6 months (senior pet)  | Comprehensive blood work, blood pressure, urinalysis, thyroid panel (cats) | Veterinarian |

---

### 7. Health Log
Record a brief entry after each weekly check. Bring this log to every veterinary appointment.

| Date | Weight (lbs) | Appetite (1-5) | Stool Quality (1-7 or descriptor) | Urine (normal/abnormal) | Energy (1-5) | Weekly Check Result (all normal / items flagged) | Notes / Observations | Vet Contact? |
|------|-------------|----------------|-----------------------------------|--------------------------|--------------|--------------------------------------------------|----------------------|--------------|
|      |             |                |                                   |                          |              |                                                  |                      |              |
|      |             |                |                                   |                          |              |                                                  |                      |              |
|      |             |                |                                   |                          |              |                                                  |                      |              |

**Appetite scale:** 1 = refused all food, 2 = ate less than half, 3 = normal, 4 = ate eagerly and more than usual, 5 = ravenous, unusual hunger
**Energy scale:** 1 = would not rise/move, 2 = very subdued, 3 = normal for this pet, 4 = more active than typical, 5 = unusually high energy

---

### 8. Monitoring Notes for This Specific Pet
[Tailor this section to the individual pet. Examples below:]
- [For senior pets]: Prioritize monthly weight tracking and watch for cognitive dysfunction signs: nighttime restlessness, confusion about familiar spaces, changed sleep-wake cycle, loss of trained behaviors
- [For brachycephalic breeds]: Know your pet's personal baseline breathing -- louder snoring and some snuffling is typical, but any change toward more labored breathing, blue gums, or collapse is an emergency
- [For intact females]: Risk of pyometra (uterine infection) is significant in intact female dogs over 6, typically appearing 4-8 weeks after a heat cycle; watch for increased drinking, vaginal discharge, lethargy, and abdominal distension -- this is an emergency
- [For cats over 10]: At this age, hyperthyroidism and chronic kidney disease are common; note any weight loss combined with increased appetite and vocalization (hyperthyroid) or weight loss, decreased appetite, and increased water intake (CKD)
```

---

## Rules

1. **Never produce a diagnosis.** The outputs of this skill are observations, urgency classifications, and monitoring plans -- never a statement that a pet "has" a specific condition. The correct language is "this sign can indicate X, Y, or Z and should be evaluated by a veterinarian" rather than "your pet has X."

2. **Always include the emergency signs section in every output.** Even if the user only asked about one specific monitoring topic, include the complete list of emergency signs that require immediate veterinary care. An owner who learns about ear infections but does not know that open-mouth breathing in a cat is an emergency has an incomplete safety framework.

3. **Calibrate urgency language precisely** -- the three-tier system (Routine, Urgent, Same-Day/Emergency) must be used consistently and specifically. Calling everything "urgent" produces alarm fatigue; calling serious signs "routine" is dangerous. Each finding should have a clear, justified urgency level.

4. **Cats mask illness more effectively than dogs and require a lower threshold for urgent recommendations.** What would be a "watch for 48 hours" recommendation in a dog is often "call the vet within 24 hours" for a cat. This physiological difference must be reflected in every urgency decision. Anorexia in cats over 24 hours, hiding, or any open-mouth breathing should never be assigned a routine urgency level.

5. **Urinary straining in cats is always an emergency until a veterinarian rules out blockage.** Male cats can die within 24-48 hours of complete urethral obstruction. Even an owner who reports that "she probably just has a UTI" should be directed to same-day emergency veterinary evaluation if there is any possibility that the cat cannot produce urine. Never soften this urgency.

6. **Body weight must be quantified, not estimated.** An owner saying a cat "seems thinner" and an owner saying a cat has lost 1.2 lbs (from 10 lbs to 8.8 lbs, representing a 12% loss) are giving the veterinarian completely different clinical pictures. Always encourage the owner to weigh the pet and record it numerically. Teach the bathroom-scale method: weigh yourself holding the pet, then without; the difference is the pet's weight.

7. **Behavioral changes are not personality, they are data.** When an owner says their pet is "just being grumpy lately" or "hiding because there's a new baby," acknowledge the possible stressor but explicitly state that behavioral changes lasting over 24-48 hours warrant ruling out a physical cause. Pain is the most common reason a previously friendly pet becomes withdrawn or snappy.

8. **Never recommend home treatment, medication, or supplements.** This includes human medications such as Benadryl, ibuprofen (toxic to pets), or acetaminophen (toxic to cats); over-the-counter pet products; or dietary changes recommended as treatment. The role of this skill is to observe, document, and route to veterinary care -- not to manage illness at home.

9. **For pets with known health conditions, always defer monitoring parameters to the treating veterinarian.** A cat with known chronic kidney disease has different thresholds for "normal" water intake and urination frequency. A dog being treated for hypothyroidism has a different baseline energy level. Generic normal ranges may not apply -- note this explicitly and recommend the owner confirm monitoring targets with their veterinarian.

10. **Document the date and context of every abnormal finding.** When helping an owner report a concern to a veterinarian, the most useful information is always: what exactly was observed (not interpreted), when it was first noticed, whether it is getting better, worse, or staying the same, and any associated changes in behavior, appetite, or elimination. Train owners to record specific observations rather than general impressions before the veterinary call.

---

## Edge Cases

**Senior pets with multiple concurrent age-related changes:**
Senior pets (dogs 7+ years, giant breeds 5+, cats 10+) frequently present with several concurrent changes that can mask each other or be attributed incorrectly to "normal aging." Slowing down, drinking more, losing muscle, eating less, and sleeping more are each individually concerning -- together they represent a pattern requiring comprehensive blood work and a thorough examination. Advise twice-yearly veterinary visits with complete blood panels for all senior pets. For cats specifically: the triad of weight loss, increased appetite, and increased vocalization/restlessness in a cat over 10 is highly suggestive of hyperthyroidism, which is treatable and should not be attributed to old age. Hyperthyroidism can mask concurrent kidney disease, which can unmask after treatment -- this is a known clinical complexity the veterinarian will manage, but the owner should know to report the full triad of signs.

**Intact female dogs (unspayed) -- risk of pyometra:**
Pyometra (uterine infection) is a life-threatening condition that occurs most commonly in intact females within 4-8 weeks after a heat cycle. Owners of intact female dogs must be specifically advised to watch for this window of risk. Warning signs include increased water consumption and urination, vaginal discharge (may be absent in closed pyometra), lethargy, decreased appetite, and abdominal distension. Because closed pyometra (no discharge) can be difficult to recognize without imaging, any intact female dog over 5 years showing lethargy and increased thirst 4-8 weeks after a heat cycle should be seen same-day. Emergency spay is typically required; medical management has a lower success rate in severe cases.

**Brachycephalic breeds (Bulldogs, French Bulldogs, Pugs, Boston Terriers, Shih Tzus, Persian cats, Himalayan cats):**
These breeds have brachycephalic obstructive airway syndrome (BOAS) as a normal feature of their anatomy -- narrowed nostrils (stenotic nares), elongated soft palate, and occasionally tracheal hypoplasia. Their normal breathing is louder than other breeds and includes snoring, snuffling, and reverse sneezing. The monitoring challenge is recognizing the difference between this breed's baseline and an acute respiratory crisis. Red flags: any sudden change from the pet's personal baseline breathing, exercise intolerance progressing over days or weeks, cyanotic (blue or purple) gums, open-mouth breathing at rest, or collapse after mild exertion. These breeds are at high risk in warm weather -- they cannot cool themselves as effectively through panting, and heat stroke can develop rapidly. Never confine a brachycephalic pet in a warm car or leave in direct sun. For monitoring, establish and document this pet's personal baseline breathing sounds early in ownership.

**Post-discharge monitoring after veterinary hospitalization or surgery:**
A pet recently discharged from a veterinary hospital is not a subject for this skill's general monitoring protocols -- it requires specific post-discharge instructions from the treating veterinarian. The owner's role is to: follow discharge instructions exactly (including e-collar compliance to prevent incision licking, restricted activity levels, and medication administration timing); monitor the surgical or treatment site twice daily for redness, swelling, discharge, gap opening, or odor; record daily appetite and elimination; and call the treating clinic -- not a general resource -- with any concern. Guide the owner to call the discharging clinic within 24-48 hours if: the incision is opening, bright red blood is present (dried blood and minimal serosanguineous fluid are normal in the first 24-48 hours), the pet has not eaten in 24 hours post-surgery, fever is suspected (rectal temperature over 103°F in a post-operative pet warrants a call), or any prescribed medication appears to be causing adverse effects.

**Multi-cat households and litter box monitoring:**
Monitoring urination and defecation in a multi-cat home is significantly complicated when cats share a litter box -- the owner cannot determine which cat produced an abnormal stool or who is straining to urinate. If urinary blockage is suspected in any cat in the household, the safest approach is temporary separation of each cat into a room with its own litter box and fresh water until it can be confirmed which cat produces urine. Do not rely on observed litter box output in a shared-box household when a blockage is suspected -- the owner may be observing another cat's urine and incorrectly concluding the symptomatic cat is fine. Recommend: one litter box per cat plus one extra (the "N+1 rule") placed in separate locations; this naturally facilitates per-cat monitoring.

**Outdoor cats and feral or semi-feral cats:**
Outdoor cats present with a substantially different risk profile from indoor cats: fight wound abscesses (bite wounds that seal over and abscess within 3-5 days -- present as firm, hot, painful swellings, typically on the face, neck, front legs, or base of tail), trauma including vehicular injury, toxin and rodenticide exposure through prey ingestion, and significantly higher infectious disease exposure (FIV, FeLV, upper respiratory infections). For outdoor cats, add to the weekly check: a complete palpation of the skin surface feeling for painful swellings or puncture wounds (the fur can hide an abscess for days), check limbs for swelling or reluctance to bear weight, and review behavior for any sudden withdrawal after being outside (may indicate injury or pain from a fight). Because outdoor cats may not be observed eating every day, any 24-hour period without confirmed food intake warrants active investigation rather than passive monitoring.

**Owner with a new pet and no established baseline:**
A first-time owner or someone who has recently adopted an adult pet has no personal baseline for that individual animal. Advise establishing baseline as the first priority -- take the pet for a wellness examination within the first 2-4 weeks of ownership to get a professional baseline weight, condition score, and health status assessment. Until a baseline is established, the owner should record observations consistently but should also lower their threshold for "when to call the vet" since they may not be able to distinguish what is normal for that specific pet from what is a change. When uncertain, always recommend contacting the veterinarian -- "I'm new to this pet and I'm not sure if this is normal" is always a valid reason to call a veterinary clinic.

---

## Example

**User input:** "My cat Marigold is 11 years old, a female spayed domestic shorthair, about 9 pounds. She's an indoor cat and has no known health problems. She sees the vet once a year. I want to know how to check her health at home and when I should be worried."

**Output:**

```
## Pet Health Monitoring Plan: Marigold (11-year-old Spayed Female DSH)

---

### 1. Pet Profile
| Parameter              | Value                                               |
|------------------------|-----------------------------------------------------|
| Name                   | Marigold                                            |
| Species                | Cat                                                 |
| Breed                  | Domestic Shorthair (DSH)                           |
| Sex                    | Female, spayed                                      |
| Age                    | 11 years -- senior life stage                       |
| Current Weight         | 9 lbs (4.1 kg) -- establish as baseline today      |
| Body Condition Score   | Not yet assessed -- evaluate at next check          |
| Lifestyle              | Indoor only                                         |
| Known Health Conditions| None reported -- age-related conditions common at this stage (see monitoring notes) |
| Current Medications    | None                                                |
| Regular Veterinarian   | Not specified                                       |

**Important note:** At 11 years old, Marigold is firmly in the senior life stage for cats. Conditions such as hyperthyroidism, chronic kidney disease (CKD), hypertension, dental disease, arthritis, and cognitive dysfunction become increasingly common after age 10. None of these are inevitable, but all benefit from early detection. This monitoring plan is designed to catch early signs of age-related changes. Recommend discussing twice-yearly veterinary visits with blood work, urinalysis, and blood pressure measurement with Marigold's veterinarian.

---

### 2. Baseline Normal Values for Marigold
| Parameter               | Normal Range for Adult/Senior Cats          | Marigold's Baseline (fill in) |
|-------------------------|---------------------------------------------|-------------------------------|
| Resting heart rate      | 140-220 bpm                                 | ___ bpm (date: ___)           |
| Resting respiratory rate| 20-30 breaths/min (during sleep)            | ___ breaths/min (date: ___)   |
| Temperature             | 100.5-102.5°F                               | ___ °F (date: ___)            |
| Body weight             | Current: 9 lbs                              | 9 lbs (establish today)       |
| Gum color               | Moist salmon-pink                           | Confirm at first check        |
| Capillary refill time   | Under 2 seconds                             | ___ sec (date: ___)           |
| Skin turgor (hydration) | Returns within 1 second                     | Confirm at first check        |

**How to weigh Marigold at home:** Step on your bathroom scale holding her, record the number, then step on it alone. The difference is her weight. Weigh her at the same time of day (before feeding), on the same scale, every month. Record the result every time. A change of even 0.5 lbs (from 9 lbs to 8.5 lbs) represents a 5.5% weight loss -- clinically significant in a cat and worth reporting to your veterinarian.

**How to count her resting respiratory rate (RRS):** While Marigold is sleeping, count the number of times her chest rises in 30 seconds; multiply by 2. Do this now while she is healthy to establish her normal. If her RRS while sleeping ever consistently exceeds 30 breaths per minute, contact your veterinarian -- this can be an early sign of heart disease or fluid in the lungs, even before she shows any outward signs of distress.

---

### 3. Weekly Head-to-Tail Check Routine (~7 minutes)
Perform every week on a consistent day -- for example, every Sunday morning before feeding, when she is calm. Mark each item as ✓ (normal), ⚠ (watch this), or ✗ (contact vet).

**Head:**
- [ ] Eyes: clear corneas, no squinting, pupils equal in size, minimal clear discharge at inner corners only
- [ ] Ears: light pink inner surface, no dark or moist discharge, no odor, no head shaking, base of ear not painful when gently massaged
- [ ] Mouth: lift the lip and look; gums should be moist and salmon-pink; press gum and release -- color should return within 2 seconds; no foul odor; no drooling
- [ ] Teeth: check for visible brown-to-tan tartar, especially at the
